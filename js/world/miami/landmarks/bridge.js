import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seabedHeight } from '../constants.js';
import { colorFill, cBox, cCyl, cTube } from '../geo.js';

// ============================================================
// Cable-stayed causeway across the marina inlet.
//
// A single A-frame pylon carries a fanned cable stay system down to a
// 440 m deck sitting 12 m over the water — the classic FPV line is to
// dive under the deck, pull up through the cable fan and roll out over
// the pylon. Piers every 55 m, railings, lamp standards.
// ============================================================

const BR_Z = -118;             // deck centre line (seaward of the marina docks)
const X0 = 120, X1 = 560;      // deck runs off toward both headlands
const DECK_Y = 12.7;           // deck slab centre
const DECK_W = 11;             // carriageway + walkways
const PYLON_X = 340;
const PYLON_TOP = 52;
const PIER_X = [120, 175, 230, 285, 395, 450, 505, 560];

const CONC = 0x8d8a83, CONC2 = 0x7a776f, DARKC = 0x5b5952;
const ASPHALT = 0x2b2e32, STEEL = 0x9aa2a9, CABLE = 0xb8bec4;

/**
 * Build the cable-stayed bridge.
 * @returns {{ group: THREE.Group }}
 */
export function buildBridge(ctx) {
  const { root, track, addCollider } = ctx;
  const regDN = ctx.regDN;

  const conc = [];      // deck, piers, pylon
  const steel = [];     // railings, cables, lamp columns
  const road = [];      // asphalt wearing course + markings

  const len = X1 - X0;
  const cx = (X0 + X1) / 2;
  const halfD = DECK_W / 2;

  // ---------------- deck ----------------
  conc.push(cBox(len, 1.1, DECK_W, CONC, cx, DECK_Y, BR_Z));
  // edge fascia beams + the two longitudinal box girders under the slab
  for (const s of [-1, 1]) {
    conc.push(cBox(len, 0.6, 0.55, CONC2, cx, DECK_Y + 0.5, BR_Z + s * (halfD - 0.2)));
    conc.push(cBox(len, 1.5, 1.9, DARKC, cx, DECK_Y - 1.25, BR_Z + s * 2.8));
  }
  // wearing course + lane markings
  road.push(cBox(len, 0.06, DECK_W - 2.6, ASPHALT, cx, DECK_Y + 0.58, BR_Z));
  for (let x = X0 + 3; x < X1; x += 12) {
    road.push(cBox(6, 0.02, 0.22, 0xe6dfc8, x, DECK_Y + 0.62, BR_Z));
  }
  for (const s of [-1, 1]) {
    road.push(cBox(len, 0.02, 0.18, 0xe6dfc8, cx, DECK_Y + 0.62, BR_Z + s * (halfD - 1.45)));
  }
  addCollider(cx, DECK_Y - 2.2, BR_Z, len, 3.6, DECK_W + 0.4);

  // ---------------- railings ----------------
  for (const s of [-1, 1]) {
    const rz = BR_Z + s * (halfD + 0.05);
    for (let x = X0 + 2; x <= X1 - 2; x += 4) {
      steel.push(cBox(0.09, 1.15, 0.09, STEEL, x, DECK_Y + 1.15, rz));
    }
    for (const ry of [1.72, 1.28, 0.86]) {
      const t = ry === 1.72 ? 0.09 : 0.055;
      steel.push(cBox(len - 4, t, ry === 1.72 ? 0.11 : t, STEEL, cx, DECK_Y + ry, rz));
    }
  }

  // ---------------- piers ----------------
  for (const px of PIER_X) {
    const bed = seabedHeight(px, BR_Z);
    const h = DECK_Y - 1.9 - bed;
    for (const s of [-1, 1]) {
      conc.push(cCyl(1.15, 1.5, h, 14, CONC, px, bed + h / 2, BR_Z + s * 3.1));
    }
    conc.push(cBox(3.6, 1.4, DECK_W - 1.2, CONC2, px, DECK_Y - 1.35, BR_Z));   // pier cap
    conc.push(cBox(6.2, 0.9, 9.6, DARKC, px, bed + 0.45, BR_Z));               // pile cap
    addCollider(px, bed, BR_Z, 6.4, h + 1.6, 9.8);
  }

  // ---------------- A-frame pylon ----------------
  {
    const bed = seabedHeight(PYLON_X, BR_Z);
    conc.push(cBox(11, 1.6, 16, DARKC, PYLON_X, bed + 0.8, BR_Z));
    for (const s of [-1, 1]) {
      conc.push(cCyl(1.9, 2.4, DECK_Y - 2.2 - bed, 14, CONC,
        PYLON_X, bed + (DECK_Y - 2.2 - bed) / 2, BR_Z + s * 4.6));
    }
    conc.push(cBox(6.4, 1.8, DECK_W + 4, CONC2, PYLON_X, DECK_Y - 1.5, BR_Z));

    // the two inclined legs, meeting at the apex
    for (const s of [-1, 1]) {
      const p0 = new THREE.Vector3(PYLON_X, DECK_Y - 0.6, BR_Z + s * 5.0);
      const p1 = new THREE.Vector3(PYLON_X, PYLON_TOP - 4.5, BR_Z);
      const legLen = p0.distanceTo(p1);
      const g = new THREE.BoxGeometry(3.1, legLen, 2.5);
      g.rotateX(Math.atan2(p1.z - p0.z, p1.y - p0.y));
      g.translate((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2);
      conc.push(colorFill(g, CONC));
    }
    // apex head + cross strut
    conc.push(cBox(3.4, 9.0, 3.6, CONC, PYLON_X, PYLON_TOP - 4.5, BR_Z));
    conc.push(cBox(2.6, 1.2, 9.0, CONC2, PYLON_X, DECK_Y + 13, BR_Z));
    conc.push(cBox(3.9, 1.0, 4.2, CONC2, PYLON_X, PYLON_TOP + 0.3, BR_Z));
    addCollider(PYLON_X, bed, BR_Z, 11.5, PYLON_TOP + 2, 16.5);

  }

  // ---------------- fanned stay cables ----------------
  {
    const anchors = [18, 36, 54, 72, 90, 108];
    for (const s of [-1, 1]) {                    // deck edge
      for (const dir of [-1, 1]) {                // toward each headland
        for (let i = 0; i < anchors.length; i++) {
          const ax = PYLON_X + dir * anchors[i];
          if (ax < X0 + 4 || ax > X1 - 4) continue;
          const top = new THREE.Vector3(
            PYLON_X, PYLON_TOP - 8.5 + i * 1.35, BR_Z + s * 0.55
          );
          const bot = new THREE.Vector3(ax, DECK_Y + 0.9, BR_Z + s * (halfD - 0.6));
          steel.push(cTube(top, bot, 0.11, 5, CABLE));
          // anchorage block on the deck
          conc.push(cBox(1.0, 1.1, 0.9, CONC2, ax, DECK_Y + 1.05, BR_Z + s * (halfD - 0.6)));
        }
      }
    }
  }

  // ---------------- lamp standards ----------------
  const lampSpots = [];
  for (let x = X0 + 20; x <= X1 - 20; x += 30) {
    const s = ((x / 30) | 0) % 2 ? 1 : -1;
    const rz = BR_Z + s * (halfD - 0.35);
    steel.push(cCyl(0.11, 0.15, 7.2, 8, STEEL, x, DECK_Y + 4.2, rz));
    steel.push(cBox(1.5, 0.12, 0.12, STEEL, x, DECK_Y + 7.75, rz - s * 0.7));
    steel.push(cBox(0.7, 0.16, 0.32, STEEL, x, DECK_Y + 7.62, rz - s * 1.3));
    lampSpots.push([x, DECK_Y + 7.5, rz - s * 1.3]);
  }

  // ---------------- materialise ----------------
  const group = new THREE.Group();
  group.name = 'bridge';
  const mkMesh = (geos, mat) => {
    const g = track(mergeGeometries(geos));
    geos.forEach((x) => x.dispose());
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  };
  mkMesh(conc, track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.02 })));
  mkMesh(steel, track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.8 })));
  mkMesh(road, track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 })));

  {
    const lampGeo = track(new THREE.BoxGeometry(0.6, 0.1, 0.26));
    const lampMat = regDN(track(new THREE.MeshStandardMaterial({
      color: 0xfff3d6, emissive: 0xffd9a0, emissiveIntensity: 2.4,
    })), 0.12, 2.8);
    const lamps = new THREE.InstancedMesh(lampGeo, lampMat, lampSpots.length);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < lampSpots.length; i++) {
      m4.makeTranslation(lampSpots[i][0], lampSpots[i][1], lampSpots[i][2]);
      lamps.setMatrixAt(i, m4);
    }
    lamps.instanceMatrix.needsUpdate = true;
    group.add(lamps);
  }

  // aviation warning beacon on the pylon head
  {
    const beaconMat = regDN(track(new THREE.MeshStandardMaterial({
      color: 0x2a0000, emissive: 0xff2a2a, emissiveIntensity: 3,
    })), 1.6, 4.2);
    const beacon = new THREE.Mesh(track(new THREE.SphereGeometry(0.5, 10, 8)), beaconMat);
    beacon.position.set(PYLON_X, PYLON_TOP + 1.3, BR_Z);
    group.add(beacon);
  }

  root.add(group);
  return { group };
}
