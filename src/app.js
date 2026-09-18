/**
 * Regroup Happy Hour - Presentation Deck & MC Control Center
 * Built for Academic Kids Ruangguru (Kids Product MSIG)
 * Date: September 18, 2026 | Location: Ruang Da Vinci (HQ MSIG)
 * Atomic 22-Slide Engine with Remote BroadcastChannel Synchronization
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. WEB AUDIO API SYNTHESIZER (ZERO MISSING ASSET RISK)
  // ==========================================================================
  let audioCtx = null;
  let isMuted = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  const SoundFx = {
    playClick() {
      if (isMuted) return;
      initAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    },

    playTick() {
      if (isMuted) return;
      initAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(900, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    },

    playDing() {
      if (isMuted) return;
      initAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.15); // E6
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    },

    playBuzzer() {
      if (isMuted) return;
      initAudio();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(140, audioCtx.currentTime);
      osc2.frequency.setValueAtTime(145, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.28, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 1.2);
      osc2.stop(audioCtx.currentTime + 1.2);
    },

    playDrumroll() {
      if (isMuted) return;
      initAudio();
      const totalPops = 24;
      let delay = 0;
      for (let i = 0; i < totalPops; i++) {
        const stepTime = audioCtx.currentTime + delay;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120 + Math.random() * 40, stepTime);
        gain.gain.setValueAtTime(0.15, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(stepTime);
        osc.stop(stepTime + 0.05);
        delay += Math.max(0.04, 0.12 - (i * 0.0035));
      }
    },

    playFanfare() {
      if (isMuted) return;
      initAudio();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const startTime = audioCtx.currentTime + (idx * 0.12);
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        const duration = (idx === notes.length - 1) ? 0.8 : 0.2;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    },

    playMystery() {
      if (isMuted) return;
      initAudio();
      const freqs = [330, 392, 493.88, 587.33]; // Em chord
      freqs.forEach((freq, idx) => {
        const startTime = audioCtx.currentTime + (idx * 0.18);
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + 1.2);
      });
    }
  };

  // Mute button handler
  const btnAudio = document.getElementById('btn-audio');
  if (btnAudio) {
    btnAudio.addEventListener('click', () => {
      isMuted = !isMuted;
      btnAudio.textContent = isMuted ? '🔇' : '🔊';
      btnAudio.title = isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)';
    });
  }

  // ==========================================================================
  // 2. THREE.JS PARTICLE STARFIELD (WEBGL BACKGROUND)
  // ==========================================================================
  const canvas = document.getElementById('bg-canvas');
  if (canvas && typeof THREE !== 'undefined') {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color('#00f0ff'),
      new THREE.Color('#ffd700'),
      new THREE.Color('#38bdf8'),
      new THREE.Color('#1e3a8a')
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 800;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 800;

      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let mouseX = 0;
    let mouseY = 0;
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.05;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.05;
    });

    function animateParticles() {
      requestAnimationFrame(animateParticles);
      particles.rotation.y += 0.0006;
      particles.rotation.x += 0.0003;
      camera.position.x += (mouseX - camera.position.x) * 0.02;
      camera.position.y += (-mouseY - camera.position.y) * 0.02;
      renderer.render(scene, camera);
    }
    animateParticles();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // ==========================================================================
  // 3. SLIDE ENGINE & NAVIGATION (22 SLIDES)
  // ==========================================================================
  const slides = Array.from(document.querySelectorAll('.slide'));
  const totalSlides = slides.length;
  let currentSlideIndex = 0;

  const slideCounter = document.getElementById('slide-counter');
  const slideDotsContainer = document.getElementById('slide-dots');
  const slideSelect = document.getElementById('slide-select');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const syncStatus = document.getElementById('sync-status');

  // Build dots and dropdown selector
  slides.forEach((slide, idx) => {
    const dot = document.createElement('div');
    dot.className = `dot-indicator ${idx === 0 ? 'active' : ''}`;
    dot.title = `Slide ${idx + 1}: ${slide.dataset.title || ''}`;
    dot.addEventListener('click', () => goToSlide(idx));
    slideDotsContainer.appendChild(dot);

    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = `${idx + 1}. ${slide.dataset.title || `Slide ${idx + 1}`}`;
    slideSelect.appendChild(opt);
  });

  slideSelect.addEventListener('change', (e) => {
    goToSlide(parseInt(e.target.value, 10));
  });

  function updateSlideUI() {
    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === currentSlideIndex);
    });

    const dots = slideDotsContainer.querySelectorAll('.dot-indicator');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlideIndex);
    });

    slideCounter.textContent = `Slide ${currentSlideIndex + 1} / ${totalSlides}`;
    slideSelect.value = currentSlideIndex;

    const activeSlide = slides[currentSlideIndex];
    if (activeSlide) {
      activeSlide.scrollTop = 0;
    }

    // Broadcast current slide status to Admin Panel
    broadcastSync('CURRENT_SLIDE_STATUS', {
      index: currentSlideIndex,
      title: activeSlide ? activeSlide.dataset.title : ''
    });
  }

  function goToSlide(index, shouldBroadcast = true) {
    if (index >= 0 && index < totalSlides) {
      // Auto-pause timer if moving away from timer slide
      if (currentSlideIndex === 7 && timers[1].isRunning) {
        clearInterval(timers[1].intervalId);
        timers[1].isRunning = false;
        broadcastSync('TIMER_UPDATE', { timerId: 1, isRunning: false, currentSec: timers[1].currentSec, totalSec: timers[1].totalSec });
      }
      if (currentSlideIndex === 10 && timers[2].isRunning) {
        clearInterval(timers[2].intervalId);
        timers[2].isRunning = false;
        broadcastSync('TIMER_UPDATE', { timerId: 2, isRunning: false, currentSec: timers[2].currentSec, totalSec: timers[2].totalSec });
      }

      currentSlideIndex = index;
      updateSlideUI();
      SoundFx.playClick();
      if (shouldBroadcast) {
        broadcastSync('SLIDE_CHANGED', {
          index: currentSlideIndex,
          title: slides[currentSlideIndex] ? slides[currentSlideIndex].dataset.title : ''
        });
      }
    }
  }

  function prevSlide() {
    if (currentSlideIndex > 0) {
      goToSlide(currentSlideIndex - 1);
    }
  }

  function advanceOrNext() {
    const activeSlide = slides[currentSlideIndex];
    if (activeSlide && activeSlide.classList.contains('battle-arena-slide')) {
      const round = parseInt(activeSlide.dataset.round, 10);
      const statusEl = document.getElementById(`battle-status-${round}`);
      if (statusEl) {
        if (statusEl.textContent.includes('SEDANG BERJALAN')) {
          return;
        }
        if (!statusEl.textContent.includes('AKTIF')) {
          triggerBattleCountdown(round);
          return;
        }
      }
    }

    const unrevealedStep = activeSlide.querySelector('.step-reveal:not(.active)');

    if (unrevealedStep) {
      unrevealedStep.classList.add('active');
      SoundFx.playDing();
    } else {
      if (currentSlideIndex < totalSlides - 1) {
        goToSlide(currentSlideIndex + 1);
      }
    }
  }

  if (btnPrev) btnPrev.addEventListener('click', prevSlide);
  if (btnNext) btnNext.addEventListener('click', advanceOrNext);

  // Explicit step reveal buttons inside challenges
  document.querySelectorAll('.btn-step').forEach(btn => {
    btn.addEventListener('click', () => {
      advanceOrNext();
    });
  });

  // ==========================================================================
  // 4. COUNTDOWN TIMERS (SLIDE 8: POS INSPECTION & SLIDE 11: STRATEGY)
  // ==========================================================================
  const timers = {
    1: { totalSec: 60, currentSec: 60, isRunning: false, intervalId: null, displayEl: document.getElementById('timer-display-1') },
    2: { totalSec: 120, currentSec: 120, isRunning: false, intervalId: null, displayEl: document.getElementById('timer-display-2') }
  };

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function renderTimer(timerId) {
    const t = timers[timerId];
    if (t && t.displayEl) {
      t.displayEl.textContent = formatTime(t.currentSec);
      if (t.currentSec <= 10 && t.currentSec > 0) {
        t.displayEl.classList.add('pulsing');
      } else {
        t.displayEl.classList.remove('pulsing');
      }
    }
  }

  function toggleTimer(timerId) {
    const t = timers[timerId];
    if (!t) return;
    const tid = parseInt(timerId, 10);

    if (t.isRunning) {
      clearInterval(t.intervalId);
      t.isRunning = false;
      const btn = document.querySelector(`.btn-start-timer[data-timer="${timerId}"]`);
      if (btn) btn.textContent = '▶ RESUME (T)';
      broadcastSync('TIMER_UPDATE', { timerId: tid, isRunning: false, currentSec: t.currentSec, totalSec: t.totalSec });
    } else {
      initAudio();
      t.isRunning = true;
      const btn = document.querySelector(`.btn-start-timer[data-timer="${timerId}"]`);
      if (btn) btn.textContent = '⏸ PAUSE (T)';
      broadcastSync('TIMER_UPDATE', { timerId: tid, isRunning: true, currentSec: t.currentSec, totalSec: t.totalSec });

      t.intervalId = setInterval(() => {
        if (t.currentSec > 0) {
          t.currentSec--;
          renderTimer(timerId);
          broadcastSync('TIMER_TICK', { timerId: tid, isRunning: true, currentSec: t.currentSec, totalSec: t.totalSec });
          if (t.currentSec <= 10 && t.currentSec > 0) {
            SoundFx.playTick();
          }
          if (t.currentSec === 0) {
            clearInterval(t.intervalId);
            t.isRunning = false;
            if (btn) btn.textContent = '▶ START (T)';
            SoundFx.playBuzzer();
            broadcastSync('TIMER_EXPIRED', { timerId: tid, isRunning: false, currentSec: 0, totalSec: t.totalSec });
          }
        }
      }, 1000);
    }
  }

  function resetTimer(timerId) {
    const t = timers[timerId];
    if (!t) return;
    const tid = parseInt(timerId, 10);
    clearInterval(t.intervalId);
    t.isRunning = false;
    t.currentSec = t.totalSec;
    renderTimer(timerId);
    const btn = document.querySelector(`.btn-start-timer[data-timer="${timerId}"]`);
    if (btn) btn.textContent = '▶ START (T)';
    broadcastSync('TIMER_RESET', { timerId: tid, isRunning: false, currentSec: t.totalSec, totalSec: t.totalSec });
  }

  document.querySelectorAll('.btn-start-timer').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const timerId = e.currentTarget.dataset.timer;
      toggleTimer(timerId);
    });
  });

  document.querySelectorAll('.btn-reset-timer').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const timerId = e.currentTarget.dataset.timer;
      resetTimer(timerId);
    });
  });

  document.querySelectorAll('.timer-presets .preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const timerId = e.currentTarget.dataset.timer;
      const sec = parseInt(e.currentTarget.dataset.sec, 10);
      const parent = e.currentTarget.parentElement;
      parent.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');

      const t = timers[timerId];
      if (t) {
        t.totalSec = sec;
        resetTimer(timerId);
      }
    });
  });

  renderTimer(1);
  renderTimer(2);

  // ==========================================================================
  // 5. YOUTUBE MUSIC SANDBOX (PRE-SHOW)
  // ==========================================================================
  const ytSearchInput = document.getElementById('yt-search-input');
  const btnLoadYt = document.getElementById('btn-load-yt');
  const btnOpenYt = document.getElementById('btn-open-yt');
  const bgmPlayer = document.getElementById('bgm-player');
  const presetPills = document.querySelectorAll('.quick-presets .preset-pill');
  const fileWarning = document.getElementById('file-protocol-warning');

  if (window.location.protocol === 'file:' && fileWarning) {
    fileWarning.classList.remove('hidden');
  }

  function parseYouTubeEmbedUrl(url) {
    let videoId = 'lTRiuFIWV54';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split(/[?&]/)[0];
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1].split('&')[0];
    } else if (url.includes('embed/')) {
      videoId = url.split('embed/')[1].split(/[?&]/)[0];
    }
    const originParam = window.location.protocol.startsWith('http') ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1${originParam}`;
  }

  function updateYtPlayer(url) {
    if (!url) return;
    if (bgmPlayer) bgmPlayer.src = parseYouTubeEmbedUrl(url);
    if (btnOpenYt) btnOpenYt.href = url.startsWith('http') ? url : `https://www.youtube.com/watch?v=${url}`;
    SoundFx.playClick();
  }

  if (btnLoadYt && ytSearchInput) {
    btnLoadYt.addEventListener('click', () => {
      const url = ytSearchInput.value.trim();
      updateYtPlayer(url);
    });

    presetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        presetPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const url = pill.dataset.url;
        ytSearchInput.value = url;
        updateYtPlayer(url);
      });
    });
  }

  // ==========================================================================
  // 6. MINI GAME SELEKSI & WORKOUT VIDEO
  // ==========================================================================
  const btnDrumroll = document.getElementById('btn-drumroll');
  const btnKorbanFound = document.getElementById('btn-korban-found');
  const korbanBanner = document.getElementById('korban-banner');

  if (btnDrumroll) {
    btnDrumroll.addEventListener('click', () => {
      SoundFx.playDrumroll();
    });
  }

  if (btnKorbanFound) {
    btnKorbanFound.addEventListener('click', () => {
      if (korbanBanner) {
        korbanBanner.classList.remove('hidden');
      }
      SoundFx.playFanfare();
      if (typeof confetti === 'function') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    });
  }

  // Workout Video postMessage Controls
  const btnPlaySenam = document.getElementById('btn-play-senam');
  const btnPauseSenam = document.getElementById('btn-pause-senam');
  const senamIframe = document.getElementById('senam-iframe');

  function sendYTCommand(iframe, command) {
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: command,
        args: []
      }), '*');
    }
  }

  if (btnPlaySenam && senamIframe) {
    btnPlaySenam.addEventListener('click', () => {
      sendYTCommand(senamIframe, 'playVideo');
      SoundFx.playClick();
    });
  }

  if (btnPauseSenam && senamIframe) {
    btnPauseSenam.addEventListener('click', () => {
      sendYTCommand(senamIframe, 'pauseVideo');
      SoundFx.playClick();
    });
  }

  const btnAngelSfx = document.getElementById('btn-angel-sfx');
  if (btnAngelSfx) {
    btnAngelSfx.addEventListener('click', () => {
      SoundFx.playMystery();
    });
  }

  // ==========================================================================
  // 6B. BATTLE ARENA COUNTDOWN ENGINE (SLIDES 14, 16, 18, 20)
  // ==========================================================================
  const battleCountdowns = {};

  function triggerBattleCountdown(roundNum) {
    const displayEl = document.getElementById(`battle-countdown-${roundNum}`);
    const statusEl = document.getElementById(`battle-status-${roundNum}`);
    if (!displayEl) return;

    if (battleCountdowns[roundNum] && battleCountdowns[roundNum].interval) {
      clearInterval(battleCountdowns[roundNum].interval);
    }

    let count = 3;
    displayEl.parentElement.classList.add('counting');
    displayEl.innerHTML = `<span class="countdown-digit-huge pulse-glow">${count}</span>`;
    if (statusEl) statusEl.textContent = 'BERSIAPLAH! HITUNGAN MUNDUR SEDANG BERJALAN...';
    SoundFx.playTick();
    broadcastSync('BATTLE_COUNTDOWN', { round: roundNum, count: count });

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        displayEl.innerHTML = `<span class="countdown-digit-huge pulse-glow">${count}</span>`;
        SoundFx.playTick();
        broadcastSync('BATTLE_COUNTDOWN', { round: roundNum, count: count });
      } else {
        clearInterval(interval);
        displayEl.innerHTML = `<span class="countdown-digit-huge" style="color: #00ff9d; font-size: 3rem; text-shadow: 0 0 30px #00ff9d;">MULAI!</span>`;
        if (statusEl) statusEl.innerHTML = '🔥 PERTANDINGAN AKTIF! KAK BALQIS STANDBY DENGAN BEL! 🔥';
        SoundFx.playDing();
        broadcastSync('BATTLE_COUNTDOWN', { round: roundNum, count: 0 });
        broadcastSync('BATTLE_UNLOCKED', { round: roundNum });
      }
    }, 1000);

    battleCountdowns[roundNum] = { interval };
  }

  // Bind trigger buttons on slides
  document.querySelectorAll('.btn-trigger-countdown').forEach(btn => {
    btn.addEventListener('click', () => {
      const round = parseInt(btn.dataset.round, 10);
      triggerBattleCountdown(round);
    });
  });

  // Bind spectator round openers
  document.querySelectorAll('.btn-open-spectator-round').forEach(btn => {
    btn.addEventListener('click', () => {
      const round = parseInt(btn.dataset.round, 10);
      if (typeof openSpectatorOverlay === 'function') {
        openSpectatorOverlay();
        if (typeof setSpectatorMode === 'function') {
          setSpectatorMode(`pos${round}`);
        }
      }
    });
  });

  // ==========================================================================
  // 7. GRAND AWARDING & PHOTO DISPLAY (SLIDE 23)
  // ==========================================================================
  function revealWinnerOnCard(cardId, winnerName, photoDataUrl = null) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const input = card.querySelector('.winner-input');
    const placeholder = card.querySelector('.winner-placeholder');
    const btn = card.querySelector('.btn-reveal-winner');

    placeholder.textContent = winnerName;
    placeholder.classList.add('revealed');
    if (input) input.classList.add('hidden');
    if (btn) btn.classList.add('hidden');

    if (photoDataUrl) {
      const img = card.querySelector('#lunch-photo-img');
      const emptyText = card.querySelector('#lunch-photo-empty');
      if (img) {
        img.src = photoDataUrl;
        img.classList.remove('hidden');
      }
      if (emptyText) emptyText.classList.add('hidden');
    }

    SoundFx.playFanfare();
    if (typeof confetti === 'function') {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }

  document.querySelectorAll('.btn-reveal-winner').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.currentTarget.closest('.award-card');
      const input = card.querySelector('.winner-input');
      const name = input.value.trim() || 'TIM JUARA SEJATI';
      revealWinnerOnCard(card.id, name);
    });
  });

  const btnUploadLunch = document.getElementById('btn-upload-lunch');
  const lunchPhotoInput = document.getElementById('lunch-photo-input');
  const lunchPhotoImg = document.getElementById('lunch-photo-img');
  const lunchPhotoEmpty = document.getElementById('lunch-photo-empty');

  if (btnUploadLunch && lunchPhotoInput) {
    btnUploadLunch.addEventListener('click', () => {
      lunchPhotoInput.click();
    });

    lunchPhotoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (lunchPhotoImg) {
            lunchPhotoImg.src = event.target.result;
            lunchPhotoImg.classList.remove('hidden');
          }
          if (lunchPhotoEmpty) lunchPhotoEmpty.classList.add('hidden');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // ==========================================================================
  // 8. DOORPRIZE NYELENEH LOTTERY MACHINE (SLIDE 20)
  // ==========================================================================
  const doorprizePool = [
    { name: '🩴 Sendal Jepit Anti-Slip', desc: 'Penunjang mobilitas super cepat saat dipanggil meeting dadakan' },
    { name: '🌿 Minyak Kayu Putih Cap Lang', desc: 'Tameng pertahanan mutlak dari dinginnya hembusan AC Da Vinci' },
    { name: '🍵 Tolak Angin Sachet 1 Box', desc: 'Kearifan lokal pekerja pintar untuk ketahanan lembur tanpa ampun' },
    { name: '🌶️ Sekantong Cabai Rawit Segar', desc: 'Booster mata ngantuk dan penambah gairah revisi backlog' },
    { name: '🍫 Beng-Beng Jumbo 1 Kotak', desc: 'Pasokan gula darah instan penolong jam kritis 4 sore' },
    { name: '🩹 Hansaplast & Tisu Basah', desc: 'P3K jari lecet akibat terlalu agresif drag formula Spreadsheet' }
  ];

  const btnSpinDoorprize = document.getElementById('btn-spin-doorprize');
  const luckyNumberEl = document.getElementById('lucky-number');
  const prizeNameEl = document.getElementById('prize-name');
  const prizeDescEl = document.getElementById('prize-desc');

  let isSpinning = false;
  function triggerDoorprizeSpin() {
    if (isSpinning) return;
    isSpinning = true;
    if (btnSpinDoorprize) {
      btnSpinDoorprize.disabled = true;
      btnSpinDoorprize.textContent = '🎰 MENGUNDI...';
    }
    if (luckyNumberEl) luckyNumberEl.classList.add('spinning');
    if (prizeNameEl) prizeNameEl.textContent = 'Mengocok Nama...';
    if (prizeDescEl) prizeDescEl.textContent = 'Harap tegang dan tahan napas!';

    SoundFx.playDrumroll();

    let counter = 0;
    const spinInterval = setInterval(() => {
      if (luckyNumberEl) {
        luckyNumberEl.textContent = String(Math.floor(Math.random() * 50) + 1).padStart(2, '0');
      }
      counter++;
      if (counter % 3 === 0) SoundFx.playTick();
    }, 70);

    setTimeout(() => {
      clearInterval(spinInterval);
      if (luckyNumberEl) {
        luckyNumberEl.classList.remove('spinning');
        const finalNum = Math.floor(Math.random() * 40) + 1;
        luckyNumberEl.textContent = String(finalNum).padStart(2, '0');
      }

      const randomPrize = doorprizePool[Math.floor(Math.random() * doorprizePool.length)];
      if (prizeNameEl) prizeNameEl.textContent = randomPrize.name;
      if (prizeDescEl) prizeDescEl.textContent = randomPrize.desc;

      isSpinning = false;
      if (btnSpinDoorprize) {
        btnSpinDoorprize.disabled = false;
        btnSpinDoorprize.textContent = '🎰 PUTAR NOMOR LAGI!';
      }

      SoundFx.playFanfare();
      if (typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      }
    }, 2400);
  }

  if (btnSpinDoorprize) {
    btnSpinDoorprize.addEventListener('click', triggerDoorprizeSpin);
  }

  // ==========================================================================
  // 9. GRAND CONFETTI (SLIDE 22)
  // ==========================================================================
  const btnGrandConfetti = document.getElementById('btn-grand-confetti');
  function triggerGrandConfetti() {
    SoundFx.playFanfare();
    if (typeof confetti === 'function') {
      const count = 250;
      const defaults = { origin: { y: 0.7 } };

      function fire(particleRatio, opts) {
        confetti(Object.assign({}, defaults, opts, {
          particleCount: Math.floor(count * particleRatio)
        }));
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }

  if (btnGrandConfetti) {
    btnGrandConfetti.addEventListener('click', triggerGrandConfetti);
  }

  // ==========================================================================
  // 10. REAL-TIME BROADCAST CHANNEL & REMOTE CONTROL SYNC
  // ==========================================================================
  function broadcastSync(type, payload = {}) {
    if (window.HHSync) {
      window.HHSync.send(type, payload);
    } else {
      const message = { type, payload, timestamp: Date.now() };
      try {
        const ch = new BroadcastChannel('regroup_happy_hour_sync');
        ch.postMessage(message);
      } catch (e) {}
      try {
        localStorage.setItem('hh_last_broadcast', JSON.stringify(message));
      } catch (e) {}
    }
  }

  function handleRemoteCommand(data) {
    if (!data || !data.type) return;

    if (syncStatus) {
      syncStatus.textContent = '⚡ Remote: Aktif';
      syncStatus.classList.add('active');
    }

    switch (data.type) {
      case 'SLIDE_CHANGED':
        if (typeof data.payload.index === 'number' && data.payload.index !== currentSlideIndex) {
          goToSlide(data.payload.index, false); // Do not echo broadcast back
        }
        break;

      case 'REMOTE_NEXT':
        advanceOrNext();
        break;

      case 'REMOTE_PREV':
        prevSlide();
        break;

      case 'REMOTE_GOTO_SLIDE':
        if (typeof data.payload.index === 'number') {
          goToSlide(data.payload.index, true);
        }
        break;

      case 'REMOTE_TIMER_TOGGLE':
        if (currentSlideIndex === 7) {
          toggleTimer(1);
        } else if (currentSlideIndex === 10) {
          toggleTimer(2);
        }
        break;

      case 'REMOTE_TIMER_RESET':
        if (currentSlideIndex === 7) {
          resetTimer(1);
        } else if (currentSlideIndex === 10) {
          resetTimer(2);
        }
        break;

      case 'REMOTE_SPIN_DOORPRIZE':
        const doorprizeSlide = document.getElementById('slide-doorprize') || document.querySelector('[data-id="slide-doorprize"]');
        const doorprizeIdx = doorprizeSlide ? Array.from(slides).indexOf(doorprizeSlide) : 23;
        goToSlide(doorprizeIdx, true);
        setTimeout(() => triggerDoorprizeSpin(), 400);
        break;

      case 'REMOTE_CONFETTI':
        triggerGrandConfetti();
        break;

      case 'SET_WINNER':
        const cat = data.payload.category;
        const name = data.payload.name;
        const photo = data.payload.photoDataUrl;

        const awardingSlide = document.getElementById('slide-awarding') || document.querySelector('[data-id="slide-awarding"]');
        const awardingIdx = awardingSlide ? Array.from(slides).indexOf(awardingSlide) : 22;
        goToSlide(awardingIdx, true);
        setTimeout(() => {
          if (cat === 'olympic') {
            revealWinnerOnCard('award-olympic', name);
          } else if (cat === 'costume') {
            revealWinnerOnCard('award-costume', name);
          } else if (cat === 'lunch') {
            revealWinnerOnCard('award-lunch', name, photo);
          } else if (cat === 'entertain') {
            revealWinnerOnCard('award-entertain', name);
          }
        }, 400);
        break;

      case 'REQUEST_STATUS':
        broadcastSync('CURRENT_SLIDE_STATUS', {
          index: currentSlideIndex,
          title: slides[currentSlideIndex] ? slides[currentSlideIndex].dataset.title : ''
        });
        break;

      case 'SPECTATOR_TOGGLE':
        toggleSpectatorOverlay();
        break;

      case 'SPECTATOR_FOCUS':
        if (data.payload && data.payload.mode) {
          if (!isSpectatorOpen) openSpectatorOverlay();
          setSpectatorMode(data.payload.mode);
        }
        break;

      default:
        break;
    }
  }

  // Register with Universal Sync Hub
  if (window.HHSync) {
    window.HHSync.onMessage(handleRemoteCommand);
  } else {
    try {
      const syncChannel = new BroadcastChannel('regroup_happy_hour_sync');
      syncChannel.onmessage = (e) => handleRemoteCommand(e.data);
    } catch (e) {}
    window.addEventListener('storage', (e) => {
      if (e.key === 'hh_last_broadcast' && e.newValue) {
        try {
          handleRemoteCommand(JSON.parse(e.newValue));
        } catch (err) {}
      }
    });
  }

  // ==========================================================================
  // 11. SHORTCUTS MODAL & FULLSCREEN TOGGLE
  // ==========================================================================
  const modal = document.getElementById('shortcuts-modal');
  const btnHelp = document.getElementById('btn-help');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnFullscreen = document.getElementById('btn-fullscreen');

  function toggleModal() {
    modal.classList.toggle('hidden');
    SoundFx.playClick();
  }

  if (btnHelp) btnHelp.addEventListener('click', toggleModal);
  if (btnCloseModal) btnCloseModal.addEventListener('click', toggleModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) toggleModal();
    });
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
      SoundFx.playClick();
    });
  }

  // ==========================================================================
  // 12. SPECTATOR ARENA CONTROLLER (WebRTC 4-Screen Live Stream + PiP Facecam)
  // ==========================================================================
  const spectatorOverlay = document.getElementById('spectator-overlay');
  const btnSpectatorLaunch = document.getElementById('btn-spectator-launch');
  const btnCloseSpectator = document.getElementById('btn-close-spectator');
  const spectatorGridStage = document.getElementById('spectator-grid-stage');
  const specModeBtns = document.querySelectorAll('.spec-mode-btn');
  const feedPinBtns = document.querySelectorAll('.feed-pin-btn');

  let isSpectatorOpen = false;
  let proyektorPeer = null;
  let proyektorRetryTimer = null;

  function initProyektorPeer() {
    if (proyektorPeer && !proyektorPeer.destroyed) return;
    try {
      proyektorPeer = new Peer('hhkids26-proyektor-main', {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      proyektorPeer.on('open', (id) => {
        console.log('⚡ Proyektor WebRTC Receiver Ready:', id);
        if (window.HHSync) {
          window.HHSync.send('PROYEKTOR_READY', { peerId: id });
        }
      });

      proyektorPeer.on('call', (call) => {
        call.answer(); // Answer incoming stream from Pos
        call.on('stream', (remoteStream) => {
          const { pos, type } = call.metadata || {};
          const posNum = pos || 1;
          
          if (type === 'cam') {
            const camVideo = document.getElementById(`stream-cam-pos${posNum}`);
            const camBox = document.getElementById(`cam-pip-pos${posNum}`);
            if (camVideo) {
              camVideo.muted = true;
              camVideo.playsInline = true;
              camVideo.srcObject = remoteStream;
              camVideo.play().catch(() => {});
            }
            if (camBox) {
              camBox.classList.remove('hidden');
            }
            remoteStream.getVideoTracks().forEach(track => {
              track.onended = () => {
                if (camBox) camBox.classList.add('hidden');
              };
            });
          } else {
            // Screen stream
            const screenVideo = document.getElementById(`stream-screen-pos${posNum}`);
            const waitingOverlay = document.getElementById(`waiting-pos${posNum}`);
            if (screenVideo) {
              screenVideo.muted = true;
              screenVideo.playsInline = true;
              screenVideo.srcObject = remoteStream;
              screenVideo.classList.remove('hidden');
              screenVideo.play().catch(e => {
                console.warn('Screen video autoplay retry:', e);
                screenVideo.muted = true;
                screenVideo.play().catch(() => {});
              });
            }
            if (waitingOverlay) {
              waitingOverlay.classList.add('hidden');
            }
            remoteStream.getVideoTracks().forEach(track => {
              track.onended = () => {
                if (screenVideo) screenVideo.classList.add('hidden');
                if (waitingOverlay) waitingOverlay.classList.remove('hidden');
              };
            });
          }
        });
      });

      proyektorPeer.on('disconnected', () => {
        console.log('Proyektor Peer disconnected, reconnecting...');
        if (proyektorPeer && !proyektorPeer.destroyed) {
          proyektorPeer.reconnect();
        }
      });

      proyektorPeer.on('error', (err) => {
        console.warn('Proyektor Peer notice:', err);
        if (err.type === 'unavailable-id') {
          console.log('ID taken, retrying in 2 seconds...');
          clearTimeout(proyektorRetryTimer);
          proyektorRetryTimer = setTimeout(() => {
            if (proyektorPeer) {
              try { proyektorPeer.destroy(); } catch(e) {}
              proyektorPeer = null;
            }
            initProyektorPeer();
          }, 2000);
        }
      });
    } catch (e) {
      console.warn('Failed to init Proyektor Peer:', e);
    }
  }

  // Graceful cleanup on tab close/reload so the ID is freed instantly on server
  window.addEventListener('beforeunload', () => {
    if (proyektorPeer) {
      try { proyektorPeer.destroy(); } catch(e) {}
    }
  });

  // Initialize WebRTC Receiver
  initProyektorPeer();

  function loadSpectatorIframes() {
    initProyektorPeer();
    if (window.HHSync) {
      window.HHSync.send('PROYEKTOR_READY', { peerId: 'hhkids26-proyektor-main' });
    }
    ['pos1', 'pos2', 'pos3', 'pos4'].forEach(id => {
      const iframe = document.getElementById(`iframe-${id}`);
      if (iframe && iframe.dataset.src && (iframe.src === 'about:blank' || !iframe.src)) {
        iframe.src = iframe.dataset.src;
      }
    });
  }

  function setSpectatorMode(mode) {
    if (!spectatorGridStage) return;
    
    spectatorGridStage.classList.remove('mode-grid', 'mode-focus-1', 'mode-focus-2', 'mode-focus-3', 'mode-focus-4');
    
    if (mode === 'grid') {
      spectatorGridStage.classList.add('mode-grid');
    } else if (mode === 'pos1' || mode === '1') {
      spectatorGridStage.classList.add('mode-focus-1');
    } else if (mode === 'pos2' || mode === '2') {
      spectatorGridStage.classList.add('mode-focus-2');
    } else if (mode === 'pos3' || mode === '3') {
      spectatorGridStage.classList.add('mode-focus-3');
    } else if (mode === 'pos4' || mode === '4') {
      spectatorGridStage.classList.add('mode-focus-4');
    }

    specModeBtns.forEach(btn => {
      if (btn.dataset.mode === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function openSpectatorOverlay() {
    if (!spectatorOverlay) return;
    spectatorOverlay.classList.remove('hidden');
    isSpectatorOpen = true;
    loadSpectatorIframes();
    SoundFx.playClick();
  }

  function closeSpectatorOverlay() {
    if (!spectatorOverlay) return;
    spectatorOverlay.classList.add('hidden');
    isSpectatorOpen = false;
    SoundFx.playClick();
  }

  function toggleSpectatorOverlay() {
    if (isSpectatorOpen) {
      closeSpectatorOverlay();
    } else {
      openSpectatorOverlay();
    }
  }

  if (btnSpectatorLaunch) {
    btnSpectatorLaunch.addEventListener('click', toggleSpectatorOverlay);
  }

  if (btnCloseSpectator) {
    btnCloseSpectator.addEventListener('click', closeSpectatorOverlay);
  }

  if (spectatorOverlay) {
    spectatorOverlay.addEventListener('click', (e) => {
      if (e.target === spectatorOverlay) closeSpectatorOverlay();
    });
  }

  specModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setSpectatorMode(btn.dataset.mode);
      SoundFx.playClick();
    });
  });

  feedPinBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = btn.dataset.target;
      const focusNum = target.replace('pos', '');
      if (spectatorGridStage.classList.contains(`mode-focus-${focusNum}`)) {
        setSpectatorMode('grid');
      } else {
        setSpectatorMode(target);
      }
      SoundFx.playClick();
    });
  });

  // ==========================================================================
  // 13. KEYBOARD SHORTCUTS ENGINE
  // ==========================================================================
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      return;
    }

    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        advanceOrNext();
        break;

      case 'ArrowLeft':
        e.preventDefault();
        prevSlide();
        break;

      case 'v':
      case 'V':
        e.preventDefault();
        toggleSpectatorOverlay();
        break;

      case 'Escape':
        if (isSpectatorOpen) {
          e.preventDefault();
          closeSpectatorOverlay();
        }
        break;

      case 't':
      case 'T':
        e.preventDefault();
        if (currentSlideIndex === 7) {
          toggleTimer(1);
        } else if (currentSlideIndex === 10) {
          toggleTimer(2);
        }
        break;

      case 'r':
      case 'R':
        e.preventDefault();
        if (currentSlideIndex === 7) {
          resetTimer(1);
        } else if (currentSlideIndex === 10) {
          resetTimer(2);
        }
        break;

      case 'f':
      case 'F':
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
        break;

      case 'm':
      case 'M':
        e.preventDefault();
        isMuted = !isMuted;
        btnAudio.textContent = isMuted ? '🔇' : '🔊';
        break;

      case '?':
      case '/':
        e.preventDefault();
        toggleModal();
        break;

      default:
        break;
    }
  });

  // Initial UI refresh
  updateSlideUI();

  // Expose methods for testing & remote programmatic control
  window.goToSlide = goToSlide;
  window.toggleTimer = toggleTimer;
  window.resetTimer = resetTimer;
  window.advanceOrNext = advanceOrNext;
  window.toggleSpectatorOverlay = toggleSpectatorOverlay;
  window.setSpectatorMode = setSpectatorMode;
});


