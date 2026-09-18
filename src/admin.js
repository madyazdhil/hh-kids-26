/**
 * Admin & Mobile Remote Control Logic for Regroup Happy Hour
 * Specifically tuned for smartphone ergonomics (Aldeina) & desktop.
 */

document.addEventListener('DOMContentLoaded', () => {
  const SYNC_CHANNEL_NAME = 'regroup_happy_hour_sync';
  const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);

  function broadcast(type, payload = {}) {
    const message = { type, payload, timestamp: Date.now() };
    channel.postMessage(message);
    try {
      localStorage.setItem('hh_last_broadcast', JSON.stringify(message));
    } catch (e) {}
  }

  // ==========================================================================
  // 1. MOBILE TAB SWITCHER
  // ==========================================================================
  const tabPills = document.querySelectorAll('.tab-pill');
  const bottomTabs = document.querySelectorAll('.bottom-tab-btn');
  const tabPanes = document.querySelectorAll('.admin-tab-pane');

  function switchTab(tabName) {
    // Update top pills
    tabPills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.tab === tabName);
    });

    // Update bottom tabs
    bottomTabs.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update panes
    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `pane-${tabName}`);
    });

    // Scroll smoothly to top of pane
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  tabPills.forEach(pill => {
    pill.addEventListener('click', () => switchTab(pill.dataset.tab));
  });

  bottomTabs.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // ==========================================================================
  // 2. SLIDE REMOTE CONTROL
  // ==========================================================================
  const activeSlideLabel = document.getElementById('active-slide-label');
  const activeSlideNum = document.getElementById('active-slide-num');
  const remoteSlideSelect = document.getElementById('remote-slide-select');
  const btnRemoteNext = document.getElementById('remote-btn-next');
  const btnRemotePrev = document.getElementById('remote-btn-prev');
  const btnRemoteJump = document.getElementById('remote-btn-jump');
  const remoteTimerToggle = document.getElementById('remote-timer-toggle');
  const remoteTimerReset = document.getElementById('remote-timer-reset');
  const remoteSpinDoorprize = document.getElementById('remote-spin-doorprize');
  const btnBroadcastConfetti = document.getElementById('btn-broadcast-confetti');
  const remoteConnStatus = document.getElementById('remote-conn-status');

  const slideTitles = [
    "1. Pre-Show Lounge",
    "2. Welcome Title Screen (Clean)",
    "3. Game Cari Korban Senam",
    "4. Senam Arcade MR.MINIRA",
    "5. Bumper: Cooling Down Post-Senam",
    "6. Title Splash: Office Olympics",
    "7. Briefing: 4 Pos Laptop Meja Tengah",
    "8. Timer: 1 Menit Ketua Kelompok Mencari",
    "9. Bumper: Waktu Inspeksi Selesai",
    "10. Rules: Strategi Tim & Bel Kak Balqis",
    "11. Timer: 2 Menit Rapat Strategi",
    "12. Bumper: Ready to Battle!",
    "13. Challenge 1: Kalananti (Scratch)",
    "14. Challenge 2: Mathchamps (Speed Math)",
    "15. Challenge 3: Memory Academy (Flash)",
    "16. Challenge 4: Spreadsheet Special (#REF!)",
    "17. Bumper: Sesi Santuy Kenyang Sore",
    "18. Tebak Guardian Angel",
    "19. Grand Awarding Stage",
    "20. Doorprize Nyeleneh Lottery",
    "21. Speech Khidmat Queen Aldeina",
    "22. Closing & Foto Bersama"
  ];

  slideTitles.forEach((title, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = title;
    remoteSlideSelect.appendChild(opt);
  });

  btnRemoteNext.addEventListener('click', () => {
    broadcast('REMOTE_NEXT');
  });

  btnRemotePrev.addEventListener('click', () => {
    broadcast('REMOTE_PREV');
  });

  btnRemoteJump.addEventListener('click', () => {
    const targetIdx = parseInt(remoteSlideSelect.value, 10);
    broadcast('REMOTE_GOTO_SLIDE', { index: targetIdx });
  });

  remoteSlideSelect.addEventListener('change', () => {
    const targetIdx = parseInt(remoteSlideSelect.value, 10);
    broadcast('REMOTE_GOTO_SLIDE', { index: targetIdx });
  });

  remoteTimerToggle.addEventListener('click', () => {
    broadcast('REMOTE_TIMER_TOGGLE');
  });

  remoteTimerReset.addEventListener('click', () => {
    broadcast('REMOTE_TIMER_RESET');
  });

  remoteSpinDoorprize.addEventListener('click', () => {
    broadcast('REMOTE_SPIN_DOORPRIZE');
  });

  btnBroadcastConfetti.addEventListener('click', () => {
    broadcast('REMOTE_CONFETTI');
  });

  // Listen for slide updates from index.html
  channel.onmessage = (event) => {
    const data = event.data;
    if (data.type === 'CURRENT_SLIDE_STATUS') {
      const idx = data.payload.index;
      const title = data.payload.title || `Slide ${idx + 1}`;
      activeSlideLabel.textContent = `Slide ${idx + 1}: ${title}`;
      activeSlideNum.textContent = `${idx + 1} / 22`;
      remoteSlideSelect.value = idx;
      if (remoteConnStatus) {
        remoteConnStatus.textContent = `🟢 Slide ${idx + 1}/22 Online`;
      }
    }
  };

  // Request initial slide status on open
  broadcast('REQUEST_STATUS');

  // ==========================================================================
  // 3. OLYMPIC LIVE SCOREKEEPER (MOBILE-OPTIMIZED CARDS)
  // ==========================================================================
  const gameDefinitions = [
    { id: 0, pos: 'Pos 1', title: 'Scratch Debugging', icon: '🐱' },
    { id: 1, pos: 'Pos 2', title: 'Mathchamps Speed Math', icon: '🧮' },
    { id: 2, pos: 'Pos 3', title: 'Memory Academy Flash', icon: '🧠' },
    { id: 3, pos: 'Pos 4', title: 'Spreadsheet #REF!', icon: '📊' }
  ];

  const defaultTeams = [
    { id: 1, name: 'Kelompok 1', scores: [0, 0, 0, 0], attempts: ['none', 'none', 'none', 'none'] },
    { id: 2, name: 'Kelompok 2', scores: [0, 0, 0, 0], attempts: ['none', 'none', 'none', 'none'] },
    { id: 3, name: 'Kelompok 3', scores: [0, 0, 0, 0], attempts: ['none', 'none', 'none', 'none'] },
    { id: 4, name: 'Kelompok 4', scores: [0, 0, 0, 0], attempts: ['none', 'none', 'none', 'none'] },
    { id: 5, name: 'Kelompok 5', scores: [0, 0, 0, 0], attempts: ['none', 'none', 'none', 'none'] },
    { id: 6, name: 'Kelompok 6', scores: [0, 0, 0, 0], attempts: ['none', 'none', 'none', 'none'] }
  ];

  let teams = JSON.parse(localStorage.getItem('hh_teams_score')) || defaultTeams;
  let currentPosFilter = 'all';

  const teamsCardsContainer = document.getElementById('teams-cards-container');
  const btnSyncOlympicWinner = document.getElementById('btn-sync-olympic-winner');
  const posFilterButtons = document.querySelectorAll('.pos-filter-btn');

  function saveTeams() {
    localStorage.setItem('hh_teams_score', JSON.stringify(teams));
  }

  function calculateTotal(team) {
    return team.scores.reduce((a, b) => a + b, 0);
  }

  // Handle Pos Filter
  posFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      posFilterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPosFilter = btn.dataset.pos;
      renderTeamCards();
    });
  });

  function renderTeamCards() {
    teamsCardsContainer.innerHTML = '';

    // Sort by total descending
    const sortedTeams = [...teams].sort((a, b) => calculateTotal(b) - calculateTotal(a));

    sortedTeams.forEach((team, rankIdx) => {
      const total = calculateTotal(team);
      const isLeader = rankIdx === 0 && total > 0;

      const card = document.createElement('div');
      card.className = `team-mobile-card ${isLeader ? 'leader' : ''}`;

      // Games to display (filter by pos or show all)
      const gamesToShow = currentPosFilter === 'all' 
        ? gameDefinitions 
        : gameDefinitions.filter(g => g.id === parseInt(currentPosFilter, 10));

      card.innerHTML = `
        <div class="team-card-header">
          <div class="team-title-row">
            <span class="team-rank-badge ${isLeader ? 'leader' : ''}">${isLeader ? '👑 #1' : `#${rankIdx + 1}`}</span>
            <span class="team-name">${team.name}</span>
          </div>
          <div class="team-total-score">${total} Pts</div>
        </div>

        <div class="game-scoring-rows">
          ${gamesToShow.map(game => {
            const score = team.scores[game.id];
            const attempt = team.attempts[game.id];
            const isScored = score > 0;

            return `
              <div class="game-score-item">
                <div class="game-item-top">
                  <span class="game-pos-label">${game.icon} ${game.pos}: ${game.title}</span>
                  <span class="game-points-label ${isScored ? 'scored' : 'zero'}">${score} Poin</span>
                </div>
                <div class="game-attempt-buttons">
                  <button class="btn-attempt btn-attempt-5 ${attempt === 'pass_1' ? 'active' : ''}" 
                          onclick="window.handleScore(${team.id}, ${game.id}, 'pass_1')">
                    +5 (1st)
                  </button>
                  <button class="btn-attempt btn-attempt-fail ${attempt === 'fail_1' ? 'active' : ''}" 
                          onclick="window.handleScore(${team.id}, ${game.id}, 'fail_1')">
                    Salah
                  </button>
                  <button class="btn-attempt btn-attempt-4 ${attempt === 'pass_2' ? 'active' : ''}" 
                          onclick="window.handleScore(${team.id}, ${game.id}, 'pass_2')">
                    +4 (2nd)
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="team-card-footer">
          <button class="btn-reset-team" onclick="window.resetTeamScore(${team.id})">
            ↺ Reset Nilai ${team.name}
          </button>
        </div>
      `;

      teamsCardsContainer.appendChild(card);
    });
  }

  window.handleScore = (teamId, gameIdx, action) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    if (action === 'pass_1') {
      team.scores[gameIdx] = 5;
      team.attempts[gameIdx] = 'pass_1';
    } else if (action === 'fail_1') {
      team.scores[gameIdx] = 0;
      team.attempts[gameIdx] = 'fail_1'; // Downgrades next attempt to 4 pts
    } else if (action === 'pass_2') {
      team.scores[gameIdx] = 4;
      team.attempts[gameIdx] = 'pass_2';
    }

    saveTeams();
    renderTeamCards();
  };

  window.resetTeamScore = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    if (!confirm(`Reset semua skor untuk ${team.name}?`)) return;
    team.scores = [0, 0, 0, 0];
    team.attempts = ['none', 'none', 'none', 'none'];
    saveTeams();
    renderTeamCards();
  };

  btnSyncOlympicWinner.addEventListener('click', () => {
    const sorted = [...teams].sort((a, b) => calculateTotal(b) - calculateTotal(a));
    const winner = sorted[0];
    const total = calculateTotal(winner);
    
    if (total === 0) {
      if (!confirm('Skor tertinggi saat ini masih 0 poin. Tetap kirim ke proyektor?')) {
        return;
      }
    }

    const winnerName = `${winner.name} (Total: ${total} Poin)`;

    broadcast('SET_WINNER', {
      category: 'olympic',
      name: winnerName
    });

    alert(`👑 Juara Olympic "${winnerName}" berhasil dikirim ke Slide 19 Proyektor!`);
  });

  renderTeamCards();

  // ==========================================================================
  // 4. AWARDING DISPATCHER (LUNCH, COSTUME, ENTERTAIN)
  // ==========================================================================
  const btnSendLunch = document.getElementById('btn-send-lunch');
  const adminInputLunch = document.getElementById('admin-input-lunch');
  const adminFileLunch = document.getElementById('admin-file-lunch');
  const lunchPreviewBox = document.getElementById('lunch-photo-preview');
  const lunchPreviewImg = document.getElementById('lunch-preview-img');

  const btnSendCostume = document.getElementById('btn-send-costume');
  const adminInputCostume = document.getElementById('admin-input-costume');

  const btnSendEntertain = document.getElementById('btn-send-entertain');
  const adminInputEntertain = document.getElementById('admin-input-entertain');

  // Preview lunch photo on select
  adminFileLunch.addEventListener('change', () => {
    const file = adminFileLunch.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        lunchPreviewImg.src = e.target.result;
        lunchPreviewBox.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  btnSendLunch.addEventListener('click', () => {
    const name = adminInputLunch.value.trim() || 'Aulia & Nurul';
    const file = adminFileLunch.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        broadcast('SET_WINNER', {
          category: 'lunch',
          name,
          photoDataUrl: e.target.result
        });
        alert(`🍱 Pemenang Lunch "${name}" dan foto berhasil dikirim ke proyektor!`);
      };
      reader.readAsDataURL(file);
    } else {
      broadcast('SET_WINNER', { category: 'lunch', name });
      alert(`🍱 Pemenang Lunch "${name}" berhasil dikirim ke proyektor!`);
    }
  });

  btnSendCostume.addEventListener('click', () => {
    const name = adminInputCostume.value.trim() || 'Pemenang Kostum Terbaik';
    broadcast('SET_WINNER', { category: 'costume', name });
    alert(`👔 Pemenang Kostum "${name}" dikirim ke proyektor!`);
  });

  btnSendEntertain.addEventListener('click', () => {
    const name = adminInputEntertain.value.trim() || 'Most Entertaining Person';
    broadcast('SET_WINNER', { category: 'entertain', name });
    alert(`🎭 Pemenang Entertaining "${name}" dikirim ke proyektor!`);
  });
});
