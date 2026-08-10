// ============================================================
// PropWash FPV — synthesized motor audio (WebAudio, no assets)
// ============================================================
import { settings } from '../core/state.js';

export class MotorAudio {
  constructor() {
    this.ctx = null;
    this.started = false;
    this.baseFreq = 140;
    this.freqSpan = 420;
    this.smoothed = 0;
  }

  setDrone(spec) {
    // smaller props scream higher
    const inch = spec.propInches || 5;
    this.baseFreq = inch <= 2 ? 320 : inch <= 3.5 ? 220 : 130;
    this.freqSpan = inch <= 2 ? 700 : inch <= 3.5 ? 560 : 430;
  }

  start() {
    if (this.started) { this.ctx?.resume?.(); return; }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.ctx = ctx;

      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.lowpass = ctx.createBiquadFilter();
      this.lowpass.type = 'lowpass';
      this.lowpass.frequency.value = 12000;
      this.master.connect(this.lowpass).connect(ctx.destination);

      // soft voicing: triangles + a sine sub an octave down — a hum, not a rasp
      this.oscs = [];
      for (const [type, detune, gain] of [['triangle', 0, 0.26], ['triangle', 9, 0.14], ['sine', 0, 0.32]]) {
        const o = ctx.createOscillator();
        o.type = type;
        o.detune.value = detune * 3;
        const g = ctx.createGain();
        g.gain.value = gain;
        o.connect(g).connect(this.master);
        o.start();
        this.oscs.push(o);
      }

      // prop noise
      const len = ctx.sampleRate * 1;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buf; noise.loop = true;
      this.noiseFilter = ctx.createBiquadFilter();
      this.noiseFilter.type = 'bandpass';
      this.noiseFilter.frequency.value = 700;
      this.noiseFilter.Q.value = 0.6;
      this.noiseGain = ctx.createGain();
      this.noiseGain.gain.value = 0.055;
      noise.connect(this.noiseFilter).connect(this.noiseGain).connect(this.master);
      noise.start();

      this.started = true;
    } catch (e) { console.warn('audio init failed', e); }
  }

  setVolume() { /* read live from settings in update */ }

  update(dt, { motorOutput, distance, los }) {
    if (!this.started || !this.ctx) return;
    this.smoothed += (motorOutput - this.smoothed) * Math.min(1, dt * 14);
    const m = this.smoothed;
    const t = this.ctx.currentTime;

    const freq = this.baseFreq + m * this.freqSpan;
    for (let i = 0; i < this.oscs.length; i++) {
      this.oscs[i].frequency.setTargetAtTime(freq * (i === 2 ? 0.5 : 1), t, 0.02);
    }
    this.noiseFilter.frequency.setTargetAtTime(450 + m * 1800, t, 0.04);

    let vol = settings.audio.master * (m > 0.005 ? 0.04 + m * 0.24 : 0);
    if (los) {
      const att = 1 / (1 + Math.max(0, distance - 4) * 0.12);
      vol *= att;
      this.lowpass.frequency.setTargetAtTime(900 + 3200 * att, t, 0.06);
    } else {
      // keep the top end rolled off — screaming highs are what grate
      this.lowpass.frequency.setTargetAtTime(2400 + m * 2800, t, 0.06);
    }
    this.master.gain.setTargetAtTime(vol, t, 0.05);
  }
}
