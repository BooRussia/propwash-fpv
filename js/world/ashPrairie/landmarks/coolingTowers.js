import * as THREE from 'three';
import { TOWER_SITES, GROUND_Y, PAL } from '../constants.js';
import { setAoUVs } from '../textures.js';

/** Reesy NDCT undercroft (correction on 773bea7): 8.0 m clear, all-V, Ø0.80, bay 5.8–6.2. */
const CLEAR_H = 8.0;
const LINTEL_H = 1.0;
const PITCH_TARGET = 6.85;
const N_PAIRS_MIN = 40;
const N_PAIRS_MAX = 48;
const COL_R = 0.40; // Ø 0.80 m
const BAY_MIN = 5.8;
const BAY_MAX = 6.2;
const SHELL0 = CLEAR_H + LINTEL_H;

function pairCount(baseR) {
  const n = Math.round((Math.PI * 2 * baseR) / PITCH_TARGET);
  return Math.max(N_PAIRS_MIN, Math.min(N_PAIRS_MAX, n));
}

/** Overlapping AABB ring so micros cannot slip between sectors. Interior stays open. */
function addShellRing(addCollider, x, z, yBottom, height, radius, wallThick, sectors) {
  const chord = 2 * radius * Math.sin(Math.PI / sectors);
  const tang = chord * 1.35;
  const rad = Math.max(2.2, wallThick);
  for (let s = 0; s < sectors; s++) {
    const a = (s / sectors) * Math.PI * 2;
    const cx = x + Math.cos(a) * radius;
    const cz = z + Math.sin(a) * radius;
    const size = Math.max(tang, rad);
    addCollider(cx, yBottom, cz, size, height, size);
  }
}

/** Segmented AABBs along an inclined raker so bays stay flyable. */
function addRakerCollider(addCollider, ax, ay, az, bx, by, bz, thick) {
  const segs = 4;
  const dx = bx - ax, dy = by - ay, dz = bz - az;
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs;
    const mx = ax + dx * (t0 + 0.5 / segs);
    const my = ay + dy * t0;
    const mz = az + dz * (t0 + 0.5 / segs);
    const h = Math.abs(dy) / segs + 0.1;
    addCollider(mx, my, mz, thick, h, thick);
  }
}

function applyTowerUVs(geo, height, avgR, uOff = 0, vOff = 0) {
  const uv = geo.attributes.uv;
  if (!uv) return;
  const uScale = (avgR * Math.PI * 2) / 12;
  const vScale = height / 10;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * uScale + uOff, uv.getY(i) * vScale + vOff);
  }
  uv.needsUpdate = true;
  setAoUVs(geo);
}

function tintSoil(track, mats, voidMix, roughness, metalness) {
  const src = mats.soil || mats.concreteDark;
  const mat = src.clone();
  track(mat);
  const soilB = new THREE.Color(PAL.soilB ?? 0x3E3830);
  const vd = new THREE.Color(PAL.voidDark ?? 0x1A1816);
  mat.color = soilB.clone().lerp(vd, voidMix);
  mat.roughness = roughness;
  mat.metalness = metalness;
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = 1;
  mat.polygonOffsetUnits = 1;
  if (mat.map) {
    mat.map = mat.map.clone();
    mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
    mat.map.repeat.set(8, 8);
    mat.map.needsUpdate = true;
    track(mat.map);
  }
  return mat;
}

function polar(x, z, r, a) {
  return [x + Math.cos(a) * r, z + Math.sin(a) * r];
}

/**
 * Hyperbolic cooling towers — NDCT undercroft:
 * 8.0 m open colonnade, all-V RC pairs (~44 @ D96), Ø0.80, 5.8–6.2 m bays,
 * dry/muddy basin + optional puddles (no tropical water).
 */
export function buildCoolingTowers(ctx) {
  const { root, track, addCollider, mats } = ctx;
  const dryMat = tintSoil(track, mats, 0.28, 0.85, 0.04);
  const puddleMat = tintSoil(track, mats, 0.55, 0.22, 0.25);
  const colGeo = track(new THREE.CylinderGeometry(COL_R, COL_R, 1, 8));
  const flangeGeo = track(new THREE.CylinderGeometry(0.55, 0.55, 0.16, 8));
  const colMat = mats.concreteTower || mats.concrete;
  const flangeMat = mats.rustHot || mats.oxideDark || mats.oxide;
  const nCol = TOWER_SITES.length * N_PAIRS_MAX * 2;
  const cols = new THREE.InstancedMesh(colGeo, colMat, nCol);
  const flanges = new THREE.InstancedMesh(flangeGeo, flangeMat, nCol);
  cols.castShadow = true;
  cols.receiveShadow = true;
  flanges.castShadow = true;
  const dummy = new THREE.Object3D();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3();
  let iCol = 0;

  const placeCol = (ax, ay, az, bx, by, bz) => {
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    dummy.position.set((ax + bx) * 0.5, (ay + by) * 0.5, (az + bz) * 0.5);
    dir.set(dx, dy, dz).normalize();
    dummy.quaternion.setFromUnitVectors(yAxis, dir);
    dummy.scale.set(1, len, 1);
    dummy.updateMatrix();
    cols.setMatrixAt(iCol, dummy.matrix);
    dummy.position.set(bx, by, bz);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    flanges.setMatrixAt(iCol, dummy.matrix);
    addRakerCollider(addCollider, ax, ay, az, bx, by, bz, 0.90);
    iCol++;
  };

  for (const t of TOWER_SITES) {
    const hShell = t.h - SHELL0;
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
      pts.push(new THREE.Vector2(r, SHELL0 + u * hShell));
    }
    const geo = track(new THREE.LatheGeometry(pts, 64));
    applyTowerUVs(geo, hShell, (t.baseR + t.throatR + t.topR) / 3, t.x * 0.017, t.z * 0.011);

    const mat = (mats.concreteTower || mats.concrete).clone();
    track(mat);
    mat.side = THREE.DoubleSide;
    mat.color = (mats.concreteTower || mats.concrete).color.clone().offsetHSL(0, 0, -0.04 + (t.x * 0.0001));
    if (mat.map) {
      mat.map = mat.map.clone();
      mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
      mat.map.repeat.set(1, 1);
      mat.map.needsUpdate = true;
      track(mat.map);
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(t.x, GROUND_Y, t.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);

    {
      const innerPts = pts.map((p) => new THREE.Vector2(Math.max(1.5, p.x - 1.8), p.y));
      const innerGeo = track(new THREE.LatheGeometry(innerPts, 48));
      applyTowerUVs(innerGeo, hShell, (t.baseR + t.throatR + t.topR) / 3);
      const innerMat = (mats.voidDark || mats.concreteDark).clone();
      track(innerMat);
      innerMat.side = THREE.DoubleSide;
      const inner = new THREE.Mesh(innerGeo, innerMat);
      inner.position.set(t.x, GROUND_Y, t.z);
      root.add(inner);
    }

    // Shell colliders start at lintel — never plug the 8 m inlet.
    const wallThick = Math.max(2.4, (t.baseR - t.throatR) * 0.12);
    const bands = [
      { y0: GROUND_Y + SHELL0, h: hShell * 0.40, r: (t.baseR + t.throatR) * 0.58, n: 28 },
      { y0: GROUND_Y + SHELL0 + hShell * 0.32, h: hShell * 0.40, r: (t.throatR + t.baseR) * 0.42, n: 28 },
      { y0: GROUND_Y + SHELL0 + hShell * 0.62, h: hShell * 0.38, r: (t.throatR + t.topR) * 0.5, n: 26 },
    ];
    for (const b of bands) {
      addShellRing(addCollider, t.x, t.z, b.y0, b.h, b.r, wallThick, b.n);
    }
    addShellRing(addCollider, t.x, t.z, GROUND_Y + t.h - 3, 3.2, t.topR, 3.2, 20);

    {
      const lip = new THREE.Mesh(
        track(new THREE.TorusGeometry(t.topR * 0.92, 0.35, 6, 28)),
        mats.voidDark || mats.concreteDark
      );
      lip.position.set(t.x, GROUND_Y + t.h - 0.4, t.z);
      lip.rotation.x = Math.PI / 2;
      root.add(lip);
    }

    // Heavy ring beam / lintel (concrete outer, voidDark soffit + inner).
    {
      const yL = GROUND_Y + CLEAR_H + LINTEL_H * 0.5;
      const r = t.baseR;
      const lintelMat = mats.concreteTower || mats.concrete;
      const sofMat = mats.voidDark || mats.concreteDark;
      const outer = new THREE.Mesh(
        track(new THREE.CylinderGeometry(r + 0.55, r + 0.55, LINTEL_H, 48, 1, true)),
        lintelMat
      );
      outer.position.set(t.x, yL, t.z);
      outer.castShadow = true;
      outer.receiveShadow = true;
      root.add(outer);
      const inn = new THREE.Mesh(
        track(new THREE.CylinderGeometry(r - 0.55, r - 0.55, LINTEL_H, 48, 1, true)),
        sofMat
      );
      inn.position.set(t.x, yL, t.z);
      root.add(inn);
      const cap = new THREE.Mesh(
        track(new THREE.RingGeometry(r - 0.55, r + 0.55, 48)),
        lintelMat
      );
      cap.rotation.x = -Math.PI / 2;
      cap.position.set(t.x, GROUND_Y + SHELL0, t.z);
      cap.receiveShadow = true;
      root.add(cap);
      const sof = new THREE.Mesh(
        track(new THREE.RingGeometry(r - 0.55, r + 0.55, 48)),
        sofMat
      );
      sof.rotation.x = Math.PI / 2;
      sof.position.set(t.x, GROUND_Y + CLEAR_H, t.z);
      root.add(sof);
      addShellRing(addCollider, t.x, t.z, GROUND_Y + CLEAR_H, LINTEL_H, r, 1.3, 36);
    }

    // All-V rakers (no Λ/X). Pitch ~6.85 m @ D96 → ~5.8–6.2 m clear bays.
    {
      const nPairs = pairCount(t.baseR);
      const dA = (Math.PI * 2) / nPairs;
      const pitch = dA * t.baseR;
      const colD = COL_R * 2;
      const footSpan = Math.min(pitch - 0.08, BAY_MAX + colD);
      const rFoot = t.baseR + 0.15;
      const rTop = t.baseR - 0.45;
      const half = (footSpan * 0.5) / rFoot;
      const y0 = GROUND_Y + 0.12;
      const y1 = GROUND_Y + CLEAR_H;
      for (let p = 0; p < nPairs; p++) {
        const a = p * dA;
        const [x0, z0] = polar(t.x, t.z, rFoot, a - half);
        const [x1, z1] = polar(t.x, t.z, rFoot, a + half);
        const [tx, tz] = polar(t.x, t.z, rTop, a);
        placeCol(x0, y0, z0, tx, y1, tz);
        placeCol(x1, y0, z1, tx, y1, tz);
      }
    }

    // Dry/muddy basin + optional puddles — NOT tropical water.
    {
      const basinR = t.baseR * 0.74;
      const mud = new THREE.Mesh(
        track(new THREE.CircleGeometry(basinR, 40)),
        dryMat
      );
      mud.rotation.x = -Math.PI / 2;
      mud.position.set(t.x, GROUND_Y + 0.04, t.z);
      mud.receiveShadow = true;
      mud.renderOrder = -1;
      root.add(mud);
      for (let u = 0; u < 3; u++) {
        const pa = u * 2.15 + t.x * 0.01;
        const pr = basinR * (0.22 + u * 0.12);
        const [px, pz] = polar(t.x, t.z, pr, pa);
        const puddle = new THREE.Mesh(
          track(new THREE.CircleGeometry(2.2 + u * 0.5, 16)),
          puddleMat
        );
        puddle.rotation.x = -Math.PI / 2;
        puddle.position.set(px, GROUND_Y + 0.05, pz);
        puddle.renderOrder = -1;
        root.add(puddle);
      }
      addCollider(t.x, GROUND_Y - 0.12, t.z, basinR * 1.15, 0.4, basinR * 1.15);
      addShellRing(addCollider, t.x, t.z, GROUND_Y - 0.08, 0.35, basinR * 0.55, 10, 14);
      addShellRing(addCollider, t.x, t.z, GROUND_Y - 0.08, 0.35, basinR * 0.85, 8, 18);

      const sillR0 = t.baseR * 0.74;
      const sillR1 = t.baseR * 0.82;
      const inset = new THREE.Mesh(
        track(new THREE.RingGeometry(sillR0, sillR0 + 0.35, 40)),
        mats.voidDark || mats.concreteDark
      );
      inset.rotation.x = -Math.PI / 2;
      inset.position.set(t.x, GROUND_Y + 0.09, t.z);
      root.add(inset);
      const sill = new THREE.Mesh(
        track(new THREE.RingGeometry(sillR0 + 0.28, sillR1, 40)),
        mats.concreteDark
      );
      sill.rotation.x = -Math.PI / 2;
      sill.position.set(t.x, GROUND_Y + 0.16, t.z);
      sill.receiveShadow = true;
      root.add(sill);
      const curb = new THREE.Mesh(
        track(new THREE.CylinderGeometry(sillR1, sillR1, 0.55, 40, 1, true)),
        mats.concreteDark
      );
      curb.position.set(t.x, GROUND_Y + 0.35, t.z);
      curb.receiveShadow = true;
      root.add(curb);
      addShellRing(addCollider, t.x, t.z, GROUND_Y, 0.7, (sillR0 + sillR1) * 0.5, 1.1, 24);
    }

    // Dirt skirt OUTSIDE basin / column ring — low berm, does not plug air inlet.
    {
      const skirt = new THREE.Mesh(
        track(new THREE.CylinderGeometry(t.baseR + 7.5, t.baseR + 2.4, 1.2, 32, 1, true)),
        mats.oxideDark || mats.rustCool || mats.soil
      );
      skirt.position.set(t.x, GROUND_Y + 0.45, t.z);
      skirt.receiveShadow = true;
      root.add(skirt);
    }

    // Dry/moss debris on the mud (visual only).
    for (let m = 0; m < 6; m++) {
      const a = m * 1.07 + t.x * 0.02;
      const rr = t.baseR * (0.18 + (m % 3) * 0.14);
      const [mx, mz] = polar(t.x, t.z, rr, a);
      const clump = new THREE.Mesh(
        track(new THREE.SphereGeometry(1.1 + (m % 3) * 0.25, 6, 4)),
        mats.moss || mats.mossDark || mats.oxideDark
      );
      clump.position.set(mx, GROUND_Y + 0.22, mz);
      clump.scale.set(1.2, 0.28, 0.9);
      root.add(clump);
    }

    // Heavy fill pipes at basin rim (solid colliders).
    for (let p = 0; p < 3; p++) {
      const a = p * ((Math.PI * 2) / 3) + t.z * 0.01;
      const [px, pz] = polar(t.x, t.z, t.baseR * 0.8, a);
      const pipe = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.42, 0.46, 2.6, 8)),
        mats.oxideDark || mats.rustHot
      );
      pipe.position.set(px, GROUND_Y + 1.3, pz);
      pipe.castShadow = true;
      root.add(pipe);
      addCollider(px, GROUND_Y, pz, 1.0, 2.6, 1.0);
    }

    // Weathering on the shell (above lintel), not in the inlet.
    for (let s = 0; s < 7; s++) {
      const a = -0.35 + s * 0.22 + (t.x * 0.001);
      const sx = t.x + Math.cos(a) * (t.baseR * 0.92);
      const sz = t.z + Math.sin(a) * (t.baseR * 0.92);
      const stainH = hShell * (0.35 + (s % 3) * 0.12);
      const stain = new THREE.Mesh(
        track(new THREE.BoxGeometry(1.6, stainH, 0.12)),
        mats.rustCool || mats.oxideDark
      );
      stain.position.set(sx, GROUND_Y + SHELL0 + stainH * 0.45, sz);
      stain.lookAt(t.x, GROUND_Y + SHELL0 + stainH * 0.45, t.z);
      stain.castShadow = false;
      root.add(stain);
    }
    for (let m = 0; m < 5; m++) {
      const a = Math.PI * 0.55 + m * 0.18;
      const mx = t.x + Math.cos(a) * (t.baseR * 0.88);
      const mz = t.z + Math.sin(a) * (t.baseR * 0.88);
      const moss = new THREE.Mesh(
        track(new THREE.SphereGeometry(2.2 + m * 0.3, 6, 4)),
        mats.moss || mats.mossDark || mats.oxideDark
      );
      moss.position.set(mx, GROUND_Y + SHELL0 + 1.6 + m * 1.1, mz);
      moss.scale.set(1, 0.35, 0.8);
      root.add(moss);
    }

    // Ladder — visual only (no collider).
    const ladder = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.35, t.h * 0.78, 0.2)),
      mats.galv
    );
    ladder.position.set(t.x + t.baseR * 0.92, GROUND_Y + CLEAR_H + t.h * 0.39, t.z);
    ladder.castShadow = true;
    root.add(ladder);
  }

  cols.count = iCol;
  flanges.count = iCol;
  cols.instanceMatrix.needsUpdate = true;
  flanges.instanceMatrix.needsUpdate = true;
  root.add(cols);
  root.add(flanges);
}
