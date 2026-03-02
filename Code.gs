// 複製此檔案內容到 Google Apps Script 編輯器，並將 SPREADSHEET_ID 改為你的試算表 ID
// 詳見 GoogleAppsScript.md

const SPREADSHEET_ID = "17HG6DJAApZu9HqQRq7NtZTloOGZanKA96o8g2K_hIZ4";

function doPost(e) {
  try {
    if (!SPREADSHEET_ID || SPREADSHEET_ID === "17HG6DJAApZu9HqQRq7NtZTloOGZanKA96o8g2K_hIZ4") {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: '請在程式碼中設定 SPREADSHEET_ID 為你的試算表 ID' })).setMimeType(ContentService.MimeType.JSON);
    }
    var p = e.parameter || {};
    if (String(p.action) !== 'append') {
      var raw = (p.payload) ? p.payload : (e.postData && e.postData.contents) ? e.postData.contents : null;
      if (raw) {
        var params = JSON.parse(raw);
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
          var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
          sheet.appendRow(values);
          return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'invalid action or no data' })).setMimeType(ContentService.MimeType.JSON);
    }
    var progressStr = p.progress || '[]';
    var values = [
      p.title || '',
      p.imageUrl || '',
      p.badge || '',
      p.startDate || '',
      p.endDate || '',
      p.registeredCount || '',
      p.status || '',
      progressStr,
      p.countdownTo || '',
      new Date().toISOString()
    ];
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheets()[0];
    sheet.appendRow(values);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err.message) })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var ee = e || {};
    var params = ee.parameter || {};
    if (params.action === 'test') {
      if (!SPREADSHEET_ID || SPREADSHEET_ID === '你的試算表ID') {
        return ContentService.createTextOutput(JSON.stringify({ ok: false, error: '請設定 SPREADSHEET_ID' })).setMimeType(ContentService.MimeType.JSON);
      }
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var sheet = ss.getSheets()[0];
      var rows = sheet.getLastRow() || 0;
      return ContentService.createTextOutput(JSON.stringify({ ok: true, message: 'Apps Script 連線正常', sheetName: sheet.getName(), rows: rows })).setMimeType(ContentService.MimeType.JSON);
    }
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
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


