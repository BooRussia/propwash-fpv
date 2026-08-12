// ============================================================
// PropWash FPV — camera / video pipeline (public API)
//
//   import { FpvCameraPipeline } from './camera/index.js';
//   const cam = new FpvCameraPipeline({ renderDistance, fxRoot });
//   cam.updatePose(t, { quad, droneMesh, pilotPos, armed, menuOpen, osd, renderPass });
//   cam.updateSignal(dt, { quad, pilotPos, mapHandle });
//   cam.updateFeed(dt, { menuOpen });
//
// Owns: FPV + LOS cameras, signal-loss model, static feed overlay,
// stabilization + shutter extension points. Static snow/blocks still
// live in js/fx/staticfx.js — this module only drives them.
// ============================================================
import { settings, saveSettings, clamp, emit } from '../core/state.js';
import {
  createCameras,
  updateCameraPose,
  setCameraFar,
  resizeCameras,
} from './pose.js';
import { SignalLoss } from './signal.js';
import { VideoFeed } from './feed.js';
import { getMotionBlurAmount } from './shutter.js';

export { getMotionBlurAmount } from './shutter.js';
export { dampShake, applyStabilization } from './stabilization.js';

export class FpvCameraPipeline {
  /**
   * @param {{ renderDistance: number, fxRoot: HTMLElement }} opts
   */
  constructor({ renderDistance, fxRoot }) {
    const cams = createCameras(renderDistance);
    this.fpvCam = cams.fpvCam;
    this.losCam = cams.losCam;
    this.activeCam = cams.activeCam;
    this._cams = cams;
    this.signal = new SignalLoss();
    this.feed = new VideoFeed(fxRoot);
  }

  /** Current signal-loss 0..1 (1 = full breakup). */
  get sigLoss() { return this.signal.loss; }
  get rssi() { return this.signal.rssi; }
  get staticFX() { return this.feed.staticFX; }

  updatePose(t, ctx) {
    updateCameraPose(this._cams, t, ctx);
    this.activeCam = this._cams.activeCam;
  }

  updateSignal(dt, ctx) {
    this.signal.update(dt, ctx);
  }

  updateFeed(dt, { menuOpen }) {
    this.feed.update(dt, { sigLoss: this.signal.loss, menuOpen });
  }

  setRenderDistance(rd) {
    setCameraFar(this._cams, rd);
  }

  resize(aspect) {
    resizeCameras(this._cams, aspect);
    this.feed.resize();
  }

  // -------- LOS / FPV + settings nudges (hotkey helpers) --------
  toggleLos() {
    settings.camera.losMode = !settings.camera.losMode;
    saveSettings();
    emit('osd:flash', { text: settings.camera.losMode ? 'LINE OF SIGHT' : 'FPV', ms: 700 });
  }

  toggleStatic() {
    settings.camera.staticEnabled = !settings.camera.staticEnabled;
    saveSettings();
    emit('osd:flash', {
      text: `STATIC ${settings.camera.staticEnabled ? 'ON' : 'OFF'} (${settings.camera.staticMode.toUpperCase()})`,
      ms: 900,
    });
  }

  nudgeTilt(delta) {
    settings.camera.tiltDeg = clamp(settings.camera.tiltDeg + delta, 0, 60);
    saveSettings();
    emit('osd:flash', { text: `CAM TILT ${settings.camera.tiltDeg}°`, ms: 600 });
  }

  nudgeFov(delta) {
    settings.camera.fovDeg = clamp(settings.camera.fovDeg + delta, 60, 150);
    saveSettings();
    emit('osd:flash', { text: `FOV ${settings.camera.fovDeg}°`, ms: 600 });
  }
}
