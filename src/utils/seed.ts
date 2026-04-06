const DAILY_CHALLENGE_SALT = 'OBBY_CHALLENGE_V1';

export type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme';

export function toUtcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function hashSeedSource(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function getDailyChallengeSeed(date: Date = new Date()): string {
  const source = `DAILY_${toUtcDateString(date)}_${DAILY_CHALLENGE_SALT}`;
  return `daily-${hashSeedSource(source)}`;
}

export function getDailyChallengeBadge(date: Date = new Date()): string {
  const label = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `📅 Daily Challenge — ${label}`;
}

export function parseDifficulty(input: string | null | undefined): Difficulty | null {
  if (input === 'easy' || input === 'normal' || input === 'hard' || input === 'extreme') {
    return input;
  }
  return null;
}
