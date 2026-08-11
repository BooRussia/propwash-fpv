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
// imported lazily (only when an API key exists) and every failure
// path degrades to a placard scene with a valid MapHandle.
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
// placard fallback scene — used when there is no API key, the key
// is rejected, or the tiles/library fail. Always a valid handle.
// ---------------------------------------------------------------
function textSprite(title, sub, hint) {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 512;
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  // dark backing panel so the message reads against any sky/sun
  const rr = (x, y, w, h, r) => {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };
  rr(24, 24, 2000, 464, 46);
  g.fillStyle = 'rgba(4, 11, 20, 0.82)';
  g.fill();
  g.lineWidth = 5;
  g.strokeStyle = 'rgba(41, 211, 255, 0.55)';
  g.stroke();
  g.textAlign = 'center';
  g.shadowColor = 'rgba(41,211,255,0.9)';
  g.shadowBlur = 34;
  g.fillStyle = '#8fefff';
  g.font = '900 118px Consolas, monospace';
  g.fillText(title, 1024, 178);
  g.shadowBlur = 12;
  g.shadowColor = 'rgba(0,0,0,0.9)';
  g.fillStyle = '#eaf6fc';
  g.font = '700 62px Consolas, monospace';
  g.fillText(sub, 1024, 300);
  if (hint) {
    g.fillStyle = 'rgba(150,175,195,0.95)';
    g.font = '600 44px Consolas, monospace';
    g.fillText(hint, 1024, 408);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function buildPlacard(scene, env, title, sub, hint) {
  try { env?.setHDRIBands?.({}); } catch (e) { /* noop */ }

  const root = new THREE.Group();
  root.name = 'realworld-placard';
  const disposables = [];
  const track = (r) => { disposables.push(r); return r; };

  // dark ground slab
  const groundGeo = track(new THREE.CircleGeometry(320, 64));
  const groundMat = track(new THREE.MeshStandardMaterial({
    color: 0x10151d, roughness: 0.95, metalness: 0.0,
  }));
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  // subtle nav grid
  const grid = new THREE.GridHelper(640, 64, 0x1f4c5e, 0x122430);
  grid.material.transparent = true;
  grid.material.opacity = 0.5;
  grid.position.y = 0.02;
  track(grid.geometry); track(grid.material);
  root.add(grid);

  // glowing home pad
  const padGeo = track(new THREE.RingGeometry(1.9, 2.2, 40));
  const padMat = track(new THREE.MeshStandardMaterial({
    color: 0x0d2b33, emissive: 0x29d3ff, emissiveIntensity: 0.55, side: THREE.DoubleSide,
  }));
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.04;
  root.add(pad);

  // floating message
  const tex = track(textSprite(title, sub, hint || ''));
  const sprMat = track(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  const sprite = new THREE.Sprite(sprMat);
  sprite.scale.set(44, 11, 1);
  sprite.position.set(0, 8.5, -20);
  root.add(sprite);

  scene.add(root);

  const spawnPos = new THREE.Vector3(0, 1, 0);
  let time = 0;
  return {
    name: 'Real World',
    spawn: { position: spawnPos, yawRad: 0 },
    getGroundHeight: () => 0,
    colliders: [],
    gates: [],
    retrievalPoints: [],
    homePad: spawnPos.clone(),
    setCamera() { /* no tiles to feed */ },
    getAttributions() { return ''; },
    update(dt) {
      time += dt;
      sprite.position.y = 8.5 + Math.sin(time * 0.8) * 0.35;
      pad.material.emissiveIntensity = 0.55 + Math.sin(time * 2.2) * 0.2;
    },
    dispose(sceneRef) {
      sceneRef.remove(root);
      for (const d of disposables) { try { d.dispose?.(); } catch (e) { /* noop */ } }
    },
  };
}

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
      emit('osd:flash', { text: 'TILE STREAM ERROR — CHECK KEY / QUOTA', ms: 2500 });
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

    emit('osd:flash', { text: 'LOADING REAL WORLD TILES…', ms: 1500 });
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
        emit('osd:flash', { text: 'LOADING REAL WORLD TILES…', ms: 1500 });
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
        emit('osd:flash', { text: `LOADING REAL WORLD TILES… ${pct}%`, ms: 1500 });
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
    emit('osd:flash', { text: 'REAL WORLD READY — FLY', ms: 1600 });

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
// public entry
// ---------------------------------------------------------------
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
    return buildPlacard(scene, env,
      'REAL WORLD MODE',
      'ADD YOUR FREE GOOGLE MAPS API KEY IN ESC > MAPS',
      'CONSOLE.CLOUD.GOOGLE.COM · ENABLE "MAP TILES API"');
  }

  let lib = null;
  try {
    lib = await loadTilesLib();
  } catch (err) {
    console.error('[realworld] tiles library failed to load:', err);
    return buildPlacard(scene, env,
      'REAL WORLD MODE',
      'TILE ENGINE FAILED TO LOAD — CHECK CONNECTION',
      'RELOAD THE MAP FROM ESC > MAPS TO RETRY');
  }

  try {
    return await buildTilesWorld(scene, env, lib, apiKey, lat, lon);
  } catch (err) {
    console.error('[realworld] tile world failed:', err);
    const msg = String((err && err.message) || err);
    const rejected = /\b4\d\d\b/.test(msg);
    if (rejected) {
      return buildPlacard(scene, env,
        'API KEY REJECTED',
        'CHECK "MAP TILES API" IS ENABLED FOR YOUR KEY',
        'ESC > MAPS TO FIX THE KEY, THEN FLY AGAIN');
    }
    return buildPlacard(scene, env,
      'REAL WORLD UNAVAILABLE',
      err && err.timeout ? 'TILES TIMED OUT — CHECK CONNECTION' : 'TILES FAILED TO LOAD — CHECK CONNECTION',
      'RELOAD THE MAP FROM ESC > MAPS TO RETRY');
  }
}
