import * as THREE from 'three';
import { Platform } from './Platform';
import { PhysicsWorld } from '../systems/PhysicsWorld';
import { GAME_CONFIG } from '../utils/constants';
export class BouncePlatform extends Platform {
  private bounceMultiplier: number;
  constructor(scene: THREE.Scene, physics: PhysicsWorld, x: number, y: number, z: number, width: number, depth: number, bounceMultiplier: number = GAME_CONFIG.obstacles.bouncePlatform.minBounceMultiplier, color: number = 0x4CAF50) {
    super(scene, physics, x, y, z, width, depth, color); this.bounceMultiplier = bounceMultiplier;
    this.body.addEventListener('collide', (e: any) => { const otherBody = e.body; otherBody.velocity.y = GAME_CONFIG.player.jumpForce * this.bounceMultiplier; });
  }
}
