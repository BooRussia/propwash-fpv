// ============================================================
// PropWash FPV — FPV / LOS camera pose
// Owns PerspectiveCameras, tilt + FOV, motor micro-shake, and
// LOS pilot-tracking. Stabilization / shutter hooks are applied
// here via small collaborators (see stabilization.js, shutter.js).
// ============================================================
import * as THREE from 'three';
import { settings, clamp } from '../core/state.js';
import { applyStabilization, dampShake } from './stabilization.js';
import { sampleShutter } from './shutter.js';

const tiltQuat = new THREE.Quaternion();
const shakeQuat = new THREE.Quaternion();
const shakeEuler = new THREE.Euler();
const camOffset = new THREE.Vector3();
const _xAxis = new THREE.Vector3(1, 0, 0);

export function createCameras(renderDistance) {
  // near 0.06: tight enough for prop-view, avoids distant z-fighting
  const fpvCam = new THREE.PerspectiveCamera(
    settings.camera.fovDeg,
    (typeof innerWidth !== 'undefined' && innerHeight) ? innerWidth / innerHeight : 1,
    0.06,
    renderDistance
  );
  const losCam = new THREE.PerspectiveCamera(
    55,
    (typeof innerWidth !== 'undefined' && innerHeight) ? innerWidth / innerHeight : 1,
    0.1,
    renderDistance
  );
  return { fpvCam, losCam, activeCam: fpvCam };
}

/**
 * Update FPV body-lock pose + LOS pilot cam. Mutates `cams.activeCam`
 * and wires the active camera into the render pass / drone visibility.
 *
 * @param {object} cams  { fpvCam, losCam, activeCam }
 * @param {number} t     elapsed seconds
 * @param {object} ctx   { quad, droneMesh, pilotPos, menuOpen, osd, renderPass }
 */
export function updateCameraPose(cams, t, ctx) {
  const { fpvCam, losCam } = cams;
  const { quad, droneMesh, pilotPos, menuOpen, osd, renderPass } = ctx;
  if (!quad) return;

  // FPV: body-locked with uptilt + motor micro-shake
  tiltQuat.setFromAxisAngle(_xAxis, THREE.MathUtils.degToRad(settings.camera.tiltDeg));
  const m = quad.motorOutput * (ctx.armed ? 1 : 0);
  // Liftoff useCameraNoise: when off, kill motor micro-shake entirely.
  const noiseOn = settings.camera.noise !== false;
  const shakeScale = dampShake(1) * (noiseOn ? 1 : 0);
  shakeEuler.set(
    Math.sin(t * 131) * 0.0016 * m * shakeScale,
    Math.sin(t * 97) * 0.0013 * m * shakeScale,
    Math.sin(t * 149) * 0.0019 * m * shakeScale
  );
  shakeQuat.setFromEuler(shakeEuler);
  fpvCam.quaternion.copy(quad.quaternion).multiply(tiltQuat).multiply(shakeQuat);
  applyStabilization(fpvCam, quad);
  camOffset.set(0, 0.02, -0.04).applyQuaternion(quad.quaternion);
  fpvCam.position.copy(quad.position).add(camOffset);

  // Shutter hook (no visual change at defaults; reserved for blur/exposure)
  sampleShutter(fpvCam);

  if (fpvCam.fov !== settings.camera.fovDeg) {
    fpvCam.fov = settings.camera.fovDeg;
    fpvCam.updateProjectionMatrix();
  }

  // LOS: standing pilot, tracks the drone with mild auto-zoom
  losCam.position.copy(pilotPos);
  losCam.lookAt(quad.position);
  const dist = losCam.position.distanceTo(quad.position);
  const targetFov = clamp(60 - dist * 0.12, 20, 60);
  if (Math.abs(losCam.fov - targetFov) > 0.2) {
    losCam.fov = targetFov;
    losCam.updateProjectionMatrix();
  }

  const los = settings.camera.losMode;
  cams.activeCam = los ? losCam : fpvCam;
  if (renderPass) renderPass.camera = cams.activeCam;
  if (droneMesh) droneMesh.group.visible = los;
  if (osd) osd.setVisible(!los && !menuOpen);
}

export function setCameraFar(cams, renderDistance) {
  cams.fpvCam.far = renderDistance;
  cams.losCam.far = renderDistance;
  cams.fpvCam.updateProjectionMatrix();
  cams.losCam.updateProjectionMatrix();
}

export function resizeCameras(cams, aspect) {
  cams.fpvCam.aspect = aspect;
  cams.losCam.aspect = aspect;
  cams.fpvCam.updateProjectionMatrix();
  cams.losCam.updateProjectionMatrix();
}
