(function () {
  'use strict';

  const STORAGE_KEY = 'groupBuyData';

  var PROGRESS_ICONS = {
    '收單中': '<svg class="progress-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    '等待出荷': '<svg class="progress-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>',
    '集運中': '<svg class="progress-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h5l3 3v5h-8V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    '抵台': '<svg class="progress-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    '已完成出貨': '<svg class="progress-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>'
  };
  function getProgressIcon(name) {
    return PROGRESS_ICONS[name] || PROGRESS_ICONS['已完成出貨'];
  }
  const DEFAULT_DATA = [
    {
      id: '1',
      title: '日本直送草莓禮盒',
      status: 'upcoming',
      badge: 'new',
      imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400',
      startDate: '2025-03-10',
      endDate: '2025-03-20',
      progress: [{ name: '收單中', done: false }, { name: '等待出荷', done: false }, { name: '集運中', done: false }, { name: '抵台', done: false }, { name: '已完成出貨', done: false }],
      countdownTo: '2025-03-10T10:00:00'
    },
    {
      id: '2',
      title: '韓國美妝熱銷組',
      status: 'ongoing',
      badge: 'hot',
      imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
      startDate: '2025-02-28',
      endDate: '2025-03-15',
      progress: [{ name: '收單中', done: true }, { name: '等待出荷', done: true }, { name: '集運中', done: false }, { name: '抵台', done: false }, { name: '已完成出貨', done: false }],
      registeredCount: 10,
      countdownTo: '2025-03-18T18:00:00'
    },
    {
      id: '3',
      title: '春日零食大賞',
      status: 'ongoing',
      badge: 'recommend',
      imageUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400',
      startDate: '2025-03-01',
      endDate: '2025-03-12',
      progress: [{ name: '收單中', done: true }, { name: '等待出荷', done: false }, { name: '集運中', done: false }, { name: '抵台', done: false }, { name: '已完成出貨', done: false }],
      registeredCount: 24,
      countdownTo: '2025-03-20T12:00:00'
    },
    {
      id: '4',
      title: '冬季保暖小物團',
      status: 'ended',
      badge: 'hot',
      imageUrl: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400',
      startDate: '2025-01-05',
      endDate: '2025-01-20',
      progress: [{ name: '收單中', done: true }, { name: '等待出荷', done: true }, { name: '集運中', done: true }, { name: '抵台', done: true }, { name: '已完成出貨', done: true }],
      countdownTo: null
    },
    {
      id: '5',
      title: '初春限定和菓子',
      status: 'upcoming',
      badge: 'recommend',
      imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400',
      startDate: '2025-03-15',
      endDate: '2025-03-25',
      progress: [{ name: '收單中', done: false }, { name: '等待出荷', done: false }, { name: '集運中', done: false }, { name: '抵台', done: false }, { name: '已完成出貨', done: false }],
      countdownTo: '2025-03-15T09:00:00'
    }
  ];

  let allProducts = [];
  let currentFilter = 'upcoming';
  let currentTheme = 'dawn';

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) allProducts = parsed;
        else allProducts = [...DEFAULT_DATA];
      } else {
        allProducts = [...DEFAULT_DATA];
      }
    } catch (_) {
      allProducts = [...DEFAULT_DATA];
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allProducts));
    } catch (_) {}
  }

  function getFiltered() {
    var list = allProducts.filter(function (p) { return p.status === currentFilter; });
    if (currentFilter === 'ongoing') {
      list = list.slice().sort(function (a, b) {
        var da = a.listedAt || a.startDate || '';
        var db = b.listedAt || b.startDate || '';
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        var ta = new Date(da).getTime();
        var tb = new Date(db).getTime();
        return isNaN(tb) - isNaN(ta) || tb - ta;
      });
    }
    return list;
  }

  function formatDate(str) {
    if (!str) return '—';
    var s = String(str).trim();
    var d = s.indexOf('T') >= 0 ? new Date(s) : new Date(s + 'T00:00:00');
    if (isNaN(d.getTime())) return '—';
    return d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
  }

  function getCountdown(toIso) {
    if (!toIso) return null;
    const to = new Date(toIso);
    if (isNaN(to.getTime())) return null;
    const now = new Date();
    const diff = to - now;
    if (diff <= 0) return { text: '已到期', done: true };
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const secs = Math.floor((diff % (60 * 1000)) / 1000);
    const parts = [];
    if (days) parts.push(days + ' 天');
    parts.push(String(hours).padStart(2, '0') + ' 時');
    parts.push(String(mins).padStart(2, '0') + ' 分');
    parts.push(String(secs).padStart(2, '0') + ' 秒');
    return { text: parts.join(' '), done: false };
  }

  function renderCards() {
    const grid = document.getElementById('cardsGrid');
    const empty = document.getElementById('emptyState');
    if (!grid || !empty) return;

    const list = getFiltered();
    grid.innerHTML = '';

    if (list.length === 0) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    list.forEach(function (p) {
      const card = document.createElement('article');
      card.className = 'product-card';
      card.dataset.id = p.id;

      const badgeClass = (p.badge === 'new' ? 'new' : p.badge === 'hot' ? 'hot' : 'recommend');
      const badgeText = p.badge === 'new' ? '新品' : p.badge === 'hot' ? '熱銷' : '推薦';

      let progressHtml = '';
      if (p.progress && p.progress.length) {
        var currentIdx = (p.status === 'ended') ? -1 : p.progress.findIndex(function (n) { return !n.done; });
        progressHtml = '<div class="progress-steps">' + p.progress.map(function (node, i) {
          var c = node.done ? 'passed' : (i === currentIdx) ? 'current' : 'pending';
          var icon = getProgressIcon(node.name);
          return '<div class="progress-node ' + c + '"><span class="progress-node-label">' + escapeHtml(node.name) + '</span><span class="progress-node-icon">' + icon + '<span class="progress-node-light" aria-hidden="true"></span></span></div>';
        }).join('') + '</div>';
      }

      var countdownTarget = p.countdownTo || (p.endDate ? p.endDate + 'T23:59:59' : null);
      let countdownHtml = '';
      const cd = getCountdown(countdownTarget);
      if (cd && !cd.done) {
        countdownHtml = '<div class="countdown">倒數：<span>' + cd.text + '</span></div>';
      } else if (cd && cd.done) {
        countdownHtml = '<div class="countdown">已到期</div>';
      }

      var imageHtml = '';
      if (p.imageUrl && p.imageUrl.trim()) {
        var safeUrl = escapeHtml(p.imageUrl.trim());
        imageHtml = '<div class="card-image-wrap"><img src="' + safeUrl + '" alt="" class="card-image" loading="lazy" /></div>';
      }

      var registeredHtml = '';
      if (p.registeredCount != null && p.registeredCount > 0) {
        registeredHtml = '<div class="card-registered">共 ' + String(p.registeredCount) + ' 位登記預購</div>';
      }

      card.innerHTML =
        '<span class="card-badge ' + badgeClass + '">' + badgeText + '</span>' +
        imageHtml +
        '<h3 class="card-title">' + escapeHtml(p.title) + '</h3>' +
        '<div class="card-dates">' +
        '<span>開團 ' + formatDate(p.startDate) + '</span>' +
        '<span>結團 ' + formatDate(p.endDate) + '</span>' +
        '</div>' +
        registeredHtml +
        '<div class="progress-wrap">' +
        '<div class="progress-label">進度</div>' +
        progressHtml +
        countdownHtml +
        '</div>';

      grid.appendChild(card);
    });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function bindTabs() {
    document.querySelectorAll('.tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const filter = this.dataset.filter;
        if (filter === currentFilter) return;
        currentFilter = filter;
        document.querySelectorAll('.tab').forEach(function (b) {
          b.classList.toggle('active', b.dataset.filter === filter);
          b.setAttribute('aria-selected', b.dataset.filter === filter ? 'true' : 'false');
        });
        renderCards();
      });
    });
  }

  function bindTheme() {
    document.querySelectorAll('.theme-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const theme = this.dataset.theme;
        if (theme === currentTheme) return;
        currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        document.querySelectorAll('.theme-btn').forEach(function (b) {
          b.classList.toggle('active', b.dataset.theme === theme);
          b.setAttribute('aria-pressed', b.dataset.theme === theme ? 'true' : 'false');
        });
        try {
          localStorage.setItem('groupBuyTheme', theme);
        } catch (_) {}
      });
    });
  }

  function tickCountdown() {
    document.querySelectorAll('.countdown').forEach(function (div) {
      const span = div.querySelector('span');
      if (!span) return;
      const card = div.closest('.product-card');
      if (!card) return;
      const id = card.dataset.id;
      const p = allProducts.find(function (x) { return String(x.id) === id; });
      var countdownTarget = p ? (p.countdownTo || (p.endDate ? p.endDate + 'T23:59:59' : null)) : null;
      if (!p || !countdownTarget) return;
      const cd = getCountdown(countdownTarget);
      if (!cd) return;
      if (cd.done) {
        div.innerHTML = '已到期';
        div.classList.add('countdown-done');
        return;
      }
      span.textContent = cd.text;
    });
  }

  // 從 Google Apps Script 讀取：優先 localStorage / 全域變數，否則使用預設網址
  var DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwMsCxagnkHf6TbS5PzLJ-PpxyJY32eeDLTkX_vdDmCDeJ8OdUE2DxWyh4w2yquj7v3/exec';
  function getScriptUrl() {
    if (typeof window.GOOGLE_SCRIPT_URL === 'string' && window.GOOGLE_SCRIPT_URL) return window.GOOGLE_SCRIPT_URL;
    try {
      var saved = localStorage.getItem('googleScriptUrl');
      if (saved && saved.trim()) return saved.trim();
    } catch (_) {}
    return DEFAULT_SCRIPT_URL || '';
  }
  function maybeFetchFromSheet(cb) {
    var url = getScriptUrl();
    if (!url || !url.trim()) {
      if (cb) cb();
      return;
    }
    fetch(url + (url.indexOf('?') >= 0 ? '&' : '?') + 'action=get')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (Array.isArray(data) && data.length) {
          allProducts = data;
          saveData();
        }
        if (cb) cb();
      })
      .catch(function () { if (cb) cb(); });
  }

  function init() {
    loadData();
    var savedTheme = 'dawn';
    try {
      savedTheme = localStorage.getItem('groupBuyTheme') || 'dawn';
    } catch (_) {}
    if (['dawn', 'night', 'sakura'].indexOf(savedTheme) >= 0) {
      currentTheme = savedTheme;
      document.documentElement.setAttribute('data-theme', savedTheme);
      document.querySelectorAll('.theme-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.theme === savedTheme);
        b.setAttribute('aria-pressed', b.dataset.theme === savedTheme ? 'true' : 'false');
      });
    }
    bindTabs();
    bindTheme();
    maybeFetchFromSheet(function () {
      renderCards();
      tickCountdown();
      setInterval(tickCountdown, 1000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.__groupBuyReload = function () {
    loadData();
    renderCards();
  };
})();
