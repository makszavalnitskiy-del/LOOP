import { SoundFX } from "../audio/SoundFX.js";
import { t, detectLanguage } from "../i18n/translations.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
    this.loadingBar = null;
    this.loadingBounds = null;
    this.loadingLabel = null;
    this.domProgress = document.getElementById("loading-progress");
    this.domLabel = document.getElementById("loading-label");
    this.domScreen = document.getElementById("loading-screen");
    this.language = "ru";
  }

  init() {
    const sdk = this.registry.get("YandexSDK");
    this.language = detectLanguage(sdk?.getLanguage?.());
    this.updateDomProgress(0);
    this.updateDomLabel(t("ui.loading", this.language));
  }

  preload() {
    this.createLoadingScreen();
    this.load.on("progress", value => this.updateLoadingBar(value));
    this.load.on("fileprogress", file => {
      const label = file?.key ? `${t("ui.loading", this.language)} · ${String(file.key).toUpperCase()}` : t("ui.loading", this.language);
      this.updateDomLabel(label);
      if (this.loadingLabel) this.loadingLabel.setText(label);
    });
    this.load.on("loaderror", file => {
      if (file?.key === "arzon" || file?.key === "pushi") this.createFallbackTexture(file.key);
      console.warn("[LOOP] Не удалось загрузить ресурс:", file?.key ?? file);
    });
    this.load.svg("arzon", "assets/characters/arzon.svg", { width: 512, height: 512 });
    this.load.svg("pushi", "assets/characters/pushi.svg", { width: 512, height: 512 });
  }

  create() {
    this.ensureCharacterTexture("arzon");
    this.ensureCharacterTexture("pushi");
    if (!this.registry.get("SoundFX") && !this.registry.get("soundFX")) {
      const soundFX = new SoundFX();
      this.registry.set("SoundFX", soundFX);
      this.registry.set("soundFX", soundFX);
    }

    this.updateLoadingBar(1);
    this.updateDomProgress(1);
    this.updateDomLabel(t("ui.loading", this.language));

    this.time.delayedCall(120, () => {
      this.cameras.main.fadeOut(260, 7, 7, 20);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("MenuScene");
        // The CSS transition fades the HTML loading layer over the first menu frame.
        window.requestAnimationFrame(() => {
          if (this.domScreen) this.domScreen.classList.add("is-hidden");
        });
      });
    });
  }

  createLoadingScreen() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;
    this.add.rectangle(0, 0, width, height, 0x09091b).setOrigin(0);
    const glow = this.add.circle(centerX, centerY - 35, 150, 0x536cff, 0.08);
    this.tweens.add({
      targets: glow, alpha: 0.16, scale: 1.15,
      duration: 1800, yoyo: true, repeat: -1, ease: "Sine.easeInOut"
    });
    this.add.text(centerX, centerY - 100, "LOOP", {
      fontFamily: "Nunito, sans-serif", fontSize: "72px", fontStyle: "bold",
      color: "#e9f8ff", stroke: "#617aff", strokeThickness: 2
    }).setOrigin(0.5);
    this.add.text(centerX, centerY - 45, "ПОСЛЕДНИЙ ЦИКЛ", {
      fontFamily: "Nunito, sans-serif", fontSize: "14px", fontStyle: "bold", color: "#91a8ff"
    }).setOrigin(0.5);

    const barWidth = Math.min(360, width * 0.68);
    const barHeight = 8;
    const barX = centerX - barWidth / 2;
    const barY = centerY + 35;
    const frame = this.add.graphics();
    frame.fillStyle(0x171b42, 1);
    frame.fillRoundedRect(barX, barY, barWidth, barHeight, 5);
    this.loadingBar = this.add.graphics();
    this.loadingBounds = { x: barX, y: barY, width: barWidth, height: barHeight };
    this.loadingLabel = this.add.text(centerX, barY + 30, t("ui.loading", this.language), {
      fontFamily: "Nunito, sans-serif", fontSize: "11px", fontStyle: "bold", color: "#8797d2"
    }).setOrigin(0.5);
  }

  updateLoadingBar(value) {
    if (!this.loadingBar || !this.loadingBounds) return;
    const progress = Phaser.Math.Clamp(value, 0, 1);
    const { x, y, width, height } = this.loadingBounds;
    this.loadingBar.clear();
    if (progress > 0) {
      this.loadingBar.fillGradientStyle(0x6877ff, 0x62eaff, 0xbd8cff, 0x6877ff, 1);
      this.loadingBar.fillRoundedRect(x, y, width * progress, height, 5);
    }
    this.updateDomProgress(progress);
  }

  updateDomProgress(value) {
    if (!this.domProgress) return;
    this.domProgress.style.width = `${Phaser.Math.Clamp(Number(value) || 0, 0, 1) * 100}%`;
  }

  updateDomLabel(value) {
    if (this.domLabel) this.domLabel.textContent = value;
  }

  ensureCharacterTexture(key) {
    if (!this.textures.exists(key)) this.createFallbackTexture(key);
  }

  createFallbackTexture(key) {
    if (this.textures.exists(key)) return;
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    if (key === "arzon") this.drawArzonFallback(graphics);
    else if (key === "pushi") this.drawPushiFallback(graphics);
    else {
      graphics.destroy();
      return;
    }
    graphics.generateTexture(key, 128, 128);
    graphics.destroy();
  }

  drawArzonFallback(g) {
    g.fillStyle(0x397fff, 0.2); g.fillCircle(64, 68, 52);
    g.fillStyle(0x5bdcff, 0.95); g.fillEllipse(64, 68, 62, 82);
    g.fillStyle(0x91f4ff, 0.95); g.fillEllipse(64, 48, 34, 52);
    g.fillStyle(0x8c66ff, 0.95); g.fillEllipse(49, 67, 17, 23); g.fillEllipse(79, 67, 17, 23);
    g.fillStyle(0xffffff, 1); g.fillCircle(51, 64, 5); g.fillCircle(81, 64, 5);
    g.fillStyle(0x17142e, 1); g.fillCircle(52, 65, 2.5); g.fillCircle(82, 65, 2.5);
    g.fillStyle(0xa5faff, 0.95); g.fillCircle(64, 91, 10);
    g.fillStyle(0xffffff, 0.9); g.fillCircle(64, 91, 4);
  }

  drawPushiFallback(g) {
    g.fillStyle(0x6339a5, 0.2); g.fillCircle(64, 72, 56);
    g.fillStyle(0x302344, 1); g.fillTriangle(24, 52, 32, 7, 55, 42); g.fillTriangle(73, 42, 98, 7, 105, 55);
    g.fillStyle(0x9d69c9, 1); g.fillTriangle(31, 40, 35, 18, 48, 41); g.fillTriangle(80, 41, 95, 18, 98, 43);
    g.fillStyle(0x302344, 1); g.fillEllipse(64, 74, 76, 72);
    g.fillStyle(0x47345e, 1); g.fillEllipse(64, 83, 48, 42);
    g.fillStyle(0x9b75d6, 1); g.fillEllipse(48, 69, 17, 24); g.fillEllipse(80, 69, 17, 24);
    g.fillStyle(0xffffff, 1); g.fillCircle(50, 66, 5); g.fillCircle(82, 66, 5);
    g.fillStyle(0x17142e, 1); g.fillCircle(51, 67, 2.5); g.fillCircle(83, 67, 2.5);
    g.lineStyle(7, 0xc18cff, 0.95); g.strokeCircle(103, 99, 13);
    g.lineStyle(3, 0xf0d5ff, 0.9); g.strokeCircle(103, 99, 8);
  }
}
