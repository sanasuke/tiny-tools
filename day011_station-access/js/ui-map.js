window.SA = window.SA || {};

SA.cleanupResultsMap = function () {
  var state = SA.state;
  if (state.resultsLeafletMap) { state.resultsLeafletMap.remove(); state.resultsLeafletMap = null; }
};

SA.initResultsMap = function (filteredEntries) {
  var state = SA.state;
  SA.cleanupResultsMap();
  var mapEl = document.getElementById('results-map-container');
  if (!mapEl) return;

  state.resultsLeafletMap = L.map(mapEl, { zoomControl: true });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(state.resultsLeafletMap);

  var allBounds = [];

  // Origin markers (red)
  var validOrigins = state.origins.filter(function (o) { return o.groupId; });
  validOrigins.forEach(function (o) {
    var g = SA.groupInfo[o.groupId];
    if (!g) return;
    var sids = g.sids;
    for (var i = 0; i < sids.length; i++) {
      var st = SA.stationMap[sids[i]];
      if (st && st.lat && st.lon) {
        L.circleMarker([st.lat, st.lon], {
          radius: 8, color: '#e55', fillColor: '#e55', fillOpacity: 1, weight: 2
        }).bindTooltip(o.name + '（出発）', { permanent: false }).addTo(state.resultsLeafletMap);
        allBounds.push([st.lat, st.lon]);
        break;
      }
    }
  });

  // Result markers (blue)
  filteredEntries.forEach(function (e) {
    var sids = e.info.sids;
    for (var i = 0; i < sids.length; i++) {
      var st = SA.stationMap[sids[i]];
      if (st && st.lat && st.lon) {
        var marker = L.circleMarker([st.lat, st.lon], {
          radius: 5, color: '#4a90d9', fillColor: '#4a90d9', fillOpacity: 0.8, weight: 1
        });
        marker.bindTooltip(e.info.name);
        (function (gid) {
          marker.on('click', function () {
            SA.showDetailView(gid);
            SA.saveToHash();
            window.scrollTo(0, 0);
          });
        })(e.gid);
        marker.addTo(state.resultsLeafletMap);
        allBounds.push([st.lat, st.lon]);
        break;
      }
    }
  });

  if (allBounds.length > 0) {
    state.resultsLeafletMap.fitBounds(allBounds, { padding: [30, 30] });
  } else {
    state.resultsLeafletMap.setView([36.5, 138], 6);
  }
};

SA.initMap = function (routes, routeColors) {
  var state = SA.state;
  if (state.leafletMap) { state.leafletMap.remove(); state.leafletMap = null; }

  var mapEl = document.getElementById('map-container');
  if (!mapEl) return;

  state.leafletMap = L.map(mapEl, { zoomControl: true });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(state.leafletMap);

  var allBounds = [];

  routes.forEach(function (route, ri) {
    if (!route.path || route.path.segments.length === 0) return;
    var routeColor = routeColors[ri % routeColors.length];

    route.path.segments.forEach(function (seg) {
      var latlngs = [];
      seg.stations.forEach(function (st) {
        if (st.lat && st.lon) {
          latlngs.push([st.lat, st.lon]);
          allBounds.push([st.lat, st.lon]);
        }
      });
      if (latlngs.length > 1) {
        L.polyline(latlngs, {
          color: '#' + SA.ensureVisibleColor(seg.lineColor),
          weight: 4,
          opacity: 0.85
        }).addTo(state.leafletMap);
      }
    });

    // Markers for origin and target
    var firstSeg = route.path.segments[0];
    var lastSeg = route.path.segments[route.path.segments.length - 1];
    if (firstSeg && firstSeg.stations.length > 0) {
      var origin = firstSeg.stations[0];
      if (origin.lat && origin.lon) {
        L.circleMarker([origin.lat, origin.lon], {
          radius: 7, color: routeColor, fillColor: routeColor,
          fillOpacity: 1, weight: 2
        }).bindTooltip(route.originName, { permanent: false }).addTo(state.leafletMap);
      }
    }
    if (lastSeg && lastSeg.stations.length > 0) {
      var dest = lastSeg.stations[lastSeg.stations.length - 1];
      if (dest.lat && dest.lon) {
        L.circleMarker([dest.lat, dest.lon], {
          radius: 8, color: '#333', fillColor: '#fff',
          fillOpacity: 1, weight: 3
        }).bindTooltip(dest.name, { permanent: false }).addTo(state.leafletMap);
      }
    }
  });

  if (allBounds.length > 0) {
    state.leafletMap.fitBounds(allBounds, { padding: [30, 30] });
  } else {
    state.leafletMap.setView([36.5, 138], 6);
  }
};
