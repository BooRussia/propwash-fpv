// ============================================================
// Miami collider bag.
//
// Every builder pushes SHAPE-MATCHED colliders through this bag:
//   addCollider  world-axis box   (X/Z centred, Y is the base)
//   addCyl       Y-axis cylinder  (poles, palm trunks, pylons, columns)
//   addOBB       yaw-rotated box  (angled buildings, boats, benches, decks)
//   addSphere    sphere           (boulders, domes)
//
// Each shape carries the `tag` that was active when it was pushed, so the
// in-page intersection audit can tell an intentional structural contact
// (a pergola beam sitting on its post) from two different structures
// occupying the same cubic metre.
//
// `blocked()` is the rejection test every scatter pass runs before it
// commits a position: a vertical probe cylinder against the whole bag.
// Nothing scattered may intersect a structure.
// ============================================================
import { makeBox, makeCylinder, makeOBB, makeSphere } from '../../core/collision.js';

export function createColliderBag() {
  const colliders = [];
  let tag = 'world';

  const push = (s) => { s.tag = tag; colliders.push(s); return s; };

  /** Name every shape pushed from here on. Call once per structure. */
  const setTag = (t) => { tag = t || 'world'; return tag; };

  const addCollider = (cx, cy, cz, sx, sy, sz) => push(makeBox(cx, cy, cz, sx, sy, sz));
  const addCyl = (cx, cy, cz, r, h) => push(makeCylinder(cx, cy, cz, r, h));
  const addOBB = (cx, cy, cz, sx, sy, sz, yaw) => push(makeOBB(cx, cy, cz, sx, sy, sz, yaw));
  const addSphere = (cx, cy, cz, r) => push(makeSphere(cx, cy, cz, r));

  // ---- rejection test -------------------------------------------------
  // Horizontal distance from (x,z) to a shape's XZ footprint. Negative when
  // the point is inside. Allocation-free.
  const footprintGap = (s, x, z) => {
    const t = s.type;
    if (t === 'cyl' || t === 'sphere') {
      const dx = x - s.cx, dz = z - s.cz;
      return Math.sqrt(dx * dx + dz * dz) - s.r;
    }
    if (t === 'obb') {
      const dx = x - s.cx, dz = z - s.cz;
      const lx = dx * s.cos + dz * s.sin;       // world -> local (yaw only)
      const lz = -dx * s.sin + dz * s.cos;
      const ex = Math.abs(lx) - s.hx, ez = Math.abs(lz) - s.hz;
      if (ex <= 0 && ez <= 0) return Math.max(ex, ez);
      const gx = Math.max(ex, 0), gz = Math.max(ez, 0);
      return Math.sqrt(gx * gx + gz * gz);
    }
    const mn = s.min, mx = s.max;
    const ex = Math.max(mn.x - x, x - mx.x);
    const ez = Math.max(mn.z - z, z - mx.z);
    if (ex <= 0 && ez <= 0) return Math.max(ex, ez);
    const gx = Math.max(ex, 0), gz = Math.max(ez, 0);
    return Math.sqrt(gx * gx + gz * gz);
  };

  /**
   * True when a vertical probe cylinder — radius `r` at (x,z), spanning
   * y0..y1 — touches any collider already in the bag.
   * @param {number} x
   * @param {number} z
   * @param {number} r     probe radius (crown/canopy half-width)
   * @param {number} [y0]  probe base   (default: everything)
   * @param {number} [y1]  probe top
   * @param {string} [skipTag] ignore shapes carrying this tag
   */
  const blocked = (x, z, r, y0, y1, skipTag) => {
    const lo = y0 === undefined ? -1e4 : y0;
    const hi = y1 === undefined ? 1e4 : y1;
    for (let i = 0; i < colliders.length; i++) {
      const s = colliders[i];
      if (skipTag && s.tag === skipTag) continue;
      if (s.max.y < lo || s.min.y > hi) continue;
      if (x + r < s.min.x || x - r > s.max.x) continue;
      if (z + r < s.min.z || z - r > s.max.z) continue;
      if (footprintGap(s, x, z) < r) return true;
    }
    return false;
  };

  return { colliders, addCollider, addCyl, addOBB, addSphere, setTag, blocked };
}
