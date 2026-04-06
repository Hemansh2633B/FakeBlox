import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { Platform } from './Platform';
import { PhysicsWorld } from '../systems/PhysicsWorld';
export class ConveyorPlatform extends Platform {
  private speed: number; private direction: THREE.Vector3;
  constructor(scene: THREE.Scene, physics: PhysicsWorld, x: number, y: number, z: number, width: number, depth: number, speed: number, direction: THREE.Vector3 = new THREE.Vector3(0, 0, 1), color: number = 0xFFEB3B) {
    super(scene, physics, x, y, z, width, depth, color); this.speed = speed; this.direction = direction.normalize(); this.body.addEventListener('collide', (_e: any) => {});
  }
  public applyConveyorEffect(body: CANNON.Body): void { const pushForce = new CANNON.Vec3(this.direction.x * this.speed, this.direction.y * this.speed, this.direction.z * this.speed); body.velocity.x += pushForce.x * 0.1; body.velocity.z += pushForce.z * 0.1; }
}
