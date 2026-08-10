// ============================================================
// PropWash FPV — KeyboardInput
// Hotkeys (bus events) + keyboard flight fallback so users can
// fly before plugging a radio in.
//
// Consumed by main.js every frame:
//   keyboard.getFlightControls(dt) -> {throttle, roll, pitch, yaw, active}
//
// Hotkeys emitted on the shared bus:
//   Escape -> hotkey:menu      KeyR  -> hotkey:reset
//   Space  -> hotkey:arm       KeyV  -> hotkey:view
//   KeyC   -> hotkey:static
//   ArrowUp/Down    -> hotkey:camTilt {delta: +1/-1}   (repeat allowed)
//   ArrowRight/Left -> hotkey:fov     {delta: +2/-2}   (repeat allowed)
//
// Flight keys: I/K throttle (sticky), W/S pitch, A/D roll, J/L yaw.
// ============================================================

import { emit, clamp } from '../core/state.js';

const FLIGHT_CODES = new Set(['KeyI', 'KeyK', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyJ', 'KeyL']);
const PREVENT_CODES = new Set([
  'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyC', 'KeyV', 'KeyR',
]);

const THROTTLE_RATE = 0.8; // sticky throttle, units per second
const RAMP_RATE = 7;       // momentary axes toward ±1, per second
const DECAY_RATE = 5;      // momentary axes back to 0, per second

function isTypingTarget(t) {
  if (!t || typeof t.tagName !== 'string') return false;
  const tag = t.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable === true;
}

export class KeyboardInput {
  constructor() {
    this._down = new Set();       // currently-held key codes
    this._flightTouched = false;  // latches true on first flight key press

    this._throttle = 0;           // sticky
    this._roll = 0;
    this._pitch = 0;
    this._yaw = 0;

    // Reused result object — no per-frame allocation.
    this._out = { throttle: 0, roll: 0, pitch: 0, yaw: 0, active: false };

    this._onKeyDown = (e) => this._handleKeyDown(e);
    this._onKeyUp = (e) => this._handleKeyUp(e);
    this._onBlur = () => this._down.clear();
    this._onVisibility = () => {
      if (document.visibilityState === 'hidden') this._down.clear();
    };

    try {
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);
      window.addEventListener('blur', this._onBlur);
      document.addEventListener('visibilitychange', this._onVisibility);
    } catch (err) {
      console.warn('[KeyboardInput] listener wiring failed', err);
    }
  }

  // ---------------- event handlers ----------------

  _handleKeyDown(e) {
    // Typing in a menu field: leave the event entirely alone.
    if (isTypingTarget(e.target)) return;

    const code = e.code;

    // Preserve browser shortcuts (Ctrl+C, Ctrl+R, Alt+arrows, …).
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (PREVENT_CODES.has(code)) e.preventDefault();

    this._down.add(code);
    if (FLIGHT_CODES.has(code)) this._flightTouched = true;

    switch (code) {
      case 'Escape':
        if (!e.repeat) emit('hotkey:menu');
        break;
      case 'KeyR':
        if (!e.repeat) emit('hotkey:reset');
        break;
      case 'Space':
        if (!e.repeat) emit('hotkey:arm');
        break;
      case 'KeyV':
        if (!e.repeat) emit('hotkey:view');
        break;
      case 'KeyC':
        if (!e.repeat) emit('hotkey:static');
        break;
      case 'ArrowUp':
        emit('hotkey:camTilt', { delta: +1 });   // key repeat allowed
        break;
      case 'ArrowDown':
        emit('hotkey:camTilt', { delta: -1 });
        break;
      case 'ArrowRight':
        emit('hotkey:fov', { delta: +2 });
        break;
      case 'ArrowLeft':
        emit('hotkey:fov', { delta: -2 });
        break;
    }
  }

  _handleKeyUp(e) {
    // Always release, even if focus moved into an input mid-hold —
    // otherwise a flight key could stick down forever.
    this._down.delete(e.code);
  }

  // ---------------- flight fallback ----------------

  /** Held-key pair → -1 | 0 | +1 (both held cancels out). */
  _pair(negCode, posCode) {
    return (this._down.has(posCode) ? 1 : 0) - (this._down.has(negCode) ? 1 : 0);
  }

  /** Momentary axis: ramp toward ±1 while held, decay to 0 when released. */
  _ramp(cur, target, dt) {
    if (target !== 0) {
      const step = RAMP_RATE * dt;
      const d = target - cur;
      if (Math.abs(d) <= step) return target;
      return cur + Math.sign(d) * step;
    }
    const step = DECAY_RATE * dt;
    if (Math.abs(cur) <= step) return 0;
    return cur - Math.sign(cur) * step;
  }

  /**
   * Keyboard flight controls. Call once per frame with the frame dt (s).
   * Returns {throttle: 0..1, roll: -1..1, pitch: -1..1, yaw: -1..1, active}.
   * `active` latches true once any flight key has ever been touched.
   */
  getFlightControls(dt) {
    if (!Number.isFinite(dt) || dt < 0) dt = 0;
    dt = Math.min(dt, 0.1);

    // Sticky throttle: integrates while held, stays put on release.
    const thrDir = this._pair('KeyK', 'KeyI'); // I up, K down
    if (thrDir !== 0) this._throttle = clamp(this._throttle + thrDir * THROTTLE_RATE * dt, 0, 1);

    // Momentary axes. Left = negative, right/forward = positive.
    this._roll = this._ramp(this._roll, this._pair('KeyA', 'KeyD'), dt);  // A left, D right
    this._pitch = this._ramp(this._pitch, this._pair('KeyS', 'KeyW'), dt); // W fwd, S back
    this._yaw = this._ramp(this._yaw, this._pair('KeyJ', 'KeyL'), dt);   // J left, L right

    const out = this._out;
    out.throttle = this._throttle;
    out.roll = this._roll;
    out.pitch = this._pitch;
    out.yaw = this._yaw;
    out.active = this._flightTouched;
    return out;
  }

  /** True while any key (tracked by this listener) is held. Diagnostics. */
  get anyKeyDown() {
    return this._down.size > 0;
  }

  /** Remove all listeners (not used by main.js, provided for completeness). */
  dispose() {
    try {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
      window.removeEventListener('blur', this._onBlur);
      document.removeEventListener('visibilitychange', this._onVisibility);
    } catch (err) { /* already detached */ }
    this._down.clear();
  }
}
