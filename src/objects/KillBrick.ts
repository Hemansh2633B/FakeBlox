import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { Platform } from './Platform';
import { PhysicsWorld } from '../systems/PhysicsWorld';
export class KillBrick extends Platform {
  constructor(scene: THREE.Scene, physics: PhysicsWorld, x: number, y: number, z: number, width: number, height: number, depth: number, color: number = 0xFF0000) {
    super(scene, physics, x, y, z, width, depth, color); this.mesh.scale.set(1, height, 1); this.physics.removeBody(this.body); const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2)); this.body = new CANNON.Body({ mass: 0, shape: shape }); this.body.position.set(x, y, z); this.physics.addBody(this.body); (this.mesh.material as THREE.MeshPhongMaterial).emissive = new THREE.Color(color); (this.mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.5; this.body.addEventListener('collide', (_e: any) => {});
  }
}
