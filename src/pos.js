/**
 * REGROUP HAPPY HOUR 2026 - POS LAPTOP MEJA TENGAH LOGIC
 * Dynamic real-time slide synchronization & state machine
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. POS IDENTITY DETECTION & SWITCHER
  // ==========================================================================
  let currentPos = 1;

  // Check URL param ?pos=X
  const urlParams = new URLSearchParams(window.location.search);
  const posParam = parseInt(urlParams.get('pos'), 10);
  if (posParam >= 1 && posParam <= 4) {
    currentPos = posParam;
    localStorage.setItem('hh_pos_id', currentPos);
  } else {
    const savedPos = parseInt(localStorage.getItem('hh_pos_id'), 10);
    if (savedPos >= 1 && savedPos <= 4) {
      currentPos = savedPos;
    }
  }

  const posNames = {
    1: 'POS 1: KALANANTI (SCRATCH)',
    2: 'POS 2: MATHCHAMPS (SPEED MATH)',
    3: 'POS 3: MEMORY ACADEMY',
    4: 'POS 4: SPREADSHEET SPECIAL'
  };

  function updatePosUI() {
    // Update pills
    document.querySelectorAll('.pos-pill').forEach(btn => {
      const p = parseInt(btn.dataset.pos, 10);
      btn.classList.toggle('active', p === currentPos);
    });

    // Update labels
    const labelTitle = document.getElementById('assigned-pos-label-title');
    if (labelTitle) labelTitle.textContent = posNames[currentPos] || `POS ${currentPos}`;

    const labelOlympics = document.getElementById('assigned-pos-label-olympics');
    if (labelOlympics) labelOlympics.textContent = posNames[currentPos] || `POS ${currentPos}`;

    const scoutingBadge = document.getElementById('scouting-badge-text');
    if (scoutingBadge) scoutingBadge.textContent = posNames[currentPos] || `POS ${currentPos}`;

    // Switch scouting content visibility
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`scouting-pos-content-${i}`);
      if (el) {
        el.classList.toggle('hidden', i !== currentPos);
      }
    }
  }

  document.querySelectorAll('.pos-pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const newPos = parseInt(e.currentTarget.dataset.pos, 10);
      if (newPos >= 1 && newPos <= 4) {
        currentPos = newPos;
        localStorage.setItem('hh_pos_id', currentPos);
        updatePosUI();
        SoundEngine.playClick();
      }
    });
  });

  updatePosUI();

  // ==========================================================================
  // 2. WEB AUDIO API SYNTHESIZER (BELL & SFX)
  // ==========================================================================
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  const SoundEngine = {
    playClick() {
      try {
        initAudio();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      } catch (e) {}
    },

    playBellDing() {
      try {
        initAudio();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;

        // Metallic bell harmonics
        const freqs = [1046.5, 2093, 3135.9]; // C6, C7, G7
        freqs.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          const vol = 0.25 / (idx + 1);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 1.6);
        });
      } catch (e) {}
    },

    playCountdownTick(freq = 880) {
      try {
        initAudio();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } catch (e) {}
    },

    playGoHorn() {
      try {
        initAudio();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.8);
        });
      } catch (e) {}
    }
  };

  // ==========================================================================
  // 3. MULTI-STATE MACHINE & VIEW SWITCHER
  // ==========================================================================
  const views = {
    title: document.getElementById('view-title'),
    olympics: document.getElementById('view-olympics-logo'),
    scouting: document.getElementById('view-scouting'),
    match: document.getElementById('view-match')
  };

  let currentSlideIndex = 0;
  let slide8TimerRunning = false;
  let slide8TimerRemainingSec = 60;
  let localScoutingInterval = null;

  function switchView(viewKey) {
    Object.keys(views).forEach(k => {
      if (views[k]) {
        views[k].classList.toggle('active', k === viewKey);
      }
    });
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function updateScoutingTimerDisplay() {
    const el = document.getElementById('scouting-timer-digits');
    if (el) {
      el.textContent = formatTime(slide8TimerRemainingSec);
      if (slide8TimerRemainingSec <= 10 && slide8TimerRemainingSec > 0) {
        el.style.color = '#ff4757';
        el.style.animation = 'pulse-dot-anim 0.8s infinite';
      } else {
        el.style.color = 'var(--neon-red)';
        el.style.animation = 'none';
      }
    }
  }

  // ==========================================================================
  // 4. MATCH ROUND SETUP (CHALLENGE 1 - 4)
  // ==========================================================================
  const challenges = {
    12: { // Slide 13 (index 12)
      id: 1,
      badge: 'CHALLENGE 1: KALANANTI',
      title: 'Scratch Code Debugging',
      sub: 'Misi: Perbaiki Bug Sprite Kucing Lompat',
      filename: 'kalananti_scratch_debug.sb3',
      defaultSnippet: `
        <div class="code-snippet-box">
          <code><span class="c-purple">when green flag clicked</span></code><br>
          <code><span class="c-blue">go to x: (-180) y: (-80)</span></code><br>
          <code><span class="c-orange">forever</span></code><br>
          <code>&nbsp;&nbsp;<span class="c-orange">if</span> &lt;<span class="c-green">key [space v] pressed?</span>&gt; <span class="c-orange">then</span></code><br>
          <code>&nbsp;&nbsp;&nbsp;&nbsp;<span class="c-red">change y by (-50)</span> <span class="comment-bug">&lt;-- BUG: Seharusnya lompat ke atas (+Y)!</span></code><br>
          <code>&nbsp;&nbsp;&nbsp;&nbsp;<span class="c-orange">wait (0.3) secs</span></code><br>
          <code>&nbsp;&nbsp;&nbsp;&nbsp;<span class="c-blue">change y by (50)</span></code>
        </div>
      `
    },
    13: { // Slide 14 (index 13)
      id: 2,
      badge: 'CHALLENGE 2: MATHCHAMPS',
      title: 'Speed Calculation Sempoa Kilat',
      sub: 'Misi: 5 Soal Hitungan Mental Cepat',
      filename: 'mathchamps_speed_calculation.exe',
      defaultSnippet: `
        <div class="math-sample-grid">
          <div class="math-card">1) 47 + 89 - 26 = ?</div>
          <div class="math-card">2) 125 × 8 ÷ 4 = ?</div>
          <div class="math-card">3) 35% dari 240 = ?</div>
          <div class="math-card">4) 84 ÷ 7 × 12 = ?</div>
        </div>
      `
    },
    14: { // Slide 15 (index 14)
      id: 3,
      badge: 'CHALLENGE 3: MEMORY ACADEMY',
      title: 'Visual Memory 3-Detik Flash',
      sub: 'Misi: Ingat Seluruh Objek Ruang Kerja!',
      filename: 'memory_academy_flash.png',
      defaultSnippet: `
        <div class="memory-sample-box">
          <div class="memory-sample-text">🖼️ [FLASH 3 DETIK: Suasana Ruang Kerja MSIG Da Vinci]</div>
          <div class="memory-sample-question">Pertanyaan: "Berapa jumlah mug kopi dan siapa yang mengenakan kacamata?"</div>
        </div>
      `
    },
    15: { // Slide 16 (index 15)
      id: 4,
      badge: 'CHALLENGE 4: SPREADSHEET SPECIAL',
      title: 'Formula Error Fixer #REF!',
      sub: 'Misi: Perbaiki Rumus Rusak Hingga Total Valid!',
      filename: 'sheets_formula_fixer.gsheet',
      defaultSnippet: `
        <div class="sheets-sample-grid">
          <table class="mini-sheet-table">
            <tr><th>Row</th><th>Item</th><th>Nominal</th><th>Formula</th></tr>
            <tr><td>2</td><td>Sponsor Snack</td><td>$14,500</td><td>=SUM(B2:#REF!)</td></tr>
            <tr><td>3</td><td>Venue Da Vinci</td><td>$6,200</td><td class="text-red">#REF! Error</td></tr>
          </table>
        </div>
      `
    }
  };

  let matchCountdownInterval = null;
  function triggerMatchStartCountdown(challengeData) {
    const overlay = document.getElementById('match-ready-overlay');
    const numEl = document.getElementById('match-countdown-num');
    const titleEl = document.getElementById('match-ready-title');
    const subEl = document.getElementById('match-ready-sub');

    if (overlay && numEl) {
      overlay.classList.add('active');
      titleEl.textContent = 'BERSIAP TANDING...';
      subEl.textContent = `Semua meja bersiap untuk: ${challengeData.title}`;

      let count = 3;
      numEl.textContent = count;
      SoundEngine.playCountdownTick(600);

      if (matchCountdownInterval) clearInterval(matchCountdownInterval);

      matchCountdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
          numEl.textContent = count;
          SoundEngine.playCountdownTick(600 + (3 - count) * 150);
        } else if (count === 0) {
          numEl.textContent = 'GO!';
          titleEl.textContent = 'MULAI!';
          SoundEngine.playGoHorn();
        } else {
          clearInterval(matchCountdownInterval);
          overlay.classList.remove('active');
        }
      }, 900);
    }
  }

  // Manual start button in overlay
  const btnManualStart = document.getElementById('btn-manual-start-match');
  if (btnManualStart) {
    btnManualStart.addEventListener('click', () => {
      const overlay = document.getElementById('match-ready-overlay');
      if (overlay) overlay.classList.remove('active');
      SoundEngine.playGoHorn();
    });
  }

  function renderMatchRound(slideIndex) {
    const data = challenges[slideIndex];
    if (!data) return;

    const badgeEl = document.getElementById('match-challenge-badge');
    const nameEl = document.getElementById('match-challenge-name');
    const titleEl = document.getElementById('match-display-title');
    const descEl = document.getElementById('match-display-desc');
    const boxTitleEl = document.getElementById('match-blackbox-title');
    const slotEl = document.getElementById('match-custom-slot');

    if (badgeEl) badgeEl.textContent = data.badge;
    if (nameEl) nameEl.textContent = data.title;
    if (titleEl) titleEl.textContent = data.sub;
    if (descEl) descEl.textContent = `Tantangan babak ${data.id}. Siapa cepat selesai, segera tekan bel dan kejar Kak Balqis!`;
    if (boxTitleEl) boxTitleEl.textContent = data.filename;

    if (slotEl) {
      slotEl.innerHTML = data.defaultSnippet;
    }

    switchView('match');
    triggerMatchStartCountdown(data);
  }

  // ==========================================================================
  // 5. MASTER STATE EVALUATOR (FOLLOWS MC SLIDE)
  // ==========================================================================
  function evaluateSlideState(slideIndex) {
    currentSlideIndex = slideIndex;

    const mcIndicator = document.getElementById('mc-slide-indicator');
    if (mcIndicator) {
      mcIndicator.textContent = `Slide ${slideIndex + 1}/22`;
    }

    const posStatusText = document.getElementById('pos-status-text');

    // FASE 1: Slide 1 - 5 (index 0 - 4) -> Grand Title Screen
    if (slideIndex >= 0 && slideIndex <= 4) {
      switchView('title');
      if (posStatusText) posStatusText.textContent = '● Pre-Show / Welcome';
    }

    // FASE 2: Slide 6 & 7 (index 5 & 6) -> Office Olympics Logo
    else if (slideIndex === 5 || slideIndex === 6) {
      switchView('olympics');
      const msg = document.getElementById('olympics-status-msg');
      const sub = document.getElementById('olympics-sub-msg');
      if (slideIndex === 5) {
        if (msg) msg.textContent = '🏆 OFFICE OLYMPICS DIMULAI!';
        if (sub) sub.textContent = 'Simak penjelasan umum dari MC Yazid di panggung.';
        if (posStatusText) posStatusText.textContent = '● Office Olympics Splash';
      } else {
        if (msg) msg.textContent = '🚨 BRIEFING 4 POS LAPTOP';
        if (sub) sub.textContent = 'Ketua Kelompok, bersiap maju ke meja tengah untuk inspeksi 1 menit!';
        if (posStatusText) posStatusText.textContent = '● Briefing Ketua Kelompok';
      }
    }

    // FASE 3: Slide 8 (index 7) -> Scouting Mode or Olympics Standby
    else if (slideIndex === 7) {
      if (slide8TimerRunning) {
        switchView('scouting');
        updateScoutingTimerDisplay();
        if (posStatusText) posStatusText.textContent = '⚡ WAKTU SCOUTING AKTIF (1 Menit)';
      } else {
        switchView('olympics');
        const msg = document.getElementById('olympics-status-msg');
        const sub = document.getElementById('olympics-sub-msg');
        if (msg) msg.textContent = '🔍 PERSIAPAN KETUA KELOMPOK';
        if (sub) sub.textContent = 'Berdiri di depan laptop pos kalian. Menunggu aba-aba START dari MC...';
        if (posStatusText) posStatusText.textContent = '● Standby Scouting Timer';
      }
    }

    // FASE 4: Slide 9 (index 8) -> Bumper Selesai Scouting (LOCK INSTANTLY!)
    else if (slideIndex === 8) {
      slide8TimerRunning = false;
      if (localScoutingInterval) clearInterval(localScoutingInterval);
      switchView('olympics');
      const msg = document.getElementById('olympics-status-msg');
      const sub = document.getElementById('olympics-sub-msg');
      if (msg) msg.textContent = '⏰ WAKTU INSPEKSI SELESAI!';
      if (sub) sub.textContent = 'Ketua Kelompok silakan segera kembali ke meja masing-masing.';
      if (posStatusText) posStatusText.textContent = '● Inspeksi Selesai';
    }

    // FASE 5: Slide 10, 11, 12 (index 9, 10, 11) -> Rules & Rapat Tim
    else if (slideIndex >= 9 && slideIndex <= 11) {
      switchView('olympics');
      const msg = document.getElementById('olympics-status-msg');
      const sub = document.getElementById('olympics-sub-msg');
      if (slideIndex === 9) {
        if (msg) msg.textContent = '🛎️ ATURAN BEL KAK BALQIS';
        if (sub) sub.textContent = 'Selesai tugas -> lari kejar Kak Balqis! (Benar 1st: +5 pt, Benar 2nd: +4 pt)';
        if (posStatusText) posStatusText.textContent = '● Rules Bel & Poin';
      } else if (slideIndex === 10) {
        if (msg) msg.textContent = '⏱️ RAPAT STRATEGI TIM (2 MENIT)';
        if (sub) sub.textContent = 'Tentukan siapa anggota yang akan bermain di Pos 1, 2, 3, dan 4!';
        if (posStatusText) posStatusText.textContent = '● Rapat Strategi Kelompok';
      } else {
        if (msg) msg.textContent = '🔥 READY TO BATTLE!';
        if (sub) sub.textContent = 'Perwakilan Challenge 1 silakan maju dan duduk di laptop meja tengah!';
        if (posStatusText) posStatusText.textContent = '● Persiapan Tanding';
      }
    }

    // FASE 6: Slide 13 - 16 (index 12 - 15) -> MATCH ROUNDS
    else if (slideIndex >= 12 && slideIndex <= 15) {
      if (posStatusText) posStatusText.textContent = `🔥 TANDING: ${challenges[slideIndex] ? challenges[slideIndex].title : ''}`;
      renderMatchRound(slideIndex);
    }

    // FASE 7: Slide 17+ (index 16 - 21) -> Sesi Santuy, Awarding, Closing
    else {
      switchView('olympics');
      const msg = document.getElementById('olympics-status-msg');
      const sub = document.getElementById('olympics-sub-msg');
      if (msg) msg.textContent = '🎉 PERTANDINGAN SELESAI!';
      if (sub) sub.textContent = 'Selamat menikmati sesi santuy, makan sore, dan pengumuman pemenang!';
      if (posStatusText) posStatusText.textContent = '● Sesi Santuy & Awarding';
    }
  }

  // ==========================================================================
  // 6. GIANT SPRINT BELL BUTTON ACTION
  // ==========================================================================
  const btnSprintBell = document.getElementById('btn-sprint-bell');
  if (btnSprintBell) {
    btnSprintBell.addEventListener('click', () => {
      SoundEngine.playBellDing();

      // Visual feedback
      btnSprintBell.style.transform = 'scale(0.96)';
      btnSprintBell.style.background = 'linear-gradient(135deg, #00ff9d 0%, #00f0ff 100%)';
      const mainText = btnSprintBell.querySelector('.bell-main-text');
      const subText = btnSprintBell.querySelector('.bell-sub-text');
      if (mainText) mainText.textContent = '🚀 SUDAH DI-BELL! LARI KE KAK BALQIS SEKARANG!';
      if (subText) subText.textContent = 'Amankan bel meja di depan panggung!';

      setTimeout(() => {
        btnSprintBell.style.transform = '';
        btnSprintBell.style.background = '';
        if (mainText) mainText.textContent = 'SELESAI! SPRINT KEJAR KAK BALQIS!';
        if (subText) subText.textContent = 'Pencet bel meja di depan untuk mengunci waktu & dapatkan 5 poin!';
      }, 5000);
    });
  }

  // ==========================================================================
  // 7. REAL-TIME SYNC HUB (BroadcastChannel + LocalStorage + HTTP Polling)
  // ==========================================================================
  const SYNC_CHANNEL_NAME = 'regroup_happy_hour_sync';
  const syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);

  let lastProcessedTimestamp = 0;

  function handleIncomingSync(data) {
    if (!data || !data.type) return;

    if (data.timestamp && data.timestamp <= lastProcessedTimestamp) {
      return;
    }
    lastProcessedTimestamp = data.timestamp || Date.now();

    switch (data.type) {
      case 'CURRENT_SLIDE_STATUS':
      case 'REMOTE_GOTO_SLIDE':
        if (typeof data.payload.index === 'number') {
          evaluateSlideState(data.payload.index);
        }
        break;

      case 'TIMER_UPDATE':
      case 'TIMER_TICK':
        if (data.payload && data.payload.timerId === 1) {
          slide8TimerRunning = Boolean(data.payload.isRunning);
          slide8TimerRemainingSec = data.payload.currentSec;
          if (currentSlideIndex === 7) {
            evaluateSlideState(7);
          }
        }
        break;

      case 'TIMER_RESET':
      case 'TIMER_EXPIRED':
        if (data.payload && data.payload.timerId === 1) {
          slide8TimerRunning = false;
          slide8TimerRemainingSec = data.payload.totalSec || 60;
          if (currentSlideIndex === 7) {
            evaluateSlideState(7);
          }
        }
        break;

      default:
        break;
    }
  }

  syncChannel.onmessage = (e) => {
    handleIncomingSync(e.data);
  };

  window.addEventListener('storage', (e) => {
    if (e.key === 'hh_last_broadcast' && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        handleIncomingSync(data);
      } catch (err) {}
    }
  });

  // Cross-device LAN polling (/api/sync)
  async function pollServerSync() {
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const json = await res.json();
        if (json.lastSignal) {
          handleIncomingSync(json.lastSignal);
        }
      }
    } catch (err) {}
  }
  setInterval(pollServerSync, 600);

  // Request initial slide status on load
  syncChannel.postMessage({ type: 'REQUEST_STATUS', timestamp: Date.now() });
  pollServerSync();

  // Fullscreen button
  const btnFullscreen = document.getElementById('btn-fullscreen');
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  // Keyboard hotkey 'F'
  window.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  });
});
