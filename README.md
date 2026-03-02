# 開團進度追蹤展示網頁

顧客可在此看到**即將開團**、**正在開團**、**已結團**的商品；管理員在後台新增開團資料後可選擇自動匯入 Google 試算表（不從試算表讀取 ID）。

## 使用方式

1. **展示頁（顧客）**：用瀏覽器開啟 `index.html`。
2. **管理後台**：開啟 `admin.html`，填寫開團資料後點「送出並匯入 Google 試算表」或「僅儲存至本機」。

## 功能說明

- **品牌 Logo**：置中、玻璃樣式，滑鼠移上去有光澤動畫。
- **三種背景主題**：晨曦、星空、森林，可切換並會記住選擇。
- **分類按鈕**：即將開團 / 正在開團 / 已結團，點選後顯示對應商品卡。
- **商品卡**：左上角標籤（新品 / 熱銷 / 推薦）、開團/結團日期、進度節點、倒數時間；滑鼠移上會有閃亮效果。
- **管理頁**：表單送出後可寫入 Google 試算表，ID 由本機產生，不從試算表讀取。

## 自訂品牌名稱

編輯 `index.html`，將 `<span class="logo-text">團購品牌</span>` 裡的「團購品牌」改成你的品牌名稱即可。

## Google 試算表匯入

詳見 **GoogleAppsScript.md**。將 `Code.gs` 複製到 Google Apps Script，設定試算表 ID 並部署為「網路應用程式」，再把產生的網址貼到管理頁的「Apps Script 網址」即可。

## 檔案結構

- `index.html`、`css/styles.css`、`js/app.js`：展示頁
- `admin.html`、`css/admin.css`、`js/admin.js`：管理頁
- `Code.gs`：供複製到 Apps Script 的程式碼
- `GoogleAppsScript.md`：試算表與部署步驟說明

## 部署到 GitHub / GitHub Pages

1. 確認 repo 裡有 **css** 和 **js** 兩個資料夾，且裡面有檔案：
   - `css/styles.css`、`css/admin.css`
   - `js/app.js`、`js/admin.js`
2. HTML 已加上 `<base href="./" />`，在 GitHub Pages 子路徑下會正確載入 CSS 與 JS。
3. 請用 **GitHub Pages 網址**開啟（例如 `https://你的帳號.github.io/你的repo名稱/`），不要用 `raw.githubusercontent.com` 或直接點開單一 HTML 檔。
