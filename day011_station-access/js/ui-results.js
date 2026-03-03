window.SA = window.SA || {};

SA.sortEntries = function (arr, sortKey, sortDir, sortOrigin) {
  return arr.slice().sort(function (a, b) {
    var cmp = 0;
    if (sortOrigin && (sortKey === 'transfers' || sortKey === 'minMinutes')) {
      var aVal = null, bVal = null;
      a.access.forEach(function (ac) { if (ac.originName === sortOrigin) aVal = ac; });
      b.access.forEach(function (ac) { if (ac.originName === sortOrigin) bVal = ac; });
      if (sortKey === 'transfers') {
        var at = aVal ? aVal.transfers : 9999;
        var bt = bVal ? bVal.transfers : 9999;
        cmp = at - bt;
      } else {
        var am = aVal ? aVal.minutes : 9999;
        var bm = bVal ? bVal.minutes : 9999;
        cmp = am - bm;
      }
    } else {
      if (sortKey === 'transfers') cmp = a.maxTransfers - b.maxTransfers || a.totalMinutes - b.totalMinutes;
      else if (sortKey === 'minMinutes') cmp = a.minMinutes - b.minMinutes || a.totalMinutes - b.totalMinutes;
      else if (sortKey === 'avgMinutes') cmp = a.totalMinutes - b.totalMinutes || a.minMinutes - b.minMinutes;
      else cmp = a.info.name.localeCompare(b.info.name, 'ja');
    }
    return sortDir === 'desc' ? -cmp : cmp;
  });
};

SA.renderStationItem = function (e) {
  var html = '<li class="station-item" data-gid="' + e.gid + '">';
  html += '<div class="station-top">';
  html += '<span class="station-name">' + SA.escapeHtml(e.info.name) + '</span>';
  html += '<span class="station-pref">' + SA.escapeHtml(SA.RD.prefNames[e.info.pref] || '') + '</span>';
  html += '</div>';

  html += '<div class="line-badges">';
  e.info.lines.forEach(function (l) {
    var bg = '#' + SA.ensureVisibleColor(l.color);
    var textColor = SA.isLightColor(l.color) ? '#333' : '#fff';
    html += '<span class="line-badge" style="background:' + bg + ';color:' + textColor + '">' + SA.escapeHtml(l.name) + '</span>';
  });
  html += '</div>';

  html += '<div class="access-info">';
  e.access.forEach(function (a) {
    html += '<div class="access-line">';
    html += '<span class="access-origin">' + SA.escapeHtml(a.originName) + 'から:</span>';
    html += '<span class="access-detail">乗換' + a.transfers + '回 / 約' + SA.formatMinutes(a.minutes) + '</span>';
    html += '</div>';
  });
  html += '</div>';
  html += '</li>';
  return html;
};

SA.renderResults = function (entries) {
  var state = SA.state;
  var resultsArea = SA.els.resultsArea;

  if (!entries || entries.length === 0) {
    resultsArea.innerHTML = '<div class="no-results">条件を満たす駅が見つかりませんでした</div>';
    return;
  }

  var prefs = {};
  entries.forEach(function (e) {
    var pName = SA.RD.prefNames[e.info.pref] || '';
    if (pName) prefs[e.info.pref] = pName;
  });

  var filtered = entries;
  if (state.currentPrefFilter) {
    filtered = entries.filter(function (e) { return e.info.pref == state.currentPrefFilter; });
  }

  var countText = state.currentPrefFilter
    ? filtered.length + ' / ' + entries.length + ' 駅'
    : entries.length + ' 駅が見つかりました';

  var html = '<div class="card"><div class="result-header">';
  html += '<span class="result-count">' + countText + '</span>';
  html += '<div class="result-controls">';
  html += '<select id="sort-select" aria-label="並び替え">';
  html += '<option value="name"' + (state.currentSort === 'name' ? ' selected' : '') + '>名前順</option>';
  html += '<option value="transfers"' + (state.currentSort === 'transfers' ? ' selected' : '') + '>乗換回数順</option>';
  html += '<option value="minMinutes"' + (state.currentSort === 'minMinutes' ? ' selected' : '') + '>所要時間順</option>';
  html += '<option value="avgMinutes"' + (state.currentSort === 'avgMinutes' ? ' selected' : '') + '>平均所要時間順</option>';
  html += '</select>';
  html += '<button class="sort-dir-btn" id="sort-dir-btn">' + (state.currentSortDir === 'asc' ? '↑昇順' : '↓降順') + '</button>';

  var validOrigins = state.origins.filter(function (o) { return o.groupId; });
  if ((state.currentSort === 'transfers' || state.currentSort === 'minMinutes') && validOrigins.length >= 2) {
    html += '<select id="sort-origin-select" aria-label="基準駅">';
    html += '<option value=""' + (state.currentSortOrigin === '' ? ' selected' : '') + '>全駅</option>';
    validOrigins.forEach(function (o) {
      html += '<option value="' + o.name + '"' + (state.currentSortOrigin === o.name ? ' selected' : '') + '>' + SA.escapeHtml(o.name) + '</option>';
    });
    html += '</select>';
  }

  var prefKeys = Object.keys(prefs).sort(function (a, b) { return +a - +b; });
  if (prefKeys.length > 1) {
    html += '<select id="pref-filter" aria-label="都道府県フィルタ">';
    html += '<option value="">全都道府県</option>';
    prefKeys.forEach(function (pk) {
      html += '<option value="' + pk + '"' + (state.currentPrefFilter == pk ? ' selected' : '') + '>' + SA.escapeHtml(prefs[pk]) + '</option>';
    });
    html += '</select>';
  }
  html += '<div class="view-toggle" id="view-toggle">';
  html += '<button data-view="list"' + (!state.resultsMapView ? ' class="active"' : '') + '>一覧</button>';
  html += '<button data-view="map"' + (state.resultsMapView ? ' class="active"' : '') + '>地図</button>';
  html += '</div>';
  html += '<button class="btn-share" id="btn-share">共有</button>';
  html += '</div></div>';

  filtered = SA.sortEntries(filtered, state.currentSort, state.currentSortDir, state.currentSortOrigin);

  if (state.resultsMapView) {
    html += '<div id="results-map-container"></div>';
  } else {
    var totalPages = Math.ceil(filtered.length / state.PAGE_SIZE);
    if (state.currentPage >= totalPages) state.currentPage = totalPages - 1;
    if (state.currentPage < 0) state.currentPage = 0;
    var start = state.currentPage * state.PAGE_SIZE;
    var pageItems = filtered.slice(start, start + state.PAGE_SIZE);

    html += '<ul class="station-list">';
    pageItems.forEach(function (e) { html += SA.renderStationItem(e); });
    html += '</ul>';

    if (totalPages > 1) {
      html += '<div class="paging">';
      html += '<button data-page="prev"' + (state.currentPage === 0 ? ' disabled' : '') + '>&lt;</button>';
      for (var p = 0; p < totalPages; p++) {
        if (totalPages > 7 && Math.abs(p - state.currentPage) > 2 && p !== 0 && p !== totalPages - 1) {
          if (p === 1 || p === totalPages - 2) html += '<button disabled>…</button>';
          continue;
        }
        html += '<button data-page="' + p + '"' + (p === state.currentPage ? ' class="active"' : '') + '>' + (p + 1) + '</button>';
      }
      html += '<button data-page="next"' + (state.currentPage === totalPages - 1 ? ' disabled' : '') + '>&gt;</button>';
      html += '</div>';
    }
  }

  html += '</div>';
  SA.cleanupResultsMap();
  resultsArea.innerHTML = html;

  // View toggle
  var viewToggle = document.getElementById('view-toggle');
  if (viewToggle) {
    viewToggle.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.resultsMapView = btn.getAttribute('data-view') === 'map';
        SA.renderResults(state.results);
      });
    });
  }

  // Event listeners
  var sortSel = document.getElementById('sort-select');
  if (sortSel) sortSel.addEventListener('change', function () { state.currentSort = sortSel.value; state.currentPage = 0; SA.renderResults(state.results); });

  var sortDirBtn = document.getElementById('sort-dir-btn');
  if (sortDirBtn) sortDirBtn.addEventListener('click', function () {
    state.currentSortDir = state.currentSortDir === 'asc' ? 'desc' : 'asc';
    state.currentPage = 0;
    SA.renderResults(state.results);
  });

  var sortOriginSel = document.getElementById('sort-origin-select');
  if (sortOriginSel) sortOriginSel.addEventListener('change', function () {
    state.currentSortOrigin = sortOriginSel.value;
    state.currentPage = 0;
    SA.renderResults(state.results);
  });

  var prefFil = document.getElementById('pref-filter');
  if (prefFil) prefFil.addEventListener('change', function () { state.currentPrefFilter = prefFil.value; state.currentPage = 0; SA.renderResults(state.results); });

  var shareBtn = document.getElementById('btn-share');
  if (shareBtn) shareBtn.addEventListener('click', function () {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href).then(function () { if (window.__TT_showToast) window.__TT_showToast('URLをコピーしました'); });
    }
  });

  if (state.resultsMapView) {
    setTimeout(function () { SA.initResultsMap(filtered); }, 50);
  } else {
    // Paging
    resultsArea.querySelectorAll('.paging button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = btn.getAttribute('data-page');
        if (p === 'prev') state.currentPage--;
        else if (p === 'next') state.currentPage++;
        else state.currentPage = parseInt(p);
        SA.renderResults(state.results);
        resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Station click -> detail view
    resultsArea.querySelectorAll('.station-item').forEach(function (el) {
      el.addEventListener('click', function () {
        var gid = el.getAttribute('data-gid');
        if (gid) {
          SA.showDetailView(gid);
          SA.saveToHash();
          window.scrollTo(0, 0);
        }
      });
    });
  }
};
