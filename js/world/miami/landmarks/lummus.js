import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  LUMMUS_X0, LUMMUS_X1, LUMMUS_Z, LUMMUS_HALF, LUMMUS_Y, groundHeight,
} from '../constants.js';
import { cBox, cCyl, cTube } from '../geo.js';

// ============================================================
// Lummus Park — the pergola walk.
//
// A raised coral-paver terrace on the sand between the dune fence and the
// beach, carrying a timber pergola: 0.22 m posts in two rows 3.10 m apart,
// cross beams at 3.05 m and a slatted top. Bougainvillea over the beams.
//
// This is the map's colonnade line: 2.88 m of clear width between the post
// faces and 2.93 m of clear height under the beams, held for 94 m. Every
// post is an exact cylinder and every beam an exact box, so the corridor a
// pilot threads is the corridor the geometry draws.
// ============================================================

const BAY = 5.875;            // post spacing along the walk
const POST_R = 0.11;          // 0.22 m square timber -> 0.11 m half-width
const POST_H = 3.05;          // path to beam soffit
const BEAM_H = 0.26;
const PATH_HALF = 2.45;

const TIMBER = 0xb08654, TIMBER2 = 0x9a7346, PAVER = 0xd8c9ab, PAVER2 = 0xc3b294;
const BOUG = [0xd6407f, 0xe2557a, 0xc9457f, 0xf0713f];

/**
 * Build the Lummus Park pergola walk.
 * Requests its own palm row through ctx.extraPalms so the palm pass can still
 * reject anything that would clash.
 */
export function buildLummus(ctx) {
  const { root, track, addCollider, addCyl, addOBB, setTag, regDN } = ctx;
  setTag('lummus');

  const paving = [];
  const timber = [];
  const bloom = [];
  const lampSpots = [];

  const x0 = LUMMUS_X0, x1 = LUMMUS_X1;
  const len = x1 - x0;
  const cx = (x0 + x1) / 2;

  // ---------------- terrace ----------------
  // Level top at LUMMUS_Y with a kerb that follows the dune, so the terrace
  // reads as built ground rather than a plane floating over the sand.
  {
    paving.push(cBox(len, 0.14, PATH_HALF * 2, PAVER, cx, LUMMUS_Y - 0.07, LUMMUS_Z));
    // banded paver joints
    for (let x = x0 + 1.2; x < x1; x += 2.4) {
      paving.push(cBox(0.12, 0.03, PATH_HALF * 2 - 0.2, PAVER2, x, LUMMUS_Y + 0.005, LUMMUS_Z));
    }
    // kerb skirt down to the sand on both long edges
    for (const s of [-1, 1]) {
      const kz = LUMMUS_Z + s * (PATH_HALF - 0.11);
      let px = x0;
      while (px < x1) {
        const seg = Math.min(6, x1 - px);
        const g = groundHeight(px + seg / 2, kz);
        const top = LUMMUS_Y - 0.14;
        paving.push(cBox(seg, Math.max(0.12, top - g + 0.24), 0.22, PAVER2,
          px + seg / 2, (g - 0.12 + top) / 2, kz));
        px += seg;
      }
    }
    // end steps
    for (const [ex, dir] of [[x0, -1], [x1, 1]]) {
      for (let i = 0; i < 2; i++) {
        paving.push(cBox(0.7, 0.16, PATH_HALF * 2 - 0.6 - i * 0.5, PAVER2,
          ex + dir * (0.35 + i * 0.7), LUMMUS_Y - 0.15 - i * 0.16, LUMMUS_Z));
      }
    }
    addCollider(cx, LUMMUS_Y - 0.85, LUMMUS_Z, len, 0.85, PATH_HALF * 2);
  }

  // ---------------- pergola ----------------
  {
    const nBays = Math.round(len / BAY);
    const step = len / nBays;
    for (let i = 0; i <= nBays; i++) {
      const px = x0 + i * step;
      for (const s of [-1, 1]) {
        const pz = LUMMUS_Z + s * LUMMUS_HALF;
        timber.push(cBox(0.22, POST_H, 0.22, TIMBER, px, LUMMUS_Y + POST_H / 2, pz));
        timber.push(cBox(0.34, 0.1, 0.34, TIMBER2, px, LUMMUS_Y + 0.05, pz));       // base shoe
        // knee brace up to the longitudinal beam
        timber.push(cTube(
          new THREE.Vector3(px + 0.5, LUMMUS_Y + POST_H - 0.02, pz),
          new THREE.Vector3(px, LUMMUS_Y + POST_H - 0.55, pz), 0.05, 5, TIMBER2));
        timber.push(cTube(
          new THREE.Vector3(px - 0.5, LUMMUS_Y + POST_H - 0.02, pz),
          new THREE.Vector3(px, LUMMUS_Y + POST_H - 0.55, pz), 0.05, 5, TIMBER2));
        addCyl(px, LUMMUS_Y, pz, POST_R, POST_H);
      }
      // cross beam over each post pair
      timber.push(cBox(0.16, BEAM_H, LUMMUS_HALF * 2 + 0.7, TIMBER,
        px, LUMMUS_Y + POST_H + BEAM_H / 2 + 0.28, LUMMUS_Z));
      addCollider(px, LUMMUS_Y + POST_H + 0.28, LUMMUS_Z, 0.16, BEAM_H, LUMMUS_HALF * 2 + 0.7);
      // bougainvillea clumps riding the beam ends
      if (i % 2 === 0) {
        for (const s of [-1, 1]) {
          bloom.push([px + (s * 0.2), LUMMUS_Y + POST_H + 0.62, LUMMUS_Z + s * (LUMMUS_HALF + 0.2), 0.55 + (i % 3) * 0.12]);
        }
      }
    }
    // longitudinal beams sitting on the post heads
    for (const s of [-1, 1]) {
      const pz = LUMMUS_Z + s * LUMMUS_HALF;
      timber.push(cBox(len + 0.9, BEAM_H, 0.18, TIMBER, cx, LUMMUS_Y + POST_H + BEAM_H / 2, pz));
      addCollider(cx, LUMMUS_Y + POST_H, pz, len + 0.9, BEAM_H, 0.18);
    }
    // slats across the top (visual only — you can see sky between them)
    for (let x = x0 - 0.3; x <= x1 + 0.3; x += 0.62) {
      timber.push(cBox(0.09, 0.11, LUMMUS_HALF * 2 + 0.5, TIMBER2,
        x, LUMMUS_Y + POST_H + BEAM_H + 0.33, LUMMUS_Z));
    }
  }

  // ---------------- benches + path lights ----------------
  {
    const benchGeos = [];
    for (let i = 0; i < 6; i++) {
      const bx = x0 + 9 + i * ((len - 18) / 5);
      const s = i % 2 ? 1 : -1;
      const bz = LUMMUS_Z + s * (PATH_HALF - 0.62);
      const yaw = s > 0 ? Math.PI : 0;
      const B = [];
      B.push(cBox(1.9, 0.08, 0.52, TIMBER, 0, 0.45, 0));
      B.push(cBox(1.9, 0.42, 0.08, TIMBER, 0, 0.68, 0.24));
      for (const lx of [-0.82, 0.82]) {
        B.push(cBox(0.1, 0.46, 0.5, TIMBER2, lx, 0.22, 0));
        B.push(cBox(0.1, 0.5, 0.1, TIMBER2, lx, 0.68, 0.24));
      }
      const g = mergeGeometries(B);
      B.forEach((q) => q.dispose());
      g.rotateY(yaw);
      g.translate(bx, LUMMUS_Y, bz);
      benchGeos.push(g);
      addOBB(bx, LUMMUS_Y, bz, 1.9, 0.9, 0.62, yaw);
    }
    timber.push(...benchGeos);

    for (let i = 0; i <= 8; i++) {
      const lx = x0 + (len * i) / 8;
      const s = i % 2 ? -1 : 1;
      const lz = LUMMUS_Z + s * (PATH_HALF - 0.24);
      timber.push(cCyl(0.055, 0.07, 0.9, 8, 0x4a4238, lx, LUMMUS_Y + 0.45, lz));
      lampSpots.push([lx, LUMMUS_Y + 0.94, lz]);
      addCyl(lx, LUMMUS_Y, lz, 0.09, 1.0);
    }
  }

  // ---------------- materialise ----------------
  const mk = (geos, mat, name) => {
    if (!geos.length) return null;
    const g = track(mergeGeometries(geos));
    geos.forEach((x) => x.dispose());
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    m.name = name;
    root.add(m);
    return m;
  };
  mk(paving, track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })), 'lummus-paving');
  mk(timber, track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 })), 'lummus-timber');

  // bougainvillea: instanced low-poly clumps, per-instance colour
  if (bloom.length) {
    const bGeo = track(new THREE.IcosahedronGeometry(1, 1));
    const bMat = track(new THREE.MeshStandardMaterial({ vertexColors: false, roughness: 1, flatShading: true }));
    const im = new THREE.InstancedMesh(bGeo, bMat, bloom.length);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const c = new THREE.Color();
    for (let i = 0; i < bloom.length; i++) {
      const b = bloom[i];
      p.set(b[0], b[1], b[2]);
      s.set(b[3] * 1.5, b[3] * 0.72, b[3] * 1.1);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), i * 1.7);
      m4.compose(p, q, s);
      im.setMatrixAt(i, m4);
      im.setColorAt(i, c.setHex(BOUG[i % BOUG.length]));
    }
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    im.castShadow = true;
    im.name = 'lummus-bougainvillea';
    root.add(im);
  }
  // path lamps
  {
    const gGeo = track(new THREE.SphereGeometry(0.11, 8, 6));
    const gMat = regDN(track(new THREE.MeshStandardMaterial({
      color: 0xfff1d6, emissive: 0xffbe70, emissiveIntensity: 2.2,
    })), 0.08, 2.6);
    const im = new THREE.InstancedMesh(gGeo, gMat, lampSpots.length);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < lampSpots.length; i++) {
      m4.makeTranslation(lampSpots[i][0], lampSpots[i][1], lampSpots[i][2]);
      im.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true;
    im.name = 'lummus-path-lamps';
    root.add(im);
  }

  // a palm row flanking the walk on the seaward side, requested through the
  // palm pass so it is rejection-tested like every other planted tree
  for (let x = x0 + 4; x <= x1 - 4; x += 11.5) {
    ctx.extraPalms.push({ x, z: LUMMUS_Z - 5.4, sc: 0.95 });
    ctx.extraPalms.push({ x: x + 5.75, z: LUMMUS_Z - 8.6, sc: 0.88 });
  }

  setTag('world');
}
