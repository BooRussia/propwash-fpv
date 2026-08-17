import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { assetLib } from '../../core/assets.js';
import { settings } from '../../core/state.js';
import {
  beginReflectionPass, endReflectionPass, reflectionSetExclusions,
} from '../vegetation.js';
import { CITY_Z, meshHeight } from './constants.js';
import { setAoUVs } from './textures.js';

// ---------------- ocean tunables ----------------
// Reflector resolution per graphics quality; 0 drops the Water addon entirely
// for the cheap sea below, because its reflection pass re-renders the whole
// scene and is far and away the most expensive thing on the map. An unknown
// quality string falls back to the 'high' entry.
const WATER_REFLECT_RES = { low: 0, medium: 192, high: 256, ultra: 512 };

// Reflection-pass exclusion rule. An object is dropped from the water
// reflection when BOTH hold:
//   * its highest point is below REFLECT_MIN_TOP, and
//   * its nearest instance sits at least REFLECT_INLAND_Z metres inland.
//
// The geometry behind it: the sea is a flat mirror at y ~= 0 and the city sits
// on a flat slab at y = CITY_Y. Sight lines from any viewpoint above the water
// down onto the water and back up into the mirrored world pass BELOW a low
// inland object long before they reach it — a car on Ocean Drive, 60 m behind
// the waterline and 1.5 m tall, can only show up in the last few metres of
// water before the sand, where it is a pixel or two. Height is what buys a
// reflection, not size: the towers, the art-deco front row, the pier, the
// ferris wheel, the lighthouse and the bridge all clear the bar, while parked
// cars, hedges, lawns, parking bays, bus shelters, benches, tree grates and
// the inland planting do not. Everything at or seaward of the promenade is
// kept whatever its height, so the breakwater boulders, beach rocks, towels,
// parasols, lifeguard towers and beach palms reflect exactly as before.
//
// An object may also opt out explicitly with `userData.pwNoReflect = true`, or
// protect its whole subtree from the rule with `userData.pwReflectKeep = true`
// (set before the first rendered frame).
const REFLECT_MIN_TOP = 9;                  // world y
const REFLECT_INLAND_Z = CITY_Z - 4;        // world z — the promenade edge

// Cheap 'low'-quality sea: scrolling normal map on a glossy plane.
const SEA_NORMAL_TILE = 16;                 // m per normal-map tile
const SEA_SCROLL = [0.011, 0.0065];         // tiles/s in u and v

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
    // pull the sand in front of the water plane at the shoreline
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -1;
    mat.polygonOffsetUnits = -1;
    const beach = new THREE.Mesh(geo, mat);
    beach.receiveShadow = true;
    // the two ground slabs are flat and mostly inland, so the reflection
    // height rule would drop them — but they are the land the reflection
    // stands on, so pin them in
    beach.userData.pwReflectKeep = true;
    root.add(beach);
  }
  {
    // (b) city: z in [CITY_Z - 3, 630], sidewalk 1 tile = 2 m
    const Z0 = CITY_Z - 3, Z1 = 630;
    const depth = Z1 - Z0;
    const geo = track(new THREE.PlaneGeometry(1500, depth, 200, 100));
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, (Z0 + Z1) / 2);
    const pos = geo.attributes.position;
    // City-block tinting. One shared sidewalk texture over 600 m of city reads
    // as an endless white plain from the air; multiplying it per-vertex with a
    // block-scale tint (concrete / asphalt / weathered) breaks it into parcels
    // for zero extra draw calls. Deterministic hash — no rng draws consumed.
    const cCol = new Float32Array(pos.count * 3);
    const hash2 = (a, b) => {
      let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
      h = Math.imul(h ^ (h >>> 15), 0x2545f491);
      return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
    };
    const BLK_X = 62, BLK_Z = 47;
    const parcel = new THREE.Color();
    const white = new THREE.Color(0xffffff);
    const PARCELS = [0xf6f2e8, 0xdcd7ca, 0xbcb8ad, 0xa5a29a, 0x8e8c85, 0x97a0a3];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, meshHeight(x, z));
      const bx = Math.floor((x + 750) / BLK_X), bz = Math.floor((z - 27) / BLK_Z);
      const r0 = hash2(bx, bz);
      parcel.setHex(PARCELS[(r0 * PARCELS.length) | 0]);
      // seams between parcels + fine mottling so a single parcel is not flat
      const seam = Math.min(
        Math.abs(((x + 750) % BLK_X) - BLK_X / 2) / (BLK_X / 2),
        Math.abs(((z - 27) % BLK_Z) - BLK_Z / 2) / (BLK_Z / 2)
      );
      const k = 0.94 + 0.06 * seam + (hash2(x * 3 | 0, z * 3 | 0) - 0.5) * 0.05;
      // the promenade band by the road stays clean pale concrete
      const street = z < 58 ? Math.max(0, 1 - Math.abs(z - 44) / 14) : 0;
      parcel.lerp(white, street);
      // far field falls off so the horizon plain does not glare
      const far = 1 - Math.min(0.3, Math.max(0, (z - 210) / 900));
      cCol[i * 3] = parcel.r * k * far;
      cCol[i * 3 + 1] = parcel.g * k * far;
      cCol[i * 3 + 2] = parcel.b * k * far;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cCol, 3));
    geo.computeVertexNormals();
    setAoUVs(geo);
    let mat;
    if (sidewalkSet.map) {
      mat = await assetLib.pbrMaterial('sidewalk', { repeat: [1500 / 2, depth / 2] });
    } else {
      mat = track(new THREE.MeshStandardMaterial({ color: 0x8f8f8c, roughness: 0.95, metalness: 0 }));
    }
    mat.vertexColors = true;
    mat.needsUpdate = true;
    // beach + city overlap (coplanar) in the seam band — push the city mesh
    // back in depth so the sand wins there instead of z-fighting
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = 1;
    mat.polygonOffsetUnits = 1;
    const city = new THREE.Mesh(geo, mat);
    city.receiveShadow = true;
    city.userData.pwReflectKeep = true;   // see the beach slab above
    root.add(city);
  }
}

/**
 * Everything the water reflection can safely skip, resolved once from a fully
 * built scene. See the REFLECT_* constants above for the rule.
 */
function collectReflectionExclusions(scene, water) {
  const list = [];
  const m = new THREE.Matrix4();
  const v = new THREE.Vector3();

  // Explicit recursion rather than traverse(), so a group can speak for its
  // whole subtree: `pwNoReflect` drops it entirely, `pwReflectKeep` protects
  // it from the size rule (a group whose parts would score differently must
  // not be split — see the palm fields).
  const walk = (o, keep) => {
    if (o === water) return;
    const ud = o.userData;
    if (ud) {
      if (ud.pwNoReflect === true) { list.push(o); return; }
      if (ud.pwReflectKeep === true) keep = true;
    }
    if (!keep && o.isMesh) evaluate(o);
    for (let i = 0; i < o.children.length; i++) walk(o.children[i], keep);
  };

  const IDENTITY = new THREE.Matrix4();
  const isIdentity = (mat) => {
    const a = mat.elements, b = IDENTITY.elements;
    for (let i = 0; i < 16; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  // highest y and nearest z of a local-space AABB pushed through `mat`
  const corners = (bb, mat) => {
    let topY = -Infinity, nearZ = Infinity;
    for (let c = 0; c < 8; c++) {
      v.set(
        (c & 1) ? bb.max.x : bb.min.x,
        (c & 2) ? bb.max.y : bb.min.y,
        (c & 4) ? bb.max.z : bb.min.z,
      ).applyMatrix4(mat);
      if (v.y > topY) topY = v.y;
      if (v.z < nearZ) nearZ = v.z;
    }
    return { topY, nearZ };
  };

  const evaluate = (o) => {
    const g = o.geometry;
    if (!g || !g.attributes || !g.attributes.position) return;
    if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox;
    if (!bb) return;
    o.updateWorldMatrix(true, false);

    let topY = -Infinity;
    let nearestZ = Infinity;
    if (o.isInstancedMesh) {
      // walk the whole capacity, not `count` — distance culling may already
      // have trimmed it and the answer must not depend on where the camera is
      const total = o.instanceMatrix ? o.instanceMatrix.count : 0;
      if (total === 0) return;
      let placed = 0;
      for (let i = 0; i < total; i++) {
        o.getMatrixAt(i, m);
        // slots past the used count are still the identity matrix three filled
        // them with; counting them would drag every fleet's footprint back to
        // the world origin and defeat the rule
        if (isIdentity(m)) continue;
        placed++;
        m.premultiply(o.matrixWorld);
        const r = corners(bb, m);
        if (r.topY > topY) topY = r.topY;
        if (r.nearZ < nearestZ) nearestZ = r.nearZ;
      }
      if (placed === 0) return;
    } else {
      const r = corners(bb, o.matrixWorld);
      topY = r.topY;
      nearestZ = r.nearZ;
    }
    if (topY < REFLECT_MIN_TOP && nearestZ > REFLECT_INLAND_Z) list.push(o);
  };

  walk(scene, false);
  return list;
}

/**
 * Build the ocean. Returns { water } — the three/addons Water instance for the
 * map's update loop, or null when the cheap sea stands in for it (graphics
 * quality 'low', or the normal map failed to load). The choice is made here,
 * at map build time, and never re-evaluated per frame.
 */
export async function buildOcean(ctx) {
  const { root, track } = ctx;
  let water = null;
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
    if (normals) track(normals);

    const quality = (settings && settings.graphics && settings.graphics.quality) || 'high';
    const res = WATER_REFLECT_RES[quality] === undefined
      ? WATER_REFLECT_RES.high : WATER_REFLECT_RES[quality];

    if (normals && res > 0) {
      water = new Water(waterGeo, {
        textureWidth: res,
        textureHeight: res,
        waterNormals: normals,
        sunDirection: new THREE.Vector3(0.4, 0.6, -0.7).normalize(),
        sunColor: 0xffffff,
        waterColor: 0x00404f,
        distortionScale: 2.4,
        clipBias: 0.05,          // stops reflection shimmer right at the waterline
        fog: true,
      });
      water.rotation.x = -Math.PI / 2;
      // Sit below the beach / boardwalk so a crash skim cannot z-fight the
      // deck or show the water plane punching through the sand. Do not
      // rewrite the stock Water shader — just the plane and depth bias.
      water.position.set(0, -0.18, -1700);
      water.renderOrder = -2;
      if (water.material) {
        water.material.polygonOffset = true;
        water.material.polygonOffsetFactor = 2;
        water.material.polygonOffsetUnits = 2;
      }
      track(water.material);

      // Bracket the addon's reflection render. Water keeps its virtual camera
      // in a closure, so a layer mask is out of reach without touching the
      // main camera (another module owns it) — hiding the excluded objects for
      // the duration of the nested render does the same job. The OUTER frame's
      // render list is already built by the time onBeforeRender runs, so the
      // toggle can never affect the frame the player sees.
      const renderReflection = water.onBeforeRender;
      let scanned = false;
      water.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
        if (!scanned) {
          scanned = true;
          reflectionSetExclusions(collectReflectionExclusions(scene, this));
        }
        beginReflectionPass();
        try {
          renderReflection.call(this, renderer, scene, camera, geometry, material, group);
        } finally {
          endReflectionPass();
        }
      };
      // the exclusion set lives at module scope in vegetation.js — hand it back
      // when this map is torn down so it never outlives the objects in it
      track({ dispose: () => reflectionSetExclusions(null) });
      root.add(water);
    } else {
      // Cheap sea: one glossy plane with a scrolling normal map, no reflection
      // pass at all. Its own onBeforeRender advances the scroll, so it needs
      // nothing from the map update loop.
      const seaMat = track(new THREE.MeshStandardMaterial({
        color: 0x0a4a5e, roughness: 0.15, metalness: 0.7,
      }));
      if (normals) {
        normals.wrapS = normals.wrapT = THREE.RepeatWrapping;
        normals.repeat.set(5000 / SEA_NORMAL_TILE, 3600 / SEA_NORMAL_TILE);
        seaMat.normalMap = normals;
        seaMat.normalScale.set(0.35, 0.35);
        seaMat.needsUpdate = true;
      }
      const sea = new THREE.Mesh(waterGeo, seaMat);
      sea.rotation.x = -Math.PI / 2;
      sea.position.set(0, -0.16, -1700);
      sea.renderOrder = -2;
      seaMat.polygonOffset = true;
      seaMat.polygonOffsetFactor = 2;
      seaMat.polygonOffsetUnits = 2;
      if (normals) {
        const t0 = performance.now();
        sea.onBeforeRender = () => {
          const t = (performance.now() - t0) * 0.001;
          normals.offset.set(t * SEA_SCROLL[0], t * SEA_SCROLL[1]);
        };
      }
      root.add(sea);
    }
  }
  return { water };
}
