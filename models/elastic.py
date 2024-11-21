import json
from elasticsearch import Elasticsearch, helpers
import meilisearch
import os
import numpy as np
import sys
sys.path.append(r"./")
from models.utils import visualize, load_image_path
from dotenv import load_dotenv
meili_client = meilisearch.Client('https://ms-272b2370834f-14457.sgp.meilisearch.io', 'aa9546f6a083717de58de10abc9693d29367bbab')

class Elastic():
    def __init__(self):
        self.es = None
    
    def connect_elastic(self, check_server, host='localhost', port=9200, scheme='http'):
        """Kết nối tới Elasticsearch.
        
        Returns:
            Elasticsearch: Đối tượng Elasticsearch.
        """
        
        # print(check_server)
        if check_server == "server":
            self.es = Elasticsearch([{'host': host, 'port': port, 'scheme': scheme}])
        else:
            self.es = Elasticsearch([host])
    
    def create_index(self,index_name):
    
        if not self.es.indices.exists(index=index_name):
            self.es.indices.create(index=index_name)
            print(f"Đã tạo chỉ mục: {index_name}")
        else:
            print(f"Chỉ mục {index_name} đã tồn tại.")
            
    def upload_data_to_elastic(self, data_path, index_name= None, id_name=None):
        """
        Đọc file JSON và thêm các phần tử vào Elasticsearch sau khi map class_name.
        
        Args:
            es (Elasticsearch): Đối tượng Elasticsearch.
            data_path (str): Đường dẫn tới file JSON chứa dữ liệu.
            class_name_path (str): Đường dẫn tới file class_name.
            index_name (str): Tên index trong Elasticsearch.
        """
        
        # Đọc toàn bộ nội dung của file JSON chứa dữ liệu
        with open(data_path, "r", encoding="utf-8") as file:
            data = json.load(file)
        
        
        # Tạo danh sách các hành động để thêm vào Elasticsearch
        if id_name is None:
            actions = [
                {
                    "_index": index_name,
                    # "_id": item[id_name],  # Sử dụng "index" làm "_id"
                    "_source": item
                }
                for item in data
            ]
        else:
            actions = [
                {
                    "_index": index_name,
                    "_id": item[id_name],  # Sử dụng "index" làm "_id"
                    "_source": item
                }
                for item in data
            ]
        # Sử dụng helpers.bulk để thêm dữ liệu vào Elasticsearch
        helpers.bulk(self.es, actions)



    def Elastic_retrieval(self, text_query, k, index_name="ocr"):

        # query = {
        #     "query": {
        #         "bool": {
        #             "should": [
        #                 {
        #                     "multi_match": {
        #                         "query": text_query,
        #                         "fields": ["text"],
        #                         "type": "phrase",
        #                         "boost": 2  # Tăng cường độ ưu tiên cho kết quả chính xác
        #                     }
        #                 },
        #                 {
        #                     "multi_match": {
        #                         "query": text_query,
        #                         "fields": ["text"],
        #                         "fuzziness": "AUTO"
        #                     }
        #                 }
        #             ]
        #         }
        #     },
        #     "size": k
        # }

        # query1 = {
        #         "query": {
        #             "fuzzy": {
        #                 "value": {
        #                     "value": text_query,  # Từ khóa bạn muốn tìm (có thể có lỗi chính tả)
        #                     "fuzziness": "AUTO"  # Độ mờ để Elasticsearch tự điều chỉnh
        #                 }
        #             }
        #         }
        #     }
        # # Thực hiện tìm kiếm
        # res = self.es.search(index=index_name, body=query)
        
        # # print(res)
        # if index_name == "ocr":
        #     # res = self.es.search(index=index_name, body=query1)
        #     print(res)
        #     ids = [hit['_source']["id"] for hit in res['hits']['hits']]
        # elif index_name == "asr":
        #     # res = self.es.search(index=index_name, body=query)
        #     print(res)
        #     ids = []

        #     # Duyệt qua từng phần tử trong res['hits']['hits']
        #     for hit in res['hits']['hits']:
        #         start = hit['_source']['start']
        #         end = hit['_source']['end']
                
        #         # Tạo list con từ start đến end
        #         ids.append(list(range(start, end + 1)))

        # scores = [hit['_score'] for hit in res['hits']['hits']]
        # # print(scores)
        # scores = np.array(scores)
        # scr_result = 1 / (1 + np.exp(-scores))
        # scr_result = scr_result.tolist()
        

        # Lấy chỉ mục
        index = meili_client.index(index_name)

        # Truy xuất dữ liệu
        search_results = index.search(text_query, {'limit': k})['hits']
        # print(search_results)
        
        id_list = [item['id'] for item in search_results]
        
        score = list(range(k, 0, -1))
        return id_list, score
        
        # return ids, scr_result
    
    def check_index(self):
        """Hàm kiểm tra các index trong Elasticsearch và độ dài của mỗi index."""
        # Lấy danh sách tất cả các chỉ mục
        indices = self.es.indices.get_alias(index="*")
        for index_name in indices:
            # Lấy thông tin về số lượng tài liệu trong mỗi chỉ mục
            count = self.es.count(index=index_name)['count']
            print(f"\nChỉ mục '{index_name}' có {count} tài liệu.")
    
    def delete_index(self, index_name):
        # Kiểm tra xem index có tồn tại không
        if self.es.indices.exists(index=index_name):
            # Xóa index
            self.es.indices.delete(index=index_name)
            print(f"Index '{index_name}' đã được xóa.")
        else:
            print(f"Index '{index_name}' không tồn tại.")
            
    def upload_json_to_meilisearch(self, index_name, json_file_path, batch_size=20000):
        # Đọc toàn bộ dữ liệu từ file JSON
        with open(json_file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        # Tính số lượng batch
        total_docs = len(data)
        num_batches = (total_docs // batch_size) + (1 if total_docs % batch_size != 0 else 0)

        index = meili_client.index(index_name)

        # Chia dữ liệu thành các batch và tải lên
        for batch_num in range(num_batches):
            start_index = batch_num * batch_size
            end_index = start_index + batch_size
            batch_data = data[start_index:end_index]

            try:
                response = index.add_documents(batch_data)
                print(f"Batch {batch_num + 1}/{num_batches} uploaded successfully: {response}")
            except meilisearch.errors.MeilisearchApiError as e:
                print(f"Lỗi API khi tải lên batch {batch_num + 1}: {e}")
            except Exception as e:
                print(f"Lỗi khác khi tải lên batch {batch_num + 1}: {e}")
    
    
if __name__ == "__main__":
    
    load_dotenv()
    CHECK_SERVER = os.getenv("CHECK_SERVER")
    HOST_ELASTIC = os.getenv("HOST_ELASTIC")
    PORT_ELASTIC = int(os.getenv("PORT_ELASTIC"))
    
    es = Elastic()
    # es.connect_elastic(check_server=CHECK_SERVER, host=HOST_ELASTIC, port=PORT_ELASTIC)
    # print(es.check_index())
    
    ocr_check = True
    
    
    # es.upload_json_to_meilisearch("ocr", r"/data/vit/AIC2024/DATA/ocr/merged.json")
    # es.delete_index("ocr")
    # es.create_index("ocr")
    # data_path = r"/home/vit/AIC2024/DATA/ocr/final_ocr.json"
    # es.upload_data_to_elastic(data_path, index_name= "ocr", id_name="id")
    
    print(es.Elastic_retrieval("nga và trung quốc",5,"ocr"))
    # if ocr_check:
    #     # OCR
    #     ocr_path = r"/home/vit/AIC2024/DATA/ocr/final_ocr.json"
    #     index_name = "ocr"
        
    #     # id_name = "id"
    #     # es.upload_data_to_elastic(ocr_path, "ocr", id_name=id_name)
        
    #     K = 20
    #     text_query = "đài truyền hình"
    #     ids, scr = es.Elastic_retrieval(text_query, K, index_name)
        
    # else:
    #     # ASR
    #     asr_path = r"/home/vit/AIC2024/DATA/asr/final_asr.json"

    #     index_name = "asr"
    #     # es.upload_data_to_elastic(asr_path, index_name)
        
    #     K = 20
    #     text_query = "cầu thủ mang áo số 7"
    #     ids,scr = es.Elastic_retrieval(text_query, K, index_name)
        
        
    
    # print(ids,scr)
    # # VISUALIZE RESULT
    # image_path_dict = r"D:\THANHSTAR\Projetcs\AIC\DATA\image_path.json"
    # image_path = load_image_path(image_path_dict)
    # visualize(image_path, ids, K)

    
