import * as THREE from 'three';
import { Platform } from './Platform';
import { PhysicsWorld } from '../systems/PhysicsWorld';
export class IcePlatform extends Platform {
  constructor(scene: THREE.Scene, physics: PhysicsWorld, x: number, y: number, z: number, width: number, depth: number, color: number = 0xB3E5FC) {
    super(scene, physics, x, y, z, width, depth, color); (this.mesh.material as THREE.MeshPhongMaterial).transparent = true; (this.mesh.material as THREE.MeshPhongMaterial).opacity = 0.8;
  }
}
