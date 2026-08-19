import * as THREE from 'three';
import {
  PIER_X,
  BOARDWALK_Z, BOARDWALK_W, BOARDWALK_D, BOARDWALK_H, BOARDWALK_Y,
  PIER_DECK_W, PIER_DECK_D, PIER_DECK_H, PIER_DECK_Y, PIER_DECK_Z, PIER_DECK_TOP,
  PAVILION_Z,
  PIER_PYLON_DX, PIER_PYLON_R, PIER_PYLON_H, PIER_PYLON_Y0,
  PIER_PYLON_Z0, PIER_PYLON_STEP, PIER_PYLON_COUNT,
  PAVILION_POST_R, PAVILION_POST_H, PAVILION_POST_XS, PAVILION_POST_ZS,
} from '../constants.js';
import { plankTexture } from '../textures.js';

/** Boardwalk + pier deck, pylons, open-bay pavilion. */
export function buildPier(ctx) {
  const { root, track, addCollider, addCyl, setTag } = ctx;
  setTag('pier');
  const woodTex = track(plankTexture(0x9a7247, 11, 512, 512, 18));
  woodTex.repeat.set(78, 1);       // boards run across the walk, ~0.45 m each
  {
    const geo = track(new THREE.BoxGeometry(BOARDWALK_W, BOARDWALK_H, BOARDWALK_D));
    const mat = track(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9 }));
    const bw = new THREE.Mesh(geo, mat);
    bw.position.set(0, BOARDWALK_Y, BOARDWALK_Z);
    bw.receiveShadow = true;
    root.add(bw);
    // collider matches the deck visual (no fat shoulder). Crash-cam and
    // scatter both read this box; the palm pavement reject adds the shoulder.
    addCollider(0, BOARDWALK_Y - BOARDWALK_H / 2, BOARDWALK_Z, BOARDWALK_W, BOARDWALK_H, BOARDWALK_D);
  }
  {
    const woodTex2 = track(plankTexture(0x8d6a41, 23, 512, 512, 18));
    woodTex2.repeat.set(1, 20);      // boards run across the pier
    const deckGeo = track(new THREE.BoxGeometry(PIER_DECK_W, PIER_DECK_H, PIER_DECK_D));
    const deckMat = track(new THREE.MeshStandardMaterial({ map: woodTex2, roughness: 0.9 }));
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(PIER_X, PIER_DECK_Y, PIER_DECK_Z);
    deck.castShadow = true;
    root.add(deck);
    addCollider(PIER_X, PIER_DECK_Y - PIER_DECK_H / 2, PIER_DECK_Z, PIER_DECK_W, PIER_DECK_H, PIER_DECK_D);

    // pylons — pairs every 17 m, leaving fly-under space. Round timber piles
    // get ROUND colliders: the old 0.9 m squares put 5 cm of phantom steel on
    // each corner of a 0.4 m pile and squared off the gap a pilot threads.
    const pyGeo = track(new THREE.CylinderGeometry(0.35, 0.4, 10, 8));
    const pyMat = track(new THREE.MeshStandardMaterial({ color: 0x5c4a35, roughness: 1 }));
    const pylons = new THREE.InstancedMesh(pyGeo, pyMat, 20);
    const m4 = new THREE.Matrix4();
    let pi = 0;
    for (let i = 0; i < PIER_PYLON_COUNT; i++) {
      const z = PIER_PYLON_Z0 - i * PIER_PYLON_STEP;
      for (const s of [-1, 1]) {
        const dx = s * PIER_PYLON_DX;
        m4.makeTranslation(PIER_X + dx, PIER_PYLON_Y0 + PIER_PYLON_H / 2, z);
        pylons.setMatrixAt(pi++, m4);
        addCyl(PIER_X + dx, PIER_PYLON_Y0, z, PIER_PYLON_R, PIER_PYLON_H);
      }
    }
    pylons.castShadow = true;
    pylons.name = 'pier-pylons';
    root.add(pylons);

    buildPavilion(ctx);
  }
  setTag('world');
}

/**
 * Pier-end pavilion: posts on the deck, a beam line they carry, hip lid
 * with its own roof material. The bay between the posts is a void — no
 * closed office box, no collider filling the undercroft. Colliders stay
 * inside the visual ±0.15 m; posts are cylinders.
 */
function buildPavilion(ctx) {
  const { root, track, addCollider, addCyl } = ctx;

  const timber = track(new THREE.MeshStandardMaterial({ color: 0x6e5340, roughness: 0.92 }));
  const beamMat = track(new THREE.MeshStandardMaterial({ color: 0x7a5c45, roughness: 0.88 }));
  const roofMat = track(new THREE.MeshStandardMaterial({
    color: 0xb85a4a, roughness: 0.62, metalness: 0.08,
  }));
  const soffitMat = track(new THREE.MeshStandardMaterial({ color: 0xc9b89a, roughness: 0.85 }));

  // Posts sit on the deck top (3.7). Six piles — two rows of three — leave
  // a flyable bay down the centre (~8.8 m × 3.6 m, 3.35 m to the soffit).
  const POST_R = PAVILION_POST_R;
  const POST_H = PAVILION_POST_H;
  const xs = PAVILION_POST_XS;
  const zs = PAVILION_POST_ZS;
  const postGeo = track(new THREE.CylinderGeometry(POST_R, POST_R + 0.03, POST_H, 10));
  postGeo.translate(0, PIER_DECK_TOP + POST_H / 2, 0);
  const posts = new THREE.InstancedMesh(postGeo, timber, 6);
  const m4 = new THREE.Matrix4();
  let i = 0;
  for (const dx of xs) {
    for (const dz of zs) {
      m4.makeTranslation(PIER_X + dx, 0, PAVILION_Z + dz);
      posts.setMatrixAt(i++, m4);
      addCyl(PIER_X + dx, PIER_DECK_TOP, PAVILION_Z + dz, POST_R, POST_H);
    }
  }
  posts.instanceMatrix.needsUpdate = true;
  posts.castShadow = true;
  posts.name = 'pier-pavilion-posts';
  root.add(posts);

  // Beam line the posts carry. Thin boxes — collider matches the timber.
  const BEAM_Y = PIER_DECK_TOP + POST_H;
  const BEAM_H = 0.28;
  const BEAM_W = 0.30;
  const spanX = xs[1] - xs[0];
  const spanZ = zs[2] - zs[0];
  const addBeam = (w, h, d, x, y, z) => {
    const g = track(new THREE.BoxGeometry(w, h, d));
    const m = new THREE.Mesh(g, beamMat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = true;
    root.add(m);
    addCollider(x, y, z, w, h, d);
  };
  for (const dz of zs) {
    addBeam(spanX + BEAM_W, BEAM_H, BEAM_W, PIER_X, BEAM_Y, PAVILION_Z + dz);
  }
  for (const dx of xs) {
    addBeam(BEAM_W, BEAM_H, spanZ + BEAM_W, PIER_X + dx, BEAM_Y, PAVILION_Z);
  }

  // Soffit plate + hip lid. Roof uses its own mat — never the wall cream.
  const plateW = spanX + 2.2;
  const plateD = spanZ + 2.0;
  const plateH = 0.12;
  const plateY = BEAM_Y + BEAM_H;
  {
    const g = track(new THREE.BoxGeometry(plateW, plateH, plateD));
    const plate = new THREE.Mesh(g, soffitMat);
    plate.position.set(PIER_X, plateY + plateH / 2, PAVILION_Z);
    plate.castShadow = true;
    root.add(plate);
    addCollider(PIER_X, plateY, PAVILION_Z, plateW, plateH, plateD);
  }
  {
    const hipH = 2.8;
    const hip = new THREE.Mesh(track(new THREE.ConeGeometry(7.15, hipH, 4)), roofMat);
    hip.position.set(PIER_X, plateY + plateH + hipH / 2, PAVILION_Z);
    hip.rotation.y = Math.PI / 4;
    hip.castShadow = true;
    hip.name = 'pier-pavilion-roof';
    root.add(hip);
    // stepped boxes stay inside the pyramid (±0.15 of the visual)
    addCollider(PIER_X, plateY + plateH, PAVILION_Z, 10.2, 0.85, 10.2);
    addCollider(PIER_X, plateY + plateH + 0.85, PAVILION_Z, 6.8, 0.85, 6.8);
    addCollider(PIER_X, plateY + plateH + 1.70, PAVILION_Z, 3.4, 0.95, 3.4);
  }

  const pavLight = new THREE.PointLight(0xffd9a0, 30, 40);
  pavLight.position.set(PIER_X, plateY + 1.6, PAVILION_Z);
  root.add(pavLight);
}
