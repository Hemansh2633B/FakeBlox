import { SeededRNG } from './SeededRNG';
import { PlatformPlacement, PlatformPlacer } from './PlatformPlacer';
import { ObstaclePlacer } from './ObstaclePlacer';
import { DecorationPlacer } from './DecorationPlacer';
import { Scene } from '../game/Scene';
import { PhysicsWorld } from '../systems/PhysicsWorld';
import { Platform } from '../objects/Platform';
import { GAME_CONFIG } from '../utils/constants';
import { ThemeManager } from './ThemeManager';
import { Validator } from './Validator';
import { Difficulty } from '../utils/seed';

export interface LevelMetadata {
  platforms: Platform[];
  obstacles: any[];
  placements: PlatformPlacement[];
  checkpointIndices: number[];
  collectiblePositions: { x: number; y: number; z: number }[];
  totalStars: number;
  themeSequence: string[];
}

export class LevelGenerator {
  private rng: SeededRNG;
  private placer: PlatformPlacer;
  private obstaclePlacer: ObstaclePlacer;
  private themeManager: ThemeManager;
  private decorationPlacer: DecorationPlacer;
  private validator: Validator;
  private platforms: Platform[] = [];
  private obstacles: any[] = [];
  private placements: PlatformPlacement[] = [];

  constructor(private readonly scene: Scene, private readonly physics: PhysicsWorld, seed: string) {
    this.rng = new SeededRNG(seed);
    this.placer = new PlatformPlacer(scene, physics, this.rng);
    this.obstaclePlacer = new ObstaclePlacer(scene, physics, this.rng);
    this.themeManager = new ThemeManager(this.rng);
    this.decorationPlacer = new DecorationPlacer(scene);
    this.validator = new Validator();
  }

  public setSeed(seed: string): void {
    this.rng = new SeededRNG(seed);
    this.placer = new PlatformPlacer(this.scene, this.physics, this.rng);
    this.obstaclePlacer = new ObstaclePlacer(this.scene, this.physics, this.rng);
    this.themeManager = new ThemeManager(this.rng);
  }

  private getPlatformCount(difficulty: Difficulty): number {
    if (difficulty === 'easy') return GAME_CONFIG.generation.platformCountEasy;
    if (difficulty === 'hard') return GAME_CONFIG.generation.platformCountHard;
    if (difficulty === 'extreme') return GAME_CONFIG.generation.platformCountExtreme;
    return GAME_CONFIG.generation.platformCountNormal;
  }

  private getCheckpointIntervalRange(difficulty: Difficulty): { min: number; max: number } {
    if (difficulty === 'easy') {
      return { min: GAME_CONFIG.generation.checkpointsPerEasyMin, max: GAME_CONFIG.generation.checkpointsPerEasyMax };
    }
    if (difficulty === 'hard') {
      return { min: GAME_CONFIG.generation.checkpointsPerHardMin, max: GAME_CONFIG.generation.checkpointsPerHardMax };
    }
    if (difficulty === 'extreme') {
      return { min: GAME_CONFIG.generation.checkpointsPerExtremeMin, max: GAME_CONFIG.generation.checkpointsPerExtremeMax };
    }
    return { min: GAME_CONFIG.generation.checkpointsPerNormalMin, max: GAME_CONFIG.generation.checkpointsPerNormalMax };
  }

  private generateCheckpointIndices(difficulty: Difficulty): number[] {
    const indices: number[] = [];
    const range = this.getCheckpointIntervalRange(difficulty);
    for (let i = 1; i < this.placements.length - 2; i += 1) {
      if (this.placements[i].isRestArea && this.rng.nextInt(range.min, range.max) >= range.min + 1) {
        indices.push(i);
      }
    }
    return indices;
  }

  private generateCollectiblePositions(totalStars: number): { x: number; y: number; z: number }[] {
    const positions: { x: number; y: number; z: number }[] = [];
    if (this.placements.length <= 1) return positions;
    const path = this.placements.slice(1);
    for (let i = 0; i < totalStars; i += 1) {
      const target = path[Math.floor(this.rng.next() * path.length)];
      positions.push({
        x: target.position.x + this.rng.nextRange(-0.75, 0.75),
        y: target.position.y + this.rng.nextRange(0.9, 1.8),
        z: target.position.z + this.rng.nextRange(-0.75, 0.75),
      });
    }
    return positions;
  }

  public generate(seed: string, difficulty: Difficulty = 'normal'): LevelMetadata {
    this.setSeed(seed);
    this.clear();

    // Stage 1: Layout Graph (implied in PlatformPlacer)
    const count = this.getPlatformCount(difficulty);
    const themeSequence = this.themeManager.getRandomThemeSequence();

    // Stage 2: Platform Placement
    let attempts = 0;
    do {
      if (attempts > 0) this.clear();
      this.placements = this.placer.generateInitialPath(count, difficulty, themeSequence);
      this.platforms = this.placements.map((placement) => placement.platform);
      attempts += 1;
    } while (!this.validator.validateLevel(this.placements) && attempts < 10);

    // Stage 3: Obstacle Placement
    this.obstacles = this.obstaclePlacer.placeObstacles(this.placements, difficulty);

    // Stage 4: Themes (Handled during Stage 2 & Stage 5)

    // Stage 5: Decoration and Polish
    this.placements.forEach((placement) => {
      if (this.rng.nextBoolean(0.2)) {
        this.decorationPlacer.placeDecoration(
          placement.theme,
          placement.position.x + this.rng.nextRange(-2, 2),
          placement.position.y,
          placement.position.z + this.rng.nextRange(-2, 2)
        );
      }
    });

    const checkpointIndices = this.generateCheckpointIndices(difficulty);
    const totalStars = Math.max(1, Math.round(this.platforms.length * GAME_CONFIG.generation.starsPerPlatformRatio));
    const collectiblePositions = this.generateCollectiblePositions(totalStars);

    return {
      platforms: this.platforms,
      obstacles: this.obstacles,
      placements: this.placements,
      checkpointIndices,
      collectiblePositions,
      totalStars,
      themeSequence: themeSequence.map((theme) => theme.name),
    };
  }

  public clear(): void {
    this.platforms.forEach((platform) => platform.destroy());
    this.obstacles.forEach((obstacle) => obstacle.destroy());
    this.platforms = [];
    this.obstacles = [];
    this.placements = [];
  }

  public getPlatforms(): Platform[] {
    return this.platforms;
  }

  public getObstacles(): any[] {
    return this.obstacles;
  }
}
