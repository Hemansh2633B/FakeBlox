import * as THREE from 'three';
import { Scene } from '../game/Scene';
import { Theme } from '../themes/Theme';

export class DecorationPlacer {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public placeDecoration(theme: Theme, x: number, y: number, z: number): void {
    if (theme.name === 'Grasslands') {
      this.placeTree(x, y, z);
    } else if (theme.name === 'Lava Zone') {
      this.placeRock(x, y, z);
    } else if (theme.name === 'Ice World') {
      this.placeIcicle(x, y, z);
    }
  }

  private placeTree(x: number, y: number, z: number): void {
    const trunkGeom = new THREE.CylinderGeometry(0.2, 0.2, 1);
    const trunkMat = new THREE.MeshPhongMaterial({ color: 0x795548 });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.set(x, y + 0.5, z);
    this.scene.add(trunk);

    const leavesGeom = new THREE.SphereGeometry(1);
    const leavesMat = new THREE.MeshPhongMaterial({ color: 0x4CAF50 });
    const leaves = new THREE.Mesh(leavesGeom, leavesMat);
    leaves.position.set(x, y + 1.5, z);
    this.scene.add(leaves);
  }

  private placeRock(x: number, y: number, z: number): void {
    const rockGeom = new THREE.DodecahedronGeometry(0.8);
    const rockMat = new THREE.MeshPhongMaterial({ color: 0x424242 });
    const rock = new THREE.Mesh(rockGeom, rockMat);
    rock.position.set(x, y + 0.4, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    this.scene.add(rock);
  }

  private placeIcicle(x: number, y: number, z: number): void {
    const icicleGeom = new THREE.ConeGeometry(0.3, 1);
    const icicleMat = new THREE.MeshPhongMaterial({ color: 0xB3E5FC, transparent: true, opacity: 0.8 });
    const icicle = new THREE.Mesh(icicleGeom, icicleMat);
    icicle.position.set(x, y + 0.5, z);
    this.scene.add(icicle);
  }
}
