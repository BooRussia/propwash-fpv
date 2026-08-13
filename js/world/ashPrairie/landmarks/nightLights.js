import * as THREE from 'three';
import {
  RAIL, STACK, SPAWN, SWITCHYARD, DUMP_CANOPY, COOP, TURBINE, ADMIN,
  TOWER_SITES, ELEVATORS, ANTENNA_FARM, GROUND_Y, PAL,
} from '../constants.js';
import { addCyl } from '../textures.js';

/**
 * Sparse documentary night (~21:00): PointLights + tiny bulb emissives.
 * Gated in index applyDayNight when nightF > 0.35.
 * No cyan / purple / strobe.
 */
export function buildNightLights(ctx) {
  const { root, track, mats } = ctx;

  const coolBulb = track(new THREE.MeshStandardMaterial({
    color: 0x2a2c2e,
    emissive: PAL.beaconCool ?? 0xD8DCE0,
    emissiveIntensity: 0,
    roughness: 0.45,
    metalness: 0.2,
  }));
  const amberBulb = track(new THREE.MeshStandardMaterial({
    color: 0x2a2418,
    emissive: PAL.beaconAmber ?? 0xC4A35A,
    emissiveIntensity: 0,
    roughness: 0.45,
    metalness: 0.15,
  }));
  const warmBulb = track(new THREE.MeshStandardMaterial({
    color: 0x2a2820,
    emissive: 0xE8D4A8,
    emissiveIntensity: 0,
    roughness: 0.5,
    metalness: 0.1,
  }));
  const adminBulb = track(new THREE.MeshStandardMaterial({
    color: 0x2a2824,
    emissive: 0xEDE8DC,
    emissiveIntensity: 0,
    roughness: 0.55,
    metalness: 0.05,
  }));

  mats.nightLights = [warmBulb, adminBulb];
  mats.beacon = [coolBulb, amberBulb];
  mats.nightEmit = [coolBulb, amberBulb, warmBulb, adminBulb];
  mats.nightPointLights = [];

  const bulbGeo = track(new THREE.SphereGeometry(0.22, 10, 8));

  function addPoint(color, intensity, distance, x, y, z, bulbMat) {
    const pl = new THREE.PointLight(color, 0, distance, 2);
    pl.position.set(x, y, z);
    root.add(pl);
    mats.nightPointLights.push({ light: pl, baseIntensity: intensity });
    if (bulbMat) {
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(x, y, z);
      root.add(bulb);
    }
    return pl;
  }

  // 3× tower tops — cool obstruction
  for (const t of TOWER_SITES) {
    addPoint(PAL.beaconCool ?? 0xD8DCE0, 0.65, 80, t.x, GROUND_Y + t.h + 0.6, t.z, coolBulb);
  }

  // 1× stack amber
  addPoint(PAL.beaconAmber ?? 0xC4A35A, 0.85, 100, STACK.x, GROUND_Y + STACK.h + 0.8, STACK.z, amberBulb);

  // 1× elevator head amber
  const elevHeadY = GROUND_Y + ELEVATORS.h + ELEVATORS.headH + 1.2;
  addPoint(PAL.beaconAmber ?? 0xC4A35A, 0.55, 50, ELEVATORS.x, elevHeadY, ELEVATORS.z, amberBulb);

  // ≤4 yard floods — warm desat
  const floods = [
    [SWITCHYARD.x, SWITCHYARD.z - SWITCHYARD.d / 2 + 6, 9.5],
    [DUMP_CANOPY.x, DUMP_CANOPY.z, 8.5],
    [COOP.x - 8, COOP.z + COOP.d / 2 + 2, 8.0],
    [TURBINE.x + TURBINE.w / 2 - 4, TURBINE.z + TURBINE.d / 2 + 2, 8.5],
  ];
  for (const [x, z, h] of floods) {
    addCyl(ctx, mats, 'galv', x, GROUND_Y, z, 0.1, 0.14, h, { seg: 8 });
    addPoint(0xE8D4A8, 0.32, 40, x, GROUND_Y + h, z, warmBulb);
  }

  // 2 dim admin indoor
  const A = ADMIN;
  addPoint(0xEDE8DC, 0.2, 12, A.x - 3, GROUND_Y + A.h - 0.4, A.z, adminBulb);
  addPoint(0xEDE8DC, 0.18, 12, A.x + 4, GROUND_Y + A.h - 0.4, A.z + 2, adminBulb);

  // Optional 1 LF antenna tip (cool, dim)
  let ax, az;
  if (ANTENNA_FARM.x0 != null) {
    ax = (ANTENNA_FARM.x0 + ANTENNA_FARM.x1) / 2;
    az = (ANTENNA_FARM.z0 + ANTENNA_FARM.z1) / 2;
  } else {
    ax = ANTENNA_FARM.x; az = ANTENNA_FARM.z;
  }
  addPoint(PAL.beaconCool ?? 0xD8DCE0, 0.3, 25, ax, GROUND_Y + 42.5, az, coolBulb);

  // Tiny pad markers (visual only — intensity gated with nightEmit)
  for (const [x, z] of [[SPAWN.x - 6, SPAWN.z - 8], [RAIL.x0 + 90, RAIL.z + 4]]) {
    const m = new THREE.Mesh(bulbGeo, warmBulb);
    m.position.set(x, GROUND_Y + 0.15, z);
    root.add(m);
  }
}
