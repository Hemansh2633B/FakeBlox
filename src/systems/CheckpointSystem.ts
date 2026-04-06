import { Checkpoint } from '../objects/Checkpoint'; import { PlayerController } from '../player/PlayerController';
export class CheckpointSystem {
  private checkpoints: Checkpoint[] = []; private activeCheckpointId: number = -1; private player: PlayerController;
  constructor(player: PlayerController) { this.player = player; }
  public addCheckpoint(checkpoint: Checkpoint): void { this.checkpoints.push(checkpoint); }
  public update(): void { this.checkpoints.forEach(checkpoint => { const distance = this.player.model.mesh.position.distanceTo(checkpoint.mesh.position); if (distance < 2.5 && !checkpoint.isActive) this.activateCheckpoint(checkpoint.getId()); }); }
  private activateCheckpoint(id: number): void { this.checkpoints.forEach(c => { if (c.getId() === id) { c.activate(); this.activeCheckpointId = id; } }); }
  public respawnPlayer(): void { if (this.activeCheckpointId === -1) this.player.respawn(0, 5, 0); else { const cp = this.checkpoints.find(c => c.getId() === this.activeCheckpointId); if (cp) this.player.respawn(cp.mesh.position.x, cp.mesh.position.y + 2, cp.mesh.position.z); } }
  public clear(): void { this.checkpoints = []; this.activeCheckpointId = -1; }
}
