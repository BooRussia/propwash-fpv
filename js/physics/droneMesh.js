// ============================================================
// PropWash FPV — drone visual mesh builder
//
// buildDroneMesh(spec) -> { group, update(dt, motorOutput, armed), dispose() }
//
// Primitive-built, visually distinct per class:
//   whoop      — ducted torus ring per prop, tiny canopy, belly battery
//   cinewhoop  — chunky open-cylinder ducts, boxy body, GoPro-ish block
//   freestyle  — true-X arms, plates + standoffs, strapped battery, antenna
//
// Props render as blade meshes when slow and cross-fade to translucent
// spin discs at speed. Rear LED strip is emissive (bloom-friendly).
// group origin = frame centre; scale is true to spec.sizeM (wheelbase).
// No allocations inside update().
// ============================================================

import * as THREE from 'three';

export function buildDroneMesh(spec) {
  const group = new THREE.Group();
  group.name = `drone-${(spec && spec.id) || 'quad'}`;

  const geometries = [];
  const materials = [];
  const G = (g) => { geometries.push(g); return g; };
  const M = (m) => { materials.push(m); return m; };

  const wb = (spec && spec.sizeM) || 0.2;                       // wheelbase m
  const mOff = (wb / 2) / Math.SQRT2;                            // motor x/z offset
  const propR = Math.max(0.012, ((spec && spec.propInches) || 3) * 0.0254 / 2);
  const cls = (spec && spec.class) || 'freestyle';
  const camTilt = THREE.MathUtils.degToRad((spec && spec.camTiltDefaultDeg) || 25);
  const accent = cls === 'whoop' ? 0x29d3ff : (cls === 'cinewhoop' ? 0xff7a2f : 0x37e08b);

  // ---------------- materials ----------------
  const frameMat = M(new THREE.MeshStandardMaterial({ color: 0x161a20, roughness: 0.85, metalness: 0.3 }));
  const accentMat = M(new THREE.MeshStandardMaterial({ color: accent, roughness: 0.45, metalness: 0.15 }));
  const motorMat = M(new THREE.MeshStandardMaterial({ color: 0x9aa2ad, roughness: 0.35, metalness: 0.9 }));
  const ductMat = M(new THREE.MeshStandardMaterial({ color: 0x22262d, roughness: 0.8, metalness: 0.2, side: THREE.DoubleSide }));
  const batteryMat = M(new THREE.MeshStandardMaterial({ color: 0x23262e, roughness: 0.7, metalness: 0.1 }));
  const strapMat = M(new THREE.MeshStandardMaterial({ color: 0x0e0f12, roughness: 0.95, metalness: 0 }));
  const camBodyMat = M(new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.4, metalness: 0.4 }));
  const gpMat = M(new THREE.MeshStandardMaterial({ color: 0x474c55, roughness: 0.55, metalness: 0.35 }));
  const lensMat = M(new THREE.MeshStandardMaterial({ color: 0x0e1b3a, roughness: 0.1, metalness: 0.8 }));
  const bladeMat = M(new THREE.MeshStandardMaterial({ color: cls === 'freestyle' ? 0x30353d : 0xd8e6ee, roughness: 0.55, metalness: 0.05 }));
  const discMat = M(new THREE.MeshBasicMaterial({ color: 0xaab6bf, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  const ledMat = M(new THREE.MeshStandardMaterial({ color: 0x050505, emissive: new THREE.Color(accent), emissiveIntensity: 2.2, roughness: 0.5 }));

  const addMesh = (geoObj, mat, parent, x = 0, y = 0, z = 0) => {
    const me = new THREE.Mesh(geoObj, mat);
    me.position.set(x, y, z);
    me.castShadow = true;
    (parent || group).add(me);
    return me;
  };

  // ---------------- props ----------------
  const bladeGeo = G(new THREE.BoxGeometry(propR * 0.95, propR * 0.07, propR * 0.24));
  const discGeo = G(new THREE.CircleGeometry(propR * 1.02, 24));
  const hubGeo = G(new THREE.CylinderGeometry(propR * 0.14, propR * 0.14, propR * 0.14, 10));
  const motorGeo = G(new THREE.CylinderGeometry(propR * 0.22, propR * 0.26, wb * 0.07, 12));
  const props = []; // { group, blades, disc, dir }

  function buildProp(x, y, z, dir) {
    const pg = new THREE.Group();
    pg.position.set(x, y, z);
    const blades = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const holder = new THREE.Group();
      holder.rotation.y = i * (Math.PI * 2 / 3);
      const b = new THREE.Mesh(bladeGeo, bladeMat);
      b.castShadow = true;
      b.position.x = propR * 0.52;
      b.rotation.x = dir * 0.42; // blade pitch twist
      holder.add(b);
      blades.add(holder);
    }
    pg.add(blades);
    const disc = new THREE.Mesh(discGeo, discMat); // castShadow stays false
    disc.rotation.x = -Math.PI / 2;
    disc.visible = false;
    pg.add(disc);
    const hub = new THREE.Mesh(hubGeo, motorMat);
    hub.castShadow = true;
    pg.add(hub);
    group.add(pg);
    props.push({ group: pg, blades, disc, dir });
  }

  const corners = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

  // ---------------- class-specific builds ----------------
  if (cls === 'whoop') {
    // Ducted frame ring per prop + tiny canopy.
    const ductGeo = G(new THREE.TorusGeometry(propR * 1.14, propR * 0.17, 10, 26));
    const braceGeo = G(new THREE.BoxGeometry(wb * 1.06, wb * 0.045, wb * 0.1));
    for (const [sx, sz] of corners) {
      const duct = addMesh(ductGeo, ductMat, group, sx * mOff, wb * 0.05, sz * mOff);
      duct.rotation.x = Math.PI / 2;
      addMesh(motorGeo, motorMat, group, sx * mOff, wb * 0.045, sz * mOff);
      buildProp(sx * mOff, wb * 0.095, sz * mOff, sx * sz > 0 ? 1 : -1);
    }
    const b1 = addMesh(braceGeo, frameMat, group, 0, wb * 0.03, 0);
    b1.rotation.y = Math.PI / 4;
    const b2 = addMesh(braceGeo, frameMat, group, 0, wb * 0.03, 0);
    b2.rotation.y = -Math.PI / 4;
    // Canopy
    const canGeo = G(new THREE.ConeGeometry(wb * 0.16, wb * 0.24, 4));
    const can = addMesh(canGeo, accentMat, group, 0, wb * 0.15, wb * 0.02);
    can.rotation.y = Math.PI / 4;
    // Nano cam
    const camGeo = G(new THREE.BoxGeometry(wb * 0.1, wb * 0.1, wb * 0.08));
    const cam = addMesh(camGeo, camBodyMat, group, 0, wb * 0.14, -wb * 0.15);
    cam.rotation.x = camTilt;
    const lensGeo = G(new THREE.CylinderGeometry(wb * 0.032, wb * 0.032, wb * 0.05, 12));
    const lens = addMesh(lensGeo, lensMat, cam, 0, 0, -wb * 0.05);
    lens.rotation.x = Math.PI / 2;
    // 1S battery slung under
    const battGeo = G(new THREE.BoxGeometry(wb * 0.36, wb * 0.11, wb * 0.16));
    addMesh(battGeo, batteryMat, group, 0, -wb * 0.045, 0);
    // Rear LED strip
    const ledGeo = G(new THREE.BoxGeometry(wb * 0.2, wb * 0.035, wb * 0.02));
    addMesh(ledGeo, ledMat, group, 0, wb * 0.045, wb * 0.36);

  } else if (cls === 'cinewhoop') {
    // Chunky open-cylinder ducts + boxy body + GoPro-ish block.
    const ductGeo = G(new THREE.CylinderGeometry(propR * 1.22, propR * 1.34, propR * 0.8, 20, 1, true));
    const braceGeo = G(new THREE.BoxGeometry(wb * 1.02, wb * 0.05, wb * 0.12));
    for (const [sx, sz] of corners) {
      addMesh(ductGeo, ductMat, group, sx * mOff, wb * 0.055, sz * mOff);
      addMesh(motorGeo, motorMat, group, sx * mOff, wb * 0.04, sz * mOff);
      buildProp(sx * mOff, wb * 0.085, sz * mOff, sx * sz > 0 ? 1 : -1);
    }
    const b1 = addMesh(braceGeo, frameMat, group, 0, wb * 0.03, 0);
    b1.rotation.y = Math.PI / 4;
    const b2 = addMesh(braceGeo, frameMat, group, 0, wb * 0.03, 0);
    b2.rotation.y = -Math.PI / 4;
    // Central body
    const bodyGeo = G(new THREE.BoxGeometry(wb * 0.4, wb * 0.18, wb * 0.5));
    addMesh(bodyGeo, frameMat, group, 0, wb * 0.1, 0);
    const topGeo = G(new THREE.BoxGeometry(wb * 0.3, wb * 0.05, wb * 0.34));
    addMesh(topGeo, accentMat, group, 0, wb * 0.21, wb * 0.04);
    // GoPro-ish block, tilted up front
    const gpGeo = G(new THREE.BoxGeometry(wb * 0.2, wb * 0.15, wb * 0.14));
    const gp = addMesh(gpGeo, gpMat, group, 0, wb * 0.26, -wb * 0.16);
    gp.rotation.x = camTilt;
    const gpLensGeo = G(new THREE.CylinderGeometry(wb * 0.045, wb * 0.045, wb * 0.05, 14));
    const gpLens = addMesh(gpLensGeo, lensMat, gp, wb * 0.04, wb * 0.03, -wb * 0.075);
    gpLens.rotation.x = Math.PI / 2;
    // Battery underneath with strap
    const battGeo = G(new THREE.BoxGeometry(wb * 0.34, wb * 0.12, wb * 0.4));
    addMesh(battGeo, batteryMat, group, 0, -wb * 0.02, 0);
    const strapGeo = G(new THREE.BoxGeometry(wb * 0.36, wb * 0.135, wb * 0.09));
    addMesh(strapGeo, strapMat, group, 0, -wb * 0.02, 0);
    // Rear LED strip
    const ledGeo = G(new THREE.BoxGeometry(wb * 0.26, wb * 0.04, wb * 0.02));
    addMesh(ledGeo, ledMat, group, 0, wb * 0.12, wb * 0.26);

  } else {
    // Freestyle 5-inch: true-X arms, stacked plates, battery on top.
    const armLen = mOff + propR * 0.4;
    const armGeo = G(new THREE.BoxGeometry(armLen, wb * 0.03, wb * 0.075));
    for (const [sx, sz] of corners) {
      const arm = addMesh(armGeo, frameMat, group,
        sx * armLen / (2 * Math.SQRT2), 0, sz * armLen / (2 * Math.SQRT2));
      arm.rotation.y = Math.atan2(-sz, sx);
      addMesh(motorGeo, motorMat, group, sx * mOff, wb * 0.05, sz * mOff);
      buildProp(sx * mOff, wb * 0.095, sz * mOff, sx * sz > 0 ? 1 : -1);
    }
    // Bottom + top plates, standoffs
    const plateGeo = G(new THREE.BoxGeometry(wb * 0.36, wb * 0.018, wb * 0.58));
    addMesh(plateGeo, frameMat, group, 0, wb * 0.014, 0);
    addMesh(plateGeo, frameMat, group, 0, wb * 0.13, 0);
    const soGeo = G(new THREE.CylinderGeometry(wb * 0.011, wb * 0.011, wb * 0.115, 8));
    for (const [sx, sz] of corners) {
      addMesh(soGeo, motorMat, group, sx * wb * 0.13, wb * 0.072, sz * wb * 0.22);
    }
    // Battery on top with strap
    const battGeo = G(new THREE.BoxGeometry(wb * 0.28, wb * 0.14, wb * 0.5));
    addMesh(battGeo, batteryMat, group, 0, wb * 0.215, wb * 0.02);
    const strapGeo = G(new THREE.BoxGeometry(wb * 0.3, wb * 0.155, wb * 0.09));
    addMesh(strapGeo, strapMat, group, 0, wb * 0.215, wb * 0.02);
    // FPV cam up front
    const camGeo = G(new THREE.BoxGeometry(wb * 0.12, wb * 0.11, wb * 0.09));
    const cam = addMesh(camGeo, camBodyMat, group, 0, wb * 0.075, -wb * 0.26);
    cam.rotation.x = camTilt;
    const lensGeo = G(new THREE.CylinderGeometry(wb * 0.034, wb * 0.034, wb * 0.05, 12));
    const lens = addMesh(lensGeo, lensMat, cam, 0, 0, -wb * 0.055);
    lens.rotation.x = Math.PI / 2;
    // Antenna sweeping up and back
    const antGeo = G(new THREE.CylinderGeometry(wb * 0.008, wb * 0.008, wb * 0.34, 8));
    const ant = addMesh(antGeo, frameMat, group, 0, wb * 0.249, wb * 0.402);
    ant.rotation.x = 0.8;
    const tipGeo = G(new THREE.SphereGeometry(wb * 0.022, 8, 6));
    addMesh(tipGeo, accentMat, group, 0, wb * 0.368, wb * 0.524);
    // Rear LED strip
    const ledGeo = G(new THREE.BoxGeometry(wb * 0.24, wb * 0.035, wb * 0.02));
    addMesh(ledGeo, ledMat, group, 0, wb * 0.05, wb * 0.3);
  }

  // ---------------- runtime ----------------
  let time = 0;
  let spin = 0; // filtered visual spin rate, rad/s

  function update(dt, motorOutput, armed) {
    if (!(dt > 0) || !Number.isFinite(dt)) dt = 0;
    time += dt;
    const m = Math.min(Math.max(motorOutput || 0, 0), 1);
    const target = armed ? 30 + 260 * m : 0;
    spin += (target - spin) * Math.min(1, dt * 7);

    const discOp = Math.min(Math.max((spin - 55) / 90, 0), 1) * 0.42;
    discMat.opacity = discOp;
    const showBlades = spin < 115;
    const showDisc = discOp > 0.02;
    for (let i = 0; i < props.length; i++) {
      const p = props[i];
      p.group.rotation.y += p.dir * spin * dt;
      if (p.blades.visible !== showBlades) p.blades.visible = showBlades;
      if (p.disc.visible !== showDisc) p.disc.visible = showDisc;
    }
    // LED: solid when armed, slow breathing pulse when disarmed.
    ledMat.emissiveIntensity = armed ? 2.4 : 1.1 + (Math.sin(time * 4.2) + 1) * 0.55;
  }

  function dispose() {
    for (let i = 0; i < geometries.length; i++) {
      try { geometries[i].dispose(); } catch (e) { /* already freed */ }
    }
    for (let i = 0; i < materials.length; i++) {
      try { materials[i].dispose(); } catch (e) { /* already freed */ }
    }
    geometries.length = 0;
    materials.length = 0;
  }

  return { group, update, dispose };
}
