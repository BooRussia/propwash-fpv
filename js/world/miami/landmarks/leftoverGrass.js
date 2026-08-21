import * as THREE from 'three';
import { assetLib } from '../../../core/assets.js';
import { setAoUVs } from '../textures.js';
import {
  LEFTOVER_GRASS_X, LEFTOVER_GRASS_Z,
  LEFTOVER_GRASS_H_MIN, LEFTOVER_GRASS_H_MAX, LEFTOVER_GRASS_LAWN_H,
  LEFTOVER_GRASS_HULL_COLLIDER, LEFTOVER_GRASS_AABB,
  leftoverGrassHull, leftoverGrassDrop, leftoverGrassLean,
  leftoverGrassPlannedCount, leftoverGrassRejected,
  installLeftoverGrassColliders, onPavement, groundHeight,
  inGardenPath,
} from '../constants.js';
import { tessellateHull, tryPlace } from '../planting.js';

/**
 * leftoverGrass — Tiny Glade grow-to-gap on one leftover-city hull.
 *
 * Not leftoverLot. Not a haunt. Not leftover-dirt 190k. Not a path or
 * bench restack. The path's thin joint hull stays. Keepout is published
 * in constants.js before scatter; tryPlace drops palms / dirt-blades on
 * this cell. One hull at grade (Sylva methods: tessellated hull, one
 * thin grade collider — not per-blade colliders). Never a filled grass AABB.
 * Never a 0.3 m pad AABB. The 8–25 m St. Augustine read is the
 * grass_lawn grade plate at LEFTOVER_GRASS_LAWN_H 0.05 (same assetLib
 * set dressing.js already folds). 8–12k cone instances are a leftover
 * ceiling, not the card budget. Near-corridor cards stay under 2k
 * total. Shared kit, not a second scatterer. Plant from the grid.
 * tryPlace reject-or-drop off pavement, garden-path flagstones,
 * leftoverLot A/B/C reserved, and the bench plate. Never nudge.
 * Kiss = drop. Never remaps x/z. Lean at nearest slab / bench leg /
 * leftoverLot fence. Grow into the path's 60–100 mm joints. Signed
 * 267–285 / z 81.0–86.0 (Desi + Reesy). leftoverLot A/B/C stay.
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
  // tryPlace-drop on stones / leftoverLot A/B/C / bench / pavement.
  // Reject-or-drop, never nudge. Joints and leftover-city grade keep.
  if (leftoverGrassDrop(x, z)) {
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

function collectCards(ctx, hull) {
  const placed = [];
  const cells = tessellateHull(hull, leftoverGrassPlannedCount());
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    const y = grassPlantDrop(ctx, c.x, c.z);
    if (!y) continue;
    if (!inGardenPath(c.x, c.z, CARD_BAND)) continue;
    const u = hash01(i + 11, (hull.seed || 1) * 19);
    if (u > CARD_KEEP) continue;
    placed.push({
      x: c.x, y, z: c.z,
      yaw: c.yaw,
      sc: 0.82 + u * 0.20,
      h: LEFTOVER_GRASS_H_MIN + u * (LEFTOVER_GRASS_H_MAX - LEFTOVER_GRASS_H_MIN),
      lean: leftoverGrassLean(c.x, c.z),
    });
  }
  if (placed.length <= CARD_MAX) return placed;
  const keep = [];
  const step = placed.length / CARD_MAX;
  for (let i = 0; i < CARD_MAX; i++) keep.push(placed[Math.floor(i * step)]);
  return keep;
}

function addGradePlate(root, track, hull, lawnMat) {
  const geo = track(new THREE.BoxGeometry(hull.w, LEFTOVER_GRASS_LAWN_H, hull.d));
  setAoUVs(geo);
  const mesh = new THREE.Mesh(geo, lawnMat);
  mesh.name = 'leftoverGrass-lawn';
  mesh.position.set(hull.x, hull.y0 + LEFTOVER_GRASS_LAWN_H * 0.5, hull.z);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

/**
 * Instance grow-to-gap St. Augustine on the signed leftover-city hull.
 * Rejects if the hull is pavement, a street, or leftoverLot A/B/C
 * reserved. Never remaps x/z. Scatter stays on tryPlace. The mid
 * read is the grass_lawn grade plate; sparse cards only in the near
 * corridor.
 */
export function buildLeftoverGrass(ctx) {
  if (leftoverGrassRejected()) return null;
  if (onPavement(LEFTOVER_GRASS_X, LEFTOVER_GRASS_Z)) {
    tryPlace(ctx, LEFTOVER_GRASS_X, LEFTOVER_GRASS_Z);
    return null;
  }
  const { root, track, addCollider, addCyl, setTag } = ctx;
  setTag('leftoverGrass');

  const hull = leftoverGrassHull();
  if (hull.collider !== LEFTOVER_GRASS_HULL_COLLIDER) return null;
  if (LEFTOVER_GRASS_AABB) return null;

  const placed = collectCards(ctx, hull);

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
    mesh.name = 'leftoverGrass-cards';
    stampField(mesh, placed);
    root.add(mesh);
  }

  const lawnMat = fallbackLawnMat(track);
  const plate = addGradePlate(root, track, hull, lawnMat);
  void bindGrassLawn(lawnMat);

  installLeftoverGrassColliders(addCyl, addCollider);
  setTag('world');
  return {
    group: mesh,
    count: placed.length,
    plates: plate ? 1 : 0,
    hullCollider: hull.collider,
  };
}
