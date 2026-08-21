import * as THREE from 'three';
import { assetLib } from '../../../core/assets.js';
import { setAoUVs } from '../textures.js';
import {
  POCKET_PARK_X, POCKET_PARK_Z,
  POCKET_PARK_E_X, POCKET_PARK_E_Z,
  POCKET_PARK_F_X, POCKET_PARK_F_Z,
  POCKET_PARK_G_X, POCKET_PARK_G_Z,
  POCKET_PARK_H_X, POCKET_PARK_H_Z,
  POCKET_PARK_H_MIN, POCKET_PARK_H_MAX, POCKET_PARK_LAWN_H,
  POCKET_PARK_HULL_COLLIDER, POCKET_PARK_AABB,
  pocketParkHull, pocketParkDrop, pocketParkLean,
  pocketParkPlannedCount, pocketParkRejected,
  installPocketParkColliders, onPavement, groundHeight,
  inGardenPath,
} from '../constants.js';
import { tessellateHull, tryPlace } from '../planting.js';

/**
 * pocketPark — Tiny Glade grow-to-gap on leftover-city plates.
 *
 * Not leftoverLot. Not a haunt. Not leftover-dirt 190k. Not a path,
 * bench, or leftoverGrass restack. Keepout is published in constants.js
 * before scatter; tryPlace drops palms / dirt-blades on these cells.
 * Hulls at grade (Sylva methods: tessellated hull, thin grade
 * collider — not per-blade colliders). Never a filled grass AABB.
 * Never a 0.3 m pad AABB. The 8–25 m St. Augustine read is the
 * grass_lawn grade plate at POCKET_PARK_LAWN_H 0.05 (same assetLib
 * set dressing.js already folds). 10–13k cone instances are a leftover
 * ceiling, not the card budget. Near-corridor cards stay under 2k
 * total. Shared kit, not a second scatterer. Not a pocketParkEGeom fork.
 * Not a pocketParkFGeom fork. Not a pocketParkGGeom fork. Not a
 * pocketParkHGeom fork. Not a slide of 276.
 * Plant from the grid. tryPlace reject-or-drop off pavement, warehouse,
 * leftoverLot A–H reserved, helipad E, and the garden path. Never
 * nudge. Lean at nearest leftoverLot fence (including E, 2 m
 * inland, F, 2 m inland, G, 2 m inland, and H, 2 m inland) or garden
 * path if it reaches. Do not slide the 276 hull onto the path (z0=88 sits
 * inland of path z1=84.8). Signed 276/92, plate 16×8, bounds
 * 268–284 / 88–96. Second hull at signed 347/96, same kit, bounds
 * 339–355 / 92–100 (Desi + Reesy). Third hull at signed 364/96,
 * same kit, bounds 356–372 / 92–100 (Desi + Reesy). leftoverLotOverlap
 * of F reserved is 0 (1 m leftover apron, not a kiss). E-park x1=355
 * must not merge with this hull. Fourth hull at signed 381/96, same
 * kit, bounds 373–389 / 92–100 (Desi + Reesy). leftoverLotOverlap of G
 * reserved is 0 (1 m leftover apron, not a kiss). F-park x1=372
 * must not merge with this hull. Fifth hull at signed 398/96, same
 * kit, bounds 390–406 / 92–100 (Desi + Reesy). leftoverLotOverlap of H
 * reserved is 0 (1 m leftover apron, not a kiss). G-park x1=389
 * must not merge with this hull. leftoverLot A–H stay.
 */

const CARD_BAND = 1.2;
const CARD_KEEP = 0.055;
const CARD_MAX = 1800;

function hash01(a, b) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2545f491);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

function grassPlantDrop(ctx, x, z) {
  // tryPlace-drop on warehouse / leftoverLot A–H / helipad / path /
  // pavement. Reject-or-drop, never nudge. Signed leftover-city grade
  // keeps.
  if (pocketParkDrop(x, z)) {
    tryPlace(ctx, x, z);
    return 0;
  }
  if (onPavement(x, z)) return tryPlace(ctx, x, z);
  return groundHeight(x, z);
}

function cardGeo() {
  const geo = new THREE.PlaneGeometry(0.16, 1);
  geo.translate(0, 0.5, 0);
  return geo;
}

function stampField(im, list) {
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    e.set(b.lean, b.yaw, 0);
    q.setFromEuler(e);
    s.set(b.sc, b.h, b.sc);
    p.set(b.x, b.y, b.z);
    m4.compose(p, q, s);
    im.setMatrixAt(i, m4);
  }
  im.instanceMatrix.needsUpdate = true;
  im.computeBoundingSphere();
  im.frustumCulled = true;
  im.castShadow = false;
  im.receiveShadow = true;
  im.count = list.length;
}

function fallbackLawnMat(track) {
  const mat = track(new THREE.MeshStandardMaterial({
    color: 0x4c7a3d,
    roughness: 1,
    metalness: 0,
  }));
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = -2;
  mat.polygonOffsetUnits = -2;
  return mat;
}

async function bindGrassLawn(mat) {
  if (!assetLib) return;
  try {
    const lawnSet = await assetLib.textureSet('grass_lawn');
    if (!lawnSet || !lawnSet.map) return;
    const pbr = await assetLib.pbrMaterial('grass_lawn', { repeat: [7, 4.5] });
    mat.map = pbr.map;
    mat.normalMap = pbr.normalMap;
    mat.roughnessMap = pbr.roughnessMap;
    mat.aoMap = pbr.aoMap;
    mat.metalnessMap = pbr.metalnessMap;
    if (pbr.normalScale) mat.normalScale.copy(pbr.normalScale);
    mat.color.setHex(0xffffff);
    mat.roughness = pbr.roughness;
    mat.needsUpdate = true;
  } catch (e) {
    void e;
  }
}

function acceptedHulls() {
  const rejectA = pocketParkRejected();
  const rejectE = pocketParkRejected(POCKET_PARK_E_X, POCKET_PARK_E_Z);
  const rejectF = pocketParkRejected(POCKET_PARK_F_X, POCKET_PARK_F_Z);
  const rejectG = pocketParkRejected(POCKET_PARK_G_X, POCKET_PARK_G_Z);
  const rejectH = pocketParkRejected(POCKET_PARK_H_X, POCKET_PARK_H_Z);
  const hulls = [];
  if (!rejectA && !onPavement(POCKET_PARK_X, POCKET_PARK_Z)) {
    hulls.push(pocketParkHull());
  }
  if (!rejectE && !onPavement(POCKET_PARK_E_X, POCKET_PARK_E_Z)) {
    hulls.push(pocketParkHull(POCKET_PARK_E_X, POCKET_PARK_E_Z));
  }
  if (!rejectF && !onPavement(POCKET_PARK_F_X, POCKET_PARK_F_Z)) {
    hulls.push(pocketParkHull(POCKET_PARK_F_X, POCKET_PARK_F_Z));
  }
  if (!rejectG && !onPavement(POCKET_PARK_G_X, POCKET_PARK_G_Z)) {
    hulls.push(pocketParkHull(POCKET_PARK_G_X, POCKET_PARK_G_Z));
  }
  if (!rejectH && !onPavement(POCKET_PARK_H_X, POCKET_PARK_H_Z)) {
    hulls.push(pocketParkHull(POCKET_PARK_H_X, POCKET_PARK_H_Z));
  }
  return hulls;
}

function collectCards(ctx, hulls) {
  const placed = [];
  for (let n = 0; n < hulls.length; n++) {
    const hull = hulls[n];
    const cells = tessellateHull(hull, pocketParkPlannedCount(hull.x, hull.z));
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const y = grassPlantDrop(ctx, c.x, c.z);
      if (!y) continue;
      if (!inGardenPath(c.x, c.z, CARD_BAND)) continue;
      const u = hash01(i + 11 + n * 97, (hull.seed || 1) * 19);
      if (u > CARD_KEEP) continue;
      placed.push({
        x: c.x, y, z: c.z,
        yaw: c.yaw,
        sc: 0.82 + u * 0.20,
        h: POCKET_PARK_H_MIN + u * (POCKET_PARK_H_MAX - POCKET_PARK_H_MIN),
        lean: pocketParkLean(c.x, c.z),
      });
    }
  }
  if (placed.length <= CARD_MAX) return placed;
  const keep = [];
  const step = placed.length / CARD_MAX;
  for (let i = 0; i < CARD_MAX; i++) keep.push(placed[Math.floor(i * step)]);
  return keep;
}

function addGradePlates(root, track, hulls, lawnMat) {
  const plates = [];
  for (let n = 0; n < hulls.length; n++) {
    const hull = hulls[n];
    const geo = track(new THREE.BoxGeometry(hull.w, POCKET_PARK_LAWN_H, hull.d));
    setAoUVs(geo);
    const mesh = new THREE.Mesh(geo, lawnMat);
    mesh.name = 'pocketPark-lawn';
    mesh.position.set(hull.x, hull.y0 + POCKET_PARK_LAWN_H * 0.5, hull.z);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    root.add(mesh);
    plates.push(mesh);
  }
  return plates;
}

/**
 * Instance grow-to-gap St. Augustine on the signed leftover-city plates.
 * Rejects each hull independently if pavement, a street, leftoverLot
 * A–H reserved, warehouse reserved, helipad E, or the garden path.
 * Never remaps x/z. Scatter stays on tryPlace. Same pocketParkHull
 * kit at 276/92, 347/96, 364/96, 381/96, and 398/96 — not a
 * pocketParkEGeom fork, not a pocketParkFGeom fork, not a
 * pocketParkGGeom fork, not a pocketParkHGeom fork.
 * leftoverLotOverlap of F reserved is 0 (1 m leftover apron, not a
 * kiss). E-park x1=355 must not merge with the 364/96 hull.
 * leftoverLotOverlap of G reserved is 0 (1 m leftover apron, not a
 * kiss). F-park x1=372 must not merge with the 381/96 hull.
 * leftoverLotOverlap of H reserved is 0 (1 m leftover apron, not a
 * kiss). G-park x1=389 must not merge with the 398/96 hull.
 * leftoverLot A–H stay.
 */
export function buildPocketPark(ctx) {
  if (onPavement(POCKET_PARK_X, POCKET_PARK_Z)) {
    tryPlace(ctx, POCKET_PARK_X, POCKET_PARK_Z);
  }
  if (onPavement(POCKET_PARK_E_X, POCKET_PARK_E_Z)) {
    tryPlace(ctx, POCKET_PARK_E_X, POCKET_PARK_E_Z);
  }
  if (onPavement(POCKET_PARK_F_X, POCKET_PARK_F_Z)) {
    tryPlace(ctx, POCKET_PARK_F_X, POCKET_PARK_F_Z);
  }
  if (onPavement(POCKET_PARK_G_X, POCKET_PARK_G_Z)) {
    tryPlace(ctx, POCKET_PARK_G_X, POCKET_PARK_G_Z);
  }
  if (onPavement(POCKET_PARK_H_X, POCKET_PARK_H_Z)) {
    tryPlace(ctx, POCKET_PARK_H_X, POCKET_PARK_H_Z);
  }
  if (POCKET_PARK_AABB) return null;

  const hulls = acceptedHulls();
  if (!hulls.length) return null;
  if (hulls.some((h) => h.collider !== POCKET_PARK_HULL_COLLIDER)) return null;

  const { root, track, addCollider, addCyl, setTag } = ctx;
  setTag('pocketPark');

  const placed = collectCards(ctx, hulls);

  let mesh = null;
  if (placed.length) {
    const geo = track(cardGeo());
    const mat = track(new THREE.MeshStandardMaterial({
      color: 0x5a6e42,
      roughness: 1,
      metalness: 0,
      side: THREE.DoubleSide,
      fog: true,
    }));
    mesh = new THREE.InstancedMesh(geo, mat, placed.length);
    mesh.name = 'pocketPark-cards';
    stampField(mesh, placed);
    root.add(mesh);
  }

  const lawnMat = fallbackLawnMat(track);
  const plates = addGradePlates(root, track, hulls, lawnMat);
  void bindGrassLawn(lawnMat);

  installPocketParkColliders(addCyl, addCollider);
  setTag('world');
  return {
    group: mesh,
    count: placed.length,
    plates: plates.length,
    hullCollider: hulls[0].collider,
  };
}
