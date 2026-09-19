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
  const debugSlide = parseInt(urlParams.get('slide'), 10);
  const debugBattle = urlParams.get('battle') === '1' || urlParams.get('unlock') === '1';

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
  let isMemoryObserving = false;
  let renderedBattleRound = -1;
  // On separate laptops, the slide-change and countdown signals can arrive
  // out of order. Keep the unlock signal until the matching battle slide is
  // known locally instead of letting a late SLIDE_CHANGED reset it.
  let pendingBattleUnlockRound = null;
  let lastStateRevision = -1;
  let stateSender = null;
  let lastStateAt = 0;
  let lastStatusRequestAt = 0;

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
    if (isBattleUnlocked) renderBattleContent();
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

  function getBattleSlideIndex(roundIdx) {
    return [13, 15, 17, 19][roundIdx];
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
      if (!isTimerRunning || timerCurrentSec <= 0) {
        // Once the inspection timer has actually expired, hide the clues.
        showPanel(stateOlympicIdle);
      } else {
        // Scouting exposes instructions only while the MC timer runs.
        showPanel(stateScouting);
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
      if (lockedRoundBadge) lockedRoundBadge.textContent = `BABAK ${roundIdx + 1} DARI 4 • BRIEFING • MEJA ${assignedPos}`;
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

      if (lockedRoundBadge) lockedRoundBadge.textContent = `BABAK ${roundIdx + 1} DARI 4 • BRIEFING • MEJA ${assignedPos}`;
      if (lockedGameTitle) lockedGameTitle.textContent = gameTitles[roundIdx] || 'Office Olympic Battle';

      if (isBattleUnlocked) {
        if (battleLockedOverlay) battleLockedOverlay.classList.add('hidden');
        if (battleActiveContent) battleActiveContent.classList.remove('hidden');
        renderBattleContent(roundIdx);
      } else {
        renderedBattleRound = -1;
        if (battleLockedOverlay) battleLockedOverlay.classList.remove('hidden');
        if (battleActiveContent) battleActiveContent.classList.add('hidden');
        if (currentSlideIndex === 17 && isMemoryObserving) {
          if (countdownDisplay) {
            countdownDisplay.textContent = '👀 HAFALKAN!';
            countdownDisplay.className = 'countdown-digits-big countdown-pulse';
          }
          if (countdownHint) {
            countdownHint.innerHTML = '👀 <strong>TATAP LAYAR PROYEKTOR DI DEPAN!</strong><br>Hafalkan 20 objek yang sedang di-flip MC bersama timmu!<br>Soal kuis 20 pertanyaan akan serentak terbuka di laptop ini begitu hafalan selesai!';
          }
        } else {
          if (countdownDisplay) {
            countdownDisplay.textContent = 'STANDBY';
            countdownDisplay.className = 'countdown-digits-big';
          }
          if (countdownHint) {
            countdownHint.innerHTML = 'Tangan bersiap di atas keyboard!<br><strong>Semua Meja 1, 2, 3, 4 tanding bersama!</strong><br>Tantangan terbuka otomatis saat Countdown <strong>3, 2, 1 MULAI!</strong>';
          }
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
            <strong>Misi Rahasia:</strong> Soal hitung mental cepat sempoa! Angka akan berganti otomatis setiap 2 detik.
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
  let integratedGameCleanup = null;
  let integratedGameState = null;

  function fsBtn(accentColor = 'var(--neon-cyan)') {
    return `<button class="btn btn-xs btn-outline" data-action="arena-fullscreen"
      style="border-color:${accentColor};color:${accentColor};cursor:pointer;">⛶ Fullscreen Arena</button>`;
  }

  function integratedShell({accent, label, instruction, body}) {
    return `<section class="integrated-challenge" style="--challenge-accent:${accent};">
      <header class="integrated-challenge-toolbar">
        <div><span class="integrated-kicker">${label}</span><strong>${instruction}</strong></div>
        ${fsBtn(accent)}
      </header>
      <div class="integrated-challenge-body">${body}</div>
    </section>`;
  }

  function markIntegratedChallengeComplete(message = 'Tantangan selesai! Tekan bel sprint.') {
    const status = document.querySelector('#integrated-game-status');
    if (status) {
      status.textContent = `✅ ${message}`;
      status.classList.add('is-complete');
    }
    const body = battleWorkspace?.querySelector('.integrated-challenge-body');
    if (body && !body.querySelector('.integrated-finish-cta')) {
      const cta = document.createElement('div');
      cta.className = 'integrated-finish-cta';
      cta.innerHTML = `<div><strong>✅ TANTANGAN SELESAI</strong><span>${message}</span></div><button class="finish-challenge-button" type="button">🔔 SELESAI — PANGGIL KAK BALQIS</button>`;
      cta.querySelector('button').addEventListener('click', () => btnSprintBell?.click());
      body.appendChild(cta);
    }
    window.postMessage({ type: 'CHALLENGE_COMPLETED', subtitle: message }, '*');
  }

  function mountScratchChallenge() {
    const code = `<span class="code-keyword">when</span> green flag clicked\n  <span class="code-keyword">repeat</span> 10\n    move 10 steps\n    <span class="code-keyword">if</span> touching edge?\n      turn 15 degrees`;
    battleWorkspace.innerHTML = integratedShell({
      accent: 'var(--neon-cyan)', label: `KALANANTI • POS ${assignedPos}`,
      instruction: 'Cari blok yang membuat robot tidak pernah berhenti.',
      body: `<div class="integrated-grid scratch-grid">
        <div class="integrated-panel code-panel"><div class="panel-label">KODE YANG HARUS DI-DEBUG</div><pre class="scratch-code">${code}</pre><div class="scratch-sprite">🐱</div></div>
        <div class="integrated-panel"><div class="panel-label">PILIH PERBAIKAN</div><div class="choice-stack" id="scratch-choices">
          <button class="game-choice" data-answer="wrong">Tambahkan <code>stop all</code> di awal</button>
          <button class="game-choice" data-answer="correct">Tambahkan <code>if on edge, bounce</code> di dalam repeat</button>
          <button class="game-choice" data-answer="wrong">Hapus blok repeat agar lebih cepat</button>
        </div><button class="game-primary" id="scratch-submit">Jalankan Debug</button><div class="game-status" id="integrated-game-status">Pilih satu perbaikan yang paling tepat.</div></div>
      </div>`
    });
    let selected = null;
    const choices = [...document.querySelectorAll('#scratch-choices .game-choice')];
    choices.forEach(btn => btn.addEventListener('click', () => { choices.forEach(x => x.classList.remove('selected')); btn.classList.add('selected'); selected = btn; }));
    document.getElementById('scratch-submit').addEventListener('click', () => {
      if (!selected) return;
      if (selected.dataset.answer === 'correct') { selected.classList.add('correct'); markIntegratedChallengeComplete('KODE SCRATCH BENAR!'); }
      else { selected.classList.add('wrong'); document.getElementById('integrated-game-status').textContent = '❌ Robot masih bisa nyangkut. Coba lagi.'; }
    });
    integratedGameCleanup = () => {};
  }

  function mountMathChallenge() {
    const answerKey = 85;
    battleWorkspace.innerHTML = integratedShell({
      accent: 'var(--neon-gold)', label: `MATHCHAMPS • POS ${assignedPos}`,
      instruction: 'Selesaikan satu soal pertama. Jawaban benar langsung selesai.',
      body: `<div class="math-arena"><div class="math-round-counter">SOAL FINAL • 1 JAWABAN BENAR = SELESAI</div><div class="math-equation" id="math-equation">38 + 47 = ?</div><input class="math-answer" id="math-answer" inputmode="numeric" autocomplete="off" placeholder="Ketik jawaban…"><button class="game-primary" id="math-submit">Kunci Jawaban ↵</button><div class="game-status" id="integrated-game-status">Jawab sekali saja. Tidak ada pengulangan ronde.</div></div>`
    });
    const input = document.getElementById('math-answer');
    const submit = document.getElementById('math-submit');
    const status = document.getElementById('integrated-game-status');
    const submitAnswer = () => {
      if (Number(input.value) !== answerKey) { status.textContent = '❌ Belum tepat. Coba hitung lagi: 38 + 47.'; input.select(); return; }
      input.disabled = true; submit.disabled = true; markIntegratedChallengeComplete('SEMPOA BENAR! LANGSUNG SELESAI.');
    };
    submit.addEventListener('click', submitAnswer); input.addEventListener('keydown', e => { if (e.key === 'Enter') submitAnswer(); }); input.focus(); integratedGameCleanup = () => {};
  }

  function mountMemoryChallenge() {
    const items = ['Sepatu Lari Merah','Cangkir Kopi Hijau','Jam Weker Mint Vintage','Buah Apel Merah','Buku Jurnal Biru','Headphone Hitam'];
    let index = 0, score = 0;
    battleWorkspace.innerHTML = integratedShell({
      accent: 'var(--neon-green)', label: `MEMORY ACADEMY • POS ${assignedPos}`,
      instruction: 'Kuis kilat terbuka. Pilih objek yang tadi muncul di proyektor.',
      body: `<div class="memory-arena"><div class="memory-progress" id="memory-progress">PERTANYAAN 1 / 6</div><div class="memory-question-card"><div class="memory-icon">🧠</div><h3 id="memory-question">Objek mana yang kamu ingat?</h3><div class="memory-options" id="memory-options"></div></div><div class="game-status" id="integrated-game-status">Keyboard: A untuk pilihan kiri • B untuk pilihan kanan</div></div>`
    });
    const progress = document.getElementById('memory-progress'), question = document.getElementById('memory-question'), options = document.getElementById('memory-options');
    const render = () => { const correct = items[index % items.length]; const wrong = items[(index + 2) % items.length]; question.textContent = `Mana yang muncul di kartu ${index + 1}?`; options.innerHTML = `<button class="memory-option" data-correct="true">A · ${correct}</button><button class="memory-option" data-correct="false">B · ${wrong}</button>`; progress.textContent = `PERTANYAAN ${index + 1} / 6`; options.querySelectorAll('button').forEach((btn, i) => btn.addEventListener('click', () => answer(i === 0))); };
    const answer = correct => { if (correct) score++; index++; if (index >= 6) { markIntegratedChallengeComplete(`MEMORY SELESAI! SKOR ${score} / 6`); options.innerHTML = `<div class="memory-finished">✅ Skor akhir ${score} / 6<br><small>Tekan bel sprint di bawah.</small></div>`; return; } render(); };
    const keyHandler = e => { if (e.key.toLowerCase() === 'a') answer(true); if (e.key.toLowerCase() === 'b') answer(false); }; window.addEventListener('keydown', keyHandler); render(); integratedGameCleanup = () => window.removeEventListener('keydown', keyHandler);
  }

  function mountSheetsChallenge() {
    const cases = [
      ['Hapus Kolom Bencana', 'Pulihkan range yang rusak dari B2 ke B10.'],
      ['Tanda Baca Regional', 'Ganti koma pemisah argumen menjadi titik koma.'],
      ['Tanda Petik Hilang', 'Bungkus teks LULUS dan GAGAL dengan tanda petik.'],
      ['Siklus Kiamat', 'Pindahkan SUM keluar dari cell A10.'],
      ['Kunci Sel Hilang', 'Tambahkan tanda `$` pada referensi tarif pajak.']
    ];
    let solved = new Set();
    battleWorkspace.innerHTML = integratedShell({
      accent: '#38bdf8', label: `SPREADSHEET SPECIAL • POS ${assignedPos}`,
      instruction: 'Perbaiki lima formula error sebelum waktu habis.',
      body: `<div class="sheets-arena"><div class="sheets-toolbar"><button class="sheet-tool">↶</button><button class="sheet-tool">↷</button><button class="sheet-tool">▣</button><span class="sheet-divider"></span><span class="sheet-fx">fx</span><span class="cell-address">B2</span><span class="formula-preview">=VLOOKUP(A2;Data!A:B;2;FALSE)</span></div><div class="sheet-grid-wrap"><table class="sheet-grid"><thead><tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead><tbody><tr><th>1</th><td>Nama</td><td>Nilai</td><td>Status</td><td>Tarif</td></tr><tr><th>2</th><td>Yazid</td><td class="cell-error">#REF!</td><td class="cell-error">#NAME?</td><td>11%</td></tr><tr><th>3</th><td>Deina</td><td>92</td><td>LULUS</td><td>$B$2</td></tr><tr><th>4</th><td>Balqis</td><td>78</td><td>LULUS</td><td>$B$2</td></tr></tbody></table></div><div class="sheet-tabs"><span class="sheet-tab active">Challenge</span><span class="sheet-tab">Data Referensi</span><span class="sheet-tab">+</span></div><div class="sheets-cases" id="sheets-cases"></div><div class="game-status" id="integrated-game-status">Klik Koreksi pada setiap kasus seperti mengedit Google Sheets.</div></div>`
    });
    const casesEl = document.getElementById('sheets-cases');
    casesEl.innerHTML = cases.map((item, i) => `<article class="sheet-case" data-case="${i}"><div><span class="case-number">${i + 1}</span><strong>${item[0]}</strong><p>${item[1]}</p></div><button class="game-choice sheet-fix" data-case="${i}">Koreksi</button></article>`).join('');
    casesEl.querySelectorAll('.sheet-fix').forEach(btn => btn.addEventListener('click', () => { const i = Number(btn.dataset.case); solved.add(i); btn.textContent = '✓ Beres'; btn.classList.add('correct'); btn.disabled = true; document.querySelector(`.sheet-case[data-case="${i}"]`).classList.add('solved'); if (solved.size === cases.length) markIntegratedChallengeComplete('SEMUA FORMULA AMAN!'); })); integratedGameCleanup = () => {};
  }

  function renderBattleContent(overrideRoundIdx) {
    const roundIdx = typeof overrideRoundIdx === 'number' ? overrideRoundIdx : getActiveRoundIndex();
    if (renderedBattleRound === roundIdx && battleWorkspace && battleWorkspace.firstElementChild) return;
    if (integratedGameCleanup) integratedGameCleanup();
    renderedBattleRound = roundIdx;
    battleRoundBadge.textContent = `BABAK ${roundIdx + 1} DARI 4 • MEJA ${assignedPos}`;
    const titles = ['🐱 Challenge 1: Kalananti Scratch Debugging','🧮 Challenge 2: Mathchamps Speed Math','🧠 Challenge 3: Memory Academy Flash','📊 Challenge 4: Spreadsheet Special (#REF! Fixer)'];
    battleGameTitle.textContent = titles[roundIdx];
    if (roundIdx === 0) mountScratchChallenge();
    else if (roundIdx === 1) mountMathChallenge();
    else if (roundIdx === 2) mountMemoryChallenge();
    else mountSheetsChallenge();
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
    // Update the local UI first. A relay/network exception must never prevent
    // the player from seeing that the physical sprint bell was registered.
    btnSprintBell.style.background = '#00ff9d';
    btnSprintBell.innerHTML = `
      <span class="bell-emoji">🏃‍♂️💨</span>
      <span class="bell-main-text">BEL DIBUNYIKAN! LARI KE KAK BALQIS!</span>
      <span class="bell-sub-text">Sinyal bel sudah terkirim ke panitia! Sprint sekarang!</span>
    `;

    try { playBellChime(); } catch (error) {
      console.warn('Bell sound unavailable:', error);
    }
    // Broadcast to Admin and MC without blocking the local confirmation.
    try {
      window.HHSync?.send('POS_BELL_RUNG', {
        pos: assignedPos,
        posName: posConfig[assignedPos].name,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Bell sync unavailable:', error);
    }

    setTimeout(() => {
      btnSprintBell.style.background = '';
      btnSprintBell.innerHTML = `
        <span class="bell-emoji">🔔</span>
        <span class="bell-main-text">KITA UDAH KELAR! LARI KEJAR KAK BALQIS!</span>
        <span class="bell-sub-text">Tekan bel ini, lalu 1 perwakilan tim lari secepat kilat ke meja panitia! (+5 / +4 Pt)</span>
      `;
    }, 10000);
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
  let dataConnection = null;
  let dataConnectStartedAt = 0;
  const mediaCalls = new Map();
  let activeScreenStream = null;
  let activeCamStream = null;
  const savedHost = urlParams.get('host') || sessionStorage.getItem('hh_projector_host');
  let pinnedProjector = Boolean(savedHost);
  let pairedSenderId = null;
  let activeProyektorPeerId = savedHost || 'hhkids26-proyektor-main';
  const pairForm = document.getElementById('projector-pair-form');
  const pairInput = document.getElementById('projector-code-input');
  const pairStatus = document.getElementById('projector-pair-status');
  if (pairInput) pairInput.value = activeProyektorPeerId.replace('hhkids26-proyektor-', '');
  pairForm?.addEventListener('submit', event => {
    event.preventDefault();
    const code = pairInput.value.trim();
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(code)) {
      pairStatus.textContent = 'Salin kode yang tampil di menu Hubungkan Pos pada MC.';
      return;
    }
    activeProyektorPeerId = code.startsWith('hhkids26-proyektor-') ? code : `hhkids26-proyektor-${code}`;
    sessionStorage.setItem('hh_projector_host', activeProyektorPeerId);
    // Keep refresh on the manually selected MC, even when the original link
    // contained a different host. Preserve the Pos number and other options.
    const pairedUrl = new URL(window.location.href);
    pairedUrl.searchParams.set('host', activeProyektorPeerId);
    window.history.replaceState(null, '', pairedUrl);
    pinnedProjector = true;
    pairedSenderId = null;
    lastStateRevision = -1;
    lastStateAt = 0;
    stateSender = null;
    currentSlideIndex = 0;
    isTimerRunning = false;
    isMemoryObserving = false;
    pendingBattleUnlockRound = null;
    isBattleUnlocked = false;
    evaluateScreenState();
    if (dataConnection) dataConnection.close();
    dataConnection = null;
    mediaCalls.forEach(call => call.close());
    mediaCalls.clear();
    pairStatus.textContent = 'Menghubungkan ke proyektor…';
    connectProjectorData();
  });

  function initPosPeer() {
    if (posPeer && !posPeer.destroyed) return;
    console.log(`🔌 [Pos${assignedPos}] Inisialisasi PeerJS…`);
    try {
      posPeer = new Peer({ debug: 1 } /* Keep bundled PeerJS STUN + TURN defaults. */);
      posPeer.on('open', (id) => {
        console.log(`🔌 [Pos${assignedPos}] ✅ PeerJS READY — ID: ${id}`);
        console.log(`🔌 [Pos${assignedPos}] Target proyektor: ${activeProyektorPeerId}`);
        if (pairStatus) pairStatus.textContent = `PeerJS aktif (${id}). Menghubungkan ke MC…`;
        connectProjectorData();
        if (window.HHSync) {
          window.HHSync.send('REQUEST_PROYEKTOR_ID', { pos: assignedPos });
        }
      });
      posPeer.on('error', (err) => {
        console.warn(`🔌 [Pos${assignedPos}] Peer error:`, err.type, err.message || err);
        if (err.type === 'peer-unavailable') {
          if (pairStatus) pairStatus.textContent = `Proyektor "${activeProyektorPeerId}" belum online. Pastikan MC sudah buka index.html.`;
          // Auto-retry connect setelah 2s
          setTimeout(() => connectProjectorData(), 2000);
        } else {
          if (pairStatus) pairStatus.textContent = `PeerJS error: ${err.type}. Akan retry…`;
        }
      });
      posPeer.on('disconnected', () => {
        console.warn(`🔌 [Pos${assignedPos}] PeerJS disconnected, reconnecting…`);
        if (posPeer && !posPeer.destroyed) posPeer.reconnect();
      });
    } catch (e) {
      console.warn(`🔌 [Pos${assignedPos}] Init error:`, e);
    }
  }

  function connectProjectorData() {
    if (!posPeer?.open) {
      console.log(`🔌 [Pos${assignedPos}] connectProjectorData: posPeer belum open, skip`);
      return;
    }
    if (dataConnection && dataConnection.peer === activeProyektorPeerId
      && (dataConnection.open || (Date.now() - dataConnectStartedAt < 25000
        && !['failed', 'closed'].includes(dataConnection.peerConnection?.connectionState)))) {
      // Give ICE/TURN negotiation time; do not restart a viable attempt every 8s.
      return;
    }
    if (dataConnection) {
      console.log(`🔌 [Pos${assignedPos}] Menutup koneksi lama ke ${dataConnection.peer}`);
      dataConnection.close();
    }
    console.log(`🔌 [Pos${assignedPos}] ▶ Connecting data channel ke: ${activeProyektorPeerId}`);
    if (pairStatus) pairStatus.textContent = `Menghubungkan ke ${activeProyektorPeerId}…`;
    const connection = posPeer.connect(activeProyektorPeerId, { reliable: true });
    dataConnection = connection;
    dataConnectStartedAt = Date.now();
    connection.on('open', () => {
      if (dataConnection !== connection) return;
      console.log(`🔌 [Pos${assignedPos}] ✅ Data channel TERBUKA ke ${activeProyektorPeerId}`);
      if (pairStatus) pairStatus.textContent = 'Koneksi terbuka; menunggu status slide MC…';
      posSyncStatus.textContent = `🟡 Data channel terbuka, menunggu status slide…`;
      window.HHSync?.send('REQUEST_STATUS');
      if (activeScreenStream || activeCamStream) transmitStreamsToProyektor();
    });
    connection.on('data', message => {
      if (dataConnection !== connection) return;
      if (message?.payload?.state) pairedSenderId = message.senderId;
      window.HHSync?.receive(message);
    });
    connection.on('error', error => {
      if (dataConnection !== connection) return;
      dataConnectStartedAt = 0;
      console.warn(`🔌 [Pos${assignedPos}] ❌ Data channel error:`, error.type, error.message || error);
      if (pairStatus) pairStatus.textContent = error.type === 'peer-unavailable'
        ? `Proyektor "${activeProyektorPeerId}" belum online. Pastikan MC sudah buka index.html.`
        : `Error: ${error.type || error.message}. Mencoba ulang…`;
      // Retry agresif setelah peer-unavailable (proyektor belum buka)
      if (error.type === 'peer-unavailable') {
        setTimeout(() => connectProjectorData(), 2000);
      }
    });
    connection.on('close', () => {
      if (dataConnection === connection) {
        dataConnectStartedAt = 0;
        console.log(`🔌 [Pos${assignedPos}] Data channel ditutup`);
      }
    });
  }
  window.HHSync?.addTransport(message => {
    if (dataConnection?.open) dataConnection.send(message);
  });
  setInterval(() => {
    if (!posPeer || posPeer.destroyed) initPosPeer();
    else if (posPeer.disconnected) posPeer.reconnect();
    if (!dataConnection?.open) connectProjectorData();
    if (activeCamStream || activeScreenStream) transmitStreamsToProyektor();
    if (Date.now() - lastStateAt > 10000) {
      posSyncStatus.textContent = dataConnection?.open
        ? '🟡 Data channel terbuka tapi belum ada data slide'
        : `🔴 Belum tersambung ke ${activeProyektorPeerId}`;
      if (pairStatus && dataConnection?.open) pairStatus.textContent = 'Koneksi terbuka tetapi status MC belum diterima.';
      if (Date.now() - lastStatusRequestAt > 8000) {
        lastStatusRequestAt = Date.now();
        window.HHSync?.send('REQUEST_STATUS');
      }
    }
  }, 3000);
  initPosPeer();

  function transmitStreamsToProyektor() {
    if (!posPeer || posPeer.destroyed) initPosPeer();
    if (!posPeer) return;

    const doCall = () => {
      const targetId = activeProyektorPeerId || 'hhkids26-proyektor-main';
      [['screen', activeScreenStream], ['cam', activeCamStream]].forEach(([type, stream]) => {
        if (!stream) return;
        const previous = mediaCalls.get(type);
        if (previous && previous.peer === targetId && !['failed', 'closed'].includes(previous.peerConnection?.connectionState)) return;
        if (previous) previous.close();
        const call = posPeer.call(targetId, stream, { metadata: { pos: assignedPos, type } });
        if (!call) return;
        mediaCalls.set(type, call);
        const failed = () => {
          if (mediaCalls.get(type) === call) mediaCalls.delete(type);
          if (btnBroadcastStream && (activeCamStream || activeScreenStream)) {
            btnBroadcastStream.querySelector('.broadcast-text').textContent = 'Siaran terputus — menyambung ulang…';
          }
        };
        call.on('close', failed);
        call.on('error', failed);
        const pc = call.peerConnection;
        if (pc) pc.addEventListener('connectionstatechange', () => {
          if (pc.connectionState === 'failed') { call.close(); failed(); }
        });
      });
    };

    if (posPeer.open) {
      doCall();
    } else {
      posPeer.once('open', doCall);
    }
  }

  async function startStreamingToProyektor() {
    initPosPeer();
    if (window.HHSync) {
      window.HHSync.send('REQUEST_PROYEKTOR_ID', { pos: assignedPos });
    }

    if (btnBroadcastStream) {
      btnBroadcastStream.innerHTML = `<span class="broadcast-icon">🟡</span><span class="broadcast-text">Menyiapkan Siaran...</span>`;
    }

    // Screen picker must start inside the original click's user activation.
    const screenRequest = activeScreenStream ? Promise.resolve(activeScreenStream)
      : navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false })
        .catch(error => { console.warn('Screen share:', error); return null; });

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

    activeScreenStream = await screenRequest;
    // Camera-only broadcasting is valid when screen sharing was declined.
    if (!activeScreenStream && !activeCamStream) {
      stopStreaming();
      if (btnBroadcastStream) btnBroadcastStream.querySelector('.broadcast-text').textContent = 'Izin kamera/layar belum diberikan — coba lagi';
      return;
    }

    // 3. Kirim kedua stream ke MC Proyektor via PeerJS
    transmitStreamsToProyektor();

    if (btnBroadcastStream) {
      btnBroadcastStream.classList.add('streaming');
      btnBroadcastStream.innerHTML = `<span class="broadcast-icon">🟢</span><span class="broadcast-text">Menghubungkan siaran Pos ${assignedPos}…</span>`;
    }

    // Listener otomatis saat pengguna mengklik "Stop sharing" di Chrome bar
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
    mediaCalls.forEach(call => call.close());
    mediaCalls.clear();
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
      if (activeScreenStream || activeCamStream) {
        stopStreaming();
      } else {
        startStreamingToProyektor();
      }
    });
  }

  // Re-send stream if Proyektor requests status or sends PROYEKTOR_READY
  if (window.HHSync) {
    window.HHSync.on('STREAM_RECEIVED', data => {
      if (data.payload.pos === assignedPos && btnBroadcastStream && (activeScreenStream || activeCamStream)) {
        btnBroadcastStream.querySelector('.broadcast-text').textContent = `Diterima Proyektor • ${data.payload.type === 'cam' ? 'Kamera' : 'Layar'} Pos ${assignedPos}`;
      }
    });
    window.HHSync.on('PROYEKTOR_READY', (data) => {
      if (data && data.payload && data.payload.peerId) {
        if (pinnedProjector && data.payload.peerId !== activeProyektorPeerId) return;
        activeProyektorPeerId = data.payload.peerId;
        connectProjectorData();
        console.log('⚡ Active Proyektor Peer ID updated:', activeProyektorPeerId);
      }
      if (activeScreenStream || activeCamStream) {
        console.log('⚡ Signal PROYEKTOR_READY diterima, mengirim ulang stream...');
        transmitStreamsToProyektor();
      }
    });
  }

  window.addEventListener('beforeunload', () => {
    stopStreaming();
    if (posPeer) {
      try { posPeer.destroy(); } catch (e) {}
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    // Integrated challenge controls listen directly on this page.
  });

  // ==========================================================================
  // VICTORY OVERLAY — shown in-page when challenge completes (fullscreen)
  // ==========================================================================
  const victoryOverlay = document.getElementById('victory-fullscreen-overlay');
  const victoryBellBtn = document.getElementById('victory-bell-btn');
  const victoryDismissBtn = document.getElementById('victory-dismiss-btn');
  const victorySubtitle = document.getElementById('victory-subtitle');

  function showVictoryOverlay(subtitle) {
    if (!victoryOverlay) return;
    if (subtitle && victorySubtitle) victorySubtitle.textContent = subtitle;
    victoryOverlay.style.display = 'flex';
    // Kick off confetti canvas
    startVictoryConfetti();
    // Also go fullscreen so the overlay fills the entire screen
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    playBellChime();
    // Flash the sprint bell button too
    if (btnSprintBell) {
      btnSprintBell.style.animation = 'bellPulse 0.8s infinite ease-in-out';
      btnSprintBell.style.background = '#00ff9d';
    }
  }

  function hideVictoryOverlay() {
    if (!victoryOverlay) return;
    victoryOverlay.style.display = 'none';
    stopVictoryConfetti();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  // Confetti canvas animation
  let confettiAnimId = null;
  const confettiPieces = [];
  function startVictoryConfetti() {
    const canvas = document.getElementById('victory-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    confettiPieces.length = 0;
    const COLORS = ['#00ff9d','#ffd700','#ff6b6b','#38bdf8','#c084fc','#fb923c'];
    for (let i = 0; i < 160; i++) {
      confettiPieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        w: 8 + Math.random() * 10,
        h: 4 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 4,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.15
      });
    }
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confettiPieces.forEach(p => {
        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
      });
      confettiAnimId = requestAnimationFrame(draw);
    }
    draw();
  }
  function stopVictoryConfetti() {
    if (confettiAnimId) { cancelAnimationFrame(confettiAnimId); confettiAnimId = null; }
    const canvas = document.getElementById('victory-canvas');
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }

  // Victory bell button → ring sync bell then hide overlay
  if (victoryBellBtn) {
    victoryBellBtn.addEventListener('click', () => {
      playBellChime();
      if (window.HHSync) {
        window.HHSync.send('POS_BELL_RUNG', {
          pos: assignedPos,
          posName: posConfig[assignedPos].name,
          timestamp: Date.now()
        });
      }
      victoryBellBtn.textContent = '✅ BEL TERKIRIM! LARI SEKARANG! 🏃‍♂️💨';
      victoryBellBtn.style.background = 'linear-gradient(135deg,#ffd700,#ffaa00)';
      setTimeout(() => hideVictoryOverlay(), 5000);
    });
  }

  // Dismiss button → hide overlay
  if (victoryDismissBtn) {
    victoryDismissBtn.addEventListener('click', () => hideVictoryOverlay());
  }

  // ESC key also hides overlay (in case they exit fullscreen)
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && victoryOverlay && victoryOverlay.style.display === 'flex') {
      stopVictoryConfetti();
      victoryOverlay.style.display = 'none';
    }
  });

  // Listen for challenge completion events from embedded frames
  window.addEventListener('message', (e) => {
    if (e.data && (e.data.type === 'MEMORY_CHALLENGE_COMPLETE' || e.data.type === 'CHALLENGE_COMPLETED')) {
      const subtitle = e.data.subtitle || e.data.message || 'TANTANGAN BERHASIL DISELESAIKAN!';
      showVictoryOverlay(subtitle);
    }
  });

  // ==========================================================================
  // 6. SYNC LISTENER (HHSync)
  // ==========================================================================
  function handleSyncMessage(data) {
    if (!data || !data.type) return;

    const snapshot = data.payload?.state;
    if (snapshot && Number.isInteger(snapshot.index)) {
      if (pinnedProjector && (!pairedSenderId || data.senderId !== pairedSenderId)) return;
      if (stateSender !== data.senderId) {
        stateSender = data.senderId;
        lastStateRevision = -1;
      }
      if (snapshot.revision < lastStateRevision) return;
      lastStateRevision = snapshot.revision;
      lastStateAt = Date.now();
      if (pairStatus) pairStatus.textContent = `Tersambung • Slide ${snapshot.index + 1}`;
      currentSlideIndex = snapshot.index;
      isTimerRunning = snapshot.timer.isRunning;
      timerCurrentSec = snapshot.timer.currentSec;
      scoutingTimerDisplay.textContent = `${String(Math.floor(timerCurrentSec / 60)).padStart(2, '0')}:${String(timerCurrentSec % 60).padStart(2, '0')}`;
      const battle = snapshot.battle;
      isBattleUnlocked = battle.phase === 'active' && currentSlideIndex === getBattleSlideIndex(battle.round - 1);
      isMemoryObserving = battle.phase === 'observing' && currentSlideIndex === 17;
      pendingBattleUnlockRound = null;
      posSyncStatus.textContent = `🟢 Terhubung ke Proyektor (Slide ${currentSlideIndex + 1})`;
      evaluateScreenState();
      if (battle.phase === 'countdown' && currentSlideIndex === getBattleSlideIndex(battle.round - 1)) {
        document.getElementById('battle-countdown-display').textContent = battle.count;
      }
      return;
    }
    // Once complete snapshots are available, delayed legacy events cannot undo them.
    if (lastStateRevision >= 0) return;
    if (data.type === 'SLIDE_CHANGED' || data.type === 'CURRENT_SLIDE_STATUS') {
      const idx = data.payload.index;
      if (typeof idx === 'number') {
        if (currentSlideIndex !== idx) {
          const incomingRound = [13, 15, 17, 19].indexOf(idx);
          isBattleUnlocked = incomingRound >= 0 && pendingBattleUnlockRound === incomingRound;
          isMemoryObserving = false;
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
          if (countdownHint) {
            countdownHint.innerHTML = currentSlideIndex === 17
              ? 'Bersiaplah! Hafalan 20 gambar di proyektor akan dimulai...'
              : 'Bersiaplah! Tantangan akan terbuka dalam hitungan...';
          }
          playBellChime();
        } else {
          if (currentSlideIndex === 17) {
            // Babak 3: Memory observation starts on projector!
            isMemoryObserving = true;
            isBattleUnlocked = false;
            countdownDisplay.textContent = '👀 HAFALKAN!';
            countdownDisplay.className = 'countdown-digits-big countdown-pulse';
            if (countdownHint) {
              countdownHint.innerHTML = '👀 <strong>TATAP LAYAR PROYEKTOR DI DEPAN!</strong><br>Hafalkan 20 objek yang sedang di-flip MC bersama timmu!<br>Soal kuis 20 pertanyaan akan serentak terbuka di laptop ini begitu hafalan selesai!';
            }
            playBellChime();
        } else {
          countdownDisplay.textContent = 'MULAI!';
          countdownDisplay.className = 'countdown-digits-big countdown-go';
          if (countdownHint) countdownHint.innerHTML = '🔥 WAKTU BERJALAN! SELESAIKAN MISI SEKARANG!';
          playBellChime();
          // Do not rely on the separate BATTLE_UNLOCKED message. On a
          // different laptop it may arrive before SLIDE_CHANGED and then be
          // cleared by the late slide event. Store the round and unlock once
          // the matching battle slide is active.
          const roundIdx = Number.isInteger(data.payload.round) ? data.payload.round - 1 : -1;
          if (roundIdx >= 0 && roundIdx <= 3) {
            pendingBattleUnlockRound = roundIdx;
            if (currentSlideIndex === getBattleSlideIndex(roundIdx)) {
              setTimeout(() => {
                isBattleUnlocked = true;
                evaluateScreenState();
              }, 700);
            }
          }
        }
      }
      }
    } else if (data.type === 'MEMORY_OBSERVATION_START') {
      isMemoryObserving = true;
      isBattleUnlocked = false;
      const countdownDisplay = document.getElementById('battle-countdown-display');
      const countdownHint = document.getElementById('battle-countdown-hint');
      if (countdownDisplay) {
        countdownDisplay.textContent = '👀 HAFALKAN!';
        countdownDisplay.className = 'countdown-digits-big countdown-pulse';
      }
      if (countdownHint) {
        countdownHint.innerHTML = '👀 <strong>TATAP LAYAR PROYEKTOR DI DEPAN!</strong><br>Hafalkan 20 objek yang sedang di-flip MC bersama timmu!<br>Soal kuis 20 pertanyaan akan serentak terbuka di laptop ini begitu hafalan selesai!';
      }
      evaluateScreenState();
    } else if (data.type === 'MEMORY_START_QUIZ') {
      isMemoryObserving = false;
      isBattleUnlocked = true;
      evaluateScreenState();
    } else if (data.type === 'BATTLE_UNLOCKED') {
      const roundIdx = Number.isInteger(data.payload.round) ? data.payload.round - 1 : -1;
      pendingBattleUnlockRound = roundIdx >= 0 && roundIdx <= 3 ? roundIdx : pendingBattleUnlockRound;
      isBattleUnlocked = roundIdx < 0 || currentSlideIndex === getBattleSlideIndex(roundIdx);
      isMemoryObserving = false;
      evaluateScreenState();
    } else if ((data.type === 'TIMER_TICK' || data.type === 'TIMER_UPDATE')
      && (!data.payload.timerId || data.payload.timerId === 1)) {
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
  if (debugSlide && debugSlide >= 1) {
    currentSlideIndex = debugSlide - 1;
    if (debugBattle) {
      isBattleUnlocked = true;
    }
  }
  updatePosIdentity(assignedPos);
  evaluateScreenState();
  if (window.HHSync) {
    window.HHSync.send('REQUEST_STATUS');
  }
});
