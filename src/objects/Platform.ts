import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from '../systems/PhysicsWorld';
import { GAME_CONFIG } from '../utils/constants';
export class Platform {
  public mesh: THREE.Mesh;
  public body: CANNON.Body;
  protected scene: THREE.Scene;
  protected physics: PhysicsWorld;
  constructor(scene: THREE.Scene, physics: PhysicsWorld, x: number, y: number, z: number, width: number, depth: number, color: number = 0xFFFFFF) {
    this.scene = scene; this.physics = physics;
    const geometry = new THREE.BoxGeometry(width, GAME_CONFIG.generation.platformHeight, depth);
    const material = new THREE.MeshPhongMaterial({ color });
    this.mesh = new THREE.Mesh(geometry, material); this.mesh.position.set(x, y, z); this.mesh.castShadow = true; this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, GAME_CONFIG.generation.platformHeight / 2, depth / 2));
    this.body = new CANNON.Body({ mass: 0, shape: shape }); this.body.position.set(x, y, z); this.physics.addBody(this.body);
  }
  public update(_deltaTime: number): void {}
  public destroy(): void { this.scene.remove(this.mesh); this.physics.removeBody(this.body); }
}
