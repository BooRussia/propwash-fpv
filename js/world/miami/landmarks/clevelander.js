import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CITY_Y,
  CLEVELANDER_X, CLEVELANDER_FRONT_Z, CLEVELANDER_W, CLEVELANDER_D, CLEVELANDER_SOFFIT,
  CARDOZO_X, CARDOZO_FRONT_Z, CARDOZO_W, CARDOZO_D,
  installFlyColliders,
} from '../constants.js';
import { cBox, cCyl, colorFill } from '../geo.js';
import { stuccoTexture } from '../textures.js';

// ============================================================
// Clevelander-style open-air hotel bar + Cardozo-style deco fill.
//
// Clevelander (x=60): pastel body, ground-floor arcade you can fly
// under (soffit CLEVELANDER_SOFFIT). Colliders are jambs + lid
// (flyColliderShapes tag 'clevelander'), never a box in the bay.
//
// Cardozo (x=115): streamline moderne filler between Casa and the
// Tropicaire cinema. Solid mass, eyebrow shades, neon crown.
// Neither building is leftoverLot. No layout rng.
// ============================================================

/**
 * Build the Clevelander analogue and the Cardozo-style neighbour.
 * @returns {{ group: THREE.Group }}
 */
export function buildClevelander(ctx) {
  const { root, track, addCollider, addCyl, setTag, regDN } = ctx;
  setTag('clevelander');

  const stucco = [];
  const dark = [];
  const glass = [];
  const neon = [];

  buildClevelanderMass(stucco, dark, glass, neon, addCollider);
  installFlyColliders(addCyl, addCollider, 'clevelander');

  setTag('cardozo');
  buildCardozoMass(stucco, dark, glass, neon, addCollider);

  const group = new THREE.Group();
  group.name = 'ocean-drive-mid';

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

  const neonMat = regDN(track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.22, metalness: 0.1,
    emissive: 0xff4fa3, emissiveIntensity: 0,
  })), 0, 0.85);
  const neonGeo = track(mergeGeometries(neon));
  neon.forEach((g) => g.dispose());
  group.add(new THREE.Mesh(neonGeo, neonMat));

  root.add(group);
  setTag('world');
  return { group };
}

function buildClevelanderMass(stucco, dark, glass, neon, addCollider) {
  const cx = CLEVELANDER_X;
  const FZ = CLEVELANDER_FRONT_Z;
  const W = CLEVELANDER_W;
  const D = CLEVELANDER_D;
  const PINK = 0xf4b8c5, PINK2 = 0xe89aab, TRIM = 0xf6f2e9, NEON = 0xff4fa3;
  const bodyH = 11.4;
  const zMass = FZ + D / 2;
  const arcadeZ = FZ - 1.7;

  // upper floors sit on the soffit so the arcade stays empty
  stucco.push(cBox(W, bodyH - CLEVELANDER_SOFFIT, D, PINK,
    cx, CITY_Y + CLEVELANDER_SOFFIT + (bodyH - CLEVELANDER_SOFFIT) / 2, zMass));
  // back-of-house behind the arcade (does not fill the fly bay)
  stucco.push(cBox(W, CLEVELANDER_SOFFIT, D - 4.2, PINK2,
    cx, CITY_Y + CLEVELANDER_SOFFIT / 2, FZ + 2.1 + (D - 4.2) / 2));

  for (const s of [-1, 1]) {
    stucco.push(cCyl(0.2, 0.22, CLEVELANDER_SOFFIT, 10, TRIM,
      cx + s * (W / 2 - 0.7), CITY_Y + CLEVELANDER_SOFFIT / 2, arcadeZ));
  }
  stucco.push(cBox(W - 0.4, 0.24, 3.4, TRIM,
    cx, CITY_Y + CLEVELANDER_SOFFIT + 0.12, arcadeZ));
  neon.push(cBox(W - 0.8, 0.08, 0.08, NEON,
    cx, CITY_Y + CLEVELANDER_SOFFIT - 0.06, arcadeZ - 1.55));

  // eyebrows + windows
  for (let f = 0; f < 2; f++) {
    const fy = CITY_Y + CLEVELANDER_SOFFIT + 1.6 + f * 3.2;
    stucco.push(cBox(W + 0.3, 0.16, 0.7, TRIM, cx, fy + 1.15, FZ - 0.32));
    for (const s of [-1, 0, 1]) {
      glass.push(new THREE.BoxGeometry(2.4, 1.7, 0.1)
        .translate(cx + s * 5.4, fy, FZ - 0.04));
      dark.push(cBox(2.6, 1.9, 0.08, 0x1a2026, cx + s * 5.4, fy, FZ + 0.04));
    }
  }

  // crown + neon script
  stucco.push(cBox(W + 0.4, 0.8, D + 0.4, PINK2, cx, CITY_Y + bodyH + 0.4, zMass));
  neon.push(cBox(W * 0.7, 0.7, 0.12, NEON, cx, CITY_Y + bodyH + 0.9, FZ - 0.2));

  // pool-bar stools (visual, no colliders) under the arcade sides
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      dark.push(cCyl(0.16, 0.18, 0.85, 8, 0x2a2420,
        cx + s * 6.2, CITY_Y + 0.42, arcadeZ + (i - 1) * 0.9));
    }
  }

  addCollider(cx, CITY_Y + CLEVELANDER_SOFFIT, zMass,
    W + 0.5, bodyH - CLEVELANDER_SOFFIT + 1.2, D + 0.5);
  addCollider(cx, CITY_Y, FZ + 2.1 + (D - 4.2) / 2,
    W + 0.4, CLEVELANDER_SOFFIT, D - 4.0);
  addCollider(cx, CITY_Y + CLEVELANDER_SOFFIT, arcadeZ,
    W - 0.4, 0.3, 3.4);
}

function buildCardozoMass(stucco, dark, glass, neon, addCollider) {
  const cx = CARDOZO_X;
  const FZ = CARDOZO_FRONT_Z;
  const W = CARDOZO_W;
  const D = CARDOZO_D;
  const BODY = 0xf6f2e9, TRIM = 0x7fd4c1, NEON = 0x2fe0ff;
  const GH = 4.0, FH = 3.2, floors = 4;
  const bodyH = GH + (floors - 1) * FH;
  const zMass = FZ + D / 2;

  stucco.push(cBox(W, bodyH, D, BODY, cx, CITY_Y + bodyH / 2, zMass));
  stucco.push(cBox(W * 0.38, bodyH, 0.55, BODY, cx, CITY_Y + bodyH / 2, FZ - 0.22));

  for (let f = 0; f < floors; f++) {
    const fy = CITY_Y + (f === 0 ? 0 : GH + (f - 1) * FH);
    const fh = f === 0 ? GH : FH;
    const winY = fy + fh * 0.56;
    const winH = f === 0 ? 2.3 : 1.6;
    stucco.push(cBox(W + 0.2, 0.16, 0.65, TRIM, cx, winY + winH / 2 + 0.32, FZ - 0.3));
    for (const s of [-1, 1]) {
      glass.push(new THREE.BoxGeometry(2.2, winH, 0.1)
        .translate(cx + s * 4.4, winY, FZ - 0.05));
      dark.push(cBox(2.4, winH + 0.2, 0.08, 0x1a2026, cx + s * 4.4, winY, FZ + 0.04));
    }
    if (f > 0) {
      glass.push(new THREE.BoxGeometry(W * 0.22, winH + 0.4, 0.1)
        .translate(cx, winY, FZ - 0.55));
    }
  }

  const roofY = CITY_Y + bodyH;
  stucco.push(cBox(W + 0.3, 0.8, D + 0.3, BODY, cx, roofY + 0.4, zMass));
  neon.push(colorFill(new THREE.BoxGeometry(W + 0.1, 0.08, 0.08)
    .translate(cx, roofY + 0.86, FZ - 0.2), NEON));
  stucco.push(cBox(W * 0.45, 1.6, 3.4, BODY, cx, roofY + 1.5, FZ + 1.8));

  // porch canopy you can still skim under (not a signed fly void)
  stucco.push(cBox(W * 0.55, 0.18, 1.8, TRIM, cx, CITY_Y + 3.2, FZ - 1.0));
  for (const s of [-1, 1]) {
    dark.push(cCyl(0.09, 0.1, 3.1, 8, 0x9aa3aa,
      cx + s * 3.6, CITY_Y + 1.55, FZ - 1.6));
  }

  addCollider(cx, CITY_Y, zMass, W + 0.5, bodyH + 2.2, D + 0.5);
  addCollider(cx, CITY_Y + 3.1, FZ - 1.0, W * 0.55, 0.3, 1.9);
}
