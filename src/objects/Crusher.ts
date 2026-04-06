import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { Platform } from './Platform';
import { PhysicsWorld } from '../systems/PhysicsWorld';
export class Crusher extends Platform {
  private timer: number = 0; private startY: number; private crushHeight: number; private openDuration: number; private crushDuration: number; private retractDuration: number;
  constructor(scene: THREE.Scene, physics: PhysicsWorld, x: number, y: number, z: number, width: number, depth: number, crushHeight: number, openDuration: number, crushDuration: number, retractDuration: number, color: number = 0x9E9E9E) {
    super(scene, physics, x, y, z, width, depth, color); this.startY = y; this.crushHeight = crushHeight; this.openDuration = openDuration; this.crushDuration = crushDuration; this.retractDuration = retractDuration; this.body.type = CANNON.Body.KINEMATIC;
  }
  public update(deltaTime: number): void {
    this.timer += deltaTime; const totalCycle = this.openDuration + this.crushDuration + this.retractDuration; const currentCycleTime = this.timer % totalCycle; let targetY = this.startY;
    if (currentCycleTime < this.openDuration) targetY = this.startY; else if (currentCycleTime < this.openDuration + this.crushDuration) { const factor = (currentCycleTime - this.openDuration) / this.crushDuration; targetY = THREE.MathUtils.lerp(this.startY, this.startY - this.crushHeight, factor); }
    else { const factor = (currentCycleTime - this.openDuration - this.crushDuration) / this.retractDuration; targetY = THREE.MathUtils.lerp(this.startY - this.crushHeight, this.startY, factor); }
    this.mesh.position.y = targetY; this.body.position.y = targetY;
  }
}
