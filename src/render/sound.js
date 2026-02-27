const FX_VOLUME = 0.055;
const BGM_VOLUME = 0.026;
const SCHEDULE_AHEAD = 0.35;
const SCHEDULER_MS = 80;

const THEMES = {
  lab: {
    tempo: 100,
    leadWave: "triangle",
    bassWave: "sine",
    lead: [
      57, null, 60, null, 62, null, 64, null, 62, null, 60, null, 57, null, 55, null,
      57, null, 60, null, 62, 64, 65, null, 62, null, 60, null, 57, null, 55, null,
      55, null, 59, null, 60, null, 62, null, 60, null, 59, null, 55, null, 52, null,
      57, null, 60, null, 62, null, 64, 65, 62, null, 60, null, 57, null, 55, null,
    ],
    bass: [
      33, null, null, null, 33, null, null, null, 35, null, null, null, 35, null, null, null,
      33, null, null, null, 33, null, null, null, 36, null, null, null, 36, null, null, null,
      31, null, null, null, 31, null, null, null, 33, null, null, null, 33, null, null, null,
      33, null, null, null, 33, null, null, null, 35, null, null, null, 35, null, null, null,
    ],
  },
  pet: {
    tempo: 94,
    leadWave: "sine",
    bassWave: "triangle",
    lead: [
      52, null, 55, null, 57, null, 59, null, 57, null, 55, null, 52, null, 50, null,
      52, null, 55, null, 57, null, 59, 60, 57, null, 55, null, 52, null, 50, null,
      50, null, 53, null, 55, null, 57, null, 55, null, 53, null, 50, null, 48, null,
      52, null, 55, null, 57, null, 59, 60, 57, null, 55, null, 52, null, 50, null,
    ],
    bass: [
      28, null, null, null, 28, null, null, null, 31, null, null, null, 31, null, null, null,
      28, null, null, null, 28, null, null, null, 33, null, null, null, 33, null, null, null,
      26, null, null, null, 26, null, null, null, 28, null, null, null, 28, null, null, null,
      28, null, null, null, 28, null, null, null, 31, null, null, null, 31, null, null, null,
    ],
  },
  company: {
    tempo: 108,
    leadWave: "square",
    bassWave: "sine",
    lead: [
      60, null, 64, null, 67, null, 71, null, 67, null, 64, null, 60, null, 59, null,
      60, null, 64, null, 67, null, 71, 72, 67, null, 64, null, 60, null, 59, null,
      59, null, 62, null, 65, null, 69, null, 65, null, 62, null, 59, null, 57, null,
      60, null, 64, null, 67, null, 71, 72, 67, null, 64, null, 60, null, 59, null,
    ],
    bass: [
      36, null, null, null, 36, null, null, null, 38, null, null, null, 38, null, null, null,
      36, null, null, null, 36, null, null, null, 40, null, null, null, 40, null, null, null,
      35, null, null, null, 35, null, null, null, 36, null, null, null, 36, null, null, null,
      36, null, null, null, 36, null, null, null, 38, null, null, null, 38, null, null, null,
    ],
  },
};

export class SoundEngine {
  constructor({ effects = true, bgm = true } = {}) {
    this.effectsEnabled = effects;
    this.bgmEnabled = bgm;
    this.theme = "lab";

    this.ctx = null;
    this.schedulerId = null;
    this.nextStepTime = 0;
    this.stepIndex = 0;
  }

  setEffectsEnabled(enabled) {
    this.effectsEnabled = Boolean(enabled);
  }

  setBgmEnabled(enabled) {
    const next = Boolean(enabled);
    if (this.bgmEnabled === next) {
      return;
    }

    this.bgmEnabled = next;
    if (!next) {
      this.stopBgm();
      return;
    }
    this.startBgm(true);
  }

  setTheme(theme) {
    if (!THEMES[theme]) {
      return;
    }
    if (this.theme === theme) {
      return;
    }

    this.theme = theme;
    if (this.bgmEnabled && this.ctx) {
      this.stepIndex = 0;
      this.nextStepTime = this.ctx.currentTime + 0.06;
    }
  }

  beep(type) {
    if (!this.effectsEnabled) {
      return;
    }

    const ctx = this.#ensureCtx();
    if (!ctx) {
      return;
    }

    this.#resumeIfNeeded();
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
    }
  }

  startBgm(forceRestart = false) {
    if (!this.bgmEnabled) {
      return;
    }

    const ctx = this.#ensureCtx();
    if (!ctx) {
      return;
    }

    this.#resumeIfNeeded();

    if (forceRestart) {
      this.stopBgm();
    }

    if (this.schedulerId) {
      return;
    }

    this.stepIndex = 0;
    this.nextStepTime = ctx.currentTime + 0.08;
    this.schedulerId = setInterval(() => this.#scheduleSteps(), SCHEDULER_MS);
  }

  stopBgm() {
    if (!this.schedulerId) {
      return;
    }
    clearInterval(this.schedulerId);
    this.schedulerId = null;
  }

  dispose() {
    this.stopBgm();
  }

  #scheduleSteps() {
    if (!this.bgmEnabled || !this.ctx) {
      return;
    }

    const ctx = this.ctx;
    const theme = THEMES[this.theme] ?? THEMES.lab;
    const stepDuration = 60 / theme.tempo / 2;

    while (this.nextStepTime < ctx.currentTime + SCHEDULE_AHEAD) {
      this.#playThemeStep(theme, this.stepIndex, this.nextStepTime, stepDuration);
      this.nextStepTime += stepDuration;
      this.stepIndex = (this.stepIndex + 1) % theme.lead.length;
    }
  }

  #playThemeStep(theme, stepIndex, when, stepDuration) {
    const leadMidi = theme.lead[stepIndex];
    const bassMidi = theme.bass[stepIndex];

    if (Number.isFinite(leadMidi)) {
      tone(this.ctx, when, midiToFreq(leadMidi), stepDuration * 0.9, theme.leadWave, BGM_VOLUME);
    }

    if (Number.isFinite(bassMidi)) {
      tone(this.ctx, when, midiToFreq(bassMidi), stepDuration * 1.05, theme.bassWave, BGM_VOLUME * 0.8);
    }
  }

  #ensureCtx() {
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

  #resumeIfNeeded() {
    if (!this.ctx || this.ctx.state !== "suspended") {
      return;
    }
    this.ctx.resume().catch(() => undefined);
  }
}

function midiToFreq(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
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
