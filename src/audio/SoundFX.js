// One game-wide procedural sound manager. Scene transitions must not destroy this instance.
export class SoundFX {
  constructor() {
    this.context = null;
    this.master = null;
    this.ambientNodes = null;
    this.muted = this.readMutedPreference();
    this.destroyed = false;
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
    this.master.gain.value = this.muted ? 0 : .24;
    this.master.connect(this.context.destination);
    return this.context;
  }
  async unlock() {
    const context = this.ensureContext();
    if (!context) return false;
    if (context.state === "suspended") await context.resume();
    return context.state === "running";
  }
  setMuted(value) {
    this.muted = Boolean(value);
    try { localStorage.setItem("loop_sound_muted", this.muted ? "1" : "0"); } catch {}
    if (this.master && this.context && this.context.state !== "closed") {
      const now = this.context.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(this.muted ? 0 : .24, now, .025);
    }
    return this.muted;
  }
  toggleMute() { return this.setMuted(!this.muted); }
  isMuted() { return this.muted; }
  getVolume() { return this.muted ? 0 : .24; }
  tone({ frequency = 440, endFrequency = frequency, duration = .12, type = "sine", volume = .35, delay = 0 } = {}) {
    const context = this.ensureContext();
    if (!context || this.muted || context.state !== "running") return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(1, frequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + Math.min(.02, duration * .25));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + .015);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  playJump() { this.tone({ frequency: 230, endFrequency: 510, duration: .14, type: "triangle", volume: .24 }); }
  playLand() { this.tone({ frequency: 145, endFrequency: 75, duration: .11, type: "sine", volume: .2 }); }
  playCrystal() { this.tone({ frequency: 520, endFrequency: 980, duration: .32, type: "sine", volume: .2 }); this.tone({ frequency: 780, endFrequency: 1170, duration: .24, type: "sine", volume: .12, delay: .07 }); }
  playBridge() { this.tone({ frequency: 170, endFrequency: 440, duration: .42, type: "triangle", volume: .18 }); }
  playTeleport() { this.tone({ frequency: 680, endFrequency: 180, duration: .5, type: "sawtooth", volume: .13 }); }
  playDeath() { this.tone({ frequency: 240, endFrequency: 42, duration: .5, type: "triangle", volume: .2 }); }
  startAmbient() {
    const context = this.ensureContext();
    if (!context || this.ambientNodes || this.muted || context.state !== "running") return;
    const gain = context.createGain();
    const low = context.createOscillator();
    const high = context.createOscillator();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    low.type = "sine"; low.frequency.value = 54;
    high.type = "sine"; high.frequency.value = 81;
    gain.gain.value = .035;
    lfo.frequency.value = .12; lfoGain.gain.value = .012;
    lfo.connect(lfoGain); lfoGain.connect(gain.gain);
    low.connect(gain); high.connect(gain); gain.connect(this.master);
    low.start(); high.start(); lfo.start();
    this.ambientNodes = { gain, low, high, lfo, lfoGain };
  }
  stopAmbient() {
    if (!this.ambientNodes || !this.context || this.context.state === "closed") return;
    const nodes = this.ambientNodes;
    this.ambientNodes = null;
    const now = this.context.currentTime;
    nodes.gain.gain.cancelScheduledValues(now);
    nodes.gain.gain.setTargetAtTime(.0001, now, .06);
    for (const oscillator of [nodes.low, nodes.high, nodes.lfo]) {
      try { oscillator.stop(now + .35); } catch {}
    }
    this.context.setTimeout?.(() => {});
    window.setTimeout(() => {
      for (const node of Object.values(nodes)) { try { node.disconnect(); } catch {} }
    }, 450);
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stopAmbient();
    if (this.context && this.context.state !== "closed") this.context.close().catch(() => {});
    this.context = null;
    this.master = null;
  }
}