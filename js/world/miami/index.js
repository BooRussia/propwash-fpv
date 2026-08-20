// ============================================================
// PropWash FPV — Miami Skyline map (assembled)
// Tropical high-rise beach city: ocean, beach, boardwalk, pier,
// Ocean Drive, art-deco + glass skyline, the Pier Park ferris wheel,
// Lummus Park pergola walk, volleyball courts, an art-deco cinema,
// the marina with its yacht club and fuel dock, lighthouse and
// convention centre.
// Photoreal pass: CC0 PBR ground/road/facades via AssetLibrary,
// photoscan rocks + tropical vegetation via vegetation.js.
// Every asset degrades gracefully — with an empty assets/ folder
// the map still builds with the original procedural look.
//
// BUILD ORDER MATTERS. Everything that scatters (palms, shrubs, rocks)
// runs AFTER every structure has published its colliders, so each
// position can be rejected against the real world instead of against a
// hand-maintained list of exclusion zones.
// ============================================================
import * as THREE from 'three';
import { settings, clamp } from '../../core/state.js';
import { assetLib } from '../../core/assets.js';

import { groundHeight, cameraFloor } from './constants.js';
import { mulberry32 } from './rng.js';
import { createColliderBag } from './colliders.js';
import { buildGround, buildOcean } from './terrain.js';
import { buildPier } from './landmarks/pier.js';
import { buildRoad } from './road.js';
import { planPalms, materializePalms } from './palms.js';
import { buildBeachProps } from './landmarks/beachProps.js';
import { buildStreet, buildStreetFurniture, buildBoardwalkEdge } from './street.js';
import { buildSkyline, cullReserved, buildStreetLevel, buildHelipads } from './buildings.js';
import { buildFerris } from './landmarks/ferris.js';
import { buildSign } from './landmarks/sign.js';
import { buildMarina } from './landmarks/marina.js';
import { buildArtDeco } from './landmarks/artdeco.js';
import { buildLighthouse } from './landmarks/lighthouse.js';
import { buildConvention } from './landmarks/convention.js';
import { buildLummus } from './landmarks/lummus.js';
import { buildVolleyball } from './landmarks/volleyball.js';
import { buildCinema } from './landmarks/cinema.js';
import { buildYachtClub } from './landmarks/yachtclub.js';
import { buildFlythrough } from './landmarks/flythrough.js';
import { buildAbando } from './landmarks/abando.js';
import { buildDrop } from './landmarks/drop.js';
import { buildWarehouse } from './landmarks/warehouse.js';
import { buildHouse } from './landmarks/house.js';
import { buildLeftoverLot } from './landmarks/leftoverLot.js';
import { buildGardenPath } from './landmarks/gardenPath.js';
import { buildLandscaping, buildDressing } from './dressing.js';
import { buildBlades } from './blades.js';
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
  // Fourth stream for the streetscape pass (vehicle kinds, furniture jitter,
  // landscaping, massing variants). rng/rng2/rng3 sequences stay untouched.
  const rng4 = mulberry32(0x0C0FFEE5);
  // Fifth stream owned entirely by the placement-rejection pass: every re-roll
  // of a palm/shrub that failed its collider test draws from here, so a
  // rejection can never shift anything else in the map.
  const rng5 = mulberry32(0x1EAFB0A7);
  const root = new THREE.Group();
  root.name = 'miami';
  scene.add(root);

  const disposables = [];   // geometries/materials/textures
  const scatterHandles = [];
  const track = (obj) => { disposables.push(obj); return obj; };
  const {
    colliders, addCollider, addCyl, addOBB, addSphere, setTag, blocked,
  } = createColliderBag();

  // Materials whose emissive is a night-only effect: { mat, day, night }.
  // regDN() registers one and immediately parks it at its daylight value.
  const dayNight = [];
  const regDN = (mat, day, night) => {
    dayNight.push({ mat, day, night });
    mat.emissiveIntensity = day;
    return mat;
  };

  // Additive light DECALS (lamp pools on the deck, the lighthouse beam shaft)
  // must be UNLIT. A MeshStandardMaterial painted black still returns the
  // dielectric specular term from the HDRI environment — roughly F0 = 0.04 of
  // the sky — and additive blending then paints that as a pale disc floating
  // over the scene in broad daylight. MeshBasicMaterial has no such term, so
  // black really is nothing; the night effect rides on the COLOUR instead of
  // on an emissive intensity.
  const dayNightCol = [];
  const regDNColor = (mat, nightHex, dayHex = 0x000000) => {
    const day = new THREE.Color(dayHex);
    const night = new THREE.Color(nightHex);
    dayNightCol.push({ mat, day, night });
    mat.color.copy(day);
    return mat;
  };

  // ---------------- environment HDRIs ----------------
  if (env.setHDRIBands) {
    // day uses the PURE sky (no baked ground content — photographic HDRIs shot
    // at ground level make their foreground trees look giant from the air)
    env.setHDRIBands({ day: 'day_clear', sunset: 'sunset', night: 'night', overcast: 'overcast' });
  }

  // Legacy-stream preservation: the old single ground mesh consumed one rng()
  // draw per vertex (151 x 77 grid). Burn the same count so every downstream
  // rng-derived position (palms, huts, towers, cars…) lands exactly where it
  // always has. DO NOT add or remove main-rng draws before the layout sections.
  for (let i = 0; i < 151 * 77; i++) rng();

  // ---------------- shared PBR texture sets (each key may be absent) ----------------
  const [
    sandSet, sidewalkSet, asphaltSet, roadLinesSet,
    glassSet, glassDaySet, officeSet,
  ] = await Promise.all([
    assetLib.textureSet('sand_beach'),
    assetLib.textureSet('sidewalk'),
    assetLib.textureSet('asphalt'),
    assetLib.textureSet('road_lines'),
    assetLib.textureSet('facade_glass'),      // NIGHT photo: emissive only
    assetLib.textureSet('facade_glass_day'),  // daytime curtain wall
    assetLib.textureSet('facade_office'),     // daytime mid-rise brick/window
  ]);

  const ctx = {
    root, track, colliders, scatterHandles,
    addCollider, addCyl, addOBB, addSphere, setTag, blocked,
    rng, rng2, rng3, rng4, rng5, regDN, regDNColor,
    sandSet, sidewalkSet, asphaltSet, roadLinesSet,
    glassSet, glassDaySet, officeSet,
    // transparent slabs shared by the bus shelter + hotel entrance canopies;
    // merged into one draw call by buildStreetLevel()
    glassPanelGeos: [],
    propMat: null,
    // curated palm rows requested by landmarks; resolved by materializePalms
    extraPalms: [],
  };

  // ---------------- ground: beach mesh + city mesh ----------------
  await buildGround(ctx);

  // ---------------- ocean ----------------
  const { water } = await buildOcean(ctx);

  // ---------------- boardwalk + pier ----------------
  buildPier(ctx);

  // ---------------- Ocean Drive: road, curbs, crosswalks, cross streets ----------------
  await buildRoad(ctx);

  // ---------------- palms: PLAN only (holds the legacy rng draw order) ------
  const palmPlan = planPalms(ctx);

  // ---------------- beach props: lifeguard towers + parasols + towels ----------------
  buildBeachProps(ctx);

  // ---------------- streetlights + parked vehicle fleet ----------------
  const street = await buildStreet(ctx);

  // ---------------- street furniture + boardwalk edge ----------------
  buildStreetFurniture(ctx, street);
  buildBoardwalkEdge(ctx);

  // ---------------- skyline ----------------
  const sky = buildSkyline(ctx);
  // clear the hero-landmark blocks before anything reads towerData
  cullReserved(ctx, sky);

  // ---------------- street level: storefronts, canopies, podiums, blocks ----------------
  const landscape = buildStreetLevel(ctx, sky, street);

  // ---------------- landmarks ----------------
  const { wheel } = buildFerris(ctx);
  buildSign(ctx);
  const { boats } = buildMarina(ctx);
  buildHelipads(ctx, sky);
  buildArtDeco(ctx);
  const lighthouse = buildLighthouse(ctx);
  buildConvention(ctx);
  buildLummus(ctx);
  buildVolleyball(ctx);
  buildCinema(ctx);
  buildYachtClub(ctx);

  // ---------------- fly-through kit (voids already in KEEPOUT; colliders now) --
  buildFlythrough(ctx);
  // ---------------- abando haunt (same keepout / tryPlace graph; jambs only) --
  buildAbando(ctx);
  // ---------------- drop haunt (leftover roof; same graph; well / door jambs) --
  buildDrop(ctx);
  // ---------------- warehouse haunt (leftover industrial; aisles + dock jambs) --
  buildWarehouse(ctx);
  // ---------------- house haunt (leftover residential; hall / stair / leaf) --
  buildHouse(ctx);
  // ---------------- leftover-city vacant lot (not a fifth haunt; tryPlace) --
  buildLeftoverLot(ctx);
  // ---------------- Tiny Glade garden path (tryPlace; not a haunt; not leftoverLot) --
  buildGardenPath(ctx);

  // ---------------- planting (hedges, beds, lawns, entrance palms) ----------------
  const { palmsEntry } = await buildLandscaping(ctx, landscape);

  // ---------------- palms: PLACE (rejection-tested against every collider) --
  const { palms } = await materializePalms(ctx, palmPlan);

  // ---------------- photoscan rocks + tropical dressing (rng2 only) ----------------
  await buildDressing(ctx, sky.towerData, landscape.entranceShrubSpots);

  // ---------------- leftover-dirt blades (tryPlace, after every reserve) ----------
  const blades = await buildBlades(ctx);

  // ---------------- spawn / gates / retrieval ----------------
  const { spawnPos, gates, retrievalPoints } = buildPoints(ctx, sky.towerData);

  // ---------------- handle ----------------
  let time = 0;
  let lastNightF = -1;
  const applyDayNight = () => {
    const tod = settings.environment.timeOfDay;
    const dayF = Math.sin(Math.PI * clamp((tod - 6.2) / 13.2, 0, 1));
    const nightF = clamp(1 - dayF * 2.1, 0, 1);
    if (Math.abs(nightF - lastNightF) < 0.006) return;
    lastNightF = nightF;
    for (const d of dayNight) d.mat.emissiveIntensity = d.day + (d.night - d.day) * nightF;
    for (const d of dayNightCol) d.mat.color.lerpColors(d.day, d.night, nightF);
  };
  applyDayNight();

  return {
    name: 'Miami Skyline',
    spawn: { position: spawnPos, yawRad: Math.PI / 2 },
    getGroundHeight: groundHeight,
    getCameraFloor: cameraFloor,
    colliders,
    gates,
    retrievalPoints,
    homePad: spawnPos.clone(),
    update(dt, extras = {}) {
      time += dt;
      applyDayNight();
      wheel.rotation.z += dt * 0.1;
      // keep cabins upright
      for (const child of wheel.children) {
        if (child.userData.angle !== undefined) child.rotation.z = -wheel.rotation.z;
      }
      for (const b of boats) {
        b.position.y = 0.35 + Math.sin(time * 1.1 + b.userData.phase) * 0.12;
        b.rotation.x = Math.sin(time * 0.9 + b.userData.phase) * 0.03;
      }
      // wakes stamp after the reserved-corridor bob — do not retarget boats
      if (water && typeof water.update === 'function') {
        water.update(dt, {
          boats,
          timeOfDay: settings.environment.timeOfDay,
        });
      }
      lighthouse.update(dt);
      if (palms) palms.update(dt);
      if (palmsEntry) palmsEntry.update(dt);
      // extras.craft is the drone — blades write that into the gust uniform.
      // A Vector3 second arg (legacy camera pos) is not a craft.
      if (blades) {
        const craft = extras && extras.isVector3 ? null : extras.craft;
        blades.update(dt, craft);
      }
    },
    dispose(sceneRef) {
      sceneRef.remove(root);
      try { palms?.dispose?.(); } catch (e) { /* noop */ }
      try { palmsEntry?.dispose?.(); } catch (e) { /* noop */ }
      try { blades?.dispose?.(); } catch (e) { /* noop */ }
      try { street.fleet?.dispose?.(); } catch (e) { /* noop */ }
      for (const h of scatterHandles) { try { h.dispose?.(); } catch (e) { /* noop */ } }
      for (const d of disposables) { try { d.dispose?.(); } catch (e) { /* noop */ } }
    },
  };
}
