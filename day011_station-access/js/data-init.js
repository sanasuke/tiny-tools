window.SA = window.SA || {};

(function () {
  'use strict';

  var RD = window.RAIL_DATA;
  if (!RD) {
    document.getElementById('results-area').innerHTML = '<div class="no-results">鉄道データの読み込みに失敗しました</div>';
    SA.initFailed = true;
    return;
  }

  // stationMap: sid -> {id, name, kana, groupId, pref, lat, lon, lines:[lineId...]}
  var stationMap = {};
  // groupMap: groupId -> [sid, ...]
  var groupMap = {};
  // lineMap: lineId -> {id, name, color, stationIds:[], interval}
  var lineMap = {};
  // adjacency: sid -> [{neighbor: sid, lineId}]
  var adjacency = {};
  // circularSet
  var circularSet = {};
  // groupInfo: groupId -> {id, name, kana, pref, lines:[{id,name,color}], sids:[]}
  var groupInfo = {};

  // Build lineMap
  RD.lines.forEach(function (l) {
    lineMap[l[0]] = { id: l[0], name: l[1], color: l[2], stationIds: l[3], interval: l[4] || 2.5 };
  });

  // Build stationMap
  RD.stations.forEach(function (s) {
    stationMap[s[0]] = { id: s[0], name: s[1], kana: s[2], groupId: s[3], pref: s[4], lat: s[5] || 0, lon: s[6] || 0, lines: [] };
    if (!groupMap[s[3]]) groupMap[s[3]] = [];
    groupMap[s[3]].push(s[0]);
  });

  // Circular set
  RD.circular.forEach(function (lid) { circularSet[lid] = true; });

  // Assign lines to stations & build adjacency
  RD.lines.forEach(function (l) {
    var lineId = l[0];
    var sids = l[3];
    var isCirc = !!circularSet[lineId];

    sids.forEach(function (sid) {
      if (stationMap[sid]) stationMap[sid].lines.push(lineId);
      if (!adjacency[sid]) adjacency[sid] = [];
    });

    for (var i = 0; i < sids.length; i++) {
      if (i > 0) {
        adjacency[sids[i]].push({ neighbor: sids[i - 1], lineId: lineId });
      }
      if (i < sids.length - 1) {
        adjacency[sids[i]].push({ neighbor: sids[i + 1], lineId: lineId });
      }
    }
    // Circular: connect last to first
    if (isCirc && sids.length > 2) {
      adjacency[sids[0]].push({ neighbor: sids[sids.length - 1], lineId: lineId });
      adjacency[sids[sids.length - 1]].push({ neighbor: sids[0], lineId: lineId });
    }
  });

  // Build groupInfo
  Object.keys(groupMap).forEach(function (gid) {
    var sids = groupMap[gid];
    var first = stationMap[sids[0]];
    var lineSet = {};
    var lines = [];
    sids.forEach(function (sid) {
      var st = stationMap[sid];
      st.lines.forEach(function (lid) {
        if (!lineSet[lid]) {
          lineSet[lid] = true;
          var li = lineMap[lid];
          if (li) lines.push({ id: li.id, name: li.name, color: li.color });
        }
      });
    });
    groupInfo[gid] = {
      id: gid,
      name: first.name,
      kana: first.kana,
      pref: first.pref,
      lines: lines,
      sids: sids
    };
  });

  // Search index
  var searchIndex = [];
  Object.keys(groupInfo).forEach(function (gid) {
    var g = groupInfo[gid];
    var kana = g.kana || '';
    searchIndex.push({
      gid: gid,
      name: g.name,
      kana: kana,
      kanaHira: kana ? SA.katakanaToHiragana(kana) : '',
      pref: g.pref
    });
  });

  // Sort: stations with more lines first (major hubs appear earlier)
  searchIndex.sort(function (a, b) {
    return (groupInfo[b.gid].lines.length) - (groupInfo[a.gid].lines.length);
  });

  // Export to namespace
  SA.RD = RD;
  SA.stationMap = stationMap;
  SA.groupMap = groupMap;
  SA.lineMap = lineMap;
  SA.adjacency = adjacency;
  SA.groupInfo = groupInfo;
  SA.searchIndex = searchIndex;
})();
