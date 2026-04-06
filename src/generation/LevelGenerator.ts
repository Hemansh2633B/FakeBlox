import { SeededRNG } from './SeededRNG';
import { PlatformPlacement, PlatformPlacer } from './PlatformPlacer';
import { Scene } from '../game/Scene';
import { PhysicsWorld } from '../systems/PhysicsWorld';
import { Platform } from '../objects/Platform';
import { GAME_CONFIG } from '../utils/constants';
import { ThemeManager } from './ThemeManager';
import { Validator } from './Validator';
import { Difficulty } from '../utils/seed';

export interface LevelMetadata {
  platforms: Platform[];
  placements: PlatformPlacement[];
  checkpointIndices: number[];
  collectiblePositions: { x: number; y: number; z: number }[];
  totalStars: number;
  themeSequence: string[];
}

export class LevelGenerator {
  private rng: SeededRNG;
  private placer: PlatformPlacer;
  private themeManager: ThemeManager;
  private validator: Validator;
  private platforms: Platform[] = [];
  private placements: PlatformPlacement[] = [];

  constructor(private readonly scene: Scene, private readonly physics: PhysicsWorld, seed: string) {
    this.rng = new SeededRNG(seed);
    this.placer = new PlatformPlacer(scene, physics, this.rng);
    this.themeManager = new ThemeManager(this.rng);
    this.validator = new Validator();
  }

  public setSeed(seed: string): void {
    this.rng = new SeededRNG(seed);
    this.placer = new PlatformPlacer(this.scene, this.physics, this.rng);
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

  private getCheckpointIntervalRange(difficulty: string): { min: number; max: number } {
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

  private generateCheckpointIndices(difficulty: string): number[] {
    const indices: number[] = [];
    const range = this.getCheckpointIntervalRange(difficulty);
    let i = this.rng.nextInt(range.min, range.max + 1);
    while (i < this.placements.length - 1) {
      indices.push(i);
      i += this.rng.nextInt(range.min, range.max + 1);
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
    if (this.placements.length === 0) return positions;
    const mainPathCount = Math.floor(totalStars * 0.6);
    const detourCount = Math.floor(totalStars * 0.25);
    const secretCount = totalStars - mainPathCount - detourCount;
    const all = this.placements.slice(1);
    for (let i = 0; i < totalStars; i++) {
      const target = all[Math.floor(this.rng.next() * all.length)];
      const isMain = i < mainPathCount;
      const isDetour = i >= mainPathCount && i < mainPathCount + detourCount;
      const offsetX = isMain ? this.rng.nextRange(-0.75, 0.75) : this.rng.nextRange(-3.5, 3.5);
      const offsetZ = isMain ? this.rng.nextRange(-0.75, 0.75) : this.rng.nextRange(-2.5, 2.5);
      const offsetY = isDetour ? this.rng.nextRange(0.6, 1.4) : this.rng.nextRange(0.9, 1.8);
      const secretBoost = i >= totalStars - secretCount ? this.rng.nextRange(2.5, 4.5) : 0;
      positions.push({
        x: target.position.x + offsetX + (secretBoost > 0 ? Math.sign(offsetX || 1) * secretBoost : 0),
        y: target.position.y + offsetY,
        z: target.position.z + offsetZ + (secretBoost > 0 ? Math.sign(offsetZ || 1) * (secretBoost * 0.6) : 0),
      });
    }
    return positions;
  }

  public generate(seed: string, difficulty: Difficulty = 'normal'): LevelMetadata {
    this.setSeed(seed);
    this.clear();

    const count = this.getPlatformCount(difficulty);
    const themeSequence = this.themeManager.getRandomThemeSequence();
    let attempts = 0;
    do {
      if (attempts > 0) this.clear();
      this.placements = this.placer.generateInitialPath(count, difficulty, themeSequence);
      this.platforms = this.placements.map((placement) => placement.platform);
      attempts += 1;
    } while (!this.validator.validateLevel(this.placements) && attempts < 10);

    const checkpointIndices = this.generateCheckpointIndices(difficulty);
    const totalStars = Math.max(1, Math.round(this.platforms.length * GAME_CONFIG.generation.starsPerPlatformRatio));
    const collectiblePositions = this.generateCollectiblePositions(totalStars);

    return {
      platforms: this.platforms,
      placements: this.placements,
      checkpointIndices,
      collectiblePositions,
      totalStars,
      themeSequence: themeSequence.map((theme) => theme.name),
    };
  }

  public clear(): void {
    this.platforms.forEach((platform) => platform.destroy());
    this.platforms = [];
    this.placements = [];
  }

  public getPlatforms(): Platform[] {
    return this.platforms;
  }
}
