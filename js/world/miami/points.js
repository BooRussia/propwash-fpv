import * as THREE from 'three';
import {
  CITY_Y, CITY_Z, PIER_X, WHEEL_R, groundHeight,
} from './constants.js';

/** Spawn pad mesh + race gates + retrieval points. */
export function buildPoints(ctx, towerData) {
  const { root, track } = ctx;

  // ---------------- spawn / home pad ----------------
  const spawnPos = new THREE.Vector3(0, groundHeight(0, 8) + 0.06, 8);
  {
    const padGeo = track(new THREE.CircleGeometry(2.2, 28));
    const padMat = track(new THREE.MeshStandardMaterial({ color: 0x0d2b33, emissive: 0x29d3ff, emissiveIntensity: 0.9, side: THREE.DoubleSide }));
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.copy(spawnPos).y += 0.02;
    root.add(pad);
  }

  // ---------------- race gates ----------------
  const G = (x, z, y, yawDeg, radius = 3.4) =>
    ({ position: new THREE.Vector3(x, y, z), yawRad: THREE.MathUtils.degToRad(yawDeg), radius });
  const gates = [
    G(-40, 6, 5, 90),                                   // 1: down the beach
    G(-100, 2, 4, 90),                                  // 2: low over sand
    G(-150, -50, 1.8, 95, 3.0),                         // 3: UNDER the pier deck
    G(-185, -95, 6, 110),                               // 4: out over water
    G(-235, -30, 8, 160),                               // 5: bank back toward shore
    G(-215, 42, CITY_Y + WHEEL_R + 4, 180, 3.0),        // 6: through the ferris wheel hub plane
    G(-160, 44, 8, 90),                                 // 7: down Ocean Drive
    G(-60, 44, 6, 90),                                  // 8: street slalom
    G(30, 44, 8, 90),                                   // 9
    G(95, 100, 25, 45),                                 // 10: climb between towers
    G(150, 60, 14, 130),                                // 11: back over boardwalk
    G(82, 18, 10, 250, 3.2),                            // 12: past the MIAMI sign, home
  ];

  // ---------------- retrieval points ----------------
  const retrievalPoints = [];
  {
    // rooftops of a few mid towers
    let count = 0;
    for (const t of towerData) {
      if (count >= 4) break;
      if (t.h > 40 && t.h < 120 && Math.abs(t.x) < 300) {
        retrievalPoints.push(new THREE.Vector3(t.x + t.w / 4, CITY_Y + t.h + 1.2, t.z + t.d / 4));
        count++;
      }
    }
    retrievalPoints.push(new THREE.Vector3(PIER_X, 1.2, CITY_Z - 60));          // under the pier
    retrievalPoints.push(new THREE.Vector3(PIER_X, 12.4, CITY_Z - 168));        // pier pavilion roof
    retrievalPoints.push(new THREE.Vector3(-430 + 165, groundHeight(-265, 12) + 6, 12)); // lifeguard hut roof
    retrievalPoints.push(new THREE.Vector3(300, 1.6, -80));                      // marina dock end
    retrievalPoints.push(new THREE.Vector3(82, groundHeight(82, 14) + 11, 14));  // atop the MIAMI sign
    retrievalPoints.push(new THREE.Vector3(430, CITY_Y + 66, 70));               // helipad
  }

  return { spawnPos, gates, retrievalPoints };
}
