// ============================================================
// PropWash FPV — TRAILS
// Record a flight line, save it, then follow it as a glowing
// ribbon laid through the world.
//
//   const trails = new TrailSystem(scene);
//   trails.setMap('miami');                       // after every map load
//   trails.update(dt, quad.position, quad.quaternion, armed);   // every frame
//   const sp = trails.getSpawnOverride();         // in respawn()
//
// All UI talks to this module over the shared event bus — see
// TRAIL_EVENTS at the bottom of the header block for the contract.
// ============================================================
import * as THREE from 'three';
import { on, emit, settings } from '../core/state.js';

// ------------------------------------------------------------
// bus contract
// ------------------------------------------------------------
export const TRAIL_EVENTS = {
  // ---- subscribed: UI → TrailSystem -------------------------
  /** toggle recording on/off (no payload) */
  RECORD_TOGGLE: 'trail:record:toggle',
  /** save the line just recorded — { name } */
  SAVE: 'trail:save',
  /** delete a saved trail — { id } (premades are read-only) */
  DELETE: 'trail:delete',
  /** show a trail + respawn the drone at its start — { id } */
  FLY: 'trail:fly',
  /** clear the ribbon and stop following (no payload) */
  HIDE: 'trail:hide',
  /** request the trail list (no payload) → answered with LIST_RESULT */
  LIST: 'trail:list',

  // ---- emitted: TrailSystem → UI / sim ----------------------
  /** { map, recording, activeId, pending, trails:[{id,name,premade,createdAt,samples,lengthM,durationS,active}] } */
  LIST_RESULT: 'trail:list:result',
  /** { text, ms } OSD flash feedback */
  FLASH: 'osd:flash',
  /** { text } persistent OSD objective line while following */
  OBJECTIVE: 'mode:objective',
  /** respawn request — main.js reads getSpawnOverride() during respawn */
  SIM_RESET: 'sim:reset',
};

// ------------------------------------------------------------
// tuning
// ------------------------------------------------------------
const STORE_KEY = 'propwash-trails-v1';

const SAMPLE_DT = 1 / 20;        // 20 Hz recording
const MIN_STEP = 0.35;           // metres — dedupe distance
const MAX_SAMPLES = 4000;        // ≈ 3.5 min of flying
const RIBBON_CAP = MAX_SAMPLES + 8;

const HALF_WIDTH = 0.55;         // metres, half the ribbon width
const TAPER_M = 2.4;             // metres of width ramp at each end
const UV_METERS = 12;            // one texture repeat per N metres
const CHEVRON_SPACING = 8;       // metres between direction chevrons
const CHEVRON_CAP = 720;         // ≈ 5.7 km of trail
const FINISH_RADIUS = 6;         // metres — "you reached the end"
const UP_BLEND = 0.45;           // 0 = flat ribbon, 1 = fully banked with the drone
const REACQUIRE_D2 = 400;        // (20 m)² — lost the line → coarse re-scan

const COL_START = new THREE.Color(0x9ceeff);
const COL_MID = new THREE.Color(0x29d3ff);
const COL_END = new THREE.Color(0x0f68b4);
const COL_FLOWN = new THREE.Color(0x1f7d5c);

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

// ------------------------------------------------------------
// premade trails — hand-authored waypoints, Catmull-Rom smoothed.
// Threaded through the Miami map's deterministic props (the palm
// slalom below dodges the real trunk positions).
// ------------------------------------------------------------
const PREMADE = {
  miami: [
    {
      id: 'pw:miami:ocean-drive',
      name: 'Ocean Drive Cruise',
      blurb: 'Low fast run west down Ocean Drive, slaloming the palms.',
      spacing: 1.3,
      points: [
        [152, 2.1, 44.0], [140, 3.6, 44.8], [130, 4.3, 45.9], [118, 4.4, 46.9],
        [100, 4.2, 45.4], [ 80, 4.5, 46.6], [ 62, 4.3, 47.3], [ 44, 4.6, 45.0],
        [ 24, 4.9, 42.2], [  5, 5.1, 40.6], [-14, 5.0, 41.9], [-38, 4.6, 45.2],
        [-60, 4.9, 46.4], [-82, 5.0, 47.4], [-102, 5.0, 47.8], [-120, 5.2, 41.4],
        [-140, 4.8, 41.4], [-158, 4.7, 42.0], [-178, 4.8, 43.6], [-192, 5.4, 45.4],
        [-202, 7.0, 47.2], [-210, 9.5, 49.0],
      ],
    },
    {
      id: 'pw:miami:skyline-weave',
      name: 'Skyline Weave',
      blurb: 'Climbing slalom off the street and up through the towers.',
      spacing: 1.6,
      points: [
        [56, 2.1, 44], [55, 5.0, 52], [50, 9.0, 62], [58, 14.0, 72],
        [70, 20.0, 82], [62, 27.0, 94], [48, 34.0, 104], [52, 42.0, 116],
        [68, 51.0, 128], [72, 60.0, 142], [56, 69.0, 156], [50, 78.0, 170],
        [60, 88.0, 186], [70, 96.0, 200], [62, 102.0, 216], [52, 104.0, 230],
      ],
    },
    {
      id: 'pw:miami:pier-dive',
      name: 'Pier Dive',
      blurb: 'Off the pier deck, under the pylons, then out over the water.',
      spacing: 1.4,
      points: [
        [-150, 4.2, 16], [-150, 7.6, 4], [-152, 9.6, -10], [-157, 8.6, -22],
        [-160, 5.2, -32], [-159, 2.6, -42], [-154, 1.8, -52], [-150, 1.7, -66],
        [-150, 1.6, -84], [-150, 1.7, -102], [-150, 1.7, -120], [-150, 1.9, -134],
        [-151, 2.4, -144], [-153, 4.6, -152], [-158, 8.0, -164], [-170, 13.0, -180],
        [-188, 18.0, -196], [-210, 22.0, -212], [-232, 24.0, -224],
      ],
    },
  ],
};

// ------------------------------------------------------------
// small helpers
// ------------------------------------------------------------
function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function smoothstep(t) { const x = clamp01(t); return x * x * (3 - 2 * x); }
function r2(v) { return Math.round(v * 100) / 100; }
function r3(v) { return Math.round(v * 1000) / 1000; }

function fmtClock(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return `${String(m).padStart(2, '0')}:${rest < 10 ? '0' : ''}${rest.toFixed(2)}`;
}

function newId() {
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Partial-upload helper that works across three revisions. */
function markRange(attr, start, count) {
  const ranges = attr.updateRanges;
  if (Array.isArray(ranges) && typeof attr.addUpdateRange === 'function') {
    if (ranges.length > 24) {
      // too many pending chunks — fall back to one full upload
      if (typeof attr.clearUpdateRanges === 'function') attr.clearUpdateRanges();
    } else {
      attr.addUpdateRange(start, count);
    }
  }
  attr.needsUpdate = true;
}

/** Force a full re-upload (drops any pending partial ranges). */
function markFull(attr) {
  if (typeof attr.clearUpdateRanges === 'function') attr.clearUpdateRanges();
  attr.needsUpdate = true;
}

/** Colour along the ribbon: bright at the start, deepening toward the end. */
function gradientAt(t, target) {
  const x = clamp01(t);
  if (x < 0.5) target.copy(COL_START).lerp(COL_MID, x * 2);
  else target.copy(COL_MID).lerp(COL_END, (x - 0.5) * 2);
  return target;
}

// ---------------- storage ----------------
function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {};
  } catch (e) {
    console.warn('[trails] could not read saved trails', e);
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    return true;
  } catch (e) {
    console.warn('[trails] could not save trails (quota?)', e);
    return false;
  }
}

function pathLength(samples) {
  let len = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i];
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    len += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return len;
}

function pathDuration(samples) {
  if (!samples.length) return 0;
  const t0 = Number(samples[0].t) || 0;
  const t1 = Number(samples[samples.length - 1].t) || 0;
  return Math.max(0, t1 - t0);
}

// ---------------- canvas textures (degrade to null) ----------------
function makeRibbonTexture() {
  try {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    const g = c.getContext('2d');
    if (!g) return null;
    const img = g.createImageData(128, 64);
    for (let y = 0; y < 64; y++) {
      const v = (y + 0.5) / 64;
      const edge = Math.pow(Math.abs(v * 2 - 1), 2.4);           // 0 centre → 1 at the rails
      for (let x = 0; x < 128; x++) {
        const u = (x + 0.5) / 128;
        const scan = 0.92 + 0.08 * Math.sin(u * Math.PI * 2);
        const lum = Math.min(1, (0.3 + 0.7 * edge) * scan);   // translucent fill, bright rails
        const i = (y * 128 + x) * 4;
        const b = Math.round(255 * lum);
        img.data[i] = b; img.data[i + 1] = b; img.data[i + 2] = b; img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 4;
    return tex;
  } catch (e) {
    console.warn('[trails] ribbon texture failed', e);
    return null;
  }
}

function makeGlowTexture() {
  try {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 32;
    const g = c.getContext('2d');
    if (!g) return null;
    const img = g.createImageData(256, 32);
    for (let y = 0; y < 32; y++) {
      const v = (y + 0.5) / 32;
      const edge = Math.pow(Math.abs(v * 2 - 1), 2.0);
      for (let x = 0; x < 256; x++) {
        const u = (x + 0.5) / 256;
        const d = (u - 0.5) / 0.06;
        const band = 0.22 + 0.78 * Math.exp(-d * d);   // constant lift + travelling highlight
        const a = Math.round(255 * clamp01(band * (0.4 + 0.6 * edge)));
        const i = (y * 256 + x) * 4;
        img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255; img.data[i + 3] = a;
      }
    }
    g.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(0.25, 1);         // one travelling pulse every ~48 m
    return tex;
  } catch (e) {
    console.warn('[trails] glow texture failed', e);
    return null;
  }
}

/** Flat chevron arrow pointing along +Z, lying in the XZ plane. */
function chevronGeometry() {
  const geo = new THREE.BufferGeometry();
  const verts = new Float32Array([
    0.00, 0, 0.95,     // tip
    0.62, 0, -0.30,    // right wing
    0.00, 0, 0.05,     // inner notch
    -0.62, 0, -0.30,   // left wing
  ]);
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.computeVertexNormals();
  return geo;
}

// ============================================================
// TrailRibbon — one reusable, incrementally-built ribbon mesh
// ============================================================
class TrailRibbon {
  constructor(capacity) {
    this.cap = capacity;
    this.count = 0;
    this.totalLen = 0;
    this._gradLen = 200;      // gradient reference length while recording
    this._closed = false;     // true once finalised (tail taper applies)
    this._flownTo = -1;
    this._bulk = false;       // suppress per-node uploads during a bulk build

    this.nodeP = new Float32Array(capacity * 3);
    this.nodeU = new Float32Array(capacity * 3);
    this.nodeArc = new Float32Array(capacity);

    this.group = new THREE.Group();
    this.group.name = 'trail-ribbon';
    this.group.visible = false;

    // ---------------- ribbon geometry ----------------
    const geo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(new Float32Array(capacity * 6), 3);
    this.colAttr = new THREE.BufferAttribute(new Float32Array(capacity * 6), 3);
    this.uvAttr = new THREE.BufferAttribute(new Float32Array(capacity * 4), 2);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.colAttr.setUsage(THREE.DynamicDrawUsage);
    this.uvAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.posAttr);
    geo.setAttribute('color', this.colAttr);
    geo.setAttribute('uv', this.uvAttr);

    const idx = new Uint32Array((capacity - 1) * 6);
    for (let i = 0; i < capacity - 1; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      const o = i * 6;
      idx[o] = a; idx[o + 1] = b; idx[o + 2] = c;
      idx[o + 3] = b; idx[o + 4] = d; idx[o + 5] = c;
    }
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.setDrawRange(0, 0);
    this.geo = geo;

    this.ribbonTex = makeRibbonTexture();
    this.glowTex = makeGlowTexture();

    this.baseMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: this.ribbonTex || null,
      vertexColors: true,
      transparent: true,
      opacity: 0.28,           // low-opacity guide — fly through it, not into it
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      toneMapped: false,
    });
    this.glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: this.glowTex || null,
      vertexColors: true,
      transparent: true,
      opacity: this.glowTex ? 0.7 : 0,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

    this.mesh = new THREE.Mesh(geo, this.baseMat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 900;
    this.group.add(this.mesh);

    this.glowMesh = new THREE.Mesh(geo, this.glowMat);
    this.glowMesh.frustumCulled = false;
    this.glowMesh.renderOrder = 901;
    this.group.add(this.glowMesh);

    // ---------------- direction chevrons ----------------
    this.chevGeo = chevronGeometry();
    // NOTE: no vertexColors here — the chevron geometry has no colour
    // attribute; the per-instance colour (instanceColor) does the tinting.
    this.chevMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    this.chevrons = new THREE.InstancedMesh(this.chevGeo, this.chevMat, CHEVRON_CAP);
    this.chevrons.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.chevrons.frustumCulled = false;
    this.chevrons.renderOrder = 902;
    this.chevrons.count = 0;
    this.group.add(this.chevrons);
    this.chevNode = new Int32Array(CHEVRON_CAP);
    this.chevCount = 0;
    this.chevPainted = 0;
    this._nextChevArc = CHEVRON_SPACING * 0.5;

    // ---------------- start / finish markers ----------------
    this.markerGeo = new THREE.TorusGeometry(1.15, 0.055, 8, 32);
    this.markerGeo2 = new THREE.TorusGeometry(1.55, 0.02, 6, 32);
    this.startMat = new THREE.MeshBasicMaterial({
      color: 0x37e08b, transparent: true, opacity: 0.9,
      depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    });
    this.finishMat = new THREE.MeshBasicMaterial({
      color: 0xffc857, transparent: true, opacity: 0.9,
      depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    });
    this.startMarker = this._makeMarker(this.startMat);
    this.finishMarker = this._makeMarker(this.finishMat);
    this.group.add(this.startMarker);
    this.group.add(this.finishMarker);

    // ---------------- scratch ----------------
    this._a = new THREE.Vector3();
    this._b = new THREE.Vector3();
    this._c = new THREE.Vector3();
    this._tan = new THREE.Vector3();
    this._up = new THREE.Vector3();
    this._side = new THREE.Vector3();
    this._nrm = new THREE.Vector3();
    this._col = new THREE.Color();
    this._m4 = new THREE.Matrix4();
    this._lastTan = new THREE.Vector3(0, 0, 1);
  }

  _makeMarker(mat) {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(this.markerGeo, mat);
    ring.renderOrder = 903;
    g.add(ring);
    const halo = new THREE.Mesh(this.markerGeo2, mat);
    halo.renderOrder = 903;
    g.add(halo);
    g.visible = false;
    return g;
  }

  // ---------------- lifecycle ----------------
  reset() {
    this.count = 0;
    this.totalLen = 0;
    this._gradLen = 200;
    this._closed = false;
    this._flownTo = -1;
    this.chevCount = 0;
    this.chevPainted = 0;
    this._nextChevArc = CHEVRON_SPACING * 0.5;
    this.chevrons.count = 0;
    this._lastTan.set(0, 0, 1);
    this.geo.setDrawRange(0, 0);
    this.startMarker.visible = false;
    this.finishMarker.visible = false;
    this.group.visible = false;
  }

  /** Append one node. Returns false when the ribbon is full. */
  push(px, py, pz, ux, uy, uz) {
    if (this.count >= this.cap) return false;
    const i = this.count;
    const o = i * 3;
    this.nodeP[o] = px; this.nodeP[o + 1] = py; this.nodeP[o + 2] = pz;

    let ul = Math.sqrt(ux * ux + uy * uy + uz * uz);
    if (!(ul > 1e-5)) { ux = 0; uy = 1; uz = 0; ul = 1; }
    this.nodeU[o] = ux / ul; this.nodeU[o + 1] = uy / ul; this.nodeU[o + 2] = uz / ul;

    if (i === 0) {
      this.nodeArc[0] = 0;
    } else {
      const dx = px - this.nodeP[o - 3];
      const dy = py - this.nodeP[o - 2];
      const dz = pz - this.nodeP[o - 1];
      this.nodeArc[i] = this.nodeArc[i - 1] + Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    this.totalLen = this.nodeArc[i];
    this.count = i + 1;

    if (i > 0) this._writeNode(i - 1);
    this._writeNode(i);
    this._placeChevrons(i);

    if (this.count >= 2) {
      this.geo.setDrawRange(0, (this.count - 1) * 6);
      this.group.visible = true;
      if (this.count <= 4) this._placeMarker(this.startMarker, 0);
    }
    if (!this._bulk) {
      const v0 = Math.max(0, i - 1) * 2;
      const vN = (i + 1) * 2 - v0;
      markRange(this.posAttr, v0 * 3, vN * 3);
      markRange(this.colAttr, v0 * 3, vN * 3);
      markRange(this.uvAttr, v0 * 2, vN * 2);
    }
    return true;
  }

  /** Close the ribbon: true gradient over its length + tapered tail. */
  finalize() {
    if (this.count < 2) return;
    this._closed = true;
    this._gradLen = Math.max(20, this.totalLen);
    for (let i = 0; i < this.count; i++) this._writeNode(i);
    markFull(this.posAttr);
    markFull(this.colAttr);
    markFull(this.uvAttr);
    this._placeMarker(this.startMarker, 0);
    this._placeMarker(this.finishMarker, this.count - 1);
  }

  /** Build a complete ribbon from a node source in one pass. */
  buildFrom(pushInto) {
    this.reset();
    this._bulk = true;
    try { pushInto(this); } finally { this._bulk = false; }
    this.finalize();
  }

  // ---------------- vertex writing ----------------
  _nodePos(i, out) {
    const o = i * 3;
    return out.set(this.nodeP[o], this.nodeP[o + 1], this.nodeP[o + 2]);
  }

  _writeNode(i) {
    const n = this.count;
    if (i < 0 || i >= n) return;
    const i0 = i > 0 ? i - 1 : i;
    const i1 = i < n - 1 ? i + 1 : i;

    // tangent from a central difference (falls back to the last good one)
    this._nodePos(i0, this._a);
    this._nodePos(i1, this._b);
    this._tan.subVectors(this._b, this._a);
    if (this._tan.lengthSq() < 1e-10) this._tan.copy(this._lastTan);
    else { this._tan.normalize(); this._lastTan.copy(this._tan); }

    // lightly smoothed centreline so hand-flown lines read as curves
    this._nodePos(i, this._c);
    if (i > 0 && i < n - 1) {
      this._c.multiplyScalar(2).add(this._a).add(this._b).multiplyScalar(0.25);
    }

    const uo = i * 3;
    this._up.set(this.nodeU[uo], this.nodeU[uo + 1], this.nodeU[uo + 2]);
    this._side.crossVectors(this._tan, this._up);
    if (this._side.lengthSq() < 1e-8) this._side.crossVectors(this._tan, WORLD_UP);
    if (this._side.lengthSq() < 1e-8) this._side.set(1, 0, 0);
    this._side.normalize();

    const arc = this.nodeArc[i];
    let w = HALF_WIDTH * smoothstep(arc / TAPER_M);
    if (this._closed) w *= smoothstep((this.totalLen - arc) / TAPER_M);
    if (w < 0.04) w = 0.04;

    if (i <= this._flownTo) this._col.copy(COL_FLOWN);
    else gradientAt(arc / this._gradLen, this._col);

    const pa = this.posAttr.array;
    const ca = this.colAttr.array;
    const ua = this.uvAttr.array;
    const v0 = i * 6;
    const sx = this._side.x * w, sy = this._side.y * w, sz = this._side.z * w;
    pa[v0] = this._c.x - sx; pa[v0 + 1] = this._c.y - sy; pa[v0 + 2] = this._c.z - sz;
    pa[v0 + 3] = this._c.x + sx; pa[v0 + 4] = this._c.y + sy; pa[v0 + 5] = this._c.z + sz;
    ca[v0] = this._col.r; ca[v0 + 1] = this._col.g; ca[v0 + 2] = this._col.b;
    ca[v0 + 3] = this._col.r; ca[v0 + 4] = this._col.g; ca[v0 + 5] = this._col.b;
    const t0 = i * 4;
    const u = arc / UV_METERS;
    ua[t0] = u; ua[t0 + 1] = 0;
    ua[t0 + 2] = u; ua[t0 + 3] = 1;
  }

  _writeColor(i) {
    if (i < 0 || i >= this.count) return;
    if (i <= this._flownTo) this._col.copy(COL_FLOWN);
    else gradientAt(this.nodeArc[i] / this._gradLen, this._col);
    const ca = this.colAttr.array;
    const v0 = i * 6;
    ca[v0] = this._col.r; ca[v0 + 1] = this._col.g; ca[v0 + 2] = this._col.b;
    ca[v0 + 3] = this._col.r; ca[v0 + 4] = this._col.g; ca[v0 + 5] = this._col.b;
  }

  /** Dim everything already flown, up to node `idx`. */
  setFlownTo(idx) {
    const target = Math.min(idx, this.count - 1);
    if (target === this._flownTo) return;
    const rewound = target < this._flownTo;
    if (rewound) {                          // rerun — repaint everything
      this._flownTo = target;
      for (let i = 0; i < this.count; i++) this._writeColor(i);
      markFull(this.colAttr);
    } else {
      const from = this._flownTo + 1;
      this._flownTo = target;
      for (let i = from; i <= target; i++) this._writeColor(i);
      markRange(this.colAttr, from * 6, (target - from + 1) * 6);
    }
    this._paintChevrons(rewound);
  }

  // ---------------- chevrons / markers ----------------
  _placeChevrons(i) {
    if (this.count < 2) return;
    if (this.chevCount >= CHEVRON_CAP) return;
    if (this.nodeArc[i] < this._nextChevArc) return;
    this._chevronAt(this.chevCount, i);
    this.chevNode[this.chevCount] = i;
    this.chevCount++;
    // measure the next gap from where this one actually landed
    this._nextChevArc = this.nodeArc[i] + CHEVRON_SPACING;
    this.chevrons.count = this.chevCount;
    this.chevrons.instanceMatrix.needsUpdate = true;
  }

  _chevronAt(slot, i) {
    const n = this.count;
    const i0 = i > 0 ? i - 1 : i;
    const i1 = i < n - 1 ? i + 1 : i;
    this._nodePos(i0, this._a);
    this._nodePos(i1, this._b);
    this._tan.subVectors(this._b, this._a);
    if (this._tan.lengthSq() < 1e-10) this._tan.copy(this._lastTan); else this._tan.normalize();
    const uo = i * 3;
    this._up.set(this.nodeU[uo], this.nodeU[uo + 1], this.nodeU[uo + 2]);
    this._side.crossVectors(this._tan, this._up);
    if (this._side.lengthSq() < 1e-8) this._side.crossVectors(this._tan, WORLD_UP);
    if (this._side.lengthSq() < 1e-8) this._side.set(1, 0, 0);
    this._side.normalize();
    this._nrm.crossVectors(this._side, this._tan).normalize();
    this._nodePos(i, this._c).addScaledVector(this._nrm, 0.05);
    this._m4.makeBasis(this._side, this._nrm, this._tan);
    this._m4.setPosition(this._c);
    this.chevrons.setMatrixAt(slot, this._m4);
    this.chevrons.setColorAt(slot, i <= this._flownTo ? COL_FLOWN : COL_START);
    if (this.chevrons.instanceColor) this.chevrons.instanceColor.needsUpdate = true;
  }

  _paintChevrons(rewound) {
    let dirty = false;
    if (rewound) {
      for (let s = 0; s < this.chevCount; s++) {
        this.chevrons.setColorAt(s, this.chevNode[s] <= this._flownTo ? COL_FLOWN : COL_START);
      }
      this.chevPainted = 0;
      while (this.chevPainted < this.chevCount && this.chevNode[this.chevPainted] <= this._flownTo) this.chevPainted++;
      dirty = this.chevCount > 0;
    } else {
      while (this.chevPainted < this.chevCount && this.chevNode[this.chevPainted] <= this._flownTo) {
        this.chevrons.setColorAt(this.chevPainted, COL_FLOWN);
        this.chevPainted++;
        dirty = true;
      }
    }
    if (dirty && this.chevrons.instanceColor) this.chevrons.instanceColor.needsUpdate = true;
  }

  _placeMarker(marker, i) {
    if (i < 0 || i >= this.count) { marker.visible = false; return; }
    const n = this.count;
    const i0 = i > 0 ? i - 1 : i;
    const i1 = i < n - 1 ? i + 1 : i;
    this._nodePos(i0, this._a);
    this._nodePos(i1, this._b);
    this._tan.subVectors(this._b, this._a);
    if (this._tan.lengthSq() < 1e-10) this._tan.set(0, 0, 1); else this._tan.normalize();
    this._nodePos(i, this._c);
    marker.position.copy(this._c);
    marker.quaternion.setFromUnitVectors(Z_AXIS, this._tan);
    marker.visible = true;
  }

  // ---------------- per-frame animation (no allocations) ----------------
  update(dt, time) {
    if (!this.group.visible) return;
    if (this.ribbonTex) {
      this.ribbonTex.offset.x = (this.ribbonTex.offset.x - dt * 0.05) % 1;
    }
    if (this.glowTex) {
      this.glowTex.offset.x = (this.glowTex.offset.x - dt * 0.09) % 1;
    }
    this.chevMat.opacity = 0.52 + 0.18 * Math.sin(time * 2.4);
    const pulse = 1 + 0.05 * Math.sin(time * 2.2);
    if (this.startMarker.visible) this.startMarker.scale.setScalar(pulse);
    if (this.finishMarker.visible) this.finishMarker.scale.setScalar(2 - pulse);
    this.startMat.opacity = 0.72 + 0.22 * Math.sin(time * 2.2);
    this.finishMat.opacity = 0.72 + 0.22 * Math.sin(time * 2.2 + 1.6);
  }

  dispose() {
    this.geo.dispose();
    this.chevGeo.dispose();
    this.markerGeo.dispose();
    this.markerGeo2.dispose();
    this.baseMat.dispose();
    this.glowMat.dispose();
    this.chevMat.dispose();
    this.startMat.dispose();
    this.finishMat.dispose();
    this.ribbonTex?.dispose?.();
    this.glowTex?.dispose?.();
    this.chevrons.dispose?.();
  }
}

// ============================================================
// TrailSystem
// ============================================================
export class TrailSystem {
  constructor(scene) {
    this.scene = scene || null;
    this.mapName = 'unknown';

    this._ribbon = new TrailRibbon(RIBBON_CAP);
    if (this.scene && this.scene.add) this.scene.add(this._ribbon.group);

    // recording state
    this._recording = false;
    this._samples = [];
    this._sampleClock = 0;
    this._recTime = 0;
    this._lastKept = new THREE.Vector3();
    this._hasKept = false;
    this._fullWarned = false;
    this._armWarned = false;

    // library state
    this._saved = [];            // records for the current map
    this._premade = [];          // premade descriptors for the current map
    this._pending = null;        // { samples, lengthM, durationS }
    this._active = null;         // { id, name, premade }

    // follow state
    this._followIdx = 0;
    this._runTime = 0;
    this._runLive = false;
    this._completed = false;
    this._lastPct = -1;
    this._objClock = 0;
    this._reacqClock = 0;
    this._time = 0;

    // scratch
    this._v = new THREE.Vector3();
    this._v2 = new THREE.Vector3();
    this._up = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._spawn = { position: new THREE.Vector3(), yawRad: 0 };

    this._offs = [
      on(TRAIL_EVENTS.RECORD_TOGGLE, () => this.toggleRecording()),
      on(TRAIL_EVENTS.SAVE, (d) => this._onSave(d)),
      on(TRAIL_EVENTS.DELETE, (d) => this._onDelete(d)),
      on(TRAIL_EVENTS.FLY, (d) => this._onFly(d)),
      on(TRAIL_EVENTS.HIDE, () => this._onHide()),
      on(TRAIL_EVENTS.LIST, () => this._emitList()),
    ];
  }

  // ------------------------------------------------------------
  // public API
  // ------------------------------------------------------------
  get isRecording() { return this._recording; }

  get activeTrail() { return this._active; }

  /** Called after every map load. */
  setMap(mapName) {
    this.mapName = String(mapName || 'unknown');
    this._recording = false;
    this._samples = [];
    this._hasKept = false;
    this._pending = null;
    this._active = null;
    this._resetFollow();
    this._ribbon.reset();
    this._clearObjective();

    const store = loadStore();
    const list = store[this.mapName];
    this._saved = Array.isArray(list) ? list.filter((t) => t && Array.isArray(t.samples) && t.samples.length > 1) : [];
    this._premade = PREMADE[this.mapName] || [];
    this._emitList();
  }

  /** Every frame, from the game loop. `crashed` is optional. */
  update(dt, position, quaternion, armed, crashed = false) {
    const step = Number.isFinite(dt) ? Math.min(Math.max(dt, 0), 0.1) : 0;
    this._time += step;
    this._ribbon.update(step, this._time);
    if (!position) return;

    if (this._recording) this._record(step, position, quaternion, armed, crashed);
    else if (this._active) this._follow(step, position, armed);
  }

  startRecording() {
    if (this._recording) return;
    this._active = null;
    this._pending = null;
    this._resetFollow();
    this._clearObjective();
    this._samples = [];
    this._sampleClock = 0;
    this._recTime = 0;
    this._hasKept = false;
    this._fullWarned = false;
    this._armWarned = false;
    this._ribbon.reset();
    this._recording = true;
    emit(TRAIL_EVENTS.FLASH, { text: 'RECORDING — FLY YOUR LINE', ms: 2200 });
    this._emitList();
  }

  stopRecording() {
    if (!this._recording) return;
    this._recording = false;
    const samples = this._samples;
    if (samples.length < 8) {
      this._samples = [];
      this._pending = null;
      this._ribbon.reset();
      emit(TRAIL_EVENTS.FLASH, { text: 'TRAIL TOO SHORT — ARM AND FLY WHILE RECORDING', ms: 3000 });
    } else {
      this._ribbon.finalize();
      const lengthM = pathLength(samples);
      const durationS = pathDuration(samples);
      this._pending = { samples, lengthM, durationS };
      emit(TRAIL_EVENTS.FLASH, {
        text: `LINE CAPTURED — ${Math.round(lengthM)} m / ${fmtClock(durationS)} — NAME IT IN ESC → TRAILS`,
        ms: 4200,
      });
    }
    this._emitList();
  }

  toggleRecording() {
    if (this._recording) this.stopRecording(); else this.startRecording();
  }

  /** main.js: respawn at the active trail's start instead of the map spawn. */
  getSpawnOverride() {
    const rb = this._ribbon;
    if (!this._active || rb.count < 2) return null;
    this._spawn.position.set(rb.nodeP[0], rb.nodeP[1] + 0.25, rb.nodeP[2]);
    this._v.set(rb.nodeP[3] - rb.nodeP[0], 0, rb.nodeP[5] - rb.nodeP[2]);
    // look a few nodes ahead so a near-static start still yields a heading
    for (let i = 2; i < Math.min(rb.count, 12) && this._v.lengthSq() < 1e-4; i++) {
      this._v.set(rb.nodeP[i * 3] - rb.nodeP[0], 0, rb.nodeP[i * 3 + 2] - rb.nodeP[2]);
    }
    this._spawn.yawRad = this._v.lengthSq() > 1e-6 ? Math.atan2(-this._v.x, -this._v.z) : 0;
    return this._spawn;
  }

  dispose() {
    for (const off of this._offs) { try { off(); } catch (e) { /* noop */ } }
    this._offs.length = 0;
    if (this.scene && this.scene.remove) this.scene.remove(this._ribbon.group);
    this._ribbon.dispose();
    this._samples = [];
    this._pending = null;
    this._active = null;
  }

  // ------------------------------------------------------------
  // recording
  // ------------------------------------------------------------
  _record(dt, position, quaternion, armed, crashed) {
    this._recTime += dt;
    if (!armed || crashed) {
      if (!this._armWarned && this._recTime > 3 && !this._hasKept) {
        this._armWarned = true;
        emit(TRAIL_EVENTS.FLASH, { text: 'RECORDING — ARM THE DRONE TO START THE LINE', ms: 2600 });
      }
      return;
    }
    this._sampleClock += dt;
    if (this._sampleClock < SAMPLE_DT) return;
    this._sampleClock = this._sampleClock > SAMPLE_DT * 4 ? 0 : this._sampleClock - SAMPLE_DT;

    if (this._samples.length >= MAX_SAMPLES) {
      if (!this._fullWarned) {
        this._fullWarned = true;
        emit(TRAIL_EVENTS.FLASH, { text: 'TRAIL BUFFER FULL — STOP RECORDING TO SAVE', ms: 4000 });
      }
      return;
    }
    if (this._hasKept && this._lastKept.distanceToSquared(position) < MIN_STEP * MIN_STEP) return;

    if (quaternion) this._q.copy(quaternion); else this._q.identity();
    this._samples.push({
      x: position.x, y: position.y, z: position.z,
      qx: this._q.x, qy: this._q.y, qz: this._q.z, qw: this._q.w,
      t: this._recTime,
    });
    this._lastKept.copy(position);
    this._hasKept = true;

    this._up.set(0, 1, 0).applyQuaternion(this._q);
    if (!Number.isFinite(this._up.x)) this._up.set(0, 1, 0);
    this._up.lerp(WORLD_UP, 1 - UP_BLEND);
    this._ribbon.push(position.x, position.y, position.z, this._up.x, this._up.y, this._up.z);
  }

  // ------------------------------------------------------------
  // follow mode
  // ------------------------------------------------------------
  _resetFollow() {
    this._followIdx = 0;
    this._runTime = 0;
    this._runLive = false;
    this._completed = false;
    this._lastPct = -1;
    this._objClock = 0;
    this._reacqClock = 0;
  }

  _nodeDist2(i, p) {
    const o = i * 3;
    const dx = this._ribbon.nodeP[o] - p.x;
    const dy = this._ribbon.nodeP[o + 1] - p.y;
    const dz = this._ribbon.nodeP[o + 2] - p.z;
    return dx * dx + dy * dy + dz * dz;
  }

  _follow(dt, position, armed) {
    const rb = this._ribbon;
    const n = rb.count;
    if (n < 2) return;

    // nearest node in a moving window (O(1) amortised)
    let best = this._followIdx;
    let bestD2 = this._nodeDist2(best, position);
    const lo = Math.max(0, this._followIdx - 12);
    const hi = Math.min(n - 1, this._followIdx + 60);
    for (let i = lo; i <= hi; i++) {
      const d2 = this._nodeDist2(i, position);
      if (d2 < bestD2) { bestD2 = d2; best = i; }
    }
    // lost the line (respawn, shortcut…): coarse global re-acquire at ≤2 Hz
    this._reacqClock += dt;
    if (bestD2 > REACQUIRE_D2 && this._reacqClock > 0.5) {
      this._reacqClock = 0;
      for (let i = 0; i < n; i += 8) {
        const d2 = this._nodeDist2(i, position);
        if (d2 < bestD2) { bestD2 = d2; best = i; }
      }
    }
    this._followIdx = best;

    const total = rb.totalLen || 1;
    const progress = clamp01(rb.nodeArc[best] / total);
    rb.setFlownTo(best);

    // rerun: back at the start after finishing → repaint and re-arm the clock
    if (this._completed && this._nodeDist2(0, position) < FINISH_RADIUS * FINISH_RADIUS) {
      this._completed = false;
      this._runTime = 0;
      this._runLive = false;
      this._lastPct = -1;
      this._followIdx = 0;
      rb.setFlownTo(-1);
      emit(TRAIL_EVENTS.FLASH, { text: 'TRAIL RESET — GO AGAIN', ms: 1400 });
      return;
    }

    if (!this._completed) {
      if (!this._runLive && armed && (progress > 0.01 || this._nodeDist2(0, position) > 4)) this._runLive = true;
      if (this._runLive && armed) this._runTime += dt;

      const endD2 = this._nodeDist2(n - 1, position);
      if (best >= n - 3 && endD2 < FINISH_RADIUS * FINISH_RADIUS && progress > 0.75) {
        this._completed = true;
        this._runLive = false;
        emit(TRAIL_EVENTS.FLASH, { text: `TRAIL COMPLETE — ${fmtClock(this._runTime)}`, ms: 5000 });
        this._setObjective(`TRAIL: ${this._active.name.toUpperCase()} — COMPLETE ${fmtClock(this._runTime)}`);
        this._lastPct = 100;
        return;
      }
    }

    this._objClock += dt;
    const pct = Math.round(progress * 100);
    if (!this._completed && pct !== this._lastPct && this._objClock > 0.2) {
      this._objClock = 0;
      this._lastPct = pct;
      this._setObjective(`TRAIL: ${this._active.name.toUpperCase()} — ${pct}%`);
    }
  }

  _setObjective(text) {
    // don't fight racing / retrieval for the objective line
    if (settings && settings.gameMode && settings.gameMode !== 'freestyle') return;
    emit(TRAIL_EVENTS.OBJECTIVE, { text });
  }

  _clearObjective() {
    if (settings && settings.gameMode && settings.gameMode !== 'freestyle') return;
    emit(TRAIL_EVENTS.OBJECTIVE, { text: '' });
  }

  // ------------------------------------------------------------
  // library
  // ------------------------------------------------------------
  _findRecord(id) {
    return this._saved.find((t) => t && t.id === id) || null;
  }

  _findPremade(id) {
    return this._premade.find((t) => t && t.id === id) || null;
  }

  _onSave(detail) {
    if (this._recording) this.stopRecording();
    if (!this._pending) {
      emit(TRAIL_EVENTS.FLASH, { text: 'NOTHING TO SAVE — RECORD A LINE FIRST', ms: 2600 });
      return;
    }
    let name = String((detail && detail.name) || '').trim().slice(0, 48);
    if (!name) name = `Trail ${this._saved.length + 1}`;

    const record = {
      id: newId(),
      name,
      createdAt: Date.now(),
      samples: this._pending.samples.map((s) => ({
        x: r2(s.x), y: r2(s.y), z: r2(s.z),
        qx: r3(s.qx), qy: r3(s.qy), qz: r3(s.qz), qw: r3(s.qw),
        t: r2(s.t),
      })),
    };

    const store = loadStore();
    const list = Array.isArray(store[this.mapName]) ? store[this.mapName] : [];
    list.push(record);
    store[this.mapName] = list;
    if (!writeStore(store)) {
      emit(TRAIL_EVENTS.FLASH, { text: 'TRAIL SAVE FAILED — BROWSER STORAGE FULL', ms: 4000 });
      return;
    }
    this._saved = list;
    this._pending = null;
    // keep the ribbon on screen and start following what was just saved
    this._active = { id: record.id, name: record.name, premade: false };
    this._resetFollow();
    emit(TRAIL_EVENTS.FLASH, { text: `TRAIL SAVED — ${name.toUpperCase()}`, ms: 2400 });
    this._emitList();
  }

  _onDelete(detail) {
    const id = detail && detail.id;
    if (!id) return;
    if (this._findPremade(id)) {
      emit(TRAIL_EVENTS.FLASH, { text: 'PREMADE TRAILS CANNOT BE DELETED', ms: 2200 });
      return;
    }
    const store = loadStore();
    const list = Array.isArray(store[this.mapName]) ? store[this.mapName] : [];
    const next = list.filter((t) => !t || t.id !== id);
    if (next.length === list.length) { this._emitList(); return; }
    store[this.mapName] = next;
    if (!writeStore(store)) {
      emit(TRAIL_EVENTS.FLASH, { text: 'TRAIL DELETE FAILED — STORAGE ERROR', ms: 3000 });
      return;
    }
    this._saved = next;
    if (this._active && this._active.id === id) this._onHide(true);
    emit(TRAIL_EVENTS.FLASH, { text: 'TRAIL DELETED', ms: 1600 });
    this._emitList();
  }

  _onFly(detail) {
    const id = detail && detail.id;
    if (!id) return;
    if (this._recording) this.stopRecording();

    const premade = this._findPremade(id);
    const record = premade ? null : this._findRecord(id);
    if (!premade && !record) {
      emit(TRAIL_EVENTS.FLASH, { text: 'TRAIL NOT FOUND ON THIS MAP', ms: 2400 });
      this._emitList();
      return;
    }

    let ok = false;
    try {
      ok = premade ? this._buildPremade(premade) : this._buildFromSamples(record.samples);
    } catch (e) {
      console.warn('[trails] could not build trail ribbon', e);
      ok = false;
    }
    if (!ok) {
      this._ribbon.reset();
      this._active = null;
      emit(TRAIL_EVENTS.FLASH, { text: 'TRAIL DATA UNREADABLE', ms: 2400 });
      this._emitList();
      return;
    }

    const name = premade ? premade.name : record.name;
    this._pending = null;
    this._active = { id, name, premade: !!premade };
    this._resetFollow();
    emit(TRAIL_EVENTS.FLASH, { text: `TRAIL: ${String(name).toUpperCase()} — FOLLOW THE LINE`, ms: 3200 });
    this._setObjective(`TRAIL: ${String(name).toUpperCase()} — 0%`);
    emit(TRAIL_EVENTS.SIM_RESET);           // main.js respawns via getSpawnOverride()
    this._emitList();
  }

  _onHide(quiet = false) {
    this._active = null;
    this._pending = null;
    if (this._recording) this.stopRecording();
    this._resetFollow();
    this._ribbon.reset();
    this._clearObjective();
    if (!quiet) emit(TRAIL_EVENTS.FLASH, { text: 'TRAIL HIDDEN', ms: 1400 });
    this._emitList();
  }

  // ---------------- ribbon builders ----------------
  _buildFromSamples(samples) {
    if (!Array.isArray(samples) || samples.length < 2) return false;
    const q = this._q;
    const up = this._up;
    const rb = this._ribbon;
    rb.buildFrom((ribbon) => {
      for (let i = 0; i < samples.length && i < RIBBON_CAP; i++) {
        const s = samples[i];
        if (!s || !Number.isFinite(s.x) || !Number.isFinite(s.y) || !Number.isFinite(s.z)) continue;
        q.set(Number(s.qx) || 0, Number(s.qy) || 0, Number(s.qz) || 0,
          Number.isFinite(s.qw) ? Number(s.qw) : 1);
        if (q.lengthSq() < 1e-6) q.identity(); else q.normalize();
        up.set(0, 1, 0).applyQuaternion(q).lerp(WORLD_UP, 1 - UP_BLEND);
        ribbon.push(s.x, s.y, s.z, up.x, up.y, up.z);
      }
    });
    return rb.count >= 2;
  }

  _buildPremade(def) {
    const pts = Array.isArray(def.points) ? def.points : null;
    if (!pts || pts.length < 3) return false;
    const vecs = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(vecs, false, 'catmullrom', 0.5);
    const len = curve.getLength();
    const spacing = Number(def.spacing) > 0 ? Number(def.spacing) : 1.4;
    const steps = Math.max(24, Math.min(RIBBON_CAP - 2, Math.round(len / spacing)));
    const path = curve.getSpacedPoints(steps);
    if (!path || path.length < 3) return false;

    // synthetic bank: roll the ribbon into the turns like a real drone would
    const n = path.length;
    const banks = new Float32Array(n);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    for (let i = 1; i < n - 1; i++) {
      a.subVectors(path[i], path[i - 1]);
      b.subVectors(path[i + 1], path[i]);
      a.y = 0; b.y = 0;
      if (a.lengthSq() < 1e-8 || b.lengthSq() < 1e-8) continue;
      a.normalize(); b.normalize();
      c.crossVectors(a, b);
      const turn = Math.atan2(c.dot(WORLD_UP), a.dot(b));   // + = turning left
      banks[i] = Math.max(-0.55, Math.min(0.55, -turn * 7));
    }
    // smooth the bank so the ribbon doesn't kink
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 1; i < n - 1; i++) banks[i] = (banks[i - 1] + 2 * banks[i] + banks[i + 1]) * 0.25;
    }

    const tan = new THREE.Vector3();
    const up = new THREE.Vector3();
    const rb = this._ribbon;
    rb.buildFrom((ribbon) => {
      for (let i = 0; i < n; i++) {
        const p0 = path[i > 0 ? i - 1 : i];
        const p1 = path[i < n - 1 ? i + 1 : i];
        tan.subVectors(p1, p0);
        if (tan.lengthSq() < 1e-10) tan.set(0, 0, 1); else tan.normalize();
        up.copy(WORLD_UP).applyAxisAngle(tan, banks[i]);
        ribbon.push(path[i].x, path[i].y, path[i].z, up.x, up.y, up.z);
      }
    });
    return rb.count >= 2;
  }

  // ---------------- list payload ----------------
  _emitList() {
    const trails = [];
    for (const p of this._premade) {
      trails.push({
        id: p.id,
        name: p.name,
        blurb: p.blurb || '',
        premade: true,
        createdAt: 0,
        samples: 0,
        lengthM: 0,
        durationS: 0,
        active: !!(this._active && this._active.id === p.id),
      });
    }
    for (const t of this._saved) {
      trails.push({
        id: t.id,
        name: t.name || 'Untitled',
        blurb: '',
        premade: false,
        createdAt: Number(t.createdAt) || 0,
        samples: t.samples.length,
        lengthM: pathLength(t.samples),
        durationS: pathDuration(t.samples),
        active: !!(this._active && this._active.id === t.id),
      });
    }
    emit(TRAIL_EVENTS.LIST_RESULT, {
      map: this.mapName,
      recording: this._recording,
      activeId: this._active ? this._active.id : null,
      pending: this._pending
        ? { lengthM: this._pending.lengthM, durationS: this._pending.durationS, samples: this._pending.samples.length }
        : null,
      trails,
    });
  }
}
