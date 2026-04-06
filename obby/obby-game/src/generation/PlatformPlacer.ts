import { GAME_CONFIG } from '../utils/constants';
import type {
  CollectibleConfig,
  Difficulty,
  PlatformNode,
  PlatformType,
  ThemeAssignment,
  Vec3,
} from '../utils/types';
import type { RNG } from './SeededRNG';
import { ThemeManager } from './ThemeManager';

export interface PlatformPlacementResult {
  mainPath: PlatformNode[];
  checkpoints: number[];
  estimatedLength: number;
}

function createVec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

export class PlatformPlacer {
  constructor(private readonly themeManager: ThemeManager = new ThemeManager()) {}

  createMainPath(
    totalPlatforms: number,
    difficulty: Difficulty,
    assignments: ThemeAssignment[],
    rng: RNG,
  ): PlatformPlacementResult {
    const mainPath: PlatformNode[] = [];
    const checkpoints: number[] = [];
    const difficultyConfig = GAME_CONFIG.difficulty[difficulty];

    let currentX = 0;
    let currentY = 0;
    let currentZ = 0;
    let estimatedLength = 0;

    for (let index = 0; index < totalPlatforms; index += 1) {
      const isStart = index === 0;
      const isFinish = index === totalPlatforms - 1;
      const isRestArea = isStart || isFinish || index % GAME_CONFIG.restAreaInterval === 0;
      const isCheckpoint = isStart || (!isFinish && index % difficultyConfig.checkpointEvery === 0);
      const themeId = this.themeManager.getThemeForIndex(index, assignments);

      if (index > 0) {
        const forwardStep = isFinish
          ? rng.float(9.5, 11.5)
          : rng.float(GAME_CONFIG.horizontalStepRange.min, GAME_CONFIG.horizontalStepRange.max);
        const lateralStep = isRestArea
          ? rng.float(-2.5, 2.5)
          : rng.float(GAME_CONFIG.lateralStepRange.min, GAME_CONFIG.lateralStepRange.max);
        const verticalStep = isRestArea
          ? rng.float(-0.4, 1.2)
          : rng.float(-1.6, GAME_CONFIG.sectionHeightVariance);

        currentX += forwardStep;
        currentZ += lateralStep;
        currentY = Math.max(0, currentY + verticalStep);
        estimatedLength += Math.sqrt(
          forwardStep * forwardStep + lateralStep * lateralStep + verticalStep * verticalStep,
        );
      }

      const type = isStart || isFinish || isRestArea ? 'static' : this.pickPlatformType(difficulty, rng);
      const size = this.createPlatformSize(type, difficulty, isRestArea, isStart, isFinish, rng);
      const rotation = type === 'moving_circular' || type === 'rotating' ? rng.float(-0.4, 0.4) : 0;

      const platform: PlatformNode = {
        index,
        type,
        position: createVec3(currentX, currentY, currentZ),
        size,
        rotation,
        obstacles: [],
        collectibles: this.createPlatformCollectibles(index, isRestArea, isFinish, rng),
        isCheckpoint,
        isRestArea,
        isFinish,
        themeId,
        metadata: {
          moveAmplitude: this.getMoveAmplitude(type, rng),
          moveSpeed: this.getMoveSpeed(type, difficulty, rng),
        },
      };

      if (platform.isCheckpoint) {
        checkpoints.push(platform.index);
      }

      mainPath.push(platform);
    }

    return {
      mainPath,
      checkpoints,
      estimatedLength,
    };
  }

  private pickPlatformType(difficulty: Difficulty, rng: RNG): PlatformType {
    return rng.weighted(GAME_CONFIG.weightedPlatformTypes[difficulty]) as PlatformType;
  }

  private createPlatformSize(
    type: PlatformType,
    difficulty: Difficulty,
    isRestArea: boolean,
    isStart: boolean,
    isFinish: boolean,
    rng: RNG,
  ): Vec3 {
    if (isStart) {
      return { ...GAME_CONFIG.startPlatformSize };
    }

    if (isFinish) {
      return { ...GAME_CONFIG.finishPlatformSize };
    }

    if (isRestArea) {
      return createVec3(rng.float(7.5, 9.5), GAME_CONFIG.defaultPlatformHeight, rng.float(7.5, 9.5));
    }

    const shrink = difficulty === 'easy' ? 1 : difficulty === 'normal' ? 0.7 : difficulty === 'hard' ? 0.35 : 0;
    const widthBase = rng.float(4.2 + shrink, 7.2 + shrink);
    const depthBase = rng.float(4.6 + shrink, 7.6 + shrink);

    switch (type) {
      case 'thin':
        return createVec3(rng.float(2.2, 3.2), GAME_CONFIG.defaultPlatformHeight, rng.float(5.2, 7.4));
      case 'moving_linear':
      case 'moving_circular':
      case 'appearing':
        return createVec3(widthBase - 0.6, GAME_CONFIG.defaultPlatformHeight, depthBase - 0.5);
      case 'falling':
        return createVec3(widthBase - 1, GAME_CONFIG.defaultPlatformHeight, depthBase - 0.8);
      default:
        return createVec3(widthBase, GAME_CONFIG.defaultPlatformHeight, depthBase);
    }
  }

  private createPlatformCollectibles(
    index: number,
    isRestArea: boolean,
    isFinish: boolean,
    rng: RNG,
  ): CollectibleConfig[] {
    if (isFinish || index === 0) {
      return [];
    }

    if (!isRestArea && !rng.bool(0.18)) {
      return [];
    }

    return [
      {
        id: `main-star-${index}`,
        kind: 'star',
        position: createVec3(rng.float(-1.4, 1.4), GAME_CONFIG.starHeightOffset, rng.float(-1.4, 1.4)),
      },
    ];
  }

  private getMoveAmplitude(type: PlatformType, rng: RNG): number {
    if (type === 'moving_linear' || type === 'moving_circular') {
      return rng.float(1.8, 4.4);
    }

    if (type === 'rotating') {
      return rng.float(0.8, 1.4);
    }

    return 0;
  }

  private getMoveSpeed(type: PlatformType, difficulty: Difficulty, rng: RNG): number {
    const difficultyScale: Record<Difficulty, number> = {
      easy: 0.85,
      normal: 1,
      hard: 1.15,
      extreme: 1.3,
    };

    if (type === 'moving_linear' || type === 'moving_circular' || type === 'rotating' || type === 'appearing') {
      return rng.float(0.6, 1.4) * difficultyScale[difficulty];
    }

    if (type === 'conveyor') {
      return rng.float(1.2, 2.4) * difficultyScale[difficulty];
    }

    return 0;
  }
}