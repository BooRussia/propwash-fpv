// One Biscayne Bay water system — MeshPhysicalMaterial, no Water.js,
// no custom shader graph, no Abyssal paste, no open-ocean far plate.
//
// WebGPU / TSL is preferred when the app renderer is a WebGPURenderer;
// this map still boots on WebGLRenderer, so the hero material is a stock
// MeshPhysicalMaterial (the allowed "no custom mat" path). SSR stays off.
// Persist is STATE on the 512² foam field (Df/Dt = s(1-f) − f/τ).
// Shore foam is a BAND at SHORE_Z in that field — not a lofted strip / GLB.

import * as THREE from 'three';
import { BAY_PRESET, createBaySim } from './baySim.js';
import { SHORE_Z } from './constants.js';

export { BAY_PRESET };

// Existing Miami / Biscayne plane (grown, not replaced by a second ocean).
const BAY_W = 5000;
const BAY_D = 3600;
const BAY_X = 0;
const BAY_Z = -1700;
const BAY_Y = -0.18;

// Thin sit/splash volume: the plane the craft lands on, not a slab that
// fills a fly-under (MacArthur 20 m / Venetian west 3.7 m / Broad ~4.9 m).
const COLLIDER_H = 0.16;

const BAY_COLOR = 0x163a3c;     // muted bay teal — not Water.js 0x00404f, not abyssal grade

// Foam DataTexture covers the plate once (ClampToEdge, repeat 1,1).
// 256² / 19 m chop stays on normals + displacement — those may still tile.
const FOAM_N = 512;

// Reesy persist lock. Methods only — not Water Pro, not their ±80 m window.
export const FOAM_PERSIST = Object.freeze({
  crestStrength: 2.5,
  windwardStrength: 1.5,
  decayTime: 0.5,          // e-fold seconds
  columnLo: 0.025,         // φ (horizontal / crest height), metres
  columnHi: 0.09,
  shoreRange: 2.0,         // η−zb band at SHORE_Z, metres — not φ
});

// One Catmull-Rom rip: a seaward channel that cuts the SHORE_Z break.
// Control points are derived from the signed bay frame only
// (BAY_X, BAY_Z, BAY_W, BAY_D, SHORE_Z). Not a reserved cell.
export const RIP_CTRL = Object.freeze([
  Object.freeze({ x: BAY_X, y: 0, z: SHORE_Z }),
  Object.freeze({ x: BAY_X + BAY_W / 80, y: 0, z: SHORE_Z - BAY_D / 24 }),
  Object.freeze({ x: BAY_X - BAY_W / 100, y: 0, z: SHORE_Z - BAY_D / 10 }),
  Object.freeze({ x: BAY_X + BAY_W / 160, y: 0, z: SHORE_Z - BAY_D / 6 }),
]);

const RIP_HALF = BAY_D / 160;           // 22.5 m foam glow around the channel
const RIP_Z_END = RIP_CTRL[RIP_CTRL.length - 1].z;
const RIP_X_MIN = Math.min(...RIP_CTRL.map((p) => p.x)) - RIP_HALF * 2;
const RIP_X_MAX = Math.max(...RIP_CTRL.map((p) => p.x)) + RIP_HALF * 2;

function clamp01(v) {
  if (v <= 0) return 0;
  if (v >= 1) return 1;
  return v;
}

function smoothstep(a, b, x) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Df/Dt = s(1-f) − f/τ. Forward Euler, clamped. */
export function persistStep(f, s, dt) {
  const tau = FOAM_PERSIST.decayTime;
  let next = f + dt * (s * (1 - f) - f / tau);
  if (next < 0) return 0;
  if (next > 1) return 1;
  return next;
}

/** Integrate a persist field in place. */
export function stepPersistField(persist, source, dt) {
  for (let i = 0, n = persist.length; i < n; i++) {
    persist[i] = persistStep(persist[i], source[i] || 0, dt);
  }
}

// THREE.CatmullRomCurve3('catmullrom', tension 0.5) — same cubic, no three.
function catmullRom1(p0, p1, p2, p3, t) {
  const t0 = 0.5 * (p2 - p0);
  const t1 = 0.5 * (p3 - p1);
  const t2 = t * t;
  const t3 = t2 * t;
  return p1 + t0 * t + (-3 * p1 + 3 * p2 - 2 * t0 - t1) * t2
    + (2 * p1 - 2 * p2 + t0 + t1) * t3;
}

function catmullRomPoint(pts, t) {
  const segs = pts.length - 1;
  const ft = t * segs;
  let i = Math.floor(ft);
  if (i >= segs) i = segs - 1;
  if (i < 0) i = 0;
  const local = ft - i;
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p0 = i > 0 ? pts[i - 1] : {
    x: 2 * p1.x - p2.x, y: 2 * p1.y - p2.y, z: 2 * p1.z - p2.z,
  };
  const p3 = i + 2 < pts.length ? pts[i + 2] : {
    x: 2 * p2.x - p1.x, y: 2 * p2.y - p1.y, z: 2 * p2.z - p1.z,
  };
  return {
    x: catmullRom1(p0.x, p1.x, p2.x, p3.x, local),
    y: catmullRom1(p0.y, p1.y, p2.y, p3.y, local),
    z: catmullRom1(p0.z, p1.z, p2.z, p3.z, local),
  };
}

function buildRipPoly(n = 96) {
  const out = new Array(n + 1);
  for (let i = 0; i <= n; i++) out[i] = catmullRomPoint(RIP_CTRL, i / n);
  return out;
}

let ripPoly = null;
function getRipPoly() {
  if (!ripPoly) ripPoly = buildRipPoly(96);
  return ripPoly;
}

function distToRip(x, z, poly) {
  let best = Infinity;
  for (let i = 1; i < poly.length; i++) {
    const ax = poly[i - 1].x, az = poly[i - 1].z;
    const bx = poly[i].x, bz = poly[i].z;
    const dx = bx - ax, dz = bz - az;
    const l2 = dx * dx + dz * dz;
    let t = l2 > 1e-12 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const d = Math.hypot(x - (ax + t * dx), z - (az + t * dz));
    if (d < best) best = d;
  }
  return best;
}

/** Signed-frame seabed depth at z (waterline 0). Inland z>+0 is dry. */
function shoreDepth(z) {
  if (z > 0) return -1;
  if (z > SHORE_Z) return 0;
  const bed = Math.max(-6, -0.4 + (z - SHORE_Z) * 0.08);
  return -bed;
}

/** Column gate on φ (horizontal / crest height). Not η−zb. */
function columnGate(phi) {
  return smoothstep(FOAM_PERSIST.columnLo, FOAM_PERSIST.columnHi, phi);
}

/**
 * Shore foam BAND in the 512² field at SHORE_Z.
 * Gated by η−zb over ~2 m — not φ, not a lofted mesh / strip / GLB.
 */
export function shoreBandAt(z) {
  if (z > 0) return 0;
  const depth = shoreDepth(z);
  if (depth <= 0 || depth >= FOAM_PERSIST.shoreRange) return 0;
  return Math.sin(Math.PI * depth / FOAM_PERSIST.shoreRange);
}

/** Depth-break gate toward SHORE_Z. Zero on flats and inland of the dip. */
function depthBreakGate(z) {
  if (z > 0) return 0;
  const depth = shoreDepth(z);
  if (depth < 0.28 || depth > 3.4) return 0;
  return Math.sin(Math.PI * (depth - 0.28) / (3.4 - 0.28));
}

function ripMaskAt(x, z, poly) {
  if (z > 0) return 0;
  if (x < RIP_X_MIN || x > RIP_X_MAX) return 0;
  if (z < RIP_Z_END - 90) return 0;
  const d = distToRip(x, z, poly);
  const u = d / RIP_HALF;
  if (u >= 1.85) return 0;
  let m = Math.exp(-u * u * 2.4);
  if (z < RIP_Z_END) m *= clamp01(1 - (RIP_Z_END - z) / 80);
  if (z > SHORE_Z) m *= clamp01(1 - (z - SHORE_Z) / 12);
  return m;
}

function crestFromHeight(h) {
  return clamp01((h - 0.03) / 0.22);
}

/**
 * Extra foam TERM at a world XZ. Depth-break toward SHORE_Z plus the
 * one Catmull-Rom rip. Inland of z=0 is dry. Fold paint stays off.
 * Crest from sampleHeight only — no Voronoi / shore-pulse film extras.
 */
export function foamTermAt(x, z, height = 0, poly = getRipPoly()) {
  if (z > 0) return 0;
  const crest = crestFromHeight(height);
  const br = depthBreakGate(z);
  const rip = ripMaskAt(x, z, poly);
  const crash = br * (0.16 + 0.84 * crest) * (1 - 0.82 * rip);
  const outflow = rip * (0.40 + 0.48 * crest);
  const raw = crash + outflow;
  return raw > 1 ? 1 : raw;
}

function plateX(i, n) {
  return BAY_X + ((i + 0.5) / n - 0.5) * BAY_W;
}

function plateZ(j, n) {
  // PlaneGeometry UV v → localY; rotX -90 → world z = BAY_Z - localY
  return BAY_Z - ((j + 0.5) / n - 0.5) * BAY_D;
}

function encodeNormals(sim, out) {
  const { n, slopeX, slopeZ } = sim;
  // PlaneGeometry rotX -90: T=(1,0,0), B=(0,0,-1), N=(0,1,0).
  // world n = normalize(-sx, 1, -sz) = nx T + ny B + nz N
  // → tangent (nx, ny, nz) = (-sx, sz, 1) before normalize.
  let p = 0;
  for (let i = 0, N2 = n * n; i < N2; i++) {
    let nx = -slopeX[i];
    let ny = slopeZ[i];
    let nz = 1;
    const inv = 1 / Math.hypot(nx, ny, nz);
    nx = nx * inv * 0.5 + 0.5;
    ny = ny * inv * 0.5 + 0.5;
    nz = nz * inv * 0.5 + 0.5;
    out[p++] = nx * 255;
    out[p++] = ny * 255;
    out[p++] = nz * 255;
    out[p++] = 255;
  }
}

function encodeHeight(sim, heightBytes) {
  const { n, height } = sim;
  // mid-grey = rest height; ±0.45 m spans 0..1
  const hScale = 0.45;
  let p = 0;
  for (let i = 0, N2 = n * n; i < N2; i++) {
    let h = 0.5 + height[i] / (2 * hScale);
    if (h < 0) h = 0; else if (h > 1) h = 1;
    const hb = h * 255;
    heightBytes[p] = hb;
    heightBytes[p + 1] = hb;
    heightBytes[p + 2] = hb;
    heightBytes[p + 3] = 255;
    p += 4;
  }
}

/**
 * Plate-UV foam: #89 film is the source term s (depth-break + rip +
 * crest from sampleHeight). When `opts.persist` is set, integrate
 * Df/Dt = s(1-f) − f/τ on the 512² world-fixed field and write THAT.
 * No persist → write the film so existing encode probes stay honest.
 * Not the 19 m cascade. Not a lofted strip.
 */
export function encodeShoreFoam(sim, foamBytes, opts = {}) {
  const n = opts.n || FOAM_N;
  const poly = opts.ripPoly || getRipPoly();
  const t = opts.time != null ? opts.time
    : (sim && typeof sim.time === 'number' ? sim.time : 0);
  const persist = opts.persist;
  const dt = opts.dt != null ? opts.dt : 1 / 24;
  const sampleH = sim && typeof sim.sampleHeight === 'function'
    ? (x, z) => sim.sampleHeight(x, z)
    : () => 0;
  let p = 0;
  let idx = 0;
  for (let j = 0; j < n; j++) {
    const z = plateZ(j, n);
    for (let i = 0; i < n; i++) {
      const x = plateX(i, n);
      let film = 0;
      let height = 0;
      if (z <= 0) {
        const br = depthBreakGate(z);
        const nearRip = x >= RIP_X_MIN && x <= RIP_X_MAX
          && z >= RIP_Z_END - 90 && z <= SHORE_Z + 12;
        if (br > 0 || nearRip) {
          height = sampleH(x, z);
          film = foamTermAt(x, z, height, poly);
        }
      }
      let out = film;
      if (persist) {
        if (z > 0) {
          persist[idx] = 0;
          out = 0;
        } else {
          // s: #89 film × crest (φ) + shoreline band (η−zb). Surface off.
          // φ and η−zb are not interchangeable. Optional shore phase
          // rides the existing rip (not a restack of RIP_CTRL).
          const col = columnGate(height);
          const shore = shoreBandAt(z);
          const rip = ripMaskAt(x, z, poly);
          const phase = rip > 0 ? 0.65 + 0.35 * Math.sin(t * 1.4 + x * 0.04) : 1;
          const crestW = col > 0 ? col : (film > 0 ? 0.22 : 0);
          let s = film * FOAM_PERSIST.crestStrength * crestW
            + film * FOAM_PERSIST.windwardStrength * shore * phase;
          if (s > 1) s = 1;
          persist[idx] = persistStep(persist[idx], s, dt);
          out = persist[idx];
        }
      }
      // Floor kills the salt-and-pepper leftovers; honest breaks stay.
      const f = (out <= 0.05 ? 0 : (out - 0.05) / 0.95) * 255;
      foamBytes[p] = f;
      foamBytes[p + 1] = f;
      foamBytes[p + 2] = f;
      foamBytes[p + 3] = 255;
      p += 4;
      idx++;
    }
  }
}

function encodeHeightFoam(sim, heightBytes, foamBytes, opts) {
  encodeHeight(sim, heightBytes);
  encodeShoreFoam(sim, foamBytes, opts);
}

function makeDataTex(w, h, data, wrap) {
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = wrap;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = wrap === THREE.ClampToEdgeWrapping
    ? THREE.LinearFilter
    : THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = wrap !== THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function applyRepeat(tex, w, d, L) {
  tex.repeat.set(w / L, d / L);
}

/**
 * Build the single Biscayne mesh + CPU FFT sim.
 * Returns a handle with `.mesh`, `.update`, `.sampleHeight`, `.sim`.
 */
export function buildBayWater(ctx, opts = {}) {
  const { root, track } = ctx;
  const sim = createBaySim(opts);
  const n = sim.n;
  const L = sim.L;

  // One Catmull-Rom rip from the signed bay frame (THREE.CatmullRomCurve3).
  const ripCurve = new THREE.CatmullRomCurve3(
    RIP_CTRL.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
    false,
    'catmullrom',
    0.5,
  );
  const ripFromCurve = ripCurve.getSpacedPoints(96);
  ripPoly = ripFromCurve;

  const normalBytes = new Uint8Array(n * n * 4);
  const heightBytes = new Uint8Array(n * n * 4);
  const foamBytes = new Uint8Array(FOAM_N * FOAM_N * 4);
  const persist = new Float32Array(FOAM_N * FOAM_N);
  const STEP = 1 / 24;          // sim at 24 Hz — 256² FFT is cheap, not free
  encodeNormals(sim, normalBytes);
  encodeHeightFoam(sim, heightBytes, foamBytes, {
    n: FOAM_N, ripPoly: ripFromCurve, time: sim.time, persist, dt: STEP,
  });

  const normalMap = track(makeDataTex(n, n, normalBytes, THREE.RepeatWrapping));
  const displacementMap = track(makeDataTex(n, n, heightBytes, THREE.RepeatWrapping));
  const foamMap = track(makeDataTex(FOAM_N, FOAM_N, foamBytes, THREE.ClampToEdgeWrapping));
  applyRepeat(normalMap, BAY_W, BAY_D, L);
  applyRepeat(displacementMap, BAY_W, BAY_D, L);
  foamMap.repeat.set(1, 1);
  foamMap.offset.set(0, 0);

  // One plane: the existing Miami bay footprint. Not an open-ocean far grid.
  // Segments are coarse — the 19 m / 256² maps carry the 8–25 m chop.
  const geo = track(new THREE.PlaneGeometry(BAY_W, BAY_D, 160, 115));
  const mat = track(new THREE.MeshPhysicalMaterial({
    color: BAY_COLOR,
    roughness: 0.16,
    metalness: 0.04,
    ior: 1.333,
    specularIntensity: 0.55,
    envMapIntensity: 0.9,
    normalMap,
    normalScale: new THREE.Vector2(BAY_PRESET.scale, BAY_PRESET.scale),
    displacementMap,
    displacementScale: 0.22,
    displacementBias: -0.11,
    emissive: 0xf4f1ea,
    emissiveMap: foamMap,
    emissiveIntensity: 0.26,
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 2,
    fog: true,
  }));

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(BAY_X, BAY_Y, BAY_Z);
  mesh.renderOrder = -2;
  mesh.name = 'biscayne-bay';
  mesh.receiveShadow = true;
  mesh.userData.pwWater = true;
  mesh.userData.pwNoReflect = true;   // no planar reflector / SSR
  root.add(mesh);

  // Sit/splash plane is groundHeight's water clamp (y = 0), a surface, not a
  // bag AABB. A 5 km box here would sit under the city and fill fly-unders
  // (MacArthur 20 m / Venetian west 3.7 m / Broad ~4.9 m). Collider ⊆ visual:
  // the craft sits on the waterline plane, which is inside this mesh.

  const colorDay = new THREE.Color(BAY_COLOR);
  const colorNight = new THREE.Color(0x061114);
  let lastDayF = -1;

  const tint = (tod) => {
    const dayF = Math.max(0.04, Math.sin(Math.PI * clamp01((tod - 6.2) / 13.2)));
    if (Math.abs(dayF - lastDayF) < 0.008) return dayF;
    lastDayF = dayF;
    mat.color.copy(colorNight).lerp(colorDay, 0.12 + 0.88 * dayF);
    mat.envMapIntensity = 0.22 + 0.68 * dayF;
    mat.emissiveIntensity = 0.06 + 0.20 * dayF;
    mat.roughness = 0.14 + 0.16 * (1 - dayF);
    return dayF;
  };

  let acc = 0;

  const update = (dt, extras = {}) => {
    const tod = extras.timeOfDay;
    if (tod != null) tint(tod);
    acc += Math.max(0, dt);
    let stepped = false;
    while (acc >= STEP) {
      acc -= STEP;
      sim.step(STEP);
      stepped = true;
    }
    const boats = extras.boats;
    if (boats) {
      for (let i = 0; i < boats.length; i++) {
        const b = boats[i];
        if (!b || !b.position) continue;
        // Hull stamp only — do not move the reserved-corridor placer.
        sim.stampWake(b.position.x, b.position.z, 0.055 * Math.min(dt, 0.08) * 60, 1.8);
      }
    }
    if (stepped) {
      encodeNormals(sim, normalBytes);
      encodeHeightFoam(sim, heightBytes, foamBytes, {
        n: FOAM_N, ripPoly: ripFromCurve, time: sim.time, persist, dt: STEP,
      });
      normalMap.needsUpdate = true;
      displacementMap.needsUpdate = true;
      foamMap.needsUpdate = true;
    }
  };

  return {
    mesh,
    material: mat,
    sim,
    update,
    sampleHeight: (x, z) => BAY_Y + sim.sampleHeight(x, z),
    // Water.js leftover: nothing here has `.uniforms`
    n: sim.n,
    cascadeM: sim.L,
    cascades: sim.cascades,
    ssr: false,
  };
}

export const BAY_PLANE = Object.freeze({
  w: BAY_W, d: BAY_D, x: BAY_X, y: BAY_Y, z: BAY_Z,
  // wet sit-plane (groundHeight clamp), not a bag slab
  wetZ1: SHORE_Z,
  colliderH: COLLIDER_H,
  foamN: FOAM_N,
});

export { FOAM_N, encodeHeightFoam };
