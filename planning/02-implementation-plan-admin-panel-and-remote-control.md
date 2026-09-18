# Implementation Plan 02: Admin Control Panel & Remote Sync System

Dokumen perencanaan teknis untuk penambahan modul **Admin Panel Web (`admin.html`)** dengan **Remote Control Presentation Deck**, **Live Scoring Office Olympic (dengan tombol percobaan salah & penyesuaian skor)**, serta **Manajemen Awarding Pemenang & Foto**.

## User Review Required

> [!IMPORTANT]
> **Arsitektur Sinkronisasi Dua Arah (Multi-Device & Multi-Tab):**
> 1. **Same-Device / Multi-Tab (0ms Latency):** Menggunakan kombinasi browser native `BroadcastChannel` dan `localStorage`. Jika Yazid membuka presentasi di proyektor dan tab admin di layar laptop, sinkronisasi terjadi seketika tanpa perlu konfigurasi jaringan.
> 2. **Cross-Device (Wi-Fi Ruang Da Vinci):** Kita melengkapi `start.sh` dengan skrip `server.py` (hanya memakai modul bawaan Python `http.server`, tanpa library eksternal). Ini memungkinkan Eldina atau panitia lain membuka `http://<IP-Laptop-Yazid>:8765/admin.html` dari smartphone atau laptop terpisah untuk mengontrol presentasi dan memasukkan data.
>
> **Prefill Pemenang Lunch Challenge:** Sesuai arahan pengguna, nama pemenang Lunch Challenge telah ditentukan sebelumnya dengan nama depan **"Nurul"** (disiapkan prefill `Nurul & Pasangan`, namun tetap bisa disesuaikan jika nama lengkap atau foto pasangan sudah siap diinput oleh admin).

---

## Proposed System & Features

```
┌────────────────────────────────────────────────────────┐
│               PANITIA / ADMIN (Eldina)                 │
│                 http://.../admin.html                  │
│  ┌──────────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │  REMOTE CONTROL  │ │ OLYMPIC LIVE │ │  AWARDING & │ │
│  │ (Next/Prev/Timer)│ │ (Score/Salah)│ │   PHOTOS    │ │
│  └────────┬─────────┘ └──────┬───────┘ └──────┬──────┘ │
└───────────┼──────────────────┼────────────────┼────────┘
            │                  │                │
            ▼                  ▼                ▼
    [ BroadcastChannel ] + [ localStorage ] + [ /api/sync ]
            ▲                  ▲                ▲
            │                  │                │
┌───────────┴──────────────────┴────────────────┴────────┐
│               PROYEKTOR / MC (Yazid)                   │
│                 http://.../index.html                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ • Slide berganti otomatis via remote             │  │
│  │ • Step reveal terbuka saat admin klik next       │  │
│  │ • Timer Start / Pause / Reset tersinkronisasi    │  │
│  │ • Nama pemenang & foto ter-update realtime       │  │
│  │ • Live Leaderboard Olympic ter-update otomatis   │  │
│  │ • Sound effects & Confetti meledak sesuai aba2   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 1. Modul 1: Remote Control Deck
- **Navigasi Slide:** Tombol "◀ Previous Slide" dan "Next Slide ▶" ukuran besar yang ramah layar sentuh (touch-friendly), serta dropdown quick jump.
- **Klik Kanan / Hotkey Support:** Memungkinkan admin menavigasi slide maju/mundur dengan klik kontrol atau pintasan khusus.
- **Progressive Step Reveal:** Tombol "Buka Detail / Step Reveal" untuk membuka kartu tantangan di slide game satu per satu sebelum berpindah slide.
- **Timer Controller:** Tombol Start/Pause, Reset, dan pengatur durasi (1m, 2m, 3m) untuk Pos Inspection & Rapat Strategi.
- **SFX & Confetti Triggers:** Tombol darurat untuk membunyikan Bel/Buzzer, Drumroll tegang, Fanfare juara, dan meledakkan Confetti di layar utama.

### 2. Modul 2: Office Olympic Scorer & Live Control
- **4 Pos Tantangan:**
  - Pos 1: Kalananti (Scratch Debugging)
  - Pos 2: Mathchamps (Speed Math Sempoa)
  - Pos 3: Memory Academy (Visual Memory)
  - Pos 4: Spreadsheet (Formula Fixer)
- **Logika Tombol Skor Sesuai Kebutuhan:**
  - Tombol **"Percobaan 1 Benar (+5 Poin)"**
  - Tombol **"Salah / Coba Lagi (Skor Menjadi 4 Poin)"**: Menandai tim melakukan kesalahan pada percobaan pertama sehingga skor potensialnya berkurang menjadi 4 poin.
  - Tombol **"Percobaan 2 Benar (+4 Poin)"**
  - Tombol Koreksi Cepat: `[-1 Poin]` dan `[+1 Poin]`
- **Live Leaderboard & Juara Otomatis:** Perhitungan total skor real-time dari 4 pos game untuk 4-6 tim kelompok. Terdapat tombol *"Tetapkan Juara 1 ke Awarding"* untuk otomatis mengisi tim juara tertinggi ke kategori Absolute Winner.

### 3. Modul 3: Awarding & Photo Manager
- Form input 4 pemenang utama:
  1. **Absolute Winner Office Olympic** (auto-fill dari scoring Olympic atau input manual).
  2. **Best Costume (Navy & Black)** (input nama pemenang + upload foto kostum terbaik).
  3. **Best Lunch Challenge** (prefilled default: *"Nurul & Pasangan"*, slot upload foto lunch).
  4. **Most Entertaining Person of the Day** (input nama pemenang + upload foto/catatan).
- Tombol **"Kirim ke Slide PPT"** dan tombol **"Reveal Live Sekarang! 🎊"** (langsung memicu animasi reveal dan confetti di Slide 13 proyektor).

---

## Proposed Changes

### Component 1: Admin Interface (`src/admin.html`, `src/admin.css`, `src/admin.js`)

#### [NEW] [admin.html](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/admin.html)
- Halaman antarmuka khusus panitia dengan desain Navy & Black yang bersih, tab navigasi (Remote, Olympic Scorer, Awarding, Doorprize), tombol aksi berukuran ergonomis untuk iPad/HP/Laptop.
- Status bar koneksi (`🟢 Terhubung ke Slide PPT (Broadcast/Sync)`).

#### [NEW] [admin.css](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/admin.css)
- Desain glassmorphism gelap responsif, status badge, tombol aksi bergradien (cyan, gold, red, green), visual card per tim, grid skor intuitif.

#### [NEW] [admin.js](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/admin.js)
- Logika state management:
  - Mengirim sinyal `NAVIGATE`, `STEP_REVEAL`, `TIMER_ACTION`, `UPDATE_SCORES`, `UPDATE_WINNERS`, `TRIGGER_CONFETTI`, `TRIGGER_SFX`.
  - Mengelola local state skor tim, status per pos (percobaan 1 salah -> skor 4), dan penyimpanan `localStorage`.
  - Image handling (kompresi DataURL foto sebelum dikirim ke bus agar ringan dan instan).

---

### Component 2: Presentation Deck Sync Integration (`src/index.html`, `src/app.js`)

#### [MODIFY] [index.html](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/index.html)
- Menambahkan status indicator pada header MC (`🟢 Remote Ready`).
- Menambahkan slot rendering foto pada kartu pemenang di Slide 13 (`Grand Awarding Stage`).
- Menambahkan modal/overlay mini Leaderboard Olympic yang dapat dimunculkan/disembunyikan oleh MC atau remote.

#### [MODIFY] [app.js](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/app.js)
- Menambahkan `BroadcastChannel('happy_hour_bus')` dan listener `storage`.
- Menerima perintah navigasi dari admin dan mengeksekusi transisi slide / reveal step / timer.
- Menerima update pemenang & foto dan langsung me-render ke DOM slide awarding secara mulus tanpa refresh halaman.

---

### Component 3: Server & Scripts (`scripts/server.py`, `start.sh`, `scripts/verify_deck.py`)

#### [NEW] [server.py](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/scripts/server.py)
- Server Python ringan tanpa dependensi luar (menggunakan modul bawaan `http.server` dan `socketserver`).
- Melayani file statis dari `src/`.
- Menyediakan endpoint REST sederhana `/api/sync` (metode `GET` dan `POST`) untuk memfasilitasi sinkronisasi state jika admin diakses dari perangkat berbeda dalam satu jaringan Wi-Fi lokal.

#### [MODIFY] [start.sh](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/start.sh)
- Memperbarui skrip agar menjalankan `server.py` dan menampilkan panduan URL lokal (`http://localhost:8765`) serta IP jaringan lokal (misal: `http://192.168.x.x:8765/admin.html`) agar Eldina dapat langsung mengaksesnya dari ponsel/laptopnya.

#### [MODIFY] [verify_deck.py](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/scripts/verify_deck.py)
- Memperbarui skrip pengujian Playwright untuk membuka 2 browser window secara paralel (`index.html` dan `admin.html`), melakukan aksi kontrol remote slide, mengklik tombol skor Olympic (skor 5 -> salah -> 4), memasukkan nama pemenang, dan memverifikasi sinkronisasi DOM di kedua layar.

---

## Verification Plan

### Automated Verification
- Jalankan Python Playwright test:
  ```bash
  python3 scripts/verify_deck.py
  ```
- Verifikasi otomatis mencakup:
  1. Hubungan komunikasi `BroadcastChannel` antara tab Admin dan tab PPT MC.
  2. Aksi tombol `Next Slide` di Admin mengubah active slide di PPT.
  3. Aksi penambahan poin dan tombol salah (retry) menghitung skor tim secara akurat.
  4. Pengisian pemenang awarding di Admin langsung ter-reveal di slide 13 PPT.
  5. Pengambilan tangkapan layar verifikasi di `output/` untuk kedua antarmuka.

### Manual Verification
- Buka `http://localhost:8765` (Deck MC) dan `http://localhost:8765/admin.html` (Panel Admin) secara berdampingan di dua jendela browser.
- Uji navigasi remote, kontrol timer, live scoring, dan reveal foto/nama pemenang.
