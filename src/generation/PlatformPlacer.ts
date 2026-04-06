import * as THREE from 'three';
import { SeededRNG } from './SeededRNG';
import { Platform } from '../objects/Platform';
import { Scene } from '../game/Scene';
import { PhysicsWorld } from '../systems/PhysicsWorld';
import { GAME_CONFIG } from '../utils/constants';

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
  public generateInitialPath(count: number): Platform[] {
    const platforms: Platform[] = [];
    let currentPos = new THREE.Vector3(0, 0, 0);
    platforms.push(this.placePlatform(0, 0, 0, 8, 8, 0x888888));
    for (let i = 1; i < count; i++) {
      const horizontalGap = this.rng.nextRange(2, GAME_CONFIG.generation.maxGapDistanceNormal);
      const verticalGap = this.rng.nextRange(-1, 2);
      const lateralOffset = this.rng.nextRange(-3, 3);
      const width = this.rng.nextRange(GAME_CONFIG.generation.minPlatformWidth, 4);
      const depth = this.rng.nextRange(GAME_CONFIG.generation.minPlatformDepth, 4);
      currentPos.x += lateralOffset;
      currentPos.y += verticalGap;
      currentPos.z += horizontalGap + depth / 2;
      platforms.push(this.placePlatform(currentPos.x, currentPos.y, currentPos.z, width, depth, 0x4CAF50));
      currentPos.z += depth / 2;
    }
    return platforms;
  }
}
