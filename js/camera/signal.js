// ============================================================
// PropWash FPV — analog video signal-loss model
// Distance + terrain/building occlusion between pilot and drone.
// Result feeds the static overlay (see feed.js) and OSD RSSI.
// ============================================================
import { clamp } from '../core/state.js';
import * as THREE from 'three';

const rayDir = new THREE.Vector3();

// A real VTX link is only shadowed by substantial structures.
const OCCLUSION_MIN_DIST = 60;   // m from the pilot before occlusion counts
const BLOCKER_MIN_H = 6;         // m tall to count as a blocker
const BLOCKER_MIN_W = 3;         // m across to count as a blocker

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
    let loss = clamp((distToPilot - 350) / 700, 0, 1);

    // Occlusion only matters once you are genuinely far from the pilot; a
    // 5 GHz link does not break up because you flew behind a park bench.
    rayDir.copy(quad.position).sub(pilotPos);
    const len = rayDir.length();
    if (len > OCCLUSION_MIN_DIST && mapHandle) {
      rayDir.normalize();
      for (let i = 1; i <= 8; i++) {
        const f = i / 9;
        const px = pilotPos.x + rayDir.x * len * f;
        const py = pilotPos.y + rayDir.y * len * f;
        const pz = pilotPos.z + rayDir.z * len * f;
        // terrain has to be well above the line, not just grazing it
        if (mapHandle.getGroundHeight(px, pz) > py + 4) { loss = Math.min(1, loss + 0.40); break; }
      }
      const cols = mapHandle.colliders;
      if (cols) {
        // Only buildings-sized obstructions attenuate the link. Street props
        // (benches, meters, hydrants, palm trunks, cars) are transparent to it.
        let blockers = 0;
        for (let i = 0; i < cols.length; i++) {
          const c = cols[i];
          if (!c || !c.min || !c.max) continue;
          const h = c.max.y - c.min.y;
          if (h < BLOCKER_MIN_H) continue;
          const w = Math.min(c.max.x - c.min.x, c.max.z - c.min.z);
          if (w < BLOCKER_MIN_W) continue;
          if (aabbBlocksRay(c, pilotPos, rayDir, len)) {
            blockers++;
            if (blockers >= 2) break;   // deep in a building's shadow
          }
        }
        if (blockers) loss = Math.min(1, loss + (blockers >= 2 ? 0.45 : 0.22));
      }
    }
    // slower blend so the feed degrades and recovers smoothly instead of
    // strobing as the ray clips in and out of geometry
    this.loss += (loss - this.loss) * 0.25;
  }
}
