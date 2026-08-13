import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { VBALL_X0, VBALL_Z0, groundHeight } from '../constants.js';
import { colorFill, cBox, cCyl } from '../geo.js';

// ============================================================
// South Beach volleyball — three regulation sand courts.
//
// Court is 16 x 8 m with a 2.5 m run-off. Net posts stand 1.0 m outside the
// sideline, net top at 2.43 m. The net is the point: a 8.6 x 1.0 m sheet
// hanging 1.43 m off the sand is the tightest legitimate gate on the map —
// you can go over it (2.43 m of climb) or under it (1.43 m of dive), and the
// collider is the sheet itself, not a box wrapped round the whole court.
// ============================================================

const COURT_L = 16, COURT_W = 8;
const PITCH = 26;               // court-to-court spacing along x
const POST_H = 2.62;
const NET_TOP = 2.43, NET_DROP = 1.0;

const POSTC = 0x37414a, LINE = 0xf2ede0, NETC = 0x20262c;

/** Build the volleyball courts. */
export function buildVolleyball(ctx) {
  const { root, track, addCollider, addCyl, setTag } = ctx;
  setTag('volleyball');

  const solidGeos = [];
  const lineGeos = [];
  const netGeos = [];

  for (let c = 0; c < 3; c++) {
    const cx = VBALL_X0 + 13 + c * PITCH;
    const cz = VBALL_Z0 + 8 + (c % 2 ? 1.6 : 0);
    const gy = groundHeight(cx, cz);

    // boundary tape, held just off the sand
    const tape = (w, d, x, z) => lineGeos.push(
      colorFill(new THREE.BoxGeometry(w, 0.03, d).translate(x, gy + 0.035, z), LINE));
    tape(COURT_L, 0.09, cx, cz - COURT_W / 2);
    tape(COURT_L, 0.09, cx, cz + COURT_W / 2);
    tape(0.09, COURT_W, cx - COURT_L / 2, cz);
    tape(0.09, COURT_W, cx + COURT_L / 2, cz);
    // corner anchors
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        solidGeos.push(cCyl(0.07, 0.09, 0.16, 6, POSTC,
          cx + sx * COURT_L / 2, gy + 0.06, cz + sz * COURT_W / 2));
      }
    }

    // net posts, 1.0 m outside each sideline
    for (const sz of [-1, 1]) {
      const pz = cz + sz * (COURT_W / 2 + 1.0);
      solidGeos.push(cCyl(0.055, 0.075, POST_H, 10, POSTC, cx, gy + POST_H / 2, pz));
      solidGeos.push(cCyl(0.16, 0.2, 0.14, 10, 0x8a8f94, cx, gy + 0.07, pz));
      // guy line down to a sand anchor
      solidGeos.push(cCyl(0.018, 0.018, 2.3, 4, 0xb9b2a0,
        cx + sz * 0.62, gy + POST_H * 0.55, pz + sz * 0.75, 0.5, 0, sz * -0.28));
      addCyl(cx, gy, pz, 0.09, POST_H);
    }

    // the net: a dark mesh sheet with white head and foot tapes
    const netW = COURT_W + 0.6;
    netGeos.push(colorFill(new THREE.BoxGeometry(0.02, NET_DROP, netW)
      .translate(cx, gy + NET_TOP - NET_DROP / 2, cz), NETC));
    solidGeos.push(cBox(0.05, 0.09, netW, LINE, cx, gy + NET_TOP - 0.045, cz));
    solidGeos.push(cBox(0.05, 0.07, netW, LINE, cx, gy + NET_TOP - NET_DROP + 0.035, cz));
    for (const sz of [-1, 1]) {
      solidGeos.push(cBox(0.06, NET_DROP, 0.07, LINE, cx, gy + NET_TOP - NET_DROP / 2, cz + sz * netW / 2));
    }
    // ONE collider for the net panel — matches the sheet to a centimetre, so
    // the gap under it stays genuinely open
    addCollider(cx, gy + NET_TOP - NET_DROP, cz, 0.09, NET_DROP + 0.09, netW);
  }

  // a scoreboard / kit bench between courts 1 and 2
  {
    const bx = VBALL_X0 + 13 + PITCH / 2, bz = VBALL_Z0 + 15.5;
    const gy = groundHeight(bx, bz);
    solidGeos.push(cBox(2.4, 0.09, 0.55, 0xb08654, bx, gy + 0.46, bz));
    for (const s of [-1, 1]) solidGeos.push(cBox(0.1, 0.45, 0.5, 0x6d675c, bx + s * 1.0, gy + 0.22, bz));
    solidGeos.push(cBox(2.4, 0.4, 0.09, 0xb08654, bx, gy + 0.72, bz + 0.23));
    addCollider(bx, gy, bz, 2.4, 0.92, 0.6);
    // sand rake + ball crate
    solidGeos.push(cBox(0.9, 0.5, 0.9, 0xd0c6ae, bx + 2.6, gy + 0.25, bz - 0.4));
    addCollider(bx + 2.6, gy, bz - 0.4, 0.9, 0.5, 0.9);
  }

  const mk = (geos, mat, name, shadow) => {
    if (!geos.length) return;
    const g = track(mergeGeometries(geos));
    geos.forEach((x) => x.dispose());
    const m = new THREE.Mesh(g, mat);
    m.castShadow = !!shadow;
    m.receiveShadow = true;
    m.name = name;
    root.add(m);
  };
  mk(solidGeos, track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.15 })), 'vball-frame', true);
  mk(lineGeos, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.95,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  })), 'vball-lines', false);
  mk(netGeos, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.9, transparent: true, opacity: 0.62,
    side: THREE.DoubleSide, depthWrite: false,
  })), 'vball-nets', false);

  setTag('world');
}
