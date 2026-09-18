# Implementation Plan: 4 Pos Laptop Meja Tengah & Remote Sync (`pos.html`)

Membangun aplikasi web khusus untuk **4 Laptop di Meja Tengah (Pos 1 s.d. Pos 4)** yang secara otomatis tersinkronisasi dan mengikuti navigasi slide MC dari proyektor secara real-time via jaringan lokal (Wi-Fi Da Vinci) maupun single-machine.

## User Review Required

> [!IMPORTANT]
> - **Mekanisme Identifikasi 4 Laptop:**
>   - Setiap laptop cukup membuka URL dengan parameter:
>     - Laptop 1: `http://localhost:8765/pos.html?pos=1` (Pos 1: Scratch Debugging)
>     - Laptop 2: `http://localhost:8765/pos.html?pos=2` (Pos 2: Mathchamps)
>     - Laptop 3: `http://localhost:8765/pos.html?pos=3` (Pos 3: Memory Academy)
>     - Laptop 4: `http://localhost:8765/pos.html?pos=4` (Pos 4: Spreadsheet)
>   - Tersedia juga tombol pemilih di pojok atas layar laptop: `[ 💻 Pos 1 ] [ 💻 Pos 2 ] [ 💻 Pos 3 ] [ 💻 Pos 4 ]` yang otomatis tersimpan permanen di `localStorage` masing-masing laptop.
> - **Alur Spesifik Sesuai Voice Note Yazid:**
>   1. **Slide 1–5 (Pre-Show s.d. Post-Senam):** Keempat laptop menampilkan Judul Bersih Grand Template (tanpa spoiler Office Olympic).
>   2. **Slide 6 & 7 (Office Olympics Splash & Briefing):** Keempat laptop menampilkan Logo & Cincin Neon Office Olympics.
>   3. **Slide 8 (Timer 1 Menit Ketua Kelompok Mencari / Scouting):**
>      - Awalnya tetap Logo Office Olympics.
>      - Begitu tombol **START TIMER** ditekan di laptop MC/Admin: Keempat laptop **serentak membuka 4 tantangan yang berbeda-beda** sesuai posnya (Laptop 1: Scratch, Laptop 2: Math, Laptop 3: Memory, Laptop 4: Spreadsheet).
>      - Begitu timer habis (00:00) atau MC pindah ke Slide 9: Keempat laptop **langsung otomatis menutup soal dan kembali ke Logo Office Olympics** (anti-bocor!).
>   4. **Slide 10, 11, 12 (Rules Bel, Timer 2 Menit Rapat Kelompok, Ready):** Tetap menampilkan Logo Office Olympics.
>   5. **Slide 13 (Challenge 1 - Scratch):** Ada aba-aba *"3, 2, 1 MULAI!"*, dan saat mulai: **KEEMPAT LAPTOP SERENTAK membuka Challenge 1 (Scratch)** di dalam area Black Box container.
>   6. **Slide 14 (Challenge 2 - Math):** Keempat laptop membuka Challenge 2 (Mathchamps).
>   7. **Slide 15 (Challenge 3 - Memory):** Keempat laptop membuka Challenge 3 (Memory Academy).
>   8. **Slide 16 (Challenge 4 - Spreadsheet):** Keempat laptop membuka Challenge 4 (Spreadsheet).
>   9. **Slide 17 s.d. 22 (Sesi Santuy, Awarding, Closing):** Keempat laptop kembali ke Logo Office Olympics / Celebration.
> - **Black Box Container:** Disediakan area bersih dan rapi dengan komentar `<!-- YAZID: ISI KONTEN GAME DI SINI -->` sehingga Yazid bisa langsung memasukkan iframe, soal, gambar, atau link game tanpa merusak styling.

## Proposed Changes

### 1. Web View (`src/pos.html` & `src/pos.css`)

#### [NEW] [`src/pos.html`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/pos.html)
- Header status:
  - Pos Switcher Badge: `[ 💻 Pos 1: Scratch ] [ 💻 Pos 2: Mathchamps ] [ 💻 Pos 3: Memory ] [ 💻 Pos 4: Spreadsheet ]` (otomatis mendeteksi `?pos=X` atau `localStorage`).
  - Indikator Sinkronisasi: `● Terhubung ke Proyektor (Slide X)`.
- Multi-state Viewports:
  1. `#view-title`: Judul Grand Template (Slide 1–5).
  2. `#view-olympics-logo`: Logo Cincin Neon Office Olympics (Slide 6, 7, 9, 10, 11, 12, 17+).
  3. `#view-scouting`: Tampilan 4 pos berbeda saat Slide 8 Timer Start (Laptop 1 buka Scratch, Laptop 2 buka Math, Laptop 3 buka Memory, Laptop 4 buka Spreadsheet).
  4. `#view-match`: Tampilan babak tanding aktif serentak untuk semua laptop (Slide 13, 14, 15, 16) lengkap dengan countdown 3-2-1 Mulai, Black Box game container, dan tombol lonceng *"🔔 KELAR! LARI KEJAR KAK BALQIS!"*.

#### [NEW] [`src/pos.css`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/pos.css)
- Tema Navy & Black Glassmorphism senada dengan deck proyektor (`rgba(10, 25, 47, 0.9)`).
- Animasi pendar neon untuk Logo Office Olympics.
- Styling Black Box container yang rapi dengan visual terminal / workspace.
- Tombol lonceng Kak Balqis beranimasi pulse gold.

---

### 2. Synchronization & Client Logic (`src/pos.js`)

#### [NEW] [`src/pos.js`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/pos.js)
- Identifikasi pos otomatis dari query parameter `?pos=X` atau `localStorage`.
- Integrasi `BroadcastChannel('regroup_happy_hour_sync')` + `localStorage` storage events + `/api/sync` HTTP polling (600ms).
- Logika state mesin:
  - Deteksi `CURRENT_SLIDE_STATUS` dari MC deck.
  - Deteksi `TIMER_START` dan `TIMER_STOP` / `TIMER_EXPIRED` pada Slide 8 untuk membuka dan mengunci kembali soal scouting.
  - Deteksi `MATCH_START` untuk hitungan mundur 3-2-1 pada Slide 13–16.

---

### 3. Server & MC Deck Integration

#### [MODIFY] [`src/app.js`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/app.js)
- Pastikan saat Timer Slide 8 dimulai / berhenti / habis, event `TIMER_RUNNING`, `TIMER_TICK`, dan `TIMER_EXPIRED` ter-broadcast secara konsisten via `BroadcastChannel`, `localStorage`, dan POST `/api/sync`.

#### [NEW] [`pos.html`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/pos.html) & [`player.html`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/player.html)
- Redirect file di root direktori agar link `http://localhost:8765/pos.html` langsung terbuka.

---

## Verification Plan

### Automated Tests
- Script Playwright `scripts/verify_pos_sync.py`:
  - Membuka MC Deck dan 4 tab Pos Laptop (Pos 1, Pos 2, Pos 3, Pos 4).
  - Verifikasi pada Slide 1–5: Keempat pos menampilkan judul bersih.
  - Verifikasi pada Slide 7: Keempat pos menampilkan Logo Office Olympics.
  - Verifikasi pada Slide 8 sebelum timer: Menampilkan Logo Office Olympics.
  - Verifikasi saat Timer Slide 8 ditekan Start:
    - Pos 1 membuka Scratch
    - Pos 2 membuka Mathchamps
    - Pos 3 membuka Memory
    - Pos 4 membuka Spreadsheet
  - Verifikasi saat pindah ke Slide 9: Keempat pos serentak menutup soal dan kembali ke Logo Office Olympics.
  - Verifikasi pada Slide 13: Keempat pos serentak menampilkan Challenge 1 (Scratch).
  - Menangkap screenshot verifikasi setiap fase di `output/pos_*.png`.
