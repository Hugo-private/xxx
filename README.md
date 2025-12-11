# 個人作品集網站

這是一個使用現代化技術棧建立的個人作品集網站。

## 技術棧

- **React 18** - UI 框架
- **TypeScript** - 型別安全
- **Vite** - 快速建置工具
- **Tailwind CSS** - 實用優先的 CSS 框架
- **Shadcn UI** - 高品質的 React 組件庫

## 開始使用

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

專案將在 `http://localhost:5173` 啟動

### 建置生產版本

```bash
npm run build
```

建置後的檔案將在 `dist` 目錄中

### 預覽生產版本

```bash
npm run preview
```

## 部署到 Netlify

1. 將專案推送到 GitHub
2. 在 Netlify 中連接你的 GitHub 儲存庫
3. Netlify 會自動偵測 `netlify.toml` 設定檔
4. 建置命令：`npm run build`
5. 發布目錄：`dist`

專案已包含 `netlify.toml` 設定檔，包含必要的建置和路由設定。

## 專案結構

```
.
├── public/          # 靜態資源
├── src/
│   ├── components/ # React 組件
│   │   └── ui/     # Shadcn UI 組件
│   ├── lib/        # 工具函數
│   ├── App.tsx     # 主應用程式
│   ├── main.tsx    # 入口點
│   └── index.css   # 全域樣式
├── netlify.toml    # Netlify 部署設定
└── package.json    # 專案依賴
```

## 使用 Shadcn UI

Shadcn UI 組件位於 `src/components/ui/` 目錄中。你可以：

1. 直接編輯組件檔案來自訂樣式
2. 參考 [Shadcn UI 文檔](https://ui.shadcn.com/) 來新增更多組件

## 自訂

- 編輯 `src/App.tsx` 來建立你的作品集內容
- 修改 `tailwind.config.js` 來自訂主題
- 在 `src/index.css` 中調整 CSS 變數來改變顏色主題

