// ============================================================
// PropWash FPV — camera stabilization hooks
// First pass: optional horizon soft-lock (bleed roll toward level)
// and gyro-damp of motor micro-shake. Off by default — existing
// FPV feel is unchanged until the Video tab toggle is enabled.
// ============================================================
import * as THREE from 'three';
import { settings, clamp } from '../core/state.js';

const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _stabQ = new THREE.Quaternion();

/** Scale factor for motor micro-shake (1 = full shake). */
export function dampShake(base = 1) {
  if (!settings.camera.stabilization) return base;
  const s = clamp(settings.camera.stabStrength ?? 0, 0, 1);
  return base * (1 - s * 0.85);
}

/**
 * Soft-lock FPV roll toward world horizon. Leaves pitch/yaw (body
 * heading + tilt) alone so freestyle still reads as FPV.
 * No-op when stabilization is disabled.
 */
export function applyStabilization(fpvCam, _quad) {
  if (!settings.camera.stabilization) return;
  const s = clamp(settings.camera.stabStrength ?? 0, 0, 1);
  if (s <= 0.001) return;
  _euler.setFromQuaternion(fpvCam.quaternion, 'YXZ');
  // bleed roll toward 0; keep yaw + pitch (includes camera uptilt in body frame)
  _euler.z *= (1 - s * 0.9);
  _stabQ.setFromEuler(_euler);
  fpvCam.quaternion.copy(_stabQ);
}
