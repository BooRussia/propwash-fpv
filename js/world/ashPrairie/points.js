import * as THREE from 'three';
import {
  groundHeight, SPAWN, PAD_Y, TOWER_SITES, CONTAINMENT, ELEVATORS,
  CONVEYOR, PIPE_RACK, SWITCHYARD, TURBINE, COOP, SILO_LF, STACK, DUMP_CANOPY,
  ADMIN, ANTENNA_FARM, BUCKET_ELEV, RUINS,
} from './constants.js';

/** Spawn pad mesh + race gates + retrieval points. */
export function buildPoints(ctx) {
  const { root, track, mats } = ctx;

  const gy = groundHeight(SPAWN.x, SPAWN.z);
  const spawnPos = new THREE.Vector3(SPAWN.x, gy + PAD_Y, SPAWN.z);
  {
    const padGeo = track(new THREE.CircleGeometry(2.4, 28));
    const pad = new THREE.Mesh(padGeo, mats.pad);
    pad.rotation.x = -Math.PI / 2;
    pad.position.copy(spawnPos).y += 0.02;
    root.add(pad);
    const ring = new THREE.Mesh(
      track(new THREE.RingGeometry(2.5, 2.85, 32)),
      track(new THREE.MeshStandardMaterial({ color: 0x8A7A2A, side: THREE.DoubleSide, roughness: 0.6 }))
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(spawnPos).y += 0.03;
    root.add(ring);
  }

  const G = (x, z, y, yawDeg, radius = 3.4) =>
    ({ position: new THREE.Vector3(x, y, z), yawRad: THREE.MathUtils.degToRad(yawDeg), radius });

  const t0 = TOWER_SITES[0];
  const t1 = TOWER_SITES[1];
  const gates = [
    G(0, 120, 6, 0),
    G(-40, 40, 8, -20),
    G((PIPE_RACK.x0 + PIPE_RACK.x1) / 2, 20, 6, 90, 2.8),
    G(CONVEYOR.x0 + 20, CONVEYOR.z, CONVEYOR.y - 2.2, 90, 2.6),
    G(ELEVATORS.x, ELEVATORS.z + 8, 12, 180),
    G(CONTAINMENT.x - 20, CONTAINMENT.z, 18, -40),
    G(t1.x, t1.z, t1.h * 0.55, 90, 4.0),
    G(t0.x + t0.baseR * 0.15, t0.z, 8, 0, 3.5),
    G(SILO_LF.x, SILO_LF.z, -SILO_LF.depth * 0.45, 0, 2.4),
    G(SWITCHYARD.x, SWITCHYARD.z, 10, 90),
    G(TURBINE.x, TURBINE.z, TURBINE.h - 4, 0, 3.0),
    G(COOP.x, COOP.z, 3.2, 90, 2.2),
    G(DUMP_CANOPY.x, DUMP_CANOPY.z, DUMP_CANOPY.h - 1.5, 0, 2.8),
    G(0, 140, 5, 180),
    // v2 denser-zone freestyle gates
    G(ADMIN.x, ADMIN.z, 2.4, 0, 2.0),
    G(TURBINE.x, TURBINE.z, 8.5, 90, 2.2),
    G((ANTENNA_FARM.x0 + ANTENNA_FARM.x1) / 2, (ANTENNA_FARM.z0 + ANTENNA_FARM.z1) / 2, 12, 45, 2.6),
    G(BUCKET_ELEV.x, BUCKET_ELEV.z + 4, 20, 180, 2.4),
  ];

  const retrievalPoints = [
    new THREE.Vector3(t0.x, t0.h + 2, t0.z),
    new THREE.Vector3(t1.x, t1.h * 0.72, t1.z + t1.throatR),
    new THREE.Vector3(CONTAINMENT.x, CONTAINMENT.h + CONTAINMENT.domeH + 1.5, CONTAINMENT.z),
    new THREE.Vector3(ELEVATORS.x, ELEVATORS.h + ELEVATORS.headH + 1, ELEVATORS.z),
    new THREE.Vector3(STACK.x, STACK.h + 1.2, STACK.z),
    new THREE.Vector3(TURBINE.x, TURBINE.h + 1.5, TURBINE.z),
    new THREE.Vector3(COOP.x, COOP.h + 1.2, COOP.z),
    new THREE.Vector3(SILO_LF.x, 1.5, SILO_LF.z + SILO_LF.r + 3),
    new THREE.Vector3(DUMP_CANOPY.x, DUMP_CANOPY.h + 0.8, DUMP_CANOPY.z),
    new THREE.Vector3(CONVEYOR.x0 + 40, CONVEYOR.y + 2.5, CONVEYOR.z),
    new THREE.Vector3(ADMIN.x, ADMIN.h + 1.5, ADMIN.z),
    new THREE.Vector3((ANTENNA_FARM.x0 + ANTENNA_FARM.x1) / 2, 44, (ANTENNA_FARM.z0 + ANTENNA_FARM.z1) / 2),
    new THREE.Vector3(RUINS.x, 4, RUINS.z),
  ];

  return { spawnPos, gates, retrievalPoints };
}
