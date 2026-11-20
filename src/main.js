import { BootScene } from "./scenes/BootScene.js";
import { MenuScene } from "./scenes/MenuScene.js";
import { AwakeningScene } from "./scenes/AwakeningScene.js";

const GAME_WIDTH = 960;
const GAME_HEIGHT = 600;
const loadingScreen = document.getElementById("loading-screen");
const loadingProgress = document.getElementById("loading-progress");
const loadingLabel = document.getElementById("loading-label");

function updateLoadingProgress(value) {
  if (loadingProgress) loadingProgress.style.width = `${Math.max(0, Math.min(1, value)) * 100}%`;
}
function hideLoadingScreen() {
  if (loadingScreen) loadingScreen.classList.add("is-hidden");
}
function waitForFonts() {
  if (!document.fonts?.ready) return Promise.resolve();
  return Promise.race([
    document.fonts.ready.catch(() => undefined),
    new Promise(resolve => window.setTimeout(resolve, 3500))
  ]);
}
function createGame() {
  if (typeof Phaser === "undefined") {
    if (loadingLabel) loadingLabel.textContent = "ОШИБКА ЗАГРУЗКИ PHASER";
    throw new Error("Phaser 3.80.1 не был загружен.");
  }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: "#09091b",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      expandParent: false
    },
    render: { antialias: true, pixelArt: false, roundPixels: false, powerPreference: "high-performance", clearBeforeRender: true },
    input: { activePointers: 3, smoothFactor: 0 },
    physics: { default: "arcade", arcade: { debug: false, gravity: { x: 0, y: 0 }, fps: 60, fixedStep: true } },
    fps: { target: 60, forceSetTimeOut: false, smoothStep: true },
    audio: { disableWebAudio: true },
    scene: [BootScene, MenuScene, AwakeningScene]
  });
  game.events.once("ready", () => {
    updateLoadingProgress(1);
    if (loadingLabel) loadingLabel.textContent = "МИР ГОТОВ";
    window.setTimeout(hideLoadingScreen, 180);
  });
  window.addEventListener("error", event => {
    if (event.error) console.error("[LOOP] Runtime error:", event.error);
  });
  window.addEventListener("unhandledrejection", event => console.error("[LOOP] Unhandled promise rejection:", event.reason));
  return game;
}
async function boot() {
  try {
    updateLoadingProgress(.15);
    if (loadingLabel) loadingLabel.textContent = "ЗАГРУЗКА ШРИФТОВ...";
    await waitForFonts();
    updateLoadingProgress(.55);
    if (loadingLabel) loadingLabel.textContent = "ЗАПУСК ИГРОВОГО ДВИЖКА...";
    createGame();
  } catch (error) {
    console.error("[LOOP] Failed to initialize:", error);
    if (loadingLabel) loadingLabel.textContent = "НЕ УДАЛОСЬ ЗАПУСТИТЬ ИГРУ";
  }
}
boot();