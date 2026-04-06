import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { Platform } from './Platform';
import { PhysicsWorld } from '../systems/PhysicsWorld';
export class MovingPlatform extends Platform {
  private startPos: THREE.Vector3; private endPos: THREE.Vector3; private speed: number; private time: number = 0;
  constructor(scene: THREE.Scene, physics: PhysicsWorld, x: number, y: number, z: number, width: number, depth: number, endX: number, endY: number, endZ: number, speed: number, color: number = 0x2196F3) {
    super(scene, physics, x, y, z, width, depth, color); this.startPos = new THREE.Vector3(x, y, z); this.endPos = new THREE.Vector3(endX, endY, endZ); this.speed = speed; this.body.type = CANNON.Body.KINEMATIC;
  }
  public update(deltaTime: number): void {
    this.time += deltaTime * this.speed; const factor = (Math.sin(this.time) + 1) / 2; const newPos = new THREE.Vector3().lerpVectors(this.startPos, this.endPos, factor); this.mesh.position.copy(newPos); this.body.position.set(newPos.x, newPos.y, newPos.z);
  }
}
