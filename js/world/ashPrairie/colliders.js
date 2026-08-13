import * as THREE from 'three';

/** Create the shared colliders list + addCollider helper used by all sections. */
export function createColliderBag() {
  const colliders = [];
  const addCollider = (cx, cy, cz, sx, sy, sz) => {
    colliders.push({
      min: new THREE.Vector3(cx - sx / 2, cy, cz - sz / 2),
      max: new THREE.Vector3(cx + sx / 2, cy + sy, cz + sz / 2),
    });
  };
  return { colliders, addCollider };
}
