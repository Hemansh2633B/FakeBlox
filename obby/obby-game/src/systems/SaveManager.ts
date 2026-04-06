import type { Difficulty, GameMode, RunData, SettingsData } from '../utils/types';

export interface BestRunEntry extends RunData {
  seed: string;
  mode: GameMode;
}

export interface SaveSettings extends SettingsData {}

export interface SaveProfileStats {
  totalRuns: number;
  totalWins: number;
  totalDeaths: number;
  totalStarsCollected: number;
  totalPlayTimeMs: number;
  bestScore: number;
}

export interface SaveData {
  version: number;
  selectedSeed: string;
  lastDifficulty: Difficulty;
  lastMode: GameMode;
  settings: SaveSettings;
  stats: SaveProfileStats;
  bestRuns: Partial<Record<Difficulty, BestRunEntry>>;
  recentRuns: BestRunEntry[];
  unlockedAchievements: string[];
  daily: {
    lastSeed: string;
    lastPlayedDay: string;
    bestRun?: BestRunEntry;
  };
}

export interface RecordRunInput {
  seed: string;
  difficulty: Difficulty;
  mode: GameMode;
  run: RunData;
}

export const STORAGE_KEY = 'obby.save.v1';
const MAX_RECENT_RUNS = 20;

export const DEFAULT_SETTINGS: SaveSettings = {
  masterVolume: 1,
  musicVolume: 0.7,
  sfxVolume: 0.85,
  voiceVolume: 0.8,
  voiceEnabled: true,
  mouseSensitivity: 1,
  graphicsQuality: 'high',
  showTimer: true,
  showDeathCounter: true,
  reduceMotion: false,
  highContrast: false,
  cameraInvertY: false,
  characterColors: {
    head: '#ffd7b5',
    torso: '#4f8cff',
    arms: '#ffd7b5',
    legs: '#2f3f56',
  },
};

export const DEFAULT_SAVE_DATA: SaveData = {
  version: 1,
  selectedSeed: '',
  lastDifficulty: 'normal',
  lastMode: 'seeded',
  settings: { ...DEFAULT_SETTINGS, characterColors: { ...DEFAULT_SETTINGS.characterColors } },
  stats: {
    totalRuns: 0,
    totalWins: 0,
    totalDeaths: 0,
    totalStarsCollected: 0,
    totalPlayTimeMs: 0,
    bestScore: 0,
  },
  bestRuns: {},
  recentRuns: [],
  unlockedAchievements: [],
  daily: {
    lastSeed: '',
    lastPlayedDay: '',
  },
};

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard', 'extreme'];
const MODES: GameMode[] = ['seeded', 'daily', 'endless'];

function canUseStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function cloneDefaults(): SaveData {
  return {
    ...DEFAULT_SAVE_DATA,
    settings: {
      ...DEFAULT_SETTINGS,
      characterColors: { ...DEFAULT_SETTINGS.characterColors },
    },
    stats: { ...DEFAULT_SAVE_DATA.stats },
    bestRuns: {},
    recentRuns: [],
    unlockedAchievements: [],
    daily: { ...DEFAULT_SAVE_DATA.daily },
  };
}

function sanitizeDifficulty(value: unknown): Difficulty {
  return DIFFICULTIES.includes(value as Difficulty) ? (value as Difficulty) : 'normal';
}

function sanitizeMode(value: unknown): GameMode {
  return MODES.includes(value as GameMode) ? (value as GameMode) : 'seeded';
}

function sanitizeNumber(value: unknown, fallback: number, min = 0, max = Number.POSITIVE_INFINITY): number {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

function sanitizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function sanitizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function sanitizeRunData(value: unknown): RunData | null {
  if (!isObject(value)) {
    return null;
  }

  return {
    time: sanitizeNumber(value.time, 0),
    deaths: Math.floor(sanitizeNumber(value.deaths, 0)),
    stars: Math.floor(sanitizeNumber(value.stars, 0)),
    totalStars: Math.floor(sanitizeNumber(value.totalStars, 0)),
    score: Math.floor(sanitizeNumber(value.score, 0)),
    rating: sanitizeNumber(value.rating, 0, 0, 100),
    date: sanitizeString(value.date, new Date().toISOString()),
    splits: Array.isArray(value.splits) ? value.splits.map((split) => sanitizeNumber(split, 0)) : [],
  };
}

function sanitizeBestRunEntry(value: unknown): BestRunEntry | null {
  if (!isObject(value)) {
    return null;
  }

  const run = sanitizeRunData(value);
  if (!run) {
    return null;
  }

  return {
    ...run,
    seed: sanitizeString(value.seed),
    mode: sanitizeMode(value.mode),
  };
}

function mergeSaveData(value: unknown): SaveData {
  const defaults = cloneDefaults();

  if (!isObject(value)) {
    return defaults;
  }

  const bestRuns: Partial<Record<Difficulty, BestRunEntry>> = {};
  for (const difficulty of DIFFICULTIES) {
    const candidate = sanitizeBestRunEntry(value.bestRuns && isObject(value.bestRuns) ? value.bestRuns[difficulty] : null);
    if (candidate) {
      bestRuns[difficulty] = candidate;
    }
  }

  return {
    version: 1,
    selectedSeed: sanitizeString(value.selectedSeed),
    lastDifficulty: sanitizeDifficulty(value.lastDifficulty),
    lastMode: sanitizeMode(value.lastMode),
    settings: {
      masterVolume: sanitizeNumber(value.settings && isObject(value.settings) ? value.settings.masterVolume : undefined, defaults.settings.masterVolume, 0, 1),
      musicVolume: sanitizeNumber(value.settings && isObject(value.settings) ? value.settings.musicVolume : undefined, defaults.settings.musicVolume, 0, 1),
      sfxVolume: sanitizeNumber(value.settings && isObject(value.settings) ? value.settings.sfxVolume : undefined, defaults.settings.sfxVolume, 0, 1),
      voiceVolume: sanitizeNumber(value.settings && isObject(value.settings) ? value.settings.voiceVolume : undefined, defaults.settings.voiceVolume, 0, 1),
      voiceEnabled: sanitizeBoolean(value.settings && isObject(value.settings) ? value.settings.voiceEnabled : undefined, defaults.settings.voiceEnabled),
      mouseSensitivity: sanitizeNumber(value.settings && isObject(value.settings) ? value.settings.mouseSensitivity : undefined, defaults.settings.mouseSensitivity, 0.1, 5),
      graphicsQuality:
        value.settings && isObject(value.settings) && (value.settings.graphicsQuality === 'low' || value.settings.graphicsQuality === 'medium' || value.settings.graphicsQuality === 'high' || value.settings.graphicsQuality === 'ultra')
          ? value.settings.graphicsQuality
          : defaults.settings.graphicsQuality,
      showTimer: sanitizeBoolean(value.settings && isObject(value.settings) ? value.settings.showTimer : undefined, defaults.settings.showTimer),
      showDeathCounter: sanitizeBoolean(value.settings && isObject(value.settings) ? value.settings.showDeathCounter : undefined, defaults.settings.showDeathCounter),
      reduceMotion: sanitizeBoolean(value.settings && isObject(value.settings) ? value.settings.reduceMotion : undefined, defaults.settings.reduceMotion),
      highContrast: sanitizeBoolean(value.settings && isObject(value.settings) ? value.settings.highContrast : undefined, defaults.settings.highContrast),
      cameraInvertY: sanitizeBoolean(value.settings && isObject(value.settings) ? value.settings.cameraInvertY : undefined, defaults.settings.cameraInvertY),
      characterColors: {
        head: sanitizeString(value.settings && isObject(value.settings) && isObject(value.settings.characterColors) ? value.settings.characterColors.head : undefined, defaults.settings.characterColors.head),
        torso: sanitizeString(value.settings && isObject(value.settings) && isObject(value.settings.characterColors) ? value.settings.characterColors.torso : undefined, defaults.settings.characterColors.torso),
        arms: sanitizeString(value.settings && isObject(value.settings) && isObject(value.settings.characterColors) ? value.settings.characterColors.arms : undefined, defaults.settings.characterColors.arms),
        legs: sanitizeString(value.settings && isObject(value.settings) && isObject(value.settings.characterColors) ? value.settings.characterColors.legs : undefined, defaults.settings.characterColors.legs),
      },
    },
    stats: {
      totalRuns: Math.floor(sanitizeNumber(value.stats && isObject(value.stats) ? value.stats.totalRuns : undefined, 0)),
      totalWins: Math.floor(sanitizeNumber(value.stats && isObject(value.stats) ? value.stats.totalWins : undefined, 0)),
      totalDeaths: Math.floor(sanitizeNumber(value.stats && isObject(value.stats) ? value.stats.totalDeaths : undefined, 0)),
      totalStarsCollected: Math.floor(sanitizeNumber(value.stats && isObject(value.stats) ? value.stats.totalStarsCollected : undefined, 0)),
      totalPlayTimeMs: sanitizeNumber(value.stats && isObject(value.stats) ? value.stats.totalPlayTimeMs : undefined, 0),
      bestScore: Math.floor(sanitizeNumber(value.stats && isObject(value.stats) ? value.stats.bestScore : undefined, 0)),
    },
    bestRuns,
    recentRuns: Array.isArray(value.recentRuns)
      ? value.recentRuns.map((entry) => sanitizeBestRunEntry(entry)).filter((entry): entry is BestRunEntry => entry !== null).slice(0, MAX_RECENT_RUNS)
      : [],
    unlockedAchievements: Array.isArray(value.unlockedAchievements)
      ? value.unlockedAchievements.filter((entry): entry is string => typeof entry === 'string')
      : [],
    daily: {
      lastSeed: sanitizeString(value.daily && isObject(value.daily) ? value.daily.lastSeed : undefined),
      lastPlayedDay: sanitizeString(value.daily && isObject(value.daily) ? value.daily.lastPlayedDay : undefined),
      bestRun: sanitizeBestRunEntry(value.daily && isObject(value.daily) ? value.daily.bestRun : undefined) ?? undefined,
    },
  };
}

export class SaveManager {
  private cache: SaveData;

  constructor(private readonly storageKey: string = STORAGE_KEY) {
    this.cache = this.load();
  }

  load(): SaveData {
    if (!canUseStorage()) {
      this.cache = cloneDefaults();
      return this.getData();
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      this.cache = raw ? mergeSaveData(JSON.parse(raw)) : cloneDefaults();
    } catch {
      this.cache = cloneDefaults();
    }

    return this.getData();
  }

  save(data: SaveData = this.cache): void {
    this.cache = mergeSaveData(data);

    if (!canUseStorage()) {
      return;
    }

    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(this.cache));
    } catch {
      // Ignore browser storage errors.
    }
  }

  getData(): SaveData {
    return mergeSaveData(this.cache);
  }

  updateSeed(seed: string): SaveData {
    this.cache.selectedSeed = seed;
    this.save();
    return this.getData();
  }

  updateLastSession(difficulty: Difficulty, mode: GameMode, seed: string): SaveData {
    this.cache.lastDifficulty = difficulty;
    this.cache.lastMode = mode;
    this.cache.selectedSeed = seed;
    this.save();
    return this.getData();
  }

  updateSettings(partial: Partial<SaveSettings>): SaveData {
    this.cache.settings = {
      ...this.cache.settings,
      ...partial,
      characterColors: {
        ...this.cache.settings.characterColors,
        ...(partial.characterColors ?? {}),
      },
    };
    this.save();
    return this.getData();
  }

  unlockAchievement(id: string): SaveData {
    if (!this.cache.unlockedAchievements.includes(id)) {
      this.cache.unlockedAchievements.push(id);
      this.save();
    }

    return this.getData();
  }

  isAchievementUnlocked(id: string): boolean {
    return this.cache.unlockedAchievements.includes(id);
  }

  recordRun(input: RecordRunInput): SaveData {
    const entry: BestRunEntry = {
      ...input.run,
      seed: input.seed,
      mode: input.mode,
    };

    this.cache.stats.totalRuns += 1;
    this.cache.stats.totalDeaths += entry.deaths;
    this.cache.stats.totalStarsCollected += entry.stars;
    this.cache.stats.totalPlayTimeMs += entry.time;
    this.cache.stats.bestScore = Math.max(this.cache.stats.bestScore, entry.score);

    if (entry.rating >= 50) {
      this.cache.stats.totalWins += 1;
    }

    const currentBest = this.cache.bestRuns[input.difficulty];
    if (!currentBest || entry.score > currentBest.score || (entry.score === currentBest.score && entry.time < currentBest.time)) {
      this.cache.bestRuns[input.difficulty] = entry;
    }

    this.cache.recentRuns.unshift(entry);
    this.cache.recentRuns = this.cache.recentRuns.slice(0, MAX_RECENT_RUNS);

    if (input.mode === 'daily') {
      const day = entry.date.slice(0, 10);
      this.cache.daily.lastPlayedDay = day;
      this.cache.daily.lastSeed = input.seed;

      if (!this.cache.daily.bestRun || entry.score > this.cache.daily.bestRun.score || (entry.score === this.cache.daily.bestRun.score && entry.time < this.cache.daily.bestRun.time)) {
        this.cache.daily.bestRun = entry;
      }
    }

    this.save();
    return this.getData();
  }

  getDailySeed(date = new Date()): string {
    const day = date.toISOString().slice(0, 10);
    if (this.cache.daily.lastPlayedDay === day && this.cache.daily.lastSeed) {
      return this.cache.daily.lastSeed;
    }

    const seed = `daily-${day}`;
    this.cache.daily.lastPlayedDay = day;
    this.cache.daily.lastSeed = seed;
    this.save();
    return seed;
  }

  resetProgress(): SaveData {
    this.cache = cloneDefaults();
    this.save();
    return this.getData();
  }

  clearStorage(): void {
    this.cache = cloneDefaults();

    if (!canUseStorage()) {
      return;
    }

    try {
      window.localStorage.removeItem(this.storageKey);
    } catch {
      // Ignore browser storage errors.
    }
  }
}

export const saveManager = new SaveManager();