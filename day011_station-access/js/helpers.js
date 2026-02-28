window.SA = window.SA || {};

SA.katakanaToHiragana = function (str) {
  return str.replace(/[\u30A1-\u30F6]/g, function (m) {
    return String.fromCharCode(m.charCodeAt(0) - 0x60);
  });
};

SA.formatMinutes = function (m) {
  if (m === 0) return '0分';
  var total = Math.round(m);
  var h = Math.floor(total / 60);
  var min = total % 60;
  if (h > 0) return h + '時間' + (min > 0 ? min + '分' : '');
  return min + '分';
};

SA.isLightColor = function (hex) {
  var r = parseInt(hex.substr(0, 2), 16);
  var g = parseInt(hex.substr(2, 2), 16);
  var b = parseInt(hex.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
};

SA.ensureVisibleColor = function (hex) {
  var r = parseInt(hex.substr(0, 2), 16);
  var g = parseInt(hex.substr(2, 2), 16);
  var b = parseInt(hex.substr(4, 2), 16);
  var maxC = Math.max(r, g, b);
  var minC = Math.min(r, g, b);
  if (maxC - minC <= 30 && minC >= 50 && maxC <= 200) {
    return 'E8529A';
  }
  return hex;
};

SA.escapeHtml = function (str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
