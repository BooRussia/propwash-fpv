import * as THREE from 'three';
import { SWITCHYARD, TURBINE, STACK, GROUND_Y } from '../constants.js';
import { addBox, addCyl } from '../textures.js';

/** Switchyard lattice + turbine hall shell + stack/chimney. */
export function buildSwitchyard(ctx) {
  const { root, track, addCollider, mats } = ctx;
  const S = SWITCHYARD;

  // Gravel pad
  {
    const geo = track(new THREE.PlaneGeometry(S.w, S.d));
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mats.soil);
    mesh.position.set(S.x, GROUND_Y + 0.05, S.z);
    mesh.receiveShadow = true;
    root.add(mesh);
  }

  // Bus structures / gantries
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    const z = S.z - S.d / 2 + 8 + r * ((S.d - 16) / (rows - 1));
    addBox(ctx, mats, 'galv', S.x - S.w / 2 + 4, GROUND_Y, z, 0.3, 14, 0.3);
    addBox(ctx, mats, 'galv', S.x + S.w / 2 - 4, GROUND_Y, z, 0.3, 14, 0.3);
    addBox(ctx, mats, 'galv', S.x, GROUND_Y + 13.5, z, S.w - 6, 0.35, 0.35);
    // Insulators + dangling bus
    for (let k = 0; k < 5; k++) {
      const x = S.x - S.w / 2 + 10 + k * ((S.w - 20) / 4);
      addCyl(ctx, mats, 'warnYellow', x, GROUND_Y + 10.5, z, 0.25, 0.35, 2.2, { seg: 8 });
      addBox(ctx, mats, 'oxideDark', x, GROUND_Y, z, 1.2, 2.5, 1.2);
    }
  }

  // Transformer blocks
  for (let i = 0; i < 6; i++) {
    const x = S.x - 20 + (i % 3) * 20;
    const z = S.z - 15 + Math.floor(i / 3) * 28;
    addBox(ctx, mats, 'oxide', x, GROUND_Y, z, 5.5, 4.2, 3.8);
    addBox(ctx, mats, 'galv', x, GROUND_Y + 4.2, z, 5.8, 0.35, 4.0);
    addCyl(ctx, mats, 'warnRed', x + 2.2, GROUND_Y + 4.5, z, 0.5, 0.5, 1.5, { seg: 8 });
  }

  // Turbine hall shell (open ends for freestyle)
  const T = TURBINE;
  // Floor slab
  addBox(ctx, mats, 'concrete', T.x, GROUND_Y, T.z, T.w, 0.4, T.d);
  // Long walls with large aperture bays (sill depth)
  for (const side of [-1, 1]) {
    const z = T.z + side * (T.d / 2);
    // Wall segments leaving 3 bay openings
    const segW = T.w / 7;
    for (let i = 0; i < 7; i++) {
      if (i % 2 === 1) {
        // Opening — jambs + sill only
        const x = T.x - T.w / 2 + segW * (i + 0.5);
        addBox(ctx, mats, 'concreteDark', x, GROUND_Y, z, segW * 0.9, 0.4, 1.2); // sill
        addBox(ctx, mats, 'concrete', x - segW * 0.4, GROUND_Y, z, 0.5, T.h * 0.75, 1.0);
        addBox(ctx, mats, 'concrete', x + segW * 0.4, GROUND_Y, z, 0.5, T.h * 0.75, 1.0);
        addBox(ctx, mats, 'oxideDark', x, GROUND_Y + 0.4, z, segW * 0.7, T.h * 0.7, 0.3, { collide: false });
      } else {
        const x = T.x - T.w / 2 + segW * (i + 0.5);
        addBox(ctx, mats, 'concrete', x, GROUND_Y, z, segW, T.h, 1.0);
      }
    }
  }
  // Roof beams (open shell — partial roof)
  for (let i = 0; i < 6; i++) {
    const x = T.x - T.w / 2 + 4 + i * ((T.w - 8) / 5);
    addBox(ctx, mats, 'galv', x, GROUND_Y + T.h, T.z, 0.4, 0.5, T.d);
  }
  addBox(ctx, mats, 'oxide', T.x, GROUND_Y + T.h + 0.4, T.z, T.w, 0.35, 0.5);
  // Interior turbine casings (whoop weave)
  for (let i = 0; i < 3; i++) {
    const x = T.x - 16 + i * 16;
    addCyl(ctx, mats, 'oxideDark', x, GROUND_Y + 0.4, T.z, 3.2, 3.5, 5.5, { seg: 16 });
    addBox(ctx, mats, 'galv', x, GROUND_Y + 5.9, T.z, 8, 0.8, 4);
  }

  // Stack / chimney
  const K = STACK;
  addCyl(ctx, mats, 'concrete', K.x, GROUND_Y, K.z, K.r, K.r * 1.15, K.h, { seg: 28 });
  addCyl(ctx, mats, 'warnRed', K.x, GROUND_Y + K.h * 0.72, K.z, K.r * 1.02, K.r * 1.02, 3.5, { seg: 20, collide: false });
  addCyl(ctx, mats, 'warnRed', K.x, GROUND_Y + K.h * 0.88, K.z, K.r * 1.02, K.r * 1.02, 3.5, { seg: 20, collide: false });
  // Ladder
  addBox(ctx, mats, 'galv', K.x + K.r + 0.15, GROUND_Y, K.z, 0.25, K.h * 0.95, 0.2);
}
