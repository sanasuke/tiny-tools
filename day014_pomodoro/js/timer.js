/* ===== Pomodoro Timer Core ===== */
var Pomodoro = Pomodoro || {};

(function (P) {
  'use strict';

  var PHASE = { WORK: 'work', SHORT_BREAK: 'short_break', LONG_BREAK: 'long_break' };
  P.PHASE = PHASE;

  /* ----- State ----- */
  var state = {
    phase: PHASE.WORK,
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    running: false,
    paused: false,
    completedSessions: 0,
    currentSessionStart: null
  };
  P.state = state;

  /* ----- Settings (defaults, overwritten by storage) ----- */
  var settings = {
    workMin: 25,
    shortBreakMin: 5,
    longBreakMin: 15,
    sessionsBeforeLong: 4,
    soundEnabled: true,
    autoStart: false
  };
  P.settings = settings;

  /* ----- Callbacks (set by app.js) ----- */
  P.onTick = null;          // function(timeLeft, totalTime)
  P.onPhaseChange = null;   // function(phase, completedSessions)
  P.onSessionComplete = null; // function({ task, startTime, endTime, durationMin })
  P.onCountdown = null;     // function(timeLeft) — last 10 seconds

  /* ----- Internal ----- */
  var intervalId = null;
  var lastTickTime = 0;

  /* ----- Public Methods ----- */
  function start() {
    if (state.running) return;
    state.running = true;
    state.paused = false;
    if (state.phase === PHASE.WORK && !state.currentSessionStart) {
      state.currentSessionStart = new Date();
    }
    lastTickTime = Date.now();
    intervalId = setInterval(tick, 1000);
    if (P.onPhaseChange) P.onPhaseChange(state.phase, state.completedSessions);
  }

  function pause() {
    if (!state.running) return;
    state.running = false;
    state.paused = true;
    clearInterval(intervalId);
    intervalId = null;
  }

  function resume() {
    if (!state.paused) return;
    start();
  }

  function reset() {
    clearInterval(intervalId);
    intervalId = null;
    state.running = false;
    state.paused = false;
    state.phase = PHASE.WORK;
    state.completedSessions = 0;
    state.currentSessionStart = null;
    state.totalTime = settings.workMin * 60;
    state.timeLeft = state.totalTime;
    if (P.onTick) P.onTick(state.timeLeft, state.totalTime);
    if (P.onPhaseChange) P.onPhaseChange(state.phase, state.completedSessions);
  }

  function skip() {
    clearInterval(intervalId);
    intervalId = null;
    state.running = false;
    state.paused = false;
    nextPhase(true);
  }

  function applySettings(newSettings) {
    for (var key in newSettings) {
      if (newSettings.hasOwnProperty(key)) {
        settings[key] = newSettings[key];
      }
    }
    // If timer is not running, apply immediately
    if (!state.running && !state.paused) {
      setPhaseTime(state.phase);
      if (P.onTick) P.onTick(state.timeLeft, state.totalTime);
    }
  }

  /* ----- Internal Logic ----- */
  function tick() {
    var now = Date.now();
    var elapsed = Math.round((now - lastTickTime) / 1000);
    lastTickTime = now;

    // Handle tab throttling: consume actual elapsed seconds
    state.timeLeft = Math.max(0, state.timeLeft - elapsed);

    if (P.onTick) P.onTick(state.timeLeft, state.totalTime);

    // Last 10 seconds countdown
    if (state.timeLeft <= 10 && state.timeLeft > 0 && P.onCountdown) {
      P.onCountdown(state.timeLeft);
    }

    if (state.timeLeft <= 0) {
      clearInterval(intervalId);
      intervalId = null;
      state.running = false;
      state.paused = false;
      onPhaseComplete();
    }
  }

  function onPhaseComplete() {
    if (state.phase === PHASE.WORK) {
      state.completedSessions++;
      // Record session
      if (P.onSessionComplete && state.currentSessionStart) {
        var endTime = new Date();
        P.onSessionComplete({
          task: '',  // app.js will fill this
          startTime: formatTime(state.currentSessionStart),
          endTime: formatTime(endTime),
          durationMin: settings.workMin
        });
      }
      state.currentSessionStart = null;
    }
    nextPhase(false);
  }

  function nextPhase(skipped) {
    if (state.phase === PHASE.WORK) {
      // After work: short or long break?
      if (state.completedSessions > 0 && state.completedSessions % settings.sessionsBeforeLong === 0) {
        state.phase = PHASE.LONG_BREAK;
      } else {
        state.phase = PHASE.SHORT_BREAK;
      }
    } else {
      // After any break: back to work
      state.phase = PHASE.WORK;
    }

    setPhaseTime(state.phase);
    if (P.onPhaseChange) P.onPhaseChange(state.phase, state.completedSessions);
    if (P.onTick) P.onTick(state.timeLeft, state.totalTime);

    // Auto-start if enabled and phase was not skipped manually
    if (settings.autoStart && !skipped) {
      start();
    }
  }

  function setPhaseTime(phase) {
    switch (phase) {
      case PHASE.WORK:
        state.totalTime = settings.workMin * 60;
        break;
      case PHASE.SHORT_BREAK:
        state.totalTime = settings.shortBreakMin * 60;
        break;
      case PHASE.LONG_BREAK:
        state.totalTime = settings.longBreakMin * 60;
        break;
    }
    state.timeLeft = state.totalTime;
  }

  function formatTime(date) {
    var h = String(date.getHours()).padStart(2, '0');
    var m = String(date.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  }

  /* ----- Expose ----- */
  P.start = start;
  P.pause = pause;
  P.resume = resume;
  P.reset = reset;
  P.skip = skip;
  P.applySettings = applySettings;

})(Pomodoro);
