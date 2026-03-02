/* ===== Pomodoro App (UI & Initialization) ===== */
(function () {
  'use strict';

  var P = Pomodoro;
  var PHASE = P.PHASE;

  /* ========== DOM References ========== */
  var $progressArc = document.getElementById('progressArc');
  var $timeText = document.getElementById('timeText');
  var $phaseText = document.getElementById('phaseText');
  var $phaseDots = document.getElementById('phaseDots');
  var $btnStart = document.getElementById('btnStart');
  var $btnPause = document.getElementById('btnPause');
  var $btnResume = document.getElementById('btnResume');
  var $btnSkip = document.getElementById('btnSkip');
  var $btnReset = document.getElementById('btnReset');
  var $taskInput = document.getElementById('taskInput');
  var $settingsToggle = document.getElementById('settingsToggle');
  var $settingsArrow = document.getElementById('settingsArrow');
  var $settingsBody = document.getElementById('settingsBody');
  var $statsToggle = document.getElementById('statsToggle');
  var $statsArrow = document.getElementById('statsArrow');
  var $statsBody = document.getElementById('statsBody');
  var $workMin = document.getElementById('workMin');
  var $workMinLabel = document.getElementById('workMinLabel');
  var $shortBreakMin = document.getElementById('shortBreakMin');
  var $shortBreakMinLabel = document.getElementById('shortBreakMinLabel');
  var $longBreakMin = document.getElementById('longBreakMin');
  var $longBreakMinLabel = document.getElementById('longBreakMinLabel');
  var $sessionsCount = document.getElementById('sessionsCount');
  var $sessionsCountLabel = document.getElementById('sessionsCountLabel');
  var $soundEnabled = document.getElementById('soundEnabled');
  var $autoStart = document.getElementById('autoStart');
  var $statSessions = document.getElementById('statSessions');
  var $statTotalTime = document.getElementById('statTotalTime');
  var $historyList = document.getElementById('historyList');
  var $btnClearStats = document.getElementById('btnClearStats');

  /* ========== Progress Ring Constants ========== */
  var ARC_RADIUS = 105;
  var ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;

  /* ========== Local State ========== */
  var stats = null;
  var originalTitle = document.title;

  /* ========== Initialize ========== */
  function init() {
    // Setup progress arc
    $progressArc.setAttribute('stroke-dasharray', ARC_CIRCUMFERENCE);
    $progressArc.setAttribute('stroke-dashoffset', '0');

    // Load settings from storage
    var savedSettings = P.Storage.loadSettings();
    if (savedSettings) {
      P.applySettings(savedSettings);
      syncSettingsUI(savedSettings);
    }

    // Load stats
    stats = P.Storage.loadStats();
    renderStats();

    // Wire timer callbacks
    P.onTick = handleTick;
    P.onPhaseChange = handlePhaseChange;
    P.onSessionComplete = handleSessionComplete;
    P.onCountdown = handleCountdown;

    // Initial display
    updateTimeDisplay(P.state.timeLeft);
    updateProgressRing(P.state.timeLeft, P.state.totalTime);
    updatePhaseDisplay(P.state.phase);
    updateButtons();
    renderPhaseDots();

    // Event listeners
    bindEvents();
  }

  /* ========== Timer Callbacks ========== */
  function handleTick(timeLeft, totalTime) {
    updateTimeDisplay(timeLeft);
    updateProgressRing(timeLeft, totalTime);
    updateDocumentTitle(timeLeft);
  }

  function handlePhaseChange(phase, completedSessions) {
    updatePhaseDisplay(phase);
    updateButtons();
    renderPhaseDots();

    // Play sound on phase change (not on initial load)
    if (P.state.completedSessions > 0 || phase !== PHASE.WORK) {
      if (phase === PHASE.WORK) {
        P.Audio.playBreakComplete();
      } else {
        P.Audio.playWorkComplete();
      }
    }
  }

  function handleSessionComplete(session) {
    session.task = $taskInput.value.trim() || '(無題)';
    stats = P.Storage.addSession(stats, session);
    renderStats();
  }

  function handleCountdown(timeLeft) {
    P.Audio.playCountdownTick();
  }

  /* ========== Display Updates ========== */
  function updateTimeDisplay(timeLeft) {
    var m = Math.floor(timeLeft / 60);
    var s = timeLeft % 60;
    var text = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    $timeText.textContent = text;
  }

  function updateProgressRing(timeLeft, totalTime) {
    var progress = totalTime > 0 ? timeLeft / totalTime : 1;
    var offset = ARC_CIRCUMFERENCE * (1 - progress);
    $progressArc.setAttribute('stroke-dashoffset', offset);
  }

  function updatePhaseDisplay(phase) {
    var container = document.querySelector('.timer-card');
    container.classList.remove('phase-work', 'phase-short-break', 'phase-long-break');

    var label = '';
    switch (phase) {
      case PHASE.WORK:
        container.classList.add('phase-work');
        label = '作業';
        break;
      case PHASE.SHORT_BREAK:
        container.classList.add('phase-short-break');
        label = '小休憩';
        break;
      case PHASE.LONG_BREAK:
        container.classList.add('phase-long-break');
        label = '大休憩';
        break;
    }
    $phaseText.textContent = label;
  }

  function updateButtons() {
    var s = P.state;
    $btnStart.style.display = (!s.running && !s.paused) ? '' : 'none';
    $btnPause.style.display = s.running ? '' : 'none';
    $btnResume.style.display = s.paused ? '' : 'none';

    // Add/remove running class for pulse animation
    var timerCard = document.querySelector('.timer-card');
    if (s.running) {
      timerCard.classList.add('is-running');
    } else {
      timerCard.classList.remove('is-running');
    }
  }

  function updateDocumentTitle(timeLeft) {
    var m = Math.floor(timeLeft / 60);
    var s = timeLeft % 60;
    var time = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    var phaseLabel = P.state.phase === PHASE.WORK ? '作業' :
                     P.state.phase === PHASE.SHORT_BREAK ? '小休憩' : '大休憩';
    if (P.state.running || P.state.paused) {
      document.title = time + ' ' + phaseLabel + ' | ポモドーロタイマー';
    } else {
      document.title = originalTitle;
    }
  }

  function renderPhaseDots() {
    var dots = $phaseDots.querySelectorAll('.dot');
    var total = P.settings.sessionsBeforeLong;
    var completed = P.state.completedSessions % total;

    // Show/hide dots based on sessionsBeforeLong
    for (var i = 0; i < dots.length; i++) {
      if (i < total) {
        dots[i].style.display = '';
        dots[i].classList.toggle('filled', i < completed);
        dots[i].classList.toggle('active',
          i === completed && P.state.phase === PHASE.WORK && (P.state.running || P.state.paused));
      } else {
        dots[i].style.display = 'none';
      }
    }

    // If more than 4 sessions, dynamically add dots
    while ($phaseDots.children.length < total) {
      var dot = document.createElement('span');
      dot.className = 'dot';
      $phaseDots.appendChild(dot);
    }
    // Re-query and update if dots were added
    if (total > 4) {
      dots = $phaseDots.querySelectorAll('.dot');
      for (var j = 0; j < dots.length; j++) {
        if (j < total) {
          dots[j].style.display = '';
          dots[j].classList.toggle('filled', j < completed);
          dots[j].classList.toggle('active',
            j === completed && P.state.phase === PHASE.WORK && (P.state.running || P.state.paused));
        } else {
          dots[j].style.display = 'none';
        }
      }
    }
  }

  /* ========== Stats Rendering ========== */
  function renderStats() {
    $statSessions.textContent = stats.sessions.length;
    var totalMin = Math.floor(stats.totalWorkSeconds / 60);
    $statTotalTime.textContent = totalMin + '分';

    $historyList.innerHTML = '';
    if (stats.sessions.length === 0) {
      $historyList.innerHTML = '<div class="history-empty">まだ記録がありません</div>';
      $btnClearStats.style.display = 'none';
    } else {
      // Show newest first
      for (var i = stats.sessions.length - 1; i >= 0; i--) {
        var s = stats.sessions[i];
        var el = document.createElement('div');
        el.className = 'history-item';
        el.innerHTML =
          '<div class="history-main">' +
            '<span class="history-task">' + escapeHtml(s.task) + '</span>' +
            '<span class="history-duration">' + s.durationMin + '分</span>' +
          '</div>' +
          '<div class="history-time">' + s.startTime + ' - ' + s.endTime + '</div>';
        $historyList.appendChild(el);
      }
      $btnClearStats.style.display = '';
    }
  }

  /* ========== Settings UI ========== */
  function syncSettingsUI(s) {
    $workMin.value = s.workMin;
    $workMinLabel.textContent = s.workMin + '分';
    $shortBreakMin.value = s.shortBreakMin;
    $shortBreakMinLabel.textContent = s.shortBreakMin + '分';
    $longBreakMin.value = s.longBreakMin;
    $longBreakMinLabel.textContent = s.longBreakMin + '分';
    $sessionsCount.value = s.sessionsBeforeLong;
    $sessionsCountLabel.textContent = s.sessionsBeforeLong + 'セッション';
    $soundEnabled.checked = s.soundEnabled;
    $autoStart.checked = s.autoStart;
  }

  function readSettingsFromUI() {
    return {
      workMin: parseInt($workMin.value, 10),
      shortBreakMin: parseInt($shortBreakMin.value, 10),
      longBreakMin: parseInt($longBreakMin.value, 10),
      sessionsBeforeLong: parseInt($sessionsCount.value, 10),
      soundEnabled: $soundEnabled.checked,
      autoStart: $autoStart.checked
    };
  }

  function onSettingChange() {
    var s = readSettingsFromUI();
    // Update labels
    $workMinLabel.textContent = s.workMin + '分';
    $shortBreakMinLabel.textContent = s.shortBreakMin + '分';
    $longBreakMinLabel.textContent = s.longBreakMin + '分';
    $sessionsCountLabel.textContent = s.sessionsBeforeLong + 'セッション';

    P.applySettings(s);
    P.Storage.saveSettings(s);
    renderPhaseDots();
  }

  /* ========== Collapsible Sections ========== */
  function toggleSection(body, arrow) {
    var isOpen = body.classList.contains('open');
    if (isOpen) {
      body.classList.remove('open');
      arrow.textContent = '▶';
    } else {
      body.classList.add('open');
      arrow.textContent = '▼';
    }
  }

  /* ========== Event Binding ========== */
  function bindEvents() {
    // Timer controls
    $btnStart.addEventListener('click', function () {
      P.Audio.ensureAudio();
      P.start();
      updateButtons();
      renderPhaseDots();
    });
    $btnPause.addEventListener('click', function () {
      P.pause();
      updateButtons();
      renderPhaseDots();
    });
    $btnResume.addEventListener('click', function () {
      P.resume();
      updateButtons();
      renderPhaseDots();
    });
    $btnSkip.addEventListener('click', function () {
      P.skip();
      updateButtons();
    });
    $btnReset.addEventListener('click', function () {
      P.reset();
      updateButtons();
      document.title = originalTitle;
    });

    // Settings sliders and toggles
    $workMin.addEventListener('input', onSettingChange);
    $shortBreakMin.addEventListener('input', onSettingChange);
    $longBreakMin.addEventListener('input', onSettingChange);
    $sessionsCount.addEventListener('input', onSettingChange);
    $soundEnabled.addEventListener('change', onSettingChange);
    $autoStart.addEventListener('change', onSettingChange);

    // Collapsible sections
    $settingsToggle.addEventListener('click', function () {
      toggleSection($settingsBody, $settingsArrow);
    });
    $statsToggle.addEventListener('click', function () {
      toggleSection($statsBody, $statsArrow);
    });

    // Clear stats
    $btnClearStats.addEventListener('click', function () {
      if (confirm('今日の記録をクリアしますか？')) {
        stats = P.Storage.clearStats();
        renderStats();
      }
    });
  }

  /* ========== Utility ========== */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ========== Run ========== */
  init();

})();
