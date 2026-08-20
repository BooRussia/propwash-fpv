import * as THREE from 'three';
import {
  POCKET_PARK_X, POCKET_PARK_Z,
  POCKET_PARK_E_X, POCKET_PARK_E_Z,
  POCKET_PARK_F_X, POCKET_PARK_F_Z,
  POCKET_PARK_H_MIN, POCKET_PARK_H_MAX,
  POCKET_PARK_HULL_COLLIDER, POCKET_PARK_AABB,
  pocketParkHull, pocketParkDrop, pocketParkLean,
  pocketParkPlannedCount, pocketParkRejected,
  installPocketParkColliders, onPavement, groundHeight,
} from '../constants.js';
import { tessellateHull, tryPlace } from '../planting.js';

/**
 * pocketPark — Tiny Glade grow-to-gap on leftover-city plates.
 *
 * Not leftoverLot. Not a haunt. Not leftover-dirt 190k. Not a path,
 * bench, or leftoverGrass restack. Keepout is published in constants.js
 * before scatter; tryPlace drops palms / dirt-blades on these cells.
 * Hulls at grade (Sylva methods: tessellated hull, thin grade
 * collider — not per-blade colliders). Blades are visual. Never a
 * filled grass AABB. Never a 0.3 m pad AABB. Blade H 0.12–0.22 m
 * (unmowed St. Augustine) so they read at 8–25 m. A 50 mm lawn
 * disappears — do not ship that. ~10–13k instances, area × cover²,
 * not dirt COVER_NEAR 3.36.
 *
 * Shared kit, not a second scatterer. Not a pocketParkEGeom fork.
 * Not a pocketParkFGeom fork. Not a slide of 276. Plant from the
 * grid. tryPlace reject-or-drop off pavement, warehouse,
 * leftoverLot A–F reserved, helipad E, and the garden path. Never
 * nudge. Lean at nearest leftoverLot fence (including E, 2 m
 * inland, and F, 2 m inland) or garden path if it reaches. Do not
 * slide the 276 hull onto the path (z0=88 sits inland of path
 * z1=84.8). Signed 276/92, plate 16×8, bounds 268–284 / 88–96.
 * Second hull at signed 347/96, same kit, bounds 339–355 / 92–100
 * (Desi + Reesy). Third hull at signed 364/96, same kit, bounds
 * 356–372 / 92–100 (Desi + Reesy). leftoverLotOverlap of F
 * reserved is 0 (1 m leftover apron, not a kiss). E-park x1=355
 * must not merge with this hull.
 */

const BASE = new THREE.Color(0x2a3d28);
const TIP = new THREE.Color(0x6a7a48);

function hash01(a, b) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2545f491);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

function grassPlantDrop(ctx, x, z) {
  // tryPlace-drop on warehouse / leftoverLot A–F / helipad / path /
  // pavement. Reject-or-drop, never nudge. Signed leftover-city grade
  // keeps.
  if (pocketParkDrop(x, z)) {
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
 * Instance grow-to-gap St. Augustine on the signed leftover-city plates.
 * Rejects each hull independently if pavement, a street, leftoverLot
 * A–F reserved, warehouse reserved, helipad E, or the garden path.
 * Never remaps x/z. Scatter stays on tryPlace. Same pocketParkHull
 * kit at 276/92, 347/96, and 364/96 — not a pocketParkEGeom fork,
 * not a pocketParkFGeom fork. leftoverLotOverlap of F reserved is
 * 0 (1 m leftover apron, not a kiss). E-park x1=355 must not merge
 * with the 364/96 hull.
 */
export function buildPocketPark(ctx) {
  const rejectA = pocketParkRejected();
  const rejectE = pocketParkRejected(POCKET_PARK_E_X, POCKET_PARK_E_Z);
  const rejectF = pocketParkRejected(POCKET_PARK_F_X, POCKET_PARK_F_Z);
  if (onPavement(POCKET_PARK_X, POCKET_PARK_Z)) {
    tryPlace(ctx, POCKET_PARK_X, POCKET_PARK_Z);
  }
  if (onPavement(POCKET_PARK_E_X, POCKET_PARK_E_Z)) {
    tryPlace(ctx, POCKET_PARK_E_X, POCKET_PARK_E_Z);
  }
  if (onPavement(POCKET_PARK_F_X, POCKET_PARK_F_Z)) {
    tryPlace(ctx, POCKET_PARK_F_X, POCKET_PARK_F_Z);
  }
  if (POCKET_PARK_AABB) return null;

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
  if (!hulls.length) return null;
  if (hulls.some((h) => h.collider !== POCKET_PARK_HULL_COLLIDER)) return null;

  const { root, track, addCollider, addCyl, setTag } = ctx;
  setTag('pocketPark');

  const placed = [];
  for (let n = 0; n < hulls.length; n++) {
    const hull = hulls[n];
    const cells = tessellateHull(hull, pocketParkPlannedCount(hull.x, hull.z));
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const y = grassPlantDrop(ctx, c.x, c.z);
      if (!y) continue;
      const u = hash01(i + 11 + n * 97, (hull.seed || 1) * 19);
      placed.push({
        x: c.x, y, z: c.z,
        yaw: c.yaw,
        sc: 0.82 + u * 0.20,
        h: POCKET_PARK_H_MIN + u * (POCKET_PARK_H_MAX - POCKET_PARK_H_MIN),
        lean: pocketParkLean(c.x, c.z),
      });
    }
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
    mesh.name = 'pocketPark-blades';
    stampField(mesh, placed);
    root.add(mesh);
  }

  installPocketParkColliders(addCyl, addCollider);
  setTag('world');
  return { group: mesh, count: placed.length, hullCollider: hulls[0].collider };
}
