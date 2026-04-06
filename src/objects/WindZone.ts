import * as THREE from 'three'; import { Platform } from './Platform'; import { PhysicsWorld } from '../systems/PhysicsWorld';
export class WindZone extends Platform {
  private force: THREE.Vector3; private isActive: boolean = true;
  constructor(scene: THREE.Scene, physics: PhysicsWorld, x: number, y: number, z: number, width: number, height: number, depth: number, force: THREE.Vector3, color: number = 0x03A9F4) {
    super(scene, physics, x, y, z, width, depth, color); this.force = force; this.mesh.scale.set(1, height / 1.0, 1); (this.mesh.material as THREE.MeshPhongMaterial).transparent = true; (this.mesh.material as THREE.MeshPhongMaterial).opacity = 0.2; this.body.collisionResponse = false;
  }
  public applyWind(body: any): void { if (this.isActive) body.applyForce(new THREE.Vector3(this.force.x, this.force.y, this.force.z)); }
}
