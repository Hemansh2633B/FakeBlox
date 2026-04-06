import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { PlayerModel } from './PlayerModel';
import { InputManager } from './InputManager';
import { PhysicsWorld } from '../systems/PhysicsWorld';
import { GAME_CONFIG } from '../utils/constants';

export class PlayerController {
  public body: CANNON.Body;
  public model: PlayerModel;
  private scene: THREE.Scene;
  private physics: PhysicsWorld;
  private input: InputManager;
  private isGrounded: boolean = false;
  private jumpCooldown: number = 0;
  private coyoteTimeLeft: number = 0;
  private jumpBufferLeft: number = 0;
  private respawnInvincibilityLeft: number = 0;
  private setModelOpacity(opacity: number): void {
    this.model.mesh.traverse((child: THREE.Object3D) => {
      if (!(child instanceof THREE.Mesh)) return;
      const material = child.material;
      if (Array.isArray(material)) {
        material.forEach((mat) => {
          mat.transparent = opacity < 1;
          mat.opacity = opacity;
        });
        return;
      }
      material.transparent = opacity < 1;
      material.opacity = opacity;
    });
  }

  constructor(scene: THREE.Scene, physics: PhysicsWorld, input: InputManager) {
    this.scene = scene;
    this.physics = physics;
    this.input = input;
    const radius = GAME_CONFIG.player.capsuleRadius;
    const shape = new CANNON.Sphere(radius);
    this.body = new CANNON.Body({ mass: 1, shape: shape, fixedRotation: true, linearDamping: 0.1 });
    this.body.position.set(0, 5, 0);
    this.physics.addBody(this.body);
    this.model = new PlayerModel();
    this.scene.add(this.model.mesh);
  }

  public update(deltaTime: number, cameraRotationY: number): void {
    if (this.respawnInvincibilityLeft > 0) {
      this.respawnInvincibilityLeft = Math.max(0, this.respawnInvincibilityLeft - deltaTime);
      const flash = 0.4 + Math.abs(Math.sin(Date.now() * 0.03)) * 0.6;
      this.setModelOpacity(flash);
    } else {
      this.setModelOpacity(1);
    }
    this.updateGroundedState();
    this.handleMovement(deltaTime, cameraRotationY);
    this.handleJump(deltaTime);
    this.model.mesh.position.copy(this.body.position as unknown as THREE.Vector3);
    this.model.mesh.position.y -= GAME_CONFIG.player.capsuleRadius;
    const moveVector = this.input.getMovementVector();
    if (moveVector.x !== 0 || moveVector.z !== 0) {
      const targetRotation = Math.atan2(moveVector.x, moveVector.z) + cameraRotationY;
      this.model.mesh.rotation.y = THREE.MathUtils.lerp(this.model.mesh.rotation.y, targetRotation, 0.15);
    }
    const currentSpeed = new THREE.Vector3(this.body.velocity.x, 0, this.body.velocity.z).length();
    this.model.update(deltaTime, currentSpeed, currentSpeed > 0.1, this.isGrounded);
  }

  private updateGroundedState(): void {
    const rayFrom = this.body.position;
    const rayTo = new CANNON.Vec3(rayFrom.x, rayFrom.y - GAME_CONFIG.player.capsuleRadius - GAME_CONFIG.player.groundCheckDistance, rayFrom.z);
    const raycastResult = new CANNON.RaycastResult();
    const rayOptions = { skipBackfaces: true };
    this.physics.world.raycastClosest(rayFrom, rayTo, rayOptions, raycastResult);
    this.isGrounded = raycastResult.hasHit;
    if (this.isGrounded) this.coyoteTimeLeft = GAME_CONFIG.player.coyoteTime;
    else this.coyoteTimeLeft -= 0.016;
  }

  private handleMovement(deltaTime: number, cameraRotationY: number): void {
    const moveVector = this.input.getMovementVector();
    const speed = this.input.isSprint() ? GAME_CONFIG.player.sprintSpeed : GAME_CONFIG.player.walkSpeed;
    const accel = GAME_CONFIG.player.acceleration;
    const decel = GAME_CONFIG.player.deceleration;
    const moveX = moveVector.x * Math.cos(cameraRotationY) + moveVector.z * Math.sin(cameraRotationY);
    const moveZ = moveVector.z * Math.cos(cameraRotationY) - moveVector.x * Math.sin(cameraRotationY);
    const targetVelX = moveX * speed;
    const targetVelZ = moveZ * speed;
    const lerpFactor = (moveVector.x !== 0 || moveVector.z !== 0) ? accel : decel;
    const airControl = this.isGrounded ? 1 : GAME_CONFIG.player.airControlMultiplier;
    this.body.velocity.x = THREE.MathUtils.lerp(this.body.velocity.x, targetVelX, lerpFactor * airControl * deltaTime);
    this.body.velocity.z = THREE.MathUtils.lerp(this.body.velocity.z, targetVelZ, lerpFactor * airControl * deltaTime);
  }

  private handleJump(deltaTime: number): void {
    if (this.input.isJump()) this.jumpBufferLeft = GAME_CONFIG.player.jumpBufferTime;
    else this.jumpBufferLeft -= deltaTime;
    if (this.jumpBufferLeft > 0 && this.coyoteTimeLeft > 0 && this.jumpCooldown <= 0) {
      this.body.velocity.y = GAME_CONFIG.player.jumpForce;
      this.jumpCooldown = 0.2;
      this.coyoteTimeLeft = 0;
      this.jumpBufferLeft = 0;
    }
    if (this.jumpCooldown > 0) this.jumpCooldown -= deltaTime;
    if (!this.input.isJump() && this.body.velocity.y > 0) this.body.velocity.y *= 0.95;
    if (this.body.velocity.y < 0) this.body.velocity.y += GAME_CONFIG.player.gravity * (GAME_CONFIG.player.fallingGravityMultiplier - 1) * deltaTime;
  }

  public respawn(x: number, y: number, z: number): void {
    this.body.position.set(x, y, z);
    this.body.velocity.set(0, 0, 0);
  }

  public setRespawnInvincibility(): void {
    this.respawnInvincibilityLeft = GAME_CONFIG.player.respawnInvincibilityDuration;
  }

  public isInvincible(): boolean {
    return this.respawnInvincibilityLeft > 0;
  }

  public getGroundedState(): boolean {
    return this.isGrounded;
  }

  public getCoyoteTimeLeft(): number {
    return Math.max(0, this.coyoteTimeLeft);
  }
}
