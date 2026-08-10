// ============================================================
// PropWash FPV — quad flight dynamics
//
// Betaflight-flavoured flight model, stepped at a fixed 400 Hz by
// main.js. Semi-implicit Euler, body frame: +X right, +Y up,
// -Z forward (three.js camera convention, matches main.js FPV cam).
//
// Stick conventions (matches input/keyboard.js & input/radio.js):
//   roll  +1 = roll right      → negative rotation about body +Z
//   pitch +1 = nose forward    → negative rotation about body +X
//   yaw   +1 = nose right      → negative rotation about body +Y
//
// Model summary:
//   sticks → Betaflight "Actual Rates" → rate setpoints (rad/s)
//   torque-limited P controller toward setpoint (responseTau)
//   first-order motor lag on torque & thrust (spec.motorTau)
//   thrust ∝ throttle^2 * battery voltage factor, air-mode idle floor
//   battery: rest-voltage discharge + throttle^2 sag → punch fade
//   per-axis quadratic aero drag (front/top/side CdA), wind aware
//   prop wash wobble when descending into own wake, ground effect,
//   ground + AABB collisions with crash detection.
// ============================================================

import * as THREE from 'three';
import { clamp } from '../core/state.js';

const DEG2RAD = Math.PI / 180;
const GRAVITY = 9.81;           // m/s^2
const RHO = 1.225;              // air density kg/m^3
const RESPONSE_TAU = 0.025;     // rate-loop time constant (s)
const AIRMODE_IDLE = 0.035;     // minimum throttle while armed
const MAX_SPEED = 80;           // hard velocity clamp m/s
const MAX_ANG_VEL = 50;         // hard body-rate clamp rad/s
const ANGLE_MAX = 55 * DEG2RAD; // max lean in angle mode
const ANGLE_P = 8.0;            // attitude P (1/s)
const ANGLE_D = 0.12;           // attitude D on rate (dimensionless)
const FULL_V = 4.2;             // fresh cell volts
const EMPTY_V = 3.5;            // "landed" rest volts per cell
const RESTITUTION = 0.3;
const FRICTION_KEEP = 0.75;     // tangential velocity kept per impact
const ANGVEL_KEEP = 0.55;       // angular velocity kept per impact

const DEF_RATE_RP = { centerSens: 200, maxRate: 670, expo: 0.54 };
const DEF_RATE_Y  = { centerSens: 200, maxRate: 500, expo: 0.54 };
const ZERO_VEC = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

/**
 * Betaflight applyActualRates (deg values pre-converted to rad):
 *   expof = |x| * (x^5*expo + x*(1-expo))
 *   rate  = centerSens*x + max(0, maxRate-centerSens) * expof
 */
function actualRate(x, ax) {
  const a = Math.abs(x);
  const x5 = x * x * x * x * x;
  const expof = a * (x5 * ax.expo + x * (1 - ax.expo));
  const stickMovement = Math.max(0, ax.maxRad - ax.centerRad);
  return ax.centerRad * x + stickMovement * expof;
}

export class Quad {
  constructor(spec) {
    this.spec = spec;

    // ---- public readable state (consumed by main.js) ----
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();          // world m/s
    this.quaternion = new THREE.Quaternion();
    this.angularVelocity = new THREE.Vector3();   // body rad/s
    this.motorOutput = 0;                          // 0..1 average drive
    this.batteryVolts = FULL_V * spec.cells;
    this.crashed = false;
    this.carryMassKg = 0;                          // payload

    // ---- inputs / config ----
    this._input = { throttle: 0, roll: 0, pitch: 0, yaw: 0 };
    this._mode = 'acro';
    this._rates = null;
    this.setRates(null); // install defaults

    // ---- derived constants ----
    // Disc loading drives prop-wash severity (cinewhoops wash worst).
    const propRadM = Math.max(0.01, (spec.propInches || 3) * 0.0254 / 2);
    const discArea = 4 * Math.PI * propRadM * propRadM;
    this._washFactor = clamp((spec.massKg * GRAVITY / discArea) / 160, 0.5, 1.4);
    // Battery drains a full pack in ~4.7 min of hovering.
    const hovT2 = clamp((spec.massKg * GRAVITY) / spec.maxThrustN, 0.05, 0.9);
    this._drainK = 1 / (280 * (0.02 + 0.98 * hovT2));

    // ---- filtered actuator state ----
    this._thrust = 0;                              // N, after motor lag
    this._tq = new THREE.Vector3();                // N*m, after motor lag

    // ---- battery state ----
    this._soc = 1;                                 // state of charge 0..1
    this._sag = 0;                                 // filtered sag V/cell
    this._voltFactor = 1;

    // ---- prop wash noise generator ----
    this._washN = new THREE.Vector3();             // band-limited noise
    this._washTgt = new THREE.Vector3();
    this._washTimer = 0;

    // ---- preallocated temps (no per-step allocations) ----
    this._qInv = new THREE.Quaternion();
    this._dq = new THREE.Quaternion();
    this._ub = new THREE.Vector3();                // world-up in body frame
    this._airB = new THREE.Vector3();              // body-frame airspeed
    this._fB = new THREE.Vector3();                // body-frame force
    this._fW = new THREE.Vector3();                // world-frame force
    this._n = new THREE.Vector3();                 // contact normal
    this._vt = new THREE.Vector3();                // tangential velocity
  }

  /** Zero all state; place slightly above ground, level, facing yawRad. */
  reset(positionVec3, yawRad) {
    if (positionVec3) this.position.copy(positionVec3);
    else this.position.set(0, 0, 0);
    this.position.y += this.spec.sizeM * 0.5 + 0.02;
    this.quaternion.setFromAxisAngle(UP, Number.isFinite(yawRad) ? yawRad : 0);
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
    this.crashed = false;
    this.motorOutput = 0;
    this._thrust = 0;
    this._tq.set(0, 0, 0);
    this._soc = 1;
    this._sag = 0;
    this._voltFactor = 1;
    this.batteryVolts = FULL_V * this.spec.cells;
    this._washN.set(0, 0, 0);
    this._washTgt.set(0, 0, 0);
    this._washTimer = 0;
  }

  /** throttle 0..1, roll/pitch/yaw -1..1. */
  setInputs(c) {
    if (!c) return;
    const f = (v) => (Number.isFinite(v) ? v : 0);
    this._input.throttle = clamp(f(c.throttle), 0, 1);
    this._input.roll = clamp(f(c.roll), -1, 1);
    this._input.pitch = clamp(f(c.pitch), -1, 1);
    this._input.yaw = clamp(f(c.yaw), -1, 1);
  }

  /** settings.rates shape: {roll:{centerSens,maxRate,expo}, pitch, yaw} in deg/s. */
  setRates(ratesObj) {
    const conv = (axis, def) => {
      const a = (ratesObj && ratesObj[axis]) || {};
      const center = Number.isFinite(a.centerSens) ? a.centerSens : def.centerSens;
      const max = Number.isFinite(a.maxRate) ? a.maxRate : def.maxRate;
      const expo = clamp(Number.isFinite(a.expo) ? a.expo : def.expo, 0, 1);
      return {
        centerRad: Math.max(0, center) * DEG2RAD,
        maxRad: Math.max(Math.max(0, center), max) * DEG2RAD,
        expo,
      };
    };
    this._rates = {
      roll: conv('roll', DEF_RATE_RP),
      pitch: conv('pitch', DEF_RATE_RP),
      yaw: conv('yaw', DEF_RATE_Y),
    };
  }

  /** "acro" | "angle" | "horizon" */
  setFlightMode(mode) {
    this._mode = (mode === 'angle' || mode === 'horizon') ? mode : 'acro';
  }

  /**
   * Fixed-step physics update.
   * env: { getGroundHeight(x,z)->y, colliders: [{min,max}]|null,
   *        wind: Vector3 (m/s), armed: bool }
   */
  step(dt, env) {
    if (!(dt > 0) || !Number.isFinite(dt)) return;
    const spec = this.spec;
    const armed = !!(env && env.armed) && !this.crashed;
    this._armedNow = armed;               // read by _impact for prop-strike response
    const wind = (env && env.wind) ? env.wind : ZERO_VEC;
    const getH = (env && typeof env.getGroundHeight === 'function') ? env.getGroundHeight : null;

    // Payload raises mass and (partially) inertia.
    const carry = Math.max(0, Number.isFinite(this.carryMassKg) ? this.carryMassKg : 0);
    const mass = spec.massKg + carry;
    const iScale = 1 + (carry / spec.massKg) * 0.6;
    const Ix = spec.inertia.x * iScale;
    const Iy = spec.inertia.y * iScale;
    const Iz = spec.inertia.z * iScale;
    const mt = spec.maxTorque;
    const aM = 1 - Math.exp(-dt / spec.motorTau);   // motor-lag blend

    // Air-mode idle: props always spin while armed.
    const thrIn = armed ? Math.max(this._input.throttle, AIRMODE_IDLE) : 0;

    // ---------------- battery ----------------
    if (armed) {
      this._soc = Math.max(0, this._soc - (0.02 + 0.98 * thrIn * thrIn) * this._drainK * dt);
    }
    const rest = EMPTY_V + (FULL_V - EMPTY_V) * Math.pow(this._soc, 0.75);
    // Sag ∝ throttle^2, worse as internal resistance rises near empty.
    const sagTgt = armed ? spec.sagVoltsPerCell * thrIn * thrIn * (1 + (1 - this._soc) * 0.6) : 0;
    this._sag += (sagTgt - this._sag) * (1 - Math.exp(-dt / 0.08));
    const cellV = Math.max(3.0, rest - this._sag);
    this.batteryVolts = cellV * spec.cells;
    this._voltFactor = clamp(cellV / FULL_V, 0.55, 1);

    // ---------------- shared frames ----------------
    this._qInv.copy(this.quaternion).invert();
    this._airB.copy(this.velocity).sub(wind).applyQuaternion(this._qInv);

    // ---------------- rate setpoints ----------------
    let spX = 0, spY = 0, spZ = 0;
    if (armed) {
      const r = this._rates;
      const acroX = -actualRate(this._input.pitch, r.pitch);
      const acroY = -actualRate(this._input.yaw, r.yaw);
      const acroZ = -actualRate(this._input.roll, r.roll);
      if (this._mode === 'acro') {
        spX = acroX; spY = acroY; spZ = acroZ;
      } else {
        // Attitude from world-up expressed in body frame.
        this._ub.copy(UP).applyQuaternion(this._qInv);
        const noseDown = Math.atan2(this._ub.z, this._ub.y);   // + = nose down
        const rollRight = Math.atan2(-this._ub.x, this._ub.y); // + = right down
        const ndMeas = -this.angularVelocity.x;                // current nose-down rate
        const rrMeas = -this.angularVelocity.z;                // current roll-right rate
        const ndRate = ANGLE_P * (this._input.pitch * ANGLE_MAX - noseDown) - ANGLE_D * ndMeas;
        const rrRate = ANGLE_P * (this._input.roll * ANGLE_MAX - rollRight) - ANGLE_D * rrMeas;
        const angX = clamp(-ndRate, -r.pitch.maxRad, r.pitch.maxRad);
        const angZ = clamp(-rrRate, -r.roll.maxRad, r.roll.maxRad);
        if (this._mode === 'angle') {
          spX = angX; spZ = angZ;
        } else {
          // Horizon: level at stick center, full acro at full deflection.
          const d = Math.max(Math.abs(this._input.roll), Math.abs(this._input.pitch));
          const blend = d * d;
          spX = angX + (acroX - angX) * blend;
          spZ = angZ + (acroZ - angZ) * blend;
        }
        spY = acroY; // yaw stays rate-controlled
      }
    }

    // ---------------- rate controller → torque ----------------
    const w = this.angularVelocity;
    const cmdX = armed ? clamp(Ix * (spX - w.x) / RESPONSE_TAU, -mt.x, mt.x) : 0;
    const cmdY = armed ? clamp(Iy * (spY - w.y) / RESPONSE_TAU, -mt.y, mt.y) : 0;
    const cmdZ = armed ? clamp(Iz * (spZ - w.z) / RESPONSE_TAU, -mt.z, mt.z) : 0;
    // First-order motor lag on applied torque — the attack/overshoot feel.
    this._tq.x += (cmdX - this._tq.x) * aM;
    this._tq.y += (cmdY - this._tq.y) * aM;
    this._tq.z += (cmdZ - this._tq.z) * aM;

    // ---------------- prop wash ----------------
    // Descending into own wake: band-limited torque noise ∝ descent rate
    // and disc loading. The characteristic descent wobble.
    const descent = -this._airB.y; // body-frame downward airspeed
    let washAmp = 0;
    if (armed && descent > 2 && this._input.throttle > 0.25) {
      washAmp = Math.min((descent - 2) / 5, 1.3) * this._washFactor;
    }
    this._washTimer -= dt;
    if (this._washTimer <= 0) {
      this._washTimer = 0.04 + Math.random() * 0.025; // retarget ~15-25 Hz
      this._washTgt.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
    }
    this._washN.lerp(this._washTgt, 1 - Math.exp(-dt / 0.02));
    const washX = washAmp * 0.5 * mt.x * this._washN.x;
    const washY = washAmp * 0.15 * mt.y * this._washN.y;
    const washZ = washAmp * 0.5 * mt.z * this._washN.z;

    // ---------------- integrate rotation ----------------
    w.x += ((this._tq.x + washX) / Ix) * dt;
    w.y += ((this._tq.y + washY) / Iy) * dt;
    w.z += ((this._tq.z + washZ) / Iz) * dt;
    // Mild rotational aero damping (stronger when props are dead).
    const angDamp = armed ? 0.02 : 0.35;
    w.multiplyScalar(Math.max(0, 1 - angDamp * dt));
    const wl = w.length();
    if (wl > MAX_ANG_VEL) w.multiplyScalar(MAX_ANG_VEL / wl);

    this._dq.set(w.x * dt * 0.5, w.y * dt * 0.5, w.z * dt * 0.5, 1);
    this.quaternion.multiply(this._dq).normalize();

    // ---------------- thrust ----------------
    const thrustCmd = armed
      ? spec.maxThrustN * this._voltFactor * (0.02 + 0.98 * thrIn * thrIn)
      : 0;
    this._thrust += (thrustCmd - this._thrust) * aM;
    let thrust = this._thrust;

    // Ground effect: +12% inside 2 wheelbases of the surface, linear fade.
    const gy0 = this._ground(getH, this.position.x, this.position.z);
    const geSpan = 0.5 * spec.sizeM * 4;
    const hAbove = this.position.y - gy0;
    if (hAbove < geSpan) thrust *= 1 + 0.12 * clamp(1 - hAbove / geSpan, 0, 1);

    // ---------------- forces (body frame) ----------------
    const ab = this._airB;
    this._fB.set(
      -0.5 * RHO * spec.dragArea.side  * Math.abs(ab.x) * ab.x,
      -0.5 * RHO * spec.dragArea.top   * Math.abs(ab.y) * ab.y + thrust,
      -0.5 * RHO * spec.dragArea.front * Math.abs(ab.z) * ab.z
    );
    this._fW.copy(this._fB).applyQuaternion(this.quaternion);

    const invM = 1 / mass;
    this.velocity.x += this._fW.x * invM * dt;
    this.velocity.y += (this._fW.y * invM - GRAVITY) * dt;
    this.velocity.z += this._fW.z * invM * dt;
    const vl = this.velocity.length();
    if (vl > MAX_SPEED) this.velocity.multiplyScalar(MAX_SPEED / vl);

    this.position.addScaledVector(this.velocity, dt);

    // ---------------- collisions ----------------
    this._collideGround(getH, spec, dt);
    this._collideBoxes(env ? env.colliders : null, spec, dt);

    // Numerical safety net (bad map data etc.)
    if (!Number.isFinite(this.position.x + this.position.y + this.position.z) ||
        !Number.isFinite(this.velocity.x + this.velocity.y + this.velocity.z)) {
      this.position.set(0, 2, 0);
      this.velocity.set(0, 0, 0);
      w.set(0, 0, 0);
      this.quaternion.identity();
    }

    // ---------------- motor output (audio / visuals) ----------------
    let mo = 0;
    if (armed) {
      const act = (Math.abs(this._tq.x) / mt.x +
                   Math.abs(this._tq.y) / mt.y +
                   Math.abs(this._tq.z) / mt.z) / 3;
      mo = clamp(thrIn + 0.25 * act, 0, 1);
    }
    this.motorOutput += (mo - this.motorOutput) * aM;
  }

  // ------------------------------------------------------------
  // internals
  // ------------------------------------------------------------

  /** Safe terrain sample. */
  _ground(getH, x, z) {
    if (!getH) return 0;
    try {
      const h = getH(x, z);
      return Number.isFinite(h) ? h : 0;
    } catch (e) {
      return 0;
    }
  }

  _collideGround(getH, spec, dt) {
    const r = spec.sizeM * 0.5; // arm radius
    const p = this.position;
    const gy = this._ground(getH, p.x, p.z);
    if (p.y >= gy + r) return;
    // Approximate terrain normal via central differences.
    const e = Math.max(0.2, spec.sizeM);
    const hx0 = this._ground(getH, p.x - e, p.z);
    const hx1 = this._ground(getH, p.x + e, p.z);
    const hz0 = this._ground(getH, p.x, p.z - e);
    const hz1 = this._ground(getH, p.x, p.z + e);
    this._n.set(hx0 - hx1, 2 * e, hz0 - hz1).normalize();
    p.y = gy + r;
    this._impact(this._n, spec, dt);
  }

  _collideBoxes(cols, spec, dt) {
    if (!cols || !cols.length) return;
    const r = spec.sizeM * 0.55;
    const p = this.position;
    for (let i = 0; i < cols.length; i++) {
      const b = cols[i];
      if (!b || !b.min || !b.max) continue;
      const mn = b.min, mx = b.max;
      if (p.x < mn.x - r || p.x > mx.x + r ||
          p.y < mn.y - r || p.y > mx.y + r ||
          p.z < mn.z - r || p.z > mx.z + r) continue;
      const cx = clamp(p.x, mn.x, mx.x);
      const cy = clamp(p.y, mn.y, mx.y);
      const cz = clamp(p.z, mn.z, mx.z);
      const dx = p.x - cx, dy = p.y - cy, dz = p.z - cz;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > r * r) continue;
      if (d2 > 1e-10) {
        // Sphere centre outside the box: push out along contact direction.
        const inv = 1 / Math.sqrt(d2);
        this._n.set(dx * inv, dy * inv, dz * inv);
        p.set(cx + this._n.x * r, cy + this._n.y * r, cz + this._n.z * r);
      } else {
        // Centre inside the box: exit through the nearest face.
        let best = p.x - mn.x;
        this._n.set(-1, 0, 0);
        if (mx.x - p.x < best) { best = mx.x - p.x; this._n.set(1, 0, 0); }
        if (p.y - mn.y < best) { best = p.y - mn.y; this._n.set(0, -1, 0); }
        if (mx.y - p.y < best) { best = mx.y - p.y; this._n.set(0, 1, 0); }
        if (p.z - mn.z < best) { best = p.z - mn.z; this._n.set(0, 0, -1); }
        if (mx.z - p.z < best) { best = mx.z - p.z; this._n.set(0, 0, 1); }
        p.addScaledVector(this._n, best + r);
      }
      this._impact(this._n, spec, dt);
    }
  }

  /** Bounce / friction / crash response against surface normal n. */
  _impact(n, spec, dt) {
    const v = this.velocity;
    const vn = v.dot(n);
    if (vn >= 0) return; // separating
    this._vt.copy(v).addScaledVector(n, -vn); // tangential component
    const tSpeed = this._vt.length();
    // Hard hits use full impulse response; resting contact (400 Hz repeats)
    // uses time-scaled damping so friction strength is rate-independent.
    const hard = -vn > 0.5;
    const keepT = hard ? FRICTION_KEEP : Math.pow(FRICTION_KEEP, dt * 60);
    const keepW = hard ? ANGVEL_KEEP : Math.pow(ANGVEL_KEEP, dt * 60);
    this._vt.multiplyScalar(keepT);
    v.copy(this._vt).addScaledVector(n, -vn * RESTITUTION);
    this.angularVelocity.multiplyScalar(keepW);

    // Prop strike: spinning props catching a surface kick the quad violently.
    // A slow bump is survivable; a fast scrape while armed whips it around.
    if (this._armedNow && !this.crashed && hard && tSpeed > 1.5) {
      const k = Math.min(tSpeed * 0.35, 6);
      this.angularVelocity.x += (Math.random() - 0.5) * k;
      this.angularVelocity.y += (Math.random() - 0.5) * k * 1.3; // yaw kick dominates
      this.angularVelocity.z += (Math.random() - 0.5) * k;
      v.multiplyScalar(0.93); // props eating energy
    }

    // Armed scrapes count tangential speed harder — glancing a wall at speed
    // with spinning props is usually a crash in the real world.
    const impact = -vn + (this._armedNow ? 0.4 : 0.25) * tSpeed;
    const threshold = spec.massKg < 0.1 ? 10 : 7; // whoops bounce off everything
    if (impact > threshold && !this.crashed) {
      this.crashed = true;
      // Impart a tumble; motors are cut (armed goes false via main.js).
      const k = Math.min(impact * 0.5, 12);
      this.angularVelocity.x += (Math.random() - 0.5) * k;
      this.angularVelocity.y += (Math.random() - 0.5) * k * 0.5;
      this.angularVelocity.z += (Math.random() - 0.5) * k;
      const awl = this.angularVelocity.length();
      if (awl > MAX_ANG_VEL) this.angularVelocity.multiplyScalar(MAX_ANG_VEL / awl);
    }
  }
}
