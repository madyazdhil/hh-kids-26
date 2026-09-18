# Implementation Plan: Regroup Happy Hour Interactive Web Deck

Aplikasi web presentasi interaktif (slide deck & MC control center) berbasis web modern (Three.js WebGL, Vanilla CSS Navy & Black, YouTube player, interactive timers, progressive reveal, awarding, dan doorprize lottery) untuk event **Regroup Happy Hour Academic Kids Ruangguru** di Ruang Da Vinci pada 18 September 2026.

## User Review Required

> [!IMPORTANT]
> - **Tema Visual:** Navy & Black Glassmorphism sesuai dresscode resmi acara, dengan aksen cyber cyan (`#00f0ff`) dan gold (`#ffd700`).
> - **Dual Role Optimization:** Navigasi dirancang one-handed (bisa dioperasikan dengan tombol `Space`/`Panah Kanan` atau wireless presenter clicker) sehingga MC Yazid leluasa berbicara memegang mic.
> - **Fitur Terintegrasi:** Sandbox YouTube player, Three.js 3D ambient particle starfield, timer countdown (1m/2m) dengan buzzer audio, step-by-step surprise reveal, visual generator doorprize nyeleneh, dan photo slot untuk Lunch Challenge.

## Proposed Architecture & File Structure

```
projects/regroup-happy-hour/
├── docs/
│   └── rundown-and-guide.md
├── planning/
│   └── 01-implementation-plan-happy-hour-deck.md
├── src/
│   ├── index.html        # Semantic HTML slide container & modular components
│   ├── style.css         # Navy & Black glassmorphism, fluid typography, animations
│   ├── app.js            # Slide controller, Three.js particle canvas, timer engine, Web Audio SFX
│   └── assets/           # Local sound effects / icons / fallback visuals
├── CANVAS.md
├── HISTORY.md
├── MEMORY.md
├── PROJECT.md
└── STATE.md
```

## Detailed Slide Modules & Interaction Flow

1. **Slide 1: Pre-Show Lounge (YouTube Music Sandbox)**
   - Input/embed YouTube untuk memutar BGM santai saat peserta memasuki Da Vinci.
   - Quick preset buttons: Chill Lo-Fi, Upbeat Office, Coffee Jazz.
2. **Slide 2: Hero Welcoming Screen**
   - Three.js WebGL interactive 3D particle background (Navy & Black depth).
   - Dynamic typography: *"Welcome to Happy Hour - Kids Product MSIG"*.
   - Dresscode badge & event vibe.
3. **Slide 3: Intro Game Senam (Pemilihan Korban Instruktur)**
   - Rules: Batu-Gunting-Kertas Terbalik Lawan Yazid / Simon Says.
   - Penobatan gelar *"Chief Workout Officer"*.
4. **Slide 4: Interactive Workout Session (MR.MINIRA)**
   - Embedded video player: `https://www.youtube.com/watch?v=01TdshgZGZo`.
   - On-screen cues untuk MC (*"DODGE!", "JUMP!", "PUNCH!"*).
5. **Slide 5: Office Olympic Title Splash**
   - Cinematic neon rings & cyber badges.
   - Penjelasan filosofi 4 game (3 Produk Kids + 1 Makanan Pokok Kantor).
6. **Slide 6: Pos Inspection Timer ("Ketua Kelompok Mencari")**
   - Digital countdown timer (default 1:00, opsi 2:00/3:00).
   - Shortcut keyboard: `T` (Start/Pause), `R` (Reset).
   - Audio buzzer alarm saat 00:00.
7. **Slide 7: Group Strategizing Timer ("Rapat Taktik Tim")**
   - Digital countdown timer (default 2:00).
   - Audio ticking sound di 10 detik terakhir.
8. **Slide 8-11: Progressive Game Reveals (Satu per Satu)**
   - *Challenge 1*: Kalananti (Scratch Debugging) + Gimmick kejar Kak Balqis untuk tekan bel!
   - *Challenge 2*: Mathchamps (Speed Math Sempoa)
   - *Challenge 3*: Memory Academy (Visual Memory Flash)
   - *Challenge 4 (Surprise Addition)*: All of Us (Spreadsheet Formula Error Fixer #REF! & #VALUE!)
   - Sistem Poin: Percobaan 1 = 5 Poin, Percobaan 2 = 4 Poin.
9. **Slide 12: Intermission & Sesi Santuy ("Kenyang Sore, Bongkar Kedok")**
   - Makan sore bersama & reveal kado Guardian Angel.
10. **Slide 13: Grand Awarding Stage**
    - Step-by-step reveal:
      - Absolute Winner Office Olympic
      - Best Costume (Navy & Black)
      - Best Lunch Challenge (2 Pasang + slot foto preview)
      - Most Entertaining Person of the Day
    - Confetti celebration animation saat kartu pemenang di-reveal.
11. **Slide 14: Doorprize Nyeleneh Lottery Machine**
    - Randomizer / Lucky Draw number caller.
    - Hadiah: Sendal jepit, minyak kayu putih, tolak angin, cabai segar, beng-beng sekotak, tisu, hansaplast.
12. **Slide 15: Speech Khidmat - "Queen Aldeina"**
    - Desain elegan & khidmat dengan pesan ketertiban duduk tegak.
13. **Slide 16: Closing & Foto Bersama**
    - Outro celebratory card & instruksi barisan foto Da Vinci.

## Keyboard Shortcuts for MC Operator

- `Space` / `ArrowRight`: Next slide atau reveal card berikutnya.
- `ArrowLeft`: Previous slide.
- `T`: Start / Pause active timer.
- `R`: Reset active timer.
- `F`: Toggle browser Fullscreen.
- `M`: Mute / Unmute background sound.

## Verification Plan

### Automated & Sanity Tests
- Verifikasi bahwa semua file (`index.html`, `style.css`, `app.js`) valid secara sintaksis dan tidak memiliki console error.
- Validasi rendering dan responsiveness di browser via Playwright / Browser tools.

### Manual Verification
- Uji navigasi keyboard dari slide 1 sampai 16.
- Uji fungsi countdown timer (1m dan 2m) beserta suara buzzer.
- Uji embed YouTube player untuk video senam dan musik lounge.
- Uji tombol reveal bertahap pada awarding dan doorprize.
