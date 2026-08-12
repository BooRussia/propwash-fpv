// ============================================================
// PropWash FPV — video feed overlay (static / signal breakup)
// Reuses js/fx/staticfx.js — does not duplicate snow/block logic.
// ============================================================
import { settings } from '../core/state.js';
import { StaticFX } from '../fx/staticfx.js';

/**
 * Owns the StaticFX instance and applies settings + signal-loss
 * intensity each frame (FPV only; hidden in LOS / menu).
 */
export class VideoFeed {
  constructor(fxRoot) {
    this.staticFX = new StaticFX(fxRoot);
  }

  resize() { this.staticFX.resize(); }

  /**
   * @param {number} dt
   * @param {{ sigLoss: number, menuOpen: boolean }} ctx
   */
  update(dt, { sigLoss, menuOpen }) {
    // `staticEnabled` (C key / Video tab) is the MASTER switch: with it off you
    // get a clean feed, full stop — signal loss then only drives the OSD RSSI.
    // Previously signal loss could paint static over a "static: off" setting,
    // which reads as a bug to anyone who just turned it off.
    let inten = 0;
    if (settings.camera.staticEnabled) {
      inten = settings.camera.staticIntensity;
      if (settings.camera.signalLoss) inten = Math.max(inten, sigLoss);
    }
    const staticOn = !settings.camera.losMode && inten > 0.02 && !menuOpen;
    this.staticFX.setMode(settings.camera.staticMode);
    this.staticFX.setIntensity(inten);
    this.staticFX.setEnabled(staticOn);
    if (staticOn) this.staticFX.update(dt);
  }
}
