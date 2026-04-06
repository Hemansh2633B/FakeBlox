import { Collectible } from '../objects/Collectible'; import { PlayerController } from '../player/PlayerController';
export class CollectibleSystem {
  private collectibles: Collectible[] = []; private player: PlayerController; private count: number = 0;
  constructor(player: PlayerController) { this.player = player; }
  public addCollectible(collectible: Collectible): void { this.collectibles.push(collectible); }
  public update(): void { this.collectibles.forEach(collectible => { if (!collectible.isCollected) { const distance = this.player.model.mesh.position.distanceTo(collectible.mesh.position); if (distance < 1.5) this.collect(collectible); } }); }
  private collect(collectible: Collectible): void { collectible.collect(); this.count++; }
  public getCount(): number { return this.count; }
  public clear(): void { this.collectibles = []; this.count = 0; }
}
