import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CITY_Y, WHEEL_X, WHEEL_Z, WHEEL_R } from '../constants.js';

/** Ferris wheel landmark. Returns { wheel } for the update loop. */
export function buildFerris(ctx) {
  const { root, track, addCollider } = ctx;
  const wheel = new THREE.Group();
  {
    const hubY = CITY_Y + WHEEL_R + 4;
    const legGeo = track(new THREE.BoxGeometry(1.4, WHEEL_R + 4, 1.4));
    const legMat = track(new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.5, metalness: 0.6 }));
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(WHEEL_X + side * 5, CITY_Y + (WHEEL_R + 4) / 2, WHEEL_Z);
      leg.rotation.z = side * 0.32;
      leg.castShadow = true;
      root.add(leg);
      addCollider(WHEEL_X + side * 6.5, CITY_Y, WHEEL_Z, 3, WHEEL_R + 4, 3);
    }
    // twin offset rims + cross-braces so the wheel reads structural
    const RIM_Z = 0.7;
    const rimGeo = track(new THREE.TorusGeometry(WHEEL_R, 0.3, 8, 48));
    const rimMat = track(new THREE.MeshStandardMaterial({ color: 0x223, emissive: 0x29d3ff, emissiveIntensity: 1.6, roughness: 0.4 }));
    for (const zs of [-1, 1]) {
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.z = zs * RIM_Z;
      wheel.add(rim);
    }
    const spokeMat = track(new THREE.MeshStandardMaterial({ color: 0xccd4da, roughness: 0.5 }));
    {
      const braceGeos = [];
      for (let i = 0; i < 24; i++) {
        const g = new THREE.BoxGeometry(0.14, 0.14, RIM_Z * 2);
        g.translate(0, WHEEL_R, 0);
        g.rotateZ((i / 24) * Math.PI * 2);
        braceGeos.push(g);
      }
      const braces = new THREE.Mesh(track(mergeGeometries(braceGeos)), spokeMat);
      braceGeos.forEach((g) => g.dispose());
      wheel.add(braces);
      // 6 full-diameter spokes per rim + hub axle, merged into one mesh
      const spokeGeos = [];
      for (let i = 0; i < 6; i++) {
        for (const zs of [-1, 1]) {
          const g = new THREE.BoxGeometry(0.2, WHEEL_R * 2, 0.2);
          g.rotateZ((i / 6) * Math.PI);
          g.translate(0, 0, zs * RIM_Z);
          spokeGeos.push(g);
        }
      }
      const axle = new THREE.CylinderGeometry(0.55, 0.55, RIM_Z * 2 + 0.7, 10);
      axle.rotateX(Math.PI / 2);
      spokeGeos.push(axle);
      const spokes = new THREE.Mesh(track(mergeGeometries(spokeGeos)), spokeMat);
      spokeGeos.forEach((g) => g.dispose());
      wheel.add(spokes);
    }
    // gondolas with a pyramid roof cap + hanger arm (merged, still 1 mesh each)
    const cabParts = [new THREE.BoxGeometry(2.1, 1.4, 2.1).translate(0, -0.4, 0)];
    {
      const roofCap = new THREE.ConeGeometry(1.62, 0.7, 4);
      roofCap.rotateY(Math.PI / 4);
      roofCap.translate(0, 0.65, 0);
      cabParts.push(roofCap);
      cabParts.push(new THREE.BoxGeometry(0.1, 0.7, 0.1).translate(0, 1.25, 0));
    }
    const cabGeo = track(mergeGeometries(cabParts));
    cabParts.forEach((g) => g.dispose());
    const cabCols = [0xff5c8a, 0x29d3ff, 0xffd166, 0x43d17a];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const cabMat = track(new THREE.MeshStandardMaterial({
        color: cabCols[i % 4], roughness: 0.5,
        emissive: cabCols[i % 4], emissiveIntensity: 0.8,
      }));
      const cab = new THREE.Mesh(cabGeo, cabMat);
      cab.position.set(Math.cos(a) * WHEEL_R, Math.sin(a) * WHEEL_R, 0);
      cab.userData.angle = a;
      wheel.add(cab);
    }
    wheel.position.set(WHEEL_X, hubY, WHEEL_Z);
    root.add(wheel);
  }
  return { wheel };
}
