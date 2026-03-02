window.SA = window.SA || {};

/* ========== MinHeap ========== */
function MinHeap() { this.data = []; }
MinHeap.prototype.push = function (item) {
  this.data.push(item);
  this._bubbleUp(this.data.length - 1);
};
MinHeap.prototype.pop = function () {
  var top = this.data[0];
  var last = this.data.pop();
  if (this.data.length > 0) { this.data[0] = last; this._sinkDown(0); }
  return top;
};
MinHeap.prototype.size = function () { return this.data.length; };
MinHeap.prototype._bubbleUp = function (i) {
  while (i > 0) {
    var p = (i - 1) >> 1;
    if (this.data[p].cost <= this.data[i].cost) break;
    var tmp = this.data[p]; this.data[p] = this.data[i]; this.data[i] = tmp;
    i = p;
  }
};
MinHeap.prototype._sinkDown = function (i) {
  var n = this.data.length;
  while (true) {
    var l = 2 * i + 1, r = 2 * i + 2, smallest = i;
    if (l < n && this.data[l].cost < this.data[smallest].cost) smallest = l;
    if (r < n && this.data[r].cost < this.data[smallest].cost) smallest = r;
    if (smallest === i) break;
    var tmp = this.data[smallest]; this.data[smallest] = this.data[i]; this.data[i] = tmp;
    i = smallest;
  }
};

/* ========== searchReachable ========== */
SA.searchReachable = function (originGroupId, maxTransfers, maxMinutes) {
  var stationMap = SA.stationMap, groupMap = SA.groupMap, lineMap = SA.lineMap, adjacency = SA.adjacency;

  if (maxTransfers === null && maxMinutes === null) return {};
  var mt = maxTransfers !== null ? maxTransfers : 99;
  var mm = maxMinutes !== null ? maxMinutes : 9999;

  var originSids = groupMap[originGroupId] || [];
  if (originSids.length === 0) return {};

  var best = {};
  function key(sid, t) { return sid + '_' + t; }

  var heap = new MinHeap();

  originSids.forEach(function (sid) {
    var st = stationMap[sid];
    if (!st) return;
    st.lines.forEach(function (lid) {
      var k = key(sid, 0);
      if (best[k] === undefined || best[k] > 0) {
        best[k] = 0;
        heap.push({ sid: sid, lineId: lid, transfers: 0, cost: 0 });
      }
    });
  });

  var groupResults = {};

  while (heap.size() > 0) {
    var cur = heap.pop();
    var cSid = cur.sid, cLine = cur.lineId, cT = cur.transfers, cMin = cur.cost;

    if (cT > mt || cMin > mm) continue;
    var k = key(cSid, cT);
    if (best[k] !== undefined && best[k] < cMin) continue;

    var gid = stationMap[cSid].groupId;
    var existing = groupResults[gid];
    if (!existing || cMin < existing.minutes || (cMin === existing.minutes && cT < existing.transfers)) {
      groupResults[gid] = { transfers: cT, minutes: cMin };
    }

    var lineInterval = lineMap[cLine] ? lineMap[cLine].interval : 2.5;
    var adj = adjacency[cSid] || [];
    for (var i = 0; i < adj.length; i++) {
      if (adj[i].lineId !== cLine) continue;
      var nSid = adj[i].neighbor;
      var nMin = cMin + lineInterval;
      if (nMin > mm) continue;
      var nk = key(nSid, cT);
      if (best[nk] === undefined || best[nk] > nMin) {
        best[nk] = nMin;
        heap.push({ sid: nSid, lineId: cLine, transfers: cT, cost: nMin });
      }
    }

    var nT = cT + 1;
    if (nT <= mt) {
      var gSids = groupMap[gid] || [];
      for (var g = 0; g < gSids.length; g++) {
        var tSid = gSids[g];
        var tSt = stationMap[tSid];
        if (!tSt) continue;
        for (var li = 0; li < tSt.lines.length; li++) {
          var tLine = tSt.lines[li];
          if (tSid === cSid && tLine === cLine) continue;
          var tMin = cMin + 5;
          if (tMin > mm) continue;
          var tk = key(tSid, nT);
          if (best[tk] === undefined || best[tk] > tMin) {
            best[tk] = tMin;
            heap.push({ sid: tSid, lineId: tLine, transfers: nT, cost: tMin });
          }
        }
      }
    }
  }

  return groupResults;
};

/* ========== findPath ========== */
SA.findPath = function (originGroupId, targetGroupId, maxTransfers, maxMinutes) {
  var stationMap = SA.stationMap, groupMap = SA.groupMap, lineMap = SA.lineMap, adjacency = SA.adjacency;

  var mt = maxTransfers !== null ? maxTransfers : 99;
  var mm = maxMinutes !== null ? maxMinutes : 9999;

  var originSids = groupMap[originGroupId] || [];
  var targetSids = groupMap[targetGroupId] || [];
  if (originSids.length === 0 || targetSids.length === 0) return null;

  var targetSidSet = {};
  targetSids.forEach(function (sid) { targetSidSet[sid] = true; });

  var best = {};
  var parent = {};
  function key(sid, t) { return sid + '_' + t; }

  var heap = new MinHeap();

  originSids.forEach(function (sid) {
    var st = stationMap[sid];
    if (!st) return;
    st.lines.forEach(function (lid) {
      var k = key(sid, 0);
      if (best[k] === undefined || best[k] > 0) {
        best[k] = 0;
        heap.push({ sid: sid, lineId: lid, transfers: 0, cost: 0 });
        parent[k] = null;
      }
    });
  });

  var foundKey = null;
  var foundCost = Infinity;

  while (heap.size() > 0) {
    var cur = heap.pop();
    var cSid = cur.sid, cLine = cur.lineId, cT = cur.transfers, cMin = cur.cost;

    if (cMin > foundCost) break;
    if (cT > mt || cMin > mm) continue;
    var k = key(cSid, cT);
    if (best[k] !== undefined && best[k] < cMin) continue;

    if (targetSidSet[cSid] && cMin <= foundCost) {
      foundKey = k;
      foundCost = cMin;
    }

    var lineInterval = lineMap[cLine] ? lineMap[cLine].interval : 2.5;
    var adj = adjacency[cSid] || [];
    for (var i = 0; i < adj.length; i++) {
      if (adj[i].lineId !== cLine) continue;
      var nSid = adj[i].neighbor;
      var nMin = cMin + lineInterval;
      if (nMin > mm) continue;
      var nk = key(nSid, cT);
      if (best[nk] === undefined || best[nk] > nMin) {
        best[nk] = nMin;
        parent[nk] = { pSid: cSid, pT: cT, lineId: cLine, isTransfer: false };
        heap.push({ sid: nSid, lineId: cLine, transfers: cT, cost: nMin });
      }
    }

    var nT = cT + 1;
    if (nT <= mt) {
      var gid = stationMap[cSid].groupId;
      var gSids = groupMap[gid] || [];
      for (var g = 0; g < gSids.length; g++) {
        var tSid = gSids[g];
        var tSt = stationMap[tSid];
        if (!tSt) continue;
        for (var li = 0; li < tSt.lines.length; li++) {
          var tLine = tSt.lines[li];
          if (tSid === cSid && tLine === cLine) continue;
          var tMin = cMin + 5;
          if (tMin > mm) continue;
          var tk = key(tSid, nT);
          if (best[tk] === undefined || best[tk] > tMin) {
            best[tk] = tMin;
            parent[tk] = { pSid: cSid, pT: cT, lineId: tLine, isTransfer: true };
            heap.push({ sid: tSid, lineId: tLine, transfers: nT, cost: tMin });
          }
        }
      }
    }
  }

  if (!foundKey) return null;

  // Reconstruct path
  var path = [];
  var ck = foundKey;
  while (ck && parent[ck] !== undefined) {
    var parts = ck.split('_');
    var sid = parseInt(parts[0]);
    var p = parent[ck];
    if (p === null) {
      path.unshift({ sid: sid, lineId: null, isTransfer: false });
      break;
    }
    path.unshift({ sid: sid, lineId: p.lineId, isTransfer: p.isTransfer });
    ck = key(p.pSid, p.pT);
  }

  // Build segments from path
  var segments = [];
  var currentSeg = null;

  for (var pi = 0; pi < path.length; pi++) {
    var step = path[pi];
    var st = stationMap[step.sid];
    if (!st) continue;

    if (pi === 0 || step.isTransfer) {
      if (currentSeg) segments.push(currentSeg);
      var effectiveLineId = step.lineId;
      if (effectiveLineId == null && pi + 1 < path.length) {
        effectiveLineId = path[pi + 1].lineId;
      }
      var line = lineMap[effectiveLineId];
      currentSeg = {
        lineId: step.lineId,
        lineName: line ? line.name : '?',
        lineColor: line ? line.color : '999999',
        stations: [{ name: st.name, lat: st.lat, lon: st.lon }]
      };
    } else {
      if (currentSeg) {
        currentSeg.stations.push({ name: st.name, lat: st.lat, lon: st.lon });
      }
    }
  }
  if (currentSeg) segments.push(currentSeg);

  // Calculate total
  var totalT = 0;
  if (segments.length > 1) totalT = segments.length - 1;
  var totalMin = foundCost;

  return { totalMinutes: totalMin, totalTransfers: totalT, segments: segments };
};
