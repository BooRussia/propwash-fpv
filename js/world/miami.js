// ============================================================
// PropWash FPV — Miami Skyline map
// Tropical high-rise beach city: ocean, beach, boardwalk, pier,
// Ocean Drive, art-deco + glass skyline, ferris wheel, marina.
// Pure procedural geometry; only the water-normals texture is
// fetched from the three.js CDN (with an offline fallback).
// ============================================================
import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { settings, clamp } from '../core/state.js';

// deterministic layout
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- beach/ground profile (shared by mesh + physics) ----------
const SHORE_Z = -30;      // sand dips under water here
const CITY_Z = 30;        // city plateau starts
const CITY_Y = 1.5;

function sandNoise(x, z) {
  return 0.14 * Math.sin(x * 0.11 + 1.7) * Math.sin(z * 0.17 + 0.4)
       + 0.08 * Math.sin(x * 0.031) * Math.sin(z * 0.043 + 2.0);
}

function baseProfile(z) {
  if (z >= CITY_Z) return CITY_Y;
  if (z <= SHORE_Z) return Math.max(-6, -0.4 + (z - SHORE_Z) * 0.08);
  const t = (z - SHORE_Z) / (CITY_Z - SHORE_Z);          // 0..1
  const s = t * t * (3 - 2 * t);                          // smoothstep
  return -0.4 + s * (CITY_Y + 0.4);
}

function groundHeight(x, z) {
  let g = baseProfile(z);
  if (z < CITY_Z - 2 && z > SHORE_Z - 30) g += sandNoise(x, z) * Math.max(0, 1 - Math.abs(z - 0) / 60);
  return g < 0.02 && z < 8 ? 0 : g;                       // water surface counts as ground
}

// ---------- canvas textures ----------
function windowTexture(rng, lit = 0.55, warmBias = 0.7) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#0b1420';
  g.fillRect(0, 0, 128, 256);
  const cols = 6, rows = 18;
  const cw = 128 / cols, ch = 256 / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (rng() < lit) {
        g.fillStyle = rng() < warmBias
          ? `rgba(255, ${190 + (rng() * 40) | 0}, 120, ${0.75 + rng() * 0.25})`
          : `rgba(160, 210, 255, ${0.6 + rng() * 0.35})`;
      } else {
        g.fillStyle = 'rgba(30, 44, 60, 0.9)';
      }
      g.fillRect(i * cw + 2, j * ch + 2, cw - 4, ch - 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function stripeTexture(base, stripe, w = 256, h = 256, planks = 14) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.fillStyle = stripe;
  for (let i = 0; i < planks; i++) g.fillRect(0, (h / planks) * i, w, 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function roadTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#23262a'; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 500; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
    g.fillRect(Math.random() * 256, Math.random() * 128, 2, 2);
  }
  g.fillStyle = '#e8c545';
  for (let x = 0; x < 256; x += 42) g.fillRect(x, 61, 22, 5);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ============================================================
export async function buildMiami(scene, env) {
  const rng = mulberry32(20250809);
  const root = new THREE.Group();
  root.name = 'miami';
  scene.add(root);

  const disposables = [];   // geometries/materials/textures
  const colliders = [];
  const track = (obj) => { disposables.push(obj); return obj; };
  const addCollider = (cx, cy, cz, sx, sy, sz) => {
    colliders.push({
      min: new THREE.Vector3(cx - sx / 2, cy, cz - sz / 2),
      max: new THREE.Vector3(cx + sx / 2, cy + sy, cz + sz / 2),
    });
  };

  // ---------------- ground ----------------
  {
    const geo = track(new THREE.PlaneGeometry(1500, 760, 150, 76));
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const sand = new THREE.Color('#e5cf9c');
    const sandWet = new THREE.Color('#c9b183');
    const pavement = new THREE.Color('#8f8f8c');
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      let z = pos.getZ(i) + 250;                 // shift: plane covers z -130..630
      pos.setZ(i, z);
      const y = baseProfile(z) + (z < CITY_Z - 2 ? sandNoise(x, z) * Math.max(0, 1 - Math.abs(z) / 60) : 0);
      pos.setY(i, y);
      if (z >= CITY_Z + 3) tmp.copy(pavement);
      else if (z >= CITY_Z - 3) tmp.copy(pavement).lerp(sand, (CITY_Z + 3 - z) / 6);
      else tmp.copy(sand).lerp(sandWet, Math.min(1, Math.max(0, (2 - y) / 2.6)));
      tmp.offsetHSL(0, 0, (rng() - 0.5) * 0.02);
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }));
    const ground = new THREE.Mesh(geo, mat);
    ground.receiveShadow = true;
    root.add(ground);
  }

  // ---------------- ocean ----------------
  let water = null;
  let waterFallbackMat = null;
  {
    const waterGeo = track(new THREE.PlaneGeometry(5000, 3600));
    const normals = await new Promise((resolve) => {
      const loader = new THREE.TextureLoader();
      const timer = setTimeout(() => resolve(null), 5000);
      loader.load(
        'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/textures/waternormals.jpg',
        (t) => { clearTimeout(timer); t.wrapS = t.wrapT = THREE.RepeatWrapping; resolve(t); },
        undefined,
        () => { clearTimeout(timer); resolve(null); }
      );
    });
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

  // ---------------- boardwalk + pier ----------------
  const woodTex = track(stripeTexture('#8f6b45', '#6d4f31'));
  woodTex.repeat.set(40, 2);
  {
    const geo = track(new THREE.BoxGeometry(1240, 0.5, 8));
    const mat = track(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9 }));
    const bw = new THREE.Mesh(geo, mat);
    bw.position.set(0, CITY_Y + 0.05, CITY_Z - 3);
    bw.receiveShadow = true;
    root.add(bw);
  }
  const PIER_X = -150;
  {
    const woodTex2 = track(stripeTexture('#87653f', '#66492c'));
    woodTex2.repeat.set(4, 30);
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

  // ---------------- Ocean Drive road ----------------
  {
    const roadTex = track(roadTexture());
    roadTex.repeat.set(90, 1);
    const geo = track(new THREE.PlaneGeometry(1240, 12));
    geo.rotateX(-Math.PI / 2);
    const mat = track(new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.95 }));
    const road = new THREE.Mesh(geo, mat);
    road.position.set(0, CITY_Y + 0.06, 44);
    road.receiveShadow = true;
    root.add(road);
  }

  // ---------------- palms (instanced trunks + crowns) ----------------
  {
    const trunkGeo = track(new THREE.CylinderGeometry(0.14, 0.22, 6.5, 6));
    trunkGeo.translate(0, 3.25, 0);
    const trunkMat = track(new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 1 }));
    const crownGeo = track(new THREE.ConeGeometry(2.2, 1.4, 7));
    crownGeo.translate(0, 6.9, 0);
    const crownMat = track(new THREE.MeshStandardMaterial({ color: 0x2c7a3c, roughness: 0.9, side: THREE.DoubleSide }));
    const N = 170;
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, N);
    const crowns = new THREE.InstancedMesh(crownGeo, crownMat, N);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    let placed = 0;
    while (placed < N) {
      const x = (rng() - 0.5) * 1200;
      const z = rng() < 0.72 ? 26 + rng() * 32 : 6 + rng() * 18;   // road rows + scattered sand
      if (Math.abs(x - PIER_X) < 12 && z < 36) continue;
      const y = groundHeight(x, z);
      if (y < 0.1) continue;
      const sc = 0.8 + rng() * 0.55;
      q.setFromEuler(new THREE.Euler(( rng() - 0.5) * 0.12, rng() * Math.PI * 2, (rng() - 0.5) * 0.12));
      s.set(sc, sc, sc);
      p.set(x, y, z);
      m4.compose(p, q, s);
      trunks.setMatrixAt(placed, m4);
      crowns.setMatrixAt(placed, m4);
      addCollider(x, y, z, 0.5, 6.5 * sc, 0.5);   // every trunk is solid
      placed++;
    }
    trunks.castShadow = true; crowns.castShadow = true;
    root.add(trunks); root.add(crowns);
  }

  // ---------------- beach props: lifeguard huts + umbrellas ----------------
  {
    const hutCols = [0xff7fa0, 0x53d6d6, 0xffd166, 0x9b5de5, 0x43d17a, 0xff8c42];
    for (let i = 0; i < 6; i++) {
      const x = -430 + i * 165 + (rng() - 0.5) * 30;
      const z = 10 + rng() * 6;
      const y = groundHeight(x, z);
      const g = new THREE.Group();
      const bodyGeo = track(new THREE.BoxGeometry(3, 2.4, 3));
      const bodyMat = track(new THREE.MeshStandardMaterial({ color: hutCols[i % hutCols.length], roughness: 0.7 }));
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 3.2;
      body.castShadow = true;
      const legGeo = track(new THREE.BoxGeometry(0.25, 2.2, 0.25));
      const legMat = track(new THREE.MeshStandardMaterial({ color: 0xf0ead8, roughness: 0.9 }));
      for (const [lx, lz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, 1.1, lz);
        g.add(leg);
      }
      const roofGeo = track(new THREE.ConeGeometry(2.6, 1.2, 4));
      const roofMat = track(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }));
      const hr = new THREE.Mesh(roofGeo, roofMat);
      hr.position.y = 5.0; hr.rotation.y = Math.PI / 4;
      g.add(body, hr);
      g.position.set(x, y, z);
      root.add(g);
      addCollider(x, y, z, 3.4, 5.6, 3.4);
    }
    // umbrellas
    const poleGeo = track(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 5));
    poleGeo.translate(0, 1.1, 0);
    const canGeo = track(new THREE.ConeGeometry(1.5, 0.55, 8));
    canGeo.translate(0, 2.2, 0);
    const poleMat = track(new THREE.MeshStandardMaterial({ color: 0xdddddd }));
    const canMat = track(new THREE.MeshStandardMaterial({ color: 0xff5c8a, roughness: 0.7, side: THREE.DoubleSide }));
    const NU = 60;
    const poles = new THREE.InstancedMesh(poleGeo, poleMat, NU);
    const cans = new THREE.InstancedMesh(canGeo, canMat, NU);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < NU; i++) {
      const x = (rng() - 0.5) * 1100;
      const z = 2 + rng() * 16;
      const y = groundHeight(x, z);
      m4.makeRotationY(rng() * Math.PI);
      m4.setPosition(x, Math.max(y, 0.1), z);
      poles.setMatrixAt(i, m4);
      cans.setMatrixAt(i, m4);
    }
    root.add(poles); root.add(cans);
  }

  // ---------------- streetlights + parked cars ----------------
  {
    const poleGeo = track(new THREE.CylinderGeometry(0.08, 0.1, 6, 6));
    poleGeo.translate(0, 3, 0);
    const headGeo = track(new THREE.SphereGeometry(0.22, 8, 6));
    headGeo.translate(0, 6.1, 0);
    const poleMat = track(new THREE.MeshStandardMaterial({ color: 0x39424c, roughness: 0.6, metalness: 0.6 }));
    const headMat = track(new THREE.MeshStandardMaterial({ color: 0xfff2cc, emissive: 0xffd27a, emissiveIntensity: 2.2 }));
    const NL = 50;
    const lp = new THREE.InstancedMesh(poleGeo, poleMat, NL);
    const lh = new THREE.InstancedMesh(headGeo, headMat, NL);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < NL; i++) {
      const x = -600 + i * 24.5;
      const z = i % 2 ? 36.5 : 51.5;
      m4.makeTranslation(x, CITY_Y, z);
      lp.setMatrixAt(i, m4);
      lh.setMatrixAt(i, m4);
      addCollider(x, CITY_Y, z, 0.35, 6.4, 0.35);
    }
    root.add(lp); root.add(lh);

    const carGeo = track(new THREE.BoxGeometry(4.2, 1.1, 1.9));
    carGeo.translate(0, 0.75, 0);
    const cabGeo = track(new THREE.BoxGeometry(2.2, 0.75, 1.7));
    cabGeo.translate(-0.2, 1.65, 0);
    const carCols = [0xff5c8a, 0x29d3ff, 0xf5e9d0, 0x9b5de5, 0x43d17a, 0xffffff, 0x22262e];
    const NC = 34;
    const carMat = track(new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.5 }));
    const cabMat = track(new THREE.MeshStandardMaterial({ color: 0x1a2129, roughness: 0.15, metalness: 0.8 }));
    const cars = new THREE.InstancedMesh(carGeo, carMat, NC);
    const cabs = new THREE.InstancedMesh(cabGeo, cabMat, NC);
    const col = new THREE.Color();
    const m4b = new THREE.Matrix4();
    for (let i = 0; i < NC; i++) {
      const x = -560 + i * 34 + (rng() - 0.5) * 8;
      const z = i % 2 ? 39.5 : 48.5;
      m4b.makeRotationY(i % 2 ? 0 : Math.PI);
      m4b.setPosition(x, CITY_Y, z);
      cars.setMatrixAt(i, m4b);
      cabs.setMatrixAt(i, m4b);
      cars.setColorAt(i, col.setHex(carCols[(rng() * carCols.length) | 0]));
      addCollider(x, CITY_Y, z, 4.2, 2.1, 1.9);
    }
    cars.castShadow = true;
    root.add(cars); root.add(cabs);
  }

  // ---------------- skyline ----------------
  const winTexA = track(windowTexture(rng, 0.5));
  const winTexB = track(windowTexture(rng, 0.65, 0.4));
  const decoCols = [0xf2b8c6, 0x7fd4c1, 0xf5e9d0, 0xffb385, 0xc3b4e6];
  const glassMat = track(new THREE.MeshStandardMaterial({
    color: 0x8fb8c9, roughness: 0.12, metalness: 0.92,
    emissiveMap: winTexB, emissive: 0xffffff, emissiveIntensity: 0.85,
  }));
  const towerGroup = new THREE.Group();

  function addTower(x, z, w, h, d, style) {
    if (style === 'deco') {
      const color = decoCols[(rng() * decoCols.length) | 0];
      const mat = track(new THREE.MeshStandardMaterial({
        color, roughness: 0.75,
        emissiveMap: winTexA, emissive: 0xffffff, emissiveIntensity: 0.55,
      }));
      let y = CITY_Y;
      const tiers = 2 + ((rng() * 2) | 0);
      let tw = w, td = d;
      for (let t = 0; t < tiers; t++) {
        const th = h * (t === 0 ? 0.55 : 0.45 / (tiers - 1));
        const geo = track(new THREE.BoxGeometry(tw, th, td));
        const uv = geo.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(1, tw / 14), uv.getY(i) * Math.max(1, th / 26));
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y + th / 2, z);
        mesh.castShadow = true;
        towerGroup.add(mesh);
        y += th;
        tw *= 0.72; td *= 0.72;
      }
      // parapet cylinder
      const capGeo = track(new THREE.CylinderGeometry(Math.min(tw, td) * 0.4, Math.min(tw, td) * 0.42, 3.5, 10));
      const cap = new THREE.Mesh(capGeo, mat);
      cap.position.set(x, y + 1.7, z);
      towerGroup.add(cap);
      // neon accent strip
      if (rng() < 0.6) {
        const neonGeo = track(new THREE.BoxGeometry(w * 1.02, 0.5, 0.3));
        const neonMat = track(new THREE.MeshStandardMaterial({
          color: 0x111111,
          emissive: rng() < 0.5 ? 0x29d3ff : 0xff5c8a,
          emissiveIntensity: 3.2,
        }));
        const neon = new THREE.Mesh(neonGeo, neonMat);
        neon.position.set(x, CITY_Y + h * 0.5, z - d / 2 - 0.2);
        towerGroup.add(neon);
      }
    } else if (style === 'cyl') {
      const geo = track(new THREE.CylinderGeometry(w / 2, w / 2, h, 18));
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(1, (Math.PI * w) / 16), uv.getY(i) * Math.max(1, h / 26));
      const mesh = new THREE.Mesh(geo, glassMat);
      mesh.position.set(x, CITY_Y + h / 2, z);
      mesh.castShadow = true;
      towerGroup.add(mesh);
      d = w;
    } else {
      const geo = track(new THREE.BoxGeometry(w, h, d));
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(1, w / 14), uv.getY(i) * Math.max(1, h / 26));
      const mesh = new THREE.Mesh(geo, glassMat);
      mesh.position.set(x, CITY_Y + h / 2, z);
      mesh.castShadow = true;
      towerGroup.add(mesh);
      // roof details
      if (rng() < 0.5) {
        const acGeo = track(new THREE.BoxGeometry(w * 0.25, 2.5, d * 0.25));
        const acMat = track(new THREE.MeshStandardMaterial({ color: 0x6d747c, roughness: 0.9 }));
        const ac = new THREE.Mesh(acGeo, acMat);
        ac.position.set(x + w * 0.2, CITY_Y + h + 1.25, z);
        towerGroup.add(ac);
      }
      if (rng() < 0.4) {
        const mastGeo = track(new THREE.CylinderGeometry(0.15, 0.15, 14, 5));
        const mastMat = track(new THREE.MeshStandardMaterial({ color: 0xaab0b8 }));
        const mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(x, CITY_Y + h + 7, z);
        towerGroup.add(mast);
        const beacon = new THREE.Mesh(
          track(new THREE.SphereGeometry(0.4, 6, 5)),
          track(new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff2222, emissiveIntensity: 4 }))
        );
        beacon.position.set(x, CITY_Y + h + 14, z);
        towerGroup.add(beacon);
      }
    }
    addCollider(x, CITY_Y, z, w, h + 4, d);
    towerData.push({ x, z, w, h, d });
  }

  const towerData = [];
  {
    const rows = [
      { z: 78, hMin: 35, hMax: 90 },
      { z: 125, hMin: 55, hMax: 140 },
      { z: 185, hMin: 80, hMax: 185 },
    ];
    for (const row of rows) {
      for (let x = -560; x <= 560; x += 62) {
        if (((x + 700) % 186) < 26) continue;            // street gaps
        if (rng() < 0.18) continue;
        const w = 20 + rng() * 22;
        const d = 18 + rng() * 18;
        const h = row.hMin + rng() * (row.hMax - row.hMin);
        const style = rng() < 0.42 && row.z < 130 ? 'deco' : rng() < 0.12 ? 'cyl' : 'glass';
        addTower(x + (rng() - 0.5) * 10, row.z + (rng() - 0.5) * 16, w, h, d, style);
      }
    }
  }
  root.add(towerGroup);

  // backdrop city (cheap, far)
  {
    const geos = [];
    for (let i = 0; i < 60; i++) {
      const w = 30 + rng() * 50, h = 40 + rng() * 160, d = 30 + rng() * 40;
      const g = new THREE.BoxGeometry(w, h, d);
      g.translate(-800 + rng() * 1600, CITY_Y + h / 2, 300 + rng() * 320);
      geos.push(g);
    }
    const merged = track(mergeGeometries(geos));
    geos.forEach(g => g.dispose());
    const mat = track(new THREE.MeshStandardMaterial({ color: 0x3d4653, roughness: 0.9, emissive: 0x2a3444, emissiveIntensity: 0.35 }));
    root.add(new THREE.Mesh(merged, mat));
  }

  // ---------------- ferris wheel ----------------
  const wheel = new THREE.Group();
  const WHEEL_X = -215, WHEEL_Z = 42, WHEEL_R = 20;
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
    const rimGeo = track(new THREE.TorusGeometry(WHEEL_R, 0.5, 8, 40));
    const rimMat = track(new THREE.MeshStandardMaterial({ color: 0x223, emissive: 0x29d3ff, emissiveIntensity: 1.6, roughness: 0.4 }));
    wheel.add(new THREE.Mesh(rimGeo, rimMat));
    const spokeGeo = track(new THREE.BoxGeometry(0.25, WHEEL_R * 2, 0.25));
    const spokeMat = track(new THREE.MeshStandardMaterial({ color: 0xccd4da, roughness: 0.5 }));
    for (let i = 0; i < 6; i++) {
      const sp = new THREE.Mesh(spokeGeo, spokeMat);
      sp.rotation.z = (i / 6) * Math.PI;
      wheel.add(sp);
    }
    const cabGeo = track(new THREE.BoxGeometry(2.2, 2, 2.2));
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

  // ---------------- MIAMI sign ----------------
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
    const sy = groundHeight(SIGN_X + 22, SIGN_Z) + 2.4;
    sign.position.set(SIGN_X, sy, SIGN_Z);
    root.add(sign);
    const postGeo = track(new THREE.BoxGeometry(0.7, 3, 0.7));
    const postMat = track(new THREE.MeshStandardMaterial({ color: 0x8a8f95 }));
    for (const px of [SIGN_X + 3, SIGN_X + 40]) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(px, sy - 1.5, SIGN_Z);
      root.add(post);
    }
    addCollider(SIGN_X + 22, sy - 3, SIGN_Z, 46, 12, 1.6);
  }

  // ---------------- marina ----------------
  const boats = [];
  {
    const MAR_X = 300;
    const dockTex = track(stripeTexture('#96714a', '#755634'));
    dockTex.repeat.set(2, 16);
    const dockGeo = track(new THREE.BoxGeometry(4, 0.4, 90));
    const dockMat = track(new THREE.MeshStandardMaterial({ map: dockTex, roughness: 0.95 }));
    for (const dx of [0, 26, 52]) {
      const dock = new THREE.Mesh(dockGeo, dockMat);
      dock.position.set(MAR_X + dx, 0.6, -55);
      root.add(dock);
      addCollider(MAR_X + dx, 0.2, -55, 4, 0.9, 90);
    }
    const hullGeo = track(new THREE.CapsuleGeometry(1.4, 5, 4, 8));
    hullGeo.rotateZ(Math.PI / 2);
    const hullMat = track(new THREE.MeshStandardMaterial({ color: 0xf2f5f7, roughness: 0.4 }));
    const mastGeo = track(new THREE.CylinderGeometry(0.08, 0.08, 8, 5));
    const mastMat = track(new THREE.MeshStandardMaterial({ color: 0xd8d8d8 }));
    for (let i = 0; i < 8; i++) {
      const b = new THREE.Group();
      const hull = new THREE.Mesh(hullGeo, hullMat);
      hull.scale.set(0.8 + rng() * 0.5, 0.55, 0.9);
      b.add(hull);
      if (rng() < 0.6) {
        const mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.y = 4;
        b.add(mast);
      }
      b.position.set(MAR_X - 8 + (rng() * 3 | 0) * 26 + (rng() < 0.5 ? -7 : 7), 0.35, -20 - rng() * 70);
      b.rotation.y = rng() * 0.4 - 0.2 + Math.PI / 2;
      b.userData.phase = rng() * Math.PI * 2;
      boats.push(b);
      root.add(b);
    }
  }

  // ---------------- helipad towers ----------------
  for (const [hx, hz] of [[430, 70], [-430, 100]]) {
    const h = 45 + rng() * 20;
    const geo = track(new THREE.BoxGeometry(16, h, 16));
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * (h / 26));
    const mesh = new THREE.Mesh(geo, glassMat);
    mesh.position.set(hx, CITY_Y + h / 2, hz);
    mesh.castShadow = true;
    root.add(mesh);
    const padGeo = track(new THREE.CylinderGeometry(6, 6, 0.4, 24));
    const padMat = track(new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.9 }));
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(hx, CITY_Y + h + 0.2, hz);
    root.add(pad);
    const hGeo = track(new THREE.RingGeometry(3.4, 4.2, 24));
    const hMat = track(new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 1.5, side: THREE.DoubleSide }));
    const ring = new THREE.Mesh(hGeo, hMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(hx, CITY_Y + h + 0.45, hz);
    root.add(ring);
    addCollider(hx, CITY_Y, hz, 16, h + 1, 16);
    towerData.push({ x: hx, z: hz, w: 16, h, d: 16 });
  }

  // ---------------- spawn / home pad ----------------
  const spawnPos = new THREE.Vector3(0, groundHeight(0, 8) + 0.06, 8);
  {
    const padGeo = track(new THREE.CircleGeometry(2.2, 28));
    const padMat = track(new THREE.MeshStandardMaterial({ color: 0x0d2b33, emissive: 0x29d3ff, emissiveIntensity: 0.9, side: THREE.DoubleSide }));
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.copy(spawnPos).y += 0.02;
    root.add(pad);
  }

  // ---------------- race gates ----------------
  const G = (x, z, y, yawDeg, radius = 3.4) =>
    ({ position: new THREE.Vector3(x, y, z), yawRad: THREE.MathUtils.degToRad(yawDeg), radius });
  const gates = [
    G(-40, 6, 5, 90),                                   // 1: down the beach
    G(-100, 2, 4, 90),                                  // 2: low over sand
    G(-150, -50, 1.8, 95, 3.0),                         // 3: UNDER the pier deck
    G(-185, -95, 6, 110),                               // 4: out over water
    G(-235, -30, 8, 160),                               // 5: bank back toward shore
    G(-215, 42, CITY_Y + WHEEL_R + 4, 180, 3.0),        // 6: through the ferris wheel hub plane
    G(-160, 44, 8, 90),                                 // 7: down Ocean Drive
    G(-60, 44, 6, 90),                                  // 8: street slalom
    G(30, 44, 8, 90),                                   // 9
    G(95, 100, 25, 45),                                 // 10: climb between towers
    G(150, 60, 14, 130),                                // 11: back over boardwalk
    G(82, 18, 10, 250, 3.2),                            // 12: past the MIAMI sign, home
  ];

  // ---------------- retrieval points ----------------
  const retrievalPoints = [];
  {
    // rooftops of a few mid towers
    let count = 0;
    for (const t of towerData) {
      if (count >= 4) break;
      if (t.h > 40 && t.h < 120 && Math.abs(t.x) < 300) {
        retrievalPoints.push(new THREE.Vector3(t.x + t.w / 4, CITY_Y + t.h + 1.2, t.z + t.d / 4));
        count++;
      }
    }
    retrievalPoints.push(new THREE.Vector3(PIER_X, 1.2, CITY_Z - 60));          // under the pier
    retrievalPoints.push(new THREE.Vector3(PIER_X, 12.4, CITY_Z - 168));        // pier pavilion roof
    retrievalPoints.push(new THREE.Vector3(-430 + 165, groundHeight(-265, 12) + 6, 12)); // lifeguard hut roof
    retrievalPoints.push(new THREE.Vector3(300, 1.6, -80));                      // marina dock end
    retrievalPoints.push(new THREE.Vector3(82, groundHeight(82, 14) + 11, 14));  // atop the MIAMI sign
    retrievalPoints.push(new THREE.Vector3(430, CITY_Y + 66, 70));               // helipad
  }

  // ---------------- handle ----------------
  let time = 0;
  return {
    name: 'Miami Skyline',
    spawn: { position: spawnPos, yawRad: Math.PI / 2 },
    getGroundHeight: groundHeight,
    colliders,
    gates,
    retrievalPoints,
    homePad: spawnPos.clone(),
    update(dt) {
      time += dt;
      if (water) {
        water.material.uniforms['time'].value += dt * 0.6;
        // water must go dark at night — the Water shader has its own sun
        const tod = settings.environment.timeOfDay;
        const dayF = Math.max(0.03, Math.sin(Math.PI * clamp((tod - 6.2) / 13.2, 0, 1)));
        water.material.uniforms['sunColor'].value.setScalar(dayF);
        water.material.uniforms['waterColor'].value.setHex(0x00404f).multiplyScalar(0.12 + 0.88 * dayF);
      }
      wheel.rotation.z += dt * 0.12;
      // keep cabins upright
      for (const child of wheel.children) {
        if (child.userData.angle !== undefined) child.rotation.z = -wheel.rotation.z;
      }
      for (const b of boats) {
        b.position.y = 0.35 + Math.sin(time * 1.1 + b.userData.phase) * 0.12;
        b.rotation.x = Math.sin(time * 0.9 + b.userData.phase) * 0.03;
      }
    },
    dispose(sceneRef) {
      sceneRef.remove(root);
      for (const d of disposables) { try { d.dispose?.(); } catch (e) { /* noop */ } }
    },
  };
}
