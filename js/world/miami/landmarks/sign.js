import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { groundHeight } from '../constants.js';

/** Neon MIAMI letter sign on the beach. */
export function buildSign(ctx) {
  const { root, track, addCollider } = ctx;
  {
    const segGeo = track(new THREE.BoxGeometry(1, 1, 0.8));
    const segMat = track(new THREE.MeshStandardMaterial({ color: 0x2a1030, emissive: 0xff40c0, emissiveIntensity: 3.5, roughness: 0.4 }));
    // 5x5 grid glyphs for M I A M I
    const glyphs = {
      M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
      I: ['.###.', '..#..', '..#..', '..#..', '.###.'],
      A: ['.###.', '#...#', '#####', '#...#', '#...#'],
    };
    const word = 'MIAMI';
    const geos = [];
    let ox = 0;
    for (const ch of word) {
      const rowsG = glyphs[ch];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (rowsG[r][c] === '#') {
            const g = segGeo.clone();
            g.scale(1.6, 1.6, 1);
            g.translate(ox + c * 1.7, (4 - r) * 1.7, 0);
            geos.push(g);
          }
        }
      }
      ox += 5 * 1.7 + 2.5;
    }
    const merged = track(mergeGeometries(geos));
    geos.forEach(g => g.dispose());
    const sign = new THREE.Mesh(merged, segMat);
    const SIGN_X = 60, SIGN_Z = 14;
    const WORD_W = ox - 2.5;                       // laid out along +x from 0
    const sy = groundHeight(SIGN_X + 22, SIGN_Z) + 2.4;
    // The glyphs read left-to-right when viewed from +z, i.e. from the city.
    // A beach sign faces the water: turn it 180° and slide it back so it still
    // occupies the same span of sand.
    sign.rotation.y = Math.PI;
    sign.position.set(SIGN_X + WORD_W - 1.7, sy, SIGN_Z);
    root.add(sign);
    const postGeo = track(new THREE.BoxGeometry(0.7, 3, 0.7));
    const postMat = track(new THREE.MeshStandardMaterial({ color: 0x8a8f95 }));
    for (const px of [SIGN_X + 3, SIGN_X + 40]) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(px, sy - 1.5, SIGN_Z);
      root.add(post);
    }
    addCollider(SIGN_X + WORD_W / 2, sy - 3, SIGN_Z, WORD_W + 2, 12, 1.6);
  }
}
