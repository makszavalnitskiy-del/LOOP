export const LEVELS = [
  {
    id: 1, key: "awakening", title: "Пробуждение", subtitle: "Первый источник света",
    description: "Найди положение лампы, при котором тень соединит берега.",
    lore: "Арзон проснулся в руинах Цикла. Пуши помнит дорогу, но не помнит, кто зажёг первый свет.",
    world: { width: 1600, height: 600, background: 0x09091b, groundY: 496 },
    platforms: [
      { id: "start-ground", x: 0, y: 496, width: 400, height: 104 },
      { id: "end-ground", x: 620, y: 496, width: 980, height: 104 }
    ],
    gaps: [{ id: "first-gap", x: 400, y: 496, width: 220, height: 104 }],
    obstacles: [{
      id: "crystal-1", type: "crystal", x: 280, y: 360, width: 120, height: 60,
      color: 0x79eaff, movable: false, patrol: null, bridgeId: "bridge-1"
    }],
    sensors: [],
    lampBounds: { minX: 70, maxX: 360, minY: 100, maxY: 330 },
    lampStart: { x: 140, y: 200 }, playerStart: { x: 100, y: 450 },
    portal: { x: 1450, y: 430, width: 56, height: 66 },
    texts: {
      intro: "ПРОБУЖДЕНИЕ", objective: "СОЕДИНИ ТЕНЬЮ ДВА БЕРЕГА",
      crystalHint: "СВЕТ МЕНЯЕТ ФОРМУ ТЕНИ", completion: "ПЕРВЫЙ ЦИКЛ ЗАВЕРШЁН"
    },
    mechanics: { lampDraggable: true, lampLimited: true, requireFullBridge: true, movingObstacles: false, multipleCrystals: false }
  },
  {
    id: 2, key: "double-refraction", title: "Двойное преломление", subtitle: "Две тени — один путь",
    description: "Используй оба кристалла, чтобы построить два участка моста.",
    lore: "Пуши узнаёт отражение в каждом кристалле. Арзон понимает: Цикл повторяет не события, а их тени.",
    world: { width: 1900, height: 600, background: 0x0a0a20, groundY: 496 },
    platforms: [
      { id: "start-ground", x: 0, y: 496, width: 340, height: 104 },
      { id: "middle-ground", x: 550, y: 496, width: 210, height: 104 },
      { id: "end-ground", x: 980, y: 496, width: 920, height: 104 }
    ],
    gaps: [
      { id: "first-gap", x: 340, y: 496, width: 210, height: 104 },
      { id: "second-gap", x: 760, y: 496, width: 220, height: 104 }
    ],
    obstacles: [
      { id: "crystal-1", type: "crystal", x: 230, y: 350, width: 110, height: 66, color: 0x70eaff, movable: false, patrol: null, bridgeId: "bridge-1" },
      { id: "crystal-2", type: "crystal", x: 650, y: 335, width: 110, height: 72, color: 0xc18cff, movable: false, patrol: null, bridgeId: "bridge-2" },
      { id: "barrier-1", type: "barrier", x: 420, y: 300, width: 28, height: 196, color: 0x9a6cff, movable: true, patrol: { axis: "y", min: 250, max: 385, speed: 58, start: 300, direction: 1 } }
    ],
    sensors: [],
    lampBounds: { minX: 65, maxX: 700, minY: 90, maxY: 330 },
    lampStart: { x: 125, y: 190 }, playerStart: { x: 90, y: 450 },
    portal: { x: 1740, y: 430, width: 56, height: 66 },
    texts: {
      intro: "ДВОЙНОЕ ПРЕЛОМЛЕНИЕ", objective: "СОЗДАЙ ДВА УЧАСТКА МОСТА",
      crystalHint: "КАЖДЫЙ КРИСТАЛЛ СОЗДАЁТ СВОЮ ТЕНЬ",
      barrierHint: "БАРЬЕР ДВИЖЕТСЯ ПО ВЕРТИКАЛИ", completion: "ДВА ЛУЧА. ОДИН ПУТЬ."
    },
    mechanics: { lampDraggable: true, lampLimited: true, requireFullBridge: true, movingObstacles: true, multipleCrystals: true }
  },
  {
    id: 3, key: "pendulum-of-cycle", title: "Маятник цикла", subtitle: "Поймай правильный момент",
    description: "Кристаллы движутся по траекториям. Найди точку, в которой их тени соединят берега.",
    lore: "Маятник стирает следы прошлого. Пуши идёт рядом с Арзоном, пока последний свет не погас.",
    world: { width: 2200, height: 600, background: 0x0b0a23, groundY: 496 },
    platforms: [
      { id: "start-ground", x: 0, y: 496, width: 390, height: 104 },
      { id: "middle-ground", x: 650, y: 496, width: 190, height: 104 },
      { id: "end-ground", x: 1120, y: 496, width: 1080, height: 104 }
    ],
    gaps: [
      { id: "first-gap", x: 390, y: 496, width: 260, height: 104 },
      { id: "second-gap", x: 840, y: 496, width: 280, height: 104 }
    ],
    obstacles: [
      { id: "crystal-1", type: "crystal", x: 280, y: 340, width: 100, height: 68, color: 0x70eaff, movable: true, patrol: { axis: "x", min: 230, max: 360, speed: 72, start: 280, direction: 1 }, bridgeId: "bridge-1" },
      { id: "crystal-2", type: "crystal", x: 750, y: 325, width: 100, height: 74, color: 0xc18cff, movable: true, patrol: { axis: "y", min: 285, max: 375, speed: 54, start: 325, direction: -1 }, bridgeId: "bridge-2" },
      { id: "barrier-1", type: "barrier", x: 500, y: 275, width: 26, height: 221, color: 0x9a6cff, movable: true, patrol: { axis: "y", min: 245, max: 390, speed: 82, start: 275, direction: 1 } },
      { id: "barrier-2", type: "barrier", x: 1000, y: 290, width: 26, height: 206, color: 0x9a6cff, movable: true, patrol: { axis: "x", min: 950, max: 1060, speed: 64, start: 1000, direction: -1 } }
    ],
    sensors: [],
    lampBounds: { minX: 80, maxX: 820, minY: 100, maxY: 300 },
    lampStart: { x: 130, y: 185 }, playerStart: { x: 90, y: 450 },
    portal: { x: 2040, y: 430, width: 56, height: 66 },
    texts: {
      intro: "МАЯТНИК ЦИКЛА", objective: "ПОЙМАЙ МОМЕНТ ДЛЯ СОЗДАНИЯ МОСТА",
      crystalHint: "ПОЛОЖЕНИЕ КРИСТАЛЛА ПОСТОЯННО МЕНЯЕТСЯ",
      barrierHint: "СЛЕДИ ЗА ДВИЖЕНИЕМ ПРЕГРАД", completion: "ТЫ ВЫРВАЛСЯ ИЗ ПОСЛЕДНЕГО ЦИКЛА"
    },
    mechanics: { lampDraggable: true, lampLimited: true, requireFullBridge: true, movingObstacles: true, multipleCrystals: true, timingChallenge: true }
  },
  {
    id: 4, key: "resonance", title: "Резонанс", subtitle: "Разбуди кристалл-замок",
    description: "Удерживай тень на сенсоре, чтобы снять лазерный барьер, затем перенеси её на разрыв.",
    lore: "Кристалл услышал пламя Арзона. Пуши чувствует, что замок хранит память о предыдущем Цикле.",
    world: { width: 1900, height: 600, background: 0x0b0a24, groundY: 496 },
    platforms: [
      { id: "start-ground", x: 0, y: 496, width: 420, height: 104 },
      { id: "end-ground", x: 700, y: 496, width: 1200, height: 104 }
    ],
    gaps: [{ id: "resonance-gap", x: 420, y: 496, width: 280, height: 104 }],
    obstacles: [
      { id: "bridge-crystal", type: "crystal", x: 310, y: 345, width: 110, height: 70, color: 0x77eaff, movable: false, patrol: null, bridgeId: "bridge-1" },
      { id: "laser-barrier", type: "barrier", x: 1050, y: 390, width: 24, height: 212, color: 0xff4fd8, movable: false, patrol: null, sensorId: "sensor-lock" }
    ],
    sensors: [{ id: "sensor-lock", type: "shadow-sensor", x: 340, y: 365, width: 58, height: 58, requiredHold: 1200, targetObstacleId: "laser-barrier", color: 0x9d83ff }],
    lampBounds: { minX: 65, maxX: 390, minY: 95, maxY: 330 },
    lampStart: { x: 135, y: 185 }, playerStart: { x: 90, y: 450 },
    portal: { x: 1740, y: 430, width: 56, height: 66 },
    texts: { intro: "РЕЗОНАНС", objective: "ЗАРЯДИ СЕНСОР, ЗАТЕМ СОЕДИНИ БЕРЕГА", crystalHint: "ТЕНЬ ДОЛЖНА УДЕРЖИВАТЬСЯ НА СЕНСОРЕ", barrierHint: "ЛАЗЕРНЫЙ БАРЬЕР ЗАКРЫВАЕТ ПОРТАЛ", completion: "ЗАМОК УСЛЫШАЛ ТВОЙ СВЕТ" },
    mechanics: { lampDraggable: true, lampLimited: true, requireFullBridge: true, movingObstacles: false, multipleCrystals: false, shadowSensors: true, sensorHoldMs: 1200, laserGates: true }
  },
  {
    id: 5, key: "cascade-of-shadows", title: "Каскад теней", subtitle: "Два разрыва — два расчёта",
    description: "Настрой угол лампы для двух независимых мостов и следи за движущимся кристаллом.",
    lore: "Две тени расходятся, как воспоминания. Арзон и Пуши должны выбрать одну дорогу сквозь обе.",
    world: { width: 2300, height: 600, background: 0x0c0a27, groundY: 496 },
    platforms: [
      { id: "start-ground", x: 0, y: 496, width: 350, height: 104 },
      { id: "middle-ground", x: 590, y: 496, width: 190, height: 104 },
      { id: "end-ground", x: 1080, y: 496, width: 1220, height: 104 }
    ],
    gaps: [
      { id: "first-gap", x: 350, y: 496, width: 240, height: 104 },
      { id: "second-gap", x: 780, y: 496, width: 300, height: 104 }
    ],
    obstacles: [
      { id: "crystal-static", type: "crystal", x: 250, y: 335, width: 100, height: 70, color: 0x70eaff, movable: false, patrol: null, bridgeId: "bridge-1" },
      { id: "crystal-orbit", type: "crystal", x: 865, y: 315, width: 100, height: 72, color: 0xc18cff, movable: true, patrol: { axis: "y", min: 275, max: 375, speed: 68, start: 315, direction: 1 }, bridgeId: "bridge-2" }
    ],
    sensors: [],
    lampBounds: { minX: 70, maxX: 980, minY: 85, maxY: 335 },
    lampStart: { x: 140, y: 175 }, playerStart: { x: 90, y: 450 },
    portal: { x: 2140, y: 430, width: 56, height: 66 },
    texts: { intro: "КАСКАД ТЕНЕЙ", objective: "СОБЕРИ ДВА НЕЗАВИСИМЫХ МОСТА", crystalHint: "У КАЖДОГО РАЗРЫВА СВОЙ КРИСТАЛЛ", barrierHint: "ВТОРОЙ КРИСТАЛЛ ДВИЖЕТСЯ", completion: "ДВЕ ТЕНИ СТАЛИ ОДНИМ ПУТЁМ" },
    mechanics: { lampDraggable: true, lampLimited: true, requireFullBridge: true, movingObstacles: true, multipleCrystals: true, independentBridges: true }
  },
  {
    id: 6, key: "last-cycle", title: "Последний цикл", subtitle: "Свет должен выдержать",
    description: "В ограниченной зоне активируй сенсор и поймай момент, когда патрульный кристалл накроет широкую пропасть.",
    lore: "Цикл замыкается вокруг Арзона. Пуши остаётся рядом — даже если этот свет станет последним.",
    world: { width: 2600, height: 600, background: 0x0d0a2a, groundY: 496 },
    platforms: [
      { id: "start-ground", x: 0, y: 496, width: 390, height: 104 },
      { id: "middle-ground", x: 760, y: 496, width: 170, height: 104 },
      { id: "end-ground", x: 1260, y: 496, width: 1340, height: 104 }
    ],
    gaps: [
      { id: "first-gap", x: 390, y: 496, width: 370, height: 104 },
      { id: "second-gap", x: 930, y: 496, width: 330, height: 104 }
    ],
    obstacles: [
      { id: "crystal-static", type: "crystal", x: 280, y: 330, width: 110, height: 74, color: 0x70eaff, movable: false, patrol: null, bridgeId: "bridge-1" },
      { id: "crystal-patrol", type: "crystal", x: 820, y: 310, width: 110, height: 76, color: 0xd08cff, movable: true, patrol: { axis: "x", min: 780, max: 880, speed: 92, start: 820, direction: 1 }, bridgeId: "bridge-2" },
      { id: "final-laser", type: "barrier", x: 1510, y: 390, width: 26, height: 212, color: 0xff4fd8, movable: false, patrol: null, sensorId: "final-sensor" }
    ],
    sensors: [{ id: "final-sensor", type: "shadow-sensor", x: 295, y: 355, width: 64, height: 64, requiredHold: 1500, targetObstacleId: "final-laser", color: 0x9d83ff }],
    lampBounds: { minX: 95, maxX: 335, minY: 105, maxY: 270 },
    lampStart: { x: 155, y: 165 }, playerStart: { x: 90, y: 450 },
    portal: { x: 2440, y: 430, width: 56, height: 66 },
    texts: { intro: "ПОСЛЕДНИЙ ЦИКЛ", objective: "СНИМИ ЗАЩИТУ И ПЕРЕЙДИ ОБЕ ПРОПАСТИ", crystalHint: "ЛАМПА РАБОТАЕТ В ОГРАНИЧЕННОЙ ЗОНЕ", barrierHint: "УДЕРЖИ ТЕНЬ НА ФИНАЛЬНОМ СЕНСОРЕ", completion: "ЦИКЛ ЗАВЕРШЁН" },
    mechanics: { lampDraggable: true, lampLimited: true, requireFullBridge: true, movingObstacles: true, multipleCrystals: true, shadowSensors: true, sensorHoldMs: 1500, laserGates: true, finalChallenge: true }
  }
];

export function getLevelById(levelId) {
  const id = Number(levelId);
  return LEVELS.find(level => level.id === id) ?? null;
}
export function getNextLevelId(levelId) {
  const id = Number(levelId);
  return LEVELS.find(level => level.id === id + 1)?.id ?? null;
}
export function getFirstLevel() { return LEVELS[0]; }
export function getLevelCount() { return LEVELS.length; }
