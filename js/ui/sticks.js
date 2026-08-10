// ============================================================
// PropWash FPV — on-screen stick position overlay
// Two Mode-2 stick boxes at the bottom of the screen:
// left = throttle/yaw, right = pitch/roll.
// ============================================================

const SIZE = 104;

export class StickOverlay {
  constructor(container) {
    this.root = document.createElement('div');
    this.root.style.cssText = [
      'position:absolute', 'bottom:4.2%', 'left:50%',
      'transform:translateX(-50%)', 'display:flex', 'gap:210px',
      'pointer-events:none', 'z-index:5',
    ].join(';');
    this.left = this._makeStick();
    this.right = this._makeStick();
    this.root.appendChild(this.left.el);
    this.root.appendChild(this.right.el);
    container.appendChild(this.root);
    this._last = { t: -9, y: -9, r: -9, p: -9 };
  }

  _makeStick() {
    const el = document.createElement('canvas');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    el.width = SIZE * dpr;
    el.height = SIZE * dpr;
    el.style.cssText = [
      `width:${SIZE}px`, `height:${SIZE}px`,
      'background:rgba(28, 42, 76, 0.42)',
      'border:1px solid rgba(255,255,255,0.14)',
      'border-radius:10px',
    ].join(';');
    const ctx = el.getContext('2d');
    ctx.scale(dpr, dpr);
    return { el, ctx };
  }

  setVisible(b) {
    this.root.style.display = b ? 'flex' : 'none';
  }

  /** controls: {throttle 0..1, roll, pitch, yaw -1..1} */
  update(c) {
    const l = this._last;
    if (Math.abs(l.t - c.throttle) < 0.004 && Math.abs(l.y - c.yaw) < 0.004 &&
        Math.abs(l.r - c.roll) < 0.004 && Math.abs(l.p - c.pitch) < 0.004) return;
    l.t = c.throttle; l.y = c.yaw; l.r = c.roll; l.p = c.pitch;
    // left stick: x = yaw, y = throttle (0 = bottom)
    this._draw(this.left.ctx, c.yaw, c.throttle * 2 - 1);
    // right stick: x = roll, y = pitch (forward = up)
    this._draw(this.right.ctx, c.roll, c.pitch);
  }

  _draw(ctx, x, y) {
    const s = SIZE, half = s / 2, span = half - 14;
    ctx.clearRect(0, 0, s, s);
    // dashed crosshair
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(8, half); ctx.lineTo(s - 8, half);
    ctx.moveTo(half, 8); ctx.lineTo(half, s - 8);
    ctx.stroke();
    ctx.setLineDash([]);
    // center dot
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(half, half, 2.4, 0, Math.PI * 2);
    ctx.fill();
    // stick position ring
    const px = half + Math.max(-1, Math.min(1, x)) * span;
    const py = half - Math.max(-1, Math.min(1, y)) * span;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py, 6.5, 0, Math.PI * 2);
    ctx.stroke();
  }
}
