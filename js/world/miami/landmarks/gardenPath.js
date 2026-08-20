import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CITY_Y,
  GARDEN_PATH_X, GARDEN_PATH_Z,
  PARK_WALK_X, PARK_WALK_Z,
  PARK_WALK_E_X, PARK_WALK_E_Z,
  PARK_WALK_NS_X, PARK_WALK_NS_Z,
  PARK_WALK_NS_E_X, PARK_WALK_NS_E_Z,
  PARK_WALK_EE_X, PARK_WALK_EE_Z,
  PARK_WALK_EE_W_X, PARK_WALK_EE_W_Z,
  PARK_WALK_EE_E_X, PARK_WALK_EE_E_Z,
  PARK_WALK_FF_X, PARK_WALK_FF_Z,
  PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z,
  PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z,
  PARK_WALK_GG_X, PARK_WALK_GG_Z,
  PARK_WALK_GG_W_X, PARK_WALK_GG_W_Z,
  PARK_WALK_GG_E_X, PARK_WALK_GG_E_Z,
  PARK_WALK_HH_X, PARK_WALK_HH_Z,
  GARDEN_PATH_SLAB_H, GARDEN_PATH_HULL_COLLIDER,
  gardenPathGeom, gardenPathGrassHull, gardenPathSlabs, gardenPathPlantSpots,
  gardenPathRejected, inGardenPathSlab, inLeftoverLotReserved,
  installGardenPathColliders, onPavement, streetOverlap, groundHeight,
} from '../constants.js';
import { tryPlace } from '../planting.js';
import { cBox } from '../geo.js';

/**
 * gardenPath — Tiny Glade two-abreast flagstone walk on the Miami tryPlace
 * graph.
 *
 * Not leftoverLot. Not a haunt. Not leftover-dirt hulls. Not follow-mode
 * restack. No seating. Keepout is published in constants.js before scatter;
 * tryPlace drops palms / blades on this cell. Palms stay off boardwalk /
 * street / path / sidewalk. Grow-to-gap grass lives in the joints on one
 * grass hull at grade (Sylva methods: tessellated hull, one ground collider
 * — not per-blade colliders). Flagstones 0.5–0.7 m + 60–100 mm joints so
 * they read at 8–25 m. No 300 mm tiles. Collider ⊆ each slab (±0.15 m).
 * Joints + grow-to-gap are voids (flyable). Never a filled path AABB.
 *
 * Shared kit + local jitter on slab size / joint, not a second scatterer.
 * Reject-or-drop: pavement, streetOverlap, leftoverLot A/B/C reserved.
 * Never nudge. Signed 268→284 / z=84 / width 1.6 m (Desi + Reesy).
 * Signed 268→274.2 / z=94 park walk reuses gardenPathGeom /
 * gardenPathSlabs — not a gardenPathBGeom, not a parkWalkGeom, not a
 * slide of 268→284 / z=84. Ends 1.8 m west of 276. Do not extend into
 * the sash. Signed 277.8→284 / z=94 east twin reuses the same kit —
 * not a parkWalkEGeom, not a slide of 268→274.2. Starts 1.8 m east of
 * 276. Last slab stays inside 284. Signed 272 / 85.2→92.8 N-S
 * connector reuses the same kit — not a parkWalkNSGeom, not a slide
 * of 268→274.2. 0.4 m off the 84 walk and 0.4 m off the west walk.
 * Those gaps are grow-to-gap. T's the west walk in x (272 sits in
 * 268→274.2). Misses 276/90 (~2.3 m) and the posts on x=276.
 * Signed 280 / 85.2→92.8 east N-S twin reuses the same kit — not a
 * parkWalkNSEGeom, not a slide of 272. 0.4 m off the 84 walk and
 * 0.4 m off the east walk. T's the east walk in x (280 sits in
 * 277.8→284), not 272. Misses 276/90 (~2.3 m) and the posts on
 * x=276. Signed 339→355 / z=96 E-park spine reuses the same kit —
 * not a parkWalkEEGeom, not a parkWalkE2Geom, not a gardenPathFGeom,
 * not a slide of 268→284 or of 277.8→284. Last slab stays inside
 * 355. 6 m inland of leftoverLot E (E z1=90). Walk eats ~26 m²;
 * leftover on the 347/96 hull is ~10k. Do not backfill to 12800.
 * Signed 339→345.2 / z=98.5 E-park west walk reuses the same kit —
 * not a parkWalkEEWGeom, not a gardenPathGGeom, not a parkWalkFGeom,
 * not a slide of 268→274.2 or of 339→355 / z=96. Ends 1.8 m west
 * of 347. Last slab stays inside 345.2. Never into the sash.
 * 345.85 is 347−1.16, the Z number reused as X, not post x0.
 * Spine z1=96.8 is 0.9 m south of walk z0=97.7 (grow-to-gap).
 * Signed 348.8→355 / z=98.5 E-park east walk reuses the same kit —
 * not a parkWalkEEEGeom, not a gardenPathHGeom, not a parkWalkGGeom,
 * not a slide of 277.8→284 or of 339→345.2. Starts 1.8 m east of
 * 347. Last slab stays inside 355. Never into the sash. 348.15 is
 * post x1, not walk x0. Walk eats ~10 m²; E leftover is 8000–11000
 * (Reesy signed). Do not backfill to 12800. Kiss leftoverLot E /
 * helipad / warehouse / 276 park / 276 walks / 276/82.4 / 276/90 /
 * 347/94.4 / 347/98.5 posts / EE spine / 339→345.2 west walk /
 * leftover lots / pavement / streetOverlap = drop, never nudge.
 * Signed 356→372 / z=96 F-park spine reuses the same kit —
 * not a parkWalkFFGeom, not a gardenPathFGeom, not a parkWalkFGeom,
 * not a slide of 339→355 / z=96. Last slab stays inside 372.
 * Does not merge with PARK_WALK_EE_X1=355 (1 m west gap, same z).
 * Lives on the F-park hull (356–372 × 92–100) by design.
 * leftoverLot F reserved z1+1.4=91.4 vs walk z0=95.2 —
 * leftoverLotOverlap is 0. Walk eats ~26 m². Signed
 * 356→362.2 / z=98.5 F-park west walk reuses the same kit —
 * not a parkWalkFFWGeom, not a gardenPathFGeom, not a slide
 * of 339→345.2 or of 356→372 / z=96. Ends 1.8 m west of 364.
 * Last slab stays inside 362.2. Never into the sash. Signed
 * 365.8→372 / z=98.5 F-park east walk reuses the same kit —
 * not a parkWalkFFEGeom, not a gardenPathFGeom, not a slide
 * of 348.8→355 or of 356→362.2. Starts 1.8 m east of 364.
 * Last slab stays inside 372. Never into the sash. Three
 * walks eat ~45 m²; leftover ~8.2k. F leftover after this
 * file is 8000–11000. 11k is a ceiling. Do not backfill.
 * Do not merge E-park 355. E leftover stays 8000–11000.
 * Kiss leftoverLot F / leftoverLot A–F reserved / E-park
 * hull merge / helipad / warehouse / 276 park / EE spine /
 * 347 = drop, never nudge. Signed 373→389 / z=96 G-park
 * spine reuses the same kit — not a parkWalkGGGeom, not a
 * gardenPathGGeom, not a leftoverLotDirtGeom, not a slide
 * of 356→372 / z=96. Last slab stays
 * inside 389. Starts 1 m east of F-park 372. Does not merge
 * with PARK_WALK_FF_X1=372 (1 m west gap, same z). Lives on
 * the G-park hull (373–389 × 92–100) by design. leftoverLot G
 * reserved z1+1.4=91.4 vs walk z0=95.2 — leftoverLotOverlap
 * is 0. Walk eats ~26 m². Signed 373→379.2 / z=98.5 G-park
 * west walk reuses the same kit — not a parkWalkGGWGeom, not a
 * gardenPathGGeom, not leftoverLotDirtGeom, not a slide of
 * 356→362.2 or of 373→389 / z=96. Ends 1.8 m west of 381.
 * Last slab stays inside 379.2. Never into the sash. Signed
 * 382.8→389 / z=98.5 G-park east walk reuses the same kit —
 * not a parkWalkGGEGeom, not a gardenPathGGeom, not a slide
 * of 365.8→372 or of 373→379.2. Starts 1.8 m east of 381.
 * Last slab stays inside 389. Never into the sash. Three
 * walks eat ~45 m²; leftover ~8.2k. G leftover after this
 * file is 8000–11000. 11k is a ceiling. Do not backfill.
 * Do not merge F-park 372. F leftover stays 8000–11000.
 * Kiss leftoverLot G / leftoverLot A–G reserved / F-park
 * hull merge / helipad / warehouse / 276 park / FF spine /
 * 364 = drop, never nudge. Signed 390→406 / z=96 H-park
 * spine reuses the same kit — not a parkWalkHHGeom, not a
 * gardenPathHGeom, not leftoverLotDirtGeom, not a 4.2 m slab,
 * not a slide of 373→389 / z=96. Last slab stays inside 406.
 * Starts 1 m east of G-park 389. Does not merge with
 * PARK_WALK_GG_X1=389 (1 m west gap, same z). Lives on the
 * H-park hull (390–406 × 92–100) by design. leftoverLot H
 * reserved z1+1.4=91.4 vs walk z0=95.2 — leftoverLotOverlap
 * is 0. Walk eats ~26 m². Honest leftover on the H hull
 * after this spine is ~10k. POCKET_PARK_H_INSTANCES_MIN/MAX
 * stay 10000/13000. 13k is a ceiling. Do not backfill. Do
 * not drop H leftover to 8–11k on this file (that wait is
 * the later kit). No kit on this merge. Do not merge G-park
 * 389. G leftover stays 8000–11000. F leftover stays
 * 8000–11000. E leftover stays 8000–11000. 276 stays 8–11k.
 * Kiss leftoverLot H / leftoverLot A–H reserved / G-park
 * hull merge / helipad / warehouse / 276 park / GG spine /
 * 381 = drop, never nudge.
 */

const STONE = 0xb4a890;
const STONE2 = 0xa09078;
const STONE3 = 0xc4b49c;
const GRASS = 0x4e663c;
const GRASS2 = 0x5a6e42;
const WEED = 0x4a6238;

function pathHash01(a, b) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2545f491);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

function pathPlantDrop(ctx, x, z) {
  // tryPlace-drop off pavement, leftover lots, and the flagstone slabs.
  // Reject-or-drop, never nudge. Joints keep grow-to-gap grass.
  if (inLeftoverLotReserved(x, z)) return 0;
  if (inGardenPathSlab(x, z)) return 0;
  if (streetOverlap(x, z, 0.2, 0.2)) return 0;
  if (onPavement(x, z)) return tryPlace(ctx, x, z);
  return groundHeight(x, z);
}

function buildGrassHull(parts, hull) {
  // One grass hull at grade. Collider is the ground, not this plate.
  const w = hull.x1 - hull.x0;
  const d = hull.z1 - hull.z0;
  const x = (hull.x0 + hull.x1) / 2;
  const z = (hull.z0 + hull.z1) / 2;
  parts.push(cBox(w, 0.014, d, GRASS, x, CITY_Y + 0.007, z));
}

function buildSlabs(parts, g) {
  const slabs = gardenPathSlabs(g);
  const y = CITY_Y + 0.012 + GARDEN_PATH_SLAB_H / 2;
  for (let i = 0; i < slabs.length; i++) {
    const s = slabs[i];
    const u = pathHash01(s.col + 3, s.row + 11);
    const hex = u < 0.34 ? STONE : (u < 0.68 ? STONE2 : STONE3);
    parts.push(cBox(s.sx, GARDEN_PATH_SLAB_H, s.sz, hex, s.x, y, s.z));
  }
}

function buildWeeds(parts, spots) {
  const y0 = CITY_Y;
  for (let i = 0; i < spots.length; i++) {
    const s = spots[i];
    const h = 0.10 + s.sc * 0.10;
    parts.push(cBox(0.05, h, 0.04, WEED,
      s.x, y0 + h / 2, s.z, 0, 0, s.lean));
    parts.push(cBox(0.04, h * 0.78, 0.03, GRASS2,
      s.x + 0.03, y0 + h * 0.38, s.z + 0.02, 0, 0.5, -s.lean * 0.5));
  }
}

/**
 * Instance the Tiny Glade flagstone kit on the signed walks. Rejects if the
 * cell is pavement, a street, or leftoverLot A/B/C reserved. Never remaps
 * x/z. Scatter stays on tryPlace. Park walk is
 * gardenPathGeom(PARK_WALK_X, PARK_WALK_Z) — not a gardenPathBGeom.
 * East twin is gardenPathGeom(PARK_WALK_E_X, PARK_WALK_E_Z).
 * N-S connector is gardenPathGeom(PARK_WALK_NS_X, PARK_WALK_NS_Z).
 * East N-S twin is gardenPathGeom(PARK_WALK_NS_E_X, PARK_WALK_NS_E_Z).
 * E-park spine is gardenPathGeom(PARK_WALK_EE_X, PARK_WALK_EE_Z).
 * E-park west walk is gardenPathGeom(PARK_WALK_EE_W_X, PARK_WALK_EE_W_Z).
 * E-park east walk is gardenPathGeom(PARK_WALK_EE_E_X, PARK_WALK_EE_E_Z).
 * F-park spine is gardenPathGeom(PARK_WALK_FF_X, PARK_WALK_FF_Z).
 * F-park west walk is gardenPathGeom(PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z).
 * F-park east walk is gardenPathGeom(PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z).
 * G-park spine is gardenPathGeom(PARK_WALK_GG_X, PARK_WALK_GG_Z).
 * G-park west walk is gardenPathGeom(PARK_WALK_GG_W_X, PARK_WALK_GG_W_Z).
 * G-park east walk is gardenPathGeom(PARK_WALK_GG_E_X, PARK_WALK_GG_E_Z).
 * H-park spine is gardenPathGeom(PARK_WALK_HH_X, PARK_WALK_HH_Z).
 */
export function buildGardenPath(ctx) {
  if (gardenPathRejected()) return null;
  if (onPavement(GARDEN_PATH_X, GARDEN_PATH_Z)) return null;
  const { root, track, addCollider, addCyl, setTag } = ctx;
  setTag('gardenPath');

  const grass = [];
  const stone = [];
  const weeds = [];
  const hull = gardenPathGrassHull();
  if (hull.collider !== GARDEN_PATH_HULL_COLLIDER) return null;
  buildGrassHull(grass, hull);
  buildSlabs(stone);

  const plants = gardenPathPlantSpots();
  const kept = [];
  for (let i = 0; i < plants.weeds.length; i++) {
    const p = plants.weeds[i];
    if (!pathPlantDrop(ctx, p.x, p.z)) continue;
    kept.push(p);
  }

  const parkGeom = gardenPathGeom(PARK_WALK_X, PARK_WALK_Z);
  if (!gardenPathRejected(PARK_WALK_X, PARK_WALK_Z)
      && !onPavement(PARK_WALK_X, PARK_WALK_Z)) {
    const parkHull = gardenPathGrassHull(parkGeom);
    if (parkHull.collider === GARDEN_PATH_HULL_COLLIDER) {
      buildGrassHull(grass, parkHull);
      buildSlabs(stone, parkGeom);
      const parkPlants = gardenPathPlantSpots(parkGeom);
      for (let i = 0; i < parkPlants.weeds.length; i++) {
        const p = parkPlants.weeds[i];
        if (!pathPlantDrop(ctx, p.x, p.z)) continue;
        kept.push(p);
      }
    }
  } else if (onPavement(PARK_WALK_X, PARK_WALK_Z)) {
    tryPlace(ctx, PARK_WALK_X, PARK_WALK_Z);
  }

  const eastGeom = gardenPathGeom(PARK_WALK_E_X, PARK_WALK_E_Z);
  if (!gardenPathRejected(PARK_WALK_E_X, PARK_WALK_E_Z)
      && !onPavement(PARK_WALK_E_X, PARK_WALK_E_Z)) {
    const eastHull = gardenPathGrassHull(eastGeom);
    if (eastHull.collider === GARDEN_PATH_HULL_COLLIDER) {
      buildGrassHull(grass, eastHull);
      buildSlabs(stone, eastGeom);
      const eastPlants = gardenPathPlantSpots(eastGeom);
      for (let i = 0; i < eastPlants.weeds.length; i++) {
        const p = eastPlants.weeds[i];
        if (!pathPlantDrop(ctx, p.x, p.z)) continue;
        kept.push(p);
      }
    }
  } else if (onPavement(PARK_WALK_E_X, PARK_WALK_E_Z)) {
    tryPlace(ctx, PARK_WALK_E_X, PARK_WALK_E_Z);
  }

  const nsGeom = gardenPathGeom(PARK_WALK_NS_X, PARK_WALK_NS_Z);
  if (!gardenPathRejected(PARK_WALK_NS_X, PARK_WALK_NS_Z)
      && !onPavement(PARK_WALK_NS_X, PARK_WALK_NS_Z)) {
    const nsHull = gardenPathGrassHull(nsGeom);
    if (nsHull.collider === GARDEN_PATH_HULL_COLLIDER) {
      buildGrassHull(grass, nsHull);
      buildSlabs(stone, nsGeom);
      const nsPlants = gardenPathPlantSpots(nsGeom);
      for (let i = 0; i < nsPlants.weeds.length; i++) {
        const p = nsPlants.weeds[i];
        if (!pathPlantDrop(ctx, p.x, p.z)) continue;
        kept.push(p);
      }
    }
  } else if (onPavement(PARK_WALK_NS_X, PARK_WALK_NS_Z)) {
    tryPlace(ctx, PARK_WALK_NS_X, PARK_WALK_NS_Z);
  }

  const nsEGeom = gardenPathGeom(PARK_WALK_NS_E_X, PARK_WALK_NS_E_Z);
  if (!gardenPathRejected(PARK_WALK_NS_E_X, PARK_WALK_NS_E_Z)
      && !onPavement(PARK_WALK_NS_E_X, PARK_WALK_NS_E_Z)) {
    const nsEHull = gardenPathGrassHull(nsEGeom);
    if (nsEHull.collider === GARDEN_PATH_HULL_COLLIDER) {
      buildGrassHull(grass, nsEHull);
      buildSlabs(stone, nsEGeom);
      const nsEPlants = gardenPathPlantSpots(nsEGeom);
      for (let i = 0; i < nsEPlants.weeds.length; i++) {
        const p = nsEPlants.weeds[i];
        if (!pathPlantDrop(ctx, p.x, p.z)) continue;
        kept.push(p);
      }
    }
  } else if (onPavement(PARK_WALK_NS_E_X, PARK_WALK_NS_E_Z)) {
    tryPlace(ctx, PARK_WALK_NS_E_X, PARK_WALK_NS_E_Z);
  }

  const eeGeom = gardenPathGeom(PARK_WALK_EE_X, PARK_WALK_EE_Z);
  if (!gardenPathRejected(PARK_WALK_EE_X, PARK_WALK_EE_Z)
      && !onPavement(PARK_WALK_EE_X, PARK_WALK_EE_Z)) {
    const eeHull = gardenPathGrassHull(eeGeom);
    if (eeHull.collider === GARDEN_PATH_HULL_COLLIDER) {
      buildGrassHull(grass, eeHull);
      buildSlabs(stone, eeGeom);
      const eePlants = gardenPathPlantSpots(eeGeom);
      for (let i = 0; i < eePlants.weeds.length; i++) {
        const p = eePlants.weeds[i];
        if (!pathPlantDrop(ctx, p.x, p.z)) continue;
        kept.push(p);
      }
    }
  } else if (onPavement(PARK_WALK_EE_X, PARK_WALK_EE_Z)) {
    tryPlace(ctx, PARK_WALK_EE_X, PARK_WALK_EE_Z);
  }

  const eeWGeom = gardenPathGeom(PARK_WALK_EE_W_X, PARK_WALK_EE_W_Z);
  if (!gardenPathRejected(PARK_WALK_EE_W_X, PARK_WALK_EE_W_Z)
      && !onPavement(PARK_WALK_EE_W_X, PARK_WALK_EE_W_Z)) {
    const eeWHull = gardenPathGrassHull(eeWGeom);
    if (eeWHull.collider === GARDEN_PATH_HULL_COLLIDER) {
      buildGrassHull(grass, eeWHull);
      buildSlabs(stone, eeWGeom);
      const eeWPlants = gardenPathPlantSpots(eeWGeom);
      for (let i = 0; i < eeWPlants.weeds.length; i++) {
        const p = eeWPlants.weeds[i];
        if (!pathPlantDrop(ctx, p.x, p.z)) continue;
        kept.push(p);
      }
    }
  } else if (onPavement(PARK_WALK_EE_W_X, PARK_WALK_EE_W_Z)) {
    tryPlace(ctx, PARK_WALK_EE_W_X, PARK_WALK_EE_W_Z);
  }

  const eeEGeom = gardenPathGeom(PARK_WALK_EE_E_X, PARK_WALK_EE_E_Z);
  if (!gardenPathRejected(PARK_WALK_EE_E_X, PARK_WALK_EE_E_Z)
      && !onPavement(PARK_WALK_EE_E_X, PARK_WALK_EE_E_Z)) {
    const eeEHull = gardenPathGrassHull(eeEGeom);
    if (eeEHull.collider === GARDEN_PATH_HULL_COLLIDER) {
      buildGrassHull(grass, eeEHull);
      buildSlabs(stone, eeEGeom);
      const eeEPlants = gardenPathPlantSpots(eeEGeom);
      for (let i = 0; i < eeEPlants.weeds.length; i++) {
        const p = eeEPlants.weeds[i];
        if (!pathPlantDrop(ctx, p.x, p.z)) continue;
        kept.push(p);
      }
    }
  } else if (onPavement(PARK_WALK_EE_E_X, PARK_WALK_EE_E_Z)) {
    tryPlace(ctx, PARK_WALK_EE_E_X, PARK_WALK_EE_E_Z);
  }

  const ffGeom = gardenPathGeom(PARK_WALK_FF_X, PARK_WALK_FF_Z);
  if (!gardenPathRejected(PARK_WALK_FF_X, PARK_WALK_FF_Z)
      && !onPavement(PARK_WALK_FF_X, PARK_WALK_FF_Z)) {
    const ffHull = gardenPathGrassHull(ffGeom);
    if (ffHull.collider === GARDEN_PATH_HULL_COLLIDER) {
      buildGrassHull(grass, ffHull);
      buildSlabs(stone, ffGeom);
      const ffPlants = gardenPathPlantSpots(ffGeom);
      for (let i = 0; i < ffPlants.weeds.length; i++) {
        const p = ffPlants.weeds[i];
        if (!pathPlantDrop(ctx, p.x, p.z)) continue;
        kept.push(p);
      }
    }
  } else if (onPavement(PARK_WALK_FF_X, PARK_WALK_FF_Z)) {
    tryPlace(ctx, PARK_WALK_FF_X, PARK_WALK_FF_Z);
  }

  const ffWGeom = gardenPathGeom(PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z);
  if (!gardenPathRejected(PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z)
      && !onPavement(PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z)) {
    const ffWHull = gardenPathGrassHull(ffWGeom);
    if (ffWHull.collider === GARDEN_PATH_HULL_COLLIDER) {
      buildGrassHull(grass, ffWHull);
      buildSlabs(stone, ffWGeom);
      const ffWPlants = gardenPathPlantSpots(ffWGeom);
      for (let i = 0; i < ffWPlants.weeds.length; i++) {
        const p = ffWPlants.weeds[i];
        if (!pathPlantDrop(ctx, p.x, p.z)) continue;
        kept.push(p);
      }
    }
  } else if (onPavement(PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z)) {
    tryPlace(ctx, PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z);
  }

  const ffEGeom = gardenPathGeom(PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z);
  if (!gardenPathRejected(PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z)
      && !onPavement(PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z)) {
    const ffEHull = gardenPathGrassHull(ffEGeom);
    if (ffEHull.collider === GARDEN_PATH_HULL_COLLIDER) {
      buildGrassHull(grass, ffEHull);
      buildSlabs(stone, ffEGeom);
      const ffEPlants = gardenPathPlantSpots(ffEGeom);
      for (let i = 0; i < ffEPlants.weeds.length; i++) {
        const p = ffEPlants.weeds[i];
        if (!pathPlantDrop(ctx, p.x, p.z)) continue;
        kept.push(p);
      }
    }
  } else if (onPavement(PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z)) {
    tryPlace(ctx, PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z);
  }

  const ggGeom = gardenPathGeom(PARK_WALK_GG_X, PARK_WALK_GG_Z);
  if (!gardenPathRejected(PARK_WALK_GG_X, PARK_WALK_GG_Z)
      && !onPavement(PARK_WALK_GG_X, PARK_WALK_GG_Z)) {
    const ggHull = gardenPathGrassHull(ggGeom);
    if (ggHull.collider === GARDEN_PATH_HULL_COLLIDER) {
      buildGrassHull(grass, ggHull);
      buildSlabs(stone, ggGeom);
      const ggPlants = gardenPathPlantSpots(ggGeom);
      for (let i = 0; i < ggPlants.weeds.length; i++) {
        const p = ggPlants.weeds[i];
        if (!pathPlantDrop(ctx, p.x, p.z)) continue;
        kept.push(p);
      }
    }
  } else if (onPavement(PARK_WALK_GG_X, PARK_WALK_GG_Z)) {
    tryPlace(ctx, PARK_WALK_GG_X, PARK_WALK_GG_Z);
  }

  const ggWGeom = gardenPathGeom(PARK_WALK_GG_W_X, PARK_WALK_GG_W_Z);
  if (!gardenPathRejected(PARK_WALK_GG_W_X, PARK_WALK_GG_W_Z)
      && !onPavement(PARK_WALK_GG_W_X, PARK_WALK_GG_W_Z)) {
    const ggWHull = gardenPathGrassHull(ggWGeom);
    if (ggWHull.collider === GARDEN_PATH_HULL_COLLIDER) {
      buildGrassHull(grass, ggWHull);
      buildSlabs(stone, ggWGeom);
      const ggWPlants = gardenPathPlantSpots(ggWGeom);
      for (let i = 0; i < ggWPlants.weeds.length; i++) {
        const p = ggWPlants.weeds[i];
        if (!pathPlantDrop(ctx, p.x, p.z)) continue;
        kept.push(p);
      }
    }
  } else if (onPavement(PARK_WALK_GG_W_X, PARK_WALK_GG_W_Z)) {
    tryPlace(ctx, PARK_WALK_GG_W_X, PARK_WALK_GG_W_Z);
  }

  const ggEGeom = gardenPathGeom(PARK_WALK_GG_E_X, PARK_WALK_GG_E_Z);
  if (!gardenPathRejected(PARK_WALK_GG_E_X, PARK_WALK_GG_E_Z)
      && !onPavement(PARK_WALK_GG_E_X, PARK_WALK_GG_E_Z)) {
    const ggEHull = gardenPathGrassHull(ggEGeom);
    if (ggEHull.collider === GARDEN_PATH_HULL_COLLIDER) {
      buildGrassHull(grass, ggEHull);
      buildSlabs(stone, ggEGeom);
      const ggEPlants = gardenPathPlantSpots(ggEGeom);
      for (let i = 0; i < ggEPlants.weeds.length; i++) {
        const p = ggEPlants.weeds[i];
        if (!pathPlantDrop(ctx, p.x, p.z)) continue;
        kept.push(p);
      }
    }
  } else if (onPavement(PARK_WALK_GG_E_X, PARK_WALK_GG_E_Z)) {
    tryPlace(ctx, PARK_WALK_GG_E_X, PARK_WALK_GG_E_Z);
  }

  const hhGeom = gardenPathGeom(PARK_WALK_HH_X, PARK_WALK_HH_Z);
  if (!gardenPathRejected(PARK_WALK_HH_X, PARK_WALK_HH_Z)
      && !onPavement(PARK_WALK_HH_X, PARK_WALK_HH_Z)) {
    const hhHull = gardenPathGrassHull(hhGeom);
    if (hhHull.collider === GARDEN_PATH_HULL_COLLIDER) {
      buildGrassHull(grass, hhHull);
      buildSlabs(stone, hhGeom);
      const hhPlants = gardenPathPlantSpots(hhGeom);
      for (let i = 0; i < hhPlants.weeds.length; i++) {
        const p = hhPlants.weeds[i];
        if (!pathPlantDrop(ctx, p.x, p.z)) continue;
        kept.push(p);
      }
    }
  } else if (onPavement(PARK_WALK_HH_X, PARK_WALK_HH_Z)) {
    tryPlace(ctx, PARK_WALK_HH_X, PARK_WALK_HH_Z);
  }
  buildWeeds(weeds, kept);

  const mergeAdd = (geos, name, extra = {}) => {
    if (!geos.length) return null;
    const geo = track(mergeGeometries(geos));
    geos.forEach((item) => item.dispose());
    const mesh = new THREE.Mesh(geo, track(new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.94, metalness: 0.02, side: THREE.DoubleSide,
      ...extra,
    })));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;
    root.add(mesh);
    return mesh;
  };

  const grassMesh = mergeAdd(grass, 'gardenPath-grass', { roughness: 1, metalness: 0 });
  if (grassMesh) grassMesh.castShadow = false;
  const stoneMesh = mergeAdd(stone, 'gardenPath-slabs', { roughness: 0.92, metalness: 0 });
  mergeAdd(weeds, 'gardenPath-weeds', { roughness: 1, metalness: 0 });

  installGardenPathColliders(addCyl, addCollider);
  setTag('world');
  return { group: stoneMesh };
}
