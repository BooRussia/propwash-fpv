import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CITY_Y,
  COLONY_X, COLONY_FRONT_Z, COLONY_W, COLONY_D, COLONY_SOFFIT,
  BREAKWATER_X, BREAKWATER_FRONT_Z, BREAKWATER_W, BREAKWATER_D,
  CAVALIER_X, CAVALIER_FRONT_Z, CAVALIER_W, CAVALIER_D,
  WINTERHAVEN_X, WINTERHAVEN_FRONT_Z, WINTERHAVEN_W, WINTERHAVEN_D,
  installFlyColliders,
} from '../constants.js';
import { cBox, cCyl, colorFill } from '../geo.js';
import { stuccoTexture } from '../textures.js';

// ============================================================
// Named deco hotels filling leftover Ocean Drive facade gaps.
//
// Colony (x=-108): yellow porch arcade you can fly under
//   (soffit COLONY_SOFFIT). Colliders are jambs + lid (tag 'colony').
// Breakwater (x=42): white mass + red neon pylon in the deco/Clevelander gap.
// Cavalier (x=134): peach streamline in the Cardozo/cinema gap.
// Winterhaven (x=222): teal-trim plate east of the garage, reserved z1=76
//   so it cannot kiss abando or leftoverLot A–H.
//
// All sit on FRONT_Z=57.6. No leftoverLot. No layout rng.
// ============================================================

const GH = 4.0;
const FH = 3.2;
const REVEAL = 0x1a2026;
const METAL = 0x9aa3aa;
const TERRAZZO = 0x8e887c;

/**
 * Build Colony / Breakwater / Cavalier / Winterhaven on the facade plane.
 * @returns {{ group: THREE.Group }}
 */
export function buildDecoHotels(ctx) {
  const { root, track, addCollider, addCyl, setTag, regDN } = ctx;

  const stucco = [];
  const dark = [];
  const glass = [];
  const neonByColor = new Map();
  const pushNeon = (hex, geo) => {
    let arr = neonByColor.get(hex);
    if (!arr) { arr = []; neonByColor.set(hex, arr); }
    arr.push(geo);
  };

  setTag('colony');
  buildColony(stucco, dark, glass, pushNeon, addCollider);
  installFlyColliders(addCyl, addCollider, 'colony');

  setTag('breakwater');
  buildBreakwater(stucco, dark, glass, pushNeon, addCollider);

  setTag('cavalier');
  buildCavalier(stucco, dark, glass, pushNeon, addCollider);

  setTag('winterhaven');
  buildWinterhaven(stucco, dark, glass, pushNeon, addCollider);

  const group = new THREE.Group();
  group.name = 'ocean-drive-named-deco';

  const stTex = track(stuccoTexture());
  stTex.repeat.set(0.32, 0.32);
  const stuccoMat = track(new THREE.MeshStandardMaterial({
    map: stTex, vertexColors: true, roughness: 0.93, metalness: 0,
  }));
  const stuccoGeo = track(mergeGeometries(stucco));
  stucco.forEach((g) => g.dispose());
  const stuccoMesh = new THREE.Mesh(stuccoGeo, stuccoMat);
  stuccoMesh.castShadow = true;
  stuccoMesh.receiveShadow = true;
  group.add(stuccoMesh);

  const darkMat = track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.5, metalness: 0.32,
  }));
  const darkGeo = track(mergeGeometries(dark));
  dark.forEach((g) => g.dispose());
  group.add(new THREE.Mesh(darkGeo, darkMat));

  const glassMat = regDN(track(new THREE.MeshStandardMaterial({
    color: 0x16232b, metalness: 0.45, roughness: 0.07,
    envMapIntensity: 1.15, emissive: 0xffcf92, emissiveIntensity: 0,
  })), 0, 0.5);
  const glassGeo = track(mergeGeometries(glass));
  glass.forEach((g) => g.dispose());
  group.add(new THREE.Mesh(glassGeo, glassMat));

  for (const [hex, geos] of neonByColor) {
    const g = track(mergeGeometries(geos));
    geos.forEach((x) => x.dispose());
    const mat = regDN(track(new THREE.MeshStandardMaterial({
      color: 0x14161a, emissive: hex, emissiveIntensity: 0.9, roughness: 0.4,
    })), 0.85, 3.6);
    group.add(new THREE.Mesh(g, mat));
  }

  root.add(group);
  setTag('world');
  return { group };
}

function buildColony(stucco, dark, glass, pushNeon, addCollider) {
  const cx = COLONY_X;
  const FZ = COLONY_FRONT_Z;
  const W = COLONY_W;
  const D = COLONY_D;
  const BODY = 0xf3d56a, BODY2 = 0xe4c45a, TRIM = 0x2f6f86, NEON = 0xffc43a, NAME = 0x1d4d6a;
  const floors = 3;
  const bodyH = COLONY_SOFFIT + floors * FH;
  const zMass = FZ + D / 2;
  const arcadeZ = FZ - 1.7;

  stucco.push(cBox(W, bodyH - COLONY_SOFFIT, D, BODY,
    cx, CITY_Y + COLONY_SOFFIT + (bodyH - COLONY_SOFFIT) / 2, zMass));
  stucco.push(cBox(W, COLONY_SOFFIT, D - 4.2, BODY2,
    cx, CITY_Y + COLONY_SOFFIT / 2, FZ + 2.1 + (D - 4.2) / 2));

  for (const s of [-1, 1]) {
    stucco.push(cCyl(0.2, 0.22, COLONY_SOFFIT, 10, TRIM,
      cx + s * (W / 2 - 0.7), CITY_Y + COLONY_SOFFIT / 2, arcadeZ));
  }
  stucco.push(cBox(W - 0.4, 0.24, 3.4, TRIM,
    cx, CITY_Y + COLONY_SOFFIT + 0.12, arcadeZ));
  pushNeon(NEON, cBox(W - 0.8, 0.08, 0.08, NEON,
    cx, CITY_Y + COLONY_SOFFIT - 0.06, arcadeZ - 1.55));
  // extra neon outline — Colony corner tubes. Visual only.
  for (const s of [-1, 1]) {
    pushNeon(NEON, cBox(0.08, bodyH - 0.6, 0.08, NEON,
      cx + s * (W / 2 - 0.08), CITY_Y + bodyH / 2, FZ - 0.22));
  }

  for (let f = 0; f < floors; f++) {
    const fy = CITY_Y + COLONY_SOFFIT + 1.55 + f * FH;
    stucco.push(cBox(W + 0.28, 0.16, 0.68, TRIM, cx, fy + 1.05, FZ - 0.3));
    for (const s of [-1, 0, 1]) {
      glass.push(new THREE.BoxGeometry(2.2, 1.65, 0.1)
        .translate(cx + s * 5.2, fy, FZ - 0.04));
      dark.push(cBox(2.4, 1.85, 0.08, REVEAL, cx + s * 5.2, fy, FZ + 0.04));
    }
    pushNeon(NEON, cBox(W - 0.8, 0.07, 0.07, NEON, cx, fy + 1.12, FZ - 0.62));
  }

  const roofY = CITY_Y + bodyH;
  stucco.push(cBox(W + 0.4, 0.8, D + 0.4, BODY2, cx, roofY + 0.4, zMass));
  dark.push(cBox(W * 0.55, 1.15, 0.16, NAME, cx, roofY + 1.15, FZ - 0.18));
  pushNeon(NEON, cBox(W * 0.48, 0.5, 0.1, NEON, cx, roofY + 1.15, FZ - 0.28));

  dark.push(cBox(W * 0.7, 0.05, 2.8, TERRAZZO, cx, CITY_Y + 0.025, arcadeZ));

  addCollider(cx, CITY_Y + COLONY_SOFFIT, zMass,
    W + 0.5, bodyH - COLONY_SOFFIT + 1.2, D + 0.5);
  addCollider(cx, CITY_Y, FZ + 2.1 + (D - 4.2) / 2,
    W + 0.4, COLONY_SOFFIT, D - 4.0);
  addCollider(cx, CITY_Y + COLONY_SOFFIT, arcadeZ,
    W - 0.4, 0.3, 3.4);
}

function buildBreakwater(stucco, dark, glass, pushNeon, addCollider) {
  const cx = BREAKWATER_X;
  const FZ = BREAKWATER_FRONT_Z;
  const W = BREAKWATER_W;
  const D = BREAKWATER_D;
  const BODY = 0xf6f2e9, TRIM = 0xc42a3a, NEON = 0xff3d4a, NAME = 0x7a1820;
  const floors = 4;
  const bodyH = GH + (floors - 1) * FH;
  const zMass = FZ + D / 2;

  stucco.push(cBox(W, bodyH, D, BODY, cx, CITY_Y + bodyH / 2, zMass));
  stucco.push(cBox(W * 0.42, bodyH, 0.5, BODY, cx, CITY_Y + bodyH / 2, FZ - 0.2));

  for (let f = 0; f < floors; f++) {
    const fy = CITY_Y + (f === 0 ? 0 : GH + (f - 1) * FH);
    const fh = f === 0 ? GH : FH;
    const winY = fy + fh * 0.56;
    const winH = f === 0 ? 2.3 : 1.55;
    stucco.push(cBox(W + 0.18, 0.15, 0.6, TRIM, cx, winY + winH / 2 + 0.28, FZ - 0.28));
    for (const s of [-1, 1]) {
      glass.push(new THREE.BoxGeometry(1.55, winH, 0.1)
        .translate(cx + s * 2.9, winY, FZ - 0.05));
      dark.push(cBox(1.7, winH + 0.18, 0.08, REVEAL, cx + s * 2.9, winY, FZ + 0.04));
    }
    if (f > 0) {
      glass.push(new THREE.BoxGeometry(W * 0.22, winH + 0.3, 0.1)
        .translate(cx, winY, FZ - 0.48));
    }
  }

  const roofY = CITY_Y + bodyH;
  stucco.push(cBox(W + 0.28, 0.75, D + 0.28, BODY, cx, roofY + 0.38, zMass));
  dark.push(cBox(W * 0.72, 1.05, 0.14, NAME, cx, roofY + 1.05, FZ - 0.16));
  pushNeon(NEON, cBox(W * 0.62, 0.48, 0.09, NEON, cx, roofY + 1.05, FZ - 0.26));
  // extra neon outline — Breakwater corner tubes. Visual only.
  for (const s of [-1, 1]) {
    pushNeon(NEON, cBox(0.08, bodyH - 0.5, 0.08, NEON,
      cx + s * (W / 2 - 0.08), CITY_Y + bodyH / 2, FZ - 0.22));
  }

  // Red neon pylon — the Breakwater signature. Proud of the west corner,
  // inland of the city walk (z 52.05–53.85).
  const px = cx - W / 2 - 0.35;
  const pz = FZ + 0.55;
  const pylonH = bodyH + 6.4;
  stucco.push(cBox(0.55, pylonH, 0.7, TRIM, px, CITY_Y + pylonH / 2, pz));
  pushNeon(NEON, cBox(0.12, pylonH - 0.8, 0.12, NEON, px, CITY_Y + pylonH / 2, pz - 0.42));
  dark.push(cBox(0.7, 1.4, 0.16, NAME, px, CITY_Y + bodyH + 2.2, pz - 0.4));

  stucco.push(cBox(W * 0.6, 0.18, 1.6, BODY, cx, CITY_Y + 3.15, FZ - 0.9));
  for (const s of [-1, 1]) {
    dark.push(cCyl(0.08, 0.09, 3.0, 8, METAL,
      cx + s * 3.2, CITY_Y + 1.5, FZ - 1.45));
  }

  addCollider(cx, CITY_Y, zMass, W + 0.5, bodyH + 2.0, D + 0.5);
  addCollider(px, CITY_Y, pz, 0.7, pylonH, 0.85);
  addCollider(cx, CITY_Y + 3.05, FZ - 0.9, W * 0.6, 0.28, 1.7);
}

function buildCavalier(stucco, dark, glass, pushNeon, addCollider) {
  const cx = CAVALIER_X;
  const FZ = CAVALIER_FRONT_Z;
  const W = CAVALIER_W;
  const D = CAVALIER_D;
  const BODY = 0xf4c4a8, BODY2 = 0xe8b090, TRIM = 0xf6f2e9, NEON = 0xff8a5b, NAME = 0x8c3a28;
  const floors = 4;
  const bodyH = GH + (floors - 1) * FH;
  const zMass = FZ + D / 2;
  const CW = W * 0.36;

  stucco.push(cBox(W, bodyH, D, BODY, cx, CITY_Y + bodyH / 2, zMass));
  stucco.push(cBox(CW, bodyH, 0.55, BODY2, cx, CITY_Y + bodyH / 2, FZ - 0.22));
  for (const s of [-1, 1]) {
    stucco.push(cBox(1.2, bodyH, 1.2, BODY,
      cx + s * (W / 2 - 0.45), CITY_Y + bodyH / 2, FZ + 0.45, 0, Math.PI / 4, 0));
  }

  for (let f = 0; f < floors; f++) {
    const fy = CITY_Y + (f === 0 ? 0 : GH + (f - 1) * FH);
    const fh = f === 0 ? GH : FH;
    const winY = fy + fh * 0.56;
    const winH = f === 0 ? 2.25 : 1.55;
    if (f > 0) {
      stucco.push(cBox(W + 0.16, 0.14, D + 0.16, TRIM, cx, fy, zMass));
    }
    stucco.push(cBox(W + 0.2, 0.16, 0.62, TRIM, cx, winY + winH / 2 + 0.3, FZ - 0.28));
    for (const s of [-1, 1]) {
      glass.push(new THREE.BoxGeometry(1.9, winH, 0.1)
        .translate(cx + s * 4.15, winY, FZ - 0.05));
      dark.push(cBox(2.1, winH + 0.2, 0.08, REVEAL, cx + s * 4.15, winY, FZ + 0.04));
    }
    if (f > 0) {
      glass.push(new THREE.BoxGeometry(CW * 0.55, winH + 0.35, 0.1)
        .translate(cx, winY, FZ - 0.52));
    }
    pushNeon(NEON, cBox(W - 0.6, 0.07, 0.07, NEON, cx, winY + winH / 2 + 0.38, FZ - 0.58));
  }
  // extra neon outline — Cavalier corner tubes. Visual only.
  for (const s of [-1, 1]) {
    pushNeon(NEON, cBox(0.08, bodyH - 0.5, 0.08, NEON,
      cx + s * (W / 2 - 0.08), CITY_Y + bodyH / 2, FZ - 0.22));
  }

  const roofY = CITY_Y + bodyH;
  stucco.push(cBox(W + 0.3, 0.8, D + 0.3, BODY2, cx, roofY + 0.4, zMass));
  stucco.push(cBox(CW + 1.6, 1.5, 3.2, BODY, cx, roofY + 1.45, FZ + 1.5));
  dark.push(cBox(CW + 1.0, 1.1, 0.14, NAME, cx, roofY + 1.7, FZ - 0.2));
  pushNeon(NEON, cBox(CW + 0.5, 0.5, 0.09, NEON, cx, roofY + 1.7, FZ - 0.3));

  stucco.push(cBox(CW + 2.2, 0.2, 1.8, TRIM, cx, CITY_Y + 3.2, FZ - 1.0));
  for (const s of [-1, 1]) {
    dark.push(cCyl(0.09, 0.1, 3.1, 8, METAL,
      cx + s * 3.4, CITY_Y + 1.55, FZ - 1.55));
  }
  dark.push(cBox(CW + 3.0, 0.05, 2.4, TERRAZZO, cx, CITY_Y + 0.025, FZ - 1.2));

  addCollider(cx, CITY_Y, zMass, W + 0.5, bodyH + 2.2, D + 0.5);
  addCollider(cx, CITY_Y + 3.1, FZ - 1.0, CW + 2.2, 0.3, 1.9);
}

function buildWinterhaven(stucco, dark, glass, pushNeon, addCollider) {
  const cx = WINTERHAVEN_X;
  const FZ = WINTERHAVEN_FRONT_Z;
  const W = WINTERHAVEN_W;
  const D = WINTERHAVEN_D;
  const BODY = 0xeef4f2, BODY2 = 0xdce8e4, TRIM = 0x2a8f7a, NEON = 0x3dffc2, NAME = 0x145a4c;
  const floors = 3;
  const bodyH = GH + (floors - 1) * FH;
  const zMass = FZ + D / 2;

  stucco.push(cBox(W, bodyH, D, BODY, cx, CITY_Y + bodyH / 2, zMass));
  stucco.push(cBox(W * 0.4, bodyH, 0.48, BODY2, cx, CITY_Y + bodyH / 2, FZ - 0.18));

  for (let f = 0; f < floors; f++) {
    const fy = CITY_Y + (f === 0 ? 0 : GH + (f - 1) * FH);
    const fh = f === 0 ? GH : FH;
    const winY = fy + fh * 0.56;
    const winH = f === 0 ? 2.2 : 1.5;
    stucco.push(cBox(W + 0.2, 0.15, 0.58, TRIM, cx, winY + winH / 2 + 0.28, FZ - 0.26));
    for (const s of [-1, 0, 1]) {
      glass.push(new THREE.BoxGeometry(1.7, winH, 0.1)
        .translate(cx + s * 3.6, winY, FZ - 0.05));
      dark.push(cBox(1.88, winH + 0.18, 0.08, REVEAL, cx + s * 3.6, winY, FZ + 0.04));
    }
    pushNeon(NEON, cBox(W - 0.5, 0.07, 0.07, NEON, cx, winY + winH / 2 + 0.36, FZ - 0.54));
  }
  // extra neon outline — Winterhaven corner tubes. Visual only.
  for (const s of [-1, 1]) {
    pushNeon(NEON, cBox(0.08, bodyH - 0.5, 0.08, NEON,
      cx + s * (W / 2 - 0.08), CITY_Y + bodyH / 2, FZ - 0.22));
  }

  const roofY = CITY_Y + bodyH;
  stucco.push(cBox(W + 0.28, 0.7, D + 0.28, BODY2, cx, roofY + 0.35, zMass));
  dark.push(cBox(W * 0.7, 1.0, 0.14, NAME, cx, roofY + 0.95, FZ - 0.16));
  pushNeon(NEON, cBox(W * 0.58, 0.45, 0.09, NEON, cx, roofY + 0.95, FZ - 0.26));
  pushNeon(NEON, colorFill(new THREE.BoxGeometry(W + 0.08, 0.08, 0.08)
    .translate(cx, roofY + 0.78, FZ - 0.18), NEON));

  stucco.push(cBox(W * 0.58, 0.18, 1.5, TRIM, cx, CITY_Y + 3.1, FZ - 0.85));
  for (const s of [-1, 1]) {
    dark.push(cCyl(0.08, 0.09, 2.95, 8, METAL,
      cx + s * 3.5, CITY_Y + 1.48, FZ - 1.35));
  }

  addCollider(cx, CITY_Y, zMass, W + 0.5, bodyH + 1.8, D + 0.5);
  addCollider(cx, CITY_Y + 3.0, FZ - 0.85, W * 0.58, 0.28, 1.6);
}
