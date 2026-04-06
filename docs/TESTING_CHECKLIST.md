# 🧪 FakeBlox Testing & Quality Checklist

This document tracks the requested quality gates for FakeBlox.

## How to Use

- Mark items as completed once validated.
- For manual checks, include browser/device + date in PR notes.
- For automated checks, include exact command + output summary.

---

## 1) Seed Determinism Testing

- [ ] Generate level with seed `test123`, record platform positions.
- [ ] Refresh + regenerate same seed; verify identical platform positions.
- [ ] Chrome / Firefox / Safari determinism parity.
- [ ] 100 different seeds produce unique levels.
- [ ] Edge-case seeds tested: empty, single-char, long string, special chars, unicode, emoji.
- [ ] Numeric seeds tested: `0`, `1`, `-1`, `MAX_INT`, `MIN_INT`.

## 2) Solvability Testing

- [ ] 100 random seeds per difficulty pass validator.
- [ ] Manual playtest 10 seeds per difficulty; all completable.
- [ ] No jump exceeds player movement capability.
- [ ] Moving-platform timing windows are reachable.

## 3) Player Controller Testing

- [ ] Jump height ~= 3.75 units.
- [ ] Sprint jump distance ~= 9.6 units.
- [ ] Coyote time works (~120ms).
- [ ] Jump buffering works (~100ms).
- [ ] Variable jump height works.
- [ ] No clipping / infinite-jump exploits.
- [ ] Slope behavior validated (<=45° walkable).

## 4) Camera Testing

- [ ] No clipping during normal play.
- [ ] Smooth follow, no jitter.
- [ ] Tight-space behavior is acceptable.
- [ ] 360° horizontal + clamped vertical angles.
- [ ] Zoom range constraints respected.

## 5) Performance Testing

- [ ] 60 FPS at Normal (65 platforms).
- [ ] 60 FPS at Extreme (120 platforms).
- [ ] Stable during particles / transitions.
- [ ] No memory leak over 30 minutes.
- [ ] Generation under 2s.
- [ ] Initial load under 5s (Lighthouse).
- [ ] Bundle size < 2MB compressed JS+CSS.
- [ ] Total assets < 50MB.

## 6) Gameplay Systems Testing

- [ ] Timer starts on first movement.
- [ ] Timer stops on completion.
- [ ] Timer format `MM:SS.mmm`.
- [ ] Death counter increments correctly.
- [ ] Checkpoint activation feedback (audio + visual).
- [ ] Respawn at last checkpoint.
- [ ] Collectible pickup + HUD updates.
- [ ] Collected stars persist through death.
- [ ] Score + star rating are correct.
- [ ] Best times persist to localStorage.
- [ ] Settings/statistics save and load.

## 7) UI Testing

- [ ] Menus render and are interactive.
- [ ] HUD does not obstruct gameplay.
- [ ] Pause/resume behavior works.
- [ ] End screen shows correct stats.
- [ ] Seed display + copy works.
- [ ] Achievement notifications behave correctly.
- [ ] Responsive layouts (360px to 4K).
- [ ] Touch controls usable on mobile.
- [ ] No overlap artifacts.

## 8) Audio Testing

- [ ] SFX trigger correctly.
- [ ] No clipping/distortion.
- [ ] Music loops cleanly.
- [ ] Volume controls + mute work.
- [ ] Spatial attenuation works.
- [ ] Theme crossfades are smooth.
- [ ] iOS Safari autoplay policy handled.

## 9) Cross-Browser Testing

- [ ] Chrome desktop
- [ ] Firefox desktop
- [ ] Safari desktop
- [ ] Edge desktop
- [ ] Chrome Android (touch)
- [ ] Safari iOS (touch)
- [ ] Pointer lock works on desktop targets.
- [ ] WebGL context creation succeeds on all targets.
- [ ] Audio policy behavior validated per browser.

---

## Automated Baseline Runbook

Use this baseline in CI/local before broader manual validation:

```bash
npm install
npm run build
```

Recommended optional checks:

```bash
npm run dev
```

---

## Current Status

- ✅ Build/typecheck baseline is in place via `npm run build`.
- ⚠️ Most checklist items remain manual validation tasks and should be tracked per release candidate.
