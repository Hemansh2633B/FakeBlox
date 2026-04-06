import * as THREE from 'three';
import { SeededRNG } from './SeededRNG';
import { Platform } from '../objects/Platform';
import { Scene } from '../game/Scene';
import { PhysicsWorld } from '../systems/PhysicsWorld';
import { GAME_CONFIG } from '../utils/constants';
import { Theme } from '../themes/Theme';

export interface PlatformPlacement {
  platform: Platform;
  position: THREE.Vector3;
  width: number;
  depth: number;
  sectionIndex: number;
  theme: Theme;
}

export class PlatformPlacer {
  private scene: Scene;
  private physics: PhysicsWorld;
  private rng: SeededRNG;
  constructor(scene: Scene, physics: PhysicsWorld, rng: SeededRNG) {
    this.scene = scene;
    this.physics = physics;
    this.rng = rng;
  }
  public placePlatform(x: number, y: number, z: number, width: number, depth: number, color: number = 0xFFFFFF): Platform {
    return new Platform(this.scene.scene, this.physics, x, y, z, width, depth, color);
  }

  private getMaxGapForDifficulty(difficulty: string): number {
    if (difficulty === 'easy') return GAME_CONFIG.generation.maxGapDistanceEasy;
    if (difficulty === 'hard') return GAME_CONFIG.generation.maxGapDistanceHard;
    if (difficulty === 'extreme') return GAME_CONFIG.generation.maxGapDistanceExtreme;
    return GAME_CONFIG.generation.maxGapDistanceNormal;
  }

  public generateInitialPath(count: number, difficulty: string, themes: Theme[]): PlatformPlacement[] {
    const placements: PlatformPlacement[] = [];
    const maxGap = this.getMaxGapForDifficulty(difficulty);
    const sectionSize = GAME_CONFIG.generation.platformsPerSection;
    let currentPos = new THREE.Vector3(0, 0, 0);
    const spawnTheme = themes[0];
    const spawnPlatform = this.placePlatform(0, 0, 0, 8, 8, spawnTheme.accentColor);
    placements.push({
      platform: spawnPlatform,
      position: spawnPlatform.mesh.position.clone(),
      width: 8,
      depth: 8,
      sectionIndex: 0,
      theme: spawnTheme,
    });

    for (let i = 1; i < count; i++) {
      const sectionIndex = Math.floor(i / sectionSize);
      const theme = themes[sectionIndex % themes.length];
      const horizontalGap = this.rng.nextRange(GAME_CONFIG.generation.minGapDistance, maxGap);
      const verticalGap = this.rng.nextRange(-2, GAME_CONFIG.generation.maxUpwardGap);
      const lateralOffset = this.rng.nextRange(-5, 5);
      const width = this.rng.nextRange(GAME_CONFIG.generation.minPlatformWidth, GAME_CONFIG.generation.maxPlatformWidth);
      const depth = this.rng.nextRange(GAME_CONFIG.generation.minPlatformDepth, GAME_CONFIG.generation.maxPlatformDepth);
      currentPos.x += lateralOffset;
      currentPos.y += verticalGap;
      currentPos.z += horizontalGap + depth / 2;
      const platform = this.placePlatform(currentPos.x, currentPos.y, currentPos.z, width, depth, theme.primaryColor);
      placements.push({
        platform,
        position: platform.mesh.position.clone(),
        width,
        depth,
        sectionIndex,
        theme,
      });
      currentPos.z += depth / 2;
    }
    return placements;
  }
}
