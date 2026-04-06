export class DebugOverlay {
  private root: HTMLElement;
  private stats: HTMLElement;
  private killButton: HTMLButtonElement;
  private frameCounter = 0;
  private fps = 0;
  private fpsAccum = 0;

  constructor(onKill: () => void) {
    this.root = document.createElement('div');
    this.root.id = 'debug-overlay';
    this.stats = document.createElement('pre');
    this.killButton = document.createElement('button');
    this.killButton.innerText = 'Instant Kill';
    this.killButton.onclick = onKill;
    this.root.append(this.stats, this.killButton);
    document.getElementById('ui-container')?.appendChild(this.root);
    this.applyStyles();
    this.setVisible(false);
  }

  private applyStyles(): void {
    Object.assign(this.root.style, {
      position: 'absolute',
      top: '12px',
      right: '12px',
      minWidth: '220px',
      background: 'rgba(0,0,0,0.75)',
      color: '#9effa8',
      padding: '10px',
      borderRadius: '10px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: '999',
      pointerEvents: 'auto',
    });
    Object.assign(this.killButton.style, {
      marginTop: '8px',
      width: '100%',
      cursor: 'pointer',
    });
  }

  public update(deltaTime: number, data: { x: number; y: number; z: number; vx: number; vy: number; vz: number; grounded: boolean; coyote: number }): void {
    this.frameCounter += 1;
    this.fpsAccum += deltaTime;
    if (this.fpsAccum >= 0.25) {
      this.fps = Math.round(this.frameCounter / this.fpsAccum);
      this.frameCounter = 0;
      this.fpsAccum = 0;
    }
    this.stats.innerText = [
      `FPS: ${this.fps}`,
      `Pos: ${data.x.toFixed(2)}, ${data.y.toFixed(2)}, ${data.z.toFixed(2)}`,
      `Vel: ${data.vx.toFixed(2)}, ${data.vy.toFixed(2)}, ${data.vz.toFixed(2)}`,
      `Grounded: ${data.grounded ? 'yes' : 'no'}`,
      `Coyote: ${data.coyote.toFixed(3)}s`,
    ].join('\n');
  }

  public setVisible(visible: boolean): void {
    this.root.style.display = visible ? 'block' : 'none';
  }
}

