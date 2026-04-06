import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { Platform } from './Platform';
import { PhysicsWorld } from '../systems/PhysicsWorld';
export class Pendulum extends Platform {
  private anchor: THREE.Vector3; private length: number; private speed: number; private arc: number; private time: number = 0;
  constructor(scene: THREE.Scene, physics: PhysicsWorld, anchorX: number, anchorY: number, anchorZ: number, length: number, speed: number, arc: number, size: number = 2, color: number = 0x424242) {
    super(scene, physics, anchorX, anchorY - length, anchorZ, size, size, color); this.anchor = new THREE.Vector3(anchorX, anchorY, anchorZ); this.length = length; this.speed = speed; this.arc = arc; this.body.type = CANNON.Body.KINEMATIC;
  }
  public update(deltaTime: number): void {
    this.time += deltaTime * this.speed; const angle = Math.sin(this.time) * (this.arc / 2); const x = this.anchor.x + Math.sin(angle) * this.length; const y = this.anchor.y - Math.cos(angle) * this.length; const z = this.anchor.z; this.mesh.position.set(x, y, z); this.body.position.set(x, y, z); this.body.quaternion.setFromEuler(0, 0, angle); this.mesh.rotation.z = angle;
  }
}
