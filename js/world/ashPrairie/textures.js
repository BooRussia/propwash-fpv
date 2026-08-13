import * as THREE from 'three';
import { assetLib } from '../../core/assets.js';
import { PAL } from './constants.js';

/** Ensure aoMap UV channel exists (three.js expects uv2 for AO). */
export function setAoUVs(geo) {
  if (!geo.attributes.uv) return;
  if (!geo.attributes.uv2) geo.setAttribute('uv2', geo.attributes.uv);
}

/**
 * Build shared industrial materials with AssetLibrary textureSet fallbacks.
 * Colour multipliers push scans toward the Ash Prairie Desi palette.
 */
export async function buildMaterials(track) {
  const [
    gravelSet, asphaltSet, rockSet, grassSet, officeSet, sidewalkSet,
  ] = await Promise.all([
    assetLib.textureSet('gravel'),
    assetLib.textureSet('asphalt'),
    assetLib.textureSet('rock_cliff'),
    assetLib.textureSet('grass_wild'),
    assetLib.textureSet('facade_office'),
    assetLib.textureSet('sidewalk'),
  ]);

  const std = (color, opts = {}) => track(new THREE.MeshStandardMaterial({
    color, roughness: opts.roughness ?? 0.92, metalness: opts.metalness ?? 0,
    side: opts.side ?? THREE.FrontSide,
  }));

  async function pbrOr(key, set, color, repeat, extra = {}) {
    if (set?.map) {
      try {
        const mat = await assetLib.pbrMaterial(key, {
          repeat, color, roughness: extra.roughness ?? 1, metalness: extra.metalness ?? 0,
          side: extra.side,
        });
        track(mat);
        return mat;
      } catch (e) { /* fall through */ }
    }
    return std(color, extra);
  }

  const mats = {
    gravelSet, asphaltSet, rockSet, grassSet, officeSet, sidewalkSet,
    soil: await pbrOr('gravel', gravelSet, PAL.soilA, [40, 40]),
    grass: await pbrOr('grass_wild', grassSet, PAL.grassA, [60, 60]),
    concrete: await pbrOr('sidewalk', sidewalkSet, PAL.concreteA, [8, 8], { roughness: 0.88 }),
    concreteDark: std(PAL.concreteB, { roughness: 0.9 }),
    asphalt: await pbrOr('asphalt', asphaltSet, PAL.asphalt, [20, 20], { roughness: 0.95 }),
    rock: await pbrOr('rock_cliff', rockSet, PAL.soilB, [6, 6]),
    brick: await pbrOr('facade_office', officeSet, PAL.brick, [4, 3], { roughness: 0.85 }),
    oxide: std(PAL.oxideA, { roughness: 0.78, metalness: 0.35 }),
    oxideDark: std(PAL.oxideB, { roughness: 0.82, metalness: 0.4 }),
    galv: std(PAL.galv, { roughness: 0.45, metalness: 0.75 }),
    warnRed: std(PAL.warnRed, { roughness: 0.7 }),
    warnYellow: std(PAL.warnYellow, { roughness: 0.7 }),
    water: std(PAL.water, { roughness: 0.18, metalness: 0.55 }),
    pad: track(new THREE.MeshStandardMaterial({
      color: 0x2a2824, emissive: 0x8A7A2A, emissiveIntensity: 0.55, side: THREE.DoubleSide,
    })),
  };
  return mats;
}

/** Helper: box mesh with collider. cy is bottom of box (Miami convention). */
export function addBox(ctx, mats, matKey, cx, cy, cz, sx, sy, sz, opts = {}) {
  const { root, track, addCollider } = ctx;
  const geo = track(new THREE.BoxGeometry(sx, sy, sz));
  const mesh = new THREE.Mesh(geo, mats[matKey] || mats.concrete);
  mesh.position.set(cx, cy + sy / 2, cz);
  if (opts.rotY) mesh.rotation.y = opts.rotY;
  mesh.castShadow = opts.cast !== false;
  mesh.receiveShadow = true;
  root.add(mesh);
  if (opts.collide !== false) addCollider(cx, cy, cz, sx, sy, sz);
  return mesh;
}

export function addCyl(ctx, mats, matKey, cx, cy, cz, rTop, rBot, h, opts = {}) {
  const { root, track, addCollider } = ctx;
  const seg = opts.seg || 20;
  const geo = track(new THREE.CylinderGeometry(rTop, rBot, h, seg));
  const mesh = new THREE.Mesh(geo, mats[matKey] || mats.concrete);
  mesh.position.set(cx, cy + h / 2, cz);
  mesh.castShadow = opts.cast !== false;
  mesh.receiveShadow = true;
  root.add(mesh);
  if (opts.collide !== false) {
    const d = Math.max(rTop, rBot) * 2;
    addCollider(cx, cy, cz, d, h, d);
  }
  return mesh;
}
