import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  WHEEL_X, WHEEL_Z, WHEEL_R, ARCH_X,
  PLAZA_X0, PLAZA_X1, PLAZA_Z0, PLAZA_Z1, PLAZA_Y,
  groundHeight,
} from '../constants.js';
import { colorFill, cBox, cCyl, cTube, tubeBetween } from '../geo.js';
import { plankTexture } from '../textures.js';

// ============================================================
// Pier Park — the beachfront amusement plaza.
//
// The wheel used to stand in the middle of the Ocean Drive carriageway. It
// now sits on a proper timber-and-terrazzo deck on the sand between the pier
// root and the north lifeguard stand, its deck flush with the boardwalk
// (PLAZA_Y === boardwalk deck top) so the two read as one promenade.
//
// Support is a Riesenrad-style pair of VERTICAL lattice pylons standing
// clear of the wheel disc on either side of the axle. Vertical chords mean
// every structural collider is an exact cylinder — nothing fat is thrown
// around an inclined member — and the axial corridor through the wheel stays
// genuinely open: 8.6 m between the inner chords, split into two 3.8 m
// windows by the axle at hub height.
//
// Rotating members (rims, spokes, cabins) deliberately carry no colliders:
// the static bag cannot follow them, and a phantom collider on a moving part
// is worse than none.
// ============================================================

const PYL_DZ = 5.2;          // pylon centres, +-Z from the wheel plane
const BASE_HALF = 1.55;      // battered base section chord offset
const TOP_HALF = 1.05;       // upper section chord offset
const BASE_TOP = 7.0;        // where the base section ends
const CHORD_R0 = 0.30, CHORD_R1 = 0.24;
const HUB_Y = PLAZA_Y + WHEEL_R + 4.6;

const STEEL = 0xd6dbe0, STEEL2 = 0xaeb6bd, DARK = 0x39414a;
const CONC = 0x8d887c, CONC2 = 0x776f66, TERRAZZO = 0xd8cfbc;
const CAB_COLS = [0xff5c8a, 0x29d3ff, 0xffd166, 0x43d17a, 0xff8c42, 0x9b5de5];

/**
 * Pier Park: deck, midway arch, ticket kiosk, lamp columns, string lights and
 * the ferris wheel itself.
 * @returns {{ wheel: THREE.Group }} `wheel` is spun by the map update loop.
 */
export function buildFerris(ctx) {
  const { root, track, addCollider, addCyl, addOBB, setTag, regDN } = ctx;
  setTag('pierpark');

  const deckW = PLAZA_X1 - PLAZA_X0;
  const deckD = PLAZA_Z1 - PLAZA_Z0;
  const deckX = (PLAZA_X0 + PLAZA_X1) / 2;
  const deckZ = (PLAZA_Z0 + PLAZA_Z1) / 2;

  const stone = [];      // deck slab, kerbs, plinths, kiosk body
  const steel = [];      // pylons, rails, lamp columns, arch frame
  const neonA = [];      // warm neon (arch + kiosk fascia)
  const neonB = [];      // cyan neon (deck edge trim)

  // ---------------- deck ----------------
  // A raised terrazzo deck on a plank sub-frame. Top is PLAZA_Y, which is the
  // boardwalk deck plane, so the pilot can skim straight off the boardwalk
  // onto the midway without a step.
  {
    const deckTex = track(plankTexture(0xb9ad95, 77, 512, 512, 14));
    deckTex.repeat.set(deckW / 2.6, deckD / 2.6);
    const slabGeo = track(new THREE.BoxGeometry(deckW, 0.34, deckD));
    const slabMat = track(new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.9 }));
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.set(deckX, PLAZA_Y - 0.17, deckZ);
    slab.receiveShadow = true;
    root.add(slab);

    // skirt down to the sand, a touch inset so the deck reads as an overhang
    const sk = [];
    for (const s of [-1, 1]) {
      sk.push(cBox(deckW - 0.9, 1.3, 0.5, CONC2, deckX, PLAZA_Y - 0.99, deckZ + s * (deckD / 2 - 0.45)));
      sk.push(cBox(0.5, 1.3, deckD - 0.9, CONC2, deckX + s * (deckW / 2 - 0.45), PLAZA_Y - 0.99, deckZ));
    }
    // kerb lip all the way round
    sk.push(cBox(deckW, 0.16, 0.42, TERRAZZO, deckX, PLAZA_Y + 0.08, PLAZA_Z0 + 0.21));
    sk.push(cBox(deckW, 0.16, 0.42, TERRAZZO, deckX, PLAZA_Y + 0.08, PLAZA_Z1 - 0.21));
    for (const s of [-1, 1]) {
      sk.push(cBox(0.42, 0.16, deckD - 0.84, TERRAZZO, deckX + s * (deckW / 2 - 0.21), PLAZA_Y + 0.08, deckZ));
    }
    // three steps down to the sand on the seaward face, centred on the wheel
    for (let i = 0; i < 3; i++) {
      sk.push(cBox(13 - i * 1.1, 0.22, 0.62, CONC,
        WHEEL_X, PLAZA_Y - 0.28 - i * 0.34, PLAZA_Z0 - 0.35 - i * 0.62));
    }
    stone.push(...sk);
    // one slab collider: the deck is a landing surface, not a wall
    addCollider(deckX, PLAZA_Y - 1.0, deckZ, deckW, 1.0, deckD);
  }

  // ---------------- midway arch on the boardwalk side ----------------
  // 4.4 m clear between the piers, 3.7 m clear under the header — the
  // signature "thread the needle" entry to the park.
  const ARCH_Z = PLAZA_Z1 - 1.1;
  {
    const ARCH_HALF = 2.2 + 0.35;            // pier centre offset (clear + radius)
    for (const s of [-1, 1]) {
      const px = ARCH_X + s * ARCH_HALF;
      steel.push(cCyl(0.35, 0.42, 4.3, 12, STEEL, px, PLAZA_Y + 2.15, ARCH_Z));
      stone.push(cCyl(0.62, 0.7, 0.34, 12, CONC, px, PLAZA_Y + 0.17, ARCH_Z));
      addCyl(px, PLAZA_Y, ARCH_Z, 0.42, 4.3);
    }
    // header: a flat plate with a shallow arched under-edge
    steel.push(cBox(ARCH_HALF * 2 + 1.5, 1.25, 0.5, STEEL, ARCH_X, PLAZA_Y + 4.92, ARCH_Z));
    steel.push(cBox(ARCH_HALF * 2 + 1.9, 0.22, 0.66, STEEL2, ARCH_X, PLAZA_Y + 5.62, ARCH_Z));
    for (const s of [-1, 1]) {
      steel.push(cBox(0.9, 0.5, 0.5, STEEL2, ARCH_X + s * (ARCH_HALF + 0.6), PLAZA_Y + 4.05, ARCH_Z));
    }
    addCollider(ARCH_X, PLAZA_Y + 4.3, ARCH_Z, ARCH_HALF * 2 + 1.9, 1.45, 0.7);
    // neon sign band + a row of chase bulbs across the header
    neonA.push(cBox(ARCH_HALF * 2 + 0.6, 0.62, 0.09, 0xffd7a0, ARCH_X, PLAZA_Y + 4.95, ARCH_Z - 0.31));
    for (let i = -6; i <= 6; i++) {
      neonB.push(cCyl(0.075, 0.075, 0.09, 6, 0x9ff0ff, ARCH_X + i * 0.46, PLAZA_Y + 5.62, ARCH_Z - 0.35, Math.PI / 2));
    }
  }

  // ---------------- ticket kiosk ----------------
  {
    const kx = ARCH_X - 8.5, kz = PLAZA_Z1 - 3.8, ky = PLAZA_Y;
    const yaw = -0.22;
    const kiosk = [];
    kiosk.push(cBox(3.6, 2.5, 2.6, TERRAZZO, 0, 1.25, 0));
    kiosk.push(cBox(3.9, 0.26, 2.9, CONC2, 0, 2.62, 0));
    kiosk.push(cBox(4.3, 0.16, 3.3, CONC, 0, 2.83, 0));           // capping cornice
    kiosk.push(cBox(2.2, 0.9, 0.14, DARK, 0, 1.55, -1.32));       // service window
    kiosk.push(cBox(2.6, 0.16, 0.7, 0xb04a4a, 0, 2.06, -1.5));    // little canopy
    for (const s of [-1, 1]) kiosk.push(cCyl(0.05, 0.05, 0.62, 6, STEEL2, s * 1.15, 1.79, -1.72));
    const kg = mergeGeometries(kiosk);
    kiosk.forEach((g) => g.dispose());
    kg.rotateY(yaw);
    kg.translate(kx, ky, kz);
    stone.push(kg);
    neonA.push((() => {
      const g = colorFill(new THREE.BoxGeometry(2.9, 0.4, 0.07), 0xffca7a);
      g.rotateY(yaw); g.translate(kx + Math.sin(yaw) * -1.36, ky + 2.36, kz - Math.cos(yaw) * 1.36);
      return g;
    })());
    addOBB(kx, ky, kz, 4.3, 2.99, 3.3, yaw);
  }

  // ---------------- midway lamp columns + guard rail ----------------
  const lampHeads = [];
  {
    for (const lx of [PLAZA_X0 + 6, PLAZA_X0 + 20, PLAZA_X1 - 20, PLAZA_X1 - 6]) {
      for (const lz of [PLAZA_Z0 + 2.0, PLAZA_Z1 - 2.0]) {
        steel.push(cCyl(0.085, 0.12, 3.6, 8, STEEL2, lx, PLAZA_Y + 1.8, lz));
        steel.push(cCyl(0.2, 0.14, 0.22, 8, DARK, lx, PLAZA_Y + 3.68, lz));
        addCyl(lx, PLAZA_Y, lz, 0.13, 3.7);
        lampHeads.push([lx, PLAZA_Y + 3.5, lz]);
      }
    }
    // guard rail down both long edges, broken where the steps and the arch
    // land. The colliders are split at the same gaps — a continuous rail box
    // would wall off the entrance the arch exists to frame.
    for (const rz of [PLAZA_Z0 + 0.28, PLAZA_Z1 - 0.28]) {
      const seaward = rz < deckZ;
      const gap = seaward ? 7.6 : 4.6;
      const gapX = seaward ? WHEEL_X : ARCH_X;
      let prev = null;
      for (let x = PLAZA_X0 + 1.2; x <= PLAZA_X1 - 1.2; x += 2.6) {
        if (Math.abs(x - gapX) < gap) { prev = null; continue; }
        steel.push(cCyl(0.045, 0.055, 1.0, 6, STEEL2, x, PLAZA_Y + 0.5, rz));
        if (prev !== null) {
          for (const ry of [0.94, 0.56]) {
            steel.push(cTube(new THREE.Vector3(prev, PLAZA_Y + ry, rz),
              new THREE.Vector3(x, PLAZA_Y + ry, rz), 0.028, 5, STEEL2));
          }
        }
        prev = x;
      }
      for (const s of [-1, 1]) {
        const x0 = s < 0 ? PLAZA_X0 + 1.2 : gapX + gap;
        const x1 = s < 0 ? gapX - gap : PLAZA_X1 - 1.2;
        if (x1 - x0 < 1) continue;
        addCollider((x0 + x1) / 2, PLAZA_Y, rz, x1 - x0, 1.0, 0.12);
      }
    }
  }

  // ---------------- the two lattice pylons ----------------
  {
    for (const zs of [-1, 1]) {
      const pz = WHEEL_Z + zs * PYL_DZ;
      // concrete plinth
      stone.push(cBox(4.4, 0.55, 4.4, CONC, WHEEL_X, PLAZA_Y + 0.27, pz));
      stone.push(cBox(3.9, 0.3, 3.9, CONC2, WHEEL_X, PLAZA_Y + 0.68, pz));
      addCollider(WHEEL_X, PLAZA_Y, pz, 4.4, 0.85, 4.4);

      // battered base section: 4 vertical chords, exact cylinder colliders
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const cx = WHEEL_X + sx * BASE_HALF, cz = pz + sz * BASE_HALF;
          steel.push(cCyl(CHORD_R0, CHORD_R0, BASE_TOP - PLAZA_Y - 0.8, 8, STEEL,
            cx, (PLAZA_Y + 0.8 + BASE_TOP) / 2, cz));
          addCyl(cx, PLAZA_Y + 0.8, cz, CHORD_R0, BASE_TOP - PLAZA_Y - 0.8);
        }
      }
      // upper section chords
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const cx = WHEEL_X + sx * TOP_HALF, cz = pz + sz * TOP_HALF;
          steel.push(cCyl(CHORD_R1, CHORD_R1, HUB_Y - BASE_TOP, 8, STEEL,
            cx, (BASE_TOP + HUB_Y) / 2, cz));
          addCyl(cx, BASE_TOP, cz, CHORD_R1, HUB_Y - BASE_TOP);
        }
      }
      // shoulder struts from the base chords in to the upper chords
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          steel.push(cTube(
            new THREE.Vector3(WHEEL_X + sx * BASE_HALF, BASE_TOP - 0.1, pz + sz * BASE_HALF),
            new THREE.Vector3(WHEEL_X + sx * TOP_HALF, BASE_TOP + 1.9, pz + sz * TOP_HALF),
            0.16, 6, STEEL2));
        }
      }
      // horizontal ties + X bracing on all four faces (thin lattice: no
      // colliders — a 12 cm rod is below the resolution a pilot flies to)
      const levels = [];
      for (let y = PLAZA_Y + 1.4; y < HUB_Y - 0.5; y += 3.05) levels.push(y);
      levels.push(HUB_Y - 0.5);
      for (let i = 0; i < levels.length; i++) {
        const y = levels[i];
        const h = y < BASE_TOP ? BASE_HALF : TOP_HALF;
        for (const sx of [-1, 1]) {
          steel.push(cBox(0.13, 0.13, h * 2, STEEL2, WHEEL_X + sx * h, y, pz));
        }
        for (const sz of [-1, 1]) {
          steel.push(cBox(h * 2, 0.13, 0.13, STEEL2, WHEEL_X, y, pz + sz * h));
        }
        if (i + 1 < levels.length) {
          const y2 = levels[i + 1];
          const h2 = y2 < BASE_TOP ? BASE_HALF : TOP_HALF;
          for (const sz of [-1, 1]) {
            steel.push(cTube(new THREE.Vector3(WHEEL_X - h, y, pz + sz * h),
              new THREE.Vector3(WHEEL_X + h2, y2, pz + sz * h2), 0.075, 5, STEEL2));
            steel.push(cTube(new THREE.Vector3(WHEEL_X + h, y, pz + sz * h),
              new THREE.Vector3(WHEEL_X - h2, y2, pz + sz * h2), 0.075, 5, STEEL2));
          }
          for (const sx of [-1, 1]) {
            steel.push(cTube(new THREE.Vector3(WHEEL_X + sx * h, y, pz - h),
              new THREE.Vector3(WHEEL_X + sx * h2, y2, pz + h2), 0.075, 5, STEEL2));
          }
        }
      }
      // bearing head
      steel.push(cBox(2.5, 1.5, 2.5, STEEL, WHEEL_X, HUB_Y, pz));
      steel.push(cCyl(0.95, 0.95, 1.1, 12, STEEL2, WHEEL_X, HUB_Y, pz, Math.PI / 2));
      addCollider(WHEEL_X, HUB_Y - 0.75, pz, 2.5, 1.5, 2.5);
    }
    // axle spanning the two bearings — the one thing crossing the corridor
    steel.push(cCyl(0.5, 0.5, PYL_DZ * 2 - 0.6, 14, STEEL2, WHEEL_X, HUB_Y, WHEEL_Z, Math.PI / 2));
    addOBB(WHEEL_X, HUB_Y - 0.5, WHEEL_Z, 1.0, 1.0, PYL_DZ * 2 - 0.6, 0);
  }

  // ---------------- the wheel itself (rotating, no colliders) ----------------
  const wheel = new THREE.Group();
  {
    const RIM_Z = 1.7;
    const rimMat = regDN(track(new THREE.MeshStandardMaterial({
      color: 0x1b2330, emissive: 0x29d3ff, emissiveIntensity: 1.6, roughness: 0.4, metalness: 0.3,
    })), 0.55, 2.6);
    const rimGeo = track(new THREE.TorusGeometry(WHEEL_R, 0.32, 8, 56));
    for (const zs of [-1, 1]) {
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.z = zs * RIM_Z;
      wheel.add(rim);
    }
    const spokeMat = track(new THREE.MeshStandardMaterial({ color: 0xc9d2da, roughness: 0.45, metalness: 0.5 }));
    {
      const braceGeos = [];
      for (let i = 0; i < 28; i++) {
        const g = new THREE.BoxGeometry(0.15, 0.15, RIM_Z * 2);
        g.translate(0, WHEEL_R, 0);
        g.rotateZ((i / 28) * Math.PI * 2);
        braceGeos.push(g);
      }
      // tension spokes: thin rods from the hub to every rim node, both rims
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        for (const zs of [-1, 1]) {
          braceGeos.push(tubeBetween(
            new THREE.Vector3(0, 0, zs * 0.55),
            new THREE.Vector3(Math.cos(a) * WHEEL_R, Math.sin(a) * WHEEL_R, zs * RIM_Z), 0.055, 4));
        }
      }
      // hub drum + 6 heavy compression spokes
      for (let i = 0; i < 6; i++) {
        const g = new THREE.BoxGeometry(0.24, WHEEL_R * 2, 0.24);
        g.rotateZ((i / 6) * Math.PI);
        braceGeos.push(g);
      }
      const drum = new THREE.CylinderGeometry(1.5, 1.5, 2.6, 14);
      drum.rotateX(Math.PI / 2);
      braceGeos.push(drum);
      const spokes = new THREE.Mesh(track(mergeGeometries(braceGeos)), spokeMat);
      braceGeos.forEach((g) => g.dispose());
      spokes.castShadow = true;
      wheel.add(spokes);
    }
    // gondolas: enclosed cabin, pyramid cap, hanger yoke
    const cabParts = [new THREE.BoxGeometry(2.15, 1.55, 2.15).translate(0, -0.5, 0)];
    {
      const cap = new THREE.ConeGeometry(1.66, 0.72, 4);
      cap.rotateY(Math.PI / 4);
      cap.translate(0, 0.66, 0);
      cabParts.push(cap);
      cabParts.push(new THREE.BoxGeometry(0.1, 0.85, 0.1).translate(0, 1.3, 0));
      cabParts.push(new THREE.BoxGeometry(1.0, 0.1, 0.1).translate(0, 1.7, 0));
    }
    const cabGeo = track(mergeGeometries(cabParts));
    cabParts.forEach((g) => g.dispose());
    const NCAB = 14;
    for (let i = 0; i < NCAB; i++) {
      const a = (i / NCAB) * Math.PI * 2;
      const col = CAB_COLS[i % CAB_COLS.length];
      const cabMat = regDN(track(new THREE.MeshStandardMaterial({
        color: col, roughness: 0.45, emissive: col, emissiveIntensity: 0.8,
      })), 0.12, 1.35);
      const cab = new THREE.Mesh(cabGeo, cabMat);
      cab.position.set(Math.cos(a) * (WHEEL_R - 1.75), Math.sin(a) * (WHEEL_R - 1.75), 0);
      cab.castShadow = true;
      cab.userData.angle = a;
      wheel.add(cab);
    }
    wheel.position.set(WHEEL_X, HUB_Y, WHEEL_Z);
    root.add(wheel);
  }

  // ---------------- string lights over the midway ----------------
  const bulbSpots = [];
  {
    const spans = [
      [PLAZA_X0 + 5, PLAZA_X1 - 5, PLAZA_Z0 + 2.0],
      [PLAZA_X0 + 5, PLAZA_X1 - 5, PLAZA_Z1 - 2.0],
    ];
    for (const [x0, x1, z] of spans) {
      const segs = 46;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const x = x0 + (x1 - x0) * t;
        // catenary sag between the lamp columns (4 bays)
        const bay = (t * 4) % 1;
        const y = PLAZA_Y + 3.45 - 0.55 * Math.sin(bay * Math.PI);
        if (i % 2 === 0) bulbSpots.push([x, y - 0.14, z]);
        if (i < segs) {
          const t2 = (i + 1) / segs;
          const bay2 = (t2 * 4) % 1;
          steel.push(cTube(
            new THREE.Vector3(x, y, z),
            new THREE.Vector3(x0 + (x1 - x0) * t2, PLAZA_Y + 3.45 - 0.55 * Math.sin(bay2 * Math.PI), z),
            0.018, 4, DARK));
        }
      }
    }
  }

  // ---------------- materialise ----------------
  const mk = (geos, mat) => {
    if (!geos.length) return;
    const g = track(mergeGeometries(geos));
    geos.forEach((x) => x.dispose());
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
  };
  mk(stone, track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.02 })));
  mk(steel, track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.72 })));
  mk(neonA, regDN(track(new THREE.MeshStandardMaterial({
    vertexColors: true, emissive: 0xffffff, emissiveIntensity: 2.6, roughness: 0.4,
  })), 0.5, 3.0));
  mk(neonB, regDN(track(new THREE.MeshStandardMaterial({
    vertexColors: true, emissive: 0xffffff, emissiveIntensity: 2.6, roughness: 0.4,
  })), 0.4, 3.2));

  // lamp heads + festoon bulbs — one instanced emissive mesh each
  {
    const headGeo = track(new THREE.SphereGeometry(0.17, 8, 6));
    const headMat = regDN(track(new THREE.MeshStandardMaterial({
      color: 0xfff3d8, emissive: 0xffd08a, emissiveIntensity: 2.2,
    })), 0.1, 2.6);
    const heads = new THREE.InstancedMesh(headGeo, headMat, lampHeads.length);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < lampHeads.length; i++) {
      m4.makeTranslation(lampHeads[i][0], lampHeads[i][1], lampHeads[i][2]);
      heads.setMatrixAt(i, m4);
    }
    heads.instanceMatrix.needsUpdate = true;
    heads.name = 'pierpark-lamps';
    root.add(heads);

    const bulbGeo = track(new THREE.SphereGeometry(0.075, 6, 5));
    const bulbMat = regDN(track(new THREE.MeshStandardMaterial({
      color: 0xfff0cf, emissive: 0xffc978, emissiveIntensity: 2.0,
    })), 0.06, 2.8);
    const bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, bulbSpots.length);
    for (let i = 0; i < bulbSpots.length; i++) {
      m4.makeTranslation(bulbSpots[i][0], bulbSpots[i][1], bulbSpots[i][2]);
      bulbs.setMatrixAt(i, m4);
    }
    bulbs.instanceMatrix.needsUpdate = true;
    bulbs.name = 'pierpark-festoon';
    root.add(bulbs);
  }

  // sand apron so the deck does not sit on bare dune noise
  {
    const apron = track(new THREE.CircleGeometry(1, 8));
    apron.rotateX(-Math.PI / 2);
    const apronMat = track(new THREE.MeshStandardMaterial({
      color: 0xd9c9a4, roughness: 1,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }));
    const m = new THREE.Mesh(apron, apronMat);
    m.scale.set(deckW * 0.62, 1, deckD * 0.9);
    m.position.set(deckX, groundHeight(deckX, deckZ) + 0.02, deckZ);
    m.receiveShadow = true;
    root.add(m);
  }

  setTag('world');
  return { wheel };
}
