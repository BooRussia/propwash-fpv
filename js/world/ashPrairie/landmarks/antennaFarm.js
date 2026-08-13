import * as THREE from 'three';
import { ANTENNA_FARM, SILO_LF, GROUND_Y } from '../constants.js';
import { addBox, addCyl } from '../textures.js';

/**
 * LF antenna farm near SILO_LF — lattice / guyed masts with flyable gaps.
 * Thick readable collision on mast legs + guys as sparse thick segments
 * (not invisible guy-wire tripwires). Shared geometries for perf.
 */
export function buildAntennaFarm(ctx) {
  const { root, track, addCollider, mats } = ctx;
  const F = ANTENNA_FARM;
  // Desi box west of silo; support legacy {x,z} or {x0,x1,z0,z1}
  const baseX = F.x0 != null ? (F.x0 + F.x1) * 0.5 : F.x;
  const baseZ = F.z0 != null ? (F.z0 + F.z1) * 0.5 : F.z;

  // Shared geos
  const legGeo = track(new THREE.BoxGeometry(0.28, 1, 0.28));
  const mastSegGeo = track(new THREE.CylinderGeometry(0.18, 0.22, 1, 8));
  const insGeo = track(new THREE.CylinderGeometry(0.2, 0.25, 0.5, 8));

  const mastDefs = [
    { x: baseX, z: baseZ, h: 42, lattice: true },
    { x: baseX + 18, z: baseZ - 8, h: 28, lattice: true },
    { x: baseX - 14, z: baseZ + 12, h: 34, lattice: false },
    { x: baseX + 10, z: baseZ + 16, h: 22, lattice: false },
    { x: baseX - 8, z: baseZ - 14, h: 18, lattice: true },
  ];

  for (const m of mastDefs) {
    if (m.lattice) {
      // Four-leg lattice tower
      const half = 1.1;
      const legs = [[-half, -half], [half, -half], [-half, half], [half, half]];
      for (const [lx, lz] of legs) {
        const mesh = new THREE.Mesh(legGeo, mats.galv);
        mesh.position.set(m.x + lx, GROUND_Y + m.h / 2, m.z + lz);
        mesh.scale.y = m.h;
        mesh.castShadow = true;
        root.add(mesh);
        addCollider(m.x + lx, GROUND_Y, m.z + lz, 0.45, m.h, 0.45);
      }
      // Cross braces every ~4 m (visual + mid collide rings)
      for (let y = 3; y < m.h; y += 4) {
        addBox(ctx, mats, 'oxide', m.x, GROUND_Y + y, m.z, half * 2 + 0.2, 0.12, 0.12, { collide: false });
        addBox(ctx, mats, 'oxide', m.x, GROUND_Y + y, m.z, 0.12, 0.12, half * 2 + 0.2, { collide: false });
        // Thick mid plate for readable collision without sealing the lattice
        if (y % 8 === 3) {
          addCollider(m.x, GROUND_Y + y - 0.15, m.z, half * 2.2, 0.35, half * 2.2);
        }
      }
      // Top platform
      addBox(ctx, mats, 'galv', m.x, GROUND_Y + m.h, m.z, 2.8, 0.25, 2.8);
      addCyl(ctx, mats, 'warnRed', m.x, GROUND_Y + m.h + 0.25, m.z, 0.15, 0.15, 2.2, { seg: 8 });
    } else {
      // Guyed tubular mast
      const mesh = new THREE.Mesh(mastSegGeo, mats.oxide);
      mesh.position.set(m.x, GROUND_Y + m.h / 2, m.z);
      mesh.scale.y = m.h;
      mesh.castShadow = true;
      root.add(mesh);
      addCollider(m.x, GROUND_Y, m.z, 0.55, m.h, 0.55);
      // Guy anchors — thick posts at 120° (flyable between); guy wires visual-only thin
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.4;
        const gx = m.x + Math.cos(a) * (m.h * 0.35);
        const gz = m.z + Math.sin(a) * (m.h * 0.35);
        addCyl(ctx, mats, 'concrete', gx, GROUND_Y, gz, 0.35, 0.45, 0.8, { seg: 8 });
        // Guy as thin decorative line (no collide — thin wire wouldn't stop a quad)
        const dx = gx - m.x, dz = gz - m.z, dy = m.h * 0.85;
        const guyLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const guy = new THREE.Mesh(
          track(new THREE.CylinderGeometry(0.03, 0.03, guyLen, 4)),
          mats.galv
        );
        guy.position.set((m.x + gx) / 2, GROUND_Y + dy / 2, (m.z + gz) / 2);
        guy.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(dx, dy, dz).normalize()
        );
        root.add(guy);
      }
      // Insulator stack mid
      const ins = new THREE.Mesh(insGeo, mats.warnYellow);
      ins.position.set(m.x, GROUND_Y + m.h * 0.55, m.z);
      ins.scale.y = 3;
      root.add(ins);
    }
  }

  // Equipment hut + pad between farm and silo
  const hx = (baseX + SILO_LF.x) / 2;
  const hz = (baseZ + SILO_LF.z) / 2;
  addBox(ctx, mats, 'concrete', hx, GROUND_Y, hz, 6, 2.8, 4.5);
  addBox(ctx, mats, 'oxide', hx, GROUND_Y + 2.8, hz, 6.4, 0.3, 4.9);
  addBox(ctx, mats, 'warnYellow', hx, GROUND_Y + 1.4, hz + 2.3, 4, 0.15, 0.1, { collide: false });

  // Cable trays / feed runs (merged collider) — fly-over / weave
  addBox(ctx, mats, 'galv', hx, GROUND_Y + 1.2, baseZ + 2, 28, 0.2, 0.5);
  addBox(ctx, mats, 'oxideDark', baseX + 4, GROUND_Y + 0.4, hz, 0.5, 0.2, 22);

  // Gravel pad under farm (visual)
  {
    const geo = track(new THREE.PlaneGeometry(50, 45));
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mats.soil);
    mesh.position.set(baseX, GROUND_Y + 0.04, baseZ);
    mesh.receiveShadow = true;
    root.add(mesh);
  }
}
