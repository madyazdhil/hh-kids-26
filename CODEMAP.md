# Codemap: Regroup Happy Hour

## Arsitektur Aplikasi

```
projects/regroup-happy-hour/
├── docs/
│   └── rundown-and-guide.md        # Salinan panduan dan rundown lengkap
├── planning/
│   └── 01-implementation-plan-happy-hour-deck.md # Rencana teknis bertahap
├── src/
│   ├── index.html                  # Struktur markup 13 segmen slide
│   ├── style.css                   # Navy & Black dark theme, glassmorphism, responsive UI
│   └── app.js                      # Slide controller, Three.js ambient background, Timer, YouTube IFrame
├── CANVAS.md
├── MEMORY.md
├── PROJECT.md
└── STATE.md
```

## Entry Point & Menjalankan Aplikasi

- Buka `projects/regroup-happy-hour/src/index.html` langsung di browser Chrome atau jalankan dev server ringan (`npx serve src` atau python `http.server`).
