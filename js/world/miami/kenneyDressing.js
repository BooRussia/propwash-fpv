import { CITY_Y, PIER_X, GAP_X, groundHeight, inKeepout } from './constants.js';
import { scatterModels } from '../vegetation.js';

// Kenney CC0 GLBs (assets/models/<slug>/<slug>.glb + Textures/colormap.png).
// Positions are hash-driven so rng/rng2/rng3/rng4 streams stay untouched.
// Each Kenney mesh is authored 6-sided (atlas colormap), not a window photo
// wrapped onto a box.

function hash01(a, b) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2545f491);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

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
 * Extra Kenney street furniture + a far authored-skyline row.
 * Call AFTER colliders exist. Missing GLBs no-op.
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

  // Stop signs at the signed Ocean Drive gaps.
  const signs = [];
  for (let i = 0; i < GAP_X.length; i++) {
    const x = GAP_X[i] + 3.4;
    const z = 50.6;
    const y = groundHeight(x, z);
    if (!clear(x, z, 0.25, y, 2.6)) continue;
    signs.push({ x, y, z, scale: 1.0, rotY: Math.PI });
    addCyl(x, y, z, 0.12, 2.5);
  }
  await scatterSafe(ctx, 'stop_sign', signs, 'kenney-stop-signs');

  // Far authored skyline — Kenney buildings already have separate roof/wall
  // materials. Sit them behind the cheap 60-box LOD (z 300–620).
  const far = [];
  const farSlugs = [
    { slug: 'kenney_skyscraper_a', n: 5, size: 38 },
    { slug: 'kenney_skyscraper_c', n: 4, size: 42 },
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

  setTag('world');
  return { dumpsters: dumpsters.length, lights: lights.length, far: far.length };
}
