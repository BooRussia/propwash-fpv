// ============================================================
// PropWash FPV — shared settings store + event bus
// Every module imports { settings, saveSettings, emit, on }.
// Settings persist to localStorage. Events flow through `bus`.
// ============================================================

const STORAGE_KEY = 'propwash-settings-v1';

export const DEFAULT_SETTINGS = {
  drone: 'meteor75',            // 'meteor75' | 'cinebot30' | 'nazgul5'
  map: 'miami',                 // 'miami' | 'ashPrairie' | 'procedural' | 'realworld'
  procedural: {
    setting: 'outdoor',         // 'indoor' | 'outdoor'
    locale: 'country',          // 'city' | 'country'  (outdoor only)
    terrain: 'mountains',       // 'tropical' | 'desert' | 'mountains' | 'island'
    seed: 1337,
  },
  realworld: {
    apiKey: '',                 // user's Google Maps Platform key (Map Tiles API) — stays in their browser
    preset: 'miami',
    lat: 25.7907,
    lon: -80.13,
  },
  gameMode: 'freestyle',        // 'freestyle' | 'racing' | 'retrieval'
  flightMode: 'acro',           // 'acro' | 'angle' | 'horizon'
  rates: {                      // Betaflight "Actual" rates
    roll:  { centerSens: 200, maxRate: 670, expo: 0.54 },
    pitch: { centerSens: 200, maxRate: 670, expo: 0.54 },
    yaw:   { centerSens: 200, maxRate: 500, expo: 0.54 },
  },
  camera: {
    tiltDeg: 25,                // FPV camera uptilt (ArrowUp/Down)
    fovDeg: 120,                // FPV FOV (ArrowLeft/Right)
    losMode: false,             // V toggles line-of-sight view
    staticEnabled: false,       // C toggles static overlay
    staticMode: 'analog',       // 'analog' | 'digital'
    staticIntensity: 0.35,      // base intensity when toggled on
    signalLoss: true,           // distance/occlusion-based breakup
    // Camera pipeline extensions (js/camera/) — defaults preserve classic FPV feel
    stabilization: false,       // horizon soft-lock + gyro damp of motor shake
    stabStrength: 0.4,          // 0..1 when stabilization is on
    shutterMs: 0,               // simulated shutter (ms); 0 = off / no blur
    motionBlur: 0,              // 0..1 motion-blur knob (wired; pass not yet applied)
  },
  environment: {
    timeOfDay: 15.5,            // hours 0..24
    windSpeed: 2,               // m/s steady
    windDirDeg: 90,             // where wind blows FROM, compass deg
    gustiness: 0.3,             // 0..1
    rain: 0,                    // 0..1
  },
  graphics: {
    quality: 'high',            // 'low' | 'medium' | 'high' | 'ultra'
    autoDetected: false,        // set true once auto quality has run
    renderDistance: 1500,       // meters (camera.far + fog + gen radius)
    renderScale: 1,             // multiplies devicePixelRatio
    bloom: true,
    shadows: true,
  },
  osd: { showSticks: true },      // on-screen stick position overlay
  audio: { master: 0.3 },
  controller: {
    deviceId: null,             // gamepad.id string of chosen radio
    // mapping + calibration written by the calibration wizard:
    // calibration = { axes: { [axisIndex]: {min,max,center,invert,deadband,trim} },
    //                 map: { throttle,roll,pitch,yaw: axisIndex,
    //                        arm: {type:'axis'|'button', index, threshold} | null } }
    calibration: null,
  },
};

function deepMerge(base, patch) {
  const out = Array.isArray(base) ? base.slice() : { ...base };
  if (!patch || typeof patch !== 'object') return out;
  for (const k of Object.keys(patch)) {
    const b = base ? base[k] : undefined;
    const p = patch[k];
    if (b && p && typeof b === 'object' && typeof p === 'object' && !Array.isArray(b) && !Array.isArray(p)) {
      out[k] = deepMerge(b, p);
    } else if (p !== undefined) {
      out[k] = p;
    }
  }
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return deepMerge(DEFAULT_SETTINGS, JSON.parse(raw));
  } catch (e) { console.warn('settings load failed', e); }
  return deepMerge(DEFAULT_SETTINGS, {});
}

export const settings = load();

let saveTimer = null;
export function saveSettings() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
    catch (e) { console.warn('settings save failed', e); }
  }, 150);
}

export function resetSettings() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
  location.reload();
}

// ---------------- event bus ----------------
// Events used across the app:
//   'menu:open' / 'menu:close'
//   'settings:changed'   {path}        re-apply live settings
//   'drone:changed'                     rebuild quad
//   'map:reload'                        rebuild current map
//   'mode:changed' | 'mode:restart'     game mode lifecycle
//   'calibrate:start' | 'calibrate:finetune'
//   'sim:reset'                         respawn drone
//   'mode:objective'     {text}         OSD objective line
//   'osd:flash'          {text, ms}     OSD flash message
//   'quad:carry'         {massKg}       payload picked up / dropped
//   'hotkey:menu' | 'hotkey:reset' | 'hotkey:arm' | 'hotkey:view' | 'hotkey:static'
//   'hotkey:camTilt' {delta} | 'hotkey:fov' {delta}
export const bus = new EventTarget();

export function emit(name, detail = {}) {
  bus.dispatchEvent(new CustomEvent(name, { detail }));
}

export function on(name, handler) {
  const fn = (e) => handler(e.detail);
  bus.addEventListener(name, fn);
  return () => bus.removeEventListener(name, fn);
}

// Small helpers shared by UI modules
export function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
