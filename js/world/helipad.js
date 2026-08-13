// ============================================================
// PropWash FPV — shared helipad / launch pad
// A real helipad reads instantly as "take off and land here":
// painted circle, bold H, and a ring of corner markers.
// Used by every map so the spawn point is unmistakable.
// ============================================================
import * as THREE from 'three';

const PAD_SEGMENTS = 48;

/**
 * Paint a helipad top-down onto a canvas: dark asphalt disc, white ring,
 * bold H, and corner ticks. Returns a THREE.CanvasTexture.
 */
function helipadTexture(accent = '#ffffff') {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');

  // transparent outside the disc so the pad blends onto any ground
  g.clearRect(0, 0, S, S);

  const cx = S / 2, cy = S / 2, R = S * 0.5;

  // deck
  g.beginPath();
  g.arc(cx, cy, R * 0.97, 0, Math.PI * 2);
  g.fillStyle = '#22262b';
  g.fill();

  // subtle deck texture
  for (let i = 0; i < 900; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * R * 0.96;
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    g.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2, 2);
  }

  // outer ring
  g.strokeStyle = accent;
  g.lineWidth = S * 0.035;
  g.beginPath();
  g.arc(cx, cy, R * 0.80, 0, Math.PI * 2);
  g.stroke();

  // the H — thick, centred, aviation proportions
  const hH = R * 0.86;          // total height of the H
  const hW = R * 0.62;          // total width
  const bar = R * 0.155;        // stroke thickness
  g.fillStyle = accent;
  // left upright
  g.fillRect(cx - hW / 2, cy - hH / 2, bar, hH);
  // right upright
  g.fillRect(cx + hW / 2 - bar, cy - hH / 2, bar, hH);
  // crossbar
  g.fillRect(cx - hW / 2, cy - bar / 2, hW, bar);

  // corner ticks at the cardinal points, outside the ring
  g.lineWidth = S * 0.022;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const r0 = R * 0.87, r1 = R * 0.95;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    g.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

let sharedTex = null;
function getTexture() {
  if (!sharedTex) sharedTex = helipadTexture();
  return sharedTex;
}

/**
 * Build a helipad lying flat at (x, y, z).
 *
 * @param {number} x
 * @param {number} y        ground height at (x, z) — the pad sits just above it
 * @param {number} z
 * @param {object} [opts]
 * @param {number} [opts.radius=2.4]     pad radius in metres
 * @param {boolean} [opts.lights=true]   emissive perimeter markers
 * @param {number} [opts.emissive=0x29d3ff]
 * @returns {{ group: THREE.Group, topY: number, dispose: () => void }}
 *          `topY` is the landing surface height. The pad is painted flush, so
 *          this equals the ground height passed in — spawn above THIS.
 */
export function buildHelipad(x, y, z, opts = {}) {
  const radius = opts.radius !== undefined ? opts.radius : 2.4;
  const wantLights = opts.lights !== false;
  const emissive = opts.emissive !== undefined ? opts.emissive : 0x29d3ff;

  const group = new THREE.Group();
  group.name = 'helipad';
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };

  // The pad is PAINTED ON the ground, not a raised deck. Physics rests the
  // airframe on the terrain height, so any deck thickness would stick up
  // through the drone and read as the drone clipping into the pad.
  // polygonOffset keeps it from z-fighting with the ground instead.
  const deckGeo = track(new THREE.CircleGeometry(radius, PAD_SEGMENTS));
  deckGeo.rotateX(-Math.PI / 2);
  const topMat = track(new THREE.MeshStandardMaterial({
    map: getTexture(),
    roughness: 0.85,
    metalness: 0,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  }));
  const deck = new THREE.Mesh(deckGeo, topMat);
  deck.position.set(x, y + 0.012, z);
  deck.receiveShadow = true;
  group.add(deck);

  if (wantLights) {
    const lampGeo = track(new THREE.SphereGeometry(0.055, 8, 6));
    const lampMat = track(new THREE.MeshStandardMaterial({
      color: 0x0a2a33, emissive, emissiveIntensity: 2.4,
    }));
    const n = 8;
    const lamps = new THREE.InstancedMesh(lampGeo, lampMat, n);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      m4.makeTranslation(x + Math.cos(a) * radius * 0.93, y + 0.06, z + Math.sin(a) * radius * 0.93);
      lamps.setMatrixAt(i, m4);
    }
    lamps.instanceMatrix.needsUpdate = true;
    group.add(lamps);
  }

  return {
    group,
    // Flush pad: the walkable surface IS the ground height it was placed on.
    topY: y,
    dispose() {
      for (const d of disposables) { try { d.dispose?.(); } catch (e) { /* noop */ } }
    },
  };
}

/** Free the module-level shared texture (maps normally never need this). */
export function disposeHelipadShared() {
  if (sharedTex) { sharedTex.dispose(); sharedTex = null; }
}
