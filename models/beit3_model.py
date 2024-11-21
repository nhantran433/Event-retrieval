import numpy as np
import torch
from PIL import Image
import os
import faiss
import faiss.contrib.torch_utils
from tqdm import tqdm
# import json
from transformers import XLMRobertaTokenizer
# import torch.nn as nn
# import torch.nn.functional as F
from torchvision import transforms
from torchvision.transforms.functional import InterpolationMode

import sys
sys.path.append(r"./")
from models.utils import translate, visualize, load_image_path, load_features

sys.path.append(r"./unilm/beit3/")
from unilm.beit3.modeling_finetune import beit3_base_patch16_224_retrieval



class BEIT3:
    def __init__(self):
        self.beit3_model = None
        self.tokenizer = None
        self.faetures = None
        self.faiss_index = None

    def load_model(self, device, model_weight_path, tokenizer_path):
        self.beit3_model = beit3_base_patch16_224_retrieval(pretrained=True)
        checkpoint = torch.load(model_weight_path, weights_only=True)
        self.beit3_model.load_state_dict(checkpoint['model'])

        self.tokenizer = XLMRobertaTokenizer(tokenizer_path)
        self.beit3_model.to(device)
        self.beit3_model.eval()

    def load_feature(self, feature_folder_path, distance_metric="cosine", device="cpu"):
        # array_list = []

        # for file_name in os.listdir(feature_folder_path):
        #     if file_name.endswith(".npy"):
        #         file_path = os.path.join(feature_folder_path, file_name)
        #         array = np.load(file_path)
        #         array_list.append(array)

        # self.features = np.concatenate(array_list, axis=0)  # (87306, 768)
        

        self.features = load_features(feature_folder_path)
        print(f"beit3_faetures shape: {self.features.shape}")
        
        if distance_metric == "cosine":
            self.faiss_index = faiss.IndexFlatIP(self.features.shape[1])
        elif distance_metric == "L2":
            self.faiss_index = faiss.IndexFlatL2(self.features.shape[1])
        
        if device == "cuda":
            print("num gpus:",faiss.get_num_gpus())
            # Số lượng GPU bạn muốn sử dụng, ví dụ: [0] là GPU đầu tiên
            res = faiss.StandardGpuResources()  # Tạo tài nguyên GPU
            self.faiss_index = faiss.index_cpu_to_gpu(res, 0, self.faiss_index)
        
        # Thêm các vector vào index.
        self.faiss_index.add(self.features)
        
        

    # def create_faiss_index(self, distance_metric="cosine", feature_folder_path = None):

    #     # print(f"vectors shape: {self.faetures.shape[1]}")
    #     features = self.load_feature(feature_folder_path)
    #     # Khởi tạo index faiss.
    #     if distance_metric == "cosine":
    #         self.faiss_index = faiss.IndexFlatIP(features.shape[1])
    #     elif distance_metric == "L2":
    #         self.faiss_index = faiss.IndexFlatL2(features.shape[1])
    #     # Thêm các vector vào index.
    #     self.faiss_index.add(features)

    def find_k_nearest_neighbors(self, vector_query, k):
        if self.faiss_index is None:
            raise ValueError("Features is empty. Please load features first.")
        # Tính khoảng cách giữa input_vector và các vector trong index.
        distances, indices = self.faiss_index.search(
            vector_query.reshape(1, -1), k)
        return distances[0].tolist(), indices[0].tolist()

    def image_extract(self, image, device, image_size=224):
        # raw_image = Image.open(image_path).convert('RGB')
        raw_image = image.convert('RGB')
        transform = transforms.Compose([
            transforms.Resize((image_size, image_size),
                              interpolation=InterpolationMode.BICUBIC),
            transforms.ToTensor(),
        ])
        image_tensor = transform(raw_image).unsqueeze(0).to(device)

        with torch.no_grad():
            vision_cls, _ = self.beit3_model(image=image_tensor, only_infer=True)

        return vision_cls

    def batch_image_extract(self, imgpaths_list, device, image_size=224):
        images_list = []
        for img_path in imgpaths_list:
            raw_image = Image.open(img_path).convert('RGB')
            transform = transforms.Compose([
                transforms.Resize((image_size, image_size),
                                interpolation=InterpolationMode.BICUBIC),
                transforms.ToTensor(),
            ])
            image_tensor = transform(raw_image).unsqueeze(0).to(device)
            images_list.append(image_tensor)

        images_tensor = torch.cat(images_list, dim=0)
        with torch.no_grad():
            vision_cls, _ = self.beit3_model(image=images_tensor, only_infer=True)

        # vision_cls = vision_cls.to("cpu")
        # torch.cuda.empty_cache()
        return vision_cls

    def create_db(self, img_folder_path, save_folder_path, device, batch_size=256):


        # Create the save folder if it doesn't exist
        if not os.path.exists(save_folder_path):
            os.makedirs(save_folder_path)

        save_name = img_folder_path.split("/")[-1]
        # print(save_name)
        # return
        # Get all image file paths in the folder
        imgpaths_list = [os.path.join(img_folder_path, img_file) for img_file in os.listdir(img_folder_path) if img_file.endswith(('.png', '.jpg', '.jpeg'))]
        
        imgpaths_list.sort()
        # Create an empty list to store features
        db_features = []
        
        # Iterate over image paths in batches
        for i in tqdm(range(0, len(imgpaths_list), batch_size), desc="Extracting features from images"):
            # Get the current batch of image paths
            batch_imgpaths = imgpaths_list[i:i + batch_size]
            
            # Call batch_image_extract to get the features of the image batch
            vision_cls = self.batch_image_extract(batch_imgpaths, device)
            
            # Convert the extracted features to a CPU tensor and store it
            db_features.append(vision_cls.cpu())

        # Concatenate all the features into one tensor
        db_features_tensor = torch.cat(db_features, dim=0)
        
        # Convert the PyTorch tensor to a NumPy array
        db_features_numpy = db_features_tensor.numpy()
        
        print(db_features_numpy.shape)
        
        # Save the NumPy array as a .npy file
        db_save_path = os.path.join(save_folder_path, f'{save_name}.npy')
        np.save(db_save_path, db_features_numpy)
        
        print(f"Database created and saved to {db_save_path}")
        return db_save_path

        
    def Image_retrieval(self, image, k, device):
        image_features_query = self.image_extract(image, device)
        print(f"image_features_query: {image_features_query.shape}")
        distances, ids_result = self.find_k_nearest_neighbors(image_features_query.cpu().numpy(), k)

        return ids_result, distances

    def text_extract(self, text_query, device):
        text_tensor = self.tokenizer(text_query, return_tensors='pt')["input_ids"]
        print(f"text_tensor: {text_tensor.shape}")
        text_tensor = text_tensor.to(device)
        with torch.no_grad():
            _, text_cls = self.beit3_model(text_description=text_tensor, only_infer=True)
        return text_cls
    
    def Text_retrieval(self, text_query, k, device):
        text_features_query = self.text_extract(text_query, device)
        print(f"text_features_query: {text_features_query.shape}")
        distances, ids_result = self.find_k_nearest_neighbors(text_features_query.cpu().numpy(), k)

        return ids_result, distances



if __name__ == "__main__":

    # DEFINE PARAMETER
    # feature_folder_path = r"/home/vit/AIC2024/DATA/features/beit3_features"
    # image_path_dict = r"/home/vit/AIC2024/DATA/image_path.json"
    # device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    # print(device)
    # model_weight_path = r"/home/vit/AIC2024/models/weights/beit3_base_itc_patch16_224.pth"
    # # model_weight_path = r"C:\Users\admin\Downloads\beit3_large_itc_patch16_224_flickr.pth"
    # tokenizer_path = r"/home/vit/AIC2024/models/weights/beit3.spm"

    # beit3 = BEIT3()
    # beit3.load_feature(feature_folder_path)
    # beit3.load_model(device, model_weight_path, tokenizer_path)


    # # text_query = "a woman feedding dogs in the park"
    # text_query = "a woman"
    # # text_query = "bình gốm"
    # # text_query = "a dolphin playing with a pink ball"
    # img_query_path = r"/home/vit/AIC2024/static/images/L01/L01_V002/00458.jpg"

    # K = 10


    
    
    
    # TEST_TEXT = True
    # if TEST_TEXT:
    #     print()
    #     print("Text Query")
    #     text_query = translate(text_query)
    #     print("text translated: ", text_query)
    #     ids_result, distances = beit3.Text_retrieval(text_query, K, device)
    # else:
    #     print()
    #     print("Image Query")
    #     ids_result, distances = beit3.Image_retrieval(img_query_path, K, device)
    # print(ids_result)

    # image_path = load_image_path(image_path_dict)
    # visualize(image_path, ids_result, K)
    
    
    beit3 = BEIT3()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model_weight_path = r"/data/vit/AIC2024/models/weights/beit3_base_itc_patch16_224.pth"
    tokenizer_path = r"/data/vit/AIC2024/models/weights/beit3.spm"
    beit3.load_model(device, model_weight_path, tokenizer_path)
    key_frame_path = r"/data/vit/AIC2024/DATA/keyframes"
    save_path = r"/data/vit/AIC2024/DATA/features/beit3_feature2"
    
    L_folder = os.listdir(key_frame_path)
    L_folder.sort()
    # print("L: ",L_folder)
    
    for folder_name in L_folder[3:]:
        
        save_dir = os.path.join(save_path, folder_name)
        if not os.path.exists(save_dir):
            os.makedirs(save_dir)
        # print(save_dir)
        L_folders_path = os.path.join(key_frame_path, folder_name)
        # print(L_folders_path)
        
        

        # os.listdir(folder_dir) = [L01_V001,L01_V002,...]
        V_folders = os.listdir(L_folders_path)
        V_folders.sort()
        # print(V_folders)
        # print(V_folder_map)
        
        # exit()
        for v_folder in V_folders:
            V_path = os.path.join(L_folders_path, v_folder)
            # print(V_path)
            beit3.create_db(V_path, save_dir, device)

        
    
    
    
    
