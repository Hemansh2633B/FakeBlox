import { SeededRNG } from './SeededRNG';
import { PlatformPlacer } from './PlatformPlacer';
import { Scene } from '../game/Scene';
import { PhysicsWorld } from '../systems/PhysicsWorld';
import { Platform } from '../objects/Platform';
import { GAME_CONFIG } from '../utils/constants';

export class LevelGenerator {
  private seed: string;
  private scene: Scene;
  private physics: PhysicsWorld;
  private rng: SeededRNG;
  private placer: PlatformPlacer;
  private platforms: Platform[] = [];

  constructor(scene: Scene, physics: PhysicsWorld, seed: string) {
    this.seed = seed;
    this.scene = scene;
    this.physics = physics;
    this.rng = new SeededRNG(seed);
    this.placer = new PlatformPlacer(scene, physics, this.rng);
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
  }

  public getPlatforms(): Platform[] {
    return this.platforms;
  }
}
