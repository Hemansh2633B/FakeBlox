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


`npm run build` runs full TypeScript checks plus Vite bundling (`tsc && vite build`).
For quick Babylon-only bundle validation, you can still run:

```bash
npx vite build
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

- **Debug Toggle:** `F3`

### Shareable URL Params

- `?seed=hello&difficulty=normal` loads preset run settings
- `?debug=true` starts with debug overlay enabled


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

Formula used:

```text
Base Score = 10000
Time Bonus = max(0, 5000 - (completionTime / targetTime) * 5000)
targetTime = platformCount * 3 seconds
Death Penalty = deaths * 100
Collectible Bonus = (starsCollected / totalStars) * 3000
Final Score = Base Score + Time Bonus - Death Penalty + Collectible Bonus
```

Star rating thresholds:

- ⭐⭐⭐ at **12,000+**
- ⭐⭐⭐⭐ at **15,000+**
- ⭐⭐⭐⭐⭐ at **17,000+**

- ⭐⭐ at **8,000+**
- ⭐ for completing the level

### Daily Challenge (UTC)

- Daily challenge seed is derived from UTC date + fixed salt and hashed for deterministic global parity.
- Difficulty is intended to be locked to `normal`.
- Badge format: `📅 Daily Challenge — <Month Day, Year>` (UTC date).

### Endless Mode (Design Direction)

- Generation is chunk-based and intended to stream forward indefinitely.
- Difficulty ramps up over time.
- No finish line; focus metrics are distance and stars collected.
- Checkpoints continue periodically for non-extreme sections.

### Audio Design (Current Integration)

- `AudioManager` now pre-registers gameplay/UI SFX IDs for:
  - movement/player states: `jump`, `land_soft`, `land_hard`, `death`, `respawn`, `bounce`
  - progression: `checkpoint`, `collectible`, `level_complete`
  - obstacle/environment loops: `moving_platform`, `kill_brick_hum`, `spinning_bar`, `laser_charge`, `laser_fire`, `conveyor`
  - UI/countdown: `button_hover`, `button_click`, `countdown_tick`, `countdown_go`
- Settings menu supports:
  - Master Volume (0–100%)
  - Music Volume (0–100%)
  - SFX Volume (0–100%)
  - Mute All toggle
- Audio settings are persisted with `SaveManager` and applied on startup.

### Platform & Obstacle Spec Baseline

The design ranges below are now codified in `GAME_CONFIG.platformSpecs` and `GAME_CONFIG.obstacleSpecs` for generator/obstacle systems to consume.

- **Platform types**
  - Normal platforms: dominant share by difficulty (roughly 40–80% band).
  - Thin: width `0.5–1.0`, freq `5–15%`.
  - Moving (linear): speed `2–6`, travel `3–10`, freq `10–25%`.
  - Moving (circular): radius `3–8`, speed `0.5–2.0 rps`, freq `5–10%`.
  - Rotating: `10–60 deg/s`, freq `5–15%`.
  - Falling: trigger `0.5s`, warn `0.3–1.0s`, respawn `3–5s`.
  - Bounce: `1.5–3.0x` jump, freq `3–10%`.
  - Conveyor: speed `3–8`, freq `5–10%`.
  - Appearing: visible `1–3s`, hidden `1–3s`, freq `3–8%`.
  - Ice: friction multiplier `0.2`, primarily in ice theme.
- **Obstacle types**
  - Kill Brick: size `0.5–3.0`.
  - Spinning Bar: length `6–12`, speed `30–120 deg/s`.
  - Pendulum: diameter `2–4`, arc `90–180°`, period `2–5s`.
  - Crusher: width `3–6`, cycle `1–2s open / 0.5s crush / 0.5s retract`.
  - Laser: `1–3s on / 1–3s off`, warning `0.5s`.
  - Wind Zone: force `5–15`, size `3–8`.

### Solvability Validation Rules (Implemented Baseline)

`LevelGenerator` now runs a `Validator` pass and retries generation up to 10 attempts if rules fail.

- Horizontal gap cap: `≤ 8.1` units
- Upward gap cap: `≤ 3.25` units
- Downward gap cap: `≤ 20` units
- Sequence restrictions:
  - no falling → falling
  - no falling → appearing
  - no ice → thin
  - no bounce → falling
- Rest-area cadence validation: difficult mechanics are expected in windows of 5–8 before next rest platform

### Data Persistence (localStorage)

`SaveManager` now persists and restores these keys with corruption-safe parsing + default fallback:

- `obbyGame_settings`
- `obbyGame_stats`
- `obbyGame_bestRuns`
- `obbyGame_recentSeeds`
- `obbyGame_achievements`

Behavior:

- settings auto-save when changed in Settings menu
- best runs save on completion only if better than existing run
- stats can be incremented on death/collection/completion
- corrupted JSON is automatically discarded and replaced by defaults
- storage budget target is capped at ~1MB by pruning oldest recent seeds
- Settings menu includes **Reset All Data** with confirmation

### Achievements (Implemented Core)

Achievement definitions include icon + description and are persisted in `obbyGame_achievements`.
Current trigger wiring includes:

- `first_steps`, `speed_demon`, `speed_freak`, `collector`, `flawless`, `five_star`, `comeback_kid` on level completion
- `daily_player` when completing a daily seed (`daily-*`)
- `mountaineer` when unique completed seeds reach 10
- `dedicated` when total playtime reaches 1 hour
- `persistent` when total deaths reaches 100
- `shared_experience` when the player copies a seed

Unlocked achievements show a top-right toast popup for ~4 seconds.

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
=======
- Babylon is the default runtime (`src/game/BabylonGame.ts`) while legacy Three.js systems are still present for migration compatibility.
- Babylon runtime uses the **Rapier physics engine** (`@dimforge/rapier3d-compat`) as a required dependency for gameplay simulation.
- For subpath/static hosting, Vite is configured with `base: './'` so built assets resolve with relative URLs.


---

## 🤝 Contributing

1. Fork and clone the repo
2. Create a feature branch
3. Run checks (`npm run build`)
4. Open a PR with a clear summary + testing notes

---

## 📄 License

MIT License © 2026 Himanshu Kant Choursiya. See `LICENSE`.

