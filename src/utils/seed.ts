const DAILY_CHALLENGE_SALT = 'OBBY_CHALLENGE_V1';

export type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme';

export function toUtcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getDailyChallengeSeed(date: Date = new Date()): string {
  return `DAILY_${toUtcDateString(date)}_${DAILY_CHALLENGE_SALT}`;
}

export function parseDifficulty(input: string | null | undefined): Difficulty | null {
  if (input === 'easy' || input === 'normal' || input === 'hard' || input === 'extreme') {
    return input;
  }
  return null;
}
