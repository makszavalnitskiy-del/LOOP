import { ShadowProjection } from "../mechanics/shadows/ShadowProjection.js";

export class AwakeningScene extends Phaser.Scene {
  constructor() { super("AwakeningScene"); }

  create() {
    const W = 960, H = 600;
    this.cameras.main.setBackgroundColor("#090a20");
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x090a20, 0x111536, 0x171044, 0x080817, 1);
    bg.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) {
      this.add.circle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, 420), Phaser.Math.FloatBetween(.5, 1.8), 0x9eb5ff, Phaser.Math.FloatBetween(.12, .45));
    }
    this.add.text(48, 58, "ГЛАВА I  /  ПРОБУЖДЕНИЕ", { fontFamily: "Nunito", fontSize: "14px", fontStyle: "900", color: "#8fa6ff", letterSpacing: 3 });
    this.add.text(48, 82, "Тень может стать дорогой.", { fontFamily: "Nunito", fontSize: "23px", fontStyle: "800", color: "#e5eaff" });

    // Distant ruins
    const ruins = this.add.graphics();
    ruins.fillStyle(0x20204a, .8);
    [40, 150, 760, 850].forEach((x, i) => {
      ruins.fillRect(x, 330 - (i % 2) * 45, 48, 190);
      ruins.fillRect(x - 12, 320 - (i % 2) * 45, 72, 13);
      ruins.lineStyle(2, 0x6268b9, .35);
      ruins.strokeRect(x + 9, 350 - (i % 2) * 45, 28, 90);
    });

    // Layered ruins and crystal growths add depth without interfering with collision geometry.
    const farRuins = this.add.graphics().setDepth(1);
    farRuins.fillStyle(0x171a43, .52);
    farRuins.fillPoints([
      new Phaser.Geom.Point(0,350), new Phaser.Geom.Point(75,305),
      new Phaser.Geom.Point(135,350), new Phaser.Geom.Point(205,292),
      new Phaser.Geom.Point(270,350), new Phaser.Geom.Point(355,315),
      new Phaser.Geom.Point(430,350), new Phaser.Geom.Point(525,300),
      new Phaser.Geom.Point(620,350), new Phaser.Geom.Point(710,312),
      new Phaser.Geom.Point(795,350), new Phaser.Geom.Point(885,298),
      new Phaser.Geom.Point(960,350), new Phaser.Geom.Point(960,470),
      new Phaser.Geom.Point(0,470)
    ], true);
    const architecture = this.add.graphics().setDepth(2);
    architecture.lineStyle(3, 0x555a9d, .35);
    [[24,322,92,462],[860,305,932,460],[172,345,190,460],[770,350,790,460]].forEach(([x1,y1,x2,y2]) => {
      architecture.lineBetween(x1,y1,x1,y2);
      architecture.lineBetween(x1,y1,x2,y1);
      architecture.lineBetween(x2,y1,x2,y2);
    });
    architecture.lineStyle(1, 0x69eaff, .24);
    [48,72,884,908].forEach(x => architecture.lineBetween(x,360,x,420));

    const crystalArt = this.add.graphics().setDepth(4);
    const drawCrystal = (x,y,s=1) => {
      crystalArt.fillStyle(0x36dfff,.12);
      crystalArt.fillCircle(x,y-10*s,18*s);
      crystalArt.fillStyle(0x246cba,.92);
      crystalArt.fillPoints([
        new Phaser.Geom.Point(x,y-22*s), new Phaser.Geom.Point(x+9*s,y-7*s),
        new Phaser.Geom.Point(x+5*s,y+8*s), new Phaser.Geom.Point(x-6*s,y+8*s),
        new Phaser.Geom.Point(x-10*s,y-7*s)
      ],true);
      crystalArt.lineStyle(1.5,0x9af7ff,.85);
      crystalArt.lineBetween(x,y-22*s,x+5*s,y+8*s);
    };
    drawCrystal(72,486,.8); drawCrystal(365,482,.55);
    drawCrystal(755,486,.75); drawCrystal(900,486,.5);

    // Soft pulsing halos make the crystals feel alive without adding physics bodies.
    [[72,474,19],[365,470,13],[755,474,18],[900,478,11]].forEach(([x,y,r], i) => {
      const halo = this.add.circle(x, y, r, 0x45dcff, .10).setDepth(3);
      this.tweens.add({
        targets: halo,
        alpha: { from: .06, to: .22 },
        scale: { from: .78, to: 1.22 },
        duration: 1250 + i * 170,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: i * 180
      });
    });

    // Slow drifting motes add atmosphere; they are visual-only and never affect gameplay.
    for (let i = 0; i < 14; i++) {
      const mote = this.add.circle(
        Phaser.Math.Between(30, 930),
        Phaser.Math.Between(230, 485),
        Phaser.Math.FloatBetween(1, 2.2),
        i % 3 === 0 ? 0x9b82ff : 0x76eaff,
        Phaser.Math.FloatBetween(.18, .42)
      ).setDepth(5);
      this.tweens.add({
        targets: mote,
        y: mote.y - Phaser.Math.Between(18, 48),
        x: mote.x + Phaser.Math.Between(-12, 12),
        alpha: { from: mote.alpha, to: .04 },
        duration: Phaser.Math.Between(2400, 4200),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: i * 115
      });
    }

    const floorDetails = this.add.graphics().setDepth(3);
    floorDetails.lineStyle(2,0x747bd0,.48);
    floorDetails.lineBetween(0,500,400,500);
    floorDetails.lineBetween(620,500,960,500);
    floorDetails.lineStyle(1,0x49dff5,.22);
    [34,118,222,322,670,748,852,930].forEach(x => {
      floorDetails.lineBetween(x,516,x+28,516);
      floorDetails.fillStyle(0x69eaff,.38);
      floorDetails.fillCircle(x+14,516,1.5);
    });

    // Create each floor body exactly once. Adding an already-enabled body to a
    // StaticPhysicsGroup can attempt to enable it a second time on some Phaser builds.
    const leftFloor = this.add.rectangle(200, 548, 400, 104, 0x242653).setStrokeStyle(2, 0x5966b4, .8);
    const rightFloor = this.add.rectangle(790, 548, 340, 104, 0x242653).setStrokeStyle(2, 0x5966b4, .8);
    this.physics.add.existing(leftFloor, true);
    this.physics.add.existing(rightFloor, true);

    // Floating crystal blocks the light and casts a real geometric shadow onto the gap.
    this.occluder = { x: 280, y: 360, width: 120, height: 60 };
    this.occluderArt = this.add.rectangle(340, 390, 120, 60, 0x342b70, .95)
      .setStrokeStyle(2, 0x9a82ff, .9);
    this.add.rectangle(340, 390, 94, 36, 0x6d5bcb, .18).setStrokeStyle(1, 0x6eeaff, .5);
    this.add.text(340, 435, "КРИСТАЛЛ", { fontFamily: "Nunito", fontSize: "9px", fontStyle: "900", color: "#a99aff", letterSpacing: 2 }).setOrigin(.5);

    // The bridge is a physics body whose position and width follow the projected shadow.
    this.lightRays = this.add.graphics();
    this.shadowShape = this.add.graphics();
    this.bridgeGlow = this.add.rectangle(510, 496, 220, 13, 0x3ceaff, .18);
    this.bridge = this.add.rectangle(510, 496, 220, 13, 0x68eaff, .08).setStrokeStyle(2, 0x70eaff, .15);
    this.physics.add.existing(this.bridge);
    this.bridge.body.setAllowGravity(false);
    this.bridge.body.setImmovable(true);
    this.bridge.body.enable = false;
    this.bridgeActive = false;

    const bodyTexture = this.make.graphics({ x: 0, y: 0, add: false });
    bodyTexture.fillStyle(0xffffff, 1); bodyTexture.fillRoundedRect(2, 2, 28, 38, 10);
    bodyTexture.generateTexture("arz-body", 32, 42); bodyTexture.destroy();
    this.player = this.physics.add.sprite(115, 475, "arz-body");
    this.player.setSize(28, 38);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(900);
    this.player.setBounce(0);
    this.player.setAlpha(0);
    this.physics.add.collider(this.player, leftFloor);
    this.physics.add.collider(this.player, rightFloor);
    this.bridgeCollider = this.physics.add.collider(this.player, this.bridge);

    // Illustrated, high-resolution character artwork replaces the temporary primitive drawings.
    this.playerVisual = this.add.container(this.player.x, this.player.y).setDepth(12);
    this.arzonSprite = this.add.image(0, -12, "arzon").setDisplaySize(142, 154);
    this.arzonBaseScaleX = this.arzonSprite.scaleX;
    this.arzonBaseScaleY = this.arzonSprite.scaleY;
    this.playerVisual.add(this.arzonSprite);

    // Pushi has an independent aura and follows Arzon with a soft, delayed motion.
    // Keep the companion clearly separate from the hero and behind him visually.
    this.pushiShadow = this.add.ellipse(45, 535, 38, 8, 0x080817, .42).setDepth(5);
    this.pushiAura = this.add.circle(45, 480, 23, 0x9b63ff, .09).setDepth(6);
    this.pushi = this.add.image(45, 480, "pushi").setDisplaySize(82, 82).setDepth(8);
    this.pushiBaseScaleX = this.pushi.scaleX;
    this.pushiBaseScaleY = this.pushi.scaleY;

    // A brief eyelid stroke gives Arzon a readable blink without replacing the approved artwork.
    this.blinkArt = this.add.graphics();
    this.blinkArt.lineStyle(2, 0xd8ffff, 1);
    this.blinkArt.beginPath();
    // Phaser Graphics path builder has no quadraticBezierTo method;
    // approximate each eyelid with short line segments for compatibility.
    this.blinkArt.moveTo(-10.5, -8);
    this.blinkArt.lineTo(-8.5, -6.4);
    this.blinkArt.lineTo(-6.5, -5.5);
    this.blinkArt.lineTo(-4.5, -6.4);
    this.blinkArt.lineTo(-2.5, -8);
    this.blinkArt.moveTo(2.5, -8);
    this.blinkArt.lineTo(4.5, -6.4);
    this.blinkArt.lineTo(6.5, -5.5);
    this.blinkArt.lineTo(8.5, -6.4);
    this.blinkArt.lineTo(10.5, -8);
    this.blinkArt.strokePath();
    this.blinkArt.setAlpha(0);
    this.playerVisual.add(this.blinkArt);
    this.time.addEvent({ delay: 3100, loop: true, callback: () => {
      this.tweens.add({ targets: this.blinkArt, alpha: { from: 0, to: .9 }, duration: 65, yoyo: true, hold: 65 });
    }});
    this.wasGrounded = false;
    this.landSquash = 0;

    // Draggable lamp and its light pool.
    this.lampGlow = this.add.circle(500, 250, 78, 0x55dfff, .09);
    this.lamp = this.add.container(500, 250);
    const lampArt = this.add.graphics();
    lampArt.fillStyle(0x55eaff, .18); lampArt.fillCircle(0, 0, 30);
    lampArt.fillStyle(0x9bf7ff, 1); lampArt.fillCircle(0, 0, 12);
    lampArt.lineStyle(3, 0x7eeeff, 1); lampArt.strokeCircle(0, 0, 19);
    this.lamp.add(lampArt);
    this.lamp.setSize(44, 44);
    this.lamp.setInteractive(new Phaser.Geom.Circle(0, 0, 24), Phaser.Geom.Circle.Contains);
    this.input.setDraggable(this.lamp);
    this.input.on("drag", (pointer, obj, x, y) => {
      if (obj !== this.lamp) return;
      obj.x = Phaser.Math.Clamp(x, 80, 880);
      obj.y = Phaser.Math.Clamp(y, 180, 430);
      this.lampGlow.setPosition(obj.x, obj.y);
      this.updateBridge();
    });
    this.lamp.on("pointerover", () => this.input.setDefaultCursor("grab"));
    this.lamp.on("pointerout", () => this.input.setDefaultCursor("default"));

    // Exit portal
    this.portal = this.add.container(830, 435);
    const portalRing = this.add.graphics();
    portalRing.lineStyle(5, 0x8e71ff, .95); portalRing.strokeEllipse(0, 0, 48, 86);
    portalRing.lineStyle(2, 0x54eaff, .8); portalRing.strokeEllipse(0, 0, 30, 68);
    portalRing.fillStyle(0x6b45ff, .18); portalRing.fillEllipse(0, 0, 36, 70);
    this.portal.add(portalRing);
    this.tweens.add({ targets: this.portal, alpha: { from: .7, to: 1 }, scale: { from: .96, to: 1.05 }, duration: 1400, yoyo: true, repeat: -1 });

    this.keys = this.input.keyboard.addKeys("A,D,W,SPACE,LEFT,RIGHT,UP,R");
    this.mobileInput = { left: false, right: false, jump: false };
    if (this.sys.game.device.input.touch) {
      const addTouchButton = (x, label, key) => {
        const button = this.add.circle(x, 520, 25, 0x252b68, .78).setStrokeStyle(2, 0x71eaff, .8).setInteractive();
        this.add.text(x, 520, label, { fontFamily: "Nunito", fontSize: "20px", fontStyle: "900", color: "#dffaff" }).setOrigin(.5);
        button.on("pointerdown", () => { this.mobileInput[key] = true; });
        button.on("pointerup", () => { this.mobileInput[key] = false; });
        button.on("pointerout", () => { this.mobileInput[key] = false; });
      };
      addTouchButton(760, "◀", "left");
      addTouchButton(820, "▶", "right");
      addTouchButton(900, "↑", "jump");
      this.input.on("pointerup", () => {
        this.mobileInput.left = false;
        this.mobileInput.right = false;
        this.mobileInput.jump = false;
      });
    }
    this.levelComplete = false;
    this.add.text(48, 565, "A / D или ← / →  ДВИЖЕНИЕ     SPACE / W / ↑  ПРЫЖОК", { fontFamily: "Nunito", fontSize: "12px", fontStyle: "800", color: "#9ca8d8" });
    this.add.text(510, 565, "ПЕРЕТАЩИ ЛАМПУ МЫШЬЮ", { fontFamily: "Nunito", fontSize: "12px", fontStyle: "900", color: "#65eaff" }).setOrigin(.5);
    this.message = this.add.text(480, 135, "Найди положение света, чтобы тень стала мостом", { fontFamily: "Nunito", fontSize: "15px", fontStyle: "800", color: "#a9f5ff", backgroundColor: "#101631aa", padding: { x: 14, y: 9 } }).setOrigin(.5);
    this.add.text(480, 170, "НАПРАВЬ СВЕТ НА КРИСТАЛЛ, ЧТОБЫ СПРОЕЦИРОВАТЬ ТЕНЬ", { fontFamily: "Nunito", fontSize: "10px", fontStyle: "900", color: "#707da9", letterSpacing: 2 }).setOrigin(.5);
    this.zone = this.add.circle(140, 200, 52).setStrokeStyle(2, 0x61eaff, .3).setFillStyle(0x61eaff, .035);
    this.tweens.add({ targets: this.zone, alpha: { from: .35, to: .9 }, duration: 900, yoyo: true, repeat: -1 });
    this.zone.setPosition(140, 200);
    this.add.text(140, 270, "ЗОНА СВЕТА", { fontFamily: "Nunito", fontSize: "10px", fontStyle: "900", color: "#5bdff5" }).setOrigin(.5);

    this.physics.world.setBounds(0, 0, W, H);
    this.updateBridge();
  }

  updateBridge() {
    const shadow = ShadowProjection.calculate({
      lightX: this.lamp.x,
      lightY: this.lamp.y,
      obstacle: this.occluder,
      groundY: 496,
      gapStart: 400,
      gapEnd: 620
    });

    this.shadowShape.clear();
    this.lightRays.clear();
    if (shadow.polygon.length) {
      const rayLeft = shadow.projectedLeft;
      const rayRight = shadow.projectedRight;
      this.lightRays.lineStyle(2, 0x72eaff, .38);
      this.lightRays.beginPath();
      this.lightRays.moveTo(this.lamp.x, this.lamp.y);
      this.lightRays.lineTo(this.occluder.x, this.occluder.y);
      this.lightRays.lineTo(rayLeft, 496);
      this.lightRays.moveTo(this.lamp.x, this.lamp.y);
      this.lightRays.lineTo(this.occluder.x + this.occluder.width, this.occluder.y);
      this.lightRays.lineTo(rayRight, 496);
      this.lightRays.strokePath();
      this.shadowShape.fillStyle(0x48dfff, shadow.active ? .34 : .10);
      this.shadowShape.fillPoints(shadow.polygon.map(p => new Phaser.Geom.Point(p.x, p.y)), true);
      this.shadowShape.lineStyle(2, 0x6feaff, shadow.active ? .7 : .18);
      this.shadowShape.strokePoints(shadow.polygon.map(p => new Phaser.Geom.Point(p.x, p.y)), true);
    }

    const active = shadow.active;
    if (active) {
      this.bridge.setPosition(shadow.x + shadow.width / 2, 496);
      this.bridge.setSize(shadow.width, 13);
      this.bridge.body.setSize(shadow.width, 13);
      this.bridge.body.updateFromGameObject();
    }
    this.bridgeActive = active;
    this.bridge.body.enable = active;
    this.bridge.setAlpha(active ? 1 : .12);
    this.bridgeGlow.setPosition(active ? shadow.x + shadow.width / 2 : 510, 496);
    this.bridgeGlow.setSize(active ? shadow.width : 220, 13);
    this.bridgeGlow.setAlpha(active ? .65 : .08);
    this.message.setText(active ? "Тень рассчитана по лучам света! Перейди через пропасть." : "Измени угол света: тень должна накрыть разрыв");
    this.message.setColor(active ? "#a5ffdf" : "#a9f5ff");
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
      if (this.levelComplete) this.scene.start("MenuScene");
      else this.scene.restart();
      return;
    }
    if (this.levelComplete) return;
    const left = this.keys.A.isDown || this.keys.LEFT.isDown || this.mobileInput.left;
    const right = this.keys.D.isDown || this.keys.RIGHT.isDown || this.mobileInput.right;
    this.player.setVelocityX(left ? -230 : right ? 230 : 0);
    if ((Phaser.Input.Keyboard.JustDown(this.keys.W) || Phaser.Input.Keyboard.JustDown(this.keys.UP) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || this.mobileInput.jump) && this.player.body.blocked.down) {
      this.player.setVelocityY(-430);
      this.mobileInput.jump = false;
    }
    const vx = this.player.body.velocity.x;
    const vy = this.player.body.velocity.y;
    const grounded = this.player.body.blocked.down || this.player.body.touching.down;
    const facing = vx < -8 ? -1 : vx > 8 ? 1 : (this.facing || 1);
    this.facing = facing;

    // Readable state animation: idle breathing, run bounce, jump stretch and landing squash.
    if (grounded && !this.wasGrounded) this.landSquash = 1;
    this.wasGrounded = grounded;
    this.landSquash = Phaser.Math.Linear(this.landSquash, 0, .22);
    const moving = grounded && Math.abs(vx) > 12;
    const bob = grounded ? (moving ? Math.abs(Math.sin(this.time.now / 72)) * 3 : Math.sin(this.time.now / 260) * 2) : 0;
    const squashX = grounded ? (moving ? 1 + this.landSquash * .10 : 1 + this.landSquash * .16) : .91;
    const squashY = grounded ? (moving ? 1 - this.landSquash * .08 : 1 - this.landSquash * .12) : 1.13;
    this.playerVisual.setPosition(this.player.x, this.player.y + bob);
    this.playerVisual.setScale(facing, 1);
    this.arzonSprite.setPosition(0, -9 + bob * .25);
    this.arzonSprite.setScale(this.arzonBaseScaleX * squashX, this.arzonBaseScaleY * squashY);
    // Gentle flame sway gives the spirit a living silhouette during every movement state.
    this.arzonSprite.angle = grounded
      ? Math.sin(this.time.now / (moving ? 95 : 310)) * (moving ? 2.4 : 1.2)
      : Phaser.Math.Clamp(vx / 230, -1, 1) * 4;

    const companionTargetX = this.player.x - facing * 68;
    const companionTargetY = this.player.y + (grounded ? 8 : 20);
    this.pushi.x = Phaser.Math.Linear(this.pushi.x, companionTargetX, .09);
    this.pushi.y = Phaser.Math.Linear(this.pushi.y, companionTargetY + Math.sin(this.time.now / 190) * 3, .10);
    this.pushi.flipX = facing < 0;
    const companionBob = Math.sin(this.time.now / 145) * .035;
    this.pushi.setScale(this.pushiBaseScaleX * (1 + companionBob), this.pushiBaseScaleY * (1 - companionBob));
    this.pushi.angle = Math.sin(this.time.now / 330) * 2.2;
    this.pushiAura.setPosition(this.pushi.x, this.pushi.y + 4);
    this.pushiShadow.setPosition(this.pushi.x, 535);
    this.pushiShadow.setScale(grounded ? 1 : .72, 1);
    if (this.player.x > 790 && this.player.y > 390 && this.bridgeActive) {
      this.levelComplete = true;
      this.player.setVelocity(0, 0);
      const panel = this.add.container(480, 300).setDepth(30);
      panel.add(this.add.rectangle(0, 0, 440, 220, 0x0b102d, .97).setStrokeStyle(2, 0x8b7aff, 1));
      panel.add(this.add.text(0, -65, "ПРОБУЖДЕНИЕ ЗАВЕРШЕНО", { fontFamily: "Nunito", fontSize: "24px", fontStyle: "900", color: "#c9faff" }).setOrigin(.5));
      panel.add(this.add.text(0, -20, "Арзон нашёл первую дорогу из света.\nНо Пуши помнит, что этот путь уже был...", { fontFamily: "Nunito", fontSize: "15px", fontStyle: "700", color: "#aeb9e8", align: "center", lineSpacing: 8 }).setOrigin(.5));
      const menuButton = this.add.text(0, 65, "ВЕРНУТЬСЯ В МЕНЮ", { fontFamily: "Nunito", fontSize: "15px", fontStyle: "900", color: "#ffffff", backgroundColor: "#443caa", padding: { x: 22, y: 12 } }).setOrigin(.5).setInteractive({ useHandCursor: true });
      menuButton.on("pointerover", () => menuButton.setStyle({ backgroundColor: "#5a62d8", color: "#d7fbff" }));
      menuButton.on("pointerout", () => menuButton.setStyle({ backgroundColor: "#443caa", color: "#ffffff" }));
      menuButton.on("pointerdown", () => this.scene.start("MenuScene"));
      panel.add(menuButton);
    }
  }
}