# 🎮 FakeBlox

> A seed-based 3D obby/speedrun prototype built with **TypeScript**, **Three.js**, **Cannon-es**, and **Vite**.

![FakeBlox Banner](https://img.shields.io/badge/FakeBlox-3D%20Obby-6BCB77?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-Rendering-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white)

---

## ✨ Highlights

- 🔁 **Seeded procedural levels** for reproducible runs
- 🧩 **Difficulty presets** (Easy / Normal / Hard / Extreme)
- 🚩 **Checkpoint system** with activation + respawn support
- ⏱️ **Speedrun timer** and score calculation
- ⭐ **Collectibles** with progress tracked in HUD
- 💀 **Fast death/respawn loop** with brief invincibility
- 💾 **Best-run persistence** per `seed + difficulty` via `localStorage`

---

## 🚀 Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Run in development

```bash
npm run dev
```

### 3) Build for production

```bash
npm run build
```

### 4) Preview production build

```bash
npm run preview
```

---

## 🎮 Controls

- **Move:** `WASD` / Arrow Keys
- **Jump:** `Space`
- **Sprint:** `Shift`
- **Look:** Mouse (click canvas to lock pointer)
- **Pause:** `Esc`

---

## 🧠 Core Gameplay Systems

### Difficulty Parameters

| Parameter | Easy | Normal | Hard | Extreme |
|---|---:|---:|---:|---:|
| Total platforms | 40 | 65 | 90 | 120 |
| Min platform width | 3.0 | 1.5 | 1.0 | 0.8 |
| Max gap distance | 4 | 6 | 8 | 9 |
| Obstacle density (per 10) | 1 | 3 | 6 | 8 |
| Checkpoint interval | 6–8 | 8–10 | 10–14 | 15–20 |

### Checkpoints

- Activated by moving within a short radius of a checkpoint platform.
- Respawn returns player to the last activated checkpoint.
- HUD shows checkpoint activation progress.

### Timer

- Starts when the player first moves or jumps.
- Continues through death/respawn.
- Stops when the run is completed.

### Collectibles

- Seeded placement with weighted distribution:
  - ~60% on the main path
  - ~25% on small detours
  - ~15% in secret/harder spots
- Collection progress is shown as `⭐ current/total`.

### Scoring

Final score combines:

- Base score
- Time bonus
- Death penalty
- Collectible bonus

Star rating thresholds:

- ⭐⭐⭐ at **12,000+**
- ⭐⭐⭐⭐ at **15,000+**
- ⭐⭐⭐⭐⭐ at **17,000+**

---

## 🗂️ Project Structure

```text
src/
  game/          # Main game loop, scene bootstrap, orchestration
  generation/    # Seeded generation, validation, platform placement
  objects/       # Platforms, checkpoints, collectibles, hazards
  player/        # Player movement, input, camera, model
  systems/       # Timer, score, audio, save, checkpoints, collectibles
  ui/            # Menus, HUD, end screen, touch controls
  utils/         # Centralized constants/config
```

---

## 🛠️ Tech Stack

- **TypeScript** for game logic
- **Three.js** for rendering
- **Cannon-es** for physics
- **Howler** for audio
- **Vite** for dev/build tooling

---

## 📌 Notes

- Best runs are stored locally in-browser.
- Seed sharing is supported in the HUD with a copy button.
- This is a prototype codebase focused on fast gameplay iteration.
- Full QA matrix lives in `docs/TESTING_CHECKLIST.md`.

---

## 🤝 Contributing

1. Fork and clone the repo
2. Create a feature branch
3. Run checks (`npm run build`)
4. Open a PR with a clear summary + testing notes

---

## 📄 License

Currently unlicensed / internal prototype. Add a license before public distribution.
