# 🇯🇵 日文課打字練習系統 - 運作與維護手冊

本專案已全面 Docker 化，你可以輕鬆地透過 Docker 進行開發與部署。為了方便管理，我們推薦使用專用的 Jupyter Notebook (`.ipynb`) 來作為控制台。

## 🚀 快速啟動 (使用 Jupyter Notebook)

我們提供了一個 `SystemControl.ipynb` 檔案。你只需要在 VS Code 中打開它，並點擊每個儲存格左側的「播放」按鈕即可執行對應操作：

1. **啟動系統**：自動建置並開啟容器。
2. **系統維護**：安裝新的 npm 套件或查看日誌。
3. **關閉系統**：安全停止並移除容器。

---

## 🛠️ Docker 指令說明 (手動模式)

如果你偏好使用終端機 (Terminal)，請參考以下指令：

### 1. 啟動服務 (Start)
```powershell
docker compose up -d --build
```
*   `-d`: 於背景執行。
*   `--build`: 強制重新建置（當你修改了 `Dockerfile` 或 `package.json` 時必用）。
*   啟動後請訪問：`http://localhost:5173`

### 2. 系統維護 (Maintenance)
*   **查看即時日誌**：
    ```powershell
    docker compose logs -f
    ```
*   **同步 npm 套件到本地 (供編輯器補全用)**：
    ```powershell
    docker run --rm -v ${PWD}:/app -w /app node:20 npm install
    ```

### 3. 關閉服務 (Stop)
```powershell
docker compose down
```

### 4. 設定外部 IP / 區域網路存取
目前的設定已預設支援區域網路存取 (`--host`)。
*   **確認你的 IP**：在 CMD 輸入 `ipconfig` 找到你的 IPv4 地址（例如 `192.168.1.10`）。
*   **外部存取**：同網域的其他裝置可透過 `http://你的IP:5173` 進行連線練習。

---

## 📂 目錄結構
*   `src/App.jsx`: 核心 React 邏輯與介面。
*   `src/data.js`: 題目資料庫與課程設定。
*   `Dockerfile` & `docker-compose.yml`: 環境配置。
*   `backup/`: 存放舊版的單體備份檔案。

---

## ⚠️ 注意事項
*   修改 `src/data.js` 後，Vite 會自動熱更新，無需重新啟動 Docker。
*   若修改了 `package.json` 的依賴項，請執行 `docker compose up --build` 重新編譯鏡像。

---

## ⚖️ 免責聲明 (Disclaimer)
> [!NOTE]
> The vocabulary and sentence data used in this project are for educational and personal practice purposes only. All rights to the original content belong to the publisher of **"就是要學日本語 初級（上）"**.
