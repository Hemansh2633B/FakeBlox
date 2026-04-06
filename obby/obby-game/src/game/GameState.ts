import type { Difficulty, GameMode, GameSnapshot } from '../utils/types';

export enum GameFlowState {
  Boot = 'boot',
  Menu = 'menu',
  Loading = 'loading',
  Ready = 'ready',
  Playing = 'playing',
  Paused = 'paused',
  Finished = 'finished',
  Failed = 'failed',
}

export interface RuntimeGameState {
  flow: GameFlowState;
  snapshot: GameSnapshot | null;
  seed: string;
  difficulty: Difficulty;
  mode: GameMode;
  checkpointIndex: number;
  deaths: number;
  starsCollected: number;
  totalStars: number;
  timerMs: number;
  levelProgress: number;
}

export const createInitialGameState = (): RuntimeGameState => ({
  flow: GameFlowState.Boot,
  snapshot: null,
  seed: '',
  difficulty: 'normal',
  mode: 'seeded',
  checkpointIndex: 0,
  deaths: 0,
  starsCollected: 0,
  totalStars: 0,
  timerMs: 0,
  levelProgress: 0,
});

export const createSnapshotFromState = (
  state: RuntimeGameState,
  numericSeed: number,
): GameSnapshot => ({
  seed: state.seed,
  numericSeed,
  difficulty: state.difficulty,
  mode: state.mode,
  starsCollected: state.starsCollected,
  totalStars: state.totalStars,
  deaths: state.deaths,
  timerMs: state.timerMs,
  checkpointIndex: state.checkpointIndex,
  levelProgress: state.levelProgress,
});