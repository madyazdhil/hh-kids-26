# Canvas: Regroup Happy Hour Ecosystem & Control Center

- **MC Presentation Deck (Proyektor):** [`src/index.html`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/index.html)
- **Admin & Mobile Remote Control (HP Aldeina):** [`src/admin.html`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/admin.html)
- **4 Pos Laptop Meja Tengah:** [`src/pos.html`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/src/pos.html)
  - Pos 1 (Scratch): `http://localhost:8765/pos.html?pos=1`
  - Pos 2 (Mathchamps): `http://localhost:8765/pos.html?pos=2`
  - Pos 3 (Memory): `http://localhost:8765/pos.html?pos=3`
  - Pos 4 (Spreadsheet): `http://localhost:8765/pos.html?pos=4`
- **One-Click Launch Script:** [`start.sh`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/start.sh) (port 8765)
- **Automated Verification:** [`scripts/verify_countdown_flow.py`](file:///Users/yazidhilmi/Documents/Edu/Fireside-chat/projects/regroup-happy-hour/scripts/verify_countdown_flow.py)
- **GitHub Repository:** [madyazdhil/hh-kids-26](https://github.com/madyazdhil/hh-kids-26)
- **Google Docs Live Sync:** [Notes - Regroup Happy Hour (Tab 2)](https://docs.google.com/document/d/1F78ZeIbbctTQxr5XO6hzp6G1t3FGO11CH_2Zf-uoZYI/edit?tab=t.5zp149vq0h6p)

## Alur Otomatis 4 Pos Laptop Meja Tengah (`pos.html`)

1. **Slide 1–5 (Pre-Show s.d. Cooling Down):** Keempat laptop menampilkan Judul Bersih Grand Template (zero spoiler).
2. **Slide 6 & 7 (Office Olympics Splash & Briefing):** Keempat laptop menampilkan Logo & Cincin Neon Office Olympics.
3. **Slide 8 (Timer 1 Menit Ketua Kelompok Scouting):**
   - Sebelum timer jalan: Logo Office Olympics.
   - Saat Timer START:
     - 💻 Laptop 1: Pos 1 Scratch Code Debugging
     - 💻 Laptop 2: Pos 2 Mathchamps Speed Math
     - 💻 Laptop 3: Pos 3 Memory Academy Visual Memory
     - 💻 Laptop 4: Pos 4 Spreadsheet Special (#REF! Fixer)
   - Saat Timer 00:00 atau Slide 9: Keempat laptop langsung otomatis mengunci kembali ke Logo Office Olympics (anti-bocor!).
4. **Slide 10–12 (Rules Bel, Timer 2 Menit Rapat Kelompok, Ready):** Tetap di Logo Office Olympics.
5. **Slide 13–20 (Babak Tanding 4 Pos — Pasangan Briefing & Countdown Arena):**
   - **Slide 13, 15, 17, 19 (Briefing MC):** Layar pos laptop 100% TERKUNCI (STANDBY) dengan icon gembok 🔒 dan teks pengingat agar peserta fokus mendengarkan penjelasan MC di proyektor. Soal belum bocor!
   - **Slide 14, 16, 18, 20 (Arena Tanding & Countdown 3-2-1):** MC menekan tombol *"MULAI COUNTDOWN 3-2-1!"* (atau tombol spasi). Hitungan mundur 3... 2... 1... MULAI! berputar di proyektor, dan tepat saat hitungan habis, layar pos laptop otomatis membuka workspace soal lengkap dengan tombol raksasa: `"🔔 KELAR! SPRINT KEJAR KAK BALQIS!"`.
6. **Slide 21 s.d. 26 (Sesi Santuy, Tebak Angel, Awarding, Doorprize, Closing):** Keempat laptop kembali ke Logo Office Olympics / Grand Celebration.

