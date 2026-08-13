import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seabedHeight } from '../constants.js';
import { mulberry32 } from '../rng.js';
import { colorFill, cBox, cCyl, cSph, cTorus } from '../geo.js';

// ============================================================
// Cape lighthouse on a rock jetty at the south end of the beach.
//
// Rubble-mound jetty walking out into the water, granite plinth,
// tapered red/white banded tower with a gallery railing, glazed
// lantern room and a rotating emissive beam. Keeper's cottage and
// a fog-bell davit at the base.
// ============================================================

const LH_X = 470;            // south end of the beach, clear of the marina (x 300)
const LH_Z = -68;
const JETTY_Z0 = -6, JETTY_Z1 = -78;
const JETTY_TOP = 1.6;
const TOWER_H = 24;
const R_BOT = 3.2, R_TOP = 2.0;

const WHITE = 0xf2efe6, RED = 0xbb352c, GRANITE = 0x7d7a73, GRANITE2 = 0x6a675f;
const METAL = 0x2f3439, BRASS = 0xb9903f, GLASSDK = 0x14202a;

const bandRadius = (t) => R_BOT + (R_TOP - R_BOT) * t;

/**
 * Build the lighthouse + jetty.
 * @returns {{ group: THREE.Group, update: (dt:number)=>void }}
 */
export function buildLighthouse(ctx) {
  const { root, track, addCollider, setTag } = ctx;
  setTag('lighthouse');
  const regDN = ctx.regDN;
  const regDNColor = ctx.regDNColor;
  const r = mulberry32(0x11614E);      // local stream — touches no layout rng

  const rock = [];        // jetty rubble + granite plinth
  const shell = [];       // painted tower bands, cottage walls
  const metal = [];       // railings, astragals, davit, lamp housing
  const glassG = [];      // lantern glazing + cottage windows

  // ---------------- rubble-mound jetty ----------------
  // A causeway of tumbled armour stone: a continuous berm from the wet sand out
  // to the tower, with a paved crown you could land on. Boulders are irregular
  // low-poly solids (not cubes) packed shoulder to shoulder so the mound reads
  // as one mass rather than scattered crates.
  {
    const len = JETTY_Z0 - JETTY_Z1;
    const steps = Math.round(len / 1.7);
    // Low-poly indexed sphere pushed around by a hash OF THE VERTEX POSITION —
    // seam duplicates share a position, so they share a displacement and the
    // stone stays watertight (a per-call random would tear it open).
    const boulder = (s) => {
      const g = new THREE.SphereGeometry(s, 6, 4);
      const seed = r() * 977;
      const p = g.attributes.position;
      for (let v = 0; v < p.count; v++) {
        const x = p.getX(v), y = p.getY(v), z = p.getZ(v);
        const h = Math.sin((x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453);
        const k = 0.7 + 0.44 * (h - Math.floor(h));
        p.setXYZ(v, x * k, y * k * 0.78, z * k);
      }
      p.needsUpdate = true;
      g.computeVertexNormals();
      return g;
    };
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const z = JETTY_Z0 - t * len;
      const bed = seabedHeight(LH_X, z);
      // berm section: wide at the shore, wrapping the tower plinth at the end
      const nearTower = Math.max(0, 1 - Math.abs(z - LH_Z) / 14);
      const halfW = 4.4 - 1.1 * t + 4.0 * nearTower;
      const rows = 4;
      for (let k = 0; k < rows; k++) {
        const u = (k / (rows - 1) - 0.5) * 2;                 // -1..1 across
        const bx = LH_X + u * halfW + (r() - 0.5) * 1.1;
        // flanks slope down to the seabed, crown sits just under the walkway
        const crown = JETTY_TOP - 0.35 - Math.abs(u) * (JETTY_TOP - bed) * 0.62;
        const s = 0.95 + r() * 0.95;
        const g = boulder(s);
        g.rotateY(r() * Math.PI);
        g.rotateZ((r() - 0.5) * 0.6);
        g.translate(bx, crown - s * 0.35 + (r() - 0.5) * 0.3, z + (r() - 0.5) * 1.1);
        rock.push(colorFill(g, r() < 0.5 ? GRANITE : GRANITE2));
      }
      // walkway slab down the crown of the jetty
      if (i < steps && i % 2 === 0) {
        rock.push(cBox(3.4, 0.4, 3.5, 0x8b877e, LH_X, JETTY_TOP - 0.2, z - 1.7));
        for (const s2 of [-1, 1]) {
          rock.push(cBox(0.34, 0.5, 3.5, 0x9b968c, LH_X + s2 * 1.75, JETTY_TOP - 0.05, z - 1.7));
        }
      }
    }
    // colliders every ~9 m so the jetty is solid without 200 boxes
    for (let z = JETTY_Z0; z > JETTY_Z1; z -= 9) {
      addCollider(LH_X, JETTY_TOP - 2.6, z - 4.5, 11, 4, 9);
    }
  }

  // ---------------- granite plinth ----------------
  rock.push(cCyl(5.2, 5.8, 1.5, 16, GRANITE, LH_X, JETTY_TOP + 0.65, LH_Z));
  rock.push(cCyl(4.6, 5.2, 0.35, 16, GRANITE2, LH_X, JETTY_TOP + 1.55, LH_Z));
  const baseY = JETTY_TOP + 1.7;

  // ---------------- tapered banded tower ----------------
  {
    const BANDS = 5;
    for (let b = 0; b < BANDS; b++) {
      const t0 = b / BANDS, t1 = (b + 1) / BANDS;
      const h = TOWER_H / BANDS;
      const g = new THREE.CylinderGeometry(bandRadius(t1), bandRadius(t0), h, 22, 1, true);
      g.translate(LH_X, baseY + (t0 + t1) / 2 * TOWER_H, LH_Z);
      shell.push(colorFill(g, b % 2 === 0 ? WHITE : RED));
    }
    // entrance door + hood at the foot of the tower
    shell.push(cBox(1.5, 2.5, 0.3, WHITE, LH_X, baseY + 1.25, LH_Z - R_BOT + 0.05));
    glassG.push(new THREE.BoxGeometry(1.05, 2.1, 0.14).translate(LH_X, baseY + 1.1, LH_Z - R_BOT - 0.06));
    shell.push(cBox(2.0, 0.22, 0.7, WHITE, LH_X, baseY + 2.7, LH_Z - R_BOT - 0.2));
    // three window slits up the shaft, staggered around the shell
    for (let i = 0; i < 3; i++) {
      const ty = 0.24 + i * 0.24;
      const a = -Math.PI / 2 + (i % 2 ? 0.5 : -0.5);
      const rr = bandRadius(ty) - 0.05;
      const wx = LH_X + Math.cos(a) * rr, wz = LH_Z + Math.sin(a) * rr;
      glassG.push(new THREE.BoxGeometry(0.55, 1.15, 0.5).translate(wx, baseY + ty * TOWER_H, wz));
      metal.push(cBox(0.7, 1.3, 0.14, METAL, wx, baseY + ty * TOWER_H, wz, 0, -a - Math.PI / 2, 0));
    }
  }

  const galY = baseY + TOWER_H;

  // ---------------- gallery deck + railing ----------------
  {
    // corbel ring under the deck
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      metal.push(cBox(0.3, 0.5, 0.7, WHITE,
        LH_X + Math.cos(a) * (R_TOP + 0.3), galY - 0.42, LH_Z + Math.sin(a) * (R_TOP + 0.3),
        0, -a, 0));
    }
    shell.push(cCyl(R_TOP + 1.15, R_TOP + 1.05, 0.3, 22, WHITE, LH_X, galY + 0.15, LH_Z));
    metal.push(cTorus(R_TOP + 1.1, 0.06, 6, 24, METAL, LH_X, galY + 1.15, LH_Z, Math.PI / 2));
    metal.push(cTorus(R_TOP + 1.1, 0.045, 6, 24, METAL, LH_X, galY + 0.72, LH_Z, Math.PI / 2));
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      metal.push(cCyl(0.035, 0.035, 1.05, 5, METAL,
        LH_X + Math.cos(a) * (R_TOP + 1.1), galY + 0.75, LH_Z + Math.sin(a) * (R_TOP + 1.1)));
    }
  }

  // ---------------- lantern room ----------------
  const lampY = galY + 2.0;
  {
    metal.push(cCyl(R_TOP - 0.15, R_TOP - 0.15, 0.25, 16, METAL, LH_X, galY + 0.42, LH_Z));
    const lr = R_TOP - 0.35;
    const lg = new THREE.CylinderGeometry(lr, lr, 3.0, 16, 1, true);
    lg.translate(LH_X, lampY, LH_Z);
    glassG.push(lg);
    for (let i = 0; i < 8; i++) {                       // astragal bars
      const a = (i / 8) * Math.PI * 2;
      metal.push(cBox(0.11, 3.0, 0.11, METAL, LH_X + Math.cos(a) * lr, lampY, LH_Z + Math.sin(a) * lr));
    }
    metal.push(cTorus(lr, 0.07, 6, 18, METAL, LH_X, lampY + 1.5, LH_Z, Math.PI / 2));
    metal.push(cTorus(lr, 0.07, 6, 18, METAL, LH_X, lampY - 1.5, LH_Z, Math.PI / 2));
    // domed copper roof + vent ball + lightning finial
    const dome = new THREE.SphereGeometry(lr + 0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    dome.scale(1, 0.75, 1);
    dome.translate(LH_X, lampY + 1.5, LH_Z);
    metal.push(colorFill(dome, 0x3f6b5c));
    metal.push(cSph(0.28, 10, 8, BRASS, LH_X, lampY + 3.05, LH_Z));
    metal.push(cCyl(0.05, 0.05, 1.2, 5, METAL, LH_X, lampY + 3.75, LH_Z));
  }

  // ---------------- keeper's cottage + fog-bell davit ----------------
  {
    const kx = LH_X - 7.4, kz = LH_Z + 5.5;
    shell.push(cBox(7.2, 3.2, 5.0, WHITE, kx, JETTY_TOP + 1.6, kz));
    rock.push(cBox(7.6, 0.5, 5.4, GRANITE, kx, JETTY_TOP + 0.25, kz));
    // gabled roof from two sloped slabs
    for (const s of [-1, 1]) {
      shell.push(cBox(7.8, 0.28, 3.3, RED, kx, JETTY_TOP + 3.85, kz + s * 1.28, s * 0.42));
    }
    shell.push(cBox(0.9, 1.6, 0.9, GRANITE2, kx + 2.3, JETTY_TOP + 4.7, kz));
    for (const s of [-1, 1]) {
      glassG.push(new THREE.BoxGeometry(1.1, 1.2, 0.12).translate(kx + s * 2.0, JETTY_TOP + 2.0, kz - 2.55));
      metal.push(cBox(1.28, 1.38, 0.1, METAL, kx + s * 2.0, JETTY_TOP + 2.0, kz - 2.49));
    }
    glassG.push(new THREE.BoxGeometry(0.95, 2.0, 0.12).translate(kx, JETTY_TOP + 2.0, kz - 2.55));
    addCollider(kx, JETTY_TOP, kz, 7.8, 4.6, 5.6);
    // fog-bell davit on the seaward side
    const bx = LH_X + 4.6, bz = LH_Z - 3.2;
    metal.push(cCyl(0.11, 0.13, 3.4, 8, METAL, bx, JETTY_TOP + 1.7, bz));
    metal.push(cBox(1.5, 0.14, 0.14, METAL, bx - 0.65, JETTY_TOP + 3.35, bz));
    const bell = new THREE.CylinderGeometry(0.45, 0.28, 0.75, 12, 1, true);
    bell.translate(bx - 1.25, JETTY_TOP + 2.9, bz);
    metal.push(colorFill(bell, BRASS));
  }

  addCollider(LH_X, JETTY_TOP, LH_Z, 7.2, TOWER_H + 8, 7.2);

  // ---------------- materialise ----------------
  const group = new THREE.Group();
  group.name = 'lighthouse';

  const mkMesh = (geos, mat) => {
    const g = track(mergeGeometries(geos));
    geos.forEach((x) => x.dispose());
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };
  mkMesh(rock, track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97, metalness: 0 })));
  mkMesh(shell, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.8, metalness: 0, side: THREE.DoubleSide,
  })));
  mkMesh(metal, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.45, metalness: 0.7, side: THREE.DoubleSide,
  })));
  {
    const g = track(mergeGeometries(glassG));
    glassG.forEach((x) => x.dispose());
    const mat = regDN(track(new THREE.MeshStandardMaterial({
      color: GLASSDK, metalness: 0.5, roughness: 0.05,
      envMapIntensity: 1.3, emissive: 0xffe6b0, emissiveIntensity: 0,
      side: THREE.DoubleSide,
    })), 0.02, 0.7);
    group.add(new THREE.Mesh(g, mat));
  }

  // ---------------- rotating beam ----------------
  const beam = new THREE.Group();
  beam.position.set(LH_X, lampY, LH_Z);
  const lampMat = regDN(track(new THREE.MeshStandardMaterial({
    color: 0xfff6df, emissive: 0xfff0c4, emissiveIntensity: 2.2,
  })), 0.8, 4.5);
  const lamp = new THREE.Mesh(track(new THREE.SphereGeometry(0.55, 14, 10)), lampMat);
  beam.add(lamp);
  // Fresnel drum: a ring of glass prisms around the lamp
  {
    const prisms = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      prisms.push(cBox(0.16, 2.0, 0.42, 0xbfe3ef,
        Math.cos(a) * 1.05, 0, Math.sin(a) * 1.05, 0, -a, 0));
    }
    const pg = track(mergeGeometries(prisms));
    prisms.forEach((g) => g.dispose());
    const pm = regDN(track(new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.05, metalness: 0.1,
      transparent: true, opacity: 0.55, emissive: 0xfff0c4, emissiveIntensity: 0,
    })), 0.05, 1.4);
    beam.add(new THREE.Mesh(pg, pm));
  }
  // the visible shaft of light — additive, so it disappears in daylight
  {
    const shaftGeo = track(new THREE.ConeGeometry(2.6, 90, 16, 1, true));
    shaftGeo.rotateZ(Math.PI / 2);      // point down +x
    shaftGeo.translate(45, 0, 0);
    // unlit: a black standard material still picks up the HDRI specular and
    // additive blending would leave the beam faintly visible at noon
    const shaftMat = regDNColor(track(new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true, opacity: 0.09, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })), 0xfff0c0);
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    beam.add(shaft);
    const shaft2 = new THREE.Mesh(shaftGeo, shaftMat);
    shaft2.rotation.y = Math.PI;        // second lobe, 180° opposed
    beam.add(shaft2);
  }
  group.add(beam);

  root.add(group);
  return {
    group,
    update(dt) { beam.rotation.y += dt * 0.42; },
  };
}
