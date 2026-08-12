import * as THREE from 'three';
import { CONTAINMENT, FUEL_BLDG, GROUND_Y } from '../constants.js';
import { addBox } from '../textures.js';

/** Containment cylinder + hemispherical dome + fuel building. */
export function buildContainment(ctx) {
  const { root, track, addCollider, mats } = ctx;
  const C = CONTAINMENT;

  // Main cylinder shell (visual open-ended + ring colliders so door aperture is flyable)
  {
    const wallGeo = track(new THREE.CylinderGeometry(C.r, C.r, C.h, 40, 1, true));
    const wall = new THREE.Mesh(wallGeo, mats.concrete);
    wall.position.set(C.x, GROUND_Y + C.h / 2, C.z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    root.add(wall);
    const sectors = 20;
    const doorA = Math.PI / 2; // +Z face
    for (let i = 0; i < sectors; i++) {
      const a = (i / sectors) * Math.PI * 2;
      // skip ~door sector
      let da = Math.abs(a - doorA);
      if (da > Math.PI) da = Math.PI * 2 - da;
      if (da < 0.22) continue;
      addCollider(C.x + Math.cos(a) * C.r, GROUND_Y, C.z + Math.sin(a) * C.r, 4.2, C.h, 4.2);
    }
  }

  // Domed roof (hemisphere)
  const domeGeo = track(new THREE.SphereGeometry(C.r * 0.98, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2));
  const dome = new THREE.Mesh(domeGeo, mats.concreteDark);
  dome.position.set(C.x, GROUND_Y + C.h, C.z);
  dome.castShadow = true;
  dome.receiveShadow = true;
  root.add(dome);
  // Approximate dome collider as a shorter wide box stack
  addCollider(C.x, GROUND_Y + C.h, C.z, C.r * 1.6, C.domeH * 0.55, C.r * 1.6);
  addCollider(C.x, GROUND_Y + C.h + C.domeH * 0.45, C.z, C.r * 1.1, C.domeH * 0.5, C.r * 1.1);

  // Interior whoop: open door aperture with sill depth
  const doorW = 4.2, doorH = 5.5, sill = 0.45;
  // Punch visual by overlaying a dark recess (not boolean — sill lip boxes)
  addBox(ctx, mats, 'oxideDark', C.x, GROUND_Y + sill, C.z + C.r - 0.3, doorW, doorH, 1.2, { collide: false });
  // Sill lip
  addBox(ctx, mats, 'concreteDark', C.x, GROUND_Y, C.z + C.r - 0.15, doorW + 0.6, sill, 1.4);
  // Door jambs (narrow colliders leave the aperture open)
  addBox(ctx, mats, 'concrete', C.x - doorW / 2 - 0.35, GROUND_Y, C.z + C.r - 0.2, 0.7, doorH + sill, 1.5);
  addBox(ctx, mats, 'concrete', C.x + doorW / 2 + 0.35, GROUND_Y, C.z + C.r - 0.2, 0.7, doorH + sill, 1.5);

  // Ring crane rail on top of cylinder
  const rail = new THREE.Mesh(
    track(new THREE.TorusGeometry(C.r * 0.92, 0.35, 8, 48)),
    mats.galv
  );
  rail.position.set(C.x, GROUND_Y + C.h - 1.2, C.z);
  rail.rotation.x = Math.PI / 2;
  rail.castShadow = true;
  root.add(rail);

  // Fuel building
  const F = FUEL_BLDG;
  addBox(ctx, mats, 'brick', F.x, GROUND_Y, F.z, F.w, F.h, F.d);
  // Roof
  addBox(ctx, mats, 'oxide', F.x, GROUND_Y + F.h, F.z, F.w + 0.6, 0.5, F.d + 0.6);
  // Loading bay aperture (south face) with sill
  const bayW = 6, bayH = 4.5;
  addBox(ctx, mats, 'oxideDark', F.x, GROUND_Y + 0.35, F.z + F.d / 2 - 0.2, bayW, bayH, 0.8, { collide: false });
  addBox(ctx, mats, 'concreteDark', F.x, GROUND_Y, F.z + F.d / 2 - 0.1, bayW + 0.4, 0.35, 1.0);
  // Warning stripe band
  addBox(ctx, mats, 'warnYellow', F.x, GROUND_Y + 1.2, F.z + F.d / 2 + 0.05, F.w * 0.9, 0.25, 0.12, { collide: false });
}
