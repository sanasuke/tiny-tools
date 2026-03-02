/* ===== Pomodoro Storage (localStorage) ===== */
var Pomodoro = Pomodoro || {};

(function (P) {
  'use strict';

  var SETTINGS_KEY = 'pomodoro-settings-v1';
  var STATS_KEY = 'pomodoro-stats-v1';

  function getTodayStr() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  /* ----- Settings ----- */
  function loadSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) { /* ignore */ }
  }

  /* ----- Stats ----- */
  function loadStats() {
    try {
      var raw = localStorage.getItem(STATS_KEY);
      if (!raw) return freshStats();
      var stats = JSON.parse(raw);
      // Date boundary check: reset if different day
      if (stats.date !== getTodayStr()) {
        return freshStats();
      }
      return stats;
    } catch (e) {
      return freshStats();
    }
  }

  function saveStats(stats) {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) { /* ignore */ }
  }

  function freshStats() {
    return {
      date: getTodayStr(),
      sessions: [],
      totalWorkSeconds: 0
    };
  }

  function addSession(stats, session) {
    stats.sessions.push(session);
    stats.totalWorkSeconds += session.durationMin * 60;
    stats.date = getTodayStr();
    saveStats(stats);
    return stats;
  }

  function clearStats() {
    var stats = freshStats();
    saveStats(stats);
    return stats;
  }

  /* ----- Expose ----- */
  P.Storage = {
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    loadStats: loadStats,
    saveStats: saveStats,
    addSession: addSession,
    clearStats: clearStats
  };

})(Pomodoro);
