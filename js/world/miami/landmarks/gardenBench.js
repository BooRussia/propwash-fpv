import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  GARDEN_BENCH_X, GARDEN_BENCH_Z,
  PARK_BENCH_X, PARK_BENCH_Z,
  PARK_BENCH_W_X, PARK_BENCH_W_Z,
  PARK_BENCH_E_X, PARK_BENCH_E_Z,
  PARK_BENCH_EE_X, PARK_BENCH_EE_Z,
  PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z,
  PARK_BENCH_EE_E_X, PARK_BENCH_EE_E_Z,
  PARK_BENCH_FF_X, PARK_BENCH_FF_Z,
  PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z,
  PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z,
  PARK_BENCH_GG_X, PARK_BENCH_GG_Z,
  PARK_BENCH_GG_W_X, PARK_BENCH_GG_W_Z,
  PARK_BENCH_GG_E_X, PARK_BENCH_GG_E_Z,
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
 * streetOverlap, leftoverLot A–E reserved, warehouse, helipad,
 * garden-path slab kiss. Never nudge. Signed 276 / 82.4 (Desi +
 * Reesy). Signed 276 / 90 park bench reuses gardenBenchGeom /
 * gardenBenchParts — not a gardenBenchBGeom, not a slide of
 * 276 / 82.4. Signed 269.5 / 90 west park bench is the same kit —
 * not a gardenBenchCGeom, not a slide of 276 / 90. Signed 282.5 /
 * 90 east twin is the same kit — not a gardenBenchDGeom, not a
 * slide of 269.5 / 90. +6.5 m mirror of 269.5. Signed 347 / 94.4
 * E-park bench is the same kit — not a gardenBenchEGeom /
 * gardenBenchFGeom / parkBenchEEGeom, not a slide of 282.5 / 90.
 * Signed 340.5 / 94.4 E-park west bench is the same kit — not a
 * gardenBenchEGeom / gardenBenchFGeom / gardenBenchGGeom /
 * parkBenchEEWGeom / parkBenchFGeom, not a slide of 347 / 94.4.
 * −6.5 m off 347. Signed 353.5 / 94.4 E-park east bench is the
 * same kit — not a gardenBenchEGeom / gardenBenchFGeom /
 * gardenBenchGGeom / gardenBenchHGeom / parkBenchEEEGeom /
 * leftoverLotEGeom, not a slide of 347 / 94.4 or 340.5 / 94.4.
 * +6.5 m off 347. Signed 364 / 94.4 F-park bench is the same
 * kit — not a gardenBenchFGeom / parkBenchFFGeom, not a slide
 * of 347 / 94.4. 347 kit +17 m. Signed 357.5 / 94.4 F-park
 * west bench is the same kit — −6.5 m off 364. Signed
 * 370.5 / 94.4 F-park east bench is the same kit — +6.5 m
 * off 364. x1=371.4 stays in 372. Signed 381 / 94.4 G-park
 * bench is the same kit — not a gardenBenchGGeom /
 * parkBenchGGGeom, not a slide of 364 / 94.4. 364 kit +17 m.
 * Signed 374.5 / 94.4 G-park west bench is the same kit —
 * −6.5 m off 381. Signed 387.5 / 94.4 G-park east bench is
 * the same kit — +6.5 m off 381. x1=388.4 stays in 389. Yaw
 * faces −Z toward the walk at z=84 except 347 / 94.4, 340.5 /
 * 94.4, 353.5 / 94.4, 364 / 94.4, 357.5 / 94.4, 370.5 / 94.4,
 * 381 / 94.4, 374.5 / 94.4, and 387.5 / 94.4, which face +Z
 * toward the EE / FF / GG spine at z=96. 0.8 m ocean of path
 * z0=83.2. 0.8 m is edge-to-walk of the x=272 N-S (east end
 * 270.4) and of the x=280 N-S (west end 281.6). 0.8 m at
 * 347 / 94.4, 340.5 / 94.4, 353.5 / 94.4, 364 / 94.4,
 * 357.5 / 94.4, 370.5 / 94.4, 381 / 94.4, 374.5 / 94.4, and
 * 387.5 / 94.4 is center-to-spine of EE / FF / GG z0=95.2.
 * Path stays 268→284 / z=84 / 1.6 m. EE walk stays 339→355 /
 * z=96. West walk stays 339→345.2 / z=98.5. East walk stays
 * 348.8→355 / z=98.5. FF walk stays 356→372 / z=96. GG walk
 * stays 373→389 / z=96.
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
 * cell is pavement, a street, leftoverLot A–F reserved, warehouse,
 * helipad, or kisses a garden-path slab. Never remaps x/z. Scatter
 * stays on tryPlace. Park bench is gardenBenchGeom(PARK_BENCH_X,
 * PARK_BENCH_Z) — not a gardenBenchBGeom. West park bench is
 * gardenBenchGeom(PARK_BENCH_W_X, PARK_BENCH_W_Z) — not a
 * gardenBenchCGeom. East twin is gardenBenchGeom(PARK_BENCH_E_X,
 * PARK_BENCH_E_Z) — not a gardenBenchDGeom. E-park bench is
 * gardenBenchGeom(PARK_BENCH_EE_X, PARK_BENCH_EE_Z) — not a
 * gardenBenchEGeom / gardenBenchFGeom / parkBenchEEGeom.
 * E-park west bench is gardenBenchGeom(PARK_BENCH_EE_W_X,
 * PARK_BENCH_EE_W_Z) — not a gardenBenchEGeom / gardenBenchFGeom /
 * gardenBenchGGeom / parkBenchEEWGeom / parkBenchFGeom.
 * E-park east bench is gardenBenchGeom(PARK_BENCH_EE_E_X,
 * PARK_BENCH_EE_E_Z) — not a gardenBenchEGeom / gardenBenchFGeom /
 * gardenBenchGGeom / gardenBenchHGeom / parkBenchEEEGeom /
 * leftoverLotEGeom. F-park bench is
 * gardenBenchGeom(PARK_BENCH_FF_X, PARK_BENCH_FF_Z) — not a
 * gardenBenchFGeom / parkBenchFFGeom. F-park west bench is
 * gardenBenchGeom(PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z).
 * F-park east bench is gardenBenchGeom(PARK_BENCH_FF_E_X,
 * PARK_BENCH_FF_E_Z). G-park bench is
 * gardenBenchGeom(PARK_BENCH_GG_X, PARK_BENCH_GG_Z) — not a
 * gardenBenchGGeom / parkBenchGGGeom. G-park west bench is
 * gardenBenchGeom(PARK_BENCH_GG_W_X, PARK_BENCH_GG_W_Z).
 * G-park east bench is gardenBenchGeom(PARK_BENCH_GG_E_X,
 * PARK_BENCH_GG_E_Z).
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
  const eastGeom = gardenBenchGeom(PARK_BENCH_E_X, PARK_BENCH_E_Z);
  if (!gardenBenchRejected(eastGeom.x, eastGeom.z)
      && !onPavement(PARK_BENCH_E_X, PARK_BENCH_E_Z)) {
    appendBenchWood(wood, gardenBenchParts(PARK_BENCH_E_X, PARK_BENCH_E_Z));
  } else if (onPavement(PARK_BENCH_E_X, PARK_BENCH_E_Z)) {
    tryPlace(ctx, PARK_BENCH_E_X, PARK_BENCH_E_Z);
  }
  const eeGeom = gardenBenchGeom(PARK_BENCH_EE_X, PARK_BENCH_EE_Z);
  if (!gardenBenchRejected(eeGeom.x, eeGeom.z)
      && !onPavement(PARK_BENCH_EE_X, PARK_BENCH_EE_Z)) {
    appendBenchWood(wood, gardenBenchParts(PARK_BENCH_EE_X, PARK_BENCH_EE_Z));
  } else if (onPavement(PARK_BENCH_EE_X, PARK_BENCH_EE_Z)) {
    tryPlace(ctx, PARK_BENCH_EE_X, PARK_BENCH_EE_Z);
  }
  const eeWGeom = gardenBenchGeom(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z);
  if (!gardenBenchRejected(eeWGeom.x, eeWGeom.z)
      && !onPavement(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z)) {
    appendBenchWood(wood, gardenBenchParts(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z));
  } else if (onPavement(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z)) {
    tryPlace(ctx, PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z);
  }
  const eeEGeom = gardenBenchGeom(PARK_BENCH_EE_E_X, PARK_BENCH_EE_E_Z);
  if (!gardenBenchRejected(eeEGeom.x, eeEGeom.z)
      && !onPavement(PARK_BENCH_EE_E_X, PARK_BENCH_EE_E_Z)) {
    appendBenchWood(wood, gardenBenchParts(PARK_BENCH_EE_E_X, PARK_BENCH_EE_E_Z));
  } else if (onPavement(PARK_BENCH_EE_E_X, PARK_BENCH_EE_E_Z)) {
    tryPlace(ctx, PARK_BENCH_EE_E_X, PARK_BENCH_EE_E_Z);
  }
  const ffGeom = gardenBenchGeom(PARK_BENCH_FF_X, PARK_BENCH_FF_Z);
  if (!gardenBenchRejected(ffGeom.x, ffGeom.z)
      && !onPavement(PARK_BENCH_FF_X, PARK_BENCH_FF_Z)) {
    appendBenchWood(wood, gardenBenchParts(PARK_BENCH_FF_X, PARK_BENCH_FF_Z));
  } else if (onPavement(PARK_BENCH_FF_X, PARK_BENCH_FF_Z)) {
    tryPlace(ctx, PARK_BENCH_FF_X, PARK_BENCH_FF_Z);
  }
  const ffWGeom = gardenBenchGeom(PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z);
  if (!gardenBenchRejected(ffWGeom.x, ffWGeom.z)
      && !onPavement(PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z)) {
    appendBenchWood(wood, gardenBenchParts(PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z));
  } else if (onPavement(PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z)) {
    tryPlace(ctx, PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z);
  }
  const ffEGeom = gardenBenchGeom(PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z);
  if (!gardenBenchRejected(ffEGeom.x, ffEGeom.z)
      && !onPavement(PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z)) {
    appendBenchWood(wood, gardenBenchParts(PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z));
  } else if (onPavement(PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z)) {
    tryPlace(ctx, PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z);
  }
  const ggGeom = gardenBenchGeom(PARK_BENCH_GG_X, PARK_BENCH_GG_Z);
  if (!gardenBenchRejected(ggGeom.x, ggGeom.z)
      && !onPavement(PARK_BENCH_GG_X, PARK_BENCH_GG_Z)) {
    appendBenchWood(wood, gardenBenchParts(PARK_BENCH_GG_X, PARK_BENCH_GG_Z));
  } else if (onPavement(PARK_BENCH_GG_X, PARK_BENCH_GG_Z)) {
    tryPlace(ctx, PARK_BENCH_GG_X, PARK_BENCH_GG_Z);
  }
  const ggWGeom = gardenBenchGeom(PARK_BENCH_GG_W_X, PARK_BENCH_GG_W_Z);
  if (!gardenBenchRejected(ggWGeom.x, ggWGeom.z)
      && !onPavement(PARK_BENCH_GG_W_X, PARK_BENCH_GG_W_Z)) {
    appendBenchWood(wood, gardenBenchParts(PARK_BENCH_GG_W_X, PARK_BENCH_GG_W_Z));
  } else if (onPavement(PARK_BENCH_GG_W_X, PARK_BENCH_GG_W_Z)) {
    tryPlace(ctx, PARK_BENCH_GG_W_X, PARK_BENCH_GG_W_Z);
  }
  const ggEGeom = gardenBenchGeom(PARK_BENCH_GG_E_X, PARK_BENCH_GG_E_Z);
  if (!gardenBenchRejected(ggEGeom.x, ggEGeom.z)
      && !onPavement(PARK_BENCH_GG_E_X, PARK_BENCH_GG_E_Z)) {
    appendBenchWood(wood, gardenBenchParts(PARK_BENCH_GG_E_X, PARK_BENCH_GG_E_Z));
  } else if (onPavement(PARK_BENCH_GG_E_X, PARK_BENCH_GG_E_Z)) {
    tryPlace(ctx, PARK_BENCH_GG_E_X, PARK_BENCH_GG_E_Z);
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
