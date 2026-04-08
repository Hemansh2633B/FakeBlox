// game/generation.js — PRNG, config, themes, level generator
import * as THREE from 'three';

// ─── PRNG ───────────────────────────────────────────────
const MASK_64 = (1n << 64n) - 1n;
const GOLDEN_GAMMA_64 = 0x9E3779B97F4A7C15n;

export function hashString(str) {
  // 64-bit FNV-1a hash for stable string → long seed conversion.
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < str.length; i++) {
    h ^= BigInt(str.charCodeAt(i));
    h = (h * prime) & MASK_64;
  }
  return h;
}

function normalizeSeed(seed) {
  if (typeof seed === 'bigint') return BigInt.asUintN(64, seed);

  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return BigInt.asUintN(64, BigInt(Math.trunc(seed)));
  }

  if (typeof seed === 'string') {
    const raw = seed.trim();
    if (!raw) return hashString('default');
    // Accept signed integer strings as long seeds.
    if (/^[+-]?\d+$/.test(raw)) {
      try { return BigInt.asUintN(64, BigInt(raw)); } catch (e) {}
    }
    return hashString(raw);
  }

  return hashString('default');
}

function splitmix64(x) {
  let z = (x + GOLDEN_GAMMA_64) & MASK_64;
  z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK_64;
  z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK_64;
  return z ^ (z >> 31n);
}

export class SeededRNG {
  constructor(seed64) { this.state = normalizeSeed(seed64); }

  next() {
    // SplitMix64: deterministic 64-bit PRNG suitable for procedural generation.
    this.state = (this.state + GOLDEN_GAMMA_64) & MASK_64;
    const out = splitmix64(this.state);
    // Use top 53 bits to map to JS double in [0,1).
    return Number(out >> 11n) / 9007199254740992;
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
  return new SeededRNG(normalizeSeed(seed));
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
  plains: {
    name: 'Plains', emoji: '🌾',
    colors: [0x7CB342, 0x8BC34A, 0xC5E1A5, 0xA5D6A7],
    accent: 0xFDD835, sky: [0x90CAF9, 0xBBDEFB, 0xE3F2FD],
    fog: 0xA5D6A7, fogNear: 60, fogFar: 185,
    ambient: 0x9ad5a1, dirLight: 0xffffff, dirIntensity: 1.1,
    ground: 0x7CB342, particles: 'leaves',
  },
  sunflowerPlains: {
    name: 'Sunflower Plains', emoji: '🌻',
    colors: [0x9CCC65, 0xAED581, 0xDCE775, 0x8BC34A],
    accent: 0xFFCA28, sky: [0x81D4FA, 0xB3E5FC, 0xE1F5FE],
    fog: 0xC5E1A5, fogNear: 65, fogFar: 190,
    ambient: 0xb4de92, dirLight: 0xffffff, dirIntensity: 1.1,
    ground: 0x8BC34A, particles: 'petals',
  },
  forest: {
    name: 'Forest', emoji: '🌳',
    colors: [0x2E7D32, 0x388E3C, 0x4CAF50, 0x1B5E20],
    accent: 0x8D6E63, sky: [0x78909C, 0x90A4AE, 0xB0BEC5],
    fog: 0x5b7f60, fogNear: 40, fogFar: 145,
    ambient: 0x88b08a, dirLight: 0xE8F5E9, dirIntensity: 0.95,
    ground: 0x2E7D32, particles: 'leaves',
  },
  flowerForest: {
    name: 'Flower Forest', emoji: '🌸',
    colors: [0x66BB6A, 0x81C784, 0xF48FB1, 0xCE93D8],
    accent: 0xF06292, sky: [0x9FA8DA, 0xC5CAE9, 0xE8EAF6],
    fog: 0xB39DDB, fogNear: 50, fogFar: 165,
    ambient: 0xbbb0de, dirLight: 0xFFF1F8, dirIntensity: 1.0,
    ground: 0x66BB6A, particles: 'petals',
  },
  darkForest: {
    name: 'Dark Forest', emoji: '🌲',
    colors: [0x1B5E20, 0x2E7D32, 0x263238, 0x37474F],
    accent: 0x6D4C41, sky: [0x263238, 0x37474F, 0x455A64],
    fog: 0x2a3b33, fogNear: 30, fogFar: 120,
    ambient: 0x587066, dirLight: 0xCFD8DC, dirIntensity: 0.75,
    ground: 0x1B5E20, particles: 'leaves',
  },
  paleGarden: {
    name: 'Pale Garden', emoji: '🪻',
    colors: [0xCFD8DC, 0xECEFF1, 0xB0BEC5, 0xB39DDB],
    accent: 0xBA68C8, sky: [0xB3E5FC, 0xE1F5FE, 0xF3E5F5],
    fog: 0xCFD8DC, fogNear: 55, fogFar: 160,
    ambient: 0xc7d4de, dirLight: 0xF3E5F5, dirIntensity: 0.95,
    ground: 0xCFD8DC, particles: 'petals',
  },
  taiga: {
    name: 'Taiga', emoji: '🦊',
    colors: [0x33691E, 0x558B2F, 0x689F38, 0x5D4037],
    accent: 0x8D6E63, sky: [0x78909C, 0x90A4AE, 0xB0BEC5],
    fog: 0x6c7a6f, fogNear: 50, fogFar: 155,
    ambient: 0x8fa497, dirLight: 0xE0F2F1, dirIntensity: 0.9,
    ground: 0x4E6E3A, particles: 'leaves',
  },
  oldGrowthPineTaiga: {
    name: 'Old Growth Pine Taiga', emoji: '🌲',
    colors: [0x2E7D32, 0x33691E, 0x6D4C41, 0x8D6E63],
    accent: 0xA1887F, sky: [0x607D8B, 0x78909C, 0xB0BEC5],
    fog: 0x5b695f, fogNear: 42, fogFar: 140,
    ambient: 0x7d9587, dirLight: 0xECEFF1, dirIntensity: 0.85,
    ground: 0x3C5F2C, particles: 'leaves',
  },
  oldGrowthSpruceTaiga: {
    name: 'Old Growth Spruce Taiga', emoji: '🌲',
    colors: [0x1B5E20, 0x33691E, 0x455A64, 0x4E342E],
    accent: 0x8D6E63, sky: [0x455A64, 0x607D8B, 0x78909C],
    fog: 0x4c5e54, fogNear: 38, fogFar: 130,
    ambient: 0x70877b, dirLight: 0xCFD8DC, dirIntensity: 0.8,
    ground: 0x2E4E2A, particles: 'leaves',
  },
  desert: {
    name: 'Desert', emoji: '🏜️',
    colors: [0xD7B56D, 0xE6C78B, 0xC19A5B, 0xB0894F],
    accent: 0xFF8F00, sky: [0xFFD180, 0xFFE0B2, 0xFFF3E0],
    fog: 0xE6C78B, fogNear: 70, fogFar: 210,
    ambient: 0xd9c18d, dirLight: 0xFFF8E1, dirIntensity: 1.25,
    ground: 0xD7B56D, particles: 'dust',
  },
  jungle: {
    name: 'Jungle', emoji: '🌴',
    colors: [0x1B5E20, 0x2E7D32, 0x388E3C, 0x66BB6A],
    accent: 0x8BC34A, sky: [0x4DB6AC, 0x80CBC4, 0xB2DFDB],
    fog: 0x4f7f5a, fogNear: 35, fogFar: 125,
    ambient: 0x7ea98a, dirLight: 0xE8F5E9, dirIntensity: 0.9,
    ground: 0x2E7D32, particles: 'leaves',
  },
  sparseJungle: {
    name: 'Sparse Jungle', emoji: '🌿',
    colors: [0x2E7D32, 0x4CAF50, 0x81C784, 0xA5D6A7],
    accent: 0x8BC34A, sky: [0x81D4FA, 0xB3E5FC, 0xE1F5FE],
    fog: 0x81C784, fogNear: 50, fogFar: 165,
    ambient: 0x9ecfa3, dirLight: 0xF1F8E9, dirIntensity: 1.0,
    ground: 0x4CAF50, particles: 'leaves',
  },
  bambooJungle: {
    name: 'Bamboo Jungle', emoji: '🎋',
    colors: [0x558B2F, 0x7CB342, 0x9CCC65, 0xC5E1A5],
    accent: 0xCDDC39, sky: [0x80DEEA, 0xB2EBF2, 0xE0F7FA],
    fog: 0x9CCC65, fogNear: 45, fogFar: 150,
    ambient: 0xa8cf79, dirLight: 0xF9FBE7, dirIntensity: 0.95,
    ground: 0x7CB342, particles: 'leaves',
  },
  badlands: {
    name: 'Badlands', emoji: '🧱',
    colors: [0xBF6D3A, 0xD8894F, 0xA75A2A, 0xE0A15D],
    accent: 0xFFB300, sky: [0xFFAB91, 0xFFCCBC, 0xFBE9E7],
    fog: 0xD8894F, fogNear: 60, fogFar: 180,
    ambient: 0xcd8c5c, dirLight: 0xFFF3E0, dirIntensity: 1.15,
    ground: 0xBF6D3A, particles: 'dust',
  },
  erodedBadlands: {
    name: 'Eroded Badlands', emoji: '⛰️',
    colors: [0xA85B31, 0xC96F3B, 0x7A3E1F, 0xD08B5B],
    accent: 0xFFA726, sky: [0xFF8A65, 0xFFAB91, 0xFFCCBC],
    fog: 0xC96F3B, fogNear: 55, fogFar: 170,
    ambient: 0xb8784f, dirLight: 0xFFE0B2, dirIntensity: 1.1,
    ground: 0xA85B31, particles: 'dust',
  },
  windsweptHills: {
    name: 'Windswept Hills', emoji: '🌬️',
    colors: [0x7CB342, 0x9E9D24, 0x8D6E63, 0x607D8B],
    accent: 0xB0BEC5, sky: [0x90CAF9, 0xBBDEFB, 0xE3F2FD],
    fog: 0xB0BEC5, fogNear: 55, fogFar: 175,
    ambient: 0xacbfbe, dirLight: 0xF5F5F5, dirIntensity: 1.0,
    ground: 0x7E8D5F, particles: 'wind',
  },
  snowySlopes: {
    name: 'Snowy Slopes', emoji: '🏔️',
    colors: [0xCFD8DC, 0xECEFF1, 0xB0BEC5, 0x90A4AE],
    accent: 0x81D4FA, sky: [0xB3E5FC, 0xE1F5FE, 0xFFFFFF],
    fog: 0xCFD8DC, fogNear: 50, fogFar: 165,
    ambient: 0xc0d0d9, dirLight: 0xFFFFFF, dirIntensity: 1.05,
    ground: 0xCFD8DC, particles: 'snow',
  },
  jaggedPeaks: {
    name: 'Jagged Peaks', emoji: '🗻',
    colors: [0x90A4AE, 0x78909C, 0x607D8B, 0xCFD8DC],
    accent: 0x64B5F6, sky: [0x90CAF9, 0xBBDEFB, 0xE3F2FD],
    fog: 0xB0BEC5, fogNear: 45, fogFar: 150,
    ambient: 0xadbec9, dirLight: 0xECEFF1, dirIntensity: 0.95,
    ground: 0x78909C, particles: 'snow',
  },
  frozenPeaks: {
    name: 'Frozen Peaks', emoji: '❄️',
    colors: [0xE1F5FE, 0xB3E5FC, 0x81D4FA, 0x4FC3F7],
    accent: 0x039BE5, sky: [0xCFD8DC, 0xECEFF1, 0xFFFFFF],
    fog: 0xD6EAF5, fogNear: 48, fogFar: 155,
    ambient: 0xbcd6e8, dirLight: 0xE1F5FE, dirIntensity: 1.0,
    ground: 0xB3E5FC, particles: 'snow',
  },
  stonyPeaks: {
    name: 'Stony Peaks', emoji: '🪨',
    colors: [0x616161, 0x757575, 0x9E9E9E, 0xBDBDBD],
    accent: 0x90A4AE, sky: [0x78909C, 0x90A4AE, 0xB0BEC5],
    fog: 0x9E9E9E, fogNear: 42, fogFar: 145,
    ambient: 0x9ea7ad, dirLight: 0xECEFF1, dirIntensity: 0.9,
    ground: 0x757575, particles: 'dust',
  },
  snowyPlains: {
    name: 'Snowy Plains', emoji: '☃️',
    colors: [0xECEFF1, 0xCFD8DC, 0xE3F2FD, 0xB0BEC5],
    accent: 0x81D4FA, sky: [0xE1F5FE, 0xF5F5F5, 0xFFFFFF],
    fog: 0xECEFF1, fogNear: 60, fogFar: 185,
    ambient: 0xd7e1e5, dirLight: 0xFFFFFF, dirIntensity: 1.1,
    ground: 0xECEFF1, particles: 'snow',
  },
  iceSpikes: {
    name: 'Ice Spikes', emoji: '🧊',
    colors: [0xB3E5FC, 0x81D4FA, 0x4FC3F7, 0xE1F5FE],
    accent: 0x0288D1, sky: [0xCFD8DC, 0xECEFF1, 0xFFFFFF],
    fog: 0xB3E5FC, fogNear: 50, fogFar: 160,
    ambient: 0xb1d7e8, dirLight: 0xE1F5FE, dirIntensity: 1.05,
    ground: 0xB3E5FC, particles: 'snow',
  },
  frozenRiver: {
    name: 'Frozen River', emoji: '🧊',
    colors: [0xB3E5FC, 0x81D4FA, 0xCFD8DC, 0x90CAF9],
    accent: 0x039BE5, sky: [0xB3E5FC, 0xE1F5FE, 0xFFFFFF],
    fog: 0xCFEAF6, fogNear: 55, fogFar: 170,
    ambient: 0xb6d5e4, dirLight: 0xE3F2FD, dirIntensity: 1.0,
    ground: 0xB3E5FC, particles: 'snow',
  },
  snowyBeach: {
    name: 'Snowy Beach', emoji: '🏖️',
    colors: [0xECEFF1, 0xCFD8DC, 0xB0BEC5, 0x90A4AE],
    accent: 0x4FC3F7, sky: [0xB3E5FC, 0xE1F5FE, 0xFFFFFF],
    fog: 0xDCE6EB, fogNear: 58, fogFar: 175,
    ambient: 0xc7d9e1, dirLight: 0xF5F5F5, dirIntensity: 1.0,
    ground: 0xCFD8DC, particles: 'snow',
  },
  swamp: {
    name: 'Swamp', emoji: '🐸',
    colors: [0x556B2F, 0x6B8E23, 0x8F9A5A, 0x5D4037],
    accent: 0x8BC34A, sky: [0x78909C, 0x90A4AE, 0xB0BEC5],
    fog: 0x7f8b64, fogNear: 35, fogFar: 120,
    ambient: 0x8f9c78, dirLight: 0xE8F5E9, dirIntensity: 0.8,
    ground: 0x556B2F, particles: 'spores',
  },
  mangroveSwamp: {
    name: 'Mangrove Swamp', emoji: '🌱',
    colors: [0x2E7D32, 0x4E342E, 0x6D4C41, 0x689F38],
    accent: 0xFF7043, sky: [0x546E7A, 0x78909C, 0x90A4AE],
    fog: 0x5f6f57, fogNear: 30, fogFar: 110,
    ambient: 0x7d8f76, dirLight: 0xDCEDC8, dirIntensity: 0.78,
    ground: 0x4A5D31, particles: 'spores',
  },
  warmOcean: {
    name: 'Warm Ocean', emoji: '🐠',
    colors: [0x26C6DA, 0x4DD0E1, 0x80DEEA, 0x00ACC1],
    accent: 0xFFCA28, sky: [0x4FC3F7, 0x81D4FA, 0xB3E5FC],
    fog: 0x80DEEA, fogNear: 65, fogFar: 210,
    ambient: 0x8edee8, dirLight: 0xE1F5FE, dirIntensity: 1.0,
    ground: 0x26C6DA, particles: 'bubbles',
  },
  lukewarmOcean: {
    name: 'Lukewarm Ocean', emoji: '🌊',
    colors: [0x29B6F6, 0x4FC3F7, 0x81D4FA, 0x039BE5],
    accent: 0x00BCD4, sky: [0x64B5F6, 0x90CAF9, 0xBBDEFB],
    fog: 0x81D4FA, fogNear: 70, fogFar: 220,
    ambient: 0x95d2ea, dirLight: 0xE3F2FD, dirIntensity: 1.0,
    ground: 0x29B6F6, particles: 'bubbles',
  },
  coldOcean: {
    name: 'Cold Ocean', emoji: '🌊',
    colors: [0x42A5F5, 0x1E88E5, 0x1565C0, 0x90CAF9],
    accent: 0xB3E5FC, sky: [0x90CAF9, 0xBBDEFB, 0xE3F2FD],
    fog: 0x90CAF9, fogNear: 68, fogFar: 205,
    ambient: 0x9ec5e8, dirLight: 0xE3F2FD, dirIntensity: 0.95,
    ground: 0x1E88E5, particles: 'bubbles',
  },
  frozenOcean: {
    name: 'Frozen Ocean', emoji: '🧊',
    colors: [0xB3E5FC, 0x81D4FA, 0x4FC3F7, 0xE1F5FE],
    accent: 0x0288D1, sky: [0xCFD8DC, 0xECEFF1, 0xFFFFFF],
    fog: 0xC3E4F3, fogNear: 62, fogFar: 195,
    ambient: 0xb8d5e6, dirLight: 0xE1F5FE, dirIntensity: 0.98,
    ground: 0x81D4FA, particles: 'snow',
  },
  deepOcean: {
    name: 'Deep Ocean', emoji: '🌌',
    colors: [0x0D47A1, 0x1565C0, 0x1E88E5, 0x263238],
    accent: 0x26C6DA, sky: [0x1A237E, 0x283593, 0x303F9F],
    fog: 0x1A237E, fogNear: 55, fogFar: 170,
    ambient: 0x5a74a5, dirLight: 0x90CAF9, dirIntensity: 0.72,
    ground: 0x0D47A1, particles: 'bubbles',
  },
  mushroomFields: {
    name: 'Mushroom Fields', emoji: '🍄',
    colors: [0x9575CD, 0xBA68C8, 0xEF5350, 0x7986CB],
    accent: 0xF06292, sky: [0xB39DDB, 0xD1C4E9, 0xEDE7F6],
    fog: 0xC5B5E5, fogNear: 55, fogFar: 170,
    ambient: 0xc1aedf, dirLight: 0xF3E5F5, dirIntensity: 0.95,
    ground: 0x9575CD, particles: 'spores',
  },
  meadow: {
    name: 'Meadow', emoji: '🌼',
    colors: [0x8BC34A, 0x9CCC65, 0xAED581, 0xDCE775],
    accent: 0xFDD835, sky: [0x90CAF9, 0xBBDEFB, 0xE3F2FD],
    fog: 0xAED581, fogNear: 62, fogFar: 185,
    ambient: 0xb8d889, dirLight: 0xFFFFFF, dirIntensity: 1.05,
    ground: 0x9CCC65, particles: 'petals',
  },
  cherryGrove: {
    name: 'Cherry Grove', emoji: '🌸',
    colors: [0xF48FB1, 0xF8BBD0, 0xCE93D8, 0x81C784],
    accent: 0xEC407A, sky: [0xB39DDB, 0xD1C4E9, 0xF3E5F5],
    fog: 0xE1BEE7, fogNear: 58, fogFar: 175,
    ambient: 0xd6bedf, dirLight: 0xFFF1F8, dirIntensity: 1.0,
    ground: 0x81C784, particles: 'petals',
  },
  lushCaves: {
    name: 'Lush Caves', emoji: '🪴',
    colors: [0x2E7D32, 0x4CAF50, 0x66BB6A, 0x26A69A],
    accent: 0x80CBC4, sky: [0x37474F, 0x455A64, 0x546E7A],
    fog: 0x3f6f62, fogNear: 25, fogFar: 95,
    ambient: 0x779d92, dirLight: 0xA7FFEB, dirIntensity: 0.65,
    ground: 0x2E7D32, particles: 'spores',
  },
  dripstoneCaves: {
    name: 'Dripstone Caves', emoji: '🪨',
    colors: [0x8D6E63, 0x6D4C41, 0x5D4037, 0xA1887F],
    accent: 0xFF8A65, sky: [0x3E2723, 0x4E342E, 0x5D4037],
    fog: 0x5D4037, fogNear: 22, fogFar: 90,
    ambient: 0x7f665e, dirLight: 0xFFCCBC, dirIntensity: 0.6,
    ground: 0x6D4C41, particles: 'drips',
  },
  deepDark: {
    name: 'Deep Dark', emoji: '🕳️',
    colors: [0x263238, 0x37474F, 0x102027, 0x00ACC1],
    accent: 0x26C6DA, sky: [0x000000, 0x0B1A20, 0x102027],
    fog: 0x081116, fogNear: 18, fogFar: 80,
    ambient: 0x3c5b63, dirLight: 0x4DD0E1, dirIntensity: 0.48,
    ground: 0x1c2c31, particles: 'sculk',
  },
  netherWastes: {
    name: 'Nether Wastes', emoji: '🔥',
    colors: [0x5D4037, 0x6D4C41, 0x8D6E63, 0xBF360C],
    accent: 0xFF5722, sky: [0x3E2723, 0x4A1500, 0x2D1100],
    fog: 0x3a1a14, fogNear: 30, fogFar: 120,
    ambient: 0x6a4b42, dirLight: 0xFF8A65, dirIntensity: 0.8,
    ground: 0x4E342E, particles: 'embers',
  },
  crimsonForest: {
    name: 'Crimson Forest', emoji: '🩸',
    colors: [0xB71C1C, 0xC62828, 0xD32F2F, 0x4E342E],
    accent: 0xFF7043, sky: [0x3E2723, 0x5D1A1A, 0x2D0F0F],
    fog: 0x4a1717, fogNear: 28, fogFar: 110,
    ambient: 0x7d4f50, dirLight: 0xFF8A80, dirIntensity: 0.75,
    ground: 0x6D1B1B, particles: 'embers',
  },
  warpedForest: {
    name: 'Warped Forest', emoji: '💠',
    colors: [0x006064, 0x00838F, 0x0097A7, 0x26C6DA],
    accent: 0x80DEEA, sky: [0x102027, 0x00363A, 0x004D40],
    fog: 0x0d3a3d, fogNear: 30, fogFar: 115,
    ambient: 0x4d8d90, dirLight: 0x80DEEA, dirIntensity: 0.78,
    ground: 0x006064, particles: 'souls',
  },
  soulSandValley: {
    name: 'Soul Sand Valley', emoji: '💀',
    colors: [0x5D4037, 0x6D4C41, 0x455A64, 0x90A4AE],
    accent: 0x4FC3F7, sky: [0x102027, 0x263238, 0x37474F],
    fog: 0x2b3a40, fogNear: 26, fogFar: 100,
    ambient: 0x687d86, dirLight: 0x81D4FA, dirIntensity: 0.7,
    ground: 0x5D4037, particles: 'souls',
  },
  basaltDeltas: {
    name: 'Basalt Deltas', emoji: '🌋',
    colors: [0x424242, 0x616161, 0x757575, 0x212121],
    accent: 0xFF6D00, sky: [0x1C1C1C, 0x2D1100, 0x1A0A00],
    fog: 0x2f2f2f, fogNear: 24, fogFar: 95,
    ambient: 0x727272, dirLight: 0xFFAB91, dirIntensity: 0.68,
    ground: 0x424242, particles: 'embers',
  },
  theEnd: {
    name: 'The End', emoji: '⚫',
    colors: [0xC0CA33, 0x9E9D24, 0x827717, 0x263238],
    accent: 0xDCE775, sky: [0x111111, 0x1E1E1E, 0x2C2C2C],
    fog: 0x252525, fogNear: 50, fogFar: 170,
    ambient: 0x6f7466, dirLight: 0xE6EE9C, dirIntensity: 0.72,
    ground: 0x9E9D24, particles: 'ender',
  },
  endHighlands: {
    name: 'End Highlands', emoji: '🪐',
    colors: [0xC0CA33, 0xD4E157, 0x9E9D24, 0x5D4037],
    accent: 0xE6EE9C, sky: [0x111111, 0x202020, 0x2B2B2B],
    fog: 0x303030, fogNear: 52, fogFar: 175,
    ambient: 0x7b806f, dirLight: 0xF0F4C3, dirIntensity: 0.74,
    ground: 0xAFB42B, particles: 'ender',
  },
  endMidlands: {
    name: 'End Midlands', emoji: '🛰️',
    colors: [0xAFB42B, 0xC0CA33, 0x9E9D24, 0x6D4C41],
    accent: 0xDCE775, sky: [0x151515, 0x232323, 0x303030],
    fog: 0x323232, fogNear: 50, fogFar: 170,
    ambient: 0x76796d, dirLight: 0xE6EE9C, dirIntensity: 0.72,
    ground: 0xA4AE2A, particles: 'ender',
  },
  endBarrens: {
    name: 'End Barrens', emoji: '🌑',
    colors: [0x9E9D24, 0x827717, 0x6D4C41, 0x424242],
    accent: 0xC0CA33, sky: [0x0F0F0F, 0x1A1A1A, 0x242424],
    fog: 0x292929, fogNear: 48, fogFar: 165,
    ambient: 0x696a60, dirLight: 0xDCE775, dirIntensity: 0.68,
    ground: 0x8C8C23, particles: 'ender',
  },
  endSmallIslands: {
    name: 'End Small Islands', emoji: '🌘',
    colors: [0xD4E157, 0xC0CA33, 0x9E9D24, 0x455A64],
    accent: 0xE6EE9C, sky: [0x101010, 0x1A1A1A, 0x262626],
    fog: 0x2d2d2d, fogNear: 54, fogFar: 180,
    ambient: 0x7b7f70, dirLight: 0xF0F4C3, dirIntensity: 0.7,
    ground: 0xC0CA33, particles: 'ender',
  },
};

export const THEME_KEYS = Object.keys(THEMES);
export const MAX_BIOMES_PER_RUN = 15;

// ─── LEVEL GENERATOR ────────────────────────────────────
export class LevelGenerator {
  generate(seed, difficulty, endless = false) {
    const rng = createRNG(seed);
    const cfg = CONFIG.gen[difficulty] || CONFIG.gen.normal;
    const totalPlatforms = endless ? 200 : cfg.count;
    const biomeRoute = this.createBiomeRoute(rng, totalPlatforms, endless);
    const sectionSize = Math.ceil(totalPlatforms / biomeRoute.length);
    const platforms = [];
    const obstacles = [];
    const collectibles = [];
    const checkpoints = [];
    const vines = [];
    let hillMomentum = 0;
    let hillSteps = 0;

    let pos = new THREE.Vector3(0, 0, 0);
    let prevPos = pos.clone();
    platforms.push({
      pos: pos.clone(), size: new THREE.Vector3(6, 1, 6),
      type: 'static', theme: biomeRoute[0], rotation: 0,
      isSpawn: true, isCheckpoint: true, index: 0,
    });
    checkpoints.push(0);

    for (let i = 1; i < totalPlatforms; i++) {
      const progress = i / totalPlatforms;
      const sectionIdx = Math.min(Math.floor(i / sectionSize), biomeRoute.length - 1);
      const themeKey = biomeRoute[sectionIdx];
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
      if (hillSteps <= 0 && !isRestArea && !isCheckpointPlatform && rng.chance(0.18)) {
        hillSteps = rng.nextInt(3, 7);
        hillMomentum = rng.nextFloat(0.8, 1.45);
      }
      let hillBoost = 0;
      if (hillSteps > 0) {
        const progressInHill = 1 - (hillSteps / 7);
        hillBoost = Math.sin(progressInHill * Math.PI) * hillMomentum;
        hillSteps--;
      }
      const rollingTerrain = Math.sin((i / Math.max(1, totalPlatforms - 1)) * Math.PI * 2) * 0.4;
      const heightOff = rng.nextFloat(-2, Math.min(3, 1 + diffMul * 2)) + rollingTerrain + hillBoost;
      const clampedHeight = Math.min(heightOff, 3.0);
      const clampedGap = Math.min(gap, 8.0);

      prevPos.copy(pos);
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

      const climbDelta = pos.y - prevPos.y;
      if (climbDelta > 1.25 && rng.chance(0.85)) {
        const baseY = prevPos.y + 0.2;
        const vineHeight = Math.min(7, climbDelta + rng.nextFloat(1.2, 2.8));
        const sideOffset = rng.chance(0.5) ? -1 : 1;
        vines.push({
          pos: new THREE.Vector3(
            pos.x + sideOffset * (w * 0.35),
            baseY + vineHeight / 2,
            pos.z - d * 0.2
          ),
          height: vineHeight,
          theme: themeKey,
        });
      }

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
      type: 'finish', theme: biomeRoute[biomeRoute.length - 1],
      rotation: 0, isFinish: true, index: platforms.length,
      color: 0xFFD700,
    });

    return { platforms, obstacles, collectibles, checkpoints, themes: biomeRoute, vines };
  }

  createBiomeRoute(rng, totalPlatforms, endless) {
    const climateBiomes = [
      { key: 'desert', temp: 0.95, moisture: 0.15, weight: 1.1 },
      { key: 'badlands', temp: 0.9, moisture: 0.2, weight: 0.95 },
      { key: 'lava', temp: 1.0, moisture: 0.05, weight: 0.7 },
      { key: 'grasslands', temp: 0.62, moisture: 0.55, weight: 1.0 },
      { key: 'forest', temp: 0.56, moisture: 0.75, weight: 1.05 },
      { key: 'jungle', temp: 0.85, moisture: 0.9, weight: 0.8 },
      { key: 'swamp', temp: 0.7, moisture: 0.92, weight: 0.85 },
      { key: 'oceanic', temp: 0.55, moisture: 0.95, weight: 0.9 },
      { key: 'mushroom', temp: 0.52, moisture: 0.82, weight: 0.65 },
      { key: 'taiga', temp: 0.28, moisture: 0.6, weight: 0.8 },
      { key: 'ice', temp: 0.08, moisture: 0.5, weight: 0.9 },
      { key: 'dark_forest', temp: 0.38, moisture: 0.82, weight: 0.75 },
      { key: 'factory', temp: 0.45, moisture: 0.35, weight: 0.7 },
      { key: 'space', temp: 0.15, moisture: 0.1, weight: 0.6 },
      { key: 'neon', temp: 0.7, moisture: 0.45, weight: 0.65 },
    ];
    const sections = Math.min(
      MAX_BIOMES_PER_RUN,
      Math.max(6, Math.ceil(totalPlatforms / (endless ? 16 : 10)))
    );
    const route = [];
    let temp = rng.next();
    let moisture = rng.next();
    let last = null;
    for (let i = 0; i < sections; i++) {
      const continentalness = Math.sin((i / sections) * Math.PI * 2 + rng.nextFloat(-0.25, 0.25)) * 0.08;
      temp = THREE.MathUtils.clamp(temp + rng.nextFloat(-0.18, 0.18) + continentalness, 0, 1);
      moisture = THREE.MathUtils.clamp(moisture + rng.nextFloat(-0.2, 0.2) - continentalness * 0.6, 0, 1);

      const sorted = climateBiomes
        .map(b => {
          const dTemp = b.temp - temp;
          const dMoist = b.moisture - moisture;
          const dist = Math.hypot(dTemp, dMoist);
          const repeatPenalty = b.key === last ? 0.4 : 0;
          return { key: b.key, weight: (1 / (0.25 + dist)) * b.weight - repeatPenalty };
        })
        .sort((a, b) => b.weight - a.weight);
      const topChoices = sorted.slice(0, 3).map((c, idx) => ({ value: c.key, weight: Math.max(0.01, c.weight - idx * 0.2) }));
      const picked = rng.weightedPick(topChoices);
      route.push(picked);
      last = picked;
    }
    return route;
  }
}
