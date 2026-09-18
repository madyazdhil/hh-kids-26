# Implementation Plan: Player Table Screen & Remote Sync (`player.html`)

Membangun aplikasi web khusus untuk meja pemain (**4 Meja Kelompok / 4 Pos Laptop Meja Tengah**) yang secara otomatis tersinkronisasi dan mengikuti navigasi slide MC dari proyektor secara real-time via jaringan lokal (Wi-Fi Da Vinci) maupun single-machine.

## User Review Required

> [!IMPORTANT]
> - Layar meja pemain ini dapat dibuka di 4 laptop peserta di meja kelompok masing-masing melalui browser: `http://<IP-Laptop-Yazid>:8765/player.html` (atau `http://localhost:8765/player.html`).
> - Terdapat tombol pemilihan meja: **Meja Kelompok 1, 2, 3, 4** (tersedia opsi 5 & 6 jika dibutuhkan) atau **Pos 1–4 Meja Tengah**.
> - Terdapat tombol darurat raksasa di setiap babak game: **"🔔 KITA UDAH KELAR! LARI KEJAR KAK BALQIS!"** yang membunyikan lonceng audio dan memberikan sinyal ke tim untuk segera sprint.

## Proposed Changes

### 1. Player Table Web View (`src/player.html` & `src/player.css`)

#### [NEW] [`src/player.html`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/player.html)
- Header HUD:
  - Identitas Meja: Dropdown switcher (`Meja Kelompok 1 - 4` / `Pos 1 - 4`) yang tersimpan di `localStorage`.
  - Indikator Status Koneksi: `● SINKRON DENGAN PROYEKTOR MC (Slide X)`.
  - Toggle Auto-Follow: `Auto-Sync: ON / OFF`.
- Dynamic Content Viewports (mengikuti 22 slide MC):
  1. **Pre-Show & Welcome:** Sambutan hangat per kelompok, reminder blind box kado.
  2. **Senam Arcade:** Panduan gerak senam MR.MINIRA + tombol aksi arcade interaktif (Dodge, Jump, Duck, Punch).
  3. **Scouting Ketua Kelompok:** Countdown timer 1 menit + instruksi rahasia ketua kelompok.
  4. **Rapat Strategi:** Countdown timer 2 menit + form pembagian 4 peran jagoan kelompok.
  5. **Challenge 1 (Kalananti Scratch):** Deskripsi bug kode, visual Scratch block, link eksternal project, dan Giant Bell button.
  6. **Challenge 2 (Mathchamps Speed Math):** Simulasi soal hitung kilat sempoa dan Giant Bell button.
  7. **Challenge 3 (Memory Academy Visual Memory):** Flash card memori visual detail objek dan Giant Bell button.
  8. **Challenge 4 (Spreadsheet #REF! Fixer):** Mini interactive spreadsheet table dengan error formula dan Giant Bell button.
  9. **Sesi Santuy & Tebak Angel:** Display status makan sore dan cue tebak kado putih.
  10. **Awarding & Doorprize:** Podium live ranking (tersinkron dari Admin Panel), foto pemenang Lunch Challenge (Aulia & Nurul), dan doorprize number display.
  11. **Sambutan & Penutup:** Cue sambutan Queen Aldeina dan confetti foto bersama.

#### [NEW] [`src/player.css`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/player.css)
- Tema visual Navy & Black Cyber Glassmorphism (`rgba(10, 25, 47, 0.85)`).
- Neon glow border untuk status aktif meja.
- Tombol sprint bell lonceng raksasa beranimasi pulsing gold/cyan.
- Layout responsif optimal untuk laptop dan tablet.

---

### 2. Player Logic & Auto-Sync Engine (`src/player.js`)

#### [NEW] [`src/player.js`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/player.js)
- **Multi-Transport Sync Hub**:
  - `BroadcastChannel('regroup_happy_hour_sync')` untuk 0ms latency di laptop yang sama.
  - `window.addEventListener('storage', ...)` sebagai fallback cross-tab.
  - Polling `/api/sync` setiap 600ms untuk koneksi lintas laptop via Wi-Fi Da Vinci.
- **Timer Synchronization**: Menampilkan waktu detik timer yang sinkron dengan MC proyektor.
- **Sound Effects (Web Audio API)**: Suara bel meja nyaring saat tombol "Lari Kejar Kak Balqis" ditekan, suara arcade, dan chime transisi.

---

### 3. Server & MC Sync Integration (`scripts/server.py` & `src/app.js`)

#### [MODIFY] [`src/app.js`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/app.js)
- Memastikan setiap kali slide MC berpindah atau timer berjalan, deck mem-POST status terbaru ke `/api/sync` pada server lokal agar 4 laptop peserta di Wi-Fi Da Vinci langsung ter-update secara otomatis.

#### [NEW] [`player.html`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/player.html)
- File redirect praktis di root direktori agar URL `http://localhost:8765/player.html` langsung terbuka mulus.

---

## Verification Plan

### Automated Tests
- Menjalankan Playwright test script: `scripts/verify_player_sync.py`
  - Membuka MC Deck (`src/index.html`) dan Player Screen (`src/player.html`).
  - Mengubah slide MC ke Slide 8 (Timer Scouting) -> Verifikasi player screen beralih ke mode Timer Scouting.
  - Mengubah slide MC ke Slide 13 (Challenge 1 Scratch) -> Verifikasi player screen menampilkan arena tantangan Scratch dan tombol lonceng Kak Balqis.
  - Mengubah slide MC ke Slide 19 (Awarding) -> Verifikasi podium juara dan foto Aulia & Nurul tampil di layar meja pemain.
  - Menangkap screenshot verifikasi di `output/player_screen_*.png`.

### Manual Verification
- Buka `http://localhost:8765/player.html` di browser.
- Coba pilih "Meja Kelompok 2".
- Ganti slide di MC deck atau Admin panel dan amati layar meja pemain berganti otomatis secara instan.
