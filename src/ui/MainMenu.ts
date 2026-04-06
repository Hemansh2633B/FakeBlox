export class MainMenu {
  private element: HTMLElement; private seedInput: HTMLInputElement; private difficultySelect: HTMLSelectElement; private playButton: HTMLButtonElement; private onPlay: (seed: string, difficulty: string) => void;
  constructor(onPlay: (seed: string, difficulty: string) => void) {
    this.onPlay = onPlay; this.element = document.createElement('div'); this.element.id = 'main-menu';
    this.element.innerHTML = `<h1>FAKEBLOX</h1><div class="menu-form"><label>Seed:</label><input type="text" id="menu-seed" value="hello"><label>Difficulty:</label><select id="menu-difficulty"><option value="easy">Easy</option><option value="normal" selected>Normal</option><option value="hard">Hard</option><option value="extreme">Extreme</option></select><button id="menu-play">Play Now</button></div>`;
    this.seedInput = this.element.querySelector('#menu-seed') as HTMLInputElement; this.difficultySelect = this.element.querySelector('#menu-difficulty') as HTMLSelectElement; this.playButton = this.element.querySelector('#menu-play') as HTMLButtonElement;
    this.playButton.onclick = () => this.onPlay(this.seedInput.value, this.difficultySelect.value);
    document.getElementById('ui-container')?.appendChild(this.element); this.applyStyles();
  }
  private applyStyles(): void { Object.assign(this.element.style, { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(0,0,0,0.8)', padding: '40px', borderRadius: '20px', color: 'white', textAlign: 'center', minWidth: '300px', border: '4px solid #fff', boxShadow: '0 0 20px rgba(0,0,0,0.5)', pointerEvents: 'auto' }); }
  public setVisible(visible: boolean): void { this.element.style.display = visible ? 'block' : 'none'; }
}
