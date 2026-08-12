// ============================================================
// PropWash FPV — shutter / motion-blur extension point
// Settings are wired in state + Video tab. At defaults (shutterMs
// = 0, motionBlur = 0) this is a pure no-op so current framing
// and exposure stay identical. A future pass can drive a real
// motion-blur composer pass from getMotionBlurAmount().
// ============================================================
import { settings, clamp } from '../core/state.js';

/** Normalized 0..1 blur amount from shutter + motionBlur knobs. */
export function getMotionBlurAmount() {
  const blur = clamp(settings.camera.motionBlur ?? 0, 0, 1);
  const shutterMs = Math.max(0, settings.camera.shutterMs ?? 0);
  // Map typical action-cam shutter (1–20 ms) into a gentle 0..1 contrib
  const fromShutter = shutterMs <= 0 ? 0 : clamp(shutterMs / 20, 0, 1);
  return clamp(Math.max(blur, fromShutter * blur), 0, 1);
}

/**
 * Per-frame hook. Currently a no-op at default settings; keeps the
 * call site stable for a future UnrealBloom / custom blur pass.
 */
export function sampleShutter(_fpvCam) {
  // Intentionally empty while motionBlur/shutterMs default to 0.
  // Read getMotionBlurAmount() from a post-process pass when added.
  return getMotionBlurAmount();
}
