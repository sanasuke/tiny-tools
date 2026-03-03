/* ===== Pomodoro Audio (Web Audio API) ===== */
var Pomodoro = Pomodoro || {};

(function (P) {
  'use strict';

  var audioCtx = null;
  var masterGain = null;

  function ensureAudio() {
    if (audioCtx) return true;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.4;
      masterGain.connect(audioCtx.destination);
      return true;
    } catch (e) {
      return false;
    }
  }

  function playNote(freq, startOffset, duration, type, volume) {
    if (!ensureAudio()) return;
    var t = audioCtx.currentTime + startOffset;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume || 0.3, t + 0.02);
    gain.gain.linearRampToValueAtTime(0, t + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  /* Work complete: cheerful ascending arpeggio C5 -> E5 -> G5 + chord */
  function playWorkComplete() {
    if (!P.settings.soundEnabled) return;
    if (!ensureAudio()) return;
    // Ascending notes
    playNote(523.25, 0, 0.2, 'sine', 0.3);       // C5
    playNote(659.25, 0.15, 0.2, 'sine', 0.3);     // E5
    playNote(783.99, 0.3, 0.2, 'sine', 0.3);      // G5
    // Final chord
    playNote(523.25, 0.5, 0.5, 'sine', 0.2);      // C5
    playNote(659.25, 0.5, 0.5, 'sine', 0.2);      // E5
    playNote(783.99, 0.5, 0.5, 'sine', 0.2);      // G5
    playNote(1046.5, 0.5, 0.5, 'sine', 0.15);     // C6
  }

  /* Break complete: gentle two-note chime */
  function playBreakComplete() {
    if (!P.settings.soundEnabled) return;
    if (!ensureAudio()) return;
    playNote(392.0, 0, 0.3, 'triangle', 0.25);    // G4
    playNote(523.25, 0.2, 0.4, 'triangle', 0.25);  // C5
  }

  /* Countdown tick: short click for last 10 seconds */
  function playCountdownTick() {
    if (!P.settings.soundEnabled) return;
    if (!ensureAudio()) return;
    playNote(800, 0, 0.05, 'sine', 0.15);
  }

  /* Expose */
  P.Audio = {
    ensureAudio: ensureAudio,
    playWorkComplete: playWorkComplete,
    playBreakComplete: playBreakComplete,
    playCountdownTick: playCountdownTick
  };

})(Pomodoro);
