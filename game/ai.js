// game/ai.js — YUKA AI Utilities (Placeholder for future enemies/bots)
import * as YUKA from 'yuka';

export class AIManager {
  constructor() {
    this.entityManager = new YUKA.EntityManager();
    this.time = new YUKA.Time();
  }

  update() {
    const delta = this.time.update().getDelta();
    this.entityManager.update(delta);
  }

  // Example method to add an enemy bot in the future
  addBot(mesh) {
    const vehicle = new YUKA.Vehicle();
    vehicle.setRenderComponent(mesh, this.syncModel);
    
    // Example behavior: Wander
    const wanderBehavior = new YUKA.WanderBehavior();
    vehicle.steering.add(wanderBehavior);
    
    this.entityManager.add(vehicle);
    return vehicle;
  }

  syncModel(entity, renderComponent) {
    renderComponent.matrix.copy(entity.worldMatrix);
  }
}

export const aiManager = new AIManager();
