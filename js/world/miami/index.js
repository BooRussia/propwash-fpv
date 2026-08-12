// ============================================================
// PropWash FPV — Miami Skyline map (assembled)
// Tropical high-rise beach city: ocean, beach, boardwalk, pier,
// Ocean Drive, art-deco + glass skyline, ferris wheel, marina.
// Photoreal pass: CC0 PBR ground/road/facades via AssetLibrary,
// photoscan rocks + tropical vegetation via vegetation.js.
// Every asset degrades gracefully — with an empty assets/ folder
// the map still builds with the original procedural look.
// ============================================================
import * as THREE from 'three';
import { settings, clamp } from '../../core/state.js';
import { assetLib } from '../../core/assets.js';

import { groundHeight } from './constants.js';
import { mulberry32 } from './rng.js';
import { createColliderBag } from './colliders.js';
import { buildGround, buildOcean } from './terrain.js';
import { buildPier } from './landmarks/pier.js';
import { buildRoad } from './road.js';
import { buildPalms } from './palms.js';
import { buildBeachProps } from './landmarks/beachProps.js';
import { buildStreet } from './street.js';
import { buildSkyline, buildHelipads } from './buildings.js';
import { buildFerris } from './landmarks/ferris.js';
import { buildSign } from './landmarks/sign.js';
import { buildMarina } from './landmarks/marina.js';
import { buildDressing } from './dressing.js';
import { buildPoints } from './points.js';

export async function buildMiami(scene, env) {
  const rng = mulberry32(20250809);
  // Second stream for all NEW dressing (rocks, shrubs, hero palms, vertex tint).
  // The main `rng` stream must keep its exact legacy draw sequence so the
  // deterministic tower/hut/car layout stays bit-identical to the old build.
  const rng2 = mulberry32(0x5eaf00d);
  // Third stream for the props-v2 pass (facade UV offsets, parasol tilts,
  // boat accents…). Never draw from rng or rng2 for new features.
  const rng3 = mulberry32(0xFACADE5);
  const root = new THREE.Group();
  root.name = 'miami';
  scene.add(root);

  const disposables = [];   // geometries/materials/textures
  const scatterHandles = [];
  const track = (obj) => { disposables.push(obj); return obj; };
  const { colliders, addCollider } = createColliderBag();

  // ---------------- environment HDRIs ----------------
  if (env.setHDRIBands) {
    env.setHDRIBands({ day: 'beach_day', sunset: 'sunset', night: 'night', overcast: 'overcast' });
  }

  // Legacy-stream preservation: the old single ground mesh consumed one rng()
  // draw per vertex (151 x 77 grid). Burn the same count so every downstream
  // rng-derived position (palms, huts, towers, cars…) lands exactly where it
  // always has. DO NOT add or remove main-rng draws before the layout sections.
  for (let i = 0; i < 151 * 77; i++) rng();

  // ---------------- shared PBR texture sets (each key may be absent) ----------------
  const [sandSet, sidewalkSet, asphaltSet, roadLinesSet, glassSet, facadeDaySet] = await Promise.all([
    assetLib.textureSet('sand_beach'),
    assetLib.textureSet('sidewalk'),
    assetLib.textureSet('asphalt'),
    assetLib.textureSet('road_lines'),
    assetLib.textureSet('facade_glass'),
    assetLib.textureSet('facade_day'),
  ]);

  const ctx = {
    root, track, addCollider, colliders, scatterHandles,
    rng, rng2, rng3,
    sandSet, sidewalkSet, asphaltSet, roadLinesSet, glassSet, facadeDaySet,
  };

  // ---------------- ground: beach mesh + city mesh ----------------
  await buildGround(ctx);

  // ---------------- ocean ----------------
  const { water } = await buildOcean(ctx);

  // ---------------- boardwalk + pier ----------------
  buildPier(ctx);

  // ---------------- Ocean Drive road ----------------
  await buildRoad(ctx);

  // ---------------- palms ----------------
  const { palms } = await buildPalms(ctx);

  // ---------------- beach props: lifeguard towers + parasols + towels ----------------
  buildBeachProps(ctx);

  // ---------------- streetlights + parked cars ----------------
  buildStreet(ctx);

  // ---------------- skyline ----------------
  const sky = buildSkyline(ctx);

  // ---------------- ferris wheel ----------------
  const { wheel } = buildFerris(ctx);

  // ---------------- MIAMI sign ----------------
  buildSign(ctx);

  // ---------------- marina ----------------
  const { boats } = buildMarina(ctx);

  // ---------------- helipad towers ----------------
  buildHelipads(ctx, sky);

  // ---------------- photoscan rocks + tropical dressing (rng2 only) ----------------
  await buildDressing(ctx, sky.towerData);

  // ---------------- spawn / gates / retrieval ----------------
  const { spawnPos, gates, retrievalPoints } = buildPoints(ctx, sky.towerData);

  // ---------------- handle ----------------
  let time = 0;
  return {
    name: 'Miami Skyline',
    spawn: { position: spawnPos, yawRad: Math.PI / 2 },
    getGroundHeight: groundHeight,
    colliders,
    gates,
    retrievalPoints,
    homePad: spawnPos.clone(),
    update(dt) {
      time += dt;
      if (water) {
        water.material.uniforms['time'].value += dt * 0.6;
        // water must go dark at night — the Water shader has its own sun
        const tod = settings.environment.timeOfDay;
        const dayF = Math.max(0.03, Math.sin(Math.PI * clamp((tod - 6.2) / 13.2, 0, 1)));
        water.material.uniforms['sunColor'].value.setScalar(dayF);
        water.material.uniforms['waterColor'].value.setHex(0x00404f).multiplyScalar(0.12 + 0.88 * dayF);
      }
      wheel.rotation.z += dt * 0.12;
      // keep cabins upright
      for (const child of wheel.children) {
        if (child.userData.angle !== undefined) child.rotation.z = -wheel.rotation.z;
      }
      for (const b of boats) {
        b.position.y = 0.35 + Math.sin(time * 1.1 + b.userData.phase) * 0.12;
        b.rotation.x = Math.sin(time * 0.9 + b.userData.phase) * 0.03;
      }
      if (palms) palms.update(dt);
    },
    dispose(sceneRef) {
      sceneRef.remove(root);
      try { palms?.dispose?.(); } catch (e) { /* noop */ }
      for (const h of scatterHandles) { try { h.dispose?.(); } catch (e) { /* noop */ } }
      for (const d of disposables) { try { d.dispose?.(); } catch (e) { /* noop */ } }
    },
  };
}
