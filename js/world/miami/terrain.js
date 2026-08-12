import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { assetLib } from '../../core/assets.js';
import { CITY_Z, meshHeight } from './constants.js';
import { setAoUVs } from './textures.js';

/** Build beach + city ground meshes. Consumes rng2 draws for wet-sand vertex tint. */
export async function buildGround(ctx) {
  const { root, track, rng2, sandSet, sidewalkSet } = ctx;
  {
    // (a) beach: z in [-130, CITY_Z + 3], real 30 m sand_beach scan → 1 tile = 30 m
    const Z0 = -130, Z1 = CITY_Z + 3;
    const depth = Z1 - Z0;
    const geo = track(new THREE.PlaneGeometry(1500, depth, 150, 40));
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, (Z0 + Z1) / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const dry = new THREE.Color(0xffffff);                 // near-white multiply tint
    const wet = new THREE.Color(0x93a189);                 // darker + greener at waterline
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const y = meshHeight(x, z);
      pos.setY(i, y);
      tmp.copy(dry).lerp(wet, Math.min(1, Math.max(0, (2 - y) / 2.6)));  // legacy wet-sand lerp
      tmp.offsetHSL(0, 0, (rng2() - 0.5) * 0.02);
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    setAoUVs(geo);
    let mat;
    if (sandSet.map) {
      mat = await assetLib.pbrMaterial('sand_beach', { repeat: [1500 / 30, depth / 30] });
    } else {
      mat = track(new THREE.MeshStandardMaterial({ color: 0xe5cf9c, roughness: 0.95, metalness: 0 }));
    }
    mat.vertexColors = true;
    mat.needsUpdate = true;
    const beach = new THREE.Mesh(geo, mat);
    beach.receiveShadow = true;
    root.add(beach);
  }
  {
    // (b) city: z in [CITY_Z - 3, 630], sidewalk 1 tile = 2 m
    const Z0 = CITY_Z - 3, Z1 = 630;
    const depth = Z1 - Z0;
    const geo = track(new THREE.PlaneGeometry(1500, depth, 150, 60));
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, (Z0 + Z1) / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, meshHeight(pos.getX(i), pos.getZ(i)));
    }
    geo.computeVertexNormals();
    setAoUVs(geo);
    let mat;
    if (sidewalkSet.map) {
      mat = await assetLib.pbrMaterial('sidewalk', { repeat: [1500 / 2, depth / 2] });
    } else {
      mat = track(new THREE.MeshStandardMaterial({ color: 0x8f8f8c, roughness: 0.95, metalness: 0 }));
    }
    // beach + city overlap (coplanar) in the seam band — push the city mesh
    // back in depth so the sand wins there instead of z-fighting
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = 1;
    mat.polygonOffsetUnits = 1;
    const city = new THREE.Mesh(geo, mat);
    city.receiveShadow = true;
    root.add(city);
  }
}

/** Build ocean Water mesh (or flat fallback). Returns { water } for the update loop. */
export async function buildOcean(ctx) {
  const { root, track } = ctx;
  let water = null;
  let waterFallbackMat = null;
  {
    const waterGeo = track(new THREE.PlaneGeometry(5000, 3600));
    const loadNormals = (url, timeoutMs) => new Promise((resolve) => {
      const loader = new THREE.TextureLoader();
      const timer = setTimeout(() => resolve(null), timeoutMs);
      loader.load(
        url,
        (t) => { clearTimeout(timer); t.wrapS = t.wrapT = THREE.RepeatWrapping; resolve(t); },
        undefined,
        () => { clearTimeout(timer); resolve(null); }
      );
    });
    // local copy first, CDN as fallback
    let normals = await loadNormals('assets/textures/waternormals.jpg', 4000);
    if (!normals) {
      normals = await loadNormals('https://cdn.jsdelivr.net/npm/three@0.180.0/examples/textures/waternormals.jpg', 5000);
    }
    if (normals) {
      track(normals);
      water = new Water(waterGeo, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: normals,
        sunDirection: new THREE.Vector3(0.4, 0.6, -0.7).normalize(),
        sunColor: 0xffffff,
        waterColor: 0x00404f,
        distortionScale: 2.4,
        fog: true,
      });
      water.rotation.x = -Math.PI / 2;
      water.position.set(0, -0.05, -1700);
      track(water.material);
      root.add(water);
    } else {
      waterFallbackMat = track(new THREE.MeshStandardMaterial({ color: 0x0a4a5e, roughness: 0.15, metalness: 0.7 }));
      const sea = new THREE.Mesh(waterGeo, waterFallbackMat);
      sea.rotation.x = -Math.PI / 2;
      sea.position.set(0, -0.05, -1700);
      root.add(sea);
    }
  }
  return { water };
}
