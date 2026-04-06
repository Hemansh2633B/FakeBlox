import type { Difficulty, ThemeId } from './types';

export interface ThemePalette {
  sky: string;
  fog: string;
  ambient: string;
  directional: string;
  platformTop: string;
  platformSide: string;
  accent: string;
  hazard: string;
  collectible: string;
}

export const THEME_PALETTES: Record<ThemeId, ThemePalette> = {
  grasslands: {
    sky: '#8fd3ff',
    fog: '#dff6ff',
    ambient: '#fff2d8',
    directional: '#ffffff',
    platformTop: '#6ac36a',
    platformSide: '#7a5c43',
    accent: '#ffd166',
    hazard: '#d7263d',
    collectible: '#fff27a',
  },
  lava: {
    sky: '#3a0d0d',
    fog: '#5a1c12',
    ambient: '#ffb26b',
    directional: '#ffd9a3',
    platformTop: '#5f5f68',
    platformSide: '#2e2a31',
    accent: '#ff7b00',
    hazard: '#ff3b30',
    collectible: '#ffe27a',
  },
  ice: {
    sky: '#c8f1ff',
    fog: '#e9fbff',
    ambient: '#dff6ff',
    directional: '#ffffff',
    platformTop: '#b7ecff',
    platformSide: '#7fb4d1',
    accent: '#7ee0ff',
    hazard: '#6bbdff',
    collectible: '#fef08a',
  },
  space: {
    sky: '#080914',
    fog: '#14192c',
    ambient: '#9cb3ff',
    directional: '#e9edff',
    platformTop: '#6b6fd6',
    platformSide: '#2d316e',
    accent: '#ff66c4',
    hazard: '#ff5f87',
    collectible: '#ffe066',
  },
  factory: {
    sky: '#b4bcc4',
    fog: '#d7dde2',
    ambient: '#f1f5f9',
    directional: '#ffffff',
    platformTop: '#8c98a4',
    platformSide: '#4b5563',
    accent: '#22c55e',
    hazard: '#ef4444',
    collectible: '#fde047',
  },
  neon: {
    sky: '#13051f',
    fog: '#22083a',
    ambient: '#e879f9',
    directional: '#ffffff',
    platformTop: '#00e5ff',
    platformSide: '#4c1d95',
    accent: '#ff4dbe',
    hazard: '#ff3366',
    collectible: '#f9ff69',
  },
};

const baseSectionsByDifficulty: Record<Difficulty, number> = {
  easy: 3,
  normal: 4,
  hard: 5,
  extreme: 6,
};

const basePlatformsByDifficulty: Record<Difficulty, number> = {
  easy: 18,
  normal: 24,
  hard: 30,
  extreme: 36,
};

const branchChanceByDifficulty: Record<Difficulty, number> = {
  easy: 0.28,
  normal: 0.38,
  hard: 0.5,
  extreme: 0.62,
};

const obstacleChanceByDifficulty: Record<Difficulty, number> = {
  easy: 0.3,
  normal: 0.48,
  hard: 0.66,
  extreme: 0.82,
};

export const GAME_CONFIG = {
  startPlatformSize: { x: 10, y: 1.5, z: 10 },
  finishPlatformSize: { x: 12, y: 1.5, z: 12 },
  defaultPlatformHeight: 1.25,
  checkpointInterval: 6,
  restAreaInterval: 5,
  sectionLengthRange: { min: 4, max: 7 },
  sectionHeightVariance: 3.2,
  horizontalStepRange: { min: 7.5, max: 12.5 },
  lateralStepRange: { min: -5.5, max: 5.5 },
  branchLengthRange: { min: 2, max: 4 },
  starHeightOffset: 2.4,
  validator: {
    maxJumpDistance: 13.5,
    maxRisePerStep: 4.2,
    maxDropPerStep: 7.5,
    minPlatformArea: 4,
  },
  difficulty: {
    easy: {
      sections: baseSectionsByDifficulty.easy,
      mainPlatforms: basePlatformsByDifficulty.easy,
      branchChance: branchChanceByDifficulty.easy,
      obstacleChance: obstacleChanceByDifficulty.easy,
      checkpointEvery: 5,
      moveWeight: 0.12,
      hazardDensity: 0.25,
    },
    normal: {
      sections: baseSectionsByDifficulty.normal,
      mainPlatforms: basePlatformsByDifficulty.normal,
      branchChance: branchChanceByDifficulty.normal,
      obstacleChance: obstacleChanceByDifficulty.normal,
      checkpointEvery: 6,
      moveWeight: 0.2,
      hazardDensity: 0.4,
    },
    hard: {
      sections: baseSectionsByDifficulty.hard,
      mainPlatforms: basePlatformsByDifficulty.hard,
      branchChance: branchChanceByDifficulty.hard,
      obstacleChance: obstacleChanceByDifficulty.hard,
      checkpointEvery: 6,
      moveWeight: 0.32,
      hazardDensity: 0.58,
    },
    extreme: {
      sections: baseSectionsByDifficulty.extreme,
      mainPlatforms: basePlatformsByDifficulty.extreme,
      branchChance: branchChanceByDifficulty.extreme,
      obstacleChance: obstacleChanceByDifficulty.extreme,
      checkpointEvery: 7,
      moveWeight: 0.45,
      hazardDensity: 0.75,
    },
  },
  weightedPlatformTypes: {
    easy: [
      ['static', 54],
      ['thin', 12],
      ['bouncy', 10],
      ['ice', 7],
      ['conveyor', 7],
      ['moving_linear', 6],
      ['appearing', 4],
    ],
    normal: [
      ['static', 38],
      ['thin', 12],
      ['bouncy', 8],
      ['ice', 10],
      ['conveyor', 8],
      ['moving_linear', 10],
      ['moving_circular', 6],
      ['rotating', 5],
      ['appearing', 3],
    ],
    hard: [
      ['static', 24],
      ['thin', 14],
      ['bouncy', 8],
      ['ice', 10],
      ['conveyor', 10],
      ['moving_linear', 11],
      ['moving_circular', 8],
      ['rotating', 8],
      ['falling', 4],
      ['appearing', 3],
    ],
    extreme: [
      ['static', 16],
      ['thin', 16],
      ['bouncy', 7],
      ['ice', 10],
      ['conveyor', 10],
      ['moving_linear', 12],
      ['moving_circular', 10],
      ['rotating', 10],
      ['falling', 5],
      ['appearing', 4],
    ],
  } as const,
  weightedObstacleTypes: {
    easy: [
      ['kill_brick', 42],
      ['wind_zone', 22],
      ['spinning_bar', 20],
      ['moving_wall', 16],
    ],
    normal: [
      ['kill_brick', 28],
      ['wind_zone', 16],
      ['spinning_bar', 20],
      ['moving_wall', 16],
      ['pendulum', 12],
      ['laser_beam', 8],
    ],
    hard: [
      ['kill_brick', 20],
      ['wind_zone', 12],
      ['spinning_bar', 18],
      ['moving_wall', 16],
      ['pendulum', 14],
      ['laser_beam', 10],
      ['crusher', 10],
    ],
    extreme: [
      ['kill_brick', 16],
      ['wind_zone', 10],
      ['spinning_bar', 18],
      ['moving_wall', 14],
      ['pendulum', 14],
      ['laser_beam', 14],
      ['crusher', 14],
    ],
  } as const,
};