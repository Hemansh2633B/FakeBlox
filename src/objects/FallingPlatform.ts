import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { Platform } from './Platform';
import { PhysicsWorld } from '../systems/PhysicsWorld';
import { GAME_CONFIG } from '../utils/constants';
export class FallingPlatform extends Platform {
  private timer: number = 0; private isFalling: boolean = false; private startY: number; private isTriggered: boolean = false;
  constructor(scene: THREE.Scene, physics: PhysicsWorld, x: number, y: number, z: number, width: number, depth: number, color: number = 0xFF9800) {
    super(scene, physics, x, y, z, width, depth, color); this.startY = y; this.body.addEventListener('collide', () => { this.isTriggered = true; });
  }
  public update(deltaTime: number): void {
    if (this.isTriggered) {
      this.timer += deltaTime; const shakeDelay = GAME_CONFIG.obstacles.fallingPlatform.triggerDelay; const shakeDuration = GAME_CONFIG.obstacles.fallingPlatform.shakeDuration; const respawnDelay = GAME_CONFIG.obstacles.fallingPlatform.respawnDelay;
      if (this.timer > shakeDelay && this.timer < shakeDelay + shakeDuration) { this.mesh.position.x += (Math.random() - 0.5) * 0.1; this.mesh.position.z += (Math.random() - 0.5) * 0.1; }
      else if (this.timer >= shakeDelay + shakeDuration && !this.isFalling) { this.isFalling = true; this.body.type = CANNON.Body.DYNAMIC; this.body.mass = 1; this.body.updateMassProperties(); }
      else if (this.timer >= shakeDelay + shakeDuration + respawnDelay) { this.reset(); }
    }
  }
  private reset(): void { this.timer = 0; this.isFalling = false; this.isTriggered = false; this.body.type = CANNON.Body.STATIC; this.body.mass = 0; this.body.updateMassProperties(); this.body.position.set(this.mesh.position.x, this.startY, this.mesh.position.z); this.body.velocity.set(0, 0, 0); this.body.angularVelocity.set(0, 0, 0); this.body.quaternion.set(0, 0, 0, 1); this.mesh.position.y = this.startY; this.mesh.rotation.set(0, 0, 0); }
}
