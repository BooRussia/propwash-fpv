import * as THREE from 'three';
import {
  CITY_Y, CITY_Z, PIER_X, WHEEL_X, WHEEL_Z, WHEEL_R, PLAZA_Y,
  CINEMA_X, CINEMA_FRONT_Z, LUMMUS_Z, LUMMUS_Y, CLUB_X, MARINA_X,
  groundHeight,
} from './constants.js';
import { buildHelipad } from '../helipad.js';

/** Spawn pad mesh + race gates + retrieval points. */
export function buildPoints(ctx, towerData) {
  const { root, track } = ctx;

  // ---------------- spawn / home pad ----------------
  // A painted helipad so the take-off and landing point is unmistakable.
  // The drone spawns above pad.topY, never inside the deck.
  const padGround = groundHeight(0, 8);
  const spawnPos = new THREE.Vector3(0, padGround, 8);
  {
    const pad = buildHelipad(0, padGround, 8, { radius: 2.4 });
    root.add(pad.group);
    track({ dispose: () => pad.dispose() });
    spawnPos.y = pad.topY;
  }

  // ---------------- race gates ----------------
  const G = (x, z, y, yawDeg, radius = 3.4) =>
    ({ position: new THREE.Vector3(x, y, z), yawRad: THREE.MathUtils.degToRad(yawDeg), radius });
  const HUB_Y = PLAZA_Y + WHEEL_R + 4.6;
  const gates = [
    G(-40, 6, 5, 90),                                   // 1: down the beach
    G(-95, LUMMUS_Z, LUMMUS_Y + 1.45, 90, 1.3),         // 2: THROUGH the pergola walk
    G(-150, -50, 1.8, 95, 3.0),                         // 3: UNDER the pier deck
    G(-185, -95, 6, 110),                               // 4: out over water
    G(-235, -30, 8, 160),                               // 5: bank back toward shore
    G(WHEEL_X, WHEEL_Z, HUB_Y + 3.4, 0, 3.0),           // 6: through the wheel, over the axle
    G(-160, 44, 8, 90),                                 // 7: down Ocean Drive
    G(-60, 44, 6, 90),                                  // 8: street slalom
    G(30, 44, 8, 90),                                   // 9
    G(95, 100, 25, 45),                                 // 10: climb between towers
    G(CINEMA_X, 52.5, 9, 90, 3.2),                      // 11: past the cinema blade sign
    G(154, 12, 4.5, 250, 3.0),                          // 12: slalom between volleyball courts
    G(82, 18, 10, 250, 3.2),                            // 13: past the MIAMI sign, home
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
    retrievalPoints.push(new THREE.Vector3(-95, groundHeight(-95, 12) + 4.7, 12));  // lifeguard hut roof
    retrievalPoints.push(new THREE.Vector3(WHEEL_X + 22, PLAZA_Y + 0.1, WHEEL_Z));  // Pier Park deck
    retrievalPoints.push(new THREE.Vector3(MARINA_X, 1.6, -80));                 // marina dock end
    retrievalPoints.push(new THREE.Vector3(CLUB_X, 10.0, 13));                   // yacht club roof
    retrievalPoints.push(new THREE.Vector3(CINEMA_X, CITY_Y + 17.2, CINEMA_FRONT_Z + 22)); // cinema roof
    retrievalPoints.push(new THREE.Vector3(82, groundHeight(82, 14) + 11, 14));  // atop the MIAMI sign
    retrievalPoints.push(new THREE.Vector3(430, CITY_Y + 66, 70));               // helipad
  }

  return { spawnPos, gates, retrievalPoints };
}
