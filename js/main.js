// ============================================================
// PropWash FPV — main game loop & integration
// ============================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { settings, saveSettings, emit, on } from './core/state.js';
import { initAssetLibrary } from './core/assets.js';
import { DRONES } from './physics/drones.js';
import { Quad } from './physics/quad.js';
import { buildDroneMesh } from './physics/droneMesh.js';
import { RadioManager } from './input/radio.js';
import { KeyboardInput } from './input/keyboard.js';
import { Menu } from './ui/menu.js';
import { CalibrationUI } from './ui/calibration.js';
import { OSD } from './ui/osd.js';
import { StickOverlay } from './ui/sticks.js';
import { HealthUI } from './ui/health.js';
import { ColliderDebug } from './ui/colliderDebug.js';
import { FpvCameraPipeline } from './camera/index.js';
import { TrailSystem } from './world/trails.js';
import { Environment } from './world/environment.js';
import { buildMiami } from './world/miami.js';
import { buildAshPrairie } from './world/ashPrairie.js';
import { buildProcedural } from './world/procedural.js';
import { buildRealWorld } from './world/realworld.js';
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

initAssetLibrary(renderer);

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

// FPV / LOS cameras, signal-loss, and static feed — see js/camera/
const cameras = new FpvCameraPipeline({
  renderDistance: settings.graphics.renderDistance,
  fxRoot: document.getElementById('fx-root'),
});
const { fpvCam } = cameras;

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
  cameras.setRenderDistance(rd);
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
const sticks = new StickOverlay(document.getElementById('osd-root'));
const health = new HealthUI(document.getElementById('osd-root'));
const menu = new Menu();
const calibUI = new CalibrationUI(radio);
const modeManager = new ModeManager(scene);
const motorAudio = new MotorAudio();
const trails = new TrailSystem(scene);
const colliderDebug = new ColliderDebug(scene);

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
    } else if (settings.map === 'ashPrairie') {
      mapHandle = await buildAshPrairie(scene, env);
    } else if (settings.map === 'realworld') {
      mapHandle = await buildRealWorld(scene, env, settings.realworld);
    } else {
      mapHandle = await buildProcedural(scene, env, settings.procedural);
    }
    env.setIndoor?.(settings.map === 'procedural' && settings.procedural.setting === 'indoor');
    pilotPos.copy(mapHandle.spawn.position).add(new THREE.Vector3(0, 1.7, 0));
    modeManager.start(settings.gameMode, mapHandle);
    colliderDebug.setColliders(mapHandle ? mapHandle.colliders : null);
    colliderDebug.setVisible(!!settings.debug.hitboxes);
    trails.setMap(settings.map);
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
  // Following a trail? Start the drone at that trail's first sample.
  const o = trails.getSpawnOverride();
  quad.reset(
    o ? o.position.clone() : mapHandle.spawn.position.clone(),
    o ? o.yawRad : (mapHandle.spawn.yawRad || 0)
  );
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
    needThrottleLift = true;   // don't instantly re-auto-arm after a deliberate disarm
    emit('osd:flash', { text: 'DISARMED', ms: 800 });
  }
}

// ---------------- controls ----------------
const currentControls = { throttle: 0, roll: 0, pitch: 0, yaw: 0 };
let controlsLive = false;      // a radio or the keyboard is actively providing input
let lowThrottleMs = 0;         // throttle-held-low timer for auto-arm
let needThrottleLift = false;  // after a manual disarm, require throttle > 0.1 before auto-arm

function pollControls(dt) {
  radio.update(performance.now());
  const kb = keyboard.getFlightControls(dt);
  controlsLive = (radio.connected && !!settings.controller.calibration) || kb.active;
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
    emit('osd:flash', { text: 'CRASHED — RESPAWNING…', ms: 1600 });
  }
}

// Auto-respawn a few seconds after a write-off so a bad hit does not end the
// session; R still resets instantly.
const CRASH_RESPAWN_S = 3;
let crashRespawnIn = 0;

function updateCrashRespawn(dt) {
  if (!quad || !quad.crashed) { crashRespawnIn = 0; return; }
  if (menu.isOpen || calibUI.isOpen) return;   // don't respawn behind the menu
  // Arm the countdown on ANY write-off, including one that happens while
  // disarmed (falling out of the sky with a dead prop still counts).
  if (crashRespawnIn <= 0) crashRespawnIn = CRASH_RESPAWN_S;
  const before = Math.ceil(crashRespawnIn);
  crashRespawnIn -= dt;
  const now = Math.ceil(crashRespawnIn);
  if (now !== before && now > 0) emit('osd:flash', { text: `RESPAWNING IN ${now}…`, ms: 900 });
  if (crashRespawnIn <= 0) {
    crashRespawnIn = 0;
    quad.crashed = false;
    respawn();
    emit('osd:flash', { text: 'READY — THROTTLE DOWN TO ARM', ms: 1600 });
  }
}

// ---------------- event wiring ----------------
on('hotkey:menu', () => {
  if (calibUI.isOpen) { calibUI.close(); return; }
  menu.isOpen ? menu.close() : menu.open();
});
on('menu:open', () => { paused = true; });
on('menu:close', () => { paused = false; });
on('hotkey:reset', () => { if (!menu.isOpen && !calibUI.isOpen) { crashRespawnIn = 0; quad.crashed = false; respawn(); emit('osd:flash', { text: 'RESET', ms: 600 }); } });
on('hotkey:arm', () => { if (!menu.isOpen && !calibUI.isOpen) tryArm(!armed); });
on('hotkey:view', () => { cameras.toggleLos(); });
on('hotkey:static', () => { cameras.toggleStatic(); });
on('hotkey:trail', () => { if (!menu.isOpen && !calibUI.isOpen) trails.toggleRecording(); });
on('hotkey:hitbox', () => {
  if (menu.isOpen || calibUI.isOpen) return;
  settings.debug.hitboxes = colliderDebug.toggle();
  saveSettings();
  emit('osd:flash', { text: settings.debug.hitboxes ? 'HITBOX VIEW ON' : 'HITBOX VIEW OFF', ms: 900 });
});
on('hotkey:camTilt', ({ delta }) => {
  if (menu.isOpen || calibUI.isOpen) return;
  cameras.nudgeTilt(delta);
});
on('hotkey:fov', ({ delta }) => {
  if (menu.isOpen || calibUI.isOpen) return;
  cameras.nudgeFov(delta);
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
  const aspect = innerHeight ? innerWidth / innerHeight : 1;
  cameras.resize(aspect);
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

  // default arming: hold the throttle stick all the way down for ~half a second
  if (!paused && quad && !armed && !quad.crashed && !menu.isOpen && !calibUI.isOpen) {
    if (controlsLive && currentControls.throttle < 0.025 && !needThrottleLift) {
      lowThrottleMs += dt * 1000;
      if (lowThrottleMs >= 450) { lowThrottleMs = 0; tryArm(true); }
    } else {
      lowThrottleMs = 0;
      if (currentControls.throttle > 0.1) needThrottleLift = false;
    }
  }

  if (!paused && quad && mapHandle) {
    stepPhysics(dt);
    colliderDebug.update(quad.position);
    if (armed && !quad.crashed) flightTimer += dt;
    modeManager.update(dt, quad);
    updateCrashRespawn(dt);
    trails.update(dt, quad.position, quad.quaternion, armed, quad.crashed);
    cameras.updateSignal(dt, { quad, pilotPos, mapHandle });
  }

  if (quad && droneMesh) {
    droneMesh.group.position.copy(quad.position);
    droneMesh.group.quaternion.copy(quad.quaternion);
    droneMesh.update(dt, quad.motorOutput, armed);
    cameras.updatePose(t, {
      quad,
      droneMesh,
      pilotPos,
      armed,
      menuOpen: menu.isOpen,
      osd,
      renderPass,
      getGroundHeight: mapHandle ? mapHandle.getGroundHeight : null,
      getCameraFloor: mapHandle ? mapHandle.getCameraFloor : null,
    });
  }

  const activeCam = cameras.activeCam;
  env.update(dt, activeCam);
  mapHandle?.setCamera?.(activeCam);
  mapHandle?.update?.(dt, { camera: activeCam, craft: quad ? quad.position : null });

  cameras.updateFeed(dt, { menuOpen: menu.isOpen });

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
    rssi: cameras.rssi,
    crashed: quad ? quad.crashed : false,
    radioConnected: radio.connected,
    calibrated: !!settings.controller.calibration,
  });

  const showSticks = settings.osd.showSticks && !menu.isOpen && !calibUI.isOpen;
  sticks.setVisible(showSticks);
  if (showSticks) sticks.update(currentControls);

  const showHealth = !settings.camera.losMode && !menu.isOpen && !calibUI.isOpen;
  health.setVisible(showHealth);
  if (showHealth && quad) health.update(quad.damage);

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
  get sigLoss() { return cameras.sigLoss; },
  get cameras() { return cameras; },
  settings,
  emit,
  scene,
  renderer,
};
