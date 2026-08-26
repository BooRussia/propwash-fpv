import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CITY_Y, CASA_X, CASA_FRONT_Z, CASA_W, CASA_D, CASA_LOGGIA_D, CASA_LOGGIA_H,
  installFlyColliders,
} from '../constants.js';
import { cBox, cCyl } from '../geo.js';
import { stuccoTexture } from '../textures.js';

// ============================================================
// Casa Casuarina — Mediterranean Revival mansion on Ocean Drive
// (1116 Ocean Drive / Versace mansion analogue).
//
// Coral stucco, barrel-tile roof, wrought-iron balcony, and a
// four-column loggia facing the road. The loggia is a fly-through:
// colliders are columns + soffit only (see flyColliderShapes tag
// 'casa'). Never a box in the bay. Never leftoverLot. Never rng.
// ============================================================

const FZ = CASA_FRONT_Z;
const STUCCO = 0xe8d5b7, STUCCO2 = 0xd9c4a0, STONE = 0x8a7a62;
const TILE = 0xb8432f, TILE2 = 0x9a3426, IRON = 0x1a1c1e, WOOD = 0x3a2a1c;
const GLASS = 0x1a2a32, CREAM = 0xf3efe6;

/**
 * Build Casa Casuarina on the Ocean Drive facade plane.
 * @returns {{ group: THREE.Group }}
 */
export function buildCasa(ctx) {
  const { root, track, addCollider, addCyl, setTag, regDN } = ctx;
  setTag('casa');

  const stucco = [];
  const dark = [];
  const tile = [];
  const glass = [];

  const cx = CASA_X;
  const W = CASA_W;
  const D = CASA_D;
  const bodyH = 9.6;
  const zMass = FZ + D / 2;
  const loggiaZ = FZ - CASA_LOGGIA_D / 2;

  // ---------------- main mass (behind the loggia) ----------------
  stucco.push(cBox(W, bodyH, D, STUCCO, cx, CITY_Y + bodyH / 2, zMass));
  // quoins
  for (const s of [-1, 1]) {
    stucco.push(cBox(0.55, bodyH, 0.55, STONE,
      cx + s * (W / 2 - 0.2), CITY_Y + bodyH / 2, FZ + 0.2));
    stucco.push(cBox(0.55, bodyH, 0.55, STONE,
      cx + s * (W / 2 - 0.2), CITY_Y + bodyH / 2, FZ + D - 0.2));
  }
  // belt course
  stucco.push(cBox(W + 0.2, 0.22, D + 0.2, STONE, cx, CITY_Y + CASA_LOGGIA_H + 0.05, zMass));

  // ---------------- loggia columns + soffit (visual; colliders via kit) ----
  for (const s of [-0.38, -0.14, 0.14, 0.38]) {
    stucco.push(cCyl(0.22, 0.24, CASA_LOGGIA_H, 10, CREAM,
      cx + s * W, CITY_Y + CASA_LOGGIA_H / 2, loggiaZ));
    dark.push(cBox(0.56, 0.12, 0.56, STONE, cx + s * W, CITY_Y + 0.06, loggiaZ));
    dark.push(cBox(0.5, 0.14, 0.5, STONE, cx + s * W, CITY_Y + CASA_LOGGIA_H - 0.08, loggiaZ));
  }
  stucco.push(cBox(W - 0.2, 0.28, CASA_LOGGIA_D + 0.4, STUCCO2,
    cx, CITY_Y + CASA_LOGGIA_H + 0.14, loggiaZ));
  // terrazzo under the arcade
  dark.push(cBox(W - 0.6, 0.05, CASA_LOGGIA_D + 0.6, 0x9a9080,
    cx, CITY_Y + 0.03, loggiaZ));

  // arched recesses on the loggia back wall (visual only)
  for (const s of [-0.26, 0, 0.26]) {
    dark.push(cBox(2.4, 2.6, 0.12, WOOD, cx + s * W, CITY_Y + 1.5, FZ + 0.08));
    glass.push(new THREE.BoxGeometry(2.0, 2.2, 0.08)
      .translate(cx + s * W, CITY_Y + 1.55, FZ + 0.02));
  }

  // ---------------- piano nobile windows + balcony ----------------
  const winY = CITY_Y + CASA_LOGGIA_H + 2.4;
  for (let i = -2; i <= 2; i++) {
    const wx = cx + i * 4.4;
    glass.push(new THREE.BoxGeometry(1.6, 2.1, 0.1).translate(wx, winY, FZ - 0.04));
    dark.push(cBox(1.85, 2.35, 0.1, WOOD, wx, winY, FZ + 0.04));
    dark.push(cBox(0.08, 2.1, 0.12, IRON, wx, winY, FZ - 0.08));
  }
  // wrought-iron balcony
  dark.push(cBox(W - 2.2, 0.1, 1.15, STONE, cx, CITY_Y + CASA_LOGGIA_H + 1.05, FZ - 0.7));
  for (let i = -8; i <= 8; i++) {
    dark.push(cBox(0.05, 0.85, 0.05, IRON, cx + i * 1.35, CITY_Y + CASA_LOGGIA_H + 1.5, FZ - 1.2));
  }
  dark.push(cBox(W - 2.2, 0.06, 0.06, IRON, cx, CITY_Y + CASA_LOGGIA_H + 1.92, FZ - 1.2));

  // ---------------- barrel-tile roof ----------------
  const roofY = CITY_Y + bodyH;
  tile.push(cBox(W + 1.4, 0.28, D + 1.2, TILE, cx, roofY + 0.2, zMass - 0.4));
  tile.push(cBox(W * 0.62, 0.9, D * 0.45, TILE2, cx, roofY + 0.85, FZ + 6.5));
  tile.push(cBox(W * 0.34, 0.7, D * 0.28, TILE, cx, roofY + 1.55, FZ + 5.2));
  // eaves
  stucco.push(cBox(W + 1.6, 0.16, D + 1.4, STONE, cx, roofY + 0.04, zMass - 0.3));
  // chimneys
  for (const s of [-1, 1]) {
    stucco.push(cBox(1.1, 2.2, 0.85, STUCCO2, cx + s * 8.5, roofY + 1.4, FZ + 16));
    tile.push(cBox(1.3, 0.18, 1.05, TILE, cx + s * 8.5, roofY + 2.55, FZ + 16));
  }

  // ---------------- side porte-cochere hint (west) ----------------
  stucco.push(cBox(4.2, 0.22, 6.2, STUCCO2, cx - W / 2 - 1.6, CITY_Y + 3.55, FZ + 4));
  for (const s of [-1, 1]) {
    stucco.push(cCyl(0.18, 0.2, 3.4, 8, CREAM,
      cx - W / 2 - 1.6, CITY_Y + 1.7, FZ + 4 + s * 2.4));
  }

  // ---------------- colliders: mass + roof, never the loggia bay ----------
  addCollider(cx, CITY_Y, zMass, W + 0.5, bodyH + 0.4, D + 0.5);
  addCollider(cx, roofY, FZ + 6.5, W * 0.66, 2.4, D * 0.5);
  addCyl(cx - W / 2 - 1.6, CITY_Y, FZ + 1.6, 0.2, 3.4);
  addCyl(cx - W / 2 - 1.6, CITY_Y, FZ + 6.4, 0.2, 3.4);
  addCollider(cx - W / 2 - 1.6, CITY_Y + 3.4, FZ + 4, 4.4, 0.3, 6.4);
  installFlyColliders(addCyl, addCollider, 'casa');

  // ---------------- materialise ----------------
  const group = new THREE.Group();
  group.name = 'casa-casuarina';

  const stTex = track(stuccoTexture());
  stTex.repeat.set(0.28, 0.28);
  const stuccoMat = track(new THREE.MeshStandardMaterial({
    map: stTex, vertexColors: true, roughness: 0.94, metalness: 0,
  }));
  const stuccoGeo = track(mergeGeometries(stucco));
  stucco.forEach((g) => g.dispose());
  const stuccoMesh = new THREE.Mesh(stuccoGeo, stuccoMat);
  stuccoMesh.castShadow = true;
  stuccoMesh.receiveShadow = true;
  group.add(stuccoMesh);

  const darkMat = track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.62, metalness: 0.28,
  }));
  const darkGeo = track(mergeGeometries(dark));
  dark.forEach((g) => g.dispose());
  const darkMesh = new THREE.Mesh(darkGeo, darkMat);
  darkMesh.castShadow = true;
  group.add(darkMesh);

  const tileMat = track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.88, metalness: 0.04,
  }));
  const tileGeo = track(mergeGeometries(tile));
  tile.forEach((g) => g.dispose());
  const tileMesh = new THREE.Mesh(tileGeo, tileMat);
  tileMesh.castShadow = true;
  group.add(tileMesh);

  const glassMat = regDN(track(new THREE.MeshStandardMaterial({
    color: GLASS, metalness: 0.4, roughness: 0.08,
    envMapIntensity: 1.1, emissive: 0xffcf92, emissiveIntensity: 0,
  })), 0, 0.45);
  const glassGeo = track(mergeGeometries(glass));
  glass.forEach((g) => g.dispose());
  group.add(new THREE.Mesh(glassGeo, glassMat));

  root.add(group);
  setTag('world');
  return { group };
}
