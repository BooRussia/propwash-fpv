// One Biscayne Bay water system — MeshPhysicalMaterial, no Water.js,
// no Abyssal paste, no open-ocean far plate.
//
// Hero material stays MeshPhysicalMaterial so the map boots on WebGLRenderer.
// Coastal optics (Gerstner normals, Jerlov-ish Fresnel, foam albedo) inject
// through onBeforeCompile — not a second material, not Water.js.
// The 256² / 19 m cascade still drives the tiled chop maps; world-space
// waves at 13.7 / 8.3 / 37.1 / 61.3 m break that period in the fragment.
// Foam stays a plate-UV ClampToEdge DataTexture (no 19 m RepeatWrap).
// SSR stays off.

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

const BAY_COLOR = 0x0e6b72;     // coastal Jerlov-ish teal — not Water.js 0x00404f, not abyssal

// World-space Gerstner bands. None is the 19 m FFT cascade.
export const SHORE_WAVES = Object.freeze([13.7, 8.3, 37.1, 61.3]);

// Foam DataTexture covers the plate once (ClampToEdge, repeat 1,1).
// 256² / 19 m chop stays on normals + displacement — those may still tile.
const FOAM_N = 512;

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

function hash01(ix, iz) {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iz | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h >>> 0) / 4294967296;
}

/** F1 Voronoi in metres. Scale ~3 m — cellular foam, not a 19 m lattice. */
function cellular(x, z, scale) {
  const gx = x / scale, gz = z / scale;
  const ix = Math.floor(gx), iz = Math.floor(gz);
  let f1 = 8;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const hx = hash01(ix + i, iz + j);
      const hz = hash01(ix + i + 91, iz + j + 19);
      const dx = (ix + i + hx) - gx;
      const dz = (iz + j + hz) - gz;
      const d = dx * dx + dz * dz;
      if (d < f1) f1 = d;
    }
  }
  return Math.sqrt(f1);
}

/** Coast-aligned crest pulse. Wavelength 13.7 m, not the 19 m cascade. */
function shoreCrest(x, z, t) {
  const along = 2.8 * Math.sin(x * 0.021) + 1.6 * Math.sin(x * 0.047 + 1.3);
  const dist = (SHORE_Z - z) + along;
  const k = Math.PI * 2 / SHORE_WAVES[0];
  const c = Math.sqrt(9.81 / k);
  const ph = k * dist - c * t;
  return clamp01(Math.cos(ph) * 0.5 + 0.5);
}

/**
 * Extra foam TERM at a world XZ. Depth-break toward SHORE_Z plus the
 * one Catmull-Rom rip. Inland of z=0 is dry. Fold paint stays off.
 */
export function foamTermAt(x, z, height = 0, poly = getRipPoly()) {
  if (z > 0) return 0;
  const crest = crestFromHeight(height);
  const br = depthBreakGate(z);
  const rip = ripMaskAt(x, z, poly);
  const crash = br * (0.28 + 0.92 * crest) * (1 - 0.78 * rip);
  const outflow = rip * (0.48 + 0.52 * crest);
  // Shore-parallel wisps, not a 19 m lattice (periods 13.7 / 8.3).
  const streak = br * (0.18 + 0.22 * crest)
    * clamp01(0.55 + 0.45 * Math.sin(x * (Math.PI * 2 / 13.7) + z * 0.11));
  const raw = crash + outflow + streak * 0.55;
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

/** Plate-UV foam: depth-break + one rip + world-space boat wakes. Not the 19 m cascade. */
export function encodeShoreFoam(sim, foamBytes, opts = {}) {
  const n = opts.n || FOAM_N;
  const poly = opts.ripPoly || getRipPoly();
  const t = opts.time != null ? opts.time
    : (sim && typeof sim.time === 'number' ? sim.time : 0);
  const sampleH = sim && typeof sim.sampleHeight === 'function'
    ? (x, z) => sim.sampleHeight(x, z)
    : () => 0;
  const sampleWake = sim && typeof sim.wakeAt === 'function'
    ? (x, z) => sim.wakeAt(x, z)
    : () => 0;
  let p = 0;
  for (let j = 0; j < n; j++) {
    const z = plateZ(j, n);
    for (let i = 0; i < n; i++) {
      const x = plateX(i, n);
      let raw = 0;
      if (z <= 0) {
        const br = depthBreakGate(z);
        const nearRip = x >= RIP_X_MIN && x <= RIP_X_MAX
          && z >= RIP_Z_END - 90 && z <= SHORE_Z + 12;
        if (br > 0 || nearRip) {
          raw = foamTermAt(x, z, sampleH(x, z), poly);
          if (raw > 0) {
            const cell = cellular(x, z, 3.2);
            const cellFine = cellular(x, z, 1.15);
            const cellStreak = cellular(x * 0.35, z, 6.4);
            const crest = shoreCrest(x, z, t);
            const holes = 1 - Math.min(1, cell * 1.22);
            const fine = 1 - Math.min(1, cellFine * 1.45);
            const longWisp = 1 - Math.min(1, cellStreak * 1.10);
            const cellMask = holes * (0.42 + 0.58 * fine) * (0.55 + 0.45 * longWisp);
            raw = raw * (0.52 + 0.62 * cellMask * (0.18 + 0.82 * crest));
            if (raw > 1) raw = 1;
          }
        }
        // Hull / Kelvin stamps sit in world metres on this plate (foamGain 0).
        const wake = sampleWake(x, z);
        if (wake > 0) raw = raw + wake > 1 ? 1 : raw + wake;
      }
      // Floor kills the salt-and-pepper leftovers; honest breaks stay.
      const f = (raw <= 0.05 ? 0 : (raw - 0.05) / 0.95) * 255;
      foamBytes[p] = f;
      foamBytes[p + 1] = f;
      foamBytes[p + 2] = f;
      foamBytes[p + 3] = 255;
      p += 4;
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
 * Inject coastal optics into MeshPhysicalMaterial.
 * World-space Gerstner + Fresnel + foam albedo. Not a second material.
 */
function applyCoastalOptics(mat) {
  mat.customProgramCacheKey = () => 'pw-bay-coastal-v6';
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uBayTime = { value: 0 };
    shader.uniforms.uShoreZ = { value: SHORE_Z };
    shader.uniforms.uCamUnder = { value: 0 };
    shader.uniforms.uBayDeep = { value: new THREE.Color(0x07343c).convertSRGBToLinear() };
    shader.uniforms.uBayShallow = { value: new THREE.Color(0x2aa8a0).convertSRGBToLinear() };
    shader.uniforms.uBayFoam = { value: new THREE.Color(0xf7f4ee).convertSRGBToLinear() };
    shader.uniforms.uBayScatter = { value: new THREE.Color(0x3ed4b4).convertSRGBToLinear() };
    mat.userData.shader = shader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
varying vec3 vBayWorld;`,
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
vBayWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
varying vec3 vBayWorld;
uniform float uBayTime;
uniform float uShoreZ;
uniform float uCamUnder;
uniform vec3 uBayDeep;
uniform vec3 uBayShallow;
uniform vec3 uBayFoam;
uniform vec3 uBayScatter;

float bayDepthBreak(float z) {
  if (z > 0.0) return 0.0;
  float bed = max(-6.0, -0.4 + (z - uShoreZ) * 0.08);
  float depth = z > uShoreZ ? 0.0 : -bed;
  if (depth < 0.28 || depth > 3.4) return 0.0;
  return sin(3.14159265 * (depth - 0.28) / 3.12);
}

void bayAddWave(vec2 dir, float amp, float lambda, float t, float steep, vec2 xz, inout vec3 T, inout vec3 B) {
  float k = 6.28318530718 / lambda;
  float c = sqrt(9.81 / k);
  float f = k * (dot(dir, xz) - c * t);
  float a = steep * amp;
  float s = sin(f);
  float ct = cos(f);
  T += vec3(-dir.x * dir.x * a * s, dir.x * a * ct, -dir.x * dir.y * a * s);
  B += vec3(-dir.x * dir.y * a * s, dir.y * a * ct, -dir.y * dir.y * a * s);
}

vec3 bayGerstnerNormal(vec3 wp, float t) {
  vec3 T = vec3(1.0, 0.0, 0.0);
  vec3 B = vec3(0.0, 0.0, 1.0);
  vec2 xz = wp.xz;
  float along = 2.8 * sin(wp.x * 0.021) + 1.6 * sin(wp.x * 0.047 + 1.3);
  vec2 shore = vec2(wp.x * 0.04, (uShoreZ - wp.z) + along);
  // 13.7 / 8.3 m coast-aligned crests (not the 19 m cascade)
  bayAddWave(normalize(vec2(0.08, 1.0)), 0.22, 13.7, t, 0.46, shore, T, B);
  bayAddWave(normalize(vec2(-0.12, 1.0)), 0.11, 8.3, t * 1.12, 0.38, shore, T, B);
  // 37.1 / 61.3 m incommensurate chop — breaks 19 m RepeatWrap beating
  bayAddWave(normalize(vec2(0.15, 1.0)), 0.09, 37.1, t * 0.72, 0.28, xz, T, B);
  bayAddWave(normalize(vec2(-0.22, 0.97)), 0.06, 61.3, t * 0.55, 0.22, xz, T, B);
  return normalize(cross(B, T));
}

float bayCrestFoam(vec3 wp, float t) {
  float along = 2.8 * sin(wp.x * 0.021) + 1.6 * sin(wp.x * 0.047 + 1.3);
  vec2 shore = vec2(wp.x * 0.04, (uShoreZ - wp.z) + along);
  vec2 d1 = normalize(vec2(0.08, 1.0));
  vec2 d2 = normalize(vec2(-0.12, 1.0));
  float k1 = 6.28318530718 / 13.7;
  float k2 = 6.28318530718 / 8.3;
  float f1 = k1 * (dot(d1, shore) - sqrt(9.81 / k1) * t);
  float f2 = k2 * (dot(d2, shore) - sqrt(9.81 / k2) * t * 1.12);
  float c = saturate(0.78 * cos(f1) + 0.46 * cos(f2) - 0.28);
  return c * c;
}

// Steepness proxy from Gerstner (Jacobian-like). Not the 19 m FFT fold.
float baySteepFoam(vec3 n) {
  return saturate((0.92 - n.y) * 2.4);
}`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
{
  vec2 plateUv = vec2(
    vBayWorld.x / 5000.0 + 0.5,
    (-1700.0 - vBayWorld.z) / 3600.0 + 0.5
  );
  float bayFoam = 0.0;
  #ifdef USE_EMISSIVEMAP
    bayFoam = texture2D(emissiveMap, plateUv).r;
  #endif
  float distOut = max(0.0, uShoreZ - vBayWorld.z);
  float shallow = 1.0 - saturate(distOut / 70.0);
  vec3 waterCol = mix(uBayDeep, uBayShallow, shallow * 0.72);
  float br = bayDepthBreak(vBayWorld.z);
  float crestFoam = bayCrestFoam(vBayWorld, uBayTime);
  float shoreCrest = crestFoam * br;
  vec3 gwCol = bayGerstnerNormal(vBayWorld, uBayTime);
  float steepFoam = baySteepFoam(gwCol) * (0.22 + 0.78 * br);
  float foamMix = saturate(pow(bayFoam, 0.82) * 0.95 + shoreCrest * 0.48 + steepFoam * 0.22);
  diffuseColor.rgb = mix(waterCol, uBayFoam, foamMix);
  // Crest scatter: light leaking through thin peaks (not a second material).
  float sss = saturate(1.0 - abs(gwCol.y)) * (0.18 + 0.55 * crestFoam) * (0.35 + 0.65 * shallow);
  diffuseColor.rgb += uBayScatter * sss * (1.0 - foamMix * 0.55);
  if (uCamUnder > 0.5) {
    vec3 underCol = mix(uBayShallow * 0.55, uBayDeep, 0.58);
    diffuseColor.rgb = mix(underCol, uBayFoam, foamMix * 0.16);
    diffuseColor.rgb += uBayScatter * 0.12;
  }
}`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
{
  float br = bayDepthBreak(vBayWorld.z);
  vec3 gw = bayGerstnerNormal(vBayWorld, uBayTime);
  vec3 gv = normalize((viewMatrix * vec4(gw, 0.0)).xyz);
  normal = normalize(mix(normal, gv, 0.42 + 0.38 * br));
}`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
{
  vec2 plateUvR = vec2(
    vBayWorld.x / 5000.0 + 0.5,
    (-1700.0 - vBayWorld.z) / 3600.0 + 0.5
  );
  float foamR = 0.0;
  #ifdef USE_EMISSIVEMAP
    foamR = texture2D(emissiveMap, plateUvR).r;
  #endif
  roughnessFactor = mix(roughnessFactor, 0.78, foamR);
  roughnessFactor = mix(roughnessFactor, 0.045, (1.0 - foamR) * 0.35);
}`,
    );
  };
}

/**
 * Build the single Biscayne mesh + CPU FFT sim.
 * Returns a handle with `.mesh`, `.update`, `.sampleHeight`, `.sim`.
 */
export function buildBayWater(ctx, opts = {}) {
  const { root, track } = ctx;
  const sim = createBaySim({
    ...opts,
    wakeN: FOAM_N, wakeW: BAY_W, wakeD: BAY_D, wakeX: BAY_X, wakeZ: BAY_Z,
  });
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
  encodeNormals(sim, normalBytes);
  encodeHeightFoam(sim, heightBytes, foamBytes, {
    n: FOAM_N, ripPoly: ripFromCurve, time: sim.time,
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
    roughness: 0.065,
    metalness: 0.0,
    ior: 1.333,
    specularIntensity: 1.0,
    envMapIntensity: 1.42,
    clearcoat: 0.82,
    clearcoatRoughness: 0.08,
    normalMap,
    normalScale: new THREE.Vector2(BAY_PRESET.scale, BAY_PRESET.scale),
    displacementMap,
    displacementScale: 0.22,
    displacementBias: -0.11,
    emissive: 0xf7f4ee,
    emissiveMap: foamMap,
    emissiveIntensity: 0.16,
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 2,
    fog: true,
    side: THREE.DoubleSide,
  }));
  applyCoastalOptics(mat);

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(BAY_X, BAY_Y, BAY_Z);
  mesh.renderOrder = -2;
  mesh.name = 'biscayne-bay';
  mesh.receiveShadow = true;
  mesh.userData.pwWater = true;
  mesh.userData.pwNoReflect = true;   // no planar reflector / SSR
  root.add(mesh);

  // No bag AABB on the bay — a 5 km box would sit under the city and fill
  // fly-unders. The craft dives; seabedHeight / groundHeight is the floor.

  const colorDay = new THREE.Color(BAY_COLOR);
  const colorNight = new THREE.Color(0x061114);
  let lastDayF = -1;

  const tint = (tod) => {
    const dayF = Math.max(0.04, Math.sin(Math.PI * clamp01((tod - 6.2) / 13.2)));
    if (Math.abs(dayF - lastDayF) < 0.008) return dayF;
    lastDayF = dayF;
    mat.color.copy(colorNight).lerp(colorDay, 0.12 + 0.88 * dayF);
    mat.envMapIntensity = 0.32 + 1.10 * dayF;
    mat.emissiveIntensity = 0.04 + 0.14 * dayF;
    mat.roughness = 0.055 + 0.18 * (1 - dayF);
    mat.clearcoat = 0.28 + 0.54 * dayF;
    return dayF;
  };

  let acc = 0;
  const STEP = 1 / 24;          // sim at 24 Hz — 256² FFT is cheap, not free

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
        // Stronger hull wash + short Kelvin arms. foamGain stays 0.
        // Plate encode (world metres) — do not retarget the reserved corridor.
        const amt = 0.28 * Math.min(dt, 0.08) * 60;
        const px = b.position.x, pz = b.position.z;
        sim.stampWake(px, pz, amt, 22);
        const yaw = b.rotation.y || 0;
        const hx = Math.cos(yaw), hz = -Math.sin(yaw);
        sim.stampWake(px - hx * 8, pz - hz * 8, amt * 0.62, 16);
        sim.stampWake(px - hx * 16 + hz * 6.5, pz - hz * 16 - hx * 6.5, amt * 0.42, 14);
        sim.stampWake(px - hx * 16 - hz * 6.5, pz - hz * 16 + hx * 6.5, amt * 0.42, 14);
      }
    }
    if (stepped) {
      encodeNormals(sim, normalBytes);
      encodeHeightFoam(sim, heightBytes, foamBytes, {
        n: FOAM_N, ripPoly: ripFromCurve, time: sim.time,
      });
      normalMap.needsUpdate = true;
      displacementMap.needsUpdate = true;
      foamMap.needsUpdate = true;
    }
    const sh = mat.userData.shader;
    if (sh) {
      sh.uniforms.uBayTime.value = sim.time;
      const cam = extras.camera;
      if (cam && cam.position) {
        sh.uniforms.uCamUnder.value = cam.position.y < 0 ? 1 : 0;
      }
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
