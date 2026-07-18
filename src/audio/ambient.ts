// A gentle, procedural ambient score — generated entirely in the browser with
// the Web Audio API so the experience is fully self-contained (no audio files,
// no licensing, no download weight). It breathes: a warm pad, a slow swelling
// chord, soft "wave" noise, and occasional shimmering chimes like distant
// stars. All of it can be started only after a user gesture (browser policy),
// which is why the journey opens with a single tap.

type Voice = {
  osc: OscillatorNode;
  gain: GainNode;
};

export class Ambient {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private started = false;
  private chimeTimer: number | null = null;
  private voices: Voice[] = [];
  private waveGain: GainNode | null = null;

  get isRunning() {
    return this.started;
  }

  async start() {
    if (this.started) return;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new Ctx();
    await this.ctx.resume();

    const master = this.ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(this.ctx.destination);
    this.master = master;

    // Fade the whole score in gently.
    master.gain.exponentialRampToValueAtTime(
      0.5,
      this.ctx.currentTime + 6
    );

    this.buildPad();
    this.buildWaves();
    this.scheduleChimes();

    this.started = true;
  }

  // A soft evolving chord (D major-ish, warm and hopeful).
  private buildPad() {
    if (!this.ctx || !this.master) return;
    const freqs = [146.83, 220.0, 293.66, 369.99]; // D3 A3 D4 F#4
    const padBus = this.ctx.createGain();
    padBus.gain.value = 0.22;
    padBus.connect(this.master);

    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    lp.Q.value = 0.4;
    lp.connect(padBus);

    for (const f of freqs) {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;

      // slow detune drift for a living, breathing chord
      const drift = this.ctx.createOscillator();
      drift.type = "sine";
      drift.frequency.value = 0.05 + Math.random() * 0.06;
      const driftGain = this.ctx.createGain();
      driftGain.gain.value = 2.5;
      drift.connect(driftGain);
      driftGain.connect(osc.detune);
      drift.start();

      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      // slow tremolo swell
      const lfo = this.ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.06 + Math.random() * 0.05;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.09;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      gain.gain.value = 0.12;

      osc.connect(gain);
      gain.connect(lp);
      osc.start();

      this.voices.push({ osc, gain });
    }
  }

  // Filtered noise that rises and falls like breaking waves.
  private buildWaves() {
    if (!this.ctx || !this.master) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(
      1,
      bufferSize,
      this.ctx.sampleRate
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 500;
    bp.Q.value = 0.6;

    const waveGain = this.ctx.createGain();
    waveGain.gain.value = 0.05;

    // slow swell of the surf
    const swell = this.ctx.createOscillator();
    swell.type = "sine";
    swell.frequency.value = 0.09;
    const swellGain = this.ctx.createGain();
    swellGain.gain.value = 0.045;
    swell.connect(swellGain);
    swellGain.connect(waveGain.gain);
    swell.start();

    noise.connect(bp);
    bp.connect(waveGain);
    waveGain.connect(this.master);
    noise.start();
    this.waveGain = waveGain;
  }

  // Distant, sparse bell-like chimes — stars singing.
  private scheduleChimes() {
    const scale = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66]; // D major pentatonic-ish, high
    const tick = () => {
      if (!this.ctx || !this.master) return;
      const f = scale[Math.floor(Math.random() * scale.length)];
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = this.ctx.createGain();
      const now = this.ctx.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.06, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 3.4);

      this.chimeTimer = window.setTimeout(
        tick,
        2600 + Math.random() * 5200
      );
    };
    this.chimeTimer = window.setTimeout(tick, 3500);
  }

  /** Swell the score for the birthday reveal. */
  bloom() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.exponentialRampToValueAtTime(0.72, now + 4);
  }

  setMuted(muted: boolean) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(
      Math.max(0.0001, this.master.gain.value),
      now
    );
    this.master.gain.exponentialRampToValueAtTime(
      muted ? 0.0001 : 0.5,
      now + 0.8
    );
  }

  dispose() {
    if (this.chimeTimer) window.clearTimeout(this.chimeTimer);
    this.voices.forEach((v) => {
      try {
        v.osc.stop();
      } catch {
        /* already stopped */
      }
    });
    this.ctx?.close();
    this.ctx = null;
    this.started = false;
  }
}
