// ============================================================
// PropWash FPV — vegetation
// Hero coconut palms, instanced palm fields, GLTF photoscan
// scattering and a reusable wind-sway shader helper.
//
// Public API (consumed by miami.js / procedural.js):
//   buildPalm(rng)                              -> Promise<THREE.Group> (hero palm, origin at trunk base)
//   createPalms(count)                          -> { group, placeAt, finalize, update, dispose }
//   scatterModels(scene, slug, placements,
//                 colliderList, colliderSize)   -> { group, dispose } | null
//   windSwayMaterial(mat)                       -> mat (sway shader injected)
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
//     ~6-8k tris, shared/instanced).
//
// Everything degrades gracefully when assets/ is empty (the crown
// needs no textures at all). Shared geometry/material caches live at
// module level and are NEVER freed by per-call dispose() functions.
// ============================================================

import * as THREE from 'three';
import { assetLib } from '../core/assets.js';

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

// ---------------- scratch objects (no per-frame allocations) ----------------
const _UP = new THREE.Vector3(0, 1, 0);
const _X = new THREE.Vector3(1, 0, 0);
const _m4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _pos = new THREE.Vector3();
const _scl = new THREE.Vector3();

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

// ============================================================
// Wind sway shader — shifts vertices in x/z by sin(time + world
// position), scaled by height above the instance origin. Injected
// via onBeforeCompile; a constant customProgramCacheKey means all
// swaying materials share one extra shader program.
// ============================================================
export function windSwayMaterial(mat) {
  if (!mat || !mat.isMaterial) return mat;
  if (mat.userData.swayTime) return mat; // already injected
  const uTime = { value: 0 };
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

// ---------------- shared unit sphere (coconuts) ----------------
let _unitSphere = null;
function getUnitSphere() {
  if (!_unitSphere) _unitSphere = new THREE.SphereGeometry(1, 8, 6);
  return _unitSphere;
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
// Returns { geometry, top, tangent }.
function buildTrunkGeometry(spec, radial = 12) {
  const RINGS = 72;
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
// toward the tip. `opts`: { length, pairs, dead }.
function addFrond(gb, m, rnd, opts) {
  const dead = !!opts.dead;
  const L = opts.length;
  const SEG = 10;

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

  // ---- rachis: tapering diamond-section tube (SEG rings x 4 verts) ----
  const ringIdx = [];
  for (let i = 0; i <= SEG; i++) {
    const t = i / SEG;
    const sinA = Math.sin(ang[i]), cosA = Math.cos(ang[i]);
    const hw = 0.05 * (1 - 0.84 * t) + 0.008;  // width (z)
    const hv = 0.038 * (1 - 0.84 * t) + 0.006; // height (in-plane normal)
    const nx = -sinA, ny = cosA;
    cTmp.copy(cRachis).lerp(cBase, Math.min(1, t * 1.4));
    const r0 = gb.vert(V.set(px[i] + nx * hv, py[i] + ny * hv, 0).applyMatrix4(m), cTmp);
    const r1 = gb.vert(V.set(px[i], py[i], hw).applyMatrix4(m), cTmp);
    const r2 = gb.vert(V.set(px[i] - nx * hv, py[i] - ny * hv, 0).applyMatrix4(m), cTmp);
    const r3 = gb.vert(V.set(px[i], py[i], -hw).applyMatrix4(m), cTmp);
    ringIdx.push(r0, r1, r2, r3);
    if (i > 0) {
      const p = (i - 1) * 4, c = i * 4;
      for (let k = 0; k < 4; k++) {
        const k2 = (k + 1) % 4;
        gb.quad(ringIdx[p + k], ringIdx[p + k2], ringIdx[c + k2], ringIdx[c + k]);
      }
    }
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

      // 3 stations: base, mid (55%), tip — with quadratic droop
      q0.set(bx, by, 0);
      q1.set(bx, by, 0).addScaledVector(dirV, len * 0.55); q1.y -= len * droopK * 0.30;
      q2.set(bx, by, 0).addScaledVector(dirV, len);        q2.y -= len * droopK;

      const bJ = 0.88 + rnd() * 0.24; // per-leaflet brightness
      // dark near the rachis (self-shadowed core), rich green mid-blade,
      // bleached tips
      const c0 = cTmp.copy(cDeep).lerp(cBase, 0.35 + 0.3 * t).multiplyScalar(bJ * 0.9);
      const hw0 = 0.032 * (0.75 + lenNorm * 0.45), hw1 = hw0 * 0.72, hw2 = hw0 * 0.10;
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
// never kinks off the trunk). Target ~6-8k tris.
function buildCrownGeometry(top, tangent, rnd, frondCount) {
  const gb = new GeomBuilder();
  // soften the trunk-tip tangent: crowns sit mostly upright
  const upTangent = new THREE.Vector3()
    .copy(tangent).multiplyScalar(0.5).addScaledVector(_UP, 0.5).normalize();
  const crownQ = new THREE.Quaternion().setFromUnitVectors(_UP, upTangent);
  const crownM = new THREE.Matrix4().compose(top, crownQ, new THREE.Vector3(1, 1, 1));
  const m = new THREE.Matrix4();
  const rot = new THREE.Matrix4();
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
      .multiply(_m4.makeRotationZ(pitch));
    addFrond(gb, m, rnd, {
      length: (3.3 + rnd() * 1.2) * lenScale,   // ~3.2..4.5 m
      pairs: 26 + Math.floor(rnd() * 9),        // 26..34 pairs
      dead: false,
    });
  }

  // 3-5 dead fronds hanging almost vertically against the trunk
  const deadN = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < deadN; i++) {
    const az = rnd() * Math.PI * 2;
    const pitch = (-56 - rnd() * 12) * DEG2RAD;   // + rachis profile ≈ -75..-110 deg overall
    m.copy(crownM)
      .multiply(rot.makeTranslation(0, -0.22, 0))
      .multiply(_m4.makeRotationY(az));
    m.multiply(rot.makeRotationZ(pitch));
    addFrond(gb, m, rnd, {
      length: 2.4 + rnd() * 0.8,
      pairs: 16 + Math.floor(rnd() * 6),
      dead: true,
    });
  }

  // spear leaf
  addSpear(gb, crownM, rnd);

  // 2-4 coconuts tucked under the fronds
  const cocoN = 2 + Math.floor(rnd() * 3);
  const cocoCol = new THREE.Color(COCONUT);
  const sphere = getUnitSphere();
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
// 2) Instanced palm field — trunks + crowns as two InstancedMeshes
//    sharing ONE trunk geometry and ONE merged crown geometry.
// ============================================================
let _fieldResPromise = null;
function getFieldResources() {
  if (!_fieldResPromise) {
    _fieldResPromise = (async () => {
      const trunkMat = await getTrunkMaterial();
      const rnd = mulberry32(0xF1E7D002); // deterministic representative palm
      const spec = makePalmSpec(rnd);
      spec.height = 8.2;
      spec.rBase = 0.19;
      spec.leanRad = 5 * DEG2RAD;
      spec.sBend = 0.5;
      const trunk = buildTrunkGeometry(spec, 12);
      const crownGeo = buildCrownGeometry(trunk.top, trunk.tangent, rnd, 15);
      return { trunkGeo: trunk.geometry, crownGeo, trunkMat };
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

  const trunkIM = new THREE.InstancedMesh(res.trunkGeo, res.trunkMat, n);
  trunkIM.castShadow = castShadow;
  trunkIM.receiveShadow = true;

  // per-call material clone so each field owns its sway clock; the shared
  // program cache key keeps this to a single extra shader compile.
  const crownMat = windSwayMaterial(getCrownMaterial().clone());
  const crownIM = new THREE.InstancedMesh(res.crownGeo, crownMat, n);
  crownIM.castShadow = castShadow;
  crownIM.receiveShadow = true;

  group.add(trunkIM);
  group.add(crownIM);
  const uTime = crownMat.userData.swayTime;

  return {
    group,
    placeAt(i, x, y, z, scale = 1, rotY = 0) {
      if (i < 0 || i >= n) return;
      _pos.set(x, y, z);
      _quat.setFromAxisAngle(_UP, rotY);
      _scl.set(scale, scale, scale);
      _m4.compose(_pos, _quat, _scl);
      trunkIM.setMatrixAt(i, _m4);
      crownIM.setMatrixAt(i, _m4);
    },
    finalize(used) {
      const c = used === undefined ? n : Math.max(0, Math.min(used, n));
      trunkIM.count = c;
      crownIM.count = c;
      trunkIM.instanceMatrix.needsUpdate = true;
      crownIM.instanceMatrix.needsUpdate = true;
      trunkIM.computeBoundingSphere();
      crownIM.computeBoundingSphere();
    },
    update(dt) {
      uTime.value += dt; // sway clock — the only per-frame work, no allocations
    },
    dispose() {
      group.removeFromParent();
      trunkIM.dispose();          // frees instance buffers, not shared geometry
      crownIM.dispose();
      crownMat.dispose();         // per-call clone; shared textures/geometry survive
    },
  };
}

// ============================================================
// 3) GLTF photoscan scattering
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

  for (let i = 0; i < placements.length; i++) {
    const p = placements[i];
    const s = p.scale === undefined ? 1 : p.scale;
    _pos.set(p.x, p.y, p.z);
    _quat.setFromAxisAngle(_UP, p.rotY || 0);
    _scl.set(s, s, s);
    _m4.compose(_pos, _quat, _scl);
    inst.setMatrixAt(i, _m4);
    if (wantColliders && i < COLLIDER_LIMIT) {
      const hw = colliderSize.w * s * 0.5;
      colliderList.push({
        min: new THREE.Vector3(p.x - hw, p.y, p.z - hw),
        max: new THREE.Vector3(p.x + hw, p.y + colliderSize.h * s, p.z + hw),
      });
    }
  }
  inst.finalize(placements.length);
  const group = inst.group;
  group.name = `scatter-${slug}`;
  scene.add(group);

  return {
    group,
    dispose() {
      group.removeFromParent();
      group.traverse((o) => { if (o.isInstancedMesh) o.dispose(); });
      // geometries/materials belong to the AssetLibrary cache — not freed here
    },
  };
}
