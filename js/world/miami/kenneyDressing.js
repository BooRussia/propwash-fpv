import * as THREE from 'three';
import {
  CITY_Y, PIER_X, GAP_X, CROSS_X, MARINA_X, groundHeight, inKeepout, deckTop,
  BOARDWALK_TOP, leftoverLotOverlap, BEACH_CHAIR_CELLS, BEACH_UMBRELLA_CELLS,
  BOARDWALK_BENCH_CELLS, BOARDWALK_LAMP_CELLS,
  PED_SIGNAL_CELLS, FLEX_POST_CELLS,
} from './constants.js';
import { hash01 } from './rng.js';
import { scatterModels } from '../vegetation.js';
import { buildStairHandrailGeo } from './props/stairs-entry.js';
import {
  buildDockCleatGeo,
  buildDockPileGeo,
  buildPalletWoodGeo,
  buildCardboardStackGeo,
} from './props/alley-lot-marina.js';
import { buildLifeRingGeo } from './props/beach-boardwalk.js';
import {
  buildPaperStackGeo,
  buildPayphoneKioskGeo,
} from './props/sidewalk-furniture.js';
import {
  buildUtilityPoleWoodGeo,
  buildPowerSpanGeo,
  buildPoleTransformerGeo,
  buildStandpipeSiameseGeo,
} from './props/utilities-power.js';
import {
  buildPipeRailingGeo,
  buildChainLinkRunGeo,
  buildSwingGateGeo,
} from './props/fence-rail.js';
import { buildWindowAcRowGeo, buildFlagpoleGeo } from './props/building-dressing.js';
import { buildPedSignalGeo, buildBollardFlexGeo } from './props/traffic-control.js';

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

function instanceAuthored(ctx, geo, mat, spots, name) {
  if (!spots.length) {
    geo.dispose();
    mat.dispose();
    return 0;
  }
  const track = ctx.track || ((o) => o);
  const im = new THREE.InstancedMesh(track(geo), track(mat), spots.length);
  im.name = name;
  im.castShadow = true;
  im.receiveShadow = true;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < spots.length; i++) {
    const sp = spots[i];
    const sc = sp.scale == null ? 1 : sp.scale;
    p.set(sp.x, sp.y, sp.z);
    q.setFromAxisAngle(up, sp.rotY || 0);
    s.set(sc, sc, sc);
    m4.compose(p, q, s);
    im.setMatrixAt(i, m4);
  }
  im.instanceMatrix.needsUpdate = true;
  ctx.root.add(im);
  return spots.length;
}

/**
 * Extra CC0 street/beach props + a far authored-skyline row.
 * Call AFTER colliders exist. Missing models no-op.
 */
export async function buildKenneyDressing(ctx) {
  const { blocked, addCyl, addCollider, addOBB, setTag } = ctx;
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
    { slug: 'kenney_midrise_c', n: 4, size: 24 },
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

  // Tall Kenney palms on the promenade (catalog planting-landscape, hash01).
  const tallPalms = [];
  for (let i = 0; i < 12; i++) {
    const x = -500 + hash01(i, 501) * 1000;
    const z = 56 + hash01(i, 503) * 5.5;
    if (Math.abs(x - PIER_X) < 16) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 9)) continue;
    const y = groundHeight(x, z);
    if (y < CITY_Y - 0.05) continue;
    if (!clear(x, z, 0.7, y, 3.8)) continue;
    tallPalms.push({
      x, y, z,
      scale: 2.6 + hash01(i, 509) * 1.4,
      rotY: hash01(i, 521) * Math.PI * 2,
    });
    addCyl(x, y, z, 0.18, 3.4);
  }
  await scatterSafe(ctx, 'kenney_palm_tall', tallPalms, 'kenney-palms-tall');

  // Small Kenney street trees on the city tree lawn (z 51.5).
  const smallTrees = [];
  for (let i = 0; i < 14; i++) {
    const x = sidewalkX(i, 14) + (hash01(i, 523) - 0.5) * 4;
    const z = 51.5 + (hash01(i, 529) - 0.5) * 0.4;
    if (Math.abs(x - PIER_X) < 12) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.55, y, 2.0)) continue;
    smallTrees.push({
      x, y, z,
      scale: 2.4 + hash01(i, 541) * 1.2,
      rotY: hash01(i, 547) * Math.PI * 2,
    });
    addCyl(x, y, z, 0.22, 1.8);
  }
  await scatterSafe(ctx, 'kenney_tree_small', smallTrees, 'kenney-trees-small');

  // Kenney bushes in leftover alley dirt (pass-through, no collider).
  const bushes = [];
  for (let i = 0; i < 16; i++) {
    const x = -480 + hash01(i, 557) * 960;
    const z = 84 + hash01(i, 563) * 40;
    if (Math.abs(x - PIER_X) < 16) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 10)) continue;
    const y = groundHeight(x, z);
    if (y < CITY_Y - 0.05) continue;
    if (!clear(x, z, 0.5, y, 0.8)) continue;
    bushes.push({
      x, y, z,
      scale: 1.8 + hash01(i, 569) * 1.4,
      rotY: hash01(i, 571) * Math.PI * 2,
    });
  }
  await scatterSafe(ctx, 'kenney_bush', bushes, 'kenney-bushes');

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

  // Approved catalog slug security_camera_01 — storefront fascia, hash01 only.
  const cams = [];
  for (let i = 0; i < 10; i++) {
    if (hash01(i, 401) < 0.28) continue;
    const x = sidewalkX(i, 10) + (hash01(i, 409) - 0.5) * 6;
    const z = 56.2 + hash01(i, 419) * 1.4;
    if (Math.abs(x - PIER_X) < 14) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
    const y = groundHeight(x, z) + 2.45 + hash01(i, 421) * 0.55;
    if (!clear(x, z, 0.25, y - 0.2, 0.5)) continue;
    cams.push({ x, y, z, scale: 1.0, rotY: 0 });
  }
  await scatterSafe(ctx, 'security_camera_01', cams, 'security-cams');

  // Approved stairs-entry slugs (hash01 only). Do not restack loops above.
  setTag('stairs-entry');
  const rails = [];
  for (let i = 0; i < 12; i++) {
    if (hash01(i, 1103) < 0.42) continue;
    const x = sidewalkX(i, 12) + (hash01(i, 1109) - 0.5) * 5;
    const z = 56.15 + hash01(i, 1117) * 1.5;
    if (Math.abs(x - PIER_X) < 14) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.35, y, 2.0)) continue;
    rails.push({ x, y, z, rotY: -Math.PI / 2 });
    addCollider(x, y, z, 2.15, 1.9, 0.14);
  }
  instanceAuthored(ctx, buildStairHandrailGeo(), new THREE.MeshStandardMaterial({
    vertexColors: true, color: 0xe8eef0, roughness: 0.28, metalness: 0.18,
  }), rails, 'catalog-stair-handrails');

  const awningWide = [];
  for (let i = 0; i < 12; i++) {
    if (hash01(i, 1123) < 0.58) continue;
    const x = sidewalkX(i, 12) + (hash01(i, 1129) - 0.5) * 6;
    const z = 56.6 + hash01(i, 1135) * 1.8;
    if (Math.abs(x - PIER_X) < 14) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.7, y, 1.2)) continue;
    const sc = 2.05 + hash01(i, 1141) * 0.7;
    awningWide.push({ x, y, z, scale: sc, rotY: Math.PI });
    addCollider(x, y, z, sc * 0.80, sc * 0.40, sc * 0.15);
  }
  await scatterSafe(ctx, 'awning_wide', awningWide, 'kenney-awning-wide');

  const overhangs = [];
  for (let i = 0; i < 10; i++) {
    if (hash01(i, 1147) < 0.52) continue;
    const x = sidewalkX(i, 10) + (hash01(i, 1153) - 0.5) * 5;
    const z = 56.3 + hash01(i, 1159) * 1.6;
    if (Math.abs(x - PIER_X) < 14) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.6, y, 1.2)) continue;
    const sc = 2.3 + hash01(i, 1163) * 0.8;
    overhangs.push({ x, y, z, scale: sc, rotY: Math.PI });
    addCollider(x, y, z, sc * 0.50, sc * 0.40, sc * 0.20);
  }
  await scatterSafe(ctx, 'overhang', overhangs, 'kenney-overhangs');

  // Corridor ramps / bollards / ped heads / mailboxes / fountains / cabinets /
  // tree grates / gutter manholes live on the 2D site plan, not hash ribbons.

  // Approved alley-lot-marina slugs (hash01 only). Do not restack loops above.
  setTag('alley-lot-marina');
  const alleyVC = () => new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.88, metalness: 0.2,
  });

  const crates = [];
  for (let i = 0; i < 14; i++) {
    if (hash01(i, 1403) < 0.38) continue;
    const x = -480 + hash01(i, 1409) * 960;
    const z = 84 + hash01(i, 1417) * 40;
    if (Math.abs(x - PIER_X) < 16) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 12)) continue;
    const y = groundHeight(x, z);
    if (y < CITY_Y - 0.05) continue;
    if (!clear(x, z, 0.7, y, 0.5)) continue;
    crates.push({ x, y, z, rotY: hash01(i, 1423) < 0.5 ? 0 : Math.PI });
    addCollider(x, y, z, 0.53, 0.46, 1.17);
  }
  await scatterSafe(ctx, 'wooden_crate_02', crates, 'catalog-crates');

  const pallets = [];
  for (let i = 0; i < 12; i++) {
    if (hash01(i, 1429) < 0.4) continue;
    const x = -480 + hash01(i, 1433) * 960;
    const z = 84 + hash01(i, 1439) * 40;
    if (Math.abs(x - PIER_X) < 16) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 12)) continue;
    const y = groundHeight(x, z);
    if (y < CITY_Y - 0.05) continue;
    if (!clear(x, z, 0.7, y, 0.16)) continue;
    pallets.push({ x, y, z, rotY: hash01(i, 1447) < 0.5 ? 0 : Math.PI });
    addCollider(x, y, z, 1.2, 0.14, 1.0);
  }
  instanceAuthored(ctx, buildPalletWoodGeo(), alleyVC(), pallets, 'catalog-pallets');

  const cardboard = [];
  for (let i = 0; i < 12; i++) {
    if (hash01(i, 1451) < 0.42) continue;
    const x = -480 + hash01(i, 1453) * 960;
    const z = 84 + hash01(i, 1459) * 40;
    if (Math.abs(x - PIER_X) < 16) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 12)) continue;
    const y = groundHeight(x, z);
    if (y < CITY_Y - 0.05) continue;
    if (!clear(x, z, 0.5, y, 0.82)) continue;
    cardboard.push({ x, y, z, rotY: hash01(i, 1461) < 0.5 ? 0 : Math.PI });
    addCollider(x, y, z, 0.8, 0.82, 0.43);
  }
  instanceAuthored(ctx, buildCardboardStackGeo(), alleyVC(), cardboard, 'catalog-cardboard');

  const MAR_DOCKS = [0, 26, 52];
  const DOCK_TOP = 0.8;
  const barrels = [];
  for (let i = 0; i < 8; i++) {
    if (hash01(i, 1471) < 0.35) continue;
    const x = MARINA_X + MAR_DOCKS[i % 3] + (hash01(i, 1477) - 0.5) * 2.2;
    const z = -34 + hash01(i, 1481) * 22;
    if (!clear(x, z, 0.32, 0.82, 0.88)) continue;
    barrels.push({ x, y: DOCK_TOP, z, rotY: hash01(i, 1483) * Math.PI * 2 });
    addCyl(x, DOCK_TOP, z, 0.28, 0.88);
  }
  await scatterSafe(ctx, 'Barrel_01', barrels, 'catalog-barrels');

  const cleats = [];
  for (let i = 0; i < 12; i++) {
    const side = hash01(i, 1487) < 0.5 ? -1.65 : 1.65;
    const x = MARINA_X + MAR_DOCKS[i % 3] + side;
    const z = -34 + hash01(i, 1493) * 22;
    if (!clear(x, z, 0.2, 0.82, 0.16)) continue;
    const rotY = Math.PI / 2;
    cleats.push({ x, y: DOCK_TOP, z, rotY });
    addOBB(x, DOCK_TOP, z, 0.35, 0.16, 0.18, rotY);
  }
  instanceAuthored(ctx, buildDockCleatGeo(), alleyVC(), cleats, 'catalog-cleats');

  const piles = [];
  for (let i = 0; i < 12; i++) {
    const side = hash01(i, 1501) < 0.5 ? -2.5 : 2.5;
    const x = MARINA_X + MAR_DOCKS[i % 3] + side;
    const z = -34 + hash01(i, 1511) * 22;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.28, y, 2.4)) continue;
    piles.push({ x, y, z, rotY: hash01(i, 1523) * Math.PI * 2 });
    addCyl(x, y, z, 0.22, 2.4);
  }
  instanceAuthored(ctx, buildDockPileGeo(), alleyVC(), piles, 'catalog-piles');

  // Approved beach-boardwalk slugs (hash01 only). Do not restack loops above.
  setTag('beach-boardwalk');
  const parasolB = [];
  for (let i = 0; i < 12; i++) {
    const x = -470 + hash01(i, 1601) * 940;
    const z = 6.2 + hash01(i, 1607) * 10;
    if (Math.abs(x - PIER_X) < 18) continue;
    const y = groundHeight(x, z);
    if (y < 0.2) continue;
    if (!clear(x, z, 0.35, y, 0.5)) continue;
    parasolB.push({ x, y, z, scale: 1.0, rotY: hash01(i, 1609) * Math.PI * 2 });
    addCyl(x, y, z, 0.2, 0.45);
  }
  await scatterSafe(ctx, 'parasol_b', parasolB, 'kenney-parasols-b');

  const picnics = [];
  for (let i = 0; i < 10; i++) {
    if (hash01(i, 1613) < 0.38) continue;
    const x = sidewalkX(i, 10) + (hash01(i, 1619) - 0.5) * 10;
    const z = 24.8 + (hash01(i, 1621) - 0.5) * 1.6;
    if (Math.abs(x - PIER_X) < 12) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
    const y = deckTop(x, z);
    if (!Number.isFinite(y) || y < BOARDWALK_TOP - 0.01) continue;
    if (!clear(x, z, 1.4, y, 0.8)) continue;
    picnics.push({ x, y, z, scale: 1.0, rotY: Math.PI / 2 });
    addCollider(x, y, z, 3.02, 0.75, 2.24);
  }
  await scatterSafe(ctx, 'wooden_picnic_table', picnics, 'boardwalk-picnics');

  const carts = [];
  for (let i = 0; i < 8 && carts.length < 2; i++) {
    if (hash01(i, 1627) < 0.4) continue;
    const x = sidewalkX(i, 8) + (hash01(i, 1637) - 0.5) * 8;
    const z = 25.2 + (hash01(i, 1657) - 0.5) * 1.2;
    if (Math.abs(x - PIER_X) < 12) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
    const y = deckTop(x, z);
    if (!Number.isFinite(y) || y < BOARDWALK_TOP - 0.01) continue;
    if (!clear(x, z, 1.2, y, 1.8)) continue;
    carts.push({ x, y, z, scale: 1.0, rotY: hash01(i, 1663) < 0.5 ? 0 : Math.PI });
    addCollider(x, y, z, 2.17, 1.72, 1.07);
  }
  await scatterSafe(ctx, 'CoffeeCart_01', carts, 'boardwalk-coffee-carts');

  const rings = [];
  for (let i = 0; i < 10; i++) {
    if (hash01(i, 1667) < 0.28) continue;
    const side = hash01(i, 1669) < 0.5 ? -1 : 1;
    const x = PIER_X + side * 5.35;
    const z = -132 + hash01(i, 1693) * 145;
    const y = deckTop(x, z);
    if (!Number.isFinite(y) || y < 3.6) continue;
    if (!clear(x, z, 0.22, y, 1.4)) continue;
    rings.push({ x, y, z, rotY: side > 0 ? Math.PI / 2 : -Math.PI / 2 });
    addCyl(x, y, z, 0.12, 1.4);
  }
  instanceAuthored(ctx, buildLifeRingGeo(), new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.72, metalness: 0.08,
  }), rings, 'catalog-life-ring');

  // Remaining approved authored geos (hash01). Colliders match catalog.
  setTag('sidewalk-furniture');
  const vc = (opts = {}) => new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: opts.roughness ?? 0.72, metalness: opts.metalness ?? 0.08,
  });
  const papers = [];
  for (let i = 0; i < 10; i++) {
    if (hash01(i, 1713) < 0.45) continue;
    const x = -480 + hash01(i, 1719) * 960;
    const z = 84 + hash01(i, 1721) * 36;
    if (GAP_X.some((c) => Math.abs(x - c) < 10)) continue;
    const y = groundHeight(x, z);
    if (y < CITY_Y - 0.05) continue;
    if (!clear(x, z, 0.3, y, 0.26)) continue;
    papers.push({ x, y, z, rotY: hash01(i, 1723) * Math.PI });
    addCollider(x, y, z, 0.4, 0.25, 0.3);
  }
  instanceAuthored(ctx, buildPaperStackGeo(), vc({ roughness: 0.88 }), papers, 'catalog-paper-stack');

  const phones = [];
  for (let i = 0; i < 8 && phones.length < 3; i++) {
    if (hash01(i, 1753) < 0.45) continue;
    const x = sidewalkX(i, 8) + (hash01(i, 1759) - 0.5) * 5;
    const z = 56.4 + hash01(i, 1763) * 1.4;
    if (Math.abs(x - PIER_X) < 14) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.5, y, 2.2)) continue;
    phones.push({ x, y, z, rotY: Math.PI });
    addCollider(x, y, z, 0.8, 2.2, 0.5);
  }
  instanceAuthored(ctx, buildPayphoneKioskGeo(), vc(), phones, 'catalog-payphone');

  setTag('utilities-power');
  const poles = [];
  const xfmrs = [];
  for (let i = 0; i < 16; i++) {
    const x = -520 + i * 28;
    const z = 92 + (hash01(i, 1769) - 0.5) * 6;
    if (Math.abs(x - PIER_X) < 16) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 12)) continue;
    const y = groundHeight(x, z);
    if (y < CITY_Y - 0.05) continue;
    if (!clear(x, z, 0.28, y, 9.5)) continue;
    poles.push({ x, y, z, rotY: 0 });
    addCyl(x, y, z, 0.2, 9.5);
    if (i % 3 === 1) {
      const ty = y + 8.2;
      xfmrs.push({ x, y: ty, z, rotY: 0 });
      addCyl(x, ty, z, 0.28, 0.7);
    }
  }
  instanceAuthored(ctx, buildUtilityPoleWoodGeo(), vc({ roughness: 0.88, metalness: 0.2 }),
    poles, 'catalog-utility-poles');
  instanceAuthored(ctx, buildPoleTransformerGeo(), vc({ roughness: 0.88, metalness: 0.2 }),
    xfmrs, 'catalog-transformers');
  const spans = [];
  for (let i = 0; i < poles.length - 1; i++) {
    const a = poles[i], b = poles[i + 1];
    if (Math.abs(b.x - a.x - 28) > 4) continue;
    spans.push({ x: a.x, y: a.y, z: a.z, rotY: 0 });
  }
  instanceAuthored(ctx, buildPowerSpanGeo(), vc({ roughness: 0.5, metalness: 0.35 }),
    spans, 'catalog-power-spans');

  const pipes = [];
  for (let i = 0; i < 10; i++) {
    if (hash01(i, 1789) < 0.4) continue;
    const x = sidewalkX(i, 10) + (hash01(i, 1793) - 0.5) * 5;
    const z = 56.8 + hash01(i, 1799) * 1.6;
    if (Math.abs(x - PIER_X) < 14) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.3, y, 0.7)) continue;
    pipes.push({ x, y, z, rotY: Math.PI });
    addCollider(x, y, z, 0.45, 0.7, 0.25);
  }
  instanceAuthored(ctx, buildStandpipeSiameseGeo(), vc({ roughness: 0.88 }), pipes, 'catalog-standpipe');

  setTag('fence-rail');
  const chain = [];
  for (let i = 0; i < 10; i++) {
    if (hash01(i, 1801) < 0.4) continue;
    const x = -500 + hash01(i, 1807) * 1000;
    const z = 88 + hash01(i, 1811) * 28;
    if (GAP_X.some((c) => Math.abs(x - c) < 12)) continue;
    const y = groundHeight(x, z);
    if (y < CITY_Y - 0.05) continue;
    if (!clear(x, z, 1.2, y, 1.7)) continue;
    chain.push({ x, y, z, rotY: hash01(i, 1813) < 0.5 ? 0 : Math.PI / 2 });
    addCollider(x, y, z, 2.4, 1.7, 0.08);
  }
  instanceAuthored(ctx, buildChainLinkRunGeo(), vc({ roughness: 0.88 }), chain, 'catalog-chain-link');

  const gates = [];
  for (let i = 0; i < 6; i++) {
    if (hash01(i, 1823) < 0.45) continue;
    const x = -500 + hash01(i, 1829) * 1000;
    const z = 90 + hash01(i, 1831) * 24;
    if (GAP_X.some((c) => Math.abs(x - c) < 12)) continue;
    const y = groundHeight(x, z);
    if (y < CITY_Y - 0.05) continue;
    if (!clear(x, z, 0.8, y, 1.2)) continue;
    gates.push({ x, y, z, rotY: 0 });
    addCollider(x, y, z, 1.4, 1.2, 0.08);
  }
  instanceAuthored(ctx, buildSwingGateGeo(), vc({ roughness: 0.88 }), gates, 'catalog-gates');

  const pipeRails = [];
  for (let i = 0; i < 12; i++) {
    if (hash01(i, 1837) < 0.5) continue;
    const x = sidewalkX(i, 12) + (hash01(i, 1841) - 0.5) * 5;
    const z = 56.2 + hash01(i, 1843) * 1.2;
    if (Math.abs(x - PIER_X) < 14) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.4, y, 1.05)) continue;
    pipeRails.push({ x, y, z, rotY: -Math.PI / 2 });
    addCollider(x, y, z, 2.0, 1.05, 0.08);
  }
  instanceAuthored(ctx, buildPipeRailingGeo(), vc({ roughness: 0.28, metalness: 0.18 }),
    pipeRails, 'catalog-pipe-rail');

  const acs = [];
  for (let i = 0; i < 12; i++) {
    if (hash01(i, 1867) < 0.48) continue;
    const x = sidewalkX(i, 12) + (hash01(i, 1871) - 0.5) * 6;
    const z = 57.4 + hash01(i, 1873) * 1.2;
    if (Math.abs(x - PIER_X) < 14) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
    const y = groundHeight(x, z) + 2.15;
    acs.push({ x, y, z, rotY: Math.PI });
  }
  instanceAuthored(ctx, buildWindowAcRowGeo(), vc({ roughness: 0.88 }), acs, 'catalog-window-ac');

  const flags = [];
  for (let i = 0; i < 6 && flags.length < 4; i++) {
    if (hash01(i, 1879) < 0.35) continue;
    const x = sidewalkX(i, 6) + (hash01(i, 1883) - 0.5) * 8;
    const z = 57.8;
    if (Math.abs(x - PIER_X) < 14) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.16, y, 7)) continue;
    flags.push({ x, y, z, rotY: 0 });
    addCyl(x, y, z, 0.08, 7);
  }
  instanceAuthored(ctx, buildFlagpoleGeo(), vc(), flags, 'catalog-flagpole');

  // Extra signed beach chairs + umbrellas on the sand. hash01 yaw only.
  // Skip keepouts / leftoverLot / travel. Do not restack loops above.
  const extraChairs = [];
  for (let i = 0; i < BEACH_CHAIR_CELLS.length; i++) {
    const [x, z] = BEACH_CHAIR_CELLS[i];
    if (z > 40.2 && z < 47.8) continue;
    if (leftoverLotOverlap(x, z, 0.64, 0.63, 0.15)) continue;
    if (inKeepout(x, z, 0.6)) continue;
    const y = groundHeight(x, z);
    if (y < 0.2) continue;
    if (!clear(x, z, 0.5, y, 0.95)) continue;
    extraChairs.push({ x, y, z, scale: 1.0, rotY: (hash01(i, 2401) - 0.5) * 0.5 });
    addCyl(x, y, z, 0.32, 0.85);
  }
  await scatterSafe(ctx, 'plastic_monobloc_chair_01', extraChairs, 'beach-chairs-signed');

  const extraUmbrellas = [];
  for (let i = 0; i < BEACH_UMBRELLA_CELLS.length; i++) {
    const [x, z] = BEACH_UMBRELLA_CELLS[i];
    if (z > 40.2 && z < 47.8) continue;
    if (leftoverLotOverlap(x, z, 1.8, 1.8, 0.15)) continue;
    if (inKeepout(x, z, 0.6)) continue;
    const y = groundHeight(x, z);
    if (y < 0.2) continue;
    if (!clear(x, z, 0.9, y, 2.2)) continue;
    extraUmbrellas.push({ x, y, z, scale: 1.05, rotY: hash01(i, 2411) * Math.PI * 2 });
    addCyl(x, y, z, 0.08, 2.1);
  }
  await scatterSafe(ctx, 'parasol_a', extraUmbrellas, 'beach-umbrellas-signed');

  // Extra signed boardwalk benches + lamps. hash01 yaw only.
  // Skip keepouts / leftoverLot / travel. Do not restack loops above.
  const extraBenches = [];
  for (let i = 0; i < BOARDWALK_BENCH_CELLS.length; i++) {
    const [x, z] = BOARDWALK_BENCH_CELLS[i];
    if (x >= 240) continue;
    if (z > 40.2 && z < 47.8) continue;
    if (leftoverLotOverlap(x, z, 1.8, 0.7, 0.15)) continue;
    if (inKeepout(x, z, 0.6)) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
    if (Math.abs(x - PIER_X) < 12) continue;
    if ([-80, -20, 40, 160, 220].some((ax) => Math.abs(x - ax) < 8)) continue;
    const y = deckTop(x, z);
    if (!Number.isFinite(y) || y < BOARDWALK_TOP - 0.01) continue;
    if (!clear(x, z, 1.0, y, 0.9)) continue;
    extraBenches.push({ x, y, z, scale: 1.0, rotY: Math.PI / 2 + (hash01(i, 2501) - 0.5) * 0.12 });
    addCollider(x, y, z, 1.78, 0.99, 0.66);
  }
  await scatterSafe(ctx, 'modular_street_seating', extraBenches, 'boardwalk-benches-signed');

  const extraLamps = [];
  for (let i = 0; i < BOARDWALK_LAMP_CELLS.length; i++) {
    const [x, z] = BOARDWALK_LAMP_CELLS[i];
    if (x >= 240) continue;
    if (z > 40.2 && z < 47.8) continue;
    if (leftoverLotOverlap(x, z, 0.4, 0.4, 0.15)) continue;
    if (inKeepout(x, z, 0.6)) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
    if (Math.abs(x - PIER_X) < 12) continue;
    if ([-80, -20, 40, 160, 220].some((ax) => Math.abs(x - ax) < 8)) continue;
    const y = deckTop(x, z);
    if (!Number.isFinite(y) || y < BOARDWALK_TOP - 0.01) continue;
    if (!clear(x, z, 0.22, y, 1.1)) continue;
    extraLamps.push({ x, y, z, scale: 0.42, rotY: hash01(i, 2511) * Math.PI * 2 });
    addCyl(x, y, z, 0.15, 1.08);
  }
  await scatterSafe(ctx, 'street_light_square', extraLamps, 'boardwalk-lamps-signed');

  // Signed ped-signal extras + flex posts at CROSS_X zebras. Authored geos
  // (buildPedSignalGeo / buildBollardFlexGeo), not rejected Kenney heads/cones.
  // hash01 yaw only. Skip keepouts / leftoverLot / travel. Do not restack
  // loops above. Plan already owns the four city-walk heads at ±(XS_HALF+0.9).
  setTag('traffic-control');
  const pedSignals = [];
  for (let i = 0; i < PED_SIGNAL_CELLS.length; i++) {
    const [x, z] = PED_SIGNAL_CELLS[i];
    if (x >= 240) continue;
    if (z > 40.2 && z < 47.8) continue;
    if (leftoverLotOverlap(x, z, 0.35, 0.2, 0.15)) continue;
    if (inKeepout(x, z, 0.6)) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.28, y, 0.7)) continue;
    const towardRoad = z < 44 ? 0 : Math.PI;
    const rotY = towardRoad + (hash01(i, 2601) - 0.5) * 0.1;
    pedSignals.push({ x, y, z, rotY });
    addOBB(x, y, z, 0.35, 0.7, 0.2, rotY);
  }
  const pedMat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.55, metalness: 0.12,
    emissive: 0xffd27a, emissiveIntensity: 0,
  });
  if (ctx.regDN) ctx.regDN(pedMat, 0, 1.15);
  instanceAuthored(ctx, buildPedSignalGeo(), pedMat, pedSignals, 'crosswalk-ped-signals');

  const flexPosts = [];
  for (let i = 0; i < FLEX_POST_CELLS.length; i++) {
    const [x, z] = FLEX_POST_CELLS[i];
    if (x >= 240) continue;
    if (z > 40.2 && z < 47.8) continue;
    if (leftoverLotOverlap(x, z, 0.22, 0.22, 0.15)) continue;
    if (inKeepout(x, z, 0.6)) continue;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.12, y, 0.85)) continue;
    flexPosts.push({ x, y, z, rotY: hash01(i, 2611) * Math.PI * 2 });
    addCyl(x, y, z, 0.08, 0.85);
  }
  instanceAuthored(ctx, buildBollardFlexGeo(), new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.72, metalness: 0.08,
  }), flexPosts, 'crosswalk-flex-posts');

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
