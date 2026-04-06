import { Theme } from '../themes/Theme';
import { GrasslandsTheme, LavaTheme, IceTheme, SpaceTheme, FactoryTheme, NeonTheme } from '../themes/Themes';
import { SeededRNG } from './SeededRNG';
export class ThemeManager {
  private themes: Theme[] = [GrasslandsTheme, LavaTheme, IceTheme, SpaceTheme, FactoryTheme, NeonTheme];
  private rng: SeededRNG;
  constructor(rng: SeededRNG) { this.rng = rng; }
  public getRandomThemeSequence(): Theme[] {
    const sequence = [...this.themes];
    for (let i = sequence.length - 1; i > 0; i--) {
      const j = this.rng.nextInt(0, i);
      [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
    }
    return sequence;
  }
  public getThemeForSection(sectionIndex: number, sequence: Theme[]): Theme {
    return sequence[sectionIndex % sequence.length];
  }
}
