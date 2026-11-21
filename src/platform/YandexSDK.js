const STORAGE_KEY = "loop-progress-v1";
const LEADERBOARD_NAME = "loop_total_time";
const INTERSTITIAL_COOLDOWN_MS = 90_000;

function getStorage() {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {}
  return null;
}

function parseJSON(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function mergeProgress(localData = {}, cloudData = {}) {
  const local = localData && typeof localData === "object" ? localData : {};
  const cloud = cloudData && typeof cloudData === "object" ? cloudData : {};
  const completed = new Set([...(local.completedLevels ?? []), ...(cloud.completedLevels ?? [])]);
  const stars = { ...(cloud.stars ?? {}), ...(local.stars ?? {}) };
  for (const [level, value] of Object.entries(cloud.stars ?? {})) {
    stars[level] = Math.max(Number(local.stars?.[level] ?? 0), Number(value ?? 0));
  }
  for (const [level, value] of Object.entries(local.stars ?? {})) {
    stars[level] = Math.max(Number(value ?? 0), Number(cloud.stars?.[level] ?? 0));
  }
  const bestTimes = { ...(cloud.bestTimes ?? {}), ...(local.bestTimes ?? {}) };
  for (const [level, value] of Object.entries({ ...(cloud.bestTimes ?? {}), ...(local.bestTimes ?? {}) })) {
    const a = Number(local.bestTimes?.[level]);
    const b = Number(cloud.bestTimes?.[level]);
    const valid = [a, b].filter(Number.isFinite);
    if (valid.length) bestTimes[level] = Math.min(...valid);
    else delete bestTimes[level];
  }
  return {
    ...cloud,
    ...local,
    completedLevels: [...completed].sort((a, b) => Number(a) - Number(b)),
    stars,
    bestTimes,
    unlockedLevel: Math.max(1, Number(local.unlockedLevel ?? 1), Number(cloud.unlockedLevel ?? 1)),
    totalTime: Math.max(0, Number(local.totalTime ?? 0), Number(cloud.totalTime ?? 0))
  };
}

class YandexSDKManager {
  constructor() {
    this.sdk = null;
    this.player = null;
    this.leaderboards = null;
    this.initialized = false;
    this.mock = true;
    this.readyCalled = false;
    this.lastInterstitialAt = 0;
    this.interstitialPromise = null;
    this.gameplayActive = false;
    this.audioPauseHandler = null;
    this.audioResumeHandler = null;
    this.progress = {};
  }

  async init() {
    if (this.initialized) return this;
    try {
      const host = typeof window !== "undefined" ? window : null;
      if (host?.YaGames?.init) {
        this.sdk = await host.YaGames.init();
        this.mock = false;
        try { this.player = await this.sdk.getPlayer({ scopes: false }); } catch { this.player = null; }
        this.leaderboards = this.sdk.leaderboards ?? null;
      }
    } catch (error) {
      this.sdk = null;
      this.player = null;
      this.leaderboards = null;
      this.mock = true;
      if (typeof console !== "undefined") console.warn("[LOOP] Yandex SDK unavailable; local Mock mode enabled.", error);
    }
    this.initialized = true;
    await this.loadProgress();
    return this;
  }

  async ready() {
    if (this.readyCalled) return false;
    this.readyCalled = true;
    try { await this.sdk?.features?.LoadingAPI?.ready?.(); } catch (error) {
      if (typeof console !== "undefined") console.warn("[LOOP] LoadingAPI.ready failed.", error);
    }
    return true;
  }

  setAudioHandlers(pause, resume) {
    this.audioPauseHandler = typeof pause === "function" ? pause : null;
    this.audioResumeHandler = typeof resume === "function" ? resume : null;
  }

  async gameplayStart() {
    if (this.gameplayActive) return false;
    this.gameplayActive = true;
    try { await this.sdk?.features?.GameplayAPI?.start?.(); } catch {}
    return true;
  }

  async gameplayStop() {
    if (!this.gameplayActive) return false;
    this.gameplayActive = false;
    try { await this.sdk?.features?.GameplayAPI?.stop?.(); } catch {}
    return true;
  }

  async showInterstitial(reason = "level-transition", options = {}) {
    if (this.mock || !this.sdk?.adv?.showFullscreenAdv) return false;
    if (this.interstitialPromise) return this.interstitialPromise;
    if (!options.force && Date.now() - this.lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS) return false;
    this.lastInterstitialAt = Date.now();
    const resumeGameplay = this.gameplayActive;
    await this.gameplayStop();
    this.audioPauseHandler?.();
    this.interstitialPromise = new Promise(resolve => {
      let finished = false;
      const finish = shown => {
        if (finished) return;
        finished = true;
        this.audioResumeHandler?.();
        this.interstitialPromise = null;
        if (resumeGameplay && reason !== "gameplay-ended") this.gameplayStart();
        resolve(Boolean(shown));
      };
      try {
        this.sdk.adv.showFullscreenAdv({
          callbacks: {
            onOpen: () => this.audioPauseHandler?.(),
            onClose: () => finish(true),
            onError: () => finish(false)
          }
        });
      } catch { finish(false); }
    });
    return this.interstitialPromise;
  }

  async showRewarded(onReward) {
    if (this.mock || !this.sdk?.adv?.showRewardedVideo) {
      if (typeof onReward === "function") onReward();
      return true;
    }
    const resumeGameplay = this.gameplayActive;
    await this.gameplayStop();
    this.audioPauseHandler?.();
    return new Promise(resolve => {
      let rewarded = false;
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        this.audioResumeHandler?.();
        if (resumeGameplay) this.gameplayStart();
        resolve(rewarded);
      };
      try {
        this.sdk.adv.showRewardedVideo({
          callbacks: {
            onOpen: () => this.audioPauseHandler?.(),
            onRewarded: () => {
              if (rewarded) return;
              rewarded = true;
              if (typeof onReward === "function") onReward();
            },
            onClose: finish,
            onError: finish
          }
        });
      } catch { finish(); }
    });
  }

  async loadProgress() {
    const storage = getStorage();
    const local = parseJSON(storage?.getItem(STORAGE_KEY), {});
    let cloud = {};
    if (this.player?.getData) {
      try {
        const response = await this.player.getData([STORAGE_KEY], { scopes: false });
        cloud = response?.[STORAGE_KEY] ?? {};
      } catch {}
    }
    this.progress = mergeProgress(local, cloud);
    return clone(this.progress);
  }

  async saveProgress(data = {}) {
    // Incoming data is a patch: it must override existing scalar fields and per-level counters.
    // mergeProgress still keeps stars monotonic and best times minimal across both sources.
    const merged = mergeProgress(data, this.progress);
    this.progress = merged;
    try { getStorage()?.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
    if (this.player?.setData) {
      try { await this.player.setData({ [STORAGE_KEY]: merged }, true); } catch {}
    }
    return clone(merged);
  }

  async loadSettings() {
    const settings = parseJSON(getStorage()?.getItem("loop-settings-v1"), {});
    return settings && typeof settings === "object" ? clone(settings) : {};
  }

  async saveSettings(settings = {}) {
    const safeSettings = settings && typeof settings === "object" ? settings : {};
    try { getStorage()?.setItem("loop-settings-v1", JSON.stringify(safeSettings)); } catch {}
    return clone(safeSettings);
  }

  async submitLeaderboardScore(totalTimeSeconds) {
    const score = Math.max(0, Math.round(Number(totalTimeSeconds) || 0));
    if (this.mock || !this.leaderboards?.setScore) return false;
    try {
      await this.leaderboards.setScore(LEADERBOARD_NAME, score);
      return true;
    } catch { return false; }
  }

  async canReview() {
    try { return Boolean(await this.sdk?.feedback?.canReview?.()); } catch { return false; }
  }

  async requestReview() {
    try {
      if (!this.sdk?.feedback?.requestReview) return false;
      await this.sdk.feedback.requestReview();
      return true;
    } catch { return false; }
  }

  getLanguage() {
    return this.sdk?.environment?.i18n?.lang ?? this.sdk?.environment?.i18n?.tld ?? null;
  }

  get isMock() {
    return this.mock;
  }
}

export const YandexSDK = new YandexSDKManager();
export default YandexSDK;
