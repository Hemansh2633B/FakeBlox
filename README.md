# FakeBlox

A browser-based 3D obstacle course game built as a single-page HTML app.

## Overview

`game.html` is a seed-based obby runner with procedurally generated levels, multiple difficulty settings, endless mode, daily challenges, and simple audio + particle effects.

## Features

- Seed-based procedural level generation
- Difficulty presets: easy, normal, hard, extreme
- Endless run mode
- Daily challenge seed generation
- In-game HUD with timer, checkpoint tracking, and seed copy support
- Touch controls for mobile devices
- Procedural audio using the Web Audio API
- Achievement toast notifications
- Post-processing effects using Three.js

## How to run

1. Open `game.html` in a modern browser.
2. Alternatively, serve the folder using a local web server and navigate to:

```bash
cd /workspaces/FakeBlox
python3 -m http.server 8000
```

Then open `http://localhost:8000/game.html`.

## Controls

- `W`, `A`, `S`, `D` - Move
- `Space` - Jump
- `Shift` - Sprint
- `Esc` - Pause
- Mouse drag - Camera look
- Mouse wheel - Zoom
- Touch controls appear on mobile devices

## Seed sharing

- Enter a custom seed in the menu to replay or share a specific level.
- Click the HUD seed or end-screen copy button to copy the current seed.
- URL parameters supported:
  - `?seed=your_seed`
  - `?difficulty=easy|normal|hard|extreme`

## Notes

- The game is implemented entirely in `game.html`.
- Three.js is loaded via CDN using an import map.
- Local storage is used for saving achievements and best runs.

## License

This project is licensed under the MIT License.

Copyright (c) 2026 Hemanshu Kant Choursiya
