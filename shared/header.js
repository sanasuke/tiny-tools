(function () {
  'use strict';

  const SITE_NAME = 'tiny-tools';
  const scriptEl  = document.currentScript;
  const repoUrl   = scriptEl ? scriptEl.getAttribute('data-repo') : null;
  const noteUrl   = scriptEl ? scriptEl.getAttribute('data-note') : null;

  const segments = location.pathname.split('/').filter(function (s) {
    return s && s !== 'index.html';
  });
  const isTop = segments.length === 0;

  const toolName = isTop ? null : document.title.split(' | ')[0].trim();

  /* ---------- dark mode persistence ---------- */
  var DARK_KEY = 'tt-dark-mode';
  function isDarkStored() {
    return localStorage.getItem(DARK_KEY) === '1';
  }
  function applyDark(on) {
    document.body.classList.toggle('tt-dark', on);
    localStorage.setItem(DARK_KEY, on ? '1' : '0');
  }

  /* ---------- resolve base path for assets ---------- */
  var scriptSrc = scriptEl ? scriptEl.getAttribute('src') : '';
  var basePath  = scriptSrc.replace(/[^/]*$/, '');

  /* ---------- SVG icons ---------- */
  var ICON = {
    github: '<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' +
      '<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38' +
      ' 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01' +
      ' 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95' +
      ' 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27' +
      ' .68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15' +
      ' 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2' +
      ' 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>',
    note: '<img src="' + basePath + 'note.png" width="18" height="18" alt="note" aria-hidden="true" style="border-radius:3px">',
    share: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>' +
      '<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    sun: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>' +
      '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' +
      '<line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>' +
      '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    hamburger: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  };

  /* ---------- inject ---------- */
  function injectHeader() {
    /* --- styles --- */
    var style = document.createElement('style');
    style.textContent =
      /* header base */
      '#tt-header{position:sticky;top:0;z-index:1000;width:100%;align-self:stretch;' +
        'background:var(--tt-bg,#fff);border-bottom:1px solid var(--tt-border,#e0e0e0);' +
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Hiragino Sans","Noto Sans JP",sans-serif;' +
        'transition:background .2s,border-color .2s}' +
      '#tt-header-inner{display:flex;align-items:center;justify-content:space-between;padding:.6rem 1rem;gap:.5rem}' +
      '#tt-header-left,#tt-header-right{width:120px;flex-shrink:0}' +
      '#tt-header-right{text-align:right;position:relative}' +
      '#tt-header-center{flex:1;text-align:center}' +
      '#tt-header-title{font-size:1rem;font-weight:700;color:var(--tt-text,#222);text-decoration:none;transition:color .15s}' +
      '#tt-header-title:hover{color:#4a90d9}' +

      /* back button */
      '#tt-back-btn{display:inline-flex;align-items:center;gap:.25rem;font-size:.875rem;' +
        'color:#4a90d9;text-decoration:none;padding:.25rem .5rem;border-radius:4px;transition:background .15s}' +
      '#tt-back-btn:hover{background:var(--tt-hover,#f0f6ff)}' +

      /* breadcrumb */
      '#tt-breadcrumb{font-size:.78rem;color:var(--tt-sub,#888);text-align:center;padding:.3rem 1rem;' +
        'border-top:1px solid var(--tt-border-light,#f0f0f0);background:var(--tt-bg,#fff);transition:background .2s,color .2s}' +
      '#tt-breadcrumb a{color:#4a90d9;text-decoration:none}' +
      '#tt-breadcrumb a:hover{text-decoration:underline}' +

      /* hamburger button */
      '#tt-menu-btn{display:inline-flex;align-items:center;justify-content:center;' +
        'width:40px;height:40px;border:none;background:transparent;cursor:pointer;border-radius:8px;' +
        'color:var(--tt-text,#222);transition:background .15s;padding:0}' +
      '#tt-menu-btn:hover{background:var(--tt-hover,#f0f0f0)}' +

      /* overlay */
      '#tt-overlay{display:none;position:fixed;inset:0;z-index:999}' +
      '#tt-overlay.tt-open{display:block}' +

      /* dropdown */
      '#tt-dropdown{display:none;position:absolute;right:0;top:calc(100% + 6px);' +
        'min-width:200px;background:var(--tt-bg,#fff);border:1px solid var(--tt-border,#e0e0e0);' +
        'border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.12);padding:6px 0;z-index:1001;' +
        'opacity:0;transform:translateY(-8px) scale(.96);transition:opacity .18s ease,transform .18s ease}' +
      '#tt-dropdown.tt-open{display:block;opacity:1;transform:translateY(0) scale(1)}' +

      /* menu items */
      '.tt-menu-item{display:flex;align-items:center;gap:10px;width:100%;padding:10px 16px;' +
        'border:none;background:none;cursor:pointer;font-size:.875rem;color:var(--tt-text,#333);' +
        'text-decoration:none;transition:background .12s;font-family:inherit;text-align:left;box-sizing:border-box}' +
      '.tt-menu-item:hover{background:var(--tt-hover,#f5f5f5)}' +
      '.tt-menu-item svg,.tt-menu-item img{flex-shrink:0;color:var(--tt-icon,#555)}' +
      '.tt-menu-sep{height:1px;background:var(--tt-border-light,#e8e8e8);margin:4px 12px}' +

      /* toast */
      '#tt-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);' +
        'background:var(--tt-toast-bg,#333);color:#fff;padding:10px 20px;border-radius:8px;font-size:.85rem;' +
        'opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;z-index:2000;' +
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}' +
      '#tt-toast.tt-show{opacity:1;transform:translateX(-50%) translateY(0)}' +

      /* dark mode — page-wide */
      'body.tt-dark{--tt-bg:#1a1a2e;--tt-text:#e0e0e0;--tt-sub:#999;--tt-border:#2a2a4a;' +
        '--tt-border-light:#2a2a4a;--tt-hover:rgba(255,255,255,.08);--tt-icon:#aaa;--tt-toast-bg:#555;' +
        'background:#1a1a2e!important;color:#e0e0e0!important}' +
      'body.tt-dark *:not(#tt-header):not(#tt-header *){color:inherit}' +
      'body.tt-dark input,body.tt-dark textarea,body.tt-dark select{' +
        'background:#252545!important;color:#e0e0e0!important;border-color:#3a3a5a!important}' +
      'body.tt-dark button:not(#tt-menu-btn):not(.tt-menu-item){' +
        'background:#252545!important;color:#e0e0e0!important;border-color:#3a3a5a!important}' +
      'body.tt-dark .container,body.tt-dark .card,body.tt-dark [class*="card"],body.tt-dark [class*="panel"],' +
        'body.tt-dark [class*="box"],body.tt-dark [class*="wrapper"]{' +
        'background:#20203a!important;border-color:#2a2a4a!important}' +
      'body.tt-dark a:not(.tt-menu-item):not(#tt-back-btn):not(#tt-header-title):not(#tt-breadcrumb a){color:#6ab0f3!important}' +
      'body.tt-dark h1,body.tt-dark h2,body.tt-dark h3,body.tt-dark h4{color:#f0f0f0!important}' +
      'body.tt-dark hr{border-color:#2a2a4a!important}' +
      'body.tt-dark table,body.tt-dark th,body.tt-dark td{border-color:#2a2a4a!important}' +
      'body.tt-dark th{background:#252545!important}' +
      'body.tt-dark ::placeholder{color:#666!important}' +
      /* note icon in dark mode */
      'body.tt-dark .tt-menu-item img{filter:invert(1)}';

    document.head.appendChild(style);

    /* restore dark mode */
    if (isDarkStored()) applyDark(true);

    /* --- header element --- */
    var header = document.createElement('header');
    header.id = 'tt-header';

    var inner = document.createElement('div');
    inner.id = 'tt-header-inner';

    /* left */
    var left = document.createElement('div');
    left.id = 'tt-header-left';
    if (!isTop) {
      var back = document.createElement('a');
      back.id = 'tt-back-btn';
      back.href = '../';
      back.innerHTML = '&#8592; 戻る';
      left.appendChild(back);
    }

    /* center */
    var center = document.createElement('div');
    center.id = 'tt-header-center';
    var title = document.createElement('a');
    title.id = 'tt-header-title';
    title.href = isTop ? './' : '../';
    title.textContent = SITE_NAME;
    center.appendChild(title);

    /* right — hamburger menu */
    var right = document.createElement('div');
    right.id = 'tt-header-right';

    var menuBtn = document.createElement('button');
    menuBtn.id = 'tt-menu-btn';
    menuBtn.type = 'button';
    menuBtn.setAttribute('aria-label', 'メニューを開く');
    menuBtn.innerHTML = ICON.hamburger;
    right.appendChild(menuBtn);

    /* dropdown */
    var dropdown = document.createElement('div');
    dropdown.id = 'tt-dropdown';
    dropdown.setAttribute('role', 'menu');

    /* GitHub link */
    if (repoUrl) {
      var ghItem = document.createElement('a');
      ghItem.className = 'tt-menu-item';
      ghItem.href = repoUrl;
      ghItem.target = '_blank';
      ghItem.rel = 'noopener noreferrer';
      ghItem.setAttribute('role', 'menuitem');
      ghItem.innerHTML = ICON.github + '<span>GitHub</span>';
      dropdown.appendChild(ghItem);
    }

    /* Note link */
    if (noteUrl) {
      var noteItem = document.createElement('a');
      noteItem.className = 'tt-menu-item';
      noteItem.href = noteUrl;
      noteItem.target = '_blank';
      noteItem.rel = 'noopener noreferrer';
      noteItem.setAttribute('role', 'menuitem');
      noteItem.innerHTML = ICON.note + '<span>Note</span>';
      dropdown.appendChild(noteItem);
    }

    /* separator */
    if (repoUrl || noteUrl) {
      var sep = document.createElement('div');
      sep.className = 'tt-menu-sep';
      sep.setAttribute('role', 'separator');
      dropdown.appendChild(sep);
    }

    /* share */
    var shareItem = document.createElement('button');
    shareItem.className = 'tt-menu-item';
    shareItem.type = 'button';
    shareItem.setAttribute('role', 'menuitem');
    shareItem.innerHTML = ICON.share + '<span>シェア</span>';
    shareItem.addEventListener('click', function () {
      closeMenu();
      var shareData = { title: document.title, url: location.href };
      if (navigator.share) {
        navigator.share(shareData).catch(function () {});
      } else {
        navigator.clipboard.writeText(location.href).then(function () {
          showToast('URLをコピーしました');
        }).catch(function () {
          showToast('コピーに失敗しました');
        });
      }
    });
    dropdown.appendChild(shareItem);

    /* dark mode toggle */
    var darkItem = document.createElement('button');
    darkItem.className = 'tt-menu-item';
    darkItem.type = 'button';
    darkItem.setAttribute('role', 'menuitem');
    function updateDarkLabel() {
      var isDark = document.body.classList.contains('tt-dark');
      darkItem.innerHTML = (isDark ? ICON.sun : ICON.moon) +
        '<span>' + (isDark ? 'ライトモード' : 'ダークモード') + '</span>';
    }
    updateDarkLabel();
    darkItem.addEventListener('click', function () {
      var next = !document.body.classList.contains('tt-dark');
      applyDark(next);
      updateDarkLabel();
    });
    dropdown.appendChild(darkItem);

    right.appendChild(dropdown);

    /* overlay for closing */
    var overlay = document.createElement('div');
    overlay.id = 'tt-overlay';
    overlay.addEventListener('click', closeMenu);

    /* menu open / close */
    var isOpen = false;
    function openMenu() {
      isOpen = true;
      dropdown.classList.add('tt-open');
      overlay.classList.add('tt-open');
      menuBtn.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
      isOpen = false;
      dropdown.classList.remove('tt-open');
      overlay.classList.remove('tt-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isOpen) closeMenu(); else openMenu();
    });

    inner.appendChild(left);
    inner.appendChild(center);
    inner.appendChild(right);
    header.appendChild(inner);

    /* breadcrumb */
    var bc = document.createElement('div');
    bc.id = 'tt-breadcrumb';
    if (isTop) {
      bc.textContent = SITE_NAME;
    } else {
      var homeLink = document.createElement('a');
      homeLink.href = '../';
      homeLink.textContent = SITE_NAME;
      bc.appendChild(homeLink);
      if (toolName) {
        bc.appendChild(document.createTextNode(' \u203a ' + toolName));
      }
    }
    header.appendChild(bc);

    document.body.insertBefore(header, document.body.firstChild);
    document.body.appendChild(overlay);

    /* toast element */
    var toast = document.createElement('div');
    toast.id = 'tt-toast';
    document.body.appendChild(toast);
  }

  /* ---------- toast ---------- */
  var toastTimer;
  function showToast(msg) {
    var el = document.getElementById('tt-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('tt-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('tt-show');
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
  } else {
    injectHeader();
  }
})();
