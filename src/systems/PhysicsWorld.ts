import * as CANNON from 'cannon-es';
import { GAME_CONFIG } from '../utils/constants';

export class PhysicsWorld {
  public world: CANNON.World;

  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, GAME_CONFIG.player.gravity, 0);
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    (this.world.solver as CANNON.GSSolver).iterations = 10;
    this.world.defaultContactMaterial.friction = 0.3;
    this.world.defaultContactMaterial.restitution = 0;
  }

  public update(deltaTime: number): void {
    this.world.step(1 / 60, deltaTime, 3);
  }

  public addBody(body: CANNON.Body): void {
    this.world.addBody(body);
  }

  public removeBody(body: CANNON.Body): void {
    this.world.removeBody(body);
  }
}
