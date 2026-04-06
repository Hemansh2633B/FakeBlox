import { SeededRNG } from './SeededRNG';
import { PlatformPlacer } from './PlatformPlacer';
import { ObstaclePlacer } from './ObstaclePlacer';
import { Scene } from '../game/Scene';
import { PhysicsWorld } from '../systems/PhysicsWorld';
import { GAME_CONFIG } from '../utils/constants';
import { ThemeManager } from './ThemeManager';
import { Difficulty } from '../utils/seed';

export class EndlessGenerator {
  private rng: SeededRNG;
  private placer: PlatformPlacer;
  private obstaclePlacer: ObstaclePlacer;
  private themeManager: ThemeManager;
  private currentZ: number = 0;
  private sectionCount: number = 0;

  constructor(
    private readonly scene: Scene,
    private readonly physics: PhysicsWorld,
    seed: string
  ) {
    this.rng = new SeededRNG(seed);
    this.placer = new PlatformPlacer(scene, physics, this.rng);
    this.obstaclePlacer = new ObstaclePlacer(scene, physics, this.rng);
    this.themeManager = new ThemeManager(this.rng);
  }

  public generateChunk(difficulty: Difficulty = 'normal'): any[] {
    const count = GAME_CONFIG.generation.endlessChunkSize;
    const themeSequence = this.themeManager.getRandomThemeSequence();
    const theme = themeSequence[this.sectionCount % themeSequence.length];

    // Simple linear generation for chunk
    const placements = this.placer.generateInitialPath(count, difficulty, [theme]);
    // Offset placements by currentZ
    placements.forEach(p => {
        p.platform.mesh.position.z += this.currentZ;
        p.platform.body.position.z += this.currentZ;
        p.position.z += this.currentZ;
    });

    const obstacles = this.obstaclePlacer.placeObstacles(placements, difficulty);

    const lastPlacement = placements[placements.length - 1];
    this.currentZ = lastPlacement.position.z + lastPlacement.depth / 2;
    this.sectionCount++;

    return [...placements.map(p => p.platform), ...obstacles];
  }

  public reset(seed: string): void {
    this.rng = new SeededRNG(seed);
    this.placer = new PlatformPlacer(this.scene, this.physics, this.rng);
    this.obstaclePlacer = new ObstaclePlacer(this.scene, this.physics, this.rng);
    this.currentZ = 0;
    this.sectionCount = 0;
  }
}
