import * as THREE from 'three';

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

// Physically scaled facade UVs for a BoxGeometry: every face maps the texture
// at a constant tileU x tileV meters, so window size is identical across all
// towers regardless of their dimensions. offU/offV decorrelate the pattern
// between neighbouring buildings.
export function facadeUV(geo, w, h, d, tileU, tileV, offU, offV) {
  const uv = geo.attributes.uv;
  if (uv.count === 24) {
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];   // ±x, ±y, ±z faces
    for (let f = 0; f < 6; f++) {
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
