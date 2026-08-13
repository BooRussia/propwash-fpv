// ============================================================
// PropWash FPV — collider (hitbox) visualiser
//
// Draws every world collider as a wireframe in its TRUE shape, so you can
// look at a railing and see whether its hitbox is a railing or a wall. This
// is the ground truth check for "does the collision match the art" — if the
// green tube does not sit on the pole, the pole's collider is wrong.
//
// Cost: ONE merged THREE.LineSegments per shape type — eight draw calls for
// the whole map, however many thousands of colliders it holds. Geometry is
// built only inside setColliders(); update() does no geometry work at all
// beyond a small vertex rewrite when the NEAREST collider changes.
//
// The collider nearest the airframe is drawn separately in red, on top of
// everything (depthTest off), with its type and exact surface distance
// printed in a corner readout — that is the number you are threading.
//
// WIRING — see the header of js/core/collision.js for shape semantics:
//
//   import { ColliderDebug } from './ui/colliderDebug.js';
//   const colliderDebug = new ColliderDebug(scene);
//   // after every map load / rebuild:
//   colliderDebug.setColliders(mapHandle ? mapHandle.colliders : null);
//   // in the render loop, after physics:
//   colliderDebug.update(quad.position);
//   // hotkey (KeyH is free) + persisted flag settings.debug.hitboxes:
//   on('hotkey:hitbox', () => { settings.debug.hitboxes = colliderDebug.toggle(); saveSettings(); });
//   // and on dispose / map teardown: colliderDebug.dispose();
// ============================================================

import * as THREE from 'three';
import { buildGrid, distanceToShape, shapeType } from '../core/collision.js';

// ---- palette: one colour per shape type, all readable against sky and sand
const TYPE_COLOR = {
  aabb:     0x35d2ff,   // cyan     — world-axis box
  obb:      0xa97bff,   // violet   — yaw-rotated box
  cyl:      0x4ade80,   // green    — Y cylinder
  sphere:   0xffd166,   // amber    — ball
  capsule:  0xff8a3d,   // orange   — pole / cable / rail
  torus:    0xff5c8a,   // pink     — round-tube ring (open hole)
  ring:     0xff3ddc,   // magenta  — square-section ring (open hole)
  compound: 0xe6ecf2,   // white    — multi-part object
};
const TYPE_ORDER = ['aabb', 'obb', 'cyl', 'sphere', 'capsule', 'torus', 'ring', 'compound'];
const HIGHLIGHT_COLOR = 0xff2b2b;

// Wireframe detail tiers. A map with a handful of colliders gets smooth
// circles; a map with thousands gets coarse ones and still costs one draw
// call per type. `sec` is the number of cross-sections drawn around a ring.
const TIERS = [
  { circle: 24, sec: 8, caps: true },
  { circle: 12, sec: 4, caps: true },
  { circle: 8,  sec: 0, caps: false },
];
const DEFAULT_SEGMENT_BUDGET = 180000;   // line segments across the whole map
const HL_MAX_SEGMENTS = 4000;            // preallocated highlight buffer
const MAX_DEPTH = 4;                     // compound nesting guard

// Nearest-collider search: expanding XZ query radii. A hit closer than the
// radius that found it is provably the global nearest, so we can stop early.
// Beyond the last radius we fall back to a linear scan — cheaper than asking
// the hash for a 400 m disc, which on a 3 m cell is 17k bucket lookups.
const SEARCH_RADII = [6, 24, 96];
const NEAR_TRACK_DIST = 25;              // re-search every frame inside this
const FAR_SEARCH_EVERY = 6;              // ...and every Nth frame outside it

const PANEL_ID = 'pw-hitbox-style';
const PANEL_CSS = `
.pw-hitbox {
  position: absolute; left: 4.5%; bottom: 13%;
  font-family: var(--pw-mono, "Consolas", "Cascadia Mono", monospace);
  font-size: 12px; line-height: 1.5; letter-spacing: 1px;
  text-transform: uppercase; color: #fff; pointer-events: none;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  white-space: pre-wrap;
  max-width: 46ch;
}
.pw-hitbox .pw-hb-title { color: #ff2b2b; font-weight: 700; letter-spacing: 2px; }
.pw-hitbox .pw-hb-near { color: #ffd166; }
.pw-hitbox .pw-hb-dim { opacity: 0.7; }
`;

function ensureStyle() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(PANEL_ID)) return;
  const el = document.createElement('style');
  el.id = PANEL_ID;
  el.textContent = PANEL_CSS;
  document.head.appendChild(el);
}

// ------------------------------------------------------------
// wireframe emitters — every one writes flat x,y,z triples of LINE SEGMENTS
// (pairs of vertices) into a plain number array
// ------------------------------------------------------------

function seg(a, x0, y0, z0, x1, y1, z1) {
  a.push(x0, y0, z0, x1, y1, z1);
}

/** Closed circle of radius r at c, spanned by orthonormal in-plane axes u,v. */
function circle(a, cx, cy, cz, ux, uy, uz, vx, vy, vz, r, n) {
  if (!(r > 0) || n < 3) return;
  let px = cx + ux * r, py = cy + uy * r, pz = cz + uz * r;
  const step = (Math.PI * 2) / n;
  for (let i = 1; i <= n; i++) {
    const t = i * step;
    const c = Math.cos(t) * r, s = Math.sin(t) * r;
    const qx = cx + ux * c + vx * s;
    const qy = cy + uy * c + vy * s;
    const qz = cz + uz * c + vz * s;
    seg(a, px, py, pz, qx, qy, qz);
    px = qx; py = qy; pz = qz;
  }
}

/** Open arc from angle a0 to a1 (radians) in the u,v plane. */
function arc(a, cx, cy, cz, ux, uy, uz, vx, vy, vz, r, a0, a1, n) {
  if (!(r > 0) || n < 1) return;
  const step = (a1 - a0) / n;
  let px = cx + ux * Math.cos(a0) * r + vx * Math.sin(a0) * r;
  let py = cy + uy * Math.cos(a0) * r + vy * Math.sin(a0) * r;
  let pz = cz + uz * Math.cos(a0) * r + vz * Math.sin(a0) * r;
  for (let i = 1; i <= n; i++) {
    const t = a0 + step * i;
    const c = Math.cos(t) * r, s = Math.sin(t) * r;
    const qx = cx + ux * c + vx * s;
    const qy = cy + uy * c + vy * s;
    const qz = cz + uz * c + vz * s;
    seg(a, px, py, pz, qx, qy, qz);
    px = qx; py = qy; pz = qz;
  }
}

/** 12 edges of a box given its centre and three (half-extent) edge vectors. */
function boxEdges(a, cx, cy, cz, xx, xy, xz, yx, yy, yz, zx, zy, zz) {
  const px = [], py = [], pz = [];
  for (let i = 0; i < 8; i++) {
    const sx = (i & 1) ? 1 : -1;
    const sy = (i & 2) ? 1 : -1;
    const sz = (i & 4) ? 1 : -1;
    px.push(cx + xx * sx + yx * sy + zx * sz);
    py.push(cy + xy * sx + yy * sy + zy * sz);
    pz.push(cz + xz * sx + yz * sy + zz * sz);
  }
  // pairs of corner indices that differ in exactly one sign bit
  const E = [0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7];
  for (let i = 0; i < E.length; i += 2) {
    const p = E[i], q = E[i + 1];
    seg(a, px[p], py[p], pz[p], px[q], py[q], pz[q]);
  }
}

/** Any unit vector perpendicular to (dx,dy,dz). */
function perp(dx, dy, dz, out) {
  const ax = Math.abs(dx), ay = Math.abs(dy), az = Math.abs(dz);
  let ux, uy, uz;
  if (ax <= ay && ax <= az) { ux = 0; uy = -dz; uz = dy; }
  else if (ay <= az) { ux = -dz; uy = 0; uz = dx; }
  else { ux = -dy; uy = dx; uz = 0; }
  const l = Math.sqrt(ux * ux + uy * uy + uz * uz);
  if (!(l > 1e-9)) { out[0] = 1; out[1] = 0; out[2] = 0; return; }
  out[0] = ux / l; out[1] = uy / l; out[2] = uz / l;
}

const _u = [0, 0, 0];
const _v = [0, 0, 0];

function emitAabb(a, s) {
  const mn = s.min, mx = s.max;
  boxEdges(a,
    (mn.x + mx.x) * 0.5, (mn.y + mx.y) * 0.5, (mn.z + mx.z) * 0.5,
    (mx.x - mn.x) * 0.5, 0, 0,
    0, (mx.y - mn.y) * 0.5, 0,
    0, 0, (mx.z - mn.z) * 0.5);
}

function emitObb(a, s) {
  // three.js rotateY: local +X -> (cos,0,-sin), local +Z -> (sin,0,cos)
  boxEdges(a, s.cx, s.cy, s.cz,
    s.cos * s.hx, 0, -s.sin * s.hx,
    0, s.hy, 0,
    s.sin * s.hz, 0, s.cos * s.hz);
}

function emitCyl(a, s, t) {
  const n = t.circle;
  circle(a, s.cx, s.y0, s.cz, 1, 0, 0, 0, 0, 1, s.r, n);
  circle(a, s.cx, s.y1, s.cz, 1, 0, 0, 0, 0, 1, s.r, n);
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2;
    const x = s.cx + Math.cos(ang) * s.r;
    const z = s.cz + Math.sin(ang) * s.r;
    seg(a, x, s.y0, z, x, s.y1, z);
  }
}

function emitSphere(a, s, t) {
  const n = t.circle;
  circle(a, s.cx, s.cy, s.cz, 1, 0, 0, 0, 1, 0, s.r, n);
  circle(a, s.cx, s.cy, s.cz, 1, 0, 0, 0, 0, 1, s.r, n);
  circle(a, s.cx, s.cy, s.cz, 0, 1, 0, 0, 0, 1, s.r, n);
}

function emitCapsule(a, s, t) {
  const n = t.circle;
  const len = Math.sqrt(s.len2);
  if (!(len > 1e-6)) { emitSphere(a, { cx: s.ax, cy: s.ay, cz: s.az, r: s.r }, t); return; }
  const ax = s.dx / len, ay = s.dy / len, az = s.dz / len;
  perp(ax, ay, az, _u);
  // v = axis x u  (completes a right-handed frame)
  _v[0] = ay * _u[2] - az * _u[1];
  _v[1] = az * _u[0] - ax * _u[2];
  _v[2] = ax * _u[1] - ay * _u[0];
  circle(a, s.ax, s.ay, s.az, _u[0], _u[1], _u[2], _v[0], _v[1], _v[2], s.r, n);
  circle(a, s.bx, s.by, s.bz, _u[0], _u[1], _u[2], _v[0], _v[1], _v[2], s.r, n);
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2;
    const c = Math.cos(ang) * s.r, sn = Math.sin(ang) * s.r;
    const ox = _u[0] * c + _v[0] * sn;
    const oy = _u[1] * c + _v[1] * sn;
    const oz = _u[2] * c + _v[2] * sn;
    seg(a, s.ax + ox, s.ay + oy, s.az + oz, s.bx + ox, s.by + oy, s.bz + oz);
  }
  if (!t.caps) return;
  const half = Math.max(2, n >> 1);
  // end caps: two half-arcs bulging past each endpoint along the axis
  arc(a, s.ax, s.ay, s.az, _u[0], _u[1], _u[2], -ax, -ay, -az, s.r, 0, Math.PI, half);
  arc(a, s.ax, s.ay, s.az, _v[0], _v[1], _v[2], -ax, -ay, -az, s.r, 0, Math.PI, half);
  arc(a, s.bx, s.by, s.bz, _u[0], _u[1], _u[2], ax, ay, az, s.r, 0, Math.PI, half);
  arc(a, s.bx, s.by, s.bz, _v[0], _v[1], _v[2], ax, ay, az, s.r, 0, Math.PI, half);
}

/** Shared ring frame: in-plane axes u,v perpendicular to the ring axis. */
function ringFrame(s) {
  perp(s.nx, s.ny, s.nz, _u);
  _v[0] = s.ny * _u[2] - s.nz * _u[1];
  _v[1] = s.nz * _u[0] - s.nx * _u[2];
  _v[2] = s.nx * _u[1] - s.ny * _u[0];
}

function emitTorus(a, s, t) {
  const n = t.circle;
  ringFrame(s);
  const ux = _u[0], uy = _u[1], uz = _u[2];
  const vx = _v[0], vy = _v[1], vz = _v[2];
  // outer / inner silhouette in the ring plane, plus the two side profiles
  circle(a, s.cx, s.cy, s.cz, ux, uy, uz, vx, vy, vz, s.R + s.r, n);
  if (s.R - s.r > 1e-4) circle(a, s.cx, s.cy, s.cz, ux, uy, uz, vx, vy, vz, s.R - s.r, n);
  circle(a, s.cx + s.nx * s.r, s.cy + s.ny * s.r, s.cz + s.nz * s.r, ux, uy, uz, vx, vy, vz, s.R, n);
  circle(a, s.cx - s.nx * s.r, s.cy - s.ny * s.r, s.cz - s.nz * s.r, ux, uy, uz, vx, vy, vz, s.R, n);
  const sec = t.sec;
  for (let i = 0; i < sec; i++) {
    const ang = (i / sec) * Math.PI * 2;
    const c = Math.cos(ang), sn = Math.sin(ang);
    const wx = ux * c + vx * sn, wy = uy * c + vy * sn, wz = uz * c + vz * sn;
    circle(a, s.cx + wx * s.R, s.cy + wy * s.R, s.cz + wz * s.R,
      wx, wy, wz, s.nx, s.ny, s.nz, s.r, Math.max(6, n >> 1));
  }
}

function emitRing(a, s, t) {
  const n = t.circle;
  ringFrame(s);
  const ux = _u[0], uy = _u[1], uz = _u[2];
  const vx = _v[0], vy = _v[1], vz = _v[2];
  const rIn = Math.max(0, s.R - s.hw), rOut = s.R + s.hw;
  for (let k = -1; k <= 1; k += 2) {
    const ox = s.cx + s.nx * s.ht * k;
    const oy = s.cy + s.ny * s.ht * k;
    const oz = s.cz + s.nz * s.ht * k;
    circle(a, ox, oy, oz, ux, uy, uz, vx, vy, vz, rOut, n);
    if (rIn > 1e-4) circle(a, ox, oy, oz, ux, uy, uz, vx, vy, vz, rIn, n);
  }
  const sec = Math.max(4, t.sec);
  for (let i = 0; i < sec; i++) {
    const ang = (i / sec) * Math.PI * 2;
    const c = Math.cos(ang), sn = Math.sin(ang);
    const wx = ux * c + vx * sn, wy = uy * c + vy * sn, wz = uz * c + vz * sn;
    // rectangular cross-section: 4 edges in the (radial, axis) plane
    const cx = s.cx + wx * s.R, cy = s.cy + wy * s.R, cz = s.cz + wz * s.R;
    const p = [];
    for (let q = 0; q < 4; q++) {
      const su = (q === 0 || q === 3) ? 1 : -1;
      const sh = (q < 2) ? 1 : -1;
      p.push(
        cx + wx * s.hw * su + s.nx * s.ht * sh,
        cy + wy * s.hw * su + s.ny * s.ht * sh,
        cz + wz * s.hw * su + s.nz * s.ht * sh);
    }
    for (let q = 0; q < 4; q++) {
      const r0 = q * 3, r1 = ((q + 1) % 4) * 3;
      seg(a, p[r0], p[r0 + 1], p[r0 + 2], p[r1], p[r1 + 1], p[r1 + 2]);
    }
  }
}

/** Dispatch one shape into the number array `a`. Compounds recurse. */
function emitShape(a, s, t, depth) {
  const type = shapeType(s);
  if (!type) return;
  if (type === 'compound') {
    if (depth >= MAX_DEPTH || !Array.isArray(s.parts)) return;
    for (let i = 0; i < s.parts.length; i++) emitShape(a, s.parts[i], t, depth + 1);
    return;
  }
  if (type === 'cyl') return emitCyl(a, s, t);
  if (type === 'obb') return emitObb(a, s, t);
  if (type === 'sphere') return emitSphere(a, s, t);
  if (type === 'capsule') return emitCapsule(a, s, t);
  if (type === 'torus') return emitTorus(a, s, t);
  if (type === 'ring') return emitRing(a, s, t);
  return emitAabb(a, s);
}

/** Rough segment cost of a shape at a given tier — used to pick the tier. */
function estimateSegments(s, t, depth) {
  const type = shapeType(s);
  if (!type) return 0;
  const n = t.circle;
  switch (type) {
    case 'aabb': case 'obb': return 12;
    case 'cyl': return 2 * n + 4;
    case 'sphere': return 3 * n;
    case 'capsule': return 2 * n + 4 + (t.caps ? 4 * Math.max(2, n >> 1) : 0);
    case 'torus': return 4 * n + t.sec * Math.max(6, n >> 1);
    case 'ring': return 4 * n + Math.max(4, t.sec) * 4;
    case 'compound': {
      if (depth >= MAX_DEPTH || !Array.isArray(s.parts)) return 0;
      let sum = 0;
      for (let i = 0; i < s.parts.length; i++) sum += estimateSegments(s.parts[i], t, depth + 1);
      return sum;
    }
    default: return 12;
  }
}

// ------------------------------------------------------------

export class ColliderDebug {
  /**
   * @param {THREE.Scene} scene
   * @param {object} [opts]
   * @param {number} [opts.segmentBudget=180000] hard cap on drawn line segments
   * @param {number} [opts.opacity=0.7]          bulk wireframe opacity
   * @param {boolean}[opts.panel=true]           show the corner readout
   * @param {HTMLElement}[opts.panelParent]      defaults to #osd-root, else body
   */
  constructor(scene, opts = {}) {
    this.scene = scene || null;
    this.budget = Math.max(1000, opts.segmentBudget || DEFAULT_SEGMENT_BUDGET);
    this.opacity = opts.opacity != null ? opts.opacity : 0.7;

    this.group = new THREE.Group();
    this.group.name = 'ColliderDebug';
    this.group.visible = false;
    this.group.renderOrder = 998;
    this.group.frustumCulled = false;
    if (this.scene) this.scene.add(this.group);

    this._visible = false;
    this._colliders = null;
    this._grid = null;
    this._proxies = null;        // one {min,max,i} per SOURCE collider (compounds intact)
    this._query = [];            // reused broadphase result
    this._meshes = new Map();    // type -> LineSegments
    this._frame = -1;
    this._nearest = null;
    this._nearestDist = Infinity;
    this._nearestType = '';
    this._lastText = '';
    this._tier = 0;

    /** Public counts, refreshed by setColliders(). */
    this.stats = { source: 0, drawn: 0, segments: 0, byType: {}, tier: 0, skipped: 0, buildMs: 0 };

    // highlight: preallocated, rewritten only when the nearest collider changes
    const hlGeo = new THREE.BufferGeometry();
    hlGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(HL_MAX_SEGMENTS * 6), 3));
    hlGeo.setDrawRange(0, 0);
    hlGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e7);  // never culled out
    this._hlGeo = hlGeo;
    this._hlMat = new THREE.LineBasicMaterial({
      color: HIGHLIGHT_COLOR, transparent: true, opacity: 1,
      depthTest: false, depthWrite: false, fog: false, toneMapped: false,
    });
    this._hl = new THREE.LineSegments(hlGeo, this._hlMat);
    this._hl.renderOrder = 999;
    this._hl.frustumCulled = false;
    this._hl.visible = false;
    this.group.add(this._hl);
    this._hlScratch = [];

    // ---- readout ----
    this._panelEl = null;
    if (opts.panel !== false && typeof document !== 'undefined') {
      ensureStyle();
      const parent = opts.panelParent || document.getElementById('osd-root') || document.body;
      const el = document.createElement('div');
      el.className = 'pw-hitbox';
      el.style.display = 'none';
      parent.appendChild(el);
      this._panelEl = el;
      this._panelParent = parent;
    }
  }

  get visible() { return this._visible; }

  /** @returns {boolean} the new visibility (handy for persisting a settings flag). */
  toggle() { this.setVisible(!this._visible); return this._visible; }

  setVisible(v) {
    const on = !!v;
    if (on === this._visible) return;
    this._visible = on;
    this.group.visible = on;
    if (this._panelEl) this._panelEl.style.display = on ? 'block' : 'none';
    if (!on) {
      this._nearest = null;
      this._nearestDist = Infinity;
      this._hl.visible = false;
      this._lastText = '';
    }
  }

  /**
   * Rebuild every wireframe. THE ONLY place geometry is created — call it
   * once after a map load (or whenever a map mutates its collider bag).
   * Passing null/[] clears the display.
   * @param {Array} colliders  the map's collider array (js/core/collision.js shapes)
   */
  setColliders(colliders) {
    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
    this._clearMeshes();
    this._colliders = Array.isArray(colliders) ? colliders : null;
    this._grid = null;
    this._proxies = null;
    this._nearest = null;
    this._nearestDist = Infinity;
    this._hl.visible = false;
    this._hlGeo.setDrawRange(0, 0);
    this._lastText = '';
    this.stats = { source: 0, drawn: 0, segments: 0, byType: {}, tier: 0, skipped: 0, buildMs: 0 };

    const src = this._colliders;
    if (!src || !src.length) return;

    // ---- pick a detail tier that fits the segment budget ----
    let tier = TIERS[0];
    let tierIdx = 0;
    for (let i = 0; i < TIERS.length; i++) {
      let est = 0;
      for (let k = 0; k < src.length; k++) {
        est += estimateSegments(src[k], TIERS[i], 0);
        if (est > this.budget) break;
      }
      tier = TIERS[i];
      tierIdx = i;
      if (est <= this.budget) break;
    }
    this._tier = tierIdx;

    // ---- emit ----
    const buckets = new Map();
    const byType = {};                       // SOURCE collider count per type
    const segByType = {};                    // drawn line segments per type
    let total = 0;
    let drawn = 0;
    let skipped = 0;
    for (let i = 0; i < src.length; i++) {
      const s = src[i];
      const type = shapeType(s);
      if (!type) continue;
      byType[type] = (byType[type] || 0) + 1;
      if (total >= this.budget) { skipped++; continue; }
      let arr = buckets.get(type);
      if (!arr) { arr = []; buckets.set(type, arr); }
      const before = arr.length;
      emitShape(arr, s, tier, 0);
      total += (arr.length - before) / 6;
      drawn++;
    }

    for (const type of TYPE_ORDER) {
      const arr = buckets.get(type);
      if (!arr || !arr.length) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
      geo.computeBoundingSphere();
      const mat = new THREE.LineBasicMaterial({
        color: TYPE_COLOR[type],
        transparent: true,
        opacity: this.opacity,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      });
      const mesh = new THREE.LineSegments(geo, mat);
      mesh.name = `ColliderDebug:${type}`;
      mesh.renderOrder = 998;
      this.group.add(mesh);
      this._meshes.set(type, mesh);
      segByType[type] = arr.length / 6;
    }

    // ---- broadphase for the nearest-collider search ----
    // Proxies keep compounds INTACT (buildGrid would flatten them, and the
    // pilot wants "the pier", not "pylon 7"), while still giving buildGrid
    // the {min,max} it indexes on.
    const proxies = new Array(src.length);
    let np = 0;
    for (let i = 0; i < src.length; i++) {
      const s = src[i];
      if (!s || !s.min || !s.max) continue;
      if (!Number.isFinite(s.min.x + s.min.y + s.min.z + s.max.x + s.max.y + s.max.z)) continue;
      proxies[np++] = { min: s.min, max: s.max, shape: s };
    }
    proxies.length = np;
    this._proxies = proxies;
    this._grid = np ? buildGrid(proxies) : null;

    const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
    this.stats = {
      source: src.length,
      drawn,
      segments: total,
      byType,
      segByType,
      tier: tierIdx,
      skipped,
      buildMs: t1 - t0,
    };
    this._frame = -1;              // search on the very next update()
  }

  /**
   * Per-frame: find the collider nearest the airframe, highlight it, print
   * the distance. No geometry work unless the nearest collider CHANGED.
   * Safe to call when hidden (returns immediately).
   * @param {{x,y,z}} dronePos
   */
  update(dronePos) {
    if (!this._visible || !dronePos) return;
    if (!Number.isFinite(dronePos.x + dronePos.y + dronePos.z)) return;
    this._frame++;

    // Throttle the wide search: close to structure we track every frame, out
    // over open water there is nothing to thread and 10 Hz is plenty.
    const far = !(this._nearestDist < NEAR_TRACK_DIST);
    if (far && (this._frame % FAR_SEARCH_EVERY) !== 0) { this._writePanel(); return; }

    let best = null;
    let bestD = Infinity;
    const grid = this._grid;
    if (grid) {
      for (let i = 0; i < SEARCH_RADII.length; i++) {
        const rad = SEARCH_RADII[i];
        const list = grid.query(dronePos.x, dronePos.z, rad, this._query);
        for (let k = 0; k < list.length; k++) {
          const shape = list[k].shape;
          const d = distanceToShape(shape, dronePos);
          if (d < bestD) { bestD = d; best = shape; }
        }
        // A hit closer than the radius that produced it is the global nearest.
        if (best && bestD <= rad) break;
        best = null; bestD = Infinity;      // outside the query disc: not trustworthy
      }
    }
    if (!best && this._proxies) {           // nothing within the widest disc
      const px = this._proxies;
      for (let i = 0; i < px.length; i++) {
        const d = distanceToShape(px[i].shape, dronePos);
        if (d < bestD) { bestD = d; best = px[i].shape; }
      }
    }

    if (best !== this._nearest) {
      this._nearest = best;
      this._nearestType = best ? (shapeType(best) || '?') : '';
      this._rebuildHighlight(best);
    }
    this._nearestDist = bestD;
    this._writePanel();
  }

  /** Remove everything this instance added. */
  dispose() {
    this._clearMeshes();
    if (this._hlGeo) this._hlGeo.dispose();
    if (this._hlMat) this._hlMat.dispose();
    if (this.group.parent) this.group.parent.remove(this.group);
    this.group.clear();
    if (this._panelEl && this._panelEl.parentNode) this._panelEl.parentNode.removeChild(this._panelEl);
    this._panelEl = null;
    this._colliders = null;
    this._grid = null;
    this._proxies = null;
    this._nearest = null;
    this._query.length = 0;
    this._hlScratch.length = 0;
    this.scene = null;
  }

  // ---------------- internals ----------------

  _clearMeshes() {
    for (const mesh of this._meshes.values()) {
      this.group.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this._meshes.clear();
  }

  _rebuildHighlight(shape) {
    const geo = this._hlGeo;
    if (!shape) { geo.setDrawRange(0, 0); this._hl.visible = false; return; }
    const a = this._hlScratch;
    a.length = 0;
    emitShape(a, shape, TIERS[0], 0);          // always full detail — it is one shape
    const attr = geo.getAttribute('position');
    const cap = Math.min(a.length, attr.array.length);
    attr.array.set(cap === a.length ? a : a.slice(0, cap));
    // Upload only the slice we wrote — the nearest collider changes often at
    // speed and re-sending the whole 288 KB buffer each time is pure waste.
    if (typeof attr.clearUpdateRanges === 'function' && typeof attr.addUpdateRange === 'function') {
      attr.clearUpdateRanges();
      attr.addUpdateRange(0, cap);
    }
    attr.needsUpdate = true;
    geo.setDrawRange(0, cap / 3);
    this._hl.visible = cap > 0;
  }

  _writePanel() {
    const el = this._panelEl;
    if (!el) return;
    const st = this.stats;
    let txt = 'HITBOX VIEW  ON\n';
    if (this._nearest && Number.isFinite(this._nearestDist)) {
      const d = this._nearestDist;
      const label = d < 0
        ? `INSIDE ${(-d).toFixed(3)} M`
        : `${d.toFixed(3)} M`;
      txt += `NEAREST  ${this._nearestType.toUpperCase().padEnd(8)} ${label}\n`;
    } else {
      txt += 'NEAREST  —\n';
    }
    const parts = [];
    for (const type of TYPE_ORDER) {
      const n = st.byType ? st.byType[type] : 0;
      if (n) parts.push(`${type}:${n}`);
    }
    txt += `COLLIDERS ${st.source}  SEG ${Math.round(st.segments)}`;
    if (st.skipped) txt += `  (+${st.skipped} OVER BUDGET)`;
    if (parts.length) txt += `\n${parts.join('  ')}`;
    if (txt === this._lastText) return;
    this._lastText = txt;
    el.textContent = txt;
  }
}

export { TYPE_COLOR as COLLIDER_DEBUG_COLORS };
