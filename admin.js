/**
 * Admin & Remote Control Logic for Regroup Happy Hour
 * Syncs with index.html via BroadcastChannel and localStorage
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
  // 1. SLIDE REMOTE CONTROL
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
    }
  };

  // Request initial slide status on open
  broadcast('REQUEST_STATUS');

  // ==========================================================================
  // 2. OLYMPIC SCORE TRACKER (KELOMPOK 1 - 6)
  // ==========================================================================
  const defaultTeams = [
    { id: 1, name: 'Kelompok 1', scores: [0, 0, 0, 0], attempts: ['none', 'none', 'none', 'none'] },
    { id: 2, name: 'Kelompok 2', scores: [0, 0, 0, 0], attempts: ['none', 'none', 'none', 'none'] },
    { id: 3, name: 'Kelompok 3', scores: [0, 0, 0, 0], attempts: ['none', 'none', 'none', 'none'] },
    { id: 4, name: 'Kelompok 4', scores: [0, 0, 0, 0], attempts: ['none', 'none', 'none', 'none'] },
    { id: 5, name: 'Kelompok 5', scores: [0, 0, 0, 0], attempts: ['none', 'none', 'none', 'none'] },
    { id: 6, name: 'Kelompok 6', scores: [0, 0, 0, 0], attempts: ['none', 'none', 'none', 'none'] }
  ];

  let teams = JSON.parse(localStorage.getItem('hh_teams_score')) || defaultTeams;

  const tableBody = document.getElementById('teams-table-body');
  const btnSyncOlympicWinner = document.getElementById('btn-sync-olympic-winner');

  function saveTeams() {
    localStorage.setItem('hh_teams_score', JSON.stringify(teams));
  }

  function calculateTotal(team) {
    return team.scores.reduce((a, b) => a + b, 0);
  }

  function renderScoringTable() {
    tableBody.innerHTML = '';

    // Sort by total descending for leaderboard view
    const sortedTeams = [...teams].sort((a, b) => calculateTotal(b) - calculateTotal(a));

    sortedTeams.forEach((team, rankIdx) => {
      const tr = document.createElement('tr');
      tr.className = 'team-row';

      const total = calculateTotal(team);
      const isLeader = rankIdx === 0 && total > 0;

      tr.innerHTML = `
        <td class="team-name-cell">
          <strong>${isLeader ? '👑 ' : ''}${team.name}</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Peringkat #${rankIdx + 1}</span>
        </td>
        ${[0, 1, 2, 3].map(gameIdx => {
          const score = team.scores[gameIdx];
          const attempt = team.attempts[gameIdx];
          return `
            <td>
              <div style="margin-bottom: 4px; font-family: var(--font-mono); font-weight: 700; color: ${score > 0 ? 'var(--neon-green)' : 'var(--text-dim)'};">
                ${score} Poin
              </div>
              <div class="attempt-btn-group">
                <button class="btn-attempt btn-attempt-5 ${attempt === 'pass_1' ? 'active' : ''}" 
                        onclick="window.handleScore(${team.id}, ${gameIdx}, 'pass_1')">+5 (1st)</button>
                <button class="btn-attempt btn-attempt-fail ${attempt === 'fail_1' ? 'active' : ''}" 
                        onclick="window.handleScore(${team.id}, ${gameIdx}, 'fail_1')">Salah</button>
                <button class="btn-attempt btn-attempt-4 ${attempt === 'pass_2' ? 'active' : ''}" 
                        onclick="window.handleScore(${team.id}, ${gameIdx}, 'pass_2')">+4 (2nd)</button>
              </div>
            </td>
          `;
        }).join('')}
        <td>
          <span class="score-badge">${total} Pts</span>
        </td>
        <td>
          <button class="btn btn-xs btn-outline" onclick="window.resetTeamScore(${team.id})">Reset</button>
        </td>
      `;
      tableBody.appendChild(tr);
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
      team.attempts[gameIdx] = 'fail_1'; // Enables 2nd attempt +4
    } else if (action === 'pass_2') {
      team.scores[gameIdx] = 4;
      team.attempts[gameIdx] = 'pass_2';
    }

    saveTeams();
    renderScoringTable();
  };

  window.resetTeamScore = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    team.scores = [0, 0, 0, 0];
    team.attempts = ['none', 'none', 'none', 'none'];
    saveTeams();
    renderScoringTable();
  };

  btnSyncOlympicWinner.addEventListener('click', () => {
    const sorted = [...teams].sort((a, b) => calculateTotal(b) - calculateTotal(a));
    const winner = sorted[0];
    const winnerName = `${winner.name} (Total: ${calculateTotal(winner)} Poin)`;

    broadcast('SET_WINNER', {
      category: 'olympic',
      name: winnerName
    });

    alert(`👑 Juara Olympic "${winnerName}" berhasil dikirim ke Slide 19 Proyektor!`);
  });

  renderScoringTable();

  // ==========================================================================
  // 3. AWARDING DISPATCHER (COSTUME, LUNCH, ENTERTAIN)
  // ==========================================================================
  const btnSendCostume = document.getElementById('btn-send-costume');
  const adminInputCostume = document.getElementById('admin-input-costume');

  const btnSendLunch = document.getElementById('btn-send-lunch');
  const adminInputLunch = document.getElementById('admin-input-lunch');
  const adminFileLunch = document.getElementById('admin-file-lunch');

  const btnSendEntertain = document.getElementById('btn-send-entertain');
  const adminInputEntertain = document.getElementById('admin-input-entertain');

  btnSendCostume.addEventListener('click', () => {
    const name = adminInputCostume.value.trim() || 'Pemenang Kostum Terbaik';
    broadcast('SET_WINNER', { category: 'costume', name });
    alert(`👔 Pemenang Kostum "${name}" dikirim ke proyektor!`);
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

  btnSendEntertain.addEventListener('click', () => {
    const name = adminInputEntertain.value.trim() || 'Most Entertaining Person';
    broadcast('SET_WINNER', { category: 'entertain', name });
    alert(`🎭 Pemenang Entertaining "${name}" dikirim ke proyektor!`);
  });
});
