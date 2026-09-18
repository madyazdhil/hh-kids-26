# State: Regroup Happy Hour Interactive Web Deck

- Status: Perbaikan snapshot dan PeerJS terverifikasi pada browser terisolasi; siap retest perangkat fisik
- Focus: Siap digunakan untuk gladi bersih / live event Da Vinci
- Last-updated: 2026-09-18

## What Has Been Completed

- **Atomic 26-Slide Presentation Deck (`src/index.html` & `index.html`):**
  - Pemisahan 4 tantangan Office Olympics menjadi **Slide Briefing (Slide 13, 15, 17, 19)** dan **Slide Countdown Arena (Slide 14, 16, 18, 20)**.
  - Alur lengkap 26 slide:
    - Slide 1–5: Pre-Show, Welcome, Game Pemanasan Senam, Video Senam, Bumper Senam Selesai.
    - Slide 6–12: Splash Olympic, Briefing 4 Pos Meja Tengah, Timer 1m Scouting, Bumper Scouting Selesai, Rules Bel Meja & Lari ke Balqis, Timer 2m Diskusi, Bumper Siap Bertanding.
    - Slide 13–14: Briefing 1 (Scratch) + Battle 1 Arena (Countdown 3-2-1 & Bel Lari).
    - Slide 15–16: Briefing 2 (Mathchamps) + Battle 2 Arena (Countdown 3-2-1 & Bel Lari).
    - Slide 17–18: Briefing 3 (Memory Academy) + Battle 3 Arena (Countdown 3-2-1 & Bel Lari).
    - Slide 19–20: Briefing 4 (Spreadsheet Emergency) + Battle 4 Arena (Countdown 3-2-1 & Bel Lari).
    - Slide 21–26: Sesi Santuy, Tebak Foto Angel, Grand Awarding (Slide 23), Doorprize Lottery (Slide 24), Speech Queen Aldeina, Closing Foto Bersama.
- **4 Pos Laptop Meja Tengah (`src/pos.html`, `src/pos.css`, `src/pos.js`):**
  - **Layar Terkunci (STANDBY) saat Briefing MC (Slide 13, 15, 17, 19):** Soal dan workspace 100% terkunci dengan gembok emas 🔒 dan status *"STANDBY: BRIEFING MC"*, mencegah pemain mencuri start saat MC menjelaskan aturan di proyektor.
  - **Buka Otomatis setelah Countdown (Slide 14, 16, 18, 20):** Begitu MC menekan tombol *"MULAI COUNTDOWN 3-2-1!"* (atau spasi), hitungan mundur 3... 2... 1... MULAI! berdering dan layar pos otomatis membuka workspace soal lengkap dengan tombol sprint bel raksasa: *"🔔 KELAR! SPRINT KEJAR KAK BALQIS!"*.
  - **Slide 21+:** Pos laptop otomatis kembali ke tampilan Olympic Idle.
- **Admin Mobile & Remote Control (`src/admin.html` & `src/admin.js`):**
  - Tampilan smartphone ergonomis (satu jempol) untuk Aldeina.
  - Remote clicker proyektor dengan pemetaan 26 slide lengkap.
  - Sinkronisasi instan tombol *"Kirim Juara ke Proyektor"* menuju Slide 23 (Awarding) dan remote spin Doorprize menuju Slide 24.
- **Automated Playwright Verification:**
  - `scripts/verify_countdown_flow.py` memvalidasi MC deck 26 slide, locked briefing states, countdown transitions, and admin awarding jump (0 console errors).
- **Tantangan Babak 3: Memory Academy Visual Flash (Pemisahan Observasi Proyektor & Kuis Pos):**
  - **Arsitektur Pemisahan Layar Proyektor vs Pos**:
    - **Layar Proyektor MC (Big Screen)**: Setelah hitungan mundur 3, 2, 1 mencapai "MULAI!", fase observasi (20 kartu 3D flip bergambar, 1.2 detik/kartu) ditampilkan secara megah di layar proyektor utama depan ruangan. MC memiliki kontrol lewati (`⏩ Lewati Observasi`).
    - **Layar Meja Pos Pemain (`pos.html`)**: Selama kartu sedang di-flip di proyektor, kuis ditahan dan layar pos menampilkan pesan atensi: *"👀 TATAP LAYAR PROYEKTOR DI DEPAN! HAFALKAN 20 OBJEK BERSAMA TIMMU!"*.
    - **Kuis Serentak Tanpa Observasi Ulang**: Begitu 20 kartu selesai di-flip (atau MC klik lewati), proyektor menyiarkan `MEMORY_START_QUIZ`. Di proyektor muncul banner kuis aktif & siaga bel juri, sementara di meja Pos 1 s/d 4, soal kuis 20 pertanyaan bergambar serentak terbuka langsung (`mode=quiz`) untuk dijawab kilat via keyboard (`A`/`1`/`←` dan `B`/`2`/`→`).
    - Setelah nomor 20 terjawab, skor langsung dihitung dan tombol bel raksasa di bawah layar pos menyalakan pulsing glow untuk sprint ke Kak Balqis!
  - Terverifikasi 100% via Playwright (`scripts/verify_projector_memory_flow.py`) dengan 0 console error dan tangkapan layar verifikasi lengkap.
- **Tantangan Babak 4: Spreadsheet Emergency Room (Google Sheets #REF! Fixer) Integrasi Penuh ke `pos.html`:**
  - Tampilan spreadsheet otentik khas Google Workspace (Formula bar `fx`, cell address box, toolbar Undo `Ctrl+Z`, F4 Kunci Sel `$`, dan sheet tab bawah) dengan aksen Dark Navy Glassmorphism senada dengan `pos.html`.
  - 5 Kasus Troubleshoot Kantor Nyata:
    1. *Kasus 1: Hapus Kolom Bencana (#REF!)* – rumus rusak akibat anak magang menghapus kolom, diselesaikan via tombol Koreksi Range ke B2 atau shortcut Undo.
    2. *Kasus 2: Tanda Baca Regional Typo (, vs ;)* – rumus `=VLOOKUP` mogok akibat perbedaan koma dan titik koma.
    3. *Kasus 3: Tanda Petik / Teks Hilang (#NAME?)* – rumus `=IF(B2>75, LULUS, GAGAL)` tanpa tanda kutip string.
    4. *Kasus 4: Siklus Kiamat (Circular Reference)* – rumus `=SUM(A1:A10)` di dalam cell `A10` yang menyebabkan loop kalkulasi.
    5. *Kasus 5: Missing Absolute Reference ($)* – rumus bergeser saat ditarik ke bawah karena ketiadaan kunci sel `$`.
  - Integrasi Countdown Otomatis: Layar Pos 1 s/d 4 terkunci (`STANDBY`) saat MC briefing di Slide 19, dan serentak membuka tantangan begitu countdown 3-2-1 di Slide 20 selesai (`MULAI!`).
  - Menyelesaikan ke-5 kasus memicu sinyal `CHALLENGE_COMPLETED` ke parent window, mengaktifkan pulsing glow emas pada tombol sprint bel raksasa: *"🔔 KITA UDAH KELAR! LARI KEJAR KAK BALQIS!"*.
- **Pembersihan Total Kunci Jawaban & Layar Menang di Layar Meja Pos (Scratch & Sempoa):**
  - **Scratch Slide (`scratch-slide.html` & `src/scratch-slide.html`)**: Menghapus tombol `💡 Kunci Jawaban`, `🏆 Preview Layar Menang`, drawer slide-over kode solusi (`#solutionDrawer`), dan modal popup layar menang fullscreen (`#fullWinOverlay`). Evaluasi berhasil hanya menyalakan badge hijau `✅ KODE BENAR! TEKAN BEL DI BAWAH!` tanpa menutupi layar peserta.
  - **Mathchamps Sempoa (`sempoa-slide.html` & `src/sempoa-slide.html`)**: Menghapus ikon gear `⚙️` dan `#editModal` yang sebelumnya membocorkan nilai `Kunci = ...`. Feedback salah dibersihkan agar tidak membocorkan angka kunci maupun rincian formula.
  - **Root `turbowarp/` Tracked**: Root `turbowarp/` dilacak ke Git sehingga live GitHub Pages (`https://madyazdhil.github.io/hh-kids-26/pos.html?pos=1`) memiliki editor Scratch GUI lengkap tanpa 404.
  - Terverifikasi otomatis via Playwright headless (`scripts/verify_sanitized_screens.py`) dengan 0 console error dan nol kebocoran kunci jawaban.
- **Tantangan Babak 2: Mathchamps Sempoa Speed Math Arena Integrasi Penuh (`pos.html`, `sempoa-slide.html`)**:
  - Desain diselaraskan 100% dengan template Dark Navy Cyber Glassmorphism `pos.html` (`#070d19`, neon gold `#ffd700`, neon cyan `#00f0ff`).
  - **Keyboard-Only Input**: Menghilangkan tombol virtual touch/keypad di layar; peserta langsung mengetik di input keyboard fisik dengan auto-focus dan tombol `Enter` untuk submit jawaban.
  - **Kecepatan Default 2.0 Detik**: Kecepatan pergantian angka default diset 2.0s per angka dengan animasi visual pulse dan Web Audio API synth bleeps.
  - **Integrasi Countdown Otomatis**: Pos 1 s/d 4 terkunci di Slide 15 (Briefing), lalu otomatis membuka arena hitung cepat sempoa (`sempoa-slide.html?autostart=1`) tepat setelah MC menyelesaikan countdown 3-2-1 di proyektor Slide 16.
  - Diuji dan diverifikasi live via browser subagent dan Playwright script. Pushed ke GitHub (`madyazdhil/hh-kids-26`).

## Blockers and Open Questions

- Tes otomatis empat sesi browser terisolasi lulus. Jaringan venue dan kamera fisik lintas laptop belum diverifikasi; tes lokal bukan bukti bahwa STUN/relay publik dapat diakses dari semua jaringan.



## Latest Fix

- Fixed a cross-device race where `BATTLE_COUNTDOWN` / `BATTLE_UNLOCKED` could arrive before `SLIDE_CHANGED`; a late slide signal then reset the Pos laptop back to locked. The Pos client now retains the pending unlock by round and applies it when the matching battle slide becomes active. Updated both `pos.js` and `src/pos.js`.
- Verification: `node --check pos.js` passed. Playwright countdown verification could not launch Chromium in the sandbox because macOS MachPort permission was denied; it remains to be retested in the normal local browser environment.

## Checkpoint perbaikan 2026-09-18

- MC mengirim snapshot lengkap berversi (slide, timer scouting, fase countdown/observasi/aktif), sehingga refresh dan pesan terlambat tidak mengunci ulang babak yang aktif.
- PeerJS data channel menghubungkan Pos langsung ke receiver MC; REQUEST_STATUS dan heartbeat memulihkan status tanpa bergantung pada relay notifikasi. Relay HTTP failures tidak lagi ditelan tanpa event diagnostik; polling tidak overlap.
- Scouting hanya membuka instruksi selama timer aktif; tidak memuat game saat inisialisasi Pos.
- Countdown dibatalkan ketika keluar slide; replay command lama tidak menggeser MC baru.
- Spectator menyiarkan Peer ID aktual. Kamera dapat disiarkan tanpa screen share, status diterima menunggu acknowledgment MC, dan call lama dibersihkan.
- `scripts/verify_recovery_flow.py`: lulus semua empat babak, empat konteks terisolasi, expiry, refresh, out-of-order, Memory observation dan kamera lifecycle. Relay/Peer signaling pada tes ini terkontrol.
- Root dan src diselaraskan; query versi asset ditambahkan untuk membantu pemuatan JS terbaru.

- `scripts/verify_direct_peer.py`: LULUS dengan PeerJS asli, WebRTC data/media asli, signaling terkontrol dan ICE host-only. Relay sengaja HTTP 429; scouting, unlock 4 Pos, reload, dan video kamera canvas yang didekode MC lulus. Screenshot: `output/direct-peer-camera.png`.
