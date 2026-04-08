// game/input.js — Keyboard, mouse, touch, gamepad input
import * as THREE from 'three';
import { CONFIG } from './generation.js';

export class InputManager {
  constructor() {
    this.keys = {};
    this.moveDir = new THREE.Vector2();
    this.camDelta = new THREE.Vector2();
    this.jump = false;
    this.jumpPressed = false;
    this.sprint = false;
    this.pause = false;
    this.reset = false;
    this._prevJump = false;
    this.locked = false;
    this.rightClickDown = false;
    this.shiftLocked = false;
    this.touchMove = new THREE.Vector2();
    this.touchJump = false;
    this.touchSprint = false;
    this.isMobile = 'ontouchstart' in window;
    this.gamepadIndex = -1;

    /** @type {import('./main.js').Game|null} */
    this._game = null;
  }

  /** Must be called after game is created to wire up references */
  setGame(game) {
    this._game = game;
  }

  bind() {
    const self = this;

    window.addEventListener('keydown', e => {
      self.keys[e.code] = true;
      if (e.code === 'ShiftLeft' && self._game && self._game.state === 'playing') {
        self.shiftLocked = !self.shiftLocked;
        if (self.shiftLocked && !self.locked && !self.isMobile) {
          document.body.requestPointerLock().catch(() => {});
        } else if (!self.shiftLocked && self.locked && !self.rightClickDown) {
          document.exitPointerLock();
        }
      }
    });

    window.addEventListener('keyup', e => { self.keys[e.code] = false; });

    document.addEventListener('pointerlockchange', () => {
      self.locked = document.pointerLockElement !== null;
      document.getElementById('crosshair').style.display = (self.locked && self.shiftLocked) ? 'block' : 'none';
      if (!self.locked) {
        self.rightClickDown = false;
      }
    });

    document.addEventListener('mousedown', e => {
      if (self._game && self._game.state !== 'playing') return;
      if (e.button === 2) {
        self.rightClickDown = true;
        if (!self.locked && !self.isMobile) {
          document.body.requestPointerLock().catch(() => {});
        }
      }
    });

    document.addEventListener('mouseup', e => {
      if (e.button === 2) {
        self.rightClickDown = false;
        if (self.locked && !self.shiftLocked) {
          document.exitPointerLock();
        }
      }
    });

    document.addEventListener('mousemove', e => {
      if (self.locked || self.rightClickDown) {
        self.camDelta.x += e.movementX;
        self.camDelta.y += e.movementY;
      }
    });

    document.addEventListener('contextmenu', e => e.preventDefault());

    document.addEventListener('wheel', e => {
      if (self._game) self._game.handleZoom(Math.sign(e.deltaY) * CONFIG.camera.zoom);
    }, { passive: true });

    window.addEventListener('gamepadconnected', e => { self.gamepadIndex = e.gamepad.index; });

    if (this.isMobile) this.setupTouch();
  }

  setupTouch() {
    document.getElementById('touch-controls').style.display = 'block';
    const base = document.querySelector('.joystick-base');
    const knob = document.getElementById('joystick-knob');
    let joystickActive = false, baseRect;

    const handleJoystick = (x, y) => {
      if (!baseRect) baseRect = base.getBoundingClientRect();
      const cx = baseRect.left + baseRect.width / 2;
      const cy = baseRect.top + baseRect.height / 2;
      let dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxR = baseRect.width / 2;
      if (dist > maxR) { dx = dx / dist * maxR; dy = dy / dist * maxR; }
      knob.style.left = `calc(50% + ${dx}px)`;
      knob.style.top = `calc(50% + ${dy}px)`;
      this.touchMove.set(dx / maxR, -dy / maxR);
    };

    base.addEventListener('touchstart', e => {
      joystickActive = true;
      baseRect = base.getBoundingClientRect();
      handleJoystick(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        if (joystickActive && t.clientX < window.innerWidth / 2) {
          handleJoystick(t.clientX, t.clientY);
          break;
        }
        if (t.clientX > window.innerWidth / 2) {
          this.camDelta.x += t.clientX - (this._lastTouchX || t.clientX);
          this.camDelta.y += t.clientY - (this._lastTouchY || t.clientY);
          this._lastTouchX = t.clientX;
          this._lastTouchY = t.clientY;
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      joystickActive = false;
      this.touchMove.set(0, 0);
      knob.style.left = '50%';
      knob.style.top = '50%';
      this._lastTouchX = null;
      this._lastTouchY = null;
    });

    const jumpBtn = document.getElementById('touch-jump');
    jumpBtn.addEventListener('touchstart', e => { this.touchJump = true; e.preventDefault(); }, { passive: false });
    jumpBtn.addEventListener('touchend', () => { this.touchJump = false; });

    const sprintBtn = document.getElementById('touch-sprint');
    sprintBtn.addEventListener('touchstart', e => {
      this.touchSprint = !this.touchSprint;
      e.preventDefault();
      sprintBtn.style.background = this.touchSprint ? 'rgba(124,77,255,0.4)' : 'rgba(255,255,255,0.1)';
    }, { passive: false });
  }

  update() {
    this.camDelta.set(0, 0);
    this._prevJump = this.jump;

    const mv = new THREE.Vector2();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) mv.y += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) mv.y -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) mv.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) mv.x += 1;
    mv.x += this.touchMove.x;
    mv.y += this.touchMove.y;
    if (mv.length() > 1) mv.normalize();
    this.moveDir.copy(mv);

    this.jump = !!(this.keys['Space'] || this.touchJump);
    this.jumpPressed = this.jump && !this._prevJump;
    this.sprint = !!(this.keys['ControlLeft'] || this.keys['KeyC'] || this.touchSprint);
    this.pause = !!this.keys['Escape'];
    this.reset = !!this.keys['KeyR'];

    this.updateGamepad();

    this.keys['Escape'] = false;
    this.keys['KeyR'] = false;
  }

  updateGamepad() {
    if (this.gamepadIndex < 0) return;
    const gp = navigator.getGamepads()[this.gamepadIndex];
    if (!gp) return;
    const dz = 0.15;
    const lx = Math.abs(gp.axes[0]) > dz ? gp.axes[0] : 0;
    const ly = Math.abs(gp.axes[1]) > dz ? -gp.axes[1] : 0;
    if (Math.abs(lx) + Math.abs(ly) > dz) this.moveDir.set(lx, ly);
    const rx = Math.abs(gp.axes[2]) > dz ? gp.axes[2] * 5 : 0;
    const ry = Math.abs(gp.axes[3]) > dz ? gp.axes[3] * 5 : 0;
    if (Math.abs(rx) + Math.abs(ry) > 0) this.camDelta.set(rx, ry);
    const prev = this.jump;
    if (gp.buttons[0]?.pressed) this.jump = true;
    if (gp.buttons[0]?.pressed && !prev) this.jumpPressed = true;
    if (gp.buttons[6]?.pressed) this.sprint = true;
  }
}
