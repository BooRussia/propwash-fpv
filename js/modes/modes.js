// ============================================================
// PropWash FPV — game modes: freestyle / racing / retrieval / follow
//
// Consumed by main.js as:
//   const modeManager = new ModeManager(scene);
//   modeManager.start(settings.gameMode, mapHandle);
//   modeManager.update(dt, quad);
//   modeManager.dispose();
//
// Communicates ONLY via the bus:
//   emit('mode:objective', { text })  — persistent OSD line
//   emit('osd:flash', { text, ms })   — momentary messages
//   emit('quad:carry', { massKg })    — payload pickup / drop
// ============================================================
import * as THREE from 'three';
import { emit, clamp } from '../core/state.js';
import { createFollowMode } from '../world/miami/follow.js';

// ---------------- shared scratch (no per-frame allocations) ----------------
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();

const TWO_PI = Math.PI * 2;

// ---------------- small helpers ----------------

// Accepts THREE.Vector3, {x,y,z}, {position:...} or [x,y,z]; writes into `out`.
function toVec3(p, out) {
  if (!p) return out.set(0, 0, 0);
  if (p.isVector3) return out.copy(p);
  if (p.position) return toVec3(p.position, out);
  if (Array.isArray(p)) return out.set(p[0] || 0, p[1] || 0, p[2] || 0);
  if (typeof p.x === 'number') return out.set(p.x, p.y || 0, p.z || 0);
  return out.set(0, 0, 0);
}

// mm:ss.cc (dec=2) or mm:ss.c (dec=1); rounding-safe (never renders 60.00s).
function fmtTime(seconds, dec = 2) {
  let s = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const scale = dec === 1 ? 10 : 100;
  let units = Math.round(s * scale);
  const perMin = 60 * scale;
  const m = Math.floor(units / perMin);
  units -= m * perMin;
  const secStr = (units / scale).toFixed(dec);
  return String(m).padStart(2, '0') + ':' + (units < 10 * scale ? '0' : '') + secStr;
}

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Floating gate-number sprite (canvas-backed). Caller owns disposal.
function makeNumberSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  ctx.font = '800 84px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(41, 211, 255, 0.95)';
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 64, 70);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.renderOrder = 6;
  return { sprite, tex, mat };
}

// Vertical gradient (bright at beam base, fading with height).
function makeBeamTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 4; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 128); // canvas top == beam top
  grad.addColorStop(0.0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.30)');
  grad.addColorStop(1.0, 'rgba(255,255,255,1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// ============================================================
// FREESTYLE — free flight + trick detection.
// Integrates body-frame rotation (x=pitch, y=yaw, z=roll for a
// -Z-forward three.js body). Accumulators reset when the quad
// is crashed or near-still (|ω| < 1 rad/s) for 300 ms.
// ============================================================
class FreestyleMode {
  constructor() {
    this.rollAcc = 0;   // rad, signed (about body z)
    this.pitchAcc = 0;  // rad, signed (about body x)
    this.yawAcc = 0;    // rad, signed (about body y)
    this.tumbleAcc = 0; // rad, |roll+pitch| combined magnitude
    this.yawTime = 0;   // seconds spent building the current yaw accumulation
    this.idleTime = 0;
    this.cooldown = 0;  // seconds until next trick flash allowed
    emit('mode:objective', { text: 'FREESTYLE — FLY FREE' });
  }

  _reset() {
    this.rollAcc = 0;
    this.pitchAcc = 0;
    this.yawAcc = 0;
    this.tumbleAcc = 0;
    this.yawTime = 0;
  }

  _trick(text) {
    emit('osd:flash', { text, ms: 1100 });
    this.cooldown = 0.8;
  }

  update(dt, quad) {
    if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - dt);
    const av = quad.angularVelocity;
    if (!av || quad.crashed) { this._reset(); this.idleTime = 0; return; }

    const w = av.length();
    if (w < 1) {
      this.idleTime += dt;
      if (this.idleTime >= 0.3) { this._reset(); return; }
    } else {
      this.idleTime = 0;
    }

    this.rollAcc += av.z * dt;
    this.pitchAcc += av.x * dt;
    this.yawAcc += av.y * dt;
    this.tumbleAcc += Math.hypot(av.x, av.z) * dt;
    if (Math.abs(this.yawAcc) > 0.15) this.yawTime += dt;

    if (this.cooldown > 0) return;

    // TUMBLE: > 720° of combined roll+pitch with BOTH axes genuinely
    // involved (so a clean double roll stays a double roll).
    if (this.tumbleAcc >= 2 * TWO_PI && Math.abs(this.rollAcc) > 2.4 && Math.abs(this.pitchAcc) > 2.4) {
      this._trick('TUMBLE!');
      this.tumbleAcc = 0;
      this.rollAcc = 0;
      this.pitchAcc = 0;
    } else if (Math.abs(this.rollAcc) >= TWO_PI) {
      this._trick('ROLL!');
      this.rollAcc -= Math.sign(this.rollAcc) * TWO_PI;
      this.tumbleAcc = Math.max(0, this.tumbleAcc - TWO_PI);
    } else if (Math.abs(this.pitchAcc) >= TWO_PI) {
      this._trick('FLIP!');
      this.pitchAcc -= Math.sign(this.pitchAcc) * TWO_PI;
      this.tumbleAcc = Math.max(0, this.tumbleAcc - TWO_PI);
    } else if (Math.abs(this.yawAcc) >= TWO_PI) {
      if (this.yawTime < 1.0) this._trick('YAW SPIN!');
      this.yawAcc = 0;
      this.yawTime = 0;
    }
  }

  dispose() { /* no scene objects */ }
}

// ============================================================
// RACING — glowing gate course, 3 laps, plane-crossing detection.
// ============================================================
class RacingMode {
  constructor(scene, map) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'pw-mode-racing';

    const src = (map && Array.isArray(map.gates)) ? map.gates : [];
    this.bestKey = 'propwash-best-' + ((map && map.name) || 'map') + src.length;

    // shared geometry + 3 shared state materials across all gates
    this.torusGeo = new THREE.TorusGeometry(1, 0.11, 12, 64);
    this.matCurrent = new THREE.MeshStandardMaterial({
      color: 0x06262e, emissive: 0x29d3ff, emissiveIntensity: 3.0, roughness: 0.4, metalness: 0.1,
    });
    this.matNext = new THREE.MeshStandardMaterial({
      color: 0x14181d, emissive: 0xdfeaf2, emissiveIntensity: 0.9, roughness: 0.5, metalness: 0.1,
    });
    this.matFaint = new THREE.MeshStandardMaterial({
      color: 0x0a0e13, emissive: 0x8fa3b5, emissiveIntensity: 0.55, roughness: 0.6, metalness: 0.1,
    });

    this.gates = [];
    for (let i = 0; i < src.length; i++) {
      const g = src[i];
      const center = toVec3(g.position, new THREE.Vector3());
      const yaw = typeof g.yawRad === 'number' ? g.yawRad : 0;
      const radius = (typeof g.radius === 'number' && g.radius > 0.2) ? g.radius : 2.5;
      const normal = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)); // +Z rotated by yaw

      const mesh = new THREE.Mesh(this.torusGeo, this.matFaint);
      mesh.position.copy(center);
      mesh.rotation.y = yaw;
      mesh.scale.setScalar(radius);
      this.group.add(mesh);

      const label = makeNumberSprite(String(i + 1));
      const s = clamp(radius * 0.8, 1.2, 3.5);
      label.sprite.scale.set(s, s, 1);
      label.sprite.position.set(center.x, center.y + radius + s * 0.55 + 0.2, center.z);
      this.group.add(label.sprite);

      this.gates.push({ center, normal, radius, mesh, sMat: label.mat, sTex: label.tex });
    }
    scene.add(this.group);

    // race state
    this.lap = 1;
    this.gateIdx = 0;         // index of the CURRENT target gate
    this.started = false;     // clock starts on first gate-1 crossing
    this.finished = false;
    this.raceTime = 0;
    this.lapStartT = 0;
    this.lapTimes = [];
    this.t = 0;

    this.prev = new THREE.Vector3();
    this.prevValid = false;

    this._lastObj = null;
    this._objClock = 1;

    if (!this.gates.length) {
      this._forceObjective('NO GATES ON THIS MAP — FLY FREE');
    } else {
      this._applyGateStyles();
      emit('osd:flash', { text: `RACING — ${this.gates.length} GATES × 3 LAPS`, ms: 2200 });
      this._forceObjective(this._raceLine());
    }
  }

  _raceLine() {
    return `GATE ${this.gateIdx + 1}/${this.gates.length}  LAP ${this.lap}/3  ${fmtTime(this.raceTime, 1)}`;
  }

  _forceObjective(text) {
    this._lastObj = text;
    this._objClock = 0;
    emit('mode:objective', { text });
  }

  _applyGateStyles() {
    const n = this.gates.length;
    for (let i = 0; i < n; i++) {
      const g = this.gates[i];
      g.mesh.scale.setScalar(g.radius); // clear any pulse
      if (this.finished) {
        g.mesh.material = this.matFaint;
        g.sMat.opacity = 0.4;
      } else if (i === this.gateIdx) {
        g.mesh.material = this.matCurrent;
        g.sMat.opacity = 1.0;
      } else if (i === (this.gateIdx + 1) % n) {
        g.mesh.material = this.matNext;
        g.sMat.opacity = 0.75;
      } else {
        g.mesh.material = this.matFaint;
        g.sMat.opacity = 0.35;
      }
    }
  }

  _loadBest() {
    try {
      const raw = localStorage.getItem(this.bestKey);
      if (raw != null) {
        const v = parseFloat(raw);
        if (Number.isFinite(v) && v > 0) return v;
      }
    } catch (e) { /* storage unavailable */ }
    return null;
  }

  _saveBest(v) {
    try { localStorage.setItem(this.bestKey, String(v)); } catch (e) { /* storage unavailable */ }
  }

  _gatePassed() {
    if (!this.started) {
      // first crossing of gate 1 starts the clock and counts as gate 1
      this.started = true;
      this.raceTime = 0;
      this.lapStartT = 0;
      this.gateIdx = 1 % this.gates.length;
      emit('osd:flash', { text: 'GO!', ms: 800 });
      this._applyGateStyles();
      this._forceObjective(this._raceLine());
      return;
    }

    this.gateIdx++;
    if (this.gateIdx >= this.gates.length) {
      // lap complete (sequence is gate 1..N, then lap)
      const lapTime = this.raceTime - this.lapStartT;
      this.lapTimes.push(lapTime);
      if (this.lap >= 3) {
        this._finishRace();
        return;
      }
      emit('osd:flash', { text: `LAP ${this.lap} — ${fmtTime(lapTime)}`, ms: 2500 });
      this.lap++;
      this.lapStartT = this.raceTime;
      this.gateIdx = 0;
    }
    this._applyGateStyles();
    this._forceObjective(this._raceLine());
  }

  _finishRace() {
    this.finished = true;
    const total = this.raceTime;
    let best = this._loadBest();
    if (best == null || total < best) {
      best = total;
      this._saveBest(total);
    }
    emit('osd:flash', { text: `RACE COMPLETE ${fmtTime(total)} (BEST ${fmtTime(best)})`, ms: 6000 });
    const laps = this.lapTimes.map((lt, i) => `L${i + 1} ${fmtTime(lt, 1)}`).join('  ');
    this._forceObjective(`RACE COMPLETE ${fmtTime(total)}  ${laps}  BEST ${fmtTime(best)} — ESC > Restart mode to race again`);
    this._applyGateStyles();
  }

  update(dt, quad) {
    if (!this.gates.length) return;
    this.t += dt;
    this._objClock += dt;
    if (this.finished) return;

    if (this.started) this.raceTime += dt;

    const pos = quad.position;
    if (this.prevValid) {
      // teleport guard: a respawn/reset must never register as a gate pass
      const segLen = _vA.copy(pos).sub(this.prev).length();
      const maxSeg = 3 + quad.velocity.length() * dt * 4;
      if (segLen <= maxSeg && segLen > 1e-9) {
        const g = this.gates[this.gateIdx];
        const prevS = _vA.copy(this.prev).sub(g.center).dot(g.normal);
        const curS = _vB.copy(pos).sub(g.center).dot(g.normal);
        // segment crosses the gate plane (sign flip) — tunnel-proof at any speed
        if ((prevS <= 0 && curS > 0) || (prevS >= 0 && curS < 0)) {
          const denom = prevS - curS;
          const tHit = Math.abs(denom) > 1e-9 ? prevS / denom : 0;
          _vC.copy(pos).sub(this.prev).multiplyScalar(tHit).add(this.prev);
          if (_vC.distanceTo(g.center) <= g.radius) this._gatePassed();
        }
      }
    }
    this.prev.copy(pos);
    this.prevValid = true;
    if (this.finished) return;

    // current gate pulses (scale + emissive)
    const cg = this.gates[this.gateIdx];
    const pulse = 0.5 + 0.5 * Math.sin(this.t * 5);
    cg.mesh.scale.setScalar(cg.radius * (1 + 0.06 * (pulse - 0.5)));
    this.matCurrent.emissiveIntensity = 2.2 + 1.6 * pulse;

    // objective line at ~5 Hz (it carries the running clock)
    if (this._objClock >= 0.2) {
      const text = this._raceLine();
      this._objClock = 0;
      if (text !== this._lastObj) {
        this._lastObj = text;
        emit('mode:objective', { text });
      }
    }
  }

  dispose() {
    this.scene.remove(this.group);
    for (const g of this.gates) {
      g.sTex.dispose();
      g.sMat.dispose();
    }
    this.gates.length = 0;
    this.torusGeo.dispose();
    this.matCurrent.dispose();
    this.matNext.dispose();
    this.matFaint.dispose();
  }
}

// ============================================================
// RETRIEVAL — deliver 5 glowing parcels back to the home pad.
// One active parcel at a time, marked by a tall light beam.
// The 50 g payload is emitted via quad:carry — on a 34 g whoop
// it nearly doubles AUW (brutal); on a 5" it is nothing.
// ============================================================
const BEAM_HEIGHT = 40;
const COLOR_AMBER = 0xffa21f;
const COLOR_GREEN = 0x37e08b;

class RetrievalMode {
  constructor(scene, map) {
    this.scene = scene;
    this.map = map;
    this.group = new THREE.Group();
    this.group.name = 'pw-mode-retrieval';

    const pts = (map && Array.isArray(map.retrievalPoints)) ? map.retrievalPoints : [];
    this.points = shuffled(pts).slice(0, 5).map(p => toVec3(p, new THREE.Vector3()));
    this.total = this.points.length;
    this.home = toVec3((map && map.homePad) || (map && map.spawn), new THREE.Vector3());

    this.inert = this.total === 0;

    this.delivered = 0;
    this.carrying = false;
    this.done = false;
    this.wasCrashed = false;
    this.totalTime = 0;
    this.timerStarted = false;
    this.t = 0;
    this._lastObj = null;
    this._objClock = 1;

    // parcel
    this.boxGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    this.parcelMat = new THREE.MeshStandardMaterial({
      color: 0x2a1803, emissive: COLOR_AMBER, emissiveIntensity: 2.6, roughness: 0.35, metalness: 0.1,
    });
    this.parcel = new THREE.Mesh(this.boxGeo, this.parcelMat);

    // light-beam column (additive, fades with height, ignores fog so it
    // reads across the whole map)
    this.beamTex = makeBeamTexture();
    this.beamGeo = new THREE.CylinderGeometry(0.45, 0.45, BEAM_HEIGHT, 10, 1, true);
    this.beamMat = new THREE.MeshBasicMaterial({
      map: this.beamTex,
      color: COLOR_AMBER,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    });
    this.beam = new THREE.Mesh(this.beamGeo, this.beamMat);
    this.beam.renderOrder = 4;

    this.parcelBase = new THREE.Vector3(); // hover anchor of the loose parcel

    if (this.inert) {
      this._forceObjective('NO RETRIEVAL POINTS ON THIS MAP — FLY FREE');
    } else {
      this.group.add(this.parcel);
      this.group.add(this.beam);
      this._spawnParcelAt(this.points[0]);
      emit('osd:flash', { text: `RETRIEVAL — DELIVER ${this.total} PACKAGE${this.total === 1 ? '' : 'S'}`, ms: 2500 });
      this._forceObjective(this._packageLine());
    }
    scene.add(this.group);
  }

  _packageLine() {
    return `PACKAGE ${Math.min(this.delivered + 1, this.total)}/${this.total} — ${fmtTime(this.totalTime, 1)}`;
  }

  _forceObjective(text) {
    this._lastObj = text;
    this._objClock = 0;
    emit('mode:objective', { text });
  }

  _groundAt(x, z, fallbackY) {
    const gh = this.map && this.map.getGroundHeight;
    if (typeof gh === 'function') {
      try { return gh(x, z); } catch (e) { return fallbackY; }
    }
    return fallbackY;
  }

  _beamTo(x, baseY, z, colorHex) {
    this.beam.position.set(x, baseY + BEAM_HEIGHT / 2 - 0.5, z);
    this.beamMat.color.setHex(colorHex);
  }

  // place the loose parcel hovering above a retrieval point
  _spawnParcelAt(point) {
    this.parcelBase.set(point.x, point.y + 0.55, point.z);
    this.parcel.visible = true;
    this._beamTo(this.parcelBase.x, point.y, this.parcelBase.z, COLOR_AMBER);
  }

  _pickup() {
    this.carrying = true;
    emit('quad:carry', { massKg: 0.05 });
    emit('osd:flash', { text: 'PACKAGE SECURED — RETURN HOME', ms: 2200 });
    this._beamTo(this.home.x, this.home.y, this.home.z, COLOR_GREEN);
    this._forceObjective('CARRYING — RETURN HOME');
  }

  _drop(quad) {
    this.carrying = false;
    emit('quad:carry', { massKg: 0 });
    emit('osd:flash', { text: 'PACKAGE DROPPED', ms: 1800 });
    const gx = quad.position.x, gz = quad.position.z;
    const ground = this._groundAt(gx, gz, quad.position.y);
    this.parcelBase.set(gx, Math.max(quad.position.y, ground + 0.35), gz);
    this._beamTo(gx, this.parcelBase.y - 0.55, gz, COLOR_AMBER);
    this._forceObjective(this._packageLine());
  }

  _deliver() {
    this.carrying = false;
    emit('quad:carry', { massKg: 0 });
    this.delivered++;
    if (this.delivered >= this.total) {
      this.done = true;
      this.parcel.visible = false;
      this.beam.visible = false;
      emit('osd:flash', { text: `ALL PACKAGES DELIVERED — ${fmtTime(this.totalTime)}`, ms: 6000 });
      this._forceObjective(`ALL PACKAGES DELIVERED ${fmtTime(this.totalTime)} — ESC > Restart mode to go again`);
    } else {
      emit('osd:flash', { text: `DELIVERED ${this.delivered}/${this.total}`, ms: 1800 });
      this._spawnParcelAt(this.points[this.delivered]);
      this._forceObjective(this._packageLine());
    }
  }

  update(dt, quad) {
    if (this.inert) return;
    this.t += dt;
    this._objClock += dt;

    if (!this.done) {
      if (!this.timerStarted && quad.velocity.lengthSq() > 0.25) this.timerStarted = true;
      if (this.timerStarted) this.totalTime += dt;
    }

    const crashed = !!quad.crashed;

    if (this.carrying) {
      // parcel hangs 0.12 m below the quad
      this.parcel.position.set(quad.position.x, quad.position.y - 0.12, quad.position.z);
      this.parcel.rotation.y += dt * 1.5;
      if (crashed && !this.wasCrashed) {
        this._drop(quad);
      } else if (!crashed) {
        if (_vA.copy(quad.position).sub(this.home).lengthSq() <= 2.5 * 2.5) this._deliver();
      }
    } else if (!this.done) {
      // idle parcel: hover + slow spin + bob
      const bob = Math.sin(this.t * 1.6) * 0.15;
      this.parcel.position.set(this.parcelBase.x, this.parcelBase.y + bob, this.parcelBase.z);
      this.parcel.rotation.y += dt * 0.9;
      // pickup requires a gentle approach: within 1.4 m at under 5 m/s
      if (!crashed &&
          quad.velocity.lengthSq() < 25 &&
          _vA.copy(quad.position).sub(this.parcel.position).lengthSq() <= 1.4 * 1.4) {
        this._pickup();
      }
    }

    this.wasCrashed = crashed;
    if (this.done) return;

    // objective at ~5 Hz (carries the running timer)
    if (this._objClock >= 0.2) {
      const text = this.carrying ? 'CARRYING — RETURN HOME' : this._packageLine();
      this._objClock = 0;
      if (text !== this._lastObj) {
        this._lastObj = text;
        emit('mode:objective', { text });
      }
    }
  }

  dispose() {
    if (this.carrying) emit('quad:carry', { massKg: 0 });
    this.carrying = false;
    this.scene.remove(this.group);
    this.boxGeo.dispose();
    this.parcelMat.dispose();
    this.beamGeo.dispose();
    this.beamMat.dispose();
    this.beamTex.dispose();
  }
}

// ============================================================
// ModeManager — public API consumed by main.js
// ============================================================
export class ModeManager {
  constructor(scene) {
    this.scene = scene;
    this.active = null;
    this.modeName = null;
  }

  start(modeName, mapHandle) {
    this.dispose();
    try {
      if (modeName === 'racing') {
        this.active = new RacingMode(this.scene, mapHandle);
      } else if (modeName === 'retrieval') {
        this.active = new RetrievalMode(this.scene, mapHandle);
      } else if (modeName === 'follow') {
        this.active = createFollowMode(THREE, this.scene);
      } else {
        this.active = new FreestyleMode();
      }
      this.modeName = modeName;
    } catch (err) {
      console.error('[PropWash] mode init failed:', modeName, err);
      emit('osd:flash', { text: 'MODE INIT FAILED — SEE CONSOLE', ms: 4000 });
      this.active = null;
      this.modeName = null;
    }
  }

  update(dt, quad) {
    if (!this.active || !quad) return;
    try {
      this.active.update(dt, quad);
    } catch (err) {
      // never let a mode bug take down the flight loop
      console.error('[PropWash] mode update failed — mode disabled:', err);
      try { this.active.dispose(); } catch (e) { /* best effort */ }
      this.active = null;
      emit('osd:flash', { text: 'MODE ERROR — SEE CONSOLE', ms: 4000 });
    }
  }

  dispose() {
    if (this.active) {
      try { this.active.dispose(); } catch (err) { console.error('[PropWash] mode dispose failed:', err); }
      this.active = null;
      this.modeName = null;
      emit('mode:objective', { text: '' });
    }
  }
}
