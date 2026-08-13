import * as THREE from 'three';
import { assetLib } from '../../core/assets.js';
import { PAL } from './constants.js';

/** Ensure aoMap UV channel exists (three.js expects uv2 for AO). */
export function setAoUVs(geo) {
  if (!geo.attributes.uv) return;
  if (!geo.attributes.uv2) geo.setAttribute('uv2', geo.attributes.uv);
}

/**
 * Shared industrial materials — Desi enrichment + polish v2.
 * Larger UV tiles > sharp normals (kill FPV crawl). Shared mat pool only.
 */
export async function buildMaterials(track) {
  const [
    gravelSet, asphaltSet, rockSet, grassSet, officeSet, sidewalkSet, rockMacroSet,
  ] = await Promise.all([
    assetLib.textureSet('gravel'),
    assetLib.textureSet('asphalt'),
    assetLib.textureSet('rock_cliff'),
    assetLib.textureSet('grass_wild'),
    assetLib.textureSet('facade_office'),
    assetLib.textureSet('sidewalk'),
    assetLib.textureSet('rock_macro'),
  ]);

  const std = (color, opts = {}) => track(new THREE.MeshStandardMaterial({
    color, roughness: opts.roughness ?? 0.92, metalness: opts.metalness ?? 0,
    side: opts.side ?? THREE.FrontSide,
    emissive: opts.emissive, emissiveIntensity: opts.emissiveIntensity,
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

  // Tower shells: ~8–10 m/tile → moderate repeat on sidewalk scan
  const concreteTower = await pbrOr('sidewalk', sidewalkSet, PAL.concreteA, [1.4, 1.4], {
    roughness: 0.82, metalness: 0.04,
  });
  const concretePad = await pbrOr('sidewalk', sidewalkSet, PAL.concreteB, [4, 4], {
    roughness: 0.92, metalness: 0,
  });
  const concreteFine = await pbrOr('sidewalk', sidewalkSet, PAL.concreteA, [3.5, 3.5], {
    roughness: 0.85, metalness: 0.02,
  });

  const mats = {
    gravelSet, asphaltSet, rockSet, grassSet, officeSet, sidewalkSet, rockMacroSet,
    // Prairie macro 12–20 m tiles (larger repeat numbers = smaller tiles on world plane
    // — grass plane sets own repeat in terrain; these are for props)
    soil: await pbrOr('gravel', gravelSet, PAL.soilA, [14, 14]),
    grass: await pbrOr('grass_wild', grassSet, PAL.grassA, [12, 12]),
    concrete: concreteTower, // alias — tower shells / legacy keys
    concreteTower,
    concretePad,
    concreteFine,
    concreteDark: std(PAL.concreteB, { roughness: 0.9 }),
    voidDark: std(PAL.voidDark ?? 0x1A1816, { roughness: 0.95 }),
    asphalt: await pbrOr('asphalt', asphaltSet, PAL.asphalt, [10, 10], { roughness: 0.95 }),
    rock: await pbrOr('rock_cliff', rockSet, PAL.soilB, [6, 6]),
    rockMacro: await pbrOr('rock_macro', rockMacroSet, PAL.soilB, [4, 4], { roughness: 0.9 }),
    brick: await pbrOr('facade_office', officeSet, PAL.brick, [3, 2], { roughness: 0.85 }),
    oxide: std(PAL.oxideA, { roughness: 0.8, metalness: 0.32 }),
    oxideDark: std(PAL.oxideB, { roughness: 0.85, metalness: 0.38 }),
    galv: std(PAL.galv, { roughness: 0.42, metalness: 0.78 }),
    steel: std(0x8A9098, { roughness: 0.4, metalness: 0.8 }),
    rust: std(PAL.rustHot ?? PAL.rust ?? 0x8B4513, { roughness: 0.9, metalness: 0.15 }),
    rustHot: std(PAL.rustHot ?? 0x8B4513, { roughness: 0.9, metalness: 0.15 }),
    rustCool: std(PAL.rustCool ?? 0x5C4033, { roughness: 0.92, metalness: 0.12 }),
    warnRed: std(PAL.warnRed, { roughness: 0.88 }), // faded documentary
    warnYellow: std(PAL.warnYellow, { roughness: 0.88 }),
    hazardStripe: std(0x7A6A28, { roughness: 0.8, metalness: 0.08 }), // desaturated
    water: std(PAL.water, { roughness: 0.12, metalness: 0.55 }),
    moss: std(PAL.mossA ?? 0x3F4A32, { roughness: 0.95 }),
    mossDark: std(PAL.mossB ?? 0x2C3524, { roughness: 0.96 }),
    overgrow: std(PAL.overgrowA ?? 0x5A6340, { roughness: 0.93 }),
    overgrowDark: std(PAL.overgrowB ?? 0x4A5238, { roughness: 0.94 }),
    poisonGrass: std(PAL.poisonGrass ?? 0x6B7054, { roughness: 0.92 }),
    carBodyA: std(PAL.carBodyA ?? 0x4A5560, { roughness: 0.72, metalness: 0.35 }),
    carBodyB: std(PAL.carBodyB ?? 0x5C4038, { roughness: 0.78, metalness: 0.28 }),
    carBodyC: std(PAL.carBodyC ?? 0x3E3E38, { roughness: 0.8, metalness: 0.3 }),
    glassDead: std(PAL.glassDead ?? 0x1C2220, { roughness: 0.35, metalness: 0.55 }),
    mountainFar: std(PAL.mountainFar ?? 0x6A7380, { roughness: 0.95 }),
    mountainNear: std(PAL.mountainNear ?? 0x5C6358, { roughness: 0.93 }),
    pad: track(new THREE.MeshStandardMaterial({
      color: 0x2a2824, emissive: PAL.beaconAmber ?? 0xC4A35A, emissiveIntensity: 0.55, side: THREE.DoubleSide,
    })),
    // Filled by nightLights.js — mats + PointLights
    nightLights: [],
    beacon: [],
    nightEmit: [],
    nightPointLights: [],
  };
  return mats;
}

/** Cap anisotropy on large ground/apron planes (anti-shimmer). */
export function capAnisotropy(mat, max = 4) {
  if (!mat) return;
  for (const key of ['map', 'normalMap', 'roughnessMap', 'aoMap', 'metalnessMap']) {
    const tex = mat[key];
    if (tex && 'anisotropy' in tex) tex.anisotropy = Math.min(tex.anisotropy || 1, max);
  }
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
