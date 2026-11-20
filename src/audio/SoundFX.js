// Procedural, game-wide Web Audio engine. The AudioContext survives scene changes.
export class SoundFX {
  constructor() {
    this.context = null;
    this.master = null;
    this.ambient = null;
    this.muted = this.readMutedPreference();
    this.destroyed = false;
    this.levelIndex = 0;
    this.lampVoice = null;
    this.lastStepAt = 0;
    this.focusGain = 1;
    this.masterVolume = 0.24;
    this.onVisibilityChange = () => this.setFocusGain(document.hidden ? 0 : 1);
    this.onWindowBlur = () => this.setFocusGain(0);
    this.onWindowFocus = () => this.setFocusGain(document.hidden ? 0 : 1);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("blur", this.onWindowBlur);
    window.addEventListener("focus", this.onWindowFocus);
  }

  readMutedPreference() {
    try { return localStorage.getItem("loop_sound_muted") === "1"; }
    catch { return false; }
  }

  ensureContext() {
    if (this.destroyed) return null;
    if (this.context && this.context.state !== "closed") return this.context;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = 0.0001;
    this.master.connect(this.context.destination);
    this.applyMasterGain(0.08);
    return this.context;
  }

  async unlock() {
    const context = this.ensureContext();
    if (!context) return false;
    if (context.state === "suspended") await context.resume();
    if (context.state !== "running") return false;
    this.applyMasterGain(0.12);
    this.startAmbient();
    return true;
  }

  applyMasterGain(timeConstant = 0.08) {
    if (!this.context || !this.master || this.context.state === "closed") return;
    const now = this.context.currentTime;
    const target = this.muted ? 0.0001 : this.masterVolume * this.focusGain;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(target, now, timeConstant);
  }

  setFocusGain(value) {
    this.focusGain = value ? 1 : 0.0001;
    this.applyMasterGain(0.12);
    if (!value && this.lampVoice) this.stopLampFeedback();
  }

  setMuted(value) {
    this.muted = Boolean(value);
    try { localStorage.setItem("loop_sound_muted", this.muted ? "1" : "0"); } catch {}
    this.applyMasterGain(0.045);
    return this.muted;
  }

  toggleMute() { return this.setMuted(!this.muted); }
  isMuted() { return this.muted; }
  getVolume() { return this.muted ? 0 : this.masterVolume * this.focusGain; }

  getMasterVolume() { return this.masterVolume; }

  setMasterVolume(value) {
    this.masterVolume = Math.max(0.03, Math.min(0.4, Number(value) || 0.24));
    this.applyMasterGain(0.08);
    return this.masterVolume;
  }

  setLevelAtmosphere(levelIndex = 0) {
    this.levelIndex = Math.max(0, Math.min(2, Math.floor(Number(levelIndex) || 0)));
    if (!this.context || this.context.state !== "running") return;
    this.startAmbient();
    if (!this.ambient) return;
    const now = this.context.currentTime;
    const settings = [
      { notes: [55, 82.41, 110], filter: 390, pulse: 0.035, rate: 0.07 },
      { notes: [49, 73.42, 98, 146.83], filter: 290, pulse: 0.05, rate: 0.11 },
      { notes: [41.2, 61.74, 82.41, 123.47], filter: 230, pulse: 0.075, rate: 1.8 }
    ][this.levelIndex];
    this.ambient.oscillators.forEach((oscillator, index) => {
      oscillator.frequency.setTargetAtTime(settings.notes[index] ?? settings.notes[0] * 2, now, 1.8);
    });
    this.ambient.filter.frequency.setTargetAtTime(settings.filter, now, 2.2);
    this.ambient.lfo.frequency.setTargetAtTime(settings.rate, now, 1.6);
    this.ambient.lfoGain.gain.setTargetAtTime(settings.pulse, now, 1.8);
    this.ambient.pulseGain.gain.setTargetAtTime(this.levelIndex === 2 ? 0.025 : 0.006, now, 1.5);
  }

  startAmbient() {
    const context = this.ensureContext();
    if (!context || context.state !== "running" || this.ambient) return;
    const input = context.createGain();
    const filter = context.createBiquadFilter();
    const output = context.createGain();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    const oscillators = [0, 1, 2, 3].map(() => context.createOscillator());
    const pulseOsc = context.createOscillator();
    const pulseGain = context.createGain();
    filter.type = "lowpass";
    filter.frequency.value = 390;
    filter.Q.value = 0.7;
    input.gain.value = 0.0001;
    output.gain.value = 0.0001;
    oscillators.forEach((osc, index) => {
      osc.type = index === 3 ? "triangle" : "sine";
      osc.frequency.value = [55, 82.41, 110, 164.81][index];
      osc.connect(input);
      osc.start();
    });
    lfo.type = "sine";
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 22;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    pulseOsc.type = "sine";
    pulseOsc.frequency.value = 1.8;
    pulseGain.gain.value = 0.006;
    pulseOsc.connect(pulseGain);
    pulseGain.connect(input.gain);
    input.connect(filter);
    filter.connect(output);
    output.connect(this.master);
    lfo.start();
    pulseOsc.start();
    const now = context.currentTime;
    output.gain.setTargetAtTime(0.42, now, 2.4);
    this.ambient = { input, filter, output, lfo, lfoGain, oscillators, pulseOsc, pulseGain };
    this.setLevelAtmosphere(this.levelIndex);
  }

  stopAmbient() {
    if (!this.ambient || !this.context || this.context.state === "closed") return;
    const nodes = this.ambient;
    this.ambient = null;
    const now = this.context.currentTime;
    nodes.output.gain.cancelScheduledValues(now);
    nodes.output.gain.setTargetAtTime(0.0001, now, 0.18);
    const oscillators = [...nodes.oscillators, nodes.lfo, nodes.pulseOsc];
    oscillators.forEach(osc => { try { osc.stop(now + 0.9); } catch {} });
    oscillators[0].onended = () => {
      for (const node of [...oscillators, nodes.input, nodes.filter, nodes.output, nodes.lfoGain, nodes.pulseGain]) {
        try { node.disconnect(); } catch {}
      }
    };
  }

  tone({ frequency = 440, endFrequency = frequency, duration = 0.12, type = "sine", volume = 0.12, delay = 0, detune = 0 } = {}) {
    const context = this.ensureContext();
    if (!context || context.state !== "running" || this.muted || this.focusGain < 0.5) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.detune.value = detune;
    oscillator.frequency.setValueAtTime(Math.max(1, frequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + Math.max(0.025, duration));
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + Math.min(0.035, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.onended = () => {
      try { oscillator.disconnect(); } catch {}
      try { gain.disconnect(); } catch {}
    };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  playJump() {
    this.tone({ frequency: 185, endFrequency: 620, duration: 0.22, type: "triangle", volume: 0.14 });
    this.tone({ frequency: 430, endFrequency: 850, duration: 0.16, type: "sine", volume: 0.045, delay: 0.025 });
  }

  playLand(fallSpeed = 300) {
    const impact = Math.max(0.35, Math.min(1, Number(fallSpeed) / 700));
    this.tone({ frequency: 105, endFrequency: 48, duration: 0.16, type: "sine", volume: 0.055 + impact * 0.11 });
    this.tone({ frequency: 240, endFrequency: 120, duration: 0.08, type: "triangle", volume: impact * 0.035 });
  }

  playRunStep(onBridge = false) {
    const now = this.context?.currentTime ?? 0;
    if (now - this.lastStepAt < (onBridge ? 0.24 : 0.31)) return;
    this.lastStepAt = now;
    if (onBridge) {
      this.tone({ frequency: 720, endFrequency: 430, duration: 0.095, type: "sine", volume: 0.035 });
      this.tone({ frequency: 1080, endFrequency: 760, duration: 0.07, type: "triangle", volume: 0.018, delay: 0.018 });
    } else {
      this.tone({ frequency: 92, endFrequency: 64, duration: 0.075, type: "sine", volume: 0.035 });
      this.tone({ frequency: 155, endFrequency: 110, duration: 0.045, type: "triangle", volume: 0.012, delay: 0.012 });
    }
  }

  beginLampFeedback() {
    const context = this.ensureContext();
    if (!context || context.state !== "running" || this.muted || this.lampVoice) return;
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 115;
    filter.type = "lowpass";
    filter.frequency.value = 520;
    filter.Q.value = 2.4;
    gain.gain.value = 0.0001;
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    oscillator.start();
    gain.gain.setTargetAtTime(0.035, context.currentTime, 0.08);
    this.lampVoice = { oscillator, filter, gain };
  }

  updateLampFeedback(coverage = 0) {
    if (!this.lampVoice || !this.context || this.context.state !== "running") return;
    const amount = Math.max(0, Math.min(1, Number(coverage) || 0));
    const now = this.context.currentTime;
    this.lampVoice.oscillator.frequency.setTargetAtTime(95 + amount * 260, now, 0.09);
    this.lampVoice.filter.frequency.setTargetAtTime(260 + amount * 2600, now, 0.1);
    this.lampVoice.gain.gain.setTargetAtTime(0.018 + amount * 0.055, now, 0.12);
  }

  stopLampFeedback() {
    if (!this.lampVoice || !this.context || this.context.state === "closed") return;
    const voice = this.lampVoice;
    this.lampVoice = null;
    const now = this.context.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0.0001, now, 0.045);
    try { voice.oscillator.stop(now + 0.28); } catch {}
    voice.oscillator.onended = () => {
      for (const node of [voice.oscillator, voice.filter, voice.gain]) {
        try { node.disconnect(); } catch {}
      }
    };
  }

  playBridge() {
    [392, 494, 587, 784].forEach((frequency, index) =>
      this.tone({ frequency, endFrequency: frequency * 1.42, duration: 0.48 + index * 0.035, type: "sine", volume: 0.045, delay: index * 0.045 })
    );
    this.tone({ frequency: 130, endFrequency: 260, duration: 0.36, type: "triangle", volume: 0.055 });
  }

  playBridgeFade() {
    this.tone({ frequency: 180, endFrequency: 48, duration: 0.42, type: "sine", volume: 0.09 });
  }

  playCrystal() {
    this.tone({ frequency: 520, endFrequency: 980, duration: 0.32, type: "sine", volume: 0.12 });
    this.tone({ frequency: 780, endFrequency: 1170, duration: 0.24, type: "sine", volume: 0.07, delay: 0.07 });
  }

  playTeleport() {
    [440, 554.37, 659.25, 880].forEach((frequency, index) =>
      this.tone({ frequency, endFrequency: frequency * 1.8, duration: 0.72, type: "sine", volume: 0.055, delay: index * 0.09 })
    );
    this.tone({ frequency: 110, endFrequency: 440, duration: 0.8, type: "triangle", volume: 0.045 });
  }

  playDeath() {
    this.tone({ frequency: 180, endFrequency: 28, duration: 0.72, type: "sawtooth", volume: 0.095 });
    this.tone({ frequency: 72, endFrequency: 18, duration: 0.8, type: "sine", volume: 0.11, delay: 0.04 });
  }

  destroy() {
    if (this.destroyed) return;
    this.stopLampFeedback();
    this.stopAmbient();
    this.destroyed = true;
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("blur", this.onWindowBlur);
    window.removeEventListener("focus", this.onWindowFocus);
    if (this.context && this.context.state !== "closed") this.context.close().catch(() => {});
    this.context = null;
    this.master = null;
  }
}
