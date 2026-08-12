import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CITY_Y } from '../constants.js';
import { cBox, cCyl, cSph, cTorus } from '../geo.js';
import { stuccoTexture } from '../textures.js';

// ============================================================
// Ocean Drive art-deco hotel row — the Miami signature.
//
// Four 1930s Streamline Moderne hotels facing the ocean: symmetric
// tripartite facades, cantilevered eyebrow shades over every window,
// vertical fins on a projecting central bay, stepped ziggurat parapets,
// porthole windows, terrazzo forecourts and neon tube outlines that
// blaze after dusk.
//
// Everything merges into 6 meshes for the whole row:
//   stucco (vertex-coloured + stucco sheet) | glass | terrazzo/dark trim
//   + one emissive mesh per neon colour (3).
// ============================================================

const FRONT_Z = 57.6;      // facade plane (ocean-facing); road band ends at 50.5
const DEPTH = 26;
const GH = 4.2;            // ground-floor height (tall lobby storey)
const FH = 3.3;            // upper floor height

const HOTELS = [
  { x: -75, w: 26, floors: 4, body: 0xf3efe6, trim: 0x7fd4c1, neon: 0x2fe0ff, name: 0x1d6f7a },
  { x: -43, w: 24, floors: 3, body: 0xf7dcb4, trim: 0xf6f2e9, neon: 0xffb01f, name: 0x8a4d16 },
  { x: -9, w: 30, floors: 4, body: 0xf6f2e9, trim: 0xf2a6bb, neon: 0xff3d8b, name: 0x8c2350 },
  { x: 24, w: 22, floors: 3, body: 0xd8ece8, trim: 0xf6f2e9, neon: 0x2fe0ff, name: 0x1d6f7a },
];

/**
 * Build the hero art-deco row.
 * @returns {{ group: THREE.Group }}
 */
export function buildArtDeco(ctx) {
  const { root, track, addCollider } = ctx;
  const regDN = ctx.regDN;

  const stucco = [];                 // pastel walls, eyebrows, fins, parapets
  const dark = [];                   // terrazzo, reveals, metalwork
  const glass = [];                  // window glazing
  const neonByColor = new Map();     // hex -> geometry[]
  const pushNeon = (hex, geo) => {
    let arr = neonByColor.get(hex);
    if (!arr) { arr = []; neonByColor.set(hex, arr); }
    arr.push(geo);
  };

  const TERRAZZO = 0x8e887c, REVEAL = 0x1a2026, METAL = 0x9aa3aa, DOORDK = 0x101820;

  for (const H of HOTELS) {
    const { x: cx, w: W, floors, body, trim, neon } = H;
    const halfW = W / 2;
    const bodyH = GH + (floors - 1) * FH;      // wall height above CITY_Y
    const roofY = CITY_Y + bodyH;
    const CW = Math.min(10.5, W * 0.34);       // central bay width
    const wingW = (W - CW) / 2;
    const zF = FRONT_Z;                        // front wall plane
    const zBack = FRONT_Z + DEPTH;
    const zC = zF - 0.55;                      // central bay stands proud

    // ---------------- main mass ----------------
    stucco.push(cBox(W, bodyH, DEPTH, body, cx, CITY_Y + bodyH / 2, zF + DEPTH / 2));
    // projecting central bay
    stucco.push(cBox(CW, bodyH, 0.6, body, cx, CITY_Y + bodyH / 2, zC + 0.3));
    // chamfered outer corners (streamline round-off, faked with 45° fins)
    for (const s of [-1, 1]) {
      stucco.push(cBox(1.5, bodyH, 1.5, body, cx + s * (halfW - 0.53), CITY_Y + bodyH / 2, zF + 0.53, 0, Math.PI / 4, 0));
    }

    // ---------------- floor banding + eyebrows ----------------
    // The eyebrow is THE South Beach detail: a thin cantilevered slab that
    // shades the whole window row and casts a hard horizontal shadow line.
    for (let f = 0; f < floors; f++) {
      const fy = CITY_Y + (f === 0 ? 0 : GH + (f - 1) * FH);
      const fh = f === 0 ? GH : FH;
      const winY = fy + fh * 0.56;
      const winH = f === 0 ? 2.5 : 1.7;

      // horizontal accent band at every floor line
      if (f > 0) {
        stucco.push(cBox(W + 0.16, 0.14, DEPTH + 0.16, trim, cx, fy, zF + DEPTH / 2));
      }

      // wing windows (3 per wing) + their shared eyebrow
      for (const s of [-1, 1]) {
        const wingCx = cx + s * (CW / 2 + wingW / 2);
        const nWin = 3;
        const pitch = (wingW - 1.4) / nWin;
        for (let i = 0; i < nWin; i++) {
          const wx = wingCx - (wingW - 1.4) / 2 + (i + 0.5) * pitch;
          const ww = Math.min(1.75, pitch - 0.5);
          glass.push(new THREE.BoxGeometry(ww, winH, 0.12).translate(wx, winY, zF - 0.05));
          // reveal frame + a centre mullion
          dark.push(cBox(ww + 0.22, winH + 0.22, 0.1, REVEAL, wx, winY, zF + 0.02));
          dark.push(cBox(0.07, winH, 0.14, METAL, wx, winY, zF - 0.06));
          dark.push(cBox(ww, 0.07, 0.14, METAL, wx, winY, zF - 0.06));
          // sill
          stucco.push(cBox(ww + 0.4, 0.11, 0.26, trim, wx, winY - winH / 2 - 0.1, zF - 0.11));
        }
        // eyebrow slab over the row, wrapping 1.1 m around the corner
        const ebW = wingW - 0.5;
        const ebY = winY + winH / 2 + 0.42;
        stucco.push(cBox(ebW, 0.19, 0.72, trim, wingCx, ebY, zF - 0.34));
        stucco.push(cBox(0.62, 0.19, 1.5, trim, cx + s * (halfW - 0.31), ebY, zF + 0.6));
        // neon tube tucked under the eyebrow lip
        pushNeon(neon, cBox(ebW - 0.3, 0.075, 0.075, neon, wingCx, ebY - 0.13, zF - 0.66));
      }

      // central-bay windows (a tall pair, floors above the entrance)
      if (f > 0) {
        for (const s of [-1, 1]) {
          const wx = cx + s * CW * 0.19;
          glass.push(new THREE.BoxGeometry(CW * 0.3, winH, 0.12).translate(wx, winY, zC - 0.05));
          dark.push(cBox(CW * 0.3 + 0.2, winH + 0.2, 0.1, REVEAL, wx, winY, zC + 0.02));
          dark.push(cBox(0.06, winH, 0.13, METAL, wx, winY, zC - 0.06));
        }
      }
    }

    // ---------------- vertical fins on the central bay ----------------
    const finTop = roofY + 2.6 + (floors === 4 ? 1.2 : 0);
    for (const fx of [-CW * 0.34, 0, CW * 0.34]) {
      const finH = finTop - (CITY_Y + GH);
      stucco.push(cBox(0.42, finH, 0.55, trim, cx + fx, CITY_Y + GH + finH / 2, zC - 0.24));
      pushNeon(neon, cBox(0.1, finH - 0.4, 0.1, neon, cx + fx, CITY_Y + GH + finH / 2, zC - 0.53));
    }

    // ---------------- parapet + stepped ziggurat crown ----------------
    stucco.push(cBox(W + 0.3, 0.9, DEPTH + 0.3, body, cx, roofY + 0.45, zF + DEPTH / 2));
    stucco.push(cBox(W + 0.5, 0.16, DEPTH + 0.5, trim, cx, roofY + 0.9, zF + DEPTH / 2));
    pushNeon(neon, cBox(W + 0.2, 0.09, 0.09, neon, cx, roofY + 0.99, zF - 0.24));
    // three-step crown over the central bay
    let stepW = CW + 3.2, stepY = roofY + 0.9, stepD = 4.4;
    for (let s = 0; s < 3; s++) {
      const sh = s === 0 ? 1.5 : 1.15;
      stucco.push(cBox(stepW, sh, stepD, body, cx, stepY + sh / 2, zF + 1.6));
      stucco.push(cBox(stepW + 0.22, 0.13, stepD + 0.22, trim, cx, stepY + sh, zF + 1.6));
      if (s < 2) pushNeon(neon, cBox(stepW - 0.2, 0.08, 0.08, neon, cx, stepY + sh + 0.11, zF + 1.6 - stepD / 2 - 0.06));
      stepY += sh;
      stepW *= 0.66; stepD *= 0.82;
    }
    // finial + flagpole on the crown
    stucco.push(cCyl(0.34, 0.5, 0.7, 8, trim, cx, stepY + 0.35, zF + 1.6));
    dark.push(cCyl(0.07, 0.07, 5.2, 6, METAL, cx, stepY + 3.3, zF + 1.6));
    dark.push(cSph(0.16, 8, 6, 0xd9c07a, cx, stepY + 5.95, zF + 1.6));
    dark.push(cBox(1.5, 0.9, 0.03, H.name, cx + 0.78, stepY + 5.35, zF + 1.6));

    // hotel name panel on the crown face, outlined in neon
    dark.push(cBox(CW + 1.4, 1.25, 0.16, H.name, cx, roofY + 1.75, zF + 1.6 - 2.3));
    pushNeon(neon, cBox(CW + 0.4, 0.55, 0.1, neon, cx, roofY + 1.75, zF + 1.6 - 2.42));

    // ---------------- ground floor: porch, doors, portholes ----------------
    const porchZ = zF - 1.8;
    // flat cantilevered canopy over the entrance with a neon edge
    stucco.push(cBox(CW + 2.6, 0.24, 2.0, trim, cx, CITY_Y + 3.35, porchZ + 0.1));
    pushNeon(neon, cBox(CW + 2.4, 0.1, 0.1, neon, cx, CITY_Y + 3.2, porchZ - 0.88));
    for (const s of [-1, 1]) {
      dark.push(cCyl(0.11, 0.13, 3.2, 10, METAL, cx + s * (CW / 2 + 1.0), CITY_Y + 1.6, porchZ - 0.7));
    }
    // recessed entry: dark reveal + twin glass doors + push bars
    dark.push(cBox(4.6, 3.0, 0.12, DOORDK, cx, CITY_Y + 1.5, zC + 0.24));
    for (const s of [-1, 1]) {
      glass.push(new THREE.BoxGeometry(1.5, 2.7, 0.1).translate(cx + s * 0.85, CITY_Y + 1.35, zC - 0.12));
      dark.push(cBox(0.09, 2.7, 0.13, METAL, cx + s * 1.62, CITY_Y + 1.35, zC - 0.12));
      dark.push(cBox(0.06, 1.0, 0.06, 0xc8ced3, cx + s * 0.3, CITY_Y + 1.2, zC - 0.2));
    }
    dark.push(cBox(4.0, 0.14, 0.16, METAL, cx, CITY_Y + 2.78, zC - 0.14));
    // terrazzo forecourt + two steps
    dark.push(cBox(CW + 4.2, 0.05, 3.0, TERRAZZO, cx, CITY_Y + 0.025, zF - 1.6));
    dark.push(cBox(CW + 1.2, 0.14, 0.9, TERRAZZO, cx, CITY_Y + 0.07, zF - 0.6));
    dark.push(cBox(CW + 0.6, 0.14, 0.9, TERRAZZO, cx, CITY_Y + 0.21, zF - 0.05));
    // porthole windows flanking the entrance + one high on each wing
    for (const s of [-1, 1]) {
      const px = cx + s * (CW / 2 + 1.6);
      dark.push(cCyl(0.42, 0.42, 0.09, 14, DOORDK, px, CITY_Y + 2.3, zF - 0.02, Math.PI / 2));
      stucco.push(cTorus(0.46, 0.1, 6, 14, trim, px, CITY_Y + 2.3, zF - 0.07));
      const qx = cx + s * (halfW - 2.0);
      dark.push(cCyl(0.36, 0.36, 0.09, 14, DOORDK, qx, CITY_Y + 3.1, zF - 0.02, Math.PI / 2));
      stucco.push(cTorus(0.4, 0.09, 6, 14, trim, qx, CITY_Y + 3.1, zF - 0.07));
    }
    // ground-floor shopfront glazing in the wings (cafés/lobby bar)
    for (const s of [-1, 1]) {
      const wingCx = cx + s * (CW / 2 + wingW / 2);
      glass.push(new THREE.BoxGeometry(wingW - 2.4, 2.4, 0.12).translate(wingCx, CITY_Y + 1.55, zF - 0.05));
      dark.push(cBox(wingW - 2.2, 0.5, 0.2, REVEAL, wingCx, CITY_Y + 0.25, zF - 0.06));
      for (let m = -1; m <= 1; m++) {
        dark.push(cBox(0.09, 2.4, 0.16, METAL, wingCx + m * (wingW - 2.4) / 3, CITY_Y + 1.55, zF - 0.08));
      }
    }

    addCollider(cx, CITY_Y, zF + DEPTH / 2, W + 0.6, bodyH + 2.4, DEPTH + 0.6);
    addCollider(cx, roofY, zF + 1.6, CW + 3.4, 8.5, 4.6);      // crown + flagpole
  }

  // ---------------- materialise ----------------
  const group = new THREE.Group();
  group.name = 'artdeco';

  const stTex = track(stuccoTexture());
  stTex.repeat.set(0.35, 0.35);
  const stuccoMat = track(new THREE.MeshStandardMaterial({
    map: stTex, vertexColors: true, roughness: 0.93, metalness: 0,
  }));
  const stuccoGeo = track(mergeGeometries(stucco));
  stucco.forEach((g) => g.dispose());
  const stuccoMesh = new THREE.Mesh(stuccoGeo, stuccoMat);
  stuccoMesh.castShadow = true;
  stuccoMesh.receiveShadow = true;
  group.add(stuccoMesh);

  const darkMat = track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.55, metalness: 0.35,
  }));
  const darkGeo = track(mergeGeometries(dark));
  dark.forEach((g) => g.dispose());
  const darkMesh = new THREE.Mesh(darkGeo, darkMat);
  darkMesh.castShadow = true;
  darkMesh.receiveShadow = true;
  group.add(darkMesh);

  // windows: deep blue-green glass by day, warm room light after dusk
  const glassMat = regDN(track(new THREE.MeshStandardMaterial({
    color: 0x16232b, metalness: 0.45, roughness: 0.06,
    envMapIntensity: 1.2, emissive: 0xffcf92, emissiveIntensity: 0,
  })), 0, 0.55);
  const glassGeo = track(mergeGeometries(glass));
  glass.forEach((g) => g.dispose());
  group.add(new THREE.Mesh(glassGeo, glassMat));

  // one emissive mesh per neon colour — washed out in full sun, blazing at night
  for (const [hex, geos] of neonByColor) {
    const g = track(mergeGeometries(geos));
    geos.forEach((x) => x.dispose());
    const mat = regDN(track(new THREE.MeshStandardMaterial({
      color: 0x14161a, emissive: hex, emissiveIntensity: 0.9, roughness: 0.4,
    })), 0.85, 3.6);
    group.add(new THREE.Mesh(g, mat));
  }

  root.add(group);
  return { group };
}
