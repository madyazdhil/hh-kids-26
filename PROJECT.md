# Project: Regroup Happy Hour Interactive Web Deck

## Purpose

Menyediakan aplikasi web presentasi interaktif (interactive slide deck / presentation app) khusus untuk memandu acara internal kantor **Regroup Happy Hour: Academic Kids Ruangguru (Kids Product MSIG)** di Ruang Da Vinci pada 18 September 2026. Aplikasi ini dirancang untuk Ahmad Yazid yang bertindak ganda sebagai **MC sekaligus Operator**, sehingga seluruh alur, musik, senam, pengatur waktu (timer), reveal challenge bertahap, awarding, doorprize, dan transisi sambutan dapat dikendalikan dengan mulus via keyboard/clicker.

## Desired Outcome

Sebuah aplikasi web berbasis HTML5/CSS/JavaScript modern (didukung Three.js/WebGL particle visuals dan Web Audio/SVG) yang memiliki tampilan estetika tinggi (*Navy & Black theme* sesuai dresscode), responsif, kaya mikro-animasi, memiliki fitur sandbox YouTube audio/video player, interactive timers countdown yang dapat dikustomisasi, progressive text/card reveal untuk kejutan audiens, modul awarding interaktif, dan visual doorprize lottery.

## Deliverables

- Interactive Web Presentation App (`src/index.html`, `src/style.css`, `src/app.js` atau bundler lightweight) yang siap dijalankan secara lokal atau di-host.
- Fitur Slide Lengkap:
  1. **Pre-Show / Waiting Lounge:** Sandbox YouTube Search & Audio Player untuk memutar BGM santai saat peserta berdatangan.
  2. **Hero Welcoming Screen:** Animasi Three.js / WebGL / SVG looping spektakuler bertuliskan *"Welcome to Office Happy Hour - Kids Product MSIG"*.
  3. **Intro Game Senam:** Slide pemilihan volunteer/korban instruktur (Batu-Gunting-Kertas terbalik / Simon Says).
  4. **Interactive Workout Video:** Sandbox YouTube Video Player otomatis memutar senam interaktif MR.MINIRA.
  5. **Office Olympic Title & Transition:** Slide pembuka game inti dengan efek dramatis.
  6. **Pos Inspection Timer (Ketua Kelompok Mencari):** Timer countdown (default 1 menit, dapat disesuaikan 1m/2m/3m).
  7. **Group Strategizing Timer:** Timer countdown (default 2 menit) untuk rapat taktik kelompok.
  8. **Progressive Game Reveal (Step-by-step):** Reveal bertahap per slide:
     - Kalananti = Scratch Coding Debugging
     - Mathchamps = Speed Math Sempoa
     - Memory Academy = Visual Memory
     - Kejutan ke-4 = Spreadsheet Error Fixer (Makanan pokok kita semua)
     - Gimmick Bel: Lari kejar Kak Balqis untuk tekan bel!
  9. **Intermission & Main Theme:** Kembali ke tema utama untuk transisi makan sore & tebak Guardian Angel (*"Kenyang Sore, Bongkar Kedok"*).
  10. **Awarding Stage:** Reveal dinamis untuk:
      - Absolute Winner Office Olympic
      - Best Costume (Navy & Black)
      - Best Lunch Challenge (2 Pasang + slot foto)
      - Most Entertaining Person of the Day
  11. **Doorprize Nyeleneh Lottery:** Visual random draw untuk barang-barang unik (Sendal jepit, minyak kayu putih, tolak angin, cabai segar, beng-beng, tisu, hansaplast).
  12. **Speech Khidmat Bu Deina:** Slide transisi hening & tertib untuk arahan Queen Aldeina.
  13. **Grand Finale & Photo Session:** Penutupan ceria dan foto bersama.

## Scope

- Frontend web application interaktif (Vanilla HTML/CSS/JS + Three.js / Canvas).
- Keyboard shortcuts untuk kontrol MC (Next slide: Space/ArrowRight, Prev slide: ArrowLeft, Toggle Timer: T, Reset Timer: R, Fullscreen: F).
- Sound effects terintegrasi (buzzer, tick-tock countdown, fanfare, applause).
- Dokumentasi rundown dan panduan MC.

## Non-Goals

- Integrasi database backend online yang rumit (cukup local state / storage).
- Multi-user remote synchronization via WebSocket (cukup 1 laptop operator terhubung proyektor).

## Audience

Seluruh tim internal Academic Kids Ruangguru / Kids Product MSIG, dipandu oleh MC & Operator Ahmad Yazid.

## Constraints and Preferences

- Warna dan tema: **Navy & Black** sesuai dresscode resmi acara.
- Visual harus spektakuler (*wow effect*), bukan slide teks statis polos biasa.
- Surprise element: Teks dan konten tidak boleh muncul sekaligus; harus bertahap (*reveal on demand*) agar MC bisa membangun tensi komedi/acara.
- Ringan dijalankan di laptop MacBook / Chrome tanpa lag.

## Definition of Done

1. Web app berjalan lancar di browser Chrome secara lokal (`file://` atau dev server).
2. Seluruh 13 segmen slide berfungsi dengan transisi mulus dan navigasi keyboard responsif.
3. YouTube video player dan timer interaktif berfungsi sempurna.
4. Kode terversioning rapi di Git lokal.

## Origin Context

Dipromosikan dari Quick Question: `q-n-a/2026-09-17-rundown-regroup-happy-hour-mc-panitia.md` atas instruksi pengguna pada 18 September 2026.
