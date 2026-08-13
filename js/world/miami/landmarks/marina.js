import * as THREE from 'three';
import { plankTexture } from '../textures.js';
import { buildSailboat, buildMotorYacht } from './yachts.js';

/** Marina docks + boats. Returns { boats } for bobbing update. */
export function buildMarina(ctx) {
  const { root, track, addCollider, addCyl, addOBB, setTag, rng, rng3 } = ctx;
  setTag('marina');
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
      dock.receiveShadow = true;
      root.add(dock);
      // the deck is 0.4 m thick sitting at 0.6 — the old 0.9 m box put half a
      // metre of invisible hull under every finger
      addCollider(MAR_X + dx, 0.4, -55, 4, 0.4, 90);
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
      // Berth CLEAR of the finger: the old offsets put half the fleet 1 m from
      // a dock centre line, i.e. hulls half-buried in the decking.
      b.position.set(MAR_X + (rng() * 3 | 0) * 26 + (rng() < 0.5 ? -3.8 : 3.8), 0.35, -20 - rng() * 70);
      b.rotation.y = rng() * 0.4 - 0.2 + Math.PI / 2;
      b.userData.phase = rng() * Math.PI * 2;
      boats.push(b);
      root.add(b);
      // Berthed hulls were completely non-solid. A yaw-rotated box matches the
      // hull to a few centimetres; the sailboat mast gets its own cylinder so
      // the rigging is a real obstacle instead of a painted one. (The bob is
      // +-0.12 m — the collider sits at the mean waterline.)
      const L = (isSail ? 6.3 : 6.9) * sizeDraw;
      const B = (isSail ? 1.9 : 2.35) * sizeDraw;
      const hullH = (isSail ? 1.55 : 1.95) * sizeDraw;
      addOBB(b.position.x, 0.35 - 0.55 * sizeDraw, b.position.z, L, hullH, B, b.rotation.y);
      if (isSail) {
        // mast steps at local x = 0.06 L; local +X maps to world (cos, -sin)
        const mOff = 0.378 * sizeDraw;
        addCyl(b.position.x + Math.cos(b.rotation.y) * mOff,
          0.35 + 0.42 * sizeDraw,
          b.position.z - Math.sin(b.rotation.y) * mOff,
          0.09 * sizeDraw, 8.06 * sizeDraw);
      }
    }
  }
  setTag('world');
  return { boats };
}
