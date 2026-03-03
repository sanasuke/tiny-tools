window.SA = window.SA || {};

(function () {
  'use strict';

  if (SA.initFailed) return;

  // Initialize shared state
  SA.state = {
    origins: [],
    results: null,
    currentSort: 'minMinutes',
    currentSortDir: 'asc',
    currentSortOrigin: '',
    currentPrefFilter: '',
    currentPage: 0,
    PAGE_SIZE: 20,
    leafletMap: null,
    resultsMapView: false,
    resultsLeafletMap: null,
    currentDetailGid: null
  };

  // DOM references
  SA.els = {
    searchView: document.getElementById('search-view'),
    detailView: document.getElementById('detail-view'),
    detailContent: document.getElementById('detail-content'),
    originsEl: document.getElementById('origins'),
    btnAdd: document.getElementById('btn-add-origin'),
    btnSearch: document.getElementById('btn-search'),
    resultsArea: document.getElementById('results-area'),
    btnBack: document.getElementById('btn-back')
  };

  // Wire event listeners
  SA.els.btnBack.addEventListener('click', function () {
    SA.showSearchView();
    SA.saveToHash();
    window.scrollTo(0, 0);
  });

  SA.els.btnAdd.addEventListener('click', function () { SA.addOriginRow(); });
  SA.els.btnSearch.addEventListener('click', function () { SA.runSearch(); });

  // Init
  if (!SA.loadFromHash()) {
    SA.addOriginRow();
  } else if (!SA.state.currentDetailGid) {
    setTimeout(SA.runSearch, 100);
  }
})();
