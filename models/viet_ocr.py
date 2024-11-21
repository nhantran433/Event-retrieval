import torch
import matplotlib.pyplot as plt
from PIL import Image
from vietocr.tool.predictor import Predictor
from vietocr.tool.config import Cfg
import os
import json


config = Cfg.load_config_from_name('vgg_seq2seq')
# config['weights'] = './weights/transformerocr.pth'
config['cnn']['pretrained']=False

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(device)

config['device'] = device
detector = Predictor(config)


coordinates = r"/data/vit/AIC2024/DATA/ocr/final_bboxs"
save_path = r"/data/vit/AIC2024/DATA/ocr/text1"

index = 173050
# print(index)

L_folders = os.listdir(coordinates)
L_folders.sort()
for L_folders in L_folders[12:]:
    
    L_path = os.path.join(coordinates, L_folders)
    L_path_save = os.path.join(save_path, L_folders)
    
    json_files = os.listdir(L_path)
    json_files.sort()
    for json_file in json_files:
        json_path = os.path.join(L_path, json_file)
        json_path_save = os.path.join(L_path_save, json_file)
        if not os.path.exists(os.path.dirname(json_path_save)):
            os.makedirs(os.path.dirname(json_path_save))
        
        results = []  # This will store all the objects

        # Reading the original JSON file
        with open(json_path, 'r') as f:
            data = json.load(f)

        # Iterating through the samples
        for sample in data:
            new_dict = {}
            texts = []
            path = sample
            coors = data[path]
            new_dict["path"] = path
            new_dict["id"] = index
            
            if len(coors) == 0:
                new_dict["value"] = " ".join(texts)
            else:
                img = Image.open(path)
                for coor in coors:
                    crop_img = img.crop(coor)
                    s = detector.predict(crop_img)
                    texts.append(s)
                new_dict["value"] = texts
            
            results.append(new_dict)  # Add the object to the list
            
            index += 1
            if index % 10 == 0:
                print(f"done: {path}")

        # Writing all results to a JSON file
        with open(json_path_save, 'w') as f:
            json.dump(results, f, ensure_ascii=False, indent=4) 
            
            

print("done")