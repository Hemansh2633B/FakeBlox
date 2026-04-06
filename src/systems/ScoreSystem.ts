import { GAME_CONFIG } from '../utils/constants';

export class ScoreSystem {
  constructor() {}

  public calculateScore(
    timeMs: number,
    deaths: number,
    starsCollected: number,
    totalStars: number,
    platformCount: number
  ): number {
    const baseScore = GAME_CONFIG.scoring.baseScore;
    const targetTime = platformCount * GAME_CONFIG.scoring.targetTimePerPlatform;
    const timeBonus = Math.max(0, GAME_CONFIG.scoring.maxTimeBonus - (timeMs / targetTime) * GAME_CONFIG.scoring.maxTimeBonus);
    const deathPenalty = deaths * GAME_CONFIG.scoring.deathPenalty;
    const starBonus = (starsCollected / totalStars) * GAME_CONFIG.scoring.maxCollectibleBonus;
    return Math.floor(baseScore + timeBonus - deathPenalty + starBonus);
  }

  public getStarRating(score: number): number {
    const thresholds = GAME_CONFIG.scoring.starThresholds;
    let stars = 1;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (score >= thresholds[i]) {
        stars = i + 1;
        break;
      }
    }
    return Math.min(stars, 5);
  }
}
