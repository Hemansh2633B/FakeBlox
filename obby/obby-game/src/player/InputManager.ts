import { Vector2 } from 'three';

export interface InputStateSnapshot {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  jumpHeld: boolean;
  sprintHeld: boolean;
  jumpPressed: boolean;
  jumpReleased: boolean;
}

const clampAxis = (value: number): number => {
  if (Math.abs(value) < 0.0001) {
    return 0;
  }

  return Math.max(-1, Math.min(1, value));
};

export class InputManager {
  public readonly movement = new Vector2();
  public readonly lookDelta = new Vector2();

  public moveX = 0;
  public moveY = 0;
  public lookX = 0;
  public lookY = 0;

  public jumpHeld = false;
  public jumpPressed = false;
  public jumpReleased = false;
  public sprintHeld = false;
  public pointerLocked = false;

  private readonly pressedKeys = new Set<string>();
  private queuedLookX = 0;
  private queuedLookY = 0;
  private enabled = true;
  private disposed = false;

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled) {
      return;
    }

    const code = event.code;
    const wasHeld = this.pressedKeys.has(code);
    this.pressedKeys.add(code);

    if (code === 'Space') {
      if (!wasHeld) {
        this.jumpPressed = true;
      }
      this.jumpHeld = true;
      event.preventDefault();
    }

    if (code === 'ShiftLeft' || code === 'ShiftRight') {
      this.sprintHeld = true;
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const code = event.code;
    this.pressedKeys.delete(code);

    if (code === 'Space') {
      this.jumpHeld = false;
      this.jumpReleased = true;
    }

    if (code === 'ShiftLeft' || code === 'ShiftRight') {
      this.sprintHeld =
        this.pressedKeys.has('ShiftLeft') || this.pressedKeys.has('ShiftRight');
    }
  };

  private readonly handleBlur = (): void => {
    this.pressedKeys.clear();
    this.jumpHeld = false;
    this.sprintHeld = false;
    this.lookDelta.set(0, 0);
    this.queuedLookX = 0;
    this.queuedLookY = 0;
  };

  private readonly handleMouseMove = (event: MouseEvent): void => {
    if (!this.enabled || !this.pointerLocked) {
      return;
    }

    this.queuedLookX += event.movementX;
    this.queuedLookY += event.movementY;
  };

  private readonly handlePointerLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement === this.domElement;
  };

  public constructor(private readonly domElement: HTMLElement) {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (!enabled) {
      this.handleBlur();
      this.jumpPressed = false;
      this.jumpReleased = false;
      this.movement.set(0, 0);
      this.moveX = 0;
      this.moveY = 0;
    }
  }

  public requestPointerLock(): Promise<void> | void {
    if (!this.enabled) {
      return;
    }

    if (this.domElement.requestPointerLock) {
      return this.domElement.requestPointerLock();
    }
  }

  public exitPointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  public update(): void {
    const left = this.isMoveLeft() ? 1 : 0;
    const right = this.isMoveRight() ? 1 : 0;
    const forward = this.isMoveForward() ? 1 : 0;
    const backward = this.isMoveBackward() ? 1 : 0;

    this.moveX = clampAxis(right - left);
    this.moveY = clampAxis(forward - backward);
    this.movement.set(this.moveX, this.moveY);

    this.lookX = this.queuedLookX;
    this.lookY = this.queuedLookY;
    this.lookDelta.set(this.lookX, this.lookY);
    this.queuedLookX = 0;
    this.queuedLookY = 0;

    this.sprintHeld =
      this.pressedKeys.has('ShiftLeft') || this.pressedKeys.has('ShiftRight');
  }

  public endFrame(): void {
    this.jumpPressed = false;
    this.jumpReleased = false;
    this.lookX = 0;
    this.lookY = 0;
    this.lookDelta.set(0, 0);
  }

  public snapshot(): InputStateSnapshot {
    return {
      moveX: this.moveX,
      moveY: this.moveY,
      lookX: this.lookX,
      lookY: this.lookY,
      jumpHeld: this.jumpHeld,
      sprintHeld: this.sprintHeld,
      jumpPressed: this.jumpPressed,
      jumpReleased: this.jumpReleased,
    };
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
  }

  private isMoveForward(): boolean {
    return this.pressedKeys.has('KeyW') || this.pressedKeys.has('ArrowUp');
  }

  private isMoveBackward(): boolean {
    return this.pressedKeys.has('KeyS') || this.pressedKeys.has('ArrowDown');
  }

  private isMoveLeft(): boolean {
    return this.pressedKeys.has('KeyA') || this.pressedKeys.has('ArrowLeft');
  }

  private isMoveRight(): boolean {
    return this.pressedKeys.has('KeyD') || this.pressedKeys.has('ArrowRight');
  }
}