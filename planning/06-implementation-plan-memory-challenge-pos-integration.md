# Implementation Plan: Alur Split Memory Challenge (Observasi Proyektor & Kuis Meja Pos)

- Berkas Dokumen: [`projects/regroup-happy-hour/planning/06-implementation-plan-memory-challenge-pos-integration.md`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/planning/06-implementation-plan-memory-challenge-pos-integration.md)
- Target Proyek: [`projects/regroup-happy-hour/`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/)
- Tanggal Perbaruan: 2026-09-18
- Status: Proposed (In-Place Renewal)

---

## 1. Ringkasan Perbaikan Alur (User Intent)

Pengguna menginstruksikan perubahan arsitektur alur tanding Babak 3 (Visual Memory Flash):
1. **Fase Observasi Kartu Flip di Layar Proyektor (Big Screen)**:
   - Setelah hitungan mundur 3, 2, 1 selesai di Slide 18 proyektor, kartu-kartu observasi (20 objek bergambar Ruangguru CDN & Tencent COS) ditampilkan **langsung di layar proyektor utama**.
   - Kartu di-flip satu per satu (efek 3D flip card, 1.2s per kartu, lengkap dengan synth sound effects dan progress counter).
   - Seluruh peserta dari semua meja (Pos 1 s/d 4) menatap proyektor bersama-sama untuk menghafal objek.
2. **Layar Meja Pos Pemain (`pos.html`)**:
   - Selama kartu sedang di-flip di proyektor, layar laptop meja pos menampilkan status atensi:
     `👀 TATAP LAYAR PROYEKTOR DI DEPAN! HAFALKAN 20 OBJEK BERSAMA TIMMU!`
   - Layar pos menahan kuis agar peserta fokus melihat ke proyektor di panggung depan.
3. **Transisi Kuis Serentak di Meja Pos**:
   - Begitu 20 kartu selesai di-flip di proyektor (atau saat MC menekan tombol lewati hafalan), proyektor mem-broadcast sinyal `MEMORY_START_QUIZ`.
   - Di proyektor muncul teks dramatis: *"🔥 HAFALAN SELESAI! SOAL KUIS TERBUKA DI LAPTOP POS! JAWAB CEPAT & REBUT BEL DI MEJA KAK BALQIS! 🔥"*.
   - Di laptop meja pos masing-masing, **soal kuis 20 pertanyaan bergambar langsung otomatis terbuka serentak**.
   - Peserta langsung menjawab 20 soal dengan kontrol keyboard kilat (`A`/`1`/`←` dan `B`/`2`/`→`), dan tim yang selesai langsung menekan bel raksasa dan sprint ke meja Kak Balqis!

---

## 2. Rencana Perubahan Komponen & Berkas

### A. Proyektor MC: `index.html` & `app.js` (Slide 18)
- **`index.html` (Slide 18 Markup)**:
  - Menambahkan container `#projector-memory-obs-box` di Slide 18 yang tersembunyi selama countdown awal.
  - Struktur container memuat:
    - Counter & Progress Bar: `KARTU [X] DARI 20`.
    - Kartu 3D Flip Card besar (tengah panggung proyektor) dengan sisi cover misterius dan sisi gambar objek CDN + nama objek.
    - Tombol kontrol MC: `⏩ Lewati Observasi (Langsung Buka Kuis di Pos)`.
  - Container status pasca-observasi: `#projector-memory-battle-active` yang menampilkan pesan kuis aktif di semua meja dan radar bell listener.
- **`app.js` (Logika Slide 18 & Countdown Engine)**:
  - Menyematkan array `ITEM_PAIRS` (20 objek bergambar) ke dalam modul Slide 18 proyektor.
  - Saat `triggerBattleCountdown(3)` selesai mencapai 0 ("MULAI!"):
    - Memulai animasi flip 20 kartu observasi di proyektor (1.2 detik/kartu).
    - Mem-broadcast event `MEMORY_OBSERVATION_START`.
    - Setelah kartu ke-20 selesai di-flip (atau saat MC klik Lewati):
      - Menampilkan status kuis aktif di proyektor.
      - Mem-broadcast event `MEMORY_START_QUIZ` dan `BATTLE_UNLOCKED` (round 3).

### B. Layar Meja Pos: `pos.html`, `pos.js`, & `pos.css`
- **`pos.js`**:
  - Menambahkan state pengenal `isMemoryObserving` dan listener untuk `MEMORY_OBSERVATION_START` serta `MEMORY_START_QUIZ`.
  - Pada Babak 3 (Slide 18):
    - Setelah countdown selesai, jika kuis belum dimulai (`isMemoryQuizStarted === false`), tampilkan tampilan **Atensi Proyektor**:
      `👀 TATAP LAYAR PROYEKTOR DI DEPAN!`
      `Hafalkan 20 objek bergambar yang sedang di-flip oleh MC bersama timmu!`
      `Soal kuis akan serentak terbuka di laptop ini begitu hafalan selesai!`
    - Saat sinyal `MEMORY_START_QUIZ` diterima:
      - Otomatis buka arena kuis dengan memuat `memory-slide.html?mode=quiz&autostart=1`.
      - Buka akses pengerjaan serentak di Pos 1, 2, 3, dan 4.

### C. Game Engine: `memory-slide.html`
- **Dukungan URL Parameter `mode=quiz`**:
  - Jika URL memiliki parameter `mode=quiz` (atau `step=quiz`), engine otomatis melewati Fase 1 (Observasi) dan langsung melompat ke Fase 2 (Kuis Kilat 20 Soal) dengan fokus keyboard aktif.
  - Tetap mempertahankan mode standalone penuh (observasi -> kuis) jika dibuka secara mandiri tanpa parameter.

### D. Mirror Sync ke `src/`
- Meng-copy seluruh berkas yang dimodifikasi ke direktori `src/` (`index.html`, `app.js`, `pos.html`, `pos.js`, `pos.css`, `memory-slide.html`) agar server lokal port 8765 langsung menyajikan versi terbaru.

---

## 3. Rencana Verifikasi (Verification Plan)

1. **Automated End-to-End Test via Playwright (`scripts/verify_memory_flow.py`)**:
   - Menjalankan 2 browser context secara simultan (1 Proyektor di Slide 18, 1 Pos Laptop di `pos.html?pos=1`).
   - Trigger countdown proyektor di Slide 18.
   - Verifikasi bahwa di layar proyektor kartu flip 3D muncul dan berputar secara berurutan.
   - Verifikasi bahwa di layar meja pos, status berubah menjadi *"👀 TATAP LAYAR PROYEKTOR DI DEPAN!"* dan kuis belum terbuka.
   - Simulasikan penyelesaian observasi proyektor (atau klik tombol lewati observasi).
   - Verifikasi bahwa layar meja pos otomatis berganti menampilkan Kuis Kilat 20 Soal.
   - Simulasikan penekanan tombol keyboard `A` dan `B` pada kuis di layar pos hingga selesai.
   - Verifikasi bahwa tombol bel sprint raksasa menyala dan dapat ditekan.
2. **Git Checkpoint & Sinkronisasi GitHub**:
   - Local git commit dan push otomatis ke `git@github.com-personal:madyazdhil/hh-kids-26.git`.
