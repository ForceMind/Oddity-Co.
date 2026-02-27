const MASTER_VOLUME = 0.05;

export class SoundEngine {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.ctx = null;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
  }

  isEnabled() {
    return this.enabled;
  }

  beep(type) {
    if (!this.enabled) {
      return;
    }

    const ctx = this.ensureCtx();
    if (!ctx) {
      return;
    }

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => undefined);
    }

    const now = ctx.currentTime;

    if (type === "craft") {
      tone(ctx, now, 520, 0.07, "triangle", 0.8);
      tone(ctx, now + 0.07, 760, 0.09, "triangle", 1);
      return;
    }

    if (type === "care") {
      tone(ctx, now, 400, 0.06, "sine", 0.8);
      tone(ctx, now + 0.05, 520, 0.06, "sine", 0.75);
      return;
    }

    if (type === "stage") {
      tone(ctx, now, 560, 0.08, "triangle", 1);
      tone(ctx, now + 0.07, 840, 0.09, "triangle", 1);
      tone(ctx, now + 0.16, 980, 0.11, "triangle", 0.9);
      return;
    }

    if (type === "order") {
      tone(ctx, now, 640, 0.06, "square", 0.8);
      tone(ctx, now + 0.07, 740, 0.06, "square", 0.8);
      tone(ctx, now + 0.14, 920, 0.08, "square", 0.9);
      return;
    }

    if (type === "effect") {
      tone(ctx, now, 320, 0.05, "sawtooth", 0.7);
      tone(ctx, now + 0.05, 270, 0.08, "sawtooth", 0.7);
      return;
    }

    if (type === "success") {
      tone(ctx, now, 620, 0.05, "triangle", 0.7);
      tone(ctx, now + 0.06, 860, 0.07, "triangle", 0.7);
      return;
    }
  }

  ensureCtx() {
    if (typeof window === "undefined") {
      return null;
    }
    if (this.ctx) {
      return this.ctx;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      return null;
    }
    this.ctx = new Ctx();
    return this.ctx;
  }
}

function tone(ctx, start, freq, duration, wave, gainBoost = 1) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = wave;
  osc.frequency.setValueAtTime(freq, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(MASTER_VOLUME * gainBoost, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + duration + 0.02);
}
