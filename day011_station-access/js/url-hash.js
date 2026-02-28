window.SA = window.SA || {};

SA.saveToHash = function () {
  var state = SA.state;
  var parts = [];
  state.origins.forEach(function (o) {
    if (!o.groupId) return;
    var p = 'o=' + encodeURIComponent(o.name) + ',g' + o.groupId;
    if (o.maxTransfers !== null) p += ',t' + o.maxTransfers;
    if (o.maxMinutes !== null) p += ',m' + o.maxMinutes;
    parts.push(p);
  });
  var hash = parts.join('|');
  if (state.currentDetailGid) {
    hash += '&d=' + state.currentDetailGid;
  }
  if (hash) {
    history.pushState(null, '', '#' + hash);
  }
};

SA.loadFromHash = function () {
  var state = SA.state;
  var hash = location.hash.substring(1);
  if (!hash) return false;

  // Parse detail gid
  var detailGid = null;
  var mainPart = hash;
  var ampIdx = hash.indexOf('&d=');
  if (ampIdx !== -1) {
    detailGid = hash.substring(ampIdx + 3);
    mainPart = hash.substring(0, ampIdx);
  }

  var parts = mainPart.split('|');
  var loaded = [];
  parts.forEach(function (part) {
    if (!part) return;
    var params = {};
    part.split(',').forEach(function (kv) {
      if (kv.indexOf('o=') === 0) params.name = decodeURIComponent(kv.substring(2));
      else if (kv.charAt(0) === 'g') params.groupId = kv.substring(1);
      else if (kv.charAt(0) === 't') params.transfers = parseInt(kv.substring(1));
      else if (kv.charAt(0) === 'm') params.minutes = parseInt(kv.substring(1));
    });
    if (params.name) {
      var match = null;
      if (params.groupId && SA.groupInfo[params.groupId]) {
        match = { gid: params.groupId, name: SA.groupInfo[params.groupId].name };
      } else {
        match = SA.searchIndex.find(function (s) { return s.name === params.name; });
      }
      if (match) {
        loaded.push({
          gid: match.gid, name: match.name,
          transfers: params.transfers !== undefined ? params.transfers : 1,
          minutes: params.minutes !== undefined ? params.minutes : undefined
        });
      }
    }
  });

  if (loaded.length > 0) {
    loaded.forEach(function (l) { SA.addOriginRow(l.gid, l.name, l.transfers, l.minutes); });
    if (detailGid) {
      state.currentDetailGid = detailGid;
      setTimeout(function () {
        SA.runSearchThen(function () {
          SA.showDetailView(detailGid);
        });
      }, 100);
    }
    return true;
  }
  return false;
};

// Handle browser back/forward
window.addEventListener('popstate', function () {
  var hash = location.hash.substring(1);
  var ampIdx = hash.indexOf('&d=');
  if (ampIdx !== -1) {
    var detailGid = hash.substring(ampIdx + 3);
    if (detailGid && SA.groupInfo[detailGid]) {
      SA.showDetailView(detailGid);
      return;
    }
  }
  if (SA.state.currentDetailGid) {
    SA.showSearchView();
  }
});
