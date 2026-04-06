import { THEME_PALETTES } from '../utils/constants';
import type { Difficulty, ThemeAssignment, ThemeId } from '../utils/types';
import type { RNG } from './SeededRNG';

const THEME_ORDER: ThemeId[] = ['grasslands', 'factory', 'ice', 'lava', 'space', 'neon'];

export interface ThemeSectionPlan {
  assignments: ThemeAssignment[];
  orderedThemes: ThemeId[];
}

export class ThemeManager {
  createAssignments(totalPlatforms: number, difficulty: Difficulty, rng: RNG): ThemeSectionPlan {
    const sectionCountByDifficulty: Record<Difficulty, number> = {
      easy: 3,
      normal: 4,
      hard: 5,
      extreme: 6,
    };

    const sectionCount = Math.max(1, Math.min(sectionCountByDifficulty[difficulty], totalPlatforms));
    const orderedThemes = rng.shuffle(THEME_ORDER).slice(0, sectionCount);
    const assignments: ThemeAssignment[] = [];

    let startIndex = 0;

    for (let section = 0; section < sectionCount; section += 1) {
      const remainingSections = sectionCount - section;
      const remainingPlatforms = totalPlatforms - startIndex;
      const sectionSize = Math.max(1, Math.round(remainingPlatforms / remainingSections));
      const endIndex =
        section === sectionCount - 1
          ? totalPlatforms - 1
          : Math.min(totalPlatforms - 1, startIndex + sectionSize - 1);

      assignments.push({
        themeId: orderedThemes[section],
        startIndex,
        endIndex,
      });

      startIndex = endIndex + 1;
    }

    return { assignments, orderedThemes };
  }

  getThemeForIndex(index: number, assignments: ThemeAssignment[]): ThemeId {
    for (const assignment of assignments) {
      if (index >= assignment.startIndex && index <= assignment.endIndex) {
        return assignment.themeId;
      }
    }

    return assignments[assignments.length - 1]?.themeId ?? 'grasslands';
  }

  getPalette(themeId: ThemeId) {
    return THEME_PALETTES[themeId];
  }
}