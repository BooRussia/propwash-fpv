import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { assetLib } from '../../core/assets.js';
import { meshHeight, CANAL, PAL, GROUND_Y } from './constants.js';
import { setAoUVs, capAnisotropy } from './textures.js';

/** Prairie ground plane with richer soil/grass patch variation (landmarks unchanged). */
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
  const cPoison = new THREE.Color(PAL.poisonGrass ?? 0x6B7054);
  const cMoss = new THREE.Color(PAL.mossA ?? 0x3F4A32);
  const cSoil = new THREE.Color(PAL.soilA);
  const cSoilB = new THREE.Color(PAL.soilB);
  const cConc = new THREE.Color(PAL.concreteB);
  const tmp = new THREE.Color();
  const hash2 = (a, b) => {
    let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
    h = Math.imul(h ^ (h >>> 15), 0x2545f491);
    return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
  };
  // Multi-frequency patch field â€” soil vs grass without shrinking landmarks
  const patchF = (x, z) => {
    const n1 = Math.sin(x * 0.018 + 0.4) * Math.cos(z * 0.015 - 0.7);
    const n2 = Math.sin(x * 0.055 + z * 0.041) * 0.55;
    const n3 = Math.sin(x * 0.12 - z * 0.09) * 0.25;
    return n1 + n2 + n3;
  };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = meshHeight(x, z);
    pos.setY(i, y);
    const inYard = Math.abs(x) < 200 && z > -200 && z < 130;
    const r = hash2((x * 0.5) | 0, (z * 0.5) | 0);
    const pf = patchF(x, z);
    const soilAmt = THREE.MathUtils.clamp(0.45 + pf * 0.35 + (r - 0.5) * 0.2, 0, 1);
    if (inYard && Math.abs(y - GROUND_Y) < 0.8) {
      // Hardscape apron: soil â†’ concrete dust
      tmp.copy(cSoil).lerp(cConc, 0.28 + r * 0.3 + soilAmt * 0.15);
      tmp.lerp(cSoilB, (1 - soilAmt) * 0.25);
      tmp.offsetHSL(0, -0.02, (rng2() - 0.5) * 0.05);
    } else {
      // Prairie â†’ Desi poisonGrass documentary decay
      tmp.copy(cA).lerp(cB, r * 0.5).lerp(cPoison, 0.35 + r * 0.25);
      if (soilAmt > 0.62) {
        tmp.lerp(cSoil, (soilAmt - 0.62) * 1.4);
      } else if (soilAmt < 0.28) {
        tmp.lerp(cMoss, (0.28 - soilAmt) * 1.2); // moss hollows
      }
      tmp.offsetHSL(0, -0.02, (rng2() - 0.5) * 0.03);
    }
    // North concrete / tower apron: moss patches on hardscape
    if (inYard && z < -100 && Math.abs(y - GROUND_Y) < 1.2 && r > 0.55) {
      tmp.lerp(cMoss, 0.25 + (r - 0.55) * 0.5);
    }
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  setAoUVs(geo);

  let mat;
  if (mats.grassSet && mats.grassSet.map) {
    try {
      mat = await assetLib.pbrMaterial('grass_wild', { repeat: [SIZE / 16, SIZE / 16], color: PAL.grassA }); // ~16 m/tile anti-shimmer
      track(mat);
    } catch (e) { mat = null; }
  }
  if (!mat) mat = mats.grass;
  mat.vertexColors = true;
  mat.needsUpdate = true;
  capAnisotropy(mat, 4);
  const ground = new THREE.Mesh(geo, mat);
  ground.receiveShadow = true;
  root.add(ground);

  // Yard hardscape lots only — NEVER one full-width sheet (pad FOV ochre wall).
  // Keep pad→yard corridor (z>~120, |x|<60) as open prairie.
  const aMat = mats.asphalt.clone();
  track(aMat);
  aMat.polygonOffset = true;
  aMat.polygonOffsetFactor = -1;
  aMat.polygonOffsetUnits = -1;
  capAnisotropy(aMat, 4);
  for (const [ax, az, aw, ad] of [
    // tower / containment / switchyard / coop / turbine lots
    [-90, -150, 70, 60], [-30, -165, 65, 55], [35, -148, 70, 60],
    [75, -115, 50, 48], [-145, -15, 80, 60], [-105, 35, 70, 45],
    [110, 55, 60, 45], [40, 88, 40, 28], [145, -40, 55, 40],
  ]) {
    // Skip anything that would sit in the pad look-corridor
    if (az > 110 && Math.abs(ax) < 70) continue;
    const apron = track(new THREE.PlaneGeometry(aw, ad, 1, 1));
    apron.rotateX(-Math.PI / 2);
    const apronMesh = new THREE.Mesh(apron, aMat);
    apronMesh.position.set(ax, 0.04, az);
    apronMesh.receiveShadow = true;
    root.add(apronMesh);
  }

  // Moss patch decals on north concrete (towers / containment approach)
  const mossMat = (mats.moss || mats.grass).clone();
  track(mossMat);
  mossMat.polygonOffset = true;
  mossMat.polygonOffsetFactor = -2;
  mossMat.polygonOffsetUnits = -2;
  mossMat.transparent = true;
  mossMat.opacity = 0.85;
  for (const [mx, mz, mw, md] of [
    [-90, -150, 40, 36], [-30, -165, 36, 32], [35, -148, 42, 36],
    [75, -115, 28, 28], [-60, -130, 22, 20],
    [110, 55, 40, 30], [-145, -15, 50, 40], [40, 88, 30, 20],
    [130, 70, 24, 18], [-105, 35, 40, 28],
  ]) {
    const g = track(new THREE.PlaneGeometry(mw, md));
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, mossMat);
    m.position.set(mx, 0.07, mz);
    m.receiveShadow = true;
    root.add(m);
  }
}

/** Canal / basin water â€” clearer reflections, soft sun response. */
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
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: normals,
      sunDirection: new THREE.Vector3(0.55, 0.22, -0.4).normalize(),
      sunColor: 0xffe8c0,
      waterColor: PAL.water,
      distortionScale: 1.35,
      clipBias: 0.04,
      fog: true,
      alpha: 0.92,
    });
    water.rotation.x = -Math.PI / 2;
    water.position.set((x0 + x1) / 2, waterY, z);
    track(water.material);
    // Slightly glossier basin when shader exposes roughness-like uniforms
    if (water.material.uniforms) {
      if (water.material.uniforms.size) water.material.uniforms.size.value = 1.35;
    }
    root.add(water);
  } else {
    // Fallback: lower roughness for better specular basin read
    const wMat = mats.water.clone();
    track(wMat);
    wMat.roughness = 0.1;
    wMat.metalness = 0.65;
    wMat.needsUpdate = true;
    const sea = new THREE.Mesh(waterGeo, wMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set((x0 + x1) / 2, waterY, z);
    root.add(sea);
  }
  return { water };
}
