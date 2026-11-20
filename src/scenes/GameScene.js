import { LEVELS } from "../data/levels.js";
import { ShadowProjection } from "../mechanics/shadows/ShadowProjection.js";

const PROGRESS_KEY = "loop_progress_v1";
const LEGACY_PROGRESS_KEYS = ["loop_progress", "loopProgress"];
const COYOTE_TIME = 100;
const JUMP_BUFFER_TIME = 100;
const PLAYER_SPEED = 250;
const PLAYER_ACCELERATION = 1450;
const PLAYER_DRAG = 1850;
const JUMP_SPEED = 440;
const PLAYER_WIDTH = 28;
const PLAYER_HEIGHT = 38;

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.level = null;
    this.levelIndex = 0;
    this.soundFX = null;
    this.sdk = null;
    this.progressData = {};
    this.newCyclePlus = false;
    this.runTimeMs = 0;
    this.finaleStarted = false;
    this.player = null;
    this.playerVisual = null;
    this.pushi = null;
    this.platforms = [];
    this.obstacles = [];
    this.bridges = [];
    this.gaps = [];
    this.pointerOwners = new Map();
    this.mobileInput = { left: false, right: false, jump: false };
    this.jumpBufferUntil = 0;
    this.coyoteUntil = 0;
    this.wasGrounded = false;
    this.facing = 1;
    this.dead = false;
    this.completed = false;
    this.transitioning = false;
    this.levelElapsed = 0;
    this.levelStartTime = 0;
    this.paused = false;
    this.pauseOverlay = null;
    this.cleanupHandlers = [];
  }

  init(data = {}) {
    const requested = Number(data.levelIndex);
    let index = Number.isInteger(requested) ? requested : -1;
    if (index < 0 || index >= LEVELS.length) index = this.readSavedLevelIndex();
    this.levelIndex = Phaser.Math.Clamp(index, 0, LEVELS.length - 1);
    this.level = LEVELS[this.levelIndex];
    this.newCyclePlus = Boolean(data.newCyclePlus);
    this.runTimeMs = Math.max(0, Number(data.runTimeMs) || 0);
    this.finaleStarted = false;
    this.dead = false;
    this.completed = false;
    this.transitioning = false;
    this.levelElapsed = 0;
    this.jumpBufferUntil = 0;
    this.coyoteUntil = 0;
    this.pointerOwners.clear();
    this.enteredBridges = new Set();
    this.crossedBridges = new Set();
    this.mobileInput = { left: false, right: false, jump: false };
  }

  create() {
    if (!this.level) {
      this.scene.start("MenuScene");
      return;
    }
    this.soundFX = this.registry.get("soundFX") ?? null;
    this.sdk = this.registry.get("YandexSDK") ?? null;
    this.progressData = this.sdk?.progress ?? {};
    this.newCyclePlus = this.newCyclePlus || Boolean(this.progressData.newCyclePlus);
    this.recordAttempt();
    this.sdk?.gameplayStart?.();
    const world = this.level.world;
    this.cameras.main.setBackgroundColor(world.background ?? 0x09091b);
    this.physics.world.setBounds(0, 0, world.width, world.height);
    this.cameras.main.setBounds(0, 0, world.width, world.height);
    this.createBackdrop();
    this.createWorldGeometry();
    this.createObstacles();
    this.createSensors();
    this.createLamp();
    this.createPlayer();
    this.createCompanion();
    this.createPortal();
    this.createHud();
    this.createFinalActHud();
    this.createTouchControls();
    this.createKeyboardControls();
    this.createCollisions();
    this.createLevelIntro();
    this.updateAllBridges();
    this.levelStartTime = this.time.now;
    this.soundFX?.setLevelAtmosphere?.(this.levelIndex);
    this.soundFX?.startAmbient?.();
    this.cameras.main.fadeIn(450, 7, 7, 20);
    this.events.once("shutdown", this.handleShutdown, this);
    this.events.once("destroy", this.handleShutdown, this);
    this.input.on("pointerup", this.handlePointerUp, this);
    this.input.on("pointerupoutside", this.handlePointerUp, this);
    this.input.on("gameout", this.handleAllPointersUp, this);
    this.input.on("drag", this.handleLampDrag, this);
    this.input.on("dragend", this.handleLampDragEnd, this);
    this.cleanupHandlers.push(
      ["pointerup", this.handlePointerUp],
      ["pointerupoutside", this.handlePointerUp],
      ["gameout", this.handleAllPointersUp],
      ["drag", this.handleLampDrag],
      ["dragend", this.handleLampDragEnd]
    );
  }

  readSavedLevelIndex() {
    try {
      for (const key of [PROGRESS_KEY, ...LEGACY_PROGRESS_KEYS]) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = Number(raw); }
        const levelNumber = Number(typeof parsed === "number"
          ? parsed
          : parsed?.level ?? parsed?.currentLevel ?? parsed?.lastUnlockedLevel ?? parsed?.unlockedLevel ?? 1);
        if (Number.isFinite(levelNumber)) return Phaser.Math.Clamp(Math.floor(levelNumber) - 1, 0, LEVELS.length - 1);
      }
    } catch (error) {
      console.warn("[LOOP] Не удалось прочитать прогресс:", error);
    }
    return 0;
  }

  createBackdrop() {
    const { width, height, background } = this.level.world;
    const graphics = this.add.graphics().setDepth(-20);
    this.backdropGraphics = graphics;
    graphics.fillGradientStyle(background ?? 0x09091b, 0x101333, 0x171044, 0x080817, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.lineStyle(1, 0x7584df, 0.08);
    for (let x = 0; x < width; x += 80) graphics.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 80) graphics.lineBetween(0, y, width, y);
    const farRuins = this.add.graphics().setDepth(-18).setScrollFactor(0.12, 0.22);
    farRuins.fillStyle(0x20234f, 0.34);
    for (let x = -40; x < width + 180; x += 190) {
      const h = Phaser.Math.Between(65, 150);
      farRuins.fillRect(x, 430 - h, Phaser.Math.Between(55, 115), h);
      farRuins.fillStyle(0x080a20, 0.72);
      farRuins.fillRect(x + 14, 430 - h + 22, 9, 24);
      farRuins.fillStyle(0x20234f, 0.34);
    }
    const midRuins = this.add.graphics().setDepth(-17).setScrollFactor(0.3, 0.38);
    for (let x = 40; x < width + 220; x += 280) {
      midRuins.fillStyle(0x29285c, 0.28);
      midRuins.fillTriangle(x, 430, x + 55, 300, x + 110, 430);
      midRuins.fillStyle(0x4b4a8b, 0.18);
      midRuins.fillTriangle(x + 28, 430, x + 55, 300, x + 80, 430);
    }
    const mist = this.add.graphics().setDepth(-16).setScrollFactor(0.52, 0.68);
    for (let i = 0; i < 8; i++) {
      mist.fillStyle(i % 2 ? 0x7256d8 : 0x4c9bd0, 0.035);
      mist.fillEllipse(i * width / 7, 420 + Math.sin(i) * 22, 300, 74);
    }
    const stars = this.add.graphics().setDepth(-15);
    for (let i = 0; i < Math.ceil(width / 12); i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(20, 390);
      stars.fillStyle(0x9dbdff, Phaser.Math.FloatBetween(0.12, 0.45));
      stars.fillCircle(x, y, Phaser.Math.FloatBetween(0.5, 1.5));
    }
    this.add.text(34, 34, "LOOP  /  " + String(this.level.id).padStart(2, "0"), {
      fontFamily: "Nunito, sans-serif", fontSize: "11px", fontStyle: "900",
      color: "#7386c7", letterSpacing: 2
    }).setScrollFactor(0).setDepth(40);
  }

  createWorldGeometry() {
    const groundY = this.level.world.groundY;
    this.gaps = this.level.gaps ?? [];
    this.platforms = [];
    for (const data of this.level.platforms ?? []) {
      const platform = this.add.rectangle(
        data.x + data.width / 2, data.y + data.height / 2,
        data.width, data.height, 0x20264f, 1
      ).setStrokeStyle(2, 0x5669b6, 0.8).setDepth(2);
      this.physics.add.existing(platform, true);
      platform.body.setSize(data.width, data.height);
      this.platforms.push(platform);
      const edge = this.add.graphics().setDepth(3);
      edge.lineStyle(2, 0x69eaff, 0.42);
      edge.lineBetween(data.x, data.y, data.x + data.width, data.y);
      for (let x = data.x + 28; x < data.x + data.width; x += 96) {
        edge.fillStyle(0x72eaff, 0.35);
        edge.fillCircle(x, data.y + 15, 1.5);
      }
    }
    for (const gap of this.gaps) {
      const warning = this.add.rectangle(gap.x + gap.width / 2, groundY + 42, gap.width, 84, 0x080817, 0.94).setDepth(1);
      warning.setStrokeStyle(1, 0x6e5cb7, 0.18);
      const glow = this.add.rectangle(gap.x + gap.width / 2, groundY + 3, gap.width, 5, 0x7a62ff, 0.3).setDepth(4);
      this.tweens.add({ targets: glow, alpha: { from: 0.12, to: 0.5 }, duration: 1100, yoyo: true, repeat: -1 });
    }
    this.worldGroundY = groundY;
  }

  createObstacles() {
    this.obstacles = [];
    this.bridges = [];
    const crystals = (this.level.obstacles ?? []).filter(item => item.type === "crystal");
    for (const data of this.level.obstacles ?? []) {
      const color = data.color ?? (data.type === "crystal" ? 0x70eaff : 0x9a6cff);
      const art = this.add.rectangle(
        data.x + data.width / 2, data.y + data.height / 2,
        data.width, data.height, color, data.type === "crystal" ? 0.72 : 0.55
      ).setStrokeStyle(2, color, 0.95).setDepth(7);
      const core = this.add.rectangle(art.x, art.y, data.width * 0.62, data.height * 0.58, 0xd9faff, 0.12)
        .setStrokeStyle(1, 0xc5faff, 0.32).setDepth(8);
      const halo = this.add.circle(art.x, art.y, Math.max(data.width, data.height) * 0.58, color, 0.07).setDepth(6);
      this.tweens.add({ targets: halo, alpha: { from: 0.035, to: 0.13 }, scale: { from: 0.86, to: 1.12 }, duration: 1300, yoyo: true, repeat: -1 });
      let physicsBody = null;
      if (data.type === "barrier") {
        this.physics.add.existing(art);
        physicsBody = art.body;
        physicsBody.setAllowGravity(false);
        physicsBody.setImmovable(true);
        physicsBody.setSize(data.width, data.height);
      }
      const obstacle = { data, art, core, halo, physicsBody, x: data.x, y: data.y, width: data.width, height: data.height, direction: data.patrol?.direction ?? 1 };
      this.obstacles.push(obstacle);
      if (data.type === "crystal") {
        const bridgeNumber = Number(String(data.bridgeId ?? "").match(/(\d+)$/)?.[1]);
        const gap = this.gaps.find(item => item.bridgeId === data.bridgeId) ??
          (Number.isInteger(bridgeNumber) && bridgeNumber > 0 ? this.gaps[bridgeNumber - 1] : null) ??
          this.gaps[crystals.indexOf(data)];
        if (gap) this.createBridge(data, gap);
      }
    }
    if (this.bridges.length < this.gaps.length) {
      for (let index = this.bridges.length; index < this.gaps.length; index++) {
        const gap = this.gaps[index];
        this.createBridge(null, gap);
      }
    }
  }

  createBridge(obstacleData, gap) {
    const centerX = gap.x + gap.width / 2;
    const bridge = this.add.rectangle(centerX, this.worldGroundY + 6, gap.width, 12, 0x69eaff, 0.08)
      .setStrokeStyle(2, 0x83f1ff, 0.12).setDepth(5);
    this.physics.add.existing(bridge);
    bridge.body.setAllowGravity(false);
    bridge.body.setImmovable(true);
    bridge.body.setSize(gap.width, 12);
    bridge.body.enable = false;
    const glow = this.add.rectangle(centerX, this.worldGroundY + 6, gap.width, 22, 0x45dfff, 0.05).setDepth(4);
    this.bridges.push({
      id: obstacleData?.bridgeId ?? "bridge-" + (this.bridges.length + 1),
      obstacleId: obstacleData?.id ?? null,
      gap, bridge, glow, active: false, fixed: false, fixedShadow: null, shadow: null, material: 0
    });
  }

  createLamp() {
    const start = this.level.lampStart;
    const bounds = this.level.lampBounds;
    this.lampBounds = bounds;
    this.lampGlow = this.add.circle(start.x, start.y, 112, 0x4bdfff, 0.045).setDepth(9);
    this.lampCoreGlow = this.add.circle(start.x, start.y, 36, 0x72eaff, 0.12).setDepth(11);
    this.tweens.add({ targets: this.lampGlow, scale: { from: 0.92, to: 1.16 }, alpha: { from: 0.035, to: 0.09 }, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.lamp = this.add.container(start.x, start.y).setDepth(12);
    const lampGraphic = this.add.graphics();
    lampGraphic.fillStyle(0x55eaff, 0.16); lampGraphic.fillCircle(0, 0, 31);
    lampGraphic.fillStyle(0xa8f8ff, 1); lampGraphic.fillCircle(0, 0, 11);
    lampGraphic.lineStyle(3, 0x7eeeff, 1); lampGraphic.strokeCircle(0, 0, 20);
    lampGraphic.lineStyle(1, 0xffffff, 0.7); lampGraphic.strokeCircle(0, 0, 27);
    this.lamp.add(lampGraphic);
    this.lamp.setSize(58, 58);
    this.lamp.setInteractive(new Phaser.Geom.Circle(0, 0, 29), Phaser.Geom.Circle.Contains);
    this.input.setDraggable(this.lamp);
    this.lampDragPointerId = null;
    this.lamp.on("pointerdown", pointer => { this.lampDragPointerId = pointer.id; this.soundFX?.beginLampFeedback?.(); });
    this.lamp.on("pointerup", pointer => { if (this.lampDragPointerId === pointer.id) this.lampDragPointerId = null; });
    this.lamp.on("pointerupoutside", pointer => { if (this.lampDragPointerId === pointer.id) { this.lampDragPointerId = null; this.soundFX?.stopLampFeedback?.(); } });
    this.rayGraphics = this.add.graphics().setDepth(10);
    this.shadowGraphics = this.add.graphics().setDepth(4);
    this.lightDustGraphics = this.add.graphics().setDepth(10);
    this.lightDust = Array.from({ length: 22 }, (_, index) => ({
      phase: index * 2.399, speed: 0.35 + (index % 5) * 0.09,
      radius: 0.7 + (index % 3) * 0.35, drift: 12 + (index % 4) * 7
    }));
  }

  createPlayer() {
    const start = this.level.playerStart;
    this.player = this.physics.add.sprite(start.x, start.y, "arzon");
    this.player.setVisible(false);
    this.player.setSize(PLAYER_WIDTH, PLAYER_HEIGHT);
    this.player.setOffset((this.player.width - PLAYER_WIDTH) / 2, (this.player.height - PLAYER_HEIGHT) / 2);
    this.player.setCollideWorldBounds(false);
    this.player.setGravityY(1050);
    this.player.setMaxVelocity(PLAYER_SPEED, 900);
    this.player.setDragX(PLAYER_DRAG);
    this.player.setBounce(0);
    this.playerVisual = this.add.container(start.x, start.y).setDepth(20);
    this.arzon = this.add.image(0, -10, "arzon").setDisplaySize(116, 126);
    this.arzonBaseScaleX = this.arzon.scaleX;
    this.arzonBaseScaleY = this.arzon.scaleY;
    this.playerVisual.add(this.arzon);
    this.arzonAura = this.add.circle(start.x, start.y, 43, 0x53eaff, 0.075).setDepth(19);
    this.landingDustGraphics = this.add.graphics().setDepth(19);
    this.landingDust = [];
    this.playerVisual.setScale(1);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.wasGrounded = false;
    this.landSquash = 0;
  }

  createCompanion() {
    const start = this.level.playerStart;
    this.pushiShadow = this.add.ellipse(start.x - 55, this.worldGroundY + 39, 36, 8, 0x050611, 0.5).setDepth(13);
    this.pushiAura = this.add.circle(start.x - 55, start.y, 26, 0x9b63ff, 0.09).setDepth(14);
    this.pushi = this.add.image(start.x - 55, start.y, "pushi").setDisplaySize(78, 78).setDepth(15);
    this.pushiBaseScaleX = this.pushi.scaleX;
    this.pushiBaseScaleY = this.pushi.scaleY;
    this.pushiTarget = new Phaser.Math.Vector2(start.x - 55, start.y);
    this.pushiResonanceBeam = this.add.graphics().setDepth(14);
    this.pushiDanger = false;
  }

  createPortal() {
    const data = this.level.portal;
    this.portal = this.add.container(data.x + data.width / 2, data.y + data.height / 2).setDepth(11);
    const ring = this.add.graphics();
    ring.lineStyle(5, 0x987cff, 0.95); ring.strokeEllipse(0, 0, data.width * 0.78, data.height * 0.98);
    ring.lineStyle(2, 0x59eaff, 0.8); ring.strokeEllipse(0, 0, data.width * 0.48, data.height * 0.76);
    ring.fillStyle(0x754dff, 0.17); ring.fillEllipse(0, 0, data.width * 0.6, data.height * 0.84);
    this.portal.add(ring);
    this.portalBounds = new Phaser.Geom.Rectangle(data.x, data.y, data.width, data.height);
    this.tweens.add({ targets: this.portal, alpha: { from: 0.68, to: 1 }, scale: { from: 0.94, to: 1.06 }, duration: 1250, yoyo: true, repeat: -1 });
  }

  createHud() {
    const width = this.scale.width;
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(50);
    const title = this.add.text(26, 22, this.level.title.toUpperCase(), {
      fontFamily: "Nunito, sans-serif", fontSize: "15px", fontStyle: "900", color: "#e3f7ff",
      shadow: { color: "#5a7cff", blur: 12, fill: true }
    });
    this.hud.add(title);
    this.objectiveText = this.add.text(26, 47, this.level.texts?.objective ?? this.level.description, {
      fontFamily: "Nunito, sans-serif", fontSize: "10px", fontStyle: "800", color: "#8ea5d8"
    });
    this.hud.add(this.objectiveText);
    if (this.newCyclePlus) {
      this.hud.add(this.add.text(width / 2, 22, "НОВЫЙ ЦИКЛ +  ·  ЗАБЕГ НА РЕКОРД", {
        fontFamily: "Nunito, sans-serif", fontSize: "10px", fontStyle: "900",
        color: "#ffd99a", stroke: "#17102f", strokeThickness: 3
      }).setOrigin(0.5));
    }
    this.createHudButton(width - 278, 30, 76, 30, "РЕСТАРТ", () => this.restartLevel());
    this.createHudButton(width - 190, 30, 68, 30, "МЕНЮ", () => this.returnToMenu());
    this.createHudButton(width - 112, 30, 76, 30, "ПАУЗА", () => this.togglePause());
    this.muteHudButton = this.createHudButton(width - 28, 30, 70, 30, this.getMuteLabel(), () => {
      this.soundFX?.toggleMute?.();
      this.muteHudButton?.label.setText(this.getMuteLabel());
    });
  }

  createHudButton(x, y, width, height, label, callback) {
    const visual = this.add.graphics();
    visual.fillStyle(0x171e48, 0.92); visual.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    visual.lineStyle(1, 0x6e91e8, 0.68); visual.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    const text = this.add.text(x, y, label, {
      fontFamily: "Nunito, sans-serif", fontSize: "9px", fontStyle: "900", color: "#e6faff"
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", pointer => {
      if (pointer.button !== 0 || this.transitioning) return;
      this.unlockAudio();
      callback();
    });
    zone.on("pointerover", () => text.setColor("#78edff"));
    zone.on("pointerout", () => text.setColor("#e6faff"));
    this.hud.add([visual, text, zone]);
    return { visual, label: text, zone };
  }

  getMuteLabel() {
    return this.soundFX?.isMuted?.() ? "ЗВУК: ВЫКЛ" : "ЗВУК: ВКЛ";
  }

  createTouchControls() {
    this.touchControls = [];
    const addControl = (x, y, label, action, width = 58) => {
      const graphic = this.add.graphics().setScrollFactor(0).setDepth(51);
      graphic.fillStyle(0x20295b, 0.72); graphic.fillCircle(x, y, width / 2);
      graphic.lineStyle(2, 0x6deaff, 0.72); graphic.strokeCircle(x, y, width / 2);
      const text = this.add.text(x, y, label, {
        fontFamily: "Nunito, sans-serif", fontSize: "22px", fontStyle: "900", color: "#e5fbff"
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
      const zone = this.add.zone(x, y, width, width).setInteractive().setScrollFactor(0).setDepth(53);
      zone.on("pointerdown", pointer => {
        if (this.transitioning || this.dead || this.completed || this.paused) return;
        this.unlockAudio();
        this.pointerOwners.set(pointer.id, action);
        if (action === "jump") this.queueJump();
        this.refreshMobileInput();
        graphic.setAlpha(1);
      });
      this.touchControls.push({ zone, graphic, text, action });
    };
    const h = this.scale.height;
    addControl(56, h - 62, "◀", "left");
    addControl(124, h - 62, "▶", "right");
    addControl(this.scale.width - 68, h - 66, "↑", "jump", 66);
  }

  refreshMobileInput() {
    const owners = [...this.pointerOwners.values()];
    this.mobileInput.left = owners.includes("left");
    this.mobileInput.right = owners.includes("right");
  }

  handlePointerUp(pointer) {
    this.pointerOwners.delete(pointer.id);
    this.refreshMobileInput();
    if (this.lampDragPointerId === pointer.id) { this.lampDragPointerId = null; this.soundFX?.stopLampFeedback?.(); }
    for (const control of this.touchControls ?? []) {
      const stillPressed = [...this.pointerOwners.values()].includes(control.action);
      control.graphic.setAlpha(stillPressed ? 1 : 0.82);
    }
  }

  handleAllPointersUp() {
    this.pointerOwners.clear();
    this.mobileInput.left = false;
    this.mobileInput.right = false;
    this.mobileInput.jump = false;
    this.lampDragPointerId = null;
    this.soundFX?.stopLampFeedback?.();
  }

  handleLampDrag(pointer, gameObject, dragX, dragY) {
    if (gameObject !== this.lamp || this.transitioning || this.dead || this.completed) return;
    this.soundFX?.beginLampFeedback?.();
    if (this.lampDragPointerId !== null && pointer.id !== this.lampDragPointerId) return;
    this.lampDragPointerId = pointer.id;
    this.lamp.setPosition(
      Phaser.Math.Clamp(dragX, this.lampBounds.minX, this.lampBounds.maxX),
      Phaser.Math.Clamp(dragY, this.lampBounds.minY, this.lampBounds.maxY)
    );
    this.lampGlow.setPosition(this.lamp.x, this.lamp.y);
    this.updateAllBridges();
    const coverage = this.bridges.reduce((maximum, item) => Math.max(maximum, Number(item.shadow?.coverage) || 0), 0);
    this.soundFX?.updateLampFeedback?.(coverage);
  }

  handleLampDragEnd(pointer, gameObject) {
    if (gameObject === this.lamp && this.lampDragPointerId === pointer.id) { this.lampDragPointerId = null; this.soundFX?.stopLampFeedback?.(); }
  }

  createKeyboardControls() {
    if (!this.input.keyboard) return;
    this.keys = this.input.keyboard.addKeys({
      leftA: Phaser.Input.Keyboard.KeyCodes.A,
      leftArrow: Phaser.Input.Keyboard.KeyCodes.LEFT,
      rightD: Phaser.Input.Keyboard.KeyCodes.D,
      rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      jumpW: Phaser.Input.Keyboard.KeyCodes.W,
      jumpUp: Phaser.Input.Keyboard.KeyCodes.UP,
      jumpSpace: Phaser.Input.Keyboard.KeyCodes.SPACE
    });
    this.keyboardJumpHandler = event => {
      if ([32, 38, 87].includes(event.keyCode)) this.queueJump();
    };
    this.input.keyboard.on("keydown", this.keyboardJumpHandler);
    this.keyboardPauseHandler = event => { if (event.key === "Escape") { event.preventDefault(); this.togglePause(); } };
    this.input.keyboard.on("keydown", this.keyboardPauseHandler);
  }

  queueJump() {
    this.jumpBufferUntil = this.time.now + JUMP_BUFFER_TIME;
  }

  createCollisions() {
    this.platformColliders = [];
    for (const platform of this.platforms) {
      this.platformColliders.push(this.physics.add.collider(this.player, platform));
    }
    for (const item of this.bridges) {
      item.collider = this.physics.add.collider(this.player, item.bridge);
    }
    for (const obstacle of this.obstacles) {
      if (obstacle.physicsBody) this.platformColliders.push(this.physics.add.collider(this.player, obstacle.art));
    }
  }

  createSensors() {
    this.sensorObjects = [];
    for (const data of this.level.sensors ?? []) {
      const color = data.color ?? 0x9d83ff;
      const visual = this.add.circle(data.x + data.width / 2, data.y + data.height / 2, Math.min(data.width, data.height) * 0.48, color, 0.18).setStrokeStyle(2, color, 0.85).setDepth(9);
      const ring = this.add.circle(visual.x, visual.y, Math.min(data.width, data.height) * 0.68, color, 0).setStrokeStyle(1, 0xc9baff, 0.45).setDepth(9);
      this.sensorObjects.push({ data, visual, ring, elapsed: 0, activated: false, challengeComplete: false });
    }
  }

  updateSensors(delta) {
    for (const sensor of this.sensorObjects ?? []) {
      if (sensor.activated && !sensor.data.holdToMaintain) continue;
      const sensorRect = { x: sensor.data.x, y: sensor.data.y, width: sensor.data.width, height: sensor.data.height };
      const covered = this.bridges.some(item => {
        if (sensor.data.crystalId && item.obstacleId !== sensor.data.crystalId) return false;
        return ShadowProjection.intersectsRect(item.shadow?.polygon ?? [], sensorRect);
      });
      sensor.elapsed = covered ? sensor.elapsed + delta : 0;
      const progress = Phaser.Math.Clamp(sensor.elapsed / sensor.data.requiredHold, 0, 1);
      sensor.visual.setFillStyle(sensor.data.color ?? 0x9d83ff, 0.18 + progress * 0.55);
      sensor.ring.setScale(1 + progress * 0.3);

      if (sensor.data.holdToMaintain) {
        const wasActive = sensor.activated;
        sensor.activated = covered && progress >= 1;
        if (sensor.data.requiresJump && sensor.activated && this.player?.body?.velocity.y < -80 &&
            this.player.x >= sensor.data.jumpXMin && this.player.x <= sensor.data.jumpXMax) {
          sensor.challengeComplete = true;
        }
        const target = this.obstacles.find(item => item.data.id === sensor.data.targetObstacleId);
        const open = sensor.challengeComplete || sensor.activated;
        if (target) {
          target.open = open;
          target.art.setAlpha(open ? 0.12 : 1);
          target.core.setAlpha(open ? 0.05 : 0.12);
          target.halo.setAlpha(open ? 0.02 : 0.07);
          if (target.physicsBody) target.physicsBody.enable = !open;
        }
        if (sensor.challengeComplete) {
          sensor.visual.setFillStyle(0xffe4a3, 0.9);
          sensor.ring.setStrokeStyle(2, 0xffe4a3, 1);
        } else if (sensor.activated) {
          sensor.visual.setFillStyle(0xffd28a, 0.8);
          sensor.ring.setStrokeStyle(2, 0xffd28a, 0.95);
        } else if (wasActive) {
          sensor.ring.setStrokeStyle(1, 0xc9baff, 0.45);
        }
        continue;
      }

      if (progress >= 1) {
        sensor.activated = true;
        sensor.visual.setFillStyle(0x76ffd7, 0.85);
        sensor.ring.setStrokeStyle(2, 0x76ffd7, 0.9);
        const target = this.obstacles.find(item => item.data.id === sensor.data.targetObstacleId);
        if (target) {
          target.open = true;
          target.art.setAlpha(0.12);
          target.core.setAlpha(0.05);
          target.halo.setAlpha(0.02);
          if (target.physicsBody) target.physicsBody.enable = false;
        }
        this.soundFX?.playCrystal?.();
        if (this.level.id === 20 && sensor.data.phase === 1) this.enterFinalPhase(2);
      }
    }
  }

  createFinalActHud() {
    if (this.level.id !== 20) return;
    this.finalActText = this.add.text(this.scale.width / 2, 72, this.level.texts.phase1, {
      fontFamily: "Nunito, sans-serif", fontSize: "12px", fontStyle: "900",
      color: "#b9d9ff", stroke: "#11132d", strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(55);
  }

  enterFinalPhase(phase) {
    if (this.level.id !== 20 || phase <= (this.finalPhase ?? 1)) return;
    this.finalPhase = phase;
    const labels = [null, this.level.texts.phase1, this.level.texts.phase2, this.level.texts.phase3];
    this.finalActText?.setText(labels[phase] ?? "");
    this.finalActText?.setColor(phase === 1 ? "#b9d9ff" : phase === 2 ? "#d9b9ff" : "#ffe1a3");
    if (phase === 2) {
      this.finalPaletteOverlay = this.add.graphics().setDepth(-19);
      this.finalPaletteOverlay.fillGradientStyle(0x24154c, 0x512b70, 0xb77a48, 0x21183f, 0.72);
      this.finalPaletteOverlay.fillRect(0, 0, this.level.world.width, this.level.world.height);
      this.finalPaletteOverlay.setAlpha(0);
      this.tweens.add({ targets: this.finalPaletteOverlay, alpha: 0.82, duration: 1700, ease: "Sine.easeInOut" });
      this.cameras.main.flash(650, 120, 75, 180);
      this.soundFX?.playBridgeLock?.();
    } else if (phase === 3) {
      this.soundFX?.playCrystal?.();
      this.pushiAura?.setFillStyle(0xffd28a, 0.3);
    }
  }

  updateFinalAct() {
    if (this.level.id !== 20) return;
    const memory = this.sensorObjects?.find(item => item.data.id === this.level.finalSequence.memorySensorId);
    const heart = this.sensorObjects?.find(item => item.data.id === this.level.finalSequence.heartSensorId);
    if (!memory?.activated) return;
    const bothBridgesBuilt = this.bridges.length === 2 && this.bridges.every(item => item.active);
    const bothBridgesCrossed = this.bridges.every(item => this.crossedBridges.has(item.id));
    if (bothBridgesBuilt && bothBridgesCrossed && !heart?.challengeComplete) this.enterFinalPhase(3);
    if (heart?.challengeComplete) this.enterFinalPhase(3);
  }

  ejectPlayerFromBridge(item) {
    const body = this.player?.body;
    if (!body) return;
    const overlapsX = body.right > item.gap.x && body.left < item.gap.x + item.gap.width;
    const bridgeTop = this.worldGroundY;
    const overlapsY = body.bottom > bridgeTop && body.top < this.worldGroundY + 8;
    if (overlapsX && overlapsY && body.velocity.y >= 0) {
      this.player.y = bridgeTop - body.height / 2;
      body.updateFromGameObject();
      body.setVelocityY(0);
      this.wasGrounded = true;
    }
  }

  togglePause() {
    if (this.dead || this.completed || this.transitioning) return;
    if (this.paused) { this.closePause(); return; }
    this.paused = true;
    this.physics.world.pause();
    this.tweens.pauseAll();
    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2).setScrollFactor(0).setDepth(120);
    this.pauseOverlay = panel;
    const width = Math.min(430, this.scale.width - 32);
    panel.add(this.add.rectangle(0, 0, width, Math.min(430, this.scale.height - 28), 0x080b22, 0.985).setStrokeStyle(2, 0x8b7aff, 1));
    panel.add(this.add.text(0, -174, "ПАУЗА", { fontFamily: "Nunito, sans-serif", fontSize: "25px", fontStyle: "900", color: "#e7faff" }).setOrigin(.5));
    this.createPauseButton(panel, 0, -112, "ПРОДОЛЖИТЬ", () => this.closePause(), width - 64);
    this.createPauseButton(panel, 0, -62, "ПЕРЕЗАПУСТИТЬ УРОВЕНЬ", () => this.restartLevel(), width - 64);
    this.createPauseButton(panel, 0, -12, "ГРОМКОСТЬ SFX / МУЗЫКИ  −", () => this.soundFX?.setMasterVolume?.(Math.max(0.03, (this.soundFX.getMasterVolume?.() ?? 0.24) - 0.03)), width - 64);
    this.createPauseButton(panel, 0, 34, "ГРОМКОСТЬ SFX / МУЗЫКИ  +", () => this.soundFX?.setMasterVolume?.(Math.min(0.4, (this.soundFX.getMasterVolume?.() ?? 0.24) + 0.03)), width - 64);
    this.createPauseButton(panel, 0, 82, "ПОЛНЫЙ ЭКРАН", () => this.scale.toggleFullscreen(), width - 64);
    this.createPauseButton(panel, 0, 132, "В ГЛАВНОЕ МЕНЮ", () => this.returnToMenu(), width - 64);
  }

  createPauseButton(parent, x, y, label, callback, width) {
    const graphic = this.add.graphics();
    graphic.fillStyle(0x252d68, 0.98);
    graphic.fillRoundedRect(-width / 2, -18, width, 36, 8);
    graphic.lineStyle(1, 0x7c9cff, 0.8);
    graphic.strokeRoundedRect(-width / 2, -18, width, 36, 8);
    const text = this.add.text(x, y, label, { fontFamily: "Nunito, sans-serif", fontSize: "11px", fontStyle: "900", color: "#effaff" }).setOrigin(.5);
    const zone = this.add.zone(x, y, width, 36).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", callback);
    parent.add([graphic.setPosition(x, y), text, zone]);
  }

  closePause() {
    if (!this.paused) return;
    this.paused = false;
    this.pauseOverlay?.destroy(true);
    this.pauseOverlay = null;
    this.tweens.resumeAll();
    this.physics.world.resume();
  }

  createLevelIntro() {
    const title = this.add.text(this.scale.width / 2, 135, this.level.texts?.intro ?? this.level.title.toUpperCase(), {
      fontFamily: "Nunito, sans-serif", fontSize: "24px", fontStyle: "900", color: "#dffaff",
      shadow: { color: "#648cff", blur: 18, fill: true }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
    const subtitle = this.add.text(this.scale.width / 2, 169, this.level.subtitle ?? "", {
      fontFamily: "Nunito, sans-serif", fontSize: "12px", fontStyle: "800", color: "#9eaddc"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
    const lore = this.add.text(this.scale.width / 2, 199, this.level.lore ?? "", { fontFamily: "Nunito, sans-serif", fontSize: "10px", fontStyle: "700", color: "#8c9ed0", align: "center", wordWrap: { width: this.scale.width - 48 } }).setOrigin(.5).setScrollFactor(0).setDepth(60);
    this.tweens.add({ targets: [title, subtitle, lore], alpha: 0, delay: 4200, duration: 900, onComplete: () => { title.destroy(); subtitle.destroy(); lore.destroy(); } });
  }

  updatePatrols(delta) {
    const seconds = delta / 1000;
    for (const obstacle of this.obstacles) {
      const patrol = obstacle.data.patrol;
      if (!patrol || !obstacle.data.movable) continue;
      const axis = patrol.axis === "y" ? "y" : "x";
      obstacle[axis] += (Number(patrol.speed) || 0) * seconds * obstacle.direction;
      if (obstacle[axis] >= patrol.max) {
        obstacle[axis] = patrol.max;
        obstacle.direction = -1;
      } else if (obstacle[axis] <= patrol.min) {
        obstacle[axis] = patrol.min;
        obstacle.direction = 1;
      }
      obstacle.art.setPosition(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
      if (obstacle.physicsBody) obstacle.physicsBody.updateFromGameObject();
      obstacle.core.setPosition(obstacle.art.x, obstacle.art.y);
      obstacle.halo.setPosition(obstacle.art.x, obstacle.art.y);
    }
  }

  updateAllBridges() {
    if (!this.lamp || !this.bridges) return;
    this.shadowGraphics.clear();
    this.rayGraphics.clear();
    for (const item of this.bridges) {
      const obstacle = this.obstacles.find(candidate => candidate.data.id === item.obstacleId);
      if (!obstacle) {
        item.active = false;
        item.bridge.body.enable = false;
        item.bridge.setAlpha(0.06);
        continue;
      }
      const shadow = item.fixed && item.fixedShadow
        ? item.fixedShadow
        : ShadowProjection.calculate({
          lightX: this.lamp.x,
          lightY: this.lamp.y,
          obstacle: { x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height },
          groundY: this.worldGroundY,
          gapStart: item.gap.x,
          gapEnd: item.gap.x + item.gap.width
        });
      item.shadow = shadow;
      const color = obstacle.data.color ?? 0x70eaff;
      if (shadow.polygon.length) {
        this.shadowGraphics.fillStyle(color, shadow.active ? 0.2 : 0.055);
        this.shadowGraphics.fillPoints(shadow.polygon.map(point => new Phaser.Geom.Point(point.x, point.y)), true);
        this.shadowGraphics.lineStyle(1.5, color, shadow.active ? 0.62 : 0.15);
        this.shadowGraphics.strokePoints(shadow.polygon.map(point => new Phaser.Geom.Point(point.x, point.y)), true);
        this.rayGraphics.lineStyle(1.5, 0x72eaff, 0.3);
        this.rayGraphics.lineBetween(this.lamp.x, this.lamp.y, obstacle.x + obstacle.width / 2, obstacle.y);
        this.rayGraphics.lineBetween(obstacle.x + obstacle.width / 2, obstacle.y, shadow.projectedLeft, this.worldGroundY);
        this.rayGraphics.lineBetween(this.lamp.x, this.lamp.y, obstacle.x + obstacle.width / 2, obstacle.y);
        this.rayGraphics.lineBetween(obstacle.x + obstacle.width / 2, obstacle.y, shadow.projectedRight, this.worldGroundY);
      }
      const coverage = Phaser.Math.Clamp(Number(shadow.coverage) || 0, 0, 1);
      const material = shadow.active ? 1 : Phaser.Math.Clamp(coverage * 0.88, 0, 0.88);
      item.material = Phaser.Math.Linear(item.material ?? 0, material, 0.24);
      const wasActive = item.active;
      const canLock = this.gaps.length > 1 && obstacle.data.type === "crystal" && !obstacle.data.patrol;
      if (!item.fixed && canLock && shadow.active) {
        item.fixed = true;
        item.fixedShadow = shadow;
        this.ejectPlayerFromBridge(item);
        this.soundFX?.playBridgeLock?.();
      } else if (!item.fixed && shadow.active && !wasActive) {
        this.ejectPlayerFromBridge(item);
        this.soundFX?.playBridge?.();
      } else if (!item.fixed && !shadow.active && wasActive) {
        this.soundFX?.playBridgeFade?.();
      }
      item.active = item.fixed || shadow.active;
      item.bridge.body.enable = item.active;
      if (shadow.width > 0 && shadow.polygon.length) {
        const centerX = shadow.x + shadow.width / 2;
        item.bridge.setPosition(centerX, this.worldGroundY + 6);
        item.bridge.setSize(shadow.width, 12);
        item.bridge.body.setSize(shadow.width, 12);
        item.bridge.body.updateFromGameObject();
        item.glow.setPosition(centerX, this.worldGroundY + 6);
        item.glow.setSize(shadow.width, 22);
        item.bridge.setAlpha(0.12 + item.material * 0.82);
        item.bridge.setFillStyle(item.fixed ? 0x9b75ff : 0x69eaff, item.fixed ? 0.72 : 0.1 + item.material * 0.62);
        item.bridge.setStrokeStyle(item.fixed ? 3 : 2, item.fixed ? 0xffd98a : 0x8bf4ff, item.fixed ? 0.98 : 0.12 + item.material * 0.78);
        item.glow.setFillStyle(item.fixed ? 0xb68aff : 0x45dfff, item.fixed ? 0.18 : 0.05);
        item.glow.setAlpha(item.fixed ? 0.42 : 0.035 + item.material * 0.31);
        if (item.active) {
          const ripple = (this.time.now / 520 + item.gap.x * 0.013) % 1;
          this.shadowGraphics.lineStyle(2, 0xc9fbff, 0.55);
          const rippleX = item.gap.x + ripple * item.gap.width;
          this.shadowGraphics.lineBetween(rippleX, this.worldGroundY - 2, rippleX + 18, this.worldGroundY - 2);
        }
      } else {
        item.bridge.setAlpha(0.04);
        item.bridge.setStrokeStyle(1, 0x6deaff, 0.08);
        item.glow.setAlpha(0.02);
      }
    }
  }

  update(time, delta) {
    if (!this.player || this.dead || this.completed || this.transitioning || this.paused) return;
    const safeDelta = Math.min(delta || 16.67, 40);
    this.levelElapsed += safeDelta;
    this.updatePatrols(safeDelta);
    this.updateAllBridges();
    this.updateSensors(safeDelta);
    this.updatePlayerMovement(time);
    this.updateBridgeProgress();
    this.updateFinalAct();
    this.updateCharacterVisuals(time);
    this.updateLightAtmosphere(time);
    this.updateLandingDust(safeDelta);
    this.checkDeath();
    this.checkPortal();
  }

  updatePlayerMovement(time) {
    const body = this.player.body;
    const left = Boolean(this.keys?.leftA.isDown || this.keys?.leftArrow.isDown || this.mobileInput.left);
    const right = Boolean(this.keys?.rightD.isDown || this.keys?.rightArrow.isDown || this.mobileInput.right);
    const direction = (right ? 1 : 0) - (left ? 1 : 0);
    if (direction !== 0) {
      body.setAccelerationX(direction * PLAYER_ACCELERATION);
      body.setDragX(0);
      this.facing = direction;
    } else {
      body.setAccelerationX(0);
      body.setDragX(PLAYER_DRAG);
    }
    body.setMaxVelocity(PLAYER_SPEED, 950);

    const grounded = body.blocked.down || body.touching.down;
    if (grounded) this.coyoteUntil = time + COYOTE_TIME;
    if (this.jumpBufferUntil >= time && time <= this.coyoteUntil) {
      body.setVelocityY(-JUMP_SPEED);
      this.jumpBufferUntil = 0;
      this.coyoteUntil = 0;
      this.wasGrounded = false;
      this.soundFX?.playJump?.();
    }
  }

  updateBridgeProgress() {
    if (!this.player?.body || !this.bridges?.length) return;
    const playerX = this.player.x;
    for (const item of this.bridges) {
      const gapStart = item.gap.x;
      const gapEnd = item.gap.x + item.gap.width;
      if (item.active && playerX + PLAYER_WIDTH / 2 >= gapStart && playerX - PLAYER_WIDTH / 2 <= gapEnd) {
        this.enteredBridges.add(item.id);
      }
      if (this.enteredBridges.has(item.id) && playerX >= gapEnd + PLAYER_WIDTH / 2 && this.player.y < this.worldGroundY + 12) {
        this.crossedBridges.add(item.id);
      }
    }
  }

  updateCharacterVisuals(time) {
    const body = this.player.body;
    const grounded = body.blocked.down || body.touching.down;
    const vx = body.velocity.x;
    const moving = grounded && Math.abs(vx) > 18;
    if (moving && time - (this.lastFootstepTime ?? 0) > 250) {
      const currentBridge = this.bridges.find(item => item.active && this.player.x >= item.gap.x && this.player.x <= item.gap.x + item.gap.width);
      this.soundFX?.playRunStep?.(Boolean(currentBridge));
      this.lastFootstepTime = time;
    }
    if (grounded && !this.wasGrounded) {
      this.landSquash = 1;
      this.emitLandingDust();
      this.soundFX?.playLand?.(Math.abs(body.velocity.y));
    }
    this.wasGrounded = grounded;
    this.landSquash = Phaser.Math.Linear(this.landSquash, 0, 0.2);
    const bob = grounded ? (moving ? Math.abs(Math.sin(time / 72)) * 3 : Math.sin(time / 260) * 2) : 0;
    this.playerVisual.setPosition(this.player.x, this.player.y + bob);
    this.playerVisual.setScale(this.facing, 1);
    const speedRatio = Phaser.Math.Clamp(vx / PLAYER_SPEED, -1, 1);
    const sx = grounded ? 1 + this.landSquash * (moving ? 0.12 : 0.18) : 0.82;
    const sy = grounded ? 1 - this.landSquash * (moving ? 0.1 : 0.14) : 1.2;
    this.arzon.setScale(this.arzonBaseScaleX * sx, this.arzonBaseScaleY * sy);
    this.arzon.y = -10 + bob * 0.25;
    this.arzon.angle = grounded
      ? (moving ? speedRatio * 8 : Math.sin(time / 310) * 1.4)
      : Phaser.Math.Clamp(speedRatio * 7, -9, 9);
    this.arzonAura.setPosition(this.player.x, this.player.y - 4);
    const nearestBridge = this.bridges.reduce((nearest, bridge) => {
      const distance = Math.abs((bridge.gap.x + bridge.gap.width / 2) - this.player.x);
      return !nearest || distance < nearest.distance ? { bridge, distance } : nearest;
    }, null);
    const bridgeNear = nearestBridge && nearestBridge.distance < 260 && nearestBridge.bridge.active;
    this.arzonAura.setAlpha(bridgeNear ? 0.15 : 0.065);
    this.arzonAura.setFillStyle(bridgeNear ? 0x9c8bff : 0x53eaff, bridgeNear ? 0.14 : 0.065);

    const targetX = this.player.x - this.facing * 64;
    const targetY = this.player.y + (grounded ? 8 : 20);
    this.pushiTarget.set(targetX, targetY);
    this.pushi.x = Phaser.Math.Linear(this.pushi.x, this.pushiTarget.x, 0.085);
    this.pushi.y = Phaser.Math.Linear(this.pushi.y, this.pushiTarget.y + Math.sin(time / 190) * 3, 0.095);
    this.pushi.flipX = this.facing < 0;
    const pulse = Math.sin(time / 145) * 0.035;
    this.pushi.setScale(this.pushiBaseScaleX * (1 + pulse), this.pushiBaseScaleY * (1 - pulse));
    this.pushi.angle = Math.sin(time / 330) * 2.2;
    this.pushiAura.setPosition(this.pushi.x, this.pushi.y + 4);
    this.pushiShadow.setPosition(this.pushi.x, this.worldGroundY + 39);
    this.pushiResonanceBeam?.clear();
    const heartSensor = this.sensorObjects?.find(item => item.data.id === "heart-sensor");
    if (this.level.id === 20 && heartSensor?.activated && !heartSensor.challengeComplete) {
      this.pushiAura.setScale(1.8 + Math.sin(time / 95) * 0.12);
      this.pushiAura.setFillStyle(0xffd28a, 0.24);
      this.pushiResonanceBeam?.lineStyle(3, 0xffd28a, 0.48 + Math.sin(time / 110) * 0.16);
      this.pushiResonanceBeam?.lineBetween(this.pushi.x, this.pushi.y, this.player.x, this.player.y - 8);
    }
    this.pushiShadow.setScale(grounded ? 1 : 0.72, 1);
    const nearEdge = this.gaps.some(gap =>
      this.player.x > gap.x - 82 && this.player.x < gap.x + gap.width + 82
    );
    this.pushiDanger = nearEdge && !this.bridges.every(bridge => bridge.active);
    this.pushiAura.setFillStyle(this.pushiDanger ? 0xff668f : (bridgeNear ? 0x72eaff : 0x9b63ff), this.pushiDanger ? 0.2 : 0.1);
    this.pushiAura.setAlpha(this.pushiDanger ? 0.24 : 0.1);
    this.pushi.setTint(this.pushiDanger ? 0xffc4df : 0xffffff);
    this.pushi.angle = Math.sin(time / (this.pushiDanger ? 150 : 330)) * (this.pushiDanger ? 4.5 : 2.2);
  }

  updateLightAtmosphere(time) {
    if (!this.lamp || !this.lightDustGraphics) return;
    this.lampGlow.setPosition(this.lamp.x, this.lamp.y);
    this.lampCoreGlow.setPosition(this.lamp.x, this.lamp.y);
    const unstable = this.level.id === 20 ? 0.78 + Math.abs(Math.sin(time / 145)) * 0.32 : 1;
    const pulse = (1 + Math.sin(time / 210) * 0.08) * unstable;
    this.lampCoreGlow.setScale(pulse);
    this.lampCoreGlow.setAlpha((0.1 + (pulse - 0.92) * 0.22) * unstable);
    this.lamp.setAlpha(this.level.id === 20 ? 0.76 + Math.abs(Math.sin(time / 190)) * 0.24 : 1);
    this.lightDustGraphics.clear();
    const coneTopX = this.lamp.x + 520;
    const coneBottomY = this.worldGroundY + 4;
    this.lightDustGraphics.fillStyle(0x54dfff, 0.018);
    this.lightDustGraphics.fillTriangle(this.lamp.x - 24, this.lamp.y, coneTopX, coneBottomY, this.lamp.x + 24, this.lamp.y);
    this.lightDustGraphics.lineStyle(1, 0x6beaff, 0.07);
    this.lightDustGraphics.lineBetween(this.lamp.x, this.lamp.y, coneTopX, coneBottomY);
    this.lightDustGraphics.lineBetween(this.lamp.x, this.lamp.y, this.lamp.x - 180, coneBottomY);
    for (const dust of this.lightDust) {
      const drift = (time * 0.00006 * dust.speed + dust.phase) % 1;
      const x = this.lamp.x + 28 + drift * 390;
      const y = this.lamp.y + (this.worldGroundY - this.lamp.y) * drift + Math.sin(time * 0.001 + dust.phase) * dust.drift;
      const fade = Math.sin(drift * Math.PI) * 0.36;
      this.lightDustGraphics.fillStyle(0x9cefff, fade);
      this.lightDustGraphics.fillCircle(x, y, dust.radius);
    }
  }

  updateLandingDust(delta) {
    if (!this.landingDustGraphics) return;
    this.landingDustGraphics.clear();
    const step = delta / 1000;
    for (let index = this.landingDust.length - 1; index >= 0; index--) {
      const particle = this.landingDust[index];
      particle.life -= step;
      particle.x += particle.vx * step;
      particle.y += particle.vy * step;
      particle.vy += 90 * step;
      if (particle.life <= 0) {
        this.landingDust.splice(index, 1);
        continue;
      }
      this.landingDustGraphics.fillStyle(0x8feeff, particle.life / particle.maxLife * 0.55);
      this.landingDustGraphics.fillCircle(particle.x, particle.y, particle.size * (particle.life / particle.maxLife));
    }
  }

  emitLandingDust() {
    for (let index = 0; index < 7; index++) {
      const angle = Math.PI + (index / 6) * Math.PI;
      const speed = 24 + (index % 3) * 13;
      this.landingDust.push({
        x: this.player.x + Phaser.Math.Between(-9, 9),
        y: this.player.body.bottom - 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.55,
        life: 0.34, maxLife: 0.34, size: 1.4 + (index % 2) * 0.8
      });
    }
  }

  checkDeath() {
    if (this.player.y > this.worldGroundY + 40) this.killPlayer();
  }

  killPlayer() {
    if (this.dead || this.completed) return;
    this.dead = true;
    this.resetFixedBridges();
    this.player.body.enable = false;
    this.playerVisual.setVisible(false);
    this.pushi.setAlpha(0.25);
    this.soundFX?.playDeath?.();
    this.cameras.main.shake(260, 0.012);
    const particles = this.add.particles(this.player.x, this.player.y, "arzon", {
      speed: { min: 35, max: 190 }, angle: { min: 0, max: 360 },
      scale: { start: 0.12, end: 0 }, alpha: { start: 0.9, end: 0 },
      lifespan: 650, quantity: 18, blendMode: "ADD"
    }).setDepth(35);
    this.time.delayedCall(650, () => particles.destroy());
    this.time.delayedCall(850, () => {
      if (this.scene.isActive()) this.scene.restart({
        levelIndex: this.levelIndex, newCyclePlus: this.newCyclePlus, runTimeMs: this.runTimeMs
      });
    });
  }

  checkPortal() {
    if (this.completed || this.transitioning) return;
    const bounds = this.player.getBounds();
    if (Phaser.Geom.Intersects.RectangleToRectangle(bounds, this.portalBounds)) {
      const allBridgesCrossed = this.bridges.length > 0 && this.bridges.every(item => this.crossedBridges.has(item.id));
      const gatesOpen = this.obstacles.filter(item => item.data.type === "barrier" && item.data.sensorId).every(item => item.open);
      const heart = this.sensorObjects?.find(item => item.data.id === "heart-sensor");
      const finalLeapComplete = this.level.id !== 20 || Boolean(heart?.challengeComplete);
      if (allBridgesCrossed && gatesOpen && finalLeapComplete) this.completeLevel();
    }
  }

  completeLevel() {
    if (this.completed) return;
    this.completed = true;
    this.player.setVelocity(0, 0);
    this.player.body.enable = false;
    if (this.level.id === 20) {
      this.finaleCutscene();
      return;
    }
    this.soundFX?.playTeleport?.();
    this.saveProgress();
    this.cameras.main.flash(280, 100, 220, 255);
    this.showCompletionPanel();
  }

  finaleCutscene() {
    if (this.finaleStarted) return;
    this.finaleStarted = true;
    this.transitioning = true;
    this.physics.world.timeScale = 0.35;
    this.soundFX?.stopLampFeedback?.();
    this.soundFX?.playFinale?.();
    this.player.body.enable = false;
    this.player.setVelocity(0, 0);
    this.cameras.main.stopFollow();
    this.cameras.main.zoomTo(1.35, 1800);
    this.cameras.main.pan((this.player.x + this.pushi.x) / 2, (this.player.y + this.pushi.y) / 2, 1800, "Sine.easeInOut");
    this.pushi.setDepth(22);
    this.tweens.add({
      targets: [this.pushi, this.pushiAura], x: this.player.x - 8, y: this.player.y - 7,
      duration: 1450, ease: "Cubic.easeInOut"
    });
    for (const crystal of this.obstacles.filter(item => item.data.type === "crystal")) {
      const burst = this.add.particles(crystal.art.x, crystal.art.y, "arzon", {
        speed: { min: 65, max: 280 }, angle: { min: 0, max: 360 },
        scale: { start: 0.22, end: 0 }, alpha: { start: 0.95, end: 0 },
        lifespan: 1450, quantity: 0, blendMode: "ADD"
      }).setDepth(80);
      burst.explode(28, crystal.art.x, crystal.art.y);
      this.time.delayedCall(1700, () => burst.destroy());
    }
    const dawn = this.add.graphics().setScrollFactor(0).setDepth(85);
    dawn.fillGradientStyle(0x251d62, 0x6b4b9b, 0xffc98b, 0xffe8b5, 0.72);
    dawn.fillRect(0, 0, this.scale.width, this.scale.height);
    dawn.setAlpha(0);
    this.tweens.add({ targets: dawn, alpha: 0.76, duration: 2600, ease: "Sine.easeInOut" });
    const impulse = this.add.circle(this.player.x, this.player.y - 6, 18, 0xffe5ad, 0.88).setDepth(90);
    impulse.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: impulse, scale: 18, alpha: 0, duration: 1050, delay: 1750,
      ease: "Cubic.easeOut", onStart: () => this.cameras.main.flash(520, 255, 226, 170),
      onComplete: () => impulse.destroy()
    });
    this.tweens.add({
      targets: [this.playerVisual, this.pushi, this.arzonAura, this.pushiAura],
      alpha: 0.12, scale: 1.5, duration: 650, delay: 1450, ease: "Cubic.easeOut"
    });
    this.time.delayedCall(4000, () => {
      this.physics.world.timeScale = 1;
      this.transitioning = false;
      this.showEpilogueScreen();
    });
  }

  showEpilogueScreen() {
    this.saveProgress();
    const progress = this.sdk?.progress ?? this.progressData ?? {};
    const stars = Object.values(progress.stars ?? {}).reduce((sum, value) => sum + Math.max(0, Math.min(3, Number(value) || 0)), 0);
    const totalTime = Object.values(progress.bestTimes ?? {}).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
    const attempts = Object.values(progress.attemptsByLevel ?? {}).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2).setScrollFactor(0).setDepth(120);
    const width = Math.min(620, this.scale.width - 28);
    const height = Math.min(440, this.scale.height - 24);
    panel.add(this.add.rectangle(0, 0, width, height, 0x100e2c, 0.97).setStrokeStyle(2, 0xffd28a, 0.95));
    panel.add(this.add.text(0, -height / 2 + 42, "ЦИКЛ РАЗОРВАН", {
      fontFamily: "Nunito, sans-serif", fontSize: this.scale.width < 520 ? "23px" : "31px",
      fontStyle: "900", color: "#ffe2a6", shadow: { color: "#ffb86b", blur: 18, fill: true }
    }).setOrigin(0.5));
    const story = "Арзон был первой искрой, потерявшей своё имя в бесконечном повторении.\nПуши хранил его свет — даже когда весь мир забывал рассвет.\nТеперь их свет стал новым утром. И этот путь больше не повторится.";
    panel.add(this.add.text(0, -height / 2 + 116, story, {
      fontFamily: "Nunito, sans-serif", fontSize: this.scale.width < 520 ? "10px" : "13px",
      fontStyle: "700", color: "#d5d4f2", align: "center", lineSpacing: 8,
      wordWrap: { width: width - 44 }
    }).setOrigin(0.5));
    const timeLabel = Math.floor(totalTime / 60) + " МИН " + Math.floor(totalTime % 60) + " СЕК";
    panel.add(this.add.text(0, 12, "ЗВЁЗДЫ  " + stars + " / 60     •     ВРЕМЯ  " + timeLabel +
      "\nПОПЫТКИ  " + attempts, {
      fontFamily: "Nunito, sans-serif", fontSize: "12px", fontStyle: "900",
      color: "#aeeeff", align: "center", lineSpacing: 9
    }).setOrigin(0.5));
    this.createPanelButton(panel, 0, height / 2 - 76, Math.min(260, width - 54), 44, "НОВЫЙ ЦИКЛ +", () => this.startNewCyclePlus());
    this.createPanelButton(panel, 0, height / 2 - 25, 170, 30, "В ГЛАВНОЕ МЕНЮ", () => this.returnToMenu(), true);
    const score = Number(progress.currentRunTime ?? totalTime);
    this.sdk?.submitLeaderboardScore?.(score);
    this.sdk?.gameplayStop?.();
  }

  startNewCyclePlus() {
    if (this.transitioning) return;
    this.transitioning = true;
    const progress = this.sdk?.progress ?? {};
    this.sdk?.saveProgress?.({
      newCyclePlus: true,
      cycleRuns: (Number(progress.cycleRuns) || 0) + 1,
      currentRunTime: 0
    });
    this.scene.start("GameScene", { levelIndex: 0, newCyclePlus: true, runTimeMs: 0 });
  }

  recordAttempt() {
    const attemptsByLevel = { ...(this.sdk?.progress?.attemptsByLevel ?? {}) };
    attemptsByLevel[this.level.id] = (Number(attemptsByLevel[this.level.id]) || 0) + 1;
    this.sdk?.saveProgress?.({ attemptsByLevel });
  }

  saveProgress() {
    let previous = {};
    try { previous = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); } catch {}
    const cloud = this.sdk?.progress ?? {};
    const bestTimes = { ...(cloud.bestTimes ?? {}), ...(previous.bestTimes ?? {}) };
    const seconds = Number((this.levelElapsed / 1000).toFixed(2));
    if (!bestTimes[this.level.id] || seconds < bestTimes[this.level.id]) bestTimes[this.level.id] = seconds;
    const par = Math.max(1, Number(this.level.parTimeSec) || 60);
    const earnedStars = seconds <= par * 0.72 ? 3 : seconds <= par ? 2 : 1;
    const stars = { ...(cloud.stars ?? {}), ...(previous.stars ?? {}) };
    stars[this.level.id] = Math.max(Number(stars[this.level.id]) || 0, earnedStars);
    const completedLevels = [...new Set([...(cloud.completedLevels ?? []), ...(previous.completedLevelsList ?? []), this.level.id])];
    const completedLevelsList = [...new Set([...(previous.completedLevelsList ?? []), this.level.id])];
    const attemptsByLevel = { ...(cloud.attemptsByLevel ?? {}) };
    const totalTimeByLevel = { ...(cloud.totalTimeByLevel ?? {}) };
    totalTimeByLevel[this.level.id] = Math.max(Number(totalTimeByLevel[this.level.id]) || 0, seconds);
    const totalTime = Object.values(bestTimes).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
    const currentRunTime = (Number(cloud.currentRunTime) || 0) + seconds;
    const record = {
      level: Math.min(LEVELS.length, Math.max(Number(previous.level) || 1, this.level.id + 1)),
      unlockedLevel: Math.min(LEVELS.length, Math.max(Number(cloud.unlockedLevel) || 1, this.level.id + 1)),
      lastCompletedLevel: this.level.id,
      completedLevels: completedLevels.length,
      completedLevelsList, completedLevels, bestTimes, stars, attemptsByLevel, totalTimeByLevel,
      totalTime, currentRunTime, updatedAt: Date.now()
    };
    this.progressData = record;
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(record)); }
    catch (error) { console.warn("[LOOP] Не удалось сохранить прогресс:", error); }
    this.sdk?.saveProgress?.(record);
    this.runTimeMs += this.levelElapsed;
    return record;
  }

  showCompletionPanel() {
    const finalLevel = this.levelIndex >= LEVELS.length - 1;
    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2).setScrollFactor(0).setDepth(100);
    const panelWidth = Math.min(470, this.scale.width - 36);
    const backdrop = this.add.rectangle(0, 0, panelWidth, 286, 0x090d28, 0.985).setStrokeStyle(2, 0x8b7aff, 1);
    panel.add(backdrop);
    panel.add(this.add.text(0, -83, finalLevel ? "ЦИКЛ РАЗОМКНУТ" : "УРОВЕНЬ ПРОЙДЕН", {
      fontFamily: "Nunito, sans-serif", fontSize: "25px", fontStyle: "900", color: "#dffaff"
    }).setOrigin(0.5));
    panel.add(this.add.text(0, -35, finalLevel ? (this.level.texts?.completion ?? "Ты изменил ход последнего цикла.") : "Арзон и Пуши продолжают путь.", {
      fontFamily: "Nunito, sans-serif", fontSize: "13px", fontStyle: "800", color: "#aab9e9", align: "center",
      wordWrap: { width: 390 }
    }).setOrigin(0.5));
    const seconds = (this.levelElapsed / 1000).toFixed(1);
    panel.add(this.add.text(0, 8, "ВРЕМЯ: " + seconds + " СЕК.", {
      fontFamily: "Nunito, sans-serif", fontSize: "11px", fontStyle: "900", color: "#78eaff"
    }).setOrigin(0.5));
    const mainLabel = finalLevel ? "ВЕРНУТЬСЯ В МЕНЮ" : "СЛЕДУЮЩИЙ УРОВЕНЬ";
    this.createPanelButton(panel, 0, 65, Math.min(250, panelWidth - 48), 42, mainLabel, () => {
      if (finalLevel) this.returnToMenu();
      else this.startLevel(this.levelIndex + 1);
    });
    this.createPanelButton(panel, 0, 119, 160, 32, "ПОВТОРИТЬ", () => this.restartLevel(), true);
    this.cameras.main.fadeIn(180);
  }

  createPanelButton(parent, x, y, width, height, label, callback, secondary = false) {
    const graphic = this.add.graphics();
    graphic.fillStyle(secondary ? 0x20264f : 0x3d48a4, 0.98);
    graphic.fillRoundedRect(-width / 2, -height / 2, width, height, 9);
    graphic.lineStyle(1.5, secondary ? 0x6776b8 : 0x8beeff, 0.85);
    graphic.strokeRoundedRect(-width / 2, -height / 2, width, height, 9);
    const text = this.add.text(x, y, label, {
      fontFamily: "Nunito, sans-serif", fontSize: secondary ? "10px" : "13px",
      fontStyle: "900", color: "#f3fcff"
    }).setOrigin(0.5);
    graphic.setPosition(x, y);
    const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", pointer => {
      if (pointer.button !== 0 || this.transitioning) return;
      this.unlockAudio();
      callback();
    });
    zone.on("pointerover", () => text.setColor("#83efff"));
    zone.on("pointerout", () => text.setColor("#f3fcff"));
    parent.add([graphic, text, zone]);
  }

  unlockAudio() {
    const result = this.soundFX?.unlock?.();
    if (result?.catch) result.catch(error => console.warn("[LOOP] Audio unlock failed:", error));
  }

  resetFixedBridges() {
    for (const item of this.bridges ?? []) {
      if (!item.fixed) continue;
      item.fixed = false;
      item.fixedShadow = null;
      item.shadow = null;
      item.active = false;
      item.material = 0;
      if (item.bridge?.body) item.bridge.body.enable = false;
      item.bridge?.setFillStyle(0x69eaff, 0.08).setStrokeStyle(2, 0x83f1ff, 0.12).setAlpha(0.06);
      item.glow?.setFillStyle(0x45dfff, 0.05).setAlpha(0.02);
    }
    this.shadowGraphics?.clear();
    this.rayGraphics?.clear();
    this.enteredBridges?.clear();
    this.crossedBridges?.clear();
  }

  restartLevel() {
    this.resetFixedBridges();
    if (this.paused) this.closePause();
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(260, 7, 7, 20);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.restart({
      levelIndex: this.levelIndex, newCyclePlus: this.newCyclePlus, runTimeMs: this.runTimeMs
    }));
  }

  startLevel(levelIndex) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(380, 7, 7, 20);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("GameScene", {
      levelIndex, newCyclePlus: this.newCyclePlus, runTimeMs: this.runTimeMs
    }));
  }

  returnToMenu() {
    if (this.paused) this.closePause();
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(350, 7, 7, 20);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("MenuScene"));
  }

  handleShutdown() {
    this.soundFX?.stopLampFeedback?.();
    this.soundFX?.stopAmbient?.();
    this.sdk?.gameplayStop?.();
    this.landingDust?.splice(0);
    this.lightDust?.splice(0);
    for (const [event, handler] of this.cleanupHandlers) this.input.off(event, handler, this);
    this.cleanupHandlers.length = 0;
    if (this.input.keyboard && this.keyboardJumpHandler) this.input.keyboard.off("keydown", this.keyboardJumpHandler);
    if (this.input.keyboard && this.keyboardPauseHandler) this.input.keyboard.off("keydown", this.keyboardPauseHandler);
    this.pauseOverlay?.destroy(true);
    this.pauseOverlay = null;
    this.pointerOwners.clear();
    this.platformColliders?.forEach(collider => collider?.destroy());
    this.bridges?.forEach(item => item.collider?.destroy());
    this.keys = null;
    this.player = null;
    this.playerVisual = null;
    this.soundFX = null;
    this.sdk = null;
  }
}
