import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CITY_Y, CINEMA_X, CINEMA_FRONT_Z, CINEMA_W, CINEMA_D } from '../constants.js';
import { colorFill, cBox, cCyl } from '../geo.js';
import { stuccoTexture, setAoUVs } from '../textures.js';

// ============================================================
// The Tropicaire — a 1938 Streamline Moderne cinema, continuing the Ocean
// Drive strip east of the art-deco hotel row.
//
// Symmetrical stucco block with a stepped ziggurat parapet, a cantilevered
// marquee wrapping the entrance, a recessed terrazzo forecourt with a
// free-standing box office, and the thing that makes it a landmark from the
// air: a 24 m vertical blade sign on the west corner.
//
// Flyable geometry:
//   - under the marquee: 4.30 m soffit over the forecourt, 3.6 m deep
//   - between the blade sign and the facade: 1.85 m slot, 24 m tall
// ============================================================

const FZ = CINEMA_FRONT_Z;
const CZ = FZ + CINEMA_D / 2;
const BODY_H = 15.5;
const MARQ_Y = 4.3;               // marquee soffit
const MARQ_H = 2.35;
const MARQ_D = 3.6;
const BLADE_X = CINEMA_X - CINEMA_W / 2 + 3.4;
const BLADE_TOP = 30.5;

const STUCCO = 0xf3ece0, STUCCO2 = 0xe4d9c6, TRIM = 0x2f6f86, TERRAZZO = 0xcabfa8;
const DARK = 0x1d242b, CHROME = 0xb9c1c7, PANEL = 0x8f2438;

/** Build the art-deco cinema. */
export function buildCinema(ctx) {
  const { root, track, addCollider, addCyl, setTag, regDN } = ctx;
  setTag('cinema');

  const stucco = [];      // stucco walls, parapets, fins
  const trim = [];        // dark trim, chrome, marquee frame
  const glassG = [];      // lobby glazing + poster cases
  const neonC = [];       // cyan neon tubes
  const neonW = [];       // warm marquee bulbs + title board
  const neonR = [];       // red blade-sign letters

  const W = CINEMA_W, D = CINEMA_D;

  // ---------------- main block ----------------
  {
    stucco.push(cBox(W, BODY_H, D, STUCCO, CINEMA_X, CITY_Y + BODY_H / 2, CZ));
    // stepped ziggurat parapet, three steps, centred
    stucco.push(cBox(W + 0.5, 0.7, D + 0.5, STUCCO2, CINEMA_X, CITY_Y + BODY_H + 0.35, CZ));
    stucco.push(cBox(W * 0.62, 2.4, D * 0.55, STUCCO, CINEMA_X, CITY_Y + BODY_H + 1.9, CZ - 1.5));
    stucco.push(cBox(W * 0.38, 2.2, D * 0.42, STUCCO, CINEMA_X, CITY_Y + BODY_H + 4.2, CZ - 2.4));
    stucco.push(cBox(W * 0.2, 1.8, D * 0.3, STUCCO2, CINEMA_X, CITY_Y + BODY_H + 6.2, CZ - 3.0));
    // three horizontal "speed lines" wrapping the facade
    for (let i = 0; i < 3; i++) {
      const y = CITY_Y + 9.6 + i * 0.95;
      trim.push(cBox(W + 0.36, 0.16, D + 0.36, TRIM, CINEMA_X, y, CZ));
      neonC.push(colorFill(new THREE.BoxGeometry(W + 0.45, 0.075, 0.06)
        .translate(CINEMA_X, y, FZ - 0.24), 0x59e8ff));
    }
    // projecting central bay with vertical fins. It STARTS above the marquee:
    // a full-height bay would wall off the covered forecourt underneath it.
    const BAY_Y0 = CITY_Y + MARQ_Y + MARQ_H + 0.4;
    const bayH = CITY_Y + BODY_H + 3.2 - BAY_Y0;
    stucco.push(cBox(W * 0.42, bayH, 1.1, STUCCO2, CINEMA_X, BAY_Y0 + bayH / 2, FZ - 0.55));
    // fins run from just above the marquee to the parapet
    for (let i = -4; i <= 4; i++) {
      stucco.push(cBox(0.42, BODY_H - 8.0, 0.55, STUCCO,
        CINEMA_X + i * 1.9, CITY_Y + 7.4 + (BODY_H - 8.0) / 2, FZ - 1.1));
    }
    // porthole windows on the flanks
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const px = CINEMA_X + s * (W / 2 - 4.2 - i * 3.4);
        trim.push(cCyl(0.85, 0.85, 0.3, 14, TRIM, px, CITY_Y + 12.4, FZ - 0.12, Math.PI / 2));
        glassG.push(new THREE.CylinderGeometry(0.66, 0.66, 0.16, 14)
          .rotateX(Math.PI / 2).translate(px, CITY_Y + 12.4, FZ - 0.24));
      }
    }
    addCollider(CINEMA_X, CITY_Y, CZ, W + 0.5, BODY_H + 1.05, D + 0.5);
    addCollider(CINEMA_X, CITY_Y + BODY_H + 0.7, CZ - 1.5, W * 0.62, 2.4, D * 0.55);
    addCollider(CINEMA_X, CITY_Y + BODY_H + 3.1, CZ - 2.4, W * 0.38, 2.2, D * 0.42);
    addCollider(CINEMA_X, CITY_Y + BODY_H + 5.3, CZ - 3.0, W * 0.2, 1.8, D * 0.3);
    addCollider(CINEMA_X, BAY_Y0, FZ - 1.1, W * 0.42, bayH, 1.2);
  }

  // ---------------- marquee ----------------
  {
    const mw = W * 0.72;
    trim.push(cBox(mw, 0.22, MARQ_D, DARK, CINEMA_X, CITY_Y + MARQ_Y + 0.11, FZ - MARQ_D / 2));
    stucco.push(cBox(mw, MARQ_H - 0.5, MARQ_D, STUCCO2, CINEMA_X, CITY_Y + MARQ_Y + 0.22 + (MARQ_H - 0.5) / 2, FZ - MARQ_D / 2));
    trim.push(cBox(mw + 0.5, 0.3, MARQ_D + 0.5, DARK, CINEMA_X, CITY_Y + MARQ_Y + MARQ_H, FZ - MARQ_D / 2));
    trim.push(cBox(mw + 0.24, 0.14, MARQ_D + 0.24, CHROME, CINEMA_X, CITY_Y + MARQ_Y + 0.3, FZ - MARQ_D / 2));
    // title boards on the three visible faces
    neonW.push(colorFill(new THREE.BoxGeometry(mw - 1.4, MARQ_H - 1.1, 0.07)
      .translate(CINEMA_X, CITY_Y + MARQ_Y + 1.1, FZ - MARQ_D - 0.04), 0xfff4d2));
    for (const s of [-1, 1]) {
      neonW.push(colorFill(new THREE.BoxGeometry(0.07, MARQ_H - 1.1, MARQ_D - 1.0)
        .translate(CINEMA_X + s * (mw / 2 + 0.04), CITY_Y + MARQ_Y + 1.1, FZ - MARQ_D / 2), 0xfff4d2));
    }
    // chase bulbs round the fascia
    for (let i = 0; i < 30; i++) {
      const t = i / 29;
      neonW.push(cCyl(0.075, 0.075, 0.08, 6, 0xffe3a8,
        CINEMA_X - mw / 2 + t * mw, CITY_Y + MARQ_Y + 0.42, FZ - MARQ_D - 0.13, Math.PI / 2));
      neonW.push(cCyl(0.075, 0.075, 0.08, 6, 0xffe3a8,
        CINEMA_X - mw / 2 + t * mw, CITY_Y + MARQ_Y + MARQ_H - 0.06, FZ - MARQ_D - 0.13, Math.PI / 2));
    }
    // hanger rods back to the facade
    for (const s of [-1, 1]) {
      trim.push(cCyl(0.05, 0.05, 4.6, 6, CHROME,
        CINEMA_X + s * (mw / 2 - 0.8), CITY_Y + MARQ_Y + MARQ_H + 1.9, FZ - MARQ_D + 1.4, -0.72));
    }
    addCollider(CINEMA_X, CITY_Y + MARQ_Y, FZ - MARQ_D / 2, mw + 0.5, MARQ_H + 0.45, MARQ_D + 0.5);
  }

  // ---------------- entrance: forecourt, box office, poster cases ----------------
  {
    // terrazzo forecourt, recessed under the marquee
    stucco.push(cBox(W * 0.72 + 1.2, 0.06, MARQ_D + 2.4, TERRAZZO,
      CINEMA_X, CITY_Y + 0.03, FZ - MARQ_D / 2 - 1.0));
    for (let i = -3; i <= 3; i++) {
      trim.push(cBox(0.1, 0.02, MARQ_D + 2.2, TRIM, CINEMA_X + i * 2.4, CITY_Y + 0.075, FZ - MARQ_D / 2 - 1.0));
    }
    // free-standing octagonal box office in the middle of the forecourt
    const bx = CINEMA_X, bz = FZ - 1.5;
    stucco.push(cCyl(1.35, 1.45, 2.5, 8, STUCCO2, bx, CITY_Y + 1.25, bz));
    trim.push(cCyl(1.62, 1.5, 0.3, 8, DARK, bx, CITY_Y + 2.62, bz));
    glassG.push(new THREE.CylinderGeometry(1.24, 1.24, 1.15, 8).translate(bx, CITY_Y + 1.62, bz));
    neonC.push(cCyl(1.5, 1.5, 0.09, 8, 0x59e8ff, bx, CITY_Y + 2.83, bz));
    addCyl(bx, CITY_Y, bz, 1.62, 2.92);
    // doors + poster cases either side of the box office
    for (const s of [-1, 1]) {
      glassG.push(new THREE.BoxGeometry(4.4, 3.0, 0.14).translate(CINEMA_X + s * 5.6, CITY_Y + 1.55, FZ - 0.08));
      trim.push(cBox(4.7, 0.2, 0.22, DARK, CINEMA_X + s * 5.6, CITY_Y + 3.15, FZ - 0.1));
      const px = CINEMA_X + s * 11.4;
      trim.push(cBox(1.5, 2.3, 0.24, DARK, px, CITY_Y + 1.9, FZ - 0.14));
      neonW.push(colorFill(new THREE.BoxGeometry(1.24, 2.0, 0.06)
        .translate(px, CITY_Y + 1.9, FZ - 0.27), 0xf6ead0));
      addCollider(px, CITY_Y, FZ - 0.14, 1.5, 3.05, 0.26);
    }
  }

  // ---------------- vertical blade sign ----------------
  {
    const bw = 2.6, bd = 0.75;
    const y0 = CITY_Y + 5.2;
    // the blade stands 2.9 m proud of the facade, leaving a 2.15 m slot
    // between its back face and the stucco — 13 m of it uninterrupted
    const bz = FZ - 2.9 + bd / 2;
    stucco.push(cBox(bw, BLADE_TOP - y0, bd, STUCCO2, BLADE_X, (y0 + BLADE_TOP) / 2, bz));
    trim.push(cBox(bw + 0.3, 0.28, bd + 0.3, DARK, BLADE_X, BLADE_TOP - 0.14, bz));
    // two brackets tying it back to the wall, low and high, so the middle
    // 13 m of the slot stays open
    for (const by of [y0 + 2.2, y0 + 20.4]) {
      trim.push(cBox(0.3, 0.9, 3.0, DARK, BLADE_X, by, FZ - 1.4));
      addCollider(BLADE_X, by - 0.45, FZ - 1.4, 0.34, 0.9, 3.0);
    }
    // stacked neon letter panels on both faces
    const nLet = 7;
    for (let i = 0; i < nLet; i++) {
      const ly = y0 + 1.9 + i * 3.0;
      for (const s of [-1, 1]) {
        neonR.push(colorFill(new THREE.BoxGeometry(bw - 0.7, 2.1, 0.07)
          .translate(BLADE_X, ly, bz + s * (bd / 2 + 0.04)), 0xff3a5c));
      }
    }
    // neon tube outline running the full height on both faces
    for (const s of [-1, 1]) {
      for (const dx of [-1, 1]) {
        neonC.push(colorFill(new THREE.BoxGeometry(0.1, BLADE_TOP - y0 - 0.6, 0.06)
          .translate(BLADE_X + dx * (bw / 2 - 0.16), (y0 + BLADE_TOP) / 2, bz + s * (bd / 2 + 0.04)), 0x59e8ff));
      }
    }
    // extra neon outline — blade top/bottom rails close the frame. Visual only.
    for (const s of [-1, 1]) {
      neonC.push(colorFill(new THREE.BoxGeometry(bw - 0.22, 0.1, 0.06)
        .translate(BLADE_X, BLADE_TOP - 0.42, bz + s * (bd / 2 + 0.04)), 0x59e8ff));
      neonC.push(colorFill(new THREE.BoxGeometry(bw - 0.22, 0.1, 0.06)
        .translate(BLADE_X, y0 + 0.42, bz + s * (bd / 2 + 0.04)), 0x59e8ff));
    }
    // crown finial
    stucco.push(cCyl(0.22, 0.22, 3.2, 8, STUCCO2, BLADE_X, BLADE_TOP + 1.6, bz));
    neonR.push(cCyl(0.34, 0.34, 0.34, 8, 0xff3a5c, BLADE_X, BLADE_TOP + 3.35, bz));
    addCollider(BLADE_X, y0, bz, bw + 0.3, BLADE_TOP - y0 + 0.28, bd + 0.3);
    addCyl(BLADE_X, BLADE_TOP, bz, 0.34, 3.6);
  }

  // ---------------- materialise ----------------
  const stTex = track(stuccoTexture());
  stTex.repeat.set(6, 4);
  const mk = (geos, mat, name) => {
    if (!geos.length) return;
    const g = track(mergeGeometries(geos));
    geos.forEach((x) => x.dispose());
    setAoUVs(g);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    m.name = name;
    root.add(m);
  };
  mk(stucco, track(new THREE.MeshStandardMaterial({
    vertexColors: true, map: stTex, roughness: 0.92, metalness: 0,
  })), 'cinema-stucco');
  mk(trim, track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.5 })), 'cinema-trim');
  if (glassG.length) {
    const g = track(mergeGeometries(glassG));
    glassG.forEach((x) => x.dispose());
    const mat = track(new THREE.MeshStandardMaterial({
      color: 0x101c22, metalness: 0.6, roughness: 0.08,
      transparent: true, opacity: 0.6, depthWrite: false, envMapIntensity: 1.2,
    }));
    const m = new THREE.Mesh(g, mat);
    m.name = 'cinema-glass';
    root.add(m);
  }
  const neonMat = (hex, day, night) => regDN(track(new THREE.MeshStandardMaterial({
    vertexColors: true, color: 0xffffff, emissive: hex, emissiveIntensity: 2.6, roughness: 0.4,
  })), day, night);
  mk(neonC, neonMat(0x59e8ff, 0.55, 3.2), 'cinema-neon-cyan');
  mk(neonW, neonMat(0xffe3a8, 0.9, 3.0), 'cinema-neon-warm');
  mk(neonR, neonMat(0xff3a5c, 0.7, 3.4), 'cinema-neon-red');

  // forecourt palms, rejection-tested by the palm pass
  for (const s of [-1, 1]) {
    ctx.extraPalms.push({ x: CINEMA_X + s * (CINEMA_W / 2 + 3.6), z: FZ - 3.2, sc: 0.9 });
  }

  setTag('world');
}
