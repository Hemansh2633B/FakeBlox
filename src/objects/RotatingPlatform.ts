import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { Platform } from './Platform';
import { PhysicsWorld } from '../systems/PhysicsWorld';
export class RotatingPlatform extends Platform {
  private rotationSpeed: number;
  constructor(scene: THREE.Scene, physics: PhysicsWorld, x: number, y: number, z: number, width: number, depth: number, rotationSpeed: number, color: number = 0x9C27B0) {
    super(scene, physics, x, y, z, width, depth, color); this.rotationSpeed = rotationSpeed; this.body.type = CANNON.Body.KINEMATIC;
  }
  public update(deltaTime: number): void { this.mesh.rotation.y += this.rotationSpeed * deltaTime; this.body.quaternion.setFromEuler(0, this.mesh.rotation.y, 0); }
}
