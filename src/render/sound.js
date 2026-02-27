const FX_VOLUME = 0.06;
const BGM_VOLUME = 0.025;

const BGM_PATTERNS = {
  lab: {
    bar: 1.6,
    lead: [392, 440, 523, 587, 523, 440, 392, 349],
    bass: [196, 196, 220, 220],
  },
  pet: {
    bar: 1.6,
    lead: [330, 392, 440, 494, 440, 392, 370, 330],
    bass: [165, 185, 196, 185],
  },
  company: {
    bar: 1.6,
    lead: [440, 523, 587, 659, 587, 523, 494, 440],
    bass: [220, 247, 262, 247],
  },
};

export class SoundEngine {
  constructor({ effects = true, bgm = true } = {}) {
    this.effectsEnabled = effects;
    this.bgmEnabled = bgm;
    this.theme = "lab";
    this.ctx = null;
    this.bgmTimer = null;
    this.nextBarAt = 0;
  }

  setEffectsEnabled(enabled) {
    this.effectsEnabled = Boolean(enabled);
  }

  setBgmEnabled(enabled) {
    this.bgmEnabled = Boolean(enabled);
    if (!this.bgmEnabled) {
      this.stopBgm();
      return;
    }
    this.startBgm();
  }

  setTheme(theme) {
    if (!BGM_PATTERNS[theme]) {
      return;
    }
    if (this.theme === theme) {
      return;
    }
    this.theme = theme;
    if (this.bgmEnabled) {
      this.startBgm(true);
    }
  }

  beep(type) {
    if (!this.effectsEnabled) {
      return;
    }

    const ctx = this.ensureCtx();
    if (!ctx) {
      return;
    }

    this.resumeIfNeeded();
    const now = ctx.currentTime;

    if (type === "craft") {
      tone(ctx, now, 520, 0.07, "triangle", FX_VOLUME * 0.9);
      tone(ctx, now + 0.07, 760, 0.08, "triangle", FX_VOLUME);
      return;
    }

    if (type === "care") {
      tone(ctx, now, 410, 0.05, "sine", FX_VOLUME * 0.75);
      tone(ctx, now + 0.045, 520, 0.06, "sine", FX_VOLUME * 0.8);
      return;
    }

    if (type === "stage") {
      tone(ctx, now, 560, 0.08, "triangle", FX_VOLUME);
      tone(ctx, now + 0.08, 840, 0.09, "triangle", FX_VOLUME);
      tone(ctx, now + 0.17, 980, 0.1, "triangle", FX_VOLUME * 0.95);
      return;
    }

    if (type === "order") {
      tone(ctx, now, 640, 0.05, "square", FX_VOLUME * 0.8);
      tone(ctx, now + 0.065, 760, 0.05, "square", FX_VOLUME * 0.8);
      tone(ctx, now + 0.13, 920, 0.08, "square", FX_VOLUME * 0.85);
      return;
    }

    if (type === "effect") {
      tone(ctx, now, 300, 0.05, "sawtooth", FX_VOLUME * 0.75);
      tone(ctx, now + 0.05, 260, 0.07, "sawtooth", FX_VOLUME * 0.7);
      return;
    }

    if (type === "success") {
      tone(ctx, now, 620, 0.05, "triangle", FX_VOLUME * 0.7);
      tone(ctx, now + 0.06, 860, 0.07, "triangle", FX_VOLUME * 0.7);
      return;
    }
  }

  startBgm(forceRestart = false) {
    if (!this.bgmEnabled) {
      return;
    }

    const ctx = this.ensureCtx();
    if (!ctx) {
      return;
    }

    this.resumeIfNeeded();

    if (forceRestart) {
      this.stopBgm();
    }

    if (this.bgmTimer) {
      return;
    }

    this.nextBarAt = ctx.currentTime + 0.08;
    this.scheduleBar(this.nextBarAt);

    this.bgmTimer = setInterval(() => {
      if (!this.bgmEnabled || !this.ctx) {
        this.stopBgm();
        return;
      }

      const pattern = BGM_PATTERNS[this.theme] ?? BGM_PATTERNS.lab;
      if (this.nextBarAt < this.ctx.currentTime + 0.12) {
        this.nextBarAt = this.ctx.currentTime + 0.12;
      }
      this.scheduleBar(this.nextBarAt);
      this.nextBarAt += pattern.bar;
    }, 260);
  }

  stopBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  dispose() {
    this.stopBgm();
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

  resumeIfNeeded() {
    if (!this.ctx) {
      return;
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => undefined);
    }
  }

  scheduleBar(startAt) {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }

    const pattern = BGM_PATTERNS[this.theme] ?? BGM_PATTERNS.lab;
    const step = pattern.bar / pattern.lead.length;

    for (let i = 0; i < pattern.lead.length; i += 1) {
      tone(ctx, startAt + step * i, pattern.lead[i], step * 0.78, "triangle", BGM_VOLUME);
    }

    const bassStep = pattern.bar / pattern.bass.length;
    for (let i = 0; i < pattern.bass.length; i += 1) {
      tone(ctx, startAt + bassStep * i, pattern.bass[i], bassStep * 0.85, "sine", BGM_VOLUME * 0.8);
    }
  }
}

function tone(ctx, start, freq, duration, wave, gainLevel) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = wave;
  osc.frequency.setValueAtTime(freq, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainLevel, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + duration + 0.02);
}
