
# FakeBlox

> A browser-based 3D obstacle course game (obby runner) with procedural generation, endless mode, and daily challenges.

---

## 🕹️ Overview

**FakeBlox** is a single-page web game inspired by classic obby runners. It features seed-based procedural level generation, multiple difficulty settings, endless mode, daily challenges, and simple audio/particle effects—all in your browser.

---

## ✨ Features

- Procedural, seed-based level generation
- Massive biome/scene variety inspired by Minecraft overworld, caves, Nether, and End regions
- Difficulty presets: easy, normal, hard, extreme
- Endless run mode
- Daily challenge with unique seed
- In-game HUD: timer, checkpoints, seed copy
- Touch controls for mobile
- Procedural audio (Web Audio API)
- Achievement toast notifications
- Post-processing effects (Three.js)
- Local storage for achievements and best runs

---

## 🌍 Biomes & Scenes

The generator now includes broad biome coverage across:

- **Overworld**: Plains (including Sunflower Plains), Forest families, Taiga variants, Desert, Jungle variants, Badlands variants, mountain ranges, snowy/ice regions, swamps, ocean temperatures/depths, and unique biomes like Mushroom Fields, Meadow, and Cherry Grove.
- **Caves**: Lush Caves, Dripstone Caves, and Deep Dark.
- **Nether**: Nether Wastes, Crimson Forest, Warped Forest, Soul Sand Valley, and Basalt Deltas.
- **The End**: Main End + Highlands, Midlands, Barrens, and Small Islands.

---

## 🚀 Getting Started

### Play Instantly

Just open `game.html` in any modern browser.

### Local Web Server (Recommended)

```bash
cd /workspaces/FakeBlox
python3 -m http.server 8000
```
Then open [http://localhost:8000/game.html](http://localhost:8000/game.html) in your browser.

---

## 🎮 Controls

| Action         | Keyboard/Mouse         | Touch (Mobile)         |
| -------------- | ---------------------- | ---------------------- |
| Move           | W, A, S, D             | On-screen joystick     |
| Jump           | Space                  | Jump button            |
| Sprint         | Shift                  | Sprint button          |
| Pause          | Esc                    | Pause button           |
| Camera Look    | Mouse drag             | Drag on screen         |
| Camera Mode    | V or F (toggle)        | —                      |
| Zoom           | Mouse wheel            | Pinch/Zoom gesture     |

---

## 🌱 Seed Sharing & URL Parameters

- Enter a custom seed in the menu to replay/share a level (numeric values are treated as 64-bit integer seeds)
- Click the HUD seed or end-screen copy button to copy the current seed
- Supported URL parameters:
  - `?seed=your_seed`
  - `?difficulty=easy|normal|hard|extreme`

---

## 📁 File Structure

```
FakeBlox/
├── game.html         # Main game (single-page app)
├── style.css         # Game styles
├── fonts/            # Fonts used in-game
├── game/             # Game logic modules (JS)
│   ├── ai.js
│   ├── audio.js
│   ├── generation.js
│   ├── input.js
│   ├── main.js
│   ├── objects.js
│   ├── particles.js
│   ├── player.js
│   ├── systems.js
│   └── ui.js
├── backup/           # Backup files
│   └── game.html
├── index.html        # (Optional) Landing or redirect
├── dump.js           # (Optional) Debug/utility
└── README.md         # This file
```

---

## 🖼️ Screenshots

<!-- Add screenshots here -->

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📜 License

MIT License © 2026 Hemanshu Kant Choursiya
