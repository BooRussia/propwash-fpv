import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cBox, cCyl, cSph, cTorus, cTube } from '../geo.js';

// Utilities / power catalog builders. Origin at local ground (y = 0).
// Vertex colours only — never a window atlas on +Y. hash01 if a pick is
// needed; do not call rng/rng2/rng3/rng4.

const WOOD = 0x6a5344;
const WOOD2 = 0x4e3d32;
const CONC = 0x9a9488;
const STEEL = 0x6d747c;
const STEEL2 = 0x4a5158;
const PORC = 0xd4cbb8;
const WIRE = 0x2c3238;
const GALV = 0x8a9298;
const GALV2 = 0x5c656c;
const IRON = 0x3a3e42;
const IRON2 = 0x2a2e32;
const RED = 0xd63426;
const BRASS = 0xb08a4a;

function merge(G) {
  const m = mergeGeometries(G);
  G.forEach((g) => g.dispose());
  return m;
}

function pinInsulator(G, x, y, z) {
  G.push(cCyl(0.01, 0.01, 0.1, 6, STEEL, x, y + 0.02, z));
  G.push(cCyl(0.042, 0.068, 0.032, 8, PORC, x, y + 0.08, z));
  G.push(cCyl(0.038, 0.062, 0.028, 8, PORC, x, y + 0.112, z));
  G.push(cCyl(0.012, 0.018, 0.018, 6, STEEL, x, y + 0.136, z));
}

/**
 * Wood utility pole + crossarm. Origin at ground.
 * Shaft / crossarm / insulators / concrete base. Collider ~Ø0.4 × 9.5 m.
 */
export function buildUtilityPoleWoodGeo() {
  const G = [
    cCyl(0.28, 0.3, 0.18, 10, CONC, 0, 0.09, 0),
    cCyl(0.12, 0.2, 9.32, 10, WOOD, 0, 4.84, 0),
    cCyl(0.04, 0.04, 0.28, 6, STEEL, 0, 9.44, 0),
    cBox(0.12, 0.1, 2.2, WOOD2, 0, 8.55, 0),
    cBox(0.08, 0.08, 1.35, WOOD2, 0, 7.72, 0),
    cBox(0.12, 0.42, 0.08, WOOD2, 0, 8.28, 0),
    cBox(0.1, 0.04, 0.16, STEEL, 0.14, 2.1, 0),
  ];
  pinInsulator(G, 0, 8.6, -0.75);
  pinInsulator(G, 0, 8.6, 0);
  pinInsulator(G, 0, 8.6, 0.75);
  for (const sz of [-0.48, 0.48]) {
    G.push(cCyl(0.035, 0.035, 0.07, 8, PORC, 0.09, 7.72, sz, 0, 0, Math.PI / 2));
    G.push(cCyl(0.048, 0.048, 0.016, 8, PORC, 0.13, 7.72, sz, 0, 0, Math.PI / 2));
  }
  for (let i = 0; i < 12; i++) {
    const y = 2.35 + i * 0.48;
    G.push(cBox(0.11, 0.03, 0.04, STEEL, 0.2, y, 0));
  }
  return merge(G);
}

/**
 * Sagging three-wire span. Origin at first-pole ground, run along +X.
 * Default 28 m matches alley pole spacing. Tubes, not a painted texture.
 */
export function buildPowerSpanGeo(opts = {}) {
  const span = opts.span ?? 28;
  const y0 = 8.72;
  const sag = 1.05;
  const zs = [-0.75, 0, 0.75];
  const segs = 10;
  const G = [];
  for (const z of zs) {
    let prev = new THREE.Vector3(0, y0, z);
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const p = new THREE.Vector3(t * span, y0 - sag * 4 * t * (1 - t), z);
      G.push(cTube(prev, p, 0.02, 5, WIRE));
      prev = p;
    }
  }
  return merge(G);
}

/**
 * Pole-mount transformer can. Origin at bracket underside (place at mount y).
 * Can / bushings / bracket. Fits ~Ø0.56 × 0.7 m collider.
 */
export function buildPoleTransformerGeo() {
  const G = [
    cBox(0.08, 0.08, 0.42, STEEL2, 0, 0.04, 0.02),
    cBox(0.05, 0.58, 0.05, STEEL2, -0.12, 0.33, 0.18),
    cBox(0.05, 0.58, 0.05, STEEL2, 0.12, 0.33, 0.18),
    cCyl(0.24, 0.24, 0.52, 12, GALV, 0, 0.34, 0),
    cCyl(0.25, 0.25, 0.03, 12, STEEL2, 0, 0.09, 0),
    cCyl(0.25, 0.25, 0.03, 12, STEEL2, 0, 0.59, 0),
    cBox(0.1, 0.06, 0.02, 0x3a4046, 0, 0.38, -0.25),
  ];
  for (const a of [0, 1, 2, 3, 4, 5]) {
    const ang = a * Math.PI / 3 + 0.2;
    G.push(cBox(0.012, 0.4, 0.055, GALV2,
      Math.sin(ang) * 0.25, 0.34, Math.cos(ang) * 0.25, 0, ang, 0));
  }
  for (const sx of [-0.09, 0.09]) {
    G.push(cCyl(0.018, 0.018, 0.08, 6, STEEL, sx, 0.64, 0));
    G.push(cCyl(0.032, 0.04, 0.05, 8, PORC, sx, 0.7, 0));
    G.push(cCyl(0.012, 0.012, 0.04, 6, STEEL, sx, 0.74, 0));
  }
  for (const sx of [-0.1, 0, 0.1]) {
    G.push(cCyl(0.016, 0.02, 0.05, 6, PORC, sx, 0.22, -0.26, Math.PI / 2, 0, 0));
  }
  return merge(G);
}

/**
 * Signal controller cabinet. Origin at ground.
 * Door / vents / sides / concrete pad. ~0.7 × 1.35 × 0.5 m.
 */
export function buildTrafficCabinetGeo() {
  const G = [
    cBox(0.78, 0.08, 0.56, CONC, 0, 0.04, 0),
    cBox(0.68, 1.2, 0.46, GALV2, 0, 0.68, 0),
    cBox(0.7, 0.05, 0.48, STEEL2, 0, 1.305, 0),
    cBox(0.56, 1.04, 0.02, GALV, 0, 0.7, -0.241),
    cBox(0.04, 0.14, 0.03, STEEL, 0.2, 0.7, -0.26),
    cBox(0.03, 0.05, 0.02, 0xc9a227, 0.2, 0.62, -0.265),
    cBox(0.18, 0.08, 0.01, 0x3a4046, -0.12, 1.08, -0.252),
    cBox(0.08, 0.08, 0.04, 0x2a2e32, 0.22, 1.14, -0.25),
  ];
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      G.push(cBox(0.02, 0.03, 0.28, STEEL, sx * 0.351, 0.42 + i * 0.14, 0));
    }
  }
  for (const sx of [-0.3, 0.3]) {
    for (const sz of [-0.2, 0.2]) {
      G.push(cCyl(0.02, 0.02, 0.04, 6, STEEL2, sx, 0.1, sz));
    }
  }
  return merge(G);
}

/**
 * Flush manhole cover. Origin at street. Lid top + rim; no window atlas on +Y.
 */
export function buildManholeCoverGeo() {
  const G = [
    cTorus(0.34, 0.028, 6, 16, IRON2, 0, 0.022, 0, Math.PI / 2),
    cCyl(0.325, 0.325, 0.028, 16, IRON, 0, 0.016, 0),
    cCyl(0.22, 0.22, 0.01, 12, IRON2, 0, 0.032, 0),
    cCyl(0.1, 0.1, 0.01, 10, IRON2, 0, 0.033, 0),
    cCyl(0.025, 0.025, 0.012, 8, 0x1a1c1e, 0.18, 0.034, 0),
  ];
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    G.push(cBox(0.3, 0.008, 0.028, IRON2,
      Math.sin(a) * 0.12, 0.032, Math.cos(a) * 0.12, 0, a, 0));
  }
  return merge(G);
}

/**
 * Building standpipe Siamese. Origin at ground, plate on +Z (wall), ports −Z.
 * Ports / body / wall plate. ~0.45 × 0.7 × 0.25 m.
 */
export function buildStandpipeSiameseGeo() {
  const G = [
    cBox(0.42, 0.62, 0.03, STEEL2, 0, 0.35, 0.115),
    cBox(0.16, 0.22, 0.14, RED, 0, 0.4, 0.02),
    cCyl(0.05, 0.05, 0.1, 8, RED, 0, 0.52, 0.02),
    cCyl(0.02, 0.02, 0.06, 6, STEEL, 0, 0.28, -0.04, Math.PI / 2),
    cBox(0.08, 0.08, 0.02, 0xc9a227, 0, 0.58, 0.1),
  ];
  for (const s of [-1, 1]) {
    const yaw = s * 0.55;
    G.push(cCyl(0.05, 0.05, 0.16, 8, RED, s * 0.11, 0.4, -0.1, Math.PI / 2, yaw, 0));
    G.push(cCyl(0.058, 0.058, 0.04, 8, BRASS, s * 0.16, 0.4, -0.155, Math.PI / 2, yaw, 0));
    G.push(cCyl(0.042, 0.042, 0.035, 6, RED, s * 0.185, 0.4, -0.185, Math.PI / 2, yaw, 0));
    G.push(cSph(0.03, 6, 5, BRASS, s * 0.2, 0.4, -0.205));
  }
  return merge(G);
}

export const BUILDERS = {
  'pole-authored': buildUtilityPoleWoodGeo,
  'power-span': buildPowerSpanGeo,
  'transformer': buildPoleTransformerGeo,
  'traffic-cabinet': buildTrafficCabinetGeo,
  'manhole': buildManholeCoverGeo,
  'fire-dept-siamese': buildStandpipeSiameseGeo,
};
