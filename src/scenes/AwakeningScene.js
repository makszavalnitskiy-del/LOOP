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

    this.platforms = this.physics.add.staticGroup();
    const leftFloor = this.add.rectangle(200, 548, 400, 104, 0x242653).setStrokeStyle(2, 0x5966b4, .8);
    const rightFloor = this.add.rectangle(790, 548, 340, 104, 0x242653).setStrokeStyle(2, 0x5966b4, .8);
    this.physics.add.existing(leftFloor, true);
    this.physics.add.existing(rightFloor, true);
    this.platforms.add(leftFloor);
    this.platforms.add(rightFloor);

    // Shadow bridge, activated by positioning the lamp in its marked zone.
    this.bridgeGlow = this.add.rectangle(510, 496, 220, 13, 0x3ceaff, .18);
    this.bridge = this.add.rectangle(510, 496, 220, 13, 0x68eaff, .08).setStrokeStyle(2, 0x70eaff, .15);
    this.physics.add.existing(this.bridge, true);
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
    this.physics.add.collider(this.player, this.platforms);
    this.bridgeCollider = this.physics.add.collider(this.player, this.bridge);
    this.playerVisual = this.add.container(this.player.x, this.player.y);
    const flame = this.add.graphics();
    flame.fillStyle(0x43dfff, .22); flame.fillEllipse(0, 2, 54, 60);
    flame.fillStyle(0x54dfff, 1); flame.fillEllipse(0, 0, 30, 38);
    flame.fillStyle(0x8df4ff, .95); flame.fillEllipse(0, 7, 18, 24);
    flame.fillStyle(0x26316e, 1); flame.fillCircle(-6, -3, 3); flame.fillCircle(6, -3, 3);
    flame.fillStyle(0xd9fbff, 1); flame.fillCircle(0, 15, 4);
    this.playerVisual.add(flame);

    // Pushi, the little fox-cat companion.
    this.pushi = this.add.container(65, 490);
    const pet = this.add.graphics();
    pet.fillStyle(0x8c55d8, .22); pet.fillEllipse(0, 5, 45, 30);
    pet.fillStyle(0x35205f, 1); pet.fillEllipse(0, 0, 30, 24);
    pet.fillTriangle(-12, -8, -10, -25, 0, -10);
    pet.fillTriangle(4, -10, 15, -25, 15, -5);
    pet.fillStyle(0xd98cff, 1); pet.fillCircle(-6, -2, 2); pet.fillCircle(7, -2, 2);
    pet.lineStyle(5, 0xb66cff, 1); pet.beginPath(); pet.arc(17, 5, 14, -.8, .8, false); pet.strokePath();
    pet.lineStyle(2, 0x6cf3ff, .9); pet.strokeCircle(29, 8, 5);
    this.pushi.add(pet);

    // Draggable lamp and its light pool.
    this.lampGlow = this.add.circle(180, 350, 78, 0x55dfff, .09);
    this.lamp = this.add.container(180, 350);
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
    this.add.text(48, 565, "A / D или ← / →  ДВИЖЕНИЕ     SPACE / W / ↑  ПРЫЖОК", { fontFamily: "Nunito", fontSize: "12px", fontStyle: "800", color: "#9ca8d8" });
    this.add.text(510, 565, "ПЕРЕТАЩИ ЛАМПУ МЫШЬЮ", { fontFamily: "Nunito", fontSize: "12px", fontStyle: "900", color: "#65eaff" }).setOrigin(.5);
    this.message = this.add.text(480, 135, "Найди положение света, чтобы тень стала мостом", { fontFamily: "Nunito", fontSize: "15px", fontStyle: "800", color: "#a9f5ff", backgroundColor: "#101631aa", padding: { x: 14, y: 9 } }).setOrigin(.5);
    this.add.text(480, 170, "ЛАМПА ДОЛЖНА ОКАЗАТЬСЯ В СВЕТЯЩЕЙСЯ ЗОНЕ", { fontFamily: "Nunito", fontSize: "10px", fontStyle: "900", color: "#707da9", letterSpacing: 2 }).setOrigin(.5);
    this.zone = this.add.circle(315, 350, 52).setStrokeStyle(2, 0x61eaff, .3).setFillStyle(0x61eaff, .035);
    this.tweens.add({ targets: this.zone, alpha: { from: .35, to: .9 }, duration: 900, yoyo: true, repeat: -1 });
    this.add.text(315, 420, "ЗОНА СВЕТА", { fontFamily: "Nunito", fontSize: "10px", fontStyle: "900", color: "#5bdff5" }).setOrigin(.5);

    this.physics.world.setBounds(0, 0, W, H);
    this.updateBridge();
  }

  updateBridge() {
    const active = this.lamp.x > 260 && this.lamp.x < 375 && this.lamp.y > 295 && this.lamp.y < 405;
    if (active === this.bridgeActive) return;
    this.bridgeActive = active;
    this.bridge.body.enable = active;
    this.bridge.setAlpha(active ? 1 : .12);
    this.bridgeGlow.setAlpha(active ? .65 : .08);
    this.message.setText(active ? "Тень обрела форму! Перейди через пропасть." : "Найди положение света, чтобы тень стала мостом");
    this.message.setColor(active ? "#a5ffdf" : "#a9f5ff");
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) { this.scene.restart(); return; }
    const left = this.keys.A.isDown || this.keys.LEFT.isDown;
    const right = this.keys.D.isDown || this.keys.RIGHT.isDown;
    this.player.setVelocityX(left ? -230 : right ? 230 : 0);
    if ((Phaser.Input.Keyboard.JustDown(this.keys.W) || Phaser.Input.Keyboard.JustDown(this.keys.UP) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) && this.player.body.blocked.down) {
      this.player.setVelocityY(-430);
    }
    this.playerVisual.setPosition(this.player.x, this.player.y);
    this.playerVisual.setScale(this.player.body.velocity.x < 0 ? -1 : 1, 1);
    this.pushi.x = Phaser.Math.Linear(this.pushi.x, this.player.x - 48, .08);
    this.pushi.y = 490 + Math.sin(this.time.now / 220) * 4;
    if (this.player.x > 790 && this.player.y > 390 && this.bridgeActive) {
      this.message.setText("ПРОБУЖДЕНИЕ ЗАВЕРШЕНО  •  ПРОДОЛЖЕНИЕ СКОРО");
      this.message.setColor("#d8c7ff");
      this.player.setVelocity(0, 0);
    }
  }
}