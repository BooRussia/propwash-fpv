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
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
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

// Deck planking with per-plank tone jitter, butt joints and grain streaks.
// Deterministic (own PRNG) — never touches the layout streams.
function plankTexture(baseHex, seed = 7, w = 512, h = 512, planks = 16) {
  const r = mulberry32(seed);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const base = new THREE.Color(baseHex);
  const ph = h / planks;
  for (let i = 0; i < planks; i++) {
    const t = base.clone().offsetHSL((r() - 0.5) * 0.035, (r() - 0.5) * 0.14, (r() - 0.5) * 0.13);
    g.fillStyle = `#${t.getHexString()}`;
    g.fillRect(0, i * ph, w, ph);
    // lengthwise grain
    for (let k = 0; k < 26; k++) {
      const gy = i * ph + 2 + r() * (ph - 4);
      g.strokeStyle = `rgba(0,0,0,${0.03 + r() * 0.05})`;
      g.lineWidth = 0.6 + r();
      g.beginPath();
      g.moveTo(r() * w * 0.4, gy);
      g.lineTo(r() * w * 0.4 + w * 0.45, gy + (r() - 0.5) * 2);
      g.stroke();
    }
    // butt joint across the plank
    const jx = (r() * w) | 0;
    g.fillStyle = 'rgba(0,0,0,0.32)';
    g.fillRect(jx, i * ph + 1, 2, ph - 2);
    // shadowed gap between boards
    g.fillStyle = 'rgba(0,0,0,0.42)';
    g.fillRect(0, i * ph, w, 2);
    g.fillStyle = 'rgba(255,255,255,0.07)';
    g.fillRect(0, i * ph + 2, w, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

// Mottled foliage sheet — stops clipped hedges reading as painted plastic.
function foliageTexture() {
  const r = mulberry32(0x1EAF);
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#5f7d4a'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    const l = r();
    g.fillStyle = l < 0.42
      ? `rgba(28,46,22,${0.25 + r() * 0.5})`
      : l < 0.82 ? `rgba(96,128,64,${0.2 + r() * 0.45})`
        : `rgba(158,190,110,${0.15 + r() * 0.35})`;
    const s = 3 + r() * 8;
    g.beginPath();
    g.ellipse(r() * 128, r() * 128, s, s * (0.4 + r() * 0.5), r() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Parking-lot asphalt with painted stalls — one tile = one 2-row bay.
function parkingTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const r = mulberry32(0x9A5);
  g.fillStyle = '#6e7276'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) {
    const v = r() < 0.5 ? 40 : 210;
    g.fillStyle = `rgba(${v},${v},${v},${r() * 0.10})`;
    g.fillRect(r() * 256, r() * 256, 2 + r() * 3, 2 + r() * 3);
  }
  // patched seams
  for (let i = 0; i < 6; i++) {
    g.fillStyle = `rgba(50,52,55,${0.12 + r() * 0.14})`;
    g.fillRect(0, r() * 256, 256, 3 + r() * 7);
  }
  g.fillStyle = 'rgba(226,220,196,0.46)';
  for (let x = 8; x < 256; x += 30) {
    g.fillRect(x, 14, 3, 74);
    g.fillRect(x, 168, 3, 74);
  }
  g.fillRect(0, 86, 256, 3);
  g.fillRect(0, 165, 256, 3);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
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

// ---------- streetscape kit (props-v3) ----------
// Benches, bins, hydrants, meters, bike racks, balconies, rooftop
// clutter. All builders return vertex-coloured BufferGeometries
// (position/normal/uv/color) ready to merge or instance.
function cSph(r, w, h, hex, x, y, z, sy = 1) {
  const g = new THREE.SphereGeometry(r, w, h);
  if (sy !== 1) g.scale(1, sy, 1);
  g.translate(x, y, z);
  return colorFill(g, hex);
}

// Slatted park bench, facing -z (back rest at +z). Origin at ground.
function buildBenchGeo() {
  const wood = 0xa5714a, frame = 0x2b3036;
  const G = [];
  for (const sx of [-0.78, 0.78]) {
    G.push(cBox(0.07, 0.44, 0.58, frame, sx, 0.22, 0));
    G.push(cBox(0.07, 0.55, 0.07, frame, sx, 0.66, 0.27, -0.12));
  }
  for (const dz of [-0.225, -0.075, 0.075, 0.225]) {
    G.push(cBox(1.72, 0.045, 0.13, wood, 0, 0.455, dz));
  }
  for (const dy of [0.62, 0.77, 0.92]) {
    G.push(cBox(1.72, 0.115, 0.045, wood, 0, dy, 0.285 + (dy - 0.62) * 0.12, -0.12));
  }
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

// Classic squat fire hydrant. Origin at ground.
function buildHydrantGeo() {
  const red = 0xd63426, cap = 0xf2ead8;
  const G = [
    cCyl(0.2, 0.23, 0.07, 10, 0x8f8a80, 0, 0.035, 0),
    cCyl(0.145, 0.17, 0.52, 10, red, 0, 0.32, 0),
    cSph(0.15, 10, 7, red, 0, 0.6, 0, 0.8),
    cCyl(0.05, 0.045, 0.1, 6, cap, 0, 0.71, 0),
  ];
  for (const a of [0, Math.PI / 2, Math.PI * 1.5]) {
    G.push(cCyl(0.075, 0.06, 0.1, 8, cap, Math.sin(a) * 0.19, 0.38, Math.cos(a) * 0.19, Math.PI / 2, a, 0));
  }
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

// Litter bin. Origin at ground.
function buildBinGeo() {
  const G = [
    cCyl(0.25, 0.21, 0.58, 10, 0x35594a, 0, 0.31, 0),
    cCyl(0.265, 0.265, 0.07, 10, 0x22282e, 0, 0.635, 0),
    cCyl(0.19, 0.19, 0.035, 8, 0x0c0f12, 0, 0.68, 0),
    cCyl(0.27, 0.27, 0.05, 10, 0x22282e, 0, 0.1, 0),
  ];
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

// Parking meter, display facing +-z. Origin at ground.
function buildMeterGeo() {
  const G = [
    cCyl(0.026, 0.032, 1.08, 6, 0x5a636b, 0, 0.54, 0),
    cBox(0.17, 0.24, 0.09, 0x37525c, 0, 1.2, 0),
    cCyl(0.095, 0.095, 0.085, 10, 0x37525c, 0, 1.33, 0, Math.PI / 2),
    cBox(0.12, 0.11, 0.096, 0xd8d3c8, 0, 1.19, 0),
  ];
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

// 3-hoop bike rack, hoops in the YZ plane spaced along x. Origin at ground.
function buildBikeRackGeo() {
  const steel = 0x9aa6b0;
  const G = [];
  for (const dx of [-0.5, 0, 0.5]) {
    const hoop = new THREE.TorusGeometry(0.33, 0.028, 6, 12, Math.PI);
    hoop.rotateY(Math.PI / 2);
    hoop.translate(dx, 0.55, 0);
    G.push(colorFill(hoop, steel));
    for (const dz of [-0.33, 0.33]) G.push(cCyl(0.028, 0.028, 0.56, 6, steel, dx, 0.28, dz));
  }
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

// Balcony unit: slab + glass parapet + railing. Origin at the wall
// face, extends +z outward; place with rotY per building face.
function buildBalconyGeo() {
  const conc = 0xe3e7ea, rail = 0x252c33, glass = 0x9fc0cd;
  const G = [
    cBox(3.15, 0.14, 1.2, conc, 0, 0.07, 0.6),
    cBox(3.15, 0.06, 0.05, rail, 0, 1.06, 1.17),
    cBox(0.05, 0.06, 1.16, rail, -1.55, 1.06, 0.58),
    cBox(0.05, 0.06, 1.16, rail, 1.55, 1.06, 0.58),
    cBox(3.02, 0.78, 0.035, glass, 0, 0.6, 1.165),
    cBox(0.035, 0.78, 1.1, glass, -1.53, 0.6, 0.585),
    cBox(0.035, 0.78, 1.1, glass, 1.53, 0.6, 0.585),
  ];
  for (const px of [-1.5, -0.75, 0, 0.75, 1.5]) G.push(cBox(0.05, 0.95, 0.05, rail, px, 0.6, 1.165));
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

// Rooftop clutter kit: AC pair + water tank + timber pergola,
// merged into one instanced geometry. Origin at roof level.
function buildRooftopKitGeo() {
  const G = [];
  G.push(cBox(1.7, 0.95, 1.25, 0x9ba3ab, -2.1, 0.48, -1.1));
  G.push(cCyl(0.52, 0.52, 0.06, 12, 0x3c4249, -2.1, 0.98, -1.1));
  G.push(cBox(1.25, 0.8, 1.05, 0x8d959d, -0.55, 0.4, -1.2));
  G.push(cCyl(0.4, 0.4, 0.05, 12, 0x3c4249, -0.55, 0.83, -1.2));
  G.push(cCyl(0.95, 0.95, 1.8, 12, 0xcac3b2, 1.9, 1.32, -0.8));
  G.push(cCyl(0.02, 0.98, 0.55, 12, 0xb4ac99, 1.9, 2.49, -0.8));
  for (const [lx, lz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) {
    G.push(cBox(0.14, 0.45, 0.14, 0x6d747c, 1.9 + lx, 0.22, -0.8 + lz));
  }
  for (const [px, pz] of [[-1.7, 1.2], [1.7, 1.2], [-1.7, 2.9], [1.7, 2.9]]) {
    G.push(cBox(0.13, 2.15, 0.13, 0xb99a6f, px, 1.07, pz));
  }
  G.push(cBox(3.7, 0.09, 0.14, 0xb99a6f, 0, 2.2, 1.2));
  G.push(cBox(3.7, 0.09, 0.14, 0xb99a6f, 0, 2.2, 2.9));
  for (let i = 0; i < 7; i++) G.push(cBox(0.09, 0.07, 1.95, 0xcaa87a, -1.62 + i * 0.54, 2.28, 2.05));
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
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
  // Fourth stream for the streetscape pass (vehicle kinds, furniture jitter,
  // landscaping, massing variants). rng/rng2/rng3 sequences stay untouched.
  const rng4 = mulberry32(0x0C0FFEE5);
  // vehicles.js is authored in parallel — import dynamically so the map
  // still builds (legacy box cars) if the module is absent or broken.
  let createVehicleFleet = null;
  try {
    ({ createVehicleFleet } = await import('./vehicles.js'));
  } catch (e) {
    console.warn('[miami] vehicles.js not available — using box-car fallback');
  }
  let fleet = null;        // vehicle fleet handle (disposed with the map)
  let palmsEntry = null;   // entrance-accent palm field
  let shelterX = -13.8;    // bus shelter x (set beside the parked bus)
  const carSpots = [];     // parked-vehicle layout, shared with the streetscape pass
  const glassPanelGeos = [];  // transparent slabs: bus shelter + entrance canopies
  const stripY = (z) =>       // furniture rests on the raised curb strips
    ((z > 35.1 && z < 37.5) || (z > 50.5 && z < 52.9)) ? CITY_Y + 0.13 : CITY_Y;
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
    // day uses the PURE sky (no baked ground content — photographic HDRIs shot
    // at ground level make their foreground trees look giant from the air)
    env.setHDRIBands({ day: 'day_clear', sunset: 'sunset', night: 'night', overcast: 'overcast' });
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
    const geo = track(new THREE.PlaneGeometry(1500, depth, 200, 100));
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, (Z0 + Z1) / 2);
    const pos = geo.attributes.position;
    // City-block tinting. One shared sidewalk texture over 600 m of city reads
    // as an endless white plain from the air; multiplying it per-vertex with a
    // block-scale tint (concrete / asphalt / weathered) breaks it into parcels
    // for zero extra draw calls. Deterministic hash — no rng draws consumed.
    const cCol = new Float32Array(pos.count * 3);
    const hash2 = (a, b) => {
      let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
      h = Math.imul(h ^ (h >>> 15), 0x2545f491);
      return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
    };
    const BLK_X = 62, BLK_Z = 47;
    const parcel = new THREE.Color();
    const PARCELS = [0xf6f2e8, 0xdcd7ca, 0xbcb8ad, 0xa5a29a, 0x8e8c85, 0x97a0a3];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, meshHeight(x, z));
      const bx = Math.floor((x + 750) / BLK_X), bz = Math.floor((z - 27) / BLK_Z);
      const r0 = hash2(bx, bz);
      parcel.setHex(PARCELS[(r0 * PARCELS.length) | 0]);
      // seams between parcels + fine mottling so a single parcel is not flat
      const seam = Math.min(
        Math.abs(((x + 750) % BLK_X) - BLK_X / 2) / (BLK_X / 2),
        Math.abs(((z - 27) % BLK_Z) - BLK_Z / 2) / (BLK_Z / 2)
      );
      const k = 0.94 + 0.06 * seam + (hash2(x * 3 | 0, z * 3 | 0) - 0.5) * 0.05;
      // the promenade band by the road stays clean pale concrete
      const street = z < 58 ? Math.max(0, 1 - Math.abs(z - 44) / 14) : 0;
      parcel.lerp(new THREE.Color(0xffffff), street);
      // far field falls off so the horizon plain does not glare
      const far = 1 - Math.min(0.3, Math.max(0, (z - 210) / 900));
      cCol[i * 3] = parcel.r * k * far;
      cCol[i * 3 + 1] = parcel.g * k * far;
      cCol[i * 3 + 2] = parcel.b * k * far;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cCol, 3));
    geo.computeVertexNormals();
    setAoUVs(geo);
    let mat;
    if (sidewalkSet.map) {
      mat = await assetLib.pbrMaterial('sidewalk', { repeat: [1500 / 2, depth / 2] });
    } else {
      mat = track(new THREE.MeshStandardMaterial({ color: 0x8f8f8c, roughness: 0.95, metalness: 0 }));
    }
    mat.vertexColors = true;
    mat.needsUpdate = true;
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
        clipBias: 0.05,          // stops reflection shimmer right at the waterline
        fog: true,
      });
      water.rotation.x = -Math.PI / 2;
      water.position.set(0, -0.09, -1700);
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
  const woodTex = track(plankTexture(0x9a7247, 11, 512, 512, 18));
  woodTex.repeat.set(78, 1);       // boards run across the walk, ~0.45 m each
  {
    const geo = track(new THREE.BoxGeometry(1240, 0.5, 8));
    const mat = track(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9 }));
    const bw = new THREE.Mesh(geo, mat);
    bw.position.set(0, CITY_Y + 0.05, CITY_Z - 3);
    bw.receiveShadow = true;
    root.add(bw);
  }
  const PIER_X = -150;
  const WHEEL_X = -215, WHEEL_Z = 42, WHEEL_R = 20;   // ferris wheel (built later; used by layout guards)
  {
    const woodTex2 = track(plankTexture(0x8d6a41, 23, 512, 512, 18));
    woodTex2.repeat.set(1, 20);      // boards run across the pier
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
      // the scan albedo is a pale dry grey; multiply it down so the roadway
      // reads as blacktop against the concrete promenade instead of matching it
      mat = await assetLib.pbrMaterial('asphalt', { repeat: [1240 / 3, 12 / 3], color: 0x7c8288 });
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
      let z = rng() < 0.72 ? 26 + rng() * 32 : 6 + rng() * 18;   // road rows + scattered sand
      // never in the road lanes (z 37.5..50.5): snap to the nearest sidewalk row.
      // Deterministic remap — consumes no extra rng draws, so the legacy layout
      // stream (towers, cars, huts) is untouched.
      if (z > 37.5 && z < 50.5) z = z < 44 ? 36.5 : 51.5;
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

    // ---- vehicles: hi-fi fleet from vehicles.js, legacy box cars fallback ----
    // Legacy main-rng draws preserved exactly: per car (1) x jitter, (2) colour.
    // Kind selection is the NEW rng4 stream; taxi/bus colours are deterministic
    // REMAPS of the already-drawn colour value (no extra/fewer main-rng draws).
    const carCols = [0xff5c8a, 0x29d3ff, 0xf5e9d0, 0x9b5de5, 0x43d17a, 0xffffff, 0x22262e];
    const NC = 34;
    const BUS_I = 16;                                   // curb lane, near spawn
    const TAXI_A = 14, TAXI_B = 21;
    for (let i = 0; i < NC; i++) {
      const x = -560 + i * 34 + (rng() - 0.5) * 8;      // legacy draw
      const z = i % 2 ? 39.5 : 48.5;
      let colorHex = carCols[(rng() * carCols.length) | 0];   // legacy draw
      const roll = rng4();
      let kind = roll < 0.42 ? 'sedan' : roll < 0.72 ? 'suv' : roll < 0.88 ? 'pickup' : 'sports';
      if (i === BUS_I) { kind = 'bus'; colorHex = 0xe9eef2; }
      else if (i === TAXI_A || i === TAXI_B) { kind = 'taxi'; colorHex = 0xffc400; }
      carSpots.push({ x, z, rotY: i % 2 ? 0 : Math.PI, kind, colorHex });
      if (i === BUS_I) addCollider(x, CITY_Y, z, 11.4, 3.1, 2.6);   // bus-sized
      else addCollider(x, CITY_Y, z, 4.2, 2.1, 1.9);                // legacy per-car collider
    }
    shelterX = carSpots[BUS_I].x + 2.2;
    if (createVehicleFleet) {
      try {
        const f = await Promise.resolve(createVehicleFleet(NC));
        for (let i = 0; i < NC; i++) {
          const s = carSpots[i];
          f.placeAt(i, s.x, CITY_Y + 0.06, s.z, s.rotY, s.kind, s.colorHex);  // road surface: wheels down
        }
        f.finalize(NC);
        root.add(f.group);
        fleet = f;
      } catch (e) {
        console.warn('[miami] vehicle fleet failed — legacy box cars:', e);
        fleet = null;
      }
    }
    if (!fleet) {
      // legacy box cars (exact old look) driven by the same carSpots
      const carGeo = track(new THREE.BoxGeometry(4.2, 1.1, 1.9));
      carGeo.translate(0, 0.75, 0);
      const cabGeo = track(new THREE.BoxGeometry(2.2, 0.75, 1.7));
      cabGeo.translate(-0.2, 1.65, 0);
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
      const carMat = track(new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.5 }));
      const cabMat = track(new THREE.MeshStandardMaterial({ color: 0x0b1016, roughness: 0.1, metalness: 0.9 }));
      const wheelMat = track(new THREE.MeshStandardMaterial({ color: 0x14171b, roughness: 0.9, metalness: 0.1 }));
      const cars = new THREE.InstancedMesh(carGeo, carMat, NC);
      const cabs = new THREE.InstancedMesh(cabGeo, cabMat, NC);
      const wheels = new THREE.InstancedMesh(wheelGeo, wheelMat, NC);
      const col = new THREE.Color();
      const m4b = new THREE.Matrix4();
      for (let i = 0; i < NC; i++) {
        const s = carSpots[i];
        m4b.makeRotationY(s.rotY);
        m4b.setPosition(s.x, CITY_Y, s.z);
        cars.setMatrixAt(i, m4b);
        cabs.setMatrixAt(i, m4b);
        wheels.setMatrixAt(i, m4b);
        cars.setColorAt(i, col.setHex(s.colorHex));
      }
      cars.castShadow = true;
      root.add(cars); root.add(cabs); root.add(wheels);
    }
  }

  // ---------------- streetscape: curbs, crosswalks, drains, furniture ----------------
  // Road band z 37.5..50.5 stays clear — only flush crosswalks/drains inside it.
  const CROSS_X = [-129, 57];                                 // crosswalks at the two street gaps near spawn
  const GAP_X = [-501, -315, -129, 57, 243, 429];             // all cross-street columns
  const propMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.1 }));
  {
    // (1) raised paver curb strips (0.13 m) along both road edges
    const curbGeos = [
      new THREE.BoxGeometry(1240, 0.13, 2.4).translate(0, CITY_Y + 0.065, 36.3),
      new THREE.BoxGeometry(1240, 0.13, 2.4).translate(0, CITY_Y + 0.065, 51.7),
    ];
    const curbGeo = track(mergeGeometries(curbGeos));
    curbGeos.forEach((g) => g.dispose());
    setAoUVs(curbGeo);
    let curbMat;
    if (sidewalkSet.map) {
      curbMat = await assetLib.pbrMaterial('sidewalk', { repeat: [620, 1.2] });
    } else {
      curbMat = track(new THREE.MeshStandardMaterial({ color: 0x9b9b97, roughness: 0.95 }));
    }
    const curbs = new THREE.Mesh(curbGeo, curbMat);
    curbs.receiveShadow = true;
    root.add(curbs);

    // (2) zebra crosswalks — thin opaque bars flush on the asphalt
    const cwGeo = track(new THREE.BoxGeometry(3.6, 0.022, 0.62));
    const cwMat = track(new THREE.MeshStandardMaterial({ color: 0xe9e9e2, roughness: 0.85 }));
    const cwSpots = [];
    for (const cx of CROSS_X) {
      for (let z = 38.75; z <= 49.35; z += 1.18) cwSpots.push([cx, z]);
    }
    const cw = new THREE.InstancedMesh(cwGeo, cwMat, cwSpots.length);
    const mCw = new THREE.Matrix4();
    for (let i = 0; i < cwSpots.length; i++) {
      mCw.makeTranslation(cwSpots[i][0], CITY_Y + 0.072, cwSpots[i][1]);
      cw.setMatrixAt(i, mCw);
    }
    cw.receiveShadow = true;
    root.add(cw);

    // (3) storm drains along both gutters, ~every 60 m (flush with surface)
    const drGeo = track(new THREE.BoxGeometry(0.85, 0.02, 0.42));
    const drMat = track(new THREE.MeshStandardMaterial({ color: 0x14181c, roughness: 0.9, metalness: 0.25 }));
    const drSpots = [];
    for (let x = -570; x <= 570; x += 60) {
      if (CROSS_X.some((c) => Math.abs(x - c) < 5)) continue;
      drSpots.push([x, 38.08]); drSpots.push([x + 27, 49.92]);
    }
    const drains = new THREE.InstancedMesh(drGeo, drMat, drSpots.length);
    for (let i = 0; i < drSpots.length; i++) {
      mCw.makeTranslation(drSpots[i][0], CITY_Y + 0.071, drSpots[i][1]);
      drains.setMatrixAt(i, mCw);
    }
    root.add(drains);

    // (4) street furniture — every placement baked into ONE merged mesh
    const oneOff = [];
    const stamp = (geo, x, y, z, ry) => {
      const g = geo.clone();
      if (ry) g.rotateY(ry);
      g.translate(x, y, z);
      oneOff.push(g);
    };
    const benchGeo = buildBenchGeo();
    const binGeo = buildBinGeo();
    const hydGeo = buildHydrantGeo();
    const meterGeo = buildMeterGeo();
    const rackGeo = buildBikeRackGeo();
    const blocked = (x) =>
      GAP_X.some((c) => Math.abs(x - c) < 6.5) || Math.abs(x - PIER_X) < 10 ||
      Math.abs(x - WHEEL_X) < 14 || Math.abs(x - shelterX) < 4 || Math.abs(x) > 585;

    // benches (+ bins beside every other one); both sidewalks, facing -z
    let benchColliders = 0;
    let benchIdx = 0;
    for (let x = -575; x <= 575; x += 47) {
      for (const side of [0, 1]) {
        const bx = x + (side ? 21 : 0) + (rng4() - 0.5) * 6;
        if (blocked(bx)) continue;
        const bz = side ? 52.45 : 35.5;
        const by = stripY(bz);
        stamp(benchGeo, bx, by, bz, (rng4() - 0.5) * 0.08);
        if (benchIdx % 2 === 0) stamp(binGeo, bx + 2.5, stripY(bz), bz + (side ? 0.1 : -0.1), rng4() * Math.PI);
        if (benchColliders < 6 && Math.abs(bx) < 70) {
          addCollider(bx, by, bz, 1.9, 1.15, 0.75);
          benchColliders++;
        }
        benchIdx++;
      }
    }
    // hydrants — city side, near the curb face
    for (let x = -530; x <= 570; x += 88) {
      const hx = x + (rng4() - 0.5) * 10;
      if (blocked(hx)) continue;
      stamp(hydGeo, hx, stripY(51.15), 51.15, rng4() * Math.PI);
    }
    // parking meters — one behind each curb-lane car
    for (const s of carSpots) {
      if (s.z < 44 || s.kind === 'bus') continue;                 // curb lane only
      const mx = s.x + 2.1;
      if (blocked(mx)) continue;
      stamp(meterGeo, mx, stripY(51.35), 51.35, (rng4() - 0.5) * 0.2);
    }
    // bike racks — flanking the two crosswalks + by the bus stop
    for (const cx of CROSS_X) {
      for (const s of [-1, 1]) stamp(rackGeo, cx + s * 9, stripY(52.3), 52.3, 0);
    }
    stamp(rackGeo, shelterX + 5.2, stripY(52.3), 52.3, 0);

    // (5) bus stop shelter beside the parked bus (one-off; collider)
    {
      const sz = 53.55, wood = 0xa5714a, dark = 0x2b3138;
      for (const [px, pz] of [[-2.05, -0.62], [2.05, -0.62], [-2.05, 0.66], [2.05, 0.66]]) {
        oneOff.push(cBox(0.09, 2.52, 0.09, dark, shelterX + px, CITY_Y + 1.26, sz + pz));
      }
      oneOff.push(cBox(4.6, 0.09, 1.72, dark, shelterX, CITY_Y + 2.56, sz));
      oneOff.push(cBox(3.6, 0.06, 0.45, wood, shelterX, CITY_Y + 0.62, sz + 0.32));
      for (const s of [-1.5, 1.5]) oneOff.push(cBox(0.07, 0.6, 0.4, dark, shelterX + s, CITY_Y + 0.3, sz + 0.32));
      oneOff.push(cBox(4.4, 0.1, 0.06, dark, shelterX, CITY_Y + 2.0, sz + 0.72));
      oneOff.push(cBox(4.4, 0.1, 0.06, dark, shelterX, CITY_Y + 0.12, sz + 0.72));
      glassPanelGeos.push(new THREE.BoxGeometry(4.45, 0.05, 1.6).translate(shelterX, CITY_Y + 2.63, sz));
      glassPanelGeos.push(new THREE.BoxGeometry(4.35, 1.78, 0.04).translate(shelterX, CITY_Y + 1.06, sz + 0.72));
      addCollider(shelterX, CITY_Y, sz, 4.7, 2.8, 1.9);
    }
    const furnGeo = track(mergeGeometries(oneOff));
    oneOff.forEach((g) => g.dispose());
    [benchGeo, binGeo, hydGeo, meterGeo, rackGeo].forEach((g) => g.dispose());
    const furn = new THREE.Mesh(furnGeo, propMat);
    furn.castShadow = true;
    furn.receiveShadow = true;
    root.add(furn);
  }

  // ---------------- boardwalk edge: dune fence, showers, lamp bollards ----------------
  {
    const edgeGeos = [];
    const postCol = 0xa9977a, railCol = 0xbfae8d;
    const FZ = 22.4;
    const fenceGap = (x) =>
      Math.abs(x) < 7 || Math.abs(x - PIER_X) < 11 ||
      (x > 52 && x < 80) || ((x + 620) % 123) < 5 || Math.abs(x) > 578;
    let prev = null;
    for (let x = -578; x <= 578; x += 2.9) {
      if (fenceGap(x)) { prev = null; continue; }
      const y = groundHeight(x, FZ);
      const pg = new THREE.BoxGeometry(0.09, 1.15, 0.075);
      pg.rotateZ((rng4() - 0.5) * 0.12);
      pg.translate(x, y + 0.52, FZ);
      edgeGeos.push(colorFill(pg, postCol));
      if (prev) {
        for (const ry of [0.88, 0.5]) {
          edgeGeos.push(colorFill(tubeBetween(
            new THREE.Vector3(prev.x, prev.y + ry, FZ),
            new THREE.Vector3(x, y + ry, FZ), 0.03, 5), railCol));
        }
      }
      prev = { x, y };
    }
    // warm lamp bollards on the boardwalk's seaward edge (deck top = CITY_Y+0.3)
    const bolls = [];
    for (let x = -570; x <= 570; x += 31) {
      if (Math.abs(x - PIER_X) < 10 || Math.abs(x) < 4) continue;
      edgeGeos.push(cCyl(0.09, 0.115, 0.8, 8, 0x2c3339, x, CITY_Y + 0.7, 24.3));
      bolls.push(x);
    }
    // beach showers
    for (const sx of [-62, 132]) {
      const gy = groundHeight(sx, 21.4);
      edgeGeos.push(cCyl(0.75, 0.85, 0.09, 12, 0x9aa0a4, sx, gy + 0.045, 21.4));
      edgeGeos.push(cCyl(0.055, 0.07, 2.75, 8, 0x3c444b, sx, gy + 1.38, 21.4));
      edgeGeos.push(cBox(0.62, 0.06, 0.06, 0x3c444b, sx - 0.28, gy + 2.72, 21.4));
      edgeGeos.push(cCyl(0.16, 0.05, 0.1, 8, 0x8f979c, sx - 0.56, gy + 2.62, 21.4));
      edgeGeos.push(cCyl(0.03, 0.03, 0.3, 5, 0xcfd3d6, sx + 0.14, gy + 1.55, 21.4, 0, 0, 1.2));
    }
    const edgeGeo = track(mergeGeometries(edgeGeos));
    edgeGeos.forEach((g) => g.dispose());
    const edgeMesh = new THREE.Mesh(edgeGeo, propMat);
    edgeMesh.receiveShadow = true;
    root.add(edgeMesh);
    const glowGeo = track(new THREE.CylinderGeometry(0.075, 0.075, 0.1, 8));
    const glowMat = track(new THREE.MeshStandardMaterial({ color: 0xfff0d8, emissive: 0xffc37a, emissiveIntensity: 1.9 }));
    const glows = new THREE.InstancedMesh(glowGeo, glowMat, bolls.length);
    const mGl = new THREE.Matrix4();
    for (let i = 0; i < bolls.length; i++) {
      mGl.makeTranslation(bolls[i], CITY_Y + 1.05, 24.3);
      glows.setMatrixAt(i, mGl);
    }
    root.add(glows);
  }

  // ---------------- skyline ----------------
  // winTexA/B consume main-rng draws — always create both to preserve the stream
  // (winTexB is only rendered in the no-facade fallback).
  const winTexA = track(windowTexture(rng, 0.5));
  const winTexB = track(windowTexture(rng, 0.65, 0.4));
  // +2 new tints (white stucco, coral): same single main-rng draw indexes a
  // longer palette — a deterministic REMAP of the drawn value, not a new draw.
  const decoCols = [0xf2b8c6, 0x7fd4c1, 0xf5e9d0, 0xffb385, 0xc3b4e6, 0xf7f4ec, 0xff8a70];

  // Facade physical calibration (verified against the albedo images):
  //   facade_glass = 28 window columns x 18 floor bands per tile
  //     → at 1.5 m windows / 3.2 m floors one tile spans 42 m x 57.6 m.
  //   facade_day   = 15 panels x 10 floors, square tile
  //     → 32 m x 32 m keeps the source aspect exactly (2.13 m panels, 3.2 m floors).
  // Every tower maps facades at these constant physical scales via facadeUV(),
  // with a per-tower random UV offset so neighbours never repeat in sync.
  //   facade_glass_day = 14 columns x 8 floor bands of curtain-wall glazing
  //     → at 1.75 m panes / 3.3 m floors one tile spans 24.5 m x 26.4 m.
  // When the day set is present the towers wear it as their albedo (real glass
  // in daylight) and the night lit-window sheet rides along as the emissive map,
  // re-tiled so its 28x18 grid lands on the same physical pane size.
  const glassDaySet = await assetLib.textureSet('facade_glass_day');
  const hasGlassDay = !!glassDaySet.map;
  const GLASS_TILE_U = hasGlassDay ? 14 * 1.75 : 28 * 1.5;
  const GLASS_TILE_V = hasGlassDay ? 8 * 3.3 : 18 * 3.2;
  const DAY_TILE_U = 27, DAY_TILE_V = 32;   // 1.8 m panels — reads as windows, not glass blocks
  const hasGlassTex = !!glassSet.map || hasGlassDay;
  // materials whose emissive is a night-only effect: { mat, day, night }
  const dayNight = [];
  const regDN = (mat, day, night) => { dayNight.push({ mat, day, night }); mat.emissiveIntensity = day; return mat; };
  let glassMat;
  if (hasGlassDay) {
    let emi = null;
    if (glassSet.emissiveMap) {
      emi = track(glassSet.emissiveMap.clone());
      emi.wrapS = emi.wrapT = THREE.RepeatWrapping;
      emi.repeat.set(0.5, 8 / 18);        // 28x18 lit-window grid → 14x8 panes
      emi.needsUpdate = true;
    }
    glassMat = regDN(track(new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1,                      // rough.jpg governs
      metalness: glassDaySet.metalnessMap ? 1 : 0.45,
      metalnessMap: glassDaySet.metalnessMap || null,
      map: glassDaySet.map,
      normalMap: glassDaySet.normalMap || null,
      roughnessMap: glassDaySet.roughnessMap || null,
      envMapIntensity: 1.25,
      emissive: 0xffe9c4,
      emissiveMap: emi || glassDaySet.map,
      emissiveIntensity: 0,
    })), 0.02, emi ? 1.25 : 0.35);
  } else if (glassSet.map) {
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
    let mv = 0;   // massing variant (glass towers, mid/back rows) — recorded for later passes
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
      // stucco reads by daylight, windows glow after dark
      regDN(mat, facadeDaySet.map ? 0.06 : 0.12, facadeDaySet.map ? 0.42 : 0.75);
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
        const neonMat = regDN(track(new THREE.MeshStandardMaterial({
          color: 0x111111,
          emissive: rng() < 0.5 ? 0x29d3ff : 0xff5c8a,
          emissiveIntensity: 3.2,
        })), 0.9, 3.6);   // neon tubes wash out in full sun, blaze at night
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
      // Massing variants (rng4) kill the single-slab silhouette on ~40% of the
      // mid/back-row glass towers. VISUAL ONLY — the collider AABB below stays
      // the legacy full box, and no main-rng draws are added or removed.
      mv = z > 100 && rng4() < 0.42 ? 1 + ((rng4() * 3) | 0) : 0;
      const boxes = [];
      const addBox = (bw, bh, bd, bx, by, bz, ry = 0) => {
        const g = new THREE.BoxGeometry(bw, bh, bd);
        if (hasGlassTex) {
          facadeUV(g, bw, bh, bd, GLASS_TILE_U, GLASS_TILE_V,
                   offU + boxes.length * 0.37, offV + boxes.length * 0.21);
        } else {
          const uv = g.attributes.uv;
          const su = Math.max(1, bw / 14), sv = Math.max(1, bh / 26);
          for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
        }
        if (ry) g.rotateY(ry);
        g.translate(bx, by, bz);
        boxes.push(g);
      };
      if (mv === 1) {
        // setback tiers (all inside the legacy footprint)
        addBox(w, h * 0.6, d, 0, h * 0.3, 0);
        addBox(w * 0.78, h * 0.26, d * 0.78, 0, h * 0.73, 0);
        addBox(w * 0.55, h * 0.14, d * 0.55, 0, h * 0.93, 0);
      } else if (mv === 2) {
        // L-wing: tall slab + lower wing sharing the same footprint
        addBox(w * 0.58, h, d, -w * 0.21, h / 2, 0);
        addBox(w * 0.42, h * 0.62, d * 0.86, w * 0.29, h * 0.31, -d * 0.07);
      } else if (mv === 3) {
        // chamfered street corners: 45-deg glass fins over the front edges
        addBox(w, h, d, 0, h / 2, 0);
        addBox(1.7, h * 0.995, 1.7, -(w / 2 - 0.55), h * 0.4975, -(d / 2 - 0.55), Math.PI / 4);
        addBox(1.7, h * 0.995, 1.7, (w / 2 - 0.55), h * 0.4975, -(d / 2 - 0.55), Math.PI / 4);
      } else {
        addBox(w, h, d, 0, h / 2, 0);
      }
      let geo;
      if (boxes.length > 1) {
        geo = track(mergeGeometries(boxes));
        boxes.forEach((g) => g.dispose());
      } else {
        geo = track(boxes[0]);
      }
      const mesh = new THREE.Mesh(geo, glassMat);
      mesh.position.set(x, CITY_Y, z);
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
    towerData.push({ x, z, w, h, d, style, mv });
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

  // ---------------- street level: storefronts, canopies, landscaping ----------------
  // The change that kills "box on ground": every front-row tower gets a 4 m
  // storefront band (piers, dark glazing, coloured awnings, recessed entry) or
  // an entrance canopy + steps, plus a planted strip between sidewalk and
  // facades. All randomness on rng4; aggressive merging keeps this at ~10 draws.
  let entranceShrubSpots = [];
  {
    const frontTowers = towerData.filter((t) => t.z < 100);
    const shopOpaque = [];       // vertex-coloured concrete/awnings/doors/steps/planters
    const shopGlassG = [];       // dark reflective glazing
    const shopGlow = [];         // unlit (MeshBasic) shop interiors + sign faces
    const hedgeSpots = [];       // {x, y(center), z, sx, sy, sz, ry}
    const mulchSpots = [];
    const flowerSpots = [];
    const lawnSpots = [];
    const lotSpots = [];
    const palmSpots = [];
    const grateSpots = [];
    const AWNING_COLS = [0xff6f61, 0x2fb5a3, 0xffc35c, 0xf25c8a, 0x3d6fb0, 0xf2eee2];
    const FLOWER_COLS = [0xff5d73, 0xff8fa3, 0xffd166, 0xf8f4ec, 0xff7a52];
    const SIGN_COLS = [0x1f6f8b, 0xb33a3a, 0x2f7d4f, 0x2a3550, 0xb9762a, 0x6d3b6e];
    const INTERIOR_COLS = [0x594330, 0x4c3b36, 0x5c5236, 0x3d474e];
    const signLit = (hex) => new THREE.Color(hex).lerp(new THREE.Color(0xffffff), 0.62).getHex();
    const shopInterior = (r) => INTERIOR_COLS[(r * INTERIOR_COLS.length) | 0];
    // Large sunlit surfaces clip to white under ACES at this exposure, so every
    // masonry tone here sits around 0.2–0.3 sRGB — that lands as light grey
    // concrete in the sun and still has tone left in the shade.
    const CONC = 0x6f6a60, CONC2 = 0x5f5a52, STEP = 0x6a655c, DOORC = 0x151d24, POSTC = 0x3a4148;

    const addBed = (bx, bz) => {
      const by = stripY(bz);
      mulchSpots.push({ x: bx, y: by + 0.11, z: bz, ry: rng4() * Math.PI });
      const n = 14 + ((rng4() * 6) | 0);
      for (let i = 0; i < n; i++) {
        flowerSpots.push({
          x: bx + (rng4() - 0.5) * 1.3,
          y: by + 0.27 + rng4() * 0.1,
          z: bz + (rng4() - 0.5) * 0.9,
          hex: FLOWER_COLS[(rng4() * FLOWER_COLS.length) | 0],
        });
      }
    };
    const addHedge = (hx, hz, sx, sy, szc, base) => {
      hedgeSpots.push({
        x: hx, z: hz, sx, sy, sz: szc, ry: 0,
        y: (base === undefined ? stripY(hz) : base) + 0.4 * sy,
      });
    };

    let planterColliders = 0;
    for (let ti = 0; ti < frontTowers.length; ti++) {
      const t = frontTowers[ti];
      const frontZ = t.z - t.d / 2;
      const isShop = rng4() < 0.62;
      t.hasShop = isShop;
      const awnCol = AWNING_COLS[(rng4() * AWNING_COLS.length) | 0];
      const bandW = Math.min(t.w, 46);

      if (isShop) {
        // ---- 4.2 m storefront band: stone plinth, mullioned glazing, lit
        // interior, painted sign fascia, striped canvas awning with valance ----
        const nBays = Math.max(3, Math.round(bandW / 5.2));
        const bayW = bandW / nBays;
        const entBay = nBays >> 1;
        const signCol = SIGN_COLS[(rng4() * SIGN_COLS.length) | 0];
        const BAND_H = 4.6, GL_BOT = 0.52, GL_TOP = 3.06;
        // cornice + painted sign fascia, both clear of the awnings below
        shopOpaque.push(cBox(bandW + 0.7, 0.3, 0.78, CONC2, t.x, CITY_Y + BAND_H - 0.15, frontZ - 0.16));
        shopOpaque.push(cBox(bandW + 0.2, 0.92, 0.5, signCol, t.x, CITY_Y + BAND_H - 0.76, frontZ - 0.16));
        shopGlow.push(colorFill(new THREE.BoxGeometry(bandW - 1.4, 0.5, 0.06)
          .translate(t.x, CITY_Y + BAND_H - 0.76, frontZ - 0.42), signLit(signCol)));
        // column piers between bays
        for (let b = 0; b <= nBays; b++) {
          shopOpaque.push(cBox(0.46, BAND_H, 0.72, CONC, t.x - bandW / 2 + b * bayW, CITY_Y + BAND_H / 2, frontZ - 0.12));
        }
        for (let b = 0; b < nBays; b++) {
          const bx = t.x - bandW / 2 + (b + 0.5) * bayW;
          const inner = bayW - 0.62;
          if (b === entBay) {
            // recessed entry: dark reveal, twin glass doors, push bars, step
            shopOpaque.push(cBox(inner, 3.35, 0.1, DOORC, bx, CITY_Y + 1.67, frontZ + 0.5));
            shopGlow.push(colorFill(new THREE.BoxGeometry(inner - 0.2, 2.9, 0.05)
              .translate(bx, CITY_Y + 1.62, frontZ + 0.46), 0x2a2118));
            for (const s of [-1, 1]) {
              shopGlassG.push(new THREE.BoxGeometry(1.02, 2.62, 0.09).translate(bx + s * 0.55, CITY_Y + 1.31, frontZ + 0.2));
              shopOpaque.push(cBox(0.07, 2.62, 0.11, 0x8d949a, bx + s * 1.06, CITY_Y + 1.31, frontZ + 0.2));
              shopOpaque.push(cBox(0.05, 0.9, 0.05, 0xc8ced3, bx + s * 0.16, CITY_Y + 1.15, frontZ + 0.14));
            }
            shopOpaque.push(cBox(inner + 0.2, 0.14, 0.06, 0x8d949a, bx, CITY_Y + 2.66, frontZ + 0.2));
            shopOpaque.push(cBox(Math.min(inner + 0.5, 3.6), 0.13, 0.95, STEP, bx, CITY_Y + 0.065, frontZ - 0.45));
          } else {
            // shopfront: dark stone bulkhead, full-height glazing, mullions
            shopOpaque.push(cBox(inner + 0.2, GL_BOT, 0.4, 0x5f6469, bx, CITY_Y + GL_BOT / 2, frontZ - 0.08));
            shopGlassG.push(new THREE.BoxGeometry(inner, GL_TOP - GL_BOT, 0.12)
              .translate(bx, CITY_Y + (GL_TOP + GL_BOT) / 2, frontZ - 0.04));
            // interior: warm dark room with a ceiling light band and a back wall
            shopGlow.push(colorFill(new THREE.BoxGeometry(inner, GL_TOP - GL_BOT - 0.1, 0.05)
              .translate(bx, CITY_Y + (GL_TOP + GL_BOT) / 2, frontZ + 0.42), shopInterior(rng4())));
            shopGlow.push(colorFill(new THREE.BoxGeometry(inner - 0.3, 0.26, 0.04)
              .translate(bx, CITY_Y + GL_TOP - 0.34, frontZ + 0.38), 0xffe7c0));
            for (const mx of [-inner / 6, inner / 6]) {
              shopOpaque.push(cBox(0.075, GL_TOP - GL_BOT, 0.16, 0x8b867c, bx + mx, CITY_Y + (GL_TOP + GL_BOT) / 2, frontZ - 0.06));
            }
            shopOpaque.push(cBox(inner, 0.09, 0.17, 0x8b867c, bx, CITY_Y + GL_TOP - 0.62, frontZ - 0.06));   // transom
          }
          // striped canvas awning with a hanging valance, tucked under the sign
          if ((b + ti) % 3 !== 2) {
            const depth = Math.min(1.75, frontZ - 51.35);   // never over the road band
            if (depth > 0.8) {
              const aw = bayW - 0.55;
              const slope = depth / Math.cos(0.4);
              const stripes = 5;
              const AY = 3.36;
              for (let s2 = 0; s2 < stripes; s2++) {
                const ag = new THREE.BoxGeometry(aw / stripes - 0.015, 0.05, slope);
                ag.rotateX(-0.4);
                ag.translate(bx - aw / 2 + (s2 + 0.5) * (aw / stripes), CITY_Y + AY, frontZ - depth / 2 - 0.16);
                shopOpaque.push(colorFill(ag, s2 % 2 ? awnCol : 0xefe6d2));
              }
              // hanging valance + tie-bars back to the wall
              for (let s2 = 0; s2 < stripes; s2++) {
                shopOpaque.push(cBox(aw / stripes - 0.015, 0.28, 0.045,
                  s2 % 2 ? awnCol : 0xefe6d2,
                  bx - aw / 2 + (s2 + 0.5) * (aw / stripes),
                  CITY_Y + AY - 0.14 - 0.2 * depth, frontZ - depth - 0.16));
              }
              for (const s2 of [-1, 1]) {
                shopOpaque.push(cBox(0.04, 0.04, depth, 0x9aa1a7, bx + s2 * aw / 2, CITY_Y + AY + 0.14 - 0.1 * depth, frontZ - depth / 2 - 0.16));
              }
            }
          }
        }
        // projecting blade signs — the one shop cue that stays readable from
        // every angle (a flat fascia sign is hidden by its own awning from below)
        // reach is clamped so no sign ever crosses into the driving lanes
        const bladeReach = Math.min(1.51, frontZ - 51.2);
        for (let b = 1; bladeReach > 0.9 && b < nBays; b += 2) {
          const bx = t.x - bandW / 2 + b * bayW;
          const bladeCol = SIGN_COLS[(rng4() * SIGN_COLS.length) | 0];
          const by = CITY_Y + 3.95;
          const bz = frontZ - bladeReach + 0.56;
          shopOpaque.push(cBox(0.09, 0.09, bladeReach * 0.9, 0x2f353a, bx, by + 0.42, frontZ - bladeReach * 0.45));
          shopOpaque.push(cBox(0.14, 0.9, 1.12, bladeCol, bx, by, bz));
          for (const s2 of [-1, 1]) {
            shopGlow.push(colorFill(new THREE.BoxGeometry(0.05, 0.6, 0.86)
              .translate(bx + s2 * 0.09, by, bz), signLit(bladeCol)));
          }
        }
        // pavement cafe: two tables with chairs in front of every other shop
        if (ti % 2 === 0 && frontZ > 56) {
          for (const cs of [-1, 1]) {
            const cx = t.x + cs * (bandW * 0.28);
            const cz = frontZ - 2.5;
            shopOpaque.push(cCyl(0.04, 0.05, 0.72, 6, 0x4a5057, cx, CITY_Y + 0.36, cz));
            shopOpaque.push(cCyl(0.42, 0.42, 0.05, 12, 0xb8b3a6, cx, CITY_Y + 0.74, cz));
            shopOpaque.push(cCyl(0.3, 0.34, 0.03, 10, 0x4a5057, cx, CITY_Y + 0.02, cz));
            for (const ch of [-1, 1]) {
              const chx = cx + ch * 0.78, chz = cz + ch * 0.16;
              shopOpaque.push(cBox(0.42, 0.05, 0.42, 0x9d988c, chx, CITY_Y + 0.45, chz));
              shopOpaque.push(cBox(0.42, 0.46, 0.05, 0x9d988c, chx, CITY_Y + 0.68, chz + ch * 0.19));
              for (const lx of [-0.17, 0.17]) for (const lz of [-0.17, 0.17]) {
                shopOpaque.push(cBox(0.035, 0.45, 0.035, 0x5a6067, chx + lx, CITY_Y + 0.225, chz + lz));
              }
            }
          }
        }
      } else {
        // ---- hotel-style entrance canopy, sitting clear above the podium ----
        t.podiumH = 3.3 + rng4() * 1.3;
        const cy0 = CITY_Y + t.podiumH + 0.55;
        // canopy reach clamped so its leading edge stays out of the road band
        const depth = Math.max(0.9, Math.min(3.4, frontZ - 51.6));
        for (const s of [-1, 1]) {
          shopOpaque.push(cCyl(0.09, 0.11, t.podiumH + 0.55, 8, POSTC, t.x + s * 3.1, CITY_Y + (t.podiumH + 0.55) / 2, frontZ - depth + 0.35));
          shopOpaque.push(cCyl(0.2, 0.24, 0.16, 8, 0x8c9298, t.x + s * 3.1, CITY_Y + 0.08, frontZ - depth + 0.35));
        }
        glassPanelGeos.push(new THREE.BoxGeometry(7.4, 0.1, depth + 0.5).translate(t.x, cy0, frontZ - depth / 2 + 0.1));
        shopOpaque.push(cBox(7.6, 0.16, 0.16, POSTC, t.x, cy0 + 0.06, frontZ - depth - 0.13));
        shopOpaque.push(cBox(7.6, 0.14, 0.5, POSTC, t.x, cy0 + 0.05, frontZ - 0.2));
        shopOpaque.push(cBox(4.8, 0.16, 1.3, STEP, t.x, CITY_Y + 0.08, frontZ - 0.9));
        shopOpaque.push(cBox(5.6, 0.08, 0.8, STEP, t.x, CITY_Y + 0.04, frontZ - 1.85));
        // carpet strip under the canopy
        shopOpaque.push(cBox(5.2, 0.03, depth, 0x6d3a33, t.x, CITY_Y + 0.115, frontZ - depth / 2 - 0.3));
      }

      // planters flanking every doorway (colliders for the closest ones)
      for (const s of [-1, 1]) {
        const pxp = t.x + s * 2.75;
        const pzp = frontZ - 0.95;
        const py = stripY(pzp);
        shopOpaque.push(cBox(1.1, 0.62, 1.1, 0x8d877b, pxp, py + 0.31, pzp));
        shopOpaque.push(cBox(1.18, 0.09, 1.18, 0x7b756a, pxp, py + 0.6, pzp));
        addHedge(pxp, pzp, 0.58, 0.75, 0.62, py + 0.5);
        if (planterColliders < 16 && Math.abs(t.x) < 320) {
          addCollider(pxp, py, pzp, 1.2, 1.4, 1.2);
          planterColliders++;
        }
      }
      // flower beds flanking wider entrances
      if (bandW > 18) { addBed(t.x - 4.6, frontZ - 1.0); addBed(t.x + 4.6, frontZ - 1.0); }
      // hedge row along the facade (only where the front sits back from the strip)
      if (frontZ > 54.6) {
        for (let hx = -bandW / 2 + 1.3; hx <= bandW / 2 - 1.3; hx += 2.0) {
          if (Math.abs(hx) < 4.2) continue;   // entrance walkway
          addHedge(t.x + hx, frontZ - 1.35, 0.9 + rng4() * 0.3, 0.8 + rng4() * 0.35, 0.9, CITY_Y);
        }
      }
      // palm + shrub accents at every 3rd entrance
      if (ti % 3 === 0 && frontZ > 56.5) {
        for (const s of [-1, 1]) {
          palmSpots.push({ x: t.x + s * (4.5 + rng4() * 1.5), z: frontZ - 2.7 - rng4(), sc: 0.72 + rng4() * 0.2, ry: rng4() * Math.PI * 2 });
        }
      }
      for (const s of [-1, 1]) {
        const sxp = t.x + s * (bandW / 2 - 0.9);
        const szp = frontZ - 1.15;
        entranceShrubSpots.push({ x: sxp, y: stripY(szp), z: szp, scale: 0.65 + rng4() * 0.4, rotY: rng4() * Math.PI * 2 });
      }
    }

    // ---- planted beds along the promenade edge ----
    // Discrete beds (6–11 m) separated by paved gaps, each with a raised kerb,
    // a mulch bed and a broken hedge row. The old build ran one unbroken hedge
    // the length of the map, which read from the air as a green ribbon.
    {
      let x = -566;
      let bedIdx = 0;
      while (x < 566) {
        const bedLen = 6 + rng4() * 5;
        const gap = 2.6 + rng4() * 3.4;
          const cx = x + bedLen / 2;
        const clear =
          !GAP_X.some((c) => Math.abs(cx - c) < 14 + bedLen / 2) &&
          Math.abs(cx - shelterX) > 5 + bedLen / 2 &&
          Math.abs(cx - WHEEL_X) > 14 &&
          !frontTowers.some((t) => Math.abs(cx - t.x) < t.w / 2 + bedLen / 2 && (t.z - t.d / 2) < 56.6);
        if (clear) {
          const bz = 54.3;
          // kerb ring around the bed
          shopOpaque.push(cBox(bedLen, 0.19, 2.3, 0x89847a, cx, CITY_Y + 0.095, bz));
          mulchSpots.push({ x: cx, y: CITY_Y + 0.14, z: bz, ry: 0, sx: (bedLen - 0.3) / 1.55, sz: 1.85 });
          if (bedIdx % 3 === 1) {
            // flowering bed: dense colour clusters instead of clipped box hedge
            const n = 30 + ((rng4() * 16) | 0);
            for (let i = 0; i < n; i++) {
              flowerSpots.push({
                x: cx + (rng4() - 0.5) * (bedLen - 0.8),
                y: CITY_Y + 0.34 + rng4() * 0.14,
                z: bz + (rng4() - 0.5) * 1.7,
                hex: FLOWER_COLS[(rng4() * FLOWER_COLS.length) | 0],
              });
            }
            for (let hx = -bedLen / 2 + 1; hx <= bedLen / 2 - 1; hx += 2.6) {
              addHedge(cx + hx, bz - 0.72, 0.62 + rng4() * 0.16, 0.5 + rng4() * 0.16, 0.62, CITY_Y + 0.18);
            }
          } else {
            // individual clipped shrubs, never touching — a continuous run of
            // instances reads as one extruded green bar from the air
            for (let hx = -bedLen / 2 + 1.1; hx <= bedLen / 2 - 1.1; hx += 2.45) {
              if (rng4() < 0.1) continue;                        // gaps keep it organic
              const jz = (rng4() - 0.5) * 0.55;
              addHedge(cx + hx + (rng4() - 0.5) * 0.3, bz + jz,
                       0.6 + rng4() * 0.16, 0.66 + rng4() * 0.34, 0.78, CITY_Y + 0.18);
            }
            if (bedIdx % 2 === 0) {
              entranceShrubSpots.push({ x: cx + (rng4() - 0.5) * bedLen * 0.5, y: CITY_Y + 0.19, z: bz + 0.3, scale: 0.55 + rng4() * 0.3, rotY: rng4() * Math.PI * 2 });
            }
          }
          bedIdx++;
        }
        x += bedLen + gap;
      }
    }

    // lawn patches filling the gaps between front towers
    const sorted = frontTowers.slice().sort((a, b) => a.x - b.x);
    for (let i = 0; i + 1 < sorted.length; i++) {
      const L = sorted[i], R = sorted[i + 1];
      const e0 = L.x + L.w / 2, e1 = R.x - R.w / 2;
      if (e1 - e0 < 12) continue;
      if (GAP_X.some((c) => c > e0 - 4 && c < e1 + 4)) continue;
      const cx = (e0 + e1) / 2;
      const sx = Math.min(2.2, (e1 - e0 - 4) / 9);
      lawnSpots.push({ x: cx, z: 60.5 + (rng4() - 0.5) * 2, sx, sz: 1.5 + rng4() * 0.5 });
      // hedge edging + palms turn the bare patch into a pocket park
      for (let hx = -sx * 4.2; hx <= sx * 4.2; hx += 2.2) {
        addHedge(cx + hx, 56.4 + (rng4() - 0.5) * 0.4, 0.8, 0.7 + rng4() * 0.25, 0.8, CITY_Y);
      }
      palmSpots.push({ x: cx + (rng4() - 0.5) * sx * 5, z: 61 + (rng4() - 0.5) * 3, sc: 0.8 + rng4() * 0.25, ry: rng4() * Math.PI * 2 });
      entranceShrubSpots.push({ x: cx + (rng4() - 0.5) * 5, y: CITY_Y, z: 58.5 + (rng4() - 0.5) * 3, scale: 0.9 + rng4() * 0.6, rotY: rng4() * Math.PI * 2 });
    }

    // ---- stone podium at the foot of every tower without a shopfront ----
    // A curtain wall running straight into the pavement is the single loudest
    // "box dropped on a plane" tell; a proud base band with a plinth, a capping
    // reveal and lobby glazing fixes it for one merged draw call. The overhang
    // stays under half a metre so the legacy tower collider still fits.
    for (const t of towerData) {
      if (t.hasShop || t.z > 250 || t.style === 'cyl') continue;
      const PH = t.podiumH || (3.2 + rng4() * 1.6);  // podium height
      const pr = 0.28 + rng4() * 0.16;               // how far it stands proud
      const pw = t.w + pr * 2, pd = t.d + pr * 2;
      const stone = rng4() < 0.5 ? 0x6b6459 : 0x5c6165;
      const stone2 = new THREE.Color(stone).offsetHSL(0, 0, 0.05).getHex();
      shopOpaque.push(cBox(pw, PH - 0.34, pd, stone, t.x, CITY_Y + (PH - 0.34) / 2, t.z));
      shopOpaque.push(cBox(pw + 0.22, 0.3, pd + 0.22, 0x3f4448, t.x, CITY_Y + 0.15, t.z));       // plinth
      shopOpaque.push(cBox(pw + 0.3, 0.34, pd + 0.3, 0x7d776c, t.x, CITY_Y + PH - 0.17, t.z));   // cap
      // clad the base in pilaster strips so it is not one flat slab of stone
      for (let px = -pw / 2 + 1.4; px < pw / 2 - 0.6; px += 4.4) {
        shopOpaque.push(cBox(0.55, PH - 0.62, 0.16, stone2, t.x + px, CITY_Y + (PH - 0.62) / 2, t.z - pd / 2 - 0.07));
      }
      shopOpaque.push(cBox(pw + 0.06, 0.12, pd + 0.06, 0x4a4f52, t.x, CITY_Y + PH * 0.52, t.z)); // shadow reveal
      // lobby glazing + revolving-door bay on the street face
      const fz = t.z - pd / 2;
      const lw = Math.min(t.w * 0.62, 15);
      shopGlassG.push(new THREE.BoxGeometry(lw, PH - 1.35, 0.2).translate(t.x, CITY_Y + (PH - 1.35) / 2 + 0.5, fz - 0.02));
      shopGlow.push(colorFill(new THREE.BoxGeometry(lw - 0.4, PH - 1.6, 0.05)
        .translate(t.x, CITY_Y + (PH - 1.35) / 2 + 0.5, fz + 0.4), 0x4a4438));
      for (let mx = -lw / 2 + 1.6; mx < lw / 2 - 0.5; mx += 1.9) {
        shopOpaque.push(cBox(0.11, PH - 1.35, 0.26, 0x767b80, t.x + mx, CITY_Y + (PH - 1.35) / 2 + 0.5, fz - 0.06));
      }
      shopOpaque.push(cBox(lw + 0.6, 0.32, 0.4, 0x7d776c, t.x, CITY_Y + PH - 0.9, fz - 0.12));
      // entrance apron: darker paving band + two steps
      shopOpaque.push(cBox(lw + 5, 0.05, 3.4, 0x5b5850, t.x, CITY_Y + 0.025, fz - 1.85));
      shopOpaque.push(cBox(lw + 1.4, 0.13, 0.9, 0x6d685f, t.x, CITY_Y + 0.065, fz - 0.55));
    }

    // ---- city blocks behind the front row ----
    // Cross streets, parking lots, lawns and block palms. Without these the
    // plateau behind Ocean Drive renders as one unbroken paved plain.
    const blockPalmSpots = [];
    const occupied = (x, z, rx, rz) => towerData.some((t) =>
      Math.abs(x - t.x) < t.w / 2 + rx && Math.abs(z - t.z) < t.d / 2 + rz);
    const XS_HALF = 6.5;                       // cross-street half width
    const XS_Z0 = 52.9, XS_Z1 = 268;
    for (const cx of GAP_X) {
      // sidewalk kerbs down both sides of the cross street
      for (const s of [-1, 1]) {
        shopOpaque.push(cBox(0.5, 0.15, XS_Z1 - XS_Z0, 0x8f8a80,
          cx + s * (XS_HALF + 0.25), CITY_Y + 0.075, (XS_Z0 + XS_Z1) / 2));
      }
      // block palms + planting down the cross street
      for (let z = XS_Z0 + 12; z < XS_Z1 - 10; z += 21) {
        for (const s of [-1, 1]) {
          const px = cx + s * (XS_HALF + 2.4);
          if (occupied(px, z, 2, 2)) continue;
          blockPalmSpots.push({ x: px, z: z + (rng4() - 0.5) * 3, sc: 0.75 + rng4() * 0.3, ry: rng4() * Math.PI * 2 });
          grateSpots.push({ x: px, z: z + 0, y: CITY_Y + 0.012 });
        }
      }
    }
    // parking lots + pocket parks in the voids between tower rows
    const parcelTaken = [];
    const freeParcel = (x, z, r) => !parcelTaken.some((p) =>
      Math.abs(x - p.x) < r + p.r && Math.abs(z - p.z) < 24);
    for (let bx = -536; bx <= 536; bx += 37) {
      for (const bz of [92, 104, 153, 219, 249]) {
        const z = bz + (rng4() - 0.5) * 7;
        const x = bx + (rng4() - 0.5) * 6;
        if (GAP_X.some((c) => Math.abs(x - c) < XS_HALF + 18)) continue;
        if (occupied(x, z, 18, 13)) continue;
        const roll = rng4();
        if (roll < 0.44) {
          if (!freeParcel(x, z, 17)) continue;
          parcelTaken.push({ x, z, r: 17 });
          lotSpots.push({ x, z, ry: 0 });
          // kerb + hedge screen along the street edge of the lot
          shopOpaque.push(cBox(30.6, 0.16, 0.5, 0x8a857b, x, CITY_Y + 0.08, z - 9.3));
          for (let hx = -13; hx <= 13; hx += 2.9) {
            addHedge(x + hx, z - 10.3, 0.78, 0.62 + rng4() * 0.2, 0.8, CITY_Y);
          }
        } else if (roll < 0.8) {
          if (!freeParcel(x, z, 15)) continue;
          parcelTaken.push({ x, z, r: 15 });
          const sx = 2.2 + rng4() * 0.9, sz = 2.0 + rng4() * 0.8;
          lawnSpots.push({ x, z, sx, sz, y: CITY_Y + 0.02, ry: 0 });
          // hedge border on all four sides turns the green rectangle into a park
          const hw = 4.5 * sx, hd = 2.75 * sz;
          for (let hx = -hw; hx <= hw; hx += 2.6) {
            addHedge(x + hx, z - hd - 0.5, 0.8, 0.62 + rng4() * 0.22, 0.8, CITY_Y);
            addHedge(x + hx, z + hd + 0.5, 0.8, 0.62 + rng4() * 0.22, 0.8, CITY_Y);
          }
          for (let hz = -hd; hz <= hd; hz += 2.6) {
            addHedge(x - hw - 0.5, z + hz, 0.8, 0.62 + rng4() * 0.22, 0.8, CITY_Y);
            addHedge(x + hw + 0.5, z + hz, 0.8, 0.62 + rng4() * 0.22, 0.8, CITY_Y);
          }
          for (let k = 0; k < 3; k++) {
            blockPalmSpots.push({
              x: x + (rng4() - 0.5) * hw * 1.6, z: z + (rng4() - 0.5) * hd * 1.6,
              sc: 0.85 + rng4() * 0.35, ry: rng4() * Math.PI * 2,
            });
          }
          addBed(x + (rng4() - 0.5) * hw, z + (rng4() - 0.5) * hd);
        } else {
          blockPalmSpots.push({ x, z, sc: 0.8 + rng4() * 0.3, ry: rng4() * Math.PI * 2 });
        }
      }
    }
    // mid-block infill: small pocket parks in the tight gaps between towers,
    // where a full 30 m parcel will not fit. Without these the band directly
    // behind the front row stays an empty paved shelf.
    for (let ix = -556; ix <= 556; ix += 23) {
      for (const iz of [70, 88, 112, 140, 168, 200]) {
        const x = ix + (rng4() - 0.5) * 6;
        const z = iz + (rng4() - 0.5) * 7;
        if (GAP_X.some((c) => Math.abs(x - c) < XS_HALF + 7)) continue;
        if (occupied(x, z, 8.5, 6.5)) continue;
        if (!freeParcel(x, z, 9)) continue;
        parcelTaken.push({ x, z, r: 9 });
        const roll = rng4();
        if (roll < 0.55) {
          lawnSpots.push({ x, z, sx: 0.85 + rng4() * 0.35, sz: 0.85 + rng4() * 0.3, y: CITY_Y + 0.02 });
          for (let hx = -3.6; hx <= 3.6; hx += 2.4) {
            addHedge(x + hx, z - 2.9, 0.7, 0.6 + rng4() * 0.2, 0.75, CITY_Y);
            addHedge(x + hx, z + 2.9, 0.7, 0.6 + rng4() * 0.2, 0.75, CITY_Y);
          }
          blockPalmSpots.push({ x: x + (rng4() - 0.5) * 5, z: z + (rng4() - 0.5) * 4, sc: 0.75 + rng4() * 0.3, ry: rng4() * Math.PI * 2 });
        } else if (roll < 0.78) {
          addBed(x, z);
          blockPalmSpots.push({ x, z: z + 2.5, sc: 0.8 + rng4() * 0.25, ry: rng4() * Math.PI * 2 });
          grateSpots.push({ x, z: z + 2.5, y: CITY_Y + 0.012 });
        } else {
          blockPalmSpots.push({ x, z, sc: 0.8 + rng4() * 0.3, ry: rng4() * Math.PI * 2 });
          grateSpots.push({ x, z, y: CITY_Y + 0.012 });
        }
      }
    }

    // tree grates for the palms standing on the paved promenade
    for (const pp of palmPlacements) {
      if (grateSpots.length >= 260) break;
      if (pp.z < 33 || pp.z > 58 || Math.abs(pp.x) > 600) continue;
      grateSpots.push({ x: pp.x, z: pp.z, y: stripY(pp.z) + 0.012 });
    }

    // balconies on 2 street-visible faces of ~1/3 of the mid/back towers
    const balGeo = track(buildBalconyGeo());
    const balSpots = [];
    for (const t of towerData) {
      if (t.z < 100 || t.style !== 'glass' || (t.mv !== 0 && t.mv !== 3)) continue;
      if (rng4() > 0.34 || t.w < 24) continue;
      const maxY = CITY_Y + Math.min(t.h - 6, 112);
      const colsF = Math.max(1, Math.min(3, Math.floor((t.w - 9) / 8)));
      const colsS = Math.max(1, Math.min(2, Math.floor((t.d - 9) / 8)));
      for (let fy = CITY_Y + 7.5; fy < maxY && balSpots.length < 880; fy += 6.4) {
        for (let c = 0; c < colsF; c++) {
          balSpots.push({ x: t.x + (c - (colsF - 1) / 2) * 7.2, y: fy, z: t.z - t.d / 2, ry: Math.PI });
        }
        for (let c = 0; c < colsS; c++) {
          const off = (c - (colsS - 1) / 2) * 7.2;
          if (t.x < 0) balSpots.push({ x: t.x + t.w / 2, y: fy, z: t.z + off, ry: Math.PI / 2 });
          else balSpots.push({ x: t.x - t.w / 2, y: fy, z: t.z + off, ry: -Math.PI / 2 });
        }
      }
    }

    // rooftop clutter kits + parapet hedges
    const roofKitGeo = track(buildRooftopKitGeo());
    const roofSpots = [];
    for (const t of towerData) {
      if (t.style !== 'glass' || t.mv === 1) continue;
      if (rng4() > 0.55 || Math.min(t.w, t.d) < 21) continue;
      roofSpots.push({
        x: t.x + (rng4() - 0.5) * (t.w - 15),
        y: CITY_Y + t.h + 0.02,
        z: t.z + (rng4() - 0.5) * (t.d - 15),
        ry: ((rng4() * 4) | 0) * (Math.PI / 2),
      });
      if (rng4() < 0.38) {
        const n = Math.floor((t.w - 6) / 2.1);
        for (let k = 0; k < n; k++) {
          addHedge(t.x - (t.w - 6) / 2 + k * 2.1, t.z - t.d / 2 + 1.2, 0.95, 0.8, 0.85, CITY_Y + t.h);
        }
      }
    }

    // ---- materialize (merged one-offs + instanced sets) ----
    const q4 = new THREE.Quaternion();
    const e4 = new THREE.Euler();
    const v4 = new THREE.Vector3();
    const s4 = new THREE.Vector3();
    const m4c = new THREE.Matrix4();
    const c4 = new THREE.Color();
    const placeAll = (im, spots, fill) => {
      for (let i = 0; i < spots.length; i++) {
        const s = spots[i];
        e4.set(0, s.ry || 0, 0);
        q4.setFromEuler(e4);
        v4.set(s.x, s.y !== undefined ? s.y : CITY_Y, s.z);
        s4.set(s.sx || 1, s.sy || 1, s.sz || 1);
        m4c.compose(v4, q4, s4);
        im.setMatrixAt(i, m4c);
        if (fill) fill(im, i, s);
      }
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
      root.add(im);
    };

    if (shopOpaque.length) {
      const g = track(mergeGeometries(shopOpaque));
      shopOpaque.forEach((x) => x.dispose());
      const shopMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }));
      const mesh = new THREE.Mesh(g, shopMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      root.add(mesh);
    }
    if (shopGlassG.length) {
      const g = track(mergeGeometries(shopGlassG));
      shopGlassG.forEach((x) => x.dispose());
      const mat = track(new THREE.MeshStandardMaterial({
        color: 0x0e1a20, metalness: 0.5, roughness: 0.07,
        transparent: true, opacity: 0.55,
        envMapIntensity: 1.15, depthWrite: false,
      }));
      root.add(new THREE.Mesh(g, mat));
    }
    if (shopGlow.length) {
      // unlit interiors + sign faces — the depth behind the glass that makes a
      // storefront read as a shop rather than a black rectangle
      const g = track(mergeGeometries(shopGlow));
      shopGlow.forEach((x) => x.dispose());
      const mat = track(new THREE.MeshBasicMaterial({ vertexColors: true }));
      root.add(new THREE.Mesh(g, mat));
    }
    // cross streets: asphalt running inland at every street gap
    {
      const xsGeos = [];
      for (const cx of GAP_X) {
        const g = new THREE.PlaneGeometry(XS_HALF * 2, XS_Z1 - XS_Z0);
        g.rotateX(-Math.PI / 2);
        g.translate(cx, CITY_Y + 0.055, (XS_Z0 + XS_Z1) / 2);
        xsGeos.push(g);
      }
      const xsGeo = track(mergeGeometries(xsGeos));
      xsGeos.forEach((g) => g.dispose());
      setAoUVs(xsGeo);
      let xsMat;
      if (asphaltSet.map) {
        xsMat = await assetLib.pbrMaterial('asphalt', { repeat: [(XS_HALF * 2) / 3, (XS_Z1 - XS_Z0) / 3], color: 0x7c8288 });
      } else {
        xsMat = track(new THREE.MeshStandardMaterial({ color: 0x33363a, roughness: 0.96 }));
      }
      const xs = new THREE.Mesh(xsGeo, xsMat);
      xs.receiveShadow = true;
      root.add(xs);
    }
    if (glassPanelGeos.length) {
      const g = track(mergeGeometries(glassPanelGeos));
      glassPanelGeos.forEach((x) => x.dispose());
      glassPanelGeos.length = 0;
      const mat = track(new THREE.MeshStandardMaterial({
        color: 0xcfe4ec, metalness: 0.1, roughness: 0.1,
        transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false,
      }));
      root.add(new THREE.Mesh(g, mat));
    }
    if (hedgeSpots.length) {
      // rounded box + mottled foliage sheet + deep, desaturated greens: clipped
      // hedge instead of the bright plastic loaf the flat-colour version gave
      const hedgeGeo = track(new RoundedBoxGeometry(1.8, 0.8, 0.75, 3, 0.26));
      const folTex = track(foliageTexture());
      folTex.repeat.set(2.5, 1.6);
      const hedgeMat = track(new THREE.MeshStandardMaterial({
        map: folTex, color: 0xffffff, roughness: 1, metalness: 0,
      }));
      const hedges = new THREE.InstancedMesh(hedgeGeo, hedgeMat, hedgeSpots.length);
      const HEDGE_COLS = [0x5f7a4a, 0x6a8450, 0x546e42, 0x718a55, 0x4d6b3f];
      placeAll(hedges, hedgeSpots, (im, i) => {
        im.setColorAt(i, c4.setHex(HEDGE_COLS[(rng4() * HEDGE_COLS.length) | 0]).offsetHSL((rng4() - 0.5) * 0.03, 0, (rng4() - 0.5) * 0.07));
      });
      hedges.castShadow = true;
      hedges.receiveShadow = true;
    }
    if (lotSpots.length) {
      // surface parking: real city fabric between the tower rows
      const lotGeo = track(new THREE.PlaneGeometry(30, 18));
      lotGeo.rotateX(-Math.PI / 2);
      const lotTex = track(parkingTexture());
      lotTex.repeat.set(30 / 22, 18 / 17);
      const lotMat = track(new THREE.MeshStandardMaterial({
        map: lotTex, roughness: 0.95, metalness: 0,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      }));
      for (const s of lotSpots) s.y = CITY_Y + 0.015;
      const lots = new THREE.InstancedMesh(lotGeo, lotMat, lotSpots.length);
      placeAll(lots, lotSpots);
      lots.receiveShadow = true;
    }
    if (grateSpots.length) {
      const grateGeo = track(new THREE.RingGeometry(0.62, 1.15, 10, 1));
      grateGeo.rotateX(-Math.PI / 2);
      const grateMat = track(new THREE.MeshStandardMaterial({
        color: 0x3a3d40, roughness: 0.65, metalness: 0.45, side: THREE.DoubleSide,
        polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
      }));
      placeAll(new THREE.InstancedMesh(grateGeo, grateMat, grateSpots.length), grateSpots);
    }
    if (mulchSpots.length) {
      const mulchGeo = track(new RoundedBoxGeometry(1.55, 0.26, 1.1, 2, 0.09));
      const mulchMat = track(new THREE.MeshStandardMaterial({ color: 0x38302a, roughness: 1 }));
      placeAll(new THREE.InstancedMesh(mulchGeo, mulchMat, mulchSpots.length), mulchSpots);
    }
    if (flowerSpots.length) {
      const flowGeo = track(new THREE.SphereGeometry(0.17, 6, 4));
      flowGeo.scale(1, 0.68, 1);
      const flowMat = track(new THREE.MeshStandardMaterial({ roughness: 0.75 }));
      const flowers = new THREE.InstancedMesh(flowGeo, flowMat, flowerSpots.length);
      placeAll(flowers, flowerSpots, (im, i, s) => im.setColorAt(i, c4.setHex(s.hex)));
    }
    if (lawnSpots.length) {
      const lawnGeo = track(new THREE.PlaneGeometry(9, 5.5));
      lawnGeo.rotateX(-Math.PI / 2);
      setAoUVs(lawnGeo);
      let lawnMat;
      const lawnSet = await assetLib.textureSet('grass_lawn');
      if (lawnSet.map) {
        lawnMat = await assetLib.pbrMaterial('grass_lawn', { repeat: [7, 4.5] });
      } else {
        lawnMat = track(new THREE.MeshStandardMaterial({ color: 0x4c7a3d, roughness: 1 }));
      }
      lawnMat.polygonOffset = true;
      lawnMat.polygonOffsetFactor = -2;
      lawnMat.polygonOffsetUnits = -2;
      // NOTE: no material.vertexColors here — the plane carries no colour
      // attribute, and USE_COLOR without one resolves to black. InstancedMesh
      // per-instance colour (setColorAt) works on its own.
      const lawns = new THREE.InstancedMesh(lawnGeo, lawnMat, lawnSpots.length);
      for (const s of lawnSpots) s.y = CITY_Y + 0.025;
      placeAll(lawns, lawnSpots, (im, i) => {
        im.setColorAt(i, c4.setHSL(0.26 + (rng4() - 0.5) * 0.05, 0.1 + rng4() * 0.14, 0.74 + rng4() * 0.14));
      });
      lawns.receiveShadow = true;
    }
    if (balSpots.length) {
      const balMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.15 }));
      placeAll(new THREE.InstancedMesh(balGeo, balMat, balSpots.length), balSpots);
    }
    if (roofSpots.length) {
      const roofMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }));
      placeAll(new THREE.InstancedMesh(roofKitGeo, roofMat, roofSpots.length), roofSpots);
    }
    // entrance + block palms (two small instanced fields; sway like the rest)
    const allEntryPalms = palmSpots.concat(blockPalmSpots);
    if (allEntryPalms.length) {
      try {
        palmsEntry = await createPalms(allEntryPalms.length);
        for (let i = 0; i < allEntryPalms.length; i++) {
          const p = allEntryPalms[i];
          palmsEntry.placeAt(i, p.x, CITY_Y, p.z, p.sc, p.ry);
        }
        palmsEntry.finalize(allEntryPalms.length);
        root.add(palmsEntry.group);
      } catch (e) {
        console.warn('[miami] entrance palms skipped:', e);
        palmsEntry = null;
      }
    }
  }

  // ---------------- ferris wheel ----------------
  const wheel = new THREE.Group();
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
    const dockTex = track(plankTexture(0x9c7750, 41, 512, 512, 18));
    dockTex.repeat.set(1, 11);
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
    // storefront/lawn accents collected by the street-level pass (rng4)
    await scatterSafe('shrub_03', entranceShrubSpots, null, 0);

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
  let lastNightF = -1;
  const applyDayNight = () => {
    const tod = settings.environment.timeOfDay;
    const dayF = Math.sin(Math.PI * clamp((tod - 6.2) / 13.2, 0, 1));
    const nightF = clamp(1 - dayF * 2.1, 0, 1);
    if (Math.abs(nightF - lastNightF) < 0.006) return;
    lastNightF = nightF;
    for (const d of dayNight) d.mat.emissiveIntensity = d.day + (d.night - d.day) * nightF;
  };
  applyDayNight();
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
      applyDayNight();
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
      if (palmsEntry) palmsEntry.update(dt);
    },
    dispose(sceneRef) {
      sceneRef.remove(root);
      try { palms?.dispose?.(); } catch (e) { /* noop */ }
      try { palmsEntry?.dispose?.(); } catch (e) { /* noop */ }
      try { fleet?.dispose?.(); } catch (e) { /* noop */ }
      for (const h of scatterHandles) { try { h.dispose?.(); } catch (e) { /* noop */ } }
      for (const d of disposables) { try { d.dispose?.(); } catch (e) { /* noop */ } }
    },
  };
}
