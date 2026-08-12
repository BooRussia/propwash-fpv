// ============================================================
// PropWash FPV — ESC pause menu (control center)
// Exports: class Menu { constructor(), open(), close(), get isOpen }
// main.js calls open()/close(); ESC handling lives in main.js.
// ============================================================
import { settings, saveSettings, emit, on, clamp, resetSettings } from '../core/state.js';
import { DRONES, hoverThrottle } from '../physics/drones.js';

// ---------------------------------------------------------------
// small DOM helpers
// ---------------------------------------------------------------
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function btn(cls, text, onClick) {
  const b = el('button', cls, text);
  b.type = 'button';
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

function pad2(n) { return String(n).padStart(2, '0'); }

function fmtTime(h) {
  const H = Math.floor(h);
  const M = Math.round((h - H) * 60);
  return `${pad2(H)}:${pad2(M)}`;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
function compass(deg) { return COMPASS[Math.round(((deg % 360) + 360) % 360 / 45) % 8]; }

// ---------------------------------------------------------------
// trail list formatting
// ---------------------------------------------------------------
function fmtDur(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  return `${Math.floor(s / 60)}:${pad2(s % 60)}`;
}

function fmtDate(ms) {
  const n = Number(ms);
  if (!isFinite(n) || n <= 0) return '';
  try { return new Date(n).toLocaleDateString(); } catch (e) { return ''; }
}

function trailMeta(t) {
  if (t.premade) return t.blurb || 'Built-in route';
  const bits = [`${Math.round(Number(t.lengthM) || 0)} m`, fmtDur(t.durationS), `${t.samples} pts`];
  const d = fmtDate(t.createdAt);
  if (d) bits.push(d);
  return bits.join('  ·  ');
}

// ---------------------------------------------------------------
// drone-spec readers (tolerant of field naming in drones.js)
// ---------------------------------------------------------------
function fieldOf(spec, keys) {
  for (const k of keys) { if (spec && spec[k] != null) return spec[k]; }
  return null;
}

function propLabel(spec) {
  const s = fieldOf(spec, ['propSize', 'propLabel']);
  if (typeof s === 'string') return s;
  const inches = fieldOf(spec, ['propInches', 'propIn', 'propSizeIn']);
  if (inches != null && isFinite(Number(inches))) return `${inches}"`;
  const mm = fieldOf(spec, ['propMm', 'propSizeMm']);
  if (mm != null && isFinite(Number(mm))) return `${mm} mm`;
  const p = fieldOf(spec, ['prop']);
  if (p != null) return typeof p === 'number' ? `${p}"` : String(p);
  return '—';
}

function classLabel(spec) {
  const c = fieldOf(spec, ['class', 'klass', 'category', 'type']);
  return c != null ? String(c).toUpperCase() : '';
}

function cellsLabel(spec) {
  const c = Number(fieldOf(spec, ['cells']));
  return isFinite(c) && c > 0 ? `${c}S` : '—';
}

function auwLabel(spec) {
  const m = Number(fieldOf(spec, ['massKg']));
  if (isFinite(m) && m > 0) return `${Math.round(m * 1000)} g`;
  const g = Number(fieldOf(spec, ['auwGrams', 'massG', 'weightG']));
  return isFinite(g) && g > 0 ? `${Math.round(g)} g` : '—';
}

function twrLabel(spec) {
  const m = Number(fieldOf(spec, ['massKg']));
  const t = Number(fieldOf(spec, ['maxThrustN']));
  if (isFinite(m) && m > 0 && isFinite(t) && t > 0) return `${(t / (m * 9.81)).toFixed(1)} : 1`;
  return '—';
}

function hoverLabel(spec) {
  let h = null;
  try {
    if (typeof hoverThrottle === 'function') h = Number(hoverThrottle(spec));
  } catch (e) { h = null; }
  if (h == null || !isFinite(h) || h <= 0) {
    // fallback: quadratic thrust-curve estimate from mass/thrust
    const m = Number(fieldOf(spec, ['massKg']));
    const t = Number(fieldOf(spec, ['maxThrustN']));
    if (isFinite(m) && m > 0 && isFinite(t) && t > m * 9.81) h = Math.sqrt((m * 9.81) / t);
    else return '—';
  }
  const pct = h <= 1.5 ? h * 100 : h; // tolerate fraction or percent
  return `${Math.round(clamp(pct, 0, 100))}%`;
}

// ---------------------------------------------------------------
// Betaflight "Actual" rates
// ---------------------------------------------------------------
function actualRate(x, r) {
  const expo = clamp(Number(r.expo) || 0, 0, 1);
  const expof = Math.abs(x) * (Math.pow(x, 5) * expo + x * (1 - expo));
  return r.centerSens * x + Math.max(0, r.maxRate - r.centerSens) * expof;
}

const RATE_AXES = [
  { id: 'roll', label: 'Roll', color: '#9aa3ad' },
  { id: 'pitch', label: 'Pitch', color: '#c44a4a' },
  { id: 'yaw', label: 'Yaw', color: '#b8a46a' },
];

const RATE_PRESETS = [
  { name: 'Cinematic', centerSens: 160, maxRate: 400, expo: 0.30 },
  { name: 'Freestyle', centerSens: 200, maxRate: 670, expo: 0.54 },
  { name: 'Race', centerSens: 280, maxRate: 860, expo: 0.60 },
];

const TABS = [
  { id: 'fly', label: 'Fly', icon: '🛩' },
  { id: 'maps', label: 'Maps', icon: '🗺' },
  { id: 'trails', label: 'Trails', icon: '🛤' },
  { id: 'rates', label: 'Rates', icon: '📈' },
  { id: 'controller', label: 'Controller', icon: '🎮' },
  { id: 'environment', label: 'Environment', icon: '🌦' },
  { id: 'video', label: 'Video', icon: '📹' },
  { id: 'graphics', label: 'Graphics', icon: '🖥' },
  { id: 'help', label: 'Help', icon: '❔' },
];

const GAME_MODES = [
  { value: 'freestyle', title: 'Freestyle', desc: 'Open flight. Explore the map, dive buildings, rip proximity lines.' },
  { value: 'racing', title: 'Racing', desc: 'Fly the gate course against the clock — best lap wins.' },
  { value: 'retrieval', title: 'Retrieval', desc: 'Locate scattered packages and carry them home to the pad.' },
];

const FLIGHT_MODES = [
  { value: 'acro', title: 'Acro', desc: 'Full manual FPV. Sticks command rotation rate — the real deal.' },
  { value: 'angle', title: 'Angle', desc: 'Self-leveling. Stick position sets tilt angle. Easiest to learn.' },
  { value: 'horizon', title: 'Horizon', desc: 'Self-levels near center stick, flips through at full deflection.' },
];

const TERRAINS = [
  { value: 'tropical', title: 'Tropical', icon: '🌴' },
  { value: 'desert', title: 'Desert', icon: '🏜' },
  { value: 'mountains', title: 'Mountains', icon: '🏔' },
  { value: 'island', title: 'Island', icon: '🏝' },
];

// Real World (Google Photorealistic 3D Tiles) preset locations
const RW_PRESETS = [
  { value: 'miami', title: 'Miami Beach', icon: '🌴', lat: 25.7907, lon: -80.1300 },
  { value: 'southbeach', title: 'South Beach — Ocean Drive', icon: '🏖', lat: 25.7796, lon: -80.1300 },
  { value: 'manhattan', title: 'Manhattan NYC', icon: '🗽', lat: 40.7580, lon: -73.9855 },
  { value: 'vegas', title: 'Las Vegas Strip', icon: '🎰', lat: 36.1147, lon: -115.1728 },
  { value: 'goldengate', title: 'Golden Gate SF', icon: '🌉', lat: 37.8199, lon: -122.4786 },
  { value: 'sfdt', title: 'San Francisco DT', icon: '🌁', lat: 37.7920, lon: -122.3980 },
];

const RW_KEY_STEPS = [
  'Go to console.cloud.google.com and sign in (any Google account).',
  'Create a new project (top bar → project picker → “New project”).',
  'Search “Map Tiles API” in the API Library and press ENABLE.',
  'Go to APIs & Services → Credentials → Create credentials → API key.',
  'Copy the key and paste it above — it is stored in YOUR browser only.',
  'Google’s free monthly credit comfortably covers hobby flying.',
];

const LOG_RD_MIN = Math.log(300);
const LOG_RD_MAX = Math.log(4000);

// ---------------------------------------------------------------
// Menu
// ---------------------------------------------------------------
export class Menu {
  constructor() {
    this._open = false;
    this._activeTab = 'fly';
    this._scrollPos = Object.create(null);
    this._syncFns = [];
    this._sections = Object.create(null);
    this._tabBtns = [];
    this._gpTimer = null;
    this._wizardOpen = settings.map === 'procedural';
    this._rwOpen = settings.map === 'realworld';
    this._trailState = { map: '', recording: false, activeId: null, pending: null, trails: [] };
    this._trailSig = null;

    this._injectStyles();
    this._build();

    // TrailSystem answers 'trail:list' with 'trail:list:result'
    on('trail:list:result', (d) => this._onTrails(d));

    const mount = document.getElementById('ui-root') || document.body;
    mount.appendChild(this.backdrop);
    this._selectTab('fly');
  }

  get isOpen() { return this._open; }

  open() {
    if (this._open) return;
    this._open = true;
    this._wizardOpen = settings.map === 'procedural';
    this._rwOpen = settings.map === 'realworld';
    this._syncAll();
    this._drawRates();
    this._pollGamepads();
    if (this._activeTab === 'trails') this._requestTrails();
    this._startGpPoll();
    this.backdrop.classList.add('pwm-open');
    emit('menu:open');
  }

  close() {
    if (!this._open) return;
    this._open = false;
    this._stopGpPoll();
    this.backdrop.classList.remove('pwm-open');
    try { document.activeElement?.blur?.(); } catch (e) { /* noop */ }
    emit('menu:close');
  }

  // ------------------------------------------------------------
  // internals
  // ------------------------------------------------------------
  _commit(path) {
    saveSettings();
    emit('settings:changed', { path });
  }

  _syncAll() {
    for (const fn of this._syncFns) {
      try { fn(); } catch (e) { console.warn('[menu] sync failed', e); }
    }
  }

  _startGpPoll() {
    this._stopGpPoll();
    this._gpTimer = setInterval(() => {
      this._pollGamepads();
      if (this._activeTab === 'trails') this._requestTrails();
    }, 500);
  }

  _stopGpPoll() {
    if (this._gpTimer != null) { clearInterval(this._gpTimer); this._gpTimer = null; }
  }

  _selectTab(id) {
    if (this._content) this._scrollPos[this._activeTab] = this._content.scrollTop;
    this._activeTab = id;
    for (const t of this._tabBtns) t.el.classList.toggle('sel', t.id === id);
    for (const sid of Object.keys(this._sections)) {
      this._sections[sid].style.display = sid === id ? '' : 'none';
    }
    if (this._content) this._content.scrollTop = this._scrollPos[id] || 0;
    if (id === 'rates') this._drawRates();
    if (id === 'trails') this._requestTrails();
  }

  // ------------------------------------------------------------
  // DOM construction
  // ------------------------------------------------------------
  _build() {
    this.backdrop = el('div', 'pwm-backdrop');
    this.backdrop.addEventListener('mousedown', (e) => {
      if (e.target === this.backdrop) this.close();
    });

    const panel = el('div', 'pw-panel pwm-panel');
    this.backdrop.appendChild(panel);

    // header
    const header = el('div', 'pwm-header');
    const title = el('div', 'pwm-title');
    title.appendChild(document.createTextNode('PROPWASH '));
    const accent = el('span', null, 'FPV');
    title.appendChild(accent);
    header.appendChild(title);
    header.appendChild(el('div', 'pwm-sub', 'Flight Simulator'));
    header.appendChild(el('div', 'pwm-spacer'));
    header.appendChild(el('div', 'pwm-paused pw-mono', 'SIMULATION PAUSED'));
    panel.appendChild(header);

    // body: sidebar + content
    const body = el('div', 'pwm-body');
    const sidebar = el('div', 'pwm-sidebar');
    for (const t of TABS) {
      const b = btn('pwm-tab', null, () => this._selectTab(t.id));
      b.appendChild(el('span', 'pwm-tab-icon', t.icon));
      b.appendChild(el('span', null, t.label));
      sidebar.appendChild(b);
      this._tabBtns.push({ id: t.id, el: b });
    }
    body.appendChild(sidebar);

    this._content = el('div', 'pwm-content');
    body.appendChild(this._content);
    panel.appendChild(body);

    // footer
    const footer = el('div', 'pwm-footer');
    const hint = (key, text) => {
      const item = el('span', 'pwm-foot-item');
      item.appendChild(el('span', 'pwm-key', key));
      item.appendChild(el('span', null, text));
      footer.appendChild(item);
    };
    hint('ESC', 'Resume');
    hint('SPACE', 'Arm / disarm');
    hint('R', 'Reset drone');
    hint('V', 'FPV / LOS');
    hint('C', 'Static');
    hint('↑↓', 'Cam tilt');
    hint('←→', 'FOV');
    panel.appendChild(footer);

    // tab sections
    const section = (id) => {
      const s = el('div', 'pwm-section');
      s.style.display = 'none';
      this._sections[id] = s;
      this._content.appendChild(s);
      return s;
    };
    this._buildFly(section('fly'));
    this._buildMaps(section('maps'));
    this._buildTrails(section('trails'));
    this._buildRates(section('rates'));
    this._buildController(section('controller'));
    this._buildEnvironment(section('environment'));
    this._buildVideo(section('video'));
    this._buildGraphics(section('graphics'));
    this._buildHelp(section('help'));
  }

  // ------------------------------------------------------------
  // reusable control builders (each registers a sync fn)
  // ------------------------------------------------------------
  _sliderRow(parent, { label, min, max, step, getValue, setValue, display, note }) {
    const row = el('div', 'pw-row');
    row.appendChild(el('div', 'pw-label', label));
    const input = el('input', 'pw-slider');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    const val = el('div', 'pw-value');
    const paint = () => { val.textContent = display(); };
    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      if (!isFinite(v)) return;
      setValue(clamp(v, min, max));
      paint();
    });
    row.appendChild(input);
    row.appendChild(val);
    parent.appendChild(row);
    if (note) parent.appendChild(el('div', 'pwm-note', note));
    this._syncFns.push(() => {
      if (document.activeElement !== input) input.value = String(getValue());
      paint();
    });
    return input;
  }

  _toggleRow(parent, { label, get, set, hint, note }) {
    const row = el('div', 'pw-row');
    row.appendChild(el('div', 'pw-label', label));
    const t = btn('pwm-toggle');
    t.setAttribute('role', 'switch');
    const paint = () => {
      const on = !!get();
      t.classList.toggle('on', on);
      t.setAttribute('aria-checked', on ? 'true' : 'false');
    };
    t.addEventListener('click', () => { set(!get()); paint(); });
    row.appendChild(t);
    if (hint) {
      const h = el('span', 'pwm-hint');
      h.appendChild(el('span', 'pwm-key', hint));
      row.appendChild(h);
    }
    parent.appendChild(row);
    if (note) parent.appendChild(el('div', 'pwm-note', note));
    this._syncFns.push(paint);
  }

  _segRow(parent, { label, options, get, set }) {
    const row = el('div', 'pw-row');
    row.appendChild(el('div', 'pw-label', label));
    const group = el('div', 'pwm-seg');
    const entries = [];
    const paint = () => {
      for (const { b, o } of entries) b.classList.toggle('sel', get() === o.value);
    };
    for (const o of options) {
      const b = btn('pwm-seg-btn', o.label, () => { set(o.value); paint(); });
      group.appendChild(b);
      entries.push({ b, o });
    }
    row.appendChild(group);
    parent.appendChild(row);
    this._syncFns.push(paint);
  }

  _optionCards(parent, { columns, options, get, set }) {
    const grid = el('div', `pwm-grid c${columns}`);
    const entries = [];
    const paint = () => {
      for (const { c, o } of entries) c.classList.toggle('sel', get() === o.value);
    };
    for (const o of options) {
      const c = el('div', 'pwm-opt');
      c.tabIndex = 0;
      if (o.icon) c.appendChild(el('div', 'pwm-opt-icon', o.icon));
      c.appendChild(el('div', 'pwm-opt-title', o.title));
      if (o.desc) c.appendChild(el('div', 'pwm-opt-desc', o.desc));
      const pick = () => { set(o.value); paint(); };
      c.addEventListener('click', pick);
      c.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.stopPropagation(); pick(); } });
      grid.appendChild(c);
      entries.push({ c, o });
    }
    parent.appendChild(grid);
    this._syncFns.push(paint);
    return paint;
  }

  // ------------------------------------------------------------
  // TAB: FLY
  // ------------------------------------------------------------
  _buildFly(sec) {
    const actions = el('div', 'pwm-actions');
    actions.appendChild(btn('pw-btn primary', '▶  Resume', () => this.close()));
    actions.appendChild(btn('pw-btn', 'Reset drone', () => { emit('sim:reset'); this.close(); }));
    actions.appendChild(btn('pw-btn', 'Restart game mode', () => { emit('mode:restart'); this.close(); }));
    sec.appendChild(actions);

    // drone select
    sec.appendChild(el('div', 'pw-h2', 'Drone'));
    const droneEntries = Object.entries(DRONES || {});
    if (droneEntries.length === 0) {
      sec.appendChild(el('div', 'pwm-note', 'No drone specs found.'));
    } else {
      const grid = el('div', 'pwm-grid c3');
      const cards = [];
      const paint = () => {
        for (const { card, id } of cards) card.classList.toggle('sel', settings.drone === id);
      };
      for (const [id, spec] of droneEntries) {
        const card = el('div', 'pwm-card');
        card.tabIndex = 0;
        const head = el('div', 'pwm-card-head');
        head.appendChild(el('div', 'pwm-card-title', spec?.displayName || id));
        const cls = classLabel(spec);
        if (cls) head.appendChild(el('span', 'pwm-badge', cls));
        card.appendChild(head);

        const stats = el('div', 'pwm-stats');
        const stat = (k, v) => {
          stats.appendChild(el('div', 'pwm-stat-k', k));
          stats.appendChild(el('div', 'pwm-stat-v pw-mono', v));
        };
        stat('Prop', propLabel(spec));
        stat('Battery', cellsLabel(spec));
        stat('AUW', auwLabel(spec));
        stat('TWR', twrLabel(spec));
        stat('Hover', hoverLabel(spec));
        card.appendChild(stats);

        const desc = fieldOf(spec, ['description', 'desc', 'blurb']);
        if (desc) card.appendChild(el('div', 'pwm-desc', String(desc)));

        const pick = () => {
          if (settings.drone === id) { paint(); return; }
          settings.drone = id;
          this._commit('drone');
          emit('drone:changed');
          paint();
        };
        card.addEventListener('click', pick);
        card.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.stopPropagation(); pick(); } });
        grid.appendChild(card);
        cards.push({ card, id });
      }
      sec.appendChild(grid);
      this._syncFns.push(paint);
    }

    // game mode
    sec.appendChild(el('div', 'pw-h2', 'Game mode'));
    this._optionCards(sec, {
      columns: 3,
      options: GAME_MODES,
      get: () => settings.gameMode,
      set: (v) => {
        if (settings.gameMode === v) return;
        settings.gameMode = v;
        this._commit('gameMode');
        emit('mode:changed');
      },
    });

    // flight mode
    sec.appendChild(el('div', 'pw-h2', 'Flight mode'));
    this._optionCards(sec, {
      columns: 3,
      options: FLIGHT_MODES,
      get: () => settings.flightMode,
      set: (v) => {
        if (settings.flightMode === v) return;
        settings.flightMode = v;
        this._commit('flightMode');
      },
    });
  }

  // ------------------------------------------------------------
  // TAB: MAPS
  // ------------------------------------------------------------
  _buildMaps(sec) {
    // older saved settings may predate the realworld block
    if (!settings.realworld) {
      settings.realworld = { apiKey: '', preset: 'miami', lat: 25.7907, lon: -80.13 };
    }
    sec.appendChild(el('div', 'pw-h2', 'Map'));
    const grid = el('div', 'pwm-grid c3');

    // Miami card
    const miami = el('div', 'pwm-card pwm-map-card');
    miami.tabIndex = 0;
    const mThumb = el('div', 'pwm-thumb miami', '🏙🌴');
    miami.appendChild(mThumb);
    miami.appendChild(el('div', 'pwm-card-title', 'Miami Skyline'));
    miami.appendChild(el('div', 'pwm-desc', 'Tropical high-rise city on the beach. Dive glass towers, thread the palms, skim the surf.'));
    const pickMiami = () => {
      settings.map = 'miami';
      saveSettings();
      emit('map:reload');
      this.close();
    };
    miami.addEventListener('click', pickMiami);
    miami.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.stopPropagation(); pickMiami(); } });
    grid.appendChild(miami);
    // Ash Prairie card
    const ash = el('div', 'pwm-card pwm-map-card');
    ash.tabIndex = 0;
    const aThumb = el('div', 'pwm-thumb ashPrairie', '🌾🏭');
    ash.appendChild(aThumb);
    ash.appendChild(el('div', 'pwm-card-title', 'Ash Prairie'));
    ash.appendChild(el('div', 'pwm-desc', 'Decommissioned Great Plains nuclear yard + grain co-op. Dive cooling towers, thread pipe racks, whoop the truck alley.'));
    const pickAsh = () => {
      settings.map = 'ashPrairie';
      saveSettings();
      emit('map:reload');
      this.close();
    };
    ash.addEventListener('click', pickAsh);
    ash.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.stopPropagation(); pickAsh(); } });
    grid.appendChild(ash);

    // Procedural card
    const proc = el('div', 'pwm-card pwm-map-card');
    proc.tabIndex = 0;
    const pThumb = el('div', 'pwm-thumb proc', '🎲⛰');
    proc.appendChild(pThumb);
    proc.appendChild(el('div', 'pwm-card-title', 'Procedural'));
    proc.appendChild(el('div', 'pwm-desc', 'Endless generated worlds. Pick a setting, terrain and seed — then hit Generate.'));
    const pickProc = () => {
      this._wizardOpen = true;
      this._rwOpen = false;
      this._paintWizard();
      try { this._wizard.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { /* noop */ }
    };
    proc.addEventListener('click', pickProc);
    proc.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.stopPropagation(); pickProc(); } });
    grid.appendChild(proc);

    // Real World card
    const rw = el('div', 'pwm-card pwm-map-card');
    rw.tabIndex = 0;
    const rwThumb = el('div', 'pwm-thumb realworld', '🌎🏙');
    rw.appendChild(rwThumb);
    rw.appendChild(el('div', 'pwm-card-title', 'Real World'));
    rw.appendChild(el('div', 'pwm-desc', 'Fly REAL cities — Google photorealistic 3D tiles. Miami, Manhattan, the Vegas Strip… bring your own free API key.'));
    const pickRW = () => {
      this._rwOpen = true;
      this._wizardOpen = false;
      this._paintWizard();
      try { this._rwPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { /* noop */ }
    };
    rw.addEventListener('click', pickRW);
    rw.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.stopPropagation(); pickRW(); } });
    grid.appendChild(rw);
    sec.appendChild(grid);

    // -------- Real World panel --------
    this._buildRealWorldPanel(sec);

    // -------- procedural wizard --------
    const wiz = el('div', 'pwm-wizard');
    this._wizard = wiz;

    const stepHead = (n, text) => {
      const h = el('div', 'pwm-step-h');
      h.appendChild(el('span', 'pwm-step-n', String(n)));
      h.appendChild(el('span', 'pwm-step-t', text));
      return h;
    };

    // step 1: setting
    wiz.appendChild(stepHead(1, 'Setting'));
    const paintStep1 = this._optionCards(wiz, {
      columns: 2,
      options: [
        { value: 'indoor', title: 'Indoor', icon: '🏠', desc: 'Bando / warehouse micro flying. Tight gaps, no wind.' },
        { value: 'outdoor', title: 'Outdoor', icon: '🌍', desc: 'Open landscape with weather, wind and long lines.' },
      ],
      get: () => settings.procedural.setting,
      set: (v) => {
        settings.procedural.setting = v;
        this._commit('procedural');
        this._paintWizard();
      },
    });

    // step 2: locale (outdoor only)
    const step2 = el('div', 'pwm-step');
    step2.appendChild(stepHead(2, 'Locale'));
    const paintStep2 = this._optionCards(step2, {
      columns: 2,
      options: [
        { value: 'city', title: 'City', icon: '🏙', desc: 'Streets, blocks and rooftops.' },
        { value: 'country', title: 'Country', icon: '🌾', desc: 'Fields, trees and farm structures.' },
      ],
      get: () => settings.procedural.locale,
      set: (v) => {
        settings.procedural.locale = v;
        this._commit('procedural');
      },
    });
    wiz.appendChild(step2);

    // step 3: terrain (outdoor only)
    const step3 = el('div', 'pwm-step');
    step3.appendChild(stepHead(3, 'Terrain'));
    const paintStep3 = this._optionCards(step3, {
      columns: 4,
      options: TERRAINS,
      get: () => settings.procedural.terrain,
      set: (v) => {
        settings.procedural.terrain = v;
        this._commit('procedural');
      },
    });
    wiz.appendChild(step3);

    // step 4: seed
    wiz.appendChild(stepHead(4, 'Seed'));
    const seedRow = el('div', 'pw-row');
    seedRow.appendChild(el('div', 'pw-label', 'World seed'));
    const seedInput = el('input', 'pw-input pwm-seed');
    seedInput.type = 'number';
    seedInput.min = '0';
    seedInput.max = '999999999';
    seedInput.step = '1';
    seedInput.addEventListener('keydown', (e) => e.stopPropagation());
    seedInput.addEventListener('keyup', (e) => e.stopPropagation());
    const commitSeed = () => {
      const n = parseInt(seedInput.value, 10);
      if (isFinite(n)) {
        settings.procedural.seed = clamp(Math.floor(n), 0, 999999999);
        this._commit('procedural');
      }
      seedInput.value = String(settings.procedural.seed);
    };
    seedInput.addEventListener('change', commitSeed);
    seedRow.appendChild(seedInput);
    seedRow.appendChild(btn('pw-btn', '🎲 Randomize', () => {
      settings.procedural.seed = Math.floor(Math.random() * 1000000);
      seedInput.value = String(settings.procedural.seed);
      this._commit('procedural');
    }));
    wiz.appendChild(seedRow);

    // summary + generate
    const genRow = el('div', 'pwm-actions pwm-gen-row');
    this._wizSummary = el('div', 'pwm-summary pw-mono');
    genRow.appendChild(this._wizSummary);
    genRow.appendChild(el('div', 'pwm-spacer'));
    genRow.appendChild(btn('pw-btn primary', '⚡ Generate world', () => {
      commitSeed();
      settings.map = 'procedural';
      saveSettings();
      emit('map:reload');
      this.close();
    }));
    wiz.appendChild(genRow);
    sec.appendChild(wiz);

    // paint routine for the whole tab
    this._paintWizard = () => {
      miami.classList.toggle('sel', settings.map === 'miami');
      ash.classList.toggle('sel', settings.map === 'ashPrairie');
      proc.classList.toggle('sel', settings.map === 'procedural');
      rw.classList.toggle('sel', settings.map === 'realworld');
      if (this._paintRW) this._paintRW();
      wiz.style.display = this._wizardOpen ? '' : 'none';
      const outdoor = settings.procedural.setting === 'outdoor';
      step2.style.display = outdoor ? '' : 'none';
      step3.style.display = outdoor ? '' : 'none';
      paintStep1(); paintStep2(); paintStep3();
      if (document.activeElement !== seedInput) seedInput.value = String(settings.procedural.seed);
      const p = settings.procedural;
      this._wizSummary.textContent = outdoor
        ? `outdoor · ${p.locale} · ${p.terrain} · seed ${p.seed}`
        : `indoor · seed ${p.seed}`;
    };
    this._syncFns.push(this._paintWizard);
  }

  // ------------------------------------------------------------
  // Real World panel (Maps tab)
  // ------------------------------------------------------------
  _buildRealWorldPanel(sec) {
    const rwp = el('div', 'pwm-wizard pwm-rw');
    this._rwPanel = rwp;

    const stepHead = (n, text) => {
      const h = el('div', 'pwm-step-h');
      h.appendChild(el('span', 'pwm-step-n', String(n)));
      h.appendChild(el('span', 'pwm-step-t', text));
      return h;
    };

    // step 1: API key
    rwp.appendChild(stepHead(1, 'Google API key'));
    const keyRow = el('div', 'pw-row');
    keyRow.appendChild(el('div', 'pw-label', 'API key'));
    const keyInput = el('input', 'pw-input pwm-rw-key');
    keyInput.type = 'password';
    keyInput.placeholder = 'Paste your Map Tiles API key (AIza…)';
    keyInput.autocomplete = 'off';
    keyInput.spellcheck = false;
    keyInput.addEventListener('keydown', (e) => e.stopPropagation());
    keyInput.addEventListener('keyup', (e) => e.stopPropagation());
    keyInput.addEventListener('input', () => {
      settings.realworld.apiKey = keyInput.value.trim();
      saveSettings();
      paintSummary();
    });
    keyRow.appendChild(keyInput);
    rwp.appendChild(keyRow);
    rwp.appendChild(el('div', 'pwm-note',
      'Your key is saved in THIS browser only (localStorage) and is sent nowhere except directly to Google’s tile servers.'));

    // collapsible: how to get a key
    let helpOpen = false;
    const helpBtn = btn('pw-btn pwm-rw-help-btn', 'How to get a free key ▸', () => {
      helpOpen = !helpOpen;
      helpBody.style.display = helpOpen ? '' : 'none';
      helpBtn.textContent = helpOpen ? 'How to get a free key ▾' : 'How to get a free key ▸';
    });
    rwp.appendChild(helpBtn);
    const helpBody = el('div', 'pwm-rw-help');
    helpBody.style.display = 'none';
    RW_KEY_STEPS.forEach((s, i) => {
      const row = el('div', 'pwm-rw-help-row');
      row.appendChild(el('span', 'pwm-rw-help-n pw-mono', `${i + 1}.`));
      row.appendChild(el('span', 'pwm-dim2', s));
      helpBody.appendChild(row);
    });
    rwp.appendChild(helpBody);

    // step 2: location
    rwp.appendChild(stepHead(2, 'Location'));
    const paintPresets = this._optionCards(rwp, {
      columns: 3,
      options: RW_PRESETS.map((p) => ({
        value: p.value, title: p.title, icon: p.icon,
        desc: `${p.lat.toFixed(4)}, ${p.lon.toFixed(4)}`,
      })),
      get: () => settings.realworld.preset,
      set: (v) => {
        const p = RW_PRESETS.find((x) => x.value === v);
        if (!p) return;
        settings.realworld.preset = p.value;
        settings.realworld.lat = p.lat;
        settings.realworld.lon = p.lon;
        this._commit('realworld');
        paintCoords();
        paintSummary();
      },
    });

    // custom lat/lon
    const coordRow = el('div', 'pw-row');
    coordRow.appendChild(el('div', 'pw-label', 'Custom lat / lon'));
    const mkCoord = (min, max, ph) => {
      const inp = el('input', 'pw-input pwm-rw-coord');
      inp.type = 'number';
      inp.step = '0.0001';
      inp.min = String(min);
      inp.max = String(max);
      inp.placeholder = ph;
      inp.addEventListener('keydown', (e) => e.stopPropagation());
      inp.addEventListener('keyup', (e) => e.stopPropagation());
      return inp;
    };
    const latInput = mkCoord(-90, 90, 'latitude');
    const lonInput = mkCoord(-180, 180, 'longitude');
    const commitCoords = () => {
      const la = parseFloat(latInput.value);
      const lo = parseFloat(lonInput.value);
      if (isFinite(la)) settings.realworld.lat = clamp(la, -90, 90);
      if (isFinite(lo)) settings.realworld.lon = clamp(lo, -180, 180);
      const hit = RW_PRESETS.find((p) =>
        Math.abs(p.lat - settings.realworld.lat) < 1e-4 && Math.abs(p.lon - settings.realworld.lon) < 1e-4);
      settings.realworld.preset = hit ? hit.value : 'custom';
      this._commit('realworld');
      paintCoords();
      paintPresets();
      paintSummary();
    };
    latInput.addEventListener('change', commitCoords);
    lonInput.addEventListener('change', commitCoords);
    coordRow.appendChild(latInput);
    coordRow.appendChild(lonInput);
    rwp.appendChild(coordRow);
    rwp.appendChild(el('div', 'pwm-note',
      'Anywhere Google has photorealistic 3D coverage works — most large cities worldwide. Editing lat/lon switches the preset to “custom”.'));

    // fly row
    const flyRow = el('div', 'pwm-actions pwm-gen-row');
    const summary = el('div', 'pwm-summary pw-mono');
    flyRow.appendChild(summary);
    flyRow.appendChild(el('div', 'pwm-spacer'));
    flyRow.appendChild(btn('pw-btn primary', '🌎 Fly real world', () => {
      commitCoords();
      settings.map = 'realworld';
      saveSettings();
      emit('map:reload');
      this.close();
    }));
    rwp.appendChild(flyRow);
    sec.appendChild(rwp);

    const paintCoords = () => {
      if (document.activeElement !== latInput) latInput.value = String(settings.realworld.lat);
      if (document.activeElement !== lonInput) lonInput.value = String(settings.realworld.lon);
    };
    const paintSummary = () => {
      const r = settings.realworld;
      const keyState = r.apiKey ? 'key ✓' : 'NO KEY — placard mode';
      summary.textContent = `${r.preset} · ${Number(r.lat).toFixed(4)}, ${Number(r.lon).toFixed(4)} · ${keyState}`;
    };

    this._paintRW = () => {
      rwp.style.display = this._rwOpen ? '' : 'none';
      if (document.activeElement !== keyInput) keyInput.value = settings.realworld.apiKey || '';
      paintCoords();
      paintPresets();
      paintSummary();
    };
    this._syncFns.push(this._paintRW);
  }

  // ------------------------------------------------------------
  // TAB: TRAILS
  // Record a line, save it, follow it. All state lives in
  // js/world/trails.js — this tab only talks over the bus.
  // ------------------------------------------------------------
  _buildTrails(sec) {
    sec.appendChild(el('div', 'pw-h2', 'Record a line'));
    sec.appendChild(el('div', 'pwm-note',
      'Hit RECORD, close the menu and fly the line you like. PropWash samples the drone 20× a second and ' +
      'lays a glowing ribbon behind you. Press STOP when you are happy with it, then name it and save.'));

    const recRow = el('div', 'pwm-actions');
    this._trailRecBtn = btn('pw-btn primary pwm-rec-btn', '● RECORD', () => {
      emit('trail:record:toggle');
      this._requestTrails();
    });
    recRow.appendChild(this._trailRecBtn);
    const recState = el('div', 'pwm-rec-state pw-mono');
    this._trailRecDot = el('span', 'pwm-rec-dot');
    recState.appendChild(this._trailRecDot);
    this._trailRecLabel = el('span', null, 'IDLE');
    recState.appendChild(this._trailRecLabel);
    recRow.appendChild(recState);
    sec.appendChild(recRow);
    sec.appendChild(el('div', 'pwm-note',
      'Recording only captures while the motors are armed — recording keeps running after you close this menu.'));

    // ---------------- save ----------------
    sec.appendChild(el('div', 'pw-h2', 'Save recorded line'));
    const saveRow = el('div', 'pw-row');
    saveRow.appendChild(el('div', 'pw-label', 'Trail name'));
    const nameInput = el('input', 'pw-input pwm-trail-input');
    nameInput.type = 'text';
    nameInput.maxLength = 48;
    nameInput.placeholder = 'Sunset Line';
    nameInput.autocomplete = 'off';
    nameInput.spellcheck = false;
    const doSave = () => {
      if (!this._trailState.pending) return;
      emit('trail:save', { name: nameInput.value });
      nameInput.value = '';
      this._requestTrails();
    };
    nameInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); doSave(); }
    });
    nameInput.addEventListener('keyup', (e) => e.stopPropagation());
    saveRow.appendChild(nameInput);
    this._trailSaveBtn = btn('pw-btn primary', '💾  Save trail', doSave);
    saveRow.appendChild(this._trailSaveBtn);
    sec.appendChild(saveRow);
    this._trailNameInput = nameInput;
    this._trailPendingNote = el('div', 'pwm-note', 'Nothing recorded yet.');
    sec.appendChild(this._trailPendingNote);

    // ---------------- list ----------------
    const head = el('div', 'pwm-trail-head');
    head.appendChild(el('div', 'pw-h2 pwm-trail-h2', 'Trails on this map'));
    head.appendChild(el('div', 'pwm-spacer'));
    head.appendChild(btn('pw-btn pwm-mini', 'Hide trail', () => { emit('trail:hide'); this._requestTrails(); }));
    head.appendChild(btn('pw-btn pwm-mini', 'Refresh', () => { this._trailSig = null; this._requestTrails(); }));
    sec.appendChild(head);

    this._trailList = el('div', 'pwm-trail-list');
    sec.appendChild(this._trailList);
    sec.appendChild(el('div', 'pwm-note',
      'FLY drops you at the trail start with the ribbon lit — reset (R) keeps putting you back there until you hide it. ' +
      'Built-in trails are marked PREMADE and cannot be deleted. Saved trails live in this browser.'));

    this._paintTrails(true);
  }

  _requestTrails() {
    emit('trail:list');
  }

  _onTrails(d) {
    if (!d || typeof d !== 'object') return;
    this._trailState = {
      map: d.map || '',
      recording: !!d.recording,
      activeId: d.activeId || null,
      pending: d.pending || null,
      trails: Array.isArray(d.trails) ? d.trails : [],
    };
    this._paintTrails(false);
  }

  _paintTrails(force) {
    const st = this._trailState;
    if (this._trailRecBtn) {
      this._trailRecBtn.textContent = st.recording ? '■  STOP RECORDING' : '●  RECORD';
      this._trailRecBtn.classList.toggle('rec', st.recording);
    }
    if (this._trailRecDot) this._trailRecDot.classList.toggle('on', st.recording);
    if (this._trailRecLabel) this._trailRecLabel.textContent = st.recording ? 'RECORDING' : 'IDLE';
    if (this._trailSaveBtn) this._trailSaveBtn.disabled = !st.pending;
    if (this._trailPendingNote) {
      this._trailPendingNote.textContent = st.pending
        ? `Unsaved line ready — ${Math.round(st.pending.lengthM)} m, ${fmtDur(st.pending.durationS)}, ${st.pending.samples} points.`
        : (st.recording ? 'Recording… fly your line, then press STOP.' : 'Nothing recorded yet.');
    }
    if (!this._trailList) return;

    // rebuild the rows only when something actually changed
    const sig = `${st.map}|${st.activeId}|${st.trails.map((t) => `${t.id}:${t.name}:${t.samples}`).join(',')}`;
    if (!force && sig === this._trailSig) return;
    this._trailSig = sig;
    this._trailList.textContent = '';

    if (!st.trails.length) {
      this._trailList.appendChild(el('div', 'pwm-trail-empty pwm-dim2',
        'No trails on this map yet — record your first line above.'));
      return;
    }

    for (const t of st.trails) {
      const row = el('div', 'pwm-trail-row');
      row.classList.toggle('active', !!t.active);

      const main = el('div', 'pwm-trail-main');
      const title = el('div', 'pwm-trail-name');
      title.appendChild(el('span', null, t.name || 'Untitled'));
      if (t.premade) title.appendChild(el('span', 'pwm-badge alt', 'Premade'));
      if (t.active) title.appendChild(el('span', 'pwm-badge', 'Showing'));
      main.appendChild(title);
      main.appendChild(el('div', 'pwm-trail-meta pw-mono', trailMeta(t)));
      row.appendChild(main);

      row.appendChild(btn('pw-btn pwm-mini primary', '▶  Fly', () => {
        emit('trail:fly', { id: t.id });
        this.close();
      }));
      if (!t.premade) {
        row.appendChild(btn('pw-btn pwm-mini danger', 'Delete', () => {
          let ok = false;
          try { ok = window.confirm(`Delete trail “${t.name}”? This cannot be undone.`); }
          catch (e) { ok = false; }
          if (!ok) return;
          emit('trail:delete', { id: t.id });
          this._trailSig = null;
          this._requestTrails();
        }));
      }
      this._trailList.appendChild(row);
    }
  }

  // ------------------------------------------------------------
  // TAB: RATES
  // ------------------------------------------------------------
  _buildRates(sec) {
    sec.appendChild(el('div', 'pw-h2', 'Rate profile'));
    sec.appendChild(el('div', 'pwm-note',
      'Betaflight “Actual” rates. Center sensitivity shapes feel around mid-stick, ' +
      'max rate caps rotation speed at full deflection, expo softens the middle.'));

    const cv = el('canvas', 'pwm-canvas');
    cv.width = 1080;
    cv.height = 340;
    this._ratesCanvas = cv;
    sec.appendChild(cv);

    const presets = el('div', 'pw-row');
    presets.appendChild(el('div', 'pw-label', 'Presets'));
    for (const p of RATE_PRESETS) {
      presets.appendChild(btn('pw-btn', p.name, () => {
        for (const ax of RATE_AXES) {
          const r = settings.rates[ax.id];
          r.centerSens = p.centerSens;
          r.maxRate = p.maxRate;
          r.expo = p.expo;
        }
        this._commit('rates');
        this._syncAll();
        this._drawRates();
      }));
    }
    sec.appendChild(presets);

    for (const ax of RATE_AXES) {
      const h = el('div', 'pwm-axis-h');
      const sw = el('span', 'pwm-swatch');
      sw.style.background = ax.color;
      h.appendChild(sw);
      h.appendChild(el('span', null, ax.label));
      sec.appendChild(h);

      this._sliderRow(sec, {
        label: 'Center sensitivity',
        min: 50, max: 400, step: 1,
        getValue: () => settings.rates[ax.id].centerSens,
        setValue: (v) => {
          settings.rates[ax.id].centerSens = Math.round(v);
          this._commit('rates');
          this._drawRates();
        },
        display: () => `${settings.rates[ax.id].centerSens}°/s`,
      });
      this._sliderRow(sec, {
        label: 'Max rate',
        min: 200, max: 1200, step: 5,
        getValue: () => settings.rates[ax.id].maxRate,
        setValue: (v) => {
          settings.rates[ax.id].maxRate = Math.round(v);
          this._commit('rates');
          this._drawRates();
        },
        display: () => `${settings.rates[ax.id].maxRate}°/s`,
      });
      this._sliderRow(sec, {
        label: 'Expo',
        min: 0, max: 1, step: 0.01,
        getValue: () => settings.rates[ax.id].expo,
        setValue: (v) => {
          settings.rates[ax.id].expo = Math.round(v * 100) / 100;
          this._commit('rates');
          this._drawRates();
        },
        display: () => settings.rates[ax.id].expo.toFixed(2),
      });
    }
  }

  _drawRates() {
    const cv = this._ratesCanvas;
    if (!cv) return;
    let ctx = null;
    try { ctx = cv.getContext('2d'); } catch (e) { return; }
    if (!ctx) return;

    const W = cv.width, H = cv.height;
    const padL = 78, padR = 26, padT = 24, padB = 46;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const cx = padL + plotW / 2;
    const cy = padT + plotH / 2;

    ctx.clearRect(0, 0, W, H);

    let maxRate = 200;
    for (const ax of RATE_AXES) {
      const r = settings.rates[ax.id];
      if (r) maxRate = Math.max(maxRate, Number(r.maxRate) || 0, Number(r.centerSens) || 0);
    }
    const maxY = Math.ceil(maxRate / 100) * 100;

    const xTo = (x) => cx + (x * plotW) / 2;
    const yTo = (r) => cy - (r / maxY) * (plotH / 2);

    // grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(120,180,220,0.10)';
    ctx.beginPath();
    for (const gx of [-1, -0.5, 0.5, 1]) {
      ctx.moveTo(xTo(gx), padT);
      ctx.lineTo(xTo(gx), padT + plotH);
    }
    for (const gy of [-1, -0.5, 0.5, 1]) {
      ctx.moveTo(padL, yTo(gy * maxY));
      ctx.lineTo(padL + plotW, yTo(gy * maxY));
    }
    ctx.stroke();

    // axes
    ctx.strokeStyle = 'rgba(160,200,230,0.30)';
    ctx.beginPath();
    ctx.moveTo(cx, padT); ctx.lineTo(cx, padT + plotH);
    ctx.moveTo(padL, cy); ctx.lineTo(padL + plotW, cy);
    ctx.stroke();

    // labels
    ctx.fillStyle = 'rgba(143,163,181,0.9)';
    ctx.font = '16px Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const gy of [-1, -0.5, 0, 0.5, 1]) {
      ctx.fillText(String(Math.round(gy * maxY)), padL - 10, yTo(gy * maxY));
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const gx of [-1, -0.5, 0, 0.5, 1]) {
      ctx.fillText(gx.toFixed(1), xTo(gx), padT + plotH + 10);
    }
    ctx.textAlign = 'left';
    ctx.fillText('stick', padL + plotW - 44, padT + plotH + 28);
    ctx.save();
    ctx.translate(22, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('deg/s', 0, 0);
    ctx.restore();

    // curves
    const N = 128;
    for (const ax of RATE_AXES) {
      const r = settings.rates[ax.id];
      if (!r) continue;
      ctx.strokeStyle = ax.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = ax.color;
      ctx.shadowBlur = 7;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const x = -1 + (2 * i) / N;
        const px = xTo(x);
        const py = yTo(actualRate(x, r));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // legend (top-left inside plot)
    ctx.font = '15px Consolas, monospace';
    ctx.textBaseline = 'middle';
    let ly = padT + 16;
    for (const ax of RATE_AXES) {
      const r = settings.rates[ax.id];
      ctx.fillStyle = ax.color;
      ctx.fillRect(padL + 14, ly - 5, 12, 12);
      ctx.fillStyle = 'rgba(223,234,242,0.92)';
      ctx.textAlign = 'left';
      ctx.fillText(`${ax.label.toUpperCase()}  ${Math.round(r?.maxRate ?? 0)}°/s`, padL + 34, ly + 1);
      ly += 24;
    }
  }

  // ------------------------------------------------------------
  // TAB: CONTROLLER
  // ------------------------------------------------------------
  _buildController(sec) {
    sec.appendChild(el('div', 'pw-h2', 'Radio'));
    const status = el('div', 'pwm-status');
    status.appendChild(el('div', 'k', 'Device'));
    this._gpDeviceEl = el('div', 'v', '—');
    status.appendChild(this._gpDeviceEl);
    status.appendChild(el('div', 'k', 'Calibrated'));
    this._gpCalEl = el('div', 'v', '—');
    status.appendChild(this._gpCalEl);
    sec.appendChild(status);
    sec.appendChild(el('div', 'pwm-note',
      'Plug your radio in via USB (joystick / gamepad mode) and wiggle a stick — browsers hide controllers until they see input.'));

    const actions = el('div', 'pwm-actions');
    actions.appendChild(btn('pw-btn primary', 'Calibrate radio', () => emit('calibrate:start')));
    actions.appendChild(btn('pw-btn', 'Fine-tune / stick drift', () => emit('calibrate:finetune')));
    sec.appendChild(actions);

    sec.appendChild(el('div', 'pw-h2', 'Keyboard fallback'));
    const keys = el('div', 'pwm-keys');
    const key = (k, d) => {
      keys.appendChild(el('div', 'pwm-key-cell pw-mono', k));
      keys.appendChild(el('div', 'pwm-dim2', d));
    };
    key('I / K', 'Throttle up / down');
    key('W / S', 'Pitch forward / back');
    key('A / D', 'Roll left / right');
    key('J / L', 'Yaw left / right');
    key('SPACE', 'Arm / disarm');
    sec.appendChild(keys);
    sec.appendChild(el('div', 'pwm-note',
      'Keyboard flying is on/off by nature — a real radio (or gamepad) is strongly recommended for acro.'));
  }

  _pollGamepads() {
    let name = null;
    try {
      const pads = (typeof navigator !== 'undefined' && navigator.getGamepads) ? navigator.getGamepads() : [];
      for (let i = 0; i < pads.length; i++) {
        const p = pads[i];
        if (!p || p.connected === false) continue;
        if (settings.controller.deviceId && p.id === settings.controller.deviceId) { name = p.id; break; }
        if (name == null) name = p.id;
      }
    } catch (e) { /* gamepad API unavailable */ }

    if (this._gpDeviceEl) {
      this._gpDeviceEl.textContent = name || 'No gamepad detected — keyboard active';
      this._gpDeviceEl.classList.toggle('pwm-ok', !!name);
      this._gpDeviceEl.classList.toggle('pwm-warn', !name);
    }
    if (this._gpCalEl) {
      const cal = !!settings.controller.calibration;
      this._gpCalEl.textContent = cal ? 'YES' : 'NO — run the wizard';
      this._gpCalEl.classList.toggle('pwm-ok', cal);
      this._gpCalEl.classList.toggle('pwm-warn', !cal);
    }
  }

  // ------------------------------------------------------------
  // TAB: ENVIRONMENT
  // ------------------------------------------------------------
  _buildEnvironment(sec) {
    sec.appendChild(el('div', 'pw-h2', 'Sky & weather'));
    sec.appendChild(el('div', 'pwm-note', 'Everything here applies live — watch the world change behind this menu.'));

    this._sliderRow(sec, {
      label: 'Time of day',
      min: 0, max: 24, step: 0.25,
      getValue: () => settings.environment.timeOfDay,
      setValue: (v) => { settings.environment.timeOfDay = v; this._commit('environment'); },
      display: () => fmtTime(settings.environment.timeOfDay),
    });
    this._sliderRow(sec, {
      label: 'Wind speed',
      min: 0, max: 15, step: 0.5,
      getValue: () => settings.environment.windSpeed,
      setValue: (v) => { settings.environment.windSpeed = v; this._commit('environment'); },
      display: () => `${settings.environment.windSpeed.toFixed(1)} m/s`,
    });
    this._sliderRow(sec, {
      label: 'Wind from',
      min: 0, max: 360, step: 5,
      getValue: () => settings.environment.windDirDeg,
      setValue: (v) => { settings.environment.windDirDeg = v; this._commit('environment'); },
      display: () => `${Math.round(settings.environment.windDirDeg)}° ${compass(settings.environment.windDirDeg)}`,
    });
    this._sliderRow(sec, {
      label: 'Gustiness',
      min: 0, max: 1, step: 0.05,
      getValue: () => settings.environment.gustiness,
      setValue: (v) => { settings.environment.gustiness = v; this._commit('environment'); },
      display: () => `${Math.round(settings.environment.gustiness * 100)}%`,
    });
    this._sliderRow(sec, {
      label: 'Rain',
      min: 0, max: 1, step: 0.05,
      getValue: () => settings.environment.rain,
      setValue: (v) => { settings.environment.rain = v; this._commit('environment'); },
      display: () => `${Math.round(settings.environment.rain * 100)}%`,
    });
  }

  // ------------------------------------------------------------
  // TAB: VIDEO
  // ------------------------------------------------------------
  _buildVideo(sec) {
    sec.appendChild(el('div', 'pw-h2', 'Camera'));
    this._sliderRow(sec, {
      label: 'Camera tilt',
      min: 0, max: 60, step: 1,
      getValue: () => settings.camera.tiltDeg,
      setValue: (v) => { settings.camera.tiltDeg = Math.round(v); this._commit('camera'); },
      display: () => `${Math.round(settings.camera.tiltDeg)}°`,
      note: 'More tilt = faster cruising attitude. Also ArrowUp / ArrowDown in flight.',
    });
    this._sliderRow(sec, {
      label: 'FOV',
      min: 60, max: 150, step: 1,
      getValue: () => settings.camera.fovDeg,
      setValue: (v) => { settings.camera.fovDeg = Math.round(v); this._commit('camera'); },
      display: () => `${Math.round(settings.camera.fovDeg)}°`,
      note: 'Also ArrowLeft / ArrowRight in flight.',
    });
    this._toggleRow(sec, {
      label: 'Line-of-sight view',
      get: () => settings.camera.losMode,
      set: (v) => { settings.camera.losMode = v; this._commit('camera'); },
      hint: 'V',
      note: 'Watch the quad from where the pilot stands instead of the FPV feed.',
    });

    sec.appendChild(el('div', 'pw-h2', 'Video feed'));
    this._toggleRow(sec, {
      label: 'Static overlay',
      get: () => settings.camera.staticEnabled,
      set: (v) => { settings.camera.staticEnabled = v; this._commit('camera'); },
      hint: 'C',
    });
    this._segRow(sec, {
      label: 'Feed style',
      options: [
        { value: 'analog', label: 'ANALOG' },
        { value: 'digital', label: 'DIGITAL' },
      ],
      get: () => settings.camera.staticMode,
      set: (v) => { settings.camera.staticMode = v; this._commit('camera'); },
    });
    this._sliderRow(sec, {
      label: 'Base intensity',
      min: 0, max: 1, step: 0.01,
      getValue: () => settings.camera.staticIntensity,
      setValue: (v) => { settings.camera.staticIntensity = v; this._commit('camera'); },
      display: () => `${Math.round(settings.camera.staticIntensity * 100)}%`,
    });
    this._toggleRow(sec, {
      label: 'Stick overlay',
      get: () => settings.osd.showSticks,
      set: (v) => { settings.osd.showSticks = v; this._commit('osd'); },
      note: 'Show live stick positions at the bottom of the screen.',
    });
    this._toggleRow(sec, {
      label: 'Signal loss',
      get: () => settings.camera.signalLoss,
      set: (v) => { settings.camera.signalLoss = v; this._commit('camera'); },
      note: 'The feed breaks up with distance and with terrain or buildings between you and the drone.',
    });

    sec.appendChild(el('div', 'pw-h2', 'Stabilization'));
    this._toggleRow(sec, {
      label: 'Horizon soft-lock',
      get: () => settings.camera.stabilization,
      set: (v) => { settings.camera.stabilization = v; this._commit('camera'); },
      note: 'Bleed FPV roll toward level and damp motor micro-shake. Off = classic unlocked FPV.',
    });
    this._sliderRow(sec, {
      label: 'Stab strength',
      min: 0, max: 1, step: 0.01,
      getValue: () => settings.camera.stabStrength,
      setValue: (v) => { settings.camera.stabStrength = v; this._commit('camera'); },
      display: () => `${Math.round(settings.camera.stabStrength * 100)}%`,
    });

    sec.appendChild(el('div', 'pw-h2', 'Shutter'));
    this._sliderRow(sec, {
      label: 'Shutter speed',
      min: 0, max: 20, step: 1,
      getValue: () => settings.camera.shutterMs,
      setValue: (v) => { settings.camera.shutterMs = Math.round(v); this._commit('camera'); },
      display: () => settings.camera.shutterMs <= 0 ? 'OFF' : `${Math.round(settings.camera.shutterMs)} ms`,
      note: 'Extension point for motion blur. Visual pass is not applied yet at 0 blur.',
    });
    this._sliderRow(sec, {
      label: 'Motion blur',
      min: 0, max: 1, step: 0.01,
      getValue: () => settings.camera.motionBlur,
      setValue: (v) => { settings.camera.motionBlur = v; this._commit('camera'); },
      display: () => `${Math.round(settings.camera.motionBlur * 100)}%`,
      note: 'Knob wired to js/camera/shutter.js for a future blur pass.',
    });
  }

  // ------------------------------------------------------------
  // TAB: GRAPHICS
  // ------------------------------------------------------------
  _buildGraphics(sec) {
    sec.appendChild(el('div', 'pw-h2', 'Quality'));
    this._segRow(sec, {
      label: 'Preset',
      options: [
        { value: 'low', label: 'LOW' },
        { value: 'medium', label: 'MEDIUM' },
        { value: 'high', label: 'HIGH' },
        { value: 'ultra', label: 'ULTRA' },
      ],
      get: () => settings.graphics.quality,
      set: (v) => { settings.graphics.quality = v; this._commit('graphics'); },
    });
    sec.appendChild(el('div', 'pwm-note', 'Low disables shadows and bloom. Ultra uses 4K shadow maps.'));

    this._sliderRow(sec, {
      label: 'Render distance',
      min: 0, max: 1000, step: 1,
      getValue: () => {
        const d = clamp(settings.graphics.renderDistance, 300, 4000);
        return Math.round(1000 * (Math.log(d) - LOG_RD_MIN) / (LOG_RD_MAX - LOG_RD_MIN));
      },
      setValue: (v) => {
        const d = Math.exp(LOG_RD_MIN + (v / 1000) * (LOG_RD_MAX - LOG_RD_MIN));
        settings.graphics.renderDistance = clamp(Math.round(d / 10) * 10, 300, 4000);
        this._commit('graphics');
      },
      display: () => `${settings.graphics.renderDistance} m`,
      note: 'Lower = better FPS. Drives fog distance, and the size of procedural maps (map size applies on regenerate).',
    });
    this._sliderRow(sec, {
      label: 'Render scale',
      min: 0.5, max: 1.5, step: 0.05,
      getValue: () => settings.graphics.renderScale,
      setValue: (v) => { settings.graphics.renderScale = Math.round(v * 100) / 100; this._commit('graphics'); },
      display: () => `${Math.round(settings.graphics.renderScale * 100)}%`,
    });
    this._toggleRow(sec, {
      label: 'Bloom',
      get: () => settings.graphics.bloom,
      set: (v) => { settings.graphics.bloom = v; this._commit('graphics'); },
    });
    this._toggleRow(sec, {
      label: 'Shadows',
      get: () => settings.graphics.shadows,
      set: (v) => { settings.graphics.shadows = v; this._commit('graphics'); },
    });

    sec.appendChild(el('div', 'pw-h2', 'Audio'));
    this._sliderRow(sec, {
      label: 'Master volume',
      min: 0, max: 1, step: 0.01,
      getValue: () => settings.audio.master,
      setValue: (v) => { settings.audio.master = v; this._commit('audio'); },
      display: () => `${Math.round(settings.audio.master * 100)}%`,
    });

    sec.appendChild(el('div', 'pw-h2', 'Danger zone'));
    const dz = el('div', 'pwm-actions');
    dz.appendChild(btn('pw-btn danger', 'Reset all settings', () => {
      let ok = false;
      try { ok = window.confirm('Reset ALL settings to factory defaults? This includes controller calibration. The page will reload.'); }
      catch (e) { ok = false; }
      if (ok) {
        try { resetSettings(); } catch (e) { console.warn('[menu] resetSettings failed', e); }
      }
    }));
    sec.appendChild(dz);
    sec.appendChild(el('div', 'pwm-note', 'Restores every setting (including controller calibration) to factory defaults and reloads the sim.'));
  }

  // ------------------------------------------------------------
  // TAB: HELP
  // ------------------------------------------------------------
  _buildHelp(sec) {
    sec.appendChild(el('div', 'pw-h2', 'Key bindings'));
    const keys = el('div', 'pwm-keys');
    const key = (k, d) => {
      keys.appendChild(el('div', 'pwm-key-cell pw-mono', k));
      keys.appendChild(el('div', 'pwm-dim2', d));
    };
    key('ESC', 'Open / close this menu');
    key('SPACE', 'Arm / disarm motors');
    key('R', 'Reset drone to spawn');
    key('V', 'Toggle FPV / line-of-sight view');
    key('C', 'Toggle static overlay');
    key('↑ / ↓', 'Camera tilt down / up');
    key('← / →', 'FOV narrower / wider');
    key('I / K', 'Throttle (keyboard)');
    key('W / S', 'Pitch (keyboard)');
    key('A / D', 'Roll (keyboard)');
    key('J / L', 'Yaw (keyboard)');
    sec.appendChild(keys);

    sec.appendChild(el('div', 'pw-h2', 'How to FPV'));
    sec.appendChild(el('div', 'pwm-help-text',
      'In acro mode the drone never levels itself — you are the flight controller. ' +
      'Throttle controls climb, pitch and roll tilt the drone, and yaw rotates it around its vertical axis. ' +
      'To fly forward: pitch forward a little, then add throttle to hold altitude as thrust vectors away from vertical. ' +
      'Small inputs! FPV is flown with millimeters of stick, not full deflection. ' +
      'Arm with a low throttle, hover just above the ground, and practice gentle circuits before you try dives. ' +
      'If it all goes wrong: cut throttle, press R, and go again — crashes are free here.'));
  }

  // ------------------------------------------------------------
  // styles
  // ------------------------------------------------------------
  _injectStyles() {
    if (document.getElementById('pwm-style')) return;
    const style = document.createElement('style');
    style.id = 'pwm-style';
    style.textContent = `
.pwm-backdrop {
  position: fixed; inset: 0; z-index: 140;
  display: none; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.78);
}
.pwm-backdrop.pwm-open { display: flex; animation: pwm-fade 0.16s ease; }
@keyframes pwm-fade { from { opacity: 0; } to { opacity: 1; } }

.pwm-backdrop .pw-panel.pwm-panel {
  width: min(96vw, 1100px);
  max-width: min(96vw, 1100px);
  max-height: 85vh;
  padding: 0;
  display: flex; flex-direction: column;
  overflow: hidden;
  animation: pwm-pop 0.2s cubic-bezier(0.2, 0.9, 0.3, 1.15);
}
@keyframes pwm-pop { from { transform: scale(0.965); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.pwm-header {
  display: flex; align-items: baseline; gap: 14px; flex: none;
  padding: 20px 26px 15px;
  border-bottom: 1px solid var(--pw-line);
  background: linear-gradient(180deg, rgba(240,240,250,0.04), transparent);
}
.pwm-title {
  font-size: 24px; font-weight: 800; letter-spacing: 4px; color: #fff;
}
.pwm-title span { color: var(--pw-accent); }
.pwm-sub { font-size: 11px; letter-spacing: 3px; color: var(--pw-dim); text-transform: uppercase; }
.pwm-spacer { flex: 1; }
.pwm-paused { font-size: 11px; letter-spacing: 2px; color: var(--pw-warn); opacity: 0.85; }

.pwm-body { display: flex; flex: 1; min-height: 0; }
.pwm-sidebar {
  width: 188px; flex: none;
  padding: 14px 10px;
  border-right: 1px solid var(--pw-line);
  display: flex; flex-direction: column; gap: 3px;
  background: rgba(8,8,10,0.55);
  overflow-y: auto;
}
.pwm-tab {
  display: flex; align-items: center; gap: 10px;
  width: 100%; text-align: left;
  background: none; border: none;
  color: var(--pw-dim);
  font-family: var(--pw-font); font-size: 13.5px; font-weight: 600; letter-spacing: 0.6px;
  padding: 10px 14px; border-radius: var(--pw-radius);
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}
.pwm-tab:hover { background: rgba(255,255,255,0.05); color: var(--pw-text); }
.pwm-tab.sel { background: rgba(196,196,204,0.10); color: var(--pw-accent); box-shadow: inset 3px 0 0 var(--pw-accent); }
.pwm-tab-icon { width: 20px; text-align: center; filter: saturate(0.6); }
.pwm-tab.sel .pwm-tab-icon { filter: none; }

.pwm-content { flex: 1; min-width: 0; overflow-y: auto; overflow-x: hidden; padding: 6px 26px 34px; }
.pwm-section > .pw-h2:first-child { margin-top: 20px; }

.pwm-footer {
  display: flex; flex-wrap: wrap; gap: 14px 18px; align-items: center; flex: none;
  padding: 11px 26px 14px;
  border-top: 1px solid var(--pw-line);
  color: var(--pw-dim); font-size: 12px;
  background: rgba(8,8,10,0.55);
}
.pwm-foot-item { display: inline-flex; align-items: center; gap: 7px; }
.pwm-key {
  display: inline-block;
  border: 1px solid var(--pw-line); border-bottom-width: 2px;
  border-radius: var(--pw-radius); padding: 1px 7px;
  font-family: var(--pw-mono); font-size: 11px;
  background: rgba(255,255,255,0.05);
  color: var(--pw-text);
  white-space: nowrap;
}

.pwm-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0 6px; align-items: center; }
.pwm-note { font-size: 12px; color: var(--pw-dim); margin: 2px 0 10px; line-height: 1.55; }
.pwm-hint { display: inline-flex; color: var(--pw-dim); font-size: 12px; }
.pwm-dim2 { color: var(--pw-dim); }

.pwm-grid { display: grid; gap: 12px; margin: 6px 0 10px; }
.pwm-grid.c2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.pwm-grid.c3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.pwm-grid.c4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

.pwm-card {
  border: 1px solid var(--pw-line); border-radius: var(--pw-radius);
  padding: 14px; background: rgba(255,255,255,0.03);
  cursor: pointer; outline: none;
  transition: border-color 0.14s ease, background 0.14s ease, box-shadow 0.14s ease;
}
.pwm-card:hover, .pwm-card:focus-visible { border-color: rgba(196,196,204,0.45); background: rgba(196,196,204,0.05); }
.pwm-card.sel {
  border-color: var(--pw-accent);
  background: rgba(196,196,204,0.08);
  box-shadow: 0 0 0 1px var(--pw-accent);
}
.pwm-card-head { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
.pwm-card-title { font-size: 15px; font-weight: 700; letter-spacing: 0.4px; }
.pwm-badge {
  flex: none;
  font-size: 9.5px; letter-spacing: 1.2px; text-transform: uppercase;
  color: var(--pw-accent);
  border: 1px solid rgba(196,196,204,0.4);
  padding: 2px 8px; border-radius: 999px;
  white-space: nowrap;
}
.pwm-stats {
  display: grid; grid-template-columns: auto 1fr; gap: 3px 12px;
  margin: 10px 0 8px; font-size: 12px;
}
.pwm-stat-k { color: var(--pw-dim); }
.pwm-stat-v { color: var(--pw-text); }
.pwm-desc { font-size: 12px; color: var(--pw-dim); line-height: 1.5; }

.pwm-map-card .pwm-card-title { margin-bottom: 5px; }
.pwm-thumb {
  height: 96px; border-radius: var(--pw-radius); margin-bottom: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 38px; letter-spacing: 6px;
  border: 1px solid rgba(255,255,255,0.07);
  text-shadow: 0 4px 16px rgba(0,0,0,0.5);
}
.pwm-thumb.miami { background: linear-gradient(160deg, #123a5e 0%, #1d6f8f 45%, #d76b83 100%); }
.pwm-thumb.ashPrairie { background: linear-gradient(160deg, #3E3830 0%, #5C5346 40%, #8E8A82 70%, #6B4E3D 100%); }
.pwm-thumb.proc  { background: linear-gradient(160deg, #10331f 0%, #1d5e46 50%, #45753b 100%); }
.pwm-thumb.realworld { background: linear-gradient(160deg, #071c33 0%, #14507a 55%, #3fa0c0 100%); }

.pwm-rw-key { flex: 1; min-width: 200px; font-family: var(--pw-mono); letter-spacing: 1px; }
.pwm-rw-coord { width: 140px; font-family: var(--pw-mono); }
.pwm-rw-help-btn { margin: 4px 0 2px; font-size: 12px; }
.pwm-rw-help {
  border: 1px solid var(--pw-line); border-radius: var(--pw-radius);
  background: rgba(255,255,255,0.03);
  padding: 10px 14px; margin: 8px 0 4px;
}
.pwm-rw-help-row { display: flex; gap: 10px; font-size: 12.5px; line-height: 1.55; margin: 4px 0; }
.pwm-rw-help-n { color: var(--pw-accent); flex: none; }

.pwm-opt {
  border: 1px solid var(--pw-line); border-radius: var(--pw-radius);
  padding: 12px 14px; background: rgba(255,255,255,0.03);
  cursor: pointer; outline: none;
  transition: border-color 0.14s ease, background 0.14s ease, box-shadow 0.14s ease;
}
.pwm-opt:hover, .pwm-opt:focus-visible { border-color: rgba(196,196,204,0.45); background: rgba(196,196,204,0.05); }
.pwm-opt.sel {
  border-color: var(--pw-accent);
  background: rgba(196,196,204,0.08);
  box-shadow: 0 0 0 1px var(--pw-accent);
}
.pwm-opt-icon { font-size: 24px; margin-bottom: 4px; }
.pwm-opt-title { font-size: 14px; font-weight: 700; letter-spacing: 0.4px; }
.pwm-opt-desc { font-size: 11.5px; color: var(--pw-dim); margin-top: 3px; line-height: 1.45; }

.pwm-wizard {
  border: 1px solid var(--pw-line); border-radius: var(--pw-radius);
  padding: 6px 18px 16px;
  margin-top: 4px;
  background: rgba(8,8,10,0.55);
}
.pwm-step-h { display: flex; align-items: center; gap: 10px; margin: 16px 0 8px; }
.pwm-step-n {
  width: 22px; height: 22px; flex: none;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: rgba(196,196,204,0.12);
  border: 1px solid rgba(196,196,204,0.45);
  color: var(--pw-accent);
  font-family: var(--pw-mono); font-size: 12px; font-weight: 700;
}
.pwm-step-t { font-size: 13px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: var(--pw-accent); }
.pwm-seed { width: 150px; font-family: var(--pw-mono); }
.pwm-gen-row { margin-top: 16px; }
.pwm-summary { font-size: 12px; color: var(--pw-dim); letter-spacing: 0.5px; }

.pwm-seg { display: inline-flex; border: 1px solid var(--pw-line); border-radius: var(--pw-radius); overflow: hidden; }
.pwm-seg-btn {
  background: rgba(255,255,255,0.04); border: none;
  border-right: 1px solid var(--pw-line);
  color: var(--pw-dim);
  font-family: var(--pw-font); font-size: 12px; font-weight: 700; letter-spacing: 1px;
  padding: 8px 16px; cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}
.pwm-seg-btn:last-child { border-right: none; }
.pwm-seg-btn:hover { background: rgba(196,196,204,0.1); color: var(--pw-text); }
.pwm-seg-btn.sel { background: var(--pw-text); color: #000; }

.pwm-toggle {
  position: relative; flex: none;
  width: 46px; height: 24px;
  border-radius: 999px;
  background: rgba(255,255,255,0.12);
  border: 1px solid var(--pw-line);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.pwm-toggle::after {
  content: '';
  position: absolute; top: 2px; left: 2px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #8a8a96;
  transition: left 0.15s ease, background 0.15s ease;
}
.pwm-toggle.on { background: rgba(196,196,204,0.28); border-color: var(--pw-accent); }
.pwm-toggle.on::after { left: 24px; background: var(--pw-accent); }

.pwm-axis-h {
  display: flex; align-items: center; gap: 9px;
  margin: 18px 0 2px;
  font-size: 13px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase;
}
.pwm-swatch { width: 11px; height: 11px; border-radius: 2px; display: inline-block; }

.pwm-canvas {
  display: block; width: 100%; height: auto;
  border: 1px solid var(--pw-line); border-radius: var(--pw-radius);
  background: rgba(0,0,0,0.55);
  margin: 8px 0 12px;
}

.pwm-status {
  display: grid; grid-template-columns: auto 1fr; gap: 9px 20px;
  border: 1px solid var(--pw-line); border-radius: var(--pw-radius);
  padding: 14px 16px; margin: 8px 0 12px;
  background: rgba(255,255,255,0.03);
  font-size: 13px;
}
.pwm-status .k { color: var(--pw-dim); }
.pwm-status .v { font-family: var(--pw-mono); }
.pwm-ok { color: var(--pw-ok); }
.pwm-warn { color: var(--pw-warn); }

/* ---------- trails ---------- */
.pwm-rec-btn { min-width: 190px; letter-spacing: 1.4px; }
.pwm-rec-btn.rec {
  background: var(--pw-danger); color: #2a0505; border-color: transparent;
  box-shadow: 0 0 18px rgba(255,77,77,0.45);
}
.pwm-rec-btn.rec:hover { background: #ff6b6b; }
.pwm-rec-state { display: inline-flex; align-items: center; gap: 9px; font-size: 12px; letter-spacing: 2px; color: var(--pw-dim); }
.pwm-rec-dot {
  width: 10px; height: 10px; border-radius: 50%; flex: none;
  background: rgba(255,255,255,0.18); border: 1px solid var(--pw-line);
}
.pwm-rec-dot.on {
  background: var(--pw-danger); border-color: transparent;
  box-shadow: 0 0 10px rgba(255,77,77,0.9);
  animation: pwm-rec-blink 1.1s steps(1, end) infinite;
}
@keyframes pwm-rec-blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0.2; } }

.pwm-trail-input { flex: 1; min-width: 160px; max-width: 320px; }
.pwm-trail-head { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
.pwm-trail-h2 { margin: 18px 0 8px; }
.pwm-mini { padding: 7px 13px; font-size: 12px; }
.pwm-trail-list { display: flex; flex-direction: column; gap: 8px; margin: 4px 0 10px; }
.pwm-trail-row {
  display: flex; align-items: center; gap: 10px;
  border: 1px solid var(--pw-line); border-radius: 10px;
  padding: 11px 14px; background: rgba(255,255,255,0.03);
  transition: border-color 0.14s ease, background 0.14s ease;
}
.pwm-trail-row:hover { border-color: rgba(41,211,255,0.45); }
.pwm-trail-row.active {
  border-color: var(--pw-accent); background: rgba(41,211,255,0.09);
  box-shadow: 0 0 16px rgba(41,211,255,0.16);
}
.pwm-trail-main { flex: 1; min-width: 0; }
.pwm-trail-name { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; letter-spacing: 0.3px; }
.pwm-trail-meta { font-size: 11.5px; color: var(--pw-dim); margin-top: 4px; }
.pwm-badge.alt { color: var(--pw-warn); border-color: rgba(255,200,87,0.45); }
.pwm-trail-empty {
  border: 1px dashed var(--pw-line); border-radius: 10px;
  padding: 18px 14px; text-align: center; font-size: 13px;
}

.pwm-keys {
  display: grid; grid-template-columns: 120px 1fr; gap: 8px 18px;
  margin: 10px 0 16px; font-size: 13px; align-items: center;
}
.pwm-key-cell { color: var(--pw-accent); font-size: 12.5px; }
.pwm-help-text { font-size: 13px; line-height: 1.7; color: var(--pw-text); max-width: 680px; }

@media (max-width: 900px) {
  .pwm-sidebar { width: 132px; }
  .pwm-grid.c3, .pwm-grid.c4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pw-label { min-width: 120px; }
}
@media (max-width: 640px) {
  .pwm-sidebar { width: 52px; padding: 14px 6px; }
  .pwm-tab span:not(.pwm-tab-icon) { display: none; }
  .pwm-tab { justify-content: center; padding: 10px 6px; }
  .pwm-grid.c2, .pwm-grid.c3, .pwm-grid.c4 { grid-template-columns: 1fr; }
}
`;
    document.head.appendChild(style);
  }
}
