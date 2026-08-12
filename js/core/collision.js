// ============================================================
// PropWash FPV — collision shapes + broadphase
//
// A tiny, allocation-free collision kernel used by the flight model
// (js/physics/quad.js). The quad is approximated as a sphere; the world
// is a bag of static convex shapes.
//
// SHAPES (all carry a world-space AABB in `min`/`max`, so anything that
// already treats a collider as a box — e.g. camera/signal.js occlusion —
// keeps working unchanged):
//
//   {type:'aabb',   min, max}                       world-axis box   (legacy)
//   {type:'cyl',    cx, cz, r, y0, y1, min, max}    Y-axis cylinder
//   {type:'obb',    cx, cy, cz, hx, hy, hz, cos, sin, yaw, min, max}
//   {type:'sphere', cx, cy, cz, r, min, max}
//
// LEGACY COMPAT: a plain `{min, max}` object with no `type` field is
// treated as an 'aabb'. Maps that were written before this module existed
// need no changes at all — the new shapes are strictly opt-in.
//
// CONSTRUCTOR CONVENTION matches the map helper `addCollider(cx,cy,cz,sx,sy,sz)`
// that every map already uses: X/Z are CENTRED on cx/cz, Y is a BASE at cy
// growing upward by the height. (makeSphere is the exception — a sphere has
// no natural base, so its cy is the centre.)
//
// BROADPHASE: buildGrid() returns a uniform spatial hash over XZ (worlds are
// wide and thin; hashing Y as well would explode the cell count for towers).
// Y is rejected cheaply by the per-shape AABB test inside resolveSphere().
// ============================================================

import * as THREE from 'three';

// Spatial-hash key packing: cell indices live in [-KEY_OFF, KEY_OFF-1].
// With a 12 m cell that covers +/-196 km, and the packed key stays a
// small integer (max 2^30) so Map lookups never fall off the fast path.
const KEY_OFF = 1 << 14;
const KEY_MUL = 1 << 15;
const MAX_CELLS_PER_SHAPE = 256;   // bigger footprints go in the "always test" list
const DEFAULT_CELL = 12;

function cellKey(ix, iz) { return (ix + KEY_OFF) * KEY_MUL + (iz + KEY_OFF); }

/** Write a normal without allocating; works for THREE.Vector3 and plain {x,y,z}. */
function setN(out, x, y, z) {
  if (!out) return;
  out.x = x; out.y = y; out.z = z;
}

function fin(n, fallback) { return Number.isFinite(n) ? n : fallback; }

// ------------------------------------------------------------
// shape constructors
// ------------------------------------------------------------

/**
 * World-axis-aligned box. Identical geometry to the historical
 * addCollider(): X/Z centred, Y is the base and sy the height.
 */
export function makeBox(cx, cy, cz, sx, sy, sz) {
  const x = fin(cx, 0), y = fin(cy, 0), z = fin(cz, 0);
  const hx = Math.abs(fin(sx, 0)) * 0.5;
  const hy = Math.abs(fin(sy, 0));
  const hz = Math.abs(fin(sz, 0)) * 0.5;
  return {
    type: 'aabb',
    min: new THREE.Vector3(x - hx, y, z - hz),
    max: new THREE.Vector3(x + hx, y + hy, z + hz),
  };
}

/**
 * Y-axis aligned cylinder — poles, palm trunks, columns, silos, chimneys.
 * cy is the base, `height` grows upward.
 */
export function makeCylinder(cx, cy, cz, radius, height) {
  const x = fin(cx, 0), y = fin(cy, 0), z = fin(cz, 0);
  const r = Math.max(0, fin(radius, 0));
  const h = Math.abs(fin(height, 0));
  return {
    type: 'cyl',
    cx: x, cz: z, r,
    y0: y, y1: y + h,
    min: new THREE.Vector3(x - r, y, z - r),
    max: new THREE.Vector3(x + r, y + h, z + r),
  };
}

/**
 * Yaw-rotated box — angled buildings, boats, vehicles, ramps, signage.
 * cy is the base; yawRad follows three.js Object3D.rotation.y, so you can
 * pass a mesh's own rotation.y straight in.
 */
export function makeOBB(cx, cy, cz, sx, sy, sz, yawRad) {
  const x = fin(cx, 0), y = fin(cy, 0), z = fin(cz, 0);
  const hx = Math.abs(fin(sx, 0)) * 0.5;
  const hy = Math.abs(fin(sy, 0)) * 0.5;
  const hz = Math.abs(fin(sz, 0)) * 0.5;
  const yaw = fin(yawRad, 0);
  const c = Math.cos(yaw), s = Math.sin(yaw);
  // three.js rotateY: local +X -> ( c,0,-s), local +Z -> ( s,0, c)
  const ex = Math.abs(c) * hx + Math.abs(s) * hz;
  const ez = Math.abs(s) * hx + Math.abs(c) * hz;
  return {
    type: 'obb',
    cx: x, cy: y + hy, cz: z,      // cy stored as the CENTRE for the solver
    hx, hy, hz, cos: c, sin: s, yaw,
    min: new THREE.Vector3(x - ex, y, z - ez),
    max: new THREE.Vector3(x + ex, y + hy * 2, z + ez),
  };
}

/** Sphere — domes, buoys, boulders, water towers. cy is the CENTRE. */
export function makeSphere(cx, cy, cz, r) {
  const x = fin(cx, 0), y = fin(cy, 0), z = fin(cz, 0);
  const rad = Math.max(0, fin(r, 0));
  return {
    type: 'sphere',
    cx: x, cy: y, cz: z, r: rad,
    min: new THREE.Vector3(x - rad, y - rad, z - rad),
    max: new THREE.Vector3(x + rad, y + rad, z + rad),
  };
}

// ------------------------------------------------------------
// narrowphase — sphere vs shape
// ------------------------------------------------------------

/**
 * Box core in whatever space the caller hands over (world for AABB, local
 * for OBB). Returns the penetration depth: the distance the sphere centre
 * must travel along `out` to sit exactly on the surface. 0 = no contact.
 */
function boxCore(px, py, pz, ax, ay, az, bx, by, bz, R, out) {
  const qx = px < ax ? ax : (px > bx ? bx : px);
  const qy = py < ay ? ay : (py > by ? by : py);
  const qz = pz < az ? az : (pz > bz ? bz : pz);
  const dx = px - qx, dy = py - qy, dz = pz - qz;
  const d2 = dx * dx + dy * dy + dz * dz;
  if (d2 > R * R) return 0;
  if (d2 > 1e-12) {
    const d = Math.sqrt(d2);
    const inv = 1 / d;
    setN(out, dx * inv, dy * inv, dz * inv);
    return R - d;
  }
  // Centre is inside the box: leave through the nearest face.
  let best = px - ax, nx = -1, ny = 0, nz = 0;
  let t = bx - px;
  if (t < best) { best = t; nx = 1; ny = 0; nz = 0; }
  t = py - ay;
  if (t < best) { best = t; nx = 0; ny = -1; nz = 0; }
  t = by - py;
  if (t < best) { best = t; nx = 0; ny = 1; nz = 0; }
  t = pz - az;
  if (t < best) { best = t; nx = 0; ny = 0; nz = -1; }
  t = bz - pz;
  if (t < best) { best = t; nx = 0; ny = 0; nz = 1; }
  setN(out, nx, ny, nz);
  return best + R;
}

function resolveCyl(s, px, py, pz, R, out) {
  const dx = px - s.cx, dz = pz - s.cz;
  const dr2 = dx * dx + dz * dz;
  const r = s.r;
  const dr = Math.sqrt(dr2);
  let qx = px, qz = pz;
  if (dr > r && dr > 1e-9) {
    const k = r / dr;
    qx = s.cx + dx * k;
    qz = s.cz + dz * k;
  }
  const qy = py < s.y0 ? s.y0 : (py > s.y1 ? s.y1 : py);
  const ex = px - qx, ey = py - qy, ez = pz - qz;
  const d2 = ex * ex + ey * ey + ez * ez;
  if (d2 > R * R) return 0;
  if (d2 > 1e-12) {
    const d = Math.sqrt(d2);
    const inv = 1 / d;
    setN(out, ex * inv, ey * inv, ez * inv);
    return R - d;
  }
  // Centre inside the solid: leave through the cheapest of side / cap.
  const side = r - dr;
  const top = s.y1 - py;
  const bot = py - s.y0;
  if (side <= top && side <= bot) {
    if (dr > 1e-6) setN(out, dx / dr, 0, dz / dr);
    else setN(out, 1, 0, 0);          // dead on the axis — any radial works
    return side + R;
  }
  if (top <= bot) { setN(out, 0, 1, 0); return top + R; }
  setN(out, 0, -1, 0);
  return bot + R;
}

function resolveSph(s, px, py, pz, R, out) {
  const dx = px - s.cx, dy = py - s.cy, dz = pz - s.cz;
  const d2 = dx * dx + dy * dy + dz * dz;
  const rr = R + s.r;
  if (d2 > rr * rr) return 0;
  if (d2 > 1e-12) {
    const d = Math.sqrt(d2);
    const inv = 1 / d;
    setN(out, dx * inv, dy * inv, dz * inv);
    return rr - d;
  }
  setN(out, 0, 1, 0);
  return rr;
}

function resolveOBB(s, px, py, pz, R, out) {
  const dx = px - s.cx, dy = py - s.cy, dz = pz - s.cz;
  const c = s.cos, sn = s.sin;
  // world -> local (inverse of a +Y rotation)
  const lx = dx * c - dz * sn;
  const lz = dx * sn + dz * c;
  const depth = boxCore(lx, dy, lz, -s.hx, -s.hy, -s.hz, s.hx, s.hy, s.hz, R, out);
  if (depth <= 0) return 0;
  // local -> world
  const nx = out.x, nz = out.z;
  out.x = c * nx + sn * nz;
  out.z = -sn * nx + c * nz;
  return depth;
}

/**
 * Sphere-vs-shape. Returns the penetration depth (>0 when overlapping,
 * 0 when separate) and writes the unit contact normal — pointing from the
 * shape toward the sphere — into `outNormal`.
 *
 * Allocation-free: every intermediate is a stack scalar.
 *
 * @param {object} shape   any shape from this module, or a legacy {min,max}
 * @param {{x,y,z}} p      sphere centre
 * @param {number} R       sphere radius
 * @param {{x,y,z}} outNormal
 * @returns {number} penetration depth in metres
 */
export function resolveSphere(shape, p, R, outNormal) {
  if (!shape || !p) return 0;
  const px = p.x, py = p.y, pz = p.z;
  const mn = shape.min, mx = shape.max;
  // Conservative AABB reject — every shape type carries valid bounds.
  if (mn && mx) {
    if (px < mn.x - R || px > mx.x + R ||
        py < mn.y - R || py > mx.y + R ||
        pz < mn.z - R || pz > mx.z + R) return 0;
  }
  const t = shape.type;
  if (t === 'cyl') return resolveCyl(shape, px, py, pz, R, outNormal);
  if (t === 'obb') return resolveOBB(shape, px, py, pz, R, outNormal);
  if (t === 'sphere') return resolveSph(shape, px, py, pz, R, outNormal);
  if (!mn || !mx) return 0;                    // legacy bag entry, unusable
  return boxCore(px, py, pz, mn.x, mn.y, mn.z, mx.x, mx.y, mx.z, R, outNormal);
}

// ------------------------------------------------------------
// broadphase — uniform spatial hash over XZ
// ------------------------------------------------------------

function autoCellSize(items) {
  const n = items.length;
  if (!n) return DEFAULT_CELL;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const s = items[i];
    sum += (s.max.x - s.min.x) + (s.max.z - s.min.z);
  }
  const mean = sum / (2 * n);                 // mean footprint span
  return Math.min(48, Math.max(4, mean * 1.5));
}

/**
 * Build a uniform spatial hash over the XZ footprints of `shapes`.
 * Cheap enough to rebuild whenever a map's collider list changes identity
 * or length; ~350 shapes builds in well under a millisecond.
 *
 * The returned object is read-only from the caller's point of view:
 *   grid.query(x, z, radius, outArray) -> outArray   (reused, never grows
 *                                                     unboundedly, no alloc)
 *
 * @param {Array} shapes    collider bag (new shapes and/or legacy {min,max})
 * @param {number} [cellSize]  metres; omitted = derived from mean footprint
 */
export function buildGrid(shapes, cellSize) {
  const src = Array.isArray(shapes) ? shapes : [];
  const items = [];
  for (let i = 0; i < src.length; i++) {
    const s = src[i];
    if (!s) continue;
    const mn = s.min, mx = s.max;
    if (!mn || !mx) continue;
    if (!Number.isFinite(mn.x + mn.y + mn.z + mx.x + mx.y + mx.z)) continue;
    if (mx.x < mn.x || mx.y < mn.y || mx.z < mn.z) continue;
    items.push(s);
  }

  const cs = (Number.isFinite(cellSize) && cellSize > 0) ? cellSize : autoCellSize(items);
  const inv = 1 / cs;
  const cells = new Map();
  const always = [];                    // shapes too large to bucket sanely
  let maxBucket = 0;

  const clampIdx = (v) => (v < -KEY_OFF ? -KEY_OFF : (v > KEY_OFF - 1 ? KEY_OFF - 1 : v));

  for (let i = 0; i < items.length; i++) {
    const s = items[i];
    const i0 = clampIdx(Math.floor(s.min.x * inv));
    const i1 = clampIdx(Math.floor(s.max.x * inv));
    const k0 = clampIdx(Math.floor(s.min.z * inv));
    const k1 = clampIdx(Math.floor(s.max.z * inv));
    const span = (i1 - i0 + 1) * (k1 - k0 + 1);
    if (span > MAX_CELLS_PER_SHAPE) { always.push(s); continue; }
    for (let ix = i0; ix <= i1; ix++) {
      for (let iz = k0; iz <= k1; iz++) {
        const key = cellKey(ix, iz);
        let bucket = cells.get(key);
        if (!bucket) { bucket = []; cells.set(key, bucket); }
        bucket.push(i);
        if (bucket.length > maxBucket) maxBucket = bucket.length;
      }
    }
  }

  const stamp = new Int32Array(items.length);
  const state = { tick: 0 };

  function query(x, z, radius, out) {
    const list = out || [];
    list.length = 0;
    for (let i = 0; i < always.length; i++) list.push(always[i]);
    if (!items.length) return list;
    const rad = radius > 0 ? radius : 0;
    if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(rad)) return list;

    const i0 = clampIdx(Math.floor((x - rad) * inv));
    const i1 = clampIdx(Math.floor((x + rad) * inv));
    const k0 = clampIdx(Math.floor((z - rad) * inv));
    const k1 = clampIdx(Math.floor((z + rad) * inv));

    // Visit stamps dedupe shapes that straddle several cells.
    if (++state.tick >= 0x3fffffff) { stamp.fill(0); state.tick = 1; }
    const tick = state.tick;

    for (let ix = i0; ix <= i1; ix++) {
      for (let iz = k0; iz <= k1; iz++) {
        const bucket = cells.get(cellKey(ix, iz));
        if (!bucket) continue;
        for (let b = 0; b < bucket.length; b++) {
          const idx = bucket[b];
          if (stamp[idx] === tick) continue;
          stamp[idx] = tick;
          list.push(items[idx]);
        }
      }
    }
    return list;
  }

  return {
    query,
    cellSize: cs,
    shapes: items,
    itemCount: items.length,
    cellCount: cells.size,
    alwaysCount: always.length,
    maxBucket,
  };
}
