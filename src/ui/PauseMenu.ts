export class PauseMenu {
  private element: HTMLElement; private resumeButton: HTMLButtonElement; private onResume: () => void;
  constructor(onResume: () => void) {
    this.onResume = onResume; this.element = document.createElement('div'); this.element.id = 'pause-menu';
    this.element.innerHTML = `<h2>PAUSED</h2><button id="menu-resume">Resume Game</button><button id="menu-quit">Quit to Main Menu</button>`;
    this.resumeButton = this.element.querySelector('#menu-resume') as HTMLButtonElement; this.resumeButton.onclick = this.onResume;
    document.getElementById('ui-container')?.appendChild(this.element); this.applyStyles();
  }
  private applyStyles(): void { Object.assign(this.element.style, { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '10px', color: 'white', textAlign: 'center', minWidth: '200px', pointerEvents: 'auto' }); }
  public setVisible(visible: boolean): void { this.element.style.display = visible ? 'block' : 'none'; }
}
