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
//   sticks → Actual or Betaflight rates (js/input/rates.js) → setpoints (rad/s)
//   torque-limited P controller toward setpoint (responseTau)
//   first-order motor lag on torque & thrust (spec.motorTau)
//   thrust ∝ throttle^2 * battery voltage factor, air-mode idle floor
//   battery: rest-voltage discharge + throttle^2 sag → punch fade
//   per-axis quadratic aero drag (front/top/side CdA), wind aware
//   prop wash wobble when descending into own wake, ground effect,
//   ground + shape collisions with impact damage and crash detection.
//
// Damage model (public `quad.damage`, see _damage below):
//   Every contact is scored by the velocity component actually driving
//   into the surface; the contact normal in the body frame picks which
//   arm ate the hit. Broken props cost lift, bias the control torque
//   (a dead prop is an unrecoverable spin) and buzz the airframe.
//
// Collision (js/core/collision.js):
//   The airframe is a sphere of 0.55 * wheelbase. World colliders are
//   boxes / Y-cylinders / yaw-boxes / spheres, indexed in a uniform XZ
//   spatial hash that is built once per map and cached on the array
//   identity. Fast steps are swept (2-6 substeps) so thin geometry —
//   railings, fences, sign posts — cannot be tunnelled at 40 m/s, and
//   the two deepest contacts of a step are resolved together so corners
//   push out instead of shoving the quad through the neighbour.
//   Legacy {min,max} colliders are still accepted verbatim.
// ============================================================

import * as THREE from 'three';
import { clamp, emit, settings } from '../core/state.js';
import { getRateDegS, getMaxRateDegS, normalizeRates } from '../input/rates.js';
import { effectiveMaxThrustN } from './drones.js';
import { buildGrid, resolveSphere } from '../core/collision.js';

const DEG2RAD = Math.PI / 180;
const TAU = Math.PI * 2;
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
// Tangential velocity kept per second while wedged in a too-narrow gap.
const WEDGE_SCRUB = 0.12;

const ZERO_VEC = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

// ---- prop wash tuning ----
// Amplitudes are FRACTIONS OF MAX CONTROL TORQUE. These used to be 0.5/0.15,
// which let random noise fight the pilot for most of the airframe's authority
// on any descent over 2 m/s — it read as the drone being shaken around.
const WASH_MIN_DESCENT = 3.5;   // m/s of sink before the wake is disturbed
const WASH_TORQUE_RP = 0.10;    // roll/pitch noise as a fraction of max torque
const WASH_TORQUE_Y = 0.04;     // yaw noise

// ---- swept collision tuning ----
const SWEEP_TRIGGER = 0.35;     // sweep once travel > this * airframe radius
const SWEEP_MAX_SUB = 6;
const SWEEP_TELEPORT = 2.0;     // metres of travel treated as a teleport, not flight

// ---- damage model tuning ----
// All severities are in "effective m/s": the closing speed along the contact
// normal plus a small share of the graze speed, divided by airframe robustness.
const DMG_FLOOR = 3.0;          // below this an impact is harmless, full stop
const DMG_SPAN = 11.0;          // effective m/s ABOVE the floor that writes off a prop
// Whoops are famously tough, but at 2.2 the default meteor75 needed 30.7 m/s to
// lose a prop — above its ~24 m/s top speed — so the damage model was invisible
// on the drone most people fly. 1.45 keeps whoops clearly the most durable
// airframe while putting prop loss (~20 m/s) and write-off (~18 m/s flat slam)
// inside their real flight envelope.
const DMG_WHOOP_DIV = 1.45;
const DMG_TANGENT_ARMED = 0.35; // spinning props catch a surface
const DMG_TANGENT_IDLE = 0.10;  // a dead-stick graze mostly just slides
const DMG_PROP_EXP = 1.35;      // prop damage curve (concave-up: fast hits hurt hard)
const DMG_FRAME_EXP = 1.5;      // frame damage curve
const DMG_FRAME_EDGE = 0.45;    // frame share of an edge-on hit at u = 1
const DMG_FRAME_FLAT = 0.85;    // extra frame share for a square belly/top slam
const DMG_CATASTROPHIC = 20;    // effective m/s that writes the airframe off outright
const DMG_CRIT_FRAME = 0.35;    // frame health that trips the AIRFRAME CRITICAL call
const DMG_NICK = 0.85;          // prop health that trips the first PROP n DAMAGED call
const DMG_DEAD = 0.01;          // at or below this a prop is gone (snapped to 0)
const DMG_FLASH_GAP = 0.7;      // s between OSD damage flashes (multi-contact crash → one)
const DMG_DIR_POW = 1.6;        // arm falloff: nearest 1.0, adjacent ~0.4, opposite 0.1

// Imbalance torque as a fraction of max axis torque per unit of prop asymmetry.
// One destroyed prop → asymmetry 0.5 on all three axes, and lift is down to
// ~0.78 (mean prop health), so the bias lands at roll/pitch ~0.43 of max — a
// heavy pull the pilot can still hold — and yaw ~1.25 of max, which saturates
// the rate loop: the unrecoverable spin a real quad does on a dead motor.
// A prop at 0.6 gives ~0.58 of max yaw (strong but flyable), 0.9 gives ~0.16.
const DMG_ASYM_RP = 1.1;
const DMG_ASYM_YAW = 3.2;

// Out-of-balance buzz. A chipped prop is a vibration, not a seizure: the total
// injected torque is capped at DMG_VIB_MAX of the axis maximum.
const DMG_VIB_GAIN = 0.030;
const DMG_VIB_MAX = 0.045;
const DMG_VIB_HZ = [9.3, 11.7, 14.1, 17.3];

// Prop layout, viewed from above with the nose at -Z (see `damage.props`):
//   0 = front-right, 1 = rear-right, 2 = rear-left, 3 = front-left
// Unit XZ direction of each arm, and the sign of the yaw reaction torque each
// prop puts into the airframe (0/2 and 1/3 are the counter-rotating diagonals).
const R2 = Math.SQRT1_2;
const PROP_X = [R2, R2, -R2, -R2];
const PROP_Z = [-R2, R2, R2, -R2];

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

    /**
     * Airframe condition, 1 = pristine, 0 = destroyed. Read by js/ui/health.js.
     * `props` index order (viewed from ABOVE, nose = -Z):
     *   0 = front-right, 1 = rear-right, 2 = rear-left, 3 = front-left
     * so 0/1 are the right pair, 2/3 the left pair, 0/3 the front pair,
     * 1/2 the rear pair, and 0/2 vs 1/3 the counter-rotating diagonals.
     * `frame` is the airframe itself — at 0 the quad is permanently crashed
     * until reset(). `overall` is the blended hull figure the OSD prints.
     */
    this.damage = { props: [1, 1, 1, 1], frame: 1, overall: 1 };

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
    const hovT2 = clamp((spec.massKg * GRAVITY) / Math.max(1e-6, effectiveMaxThrustN(spec)), 0.05, 0.9);
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
    this._washAmp = 0;                             // eased wash envelope

    // ---- preallocated temps (no per-step allocations) ----
    this._qInv = new THREE.Quaternion();
    this._dq = new THREE.Quaternion();
    this._ub = new THREE.Vector3();                // world-up in body frame
    this._airB = new THREE.Vector3();              // body-frame airspeed
    this._fB = new THREE.Vector3();                // body-frame force
    this._fW = new THREE.Vector3();                // world-frame force
    this._n = new THREE.Vector3();                 // contact normal
    this._vt = new THREE.Vector3();                // tangential velocity
    this._prevPos = new THREE.Vector3();           // position before integration
    this._n0 = new THREE.Vector3();                // deepest contact normal
    this._n1 = new THREE.Vector3();                // 2nd deepest contact normal
    this._nT = new THREE.Vector3();                // scratch normal
    this._tv = new THREE.Vector3();                // scratch tangent
    this._near = [];                               // broadphase result (reused)
    this._strikeStep = false;                      // one prop strike per step
    this._penDepth = 0;                            // current contact depth (m)

    // ---- damage internals (all preallocated) ----
    this._simT = 0;                                // integrated sim clock (flash throttle)
    this._dmgStep = false;                         // one damage event per physics step
    this._dmgActive = false;                       // fast bail-out while pristine
    this._thrustMul = 1;                           // mean prop health
    this._biasX = 0;                               // pitch imbalance (front - rear)
    this._biasY = 0;                               // yaw imbalance (diagonal A - B)
    this._biasZ = 0;                               // roll imbalance (right - left)
    this._vibPhase = [0, 0, 0, 0];
    this._flashUntil = -1;
    this._flashPrio = 0;
    this._nB = new THREE.Vector3();                // contact normal in body frame
    this._qi2 = new THREE.Quaternion();            // current inverse orientation

    // ---- collider broadphase cache (keyed on the map's array identity) ----
    this._grid = null;
    this._gridSrc = null;
    this._gridLen = -1;
    /** Diagnostics for tooling: {shapes, cells, maxBucket, buildMs}. */
    this.gridStats = null;

    this._recomputeDamage();
  }

  /** Zero all state; place slightly above ground, level, facing yawRad. */
  reset(positionVec3, yawRad) {
    if (positionVec3) this.position.copy(positionVec3);
    else this.position.set(0, 0, 0);
    // Sit ON the surface, not in it. The collision sphere has radius
    // 0.55 * wheelbase, so anything less than that leaves the airframe
    // intersecting whatever we spawned onto (the launch pad, most visibly).
    // The extra 3 cm keeps the skids clear instead of exactly touching.
    this.position.y += this.spec.sizeM * 0.55 + 0.03;
    // Sweep origin follows the teleport, otherwise the first step after a
    // respawn would sweep the whole map and invent contacts on the way.
    this._prevPos.copy(this.position);
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
    this._washAmp = 0;
    // A fresh airframe: props, frame and every derived imbalance term.
    const props = this.damage.props;
    props[0] = props[1] = props[2] = props[3] = 1;
    this.damage.frame = 1;
    this._vibPhase[0] = this._vibPhase[1] = this._vibPhase[2] = this._vibPhase[3] = 0;
    this._dmgStep = false;
    this._flashUntil = -1;
    this._flashPrio = 0;
    this._recomputeDamage();
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

  /**
   * settings.rates: nested {model, actual:{...}, betaflight:{...}} (or legacy flat).
   * Stored normalized; stick→deg/s via getRateDegS in step().
   */
  setRates(ratesObj) {
    this._rates = normalizeRates(ratesObj);
  }

  /** "acro" | "angle" | "horizon" */
  setFlightMode(mode) {
    this._mode = (mode === 'angle' || mode === 'horizon') ? mode : 'acro';
  }

  /**
   * Fixed-step physics update.
   * env: { getGroundHeight(x,z)->y,
   *        colliders: shape[] | null,   // js/core/collision.js shapes; a plain
   *                                     // {min,max} is still read as an AABB
   *        wind: Vector3 (m/s), armed: bool }
   * The colliders array is indexed once and cached on its identity+length, so
   * pass the map's own array (not a fresh copy) every step.
   */
  step(dt, env) {
    if (!(dt > 0) || !Number.isFinite(dt)) return;
    const spec = this.spec;
    this._simT += dt;
    // A written-off airframe stays written off until reset() — clearing
    // `crashed` from outside without a reset re-latches here.
    if (this.damage.frame <= 0 || this.damage.props.some((p) => p <= DMG_DEAD)) this.crashed = true;
    const armed = !!(env && env.armed) && !this.crashed;
    this._armedNow = armed;               // read by _impact for prop-strike response
    this._strikeStep = false;             // at most one prop-strike kick per step
    this._dmgStep = false;                // at most one damage application per step
    // A NaN in the wind field would poison every downstream term, and the
    // recovery net below would then teleport the quad forever.
    let wind = (env && env.wind) ? env.wind : ZERO_VEC;
    if (!Number.isFinite(wind.x + wind.y + wind.z)) wind = ZERO_VEC;
    const getH = (env && typeof env.getGroundHeight === 'function') ? env.getGroundHeight : null;

    // Payload raises mass and (partially) inertia.
    const carry = Math.max(0, Number.isFinite(this.carryMassKg) ? this.carryMassKg : 0);
    const mass = Math.max(1e-4, spec.massKg + carry);
    const iScale = 1 + (carry / Math.max(1e-4, spec.massKg)) * 0.6;
    // Guarded: a spec with a zero/NaN inertia or torque axis used to divide by
    // zero here and NaN the whole state (and the motorOutput term below).
    const Ix = Math.max(1e-9, spec.inertia.x * iScale);
    const Iy = Math.max(1e-9, spec.inertia.y * iScale);
    const Iz = Math.max(1e-9, spec.inertia.z * iScale);
    const mt = spec.maxTorque;
    const mtx = Math.max(1e-9, mt.x), mty = Math.max(1e-9, mt.y), mtz = Math.max(1e-9, mt.z);
    const aM = 1 - Math.exp(-dt / Math.max(1e-4, spec.motorTau)); // motor-lag blend

    // Throttle expo (Liftoff Mid curve) then air-mode idle floor (per-drone feel).
    let thrStick = this._input.throttle;
    const thrExpo = clamp(Number(settings.throttleExpo) || 0, 0, 1);
    if (thrExpo > 0) thrStick = thrStick * (1 - thrExpo) + thrStick * thrStick * thrStick * thrExpo;
    const idle = (spec.feel && Number.isFinite(spec.feel.idleMotorThrottle))
      ? spec.feel.idleMotorThrottle
      : (Number.isFinite(spec.idleMotorThrottle) ? spec.idleMotorThrottle : AIRMODE_IDLE);
    const thrIn = armed ? Math.max(thrStick, idle) : 0;

    // ---------------- battery ----------------
    if (armed) {
      this._soc = Math.max(0, this._soc - (0.02 + 0.98 * thrIn * thrIn) * this._drainK * dt);
    }
    const rest = EMPTY_V + (FULL_V - EMPTY_V) * Math.pow(this._soc, 0.75);
    // Sag ∝ throttle^2, worse as internal resistance rises near empty.
    const battMode = settings.environment?.batteryMode !== false;
    const sagTgt = (armed && battMode) ? spec.sagVoltsPerCell * thrIn * thrIn * (1 + (1 - this._soc) * 0.6) : 0;
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
      const acroX = -getRateDegS('pitch', this._input.pitch, r) * DEG2RAD;
      const acroY = -getRateDegS('yaw', this._input.yaw, r) * DEG2RAD;
      const acroZ = -getRateDegS('roll', this._input.roll, r) * DEG2RAD;
      const maxPitch = getMaxRateDegS('pitch', r) * DEG2RAD;
      const maxRoll = getMaxRateDegS('roll', r) * DEG2RAD;
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
        const angX = clamp(-ndRate, -maxPitch, maxPitch);
        const angZ = clamp(-rrRate, -maxRoll, maxRoll);
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
    const cmdX = armed ? clamp(Ix * (spX - w.x) / RESPONSE_TAU, -mtx, mtx) : 0;
    const cmdY = armed ? clamp(Iy * (spY - w.y) / RESPONSE_TAU, -mty, mty) : 0;
    const cmdZ = armed ? clamp(Iz * (spZ - w.z) / RESPONSE_TAU, -mtz, mtz) : 0;
    // First-order motor lag on applied torque — the attack/overshoot feel.
    this._tq.x += (cmdX - this._tq.x) * aM;
    this._tq.y += (cmdY - this._tq.y) * aM;
    this._tq.z += (cmdZ - this._tq.z) * aM;

    // ---------------- prop wash ----------------
    // Descending into own wake: band-limited torque noise ∝ descent rate
    // and disc loading. The characteristic descent wobble.
    // Real prop wash is a low-frequency wallow you fly out of, NOT a violent
    // shake. It needs a committed descent into the wake — sinking gently or
    // descending in a turn should stay glass-smooth.
    const descent = -this._airB.y; // body-frame downward airspeed
    let washTarget = 0;
    const pwOn = settings.environment?.propwash !== false;
    const pwInt = clamp((Number(settings.environment?.propwashIntensity) || 0) / 100, 0, 1);
    if (pwOn && armed && descent > WASH_MIN_DESCENT && this._input.throttle > 0.3) {
      washTarget = Math.min((descent - WASH_MIN_DESCENT) / 6, 1) * this._washFactor * pwInt;
    }
    // ease the wash envelope in/out so it never switches on abruptly
    this._washAmp += (washTarget - this._washAmp) * (1 - Math.exp(-dt / 0.25));
    const washAmp = this._washAmp;

    this._washTimer -= dt;
    if (this._washTimer <= 0) {
      this._washTimer = 0.11 + Math.random() * 0.08;   // retarget ~5-9 Hz
      this._washTgt.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
    }
    this._washN.lerp(this._washTgt, 1 - Math.exp(-dt / 0.07));
    const washX = washAmp * WASH_TORQUE_RP * mtx * this._washN.x;
    const washY = washAmp * WASH_TORQUE_Y * mty * this._washN.y;
    const washZ = washAmp * WASH_TORQUE_RP * mtz * this._washN.z;

    // ---------------- damage: imbalance + vibration ----------------
    // Both scale with how hard the props are working, so a parked wreck sits
    // still and a punch-out with a dead prop is instantly unflyable.
    let dmgX = 0, dmgY = 0, dmgZ = 0;
    if (this._dmgActive) {
      // Lift fraction: 1 at hover, so the bias constants read as "fraction of
      // max torque while hovering". `_thrust` is one step stale (2.5 ms) — the
      // motor filter is updated below — which is far inside the motor lag.
      const lift = clamp(this._thrust / (mass * GRAVITY), 0, 1.6);
      dmgX = this._biasX * mtx * lift;
      dmgY = this._biasY * mty * lift;
      dmgZ = this._biasZ * mtz * lift;

      const drive = this.motorOutput;
      if (drive > 0.02) {
        const props = this.damage.props;
        let vx = 0, vy = 0, vz = 0;
        for (let i = 0; i < 4; i++) {
          const bad = 1 - props[i];
          if (bad <= 0.02) continue;
          // Out-of-balance prop = oscillating vertical force at its hub:
          // torque = r x F  →  X from -z, Z from +x.
          let ph = this._vibPhase[i] + DMG_VIB_HZ[i] * (0.6 + 0.7 * drive) * TAU * dt;
          if (ph >= TAU) ph -= TAU * Math.floor(ph / TAU);
          this._vibPhase[i] = ph;
          const s = Math.sin(ph) * bad * drive;
          vx -= PROP_Z[i] * s;
          vz += PROP_X[i] * s;
          vy += 0.3 * s;
        }
        dmgX += clamp(vx * DMG_VIB_GAIN, -DMG_VIB_MAX, DMG_VIB_MAX) * mtx;
        dmgY += clamp(vy * DMG_VIB_GAIN, -DMG_VIB_MAX, DMG_VIB_MAX) * mty;
        dmgZ += clamp(vz * DMG_VIB_GAIN, -DMG_VIB_MAX, DMG_VIB_MAX) * mtz;
      }
    }

    // ---------------- integrate rotation ----------------
    w.x += ((this._tq.x + washX + dmgX) / Ix) * dt;
    w.y += ((this._tq.y + washY + dmgY) / Iy) * dt;
    w.z += ((this._tq.z + washZ + dmgZ) / Iz) * dt;
    // Mild rotational aero damping (stronger when props are dead).
    const angDamp = armed ? 0.02 : 0.35;
    w.multiplyScalar(Math.max(0, 1 - angDamp * dt));
    const wl = w.length();
    if (wl > MAX_ANG_VEL) w.multiplyScalar(MAX_ANG_VEL / wl);

    this._dq.set(w.x * dt * 0.5, w.y * dt * 0.5, w.z * dt * 0.5, 1);
    this.quaternion.multiply(this._dq).normalize();

    // ---------------- thrust ----------------
    // Chipped props bite less air: total lift scales with the mean prop health.
    const thrustCmd = armed
      ? effectiveMaxThrustN(spec) * this._voltFactor * (0.02 + 0.98 * thrIn * thrIn) * this._thrustMul
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

    // Sweep origin: where the airframe was before this step's translation.
    this._prevPos.copy(this.position);
    this.position.addScaledVector(this.velocity, dt);

    // ---------------- collisions ----------------
    this._collideGround(getH, spec, dt);
    this._collideBoxes(env ? env.colliders : null, spec, dt);

    // Numerical safety net (bad map data etc.). The actuator filters have to
    // be cleared too — a NaN parked in _thrust/_tq/_wash used to re-poison the
    // state every step, teleporting the quad to the origin forever.
    if (!Number.isFinite(this.position.x + this.position.y + this.position.z) ||
        !Number.isFinite(this.velocity.x + this.velocity.y + this.velocity.z) ||
        !Number.isFinite(this.quaternion.x + this.quaternion.y + this.quaternion.z + this.quaternion.w)) {
      this.position.set(0, this._ground(getH, 0, 0) + 2, 0);
      this._prevPos.copy(this.position);
      this.velocity.set(0, 0, 0);
      w.set(0, 0, 0);
      this.quaternion.identity();
      this._thrust = 0;
      this._tq.set(0, 0, 0);
      this._washN.set(0, 0, 0);
      this._washTgt.set(0, 0, 0);
      this._sag = 0;
      this.motorOutput = 0;
    }

    // ---------------- motor output (audio / visuals) ----------------
    let mo = 0;
    if (armed) {
      const act = (Math.abs(this._tq.x) / mtx +
                   Math.abs(this._tq.y) / mty +
                   Math.abs(this._tq.z) / mtz) / 3;
      mo = clamp(thrIn + 0.25 * act, 0, 1);
    }
    this.motorOutput += (mo - this.motorOutput) * aM;
    if (!Number.isFinite(this.motorOutput)) this.motorOutput = 0;
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
    // Push out along the surface normal, not straight up: the distance from
    // the airframe centre to the local ground plane is (p.y - gy) * n.y, so a
    // slope used to leave the quad buried up to (1 - n.y) * r deep. On flat
    // ground n.y == 1 and this reduces exactly to the old `p.y = gy + r`.
    const pen = r - (p.y - gy) * this._n.y;
    if (pen <= 0) return;
    p.addScaledVector(this._n, pen);
    this._impact(this._n, spec, dt);
  }

  /**
   * Build/refresh the broadphase for a map's collider bag. Cached on the
   * array identity *and* length, so maps that stream colliders in after the
   * handle is returned (procedural) pick them up without a manual flush.
   */
  _ensureGrid(cols) {
    if (!cols || !cols.length) {
      this._grid = null;
      this._gridSrc = cols || null;
      this._gridLen = cols ? cols.length : -1;
      return null;
    }
    if (this._grid && cols === this._gridSrc && cols.length === this._gridLen) return this._grid;
    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
    const grid = buildGrid(cols);
    const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
    this._grid = grid;
    this._gridSrc = cols;
    this._gridLen = cols.length;
    this.gridStats = {
      shapes: grid.itemCount,
      cells: grid.cellCount,
      cellSize: grid.cellSize,
      oversized: grid.alwaysCount,
      maxBucket: grid.maxBucket,
      buildMs: t1 - t0,
    };
    return grid;
  }

  /**
   * Obstacle collisions. Broadphase = spatial hash over the swept segment;
   * narrowphase = sphere vs {aabb|cyl|obb|sphere}. Fast steps are swept so
   * thin geometry cannot be tunnelled.
   */
  _collideBoxes(cols, spec, dt) {
    const grid = this._ensureGrid(cols);
    if (!grid) return;

    const r = spec.sizeM * 0.55;
    const p = this.position;
    const pv = this._prevPos;
    let sx = p.x - pv.x, sy = p.y - pv.y, sz = p.z - pv.z;
    let seg = Math.sqrt(sx * sx + sy * sy + sz * sz);
    // A jump far beyond anything the flight model can produce means someone
    // teleported us (respawn, debug pinning). Resolve at the destination only —
    // and re-anchor the sweep origin so the broadphase query below is centred
    // on where we actually are, not where we were.
    if (!(seg >= 0) || seg > SWEEP_TELEPORT) { sx = sy = sz = 0; seg = 0; pv.copy(p); }

    // One broadphase query covering the whole swept segment plus slack for
    // the push-out corrections applied during the march.
    const margin = r + 0.35;
    const list = grid.query(pv.x + sx * 0.5, pv.z + sz * 0.5, seg * 0.5 + margin, this._near);
    if (!list.length) return;

    const lim = SWEEP_TRIGGER * r;
    let sub = 1;
    if (lim > 0 && seg > lim) {
      sub = Math.ceil(seg / lim);
      if (sub < 2) sub = 2;
      if (sub > SWEEP_MAX_SUB) sub = SWEEP_MAX_SUB;
    }
    if (sub === 1) { this._resolveAt(list, r, spec, dt); return; }

    // March the segment. `a*` carries the corrections of earlier substeps
    // forward, so tangential (sliding) motion survives a contact. The last
    // substep lands on the exact integrated target, so a sweep that touches
    // nothing leaves the position bit-identical to the unswept path.
    const sdt = dt / sub;
    const tx = p.x, ty = p.y, tz = p.z;
    let ax = 0, ay = 0, az = 0;
    for (let i = 1; i <= sub; i++) {
      if (i === sub) p.set(tx + ax, ty + ay, tz + az);
      else {
        const t = i / sub;
        p.set(pv.x + sx * t + ax, pv.y + sy * t + ay, pv.z + sz * t + az);
      }
      const bx = p.x, by = p.y, bz = p.z;
      this._resolveAt(list, r, spec, sdt);
      ax += p.x - bx; ay += p.y - by; az += p.z - bz;
    }
  }

  /**
   * Resolve the airframe sphere against a candidate list at its current
   * position. The two deepest contacts are gathered first and resolved
   * together — resolving sequentially (the old behaviour) could shove the
   * quad out of one collider and straight into its neighbour in a corner.
   * Returns the deepest penetration found (0 = untouched).
   */
  _resolveAt(list, r, spec, dt) {
    const p = this.position;
    const n0 = this._n0, n1 = this._n1, nT = this._nT;
    let d0 = 0, d1 = 0;

    for (let i = 0; i < list.length; i++) {
      const depth = resolveSphere(list[i], p, r, nT);
      if (!(depth > 0)) continue;
      if (depth > d0) {
        d1 = d0; n1.copy(n0);
        d0 = depth; n0.copy(nT);
      } else if (depth > d1) {
        d1 = depth; n1.copy(nT);
      }
    }
    if (d0 <= 0) return 0;

    // --- positional: deepest first, then whatever the second still needs ---
    p.addScaledVector(n0, d0);
    if (d1 > 0) {
      const c = n0.dot(n1);
      const rem = d1 - d0 * c;              // residual after the first push
      if (rem > 1e-5) {
        // Move only along the part of n1 orthogonal to n0, so fixing the
        // second contact cannot re-bury us in the first.
        this._tv.copy(n1).addScaledVector(n0, -c);
        const tl = this._tv.length();
        if (tl > 1e-3) {
          const s = Math.min(rem / tl, r * 2);
          p.addScaledVector(this._tv, s / tl);
        }
      }
    }

    // --- velocity: project out along both normals (deepest first) ---
    // Carry the penetration depth so _impact can tell a glancing separation
    // from being wedged between two walls (see the WEDGE_SCRUB branch).
    this._penDepth = d0;
    this._impact(n0, spec, dt);
    if (d1 > 0) {
      this._penDepth = d1;
      this._impact(n1, spec, dt);
    }
    this._penDepth = 0;
    return d0;
  }

  /** Bounce / friction / crash response against surface normal n. */
  _impact(n, spec, dt) {
    const v = this.velocity;
    const vn = v.dot(n);
    if (vn >= 0) {
      // Squeezing through a gap narrower than the airframe: both walls push
      // perpendicular to travel, so vn === 0 on each and the old early-return
      // applied no friction at all — the quad ping-ponged sideways while its
      // forward speed sailed on through a hole it does not fit in.
      // Scrub along the wall instead, so a too-narrow gap stops you.
      if (vn < 1e-4 && this._penDepth > 0) {
        this._vt.copy(v).addScaledVector(n, -vn);
        const scrub = Math.pow(WEDGE_SCRUB, Math.min(1, this._penDepth / (spec.sizeM * 0.25)) * dt * 60);
        v.copy(this._vt).multiplyScalar(scrub).addScaledVector(n, vn);
        this.angularVelocity.multiplyScalar(Math.pow(ANGVEL_KEEP, dt * 60));
      }
      return; // separating
    }
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
    // Gated to once per physics step: a swept step can call _impact up to
    // 12 times, and un-gated that stacked a dozen random kicks into one step.
    if (this._armedNow && !this.crashed && hard && tSpeed > 1.5 && !this._strikeStep) {
      this._strikeStep = true;
      const k = Math.min(tSpeed * 0.35, 6);
      this.angularVelocity.x += (Math.random() - 0.5) * k;
      this.angularVelocity.y += (Math.random() - 0.5) * k * 1.3; // yaw kick dominates
      this.angularVelocity.z += (Math.random() - 0.5) * k;
      v.multiplyScalar(0.93); // props eating energy
    }

    // Structural damage. This is also what ends the flight now: the airframe
    // is written off when `damage.frame` hits 0, either from one catastrophic
    // hit or from accumulated abuse, instead of from a single speed threshold.
    if (!this._dmgStep) this._damage(n, spec, -vn, tSpeed);
  }

  /**
   * Impact damage.
   *
   * `normalImpact` is the closing speed along the contact normal — the
   * component actually driving into the surface, and the only thing that
   * really breaks a quad. Graze speed is weighted in lightly, and much harder
   * while armed because spinning props catch a surface and self-destruct.
   *
   * Which prop eats it is chosen from the contact normal in the BODY frame:
   * the arm pointing at the wall takes the full hit, its neighbours ~40%, the
   * far arm 10%. A square belly/top slam has no meaningful arm direction, so
   * it spreads evenly across all four and loads the frame instead.
   *
   * Called at most once per physics step (see `_dmgStep`), so a swept step or
   * a two-contact corner cannot multiply-count one collision.
   */
  _damage(n, spec, normalImpact, tSpeed) {
    const tw = this._armedNow ? DMG_TANGENT_ARMED : DMG_TANGENT_IDLE;
    const robust = spec.massKg < 0.1 ? DMG_WHOOP_DIV : 1;
    const eff = (normalImpact + tw * tSpeed) / robust;
    if (!(eff > DMG_FLOOR)) return;       // a gentle bump is free
    this._dmgStep = true;

    const u = (eff - DMG_FLOOR) / DMG_SPAN;
    const propBase = Math.min(Math.pow(u, DMG_PROP_EXP), 1);

    // Contact normal → body frame. The normal points out of the surface, so
    // the wall lies along -nB. Rotation has been integrated since `_qInv` was
    // taken, so re-invert here (only on a real impact — never in the hot path).
    this._qi2.copy(this.quaternion).invert();
    this._nB.copy(n).applyQuaternion(this._qi2);
    const flat = Math.min(Math.abs(this._nB.y), 1);   // 1 = square belly/top hit
    let dx = -this._nB.x, dz = -this._nB.z;
    const hl = Math.sqrt(dx * dx + dz * dz);
    if (hl > 1e-4) { dx /= hl; dz /= hl; } else { dx = 0; dz = 0; }

    const props = this.damage.props;
    let msgIdx = -1, msgKind = 0, msgDelta = 0;
    for (let i = 0; i < 4; i++) {
      const before = props[i];
      if (before <= 0) continue;
      const facing = dx * PROP_X[i] + dz * PROP_Z[i];            // -1..1
      // max(0, ...) matters: the arm facing directly away lands on facing = -1
      // and float error can push it a hair below, where pow() returns NaN.
      const dirW = 0.1 + 0.9 * Math.pow(Math.max(0, (1 + facing) * 0.5), DMG_DIR_POW);
      const wgt = dirW + (0.5 - dirW) * flat;                    // flat → even spread
      let after = before - propBase * wgt;
      if (after <= DMG_DEAD) after = 0;
      else if (after > 1) after = 1;
      if (after === before) continue;
      props[i] = after;
      // Report the most alarming single prop event of this impact.
      const kind = after === 0 ? 2 : (before > DMG_NICK && after <= DMG_NICK ? 1 : 0);
      const delta = before - after;
      if (kind > msgKind || (kind > 0 && kind === msgKind && delta > msgDelta)) {
        msgIdx = i; msgKind = kind; msgDelta = delta;
      }
    }

    // ---- frame ----
    const fBefore = this.damage.frame;
    let frame = fBefore - Math.pow(u, DMG_FRAME_EXP) * (DMG_FRAME_EDGE + DMG_FRAME_FLAT * flat);
    if (eff >= DMG_CATASTROPHIC) frame = 0;                      // nothing survives this
    if (frame <= 0) frame = 0; else if (frame > 1) frame = 1;
    this.damage.frame = frame;
    this._recomputeDamage();

    // ---- flash, highest severity wins inside the throttle window ----
    let prio = 0, msg = '';
    if (msgKind === 1) { prio = 1; msg = 'PROP ' + (msgIdx + 1) + ' DAMAGED'; }
    if (msgKind === 2) { prio = 2; msg = 'PROP ' + (msgIdx + 1) + ' DESTROYED'; }
    if (frame > 0 && fBefore > DMG_CRIT_FRAME && frame <= DMG_CRIT_FRAME) {
      prio = 3; msg = 'AIRFRAME CRITICAL';
    }
    if (prio > 0 && (this._simT >= this._flashUntil || prio > this._flashPrio)) {
      this._flashUntil = this._simT + DMG_FLASH_GAP;
      this._flashPrio = prio;
      emit('osd:flash', { text: msg, ms: 1200 });
    }

    // ---- write-off ----
    // A quad keeps flying on damaged props — degraded, pulling, but flyable.
    // It is only grounded when a prop is actually GONE (you cannot fly a
    // quadcopter on three props) or the airframe itself is written off.
    const propGone = this.damage.props.some((p) => p <= DMG_DEAD);
    if ((frame <= 0 || propGone) && !this.crashed) {
      this.crashed = true;
      // Impart a tumble; motors are cut (armed goes false via main.js).
      const k = Math.min(eff * 0.5, 12);
      this.angularVelocity.x += (Math.random() - 0.5) * k;
      this.angularVelocity.y += (Math.random() - 0.5) * k * 0.5;
      this.angularVelocity.z += (Math.random() - 0.5) * k;
      const awl = this.angularVelocity.length();
      if (awl > MAX_ANG_VEL) this.angularVelocity.multiplyScalar(MAX_ANG_VEL / awl);
    }
  }

  /**
   * Refresh everything derived from `damage`: lift loss, the persistent torque
   * bias per axis, and the hull figure. Called on every damage change and on
   * reset — never per step.
   *
   * Sign derivations (body: +X right, +Y up, -Z forward):
   *   right-side lift → +Z torque → rolls LEFT, so losing a right prop rolls right
   *   front lift      → +X torque → pitches UP,  so losing a front prop drops the nose
   *   props 0/2 put +Y reaction torque into the frame, 1/3 put -Y
   */
  _recomputeDamage() {
    const p = this.damage.props;
    const mean = (p[0] + p[1] + p[2] + p[3]) * 0.25;
    const frame = this.damage.frame;
    this._thrustMul = mean;
    this.damage.overall = clamp(0.55 * mean + 0.45 * frame, 0, 1);
    this._dmgActive = mean < 0.999 || frame < 0.999;
    this._biasZ = ((p[0] + p[1]) - (p[2] + p[3])) * 0.5 * DMG_ASYM_RP;   // right - left
    this._biasX = ((p[0] + p[3]) - (p[1] + p[2])) * 0.5 * DMG_ASYM_RP;   // front - rear
    this._biasY = ((p[0] + p[2]) - (p[1] + p[3])) * 0.5 * DMG_ASYM_YAW;  // diagonal A - B
  }
}
