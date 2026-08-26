// ============================================================
// PropWash FPV — asset pipeline (PBR textures, GLTF models, HDRIs)
// All assets live under ./assets/ (CC0, fetched by tools/fetch-assets.ps1).
// Everything is cached; missing files degrade gracefully to null.
//
// Texture sets:  assets/textures/<key>/{albedo,normal,rough,ao,opacity,emissive}.jpg
// Models:        assets/models/<slug>/<slug>.gltf (+ bin + textures/) or .glb
// HDRIs:         assets/hdri/<key>_2k.hdr
// ============================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export const ASSET_BASE = 'assets/';

// keys available after tools/fetch-assets.ps1 has run (see manifest.json)
export const TEXTURE_KEYS = [
  'sand_beach', 'sand_wet', 'grass_wild', 'rock_cliff', 'rock_macro', 'snow',
  'forest_floor', 'gravel', 'asphalt', 'sidewalk', 'road_lines', 'grass_lawn',
  'sand_dunes', 'facade_glass', 'facade_glass_day', 'facade_office', 'facade_day', 'bark_palm',
];
export const MODEL_KEYS = [
  'boulder_01', 'rock_face_01', 'rock_07', 'namaqualand_boulder_04', 'moon_rock_02',
  'quiver_tree_02', 'tree_stump_01', 'shrub_02', 'shrub_03', 'fern_02', 'anthurium_botany_01',
  // Kenney CC0 (GLB + Textures/colormap.png). Authored 6-sided, not a window atlas.
  'dumpster', 'traffic_cone', 'street_light', 'street_light_square', 'traffic_light',
  'stop_sign', 'planter', 'fence_low', 'parasol_a', 'awning',
  'kenney_skyscraper_a', 'kenney_skyscraper_c', 'kenney_midrise_e', 'kenney_house_a',
  'kenney_cactus', 'kenney_palm',
  'potted_plant_02', 'potted_plant_04', 'plastic_monobloc_chair_01', 'shrub_04', 'lambis_shell',
  // Poly Haven CC0 street / rooftop / dock props (1k glTF).
  'fire_hydrant', 'metal_trash_can', 'exterior_aircon_unit', 'wooden_crate_02',
  'Barrel_01', 'Barrel_02', 'wooden_barrels_01', 'wooden_picnic_table',
  'modular_street_seating', 'covered_car', 'old_tyre', 'utility_box_01',
  'concrete_road_barrier', 'outdoor_table_chair_set_01', 'planter_box_01',
  'ocean_buoy', 'security_camera_01', 'CoffeeCart_01',
  // Extra Kenney City Kit Roads / Suburban / Commercial / Nature (unused kit meshes).
  'construction_barrier', 'construction_fence', 'construction_light', 'electricity_pole',
  'street_sign', 'warning_sign', 'traffic_light_horizontal', 'highway_sign', 'street_light_double',
  'fence', 'kenney_tree_large', 'kenney_tree_small',
  'kenney_house_b', 'kenney_house_c', 'kenney_house_d',
  'awning_wide', 'overhang', 'parasol_b',
  'kenney_skyscraper_b', 'kenney_skyscraper_d', 'kenney_skyscraper_e',
  'kenney_midrise_a', 'kenney_midrise_c',
  'kenney_palm_tall', 'kenney_palm_bend', 'kenney_cactus_tall', 'kenney_bush',
  // Kenney Car Kit (GLB + Textures/colormap.png).
  'kenney_sedan', 'kenney_sedan_sports', 'kenney_taxi', 'kenney_suv', 'kenney_suv_luxury',
  'kenney_van', 'kenney_hatchback', 'kenney_police', 'kenney_ambulance',
  'kenney_firetruck', 'kenney_garbage_truck', 'kenney_delivery', 'kenney_truck',
];
export const HDRI_KEYS = ['beach_day', 'sunset', 'night', 'day_clear', 'overcast'];

const texLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
const hdrLoader = new RGBELoader();

function loadTex(url, srgb) {
  return new Promise((resolve) => {
    texLoader.load(url,
      (t) => {
        t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        resolve(t);
      },
      undefined,
      () => resolve(null));
  });
}

export class AssetLibrary {
  constructor(renderer) {
    this.renderer = renderer;
    this.maxAniso = renderer ? renderer.capabilities.getMaxAnisotropy() : 8;
    this._texSets = new Map();
    this._models = new Map();
    this._hdris = new Map();
    this._disposables = [];
  }

  /**
   * Load a PBR texture set. Returns { map, normalMap, roughnessMap, aoMap,
   * alphaMap, emissiveMap } — any of them null if the file is absent.
   * Textures are SHARED: never dispose them from a material; call lib.dispose().
   */
  async textureSet(key) {
    if (this._texSets.has(key)) return this._texSets.get(key);
    const base = `${ASSET_BASE}textures/${key}/`;
    const promise = Promise.all([
      loadTex(base + 'albedo.jpg', true),
      loadTex(base + 'normal.jpg', false),
      loadTex(base + 'rough.jpg', false),
      loadTex(base + 'ao.jpg', false),
      loadTex(base + 'opacity.jpg', false),
      loadTex(base + 'emissive.jpg', true),
      loadTex(base + 'metal.jpg', false),
    ]).then(([map, normalMap, roughnessMap, aoMap, alphaMap, emissiveMap, metalnessMap]) => {
      const set = { map, normalMap, roughnessMap, aoMap, alphaMap, emissiveMap, metalnessMap };
      for (const t of Object.values(set)) {
        if (t) { t.anisotropy = this.maxAniso; this._disposables.push(t); }
      }
      return set;
    });
    this._texSets.set(key, promise);
    return promise;
  }

  /**
   * Build a MeshStandardMaterial from a texture set.
   * opts: { repeat: [x, y], color, roughness, metalness, emissive,
   *         emissiveIntensity, side, transparent, normalScale }
   * repeat is applied via a cloned texture per material (shared image data).
   */
  async pbrMaterial(key, opts = {}) {
    const set = await this.textureSet(key);
    const rep = opts.repeat || [1, 1];
    const mat = new THREE.MeshStandardMaterial({
      color: opts.color !== undefined ? opts.color : 0xffffff,
      roughness: opts.roughness !== undefined ? opts.roughness : 1,
      metalness: opts.metalness !== undefined ? opts.metalness : 0,
      side: opts.side !== undefined ? opts.side : THREE.FrontSide,
      transparent: !!opts.transparent,
    });
    const applyRepeat = (t) => {
      if (!t) return null;
      const c = t.clone();
      c.repeat.set(rep[0], rep[1]);
      c.needsUpdate = true;
      this._disposables.push(c);
      return c;
    };
    if (set.map) mat.map = applyRepeat(set.map);
    if (set.normalMap) {
      mat.normalMap = applyRepeat(set.normalMap);
      const ns = opts.normalScale !== undefined ? opts.normalScale : 1;
      mat.normalScale.set(ns, ns);
    }
    if (set.roughnessMap) mat.roughnessMap = applyRepeat(set.roughnessMap);
    if (set.metalnessMap) mat.metalnessMap = applyRepeat(set.metalnessMap);
    if (set.aoMap) mat.aoMap = applyRepeat(set.aoMap);
    if (set.alphaMap) { mat.alphaMap = applyRepeat(set.alphaMap); mat.transparent = true; }
    if (opts.emissive !== undefined) {
      mat.emissive = new THREE.Color(opts.emissive);
      mat.emissiveIntensity = opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1;
      if (set.emissiveMap) mat.emissiveMap = applyRepeat(set.emissiveMap);
      else if (set.map) mat.emissiveMap = mat.map;
    }
    this._disposables.push(mat);
    return mat;
  }

  /**
   * Load a GLTF model. Returns a fresh Group each call (geometry/materials
   * shared with the cache — cheap). null if missing.
   * opts: { targetSize: meters (scales longest XZ side), castShadow: true }
   */
  async model(slug, opts = {}) {
    if (!this._models.has(slug)) {
      const tryLoad = (url) => new Promise((resolve) => {
        gltfLoader.load(url, (g) => resolve(g.scene), undefined, () => resolve(null));
      });
      const promise = (async () => {
        const glb = await tryLoad(`${ASSET_BASE}models/${slug}/${slug}.glb`);
        if (glb) return glb;
        return tryLoad(`${ASSET_BASE}models/${slug}/${slug}.gltf`);
      })();
      this._models.set(slug, promise);
    }
    const scene = await this._models.get(slug);
    if (!scene) return null;
    const clone = scene.clone(true);
    const cast = opts.castShadow !== false;
    clone.traverse((o) => {
      if (o.isMesh) { o.castShadow = cast; o.receiveShadow = true; }
    });
    if (opts.targetSize) {
      const box = new THREE.Box3().setFromObject(clone);
      const size = box.getSize(new THREE.Vector3());
      const cur = Math.max(size.x, size.z, 0.001);
      const s = opts.targetSize / cur;
      clone.scale.setScalar(s);
    }
    return clone;
  }

  /**
   * Build InstancedMeshes from a GLTF model for mass scattering.
   * Returns { group, setMatrixAt(i, matrix4), count, finalize() } or null.
   * Internal mesh transforms are baked into the geometry, so setMatrixAt
   * places the whole model. Call finalize() after all matrices are set.
   */
  async instancer(slug, count, opts = {}) {
    const src = await this.model(slug, { castShadow: opts.castShadow !== false });
    if (!src) return null;
    src.updateMatrixWorld(true);
    const parts = [];
    src.traverse((o) => {
      if (o.isMesh) {
        const geo = o.geometry.clone();
        geo.applyMatrix4(o.matrixWorld);
        this._disposables.push(geo);
        parts.push({ geo, mat: o.material });
      }
    });
    if (!parts.length) return null;
    const group = new THREE.Group();
    const meshes = parts.map((p) => {
      const im = new THREE.InstancedMesh(p.geo, p.mat, count);
      im.castShadow = opts.castShadow !== false;
      im.receiveShadow = true;
      group.add(im);
      return im;
    });
    return {
      group,
      count,
      setMatrixAt(i, m4) { for (const im of meshes) im.setMatrixAt(i, m4); },
      finalize(usedCount) {
        for (const im of meshes) {
          if (usedCount !== undefined) im.count = usedCount;
          im.instanceMatrix.needsUpdate = true;
          im.computeBoundingSphere();
        }
      },
    };
  }

  /** Load an equirect HDRI as a texture (cached). null if missing. */
  async hdri(key) {
    if (!this._hdris.has(key)) {
      const url = `${ASSET_BASE}hdri/${key}_2k.hdr`;
      const promise = new Promise((resolve) => {
        hdrLoader.load(url, (t) => {
          t.mapping = THREE.EquirectangularReflectionMapping;
          resolve(t);
        }, undefined, () => resolve(null));
      });
      this._hdris.set(key, promise);
    }
    return this._hdris.get(key);
  }

  dispose() {
    for (const d of this._disposables) { try { d.dispose?.(); } catch (e) { /* noop */ } }
    this._disposables.length = 0;
    this._texSets.clear();
    this._models.clear();
    this._hdris.clear();
  }
}

// Single shared instance, initialised by main.js
export let assetLib = null;
export function initAssetLibrary(renderer) {
  assetLib = new AssetLibrary(renderer);
  return assetLib;
}
