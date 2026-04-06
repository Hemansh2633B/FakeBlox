export class EndScreen {
  private element: HTMLElement; private playAgainButton: HTMLButtonElement; private onPlayAgain: () => void;
  constructor(onPlayAgain: () => void) {
    this.onPlayAgain = onPlayAgain; this.element = document.createElement('div'); this.element.id = 'end-screen';
    this.element.innerHTML = `<h1>LEVEL COMPLETE!</h1><div id="end-stats"><p id="end-time">Time: 00:00.000</p><p id="end-deaths">Deaths: 0</p><p id="end-stars">Stars: 0/0</p><p id="end-score">Score: 0</p><div id="end-rating">⭐⭐⭐⭐⭐</div></div><button id="end-play-again">Play Again</button>`;
    this.playAgainButton = this.element.querySelector('#end-play-again') as HTMLButtonElement; this.playAgainButton.onclick = this.onPlayAgain;
    document.getElementById('ui-container')?.appendChild(this.element); this.applyStyles();
  }
  private applyStyles(): void { Object.assign(this.element.style, { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(255,255,255,0.9)', padding: '40px', borderRadius: '20px', color: '#333', textAlign: 'center', minWidth: '350px', border: '8px solid #FFD700', pointerEvents: 'auto' }); }
  public setVisible(visible: boolean): void { this.element.style.display = visible ? 'block' : 'none'; }
  public updateStats(time: string, deaths: number, stars: number, totalStars: number, score: number, rating: number): void {
    (this.element.querySelector('#end-time') as HTMLElement).innerText = `Time: ${time}`;
    (this.element.querySelector('#end-deaths') as HTMLElement).innerText = `Deaths: ${deaths}`;
    (this.element.querySelector('#end-stars') as HTMLElement).innerText = `Stars: ${stars}/${totalStars}`;
    (this.element.querySelector('#end-score') as HTMLElement).innerText = `Score: ${score}`;
    (this.element.querySelector('#end-rating') as HTMLElement).innerText = '⭐'.repeat(rating);
  }
}
