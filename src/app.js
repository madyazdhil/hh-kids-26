/**
 * Regroup Happy Hour - Presentation Deck & MC Control Center
 * Built for Academic Kids Ruangguru (Kids Product MSIG)
 * Date: September 18, 2026 | Location: Ruang Da Vinci (HQ MSIG)
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
      // Rapid series of percussive pops accelerating
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

        // Gradually speed up
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
  btnAudio.addEventListener('click', () => {
    isMuted = !isMuted;
    btnAudio.textContent = isMuted ? '🔇' : '🔊';
    btnAudio.title = isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)';
  });

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

    // Color palette: Cyan, Gold, Deep Blue
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
  // 3. SLIDE ENGINE & NAVIGATION
  // ==========================================================================
  const slides = Array.from(document.querySelectorAll('.slide'));
  const totalSlides = slides.length;
  let currentSlideIndex = 0;

  const slideCounter = document.getElementById('slide-counter');
  const slideDotsContainer = document.getElementById('slide-dots');
  const slideSelect = document.getElementById('slide-select');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  // Build dots and dropdown selector
  slides.forEach((slide, idx) => {
    // Dot indicator
    const dot = document.createElement('div');
    dot.className = `dot-indicator ${idx === 0 ? 'active' : ''}`;
    dot.title = `Slide ${idx + 1}: ${slide.dataset.title || ''}`;
    dot.addEventListener('click', () => goToSlide(idx));
    slideDotsContainer.appendChild(dot);

    // Dropdown option
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

    // Update dots
    const dots = slideDotsContainer.querySelectorAll('.dot-indicator');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlideIndex);
    });

    // Update Counter & Selector
    slideCounter.textContent = `Slide ${currentSlideIndex + 1} / ${totalSlides}`;
    slideSelect.value = currentSlideIndex;

    // Reset or handle slide-specific animations
    const activeSlide = slides[currentSlideIndex];
    if (activeSlide) {
      activeSlide.scrollTop = 0;
    }
  }

  function goToSlide(index) {
    if (index >= 0 && index < totalSlides) {
      currentSlideIndex = index;
      updateSlideUI();
      SoundFx.playClick();
    }
  }

  function prevSlide() {
    if (currentSlideIndex > 0) {
      goToSlide(currentSlideIndex - 1);
    }
  }

  // Progressive Next: check for unrevealed steps inside active slide first!
  function advanceOrNext() {
    const activeSlide = slides[currentSlideIndex];
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

  btnPrev.addEventListener('click', prevSlide);
  btnNext.addEventListener('click', advanceOrNext);

  // Explicit step reveal buttons inside slides 8, 9, 10, 11
  document.querySelectorAll('.btn-step').forEach(btn => {
    btn.addEventListener('click', () => {
      advanceOrNext();
    });
  });

  // ==========================================================================
  // 4. COUNTDOWN TIMERS (SLIDE 6: POS INSPECTION & SLIDE 7: STRATEGY)
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

    if (t.isRunning) {
      clearInterval(t.intervalId);
      t.isRunning = false;
      const btn = document.querySelector(`.btn-start-timer[data-timer="${timerId}"]`);
      if (btn) btn.textContent = '▶ RESUME (T)';
    } else {
      initAudio();
      t.isRunning = true;
      const btn = document.querySelector(`.btn-start-timer[data-timer="${timerId}"]`);
      if (btn) btn.textContent = '⏸ PAUSE (T)';

      t.intervalId = setInterval(() => {
        if (t.currentSec > 0) {
          t.currentSec--;
          renderTimer(timerId);
          if (t.currentSec <= 10 && t.currentSec > 0) {
            SoundFx.playTick();
          }
          if (t.currentSec === 0) {
            clearInterval(t.intervalId);
            t.isRunning = false;
            if (btn) btn.textContent = '▶ START (T)';
            SoundFx.playBuzzer();
          }
        }
      }, 1000);
    }
  }

  function resetTimer(timerId) {
    const t = timers[timerId];
    if (!t) return;
    clearInterval(t.intervalId);
    t.isRunning = false;
    t.currentSec = t.totalSec;
    renderTimer(timerId);
    const btn = document.querySelector(`.btn-start-timer[data-timer="${timerId}"]`);
    if (btn) btn.textContent = '▶ START (T)';
  }

  // Timer button bindings
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

  // Timer Preset Buttons
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

  // Render initial display
  renderTimer(1);
  renderTimer(2);

  // ==========================================================================
  // 5. YOUTUBE MUSIC SANDBOX (PRE-SHOW)
  // ==========================================================================
  const ytSearchInput = document.getElementById('yt-search-input');
  const btnLoadYt = document.getElementById('btn-load-yt');
  const bgmPlayer = document.getElementById('bgm-player');
  const presetPills = document.querySelectorAll('.quick-presets .preset-pill');

  function parseYouTubeEmbedUrl(url) {
    let videoId = 'jfKfPfyJRdk';
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

  if (btnLoadYt && ytSearchInput && bgmPlayer) {
    btnLoadYt.addEventListener('click', () => {
      const url = ytSearchInput.value.trim();
      if (url) {
        bgmPlayer.src = parseYouTubeEmbedUrl(url);
        SoundFx.playClick();
      }
    });

    presetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        presetPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const url = pill.dataset.url;
        ytSearchInput.value = url;
        bgmPlayer.src = parseYouTubeEmbedUrl(url);
        SoundFx.playClick();
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

  // Guardian Angel SFX Button
  const btnAngelSfx = document.getElementById('btn-angel-sfx');
  if (btnAngelSfx) {
    btnAngelSfx.addEventListener('click', () => {
      SoundFx.playMystery();
    });
  }

  // ==========================================================================
  // 7. GRAND AWARDING & PHOTO UPLOAD
  // ==========================================================================
  document.querySelectorAll('.btn-reveal-winner').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.currentTarget.closest('.award-card');
      const input = card.querySelector('.winner-input');
      const placeholder = card.querySelector('.winner-placeholder');

      const name = input.value.trim() || 'TIM JUARA SEJATI';
      placeholder.textContent = name;
      placeholder.classList.add('revealed');
      input.classList.add('hidden');
      e.currentTarget.classList.add('hidden');

      SoundFx.playFanfare();
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    });
  });

  // Lunch Challenge Photo Upload
  const btnUploadLunch = document.getElementById('btn-upload-lunch');
  const lunchPhotoInput = document.getElementById('lunch-photo-input');
  const lunchPreview = document.getElementById('lunch-preview');

  if (btnUploadLunch && lunchPhotoInput && lunchPreview) {
    btnUploadLunch.addEventListener('click', () => {
      lunchPhotoInput.click();
    });

    lunchPhotoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          lunchPreview.innerHTML = `<img src="${event.target.result}" alt="Foto Lunch Tim">`;
          lunchPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // ==========================================================================
  // 8. DOORPRIZE NYELENEH LOTTERY MACHINE
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
  if (btnSpinDoorprize) {
    btnSpinDoorprize.addEventListener('click', () => {
      if (isSpinning) return;
      isSpinning = true;
      btnSpinDoorprize.disabled = true;
      btnSpinDoorprize.textContent = '🎰 MENGUNDI...';
      luckyNumberEl.classList.add('spinning');
      prizeNameEl.textContent = 'Mengocok Nama...';
      prizeDescEl.textContent = 'Harap tegang dan tahan napas!';

      SoundFx.playDrumroll();

      let counter = 0;
      const spinInterval = setInterval(() => {
        luckyNumberEl.textContent = String(Math.floor(Math.random() * 50) + 1).padStart(2, '0');
        counter++;
        if (counter % 3 === 0) SoundFx.playTick();
      }, 70);

      setTimeout(() => {
        clearInterval(spinInterval);
        luckyNumberEl.classList.remove('spinning');

        const finalNum = Math.floor(Math.random() * 40) + 1;
        luckyNumberEl.textContent = String(finalNum).padStart(2, '0');

        const randomPrize = doorprizePool[Math.floor(Math.random() * doorprizePool.length)];
        prizeNameEl.textContent = randomPrize.name;
        prizeDescEl.textContent = randomPrize.desc;

        isSpinning = false;
        btnSpinDoorprize.disabled = false;
        btnSpinDoorprize.textContent = '🎰 PUTAR NOMOR LAGI!';

        SoundFx.playFanfare();
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 }
          });
        }
      }, 2400);
    });
  }

  // ==========================================================================
  // 9. GRAND CONFETTI (SLIDE 16)
  // ==========================================================================
  const btnGrandConfetti = document.getElementById('btn-grand-confetti');
  if (btnGrandConfetti) {
    btnGrandConfetti.addEventListener('click', () => {
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
    });
  }

  // ==========================================================================
  // 10. SHORTCUTS MODAL & FULLSCREEN TOGGLE
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
  // 11. KEYBOARD SHORTCUTS ENGINE
  // ==========================================================================
  window.addEventListener('keydown', (e) => {
    // If typing inside an input field, do not trigger slide navigation
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

      case 't':
      case 'T':
        e.preventDefault();
        // If on slide 6 (inspection) or slide 7 (strategizing), toggle that timer
        if (currentSlideIndex === 5) {
          toggleTimer(1);
        } else if (currentSlideIndex === 6) {
          toggleTimer(2);
        }
        break;

      case 'r':
      case 'R':
        e.preventDefault();
        if (currentSlideIndex === 5) {
          resetTimer(1);
        } else if (currentSlideIndex === 6) {
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
});
