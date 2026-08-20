import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { groundHeight, inKeepout } from '../constants.js';
import { buildLifeguardGeo } from './lifeguard.js';
import { buildParasolCanopy, buildParasolFrame } from './parasols.js';

// Curated lifeguard-stand positions. The old formula (-430 + i*165 + jitter)
// dropped stand #4 straight into the MIAMI sign; these six sit in the gaps
// between the pier, the amusement plaza, the pergola walk, the sign and the
// volleyball courts. The rng draws are still taken so the layout stream that
// follows (parasols, towels, towers, cars) is bit-identical.
const LIFEGUARDS = [
  [-520, 12.5], [-335, 11.0], [-95, 12.0], [45, 10.5], [235, 13.0], [420, 12.0],
];

/** Lifeguard towers + parasols + beach towels. */
export function buildBeachProps(ctx) {
  const { root, track, addCollider, addCyl, setTag, rng, rng3 } = ctx;
  setTag('lifeguard');
  {
    // lifeguard towers v2 — merged vertex-colored geometry, 1 draw call for all 6
    const hutCols = [0xff7fa0, 0x53d6d6, 0xffd166, 0x9b5de5, 0x43d17a, 0xff8c42];
    const lgGeos = [];
    for (let i = 0; i < 6; i++) {
      void ((rng() - 0.5) * 30);                        // legacy rng draws — keep order
      void (10 + rng() * 6);
      const x = LIFEGUARDS[i][0], z = LIFEGUARDS[i][1];
      const y = groundHeight(x, z);
      const g = buildLifeguardGeo(hutCols[i % hutCols.length], hutCols[(i + 2) % hutCols.length]);
      g.rotateY((rng3() - 0.5) * 0.24);
      g.translate(x, y, z);
      lgGeos.push(g);
      // deck 3.3 x 2.9 on splayed legs, roof crown at 4.54, flag to 5.2
      addCollider(x, y, z + 0.05, 3.4, 4.6, 3.05);
      addCyl(x + 1.15, y + 4.3, z + 0.75, 0.06, 1.7);   // flag pole
      addCollider(x - 0.6, y, z - 3.55, 1.05, 1.85, 4.8);   // access ramp
    }
    const lgGeo = track(mergeGeometries(lgGeos));
    lgGeos.forEach((g) => g.dispose());
    const lgMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, side: THREE.DoubleSide }));
    const lgMesh = new THREE.Mesh(lgGeo, lgMat);
    lgMesh.castShadow = true;
    lgMesh.receiveShadow = true;
    root.add(lgMesh);

    // parasols v2 — scalloped two-tone canopy, visible ribs, tilted poles
    const canopyGeoA = track(buildParasolCanopy(0));
    const canopyGeoB = track(buildParasolCanopy(1));
    const frameGeo = track(buildParasolFrame());
    const canopyMatWhite = track(new THREE.MeshStandardMaterial({ color: 0xf6f2e7, roughness: 0.85, side: THREE.DoubleSide }));
    const canopyMatTint = track(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, side: THREE.DoubleSide }));
    const frameMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }));
    const NU = 60;
    const canWhite = new THREE.InstancedMesh(canopyGeoA, canopyMatWhite, NU);
    const canTint = new THREE.InstancedMesh(canopyGeoB, canopyMatTint, NU);
    const frames = new THREE.InstancedMesh(frameGeo, frameMat, NU);
    const umbCols = [0xff5c8a, 0x29d3ff, 0xffd166, 0xff8c42, 0x43d17a, 0x9b5de5, 0xe63946];
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const qS = new THREE.Quaternion();
    const eul = new THREE.Euler();
    const vP = new THREE.Vector3();
    const vS = new THREE.Vector3();
    const colU = new THREE.Color();
    setTag('parasol');
    // A parasol that lands on the amusement deck, the pergola terrace, a
    // volleyball court, the spawn pad or the sign apron is walked sideways in
    // fixed 34 m steps until it clears — a deterministic remap that consumes
    // no rng draws, so the layout stream is untouched.
    const NUDGE = [0, 34, -34, 68, -68, 102, -102, 150, -150];
    const clearX = (x0, z0) => {
      for (let k = 0; k < NUDGE.length; k++) {
        const x = x0 + NUDGE[k];
        if (Math.abs(x) > 560) continue;
        if (inKeepout(x, z0, 1.5)) continue;
        const gy = groundHeight(x, z0);
        if (ctx.blocked(x, z0, 1.35, gy - 0.2, gy + 2.4)) continue;   // lifeguard stands, showers…
        return x;
      }
      return x0;
    };
    const umbSpots = [];
    for (let i = 0; i < NU; i++) {
      const xRaw = (rng() - 0.5) * 1100;                // legacy rng draws — keep order
      const z = 2 + rng() * 16;
      const x = clearX(xRaw, z);
      const y = groundHeight(x, z);
      const yaw = rng() * Math.PI;                      // legacy rotY draw
      const tilt = rng3() * 0.31;                       // 0–18°
      const s = 0.85 + rng3() * 0.35;
      eul.set(tilt, yaw, 0, 'YXZ');
      q.setFromEuler(eul);
      vP.set(x, Math.max(y, 0.1), z);
      vS.set(s, s, s);
      m4.compose(vP, q, vS);
      canWhite.setMatrixAt(i, m4);
      canTint.setMatrixAt(i, m4);
      frames.setMatrixAt(i, m4);
      canTint.setColorAt(i, colU.setHex(umbCols[(rng3() * umbCols.length) | 0]));
      umbSpots.push(vP.clone());
      // pole only — the canopy is fabric, and a 2.4 m disc of invisible steel
      // at head height would be the worst collider on the beach
      addCyl(x, Math.max(y, 0.1), z, 0.07, 2.15 * s);
    }
    canWhite.castShadow = true;
    canTint.castShadow = true;
    root.add(canWhite, canTint, frames);

    // beach towels scattered around the parasol clusters, draped to the sand slope
    const towelGeo = track(new THREE.PlaneGeometry(0.85, 1.75));
    towelGeo.rotateX(-Math.PI / 2);
    const towelMat = track(new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 1,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }));
    const towelCols = [0xff7096, 0x37c4e0, 0xffe08a, 0x59d98c, 0xb08ae6, 0xf2f2f2, 0xff8c42];
    const NT = 60;
    const towels = new THREE.InstancedMesh(towelGeo, towelMat, NT);
    const up = new THREE.Vector3(0, 1, 0);
    const nrm = new THREE.Vector3();
    let ti = 0;
    for (let i = 0; i < NU && ti < NT; i++) {
      const u = umbSpots[i];
      const a = rng3() * Math.PI * 2;
      const dist = 1.3 + rng3() * 1.7;
      const x = u.x + Math.cos(a) * dist, z = u.z + Math.sin(a) * dist;
      const y = groundHeight(x, z);
      if (y < 0.12) continue;
      if (inKeepout(x, z, 0.4)) continue;               // never draped over built ground
      const e = 0.5;
      nrm.set(
        (groundHeight(x - e, z) - groundHeight(x + e, z)) / (2 * e), 1,
        (groundHeight(x, z - e) - groundHeight(x, z + e)) / (2 * e)
      ).normalize();
      qS.setFromUnitVectors(up, nrm);
      eul.set(0, rng3() * Math.PI * 2, 0);
      q.setFromEuler(eul).premultiply(qS);
      vP.set(x, y + 0.045, z);
      vS.set(1, 1, 1);
      m4.compose(vP, q, vS);
      towels.setMatrixAt(ti, m4);
      towels.setColorAt(ti, colU.setHex(towelCols[(rng3() * towelCols.length) | 0]));
      ti++;
    }
    towels.count = ti;
    towels.receiveShadow = true;
    towels.name = 'beach-towels';
    root.add(towels);
  }
  setTag('world');
}
