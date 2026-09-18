# Implementation Plan: Admin & Remote Control Center (`admin.html`)

Membangun modul **Admin & Remote Control Station (`admin.html`)** untuk Aldeina dan panitia agar dapat mengelola skor Office Olympics secara real-time, menginput dan menembakkan nama pemenang langsung ke layar proyektor MC, serta mengendalikan perpindahan slide presentasi jarak jauh (*remote slide control*).

## User Review Required

> [!IMPORTANT]
> - **Dual-Layer Synchronization**:
>   1. **Local Dual-Screen / Tab Sync (`BroadcastChannel` + `localStorage`)**: Jika laptop operator tersambung ke proyektor HDMI (layar proyektor menampilkan `index.html` dan layar laptop menampilkan `admin.html`), kendali slide dan input pemenang tersinkronisasi instan **0ms tanpa perlu koneksi internet**.
>   2. **Cross-Laptop P2P Sync (PeerJS / WebRTC)**: Jika Aldeina menggunakan laptop terpisah dari Yazid, kedua browser dapat terhubung melalui Room Code sederhana (misal: `hh2026`) sehingga Aldeina bisa mengontrol proyektor dari kursinya.
> - **Pemenang Lunch Challenge**: Sesuai arahan, pemenang Lunch Challenge sudah disiapkan secara default untuk **Nurul & Partner**, dengan opsi mengunggah foto lunch langsung dari panel admin untuk ditembakkan ke proyektor.

---

## Fitur & Modul yang Akan Dibangun

### 1. Modul 1: Olympic Score Tracker & Scoring Matrix
- **Tabel Skor 4 Babak** (Kalananti, Mathchamps, Memory Academy, Spreadsheet).
- **Mekanisme Percobaan & Poin**:
  - Tombol **"Benar Percobaan 1" (+5 Poin)**.
  - Tombol **"Salah 1st Attempt"** -> otomatis menurunkan nilai babak tersebut ke **4 Poin** untuk percobaan kedua tim tersebut.
  - Tombol **"Benar Percobaan 2" (+4 Poin)**.
- **Live Leaderboard**:
  - Akumulasi skor per tim otomatis dihitung secara realtime.
  - Peringkat 1 (Absolute Winner) otomatis terdeteksi.
  - Tombol **"👑 Kirim Juara Olympic ke Proyektor"** -> Mengirim nama tim pemenang ke Slide 13 di proyektor MC dan langsung meledakkan confetti!

### 2. Modul 2: Awarding Control Panel
- **Kostum Terbaik (Navy & Black)**:
  - Input nama pemenang -> Tombol **"Kirim ke Proyektor"**.
- **Lunch Challenge Terbaik**:
  - Input default terisi: `Nurul & Partner`.
  - Tombol upload foto lunch -> Tombol **"Kirim Foto & Nama ke Proyektor"**.
- **Most Entertaining Person**:
  - Input nama pemenang -> Tombol **"Kirim ke Proyektor"**.
- Tombol **"🎊 Trigger Confetti Proyektor"** untuk efek perayaan dari jauh.

### 3. Modul 3: Slide Remote Control (Presenter HUD)
- **Live Slide Status**: Menampilkan slide aktif saat ini di proyektor (misal: *"Slide 5: Office Olympics"*).
- **Navigation Buttons**:
  - `◀ Previous Slide`
  - `Next Step / Slide ▶` (mendukung progressive reveal bertahap).
  - `Toggle Timer (T)` (menjalankan/pause timer Slide 6 & 7 dari jauh).
  - `Reset Timer (R)`.
  - `🎰 Putar Doorprize` (memutar roda nomor doorprize Slide 14).
  - `🎆 Grand Confetti` (Slide 16).
- **Quick Jump Dropdown**: Lompat langsung ke slide tertentu.

---

## Proposed Changes

### Presentation Deck Updates
#### [MODIFY] [index.html](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/index.html)
- Tambahkan listener sinkronisasi real-time (`BroadcastChannel` & `localStorage` storage event).
- Tambahkan hook untuk menerima pemenang, foto, dan perintah navigasi jarak jauh.

#### [MODIFY] [app.js](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/app.js)
- Implementasikan channel handler:
  - Menerima `NAVIGATE_SLIDE`, `NEXT_REVEAL`, `PREV_SLIDE`.
  - Menerima `START_TIMER`, `RESET_TIMER`.
  - Menerima `SET_WINNER` (Olympic, Costume, Lunch, Entertaining) dan langsung mengaktifkan reveal + confetti di proyektor.
  - Mengirimkan status balik `CURRENT_SLIDE_UPDATE` ke admin panel.

---

### Admin Station
#### [NEW] [admin.html](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/admin.html)
- Antarmuka Admin bernuansa Navy & Dark Glassmorphism yang bersih dan ringkas.
- Layout 2 kolom: Kolom Kiri = Remote Control & Timer, Kolom Kanan = Olympic Scorekeeper & Awarding Dispatcher.

#### [NEW] [admin.js](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/admin.js)
- Logika kalkulasi poin (+5 / +4).
- State storage di `localStorage` agar data nilai tidak hilang jika halaman ter-refresh.
- Dispatcher `BroadcastChannel` dan PeerJS bridge.

#### [MODIFY] [style.css](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/style.css)
- Tambahkan style komponen panel admin: tabel nilai dinamis, tombol skor hijau/merah, remote control HUD.

---

## Verification Plan

### Automated Tests
- Script Playwright baru `scripts/verify_admin_remote.py`:
  1. Buka 2 halaman secara bersamaan (`index.html` dan `admin.html`).
  2. Dari `admin.html`, klik "Next Slide" -> verifikasi `index.html` berpindah slide.
  3. Dari `admin.html`, input skor Olympic (5 poin dan 4 poin) -> verifikasi leaderboard.
  4. Dari `admin.html`, klik "Kirim Juara Olympic" -> verifikasi di `index.html` nama juara muncul dengan efek confetti.
  5. Verifikasi pemenang Lunch Challenge default Nurul & Partner.

### Manual Verification
- Buka tab `index.html` dan `admin.html` berdampingan di browser.
- Uji coba klik remote control dan input nama pemenang.
- Push update ke GitHub `hh-kids-26`.
