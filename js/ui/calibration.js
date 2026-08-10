// ============================================================
// PropWash FPV — Radio calibration wizard + fine-tune panel
//
// export class CalibrationUI
//   constructor(radioManager)
//   startWizard()   — full-screen 9-step calibration wizard
//   openFineTune()  — trims / deadband / invert fine-adjustment panel
//   get isOpen      — true while any overlay is showing
//   close()         — close whatever is open
//
// Emits "menu:open" when an overlay opens and "menu:close" when it
// closes (main.js pauses/unpauses the sim on those events).
//
// On save writes (the exact shape radio.js reads):
//   settings.controller.calibration = {
//     axes: { [axisIndex]: { min, max, center, invert, deadband, trim } },
//     map:  { throttle, roll, pitch, yaw: axisIndex,
//             arm: { type: "axis"|"button", index, threshold } | null }
//   }
//   settings.controller.deviceId = <active pad id>
// ============================================================

import { settings, saveSettings, emit, on, clamp } from '../core/state.js';

// ------------------------------------------------------------------
// constants
// ------------------------------------------------------------------

const STEP_META = [
  { id: 'device', label: 'DEVICE' },
  { id: 'center', label: 'CENTER' },
  { id: 'range',  label: 'RANGE'  },
  { id: 'thr',    label: 'THR'    },
  { id: 'pitch',  label: 'PITCH'  },
  { id: 'roll',   label: 'ROLL'   },
  { id: 'yaw',    label: 'YAW'    },
  { id: 'arm',    label: 'ARM'    },
  { id: 'verify', label: 'VERIFY' },
];

// wizard step index -> direction-assignment config
const DIR_STEPS = {
  3: { control: 'throttle', arrow: '▲', instr: 'Move THROTTLE all the way UP and hold',
       sub: 'Push the throttle stick to its top position and keep it there.' },
  4: { control: 'pitch', arrow: '▲', instr: 'Move PITCH stick FORWARD (away from you) and hold',
       sub: 'Push the right stick forward — toward the screen — and keep it there.' },
  5: { control: 'roll', arrow: '▶', instr: 'Move ROLL stick RIGHT and hold',
       sub: 'Push the right stick fully to the right and keep it there.' },
  6: { control: 'yaw', arrow: '▶', instr: 'Move YAW stick RIGHT and hold',
       sub: 'Push the left stick fully to the right and keep it there.' },
};

const CHANNELS = [
  { key: 'throttle', name: 'THROTTLE', unipolar: true  },
  { key: 'roll',     name: 'ROLL',     unipolar: false },
  { key: 'pitch',    name: 'PITCH',    unipolar: false },
  { key: 'yaw',      name: 'YAW',      unipolar: false },
];

const STAB_TOLERANCE = 0.02;   // peak-to-peak wobble allowed while "still" (±0.01)
const STAB_MS        = 2000;   // stillness required before centers are captured
const HOLD_DEFLECT   = 0.6;    // normalized deflection to count as "held"
const HOLD_MS        = 700;    // hold duration for direction capture
const RANGE_READY    = 0.8;    // raw range an axis needs to count as "swept"
const ACCENT         = '#29d3ff';
const RING_C         = 2 * Math.PI * 27; // countdown ring circumference

const EMPTY = [];

// ------------------------------------------------------------------
// small helpers
// ------------------------------------------------------------------

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function fmtSigned(v, digits) {
  return (v >= 0 ? '+' : '') + v.toFixed(digits);
}

function round3(v) { return Math.round(v * 1000) / 1000; }

// Reference calibration curve (mirrors the documented shape radio.js reads).
// Throttle: 0..1 from min..max.  Others: -1..1 around center, per-side scaled.
function calibratedAxis(a, v, isThrottle) {
  if (!a || !Number.isFinite(v)) return 0;
  const range = a.max - a.min;
  if (!(range > 1e-4)) return 0;
  let n;
  if (isThrottle) {
    n = (v - a.min) / range;
    if (a.invert) n = 1 - n;
    return clamp(n + (a.trim || 0), 0, 1);
  }
  const up = a.max - a.center;
  const dn = a.center - a.min;
  if (v >= a.center) n = up > 1e-4 ? (v - a.center) / up : 0;
  else               n = dn > 1e-4 ? (v - a.center) / dn : 0;
  n = clamp(n, -1, 1);
  if (a.invert) n = -n;
  const db = a.deadband || 0;
  if (db > 0 && db < 1) {
    n = Math.abs(n) < db ? 0 : Math.sign(n) * (Math.abs(n) - db) / (1 - db);
  }
  return clamp(n + (a.trim || 0), -1, 1);
}

// press-and-hold repeat for +/- buttons
function bindHold(btn, fn) {
  let delay = 0, iv = 0;
  const stop = () => {
    if (delay) { clearTimeout(delay); delay = 0; }
    if (iv) { clearInterval(iv); iv = 0; }
  };
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { btn.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    fn();
    stop();
    delay = setTimeout(() => { iv = setInterval(fn, 55); }, 400);
  });
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointercancel', stop);
  btn.addEventListener('lostpointercapture', stop);
  window.addEventListener('blur', stop);
}

// ------------------------------------------------------------------
// injected CSS (module-scoped, prefix pwc-)
// ------------------------------------------------------------------

const CSS = `
.pwc-overlay {
  position: fixed; inset: 0; z-index: 200;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at 50% 35%, rgba(8,14,24,0.88), rgba(2,4,8,0.95));
  animation: pwc-fade 0.22s ease;
}
@keyframes pwc-fade { from { opacity: 0; } to { opacity: 1; } }
.pwc-panel {
  width: min(94vw, 780px); max-height: 92vh; overflow-y: auto; overflow-x: hidden;
  position: relative; animation: pwc-pop 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.15);
}
@keyframes pwc-pop { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }
.pwc-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.pwc-title { font-size: 24px; font-weight: 800; letter-spacing: 3px; }
.pwc-title .pwc-t2 { color: var(--pw-accent); text-shadow: 0 0 18px rgba(41,211,255,0.45); }
.pwc-conn { display: flex; align-items: center; gap: 8px; max-width: 46%; padding-top: 6px; }
.pwc-conndot { width: 9px; height: 9px; border-radius: 50%; background: var(--pw-danger); flex: none; transition: background 0.2s, box-shadow 0.2s; }
.pwc-conndot.on { background: var(--pw-ok); box-shadow: 0 0 10px var(--pw-ok); }
.pwc-connname { font-size: 10px; color: var(--pw-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pwc-progress { display: flex; gap: 4px; margin: 16px 0 18px; }
.pwc-seg { flex: 1; text-align: center; font-size: 9px; letter-spacing: 1px; color: var(--pw-dim); opacity: 0.55; position: relative; padding-top: 10px; transition: opacity 0.25s, color 0.25s; }
.pwc-seg::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 2px; background: rgba(255,255,255,0.10); transition: background 0.25s, box-shadow 0.25s; }
.pwc-seg.done::before { background: rgba(41,211,255,0.5); }
.pwc-seg.cur { color: var(--pw-text); opacity: 1; }
.pwc-seg.cur::before { background: var(--pw-accent); box-shadow: 0 0 10px rgba(41,211,255,0.6); }
.pwc-body { min-height: 330px; display: flex; flex-direction: column; }
.pwc-step { animation: pwc-step 0.25s ease; flex: 1; display: flex; flex-direction: column; }
@keyframes pwc-step { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
.pwc-instr { font-size: 21px; font-weight: 700; letter-spacing: 0.5px; text-align: center; margin-top: 10px; }
.pwc-sub { text-align: center; margin: 8px auto 0; max-width: 520px; line-height: 1.45; }
.pwc-note { margin-top: 16px; font-size: 12px; line-height: 1.5; text-align: center; }
.pwc-arrow { text-align: center; font-size: 42px; color: var(--pw-accent); text-shadow: 0 0 20px rgba(41,211,255,0.55); margin-top: 14px; line-height: 1; animation: pwc-bob 1.1s ease-in-out infinite; }
@keyframes pwc-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
.pwc-foot { display: flex; align-items: center; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--pw-line); }
.pwc-spacer { flex: 1; }
.pwc-devlist { margin: 18px auto 0; width: min(560px, 100%); }
.pwc-dev { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: rgba(255,255,255,0.04); border: 1px solid var(--pw-line); color: var(--pw-text); border-radius: 8px; padding: 12px 14px; margin: 6px 0; cursor: pointer; font-size: 13px; font-family: var(--pw-font); transition: all 0.15s ease; }
.pwc-dev:hover { border-color: var(--pw-accent); background: rgba(41,211,255,0.08); }
.pwc-dev.sel { border-color: var(--pw-accent); background: rgba(41,211,255,0.12); box-shadow: inset 0 0 18px rgba(41,211,255,0.12), 0 0 12px rgba(41,211,255,0.18); }
.pwc-devdot { width: 8px; height: 8px; border-radius: 50%; background: var(--pw-ok); box-shadow: 0 0 8px var(--pw-ok); flex: none; }
.pwc-devid { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--pw-mono); font-size: 12px; }
.pwc-waiting { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 26px 10px; color: var(--pw-dim); font-size: 13px; }
.pwc-pulse { width: 10px; height: 10px; border-radius: 50%; background: var(--pw-warn); animation: pwc-pulse 1.2s infinite ease-in-out; flex: none; }
@keyframes pwc-pulse { 0%,100% { opacity: 0.35; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
.pwc-axes { margin: 18px auto 4px; width: min(560px, 100%); }
.pwc-axis { display: flex; align-items: center; gap: 10px; margin: 7px 0; }
.pwc-axname { width: 34px; font-size: 11px; color: var(--pw-dim); font-family: var(--pw-mono); text-align: right; flex: none; }
.pwc-track { position: relative; flex: 1; height: 12px; border-radius: 6px; background: rgba(255,255,255,0.07); }
.pwc-band { position: absolute; top: 0; bottom: 0; border-radius: 6px; background: linear-gradient(90deg, rgba(41,211,255,0.16), rgba(41,211,255,0.34)); }
.pwc-band.ok { background: linear-gradient(90deg, rgba(55,224,139,0.2), rgba(55,224,139,0.42)); }
.pwc-cline { position: absolute; top: 1px; bottom: 1px; width: 1px; background: rgba(255,255,255,0.28); }
.pwc-dot { position: absolute; top: 50%; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 50%; background: var(--pw-accent); box-shadow: 0 0 8px rgba(41,211,255,0.8); }
.pwc-axval { width: 56px; text-align: right; font-size: 11px; font-family: var(--pw-mono); color: var(--pw-dim); flex: none; }
.pwc-axval.ok { color: var(--pw-ok); }
.pwc-ringwrap { position: relative; width: 74px; height: 74px; margin: 16px auto 0; }
.pwc-ring { width: 74px; height: 74px; transform: rotate(-90deg); }
.pwc-ring-bg { fill: none; stroke: rgba(255,255,255,0.1); stroke-width: 4; }
.pwc-ring-fg { fill: none; stroke: var(--pw-accent); stroke-width: 4; stroke-linecap: round; stroke-dasharray: ${RING_C.toFixed(2)}; stroke-dashoffset: ${RING_C.toFixed(2)}; filter: drop-shadow(0 0 5px rgba(41,211,255,0.7)); }
.pwc-ringnum { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: var(--pw-mono); font-size: 15px; color: var(--pw-text); }
.pwc-holdbar { width: min(420px, 82%); height: 8px; margin: 20px auto 0; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
.pwc-holdfill { height: 100%; width: 0%; border-radius: 4px; background: linear-gradient(90deg, var(--pw-accent), #7ae7ff); box-shadow: 0 0 10px rgba(41,211,255,0.6); }
.pwc-detected { text-align: center; margin-top: 12px; font-family: var(--pw-mono); font-size: 13px; color: var(--pw-dim); min-height: 20px; }
.pwc-detected.ok { color: var(--pw-ok); }
.pwc-checkwrap { display: flex; justify-content: center; margin-top: 14px; min-height: 60px; }
.pwc-check { width: 58px; height: 58px; }
.pwc-check circle { fill: none; stroke: var(--pw-ok); stroke-width: 2.5; stroke-dasharray: 151; stroke-dashoffset: 151; animation: pwc-circ 0.4s ease forwards; filter: drop-shadow(0 0 6px rgba(55,224,139,0.6)); }
.pwc-check path { fill: none; stroke: var(--pw-ok); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 40; stroke-dashoffset: 40; animation: pwc-tickd 0.28s 0.28s ease forwards; }
@keyframes pwc-circ { to { stroke-dashoffset: 0; } }
@keyframes pwc-tickd { to { stroke-dashoffset: 0; } }
.pwc-bigskip { display: flex; justify-content: center; margin-top: 22px; }
.pwc-sticks { display: flex; gap: 30px; justify-content: center; margin: 20px 0 6px; flex-wrap: wrap; }
.pwc-stickbox { text-align: center; }
.pwc-canvas { border-radius: 10px; background: rgba(255,255,255,0.03); }
.pwc-sticklabel { margin-top: 6px; font-size: 10px; letter-spacing: 2px; color: var(--pw-dim); }
.pwc-vrow { display: flex; align-items: center; gap: 12px; width: min(520px, 100%); margin: 10px auto 0; }
.pwc-vlab { width: 70px; font-size: 10px; letter-spacing: 2px; color: var(--pw-dim); text-align: right; flex: none; }
.pwc-thr { position: relative; flex: 1; height: 12px; border-radius: 6px; background: rgba(255,255,255,0.07); overflow: hidden; }
.pwc-thrfill { position: absolute; left: 0; top: 0; bottom: 0; width: 0%; background: linear-gradient(90deg, rgba(41,211,255,0.45), var(--pw-accent)); box-shadow: 0 0 10px rgba(41,211,255,0.5); }
.pwc-armpill { padding: 6px 16px; border-radius: 20px; font-size: 11px; letter-spacing: 2px; font-weight: 700; border: 1px solid var(--pw-line); color: var(--pw-dim); transition: all 0.2s ease; }
.pwc-armpill.on { color: #04220f; background: var(--pw-ok); border-color: transparent; box-shadow: 0 0 18px rgba(55,224,139,0.55); }
.pwc-verifybtns { display: flex; gap: 12px; justify-content: center; margin-top: 22px; flex-wrap: wrap; }
.pwc-x { position: absolute; top: 12px; right: 14px; background: none; border: none; color: var(--pw-dim); font-size: 22px; line-height: 1; cursor: pointer; padding: 6px; transition: color 0.15s, transform 0.15s; }
.pwc-x:hover { color: var(--pw-text); transform: scale(1.12); }
.pwc-ch { border: 1px solid var(--pw-line); background: rgba(255,255,255,0.025); border-radius: 9px; padding: 12px 16px; margin: 10px 0; transition: border-color 0.2s, box-shadow 0.2s; }
.pwc-ch:hover, .pwc-ch:focus-within { border-color: rgba(41,211,255,0.45); box-shadow: 0 0 18px rgba(41,211,255,0.09); }
.pwc-chtop { display: flex; align-items: center; gap: 12px; }
.pwc-chname { width: 86px; font-weight: 700; letter-spacing: 1.5px; font-size: 13px; flex: none; }
.pwc-chax { width: 48px; font-size: 10px; color: var(--pw-dim); font-family: var(--pw-mono); flex: none; }
.pwc-ftrack { position: relative; flex: 1; height: 14px; border-radius: 7px; background: rgba(255,255,255,0.06); }
.pwc-ffill { position: absolute; top: 0; bottom: 0; background: rgba(41,211,255,0.32); border-radius: 7px; }
.pwc-fcline { position: absolute; top: 1px; bottom: 1px; width: 1px; background: rgba(255,255,255,0.3); }
.pwc-fdot { position: absolute; top: 50%; width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 50%; background: var(--pw-accent); box-shadow: 0 0 10px rgba(41,211,255,0.85); }
.pwc-fval { width: 66px; text-align: right; font-family: var(--pw-mono); font-size: 12px; color: var(--pw-accent); flex: none; }
.pwc-chctl { display: flex; align-items: center; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
.pwc-ctlab { font-size: 10px; letter-spacing: 1.5px; color: var(--pw-dim); }
.pwc-trimbtn { padding: 3px 12px; font-size: 16px; line-height: 1.3; font-family: var(--pw-mono); }
.pwc-trimval { width: 56px; text-align: center; font-family: var(--pw-mono); font-size: 12px; }
.pwc-zero { padding: 5px 10px; font-size: 10px; letter-spacing: 1px; }
.pwc-db { width: 110px; flex: none; }
.pwc-dbval { width: 44px; font-size: 11px; font-family: var(--pw-mono); color: var(--pw-dim); }
.pwc-inv { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; letter-spacing: 1px; color: var(--pw-dim); cursor: pointer; }
.pwc-inv input { accent-color: var(--pw-accent); width: 14px; height: 14px; cursor: pointer; }
.pwc-armrow { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.pwc-armdesc { flex: 1; min-width: 140px; font-family: var(--pw-mono); font-size: 12px; color: var(--pw-text); }
.pwc-listen { margin-top: 10px; padding: 9px 12px; border-radius: 8px; background: rgba(255,200,87,0.08); border: 1px solid rgba(255,200,87,0.4); color: var(--pw-warn); font-size: 12px; display: none; }
.pwc-listen.show { display: block; animation: pwc-fade 0.2s ease; }
.pwc-ftfoot { display: flex; gap: 12px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--pw-line); flex-wrap: wrap; }
.pwc-empty { text-align: center; padding: 30px 10px 10px; }
.pwc-emptybtns { display: flex; gap: 12px; justify-content: center; margin-top: 22px; }
`;

// ------------------------------------------------------------------
// CalibrationUI
// ------------------------------------------------------------------

export class CalibrationUI {
  constructor(radioManager) {
    this.radio = radioManager;
    this._root = null;       // overlay root element (null = closed)
    this._mode = null;       // 'wizard' | 'finetune'
    this._raf = 0;
    this._wiz = null;
    this._ft = null;
    this._out = { throttle: 0, roll: 0, pitch: 0, yaw: 0 }; // reused, no per-frame alloc
    this._lastErr = '';
    this._tick = this._tick.bind(this);
  }

  get isOpen() { return !!this._root; }

  startWizard()  { this._open('wizard'); }
  openFineTune() { this._open('finetune'); }

  close() {
    if (!this._root) return;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; }
    try { this._root.remove(); } catch (e) { /* already detached */ }
    this._root = null;
    this._mode = null;
    this._wiz = null;
    this._ft = null;
    emit('menu:close');
  }

  // ---------------- overlay lifecycle ----------------

  _open(mode) {
    this._injectStyles();
    const wasOpen = !!this._root;
    if (wasOpen) {
      if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; }
      try { this._root.remove(); } catch (e) { /* noop */ }
      this._root = null;
      this._wiz = null;
      this._ft = null;
    }
    const host = document.getElementById('ui-root') || document.body;
    this._root = el('div', 'pwc-overlay');
    host.appendChild(this._root);
    this._mode = mode;
    if (mode === 'wizard') this._buildWizard();
    else this._buildFineTune();
    if (!wasOpen) emit('menu:open');
    this._raf = requestAnimationFrame(this._tick);
  }

  _injectStyles() {
    if (document.getElementById('pwc-style')) return;
    const s = el('style');
    s.id = 'pwc-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  _tick() {
    if (!this._root) return;
    this._raf = requestAnimationFrame(this._tick);
    const now = performance.now();
    try { this.radio.update(now); } catch (e) { /* main loop also updates */ }
    try {
      if (this._mode === 'wizard') this._wizTick(now);
      else if (this._mode === 'finetune') this._ftTick(now);
    } catch (e) {
      const msg = String(e && e.message || e);
      if (msg !== this._lastErr) { this._lastErr = msg; console.error('[PropWash calib]', e); }
    }
  }

  _rawAxes() {
    try {
      const r = this.radio.raw;
      return (r && r.axes) ? r.axes : EMPTY;
    } catch (e) { return EMPTY; }
  }

  _rawButtons() {
    try {
      const r = this.radio.raw;
      return (r && r.buttons) ? r.buttons : EMPTY;
    } catch (e) { return EMPTY; }
  }

  // ================================================================
  // WIZARD
  // ================================================================

  _buildWizard() {
    this._wiz = {
      step: 0,
      deviceId: (settings.controller && settings.controller.deviceId) || null,
      padsCache: [],
      listSig: null,
      lastPoll: 0,
      // captured data
      centers: [], mins: [], maxs: [],
      assign: { throttle: null, roll: null, pitch: null, yaw: null }, // {index, invert}
      arm: null,          // {type,index,threshold} | null
      armDir: 1,          // transient: which way the switch moved (verify display only)
      pending: null,      // calibration object built for verify/save
      // per-step transient state
      captured: false,
      stabMin: [], stabMax: [], stabStart: 0,
      holdAxis: -1, holdSign: 0, holdStart: 0,
      armBase: null, armBtnBase: null, armEnter: 0,
      readyAxes: 0,
      barsCount: -1, barRows: [], barsHost: null, barsBand: false,
      ui: {},
    };
    const w = this._wiz;

    const panel = el('div', 'pw-panel pwc-panel');
    const head = el('div', 'pwc-head');
    const title = el('div', 'pwc-title');
    title.appendChild(el('span', 'pwc-t1', 'RADIO '));
    title.appendChild(el('span', 'pwc-t2', 'CALIBRATION'));
    const conn = el('div', 'pwc-conn');
    w.ui.connDot = el('span', 'pwc-conndot');
    w.ui.connName = el('span', 'pwc-connname pw-mono', 'no radio');
    conn.appendChild(w.ui.connDot);
    conn.appendChild(w.ui.connName);
    head.appendChild(title);
    head.appendChild(conn);
    panel.appendChild(head);

    const progress = el('div', 'pwc-progress');
    for (const meta of STEP_META) progress.appendChild(el('div', 'pwc-seg', meta.label));
    w.ui.progress = progress;
    panel.appendChild(progress);

    w.ui.body = el('div', 'pwc-body');
    panel.appendChild(w.ui.body);

    const foot = el('div', 'pwc-foot');
    const cancel = el('button', 'pw-btn danger', 'CANCEL');
    const spacer = el('div', 'pwc-spacer');
    const back = el('button', 'pw-btn', 'BACK');
    const next = el('button', 'pw-btn primary', 'NEXT');
    cancel.addEventListener('click', () => this.close());
    back.addEventListener('click', () => { if (w.step > 0) this._wizGoto(w.step - 1); });
    next.addEventListener('click', () => {
      if (w.step === 0 && this._deviceReady()) this._wizGoto(1);
      else if (w.step === 2 && w.readyAxes >= 4) this._wizGoto(3);
    });
    foot.appendChild(cancel); foot.appendChild(spacer); foot.appendChild(back); foot.appendChild(next);
    w.ui.foot = foot; w.ui.back = back; w.ui.next = next;
    panel.appendChild(foot);

    this._root.appendChild(panel);

    if (w.deviceId) { try { this.radio.selectDevice(w.deviceId); } catch (e) { /* noop */ } }
    this._wizGoto(0);
  }

  _deviceReady() {
    const w = this._wiz;
    return !!(w && w.deviceId && w.padsCache.some(p => p.id === w.deviceId));
  }

  _wizGoto(i) {
    const w = this._wiz;
    if (!w) return;
    w.step = clamp(i, 0, 8) | 0;
    w.captured = false;
    w.stabMin = []; w.stabMax = []; w.stabStart = performance.now();
    w.holdAxis = -1; w.holdSign = 0; w.holdStart = 0;
    w.armBase = null; w.armBtnBase = null; w.armEnter = performance.now();
    w.barsCount = -1; w.barRows = []; w.barsHost = null;
    // clear assignments at/after the step we navigated to
    for (const [si, cfg] of Object.entries(DIR_STEPS)) {
      if (Number(si) >= w.step) w.assign[cfg.control] = null;
    }
    if (w.step <= 7) { w.arm = null; w.armDir = 1; }
    if (w.step <= 1) { w.centers = []; w.mins = []; w.maxs = []; }
    if (w.step === 8) w.pending = this._buildCalibration();

    // progress
    const segs = w.ui.progress.children;
    for (let s = 0; s < segs.length; s++) {
      segs[s].classList.toggle('done', s < w.step);
      segs[s].classList.toggle('cur', s === w.step);
    }

    // body
    w.ui.body.textContent = '';
    const step = el('div', 'pwc-step');
    w.ui.body.appendChild(step);
    switch (w.step) {
      case 0: this._stepDevice(step); break;
      case 1: this._stepCenter(step); break;
      case 2: this._stepRange(step); break;
      case 3: case 4: case 5: case 6: this._stepDirection(step, DIR_STEPS[w.step]); break;
      case 7: this._stepArm(step); break;
      case 8: this._stepVerify(step); break;
    }
    this._wizFooter();
  }

  _wizFooter() {
    const w = this._wiz;
    if (!w) return;
    w.ui.foot.style.display = w.step === 8 ? 'none' : '';
    w.ui.back.disabled = w.step === 0;
    const showNext = w.step === 0 || w.step === 2;
    w.ui.next.style.display = showNext ? '' : 'none';
    if (w.step === 0) w.ui.next.disabled = !this._deviceReady();
    else if (w.step === 2) w.ui.next.disabled = w.readyAxes < 4;
  }

  // ---------------- step builders ----------------

  _stepDevice(host) {
    const w = this._wiz;
    host.appendChild(el('div', 'pwc-instr', 'Connect your radio'));
    const sub = el('div', 'pwc-sub pw-dim');
    sub.textContent = 'Plug your radio in via USB and wiggle a stick so the browser can detect it, then pick it below.';
    host.appendChild(sub);
    w.ui.devlist = el('div', 'pwc-devlist');
    host.appendChild(w.ui.devlist);
    const note = el('div', 'pwc-note pw-dim');
    note.append('The radio must be in USB Joystick (HID) mode. On EdgeTX / OpenTX: plug in USB, then choose ');
    note.appendChild(el('span', 'pw-mono', 'USB Joystick'));
    note.append(' on the radio screen.');
    host.appendChild(note);
    w.listSig = null; // force list render on next tick
    w.lastPoll = 0;
  }

  _stepCenter(host) {
    const w = this._wiz;
    host.appendChild(el('div', 'pwc-instr', 'Center both sticks'));
    const sub = el('div', 'pwc-sub pw-dim');
    sub.textContent = 'Let both sticks rest at center. Throttle can rest anywhere. Hold everything still — centers are captured automatically.';
    host.appendChild(sub);

    const wrap = el('div', 'pwc-ringwrap');
    wrap.innerHTML =
      '<svg class="pwc-ring" viewBox="0 0 64 64">' +
      '<circle class="pwc-ring-bg" cx="32" cy="32" r="27"></circle>' +
      '<circle class="pwc-ring-fg" cx="32" cy="32" r="27"></circle>' +
      '</svg><div class="pwc-ringnum pw-mono">hold</div>';
    host.appendChild(wrap);
    w.ui.ringFg = wrap.querySelector('.pwc-ring-fg');
    w.ui.ringNum = wrap.querySelector('.pwc-ringnum');

    w.ui.axes = el('div', 'pwc-axes');
    host.appendChild(w.ui.axes);
    w.ui.checkwrap = el('div', 'pwc-checkwrap');
    host.appendChild(w.ui.checkwrap);
  }

  _stepRange(host) {
    const w = this._wiz;
    host.appendChild(el('div', 'pwc-instr', 'Sweep the sticks through their FULL range'));
    const sub = el('div', 'pwc-sub pw-dim');
    sub.textContent = 'Move BOTH sticks to all extremes in slow circles — including full throttle up and down. The bars fill out as each axis learns its range.';
    host.appendChild(sub);
    w.ui.axes = el('div', 'pwc-axes');
    host.appendChild(w.ui.axes);
    w.ui.rangeStatus = el('div', 'pwc-detected');
    host.appendChild(w.ui.rangeStatus);
  }

  _stepDirection(host, cfg) {
    const w = this._wiz;
    host.appendChild(el('div', 'pwc-arrow', cfg.arrow));
    host.appendChild(el('div', 'pwc-instr', cfg.instr));
    const sub = el('div', 'pwc-sub pw-dim');
    sub.textContent = cfg.sub + ' Release when the checkmark appears.';
    host.appendChild(sub);
    const hold = el('div', 'pwc-holdbar');
    w.ui.holdFill = el('div', 'pwc-holdfill');
    hold.appendChild(w.ui.holdFill);
    host.appendChild(hold);
    w.ui.detected = el('div', 'pwc-detected', 'waiting for a strong, steady deflection…');
    host.appendChild(w.ui.detected);
    w.ui.checkwrap = el('div', 'pwc-checkwrap');
    host.appendChild(w.ui.checkwrap);
  }

  _stepArm(host) {
    const w = this._wiz;
    host.appendChild(el('div', 'pwc-instr', 'Flip your ARM switch'));
    const sub = el('div', 'pwc-sub pw-dim');
    sub.textContent = 'Flip the switch you want to use for arming. Works with switch axes and buttons. This step is optional.';
    host.appendChild(sub);
    w.ui.detected = el('div', 'pwc-detected', 'listening for a switch…');
    host.appendChild(w.ui.detected);
    w.ui.checkwrap = el('div', 'pwc-checkwrap');
    host.appendChild(w.ui.checkwrap);
    const skipWrap = el('div', 'pwc-bigskip');
    const skip = el('button', 'pw-btn', 'SKIP — NO ARM SWITCH (use Space key)');
    skip.addEventListener('click', () => {
      if (w.captured) return;
      w.arm = null;
      this._wizGoto(8);
    });
    skipWrap.appendChild(skip);
    host.appendChild(skipWrap);
  }

  _stepVerify(host) {
    const w = this._wiz;
    const ok = w.pending && ['throttle', 'roll', 'pitch', 'yaw'].every(k => w.pending.map[k] != null);
    host.appendChild(el('div', 'pwc-instr', 'Verify your sticks'));
    const sub = el('div', 'pwc-sub pw-dim');
    sub.textContent = 'Move everything — the crosses must follow your sticks exactly (Mode 2: left = throttle / yaw, right = pitch / roll).';
    host.appendChild(sub);

    if (!ok) {
      const err = el('div', 'pwc-detected', 'Calibration incomplete — please redo the wizard.');
      host.appendChild(err);
    } else {
      const sticks = el('div', 'pwc-sticks');
      const mk = (label) => {
        const box = el('div', 'pwc-stickbox');
        const cv = this._makeCanvas(150);
        box.appendChild(cv.el);
        box.appendChild(el('div', 'pwc-sticklabel', label));
        sticks.appendChild(box);
        return cv;
      };
      w.ui.leftCv = mk('THROTTLE / YAW');
      w.ui.rightCv = mk('PITCH / ROLL');
      host.appendChild(sticks);

      const thrRow = el('div', 'pwc-vrow');
      thrRow.appendChild(el('div', 'pwc-vlab', 'THROTTLE'));
      const thr = el('div', 'pwc-thr');
      w.ui.thrFill = el('div', 'pwc-thrfill');
      thr.appendChild(w.ui.thrFill);
      thrRow.appendChild(thr);
      w.ui.thrVal = el('span', 'pwc-axval pw-mono', '0.00');
      thrRow.appendChild(w.ui.thrVal);
      const flip = el('button', 'pw-btn', 'FLIP DIR');
      flip.title = 'Reverse throttle direction (use if the bar reads high with the stick down)';
      flip.addEventListener('click', () => {
        const tc = w.pending && w.pending.axes[w.pending.map.throttle];
        if (tc) { tc.invert = !tc.invert; w.thrLowSeen = false; }
      });
      thrRow.appendChild(flip);
      host.appendChild(thrRow);
      w.ui.thrHint = el('div', 'pwc-sub', 'Pull the throttle stick all the way DOWN — it must read 0.00 before you can save. Reads high with the stick down? Hit FLIP DIR.');
      w.ui.thrHint.style.color = 'var(--pw-warn)';
      host.appendChild(w.ui.thrHint);
      w.thrLowSeen = false;

      const armRow = el('div', 'pwc-vrow');
      armRow.appendChild(el('div', 'pwc-vlab', 'ARM'));
      w.ui.armPill = el('div', 'pwc-armpill', w.pending.map.arm ? 'DISARMED' : 'NOT SET');
      armRow.appendChild(w.ui.armPill);
      if (!w.pending.map.arm) armRow.appendChild(el('span', 'pw-dim', 'no switch — arm with the Space key'));
      host.appendChild(armRow);
    }

    const btns = el('div', 'pwc-verifybtns');
    const save = el('button', 'pw-btn primary', 'LOOKS GOOD — SAVE');
    const redo = el('button', 'pw-btn', 'REDO');
    const cancel = el('button', 'pw-btn danger', 'CANCEL');
    w.ui.saveBtn = save;
    save.disabled = !ok;
    save.addEventListener('click', () => this._saveWizard());
    redo.addEventListener('click', () => this._wizGoto(1));
    cancel.addEventListener('click', () => this.close());
    btns.appendChild(save); btns.appendChild(redo); btns.appendChild(cancel);
    host.appendChild(btns);
  }

  // ---------------- wizard per-frame logic ----------------

  _wizTick(now) {
    const w = this._wiz;
    if (!w) return;

    // connection chip
    let connected = false, name = '';
    try { connected = !!this.radio.connected; name = this.radio.deviceName || ''; } catch (e) { /* noop */ }
    w.ui.connDot.classList.toggle('on', connected);
    const label = connected ? (name || 'connected') : 'no radio';
    if (w.ui.connName.textContent !== label) w.ui.connName.textContent = label;

    const axes = this._rawAxes();
    const buttons = this._rawButtons();

    // continuous min/max tracking once centers exist (steps 2..7)
    if (w.step >= 2 && w.step <= 7 && w.centers.length) {
      for (let i = 0; i < axes.length; i++) {
        const v = axes[i];
        if (!Number.isFinite(v)) continue;
        if (i >= w.centers.length) { w.centers.push(v); w.mins.push(v); w.maxs.push(v); continue; }
        if (v < w.mins[i]) w.mins[i] = v;
        if (v > w.maxs[i]) w.maxs[i] = v;
      }
    }

    switch (w.step) {
      case 0: this._tickDevice(now); break;
      case 1: this._tickCenter(now, axes); break;
      case 2: this._tickRange(axes); break;
      case 3: case 4: case 5: case 6: this._tickDirection(now, axes, DIR_STEPS[w.step]); break;
      case 7: this._tickArm(now, axes, buttons); break;
      case 8: this._tickVerify(axes, buttons); break;
    }
  }

  _tickDevice(now) {
    const w = this._wiz;
    if (now - w.lastPoll < 400) return;
    w.lastPoll = now;
    let pads = [];
    try { pads = this.radio.listGamepads() || []; } catch (e) { pads = []; }
    w.padsCache = pads;
    if (pads.length === 1 && !w.deviceId) {
      w.deviceId = pads[0].id;
      try { this.radio.selectDevice(pads[0].id); } catch (e) { /* noop */ }
    }
    const sig = pads.map(p => p.index + '|' + p.id).join('~') + '#' + (w.deviceId || '');
    if (sig !== w.listSig) {
      w.listSig = sig;
      this._renderDevList(pads);
    }
    this._wizFooter();
  }

  _renderDevList(pads) {
    const w = this._wiz;
    const host = w.ui.devlist;
    if (!host) return;
    host.textContent = '';
    if (!pads.length) {
      const d = el('div', 'pwc-waiting');
      d.appendChild(el('div', 'pwc-pulse'));
      d.appendChild(el('div', null, 'No devices detected yet — wiggle a stick on your radio…'));
      host.appendChild(d);
      return;
    }
    for (const p of pads) {
      const b = el('button', 'pwc-dev' + (p.id === w.deviceId ? ' sel' : ''));
      b.appendChild(el('span', 'pwc-devdot'));
      b.appendChild(el('span', 'pwc-devid', p.id));
      b.appendChild(el('span', 'pw-dim', '#' + p.index));
      b.addEventListener('click', () => {
        w.deviceId = p.id;
        try { this.radio.selectDevice(p.id); } catch (e) { /* noop */ }
        w.listSig = null; // re-render selection highlight next poll
        w.lastPoll = 0;
        this._wizFooter();
      });
      host.appendChild(b);
    }
  }

  _tickCenter(now, axes) {
    const w = this._wiz;
    if (w.captured) return;
    if (!axes.length) {
      w.stabMin = []; w.stabMax = []; w.stabStart = now;
      if (w.ui.ringNum) w.ui.ringNum.textContent = '—';
      return;
    }
    this._ensureBars(w.ui.axes, axes.length, false);
    this._updateBarsLive(axes);

    if (w.stabMin.length !== axes.length) {
      w.stabMin = Array.from(axes);
      w.stabMax = Array.from(axes);
      w.stabStart = now;
    }
    let stable = true;
    for (let i = 0; i < axes.length; i++) {
      if (axes[i] < w.stabMin[i]) w.stabMin[i] = axes[i];
      if (axes[i] > w.stabMax[i]) w.stabMax[i] = axes[i];
      if (w.stabMax[i] - w.stabMin[i] > STAB_TOLERANCE) stable = false;
    }
    if (!stable) {
      w.stabMin = Array.from(axes);
      w.stabMax = Array.from(axes);
      w.stabStart = now;
    }
    const frac = clamp((now - w.stabStart) / STAB_MS, 0, 1);
    if (w.ui.ringFg) w.ui.ringFg.style.strokeDashoffset = String(RING_C * (1 - frac));
    if (w.ui.ringNum) w.ui.ringNum.textContent = frac > 0.02 ? ((1 - frac) * (STAB_MS / 1000)).toFixed(1) : 'hold';

    if (frac >= 1) {
      w.captured = true;
      w.centers = w.stabMin.map((mn, i) => (mn + w.stabMax[i]) / 2);
      w.mins = Array.from(w.centers);
      w.maxs = Array.from(w.centers);
      if (w.ui.ringNum) w.ui.ringNum.textContent = 'OK';
      this._showCheck(w.ui.checkwrap);
      const step = w.step;
      setTimeout(() => {
        if (this._wiz === w && this._mode === 'wizard' && w.step === step) this._wizGoto(2);
      }, 750);
    }
  }

  _tickRange(axes) {
    const w = this._wiz;
    if (!axes.length || !w.centers.length) {
      if (w.ui.rangeStatus) w.ui.rangeStatus.textContent = 'waiting for radio signal…';
      return;
    }
    this._ensureBars(w.ui.axes, Math.min(axes.length, w.centers.length), true);
    let ready = 0;
    for (let i = 0; i < w.barRows.length; i++) {
      const row = w.barRows[i];
      const min = w.mins[i], max = w.maxs[i], range = max - min;
      const ok = range > RANGE_READY;
      if (ok) ready++;
      const leftPct = clamp((min + 1) / 2, 0, 1) * 100;
      const widPct = clamp(range / 2, 0, 1) * 100;
      row.band.style.left = leftPct + '%';
      row.band.style.width = widPct + '%';
      row.band.classList.toggle('ok', ok);
      row.cline.style.left = (clamp((w.centers[i] + 1) / 2, 0, 1) * 100) + '%';
      row.dot.style.left = (clamp((axes[i] + 1) / 2, 0, 1) * 100) + '%';
      const txt = Math.round(clamp(range / 2, 0, 1) * 100) + '%';
      if (row.val.textContent !== txt) row.val.textContent = txt;
      row.val.classList.toggle('ok', ok);
    }
    w.readyAxes = ready;
    const status = ready >= 4
      ? ready + ' axes ready — press NEXT'
      : ready + ' / 4 axes ready… keep sweeping';
    if (w.ui.rangeStatus.textContent !== status) w.ui.rangeStatus.textContent = status;
    w.ui.rangeStatus.classList.toggle('ok', ready >= 4);
    w.ui.next.disabled = ready < 4;
  }

  _tickDirection(now, axes, cfg) {
    const w = this._wiz;
    if (w.captured || !axes.length || !w.centers.length) return;

    // find the strongest deflection among unassigned axes
    let best = -1, bestD = 0;
    for (let i = 0; i < axes.length && i < w.centers.length; i++) {
      if (this._axisAssigned(i)) continue;
      const range = w.maxs[i] - w.mins[i];
      if (range < 0.5) continue;
      const d = (axes[i] - w.centers[i]) / (range * 0.5);
      if (Math.abs(d) > Math.abs(bestD)) { bestD = d; best = i; }
    }

    if (best >= 0 && Math.abs(bestD) > HOLD_DEFLECT) {
      const sign = bestD >= 0 ? 1 : -1;
      if (w.holdAxis !== best || w.holdSign !== sign) {
        w.holdAxis = best;
        w.holdSign = sign;
        w.holdStart = now;
      }
      const frac = clamp((now - w.holdStart) / HOLD_MS, 0, 1);
      w.ui.holdFill.style.width = (frac * 100) + '%';
      const msg = 'axis ' + best + ' · ' + Math.round(Math.abs(clamp(bestD, -1, 1)) * 100) + '% · hold…';
      if (w.ui.detected.textContent !== msg) w.ui.detected.textContent = msg;
      w.ui.detected.classList.remove('ok');

      if (frac >= 1) {
        w.captured = true;
        const invert = w.holdSign < 0; // expected direction = +1 output
        w.assign[cfg.control] = { index: best, invert };
        w.ui.holdFill.style.width = '100%';
        w.ui.detected.textContent =
          cfg.control.toUpperCase() + ' → AXIS ' + best + (invert ? ' (inverted)' : '');
        w.ui.detected.classList.add('ok');
        this._showCheck(w.ui.checkwrap);
        const step = w.step;
        setTimeout(() => {
          if (this._wiz === w && this._mode === 'wizard' && w.step === step) this._wizGoto(step + 1);
        }, 900);
      }
    } else {
      w.holdAxis = -1;
      w.holdStart = 0;
      w.ui.holdFill.style.width = '0%';
      const idle = 'waiting for a strong, steady deflection…';
      if (w.ui.detected.textContent !== idle) w.ui.detected.textContent = idle;
      w.ui.detected.classList.remove('ok');
    }
  }

  _axisAssigned(i) {
    const a = this._wiz.assign;
    return (a.throttle && a.throttle.index === i) ||
           (a.roll && a.roll.index === i) ||
           (a.pitch && a.pitch.index === i) ||
           (a.yaw && a.yaw.index === i);
  }

  _tickArm(now, axes, buttons) {
    const w = this._wiz;
    if (w.captured) return;
    // settle for 250ms after entering, then snapshot rest positions
    if (!w.armBase) {
      if (now - w.armEnter < 250) return;
      w.armBase = Array.from(axes);
      w.armBtnBase = Array.from(buttons);
      return;
    }
    let det = null, dir = 1, desc = '';
    // buttons: any new press
    for (let b = 0; b < buttons.length; b++) {
      const base = b < w.armBtnBase.length ? w.armBtnBase[b] : 0;
      if (buttons[b] > 0.6 && base <= 0.4) {
        det = { type: 'button', index: b, threshold: 0.5 };
        desc = 'BUTTON ' + b;
        break;
      }
    }
    // axes: any crossing +-0.5 from rest (skip the four flight axes)
    if (!det) {
      for (let i = 0; i < axes.length; i++) {
        if (this._axisAssigned(i)) continue;
        const base = i < w.armBase.length ? w.armBase[i] : 0;
        const dv = axes[i] - base;
        if (Math.abs(dv) > 0.5) {
          det = { type: 'axis', index: i, threshold: round3(base + dv / 2) };
          dir = dv >= 0 ? 1 : -1;
          desc = 'AXIS ' + i;
          break;
        }
      }
    }
    if (det) {
      w.captured = true;
      w.arm = det;
      w.armDir = dir;
      w.ui.detected.textContent = 'ARM → ' + desc;
      w.ui.detected.classList.add('ok');
      this._showCheck(w.ui.checkwrap);
      const step = w.step;
      setTimeout(() => {
        if (this._wiz === w && this._mode === 'wizard' && w.step === step) this._wizGoto(8);
      }, 900);
    }
  }

  _tickVerify(axes, buttons) {
    const w = this._wiz;
    if (!w.pending || !w.ui.leftCv) return;
    const out = this._computeOut(w.pending, axes, this._out);
    this._drawCross(w.ui.leftCv, out.yaw, out.throttle * 2 - 1);
    this._drawCross(w.ui.rightCv, out.roll, out.pitch);
    w.ui.thrFill.style.width = (out.throttle * 100) + '%';
    const tv = out.throttle.toFixed(2);
    if (w.ui.thrVal.textContent !== tv) w.ui.thrVal.textContent = tv;

    // gate SAVE on a confirmed throttle-zero so an inverted throttle can never
    // be saved (it silently blocks arming later)
    if (!w.thrLowSeen && out.throttle < 0.06) {
      w.thrLowSeen = true;
      if (w.ui.thrHint) {
        w.ui.thrHint.textContent = '✓ Throttle zero confirmed';
        w.ui.thrHint.style.color = 'var(--pw-ok)';
      }
    }
    if (w.ui.saveBtn) w.ui.saveBtn.disabled = !w.thrLowSeen;

    const armCfg = w.pending.map.arm;
    if (armCfg && w.ui.armPill) {
      let armed = false;
      if (armCfg.type === 'button') {
        armed = (buttons[armCfg.index] || 0) > (armCfg.threshold != null ? armCfg.threshold : 0.5);
      } else {
        const v = axes[armCfg.index] != null ? axes[armCfg.index] : 0;
        armed = w.armDir < 0 ? v < armCfg.threshold : v > armCfg.threshold;
      }
      w.ui.armPill.classList.toggle('on', armed);
      const txt = armed ? 'ARMED' : 'DISARMED';
      if (w.ui.armPill.textContent !== txt) w.ui.armPill.textContent = txt;
    }
  }

  // ---------------- wizard shared widgets ----------------

  _ensureBars(host, count, withBand) {
    const w = this._wiz;
    if (!host) return;
    if (w.barsHost === host && w.barsCount === count && w.barsBand === withBand) return;
    host.textContent = '';
    w.barRows = [];
    for (let i = 0; i < count; i++) {
      const row = el('div', 'pwc-axis');
      row.appendChild(el('span', 'pwc-axname', 'A' + i));
      const track = el('div', 'pwc-track');
      const band = el('div', 'pwc-band');
      const cline = el('div', 'pwc-cline');
      const dot = el('div', 'pwc-dot');
      if (withBand) track.appendChild(band);
      track.appendChild(cline);
      track.appendChild(dot);
      row.appendChild(track);
      const val = el('span', 'pwc-axval');
      row.appendChild(val);
      host.appendChild(row);
      w.barRows.push({ band, cline, dot, val });
    }
    w.barsHost = host;
    w.barsCount = count;
    w.barsBand = withBand;
  }

  _updateBarsLive(axes) {
    const w = this._wiz;
    for (let i = 0; i < w.barRows.length && i < axes.length; i++) {
      const row = w.barRows[i];
      row.cline.style.left = '50%';
      row.dot.style.left = (clamp((axes[i] + 1) / 2, 0, 1) * 100) + '%';
      const txt = fmtSigned(axes[i], 2);
      if (row.val.textContent !== txt) row.val.textContent = txt;
    }
  }

  _showCheck(host) {
    if (!host) return;
    host.textContent = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 52 52');
    svg.setAttribute('class', 'pwc-check');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '26'); circle.setAttribute('cy', '26'); circle.setAttribute('r', '24');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M14 27l8 8 16-16');
    svg.appendChild(circle);
    svg.appendChild(path);
    host.appendChild(svg);
  }

  _makeCanvas(px) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const c = el('canvas', 'pwc-canvas');
    c.width = Math.round(px * dpr);
    c.height = Math.round(px * dpr);
    c.style.width = px + 'px';
    c.style.height = px + 'px';
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    return { el: c, ctx, size: px };
  }

  _drawCross(cv, x, y) {
    const { ctx, size: s } = cv;
    ctx.clearRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(120,180,220,0.22)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, s - 1, s - 1);
    ctx.beginPath();
    ctx.moveTo(s / 2, 5); ctx.lineTo(s / 2, s - 5);
    ctx.moveTo(5, s / 2); ctx.lineTo(s - 5, s / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s * 0.32, 0, Math.PI * 2);
    ctx.stroke();
    const px = (clamp(x, -1, 1) * 0.5 + 0.5) * (s - 18) + 9;
    const py = (0.5 - clamp(y, -1, 1) * 0.5) * (s - 18) + 9;
    ctx.save();
    ctx.shadowColor = ACCENT;
    ctx.shadowBlur = 12;
    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _computeOut(cal, axes, out) {
    const m = cal.map;
    out.throttle = calibratedAxis(cal.axes[m.throttle], axes[m.throttle] != null ? axes[m.throttle] : 0, true);
    out.roll = calibratedAxis(cal.axes[m.roll], axes[m.roll] != null ? axes[m.roll] : 0, false);
    out.pitch = calibratedAxis(cal.axes[m.pitch], axes[m.pitch] != null ? axes[m.pitch] : 0, false);
    out.yaw = calibratedAxis(cal.axes[m.yaw], axes[m.yaw] != null ? axes[m.yaw] : 0, false);
    return out;
  }

  // ---------------- build + save ----------------

  _buildCalibration() {
    const w = this._wiz;
    const a = w.assign;
    if (!a.throttle || !a.roll || !a.pitch || !a.yaw) return null;
    const axesData = {};
    const n = w.centers.length;
    for (let i = 0; i < n; i++) {
      let min = w.mins[i], max = w.maxs[i];
      const center = w.centers[i];
      if (!(max - min > 0.2)) { min = center - 1; max = center + 1; } // never-moved axis: safe span
      axesData[i] = { min, max, center, invert: false, deadband: 0.02, trim: 0 };
    }
    for (const key of ['throttle', 'roll', 'pitch', 'yaw']) {
      const asn = a[key];
      if (!axesData[asn.index]) {
        axesData[asn.index] = { min: -1, max: 1, center: 0, invert: false, deadband: 0.02, trim: 0 };
      }
      axesData[asn.index].invert = !!asn.invert;
      if (key === 'throttle') axesData[asn.index].deadband = 0;
    }
    return {
      axes: axesData,
      map: {
        throttle: a.throttle.index,
        roll: a.roll.index,
        pitch: a.pitch.index,
        yaw: a.yaw.index,
        arm: w.arm ? { type: w.arm.type, index: w.arm.index, threshold: w.arm.threshold, direction: w.armDir || 1 } : null,
      },
    };
  }

  _saveWizard() {
    const w = this._wiz;
    if (!w || !w.pending) return;
    settings.controller.calibration = w.pending;
    let padId = w.deviceId;
    if (!padId) { try { padId = this.radio.deviceName || null; } catch (e) { padId = null; } }
    settings.controller.deviceId = padId;
    saveSettings();
    emit('settings:changed', { path: 'controller' });
    emit('osd:flash', { text: 'RADIO CALIBRATION SAVED', ms: 1600 });
    this.close();
  }

  // ================================================================
  // FINE-TUNE PANEL
  // ================================================================

  _buildFineTune() {
    const cal = settings.controller && settings.controller.calibration;
    const hasCal = !!(cal && cal.map && cal.map.throttle != null && cal.map.roll != null &&
                      cal.map.pitch != null && cal.map.yaw != null);
    this._ft = { hasCal, cal, rows: {}, listen: null, ui: {} };
    const ft = this._ft;

    const panel = el('div', 'pw-panel pwc-panel');
    this._root.appendChild(panel);

    const x = el('button', 'pwc-x', '×');
    x.setAttribute('aria-label', 'Close');
    x.addEventListener('click', () => this.close());
    panel.appendChild(x);

    const head = el('div', 'pwc-head');
    const title = el('div', 'pwc-title');
    title.appendChild(el('span', 'pwc-t1', 'STICK '));
    title.appendChild(el('span', 'pwc-t2', 'FINE-TUNE'));
    const conn = el('div', 'pwc-conn');
    ft.ui.connDot = el('span', 'pwc-conndot');
    ft.ui.connName = el('span', 'pwc-connname pw-mono', 'no radio');
    conn.appendChild(ft.ui.connDot);
    conn.appendChild(ft.ui.connName);
    head.appendChild(title);
    head.appendChild(conn);
    panel.appendChild(head);

    if (!hasCal) {
      const empty = el('div', 'pwc-empty');
      empty.appendChild(el('div', 'pwc-instr', 'No calibration yet'));
      const sub = el('div', 'pwc-sub pw-dim');
      sub.textContent = 'Run the calibration wizard first — it maps your sticks and learns their ranges. Fine-tuning unlocks after that.';
      empty.appendChild(sub);
      const btns = el('div', 'pwc-emptybtns');
      const start = el('button', 'pw-btn primary', 'START CALIBRATION WIZARD');
      start.addEventListener('click', () => this.startWizard());
      const closeB = el('button', 'pw-btn', 'CLOSE');
      closeB.addEventListener('click', () => this.close());
      btns.appendChild(start);
      btns.appendChild(closeB);
      empty.appendChild(btns);
      panel.appendChild(empty);
      return;
    }

    // ensure axis entries exist for every mapped axis
    if (!cal.axes) cal.axes = {};
    for (const ch of CHANNELS) {
      const idx = cal.map[ch.key];
      if (!cal.axes[idx]) {
        cal.axes[idx] = { min: -1, max: 1, center: 0, invert: false, deadband: ch.unipolar ? 0 : 0.02, trim: 0 };
      }
      if (typeof cal.axes[idx].trim !== 'number') cal.axes[idx].trim = 0;
      if (typeof cal.axes[idx].deadband !== 'number') cal.axes[idx].deadband = ch.unipolar ? 0 : 0.02;
    }

    const sub = el('div', 'pw-dim', 'Live calibrated outputs. Changes apply immediately — nudge trims until each stick reads exactly zero at rest.');
    sub.style.margin = '8px 0 4px';
    panel.appendChild(sub);

    for (const ch of CHANNELS) this._buildFtRow(panel, ch);

    // ---- arm switch section ----
    panel.appendChild(el('div', 'pw-h2', 'Arm switch'));
    const armCard = el('div', 'pwc-ch');
    const armRow = el('div', 'pwc-armrow');
    ft.ui.armPill = el('div', 'pwc-armpill', '—');
    armRow.appendChild(ft.ui.armPill);
    ft.ui.armDesc = el('div', 'pwc-armdesc');
    armRow.appendChild(ft.ui.armDesc);
    ft.ui.armAssign = el('button', 'pw-btn', 'REASSIGN');
    ft.ui.armAssign.addEventListener('click', () => this._ftToggleArmListen());
    armRow.appendChild(ft.ui.armAssign);
    ft.ui.armClear = el('button', 'pw-btn danger', 'CLEAR');
    ft.ui.armClear.addEventListener('click', () => {
      ft.listen = null;
      this._ftArmListenUI();
      cal.map.arm = null;
      this._ftArmRefresh();
      this._ftSave();
    });
    armRow.appendChild(ft.ui.armClear);
    armCard.appendChild(armRow);
    ft.ui.armListen = el('div', 'pwc-listen', 'Flip the switch (or press the button) you want as ARM now…');
    armCard.appendChild(ft.ui.armListen);
    panel.appendChild(armCard);
    this._ftArmRefresh();

    // ---- footer ----
    const foot = el('div', 'pwc-ftfoot');
    const rerun = el('button', 'pw-btn', 'RE-RUN FULL WIZARD');
    rerun.addEventListener('click', () => this.startWizard());
    const resetTrims = el('button', 'pw-btn danger', 'RESET TRIMS');
    resetTrims.addEventListener('click', () => {
      for (const ch of CHANNELS) {
        const a = cal.axes[cal.map[ch.key]];
        if (a) a.trim = 0;
        const row = ft.rows[ch.key];
        if (row) row.trimVal.textContent = fmtSigned(0, 3);
      }
      this._ftSave();
    });
    const spacer = el('div', 'pwc-spacer');
    const closeB = el('button', 'pw-btn primary', 'CLOSE');
    closeB.addEventListener('click', () => this.close());
    foot.appendChild(rerun); foot.appendChild(resetTrims); foot.appendChild(spacer); foot.appendChild(closeB);
    panel.appendChild(foot);
  }

  _buildFtRow(panel, ch) {
    const ft = this._ft;
    const cal = ft.cal;
    const idx = cal.map[ch.key];
    const a = cal.axes[idx];

    const card = el('div', 'pwc-ch');

    // top line: name | live bar | value
    const top = el('div', 'pwc-chtop');
    top.appendChild(el('span', 'pwc-chname', ch.name));
    top.appendChild(el('span', 'pwc-chax', 'axis ' + idx));
    const track = el('div', 'pwc-ftrack');
    const cline = el('div', 'pwc-fcline');
    cline.style.left = ch.unipolar ? '0%' : '50%';
    const fill = el('div', 'pwc-ffill');
    const dot = el('div', 'pwc-fdot');
    track.appendChild(fill);
    track.appendChild(cline);
    track.appendChild(dot);
    top.appendChild(track);
    const val = el('span', 'pwc-fval', ch.unipolar ? '0.000' : '+0.000');
    top.appendChild(val);
    card.appendChild(top);

    // control line: trim -/+ | zero | deadband | invert
    const ctl = el('div', 'pwc-chctl');
    ctl.appendChild(el('span', 'pwc-ctlab', 'TRIM'));
    const minus = el('button', 'pw-btn pwc-trimbtn', '−');
    const trimVal = el('span', 'pwc-trimval', fmtSigned(a.trim || 0, 3));
    const plus = el('button', 'pw-btn pwc-trimbtn', '+');
    ctl.appendChild(minus);
    ctl.appendChild(trimVal);
    ctl.appendChild(plus);
    const bump = (dir) => {
      a.trim = round3(clamp((a.trim || 0) + dir * 0.002, -0.5, 0.5));
      trimVal.textContent = fmtSigned(a.trim, 3);
      this._ftSave();
    };
    bindHold(minus, () => bump(-1));
    bindHold(plus, () => bump(1));

    if (!ch.unipolar) {
      const zero = el('button', 'pw-btn pwc-zero', 'SET CURRENT AS CENTER');
      zero.title = 'Adjusts trim so this stick reads exactly 0 right now — the fastest drift fix.';
      zero.addEventListener('click', () => {
        let cur = 0;
        try {
          const c = this.radio.controls;
          cur = c && Number.isFinite(c[ch.key]) ? c[ch.key] : 0;
        } catch (e) { cur = 0; }
        a.trim = round3(clamp((a.trim || 0) - cur, -0.5, 0.5));
        trimVal.textContent = fmtSigned(a.trim, 3);
        this._ftSave();
      });
      ctl.appendChild(zero);
    }

    ctl.appendChild(el('span', 'pwc-ctlab', 'DEADBAND'));
    const db = el('input', 'pw-slider pwc-db');
    db.type = 'range';
    db.min = '0'; db.max = '0.10'; db.step = '0.005';
    db.value = String(a.deadband || 0);
    const dbVal = el('span', 'pwc-dbval', (a.deadband || 0).toFixed(3));
    db.addEventListener('input', () => {
      const v = clamp(parseFloat(db.value) || 0, 0, 0.10);
      a.deadband = v;
      dbVal.textContent = v.toFixed(3);
      this._ftSave();
    });
    ctl.appendChild(db);
    ctl.appendChild(dbVal);

    const invLabel = el('label', 'pwc-inv');
    const inv = el('input');
    inv.type = 'checkbox';
    inv.checked = !!a.invert;
    inv.addEventListener('change', () => {
      a.invert = inv.checked;
      this._ftSave();
    });
    invLabel.appendChild(inv);
    invLabel.append('INVERT');
    ctl.appendChild(invLabel);

    card.appendChild(ctl);
    panel.appendChild(card);
    ft.rows[ch.key] = { fill, dot, val, trimVal, unipolar: ch.unipolar };
  }

  _ftSave() {
    saveSettings();
    emit('settings:changed', { path: 'controller' });
  }

  _ftArmRefresh() {
    const ft = this._ft;
    if (!ft || !ft.ui.armDesc) return;
    const arm = ft.cal.map.arm;
    if (!arm) {
      ft.ui.armDesc.textContent = 'not set — arm with the Space key';
      ft.ui.armClear.disabled = true;
    } else if (arm.type === 'button') {
      ft.ui.armDesc.textContent = 'BUTTON ' + arm.index;
      ft.ui.armClear.disabled = false;
    } else {
      const th = Number.isFinite(arm.threshold) ? arm.threshold : 0;
      ft.ui.armDesc.textContent = 'AXIS ' + arm.index + ' · threshold ' + fmtSigned(th, 2);
      ft.ui.armClear.disabled = false;
    }
  }

  _ftToggleArmListen() {
    const ft = this._ft;
    if (ft.listen) {
      ft.listen = null;
    } else {
      ft.listen = { t0: performance.now(), base: null, btnBase: null };
    }
    this._ftArmListenUI();
  }

  _ftArmListenUI() {
    const ft = this._ft;
    if (!ft || !ft.ui.armListen) return;
    ft.ui.armListen.classList.toggle('show', !!ft.listen);
    ft.ui.armAssign.textContent = ft.listen ? 'CANCEL' : 'REASSIGN';
    ft.ui.armAssign.classList.toggle('danger', !!ft.listen);
  }

  _ftTick(now) {
    const ft = this._ft;
    if (!ft) return;

    let connected = false, name = '';
    try { connected = !!this.radio.connected; name = this.radio.deviceName || ''; } catch (e) { /* noop */ }
    if (ft.ui.connDot) {
      ft.ui.connDot.classList.toggle('on', connected);
      const label = connected ? (name || 'connected') : 'no radio';
      if (ft.ui.connName.textContent !== label) ft.ui.connName.textContent = label;
    }

    if (!ft.hasCal) return;

    // live calibrated outputs (exactly what radio.js computes)
    let ctr = null;
    try { ctr = this.radio.controls; } catch (e) { ctr = null; }
    for (const ch of CHANNELS) {
      const row = ft.rows[ch.key];
      if (!row) continue;
      const v = ctr && Number.isFinite(ctr[ch.key]) ? ctr[ch.key] : 0;
      if (row.unipolar) {
        const t = clamp(v, 0, 1);
        row.fill.style.left = '0%';
        row.fill.style.width = (t * 100) + '%';
        row.dot.style.left = (t * 100) + '%';
        const txt = t.toFixed(3);
        if (row.val.textContent !== txt) row.val.textContent = txt;
      } else {
        const s = clamp(v, -1, 1);
        if (s >= 0) {
          row.fill.style.left = '50%';
          row.fill.style.width = (s * 50) + '%';
        } else {
          row.fill.style.left = (50 + s * 50) + '%';
          row.fill.style.width = (-s * 50) + '%';
        }
        row.dot.style.left = (50 + s * 50) + '%';
        const txt = fmtSigned(s, 3);
        if (row.val.textContent !== txt) row.val.textContent = txt;
      }
    }

    // arm pill from calibrated arm switch
    if (ft.ui.armPill) {
      const armState = ctr ? ctr.armSwitch : null;
      let txt, on = false;
      if (!ft.cal.map.arm || armState === null || armState === undefined) txt = '—';
      else if (armState) { txt = 'ARMED'; on = true; }
      else txt = 'DISARMED';
      ft.ui.armPill.classList.toggle('on', on);
      if (ft.ui.armPill.textContent !== txt) ft.ui.armPill.textContent = txt;
    }

    // arm reassignment listening
    if (ft.listen) {
      const axes = this._rawAxes();
      const buttons = this._rawButtons();
      if (!ft.listen.base) {
        if (now - ft.listen.t0 >= 250) {
          ft.listen.base = Array.from(axes);
          ft.listen.btnBase = Array.from(buttons);
        }
        return;
      }
      const flightAxes = [ft.cal.map.throttle, ft.cal.map.roll, ft.cal.map.pitch, ft.cal.map.yaw];
      let det = null;
      for (let b = 0; b < buttons.length; b++) {
        const base = b < ft.listen.btnBase.length ? ft.listen.btnBase[b] : 0;
        if (buttons[b] > 0.6 && base <= 0.4) { det = { type: 'button', index: b, threshold: 0.5 }; break; }
      }
      if (!det) {
        for (let i = 0; i < axes.length; i++) {
          if (flightAxes.indexOf(i) !== -1) continue;
          const base = i < ft.listen.base.length ? ft.listen.base[i] : 0;
          const dv = axes[i] - base;
          if (Math.abs(dv) > 0.5) { det = { type: 'axis', index: i, threshold: round3(base + dv / 2) }; break; }
        }
      }
      if (det) {
        ft.cal.map.arm = det;
        ft.listen = null;
        this._ftArmListenUI();
        this._ftArmRefresh();
        this._ftSave();
      }
    }
  }
}
