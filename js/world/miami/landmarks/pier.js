import * as THREE from 'three';
import { CITY_Y, CITY_Z, PIER_X } from '../constants.js';
import { plankTexture } from '../textures.js';

/** Boardwalk + pier deck, pylons, pavilion. */
export function buildPier(ctx) {
  const { root, track, addCollider } = ctx;
  const woodTex = track(plankTexture(0x9a7247, 11, 512, 512, 18));
  woodTex.repeat.set(78, 1);       // boards run across the walk, ~0.45 m each
  {
    const geo = track(new THREE.BoxGeometry(1240, 0.5, 8));
    const mat = track(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9 }));
    const bw = new THREE.Mesh(geo, mat);
    bw.position.set(0, CITY_Y + 0.05, CITY_Z - 3);
    bw.receiveShadow = true;
    root.add(bw);
  }
  {
    const woodTex2 = track(plankTexture(0x8d6a41, 23, 512, 512, 18));
    woodTex2.repeat.set(1, 20);      // boards run across the pier
    const deckGeo = track(new THREE.BoxGeometry(12, 0.6, 165));
    const deckMat = track(new THREE.MeshStandardMaterial({ map: woodTex2, roughness: 0.9 }));
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(PIER_X, 3.4, CITY_Z - 88);
    deck.castShadow = true;
    root.add(deck);
    addCollider(PIER_X, 3.1, CITY_Z - 88, 12, 0.6, 165);

    // pylons — pairs every 18m, leaving fly-under space
    const pyGeo = track(new THREE.CylinderGeometry(0.35, 0.4, 10, 8));
    const pyMat = track(new THREE.MeshStandardMaterial({ color: 0x5c4a35, roughness: 1 }));
    const pylons = new THREE.InstancedMesh(pyGeo, pyMat, 20);
    const m4 = new THREE.Matrix4();
    let pi = 0;
    for (let i = 0; i < 10; i++) {
      const z = CITY_Z - 16 - i * 17;
      for (const dx of [-5, 5]) {
        m4.makeTranslation(PIER_X + dx, -1.5, z);
        pylons.setMatrixAt(pi++, m4);
        addCollider(PIER_X + dx, -6, z, 0.9, 10, 0.9);
      }
    }
    pylons.castShadow = true;
    root.add(pylons);

    // pavilion at the end
    const pavGeo = track(new THREE.BoxGeometry(14, 5, 12));
    const pavMat = track(new THREE.MeshStandardMaterial({ color: 0xf5e9d0, roughness: 0.8 }));
    const pav = new THREE.Mesh(pavGeo, pavMat);
    pav.position.set(PIER_X, 6.2, CITY_Z - 168);
    pav.castShadow = true;
    root.add(pav);
    const roofGeo = track(new THREE.ConeGeometry(10.5, 3.5, 4));
    const roofMat = track(new THREE.MeshStandardMaterial({ color: 0xd9575e, roughness: 0.7 }));
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(PIER_X, 10.5, CITY_Z - 168);
    roof.rotation.y = Math.PI / 4;
    root.add(roof);
    addCollider(PIER_X, 3.7, CITY_Z - 168, 14, 9, 12);
    const pavLight = new THREE.PointLight(0xffd9a0, 30, 40);
    pavLight.position.set(PIER_X, 9, CITY_Z - 168);
    root.add(pavLight);
  }
}
