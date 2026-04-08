// game/generation.js — PRNG, config, themes, level generator
import * as THREE from 'three';

// ─── PRNG ───────────────────────────────────────────────
export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class SeededRNG {
  constructor(seed) { this.state = seed | 0; }

  next() {
    this.state |= 0;
    this.state = this.state + 0x6D2B79F5 | 0;
    let t = Math.imul(this.state ^ this.state >>> 15, 1 | this.state);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  nextFloat(min, max) { return this.next() * (max - min) + min; }
  nextInt(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[this.nextInt(0, arr.length - 1)]; }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  weightedPick(opts) {
    const total = opts.reduce((s, o) => s + o.weight, 0);
    let r = this.next() * total;
    for (const o of opts) { r -= o.weight; if (r <= 0) return o.value; }
    return opts[opts.length - 1].value;
  }
}

export function createRNG(seed) {
  const n = typeof seed === 'string' ? hashString(seed || 'default') : seed >>> 0;
  return new SeededRNG(n);
}

// ─── CONFIG ─────────────────────────────────────────────
export const CONFIG = {
  player: {
    walkSpeed: 16, sprintSpeed: 24, acceleration: 80, deceleration: 60,
    airControl: 0.65, jumpForce: 14.5, gravity: -32, fallGravMul: 1.6,
    maxFall: -50, coyoteTime: 0.12, jumpBuffer: 0.1, varJumpMin: 0.55,
    radius: 0.4, height: 1.8, groundCheck: 0.15,
    invincTime: 1.5, deathTime: 1.0,
  },
  camera: {
    dist: 12, minDist: 4, maxDist: 22, height: 4.5, lookAhead: 2,
    smooth: 0.08, collPad: 0.3, vMin: 5, vMax: 80, sensitivity: 0.003, zoom: 1.5,
  },
  gen: {
    easy: { count: 40, minW: 3, maxGap: 4, movePct: 0.1, obsDensity: 1, cpInterval: 7 },
    normal: { count: 65, minW: 1.8, maxGap: 6, movePct: 0.25, obsDensity: 3, cpInterval: 9 },
    hard: { count: 90, minW: 1.2, maxGap: 7.5, movePct: 0.4, obsDensity: 5, cpInterval: 12 },
    extreme: { count: 120, minW: 0.9, maxGap: 8.5, movePct: 0.5, obsDensity: 7, cpInterval: 18 },
  },
  scoring: {
    base: 10000, maxTimeBonus: 5000, timePer: 3000,
    deathPen: 100, maxCollect: 3000, stars: [0, 8000, 12000, 15000, 17000],
  },
};

// ─── THEMES ─────────────────────────────────────────────
export const THEMES = {
  grasslands: {
    name: 'Grasslands', emoji: '🌿',
    colors: [0x4CAF50, 0x66BB6A, 0x81C784, 0x388E3C],
    accent: 0x795548, sky: [0x87CEEB, 0xB3E5FC, 0xE1F5FE],
    fog: 0x87CEEB, fogNear: 60, fogFar: 180,
    ambient: 0x8ecae6, dirLight: 0xffffff, dirIntensity: 1.2,
    ground: 0x4CAF50, particles: 'leaves',
  },
  lava: {
    name: 'Lava Zone', emoji: '🌋',
    colors: [0x616161, 0x757575, 0x424242, 0x9E9E9E],
    accent: 0xFF5722, sky: [0x1A0A00, 0x4A1500, 0x2D1100],
    fog: 0x2D1100, fogNear: 40, fogFar: 140,
    ambient: 0x442200, dirLight: 0xFF8A65, dirIntensity: 0.9,
    ground: 0x330000, particles: 'embers',
  },
  ice: {
    name: 'Ice World', emoji: '❄️',
    colors: [0xB3E5FC, 0xE1F5FE, 0x81D4FA, 0x4FC3F7],
    accent: 0x0288D1, sky: [0xCFD8DC, 0xECEFF1, 0xFFFFFF],
    fog: 0xCFD8DC, fogNear: 50, fogFar: 160,
    ambient: 0xb0c4de, dirLight: 0xE3F2FD, dirIntensity: 1.0,
    ground: 0xB3E5FC, particles: 'snow',
  },
  space: {
    name: 'Space', emoji: '🌌',
    colors: [0x7C4DFF, 0x651FFF, 0xB388FF, 0xD1C4E9],
    accent: 0x00BCD4, sky: [0x000011, 0x0D0033, 0x050022],
    fog: 0x050011, fogNear: 80, fogFar: 250,
    ambient: 0x220044, dirLight: 0xB388FF, dirIntensity: 0.7,
    ground: 0x110022, particles: 'stars',
  },
  factory: {
    name: 'Factory', emoji: '🏭',
    colors: [0x9E9E9E, 0xBDBDBD, 0x757575, 0xEEEEEE],
    accent: 0xFFC107, sky: [0x455A64, 0x607D8B, 0x78909C],
    fog: 0x455A64, fogNear: 45, fogFar: 150,
    ambient: 0x607d8b, dirLight: 0xFFECB3, dirIntensity: 0.9,
    ground: 0x424242, particles: 'sparks',
  },
  neon: {
    name: 'Neon', emoji: '🌈',
    colors: [0xFF00FF, 0x00FFFF, 0xFFFF00, 0x00FF00, 0xFF4444],
    accent: 0xFFFFFF, sky: [0x0D0D0D, 0x1A0033, 0x0D0D0D],
    fog: 0x0A0A0A, fogNear: 60, fogFar: 200,
    ambient: 0x220033, dirLight: 0xEA80FC, dirIntensity: 0.8,
    ground: 0x110011, particles: 'neonOrbs',
  },
};

export const THEME_KEYS = Object.keys(THEMES);

// ─── LEVEL GENERATOR ────────────────────────────────────
export class LevelGenerator {
  generate(seed, difficulty, endless = false) {
    const rng = createRNG(seed);
    const cfg = CONFIG.gen[difficulty] || CONFIG.gen.normal;
    const totalPlatforms = endless ? 200 : cfg.count;
    const shuffledThemes = rng.shuffle([...THEME_KEYS]);
    const sectionSize = Math.ceil(totalPlatforms / shuffledThemes.length);
    const platforms = [];
    const obstacles = [];
    const collectibles = [];
    const checkpoints = [];

    let pos = new THREE.Vector3(0, 0, 0);
    platforms.push({
      pos: pos.clone(), size: new THREE.Vector3(6, 1, 6),
      type: 'static', theme: shuffledThemes[0], rotation: 0,
      isSpawn: true, isCheckpoint: true, index: 0,
    });
    checkpoints.push(0);

    for (let i = 1; i < totalPlatforms; i++) {
      const progress = i / totalPlatforms;
      const sectionIdx = Math.min(Math.floor(i / sectionSize), shuffledThemes.length - 1);
      const themeKey = shuffledThemes[sectionIdx];
      const theme = THEMES[themeKey];
      const diffMul = 0.3 + progress * 0.7;
      const isRestArea = (i % cfg.cpInterval === 0) || (i % Math.max(5, Math.floor(6 + rng.next() * 3)) === 0 && rng.chance(0.3));
      const isCheckpointPlatform = (i % cfg.cpInterval === 0) || i === totalPlatforms - 1;

      let w, d;
      if (isRestArea || isCheckpointPlatform) {
        w = rng.nextFloat(4, 6);
        d = rng.nextFloat(4, 6);
      } else {
        w = rng.nextFloat(cfg.minW, Math.max(cfg.minW + 0.5, 5 - diffMul * 3));
        d = rng.nextFloat(cfg.minW, Math.max(cfg.minW + 0.5, 4 - diffMul * 2));
      }

      const maxGap = Math.min(cfg.maxGap, 2 + diffMul * (cfg.maxGap - 2));
      const gap = rng.nextFloat(2, maxGap);
      const lateralOff = rng.nextFloat(-3, 3);
      const heightOff = rng.nextFloat(-2, Math.min(3, 1 + diffMul * 2));
      const clampedHeight = Math.min(heightOff, 3.0);
      const clampedGap = Math.min(gap, 8.0);

      pos = new THREE.Vector3(
        pos.x + lateralOff,
        Math.max(pos.y + clampedHeight, -5),
        pos.z + clampedGap + w / 2
      );

      let platType = 'static';
      if (!isRestArea && !isCheckpointPlatform && i > 5) {
        platType = rng.weightedPick([
          { value: 'static', weight: 60 - diffMul * 30 },
          { value: 'moving', weight: cfg.movePct * 100 * diffMul },
          { value: 'falling', weight: 5 + diffMul * 10 },
          { value: 'bouncy', weight: 5 + diffMul * 5 },
          { value: 'rotating', weight: 3 + diffMul * 8 },
          { value: 'conveyor', weight: themeKey === 'factory' ? 15 : 3 },
          { value: 'appearing', weight: 2 + diffMul * 8 },
          { value: 'ice', weight: themeKey === 'ice' ? 30 : 0 },
        ]);
      }

      const moveData = {};
      if (platType === 'moving') {
        const mDir = rng.pick(['x', 'y', 'z']);
        const mDist = rng.nextFloat(2, 6);
        const mSpeed = rng.nextFloat(1.5, 4);
        moveData.axis = mDir; moveData.dist = mDist; moveData.speed = mSpeed;
        moveData.phase = rng.nextFloat(0, Math.PI * 2);
      }
      if (platType === 'rotating') {
        moveData.rotSpeed = rng.nextFloat(0.3, 1.5) * (rng.chance(0.5) ? 1 : -1);
      }
      if (platType === 'conveyor') {
        moveData.convDir = rng.pick(['x', '-x', 'z', '-z']);
        moveData.convSpeed = rng.nextFloat(2, 5);
      }
      if (platType === 'appearing') {
        moveData.onTime = rng.nextFloat(1.5, 3);
        moveData.offTime = rng.nextFloat(1, 2.5);
        moveData.phase = rng.nextFloat(0, moveData.onTime + moveData.offTime);
      }

      const plat = {
        pos: pos.clone(), size: new THREE.Vector3(w, 0.8, d),
        type: platType, theme: themeKey, rotation: rng.nextFloat(0, 0.1),
        isCheckpoint: isCheckpointPlatform, isRestArea, index: i,
        moveData, color: rng.pick(theme.colors),
      };
      platforms.push(plat);
      if (isCheckpointPlatform) checkpoints.push(i);

      if (!isRestArea && !isCheckpointPlatform && i > 8) {
        const obsChance = (cfg.obsDensity / 10) * diffMul;
        if (rng.chance(obsChance)) {
          const obsType = rng.weightedPick([
            { value: 'killBrick', weight: 30 },
            { value: 'spinBar', weight: 20 },
            { value: 'laser', weight: 15 + diffMul * 10 },
            { value: 'pendulum', weight: 10 },
            { value: 'crusher', weight: 5 + diffMul * 10 },
            { value: 'windZone', weight: 5 },
          ]);
          const obs = {
            type: obsType, platIndex: i,
            pos: new THREE.Vector3(
              pos.x + rng.nextFloat(-w / 3, w / 3),
              pos.y + 0.8,
              pos.z + rng.nextFloat(-d / 3, d / 3)
            ),
            speed: rng.nextFloat(1, 3),
            phase: rng.nextFloat(0, Math.PI * 2),
            size: obsType === 'killBrick' ? rng.nextFloat(0.5, 1.5) : rng.nextFloat(3, 7),
          };
          obstacles.push(obs);
        }
      }

      if (rng.chance(0.6)) {
        const starPos = pos.clone();
        starPos.y += 1.5 + rng.nextFloat(0, 1);
        starPos.x += rng.nextFloat(-w / 3, w / 3);
        starPos.z += rng.nextFloat(-d / 3, d / 3);
        collectibles.push({ pos: starPos, collected: false, index: collectibles.length });
      }
    }

    const lastPlat = platforms[platforms.length - 1];
    const finishPos = new THREE.Vector3(lastPlat.pos.x, lastPlat.pos.y, lastPlat.pos.z + 8);
    platforms.push({
      pos: finishPos, size: new THREE.Vector3(8, 1, 8),
      type: 'finish', theme: shuffledThemes[shuffledThemes.length - 1],
      rotation: 0, isFinish: true, index: platforms.length,
      color: 0xFFD700,
    });

    return { platforms, obstacles, collectibles, checkpoints, themes: shuffledThemes };
  }
}
