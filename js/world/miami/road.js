import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { assetLib } from '../../core/assets.js';
import {
  CITY_Y, ROAD_Z, CROSS_X, GAP_X, XS_HALF, XS_Z0, XS_Z1,
  CURB_BEACH_Z0, CURB_BEACH_Z1, CURB_CITY_Z0, CURB_CITY_Z1, CURB_H,
  SW_BEACH_Z0, SW_BEACH_Z1, SW_CITY_Z0, SW_CITY_Z1, SW_H,
  sidewalkRuns,
} from './constants.js';
import { roadTexture, setAoUVs } from './textures.js';

/**
 * Ocean Drive: asphalt + centre line, thin curbs, dedicated sidewalk slabs
 * (collider matches the visual slab, planting rows left open), zebra paint,
 * storm drains, and the cross streets running inland at every street gap.
 * Consumes no rng draws — safe to build at any point in the sequence.
 */
export async function buildRoad(ctx) {
  const { root, track, addCollider, setTag, asphaltSet, roadLinesSet, sidewalkSet } = ctx;

  // ---- carriageway ----
  {
    const geo = track(new THREE.PlaneGeometry(1240, 12));
    geo.rotateX(-Math.PI / 2);
    setAoUVs(geo);
    let mat;
    if (asphaltSet.map) {
      // the scan albedo is a pale dry grey; multiply it down so the roadway
      // reads as blacktop against the concrete promenade instead of matching it
      mat = await assetLib.pbrMaterial('asphalt', { repeat: [1240 / 3, 12 / 3], color: 0x7c8288 });
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
    // (canvas roadTexture fallback already carries baked markings)
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
  {
    const cwGeo = track(new THREE.BoxGeometry(3.6, 0.022, 0.62));
    const cwMat = track(new THREE.MeshStandardMaterial({ color: 0xe9e9e2, roughness: 0.85 }));
    const cwSpots = [];
    for (const cx of CROSS_X) {
      for (let z = 38.75; z <= 49.35; z += 1.18) cwSpots.push([cx, z]);
    }
    const cw = new THREE.InstancedMesh(cwGeo, cwMat, cwSpots.length);
    for (let i = 0; i < cwSpots.length; i++) {
      m4.makeTranslation(cwSpots[i][0], CITY_Y + 0.072, cwSpots[i][1]);
      cw.setMatrixAt(i, m4);
    }
    cw.instanceMatrix.needsUpdate = true;
    cw.receiveShadow = true;
    root.add(cw);
  }

  // ---- storm drains along both gutters, ~every 60 m (flush with surface) ----
  {
    const drGeo = track(new THREE.BoxGeometry(0.85, 0.02, 0.42));
    const drMat = track(new THREE.MeshStandardMaterial({ color: 0x14181c, roughness: 0.9, metalness: 0.25 }));
    const drSpots = [];
    for (let x = -570; x <= 570; x += 60) {
      if (CROSS_X.some((c) => Math.abs(x - c) < 5)) continue;
      drSpots.push([x, 38.08]); drSpots.push([x + 27, 49.92]);
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
  }
}
