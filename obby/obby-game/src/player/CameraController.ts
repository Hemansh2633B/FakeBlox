import { MathUtils, PerspectiveCamera, Vector3 } from 'three';
import type { InputManager } from './InputManager';

export interface CameraControllerOptions {
  sensitivity?: number;
  distance?: number;
  height?: number;
  shoulderOffset?: number;
  minPitch?: number;
  maxPitch?: number;
  smoothing?: number;
  invertY?: boolean;
}

const WORLD_UP = new Vector3(0, 1, 0);

export class CameraController {
  public yaw = 0;
  public pitch = 0;

  private readonly targetPosition = new Vector3();
  private readonly desiredPosition = new Vector3();
  private readonly currentLookTarget = new Vector3();
  private readonly desiredLookTarget = new Vector3();
  private readonly forward = new Vector3();
  private readonly right = new Vector3();

  private readonly sensitivity: number;
  private readonly distance: number;
  private readonly height: number;
  private readonly shoulderOffset: number;
  private readonly minPitch: number;
  private readonly maxPitch: number;
  private readonly smoothing: number;
  private readonly invertY: boolean;

  public constructor(
    public readonly camera: PerspectiveCamera,
    options: CameraControllerOptions = {},
  ) {
    this.sensitivity = options.sensitivity ?? 0.0024;
    this.distance = options.distance ?? 5.5;
    this.height = options.height ?? 1.6;
    this.shoulderOffset = options.shoulderOffset ?? 0.65;
    this.minPitch = options.minPitch ?? -1.2;
    this.maxPitch = options.maxPitch ?? 1.05;
    this.smoothing = options.smoothing ?? 10;
    this.invertY = options.invertY ?? false;
  }

  public setRotation(yaw: number, pitch: number): void {
    this.yaw = yaw;
    this.pitch = MathUtils.clamp(pitch, this.minPitch, this.maxPitch);
  }

  public getForwardOnPlane(out = new Vector3()): Vector3 {
    out.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    return out.normalize();
  }

  public getRightOnPlane(out = new Vector3()): Vector3 {
    return this.getForwardOnPlane(this.forward).cross(WORLD_UP).normalize().copy(this.forward);
  }

  public update(dt: number, input: InputManager, target: Vector3): void {
    this.yaw -= input.lookX * this.sensitivity;
    const pitchDelta = input.lookY * this.sensitivity * (this.invertY ? 1 : -1);
    this.pitch = MathUtils.clamp(
      this.pitch + pitchDelta,
      this.minPitch,
      this.maxPitch,
    );

    const smoothAlpha = 1 - Math.exp(-this.smoothing * Math.max(dt, 0));

    this.targetPosition.copy(target);
    this.targetPosition.y += this.height;

    this.forward.set(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch),
    ).normalize();

    this.right.crossVectors(this.forward, WORLD_UP).normalize();

    this.desiredPosition
      .copy(this.targetPosition)
      .addScaledVector(this.right, this.shoulderOffset)
      .addScaledVector(this.forward, -this.distance);

    this.desiredLookTarget.copy(this.targetPosition).addScaledVector(this.forward, 3);

    this.camera.position.lerp(this.desiredPosition, smoothAlpha);
    this.currentLookTarget.lerpVectors(
      this.currentLookTarget.lengthSq() === 0 ? this.desiredLookTarget : this.currentLookTarget,
      this.desiredLookTarget,
      smoothAlpha,
    );
    this.camera.lookAt(this.currentLookTarget);
  }
}