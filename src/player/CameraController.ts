import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/constants';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private player: THREE.Group;
  private target: THREE.Vector3 = new THREE.Vector3();
  private distance: number = GAME_CONFIG.camera.defaultDistance;
  private rotationX: number = 0;
  private rotationY: number = 0;

  constructor(camera: THREE.PerspectiveCamera, player: THREE.Group) {
    this.camera = camera;
    this.player = player;
  }

  public update(_deltaTime: number, mouseDelta: { x: number; y: number }): void {
    const mouseSensitivity = GAME_CONFIG.camera.mouseSensitivity;
    this.rotationY -= mouseDelta.x * mouseSensitivity;
    this.rotationX -= mouseDelta.y * mouseSensitivity;
    this.rotationX = Math.max(
      THREE.MathUtils.degToRad(GAME_CONFIG.camera.verticalAngleMin),
      Math.min(THREE.MathUtils.degToRad(GAME_CONFIG.camera.verticalAngleMax), this.rotationX)
    );
    const orbitQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.rotationX, this.rotationY, 0, 'YXZ'));
    const offset = new THREE.Vector3(0, 0, this.distance).applyQuaternion(orbitQuat);
    const targetPos = this.player.position.clone();
    targetPos.y += GAME_CONFIG.camera.heightOffset;
    this.target.lerp(targetPos, GAME_CONFIG.camera.smoothingFactor);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  }

  public getRotationY(): number {
    return this.rotationY;
  }

  public setDistance(distance: number): void {
    this.distance = Math.max(GAME_CONFIG.camera.minDistance, Math.min(GAME_CONFIG.camera.maxDistance, distance));
  }

  public getDistance(): number {
    return this.distance;
  }
}
