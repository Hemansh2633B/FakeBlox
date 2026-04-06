export interface RNG {
  seed: number;
  next(): number;
  float(min?: number, max?: number): number;
  int(min: number, max: number): number;
  bool(chance?: number): boolean;
  sign(): 1 | -1;
  pick<T>(items: readonly T[]): T;
  weighted<T>(entries: ReadonlyArray<readonly [T, number]>): T;
  shuffle<T>(items: readonly T[]): T[];
}

export function hashString(str: string): number {
  let hash = 2166136261;

  for (let index = 0; index < str.length; index += 1) {
    hash ^= str.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let result = Math.imul(state ^ (state >>> 15), state | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRNG(seed: string | number): RNG {
  const numericSeed = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
  const generator = mulberry32(numericSeed || 1);

  return {
    seed: numericSeed || 1,
    next() {
      return generator();
    },
    float(min = 0, max = 1) {
      return min + (max - min) * generator();
    },
    int(min, max) {
      const low = Math.ceil(Math.min(min, max));
      const high = Math.floor(Math.max(min, max));
      return Math.floor(this.float(low, high + 1));
    },
    bool(chance = 0.5) {
      return generator() <= chance;
    },
    sign() {
      return this.bool(0.5) ? 1 : -1;
    },
    pick(items) {
      if (items.length === 0) {
        throw new Error('Cannot pick from an empty array.');
      }

      return items[this.int(0, items.length - 1)];
    },
    weighted(entries) {
      if (entries.length === 0) {
        throw new Error('Cannot pick from empty weighted entries.');
      }

      let total = 0;

      for (const [, weight] of entries) {
        total += Math.max(0, weight);
      }

      if (total <= 0) {
        return entries[0][0];
      }

      let roll = this.float(0, total);

      for (const [value, weight] of entries) {
        roll -= Math.max(0, weight);
        if (roll <= 0) {
          return value;
        }
      }

      return entries[entries.length - 1][0];
    },
    shuffle(items) {
      const output = [...items];

      for (let index = output.length - 1; index > 0; index -= 1) {
        const swapIndex = this.int(0, index);
        [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
      }

      return output;
    },
  };
}