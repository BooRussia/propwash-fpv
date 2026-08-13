// ============================================================
// PropWash FPV — vegetation
// Hero coconut palms, instanced palm fields with distance LODs,
// GLTF photoscan scattering with distance culling, and a reusable
// wind-sway shader helper.
//
// Public API (consumed by miami.js / procedural.js):
//   buildPalm(rng)                              -> Promise<THREE.Group> (hero palm, origin at trunk base)
//   createPalms(count)                          -> { group, placeAt, finalize, update, dispose }
//   scatterModels(scene, slug, placements,
//                 colliderList, colliderSize)   -> { group, dispose } | null
//   windSwayMaterial(mat, clock)                -> mat (sway shader injected)
//   beginReflectionPass() / endReflectionPass() / reflectionSetExclusions(list)
//                                               (used by miami/terrain.js)
//
// Palms are built from REAL geometry (no alpha-card fronds):
//   - trunk: ringed tube along an S-curved spine with leaf-scar ridge
//     rings, a flared base and a fiber collar bulge at the top that
//     hides the frond attachment points. bark_palm PBR (the source
//     albedo is olive/khaki, so it is tinted toward warm grey-brown);
//     plain #8a7055 fallback when assets/ is empty.
//   - crown: 13-17 pinnate fronds — each an arched tapering rachis
//     carrying 26-34 leaflet pairs as wide overlapping quads folded
//     into a neat V — plus 3-5 dead fronds hanging against the trunk,
//     a central spear leaf and a few coconuts, all merged into ONE
//     vertex-coloured BufferGeometry (one draw call per crown,
//     ~6k tris, shared/instanced).
//
// ---- Instanced palm LOD (the field only; hero palms are never LODed) ----
//   LOD0  d <  PALM_LOD_NEAR   full trunk (1728 t) + full crown (6060 t)
//                              — bit-identical to the pre-LOD palm.
//   LOD1  d <  PALM_LOD_MID    6-sided 24-ring trunk (288 t) + a crown
//                              rebuilt from the SAME rng stream with 1/3
//                              of the leaflet pairs, widened to keep the
//                              same coverage (~1.8 k t). Frond azimuths,
//                              pitches, lengths and colours match LOD0
//                              exactly, so the switch is a silent one.
//   LOD2  else                 4-sided 6-ring trunk (48 t) + a 12-triangle
//                              crossed-quad "star" crown wearing a texture
//                              baked from the LOD0 crown geometry itself
//                              (side + top view atlas, painter-sorted,
//                              vertex colours preserved).
//   Instances live in three InstancedMeshes per level and are re-bucketed
//   from a throttled (0.25 s) pass driven off scene.onBeforeRender, moving
//   ONLY the instances whose band actually changed (O(1) swap-remove).
//   Nothing but a handful of float compares happens on a normal frame.
//
// Everything degrades gracefully when assets/ is empty (the crown
// needs no textures at all). Shared geometry/material caches live at
// module level and are NEVER freed by per-call dispose() functions.
// ============================================================

import * as THREE from 'three';
import { assetLib } from '../core/assets.js';
import { settings } from '../core/state.js';

// ---------------- tunables ----------------
const SWAY_AMPLITUDE = 0.02;         // m of sway per m of height above instance origin
const SHADOW_INSTANCE_LIMIT = 24;    // instanced sets at/below this cast shadows
const COLLIDER_LIMIT = 60;           // max AABBs pushed by scatterModels
const DEG2RAD = Math.PI / 180;

const TRUNK_TINT = 0xccb29b;         // multiplies the olive bark albedo -> warm grey-brown
const TRUNK_FALLBACK = 0x8a7055;     // texture-free fallback bark colour

// crown palette (sRGB hex — THREE converts to linear internally)
const LEAF_BASE = 0x2f6b2a;          // rich mid green
const LEAF_DEEP = 0x1e4519;          // shadowed green near the rachis / crown core
const LEAF_TIP = 0x93b23c;           // sun-bleached yellow-green tips
const RACHIS_LIVE = 0x8f9a4a;        // yellow-green petiole/rachis
const DEAD_BASE = 0x9a7d4e;          // hanging dead frond
const DEAD_TIP = 0xb59a63;
const COCONUT = 0x6b4f2e;
const SPEAR = 0xa8b854;

// ---------------- LOD / culling tunables ----------------
// Distances are measured from the camera to the instance origin and
// divided by the instance scale, so a half-size palm swaps a band twice
// as close. NEAR is never allowed below PALM_LOD_NEAR_FLOOR — the brief
// is that palms at 25 m and closer must be pixel-identical to LOD0.
const PALM_LOD_NEAR = 55;            // m — LOD0 below this
const PALM_LOD_MID = 260;            // m — LOD1 below this, LOD2 beyond
const PALM_LOD_NEAR_FLOOR = 35;      // m — hard floor for the LOD0 band
const PALM_LOD_HYST = 6;             // m — band hysteresis (kills boundary chatter)
const LOD_TICK_MS = 250;             // re-bucket cadence
const LOD_TICK_STAGGER_MS = 37;      // phase offset per system, so they never align

// Scatter (photoscan props) cull distance = radius * SCATTER_CULL_K, clamped.
// K = 260 puts the cut where a prop spans roughly 6 px of a 1080p frame at a
// typical FPV field of view; MIN keeps close-range clutter honest.
const SCATTER_CULL_K = 260;
const SCATTER_CULL_MIN = 60;         // m
const SCATTER_CULL_MAX = 700;        // m
const SCATTER_CULL_HYST = 1.1;       // multiplicative hysteresis on the cut

// Per-quality multiplier applied to the LOD1/LOD2 switch and to the scatter
// cull radius (the LOD0 band is only ever scaled upward).
const QUALITY_RANGE = { low: 0.55, medium: 0.78, high: 1, ultra: 1.35 };

// LOD1 crown recipe. pairStride/rachisStride decimate the LOD0 crown while
// consuming the IDENTICAL rng draw sequence, so every frond keeps its LOD0
// azimuth, pitch, length, droop and colour.
const CROWN_MID_DETAIL = { pairStride: 3, rachisStride: 5, widthScale: 2.3, lowCoconuts: true };

// LOD2 billboard bake
const BAKE_TILE = 256;               // px per atlas view (atlas is 2 x 1 tiles)
const BAKE_EXPAND_PX = 0.6;          // triangle dilation — closes rasteriser cracks
const BILLBOARD_ALPHA_TEST = 0.5;    // keeps the crown airy: the fringe is cut, the core stays
// A real crown is a tangle of thin double-sided leaflets whose normals point
// everywhere, so it catches roughly half the sun a flat card would. The
// billboard's normals are far more coherent, so it needs to be metered back or
// distant palms turn into pale mint puffs instead of dark green ones.
const BILLBOARD_TINT = 0.70;
const BILLBOARD_UP_BIAS = 0.28;      // how much the card normals lean skyward

// ---------------- scratch objects (no per-frame allocations) ----------------
const _UP = new THREE.Vector3(0, 1, 0);
const _X = new THREE.Vector3(1, 0, 0);
const _m4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _pos = new THREE.Vector3();
const _scl = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _v3a = new THREE.Vector3();

// ---------------- deterministic rng (shared field geometry) ----------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ensureUV2(geo) {
  const uv = geo.attributes.uv;
  if (!uv) return geo;
  // aoMap reads 'uv1' in three >= r151 and 'uv2' in older builds — set both.
  if (!geo.attributes.uv1) geo.setAttribute('uv1', uv);
  if (!geo.attributes.uv2) geo.setAttribute('uv2', uv);
  return geo;
}

function qualityRange() {
  const q = settings && settings.graphics ? settings.graphics.quality : 'high';
  return QUALITY_RANGE[q] === undefined ? 1 : QUALITY_RANGE[q];
}

// ============================================================
// Frame driver
//
// The LOD systems need the camera, and neither createPalms() nor
// scatterModels() is handed one — the map handles call update(dt) with no
// camera and scatter handles have no update at all. Rather than widen those
// contracts, the module chains ONE hook onto Scene.onBeforeRender, which
// three calls at the very top of every renderer.render() with the active
// camera and BEFORE the render list is built. Mutating instance counts and
// matrices there is therefore always frame-coherent: no object can be half
// re-bucketed inside a frame.
//
// The hook is installed the first time any vegetation mesh is rendered (the
// mesh's own onBeforeRender hands us the scene, then retires itself). Until
// then every field simply renders at LOD0 — full quality, never a hole.
// ============================================================
const _lodSystems = [];
let _reflectionDepth = 0;

const NOOP_ON_BEFORE_RENDER = function () {};

function ensureFrameDriver(scene) {
  if (!scene || scene.isScene !== true || scene.userData.__pwVegDriver) return;
  scene.userData.__pwVegDriver = true;
  const prev = scene.onBeforeRender;
  scene.onBeforeRender = function (renderer, sc, camera, renderTarget) {
    if (typeof prev === 'function') prev.call(this, renderer, sc, camera, renderTarget);
    driveLod(camera);
  };
}

// Attach a one-shot installer: the first render of `mesh` gives us its scene.
function attachDriverInstaller(mesh) {
  mesh.onBeforeRender = function (renderer, scene) {
    ensureFrameDriver(scene);
    this.onBeforeRender = NOOP_ON_BEFORE_RENDER;
  };
}

function driveLod(camera) {
  const n = _lodSystems.length;
  if (n === 0 || _reflectionDepth > 0 || !camera) return;
  _camPos.setFromMatrixPosition(camera.matrixWorld);
  const now = performance.now();
  for (let i = 0; i < n; i++) {
    const sys = _lodSystems[i];
    if (now < sys.nextAt) continue;
    sys.nextAt = now + LOD_TICK_MS;
    sys.refresh(_camPos);
  }
}

function registerLodSystem(sys) {
  sys.nextAt = performance.now() + (_lodSystems.length % 7) * LOD_TICK_STAGGER_MS;
  _lodSystems.push(sys);
}

function unregisterLodSystem(sys) {
  const i = _lodSystems.indexOf(sys);
  if (i >= 0) _lodSystems.splice(i, 1);
}

// ============================================================
// Reflection-pass exclusion
//
// three/addons Water re-renders the whole scene into its reflection target
// every frame. Its virtual camera is a closure local — it cannot be reached
// from outside, so layer masks are not an option without also touching the
// main camera (owned by another module). Instead miami/terrain.js brackets
// the reflection render with beginReflectionPass()/endReflectionPass() and
// this module flips `visible` on everything registered here. The render list
// for the OUTER frame is already built by then, so the toggle only ever
// affects the nested reflection render.
//
// Anything can opt out of reflections by setting `userData.pwNoReflect = true`
// before the first reflection pass, or by calling reflectionExclude(obj).
// ============================================================
const _reflectHidden = [];

/**
 * Replace the reflection-exclusion set. Called once per map build (from the
 * first reflection pass), so a map reload drops the previous map's objects
 * instead of leaking references to them. No-op while a reflection pass is in
 * flight. Returns the number of registered objects.
 */
export function reflectionSetExclusions(objects) {
  if (_reflectionDepth > 0) return _reflectHidden.length;
  _reflectHidden.length = 0;
  if (objects) {
    for (let i = 0; i < objects.length; i++) {
      if (objects[i]) _reflectHidden.push(objects[i]);
    }
  }
  return _reflectHidden.length;
}

export function beginReflectionPass() {
  _reflectionDepth++;
  if (_reflectionDepth !== 1) return;
  for (let i = 0; i < _reflectHidden.length; i++) {
    const o = _reflectHidden[i];
    o.userData.__pwVisWas = o.visible;
    o.visible = false;
  }
}

export function endReflectionPass() {
  _reflectionDepth--;
  if (_reflectionDepth !== 0) return;
  for (let i = 0; i < _reflectHidden.length; i++) {
    const o = _reflectHidden[i];
    o.visible = o.userData.__pwVisWas !== false;
  }
}

// ============================================================
// Wind sway shader — shifts vertices in x/z by sin(time + world
// position), scaled by height above the instance origin. Injected
// via onBeforeCompile; a constant customProgramCacheKey means all
// swaying materials share one extra shader program.
//
// `clock` lets several materials (a field's LOD0/LOD1 crown and its LOD2
// billboard) share one uniform object so one update(dt) drives them all.
// ============================================================
export function windSwayMaterial(mat, clock) {
  if (!mat || !mat.isMaterial) return mat;
  if (mat.userData.swayTime) return mat; // already injected
  const uTime = clock || { value: 0 };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSwayTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uSwayTime;')
      .replace('#include <begin_vertex>', [
        '#include <begin_vertex>',
        '{',
        '  float swayH = max( transformed.y, 0.0 );',
        '  #ifdef USE_INSTANCING',
        '    vec3 swayRef = instanceMatrix[3].xyz;',
        '  #else',
        '    vec3 swayRef = vec3( 0.0 );',
        '  #endif',
        `  float swayPh = uSwayTime * 1.7 + swayRef.x * 0.15 + swayRef.z * 0.17;`,
        `  transformed.x += sin( swayPh ) * ${SWAY_AMPLITUDE.toFixed(3)} * swayH;`,
        `  transformed.z += cos( swayPh * 0.83 ) * ${SWAY_AMPLITUDE.toFixed(3)} * swayH;`,
        '}',
      ].join('\n'));
  };
  mat.customProgramCacheKey = () => 'propwash-veg-sway';
  mat.userData.swayTime = uTime;
  return mat;
}

// ============================================================
// Vertex-coloured geometry accumulator (build-time only — the
// allocations here happen once per shared geometry, never per frame)
// ============================================================
class GeomBuilder {
  constructor() {
    this.pos = [];
    this.col = [];
    this.idx = [];
    this.base = 0;
  }
  // returns the new vertex index
  vert(v, c) {
    this.pos.push(v.x, v.y, v.z);
    this.col.push(c.r, c.g, c.b);
    return this.base++;
  }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  build() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    geo.setIndex(this.idx);
    geo.computeVertexNormals();
    return geo;
  }
}

// Append an existing indexed geometry (e.g. a sphere) with a flat colour.
function appendGeometry(gb, srcGeo, matrix, color) {
  const p = srcGeo.attributes.position;
  const index = srcGeo.index;
  const start = gb.base;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(matrix);
    gb.vert(v, color);
  }
  if (index) {
    for (let i = 0; i < index.count; i++) gb.idx.push(start + index.getX(i));
  } else {
    for (let i = 0; i < p.count; i++) gb.idx.push(start + i);
  }
}

// ---------------- shared trunk material (bark_palm with brown fallback) ----------------
let _trunkMatPromise = null;
function getTrunkMaterial() {
  if (!_trunkMatPromise) {
    _trunkMatPromise = (async () => {
      try {
        if (assetLib) {
          const set = await assetLib.textureSet('bark_palm');
          if (set && set.map) {
            // colour tint: the bark_palm albedo is olive/khaki — multiply it
            // toward warm grey-brown so trunks never read green under sky light.
            return await assetLib.pbrMaterial('bark_palm', {
              repeat: [2, 5],
              roughness: 0.95,
              color: TRUNK_TINT,
              normalScale: 1.6,
            });
          }
        }
      } catch (e) { /* fall through to plain material */ }
      return new THREE.MeshStandardMaterial({ color: TRUNK_FALLBACK, roughness: 0.95 });
    })();
  }
  return _trunkMatPromise;
}

// ---------------- shared crown material (pure geometry, vertex colours) ----------------
let _crownMat = null;
function getCrownMaterial() {
  if (!_crownMat) {
    _crownMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.68,
      metalness: 0,
      side: THREE.DoubleSide,
    });
  }
  return _crownMat;
}

// ---------------- shared unit spheres (coconuts) ----------------
let _unitSphere = null;
function getUnitSphere() {
  if (!_unitSphere) _unitSphere = new THREE.SphereGeometry(1, 8, 6);
  return _unitSphere;
}
let _unitSphereLow = null;
function getUnitSphereLow() {
  if (!_unitSphereLow) _unitSphereLow = new THREE.SphereGeometry(1, 5, 3);
  return _unitSphereLow;
}

// ============================================================
// Palm construction
// ============================================================
function makePalmSpec(rnd) {
  return {
    height: 7 + rnd() * 3,                 // 7..10 m
    rBase: 0.16 + rnd() * 0.06,            // 0.16..0.22 m
    rTip: 0.10,
    leanRad: (3 + rnd() * 9) * DEG2RAD,    // 3..12 deg
    leanAz: rnd() * Math.PI * 2,
    sBend: (rnd() - 0.5) * 1.4,            // lateral S-curve offset (m)
    ridgePhase: rnd() * Math.PI * 2,
    fronds: 13 + Math.floor(rnd() * 5),    // 13..17
  };
}

// Trunk: rings along a cubic-bezier spine (gentle S-curve + lean),
// radius tapering rBase -> rTip with leaf-scar ridge rings every
// ~0.45 m, a flared base and a fiber-collar bulge at the very top
// (hides the frond attachment points). UVs: u around the girth,
// v along the height — material repeat [2, 5] tiles the bark.
// `rings` only changes tessellation along the spine; the curve, and
// therefore `top`/`tangent`, is identical at every LOD.
// Returns { geometry, top, tangent }.
function buildTrunkGeometry(spec, radial = 12, rings = 72) {
  const RINGS = rings;
  const h = spec.height;
  const lat = Math.sin(spec.leanRad) * h;
  const dx = Math.cos(spec.leanAz), dz = Math.sin(spec.leanAz);
  const px = -dz, pz = dx; // horizontal perpendicular for the S-bend
  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(dx * lat * 0.10 + px * spec.sBend * 0.5, h * 0.35, dz * lat * 0.10 + pz * spec.sBend * 0.5),
    new THREE.Vector3(dx * lat * 0.55 - px * spec.sBend * 0.3, h * 0.72, dz * lat * 0.55 - pz * spec.sBend * 0.3),
    new THREE.Vector3(dx * lat, Math.cos(spec.leanRad) * h, dz * lat),
  );

  const cols = radial + 1; // duplicated seam column for clean uv wrap
  const positions = new Float32Array((RINGS + 1) * cols * 3);
  const uvs = new Float32Array((RINGS + 1) * cols * 2);
  const indices = [];
  const center = new THREE.Vector3();
  const T = new THREE.Vector3();
  const b1 = new THREE.Vector3();
  const b2 = new THREE.Vector3();
  const v = new THREE.Vector3();

  for (let i = 0; i <= RINGS; i++) {
    const t = i / RINGS;
    curve.getPoint(t, center);
    curve.getTangent(t, T).normalize();
    // stable twist-free frame (T is always near-vertical, never ~X)
    b1.crossVectors(T, _X).normalize();
    b2.crossVectors(T, b1).normalize();

    const y = t * h;
    let r = spec.rBase + (spec.rTip - spec.rBase) * Math.pow(t, 0.85);
    // leaf-scar ridge rings every ~0.45 m (sharpened sine bumps)
    const ridge = Math.pow(0.5 + 0.5 * Math.sin(y * (Math.PI * 2 / 0.45) + spec.ridgePhase), 3);
    r *= 1 + 0.075 * ridge;
    // flared base
    if (y < 1.1) r *= 1 + 0.55 * Math.pow(1 - y / 1.1, 2.2);
    // fiber collar bulge over the last 0.6 m — swallows the frond bases
    const collar = h - 0.6;
    if (y > collar) r *= 1 + 0.4 * Math.pow((y - collar) / 0.6, 2);

    for (let j = 0; j < cols; j++) {
      const a = (j / radial) * Math.PI * 2;
      v.copy(center)
        .addScaledVector(b1, Math.cos(a) * r)
        .addScaledVector(b2, Math.sin(a) * r);
      const o = (i * cols + j) * 3;
      positions[o] = v.x; positions[o + 1] = v.y; positions[o + 2] = v.z;
      const u = (i * cols + j) * 2;
      uvs[u] = j / radial; uvs[u + 1] = t;
    }
  }
  for (let i = 0; i < RINGS; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * cols + j, b = a + 1;
      const c = a + cols, d = c + 1;
      indices.push(a, c, d, a, d, b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  ensureUV2(geometry);

  return {
    geometry,
    top: curve.getPoint(1),
    tangent: curve.getTangent(1).normalize(),
  };
}

// One pinnate frond written into `gb`, transformed by `m`.
// Frond-local frame: base at origin, rachis arching out along +X.
// The pitch profile rises from a0 and droops to a1 at the tip;
// leaflet pairs form a neat forward-swept V that gets floppier
// toward the tip. `opts`: { length, pairs, dead, pairStride,
// rachisStride, widthScale }.
//
// LOD NOTE: the decimation strides skip GEOMETRY only. Every rnd() draw
// is still made, in the original order, so a decimated frond keeps the
// exact rachis path, leaflet directions, droop and colours of the full
// one — that is what makes the LOD0 -> LOD1 switch invisible.
function addFrond(gb, m, rnd, opts) {
  const dead = !!opts.dead;
  const L = opts.length;
  const SEG = 10;
  const pairStride = opts.pairStride || 1;
  const rachisStride = opts.rachisStride || 1;
  const widthScale = opts.widthScale || 1;

  // ---- per-frond colours (jittered) ----
  const cDeep = new THREE.Color(dead ? 0x6e5836 : LEAF_DEEP);
  const cBase = new THREE.Color(dead ? DEAD_BASE : LEAF_BASE);
  const cTip = new THREE.Color(dead ? DEAD_TIP : LEAF_TIP);
  const cRachis = new THREE.Color(dead ? 0x83683d : RACHIS_LIVE);
  const jh = (rnd() - 0.5) * (dead ? 0.015 : 0.028);
  const js = (rnd() - 0.5) * 0.08;
  const jl = (rnd() - 0.5) * 0.05;
  cDeep.offsetHSL(jh, js * 0.5, jl * 0.5);
  cBase.offsetHSL(jh, js, jl);
  cTip.offsetHSL(jh, js * 0.5, jl);
  cRachis.offsetHSL(jh * 0.5, js * 0.5, jl);

  // ---- rachis path (polyline integrated from the pitch profile) ----
  const a0 = (dead ? -18 : 30 + (rnd() - 0.5) * 8) * DEG2RAD;
  const a1 = (dead ? -42 - rnd() * 10 : -68 + (rnd() - 0.5) * 14) * DEG2RAD;
  const px = new Float64Array(SEG + 1);
  const py = new Float64Array(SEG + 1);
  const ang = new Float64Array(SEG + 1);
  {
    let x = 0, y = 0;
    const step = L / SEG;
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG;
      const a = a0 + (a1 - a0) * Math.pow(t, 1.35);
      ang[i] = a; px[i] = x; py[i] = y;
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
    }
  }

  const V = new THREE.Vector3();
  const cTmp = new THREE.Color();
  const cTmp2 = new THREE.Color();
  const cTmp3 = new THREE.Color();

  // ---- rachis: tapering diamond-section tube (emitted rings x 4 verts) ----
  const ringIdx = [];
  let prevBase = -1;
  for (let i = 0; i <= SEG; i++) {
    if (i % rachisStride !== 0 && i !== SEG) continue;
    const t = i / SEG;
    const sinA = Math.sin(ang[i]), cosA = Math.cos(ang[i]);
    const hw = 0.05 * (1 - 0.84 * t) + 0.008;  // width (z)
    const hv = 0.038 * (1 - 0.84 * t) + 0.006; // height (in-plane normal)
    const nx = -sinA, ny = cosA;
    cTmp.copy(cRachis).lerp(cBase, Math.min(1, t * 1.4));
    const base = ringIdx.length;
    ringIdx.push(
      gb.vert(V.set(px[i] + nx * hv, py[i] + ny * hv, 0).applyMatrix4(m), cTmp),
      gb.vert(V.set(px[i], py[i], hw).applyMatrix4(m), cTmp),
      gb.vert(V.set(px[i] - nx * hv, py[i] - ny * hv, 0).applyMatrix4(m), cTmp),
      gb.vert(V.set(px[i], py[i], -hw).applyMatrix4(m), cTmp),
    );
    if (prevBase >= 0) {
      for (let k = 0; k < 4; k++) {
        const k2 = (k + 1) % 4;
        gb.quad(ringIdx[prevBase + k], ringIdx[prevBase + k2], ringIdx[base + k2], ringIdx[base + k]);
      }
    }
    prevBase = base;
  }

  // ---- leaflet pairs along the rachis ----
  // Wide, overlapping and only lightly jittered — the neat repeating
  // V is what makes the frond read as a feather instead of a wire.
  const pairs = opts.pairs;
  const tStart = dead ? 0.10 : 0.14;
  const dirV = new THREE.Vector3();
  const wV = new THREE.Vector3();
  const hpV = new THREE.Vector3();
  const q0 = new THREE.Vector3(), q1 = new THREE.Vector3(), q2 = new THREE.Vector3();
  const lenNorm = L / 3.8;

  for (let k = 0; k < pairs; k++) {
    const emit = (k % pairStride === 0) || k === pairs - 1;
    const t = tStart + (1 - tStart) * (k / (pairs - 1));
    const f = t * SEG;
    const i0 = Math.min(SEG - 1, Math.floor(f));
    const fr = f - i0;
    const bx = px[i0] + (px[i0 + 1] - px[i0]) * fr;
    const by = py[i0] + (py[i0 + 1] - py[i0]) * fr;
    const a = ang[i0] + (ang[i0 + 1] - ang[i0]) * fr;
    const tx = Math.cos(a), ty = Math.sin(a);       // rachis tangent
    const nx = -ty, ny = tx;                        // in-plane "up"
    // ~52 cm leaflets near the base tapering to ~14 cm at the tip
    const lenBase = (0.14 + 0.38 * Math.pow(1 - t, 0.8)) * lenNorm;

    for (let side = -1; side <= 1; side += 2) {
      const len = lenBase * (0.92 + rnd() * 0.16);
      const sweep = (dead ? 28 : 40 + (rnd() - 0.5) * 8) * DEG2RAD;  // forward toward tip
      // V-fold: leaflets rise steeply from the rachis near the base,
      // flatten out toward the tip
      const vAng = (dead ? (-30 + rnd() * 14) : (44 - 26 * t + (rnd() - 0.5) * 8)) * DEG2RAD;
      dirV.set(tx * Math.sin(sweep), ty * Math.sin(sweep), side * Math.cos(sweep));
      dirV.multiplyScalar(Math.cos(vAng));
      dirV.x += nx * Math.sin(vAng);
      dirV.y += ny * Math.sin(vAng);
      dirV.normalize();
      const droopK = dead ? 0.75 + rnd() * 0.25 : 0.10 + 0.42 * t + rnd() * 0.08;
      // blade width vector: horizontal perpendicular rolled up into the V,
      // with only a whisper of flutter
      hpV.crossVectors(_UP, dirV);
      if (hpV.lengthSq() < 1e-6) hpV.set(0, 0, 1); else hpV.normalize();
      const roll = side * (dead ? 0.2 : 0.6) + (rnd() - 0.5) * 0.22;
      wV.copy(hpV).multiplyScalar(Math.cos(roll)).addScaledVector(_UP, Math.sin(roll));
      wV.addScaledVector(dirV, -wV.dot(dirV)).normalize();
      const bJ = 0.88 + rnd() * 0.24; // per-leaflet brightness
      if (!emit) continue;            // decimated away — draws already consumed

      // 3 stations: base, mid (55%), tip — with quadratic droop
      q0.set(bx, by, 0);
      q1.set(bx, by, 0).addScaledVector(dirV, len * 0.55); q1.y -= len * droopK * 0.30;
      q2.set(bx, by, 0).addScaledVector(dirV, len);        q2.y -= len * droopK;

      // dark near the rachis (self-shadowed core), rich green mid-blade,
      // bleached tips
      const c0 = cTmp.copy(cDeep).lerp(cBase, 0.35 + 0.3 * t).multiplyScalar(bJ * 0.9);
      const hw0 = 0.032 * (0.75 + lenNorm * 0.45) * widthScale;
      const hw1 = hw0 * 0.72, hw2 = hw0 * 0.10;
      const v00 = gb.vert(V.copy(q0).addScaledVector(wV, hw0).applyMatrix4(m), c0);
      const v01 = gb.vert(V.copy(q0).addScaledVector(wV, -hw0).applyMatrix4(m), c0);
      const c1 = cTmp2.copy(cBase).lerp(cTip, 0.25 + 0.45 * t).multiplyScalar(bJ);
      const v10 = gb.vert(V.copy(q1).addScaledVector(wV, hw1).applyMatrix4(m), c1);
      const v11 = gb.vert(V.copy(q1).addScaledVector(wV, -hw1).applyMatrix4(m), c1);
      const c2 = cTmp3.copy(cTip).multiplyScalar(Math.min(1.12, bJ * 1.08));
      const v20 = gb.vert(V.copy(q2).addScaledVector(wV, hw2).applyMatrix4(m), c2);
      const v21 = gb.vert(V.copy(q2).addScaledVector(wV, -hw2).applyMatrix4(m), c2);
      gb.quad(v00, v10, v11, v01);
      gb.quad(v10, v20, v21, v11);
    }
  }
}

// Short vertical spear leaf at the crown centre.
function addSpear(gb, crownM, rnd) {
  const h = 1.4 + rnd() * 0.5;
  const c = new THREE.Color(SPEAR);
  c.offsetHSL((rnd() - 0.5) * 0.02, 0, (rnd() - 0.5) * 0.05);
  const tiltX = (rnd() - 0.5) * 0.3, tiltZ = (rnd() - 0.5) * 0.3;
  const V = new THREE.Vector3();
  const r = 0.05;
  const b0 = gb.vert(V.set(r, 0.05, 0).applyMatrix4(crownM), c);
  const b1 = gb.vert(V.set(0, 0.05, r).applyMatrix4(crownM), c);
  const b2 = gb.vert(V.set(-r, 0.05, 0).applyMatrix4(crownM), c);
  const b3 = gb.vert(V.set(0, 0.05, -r).applyMatrix4(crownM), c);
  const apex = gb.vert(V.set(tiltX, h, tiltZ).applyMatrix4(crownM), c);
  gb.tri(b0, b1, apex); gb.tri(b1, b2, apex); gb.tri(b2, b3, apex); gb.tri(b3, b0, apex);
}

// Full crown (live fronds + dead fronds + spear + coconuts) merged
// into one vertex-coloured geometry, positioned at `top` and tilted
// along a softened `tangent` (blended toward vertical so the crown
// never kinks off the trunk). Target ~6 k tris at full detail.
// `detail` decimates without touching the rng stream (see addFrond).
function buildCrownGeometry(top, tangent, rnd, frondCount, detail) {
  const d = detail || null;
  const pairStride = d && d.pairStride ? d.pairStride : 1;
  const rachisStride = d && d.rachisStride ? d.rachisStride : 1;
  const widthScale = d && d.widthScale ? d.widthScale : 1;
  const gb = new GeomBuilder();
  // soften the trunk-tip tangent: crowns sit mostly upright
  const upTangent = new THREE.Vector3()
    .copy(tangent).multiplyScalar(0.5).addScaledVector(_UP, 0.5).normalize();
  const crownQ = new THREE.Quaternion().setFromUnitVectors(_UP, upTangent);
  const crownM = new THREE.Matrix4().compose(top, crownQ, new THREE.Vector3(1, 1, 1));
  const m = new THREE.Matrix4();
  const rot = new THREE.Matrix4();
  const scratch = new THREE.Matrix4();
  const GOLD = Math.PI * (3 - Math.sqrt(5)); // golden-angle azimuth spread

  // live fronds — continuous pitch spread from steeply rising to
  // drooping, interleaved around the crown by the golden angle so
  // neighbouring fronds never share a tier.
  for (let i = 0; i < frondCount; i++) {
    const az = i * GOLD + (rnd() - 0.5) * 0.25;
    const k = i / Math.max(1, frondCount - 1);
    const pitch = (46 - 82 * Math.pow(k, 1.1) + (rnd() - 0.5) * 10) * DEG2RAD;
    // horizontal fronds are the longest; the steep top tier is shorter
    const lenScale = 0.88 + 0.12 * Math.sin(Math.min(Math.PI, (pitch / DEG2RAD + 40) / 86 * Math.PI));
    m.copy(crownM)
      .multiply(rot.makeRotationY(az))
      .multiply(scratch.makeRotationZ(pitch));
    addFrond(gb, m, rnd, {
      length: (3.3 + rnd() * 1.2) * lenScale,   // ~3.2..4.5 m
      pairs: 26 + Math.floor(rnd() * 9),        // 26..34 pairs
      dead: false,
      pairStride, rachisStride, widthScale,
    });
  }

  // 3-5 dead fronds hanging almost vertically against the trunk
  const deadN = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < deadN; i++) {
    const az = rnd() * Math.PI * 2;
    const pitch = (-56 - rnd() * 12) * DEG2RAD;   // + rachis profile ≈ -75..-110 deg overall
    m.copy(crownM)
      .multiply(rot.makeTranslation(0, -0.22, 0))
      .multiply(scratch.makeRotationY(az));
    m.multiply(rot.makeRotationZ(pitch));
    addFrond(gb, m, rnd, {
      length: 2.4 + rnd() * 0.8,
      pairs: 16 + Math.floor(rnd() * 6),
      dead: true,
      pairStride, rachisStride, widthScale,
    });
  }

  // spear leaf
  addSpear(gb, crownM, rnd);

  // 2-4 coconuts tucked under the fronds
  const cocoN = 2 + Math.floor(rnd() * 3);
  const cocoCol = new THREE.Color(COCONUT);
  const sphere = d && d.lowCoconuts ? getUnitSphereLow() : getUnitSphere();
  const cc = new THREE.Color();
  for (let i = 0; i < cocoN; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = 0.18 + rnd() * 0.14;
    const r = 0.12 + rnd() * 0.03;
    m.copy(crownM).multiply(rot.compose(
      _pos.set(Math.cos(a) * rad, -0.32 - rnd() * 0.14, Math.sin(a) * rad),
      _quat.identity(),
      _scl.set(r, r * 1.12, r)));
    cc.copy(cocoCol).offsetHSL(0, 0, (rnd() - 0.5) * 0.06);
    appendGeometry(gb, sphere, m, cc);
  }

  return gb.build();
}

// ============================================================
// LOD2 billboard — a texture baked straight off the LOD0 crown
//
// The crown geometry is rasterised twice with a painter's algorithm onto a
// 2 x 1 atlas: left tile = side elevation (project along Z), right tile =
// plan view (project along Y). Each triangle is filled with the mean of its
// three vertex colours, converted linear -> sRGB, and grown by a fraction of
// a pixel so the rasteriser leaves no cracks between neighbouring fills. One
// alpha dilation pass afterwards keeps the mip chain solid enough for an
// alpha-tested cutout. No renderer, no render target, no async.
// ============================================================
function linearToSRGB(c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function dilateAlpha(ctx, w, h) {
  let img;
  try { img = ctx.getImageData(0, 0, w, h); } catch (e) { return; }
  const src = img.data;
  const out = new Uint8ClampedArray(src);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (src[o + 3] > 200) continue;
      let bestA = src[o + 3], br = src[o], bg = src[o + 1], bb = src[o + 2];
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          const p = (yy * w + xx) * 4;
          if (src[p + 3] > bestA) { bestA = src[p + 3]; br = src[p]; bg = src[p + 1]; bb = src[p + 2]; }
        }
      }
      out[o] = br; out[o + 1] = bg; out[o + 2] = bb; out[o + 3] = bestA;
    }
  }
  img.data.set(out);
  ctx.putImageData(img, 0, 0);
}

// Returns { texture, cx, cy, cz, R, hy } or null when Canvas2D is unavailable.
function bakeCrownAtlas(crownGeo, tile) {
  let canvas = null;
  let ctx = null;
  try {
    canvas = document.createElement('canvas');
    canvas.width = tile * 2;
    canvas.height = tile;
    ctx = canvas.getContext('2d');
  } catch (e) { return null; }
  if (!ctx) return null;

  crownGeo.computeBoundingBox();
  const bb = crownGeo.boundingBox;
  const cx = (bb.min.x + bb.max.x) * 0.5;
  const cy = (bb.min.y + bb.max.y) * 0.5;
  const cz = (bb.min.z + bb.max.z) * 0.5;
  const hx = Math.max(bb.max.x - cx, cx - bb.min.x);
  const hz = Math.max(bb.max.z - cz, cz - bb.min.z);
  const R = Math.max(hx, hz, 0.05) * 1.04;
  const hy = Math.max(bb.max.y - cy, cy - bb.min.y, 0.05) * 1.04;

  const pos = crownGeo.attributes.position;
  const col = crownGeo.attributes.color;
  const index = crownGeo.index;
  const triCount = index ? index.count / 3 : pos.count / 3;

  const order = new Int32Array(triCount);
  const depth = new Float32Array(triCount);
  const styleCache = new Map();

  const paint = (axis) => {
    // axis 0 = side elevation (u:x, v:y, depth:z), 1 = plan (u:x, v:z, depth:y)
    const ox = axis === 0 ? 0 : tile;
    for (let t = 0; t < triCount; t++) {
      order[t] = t;
      let d = 0;
      for (let k = 0; k < 3; k++) {
        const vi = index ? index.getX(t * 3 + k) : t * 3 + k;
        d += axis === 0 ? pos.getZ(vi) : pos.getY(vi);
      }
      depth[t] = d;
    }
    const idxArr = Array.prototype.slice.call(order);
    idxArr.sort((a, b) => depth[a] - depth[b]);   // far first

    const ux = [0, 0, 0], uy = [0, 0, 0];
    for (let n = 0; n < idxArr.length; n++) {
      const t = idxArr[n];
      let r = 0, g = 0, b = 0;
      let mx = 0, my = 0;
      for (let k = 0; k < 3; k++) {
        const vi = index ? index.getX(t * 3 + k) : t * 3 + k;
        const X = pos.getX(vi), Y = pos.getY(vi), Z = pos.getZ(vi);
        const u = (X - cx) / (2 * R) + 0.5;
        const v = axis === 0 ? (Y - cy) / (2 * hy) + 0.5 : (Z - cz) / (2 * R) + 0.5;
        ux[k] = ox + u * tile;
        uy[k] = (1 - v) * tile;
        mx += ux[k]; my += uy[k];
        r += col.getX(vi); g += col.getY(vi); b += col.getZ(vi);
      }
      mx /= 3; my /= 3;
      // dilate about the centroid so neighbouring fills overlap
      for (let k = 0; k < 3; k++) {
        const dx = ux[k] - mx, dy = uy[k] - my;
        const l = Math.sqrt(dx * dx + dy * dy);
        if (l > 1e-4) {
          const s = 1 + BAKE_EXPAND_PX / l;
          ux[k] = mx + dx * s; uy[k] = my + dy * s;
        }
      }
      const R8 = Math.round(linearToSRGB(r / 3) * 255);
      const G8 = Math.round(linearToSRGB(g / 3) * 255);
      const B8 = Math.round(linearToSRGB(b / 3) * 255);
      const key = (R8 >> 2) * 4096 + (G8 >> 2) * 64 + (B8 >> 2);
      let style = styleCache.get(key);
      if (style === undefined) {
        style = `rgb(${R8},${G8},${B8})`;
        styleCache.set(key, style);
      }
      ctx.fillStyle = style;
      ctx.beginPath();
      ctx.moveTo(ux[0], uy[0]);
      ctx.lineTo(ux[1], uy[1]);
      ctx.lineTo(ux[2], uy[2]);
      ctx.closePath();
      ctx.fill();
    }
  };

  paint(0);
  paint(1);
  // one 3x3 alpha dilation: without it the mip chain thins the cutout until
  // distant crowns dissolve; with more than one it turns into a solid blob
  dilateAlpha(ctx, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return { texture, cx, cy, cz, R, hy };
}

// Crossed-quad "star" crown: two vertical planes + one horizontal plane,
// each emitted as a front/back pair with fixed canopy-ish normals (never a
// black backface). 12 triangles total.
function buildBillboardGeometry(bake) {
  const { cx, cy, cz, R, hy } = bake;
  const position = [];
  const normal = [];
  const uv = [];
  const index = [];

  // uv rectangles inside the 2 x 1 atlas
  const SIDE_U0 = 0, SIDE_U1 = 0.5, TOP_U0 = 0.5, TOP_U1 = 1;

  const addQuad = (p0, p1, p2, p3, n, u0, v0, u1, v1) => {
    // p0 bottom-left, p1 bottom-right, p2 top-right, p3 top-left
    const base = position.length / 3;
    const pts = [p0, p1, p2, p3];
    const uvs = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
    for (let i = 0; i < 4; i++) {
      position.push(pts[i][0], pts[i][1], pts[i][2]);
      normal.push(n[0], n[1], n[2]);
      uv.push(uvs[i][0], uvs[i][1]);
    }
    index.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  const up = BILLBOARD_UP_BIAS;
  const nrm = (x, y, z) => {
    const l = Math.hypot(x, y, z) || 1;
    return [x / l, y / l, z / l];
  };

  // vertical plane in XY (faces +Z / -Z)
  {
    const y0 = cy - hy, y1 = cy + hy;
    const x0 = cx - R, x1 = cx + R;
    addQuad([x0, y0, cz], [x1, y0, cz], [x1, y1, cz], [x0, y1, cz],
      nrm(0, up, 1), SIDE_U0, 0, SIDE_U1, 1);
    addQuad([x1, y0, cz], [x0, y0, cz], [x0, y1, cz], [x1, y1, cz],
      nrm(0, up, -1), SIDE_U1, 0, SIDE_U0, 1);
  }
  // vertical plane in ZY (faces +X / -X)
  {
    const y0 = cy - hy, y1 = cy + hy;
    const z0 = cz - R, z1 = cz + R;
    addQuad([cx, y0, z1], [cx, y0, z0], [cx, y1, z0], [cx, y1, z1],
      nrm(1, up, 0), SIDE_U0, 0, SIDE_U1, 1);
    addQuad([cx, y0, z0], [cx, y0, z1], [cx, y1, z1], [cx, y1, z0],
      nrm(-1, up, 0), SIDE_U1, 0, SIDE_U0, 1);
  }
  // horizontal plane in XZ (faces up / down) — the plan-view tile
  {
    const x0 = cx - R, x1 = cx + R;
    const z0 = cz - R, z1 = cz + R;
    addQuad([x0, cy, z1], [x1, cy, z1], [x1, cy, z0], [x0, cy, z0],
      nrm(0, 1, 0), TOP_U0, 0, TOP_U1, 1);
    addQuad([x1, cy, z1], [x0, cy, z1], [x0, cy, z0], [x1, cy, z0],
      nrm(0, -0.35, 0), TOP_U1, 0, TOP_U0, 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeBoundingSphere();
  return geo;
}

// ============================================================
// 1) Hero palm — one unique coconut palm, origin at trunk base
// ============================================================
export async function buildPalm(rng) {
  const rnd = typeof rng === 'function' ? rng : Math.random;
  const spec = makePalmSpec(rnd);
  const trunkMat = await getTrunkMaterial();
  const group = new THREE.Group();
  group.name = 'palm-hero';

  // trunk (S-curve, ridge rings, base flare, top collar — 1 draw call)
  const trunk = buildTrunkGeometry(spec, 14);
  const trunkMesh = new THREE.Mesh(trunk.geometry, trunkMat);
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  group.add(trunkMesh);

  // crown (live + dead fronds + spear + coconuts merged — 1 draw call)
  const crownGeo = buildCrownGeometry(trunk.top, trunk.tangent, rnd, spec.fronds);
  const crownMesh = new THREE.Mesh(crownGeo, getCrownMaterial());
  crownMesh.castShadow = true;
  crownMesh.receiveShadow = true;
  group.add(crownMesh);

  group.rotation.y = rnd() * Math.PI * 2;
  return group;
}

// ============================================================
// 2) Instanced palm field — three LOD pairs (trunk + crown) sharing
//    module-level geometry, re-bucketed by camera distance.
// ============================================================
const FIELD_SEED = 0xF1E7D002;

function fieldSpec(rnd) {
  const spec = makePalmSpec(rnd);
  spec.height = 8.2;
  spec.rBase = 0.19;
  spec.leanRad = 5 * DEG2RAD;
  spec.sBend = 0.5;
  return spec;
}

let _fieldResPromise = null;
function getFieldResources() {
  if (!_fieldResPromise) {
    _fieldResPromise = (async () => {
      const trunkMat = await getTrunkMaterial();

      // ---- LOD0: exactly the pre-LOD field palm, same seed, same draws ----
      const rndA = mulberry32(FIELD_SEED);
      const specA = fieldSpec(rndA);
      const trunk0 = buildTrunkGeometry(specA, 12);
      const crown0 = buildCrownGeometry(trunk0.top, trunk0.tangent, rndA, 15);

      // ---- LOD1: same rng stream replayed, geometry decimated ----
      const rndB = mulberry32(FIELD_SEED);
      const specB = fieldSpec(rndB);
      const trunk1 = buildTrunkGeometry(specB, 6, 24);
      const crown1 = buildCrownGeometry(trunk1.top, trunk1.tangent, rndB, 15, CROWN_MID_DETAIL);

      // ---- LOD2: cheapest trunk + a billboard baked off the LOD0 crown ----
      const rndC = mulberry32(FIELD_SEED);
      const specC = fieldSpec(rndC);
      const trunk2 = buildTrunkGeometry(specC, 4, 6);

      let billboardGeo = null;
      let billboardMat = null;
      const bake = bakeCrownAtlas(crown0, BAKE_TILE);
      if (bake) {
        billboardGeo = buildBillboardGeometry(bake);
        billboardMat = new THREE.MeshStandardMaterial({
          map: bake.texture,
          color: new THREE.Color(BILLBOARD_TINT, BILLBOARD_TINT, BILLBOARD_TINT),
          transparent: false,
          alphaTest: BILLBOARD_ALPHA_TEST,
          roughness: 0.72,
          metalness: 0,
          side: THREE.FrontSide,
        });
      }

      return {
        trunkGeos: [trunk0.geometry, trunk1.geometry, trunk2.geometry],
        crownGeos: [crown0, crown1, billboardGeo || crown1],
        billboardMat,               // null -> LOD2 falls back to the LOD1 crown
        trunkMat,
        // conservative local-space radius of one unit-scale palm (trunk + crown)
        radius: Math.max(specA.height + 2.4, 5.2),
      };
    })();
  }
  return _fieldResPromise;
}

export async function createPalms(count) {
  const res = await getFieldResources();
  const n = Math.max(0, count | 0);
  const castShadow = n > 0 && n <= SHADOW_INSTANCE_LIMIT;

  const group = new THREE.Group();
  group.name = 'palm-field';
  // A field must be reflected (or not) as a whole: the LOD2 trunk on its own
  // is small enough to trip a size-based reflection filter, and a reflection
  // of crowns with no trunks under them is worse than either extreme.
  group.userData.pwReflectKeep = true;

  // One sway clock per field drives every LOD material it owns.
  const swayClock = { value: 0 };
  const crownMat = windSwayMaterial(getCrownMaterial().clone(), swayClock);
  const ownedMats = [crownMat];
  let farCrownMat = crownMat;
  if (res.billboardMat) {
    farCrownMat = windSwayMaterial(res.billboardMat.clone(), swayClock);
    ownedMats.push(farCrownMat);
  }

  const trunkIM = [];
  const crownIM = [];
  for (let L = 0; L < 3; L++) {
    const t = new THREE.InstancedMesh(res.trunkGeos[L], res.trunkMat, n);
    t.castShadow = castShadow && L < 2;
    t.receiveShadow = true;
    t.count = 0;
    trunkIM.push(t);
    group.add(t);

    const c = new THREE.InstancedMesh(res.crownGeos[L], L === 2 ? farCrownMat : crownMat, n);
    c.castShadow = castShadow && L < 2;
    c.receiveShadow = true;
    c.count = 0;
    crownIM.push(c);
    group.add(c);
  }
  attachDriverInstaller(crownIM[0]);

  // ---- instance bookkeeping (all fixed-size, allocated once) ----
  const master = new Float32Array(n * 16);   // authoritative instance matrices
  const ix = new Float32Array(n);
  const iy = new Float32Array(n);
  const iz = new Float32Array(n);
  const invScale = new Float32Array(n);
  const band = new Int8Array(n);
  const slotOf = new Int32Array(n);
  const slots = [new Int32Array(n), new Int32Array(n), new Int32Array(n)];
  const counts = [0, 0, 0];
  const dirty = [false, false, false];
  let used = 0;
  band.fill(-1);
  for (let i = 0; i < n; i++) invScale[i] = 1;

  const writeSlot = (L, slot, inst) => {
    const src = inst * 16, dst = slot * 16;
    const ta = trunkIM[L].instanceMatrix.array;
    const ca = crownIM[L].instanceMatrix.array;
    for (let k = 0; k < 16; k++) {
      const v = master[src + k];
      ta[dst + k] = v;
      ca[dst + k] = v;
    }
    dirty[L] = true;
  };

  const moveTo = (i, to) => {
    const from = band[i];
    if (from === to) return;
    if (from >= 0) {
      const s = slotOf[i];
      const last = --counts[from];
      if (s !== last) {
        const j = slots[from][last];
        slots[from][s] = j;
        slotOf[j] = s;
        writeSlot(from, s, j);
      }
      dirty[from] = true;
    }
    const slot = counts[to]++;
    slots[to][slot] = i;
    slotOf[i] = slot;
    writeSlot(to, slot, i);
    band[i] = to;
  };

  const flush = () => {
    for (let L = 0; L < 3; L++) {
      const c = counts[L];
      trunkIM[L].count = c;
      crownIM[L].count = c;
      // an empty InstancedMesh still pays a full projectObject + setProgram
      // round trip before three notices there is nothing to draw — hide it
      const vis = c > 0;
      trunkIM[L].visible = vis;
      crownIM[L].visible = vis;
      if (!dirty[L]) continue;
      dirty[L] = false;
      trunkIM[L].instanceMatrix.needsUpdate = true;
      crownIM[L].instanceMatrix.needsUpdate = true;
    }
  };

  const sys = {
    nextAt: 0,
    refresh(camPos) {
      if (used === 0) return;
      const qs = qualityRange();
      const near = Math.max(PALM_LOD_NEAR_FLOOR, PALM_LOD_NEAR * qs);
      const mid = Math.max(near + 20, PALM_LOD_MID * qs);
      const H = PALM_LOD_HYST;
      const cx = camPos.x, cy = camPos.y, cz = camPos.z;
      for (let i = 0; i < used; i++) {
        const dx = ix[i] - cx, dy = iy[i] - cy, dz = iz[i] - cz;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) * invScale[i];
        const cur = band[i];
        if (cur >= 0) {
          // stay put while inside the current band widened by the hysteresis
          const lo = cur === 0 ? -1 : (cur === 1 ? near - H : mid - H);
          const hi = cur === 0 ? near + H : (cur === 1 ? mid + H : Infinity);
          if (d >= lo && d <= hi) continue;
        }
        moveTo(i, d < near ? 0 : (d < mid ? 1 : 2));
      }
      flush();
    },
  };

  return {
    group,
    placeAt(i, x, y, z, scale = 1, rotY = 0) {
      if (i < 0 || i >= n) return;
      _pos.set(x, y, z);
      _quat.setFromAxisAngle(_UP, rotY);
      _scl.set(scale, scale, scale);
      _m4.compose(_pos, _quat, _scl);
      _m4.toArray(master, i * 16);
      ix[i] = x; iy[i] = y; iz[i] = z;
      invScale[i] = scale > 1e-4 ? 1 / scale : 1;
    },
    finalize(usedCount) {
      used = usedCount === undefined ? n : Math.max(0, Math.min(usedCount, n));
      // start every instance at full detail: correct even if this field is
      // never handed a camera (no renderer hook yet, headless build, …)
      counts[0] = counts[1] = counts[2] = 0;
      band.fill(-1);
      for (let i = 0; i < used; i++) moveTo(i, 0);
      dirty[0] = dirty[1] = dirty[2] = true;
      flush();

      // one field-wide bounding sphere, assigned to every LOD mesh so three
      // never recomputes one from a shifting instance set
      if (used > 0) {
        let minx = Infinity, miny = Infinity, minz = Infinity;
        let maxx = -Infinity, maxy = -Infinity, maxz = -Infinity;
        let maxR = 0;
        for (let i = 0; i < used; i++) {
          if (ix[i] < minx) minx = ix[i];
          if (iy[i] < miny) miny = iy[i];
          if (iz[i] < minz) minz = iz[i];
          if (ix[i] > maxx) maxx = ix[i];
          if (iy[i] > maxy) maxy = iy[i];
          if (iz[i] > maxz) maxz = iz[i];
          const s = invScale[i] > 1e-6 ? 1 / invScale[i] : 1;
          if (s > maxR) maxR = s;
        }
        _v3a.set((minx + maxx) * 0.5, (miny + maxy) * 0.5, (minz + maxz) * 0.5);
        const half = Math.sqrt(
          (maxx - minx) * (maxx - minx)
          + (maxy - miny) * (maxy - miny)
          + (maxz - minz) * (maxz - minz)) * 0.5;
        const radius = half + res.radius * maxR;
        for (let L = 0; L < 3; L++) {
          trunkIM[L].boundingSphere = new THREE.Sphere(_v3a.clone(), radius);
          crownIM[L].boundingSphere = new THREE.Sphere(_v3a.clone(), radius);
        }
      }
      unregisterLodSystem(sys);   // finalize() is idempotent
      registerLodSystem(sys);
    },
    update(dt) {
      swayClock.value += dt; // sway clock — the only per-frame work, no allocations
    },
    dispose() {
      unregisterLodSystem(sys);
      group.removeFromParent();
      for (let L = 0; L < 3; L++) {
        trunkIM[L].dispose();     // frees instance buffers, not shared geometry
        crownIM[L].dispose();
      }
      for (const m of ownedMats) m.dispose();  // per-call clones; shared maps survive
    },
  };
}

// ============================================================
// 3) GLTF photoscan scattering (with distance culling)
//
// These props are 6 k - 67 k triangles EACH and are strewn over a kilometre
// of shoreline, so the vast majority of them are a handful of pixels at any
// given moment. Instances are compacted to the front of the instance buffer
// and `count` trimmed on the same throttled cadence as the palm LODs — a
// culled prop costs nothing in the main pass, the shadow pass or the water
// reflection, since all three read the same count.
// ============================================================
export async function scatterModels(scene, slug, placements, colliderList, colliderSize) {
  if (!assetLib || !placements || placements.length === 0) return null;
  let inst = null;
  try {
    inst = await assetLib.instancer(slug, placements.length, {
      castShadow: placements.length <= SHADOW_INSTANCE_LIMIT,
    });
  } catch (e) {
    inst = null;
  }
  if (!inst) return null; // model missing — caller skips

  const wantColliders = Array.isArray(colliderList) && colliderSize
    && Number.isFinite(colliderSize.w) && Number.isFinite(colliderSize.h);

  const n = placements.length;
  const master = new Float32Array(n * 16);
  const ix = new Float32Array(n);
  const iy = new Float32Array(n);
  const iz = new Float32Array(n);
  const cut = new Float32Array(n);        // per-instance cull distance (m)

  for (let i = 0; i < n; i++) {
    const p = placements[i];
    const s = p.scale === undefined ? 1 : p.scale;
    _pos.set(p.x, p.y, p.z);
    _quat.setFromAxisAngle(_UP, p.rotY || 0);
    _scl.set(s, s, s);
    _m4.compose(_pos, _quat, _scl);
    inst.setMatrixAt(i, _m4);
    _m4.toArray(master, i * 16);
    ix[i] = p.x; iy[i] = p.y; iz[i] = p.z;
    cut[i] = s;                           // scale now, real distance below
    if (wantColliders && i < COLLIDER_LIMIT) {
      const hw = colliderSize.w * s * 0.5;
      colliderList.push({
        min: new THREE.Vector3(p.x - hw, p.y, p.z - hw),
        max: new THREE.Vector3(p.x + hw, p.y + colliderSize.h * s, p.z + hw),
      });
    }
  }
  inst.finalize(n);
  const group = inst.group;
  group.name = `scatter-${slug}`;
  scene.add(group);

  // ---- collect the instanced sub-meshes and the model's local radius ----
  const meshes = [];
  let modelRadius = 0;
  group.traverse((o) => {
    if (!o.isInstancedMesh) return;
    meshes.push(o);
    const g = o.geometry;
    if (!g.boundingSphere) g.computeBoundingSphere();
    if (g.boundingSphere) modelRadius = Math.max(modelRadius, g.boundingSphere.radius);
  });
  for (let i = 0; i < n; i++) {
    const r = modelRadius * cut[i];
    cut[i] = Math.min(SCATTER_CULL_MAX, Math.max(SCATTER_CULL_MIN, r * SCATTER_CULL_K));
  }

  let sys = null;
  if (meshes.length > 0) {
    attachDriverInstaller(meshes[0]);
    const slotsArr = new Int32Array(n);
    const slotOf = new Int32Array(n);
    const inView = new Uint8Array(n);
    let live = n;
    for (let i = 0; i < n; i++) { slotsArr[i] = i; slotOf[i] = i; inView[i] = 1; }

    const writeSlot = (slot, instIdx) => {
      const src = instIdx * 16, dst = slot * 16;
      for (let m = 0; m < meshes.length; m++) {
        const arr = meshes[m].instanceMatrix.array;
        for (let k = 0; k < 16; k++) arr[dst + k] = master[src + k];
      }
    };

    sys = {
      nextAt: 0,
      refresh(camPos) {
        const qs = qualityRange();
        const cx = camPos.x, cy = camPos.y, cz = camPos.z;
        let changed = false;
        for (let i = 0; i < n; i++) {
          const dx = ix[i] - cx, dy = iy[i] - cy, dz = iz[i] - cz;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const lim = cut[i] * qs;
          const want = inView[i] ? (d <= lim * SCATTER_CULL_HYST ? 1 : 0) : (d <= lim ? 1 : 0);
          if (want === inView[i]) continue;
          changed = true;
          if (want) {
            const slot = live++;
            // the instance currently parked in `slot` swaps down to i's slot
            const j = slotsArr[slot];
            const s = slotOf[i];
            slotsArr[s] = j; slotOf[j] = s;
            slotsArr[slot] = i; slotOf[i] = slot;
            writeSlot(s, j);
            writeSlot(slot, i);
          } else {
            const s = slotOf[i];
            const last = --live;
            const j = slotsArr[last];
            slotsArr[s] = j; slotOf[j] = s;
            slotsArr[last] = i; slotOf[i] = last;
            writeSlot(s, j);
            writeSlot(last, i);
          }
          inView[i] = want;
        }
        for (let m = 0; m < meshes.length; m++) {
          meshes[m].count = live;
          if (changed) meshes[m].instanceMatrix.needsUpdate = true;
        }
        // a fully culled scatter still costs a projectObject + setProgram pass
        // per sub-mesh; drop the whole group out of the traversal instead
        group.visible = live > 0;
      },
    };
    registerLodSystem(sys);
  }

  return {
    group,
    dispose() {
      if (sys) unregisterLodSystem(sys);
      group.removeFromParent();
      group.traverse((o) => { if (o.isInstancedMesh) o.dispose(); });
      // geometries/materials belong to the AssetLibrary cache — not freed here
    },
  };
}
