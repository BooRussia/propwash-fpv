import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CITY_Y } from './constants.js';
import { tubeBetween } from './geo.js';

/** Streetlights + parked cars along Ocean Drive. */
export function buildStreet(ctx) {
  const { root, track, addCollider, rng } = ctx;
  {
    // curved-arm streetlight: pole + 2-segment gooseneck + fixture, merged;
    // the lamp head hangs from the arm tip out over the road
    const poleGeos = [
      new THREE.CylinderGeometry(0.07, 0.11, 5.7, 7).translate(0, 2.85, 0),
      tubeBetween(new THREE.Vector3(0, 5.62, 0), new THREE.Vector3(0, 6.32, 0.85), 0.055, 6),
      tubeBetween(new THREE.Vector3(0, 6.32, 0.85), new THREE.Vector3(0, 6.52, 1.7), 0.05, 6),
      new THREE.CylinderGeometry(0.16, 0.23, 0.2, 8).translate(0, 6.42, 1.62),
    ];
    const poleGeo = track(mergeGeometries(poleGeos));
    poleGeos.forEach((g) => g.dispose());
    const headGeo = track(new THREE.SphereGeometry(0.19, 8, 6));
    headGeo.translate(0, 6.28, 1.62);
    const poleMat = track(new THREE.MeshStandardMaterial({ color: 0x39424c, roughness: 0.6, metalness: 0.6 }));
    const headMat = track(new THREE.MeshStandardMaterial({ color: 0xfff2cc, emissive: 0xffd27a, emissiveIntensity: 2.2 }));
    const NL = 50;
    const lp = new THREE.InstancedMesh(poleGeo, poleMat, NL);
    const lh = new THREE.InstancedMesh(headGeo, headMat, NL);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < NL; i++) {
      const x = -600 + i * 24.5;
      const z = i % 2 ? 36.5 : 51.5;
      m4.makeRotationY(i % 2 ? 0 : Math.PI);            // arm always reaches toward the road
      m4.setPosition(x, CITY_Y, z);
      lp.setMatrixAt(i, m4);
      lh.setMatrixAt(i, m4);
      addCollider(x, CITY_Y, z, 0.35, 6.4, 0.35);
    }
    root.add(lp); root.add(lh);

    const carGeo = track(new THREE.BoxGeometry(4.2, 1.1, 1.9));
    carGeo.translate(0, 0.75, 0);
    const cabGeo = track(new THREE.BoxGeometry(2.2, 0.75, 1.7));
    cabGeo.translate(-0.2, 1.65, 0);
    // 4 wheels baked into one merged geometry per instance (1 extra draw call)
    const wheelParts = [];
    for (const wx of [-1.35, 1.35]) {
      for (const wz of [-0.78, 0.78]) {
        const g = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 10);
        g.rotateX(Math.PI / 2);
        g.translate(wx, 0.33, wz);
        wheelParts.push(g);
      }
    }
    const wheelGeo = track(mergeGeometries(wheelParts));
    wheelParts.forEach((g) => g.dispose());
    const carCols = [0xff5c8a, 0x29d3ff, 0xf5e9d0, 0x9b5de5, 0x43d17a, 0xffffff, 0x22262e];
    const NC = 34;
    const carMat = track(new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.5 }));
    const cabMat = track(new THREE.MeshStandardMaterial({ color: 0x0b1016, roughness: 0.1, metalness: 0.9 }));
    const wheelMat = track(new THREE.MeshStandardMaterial({ color: 0x14171b, roughness: 0.9, metalness: 0.1 }));
    const cars = new THREE.InstancedMesh(carGeo, carMat, NC);
    const cabs = new THREE.InstancedMesh(cabGeo, cabMat, NC);
    const wheels = new THREE.InstancedMesh(wheelGeo, wheelMat, NC);
    const col = new THREE.Color();
    const m4b = new THREE.Matrix4();
    for (let i = 0; i < NC; i++) {
      const x = -560 + i * 34 + (rng() - 0.5) * 8;
      const z = i % 2 ? 39.5 : 48.5;
      m4b.makeRotationY(i % 2 ? 0 : Math.PI);
      m4b.setPosition(x, CITY_Y, z);
      cars.setMatrixAt(i, m4b);
      cabs.setMatrixAt(i, m4b);
      wheels.setMatrixAt(i, m4b);
      cars.setColorAt(i, col.setHex(carCols[(rng() * carCols.length) | 0]));
      addCollider(x, CITY_Y, z, 4.2, 2.1, 1.9);
    }
    cars.castShadow = true;
    root.add(cars); root.add(cabs); root.add(wheels);
  }
}
