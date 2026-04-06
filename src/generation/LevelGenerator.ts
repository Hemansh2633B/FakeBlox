import { SeededRNG } from './SeededRNG';
import { PlatformPlacement, PlatformPlacer } from './PlatformPlacer';
import { Scene } from '../game/Scene';
import { PhysicsWorld } from '../systems/PhysicsWorld';
import { Platform } from '../objects/Platform';
import { GAME_CONFIG } from '../utils/constants';
import { ThemeManager } from './ThemeManager';
import { Validator } from './Validator';

export interface LevelMetadata {
  platforms: Platform[];
  placements: PlatformPlacement[];
  checkpointIndices: number[];
  totalStars: number;
  themeSequence: string[];
}

export class LevelGenerator {
  private scene: Scene;
  private physics: PhysicsWorld;
  private rng: SeededRNG;
  private placer: PlatformPlacer;
  private themeManager: ThemeManager;
  private validator: Validator;
  private platforms: Platform[] = [];
  private seed: string;

  constructor(scene: Scene, physics: PhysicsWorld, seed: string) {
    this.scene = scene;
    this.physics = physics;
    this.seed = seed;
    this.rng = new SeededRNG(seed);
    this.placer = new PlatformPlacer(scene, physics, this.rng);
    this.themeManager = new ThemeManager(this.rng);
    this.validator = new Validator();
  }

  public setSeed(seed: string): void {
    this.seed = seed;
    this.rng = new SeededRNG(seed);
    this.placer = new PlatformPlacer(this.scene, this.physics, this.rng);
    this.themeManager = new ThemeManager(this.rng);
  }

  private getPlatformCount(difficulty: string): number {
    if (difficulty === 'easy') return GAME_CONFIG.generation.platformCountEasy;
    if (difficulty === 'hard') return GAME_CONFIG.generation.platformCountHard;
    if (difficulty === 'extreme') return GAME_CONFIG.generation.platformCountExtreme;
    return GAME_CONFIG.generation.platformCountNormal;
  }

  private getMaxGapForDifficulty(difficulty: string): number {
    if (difficulty === 'easy') return GAME_CONFIG.generation.maxGapDistanceEasy;
    if (difficulty === 'hard') return GAME_CONFIG.generation.maxGapDistanceHard;
    if (difficulty === 'extreme') return GAME_CONFIG.generation.maxGapDistanceExtreme;
    return GAME_CONFIG.generation.maxGapDistanceNormal;
  }

  private getCheckpointInterval(difficulty: string): number {
    if (difficulty === 'easy') return GAME_CONFIG.generation.platformsPerCheckpointEasy;
    if (difficulty === 'hard') return GAME_CONFIG.generation.platformsPerCheckpointHard;
    if (difficulty === 'extreme') return GAME_CONFIG.generation.platformsPerCheckpointExtreme;
    return GAME_CONFIG.generation.platformsPerCheckpointNormal;
  }

  public setSeed(seed: string): void {
    this.seed = seed;
  }

  public getSeed(): string {
    return this.seed;
  }

  public generate(difficulty: string = 'normal'): Platform[] {
    this.clear();
    this.rng = new SeededRNG(this.seed);
    this.placer = new PlatformPlacer(this.scene, this.physics, this.rng);

    let count: number = Number(GAME_CONFIG.generation.platformCountNormal);
    if (difficulty === 'easy') count = Number(GAME_CONFIG.generation.platformCountEasy);
    else if (difficulty === 'hard') count = Number(GAME_CONFIG.generation.platformCountHard);
    else if (difficulty === 'extreme') count = Number(GAME_CONFIG.generation.platformCountExtreme);

    this.platforms = this.placer.generateInitialPath(count);
    return this.platforms;
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
