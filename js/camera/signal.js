// ============================================================
// PropWash FPV — analog video signal-loss model
// Distance + terrain/building occlusion between pilot and drone.
// Result feeds the static overlay (see feed.js) and OSD RSSI.
// ============================================================
import { clamp } from '../core/state.js';
import * as THREE from 'three';

const rayDir = new THREE.Vector3();

function aabbBlocksRay(box, o, d, maxT) {
  let tmin = 0, tmax = maxT;
  for (const ax of ['x', 'y', 'z']) {
    const inv = 1 / (d[ax] || 1e-9);
    let t1 = (box.min[ax] - o[ax]) * inv;
    let t2 = (box.max[ax] - o[ax]) * inv;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

/**
 * Stateful signal-loss tracker. Call update(dt, ctx) from the game loop.
 * `loss` is 0..1 (1 = full breakup). `rssi` is 1 - loss.
 */
export class SignalLoss {
  constructor() {
    this.loss = 0;
    this._timer = 0;
  }

  get rssi() { return 1 - this.loss; }

  update(dt, { quad, pilotPos, mapHandle }) {
    this._timer -= dt;
    if (this._timer > 0) return;
    this._timer = 0.25;
    if (!quad || !pilotPos) return;

    const distToPilot = quad.position.distanceTo(pilotPos);
    let loss = clamp((distToPilot - 250) / 650, 0, 1);

    rayDir.copy(quad.position).sub(pilotPos);
    const len = rayDir.length();
    if (len > 5 && mapHandle) {
      rayDir.normalize();
      for (let i = 1; i <= 8; i++) {
        const f = i / 9;
        const px = pilotPos.x + rayDir.x * len * f;
        const py = pilotPos.y + rayDir.y * len * f;
        const pz = pilotPos.z + rayDir.z * len * f;
        if (mapHandle.getGroundHeight(px, pz) > py + 1) { loss = Math.min(1, loss + 0.45); break; }
      }
      const cols = mapHandle.colliders;
      if (cols) {
        const n = cols.length;
        for (let i = 0; i < n; i++) {
          if (aabbBlocksRay(cols[i], pilotPos, rayDir, len)) { loss = Math.min(1, loss + 0.35); break; }
        }
      }
    }
    this.loss += (loss - this.loss) * 0.5;
  }
}
