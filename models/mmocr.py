from mmocr.apis import MMOCRInferencer
from PIL import Image
import matplotlib.pyplot as plt
import os
import json
import torch

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(device)

ocr = MMOCRInferencer(det='DBNet', device = "cuda")

# predict = ocr(r'/root/AIC2024/DATA/keyframes/L01/L01_V019/18771.jpg')
# print()
# print("PREDICT POLYGONS" , predict["predictions"][0]["det_polygons"])

# img_path = r"C:\Users\admin\Projects\AIC\DATA\Keyframes\Keyframes_L01\L01_V001\0010.jpg"
# image = Image.open(img_path)
# cropped_image = image.crop((x_min, y_min, x_max, y_max))


folder_path = r'/data/vit/AIC2024/static/images'
save_path = r'/data/vit/AIC2024/DATA/ocr/bboxs'
index = 0
# print(len(os.listdir(folder_path)))
# print(os.listdir(folder_path)[:1])

    # os.listdir(folder_path) = [Keyframes_L01,Keyframes_L02,...]
L_folder = os.listdir(folder_path)
L_folder.sort()
print(L_folder)
for folder_name in L_folder[26:]:
    
    folder_dir = os.path.join(folder_path, folder_name)

    # os.listdir(folder_dir) = [L01_V001,L01_V002,...]
    V_folder = os.listdir(folder_dir)
    V_folder.sort()
    for sub_folder_name in V_folder:
        text_dict = {}
        sub_folder_dir = os.path.join(folder_dir, sub_folder_name)
        # sub_folder_dir = "C:\Users\admin\Projects\AIC\DATA\Keyframes\Keyframe_L01\L01_V001"

        sub_folder_path = os.path.join(save_path,"text_ocr", folder_name)
        print("save_path: ", sub_folder_path)
        os.makedirs(sub_folder_path, exist_ok=True)  # Tạo thư mục nếu chưa tồn tại
        
        file_names = os.listdir(sub_folder_dir)
        file_names.sort()
        for file_name in file_names:
            file_path = os.path.join(sub_folder_dir, file_name)
            print(index,".processing:", file_path)

            predict = ocr(file_path, show=False, print_result=False)

            coordinates = predict["predictions"][0]["det_polygons"]
            result = []
            for coordinate in coordinates:
                x = coordinate[::2]
                y = coordinate[1::2]
                x_min = min(x)
                x_max = max(x)
                y_min = min(y)
                y_max = max(y)
                result.append([x_min, y_min, x_max, y_max])
            text_dict[file_path] = result
            index += 1

        # print(text_dict)
        # Lưu kết quả vào file JSON
        json_path = os.path.join(sub_folder_path, f"{sub_folder_name}.json")
        print("save as:", json_path)
        with open(json_path, "w") as file:
            json.dump(text_dict, file)