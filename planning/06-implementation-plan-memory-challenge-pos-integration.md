# Implementation Plan: Integrasi Memory Challenge ke Meja Pos (Regroup Happy Hour)

- File Rencana: `projects/regroup-happy-hour/planning/06-implementation-plan-memory-challenge-pos-integration.md`
- Target Proyek: [`projects/regroup-happy-hour/`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/)
- Sumber Aset & Game: [`projects/memory-challenge/`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/memory-challenge/)
- Tanggal: 2026-09-18
- Status: Proposed (Menunggu Persetujuan Pengguna)

---

## 1. Latar Belakang & Kebutuhan Pengguna

Pengguna meminta:
1. **Penyelarasan Template Visual & Estetika**:
   Tampilan tantangan memori disesuaikan 100% dengan template dan tema visual [`pos.html`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/pos.html) (Dark Navy & Black Glassmorphism, font *Outfit*, *Space Grotesk*, dan *JetBrains Mono*, serta aksen neon cyber hijau/cyan/gold).
2. **Kontrol Keyboard-First**:
   Input jawaban kuis dioptimasi untuk **Keyboard** (menjawab kilat tanpa harus menggunakan mouse/trackpad):
   - Opsi [A]: Tombol `A`, `1`, atau panah kiri `←`.
   - Opsi [B]: Tombol `B`, `2`, atau panah kanan `→`.
   - Tombol keyboard responsif dengan efek visual glow & audio feedback instan.
3. **Integrasi Langsung ke `pos.html` & Trigger Countdown Proyektor**:
   Tantangan dimasukkan langsung ke dalam sistem meja pos [`pos.html`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/pos.html) (dan `pos.js`).
   Saat MC di proyektor menekan tombol **MULAI COUNTDOWN 3-2-1!** pada **Slide 18 (Battle 3 Arena: Memory Academy Flash)**:
   - Layar meja pos di **seluruh meja pemain (Pos 1, 2, 3, 4)** yang sebelumnya berstatus `STANDBY (TERKUNCI 🔒)` akan serentak menghitung mundur 3... 2... 1... MULAI!
   - Begitu countdown selesai, arena Memory Challenge otomatis terbuka dan langsung memulai fase observasi kartu bergambar, dilanjutkan kuis 20 pertanyaan.

---

## 2. Rencana Arsitektur & Perubahan Berkas

### A. Data Sumber Gambar & Kunci Soal
- 20 Objek Pengamatan & Soal Kuis:
  - 10 Pasang Objek Baru (berkualitas tinggi 3D studio, di-host di Ruangguru CDN `https://cdn-web-2.ruangguru.com/landing-pages/assets/...`).
  - 10 Pasang Objek Klasik dari Champion Test (di-host di CDN).
- Mekanisme Pengacakan (Fisher-Yates Shuffle):
  - Memastikan urutan kemunculan kartu dan penempatan opsi A/B diacak dinamis agar menantang.

### B. Modifikasi Berkas Utama
1. **`pos.html` & `src/pos.html`**:
   - Memastikan container `#battle-workspace` siap me-render arena Memory Challenge secara native tanpa lag iframe.
   - Menyediakan markup terstruktur untuk Phase Observasi (3D Card Flip), Phase Kuis (Opsi A & B dengan keyboard badge `[A] / [1]` dan `[B] / [2]`), dan Phase Selesai (Skor & Highlighting Tombol Bel Sprint Raksasa).
2. **`pos.css` & `src/pos.css`**:
   - Menambahkan styling modul `.pos-memory-arena`:
     - Kartu 3D flip bergaya dark glassmorphism dengan border neon-green (`#00ff9d`) dan neon-cyan (`#00f0ff`).
     - Split button opsi kuis visual besar dengan badge tombol keyboard yang menyala saat ditekan.
     - Responsif dan proporsional terhadap ukuran layar laptop meja tengah.
3. **`pos.js` & `src/pos.js`**:
   - Menyempurnakan blok handler `roundIdx === 2` (Slide 18: Battle 3 Memory Academy):
     - Inisialisasi engine audio synth Web Audio API native.
     - Listener event keyboard global `window.addEventListener('keydown', ...)` yang aktif saat babak memori berjalan:
       - Tekan `KeyA` / `Digit1` / `ArrowLeft` → Pilih Opsi A.
       - Tekan `KeyB` / `Digit2` / `ArrowRight` → Pilih Opsi B.
       - Tekan `KeyR` → Reset / ulangi latihan jika diperlukan panitia.
     - Integrasi dengan sinyal `BATTLE_COUNTDOWN`:
       - Saat countdown proyektor mencapai 0 ("MULAI!"), langsung picu fase observasi flip kartu berurutan (1.0 detik per kartu).
       - Setelah 20 kartu selesai dihafal, langsung buka pertanyaan kuis 1 s/d 20.
       - Saat seluruh pertanyaan selesai dijawab, sistem mengunci skor, memainkan victory fanfare, dan menyalakan pulsing glow pada tombol bel raksasa: *"🔔 KITA UDAH KELAR! LARI KEJAR KAK BALQIS!"*.
4. **`memory-slide.html` & `src/memory-slide.html` (Standalone Fallback)**:
   - Membuat salinan standalone bertema dark navy-black yang dapat dibuka via tombol *"Buka Fullscreen Tab ↗"* untuk fleksibilitas tambahan.

---

## 3. Rencana Verifikasi (Verification Plan)

1. **Pengujian Fungsional via Browser Subagent & Playwright**:
   - Buka `pos.html?pos=1` dan simulasi slide 17 (Briefing MC) → Layar terkunci (STANDBY).
   - Simulasi sinyal slide 18 dan `BATTLE_COUNTDOWN` (3... 2... 1... MULAI!).
   - Verifikasi bahwa fase observasi memori langsung muncul dan kartu flip bergulir mulus dengan gambar CDN.
   - Uji input keyboard: tekan tombol `A` dan `B` pada kuis, pastikan soal berganti dan skor bertambah tanpa error konsol.
2. **Cek Konsistensi Antar Pos**:
   - Uji untuk `pos=1`, `pos=2`, `pos=3`, dan `pos=4` untuk memastikan semua meja tanding secara adil dan serentak.
3. **Git Checkpoint & Sinkronisasi GitHub**:
   - Otomatis commit ke Git lokal dan push ke `git@github.com-personal:madyazdhil/hh-kids-26.git`.
