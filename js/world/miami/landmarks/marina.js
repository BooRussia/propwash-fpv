import * as THREE from 'three';
import { plankTexture } from '../textures.js';
import { buildSailboat, buildMotorYacht } from './yachts.js';

/** Marina docks + boats. Returns { boats } for bobbing update. */
export function buildMarina(ctx) {
  const { root, track, addCollider, rng, rng3 } = ctx;
  const boats = [];
  {
    const MAR_X = 300;
    const dockTex = track(plankTexture(0x9c7750, 41, 512, 512, 18));
    dockTex.repeat.set(1, 11);
    const dockGeo = track(new THREE.BoxGeometry(4, 0.4, 90));
    const dockMat = track(new THREE.MeshStandardMaterial({ map: dockTex, roughness: 0.95 }));
    for (const dx of [0, 26, 52]) {
      const dock = new THREE.Mesh(dockGeo, dockMat);
      dock.position.set(MAR_X + dx, 0.6, -55);
      root.add(dock);
      addCollider(MAR_X + dx, 0.2, -55, 4, 0.9, 90);
    }
    // boats v2 — lofted hulls; the legacy rng draws keep their exact order:
    // (1) size, (2) sail/motor pick, (3) dock, (4) side, (5) z, (6) yaw, (7) phase
    const boatMat = track(new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.42, metalness: 0.08, side: THREE.DoubleSide,
    }));
    const accCols = [0x1c6fb8, 0x2aa198, 0xc2453f, 0x28527a, 0xd98e32];
    for (let i = 0; i < 8; i++) {
      const b = new THREE.Group();
      const sizeDraw = 0.8 + rng() * 0.5;               // legacy hull-scale draw
      const isSail = rng() < 0.6;                       // legacy mast-chance draw
      const accent = accCols[(rng3() * accCols.length) | 0];
      const geo = track(isSail ? buildSailboat(sizeDraw, accent) : buildMotorYacht(sizeDraw, accent));
      const mesh = new THREE.Mesh(geo, boatMat);
      mesh.castShadow = true;
      b.add(mesh);
      b.position.set(MAR_X - 8 + (rng() * 3 | 0) * 26 + (rng() < 0.5 ? -7 : 7), 0.35, -20 - rng() * 70);
      b.rotation.y = rng() * 0.4 - 0.2 + Math.PI / 2;
      b.userData.phase = rng() * Math.PI * 2;
      boats.push(b);
      root.add(b);
    }
  }
  return { boats };
}
