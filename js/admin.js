(function () {
  'use strict';

  const STORAGE_KEY = 'groupBuyData';
  const SCRIPT_URL_KEY = 'googleScriptUrl'; // 與展示頁共用，供從試算表讀取列表（選用）
  var DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwMsCxagnkHf6TbS5PzLJ-PpxyJY32eeDLTkX_vdDmCDeJ8OdUE2DxWyh4w2yquj7v3/exec';

  function getScriptUrl() {
    try {
      var saved = localStorage.getItem(SCRIPT_URL_KEY);
      if (saved && saved.trim()) return saved.trim();
    } catch (_) {}
    return DEFAULT_SCRIPT_URL || '';
  }

  function setScriptUrl(url) {
    try {
      if (url) localStorage.setItem(SCRIPT_URL_KEY, url);
      else localStorage.removeItem(SCRIPT_URL_KEY);
    } catch (_) {}
  }

  function loadExisting() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [];
  }

  function saveExisting(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (_) {}
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function getFormData() {
    var form = document.getElementById('groupForm');
    var title = form.title.value.trim();
    var imageUrl = (form.imageUrl && form.imageUrl.value) ? form.imageUrl.value.trim() : '';
    var startDate = form.startDate.value;
    var endDate = form.endDate.value;
    var badge = (form.querySelector('input[name="badge"]:checked') || {}).value || 'hot';
    var status = (form.querySelector('input[name="status"]:checked') || {}).value || 'ongoing';
    var rawCount = form.registeredCount && form.registeredCount.value ? form.registeredCount.value.trim() : '';
    var registeredCount = rawCount === '' ? null : Math.max(0, parseInt(rawCount, 10) || 0);
    var countdownTo = form.countdownTo.value ? form.countdownTo.value.replace('T', 'T') : null;
    if (countdownTo && countdownTo.length === 16) countdownTo = countdownTo + ':00';

    var progressNames = ['收單中', '等待出荷', '集運中', '抵台', '已完成出貨'];
    var progress = [];
    progressNames.forEach(function (name, i) {
      var el = form.querySelector('input[data-name="' + name + '"]');
      progress.push({ name: name, done: el ? el.checked : false });
    });

    return {
      title: title,
      imageUrl: imageUrl || null,
      startDate: startDate,
      endDate: endDate,
      badge: badge,
      status: status,
      registeredCount: registeredCount,
      progress: progress,
      countdownTo: countdownTo || null
    };
  }

  function buildPayload(data, id) {
    return {
      id: id,
      title: data.title,
      imageUrl: data.imageUrl || null,
      status: data.status,
      badge: data.badge,
      startDate: data.startDate,
      endDate: data.endDate,
      registeredCount: data.registeredCount != null ? data.registeredCount : null,
      progress: data.progress,
      countdownTo: data.countdownTo
    };
  }

  function addToLocal(payload) {
    var list = loadExisting();
    list.push(payload);
    saveExisting(list);
  }

  function updateInLocal(id, payload) {
    var list = loadExisting();
    var idx = list.findIndex(function (item) { return item.id === id; });
    if (idx < 0) return false;
    list[idx] = payload;
    saveExisting(list);
    return true;
  }

  function findInLocal(id) {
    var list = loadExisting();
    return list.find(function (item) { return item.id === id; }) || null;
  }

  function renderExistingList() {
    var box = document.getElementById('existingListBox');
    var clearBtn = document.getElementById('clearEditBtn');
    var editingIdEl = document.getElementById('editingId');
    var editingId = (editingIdEl && editingIdEl.value) ? editingIdEl.value.trim() : '';
    if (!box) return;
    var list = loadExisting();
    box.innerHTML = '';
    list.forEach(function (item) {
      var statusTxt = { upcoming: '即將開團', ongoing: '正在開團', ended: '已結團' }[item.status] || item.status;
      var meta = [item.startDate, item.endDate, statusTxt].filter(Boolean).join(' · ');
      var div = document.createElement('div');
      div.className = 'existing-item';
      div.innerHTML =
        '<div class="existing-item-info">' +
          '<div class="existing-item-title">' + escapeHtml(item.title || '未命名') + '</div>' +
          '<div class="existing-item-meta">' + escapeHtml(meta) + '</div>' +
        '</div>' +
        '<div class="existing-item-actions">' +
          '<button type="button" class="btn btn-secondary existing-load-btn" data-id="' + escapeHtml(item.id) + '">載入編輯</button>' +
        '</div>';
      box.appendChild(div);
    });
    list.forEach(function (item, i) {
      var btn = box.querySelector('.existing-load-btn[data-id="' + item.id + '"]');
      if (btn) btn.addEventListener('click', function () { loadItemIntoForm(item.id); });
    });
    if (clearBtn) clearBtn.style.display = editingId ? 'inline-block' : 'none';
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function loadItemIntoForm(id) {
    var item = findInLocal(id);
    if (!item) {
      showMessage('找不到該筆資料。', 'error');
      return;
    }
    var form = document.getElementById('groupForm');
    form.title.value = item.title || '';
    form.imageUrl.value = item.imageUrl || '';
    if (form.imageUrl && !form.imageUrl.value && item.imageUrl) form.imageUrl.value = item.imageUrl;
    var badge = (item.badge === 'new' || item.badge === 'recommend') ? item.badge : 'hot';
    var badgeEl = form.querySelector('input[name="badge"][value="' + badge + '"]');
    if (badgeEl) badgeEl.checked = true;
    form.startDate.value = item.startDate || '';
    form.endDate.value = item.endDate || '';
    var status = (item.status === 'upcoming' || item.status === 'ended') ? item.status : 'ongoing';
    var statusEl = form.querySelector('input[name="status"][value="' + status + '"]');
    if (statusEl) statusEl.checked = true;
    form.registeredCount.value = (item.registeredCount != null && item.registeredCount !== '') ? String(item.registeredCount) : '';
    var progressNames = ['收單中', '等待出荷', '集運中', '抵台', '已完成出貨'];
    var progress = item.progress || [];
    progressNames.forEach(function (name) {
      var el = form.querySelector('input[data-name="' + name + '"]');
      if (el) {
        var p = progress.find(function (x) { return x.name === name; });
        el.checked = !!(p && p.done);
      }
    });
    var ct = item.countdownTo;
    if (ct) {
      try {
        var d = new Date(ct);
        if (!isNaN(d.getTime())) {
          var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
          var h = String(d.getHours()).padStart(2, '0'), min = String(d.getMinutes()).padStart(2, '0');
          form.countdownTo.value = y + '-' + m + '-' + day + 'T' + h + ':' + min;
        } else { form.countdownTo.value = ''; }
      } catch (_) { form.countdownTo.value = ''; }
    } else {
      form.countdownTo.value = '';
    }
    var editingIdEl = document.getElementById('editingId');
    if (editingIdEl) editingIdEl.value = id;
    renderExistingList();
    showMessage('已載入「' + (item.title || '') + '」，可修改狀態或進度後按「送出」或「僅儲存至本機」。', 'success');
  }

  function clearEditMode() {
    var editingIdEl = document.getElementById('editingId');
    if (editingIdEl) editingIdEl.value = '';
    renderExistingList();
    showMessage('已切換為新增模式，表單可留空或填寫新的一筆。', 'success');
  }

  function loadFromSheet() {
    var url = (document.getElementById('scriptUrl') || {}).value || getScriptUrl();
    if (!url || !url.trim()) {
      showMessage('請先填寫下方 Google Apps Script 網址。', 'error');
      return;
    }
    url = url.trim().replace(/\/$/, '');
    var btn = document.getElementById('loadFromSheetBtn');
    if (btn) { btn.disabled = true; btn.textContent = '載入中…'; }
    fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (list) {
        if (btn) { btn.disabled = false; btn.textContent = '從試算表載入列表（取得列號以支援同步更新）'; }
        if (!Array.isArray(list) || list.length === 0) {
          showMessage('試算表目前沒有資料，或回傳格式不符。', 'success');
          return;
        }
        var existing = loadExisting();
        var byId = {};
        existing.forEach(function (item) { byId[item.id] = item; });
        list.forEach(function (row) {
          var id = row.id;
          var sheetRowIndex = null;
          if (typeof id === 'string' && id.indexOf('row-') === 0) {
            sheetRowIndex = parseInt(id.replace('row-', ''), 10);
            if (isNaN(sheetRowIndex)) sheetRowIndex = null;
          }
          var payload = {
            id: id,
            title: row.title,
            imageUrl: row.imageUrl || null,
            badge: row.badge || 'hot',
            startDate: row.startDate,
            endDate: row.endDate,
            registeredCount: row.registeredCount != null ? row.registeredCount : null,
            status: row.status || 'ongoing',
            progress: Array.isArray(row.progress) ? row.progress : [],
            countdownTo: row.countdownTo || null,
            sheetRowIndex: sheetRowIndex
          };
          var idx = existing.findIndex(function (item) { return item.id === id; });
          if (idx >= 0) {
            existing[idx] = Object.assign({}, existing[idx], payload);
          } else {
            existing.push(payload);
          }
        });
        saveExisting(existing);
        renderExistingList();
        showMessage('已從試算表載入 ' + list.length + ' 筆，並記錄列號。之後載入編輯並送出即可同步更新試算表。', 'success');
      })
      .catch(function (err) {
        if (btn) { btn.disabled = false; btn.textContent = '從試算表載入列表（取得列號以支援同步更新）'; }
        showMessage('無法連線至試算表：' + (err && err.message ? err.message : '請檢查網址與網路'), 'error');
      });
  }

  function showMessage(text, type) {
    var el = document.getElementById('message');
    if (!el) return;
    el.textContent = text;
    el.className = 'message show ' + (type || 'success');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function setSubmitLoading(loading) {
    var btn = document.getElementById('submitBtn');
    if (btn) {
      btn.disabled = loading;
      btn.textContent = loading ? '匯入中…' : '送出並匯入 Google 試算表';
    }
  }

  function addField(form, name, value) {
    var input = document.createElement('input');
    input.name = name;
    input.type = 'hidden';
    input.value = value == null ? '' : value;
    form.appendChild(input);
  }

  function submitToSheet(payload, onDone) {
    var url = (document.getElementById('scriptUrl') || {}).value || getScriptUrl();
    if (!url || !url.trim()) {
      if (onDone) onDone(new Error('請先填寫 Google Apps Script 網址'));
      return;
    }
    url = url.trim().replace(/\/$/, '');
    setSubmitLoading(true);
    var params = new URLSearchParams();
    params.append('action', 'append');
    params.append('title', payload.title || '');
    params.append('imageUrl', payload.imageUrl || '');
    params.append('badge', payload.badge || 'hot');
    params.append('startDate', payload.startDate || '');
    params.append('endDate', payload.endDate || '');
    params.append('registeredCount', payload.registeredCount != null ? String(payload.registeredCount) : '');
    params.append('status', payload.status || 'ongoing');
    params.append('progress', JSON.stringify(payload.progress || []));
    params.append('countdownTo', payload.countdownTo || '');
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        setSubmitLoading(false);
        if (result && result.ok) {
          showMessage(result.message || '已寫入試算表「' + (result.sheetName || '') + '」，目前共 ' + (result.rows || 0) + ' 列。', 'success');
          if (onDone) onDone(null, result);
        } else {
          showMessage((result && result.error) ? result.error : '寫入試算表時發生錯誤。', 'error');
          if (onDone) onDone(new Error(result && result.error ? result.error : 'unknown'));
        }
      })
      .catch(function (err) {
        setSubmitLoading(false);
        var msg = (err && err.message) ? err.message : '請檢查網址與網路';
        if (msg === 'Failed to fetch') {
          msg = '無法連線（Failed to fetch）。請確認：1) Apps Script 已部署為「網路應用程式」且存取權設為「所有使用者」；2) 網址正確且無多餘空白；3) 無擴充功能或防火牆封鎖 script.google.com；4) 若為本機 file:// 請改由 localhost 或 GitHub Pages 開啟。';
        } else {
          msg = '無法連線至 Apps Script：' + msg;
        }
        showMessage(msg, 'error');
        if (onDone) onDone(err);
      });
  }

  function submitToSheetUpdate(payload, onDone) {
    var url = (document.getElementById('scriptUrl') || {}).value || getScriptUrl();
    if (!url || !url.trim()) {
      if (onDone) onDone(new Error('請先填寫 Google Apps Script 網址'));
      return;
    }
    url = url.trim().replace(/\/$/, '');
    setSubmitLoading(true);
    var params = new URLSearchParams();
    params.append('action', 'update');
    params.append('rowIndex', String(payload.sheetRowIndex != null ? payload.sheetRowIndex : ''));
    params.append('title', payload.title || '');
    params.append('imageUrl', payload.imageUrl || '');
    params.append('badge', payload.badge || 'hot');
    params.append('startDate', payload.startDate || '');
    params.append('endDate', payload.endDate || '');
    params.append('registeredCount', payload.registeredCount != null ? String(payload.registeredCount) : '');
    params.append('status', payload.status || 'ongoing');
    params.append('progress', JSON.stringify(payload.progress || []));
    params.append('countdownTo', payload.countdownTo || '');
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        setSubmitLoading(false);
        if (result && result.ok) {
          showMessage(result.message || '已更新試算表該列。', 'success');
          if (onDone) onDone(null);
        } else {
          showMessage((result && result.error) ? result.error : '更新試算表時發生錯誤。', 'error');
          if (onDone) onDone(new Error(result && result.error ? result.error : 'unknown'));
        }
      })
      .catch(function (err) {
        setSubmitLoading(false);
        var msg = (err && err.message) ? err.message : '請檢查網址與網路';
        showMessage('無法連線：' + msg, 'error');
        if (onDone) onDone(err);
      });
  }

  document.getElementById('groupForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var data = getFormData();
    if (!data.title || !data.startDate || !data.endDate) {
      showMessage('請填寫商品名稱、開團日期與結團日期。', 'error');
      return;
    }
    var editingIdEl = document.getElementById('editingId');
    var editingId = (editingIdEl && editingIdEl.value) ? editingIdEl.value.trim() : '';
    var id = editingId || generateId();
    var existing = editingId ? findInLocal(editingId) : null;
    var payload = buildPayload(data, id);
    if (existing && existing.sheetRowIndex != null) payload.sheetRowIndex = existing.sheetRowIndex;

    var url = (document.getElementById('scriptUrl') || {}).value || getScriptUrl();
    if (editingId) {
      updateInLocal(editingId, payload);
      if (editingIdEl) editingIdEl.value = '';
      renderExistingList();
      if (url && url.trim() && payload.sheetRowIndex != null) {
        setScriptUrl(url.trim());
        submitToSheetUpdate(payload, function () {});
      } else if (url && url.trim()) {
        showMessage('已更新本機資料。試算表未同步（此筆當初未記錄列號），請手動修改試算表或重新匯入。', 'success');
      } else {
        showMessage('已更新本機資料，可至展示頁查看。', 'success');
      }
    } else {
      if (url && url.trim()) {
        setScriptUrl(url.trim());
        addToLocal(payload);
        submitToSheet(payload, function (err, result) {
          if (!err && result && result.rows != null) {
            var list = loadExisting();
            var last = list[list.length - 1];
            if (last && last.id === payload.id) {
              last.sheetRowIndex = result.rows;
              saveExisting(list);
            }
          }
        });
      } else {
        addToLocal(payload);
        showMessage('已儲存至本機。若需匯入試算表，請先填寫下方 Apps Script 網址後再送出。', 'success');
      }
    }
  });

  document.getElementById('saveLocalBtn').addEventListener('click', function () {
    var data = getFormData();
    if (!data.title || !data.startDate || !data.endDate) {
      showMessage('請填寫商品名稱、開團日期與結團日期。', 'error');
      return;
    }
    var editingIdEl = document.getElementById('editingId');
    var editingId = (editingIdEl && editingIdEl.value) ? editingIdEl.value.trim() : '';
    var id = editingId || generateId();
    var existing = editingId ? findInLocal(editingId) : null;
    var payload = buildPayload(data, id);
    if (existing && existing.sheetRowIndex != null) payload.sheetRowIndex = existing.sheetRowIndex;

    if (editingId) {
      updateInLocal(editingId, payload);
      if (editingIdEl) editingIdEl.value = '';
      renderExistingList();
      showMessage('已更新本機資料，可至展示頁查看。', 'success');
    } else {
      addToLocal(payload);
      showMessage('已僅儲存至本機，可至展示頁查看。', 'success');
    }
  });

  document.getElementById('clearEditBtn').addEventListener('click', function () {
    clearEditMode();
  });

  var loadFromSheetBtn = document.getElementById('loadFromSheetBtn');
  if (loadFromSheetBtn) {
    loadFromSheetBtn.addEventListener('click', function () { loadFromSheet(); });
  }

  var scriptInput = document.getElementById('scriptUrl');
  if (scriptInput) {
    scriptInput.value = getScriptUrl();
    scriptInput.addEventListener('change', function () {
      setScriptUrl(this.value.trim());
    });
    scriptInput.addEventListener('blur', function () {
      setScriptUrl(this.value.trim());
    });
  }
  var testBtn = document.getElementById('testScriptBtn');
  if (testBtn) {
    testBtn.addEventListener('click', function () {
      var url = (document.getElementById('scriptUrl') || {}).value || getScriptUrl();
      if (!url || !url.trim()) {
        showMessage('請先填寫 Apps Script 網址', 'error');
        return;
      }
      url = url.trim().replace(/\/$/, '') + (url.indexOf('?') >= 0 ? '&' : '?') + 'action=test';
      window.open(url, '_blank');
    });
  }

  document.querySelectorAll('.theme-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var theme = this.dataset.theme;
      document.documentElement.setAttribute('data-theme', theme);
      document.querySelectorAll('.theme-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.theme === theme);
      });
      try {
        localStorage.setItem('groupBuyTheme', theme);
      } catch (_) {}
    });
  });

  var savedTheme = 'dawn';
  try {
    savedTheme = localStorage.getItem('groupBuyTheme') || 'dawn';
  } catch (_) {}
  if (['dawn', 'night', 'sakura'].indexOf(savedTheme) >= 0) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.querySelectorAll('.theme-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.theme === savedTheme);
    });
  }

  renderExistingList();
})();
