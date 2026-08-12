import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { colorFill, zeroUV, cCyl, tubeBetween } from '../geo.js';

// ---------- parasols (beach umbrellas v2) ----------
const PAR_R = 1.45, PAR_APEX = 0.5, PAR_Y0 = 1.96, PAR_PANELS = 12;

// Scalloped 12-rib canopy; parity picks alternating panels so two
// InstancedMeshes (fixed white + per-instance tinted) interleave into
// one two-tone parasol.
export function buildParasolCanopy(parity) {
  const SUB = 4, ringT = [0.55, 1.0];
  const pos = [], idx = [];
  for (let j = 0; j < PAR_PANELS; j++) {
    if (j % 2 !== parity) continue;
    const base = pos.length / 3;
    const midA = ((j + 0.5) / PAR_PANELS) * Math.PI * 2;
    pos.push(Math.cos(midA) * 0.02, PAR_Y0 + PAR_APEX, Math.sin(midA) * 0.02);
    for (let r = 0; r < 2; r++) {
      const t = ringT[r];
      for (let k = 0; k <= SUB; k++) {
        const a = ((j + k / SUB) / PAR_PANELS) * Math.PI * 2;
        const s = Math.sin((k / SUB) * Math.PI);           // 0 at ribs, 1 mid-panel
        const dipY = (r === 1 ? 0.13 : 0.05) * s;
        const dipR = (r === 1 ? 0.06 : 0.02) * s;
        const rad = PAR_R * Math.pow(t, 0.9) - dipR;
        pos.push(
          Math.cos(a) * rad,
          PAR_Y0 + PAR_APEX * (1 - Math.pow(t, 1.55)) - dipY,
          Math.sin(a) * rad
        );
      }
    }
    const r0 = base + 1, r1 = base + 2 + SUB;
    for (let k = 0; k < SUB; k++) {
      idx.push(base, r0 + k + 1, r0 + k);
      idx.push(r0 + k, r1 + k + 1, r1 + k);
      idx.push(r0 + k, r0 + k + 1, r1 + k + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return zeroUV(geo);
}

// Pole + 12 visible ribs + finial knob, merged → one instanced draw call.
export function buildParasolFrame() {
  const wood = 0xe8e2d2;
  const geos = [cCyl(0.032, 0.042, 2.04, 7, wood, 0, 1.02, 0)];
  const top = new THREE.Vector3(0, PAR_Y0 + PAR_APEX - 0.04, 0);
  for (let j = 0; j < PAR_PANELS; j++) {
    const a = (j / PAR_PANELS) * Math.PI * 2;
    const tip = new THREE.Vector3(Math.cos(a) * (PAR_R - 0.05), PAR_Y0 + 0.02, Math.sin(a) * (PAR_R - 0.05));
    geos.push(colorFill(tubeBetween(top, tip, 0.016, 5), wood));
  }
  geos.push(cCyl(0.05, 0.018, 0.14, 6, 0xcfa96a, 0, PAR_Y0 + PAR_APEX + 0.1, 0));
  const merged = mergeGeometries(geos);
  geos.forEach((g) => g.dispose());
  return merged;
}
