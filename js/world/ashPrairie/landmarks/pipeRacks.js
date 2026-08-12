import * as THREE from 'three';
import { PIPE_RACK, GROUND_Y } from '../constants.js';
import { addBox, addCyl } from '../textures.js';

/**
 * Pipe-rack cathedral / gantries.
 * Whoop density: horizontal pipe runs with 0.2–0.8 m clear gaps between.
 */
export function buildPipeRacks(ctx) {
  const { root, track, addCollider, mats, rng } = ctx;
  const R = PIPE_RACK;
  const width = R.x1 - R.x0;
  const depth = R.z1 - R.z0;
  const bayX = 8;
  const bayZ = 7;
  const colsX = Math.floor(width / bayX);
  const colsZ = Math.floor(depth / bayZ);

  // Steel columns + beams (gantry frames)
  for (let ix = 0; ix <= colsX; ix++) {
    for (let iz = 0; iz <= colsZ; iz++) {
      const x = R.x0 + ix * bayX;
      const z = R.z0 + iz * bayZ;
      const h = 4.5 + R.levels * 2.8;
      addBox(ctx, mats, 'oxide', x, GROUND_Y, z, 0.35, h, 0.35);
    }
  }

  // Longitudinal beams at each level
  for (let lv = 1; lv <= R.levels; lv++) {
    const y = GROUND_Y + lv * 2.8;
    for (let iz = 0; iz <= colsZ; iz++) {
      const z = R.z0 + iz * bayZ;
      addBox(ctx, mats, 'galv', (R.x0 + R.x1) / 2, y, z, width, 0.25, 0.25);
    }
    for (let ix = 0; ix <= colsX; ix++) {
      const x = R.x0 + ix * bayX;
      addBox(ctx, mats, 'galv', x, y, (R.z0 + R.z1) / 2, 0.25, 0.25, depth);
    }
  }

  // Dense pipe runs — whoop gaps 0.2–0.8 m
  const pipeMatKeys = ['oxide', 'galv', 'oxideDark', 'warnRed'];
  for (let lv = 0; lv < R.levels; lv++) {
    const baseY = GROUND_Y + 1.1 + lv * 2.8;
    let y = baseY;
    let guard = 0;
    while (y < baseY + 2.2 && guard < 40) {
      guard++;
      const r = 0.12 + rng() * 0.28;
      const gap = 0.2 + rng() * 0.6; // 0.2–0.8 m clear
      const matKey = pipeMatKeys[(rng() * pipeMatKeys.length) | 0];
      const alongX = rng() > 0.35;
      if (alongX) {
        const z = R.z0 + 1.5 + rng() * (depth - 3);
        const geo = track(new THREE.CylinderGeometry(r, r, width - 2, 10));
        geo.rotateZ(Math.PI / 2);
        const mesh = new THREE.Mesh(geo, mats[matKey]);
        mesh.position.set((R.x0 + R.x1) / 2, y + r, z);
        mesh.castShadow = true;
        root.add(mesh);
        addCollider((R.x0 + R.x1) / 2, y, z, width - 2, r * 2, r * 2);
      } else {
        const x = R.x0 + 1.5 + rng() * (width - 3);
        const geo = track(new THREE.CylinderGeometry(r, r, depth - 2, 10));
        geo.rotateX(Math.PI / 2);
        const mesh = new THREE.Mesh(geo, mats[matKey]);
        mesh.position.set(x, y + r, (R.z0 + R.z1) / 2);
        mesh.castShadow = true;
        root.add(mesh);
        addCollider(x, y, (R.z0 + R.z1) / 2, r * 2, r * 2, depth - 2);
      }
      y += r * 2 + gap;
    }
  }

  // Valve stations / duct clutter at ground (whoop layer)
  for (let i = 0; i < 14; i++) {
    const x = R.x0 + 2 + rng() * (width - 4);
    const z = R.z0 + 2 + rng() * (depth - 4);
    const h = 0.8 + rng() * 1.6;
    addCyl(ctx, mats, 'oxideDark', x, GROUND_Y, z, 0.35, 0.4, h, { seg: 10 });
    if (rng() > 0.5) {
      addBox(ctx, mats, 'galv', x + 0.6, GROUND_Y + h * 0.4, z, 1.2, 0.15, 0.15);
    }
  }

  // End portal frames (readable silhouette)
  for (const z of [R.z0 - 1, R.z1 + 1]) {
    addBox(ctx, mats, 'oxide', R.x0, GROUND_Y, z, 0.5, 12, 0.5);
    addBox(ctx, mats, 'oxide', R.x1, GROUND_Y, z, 0.5, 12, 0.5);
    addBox(ctx, mats, 'warnYellow', (R.x0 + R.x1) / 2, GROUND_Y + 11.5, z, width + 1, 0.4, 0.4);
  }
}
