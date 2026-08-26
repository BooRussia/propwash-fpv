import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CITY_Y, GAP315_SOFFIT, GAP315_H, GAP315_PASS_H, GAP315_PASS_W, GAP315_D,
  gap315Shops, installFlyColliders,
} from '../constants.js';
import { cBox, cCyl } from '../geo.js';
import { stuccoTexture } from '../textures.js';

// ============================================================
// GAP_X=-315 inland storefronts with arcade fly-unders (±Z) and a
// mid-block passage (±X). Colliders are jambs + soffit + passage
// walls; never a box in a bay. hash01 never drawn. West of leftoverLot
// A. Not a travel-lane solid. New RESERVED west of x=240.
// ============================================================

const PALETTE = [
  { body: 0xf4d6c0, trim: 0x1d6f7a, neon: 0xffc43a },
  { body: 0xe9f0e6, trim: 0xe89aab, neon: 0xff4fa3 },
  { body: 0xd4e8f4, trim: 0x2f6f86, neon: 0x2fe0ff },
  { body: 0xf6e2b3, trim: 0x7fd4c1, neon: 0xffb01f },
  { body: 0xf6f2e9, trim: 0x2f6f86, neon: 0x2fe0ff },
  { body: 0xe89aab, trim: 0xf6f2e9, neon: 0xff4fa3 },
  { body: 0xc5e4d8, trim: 0xf3d56a, neon: 0x2fe0ff },
  { body: 0xf3d56a, trim: 0x1d6f7a, neon: 0xffc43a },
  { body: 0xe8c4a8, trim: 0x7fd4c1, neon: 0xffb01f },
];

/**
 * Build signed GAP_X=-315 storefronts inland of Ocean Drive.
 * @returns {{ group: THREE.Group }}
 */
export function buildGap315(ctx) {
  const { root, track, addCollider, addCyl, setTag, regDN } = ctx;
  setTag('gap315');

  const stucco = [];
  const dark = [];
  const glass = [];
  const neonByColor = new Map();
  const pushNeon = (hex, geo) => {
    let arr = neonByColor.get(hex);
    if (!arr) { arr = []; neonByColor.set(hex, arr); }
    arr.push(geo);
  };

  const shops = gap315Shops();
  for (let i = 0; i < shops.length; i++) {
    buildGap315Shop(stucco, dark, glass, pushNeon, addCollider, shops[i], PALETTE[i % PALETTE.length]);
  }
  installFlyColliders(addCyl, addCollider, 'gap315');

  const group = new THREE.Group();
  group.name = 'gap-315';

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

  root.add(group);
  setTag('world');
  return { group };
}

function buildGap315Shop(stucco, dark, glass, pushNeon, addCollider, g, pal) {
  const { body, trim, neon } = pal;
  const cx = g.x;
  const cz = g.z;
  const len = g.len;
  const D = GAP315_D;
  const bodyH = GAP315_H;
  const soffit = GAP315_SOFFIT;
  const face = g.frontX;
  const arcadeX = g.arcadeX;
  const massX0 = Math.min(g.xBack, g.xArcadeInner);
  const massX1 = Math.max(g.xBack, g.xArcadeInner);
  const massX = (massX0 + massX1) / 2;
  const massSx = massX1 - massX0;

  stucco.push(cBox(D, bodyH - soffit, len, body,
    cx, CITY_Y + soffit + (bodyH - soffit) / 2, cz));

  for (const side of [-1, 1]) {
    const zEdge = side < 0 ? (g.z0 + g.passZ0) / 2 : (g.passZ1 + g.z1) / 2;
    const sz = side < 0 ? (g.passZ0 - g.z0) : (g.z1 - g.passZ1);
    if (sz < 0.4) continue;
    stucco.push(cBox(massSx, soffit, sz - 0.04, body,
      massX, CITY_Y + soffit / 2, zEdge));
  }

  for (const dz of [g.z0 + 0.7, g.z1 - 0.7]) {
    stucco.push(cCyl(0.20, 0.22, soffit, 10, trim,
      arcadeX, CITY_Y + soffit / 2, dz));
  }
  const ax0 = Math.min(g.frontX, g.xArcadeInner);
  const ax1 = Math.max(g.frontX, g.xArcadeInner);
  stucco.push(cBox(ax1 - ax0 + 0.2, 0.24, len - 0.4, trim,
    arcadeX, CITY_Y + soffit + 0.12, cz));
  stucco.push(cBox(massSx, 0.22, GAP315_PASS_W + 0.55, trim,
    massX, CITY_Y + GAP315_PASS_H + 0.11, cz));
  pushNeon(neon, cBox(0.08, 0.08, len - 1.2, neon,
    face + g.inward * 0.15, CITY_Y + soffit - 0.08, cz));

  dark.push(cBox(ax1 - ax0, 0.05, len - 0.8, 0x8e887c,
    arcadeX, CITY_Y + 0.025, cz));

  const winFace = g.xArcadeInner;
  const nWin = Math.max(1, Math.round((len - 3.2) / 3.4));
  for (let i = 0; i < nWin; i++) {
    const wz = g.z0 + 1.6 + (i + 0.5) * ((len - 3.2) / nWin);
    if (wz > g.passZ0 - 0.6 && wz < g.passZ1 + 0.6) continue;
    glass.push(new THREE.BoxGeometry(0.10, 2.2, 1.8)
      .translate(winFace, CITY_Y + 1.5, wz));
    dark.push(cBox(0.08, 2.4, 2.0, 0x1a2026, winFace - g.inward * 0.08, CITY_Y + 1.5, wz));
  }

  const floors = 2;
  for (let f = 0; f < floors; f++) {
    const fy = CITY_Y + soffit + 1.5 + f * 2.6;
    stucco.push(cBox(0.55, 0.14, len + 0.2, trim, face + g.inward * 0.2, fy + 1.05, cz));
    const n = Math.max(2, Math.round(len / 3.6));
    for (let i = 0; i < n; i++) {
      const wz = g.z0 + 1.1 + (i + 0.5) * ((len - 2.2) / n);
      glass.push(new THREE.BoxGeometry(0.10, 1.55, 1.6)
        .translate(face, fy, wz));
      dark.push(cBox(0.08, 1.75, 1.8, 0x1a2026, face - g.inward * 0.06, fy, wz));
    }
    pushNeon(neon, cBox(0.07, 0.07, len - 1.0, neon,
      face + g.inward * 0.35, fy + 1.12, cz));
  }

  stucco.push(cBox(D + 0.35, 0.7, len + 0.35, pal.body, cx, CITY_Y + bodyH + 0.35, cz));
  pushNeon(neon, cBox(0.12, 0.55, Math.min(len * 0.55, 8), neon,
    face + g.inward * 0.2, CITY_Y + bodyH + 0.9, cz));

  addCollider(cx, CITY_Y + soffit, cz, D + 0.4, bodyH - soffit + 0.9, len + 0.4);
}
