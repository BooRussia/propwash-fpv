// ============================================================
// PropWash FPV — atmosphere: sky, sun/moon, stars, fog, wind, rain
// + photoreal HDRI image-based lighting (assets/hdri/*, optional)
// ============================================================
// Owns: scene.background, scene.environment, scene.fog,
// renderer.toneMappingExposure (after boot), the sun/moon/hemisphere
// lights and the rain field.
//
// Public API (consumed by main.js / maps):
//   constructor(scene, renderer)
//   async init()
//   setTimeOfDay(hours)            0..24
//   setWeather({windSpeed, windDirDeg, gustiness, rain})
//   setRenderDistance(meters)
//   setQuality(shadowMapRes)
//   setIndoor(bool)
//   setHDRIBands({day, sunset, night, overcast})  assetLib.hdri keys | null
//   update(dt, camera)             camera = ACTIVE camera
//   getWind(posVector3, outVector3) -> outVector3   (allocation-free)
//   dispose()                      frees PMREM render targets (optional)
//
// HDRI banding: a band is derived from rain + sun elevation
// (rain >= 0.5 -> overcast; el < -6 -> night; el < 10 -> sunset; else day)
// and re-evaluated on setTimeOfDay / setWeather. If the band's HDRI file
// loads (lazy, swaps throttled to <= 1/s), it replaces the procedural Sky
// as scene.background and, PMREM-processed, as scene.environment. If the
// file is missing (assets/ empty) or fails, the procedural Sky + PMREM
// path below keeps working exactly as before — zero HDRI requirements.
// ============================================================

import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { settings, clamp } from '../core/state.js';
import { assetLib } from '../core/assets.js';

// ---------------- solar model constants ----------------
const DEG2RAD = Math.PI / 180;
const SUNRISE = 6.5;               // hours
const SUNSET = 19.5;               // hours
const DAY_HOURS = SUNSET - SUNRISE;    // 13
const NIGHT_HOURS = 24 - DAY_HOURS;    // 11
const SUN_PEAK_DEG = 70;           // noon-ish elevation at 13:00
const NIGHT_DEPTH_DEG = 48;        // how far the sun dips at solar midnight

// ---------------- shadow constants ----------------
const SHADOW_HALF = 60;            // 120 m ortho box around the camera
const SHADOW_DIST = 180;           // light distance from shadow center

// ---------------- rain constants ----------------
const RAIN_COUNT = 3000;           // line segments
const RAIN_SIZE = 60;              // wrap box edge (m), centered on camera

// ---------------- star constants ----------------
const STAR_COUNT = 2200;
const BRIGHT_STAR_COUNT = 300;

// ---------------- gust field constants ----------------
const GW1 = Math.PI * 2 * 0.13;    // rad/s — incommensurate gust frequencies
const GW2 = Math.PI * 2 * 0.37;
const GW3 = Math.PI * 2 * 0.71;
const GW4 = Math.PI * 2 * 1.17;
const GPOS = 0.021;                // spatial phase scale (rad per meter-ish)

// ---------------- keyframe ramps over sun elevation (degrees) ----------------
const C = (hex) => new THREE.Color(hex);

const SKY_TURBIDITY = [[-8, 2.2], [0, 10.0], [4, 7.5], [12, 5.5], [70, 3.8]];
const SKY_RAYLEIGH  = [[-8, 1.2], [0, 3.4], [6, 2.3], [20, 1.5], [70, 1.1]];
const SKY_MIE_COEFF = [[-8, 0.003], [0, 0.021], [6, 0.011], [20, 0.005], [70, 0.0035]];
const SKY_MIE_G     = [[0, 0.95], [10, 0.86], [70, 0.80]];

const SUN_INTENSITY  = [[-2.5, 0], [0, 0.55], [4, 1.5], [10, 2.3], [25, 2.9], [70, 3.1]];
const HEMI_INTENSITY = [[-12, 0.30], [-4, 0.34], [0, 0.38], [10, 0.50], [70, 0.62]];

const SUN_COLOR = [
  [-2, C(0xff5b26)], [0, C(0xff7d38)], [4, C(0xffae62)],
  [12, C(0xffd8a1)], [30, C(0xfff3e2)], [70, C(0xfffdf8)],
];
const HEMI_SKY_COLOR = [
  [-14, C(0x0e1526)], [-5, C(0x1a2138)], [0, C(0x5b4a5e)],
  [5, C(0xa08266)], [12, C(0x7fa0c2)], [70, C(0x8fb9dd)],
];
const HEMI_GROUND_COLOR = [
  [-14, C(0x090b10)], [-5, C(0x101219)], [0, C(0x3b2b25)],
  [5, C(0x5c4834)], [12, C(0x565349)], [70, C(0x5f5a4d)],
];
const FOG_COLOR = [
  [-16, C(0x04060b)], [-6, C(0x080c16)], [-1.5, C(0x281b2c)], [0.5, C(0x9c5430)],
  [4, C(0xc98d58)], [9, C(0xb3a084)], [16, C(0x9fb4c8)], [70, C(0xaac5db)],
];
const RAIN_FOG_GRAY = C(0x6f767e);
const INDOOR_FOG = C(0x14171c);

// ---------------- HDRI band constants ----------------
const DEFAULT_HDRI_BANDS = {
  day: 'day_clear',
  sunset: 'sunset',
  night: 'night',
  overcast: 'overcast',
};

// Approximate azimuth (world compass deg) at which each HDRI's sun/brightest
// area is baked, used so backgroundRotation roughly tracks the computed sun.
// 0 means "unknown / don't care" — tune per asset if the sun visibly fights
// the shadow direction.
const HDRI_BAKED_SUN_AZ_DEG = {
  beach_day: 0, day_clear: 0, sunset: 0, night: 0, overcast: 0,
};

// Directional sun retune while an HDRI band is active (the HDRI supplies
// sky + ambient; the DirectionalLight remains the shadow caster).
const HDRI_SUN = {
  day:      { intensity: 2.5, color: 0xfff1dc },  // warm white
  sunset:   { intensity: 1.8, color: 0xff9440 },  // orange
  night:    { intensity: 0.0, color: 0xfff1dc },  // sun off; moonlight only
  overcast: { intensity: 0.6, color: 0xe8ecef },  // weak, near-neutral
};

// Fog colors while an HDRI band is active (rain still greys/thickens in
// _applyFog, and overcast additionally darkens with daylight below).
const HDRI_FOG = {
  day: C(0xa9bccb),        // light blue-grey
  sunset: C(0xc79b6e),     // warm haze
  night: C(0x05070d),      // near-black
  overcast: C(0x8d949c),   // flat grey
};

// Tone-mapping exposure over sun elevation for HDRI day/sunset/night bands
// (targets: night ~0.5, sunset ~0.8, day ~0.75; ACES).
const HDRI_EXPOSURE = [
  [-12, 0.50], [-6, 0.66], [-2, 0.76], [2, 0.80], [10, 0.80], [24, 0.75], [70, 0.74],
];

const HDRI_SWAP_MIN_MS = 1000;     // never swap backgrounds more than 1/s

const Z_AXIS = new THREE.Vector3(0, 0, 1);

// Piecewise-linear scalar ramp over sorted [x, value] stops.
function ramp(stops, x) {
  if (x <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (x < stops[i][0]) {
      const x0 = stops[i - 1][0], v0 = stops[i - 1][1];
      const x1 = stops[i][0], v1 = stops[i][1];
      return v0 + (v1 - v0) * ((x - x0) / (x1 - x0));
    }
  }
  return stops[stops.length - 1][1];
}

// Piecewise-linear color ramp; writes into `out`, allocation-free.
function rampColor(stops, x, out) {
  if (x <= stops[0][0]) return out.copy(stops[0][1]);
  for (let i = 1; i < stops.length; i++) {
    if (x < stops[i][0]) {
      const x0 = stops[i - 1][0], x1 = stops[i][0];
      return out.lerpColors(stops[i - 1][1], stops[i][1], (x - x0) / (x1 - x0));
    }
  }
  return out.copy(stops[stops.length - 1][1]);
}

function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function finite(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function nowMs() {
  return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
}

// ============================================================
export class Environment {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this._ready = false;
    this._indoor = false;

    // ---- parameters (seeded from settings; main.js re-applies at boot) ----
    const env = (settings && settings.environment) || {};
    this._hours = clamp(finite(env.timeOfDay, 15.5), 0, 24) % 24;
    this._windSpeed = clamp(finite(env.windSpeed, 2), 0, 60);
    this._windDirDeg = finite(env.windDirDeg, 90);
    this._gustiness = clamp(finite(env.gustiness, 0.3), 0, 1);
    this._rain = clamp(finite(env.rain, 0), 0, 1);
    this._renderDistance = clamp(finite(settings?.graphics?.renderDistance, 1500), 200, 20000);
    this._shadowRes = 2048;

    // ---- sun/moon state ----
    this._sunElDeg = 45;
    this._sunAzDeg = 90;
    this._sunDir = new THREE.Vector3(0, 1, 0);
    this._moonDir = new THREE.Vector3(0, -1, 0);

    // ---- wind state (allocation-free getWind) ----
    this._windTime = Math.random() * 512;         // decorrelate sessions
    this._windDir = new THREE.Vector3(0, 0, 1);   // air VELOCITY direction (TO)
    this._windLat = new THREE.Vector3(1, 0, 0);   // horizontal perpendicular
    this._applyWindDir();

    // ---- rain state ----
    this._rainActive = 0;
    this._streakLen = 0.3;

    // ---- stars ----
    this._starTarget = 0;

    // ---- procedural env map bookkeeping ----
    this._envRT = null;
    this._envBuiltAt = null;

    // ---- HDRI IBL state ----
    this._hdriBands = { ...DEFAULT_HDRI_BANDS };
    this._band = 'day';
    this._hdriKey = null;         // last key attempted (null = procedural only)
    this._hdriDesiredKey = null;  // latest wanted key (null = procedural)
    this._hdriTex = null;         // applied equirect texture (shared, assetLib-owned)
    this._hdriApplied = false;    // true only when a texture actually loaded
    this._hdriEnvRTs = new Map(); // key -> PMREM RenderTarget (cached per key)
    this._hdriToken = 0;          // async race guard
    this._hdriLastSwap = -Infinity;
    this._hdriTimer = null;       // pending throttled swap

    // ---- reusable temps (no per-frame allocations) ----
    this._tmpA = new THREE.Vector3();
    this._svRight = new THREE.Vector3();
    this._svUp = new THREE.Vector3();
    this._svCenter = new THREE.Vector3();
    this._fogBase = new THREE.Color(0x9fb8d0);
  }

  // ----------------------------------------------------------
  async init() {
    const scene = this.scene;

    // ---------- sky dome ----------
    this.sky = new Sky();
    this.sky.scale.setScalar(1000);      // shader pins depth to the far plane; scale just needs to enclose the camera
    this.sky.frustumCulled = false;
    scene.add(this.sky);

    // ---------- fog ----------
    this._fog = new THREE.Fog(0x9fb8d0, 180, 1400);
    scene.fog = this._fog;

    // ---------- sun ----------
    this.sunLight = new THREE.DirectionalLight(0xfff3e2, 3);
    this.sunLight.castShadow = true;
    const sc = this.sunLight.shadow.camera;
    sc.left = -SHADOW_HALF; sc.right = SHADOW_HALF;
    sc.top = SHADOW_HALF; sc.bottom = -SHADOW_HALF;
    sc.near = 10; sc.far = 420;
    sc.updateProjectionMatrix();
    this.sunLight.shadow.mapSize.set(this._shadowRes, this._shadowRes);
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.normalBias = 0.06;
    scene.add(this.sunLight);
    scene.add(this.sunLight.target);

    // ---------- moon (no shadow — keeps night cheap) ----------
    this.moonLight = new THREE.DirectionalLight(0x93a9d1, 0);
    this.moonLight.visible = false;
    scene.add(this.moonLight);

    // ---------- hemisphere ambient ----------
    this.hemi = new THREE.HemisphereLight(0x8fb9dd, 0x5f5a4d, 0.5);
    scene.add(this.hemi);

    // ---------- celestial group (stars + moon disc), follows camera ----------
    this._celestial = new THREE.Group();
    this._celestial.scale.setScalar(this._renderDistance * 0.9);
    scene.add(this._celestial);

    this._starMats = [];
    this._stars = this._buildStars(STAR_COUNT, 1.6, 0.72);
    this._brightStars = this._buildStars(BRIGHT_STAR_COUNT, 2.6, 0.95);
    this._celestial.add(this._stars);
    this._celestial.add(this._brightStars);

    this._buildMoonDisc();
    this._celestial.add(this._moonDisc);

    // ---------- rain ----------
    this._buildRain();
    scene.add(this._rainObj);

    // ---------- environment reflections ----------
    this._pmrem = new THREE.PMREMGenerator(this.renderer);
    this._envScene = new THREE.Scene();
    try {
      if ('environmentIntensity' in scene) scene.environmentIntensity = 0.5;
    } catch (e) { /* older three — safe to ignore */ }

    this._ready = true;

    // apply stored parameters (re-applied by main.js after boot; idempotent)
    this.setQuality(this._shadowRes);
    this.setRenderDistance(this._renderDistance);
    this.setWeather({
      windSpeed: this._windSpeed,
      windDirDeg: this._windDirDeg,
      gustiness: this._gustiness,
      rain: this._rain,
    }); // -> _applyAtmosphere() -> first PMREM build + first HDRI request
  }

  // ----------------------------------------------------------
  setTimeOfDay(hours) {
    let h = finite(hours, 12);
    this._hours = ((h % 24) + 24) % 24;
    if (!this._ready) return;
    this._applyAtmosphere();
  }

  // ----------------------------------------------------------
  setWeather(w = {}) {
    this._windSpeed = clamp(finite(w.windSpeed, this._windSpeed), 0, 60);
    this._windDirDeg = finite(w.windDirDeg, this._windDirDeg);
    this._gustiness = clamp(finite(w.gustiness, this._gustiness), 0, 1);
    this._rain = clamp(finite(w.rain, this._rain), 0, 1);
    this._applyWindDir();
    if (!this._ready) return;

    // rain visuals scale with intensity
    const rain = this._rain;
    this._rainMat.opacity = 0.10 + 0.32 * rain;
    this._streakLen = 0.25 + 1.05 * rain;
    this._rainActive = Math.floor(RAIN_COUNT * clamp(rain * 1.15, 0, 1));
    this._rainGeo.setDrawRange(0, this._rainActive * 2);
    this._rainObj.visible = !this._indoor && this._rainActive > 0;

    this._applyAtmosphere(); // rain also affects fog / light / exposure / stars / band
  }

  // ----------------------------------------------------------
  // Map hook: choose which HDRI key backs each band. Partial objects are
  // merged over the defaults (NOT over a previous custom set, so every map
  // states its full intent). Pass a null/undefined value to force the
  // procedural Sky for that band. e.g. Miami: setHDRIBands({ day: 'beach_day' })
  setHDRIBands(bands = {}) {
    const b = bands || {};
    this._hdriBands = {
      day:      b.day !== undefined ? b.day : DEFAULT_HDRI_BANDS.day,
      sunset:   b.sunset !== undefined ? b.sunset : DEFAULT_HDRI_BANDS.sunset,
      night:    b.night !== undefined ? b.night : DEFAULT_HDRI_BANDS.night,
      overcast: b.overcast !== undefined ? b.overcast : DEFAULT_HDRI_BANDS.overcast,
    };
    if (!this._ready) return;
    this._applyAtmosphere(); // re-evaluates the band -> schedules a swap if needed
  }

  // ----------------------------------------------------------
  setRenderDistance(meters) {
    this._renderDistance = clamp(finite(meters, 1500), 200, 20000);
    if (!this._ready) return;
    this._celestial.scale.setScalar(this._renderDistance * 0.9);
    this._applyFog();
  }

  // ----------------------------------------------------------
  setQuality(shadowMapRes) {
    let res = Math.floor(finite(shadowMapRes, 2048));
    res = clamp(res, 256, 8192);
    this._shadowRes = res;
    if (!this._ready) return;
    const sh = this.sunLight.shadow;
    if (sh.mapSize.x !== res) {
      sh.mapSize.set(res, res);
      if (sh.map) {
        try { sh.map.dispose(); } catch (e) { /* noop */ }
        sh.map = null; // force re-allocation at the new size
      }
    }
    // keep acne-free across resolutions: normal bias ~ one world texel
    sh.normalBias = ((SHADOW_HALF * 2) / res) * 1.1 + 0.01;
  }

  // ----------------------------------------------------------
  setIndoor(flag) {
    flag = !!flag;
    if (flag === this._indoor) return;
    this._indoor = flag;
    if (!this._ready) return;

    if (flag) {
      // hide the outside world (including any HDRI background/IBL)
      this.sky.visible = false;
      this._celestial.visible = false;
      this._rainObj.visible = false;
      this.sunLight.visible = false;
      this.moonLight.visible = false;
      // neutral indoor ambient
      this.hemi.color.setHex(0xcfd6de);
      this.hemi.groundColor.setHex(0x4a4e55);
      this.hemi.intensity = 0.85;
      this.renderer.toneMappingExposure = 0.8;
      this.scene.environment = null;
      this.scene.background = null;
      try {
        if ('environmentIntensity' in this.scene) this.scene.environmentIntensity = 0.5;
        if ('backgroundIntensity' in this.scene) this.scene.backgroundIntensity = 1;
      } catch (e) { /* noop */ }
      this._applyFog();
    } else {
      this._celestial.visible = true;
      this._rainObj.visible = this._rainActive > 0;
      this._applyAtmosphere(); // restores lights, fog, exposure, stars, HDRI/sky
    }
  }

  // ----------------------------------------------------------
  // Wind at a world position. Steady component + layered gusts.
  // Allocation-free: writes into `out` and returns it.
  getWind(pos, out) {
    if (this._indoor) return out.set(0, 0, 0);
    const ws = this._windSpeed;
    if (ws <= 0.0001) return out.set(0, 0, 0);

    const t = this._windTime;
    const g = this._gustiness * ws * 0.6;
    const px = pos.x * GPOS, pz = pos.z * GPOS;

    // along-wind gusting: 3 incommensurate sines with spatial phase drift
    const along = ws + g * (
      0.50 * Math.sin(GW1 * t + px * 1.7 - pz * 1.1) +
      0.30 * Math.sin(GW2 * t + pz * 2.3 + px * 0.7 + 1.7) +
      0.20 * Math.sin(GW3 * t - px * 1.3 + pz * 1.9 + 4.1)
    );
    // cross-wind meander
    const cross = g * 0.7 * (
      0.60 * Math.sin(GW2 * 0.83 * t + px * 1.1 + pz * 1.7 + 2.9) +
      0.40 * Math.sin(GW4 * t + pz * 0.9 - px * 2.1 + 0.6)
    );
    // small vertical churn (thermals / rotor)
    const vert = g * 0.3 * (
      0.70 * Math.sin(GW3 * 0.61 * t + px * 1.5 + pz * 0.8 + 1.3) +
      0.30 * Math.sin(GW1 * 1.7 * t + 5.2)
    );

    const d = this._windDir, l = this._windLat;
    out.set(d.x * along + l.x * cross, vert, d.z * along + l.z * cross);
    return out;
  }

  // ----------------------------------------------------------
  update(dt, camera) {
    this._windTime += dt;
    if (!this._ready || !camera) return;

    if (!this._indoor) {
      // sky + celestial sphere ride with the camera so they never clip
      this.sky.position.copy(camera.position);
      this._celestial.position.copy(camera.position);

      if (this.sunLight.visible) this._snapShadow(camera);

      // stars ease in/out through dawn and dusk (target is 0 while an HDRI
      // background is active — the night HDRI has real stars baked in)
      const k = Math.min(1, dt * 1.6);
      const mats = this._starMats;
      for (let i = 0; i < mats.length; i++) {
        mats[i].opacity += (this._starTarget * mats[i].userData.peak - mats[i].opacity) * k;
      }
      const starsOn = mats[0].opacity > 0.004 || this._starTarget > 0.004;
      this._stars.visible = starsOn;
      this._brightStars.visible = starsOn;
    }

    if (this._rainObj.visible) this._updateRain(dt, camera);
  }

  // ----------------------------------------------------------
  // Optional cleanup (not called by main.js today; safe to call anytime).
  dispose() {
    if (this._hdriTimer !== null) {
      clearTimeout(this._hdriTimer);
      this._hdriTimer = null;
    }
    this._hdriToken++; // invalidate any in-flight load
    for (const rt of this._hdriEnvRTs.values()) {
      try { rt.dispose(); } catch (e) { /* noop */ }
    }
    this._hdriEnvRTs.clear();
    this._hdriTex = null;
    this._hdriApplied = false;
    this._hdriKey = null;
    if (this._envRT) {
      try { this._envRT.dispose(); } catch (e) { /* noop */ }
      this._envRT = null;
    }
  }

  // ==========================================================
  // internals
  // ==========================================================

  _applyWindDir() {
    // windDirDeg = compass direction wind blows FROM (0=N=-Z, 90=E=+X).
    // Air velocity points the opposite way.
    const az = this._windDirDeg * DEG2RAD;
    this._windDir.set(-Math.sin(az), 0, Math.cos(az));
    this._windLat.set(this._windDir.z, 0, -this._windDir.x);
  }

  // Sun elevation follows a sine peaking at SUN_PEAK_DEG at 13:00, dips to
  // -NIGHT_DEPTH_DEG at solar midnight; azimuth sweeps E -> S -> W by day and
  // W -> N -> E by night. Continuous and 24h-periodic. Moon is anti-solar.
  _computeSun(hours) {
    let elDeg, azDeg;
    if (hours >= SUNRISE && hours <= SUNSET) {
      const f = (hours - SUNRISE) / DAY_HOURS;
      elDeg = SUN_PEAK_DEG * Math.sin(Math.PI * f);
      azDeg = 90 + 180 * f;
    } else {
      const f = (((hours - SUNSET) % 24) + 24) % 24 / NIGHT_HOURS;
      elDeg = -NIGHT_DEPTH_DEG * Math.sin(Math.PI * f);
      azDeg = 270 + 180 * f;
    }
    this._sunElDeg = elDeg;
    this._sunAzDeg = azDeg;
    const el = elDeg * DEG2RAD, az = azDeg * DEG2RAD;
    const ce = Math.cos(el);
    this._sunDir.set(ce * Math.sin(az), Math.sin(el), -ce * Math.cos(az));
    this._moonDir.copy(this._sunDir).negate();
  }

  // ---------------- HDRI band machinery ----------------

  // Which lighting band does the current sim state fall into?
  // (Order matters and matches the spec: heavy rain always reads overcast.)
  _evaluateBand() {
    if (this._rain >= 0.5) return 'overcast';
    const el = this._sunElDeg;
    if (el < -6) return 'night';
    if (el < 10) return 'sunset';
    return 'day';
  }

  // Request that the background match the current band. Lazy + throttled:
  // the actual load/swap never happens more than once per second, and only
  // when the desired key actually differs from what is applied/attempted.
  _scheduleHDRISwap() {
    const key = (this._hdriBands && this._hdriBands[this._band]) || null;
    this._hdriDesiredKey = key;
    if (key === this._hdriKey) return;         // settled (incl. recorded misses)
    if (this._hdriTimer !== null) return;      // pending swap will read the latest desire
    const wait = HDRI_SWAP_MIN_MS - (nowMs() - this._hdriLastSwap);
    if (wait <= 0) {
      this._beginHDRISwap();
    } else {
      this._hdriTimer = setTimeout(() => {
        this._hdriTimer = null;
        this._beginHDRISwap();
      }, wait);
    }
  }

  async _beginHDRISwap() {
    const key = this._hdriDesiredKey;
    if (key === this._hdriKey) return;         // desire settled while queued
    this._hdriLastSwap = nowMs();
    const token = ++this._hdriToken;
    let tex = null;
    if (key) {
      try {
        tex = (assetLib && assetLib.hdri) ? await assetLib.hdri(key) : null;
      } catch (e) {
        tex = null;
      }
    }
    if (token !== this._hdriToken) return;     // superseded by a newer swap
    if (key !== this._hdriDesiredKey) {        // desire moved while loading
      this._scheduleHDRISwap();
      return;
    }
    this._applyHDRI(key, tex);
  }

  // Record the outcome of a swap and retune the whole atmosphere.
  // tex === null records a miss (missing file / no assets): procedural path.
  // The HDRI texture itself is owned & cached by assetLib — never disposed
  // here. PMREM render targets are cached per key; replaced entries are
  // disposed, and dispose() releases them all.
  _applyHDRI(key, tex) {
    this._hdriKey = key;
    this._hdriTex = tex || null;
    this._hdriApplied = !!tex;
    if (tex && this._pmrem && !this._hdriEnvRTs.has(key)) {
      try {
        const rt = this._pmrem.fromEquirectangular(tex);
        const old = this._hdriEnvRTs.get(key);
        if (old && old !== rt) { try { old.dispose(); } catch (e) { /* noop */ } }
        this._hdriEnvRTs.set(key, rt);
      } catch (e) {
        console.warn('[Environment] HDRI PMREM failed for', key, e);
        // background still usable; scene.environment falls back to procedural RT
      }
    }
    this._applyAtmosphere(); // no-op while indoor; state restores on setIndoor(false)
  }

  // Background brightness within the active band (~1, dimming toward band
  // edges; overcast additionally follows daylight so rainy nights stay dark).
  _hdriBackgroundIntensity(band, el, rain) {
    if (band === 'day')    return 0.85 + 0.15 * smoothstep(10, 26, el);
    if (band === 'sunset') return 0.88 + 0.12 * smoothstep(-6, 2, el);
    if (band === 'night')  return 1.0;
    const dayl = smoothstep(-8, 5, el);        // overcast
    return (0.08 + 0.92 * dayl) * (1 - 0.2 * rain);
  }

  // IBL ambient strength from the PMREM'd HDRI.
  _hdriEnvIntensity(band, el) {
    if (band === 'day')    return 0.9;
    if (band === 'sunset') return 0.8;
    if (band === 'night')  return 0.35;
    return 0.8 * (0.15 + 0.85 * smoothstep(-8, 5, el)); // overcast
  }

  // ---------------- master atmosphere pass ----------------

  _applyAtmosphere() {
    if (!this._ready || this._indoor) return;
    const h = this._hours;
    this._computeSun(h);
    const el = this._sunElDeg;
    const rain = this._rain;
    const dim = 1 - 0.45 * rain;
    const scene = this.scene;

    // ---------- band selection + lazy HDRI swap ----------
    this._band = this._evaluateBand();
    this._scheduleHDRISwap();                       // throttled; async; cheap no-op when settled
    const band = this._band;
    const ibl = this._hdriApplied && !!this._hdriTex;
    const dayl = smoothstep(-8, 5, el);             // shared daylight factor

    // ---------- sky shader (procedural path; harmless while hidden) ----------
    const u = this.sky.material.uniforms;
    u.sunPosition.value.copy(this._sunDir);
    u.turbidity.value = ramp(SKY_TURBIDITY, el) + rain * 4;
    u.rayleigh.value = ramp(SKY_RAYLEIGH, el);
    u.mieCoefficient.value = ramp(SKY_MIE_COEFF, el) + rain * 0.01;
    u.mieDirectionalG.value = ramp(SKY_MIE_G, el);

    // ---------- background & environment (HDRI vs procedural) ----------
    if (ibl) {
      this.sky.visible = false;                     // real sky photo replaces the dome
      scene.background = this._hdriTex;
      const rt = this._hdriEnvRTs.get(this._hdriKey);
      scene.environment = rt ? rt.texture : (this._envRT ? this._envRT.texture : null);
      // rotate the panorama so its baked sun roughly tracks the computed one
      const rotY = (this._sunAzDeg - 90 - (HDRI_BAKED_SUN_AZ_DEG[this._hdriKey] || 0)) * DEG2RAD;
      try {
        if ('backgroundRotation' in scene) scene.backgroundRotation.set(0, rotY, 0);
        if ('environmentRotation' in scene) scene.environmentRotation.set(0, rotY, 0);
        if ('backgroundIntensity' in scene) {
          scene.backgroundIntensity = this._hdriBackgroundIntensity(band, el, rain);
        }
        if ('environmentIntensity' in scene) {
          scene.environmentIntensity = this._hdriEnvIntensity(band, el);
        }
      } catch (e) { /* older three — background still works unrotated */ }
    } else {
      this.sky.visible = true;
      scene.background = null;                      // sky dome draws the backdrop
      scene.environment = this._envRT ? this._envRT.texture : null;
      try {
        if ('backgroundRotation' in scene) scene.backgroundRotation.set(0, 0, 0);
        if ('environmentRotation' in scene) scene.environmentRotation.set(0, 0, 0);
        if ('backgroundIntensity' in scene) scene.backgroundIntensity = 1;
        if ('environmentIntensity' in scene) scene.environmentIntensity = 0.5;
      } catch (e) { /* noop */ }
    }

    // ---------- sun light (always the shadow caster) ----------
    let sunI;
    if (ibl) {
      const tune = HDRI_SUN[band] || HDRI_SUN.day;
      sunI = tune.intensity * dim;
      if (band === 'overcast') sunI *= dayl;        // rainy night stays dark
      this.sunLight.color.setHex(tune.color);
    } else {
      sunI = ramp(SUN_INTENSITY, el) * dim;
      rampColor(SUN_COLOR, el, this.sunLight.color);
    }
    this.sunLight.intensity = sunI;
    this.sunLight.visible = sunI > 0.01;
    // sensible pose before the first per-frame shadow snap
    this.sunLight.position.copy(this._sunDir).multiplyScalar(SHADOW_DIST);
    this.sunLight.target.position.set(0, 0, 0);

    // ---------- moon light ----------
    const moonEl = -el;
    const moonPeak = (ibl && band === 'night') ? 0.25 : 0.5;
    const moonI = moonPeak * clamp((moonEl - 1) / 7, 0, 1) * dim;
    this.moonLight.intensity = moonI;
    this.moonLight.visible = moonI > 0.01;
    this.moonLight.position.copy(this._moonDir).multiplyScalar(300);

    // ---------- moon disc (hidden over HDRI skies — they're photographs) ----------
    this._moonDisc.position.copy(this._moonDir);
    this._tmpA.copy(this._moonDir).negate();
    this._moonDisc.quaternion.setFromUnitVectors(Z_AXIS, this._tmpA);
    const moonOp = ibl ? 0 : clamp((moonEl - 0.5) / 6, 0, 1) * (1 - 0.65 * rain);
    this._moonMat.opacity = moonOp * 0.95;
    this._moonDisc.visible = moonOp > 0.02;

    // ---------- hemisphere ambient ----------
    let hemiI = ramp(HEMI_INTENSITY, el) * (1 - 0.25 * rain);
    rampColor(HEMI_SKY_COLOR, el, this.hemi.color);
    rampColor(HEMI_GROUND_COLOR, el, this.hemi.groundColor);
    if (ibl) {
      hemiI *= 0.5;                                 // PMREM IBL now supplies most ambient
      if (band === 'overcast') {
        // soft shadowless look: lift ambient during overcast daylight
        hemiI = Math.max(hemiI, 0.62 * dayl * (1 - 0.15 * rain));
      }
    }
    this.hemi.intensity = hemiI;

    // ---------- fog ----------
    if (ibl) {
      this._fogBase.copy(HDRI_FOG[band] || HDRI_FOG.day);
      if (band === 'overcast') this._fogBase.multiplyScalar(0.15 + 0.85 * dayl);
    } else {
      rampColor(FOG_COLOR, el, this._fogBase);
    }
    this._applyFog();

    // ---------- exposure (ACES) ----------
    if (ibl) {
      // recalibrated for HDRI backdrops: day ~0.75, sunset ~0.8, night ~0.5, overcast ~0.7
      const ex = (band === 'overcast') ? (0.5 + 0.2 * dayl) : ramp(HDRI_EXPOSURE, el);
      this.renderer.toneMappingExposure = ex * (1 - 0.08 * rain);
    } else {
      // original procedural calibration (0.85 day -> 0.45 deep night)
      const ex = 0.45 + 0.40 * smoothstep(-12, 10, el);
      this.renderer.toneMappingExposure = ex * (1 - 0.08 * rain);
    }

    // ---------- stars (faded in update(); HDRI skies have real stars baked) ----------
    this._starTarget = ibl ? 0 : clamp((-el - 0.5) / 9, 0, 1) * (1 - 0.75 * rain);

    // ---------- procedural environment reflections (skipped while HDRI IBL is live) ----------
    if (!ibl) {
      let need = this._envBuiltAt === null;
      if (!need) {
        const d = Math.abs(h - this._envBuiltAt);
        need = Math.min(d, 24 - d) > 0.25;
      }
      if (need) this._rebuildEnvMap();
    }
  }

  _applyFog() {
    const d = this._renderDistance;
    const rain = this._rain;
    if (this._indoor) {
      this._fog.color.copy(INDOOR_FOG);
      this._fog.near = Math.max(8, d * 0.12);
      this._fog.far = d * 0.95;
      return;
    }
    this._fog.near = Math.max(8, d * 0.30 * (1 - 0.45 * rain));
    this._fog.far = Math.max(this._fog.near + 20, d * 1.05 * (1 - 0.35 * rain));
    this._fog.color.copy(this._fogBase).lerp(RAIN_FOG_GRAY, rain * 0.5);
  }

  _rebuildEnvMap() {
    try {
      const sky = this.sky;
      const px = sky.position.x, py = sky.position.y, pz = sky.position.z;
      const wasVisible = sky.visible;
      sky.visible = true;
      sky.position.set(0, 0, 0);
      this._envScene.add(sky);                 // reparents out of this.scene
      const rt = this._pmrem.fromScene(this._envScene);
      this.scene.add(sky);                     // reparent back
      sky.position.set(px, py, pz);
      sky.visible = wasVisible;
      if (this._envRT) this._envRT.dispose();  // dispose the replaced target
      this._envRT = rt;
      if (!this._indoor && !this._hdriApplied) this.scene.environment = rt.texture;
      this._envBuiltAt = this._hours;
    } catch (e) {
      console.warn('[Environment] env map rebuild failed', e);
      this._envBuiltAt = this._hours;          // do not retry every call
    }
  }

  // Keep the sun's ortho shadow box centered on the camera, snapped to the
  // shadow-map texel grid in light space so edges don't shimmer as we fly.
  _snapShadow(camera) {
    const dir = this._sunDir;                  // unit, toward the sun
    // light-space basis (sun elevation <= 70°, so cross with +Y is safe)
    const right = this._svRight.set(dir.z, 0, -dir.x).normalize();
    const up = this._svUp.crossVectors(dir, right);
    const texel = (SHADOW_HALF * 2) / this._shadowRes;

    const p = camera.position;
    const cx = Math.round(p.dot(right) / texel) * texel;
    const cy = Math.round(p.dot(up) / texel) * texel;
    const cz = p.dot(dir);

    const center = this._svCenter.set(0, 0, 0)
      .addScaledVector(right, cx)
      .addScaledVector(up, cy)
      .addScaledVector(dir, cz);

    this.sunLight.target.position.copy(center);
    this.sunLight.position.copy(center).addScaledVector(dir, SHADOW_DIST);
    this.sunLight.target.updateMatrixWorld();
  }

  // ---------------- builders ----------------

  _buildStars(count, size, peakOpacity) {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // uniform band on the unit sphere, slightly past the horizon
      const y = -0.08 + 1.08 * Math.random();
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      pos[i * 3] = r * Math.cos(a);
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = r * Math.sin(a);

      const pick = Math.random();
      const b = 0.65 + 0.35 * Math.random();
      let cr, cg, cb;
      if (pick < 0.70)      { cr = b; cg = b; cb = b; }             // white
      else if (pick < 0.90) { cr = 0.62 * b; cg = 0.72 * b; cb = b; } // cool blue
      else                  { cr = b; cg = 0.83 * b; cb = 0.62 * b; } // warm
      col[i * 3] = cr; col[i * 3 + 1] = cg; col[i * 3 + 2] = cb;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    mat.userData.peak = peakOpacity;
    this._starMats.push(mat);
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    points.visible = false;
    points.renderOrder = 2;
    return points;
  }

  _buildMoonDisc() {
    let tex = null;
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      if (g) {
        const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grd.addColorStop(0.00, 'rgba(255,252,240,1)');
        grd.addColorStop(0.28, 'rgba(240,244,255,0.95)');
        grd.addColorStop(0.38, 'rgba(190,205,235,0.35)');
        grd.addColorStop(0.70, 'rgba(150,170,210,0.08)');
        grd.addColorStop(1.00, 'rgba(140,160,200,0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, 128, 128);
        tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
      }
    } catch (e) { tex = null; }

    this._moonMat = new THREE.MeshBasicMaterial({
      map: tex || null,
      color: tex ? 0xffffff : 0xe8eeff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    // unit celestial space; the group's scale keeps angular size constant
    this._moonDisc = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), this._moonMat);
    this._moonDisc.frustumCulled = false;
    this._moonDisc.visible = false;
    this._moonDisc.renderOrder = 3;
  }

  _buildRain() {
    const verts = new Float32Array(RAIN_COUNT * 6);   // 2 verts per streak
    this._rainHeads = new Float32Array(RAIN_COUNT * 3);
    this._rainSpd = new Float32Array(RAIN_COUNT);
    const half = RAIN_SIZE / 2;
    for (let i = 0; i < RAIN_COUNT; i++) {
      this._rainHeads[i * 3] = (Math.random() - 0.5) * RAIN_SIZE;
      this._rainHeads[i * 3 + 1] = (Math.random() - 0.5) * RAIN_SIZE + half; // bias upward
      this._rainHeads[i * 3 + 2] = (Math.random() - 0.5) * RAIN_SIZE;
      this._rainSpd[i] = 0.7 + 0.6 * Math.random();
    }
    this._rainGeo = new THREE.BufferGeometry();
    this._rainAttr = new THREE.BufferAttribute(verts, 3);
    this._rainAttr.setUsage(THREE.DynamicDrawUsage);
    this._rainGeo.setAttribute('position', this._rainAttr);
    this._rainGeo.setDrawRange(0, 0);
    this._rainMat = new THREE.LineBasicMaterial({
      color: 0x9db4c6,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      fog: true,
    });
    this._rainObj = new THREE.LineSegments(this._rainGeo, this._rainMat);
    this._rainObj.frustumCulled = false;   // always surrounds the camera
    this._rainObj.visible = false;
    this._rainObj.renderOrder = 4;
  }

  _updateRain(dt, camera) {
    const cam = camera.position;
    const w = this.getWind(cam, this._tmpA);       // wind shear at the camera
    const rain = this._rain;
    const fall = 7.5 + 6.5 * rain;                 // heavier rain falls faster
    const vx = w.x * 0.85, vy = -fall, vz = w.z * 0.85;
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
    const k = this._streakLen / speed;             // streak along the velocity
    const ox = vx * k, oy = vy * k, oz = vz * k;

    const heads = this._rainHeads;
    const spd = this._rainSpd;
    const arr = this._rainAttr.array;
    const n = this._rainActive;
    const cx = cam.x, cy = cam.y, cz = cam.z;

    for (let i = 0; i < n; i++) {
      const j = i * 3;
      const f = spd[i];
      let x = heads[j] + vx * f * dt;
      let y = heads[j + 1] + vy * f * dt;
      let z = heads[j + 2] + vz * f * dt;
      // wrap into a RAIN_SIZE box centered on the camera (branch-free)
      let dx = x - cx; dx -= RAIN_SIZE * Math.round(dx / RAIN_SIZE); x = cx + dx;
      let dy = y - cy; dy -= RAIN_SIZE * Math.round(dy / RAIN_SIZE); y = cy + dy;
      let dz = z - cz; dz -= RAIN_SIZE * Math.round(dz / RAIN_SIZE); z = cz + dz;
      heads[j] = x; heads[j + 1] = y; heads[j + 2] = z;

      const q = i * 6;
      arr[q] = x; arr[q + 1] = y; arr[q + 2] = z; // head (leading tip)
      arr[q + 3] = x - ox;                        // tail trails opposite velocity
      arr[q + 4] = y - oy;
      arr[q + 5] = z - oz;
    }
    this._rainAttr.needsUpdate = true;
  }
}
