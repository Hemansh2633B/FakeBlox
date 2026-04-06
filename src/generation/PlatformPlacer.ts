import * as THREE from 'three';
import { SeededRNG } from './SeededRNG';
import { Platform } from '../objects/Platform';
import { Scene } from '../game/Scene';
import { PhysicsWorld } from '../systems/PhysicsWorld';
import { GAME_CONFIG } from '../utils/constants';
import { Theme } from '../themes/Theme';
import { Difficulty } from '../utils/seed';

export type PlatformType =
  | 'spawn'
  | 'normal'
  | 'thin'
  | 'moving_linear'
  | 'moving_circular'
  | 'rotating'
  | 'falling'
  | 'bounce'
  | 'conveyor'
  | 'appearing'
  | 'ice'
  | 'finish';

export interface PlatformPlacement {
  platform: Platform;
  position: THREE.Vector3;
  width: number;
  depth: number;
  sectionIndex: number;
  theme: Theme;
  isRestArea: boolean;
  platformType: PlatformType;
}

export class PlatformPlacer {
  constructor(
    private readonly scene: Scene,
    private readonly physics: PhysicsWorld,
    private readonly rng: SeededRNG,
  ) {}

  private placePlatform(x: number, y: number, z: number, width: number, depth: number, color: number): Platform {
    return new Platform(this.scene.scene, this.physics, x, y, z, width, depth, color);
  }

  private getMaxGapForDifficulty(difficulty: Difficulty): number {
    if (difficulty === 'easy') return GAME_CONFIG.generation.maxGapDistanceEasy;
    if (difficulty === 'hard') return GAME_CONFIG.generation.maxGapDistanceHard;
    if (difficulty === 'extreme') return GAME_CONFIG.generation.maxGapDistanceExtreme;
    return GAME_CONFIG.generation.maxGapDistanceNormal;
  }
  private getMinWidthForDifficulty(difficulty: string): number {
    if (difficulty === 'easy') return GAME_CONFIG.generation.minPlatformWidthEasy;
    if (difficulty === 'hard') return GAME_CONFIG.generation.minPlatformWidthHard;
    if (difficulty === 'extreme') return GAME_CONFIG.generation.minPlatformWidthExtreme;
    return GAME_CONFIG.generation.minPlatformWidthNormal;
  }

  private getMinWidthForDifficulty(difficulty: Difficulty): number {
    if (difficulty === 'easy') return GAME_CONFIG.generation.minPlatformWidthEasy;
    if (difficulty === 'hard') return GAME_CONFIG.generation.minPlatformWidthHard;
    if (difficulty === 'extreme') return GAME_CONFIG.generation.minPlatformWidthExtreme;
    return GAME_CONFIG.generation.minPlatformWidthNormal;
  }

  private choosePlatformType(themeName: string): PlatformType {
    const roll = this.rng.next();
    if (roll < 0.08) return 'thin';
    if (roll < 0.2) return 'moving_linear';
    if (roll < 0.26) return 'moving_circular';
    if (roll < 0.34) return 'rotating';
    if (roll < 0.42) return 'falling';
    if (roll < 0.48) return 'bounce';
    if (roll < 0.54) return 'appearing';
    if (themeName.toLowerCase().includes('factory') && roll < 0.62) return 'conveyor';
    if (themeName.toLowerCase().includes('ice') && roll < 0.72) return 'ice';
    return 'normal';
  }

  public generateInitialPath(count: number, difficulty: Difficulty, themes: Theme[]): PlatformPlacement[] {
    const placements: PlatformPlacement[] = [];
    const maxGap = this.getMaxGapForDifficulty(difficulty);
    const maxGap = Math.min(8.1, this.getMaxGapForDifficulty(difficulty));
    const minWidth = this.getMinWidthForDifficulty(difficulty);
    const sectionSize = GAME_CONFIG.generation.platformsPerSection;
    let currentPos = new THREE.Vector3(0, 0, 0);
    let difficultSinceRest = 0;
    let nextRestIn = this.rng.nextInt(5, 8);

    const spawnTheme = themes[0];
    const spawnPlatform = this.placePlatform(0, 0, 0, 8, 8, spawnTheme.accentColor);
    placements.push({
      platform: spawnPlatform,
      position: spawnPlatform.mesh.position.clone(),
      width: 8,
      depth: 8,
      sectionIndex: 0,
      theme: spawnTheme,
      isRestArea: true,
      platformType: 'spawn',
    });

    for (let i = 1; i < count; i += 1) {
      const sectionIndex = Math.floor(i / sectionSize);
      const theme = themes[sectionIndex % themes.length];
      const horizontalGap = this.rng.nextRange(GAME_CONFIG.generation.minGapDistance, maxGap);
      const verticalGap = this.rng.nextRange(-2, GAME_CONFIG.generation.maxUpwardGap);
      const lateralOffset = this.rng.nextRange(-5, 5);
      const width = this.rng.nextRange(minWidth, GAME_CONFIG.generation.maxPlatformWidth);
      const depth = this.rng.nextRange(GAME_CONFIG.generation.minPlatformDepth, GAME_CONFIG.generation.maxPlatformDepth);
      const isFinal = i === count - 1;
      const isRestArea = !isFinal && difficultSinceRest >= nextRestIn;
      const platformType: PlatformType = isFinal
        ? 'finish'
        : (isRestArea ? 'normal' : this.choosePlatformType(theme.name));

      const width = isRestArea || isFinal
        ? Math.max(4, this.rng.nextRange(4, GAME_CONFIG.generation.maxPlatformWidth))
        : this.rng.nextRange(minWidth, GAME_CONFIG.generation.maxPlatformWidth);
      const depth = isRestArea || isFinal
        ? Math.max(4, this.rng.nextRange(4, GAME_CONFIG.generation.maxPlatformDepth))
        : this.rng.nextRange(GAME_CONFIG.generation.minPlatformDepth, GAME_CONFIG.generation.maxPlatformDepth);
      const horizontalGap = isRestArea
        ? this.rng.nextRange(2, Math.min(4, maxGap))
        : this.rng.nextRange(GAME_CONFIG.generation.minGapDistance, maxGap);
      const verticalGap = isRestArea
        ? this.rng.nextRange(-0.5, 1.5)
        : this.rng.nextRange(-2, GAME_CONFIG.generation.maxUpwardGap);
      const lateralOffset = this.rng.nextRange(-3.5, 3.5);

      currentPos.x += lateralOffset;
      currentPos.y += verticalGap;
      currentPos.z += horizontalGap + depth / 2;
      const color = (isRestArea || isFinal) ? theme.secondaryColor : theme.primaryColor;
      const platform = this.placePlatform(currentPos.x, currentPos.y, currentPos.z, width, depth, color);

      placements.push({
        platform,
        position: platform.mesh.position.clone(),
        width,
        depth,
        sectionIndex,
        theme,
        isRestArea: isRestArea || isFinal,
        platformType,
      });

      currentPos.z += depth / 2;
      if (isRestArea) {
        difficultSinceRest = 0;
        nextRestIn = this.rng.nextInt(5, 8);
      } else {
        difficultSinceRest += platformType === 'normal' ? 0 : 1;
      }
    }

    return placements;
  }
}
