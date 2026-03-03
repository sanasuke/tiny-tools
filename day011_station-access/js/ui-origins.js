window.SA = window.SA || {};

SA.addOriginRow = function (presetGroupId, presetName, presetTransfers, presetMinutes) {
  var state = SA.state;
  var origins = state.origins;
  if (origins.length >= 5) return;

  var row = document.createElement('tr');

  var origin = {
    groupId: presetGroupId || null,
    name: presetName || '',
    maxTransfers: presetTransfers !== undefined ? presetTransfers : 1,
    maxMinutes: presetMinutes !== undefined ? presetMinutes : null,
    el: row
  };

  // Station name cell
  var tdStation = document.createElement('td');
  var inputWrap = document.createElement('div');
  inputWrap.className = 'origin-input-wrap';

  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'origin-input';
  input.placeholder = '駅名を入力…';
  input.setAttribute('autocomplete', 'off');
  if (presetName) {
    input.value = presetName;
    input.classList.add('has-value');
  }

  var dropdown = document.createElement('div');
  dropdown.className = 'ac-dropdown';

  var activeIdx = -1;
  var acItems = [];

  function showAC(query) {
    var matches = SA.searchStations(query);
    dropdown.innerHTML = '';
    acItems = [];
    activeIdx = -1;
    if (matches.length === 0) { dropdown.classList.remove('open'); return; }
    matches.forEach(function (m) {
      var item = document.createElement('div');
      item.className = 'ac-item';
      var g = SA.groupInfo[m.gid];
      var lineNames = g.lines.slice(0, 3).map(function (l) { return l.name; }).join(', ');
      if (g.lines.length > 3) lineNames += '…';
      item.innerHTML = '<span class="ac-item-name">' + SA.escapeHtml(m.name) + '</span>' +
        '<span><span class="ac-item-lines">' + SA.escapeHtml(lineNames) + '</span>' +
        '<span class="ac-item-pref">' + SA.escapeHtml(SA.RD.prefNames[m.pref] || '') + '</span></span>';
      item.addEventListener('mousedown', function (e) { e.preventDefault(); selectStation(m); });
      dropdown.appendChild(item);
      acItems.push(item);
    });
    dropdown.classList.add('open');
  }

  function selectStation(m) {
    origin.groupId = m.gid;
    origin.name = m.name;
    input.value = m.name;
    input.classList.add('has-value');
    dropdown.classList.remove('open');
    SA.updateSearchButtonState();
  }

  input.addEventListener('input', function () {
    origin.groupId = null; origin.name = '';
    input.classList.remove('has-value');
    SA.updateSearchButtonState();
    showAC(input.value.trim());
  });
  input.addEventListener('focus', function () {
    if (input.value.trim()) showAC(input.value.trim());
  });
  input.addEventListener('blur', function () {
    setTimeout(function () { dropdown.classList.remove('open'); }, 150);
  });
  input.addEventListener('keydown', function (e) {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (acItems.length > 0) { activeIdx = (activeIdx + 1) % acItems.length; updateActiveAC(); }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (acItems.length > 0) { activeIdx = (activeIdx - 1 + acItems.length) % acItems.length; updateActiveAC(); }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (dropdown.classList.contains('open') && activeIdx >= 0) {
        var matches = SA.searchStations(input.value.trim());
        if (matches[activeIdx]) selectStation(matches[activeIdx]);
      } else if (dropdown.classList.contains('open')) {
        var matches2 = SA.searchStations(input.value.trim());
        if (matches2.length === 1) selectStation(matches2[0]);
      } else if (origin.groupId) {
        SA.runSearch();
      }
    } else if (e.key === 'Escape') { dropdown.classList.remove('open'); }
  });

  function updateActiveAC() {
    acItems.forEach(function (el, i) { el.classList.toggle('active', i === activeIdx); });
    if (activeIdx >= 0 && acItems[activeIdx]) acItems[activeIdx].scrollIntoView({ block: 'nearest' });
  }

  inputWrap.appendChild(input);
  inputWrap.appendChild(dropdown);
  tdStation.appendChild(inputWrap);
  row.appendChild(tdStation);

  // Transfers cell
  var tdTransfers = document.createElement('td');
  var tInput = document.createElement('input'); tInput.type = 'number'; tInput.min = '0'; tInput.max = '10';
  tInput.className = 'cond-number';
  tInput.value = origin.maxTransfers !== null ? origin.maxTransfers : '1';
  tInput.addEventListener('input', function () { origin.maxTransfers = parseInt(tInput.value) || 0; });
  tdTransfers.appendChild(tInput);
  row.appendChild(tdTransfers);

  // Minutes cell
  var tdMinutes = document.createElement('td');
  var mInput = document.createElement('input'); mInput.type = 'number'; mInput.min = '1'; mInput.max = '180';
  mInput.className = 'cond-number';
  mInput.value = presetMinutes || '';
  mInput.placeholder = '-';
  mInput.addEventListener('input', function () {
    var v = parseInt(mInput.value);
    origin.maxMinutes = v > 0 ? v : null;
  });
  origin.maxMinutes = presetMinutes || null;
  tdMinutes.appendChild(mInput);
  row.appendChild(tdMinutes);

  // Remove button cell
  var tdRemove = document.createElement('td');
  var removeBtn = document.createElement('button');
  removeBtn.className = 'remove-origin'; removeBtn.textContent = '×'; removeBtn.title = '削除';
  removeBtn.addEventListener('click', function () {
    var i = origins.indexOf(origin);
    if (i >= 0) { origins.splice(i, 1); row.remove(); }
    if (origins.length < 5) SA.els.btnAdd.style.display = '';
    SA.updateRemoveButtons();
    SA.updateSearchButtonState();
  });
  tdRemove.appendChild(removeBtn);
  row.appendChild(tdRemove);

  SA.els.originsEl.appendChild(row);
  origins.push(origin);
  if (origins.length >= 5) SA.els.btnAdd.style.display = 'none';
  SA.updateRemoveButtons();
  SA.updateSearchButtonState();
  if (!presetGroupId) input.focus();
};

SA.updateRemoveButtons = function () {
  var origins = SA.state.origins;
  var btns = SA.els.originsEl.querySelectorAll('.remove-origin');
  for (var i = 0; i < btns.length; i++) {
    btns[i].style.visibility = origins.length <= 1 ? 'hidden' : 'visible';
  }
};

SA.updateSearchButtonState = function () {
  var hasValid = SA.state.origins.some(function (o) { return o.groupId; });
  SA.els.btnSearch.disabled = !hasValid;
};
