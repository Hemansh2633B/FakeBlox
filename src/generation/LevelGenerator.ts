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
  private seed: string;
  private rng: SeededRNG;
  private placer: PlatformPlacer;
  private themeManager: ThemeManager;
  private validator: Validator;
  private platforms: Platform[] = [];
  private placements: PlatformPlacement[] = [];

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

  public generate(seed: string, difficulty: string = 'normal'): LevelMetadata {
    this.clear();
    this.seed = seed;
    this.rng = new SeededRNG(this.seed);
    this.themeManager = new ThemeManager(this.rng);
    this.validator = new Validator();
    this.placer = new PlatformPlacer(this.scene, this.physics, this.rng);

    const count = this.getPlatformCount(difficulty);
    const maxGap = this.getMaxGapForDifficulty(difficulty);
    const maxValidatedGap = Math.min(
      maxGap,
      (GAME_CONFIG.player.sprintSpeed * 0.8) - GAME_CONFIG.generation.safetyMarginHorizontal,
    );

    const themeSequence = this.themeManager.getRandomThemeSequence();
    let attempts = 0;
    do {
      if (attempts > 0) this.clear();
      this.placements = this.placer.generateInitialPath(count, difficulty, themeSequence);
      this.platforms = this.placements.map((placement) => placement.platform);
      attempts += 1;
    } while (!this.validator.validateLevel(this.placements, maxValidatedGap) && attempts < 5);

    const checkpointInterval = this.getCheckpointInterval(difficulty);
    const checkpointIndices: number[] = [];
    for (let i = checkpointInterval; i < this.placements.length; i += checkpointInterval) {
      checkpointIndices.push(i);
    }

    return {
      platforms: this.platforms,
      placements: this.placements,
      checkpointIndices,
      totalStars: Math.max(1, Math.round(this.platforms.length * GAME_CONFIG.generation.starsPerPlatformRatio)),
      themeSequence: themeSequence.map((theme) => theme.name),
    };
  }
  public clear(): void {
    this.platforms.forEach(p => p.destroy());
    this.platforms = [];
    this.placements = [];
  }
  public getPlatforms(): Platform[] {
    return this.platforms;
  }
}
