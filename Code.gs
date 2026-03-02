// 複製此檔案內容到 Google Apps Script 編輯器，並將 SPREADSHEET_ID 改為你的試算表 ID
// 詳見 GoogleAppsScript.md

const SPREADSHEET_ID = '你的試算表ID';

function doPost(e) {
  try {
    var raw = null;
    if (e.parameter && e.parameter.payload) {
      raw = e.parameter.payload;
    } else if (e.postData && e.postData.contents) {
      raw = e.postData.contents;
    }
    var params = raw ? JSON.parse(raw) : {};
    if (params.action === 'append' && params.row) {
      var row = params.row;
      var progressStr = JSON.stringify(row.progress || []);
      var values = [
        row.title || '',
        row.imageUrl || '',
        row.badge || '',
        row.startDate || '',
        row.endDate || '',
        row.registeredCount !== undefined && row.registeredCount !== null ? String(row.registeredCount) : '',
        row.status || '',
        progressStr,
        row.countdownTo || '',
        new Date().toISOString()
      ];
      var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
      sheet.appendRow(values);
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'invalid action' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err.message) })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    var headers = data[0];
    var rows = data.slice(1);
    var list = rows.map(function (row, i) {
      var id = 'row-' + (i + 2);
      var progress = [];
      try {
        progress = JSON.parse(row[7] || '[]');
      } catch (e) {}
      var rc = row[5];
      var registeredCount = (rc === '' || rc === undefined || rc === null) ? null : (parseInt(rc, 10) || 0);
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
