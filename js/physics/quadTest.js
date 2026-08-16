// ============================================================
// PropWash FPV — flight-model verification harness
//
// Dead-stick drop from height has to accelerate, not cruise. This file
// steps the ACTUAL Quad at 400 Hz (same dt as main.js) and checks:
//
//   * armed, throttle 0, level: after 1.0 s, |vy| is within 15% of g
//   * the same drop at 2.0 s is still accelerating (|vy| > 1.6× the 1 s speed)
//   * hoverThrottle still nets ~0 ay (±0.15 g) after the motors settle
//   * zero stick produces ~0 N of lift (idle may spin motors, not hold the quad)
//
// RUN IT (no wiring needed — the dev server already serves the module):
//
//   const t = await import('/js/physics/quadTest.js');
//   const report = t.runQuadPhysicsTests();
//   t.runQuadPhysicsTests({ drone: 'nazgul5' });
//
// Node (from repo root):
//
//   node --import ./tools/alias-three.mjs ./tools/run-quad-test.mjs
//
// Self-contained: mutates settings in memory and restores them; does not
// write localStorage or touch the live game loop.
// ============================================================

import * as THREE from 'three';
import { settings } from '../core/state.js';
import { DRONES, hoverThrottle } from './drones.js';
import { Quad } from './quad.js';

const PHYS_DT = 1 / 400;
const GRAVITY = 9.81;
const DROP_H_M = 80;
const SETTLE_S = 0.5;
const HOVER_SAMPLE_S = 0.25;
const G_TOL = 0.15;             // |vy(1s) - g| / g
const ACCEL_RATIO = 1.6;        // |vy(2s)| / |vy(1s)|
const HOVER_AY_G = 0.15;        // |ay| after settle, in g
const ZERO_LIFT_N = 0.05;       // residual thrust allowed at stick 0

function withFlightSettings(fn) {
  const prevExpo = settings.throttleExpo;
  const prevBatt = settings.environment?.batteryMode;
  const prevWash = settings.environment?.propwash;
  const prevWind = settings.environment?.windSpeed;
  try {
    settings.throttleExpo = 0;
    if (settings.environment) {
      settings.environment.batteryMode = false;
      settings.environment.propwash = false;
      settings.environment.windSpeed = 0;
    }
    return fn();
  } finally {
    settings.throttleExpo = prevExpo;
    if (settings.environment) {
      settings.environment.batteryMode = prevBatt;
      settings.environment.propwash = prevWash;
      settings.environment.windSpeed = prevWind;
    }
  }
}

function makeEnv(armed) {
  return {
    armed: !!armed,
    wind: new THREE.Vector3(0, 0, 0),
    getGroundHeight: () => 0,
    colliders: null,
  };
}

function stepFor(quad, env, seconds) {
  const n = Math.round(seconds / PHYS_DT);
  for (let i = 0; i < n; i++) quad.step(PHYS_DT, env);
  return n * PHYS_DT;
}

function spawn(spec) {
  const quad = new Quad(spec);
  quad.setFlightMode('acro');
  quad.reset(new THREE.Vector3(0, DROP_H_M, 0), 0);
  return quad;
}

/**
 * @param {object} [opts]
 * @param {string}  [opts.drone]   one id, or omit to run every airframe
 * @param {boolean} [opts.quiet=false]
 * @returns {object} full report
 */
export function runQuadPhysicsTests(opts = {}) {
  const quiet = !!opts.quiet;
  const log = quiet ? () => {} : (...a) => console.log(...a);
  const now = () => ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
  const t0 = now();

  const keys = opts.drone
    ? [opts.drone]
    : Object.keys(DRONES);

  const report = {
    drones: keys,
    cases: [],
    failures: [],
    warnings: [],
    passed: true,
  };
  const fail = (what, detail) => { report.failures.push(`${what} — ${detail}`); report.passed = false; };

  withFlightSettings(() => {
    for (const key of keys) {
      const spec = DRONES[key];
      if (!spec) { fail(key, 'unknown drone id'); continue; }

      const hov = hoverThrottle(spec);
      const row = { drone: key, hoverThrottle: +hov.toFixed(4) };

      // ---- 1. zero-stick lift is gone (idle may still spin motors) ----
      {
        const q = spawn(spec);
        q.setInputs({ throttle: 0, roll: 0, pitch: 0, yaw: 0 });
        stepFor(q, makeEnv(true), SETTLE_S);
        row.zeroStickThrustN = +q._thrust.toFixed(4);
        row.zeroStickMotorOut = +q.motorOutput.toFixed(4);
        if (Math.abs(q._thrust) > ZERO_LIFT_N) {
          fail(`${key} zero-stick lift`, `thrust ${q._thrust.toFixed(3)} N (want ~0)`);
        }
        if (!(q.motorOutput > 0.005)) {
          fail(`${key} air-mode idle`, `motorOutput ${q.motorOutput.toFixed(3)} (idle should still spin)`);
        }
      }

      // ---- 2. disarmed stays 0 thrust ----
      {
        const q = spawn(spec);
        q.setInputs({ throttle: 1, roll: 0, pitch: 0, yaw: 0 });
        stepFor(q, makeEnv(false), SETTLE_S);
        row.disarmedThrustN = +q._thrust.toFixed(4);
        if (Math.abs(q._thrust) > ZERO_LIFT_N) {
          fail(`${key} disarmed thrust`, `thrust ${q._thrust.toFixed(3)} N (want 0)`);
        }
      }

      // ---- 3. dead-stick drop accelerates with height ----
      {
        const q = spawn(spec);
        q.setInputs({ throttle: 0, roll: 0, pitch: 0, yaw: 0 });
        const env = makeEnv(true);
        stepFor(q, env, 1.0);
        const v1 = Math.abs(q.velocity.y);
        stepFor(q, env, 1.0);
        const v2 = Math.abs(q.velocity.y);
        const err1 = Math.abs(v1 - GRAVITY) / GRAVITY;
        row.vy1 = +v1.toFixed(3);
        row.vy2 = +v2.toFixed(3);
        row.vy1ErrPct = +(err1 * 100).toFixed(2);
        row.vy2overVy1 = +((v1 > 0 ? v2 / v1 : 0)).toFixed(3);
        if (err1 > G_TOL) {
          fail(`${key} 1.0 s drop`, `|vy|=${v1.toFixed(3)} m/s, ${(err1 * 100).toFixed(1)}% from g=${GRAVITY}`);
        }
        if (!(v2 > ACCEL_RATIO * v1)) {
          fail(`${key} 2.0 s drop`, `|vy|=${v2.toFixed(3)} is only ${(v1 > 0 ? v2 / v1 : 0).toFixed(3)}× the 1 s speed (want > ${ACCEL_RATIO})`);
        }
        if (q.position.y <= spec.sizeM) {
          fail(`${key} drop height`, `hit the ground at y=${q.position.y.toFixed(2)} (start higher)`);
        }
      }

      // ---- 4. hoverThrottle still nets ~0 ay after motors settle ----
      {
        const q = spawn(spec);
        q.setInputs({ throttle: hov, roll: 0, pitch: 0, yaw: 0 });
        const env = makeEnv(true);
        stepFor(q, env, SETTLE_S);
        const vA = q.velocity.y;
        const sampled = stepFor(q, env, HOVER_SAMPLE_S);
        const ay = (q.velocity.y - vA) / sampled;
        row.hoverAy = +ay.toFixed(4);
        row.hoverAyG = +(ay / GRAVITY).toFixed(4);
        if (Math.abs(ay) > HOVER_AY_G * GRAVITY) {
          fail(`${key} hover`, `ay=${ay.toFixed(3)} m/s² (${(ay / GRAVITY).toFixed(3)} g, want ±${HOVER_AY_G} g)`);
        }
      }

      report.cases.push(row);
    }
  });

  report.elapsedMs = Math.round(now() - t0);
  report.summary = {
    drones: keys.join(', '),
    failures: report.failures.length,
    warnings: report.warnings.length,
  };

  if (!quiet) {
    log('%c[PropWash physics] dead-stick drop + hover', 'font-weight:bold;font-size:13px');
    if (typeof console.table === 'function') console.table(report.cases);
    else log(report.cases);
    log('%cSUMMARY', 'font-weight:bold', report.summary);
    if (report.warnings.length) console.warn('WARNINGS:\n' + report.warnings.join('\n'));
    if (report.failures.length) console.error('FAILURES:\n' + report.failures.join('\n'));
    else log(`%cAll physics assertions passed in ${report.elapsedMs} ms.`, 'color:#4ade80;font-weight:bold');
  }
  return report;
}

export default runQuadPhysicsTests;
