export class TouchControls {
  private element: HTMLElement; private jumpButton: HTMLButtonElement; private sprintButton: HTMLButtonElement; private onJump: () => void; private onSprint: (sprint: boolean) => void;
  constructor(_onMove: (x: number, y: number) => void, onJump: () => void, onSprint: (sprint: boolean) => void) {
    this.onJump = onJump; this.onSprint = onSprint; this.element = document.createElement('div'); this.element.id = 'touch-controls';
    this.element.innerHTML = `<div id="touch-joystick"><div id="touch-joystick-knob"></div></div><div class="touch-buttons"><button id="touch-sprint">Sprint</button><button id="touch-jump">Jump</button></div>`;
    this.jumpButton = this.element.querySelector('#touch-jump') as HTMLButtonElement; this.sprintButton = this.element.querySelector('#touch-sprint') as HTMLButtonElement;
    this.jumpButton.onclick = this.onJump; this.sprintButton.onclick = () => { this.onSprint(!this.sprintButton.classList.contains('active')); this.sprintButton.classList.toggle('active'); };
    document.getElementById('ui-container')?.appendChild(this.element); this.applyStyles();
  }
  private applyStyles(): void { Object.assign(this.element.style, { position: 'absolute', bottom: '0', left: '0', width: '100%', height: '30%', display: 'none', justifyContent: 'space-between', alignItems: 'flex-end', padding: '40px', pointerEvents: 'none' }); }
  public setVisible(visible: boolean): void { this.element.style.display = visible ? 'flex' : 'none'; }
}
