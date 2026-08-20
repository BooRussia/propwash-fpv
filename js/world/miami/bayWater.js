// One Biscayne Bay water system — MeshPhysicalMaterial, no Water.js,
// no custom shader graph, no Abyssal paste, no open-ocean far plate.
//
// WebGPU / TSL is preferred when the app renderer is a WebGPURenderer;
// this map still boots on WebGLRenderer, so the hero material is a stock
// MeshPhysicalMaterial (the allowed "no custom mat" path). SSR stays off.

import * as THREE from 'three';
import { BAY_PRESET, createBaySim } from './baySim.js';
import { clamp } from '../../core/state.js';
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

function encodeHeightFoam(sim, heightBytes, foamBytes) {
  const { n, height, foam } = sim;
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
    // Floor kills the salt-and-pepper leftovers; honest breaks stay.
    const raw = foam[i];
    const f = (raw <= 0.05 ? 0 : (raw - 0.05) / 0.95) * 255;
    foamBytes[p] = f;
    foamBytes[p + 1] = f;
    foamBytes[p + 2] = f;
    foamBytes[p + 3] = 255;
    p += 4;
  }
}

function makeDataTex(n, data) {
  const tex = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
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

  const normalBytes = new Uint8Array(n * n * 4);
  const heightBytes = new Uint8Array(n * n * 4);
  const foamBytes = new Uint8Array(n * n * 4);
  encodeNormals(sim, normalBytes);
  encodeHeightFoam(sim, heightBytes, foamBytes);

  const normalMap = track(makeDataTex(n, normalBytes));
  const displacementMap = track(makeDataTex(n, heightBytes));
  const foamMap = track(makeDataTex(n, foamBytes));
  applyRepeat(normalMap, BAY_W, BAY_D, L);
  applyRepeat(displacementMap, BAY_W, BAY_D, L);
  applyRepeat(foamMap, BAY_W, BAY_D, L);

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
    const dayF = Math.max(0.04, Math.sin(Math.PI * clamp((tod - 6.2) / 13.2, 0, 1)));
    if (Math.abs(dayF - lastDayF) < 0.008) return dayF;
    lastDayF = dayF;
    mat.color.copy(colorNight).lerp(colorDay, 0.12 + 0.88 * dayF);
    mat.envMapIntensity = 0.22 + 0.68 * dayF;
    mat.emissiveIntensity = 0.06 + 0.20 * dayF;
    mat.roughness = 0.14 + 0.16 * (1 - dayF);
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
        // Hull stamp only — do not move the reserved-corridor placer.
        sim.stampWake(b.position.x, b.position.z, 0.055 * Math.min(dt, 0.08) * 60, 1.8);
      }
    }
    if (stepped) {
      encodeNormals(sim, normalBytes);
      encodeHeightFoam(sim, heightBytes, foamBytes);
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
});
