export type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme';

export type GameMode = 'seeded' | 'daily' | 'endless';

export type ThemeId =
  | 'grasslands'
  | 'lava'
  | 'ice'
  | 'space'
  | 'factory'
  | 'neon';

export type PlatformType =
  | 'static'
  | 'moving_linear'
  | 'moving_circular'
  | 'rotating'
  | 'falling'
  | 'bouncy'
  | 'conveyor'
  | 'appearing'
  | 'ice'
  | 'thin';

export type ObstacleType =
  | 'kill_brick'
  | 'spinning_bar'
  | 'pendulum'
  | 'crusher'
  | 'laser_beam'
  | 'wind_zone'
  | 'moving_wall';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CollectibleConfig {
  id: string;
  position: Vec3;
  kind: 'star';
  branchOnly?: boolean;
  secret?: boolean;
}

export interface ObstacleConfig {
  id: string;
  type: ObstacleType;
  position: Vec3;
  rotation: number;
  speed: number;
  timing: {
    period: number;
    phase: number;
  };
  size: Vec3;
}

export interface PlatformNode {
  index: number;
  type: PlatformType;
  position: Vec3;
  size: Vec3;
  rotation: number;
  obstacles: ObstacleConfig[];
  collectibles: CollectibleConfig[];
  isCheckpoint: boolean;
  isRestArea: boolean;
  isFinish?: boolean;
  themeId: ThemeId;
  metadata?: Record<string, number | string | boolean>;
}

export interface BranchPath {
  branchFromIndex: number;
  platforms: PlatformNode[];
  hasSecret: boolean;
  starCount: number;
}

export interface ThemeAssignment {
  themeId: ThemeId;
  startIndex: number;
  endIndex: number;
}

export interface LevelLayout {
  seed: string;
  numericSeed: number;
  difficulty: Difficulty;
  mode: GameMode;
  mainPath: PlatformNode[];
  branchPaths: BranchPath[];
  checkpoints: number[];
  themeAssignments: ThemeAssignment[];
  totalStars: number;
  estimatedLength: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RunData {
  time: number;
  deaths: number;
  stars: number;
  totalStars: number;
  score: number;
  rating: number;
  date: string;
  splits: number[];
}

export interface SettingsData {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  voiceEnabled: boolean;
  mouseSensitivity: number;
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
  showTimer: boolean;
  showDeathCounter: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  cameraInvertY: boolean;
  characterColors: {
    head: string;
    torso: string;
    arms: string;
    legs: string;
  };
}

export interface GameSnapshot {
  seed: string;
  numericSeed: number;
  difficulty: Difficulty;
  mode: GameMode;
  starsCollected: number;
  totalStars: number;
  deaths: number;
  timerMs: number;
  checkpointIndex: number;
  levelProgress: number;
}
