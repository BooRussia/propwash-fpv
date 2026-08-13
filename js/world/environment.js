// ============================================================
// PropWash FPV — atmosphere: procedural sky, sun/moon, stars, fog, wind, rain
// ============================================================
// Owns: scene.background, scene.environment, scene.fog,
// renderer.toneMappingExposure (after boot), the sun/moon/hemisphere
// lights, the sky dome + night dome, the star field and the rain field.
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
//   setSkyMode('procedural' | 'hdri' | null)      null = follow settings
//   update(dt, camera)             camera = ACTIVE camera
//   getWind(posVector3, outVector3) -> outVector3   (allocation-free)
//   dispose()                      frees render targets / GPU resources
//
// ------------------------------------------------------------
// SKY ARCHITECTURE (procedural is the default and only default)
//
//   1. `sky`  — three/addons Sky (Preetham). Drives the LIT sky: deep blue at
//      altitude, warm horizon band through sunrise/sunset. Its turbidity /
//      rayleigh / mie parameters are continuous functions of sun elevation and
//      of the weather, re-evaluated on every setTimeOfDay / setWeather, so a
//      time slider drag reads as one continuous sweep with no banding or pops.
//      The Preetham model dies at roughly -2.3 deg of sun elevation, which is
//      exactly where layer 2 takes over.
//
//   2. `nightDome` — a custom shader dome composited OVER the Sky with
//      premultiplied alpha. It carries everything Preetham cannot express:
//        * the deep blue-black night gradient (never pure black)
//        * the blue-hour twilight lobe in the sun's azimuth (the thing that
//          makes dusk keep glowing after the Sky has gone flat)
//        * the violet upper wash and the anti-solar Belt of Venus
//        * Miami's warm city skyglow hugging the horizon
//        * a faint Milky Way band and the moon's halo
//        * the OVERCAST/RAIN layer — a drifting grey cloud deck whose opacity
//          follows `rain`, warm-tinted toward the sun so a rainy sunset still
//          reads as a sunset, only muted.
//      Its alpha ramps 0 -> 1 across sun elevation +1.5 -> -6 deg, so the two
//      layers cross-fade through exactly the window where the Preetham sky
//      loses energy. Everything it draws is driven by JS colour/scalar ramps,
//      so every parameter is a smooth function of elevation and weather.
//
//   3. stars (shader Points, twinkle + magnitude distribution + galactic band)
//      and the moon disc (phase-correct terminator, limb darkening, halo)
//      render additively on top, both pinned to the far plane so they are
//      occluded by the world but never clipped.
//
//   Image-based lighting is generated from layers 1+2 with PMREMGenerator and
//   rebuilt (throttled) whenever the sun has moved enough to matter, so
//   reflections and ambient track the sky at every hour.
//
// HDRI: photographic bands are still supported through setHDRIBands() but are
// OFF by default. Opt in with settings.environment.photoSky = true (or
// setSkyMode('hdri')). setHDRIBands() never throws for existing callers.
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

// The moon walks the same celestial arc, offset in time. The offset both
// places it in the sky and defines the direction of its bright limb.
const MOON_OFFSET_HOURS = -1.1;
const MOON_ILLUM = 0.78;           // illuminated fraction (waxing gibbous)

// ---------------- shadow constants ----------------
const SHADOW_HALF = 60;            // 120 m ortho box around the camera
const SHADOW_DIST = 180;           // light distance from shadow center

// ---------------- rain constants ----------------
const RAIN_COUNT = 3000;           // line segments
const RAIN_SIZE = 60;              // wrap box edge (m), centered on camera

// ---------------- star constants ----------------
const STAR_COUNT = 2600;
const STAR_BAND_FRACTION = 0.34;   // share clustered along the galactic plane

// ---------------- sky geometry constants ----------------
const DOME_SCALE = 1000;           // both domes; depth is pinned to the far plane
const MOON_RADIUS_RAD = 0.019;     // ~1.1 deg angular radius (flattering, not literal)
const MOON_SPAN = 5.0;             // plane half-width in moon radii (room for the halo)

// ---------------- env-map (PMREM) throttling ----------------
const ENV_MIN_MS = 160;            // never rebuild reflections faster than this
const ENV_HOUR_EPS = 0.2;          // sim-hours of sun travel that force a rebuild
const ENV_RAIN_EPS = 0.05;

// ---------------- gust field constants ----------------
const GW1 = Math.PI * 2 * 0.13;    // rad/s — incommensurate gust frequencies
const GW2 = Math.PI * 2 * 0.37;
const GW3 = Math.PI * 2 * 0.71;
const GW4 = Math.PI * 2 * 1.17;
const GPOS = 0.021;                // spatial phase scale (rad per meter-ish)

// ---------------- keyframe ramps over sun elevation (degrees) ----------------
const C = (hex) => new THREE.Color(hex);

// --- Preetham parameters. Rayleigh peaks around the horizon crossing (deep
// reds at sunset), mie widens and strengthens as the sun sinks, turbidity
// stays low for clean tropical air and is driven up by rain.
const SKY_TURBIDITY = [[-10, 2.0], [-4, 2.6], [-1, 3.2], [1, 3.4], [4, 3.2], [12, 2.9], [30, 2.6], [70, 2.4]];
const SKY_RAYLEIGH  = [[-10, 3.0], [-4, 4.4], [-1, 5.2], [1, 5.2], [4, 4.6], [12, 3.9], [30, 3.4], [70, 3.2]];
const SKY_MIE_COEFF = [[-10, 0.004], [-4, 0.008], [-1, 0.012], [1, 0.013], [4, 0.009], [12, 0.005], [30, 0.0032], [70, 0.0028]];
const SKY_MIE_G     = [[-4, 0.90], [0, 0.88], [8, 0.84], [25, 0.79], [70, 0.76]];

// --- Preetham output grade (see _patchSkyShader). The Preetham fragment ends
// with pow(texColor, 1/2.4), which is effectively a gamma encode: it lifts and
// desaturates everything, so an un-graded sky reads as near-white at any sun
// height above ~20 deg. These two ramps pull it back — gain sets how much of
// the atmosphere's energy reaches the frame, saturation restores the colour
// the gamma curve ate. Together they are what turns the sky from "hazy white"
// into deep blue at altitude and a saturated red band at sunset.
const SKY_GAIN = [[-14, 0.80], [-6, 0.68], [-2, 0.58], [0, 0.45], [3, 0.36], [8, 0.28], [16, 0.225], [30, 0.172], [70, 0.145]];
// Saturation has to stay moderate at altitude: Preetham's daylight output is
// already green-dominant, so pushing this much past ~2.1 drags the zenith into
// teal instead of deepening it into blue.
const SKY_SAT  = [[-14, 1.12], [-2, 1.22], [0, 1.30], [4, 1.38], [12, 1.58], [30, 1.86], [70, 2.05]];

// --- IBL ambient from the graded procedural sky (compensates the gain above).
// The top stops track SKY_GAIN: the daylight gain drop above is offset here so
// ambient bounce stays exactly where the maps were authored against.
const ENV_INTENSITY = [[-40, 0.90], [-8, 0.90], [-2, 0.85], [2, 0.95], [10, 1.36], [30, 1.66], [70, 1.78]];

// --- lights
const SUN_INTENSITY  = [[-2.5, 0], [0, 0.55], [4, 1.5], [10, 2.3], [25, 2.9], [70, 3.1]];
const HEMI_INTENSITY = [[-40, 1.10], [-12, 1.00], [-4, 0.70], [0, 0.55], [10, 0.52], [70, 0.64]];
// Moonlight is deliberately generous: physically a full moon is ~1/400000 of
// daylight, which renders as pure black. This is the level at which a moonlit
// world is actually flyable while still reading as night.
const MOON_LIGHT_PEAK = 3.4;

const SUN_COLOR = [
  [-2, C(0xff4f20)], [0, C(0xff7833)], [4, C(0xffad60)],
  [12, C(0xffd8a1)], [30, C(0xfff3e2)], [70, C(0xfffdf8)],
];
const SUN_RAIN_COLOR = C(0xb9a99c);   // muted, slightly warm grey through cloud

const HEMI_SKY_COLOR = [
  [-40, C(0x24365e)], [-14, C(0x2a3d66)], [-6, C(0x3a4870)], [-2, C(0x5a4f6a)],
  [0, C(0x7c5a60)], [5, C(0xa08266)], [12, C(0x7fa0c2)], [70, C(0x8fb9dd)],
];
const HEMI_GROUND_COLOR = [
  [-40, C(0x161a26)], [-14, C(0x1a1e2a)], [-6, C(0x24242e)], [-2, C(0x342c30)],
  [0, C(0x453329)], [5, C(0x5c4834)], [12, C(0x565349)], [70, C(0x5f5a4d)],
];

const FOG_COLOR = [
  [-40, C(0x0a1122)], [-14, C(0x111c33)], [-8, C(0x1c2842)], [-4, C(0x38364f)],
  [-1, C(0x7d5251)], [1, C(0xb07047)], [5, C(0xc59a6e)], [10, C(0xb6ab95)],
  [18, C(0xa3b8cc)], [70, C(0xaec8de)],
];
const RAIN_FOG_GRAY = C(0x6f767e);
const INDOOR_FOG = C(0x14171c);

// --- tone-mapping exposure (ACES). Daylight keeps the calibration the maps
// were authored against; night is lifted enough to fly by.
const EXPOSURE = [
  [-40, 0.62], [-14, 0.65], [-6, 0.72], [-1, 0.78], [2, 0.82], [10, 0.85], [30, 0.86], [70, 0.85],
];

// ---------------- night-dome ramps ----------------
const NIGHT_ZENITH = [
  [-40, C(0x0d1533)], [-16, C(0x111c3f)], [-9, C(0x142449)], [-5, C(0x152c5c)],
  [-2, C(0x14306a)], [3, C(0x122a55)],
];
const NIGHT_HORIZON = [
  [-40, C(0x141d38)], [-16, C(0x1b2745)], [-9, C(0x243050)], [-5, C(0x373a56)],
  [-2, C(0x4a3549)], [3, C(0x5a3340)],
];
const TWI_COLOR = [
  [-18, C(0x24122a)], [-12, C(0x4d1f3c)], [-8, C(0x8d3438)], [-4.5, C(0xd4602c)],
  [-1.5, C(0xff8a3a)], [3, C(0xffa960)],
];
const TWI_STRENGTH = [[-20, 0], [-14, 0.12], [-9, 0.45], [-5, 1.00], [-2, 1.45], [0, 1.60], [5, 1.60]];
const TWI_HI_COLOR = [
  [-16, C(0x131a3c)], [-9, C(0x2b2354)], [-5, C(0x5a2f66)], [-1.5, C(0x86436e)], [3, C(0x9c5f68)],
];
const TWI_HI_STRENGTH = [[-18, 0], [-12, 0.06], [-7, 0.22], [-3, 0.44], [0, 0.50], [5, 0.50]];
const BELT_COLOR = C(0xd07f95);
const BELT_STRENGTH = [[-13, 0], [-8, 0.07], [-4, 0.19], [-0.5, 0.22], [3, 0.12], [7, 0]];

// Miami is a bright city: a warm sodium/LED wash sits on the horizon all night.
const GLOW_COLOR = C(0xffb673);
const GLOW_STRENGTH = [[-40, 0.30], [-14, 0.28], [-8, 0.21], [-4, 0.11], [-0.5, 0.02], [2, 0]];

const NIGHT_LIFT = 1.95;           // linear multiplier on the night base gradient
const MW_COLOR = C(0xa9bcdf);
const MW_STRENGTH = [[-40, 0.095], [-17, 0.080], [-11, 0.042], [-7, 0.012], [-4, 0]];
const MOON_GLOW_COLOR = C(0xcddcff);

// --- overcast deck (only visible when rain > 0)
const CLOUD_TOP = [
  [-40, C(0x14161f)], [-14, C(0x181b25)], [-6, C(0x2b2f3a)], [-1, C(0x4c4852)],
  [3, C(0x6f7484)], [12, C(0x8f98a7)], [70, C(0xa9b2c1)],
];
// the underside of a rainy city night: sodium light bounced back down
const CLOUD_BOT = [
  [-40, C(0x33221a)], [-14, C(0x3a2820)], [-6, C(0x4a3a2c)], [-1, C(0x7a594b)],
  [3, C(0x9b8678)], [12, C(0xaaaeb5)], [70, C(0xc3c9d2)],
];
const CLOUD_SUN_COLOR = [
  [-8, C(0x2c1511)], [-2, C(0x8e4522)], [1, C(0xc2733a)], [5, C(0xd39a5e)],
  [14, C(0xd0c2ab)], [70, C(0xdadada)],
];
const CLOUD_SUN_STRENGTH = [[-9, 0], [-4, 0.08], [-1, 0.28], [3, 0.32], [14, 0.18], [70, 0.11]];

// ---------------- HDRI band constants (opt-in path) ----------------
const DEFAULT_HDRI_BANDS = {
  day: 'day_clear',
  sunset: 'sunset',
  night: 'night',
  overcast: 'overcast',
};

const HDRI_BAKED_SUN_AZ_DEG = {
  beach_day: 0, day_clear: 0, sunset: 0, night: 0, overcast: 0,
};

const HDRI_SUN = {
  day:      { intensity: 2.5, color: 0xfff1dc },
  sunset:   { intensity: 1.8, color: 0xff9440 },
  night:    { intensity: 0.0, color: 0xfff1dc },
  overcast: { intensity: 0.6, color: 0xe8ecef },
};

const HDRI_FOG = {
  day: C(0xa9bccb),
  sunset: C(0xc79b6e),
  night: C(0x05070d),
  overcast: C(0x8d949c),
};

const HDRI_EXPOSURE = [
  [-12, 0.50], [-6, 0.66], [-2, 0.76], [2, 0.80], [10, 0.80], [24, 0.75], [70, 0.74],
];

const HDRI_SWAP_MIN_MS = 1000;

const Z_AXIS = new THREE.Vector3(0, 0, 1);
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

// ============================================================
// shaders
// ============================================================

// Both domes pin z to w so they sit exactly on the far plane: never clipped by
// camera.far, always occluded by anything the world has already drawn.
const DOME_VERT = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_Position.z = gl_Position.w;
}
`;

const DOME_FRAG = /* glsl */`
uniform vec3 uSunDir;
uniform vec3 uMoonDir;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uGlowCol;
uniform float uGlow;
uniform vec3 uTwiCol;
uniform float uTwi;
uniform vec3 uTwiHiCol;
uniform float uTwiHi;
uniform vec3 uBeltCol;
uniform float uBelt;
uniform vec3 uMwCol;
uniform vec3 uMwAxis;
uniform float uMw;
uniform vec3 uMoonGlowCol;
uniform float uMoonGlow;
uniform float uNight;
uniform vec3 uCloudTop;
uniform vec3 uCloudBot;
uniform vec3 uCloudSunCol;
uniform float uCloudSun;
uniform float uCloud;
uniform vec3 uCloudOfs;
uniform float uDetail;

varying vec3 vDir;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i);
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z);
}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec2 dh = normalize(vec2(d.x, d.z) + vec2(1e-5, 1e-5));
  vec2 sh = normalize(vec2(uSunDir.x, uSunDir.z) + vec2(1e-5, 1e-5));
  float sa = max(dot(dh, sh), 0.0);

  // ---------- night layer ----------
  vec3 night = mix(uHorizon, uZenith, pow(clamp(h + 0.07, 0.0, 1.0), 0.55));

  // city skyglow hugging the horizon, gently uneven around the compass
  float az = atan(d.z, d.x);
  float glowAz = 0.70 + 0.30 * (0.5 + 0.5 * sin(az * 2.0 + 0.9));
  night += uGlowCol * (uGlow * exp(-max(h, 0.0) * 11.0) * smoothstep(-0.30, 0.0, h) * glowAz);

  // twilight lobe toward the sun + broad violet wash above it
  float lobe = pow(sa, 2.2);
  night += uTwiCol * (uTwi * lobe * exp(-max(h, 0.0) * 6.5) * smoothstep(-0.22, -0.01, h));
  night += uTwiHiCol * (uTwiHi * (0.30 + 0.70 * lobe) * exp(-max(h, 0.0) * 2.0));

  // Belt of Venus / earth shadow, opposite the sun
  float ab = max(-dot(dh, sh), 0.0);
  night += uBeltCol * (uBelt * ab * ab * exp(-abs(h - 0.11) * 13.0));

  // Milky Way band
  if (uMw > 0.0005) {
    float mwd = dot(d, uMwAxis);
    float band = exp(-mwd * mwd * 30.0);
    float n = vnoise(d * 7.0);
    n = mix(n, n * 0.55 + vnoise(d * 19.0) * 0.45, uDetail);
    night += uMwCol * (uMw * band * (0.22 + 1.15 * n * n) * smoothstep(-0.02, 0.18, h));
  }

  // moon halo
  float ang = 1.0 - max(dot(d, uMoonDir), 0.0);
  float halo = exp(-ang * 900.0) * 0.55 + exp(-ang * 90.0) * 0.30 + exp(-ang * 6.0) * 0.06;
  night += uMoonGlowCol * (uMoonGlow * halo);

  // ---------- overcast layer ----------
  vec3 cloud = mix(uCloudBot, uCloudTop, smoothstep(-0.06, 0.55, h));
  float ca = uCloud;
  if (uCloud > 0.001) {
    float cn = vnoise(d * 2.6 + uCloudOfs);
    cn = mix(cn, cn * 0.6 + vnoise(d * 6.4 + uCloudOfs * 2.1) * 0.4, uDetail);
    cloud *= 0.70 + 0.64 * cn;
    cloud += uCloudSunCol * (uCloudSun * pow(sa, 3.0) * exp(-max(h, 0.0) * 3.2));
    ca = clamp(ca * (0.78 + 0.36 * cn) * (0.90 + 0.10 * smoothstep(0.0, 0.45, h)), 0.0, 1.0);
  }

  // composite: night over sky, then cloud over that (premultiplied alpha)
  float a1 = uNight;
  float outA = ca + a1 * (1.0 - ca);
  vec3 outC = cloud * ca + night * (a1 * (1.0 - ca));
  gl_FragColor = vec4(outC, outA);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const STAR_VERT = /* glsl */`
attribute vec3 aColor;
attribute float aSize;
attribute float aTw;
attribute float aPh;
uniform float uTime;
uniform float uOpacity;
uniform float uPixelRatio;
varying vec3 vColor;
varying float vA;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_Position.z = gl_Position.w;
  // scintillation: stronger low in the sky, where the air path is longest
  float amp = 0.14 + 0.24 * (1.0 - clamp(position.y, 0.0, 1.0));
  float tw = 1.0 + amp * (sin(uTime * aTw + aPh) * 0.68 + sin(uTime * aTw * 2.13 + aPh * 1.7) * 0.32);
  tw = clamp(tw, 0.42, 1.55);
  vColor = aColor;
  vA = uOpacity * tw;
  gl_PointSize = max(1.0, aSize * uPixelRatio * (0.88 + 0.13 * tw));
}
`;

const STAR_FRAG = /* glsl */`
varying vec3 vColor;
varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d2 = dot(c, c);
  if (d2 > 0.25) discard;
  float a = max(exp(-d2 * 15.0) - 0.0286, 0.0) * 1.03;
  gl_FragColor = vec4(vColor * (a * vA), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const MOON_VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_Position.z = gl_Position.w;
}
`;

const MOON_FRAG = /* glsl */`
uniform sampler2D uMap;
uniform vec2 uLit;        // bright-limb direction in disc space (unit)
uniform float uK;         // terminator ellipse param: 1 - 2 * illuminated
uniform float uSpan;      // plane half-width in moon radii
uniform float uOpacity;
uniform vec3 uTint;
uniform float uGlow;
uniform float uEarth;     // earthshine on the unlit limb
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * (2.0 * uSpan);
  float r = length(p);
  float disc = smoothstep(1.02, 0.94, r);
  float a = dot(p, uLit);
  float b = dot(p, vec2(-uLit.y, uLit.x));
  float term = uK * sqrt(max(1.0 - min(b * b, 1.0), 0.0));
  float lit = smoothstep(term - 0.11, term + 0.11, a);
  float shade = mix(uEarth, 1.0, lit);
  float rr = min(r, 1.0);
  shade *= 0.62 + 0.38 * pow(sqrt(max(1.0 - rr * rr, 0.0)), 0.4);
  vec3 alb = texture2D(uMap, p * 0.5 + 0.5).rgb;
  float halo = exp(-max(r - 1.0, 0.0) * 2.2) * uGlow;
  vec3 col = uTint * (alb * (shade * disc) + halo * 0.5);
  gl_FragColor = vec4(col * uOpacity, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

// ============================================================
// helpers
// ============================================================

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

// deterministic PRNG so the star field and the moon's maria are identical
// every session (screenshots stay comparable)
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
    this._detail = 1;                 // 0 on low quality: one noise octave instead of two

    // ---- sun/moon state ----
    this._sunElDeg = 45;
    this._sunAzDeg = 90;
    this._moonElDeg = -45;
    this._moonAzDeg = 270;
    this._sunDir = new THREE.Vector3(0, 1, 0);
    this._moonDir = new THREE.Vector3(0, -1, 0);
    this._moonIllum = MOON_ILLUM;

    // ---- wind state (allocation-free getWind) ----
    this._windTime = Math.random() * 512;         // decorrelate sessions
    this._windDir = new THREE.Vector3(0, 0, 1);   // air VELOCITY direction (TO)
    this._windLat = new THREE.Vector3(1, 0, 0);   // horizontal perpendicular
    this._applyWindDir();

    // ---- rain state ----
    this._rainActive = 0;
    this._streakLen = 0.3;

    // ---- sky animation state ----
    this._skyTime = 0;
    this._starOpacity = 0;
    this._starTarget = 0;
    this._cloudDrift = new THREE.Vector3(0, 0, 0);

    // ---- procedural env map bookkeeping ----
    this._envRT = null;
    this._envDirty = true;
    this._envLastBuild = -Infinity;
    this._envBuiltHours = null;
    this._envBuiltRain = -1;

    // ---- HDRI IBL state (opt-in) ----
    this._hdriBands = { ...DEFAULT_HDRI_BANDS };
    this._band = 'day';
    this._hdriKey = null;
    this._hdriDesiredKey = null;
    this._hdriTex = null;
    this._hdriApplied = false;
    this._hdriEnvRTs = new Map();
    this._hdriToken = 0;
    this._hdriLastSwap = -Infinity;
    this._hdriTimer = null;
    this._skyModeForced = null;       // null = follow settings.environment.photoSky

    // ---- reusable temps (no per-frame allocations) ----
    this._tmpA = new THREE.Vector3();
    this._tmpB = new THREE.Vector3();
    this._tmpC = new THREE.Vector3();
    this._svRight = new THREE.Vector3();
    this._svUp = new THREE.Vector3();
    this._svCenter = new THREE.Vector3();
    this._fogBase = new THREE.Color(0x9fb8d0);
    this._tmpCol = new THREE.Color();
  }

  // ----------------------------------------------------------
  async init() {
    const scene = this.scene;

    // ---------- lit sky dome (Preetham) ----------
    this.sky = new Sky();
    this._patchSkyShader();
    this.sky.scale.setScalar(DOME_SCALE);
    this.sky.frustumCulled = false;
    // draw the backdrop AFTER the opaque world so the depth test throws away
    // every sky pixel the city already covers (it is centred on the camera, so
    // the default front-to-back sort would otherwise put it first)
    this.sky.renderOrder = 5;
    scene.add(this.sky);

    // ---------- night / weather dome ----------
    this._buildNightDome();
    scene.add(this.nightDome);

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
    this.moonLight = new THREE.DirectionalLight(0x9db2d8, 0);
    this.moonLight.visible = false;
    scene.add(this.moonLight);

    // ---------- hemisphere ambient ----------
    this.hemi = new THREE.HemisphereLight(0x8fb9dd, 0x5f5a4d, 0.5);
    scene.add(this.hemi);

    // ---------- celestial group (stars + moon), rides with the camera ----------
    this._celestial = new THREE.Group();
    scene.add(this._celestial);

    this._buildStars();
    this._celestial.add(this._stars);

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
    }); // -> _applyAtmosphere()

    // build the first reflection probe immediately so nothing pops on frame 1
    this._rebuildEnvMap();
  }

  // ----------------------------------------------------------
  setTimeOfDay(hours) {
    const h = finite(hours, 12);
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

    this._applyAtmosphere(); // rain also drives sky, fog, light, exposure, stars
  }

  // ----------------------------------------------------------
  // Map hook: choose which HDRI key backs each band. Partial objects are
  // merged over the defaults (NOT over a previous custom set, so every map
  // states its full intent). Pass a null/undefined value to force the
  // procedural sky for that band.
  //
  // NOTE: photographic skies are OFF by default — the procedural sky above is
  // the default path for every map. This only records the map's preference;
  // it takes effect when settings.environment.photoSky is true (or after
  // setSkyMode('hdri')). Kept so existing callers keep working unchanged.
  setHDRIBands(bands = {}) {
    const b = bands || {};
    this._hdriBands = {
      day:      b.day !== undefined ? b.day : DEFAULT_HDRI_BANDS.day,
      sunset:   b.sunset !== undefined ? b.sunset : DEFAULT_HDRI_BANDS.sunset,
      night:    b.night !== undefined ? b.night : DEFAULT_HDRI_BANDS.night,
      overcast: b.overcast !== undefined ? b.overcast : DEFAULT_HDRI_BANDS.overcast,
    };
    if (!this._ready) return;
    this._applyAtmosphere();
  }

  // ----------------------------------------------------------
  // 'procedural' | 'hdri' | null (null = follow settings.environment.photoSky,
  // which is absent by default and therefore procedural).
  setSkyMode(mode) {
    this._skyModeForced = (mode === 'procedural' || mode === 'hdri') ? mode : null;
    if (!this._ready) return;
    this._applyAtmosphere();
  }

  // ----------------------------------------------------------
  setRenderDistance(meters) {
    this._renderDistance = clamp(finite(meters, 1500), 200, 20000);
    if (!this._ready) return;
    this._applyFog();
  }

  // ----------------------------------------------------------
  setQuality(shadowMapRes) {
    let res = Math.floor(finite(shadowMapRes, 2048));
    res = clamp(res, 256, 8192);
    this._shadowRes = res;
    this._detail = res >= 2048 ? 1 : 0;   // low/medium drop the second noise octave
    if (!this._ready) return;
    this._domeU.uDetail.value = this._detail;
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
      // hide the outside world
      this.sky.visible = false;
      this.nightDome.visible = false;
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
      this._applyAtmosphere(); // restores lights, fog, exposure, stars, sky
      this._envDirty = true;
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
      // sky, night dome and celestial sphere ride with the camera
      this.sky.position.copy(camera.position);
      this.nightDome.position.copy(camera.position);
      this._celestial.position.copy(camera.position);

      // animation clock (wrapped to keep float precision in the shaders)
      this._skyTime = (this._skyTime + dt) % 3600;
      this._starU.uTime.value = this._skyTime;
      this._starU.uPixelRatio.value = this.renderer.getPixelRatio();

      // overcast deck drifts downwind; gusty air scuds faster
      if (this._domeU.uCloud.value > 0.001) {
        const drift = dt * (0.004 + 0.0016 * this._windSpeed) * (0.6 + 0.9 * this._gustiness);
        const o = this._cloudDrift;
        o.x = (o.x + this._windDir.x * drift) % 512;
        o.z = (o.z + this._windDir.z * drift) % 512;
        o.y = (o.y + drift * 0.35) % 512;
        this._domeU.uCloudOfs.value.copy(o);
      }

      if (this.sunLight.visible) this._snapShadow(camera);

      // stars ease in/out through dawn and dusk
      const k = Math.min(1, dt * 1.7);
      this._starOpacity += (this._starTarget - this._starOpacity) * k;
      this._starU.uOpacity.value = this._starOpacity;
      this._stars.visible = this._starOpacity > 0.003;

      // throttled procedural reflection probe rebuild
      if (this._envDirty && !this._hdriApplied) {
        const t = nowMs();
        if (t - this._envLastBuild >= ENV_MIN_MS) this._rebuildEnvMap();
      }
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
    const kill = (o) => {
      if (!o) return;
      try { o.geometry?.dispose(); } catch (e) { /* noop */ }
      try {
        const m = o.material;
        if (m) { m.map?.dispose?.(); m.uniforms?.uMap?.value?.dispose?.(); m.dispose(); }
      } catch (e) { /* noop */ }
    };
    kill(this.sky);          // the Preetham dome owns a BoxGeometry + ShaderMaterial too
    kill(this.nightDome);
    kill(this._stars);
    kill(this._moonDisc);
    kill(this._rainObj);
    try { this._pmrem?.dispose(); } catch (e) { /* noop */ }
  }

  // ==========================================================
  // internals
  // ==========================================================

  get _photoSky() {
    if (this._skyModeForced !== null) return this._skyModeForced === 'hdri';
    return !!(settings && settings.environment && settings.environment.photoSky);
  }

  _applyWindDir() {
    // windDirDeg = compass direction wind blows FROM (0=N=-Z, 90=E=+X).
    // Air velocity points the opposite way.
    const az = this._windDirDeg * DEG2RAD;
    this._windDir.set(-Math.sin(az), 0, Math.cos(az));
    this._windLat.set(this._windDir.z, 0, -this._windDir.x);
  }

  // Celestial arc shared by sun and moon: elevation follows a sine peaking at
  // SUN_PEAK_DEG at 13:00 and dipping to -NIGHT_DEPTH_DEG at solar midnight;
  // azimuth sweeps E -> S -> W by day and W -> N -> E by night. Continuous and
  // 24h-periodic. Writes [el, az] into `out2`.
  _arc(hours, out2) {
    const h = ((hours % 24) + 24) % 24;
    if (h >= SUNRISE && h <= SUNSET) {
      const f = (h - SUNRISE) / DAY_HOURS;
      out2[0] = SUN_PEAK_DEG * Math.sin(Math.PI * f);
      out2[1] = 90 + 180 * f;
    } else {
      const f = ((((h - SUNSET) % 24) + 24) % 24) / NIGHT_HOURS;
      out2[0] = -NIGHT_DEPTH_DEG * Math.sin(Math.PI * f);
      out2[1] = 270 + 180 * f;
    }
    return out2;
  }

  _dirFromElAz(elDeg, azDeg, out) {
    const el = elDeg * DEG2RAD, az = azDeg * DEG2RAD;
    const ce = Math.cos(el);
    return out.set(ce * Math.sin(az), Math.sin(el), -ce * Math.cos(az));
  }

  _computeSkyBodies(hours) {
    const a = this._arcTmp || (this._arcTmp = [0, 0]);
    this._arc(hours, a);
    this._sunElDeg = a[0];
    this._sunAzDeg = a[1];
    this._dirFromElAz(a[0], a[1], this._sunDir);

    // the moon walks the same arc half a day away, offset so its bright limb
    // has a well-defined direction (an exactly anti-solar moon is degenerate)
    this._arc(hours + 12 + MOON_OFFSET_HOURS, a);
    this._moonElDeg = a[0];
    this._moonAzDeg = a[1];
    this._dirFromElAz(a[0], a[1], this._moonDir);
  }

  // ---------------- HDRI band machinery (opt-in path) ----------------

  _evaluateBand() {
    if (this._rain >= 0.5) return 'overcast';
    const el = this._sunElDeg;
    if (el < -6) return 'night';
    if (el < 10) return 'sunset';
    return 'day';
  }

  _scheduleHDRISwap() {
    const key = (this._hdriBands && this._hdriBands[this._band]) || null;
    this._hdriDesiredKey = key;
    if (key === this._hdriKey) return;         // settled (incl. recorded misses)
    if (this._hdriTimer !== null) return;      // pending swap reads the latest desire
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
    if (key === this._hdriKey) return;
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

  // The HDRI texture itself is owned & cached by assetLib — never disposed
  // here. PMREM render targets are cached per key and released in dispose().
  _applyHDRI(key, tex) {
    this._hdriKey = key;
    this._hdriTex = tex || null;
    this._hdriApplied = !!tex;
    if (tex && this._pmrem && !this._hdriEnvRTs.has(key)) {
      try {
        this._hdriEnvRTs.set(key, this._pmrem.fromEquirectangular(tex));
      } catch (e) {
        console.warn('[Environment] HDRI PMREM failed for', key, e);
      }
    }
    this._applyAtmosphere();
  }

  _hdriBackgroundIntensity(band, el, rain) {
    if (band === 'day')    return 0.85 + 0.15 * smoothstep(10, 26, el);
    if (band === 'sunset') return 0.88 + 0.12 * smoothstep(-6, 2, el);
    if (band === 'night')  return 1.0;
    const dayl = smoothstep(-8, 5, el);        // overcast
    return (0.08 + 0.92 * dayl) * (1 - 0.2 * rain);
  }

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
    this._computeSkyBodies(h);
    const el = this._sunElDeg;
    const rain = this._rain;
    const wind = this._windSpeed;
    const scene = this.scene;
    const dayl = smoothstep(-8, 5, el);
    const dim = 1 - 0.45 * rain;

    // ---------- photographic sky (opt-in only) ----------
    let ibl = false;
    if (this._photoSky) {
      this._band = this._evaluateBand();
      this._scheduleHDRISwap();
      ibl = this._hdriApplied && !!this._hdriTex;
    } else if (this._hdriApplied) {
      this._hdriApplied = false;                 // dropped back to procedural
      this._hdriTex = null;
      this._hdriKey = null;
      this._hdriDesiredKey = null;
      this._envDirty = true;
    }
    const band = this._band;

    // ==========================================================
    // 1. the lit sky (Preetham), driven continuously by elevation
    // ==========================================================
    const u = this.sky.material.uniforms;
    u.sunPosition.value.copy(this._sunDir);
    // Weather: rain thickens and de-blues the air; a stiff dry breeze scours
    // some of the haze out of it.
    const windClear = 1 - 0.07 * clamp(wind / 15, 0, 1) * (1 - rain);
    u.turbidity.value = (ramp(SKY_TURBIDITY, el) + rain * 9.0) * windClear;
    u.rayleigh.value = ramp(SKY_RAYLEIGH, el) * (1 - 0.55 * rain);
    u.mieCoefficient.value = ramp(SKY_MIE_COEFF, el) + rain * 0.020;
    u.mieDirectionalG.value = ramp(SKY_MIE_G, el) - rain * 0.06;
    const skyGain = ramp(SKY_GAIN, el) * (1 - 0.18 * rain);
    if (this._skyGraded) {
      u.pwGain.value = skyGain;
      u.pwSat.value = ramp(SKY_SAT, el) * (1 - 0.48 * rain);
    }

    // ==========================================================
    // 2. the night / weather dome
    // ==========================================================
    const du = this._domeU;
    const nightA = smoothstep(2.5, -6.5, el);
    const cloudA = smoothstep(0.02, 1.0, rain) * 0.88;

    du.uSunDir.value.copy(this._sunDir);
    du.uMoonDir.value.copy(this._moonDir);
    du.uNight.value = nightA;
    du.uCloud.value = cloudA;
    du.uDetail.value = this._detail;

    // NIGHT_LIFT keeps the night sky a readable deep blue rather than black:
    // the ramps are authored as sRGB hexes, which land very low in linear
    // space once ACES and the night exposure are applied.
    rampColor(NIGHT_ZENITH, el, du.uZenith.value).multiplyScalar(NIGHT_LIFT);
    rampColor(NIGHT_HORIZON, el, du.uHorizon.value).multiplyScalar(NIGHT_LIFT);
    du.uGlowCol.value.copy(GLOW_COLOR);
    du.uGlow.value = ramp(GLOW_STRENGTH, el) * (1 + 0.35 * rain);   // cloud bounces city light back down
    rampColor(TWI_COLOR, el, du.uTwiCol.value);
    du.uTwi.value = ramp(TWI_STRENGTH, el) * (1 - 0.35 * rain);
    rampColor(TWI_HI_COLOR, el, du.uTwiHiCol.value);
    du.uTwiHi.value = ramp(TWI_HI_STRENGTH, el) * (1 - 0.5 * rain);
    du.uBeltCol.value.copy(BELT_COLOR);
    du.uBelt.value = ramp(BELT_STRENGTH, el) * (1 - 0.85 * rain);
    du.uMwCol.value.copy(MW_COLOR);
    du.uMw.value = ramp(MW_STRENGTH, el) * (1 - rain);

    // moon halo: only once the moon is actually up, scaled by its phase
    const moonUp = clamp((this._moonElDeg + 1.5) / 5, 0, 1);
    const moonSkyVis = smoothstep(2.5, -6.0, el);
    const moonVis = moonUp * moonSkyVis * (1 - 0.9 * cloudA);
    du.uMoonGlowCol.value.copy(MOON_GLOW_COLOR);
    du.uMoonGlow.value = 0.30 * moonVis * this._moonIllum;

    rampColor(CLOUD_TOP, el, du.uCloudTop.value);
    rampColor(CLOUD_BOT, el, du.uCloudBot.value);
    rampColor(CLOUD_SUN_COLOR, el, du.uCloudSunCol.value);
    du.uCloudSun.value = ramp(CLOUD_SUN_STRENGTH, el);
    this.nightDome.visible = (nightA + cloudA) > 0.002;

    // ==========================================================
    // 3. background & environment map
    // ==========================================================
    if (ibl) {
      this.sky.visible = false;
      this.nightDome.visible = false;
      scene.background = this._hdriTex;
      const rt = this._hdriEnvRTs.get(this._hdriKey);
      scene.environment = rt ? rt.texture : (this._envRT ? this._envRT.texture : null);
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
      // once the night dome is fully opaque the Preetham pass is invisible —
      // skip a full-screen shader for the whole of deep night
      this.sky.visible = nightA < 0.995;
      scene.background = null;                      // the domes draw the backdrop
      scene.environment = this._envRT ? this._envRT.texture : null;
      try {
        if ('backgroundRotation' in scene) scene.backgroundRotation.set(0, 0, 0);
        if ('environmentRotation' in scene) scene.environmentRotation.set(0, 0, 0);
        if ('backgroundIntensity' in scene) scene.backgroundIntensity = 1;
        // the sky grade above scales the probe's energy down with it, so the
        // IBL strength climbs to compensate and keep ambient bounce constant
        if ('environmentIntensity' in scene) {
          scene.environmentIntensity = ramp(ENV_INTENSITY, el) * (1 - 0.25 * rain);
        }
      } catch (e) { /* noop */ }

      // reflections follow the sky: mark dirty once the sun has moved enough
      if (this._envBuiltHours === null) {
        this._envDirty = true;
      } else {
        const d = Math.abs(h - this._envBuiltHours);
        if (Math.min(d, 24 - d) > ENV_HOUR_EPS) this._envDirty = true;
        if (Math.abs(rain - this._envBuiltRain) > ENV_RAIN_EPS) this._envDirty = true;
      }
    }

    // ==========================================================
    // 4. lights
    // ==========================================================
    let sunI;
    if (ibl) {
      const tune = HDRI_SUN[band] || HDRI_SUN.day;
      sunI = tune.intensity * dim;
      if (band === 'overcast') sunI *= dayl;
      this.sunLight.color.setHex(tune.color);
    } else {
      // rain both dims the sun and drains the colour out of it
      sunI = ramp(SUN_INTENSITY, el) * (1 - 0.78 * rain);
      rampColor(SUN_COLOR, el, this.sunLight.color);
      this.sunLight.color.lerp(SUN_RAIN_COLOR, rain * 0.7);
    }
    this.sunLight.intensity = sunI;
    this.sunLight.visible = sunI > 0.01;
    this.sunLight.position.copy(this._sunDir).multiplyScalar(SHADOW_DIST);
    this.sunLight.target.position.set(0, 0, 0);

    // moonlight: real direction, phase-scaled, blocked by cloud
    const moonPeak = (ibl && band === 'night') ? 0.28 : MOON_LIGHT_PEAK;
    const moonI = moonPeak * this._moonIllum * moonUp * moonSkyVis * (1 - 0.55 * cloudA);
    this.moonLight.intensity = moonI;
    this.moonLight.visible = moonI > 0.01;
    this.moonLight.position.copy(this._moonDir).multiplyScalar(300);

    // hemisphere ambient (overcast daylight is flat and bright, not dark)
    let hemiI = ramp(HEMI_INTENSITY, el) * (1 - 0.12 * rain) + 0.30 * cloudA * dayl;
    rampColor(HEMI_SKY_COLOR, el, this.hemi.color);
    rampColor(HEMI_GROUND_COLOR, el, this.hemi.groundColor);
    if (cloudA > 0) this.hemi.color.lerp(RAIN_FOG_GRAY, cloudA * 0.45 * dayl);
    if (ibl) {
      hemiI *= 0.5;
      if (band === 'overcast') hemiI = Math.max(hemiI, 0.62 * dayl * (1 - 0.15 * rain));
    }
    this.hemi.intensity = hemiI;

    // ==========================================================
    // 5. moon disc
    // ==========================================================
    this._updateMoonDisc(moonVis);

    // ==========================================================
    // 6. fog / exposure / stars
    // ==========================================================
    if (ibl) {
      this._fogBase.copy(HDRI_FOG[band] || HDRI_FOG.day);
      if (band === 'overcast') this._fogBase.multiplyScalar(0.15 + 0.85 * dayl);
    } else {
      rampColor(FOG_COLOR, el, this._fogBase);
      if (cloudA > 0) {
        // under cloud the horizon washes toward the deck's own colour
        rampColor(CLOUD_BOT, el, this._tmpCol);
        this._fogBase.lerp(this._tmpCol, cloudA * 0.55);
      }
    }
    this._applyFog();

    if (ibl) {
      const ex = (band === 'overcast') ? (0.5 + 0.2 * dayl) : ramp(HDRI_EXPOSURE, el);
      this.renderer.toneMappingExposure = ex * (1 - 0.08 * rain);
    } else {
      this.renderer.toneMappingExposure = ramp(EXPOSURE, el) * (1 - 0.22 * rain);
    }

    // stars: fade in through twilight, killed by cloud
    this._starTarget = ibl ? 0 : smoothstep(-3.0, -11.0, el) * (1 - 0.95 * cloudA);
  }

  _updateMoonDisc(moonVis) {
    const disc = this._moonDisc;
    const mu = this._moonU;
    disc.position.copy(this._moonDir);
    this._tmpA.copy(this._moonDir).negate();
    disc.quaternion.setFromUnitVectors(Z_AXIS, this._tmpA);

    // bright-limb direction = the sun, projected into the disc's own plane
    const rx = this._tmpB.copy(X_AXIS).applyQuaternion(disc.quaternion);
    const ry = this._tmpC.copy(Y_AXIS).applyQuaternion(disc.quaternion);
    let lx = this._sunDir.dot(rx);
    let ly = this._sunDir.dot(ry);
    const len = Math.hypot(lx, ly);
    if (len > 1e-4) { lx /= len; ly /= len; } else { lx = 1; ly = 0; }
    mu.uLit.value.set(lx, ly);
    mu.uK.value = 1 - 2 * this._moonIllum;
    mu.uGlow.value = 0.55 * this._moonIllum;
    mu.uOpacity.value = moonVis;
    disc.visible = moonVis > 0.01;
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
    this._fog.near = Math.max(8, d * 0.30 * (1 - 0.55 * rain));
    this._fog.far = Math.max(this._fog.near + 20, d * 1.05 * (1 - 0.40 * rain));
    this._fog.color.copy(this._fogBase).lerp(RAIN_FOG_GRAY, rain * 0.45);
  }

  // Render the procedural sky (lit dome + night/weather dome) into a PMREM
  // probe so reflections and IBL ambient track the real sky. Expensive, hence
  // throttled by update(); both domes are temporarily reparented to a private
  // scene at the origin so the probe is camera-independent.
  _rebuildEnvMap() {
    const sky = this.sky;
    const dome = this.nightDome;
    const skyPos = this._tmpA.copy(sky.position);
    const domePos = this._tmpB.copy(dome.position);
    const skyVis = sky.visible;
    const domeVis = dome.visible;
    try {
      sky.visible = true;
      sky.position.set(0, 0, 0);
      dome.position.set(0, 0, 0);
      this._envScene.add(sky);
      this._envScene.add(dome);
      const rt = this._pmrem.fromScene(this._envScene);
      if (this._envRT) this._envRT.dispose();
      this._envRT = rt;
      if (!this._indoor && !this._hdriApplied) this.scene.environment = rt.texture;
    } catch (e) {
      console.warn('[Environment] env map rebuild failed', e);
    } finally {
      this.scene.add(sky);
      this.scene.add(dome);
      sky.position.copy(skyPos);
      dome.position.copy(domePos);
      sky.visible = skyVis;
      dome.visible = domeVis;
      this._envDirty = false;
      this._envLastBuild = nowMs();
      this._envBuiltHours = this._hours;
      this._envBuiltRain = this._rain;
    }
  }

  // Keep the sun's ortho shadow box centered on the camera, snapped to the
  // shadow-map texel grid in light space so edges don't shimmer as we fly.
  _snapShadow(camera) {
    const dir = this._sunDir;                  // unit, toward the sun
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

  // Append a gain + saturation grade to the addons Sky fragment shader. The
  // Preetham pass ends on pow(texColor, 1/2.4) — a gamma encode that lifts and
  // desaturates the result, so straight out of the box the sky reads as white
  // haze at any useful exposure. This edits the material's own shader source
  // once, before it is ever compiled, and adds two uniforms driven by the
  // SKY_GAIN / SKY_SAT ramps. If a future three.js changes that line the patch
  // is skipped and the sky simply renders un-graded — never broken.
  _patchSkyShader() {
    const mat = this.sky.material;
    const MARK = 'gl_FragColor = vec4( retColor, 1.0 );';
    this._skyGraded = false;
    try {
      if (typeof mat.fragmentShader !== 'string' || mat.fragmentShader.indexOf(MARK) < 0) {
        console.warn('[Environment] Sky shader grade hook not found — sky renders un-graded');
        return;
      }
      mat.fragmentShader = 'uniform float pwGain;\nuniform float pwSat;\n' +
        mat.fragmentShader.replace(MARK, [
          'vec3 pwCol = retColor * pwGain;',
          'float pwLum = dot( pwCol, vec3( 0.2126, 0.7152, 0.0722 ) );',
          'pwCol = max( mix( vec3( pwLum ), pwCol, pwSat ), vec3( 0.0 ) );',
          'gl_FragColor = vec4( pwCol, 1.0 );',
        ].join('\n'));
      mat.uniforms.pwGain = { value: 1 };
      mat.uniforms.pwSat = { value: 1 };
      mat.needsUpdate = true;
      this._skyGraded = true;
    } catch (e) {
      console.warn('[Environment] Sky shader grade failed', e);
    }
  }

  _buildNightDome() {
    this._domeU = {
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uMoonDir: { value: new THREE.Vector3(0, -1, 0) },
      uZenith: { value: new THREE.Color(0x0d1533) },
      uHorizon: { value: new THREE.Color(0x141d38) },
      uGlowCol: { value: GLOW_COLOR.clone() },
      uGlow: { value: 0 },
      uTwiCol: { value: new THREE.Color(0xcc5a2e) },
      uTwi: { value: 0 },
      uTwiHiCol: { value: new THREE.Color(0x4a2f64) },
      uTwiHi: { value: 0 },
      uBeltCol: { value: BELT_COLOR.clone() },
      uBelt: { value: 0 },
      uMwCol: { value: MW_COLOR.clone() },
      // galactic pole: any fixed unit vector — tilted so the band crosses the
      // sky diagonally instead of ringing the horizon
      uMwAxis: { value: new THREE.Vector3(0.62, 0.55, -0.56).normalize() },
      uMw: { value: 0 },
      uMoonGlowCol: { value: MOON_GLOW_COLOR.clone() },
      uMoonGlow: { value: 0 },
      uNight: { value: 0 },
      uCloudTop: { value: new THREE.Color(0x8f98a7) },
      uCloudBot: { value: new THREE.Color(0xaaaeb5) },
      uCloudSunCol: { value: new THREE.Color(0xd0c2ab) },
      uCloudSun: { value: 0 },
      uCloud: { value: 0 },
      uCloudOfs: { value: new THREE.Vector3() },
      uDetail: { value: 1 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this._domeU,
      vertexShader: DOME_VERT,
      fragmentShader: DOME_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: true,
      transparent: true,
      premultipliedAlpha: true,
      fog: false,
    });
    this.nightDome = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
    this.nightDome.scale.setScalar(DOME_SCALE);
    this.nightDome.frustumCulled = false;
    this.nightDome.renderOrder = -1000;   // first of the transparents, behind everything
    this.nightDome.visible = false;
  }

  _buildStars() {
    const n = STAR_COUNT;
    const rnd = mulberry32(0x5EED);
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const tw = new Float32Array(n);
    const ph = new Float32Array(n);

    // galactic plane basis (matches uMwAxis in the dome shader)
    const axis = new THREE.Vector3(0.62, 0.55, -0.56).normalize();
    const e1 = new THREE.Vector3(1, 0, 0).cross(axis).normalize();
    const e2 = new THREE.Vector3().crossVectors(axis, e1).normalize();
    const v = new THREE.Vector3();

    for (let i = 0; i < n; i++) {
      const inBand = rnd() < STAR_BAND_FRACTION;
      if (inBand) {
        // cluster near the great circle perpendicular to `axis`
        const a = rnd() * Math.PI * 2;
        let w = (rnd() + rnd() + rnd() - 1.5) * 0.20;     // ~gaussian, +-12 deg
        v.copy(e1).multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a));
        v.addScaledVector(axis, w).normalize();
        if (v.y < -0.06) v.y = -v.y * 0.5;                // keep them above the horizon
        v.normalize();
      } else {
        const y = -0.06 + 1.06 * rnd();
        const a = rnd() * Math.PI * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        v.set(r * Math.cos(a), y, r * Math.sin(a));
      }
      pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;

      // magnitude: a steep power law, so a handful are bright and most are faint
      const m = Math.pow(rnd(), 2.7);
      const bright = 0.16 + 0.94 * m;
      size[i] = 1.05 + 3.6 * Math.pow(m, 1.35) * (inBand ? 0.75 : 1);

      // spectral colour spread (B-V-ish)
      const pick = rnd();
      let cr, cg, cb;
      if (pick < 0.16)      { cr = 0.68, cg = 0.78, cb = 1.00; }   // blue-white
      else if (pick < 0.62) { cr = 0.95, cg = 0.97, cb = 1.00; }   // white
      else if (pick < 0.86) { cr = 1.00, cg = 0.94, cb = 0.82; }   // yellow
      else                  { cr = 1.00, cg = 0.80, cb = 0.63; }   // orange-red
      col[i * 3] = cr * bright;
      col[i * 3 + 1] = cg * bright;
      col[i * 3 + 2] = cb * bright;

      tw[i] = 1.1 + 3.4 * rnd();
      ph[i] = rnd() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aTw', new THREE.BufferAttribute(tw, 1));
    geo.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));

    this._starU = {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uPixelRatio: { value: 1 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this._starU,
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    this._stars = new THREE.Points(geo, mat);
    this._stars.frustumCulled = false;
    this._stars.visible = false;
    this._stars.renderOrder = 2;
  }

  // Albedo only — the phase, terminator and limb darkening live in the shader.
  _buildMoonDisc() {
    let tex = null;
    try {
      const S = 256;
      const c = document.createElement('canvas');
      c.width = c.height = S;
      const g = c.getContext('2d');
      if (g) {
        const rnd = mulberry32(0x4D00);
        g.fillStyle = '#cfccc3';
        g.fillRect(0, 0, S, S);
        // maria: a handful of soft dark basins
        for (let i = 0; i < 16; i++) {
          const x = rnd() * S, y = rnd() * S;
          const r = S * (0.045 + 0.10 * rnd());
          const shade = 150 + Math.floor(30 * rnd());
          const grd = g.createRadialGradient(x, y, 0, x, y, r);
          grd.addColorStop(0, `rgba(${shade},${shade + 2},${shade - 4},0.55)`);
          grd.addColorStop(1, `rgba(${shade},${shade + 2},${shade - 4},0)`);
          g.fillStyle = grd;
          g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        }
        // craters: small bright rings with darker centres
        for (let i = 0; i < 90; i++) {
          const x = rnd() * S, y = rnd() * S;
          const r = S * (0.006 + 0.022 * rnd() * rnd());
          g.fillStyle = `rgba(240,238,230,${0.10 + 0.16 * rnd()})`;
          g.beginPath(); g.arc(x, y, r * 1.6, 0, Math.PI * 2); g.fill();
          g.fillStyle = `rgba(120,118,112,${0.10 + 0.18 * rnd()})`;
          g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        }
        tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
      }
    } catch (e) { tex = null; }

    this._moonU = {
      uMap: { value: tex },
      uLit: { value: new THREE.Vector2(1, 0) },
      uK: { value: 1 - 2 * MOON_ILLUM },
      uSpan: { value: MOON_SPAN },
      uOpacity: { value: 0 },
      uTint: { value: new THREE.Color(0xfdfbf2) },
      uGlow: { value: 0.5 },
      uEarth: { value: 0.045 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this._moonU,
      vertexShader: MOON_VERT,
      fragmentShader: MOON_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    // unit celestial radius: the plane spans MOON_SPAN moon radii
    const halfWorld = Math.tan(MOON_RADIUS_RAD * MOON_SPAN);
    this._moonDisc = new THREE.Mesh(new THREE.PlaneGeometry(halfWorld * 2, halfWorld * 2), mat);
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
