import { BootScene } from "./scenes/BootScene.js";
import { MenuScene } from "./scenes/MenuScene.js";
import { AwakeningScene } from "./scenes/AwakeningScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#09091b",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 600
  },
  render: { antialias: true, pixelArt: false, roundPixels: false },
  physics: { default: "arcade", arcade: { debug: false } },
  scene: [BootScene, MenuScene, AwakeningScene]
};

new Phaser.Game(config);