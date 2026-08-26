// FPV camera floor clamp — no three.js, no game state.
//
// On crash / near-ground the near plane must stay above the world surface
// (terrain, seabed, boardwalk / pier deck). Maps expose the surface via
// getCameraFloor(x,z[,y]) or getGroundHeight(x,z). The optional y lets a
// map keep the camera under a deck instead of lifting through the planks.

export const CAM_FLOOR_SLACK = 0.04;

function sampleFloor(getFloor, x, z, y) {
  if (typeof getFloor !== 'function') return NaN;
  if (y != null && Number.isFinite(y) && getFloor.length >= 3) return getFloor(x, z, y);
  return getFloor(x, z);
}

/**
 * Minimum FPV camera Y: surface + near + slack.
 * `getFloor(x,z[,y])` returns the surface height with no margin.
 */
export function minCameraY(x, z, getFloor, near = 0.06, y) {
  const surface = sampleFloor(getFloor, x, z, y);
  if (!Number.isFinite(surface)) return -Infinity;
  return surface + Math.max(0, near) + CAM_FLOOR_SLACK;
}

/** Lift `pos.y` so the near plane stays above the world surface. */
export function clampCameraToFloor(pos, getFloor, near = 0.06) {
  const minY = minCameraY(pos.x, pos.z, getFloor, near, pos.y);
  if (pos.y < minY) pos.y = minY;
  return pos;
}
