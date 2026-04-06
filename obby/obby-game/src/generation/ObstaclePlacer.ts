import { GAME_CONFIG } from '../utils/constants';
import type {
  BranchPath,
  CollectibleConfig,
  Difficulty,
  ObstacleConfig,
  ObstacleType,
  PlatformNode,
  Vec3,
} from '../utils/types';
import type { RNG } from './SeededRNG';

function createVec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

export class ObstaclePlacer {
  populateMainPath(mainPath: PlatformNode[], difficulty: Difficulty, rng: RNG): void {
    const difficultyConfig = GAME_CONFIG.difficulty[difficulty];

    for (const platform of mainPath) {
      if (platform.index === 0 || platform.isFinish || platform.isRestArea || platform.isCheckpoint) {
        continue;
      }

      if (!rng.bool(difficultyConfig.obstacleChance)) {
        continue;
      }

      platform.obstacles = this.createObstaclesForPlatform(platform, difficulty, rng);
    }
  }

  createBranches(mainPath: PlatformNode[], difficulty: Difficulty, rng: RNG): BranchPath[] {
    const difficultyConfig = GAME_CONFIG.difficulty[difficulty];
    const branches: BranchPath[] = [];

    for (const source of mainPath) {
      if (source.index < 2 || source.isFinish || source.isCheckpoint || source.isRestArea) {
        continue;
      }

      if (!rng.bool(difficultyConfig.branchChance)) {
        continue;
      }

      const branchLength = rng.int(GAME_CONFIG.branchLengthRange.min, GAME_CONFIG.branchLengthRange.max);
      const branchPlatforms: PlatformNode[] = [];
      const direction = rng.sign();
      let cursor = source.position;

      for (let step = 0; step < branchLength; step += 1) {
        const branchIndex = step;
        const position = createVec3(
          cursor.x + rng.float(4.5, 7.2),
          Math.max(0, cursor.y + rng.float(-0.8, 2)),
          cursor.z + direction * rng.float(4.5, 7.5),
        );
        cursor = position;

        const platform: PlatformNode = {
          index: branchIndex,
          type: step === branchLength - 1 ? 'static' : rng.weighted(GAME_CONFIG.weightedPlatformTypes[difficulty]),
          position,
          size: createVec3(rng.float(3.4, 5.4), GAME_CONFIG.defaultPlatformHeight, rng.float(3.4, 5.6)),
          rotation: 0,
          obstacles: step === branchLength - 1 ? [] : this.createObstaclesForBranch(difficulty, rng),
          collectibles: [],
          isCheckpoint: false,
          isRestArea: false,
          themeId: source.themeId,
          metadata: {
            branch: true,
            branchFrom: source.index,
          },
        };

        branchPlatforms.push(platform);
      }

      const hasSecret = rng.bool(0.35);
      const finalPlatform = branchPlatforms[branchPlatforms.length - 1];
      const collectibles: CollectibleConfig[] = [
        {
          id: `branch-star-${source.index}`,
          kind: 'star',
          position: createVec3(0, GAME_CONFIG.starHeightOffset, 0),
          branchOnly: true,
          secret: hasSecret,
        },
      ];

      if (hasSecret) {
        collectibles.push({
          id: `branch-secret-${source.index}`,
          kind: 'star',
          position: createVec3(rng.float(-0.9, 0.9), GAME_CONFIG.starHeightOffset + 0.8, rng.float(-0.9, 0.9)),
          branchOnly: true,
          secret: true,
        });
      }

      finalPlatform.collectibles = collectibles;

      branches.push({
        branchFromIndex: source.index,
        platforms: branchPlatforms,
        hasSecret,
        starCount: collectibles.length,
      });
    }

    return branches;
  }

  private createObstaclesForPlatform(platform: PlatformNode, difficulty: Difficulty, rng: RNG): ObstacleConfig[] {
    const count = platform.type === 'thin' ? 1 : rng.bool(GAME_CONFIG.difficulty[difficulty].hazardDensity) ? 2 : 1;
    const obstacles: ObstacleConfig[] = [];

    for (let index = 0; index < count; index += 1) {
      const type = rng.weighted(GAME_CONFIG.weightedObstacleTypes[difficulty]) as ObstacleType;
      obstacles.push(this.createObstacle(`${platform.index}-${index}`, type, platform.size, difficulty, rng));
    }

    return obstacles;
  }

  private createObstaclesForBranch(difficulty: Difficulty, rng: RNG): ObstacleConfig[] {
    if (!rng.bool(Math.max(0.15, GAME_CONFIG.difficulty[difficulty].obstacleChance - 0.2))) {
      return [];
    }

    const type = rng.weighted(GAME_CONFIG.weightedObstacleTypes[difficulty]) as ObstacleType;
    return [this.createObstacle(`branch-${type}`, type, createVec3(4, 1.25, 4), difficulty, rng)];
  }

  private createObstacle(
    idSuffix: string,
    type: ObstacleType,
    sizeHint: Vec3,
    difficulty: Difficulty,
    rng: RNG,
  ): ObstacleConfig {
    const speedScale: Record<Difficulty, number> = {
      easy: 0.85,
      normal: 1,
      hard: 1.2,
      extreme: 1.35,
    };

    const rotation = rng.float(0, Math.PI * 2);
    const period = rng.float(1.8, 4.2) / speedScale[difficulty];
    const speed = rng.float(0.8, 2.2) * speedScale[difficulty];
    const position = createVec3(rng.float(-sizeHint.x * 0.25, sizeHint.x * 0.25), 1.2, rng.float(-sizeHint.z * 0.25, sizeHint.z * 0.25));

    const sizeByType: Record<ObstacleType, Vec3> = {
      kill_brick: createVec3(Math.max(1.2, sizeHint.x * 0.42), 1, Math.max(1.2, sizeHint.z * 0.42)),
      spinning_bar: createVec3(Math.max(3.2, sizeHint.x * 0.9), 0.4, 0.4),
      pendulum: createVec3(0.9, 3.8, 0.9),
      crusher: createVec3(Math.max(2.4, sizeHint.x * 0.7), 1.2, Math.max(2.4, sizeHint.z * 0.7)),
      laser_beam: createVec3(Math.max(3.4, sizeHint.x * 0.95), 0.2, 0.2),
      wind_zone: createVec3(Math.max(2.8, sizeHint.x * 0.8), 2.4, Math.max(2.8, sizeHint.z * 0.8)),
      moving_wall: createVec3(Math.max(1.2, sizeHint.x * 0.3), 2.8, Math.max(3, sizeHint.z * 0.8)),
    };

    return {
      id: `obstacle-${idSuffix}`,
      type,
      position,
      rotation,
      speed,
      timing: {
        period,
        phase: rng.float(0, period),
      },
      size: sizeByType[type],
    };
  }
}