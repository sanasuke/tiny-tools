(function () {
  'use strict';

  const SITE_NAME = 'sana.suke tiny-tools';
  const scriptEl  = document.currentScript;
  const repoUrl   = scriptEl ? scriptEl.getAttribute('data-repo') : null;

  const segments = location.pathname.split('/').filter(function (s) {
    return s && s !== 'index.html';
  });
  const isTop = segments.length === 0;

  const toolName = isTop ? null : document.title.split(' | ')[0].trim();

  function injectHeader() {
    const style = document.createElement('style');
    style.textContent = [
      '#tt-header {',
      '  position: sticky;',
      '  top: 0;',
      '  z-index: 100;',
      '  width: 100%;',
      '  align-self: stretch;',
      '  background: #fff;',
      '  border-bottom: 1px solid #e0e0e0;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Noto Sans JP", sans-serif;',
      '}',
      '#tt-header-inner {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  padding: 0.6rem 1rem;',
      '  gap: 0.5rem;',
      '}',
      '#tt-header-left,',
      '#tt-header-right {',
      '  width: 120px;',
      '  flex-shrink: 0;',
      '}',
      '#tt-header-right {',
      '  text-align: right;',
      '}',
      '#tt-header-center {',
      '  flex: 1;',
      '  text-align: center;',
      '}',
      '#tt-header-title {',
      '  font-size: 1rem;',
      '  font-weight: 700;',
      '  color: #222;',
      '  text-decoration: none;',
      '}',
      '#tt-header-title:hover {',
      '  color: #4a90d9;',
      '}',
      '#tt-back-btn {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 0.25rem;',
      '  font-size: 0.875rem;',
      '  color: #4a90d9;',
      '  text-decoration: none;',
      '  padding: 0.25rem 0.5rem;',
      '  border-radius: 4px;',
      '  transition: background 0.15s;',
      '}',
      '#tt-back-btn:hover {',
      '  background: #f0f6ff;',
      '}',
      '#tt-github-link {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 0.3rem;',
      '  font-size: 0.8rem;',
      '  color: #555;',
      '  text-decoration: none;',
      '  padding: 0.25rem 0.5rem;',
      '  border-radius: 4px;',
      '  transition: background 0.15s;',
      '}',
      '#tt-github-link:hover {',
      '  background: #f5f5f5;',
      '  color: #222;',
      '}',
      '#tt-breadcrumb {',
      '  font-size: 0.78rem;',
      '  color: #888;',
      '  text-align: center;',
      '  padding: 0.3rem 1rem;',
      '  border-top: 1px solid #f0f0f0;',
      '  background: #fff;',
      '}',
      '#tt-breadcrumb a {',
      '  color: #4a90d9;',
      '  text-decoration: none;',
      '}',
      '#tt-breadcrumb a:hover {',
      '  text-decoration: underline;',
      '}',
    ].join('\n');
    document.head.appendChild(style);

    const header = document.createElement('header');
    header.id = 'tt-header';

    // inner row
    const inner = document.createElement('div');
    inner.id = 'tt-header-inner';

    // left
    const left = document.createElement('div');
    left.id = 'tt-header-left';
    if (!isTop) {
      const back = document.createElement('a');
      back.id = 'tt-back-btn';
      back.href = '../';
      back.innerHTML = '&#8592; 戻る';
      left.appendChild(back);
    }

    // center
    const center = document.createElement('div');
    center.id = 'tt-header-center';
    const title = document.createElement('a');
    title.id = 'tt-header-title';
    title.href = isTop ? './' : '../';
    title.textContent = SITE_NAME;
    center.appendChild(title);

    // right
    const right = document.createElement('div');
    right.id = 'tt-header-right';
    if (repoUrl) {
      const gh = document.createElement('a');
      gh.id = 'tt-github-link';
      gh.href = repoUrl;
      gh.target = '_blank';
      gh.rel = 'noopener noreferrer';
      gh.innerHTML = [
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">',
        '<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38',
        ' 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01',
        ' 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95',
        ' 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27',
        ' .68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15',
        ' 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2',
        ' 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>',
        '</svg>',
        'GitHub',
      ].join('');
      right.appendChild(gh);
    }

    inner.appendChild(left);
    inner.appendChild(center);
    inner.appendChild(right);
    header.appendChild(inner);

    // breadcrumb (all pages)
    const bc = document.createElement('div');
    bc.id = 'tt-breadcrumb';
    if (isTop) {
      bc.textContent = 'tiny-tools';
    } else {
      const homeLink = document.createElement('a');
      homeLink.href = '../';
      homeLink.textContent = 'tiny-tools';
      bc.appendChild(homeLink);
      if (toolName) {
        bc.appendChild(document.createTextNode(' \u203a ' + toolName));
      }
    }
    header.appendChild(bc);

    document.body.insertBefore(header, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
  } else {
    injectHeader();
  }
})();
