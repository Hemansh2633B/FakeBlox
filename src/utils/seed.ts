export const DAILY_SEED_SALT = 'OBBY_CHALLENGE';

export interface SeedRouteConfig {
  seed: string;
  difficulty: string;
  debug: boolean;
}

const VALID_DIFFICULTIES = new Set(['easy', 'normal', 'hard', 'extreme']);

export function parseRouteConfig(search: string): SeedRouteConfig {
  const params = new URLSearchParams(search);
  const seed = (params.get('seed') || 'hello').trim() || 'hello';
  const difficultyRaw = (params.get('difficulty') || 'normal').toLowerCase();
  const difficulty = VALID_DIFFICULTIES.has(difficultyRaw) ? difficultyRaw : 'normal';
  const debug = params.get('debug') === 'true';
  return { seed, difficulty, debug };
}

export function toDailySeed(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `DAILY_${year}-${month}-${day}_${DAILY_SEED_SALT}`;
}

export function randomSeed(length = 10): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
