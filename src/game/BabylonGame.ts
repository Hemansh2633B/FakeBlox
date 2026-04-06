import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh, MeshBuilder } from '@babylonjs/core/Meshes';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Scene } from '@babylonjs/core/scene';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import RAPIER from '@dimforge/rapier3d-compat';

interface RapierMeshBinding {
  mesh: Mesh;
  body: RAPIER.RigidBody;
}

const MOVEMENT = {
  walkSpeed: 16,
  sprintSpeed: 24,
  acceleration: 80,
  deceleration: 60,
  airControlMultiplier: 0.65,
  jumpForce: 15,
  gravity: -30,
  maxFallSpeed: -50,
  coyoteTime: 0.12,
  jumpBufferTime: 0.1,
  variableJumpMinMultiplier: 0.6,
  fallingGravityMultiplier: 1.5,
} as const;

/**
 * Babylon.js + Rapier bootstrap game loop.
 * This class is intentionally self-contained so we can migrate feature systems
 * from the legacy Three.js stack incrementally.
 */
export class BabylonGame {
  private readonly engine: Engine;
  private readonly scene: Scene;
  private readonly camera: ArcRotateCamera;
  private readonly keyState: Record<string, boolean> = {};
  private readonly keyPressedThisFrame: Record<string, boolean> = {};
  private rapierWorld: RAPIER.World | null = null;
  private playerBinding: RapierMeshBinding | null = null;
  private isGrounded: boolean = false;
  private coyoteTimeLeft: number = 0;
  private jumpBufferLeft: number = 0;
  private pauseSimulation: boolean = false;
  private readonly spawnPoint = new Vector3(0, 4.5, 0);
  private smoothedTarget = new Vector3(0, 1.5, 0);

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new Scene(this.engine);
    this.scene.clearColor.set(0.07, 0.08, 0.12, 1);

    this.camera = new ArcRotateCamera('camera', -Math.PI / 2, 1.15, 10, new Vector3(0, 1.5, 0), this.scene);
    this.camera.lowerRadiusLimit = 5;
    this.camera.upperRadiusLimit = 20;
    this.camera.lowerBetaLimit = this.degToRad(10);
    this.camera.upperBetaLimit = this.degToRad(80);
    this.camera.wheelPrecision = 20;
    this.camera.panningSensibility = 0;
    this.camera.attachControl(this.canvas, true);

    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
    hemi.intensity = 0.6;
    hemi.diffuse = new Color3(0.72, 0.84, 1.0);
    hemi.groundColor = new Color3(0.16, 0.16, 0.2);

    const sun = new DirectionalLight('sun', new Vector3(-0.5, -1.0, 0.2), this.scene);
    sun.position = new Vector3(20, 30, -10);
    sun.intensity = 1.0;
    const shadows = new ShadowGenerator(2048, sun);
    shadows.useBlurExponentialShadowMap = true;
    shadows.blurKernel = 24;

    this.setupInput();
    void this.initializeRapier(shadows);

    this.engine.runRenderLoop(() => {
      this.update();
      this.scene.render();
    });
    window.addEventListener('resize', () => this.engine.resize());
  }

  private degToRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private async initializeRapier(shadows: ShadowGenerator): Promise<void> {
    try {
      await RAPIER.init();
      this.rapierWorld = new RAPIER.World(new RAPIER.Vector3(0, MOVEMENT.gravity, 0));
      this.spawnWorldGeometry(shadows);
    } catch (error) {
      console.error('Rapier failed to initialize:', error);
      this.showEngineWarning();
      throw error;
    }
  }

  private setupInput(): void {
    window.addEventListener('keydown', (event) => {
      if (!this.keyState[event.code]) this.keyPressedThisFrame[event.code] = true;
      this.keyState[event.code] = true;
      if (event.code === 'Escape') this.pauseSimulation = !this.pauseSimulation;
      if (event.code === 'KeyR') this.resetPlayerToSpawn();
    });
    window.addEventListener('keyup', (event) => {
      this.keyState[event.code] = false;
    });
  }

  private spawnWorldGeometry(shadows: ShadowGenerator): void {
    if (!this.rapierWorld) return;

    const platformMat = new StandardMaterial('platformMat', this.scene);
    platformMat.diffuseColor = new Color3(0.31, 0.67, 0.34);
    const accentMat = new StandardMaterial('accentMat', this.scene);
    accentMat.diffuseColor = new Color3(0.96, 0.82, 0.45);

    const platformLayout = [
      { x: 0, y: 0, z: 0, w: 10, h: 1, d: 10 },
      { x: 3, y: 1.5, z: 8, w: 5, h: 1, d: 5 },
      { x: -2, y: 2.8, z: 15, w: 4, h: 1, d: 4 },
      { x: 2, y: 4.2, z: 22, w: 6, h: 1, d: 4 },
    ];

    for (let i = 0; i < platformLayout.length; i += 1) {
      const platform = platformLayout[i];
      const mesh = MeshBuilder.CreateBox(`platform_${i}`, {
        width: platform.w, height: platform.h, depth: platform.d,
      }, this.scene);
      mesh.position.set(platform.x, platform.y, platform.z);
      mesh.material = i === 0 ? accentMat : platformMat;
      mesh.receiveShadows = true;
      shadows.addShadowCaster(mesh, true);

      const body = this.rapierWorld.createRigidBody(
        new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Fixed)
          .setTranslation(platform.x, platform.y, platform.z),
      );
      this.rapierWorld.createCollider(
        RAPIER.ColliderDesc.cuboid(platform.w / 2, platform.h / 2, platform.d / 2)
          .setFriction(0.85)
          .setRestitution(0),
        body,
      );
    }

    const playerRoot = new Mesh('playerRoot', this.scene);
    this.createBlockyPlayerVisual(playerRoot, shadows);

    const playerBody = this.rapierWorld.createRigidBody(
      new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Dynamic)
        .setTranslation(this.spawnPoint.x, this.spawnPoint.y, this.spawnPoint.z)
        .setLinearDamping(0.2)
        .setCanSleep(false),
    );
    this.rapierWorld.createCollider(
      RAPIER.ColliderDesc.capsule(0.5, 0.4).setFriction(0.4),
      playerBody,
    );

    this.playerBinding = { mesh: playerRoot, body: playerBody };
  }

  private showEngineWarning(): void {
    const warning = document.createElement('div');
    warning.textContent = 'Rapier physics failed to load. Check your deployment static asset path.';
    warning.style.position = 'fixed';
    warning.style.bottom = '12px';
    warning.style.left = '12px';
    warning.style.padding = '10px 12px';
    warning.style.background = 'rgba(15, 15, 20, 0.8)';
    warning.style.border = '1px solid rgba(255, 180, 100, 0.9)';
    warning.style.borderRadius = '8px';
    warning.style.color = '#ffd1a0';
    warning.style.fontFamily = 'sans-serif';
    warning.style.fontSize = '13px';
    warning.style.zIndex = '1000';
    document.body.appendChild(warning);
  }

  private createBlockyPlayerVisual(parent: Mesh, shadows: ShadowGenerator): void {
    const skin = new StandardMaterial('playerSkin', this.scene);
    skin.diffuseColor = new Color3(1.0, 0.84, 0.54);
    const shirt = new StandardMaterial('playerShirt', this.scene);
    shirt.diffuseColor = new Color3(0.43, 0.79, 0.45);
    const pants = new StandardMaterial('playerPants', this.scene);
    pants.diffuseColor = new Color3(0.3, 0.59, 1.0);

    const torso = MeshBuilder.CreateBox('torso', { width: 0.95, height: 1.05, depth: 0.52 }, this.scene);
    torso.material = shirt;
    torso.position.y = 0.55;
    torso.parent = parent;

    const head = MeshBuilder.CreateBox('head', { width: 0.85, height: 0.85, depth: 0.85 }, this.scene);
    head.material = skin;
    head.position.y = 1.45;
    head.parent = parent;

    const leftArm = MeshBuilder.CreateBox('leftArm', { width: 0.35, height: 1.02, depth: 0.35 }, this.scene);
    leftArm.material = skin;
    leftArm.position.set(-0.68, 0.52, 0);
    leftArm.parent = parent;

    const rightArm = leftArm.clone('rightArm');
    rightArm.position.x = 0.68;
    rightArm.parent = parent;

    const leftLeg = MeshBuilder.CreateBox('leftLeg', { width: 0.38, height: 0.95, depth: 0.38 }, this.scene);
    leftLeg.material = pants;
    leftLeg.position.set(-0.24, -0.48, 0);
    leftLeg.parent = parent;

    const rightLeg = leftLeg.clone('rightLeg');
    rightLeg.position.x = 0.24;
    rightLeg.parent = parent;

    [torso, head, leftArm, rightArm, leftLeg, rightLeg].forEach((mesh) => {
      mesh.receiveShadows = true;
      shadows.addShadowCaster(mesh, true);
    });
  }

  private update(): void {
    if (!this.rapierWorld || !this.playerBinding) return;
    if (this.pauseSimulation) return;

    const player = this.playerBinding.body;
    const forward = this.keyState.KeyW || this.keyState.ArrowUp ? 1 : 0;
    const backward = this.keyState.KeyS || this.keyState.ArrowDown ? 1 : 0;
    const left = this.keyState.KeyA || this.keyState.ArrowLeft ? 1 : 0;
    const right = this.keyState.KeyD || this.keyState.ArrowRight ? 1 : 0;
    const moveX = right - left;
    const moveZ = forward - backward;

    const speed = (this.keyState.ShiftLeft || this.keyState.ShiftRight) ? MOVEMENT.sprintSpeed : MOVEMENT.walkSpeed;
    const deltaTime = this.engine.getDeltaTime() / 1000;
    const vel = player.linvel();

    const cameraForward = new Vector3(Math.sin(this.camera.alpha), 0, Math.cos(this.camera.alpha));
    const cameraRight = new Vector3(cameraForward.z, 0, -cameraForward.x);
    const desiredMove = cameraForward.scale(moveZ).add(cameraRight.scale(moveX));
    if (desiredMove.lengthSquared() > 1) desiredMove.normalize();
    const targetX = desiredMove.x * speed;
    const targetZ = desiredMove.z * speed;

    const hasMovementInput = moveX !== 0 || moveZ !== 0;
    const appliedAccel = hasMovementInput ? MOVEMENT.acceleration : MOVEMENT.deceleration;
    const airControl = this.isGrounded ? 1 : MOVEMENT.airControlMultiplier;
    const blend = Math.min(1, appliedAccel * airControl * deltaTime);

    const newVelX = vel.x + ((targetX - vel.x) * blend);
    const newVelZ = vel.z + ((targetZ - vel.z) * blend);

    const ray = new RAPIER.Ray(player.translation(), new RAPIER.Vector3(0, -1, 0));
    const hit = this.rapierWorld.castRay(ray, 1.2, true);
    this.isGrounded = !!hit;
    if (this.isGrounded) this.coyoteTimeLeft = MOVEMENT.coyoteTime;
    else this.coyoteTimeLeft = Math.max(0, this.coyoteTimeLeft - deltaTime);

    if (this.keyPressedThisFrame.Space) {
      this.jumpBufferLeft = MOVEMENT.jumpBufferTime;
    } else {
      this.jumpBufferLeft = Math.max(0, this.jumpBufferLeft - deltaTime);
    }

    let newVelY = vel.y;
    if (this.jumpBufferLeft > 0 && this.coyoteTimeLeft > 0) {
      newVelY = MOVEMENT.jumpForce;
      this.jumpBufferLeft = 0;
      this.coyoteTimeLeft = 0;
    }

    if (!this.keyState.Space && newVelY > 0) {
      const minJumpCap = MOVEMENT.jumpForce * MOVEMENT.variableJumpMinMultiplier;
      newVelY = Math.max(minJumpCap, newVelY * 0.82);
    }

    if (newVelY < 0) {
      newVelY += MOVEMENT.gravity * (MOVEMENT.fallingGravityMultiplier - 1) * deltaTime;
    }
    newVelY = Math.max(MOVEMENT.maxFallSpeed, newVelY);

    player.setLinvel(new RAPIER.Vector3(newVelX, newVelY, newVelZ), true);

    this.rapierWorld.timestep = 1 / 60;
    this.rapierWorld.step();

    const p = player.translation();
    this.playerBinding.mesh.position.set(p.x, p.y - 0.9, p.z);
    if (Math.abs(newVelX) + Math.abs(newVelZ) > 0.05) {
      const targetYaw = Math.atan2(newVelX, newVelZ);
      const rotation = Quaternion.FromEulerAngles(0, targetYaw, 0);
      this.playerBinding.mesh.rotationQuaternion = Quaternion.Slerp(
        this.playerBinding.mesh.rotationQuaternion ?? Quaternion.Identity(),
        rotation,
        0.15,
      );
    }

    const planarSpeed = Math.sqrt((newVelX ** 2) + (newVelZ ** 2));
    const lookAhead = planarSpeed > 0.001
      ? new Vector3(newVelX / planarSpeed, 0, newVelZ / planarSpeed).scale(Math.min(2, planarSpeed * 0.12))
      : Vector3.Zero();
    const desiredTarget = this.playerBinding.mesh.position.add(new Vector3(0, 1.1, 0)).add(lookAhead);
    this.smoothedTarget = Vector3.Lerp(this.smoothedTarget, desiredTarget, 0.1);
    this.camera.target = this.smoothedTarget;

    this.keyPressedThisFrame.Space = false;
  }

  private resetPlayerToSpawn(): void {
    if (!this.playerBinding) return;
    this.playerBinding.body.setTranslation(
      new RAPIER.Vector3(this.spawnPoint.x, this.spawnPoint.y, this.spawnPoint.z),
      true,
    );
    this.playerBinding.body.setLinvel(new RAPIER.Vector3(0, 0, 0), true);
    this.playerBinding.body.setAngvel(new RAPIER.Vector3(0, 0, 0), true);
  }
}
