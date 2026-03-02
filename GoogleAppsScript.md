# Google 試算表自動匯入設定

管理頁面送出開團資料時，可選擇「送出並匯入 Google 試算表」。**不會從試算表讀取任何 ID**，僅將表單資料寫入試算表。

## 步驟一：建立試算表

1. 前往 [Google 試算表](https://sheets.google.com)，建立新試算表。
2. 在第一列（標題列）輸入以下欄位（可依需求微調順序）：

   | A | B | C | D | E | F | G | H | I | J |
   |---|---|---|---|---|---|---|---|---|---|
   | 商品名稱 | 圖片網址 | 標籤 | 開團日期 | 結團日期 | 登記預購人數 | 狀態 | 進度(JSON) | 倒數目標時間 | 建立時間 |

3. 記下試算表的 **試算表 ID**（網址中 `/d/` 與 `/edit` 之間的那串字元）。

## 步驟二：新增 Google Apps Script

1. 在試算表選單點 **擴充功能** → **Apps Script**。
2. 刪除預設程式碼，貼上以下程式（或專案中的 `Code.gs` 內容）。
3. 將 `SPREADSHEET_ID` 改為你的試算表 ID。
4. 儲存專案（Ctrl+S），並為專案命名，例如「開團匯入」。

```javascript
const SPREADSHEET_ID = '你的試算表ID';

function doPost(e) {
  try {
    const params = e.postData ? JSON.parse(e.postData.contents) : {};
    if (params.action === 'append' && params.row) {
      const row = params.row;
      const progressStr = JSON.stringify(row.progress || []);
      const values = [
        row.title || '',
        row.imageUrl || '',
        row.badge || '',
        row.startDate || '',
        row.endDate || '',
        (row.registeredCount !== undefined && row.registeredCount !== null) ? String(row.registeredCount) : '',
        row.status || '',
        progressStr,
        row.countdownTo || '',
        new Date().toISOString()
      ];
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
      sheet.appendRow(values);
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'invalid action' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err.message) })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // 選用：讓展示頁從試算表讀取資料（仍不依賴試算表 ID 欄位，僅讀取內容）
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    const headers = data[0];
    const rows = data.slice(1);
    const list = rows.map(function (row, i) {
      const id = 'row-' + (i + 2);
      let progress = [];
      try {
        progress = JSON.parse(row[7] || '[]');
      } catch (_) {}
      const rc = row[5];
      const registeredCount = (rc === '' || rc === undefined || rc === null) ? null : (parseInt(rc, 10) || 0);
      return {
        id: id,
        title: row[0],
        imageUrl: row[1] || null,
        badge: row[2] || 'hot',
        startDate: row[3],
        endDate: row[4],
        registeredCount: registeredCount,
        status: row[6] || 'ongoing',
        progress: progress,
        countdownTo: row[8] || null
      };
    });
    return ContentService.createTextOutput(JSON.stringify(list)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## 步驟三：部署為網路應用程式

1. 在 Apps Script 編輯器點 **部署** → **新增部署**。
2. 類型選 **網路應用程式**。
3. 說明可填「開團匯入」。
4. **執行身分**：選擇「我」。
5. **具有存取權的使用者**：選「任何人」（若僅自己用可選「僅限自己」）。
6. 點 **部署**，完成後會顯示 **網路應用程式 URL**。
7. 複製該 URL，貼到「開團管理後台」頁面下方的 **Apps Script 網址** 欄位。

## 注意事項

- **不會從 Google 試算表讀取 ID**：每一筆開團資料的 ID 在管理頁面送出時於本機產生，寫入試算表時僅是將內容匯入，試算表不需要也不使用 ID 欄位。
- 若透過 `file://` 開啟網頁，瀏覽器可能阻擋對 Google 的請求；建議用本機或線上的網頁伺服器開啟 `index.html` / `admin.html`。
- 展示頁預設以「本機儲存」的資料顯示；若你部署了上述 `doGet` 並在展示頁設定 `GOOGLE_SCRIPT_URL`（與部署網址相同），即可改為從試算表讀取列表（仍不依賴試算表 ID）。
