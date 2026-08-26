import * as THREE from 'three';
import {
  CITY_Y,
  inlandMidrises,
  leftoverLotOverlap,
  streetOverlap,
  helipadOverlap,
  ROOF_AC_CELLS, ROOF_RING_CELLS,
  roofAcGapGeom, roofRingGeom, installFlyColliders,
  isCourtWellCell, COURT_WELL_W, COURT_WELL_D,
  isInlandArcadeCell, INLAND_ARCADE_SOFFIT, INLAND_ARCADE_OPEN_W,
  ALLEY_DUMPSTER_CELLS, ALLEY_DOCK_CELLS,
  ALLEY_DUMP_W, ALLEY_DUMP_D, ALLEY_DUMP_H,
  ALLEY_DOCK_W, ALLEY_DOCK_D, ALLEY_DOCK_H,
  ALLEY_LAMP_CELLS, ALLEY_LAMP_H, ALLEY_LAMP_R, ALLEY_LAMP_ARM,
  alleySolidHitsWhoop,
} from '../constants.js';
import { hash01 } from '../rng.js';
import { buildDecoMidriseGeos, buildRoofAcUnitGeo, cBox, cCyl, cTorus, tubeBetween } from '../geo.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { decoFacadeTextures, roofTexture, setAoUVs } from '../textures.js';
import {
  buildRooftopKitGeo,
  buildRooftopDishGeo,
  buildRooftopTankGeo,
} from '../buildings.js';
import { buildPalletWoodGeo, buildCardboardStackGeo } from '../props/alley-lot-marina.js';

// ============================================================
// Inland city dressing — six-sided deco mid-rises + rooftop kits
// + service-alley props. Signed cells in constants.js. hash01
// only; never rng/rng2/rng3/rng4. West of x=240. Not leftoverLot
// A–H. Not a travel-lane solid. Backdrop stays 60 boxes.
// ============================================================

const DECO_TILE_U = 14.4;
const DECO_TILE_V = 14;
const DECO_COLS = [0xf2b8c6, 0x7fd4c1, 0xf5e9d0, 0xffb385, 0xc3b4e6, 0xf7f4ec, 0xff8a70];

const KIT_COL = [
  [buildRooftopKitGeo, 5.2, 2.4, 4.2],
  [buildRooftopDishGeo, 4.8, 2.0, 2.8],
  [buildRooftopTankGeo, 4.0, 2.2, 2.2],
  [buildRoofAcUnitGeo, 1.7, 1.05, 1.33],
];

/**
 * Inland mid-rise plates inland of Ocean Drive. Rooftop kits + alley
 * pallets sit on the signed cells. Colliders match massing / kit /
 * pallet envelopes — never a box in an alley-pipe bay.
 */
export function buildInland(ctx) {
  const { root, track, addCollider, addCyl, setTag, regDN } = ctx;
  setTag('inland-midrise');

  const decoTex = decoFacadeTextures(4, 4);
  track(decoTex.albedo);
  track(decoTex.emissive);
  const tileRoofTex = track(roofTexture('tile', 11));
  tileRoofTex.repeat.set(4, 4);
  const tileRoofMat = track(new THREE.MeshStandardMaterial({
    map: tileRoofTex, color: 0xffffff, roughness: 0.78, metalness: 0.04,
  }));
  const soffitMat = track(new THREE.MeshStandardMaterial({
    color: 0x8a8680, roughness: 0.94, metalness: 0.02,
  }));
  const corniceMat = track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.82, metalness: 0.04,
  }));

  const group = new THREE.Group();
  group.name = 'inland-midrises';

  const kitSpots = [[], [], [], []];
  const plates = inlandMidrises();
  for (let i = 0; i < plates.length; i++) {
    const g = plates[i];
    if (g.x1 + 0.8 >= 240) continue;
    if (leftoverLotOverlap(g.x, g.z, g.w, g.d, 0.15)) continue;
    if (helipadOverlap(g.x, g.z, g.w, g.d, 0.15)) continue;
    if (streetOverlap(g.x, g.z, g.w, g.d)) continue;

    const offU = hash01((g.x * 7) | 0, (g.z * 13) | 0);
    const offV = hash01((g.x * 11) | 0, (g.z * 17) | 0);
    const color = DECO_COLS[(hash01((g.x) | 0, (g.z) | 0) * DECO_COLS.length) | 0];
    const wallMat = regDN(track(new THREE.MeshStandardMaterial({
      color, roughness: 0.75,
      map: decoTex.albedo,
      emissiveMap: decoTex.emissive,
      emissive: 0xffb060, emissiveIntensity: 0,
    })), 0.0, 2.45);
    wallMat.color.lerp(new THREE.Color(0xffffff), 0.1);

    const court = isCourtWellCell(g.x, g.z) && !isInlandArcadeCell(g.x, g.z);
    if (court) {
      const sideW = (g.w - COURT_WELL_W) / 2;
      const frontD = (g.d - COURT_WELL_D) / 2;
      const yC = CITY_Y + g.h / 2;
      const masses = [
        { x: g.x - (COURT_WELL_W / 2 + sideW / 2), z: g.z, w: sideW, d: g.d },
        { x: g.x + (COURT_WELL_W / 2 + sideW / 2), z: g.z, w: sideW, d: g.d },
        { x: g.x, z: g.z - (COURT_WELL_D / 2 + frontD / 2), w: COURT_WELL_W, d: frontD },
        { x: g.x, z: g.z + (COURT_WELL_D / 2 + frontD / 2), w: COURT_WELL_W, d: frontD },
      ];
      for (let m = 0; m < masses.length; m++) {
        const s = masses[m];
        const kit = buildDecoMidriseGeos(s.w, g.h, s.d, DECO_TILE_U, DECO_TILE_V, offU, offV);
        setAoUVs(kit.walls);
        const walls = new THREE.Mesh(track(kit.walls), wallMat);
        walls.position.set(s.x, yC, s.z);
        walls.castShadow = true;
        group.add(walls);
        const lid = new THREE.Mesh(track(kit.roof), tileRoofMat);
        lid.position.set(s.x, yC, s.z);
        lid.castShadow = true;
        group.add(lid);
        addCollider(s.x, CITY_Y, s.z, s.w, g.h, s.d);
        kit.soffit.dispose();
        kit.cornice.dispose();
      }
    } else if (isInlandArcadeCell(g.x, g.z)) {
      const soffit = INLAND_ARCADE_SOFFIT;
      const openW = INLAND_ARCADE_OPEN_W;
      const jambW = (g.w - openW) / 2;
      const uh = g.h - soffit;
      const masses = [
        { x: g.x - (openW / 2 + jambW / 2), z: g.z, w: jambW, d: g.d, h: soffit, y0: CITY_Y },
        { x: g.x + (openW / 2 + jambW / 2), z: g.z, w: jambW, d: g.d, h: soffit, y0: CITY_Y },
        { x: g.x, z: g.z, w: g.w, d: g.d, h: uh, y0: CITY_Y + soffit },
      ];
      for (let m = 0; m < masses.length; m++) {
        const s = masses[m];
        const kit = buildDecoMidriseGeos(s.w, s.h, s.d, DECO_TILE_U, DECO_TILE_V, offU, offV);
        setAoUVs(kit.walls);
        const yC = s.y0 + s.h / 2;
        const walls = new THREE.Mesh(track(kit.walls), wallMat);
        walls.position.set(s.x, yC, s.z);
        walls.castShadow = true;
        group.add(walls);
        const lid = new THREE.Mesh(track(kit.roof), tileRoofMat);
        lid.position.set(s.x, yC, s.z);
        lid.castShadow = true;
        group.add(lid);
        addCollider(s.x, s.y0, s.z, s.w, s.h, s.d);
        kit.soffit.dispose();
        kit.cornice.dispose();
      }
    } else {
      const kit = buildDecoMidriseGeos(g.w, g.h, g.d, DECO_TILE_U, DECO_TILE_V, offU, offV);
      setAoUVs(kit.walls);
      const walls = new THREE.Mesh(track(kit.walls), wallMat);
      walls.position.set(g.x, CITY_Y + g.h / 2, g.z);
      walls.castShadow = true;
      group.add(walls);
      const lid = new THREE.Mesh(track(kit.roof), tileRoofMat);
      lid.position.set(g.x, CITY_Y + g.h / 2, g.z);
      lid.castShadow = true;
      lid.receiveShadow = true;
      group.add(lid);
      const sof = new THREE.Mesh(track(kit.soffit), soffitMat);
      sof.position.set(g.x, CITY_Y + g.h / 2, g.z);
      group.add(sof);
      const cor = new THREE.Mesh(track(kit.cornice), corniceMat);
      cor.position.set(g.x, CITY_Y + g.h / 2, g.z);
      group.add(cor);
      addCollider(g.x, CITY_Y, g.z, g.w, g.h, g.d);
    }

    const isWhoop = ROOF_AC_CELLS.some(([x, z]) => x === g.x && z === g.z)
      || ROOF_RING_CELLS.some(([x, z]) => x === g.x && z === g.z)
      || court;
    if (isWhoop) continue;

    const which = hash01((g.x * 19) | 0, (g.z * 23) | 0);
    const ki = which < 0.28 ? 0 : which < 0.52 ? 1 : which < 0.78 ? 2 : 3;
    const ox = (hash01((g.x) | 0, 41) - 0.5) * (g.w - 8);
    const oz = (hash01((g.z) | 0, 43) - 0.5) * (g.d - 8);
    const ry = ((hash01((g.x) | 0, (g.z) | 0) * 4) | 0) * (Math.PI / 2);
    kitSpots[ki].push({
      x: g.x + ox, y: CITY_Y + g.h + 0.02, z: g.z + oz, ry,
    });
    const [, kw, kh, kd] = KIT_COL[ki];
    addCollider(g.x + ox, CITY_Y + g.h, g.z + oz, kw, kh, kd);
  }

  const roofMat = track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.8,
  }));
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0);
  const names = [
    'inland-rooftops-ac',
    'inland-rooftops-dish',
    'inland-rooftops-tank',
    'inland-rooftops-ac-unit',
  ];
  for (let k = 0; k < KIT_COL.length; k++) {
    const spots = kitSpots[k];
    if (!spots.length) continue;
    const im = new THREE.InstancedMesh(track(KIT_COL[k][0]()), roofMat, spots.length);
    im.name = names[k];
    im.castShadow = true;
    for (let i = 0; i < spots.length; i++) {
      const sp = spots[i];
      p.set(sp.x, sp.y, sp.z);
      q.setFromAxisAngle(up, sp.ry || 0);
      m4.compose(p, q, s);
      im.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true;
    group.add(im);
  }

  setTag('roof-whoop');
  const whoopBits = [];
  const GALV = 0x9ba3ab, SHROUD = 0x3c4249, PAINT = 0x2fe0ff;
  for (let i = 0; i < ROOF_AC_CELLS.length; i++) {
    const g = roofAcGapGeom(ROOF_AC_CELLS[i][0], ROOF_AC_CELLS[i][1], `roof-ac-${i}`);
    for (const ux of [g.leftX, g.rightX]) {
      whoopBits.push(cBox(g.unitW, g.unitH, g.unitD, GALV,
        ux, g.y0 + g.unitH / 2, g.z));
      whoopBits.push(cCyl(0.42, 0.42, 0.08, 10, SHROUD,
        ux, g.y0 + g.unitH - 0.04, g.z));
    }
  }
  for (let i = 0; i < ROOF_RING_CELLS.length; i++) {
    const g = roofRingGeom(ROOF_RING_CELLS[i][0], ROOF_RING_CELLS[i][1], `roof-ring-${i}`);
    whoopBits.push(cTorus(g.r, g.tube, 8, 20, PAINT, g.x, g.y, g.z, 0, Math.PI / 2, 0));
  }
  if (whoopBits.length) {
    const geo = track(mergeGeometries(whoopBits));
    whoopBits.forEach((g) => g.dispose());
    const mesh = new THREE.Mesh(geo, track(new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.42, metalness: 0.4,
    })));
    mesh.castShadow = true;
    mesh.name = 'roof-whoops';
    group.add(mesh);
  }
  installFlyColliders(addCyl, addCollider, 'roof-whoop');

  setTag('inland-alley');
  const pallets = [];
  const cardboard = [];
  // Existing 0–3 keep hash01(i) pallet draws. Appended alleys so those
  // draws stay put. West skyline pair at x=-720 is last.
  const alleys = [
    [-430, 248], [-250, 248], [-80, 248], [100, 248], [-600, 248],
    [-660, 248], [-540, 248], [-390, 248], [-190, 248], [160, 248], [210, 248],
    [-720, 248], [-160, 248], [130, 248], [190, 248],
  ];
  for (let i = 0; i < alleys.length; i++) {
    const [cx, cz] = alleys[i];
    for (const sx of [-5.6, 5.6]) {
      const x = cx + sx;
      const z = cz + (hash01(i, 1901 + (sx > 0 ? 3 : 1)) - 0.5) * 1.4;
      if (leftoverLotOverlap(x, z, 1.2, 1.0, 0.15)) continue;
      if (streetOverlap(x, z, 1.2, 1.0)) continue;
      pallets.push({ x, y: CITY_Y, z, ry: hash01(i, 1907) < 0.5 ? 0 : Math.PI });
      addCollider(x, CITY_Y, z, 1.2, 0.14, 1.0);
    }
    const bx = cx + (hash01(i, 1913) < 0.5 ? -4.2 : 4.2);
    const bz = cz + (hash01(i, 1919) - 0.5) * 1.2;
    if (!leftoverLotOverlap(bx, bz, 0.8, 0.43, 0.15) && !streetOverlap(bx, bz, 0.8, 0.43)) {
      cardboard.push({ x: bx, y: CITY_Y, z: bz, ry: hash01(i, 1923) < 0.5 ? 0 : Math.PI });
      addCollider(bx, CITY_Y, bz, 0.8, 0.82, 0.43);
    }
  }
  const alleyMat = track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.86, metalness: 0.04,
  }));
  placeInstanced(group, track(buildPalletWoodGeo()), alleyMat, pallets, 'inland-alley-pallets');
  placeInstanced(group, track(buildCardboardStackGeo()), alleyMat, cardboard, 'inland-alley-cardboard');

  const DUMP = 0x2f6a3a, DUMP2 = 0x3d7a48, RUST = 0x6a3a28;
  const CONC = 0x8a8680, RUBBER = 0x1a1c20;
  const dumpBits = [];
  for (let i = 0; i < ALLEY_DUMPSTER_CELLS.length; i++) {
    const [x, z] = ALLEY_DUMPSTER_CELLS[i];
    if (x >= 240) continue;
    if (leftoverLotOverlap(x, z, ALLEY_DUMP_W, ALLEY_DUMP_D, 0.15)) continue;
    if (streetOverlap(x, z, ALLEY_DUMP_W, ALLEY_DUMP_D)) continue;
    if (alleySolidHitsWhoop(x, z, ALLEY_DUMP_W, ALLEY_DUMP_D)) continue;
    const y0 = CITY_Y;
    dumpBits.push(cBox(ALLEY_DUMP_W, ALLEY_DUMP_H, ALLEY_DUMP_D, DUMP,
      x, y0 + ALLEY_DUMP_H / 2, z));
    dumpBits.push(cBox(ALLEY_DUMP_W + 0.04, 0.06, ALLEY_DUMP_D + 0.04, DUMP2,
      x, y0 + ALLEY_DUMP_H + 0.02 + hash01(i, 2201) * 0.03, z));
    dumpBits.push(cBox(0.06, 0.22, ALLEY_DUMP_D * 0.55, RUST,
      x + ALLEY_DUMP_W / 2 + 0.02, y0 + ALLEY_DUMP_H * 0.62, z));
    addCollider(x, y0, z, ALLEY_DUMP_W - 0.08, ALLEY_DUMP_H, ALLEY_DUMP_D - 0.08);
  }
  for (let i = 0; i < ALLEY_DOCK_CELLS.length; i++) {
    const [x, z] = ALLEY_DOCK_CELLS[i];
    if (x >= 240) continue;
    if (leftoverLotOverlap(x, z, ALLEY_DOCK_W, ALLEY_DOCK_D, 0.15)) continue;
    if (streetOverlap(x, z, ALLEY_DOCK_W, ALLEY_DOCK_D)) continue;
    if (alleySolidHitsWhoop(x, z, ALLEY_DOCK_W, ALLEY_DOCK_D)) continue;
    const y0 = CITY_Y;
    dumpBits.push(cBox(ALLEY_DOCK_W, ALLEY_DOCK_H, ALLEY_DOCK_D, CONC,
      x, y0 + ALLEY_DOCK_H / 2, z));
    dumpBits.push(cBox(ALLEY_DOCK_W + 0.08, 0.22, 0.16, RUBBER,
      x, y0 + ALLEY_DOCK_H + 0.10, z + ALLEY_DOCK_D / 2 - 0.08));
    addCollider(x, y0, z, ALLEY_DOCK_W, ALLEY_DOCK_H, ALLEY_DOCK_D);
  }
  if (dumpBits.length) {
    const geo = track(mergeGeometries(dumpBits));
    dumpBits.forEach((g) => g.dispose());
    const mesh = new THREE.Mesh(geo, track(new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.82, metalness: 0.12,
    })));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = 'inland-alley-dumpsters';
    group.add(mesh);
  }

  const lampSpots = [];
  for (let i = 0; i < ALLEY_LAMP_CELLS.length; i++) {
    const [x, z] = ALLEY_LAMP_CELLS[i];
    if (x >= 240) continue;
    if (leftoverLotOverlap(x, z, 0.4, 0.4, 0.15)) continue;
    if (streetOverlap(x, z, 0.4, 0.4)) continue;
    if (alleySolidHitsWhoop(x, z, 0.4, 0.4)) continue;
    const yaw = (z < 248 ? 0 : Math.PI) + (hash01(i, 2303) - 0.5) * 0.08;
    lampSpots.push({ x, y: CITY_Y, z, yaw });
    addCyl(x, CITY_Y, z, ALLEY_LAMP_R, ALLEY_LAMP_H);
  }
  if (lampSpots.length) {
    const poleGeos = [
      new THREE.CylinderGeometry(0.055, 0.085, ALLEY_LAMP_H, 7).translate(0, ALLEY_LAMP_H / 2, 0),
      tubeBetween(
        new THREE.Vector3(0, ALLEY_LAMP_H - 0.08, 0),
        new THREE.Vector3(0, ALLEY_LAMP_H + 0.42, 0.62), 0.045, 6),
      tubeBetween(
        new THREE.Vector3(0, ALLEY_LAMP_H + 0.42, 0.62),
        new THREE.Vector3(0, ALLEY_LAMP_H + 0.52, ALLEY_LAMP_ARM), 0.04, 6),
      new THREE.CylinderGeometry(0.11, 0.15, 0.14, 8)
        .translate(0, ALLEY_LAMP_H + 0.44, ALLEY_LAMP_ARM - 0.06),
    ];
    const poleGeo = track(mergeGeometries(poleGeos));
    poleGeos.forEach((g) => g.dispose());
    const headGeo = track(new THREE.SphereGeometry(0.13, 8, 6));
    headGeo.translate(0, ALLEY_LAMP_H + 0.32, ALLEY_LAMP_ARM - 0.06);
    const poleMat = track(new THREE.MeshStandardMaterial({
      color: 0x39424c, roughness: 0.6, metalness: 0.6,
    }));
    const headMat = regDN(track(new THREE.MeshStandardMaterial({
      color: 0xfff2cc, emissive: 0xffd27a, emissiveIntensity: 2.2,
    })), 0.15, 2.4);
    const lp = new THREE.InstancedMesh(poleGeo, poleMat, lampSpots.length);
    const lh = new THREE.InstancedMesh(headGeo, headMat, lampSpots.length);
    lp.name = 'inland-alley-lamps';
    lh.name = 'inland-alley-lamp-heads';
    lp.castShadow = true;
    for (let i = 0; i < lampSpots.length; i++) {
      const sp = lampSpots[i];
      m4.makeRotationY(sp.yaw);
      m4.setPosition(sp.x, sp.y, sp.z);
      lp.setMatrixAt(i, m4);
      lh.setMatrixAt(i, m4);
    }
    lp.instanceMatrix.needsUpdate = true;
    lh.instanceMatrix.needsUpdate = true;
    group.add(lp);
    group.add(lh);
  }

  root.add(group);
  setTag('world');
  return { group };
}

function placeInstanced(group, geo, mat, spots, name) {
  if (!spots.length) return;
  const im = new THREE.InstancedMesh(geo, mat, spots.length);
  im.name = name;
  im.castShadow = true;
  im.receiveShadow = true;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < spots.length; i++) {
    const sp = spots[i];
    p.set(sp.x, sp.y, sp.z);
    q.setFromAxisAngle(up, sp.ry || 0);
    m4.compose(p, q, s);
    im.setMatrixAt(i, m4);
  }
  im.instanceMatrix.needsUpdate = true;
  group.add(im);
}
