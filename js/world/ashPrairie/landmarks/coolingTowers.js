import * as THREE from 'three';
import { TOWER_SITES, GROUND_Y } from '../constants.js';
import { setAoUVs } from '../textures.js';

/** Overlapping AABB ring so micros cannot slip between sectors. Interior stays open. */
function addShellRing(addCollider, x, z, yBottom, height, radius, wallThick, sectors) {
  const chord = 2 * radius * Math.sin(Math.PI / sectors);
  // Tangential span overlaps neighbors; radial thickness tracks visible shell.
  const tang = chord * 1.35;
  const rad = Math.max(2.2, wallThick);
  for (let s = 0; s < sectors; s++) {
    const a = (s / sectors) * Math.PI * 2;
    const cx = x + Math.cos(a) * radius;
    const cz = z + Math.sin(a) * radius;
    // Square-ish AABB large enough that adjacent boxes overlap on the circumference.
    const size = Math.max(tang, rad);
    addCollider(cx, yBottom, cz, size, height, size);
  }
}

function applyTowerUVs(geo, height, avgR) {
  // Lathe UVs are 0..1; stretch so concrete/PBR doesn't smear vertically.
  const uv = geo.attributes.uv;
  if (!uv) return;
  const uScale = (avgR * Math.PI * 2) / 8; // ~8 m horizontal repeat
  const vScale = height / 6;               // ~6 m vertical repeat
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * uScale, uv.getY(i) * vScale);
  }
  uv.needsUpdate = true;
  setAoUVs(geo);
}

/** Hyperbolic cooling towers — true industrial scale, dive corridors + bailout air. */
export function buildCoolingTowers(ctx) {
  const { root, track, addCollider, mats } = ctx;

  for (const t of TOWER_SITES) {
    const pts = [];
    const N = 28;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
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
    const geo = track(new THREE.LatheGeometry(pts, 64));
    applyTowerUVs(geo, t.h, (t.baseR + t.throatR + t.topR) / 3);

    const mat = (mats.concreteTower || mats.concrete).clone();
    track(mat);
    mat.color = (mats.concreteTower || mats.concrete).color.clone().offsetHSL(0, 0, -0.04 + (t.x * 0.0001));
    if (mat.map) {
      mat.map = mat.map.clone();
      mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
      mat.map.repeat.set(1, 1); // scaling baked into UVs
      mat.map.needsUpdate = true;
      track(mat.map);
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(t.x, GROUND_Y, t.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);

    // Hollow shell: 3 stacked overlapping rings matching the hyperbola
    // (base / mid / throat→lip) so colliders hug visible concrete.
    const wallThick = Math.max(2.4, (t.baseR - t.throatR) * 0.12);
    const bands = [
      { y0: GROUND_Y, h: t.h * 0.38, r: (t.baseR + t.throatR) * 0.55, n: 28 },
      { y0: GROUND_Y + t.h * 0.32, h: t.h * 0.38, r: (t.throatR + t.baseR) * 0.42, n: 28 },
      { y0: GROUND_Y + t.h * 0.62, h: t.h * 0.36, r: (t.throatR + t.topR) * 0.5, n: 26 },
    ];
    for (const b of bands) {
      addShellRing(addCollider, t.x, t.z, b.y0, b.h, b.r, wallThick, b.n);
    }
    // Lip ring
    addShellRing(addCollider, t.x, t.z, GROUND_Y + t.h - 3, 3.2, t.topR, 3.2, 20);

    // voidDark lip ring (visual only — commit-edge readability)
    {
      const lip = new THREE.Mesh(
        track(new THREE.TorusGeometry(t.topR * 0.92, 0.35, 6, 28)),
        mats.voidDark || mats.concreteDark
      );
      lip.position.set(t.x, GROUND_Y + t.h - 0.4, t.z);
      lip.rotation.x = Math.PI / 2;
      root.add(lip);
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
    addShellRing(addCollider, t.x, t.z, GROUND_Y, 1.2, t.baseR + 6.5, 4.5, 22);

    // Decorative basin disc — below grade slightly + polygonOffset to kill shimmer
    const poolMat = mats.water.clone();
    track(poolMat);
    poolMat.polygonOffset = true;
    poolMat.polygonOffsetFactor = 2;
    poolMat.polygonOffsetUnits = 2;
    poolMat.depthWrite = false;
    const pool = new THREE.Mesh(
      track(new THREE.CircleGeometry(t.baseR * 0.72, 32)),
      poolMat
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(t.x, GROUND_Y - 0.06, t.z);
    pool.renderOrder = -1;
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
