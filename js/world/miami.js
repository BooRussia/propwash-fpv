// ============================================================
// PropWash FPV — Miami Skyline map
// Tropical high-rise beach city: ocean, beach, boardwalk, pier,
// Ocean Drive, art-deco + glass skyline, ferris wheel, marina.
// Photoreal pass: CC0 PBR ground/road/facades via AssetLibrary,
// photoscan rocks + tropical vegetation via vegetation.js.
// Every asset degrades gracefully — with an empty assets/ folder
// the map still builds with the original procedural look.
// ============================================================
import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { settings, clamp } from '../core/state.js';
import { assetLib } from '../core/assets.js';
import { buildPalm, createPalms, scatterModels } from './vegetation.js';

// deterministic layout
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- beach/ground profile (shared by mesh + physics) ----------
const SHORE_Z = -30;      // sand dips under water here
const CITY_Z = 30;        // city plateau starts
const CITY_Y = 1.5;

function sandNoise(x, z) {
  return 0.14 * Math.sin(x * 0.11 + 1.7) * Math.sin(z * 0.17 + 0.4)
       + 0.08 * Math.sin(x * 0.031) * Math.sin(z * 0.043 + 2.0);
}

function baseProfile(z) {
  if (z >= CITY_Z) return CITY_Y;
  if (z <= SHORE_Z) return Math.max(-6, -0.4 + (z - SHORE_Z) * 0.08);
  const t = (z - SHORE_Z) / (CITY_Z - SHORE_Z);          // 0..1
  const s = t * t * (3 - 2 * t);                          // smoothstep
  return -0.4 + s * (CITY_Y + 0.4);
}

function groundHeight(x, z) {
  let g = baseProfile(z);
  if (z < CITY_Z - 2 && z > SHORE_Z - 30) g += sandNoise(x, z) * Math.max(0, 1 - Math.abs(z - 0) / 60);
  return g < 0.02 && z < 8 ? 0 : g;                       // water surface counts as ground
}

// mesh displacement — same formula the physics-adjacent vertex loop always used
function meshHeight(x, z) {
  return baseProfile(z) + (z < CITY_Z - 2 ? sandNoise(x, z) * Math.max(0, 1 - Math.abs(z) / 60) : 0);
}

// ---------- canvas textures (procedural fallbacks + deco windows) ----------
function windowTexture(rng, lit = 0.55, warmBias = 0.7) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#0b1420';
  g.fillRect(0, 0, 128, 256);
  const cols = 6, rows = 18;
  const cw = 128 / cols, ch = 256 / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (rng() < lit) {
        g.fillStyle = rng() < warmBias
          ? `rgba(255, ${190 + (rng() * 40) | 0}, 120, ${0.75 + rng() * 0.25})`
          : `rgba(160, 210, 255, ${0.6 + rng() * 0.35})`;
      } else {
        g.fillStyle = 'rgba(30, 44, 60, 0.9)';
      }
      g.fillRect(i * cw + 2, j * ch + 2, cw - 4, ch - 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function stripeTexture(base, stripe, w = 256, h = 256, planks = 14) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.fillStyle = stripe;
  for (let i = 0; i < planks; i++) g.fillRect(0, (h / planks) * i, w, 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function roadTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#23262a'; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 500; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
    g.fillRect(Math.random() * 256, Math.random() * 128, 2, 2);
  }
  g.fillStyle = '#e8c545';
  for (let x = 0; x < 256; x += 42) g.fillRect(x, 61, 22, 5);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// aoMap UVs: three r180 samples aoMap through texture.channel (default 0 → 'uv'),
// but we alias uv1/uv2 too so any channel choice — and older code paths — resolve.
function setAoUVs(geo) {
  if (!geo.attributes.uv) return;
  geo.setAttribute('uv1', geo.attributes.uv);
  geo.setAttribute('uv2', geo.attributes.uv);
}

// ============================================================
// Props-v2 geometry helpers (parasols, lifeguard towers, boats, facades).
// Builders return BufferGeometries with position/normal/uv (+vertex colors
// where noted) so they can be freely merged or instanced.
// ============================================================
function colorFill(geo, hex) {
  const c = new THREE.Color(hex);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

function zeroUV(geo) {
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
  return geo;
}

function cBox(w, h, d, hex, x, y, z, rx = 0, ry = 0, rz = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rz) g.rotateZ(rz);
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  return colorFill(g, hex);
}

function cCyl(r0, r1, h, seg, hex, x, y, z, rx = 0, ry = 0, rz = 0) {
  const g = new THREE.CylinderGeometry(r0, r1, h, seg);
  if (rz) g.rotateZ(rz);
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  return colorFill(g, hex);
}

function tubeBetween(p0, p1, r, seg) {
  const dir = new THREE.Vector3().subVectors(p1, p0);
  const len = dir.length();
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  g.translate((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2);
  return g;
}

// Physically scaled facade UVs for a BoxGeometry: every face maps the texture
// at a constant tileU x tileV meters, so window size is identical across all
// towers regardless of their dimensions. offU/offV decorrelate the pattern
// between neighbouring buildings.
function facadeUV(geo, w, h, d, tileU, tileV, offU, offV) {
  const uv = geo.attributes.uv;
  if (uv.count === 24) {
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];   // ±x, ±y, ±z faces
    for (let f = 0; f < 6; f++) {
      const du = dims[f][0], dv = dims[f][1];
      for (let k = 0; k < 4; k++) {
        const i = f * 4 + k;
        uv.setXY(i, uv.getX(i) * (du / tileU) + offU, uv.getY(i) * (dv / tileV) + offV);
      }
    }
  } else {
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) * (w / tileU) + offU, uv.getY(i) * (h / tileV) + offV);
    }
  }
  uv.needsUpdate = true;
}

// ---------- parasols (beach umbrellas v2) ----------
const PAR_R = 1.45, PAR_APEX = 0.5, PAR_Y0 = 1.96, PAR_PANELS = 12;

// Scalloped 12-rib canopy; parity picks alternating panels so two
// InstancedMeshes (fixed white + per-instance tinted) interleave into
// one two-tone parasol.
function buildParasolCanopy(parity) {
  const SUB = 4, ringT = [0.55, 1.0];
  const pos = [], idx = [];
  for (let j = 0; j < PAR_PANELS; j++) {
    if (j % 2 !== parity) continue;
    const base = pos.length / 3;
    const midA = ((j + 0.5) / PAR_PANELS) * Math.PI * 2;
    pos.push(Math.cos(midA) * 0.02, PAR_Y0 + PAR_APEX, Math.sin(midA) * 0.02);
    for (let r = 0; r < 2; r++) {
      const t = ringT[r];
      for (let k = 0; k <= SUB; k++) {
        const a = ((j + k / SUB) / PAR_PANELS) * Math.PI * 2;
        const s = Math.sin((k / SUB) * Math.PI);           // 0 at ribs, 1 mid-panel
        const dipY = (r === 1 ? 0.13 : 0.05) * s;
        const dipR = (r === 1 ? 0.06 : 0.02) * s;
        const rad = PAR_R * Math.pow(t, 0.9) - dipR;
        pos.push(
          Math.cos(a) * rad,
          PAR_Y0 + PAR_APEX * (1 - Math.pow(t, 1.55)) - dipY,
          Math.sin(a) * rad
        );
      }
    }
    const r0 = base + 1, r1 = base + 2 + SUB;
    for (let k = 0; k < SUB; k++) {
      idx.push(base, r0 + k + 1, r0 + k);
      idx.push(r0 + k, r1 + k + 1, r1 + k);
      idx.push(r0 + k, r0 + k + 1, r1 + k + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return zeroUV(geo);
}

// Pole + 12 visible ribs + finial knob, merged → one instanced draw call.
function buildParasolFrame() {
  const wood = 0xe8e2d2;
  const geos = [cCyl(0.032, 0.042, 2.04, 7, wood, 0, 1.02, 0)];
  const top = new THREE.Vector3(0, PAR_Y0 + PAR_APEX - 0.04, 0);
  for (let j = 0; j < PAR_PANELS; j++) {
    const a = (j / PAR_PANELS) * Math.PI * 2;
    const tip = new THREE.Vector3(Math.cos(a) * (PAR_R - 0.05), PAR_Y0 + 0.02, Math.sin(a) * (PAR_R - 0.05));
    geos.push(colorFill(tubeBetween(top, tip, 0.016, 5), wood));
  }
  geos.push(cCyl(0.05, 0.018, 0.14, 6, 0xcfa96a, 0, PAR_Y0 + PAR_APEX + 0.1, 0));
  const merged = mergeGeometries(geos);
  geos.forEach((g) => g.dispose());
  return merged;
}

// ---------- lifeguard towers v2 (classic Miami) ----------
// Raised platform on 4 splayed legs, thin-bar safety railing, access ramp,
// hut with an open window cutout, mono-pitched overhanging roof, flag.
// Vertex-colored; all 6 towers merge into a single mesh.
function buildLifeguardGeo(primary, roofCol) {
  const trim = 0xf5f1e4, dark = 0x1e252c;
  const G = [];
  // 4 splayed legs (base wider than the deck)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const g = new THREE.BoxGeometry(0.16, 2.62, 0.16);
      g.translate(0, 1.31, 0);
      g.rotateZ(sx * 0.13);
      g.rotateX(-sz * 0.13);
      g.translate(sx * 1.35, 0, sz * 1.1);
      G.push(colorFill(g, trim));
    }
  }
  // cross braces
  G.push(cBox(2.4, 0.09, 0.09, trim, 0, 1.0, -1.22));
  G.push(cBox(2.4, 0.09, 0.09, trim, 0, 1.0, 1.22));
  G.push(cBox(0.09, 0.09, 2.2, trim, -1.22, 1.35, 0));
  G.push(cBox(0.09, 0.09, 2.2, trim, 1.22, 1.35, 0));
  // platform deck
  G.push(cBox(3.3, 0.14, 2.9, trim, 0, 2.45, 0));
  const DT = 2.52;                                    // deck top
  // railing posts (front gap at x in [-1.05, -0.15] for the ramp)
  for (const [px, pz] of [[-1.6, -1.4], [1.6, -1.4], [-1.6, 1.4], [1.6, 1.4],
                          [0, 1.4], [-1.6, 0], [1.6, 0], [-1.05, -1.4], [-0.15, -1.4], [0.72, -1.4]]) {
    G.push(cBox(0.06, 0.82, 0.06, trim, px, DT + 0.41, pz));
  }
  // twin thin rails
  for (const ry of [0.42, 0.8]) {
    const t = ry === 0.8 ? 0.055 : 0.04;
    G.push(cBox(t, t, 2.9, trim, -1.6, DT + ry, 0));
    G.push(cBox(t, t, 2.9, trim, 1.6, DT + ry, 0));
    G.push(cBox(3.3, t, t, trim, 0, DT + ry, 1.4));
    G.push(cBox(0.55, t, t, trim, -1.32, DT + ry, -1.4));
    G.push(cBox(1.75, t, t, trim, 0.72, DT + ry, -1.4));
  }
  // hut — window opening faces the ocean (-z)
  const HZ = 0.35, HH = 1.75;
  G.push(cBox(2.4, HH, 0.07, primary, 0, DT + HH / 2, HZ + 0.85));
  G.push(cBox(0.07, HH, 1.77, primary, -1.165, DT + HH / 2, HZ));
  G.push(cBox(0.07, HH, 1.77, primary, 1.165, DT + HH / 2, HZ));
  G.push(cBox(2.4, 0.5, 0.07, primary, 0, DT + 0.25, HZ - 0.85));
  G.push(cBox(2.4, 0.3, 0.07, primary, 0, DT + HH - 0.15, HZ - 0.85));
  G.push(cBox(0.38, 0.95, 0.07, primary, -1.01, DT + 0.975, HZ - 0.85));
  G.push(cBox(0.38, 0.95, 0.07, primary, 1.01, DT + 0.975, HZ - 0.85));
  G.push(cBox(2.2, 1.55, 1.55, dark, 0, DT + 0.85, HZ + 0.06));       // dark interior
  G.push(cBox(1.7, 0.06, 0.18, trim, 0, DT + 0.52, HZ - 0.88));       // window sill
  // mono-pitched roof, overhanging the deck toward the ocean
  G.push(cBox(2.85, 0.09, 2.65, roofCol, 0, DT + HH + 0.22, HZ - 0.28, -0.14));
  // access ramp through the railing gap down to the sand
  const RA = 0.48;
  G.push(cBox(0.95, 0.08, 5.0, trim, -0.6, 1.28, -3.55, -RA));
  G.push(cBox(0.05, 0.4, 5.0, primary, -1.04, 1.62, -3.55, -RA));
  G.push(cBox(0.05, 0.4, 5.0, primary, -0.16, 1.62, -3.55, -RA));
  // flag on a pole
  G.push(cCyl(0.025, 0.025, 1.5, 5, trim, 1.15, DT + HH + 0.95, HZ + 0.75));
  G.push(cBox(0.55, 0.34, 0.02, 0xff5330, 1.45, DT + HH + 1.5, HZ + 0.75));
  const merged = mergeGeometries(G);
  G.forEach((g) => g.dispose());
  return merged;
}

// ---------- boats v2 ----------
// Lofted hull with sheer curve + bow taper. Station tables: half-beam,
// keel depth, sheer height fractions from stern (i=0) to bow.
const HULL_HB = [0.55, 0.83, 0.96, 1.0, 0.95, 0.80, 0.52, 0.10];
const HULL_KL = [0.50, 0.82, 0.96, 1.0, 0.96, 0.82, 0.55, 0.22];
const HULL_SH = [1.12, 1.0, 0.94, 0.92, 0.95, 1.03, 1.16, 1.32];

function hullLerp(arr, t) {
  const f = t * (arr.length - 1);
  const i = Math.min(arr.length - 2, f | 0);
  const u = f - i;
  return arr[i] * (1 - u) + arr[i + 1] * u;
}

function buildBoatHull(L, B, D, F, colTop, colBottom, colDeck) {
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
function buildSailboat(sz, accent) {
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
function buildMotorYacht(sz, accent) {
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

// ============================================================
export async function buildMiami(scene, env) {
  const rng = mulberry32(20250809);
  // Second stream for all NEW dressing (rocks, shrubs, hero palms, vertex tint).
  // The main `rng` stream must keep its exact legacy draw sequence so the
  // deterministic tower/hut/car layout stays bit-identical to the old build.
  const rng2 = mulberry32(0x5eaf00d);
  // Third stream for the props-v2 pass (facade UV offsets, parasol tilts,
  // boat accents…). Never draw from rng or rng2 for new features.
  const rng3 = mulberry32(0xFACADE5);
  const root = new THREE.Group();
  root.name = 'miami';
  scene.add(root);

  const disposables = [];   // geometries/materials/textures
  const colliders = [];
  const scatterHandles = [];
  const track = (obj) => { disposables.push(obj); return obj; };
  const addCollider = (cx, cy, cz, sx, sy, sz) => {
    colliders.push({
      min: new THREE.Vector3(cx - sx / 2, cy, cz - sz / 2),
      max: new THREE.Vector3(cx + sx / 2, cy + sy, cz + sz / 2),
    });
  };

  // ---------------- environment HDRIs ----------------
  if (env.setHDRIBands) {
    env.setHDRIBands({ day: 'beach_day', sunset: 'sunset', night: 'night', overcast: 'overcast' });
  }

  // Legacy-stream preservation: the old single ground mesh consumed one rng()
  // draw per vertex (151 x 77 grid). Burn the same count so every downstream
  // rng-derived position (palms, huts, towers, cars…) lands exactly where it
  // always has. DO NOT add or remove main-rng draws before the layout sections.
  for (let i = 0; i < 151 * 77; i++) rng();

  // ---------------- shared PBR texture sets (each key may be absent) ----------------
  const [sandSet, sidewalkSet, asphaltSet, roadLinesSet, glassSet, facadeDaySet] = await Promise.all([
    assetLib.textureSet('sand_beach'),
    assetLib.textureSet('sidewalk'),
    assetLib.textureSet('asphalt'),
    assetLib.textureSet('road_lines'),
    assetLib.textureSet('facade_glass'),
    assetLib.textureSet('facade_day'),
  ]);

  // ---------------- ground: beach mesh + city mesh ----------------
  // Two meshes share the exact legacy displacement formula (meshHeight), so the
  // visual surface tracks groundHeight physics exactly as before.
  {
    // (a) beach: z in [-130, CITY_Z + 3], real 30 m sand_beach scan → 1 tile = 30 m
    const Z0 = -130, Z1 = CITY_Z + 3;
    const depth = Z1 - Z0;
    const geo = track(new THREE.PlaneGeometry(1500, depth, 150, 40));
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, (Z0 + Z1) / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const dry = new THREE.Color(0xffffff);                 // near-white multiply tint
    const wet = new THREE.Color(0x93a189);                 // darker + greener at waterline
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const y = meshHeight(x, z);
      pos.setY(i, y);
      tmp.copy(dry).lerp(wet, Math.min(1, Math.max(0, (2 - y) / 2.6)));  // legacy wet-sand lerp
      tmp.offsetHSL(0, 0, (rng2() - 0.5) * 0.02);
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    setAoUVs(geo);
    let mat;
    if (sandSet.map) {
      mat = await assetLib.pbrMaterial('sand_beach', { repeat: [1500 / 30, depth / 30] });
    } else {
      mat = track(new THREE.MeshStandardMaterial({ color: 0xe5cf9c, roughness: 0.95, metalness: 0 }));
    }
    mat.vertexColors = true;
    mat.needsUpdate = true;
    const beach = new THREE.Mesh(geo, mat);
    beach.receiveShadow = true;
    root.add(beach);
  }
  {
    // (b) city: z in [CITY_Z - 3, 630], sidewalk 1 tile = 2 m
    const Z0 = CITY_Z - 3, Z1 = 630;
    const depth = Z1 - Z0;
    const geo = track(new THREE.PlaneGeometry(1500, depth, 150, 60));
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, (Z0 + Z1) / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, meshHeight(pos.getX(i), pos.getZ(i)));
    }
    geo.computeVertexNormals();
    setAoUVs(geo);
    let mat;
    if (sidewalkSet.map) {
      mat = await assetLib.pbrMaterial('sidewalk', { repeat: [1500 / 2, depth / 2] });
    } else {
      mat = track(new THREE.MeshStandardMaterial({ color: 0x8f8f8c, roughness: 0.95, metalness: 0 }));
    }
    // beach + city overlap (coplanar) in the seam band — push the city mesh
    // back in depth so the sand wins there instead of z-fighting
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = 1;
    mat.polygonOffsetUnits = 1;
    const city = new THREE.Mesh(geo, mat);
    city.receiveShadow = true;
    root.add(city);
  }

  // ---------------- ocean ----------------
  let water = null;
  let waterFallbackMat = null;
  {
    const waterGeo = track(new THREE.PlaneGeometry(5000, 3600));
    const loadNormals = (url, timeoutMs) => new Promise((resolve) => {
      const loader = new THREE.TextureLoader();
      const timer = setTimeout(() => resolve(null), timeoutMs);
      loader.load(
        url,
        (t) => { clearTimeout(timer); t.wrapS = t.wrapT = THREE.RepeatWrapping; resolve(t); },
        undefined,
        () => { clearTimeout(timer); resolve(null); }
      );
    });
    // local copy first, CDN as fallback
    let normals = await loadNormals('assets/textures/waternormals.jpg', 4000);
    if (!normals) {
      normals = await loadNormals('https://cdn.jsdelivr.net/npm/three@0.180.0/examples/textures/waternormals.jpg', 5000);
    }
    if (normals) {
      track(normals);
      water = new Water(waterGeo, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: normals,
        sunDirection: new THREE.Vector3(0.4, 0.6, -0.7).normalize(),
        sunColor: 0xffffff,
        waterColor: 0x00404f,
        distortionScale: 2.4,
        fog: true,
      });
      water.rotation.x = -Math.PI / 2;
      water.position.set(0, -0.05, -1700);
      track(water.material);
      root.add(water);
    } else {
      waterFallbackMat = track(new THREE.MeshStandardMaterial({ color: 0x0a4a5e, roughness: 0.15, metalness: 0.7 }));
      const sea = new THREE.Mesh(waterGeo, waterFallbackMat);
      sea.rotation.x = -Math.PI / 2;
      sea.position.set(0, -0.05, -1700);
      root.add(sea);
    }
  }

  // ---------------- boardwalk + pier ----------------
  const woodTex = track(stripeTexture('#8f6b45', '#6d4f31'));
  woodTex.repeat.set(40, 2);
  {
    const geo = track(new THREE.BoxGeometry(1240, 0.5, 8));
    const mat = track(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9 }));
    const bw = new THREE.Mesh(geo, mat);
    bw.position.set(0, CITY_Y + 0.05, CITY_Z - 3);
    bw.receiveShadow = true;
    root.add(bw);
  }
  const PIER_X = -150;
  {
    const woodTex2 = track(stripeTexture('#87653f', '#66492c'));
    woodTex2.repeat.set(4, 30);
    const deckGeo = track(new THREE.BoxGeometry(12, 0.6, 165));
    const deckMat = track(new THREE.MeshStandardMaterial({ map: woodTex2, roughness: 0.9 }));
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(PIER_X, 3.4, CITY_Z - 88);
    deck.castShadow = true;
    root.add(deck);
    addCollider(PIER_X, 3.1, CITY_Z - 88, 12, 0.6, 165);

    // pylons — pairs every 18m, leaving fly-under space
    const pyGeo = track(new THREE.CylinderGeometry(0.35, 0.4, 10, 8));
    const pyMat = track(new THREE.MeshStandardMaterial({ color: 0x5c4a35, roughness: 1 }));
    const pylons = new THREE.InstancedMesh(pyGeo, pyMat, 20);
    const m4 = new THREE.Matrix4();
    let pi = 0;
    for (let i = 0; i < 10; i++) {
      const z = CITY_Z - 16 - i * 17;
      for (const dx of [-5, 5]) {
        m4.makeTranslation(PIER_X + dx, -1.5, z);
        pylons.setMatrixAt(pi++, m4);
        addCollider(PIER_X + dx, -6, z, 0.9, 10, 0.9);
      }
    }
    pylons.castShadow = true;
    root.add(pylons);

    // pavilion at the end
    const pavGeo = track(new THREE.BoxGeometry(14, 5, 12));
    const pavMat = track(new THREE.MeshStandardMaterial({ color: 0xf5e9d0, roughness: 0.8 }));
    const pav = new THREE.Mesh(pavGeo, pavMat);
    pav.position.set(PIER_X, 6.2, CITY_Z - 168);
    pav.castShadow = true;
    root.add(pav);
    const roofGeo = track(new THREE.ConeGeometry(10.5, 3.5, 4));
    const roofMat = track(new THREE.MeshStandardMaterial({ color: 0xd9575e, roughness: 0.7 }));
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(PIER_X, 10.5, CITY_Z - 168);
    roof.rotation.y = Math.PI / 4;
    root.add(roof);
    addCollider(PIER_X, 3.7, CITY_Z - 168, 14, 9, 12);
    const pavLight = new THREE.PointLight(0xffd9a0, 30, 40);
    pavLight.position.set(PIER_X, 9, CITY_Z - 168);
    root.add(pavLight);
  }

  // ---------------- Ocean Drive road ----------------
  {
    const geo = track(new THREE.PlaneGeometry(1240, 12));
    geo.rotateX(-Math.PI / 2);
    setAoUVs(geo);
    let mat;
    if (asphaltSet.map) {
      mat = await assetLib.pbrMaterial('asphalt', { repeat: [1240 / 3, 12 / 3] });  // 1 tile ≈ 3 m
    } else {
      const roadTex = track(roadTexture());
      roadTex.repeat.set(90, 1);
      mat = track(new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.95 }));
    }
    const road = new THREE.Mesh(geo, mat);
    road.position.set(0, CITY_Y + 0.06, 44);
    road.receiveShadow = true;
    root.add(road);

    if (asphaltSet.map && roadLinesSet.map && roadLinesSet.alphaMap) {
      // yellow dashed center line — crop the dashed-strip column out of the
      // road_lines decal atlas (albedo = paint color, opacity = marking mask)
      const crop = (t) => {
        const c = t.clone();
        c.wrapS = c.wrapT = THREE.ClampToEdgeWrapping;
        c.offset.set(742 / 1024, 0.355);
        c.repeat.set(28 / 1024, 0.30);
        c.needsUpdate = true;
        return track(c);
      };
      const lineMat = track(new THREE.MeshStandardMaterial({
        map: crop(roadLinesSet.map),
        alphaMap: crop(roadLinesSet.alphaMap),
        transparent: true,
        depthWrite: false,
        roughness: 0.6,
        metalness: 0,
      }));
      const SEG = 48;                                     // meters of dashes per instance
      const lineGeo = track(new THREE.PlaneGeometry(0.45, SEG));
      lineGeo.rotateX(-Math.PI / 2);
      lineGeo.rotateY(Math.PI / 2);                       // dash direction along X
      const count = Math.ceil(1240 / SEG);
      const line = new THREE.InstancedMesh(lineGeo, lineMat, count);
      const m4 = new THREE.Matrix4();
      for (let i = 0; i < count; i++) {
        m4.makeTranslation(-620 + SEG / 2 + i * SEG, CITY_Y + 0.08, 44);   // +0.02 above road
        line.setMatrixAt(i, m4);
      }
      line.instanceMatrix.needsUpdate = true;
      root.add(line);
    } else if (asphaltSet.map) {
      // asphalt present but decal atlas missing → canvas dash strip
      const c = document.createElement('canvas');
      c.width = 256; c.height = 16;
      const g = c.getContext('2d');
      g.clearRect(0, 0, 256, 16);
      g.fillStyle = '#e8c545';
      for (let x = 0; x < 256; x += 42) g.fillRect(x, 5, 22, 6);
      const tex = track(new THREE.CanvasTexture(c));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(90, 1);
      const mat2 = track(new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.6 }));
      const geo2 = track(new THREE.PlaneGeometry(1240, 0.5));
      geo2.rotateX(-Math.PI / 2);
      const strip = new THREE.Mesh(geo2, mat2);
      strip.position.set(0, CITY_Y + 0.08, 44);
      root.add(strip);
    }
    // (canvas roadTexture fallback already carries baked markings)
  }

  // ---------------- palms ----------------
  // Placement loop kept draw-for-draw identical to the legacy cone-palm build
  // (x, z, z, sc, tiltX, rotY, tiltZ) so the main rng stream is preserved.
  const palmPlacements = [];
  {
    const N = 170;
    let placed = 0;
    while (placed < N) {
      const x = (rng() - 0.5) * 1200;
      const z = rng() < 0.72 ? 26 + rng() * 32 : 6 + rng() * 18;   // road rows + scattered sand
      if (Math.abs(x - PIER_X) < 12 && z < 36) continue;
      const y = groundHeight(x, z);
      if (y < 0.1) continue;
      const sc = 0.8 + rng() * 0.55;
      const legacyTiltX = (rng() - 0.5) * 0.12;   // draws preserved from the old
      const rotY = rng() * Math.PI * 2;           // Euler(tiltX, yaw, tiltZ) — the
      const legacyTiltZ = (rng() - 0.5) * 0.12;   // tilts are no longer applied
      void legacyTiltX; void legacyTiltZ;
      palmPlacements.push({ x, y, z, sc, rotY });
      addCollider(x, y, z, 0.5, 6.5 * sc, 0.5);   // every trunk is solid (unchanged)
      placed++;
    }
  }
  let palms = null;
  try {
    palms = await createPalms(palmPlacements.length);
  } catch (e) {
    console.warn('[miami] createPalms failed — using legacy cone palms:', e);
    palms = null;
  }
  if (palms && palms.group) {
    for (let i = 0; i < palmPlacements.length; i++) {
      const p = palmPlacements[i];
      palms.placeAt(i, p.x, p.y, p.z, p.sc, p.rotY);
    }
    palms.finalize(palmPlacements.length);
    root.add(palms.group);
  } else {
    palms = null;
    // legacy instanced cone palms (colliders above already cover them)
    const trunkGeo = track(new THREE.CylinderGeometry(0.14, 0.22, 6.5, 6));
    trunkGeo.translate(0, 3.25, 0);
    const trunkMat = track(new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 1 }));
    const crownGeo = track(new THREE.ConeGeometry(2.2, 1.4, 7));
    crownGeo.translate(0, 6.9, 0);
    const crownMat = track(new THREE.MeshStandardMaterial({ color: 0x2c7a3c, roughness: 0.9, side: THREE.DoubleSide }));
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, palmPlacements.length);
    const crowns = new THREE.InstancedMesh(crownGeo, crownMat, palmPlacements.length);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const eul = new THREE.Euler();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    for (let i = 0; i < palmPlacements.length; i++) {
      const pl = palmPlacements[i];
      eul.set(0, pl.rotY, 0);
      q.setFromEuler(eul);
      s.set(pl.sc, pl.sc, pl.sc);
      p.set(pl.x, pl.y, pl.z);
      m4.compose(p, q, s);
      trunks.setMatrixAt(i, m4);
      crowns.setMatrixAt(i, m4);
    }
    trunks.castShadow = true; crowns.castShadow = true;
    root.add(trunks); root.add(crowns);
  }

  // hero palms — full buildPalm() models clustered by the spawn/boardwalk,
  // right where the FPV camera starts (the money shot)
  {
    const HERO_POS = [
      [-17, 19.5], [-10, 14], [-4, 22.5], [4, 17],
      [11, 23], [17, 14.5], [24, 20.5], [30, 16.5],
    ];
    for (const [hx, hz] of HERO_POS) {
      let hero = null;
      try { hero = await buildPalm(rng2); } catch (e) { hero = null; }
      if (!hero) break;                       // vegetation absent — instanced palms still cover the area
      const s = 0.95 + rng2() * 0.35;
      const hy = groundHeight(hx, hz);
      hero.scale.multiplyScalar(s);
      hero.rotation.y = rng2() * Math.PI * 2;
      hero.position.set(hx, hy, hz);
      hero.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
      root.add(hero);
      addCollider(hx, hy, hz, 0.6, 7.5 * s, 0.6);   // thin trunk collider per hero
    }
  }

  // ---------------- beach props: lifeguard towers + parasols + towels ----------------
  {
    // lifeguard towers v2 — merged vertex-colored geometry, 1 draw call for all 6
    const hutCols = [0xff7fa0, 0x53d6d6, 0xffd166, 0x9b5de5, 0x43d17a, 0xff8c42];
    const lgGeos = [];
    for (let i = 0; i < 6; i++) {
      const x = -430 + i * 165 + (rng() - 0.5) * 30;    // legacy rng draws — keep order
      const z = 10 + rng() * 6;
      const y = groundHeight(x, z);
      const g = buildLifeguardGeo(hutCols[i % hutCols.length], hutCols[(i + 2) % hutCols.length]);
      g.rotateY((rng3() - 0.5) * 0.24);
      g.translate(x, y, z);
      lgGeos.push(g);
      addCollider(x, y, z, 3.6, 4.8, 3.2);              // silhouette is lower than the old hut
    }
    const lgGeo = track(mergeGeometries(lgGeos));
    lgGeos.forEach((g) => g.dispose());
    const lgMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, side: THREE.DoubleSide }));
    const lgMesh = new THREE.Mesh(lgGeo, lgMat);
    lgMesh.castShadow = true;
    lgMesh.receiveShadow = true;
    root.add(lgMesh);

    // parasols v2 — scalloped two-tone canopy, visible ribs, tilted poles
    const canopyGeoA = track(buildParasolCanopy(0));
    const canopyGeoB = track(buildParasolCanopy(1));
    const frameGeo = track(buildParasolFrame());
    const canopyMatWhite = track(new THREE.MeshStandardMaterial({ color: 0xf6f2e7, roughness: 0.85, side: THREE.DoubleSide }));
    const canopyMatTint = track(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, side: THREE.DoubleSide }));
    const frameMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }));
    const NU = 60;
    const canWhite = new THREE.InstancedMesh(canopyGeoA, canopyMatWhite, NU);
    const canTint = new THREE.InstancedMesh(canopyGeoB, canopyMatTint, NU);
    const frames = new THREE.InstancedMesh(frameGeo, frameMat, NU);
    const umbCols = [0xff5c8a, 0x29d3ff, 0xffd166, 0xff8c42, 0x43d17a, 0x9b5de5, 0xe63946];
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const qS = new THREE.Quaternion();
    const eul = new THREE.Euler();
    const vP = new THREE.Vector3();
    const vS = new THREE.Vector3();
    const colU = new THREE.Color();
    const umbSpots = [];
    for (let i = 0; i < NU; i++) {
      const x = (rng() - 0.5) * 1100;                   // legacy rng draws — keep order
      const z = 2 + rng() * 16;
      const y = groundHeight(x, z);
      const yaw = rng() * Math.PI;                      // legacy rotY draw
      const tilt = rng3() * 0.31;                       // 0–18°
      const s = 0.85 + rng3() * 0.35;
      eul.set(tilt, yaw, 0, 'YXZ');
      q.setFromEuler(eul);
      vP.set(x, Math.max(y, 0.1), z);
      vS.set(s, s, s);
      m4.compose(vP, q, vS);
      canWhite.setMatrixAt(i, m4);
      canTint.setMatrixAt(i, m4);
      frames.setMatrixAt(i, m4);
      canTint.setColorAt(i, colU.setHex(umbCols[(rng3() * umbCols.length) | 0]));
      umbSpots.push(vP.clone());
    }
    canWhite.castShadow = true;
    canTint.castShadow = true;
    root.add(canWhite, canTint, frames);

    // beach towels scattered around the parasol clusters, draped to the sand slope
    const towelGeo = track(new THREE.PlaneGeometry(0.85, 1.75));
    towelGeo.rotateX(-Math.PI / 2);
    const towelMat = track(new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 1,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }));
    const towelCols = [0xff7096, 0x37c4e0, 0xffe08a, 0x59d98c, 0xb08ae6, 0xf2f2f2, 0xff8c42];
    const NT = 46;
    const towels = new THREE.InstancedMesh(towelGeo, towelMat, NT);
    const up = new THREE.Vector3(0, 1, 0);
    const nrm = new THREE.Vector3();
    let ti = 0;
    for (let i = 0; i < NU && ti < NT; i++) {
      if (rng3() < 0.35) continue;
      const u = umbSpots[i];
      const a = rng3() * Math.PI * 2;
      const dist = 1.3 + rng3() * 1.7;
      const x = u.x + Math.cos(a) * dist, z = u.z + Math.sin(a) * dist;
      const y = groundHeight(x, z);
      if (y < 0.12) continue;
      const e = 0.5;
      nrm.set(
        (groundHeight(x - e, z) - groundHeight(x + e, z)) / (2 * e), 1,
        (groundHeight(x, z - e) - groundHeight(x, z + e)) / (2 * e)
      ).normalize();
      qS.setFromUnitVectors(up, nrm);
      eul.set(0, rng3() * Math.PI * 2, 0);
      q.setFromEuler(eul).premultiply(qS);
      vP.set(x, y + 0.045, z);
      vS.set(1, 1, 1);
      m4.compose(vP, q, vS);
      towels.setMatrixAt(ti, m4);
      towels.setColorAt(ti, colU.setHex(towelCols[(rng3() * towelCols.length) | 0]));
      ti++;
    }
    towels.count = ti;
    towels.receiveShadow = true;
    root.add(towels);
  }

  // ---------------- streetlights + parked cars ----------------
  {
    // curved-arm streetlight: pole + 2-segment gooseneck + fixture, merged;
    // the lamp head hangs from the arm tip out over the road
    const poleGeos = [
      new THREE.CylinderGeometry(0.07, 0.11, 5.7, 7).translate(0, 2.85, 0),
      tubeBetween(new THREE.Vector3(0, 5.62, 0), new THREE.Vector3(0, 6.32, 0.85), 0.055, 6),
      tubeBetween(new THREE.Vector3(0, 6.32, 0.85), new THREE.Vector3(0, 6.52, 1.7), 0.05, 6),
      new THREE.CylinderGeometry(0.16, 0.23, 0.2, 8).translate(0, 6.42, 1.62),
    ];
    const poleGeo = track(mergeGeometries(poleGeos));
    poleGeos.forEach((g) => g.dispose());
    const headGeo = track(new THREE.SphereGeometry(0.19, 8, 6));
    headGeo.translate(0, 6.28, 1.62);
    const poleMat = track(new THREE.MeshStandardMaterial({ color: 0x39424c, roughness: 0.6, metalness: 0.6 }));
    const headMat = track(new THREE.MeshStandardMaterial({ color: 0xfff2cc, emissive: 0xffd27a, emissiveIntensity: 2.2 }));
    const NL = 50;
    const lp = new THREE.InstancedMesh(poleGeo, poleMat, NL);
    const lh = new THREE.InstancedMesh(headGeo, headMat, NL);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < NL; i++) {
      const x = -600 + i * 24.5;
      const z = i % 2 ? 36.5 : 51.5;
      m4.makeRotationY(i % 2 ? 0 : Math.PI);            // arm always reaches toward the road
      m4.setPosition(x, CITY_Y, z);
      lp.setMatrixAt(i, m4);
      lh.setMatrixAt(i, m4);
      addCollider(x, CITY_Y, z, 0.35, 6.4, 0.35);
    }
    root.add(lp); root.add(lh);

    const carGeo = track(new THREE.BoxGeometry(4.2, 1.1, 1.9));
    carGeo.translate(0, 0.75, 0);
    const cabGeo = track(new THREE.BoxGeometry(2.2, 0.75, 1.7));
    cabGeo.translate(-0.2, 1.65, 0);
    // 4 wheels baked into one merged geometry per instance (1 extra draw call)
    const wheelParts = [];
    for (const wx of [-1.35, 1.35]) {
      for (const wz of [-0.78, 0.78]) {
        const g = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 10);
        g.rotateX(Math.PI / 2);
        g.translate(wx, 0.33, wz);
        wheelParts.push(g);
      }
    }
    const wheelGeo = track(mergeGeometries(wheelParts));
    wheelParts.forEach((g) => g.dispose());
    const carCols = [0xff5c8a, 0x29d3ff, 0xf5e9d0, 0x9b5de5, 0x43d17a, 0xffffff, 0x22262e];
    const NC = 34;
    const carMat = track(new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.5 }));
    const cabMat = track(new THREE.MeshStandardMaterial({ color: 0x0b1016, roughness: 0.1, metalness: 0.9 }));
    const wheelMat = track(new THREE.MeshStandardMaterial({ color: 0x14171b, roughness: 0.9, metalness: 0.1 }));
    const cars = new THREE.InstancedMesh(carGeo, carMat, NC);
    const cabs = new THREE.InstancedMesh(cabGeo, cabMat, NC);
    const wheels = new THREE.InstancedMesh(wheelGeo, wheelMat, NC);
    const col = new THREE.Color();
    const m4b = new THREE.Matrix4();
    for (let i = 0; i < NC; i++) {
      const x = -560 + i * 34 + (rng() - 0.5) * 8;
      const z = i % 2 ? 39.5 : 48.5;
      m4b.makeRotationY(i % 2 ? 0 : Math.PI);
      m4b.setPosition(x, CITY_Y, z);
      cars.setMatrixAt(i, m4b);
      cabs.setMatrixAt(i, m4b);
      wheels.setMatrixAt(i, m4b);
      cars.setColorAt(i, col.setHex(carCols[(rng() * carCols.length) | 0]));
      addCollider(x, CITY_Y, z, 4.2, 2.1, 1.9);
    }
    cars.castShadow = true;
    root.add(cars); root.add(cabs); root.add(wheels);
  }

  // ---------------- skyline ----------------
  // winTexA/B consume main-rng draws — always create both to preserve the stream
  // (winTexB is only rendered in the no-facade fallback).
  const winTexA = track(windowTexture(rng, 0.5));
  const winTexB = track(windowTexture(rng, 0.65, 0.4));
  const decoCols = [0xf2b8c6, 0x7fd4c1, 0xf5e9d0, 0xffb385, 0xc3b4e6];

  // Facade physical calibration (verified against the albedo images):
  //   facade_glass = 28 window columns x 18 floor bands per tile
  //     → at 1.5 m windows / 3.2 m floors one tile spans 42 m x 57.6 m.
  //   facade_day   = 15 panels x 10 floors, square tile
  //     → 32 m x 32 m keeps the source aspect exactly (2.13 m panels, 3.2 m floors).
  // Every tower maps facades at these constant physical scales via facadeUV(),
  // with a per-tower random UV offset so neighbours never repeat in sync.
  const GLASS_TILE_U = 28 * 1.5, GLASS_TILE_V = 18 * 3.2;
  const DAY_TILE_U = 27, DAY_TILE_V = 32;   // 1.8 m panels — reads as windows, not glass blocks
  const hasGlassTex = !!glassSet.map;
  let glassMat;
  if (hasGlassTex) {
    glassMat = track(new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1,                      // rough.jpg governs
      metalness: 0.12,
      map: glassSet.map,
      normalMap: glassSet.normalMap || null,
      roughnessMap: glassSet.roughnessMap || null,
      emissive: 0xffffff,
      emissiveMap: glassSet.emissiveMap || glassSet.map,
      emissiveIntensity: glassSet.emissiveMap ? 1.1 : 0.6,   // lit night windows
    }));
  } else {
    glassMat = track(new THREE.MeshStandardMaterial({
      color: 0x8fb8c9, roughness: 0.12, metalness: 0.92,
      emissiveMap: winTexB, emissive: 0xffffff, emissiveIntensity: 0.85,
    }));
  }
  const towerGroup = new THREE.Group();

  function addTower(x, z, w, h, d, style) {
    // per-tower UV offset (rng3 — never the layout stream)
    const offU = rng3(), offV = rng3();
    if (style === 'deco') {
      const color = decoCols[(rng() * decoCols.length) | 0];
      const mat = track(new THREE.MeshStandardMaterial({
        color, roughness: 0.75,
        emissiveMap: winTexA, emissive: 0xffffff, emissiveIntensity: 0.55,
      }));
      // pastel-tinted facade_day overlay when present, mapped at true window
      // scale; emissive follows the same texture so day/night grids agree
      if (facadeDaySet.map) {
        mat.color.lerp(new THREE.Color(0xffffff), 0.35);   // softer pastel, less "colored glass block"
        mat.map = facadeDaySet.map;
        if (facadeDaySet.normalMap) {
          mat.normalMap = facadeDaySet.normalMap;
          mat.normalScale.set(0.35, 0.35);                 // tame the panel bevel
        }
        if (facadeDaySet.roughnessMap) mat.roughnessMap = facadeDaySet.roughnessMap;
        mat.emissiveMap = facadeDaySet.map;
        mat.emissive = new THREE.Color(0xffe6bb);
        mat.emissiveIntensity = 0.3;
      }
      let y = CITY_Y;
      const tiers = 2 + ((rng() * 2) | 0);
      let tw = w, td = d;
      for (let t = 0; t < tiers; t++) {
        const th = h * (t === 0 ? 0.55 : 0.45 / (tiers - 1));
        const geo = track(new THREE.BoxGeometry(tw, th, td));
        if (facadeDaySet.map) {
          facadeUV(geo, tw, th, td, DAY_TILE_U, DAY_TILE_V, offU, offV);
        } else {
          const uv = geo.attributes.uv;
          for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(1, tw / 14), uv.getY(i) * Math.max(1, th / 26));
        }
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y + th / 2, z);
        mesh.castShadow = true;
        towerGroup.add(mesh);
        y += th;
        tw *= 0.72; td *= 0.72;
      }
      // parapet cylinder
      const capGeo = track(new THREE.CylinderGeometry(Math.min(tw, td) * 0.4, Math.min(tw, td) * 0.42, 3.5, 10));
      if (facadeDaySet.map) {
        const uv = capGeo.attributes.uv;
        const su = (Math.PI * Math.min(tw, td) * 0.8) / DAY_TILE_U, sv = 3.5 / DAY_TILE_V;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su + offU, uv.getY(i) * sv + offV);
      }
      const cap = new THREE.Mesh(capGeo, mat);
      cap.position.set(x, y + 1.7, z);
      towerGroup.add(cap);
      // neon accent strip
      if (rng() < 0.6) {
        const neonGeo = track(new THREE.BoxGeometry(w * 1.02, 0.5, 0.3));
        const neonMat = track(new THREE.MeshStandardMaterial({
          color: 0x111111,
          emissive: rng() < 0.5 ? 0x29d3ff : 0xff5c8a,
          emissiveIntensity: 3.2,
        }));
        const neon = new THREE.Mesh(neonGeo, neonMat);
        neon.position.set(x, CITY_Y + h * 0.5, z - d / 2 - 0.2);
        towerGroup.add(neon);
      }
    } else if (style === 'cyl') {
      const geo = track(new THREE.CylinderGeometry(w / 2, w / 2, h, 18));
      const uv = geo.attributes.uv;
      const su = hasGlassTex ? (Math.PI * w) / GLASS_TILE_U : Math.max(1, (Math.PI * w) / 16);
      const sv = hasGlassTex ? h / GLASS_TILE_V : Math.max(1, h / 26);
      const ou = hasGlassTex ? offU : 0, ov = hasGlassTex ? offV : 0;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su + ou, uv.getY(i) * sv + ov);
      const mesh = new THREE.Mesh(geo, glassMat);
      mesh.position.set(x, CITY_Y + h / 2, z);
      mesh.castShadow = true;
      towerGroup.add(mesh);
      d = w;
    } else {
      const geo = track(new THREE.BoxGeometry(w, h, d));
      if (hasGlassTex) {
        facadeUV(geo, w, h, d, GLASS_TILE_U, GLASS_TILE_V, offU, offV);
      } else {
        const uv = geo.attributes.uv;
        const su = Math.max(1, w / 14), sv = Math.max(1, h / 26);
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
      }
      const mesh = new THREE.Mesh(geo, glassMat);
      mesh.position.set(x, CITY_Y + h / 2, z);
      mesh.castShadow = true;
      towerGroup.add(mesh);
      // roof details
      if (rng() < 0.5) {
        const acGeo = track(new THREE.BoxGeometry(w * 0.25, 2.5, d * 0.25));
        const acMat = track(new THREE.MeshStandardMaterial({ color: 0x6d747c, roughness: 0.9 }));
        const ac = new THREE.Mesh(acGeo, acMat);
        ac.position.set(x + w * 0.2, CITY_Y + h + 1.25, z);
        towerGroup.add(ac);
      }
      if (rng() < 0.4) {
        const mastGeo = track(new THREE.CylinderGeometry(0.15, 0.15, 14, 5));
        const mastMat = track(new THREE.MeshStandardMaterial({ color: 0xaab0b8 }));
        const mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(x, CITY_Y + h + 7, z);
        towerGroup.add(mast);
        const beacon = new THREE.Mesh(
          track(new THREE.SphereGeometry(0.4, 6, 5)),
          track(new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff2222, emissiveIntensity: 4 }))
        );
        beacon.position.set(x, CITY_Y + h + 14, z);
        towerGroup.add(beacon);
      }
    }
    addCollider(x, CITY_Y, z, w, h + 4, d);
    towerData.push({ x, z, w, h, d });
  }

  const towerData = [];
  {
    const rows = [
      { z: 78, hMin: 35, hMax: 90 },
      { z: 125, hMin: 55, hMax: 140 },
      { z: 185, hMin: 80, hMax: 185 },
    ];
    for (const row of rows) {
      for (let x = -560; x <= 560; x += 62) {
        if (((x + 700) % 186) < 26) continue;            // street gaps
        if (rng() < 0.18) continue;
        const w = 20 + rng() * 22;
        const d = 18 + rng() * 18;
        const h = row.hMin + rng() * (row.hMax - row.hMin);
        const style = rng() < 0.42 && row.z < 130 ? 'deco' : rng() < 0.12 ? 'cyl' : 'glass';
        addTower(x + (rng() - 0.5) * 10, row.z + (rng() - 0.5) * 16, w, h, d, style);
      }
    }
  }
  root.add(towerGroup);

  // backdrop city (cheap, far)
  {
    const geos = [];
    for (let i = 0; i < 60; i++) {
      const w = 30 + rng() * 50, h = 40 + rng() * 160, d = 30 + rng() * 40;
      const g = new THREE.BoxGeometry(w, h, d);
      g.translate(-800 + rng() * 1600, CITY_Y + h / 2, 300 + rng() * 320);
      geos.push(g);
    }
    const merged = track(mergeGeometries(geos));
    geos.forEach(g => g.dispose());
    const mat = track(new THREE.MeshStandardMaterial({ color: 0x3d4653, roughness: 0.9, emissive: 0x2a3444, emissiveIntensity: 0.35 }));
    root.add(new THREE.Mesh(merged, mat));
  }

  // ---------------- ferris wheel ----------------
  const wheel = new THREE.Group();
  const WHEEL_X = -215, WHEEL_Z = 42, WHEEL_R = 20;
  {
    const hubY = CITY_Y + WHEEL_R + 4;
    const legGeo = track(new THREE.BoxGeometry(1.4, WHEEL_R + 4, 1.4));
    const legMat = track(new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.5, metalness: 0.6 }));
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(WHEEL_X + side * 5, CITY_Y + (WHEEL_R + 4) / 2, WHEEL_Z);
      leg.rotation.z = side * 0.32;
      leg.castShadow = true;
      root.add(leg);
      addCollider(WHEEL_X + side * 6.5, CITY_Y, WHEEL_Z, 3, WHEEL_R + 4, 3);
    }
    // twin offset rims + cross-braces so the wheel reads structural
    const RIM_Z = 0.7;
    const rimGeo = track(new THREE.TorusGeometry(WHEEL_R, 0.3, 8, 48));
    const rimMat = track(new THREE.MeshStandardMaterial({ color: 0x223, emissive: 0x29d3ff, emissiveIntensity: 1.6, roughness: 0.4 }));
    for (const zs of [-1, 1]) {
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.z = zs * RIM_Z;
      wheel.add(rim);
    }
    const spokeMat = track(new THREE.MeshStandardMaterial({ color: 0xccd4da, roughness: 0.5 }));
    {
      const braceGeos = [];
      for (let i = 0; i < 24; i++) {
        const g = new THREE.BoxGeometry(0.14, 0.14, RIM_Z * 2);
        g.translate(0, WHEEL_R, 0);
        g.rotateZ((i / 24) * Math.PI * 2);
        braceGeos.push(g);
      }
      const braces = new THREE.Mesh(track(mergeGeometries(braceGeos)), spokeMat);
      braceGeos.forEach((g) => g.dispose());
      wheel.add(braces);
      // 6 full-diameter spokes per rim + hub axle, merged into one mesh
      const spokeGeos = [];
      for (let i = 0; i < 6; i++) {
        for (const zs of [-1, 1]) {
          const g = new THREE.BoxGeometry(0.2, WHEEL_R * 2, 0.2);
          g.rotateZ((i / 6) * Math.PI);
          g.translate(0, 0, zs * RIM_Z);
          spokeGeos.push(g);
        }
      }
      const axle = new THREE.CylinderGeometry(0.55, 0.55, RIM_Z * 2 + 0.7, 10);
      axle.rotateX(Math.PI / 2);
      spokeGeos.push(axle);
      const spokes = new THREE.Mesh(track(mergeGeometries(spokeGeos)), spokeMat);
      spokeGeos.forEach((g) => g.dispose());
      wheel.add(spokes);
    }
    // gondolas with a pyramid roof cap + hanger arm (merged, still 1 mesh each)
    const cabParts = [new THREE.BoxGeometry(2.1, 1.4, 2.1).translate(0, -0.4, 0)];
    {
      const roofCap = new THREE.ConeGeometry(1.62, 0.7, 4);
      roofCap.rotateY(Math.PI / 4);
      roofCap.translate(0, 0.65, 0);
      cabParts.push(roofCap);
      cabParts.push(new THREE.BoxGeometry(0.1, 0.7, 0.1).translate(0, 1.25, 0));
    }
    const cabGeo = track(mergeGeometries(cabParts));
    cabParts.forEach((g) => g.dispose());
    const cabCols = [0xff5c8a, 0x29d3ff, 0xffd166, 0x43d17a];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const cabMat = track(new THREE.MeshStandardMaterial({
        color: cabCols[i % 4], roughness: 0.5,
        emissive: cabCols[i % 4], emissiveIntensity: 0.8,
      }));
      const cab = new THREE.Mesh(cabGeo, cabMat);
      cab.position.set(Math.cos(a) * WHEEL_R, Math.sin(a) * WHEEL_R, 0);
      cab.userData.angle = a;
      wheel.add(cab);
    }
    wheel.position.set(WHEEL_X, hubY, WHEEL_Z);
    root.add(wheel);
  }

  // ---------------- MIAMI sign ----------------
  {
    const segGeo = track(new THREE.BoxGeometry(1, 1, 0.8));
    const segMat = track(new THREE.MeshStandardMaterial({ color: 0x2a1030, emissive: 0xff40c0, emissiveIntensity: 3.5, roughness: 0.4 }));
    // 5x5 grid glyphs for M I A M I
    const glyphs = {
      M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
      I: ['.###.', '..#..', '..#..', '..#..', '.###.'],
      A: ['.###.', '#...#', '#####', '#...#', '#...#'],
    };
    const word = 'MIAMI';
    const geos = [];
    let ox = 0;
    for (const ch of word) {
      const rowsG = glyphs[ch];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (rowsG[r][c] === '#') {
            const g = segGeo.clone();
            g.scale(1.6, 1.6, 1);
            g.translate(ox + c * 1.7, (4 - r) * 1.7, 0);
            geos.push(g);
          }
        }
      }
      ox += 5 * 1.7 + 2.5;
    }
    const merged = track(mergeGeometries(geos));
    geos.forEach(g => g.dispose());
    const sign = new THREE.Mesh(merged, segMat);
    const SIGN_X = 60, SIGN_Z = 14;
    const sy = groundHeight(SIGN_X + 22, SIGN_Z) + 2.4;
    sign.position.set(SIGN_X, sy, SIGN_Z);
    root.add(sign);
    const postGeo = track(new THREE.BoxGeometry(0.7, 3, 0.7));
    const postMat = track(new THREE.MeshStandardMaterial({ color: 0x8a8f95 }));
    for (const px of [SIGN_X + 3, SIGN_X + 40]) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(px, sy - 1.5, SIGN_Z);
      root.add(post);
    }
    addCollider(SIGN_X + 22, sy - 3, SIGN_Z, 46, 12, 1.6);
  }

  // ---------------- marina ----------------
  const boats = [];
  {
    const MAR_X = 300;
    const dockTex = track(stripeTexture('#96714a', '#755634'));
    dockTex.repeat.set(2, 16);
    const dockGeo = track(new THREE.BoxGeometry(4, 0.4, 90));
    const dockMat = track(new THREE.MeshStandardMaterial({ map: dockTex, roughness: 0.95 }));
    for (const dx of [0, 26, 52]) {
      const dock = new THREE.Mesh(dockGeo, dockMat);
      dock.position.set(MAR_X + dx, 0.6, -55);
      root.add(dock);
      addCollider(MAR_X + dx, 0.2, -55, 4, 0.9, 90);
    }
    // boats v2 — lofted hulls; the legacy rng draws keep their exact order:
    // (1) size, (2) sail/motor pick, (3) dock, (4) side, (5) z, (6) yaw, (7) phase
    const boatMat = track(new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.42, metalness: 0.08, side: THREE.DoubleSide,
    }));
    const accCols = [0x1c6fb8, 0x2aa198, 0xc2453f, 0x28527a, 0xd98e32];
    for (let i = 0; i < 8; i++) {
      const b = new THREE.Group();
      const sizeDraw = 0.8 + rng() * 0.5;               // legacy hull-scale draw
      const isSail = rng() < 0.6;                       // legacy mast-chance draw
      const accent = accCols[(rng3() * accCols.length) | 0];
      const geo = track(isSail ? buildSailboat(sizeDraw, accent) : buildMotorYacht(sizeDraw, accent));
      const mesh = new THREE.Mesh(geo, boatMat);
      mesh.castShadow = true;
      b.add(mesh);
      b.position.set(MAR_X - 8 + (rng() * 3 | 0) * 26 + (rng() < 0.5 ? -7 : 7), 0.35, -20 - rng() * 70);
      b.rotation.y = rng() * 0.4 - 0.2 + Math.PI / 2;
      b.userData.phase = rng() * Math.PI * 2;
      boats.push(b);
      root.add(b);
    }
  }

  // ---------------- helipad towers ----------------
  for (const [hx, hz] of [[430, 70], [-430, 100]]) {
    const h = 45 + rng() * 20;
    const geo = track(new THREE.BoxGeometry(16, h, 16));
    if (hasGlassTex) {
      facadeUV(geo, 16, h, 16, GLASS_TILE_U, GLASS_TILE_V, rng3(), rng3());
    } else {
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * (h / 26));
    }
    const mesh = new THREE.Mesh(geo, glassMat);
    mesh.position.set(hx, CITY_Y + h / 2, hz);
    mesh.castShadow = true;
    root.add(mesh);
    const padGeo = track(new THREE.CylinderGeometry(6, 6, 0.4, 24));
    const padMat = track(new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.9 }));
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(hx, CITY_Y + h + 0.2, hz);
    root.add(pad);
    const hGeo = track(new THREE.RingGeometry(3.4, 4.2, 24));
    const hMat = track(new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 1.5, side: THREE.DoubleSide }));
    const ring = new THREE.Mesh(hGeo, hMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(hx, CITY_Y + h + 0.45, hz);
    root.add(ring);
    addCollider(hx, CITY_Y, hz, 16, h + 1, 16);
    towerData.push({ x: hx, z: hz, w: 16, h, d: 16 });
  }

  // ---------------- photoscan rocks + tropical dressing (rng2 only) ----------------
  const scatterSafe = async (slug, placements, colliderList, colliderSize) => {
    if (!placements.length) return;
    try {
      const h = await scatterModels(root, slug, placements, colliderList, colliderSize);
      if (h) scatterHandles.push(h);
    } catch (e) {
      console.warn(`[miami] scatter '${slug}' skipped:`, e);
    }
  };
  {
    // breakwater — half-submerged boulders along the waterline, x 120..260
    const seabed = (x, z) => baseProfile(z) + sandNoise(x, z) * Math.max(0, 1 - Math.abs(z) / 60);
    const bwBoulders = [], bwRocks = [];
    for (let i = 0; i < 14; i++) {
      const x = 122 + i * 10.3 + (rng2() - 0.5) * 4;
      const z = -30.5 - rng2() * 6;
      const sc = 1.5 + rng2() * 1.5;
      const item = { x, y: seabed(x, z) - 0.12 * sc, z, scale: sc, rotY: rng2() * Math.PI * 2 };
      (i % 2 ? bwRocks : bwBoulders).push(item);
    }
    await scatterSafe('boulder_01', bwBoulders, colliders, 2.2);
    await scatterSafe('rock_07', bwRocks, colliders, 2.2);

    // small photoscan rocks scattered on the sand (no colliders)
    const beachRocks = [];
    let tries = 0;
    while (beachRocks.length < 10 && tries++ < 60) {
      const x = -520 + rng2() * 1060;
      const z = 3 + rng2() * 15;
      if (Math.abs(x - PIER_X) < 15) continue;                    // pier
      if (x > 42 && x < 112 && z < 22) continue;                  // MIAMI sign
      if (Math.abs(x) < 7 && Math.abs(z - 8) < 7) continue;       // spawn pad
      const y = groundHeight(x, z);
      if (y < 0.15) continue;
      beachRocks.push({ x, y: y - 0.05, z, scale: 0.35 + rng2() * 0.45, rotY: rng2() * Math.PI * 2 });
    }
    await scatterSafe('rock_07', beachRocks, null, 0);
  }
  {
    // shrubs + broadleafs along boardwalk planters and between road and beach
    const s02 = [], s03 = [], anth = [];
    let placedS = 0, tries = 0;
    while (placedS < 40 && tries++ < 240) {
      const planter = rng2() < 0.55;
      const x = -580 + rng2() * 1160;
      const z = planter ? 31.8 + rng2() * 4.6 : 18 + rng2() * 6;
      if (Math.abs(x - PIER_X) < 14) continue;
      if (Math.abs(x - WHEEL_X) < 16 && z > 30) continue;         // ferris wheel base
      if (x > 42 && x < 112 && z < 26) continue;                  // MIAMI sign
      const y = groundHeight(x, z);
      if (y < 0.25) continue;
      const item = { x, y: y - 0.03, z, scale: 0.8 + rng2() * 0.7, rotY: rng2() * Math.PI * 2 };
      const pick = placedS % 4;
      (pick === 3 ? anth : pick === 1 ? s03 : s02).push(item);
      placedS++;
    }
    await scatterSafe('shrub_02', s02, null, 0);
    await scatterSafe('shrub_03', s03, null, 0);
    await scatterSafe('anthurium_botany_01', anth, null, 0);

    // fern clusters at the front-row tower bases
    const ferns = [];
    for (const t of towerData) {
      if (ferns.length >= 20) break;
      if (t.z > 110 || Math.abs(t.x) > 320) continue;
      const n = 2 + ((rng2() * 2) | 0);
      for (let k = 0; k < n && ferns.length < 20; k++) {
        const fx = t.x - t.w / 2 + rng2() * t.w;
        const fz = t.z - t.d / 2 - 1.2 - rng2() * 1.8;
        if (fz < 52.5) continue;                                  // keep off the road
        ferns.push({ x: fx, y: CITY_Y, z: fz, scale: 0.8 + rng2() * 0.6, rotY: rng2() * Math.PI * 2 });
      }
    }
    await scatterSafe('fern_02', ferns, null, 0);
  }

  // ---------------- spawn / home pad ----------------
  const spawnPos = new THREE.Vector3(0, groundHeight(0, 8) + 0.06, 8);
  {
    const padGeo = track(new THREE.CircleGeometry(2.2, 28));
    const padMat = track(new THREE.MeshStandardMaterial({ color: 0x0d2b33, emissive: 0x29d3ff, emissiveIntensity: 0.9, side: THREE.DoubleSide }));
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.copy(spawnPos).y += 0.02;
    root.add(pad);
  }

  // ---------------- race gates ----------------
  const G = (x, z, y, yawDeg, radius = 3.4) =>
    ({ position: new THREE.Vector3(x, y, z), yawRad: THREE.MathUtils.degToRad(yawDeg), radius });
  const gates = [
    G(-40, 6, 5, 90),                                   // 1: down the beach
    G(-100, 2, 4, 90),                                  // 2: low over sand
    G(-150, -50, 1.8, 95, 3.0),                         // 3: UNDER the pier deck
    G(-185, -95, 6, 110),                               // 4: out over water
    G(-235, -30, 8, 160),                               // 5: bank back toward shore
    G(-215, 42, CITY_Y + WHEEL_R + 4, 180, 3.0),        // 6: through the ferris wheel hub plane
    G(-160, 44, 8, 90),                                 // 7: down Ocean Drive
    G(-60, 44, 6, 90),                                  // 8: street slalom
    G(30, 44, 8, 90),                                   // 9
    G(95, 100, 25, 45),                                 // 10: climb between towers
    G(150, 60, 14, 130),                                // 11: back over boardwalk
    G(82, 18, 10, 250, 3.2),                            // 12: past the MIAMI sign, home
  ];

  // ---------------- retrieval points ----------------
  const retrievalPoints = [];
  {
    // rooftops of a few mid towers
    let count = 0;
    for (const t of towerData) {
      if (count >= 4) break;
      if (t.h > 40 && t.h < 120 && Math.abs(t.x) < 300) {
        retrievalPoints.push(new THREE.Vector3(t.x + t.w / 4, CITY_Y + t.h + 1.2, t.z + t.d / 4));
        count++;
      }
    }
    retrievalPoints.push(new THREE.Vector3(PIER_X, 1.2, CITY_Z - 60));          // under the pier
    retrievalPoints.push(new THREE.Vector3(PIER_X, 12.4, CITY_Z - 168));        // pier pavilion roof
    retrievalPoints.push(new THREE.Vector3(-430 + 165, groundHeight(-265, 12) + 6, 12)); // lifeguard hut roof
    retrievalPoints.push(new THREE.Vector3(300, 1.6, -80));                      // marina dock end
    retrievalPoints.push(new THREE.Vector3(82, groundHeight(82, 14) + 11, 14));  // atop the MIAMI sign
    retrievalPoints.push(new THREE.Vector3(430, CITY_Y + 66, 70));               // helipad
  }

  // ---------------- handle ----------------
  let time = 0;
  return {
    name: 'Miami Skyline',
    spawn: { position: spawnPos, yawRad: Math.PI / 2 },
    getGroundHeight: groundHeight,
    colliders,
    gates,
    retrievalPoints,
    homePad: spawnPos.clone(),
    update(dt) {
      time += dt;
      if (water) {
        water.material.uniforms['time'].value += dt * 0.6;
        // water must go dark at night — the Water shader has its own sun
        const tod = settings.environment.timeOfDay;
        const dayF = Math.max(0.03, Math.sin(Math.PI * clamp((tod - 6.2) / 13.2, 0, 1)));
        water.material.uniforms['sunColor'].value.setScalar(dayF);
        water.material.uniforms['waterColor'].value.setHex(0x00404f).multiplyScalar(0.12 + 0.88 * dayF);
      }
      wheel.rotation.z += dt * 0.12;
      // keep cabins upright
      for (const child of wheel.children) {
        if (child.userData.angle !== undefined) child.rotation.z = -wheel.rotation.z;
      }
      for (const b of boats) {
        b.position.y = 0.35 + Math.sin(time * 1.1 + b.userData.phase) * 0.12;
        b.rotation.x = Math.sin(time * 0.9 + b.userData.phase) * 0.03;
      }
      if (palms) palms.update(dt);
    },
    dispose(sceneRef) {
      sceneRef.remove(root);
      try { palms?.dispose?.(); } catch (e) { /* noop */ }
      for (const h of scatterHandles) { try { h.dispose?.(); } catch (e) { /* noop */ } }
      for (const d of disposables) { try { d.dispose?.(); } catch (e) { /* noop */ } }
    },
  };
}
