import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { colorFill, zeroUV, cBox, cCyl, tubeBetween } from '../geo.js';

// ---------- boats v2 ----------
// Lofted hull with sheer curve + bow taper. Station tables: half-beam,
// keel depth, sheer height fractions from stern (i=0) to bow.
const HULL_HB = [0.55, 0.83, 0.96, 1.0, 0.95, 0.80, 0.52, 0.10];
const HULL_KL = [0.50, 0.82, 0.96, 1.0, 0.96, 0.82, 0.55, 0.22];
const HULL_SH = [1.12, 1.0, 0.94, 0.92, 0.95, 1.03, 1.16, 1.32];

export function hullLerp(arr, t) {
  const f = t * (arr.length - 1);
  const i = Math.min(arr.length - 2, f | 0);
  const u = f - i;
  return arr[i] * (1 - u) + arr[i + 1] * u;
}

export function buildBoatHull(L, B, D, F, colTop, colBottom, colDeck) {
  const NS = HULL_HB.length, GIRTH = 7;
  const pos = [], col = [], idx = [];
  const c1 = new THREE.Color(colTop), c2 = new THREE.Color(colBottom), c3 = new THREE.Color(colDeck);
  const V = (x, y, z, c) => { pos.push(x, y, z); col.push(c.r, c.g, c.b); };
  for (let i = 0; i < NS; i++) {
    const x = -L / 2 + (i / (NS - 1)) * L;
    for (let k = 0; k < GIRTH; k++) {
      const phi = (k / (GIRTH - 1)) * Math.PI;
      const sheer = F * HULL_SH[i];
      const y = sheer - (sheer + D * HULL_KL[i]) * Math.pow(Math.sin(phi), 0.85);
      const z = -(B / 2) * HULL_HB[i] * Math.cos(phi);
      V(x, y, z, y < -0.3 ? c2 : c1);                  // antifoul below the boot stripe
    }
  }
  for (let i = 0; i < NS - 1; i++) {
    for (let k = 0; k < GIRTH - 1; k++) {
      const a = i * GIRTH + k, b = (i + 1) * GIRTH + k;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  // deck strip between the gunwales
  const d0 = pos.length / 3;
  for (let i = 0; i < NS; i++) {
    const x = -L / 2 + (i / (NS - 1)) * L;
    const sheer = F * HULL_SH[i];
    const hw = (B / 2) * HULL_HB[i];
    V(x, sheer - 0.02, -hw + 0.02, c3);
    V(x, sheer - 0.02, hw - 0.02, c3);
  }
  for (let i = 0; i < NS - 1; i++) {
    const a = d0 + i * 2, b = d0 + (i + 1) * 2;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  // transom fan
  const t0 = pos.length / 3;
  for (let k = 0; k < GIRTH; k++) {
    pos.push(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
    col.push(c1.r, c1.g, c1.b);
  }
  for (let k = 0; k < GIRTH - 2; k++) idx.push(t0, t0 + k + 1, t0 + k + 2);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return zeroUV(geo);
}

// Sailboat: proper hull, cabin trunk with ports, mast + boom + furled main,
// furled jib on the forestay, railing stanchions.
export function buildSailboat(sz, accent) {
  const L = 6.3 * sz, B = 1.9 * sz, D = 0.6 * sz, F = 0.42 * sz;
  const white = 0xf4f6f8, cream = 0xe9dfc8, alu = 0xb9c2c9, sailc = 0xf3efe4, dark = 0x18222e;
  const geos = [buildBoatHull(L, B, D, F, white, 0x8a3a34, cream)];
  geos.push(cBox(0.34 * L, 0.30 * sz, 0.52 * B, white, -0.02 * L, F + 0.16 * sz, 0));
  geos.push(cBox(0.34 * L, 0.045 * sz, 0.53 * B, accent, -0.02 * L, F + 0.30 * sz, 0));   // cove stripe
  for (const s of [-1, 1]) {
    geos.push(cBox(0.20 * L, 0.10 * sz, 0.02, dark, -0.02 * L, F + 0.17 * sz, s * 0.265 * B));
  }
  const mastX = 0.06 * L, mastH = 1.28 * L;
  geos.push(cCyl(0.030 * sz, 0.040 * sz, mastH, 6, alu, mastX, F + mastH / 2, 0));
  const boomL = 0.34 * L;
  geos.push(cCyl(0.028 * sz, 0.028 * sz, boomL, 5, alu, mastX - boomL / 2, F + 0.42 * sz, 0, 0, 0, Math.PI / 2));
  geos.push(cCyl(0.06 * sz, 0.085 * sz, boomL * 0.94, 6, sailc, mastX - boomL / 2, F + 0.55 * sz, 0, 0, 0, Math.PI / 2));
  const head = new THREE.Vector3(mastX, F + mastH * 0.97, 0);
  const bow = new THREE.Vector3(L * 0.485, F * 1.30, 0);
  geos.push(colorFill(tubeBetween(head, bow, 0.045 * sz, 5), sailc));
  for (const t of [0.14, 0.28, 0.42, 0.56, 0.70, 0.84]) {
    const sx2 = -L / 2 + t * L;
    const hw = (B / 2) * hullLerp(HULL_HB, t) - 0.03;
    const sy = F * hullLerp(HULL_SH, t);
    for (const s of [-1, 1]) geos.push(cBox(0.03, 0.30 * sz, 0.03, white, sx2, sy + 0.13 * sz, s * hw));
  }
  const merged = mergeGeometries(geos);
  geos.forEach((g) => g.dispose());
  return merged;
}

// Motor yacht: beamy hull, stepped 2-deck superstructure with dark glass
// bands, raked windshield, radar arch + dome, bow stanchions, swim platform.
export function buildMotorYacht(sz, accent) {
  const L = 6.9 * sz, B = 2.35 * sz, D = 0.5 * sz, F = 0.55 * sz;
  const white = 0xf3f5f7, dark = 0x121a24, gry = 0xdfe3e6;
  const geos = [buildBoatHull(L, B, D, F, white, 0x233246, 0xf0ede4)];
  geos.push(cBox(0.10 * L, 0.06 * sz, 0.9 * B, accent, 0.1 * L, F * 0.9, 0));            // fore-deck accent
  const d1w = 0.46 * L, d1h = 0.34 * sz;
  geos.push(cBox(d1w, d1h, 0.62 * B, white, -0.08 * L, F + d1h / 2 + 0.02, 0));
  geos.push(cBox(d1w * 0.92, 0.14 * sz, 0.62 * B + 0.03, dark, -0.08 * L, F + d1h * 0.62, 0));
  const d2w = 0.30 * L, d2h = 0.30 * sz;
  const d2y = F + d1h + 0.02;
  geos.push(cBox(d2w, d2h, 0.44 * B, white, -0.10 * L, d2y + d2h / 2, 0));
  geos.push(cBox(d2w * 0.9, 0.12 * sz, 0.44 * B + 0.03, dark, -0.10 * L, d2y + d2h * 0.6, 0));
  geos.push(cBox(0.05 * L, 0.20 * sz, 0.40 * B, dark, -0.10 * L + d2w / 2, d2y + d2h * 0.62, 0, 0, 0, 0.38)); // windshield
  const archY = d2y + d2h;
  for (const s of [-1, 1]) {
    geos.push(cBox(0.035 * L, 0.44 * sz, 0.05 * B, white, -0.235 * L, archY + 0.19 * sz, s * 0.18 * B, 0, 0, 0.42));
  }
  geos.push(cBox(0.05 * L, 0.06 * sz, 0.42 * B, white, -0.275 * L, archY + 0.40 * sz, 0));
  const dome = new THREE.SphereGeometry(0.16 * sz, 8, 6);
  dome.scale(1.2, 0.62, 1);
  dome.translate(-0.275 * L, archY + 0.50 * sz, 0);
  geos.push(colorFill(dome, gry));
  geos.push(cCyl(0.012 * sz, 0.012 * sz, 0.5 * sz, 4, white, -0.25 * L, archY + 0.62 * sz, 0.09 * B));
  for (const t of [0.68, 0.8, 0.9]) {
    const sx2 = -L / 2 + t * L;
    const hw = (B / 2) * hullLerp(HULL_HB, t) - 0.04;
    const sy = F * hullLerp(HULL_SH, t);
    for (const s of [-1, 1]) geos.push(cBox(0.03, 0.26 * sz, 0.03, white, sx2, sy + 0.11 * sz, s * hw));
  }
  geos.push(cBox(0.08 * L, 0.05 * sz, 0.55 * B, gry, -0.53 * L, F * 0.35, 0));           // swim platform
  const merged = mergeGeometries(geos);
  geos.forEach((g) => g.dispose());
  return merged;
}
