// FPV camera floor clamp — no three.js, no game state.
//
// On crash / near-ground the near plane must stay above the world surface
// (terrain, water-as-ground, boardwalk / pier deck). Maps expose the
// surface via getCameraFloor(x,z) or getGroundHeight(x,z).

export const CAM_FLOOR_SLACK = 0.04;

/**
 * Minimum FPV camera Y: surface + near + slack.
 * `getFloor(x,z)` returns the surface height with no margin.
 */
export function minCameraY(x, z, getFloor, near = 0.06) {
  if (typeof getFloor !== 'function') return -Infinity;
  const surface = getFloor(x, z);
  if (!Number.isFinite(surface)) return -Infinity;
  return surface + Math.max(0, near) + CAM_FLOOR_SLACK;
}

/** Lift `pos.y` so the near plane stays above the world surface. */
export function clampCameraToFloor(pos, getFloor, near = 0.06) {
  const minY = minCameraY(pos.x, pos.z, getFloor, near);
  if (pos.y < minY) pos.y = minY;
  return pos;
}
