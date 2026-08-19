// ============================================================
// Miami near-field dirt fill — instanced blades on leftover dirt.
//
// Not a biome. Not a lawn. Not a second scatterer.
// Planted from the tessellated leftover-dirt hull via tryPlace
// (same onPavement reject-or-drop graph palms already use).
//
// Methods only from the Sylva study (MengTo/sylva has no license):
//   tessellated hull, density = area × cover², one ground hull
//   collider, GPU wind, gust from the craft. Their vertex-wind listing
//   and custom-shader material are not pasted here.
// ============================================================
import * as THREE from 'three';
import {
  BLADE_AABB,
  BLADE_HULL_COLLIDER,
  placeBladePlan,
  planDirtBlades,
} from './planting.js';

export {
  BLADE_AABB, BLADE_CEILING, BLADE_FAR_BUDGET, BLADE_HULL_COLLIDER,
  BLADE_NEAR_BUDGET, COVER_FAR, COVER_NEAR, planDirtBlades, placeBladePlan,
  tryPlace,
} from './planting.js';

// Documentary green — muted olive, not a neon lawn plate.
const NEAR_BASE = new THREE.Color(0x2a3d28);
const NEAR_TIP = new THREE.Color(0x6a7a48);
const FAR_BASE = new THREE.Color(0x2e3a2c);
const FAR_TIP = new THREE.Color(0x5a6844);

function bladeGeo(segs, h, w) {
  const geo = new THREE.BufferGeometry();
  const vCount = (segs + 1) * 2;
  const pos = new Float32Array(vCount * 3);
  const col = new Float32Array(vCount * 3);
  const nrm = new Float32Array(vCount * 3);
  const idx = new Uint16Array(segs * 6);
  const base = NEAR_BASE;
  const tip = NEAR_TIP;
  for (let s = 0; s <= segs; s++) {
    const t = s / segs;
    const y = t * h;
    const hw = w * (1 - t * 0.78) * 0.5;
    const i0 = s * 2;
    pos[i0 * 3] = -hw; pos[i0 * 3 + 1] = y; pos[i0 * 3 + 2] = 0;
    pos[(i0 + 1) * 3] = hw; pos[(i0 + 1) * 3 + 1] = y; pos[(i0 + 1) * 3 + 2] = 0;
    const r = base.r + (tip.r - base.r) * t;
    const g = base.g + (tip.g - base.g) * t;
    const b = base.b + (tip.b - base.b) * t;
    col[i0 * 3] = r; col[i0 * 3 + 1] = g; col[i0 * 3 + 2] = b;
    col[(i0 + 1) * 3] = r; col[(i0 + 1) * 3 + 1] = g; col[(i0 + 1) * 3 + 2] = b;
    nrm[i0 * 3 + 2] = 1;
    nrm[(i0 + 1) * 3 + 2] = 1;
    if (s < segs) {
      const o = s * 6;
      idx[o] = i0; idx[o + 1] = i0 + 1; idx[o + 2] = i0 + 2;
      idx[o + 3] = i0 + 1; idx[o + 4] = i0 + 3; idx[o + 5] = i0 + 2;
    }
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return geo;
}

function farBladeGeo() {
  const geo = bladeGeo(1, 0.22, 0.038);
  const col = geo.attributes.color;
  for (let i = 0; i < col.count; i++) {
    const t = i < 2 ? 0 : 1;
    col.setXYZ(
      i,
      FAR_BASE.r + (FAR_TIP.r - FAR_BASE.r) * t,
      FAR_BASE.g + (FAR_TIP.g - FAR_BASE.g) * t,
      FAR_BASE.b + (FAR_TIP.b - FAR_BASE.b) * t,
    );
  }
  return geo;
}

function stockMat() {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
    vertexColors: true,
    side: THREE.DoubleSide,
    fog: true,
  });
}

/**
 * Original TSL wind graph. Gust uniform is the craft position — the
 * loop writes it. Their listed vertex-wind snippet is not used.
 *
 * The app renderer is still WebGLRenderer (#25 same constraint): the
 * hero field is stock MeshStandardMaterial. This graph is the TSL
 * path — attach when a node renderer is present. Never pulls the
 * webgpu build on the Miami boot path.
 */
export function tslPositionNode(tsl, gustUniform) {
  const {
    Fn, cos, float, instanceIndex, modelWorldMatrix, positionLocal,
    sin, smoothstep, time, vec4,
  } = tsl;
  return Fn(() => {
    const p = positionLocal.toVar();
    const h = p.y.max(0.0);
    const origin = modelWorldMatrix.mul(vec4(0, 0, 0, 1)).xyz;
    const phase = time.mul(1.35)
      .add(origin.x.mul(0.31))
      .add(origin.z.mul(0.27))
      .add(instanceIndex.toFloat().mul(0.019));
    const swayX = sin(phase).mul(h).mul(0.16);
    const swayZ = cos(phase.mul(0.81)).mul(h).mul(0.10);
    const dx = origin.x.sub(gustUniform.x);
    const dz = origin.z.sub(gustUniform.z);
    const dist = dx.mul(dx).add(dz.mul(dz)).sqrt();
    const fall = float(1).sub(smoothstep(float(0.25), float(2.6), dist));
    const push = fall.mul(h).mul(0.48);
    const inv = dist.add(0.08);
    p.x.addAssign(swayX.add(dx.mul(push).div(inv)));
    p.z.addAssign(swayZ.add(dz.mul(push).div(inv)));
    return p;
  })();
}

/** Optional TSL attach. Not called from buildBlades (WebGL boot). */
export async function attachTslWind(gustUniform) {
  const tsl = await import('three/tsl');
  const { MeshStandardNodeMaterial } = await import('three/webgpu');
  if (!MeshStandardNodeMaterial || !tsl.Fn) return null;
  const mat = new MeshStandardNodeMaterial();
  mat.color = new THREE.Color(0xffffff);
  mat.roughness = 1;
  mat.metalness = 0;
  mat.vertexColors = true;
  mat.side = THREE.DoubleSide;
  mat.fog = true;
  mat.positionNode = tslPositionNode(tsl, tsl.uniform(gustUniform));
  return mat;
}

function stampField(im, list) {
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    e.set(0, b.yaw, 0);
    q.setFromEuler(e);
    s.set(b.sc, b.sc, b.sc);
    p.set(b.x, b.y, b.z);
    m4.compose(p, q, s);
    im.setMatrixAt(i, m4);
  }
  im.instanceMatrix.needsUpdate = true;
  im.computeBoundingSphere();
  im.frustumCulled = true;
  im.castShadow = false;
  im.receiveShadow = true;
  im.count = list.length;
}

/**
 * Build the near/far instanced fields. No collider is pushed — the
 * ground hull is the only solid. A blade AABB is a fail.
 */
export async function buildBlades(ctx) {
  const { root, track, blocked } = ctx;
  const planned = planDirtBlades();
  const placeCtx = { blocked };
  const nearPlaced = placeBladePlan(placeCtx, planned.nearPlan);
  const farPlaced = placeBladePlan(placeCtx, planned.farPlan);

  const gust = new THREE.Vector3();
  // Stock MeshStandardMaterial — the allowed "no custom mat" WebGL path.
  // attachTslWind() is the TSL graph; craft still writes `gust` every frame.
  const nearMat = track(stockMat());
  const farMat = track(stockMat());
  const nearGeo = track(bladeGeo(2, 0.18, 0.022));
  const farGeo = track(farBladeGeo());

  let nearMesh = null;
  let farMesh = null;
  if (nearPlaced.length) {
    nearMesh = new THREE.InstancedMesh(nearGeo, nearMat, nearPlaced.length);
    nearMesh.name = 'dirt-blades-near';
    stampField(nearMesh, nearPlaced);
    root.add(nearMesh);
  }
  if (farPlaced.length) {
    farMesh = new THREE.InstancedMesh(farGeo, farMat, farPlaced.length);
    farMesh.name = 'dirt-blades-far';
    stampField(farMesh, farPlaced);
    root.add(farMesh);
  }

  return {
    nearCount: nearPlaced.length,
    farCount: farPlaced.length,
    nearBudgeted: planned.nearBudgeted,
    farBudgeted: planned.farBudgeted,
    tsl: false,
    hullCollider: BLADE_HULL_COLLIDER,
    bladeAABB: BLADE_AABB,
    gust,
    update(dt, craft) {
      void dt;
      // Craft writes the gust uniform. Camera / pointer do not.
      if (craft && Number.isFinite(craft.x + craft.y + craft.z)) {
        gust.copy(craft);
      }
    },
    dispose() {
      if (nearMesh) root.remove(nearMesh);
      if (farMesh) root.remove(farMesh);
    },
  };
}
