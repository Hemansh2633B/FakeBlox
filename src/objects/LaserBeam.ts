import * as THREE from 'three'; import * as CANNON from 'cannon-es'; import { Platform } from './Platform'; import { PhysicsWorld } from '../systems/PhysicsWorld';
export class LaserBeam extends Platform {
  private onDuration: number; private offDuration: number; private warningDuration: number; private timer: number = 0; private isActive: boolean = false;
  constructor(scene: THREE.Scene, physics: PhysicsWorld, x: number, y: number, z: number, width: number, height: number, depth: number, onDuration: number, offDuration: number, warningDuration: number, color: number = 0xFF1744) {
    super(scene, physics, x, y, z, width, depth, color); this.onDuration = onDuration; this.offDuration = offDuration; this.warningDuration = warningDuration; this.mesh.scale.set(1, height / 1.0, 1); this.body.type = CANNON.Body.KINEMATIC; (this.mesh.material as THREE.MeshPhongMaterial).transparent = true; (this.mesh.material as THREE.MeshPhongMaterial).opacity = 0.0;
  }
  public update(deltaTime: number): void {
    this.timer += deltaTime; const totalCycle = this.onDuration + this.offDuration; const currentCycleTime = this.timer % totalCycle;
    if (currentCycleTime < this.onDuration) { if (!this.isActive) this.setActive(true); (this.mesh.material as THREE.MeshPhongMaterial).opacity = 1.0; }
    else { if (this.isActive) this.setActive(false); const timeRemainingInOff = totalCycle - currentCycleTime; if (timeRemainingInOff < this.warningDuration) (this.mesh.material as THREE.MeshPhongMaterial).opacity = 0.3 + Math.sin(Date.now() * 0.02) * 0.2; else (this.mesh.material as THREE.MeshPhongMaterial).opacity = 0.0; }
  }
  private setActive(active: boolean): void { this.isActive = active; if (active) this.physics.addBody(this.body); else this.physics.removeBody(this.body); }
}
