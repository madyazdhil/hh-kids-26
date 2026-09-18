# Implementation Plan 04: Spectator Arena (VDO.ninja Real-Time Screen Mirroring)

## Problem Statement & Context
Yazid (MC) ingin menampilkan apa yang sedang dikerjakan oleh 4 meja pemain (Pos 1 Scratch, Pos 2 Math, Pos 3 Memory, Pos 4 Sheets) secara langsung di layar proyektor saat sesi pertandingan (Office Olympic Battle Arena), mirip dengan spectator mode turnamen e-sports atau share screen di Google Meet / Zoom.

## Proposed Solution: VDO.ninja Cyber Spectator Arena
Mengintegrasikan WebRTC screen sharing VDO.ninja yang disematkan langsung (embedded iframe) ke dalam deck presentasi MC (`index.html`), dengan dukungan satu-klik broadcast di laptop pos (`pos.html`), kendali jarak jauh dari HP Aldeina (`admin.html`), serta fallback darurat Google Meet.

---

## User Review & Key Details
- **Zero Alt-Tab di Proyektor:** MC tetap berada di dalam deck presentasi; Spectator Arena muncul sebagai overlay neon futuristik di atas slide.
- **Dua Mode Tampilan Proyektor:**
  - **Grid 2x2:** Menampilkan 4 meja sekaligus berdampingan.
  - **Focus Mode (Spotlight):** MC dapat mengklik salah satu meja (misal Meja 1) untuk memperbesar layar meja tersebut memenuhi proyektor.
- **Tombol 1-Klik di Laptop Pos:** Tombol `[ 📡 Broadcast Layar ]` di `pos.html` langsung membuka pop-up screen share tanpa setup manual.
- **Kendali Jarak Jauh dari HP Aldeina:** Tombol remote `[ 📺 Spectator Arena ]` di `admin.html` untuk membuka/menutup spectator langsung dari smartphone.
- **Fallback Google Meet:** Tombol darurat di pojok header untuk membuka room GMeet jika ada kendala jaringan lokal.

---

## Proposed File Changes

### 1. Slide Deck MC Proyektor
#### [MODIFY] [index.html](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/index.html) & [src/index.html](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/index.html)
- Menambahkan tombol floating launcher `[ 📺 SPECTATOR ARENA ]` di slide 13–16 (atau selalu aktif dengan indikator).
- Menambahkan modal overlay `#spectator-overlay` berisi:
  - Header: status live, tombol `[ 2x2 Grid ]`, `[ Focus Pos 1..4 ]`, `[ ↗ Google Meet ]`, dan tombol close `[ ✕ ]`.
  - Grid 4 iframe:
    - Pos 1: `https://vdo.ninja/?view=hhkids26_pos1&cleanoutput&transparent=1`
    - Pos 2: `https://vdo.ninja/?view=hhkids26_pos2&cleanoutput&transparent=1`
    - Pos 3: `https://vdo.ninja/?view=hhkids26_pos3&cleanoutput&transparent=1`
    - Pos 4: `https://vdo.ninja/?view=hhkids26_pos4&cleanoutput&transparent=1`

#### [MODIFY] [style.css](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/style.css) & [src/style.css](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/style.css)
- Styling glassmorphism Navy & Black cyber neon untuk `#spectator-overlay`.
- Responsive grid 2x2 dan focused view layout.
- Styling floating badge launcher.

#### [MODIFY] [app.js](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/app.js) & [src/app.js](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/app.js)
- Event listener shortcut keyboard `V` (Video Spectator) dan `Escape`.
- Handler toggle modal, grid/focus switcher.
- Handler `HHSync` untuk event `SPECTATOR_TOGGLE` dan `SPECTATOR_FOCUS`.

---

### 2. Layar 4 Meja Pos Pemain
#### [MODIFY] [pos.html](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/pos.html) & [src/pos.html](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/pos.html)
- Menambahkan top broadcast bar dengan tombol: `[ 📡 Broadcast Layar ke Proyektor ]`.

#### [MODIFY] [pos.css](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/pos.css) & [src/pos.css](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/pos.css)
- Styling tombol broadcast dengan indikator status (Standby / Streaming).

#### [MODIFY] [pos.js](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/pos.js) & [src/pos.js](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/pos.js)
- Handler klik tombol broadcast: membuka window `https://vdo.ninja/?push=hhkids26_pos<currentPos>&screenshare&webcam=0&quality=1&label=Pos%20<currentPos>`.

---

### 3. Remote HP Admin Aldeina
#### [MODIFY] [admin.html](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/admin.html) & [src/admin.html](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/admin.html)
- Menambahkan tombol kontrol di Tab Remote:
  - `[ 📺 TOGGLE SPECTATOR DI PROYEKTOR ]`
  - Quick focus pill buttons: `[ Grid ]`, `[ Pos 1 ]`, `[ Pos 2 ]`, `[ Pos 3 ]`, `[ Pos 4 ]`.

#### [MODIFY] [admin.js](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/admin.js) & [src/admin.js](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/admin.js)
- Broadcast event `SPECTATOR_TOGGLE` dan `SPECTATOR_FOCUS` via `HHSync`.

---

## Verification Plan
### Automated Tests
- Menjalankan Playwright test `scripts/verify_spectator_arena.py` untuk menguji:
  1. Pembukaan dan penutupan modal Spectator Arena di proyektor via tombol dan shortcut keyboard `V`.
  2. Switch layout dari Grid 2x2 ke Focus Mode Pos 1/2/3/4.
  3. Pemicu remote dari Mobile Admin via `HHSync` yang membuka Spectator Arena di proyektor secara serempak.
  4. Pengecekan 0 console error di seluruh halaman.
