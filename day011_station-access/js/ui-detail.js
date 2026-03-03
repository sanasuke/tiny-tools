window.SA = window.SA || {};

SA.showSearchView = function () {
  var state = SA.state;
  SA.els.searchView.style.display = 'block';
  SA.els.detailView.style.display = 'none';
  state.currentDetailGid = null;
  if (state.leafletMap) { state.leafletMap.remove(); state.leafletMap = null; }
};

SA.showDetailView = function (targetGid) {
  var state = SA.state;
  state.currentDetailGid = targetGid;
  SA.cleanupResultsMap();
  SA.els.searchView.style.display = 'none';
  SA.els.detailView.style.display = 'block';
  SA.renderDetailView(targetGid);
};

SA.renderDetailView = function (targetGid) {
  var state = SA.state;
  var g = SA.groupInfo[targetGid];
  if (!g) { SA.showSearchView(); return; }

  var validOrigins = state.origins.filter(function (o) { return o.groupId; });
  if (validOrigins.length === 0) { SA.showSearchView(); return; }

  // Build routes
  var routes = [];
  validOrigins.forEach(function (o) {
    var path = SA.findPath(o.groupId, targetGid, o.maxTransfers, o.maxMinutes);
    routes.push({ originName: o.name, path: path });
  });

  var html = '';

  // Station header card
  html += '<div class="card">';
  html += '<div class="detail-header">';
  html += '<span class="detail-station-name">' + SA.escapeHtml(g.name) + '</span>';
  html += '<span class="detail-pref">' + SA.escapeHtml(SA.RD.prefNames[g.pref] || '') + '</span>';
  html += '</div>';
  html += '<div class="line-badges">';
  g.lines.forEach(function (l) {
    var bg = '#' + SA.ensureVisibleColor(l.color);
    var textColor = SA.isLightColor(l.color) ? '#333' : '#fff';
    html += '<span class="line-badge" style="background:' + bg + ';color:' + textColor + '">' + SA.escapeHtml(l.name) + '</span>';
  });
  html += '</div>';
  html += '</div>';

  // Map container
  html += '<div id="map-container"></div>';

  // Route details
  html += '<div class="route-section">';
  html += '<div class="card-title route-section-title">ルート詳細</div>';

  var ROUTE_COLORS = ['#e55', '#47a', '#3a3', '#d80', '#a5d'];

  routes.forEach(function (route, ri) {
    html += '<div class="route-card">';
    html += '<div class="route-card-header">';
    html += '<span>' + SA.escapeHtml(route.originName) + 'から</span>';
    if (route.path) {
      html += '<span class="route-summary">乗換' + route.path.totalTransfers + '回 / 約' + SA.formatMinutes(route.path.totalMinutes) + '</span>';
    } else {
      html += '<span class="route-summary">経路なし</span>';
    }
    html += '</div>';

    if (route.path && route.path.segments.length > 0) {
      html += '<div class="route-timeline">';
      route.path.segments.forEach(function (seg, si) {
        if (si > 0) {
          html += '<div class="segment-transfer">乗換</div>';
        }
        var color = '#' + SA.ensureVisibleColor(seg.lineColor);
        html += '<div class="route-segment">';
        html += '<div class="segment-line-bar" style="background:' + color + '"></div>';
        html += '<div class="segment-content">';
        html += '<div class="segment-line-name" style="color:' + color + '">' + SA.escapeHtml(seg.lineName) + '</div>';
        var first = seg.stations[0];
        var last = seg.stations[seg.stations.length - 1];
        html += '<div class="segment-stations">' + SA.escapeHtml(first.name) + ' → ' + SA.escapeHtml(last.name) + '（' + seg.stations.length + '駅）</div>';
        html += '</div></div>';
      });
      html += '</div>';
    }
    html += '</div>';
  });

  html += '</div>';
  SA.els.detailContent.innerHTML = html;

  // Init Leaflet map
  setTimeout(function () { SA.initMap(routes, ROUTE_COLORS); }, 50);
};
