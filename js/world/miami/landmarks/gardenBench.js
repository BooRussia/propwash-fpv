import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  GARDEN_BENCH_X, GARDEN_BENCH_Z,
  PARK_BENCH_X, PARK_BENCH_Z,
  PARK_BENCH_W_X, PARK_BENCH_W_Z,
  gardenBenchGeom, gardenBenchParts, gardenBenchRejected,
  installGardenBenchColliders, onPavement,
} from '../constants.js';
import { tryPlace } from '../planting.js';
import { cBox } from '../geo.js';

/**
 * gardenBench — Tiny Glade 3-seat slat on the Miami tryPlace graph.
 *
 * Not leftoverLot. Not a haunt. Not leftover-dirt hulls. Not follow-mode
 * restack. Not a garden-path restack. Keepout is published in constants.js
 * before scatter; tryPlace drops palms / blades on this cell. Palms stay
 * off boardwalk / street / path / sidewalk / bench. Sit-box is a void
 * (flyable). Clear under the slats is whoop + 5″ knife. Never a filled
 * sit AABB. Collider ⊆ legs + slats + back only (±0.15 m). Slats 40–50 mm
 * / gaps 10–15 mm so grass can lean at the legs (grass kit still waits —
 * do not add a new grass file).
 *
 * Shared kit, not a second scatterer. Reject-or-drop: pavement,
 * streetOverlap, leftoverLot A/B/C/D reserved, garden-path slab kiss.
 * Never nudge. Signed 276 / 82.4 (Desi + Reesy). Signed 276 / 90
 * park bench reuses gardenBenchGeom / gardenBenchParts — not a
 * gardenBenchBGeom, not a slide of 276 / 82.4. Signed 269.5 / 90
 * west park bench is the same kit — not a gardenBenchCGeom, not a
 * slide of 276 / 90. Yaw faces −Z toward the walk at z=84. 0.8 m
 * ocean of path z0=83.2. 0.8 m is edge-to-walk of the x=272 N-S
 * (east end 270.4). Path stays 268→284 / z=84 / 1.6 m.
 */

const WOOD = 0xb08958;
const WOOD2 = 0x9a7344;
const WOOD3 = 0xc49a68;

function benchHash01(a, b) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2545f491);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

function hexFor(kind, i) {
  const u = benchHash01(i + 3, kind === 'slat' ? 11 : 19);
  if (kind === 'leg') return u < 0.5 ? WOOD2 : WOOD;
  if (kind === 'back') return u < 0.34 ? WOOD : (u < 0.68 ? WOOD2 : WOOD3);
  return u < 0.34 ? WOOD : (u < 0.68 ? WOOD3 : WOOD2);
}

function buildPart(parts, p, hex) {
  parts.push(cBox(p.sx, p.sy, p.sz, hex, p.x, p.y0 + p.sy / 2, p.z));
}

function appendBenchWood(wood, parts) {
  for (let i = 0; i < parts.legs.length; i++) {
    buildPart(wood, parts.legs[i], hexFor('leg', i));
  }
  for (let i = 0; i < parts.slats.length; i++) {
    buildPart(wood, parts.slats[i], hexFor('slat', i));
  }
  for (let i = 0; i < parts.backs.length; i++) {
    buildPart(wood, parts.backs[i], hexFor('back', i));
  }
}

/**
 * Instance the Tiny Glade 3-seat slat on the signed cells. Rejects if the
 * cell is pavement, a street, leftoverLot A/B/C/D reserved, or kisses a
 * garden-path slab. Never remaps x/z. Scatter stays on tryPlace.
 * Park bench is gardenBenchGeom(PARK_BENCH_X, PARK_BENCH_Z) — not a
 * gardenBenchBGeom. West park bench is gardenBenchGeom(PARK_BENCH_W_X,
 * PARK_BENCH_W_Z) — not a gardenBenchCGeom.
 */
export function buildGardenBench(ctx) {
  if (gardenBenchRejected()) return null;
  if (onPavement(GARDEN_BENCH_X, GARDEN_BENCH_Z)) {
    tryPlace(ctx, GARDEN_BENCH_X, GARDEN_BENCH_Z);
    return null;
  }
  const { root, track, addCollider, addCyl, setTag } = ctx;
  setTag('gardenBench');

  const wood = [];
  appendBenchWood(wood, gardenBenchParts());
  const parkGeom = gardenBenchGeom(PARK_BENCH_X, PARK_BENCH_Z);
  if (!gardenBenchRejected(parkGeom.x, parkGeom.z)
      && !onPavement(PARK_BENCH_X, PARK_BENCH_Z)) {
    appendBenchWood(wood, gardenBenchParts(PARK_BENCH_X, PARK_BENCH_Z));
  } else if (onPavement(PARK_BENCH_X, PARK_BENCH_Z)) {
    tryPlace(ctx, PARK_BENCH_X, PARK_BENCH_Z);
  }
  const westGeom = gardenBenchGeom(PARK_BENCH_W_X, PARK_BENCH_W_Z);
  if (!gardenBenchRejected(westGeom.x, westGeom.z)
      && !onPavement(PARK_BENCH_W_X, PARK_BENCH_W_Z)) {
    appendBenchWood(wood, gardenBenchParts(PARK_BENCH_W_X, PARK_BENCH_W_Z));
  } else if (onPavement(PARK_BENCH_W_X, PARK_BENCH_W_Z)) {
    tryPlace(ctx, PARK_BENCH_W_X, PARK_BENCH_W_Z);
  }

  const mergeAdd = (geos, name, extra = {}) => {
    if (!geos.length) return null;
    const geo = track(mergeGeometries(geos));
    geos.forEach((item) => item.dispose());
    const mesh = new THREE.Mesh(geo, track(new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.88, metalness: 0.04, side: THREE.DoubleSide,
      ...extra,
    })));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;
    root.add(mesh);
    return mesh;
  };

  const woodMesh = mergeAdd(wood, 'gardenBench-wood', { roughness: 0.9, metalness: 0.03 });

  installGardenBenchColliders(addCyl, addCollider);
  setTag('world');
  return { group: woodMesh };
}
