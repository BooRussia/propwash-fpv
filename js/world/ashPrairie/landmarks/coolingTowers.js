import * as THREE from 'three';
import { TOWER_SITES, GROUND_Y } from '../constants.js';

/** Hyperbolic cooling towers — true industrial scale, dive corridors + bailout air. */
export function buildCoolingTowers(ctx) {
  const { root, track, addCollider, mats } = ctx;

  for (const t of TOWER_SITES) {
    const pts = [];
    const N = 28;
    for (let i = 0; i <= N; i++) {
      const u = i / N; // 0..1 bottom→top
      // hyperbolic-ish profile: wide base, pinch at throat, flare at lip
      let r;
      if (u < t.throatT) {
        const s = u / t.throatT;
        r = t.baseR + (t.throatR - t.baseR) * (s * s * (3 - 2 * s));
      } else {
        const s = (u - t.throatT) / (1 - t.throatT);
        r = t.throatR + (t.topR - t.throatR) * (s * s);
      }
      pts.push(new THREE.Vector2(r, u * t.h));
    }
    const geo = track(new THREE.LatheGeometry(pts, 48));
    const mat = mats.concrete.clone();
    track(mat);
    mat.color = mats.concrete.color.clone().offsetHSL(0, 0, -0.04 + (t.x * 0.0001));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(t.x, GROUND_Y, t.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);

    // Hollow interior: colliders are a ring of AABBs around the shell (not solid fill)
    // so the dive corridor stays open. Sample 8 sectors at mid-height + base ring.
    const sectors = 10;
    for (let s = 0; s < sectors; s++) {
      const a = (s / sectors) * Math.PI * 2;
      const midR = (t.baseR + t.throatR) * 0.5;
      const cx = t.x + Math.cos(a) * midR;
      const cz = t.z + Math.sin(a) * midR;
      const thick = Math.max(3.5, (t.baseR - t.throatR) * 0.35);
      addCollider(cx, GROUND_Y, cz, thick, t.h * 0.92, thick);
    }
    // Lip ring collider
    for (let s = 0; s < 8; s++) {
      const a = (s / 8) * Math.PI * 2;
      addCollider(
        t.x + Math.cos(a) * t.topR,
        GROUND_Y + t.h - 2.5,
        t.z + Math.sin(a) * t.topR,
        4, 3, 4
      );
    }

    // Base apron / fill basin rim (bailout shelf) — annular, not a solid plug
    const apron = new THREE.Mesh(
      track(new THREE.CylinderGeometry(t.baseR + 8, t.baseR + 9, 1.2, 40, 1, true)),
      mats.concreteDark
    );
    apron.position.set(t.x, GROUND_Y + 0.6, t.z);
    apron.receiveShadow = true;
    root.add(apron);
    const ledge = new THREE.Mesh(
      track(new THREE.RingGeometry(t.baseR * 0.78, t.baseR + 6, 40)),
      mats.concreteDark
    );
    ledge.rotation.x = -Math.PI / 2;
    ledge.position.set(t.x, GROUND_Y + 0.15, t.z);
    ledge.receiveShadow = true;
    root.add(ledge);
    // Ring colliders only — keep dive corridor open through the basin
    for (let s = 0; s < 14; s++) {
      const a = (s / 14) * Math.PI * 2;
      const rr = t.baseR + 6.5;
      addCollider(t.x + Math.cos(a) * rr, GROUND_Y, t.z + Math.sin(a) * rr, 5.5, 1.2, 5.5);
    }

    // Interior fill water hint (decorative, no collider) — slight offset
    const pool = new THREE.Mesh(
      track(new THREE.CircleGeometry(t.baseR * 0.72, 32)),
      mats.water
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(t.x, GROUND_Y + 0.08, t.z);
    root.add(pool);

    // Ladder spine on exterior (visual + thin collider)
    const ladder = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.35, t.h * 0.85, 0.2)),
      mats.galv
    );
    ladder.position.set(t.x + t.baseR * 0.92, GROUND_Y + t.h * 0.425, t.z);
    ladder.castShadow = true;
    root.add(ladder);
    addCollider(t.x + t.baseR * 0.92, GROUND_Y, t.z, 0.5, t.h * 0.85, 0.4);
  }
}
