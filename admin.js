(function () {
  'use strict';

  const STORAGE_KEY = 'groupBuyData';
  const SCRIPT_URL_KEY = 'googleScriptUrl'; // 與展示頁共用，供從試算表讀取列表（選用）

  function getScriptUrl() {
    try {
      return localStorage.getItem(SCRIPT_URL_KEY) || '';
    } catch (_) {
      return '';
    }
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

  function submitToSheet(payload, onDone) {
    var url = (document.getElementById('scriptUrl') || {}).value || getScriptUrl();
    if (!url || !url.trim()) {
      if (onDone) onDone(new Error('請先填寫 Google Apps Script 網址'));
      return;
    }
    setSubmitLoading(true);
    var body = JSON.stringify({ action: 'append', row: payload });
    var iframe = document.createElement('iframe');
    iframe.name = 'sheet-post-frame';
    iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    var form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = 'sheet-post-frame';
    form.style.display = 'none';
    var input = document.createElement('input');
    input.name = 'payload';
    input.type = 'hidden';
    input.value = body;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    setTimeout(function () {
      document.body.removeChild(form);
      document.body.removeChild(iframe);
      setSubmitLoading(false);
      if (onDone) onDone(null);
    }, 1500);
  }

  document.getElementById('groupForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var data = getFormData();
    if (!data.title || !data.startDate || !data.endDate) {
      showMessage('請填寫商品名稱、開團日期與結團日期。', 'error');
      return;
    }
    var id = generateId();
    var payload = buildPayload(data, id);
    var url = (document.getElementById('scriptUrl') || {}).value || getScriptUrl();
    if (url && url.trim()) {
      setScriptUrl(url.trim());
      submitToSheet(payload, function (err) {
        addToLocal(payload);
        if (err) {
          showMessage('已儲存至本機，但匯入試算表時發生錯誤（可能需檢查 CORS 或改為用 doPost 接收）。', 'error');
        } else {
          showMessage('已匯入 Google 試算表並更新本機資料，可至展示頁查看。', 'success');
        }
      });
    } else {
      addToLocal(payload);
      showMessage('已儲存至本機。若需匯入試算表，請先填寫下方 Apps Script 網址後再送出。', 'success');
    }
  });

  document.getElementById('saveLocalBtn').addEventListener('click', function () {
    var data = getFormData();
    if (!data.title || !data.startDate || !data.endDate) {
      showMessage('請填寫商品名稱、開團日期與結團日期。', 'error');
      return;
    }
    var id = generateId();
    var payload = buildPayload(data, id);
    addToLocal(payload);
    showMessage('已僅儲存至本機，可至展示頁查看。', 'success');
  });

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
})();
