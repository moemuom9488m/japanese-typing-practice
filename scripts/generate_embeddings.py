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
        
    # 2. 載入 BGE 多語向量模型（支援中日文）
    model_name = os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3")
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
    feature_texts = []

    for item in quiz_data:
        ja_text = item.get("ja", [])
        if isinstance(ja_text, list):
            ja_text = " ".join(ja_text)

        zh_text = item.get("zh", "")
        feature_text = f"{ja_text} {zh_text}".strip()
        feature_texts.append(feature_text)

    embeddings = model.encode(
        feature_texts,
        batch_size=64,
        convert_to_tensor=False,
        normalize_embeddings=True,
        show_progress_bar=True,
    )

    for item, embedding in zip(quiz_data, embeddings):
        updated_item = item.copy()
        updated_item["embedding"] = embedding.tolist()
        processed_data.append(updated_item)

    # 5. 匯出至 public/quiz_with_embeddings.json（前端執行期載入路徑）
    output_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "quiz_with_embeddings.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(processed_data, f, ensure_ascii=False, indent=2)
        
    print(f"大功告成！已成功生成帶有向量的題庫：{output_path}")

if __name__ == "__main__":
    main()
