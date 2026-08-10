// ============================================================
// PropWash FPV — main game loop & integration
// ============================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { settings, saveSettings, emit, on, clamp } from './core/state.js';
import { DRONES } from './physics/drones.js';
import { Quad } from './physics/quad.js';
import { buildDroneMesh } from './physics/droneMesh.js';
import { RadioManager } from './input/radio.js';
import { KeyboardInput } from './input/keyboard.js';
import { Menu } from './ui/menu.js';
import { CalibrationUI } from './ui/calibration.js';
import { OSD } from './ui/osd.js';
import { StaticFX } from './fx/staticfx.js';
import { Environment } from './world/environment.js';
import { buildMiami } from './world/miami.js';
import { buildProcedural } from './world/procedural.js';
import { ModeManager } from './modes/modes.js';
import { MotorAudio } from './audio/engine.js';

const loadStatus = (txt, frac) => {
  const s = document.getElementById('load-status');
  const f = document.getElementById('load-fill');
  if (s) s.textContent = txt;
  if (f && frac != null) f.style.width = `${Math.round(frac * 100)}%`;
};

// ---------------- renderer ----------------
loadStatus('Creating renderer…', 0.08);
const appEl = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
appEl.appendChild(renderer.domElement);

// GPU sniff for initial auto-quality (runs once)
function autoDetectQuality() {
  if (settings.graphics.autoDetected) return;
  settings.graphics.autoDetected = true;
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    const weak = /intel|uhd|iris|hd graphics|swiftshader|llvmpipe|mali|adreno/i.test(gpu);
    settings.graphics.quality = weak ? 'medium' : 'high';
    if (weak) settings.graphics.renderDistance = Math.min(settings.graphics.renderDistance, 900);
    console.info('[PropWash] GPU:', gpu || 'unknown', '→ quality', settings.graphics.quality);
  } catch (e) { /* keep defaults */ }
  saveSettings();
}
autoDetectQuality();

const scene = new THREE.Scene();
const fpvCam = new THREE.PerspectiveCamera(settings.camera.fovDeg, innerWidth / innerHeight, 0.02, settings.graphics.renderDistance);
const losCam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.05, settings.graphics.renderDistance);
let activeCam = fpvCam;

// ---------------- post-processing ----------------
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, fpvCam);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.28, 0.6, 0.88);
const outputPass = new OutputPass();
composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(outputPass);

const QUALITY = {
  low:    { scale: 0.65, shadows: false, shadowRes: 1024, bloom: false },
  medium: { scale: 0.85, shadows: true,  shadowRes: 1024, bloom: true  },
  high:   { scale: 1.0,  shadows: true,  shadowRes: 2048, bloom: true  },
  ultra:  { scale: 1.0,  shadows: true,  shadowRes: 4096, bloom: true  },
};

function applyGraphics() {
  const q = QUALITY[settings.graphics.quality] || QUALITY.high;
  const scale = q.scale * (settings.graphics.renderScale || 1);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2) * scale);
  renderer.shadowMap.enabled = q.shadows && settings.graphics.shadows;
  bloomPass.enabled = q.bloom && settings.graphics.bloom;
  const rd = settings.graphics.renderDistance;
  fpvCam.far = rd; losCam.far = rd;
  fpvCam.updateProjectionMatrix(); losCam.updateProjectionMatrix();
  env?.setRenderDistance(rd);
  env?.setQuality(q.shadowRes);
}

// ---------------- world / environment ----------------
loadStatus('Building atmosphere…', 0.2);
const env = new Environment(scene, renderer);
await env.init();

// ---------------- subsystems ----------------
loadStatus('Loading subsystems…', 0.35);
const radio = new RadioManager();
const keyboard = new KeyboardInput();
const osd = new OSD(document.getElementById('osd-root'));
const staticFX = new StaticFX(document.getElementById('fx-root'));
const menu = new Menu();
const calibUI = new CalibrationUI(radio);
const modeManager = new ModeManager(scene);
const motorAudio = new MotorAudio();

// ---------------- drone ----------------
let quad = null;
let droneMesh = null;

function buildQuad() {
  const spec = DRONES[settings.drone] || DRONES.meteor75;
  if (droneMesh) { scene.remove(droneMesh.group); droneMesh.dispose?.(); }
  quad = new Quad(spec);
  quad.setRates(settings.rates);
  quad.setFlightMode(settings.flightMode);
  droneMesh = buildDroneMesh(spec);
  scene.add(droneMesh.group);
  motorAudio.setDrone(spec);
  respawn();
}

// ---------------- map lifecycle ----------------
let mapHandle = null;
let pilotPos = new THREE.Vector3(0, 1.7, 0);

async function loadMap() {
  const el = document.getElementById('loading');
  el?.classList.remove('hidden');
  loadStatus('Building world…', 0.55);
  await new Promise(r => setTimeout(r, 30)); // let the loading screen paint

  try {
    modeManager.dispose();
    if (mapHandle) { mapHandle.dispose(scene); mapHandle = null; }
    if (settings.map === 'miami') {
      mapHandle = await buildMiami(scene, env);
    } else {
      mapHandle = await buildProcedural(scene, env, settings.procedural);
    }
    env.setIndoor?.(settings.map === 'procedural' && settings.procedural.setting === 'indoor');
    pilotPos.copy(mapHandle.spawn.position).add(new THREE.Vector3(0, 1.7, 0));
    modeManager.start(settings.gameMode, mapHandle);
    respawn();
    loadStatus('Ready', 1);
  } catch (err) {
    console.error('Map build failed:', err);
    emit('osd:flash', { text: 'MAP BUILD FAILED — SEE CONSOLE', ms: 4000 });
  }
  setTimeout(() => el?.classList.add('hidden'), 350);
}

function respawn() {
  if (!quad || !mapHandle) return;
  quad.reset(mapHandle.spawn.position.clone(), mapHandle.spawn.yawRad || 0);
  armed = false;
  flightTimer = 0;
}

// ---------------- flight state ----------------
let armed = false;
let flightTimer = 0;
let paused = false;
let lastArmSwitch = null;

function tryArm(want) {
  if (want === armed) return;
  if (want) {
    if (quad.crashed) { emit('osd:flash', { text: 'RESET FIRST (R)', ms: 1200 }); return; }
    const t = currentControls.throttle;
    if (t > 0.08) {
      emit('osd:flash', {
        text: `THROTTLE TOO HIGH TO ARM (${Math.round(t * 100)}%) — LOWER STICK, OR FIX DIRECTION IN ESC → CONTROLLER → FINE-TUNE`,
        ms: 3000,
      });
      return;
    }
    armed = true;
    flightTimer = 0;
    motorAudio.start();
    emit('osd:flash', { text: 'ARMED', ms: 800 });
  } else {
    armed = false;
    emit('osd:flash', { text: 'DISARMED', ms: 800 });
  }
}

// ---------------- controls ----------------
const currentControls = { throttle: 0, roll: 0, pitch: 0, yaw: 0 };

function pollControls(dt) {
  radio.update(performance.now());
  const kb = keyboard.getFlightControls(dt);
  if (radio.connected && settings.controller.calibration) {
    const c = radio.controls;
    currentControls.throttle = c.throttle;
    currentControls.roll = c.roll;
    currentControls.pitch = c.pitch;
    currentControls.yaw = c.yaw;
    if (c.armSwitch !== null && c.armSwitch !== lastArmSwitch) {
      const first = lastArmSwitch === null;   // switch already high at load: record, don't arm
      lastArmSwitch = c.armSwitch;
      if (!first && !paused) tryArm(c.armSwitch);
    }
  } else if (kb.active) {
    currentControls.throttle = kb.throttle;
    currentControls.roll = kb.roll;
    currentControls.pitch = kb.pitch;
    currentControls.yaw = kb.yaw;
  } else {
    currentControls.roll = currentControls.pitch = currentControls.yaw = 0;
  }
}

// ---------------- physics ----------------
const PHYS_DT = 1 / 400;
let accum = 0;
const windVec = new THREE.Vector3();

function stepPhysics(dt) {
  accum += Math.min(dt, 0.05);
  while (accum >= PHYS_DT) {
    env.getWind(quad.position, windVec);
    quad.setInputs(currentControls);
    quad.step(PHYS_DT, {
      getGroundHeight: mapHandle ? mapHandle.getGroundHeight : () => 0,
      colliders: mapHandle ? mapHandle.colliders : null,
      wind: windVec,
      armed,
    });
    accum -= PHYS_DT;
  }
  if (quad.crashed && armed) {
    armed = false;
    emit('osd:flash', { text: 'CRASHED — PRESS R TO RESET', ms: 2500 });
  }
}

// ---------------- cameras ----------------
const tiltQuat = new THREE.Quaternion();
const shakeQuat = new THREE.Quaternion();
const shakeEuler = new THREE.Euler();
const camOffset = new THREE.Vector3();

function updateCameras(t) {
  // FPV camera: locked to drone body with uptilt + micro-shake from motors
  tiltQuat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(settings.camera.tiltDeg));
  const m = quad.motorOutput * (armed ? 1 : 0);
  shakeEuler.set(
    Math.sin(t * 131) * 0.0016 * m,
    Math.sin(t * 97) * 0.0013 * m,
    Math.sin(t * 149) * 0.0019 * m
  );
  shakeQuat.setFromEuler(shakeEuler);
  fpvCam.quaternion.copy(quad.quaternion).multiply(tiltQuat).multiply(shakeQuat);
  camOffset.set(0, 0.02, -0.04).applyQuaternion(quad.quaternion);
  fpvCam.position.copy(quad.position).add(camOffset);
  if (fpvCam.fov !== settings.camera.fovDeg) {
    fpvCam.fov = settings.camera.fovDeg;
    fpvCam.updateProjectionMatrix();
  }

  // LOS camera: standing pilot, tracks the drone with mild auto-zoom
  losCam.position.copy(pilotPos);
  losCam.lookAt(quad.position);
  const dist = losCam.position.distanceTo(quad.position);
  const targetFov = clamp(60 - dist * 0.12, 20, 60);
  if (Math.abs(losCam.fov - targetFov) > 0.2) {
    losCam.fov = targetFov;
    losCam.updateProjectionMatrix();
  }

  const los = settings.camera.losMode;
  activeCam = los ? losCam : fpvCam;
  renderPass.camera = activeCam;
  if (droneMesh) droneMesh.group.visible = los;
  osd.setVisible(!los && !menu.isOpen);
}

// ---------------- signal loss (analog video realism) ----------------
let sigLoss = 0;
let sigTimer = 0;
const rayDir = new THREE.Vector3();

function aabbBlocksRay(box, o, d, maxT) {
  let tmin = 0, tmax = maxT;
  for (const ax of ['x', 'y', 'z']) {
    const inv = 1 / (d[ax] || 1e-9);
    let t1 = (box.min[ax] - o[ax]) * inv;
    let t2 = (box.max[ax] - o[ax]) * inv;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

function updateSignal(dt) {
  sigTimer -= dt;
  if (sigTimer > 0) return;
  sigTimer = 0.25;
  const distToPilot = quad.position.distanceTo(pilotPos);
  let loss = clamp((distToPilot - 250) / 650, 0, 1);
  // occlusion: terrain samples + collider boxes between pilot and drone
  rayDir.copy(quad.position).sub(pilotPos);
  const len = rayDir.length();
  if (len > 5 && mapHandle) {
    rayDir.normalize();
    for (let i = 1; i <= 8; i++) {
      const f = i / 9;
      const px = pilotPos.x + rayDir.x * len * f;
      const py = pilotPos.y + rayDir.y * len * f;
      const pz = pilotPos.z + rayDir.z * len * f;
      if (mapHandle.getGroundHeight(px, pz) > py + 1) { loss = Math.min(1, loss + 0.45); break; }
    }
    const cols = mapHandle.colliders;
    if (cols) {
      const n = Math.min(cols.length, 250);
      for (let i = 0; i < n; i++) {
        if (aabbBlocksRay(cols[i], pilotPos, rayDir, len)) { loss = Math.min(1, loss + 0.35); break; }
      }
    }
  }
  sigLoss += (loss - sigLoss) * 0.5;
}

// ---------------- event wiring ----------------
on('hotkey:menu', () => {
  if (calibUI.isOpen) { calibUI.close(); return; }
  menu.isOpen ? menu.close() : menu.open();
});
on('menu:open', () => { paused = true; });
on('menu:close', () => { paused = false; });
on('hotkey:reset', () => { if (!menu.isOpen && !calibUI.isOpen) { quad.crashed = false; respawn(); emit('osd:flash', { text: 'RESET', ms: 600 }); } });
on('hotkey:arm', () => { if (!menu.isOpen && !calibUI.isOpen) tryArm(!armed); });
on('hotkey:view', () => {
  settings.camera.losMode = !settings.camera.losMode;
  saveSettings();
  emit('osd:flash', { text: settings.camera.losMode ? 'LINE OF SIGHT' : 'FPV', ms: 700 });
});
on('hotkey:static', () => {
  settings.camera.staticEnabled = !settings.camera.staticEnabled;
  saveSettings();
  emit('osd:flash', { text: `STATIC ${settings.camera.staticEnabled ? 'ON' : 'OFF'} (${settings.camera.staticMode.toUpperCase()})`, ms: 900 });
});
on('hotkey:camTilt', ({ delta }) => {
  if (menu.isOpen || calibUI.isOpen) return;
  settings.camera.tiltDeg = clamp(settings.camera.tiltDeg + delta, 0, 60);
  saveSettings();
  emit('osd:flash', { text: `CAM TILT ${settings.camera.tiltDeg}°`, ms: 600 });
});
on('hotkey:fov', ({ delta }) => {
  if (menu.isOpen || calibUI.isOpen) return;
  settings.camera.fovDeg = clamp(settings.camera.fovDeg + delta, 60, 150);
  saveSettings();
  emit('osd:flash', { text: `FOV ${settings.camera.fovDeg}°`, ms: 600 });
});
on('drone:changed', () => buildQuad());
on('map:reload', () => loadMap());
on('mode:changed', () => { if (mapHandle) { modeManager.start(settings.gameMode, mapHandle); respawn(); } });
on('mode:restart', () => { if (mapHandle) { modeManager.start(settings.gameMode, mapHandle); respawn(); } });
on('sim:reset', () => respawn());
on('calibrate:start', () => { menu.close(); calibUI.startWizard(); });
on('calibrate:finetune', () => { menu.close(); calibUI.openFineTune(); });
on('quad:carry', ({ massKg }) => { if (quad) quad.carryMassKg = massKg; });
on('settings:changed', () => {
  applyGraphics();
  env.setTimeOfDay(settings.environment.timeOfDay);
  env.setWeather(settings.environment);
  quad?.setRates(settings.rates);
  quad?.setFlightMode(settings.flightMode);
  motorAudio.setVolume(settings.audio.master);
});

// ---------------- resize ----------------
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  fpvCam.aspect = innerHeight ? innerWidth / innerHeight : 1;
  losCam.aspect = fpvCam.aspect;
  fpvCam.updateProjectionMatrix();
  losCam.updateProjectionMatrix();
  staticFX.resize();
});

// ---------------- boot ----------------
loadStatus('Spooling up…', 0.45);
buildQuad();
applyGraphics();
env.setTimeOfDay(settings.environment.timeOfDay);
env.setWeather(settings.environment);
await loadMap();

// FPS watchdog: one gentle suggestion if the machine is struggling
let fpsSamples = 0, fpsTime = 0, fpsWarned = false;

// ---------------- main loop ----------------
const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;

  pollControls(dt);

  if (!paused && quad && mapHandle) {
    stepPhysics(dt);
    if (armed && !quad.crashed) flightTimer += dt;
    modeManager.update(dt, quad);
    updateSignal(dt);
  }

  if (quad && droneMesh) {
    droneMesh.group.position.copy(quad.position);
    droneMesh.group.quaternion.copy(quad.quaternion);
    droneMesh.update(dt, quad.motorOutput, armed);
    updateCameras(t);
  }

  env.update(dt, activeCam);
  mapHandle?.update?.(dt, activeCam.position);

  // static overlay: manual toggle and/or signal-driven breakup (FPV only)
  let inten = settings.camera.staticEnabled ? settings.camera.staticIntensity : 0;
  if (settings.camera.signalLoss) inten = Math.max(inten, sigLoss);
  const staticOn = !settings.camera.losMode && inten > 0.02 && !menu.isOpen;
  staticFX.setMode(settings.camera.staticMode);
  staticFX.setIntensity(inten);
  staticFX.setEnabled(staticOn);
  if (staticOn) staticFX.update(dt);

  // OSD telemetry
  const speed = quad ? quad.velocity.length() : 0;
  const altitude = quad && mapHandle ? quad.position.y - mapHandle.getGroundHeight(quad.position.x, quad.position.z) : 0;
  const toHome = quad ? Math.atan2(pilotPos.x - quad.position.x, pilotPos.z - quad.position.z) : 0;
  const droneYaw = quad ? new THREE.Euler().setFromQuaternion(quad.quaternion, 'YXZ').y : 0;
  osd.update(dt, {
    volts: quad ? quad.batteryVolts : 0,
    cells: quad ? quad.spec.cells : 1,
    speedMs: speed,
    altM: altitude,
    armed,
    throttle: currentControls.throttle,
    mode: settings.gameMode,
    flightMode: settings.flightMode,
    droneName: quad ? quad.spec.displayName : '',
    timerS: flightTimer,
    homeDirRad: toHome - droneYaw,
    distHomeM: quad ? quad.position.distanceTo(pilotPos) : 0,
    rssi: 1 - sigLoss,
    crashed: quad ? quad.crashed : false,
    radioConnected: radio.connected,
    calibrated: !!settings.controller.calibration,
  });

  motorAudio.update(dt, {
    motorOutput: armed && quad ? quad.motorOutput : 0,
    distance: settings.camera.losMode && quad ? quad.position.distanceTo(pilotPos) : 0,
    los: settings.camera.losMode,
  });

  composer.render();

  // fps watchdog
  fpsSamples++; fpsTime += dt;
  if (fpsTime > 10 && !fpsWarned) {
    const fps = fpsSamples / fpsTime;
    if (fps < 38 && settings.graphics.quality !== 'low') {
      fpsWarned = true;
      emit('osd:flash', { text: 'LOW FPS — TRY LOWER QUALITY OR RENDER DISTANCE (ESC → GRAPHICS)', ms: 5000 });
    }
    fpsSamples = 0; fpsTime = 0;
  }
});

console.info('[PropWash] ready. ESC = menu, Space = arm, R = reset, V = LOS, C = static.');

// debug/testing handle (harmless in production)
window.__pw = {
  get quad() { return quad; },
  get map() { return mapHandle; },
  get armed() { return armed; },
  get sigLoss() { return sigLoss; },
  settings,
  emit,
  scene,
  renderer,
};
