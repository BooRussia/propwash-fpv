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
    let inten = settings.camera.staticEnabled ? settings.camera.staticIntensity : 0;
    if (settings.camera.signalLoss) inten = Math.max(inten, sigLoss);
    const staticOn = !settings.camera.losMode && inten > 0.02 && !menuOpen;
    this.staticFX.setMode(settings.camera.staticMode);
    this.staticFX.setIntensity(inten);
    this.staticFX.setEnabled(staticOn);
    if (staticOn) this.staticFX.update(dt);
  }
}
