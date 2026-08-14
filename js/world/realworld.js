// ============================================================
// PropWash FPV — "Real World" map
// Streams Google Photorealistic 3D Tiles (real photogrammetry of
// real cities) through the NASA-AMMOS 3d-tiles-renderer library.
// The user supplies their own Google Maps Platform API key at
// runtime (Map Tiles API); it never leaves their browser.
//
// INTEGRATION CONTRACT (main.js — already wired):
//   mapHandle = await buildRealWorld(scene, env, settings.realworld);
//   per frame, in order:
//     mapHandle.setCamera?.(activeCam);            // feeds tiles SSE/LOD
//     mapHandle.update?.(dt, activeCam.position);  // streams + ground cache
//   mapHandle.getAttributions?.() -> string        // current data credits
//
// LIGHTING: Google tiles carry baked photographic lighting. Tile
// materials are left untouched; we clear the HDRI bands so the
// procedural sky/sun only lights the drone, gates and pads and
// does not fight the imagery.
//
// LIBRARY: '3d-tiles-renderer' + '/plugins' resolve through the
// index.html importmap to the package's ESM build on jsdelivr,
// whose only externals are 'three' and 'three/addons/*' — so it
// shares the app's exact three.js 0.180 instance. The library is
// imported lazily (only when an API key exists) and key-failure paths degrade to a quiet ground + settings-token
// DOM card (no cyan canvas). Other failures still use the placard.
// ============================================================
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { emit } from '../core/state.js';
import { assetLib } from '../core/assets.js';

const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';

const GRID = 3;                    // ground cache cell size (m)
const INV_GRID = 1 / GRID;
const KEY_OFF = 2048;              // cell key offset (|cell| < 2048 → ±6.1 km)
const KEY_SPAN = 4096;
const RAY_TOP = 800;               // ground rays are cast down from this height
const RAY_BUDGET = 6;              // fresh raycasts per update() call
const CACHE_TTL_MS = 4000;         // ground cache generation lifetime
const LOAD_TIMEOUT_MS = 15000;     // bootstrap budget (root + first tiles)
const ERROR_TARGET = 14;           // tiles SSE target (lower = sharper)

const GATE_COUNT = 10, GATE_RADIUS = 220, GATE_ALT = 12;
const RETR_COUNT = 8, RETR_RADIUS = 120, RETR_ALT = 2;

const DOWN = new THREE.Vector3(0, -1, 0);
const UP = new THREE.Vector3(0, 1, 0);

// ---------------------------------------------------------------
// lazy library loader (cached; a failure clears the cache so a
// later map reload can retry)
// ---------------------------------------------------------------
let _libPromise = null;
function loadTilesLib() {
  if (!_libPromise) {
    _libPromise = Promise.all([
      import('3d-tiles-renderer'),
      import('3d-tiles-renderer/plugins'),
    ]).then(([core, plugins]) => ({
      TilesRenderer: core.TilesRenderer,
      GoogleCloudAuthPlugin: plugins.GoogleCloudAuthPlugin,
      GLTFExtensionsPlugin: plugins.GLTFExtensionsPlugin,
      ReorientationPlugin: plugins.ReorientationPlugin,
    })).catch((err) => {
      _libPromise = null;
      throw err;
    });
  }
  return _libPromise;
}

// ---------------------------------------------------------------
// ground height cache: 3m grid, Map-lookup hits (physics polls at
// 400 Hz), queued raycasts resolved in update(), generation swap
// every CACHE_TTL_MS so refining tiles re-measure over time.
// ---------------------------------------------------------------
class GroundCache {
  constructor() {
    this.target = null;            // Object3D raycast target (tiles.group)
    this.fresh = new Map();
    this.stale = new Map();
    this.misses = new Map();
    this.pending = new Set();
    this.queue = [];
    this.lastGood = 0;
    this.lastSwap = performance.now();
    this._ray = new THREE.Raycaster();
    this._ray.far = RAY_TOP + 500;
    this._origin = new THREE.Vector3();
  }

  static cellKey(cx, cz) {
    if (cx > 2047) cx = 2047; else if (cx < -2047) cx = -2047;
    if (cz > 2047) cz = 2047; else if (cz < -2047) cz = -2047;
    return (cx + KEY_OFF) * KEY_SPAN + (cz + KEY_OFF);
  }

  request(x, z) {
    const k = GroundCache.cellKey(Math.round(x * INV_GRID), Math.round(z * INV_GRID));
    if (!this.fresh.has(k) && !this.pending.has(k) && this.queue.length < 128) {
      this.pending.add(k);
      this.queue.push(k);
    }
    return k;
  }

  /** Force a cell to re-measure even if already resolved. */
  refresh(x, z) {
    const k = GroundCache.cellKey(Math.round(x * INV_GRID), Math.round(z * INV_GRID));
    this.fresh.delete(k);
    this.misses.delete(k);
    if (!this.pending.has(k) && this.queue.length < 128) {
      this.pending.add(k);
      this.queue.push(k);
    }
    return k;
  }

  /** Hot path — called from physics at 400 Hz. No allocations. */
  height(x, z) {
    const cx = Math.round(x * INV_GRID);
    const cz = Math.round(z * INV_GRID);
    const k = GroundCache.cellKey(cx, cz);
    const fresh = this.fresh;
    let v = fresh.get(k);
    if (v !== undefined) { this.lastGood = v; return v; }
    if (!this.pending.has(k) && this.queue.length < 128) {
      this.pending.add(k);
      this.queue.push(k);
    }
    const stale = this.stale;
    v = stale.get(k);
    if (v !== undefined) return v;
    // nearest resolved neighbour, rings 1..2
    for (let r = 1; r <= 2; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if ((dx !== -r && dx !== r) && (dz !== -r && dz !== r)) continue;
          const nk = (cx + dx + KEY_OFF) * KEY_SPAN + (cz + dz + KEY_OFF);
          let nv = fresh.get(nk);
          if (nv !== undefined) return nv;
          nv = stale.get(nk);
          if (nv !== undefined) return nv;
        }
      }
    }
    return this.lastGood;
  }

  processQueue(budget) {
    const tgt = this.target;
    if (!tgt) return;
    let n = 0;
    while (n < budget && this.queue.length) {
      const k = this.queue.shift();
      if (this.fresh.has(k)) { this.pending.delete(k); continue; }
      const cx = Math.floor(k / KEY_SPAN) - KEY_OFF;
      const cz = (k % KEY_SPAN) - KEY_OFF;
      this._origin.set(cx * GRID, RAY_TOP, cz * GRID);
      this._ray.set(this._origin, DOWN);
      n++;
      let hits = null;
      try { hits = this._ray.intersectObject(tgt, true); } catch (e) { hits = null; }
      if (hits && hits.length) {
        const y = hits[0].point.y;
        this.fresh.set(k, y);
        this.pending.delete(k);
        this.misses.delete(k);
      } else {
        const m = (this.misses.get(k) || 0) + 1;
        if (m >= 3) {
          const fallback = this.stale.get(k);
          this.fresh.set(k, fallback !== undefined ? fallback : 0);
          this.pending.delete(k);
          this.misses.delete(k);
        } else {
          this.misses.set(k, m);
          this.queue.push(k); // retry after more tiles stream in
        }
      }
    }
  }

  tick(now) {
    if (now - this.lastSwap < CACHE_TTL_MS) return;
    this.lastSwap = now;
    const old = this.stale;
    this.stale = this.fresh;
    this.fresh = old;
    this.fresh.clear();
    this.misses.clear();
    this.queue.length = 0;
    this.pending.clear();
  }

  clearAll() {
    this.fresh.clear();
    this.stale.clear();
    this.misses.clear();
    this.pending.clear();
    this.queue.length = 0;
    this.lastGood = 0;
  }
}

// ---------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------
function nextFrame() {
  return new Promise((resolve) => {
    let done = false;
    const fin = () => { if (!done) { done = true; resolve(); } };
    requestAnimationFrame(fin);
    setTimeout(fin, 250); // hidden-tab fallback so bootstrap can't hang
  });
}

function makeAttributionEl() {
  const d = document.createElement('div');
  d.id = 'pw-rw-attrib';
  d.style.cssText =
    'position:fixed;left:10px;bottom:8px;z-index:60;pointer-events:none;' +
    'font:11px/1.5 Consolas,monospace;color:rgba(255,255,255,0.78);' +
    'text-shadow:0 1px 3px rgba(0,0,0,0.9);max-width:62vw;' +
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
  d.textContent = '© Google';
  (document.getElementById('ui-root') || document.body).appendChild(d);
  return d;
}

function ringGates(count, radius, alt, groundFn) {
  const gates = [];
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2;
    const x = Math.sin(ang) * radius;
    const z = -Math.cos(ang) * radius;
    // face along the direction of travel (modes.js: normal = +Z rotated by yaw)
    const tx = Math.cos(ang), tz = Math.sin(ang);
    const yawRad = Math.atan2(tx, tz);
    gates.push({
      position: new THREE.Vector3(x, (groundFn ? groundFn(x, z) : 0) + alt, z),
      yawRad,
      radius: 3.4,
    });
  }
  return gates;
}

function ringPoints(count, radius, alt, groundFn) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2 + Math.PI / count;
    const x = Math.sin(ang) * radius;
    const z = -Math.cos(ang) * radius;
    pts.push(new THREE.Vector3(x, (groundFn ? groundFn(x, z) : 0) + alt, z));
  }
  return pts;
}

// ---------------------------------------------------------------
// Key-fail / no-key fallback is buildQuietGround + osd:flash.
// The old cyan canvas placard is gone (Desi reject).
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// real tiles world
// ---------------------------------------------------------------
async function buildTilesWorld(scene, env, lib, apiKey, latDeg, lonDeg) {
  const { TilesRenderer, GoogleCloudAuthPlugin, GLTFExtensionsPlugin, ReorientationPlugin } = lib;
  if (!TilesRenderer || !GoogleCloudAuthPlugin || !GLTFExtensionsPlugin || !ReorientationPlugin) {
    throw new Error('3d-tiles-renderer exports missing');
  }
  const renderer =
    (assetLib && assetLib.renderer) ||
    (env && (env.renderer || env._renderer)) || null;

  const latRad = THREE.MathUtils.degToRad(latDeg);
  const lonRad = THREE.MathUtils.degToRad(lonDeg);

  const draco = new DRACOLoader();
  draco.setDecoderPath(DRACO_DECODER_PATH);

  const tiles = new TilesRenderer(); // rootURL supplied by GoogleCloudAuthPlugin
  tiles.registerPlugin(new GoogleCloudAuthPlugin({ apiToken: apiKey, autoRefreshToken: true }));
  tiles.registerPlugin(new GLTFExtensionsPlugin({ dracoLoader: draco }));
  tiles.registerPlugin(new ReorientationPlugin({ lat: latRad, lon: lonRad, height: 0, recenter: true }));
  tiles.errorTarget = ERROR_TARGET;
  tiles.group.name = 'realworld-tiles';
  scene.add(tiles.group);

  const ground = new GroundCache();
  ground.target = tiles.group;

  const padGroup = new THREE.Group();
  padGroup.name = 'realworld-props';
  scene.add(padGroup);

  const attribEl = makeAttributionEl();
  let disposed = false;
  let curCam = null;
  let attribStr = '© Google';
  const attribScratch = [];

  // bootstrap camera so SSE/LOD has something to refine against
  // before main.js starts feeding the active camera
  const bootCam = new THREE.PerspectiveCamera(60, 16 / 9, 1, 6000);
  bootCam.position.set(0, 380, 240);
  bootCam.lookAt(0, 0, 0);
  bootCam.updateMatrixWorld(true);
  tiles.setCamera(bootCam);
  if (renderer) tiles.setResolutionFromRenderer(bootCam, renderer);
  curCam = bootCam;

  // runtime tile errors (post-boot): throttled OSD warning
  let lastErrFlash = 0;
  const onRuntimeError = (e) => {
    if (e && e.tile) return; // transient child-tile errors are non-fatal
    const now = performance.now();
    if (now - lastErrFlash > 10000) {
      lastErrFlash = now;
      emit('osd:flash', { title: 'Tile stream error', body: 'Check the Maps key or quota.', level: 'error' });
    }
  };

  const teardown = () => {
    disposed = true;
    try { tiles.removeEventListener('load-error', onRuntimeError); } catch (e) { /* noop */ }
    try { scene.remove(tiles.group); } catch (e) { /* noop */ }
    try { scene.remove(padGroup); } catch (e) { /* noop */ }
    try { tiles.dispose(); } catch (e) { /* noop */ }
    try { draco.dispose(); } catch (e) { /* noop */ }
    try { attribEl.remove(); } catch (e) { /* noop */ }
  };

  try {
    try { env?.setHDRIBands?.({}); } catch (e) { /* noop */ }

    // ---- phase 1: root tileset (auth happens here) ----
    let rootSettled = false;
    const rootPromise = new Promise((resolve, reject) => {
      const onRoot = () => { cleanup(); rootSettled = true; resolve('root'); };
      const onErr = (e) => {
        if (e && e.tile) return; // per-tile failure — keep waiting for root
        cleanup();
        reject((e && e.error) || new Error('root tileset load failed'));
      };
      const cleanup = () => {
        tiles.removeEventListener('load-root-tileset', onRoot);
        tiles.removeEventListener('load-error', onErr);
      };
      tiles.addEventListener('load-root-tileset', onRoot);
      tiles.addEventListener('load-error', onErr);
    });
    rootPromise.catch(() => {}); // avoid unhandled rejection when timing out

    emit('osd:flash', { title: 'Loading', body: 'Fetching 3D tiles.', ms: 1500 });
    const t0 = performance.now();
    let lastPulse = t0;
    let rootErr = null;
    rootPromise.catch((e) => { rootErr = e || new Error('root load failed'); });

    while (!rootSettled) {
      if (rootErr) throw rootErr;
      if (performance.now() - t0 > LOAD_TIMEOUT_MS) {
        const err = new Error('root tileset timeout');
        err.timeout = true;
        throw err;
      }
      try { tiles.update(); } catch (e) { /* first updates can race the root */ }
      if (performance.now() - lastPulse > 3000) {
        lastPulse = performance.now();
        emit('osd:flash', { title: 'Loading', body: 'Fetching 3D tiles.', ms: 1500 });
      }
      await nextFrame();
    }

    // ---- orientation sanity: ECEF up at (lat,lon) must be world +Y ----
    try {
      const n = new THREE.Vector3();
      tiles.ellipsoid.getCartographicToNormal(latRad, lonRad, n);
      const q = new THREE.Quaternion();
      tiles.group.updateMatrixWorld(true);
      tiles.group.getWorldQuaternion(q);
      n.applyQuaternion(q).normalize();
      if (n.y < 0.999) {
        const fix = new THREE.Quaternion().setFromUnitVectors(n, UP);
        tiles.group.quaternion.premultiply(fix);
        tiles.group.position.applyQuaternion(fix);
        tiles.group.updateMatrixWorld(true);
      }
    } catch (e) { console.warn('[realworld] up-axis check skipped:', e); }

    // ---- phase 2: stream tiles near spawn, resolve initial ground ----
    let spawnKey = ground.request(0, 0);
    let g0;
    let lastRefresh = performance.now();
    while (true) {
      try { tiles.update(); } catch (e) { /* noop */ }
      ground.processQueue(RAY_BUDGET * 2);
      g0 = ground.fresh.get(spawnKey);
      const progress = typeof tiles.loadProgress === 'number' ? tiles.loadProgress : 1;
      const elapsed = performance.now() - t0;
      // done when the view has mostly settled AND we have a ground hit
      if (g0 !== undefined && (progress > 0.92 || elapsed > LOAD_TIMEOUT_MS * 0.6)) break;
      if (elapsed > LOAD_TIMEOUT_MS) break;
      // re-measure spawn as tiles refine so we sample the finest LOD
      if (performance.now() - lastRefresh > 900) {
        lastRefresh = performance.now();
        spawnKey = ground.refresh(0, 0);
      }
      if (performance.now() - lastPulse > 3000) {
        lastPulse = performance.now();
        const pct = Math.round((typeof tiles.loadProgress === 'number' ? tiles.loadProgress : 0) * 100);
        emit('osd:flash', { title: 'Loading', body: `Fetching 3D tiles · ${pct}%.`, ms: 1500 });
      }
      await nextFrame();
    }

    // normalize: shift the world so ground at spawn sits at y ≈ 0
    if (g0 === undefined) g0 = 0;
    if (Math.abs(g0) > 0.001) {
      tiles.group.position.y -= g0;
      tiles.group.updateMatrixWorld(true);
      ground.clearAll();
    }
    ground.lastGood = 0;

    // pre-request gate/retrieval cells so heights settle fast
    const gates = ringGates(GATE_COUNT, GATE_RADIUS, GATE_ALT, null);
    const retrievalPoints = ringPoints(RETR_COUNT, RETR_RADIUS, RETR_ALT, null);
    for (const g of gates) ground.request(g.position.x, g.position.z);
    for (const p of retrievalPoints) ground.request(p.x, p.z);
    ground.processQueue(GATE_COUNT + RETR_COUNT + 2);
    const gh = (x, z) => ground.height(x, z);
    for (const g of gates) g.position.y = gh(g.position.x, g.position.z) + GATE_ALT;
    for (const p of retrievalPoints) p.y = gh(p.x, p.z) + RETR_ALT;

    // spawn pad (visual anchor; also the retrieval home)
    const spawnPos = new THREE.Vector3(0, gh(0, 0) + 1, 0);
    const padDisposables = [];
    {
      const padGeo = new THREE.RingGeometry(1.9, 2.2, 40);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x0d2b33, emissive: 0x29d3ff, emissiveIntensity: 0.7, side: THREE.DoubleSide,
      });
      padDisposables.push(padGeo, padMat);
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(0, gh(0, 0) + 0.06, 0);
      padGroup.add(pad);
    }

    tiles.addEventListener('load-error', onRuntimeError);
    emit('osd:flash', { title: 'Ready', body: 'Real World is live.', ms: 1600 });

    // ---- per-frame state ----
    let attribTimer = 0;
    let lazyIdx = 0;

    return {
      name: `Real World ${latDeg.toFixed(3)},${lonDeg.toFixed(3)}`,
      spawn: { position: spawnPos, yawRad: 0 },
      getGroundHeight: gh,
      colliders: [],
      gates,
      retrievalPoints,
      homePad: spawnPos.clone(),

      /** main.js calls this every frame with the active camera (before update). */
      setCamera(cam) {
        if (!cam || cam === curCam || disposed) return;
        try {
          if (curCam) tiles.deleteCamera(curCam);
          tiles.setCamera(cam);
          if (renderer) tiles.setResolutionFromRenderer(cam, renderer);
          curCam = cam;
        } catch (e) { console.warn('[realworld] setCamera failed', e); }
      },

      /** Current data attributions (Google ToS). Also shown bottom-left. */
      getAttributions() { return attribStr; },

      update(dt) {
        if (disposed) return;
        try { tiles.update(); } catch (e) { /* keep the sim alive */ }

        const now = performance.now();
        ground.tick(now);
        ground.processQueue(RAY_BUDGET);

        // lazily re-settle gate/retrieval heights as cells fill in
        const total = gates.length + retrievalPoints.length;
        for (let n = 0; n < 2; n++) {
          const i = lazyIdx++ % total;
          if (i < gates.length) {
            const g = gates[i];
            g.position.y = gh(g.position.x, g.position.z) + GATE_ALT;
          } else {
            const p = retrievalPoints[i - gates.length];
            p.y = gh(p.x, p.z) + RETR_ALT;
          }
        }

        // attributions (throttled)
        attribTimer -= dt;
        if (attribTimer <= 0) {
          attribTimer = 2;
          try {
            attribScratch.length = 0;
            tiles.getAttributions(attribScratch);
            let s = '';
            for (const a of attribScratch) {
              if (a && a.type === 'string' && a.value) s = s ? `${s}; ${a.value}` : a.value;
            }
            attribStr = s ? `© Google · ${s}` : '© Google';
            if (attribEl.textContent !== attribStr) attribEl.textContent = attribStr;
          } catch (e) { /* noop */ }
        }
      },

      dispose(sceneRef) {
        disposed = true;
        try { tiles.removeEventListener('load-error', onRuntimeError); } catch (e) { /* noop */ }
        sceneRef.remove(tiles.group);
        sceneRef.remove(padGroup);
        for (const d of padDisposables) { try { d.dispose(); } catch (e) { /* noop */ } }
        try { tiles.dispose(); } catch (e) { /* noop */ }
        try { draco.dispose(); } catch (e) { /* noop */ }
        try { attribEl.remove(); } catch (e) { /* noop */ }
        ground.clearAll();
      },
    };
  } catch (err) {
    teardown();
    throw err;
  }
}


// ---------------------------------------------------------------
// Map Tiles key-failure diagnostics
// Browser-download only (serve.ps1 is static — no logs/ write).
// Fingerprint is length + last 4. Never the raw key.
// ---------------------------------------------------------------
function keyFingerprint(key) {
  const s = String(key || '');
  return `len=${s.length} last4=${s ? s.slice(-4) : ''}`;
}

function downloadTilesErrorFile(text) {
  try {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'propwash-map-tiles-error.txt';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => { try { URL.revokeObjectURL(a.href); } catch (e) { /* noop */ } }, 2000);
  } catch (e) {
    console.warn('[realworld] could not download error file');
  }
}

function failRecord(klass, title, body, next, steps, extra) {
  const x = extra || {};
  return {
    ok: false,
    klass,
    title,
    body,
    next,
    detail: body,
    hint: next,
    steps,
    httpStatus: x.httpStatus == null ? null : x.httpStatus,
    googleStatus: x.googleStatus || '',
    googleMessage: x.googleMessage || '',
    googleReason: x.googleReason || '',
  };
}

const STEPS_NOT_FOUND = [
  'Same Cloud project that owns this key: enable Map Tiles API (APIs & Services → Library).',
  'Link a billing account to that project (Billing). Free credit still applies.',
  'Application restrictions: None, or HTTP referrers that include this origin.',
  'API restrictions must include Map Tiles API (not only Maps JavaScript API).',
  'New keys can take up to ~60 minutes to become live for Photorealistic 3D Tiles.',
  'Select-all when pasting the key so it is not truncated and has no stray space.',
];
const STEPS_REFERRER = [
  'Google Cloud → Credentials → this key → Application restrictions.',
  'Use Website restrictions (HTTP referrers), or set restrictions to None.',
  'Add this origin (and localhost if you serve locally), e.g. this host plus /*.',
  'Save, wait a minute, select-all paste the key again.',
];
const STEPS_DISABLED = [
  'Open the Cloud project that owns this key.',
  'APIs & Services → enable Map Tiles API.',
  'Confirm the key’s API restrictions include Map Tiles API.',
  'Select-all paste the key and fly again.',
];
const STEPS_BILLING = [
  'Google Cloud → Billing → link an account to this project.',
  'Photorealistic 3D Tiles will not serve without billing linked (free credit still applies).',
  'Wait a few minutes, then fly again.',
];
const STEPS_INVALID = [
  'Open Maps → Real World.',
  'Select-all in the key field and paste the full key (starts with AIza).',
  'Check for a typo, stray space, or truncated paste.',
  'Confirm the key is from the project where Map Tiles API is enabled.',
];
const STEPS_NETWORK = [
  'Check your connection.',
  'Disable ad-blockers / privacy extensions for this origin.',
  'Confirm tile.googleapis.com is not blocked.',
  'Fly again.',
];
const STEPS_HTTP = [
  'Confirm Map Tiles API is enabled on the same project as this key.',
  'Confirm billing is linked.',
  'Application restrictions: None, or this origin.',
  'API restrictions include Map Tiles API.',
  'New keys can take ~60 min to become live.',
  'Select-all paste the key.',
];

function showKeyErrorCard(pre) {
  emit('osd:flash', {
    title: pre.title,
    body: pre.body || pre.detail,
    next: pre.next || pre.hint,
    nextEvent: { name: 'menu:goto', detail: { tab: 'maps', realworld: true } },
    level: 'error',
  });
}

function writeTilesErrorFile(pre, apiKey) {
  const origin = (typeof location !== 'undefined' && location.origin) ? location.origin : '';
  const lines = [
    'PropWash Map Tiles error',
    '========================',
    `timestamp: ${new Date().toISOString()}`,
    `http_status: ${pre.httpStatus == null ? '' : pre.httpStatus}`,
    `google_status: ${pre.googleStatus || ''}`,
    `google_message: ${pre.googleMessage || ''}`,
    `google_reason: ${pre.googleReason || ''}`,
    `origin: ${origin}`,
    `key_fingerprint: ${keyFingerprint(apiKey)}`,
    `class: ${pre.klass || 'unknown'}`,
    '',
    pre.title || '',
    pre.detail || '',
    pre.hint || '',
    '',
    'Fix steps',
    '---------',
    ...(pre.steps || []).map((s, i) => `${i + 1}. ${s}`),
    '',
    'The raw API key is never written to this file.',
  ];
  downloadTilesErrorFile(lines.join('\n'));
}

function reportKeyFailure(pre, apiKey) {
  writeTilesErrorFile(pre, apiKey);
  showKeyErrorCard(pre);
}

/** Dark ground + pad, no cyan canvas placard. Card lives in #ui-root. */
function buildQuietGround(scene, env) {
  try { env?.setHDRIBands?.({}); } catch (e) { /* noop */ }

  const root = new THREE.Group();
  root.name = 'realworld-keyfail';
  const disposables = [];
  const track = (r) => { disposables.push(r); return r; };

  const groundGeo = track(new THREE.CircleGeometry(320, 64));
  const groundMat = track(new THREE.MeshStandardMaterial({
    color: 0x10151d, roughness: 0.95, metalness: 0.0,
  }));
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  const grid = new THREE.GridHelper(640, 64, 0x2a2a32, 0x16161c);
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  grid.position.y = 0.02;
  track(grid.geometry); track(grid.material);
  root.add(grid);

  const padGeo = track(new THREE.RingGeometry(1.9, 2.2, 40));
  const padMat = track(new THREE.MeshStandardMaterial({
    color: 0x1a1a1e, emissive: 0x3a3a42, emissiveIntensity: 0.25, side: THREE.DoubleSide,
  }));
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.04;
  root.add(pad);

  scene.add(root);
  const spawnPos = new THREE.Vector3(0, 1, 0);
  return {
    name: 'Real World',
    spawn: { position: spawnPos, yawRad: 0 },
    getGroundHeight: () => 0,
    colliders: [],
    gates: [],
    retrievalPoints: [],
    homePad: spawnPos.clone(),
    setCamera() { /* no tiles */ },
    getAttributions() { return ''; },
    update() { /* quiet */ },
    dispose(sceneRef) {
      sceneRef.remove(root);
      for (const d of disposables) { try { d.dispose?.(); } catch (e) { /* noop */ } }
    },
  };
}

// ---------------------------------------------------------------
// public entry
// ---------------------------------------------------------------
/**
 * Ask Google for the 3D Tiles root with the user's key and translate whatever
 * comes back into something actionable. Returns {ok:true} or a fail record
 * (klass, title, detail, hint, steps, http/google fields). Never includes the key.
 */
async function preflightKey(apiKey) {
  const url = `https://tile.googleapis.com/v1/3dtiles/root.json?key=${encodeURIComponent(apiKey)}`;
  let res = null;
  try {
    res = await fetch(url, { method: 'GET' });
  } catch (e) {
    return failRecord(
      'network',
      "Can't reach Google",
      'The tile request was blocked by the network or browser.',
      'Check your connection, then fly again',
      STEPS_NETWORK,
    );
  }
  if (res.ok) return { ok: true };

  let reason = '';
  let message = '';
  let status = '';
  try {
    const body = await res.json();
    const err = body && body.error;
    message = String((err && err.message) || '');
    status = String((err && err.status) || '');
    const details = (err && err.details) || [];
    for (const d of details) {
      if (d && d.reason) { reason = String(d.reason); break; }
    }
    if (!reason && status) reason = status;
  } catch (e) { /* non-JSON error body */ }

  const short = (message || `HTTP ${res.status}`).toUpperCase().slice(0, 62);
  const extra = {
    httpStatus: res.status,
    googleStatus: status,
    googleMessage: message,
    googleReason: reason,
  };

  // Referrer restriction is the single most common cause once the API is on:
  // the key is fine, it just is not allowed to be used from this site.
  if (/REFERR|REFERER/i.test(reason) || /referer/i.test(message)) {
    return failRecord(
      'referrer',
      'Key blocked for this site',
      'This origin is not allowed to use the key.',
      'Add this site to the key restrictions',
      STEPS_REFERRER,
      extra,
    );
  }
  if (/SERVICE_DISABLED|PERMISSION_DENIED|API_NOT/i.test(reason) || /has not been used|is disabled/i.test(message)) {
    return failRecord(
      'api_disabled',
      'Map Tiles API is off',
      'This project has not enabled Map Tiles API.',
      'Enable Map Tiles API, then fly again',
      STEPS_DISABLED,
      extra,
    );
  }
  if (/BILLING/i.test(reason) || /billing/i.test(message)) {
    return failRecord(
      'billing',
      'Billing is not linked',
      'Google needs a billing account on this project.',
      'Link billing, then fly again',
      STEPS_BILLING,
      extra,
    );
  }
  if (/API_KEY_INVALID/i.test(reason) || /API_KEY_INVALID/i.test(status)) {
    return failRecord(
      'invalid',
      'API key not accepted',
      'The key was rejected. Check for a typo or stray space.',
      'Paste the key again in Maps',
      STEPS_INVALID,
      extra,
    );
  }
  // Google uses 404 + NOT_FOUND (not always API_KEY_INVALID) when the key
  // is not live for Photorealistic 3D Tiles / Map Tiles API.
  const notFound = res.status === 404 && (
    /NOT_FOUND/i.test(reason) || /NOT_FOUND/i.test(status) || /not found/i.test(message)
  );
  if (notFound) {
    return failRecord(
      'not_found',
      '3D tiles unavailable',
      'Google did not serve 3D tiles for this key.',
      'Check the Maps key and billing, or fly a built map',
      STEPS_NOT_FOUND,
      extra,
    );
  }
  return failRecord(
    'http',
    '3D tiles unavailable',
    'Google did not serve 3D tiles for this key.',
    'Check the Maps key and billing, or fly a built map',
    STEPS_HTTP,
    extra,
  );
}

export async function buildRealWorld(scene, env, opts) {
  const o = {
    apiKey: '',
    preset: 'miami',
    lat: 25.7907,
    lon: -80.13,
    ...(opts || {}),
  };
  const apiKey = String(o.apiKey || '').trim();
  const lat = Number.isFinite(Number(o.lat)) ? Number(o.lat) : 25.7907;
  const lon = Number.isFinite(Number(o.lon)) ? Number(o.lon) : -80.13;

  if (!apiKey) {
    emit('osd:flash', {
      title: 'Maps key needed',
      body: 'Real World uses your Google Map Tiles key.',
      next: 'Add a key in Maps, or fly a built map',
      nextEvent: { name: 'menu:goto', detail: { tab: 'maps', realworld: true } },
      level: 'error',
    });
    return buildQuietGround(scene, env);
  }

  // Preflight the key ourselves so we can report Google's ACTUAL reason.
  // The tiles library only surfaces an HTTP status, which made every failure
  // look like "key rejected" even when the real cause was referrer
  // restrictions or a project without billing enabled.
  const pre = await preflightKey(apiKey);
  if (!pre.ok) {
    console.error('[realworld] key preflight failed:', {
      klass: pre.klass, title: pre.title, httpStatus: pre.httpStatus,
      googleStatus: pre.googleStatus, googleReason: pre.googleReason,
      fingerprint: keyFingerprint(apiKey),
    });
    reportKeyFailure(pre, apiKey);
    return buildQuietGround(scene, env);
  }

  let lib = null;
  try {
    lib = await loadTilesLib();
  } catch (err) {
    console.error('[realworld] tiles library failed to load:', err);
    emit('osd:flash', {
      title: '3D tiles unavailable',
      body: 'The tile engine failed to load.',
      next: 'Check your connection, then fly again',
      nextEvent: { name: 'menu:goto', detail: { tab: 'maps', realworld: true } },
      level: 'error',
    });
    return buildQuietGround(scene, env);
  }

  try {
    return await buildTilesWorld(scene, env, lib, apiKey, lat, lon);
  } catch (err) {
    console.error('[realworld] tile world failed:', err && err.message);
    const msg = String((err && err.message) || err);
    const rejected = /\b4\d\d\b/.test(msg);
    if (rejected) {
      const late = failRecord(
        'http',
        '3D tiles unavailable',
        'Google did not serve 3D tiles for this key.',
        'Check the Maps key and billing, or fly a built map',
        STEPS_HTTP,
        { httpStatus: 400, googleMessage: msg },
      );
      reportKeyFailure(late, apiKey);
      return buildQuietGround(scene, env);
    }
    emit('osd:flash', {
      title: '3D tiles unavailable',
      body: err && err.timeout ? 'Tiles timed out. Check your connection.' : 'Tiles failed to load.',
      next: 'Check your connection, then fly again',
      nextEvent: { name: 'menu:goto', detail: { tab: 'maps', realworld: true } },
      level: 'error',
    });
    return buildQuietGround(scene, env);
  }
}
