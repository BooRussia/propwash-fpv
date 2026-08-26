import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { assetLib } from '../../core/assets.js';
import {
  CITY_Y, ROAD_Z, ROAD_VISUAL_W, CROSS_X, GAP_X, XS_HALF, XS_Z0, XS_Z1,
  CURB_BEACH_Z0, CURB_BEACH_Z1, CURB_CITY_Z0, CURB_CITY_Z1, CURB_H,
  SW_BEACH_Z0, SW_BEACH_Z1, SW_CITY_Z0, SW_CITY_Z1, SW_H,
  sidewalkRuns,
} from './constants.js';
import { roadTexture, setAoUVs } from './textures.js';
import { cBox, cCyl } from './geo.js';

/**
 * Ocean Drive: 14 m asphalt (park + travel + travel + park), centre line,
 * edge/lane paint, stall ticks, thin curbs, dedicated sidewalk slabs
 * (collider matches the visual slab, planting rows left open), zebra paint,
 * storm drains, signals, and the cross streets inland at every street gap.
 * Consumes no rng draws — safe to build at any point in the sequence.
 */
export async function buildRoad(ctx) {
  const { root, track, addCollider, addCyl, setTag, asphaltSet, roadLinesSet, sidewalkSet } = ctx;

  // ---- carriageway ----
  {
    const geo = track(new THREE.PlaneGeometry(1240, ROAD_VISUAL_W));
    geo.rotateX(-Math.PI / 2);
    setAoUVs(geo);
    let mat;
    if (asphaltSet.map) {
      // the scan albedo is a pale dry grey; multiply it down so the roadway
      // reads as blacktop against the concrete promenade instead of matching it
      mat = await assetLib.pbrMaterial('asphalt', {
        repeat: [1240 / 3, ROAD_VISUAL_W / 3], color: 0x7c8288,
      });
    } else {
      const roadTex = track(roadTexture());
      roadTex.repeat.set(90, 1);
      mat = track(new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.95 }));
    }
    const road = new THREE.Mesh(geo, mat);
    road.position.set(0, CITY_Y + 0.06, ROAD_Z);
    road.receiveShadow = true;
    root.add(road);

    if (asphaltSet.map && roadLinesSet.map && roadLinesSet.alphaMap) {
      // yellow dashed center line — crop the dashed-strip column out of the
      // road_lines decal atlas (albedo = paint color, opacity = marking mask)
      const crop = (t) => {
        const c = t.clone();
        c.wrapS = c.wrapT = THREE.ClampToEdgeWrapping;
        c.offset.set(742 / 1024, 0.355);
        c.repeat.set(28 / 1024, 0.30);
        c.needsUpdate = true;
        return track(c);
      };
      const lineMat = track(new THREE.MeshStandardMaterial({
        map: crop(roadLinesSet.map),
        alphaMap: crop(roadLinesSet.alphaMap),
        transparent: true,
        depthWrite: false,
        roughness: 0.6,
        metalness: 0,
      }));
      const SEG = 48;                                     // meters of dashes per instance
      const lineGeo = track(new THREE.PlaneGeometry(0.45, SEG));
      lineGeo.rotateX(-Math.PI / 2);
      lineGeo.rotateY(Math.PI / 2);                       // dash direction along X
      const count = Math.ceil(1240 / SEG);
      const line = new THREE.InstancedMesh(lineGeo, lineMat, count);
      const m4 = new THREE.Matrix4();
      for (let i = 0; i < count; i++) {
        m4.makeTranslation(-620 + SEG / 2 + i * SEG, CITY_Y + 0.08, ROAD_Z);   // +0.02 above road
        line.setMatrixAt(i, m4);
      }
      line.instanceMatrix.needsUpdate = true;
      root.add(line);
    } else if (asphaltSet.map) {
      // asphalt present but decal atlas missing → canvas dash strip
      const c = document.createElement('canvas');
      c.width = 256; c.height = 16;
      const g = c.getContext('2d');
      g.clearRect(0, 0, 256, 16);
      g.fillStyle = '#e8c545';
      for (let x = 0; x < 256; x += 42) g.fillRect(x, 5, 22, 6);
      const tex = track(new THREE.CanvasTexture(c));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(90, 1);
      const mat2 = track(new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.6 }));
      const geo2 = track(new THREE.PlaneGeometry(1240, 0.5));
      geo2.rotateX(-Math.PI / 2);
      const strip = new THREE.Mesh(geo2, mat2);
      strip.position.set(0, CITY_Y + 0.08, ROAD_Z);
      root.add(strip);
    }
    // (canvas roadTexture fallback already carries baked centre dashes)
  }

  // ---- lane paint: white edges, parking/travel splits, stall ticks ----
  // The 2D site plan owns edge/centre/dash/stall paint when present.
  if (!ctx.sitePlan) {
    const Y = CITY_Y + 0.082;
    const whiteMat = track(new THREE.MeshStandardMaterial({
      color: 0xe9e9e2, roughness: 0.62, metalness: 0, depthWrite: false,
    }));
    const yellowMat = track(new THREE.MeshStandardMaterial({
      color: 0xe8c545, roughness: 0.58, metalness: 0, depthWrite: false,
    }));
    const stampRun = (w, d, x, z, mat) => {
      const g = track(new THREE.PlaneGeometry(w, d));
      g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, mat);
      m.position.set(x, Y, z);
      m.receiveShadow = true;
      root.add(m);
    };
    // solid edge lines just inside the 14 m slab
    stampRun(1240, 0.12, 0, ROAD_Z - 6.88, whiteMat);
    stampRun(1240, 0.12, 0, ROAD_Z + 6.88, whiteMat);
    // double yellow at centre (two-way)
    stampRun(1240, 0.09, 0, ROAD_Z - 0.12, yellowMat);
    stampRun(1240, 0.09, 0, ROAD_Z + 0.12, yellowMat);

    const dashGeo = track(new THREE.PlaneGeometry(3.2, 0.1));
    dashGeo.rotateX(-Math.PI / 2);
    const dashZ = [ROAD_Z - 3.9, ROAD_Z + 3.9];           // parking | travel
    const dashCount = Math.ceil(1240 / 9.5);
    const dashes = new THREE.InstancedMesh(dashGeo, whiteMat, dashCount * dashZ.length);
    const mDash = new THREE.Matrix4();
    let di = 0;
    for (const z of dashZ) {
      for (let i = 0; i < dashCount; i++) {
        const x = -620 + 4.8 + i * 9.5;
        if (GAP_X.some((c) => Math.abs(x - c) < 8)) continue;
        mDash.makeTranslation(x, Y, z);
        dashes.setMatrixAt(di++, mDash);
      }
    }
    dashes.count = di;
    dashes.instanceMatrix.needsUpdate = true;
    dashes.receiveShadow = true;
    root.add(dashes);

    // parking stall ticks (T-marks) on both shoulders
    const tickGeo = track(new THREE.PlaneGeometry(0.1, 2.15));
    tickGeo.rotateX(-Math.PI / 2);
    const tickSpots = [];
    for (let x = -600; x <= 600; x += 6.4) {
      if (GAP_X.some((c) => Math.abs(x - c) < 9)) continue;
      if (CROSS_X.some((c) => Math.abs(x - c) < 5)) continue;
      tickSpots.push([x, ROAD_Z - 5.75]);
      tickSpots.push([x, ROAD_Z + 5.75]);
    }
    const ticks = new THREE.InstancedMesh(tickGeo, whiteMat, tickSpots.length);
    for (let i = 0; i < tickSpots.length; i++) {
      mDash.makeTranslation(tickSpots[i][0], Y, tickSpots[i][1]);
      ticks.setMatrixAt(i, mDash);
    }
    ticks.instanceMatrix.needsUpdate = true;
    ticks.receiveShadow = true;
    root.add(ticks);
  }

  // ---- thin curbs + dedicated sidewalk slabs ----
  // The old 2.4 m "curb" was a fat shoulder: roadway-adjacent atlas wrapping
  // the walk and a collider (once added) that blocked the 36.5 / 51.5 planting
  // row. Curb is now a 0.38 m face; the walk is its own paver slab whose
  // collider matches the visual. Cross streets cut both so CROSS_X stays paint.
  {
    const runs = sidewalkRuns();
    const curbGeos = [];
    const swGeos = [];
    const addRun = (geos, x0, x1, z0, z1, h) => {
      const len = x1 - x0, depth = z1 - z0;
      if (len < 1.2 || depth < 0.12) return;
      geos.push(new THREE.BoxGeometry(len, h, depth)
        .translate((x0 + x1) / 2, CITY_Y + h / 2, (z0 + z1) / 2));
    };
    setTag('curb');
    for (const run of runs) {
      addRun(curbGeos, run.x0, run.x1, CURB_BEACH_Z0, CURB_BEACH_Z1, CURB_H);
      addRun(curbGeos, run.x0, run.x1, CURB_CITY_Z0, CURB_CITY_Z1, CURB_H);
      addCollider((run.x0 + run.x1) / 2, CITY_Y, (CURB_BEACH_Z0 + CURB_BEACH_Z1) / 2,
        run.x1 - run.x0, CURB_H, CURB_BEACH_Z1 - CURB_BEACH_Z0);
      addCollider((run.x0 + run.x1) / 2, CITY_Y, (CURB_CITY_Z0 + CURB_CITY_Z1) / 2,
        run.x1 - run.x0, CURB_H, CURB_CITY_Z1 - CURB_CITY_Z0);
    }
    setTag('sidewalk');
    for (const run of runs) {
      addRun(swGeos, run.x0, run.x1, SW_BEACH_Z0, SW_BEACH_Z1, SW_H);
      addRun(swGeos, run.x0, run.x1, SW_CITY_Z0, SW_CITY_Z1, SW_H);
      addCollider((run.x0 + run.x1) / 2, CITY_Y, (SW_BEACH_Z0 + SW_BEACH_Z1) / 2,
        run.x1 - run.x0, SW_H, SW_BEACH_Z1 - SW_BEACH_Z0);
      addCollider((run.x0 + run.x1) / 2, CITY_Y, (SW_CITY_Z0 + SW_CITY_Z1) / 2,
        run.x1 - run.x0, SW_H, SW_CITY_Z1 - SW_CITY_Z0);
    }
    if (curbGeos.length) {
      const curbGeo = track(mergeGeometries(curbGeos));
      curbGeos.forEach((g) => g.dispose());
      setAoUVs(curbGeo);
      const curbMat = track(new THREE.MeshStandardMaterial({
        color: 0x7a7670, roughness: 0.92, metalness: 0.02,
      }));
      const curbs = new THREE.Mesh(curbGeo, curbMat);
      curbs.receiveShadow = true;
      curbs.name = 'ocean-drive-curbs';
      root.add(curbs);
    }
    if (swGeos.length) {
      const swGeo = track(mergeGeometries(swGeos));
      swGeos.forEach((g) => g.dispose());
      setAoUVs(swGeo);
      let swMat;
      if (sidewalkSet.map) {
        // paver scale ~0.55 m — not the city-plateau 2 m tile, not asphalt
        swMat = await assetLib.pbrMaterial('sidewalk', { repeat: [1240 / 0.55, 1.9 / 0.55] });
      } else {
        swMat = track(new THREE.MeshStandardMaterial({ color: 0xb4b0a6, roughness: 0.94 }));
      }
      const walks = new THREE.Mesh(swGeo, swMat);
      walks.receiveShadow = true;
      walks.name = 'ocean-drive-sidewalks';
      root.add(walks);
    }
    setTag('world');
  }

  // ---- zebra crosswalks — thin opaque bars flush on the asphalt ----
  const m4 = new THREE.Matrix4();
  if (!ctx.sitePlan) {
    const cwGeo = track(new THREE.BoxGeometry(3.6, 0.022, 0.62));
    const cwMat = track(new THREE.MeshStandardMaterial({ color: 0xe9e9e2, roughness: 0.85 }));
    const cwSpots = [];
    for (const cx of GAP_X) {
      for (let z = 37.45; z <= 50.55; z += 1.18) cwSpots.push([cx, z]);
    }
    const cw = new THREE.InstancedMesh(cwGeo, cwMat, cwSpots.length);
    for (let i = 0; i < cwSpots.length; i++) {
      m4.makeTranslation(cwSpots[i][0], CITY_Y + 0.072, cwSpots[i][1]);
      cw.setMatrixAt(i, m4);
    }
    cw.instanceMatrix.needsUpdate = true;
    cw.receiveShadow = true;
    root.add(cw);

    // stop bars just before the two signed zebras
    const barMat = track(new THREE.MeshStandardMaterial({ color: 0xe9e9e2, roughness: 0.8 }));
    const barGeo = track(new THREE.BoxGeometry(0.45, 0.02, 3.4));
    const bars = new THREE.InstancedMesh(barGeo, barMat, CROSS_X.length * 2);
    let bi = 0;
    for (const cx of CROSS_X) {
      m4.makeTranslation(cx - 2.4, CITY_Y + 0.072, 41.7);
      bars.setMatrixAt(bi++, m4);
      m4.makeTranslation(cx + 2.4, CITY_Y + 0.072, 46.3);
      bars.setMatrixAt(bi++, m4);
    }
    bars.instanceMatrix.needsUpdate = true;
    root.add(bars);
  }

  // ---- storm drains along both gutters, ~every 60 m (flush with surface) ----
  {
    const drGeo = track(new THREE.BoxGeometry(0.85, 0.02, 0.42));
    const drMat = track(new THREE.MeshStandardMaterial({ color: 0x14181c, roughness: 0.9, metalness: 0.25 }));
    const drSpots = [];
    for (let x = -570; x <= 570; x += 60) {
      if (CROSS_X.some((c) => Math.abs(x - c) < 5)) continue;
      drSpots.push([x, 37.35]); drSpots.push([x + 27, 50.65]);
    }
    const drains = new THREE.InstancedMesh(drGeo, drMat, drSpots.length);
    for (let i = 0; i < drSpots.length; i++) {
      m4.makeTranslation(drSpots[i][0], CITY_Y + 0.071, drSpots[i][1]);
      drains.setMatrixAt(i, m4);
    }
    drains.instanceMatrix.needsUpdate = true;
    root.add(drains);
  }

  // ---- cross streets: asphalt running inland at every street gap ----
  {
    const xsGeos = [];
    for (const cx of GAP_X) {
      const g = new THREE.PlaneGeometry(XS_HALF * 2, XS_Z1 - XS_Z0);
      g.rotateX(-Math.PI / 2);
      g.translate(cx, CITY_Y + 0.055, (XS_Z0 + XS_Z1) / 2);
      xsGeos.push(g);
    }
    const xsGeo = track(mergeGeometries(xsGeos));
    xsGeos.forEach((g) => g.dispose());
    setAoUVs(xsGeo);
    let xsMat;
    if (asphaltSet.map) {
      xsMat = await assetLib.pbrMaterial('asphalt', {
        repeat: [(XS_HALF * 2) / 3, (XS_Z1 - XS_Z0) / 3], color: 0x7c8288,
      });
    } else {
      xsMat = track(new THREE.MeshStandardMaterial({ color: 0x33363a, roughness: 0.96 }));
    }
    const xs = new THREE.Mesh(xsGeo, xsMat);
    xs.receiveShadow = true;
    root.add(xs);

    // sidewalk kerbs down both sides of every cross street
    const kGeos = [];
    for (const cx of GAP_X) {
      for (const s of [-1, 1]) {
        kGeos.push(new THREE.BoxGeometry(0.5, 0.15, XS_Z1 - XS_Z0)
          .translate(cx + s * (XS_HALF + 0.25), CITY_Y + 0.075, (XS_Z0 + XS_Z1) / 2));
      }
    }
    const kGeo = track(mergeGeometries(kGeos));
    kGeos.forEach((g) => g.dispose());
    const kMat = track(new THREE.MeshStandardMaterial({ color: 0x8f8a80, roughness: 0.94 }));
    const kerbs = new THREE.Mesh(kGeo, kMat);
    kerbs.receiveShadow = true;
    root.add(kerbs);

    // paver walks along both sides of every cross street
    const xsWalk = [];
    for (const cx of GAP_X) {
      for (const s of [-1, 1]) {
        const wz = XS_Z1 - XS_Z0;
        const wx = cx + s * (XS_HALF + 1.45);
        xsWalk.push(new THREE.BoxGeometry(1.8, SW_H, wz)
          .translate(wx, CITY_Y + SW_H / 2, (XS_Z0 + XS_Z1) / 2));
        addCollider(wx, CITY_Y, (XS_Z0 + XS_Z1) / 2, 1.8, SW_H, wz);
      }
    }
    const xsWalkGeo = track(mergeGeometries(xsWalk));
    xsWalk.forEach((g) => g.dispose());
    setAoUVs(xsWalkGeo);
    let xsWalkMat;
    if (sidewalkSet.map) {
      xsWalkMat = await assetLib.pbrMaterial('sidewalk', {
        repeat: [1.8 / 0.55, (XS_Z1 - XS_Z0) / 0.55],
      });
    } else {
      xsWalkMat = track(new THREE.MeshStandardMaterial({ color: 0xb4b0a6, roughness: 0.94 }));
    }
    const xsWalks = new THREE.Mesh(xsWalkGeo, xsWalkMat);
    xsWalks.receiveShadow = true;
    xsWalks.name = 'cross-street-sidewalks';
    root.add(xsWalks);
  }

  // ---- signals + stop signs at every Ocean Drive gap (no rng) ----
  {
    setTag('signal');
    const pole = 0x3a4148, head = 0x1a1d22, visor = 0x101214;
    const red = 0xcc2a2a, yel = 0xd4a017, grn = 0x2d9b4a;
    const lightParts = [
      cCyl(0.07, 0.09, 5.4, 8, pole, 0, 2.7, 0),
      cBox(0.42, 1.22, 0.34, head, 0, 5.58, -0.18),
      cBox(0.46, 1.26, 0.06, visor, 0, 5.58, -0.36),
      cCyl(0.1, 0.1, 0.05, 10, red, 0, 5.92, -0.38, Math.PI / 2),
      cCyl(0.1, 0.1, 0.05, 10, yel, 0, 5.58, -0.38, Math.PI / 2),
      cCyl(0.1, 0.1, 0.05, 10, grn, 0, 5.24, -0.38, Math.PI / 2),
      cBox(0.28, 0.08, 1.15, pole, 0, 5.95, 0.4),
    ];
    const lightGeo = track(mergeGeometries(lightParts));
    lightParts.forEach((g) => g.dispose());
    const signParts = [
      cCyl(0.035, 0.04, 2.35, 6, pole, 0, 1.18, 0),
      cBox(0.72, 0.72, 0.05, 0xc0392b, 0, 2.55, 0),
      cBox(0.58, 0.14, 0.04, 0xf2eee6, 0, 2.55, 0.03),
    ];
    const signGeo = track(mergeGeometries(signParts));
    signParts.forEach((g) => g.dispose());
    const sigMat = track(new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.55, metalness: 0.18,
    }));

    const lightSpots = [];
    const signSpots = [];
    for (const cx of GAP_X) {
      const hero = CROSS_X.includes(cx);
      const corners = hero
        ? [
          [-(XS_HALF + 1.35), 35.18, 0],
          [XS_HALF + 1.35, 35.18, Math.PI],
          [-(XS_HALF + 1.35), 53.52, 0],
          [XS_HALF + 1.35, 53.52, Math.PI],
        ]
        : [
          [-(XS_HALF + 1.35), 35.18, 0],
          [XS_HALF + 1.35, 53.52, Math.PI],
        ];
      for (const [dx, z, ry] of corners) {
        lightSpots.push({ x: cx + dx, z, ry });
        addCyl(cx + dx, CITY_Y, z, 0.12, 5.5);
      }
      signSpots.push({ x: cx + 3.55, z: 50.72, ry: Math.PI });
      signSpots.push({ x: cx - 3.55, z: 37.28, ry: 0 });
      addCyl(cx + 3.55, CITY_Y, 50.72, 0.08, 2.5);
      addCyl(cx - 3.55, CITY_Y, 37.28, 0.08, 2.5);
    }
    const lights = new THREE.InstancedMesh(lightGeo, sigMat, lightSpots.length);
    const signs = new THREE.InstancedMesh(signGeo, sigMat, signSpots.length);
    for (let i = 0; i < lightSpots.length; i++) {
      const s = lightSpots[i];
      m4.makeRotationY(s.ry);
      m4.setPosition(s.x, CITY_Y, s.z);
      lights.setMatrixAt(i, m4);
    }
    for (let i = 0; i < signSpots.length; i++) {
      const s = signSpots[i];
      m4.makeRotationY(s.ry);
      m4.setPosition(s.x, CITY_Y, s.z);
      signs.setMatrixAt(i, m4);
    }
    lights.instanceMatrix.needsUpdate = true;
    signs.instanceMatrix.needsUpdate = true;
    lights.castShadow = true;
    signs.castShadow = true;
    lights.name = 'ocean-drive-signals';
    signs.name = 'ocean-drive-stops';
    root.add(lights);
    root.add(signs);
    setTag('world');
  }
}
