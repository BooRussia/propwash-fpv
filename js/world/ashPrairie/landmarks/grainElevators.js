import * as THREE from 'three';
import { ELEVATORS, GROUND_Y } from '../constants.js';
import { addBox, addCyl } from '../textures.js';

/** Concrete grain elevator row + headhouse. */
export function buildGrainElevators(ctx) {
  const { root, track, addCollider, mats } = ctx;
  const E = ELEVATORS;
  const startX = E.x - ((E.count - 1) * E.spacing) / 2;

  for (let i = 0; i < E.count; i++) {
    const x = startX + i * E.spacing;
    addCyl(ctx, mats, 'concrete', x, GROUND_Y, E.z, E.r, E.r, E.h, { seg: 24 });
    // Interior-readable liner (DoubleSide)
    {
      const linGeo = track(new THREE.CylinderGeometry(E.r - 0.35, E.r - 0.35, E.h - 0.4, 20, 1, true));
      const linMat = (mats.voidDark || mats.concreteDark).clone();
      track(linMat); linMat.side = THREE.DoubleSide;
      const lin = new THREE.Mesh(linGeo, linMat);
      lin.position.set(x, GROUND_Y + E.h / 2, E.z);
      root.add(lin);
    }
    // Cap
    addCyl(ctx, mats, 'concreteDark', x, GROUND_Y + E.h, E.z, E.r * 0.95, E.r * 0.7, 1.2, { seg: 16 });
    // Manhole / whoop window mid-height with sill depth
    if (i % 2 === 0) {
      const wy = GROUND_Y + 8 + (i % 3) * 6;
      addBox(ctx, mats, 'voidDark', x, wy, E.z + E.r - 0.22, 1.0, 1.25, 0.35, { collide: false });
      addBox(ctx, mats, 'galv', x, wy, E.z + E.r - 0.12, 1.15, 1.45, 0.12, { collide: false });
      addBox(ctx, mats, 'concreteDark', x, wy - 0.15, E.z + E.r - 0.05, 1.3, 0.2, 0.55);
    }
  }

  // Headhouse spanning the row
  const span = (E.count - 1) * E.spacing + E.r * 2 + 4;
  const hx = E.x;
  const hy = GROUND_Y + E.h;
  addBox(ctx, mats, 'concreteDark', hx, hy, E.z, span, E.headH, E.r * 2 + 4);
  // Headhouse roof monitors
  for (let i = 0; i < E.count; i++) {
    const x = startX + i * E.spacing;
    addBox(ctx, mats, 'galv', x, hy + E.headH, E.z, 3.5, 2.2, 3.5);
  }

  // Catwalk along the face (fly-under / whoop ledge)
  addBox(ctx, mats, 'galv', hx, GROUND_Y + 14, E.z + E.r + 1.6, span * 0.95, 0.15, 1.4);
  // Posts
  for (let i = 0; i < E.count; i++) {
    const x = startX + i * E.spacing;
    addBox(ctx, mats, 'oxide', x, GROUND_Y, E.z + E.r + 1.6, 0.2, 14, 0.2);
  }

  // Drive shed at base
  addBox(ctx, mats, 'brick', E.x - span * 0.35, GROUND_Y, E.z + E.r + 8, 18, 6, 10);
  addBox(ctx, mats, 'oxide', E.x - span * 0.35, GROUND_Y + 6, E.z + E.r + 8, 19, 0.4, 11);

  // Steel bins + lean-to between elevators and coop (bucket tower in accents.js)
  for (let i = 0; i < 3; i++) {
    const x = E.x - 10 + i * 10;
    const z = E.z + E.r + 18;
    addCyl(ctx, mats, 'galv', x, GROUND_Y, z, 2.4, 2.4, 7.5, { seg: 16 });
    addCyl(ctx, mats, 'oxide', x, GROUND_Y + 7.5, z, 2.5, 0.3, 0.9, { seg: 12 });
  }
  addBox(ctx, mats, 'oxideDark', E.x + 20, GROUND_Y, E.z + E.r + 16, 8, 3.5, 6);
  addBox(ctx, mats, 'galv', E.x + 20, GROUND_Y + 3.5, E.z + E.r + 16, 8.5, 0.25, 6.5);

}
