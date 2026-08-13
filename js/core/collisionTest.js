// ============================================================
// PropWash FPV — collision verification harness
//
// "Thread the needle" is a number, not an opinion. This file measures it.
//
// It flies the ACTUAL airframe sphere through gaps of known width using a
// faithful re-implementation of the resolution loop in js/physics/quad.js
// (same substep rule, same two-deepest contact solve, same restitution and
// friction constants), and reports:
//
//   * the MEASURED minimum passable gap vs the theoretical one (2 * radius),
//     for eight shape types, flown dead centre and crabbing at 6 degrees,
//     at several speeds — THE "thread the needle" precision figure
//   * clip tolerance: how far into a wall you can aim and still slide through
//   * containment: whether a gap NARROWER than the airframe actually stops it
//   * whether anything can be tunnelled at up to 80 m/s and 85 deg off-normal
//   * how much the airframe jitters resting in a tight slot
//   * an exactness audit of every shape's distance field — unit gradient,
//     normal == gradient, surface projection, plus a brute-force cross-check
//   * broadphase completeness (no collider may be missed by query())
//
// RUN IT (no wiring needed — the dev server already serves the module):
//
//   const t = await import('/js/core/collisionTest.js');
//   const report = t.runCollisionTests();          // console.table + returns
//   t.runCollisionTests({ drone: 'nazgul5' });     // 5-inch instead of a whoop
//
// Self-contained: imports only js/core/collision.js, touches no game state,
// safe to run mid-flight.
// ============================================================

import {
  makeBox, makeCylinder, makeOBB, makeSphere,
  makeCapsule, makeCapsuleY, makeTorus, makeRing, makeCompound,
  buildGrid, resolveSphere, distanceToShape, sweepSphere,
} from './collision.js';

// ---- constants copied verbatim from js/physics/quad.js -----------------
// If quad.js changes these, change them here too or the harness stops
// describing the real game.
const SWEEP_TRIGGER = 0.35;
const SWEEP_MAX_SUB = 6;
const SWEEP_TELEPORT = 2.0;
const RESTITUTION = 0.3;
const FRICTION_KEEP = 0.75;
const WEDGE_SCRUB = 0.12;
const PHYS_DT = 1 / 400;

// Airframe radius = 0.55 * wheelbase (js/physics/quad.js `_collideBoxes`).
const WHEELBASE = { meteor75: 0.075, cinebot30: 0.127, nazgul5: 0.240 };
const AIRFRAME_K = 0.55;

// Gap geometry. The obstacle is an APERTURE (a doorway 30 cm deep), not a
// tunnel: in a long tunnel a crabbing approach fails on trajectory drift
// alone, which measures geometry rather than the collision resolver.
const OBST_LEN = 0.3;
const START_S = -2.2;      // distance along the flight axis at launch
const END_S = 2.2;         // ...and where the flight counts as "through"

// ------------------------------------------------------------
// a faithful stand-in for quad.js's translation + collision step
// ------------------------------------------------------------

class Rig {
  constructor(colliders, radius) {
    this.grid = buildGrid(colliders);
    this.R = radius;
    this.p = { x: 0, y: 0, z: 0 };
    this.prev = { x: 0, y: 0, z: 0 };
    this.v = { x: 0, y: 0, z: 0 };
    this.gravity = 0;
    this.near = [];
    this.n0 = { x: 0, y: 0, z: 0 };
    this.n1 = { x: 0, y: 0, z: 0 };
    this.nT = { x: 0, y: 0, z: 0 };
    this.contacts = 0;
    this.worstResidual = 0;   // deepest overlap still present AFTER a solve
    // quad.js scales the wedge scrub by wheelbase, not by airframe radius.
    this.wheelbase = radius / AIRFRAME_K;
    this.penDepth = 0;
  }

  reset(px, py, pz, vx, vy, vz) {
    this.p.x = px; this.p.y = py; this.p.z = pz;
    this.prev.x = px; this.prev.y = py; this.prev.z = pz;
    this.v.x = vx; this.v.y = vy; this.v.z = vz;
    this.contacts = 0;
    this.worstResidual = 0;
  }

  step(dt) {
    this.v.y -= this.gravity * dt;
    this.prev.x = this.p.x; this.prev.y = this.p.y; this.prev.z = this.p.z;
    this.p.x += this.v.x * dt;
    this.p.y += this.v.y * dt;
    this.p.z += this.v.z * dt;
    this._collide(dt);
  }

  /** Mirror of Quad._collideBoxes. */
  _collide(dt) {
    const r = this.R, p = this.p, pv = this.prev;
    let sx = p.x - pv.x, sy = p.y - pv.y, sz = p.z - pv.z;
    let seg = Math.sqrt(sx * sx + sy * sy + sz * sz);
    if (!(seg >= 0) || seg > SWEEP_TELEPORT) {
      sx = sy = sz = 0; seg = 0;
      pv.x = p.x; pv.y = p.y; pv.z = p.z;
    }
    const margin = r + 0.35;
    const list = this.grid.query(pv.x + sx * 0.5, pv.z + sz * 0.5, seg * 0.5 + margin, this.near);
    if (!list.length) return;

    const lim = SWEEP_TRIGGER * r;
    let sub = 1;
    if (lim > 0 && seg > lim) {
      sub = Math.ceil(seg / lim);
      if (sub < 2) sub = 2;
      if (sub > SWEEP_MAX_SUB) sub = SWEEP_MAX_SUB;
    }
    if (sub === 1) { this._resolveAt(list, r, dt); return; }

    const sdt = dt / sub;
    const tx = p.x, ty = p.y, tz = p.z;
    let ax = 0, ay = 0, az = 0;
    for (let i = 1; i <= sub; i++) {
      if (i === sub) { p.x = tx + ax; p.y = ty + ay; p.z = tz + az; }
      else {
        const t = i / sub;
        p.x = pv.x + sx * t + ax;
        p.y = pv.y + sy * t + ay;
        p.z = pv.z + sz * t + az;
      }
      const bx = p.x, by = p.y, bz = p.z;
      this._resolveAt(list, r, sdt);
      ax += p.x - bx; ay += p.y - by; az += p.z - bz;
    }
  }

  /** Mirror of Quad._resolveAt: the two deepest contacts, solved together. */
  _resolveAt(list, r, dt) {
    const p = this.p, n0 = this.n0, n1 = this.n1, nT = this.nT;
    let d0 = 0, d1 = 0;
    for (let i = 0; i < list.length; i++) {
      const depth = resolveSphere(list[i], p, r, nT);
      if (!(depth > 0)) continue;
      if (depth > d0) {
        d1 = d0; n1.x = n0.x; n1.y = n0.y; n1.z = n0.z;
        d0 = depth; n0.x = nT.x; n0.y = nT.y; n0.z = nT.z;
      } else if (depth > d1) {
        d1 = depth; n1.x = nT.x; n1.y = nT.y; n1.z = nT.z;
      }
    }
    if (d0 <= 0) return 0;
    this.contacts++;

    p.x += n0.x * d0; p.y += n0.y * d0; p.z += n0.z * d0;
    if (d1 > 0) {
      const c = n0.x * n1.x + n0.y * n1.y + n0.z * n1.z;
      const rem = d1 - d0 * c;
      if (rem > 1e-5) {
        const tvx = n1.x - n0.x * c, tvy = n1.y - n0.y * c, tvz = n1.z - n0.z * c;
        const tl = Math.sqrt(tvx * tvx + tvy * tvy + tvz * tvz);
        if (tl > 1e-3) {
          const s = Math.min(rem / tl, r * 2) / tl;
          p.x += tvx * s; p.y += tvy * s; p.z += tvz * s;
        }
      }
    }
    this.penDepth = d0;
    this._impact(n0, dt);
    if (d1 > 0) { this.penDepth = d1; this._impact(n1, dt); }
    this.penDepth = 0;

    // audit: how deep are we still buried once the solve is done?
    let worst = 0;
    for (let i = 0; i < list.length; i++) {
      const d = resolveSphere(list[i], p, r, nT);
      if (d > worst) worst = d;
    }
    if (worst > this.worstResidual) this.worstResidual = worst;
    return d0;
  }

  /**
   * Mirror of Quad._impact, minus the prop-strike RNG (which only fires
   * while ARMED — every test here runs disarmed, so the result is exactly
   * reproducible and geometry is the only variable) and minus the angular
   * response (this rig has no attitude; it cannot change the trajectory of a
   * point mass).
   *
   * The WEDGE_SCRUB branch IS mirrored: it is the thing that stops a quad
   * squirting through a gap narrower than itself, so leaving it out would
   * make the containment measurement describe a game that is not shipping.
   */
  _impact(n, dt) {
    const v = this.v;
    const vn = v.x * n.x + v.y * n.y + v.z * n.z;
    if (vn >= 0) {
      // Wedged: both walls push perpendicular to travel, so vn ~ 0 on each
      // and no friction would be applied at all. Scrub along the wall.
      if (vn < 1e-4 && this.penDepth > 0) {
        const tvx = v.x - n.x * vn, tvy = v.y - n.y * vn, tvz = v.z - n.z * vn;
        const scrub = Math.pow(WEDGE_SCRUB,
          Math.min(1, this.penDepth / (this.wheelbase * 0.25)) * dt * 60);
        v.x = tvx * scrub + n.x * vn;
        v.y = tvy * scrub + n.y * vn;
        v.z = tvz * scrub + n.z * vn;
      }
      return;                                // separating
    }
    let tx = v.x - n.x * vn, ty = v.y - n.y * vn, tz = v.z - n.z * vn;
    const hard = -vn > 0.5;
    const keepT = hard ? FRICTION_KEEP : Math.pow(FRICTION_KEEP, dt * 60);
    tx *= keepT; ty *= keepT; tz *= keepT;
    v.x = tx + n.x * (-vn * RESTITUTION);
    v.y = ty + n.y * (-vn * RESTITUTION);
    v.z = tz + n.z * (-vn * RESTITUTION);
  }
}

// ------------------------------------------------------------
// gap scenarios
//
// `axis` is the direction of flight, `side` the direction the gap opens in.
// Both are unit and perpendicular; the pinch point is at the origin.
// ------------------------------------------------------------

const Z = { x: 0, y: 0, z: 1 };
const X = { x: 1, y: 0, z: 0 };
const OBB_YAW = 0.5236;                                          // 30 deg
const OBB_AXIS = { x: Math.sin(OBB_YAW), y: 0, z: Math.cos(OBB_YAW) };
const OBB_SIDE = { x: Math.cos(OBB_YAW), y: 0, z: -Math.sin(OBB_YAW) };

// `flatDepth` is how far the NARROWEST part of the aperture runs along the
// flight axis. A doorway is flat for its whole thickness; a pole, a trunk, a
// buoy or a round gate tube pinches at a single station, so their flat depth
// is zero. It only matters for the crabbing test, where a flat aperture of
// depth d costs a geometric d*tan(angle) of extra width no solver can refund.
const SCENARIOS = [
  {
    key: 'aabb walls', axis: Z, side: X, flatDepth: OBST_LEN,
    build: (w) => [
      makeBox(-(w * 0.5 + 1), -10, 0, 2, 20, OBST_LEN),
      makeBox(+(w * 0.5 + 1), -10, 0, 2, 20, OBST_LEN),
    ],
  },
  {
    key: 'obb slot 30deg', axis: OBB_AXIS, side: OBB_SIDE, flatDepth: OBST_LEN,
    build: (w) => {
      const off = w * 0.5 + 1;
      return [
        makeOBB(-off * OBB_SIDE.x, -10, -off * OBB_SIDE.z, 2, 20, OBST_LEN, OBB_YAW),
        makeOBB(+off * OBB_SIDE.x, -10, +off * OBB_SIDE.z, 2, 20, OBST_LEN, OBB_YAW),
      ];
    },
  },
  {
    key: 'capsule poles r5cm', axis: Z, side: X, flatDepth: 0,
    build: (w) => [
      makeCapsuleY(-(w * 0.5 + 0.05), -5, 0, 0.05, 10),
      makeCapsuleY(+(w * 0.5 + 0.05), -5, 0, 0.05, 10),
    ],
  },
  {
    key: 'cyl trunks r50cm', axis: Z, side: X, flatDepth: 0,
    build: (w) => [
      makeCylinder(-(w * 0.5 + 0.5), -5, 0, 0.5, 10),
      makeCylinder(+(w * 0.5 + 0.5), -5, 0, 0.5, 10),
    ],
  },
  {
    key: 'sphere pair r1.5m', axis: Z, side: X, flatDepth: 0,
    build: (w) => [
      makeSphere(-(w * 0.5 + 1.5), 0, 0, 1.5),
      makeSphere(+(w * 0.5 + 1.5), 0, 0, 1.5),
    ],
  },
  {
    // Race gate, square tube. The HOLE must be flyable — a solid box here
    // would wall off exactly what the pilot is aiming at.
    key: 'ring gate (hole)', axis: Z, side: X, flatDepth: 0.3,
    build: (w) => [makeRing(0, 0, 0, w * 0.5 + 0.15, 0.15, 0.15, 0, 0, 1)],
  },
  {
    key: 'torus gate (hole)', axis: Z, side: X, flatDepth: 0,
    build: (w) => [makeTorus(0, 0, 0, w * 0.5 + 0.15, 0.15, 0, 0, 1)],
  },
  {
    // Pier: deck box on pylon cylinders. Flying UNDER the deck BETWEEN two
    // pylons is only possible because a compound leaves its gaps open.
    key: 'compound pier pylons', axis: Z, side: X, flatDepth: 0,
    build: (w) => {
      const parts = [makeBox(0, 3, 0, 12, 0.6, 24)];
      for (let i = -1; i <= 1; i++) {
        parts.push(makeCylinder(-(w * 0.5 + 0.45), -6, i * 8, 0.45, 9));
        parts.push(makeCylinder(+(w * 0.5 + 0.45), -6, i * 8, 0.45, 9));
      }
      return [makeCompound(parts)];
    },
  },
];

/**
 * Fly the airframe at an aperture of width `w` and report whether it went
 * THROUGH the gap.
 *
 * "Through" is judged at the pinch plane (along = 0), by linear
 * interpolation between the straddling steps: the airframe must CLEAR the
 * aperture there, i.e. |centre offset| <= w/2 - R. Reaching the far side is
 * not enough — squeezing through overlapping both walls, or being squirted
 * sideways past the obstacle, is not threading the needle. Note this makes
 * any w < 2R unpassable by construction, which is the point: the metric
 * being measured is how close to that hard floor the solver gets.
 *
 * `lateral0` is where the UNDISTURBED trajectory would cross the pinch
 * plane, so a crabbing entry is aimed at the same target as a straight one.
 */
function flyGap(colliders, R, scn, w, o) {
  const ax = scn.axis, sd = scn.side;
  const rig = new Rig(colliders, R);
  const yaw = o.angle || 0;
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const lat0 = o.lateral0 || 0;
  const latStart = lat0 - Math.tan(yaw) * (-START_S);        // aim at lateral0 at along = 0
  const vx = (ax.x * c + sd.x * s) * o.speed;
  const vz = (ax.z * c + sd.z * s) * o.speed;
  rig.reset(ax.x * START_S + sd.x * latStart, o.y || 0,
            ax.z * START_S + sd.z * latStart, vx, 0, vz);

  const maxSteps = Math.ceil(((END_S - START_S) / Math.max(0.5, o.speed)) / PHYS_DT) + 400;
  let prevAlong = START_S, prevAcross = latStart;
  let pinchAcross = null;
  let maxAcross = Math.abs(latStart);
  let steps = 0;
  for (; steps < maxSteps; steps++) {
    rig.step(PHYS_DT);
    const along = rig.p.x * ax.x + rig.p.z * ax.z;
    const across = rig.p.x * sd.x + rig.p.z * sd.z;
    if (Math.abs(across) > maxAcross) maxAcross = Math.abs(across);
    if (pinchAcross === null && prevAlong < 0 && along >= 0) {
      const f = (along === prevAlong) ? 0 : (0 - prevAlong) / (along - prevAlong);
      pinchAcross = prevAcross + (across - prevAcross) * f;
    }
    prevAlong = along; prevAcross = across;
    if (along >= END_S) break;
    if (along < START_S - 3 || Math.abs(across) > 25) break;   // bounced / squirted out
  }
  const reached = prevAlong >= END_S;
  const threaded = pinchAcross !== null && Math.abs(pinchAcross) <= w * 0.5 - R + 1e-12;
  return {
    passed: reached && threaded,
    reached, threaded,
    pinchAcross, maxAcross, steps,
    worstResidual: rig.worstResidual,
  };
}

/**
 * Narrowest gap the airframe gets through, to sub-micron precision.
 *
 * Deliberately does NOT assume monotonicity: it hunts upward for a width
 * that passes, then downward for one that blocks, tightening `hi` whenever
 * a narrower width turns out to pass as well.
 */
function minPassableGap(probe, D) {
  let hi = null;
  for (const m of [1.02, 1.1, 1.3, 1.8, 2.5, 4, 8]) {
    if (probe(D * m)) { hi = D * m; break; }
  }
  if (hi === null) return { min: Infinity, squeezes: false, blocked: true };

  let lo = null;
  for (const m of [0.98, 0.9, 0.75, 0.5, 0.3, 0.15, 0.06, 0.02]) {
    const w = D * m;
    if (w >= hi) continue;
    if (probe(w)) hi = w; else { lo = w; break; }
  }
  if (lo === null) return { min: hi, squeezes: true, blocked: false };

  for (let i = 0; i < 26 && hi - lo > 1e-9; i++) {
    const mid = (lo + hi) * 0.5;
    if (probe(mid)) hi = mid; else lo = mid;
  }
  return { min: hi, squeezes: hi < D - 1e-6, blocked: false };
}

// ------------------------------------------------------------
// distance-field exactness: analytic SDF vs brute-force surface sampling
// ------------------------------------------------------------

/** Dense point cloud on a shape's true surface (build once, reuse per probe). */
function surfaceCloud(shape) {
  const pts = [];
  const push = (x, y, z) => pts.push(x, y, z);
  const t = shape.type;
  const N = 128, M = 64;

  const frameFor = (nx, ny, nz) => {
    let ux, uy, uz;
    if (Math.abs(nx) <= Math.abs(ny) && Math.abs(nx) <= Math.abs(nz)) { ux = 0; uy = -nz; uz = ny; }
    else { ux = -ny; uy = nx; uz = 0; }
    const l = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1;
    ux /= l; uy /= l; uz /= l;
    return [ux, uy, uz, ny * uz - nz * uy, nz * ux - nx * uz, nx * uy - ny * ux];
  };

  if (t === 'capsule') {
    const len = Math.sqrt(shape.len2) || 1;
    const ax = shape.dx / len, ay = shape.dy / len, az = shape.dz / len;
    const [ux, uy, uz, vx, vy, vz] = frameFor(ax, ay, az);
    for (let i = 0; i <= M; i++) {
      const f = i / M;
      for (let j = 0; j < N; j++) {
        const th = (j / N) * Math.PI * 2;
        const c = Math.cos(th) * shape.r, sn = Math.sin(th) * shape.r;
        push(shape.ax + shape.dx * f + ux * c + vx * sn,
             shape.ay + shape.dy * f + uy * c + vy * sn,
             shape.az + shape.dz * f + uz * c + vz * sn);
      }
    }
    for (let i = 1; i <= M; i++) {                     // hemispherical caps
      const phi = (i / M) * Math.PI * 0.5;
      const rr = Math.cos(phi) * shape.r, hh = Math.sin(phi) * shape.r;
      for (let j = 0; j < N; j++) {
        const th = (j / N) * Math.PI * 2;
        const c = Math.cos(th) * rr, sn = Math.sin(th) * rr;
        push(shape.ax + ux * c + vx * sn - ax * hh,
             shape.ay + uy * c + vy * sn - ay * hh,
             shape.az + uz * c + vz * sn - az * hh);
        push(shape.bx + ux * c + vx * sn + ax * hh,
             shape.by + uy * c + vy * sn + ay * hh,
             shape.bz + uz * c + vz * sn + az * hh);
      }
    }
  } else if (t === 'torus' || t === 'ring') {
    const [ux, uy, uz, vx, vy, vz] = frameFor(shape.nx, shape.ny, shape.nz);
    for (let i = 0; i < N * 2; i++) {
      const th = (i / (N * 2)) * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      const wx = ux * c + vx * s, wy = uy * c + vy * s, wz = uz * c + vz * s;
      for (let j = 0; j < M * 2; j++) {
        let du, dh;
        if (t === 'torus') {
          const ph = (j / (M * 2)) * Math.PI * 2;
          du = Math.cos(ph) * shape.r; dh = Math.sin(ph) * shape.r;
        } else {
          const f = (j / (M * 2)) * 4, k = Math.floor(f), fr = f - k;
          if (k === 0) { du = -shape.hw + 2 * shape.hw * fr; dh = shape.ht; }
          else if (k === 1) { du = shape.hw; dh = shape.ht - 2 * shape.ht * fr; }
          else if (k === 2) { du = shape.hw - 2 * shape.hw * fr; dh = -shape.ht; }
          else { du = -shape.hw; dh = -shape.ht + 2 * shape.ht * fr; }
        }
        push(shape.cx + wx * (shape.R + du) + shape.nx * dh,
             shape.cy + wy * (shape.R + du) + shape.ny * dh,
             shape.cz + wz * (shape.R + du) + shape.nz * dh);
      }
    }
  } else if (t === 'cyl') {
    for (let i = 0; i < N * 2; i++) {
      const th = (i / (N * 2)) * Math.PI * 2;
      const cs = Math.cos(th), sn = Math.sin(th);
      for (let j = 0; j <= M; j++) {
        push(shape.cx + cs * shape.r, shape.y0 + (shape.y1 - shape.y0) * (j / M), shape.cz + sn * shape.r);
        const rr = shape.r * (j / M);
        push(shape.cx + cs * rr, shape.y0, shape.cz + sn * rr);
        push(shape.cx + cs * rr, shape.y1, shape.cz + sn * rr);
      }
    }
  } else if (t === 'sphere') {
    for (let i = 0; i <= M * 2; i++) {
      const ph = -Math.PI / 2 + (i / (M * 2)) * Math.PI;
      const rr = Math.cos(ph) * shape.r, yy = Math.sin(ph) * shape.r;
      for (let j = 0; j < N * 2; j++) {
        const th = (j / (N * 2)) * Math.PI * 2;
        push(shape.cx + Math.cos(th) * rr, shape.cy + yy, shape.cz + Math.sin(th) * rr);
      }
    }
  } else {
    // boxes: sample all six faces
    let c0, ex, ey, ez;
    if (t === 'obb') {
      c0 = [shape.cx, shape.cy, shape.cz];
      ex = [shape.cos * shape.hx, 0, -shape.sin * shape.hx];
      ey = [0, shape.hy, 0];
      ez = [shape.sin * shape.hz, 0, shape.cos * shape.hz];
    } else {
      const mn = shape.min, mx = shape.max;
      c0 = [(mn.x + mx.x) / 2, (mn.y + mx.y) / 2, (mn.z + mx.z) / 2];
      ex = [(mx.x - mn.x) / 2, 0, 0];
      ey = [0, (mx.y - mn.y) / 2, 0];
      ez = [0, 0, (mx.z - mn.z) / 2];
    }
    const K = 72;
    for (let a = 0; a <= K; a++) {
      for (let b = 0; b <= K; b++) {
        const u = -1 + 2 * (a / K), v = -1 + 2 * (b / K);
        for (const s of [-1, 1]) {
          push(c0[0] + ex[0] * s + ey[0] * u + ez[0] * v, c0[1] + ex[1] * s + ey[1] * u + ez[1] * v, c0[2] + ex[2] * s + ey[2] * u + ez[2] * v);
          push(c0[0] + ex[0] * u + ey[0] * s + ez[0] * v, c0[1] + ex[1] * u + ey[1] * s + ez[1] * v, c0[2] + ex[2] * u + ey[2] * s + ez[2] * v);
          push(c0[0] + ex[0] * u + ey[0] * v + ez[0] * s, c0[1] + ex[1] * u + ey[1] * v + ez[1] * s, c0[2] + ex[2] * u + ey[2] * v + ez[2] * s);
        }
      }
    }
  }
  return new Float64Array(pts);
}

/** Worst |analytic SDF - nearest sampled surface point| over a probe set. */
function sdfExactness(shape, probes) {
  const cloud = surfaceCloud(shape);
  const n = cloud.length;
  let worst = 0;
  const p = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < probes.length; i++) {
    p.x = probes[i][0]; p.y = probes[i][1]; p.z = probes[i][2];
    const sd = distanceToShape(shape, p);
    if (sd < 0) continue;                     // interior: a surface cloud cannot measure it
    let best = Infinity;
    for (let k = 0; k < n; k += 3) {
      const dx = cloud[k] - p.x, dy = cloud[k + 1] - p.y, dz = cloud[k + 2] - p.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < best) best = d2;
    }
    const err = Math.abs(Math.sqrt(best) - sd);
    if (err > worst) worst = err;
  }
  return worst;
}

/**
 * The sharp exactness test, independent of any sampling resolution.
 *
 * A TRUE distance field has |grad| == 1 everywhere outside the shape, its
 * gradient IS the contact normal, and projecting a point onto the surface
 * (p - n*d) must land exactly on it (distance 0). A field that merely
 * approximates distance — a box tested face-by-face, a "normal" snapped to
 * the nearest axis at an edge — fails all three immediately.
 */
function gradientAudit(shape, probes) {
  const h = 1e-5;
  const p = { x: 0, y: 0, z: 0 };
  const n = { x: 0, y: 0, z: 0 };
  const q = { x: 0, y: 0, z: 0 };
  const sd = (x, y, z) => { q.x = x; q.y = y; q.z = z; return distanceToShape(shape, q); };
  let worstMag = 0, worstDirDeg = 0, worstProjMm = 0, used = 0;
  for (let i = 0; i < probes.length; i++) {
    p.x = probes[i][0]; p.y = probes[i][1]; p.z = probes[i][2];
    const d = distanceToShape(shape, p, n);
    if (!(d > 100 * h)) continue;
    const gx = (sd(p.x + h, p.y, p.z) - sd(p.x - h, p.y, p.z)) / (2 * h);
    const gy = (sd(p.x, p.y + h, p.z) - sd(p.x, p.y - h, p.z)) / (2 * h);
    const gz = (sd(p.x, p.y, p.z + h) - sd(p.x, p.y, p.z - h)) / (2 * h);
    const mag = Math.sqrt(gx * gx + gy * gy + gz * gz);
    if (!(mag > 1e-6)) continue;
    used++;
    if (Math.abs(mag - 1) > worstMag) worstMag = Math.abs(mag - 1);
    const dir = angleBetween({ x: gx / mag, y: gy / mag, z: gz / mag }, n);
    if (dir > worstDirDeg) worstDirDeg = dir;
    // project onto the surface: the distance there must be zero
    const proj = Math.abs(sd(p.x - n.x * d, p.y - n.y * d, p.z - n.z * d));
    if (proj > worstProjMm) worstProjMm = proj;
  }
  return { worstGradMagErr: worstMag, worstNormalVsGradDeg: worstDirDeg, worstProjectionMm: worstProjMm * 1000, probes: used };
}

function angleBetween(a, b) {
  const dot = a.x * b.x + a.y * b.y + a.z * b.z;
  return Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
}

function normalAt(shape, x, y, z, R) {
  const n = { x: 0, y: 0, z: 0 };
  const depth = resolveSphere(shape, { x, y, z }, R, n);
  return { depth, n };
}

// ------------------------------------------------------------
// the suite
// ------------------------------------------------------------

/**
 * @param {object} [opts]
 * @param {string}  [opts.drone='meteor75']  'meteor75' | 'cinebot30' | 'nazgul5'
 * @param {number[]}[opts.speeds=[6,25,60]]  m/s each gap is flown at
 * @param {boolean} [opts.quiet=false]       suppress console output
 * @param {boolean} [opts.skipExactness]     skip the (slow) SDF audit
 * @returns {object} full report
 */
export function runCollisionTests(opts = {}) {
  const droneKey = opts.drone || 'meteor75';
  const wheelbase = WHEELBASE[droneKey] || WHEELBASE.meteor75;
  const R = wheelbase * AIRFRAME_K;
  const D = 2 * R;
  const speeds = opts.speeds || [6, 25, 60];
  const quiet = !!opts.quiet;
  const log = quiet ? () => {} : (...a) => console.log(...a);
  const now = () => ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
  const t0 = now();

  const report = {
    drone: droneKey,
    wheelbaseM: wheelbase,
    airframeRadiusM: R,
    airframeDiameterM: D,
    theoreticalMinGapM: D,
    gaps: [],
    clip: [],
    containment: [],
    tunnelling: [],
    exactness: [],
    normals: [],
    resting: [],
    sweep: null,
    broadphase: null,
    failures: [],
    warnings: [],
    passed: true,
  };
  const fail = (what, detail) => { report.failures.push(`${what} — ${detail}`); report.passed = false; };
  const warn = (what, detail) => { report.warnings.push(`${what} — ${detail}`); };

  // ---------------- 1. gap sweeps ----------------
  // Three approaches per shape, all aimed at the same pinch plane:
  //   centred  — the pure geometric limit; the answer must be exactly 2R
  //   grazing  — aimed HALF A RADIUS INSIDE the wall, so the resolver has to
  //              push the airframe clear and let it slide through. This is
  //              the actual "clip the gap and keep going" case.
  //   angled   — crabbing at 6 degrees through the middle.
  const CRAB = 6 * Math.PI / 180;
  const APPROACHES = [
    { name: 'centred', angle: 0, tol: () => 0.01 },
    // A crab through a FLAT aperture of depth d costs d*tan(angle) of extra
    // width as pure geometry, whatever the solver does; anything past that
    // plus 4 mm is the solver failing to let the airframe slide.
    { name: 'angled 6deg', angle: CRAB, tol: (scn) => scn.flatDepth * Math.tan(CRAB) * 1000 + 4 },
  ];

  for (const scn of SCENARIOS) {
    for (const ap of APPROACHES) {
      let worstMin = 0, worstSpeed = 0, squeezes = false, blocked = false;
      for (const speed of speeds) {
        const probe = (w) => flyGap(scn.build(w), R, scn, w, {
          speed,
          angle: ap.angle,
          lateral0: 0,
        }).passed;
        const res = minPassableGap(probe, D);
        if (res.squeezes) squeezes = true;
        if (res.blocked) blocked = true;
        if (res.min > worstMin) { worstMin = res.min; worstSpeed = speed; }
      }
      const excessMm = (worstMin - D) * 1000;
      const tolMm = ap.tol(scn);
      const geomMm = ap.angle ? scn.flatDepth * Math.tan(ap.angle) * 1000 : 0;
      report.gaps.push({
        shape: scn.key,
        approach: ap.name,
        theoreticalMm: +(D * 1000).toFixed(3),
        measuredMinMm: Number.isFinite(worstMin) ? +(worstMin * 1000).toFixed(3) : Infinity,
        excessMm: Number.isFinite(excessMm) ? +excessMm.toFixed(3) : Infinity,
        unavoidableGeomMm: +geomMm.toFixed(3),
        solverCostMm: Number.isFinite(excessMm) ? +(excessMm - geomMm).toFixed(3) : Infinity,
        worstSpeedMs: worstSpeed,
        tolMm: +tolMm.toFixed(2),
      });
      if (blocked) fail(`gap ${scn.key}/${ap.name}`, 'no gap width was passable at all');
      // THE requirement: a gap the airframe fits through must stay passable.
      else if (excessMm > tolMm) {
        fail(`gap ${scn.key}/${ap.name}`,
          `needs ${excessMm.toFixed(3)} mm more than the airframe diameter (${(D * 1000).toFixed(2)} mm), tolerance ${tolMm.toFixed(2)} mm`);
      }
      // Geometrically impossible under the pass criterion; if it ever fires
      // the criterion itself has drifted.
      if (squeezes) fail(`gap ${scn.key}/${ap.name}`, 'reported a pass below the geometric floor');
    }
  }

  // ---------------- 1b. clip tolerance ----------------
  // The flight-feel half of threading: in a comfortably wide gap (3x the
  // airframe), how far INTO a wall can the aimed line be and still come out
  // the other side? 0 mm means any contact stops you dead; R means you can
  // aim at the wall face itself and the solver still slides you clear.
  for (const scn of SCENARIOS) {
    const w = D * 3;
    const cols = scn.build(w);
    for (const speed of speeds) {
      const probe = (c) => flyGap(cols, R, scn, w, {
        speed, angle: 0, lateral0: w * 0.5 - R + c,
      }).passed;
      let lo = 0, hi = R;
      if (!probe(0)) { lo = -1; }                        // tangent aim already fails
      else if (probe(R)) { lo = R; hi = R; }
      else {
        for (let i = 0; i < 18 && hi - lo > 1e-6; i++) {
          const mid = (lo + hi) * 0.5;
          if (probe(mid)) lo = mid; else hi = mid;
        }
      }
      report.clip.push({
        shape: scn.key,
        speedMs: speed,
        maxRecoverableClipMm: lo < 0 ? null : +(lo * 1000).toFixed(2),
        asFractionOfRadius: lo < 0 ? null : +(lo / R).toFixed(3),
      });
      if (lo < 0) fail('clip tolerance', `${scn.key} @ ${speed} m/s: a tangent (zero-overlap) line does not get through`);
    }
  }

  // ---------------- 1c. undersize-gap containment ----------------
  // A gap NARROWER than the airframe must actually stop the quad. This is a
  // separate question from precision: the airframe centre can traverse a
  // pinch it does not fit through, overlapping both walls on the way, if the
  // solver never converts that overlap into a loss of forward speed.
  for (const frac of [0.5, 0.8, 0.95]) {
    const w = D * frac;
    for (const scn of SCENARIOS) {
      const res = flyGap(scn.build(w), R, scn, w, { speed: 25, angle: 0, lateral0: 0 });
      report.containment.push({
        shape: scn.key,
        gapPctOfAirframe: +(frac * 100).toFixed(0),
        gapMm: +(w * 1000).toFixed(2),
        stopped: !res.reached,
        centreTraversedAnyway: res.reached,
        overlapAtPinchMm: res.pinchAcross === null ? null
          : +((R - (w * 0.5 - Math.abs(res.pinchAcross))) * 1000).toFixed(2),
      });
      if (res.reached) {
        warn(`containment ${scn.key} @ ${(frac * 100).toFixed(0)}%`,
          'the airframe centre traverses a gap it does not fit through — the wedge scrub did not bleed off enough forward speed here');
      }
    }
  }

  // ---------------- 2. tunnelling ----------------
  // Thin geometry at every speed the flight model allows, including grazing
  // approaches. Nothing may come out the far side.
  const thinWall = [makeBox(0, -25, 0, 4000, 50, 0.02)];
  const thinPole = [makeCapsuleY(0, -5, 0, 0.01, 10)];
  for (const speed of [10, 25, 45, 60, 80]) {
    for (const deg of [0, 30, 60, 80, 85]) {
      const a = deg * Math.PI / 180;
      const rig = new Rig(thinWall, R);
      rig.reset(0, 0, -3, Math.sin(a) * speed, 0, Math.cos(a) * speed);
      let deepest = -3, crossed = false;
      for (let i = 0; i < 6000; i++) {
        rig.step(PHYS_DT);
        if (rig.p.z > 0.01 + R + 1e-4) { crossed = true; break; }
        if (rig.p.z > deepest) deepest = rig.p.z;
        if (rig.p.z < -6 || Math.abs(rig.p.x) > 1500) break;
      }
      report.tunnelling.push({
        obstacle: 'wall 2 cm', speedMs: speed, angleDeg: deg,
        tunnelled: crossed, closestApproachZ: +deepest.toFixed(5),
      });
      if (crossed) fail('tunnelling', `2 cm wall at ${speed} m/s, ${deg} deg off-normal`);
    }
  }
  for (const speed of [10, 25, 45, 60, 80]) {
    const rig = new Rig(thinPole, R);
    rig.reset(0.0005, 0, -3, 0, 0, speed);          // dead-on, a hair off the axis
    let minD = Infinity, crossed = false;
    for (let i = 0; i < 6000; i++) {
      rig.step(PHYS_DT);
      const d = distanceToShape(thinPole[0], rig.p);
      if (d < minD) minD = d;
      if (rig.p.z > 0.5) { crossed = true; break; }
      if (rig.p.z < -6 || Math.abs(rig.p.x) > 40) break;
    }
    const buried = Math.max(0, R - minD);
    report.tunnelling.push({
      obstacle: 'pole r=1 cm', speedMs: speed, angleDeg: 0,
      tunnelled: crossed && buried > 1e-4,
      deepestBurialMm: +(buried * 1000).toFixed(4),
    });
    if (buried > 1e-3) {
      fail('tunnelling', `1 cm pole buried ${(buried * 1000).toFixed(2)} mm at ${speed} m/s`);
    }
  }

  // ---------------- 3. resting stability ----------------
  // Jitter is what makes a tight gap feel sticky, so measure it instead of
  // assuming it. Two cases: comfortably inside a slot, and pinched by one.
  for (const mult of [1.05, 0.98]) {
    const w = D * mult;
    const cols = [
      makeBox(-(w * 0.5 + 1), -10, 0, 2, 20, 24),
      makeBox(+(w * 0.5 + 1), -10, 0, 2, 20, 24),
      makeBox(0, -1, 0, 20, 1, 24),                  // floor: top face at y = 0
    ];
    const rig = new Rig(cols, R);
    rig.gravity = 9.81;
    rig.reset(0, R + 0.5, 0, 0, 0, 0);
    for (let i = 0; i < 600; i++) rig.step(PHYS_DT);          // 1.5 s to settle
    let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
    for (let i = 0; i < 1200; i++) {                          // 3 s of measurement
      rig.step(PHYS_DT);
      if (rig.p.x < xmin) xmin = rig.p.x;
      if (rig.p.x > xmax) xmax = rig.p.x;
      if (rig.p.y < ymin) ymin = rig.p.y;
      if (rig.p.y > ymax) ymax = rig.p.y;
    }
    const row = {
      slot: `${(mult * 100).toFixed(0)}% of airframe`,
      slotWidthMm: +(w * 1000).toFixed(2),
      lateralJitterMm: +((xmax - xmin) * 1000).toFixed(4),
      verticalJitterMm: +((ymax - ymin) * 1000).toFixed(4),
      restYmm: +(rig.p.y * 1000).toFixed(3),
      expectedRestYmm: +(R * 1000).toFixed(3),
      residualOverlapMm: +(rig.worstResidual * 1000).toFixed(4),
    };
    report.resting.push(row);
    if (mult > 1) {
      if (row.lateralJitterMm > 0.5) fail('resting', `${row.lateralJitterMm} mm of lateral jitter in a slot it fits`);
      if (row.verticalJitterMm > 0.5) fail('resting', `${row.verticalJitterMm} mm of vertical jitter at rest`);
      if (Math.abs(rig.p.y - R) > 1e-3) fail('resting', `rests at y=${rig.p.y.toFixed(5)} m, expected ${R.toFixed(5)} m`);
    } else if (row.lateralJitterMm > 0.5) {
      warn('resting', `pinched in an undersize slot the airframe oscillates ${row.lateralJitterMm} mm laterally`);
    }
  }

  // ---------------- 4. distance-field exactness ----------------
  {
    // Deterministic jitter keeps probes off the medial axes (a torus hole's
    // centre line, a box's diagonal), where a distance field's gradient is
    // legitimately discontinuous and central differences are meaningless.
    let seed = 987654321;
    const jit = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed / 0x7fffffff - 0.5) * 0.07; };
    const probeShell = (rad) => {
      const out = [];
      for (let i = 0; i < 9; i++) {
        const th = (i / 9) * Math.PI * 2 + 0.113;
        for (let j = 0; j <= 4; j++) {
          const ph = -Math.PI / 2 + (j / 4) * Math.PI + 0.071;
          out.push([
            Math.cos(ph) * Math.cos(th) * rad + jit(),
            Math.sin(ph) * rad + jit(),
            Math.cos(ph) * Math.sin(th) * rad + jit(),
          ]);
        }
      }
      return out;
    };
    const exactShapes = [
      ['aabb', makeBox(0, -0.5, 0, 1.4, 1.0, 0.8), 0.004],
      ['obb', makeOBB(0, -0.5, 0, 1.4, 1.0, 0.8, 0.7), 0.004],
      ['cyl', makeCylinder(0, -0.6, 0, 0.5, 1.2), 0.004],
      ['sphere', makeSphere(0, 0, 0, 0.6), 0.002],
      ['capsule', makeCapsule(-0.5, -0.2, 0.1, 0.6, 0.4, -0.2, 0.12), 0.002],
      ['torus', makeTorus(0, 0, 0, 0.8, 0.14, 0, 0, 1), 0.002],
      ['ring', makeRing(0, 0, 0, 0.8, 0.1, 0.06, 0.3, 0.9, 0.1), 0.002],
    ];
    for (const [name, shape, tol] of exactShapes) {
      // (a) exact-distance audit: |grad| == 1, normal == grad, and the
      //     projected point lands ON the surface. Resolution-independent.
      let gm = 0, gd = 0, gp = 0, gn = 0;
      for (const rad of [0.9, 1.4, 2.6, 5.0]) {
        const g = gradientAudit(shape, probeShell(rad));
        gm = Math.max(gm, g.worstGradMagErr);
        gd = Math.max(gd, g.worstNormalVsGradDeg);
        gp = Math.max(gp, g.worstProjectionMm);
        gn += g.probes;
      }
      // (b) brute-force cross-check against a dense cloud on the real
      //     surface. Coarser (the cloud is a finite grid) but it catches a
      //     field that is smooth and unit-gradient yet simply WRONG.
      let bf = 0;
      if (!opts.skipExactness) {
        for (const rad of [1.1, 2.0, 4.0]) {
          const err = sdfExactness(shape, probeShell(rad));
          if (err > bf) bf = err;
        }
      }
      report.exactness.push({
        shape: name,
        gradMagErr: +gm.toExponential(2),
        normalVsGradientDeg: +gd.toExponential(2),
        surfaceProjectionErrMm: +gp.toExponential(2),
        bruteForceErrMm: opts.skipExactness ? null : +(bf * 1000).toFixed(4),
        bruteForceTolMm: +(tol * 1000).toFixed(2),
        probes: gn,
      });
      if (gm > 1e-6) fail('sdf exactness', `${name}: |grad| deviates from 1 by ${gm.toExponential(2)} — not a true distance field`);
      if (gd > 1e-3) fail('sdf exactness', `${name}: contact normal is ${gd.toExponential(2)} deg off the distance gradient`);
      if (gp > 1e-6) fail('sdf exactness', `${name}: projecting onto the surface misses by ${gp.toExponential(2)} mm`);
      if (!opts.skipExactness && bf > tol) fail('sdf exactness', `${name} brute-force mismatch ${(bf * 1000).toFixed(3)} mm`);
    }
  }

  // ---------------- 5. feature normals: face / edge / corner / interior ----
  {
    const box = makeBox(0, -1, 0, 2, 2, 2);          // spans [-1,1] on every axis
    const k = R * 0.5 / Math.SQRT2;
    const S3 = 1 / Math.sqrt(3);
    const cases = [
      ['face +X', 1 + R * 0.5, 0, 0, [1, 0, 0]],
      ['face +Y', 0, 1 + R * 0.5, 0, [0, 1, 0]],
      ['edge +X+Y', 1 + k, 1 + k, 0, [Math.SQRT1_2, Math.SQRT1_2, 0]],
      ['edge +X+Z', 1 + k, 0, 1 + k, [Math.SQRT1_2, 0, Math.SQRT1_2]],
      ['edge +Y+Z', 0, 1 + k, 1 + k, [0, Math.SQRT1_2, Math.SQRT1_2]],
      ['corner +++', 1 + R * 0.3, 1 + R * 0.3, 1 + R * 0.3, [S3, S3, S3]],
      ['corner +-+', 1 + R * 0.3, -1 - R * 0.3, 1 + R * 0.3, [S3, -S3, S3]],
    ];
    for (const [label, x, y, z, want] of cases) {
      const { depth, n } = normalAt(box, x, y, z, R);
      const err = (depth > 0) ? angleBetween(n, { x: want[0], y: want[1], z: want[2] }) : NaN;
      report.normals.push({ feature: label, contacted: depth > 0, errDeg: +Number(err).toFixed(6) });
      if (!(depth > 0)) fail('normals', `${label} produced no contact`);
      else if (err > 0.01) fail('normals', `${label} normal off by ${err.toFixed(4)} deg (face normal instead of edge/corner?)`);
    }
    // A centre INSIDE the shape must exit through the nearest face.
    const inside = normalAt(box, 0.9, 0.1, -0.2, R);
    const insideErr = angleBetween(inside.n, { x: 1, y: 0, z: 0 });
    report.normals.push({ feature: 'interior', contacted: inside.depth > 0, errDeg: +insideErr.toFixed(6) });
    if (insideErr > 0.01) fail('normals', 'an interior centre did not exit through the nearest face');
    if (Math.abs(inside.depth - (R + 0.1)) > 1e-9) {
      fail('normals', `interior depth ${inside.depth.toFixed(9)}, expected ${(R + 0.1).toFixed(9)}`);
    }
    // Capsule + torus normals are pure radial / core-circle directions.
    const cap = makeCapsule(-1, 0, 0, 1, 0, 0, 0.1);
    const cn = normalAt(cap, 0, 0.1 + R * 0.5, 0, R);
    if (angleBetween(cn.n, { x: 0, y: 1, z: 0 }) > 0.01) fail('normals', 'capsule side normal is not radial');
    const tor = makeTorus(0, 0, 0, 1, 0.1, 0, 1, 0);
    const tn = normalAt(tor, 1 + 0.1 + R * 0.5, 0, 0, R);
    if (angleBetween(tn.n, { x: 1, y: 0, z: 0 }) > 0.01) fail('normals', 'torus outer normal is not radial');
    const tin = normalAt(tor, 0, 0, 0, R);            // dead centre of the hole
    if (tin.depth !== 0) fail('normals', 'the centre of a torus hole reports a contact — the hole is not open');
  }

  // ---------------- 6. swept query ----------------
  {
    const pole = makeCapsuleY(0, -5, 0, 0.05, 10);
    const t = sweepSphere(pole, { x: 0, y: 0, z: -5 }, { x: 0, y: 0, z: 5 }, R);
    const expected = (5 - (R + 0.05)) / 10;
    const miss = sweepSphere(pole, { x: 2, y: 0, z: -5 }, { x: 2, y: 0, z: 5 }, R);
    report.sweep = {
      toi: +t.toFixed(8),
      expectedToi: +expected.toFixed(8),
      errMm: +(Math.abs(t - expected) * 10 * 1000).toFixed(4),
      clearSweepReturnsMinusOne: miss === -1,
    };
    if (Math.abs(t - expected) * 10 > 1e-4) fail('sweep', `TOI off by ${(Math.abs(t - expected) * 10 * 1000).toFixed(3)} mm`);
    if (miss !== -1) fail('sweep', 'a clear sweep reported a hit');
  }

  // ---------------- 7. broadphase completeness ----------------
  {
    const bag = [];
    for (let i = 0; i < 1200; i++) {
      const x = (i % 40) * 7 - 140, z = Math.floor(i / 40) * 7 - 100;
      bag.push(i % 3 === 0 ? makeCylinder(x, 0, z, 0.3, 6)
        : (i % 3 === 1 ? makeBox(x, 0, z, 3, 8, 3) : makeCapsuleY(x, 0, z, 0.06, 5)));
    }
    bag.push(makeCompound([makeBox(0, 3, 0, 12, 0.6, 200), makeCylinder(-5, -6, 0, 0.5, 9)]));
    bag.push(makeBox(0, -1, 0, 900, 1, 900));         // map-sized ground plane
    const gb0 = now();
    const g = buildGrid(bag);
    const gb1 = now();
    let missed = 0, checked = 0;
    const out = [];
    let seed = 12345;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let k = 0; k < 300; k++) {
      const x = rnd() * 300 - 150, z = rnd() * 260 - 130, rad = 1.5;
      const got = g.query(x, z, rad, out);
      const set = new Set(got);
      for (const s of g.shapes) {
        if (s.max.x < x - rad || s.min.x > x + rad || s.max.z < z - rad || s.min.z > z + rad) continue;
        checked++;
        if (!set.has(s)) missed++;
      }
    }
    report.broadphase = {
      sourceColliders: bag.length,
      indexedPrimitives: g.itemCount,
      compoundsFlattened: g.itemCount > bag.length,
      cellSizeM: g.cellSize,
      coarseCellSizeM: g.coarseCellSize,
      cells: g.cellCount,
      alwaysTested: g.alwaysCount,
      maxBucket: g.maxBucket,
      overlapsChecked: checked,
      missed,
      buildMs: +(gb1 - gb0).toFixed(3),
    };
    if (missed) fail('broadphase', `${missed}/${checked} overlapping colliders were not returned by query()`);
    if (!report.broadphase.compoundsFlattened) fail('broadphase', 'compounds were not flattened into their parts');
  }

  // ---- headline numbers ----
  const pick = (rows) => rows.reduce((a, b) => (b.measuredMinMm > a.measuredMinMm ? b : a), rows[0]);
  const centred = pick(report.gaps.filter((g) => g.approach === 'centred'));
  const angled = pick(report.gaps.filter((g) => g.approach === 'angled 6deg'));
  const clipVals = report.clip.filter((c) => c.maxRecoverableClipMm !== null);
  const clipMin = clipVals.length ? clipVals.reduce((a, b) => (b.maxRecoverableClipMm < a.maxRecoverableClipMm ? b : a)) : null;
  const traversals = report.containment.filter((c) => c.centreTraversedAnyway).length;
  report.summary = {
    airframe: `${droneKey} — sphere r=${(R * 1000).toFixed(2)} mm, d=${(D * 1000).toFixed(2)} mm`,
    theoreticalMinGapMm: +(D * 1000).toFixed(2),
    measuredMinGapMm_centred: centred.measuredMinMm,
    precisionMm_centred: centred.excessMm,
    worstShape_centred: centred.shape,
    measuredMinGapMm_angled6deg: angled.measuredMinMm,
    precisionMm_angled6deg: angled.excessMm,
    worstShape_angled: `${angled.shape} @ ${angled.worstSpeedMs} m/s`,
    tightestClipRecoveryMm: clipMin ? clipMin.maxRecoverableClipMm : null,
    tightestClipCase: clipMin ? `${clipMin.shape} @ ${clipMin.speedMs} m/s` : null,
    undersizeGapsTraversed: `${traversals}/${report.containment.length}`,
    failures: report.failures.length,
    warnings: report.warnings.length,
  };
  report.elapsedMs = Math.round(now() - t0);

  if (!quiet) {
    log(`%c[PropWash collision] ${droneKey} — airframe sphere r=${(R * 1000).toFixed(2)} mm, d=${(D * 1000).toFixed(2)} mm`,
      'font-weight:bold;font-size:13px');
    console.table(report.gaps);
    console.table(report.clip);
    console.table(report.containment);
    console.table(report.tunnelling);
    if (report.exactness.length) console.table(report.exactness);
    console.table(report.normals);
    console.table(report.resting);
    log('sweep:', report.sweep);
    log('broadphase:', report.broadphase);
    log('%cSUMMARY', 'font-weight:bold', report.summary);
    if (report.warnings.length) console.warn('WARNINGS:\n' + report.warnings.join('\n'));
    if (report.failures.length) console.error('FAILURES:\n' + report.failures.join('\n'));
    else log(`%cAll collision assertions passed in ${report.elapsedMs} ms.`, 'color:#4ade80;font-weight:bold');
  }
  return report;
}

export default runCollisionTests;
