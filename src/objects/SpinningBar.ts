import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { Platform } from './Platform';
import { PhysicsWorld } from '../systems/PhysicsWorld';
export class SpinningBar extends Platform {
  private rotationSpeed: number;
  constructor(scene: THREE.Scene, physics: PhysicsWorld, x: number, y: number, z: number, length: number, rotationSpeed: number, color: number = 0xFF5722) {
    super(scene, physics, x, y, z, length, 0.5, color); this.rotationSpeed = rotationSpeed; this.body.type = CANNON.Body.KINEMATIC;
  }
  public update(deltaTime: number): void { this.mesh.rotation.y += this.rotationSpeed * deltaTime; this.body.quaternion.setFromEuler(0, this.mesh.rotation.y, 0); }
}
