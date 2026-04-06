export class SeededRNG {
  private seed: number;
  constructor(seed: string | number) {
    if (typeof seed === 'string') this.seed = this.hashString(seed);
    else this.seed = seed >>> 0;
  }
  private hashString(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  public next(): number {
    this.seed |= 0;
    this.seed = (this.seed + 0x6d2b79f5) | 0;
    let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  public nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  public nextInt(min: number, max: number): number {
    return Math.floor(this.nextRange(min, max + 1));
  }
  public nextBoolean(chance: number = 0.5): boolean {
    return this.next() < chance;
  }
  public choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}
