import * as THREE from 'three';
import { assetLib } from '../../core/assets.js';
import { CITY_Y } from './constants.js';
import { roadTexture, setAoUVs } from './textures.js';

/** Ocean Drive asphalt + center-line markings. */
export async function buildRoad(ctx) {
  const { root, track, asphaltSet, roadLinesSet } = ctx;
  {
    const geo = track(new THREE.PlaneGeometry(1240, 12));
    geo.rotateX(-Math.PI / 2);
    setAoUVs(geo);
    let mat;
    if (asphaltSet.map) {
      mat = await assetLib.pbrMaterial('asphalt', { repeat: [1240 / 3, 12 / 3] });  // 1 tile ≈ 3 m
    } else {
      const roadTex = track(roadTexture());
      roadTex.repeat.set(90, 1);
      mat = track(new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.95 }));
    }
    const road = new THREE.Mesh(geo, mat);
    road.position.set(0, CITY_Y + 0.06, 44);
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
        m4.makeTranslation(-620 + SEG / 2 + i * SEG, CITY_Y + 0.08, 44);   // +0.02 above road
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
      strip.position.set(0, CITY_Y + 0.08, 44);
      root.add(strip);
    }
    // (canvas roadTexture fallback already carries baked markings)
  }
}
