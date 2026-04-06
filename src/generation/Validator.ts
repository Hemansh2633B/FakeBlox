import { GAME_CONFIG } from '../utils/constants';
import { PlatformPlacement } from './PlatformPlacer';

export class Validator {
  public validateLevel(platforms: PlatformPlacement[], maxHorizontalGap: number): boolean {
    for (let i = 1; i < platforms.length; i++) {
      const prev = platforms[i - 1];
      const current = platforms[i];

      const horizontalGap = Math.hypot(
        current.position.x - prev.position.x,
        current.position.z - prev.position.z,
      ) - ((prev.depth / 2) + (current.depth / 2));
      if (horizontalGap > maxHorizontalGap) return false;

      const verticalDelta = current.position.y - prev.position.y;
      if (verticalDelta > GAME_CONFIG.generation.maxUpwardGap) return false;
    }

    return true;
  }
}
