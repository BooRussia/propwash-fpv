import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CLUB_X, CLUB_Z, FUEL_Z, groundHeight, seabedHeight } from '../constants.js';
import { colorFill, cBox, cCyl, cTube } from '../geo.js';
import { plankTexture } from '../textures.js';

// ============================================================
// Marina expansion — the yacht club and the fuel dock.
//
// The marina used to be three floating docks with no shore. It now has a
// reason to exist: a two-storey Streamline clubhouse on the dune with a
// wraparound balcony and a burgee mast, a timber gangway walking out over
// the shallows, and a covered fuel dock at the head of the centre pier.
//
// The fuel-dock canopy is a flythrough: 4.15 m of clear height over the
// deck and 5.30 m between the post faces.
// ============================================================

const CLUB_W = 26, CLUB_D = 15;
const TERRACE_D = 20;                 // stops 1 m short of the boardwalk
const FLOOR_Y = 1.62;
const GANG_X = CLUB_X;                // the walk runs between the outer fingers
const CANOPY_Y = 4.15;                // soffit over the fuel deck
const POST_GAP = 5.55;                // post CENTRES; 5.30 m clear
const PW = 9.0, PD = 12.0;            // fuel platform

const WHITE = 0xf4f1e8, WHITE2 = 0xe2ddd0, NAVY = 0x1d3d63, TEAK = 0xb08654;
const RAIL = 0xcfd5da, DARK = 0x252c33, GLASS_TINT = 0x8fb6c4;

/** Build the yacht club, gangway and fuel dock. */
export function buildYachtClub(ctx) {
  const { root, track, addCollider, addCyl, setTag, regDN } = ctx;
  setTag('yachtclub');

  const shell = [];      // rendered walls, roofs, plinths
  const metal = [];      // railings, masts, canopy frame, pumps
  const glassG = [];     // windows
  const glow = [];       // clubhouse lit interior + burgee lamp

  // ---------------- clubhouse ----------------
  {
    const gy = groundHeight(CLUB_X, CLUB_Z);
    // plinth + terrace
    shell.push(cBox(CLUB_W + 9, FLOOR_Y - gy + 0.5, TERRACE_D, WHITE2,
      CLUB_X, (gy - 0.5 + FLOOR_Y) / 2, CLUB_Z));
    addCollider(CLUB_X, gy - 0.5, CLUB_Z, CLUB_W + 9, FLOOR_Y - gy + 0.5, TERRACE_D);
    // ground floor
    shell.push(cBox(CLUB_W, 4.2, CLUB_D, WHITE, CLUB_X, FLOOR_Y + 2.1, CLUB_Z));
    // first floor, set back on the seaward side to leave a balcony
    shell.push(cBox(CLUB_W - 4, 3.6, CLUB_D - 3.4, WHITE, CLUB_X, FLOOR_Y + 6.0, CLUB_Z + 1.0));
    // flat roof caps with a rolled Streamline edge
    shell.push(cBox(CLUB_W + 0.7, 0.4, CLUB_D + 0.7, WHITE2, CLUB_X, FLOOR_Y + 4.4, CLUB_Z));
    shell.push(cBox(CLUB_W - 3.3, 0.4, CLUB_D - 2.7, WHITE2, CLUB_X, FLOOR_Y + 8.0, CLUB_Z + 1.0));
    // navy speed stripes
    for (const y of [FLOOR_Y + 3.3, FLOOR_Y + 3.62]) {
      shell.push(cBox(CLUB_W + 0.16, 0.18, CLUB_D + 0.16, NAVY, CLUB_X, y, CLUB_Z));
    }
    // seaward glazing, both floors
    glassG.push(new THREE.BoxGeometry(CLUB_W - 4.4, 2.5, 0.16)
      .translate(CLUB_X, FLOOR_Y + 2.2, CLUB_Z - CLUB_D / 2 - 0.02));
    glassG.push(new THREE.BoxGeometry(CLUB_W - 8.4, 2.1, 0.16)
      .translate(CLUB_X, FLOOR_Y + 6.1, CLUB_Z - CLUB_D / 2 + 1.72));
    glow.push(colorFill(new THREE.BoxGeometry(CLUB_W - 5.0, 2.2, 0.06)
      .translate(CLUB_X, FLOOR_Y + 2.2, CLUB_Z - CLUB_D / 2 + 0.3), 0x4b4634));
    glow.push(colorFill(new THREE.BoxGeometry(CLUB_W - 9.0, 1.8, 0.06)
      .translate(CLUB_X, FLOOR_Y + 6.1, CLUB_Z - CLUB_D / 2 + 2.0), 0x4b4634));
    // mullions
    for (let mx = -CLUB_W / 2 + 3.4; mx < CLUB_W / 2 - 2.4; mx += 2.6) {
      metal.push(cBox(0.12, 2.5, 0.2, RAIL, CLUB_X + mx, FLOOR_Y + 2.2, CLUB_Z - CLUB_D / 2 - 0.04));
    }
    // balcony deck + ship's railing on the seaward side of the upper floor
    shell.push(cBox(CLUB_W - 3.2, 0.22, 2.4, WHITE2, CLUB_X, FLOOR_Y + 4.5, CLUB_Z - CLUB_D / 2 + 1.5));
    for (let bx = -(CLUB_W - 3.6) / 2; bx <= (CLUB_W - 3.6) / 2; bx += 1.5) {
      metal.push(cCyl(0.035, 0.035, 1.05, 6, RAIL, CLUB_X + bx, FLOOR_Y + 5.13, CLUB_Z - CLUB_D / 2 + 0.42));
    }
    for (const ry of [1.05, 0.72, 0.4]) {
      metal.push(cBox(CLUB_W - 3.4, 0.055, 0.055, RAIL, CLUB_X, FLOOR_Y + 4.61 + ry, CLUB_Z - CLUB_D / 2 + 0.42));
    }
    addCollider(CLUB_X, FLOOR_Y, CLUB_Z, CLUB_W + 0.7, 4.8, CLUB_D + 0.7);
    addCollider(CLUB_X, FLOOR_Y + 4.2, CLUB_Z + 1.0, CLUB_W - 3.3, 4.2, CLUB_D - 2.7);
    addCollider(CLUB_X, FLOOR_Y + 4.4, CLUB_Z - CLUB_D / 2 + 1.5, CLUB_W - 3.2, 1.75, 2.4);

    // burgee mast with yardarm and signal flags
    const mx0 = CLUB_X + CLUB_W / 2 - 3.0;
    metal.push(cCyl(0.13, 0.2, 13, 10, RAIL, mx0, FLOOR_Y + 8.2 + 6.5, CLUB_Z + 1.0));
    metal.push(cBox(4.4, 0.11, 0.11, RAIL, mx0, FLOOR_Y + 18.4, CLUB_Z + 1.0));
    addCyl(mx0, FLOOR_Y + 8.2, CLUB_Z + 1.0, 0.22, 13);
    const FLAGS = [0xd94436, 0xf2c14e, 0x2f7fbf, 0xf4f1e8, 0x2fa37a];
    for (let i = 0; i < 5; i++) {
      shell.push(cBox(0.9, 0.62, 0.03, FLAGS[i], mx0 - 1.9 + i * 0.95, FLOOR_Y + 17.9, CLUB_Z + 1.0));
    }
    // entrance canopy on the landward face
    shell.push(cBox(7.0, 0.22, 2.6, WHITE2, CLUB_X, FLOOR_Y + 3.3, CLUB_Z + CLUB_D / 2 + 1.2));
    for (const s of [-1, 1]) {
      metal.push(cCyl(0.09, 0.11, 3.2, 8, RAIL, CLUB_X + s * 3.1, FLOOR_Y + 1.6, CLUB_Z + CLUB_D / 2 + 2.2));
      addCyl(CLUB_X + s * 3.1, FLOOR_Y, CLUB_Z + CLUB_D / 2 + 2.2, 0.12, 3.3);
    }
    addCollider(CLUB_X, FLOOR_Y + 3.19, CLUB_Z + CLUB_D / 2 + 1.2, 7.0, 0.24, 2.6);
  }

  // ---------------- gangway out to the fuel dock ----------------
  const deckTex = track(plankTexture(0x9c7750, 61, 512, 512, 16));
  deckTex.repeat.set(2, 14);
  {
    const z0 = CLUB_Z - TERRACE_D / 2;         // leaves the terrace edge
    const z1 = FUEL_Z + PD / 2;                // meets the fuel platform
    const len = z0 - z1;
    const geo = track(new THREE.BoxGeometry(3.6, 0.34, len));
    const mat = track(new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.92 }));
    const walk = new THREE.Mesh(geo, mat);
    walk.position.set(GANG_X, 1.28, (z0 + z1) / 2);
    walk.castShadow = true;
    walk.receiveShadow = true;
    walk.name = 'marina-gangway';
    root.add(walk);
    addCollider(GANG_X, 1.11, (z0 + z1) / 2, 3.6, 0.34, len);
    // ramp from the terrace down onto the walk
    shell.push(cBox(3.6, 0.3, 4.6, TEAK, GANG_X, 1.3, z0 + 2.2));
    addCollider(GANG_X, 1.15, z0 + 2.2, 3.6, 0.3, 4.6);
    // pylons + handrails
    for (let z = z1 + 3; z < z0; z += 7.5) {
      for (const s of [-1, 1]) {
        const bed = seabedHeight(GANG_X + s * 1.5, z);
        metal.push(cCyl(0.16, 0.19, 1.28 - bed, 8, DARK, GANG_X + s * 1.5, (bed + 1.28) / 2, z));
        addCyl(GANG_X + s * 1.5, bed, z, 0.19, 1.28 - bed);
      }
    }
    for (const s of [-1, 1]) {
      const rx = GANG_X + s * 1.72;
      for (let z = z1 + 1.2; z < z0; z += 2.5) {
        metal.push(cCyl(0.04, 0.045, 1.0, 6, RAIL, rx, 1.95, z));
      }
      metal.push(cBox(0.06, 0.06, len - 1, RAIL, rx, 2.42, (z0 + z1) / 2));
      metal.push(cBox(0.05, 0.05, len - 1, RAIL, rx, 2.06, (z0 + z1) / 2));
      addCollider(rx, 1.45, (z0 + z1) / 2, 0.1, 1.05, len - 1);
    }
  }

  // ---------------- fuel dock ----------------
  {
    const px = GANG_X, pz = FUEL_Z;
    const geo = track(new THREE.BoxGeometry(PW, 0.4, PD));
    const mat = track(new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.92 }));
    const plat = new THREE.Mesh(geo, mat);
    plat.position.set(px, 1.25, pz);
    plat.receiveShadow = true;
    plat.name = 'fuel-dock';
    root.add(plat);
    addCollider(px, 1.05, pz, PW, 0.4, PD);
    // piles
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const bx = px + sx * (PW / 2 - 0.6), bz = pz + sz * (PD / 2 - 0.6);
        const bed = seabedHeight(bx, bz);
        metal.push(cCyl(0.22, 0.26, 1.45 - bed + 0.8, 8, DARK, bx, (bed + 2.25) / 2, bz));
        addCyl(bx, bed, bz, 0.26, 2.25 - bed);
      }
    }
    // canopy: 4 posts, flat roof, valance
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const cx = px + sx * POST_GAP / 2, cz = pz + sz * 3.4;
        metal.push(cCyl(0.12, 0.14, CANOPY_Y - 1.45, 10, RAIL, cx, (1.45 + CANOPY_Y) / 2, cz));
        addCyl(cx, 1.45, cz, 0.14, CANOPY_Y - 1.45);
      }
    }
    shell.push(cBox(PW - 0.6, 0.3, PD - 2.0, WHITE, px, CANOPY_Y + 0.15, pz));
    shell.push(cBox(PW - 0.2, 0.3, PD - 1.6, NAVY, px, CANOPY_Y + 0.45, pz));
    shell.push(cBox(PW + 0.2, 0.16, PD - 1.4, WHITE2, px, CANOPY_Y + 0.68, pz));
    addCollider(px, CANOPY_Y, pz, PW + 0.2, 0.76, PD - 1.4);
    // fuel pumps + hose reels
    for (const s of [-1, 1]) {
      const fx = px + s * 2.3;
      shell.push(cBox(0.75, 1.65, 0.6, s > 0 ? 0xd94436 : 0x2f7fbf, fx, 1.45 + 0.82, pz + 1.4));
      metal.push(cBox(0.62, 0.34, 0.1, DARK, fx, 1.45 + 1.25, pz + 1.08));
      metal.push(cCyl(0.2, 0.2, 0.28, 10, DARK, fx, 1.45 + 1.9, pz + 1.4, 0, 0, Math.PI / 2));
      addCollider(fx, 1.45, pz + 1.4, 0.78, 1.7, 0.62);
      glow.push(colorFill(new THREE.BoxGeometry(0.5, 0.22, 0.04)
        .translate(fx, 1.45 + 1.28, pz + 1.02), 0xffd9a0));
    }
    // "FUEL" board hung under the canopy
    glow.push(colorFill(new THREE.BoxGeometry(3.2, 0.66, 0.06)
      .translate(px, CANOPY_Y - 0.45, pz - PD / 2 + 1.05), 0xffe9b8));
    metal.push(cBox(3.4, 0.86, 0.14, DARK, px, CANOPY_Y - 0.45, pz - PD / 2 + 1.0));
    // mooring bollards + fenders down the seaward edge
    for (let z = -PD / 2 + 1.6; z < PD / 2 - 1.0; z += 3.2) {
      for (const s of [-1, 1]) {
        const bx = px + s * (PW / 2 - 0.25);
        metal.push(cCyl(0.13, 0.16, 0.55, 8, DARK, bx, 1.72, pz + z));
        metal.push(cCyl(0.19, 0.19, 0.1, 8, DARK, bx, 2.0, pz + z));
        addCyl(bx, 1.45, pz + z, 0.19, 0.6);
        metal.push(cTube(new THREE.Vector3(bx + s * 0.3, 1.42, pz + z - 0.7),
          new THREE.Vector3(bx + s * 0.3, 1.42, pz + z + 0.7), 0.11, 6, 0x14181c));
      }
    }
  }

  // ---------------- materialise ----------------
  const mk = (geos, mat, name) => {
    if (!geos.length) return;
    const g = track(mergeGeometries(geos));
    geos.forEach((x) => x.dispose());
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    m.name = name;
    root.add(m);
  };
  mk(shell, track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0.02 })), 'club-shell');
  mk(metal, track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.7 })), 'club-metal');
  if (glassG.length) {
    const g = track(mergeGeometries(glassG));
    glassG.forEach((x) => x.dispose());
    const mat = track(new THREE.MeshStandardMaterial({
      color: GLASS_TINT, metalness: 0.55, roughness: 0.06,
      transparent: true, opacity: 0.44, depthWrite: false, envMapIntensity: 1.2,
    }));
    const m = new THREE.Mesh(g, mat);
    m.name = 'club-glass';
    root.add(m);
  }
  mk(glow, regDN(track(new THREE.MeshStandardMaterial({
    vertexColors: true, emissive: 0xffdcae, emissiveIntensity: 1.6, roughness: 0.6,
  })), 0.06, 2.0), 'club-glow');

  // palms flanking the club forecourt, rejection-tested by the palm pass
  for (const s of [-1, 1]) {
    ctx.extraPalms.push({ x: CLUB_X + s * (CLUB_W / 2 + 6.5), z: CLUB_Z - 4, sc: 1.0 });
    ctx.extraPalms.push({ x: CLUB_X + s * (CLUB_W / 2 + 6.5), z: CLUB_Z + 6, sc: 0.9 });
  }

  setTag('world');
}
