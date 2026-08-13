import * as THREE from 'three';
import { RUINS, GROUND_Y } from '../constants.js';
import { addBox } from '../textures.js';

/**
 * Collapsed annex near admin — HONEST colliders only on visible rubble piles
 * and remaining wall stubs. No fake walls. Decorative debris uses collide:false.
 */
export function buildRuins(ctx) {
  const { root, track, addCollider, mats, rng } = ctx;
  const R = RUINS;

  // Remaining wall stubs (visible = collide)
  addBox(ctx, mats, 'brick', R.x - 5, GROUND_Y, R.z - 3, 4, 2.8, 0.4);
  addBox(ctx, mats, 'brick', R.x - 6.5, GROUND_Y, R.z, 0.4, 3.5, 5);
  addBox(ctx, mats, 'concreteDark', R.x + 4, GROUND_Y, R.z + 2, 3.5, 1.6, 0.45);

  // Fallen roof slab (tilted visual) + matching AABB on the visible footprint
  {
    const geo = track(new THREE.BoxGeometry(7, 0.35, 4));
    const mesh = new THREE.Mesh(geo, mats.oxide);
    mesh.position.set(R.x + 1, GROUND_Y + 1.1, R.z - 1);
    mesh.rotation.z = 0.35;
    mesh.rotation.x = -0.12;
    mesh.castShadow = true;
    root.add(mesh);
    addCollider(R.x + 1, GROUND_Y, R.z - 1, 6.5, 1.5, 3.8);
  }

  // Rubble piles — collide with the pile volumes that are visible
  const piles = [
    { x: R.x - 2, z: R.z + 3, s: 2.4, h: 1.3 },
    { x: R.x + 3.5, z: R.z - 3.5, s: 2.0, h: 1.0 },
    { x: R.x, z: R.z + 0.5, s: 3.0, h: 0.85 },
  ];
  for (const p of piles) {
    addBox(ctx, mats, 'concreteDark', p.x, GROUND_Y, p.z, p.s, p.h, p.s * 0.85);
    for (let i = 0; i < 3; i++) {
      const bx = p.x + (rng() - 0.5) * p.s * 0.7;
      const bz = p.z + (rng() - 0.5) * p.s * 0.7;
      addBox(ctx, mats, 'brick', bx, GROUND_Y + p.h, bz, 0.4, 0.2, 0.25, { collide: false });
    }
  }

  // Rebar stubs (visual, thin — no collide)
  for (let i = 0; i < 6; i++) {
    const x = R.x - 4 + rng() * 8;
    const z = R.z - 3 + rng() * 6;
    addBox(ctx, mats, 'galv', x, GROUND_Y, z, 0.06, 0.8 + rng() * 1.2, 0.06, { collide: false });
  }
}
