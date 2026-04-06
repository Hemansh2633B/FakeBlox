import * as CANNON from 'cannon-es';
import RAPIER from '@dimforge/rapier3d-compat';
import { GAME_CONFIG } from '../utils/constants';

export class PhysicsWorld {
  public world: { raycastClosest: (from: CANNON.Vec3, to: CANNON.Vec3, _options: unknown, result: CANNON.RaycastResult) => void };
  private rapierWorld: RAPIER.World | null = null;
  private isReady: boolean = false;
  private readonly pendingBodies: CANNON.Body[] = [];
  private readonly bodyMap: Map<CANNON.Body, RAPIER.RigidBody> = new Map();
  private readonly colliderMap: Map<CANNON.Body, RAPIER.Collider> = new Map();
  private readonly dynamicBodies: Set<CANNON.Body> = new Set();
  private readonly kinematicBodies: Set<CANNON.Body> = new Set();

  constructor() {
    this.world = {
      raycastClosest: (from, to, _options, result) => {
        if (!this.rapierWorld) {
          result.reset();
          return;
        }
        const direction = new RAPIER.Vector3(to.x - from.x, to.y - from.y, to.z - from.z);
        const maxToi = Math.sqrt((direction.x ** 2) + (direction.y ** 2) + (direction.z ** 2));
        if (maxToi === 0) {
          result.reset();
          return;
        }
        const ray = new RAPIER.Ray(new RAPIER.Vector3(from.x, from.y, from.z), direction);
        const hit = this.rapierWorld.castRay(ray, maxToi, true);
        result.hasHit = !!hit;
      },
    };
    void RAPIER.init().then(() => {
      this.rapierWorld = new RAPIER.World(new RAPIER.Vector3(0, GAME_CONFIG.player.gravity, 0));
      this.isReady = true;
      this.pendingBodies.splice(0).forEach((body) => this.createRapierBody(body));
    });
  }

  public update(deltaTime: number): void {
    if (!this.rapierWorld || !this.isReady) return;

    for (const body of this.dynamicBodies) {
      const rigidBody = this.bodyMap.get(body);
      if (rigidBody) {
        rigidBody.setLinvel(new RAPIER.Vector3(body.velocity.x, body.velocity.y, body.velocity.z), true);
      }
    }
    for (const body of this.kinematicBodies) {
      const rigidBody = this.bodyMap.get(body);
      if (rigidBody) {
        rigidBody.setNextKinematicTranslation(new RAPIER.Vector3(body.position.x, body.position.y, body.position.z));
      }
    }

    this.rapierWorld.timestep = Math.min(deltaTime, 1 / 30);
    this.rapierWorld.step();

    for (const [body, rigidBody] of this.bodyMap) {
      const pos = rigidBody.translation();
      const vel = rigidBody.linvel();
      body.position.set(pos.x, pos.y, pos.z);
      body.velocity.set(vel.x, vel.y, vel.z);
    }
  }

  public addBody(body: CANNON.Body): void {
    if (!this.isReady || !this.rapierWorld) {
      this.pendingBodies.push(body);
      return;
    }
    this.createRapierBody(body);
  }

  public removeBody(body: CANNON.Body): void {
    if (!this.rapierWorld) return;
    const collider = this.colliderMap.get(body);
    if (collider) this.rapierWorld.removeCollider(collider, true);
    const rigidBody = this.bodyMap.get(body);
    if (rigidBody) this.rapierWorld.removeRigidBody(rigidBody);
    this.colliderMap.delete(body);
    this.bodyMap.delete(body);
    this.dynamicBodies.delete(body);
    this.kinematicBodies.delete(body);
  }

  private createRapierBody(body: CANNON.Body): void {
    if (!this.rapierWorld || this.bodyMap.has(body)) return;

    const bodyType = body.type === CANNON.Body.KINEMATIC
      ? RAPIER.RigidBodyType.KinematicPositionBased
      : body.type === CANNON.Body.DYNAMIC
        ? RAPIER.RigidBodyType.Dynamic
        : RAPIER.RigidBodyType.Fixed;

    const desc = new RAPIER.RigidBodyDesc(bodyType)
      .setTranslation(body.position.x, body.position.y, body.position.z)
      .setCanSleep(false)
      .setLinearDamping(body.linearDamping ?? 0);

    const rigidBody = this.rapierWorld.createRigidBody(desc);
    let colliderDesc: RAPIER.ColliderDesc | null = null;
    const firstShape = body.shapes[0];
    if (firstShape instanceof CANNON.Sphere) {
      colliderDesc = RAPIER.ColliderDesc.ball(firstShape.radius);
    } else if (firstShape instanceof CANNON.Box) {
      const he = firstShape.halfExtents;
      colliderDesc = RAPIER.ColliderDesc.cuboid(he.x, he.y, he.z);
    }
    if (!colliderDesc) return;

    colliderDesc.setFriction(0.3);
    colliderDesc.setRestitution(0);
    const collider = this.rapierWorld.createCollider(colliderDesc, rigidBody);
    this.bodyMap.set(body, rigidBody);
    this.colliderMap.set(body, collider);
    if (body.type === CANNON.Body.DYNAMIC) this.dynamicBodies.add(body);
    if (body.type === CANNON.Body.KINEMATIC) this.kinematicBodies.add(body);
  }
}
