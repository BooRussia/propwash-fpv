import { scatterModels } from '../vegetation.js';
import {
  CITY_Y, PIER_X, WHEEL_X, groundHeight, baseProfile, sandNoise,
} from './constants.js';

/** Photoscan rocks + tropical shrubs/ferns (rng2 only). */
export async function buildDressing(ctx, towerData) {
  const { root, colliders, scatterHandles, rng2 } = ctx;

  const scatterSafe = async (slug, placements, colliderList, colliderSize) => {
    if (!placements.length) return;
    try {
      const h = await scatterModels(root, slug, placements, colliderList, colliderSize);
      if (h) scatterHandles.push(h);
    } catch (e) {
      console.warn(`[miami] scatter '${slug}' skipped:`, e);
    }
  };
  {
    // breakwater — half-submerged boulders along the waterline, x 120..260
    const seabed = (x, z) => baseProfile(z) + sandNoise(x, z) * Math.max(0, 1 - Math.abs(z) / 60);
    const bwBoulders = [], bwRocks = [];
    for (let i = 0; i < 14; i++) {
      const x = 122 + i * 10.3 + (rng2() - 0.5) * 4;
      const z = -30.5 - rng2() * 6;
      const sc = 1.5 + rng2() * 1.5;
      const item = { x, y: seabed(x, z) - 0.12 * sc, z, scale: sc, rotY: rng2() * Math.PI * 2 };
      (i % 2 ? bwRocks : bwBoulders).push(item);
    }
    await scatterSafe('boulder_01', bwBoulders, colliders, 2.2);
    await scatterSafe('rock_07', bwRocks, colliders, 2.2);

    // small photoscan rocks scattered on the sand (no colliders)
    const beachRocks = [];
    let tries = 0;
    while (beachRocks.length < 10 && tries++ < 60) {
      const x = -520 + rng2() * 1060;
      const z = 3 + rng2() * 15;
      if (Math.abs(x - PIER_X) < 15) continue;                    // pier
      if (x > 42 && x < 112 && z < 22) continue;                  // MIAMI sign
      if (Math.abs(x) < 7 && Math.abs(z - 8) < 7) continue;       // spawn pad
      const y = groundHeight(x, z);
      if (y < 0.15) continue;
      beachRocks.push({ x, y: y - 0.05, z, scale: 0.35 + rng2() * 0.45, rotY: rng2() * Math.PI * 2 });
    }
    await scatterSafe('rock_07', beachRocks, null, 0);
  }
  {
    // shrubs + broadleafs along boardwalk planters and between road and beach
    const s02 = [], s03 = [], anth = [];
    let placedS = 0, tries = 0;
    while (placedS < 40 && tries++ < 240) {
      const planter = rng2() < 0.55;
      const x = -580 + rng2() * 1160;
      const z = planter ? 31.8 + rng2() * 4.6 : 18 + rng2() * 6;
      if (Math.abs(x - PIER_X) < 14) continue;
      if (Math.abs(x - WHEEL_X) < 16 && z > 30) continue;         // ferris wheel base
      if (x > 42 && x < 112 && z < 26) continue;                  // MIAMI sign
      const y = groundHeight(x, z);
      if (y < 0.25) continue;
      const item = { x, y: y - 0.03, z, scale: 0.8 + rng2() * 0.7, rotY: rng2() * Math.PI * 2 };
      const pick = placedS % 4;
      (pick === 3 ? anth : pick === 1 ? s03 : s02).push(item);
      placedS++;
    }
    await scatterSafe('shrub_02', s02, null, 0);
    await scatterSafe('shrub_03', s03, null, 0);
    await scatterSafe('anthurium_botany_01', anth, null, 0);

    // fern clusters at the front-row tower bases
    const ferns = [];
    for (const t of towerData) {
      if (ferns.length >= 20) break;
      if (t.z > 110 || Math.abs(t.x) > 320) continue;
      const n = 2 + ((rng2() * 2) | 0);
      for (let k = 0; k < n && ferns.length < 20; k++) {
        const fx = t.x - t.w / 2 + rng2() * t.w;
        const fz = t.z - t.d / 2 - 1.2 - rng2() * 1.8;
        if (fz < 52.5) continue;                                  // keep off the road
        ferns.push({ x: fx, y: CITY_Y, z: fz, scale: 0.8 + rng2() * 0.6, rotY: rng2() * Math.PI * 2 });
      }
    }
    await scatterSafe('fern_02', ferns, null, 0);
  }
}
