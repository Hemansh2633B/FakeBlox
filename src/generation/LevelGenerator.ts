import { SeededRNG } from './SeededRNG';
import { PlatformPlacer } from './PlatformPlacer';
import { Scene } from '../game/Scene';
import { PhysicsWorld } from '../systems/PhysicsWorld';
import { Platform } from '../objects/Platform';
import { GAME_CONFIG } from '../utils/constants';

export class LevelGenerator {
  private scene: Scene;
  private physics: PhysicsWorld;
  private rng: SeededRNG;
  private placer: PlatformPlacer;
  private platforms: Platform[] = [];
  private seed: string;

  constructor(scene: Scene, physics: PhysicsWorld, seed: string) {
    this.scene = scene;
    this.physics = physics;
    this.seed = seed;
    this.rng = new SeededRNG(seed);
    this.placer = new PlatformPlacer(scene, physics, this.rng);
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
  }

  public getPlatforms(): Platform[] {
    return this.platforms;
  }
}
