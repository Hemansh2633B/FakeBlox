import * as THREE from 'three';
import { Platform } from './Platform';
import { PhysicsWorld } from '../systems/PhysicsWorld';
export class AppearingPlatform extends Platform {
  private visibleDuration: number; private hiddenDuration: number; private timer: number = 0; private isVisible: boolean = true;
  constructor(scene: THREE.Scene, physics: PhysicsWorld, x: number, y: number, z: number, width: number, depth: number, visibleDuration: number, hiddenDuration: number, color: number = 0x00BCD4) {
    super(scene, physics, x, y, z, width, depth, color); this.visibleDuration = visibleDuration; this.hiddenDuration = hiddenDuration; (this.mesh.material as THREE.MeshPhongMaterial).transparent = true;
  }
  public update(deltaTime: number): void {
    this.timer += deltaTime; const totalCycle = this.visibleDuration + this.hiddenDuration; const currentCycleTime = this.timer % totalCycle;
    if (currentCycleTime < this.visibleDuration) { if (!this.isVisible) this.setVisibility(true); const remainingTime = this.visibleDuration - currentCycleTime; (this.mesh.material as THREE.MeshPhongMaterial).opacity = remainingTime < 0.5 ? remainingTime / 0.5 : 1.0; }
    else { if (this.isVisible) this.setVisibility(false); const timeInHidden = currentCycleTime - this.visibleDuration; (this.mesh.material as THREE.MeshPhongMaterial).opacity = this.hiddenDuration - timeInHidden < 0.5 ? (this.hiddenDuration - timeInHidden) / 0.5 : 0.0; }
  }
  private setVisibility(visible: boolean): void { this.isVisible = visible; this.mesh.visible = visible; if (visible) this.physics.addBody(this.body); else this.physics.removeBody(this.body); }
}
