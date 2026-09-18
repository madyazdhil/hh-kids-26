# Split 4 Challenges into Briefing Slides & Countdown Slides with Locked Pos Standby

Berdasarkan instruksi pengguna:
> *"ini slide nya harusnya 13 - 16 itu dia ahrusnya sudah bisa ini dong ada slide dulu sebelahnya countdown 3, 2, 1 baru yang di pos 1 2 3 buka ke soalnyaa"*

Dokumen ini merinci rancangan teknis pemisahan 4 tantangan Office Olympic menjadi **8 slide atomik (4 Slide Briefing + 4 Slide Countdown & Battle Arena)**, sehingga total presentasi deck MC menjadi **26 slide**. Pada 4 laptop meja pemain (`pos.html`), soal akan **100% TERKUNCI** selama slide briefing berlangsung, dan **BARU TERBUKA** setelah aba-aba Countdown 3, 2, 1... MULAI! selesai.

---

## User Review Required

> [!IMPORTANT]
> **Pemisahan Slide Menjadi 26 Slide Atomik:**
> - Sebelumnya Slide 13–16 langsung membuka arena tanding.
> - Sekarang tiap tantangan memiliki 2 slide berturutan:
>   - **Slide Ganjil (13, 15, 17, 19):** **Slide Briefing** (Misi, Aturan Bel, Skor). Meja pos laptop menampilkan layar **LOCKED STANDBY** (soal belum terbuka, anti-curi start).
>   - **Slide Genap (14, 16, 18, 20):** **Slide Countdown 3-2-1 & Battle Arena**. Muncul animasi hitungan mundur 3... 2... 1... MULAI! disertai efek suara synthesizer Web Audio API. Begitu countdown selesai, workspace soal dan tombol bel di 4 laptop pos **LANGSUNG TERBUKA**.
> - Slide Sesi Santuy, Tebak Angel, Awarding, Doorprize, Speech Bu Deina, dan Foto bergeser menjadi Slide 21 s.d. 26.

---

## Proposed Changes

### 1. Slide Deck Structure (`src/index.html` & `index.html`)

Mengganti segmen tantangan menjadi 8 slide berpasangan:

- **Slide 13:** `Briefing Challenge 1: Kalananti Scratch Debugging`
  - Tag: `BRIEFING TANTANGAN 01 • KALANANTI`
  - Misi player, cara kerja, sistem poin +5 / +4, bel Kak Balqis.
  - Callout: `🔒 MEJA POS MASIH TERKUNCI — Tekan Space / Next untuk Countdown!`
- **Slide 14:** `Battle 1: Scratch Countdown 3-2-1 & Arena`
  - Giant Countdown Visual: `3... 2... 1... MULAI! 🔥`
  - Tombol trigger countdown `[ ▶ HITUNG MUNDUR 3-2-1 (Space) ]`.
  - Display arena aktif: `⚡ PERTANDINGAN SEDANG BERLANGSUNG! • KAK BALQIS STANDBY`.
  - Tombol pintas `[ 📺 Spectator Arena (V) ]` untuk memantau 4 laptop pos.
- **Slide 15:** `Briefing Challenge 2: Mathchamps Speed Math`
  - Tag: `BRIEFING TANTANGAN 02 • MATHCHAMPS`
  - 5 soal hitungan kilat, tanpa kalkulator, konsentrasi sempoa bayangan.
- **Slide 16:** `Battle 2: Mathchamps Countdown 3-2-1 & Arena`
  - Countdown 3-2-1 -> MULAI! -> Soal Pos 2 terbuka serentak.
- **Slide 17:** `Briefing Challenge 3: Memory Academy Visual Flash`
  - Tag: `BRIEFING TANTANGAN 03 • MEMORY ACADEMY`
  - Gambar kompleks 5 detik lenyap, pertanyaan detail MC.
- **Slide 18:** `Battle 3: Memory Countdown 3-2-1 & Arena`
  - Countdown 3-2-1 -> MULAI! -> Gambar / tes daya ingat Pos 3 terbuka.
- **Slide 19:** `Briefing Challenge 4: Spreadsheet Special Formula Fixer`
  - Tag: `BRIEFING TANTANGAN 04 • SPREADSHEET`
  - Misi menyelamatkan lembar kerja dari `#REF!` dan `#VALUE!`.
- **Slide 20:** `Battle 4: Spreadsheet Countdown 3-2-1 & Arena`
  - Countdown 3-2-1 -> MULAI! -> Formula sheet Pos 4 terbuka.
- **Slide 21–26:** Penomoran ulang slide Sesi Santuy (`#slide-21`), Tebak Angel (`#slide-22`), Grand Awarding Stage (`#slide-awarding` / `#slide-23`), Doorprize Nyeleneh (`#slide-doorprize` / `#slide-24`), Speech Bu Deina (`#slide-25`), Closing & Foto Bersama (`#slide-26`).

---

### 2. Player Table Pos Screen (`src/pos.html`, `pos.html`, `pos.css`, `pos.js`)

#### [MODIFY] [pos.html](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/pos.html) & `src/pos.html`
- Tambahkan panel baru `#state-briefing-standby`:
  ```html
  <div id="state-briefing-standby" class="pos-state-panel">
    <div class="briefing-standby-card glass-card">
      <div class="lock-icon-pulse">🔒</div>
      <div class="briefing-round-tag" id="briefing-round-tag">BABAK 1 • KALANANTI SCRATCH</div>
      <h1 class="briefing-standby-title">SOAL MASIH TERKUNCI</h1>
      <p class="briefing-standby-sub">Dengarkan arahan dan briefing MC di layar proyektor Da Vinci.</p>
      <div class="briefing-standby-hint">
        <span class="pulse-dot-cyan"></span>
        <span>Soal akan otomatis terbuka saat MC mengaktifkan Countdown 3, 2, 1... MULAI!</span>
      </div>
    </div>
  </div>
  ```
- Tambahkan countdown overlay `#battle-countdown-overlay` di dalam `#state-battle`.

#### [MODIFY] [pos.js](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/pos.js) & `src/pos.js`
- Perbarui state machine slide:
  - Slide 1–5 (idx 0–4): `#state-template`
  - Slide 6–7 (idx 5–6): `#state-olympic-idle`
  - Slide 8 (idx 7): `#state-scouting` (hanya saat timer nyala)
  - Slide 9–12 (idx 8–11): `#state-olympic-idle`
  - **Slide 13 (idx 12): Briefing Challenge 1** -> `#state-briefing-standby` (Scratch terkunci)
  - **Slide 14 (idx 13): Battle Challenge 1** -> `#state-battle` (Jalankan countdown 3-2-1, lalu buka Scratch)
  - **Slide 15 (idx 14): Briefing Challenge 2** -> `#state-briefing-standby` (Math terkunci)
  - **Slide 16 (idx 15): Battle Challenge 2** -> `#state-battle` (Countdown 3-2-1, lalu buka Math)
  - **Slide 17 (idx 16): Briefing Challenge 3** -> `#state-briefing-standby` (Memory terkunci)
  - **Slide 18 (idx 17): Battle Challenge 3** -> `#state-battle` (Countdown 3-2-1, lalu buka Memory)
  - **Slide 19 (idx 18): Briefing Challenge 4** -> `#state-briefing-standby` (Sheets terkunci)
  - **Slide 20 (idx 19): Battle Challenge 4** -> `#state-battle` (Countdown 3-2-1, lalu buka Sheets)
  - Slide 21+ (idx 20+): `#state-olympic-idle`
- Countdown engine: Animasi 3... 2... 1... MULAI! dengan Web Audio beeps (880Hz -> 1760Hz).

#### [MODIFY] [pos.css](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/pos.css) & `src/pos.css`
- Styling kartu terkunci neon, icon gembok berdenyut, dan full-screen countdown overlay.

---

### 3. Presentation Deck Engine (`src/app.js` & `app.js`)

#### [MODIFY] [app.js](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/app.js) & `src/app.js`
- Tambahkan logika animasi countdown di slide 14, 16, 18, 20.
- Broadcast event `BATTLE_COUNTDOWN_GO` untuk memastikan semua browser/tab sinkron detik countdown-nya.
- Ubah pemanggilan `goToSlide(18)` (Awarding) dan `goToSlide(19)` (Doorprize) menjadi dynamic resolution berdasarkan ID `#slide-awarding` dan `#slide-doorprize` agar tidak terpengaruh perubahan indeks slide di masa depan.

---

### 4. Admin Mobile Controller (`src/admin.html`, `admin.html`, `admin.js`, `src/admin.js`)

#### [MODIFY] [admin.js](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/admin.js) & `src/admin.js`
- Perbarui daftar `slideTitles` menjadi 26 slide lengkap dengan penanda `[Briefing]` dan `[Battle 3-2-1]`.
- Perbarui counter tampilan badge `${idx + 1} / 26`.

#### [MODIFY] [admin.html](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/admin.html) & `src/admin.html`
- Update teks badge awal menjadi `1 / 26`.

---

## Verification Plan

### Automated Tests
1. Script Playwright `scripts/verify_countdown_flow.py`:
   - Membuka MC Deck (`index.html`) dan Pos 1 Laptop (`pos.html?pos=1`).
   - Navigasi ke Slide 13 (Briefing): Memastikan Pos 1 berada di `#state-briefing-standby` dengan gembok terkunci dan workspace tertutup rapat.
   - Navigasi ke Slide 14 (Battle): Memastikan Pos 1 memicu countdown 3-2-1, dan setelah countdown selesai, workspace Scratch otomatis terbuka dan tombol bel aktif.
   - Mengulangi verifikasi serupa untuk Slide 15 vs 16 (Math), Slide 17 vs 18 (Memory), Slide 19 vs 20 (Spreadsheet).
   - Memastikan navigasi ke Slide 21+ mengembalikan pos laptop ke `#state-olympic-idle`.
   - Memastikan tombol dispatch pemenang Awarding dan putar Doorprize di Admin tetap melompat ke slide yang benar (`#slide-awarding` dan `#slide-doorprize`).
   - Verifikasi 0 console errors di semua halaman.

### Git Checkpoint & Push
- Buat commit lokal: `feat(deck): split challenges into briefing and countdown slides with locked pos standby`.
- Push otomatis ke personal GitHub: `git@github.com-personal:madyazdhil/hh-kids-26.git`.
