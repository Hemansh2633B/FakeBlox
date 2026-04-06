export class HUD {
  private element: HTMLElement; private timerElement: HTMLElement; private deathElement: HTMLElement; private starElement: HTMLElement; private seedElement: HTMLElement;
  constructor() {
    this.element = document.createElement('div'); this.element.id = 'hud';
    this.element.innerHTML = `<div id="hud-timer">00:00.000</div><div id="hud-deaths">💀 0</div><div id="hud-stars">⭐ 0</div><div id="hud-seed">Seed: unknown</div>`;
    this.timerElement = this.element.querySelector('#hud-timer') as HTMLElement; this.deathElement = this.element.querySelector('#hud-deaths') as HTMLElement; this.starElement = this.element.querySelector('#hud-stars') as HTMLElement; this.seedElement = this.element.querySelector('#hud-seed') as HTMLElement;
    document.getElementById('ui-container')?.appendChild(this.element); this.applyStyles();
  }
  private applyStyles(): void { Object.assign(this.element.style, { position: 'absolute', top: '0', left: '0', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '20px', color: 'white', fontSize: '24px', pointerEvents: 'none', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }); }
  public updateTimer(time: string): void { this.timerElement.innerText = time; }
  public updateDeaths(deaths: number): void { this.deathElement.innerText = `💀 ${deaths}`; }
  public updateStars(stars: number, total: number): void { this.starElement.innerText = `⭐ ${stars}/${total}`; }
  public updateSeed(seed: string): void { this.seedElement.innerText = `Seed: ${seed}`; }
  public setVisible(visible: boolean): void { this.element.style.display = visible ? 'flex' : 'none'; }
}
