import { getDailyChallengeSeed, parseDifficulty, toUtcDateString } from '../utils/seed';

export class MainMenu {
  private element: HTMLElement;
  private seedInput: HTMLInputElement;
  private difficultySelect: HTMLSelectElement;
  private playButton: HTMLButtonElement;
  private randomSeedButton: HTMLButtonElement;
  private copySeedButton: HTMLButtonElement;
  private pasteSeedButton: HTMLButtonElement;
  private dailyButton: HTMLButtonElement;
  private dailyLabel: HTMLElement;
  private onPlay: (seed: string, difficulty: string) => void;

  constructor(onPlay: (seed: string, difficulty: string) => void) {
    this.onPlay = onPlay;
    this.element = document.createElement('div');
    this.element.id = 'main-menu';
    this.element.innerHTML = `
      <h1>FAKEBLOX</h1>
      <div class="menu-form">
        <label for="menu-seed">Seed:</label>
        <input type="text" id="menu-seed" value="hello" maxlength="64">
        <div class="menu-seed-actions">
          <button id="menu-random-seed" type="button">🎲 Random</button>
          <button id="menu-copy-seed" type="button">📋 Copy</button>
          <button id="menu-paste-seed" type="button">📥 Paste</button>
        </div>
        <div id="menu-daily-label" class="daily-label"></div>
        <label>Difficulty:</label>
        <select id="menu-difficulty">
          <option value="easy">Easy</option>
          <option value="normal" selected>Normal</option>
          <option value="hard">Hard</option>
          <option value="extreme">Extreme</option>
        </select>

        <button id="menu-play">Play Now</button>
        <button id="menu-daily" type="button">📅 Daily Challenge</button>
      </div>`;

    this.seedInput = this.element.querySelector('#menu-seed') as HTMLInputElement;
    this.difficultySelect = this.element.querySelector('#menu-difficulty') as HTMLSelectElement;
    this.playButton = this.element.querySelector('#menu-play') as HTMLButtonElement;
    this.randomSeedButton = this.element.querySelector('#menu-seed-random') as HTMLButtonElement;
    this.pasteSeedButton = this.element.querySelector('#menu-seed-paste') as HTMLButtonElement;
    this.dailyButton = this.element.querySelector('#menu-daily') as HTMLButtonElement;
    this.dailyLabel = this.element.querySelector('#menu-daily-label') as HTMLElement;

    this.playButton.onclick = () => this.onPlay(this.seedInput.value.trim() || 'default', this.difficultySelect.value);
    this.randomSeedButton.onclick = () => {
      this.seedInput.value = MainMenu.createRandomSeed();
      this.seedInput.focus();
      this.seedInput.select();
    };
    this.copySeedButton.onclick = async () => {
      const value = this.seedInput.value.trim() || 'default';
      await navigator.clipboard.writeText(value);
      this.copySeedButton.innerText = '✅ Copied';
      window.setTimeout(() => (this.copySeedButton.innerText = '📋 Copy'), 1200);
    };
    this.pasteSeedButton.onclick = async () => {
      const fromClipboard = await navigator.clipboard.readText();
      if (fromClipboard.trim()) {
        this.seedInput.value = fromClipboard.trim();
      }
    };
    this.dailyButton.onclick = () => {
      this.seedInput.value = getDailyChallengeSeed();
      this.difficultySelect.value = 'normal';
      this.updateDailyLabel();
    };

    this.applyQueryParams();
    this.updateDailyLabel();
    document.getElementById('ui-container')?.appendChild(this.element);
    this.applyStyles();
  }

  private applyQueryParams(): void {
    const params = new URLSearchParams(window.location.search);
    const seedFromQuery = params.get('seed');
    if (seedFromQuery && seedFromQuery.trim().length > 0) {
      this.seedInput.value = seedFromQuery.trim();
    }
    const difficultyFromQuery = parseDifficulty(params.get('difficulty'));
    if (difficultyFromQuery) {
      this.difficultySelect.value = difficultyFromQuery;
    }
  }

  private updateDailyLabel(): void {
    const utcDate = toUtcDateString(new Date());
    this.dailyLabel.textContent = `📅 Daily Challenge — ${utcDate} (UTC)`;
  }

  private generateRandomSeed(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    let seed = 'seed_';
    for (let i = 0; i < bytes.length; i++) seed += alphabet[bytes[i] % alphabet.length];
    return seed;
  }

  private applyStyles(): void {
    Object.assign(this.element.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: '28px',
      borderRadius: '20px',
      color: 'white',
      textAlign: 'center',
      minWidth: '360px',
      border: '4px solid #fff',
      boxShadow: '0 0 20px rgba(0,0,0,0.5)',
      pointerEvents: 'auto',
    });
    Object.assign(this.dailyLabel.style, {
      margin: '10px 0 16px',
      fontSize: '13px',
      color: '#cce5ff',
      opacity: '0.95',
      minHeight: '18px',
    });
  }

  public setVisible(visible: boolean): void {
    this.element.style.display = visible ? 'block' : 'none';
  }
}
