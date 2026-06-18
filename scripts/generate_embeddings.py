import json
import os
import torch
from sentence_transformers import SentenceTransformer

def main():
    # 1. 偵測裝置
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"目前使用的運算裝置: {device.upper()}")
    if device == "cuda":
        print(f"顯示卡型號: {torch.cuda.get_device_name(0)}")
        
    # 2. 載入與前端對應的模型
    model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    print(f"正在載入模型 ({model_name})...")
    model = SentenceTransformer(model_name, device=device)
    
    # 3. 讀取 raw_data.json
    raw_data_path = os.path.join(os.path.dirname(__file__), "raw_data.json")
    try:
        with open(raw_data_path, "r", encoding="utf-8") as f:
            quiz_data = json.load(f)
    except FileNotFoundError:
        print(f"找不到 {raw_data_path}！請先執行 node scripts/export_json.js")
        return

    print(f"成功載入題庫，共計 {len(quiz_data)} 筆資料。開始計算向量...")
    
    # 4. 批次計算
    processed_data = []
    
    for item in quiz_data:
        # 將日文 (ja 陣列通常只有一個元素，或取字串) 與中文 (zh) 組合
        ja_text = item.get("ja", [])
        if isinstance(ja_text, list):
            ja_text = " ".join(ja_text)
        
        zh_text = item.get("zh", "")
        
        # 組合成特徵字串
        feature_text = f"{ja_text} {zh_text}".strip()
        
        # 計算向量
        embedding = model.encode(feature_text, convert_to_tensor=False).tolist()
        
        updated_item = item.copy()
        updated_item["embedding"] = embedding
        processed_data.append(updated_item)
        
    # 5. 匯出至 src/data/quiz_with_embeddings.json
    output_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src", "data", "quiz_with_embeddings.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(processed_data, f, ensure_ascii=False, indent=2)
        
    print(f"大功告成！已成功生成帶有向量的題庫：{output_path}")

if __name__ == "__main__":
    main()
