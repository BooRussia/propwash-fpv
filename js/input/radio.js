// ============================================================
// PropWash FPV — RadioManager
// Gamepad (radio transmitter) polling, device selection, and
// calibrated control output with light RC smoothing.
//
// Consumed by main.js every frame:
//   radio.update(performance.now())
//   radio.connected / radio.deviceName / radio.raw / radio.controls
// Consumed by the calibration UI:
//   radio.listGamepads() / radio.selectDevice(id) / radio.raw
//
// Calibration shape (written by the calibration wizard):
//   settings.controller.calibration = {
//     axes: { [axisIndex]: { min, max, center, invert, deadband, trim } },
//     map:  { throttle, roll, pitch, yaw: axisIndex,
//             arm: { type: 'axis'|'button', index, threshold } | null }
//   }
// ============================================================

import { settings, saveSettings, emit, clamp } from '../core/state.js';

const EPS = 1e-6;

// Smoothing: one-pole low-pass, frame-rate independent.
// alpha = 1 - exp(-dt * 60 * ln2)  →  exactly 0.5 at 60 fps
// (≈ one 120 Hz pole equivalent — kills ADC jitter, no felt latency).
const SMOOTH_K = Math.log(2) * 60;

const BIPOLAR_CHANNELS = ['roll', 'pitch', 'yaw'];

function shortId(id) {
  const s = String(id == null ? '' : id);
  return s.length > 42 ? `${s.slice(0, 39)}…` : s;
}

export class RadioManager {
  constructor() {
    this._supported =
      typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function';

    this._connected = false;
    this._activeId = null;

    // Reused snapshot buffers (no per-frame allocation).
    this._axes = [];
    this._buttons = [];
    this._raw = { axes: this._axes, buttons: this._buttons };
    this._emptyRaw = { axes: [], buttons: [] };

    // Smoothed outputs + per-frame targets (reused objects).
    this._controls = { throttle: 0, roll: 0, pitch: 0, yaw: 0, armSwitch: null };
    this._target = { throttle: 0, roll: 0, pitch: 0, yaw: 0 };

    this._lastNowMs = -1;

    // Listening for these events also nudges some browsers into
    // exposing pads through navigator.getGamepads().
    try {
      window.addEventListener('gamepadconnected', (e) => {
        const id = e && e.gamepad ? e.gamepad.id : '';
        emit('osd:flash', { text: `RADIO CONNECTED: ${shortId(id)}`, ms: 1600 });
      });
      window.addEventListener('gamepaddisconnected', (e) => {
        const id = e && e.gamepad ? e.gamepad.id : '';
        emit('osd:flash', { text: `RADIO DISCONNECTED: ${shortId(id)}`, ms: 1600 });
      });
    } catch (err) {
      // Non-browser / restricted context: polling still guarded below.
      console.warn('[RadioManager] gamepad event wiring failed', err);
    }
  }

  // ---------------- polling ----------------

  _pollPads() {
    if (!this._supported) return null;
    try {
      return navigator.getGamepads();
    } catch (err) {
      // Permissions-policy or detached-frame failures.
      return null;
    }
  }

  _findActivePad(pads) {
    if (!pads) return null;
    const wantId =
      settings.controller && settings.controller.deviceId != null
        ? settings.controller.deviceId
        : null;
    let first = null;
    for (let i = 0; i < pads.length; i++) {
      const p = pads[i];
      if (!p || p.connected === false) continue;
      if (wantId !== null && p.id === wantId) return p;
      if (first === null) first = p;
    }
    return first;
  }

  /**
   * Poll gamepads and refresh raw + calibrated snapshots.
   * Must be called once per frame; nowMs = performance.now().
   */
  update(nowMs) {
    if (!Number.isFinite(nowMs)) {
      nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    }
    let dt = this._lastNowMs < 0 ? 1 / 60 : (nowMs - this._lastNowMs) / 1000;
    this._lastNowMs = nowMs;
    dt = clamp(dt, 0, 0.1);

    const pad = this._findActivePad(this._pollPads());

    if (!pad) {
      if (this._connected) this._resetNeutral();
      this._connected = false;
      this._activeId = null;
      this._axes.length = 0;
      this._buttons.length = 0;
      return;
    }

    this._connected = true;
    this._activeId = pad.id;

    // Snapshot axes/buttons into reused arrays.
    const axes = pad.axes || [];
    this._axes.length = axes.length;
    for (let i = 0; i < axes.length; i++) {
      const v = axes[i];
      this._axes[i] = Number.isFinite(v) ? v : 0;
    }
    const buttons = pad.buttons || [];
    this._buttons.length = buttons.length;
    for (let i = 0; i < buttons.length; i++) {
      const b = buttons[i];
      let v = 0;
      if (b) {
        if (typeof b.value === 'number' && Number.isFinite(b.value)) v = b.value;
        else if (b.pressed) v = 1;
      }
      this._buttons[i] = clamp(v, 0, 1);
    }

    this._computeControls(dt);
  }

  _resetNeutral() {
    const c = this._controls;
    const t = this._target;
    c.throttle = c.roll = c.pitch = c.yaw = 0;
    t.throttle = t.roll = t.pitch = t.yaw = 0;
    c.armSwitch = null;
  }

  // ---------------- calibration math ----------------

  _axisCal(axesCal, idx) {
    if (idx == null || !Number.isFinite(Number(idx))) return null;
    const cal = axesCal[idx];
    return cal && typeof cal === 'object' ? cal : null;
  }

  _axisValue(idx) {
    const i = Number(idx);
    if (!Number.isInteger(i) || i < 0 || i >= this._axes.length) return null;
    return this._axes[i];
  }

  /** Bipolar channel: split at center → -1..1, then invert, trim, deadband. */
  _normBipolar(v, cal) {
    const min = Number(cal.min);
    const max = Number(cal.max);
    const center = Number(cal.center);
    if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(center)) return 0;

    let n;
    if (v >= center) {
      const span = max - center;
      n = span > EPS ? (v - center) / span : 0;
    } else {
      const span = center - min;
      n = span > EPS ? (v - center) / span : 0;
    }
    n = clamp(n, -1, 1);
    if (cal.invert) n = -n;

    const trim = Number(cal.trim);
    if (Number.isFinite(trim) && trim !== 0) n = clamp(n + trim, -1, 1);

    const db = clamp(Number(cal.deadband) || 0, 0, 0.95);
    if (db > 0) {
      const a = Math.abs(n);
      n = a <= db ? 0 : ((a - db) / (1 - db)) * Math.sign(n);
    }
    return clamp(n, -1, 1);
  }

  /** Throttle: full min..max range → 0..1, invert flips, then trim + clamp. */
  _normThrottle(v, cal) {
    const min = Number(cal.min);
    const max = Number(cal.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return 0;

    const span = max - min;
    let n = span > EPS ? (v - min) / span : 0;
    n = clamp(n, 0, 1);
    if (cal.invert) n = 1 - n;

    const trim = Number(cal.trim);
    if (Number.isFinite(trim) && trim !== 0) n = n + trim;
    return clamp(n, 0, 1);
  }

  _computeArm(arm) {
    if (!arm || typeof arm !== 'object') return null;
    if (arm.type === 'axis') {
      const v = this._axisValue(arm.index);
      if (v === null) return false;
      const threshold = Number.isFinite(Number(arm.threshold)) ? Number(arm.threshold) : 0;
      // direction records which way the switch deflected during calibration
      return (Number(arm.direction) || 1) < 0 ? v < threshold : v > threshold;
    }
    if (arm.type === 'button') {
      const i = Number(arm.index);
      if (!Number.isInteger(i) || i < 0 || i >= this._buttons.length) return false;
      return this._buttons[i] > 0.5;
    }
    return null;
  }

  _computeControls(dt) {
    const root = settings.controller ? settings.controller.calibration : null;
    if (!root || typeof root !== 'object' || !root.map || !root.axes) {
      this._resetNeutral();
      return;
    }

    const map = root.map;
    const axesCal = root.axes;
    const t = this._target;

    // Throttle
    {
      const cal = this._axisCal(axesCal, map.throttle);
      const v = this._axisValue(map.throttle);
      t.throttle = cal && v !== null ? this._normThrottle(v, cal) : 0;
    }
    // Roll / pitch / yaw
    for (let i = 0; i < BIPOLAR_CHANNELS.length; i++) {
      const ch = BIPOLAR_CHANNELS[i];
      const cal = this._axisCal(axesCal, map[ch]);
      const v = this._axisValue(map[ch]);
      t[ch] = cal && v !== null ? this._normBipolar(v, cal) : 0;
    }

    // One-pole low-pass toward targets.
    const alpha = 1 - Math.exp(-dt * SMOOTH_K);
    const c = this._controls;
    c.throttle = clamp(c.throttle + (t.throttle - c.throttle) * alpha, 0, 1);
    c.roll = clamp(c.roll + (t.roll - c.roll) * alpha, -1, 1);
    c.pitch = clamp(c.pitch + (t.pitch - c.pitch) * alpha, -1, 1);
    c.yaw = clamp(c.yaw + (t.yaw - c.yaw) * alpha, -1, 1);

    c.armSwitch = this._computeArm(map.arm);
  }

  // ---------------- public surface ----------------

  /** True when a usable gamepad is present. */
  get connected() {
    return this._connected;
  }

  /** Id string of the active gamepad, or null when disconnected. */
  get deviceName() {
    return this._connected ? this._activeId : null;
  }

  /** All non-null pads as {index, id} for the calibration device picker. */
  listGamepads() {
    const out = [];
    const pads = this._pollPads();
    if (!pads) return out;
    for (let i = 0; i < pads.length; i++) {
      const p = pads[i];
      if (!p || p.connected === false) continue;
      out.push({ index: p.index != null ? p.index : i, id: p.id });
    }
    return out;
  }

  /** Persist the preferred device; takes effect on the next update(). */
  selectDevice(id) {
    if (!settings.controller) settings.controller = { deviceId: null, calibration: null };
    settings.controller.deviceId = id == null ? null : String(id);
    saveSettings();
  }

  /** Raw snapshot of the active pad. Empty arrays when disconnected. */
  get raw() {
    return this._connected ? this._raw : this._emptyRaw;
  }

  /**
   * Calibrated, smoothed outputs:
   *   { throttle: 0..1, roll: -1..1, pitch: -1..1, yaw: -1..1, armSwitch: bool|null }
   * Neutral {0,0,0,0,null} when disconnected or no calibration stored.
   */
  get controls() {
    return this._controls;
  }
}
