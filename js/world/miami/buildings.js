import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CITY_Y } from './constants.js';
import { windowTexture } from './textures.js';
import { facadeUV } from './geo.js';

/**
 * Art-deco + glass skyline + cheap backdrop city.
 * Returns towerData + glass material state needed by helipads / dressing.
 */
export function buildSkyline(ctx) {
  const { root, track, addCollider, rng, rng3, glassSet, facadeDaySet } = ctx;
  // winTexA/B consume main-rng draws — always create both to preserve the stream
  // (winTexB is only rendered in the no-facade fallback).
  const winTexA = track(windowTexture(rng, 0.5));
  const winTexB = track(windowTexture(rng, 0.65, 0.4));
  const decoCols = [0xf2b8c6, 0x7fd4c1, 0xf5e9d0, 0xffb385, 0xc3b4e6];

  // Facade physical calibration (verified against the albedo images):
  //   facade_glass = 28 window columns x 18 floor bands per tile
  //     → at 1.5 m windows / 3.2 m floors one tile spans 42 m x 57.6 m.
  //   facade_day   = 15 panels x 10 floors, square tile
  //     → 32 m x 32 m keeps the source aspect exactly (2.13 m panels, 3.2 m floors).
  // Every tower maps facades at these constant physical scales via facadeUV(),
  // with a per-tower random UV offset so neighbours never repeat in sync.
  const GLASS_TILE_U = 28 * 1.5, GLASS_TILE_V = 18 * 3.2;
  const DAY_TILE_U = 27, DAY_TILE_V = 32;   // 1.8 m panels — reads as windows, not glass blocks
  const hasGlassTex = !!glassSet.map;
  let glassMat;
  if (hasGlassTex) {
    glassMat = track(new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1,                      // rough.jpg governs
      metalness: 0.12,
      map: glassSet.map,
      normalMap: glassSet.normalMap || null,
      roughnessMap: glassSet.roughnessMap || null,
      emissive: 0xffffff,
      emissiveMap: glassSet.emissiveMap || glassSet.map,
      emissiveIntensity: glassSet.emissiveMap ? 1.1 : 0.6,   // lit night windows
    }));
  } else {
    glassMat = track(new THREE.MeshStandardMaterial({
      color: 0x8fb8c9, roughness: 0.12, metalness: 0.92,
      emissiveMap: winTexB, emissive: 0xffffff, emissiveIntensity: 0.85,
    }));
  }
  const towerGroup = new THREE.Group();

  function addTower(x, z, w, h, d, style) {
    // per-tower UV offset (rng3 — never the layout stream)
    const offU = rng3(), offV = rng3();
    if (style === 'deco') {
      const color = decoCols[(rng() * decoCols.length) | 0];
      const mat = track(new THREE.MeshStandardMaterial({
        color, roughness: 0.75,
        emissiveMap: winTexA, emissive: 0xffffff, emissiveIntensity: 0.55,
      }));
      // pastel-tinted facade_day overlay when present, mapped at true window
      // scale; emissive follows the same texture so day/night grids agree
      if (facadeDaySet.map) {
        mat.color.lerp(new THREE.Color(0xffffff), 0.35);   // softer pastel, less "colored glass block"
        mat.map = facadeDaySet.map;
        if (facadeDaySet.normalMap) {
          mat.normalMap = facadeDaySet.normalMap;
          mat.normalScale.set(0.35, 0.35);                 // tame the panel bevel
        }
        if (facadeDaySet.roughnessMap) mat.roughnessMap = facadeDaySet.roughnessMap;
        mat.emissiveMap = facadeDaySet.map;
        mat.emissive = new THREE.Color(0xffe6bb);
        mat.emissiveIntensity = 0.3;
      }
      let y = CITY_Y;
      const tiers = 2 + ((rng() * 2) | 0);
      let tw = w, td = d;
      for (let t = 0; t < tiers; t++) {
        const th = h * (t === 0 ? 0.55 : 0.45 / (tiers - 1));
        const geo = track(new THREE.BoxGeometry(tw, th, td));
        if (facadeDaySet.map) {
          facadeUV(geo, tw, th, td, DAY_TILE_U, DAY_TILE_V, offU, offV);
        } else {
          const uv = geo.attributes.uv;
          for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(1, tw / 14), uv.getY(i) * Math.max(1, th / 26));
        }
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y + th / 2, z);
        mesh.castShadow = true;
        towerGroup.add(mesh);
        y += th;
        tw *= 0.72; td *= 0.72;
      }
      // parapet cylinder
      const capGeo = track(new THREE.CylinderGeometry(Math.min(tw, td) * 0.4, Math.min(tw, td) * 0.42, 3.5, 10));
      if (facadeDaySet.map) {
        const uv = capGeo.attributes.uv;
        const su = (Math.PI * Math.min(tw, td) * 0.8) / DAY_TILE_U, sv = 3.5 / DAY_TILE_V;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su + offU, uv.getY(i) * sv + offV);
      }
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
      const su = hasGlassTex ? (Math.PI * w) / GLASS_TILE_U : Math.max(1, (Math.PI * w) / 16);
      const sv = hasGlassTex ? h / GLASS_TILE_V : Math.max(1, h / 26);
      const ou = hasGlassTex ? offU : 0, ov = hasGlassTex ? offV : 0;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su + ou, uv.getY(i) * sv + ov);
      const mesh = new THREE.Mesh(geo, glassMat);
      mesh.position.set(x, CITY_Y + h / 2, z);
      mesh.castShadow = true;
      towerGroup.add(mesh);
      d = w;
    } else {
      const geo = track(new THREE.BoxGeometry(w, h, d));
      if (hasGlassTex) {
        facadeUV(geo, w, h, d, GLASS_TILE_U, GLASS_TILE_V, offU, offV);
      } else {
        const uv = geo.attributes.uv;
        const su = Math.max(1, w / 14), sv = Math.max(1, h / 26);
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
      }
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
  return { towerData, glassMat, hasGlassTex, GLASS_TILE_U, GLASS_TILE_V };
}

/** Helipad towers at the skyline flanks. Appends to towerData. */
export function buildHelipads(ctx, sky) {
  const { root, track, addCollider, rng, rng3 } = ctx;
  const { towerData, glassMat, hasGlassTex, GLASS_TILE_U, GLASS_TILE_V } = sky;
  for (const [hx, hz] of [[430, 70], [-430, 100]]) {
    const h = 45 + rng() * 20;
    const geo = track(new THREE.BoxGeometry(16, h, 16));
    if (hasGlassTex) {
      facadeUV(geo, 16, h, 16, GLASS_TILE_U, GLASS_TILE_V, rng3(), rng3());
    } else {
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * (h / 26));
    }
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
}
