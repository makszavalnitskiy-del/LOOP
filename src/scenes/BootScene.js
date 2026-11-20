export class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }
  preload() {
    this.load.svg("arzon", "assets/characters/arzon.svg", { width: 256, height: 256 });
    this.load.svg("pushi", "assets/characters/pushi.svg", { width: 256, height: 256 });
  }
  create() { this.scene.start("MenuScene"); }
}