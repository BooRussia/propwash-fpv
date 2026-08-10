// ============================================================
// PropWash FPV — vegetation
// Hero coconut palms, instanced palm fields, GLTF photoscan
// scattering and a reusable wind-sway shader helper.
//
// Public API (consumed by miami.js / procedural.js):
//   buildPalm(rng)                              -> THREE.Group (hero palm, origin at trunk base)
//   createPalms(count)                          -> { group, placeAt, finalize, update, dispose }
//   scatterModels(scene, slug, placements,
//                 colliderList, colliderSize)   -> { group, dispose } | null
//   windSwayMaterial(mat)                       -> mat (sway shader injected)
//
// Everything degrades gracefully when assets/ is empty: the palm
// bark falls back to a plain brown material and the frond foliage
// is generated procedurally on a canvas, so palms always render.
// Shared geometry/texture/material caches live at module level and
// are NEVER freed by the per-call dispose() functions.
// ============================================================

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { assetLib } from '../core/assets.js';

// ---------------- tunables ----------------
const FROND_LENGTH = 3.5;            // m
const FROND_WIDTH = 0.9;             // m
const FROND_SEGMENTS = 8;            // along length
const FROND_ALPHA_TEST = 0.35;
const FROND_DROOP = 1.15;            // m the tip drops below the blade axis
const FIELD_FROND_COUNT = 11;        // fronds on the shared instanced crown
const SWAY_AMPLITUDE = 0.02;         // m of sway per m of height above instance origin
const SHADOW_INSTANCE_LIMIT = 24;    // instanced sets at/below this cast shadows
const COLLIDER_LIMIT = 60;           // max AABBs pushed by scatterModels
const DEG2RAD = Math.PI / 180;

// ---------------- scratch objects (no per-frame allocations) ----------------
const _UP = new THREE.Vector3(0, 1, 0);
const _m4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _pos = new THREE.Vector3();
const _scl = new THREE.Vector3();

// ---------------- deterministic rng (canvas + shared field geometry) ----------------
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
// Canvas-generated pinnate frond texture (shared, built once)
// ============================================================
function drawFrondCanvas(alphaOnly) {
  const w = 512, h = 256;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  if (alphaOnly) { ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, w, h); }
  const midY = h / 2;
  ctx.lineCap = 'round';

  // rachis: tapering central stem, base (u=0) -> tip (u=1)
  const rx = (t) => 6 + t * (w - 16);
  const rachisSegs = 24;
  for (let s = 0; s < rachisSegs; s++) {
    const t0 = s / rachisSegs, t1 = (s + 1) / rachisSegs;
    ctx.strokeStyle = alphaOnly ? '#ffffff' : `hsl(${80 - t0 * 10}, 40%, ${33 - t0 * 7}%)`;
    ctx.lineWidth = 6.5 * (1 - 0.78 * t0) + 1.2;
    ctx.beginPath();
    ctx.moveTo(rx(t0), midY);
    ctx.lineTo(rx(t1) + 1, midY);
    ctx.stroke();
  }

  // ~40 leaflet pairs angled off the rachis, sweeping toward the tip.
  // Deterministic rng so the color pass and the alpha pass are identical.
  const rnd = mulberry32(0x50414C4D); // 'PALM'
  const pairs = 40;
  for (let i = 0; i < pairs; i++) {
    const t = i / (pairs - 1);
    const x = 10 + t * (w - 34);
    const lenShape = Math.pow(Math.sin(Math.PI * Math.min(0.999, 0.08 + 0.9 * t)), 0.65);
    const len = (h * 0.47) * (0.3 + 0.7 * lenShape);
    for (const dir of [-1, 1]) {
      // consume the rng identically on both passes
      const angJit = (rnd() - 0.5) * 10;
      const hue = 96 + rnd() * 30;
      const sat = 42 + rnd() * 14;
      const lit = 26 + rnd() * 12;
      const lw = 2.6 + rnd() * 1.6;
      const angle = (58 - 20 * t + angJit) * DEG2RAD;
      const dx = Math.cos(angle) * len;
      const dy = -dir * Math.sin(angle) * len;
      ctx.strokeStyle = alphaOnly ? '#ffffff' : `hsl(${hue}, ${sat}%, ${lit}%)`;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(x, midY);
      ctx.quadraticCurveTo(x + dx * 0.45, midY + dy * 0.3, x + dx, midY + dy);
      ctx.stroke();
    }
  }
  return cv;
}

// Curved tapered frond blade: length along +X (base at origin),
// width along Z, drooping in -Y toward the tip.
function buildFrondGeometry() {
  const geo = new THREE.PlaneGeometry(FROND_LENGTH, FROND_WIDTH, FROND_SEGMENTS, 1);
  geo.translate(FROND_LENGTH / 2, 0, 0); // base at x=0
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getX(i) / FROND_LENGTH;
    pos.setY(i, pos.getY(i) * (1 - 0.72 * t));        // taper width toward tip
    pos.setZ(i, -FROND_DROOP * t * t);                // droop (becomes -Y after rotate)
  }
  geo.rotateX(-Math.PI / 2); // (x, y, z) -> (x, z, -y): length X, width Z, droop -Y
  geo.computeVertexNormals();
  return ensureUV2(geo);
}

let _frond = null;
function getFrondAssets() {
  if (_frond) return _frond;
  const colorTex = new THREE.CanvasTexture(drawFrondCanvas(false));
  colorTex.colorSpace = THREE.SRGBColorSpace;
  colorTex.anisotropy = 4;
  const alphaTex = new THREE.CanvasTexture(drawFrondCanvas(true));
  alphaTex.anisotropy = 4;
  const material = new THREE.MeshStandardMaterial({
    map: colorTex,
    alphaMap: alphaTex,
    alphaTest: FROND_ALPHA_TEST,
    side: THREE.DoubleSide,
    roughness: 0.85,
    metalness: 0,
  });
  // alpha-tested shadows (default depth material would shadow the full quad)
  const depthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map: colorTex,
    alphaTest: FROND_ALPHA_TEST,
  });
  const geometry = buildFrondGeometry();
  _frond = { geometry, material, depthMaterial, colorTex, alphaTex };
  return _frond;
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
            return await assetLib.pbrMaterial('bark_palm', { repeat: [2, 6], roughness: 0.95 });
          }
        }
      } catch (e) { /* fall through to plain material */ }
      return new THREE.MeshStandardMaterial({ color: 0x7d5a3c, roughness: 0.95 });
    })();
  }
  return _trunkMatPromise;
}

// ---------------- small shared geometries ----------------
let _ringGeo = null;
function getRingGeometry() {
  if (!_ringGeo) _ringGeo = ensureUV2(new THREE.CylinderGeometry(1, 1, 1, 8, 1, true));
  return _ringGeo;
}

let _cocoGeo = null;
function getCoconutGeometry() {
  if (!_cocoGeo) _cocoGeo = new THREE.SphereGeometry(0.12, 10, 8);
  return _cocoGeo;
}

let _cocoMat = null;
function getCoconutMaterial() {
  if (!_cocoMat) _cocoMat = new THREE.MeshStandardMaterial({ color: 0x5c4326, roughness: 0.9 });
  return _cocoMat;
}

// ============================================================
// Palm construction internals
// ============================================================
function makePalmSpec(rnd) {
  return {
    height: 6 + rnd() * 3,                          // 6..9 m
    leanRad: (5 + rnd() * 10) * DEG2RAD,            // 5..15 deg
    leanAz: rnd() * Math.PI * 2,
    bendBias: 0.3 + rnd() * 0.4,                    // lower = curvier trunk
    frondCount: 9 + Math.floor(rnd() * 5),          // 9..13
  };
}

// Curved tapering trunk (0.22 m -> 0.12 m) along a quadratic bezier,
// with leaf-scar ring detail baked in near the top. UVs are swapped so
// repeat [2, 6] means 2 tiles around the girth and 6 up the height.
// Returns { geometry, top, tangent }.
function buildTrunkGeometry(spec) {
  const R_BASE = 0.22, R_TIP = 0.12;
  const TUBULAR = 12, RADIAL = 7;
  const lateral = Math.sin(spec.leanRad) * spec.height;
  const dirX = Math.cos(spec.leanAz), dirZ = Math.sin(spec.leanAz);
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(dirX * lateral * 0.5 * spec.bendBias, spec.height * 0.52, dirZ * lateral * 0.5 * spec.bendBias),
    new THREE.Vector3(dirX * lateral, Math.cos(spec.leanRad) * spec.height, dirZ * lateral),
  );
  const tube = new THREE.TubeGeometry(curve, TUBULAR, R_BASE, RADIAL, false);
  const pos = tube.attributes.position;
  const uv = tube.attributes.uv;
  const ringSize = RADIAL + 1;
  const center = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const ring = Math.floor(i / ringSize);
    const t = ring / TUBULAR;
    curve.getPointAt(t, center); // TubeGeometry samples arc-length parameterized points
    const k = (R_BASE + (R_TIP - R_BASE) * t) / R_BASE;
    pos.setXYZ(i,
      center.x + (pos.getX(i) - center.x) * k,
      center.y + (pos.getY(i) - center.y) * k,
      center.z + (pos.getZ(i) - center.z) * k);
    uv.setXY(i, uv.getY(i), uv.getX(i)); // u = around, v = along length
  }
  tube.computeVertexNormals();
  ensureUV2(tube);

  const top = curve.getPointAt(1);
  const tangent = curve.getTangentAt(1);

  // leaf-scar rings just below the crown, oriented along the trunk tip
  const crownM = new THREE.Matrix4().compose(top, _quat.setFromUnitVectors(_UP, tangent), _scl.set(1, 1, 1));
  const local = new THREE.Matrix4();
  const parts = [tube];
  const ringGeo = getRingGeometry();
  for (let k = 0; k < 3; k++) {
    const r = 0.128 + k * 0.016;
    local.compose(_pos.set(0, -0.1 - k * 0.16, 0), _quat.identity(), _scl.set(r, 0.07, r));
    const g = ringGeo.clone();
    g.applyMatrix4(_m4.multiplyMatrices(crownM, local));
    parts.push(g);
  }
  let geometry;
  try {
    geometry = mergeGeometries(parts, false);
    for (const p of parts) p.dispose();
  } catch (e) {
    geometry = tube; // rings are cosmetic — trunk alone is fine
  }
  ensureUV2(geometry);
  return { geometry, top, tangent };
}

// Merged crown: `count` frond blades baked into one geometry, positioned
// at `top` and tilted along `tangent`. Upper fronds sit ~20 deg above the
// horizontal, lower fronds droop ~40 deg below.
function buildCrownGeometry(top, tangent, rnd, count) {
  const frond = getFrondAssets();
  const crownQ = new THREE.Quaternion().setFromUnitVectors(_UP, tangent);
  const e = new THREE.Euler(0, 0, 0, 'YZX');
  const q = new THREE.Quaternion();
  const m = new THREE.Matrix4();
  const one = new THREE.Vector3(1, 1, 1);
  const parts = [];
  for (let i = 0; i < count; i++) {
    const layer = i % 3;
    const az = (i / count) * Math.PI * 2 + (rnd() - 0.5) * 0.5;
    const basePitch = layer === 0 ? 20 : layer === 1 ? -10 : -40;
    const pitch = (basePitch + (rnd() - 0.5) * 12) * DEG2RAD;
    const roll = (rnd() - 0.5) * 0.2;
    e.set(roll, az, pitch);
    q.copy(crownQ).multiply(_quat.setFromEuler(e));
    m.compose(top, q, one);
    parts.push(frond.geometry.clone().applyMatrix4(m));
  }
  let merged;
  try {
    merged = mergeGeometries(parts, false);
    for (const p of parts) p.dispose();
  } catch (e2) {
    merged = parts[0]; // degenerate but visible
    for (let i = 1; i < parts.length; i++) parts[i].dispose();
  }
  return ensureUV2(merged);
}

// ============================================================
// 1) Hero palm — one unique coconut palm, origin at trunk base
// ============================================================
export async function buildPalm(rng) {
  const rnd = typeof rng === 'function' ? rng : Math.random;
  const spec = makePalmSpec(rnd);
  const frond = getFrondAssets();
  const trunkMat = await getTrunkMaterial();
  const group = new THREE.Group();
  group.name = 'palm-hero';

  // trunk (+ leaf-scar rings, merged: 1 draw call)
  const trunk = buildTrunkGeometry(spec);
  const trunkMesh = new THREE.Mesh(trunk.geometry, trunkMat);
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  group.add(trunkMesh);

  // crown (all fronds merged: 1 draw call, alpha-tested shadows)
  const crownGeo = buildCrownGeometry(trunk.top, trunk.tangent, rnd, spec.frondCount);
  const crownMesh = new THREE.Mesh(crownGeo, frond.material);
  crownMesh.customDepthMaterial = frond.depthMaterial;
  crownMesh.castShadow = true;
  crownMesh.receiveShadow = true;
  group.add(crownMesh);

  // 2-4 coconuts tucked under the crown (merged: 1 draw call)
  const cocoCount = 2 + Math.floor(rnd() * 3);
  const crownM = new THREE.Matrix4().compose(trunk.top, _quat.setFromUnitVectors(_UP, trunk.tangent), _scl.set(1, 1, 1));
  const local = new THREE.Matrix4();
  const cocoParts = [];
  const cocoGeo = getCoconutGeometry();
  for (let i = 0; i < cocoCount; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = 0.16 + rnd() * 0.1;
    const s = 0.8 + rnd() * 0.4;
    local.compose(
      _pos.set(Math.cos(a) * rad, -0.3 - rnd() * 0.12, Math.sin(a) * rad),
      _quat.identity(),
      _scl.set(s, s, s));
    cocoParts.push(cocoGeo.clone().applyMatrix4(_m4.multiplyMatrices(crownM, local)));
  }
  try {
    const cocoMerged = mergeGeometries(cocoParts, false);
    for (const p of cocoParts) p.dispose();
    const cocoMesh = new THREE.Mesh(cocoMerged, getCoconutMaterial());
    cocoMesh.castShadow = true;
    cocoMesh.receiveShadow = true;
    group.add(cocoMesh);
  } catch (e) {
    for (const p of cocoParts) p.dispose(); // coconuts are optional garnish
  }

  group.rotation.y = rnd() * Math.PI * 2;
  return group;
}

// ============================================================
// 2) Instanced palm field — trunks + crowns as two InstancedMeshes
// ============================================================
let _fieldResPromise = null;
function getFieldResources() {
  if (!_fieldResPromise) {
    _fieldResPromise = (async () => {
      const trunkMat = await getTrunkMaterial();
      const rnd = mulberry32(0xF1E7D001); // deterministic representative palm
      const spec = makePalmSpec(rnd);
      spec.height = 7.4;
      spec.leanRad = 8 * DEG2RAD;
      spec.bendBias = 0.5;
      const trunk = buildTrunkGeometry(spec);
      const crownGeo = buildCrownGeometry(trunk.top, trunk.tangent, rnd, FIELD_FROND_COUNT);
      return { trunkGeo: trunk.geometry, crownGeo, trunkMat };
    })();
  }
  return _fieldResPromise;
}

export async function createPalms(count) {
  const res = await getFieldResources();
  const frond = getFrondAssets();
  const n = Math.max(0, count | 0);
  const castShadow = n > 0 && n <= SHADOW_INSTANCE_LIMIT;

  const group = new THREE.Group();
  group.name = 'palm-field';

  const trunkIM = new THREE.InstancedMesh(res.trunkGeo, res.trunkMat, n);
  trunkIM.castShadow = castShadow;
  trunkIM.receiveShadow = true;

  // per-call material clone so each field owns its sway clock; the shared
  // program cache key keeps this to a single extra shader compile.
  const crownMat = windSwayMaterial(frond.material.clone());
  const crownIM = new THREE.InstancedMesh(res.crownGeo, crownMat, n);
  crownIM.customDepthMaterial = frond.depthMaterial;
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
      crownMat.dispose();         // per-call clone; shared canvas textures survive
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
