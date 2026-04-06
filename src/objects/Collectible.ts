import * as THREE from 'three'; import { Platform } from './Platform'; import { PhysicsWorld } from '../systems/PhysicsWorld';
export class Collectible extends Platform {
  public isCollected: boolean = false;
  constructor(scene: THREE.Scene, physics: PhysicsWorld, x: number, y: number, z: number, color: number = 0xFFD700) {
    super(scene, physics, x, y, z, 0.8, 0.8, color); this.mesh.geometry = new THREE.OctahedronGeometry(0.5); (this.mesh.material as THREE.MeshPhongMaterial).emissive = new THREE.Color(color); (this.mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.5; this.body.collisionResponse = false;
  }
  public update(deltaTime: number): void { if (!this.isCollected) { this.mesh.rotation.y += 2 * deltaTime; this.mesh.position.y += Math.sin(Date.now() * 0.005) * 0.002; } }
  public collect(): void { if (!this.isCollected) { this.isCollected = true; this.mesh.visible = false; this.physics.removeBody(this.body); } }
}
