import { LEVELS, CHAPTERS } from "../data/levels.js";
import { YandexSDK } from "../platform/YandexSDK.js";
import { t, detectLanguage, normalizeLanguage, getLevelTranslation } from "../i18n/translations.js";

const LEGACY_PROGRESS_KEYS = ["loop_progress_v1", "loop_progress", "loopProgress"];
const MAX_LEVELS = LEVELS.length;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
    this.starsGraphics = null;
    this.stars = [];
    this.soundFX = null;
    this.sdk = null;
    this.language = "ru";
    this.selectedChapter = 0;
    this.progress = {};
    this.ui = null;
    this.isTransitioning = false;
    this.readyRequested = false;
  }

  create() {
    this.isTransitioning = false;
    this.sdk = this.registry.get("YandexSDK") ?? YandexSDK;
    this.soundFX = this.registry.get("SoundFX") ?? this.registry.get("soundFX") ?? null;
    this.soundFX?.setLevelAtmosphere?.(0);
    this.language = normalizeLanguage(this.sdk?.getLanguage?.() ?? detectLanguage());
    this.progress = this.readProgress();
    this.createBackground(this.scale.width, this.scale.height);
    this.createStarField(this.scale.width, this.scale.height);
    this.renderMenu();
    this.restoreSavedLanguage();

    if (!this.readyRequested) {
      this.readyRequested = true;
      Promise.resolve(this.sdk?.ready?.()).catch(error => console.warn("[LOOP] SDK ready failed:", error));
    }

    this.input.once("pointerdown", () => this.unlockAudio());
    this.cameras.main.fadeIn(350, 7, 7, 20);
    this.events.once("shutdown", () => {
      this.stars = [];
      this.starsGraphics = null;
      this.ui?.destroy(true);
      this.ui = null;
    });
  }

  update(time) {
    this.drawStars(time);
  }

  async restoreSavedLanguage() {
    try {
      const settings = await this.sdk?.loadSettings?.();
      const savedLanguage = settings?.language ? normalizeLanguage(settings.language) : null;
      if (savedLanguage && savedLanguage !== this.language && this.scene.isActive()) {
        this.language = savedLanguage;
        this.renderMenu();
      }
    } catch (error) {
      console.warn("[LOOP] Не удалось загрузить настройки языка:", error);
    }
  }

  createBackground(w, h) {
    const bg = this.add.graphics().setDepth(-3);
    bg.fillGradientStyle(0x09091b, 0x101333, 0x171044, 0x080817, 1);
    bg.fillRect(0, 0, w, h);
    const glow = this.add.circle(w / 2, h * 0.39, 210, 0x405cff, 0.075).setDepth(-2);
    this.tweens.add({ targets: glow, alpha: 0.14, scale: 1.18, duration: 2400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    const lower = this.add.circle(w / 2, h * 0.78, 250, 0x8b48ff, 0.035).setDepth(-2);
    this.tweens.add({ targets: lower, alpha: 0.075, scale: 1.12, duration: 3100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    const line = this.add.graphics().setDepth(-1);
    line.lineStyle(1, 0x536aff, 0.13);
    line.lineBetween(0, h * 0.72, w, h * 0.72);
  }

  createStarField(w, h) {
    this.starsGraphics = this.add.graphics().setDepth(0);
    this.stars = [];
    for (let i = 0; i < 78; i++) {
      this.stars.push({
        x: Phaser.Math.FloatBetween(12, w - 12),
        y: Phaser.Math.FloatBetween(12, h - 12),
        radius: Phaser.Math.FloatBetween(0.6, 1.8),
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
        speed: Phaser.Math.FloatBetween(0.001, 0.0028),
        alpha: Phaser.Math.FloatBetween(0.18, 0.62),
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
      this.starsGraphics.fillStyle(star.color, Phaser.Math.Linear(star.alpha * 0.35, star.alpha, wave));
      this.starsGraphics.fillCircle(star.x, star.y, star.radius);
    }
  }

  readProgress() {
    const sdkProgress = this.sdk?.progress && typeof this.sdk.progress === "object" ? this.sdk.progress : {};
    let legacy = {};
    try {
      for (const key of LEGACY_PROGRESS_KEYS) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try { legacy = JSON.parse(raw); } catch { legacy = { unlockedLevel: Number(raw) || 1 }; }
        if (legacy && typeof legacy === "object") break;
      }
    } catch (error) {
      console.warn("[LOOP] Не удалось прочитать локальный прогресс:", error);
    }

    const unlocked = Math.max(
      1,
      Number(sdkProgress.unlockedLevel ?? 1),
      Number(legacy.unlockedLevel ?? legacy.level ?? legacy.currentLevel ?? legacy.lastUnlockedLevel ?? 1)
    );
    const completedLevels = new Set([
      ...(Array.isArray(sdkProgress.completedLevels) ? sdkProgress.completedLevels : []),
      ...(Array.isArray(legacy.completedLevels) ? legacy.completedLevels : []),
      ...(Array.isArray(legacy.completedLevelsList) ? legacy.completedLevelsList : [])
    ].map(Number));
    const stars = { ...(sdkProgress.stars ?? {}), ...(legacy.stars ?? {}) };
    const bestTimes = { ...(sdkProgress.bestTimes ?? {}), ...(legacy.bestTimes ?? {}) };
    for (const [id, time] of Object.entries(sdkProgress.bestTimes ?? {})) {
      const localTime = Number(legacy.bestTimes?.[id]);
      const cloudTime = Number(time);
      const values = [localTime, cloudTime].filter(value => Number.isFinite(value) && value > 0);
      if (values.length) bestTimes[id] = Math.min(...values);
    }
    return {
      unlockedLevel: Math.min(MAX_LEVELS, Math.floor(unlocked)),
      completedLevels,
      stars,
      bestTimes
    };
  }

  renderMenu() {
    this.ui?.destroy(true);
    this.ui = this.add.container(0, 0).setDepth(10);
    const w = this.scale.width;
    const centerX = w / 2;
    const ru = this.language === "ru";
    const title = this.add.text(centerX, 48, "LOOP", {
      fontFamily: "Nunito, sans-serif", fontSize: "52px", fontStyle: "bold",
      color: "#eaf9ff", stroke: "#617aff", strokeThickness: 2,
      shadow: { offsetX: 0, offsetY: 0, color: "#5b83ff", blur: 18, fill: true }
    }).setOrigin(0.5);
    const subtitle = this.add.text(centerX, 88, ru ? "ПОСЛЕДНИЙ ЦИКЛ" : "THE LAST CYCLE", {
      fontFamily: "Nunito, sans-serif", fontSize: "11px", fontStyle: "bold", color: "#9aafff",
      letterSpacing: 3
    }).setOrigin(0.5);
    this.ui.add([title, subtitle]);

    const arzon = this.add.image(centerX - 105, 158, "arzon").setDisplaySize(72, 72);
    const pushi = this.add.image(centerX + 105, 158, "pushi").setDisplaySize(70, 70);
    this.ui.add([arzon, pushi]);
    this.tweens.add({ targets: arzon, y: 151, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: pushi, y: 165, angle: { from: -3, to: 3 }, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    const languageLabel = this.language.toUpperCase();
    this.addButton(this.ui, w - 68, 35, 92, 30, languageLabel, () => {
      this.language = this.language === "ru" ? "en" : "ru";
      Promise.resolve(this.sdk?.saveSettings?.({ language: this.language })).catch(() => {});
      this.renderMenu();
    }, 0x252b60, 0x4654a2, "11px");

    this.addButton(this.ui, 68, 35, 104, 30, this.soundLabel(), () => {
      this.unlockAudio();
      this.soundFX?.toggleMute?.();
      this.renderMenu();
    }, 0x252b60, 0x4654a2, "9px");

    const chapterTitle = this.add.text(centerX, 222, t("ui.chapter", this.language).toUpperCase() + " · " + t("ui.levelSelect", this.language).toUpperCase(), {
      fontFamily: "Nunito, sans-serif", fontSize: "11px", fontStyle: "bold", color: "#9aa9e9",
      letterSpacing: 1
    }).setOrigin(0.5);
    this.ui.add(chapterTitle);

    const chapterGap = 10;
    const chapterWidth = Math.min(205, (w - 70 - chapterGap * 3) / 4);
    const chapterStart = centerX - (chapterWidth * 4 + chapterGap * 3) / 2 + chapterWidth / 2;
    CHAPTERS.forEach((chapter, index) => {
      const selected = index === this.selectedChapter;
      const name = this.chapterName(index);
      this.addButton(
        this.ui,
        chapterStart + index * (chapterWidth + chapterGap),
        258,
        chapterWidth,
        42,
        name,
        () => { this.selectedChapter = index; this.renderMenu(); },
        selected ? 0x39479f : 0x1d234c,
        selected ? 0x5669d4 : 0x343e7c,
        "10px"
      );
    });

    const chapter = CHAPTERS[this.selectedChapter];
    const levelGap = 12;
    const levelWidth = Math.min(164, (w - 76 - levelGap * 4) / 5);
    const levelStart = centerX - (levelWidth * 5 + levelGap * 4) / 2 + levelWidth / 2;
    const levelsInChapter = LEVELS.filter(level => level.id >= chapter.firstLevel && level.id <= chapter.lastLevel);
    levelsInChapter.forEach((level, index) => {
      const unlocked = level.id <= this.progress.unlockedLevel;
      const completed = this.progress.completedLevels.has(level.id) || Number(this.progress.stars[level.id] ?? 0) > 0;
      const stars = this.getStars(level);
      const bestTime = Number(this.progress.bestTimes[level.id]);
      const label = unlocked ? String(level.id).padStart(2, "0") : "🔒 " + String(level.id).padStart(2, "0");
      const card = this.addLevelCard(
        levelStart + index * (levelWidth + levelGap),
        348,
        levelWidth,
        108,
        label,
        getLevelTranslation(level.id, this.language).title || level.title,
        stars,
        Number.isFinite(bestTime) && bestTime > 0 ? bestTime : null,
        completed,
        unlocked
      );
      if (unlocked) {
        card.zone.on("pointerdown", () => {
          if (!this.isTransitioning) this.startGame(level.id);
        });
      }
    });

    const continueLevel = Math.max(1, Math.min(MAX_LEVELS, this.progress.unlockedLevel));
    const continueText = t("ui.continue", this.language).toUpperCase() + " · " + t("ui.chapter", this.language) + " " + Math.ceil(continueLevel / 5);
    this.addButton(this.ui, centerX, 500, 300, 44, continueText, () => this.startGame(continueLevel), 0x353f9d, 0x5364d1, "13px");

    const footer = this.add.text(centerX, 562, ru ? "ИГРА О СВЕТЕ, ТЕНЯХ И ПАМЯТИ" : "A GAME ABOUT LIGHT, SHADOWS AND MEMORY", {
      fontFamily: "Nunito, sans-serif", fontSize: "9px", fontStyle: "bold", color: "#747cae",
      letterSpacing: 1
    }).setOrigin(0.5);
    this.ui.add(footer);
  }

  chapterName(index) {
    const ruNames = ["ПРОБУЖДЕНИЕ", "ЭХО ПРОШЛОГО", "РАЗЛОМ ЦИКЛА", "ПОСЛЕДНИЙ ЦИКЛ"];
    const enNames = ["AWAKENING", "ECHOES", "CYCLE FRACTURE", "THE LAST CYCLE"];
    return (this.language === "ru" ? ruNames : enNames)[index];
  }

  getStars(level) {
    const stored = Number(this.progress.stars[level.id] ?? 0);
    if (stored > 0) return Phaser.Math.Clamp(Math.floor(stored), 1, 3);
    if (!this.progress.completedLevels.has(level.id)) return 0;
    const best = Number(this.progress.bestTimes[level.id]);
    if (!Number.isFinite(best) || best <= 0) return 1;
    if (best <= level.parTimeSec * 0.72) return 3;
    if (best <= level.parTimeSec) return 2;
    return 1;
  }

  addLevelCard(x, y, width, height, idLabel, levelName, stars, bestTime, completed, unlocked) {
    const graphics = this.add.graphics();
    const fill = !unlocked ? 0x13172e : completed ? 0x202c55 : 0x1d244b;
    graphics.fillStyle(fill, 0.98);
    graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, 12);
    graphics.lineStyle(1.4, completed ? 0x8c83ff : 0x718aff, completed ? 0.78 : 0.4);
    graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 12);
    const id = this.add.text(x, y - 31, idLabel, {
      fontFamily: "Nunito, sans-serif", fontSize: "17px", fontStyle: "bold",
      color: unlocked ? "#e9f8ff" : "#70789e"
    }).setOrigin(0.5);
    const name = this.add.text(x, y - 8, levelName, {
      fontFamily: "Nunito, sans-serif", fontSize: "9px", fontStyle: "bold",
      color: unlocked ? "#b9caff" : "#666e91", align: "center",
      wordWrap: { width: width - 12 }, maxLines: 2
    }).setOrigin(0.5);
    const starText = this.add.text(x, y + 18, stars ? "★".repeat(stars) + "☆".repeat(3 - stars) : "☆☆☆", {
      fontFamily: "Nunito, sans-serif", fontSize: "15px", color: stars ? "#ffd98a" : "#555d83"
    }).setOrigin(0.5);
    const timeText = this.add.text(x, y + 39, bestTime ? bestTime.toFixed(1) + "s" : (unlocked ? "—" : "LOCKED"), {
      fontFamily: "Nunito, sans-serif", fontSize: "9px", fontStyle: "bold", color: "#7f91c7"
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: unlocked });
    if (unlocked) {
      zone.on("pointerover", () => graphics.setAlpha(1).setBlendMode(Phaser.BlendModes.ADD));
      zone.on("pointerout", () => graphics.setAlpha(1).setBlendMode(Phaser.BlendModes.NORMAL));
    }
    this.ui.add([graphics, id, name, starText, timeText, zone]);
    return { zone };
  }

  addButton(container, x, y, width, height, label, action, fill = 0x303b87, hover = 0x4655ad, fontSize = "12px") {
    const graphics = this.add.graphics();
    const draw = color => {
      graphics.clear();
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
      graphics.lineStyle(1.2, 0x9bdfff, 0.62);
      graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    };
    draw(fill);
    const text = this.add.text(x, y, label, {
      fontFamily: "Nunito, sans-serif", fontSize, fontStyle: "bold",
      color: "#f4fbff", align: "center", wordWrap: { width: width - 12 }, maxLines: 2
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
    zone.on("pointerover", () => { if (!this.isTransitioning) draw(hover); });
    zone.on("pointerout", () => draw(fill));
    zone.on("pointerdown", () => {
      if (this.isTransitioning) return;
      this.unlockAudio();
      action();
    });
    container.add([graphics, text, zone]);
    return { graphics, text, zone };
  }

  soundLabel() {
    const muted = this.soundFX?.isMuted?.() ?? false;
    return (this.language === "ru" ? "ЗВУК " : "SOUND ") + (muted ? "OFF" : "ON");
  }

  unlockAudio() {
    try {
      const result = this.soundFX?.unlock?.();
      if (result?.catch) result.catch(error => console.warn("[LOOP] Audio unlock failed:", error));
    } catch (error) {
      console.warn("[LOOP] Audio unlock failed:", error);
    }
  }

  startGame(levelId) {
    if (this.isTransitioning) return;
    const safeLevel = Phaser.Math.Clamp(Math.floor(Number(levelId) || 1), 1, MAX_LEVELS);
    if (safeLevel > this.progress.unlockedLevel) return;
    this.isTransitioning = true;
    this.registry.set("requestedLevelId", safeLevel);
    this.sdk?.gameplayStart?.();
    this.cameras.main.fadeOut(420, 7, 7, 20);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("GameScene", { levelIndex: safeLevel - 1 });
    });
  }
}
