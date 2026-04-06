import type { AudioSettings } from './AudioManager';

export interface CharacterColors {
  head: string;
  torso: string;
  leftArm: string;
  rightArm: string;
  leftLeg: string;
  rightLeg: string;
}

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  mouseSensitivity: number;
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
  showTimer: boolean;
  showDeathCounter: boolean;
  timerPauseOnDeath: boolean;
  characterColors: CharacterColors;
  touchControlsSize: 'small' | 'medium' | 'large';
  cameraInvertY: boolean;
}

export interface GameStats {
  totalDeaths: number;
  totalStarsCollected: number;
  totalLevelsCompleted: number;
  totalPlayTimeMs: number;
  longestEndlessRun: number;
  dailyChallengesCompleted: number;
}

export interface BestRun {
  time: number;
  deaths: number;
  stars: number;
  totalStars: number;
  score: number;
  rating: number;
  date: string;
  splits: number[];
}

export interface RecentSeed {
  seed: string;
  difficulty: string;
  date: string;
}

export interface AchievementRecord {
  id: string;
  unlockedDate: string;
}

export class SaveManager {
  private static readonly SETTINGS_KEY = 'obbyGame_settings';
  private static readonly STATS_KEY = 'obbyGame_stats';
  private static readonly RUNS_KEY = 'obbyGame_bestRuns';
  private static readonly RECENT_SEEDS_KEY = 'obbyGame_recentSeeds';
  private static readonly ACHIEVEMENTS_KEY = 'obbyGame_achievements';
  private static readonly STORAGE_BUDGET_BYTES = 1024 * 1024;
  private static readonly RECENT_SEEDS_MAX = 50;

  private readonly defaultSettings: GameSettings = {
    masterVolume: 0.8,
    musicVolume: 0.5,
    sfxVolume: 1.0,
    mouseSensitivity: 1.0,
    graphicsQuality: 'medium',
    showTimer: true,
    showDeathCounter: true,
    timerPauseOnDeath: false,
    characterColors: {
      head: '#FFD93D',
      torso: '#6BCB77',
      leftArm: '#6BCB77',
      rightArm: '#6BCB77',
      leftLeg: '#4D96FF',
      rightLeg: '#4D96FF',
    },
    touchControlsSize: 'medium',
    cameraInvertY: false,
  };

  private readonly defaultStats: GameStats = {
    totalDeaths: 0,
    totalStarsCollected: 0,
    totalLevelsCompleted: 0,
    totalPlayTimeMs: 0,
    longestEndlessRun: 0,
    dailyChallengesCompleted: 0,
  };

  public saveSettings(settings: AudioSettings | Partial<GameSettings>): void {
    const normalized = this.normalizeSettings(settings);
    localStorage.setItem(SaveManager.SETTINGS_KEY, JSON.stringify(normalized));
    this.enforceStorageBudget();
  }

  public loadSettings(): GameSettings {
    const parsed = this.safeParse<GameSettings>(SaveManager.SETTINGS_KEY);
    if (!parsed) return { ...this.defaultSettings };
    return this.normalizeSettings(parsed);
  }

  public saveStats(stats: Partial<GameStats>): void {
    const normalized = { ...this.defaultStats, ...stats };
    localStorage.setItem(SaveManager.STATS_KEY, JSON.stringify(normalized));
    this.enforceStorageBudget();
  }

  public loadStats(): GameStats {
    const parsed = this.safeParse<GameStats>(SaveManager.STATS_KEY);
    if (!parsed) return { ...this.defaultStats };
    return { ...this.defaultStats, ...parsed };
  }

  public incrementStats(update: Partial<GameStats>): void {
    const current = this.loadStats();
    this.saveStats({
      totalDeaths: current.totalDeaths + (update.totalDeaths ?? 0),
      totalStarsCollected: current.totalStarsCollected + (update.totalStarsCollected ?? 0),
      totalLevelsCompleted: current.totalLevelsCompleted + (update.totalLevelsCompleted ?? 0),
      totalPlayTimeMs: current.totalPlayTimeMs + (update.totalPlayTimeMs ?? 0),
      longestEndlessRun: Math.max(current.longestEndlessRun, update.longestEndlessRun ?? 0),
      dailyChallengesCompleted: current.dailyChallengesCompleted + (update.dailyChallengesCompleted ?? 0),
    });
  }

  public saveBestRun(seed: string, difficulty: string, runData: Partial<BestRun> & { time: number; deaths: number; stars: number; score: number }): void {
    const allRuns = this.loadAllBestRuns();
    const key = `${seed}_${difficulty}`;
    const existing = allRuns[key];
    const normalized: BestRun = {
      time: runData.time,
      deaths: runData.deaths,
      stars: runData.stars,
      totalStars: runData.totalStars ?? runData.stars,
      score: runData.score,
      rating: runData.rating ?? 1,
      date: runData.date ?? new Date().toISOString(),
      splits: runData.splits ?? [],
    };
    if (!existing || normalized.time < existing.time) {
      allRuns[key] = normalized;
      localStorage.setItem(SaveManager.RUNS_KEY, JSON.stringify(allRuns));
      this.enforceStorageBudget();
    }
  }

  public loadAllBestRuns(): Record<string, BestRun> {
    return this.safeParse<Record<string, BestRun>>(SaveManager.RUNS_KEY) ?? {};
  }

  public saveRecentSeed(entry: RecentSeed): void {
    const current = this.loadRecentSeeds().filter((seed) => !(seed.seed === entry.seed && seed.difficulty === entry.difficulty));
    current.unshift(entry);
    const trimmed = current.slice(0, SaveManager.RECENT_SEEDS_MAX);
    localStorage.setItem(SaveManager.RECENT_SEEDS_KEY, JSON.stringify(trimmed));
    this.enforceStorageBudget();
  }

  public loadRecentSeeds(): RecentSeed[] {
    return this.safeParse<RecentSeed[]>(SaveManager.RECENT_SEEDS_KEY) ?? [];
  }

  public saveAchievements(achievements: AchievementRecord[]): void {
    localStorage.setItem(SaveManager.ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    this.enforceStorageBudget();
  }

  public loadAchievements(): AchievementRecord[] {
    return this.safeParse<AchievementRecord[]>(SaveManager.ACHIEVEMENTS_KEY) ?? [];
  }

  public resetAll(): void {
    localStorage.removeItem(SaveManager.SETTINGS_KEY);
    localStorage.removeItem(SaveManager.STATS_KEY);
    localStorage.removeItem(SaveManager.RUNS_KEY);
    localStorage.removeItem(SaveManager.RECENT_SEEDS_KEY);
    localStorage.removeItem(SaveManager.ACHIEVEMENTS_KEY);
  }

  private safeParse<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  private normalizeSettings(settings: AudioSettings | Partial<GameSettings>): GameSettings {
    const maybeAudio = settings as AudioSettings;
    const merged: GameSettings = {
      ...this.defaultSettings,
      ...settings as Partial<GameSettings>,
      characterColors: {
        ...this.defaultSettings.characterColors,
        ...(settings as Partial<GameSettings>).characterColors,
      },
    };

    if (typeof maybeAudio.master === 'number') merged.masterVolume = maybeAudio.master;
    if (typeof maybeAudio.music === 'number') merged.musicVolume = maybeAudio.music;
    if (typeof maybeAudio.sfx === 'number') merged.sfxVolume = maybeAudio.sfx;
    return merged;
  }

  private enforceStorageBudget(): void {
    const total = Object.keys(localStorage).reduce((sum, key) => {
      const value = localStorage.getItem(key) ?? '';
      return sum + key.length + value.length;
    }, 0);
    if (total <= SaveManager.STORAGE_BUDGET_BYTES) return;

    const recent = this.loadRecentSeeds();
    if (recent.length <= 1) return;
    const trimmed = recent.slice(0, Math.max(1, Math.floor(recent.length / 2)));
    localStorage.setItem(SaveManager.RECENT_SEEDS_KEY, JSON.stringify(trimmed));
  }
}
