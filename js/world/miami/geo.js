import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Props-v2 geometry helpers (parasols, lifeguard towers, boats, facades).
// Builders return BufferGeometries with position/normal/uv (+vertex colors
// where noted) so they can be freely merged or instanced.

export function colorFill(geo, hex) {
  const c = new THREE.Color(hex);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

export function zeroUV(geo) {
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
  return geo;
}

export function cBox(w, h, d, hex, x, y, z, rx = 0, ry = 0, rz = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rz) g.rotateZ(rz);
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  return colorFill(g, hex);
}

export function cCyl(r0, r1, h, seg, hex, x, y, z, rx = 0, ry = 0, rz = 0) {
  const g = new THREE.CylinderGeometry(r0, r1, h, seg);
  if (rz) g.rotateZ(rz);
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  return colorFill(g, hex);
}

export function cSph(r, w, h, hex, x, y, z, sy = 1) {
  const g = new THREE.SphereGeometry(r, w, h);
  if (sy !== 1) g.scale(1, sy, 1);
  g.translate(x, y, z);
  return colorFill(g, hex);
}

export function cTorus(r, tube, radSeg, tubSeg, hex, x, y, z, rx = 0, ry = 0, rz = 0, arc = Math.PI * 2) {
  const g = new THREE.TorusGeometry(r, tube, radSeg, tubSeg, arc);
  if (rz) g.rotateZ(rz);
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  return colorFill(g, hex);
}

export function tubeBetween(p0, p1, r, seg) {
  const dir = new THREE.Vector3().subVectors(p1, p0);
  const len = dir.length();
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  g.translate((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2);
  return g;
}

/** tubeBetween + a flat vertex colour, ready to merge into a vertexColors mesh. */
export function cTube(p0, p1, r, seg, hex) {
  return colorFill(tubeBetween(p0, p1, r, seg), hex);
}

// Physically scaled facade UVs for a BoxGeometry: SIDE faces only. ±y (the
// lid and the soffit) stay at a degenerate UV so a leftover cap cannot show
// windows — roofs are a separate mesh with their own material.
// Every side maps the texture at a constant tileU x tileV meters.
export function facadeUV(geo, w, h, d, tileU, tileV, offU, offV) {
  const uv = geo.attributes.uv;
  if (uv.count === 24) {
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];   // ±x, ±y, ±z faces
    for (let f = 0; f < 6; f++) {
      if (f === 2 || f === 3) {                         // +y / -y: never the wall atlas
        for (let k = 0; k < 4; k++) uv.setXY(f * 4 + k, 0, 0);
        continue;
      }
      const du = dims[f][0], dv = dims[f][1];
      for (let k = 0; k < 4; k++) {
        const i = f * 4 + k;
        uv.setXY(i, uv.getX(i) * (du / tileU) + offU, uv.getY(i) * (dv / tileV) + offV);
      }
    }
  } else {
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) * (w / tileU) + offU, uv.getY(i) * (h / tileV) + offV);
    }
  }
  uv.needsUpdate = true;
}

/** Drop +y/-y faces from a BoxGeometry so the wall atlas cannot wrap the lid. */
export function stripBoxCaps(geo) {
  if (!geo.index || !geo.groups || geo.groups.length < 6) return geo;
  const src = geo.index.array;
  const dst = new src.constructor(24);
  let o = 0;
  for (const f of [0, 1, 4, 5]) {
    const start = geo.groups[f].start;
    for (let k = 0; k < 6; k++) dst[o++] = src[start + k];
  }
  geo.setIndex(new THREE.BufferAttribute(dst, 1));
  geo.clearGroups();
  return geo;
}

/**
 * Drop CylinderGeometry cap disks (groups 1 and 2). The wall atlas stays on
 * the barrel only; a separate lid mesh owns the roof material.
 */
export function stripCylinderCaps(geo) {
  if (!geo.index || !geo.groups || geo.groups.length < 3) return geo;
  const body = geo.groups[0];
  const src = geo.index.array;
  const dst = new src.constructor(body.count);
  for (let k = 0; k < body.count; k++) dst[k] = src[body.start + k];
  geo.setIndex(new THREE.BufferAttribute(dst, 1));
  geo.clearGroups();
  return geo;
}

/** Thin roof slab. Origin at the wall-box TOP centre; grows upward. */
export function roofSlabGeo(w, d, x = 0, yTop = 0, z = 0, ry = 0, thick = 0.22) {
  const g = new THREE.BoxGeometry(w + 0.14, thick, d + 0.14);
  if (ry) g.rotateY(ry);
  g.translate(x, yTop + thick / 2, z);
  return g;
}

/** Concrete soffit. Origin at the wall-box BOTTOM centre; grows upward. */
export function soffitGeo(w, d, x = 0, yBottom = 0, z = 0, ry = 0, thick = 0.1) {
  const g = new THREE.BoxGeometry(w, thick, d);
  if (ry) g.rotateY(ry);
  g.translate(x, yBottom + thick / 2, z);
  return g;
}

/**
 * Zero UVs on CylinderGeometry cap disks (groups 1+). Side wall (group 0)
 * is left alone. A leftover +Y disk must never carry a facade/window atlas.
 */
export function zeroCylCaps(geo) {
  const uv = geo.attributes.uv;
  if (!uv || !geo.index || !geo.groups || geo.groups.length < 2) return geo;
  for (let g = 1; g < geo.groups.length; g++) {
    const start = geo.groups[g].start;
    const count = geo.groups[g].count;
    for (let k = 0; k < count; k++) uv.setXY(geo.index.getX(start + k), 0, 0);
  }
  uv.needsUpdate = true;
  return geo;
}

/**
 * Side-wall UVs for a CylinderGeometry at a constant physical tile size.
 * Cap disks (if present) get degenerate UVs — never a repeating window photo.
 */
export function facadeCylUV(geo, circ, h, tileU, tileV, offU = 0, offV = 0) {
  const uv = geo.attributes.uv;
  if (!uv) return geo;
  const su = circ / tileU, sv = h / tileV;
  const idx = geo.index;
  if (idx && geo.groups && geo.groups.length) {
    const seen = new Uint8Array(uv.count);
    const { start, count } = geo.groups[0];
    for (let k = 0; k < count; k++) {
      const i = idx.getX(start + k);
      if (seen[i]) continue;
      seen[i] = 1;
      uv.setXY(i, uv.getX(i) * su + offU, uv.getY(i) * sv + offV);
    }
    zeroCylCaps(geo);
  } else {
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) * su + offU, uv.getY(i) * sv + offV);
    }
  }
  uv.needsUpdate = true;
  return geo;
}

/**
 * Complete art-deco mid-rise massing. Origin at the wall-box centre.
 *
 * Six sides — a repeating wall atlas is NEVER applied to +Y or -Y:
 *   +Z front  — facadeUV wall atlas (windows / stucco bays)
 *   -Z back   — facadeUV wall atlas
 *   +X right  — facadeUV wall atlas
 *   -X left   — facadeUV wall atlas
 *   +Y top    — roofSlabGeo (caller assigns tile / TPO / metal — never windows)
 *   -Y bottom — soffitGeo (caller assigns concrete)
 *
 * Cornice is a separate vertex-coloured limestone band so it cannot share
 * the window map. Does not consume any rng stream.
 */
export function buildDecoMidriseGeos(w, h, d, tileU, tileV, offU = 0, offV = 0) {
  const walls = new THREE.BoxGeometry(w, h, d);
  facadeUV(walls, w, h, d, tileU, tileV, offU, offV);
  stripBoxCaps(walls);
  const roof = roofSlabGeo(w, d, 0, h / 2, 0);
  const soffit = soffitGeo(w, d, 0, -h / 2, 0);
  const cornice = cBox(w + 0.38, 0.32, d + 0.38, 0xd4c4a8, 0, h / 2 + 0.14, 0);
  return { walls, roof, soffit, cornice };
}

/**
 * Walkable stair flight. Origin at the bottom-tread front; rises +Y, runs +Z.
 * Front: first riser; back: last riser; left/right: tread ends + two rail posts
 * and a top rail; top: treads; bottom: soffit of the lowest step.
 * Vertex colours. Does not consume any rng stream.
 */
export function buildStairFlightGeo(opts = {}) {
  const steps = opts.steps ?? 8;
  const width = opts.width ?? 3.2;
  const rise = opts.rise ?? 0.16;
  const run = opts.run ?? 0.32;
  const stone = opts.stone ?? 0x6a655c;
  const rail = opts.rail ?? 0x2b3138;
  const G = [];
  for (let i = 0; i < steps; i++) {
    G.push(cBox(width, rise, run, stone, 0, (i + 0.5) * rise, (i + 0.5) * run));
  }
  const postH = 0.9;
  const postW = 0.05;
  const px = width / 2 - postW * 0.5;
  const z0 = run * 0.3;
  const z1 = (steps - 0.3) * run;
  const y0 = rise + postH / 2;
  const y1 = steps * rise + postH / 2;
  G.push(cBox(postW, postH, postW, rail, px, y0, z0));
  G.push(cBox(postW, postH, postW, rail, px, y1, z1));
  G.push(cTube(
    new THREE.Vector3(px, y0 + postH / 2, z0),
    new THREE.Vector3(px, y1 + postH / 2, z1),
    0.022, 6, rail,
  ));
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

/**
 * Round concrete pilotis. Origin at ground; grows +Y.
 * Front/back/left/right: tapered shaft; top: capital; bottom: plinth.
 * Vertex colours. Does not consume any rng stream.
 */
export function buildPilotisColumnGeo(opts = {}) {
  const height = opts.height ?? 9.5;
  const radius = opts.radius ?? 0.38;
  const hex = opts.hex ?? 0x8a8680;
  const plinthH = 0.28;
  const capH = 0.22;
  const shaftH = Math.max(0.4, height - plinthH - capH);
  const plinthR = radius * 1.28;
  const capR = radius * 1.18;
  const G = [
    cCyl(plinthR, plinthR, plinthH, 12, hex, 0, plinthH / 2, 0),
    cCyl(radius * 0.88, radius, shaftH, 12, hex, 0, plinthH + shaftH / 2, 0),
    cCyl(capR, radius * 0.92, capH, 12, hex, 0, plinthH + shaftH + capH / 2, 0),
  ];
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

/**
 * Single rooftop AC pack. Origin at roof deck. ~1.7 × 0.95 × 1.25 m.
 * Front: grille; back: access panel; left/right: galvanized body;
 * top: fan shroud; bottom: sleepers. Vertex colours.
 */
export function buildRoofAcUnitGeo() {
  const galv = 0x9ba3ab, shroud = 0x3c4249, rail = 0x6d747c;
  const G = [
    cBox(1.7, 0.95, 1.25, galv, 0, 0.48, 0),
    cBox(1.55, 0.62, 0.04, 0x5c646c, 0, 0.5, -0.645),
    cBox(0.4, 0.5, 0.04, 0x4a5158, 0, 0.48, 0.645),
    cCyl(0.52, 0.52, 0.06, 12, shroud, 0, 0.98, 0),
    cBox(0.16, 0.08, 1.15, rail, -0.55, 0.04, 0),
    cBox(0.16, 0.08, 1.15, rail, 0.55, 0.04, 0),
  ];
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}
