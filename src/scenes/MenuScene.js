export class MenuScene extends Phaser.Scene {
  constructor() { super("MenuScene"); }
  create() {
    const { width: w, height: h } = this.scale;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x09091b, 0x111333, 0x171044, 0x080817, 1);
    bg.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = Phaser.Math.Between(0, w), y = Phaser.Math.Between(0, h);
      this.add.circle(x, y, Phaser.Math.FloatBetween(0.6, 2), 0x8b9cff, Phaser.Math.FloatBetween(.15, .6));
    }
    const glow = this.add.circle(w / 2, 190, 95, 0x347cff, .08);
    this.tweens.add({ targets: glow, alpha: .18, scale: 1.25, duration: 2200, yoyo: true, repeat: -1 });
    this.add.text(w / 2, 145, "L O O P", { fontFamily: "Nunito", fontSize: "76px", fontStyle: "900", color: "#e9f7ff", stroke: "#617aff", strokeThickness: 2 }).setOrigin(.5);
    this.add.text(w / 2, 215, "ПОСЛЕДНИЙ ЦИКЛ", { fontFamily: "Nunito", fontSize: "17px", fontStyle: "800", color: "#8ca5ff", letterSpacing: 7 }).setOrigin(.5);
    const arzon = this.add.image(w / 2 - 105, 315, "arzon").setDisplaySize(112, 112);
    const pushi = this.add.image(w / 2 + 105, 322, "pushi").setDisplaySize(108, 108);
    this.tweens.add({ targets: arzon, y: 304, duration: 1050, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: pushi, y: 331, angle: { from: -3, to: 3 }, duration: 1250, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.add.text(w / 2 - 105, 385, "АРЗОН", { fontFamily: "Nunito", fontSize: "11px", fontStyle: "900", color: "#82eaff", letterSpacing: 2 }).setOrigin(.5);
    this.add.text(w / 2 + 105, 385, "ПУШИ", { fontFamily: "Nunito", fontSize: "11px", fontStyle: "900", color: "#c29aff", letterSpacing: 2 }).setOrigin(.5);
    const start = this.add.text(w / 2, 445, "НАЧАТЬ ПУТЕШЕСТВИЕ", { fontFamily: "Nunito", fontSize: "20px", fontStyle: "900", color: "#ffffff", backgroundColor: "#3434a8", padding: { x: 28, y: 16 } }).setOrigin(.5).setInteractive({ useHandCursor: true });
    start.on("pointerover", () => start.setStyle({ backgroundColor: "#4c55d5", color: "#bffaff" }));
    start.on("pointerout", () => start.setStyle({ backgroundColor: "#3434a8", color: "#ffffff" }));
    start.on("pointerdown", () => this.scene.start("AwakeningScene"));
    this.add.text(w / 2, 525, "ИГРА О СВЕТЕ, ТЕНЯХ И ПАМЯТИ", { fontFamily: "Nunito", fontSize: "12px", fontStyle: "700", color: "#747cae", letterSpacing: 3 }).setOrigin(.5);
  }
}