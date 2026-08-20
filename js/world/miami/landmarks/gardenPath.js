import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CITY_Y,
  GARDEN_PATH_X, GARDEN_PATH_Z,
  PARK_WALK_X, PARK_WALK_Z,
  PARK_WALK_E_X, PARK_WALK_E_Z,
  PARK_WALK_NS_X, PARK_WALK_NS_Z,
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
 * Kiss 84 walk / 276/82.4 / 276/90 / posts / z=94 slabs /
 * leftover lots / pavement / streetOverlap = drop, never nudge.
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
