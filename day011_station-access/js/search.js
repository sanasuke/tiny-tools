window.SA = window.SA || {};

SA.searchStations = function (query, limit) {
  if (!query) return [];
  limit = limit || 20;
  var q = query.toLowerCase();
  var qHira = SA.katakanaToHiragana(q);
  var exact = [];
  var prefix = [];
  var partial = [];

  var searchIndex = SA.searchIndex;
  for (var i = 0; i < searchIndex.length; i++) {
    var s = searchIndex[i];
    var nameMatch = s.name.indexOf(q) !== -1;
    var kanaMatch = s.kana && s.kana.toLowerCase().indexOf(q) !== -1;
    var hiraMatch = s.kanaHira && s.kanaHira.indexOf(qHira) !== -1;

    if (!nameMatch && !kanaMatch && !hiraMatch) continue;

    if (s.name === q) { exact.push(s); }
    else if (s.name.indexOf(q) === 0) { prefix.push(s); }
    else { partial.push(s); }

    if (exact.length + prefix.length + partial.length >= limit * 2) break;
  }
  return exact.concat(prefix).concat(partial).slice(0, limit);
};

SA.executeSearch = function (options) {
  var showLoading = options.showLoading !== false;
  var resetPaging = options.resetPaging !== false;
  var doSaveHash = options.saveHash !== false;
  var callback = options.callback || null;

  var state = SA.state;
  var origins = state.origins;
  var resultsArea = SA.els.resultsArea;

  var validOrigins = origins.filter(function (o) { return o.groupId; });
  if (validOrigins.length === 0) {
    if (showLoading) resultsArea.innerHTML = '<div class="no-results">出発地を選択してください</div>';
    return;
  }

  var hasNoConstraint = validOrigins.some(function (o) {
    return o.maxTransfers === null && o.maxMinutes === null;
  });
  if (hasNoConstraint) {
    if (showLoading) resultsArea.innerHTML = '<div class="no-results">乗換回数または所要時間の条件を1つ以上設定してください</div>';
    return;
  }

  if (showLoading) {
    resultsArea.innerHTML = '<div class="loading"><div class="loading-spinner"></div>検索中…</div>';
  }

  var groupInfo = SA.groupInfo;

  setTimeout(function () {
    var allResults = [];
    validOrigins.forEach(function (o) {
      allResults.push({ origin: o, reachable: SA.searchReachable(o.groupId, o.maxTransfers, o.maxMinutes) });
    });

    if (allResults.length === 0) { SA.renderResults([]); return; }

    var commonGids;
    if (allResults.length === 1) {
      commonGids = Object.keys(allResults[0].reachable);
    } else {
      commonGids = Object.keys(allResults[0].reachable);
      for (var r = 1; r < allResults.length; r++) {
        var rr = allResults[r].reachable;
        commonGids = commonGids.filter(function (gid) { return rr[gid] !== undefined; });
      }
    }

    var entries = [];
    commonGids.forEach(function (gid) {
      var g = groupInfo[gid];
      if (!g) return;
      var access = [];
      allResults.forEach(function (ar) {
        var info = ar.reachable[gid];
        access.push({ originName: ar.origin.name, originGroupId: ar.origin.groupId, transfers: info.transfers, minutes: info.minutes, maxTransfers: ar.origin.maxTransfers, maxMinutes: ar.origin.maxMinutes });
      });
      entries.push({
        gid: gid, info: g, access: access,
        totalTransfers: access.reduce(function (s, a) { return s + a.transfers; }, 0),
        totalMinutes: access.reduce(function (s, a) { return s + a.minutes; }, 0),
        maxTransfers: Math.max.apply(null, access.map(function (a) { return a.transfers; })),
        maxMinutes: Math.max.apply(null, access.map(function (a) { return a.minutes; })),
        minMinutes: Math.min.apply(null, access.map(function (a) { return a.minutes; }))
      });
    });

    var originGids = {};
    validOrigins.forEach(function (o) { originGids[o.groupId] = true; });
    entries = entries.filter(function (e) { return !originGids[e.gid]; });

    state.results = entries;
    if (resetPaging) {
      state.currentPage = 0;
      state.currentPrefFilter = '';
    }
    SA.renderResults(entries);
    if (doSaveHash) SA.saveToHash();
    if (callback) callback();
  }, 30);
};

SA.runSearch = function () {
  SA.executeSearch({ showLoading: true, resetPaging: true, saveHash: true });
};

SA.runSearchThen = function (callback) {
  SA.executeSearch({ showLoading: false, resetPaging: false, saveHash: false, callback: callback });
};
