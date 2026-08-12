// ============================================================
// PropWash FPV — airframe health HUD
//
// A top-down schematic of the quad drawn as inline SVG: centre plate,
// four arms, four prop discs, nose marker. Each prop disc is tinted by
// its own health, the plate and arms by the frame health:
//
//   > 0.85  green   #37e08b     0.30-0.01  red    #ff4d4d
//   0.85-0.60 yellow #ffd166    <= 0.01    black  #111 (dashed, broken)
//   0.60-0.30 orange #ff8c42
//
// Colours cross-fade through the bands instead of snapping, so a prop
// that is slowly chewing itself up reads as a slide from green to red.
//
// Placement: TOP-RIGHT, directly under the OSD flight timer. The other
// corners are taken (top-left drone name, bottom-left battery,
// bottom-centre home/armed, bottom-right RSSI) and the right-middle
// speed/altitude block does not start until 50% height.
//
// Integration (js/main.js owns the wiring):
//   const health = new HealthUI(document.getElementById('osd-root'));
//   health.update(quad.damage);                    // every frame
//   health.setVisible(!losMode && !menuOpen);
//
// Every value is quantised to 0.02 and cached — a frame that changes
// nothing performs zero DOM writes.
// ============================================================

const DEAD = 0.01;          // at or below this a prop is gone
const QUANT = 0.02;         // health resolution that can move the DOM
const CRIT_OVERALL = 0.25;  // panel pulses red below this

// ---- colour ramp -------------------------------------------------
const C_GREEN = [0x37, 0xe0, 0x8b];
const C_YELLOW = [0xff, 0xd1, 0x66];
const C_ORANGE = [0xff, 0x8c, 0x42];
const C_RED = [0xff, 0x4d, 0x4d];
const C_BLACK = 'rgb(17,17,17)';

// Anchors are placed inside each band, so a health that sits squarely in a
// band gets that band's exact colour and only the boundaries blend.
const RAMP = [
  [1.00, C_GREEN],
  [0.86, C_GREEN],
  [0.72, C_YELLOW],
  [0.60, C_YELLOW],
  [0.45, C_ORANGE],
  [0.30, C_ORANGE],
  [0.16, C_RED],
  [0.02, C_RED],
];

function healthColor(h) {
  if (!(h > DEAD)) return C_BLACK;
  if (h >= 1) return 'rgb(55,224,139)';
  for (let i = 0; i < RAMP.length - 1; i++) {
    const hi = RAMP[i], lo = RAMP[i + 1];
    if (h <= hi[0] && h >= lo[0]) {
      const span = hi[0] - lo[0];
      const t = span > 1e-6 ? (h - lo[0]) / span : 1;
      const a = lo[1], b = hi[1];
      const r = Math.round(a[0] + (b[0] - a[0]) * t);
      const g = Math.round(a[1] + (b[1] - a[1]) * t);
      const bl = Math.round(a[2] + (b[2] - a[2]) * t);
      return 'rgb(' + r + ',' + g + ',' + bl + ')';
    }
  }
  return 'rgb(255,77,77)';
}

// ---- geometry ----------------------------------------------------
const CX = 60, CY = 54, ARM = 26, DISC = 17;
// Screen order matches quad.damage.props (nose up, viewed from above):
//   0 front-right, 1 rear-right, 2 rear-left, 3 front-left
const HUBS = [
  [CX + ARM, CY - ARM],
  [CX + ARM, CY + ARM],
  [CX - ARM, CY + ARM],
  [CX - ARM, CY - ARM],
];

function propSvg(i) {
  const x = HUBS[i][0], y = HUBS[i][1];
  const lx = x + (x > CX ? 6.4 : -6.4);
  const ly = y + (y > CY ? 6.4 : -6.4);
  return (
    '<g class="pw-hp-prop" data-i="' + i + '">' +
    '<circle class="pw-hp-disc" cx="' + x + '" cy="' + y + '" r="' + DISC + '"/>' +
    '<circle class="pw-hp-hub" cx="' + x + '" cy="' + y + '" r="3.1"/>' +
    '<text class="pw-hp-num" x="' + lx + '" y="' + ly + '">' + (i + 1) + '</text>' +
    '</g>'
  );
}

// Arms start at the plate corners, not the centre, so the schematic reads as a
// body with four arms instead of a big X.
function armPath() {
  let d = '';
  for (let i = 0; i < 4; i++) {
    const x = HUBS[i][0], y = HUBS[i][1];
    d += 'M' + (CX + (x > CX ? 9.5 : -9.5)) + ' ' + (CY + (y > CY ? 12 : -12)) + 'L' + x + ' ' + y;
  }
  return d;
}

const SVG = (
  '<svg class="pw-hp-svg" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<g class="pw-hp-frame">' +
      '<path class="pw-hp-arm" d="' + armPath() + '"/>' +
      '<rect class="pw-hp-body" x="' + (CX - 13) + '" y="' + (CY - 17) + '" width="26" height="34" rx="4"/>' +
    '</g>' +
    '<polygon class="pw-hp-nose" points="60,3 65.5,13.5 54.5,13.5"/>' +
    propSvg(0) + propSvg(1) + propSvg(2) + propSvg(3) +
  '</svg>'
);

const CSS = `
.pw-health {
  position: absolute; top: calc(3.5% + 30px); right: 4.5%;
  width: 120px; padding: 7px 7px 5px;
  background: rgba(6, 7, 9, 0.42);
  border: 1px solid var(--pw-line, rgba(240,240,250,0.16));
  border-radius: var(--pw-radius, 2px);
  font-family: var(--pw-mono, "Consolas", "Cascadia Mono", monospace);
  pointer-events: none;
}
.pw-health * { pointer-events: none; }

.pw-health .pw-hp-svg {
  display: block; width: 100%; height: auto;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.85));
}

/* thin lines, low chrome — the colour is the signal */
.pw-health .pw-hp-arm {
  stroke: currentColor; stroke-width: 3.4; stroke-linecap: round; fill: none;
}
.pw-health .pw-hp-body {
  stroke: currentColor; stroke-width: 1.6;
  fill: currentColor; fill-opacity: 0.16;
}
.pw-health .pw-hp-nose { fill: rgba(240,240,250,0.7); }

.pw-health .pw-hp-disc {
  stroke: currentColor; stroke-width: 1.6;
  fill: currentColor; fill-opacity: 0.12;
  transition: stroke-dasharray 0.15s linear;
}
.pw-health .pw-hp-hub { fill: currentColor; }
.pw-health .pw-hp-num {
  fill: currentColor; font-size: 8px; font-weight: 700;
  letter-spacing: 0; opacity: 0.75;
  text-anchor: middle; dominant-baseline: central;
  font-family: var(--pw-mono, monospace);
}

/* Destroyed prop: black, dashed, broken. The faint white rim is what keeps a
   #111 disc readable against a dark scene — without it the prop simply
   vanishes instead of reading as "gone". The hub stays grey: the motor is
   still there, the prop is not. */
.pw-health .pw-hp-prop.dead {
  filter: drop-shadow(0 0 1.6px rgba(255, 255, 255, 0.55));
}
.pw-health .pw-hp-prop.dead .pw-hp-disc {
  stroke-dasharray: 4.5 4;
  stroke-width: 1.7;
  fill-opacity: 0.9;
}
.pw-health .pw-hp-prop.dead .pw-hp-hub { fill: rgba(240, 240, 250, 0.4); }
.pw-health .pw-hp-prop.dead .pw-hp-num { fill: rgba(240, 240, 250, 0.62); opacity: 1; }

.pw-health .pw-hp-read {
  margin-top: 3px; text-align: center;
  font-size: 11px; letter-spacing: 2px; line-height: 1.2;
  color: var(--pw-dim, #8a8a96);
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
}
.pw-health .pw-hp-pct { font-weight: 700; }

/* Short windows: the OSD's right-middle speed block starts at 50% height, so
   shrink rather than run into it. The SVG is width-driven, so width is the
   only lever needed. */
@media (max-height: 620px) {
  .pw-health { width: 96px; padding: 6px 6px 4px; }
  .pw-health .pw-hp-read { font-size: 10px; letter-spacing: 1px; }
}
@media (max-height: 430px) {
  .pw-health { width: 76px; padding: 4px 4px 3px; }
  .pw-health .pw-hp-read { font-size: 9px; letter-spacing: 0.5px; }
}

.pw-health.crit { animation: pw-health-pulse 0.85s ease-in-out infinite; }
@keyframes pw-health-pulse {
  0%, 100% { border-color: var(--pw-line, rgba(240,240,250,0.16)); background: rgba(6,7,9,0.42); }
  50% { border-color: rgba(255,77,77,0.95); background: rgba(86,10,10,0.5); }
}
`;

const STYLE_ID = 'pw-health-style';
let styleRefs = 0;

export class HealthUI {
  /** @param {HTMLElement} containerEl usually #osd-root */
  constructor(containerEl) {
    this.container = containerEl || document.body;
    this._injectCSS();

    this.root = document.createElement('div');
    this.root.className = 'pw-health';
    this.root.setAttribute('aria-hidden', 'true');
    this.root.innerHTML = SVG +
      '<div class="pw-hp-read">HULL <span class="pw-hp-pct">100%</span></div>';
    this.container.appendChild(this.root);

    this._frameEl = this.root.querySelector('.pw-hp-frame');
    this._propEls = [];
    const nodes = this.root.querySelectorAll('.pw-hp-prop');
    for (let i = 0; i < 4; i++) this._propEls.push(nodes[i] || null);
    this._pctEl = this.root.querySelector('.pw-hp-pct');

    // change-detection cache (quantised health, never raw floats)
    this._qProp = [-1, -1, -1, -1];
    this._dead = [false, false, false, false];
    this._qFrame = -1;
    this._pct = -1;
    this._crit = false;
    this._visible = true;

    this._disposed = false;
    this.update({ props: [1, 1, 1, 1], frame: 1, overall: 1 });
  }

  _injectCSS() {
    styleRefs++;
    if (document.getElementById(STYLE_ID)) return;
    try {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    } catch (e) { console.warn('[HealthUI] style injection failed', e); }
  }

  /**
   * @param {{props:number[], frame:number, overall:number}} damage
   * Safe to call every frame; only genuine changes reach the DOM.
   */
  update(damage) {
    if (this._disposed || !damage) return;
    const props = damage.props;

    if (Array.isArray(props)) {
      for (let i = 0; i < 4; i++) {
        const el = this._propEls[i];
        if (!el) continue;
        let h = props[i];
        if (!(h >= 0)) h = Number.isFinite(h) ? 0 : 1;   // NaN → assume healthy
        else if (h > 1) h = 1;
        const q = Math.round(h / QUANT);
        if (q !== this._qProp[i]) {
          this._qProp[i] = q;
          el.style.color = healthColor(h);
        }
        const dead = h <= DEAD;
        if (dead !== this._dead[i]) {
          this._dead[i] = dead;
          el.classList.toggle('dead', dead);
        }
      }
    }

    let f = damage.frame;
    if (!(f >= 0)) f = Number.isFinite(f) ? 0 : 1;
    else if (f > 1) f = 1;
    const qf = Math.round(f / QUANT);
    if (qf !== this._qFrame) {
      this._qFrame = qf;
      if (this._frameEl) this._frameEl.style.color = healthColor(f);
    }

    let o = damage.overall;
    if (!(o >= 0)) o = Number.isFinite(o) ? 0 : 1;
    else if (o > 1) o = 1;
    const pct = Math.round(o * 100);
    if (pct !== this._pct) {
      this._pct = pct;
      if (this._pctEl) {
        this._pctEl.textContent = pct + '%';
        this._pctEl.style.color = healthColor(o);
      }
    }
    const crit = o < CRIT_OVERALL;
    if (crit !== this._crit) {
      this._crit = crit;
      this.root.classList.toggle('crit', crit);
    }
  }

  setVisible(visible) {
    const v = !!visible;
    if (this._visible === v || this._disposed) return;
    this._visible = v;
    this.root.style.display = v ? '' : 'none';
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this.root.remove();
    this._frameEl = null;
    this._propEls.length = 0;
    this._pctEl = null;
    styleRefs = Math.max(0, styleRefs - 1);
    if (styleRefs === 0) document.getElementById(STYLE_ID)?.remove();
  }
}
