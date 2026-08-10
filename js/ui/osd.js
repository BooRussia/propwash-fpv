// ============================================================
// PropWash FPV — Betaflight-style on-screen display (OSD)
// White monospace glyphs on a safe-area grid, drawn with DOM
// elements. Cheap per-frame updates: every value is quantized,
// cached, and only written to the DOM when it actually changes.
// ============================================================
import { on, clamp } from '../core/state.js';

const FLIGHT_MODE_LABEL = { acro: 'ACRO', angle: 'ANGLE', horizon: 'HRZN' };
const RAD2DEG = 180 / Math.PI;

const OSD_CSS = `
.pw-osd {
  position: absolute; inset: 0;
  pointer-events: none;
  font-family: var(--pw-mono, "Consolas", "Cascadia Mono", monospace);
  font-size: 15px;
  color: #fff;
  letter-spacing: 1px;
  line-height: 1.35;
  text-transform: uppercase;
  text-shadow:
    -1px -1px 0 #000, 1px -1px 0 #000,
    -1px  1px 0 #000, 1px  1px 0 #000,
    0 0 6px rgba(0, 0, 0, 0.65);
}
.pw-osd * { pointer-events: none; }

/* ---- safe-area regions ---- */
.pw-osd .osd-tl { position: absolute; top: 3.5%; left: 4.5%; text-align: left; }
.pw-osd .osd-tc { position: absolute; top: 3.5%; left: 50%; transform: translateX(-50%); text-align: center; max-width: 60%; white-space: nowrap; overflow: hidden; }
.pw-osd .osd-tr { position: absolute; top: 3.5%; right: 4.5%; text-align: right; }
.pw-osd .osd-bl { position: absolute; bottom: 5%; left: 4.5%; text-align: left; }
.pw-osd .osd-bc { position: absolute; bottom: 5%; left: 50%; transform: translateX(-50%); text-align: center; }
.pw-osd .osd-br { position: absolute; bottom: 5%; right: 4.5%; text-align: right; }

.pw-osd .osd-name { font-weight: 700; letter-spacing: 2px; }
.pw-osd .osd-fmode { letter-spacing: 2px; }
.pw-osd .osd-gmode { font-size: 12px; opacity: 0.75; letter-spacing: 2px; }
.pw-osd .osd-objective { letter-spacing: 2px; }

/* ---- left-middle: throttle ---- */
.pw-osd .osd-thr {
  position: absolute; left: 4.5%; top: 50%; transform: translateY(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.pw-osd .osd-thr-bar {
  width: 10px; height: 112px; position: relative;
  border: 1px solid rgba(255,255,255,0.9);
  background: rgba(0,0,0,0.3);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(0,0,0,0.35);
}
.pw-osd .osd-thr-fill { position: absolute; left: 1px; right: 1px; bottom: 1px; height: 0%; background: #fff; }
.pw-osd .osd-thr-cap { font-size: 11px; letter-spacing: 2px; }
.pw-osd .osd-thr-val { font-size: 13px; }

/* ---- right-middle: speed / altitude ---- */
.pw-osd .osd-rm { position: absolute; right: 4.5%; top: 50%; transform: translateY(-50%); text-align: right; }
.pw-osd .osd-speed { font-size: 31px; font-weight: 700; letter-spacing: 2px; line-height: 1.05; }
.pw-osd .osd-speed-unit { font-size: 11px; letter-spacing: 3px; }
.pw-osd .osd-alt { font-size: 14px; margin-top: 8px; }

/* ---- bottom-left: battery ---- */
.pw-osd .osd-bat-row { display: flex; align-items: center; gap: 9px; }
.pw-osd .osd-bat-icon {
  width: 27px; height: 13px; position: relative; flex: none;
  border: 1px solid #fff;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.65);
  background: rgba(0,0,0,0.3);
}
.pw-osd .osd-bat-icon::after {
  content: ''; position: absolute; right: -5px; top: 2px;
  width: 3px; height: 5px; background: #fff;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.65);
}
.pw-osd .osd-bat-fill { position: absolute; left: 1px; top: 1px; bottom: 1px; width: 100%; background: #fff; max-width: calc(100% - 2px); }
.pw-osd .osd-volts { font-size: 17px; font-weight: 700; letter-spacing: 1px; }
.pw-osd .osd-cellv { font-size: 12px; opacity: 0.9; margin-top: 2px; }
.pw-osd .osd-bl.ok  .osd-volts, .pw-osd .osd-bl.ok  .osd-cellv { color: var(--pw-ok, #37e08b); }
.pw-osd .osd-bl.ok  .osd-bat-fill { background: var(--pw-ok, #37e08b); }
.pw-osd .osd-bl.warn .osd-volts, .pw-osd .osd-bl.warn .osd-cellv { color: var(--pw-warn, #ffc857); }
.pw-osd .osd-bl.warn .osd-bat-fill { background: var(--pw-warn, #ffc857); }
.pw-osd .osd-bl.low .osd-volts, .pw-osd .osd-bl.low .osd-cellv { color: var(--pw-danger, #ff4d4d); }
.pw-osd .osd-bl.low .osd-bat-fill { background: var(--pw-danger, #ff4d4d); }
.pw-osd .osd-bl.low { animation: pw-osd-blink 1.2s linear infinite; }

/* ---- bottom-center: home arrow / arm status / crash ---- */
.pw-osd .osd-home-row { display: flex; align-items: center; justify-content: center; gap: 9px; }
.pw-osd .osd-home-box {
  width: 18px; height: 18px; flex: none;
  display: flex; align-items: center; justify-content: center;
  will-change: transform;
}
.pw-osd .osd-home-arrow {
  width: 0; height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 13px solid #fff;
  filter: drop-shadow(0 1px 1px #000) drop-shadow(0 -1px 1px #000);
}
.pw-osd .osd-arm { margin-top: 4px; letter-spacing: 3px; color: rgba(255,255,255,0.78); }
.pw-osd .osd-arm.armed { color: #fff; font-weight: 700; }
.pw-osd .osd-crash {
  display: none; margin-top: 4px;
  color: var(--pw-danger, #ff4d4d);
  font-weight: 700; letter-spacing: 3px;
  animation: pw-osd-blink 0.9s step-end infinite;
}

/* ---- bottom-right: RSSI ---- */
.pw-osd .osd-rssi { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.pw-osd .osd-rssi-bars { display: flex; align-items: flex-end; gap: 2px; height: 17px; }
.pw-osd .osd-rssi-bar { width: 5px; background: #fff; opacity: 0.22; box-shadow: 0 0 0 1px rgba(0,0,0,0.55); }
.pw-osd .osd-rssi-bar.on { opacity: 1; }
.pw-osd .osd-rssi.low .osd-rssi-bar.on { background: var(--pw-danger, #ff4d4d); }
.pw-osd .osd-rssi-val { font-size: 11px; letter-spacing: 2px; }

/* ---- center crosshair ---- */
.pw-osd .osd-cross { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 92px; height: 14px; }
.pw-osd .osd-cross-dot {
  position: absolute; left: 50%; top: 50%; width: 4px; height: 4px;
  margin: -2px 0 0 -2px; background: #fff; border-radius: 50%;
  box-shadow: 0 0 2px #000, 0 0 2px #000;
}
.pw-osd .osd-cross-tick { position: absolute; top: 50%; width: 15px; height: 2px; margin-top: -1px; background: #fff; box-shadow: 0 0 2px #000, 0 0 2px #000; }
.pw-osd .osd-cross-tick.l { left: 0; }
.pw-osd .osd-cross-tick.r { right: 0; }

/* ---- flash messages ---- */
.pw-osd .osd-flash {
  position: absolute; top: 15%; left: 50%; transform: translateX(-50%);
  font-size: 26px; font-weight: 700; letter-spacing: 4px;
  text-align: center; white-space: nowrap; max-width: 92%;
  overflow: hidden;
  opacity: 0; transition: opacity 0.4s ease;
}
.pw-osd .osd-flash.show { opacity: 1; transition: opacity 0.1s ease; }

/* ---- persistent hint line ---- */
.pw-osd .osd-hint {
  position: absolute; bottom: 1.4%; left: 50%; transform: translateX(-50%);
  font-size: 11px; letter-spacing: 1.5px; white-space: nowrap;
  color: #eaf4fa; opacity: 0.85;
}

@keyframes pw-osd-blink { 0%, 54% { opacity: 1; } 55%, 100% { opacity: 0.14; } }
`;

export class OSD {
  constructor(containerEl) {
    this.container = containerEl || document.body;
    this._injectCSS();

    this._c = Object.create(null); // change-detection cache
    this._visible = true;
    this._flashShown = false;
    this._flashUntil = 0;
    this._objectiveText = '';

    this._build();

    // self-subscription on the app bus
    on('mode:objective', (d) => this.setObjective(d && typeof d.text === 'string' ? d.text : ''));
    on('osd:flash', (d) => { if (d && d.text != null) this.flash(String(d.text), d.ms); });
  }

  // ---------------- construction ----------------
  _injectCSS() {
    if (document.getElementById('pw-osd-style')) return;
    try {
      const style = document.createElement('style');
      style.id = 'pw-osd-style';
      style.textContent = OSD_CSS;
      document.head.appendChild(style);
    } catch (e) { console.warn('[OSD] style injection failed', e); }
  }

  _el(cls, parent, text) {
    const d = document.createElement('div');
    if (cls) d.className = cls;
    if (text != null) d.textContent = text;
    (parent || this.root).appendChild(d);
    return d;
  }

  _build() {
    this.root = document.createElement('div');
    this.root.className = 'pw-osd';
    this.root.style.pointerEvents = 'none';
    this.root.setAttribute('aria-hidden', 'true');
    this.container.appendChild(this.root);

    // top-left: drone name + flight mode + game mode
    const tl = this._el('osd-tl');
    this.nameEl = this._el('osd-name', tl, '');
    this.fmodeEl = this._el('osd-fmode', tl, '');
    this.gmodeEl = this._el('osd-gmode', tl, '');

    // top-center: objective line
    const tc = this._el('osd-tc');
    this.objectiveEl = this._el('osd-objective', tc, '');
    this.objectiveEl.style.display = 'none';

    // top-right: flight timer
    const tr = this._el('osd-tr');
    this.timerEl = this._el('osd-timer', tr, '00:00');

    // left-middle: throttle bar
    const thr = this._el('osd-thr');
    this._el('osd-thr-cap', thr, 'THR');
    const thrBar = this._el('osd-thr-bar', thr);
    this.thrFill = this._el('osd-thr-fill', thrBar);
    this.thrVal = this._el('osd-thr-val', thr, '0.0');

    // right-middle: speed + altitude
    const rm = this._el('osd-rm');
    this.speedEl = this._el('osd-speed', rm, '0');
    this._el('osd-speed-unit', rm, 'KM/H');
    this.altEl = this._el('osd-alt', rm, 'ALT 0.0M');

    // bottom-left: battery
    this.blEl = this._el('osd-bl');
    const batRow = this._el('osd-bat-row', this.blEl);
    const batIcon = this._el('osd-bat-icon', batRow);
    this.batFill = this._el('osd-bat-fill', batIcon);
    this.voltsEl = this._el('osd-volts', batRow, '0.00V');
    this.cellVEl = this._el('osd-cellv', this.blEl, '');

    // bottom-center: home arrow + distance, arm status, crash
    const bc = this._el('osd-bc');
    const homeRow = this._el('osd-home-row', bc);
    this.homeBox = this._el('osd-home-box', homeRow);
    this._el('osd-home-arrow', this.homeBox);
    this.homeDistEl = this._el('osd-home-dist', homeRow, 'HOME 0M');
    this.armEl = this._el('osd-arm', bc, 'DISARMED');
    this.crashEl = this._el('osd-crash', bc, '*** CRASHED ***');

    // bottom-right: RSSI bars
    this.rssiEl = this._el('osd-br osd-rssi');
    const bars = this._el('osd-rssi-bars', this.rssiEl);
    this._bars = [];
    for (let i = 0; i < 5; i++) {
      const b = this._el('osd-rssi-bar', bars);
      b.style.height = (5 + i * 3) + 'px';
      this._bars.push(b);
    }
    this.rssiValEl = this._el('osd-rssi-val', this.rssiEl, 'RSSI 100');

    // center crosshair
    const cross = this._el('osd-cross');
    this._el('osd-cross-tick l', cross);
    this._el('osd-cross-dot', cross);
    this._el('osd-cross-tick r', cross);

    // flash + hint
    this.flashEl = this._el('osd-flash');
    this.hintEl = this._el('osd-hint');
    this.hintEl.style.display = 'none';
  }

  // ---------------- public API ----------------
  setObjective(text) {
    const s = text == null ? '' : String(text);
    if (this._objectiveText === s) return;
    this._objectiveText = s;
    this.objectiveEl.textContent = s;
    this.objectiveEl.style.display = s ? '' : 'none';
  }

  flash(text, ms) {
    this.flashEl.textContent = text == null ? '' : String(text);
    this.flashEl.classList.add('show');
    this._flashShown = true;
    const dur = (typeof ms === 'number' && isFinite(ms) && ms > 0) ? ms : 1500;
    this._flashUntil = performance.now() + dur;
  }

  setVisible(visible) {
    const v = !!visible;
    if (this._visible === v) return;
    this._visible = v;
    this.root.style.display = v ? '' : 'none';
  }

  update(dt, t) {
    if (!t) return;
    const c = this._c;

    // ---- flash expiry (runs even while hidden so it doesn't get stuck) ----
    if (this._flashShown && performance.now() >= this._flashUntil) {
      this._flashShown = false;
      this.flashEl.classList.remove('show');
    }

    // ---- top-left: name / flight mode / game mode ----
    const name = t.droneName || '';
    if (c.name !== name) { c.name = name; this.nameEl.textContent = name; }
    const fmode = FLIGHT_MODE_LABEL[t.flightMode] || String(t.flightMode || '').toUpperCase();
    if (c.fmode !== fmode) { c.fmode = fmode; this.fmodeEl.textContent = fmode; }
    const gmode = String(t.mode || '').toUpperCase();
    if (c.gmode !== gmode) { c.gmode = gmode; this.gmodeEl.textContent = gmode; }

    // ---- timer MM:SS ----
    const secs = Math.max(0, Math.floor(t.timerS || 0));
    if (c.secs !== secs) {
      c.secs = secs;
      const m = (secs / 60) | 0;
      const s = secs % 60;
      this.timerEl.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

    // ---- throttle (1 decimal + bar) ----
    const thrQ = Math.round(clamp(t.throttle || 0, 0, 1) * 1000);
    if (c.thrQ !== thrQ) { c.thrQ = thrQ; this.thrVal.textContent = (thrQ / 10).toFixed(1); }
    const thrP = Math.round(thrQ / 10);
    if (c.thrP !== thrP) { c.thrP = thrP; this.thrFill.style.height = thrP + '%'; }

    // ---- speed km/h + altitude ----
    const kmh = Math.max(0, Math.round((t.speedMs || 0) * 3.6));
    if (c.kmh !== kmh) { c.kmh = kmh; this.speedEl.textContent = String(kmh); }
    const altQ = Math.round((t.altM || 0) * 10);
    if (c.altQ !== altQ) { c.altQ = altQ; this.altEl.textContent = 'ALT ' + (altQ / 10).toFixed(1) + 'M'; }

    // ---- battery (per-cell aware) ----
    const cells = (t.cells >= 1) ? t.cells : 1;
    const vQ = Math.round((t.volts || 0) * 100);
    if (c.vQ !== vQ || c.cells !== cells) {
      c.vQ = vQ; c.cells = cells;
      const volts = vQ / 100;
      const vpc = volts / cells;
      this.voltsEl.textContent = volts.toFixed(2) + 'V';
      this.cellVEl.textContent = cells + 'S ' + vpc.toFixed(2) + 'V/C';
      const state = vpc > 3.7 ? 'ok' : (vpc >= 3.5 ? 'warn' : 'low');
      if (c.batState !== state) { c.batState = state; this.blEl.className = 'osd-bl ' + state; }
      const fill = Math.round(clamp((vpc - 3.3) / 0.9, 0, 1) * 50) * 2; // 2% steps
      if (c.batFill !== fill) { c.batFill = fill; this.batFill.style.width = fill + '%'; }
    }

    // ---- home arrow + distance ----
    // homeDirRad: bearing to home relative to nose; positive = home to the LEFT
    // (three.js yaw is CCW-positive), CSS rotate is clockwise-positive → negate.
    let deg = Math.round((-(t.homeDirRad || 0) * RAD2DEG) / 3) * 3;
    deg = ((deg % 360) + 360) % 360;
    if (c.homeDeg !== deg) { c.homeDeg = deg; this.homeBox.style.transform = 'rotate(' + deg + 'deg)'; }
    const distM = Math.max(0, Math.round(t.distHomeM || 0));
    if (c.distM !== distM) { c.distM = distM; this.homeDistEl.textContent = 'HOME ' + distM + 'M'; }

    // ---- armed / crashed ----
    const armed = !!t.armed;
    if (c.armed !== armed) {
      c.armed = armed;
      this.armEl.textContent = armed ? 'ARMED' : 'DISARMED';
      this.armEl.className = armed ? 'osd-arm armed' : 'osd-arm';
    }
    const crashed = !!t.crashed;
    if (c.crashed !== crashed) {
      c.crashed = crashed;
      this.crashEl.style.display = crashed ? 'block' : 'none';
    }

    // ---- RSSI bars ----
    const rssi = clamp(t.rssi || 0, 0, 1);
    const barsOn = clamp(Math.round(rssi * 5), 0, 5);
    if (c.rssiN !== barsOn) {
      c.rssiN = barsOn;
      for (let i = 0; i < 5; i++) {
        this._bars[i].className = i < barsOn ? 'osd-rssi-bar on' : 'osd-rssi-bar';
      }
      const low = barsOn <= 1;
      if (c.rssiLow !== low) {
        c.rssiLow = low;
        this.rssiEl.className = low ? 'osd-br osd-rssi low' : 'osd-br osd-rssi';
      }
    }
    const pct = Math.round(rssi * 20) * 5; // 5% steps
    if (c.rssiPct !== pct) { c.rssiPct = pct; this.rssiValEl.textContent = 'RSSI ' + pct; }

    // ---- persistent hints ----
    const hint = !t.radioConnected ? 1 : (!t.calibrated ? 2 : (!t.armed && !t.crashed ? 3 : 0));
    if (c.hint !== hint) {
      c.hint = hint;
      if (hint === 1) {
        this.hintEl.textContent = 'NO RADIO — KEYBOARD: I/K throttle W/S/A/D J/L — ESC menu';
        this.hintEl.style.display = '';
      } else if (hint === 2) {
        this.hintEl.textContent = 'RADIO DETECTED — CALIBRATE IN ESC MENU';
        this.hintEl.style.display = '';
      } else if (hint === 3) {
        this.hintEl.textContent = 'ARM TO FLY: throttle all the way down, then SPACE or your arm switch';
        this.hintEl.style.display = '';
      } else {
        this.hintEl.style.display = 'none';
      }
    }
  }
}
