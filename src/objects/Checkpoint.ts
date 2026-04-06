import * as THREE from 'three'; import { Platform } from './Platform'; import { PhysicsWorld } from '../systems/PhysicsWorld';
export class Checkpoint extends Platform {
  public isActive: boolean = false; private id: number;
  constructor(scene: THREE.Scene, physics: PhysicsWorld, x: number, y: number, z: number, id: number, color: number = 0x9E9E9E) {
    super(scene, physics, x, y, z, 4, 4, color); this.id = id;
    const flagGeom = new THREE.CylinderGeometry(0.1, 0.1, 4); const flagMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 }); const flag = new THREE.Mesh(flagGeom, flagMaterial); flag.position.set(-1.5, 2.5, -1.5); this.mesh.add(flag);
    const bannerGeom = new THREE.BoxGeometry(1.5, 1, 0.1); const bannerMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 }); const banner = new THREE.Mesh(bannerGeom, bannerMaterial); banner.position.set(-0.7, 1.5, 0); flag.add(banner);
  }
  public activate(): void { if (!this.isActive) { this.isActive = true; (this.mesh.material as THREE.MeshPhongMaterial).color.set(0x6BCB77); const banner = this.mesh.children[0].children[0] as THREE.Mesh; (banner.material as THREE.MeshPhongMaterial).color.set(0x6BCB77); } }
  public getId(): number { return this.id; }
}
