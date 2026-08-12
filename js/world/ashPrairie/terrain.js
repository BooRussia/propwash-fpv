import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { assetLib } from '../../core/assets.js';
import { meshHeight, CANAL, PAL, GROUND_Y } from './constants.js';
import { setAoUVs } from './textures.js';

/** Prairie ground plane with slight undulation + parcel tint. */
export async function buildGround(ctx) {
  const { root, track, mats, rng2 } = ctx;
  const SIZE = 900;
  const SEG = 180;
  const geo = track(new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG));
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cA = new THREE.Color(PAL.grassA);
  const cB = new THREE.Color(PAL.grassB);
  const cSoil = new THREE.Color(PAL.soilA);
  const tmp = new THREE.Color();
  const hash2 = (a, b) => {
    let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
    h = Math.imul(h ^ (h >>> 15), 0x2545f491);
    return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = meshHeight(x, z);
    pos.setY(i, y);
    const inYard = Math.abs(x) < 200 && z > -200 && z < 130;
    const r = hash2((x * 0.5) | 0, (z * 0.5) | 0);
    if (inYard && Math.abs(y - GROUND_Y) < 0.8) {
      tmp.copy(cSoil).lerp(new THREE.Color(PAL.concreteB), 0.35 + r * 0.25);
      tmp.offsetHSL(0, 0, (rng2() - 0.5) * 0.04);
    } else {
      tmp.copy(cA).lerp(cB, r);
      tmp.offsetHSL(0, 0, (rng2() - 0.5) * 0.03);
    }
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  setAoUVs(geo);

  let mat;
  if (mats.grassSet && mats.grassSet.map) {
    try {
      mat = await assetLib.pbrMaterial('grass_wild', { repeat: [SIZE / 25, SIZE / 25], color: PAL.grassA });
      track(mat);
    } catch (e) { mat = null; }
  }
  if (!mat) mat = mats.grass;
  mat.vertexColors = true;
  mat.needsUpdate = true;
  const ground = new THREE.Mesh(geo, mat);
  ground.receiveShadow = true;
  root.add(ground);

  const apron = track(new THREE.PlaneGeometry(380, 280, 1, 1));
  apron.rotateX(-Math.PI / 2);
  const aMat = mats.asphalt.clone();
  track(aMat);
  aMat.polygonOffset = true;
  aMat.polygonOffsetFactor = -1;
  aMat.polygonOffsetUnits = -1;
  const apronMesh = new THREE.Mesh(apron, aMat);
  apronMesh.position.set(0, 0.04, -20);
  apronMesh.receiveShadow = true;
  root.add(apronMesh);
}

/** Canal / basin water — Y slightly below bank to avoid z-fight. */
export async function buildWater(ctx) {
  const { root, track, mats } = ctx;
  const { x0, x1, z, w } = CANAL;
  const length = x1 - x0;
  const waterGeo = track(new THREE.PlaneGeometry(length, w * 0.92));
  let water = null;

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

  let normals = await loadNormals('assets/textures/waternormals.jpg', 3000);
  const waterY = -0.12;
  if (normals) {
    track(normals);
    water = new Water(waterGeo, {
      textureWidth: 256,
      textureHeight: 256,
      waterNormals: normals,
      sunDirection: new THREE.Vector3(0.55, 0.18, -0.4).normalize(),
      sunColor: 0xffe2b0,
      waterColor: PAL.water,
      distortionScale: 1.6,
      clipBias: 0.05,
      fog: true,
    });
    water.rotation.x = -Math.PI / 2;
    water.position.set((x0 + x1) / 2, waterY, z);
    track(water.material);
    root.add(water);
  } else {
    const sea = new THREE.Mesh(waterGeo, mats.water);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set((x0 + x1) / 2, waterY, z);
    root.add(sea);
  }
  return { water };
}
