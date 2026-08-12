import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CITY_Y, WHEEL_X, GAP_X, XS_HALF, XS_Z0, XS_Z1, stripY, inReserved,
} from './constants.js';
import { windowTexture, decoFacadeTextures, setAoUVs } from './textures.js';
import { facadeUV, colorFill, cBox, cCyl } from './geo.js';

// Deterministic 2D hash — used where a per-tower choice must NOT consume a
// draw from any layout stream (facade variant picking).
function hash01(a, b) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2545f491);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

/** Balcony unit: slab + glass parapet + railing. Origin at the wall face,
 *  extends +z outward; place with rotY per building face. */
function buildBalconyGeo() {
  const conc = 0xe3e7ea, rail = 0x252c33, glass = 0x9fc0cd;
  const G = [
    cBox(3.15, 0.14, 1.2, conc, 0, 0.07, 0.6),
    cBox(3.15, 0.06, 0.05, rail, 0, 1.06, 1.17),
    cBox(0.05, 0.06, 1.16, rail, -1.55, 1.06, 0.58),
    cBox(0.05, 0.06, 1.16, rail, 1.55, 1.06, 0.58),
    cBox(3.02, 0.78, 0.035, glass, 0, 0.6, 1.165),
    cBox(0.035, 0.78, 1.1, glass, -1.53, 0.6, 0.585),
    cBox(0.035, 0.78, 1.1, glass, 1.53, 0.6, 0.585),
  ];
  for (const px of [-1.5, -0.75, 0, 0.75, 1.5]) G.push(cBox(0.05, 0.95, 0.05, rail, px, 0.6, 1.165));
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

/** Rooftop clutter kit: AC pair + water tank + timber pergola, merged into one
 *  instanced geometry. Origin at roof level. */
function buildRooftopKitGeo() {
  const G = [];
  G.push(cBox(1.7, 0.95, 1.25, 0x9ba3ab, -2.1, 0.48, -1.1));
  G.push(cCyl(0.52, 0.52, 0.06, 12, 0x3c4249, -2.1, 0.98, -1.1));
  G.push(cBox(1.25, 0.8, 1.05, 0x8d959d, -0.55, 0.4, -1.2));
  G.push(cCyl(0.4, 0.4, 0.05, 12, 0x3c4249, -0.55, 0.83, -1.2));
  G.push(cCyl(0.95, 0.95, 1.8, 12, 0xcac3b2, 1.9, 1.32, -0.8));
  G.push(cCyl(0.02, 0.98, 0.55, 12, 0xb4ac99, 1.9, 2.49, -0.8));
  for (const [lx, lz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) {
    G.push(cBox(0.14, 0.45, 0.14, 0x6d747c, 1.9 + lx, 0.22, -0.8 + lz));
  }
  for (const [px, pz] of [[-1.7, 1.2], [1.7, 1.2], [-1.7, 2.9], [1.7, 2.9]]) {
    G.push(cBox(0.13, 2.15, 0.13, 0xb99a6f, px, 1.07, pz));
  }
  G.push(cBox(3.7, 0.09, 0.14, 0xb99a6f, 0, 2.2, 1.2));
  G.push(cBox(3.7, 0.09, 0.14, 0xb99a6f, 0, 2.2, 2.9));
  for (let i = 0; i < 7; i++) G.push(cBox(0.09, 0.07, 1.95, 0xcaa87a, -1.62 + i * 0.54, 2.28, 2.05));
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

/**
 * Art-deco + glass skyline + cheap backdrop city.
 * Returns towerData + facade material state needed by helipads / street level.
 */
export function buildSkyline(ctx) {
  const {
    root, track, addCollider, colliders, rng, rng3, rng4,
    glassSet, glassDaySet, officeSet,
  } = ctx;
  // winTexA/B consume main-rng draws — always create both to preserve the stream
  // (winTexB is only rendered in the no-facade fallback).
  const winTexA = track(windowTexture(rng, 0.5));
  const winTexB = track(windowTexture(rng, 0.65, 0.4));
  // +2 new tints (white stucco, coral): same single main-rng draw indexes a
  // longer palette — a deterministic REMAP of the drawn value, not a new draw.
  const decoCols = [0xf2b8c6, 0x7fd4c1, 0xf5e9d0, 0xffb385, 0xc3b4e6, 0xf7f4ec, 0xff8a70];

  // Facade physical calibration (counted off the albedo images):
  //   facade_glass      = 28 window columns x 18 floor bands per tile
  //                       → 1.5 m windows / 3.2 m floors = 42 m x 57.6 m.
  //   facade_glass_day  = 14 columns x 8 floor bands of curtain-wall glazing
  //                       → 1.75 m panes / 3.3 m floors = 24.5 m x 26.4 m.
  //   facade_office     = 6 bays x 6 floors, square tile
  //                       → 3.6 m bays / 3.6 m floors = 21.6 m square.
  //   deco sheet        = authored here, 4 bays x 4 floors → 14.4 m x 14 m.
  // Every tower maps facades at these constant physical scales via facadeUV(),
  // with a per-tower random UV offset so neighbours never repeat in sync.
  const hasGlassDay = !!glassDaySet.map;
  const GLASS_TILE_U = hasGlassDay ? 14 * 1.75 : 28 * 1.5;
  const GLASS_TILE_V = hasGlassDay ? 8 * 3.3 : 18 * 3.2;
  const OFFICE_TILE_U = 21.6, OFFICE_TILE_V = 21.6;
  // authored deco sheet: 4 bays x 4 floors per tile at 3.6 m bays / 3.5 m floors
  const decoTex = decoFacadeTextures(4, 4);
  track(decoTex.albedo); track(decoTex.emissive);
  const DECO_TILE_U = 14.4, DECO_TILE_V = 14;
  const hasGlassTex = !!glassSet.map || hasGlassDay;
  const regDN = ctx.regDN;

  // ---- glass curtain wall ----
  // Daylight albedo comes from facade_glass_day (a DAY photo). facade_glass is
  // a NIGHT photo, so it is demoted to the emissive map only: its lit-window
  // grid re-tiles onto the same physical pane size and fades in after dusk.
  let glassMat;
  if (hasGlassDay) {
    let emi = null;
    if (glassSet.emissiveMap) {
      emi = track(glassSet.emissiveMap.clone());
      emi.wrapS = emi.wrapT = THREE.RepeatWrapping;
      emi.repeat.set(0.5, 8 / 18);        // 28x18 lit-window grid → 14x8 panes
      emi.needsUpdate = true;
    }
    // The day scan is a shaded photograph (mean albedo ~0.19 linear); left raw
    // it renders as dark bronze glass in full sun. Lift it with a >1 colour
    // multiplier and let the near-mirror roughness pull real sky into the
    // panes — that is what makes a curtain wall read as glass at noon.
    glassMat = regDN(track(new THREE.MeshStandardMaterial({
      color: new THREE.Color(1.16, 1.3, 1.46),
      roughness: 1,                      // rough.jpg governs (mean ~0.10)
      metalness: glassDaySet.metalnessMap ? 1 : 0.7,
      metalnessMap: glassDaySet.metalnessMap || null,
      map: glassDaySet.map,
      normalMap: glassDaySet.normalMap || null,
      roughnessMap: glassDaySet.roughnessMap || null,
      envMapIntensity: 2.4,
      emissive: 0xffe9c4,
      emissiveMap: emi || glassDaySet.map,
      emissiveIntensity: 0,
    })), 0.02, emi ? 1.25 : 0.35);
  } else if (glassSet.map) {
    glassMat = regDN(track(new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1,
      metalness: 0.12,
      map: glassSet.map,
      normalMap: glassSet.normalMap || null,
      roughnessMap: glassSet.roughnessMap || null,
      emissive: 0xffffff,
      emissiveMap: glassSet.emissiveMap || glassSet.map,
      emissiveIntensity: 1.1,
    })), 0.25, 1.1);
  } else {
    glassMat = regDN(track(new THREE.MeshStandardMaterial({
      color: 0x8fb8c9, roughness: 0.12, metalness: 0.92,
      emissiveMap: winTexB, emissive: 0xffffff, emissiveIntensity: 0.85,
    })), 0.1, 0.9);
  }

  // ---- second daytime variant: brick/window mid-rise ----
  let officeMat = null;
  if (officeSet.map) {
    officeMat = regDN(track(new THREE.MeshStandardMaterial({
      color: new THREE.Color(1.34, 1.3, 1.26),   // same daylight lift, warmer
      roughness: 1,
      // the scan's metal mask covers the spandrel glass AND some brick; scale
      // it back so masonry stays matte instead of reflecting like sheet metal
      metalness: officeSet.metalnessMap ? 0.55 : 0.05,
      metalnessMap: officeSet.metalnessMap || null,
      map: officeSet.map,
      normalMap: officeSet.normalMap || null,
      roughnessMap: officeSet.roughnessMap || null,
      aoMap: officeSet.aoMap || null,
      envMapIntensity: 1.05,
      emissive: 0xffdfae,
      emissiveMap: officeSet.emissiveMap || officeSet.map,
      emissiveIntensity: 0,
    })), 0.02, officeSet.emissiveMap ? 1.15 : 0.3);
  }

  const towerGroup = new THREE.Group();
  towerGroup.name = 'towers';
  const towerData = [];

  function addTower(x, z, w, h, d, style) {
    // per-tower UV offset (rng3 — never the layout stream)
    const offU = rng3(), offV = rng3();
    const entry = { x, z, w, h, d, style, mv: 0, meshes: [], collider: null };
    const add = (mesh) => { towerGroup.add(mesh); entry.meshes.push(mesh); };

    if (style === 'deco') {
      const color = decoCols[(rng() * decoCols.length) | 0];
      const mat = track(new THREE.MeshStandardMaterial({
        color, roughness: 0.75,
        emissiveMap: winTexA, emissive: 0xffffff, emissiveIntensity: 0.55,
      }));
      // Art-deco towers wear the authored stucco sheet, not a facade photo:
      // every photographic scan on disk is blue-grey curtain wall, and using
      // one as the base map drags the pastel to mud (the pastel IS the point).
      // The sheet is white-based so `color` tints it directly, and its twin
      // emissive canvas lights the same openings after dark.
      mat.color.lerp(new THREE.Color(0xffffff), 0.1);
      mat.map = decoTex.albedo;
      mat.emissiveMap = decoTex.emissive;
      mat.emissive = new THREE.Color(0xfff0d0);
      // stucco reads by daylight, windows glow after dark
      regDN(mat, 0.0, 1.35);
      let y = CITY_Y;
      const tiers = 2 + ((rng() * 2) | 0);
      let tw = w, td = d;
      for (let t = 0; t < tiers; t++) {
        const th = h * (t === 0 ? 0.55 : 0.45 / (tiers - 1));
        const geo = track(new THREE.BoxGeometry(tw, th, td));
        facadeUV(geo, tw, th, td, DECO_TILE_U, DECO_TILE_V, offU, offV);
        setAoUVs(geo);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y + th / 2, z);
        mesh.castShadow = true;
        add(mesh);
        y += th;
        tw *= 0.72; td *= 0.72;
      }
      // parapet cylinder
      const capGeo = track(new THREE.CylinderGeometry(Math.min(tw, td) * 0.4, Math.min(tw, td) * 0.42, 3.5, 10));
      {
        const uv = capGeo.attributes.uv;
        const su = (Math.PI * Math.min(tw, td) * 0.8) / DECO_TILE_U, sv = 3.5 / DECO_TILE_V;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su + offU, uv.getY(i) * sv + offV);
      }
      setAoUVs(capGeo);
      const cap = new THREE.Mesh(capGeo, mat);
      cap.position.set(x, y + 1.7, z);
      add(cap);
      // neon accent strip
      if (rng() < 0.6) {
        const neonGeo = track(new THREE.BoxGeometry(w * 1.02, 0.5, 0.3));
        const neonMat = regDN(track(new THREE.MeshStandardMaterial({
          color: 0x111111,
          emissive: rng() < 0.5 ? 0x29d3ff : 0xff5c8a,
          emissiveIntensity: 3.2,
        })), 0.9, 3.6);   // neon tubes wash out in full sun, blaze at night
        const neon = new THREE.Mesh(neonGeo, neonMat);
        neon.position.set(x, CITY_Y + h * 0.5, z - d / 2 - 0.2);
        add(neon);
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
      add(mesh);
      d = w;
      entry.d = w;
    } else {
      // Facade variant. Picked from a position hash, NOT a stream draw: mid-rise
      // towers wear the brick/window office sheet so the skyline is not one
      // material. Tall towers stay curtain wall.
      const useOffice = !!officeMat && h < 108 && hash01((x * 7) | 0, (z * 13) | 0) < 0.45;
      const mat = useOffice ? officeMat : glassMat;
      const TU = useOffice ? OFFICE_TILE_U : GLASS_TILE_U;
      const TV = useOffice ? OFFICE_TILE_V : GLASS_TILE_V;
      const textured = useOffice || hasGlassTex;
      // Massing variants (rng4) kill the single-slab silhouette on ~40% of the
      // mid/back-row glass towers. VISUAL ONLY — the collider AABB below stays
      // the legacy full box, and no main-rng draws are added or removed.
      const mv = z > 100 && rng4() < 0.42 ? 1 + ((rng4() * 3) | 0) : 0;
      entry.mv = mv;
      const boxes = [];
      const addBox = (bw, bh, bd, bx, by, bz, ry = 0) => {
        const g = new THREE.BoxGeometry(bw, bh, bd);
        if (textured) {
          facadeUV(g, bw, bh, bd, TU, TV, offU + boxes.length * 0.37, offV + boxes.length * 0.21);
        } else {
          const uv = g.attributes.uv;
          const su = Math.max(1, bw / 14), sv = Math.max(1, bh / 26);
          for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
        }
        setAoUVs(g);
        if (ry) g.rotateY(ry);
        g.translate(bx, by, bz);
        boxes.push(g);
      };
      if (mv === 1) {
        // setback tiers (all inside the legacy footprint)
        addBox(w, h * 0.6, d, 0, h * 0.3, 0);
        addBox(w * 0.78, h * 0.26, d * 0.78, 0, h * 0.73, 0);
        addBox(w * 0.55, h * 0.14, d * 0.55, 0, h * 0.93, 0);
      } else if (mv === 2) {
        // L-wing: tall slab + lower wing sharing the same footprint
        addBox(w * 0.58, h, d, -w * 0.21, h / 2, 0);
        addBox(w * 0.42, h * 0.62, d * 0.86, w * 0.29, h * 0.31, -d * 0.07);
      } else if (mv === 3) {
        // chamfered street corners: 45-deg glass fins over the front edges
        addBox(w, h, d, 0, h / 2, 0);
        addBox(1.7, h * 0.995, 1.7, -(w / 2 - 0.55), h * 0.4975, -(d / 2 - 0.55), Math.PI / 4);
        addBox(1.7, h * 0.995, 1.7, (w / 2 - 0.55), h * 0.4975, -(d / 2 - 0.55), Math.PI / 4);
      } else {
        addBox(w, h, d, 0, h / 2, 0);
      }
      let geo;
      if (boxes.length > 1) {
        geo = track(mergeGeometries(boxes));
        boxes.forEach((g) => g.dispose());
      } else {
        geo = track(boxes[0]);
      }
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, CITY_Y, z);
      mesh.castShadow = true;
      add(mesh);
      // roof details
      if (rng() < 0.5) {
        const acGeo = track(new THREE.BoxGeometry(w * 0.25, 2.5, d * 0.25));
        const acMat = track(new THREE.MeshStandardMaterial({ color: 0x6d747c, roughness: 0.9 }));
        const ac = new THREE.Mesh(acGeo, acMat);
        ac.position.set(x + w * 0.2, CITY_Y + h + 1.25, z);
        add(ac);
      }
      if (rng() < 0.4) {
        const mastGeo = track(new THREE.CylinderGeometry(0.15, 0.15, 14, 5));
        const mastMat = track(new THREE.MeshStandardMaterial({ color: 0xaab0b8 }));
        const mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(x, CITY_Y + h + 7, z);
        add(mast);
        const beacon = new THREE.Mesh(
          track(new THREE.SphereGeometry(0.4, 6, 5)),
          track(new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff2222, emissiveIntensity: 4 }))
        );
        beacon.position.set(x, CITY_Y + h + 14, z);
        add(beacon);
      }
    }
    addCollider(x, CITY_Y, z, w, h + 4, d);
    entry.collider = colliders[colliders.length - 1];
    towerData.push(entry);
  }

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
    const mat = regDN(track(new THREE.MeshStandardMaterial({
      color: 0x3d4653, roughness: 0.9, emissive: 0x2a3444, emissiveIntensity: 0.35,
    })), 0.05, 0.5);
    root.add(new THREE.Mesh(merged, mat));
  }
  return {
    towerData, towerGroup, glassMat, officeMat, hasGlassTex,
    GLASS_TILE_U, GLASS_TILE_V,
  };
}

/**
 * Remove the procedural towers standing on a hero-landmark block. The rng
 * stream is untouched — the towers are drawn exactly as before, then their
 * meshes are detached and their colliders dropped. Geometry stays tracked by
 * the disposables list (it never reaches the GPU, so nothing is wasted).
 */
export function cullReserved(ctx, sky) {
  const { colliders } = ctx;
  const doomed = new Set();
  const keep = [];
  for (const t of sky.towerData) {
    if (inReserved(t.x, t.z)) {
      for (const m of t.meshes) if (m.parent) m.parent.remove(m);
      if (t.collider) doomed.add(t.collider);
    } else {
      keep.push(t);
    }
  }
  if (doomed.size) {
    for (let i = colliders.length - 1; i >= 0; i--) {
      if (doomed.has(colliders[i])) colliders.splice(i, 1);
    }
  }
  sky.towerData.length = 0;
  for (const t of keep) sky.towerData.push(t);
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
    setAoUVs(geo);
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
    towerData.push({ x: hx, z: hz, w: 16, h, d: 16, style: 'glass', mv: 0, meshes: [mesh, pad, ring], collider: null });
  }
}

/**
 * Street level: storefront bands with awnings and recessed entries, hotel
 * entrance canopies, stone podiums with lobby glazing, city blocks behind the
 * front row, balconies, rooftop clutter.
 *
 * All randomness on rng4. Returns the landscaping spot lists for dressing.js
 * (the planting is materialised there so the vegetation lives in one module).
 */
export function buildStreetLevel(ctx, sky, street) {
  const { root, track, addCollider, rng4, glassPanelGeos, palmPlacements } = ctx;
  const { towerData } = sky;
  const { shelterX } = street;

  const frontTowers = towerData.filter((t) => t.z < 100);
  const shopOpaque = [];       // vertex-coloured concrete/awnings/doors/steps/planters
  const shopGlassG = [];       // dark reflective glazing
  const shopGlow = [];         // unlit (MeshBasic) shop interiors + sign faces
  const hedgeSpots = [];       // {x, y(center), z, sx, sy, sz, ry}
  const mulchSpots = [];
  const flowerSpots = [];
  const lawnSpots = [];
  const lotSpots = [];
  const palmSpots = [];
  const grateSpots = [];
  const entranceShrubSpots = [];
  const AWNING_COLS = [0xff6f61, 0x2fb5a3, 0xffc35c, 0xf25c8a, 0x3d6fb0, 0xf2eee2];
  const FLOWER_COLS = [0xff5d73, 0xff8fa3, 0xffd166, 0xf8f4ec, 0xff7a52];
  const SIGN_COLS = [0x1f6f8b, 0xb33a3a, 0x2f7d4f, 0x2a3550, 0xb9762a, 0x6d3b6e];
  const INTERIOR_COLS = [0x594330, 0x4c3b36, 0x5c5236, 0x3d474e];
  const signLit = (hex) => new THREE.Color(hex).lerp(new THREE.Color(0xffffff), 0.62).getHex();
  const shopInterior = (r) => INTERIOR_COLS[(r * INTERIOR_COLS.length) | 0];
  // Large sunlit surfaces clip to white under ACES at this exposure, so every
  // masonry tone here sits around 0.2–0.3 sRGB — that lands as light grey
  // concrete in the sun and still has tone left in the shade.
  const CONC = 0x6f6a60, CONC2 = 0x5f5a52, STEP = 0x6a655c, DOORC = 0x151d24, POSTC = 0x3a4148;

  const addBed = (bx, bz) => {
    const by = stripY(bz);
    mulchSpots.push({ x: bx, y: by + 0.11, z: bz, ry: rng4() * Math.PI });
    const n = 14 + ((rng4() * 6) | 0);
    for (let i = 0; i < n; i++) {
      flowerSpots.push({
        x: bx + (rng4() - 0.5) * 1.3,
        y: by + 0.27 + rng4() * 0.1,
        z: bz + (rng4() - 0.5) * 0.9,
        hex: FLOWER_COLS[(rng4() * FLOWER_COLS.length) | 0],
      });
    }
  };
  const addHedge = (hx, hz, sx, sy, szc, base) => {
    hedgeSpots.push({
      x: hx, z: hz, sx, sy, sz: szc, ry: 0,
      y: (base === undefined ? stripY(hz) : base) + 0.4 * sy,
    });
  };

  let planterColliders = 0;
  for (let ti = 0; ti < frontTowers.length; ti++) {
    const t = frontTowers[ti];
    const frontZ = t.z - t.d / 2;
    const isShop = rng4() < 0.62;
    t.hasShop = isShop;
    const awnCol = AWNING_COLS[(rng4() * AWNING_COLS.length) | 0];
    const bandW = Math.min(t.w, 46);

    if (isShop) {
      // ---- 4.6 m storefront band: stone plinth, mullioned glazing, lit
      // interior, painted sign fascia, striped canvas awning with valance ----
      const nBays = Math.max(3, Math.round(bandW / 5.2));
      const bayW = bandW / nBays;
      const entBay = nBays >> 1;
      const signCol = SIGN_COLS[(rng4() * SIGN_COLS.length) | 0];
      const BAND_H = 4.6, GL_BOT = 0.52, GL_TOP = 3.06;
      // cornice + painted sign fascia, both clear of the awnings below
      shopOpaque.push(cBox(bandW + 0.7, 0.3, 0.78, CONC2, t.x, CITY_Y + BAND_H - 0.15, frontZ - 0.16));
      shopOpaque.push(cBox(bandW + 0.2, 0.92, 0.5, signCol, t.x, CITY_Y + BAND_H - 0.76, frontZ - 0.16));
      shopGlow.push(colorFill(new THREE.BoxGeometry(bandW - 1.4, 0.5, 0.06)
        .translate(t.x, CITY_Y + BAND_H - 0.76, frontZ - 0.42), signLit(signCol)));
      // column piers between bays
      for (let b = 0; b <= nBays; b++) {
        shopOpaque.push(cBox(0.46, BAND_H, 0.72, CONC, t.x - bandW / 2 + b * bayW, CITY_Y + BAND_H / 2, frontZ - 0.12));
      }
      for (let b = 0; b < nBays; b++) {
        const bx = t.x - bandW / 2 + (b + 0.5) * bayW;
        const inner = bayW - 0.62;
        if (b === entBay) {
          // recessed entry: dark reveal, twin glass doors, push bars, step
          shopOpaque.push(cBox(inner, 3.35, 0.1, DOORC, bx, CITY_Y + 1.67, frontZ + 0.5));
          shopGlow.push(colorFill(new THREE.BoxGeometry(inner - 0.2, 2.9, 0.05)
            .translate(bx, CITY_Y + 1.62, frontZ + 0.46), 0x2a2118));
          for (const s of [-1, 1]) {
            shopGlassG.push(new THREE.BoxGeometry(1.02, 2.62, 0.09).translate(bx + s * 0.55, CITY_Y + 1.31, frontZ + 0.2));
            shopOpaque.push(cBox(0.07, 2.62, 0.11, 0x8d949a, bx + s * 1.06, CITY_Y + 1.31, frontZ + 0.2));
            shopOpaque.push(cBox(0.05, 0.9, 0.05, 0xc8ced3, bx + s * 0.16, CITY_Y + 1.15, frontZ + 0.14));
          }
          shopOpaque.push(cBox(inner + 0.2, 0.14, 0.06, 0x8d949a, bx, CITY_Y + 2.66, frontZ + 0.2));
          shopOpaque.push(cBox(Math.min(inner + 0.5, 3.6), 0.13, 0.95, STEP, bx, CITY_Y + 0.065, frontZ - 0.45));
        } else {
          // shopfront: dark stone bulkhead, full-height glazing, mullions
          shopOpaque.push(cBox(inner + 0.2, GL_BOT, 0.4, 0x5f6469, bx, CITY_Y + GL_BOT / 2, frontZ - 0.08));
          shopGlassG.push(new THREE.BoxGeometry(inner, GL_TOP - GL_BOT, 0.12)
            .translate(bx, CITY_Y + (GL_TOP + GL_BOT) / 2, frontZ - 0.04));
          // interior: warm dark room with a ceiling light band and a back wall
          shopGlow.push(colorFill(new THREE.BoxGeometry(inner, GL_TOP - GL_BOT - 0.1, 0.05)
            .translate(bx, CITY_Y + (GL_TOP + GL_BOT) / 2, frontZ + 0.42), shopInterior(rng4())));
          shopGlow.push(colorFill(new THREE.BoxGeometry(inner - 0.3, 0.26, 0.04)
            .translate(bx, CITY_Y + GL_TOP - 0.34, frontZ + 0.38), 0xffe7c0));
          for (const mx of [-inner / 6, inner / 6]) {
            shopOpaque.push(cBox(0.075, GL_TOP - GL_BOT, 0.16, 0x8b867c, bx + mx, CITY_Y + (GL_TOP + GL_BOT) / 2, frontZ - 0.06));
          }
          shopOpaque.push(cBox(inner, 0.09, 0.17, 0x8b867c, bx, CITY_Y + GL_TOP - 0.62, frontZ - 0.06));   // transom
        }
        // striped canvas awning with a hanging valance, tucked under the sign
        if ((b + ti) % 3 !== 2) {
          const depth = Math.min(1.75, frontZ - 51.35);   // never over the road band
          if (depth > 0.8) {
            const aw = bayW - 0.55;
            const slope = depth / Math.cos(0.4);
            const stripes = 5;
            const AY = 3.36;
            for (let s2 = 0; s2 < stripes; s2++) {
              const ag = new THREE.BoxGeometry(aw / stripes - 0.015, 0.05, slope);
              ag.rotateX(-0.4);
              ag.translate(bx - aw / 2 + (s2 + 0.5) * (aw / stripes), CITY_Y + AY, frontZ - depth / 2 - 0.16);
              shopOpaque.push(colorFill(ag, s2 % 2 ? awnCol : 0xefe6d2));
            }
            // hanging valance + tie-bars back to the wall
            for (let s2 = 0; s2 < stripes; s2++) {
              shopOpaque.push(cBox(aw / stripes - 0.015, 0.28, 0.045,
                s2 % 2 ? awnCol : 0xefe6d2,
                bx - aw / 2 + (s2 + 0.5) * (aw / stripes),
                CITY_Y + AY - 0.14 - 0.2 * depth, frontZ - depth - 0.16));
            }
            for (const s2 of [-1, 1]) {
              shopOpaque.push(cBox(0.04, 0.04, depth, 0x9aa1a7, bx + s2 * aw / 2, CITY_Y + AY + 0.14 - 0.1 * depth, frontZ - depth / 2 - 0.16));
            }
          }
        }
      }
      // projecting blade signs — the one shop cue that stays readable from
      // every angle (a flat fascia sign is hidden by its own awning from below)
      // reach is clamped so no sign ever crosses into the driving lanes
      const bladeReach = Math.min(1.51, frontZ - 51.2);
      for (let b = 1; bladeReach > 0.9 && b < nBays; b += 2) {
        const bx = t.x - bandW / 2 + b * bayW;
        const bladeCol = SIGN_COLS[(rng4() * SIGN_COLS.length) | 0];
        const by = CITY_Y + 3.95;
        const bz = frontZ - bladeReach + 0.56;
        shopOpaque.push(cBox(0.09, 0.09, bladeReach * 0.9, 0x2f353a, bx, by + 0.42, frontZ - bladeReach * 0.45));
        shopOpaque.push(cBox(0.14, 0.9, 1.12, bladeCol, bx, by, bz));
        for (const s2 of [-1, 1]) {
          shopGlow.push(colorFill(new THREE.BoxGeometry(0.05, 0.6, 0.86)
            .translate(bx + s2 * 0.09, by, bz), signLit(bladeCol)));
        }
      }
      // pavement cafe: two tables with chairs in front of every other shop
      if (ti % 2 === 0 && frontZ > 56) {
        for (const cs of [-1, 1]) {
          const cx = t.x + cs * (bandW * 0.28);
          const cz = frontZ - 2.5;
          shopOpaque.push(cCyl(0.04, 0.05, 0.72, 6, 0x4a5057, cx, CITY_Y + 0.36, cz));
          shopOpaque.push(cCyl(0.42, 0.42, 0.05, 12, 0xb8b3a6, cx, CITY_Y + 0.74, cz));
          shopOpaque.push(cCyl(0.3, 0.34, 0.03, 10, 0x4a5057, cx, CITY_Y + 0.02, cz));
          for (const ch of [-1, 1]) {
            const chx = cx + ch * 0.78, chz = cz + ch * 0.16;
            shopOpaque.push(cBox(0.42, 0.05, 0.42, 0x9d988c, chx, CITY_Y + 0.45, chz));
            shopOpaque.push(cBox(0.42, 0.46, 0.05, 0x9d988c, chx, CITY_Y + 0.68, chz + ch * 0.19));
            for (const lx of [-0.17, 0.17]) for (const lz of [-0.17, 0.17]) {
              shopOpaque.push(cBox(0.035, 0.45, 0.035, 0x5a6067, chx + lx, CITY_Y + 0.225, chz + lz));
            }
          }
        }
      }
    } else {
      // ---- hotel-style entrance canopy, sitting clear above the podium ----
      t.podiumH = 3.3 + rng4() * 1.3;
      const cy0 = CITY_Y + t.podiumH + 0.55;
      // canopy reach clamped so its leading edge stays out of the road band
      const depth = Math.max(0.9, Math.min(3.4, frontZ - 51.6));
      for (const s of [-1, 1]) {
        shopOpaque.push(cCyl(0.09, 0.11, t.podiumH + 0.55, 8, POSTC, t.x + s * 3.1, CITY_Y + (t.podiumH + 0.55) / 2, frontZ - depth + 0.35));
        shopOpaque.push(cCyl(0.2, 0.24, 0.16, 8, 0x8c9298, t.x + s * 3.1, CITY_Y + 0.08, frontZ - depth + 0.35));
      }
      glassPanelGeos.push(new THREE.BoxGeometry(7.4, 0.1, depth + 0.5).translate(t.x, cy0, frontZ - depth / 2 + 0.1));
      shopOpaque.push(cBox(7.6, 0.16, 0.16, POSTC, t.x, cy0 + 0.06, frontZ - depth - 0.13));
      shopOpaque.push(cBox(7.6, 0.14, 0.5, POSTC, t.x, cy0 + 0.05, frontZ - 0.2));
      shopOpaque.push(cBox(4.8, 0.16, 1.3, STEP, t.x, CITY_Y + 0.08, frontZ - 0.9));
      shopOpaque.push(cBox(5.6, 0.08, 0.8, STEP, t.x, CITY_Y + 0.04, frontZ - 1.85));
      // carpet strip under the canopy
      shopOpaque.push(cBox(5.2, 0.03, depth, 0x6d3a33, t.x, CITY_Y + 0.115, frontZ - depth / 2 - 0.3));
    }

    // planters flanking every doorway (colliders for the closest ones)
    for (const s of [-1, 1]) {
      const pxp = t.x + s * 2.75;
      const pzp = frontZ - 0.95;
      const py = stripY(pzp);
      shopOpaque.push(cBox(1.1, 0.62, 1.1, 0x8d877b, pxp, py + 0.31, pzp));
      shopOpaque.push(cBox(1.18, 0.09, 1.18, 0x7b756a, pxp, py + 0.6, pzp));
      addHedge(pxp, pzp, 0.58, 0.75, 0.62, py + 0.5);
      if (planterColliders < 16 && Math.abs(t.x) < 320) {
        addCollider(pxp, py, pzp, 1.2, 1.4, 1.2);
        planterColliders++;
      }
    }
    // flower beds flanking wider entrances
    if (bandW > 18) { addBed(t.x - 4.6, frontZ - 1.0); addBed(t.x + 4.6, frontZ - 1.0); }
    // hedge row along the facade (only where the front sits back from the strip)
    if (frontZ > 54.6) {
      for (let hx = -bandW / 2 + 1.3; hx <= bandW / 2 - 1.3; hx += 2.0) {
        if (Math.abs(hx) < 4.2) continue;   // entrance walkway
        addHedge(t.x + hx, frontZ - 1.35, 0.9 + rng4() * 0.3, 0.8 + rng4() * 0.35, 0.9, CITY_Y);
      }
    }
    // palm + shrub accents at every 3rd entrance
    if (ti % 3 === 0 && frontZ > 56.5) {
      for (const s of [-1, 1]) {
        palmSpots.push({ x: t.x + s * (4.5 + rng4() * 1.5), z: frontZ - 2.7 - rng4(), sc: 0.72 + rng4() * 0.2, ry: rng4() * Math.PI * 2 });
      }
    }
    for (const s of [-1, 1]) {
      const sxp = t.x + s * (bandW / 2 - 0.9);
      const szp = frontZ - 1.15;
      entranceShrubSpots.push({ x: sxp, y: stripY(szp), z: szp, scale: 0.65 + rng4() * 0.4, rotY: rng4() * Math.PI * 2 });
    }
  }

  // ---- planted beds along the promenade edge ----
  // Discrete beds (6–11 m) separated by paved gaps, each with a raised kerb,
  // a mulch bed and a broken hedge row. An unbroken hedge the length of the
  // map reads from the air as a green ribbon.
  {
    let x = -566;
    let bedIdx = 0;
    while (x < 566) {
      const bedLen = 6 + rng4() * 5;
      const gap = 2.6 + rng4() * 3.4;
      const cx = x + bedLen / 2;
      const clear =
        !GAP_X.some((c) => Math.abs(cx - c) < 14 + bedLen / 2) &&
        Math.abs(cx - shelterX) > 5 + bedLen / 2 &&
        Math.abs(cx - WHEEL_X) > 14 &&
        !frontTowers.some((t) => Math.abs(cx - t.x) < t.w / 2 + bedLen / 2 && (t.z - t.d / 2) < 56.6);
      if (clear) {
        const bz = 54.3;
        // kerb ring around the bed
        shopOpaque.push(cBox(bedLen, 0.19, 2.3, 0x89847a, cx, CITY_Y + 0.095, bz));
        mulchSpots.push({ x: cx, y: CITY_Y + 0.14, z: bz, ry: 0, sx: (bedLen - 0.3) / 1.55, sz: 1.85 });
        if (bedIdx % 3 === 1) {
          // flowering bed: dense colour clusters instead of clipped box hedge
          const n = 30 + ((rng4() * 16) | 0);
          for (let i = 0; i < n; i++) {
            flowerSpots.push({
              x: cx + (rng4() - 0.5) * (bedLen - 0.8),
              y: CITY_Y + 0.34 + rng4() * 0.14,
              z: bz + (rng4() - 0.5) * 1.7,
              hex: FLOWER_COLS[(rng4() * FLOWER_COLS.length) | 0],
            });
          }
          for (let hx = -bedLen / 2 + 1; hx <= bedLen / 2 - 1; hx += 2.6) {
            addHedge(cx + hx, bz - 0.72, 0.62 + rng4() * 0.16, 0.5 + rng4() * 0.16, 0.62, CITY_Y + 0.18);
          }
        } else {
          // individual clipped shrubs, never touching — a continuous run of
          // instances reads as one extruded green bar from the air
          for (let hx = -bedLen / 2 + 1.1; hx <= bedLen / 2 - 1.1; hx += 2.45) {
            if (rng4() < 0.1) continue;                        // gaps keep it organic
            const jz = (rng4() - 0.5) * 0.55;
            addHedge(cx + hx + (rng4() - 0.5) * 0.3, bz + jz,
                     0.6 + rng4() * 0.16, 0.66 + rng4() * 0.34, 0.78, CITY_Y + 0.18);
          }
          if (bedIdx % 2 === 0) {
            entranceShrubSpots.push({ x: cx + (rng4() - 0.5) * bedLen * 0.5, y: CITY_Y + 0.19, z: bz + 0.3, scale: 0.55 + rng4() * 0.3, rotY: rng4() * Math.PI * 2 });
          }
        }
        bedIdx++;
      }
      x += bedLen + gap;
    }
  }

  // lawn patches filling the gaps between front towers
  const sorted = frontTowers.slice().sort((a, b) => a.x - b.x);
  for (let i = 0; i + 1 < sorted.length; i++) {
    const L = sorted[i], R = sorted[i + 1];
    const e0 = L.x + L.w / 2, e1 = R.x - R.w / 2;
    if (e1 - e0 < 12) continue;
    if (GAP_X.some((c) => c > e0 - 4 && c < e1 + 4)) continue;
    const cx = (e0 + e1) / 2;
    const sx = Math.min(2.2, (e1 - e0 - 4) / 9);
    lawnSpots.push({ x: cx, z: 60.5 + (rng4() - 0.5) * 2, sx, sz: 1.5 + rng4() * 0.5 });
    // hedge edging + palms turn the bare patch into a pocket park
    for (let hx = -sx * 4.2; hx <= sx * 4.2; hx += 2.2) {
      addHedge(cx + hx, 56.4 + (rng4() - 0.5) * 0.4, 0.8, 0.7 + rng4() * 0.25, 0.8, CITY_Y);
    }
    palmSpots.push({ x: cx + (rng4() - 0.5) * sx * 5, z: 61 + (rng4() - 0.5) * 3, sc: 0.8 + rng4() * 0.25, ry: rng4() * Math.PI * 2 });
    entranceShrubSpots.push({ x: cx + (rng4() - 0.5) * 5, y: CITY_Y, z: 58.5 + (rng4() - 0.5) * 3, scale: 0.9 + rng4() * 0.6, rotY: rng4() * Math.PI * 2 });
  }

  // ---- stone podium at the foot of every tower without a shopfront ----
  // A curtain wall running straight into the pavement is the single loudest
  // "box dropped on a plane" tell; a proud base band with a plinth, a capping
  // reveal and lobby glazing fixes it for one merged draw call. The overhang
  // stays under half a metre so the legacy tower collider still fits.
  for (const t of towerData) {
    if (t.hasShop || t.z > 250 || t.style === 'cyl') continue;
    const PH = t.podiumH || (3.2 + rng4() * 1.6);  // podium height
    const pr = 0.28 + rng4() * 0.16;               // how far it stands proud
    const pw = t.w + pr * 2, pd = t.d + pr * 2;
    const stone = rng4() < 0.5 ? 0x6b6459 : 0x5c6165;
    const stone2 = new THREE.Color(stone).offsetHSL(0, 0, 0.05).getHex();
    shopOpaque.push(cBox(pw, PH - 0.34, pd, stone, t.x, CITY_Y + (PH - 0.34) / 2, t.z));
    shopOpaque.push(cBox(pw + 0.22, 0.3, pd + 0.22, 0x3f4448, t.x, CITY_Y + 0.15, t.z));       // plinth
    shopOpaque.push(cBox(pw + 0.3, 0.34, pd + 0.3, 0x7d776c, t.x, CITY_Y + PH - 0.17, t.z));   // cap
    // clad the base in pilaster strips so it is not one flat slab of stone
    for (let px = -pw / 2 + 1.4; px < pw / 2 - 0.6; px += 4.4) {
      shopOpaque.push(cBox(0.55, PH - 0.62, 0.16, stone2, t.x + px, CITY_Y + (PH - 0.62) / 2, t.z - pd / 2 - 0.07));
    }
    shopOpaque.push(cBox(pw + 0.06, 0.12, pd + 0.06, 0x4a4f52, t.x, CITY_Y + PH * 0.52, t.z)); // shadow reveal
    // lobby glazing + revolving-door bay on the street face
    const fz = t.z - pd / 2;
    const lw = Math.min(t.w * 0.62, 15);
    shopGlassG.push(new THREE.BoxGeometry(lw, PH - 1.35, 0.2).translate(t.x, CITY_Y + (PH - 1.35) / 2 + 0.5, fz - 0.02));
    shopGlow.push(colorFill(new THREE.BoxGeometry(lw - 0.4, PH - 1.6, 0.05)
      .translate(t.x, CITY_Y + (PH - 1.35) / 2 + 0.5, fz + 0.4), 0x4a4438));
    for (let mx = -lw / 2 + 1.6; mx < lw / 2 - 0.5; mx += 1.9) {
      shopOpaque.push(cBox(0.11, PH - 1.35, 0.26, 0x767b80, t.x + mx, CITY_Y + (PH - 1.35) / 2 + 0.5, fz - 0.06));
    }
    shopOpaque.push(cBox(lw + 0.6, 0.32, 0.4, 0x7d776c, t.x, CITY_Y + PH - 0.9, fz - 0.12));
    // entrance apron: darker paving band + two steps
    shopOpaque.push(cBox(lw + 5, 0.05, 3.4, 0x5b5850, t.x, CITY_Y + 0.025, fz - 1.85));
    shopOpaque.push(cBox(lw + 1.4, 0.13, 0.9, 0x6d685f, t.x, CITY_Y + 0.065, fz - 0.55));
  }

  // ---- city blocks behind the front row ----
  // Cross streets, parking lots, lawns and block palms. Without these the
  // plateau behind Ocean Drive renders as one unbroken paved plain.
  const blockPalmSpots = [];
  const occupied = (x, z, rx, rz) => towerData.some((t) =>
    Math.abs(x - t.x) < t.w / 2 + rx && Math.abs(z - t.z) < t.d / 2 + rz);
  for (const cx of GAP_X) {
    // block palms + planting down the cross street (the asphalt and kerbs
    // themselves are built in road.js)
    for (let z = XS_Z0 + 12; z < XS_Z1 - 10; z += 21) {
      for (const s of [-1, 1]) {
        const px = cx + s * (XS_HALF + 2.4);
        if (occupied(px, z, 2, 2)) continue;
        blockPalmSpots.push({ x: px, z: z + (rng4() - 0.5) * 3, sc: 0.75 + rng4() * 0.3, ry: rng4() * Math.PI * 2 });
        grateSpots.push({ x: px, z, y: CITY_Y + 0.012 });
      }
    }
  }
  // parking lots + pocket parks in the voids between tower rows
  const parcelTaken = [];
  const freeParcel = (x, z, r) => !parcelTaken.some((p) =>
    Math.abs(x - p.x) < r + p.r && Math.abs(z - p.z) < 24);
  for (let bx = -536; bx <= 536; bx += 37) {
    for (const bz of [92, 104, 153, 219, 249]) {
      const z = bz + (rng4() - 0.5) * 7;
      const x = bx + (rng4() - 0.5) * 6;
      if (GAP_X.some((c) => Math.abs(x - c) < XS_HALF + 18)) continue;
      if (occupied(x, z, 18, 13)) continue;
      const roll = rng4();
      if (roll < 0.44) {
        if (!freeParcel(x, z, 17)) continue;
        parcelTaken.push({ x, z, r: 17 });
        lotSpots.push({ x, z, ry: 0 });
        // kerb + hedge screen along the street edge of the lot
        shopOpaque.push(cBox(30.6, 0.16, 0.5, 0x8a857b, x, CITY_Y + 0.08, z - 9.3));
        for (let hx = -13; hx <= 13; hx += 2.9) {
          addHedge(x + hx, z - 10.3, 0.78, 0.62 + rng4() * 0.2, 0.8, CITY_Y);
        }
      } else if (roll < 0.8) {
        if (!freeParcel(x, z, 15)) continue;
        parcelTaken.push({ x, z, r: 15 });
        const sx = 2.2 + rng4() * 0.9, sz = 2.0 + rng4() * 0.8;
        lawnSpots.push({ x, z, sx, sz, y: CITY_Y + 0.02, ry: 0 });
        // hedge border on all four sides turns the green rectangle into a park
        const hw = 4.5 * sx, hd = 2.75 * sz;
        for (let hx = -hw; hx <= hw; hx += 2.6) {
          addHedge(x + hx, z - hd - 0.5, 0.8, 0.62 + rng4() * 0.22, 0.8, CITY_Y);
          addHedge(x + hx, z + hd + 0.5, 0.8, 0.62 + rng4() * 0.22, 0.8, CITY_Y);
        }
        for (let hz = -hd; hz <= hd; hz += 2.6) {
          addHedge(x - hw - 0.5, z + hz, 0.8, 0.62 + rng4() * 0.22, 0.8, CITY_Y);
          addHedge(x + hw + 0.5, z + hz, 0.8, 0.62 + rng4() * 0.22, 0.8, CITY_Y);
        }
        for (let k = 0; k < 3; k++) {
          blockPalmSpots.push({
            x: x + (rng4() - 0.5) * hw * 1.6, z: z + (rng4() - 0.5) * hd * 1.6,
            sc: 0.85 + rng4() * 0.35, ry: rng4() * Math.PI * 2,
          });
        }
        addBed(x + (rng4() - 0.5) * hw, z + (rng4() - 0.5) * hd);
      } else {
        blockPalmSpots.push({ x, z, sc: 0.8 + rng4() * 0.3, ry: rng4() * Math.PI * 2 });
      }
    }
  }
  // mid-block infill: small pocket parks in the tight gaps between towers,
  // where a full 30 m parcel will not fit. Without these the band directly
  // behind the front row stays an empty paved shelf.
  for (let ix = -556; ix <= 556; ix += 23) {
    for (const iz of [70, 88, 112, 140, 168, 200]) {
      const x = ix + (rng4() - 0.5) * 6;
      const z = iz + (rng4() - 0.5) * 7;
      if (GAP_X.some((c) => Math.abs(x - c) < XS_HALF + 7)) continue;
      if (occupied(x, z, 8.5, 6.5)) continue;
      if (!freeParcel(x, z, 9)) continue;
      parcelTaken.push({ x, z, r: 9 });
      const roll = rng4();
      if (roll < 0.55) {
        lawnSpots.push({ x, z, sx: 0.85 + rng4() * 0.35, sz: 0.85 + rng4() * 0.3, y: CITY_Y + 0.02 });
        for (let hx = -3.6; hx <= 3.6; hx += 2.4) {
          addHedge(x + hx, z - 2.9, 0.7, 0.6 + rng4() * 0.2, 0.75, CITY_Y);
          addHedge(x + hx, z + 2.9, 0.7, 0.6 + rng4() * 0.2, 0.75, CITY_Y);
        }
        blockPalmSpots.push({ x: x + (rng4() - 0.5) * 5, z: z + (rng4() - 0.5) * 4, sc: 0.75 + rng4() * 0.3, ry: rng4() * Math.PI * 2 });
      } else if (roll < 0.78) {
        addBed(x, z);
        blockPalmSpots.push({ x, z: z + 2.5, sc: 0.8 + rng4() * 0.25, ry: rng4() * Math.PI * 2 });
        grateSpots.push({ x, z: z + 2.5, y: CITY_Y + 0.012 });
      } else {
        blockPalmSpots.push({ x, z, sc: 0.8 + rng4() * 0.3, ry: rng4() * Math.PI * 2 });
        grateSpots.push({ x, z, y: CITY_Y + 0.012 });
      }
    }
  }

  // tree grates for the palms standing on the paved promenade
  if (palmPlacements) {
    for (const pp of palmPlacements) {
      if (grateSpots.length >= 260) break;
      if (pp.z < 33 || pp.z > 58 || Math.abs(pp.x) > 600) continue;
      grateSpots.push({ x: pp.x, z: pp.z, y: stripY(pp.z) + 0.012 });
    }
  }

  // ---- balconies on 2 street-visible faces of ~1/3 of the mid/back towers ----
  const balSpots = [];
  for (const t of towerData) {
    if (t.z < 100 || t.style !== 'glass' || (t.mv !== 0 && t.mv !== 3)) continue;
    if (rng4() > 0.34 || t.w < 24) continue;
    const maxY = CITY_Y + Math.min(t.h - 6, 112);
    const colsF = Math.max(1, Math.min(3, Math.floor((t.w - 9) / 8)));
    const colsS = Math.max(1, Math.min(2, Math.floor((t.d - 9) / 8)));
    for (let fy = CITY_Y + 7.5; fy < maxY && balSpots.length < 880; fy += 6.4) {
      for (let c = 0; c < colsF; c++) {
        balSpots.push({ x: t.x + (c - (colsF - 1) / 2) * 7.2, y: fy, z: t.z - t.d / 2, ry: Math.PI });
      }
      for (let c = 0; c < colsS; c++) {
        const off = (c - (colsS - 1) / 2) * 7.2;
        if (t.x < 0) balSpots.push({ x: t.x + t.w / 2, y: fy, z: t.z + off, ry: Math.PI / 2 });
        else balSpots.push({ x: t.x - t.w / 2, y: fy, z: t.z + off, ry: -Math.PI / 2 });
      }
    }
  }

  // ---- rooftop clutter kits + parapet hedges ----
  const roofSpots = [];
  for (const t of towerData) {
    if (t.style !== 'glass' || t.mv === 1) continue;
    if (rng4() > 0.55 || Math.min(t.w, t.d) < 21) continue;
    roofSpots.push({
      x: t.x + (rng4() - 0.5) * (t.w - 15),
      y: CITY_Y + t.h + 0.02,
      z: t.z + (rng4() - 0.5) * (t.d - 15),
      ry: ((rng4() * 4) | 0) * (Math.PI / 2),
    });
    if (rng4() < 0.38) {
      const n = Math.floor((t.w - 6) / 2.1);
      for (let k = 0; k < n; k++) {
        addHedge(t.x - (t.w - 6) / 2 + k * 2.1, t.z - t.d / 2 + 1.2, 0.95, 0.8, 0.85, CITY_Y + t.h);
      }
    }
  }

  // ---- materialize the built fabric (planting happens in dressing.js) ----
  const q4 = new THREE.Quaternion();
  const e4 = new THREE.Euler();
  const v4 = new THREE.Vector3();
  const s4 = new THREE.Vector3();
  const m4c = new THREE.Matrix4();
  const placeAll = (im, spots) => {
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i];
      e4.set(0, s.ry || 0, 0);
      q4.setFromEuler(e4);
      v4.set(s.x, s.y !== undefined ? s.y : CITY_Y, s.z);
      s4.set(s.sx || 1, s.sy || 1, s.sz || 1);
      m4c.compose(v4, q4, s4);
      im.setMatrixAt(i, m4c);
    }
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    root.add(im);
  };

  if (shopOpaque.length) {
    const g = track(mergeGeometries(shopOpaque));
    shopOpaque.forEach((x) => x.dispose());
    const shopMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }));
    const mesh = new THREE.Mesh(g, shopMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  if (shopGlassG.length) {
    const g = track(mergeGeometries(shopGlassG));
    shopGlassG.forEach((x) => x.dispose());
    const mat = track(new THREE.MeshStandardMaterial({
      color: 0x0e1a20, metalness: 0.5, roughness: 0.07,
      transparent: true, opacity: 0.55,
      envMapIntensity: 1.15, depthWrite: false,
    }));
    root.add(new THREE.Mesh(g, mat));
  }
  if (shopGlow.length) {
    // unlit interiors + sign faces — the depth behind the glass that makes a
    // storefront read as a shop rather than a black rectangle
    const g = track(mergeGeometries(shopGlow));
    shopGlow.forEach((x) => x.dispose());
    const mat = track(new THREE.MeshBasicMaterial({ vertexColors: true }));
    root.add(new THREE.Mesh(g, mat));
  }
  if (glassPanelGeos.length) {
    const g = track(mergeGeometries(glassPanelGeos));
    glassPanelGeos.forEach((x) => x.dispose());
    glassPanelGeos.length = 0;
    const mat = track(new THREE.MeshStandardMaterial({
      color: 0xcfe4ec, metalness: 0.1, roughness: 0.1,
      transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false,
    }));
    root.add(new THREE.Mesh(g, mat));
  }
  if (balSpots.length) {
    const balGeo = track(buildBalconyGeo());
    const balMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.15 }));
    placeAll(new THREE.InstancedMesh(balGeo, balMat, balSpots.length), balSpots);
  }
  if (roofSpots.length) {
    const roofKitGeo = track(buildRooftopKitGeo());
    const roofMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }));
    placeAll(new THREE.InstancedMesh(roofKitGeo, roofMat, roofSpots.length), roofSpots);
  }

  return {
    hedgeSpots, mulchSpots, flowerSpots, lawnSpots, lotSpots, grateSpots,
    palmSpots, blockPalmSpots, entranceShrubSpots,
  };
}
