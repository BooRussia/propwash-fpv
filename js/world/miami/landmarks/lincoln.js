import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CITY_Y, LINCOLN_Z, LINCOLN_HALF, LINCOLN_SOFFIT, LINCOLN_H, LINCOLN_PASS_H,
  LINCOLN_PASS_W, LINCOLN_D, LINCOLN_WALK_RUNS,
  lincolnShops, lincolnPergolas, installFlyColliders,
} from '../constants.js';
import { cBox, cCyl } from '../geo.js';
import { stuccoTexture } from '../textures.js';

// ============================================================
// Lincoln Road analogue — E–W pedestrian mall at z=120.
// Fly-under pergolas (fly +X) plus flanking storefronts (arcade ±X,
// mid-block pass ±Z). Jambs + soffit + posts only. hash01 never
// drawn. New RESERVED west of x=240. West of leftoverLot A.
// Not a travel-lane solid. leftoverLot A–H unmoved.
// ============================================================

const PALETTE = [
  { body: 0xf4b8c5, trim: 0xf6f2e9, neon: 0xff4fa3 },
  { body: 0xd8ece8, trim: 0x1d6f7a, neon: 0x2fe0ff },
  { body: 0xf7dcb4, trim: 0x7fd4c1, neon: 0xffb01f },
  { body: 0xe8d5b7, trim: 0xf6f2e9, neon: 0xff4fa3 },
  { body: 0xd4e8f4, trim: 0x2f6f86, neon: 0x2fe0ff },
  { body: 0xf3d56a, trim: 0x1d6f7a, neon: 0xffc43a },
  { body: 0xe89aab, trim: 0xf6f2e9, neon: 0xff4fa3 },
  { body: 0xf6f2e9, trim: 0x7fd4c1, neon: 0x2fe0ff },
];

const TIMBER = 0x6e5340, TIMBER2 = 0x7a5c45, SOFFIT = 0xc4b79a, PAVER = 0xd8c9ab;

/**
 * Build the signed Lincoln mall: pavers, pergolas, flanking shops.
 * @returns {{ group: THREE.Group }}
 */
export function buildLincoln(ctx) {
  const { root, track, addCollider, addCyl, setTag, regDN } = ctx;
  setTag('lincoln');

  const stucco = [];
  const dark = [];
  const glass = [];
  const timber = [];
  const paving = [];
  const neonByColor = new Map();
  const pushNeon = (hex, geo) => {
    let arr = neonByColor.get(hex);
    if (!arr) { arr = []; neonByColor.set(hex, arr); }
    arr.push(geo);
  };

  for (let i = 0; i < LINCOLN_WALK_RUNS.length; i++) {
    const [x0, x1] = LINCOLN_WALK_RUNS[i];
    const len = x1 - x0;
    const cx = (x0 + x1) / 2;
    paving.push(cBox(len, 0.10, LINCOLN_HALF * 2, PAVER, cx, CITY_Y + 0.05, LINCOLN_Z));
    addCollider(cx, CITY_Y, LINCOLN_Z, len, 0.12, LINCOLN_HALF * 2);
  }

  const shops = lincolnShops();
  for (let i = 0; i < shops.length; i++) {
    buildLincolnShop(stucco, dark, glass, pushNeon, addCollider, shops[i], PALETTE[i % PALETTE.length]);
  }

  const pergolas = lincolnPergolas();
  for (let i = 0; i < pergolas.length; i++) {
    buildLincolnPergola(timber, pergolas[i]);
  }
  installFlyColliders(addCyl, addCollider, 'lincoln');

  const group = new THREE.Group();
  group.name = 'lincoln-walk';

  if (paving.length) {
    const paveGeo = track(mergeGeometries(paving));
    paving.forEach((g) => g.dispose());
    const paveMat = track(new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.92, metalness: 0,
    }));
    const paveMesh = new THREE.Mesh(paveGeo, paveMat);
    paveMesh.receiveShadow = true;
    group.add(paveMesh);
  }

  const stTex = track(stuccoTexture());
  stTex.repeat.set(0.28, 0.28);
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

  if (timber.length) {
    const tGeo = track(mergeGeometries(timber));
    timber.forEach((g) => g.dispose());
    const tMat = track(new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.88,
    }));
    const tMesh = new THREE.Mesh(tGeo, tMat);
    tMesh.castShadow = true;
    group.add(tMesh);
  }

  root.add(group);
  setTag('world');
  return { group };
}

function buildLincolnShop(stucco, dark, glass, pushNeon, addCollider, g, pal) {
  const { body, trim, neon } = pal;
  const cx = g.x;
  const cz = g.z;
  const len = g.len;
  const D = LINCOLN_D;
  const bodyH = LINCOLN_H;
  const soffit = LINCOLN_SOFFIT;
  const face = g.frontZ;
  const arcadeZ = g.arcadeZ;
  const massZ0 = Math.min(g.zBack, g.zArcadeInner);
  const massZ1 = Math.max(g.zBack, g.zArcadeInner);
  const massZ = (massZ0 + massZ1) / 2;
  const massSz = massZ1 - massZ0;

  stucco.push(cBox(len, bodyH - soffit, D, body,
    cx, CITY_Y + soffit + (bodyH - soffit) / 2, cz));

  for (const side of [-1, 1]) {
    const xEdge = side < 0 ? (g.x0 + g.passX0) / 2 : (g.passX1 + g.x1) / 2;
    const sx = side < 0 ? (g.passX0 - g.x0) : (g.x1 - g.passX1);
    if (sx < 0.4) continue;
    stucco.push(cBox(sx - 0.04, soffit, massSz, body,
      xEdge, CITY_Y + soffit / 2, massZ));
  }

  for (const dx of [g.x0 + 0.7, g.x1 - 0.7]) {
    stucco.push(cCyl(0.20, 0.22, soffit, 10, trim,
      dx, CITY_Y + soffit / 2, arcadeZ));
  }
  const zLo = Math.min(g.frontZ, g.zArcadeInner);
  const zHi = Math.max(g.frontZ, g.zArcadeInner);
  stucco.push(cBox(len - 0.4, 0.24, zHi - zLo + 0.2, trim,
    cx, CITY_Y + soffit + 0.12, arcadeZ));
  stucco.push(cBox(LINCOLN_PASS_W + 0.55, 0.22, massSz, trim,
    cx, CITY_Y + LINCOLN_PASS_H + 0.11, massZ));
  pushNeon(neon, cBox(len - 1.2, 0.08, 0.08, neon,
    cx, CITY_Y + soffit - 0.08, face + g.inward * 0.15));

  dark.push(cBox(len - 0.8, 0.05, zHi - zLo, 0x8e887c,
    cx, CITY_Y + 0.025, arcadeZ));

  const winFace = g.zArcadeInner;
  const nWin = Math.max(1, Math.round((len - 3.2) / 3.4));
  for (let i = 0; i < nWin; i++) {
    const wx = g.x0 + 1.6 + (i + 0.5) * ((len - 3.2) / nWin);
    if (wx > g.passX0 - 0.6 && wx < g.passX1 + 0.6) continue;
    glass.push(new THREE.BoxGeometry(1.8, 2.2, 0.10)
      .translate(wx, CITY_Y + 1.5, winFace));
    dark.push(cBox(2.0, 2.4, 0.08, 0x1a2026, wx, CITY_Y + 1.5, winFace - g.inward * 0.08));
  }

  const floors = 2;
  for (let f = 0; f < floors; f++) {
    const fy = CITY_Y + soffit + 1.5 + f * 2.6;
    stucco.push(cBox(len + 0.2, 0.14, 0.55, trim, cx, fy + 1.05, face + g.inward * 0.2));
    const n = Math.max(2, Math.round(len / 3.6));
    for (let i = 0; i < n; i++) {
      const wx = g.x0 + 1.1 + (i + 0.5) * ((len - 2.2) / n);
      glass.push(new THREE.BoxGeometry(1.6, 1.55, 0.10)
        .translate(wx, fy, face));
      dark.push(cBox(1.8, 1.75, 0.08, 0x1a2026, wx, fy, face - g.inward * 0.06));
    }
    pushNeon(neon, cBox(len - 1.0, 0.07, 0.07, neon,
      cx, fy + 1.12, face + g.inward * 0.35));
  }

  stucco.push(cBox(len + 0.35, 0.7, D + 0.35, pal.body, cx, CITY_Y + bodyH + 0.35, cz));
  pushNeon(neon, cBox(Math.min(len * 0.55, 8), 0.55, 0.12, neon,
    cx, CITY_Y + bodyH + 0.9, face + g.inward * 0.2));

  addCollider(cx, CITY_Y + soffit, cz, len + 0.4, bodyH - soffit + 0.9, D + 0.4);
}

function buildLincolnPergola(timber, g) {
  const y0 = g.y0;
  for (const dx of [-g.halfX, g.halfX]) {
    for (const dz of [-g.halfZ, g.halfZ]) {
      timber.push(cCyl(
        g.postR, g.postR + 0.02, g.postH, 10, TIMBER,
        g.x + dx, y0 + g.postH / 2, g.z + dz,
      ));
      timber.push(cBox(0.36, 0.08, 0.36, TIMBER2, g.x + dx, y0 + 0.04, g.z + dz));
    }
  }
  const beamY = y0 + g.postH + g.beamH / 2;
  for (const dz of [-g.halfZ, g.halfZ]) {
    timber.push(cBox(g.spanX + g.beamW, g.beamH, g.beamW, TIMBER2,
      g.x, beamY, g.z + dz));
  }
  for (const dx of [-g.halfX, g.halfX]) {
    timber.push(cBox(g.beamW, g.beamH, g.spanZ + g.beamW, TIMBER2,
      g.x + dx, beamY, g.z));
  }
  timber.push(cBox(g.spanX + 1.1, 0.12, g.spanZ + 1.0, SOFFIT,
    g.x, y0 + g.postH + g.beamH + 0.06, g.z));
  for (let x = g.x - g.halfX + 0.4; x <= g.x + g.halfX - 0.4; x += 0.62) {
    timber.push(cBox(0.09, 0.10, g.spanZ - 0.2, TIMBER2,
      x, y0 + g.postH + g.beamH + 0.28, g.z));
  }
}
