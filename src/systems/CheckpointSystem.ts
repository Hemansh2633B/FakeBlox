import { Checkpoint } from '../objects/Checkpoint'; import { PlayerController } from '../player/PlayerController';
import { GAME_CONFIG } from '../utils/constants';

export interface CheckpointActivation {
  id: number;
  total: number;
}

export class CheckpointSystem {
  private checkpoints: Checkpoint[] = []; private activeCheckpointId: number = -1; private player: PlayerController;
  constructor(player: PlayerController) { this.player = player; }
  public addCheckpoint(checkpoint: Checkpoint): void { this.checkpoints.push(checkpoint); }
  public update(): CheckpointActivation | null {
    for (const checkpoint of this.checkpoints) {
      const distance = this.player.model.mesh.position.distanceTo(checkpoint.mesh.position);
      if (distance <= GAME_CONFIG.checkpoints.activationRadius && !checkpoint.isActive) {
        return this.activateCheckpoint(checkpoint.getId());
      }
    }
    return null;
  }
  private activateCheckpoint(id: number): CheckpointActivation | null {
    for (const checkpoint of this.checkpoints) {
      if (checkpoint.getId() === id) {
        checkpoint.activate();
        this.activeCheckpointId = id;
        return { id, total: this.checkpoints.length };
      }
    }
    return null;
  }
  public respawnPlayer(): void {
    if (this.activeCheckpointId === -1) this.player.respawn(0, 5, 0);
    else {
      const cp = this.checkpoints.find(c => c.getId() === this.activeCheckpointId);
      if (cp) this.player.respawn(cp.mesh.position.x, cp.mesh.position.y + GAME_CONFIG.checkpoints.respawnHeightOffset, cp.mesh.position.z);
    }
    this.player.setRespawnInvincibility();
  }
  public clear(): void {
    this.checkpoints.forEach((checkpoint) => checkpoint.destroy());
    this.checkpoints = [];
    this.activeCheckpointId = -1;
  }
}
