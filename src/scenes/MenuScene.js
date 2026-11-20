const PROGRESS_STORAGE_KEY = "loop_progress_v1";
const LEGACY_PROGRESS_KEYS = ["loop_progress", "loopProgress"];

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
    this.starsGraphics = null;
    this.stars = [];
    this.soundFX = null;
    this.muteButton = null;
    this.isTransitioning = false;
  }
  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    this.isTransitioning = false;
    this.soundFX = this.registry.get("soundFX") ?? null;
    this.soundFX?.setLevelAtmosphere?.(0);
    this.createBackground(width, height);
    this.createStarField(width, height);
    this.createLogo(width);
    this.createCharacters(width);
    this.createButtons(width, height);
    this.add.text(width / 2, height - 28, "ИГРА О СВЕТЕ, ТЕНЯХ И ПАМЯТИ", {
      fontFamily: "Nunito, sans-serif", fontSize: "10px", fontStyle: "bold", color: "#747cae"
    }).setOrigin(.5);
    this.input.once("pointerdown", () => this.unlockAudio());
    this.cameras.main.fadeIn(350, 7, 7, 20);
    this.events.once("shutdown", () => { this.stars = []; this.starsGraphics = null; });
  }
  update(time) { this.drawStars(time); }
  createBackground(w, h) {
    const bg = this.add.graphics().setDepth(-3);
    bg.fillGradientStyle(0x09091b, 0x101333, 0x171044, 0x080817, 1);
    bg.fillRect(0, 0, w, h);
    const glow = this.add.circle(w / 2, h * .39, 210, 0x405cff, .075).setDepth(-2);
    this.tweens.add({ targets: glow, alpha: .14, scale: 1.18, duration: 2400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    const lower = this.add.circle(w / 2, h * .78, 250, 0x8b48ff, .035).setDepth(-2);
    this.tweens.add({ targets: lower, alpha: .075, scale: 1.12, duration: 3100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    const line = this.add.graphics().setDepth(-1); line.lineStyle(1, 0x536aff, .13); line.lineBetween(0, h * .72, w, h * .72);
  }
  createStarField(w, h) {
    this.starsGraphics = this.add.graphics().setDepth(0);
    this.stars = [];
    for (let i = 0; i < 78; i++) {
      this.stars.push({
        x: Phaser.Math.FloatBetween(12, w - 12), y: Phaser.Math.FloatBetween(12, h - 12),
        radius: Phaser.Math.FloatBetween(.6, 1.8), phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
        speed: Phaser.Math.FloatBetween(.001, .0028), alpha: Phaser.Math.FloatBetween(.18, .62),
        color: Phaser.Math.RND.pick([0x8baaff, 0x8deaff, 0xc1a1ff, 0xe1edff])
      });
    }
    this.drawStars(0);
  }
  drawStars(time) {
    if (!this.starsGraphics) return;
    this.starsGraphics.clear();
    for (const star of this.stars) {
      const wave = (Math.sin(time * star.speed + star.phase) + 1) / 2;
      this.starsGraphics.fillStyle(star.color, Phaser.Math.Linear(star.alpha * .35, star.alpha, wave));
      this.starsGraphics.fillCircle(star.x, star.y, star.radius);
    }
  }
  createLogo(w) {
    const x = w / 2;
    this.add.text(x, 105, "LOOP", {
      fontFamily: "Nunito, sans-serif", fontSize: "76px", fontStyle: "bold",
      color: "#eaf9ff", stroke: "#617aff", strokeThickness: 2,
      shadow: { offsetX: 0, offsetY: 0, color: "#5b83ff", blur: 22, fill: true }
    }).setOrigin(.5);
    this.add.text(x, 166, "ПОСЛЕДНИЙ ЦИКЛ", {
      fontFamily: "Nunito, sans-serif", fontSize: "15px", fontStyle: "bold", color: "#9aafff"
    }).setOrigin(.5);
    const underline = this.add.graphics();
    underline.lineStyle(1, 0x718aff, .4); underline.lineBetween(x - 100, 190, x + 100, 190);
  }
  createCharacters(w) {
    const x = w / 2;
    const arzonAura = this.add.circle(x - 100, 289, 76, 0x55eaff, 0.075);
    const pushiAura = this.add.circle(x + 100, 294, 72, 0x9b63ff, 0.075);
    const arzonShadow = this.add.ellipse(x - 100, 344, 72, 12, 0x050611, 0.48);
    const pushiShadow = this.add.ellipse(x + 100, 344, 72, 12, 0x050611, 0.48);
    const arzon = this.add.image(x - 100, 285, "arzon").setDisplaySize(112, 112);
    const pushi = this.add.image(x + 100, 291, "pushi").setDisplaySize(108, 108);
    this.tweens.add({ targets: [arzonAura, pushiAura], alpha: { from: 0.045, to: 0.13 }, scale: { from: 0.92, to: 1.1 }, duration: 1650, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: arzon, y: 275, scaleX: { from: 0.99, to: 1.025 }, scaleY: { from: 1.015, to: 0.99 }, duration: 1150, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: pushi, y: 299, angle: { from: -3, to: 3 }, duration: 1320, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: [arzonShadow, pushiShadow], scaleX: { from: 0.88, to: 1.08 }, alpha: { from: 0.35, to: 0.52 }, duration: 1150, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.add.text(x - 100, 357, "АРЗОН", { fontFamily: "Nunito, sans-serif", fontSize: "11px", fontStyle: "bold", color: "#82eaff" }).setOrigin(.5);
    this.add.text(x + 100, 357, "ПУШИ", { fontFamily: "Nunito, sans-serif", fontSize: "11px", fontStyle: "bold", color: "#c29aff" }).setOrigin(.5);
  }
  createButtons(w, h) {
    const x = w / 2;
    const progress = this.readSavedProgress();
    const unlocked = progress.level;
    const continueLevel = Math.max(1, Math.min(6, progress.lastPlayed || unlocked));
    this.createNeonButton({ x, y: 420, width: 310, height: 48, label: "НОВАЯ ИГРА", fill: 0x343b9e, hover: 0x4d5bd4, glow: 0x718cff, fontSize: "16px", action: () => this.newGame(progress) });
    this.createNeonButton({ x, y: 477, width: 250, height: 38, label: "ПРОДОЛЖИТЬ · УРОВЕНЬ " + continueLevel, fill: 0x252a68, hover: 0x414a9d, glow: 0x8d79ff, fontSize: "12px", action: () => this.startGame(continueLevel) });
    const columns = w < 620 ? 3 : 6;
    const tileWidth = Math.min(132, (w - 48) / columns - 8);
    const gap = 8;
    const rows = Math.ceil(6 / columns);
    const gridWidth = columns * tileWidth + (columns - 1) * gap;
    const startX = (w - gridWidth) / 2 + tileWidth / 2;
    const top = rows === 1 ? 555 : 535;
    const completed = new Set(progress.completedLevelsList || []);
    const names = ["ПРОБУЖДЕНИЕ", "ПРЕЛОМЛЕНИЕ", "МАЯТНИК", "РЕЗОНАНС", "КАСКАД", "ПОСЛЕДНИЙ ЦИКЛ"];
    for (let index = 0; index < 6; index++) {
      const id = index + 1;
      const row = Math.floor(index / columns);
      const column = index % columns;
      const tx = startX + column * (tileWidth + gap);
      const ty = top + row * 52;
      const locked = id > unlocked;
      const done = completed.has(id) || id < unlocked;
      const best = progress.bestTimes?.[id];
      const label = (locked ? "🔒 " : done ? "✓ " : "") + id + " · " + names[index] + (best ? "  " + Number(best).toFixed(1) + "с" : "");
      this.createNeonButton({
        x: tx, y: ty, width: tileWidth, height: 40,
        label, fill: locked ? 0x171a31 : done ? 0x202d5b : 0x303b87,
        hover: locked ? 0x171a31 : 0x4655ad, glow: 0x718cff,
        fontSize: tileWidth < 100 ? "8px" : "9px",
        action: () => { if (!locked) this.startGame(id); }
      });
    }
    this.muteButton = this.createNeonButton({
      x: w - 68, y: 34, width: 104, height: 32, label: this.getMuteLabel(),
      fill: 0x1c2149, hover: 0x333b78, glow: 0x788aff, fontSize: "10px",
      action: () => { this.unlockAudio(); if (this.soundFX) this.soundFX.toggleMute(); this.muteButton?.setLabel(this.getMuteLabel()); }
    });
  }
  newGame(progress) {
    const hasProgress = progress.level > 1 || (progress.completedLevelsList || []).length > 0;
    if (hasProgress && !window.confirm("Начать новую игру? Сохранённый прогресс и рекорды будут сброшены.")) return;
    try { localStorage.removeItem(PROGRESS_STORAGE_KEY); } catch {}
    for (const key of LEGACY_PROGRESS_KEYS) { try { localStorage.removeItem(key); } catch {} }
    this.startGame(1);
  }

  createNeonButton(options) {
    const { x, y, width, height, label, fill, hover, glow, fontSize, action } = options;
    const visual = this.add.graphics().setPosition(x, y);
    const draw = color => {
      visual.clear(); visual.fillStyle(color, 1);
      visual.fillRoundedRect(-width / 2, -height / 2, width, height, 15);
      visual.lineStyle(1.5, 0x9bdfff, .62);
      visual.strokeRoundedRect(-width / 2, -height / 2, width, height, 15);
      visual.lineStyle(1, 0xffffff, .1);
      visual.lineBetween(-width / 2 + 18, -height / 2 + 4, width / 2 - 18, -height / 2 + 4);
    };
    draw(fill);
    if (visual.postFX && typeof visual.postFX.addGlow === "function") {
      try { visual.postFX.addGlow(glow, 2, 0, false, .1, 12); } catch (error) { console.warn("[LOOP] Glow unavailable:", error); }
    }
    const text = this.add.text(x, y, label, {
      fontFamily: "Nunito, sans-serif", fontSize, fontStyle: "bold", color: "#ffffff", align: "center"
    }).setOrigin(.5);
    const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
    zone.on("pointerover", () => { if (!this.isTransitioning) { draw(hover); text.setColor("#d9f8ff"); } });
    zone.on("pointerout", () => { draw(fill); text.setColor("#ffffff"); });
    zone.on("pointerdown", () => {
      if (this.isTransitioning) return;
      this.unlockAudio();
      action();
    });
    return { visual, text, zone, setLabel: value => text.setText(value) };
  }
  unlockAudio() {
    if (!this.soundFX || typeof this.soundFX.unlock !== "function") return;
    try {
      const result = this.soundFX.unlock();
      if (result?.catch) result.catch(error => console.warn("[LOOP] Audio unlock failed:", error));
    } catch (error) { console.warn("[LOOP] Audio unlock failed:", error); }
  }
  getMuteLabel() { return this.soundFX?.isMuted?.() ? "ЗВУК: ВЫКЛ" : "ЗВУК: ВКЛ"; }
  readSavedProgress() {
    const fallback = { level: 1, lastPlayed: 1, completedLevelsList: [], bestTimes: {} };
    try {
      for (const key of [PROGRESS_STORAGE_KEY, ...LEGACY_PROGRESS_KEYS]) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = { level: Number(raw) }; }
        const level = Number(parsed?.level ?? parsed?.currentLevel ?? parsed?.lastUnlockedLevel ?? parsed?.unlockedLevel ?? 1);
        return {
          level: Number.isFinite(level) ? Math.max(1, Math.min(6, Math.floor(level))) : 1,
          lastPlayed: Math.max(1, Math.min(6, Number(parsed?.lastCompletedLevel ?? parsed?.lastPlayed ?? level) || 1)),
          completedLevelsList: Array.isArray(parsed?.completedLevelsList) ? parsed.completedLevelsList : [],
          bestTimes: parsed?.bestTimes && typeof parsed.bestTimes === "object" ? parsed.bestTimes : {}
        };
      }
    } catch (error) { console.warn("[LOOP] Не удалось прочитать сохранение:", error); }
    return fallback;
  }
  startGame(levelId) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.registry.set("requestedLevelId", Math.max(1, Math.min(6, Math.floor(Number(levelId) || 1))));
    this.cameras.main.fadeOut(400, 7, 7, 20);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("GameScene", { levelIndex: this.registry.get("requestedLevelId") - 1 }));
  }
}