import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { assetLib } from '../../core/assets.js';
import { scatterModels, createPalms } from '../vegetation.js';
import {
  CITY_Y, PIER_X, groundHeight, baseProfile, sandNoise, inReserved, inKeepout,
} from './constants.js';
import { foliageTexture, parkingTexture, setAoUVs } from './textures.js';

/**
 * Materialise everything green the street-level pass laid out: clipped hedges,
 * mulch beds, flower clusters, lawns, surface parking, tree grates and the two
 * instanced palm fields. Spots inside a hero-landmark reservation are dropped
 * here (filtering after the draws keeps the rng4 sequence intact).
 * Returns { palmsEntry } for update/dispose.
 */
export async function buildLandscaping(ctx, spots) {
  const { root, track, rng4, blocked, addCyl, setTag } = ctx;
  setTag('planting');
  const keep = (arr) => arr.filter((s) => !inReserved(s.x, s.z));
  // A planted tree may stand close to a facade — that is what a street tree
  // does — but its crown may never be INSIDE one. Trunk probe at grade, crown
  // probe up in the canopy band.
  const treeFits = (s) => {
    const sc = s.sc || 1;
    if (inKeepout(s.x, s.z, 0.6)) return false;
    if (blocked(s.x, s.z, 0.75, CITY_Y - 0.2, CITY_Y + 2.2)) return false;
    if (blocked(s.x, s.z, 3.45 * sc, CITY_Y + 3.4, CITY_Y + 7.6 * sc)) return false;
    return true;
  };
  const hedgeSpots = keep(spots.hedgeSpots);
  const mulchSpots = keep(spots.mulchSpots);
  const flowerSpots = keep(spots.flowerSpots);
  const lawnSpots = keep(spots.lawnSpots);
  const lotSpots = keep(spots.lotSpots);
  const grateSpots = keep(spots.grateSpots);
  const palmSpots = keep(spots.palmSpots).filter(treeFits);
  const blockPalmSpots = keep(spots.blockPalmSpots).filter(treeFits);
  spots.entranceShrubSpots = keep(spots.entranceShrubSpots);

  const q4 = new THREE.Quaternion();
  const e4 = new THREE.Euler();
  const v4 = new THREE.Vector3();
  const s4 = new THREE.Vector3();
  const m4c = new THREE.Matrix4();
  const c4 = new THREE.Color();
  const placeAll = (im, list, fill) => {
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      e4.set(0, s.ry || 0, 0);
      q4.setFromEuler(e4);
      v4.set(s.x, s.y !== undefined ? s.y : CITY_Y, s.z);
      s4.set(s.sx || 1, s.sy || 1, s.sz || 1);
      m4c.compose(v4, q4, s4);
      im.setMatrixAt(i, m4c);
      if (fill) fill(im, i, s);
    }
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    root.add(im);
    return im;
  };

  if (hedgeSpots.length) {
    // rounded box + mottled foliage sheet + deep, desaturated greens: clipped
    // hedge instead of the bright plastic loaf a flat colour gives
    // 1 subdivision, not 3: ~1600 hedge instances at 588 tris each cost 0.9 M
    // triangles a frame — the rounded silhouette survives the drop, the cost
    // does not.
    const hedgeGeo = track(new RoundedBoxGeometry(1.8, 0.8, 0.75, 1, 0.24));
    const folTex = track(foliageTexture());
    folTex.repeat.set(2.5, 1.6);
    const hedgeMat = track(new THREE.MeshStandardMaterial({
      map: folTex, color: 0xffffff, roughness: 1, metalness: 0,
    }));
    const hedges = new THREE.InstancedMesh(hedgeGeo, hedgeMat, hedgeSpots.length);
    const HEDGE_COLS = [0x5f7a4a, 0x6a8450, 0x546e42, 0x718a55, 0x4d6b3f];
    placeAll(hedges, hedgeSpots, (im, i) => {
      im.setColorAt(i, c4.setHex(HEDGE_COLS[(rng4() * HEDGE_COLS.length) | 0])
        .offsetHSL((rng4() - 0.5) * 0.03, 0, (rng4() - 0.5) * 0.07));
    });
    hedges.castShadow = true;
    hedges.receiveShadow = true;
  }
  if (lotSpots.length) {
    // surface parking: real city fabric between the tower rows
    const lotGeo = track(new THREE.PlaneGeometry(30, 18));
    lotGeo.rotateX(-Math.PI / 2);
    const lotTex = track(parkingTexture());
    lotTex.repeat.set(30 / 22, 18 / 17);
    const lotMat = track(new THREE.MeshStandardMaterial({
      map: lotTex, roughness: 0.95, metalness: 0,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }));
    for (const s of lotSpots) s.y = CITY_Y + 0.015;
    const lots = placeAll(new THREE.InstancedMesh(lotGeo, lotMat, lotSpots.length), lotSpots);
    lots.receiveShadow = true;
  }
  if (grateSpots.length) {
    const grateGeo = track(new THREE.RingGeometry(0.62, 1.15, 10, 1));
    grateGeo.rotateX(-Math.PI / 2);
    const grateMat = track(new THREE.MeshStandardMaterial({
      color: 0x3a3d40, roughness: 0.65, metalness: 0.45, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    }));
    placeAll(new THREE.InstancedMesh(grateGeo, grateMat, grateSpots.length), grateSpots);
  }
  if (mulchSpots.length) {
    const mulchGeo = track(new RoundedBoxGeometry(1.55, 0.26, 1.1, 1, 0.09));
    const mulchMat = track(new THREE.MeshStandardMaterial({ color: 0x38302a, roughness: 1 }));
    placeAll(new THREE.InstancedMesh(mulchGeo, mulchMat, mulchSpots.length), mulchSpots);
  }
  if (flowerSpots.length) {
    const flowGeo = track(new THREE.SphereGeometry(0.17, 6, 4));
    flowGeo.scale(1, 0.68, 1);
    const flowMat = track(new THREE.MeshStandardMaterial({ roughness: 0.75 }));
    placeAll(new THREE.InstancedMesh(flowGeo, flowMat, flowerSpots.length),
      flowerSpots, (im, i, s) => im.setColorAt(i, c4.setHex(s.hex)));
  }
  if (lawnSpots.length) {
    const lawnGeo = track(new THREE.PlaneGeometry(9, 5.5));
    lawnGeo.rotateX(-Math.PI / 2);
    setAoUVs(lawnGeo);
    let lawnMat;
    const lawnSet = await assetLib.textureSet('grass_lawn');
    if (lawnSet.map) {
      lawnMat = await assetLib.pbrMaterial('grass_lawn', { repeat: [7, 4.5] });
    } else {
      lawnMat = track(new THREE.MeshStandardMaterial({ color: 0x4c7a3d, roughness: 1 }));
    }
    lawnMat.polygonOffset = true;
    lawnMat.polygonOffsetFactor = -2;
    lawnMat.polygonOffsetUnits = -2;
    // NOTE: no material.vertexColors here — the plane carries no colour
    // attribute, and USE_COLOR without one resolves to black. InstancedMesh
    // per-instance colour (setColorAt) works on its own.
    for (const s of lawnSpots) s.y = CITY_Y + 0.025;
    const lawns = placeAll(new THREE.InstancedMesh(lawnGeo, lawnMat, lawnSpots.length), lawnSpots, (im, i) => {
      im.setColorAt(i, c4.setHSL(0.26 + (rng4() - 0.5) * 0.05, 0.1 + rng4() * 0.14, 0.74 + rng4() * 0.14));
    });
    lawns.receiveShadow = true;
  }

  // entrance + block palms (one instanced field; sways like the rest)
  let palmsEntry = null;
  const allEntryPalms = palmSpots.concat(blockPalmSpots);
  if (allEntryPalms.length) {
    try {
      palmsEntry = await createPalms(allEntryPalms.length);
      for (let i = 0; i < allEntryPalms.length; i++) {
        const p = allEntryPalms[i];
        palmsEntry.placeAt(i, p.x, CITY_Y, p.z, p.sc, p.ry);
      }
      palmsEntry.finalize(allEntryPalms.length);
      palmsEntry.group.name = 'palm-field-entry';
      root.add(palmsEntry.group);
    } catch (e) {
      console.warn('[miami] entrance palms skipped:', e);
      palmsEntry = null;
    }
  }
  // street trees are solid too — trunk cylinders where a pilot can reach them
  for (const p of allEntryPalms) {
    if (Math.abs(p.x) > 420 || p.z > 150) continue;
    addCyl(p.x, CITY_Y, p.z, 0.3 * (p.sc || 1), 6.2 * (p.sc || 1));
  }
  setTag('world');
  return { palmsEntry };
}

/**
 * Photoscan rocks + tropical shrubs/ferns (rng2 only).
 *
 * Every placement here is rejection-tested against the live collider bag and
 * the ground keep-outs: nothing scattered may end up inside a structure.
 */
export async function buildDressing(ctx, towerData, entranceShrubSpots) {
  const { root, scatterHandles, rng2, blocked, addSphere, setTag } = ctx;
  setTag('dressing');

  const scatterSafe = async (slug, placements, name) => {
    if (!placements || !placements.length) return;
    try {
      const h = await scatterModels(root, slug, placements, null, 0);
      if (h) {
        if (h.group) h.group.name = name || `scatter-${slug}`;
        scatterHandles.push(h);
      }
    } catch (e) {
      console.warn(`[miami] scatter '${slug}' skipped:`, e);
    }
  };
  // a shrub/rock clears if nothing solid shares its cylinder
  const clear = (x, z, r, y0, h) => !inKeepout(x, z, 0.6) && !blocked(x, z, r, y0, y0 + h);

  {
    // breakwater — half-submerged boulders along the waterline, x 120..260
    const seabed = (x, z) => baseProfile(z) + sandNoise(x, z) * Math.max(0, 1 - Math.abs(z) / 60);
    const bwBoulders = [], bwRocks = [];
    for (let i = 0; i < 14; i++) {
      const x = 122 + i * 10.3 + (rng2() - 0.5) * 4;
      const z = -30.5 - rng2() * 6;
      const sc = 1.5 + rng2() * 1.5;
      const y = seabed(x, z) - 0.12 * sc;
      if (!clear(x, z, 1.1 * sc, y, 1.4 * sc)) continue;
      const item = { x, y, z, scale: sc, rotY: rng2() * Math.PI * 2 };
      (i % 2 ? bwRocks : bwBoulders).push(item);
      // scatterModels' own collider path wants a {w,h} object and is fed a
      // number by every caller, so it silently produces none. A boulder is a
      // sphere anyway — this is both the right shape and actually present.
      addSphere(x, y + 0.55 * sc, z, 1.05 * sc);
    }
    await scatterSafe('boulder_01', bwBoulders, 'breakwater-boulders');
    await scatterSafe('rock_07', bwRocks, 'breakwater-rocks');

    // small photoscan rocks scattered on the sand (no colliders — ankle high)
    const beachRocks = [];
    let tries = 0;
    while (beachRocks.length < 10 && tries++ < 90) {
      const x = -520 + rng2() * 1060;
      const z = 3 + rng2() * 15;
      if (Math.abs(x - PIER_X) < 15) continue;                    // pier
      const y = groundHeight(x, z);
      if (y < 0.15) continue;
      if (!clear(x, z, 0.6, y, 0.6)) continue;
      beachRocks.push({ x, y: y - 0.05, z, scale: 0.35 + rng2() * 0.45, rotY: rng2() * Math.PI * 2 });
    }
    await scatterSafe('rock_07', beachRocks, 'beach-rocks');
  }
  {
    // shrubs + broadleafs along boardwalk planters and between road and beach
    const s02 = [], s03 = [], anth = [];
    let placedS = 0, tries = 0;
    while (placedS < 40 && tries++ < 400) {
      const planter = rng2() < 0.55;
      const x = -580 + rng2() * 1160;
      const z = planter ? 31.8 + rng2() * 4.6 : 18 + rng2() * 6;
      if (z < 21.8) continue;                                 // kiss = drop
      if (Math.abs(x - PIER_X) < 14) continue;
      const y = groundHeight(x, z);
      if (y < 0.25) continue;
      const scale = 0.8 + rng2() * 0.7;
      if (!clear(x, z, 0.95 * scale, y, 1.6 * scale)) continue;
      const item = { x, y: y - 0.03, z, scale, rotY: rng2() * Math.PI * 2 };
      const pick = placedS % 4;
      (pick === 3 ? anth : pick === 1 ? s03 : s02).push(item);
      placedS++;
    }
    await scatterSafe('shrub_02', s02, 'shrubs-a');
    await scatterSafe('shrub_03', s03, 'shrubs-b');
    await scatterSafe('anthurium_botany_01', anth, 'anthuriums');
    // storefront/lawn accents collected by the street-level pass (rng4)
    await scatterSafe('shrub_03',
      entranceShrubSpots.filter((s) => clear(s.x, s.z, 0.7 * (s.scale || 1), s.y || CITY_Y, 1.4)),
      'entrance-shrubs');

    // fern clusters at the front-row tower bases
    const ferns = [];
    for (const t of towerData) {
      if (ferns.length >= 20) break;
      if (t.z > 110 || Math.abs(t.x) > 320) continue;
      const n = 2 + ((rng2() * 2) | 0);
      for (let k = 0; k < n && ferns.length < 20; k++) {
        const fx = t.x - t.w / 2 + rng2() * t.w;
        const fz = t.z - t.d / 2 - 1.2 - rng2() * 1.8;
        const scale = 0.8 + rng2() * 0.6;
        if (fz < 52.5) continue;                                  // keep off the road
        if (!clear(fx, fz, 0.8 * scale, CITY_Y, 1.3 * scale)) continue;
        ferns.push({ x: fx, y: CITY_Y, z: fz, scale, rotY: rng2() * Math.PI * 2 });
      }
    }
    await scatterSafe('fern_02', ferns, 'ferns');
  }
  setTag('world');
}
