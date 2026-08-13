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
  // Nested rate profiles (Actual + Betaflight). Legacy flat
  // {roll,pitch,yaw} is migrated in load() → rates.actual.
  rates: {
    model: 'actual',
    actual: {
      roll:  { centerSens: 10, maxRate: 670, expo: 0.7 },
      pitch: { centerSens: 10, maxRate: 670, expo: 0.7 },
      yaw:   { centerSens: 10, maxRate: 670, expo: 0.7 },
    },
    betaflight: {
      roll:  { rate: 155, expo: 30, superExpo: 73 },
      pitch: { rate: 155, expo: 30, superExpo: 73 },
      yaw:   { rate: 100, expo: 30, superExpo: 73 },
    },
  },
  throttleExpo: 0.20,           // Liftoff Mid curve expo 20 → 0..1
  camera: {
    tiltDeg: 30,                // FPV camera uptilt (ArrowUp/Down); meteor75 Liftoff default
    fovDeg: 117.5,              // FPV FOV (ArrowLeft/Right) — Liftoff match
    noise: true,                // Liftoff useCameraNoise — motor micro-shake
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
    propwash: true,             // Liftoff propwash toggle
    propwashIntensity: 42,      // 0..100 Liftoff default
    batteryMode: true,             // Liftoff batteryMode — voltage sag when on
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

/**
 * Migrate legacy flat rates {roll,pitch,yaw} → nested {model,actual,betaflight}
 * BEFORE deepMerge so we don't leave stray roll/pitch/yaw keys beside actual.
 */
function migrateParsed(parsed) {
  if (!parsed || typeof parsed !== 'object') return;
  const r = parsed.rates;
  if (!r || typeof r !== 'object') return;

  const hasNested = !!(r.actual || r.betaflight || r.model);
  const hasFlat = !!(r.roll && (r.roll.centerSens != null || r.roll.maxRate != null));

  if (hasFlat && !r.actual) {
    parsed.rates = {
      model: r.model === 'betaflight' ? 'betaflight' : 'actual',
      actual: {
        roll: r.roll,
        pitch: r.pitch || r.roll,
        yaw: r.yaw || r.roll,
      },
      // betaflight filled from DEFAULT_SETTINGS via deepMerge
      ...(r.betaflight ? { betaflight: r.betaflight } : {}),
    };
  } else if (hasNested && hasFlat) {
    // Partial / messy save: prefer nested, drop flat
    if (!r.actual) {
      r.actual = { roll: r.roll, pitch: r.pitch || r.roll, yaw: r.yaw || r.roll };
    }
    delete r.roll;
    delete r.pitch;
    delete r.yaw;
  }

  // Top-level propwash → environment (if an older patch put them there)
  if (parsed.propwash != null || parsed.propwashIntensity != null) {
    parsed.environment = parsed.environment || {};
    if (parsed.propwash != null && parsed.environment.propwash == null) {
      parsed.environment.propwash = !!parsed.propwash;
    }
    if (parsed.propwashIntensity != null && parsed.environment.propwashIntensity == null) {
      parsed.environment.propwashIntensity = parsed.propwashIntensity;
    }
    delete parsed.propwash;
    delete parsed.propwashIntensity;
  }
  if (parsed.physics && typeof parsed.physics === 'object') {
    parsed.environment = parsed.environment || {};
    if (parsed.physics.propwash != null && parsed.environment.propwash == null) {
      parsed.environment.propwash = !!parsed.physics.propwash;
    }
    if (parsed.physics.propwashIntensity != null && parsed.environment.propwashIntensity == null) {
      parsed.environment.propwashIntensity = parsed.physics.propwashIntensity;
    }
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      migrateParsed(parsed);
      return deepMerge(DEFAULT_SETTINGS, parsed);
    }
  } catch (e) { console.warn('settings load failed', e); }
  return deepMerge(DEFAULT_SETTINGS, {});
}

export const settings = load();

// Ensure rates always has nested shape even after odd merges
if (settings.rates && (settings.rates.roll || !settings.rates.actual)) {
  migrateParsed({ rates: settings.rates });
  if (settings.rates.roll && !settings.rates.actual) {
    settings.rates.actual = {
      roll: settings.rates.roll,
      pitch: settings.rates.pitch || settings.rates.roll,
      yaw: settings.rates.yaw || settings.rates.roll,
    };
  }
  delete settings.rates.roll;
  delete settings.rates.pitch;
  delete settings.rates.yaw;
  if (!settings.rates.model) settings.rates.model = 'actual';
  if (!settings.rates.betaflight) {
    settings.rates.betaflight = deepMerge(DEFAULT_SETTINGS.rates.betaflight, {});
  }
  if (!settings.rates.actual) {
    settings.rates.actual = deepMerge(DEFAULT_SETTINGS.rates.actual, {});
  }
}

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
