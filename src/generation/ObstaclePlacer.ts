import * as THREE from 'three';
import { SeededRNG } from './SeededRNG';
import { PhysicsWorld } from '../systems/PhysicsWorld';
import { Scene } from '../game/Scene';
import { GAME_CONFIG } from '../utils/constants';
import { PlatformPlacement } from './PlatformPlacer';
import { KillBrick } from '../objects/KillBrick';
import { SpinningBar } from '../objects/SpinningBar';
import { Pendulum } from '../objects/Pendulum';
import { Crusher } from '../objects/Crusher';
import { LaserBeam } from '../objects/LaserBeam';
import { WindZone } from '../objects/WindZone';
import { Difficulty } from '../utils/seed';

export class ObstaclePlacer {
  constructor(
    private readonly scene: Scene,
    private readonly physics: PhysicsWorld,
    private readonly rng: SeededRNG,
  ) {}

  private getObstacleDensity(difficulty: Difficulty): number {
    if (difficulty === 'easy') return GAME_CONFIG.generation.obstacleDensityEasy;
    if (difficulty === 'hard') return GAME_CONFIG.generation.obstacleDensityHard;
    if (difficulty === 'extreme') return GAME_CONFIG.generation.obstacleDensityExtreme;
    return GAME_CONFIG.generation.obstacleDensityNormal;
  }

  public placeObstacles(placements: PlatformPlacement[], difficulty: Difficulty): any[] {
    const obstacles: any[] = [];
    const density = this.getObstacleDensity(difficulty);

    // We start from index 1 to avoid spawn platform
    for (let i = 1; i < placements.length - 1; i++) {
      const placement = placements[i];
      if (placement.isRestArea) continue;

      // Density is per 10 platforms, so chance is density / 10
      if (this.rng.next() < density / 10) {
        const obstacle = this.createRandomObstacle(placement);
        if (obstacle) obstacles.push(obstacle);
      }
    }

    return obstacles;
  }

  private createRandomObstacle(placement: PlatformPlacement): any {
    const roll = this.rng.next();
    const { x, y, z } = placement.position;
    const { width, depth } = placement;

    if (roll < 0.4) {
      // Kill Brick
      const specs = GAME_CONFIG.obstacleSpecs.killBrick;
      const size = this.rng.nextRange(specs.sizeRange[0], specs.sizeRange[1]);
      // Place it on top of the platform
      return new KillBrick(this.scene.scene, this.physics, x, y + GAME_CONFIG.generation.platformHeight / 2 + size / 2, z, size, size, size);
    } else if (roll < 0.6) {
      // Spinning Bar
      const specs = GAME_CONFIG.obstacleSpecs.spinningBar;
      const length = this.rng.nextRange(specs.lengthRange[0], specs.lengthRange[1]);
      const speed = this.rng.nextRange(specs.speedDegreesPerSecondRange[0], specs.speedDegreesPerSecondRange[1]) * (Math.PI / 180);
      return new SpinningBar(this.scene.scene, this.physics, x, y + 1, z, length, speed);
    } else if (roll < 0.75) {
      // Laser Beam
      const specs = GAME_CONFIG.obstacleSpecs.laser;
      const on = this.rng.nextRange(specs.onDurationRange[0], specs.onDurationRange[1]);
      const off = this.rng.nextRange(specs.offDurationRange[0], specs.offDurationRange[1]);
      const warn = specs.warningDuration;
      // LaserBeam constructor: scene, physics, x, y, z, width, height, depth, onDuration, offDuration, warningDuration, color
      return new LaserBeam(this.scene.scene, this.physics, x, y + 1, z, width, 0.2, depth, on, off, warn);
    } else if (roll < 0.85) {
      // Pendulum
      const specs = GAME_CONFIG.obstacleSpecs.pendulum;
      const diameter = this.rng.nextRange(specs.diameterRange[0], specs.diameterRange[1]);
      const arc = this.rng.nextRange(specs.arcDegreesRange[0], specs.arcDegreesRange[1]) * (Math.PI / 180);
      const period = this.rng.nextRange(specs.periodSecondsRange[0], specs.periodSecondsRange[1]);
      const length = 5;
      const speed = (2 * Math.PI) / period;
      // Pendulum constructor: scene, physics, anchorX, anchorY, anchorZ, length, speed, arc, size, color
      return new Pendulum(this.scene.scene, this.physics, x, y + length + 1, z, length, speed, arc, diameter);
    } else if (roll < 0.95) {
      // Crusher
      const specs = GAME_CONFIG.obstacleSpecs.crusher;
      const cWidth = this.rng.nextRange(specs.widthRange[0], specs.widthRange[1]);
      const open = this.rng.nextRange(specs.openDurationRange[0], specs.openDurationRange[1]);
      const crush = specs.crushDuration;
      const retract = specs.retractDuration;
      // Crusher constructor: scene, physics, x, y, z, width, depth, crushHeight, openDuration, crushDuration, retractDuration, color
      return new Crusher(this.scene.scene, this.physics, x, y + 4, z, cWidth, cWidth, 3.5, open, crush, retract);
    } else {
      // Wind Zone
      const specs = GAME_CONFIG.obstacleSpecs.windZone;
      const forceMag = this.rng.nextRange(specs.forceRange[0], specs.forceRange[1]);
      const size = this.rng.nextRange(specs.sizeRange[0], specs.sizeRange[1]);
      const direction = new THREE.Vector3(1, 0, 0); // Side wind
      const force = direction.multiplyScalar(forceMag);
      // WindZone constructor: scene, physics, x, y, z, width, height, depth, force, color
      return new WindZone(this.scene.scene, this.physics, x, y + 1, z, size, size, size, force);
    }
  }
}
