import { BootScene } from "./scenes/BootScene.js";
import { MenuScene } from "./scenes/MenuScene.js";
import { AwakeningScene } from "./scenes/AwakeningScene.js";
import { GameScene } from "./scenes/GameScene.js";
import { YandexSDK } from "./platform/YandexSDK.js";
import { SoundFX } from "./audio/SoundFX.js";

const GAME_WIDTH = 960;
const GAME_HEIGHT = 600;
const loadingScreen = document.getElementById("loading-screen");
const loadingProgress = document.getElementById("loading-progress");
const loadingLabel = document.getElementById("loading-label");

function updateLoadingProgress(value) {
  if (loadingProgress) {
    loadingProgress.style.width = `${Math.max(0, Math.min(1, value)) * 100}%`;
  }
}

function setLoadingLabel(value) {
  if (loadingLabel) loadingLabel.textContent = value;
}

function hideLoadingScreen() {
  if (loadingScreen) loadingScreen.classList.add("is-hidden");
}

function waitForFonts() {
  if (!document.fonts?.ready) return Promise.resolve();
  return document.fonts.ready.catch(error => {
    console.warn("[LOOP] Font loading failed; using fallback fonts.", error);
  });
}

function createGame(soundFX) {
  if (typeof Phaser === "undefined") {
    setLoadingLabel("ОШИБКА ЗАГРУЗКИ PHASER");
    throw new Error("Phaser 3.80.1 не был загружен.");
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: "#09091b",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    scale: {
      // EXPAND keeps the complete game visible while extending the logical
      // viewport to the actual container ratio (no FIT letterboxing).
      mode: Phaser.Scale.EXPAND,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      expandParent: true
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
      powerPreference: "high-performance",
      clearBeforeRender: true
    },
    input: { activePointers: 3, smoothFactor: 0 },
    physics: {
      default: "arcade",
      arcade: { debug: false, gravity: { x: 0, y: 0 }, fps: 60, fixedStep: true }
    },
    fps: { target: 60, forceSetTimeOut: false, smoothStep: true },
    audio: { disableWebAudio: true },
    scene: [BootScene, MenuScene, AwakeningScene, GameScene]
  });

  // Keep the canvas synchronized with mobile visual-viewport changes (browser
  // chrome, safe-area changes and device rotation), not only window resize.
  let resizeQueued = false;
  const refreshGameViewport = () => {
    if (resizeQueued || !game.scale) return;
    resizeQueued = true;
    window.requestAnimationFrame(() => {
      resizeQueued = false;
      game.scale.refresh();
    });
  };
  if (typeof ResizeObserver !== "undefined") {
    const viewportObserver = new ResizeObserver(refreshGameViewport);
    viewportObserver.observe(document.getElementById("game-shell"));
    game.events.once("destroy", () => viewportObserver.disconnect());
  }
  window.visualViewport?.addEventListener("resize", refreshGameViewport, { passive: true });
  window.addEventListener("orientationchange", refreshGameViewport, { passive: true });
  window.addEventListener("resize", refreshGameViewport, { passive: true });
  game.events.once("destroy", () => {
    window.visualViewport?.removeEventListener("resize", refreshGameViewport);
    window.removeEventListener("orientationchange", refreshGameViewport);
    window.removeEventListener("resize", refreshGameViewport);
  });
  refreshGameViewport();

  // Phaser's registry is shared by every scene and survives scene transitions.
  game.registry.set("YandexSDK", YandexSDK);
  game.registry.set("SoundFX", soundFX);
  game.registry.set("soundFX", soundFX);

  game.events.once("ready", () => {
    updateLoadingProgress(1);
    setLoadingLabel("МИР ГОТОВ");
  });

  window.addEventListener("error", event => {
    if (event.error) console.error("[LOOP] Runtime error:", event.error);
  });
  window.addEventListener("unhandledrejection", event => {
    console.error("[LOOP] Unhandled promise rejection:", event.reason);
  });

  return game;
}

async function boot() {
  try {
    updateLoadingProgress(0.08);
    setLoadingLabel("ЗАГРУЗКА ШРИФТОВ И ИГРОВОГО SDK...");

    // Both prerequisites must settle before Phaser starts.
    const [, sdk] = await Promise.all([
      waitForFonts(),
      YandexSDK.init()
    ]);

    updateLoadingProgress(0.55);
    setLoadingLabel("ЗАПУСК ИГРОВОГО ДВИЖКА...");

    const soundFX = new SoundFX();
    const game = createGame(soundFX);
    game.registry.set("YandexSDK", sdk);
    updateLoadingProgress(0.72);
  } catch (error) {
    console.error("[LOOP] Failed to initialize:", error);
    setLoadingLabel("НЕ УДАЛОСЬ ЗАПУСТИТЬ ИГРУ");
  }
}

boot();
