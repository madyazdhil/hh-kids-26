/**
 * Player Pos Laptop Logic for Regroup Happy Hour
 * Controls 4 Center Table Laptops synchronized via HHSync with MC Slide Deck
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Resolve Assigned Pos (from URL query ?pos=1..4 or localStorage)
  const urlParams = new URLSearchParams(window.location.search);
  let assignedPos = parseInt(urlParams.get('pos'), 10);
  if (!assignedPos || assignedPos < 1 || assignedPos > 4) {
    assignedPos = parseInt(localStorage.getItem('hh_pos_assigned'), 10) || 1;
  }

  const posConfig = {
    1: { name: 'Kalananti (Scratch Debugging)', short: 'Scratch', icon: '🐱', color: 'var(--neon-cyan)' },
    2: { name: 'Mathchamps (Sempoa Speed Math)', short: 'Math', icon: '🧮', color: 'var(--neon-gold)' },
    3: { name: 'Memory Academy (Visual Memory)', short: 'Memory', icon: '🧠', color: 'var(--neon-green)' },
    4: { name: 'Spreadsheet Special (#REF!)', short: 'Sheets', icon: '📊', color: '#38bdf8' }
  };

  // DOM Elements
  const currentPosBadge = document.getElementById('current-pos-badge');
  const posSelectSwitcher = document.getElementById('pos-select-switcher');
  const posSyncStatus = document.getElementById('pos-sync-status');
  const btnFullscreen = document.getElementById('btn-fullscreen-pos');

  // State Panels
  const stateTemplate = document.getElementById('state-template');
  const stateOlympicIdle = document.getElementById('state-olympic-idle');
  const stateScouting = document.getElementById('state-scouting');
  const stateBattle = document.getElementById('state-battle');

  // Scouting Elements
  const templatePosNum = document.getElementById('template-pos-num');
  const templatePosName = document.getElementById('template-pos-name');
  const idlePosTag = document.getElementById('idle-pos-tag');
  const scoutingPosBadge = document.getElementById('scouting-pos-badge');
  const scoutingTimerDisplay = document.getElementById('scouting-timer-display');
  const scoutingContentArea = document.getElementById('scouting-content-area');

  // Battle Elements
  const battleRoundBadge = document.getElementById('battle-round-badge');
  const battleGameTitle = document.getElementById('battle-game-title');
  const battleWorkspace = document.getElementById('battle-workspace');
  const btnSprintBell = document.getElementById('btn-sprint-bell');

  let currentSlideIndex = 0;
  let isTimerRunning = false;
  let timerCurrentSec = 60;
  let isBattleUnlocked = false;

  // Update Pos Assignment UI
  function updatePosIdentity(posNum) {
    assignedPos = posNum;
    localStorage.setItem('hh_pos_assigned', posNum);
    posSelectSwitcher.value = posNum;

    const conf = posConfig[posNum];
    currentPosBadge.textContent = `POS ${posNum}: ${conf.short.toUpperCase()}`;
    templatePosNum.textContent = `POS ${posNum}`;
    templatePosName.textContent = conf.name;
    idlePosTag.textContent = `LAPTOP MEJA TENGAH • POS ${posNum} (${conf.short.toUpperCase()})`;
    scoutingPosBadge.textContent = `POS ${posNum}: ${conf.name.toUpperCase()}`;

    renderScoutingContent();
    renderBattleContent();
  }

  posSelectSwitcher.addEventListener('change', (e) => {
    updatePosIdentity(parseInt(e.target.value, 10));
  });

  // ==========================================================================
  // 2. STATE MACHINE (CONTROLLED BY SLIDE MC)
  // ==========================================================================
  function showPanel(panelEl) {
    [stateTemplate, stateOlympicIdle, stateScouting, stateBattle].forEach(el => {
      el.classList.remove('active');
    });
    panelEl.classList.add('active');
  }

  function getActiveRoundIndex() {
    if (currentSlideIndex === 12 || currentSlideIndex === 13) return 0; // Kalananti Scratch
    if (currentSlideIndex === 14 || currentSlideIndex === 15) return 1; // Mathchamps
    if (currentSlideIndex === 16 || currentSlideIndex === 17) return 2; // Memory
    if (currentSlideIndex === 18 || currentSlideIndex === 19) return 3; // Spreadsheet
    return 0;
  }

  function evaluateScreenState() {
    // Slide 1 - 5 (indices 0 - 4): Clean Template
    if (currentSlideIndex >= 0 && currentSlideIndex <= 4) {
      showPanel(stateTemplate);
    }
    // Slide 6 & 7 (indices 5 & 6): Office Olympic Standby
    else if (currentSlideIndex === 5 || currentSlideIndex === 6) {
      showPanel(stateOlympicIdle);
    }
    // Slide 8 (index 7): Scouting Sesi 1 Menit
    else if (currentSlideIndex === 7) {
      if (isTimerRunning && timerCurrentSec > 0) {
        showPanel(stateScouting);
      } else {
        // ZERO LEAK: If timer is paused, ended, or not started, lock back to standby!
        showPanel(stateOlympicIdle);
      }
    }
    // Slide 9 - 12 (indices 8 - 11): Office Olympic Standby / Strategy Rules
    else if (currentSlideIndex >= 8 && currentSlideIndex <= 11) {
      showPanel(stateOlympicIdle);
    }
    // BRIEFING SLIDES: Slide 13, 15, 17, 19 (indices 12, 14, 16, 18) - 100% LOCKED
    else if ([12, 14, 16, 18].includes(currentSlideIndex)) {
      showPanel(stateBattle);
      isBattleUnlocked = false;
      const roundIdx = getActiveRoundIndex();
      const gameTitles = [
        '🐱 Challenge 1: Kalananti Scratch Debugging',
        '🧮 Challenge 2: Mathchamps Speed Math',
        '🧠 Challenge 3: Memory Academy Flash',
        '📊 Challenge 4: Spreadsheet Special (#REF! Fixer)'
      ];

      const battleLockedOverlay = document.getElementById('battle-locked-overlay');
      const battleActiveContent = document.getElementById('battle-active-content');
      const lockedRoundBadge = document.getElementById('locked-round-badge');
      const lockedGameTitle = document.getElementById('locked-game-title');
      const countdownDisplay = document.getElementById('battle-countdown-display');
      const countdownHint = document.getElementById('battle-countdown-hint');

      if (currentPosBadge) {
        const shortNames = ['SCRATCH', 'MATH', 'MEMORY', 'SHEETS'];
        currentPosBadge.textContent = `MEJA ${assignedPos} • BABAK ${roundIdx + 1}: ${shortNames[roundIdx]}`;
      }

      if (battleLockedOverlay) battleLockedOverlay.classList.remove('hidden');
      if (battleActiveContent) battleActiveContent.classList.add('hidden');
      if (lockedRoundBadge) lockedRoundBadge.textContent = `BABAK ${roundIdx + 1} DARI 4 • MEJA ${assignedPos}`;
      if (lockedGameTitle) lockedGameTitle.textContent = gameTitles[roundIdx] || 'Office Olympic Battle';
      if (countdownDisplay) {
        countdownDisplay.textContent = 'STANDBY';
        countdownDisplay.className = 'countdown-digits-big';
      }
      if (countdownHint) {
        countdownHint.innerHTML = 'Dengarkan penjelasan MC di depan proyektor.<br><strong>Semua Meja (1, 2, 3, 4) tanding serentak di babak ini!</strong><br>Tantangan masih <strong>TERKUNCI</strong> dan akan terbuka saat Countdown <strong>3, 2, 1 MULAI!</strong>';
      }
    }
    // BATTLE SLIDES: Slide 14, 16, 18, 20 (indices 13, 15, 17, 19) - UNLOCKED AFTER COUNTDOWN
    else if ([13, 15, 17, 19].includes(currentSlideIndex)) {
      showPanel(stateBattle);
      const roundIdx = getActiveRoundIndex();
      const gameTitles = [
        '🐱 Challenge 1: Kalananti Scratch Debugging',
        '🧮 Challenge 2: Mathchamps Speed Math',
        '🧠 Challenge 3: Memory Academy Flash',
        '📊 Challenge 4: Spreadsheet Special (#REF! Fixer)'
      ];

      const battleLockedOverlay = document.getElementById('battle-locked-overlay');
      const battleActiveContent = document.getElementById('battle-active-content');
      const lockedRoundBadge = document.getElementById('locked-round-badge');
      const lockedGameTitle = document.getElementById('locked-game-title');
      const countdownDisplay = document.getElementById('battle-countdown-display');
      const countdownHint = document.getElementById('battle-countdown-hint');

      if (currentPosBadge) {
        const shortNames = ['SCRATCH', 'MATH', 'MEMORY', 'SHEETS'];
        currentPosBadge.textContent = `MEJA ${assignedPos} • BABAK ${roundIdx + 1}: ${shortNames[roundIdx]}`;
      }

      if (lockedRoundBadge) lockedRoundBadge.textContent = `BABAK ${roundIdx + 1} DARI 4 • MEJA ${assignedPos}`;
      if (lockedGameTitle) lockedGameTitle.textContent = gameTitles[roundIdx] || 'Office Olympic Battle';

      if (isBattleUnlocked) {
        if (battleLockedOverlay) battleLockedOverlay.classList.add('hidden');
        if (battleActiveContent) battleActiveContent.classList.remove('hidden');
        renderBattleContent(roundIdx);
      } else {
        if (battleLockedOverlay) battleLockedOverlay.classList.remove('hidden');
        if (battleActiveContent) battleActiveContent.classList.add('hidden');
        if (countdownDisplay) {
          countdownDisplay.textContent = 'STANDBY';
          countdownDisplay.className = 'countdown-digits-big';
        }
        if (countdownHint) {
          countdownHint.innerHTML = 'Tangan bersiap di atas keyboard!<br><strong>Semua Meja 1, 2, 3, 4 tanding bersama!</strong><br>Tantangan terbuka otomatis saat Countdown <strong>3, 2, 1 MULAI!</strong>';
        }
      }
    }
    // Slide 21+ (indices 20+): Sesi Santuy / Awarding / Closing
    else {
      if (currentPosBadge) {
        const conf = posConfig[assignedPos];
        currentPosBadge.textContent = `POS ${assignedPos}: ${conf.short.toUpperCase()}`;
      }
      showPanel(stateOlympicIdle);
    }
  }

  // ==========================================================================
  // 3. SCOUTING CONTENT (POS 1 TO 4)
  // ==========================================================================
  function renderScoutingContent() {
    if (assignedPos === 1) {
      scoutingContentArea.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <h3 style="color: var(--neon-cyan); font-size: 1.25rem;">🐱 POS 1: KALANANTI SCRATCH DEBUGGING</h3>
          <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.5;">
            <strong>Misi Rahasia:</strong> Sprite Kucing gagal melompati rintangan dan gerakannya macet di tempat!
          </p>
          <div style="background: rgba(0,0,0,0.5); padding: 14px; border-radius: 8px; border-left: 4px solid var(--neon-cyan); font-family: monospace;">
            <div style="color: #94a3b8; font-size: 0.85rem;">[Clue Kode Bug]:</div>
            <div style="color: #f8fafc; margin-top: 6px;">
              • Cek block perpindahan koordinat Y: apakah bernilai positif atau negatif?<br>
              • Cek block loop: ada block yang tertukar antara 'repeat' dan 'repeat until'.
            </div>
          </div>
          <p style="color: var(--neon-gold); font-size: 0.85rem; font-weight: 700;">
            👉 Ingat baik-baik polanya dan siapkan anggota tim yang paham dasar Scratch!
          </p>
        </div>
      `;
    } else if (assignedPos === 2) {
      scoutingContentArea.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <h3 style="color: var(--neon-gold); font-size: 1.25rem;">🧮 POS 2: MATHCHAMPS SPEED MATH</h3>
          <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.5;">
            <strong>Misi Rahasia:</strong> Soal hitung mental cepat sempoa! Angka akan berganti otomatis setiap 4 detik.
          </p>
          <div style="background: rgba(0,0,0,0.5); padding: 14px; border-radius: 8px; border-left: 4px solid var(--neon-gold); font-family: monospace;">
            <div style="color: #94a3b8; font-size: 0.85rem;">[Clue Soal]:</div>
            <div style="color: #f8fafc; margin-top: 6px;">
              • Operasi penjumlahan & pengurangan kombinasi 2 digit.<br>
              • Diperlukan konsentrasi visual sempoa bayangan tanpa alat tulis.
            </div>
          </div>
          <p style="color: var(--neon-gold); font-size: 0.85rem; font-weight: 700;">
            👉 Siapkan jagoan matematika kilat dari kelompokmu!
          </p>
        </div>
      `;
    } else if (assignedPos === 3) {
      scoutingContentArea.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <h3 style="color: var(--neon-green); font-size: 1.25rem;">🧠 POS 3: MEMORY ACADEMY VISUAL FLASH</h3>
          <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.5;">
            <strong>Misi Rahasia:</strong> Sebuah gambar visual kompleks berisi objek kantor dan anak-anak akan tampil selama 5 detik lalu hilang!
          </p>
          <div style="background: rgba(0,0,0,0.5); padding: 14px; border-radius: 8px; border-left: 4px solid var(--neon-green); font-family: monospace;">
            <div style="color: #94a3b8; font-size: 0.85rem;">[Clue Objek]:</div>
            <div style="color: #f8fafc; margin-top: 6px;">
              • Hafalkan jumlah warna balon, posisi laptop, dan pakaian karakter.<br>
              • Pertanyaan akan menguji detail terkecil gambar.
            </div>
          </div>
          <p style="color: var(--neon-gold); font-size: 0.85rem; font-weight: 700;">
            👉 Siapkan anggota yang punya daya ingat visual fotografis!
          </p>
        </div>
      `;
    } else {
      scoutingContentArea.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <h3 style="color: #38bdf8; font-size: 1.25rem;">📊 POS 4: SPREADSHEET SPECIAL (#REF! FIXER)</h3>
          <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.5;">
            <strong>Misi Rahasia:</strong> Tabel Google Sheets laporan keuangan memiliki 2 sel yang memunculkan error <code>#REF!</code> dan <code>#VALUE!</code>.
          </p>
          <div style="background: rgba(0,0,0,0.5); padding: 14px; border-radius: 8px; border-left: 4px solid #38bdf8; font-family: monospace;">
            <div style="color: #94a3b8; font-size: 0.85rem;">[Clue Formula]:</div>
            <div style="color: #f8fafc; margin-top: 6px;">
              • Error #REF! terjadi karena range VLOOKUP bergeser saat di-copy.<br>
              • Error #VALUE! terjadi karena tanda kutip pada angka di kolom Qty.
            </div>
          </div>
          <p style="color: var(--neon-gold); font-size: 0.85rem; font-weight: 700;">
            👉 Siapkan master shortcut Google Sheets di timmu!
          </p>
        </div>
      `;
    }
  }

  // ==========================================================================
  // 4. BATTLE CONTENT GENERATOR (CHALLENGE 1 - 4)
  // ==========================================================================
  function renderBattleContent(overrideRoundIdx) {
    const roundIdx = typeof overrideRoundIdx === 'number' ? overrideRoundIdx : getActiveRoundIndex();
    
    if (roundIdx === 0) {
      // CHALLENGE 1: SCRATCH (SLIDE 14)
      battleRoundBadge.textContent = `BABAK 1 DARI 4 • MEJA ${assignedPos}`;
      battleGameTitle.textContent = '🐱 Challenge 1: Kalananti Scratch Debugging';
      
      battleWorkspace.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column;">
          <div style="padding: 12px 16px; background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; color: var(--neon-cyan);">ARENA TANTANGAN SCRATCH GUI (MEJA ${assignedPos}):</span>
            <a href="scratch-slide.html" target="_blank" class="btn btn-xs btn-outline">Buka Fullscreen Tab ↗</a>
          </div>
          <iframe src="scratch-slide.html" style="width: 100%; height: calc(100% - 45px); border: none; background: #0f172a;"></iframe>
        </div>
      `;
    } else if (roundIdx === 1) {
      // CHALLENGE 2: MATH (SLIDE 16)
      battleRoundBadge.textContent = `BABAK 2 DARI 4 • MEJA ${assignedPos}`;
      battleGameTitle.textContent = '🧮 Challenge 2: Mathchamps Speed Math';

      battleWorkspace.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column;">
          <div style="padding: 10px 16px; background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(255,215,0,0.25); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; color: var(--neon-gold); font-family: 'JetBrains Mono', monospace; font-size: 0.88rem;">
              🧮 ARENA HITUNG CEPAT SEMPOA (MEJA ${assignedPos}) • KEYBOARD INPUT • DEFAULT 2.0s
            </span>
            <a href="sempoa-slide.html" target="_blank" class="btn btn-xs btn-outline" style="border-color: var(--neon-gold); color: var(--neon-gold);">
              Buka Fullscreen Tab ↗
            </a>
          </div>
          <iframe id="sempoa-battle-frame" src="sempoa-slide.html?autostart=1" style="width: 100%; height: calc(100% - 45px); border: none; background: #070d19;"></iframe>
        </div>
      `;
    } else if (roundIdx === 2) {
      // CHALLENGE 3: MEMORY (SLIDE 18)
      battleRoundBadge.textContent = `BABAK 3 DARI 4 • MEJA ${assignedPos}`;
      battleGameTitle.textContent = '🧠 Challenge 3: Memory Academy Flash';

      battleWorkspace.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column;">
          <div style="padding: 10px 16px; background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(0,255,157,0.25); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; color: var(--neon-green); font-family: 'JetBrains Mono', monospace; font-size: 0.88rem;">
              🧠 ARENA VISUAL MEMORY (MEJA ${assignedPos}) • KEYBOARD [A] / [B] • 20 OBJEK
            </span>
            <a href="memory-slide.html" target="_blank" class="btn btn-xs btn-outline" style="border-color: var(--neon-green); color: var(--neon-green);">
              Buka Fullscreen Tab ↗
            </a>
          </div>
          <iframe id="memory-battle-frame" src="memory-slide.html?autostart=1" style="width: 100%; height: calc(100% - 45px); border: none; background: #030712;"></iframe>
        </div>
      `;
    } else if (roundIdx === 3) {
      // CHALLENGE 4: SPREADSHEET (SLIDE 20)
      battleRoundBadge.textContent = `BABAK 4 DARI 4 • MEJA ${assignedPos}`;
      battleGameTitle.textContent = '📊 Challenge 4: Spreadsheet Special (#REF! Fixer)';

      battleWorkspace.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; gap: 16px;">
          <div style="font-size: 2.5rem; font-weight: 900; color: #38bdf8; font-family: monospace;">
            =VLOOKUP(A2, Data!$A$2:$D$100, 3, FALSE)
          </div>
          <p style="color: #cbd5e1; font-size: 1.05rem; max-width: 650px;">
            Perbaiki formula yang memunculkan error <code>#REF!</code> di sheet panitia!
          </p>
          <div style="background: rgba(56,189,248,0.1); border: 1px solid #38bdf8; padding: 12px 24px; border-radius: 8px; color: #fff; font-size: 0.95rem;">
            🛠️ Temukan kolom yang hilang dan perbaiki rentang tabelnya!
          </div>
        </div>
      `;
    }
  }

  // ==========================================================================
  // 5. AUDIO SFX (METALLIC SPRINT BELL)
  // ==========================================================================
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBellChime() {
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.8);

      gain.gain.setValueAtTime(1.0, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {}
  }

  // Giant Sprint Bell Click
  btnSprintBell.addEventListener('click', () => {
    playBellChime();

    // Broadcast to Admin and MC
    if (window.HHSync) {
      window.HHSync.send('POS_BELL_RUNG', {
        pos: assignedPos,
        posName: posConfig[assignedPos].name,
        timestamp: Date.now()
      });
    }

    btnSprintBell.style.background = '#00ff9d';
    btnSprintBell.innerHTML = `
      <span class="bell-emoji">🏃‍♂️💨</span>
      <span class="bell-main-text">BEL DIBUNYIKAN! LARI KE KAK BALQIS!</span>
      <span class="bell-sub-text">Sinyal bel sudah terkirim ke panitia! Sprint sekarang!</span>
    `;

    setTimeout(() => {
      btnSprintBell.style.background = '';
      btnSprintBell.innerHTML = `
        <span class="bell-emoji">🔔</span>
        <span class="bell-main-text">KITA UDAH KELAR! LARI KEJAR KAK BALQIS!</span>
        <span class="bell-sub-text">Tekan bel ini, lalu 1 perwakilan tim lari secepat kilat ke meja panitia! (+5 / +4 Pt)</span>
      `;
    }, 4000);
  });

  // Fullscreen Button
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // ==========================================================================
  // 5. WEBRTC LIVE STREAM BROADCASTER (Screen + Team Cam to Proyektor)
  // ==========================================================================
  const btnBroadcastStream = document.getElementById('btn-broadcast-stream');
  let posPeer = null;
  let activeScreenStream = null;
  let activeCamStream = null;

  function initPosPeer() {
    if (posPeer || typeof Peer === 'undefined') return;
    try {
      posPeer = new Peer();
      posPeer.on('open', (id) => {
        console.log(`Pos ${assignedPos} WebRTC Broadcaster Ready:`, id);
      });
      posPeer.on('error', (err) => {
        console.warn('Pos Peer error:', err);
      });
    } catch (e) {
      console.warn('Pos Peer init error:', e);
    }
  }

  initPosPeer();

  async function startStreamingToProyektor() {
    initPosPeer();

    // 1. Ambil Webcam secara diam-diam (tanpa popup floating di layar peserta)
    try {
      if (!activeCamStream) {
        activeCamStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
          audio: false
        });
      }
    } catch (err) {
      console.warn('Izin webcam dilewati atau ditolak:', err);
    }

    // 2. Ambil Screen Share Layar Peserta
    try {
      if (!activeScreenStream) {
        activeScreenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false
        });
      }
    } catch (err) {
      console.warn('Screen share dibatalkan oleh pengguna:', err);
      return;
    }

    // 3. Kirim kedua stream ke MC Proyektor via PeerJS
    if (posPeer) {
      if (activeScreenStream) {
        posPeer.call('hhkids26-proyektor-main', activeScreenStream, {
          metadata: { pos: assignedPos, type: 'screen' }
        });
      }
      if (activeCamStream) {
        posPeer.call('hhkids26-proyektor-main', activeCamStream, {
          metadata: { pos: assignedPos, type: 'cam' }
        });
      }
    }

    if (btnBroadcastStream) {
      btnBroadcastStream.classList.add('streaming');
      btnBroadcastStream.innerHTML = `<span class="broadcast-icon">🟢</span><span class="broadcast-text">Siaran Aktif (Pos ${assignedPos})</span>`;
    }

    // Listener otomatis saat pengguna mengklik "Stop sharing" di Chrome
    if (activeScreenStream) {
      const track = activeScreenStream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          stopStreaming();
        };
      }
    }
  }

  function stopStreaming() {
    if (activeScreenStream) {
      activeScreenStream.getTracks().forEach(t => t.stop());
      activeScreenStream = null;
    }
    if (activeCamStream) {
      activeCamStream.getTracks().forEach(t => t.stop());
      activeCamStream = null;
    }
    if (btnBroadcastStream) {
      btnBroadcastStream.classList.remove('streaming');
      btnBroadcastStream.innerHTML = `<span class="broadcast-icon">📡</span><span class="broadcast-text">Siarkan ke Proyektor</span>`;
    }
  }

  if (btnBroadcastStream) {
    btnBroadcastStream.addEventListener('click', () => {
      if (activeScreenStream) {
        stopStreaming();
      } else {
        startStreamingToProyektor();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    // Forward keyboard events (A, B, 1, 2, ArrowLeft, ArrowRight, Space, R) to Memory Arena frame
    const memFrame = document.getElementById('memory-battle-frame');
    if (memFrame && memFrame.contentWindow) {
      memFrame.contentWindow.postMessage({ type: 'KEY_DOWN', key: e.key }, '*');
    }
  });

  // Listen for challenge completion events from embedded frames
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'MEMORY_CHALLENGE_COMPLETE') {
      if (btnSprintBell) {
        btnSprintBell.scrollIntoView({ behavior: 'smooth' });
        btnSprintBell.style.animation = 'bellPulse 0.8s infinite ease-in-out';
        playBellChime();
      }
    }
  });

  // ==========================================================================
  // 6. SYNC LISTENER (HHSync)
  // ==========================================================================
  function handleSyncMessage(data) {
    if (!data || !data.type) return;

    if (data.type === 'SLIDE_CHANGED' || data.type === 'CURRENT_SLIDE_STATUS') {
      const idx = data.payload.index;
      if (typeof idx === 'number') {
        if (currentSlideIndex !== idx) {
          isBattleUnlocked = false;
        }
        currentSlideIndex = idx;
        posSyncStatus.textContent = `🟢 Terhubung ke Proyektor (Slide ${idx + 1})`;
        evaluateScreenState();
      }
    } else if (data.type === 'BATTLE_COUNTDOWN') {
      const count = data.payload.count;
      const countdownDisplay = document.getElementById('battle-countdown-display');
      const countdownHint = document.getElementById('battle-countdown-hint');
      if (countdownDisplay) {
        if (count > 0) {
          countdownDisplay.textContent = count;
          countdownDisplay.className = 'countdown-digits-big countdown-pulse';
          if (countdownHint) countdownHint.innerHTML = 'Bersiaplah! Tantangan akan terbuka dalam hitungan...';
          playBellChime();
        } else {
          countdownDisplay.textContent = 'MULAI!';
          countdownDisplay.className = 'countdown-digits-big countdown-go';
          if (countdownHint) countdownHint.innerHTML = '🔥 WAKTU BERJALAN! SELESAIKAN MISI SEKARANG!';
          playBellChime();
          setTimeout(() => {
            isBattleUnlocked = true;
            evaluateScreenState();
          }, 700);
        }
      }
    } else if (data.type === 'BATTLE_UNLOCKED') {
      isBattleUnlocked = true;
      evaluateScreenState();
    } else if (data.type === 'TIMER_TICK' || data.type === 'TIMER_UPDATE') {
      isTimerRunning = data.payload.isRunning;
      timerCurrentSec = data.payload.currentSec;
      const mins = Math.floor(timerCurrentSec / 60);
      const secs = timerCurrentSec % 60;
      scoutingTimerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      evaluateScreenState();
    } else if (data.type === 'TIMER_EXPIRED' || data.type === 'TIMER_RESET') {
      isTimerRunning = false;
      timerCurrentSec = data.payload.currentSec;
      evaluateScreenState();
    }
  }

  if (window.HHSync) {
    window.HHSync.onMessage(handleSyncMessage);
  }

  // Initial setup
  updatePosIdentity(assignedPos);
  evaluateScreenState();
  if (window.HHSync) {
    window.HHSync.send('REQUEST_STATUS');
  }
});
