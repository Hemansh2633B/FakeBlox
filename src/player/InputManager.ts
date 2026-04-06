export class InputManager {
  private keys: Map<string, boolean> = new Map();
  private mouseDeltaX: number = 0;
  private mouseDeltaY: number = 0;
  private isPointerLocked: boolean = false;

  constructor() {
    window.addEventListener('keydown', (e) => this.keys.set(e.code, true));
    window.addEventListener('keyup', (e) => this.keys.set(e.code, false));
    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.mouseDeltaX += e.movementX;
        this.mouseDeltaY += e.movementY;
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement !== null;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && !this.isPointerLocked) {
        const target = e.target as HTMLElement;
        if (target.id === 'game-canvas') {
          target.requestPointerLock();
        }
      }
    });
  }

  public isKeyDown(code: string): boolean {
    return this.keys.get(code) === true;
  }

  public getMouseDelta(): { x: number; y: number } {
    const delta = { x: this.mouseDeltaX, y: this.mouseDeltaY };
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return delta;
  }

  public getMovementVector(): { x: number; z: number } {
    let x = 0;
    let z = 0;
    if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) z -= 1;
    if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) z += 1;
    if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) x -= 1;
    if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) x += 1;
    if (x !== 0 || z !== 0) {
      const length = Math.sqrt(x * x + z * z);
      x /= length;
      z /= length;
    }
    return { x, z };
  }

  public isSprint(): boolean {
    return this.isKeyDown('ShiftLeft') || this.isKeyDown('ShiftRight');
  }

  public isJump(): boolean {
    return this.isKeyDown('Space');
  }
}
