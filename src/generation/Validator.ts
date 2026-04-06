import { PlatformPlacement } from './PlatformPlacer';

const MAX_HORIZONTAL_GAP = 8.1;
const MAX_UPWARD_GAP = 3.25;
const MAX_DOWNWARD_GAP = 20;
const MIN_REST_INTERVAL = 5;
const MAX_REST_INTERVAL = 8;

export class Validator {
  public validateLevel(platforms: PlatformPlacement[]): boolean {
    return this.validateGeometry(platforms)
      && this.validateSequenceRules(platforms)
      && this.validateRestAreas(platforms);
  }

  private validateGeometry(platforms: PlatformPlacement[]): boolean {
    for (let i = 1; i < platforms.length; i += 1) {
      const prev = platforms[i - 1];
      const current = platforms[i];
      const horizontalGap = Math.hypot(
        current.position.x - prev.position.x,
        current.position.z - prev.position.z,
      ) - ((prev.depth / 2) + (current.depth / 2));
      if (horizontalGap > MAX_HORIZONTAL_GAP) return false;

      const verticalDelta = current.position.y - prev.position.y;
      if (verticalDelta > MAX_UPWARD_GAP) return false;
      if (verticalDelta < -MAX_DOWNWARD_GAP) return false;
    }
    return true;
  }

  private validateSequenceRules(platforms: PlatformPlacement[]): boolean {
    for (let i = 1; i < platforms.length; i += 1) {
      const prev = platforms[i - 1];
      const current = platforms[i];

      // Rule 6 subset: avoid back-to-back unsafe combos.
      if (prev.platformType === 'falling' && current.platformType === 'falling') return false;
      if (prev.platformType === 'falling' && current.platformType === 'appearing') return false;
      if (prev.platformType === 'ice' && current.platformType === 'thin') return false;
      if (prev.platformType === 'bounce' && current.platformType === 'falling') return false;
    }
    return true;
  }

  private validateRestAreas(platforms: PlatformPlacement[]): boolean {
    let difficultCount = 0;
    for (let i = 1; i < platforms.length; i += 1) {
      const current = platforms[i];
      if (current.isRestArea) {
        if (difficultCount > 0 && (difficultCount < MIN_REST_INTERVAL || difficultCount > MAX_REST_INTERVAL)) {
          return false;
        }
        difficultCount = 0;
        continue;
      }

      if (current.platformType !== 'normal') {
        difficultCount += 1;
      }
    }
    return true;
  }
}
