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
  private seed: string;
  private scene: Scene;
  private physics: PhysicsWorld;
  private rng: SeededRNG;
  private placer: PlatformPlacer;
  private themeManager: ThemeManager;
  private validator: Validator;
  private platforms: Platform[] = [];

  constructor(scene: Scene, physics: PhysicsWorld, seed: string) {
    this.seed = seed;
    this.scene = scene;
    this.physics = physics;
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

  public setSeed(seed: string): void {
    this.seed = seed;
    this.rng = new SeededRNG(seed);
    this.placer = new PlatformPlacer(this.scene, this.physics, this.rng);
  }

  public generate(difficulty: string = 'normal'): Platform[] {
    this.clear();
    this.setSeed(this.seed);

    let count: number = GAME_CONFIG.generation.platformCountNormal;
    if (difficulty === 'easy') count = GAME_CONFIG.generation.platformCountEasy;
    else if (difficulty === 'hard') count = GAME_CONFIG.generation.platformCountHard;
    else if (difficulty === 'extreme') count = GAME_CONFIG.generation.platformCountExtreme;

    this.platforms = this.placer.generateInitialPath(count);
    return this.platforms;
  }

  public clear(): void {
    this.platforms.forEach((p) => p.destroy());
    this.platforms = [];
    this.placements = [];
  }

  public getPlatforms(): Platform[] {
    return this.platforms;
  }
}
