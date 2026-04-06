import RAPIER, {
  ActiveEvents,
  ColliderDesc,
  type Collider,
  type RigidBody,
  RigidBodyDesc,
  type World,
} from '@dimforge/rapier3d-compat';
import { Quaternion, Vector3 } from 'three';
import type { Vec3 } from '../utils/types';

export interface PhysicsBoxOptions {
  position: Vec3;
  size: Vec3;
  rotation?: Vec3;
  restitution?: number;
  friction?: number;
  userData?: unknown;
}

export interface PhysicsSensorOptions extends PhysicsBoxOptions {
  name?: string;
}

export interface PhysicsPlayerOptions {
  position: Vec3;
  radius?: number;
  halfHeight?: number;
  mass?: number;
  friction?: number;
}

const EULER_TO_QUATERNION = new Quaternion();

const toQuaternion = (rotation?: Vec3): Quaternion => {
  if (!rotation) {
    return EULER_TO_QUATERNION.identity();
  }

  return EULER_TO_QUATERNION.setFromEuler({
    isEuler: true,
    _x: rotation.x,
    _y: rotation.y,
    _z: rotation.z,
    _order: 'XYZ',
  } as never);
};

export class PhysicsWorld {
  public world: World | null = null;
  public readonly gravity = new Vector3(0, -30, 0);
  public readonly eventQueue = new RAPIER.EventQueue(true);

  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await RAPIER.init();
    this.world = new RAPIER.World(this.gravity);
    this.world.timestep = 1 / 60;
    this.initialized = true;
  }

  public step(dt: number): void {
    if (!this.world) {
      return;
    }

    this.world.timestep = Math.max(1 / 240, Math.min(dt, 1 / 30));
    this.world.step(this.eventQueue);
  }

  public createFixedBox(options: PhysicsBoxOptions): Collider {
    this.ensureWorld();

    const bodyDesc = RigidBodyDesc.fixed().setTranslation(
      options.position.x,
      options.position.y,
      options.position.z,
    );
    const body = this.world!.createRigidBody(bodyDesc);

    const colliderDesc = ColliderDesc.cuboid(
      options.size.x * 0.5,
      options.size.y * 0.5,
      options.size.z * 0.5,
    )
      .setFriction(options.friction ?? 0.9)
      .setRestitution(options.restitution ?? 0);

    const rotation = toQuaternion(options.rotation);
    colliderDesc.setRotation(rotation);
    const collider = this.world!.createCollider(colliderDesc, body);
    collider.setActiveEvents(ActiveEvents.COLLISION_EVENTS);
    if (options.userData !== undefined) {
      collider.setUserData(options.userData);
    }
    return collider;
  }

  public createSensorBox(options: PhysicsSensorOptions): Collider {
    this.ensureWorld();

    const bodyDesc = RigidBodyDesc.fixed().setTranslation(
      options.position.x,
      options.position.y,
      options.position.z,
    );
    const body = this.world!.createRigidBody(bodyDesc);

    const colliderDesc = ColliderDesc.cuboid(
      options.size.x * 0.5,
      options.size.y * 0.5,
      options.size.z * 0.5,
    )
      .setSensor(true)
      .setActiveEvents(ActiveEvents.COLLISION_EVENTS);

    const rotation = toQuaternion(options.rotation);
    colliderDesc.setRotation(rotation);

    const collider = this.world!.createCollider(colliderDesc, body);
    collider.setActiveEvents(ActiveEvents.COLLISION_EVENTS);
    if (options.userData !== undefined) {
      collider.setUserData(options.userData);
    }
    return collider;
  }

  public createPlayerBody(options: PhysicsPlayerOptions): RigidBody {
    this.ensureWorld();

    const radius = options.radius ?? 0.45;
    const halfHeight = options.halfHeight ?? 0.5;
    const mass = options.mass ?? 1;
    const bodyDesc = RigidBodyDesc.dynamic()
      .setTranslation(options.position.x, options.position.y, options.position.z)
      .lockRotations()
      .setLinearDamping(0.2)
      .setAdditionalMass(mass)
      .setCanSleep(false)
      .setCcdEnabled(true);

    const body = this.world!.createRigidBody(bodyDesc);
    const colliderDesc = ColliderDesc.capsule(halfHeight, radius)
      .setFriction(options.friction ?? 0.2)
      .setRestitution(0)
      .setActiveEvents(ActiveEvents.COLLISION_EVENTS);

    this.world!.createCollider(colliderDesc, body);
    return body;
  }

  private ensureWorld(): void {
    if (!this.world) {
      throw new Error('PhysicsWorld not initialized. Call init() before creating bodies.');
    }
  }
}