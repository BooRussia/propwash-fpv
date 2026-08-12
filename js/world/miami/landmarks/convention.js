import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CITY_Y } from '../constants.js';
import { colorFill, cBox, cCyl } from '../geo.js';

// ============================================================
// Miami Beach Convention Center — the civic anchor behind Ocean Drive.
//
// A long precast volume under a free-floating undulating metal canopy
// carried on tapered columns, a full-height raked glass atrium on the
// plaza front, and a stepped plaza with flagpoles and planters.
// ============================================================

const CX = -48;            // block centre (inside the 'convention' reservation)
const CZ = 136;
const W = 104, D = 44;     // main volume
const RW = 116, RD = 54;   // canopy overhangs the volume on every side
const BODY_H = 14;         // parapet height above CITY_Y
const ROOF_BASE = 20.5;    // canopy mean height above CITY_Y
const PLAZA_Z0 = 104;      // plaza front edge

const PRECAST = 0x8f8a80, PRECAST2 = 0x7c776e, PLINTH = 0x64615a;
const METAL = 0xa9b1b8, MULLION = 0x2f363c, PAVE = 0x9a958a, PAVE2 = 0x85807a;

// Undulating canopy surface — one shared height function so the fascia,
// the columns and the mesh all agree.
function roofY(x, z) {
  return CITY_Y + ROOF_BASE
    + 3.4 * Math.sin((x - CX) * 0.062)
    + 1.7 * Math.sin((z - CZ) * 0.115 + 1.1);
}

/**
 * Build the convention centre + plaza.
 * @returns {{ group: THREE.Group }}
 */
export function buildConvention(ctx) {
  const { root, track, addCollider } = ctx;
  const regDN = ctx.regDN;
  const group = new THREE.Group();
  group.name = 'convention';

  const stone = [];      // volume, plinth, plaza, steps
  const metal = [];      // columns, mullions, fascia, flagpoles
  const glassG = [];     // atrium + ribbon glazing
  const frontZ = CZ - D / 2;          // 114

  // ---------------- podium + main volume ----------------
  stone.push(cBox(W + 6, 1.0, D + 6, PLINTH, CX, CITY_Y + 0.5, CZ));
  stone.push(cBox(W, BODY_H, D, PRECAST, CX, CITY_Y + 1.0 + BODY_H / 2, CZ));
  // horizontal precast reveals so the long wall is not one blank slab
  for (const ry of [4.6, 9.2]) {
    stone.push(cBox(W + 0.5, 0.45, D + 0.5, PRECAST2, CX, CITY_Y + 1.0 + ry, CZ));
  }
  // vertical fin pilasters down the two long faces
  for (let px = -W / 2 + 4; px <= W / 2 - 4; px += 8) {
    for (const s of [-1, 1]) {
      stone.push(cBox(1.1, BODY_H, 0.5, PRECAST2, CX + px, CITY_Y + 1.0 + BODY_H / 2, CZ + s * (D / 2 + 0.2)));
    }
  }
  // clerestory ribbon glazing high on the side and rear walls
  for (const s of [-1, 1]) {
    glassG.push(new THREE.BoxGeometry(W - 10, 2.4, 0.4).translate(CX, CITY_Y + 11.6, CZ + s * (D / 2 + 0.05)));
  }
  for (const s of [-1, 1]) {
    glassG.push(new THREE.BoxGeometry(0.4, 2.4, D - 10).translate(CX + s * (W / 2 + 0.05), CITY_Y + 11.6, CZ));
  }
  addCollider(CX, CITY_Y, CZ, W + 6.4, BODY_H + 1.4, D + 6.4);

  // ---------------- raked glass atrium on the plaza front ----------------
  {
    const AW = 58, AH = 16.5, AD = 9;
    const az = frontZ - AD / 2;
    stone.push(cBox(AW + 3, 0.9, AD + 2, PLINTH, CX, CITY_Y + 0.45, az));
    // side cheeks
    for (const s of [-1, 1]) {
      stone.push(cBox(1.6, AH, AD + 1.2, PRECAST, CX + s * (AW / 2 + 0.8), CITY_Y + 0.9 + AH / 2, az));
    }
    // the raked curtain wall (leans back 9°), plus its frame grid
    const rake = 0.16;
    const glassGeo = new THREE.BoxGeometry(AW, AH + 1.2, 0.28);
    glassGeo.rotateX(rake);
    glassGeo.translate(CX, CITY_Y + 0.9 + AH / 2, az - AD / 2 + 0.4);
    glassG.push(glassGeo);
    for (let mx = -AW / 2 + 1.6; mx <= AW / 2 - 1.6; mx += 3.2) {
      const g = new THREE.BoxGeometry(0.22, AH + 1.2, 0.5);
      g.rotateX(rake);
      g.translate(CX + mx, CITY_Y + 0.9 + AH / 2, az - AD / 2 + 0.28);
      metal.push(colorFill(g, MULLION));
    }
    for (let my = 2.6; my < AH; my += 3.2) {
      const g = new THREE.BoxGeometry(AW, 0.2, 0.46);
      g.rotateX(rake);
      g.translate(CX, CITY_Y + 0.9 + my, az - AD / 2 + 0.28 + (my - AH / 2) * rake);
      metal.push(colorFill(g, MULLION));
    }
    // atrium roof slab + entrance doors
    stone.push(cBox(AW + 2.4, 0.7, AD + 1.4, PRECAST2, CX, CITY_Y + AH + 1.25, az));
    for (let dx = -9; dx <= 9; dx += 6) {
      glassG.push(new THREE.BoxGeometry(4.4, 3.2, 0.2).translate(CX + dx, CITY_Y + 2.5, az - AD / 2 - 0.05));
      metal.push(cBox(0.22, 3.4, 0.3, MULLION, CX + dx - 2.3, CITY_Y + 2.5, az - AD / 2 - 0.1));
      metal.push(cBox(0.22, 3.4, 0.3, MULLION, CX + dx + 2.3, CITY_Y + 2.5, az - AD / 2 - 0.1));
    }
    metal.push(cBox(24, 0.3, 0.45, MULLION, CX, CITY_Y + 4.25, az - AD / 2 - 0.1));
    addCollider(CX, CITY_Y, az, AW + 4, AH + 2.4, AD + 2.6);
  }

  // ---------------- undulating canopy ----------------
  {
    const NX = 46, NZ = 22;
    const geo = track(new THREE.PlaneGeometry(RW, RD, NX, NZ));
    geo.rotateX(-Math.PI / 2);
    geo.translate(CX, 0, CZ);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const base = new THREE.Color(METAL);
    const seam = new THREE.Color(METAL).offsetHSL(0, 0, -0.14);
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, roofY(x, z));
      // standing-seam banding baked into the vertex colours
      const rib = Math.round((x - CX) / (RW / NX));
      tmp.copy(rib % 2 === 0 ? seam : base);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const mat = track(new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.34, metalness: 0.85,
      side: THREE.DoubleSide, envMapIntensity: 1.1,
    }));
    const canopy = new THREE.Mesh(geo, mat);
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    canopy.name = 'conventionCanopy';
    group.add(canopy);

    // fascia beam wrapping the canopy edge, following its curve
    const fascia = (x0, z0, x1, z1, steps) => {
      for (let i = 0; i < steps; i++) {
        const t0 = i / steps, t1 = (i + 1) / steps;
        const ax = x0 + (x1 - x0) * t0, az2 = z0 + (z1 - z0) * t0;
        const bx = x0 + (x1 - x0) * t1, bz = z0 + (z1 - z0) * t1;
        const ay = roofY(ax, az2), by = roofY(bx, bz);
        const mx = (ax + bx) / 2, mz = (az2 + bz) / 2, my = (ay + by) / 2;
        const runX = bx - ax, runZ = bz - az2, rise = by - ay;
        const run = Math.hypot(runX, runZ);
        const g = new THREE.BoxGeometry(Math.hypot(run, rise) + 0.06, 0.95, 0.55);
        if (Math.abs(runX) > Math.abs(runZ)) g.rotateZ(Math.atan2(rise, runX));
        else { g.rotateY(Math.PI / 2); g.rotateX(-Math.atan2(rise, runZ)); }
        g.translate(mx, my - 0.44, mz);
        metal.push(colorFill(g, PRECAST2));
      }
    };
    fascia(CX - RW / 2, CZ - RD / 2, CX + RW / 2, CZ - RD / 2, 34);
    fascia(CX - RW / 2, CZ + RD / 2, CX + RW / 2, CZ + RD / 2, 34);
    fascia(CX - RW / 2, CZ - RD / 2, CX - RW / 2, CZ + RD / 2, 16);
    fascia(CX + RW / 2, CZ - RD / 2, CX + RW / 2, CZ + RD / 2, 16);

    // tapered columns carrying the overhang, standing on the plaza
    for (let px = -RW / 2 + 6; px <= RW / 2 - 6; px += 11.5) {
      for (const s of [-1, 1]) {
        const x = CX + px, z = CZ + s * (RD / 2 - 2.4);
        const top = roofY(x, z) - 0.9;
        metal.push(cCyl(0.32, 0.62, top - CITY_Y, 10, METAL, x, CITY_Y + (top - CITY_Y) / 2, z));
        stone.push(cBox(1.6, 0.35, 1.6, PLINTH, x, CITY_Y + 0.17, z));
      }
    }
    for (const s of [-1, 1]) {
      const x = CX + s * (RW / 2 - 3.2);
      for (const pz of [-RD / 2 + 8, 0, RD / 2 - 8]) {
        const z = CZ + pz;
        const top = roofY(x, z) - 0.9;
        metal.push(cCyl(0.32, 0.62, top - CITY_Y, 10, METAL, x, CITY_Y + (top - CITY_Y) / 2, z));
        stone.push(cBox(1.6, 0.35, 1.6, PLINTH, x, CITY_Y + 0.17, z));
      }
    }
    // canopy envelope collider (its underside clears the plaza by ~14 m)
    addCollider(CX, CITY_Y + 15.4, CZ, RW + 1, 12, RD + 1);
  }

  // ---------------- plaza, steps, planters, flagpoles ----------------
  {
    const pz = (PLAZA_Z0 + frontZ) / 2;
    const pd = frontZ - PLAZA_Z0;
    stone.push(cBox(RW + 8, 0.09, pd, PAVE, CX, CITY_Y + 0.045, pz));
    // banded paving so the plaza is not a flat grey field
    for (let bx = -RW / 2; bx < RW / 2 + 4; bx += 9) {
      stone.push(cBox(1.6, 0.11, pd - 1.5, PAVE2, CX + bx, CITY_Y + 0.055, pz));
    }
    // three broad steps up to the atrium threshold
    for (let s = 0; s < 3; s++) {
      stone.push(cBox(64 - s * 2.5, 0.22, 1.5, PAVE2, CX, CITY_Y + 0.11 + s * 0.22, frontZ - 8.4 + s * 1.5));
    }
    // low planter walls flanking the steps
    for (const s of [-1, 1]) {
      const x = CX + s * 38;
      stone.push(cBox(14, 0.85, 5.5, PRECAST2, x, CITY_Y + 0.42, frontZ - 6));
      stone.push(cBox(14.5, 0.18, 6.0, PRECAST, x, CITY_Y + 0.87, frontZ - 6));
      addCollider(x, CITY_Y, frontZ - 6, 14.5, 1.1, 6);
    }
    // flagpoles along the plaza edge
    const flagCols = [0xd8412f, 0x2b5fa8, 0xf0f0ec, 0xf2b437, 0x2f9c72];
    for (let i = 0; i < 5; i++) {
      const x = CX - 26 + i * 13;
      metal.push(cCyl(0.13, 0.17, 13, 8, 0xdfe4e8, x, CITY_Y + 6.5, PLAZA_Z0 + 2.2));
      metal.push(cCyl(0.3, 0.34, 0.5, 10, PLINTH, x, CITY_Y + 0.25, PLAZA_Z0 + 2.2));
      const flag = new THREE.BoxGeometry(0.05, 1.5, 2.4);
      flag.translate(x + 0.1, CITY_Y + 11.9, PLAZA_Z0 + 3.5);
      metal.push(colorFill(flag, flagCols[i]));
      addCollider(x, CITY_Y, PLAZA_Z0 + 2.2, 0.5, 13, 0.5);
    }
  }

  // ---------------- materialise ----------------
  const mkMesh = (geos, mat) => {
    const g = track(mergeGeometries(geos));
    geos.forEach((x) => x.dispose());
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  };
  mkMesh(stone, track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.02 })));
  mkMesh(metal, track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.75 })));
  {
    const g = track(mergeGeometries(glassG));
    glassG.forEach((x) => x.dispose());
    const mat = regDN(track(new THREE.MeshStandardMaterial({
      color: 0x1b2b33, metalness: 0.5, roughness: 0.05,
      envMapIntensity: 1.3, emissive: 0xbfe2ff, emissiveIntensity: 0,
      transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide,
    })), 0.02, 0.9);
    group.add(new THREE.Mesh(g, mat));
  }

  root.add(group);
  return { group };
}
