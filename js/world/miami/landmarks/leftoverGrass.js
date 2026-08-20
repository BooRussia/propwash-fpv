import * as THREE from 'three';
import {
  CITY_Y,
  LEFTOVER_GRASS_X, LEFTOVER_GRASS_Z,
  LEFTOVER_GRASS_H_MIN, LEFTOVER_GRASS_H_MAX,
  LEFTOVER_GRASS_HULL_COLLIDER, LEFTOVER_GRASS_AABB,
  leftoverGrassHull, leftoverGrassDrop, leftoverGrassLean,
  leftoverGrassPlannedCount, leftoverGrassRejected,
  installLeftoverGrassColliders, onPavement, groundHeight,
} from '../constants.js';
import { tessellateHull, tryPlace } from '../planting.js';

/**
 * leftoverGrass — Tiny Glade grow-to-gap on one leftover-city hull.
 *
 * Not leftoverLot. Not a haunt. Not leftover-dirt 190k. Not a path or
 * bench restack. The path's thin joint hull stays. Keepout is published
 * in constants.js before scatter; tryPlace drops palms / dirt-blades on
 * this cell. One hull at grade (Sylva methods: tessellated hull, one
 * thin grade collider — not per-blade colliders). Blades are visual.
 * Never a filled grass AABB. Never a 0.3 m pad AABB. Blade H 0.12–0.22 m
 * (unmowed St. Augustine) so they read at 8–25 m. A 50 mm lawn
 * disappears — do not ship that. ~8–12k instances, leftover × cover²,
 * not dirt COVER_NEAR 3.36.
 *
 * Shared kit, not a second scatterer. Plant from the grid. tryPlace
 * reject-or-drop off pavement, garden-path flagstones, leftoverLot
 * A/B/C reserved, and the bench plate. Never nudge. Lean at nearest
 * slab / bench leg / leftoverLot fence. Grow into the path's 60–100 mm
 * joints. Signed 267–285 / z 81.0–86.0 (Desi + Reesy).
 */

const BASE = new THREE.Color(0x2a3d28);
const TIP = new THREE.Color(0x6a7a48);

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

function bladeGeo() {
  const segs = 2;
  const h = 1;
  const w = 0.12;
  const geo = new THREE.BufferGeometry();
  const vCount = (segs + 1) * 2;
  const pos = new Float32Array(vCount * 3);
  const col = new Float32Array(vCount * 3);
  const nrm = new Float32Array(vCount * 3);
  const idx = new Uint16Array(segs * 6);
  for (let s = 0; s <= segs; s++) {
    const t = s / segs;
    const y = t * h;
    const hw = w * (1 - t * 0.78) * 0.5;
    const i0 = s * 2;
    pos[i0 * 3] = -hw; pos[i0 * 3 + 1] = y; pos[i0 * 3 + 2] = 0;
    pos[(i0 + 1) * 3] = hw; pos[(i0 + 1) * 3 + 1] = y; pos[(i0 + 1) * 3 + 2] = 0;
    const r = BASE.r + (TIP.r - BASE.r) * t;
    const g = BASE.g + (TIP.g - BASE.g) * t;
    const b = BASE.b + (TIP.b - BASE.b) * t;
    col[i0 * 3] = r; col[i0 * 3 + 1] = g; col[i0 * 3 + 2] = b;
    col[(i0 + 1) * 3] = r; col[(i0 + 1) * 3 + 1] = g; col[(i0 + 1) * 3 + 2] = b;
    nrm[i0 * 3 + 2] = 1;
    nrm[(i0 + 1) * 3 + 2] = 1;
    if (s < segs) {
      const o = s * 6;
      idx[o] = i0; idx[o + 1] = i0 + 1; idx[o + 2] = i0 + 2;
      idx[o + 3] = i0 + 1; idx[o + 4] = i0 + 3; idx[o + 5] = i0 + 2;
    }
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
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

/**
 * Instance grow-to-gap St. Augustine on the signed leftover-city hull.
 * Rejects if the hull is pavement, a street, or leftoverLot A/B/C
 * reserved. Never remaps x/z. Scatter stays on tryPlace.
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

  const cells = tessellateHull(hull, leftoverGrassPlannedCount());
  const placed = [];
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    const y = grassPlantDrop(ctx, c.x, c.z);
    if (!y) continue;
    const u = hash01(i + 11, (hull.seed || 1) * 19);
    placed.push({
      x: c.x, y, z: c.z,
      yaw: c.yaw,
      sc: 0.82 + u * 0.20,
      h: LEFTOVER_GRASS_H_MIN + u * (LEFTOVER_GRASS_H_MAX - LEFTOVER_GRASS_H_MIN),
      lean: leftoverGrassLean(c.x, c.z),
    });
  }

  let mesh = null;
  if (placed.length) {
    const geo = track(bladeGeo());
    const mat = track(new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1,
      metalness: 0,
      vertexColors: true,
      side: THREE.DoubleSide,
      fog: true,
    }));
    mesh = new THREE.InstancedMesh(geo, mat, placed.length);
    mesh.name = 'leftoverGrass-blades';
    stampField(mesh, placed);
    root.add(mesh);
  }

  installLeftoverGrassColliders(addCyl, addCollider);
  setTag('world');
  return { group: mesh, count: placed.length, hullCollider: hull.collider };
}
