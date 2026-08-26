import { CITY_Y, PIER_X, GAP_X, CROSS_X, groundHeight, inKeepout } from './constants.js';
import { hash01 } from './rng.js';
import { scatterModels } from '../vegetation.js';

// CC0 GLBs/glTFs (assets/models/<slug>/<slug>.glb|.gltf).
// Positions are hash-driven so rng/rng2/rng3/rng4 streams stay untouched.
// Kenney City Kit meshes are authored 6-sided (atlas colormap), not a window
// photo wrapped onto a box. Dumpster lids are separate meshes on that atlas.

async function scatterSafe(ctx, slug, placements, name) {
  if (!placements.length) return;
  try {
    const h = await scatterModels(ctx.root, slug, placements, null, 0);
    if (h) {
      if (h.group) h.group.name = name || `kenney-${slug}`;
      ctx.scatterHandles.push(h);
    }
  } catch (e) {
    console.warn(`[miami] kenney scatter '${slug}' skipped:`, e);
  }
}

function sidewalkX(i, n) {
  return -560 + ((i + 0.5) / n) * 1120;
}

/**
 * Extra CC0 street/beach props + a far authored-skyline row.
 * Call AFTER colliders exist. Missing models no-op.
 */
export async function buildKenneyDressing(ctx) {
  const { blocked, addCyl, addCollider, setTag } = ctx;
  setTag('kenney');
  const clear = (x, z, r, y0, h) => !inKeepout(x, z, 0.6) && !blocked(x, z, r, y0, y0 + h);

  // Dumpsters on the landward sidewalk, hashed slots (not rng4).
  const dumpsters = [];
  for (let i = 0; i < 16; i++) {
    if (hash01(i, 3) < 0.35) continue;
    const x = sidewalkX(i, 16) + (hash01(i, 11) - 0.5) * 8;
    const z = 61.5 + hash01(i, 19) * 4;
    if (Math.abs(x - PIER_X) < 16) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 1.1, y, 1.6)) continue;
    dumpsters.push({ x, y, z, scale: 1.15, rotY: hash01(i, 29) * Math.PI * 2 });
    addCyl(x, y, z, 0.9, 1.5);
  }
  await scatterSafe(ctx, 'dumpster', dumpsters, 'kenney-dumpsters');

  // Street lights on both sidewalks.
  const lights = [];
  for (let i = 0; i < 22; i++) {
    const side = i % 2;
    const x = sidewalkX((i / 2) | 0, 11) + (hash01(i, 41) - 0.5) * 5;
    const z = side ? 53.4 : 34.6;
    if (Math.abs(x - PIER_X) < 12) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.35, y, 6.5)) continue;
    lights.push({ x, y, z, scale: 1.0, rotY: side ? 0 : Math.PI });
    addCyl(x, y, z, 0.18, 6.4);
  }
  await scatterSafe(ctx, 'street_light', lights, 'kenney-street-lights');

  // Planters on the promenade landward edge.
  const planters = [];
  for (let i = 0; i < 12; i++) {
    const x = sidewalkX(i, 12) + (hash01(i, 53) - 0.5) * 6;
    const z = 57.2;
    if (Math.abs(x - PIER_X) < 14) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.7, y, 1.1)) continue;
    planters.push({ x, y, z, scale: 1.05, rotY: hash01(i, 61) * Math.PI });
    addCyl(x, y, z, 0.55, 0.9);
  }
  await scatterSafe(ctx, 'planter', planters, 'kenney-planters');

  // Stop signs at the signed Ocean Drive gaps — city approach (z=50.6)
  // and beach approach (z=37.6) so both directions are signed.
  const signs = [];
  for (let i = 0; i < GAP_X.length; i++) {
    const pair = [
      { x: GAP_X[i] + 3.4, z: 50.6, rotY: Math.PI },
      { x: GAP_X[i] - 3.4, z: 37.6, rotY: 0 },
    ];
    for (const p of pair) {
      const y = groundHeight(p.x, p.z);
      if (!clear(p.x, p.z, 0.25, y, 2.6)) continue;
      signs.push({ x: p.x, y, z: p.z, scale: 1.0, rotY: p.rotY });
      addCyl(p.x, y, p.z, 0.12, 2.5);
    }
  }
  await scatterSafe(ctx, 'stop_sign', signs, 'kenney-stop-signs');

  // Cones at the signed zebra crossings (planting strip, city curb).
  const cones = [];
  for (let i = 0; i < CROSS_X.length; i++) {
    for (const s of [-1, 1]) {
      const x = CROSS_X[i] + s * (7.2 + hash01(i, 83) * 1.4);
      const z = 51.35;
      const y = groundHeight(x, z);
      if (!clear(x, z, 0.22, y, 0.8)) continue;
      cones.push({ x, y, z, scale: 1.0, rotY: hash01(i + s, 89) * Math.PI * 2 });
      addCyl(x, y, z, 0.16, 0.72);
    }
  }
  await scatterSafe(ctx, 'traffic_cone', cones, 'kenney-cones');

  // Traffic lights at Ocean Drive × cross-street corners (GAP_X; CROSS_X
  // is the zebra subset). ~2 per intersection: city sidewalk (z 53.2–54.0)
  // and beach sidewalk (z 34.4–35.2), ±7 m off the gap so they sit on the
  // corner, not in the roadway. Signal face is −X; yaw toward the road.
  const trafficLights = [];
  for (let i = 0; i < GAP_X.length; i++) {
    const corners = [
      { dx: 7, z: 53.2 + hash01(i, 233) * 0.8, rotY: -Math.PI / 2 },
      { dx: -7, z: 34.4 + hash01(i, 239) * 0.8, rotY: Math.PI / 2 },
    ];
    for (const c of corners) {
      const x = GAP_X[i] + c.dx;
      const z = c.z;
      const y = groundHeight(x, z);
      if (!clear(x, z, 0.3, y, 4.6)) continue;
      trafficLights.push({ x, y, z, scale: 1.0, rotY: c.rotY });
      addCyl(x, y, z, 0.16, 4.4);
    }
  }
  await scatterSafe(ctx, 'traffic_light', trafficLights, 'kenney-traffic-lights');

  // Beach chairs on the sand (ocean of the boardwalk kiss).
  const chairs = [];
  for (let i = 0; i < 18; i++) {
    const x = -500 + hash01(i, 101) * 1000;
    const z = 5.2 + hash01(i, 103) * 11;
    if (Math.abs(x - PIER_X) < 16) continue;
    const y = groundHeight(x, z);
    if (y < 0.2) continue;
    if (!clear(x, z, 0.5, y, 0.95)) continue;
    chairs.push({ x, y, z, scale: 1.0, rotY: (hash01(i, 107) - 0.5) * 0.5 });
    addCyl(x, y, z, 0.32, 0.85);
  }
  await scatterSafe(ctx, 'plastic_monobloc_chair_01', chairs, 'beach-chairs');

  // Kenney cafe parasols on the sand, offset from the procedural scalloped set.
  const parasols = [];
  for (let i = 0; i < 12; i++) {
    const x = -480 + hash01(i, 109) * 960;
    const z = 7.5 + hash01(i, 113) * 8;
    if (Math.abs(x - PIER_X) < 18) continue;
    const y = groundHeight(x, z);
    if (y < 0.2) continue;
    if (!clear(x, z, 0.9, y, 2.2)) continue;
    parasols.push({ x, y, z, scale: 1.05, rotY: hash01(i, 127) * Math.PI * 2 });
    addCyl(x, y, z, 0.08, 2.1);
  }
  await scatterSafe(ctx, 'parasol_a', parasols, 'kenney-parasols');

  // Lambis shells — ankle-high, no colliders.
  const shells = [];
  for (let i = 0; i < 20; i++) {
    const x = -520 + hash01(i, 131) * 1040;
    const z = 2.4 + hash01(i, 137) * 12;
    if (Math.abs(x - PIER_X) < 14) continue;
    const y = groundHeight(x, z);
    if (y < 0.12) continue;
    if (!clear(x, z, 0.25, y, 0.3)) continue;
    shells.push({
      x, y: y - 0.02, z,
      scale: 0.35 + hash01(i, 139) * 0.4,
      rotY: hash01(i, 149) * Math.PI * 2,
    });
  }
  await scatterSafe(ctx, 'lambis_shell', shells, 'beach-shells');

  // Potted tropicals along the promenade landward of the Kenney planters.
  const pots = [];
  for (let i = 0; i < 10; i++) {
    const x = sidewalkX(i, 10) + (hash01(i, 151) - 0.5) * 5;
    const z = 56.4;
    if (Math.abs(x - PIER_X) < 14) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.45, y, 1.2)) continue;
    pots.push({ x, y, z, scale: 0.95 + hash01(i, 157) * 0.25, rotY: hash01(i, 163) * Math.PI * 2 });
    addCyl(x, y, z, 0.28, 0.9);
  }
  await scatterSafe(ctx, 'potted_plant_02', pots, 'potted-tropicals');

  // Kenney awnings as extra storefront accents on the city sidewalk
  // landward edge. Sparse hash skip. Awning extrudes +Z; yaw π so it
  // faces Ocean Drive.
  const awnings = [];
  for (let i = 0; i < 14; i++) {
    if (hash01(i, 271) < 0.62) continue;
    const x = sidewalkX(i, 14) + (hash01(i, 277) - 0.5) * 6;
    const z = 56 + hash01(i, 281) * 2;
    if (Math.abs(x - PIER_X) < 14) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.55, y, 1.4)) continue;
    const sc = 2.4 + hash01(i, 283) * 0.9;
    awnings.push({ x, y, z, scale: sc, rotY: Math.PI });
    addCollider(x, y, z, sc * 0.42, sc * 0.42, sc * 0.16);
  }
  await scatterSafe(ctx, 'awning', awnings, 'kenney-awnings');

  // Succulents at storefront beds (city sidewalk planting strip).
  const succs = [];
  for (let i = 0; i < 14; i++) {
    const x = sidewalkX(i, 14) + (hash01(i, 167) - 0.5) * 4;
    const z = 51.5 + (hash01(i, 173) - 0.5) * 0.4;
    if (Math.abs(x - PIER_X) < 12) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 7)) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.35, y, 0.7)) continue;
    succs.push({ x, y, z, scale: 1.05 + hash01(i, 179) * 0.3, rotY: hash01(i, 181) * Math.PI * 2 });
    addCyl(x, y, z, 0.22, 0.55);
  }
  await scatterSafe(ctx, 'potted_plant_04', succs, 'potted-succulents');

  // Extra shrub photoscan on leftover city dirt behind the first tower row.
  const extraShrubs = [];
  for (let i = 0; i < 14; i++) {
    const x = -480 + hash01(i, 191) * 960;
    const z = 58 + hash01(i, 193) * 24;
    if (Math.abs(x - PIER_X) < 16) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 9)) continue;
    const y = groundHeight(x, z);
    if (y < CITY_Y - 0.05) continue;
    if (!clear(x, z, 0.7, y, 1.4)) continue;
    extraShrubs.push({ x, y, z, scale: 0.85 + hash01(i, 197) * 0.45, rotY: hash01(i, 199) * Math.PI * 2 });
  }
  await scatterSafe(ctx, 'shrub_04', extraShrubs, 'shrubs-c');

  // Nature-kit cactus in leftover city beds.
  const cacti = [];
  for (let i = 0; i < 12; i++) {
    const x = -460 + hash01(i, 211) * 920;
    const z = 62 + hash01(i, 223) * 28;
    if (Math.abs(x - PIER_X) < 16) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 9)) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.4, y, 1.1)) continue;
    cacti.push({ x, y, z, scale: 1.2 + hash01(i, 227) * 0.5, rotY: hash01(i, 229) * Math.PI * 2 });
    addCyl(x, y, z, 0.22, 0.95);
  }
  await scatterSafe(ctx, 'kenney_cactus', cacti, 'kenney-cactus');

  // Kenney palms on leftover city dirt / promenade landward of the walk.
  const kenneyPalms = [];
  for (let i = 0; i < 16; i++) {
    const x = -500 + hash01(i, 241) * 1000;
    const z = 58 + hash01(i, 251) * 14;
    if (Math.abs(x - PIER_X) < 16) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 9)) continue;
    const y = groundHeight(x, z);
    if (y < CITY_Y - 0.05) continue;
    if (!clear(x, z, 0.7, y, 3.2)) continue;
    kenneyPalms.push({
      x, y, z,
      scale: 2.4 + hash01(i, 257) * 1.6,
      rotY: hash01(i, 263) * Math.PI * 2,
    });
    addCyl(x, y, z, 0.2, 2.6);
  }
  await scatterSafe(ctx, 'kenney_palm', kenneyPalms, 'kenney-palms');

  // Far authored skyline — Kenney buildings already have separate roof/wall
  // materials. Sit them behind the cheap 60-box LOD (z 300–620).
  const far = [];
  const farSlugs = [
    { slug: 'kenney_skyscraper_a', n: 5, size: 38 },
    { slug: 'kenney_skyscraper_b', n: 4, size: 36 },
    { slug: 'kenney_skyscraper_c', n: 4, size: 42 },
    { slug: 'kenney_skyscraper_d', n: 3, size: 40 },
    { slug: 'kenney_midrise_a', n: 4, size: 26 },
    { slug: 'kenney_midrise_e', n: 5, size: 28 },
  ];
  for (const spec of farSlugs) {
    const placements = [];
    for (let i = 0; i < spec.n; i++) {
      const x = -420 + hash01(i, spec.size | 0) * 840;
      const z = 640 + hash01(i, spec.size | 1) * 90;
      const y = CITY_Y;
      if (!clear(x, z, spec.size * 0.35, y, spec.size * 1.2)) continue;
      placements.push({
        x, y, z,
        scale: spec.size / 10,
        rotY: (hash01(i, 77) * 4 | 0) * (Math.PI / 2),
      });
      addCollider(x, y, z, spec.size * 0.7, spec.size * 1.6, spec.size * 0.7);
    }
    await scatterSafe(ctx, spec.slug, placements, `kenney-far-${spec.slug}`);
    far.push(...placements);
  }

  // Suburban low-rise infill behind the 60-box LOD (z 300–620) and the
  // authored Kenney skyline row (z>640).
  const houses = [];
  for (let i = 0; i < 8; i++) {
    const x = -400 + hash01(i, 269) * 800;
    const z = 720 + hash01(i, 307) * 100;
    const y = CITY_Y;
    const size = 18;
    if (z < 720 || z > 820) continue;
    if (!clear(x, z, size * 0.35, y, size * 0.9)) continue;
    houses.push({
      x, y, z,
      scale: size / 10,
      rotY: (hash01(i, 311) * 4 | 0) * (Math.PI / 2),
    });
    addCollider(x, y, z, size * 0.7, size * 0.9, size * 0.7);
  }
  await scatterSafe(ctx, 'kenney_house_a', houses, 'kenney-houses');

  // Kenney trees in leftover city dirt (hash, not rng).
  const trees = [];
  for (let i = 0; i < 18; i++) {
    const x = -500 + hash01(i, 331) * 1000;
    const z = 64 + hash01(i, 337) * 40;
    if (Math.abs(x - PIER_X) < 16) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 10)) continue;
    const y = groundHeight(x, z);
    if (y < CITY_Y - 0.05) continue;
    if (!clear(x, z, 1.1, y, 4.5)) continue;
    trees.push({
      x, y, z,
      scale: 2.2 + hash01(i, 347) * 1.4,
      rotY: hash01(i, 353) * Math.PI * 2,
    });
    addCyl(x, y, z, 0.28, 3.2);
  }
  await scatterSafe(ctx, 'kenney_tree_large', trees, 'kenney-trees');

  // Covered cars in mid-block voids (not on Ocean Drive).
  const covered = [];
  for (let i = 0; i < 10; i++) {
    const x = -480 + hash01(i, 359) * 960;
    const z = 88 + hash01(i, 367) * 40;
    if (GAP_X.some((c) => Math.abs(x - c) < 12)) continue;
    const y = groundHeight(x, z);
    if (y < CITY_Y - 0.05) continue;
    if (!clear(x, z, 1.4, y, 1.4)) continue;
    covered.push({
      x, y, z,
      scale: 1.0,
      rotY: (hash01(i, 373) < 0.5 ? 0 : Math.PI / 2),
    });
    addCollider(x, y, z, 4.4, 1.5, 1.9);
  }
  await scatterSafe(ctx, 'covered_car', covered, 'covered-cars');

  setTag('world');
  return {
    dumpsters: dumpsters.length,
    lights: lights.length,
    trafficLights: trafficLights.length,
    palms: kenneyPalms.length,
    houses: houses.length,
    awnings: awnings.length,
    signs: signs.length,
    far: far.length,
  };
}
