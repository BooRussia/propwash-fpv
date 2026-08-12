import * as THREE from 'three';

// ---------- canvas textures (procedural fallbacks + deco windows) ----------
export function windowTexture(rng, lit = 0.55, warmBias = 0.7) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#0b1420';
  g.fillRect(0, 0, 128, 256);
  const cols = 6, rows = 18;
  const cw = 128 / cols, ch = 256 / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (rng() < lit) {
        g.fillStyle = rng() < warmBias
          ? `rgba(255, ${190 + (rng() * 40) | 0}, 120, ${0.75 + rng() * 0.25})`
          : `rgba(160, 210, 255, ${0.6 + rng() * 0.35})`;
      } else {
        g.fillStyle = 'rgba(30, 44, 60, 0.9)';
      }
      g.fillRect(i * cw + 2, j * ch + 2, cw - 4, ch - 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function stripeTexture(base, stripe, w = 256, h = 256, planks = 14) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.fillStyle = stripe;
  for (let i = 0; i < planks; i++) g.fillRect(0, (h / planks) * i, w, 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function roadTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#23262a'; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 500; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
    g.fillRect(Math.random() * 256, Math.random() * 128, 2, 2);
  }
  g.fillStyle = '#e8c545';
  for (let x = 0; x < 256; x += 42) g.fillRect(x, 61, 22, 5);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// aoMap UVs: three r180 samples aoMap through texture.channel (default 0 → 'uv'),
// but we alias uv1/uv2 too so any channel choice — and older code paths — resolve.
export function setAoUVs(geo) {
  if (!geo.attributes.uv) return;
  geo.setAttribute('uv1', geo.attributes.uv);
  geo.setAttribute('uv2', geo.attributes.uv);
}
