// ============================================================
// PropWash FPV — procedural map generator
// Outdoor: tropical / desert / mountains / island terrain with
// city or country locale layers. Indoor: warehouse complex.
// Everything derives from a seed; physics height queries use the
// SAME analytic height function as the visual mesh.
//
// Photoreal pass: terrain multiplies biome PBR texture sets over
// the vertex-color tint, water gets scrolling-free normal detail,
// and biomes are dressed with photoscanned props via the
// vegetation module (js/world/vegetation.js). EVERYTHING degrades
// gracefully: with an empty assets/ folder the map looks exactly
// like the original procedural version.
// ============================================================
import * as THREE from 'three';
import { settings, clamp } from '../core/state.js';
import { assetLib } from '../core/assets.js';

// ---------------- seeded noise ----------------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(seed) {
  function hash(ix, iz) {
    let h = (ix * 374761393 + iz * 668265263 + seed * 974634 + 5381) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function noise2(x, z) {
    const ix = Math.floor(x), iz = Math.floor(z);
    const fx = x - ix, fz = z - iz;
    const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
    const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
    return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
  }
  function fbm(x, z, oct) {
    let v = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      v += noise2(x * f, z * f) * amp;
      norm += amp; amp *= 0.5; f *= 2.03;
    }
    return v / norm;                                     // 0..1
  }
  function ridged(x, z, oct) {
    let v = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      v += (1 - Math.abs(2 * noise2(x * f, z * f) - 1)) * amp;
      norm += amp; amp *= 0.5; f *= 2.11;
    }
    return v / norm;
  }
  return { hash, noise2, fbm, ridged };
}

function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------- shared canvas textures ----------------
function cityWindowTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#0c1522'; g.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 10; j++) {
      const lit = Math.random() < 0.5;
      g.fillStyle = lit
        ? (Math.random() < 0.7 ? 'rgba(255,205,130,0.9)' : 'rgba(150,205,255,0.8)')
        : 'rgba(28,40,56,0.9)';
      g.fillRect(i * 16 + 2, j * 12.8 + 2, 12, 8.8);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 6);
  return tex;
}

function concreteTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#7d7f80'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(${40 + Math.random() * 60 | 0},${40 + Math.random() * 60 | 0},${40 + Math.random() * 60 | 0},0.12)`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }
  g.strokeStyle = 'rgba(230,190,60,0.85)'; g.lineWidth = 4;
  g.strokeRect(24, 24, 208, 208);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Standalone normal map for the water planes (not part of a texture set).
function loadWaterNormals() {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(
      'assets/textures/waternormals.jpg',
      (t) => {
        t.colorSpace = THREE.NoColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(40, 40);
        resolve(t);
      },
      undefined,
      () => resolve(null)
    );
  });
}

// ============================================================
export async function buildProcedural(scene, env, opts) {
  const o = Object.assign({ setting: 'outdoor', locale: 'country', terrain: 'mountains', seed: 1337 }, opts);
  const seed = (Number(o.seed) | 0) || 1337;
  const rng = mulberry32(seed ^ 0x9e3779b9);
  const nz = makeNoise(seed);

  const root = new THREE.Group();
  root.name = 'procedural';
  scene.add(root);

  const disposables = [];
  const colliders = [];
  const track = (x) => { disposables.push(x); return x; };
  const addCollider = (cx, cy, cz, sx, sy, sz) => {
    colliders.push({
      min: new THREE.Vector3(cx - sx / 2, cy, cz - sz / 2),
      max: new THREE.Vector3(cx + sx / 2, cy + sy, cz + sz / 2),
    });
  };

  // ---- asset helpers (all null-safe: empty assets/ keeps the classic look) ----
  async function texSet(key) {
    if (!assetLib) return null;
    try { return await assetLib.textureSet(key); } catch (e) { return null; }
  }
  // Clone a shared cache texture so per-map repeat never leaks into other users.
  const cloneTex = (t, rx, ry) => {
    if (!t) return null;
    const c2 = t.clone();
    c2.repeat.set(rx, ry);
    c2.needsUpdate = true;
    track(c2);
    return c2;
  };

  const handle = {
    name: '',
    spawn: { position: new THREE.Vector3(), yawRad: 0 },
    getGroundHeight: () => 0,
    colliders,
    gates: [],
    retrievalPoints: [],
    homePad: new THREE.Vector3(),
    update: () => {},
    dispose(sceneRef) {
      sceneRef.remove(root);
      for (const d of disposables) { try { d.dispose?.(); } catch (e) { /* noop */ } }
    },
  };

  // reset HDRI bands to defaults (Miami sets its own beach panorama;
  // procedural maps want the neutral pure-sky set)
  if (env && env.setHDRIBands) env.setHDRIBands({});

  if (o.setting === 'indoor') await buildIndoor();
  else await buildOutdoor();
  return handle;

  // ============================================================
  // OUTDOOR
  // ============================================================
  async function buildOutdoor() {
    const half = clamp(settings.graphics.renderDistance, 600, 2000);
    const isCity = o.locale === 'city';
    const CITY_R = 460;
    let waterLevel = -Infinity;

    // ----- raw terrain height (before flattening) -----
    let rawH;
    switch (o.terrain) {
      case 'tropical':
        waterLevel = 2.5;
        rawH = (x, z) => {
          const pond = smoothstep(0.63, 0.74, nz.fbm((x + 513) / 240, (z - 717) / 240, 3));
          return 5 + nz.fbm(x / 300, z / 300, 4) * 26 + nz.fbm(x / 46, z / 46, 2) * 2.2 - pond * 13;
        };
        break;
      case 'desert':
        rawH = (x, z) => {
          const dunes = nz.fbm(x / 270, z / 95, 4) * 15;
          const mesa = smoothstep(0.6, 0.66, nz.fbm((x - 201) / 520, (z + 99) / 520, 3));
          return 2 + dunes + mesa * (20 + nz.fbm(x / 90, z / 90, 2) * 6);
        };
        break;
      case 'island':
        waterLevel = 0;
        rawH = (x, z) => {
          const r = Math.hypot(x, z);
          const land = 1 - smoothstep(half * 0.30, half * 0.52, r + nz.fbm(x / 300, z / 300, 3) * 90);
          return -9 + land * (13 + nz.fbm(x / 230, z / 230, 4) * 24 + nz.fbm(x / 50, z / 50, 2) * 2);
        };
        break;
      case 'mountains':
      default:
        rawH = (x, z) => {
          const r = Math.hypot(x, z);
          const mask = smoothstep(70, 430, r);
          const rid = nz.ridged(x / 540, z / 540, 5);
          return 1.5 + mask * Math.pow(rid, 1.7) * 175 + nz.fbm(x / 62, z / 62, 2) * 3.5 * mask;
        };
        break;
    }

    const h00 = rawH(0, 0);
    const cityLevel = h00;

    // ----- final height with spawn/city flattening -----
    const height = (x, z) => {
      let h = rawH(x, z);
      const r = Math.hypot(x, z);
      if (isCity) {
        h = lerp(cityLevel, h, smoothstep(CITY_R, CITY_R + 90, r));
      } else {
        h = lerp(h00, h, smoothstep(12, 34, r));
      }
      return h;
    };
    handle.getGroundHeight = (x, z) => Math.max(height(x, z), waterLevel === -Infinity ? -1e9 : waterLevel);

    // ----- photoreal loads (NO rng is consumed while awaiting: determinism safe) -----
    const TERRAIN_TEX = {
      tropical:  { key: 'grass_wild', tile: 2,   normalScale: 1 },
      desert:    { key: 'sand_dunes', tile: 2.5, normalScale: 1 },
      mountains: { key: 'rock_macro', tile: 50,  normalScale: 1.3 },   // 50m aerial scan
      island:    { key: 'sand_beach', tile: 30,  normalScale: 1 },     // 30m beach scan
    };
    const tt = TERRAIN_TEX[o.terrain] || TERRAIN_TEX.mountains;
    const waterNormPromise = waterLevel > -1e8 ? loadWaterNormals() : Promise.resolve(null);
    const groundSet = await texSet(tt.key);
    const groundTexOk = !!(groundSet && (groundSet.map || groundSet.normalMap || groundSet.roughnessMap || groundSet.aoMap));

    // vegetation module — written in parallel with this file; optional at runtime
    let veg = null;
    try { veg = await import('./vegetation.js'); } catch (e) { veg = null; }

    // ----- terrain mesh with biome vertex colors -----
    const segs = half <= 800 ? 170 : half <= 1400 ? 210 : 250;
    const geo = track(new THREE.PlaneGeometry(half * 2, half * 2, segs, segs));
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color(), cB = new THREE.Color();

    const palettes = {
      tropical: { low: '#3f8f3d', high: '#2c6e34', accent: '#7ec850', rock: '#6f6a5e' },
      desert:   { low: '#d9b26a', high: '#c39a55', accent: '#e6c988', rock: '#9c6f4e' },
      mountains:{ low: '#4d7a40', high: '#8d8d86', accent: '#5e8a52', rock: '#75726c' },
      island:   { low: '#54a04a', high: '#3d7e42', accent: '#8fce62', rock: '#7c7468' },
    };
    const pal = palettes[o.terrain] || palettes.mountains;
    const cLow = new THREE.Color(pal.low), cHigh = new THREE.Color(pal.high);
    const cAcc = new THREE.Color(pal.accent), cRock = new THREE.Color(pal.rock);
    const cSnow = new THREE.Color('#eef3f6'), cSand = new THREE.Color('#e6d3a0');
    const cRoad = new THREE.Color('#3c3f42');
    const cWhite = new THREE.Color('#ffffff');
    const fieldCols = ['#c9b458', '#6da44b', '#4c7d3a', '#8a6f45', '#9fb85b'].map(x => new THREE.Color(x));

    const eps = 2.5;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const y = height(x, z);
      pos.setY(i, y);

      const slope = Math.abs(height(x + eps, z) - y) / eps + Math.abs(height(x, z + eps) - y) / eps;
      const n = nz.fbm(x / 33, z / 33, 2);
      c.copy(cLow).lerp(cHigh, clamp((y - h00) / 60 + n * 0.3, 0, 1));
      c.lerp(cAcc, n * 0.35);

      if (o.terrain === 'mountains') {
        if (slope > 0.55) c.lerp(cRock, clamp((slope - 0.55) / 0.5, 0, 1));
        if (y > 95) c.lerp(cSnow, clamp((y - 95) / 30, 0, 1));
      }
      if ((o.terrain === 'island' || o.terrain === 'tropical') && waterLevel > -1e8) {
        if (y < waterLevel + 1.6) c.lerp(cSand, clamp((waterLevel + 1.6 - y) / 1.6, 0, 1));
      }
      if (o.terrain === 'desert') c.lerp(cSand, 0.4 + n * 0.2);

      if (!isCity && o.locale === 'country' && slope < 0.14) {
        const fx = Math.floor((x + 4000) / 78), fz = Math.floor((z + 4000) / 62);
        const fh = nz.hash(fx, fz);
        if (fh > 0.35 && Math.hypot(x, z) > 40) c.lerp(fieldCols[(fh * fieldCols.length) | 0], 0.45);
      }
      if (isCity) {
        const r = Math.hypot(x, z);
        if (r < CITY_R + 20) {
          c.lerp(cRoad, 1 - smoothstep(CITY_R - 10, CITY_R + 20, r));
        }
      }
      c.offsetHSL(0, 0, (nz.hash(i, i * 7 + 1) - 0.5) * 0.03);
      // Multiply blending with a real albedo map darkens: push the tint toward
      // white so the texture carries detail and the vertex color carries hue.
      if (groundTexOk) c.lerp(cWhite, 0.55);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const terrainMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
    if (groundTexOk) {
      const rep = (half * 2) / tt.tile;              // world-space tile size = physical scan size
      if (groundSet.map) terrainMat.map = cloneTex(groundSet.map, rep, rep);
      if (groundSet.normalMap) {
        terrainMat.normalMap = cloneTex(groundSet.normalMap, rep, rep);
        terrainMat.normalScale.set(tt.normalScale, tt.normalScale);
      }
      if (groundSet.roughnessMap) {
        terrainMat.roughnessMap = cloneTex(groundSet.roughnessMap, rep, rep);
        terrainMat.roughness = 1;
      }
      if (groundSet.aoMap) {
        terrainMat.aoMap = cloneTex(groundSet.aoMap, rep, rep);
        geo.setAttribute('uv2', geo.attributes.uv);
      }
      terrainMat.needsUpdate = true;
    }
    const terrain = new THREE.Mesh(geo, terrainMat);
    terrain.receiveShadow = true;
    root.add(terrain);

    // ----- water plane -----
    if (waterLevel > -1e8) {
      const wGeo = track(new THREE.PlaneGeometry(half * 2.6, half * 2.6));
      const wMat = track(new THREE.MeshStandardMaterial({
        color: o.terrain === 'island' ? 0x0d5468 : 0x1a6b5a,
        roughness: 0.12, metalness: 0.65, transparent: true, opacity: 0.92,
      }));
      const waterNorm = await waterNormPromise;
      if (waterNorm) {
        track(waterNorm);
        wMat.normalMap = waterNorm;                  // repeat 40x40 set at load
        wMat.normalScale.set(0.4, 0.4);              // subtle ripple detail
        wMat.needsUpdate = true;
      }
      const w = new THREE.Mesh(wGeo, wMat);
      w.rotation.x = -Math.PI / 2;
      w.position.y = waterLevel - 0.04;
      root.add(w);
    } else {
      await waterNormPromise;                        // no-op (resolved null)
    }

    // ----- vegetation & props -----
    const slopeAt = (x, z) => {
      const y = height(x, z);
      return Math.abs(height(x + eps, z) - y) / eps + Math.abs(height(x, z + eps) - y) / eps;
    };
    const placeable = (x, z) => {
      const r = Math.hypot(x, z);
      if (r < 26) return false;
      if (isCity && r < CITY_R + 40) return false;
      const y = height(x, z);
      if (waterLevel > -1e8 && y < waterLevel + 0.6) return false;
      return true;
    };

    function scatterInstanced(pieces, count, maxSlope, minY, maxR, collideFirstN, colH) {
      const meshes = pieces.map(p => {
        const im = new THREE.InstancedMesh(track(p.geo), track(p.mat), count);
        im.castShadow = true;
        return im;
      });
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), pv = new THREE.Vector3();
      const e = new THREE.Euler();
      let placed = 0, tries = 0;
      while (placed < count && tries < count * 14) {
        tries++;
        const a = rng() * Math.PI * 2;
        const r = 30 + Math.pow(rng(), 0.7) * (maxR - 30);
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (!placeable(x, z)) continue;
        if (slopeAt(x, z) > maxSlope) continue;
        const y = height(x, z);
        if (y < minY) continue;
        const sc = 0.7 + rng() * 0.7;
        e.set(0, rng() * Math.PI * 2, 0);
        q.setFromEuler(e);
        s.set(sc, sc, sc);
        pv.set(x, y - 0.1, z);
        m4.compose(pv, q, s);
        for (const im of meshes) im.setMatrixAt(placed, m4);
        if (placed < collideFirstN) addCollider(x, y, z, 1.2 * sc, colH * sc, 1.2 * sc);
        placed++;
      }
      for (const im of meshes) { im.count = placed; root.add(im); }
      return placed;
    }

    // Placement collector for photoscanned props: same rejection-sampling rules
    // as scatterInstanced (deterministic rng consumption independent of whether
    // the assets/vegetation module actually loaded).
    function collectPlacements(count, opt) {
      const maxSlope = opt.maxSlope !== undefined ? opt.maxSlope : 0.6;
      const minY = opt.minY !== undefined ? opt.minY : -1e9;
      const maxY = opt.maxY !== undefined ? opt.maxY : 1e9;
      const minR = opt.minR !== undefined ? opt.minR : 30;
      const maxR = opt.maxR;
      const sMin = opt.scaleMin !== undefined ? opt.scaleMin : 0.8;
      const sMax = opt.scaleMax !== undefined ? opt.scaleMax : 1.3;
      const yOff = opt.yOffset !== undefined ? opt.yOffset : -0.08;   // multiplied by scale (sink/burial)
      const bias = opt.ringBias !== undefined ? opt.ringBias : 0.7;
      const tryMult = opt.tryMult !== undefined ? opt.tryMult : 14;
      const out = [];
      let tries = 0;
      while (out.length < count && tries < count * tryMult) {
        tries++;
        const a = rng() * Math.PI * 2;
        const r = minR + Math.pow(rng(), bias) * (maxR - minR);
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (!placeable(x, z)) continue;
        if (slopeAt(x, z) > maxSlope) continue;
        const y = height(x, z);
        if (y < minY || y > maxY) continue;
        const sc = sMin + rng() * (sMax - sMin);
        out.push({ x, y: y + yOff * sc, z, scale: sc, rotY: rng() * Math.PI * 2 });
      }
      return out;
    }

    // Photoscan scatter through the vegetation module. Colliders are added HERE
    // (known AABB shape, controlled budget) — the module's collider list gets a
    // throwaway array so its own collider policy can't double up or diverge.
    const NEW_COLLIDER_BUDGET = 60;
    let newPropColliders = 0;
    async function scatterProps(slug, placements, copt = {}) {
      if (!placements.length || !veg || typeof veg.scatterModels !== 'function') return;
      try {
        const res = await veg.scatterModels(root, slug, placements, [], copt.footprint || 1.2);
        if (!res) return;                            // model missing → no visuals, no colliders
        if (res.group && !res.group.parent) root.add(res.group);
        if (res.dispose) track({ dispose: () => { try { res.dispose(); } catch (e) { /* noop */ } } });
        if (copt.collide) {
          for (const p of placements) {
            if (newPropColliders >= NEW_COLLIDER_BUDGET) break;
            if (!copt.collide(p)) continue;
            const fw = (copt.footprint || 1.2) * p.scale;
            addCollider(p.x, p.y, p.z, fw, (copt.height || 1.5) * p.scale, fw);
            newPropColliders++;
          }
        }
      } catch (e) {
        console.warn('[procedural] scatterModels(' + slug + ') failed:', e);
      }
    }

    // Photoreal palms with cone-palm fallback. Collider behavior matches the old
    // cone palms: first N placements get trunk colliders.
    const palmSystems = [];
    function buildFallbackPalms(placements) {
      if (!placements.length) return;
      const trunk = track(new THREE.CylinderGeometry(0.13, 0.2, 6, 6)); trunk.translate(0, 3, 0);
      const crown = track(new THREE.ConeGeometry(2.1, 1.5, 7)); crown.translate(0, 6.4, 0);
      const palmMat = track(new THREE.MeshStandardMaterial({ color: 0x2c7a3c, roughness: 0.9, side: THREE.DoubleSide }));
      const ims = [
        new THREE.InstancedMesh(trunk, trunkMat, placements.length),
        new THREE.InstancedMesh(crown, palmMat, placements.length),
      ];
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      const s = new THREE.Vector3(), pv = new THREE.Vector3();
      for (let i = 0; i < placements.length; i++) {
        const p = placements[i];
        e.set(0, p.rotY, 0); q.setFromEuler(e);
        s.set(p.scale, p.scale, p.scale);
        pv.set(p.x, p.y, p.z);
        m4.compose(pv, q, s);
        for (const im of ims) im.setMatrixAt(i, m4);
      }
      for (const im of ims) {
        im.castShadow = true;
        im.instanceMatrix.needsUpdate = true;
        root.add(im);
      }
    }
    async function placePalms(placements, collideFirstN, colH) {
      for (let i = 0; i < placements.length && i < collideFirstN; i++) {
        const p = placements[i];
        addCollider(p.x, p.y, p.z, 1.2 * p.scale, colH * p.scale, 1.2 * p.scale);
      }
      let done = false;
      if (veg && typeof veg.createPalms === 'function' && placements.length) {
        try {
          const palms = await veg.createPalms(placements.length);
          if (palms && palms.group) {
            for (let i = 0; i < placements.length; i++) {
              const p = placements[i];
              palms.placeAt(i, p.x, p.y, p.z, p.scale, p.rotY);
            }
            palms.finalize?.(placements.length);
            if (!palms.group.parent) root.add(palms.group);
            if (typeof palms.update === 'function') palmSystems.push(palms);
            if (typeof palms.dispose === 'function') {
              track({ dispose: () => { try { palms.dispose(); } catch (e) { /* noop */ } } });
            }
            done = true;
          }
        } catch (e) {
          console.warn('[procedural] createPalms failed, using fallback palms:', e);
        }
      }
      if (!done) buildFallbackPalms(placements);
    }

    const treeMat = track(new THREE.MeshStandardMaterial({ color: 0x2e6b34, roughness: 0.9 }));
    const trunkMat = track(new THREE.MeshStandardMaterial({ color: 0x795c3e, roughness: 1 }));

    if (o.terrain === 'mountains') {
      // re-texture pine trunks with real bark when available (generic bark set)
      const barkSet = await texSet('bark_palm');
      if (barkSet && barkSet.map) {
        trunkMat.color.set(0xffffff);
        trunkMat.map = cloneTex(barkSet.map, 1, 2);
        if (barkSet.normalMap) trunkMat.normalMap = cloneTex(barkSet.normalMap, 1, 2);
        if (barkSet.roughnessMap) trunkMat.roughnessMap = cloneTex(barkSet.roughnessMap, 1, 2);
        trunkMat.needsUpdate = true;
      }
      const trunk = new THREE.CylinderGeometry(0.18, 0.28, 2.4, 5); trunk.translate(0, 1.2, 0);
      const cone1 = new THREE.ConeGeometry(2.2, 5, 7); cone1.translate(0, 4.4, 0);
      const cone2 = new THREE.ConeGeometry(1.5, 3.6, 7); cone2.translate(0, 6.6, 0);
      const pineMat = track(new THREE.MeshStandardMaterial({ color: 0x24513a, roughness: 0.95 }));
      scatterInstanced(
        [{ geo: trunk, mat: trunkMat }, { geo: cone1, mat: pineMat }, { geo: cone2, mat: pineMat }],
        340, 0.62, -1e9, Math.min(half * 0.85, 900), 130, 7
      );
    } else if (o.terrain === 'desert') {
      const body = new THREE.CylinderGeometry(0.45, 0.55, 4, 7); body.translate(0, 2, 0);
      const armGeo = new THREE.CylinderGeometry(0.28, 0.3, 1.8, 6);
      const armL = armGeo.clone(); armL.translate(-1, 3, 0); armL.rotateZ(0);
      const armR = armGeo.clone(); armR.translate(1.05, 2.4, 0);
      armGeo.dispose();
      const cacMat = track(new THREE.MeshStandardMaterial({ color: 0x4e7d43, roughness: 0.9 }));
      scatterInstanced([{ geo: body, mat: cacMat }, { geo: armL, mat: cacMat }, { geo: armR, mat: cacMat }],
        150, 0.5, -1e9, Math.min(half * 0.8, 800), 60, 4.5);
      const rock = new THREE.DodecahedronGeometry(1.3, 0);
      const rockMat = track(new THREE.MeshStandardMaterial({ color: 0x8d7a63, roughness: 1 }));
      scatterInstanced([{ geo: rock, mat: rockMat }], 110, 0.8, -1e9, Math.min(half * 0.85, 900), 0, 0);
    } else if (o.terrain === 'tropical') {
      // photoreal palms replace the old cone palms (same rejection rules,
      // same slot in the rng stream, same collider behavior)
      const palmMaxR = Math.min(half * 0.8, 850);
      const palmPlaces = collectPlacements(160, {
        maxSlope: 0.5,
        minY: waterLevel > -1e8 ? waterLevel + 0.7 : -1e9,
        maxR: palmMaxR,
        scaleMin: 0.72, scaleMax: 1.35,
        yOffset: -0.1,
      });
      await placePalms(palmPlaces, 110, 6.5);
      const bush = new THREE.SphereGeometry(1, 7, 5); bush.scale(1, 0.65, 1); bush.translate(0, 0.5, 0);
      scatterInstanced([{ geo: bush, mat: treeMat }], 140, 0.6, -1e9, palmMaxR, 0, 0);
    } else {
      // island: palms hug the beach ring just above the waterline
      const palmPlaces = collectPlacements(140, {
        maxSlope: 0.5,
        minY: waterLevel + 1, maxY: waterLevel + 3,
        minR: half * 0.28, maxR: half * 0.55,   // narrow ring around the coast
        ringBias: 1, tryMult: 30,               // beach band is thin — search harder
        scaleMin: 0.72, scaleMax: 1.35,
        yOffset: -0.1,
      });
      await placePalms(palmPlaces, 110, 6.5);
      const bush = new THREE.SphereGeometry(1, 7, 5); bush.scale(1, 0.65, 1); bush.translate(0, 0.5, 0);
      scatterInstanced([{ geo: bush, mat: treeMat }], 140, 0.6, -1e9, Math.min(half * 0.8, 850), 0, 0);
    }

    // ----- locale content -----
    const windmillRotors = [];
    if (isCity) {
      // roads — real asphalt when the set is present (H/V variants for UV flow)
      const asphSet = await texSet('asphalt');
      let roadMatH, roadMatV;
      const asphOk = !!(asphSet && asphSet.map);
      if (asphOk) {
        const roadRough = asphSet.roughnessMap ? 1 : 0.95;
        roadMatH = await assetLib.pbrMaterial('asphalt', { repeat: [(CITY_R * 2) / 3, 14 / 3], roughness: roadRough });
        roadMatV = await assetLib.pbrMaterial('asphalt', { repeat: [14 / 3, (CITY_R * 2) / 3], roughness: roadRough });
      } else {
        roadMatH = roadMatV = track(new THREE.MeshStandardMaterial({ color: 0x27292c, roughness: 0.95 }));
      }
      const lineMat = track(new THREE.MeshStandardMaterial({ color: 0xd9c469, emissive: 0x8a7328, emissiveIntensity: 0.3 }));
      for (let k = -2; k <= 2; k++) {
        for (const horiz of [true, false]) {
          const rGeo = track(new THREE.PlaneGeometry(horiz ? CITY_R * 2 : 14, horiz ? 14 : CITY_R * 2));
          rGeo.rotateX(-Math.PI / 2);
          if (asphOk) rGeo.setAttribute('uv2', rGeo.attributes.uv);
          const road = new THREE.Mesh(rGeo, horiz ? roadMatH : roadMatV);
          road.position.set(horiz ? 0 : k * 180, cityLevel + 0.04, horiz ? k * 180 : 0);
          root.add(road);
          const lGeo = track(new THREE.PlaneGeometry(horiz ? CITY_R * 2 : 0.5, horiz ? 0.5 : CITY_R * 2));
          lGeo.rotateX(-Math.PI / 2);
          const line = new THREE.Mesh(lGeo, lineMat);
          line.position.set(horiz ? 0 : k * 180, cityLevel + 0.055, horiz ? k * 180 : 0);
          root.add(line);
        }
      }
      // buildings
      const winTex = track(cityWindowTexture());
      const unitBox = track(new THREE.BoxGeometry(1, 1, 1));
      unitBox.translate(0, 0.5, 0);
      // glass towers: real curtain-wall facade with night-window emissive (like miami)
      const fgSet = await texSet('facade_glass');
      let bMatGlass;
      if (fgSet && fgSet.map) {
        bMatGlass = await assetLib.pbrMaterial('facade_glass', {
          repeat: [3, 6],
          roughness: fgSet.roughnessMap ? 1 : 0.18,
          metalness: 0.65,
          emissive: 0xffffff,
          emissiveIntensity: 0.85,
        });
        unitBox.setAttribute('uv2', unitBox.attributes.uv);
      } else {
        bMatGlass = track(new THREE.MeshStandardMaterial({
          color: 0x9fb6c4, roughness: 0.15, metalness: 0.85,
          emissiveMap: winTex, emissive: 0xffffff, emissiveIntensity: 0.8,
        }));
      }
      const bMatConc = track(new THREE.MeshStandardMaterial({
        color: 0xb9aFa0, roughness: 0.8,
        emissiveMap: winTex, emissive: 0xffffff, emissiveIntensity: 0.5,
      }));
      const NB = 110;
      const glassIM = new THREE.InstancedMesh(unitBox, bMatGlass, NB);
      const concIM = new THREE.InstancedMesh(unitBox, bMatConc, NB);
      glassIM.castShadow = concIM.castShadow = true;
      const m4 = new THREE.Matrix4();
      let gi = 0, ci = 0;
      for (let bx = -2; bx <= 2; bx++) {
        for (let bz = -2; bz <= 2; bz++) {
          if (bx === 0 && bz === 0) continue;               // plaza
          const baseX = bx * 180, baseZ = bz * 180;
          const nBld = 2 + (rng() * 3 | 0);
          for (let k = 0; k < nBld; k++) {
            const w = 20 + rng() * 22, d = 20 + rng() * 22;
            const centerDist = Math.hypot(bx, bz);
            const hgt = (18 + rng() * 55) * (centerDist < 1.6 ? 1.9 : 1);
            const x = baseX + (rng() - 0.5) * (150 - w);
            const z = baseZ + (rng() - 0.5) * (150 - d);
            if (Math.hypot(x, z) > CITY_R - 30) continue;
            m4.makeScale(w, hgt, d);
            m4.setPosition(x, cityLevel, z);
            if (rng() < 0.55 && gi < NB) glassIM.setMatrixAt(gi++, m4);
            else if (ci < NB) concIM.setMatrixAt(ci++, m4);
            addCollider(x, cityLevel, z, w, hgt + 2, d);
          }
        }
      }
      glassIM.count = gi; concIM.count = ci;
      root.add(glassIM); root.add(concIM);
      // streetlights
      const slGeo = track(new THREE.SphereGeometry(0.25, 6, 5));
      const slMat = track(new THREE.MeshStandardMaterial({ emissive: 0xffd27a, emissiveIntensity: 2.4, color: 0x443311 }));
      const NS = 72;
      const sl = new THREE.InstancedMesh(slGeo, slMat, NS);
      let si = 0;
      const m4b = new THREE.Matrix4();
      for (let k = -2; k <= 2 && si < NS; k++) {
        for (let d = -CITY_R + 30; d < CITY_R - 20 && si < NS; d += 65) {
          m4b.makeTranslation(d, cityLevel + 5.6, k * 180 + 8);
          sl.setMatrixAt(si++, m4b);
        }
      }
      sl.count = si;
      root.add(sl);
      // plaza — real sidewalk pavers when the set is present (2m tile)
      const plGeo = track(new THREE.CircleGeometry(34, 30));
      const swSet = await texSet('sidewalk');
      let plMat;
      if (swSet && swSet.map) {
        plMat = await assetLib.pbrMaterial('sidewalk', { repeat: [34, 34], roughness: swSet.roughnessMap ? 1 : 0.85 });
        plGeo.setAttribute('uv2', plGeo.attributes.uv);
      } else {
        plMat = track(new THREE.MeshStandardMaterial({ color: 0x5f6a72, roughness: 0.85 }));
      }
      const plaza = new THREE.Mesh(plGeo, plMat);
      plaza.rotation.x = -Math.PI / 2;
      plaza.position.set(0, cityLevel + 0.05, 0);
      root.add(plaza);
    } else {
      // country: farms
      const nFarms = 4;
      const barnMat = track(new THREE.MeshStandardMaterial({ color: 0xa8362e, roughness: 0.8 }));
      const roofMat = track(new THREE.MeshStandardMaterial({ color: 0x5e5a52, roughness: 0.9 }));
      const siloMat = track(new THREE.MeshStandardMaterial({ color: 0xc9ccd1, roughness: 0.5, metalness: 0.5 }));
      const postGeo = track(new THREE.BoxGeometry(0.18, 1.3, 0.18));
      postGeo.translate(0, 0.65, 0);
      const postMat = track(new THREE.MeshStandardMaterial({ color: 0x6e5638 }));
      for (let f = 0; f < nFarms; f++) {
        const a = (f / nFarms) * Math.PI * 2 + rng() * 0.8;
        const r = 160 + rng() * 220;
        const fx = Math.cos(a) * r, fz = Math.sin(a) * r;
        const fy = height(fx, fz);
        // barn: box + 3-sided-prism roof
        const bGeo = track(new THREE.BoxGeometry(12, 6, 8));
        const barn = new THREE.Mesh(bGeo, barnMat);
        barn.position.set(fx, fy + 3, fz);
        barn.castShadow = true;
        root.add(barn);
        const rGeo = track(new THREE.CylinderGeometry(5.6, 5.6, 12, 3, 1));
        rGeo.rotateZ(Math.PI / 2);
        rGeo.rotateX(Math.PI);
        const broof = new THREE.Mesh(rGeo, roofMat);
        broof.position.set(fx, fy + 7.4, fz);
        broof.scale.set(1, 0.55, 0.78);
        root.add(broof);
        addCollider(fx, fy, fz, 12.5, 10.5, 8.5);
        // silo
        const sGeo = track(new THREE.CylinderGeometry(2.2, 2.2, 10, 12));
        const silo = new THREE.Mesh(sGeo, siloMat);
        silo.position.set(fx + 10, fy + 5, fz + 2);
        silo.castShadow = true;
        root.add(silo);
        const capGeo = track(new THREE.SphereGeometry(2.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2));
        const cap = new THREE.Mesh(capGeo, siloMat);
        cap.position.set(fx + 10, fy + 10, fz + 2);
        root.add(cap);
        addCollider(fx + 10, fy, fz + 2, 4.6, 12.5, 4.6);
        // fence posts ring
        const NP = 26;
        const posts = new THREE.InstancedMesh(postGeo, postMat, NP);
        const m4 = new THREE.Matrix4();
        for (let i = 0; i < NP; i++) {
          const pa = (i / NP) * Math.PI * 2;
          const px = fx + Math.cos(pa) * 24, pz = fz + Math.sin(pa) * 24;
          m4.makeTranslation(px, height(px, pz), pz);
          posts.setMatrixAt(i, m4);
        }
        root.add(posts);
        // windmill at the first farm
        if (f === 0) {
          const tGeo = track(new THREE.CylinderGeometry(0.6, 1.6, 16, 8));
          const tMat = track(new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.7 }));
          const tower = new THREE.Mesh(tGeo, tMat);
          tower.position.set(fx - 14, fy + 8, fz - 6);
          tower.castShadow = true;
          root.add(tower);
          addCollider(fx - 14, fy, fz - 6, 3.2, 17, 3.2);
          const rotor = new THREE.Group();
          const bladeGeo = track(new THREE.BoxGeometry(0.3, 7, 1.1));
          bladeGeo.translate(0, 3.8, 0);
          const bladeMat = track(new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.6 }));
          for (let b = 0; b < 4; b++) {
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.rotation.z = (b / 4) * Math.PI * 2;
            rotor.add(blade);
          }
          rotor.position.set(fx - 14, fy + 16.5, fz - 6 + 1.1);
          root.add(rotor);
          windmillRotors.push(rotor);
        }
      }
    }

    // ----- spawn + pad -----
    const sy = handle.getGroundHeight(0, 0);
    handle.spawn.position.set(0, sy + 0.06, 0);
    handle.homePad.copy(handle.spawn.position);
    const padGeo = track(new THREE.CircleGeometry(2.2, 28));
    const padMat = track(new THREE.MeshStandardMaterial({ color: 0x0d2b33, emissive: 0x29d3ff, emissiveIntensity: 0.9, side: THREE.DoubleSide }));
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(0, sy + 0.08, 0);
    root.add(pad);

    // ----- race gates: terrain-following loop -----
    const rx = isCity ? 330 : o.terrain === 'island' ? Math.min(half * 0.34, 420) : 250;
    const rzR = isCity ? 330 : o.terrain === 'mountains' ? 150 : rx * 0.8;
    const NG = 12;
    for (let i = 0; i < NG; i++) {
      const a = (i / NG) * Math.PI * 2;
      const gx = Math.cos(a) * rx;
      const gz = Math.sin(a) * rzR;
      const gy = handle.getGroundHeight(gx, gz) + (isCity ? 11 : 5.5);
      // tangent direction for gate orientation
      const tx = -Math.sin(a) * rx, tz = Math.cos(a) * rzR;
      handle.gates.push({
        position: new THREE.Vector3(gx, gy, gz),
        yawRad: Math.atan2(tx, tz),
        radius: 3.4,
      });
    }
    handle.spawn.yawRad = Math.atan2(
      handle.gates[0].position.x - 0,
      handle.gates[0].position.z - 0
    ) + Math.PI;
    handle.spawn.yawRad = Math.atan2(handle.gates[0].position.x, handle.gates[0].position.z);

    // ----- retrieval points -----
    for (let i = 0; i < 10; i++) {
      const a = rng() * Math.PI * 2;
      const r = 60 + rng() * Math.min(half * 0.55, 420);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      handle.retrievalPoints.push(new THREE.Vector3(x, handle.getGroundHeight(x, z) + 1.2, z));
    }

    // ----- photoscanned biome props -----
    // NEW rng consumers, deliberately APPENDED after every pre-existing rng
    // consumer so the classic layout (trees, farms, buildings, retrieval
    // points) is untouched for a given seed. Placements are always collected
    // (pure rng+math, deterministic); visuals+colliders only materialize when
    // the model actually loads — no invisible walls with an empty assets/.
    const propMaxR = Math.min(half * 0.85, 900);
    if (o.terrain === 'desert') {
      const quiver = collectPlacements(8 + ((rng() * 7) | 0), {   // 8..14 quiver trees
        maxSlope: 0.5, maxR: Math.min(half * 0.75, 700),
        scaleMin: 0.8, scaleMax: 1.4, yOffset: -0.08,
      });
      const bigRocks = collectPlacements(20, {
        maxSlope: 0.75, maxR: propMaxR,
        scaleMin: 0.9, scaleMax: 2.6, yOffset: -0.22,
      });
      const moonRocks = collectPlacements(15, {
        maxSlope: 0.75, maxR: propMaxR,
        scaleMin: 0.7, scaleMax: 2.0, yOffset: -0.18,
      });
      await Promise.all([
        scatterProps('quiver_tree_02', quiver, { collide: () => true, footprint: 0.9, height: 4.5 }),
        scatterProps('namaqualand_boulder_04', bigRocks, { collide: (p) => p.scale > 1.8, footprint: 1.6, height: 1.3 }),
        scatterProps('moon_rock_02', moonRocks, { collide: (p) => p.scale > 1.5, footprint: 1.4, height: 1.1 }),
      ]);
    } else if (o.terrain === 'mountains') {
      const outcropA = collectPlacements(13, {
        maxSlope: 0.9, maxR: propMaxR,
        scaleMin: 1, scaleMax: 4, yOffset: -0.3,
      });
      const outcropB = collectPlacements(12, {
        maxSlope: 0.9, maxR: propMaxR,
        scaleMin: 1, scaleMax: 4, yOffset: -0.35,
      });
      const stumps = collectPlacements(10, {                      // near treeline
        maxSlope: 0.5, minY: 55, maxY: 95, maxR: propMaxR,
        scaleMin: 0.9, scaleMax: 1.3, yOffset: -0.1,
      });
      await Promise.all([
        scatterProps('boulder_01', outcropA, { collide: (p) => p.scale > 2.2, footprint: 1.8, height: 1.5 }),
        scatterProps('rock_face_01', outcropB, { collide: (p) => p.scale > 2.2, footprint: 2.2, height: 1.8 }),
        scatterProps('tree_stump_01', stumps, {}),
      ]);
    } else if (o.terrain === 'tropical') {
      const shrubsA = collectPlacements(15, {
        maxSlope: 0.55, minY: waterLevel + 0.7, maxR: Math.min(half * 0.7, 700),
        scaleMin: 0.8, scaleMax: 1.4, yOffset: -0.1,
      });
      const shrubsB = collectPlacements(15, {
        maxSlope: 0.55, minY: waterLevel + 0.7, maxR: Math.min(half * 0.7, 700),
        scaleMin: 0.8, scaleMax: 1.4, yOffset: -0.1,
      });
      const ferns = collectPlacements(13, {                        // accents near spawn
        maxSlope: 0.5, minY: waterLevel + 0.7, minR: 28, maxR: 95,
        scaleMin: 0.8, scaleMax: 1.3, yOffset: -0.06,
      });
      const anthuriums = collectPlacements(12, {
        maxSlope: 0.5, minY: waterLevel + 0.7, minR: 28, maxR: 95,
        scaleMin: 0.8, scaleMax: 1.3, yOffset: -0.06,
      });
      await Promise.all([
        scatterProps('shrub_02', shrubsA, {}),
        scatterProps('shrub_03', shrubsB, {}),
        scatterProps('fern_02', ferns, {}),
        scatterProps('anthurium_botany_01', anthuriums, {}),
      ]);
    } else {
      // island: half-buried beach boulders (colliders) + shrubs inland
      const beachBoulders = collectPlacements(12, {
        maxSlope: 0.6, minY: waterLevel + 0.6, maxY: waterLevel + 2.5,
        minR: half * 0.28, maxR: half * 0.55, ringBias: 1, tryMult: 25,
        scaleMin: 1.2, scaleMax: 2.4, yOffset: -0.5,               // half-buried
      });
      const shrubsA = collectPlacements(12, {
        maxSlope: 0.55, minY: waterLevel + 3, maxR: half * 0.45,
        scaleMin: 0.8, scaleMax: 1.4, yOffset: -0.1,
      });
      const shrubsB = collectPlacements(12, {
        maxSlope: 0.55, minY: waterLevel + 3, maxR: half * 0.45,
        scaleMin: 0.8, scaleMax: 1.4, yOffset: -0.1,
      });
      await Promise.all([
        scatterProps('boulder_01', beachBoulders, { collide: () => true, footprint: 1.6, height: 1.1 }),
        scatterProps('shrub_02', shrubsA, {}),
        scatterProps('shrub_03', shrubsB, {}),
      ]);
    }

    handle.name = 'Procedural ' + (isCity ? 'City' : 'Country') + ' — ' +
      o.terrain.charAt(0).toUpperCase() + o.terrain.slice(1) + ' #' + seed;

    handle.update = (dt) => {
      for (const r of windmillRotors) r.rotation.z += dt * 1.2;
      for (const p of palmSystems) p.update(dt);
    };
  }

  // ============================================================
  // INDOOR — warehouse complex
  // ============================================================
  async function buildIndoor() {
    handle.name = 'Procedural Indoor — Warehouse #' + seed;
    handle.getGroundHeight = () => 0;

    const wallMat = track(new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.9 }));
    // floor: real asphalt/sidewalk set as worn polished concrete when present,
    // otherwise the classic canvas concrete
    let floorMat = null;
    let floorTexOk = false;
    {
      let fSet = await texSet('asphalt');
      let fKey = 'asphalt';
      if (!(fSet && fSet.map)) { fSet = await texSet('sidewalk'); fKey = 'sidewalk'; }
      if (fSet && fSet.map && assetLib) {
        floorMat = await assetLib.pbrMaterial(fKey, {
          repeat: [120, 60],                       // 240x120m floor, 2m tile
          roughness: 0.9,
          color: 0xaeb2b5,                         // lift dark asphalt toward concrete
        });
        floorTexOk = true;
      }
    }
    if (!floorMat) {
      const floorTex = track(concreteTexture());
      floorTex.repeat.set(18, 12);
      floorMat = track(new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85 }));
    }
    const ceilMat = track(new THREE.MeshStandardMaterial({ color: 0x4c5257, roughness: 0.95 }));

    // main hall: x -80..80, z -50..50, h 22; annex: x 80..140, z -30..30, h 12
    const floorGeo = track(new THREE.PlaneGeometry(240, 120));
    floorGeo.rotateX(-Math.PI / 2);
    if (floorTexOk) floorGeo.setAttribute('uv2', floorGeo.attributes.uv);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(20, 0, 0);
    floor.receiveShadow = true;
    root.add(floor);

    const wall = (cx, cy, cz, sx, sy, sz) => {
      const g = track(new THREE.BoxGeometry(sx, sy, sz));
      const m = new THREE.Mesh(g, wallMat);
      m.position.set(cx, cy, cz);
      root.add(m);
      addCollider(cx, cy - sy / 2, cz, sx, sy, sz);
    };

    // main hall perimeter
    wall(0, 11, -50.5, 162, 22, 1);            // north
    wall(0, 11, 50.5, 162, 22, 1);             // south
    wall(-80.5, 11, 0, 1, 22, 102);            // west
    // east wall with two doorways (gaps z -18..-8 and 8..18, height 6)
    wall(80.5, 11, -34, 1, 22, 32);            // z -50..-18
    wall(80.5, 11, 0, 1, 22, 16);              // z -8..8
    wall(80.5, 11, 34, 1, 22, 32);             // z 18..50
    wall(80.5, 14, -13, 1, 16, 10);            // lintel above door 1 (y 6..22)
    wall(80.5, 14, 13, 1, 16, 10);             // lintel above door 2
    // ceilings
    {
      const cGeo = track(new THREE.PlaneGeometry(162, 102));
      cGeo.rotateX(Math.PI / 2);
      const ceil = new THREE.Mesh(cGeo, ceilMat);
      ceil.position.set(0, 22, 0);
      root.add(ceil);
      addCollider(0, 22, 0, 162, 1, 102);
      const aGeo = track(new THREE.PlaneGeometry(60, 62));
      aGeo.rotateX(Math.PI / 2);
      const aceil = new THREE.Mesh(aGeo, ceilMat);
      aceil.position.set(110, 12, 0);
      root.add(aceil);
      addCollider(110, 12, 0, 60, 1, 62);
    }
    // annex walls
    wall(110, 6, -31, 60, 12, 1);
    wall(110, 6, 31, 60, 12, 1);
    wall(140.5, 6, 0, 1, 12, 62);

    // glowing window slits (visual light sources on walls)
    {
      const slitGeo = track(new THREE.PlaneGeometry(10, 2));
      const slitMat = track(new THREE.MeshStandardMaterial({ color: 0xdef, emissive: 0xbfd9ff, emissiveIntensity: 2.2, side: THREE.DoubleSide }));
      for (let i = 0; i < 8; i++) {
        const slit = new THREE.Mesh(slitGeo, slitMat);
        slit.position.set(-70 + i * 20, 18, i % 2 ? -49.9 : 49.9);
        root.add(slit);
      }
    }

    // columns
    const colGeo = track(new THREE.CylinderGeometry(0.6, 0.7, 22, 10));
    const colMat = track(new THREE.MeshStandardMaterial({ color: 0x777d84, roughness: 0.6, metalness: 0.5 }));
    for (let cx = -60; cx <= 60; cx += 30) {
      for (let cz = -30; cz <= 30; cz += 30) {
        if (Math.abs(cx) < 10 && Math.abs(cz) < 10) continue;   // clear spawn
        const col = new THREE.Mesh(colGeo, colMat);
        col.position.set(cx, 11, cz);
        col.castShadow = true;
        root.add(col);
        addCollider(cx, 0, cz, 1.5, 22, 1.5);
      }
    }

    // crates
    {
      const crateGeo = track(new THREE.BoxGeometry(1.3, 1.3, 1.3));
      const crateMat = track(new THREE.MeshStandardMaterial({ color: 0xa9825a, roughness: 0.9 }));
      const NCR = 90;
      const crates = new THREE.InstancedMesh(crateGeo, crateMat, NCR);
      crates.castShadow = true;
      const m4 = new THREE.Matrix4();
      let idx = 0;
      for (let cl = 0; cl < 13 && idx < NCR; cl++) {
        const cx = -68 + rng() * 130, cz = -42 + rng() * 84;
        if (Math.hypot(cx, cz) < 14) continue;
        const stack = 1 + (rng() * 3 | 0);
        const spread = 1 + (rng() * 2 | 0);
        for (let s = 0; s < spread && idx < NCR; s++) {
          for (let y = 0; y < stack && idx < NCR; y++) {
            m4.makeRotationY(rng() * 0.4);
            m4.setPosition(cx + s * 1.45 + (rng() - 0.5) * 0.2, 0.66 + y * 1.32, cz + (rng() - 0.5) * 0.4);
            crates.setMatrixAt(idx++, m4);
          }
        }
        addCollider(cx + spread * 0.7, 0, cz, spread * 1.5 + 0.6, stack * 1.35, 2);
      }
      crates.count = idx;
      root.add(crates);
    }

    // shelving racks
    {
      const rackGeo = track(new THREE.BoxGeometry(24, 8, 1.4));
      const rackMat = track(new THREE.MeshStandardMaterial({ color: 0xc26b2f, roughness: 0.7, metalness: 0.4 }));
      const spots = [[-40, -20], [-40, 20], [30, -25], [30, 25]];
      for (const [rx, rz] of spots) {
        const rack = new THREE.Mesh(rackGeo, rackMat);
        rack.position.set(rx, 4, rz);
        rack.castShadow = true;
        root.add(rack);
        addCollider(rx, 0, rz, 24, 8, 1.4);
      }
    }

    // ramps
    {
      const rampGeo = track(new THREE.BoxGeometry(10, 0.5, 6));
      const rampMat = track(new THREE.MeshStandardMaterial({ color: 0x5b6168, roughness: 0.8 }));
      for (const [rx, rz, rot] of [[-15, 38, 0.32], [55, -38, -0.32]]) {
        const ramp = new THREE.Mesh(rampGeo, rampMat);
        ramp.position.set(rx, 1.4, rz);
        ramp.rotation.z = rot;
        root.add(ramp);
        addCollider(rx, 0, rz, 10, 2.8, 6);
      }
    }

    // hanging lights + point lights
    {
      const lampGeo = track(new THREE.CylinderGeometry(1.1, 1.4, 0.5, 12));
      const lampMat = track(new THREE.MeshStandardMaterial({ color: 0x333, emissive: 0xffe9c4, emissiveIntensity: 3 }));
      let pl = 0;
      for (let lx = -60; lx <= 60; lx += 40) {
        for (let lz = -25; lz <= 25; lz += 25) {
          const lamp = new THREE.Mesh(lampGeo, lampMat);
          lamp.position.set(lx, 20.5, lz);
          root.add(lamp);
          if (pl < 8 && (lx + 60) % 80 === 0) {
            const light = new THREE.PointLight(0xffe2b8, 900, 55, 2);
            light.position.set(lx, 18, lz);
            root.add(light);
            pl++;
          }
        }
      }
      const annexLamp = new THREE.Mesh(lampGeo, lampMat);
      annexLamp.position.set(110, 11, 0);
      root.add(annexLamp);
      const al = new THREE.PointLight(0xffe2b8, 500, 45, 2);
      al.position.set(110, 9, 0);
      root.add(al);
    }

    // spawn
    handle.spawn.position.set(0, 0.06, 0);
    handle.spawn.yawRad = -Math.PI / 2;      // face +X toward the doorways
    handle.homePad.copy(handle.spawn.position);
    const padGeo = track(new THREE.CircleGeometry(2, 26));
    const padMat = track(new THREE.MeshStandardMaterial({ color: 0x0d2b33, emissive: 0x29d3ff, emissiveIntensity: 1, side: THREE.DoubleSide }));
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.06;
    root.add(pad);

    // gates: slalom through hall, through both doorways, around annex
    const g = (x, y, z, yawDeg, radius = 2.6) => handle.gates.push({
      position: new THREE.Vector3(x, y, z),
      yawRad: THREE.MathUtils.degToRad(yawDeg),
      radius,
    });
    g(-30, 4, -25, 60);
    g(-60, 5, 0, 0);
    g(-30, 4, 30, -60);
    g(10, 6, 25, -90);
    g(45, 4, 30, -110);
    g(80.5, 3, 13, -90, 2.2);       // doorway 2 (south door)
    g(110, 5, 15, -50);
    g(125, 4, -12, 160);
    g(110, 5, -20, 110);
    g(80.5, 3, -13, 90, 2.2);       // doorway 1 back into hall
    g(45, 5, -30, 90);
    g(0, 8, -20, 80);

    // retrieval points: on crates, racks, annex
    const rp = (x, y, z) => handle.retrievalPoints.push(new THREE.Vector3(x, y, z));
    rp(-40, 9, -20); rp(-40, 9, 20); rp(30, 9, -25); rp(30, 9, 25);
    rp(-70, 1.5, -44); rp(70, 1.5, 44); rp(110, 1.5, 22); rp(135, 1.5, -25);
    rp(-15, 3, 38); rp(55, 3, -38);
  }
}
