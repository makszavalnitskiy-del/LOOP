import { ShadowProjection } from "../mechanics/shadows/ShadowProjection.js";

export const CHAPTERS = [
  { id: 1, key: "awakening", title: "Пробуждение света", firstLevel: 1, lastLevel: 5 },
  { id: 2, key: "echoes", title: "Эхо прошлого", firstLevel: 6, lastLevel: 10 },
  { id: 3, key: "fracture", title: "Разлом цикла", firstLevel: 11, lastLevel: 15 },
  { id: 4, key: "final-cycle", title: "Последний цикл", firstLevel: 16, lastLevel: 20 }
];

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
    gaps: [{ id: "first-gap", bridgeId: "bridge-1", x: 400, y: 496, width: 220, height: 104 }],
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
      { id: "first-gap", bridgeId: "bridge-1", x: 340, y: 496, width: 210, height: 104 },
      { id: "second-gap", bridgeId: "bridge-2", x: 760, y: 496, width: 220, height: 104 }
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
      { id: "first-gap", bridgeId: "bridge-1", x: 390, y: 496, width: 260, height: 104 },
      { id: "second-gap", bridgeId: "bridge-2", x: 840, y: 496, width: 280, height: 104 }
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
    gaps: [{ id: "resonance-gap", bridgeId: "bridge-1", x: 420, y: 496, width: 280, height: 104 }],
    obstacles: [
      { id: "bridge-crystal", type: "crystal", x: 310, y: 345, width: 150, height: 70, color: 0x77eaff, movable: false, patrol: null, bridgeId: "bridge-1" },
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
      { id: "first-gap", bridgeId: "bridge-1", x: 350, y: 496, width: 240, height: 104 },
      { id: "second-gap", bridgeId: "bridge-2", x: 780, y: 496, width: 300, height: 104 }
    ],
    obstacles: [
      { id: "crystal-static", type: "crystal", x: 250, y: 335, width: 120, height: 70, color: 0x70eaff, movable: false, patrol: null, bridgeId: "bridge-1" },
      { id: "crystal-orbit", type: "crystal", x: 840, y: 315, width: 200, height: 72, color: 0xc18cff, movable: true, patrol: { axis: "y", min: 275, max: 375, speed: 68, start: 315, direction: 1 }, bridgeId: "bridge-2" }
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
      { id: "first-gap", bridgeId: "bridge-1", x: 390, y: 496, width: 370, height: 104 },
      { id: "second-gap", bridgeId: "bridge-2", x: 930, y: 496, width: 330, height: 104 }
    ],
    obstacles: [
      { id: "crystal-static", type: "crystal", x: 320, y: 330, width: 220, height: 74, color: 0x70eaff, movable: false, patrol: null, bridgeId: "bridge-1" },
      { id: "crystal-patrol", type: "crystal", x: 700, y: 310, width: 220, height: 76, color: 0xd08cff, movable: true, patrol: { axis: "x", min: 680, max: 760, speed: 92, start: 700, direction: 1 }, bridgeId: "bridge-2" },
      { id: "final-laser", type: "barrier", x: 1510, y: 390, width: 26, height: 212, color: 0xff4fd8, movable: false, patrol: null, sensorId: "final-sensor" }
    ],
    sensors: [{ id: "final-sensor", type: "shadow-sensor", x: 450, y: 360, width: 64, height: 64, requiredHold: 1500, targetObstacleId: "final-laser", color: 0x9d83ff }],
    lampBounds: { minX: 95, maxX: 335, minY: 105, maxY: 270 },
    lampStart: { x: 155, y: 165 }, playerStart: { x: 90, y: 450 },
    portal: { x: 2440, y: 430, width: 56, height: 66 },
    texts: { intro: "ПОСЛЕДНИЙ ЦИКЛ", objective: "СНИМИ ЗАЩИТУ И ПЕРЕЙДИ ОБЕ ПРОПАСТИ", crystalHint: "ЛАМПА РАБОТАЕТ В ОГРАНИЧЕННОЙ ЗОНЕ", barrierHint: "УДЕРЖИ ТЕНЬ НА ФИНАЛЬНОМ СЕНСОРЕ", completion: "ЦИКЛ ЗАВЕРШЁН" },
    mechanics: { lampDraggable: true, lampLimited: true, requireFullBridge: true, movingObstacles: true, multipleCrystals: true, shadowSensors: true, sensorHoldMs: 1500, laserGates: true, finalChallenge: true }
  }
];


function createAdditionalLevel(config) {
  const groundY = 496;
  const gaps = config.gaps.map((gap, index) => ({
    id: index === 0 ? "first-gap" : index === 1 ? "second-gap" : `gap-${index + 1}`,
    bridgeId: `bridge-${index + 1}`,
    x: gap.x,
    y: groundY,
    width: gap.width,
    height: 104
  }));
  const worldWidth = gaps[gaps.length - 1].x + gaps[gaps.length - 1].width + 650;
  const platforms = [];
  let cursor = 0;
  for (const gap of gaps) {
    if (gap.x > cursor) platforms.push({
      id: platforms.length === 0 ? "start-ground" : `middle-ground-${platforms.length}`,
      x: cursor, y: groundY, width: gap.x - cursor, height: 104
    });
    cursor = gap.x + gap.width;
  }
  if (cursor < worldWidth) platforms.push({
    id: "end-ground", x: cursor, y: groundY, width: worldWidth - cursor, height: 104
  });

  const obstacles = gaps.map((gap, index) => {
    const width = config.crystalWidths?.[index] ?? 132;
    const height = config.crystalHeights?.[index] ?? 74;
    const y = config.crystalY?.[index] ?? 330;
    const patrol = config.movingGapIndexes?.includes(index) ? {
      axis: index % 2 === 0 ? "y" : "x",
      min: index % 2 === 0 ? y - 32 : gap.x - 100,
      max: index % 2 === 0 ? y + 32 : gap.x - 35,
      speed: 54 + (config.id % 4) * 9,
      start: index % 2 === 0 ? y : gap.x - 100,
      direction: index % 2 === 0 ? 1 : -1
    } : null;
    return {
      id: `crystal-${index + 1}`, type: "crystal",
      x: gap.x - Math.min(112, Math.round(width * 0.78)),
      y, width, height,
      color: index % 2 === 0 ? 0x70eaff : 0xc18cff,
      movable: Boolean(patrol), patrol,
      bridgeId: gap.bridgeId, gapId: gap.id,
      lockOnComplete: gaps.length > 1 && !patrol
    };
  });

  return {
    id: config.id, key: config.key, title: config.title, subtitle: config.subtitle,
    description: config.description, lore: config.lore,
    chapter: Math.ceil(config.id / 5), parTimeSec: config.parTimeSec,
    world: { width: worldWidth, height: 600, background: config.background ?? 0x0b0a23, groundY },
    platforms, gaps, obstacles, sensors: [],
    lampBounds: { minX: 55, maxX: worldWidth - 110, minY: 82, maxY: 340 },
    lampStart: { x: 125, y: 185 }, playerStart: { x: 90, y: 450 },
    portal: { x: worldWidth - 150, y: 430, width: 56, height: 66 },
    texts: {
      intro: config.title.toUpperCase(),
      objective: config.objective,
      crystalHint: "КАЖДЫЙ КРИСТАЛЛ СОЗДАЁТ СВОЮ ТЕНЬ",
      barrierHint: "СЛЕДИ ЗА ПОЛОЖЕНИЕМ КРИСТАЛЛОВ",
      completion: "ПУТЬ ЧЕРЕЗ ЦИКЛ ОТКРЫТ"
    },
    mechanics: {
      lampDraggable: true, lampLimited: true, requireFullBridge: true,
      movingObstacles: obstacles.some(item => item.patrol),
      multipleCrystals: gaps.length > 1,
      independentBridges: gaps.length > 1
    }
  };
}

LEVELS.push(
  createAdditionalLevel({ id: 7, key: "echo", title: "Отголосок", subtitle: "Узкий проход", description: "Пройди через узкий разрыв и найди точное положение света.", lore: "За первой дверью эхо повторило имя Арзона.", objective: "СОЕДИНИ БЕРЕГА", gaps: [{ x: 380, width: 190 }], parTimeSec: 42 }),
  createAdditionalLevel({ id: 8, key: "blind-zone", title: "Слепая зона", subtitle: "Два источника", description: "Последовательно активируй два независимых кристалла.", lore: "Не всякий свет показывает то, что находится перед ним.", objective: "СОЗДАЙ ДВА МОСТА", gaps: [{ x: 360, width: 210 }, { x: 900, width: 230 }], parTimeSec: 78 }),
  createAdditionalLevel({ id: 9, key: "pulse", title: "Пульс", subtitle: "Ритм движения", description: "Поймай положение патрулирующего кристалла.", lore: "Мир дышит в такт невидимому сердцу.", objective: "ПОЙМАЙ МОМЕНТ", gaps: [{ x: 390, width: 220 }], movingGapIndexes: [0], parTimeSec: 55 }),
  createAdditionalLevel({ id: 10, key: "foothold", title: "Точка опоры", subtitle: "Двойная настройка", description: "Закрепи первый мост и перенеси лампу ко второму кристаллу.", lore: "Резонанс научил свет отвечать на точность.", objective: "СОБЕРИ ЦЕПОЧКУ МОСТОВ", gaps: [{ x: 350, width: 220 }, { x: 890, width: 260 }], parTimeSec: 82 }),
  createAdditionalLevel({ id: 11, key: "pendulum", title: "Маятник", subtitle: "Нестабильный свет", description: "Следи за движущимся кристаллом и выбирай момент перехода.", lore: "Время раскачивает свет, как маятник над бездной.", objective: "ДОЖДИСЬ УСТОЙЧИВОЙ ТЕНИ", gaps: [{ x: 410, width: 245 }], movingGapIndexes: [0], parTimeSec: 58 }),
  createAdditionalLevel({ id: 12, key: "drift", title: "Смещение", subtitle: "Два независимых участка", description: "Настрой два моста в правильной последовательности.", lore: "Даже неподвижные вещи здесь медленно меняют место.", objective: "СОЕДИНИ ДВА РАЗРЫВА", gaps: [{ x: 370, width: 235 }, { x: 920, width: 275 }], parTimeSec: 88 }),
  createAdditionalLevel({ id: 13, key: "vanishing-path", title: "Исчезающий путь", subtitle: "Временный мост", description: "Создай мост от патрулирующего кристалла и не задерживайся.", lore: "Путь существует лишь пока его помнят.", objective: "ПОЙМАЙ ТЕНЬ И ПЕРЕЙДИ", gaps: [{ x: 400, width: 250 }], movingGapIndexes: [0], parTimeSec: 50 }),
  createAdditionalLevel({ id: 14, key: "light-storm", title: "Световая буря", subtitle: "Аномалия", description: "Сочетай статичный и движущийся кристаллы.", lore: "Аномалия разорвала привычный порядок теней.", objective: "СНАЧАЛА ЗАКРЕПИ МОСТ, ЗАТЕМ ПОЙМАЙ ВТОРОЙ", gaps: [{ x: 360, width: 220 }, { x: 900, width: 285 }], movingGapIndexes: [1], parTimeSec: 92 }),
  createAdditionalLevel({ id: 15, key: "reverse-phase", title: "Обратная фаза", subtitle: "Точный расчёт", description: "Перестрой свет между двумя независимыми мостами.", lore: "Маятник остановился. Наступила тишина перед последним циклом.", objective: "СОБЕРИ ЦЕПОЧКУ ТЕНЕЙ", gaps: [{ x: 385, width: 255 }, { x: 950, width: 300 }], parTimeSec: 95 }),
  createAdditionalLevel({ id: 16, key: "last-frontier", title: "Последний рубеж", subtitle: "Сложный маршрут", description: "Преодолей два разрыва, один из кристаллов движется.", lore: "За горизонтом больше нет света, кроме того, что ты несёшь.", objective: "ПРЕОДОЛЕЙ ОБА РАЗРЫВА", gaps: [{ x: 400, width: 260 }, { x: 970, width: 310 }], movingGapIndexes: [1], parTimeSec: 100 }),
  createAdditionalLevel({ id: 17, key: "two-sides", title: "Две стороны", subtitle: "Разветвлённые тени", description: "Закрепи первый мост и перенеси источник ко второму.", lore: "Каждый выбор оставляет собственную тень.", objective: "СОЕДИНИ ДВЕ СТОРОНЫ", gaps: [{ x: 350, width: 235 }, { x: 910, width: 280 }], parTimeSec: 96 }),
  createAdditionalLevel({ id: 18, key: "sensor-echo", title: "Эхо сенсора", subtitle: "Двойной резонанс", description: "Настрой два моста и сохрани точность положения лампы.", lore: "Старые механизмы проснулись от знакомого прикосновения.", objective: "СОЗДАЙ ДВА МОСТА", gaps: [{ x: 420, width: 270 }, { x: 1010, width: 320 }], parTimeSec: 108 }),
  createAdditionalLevel({ id: 19, key: "cycle-edge", title: "Грань цикла", subtitle: "Последняя проверка", description: "Синхронизируй движущийся кристалл с последним переходом.", lore: "Граница между светом и тьмой стала почти невидимой.", objective: "ПОЙМАЙ СОВПАДЕНИЕ ФАЗ", gaps: [{ x: 390, width: 250 }, { x: 960, width: 315 }], movingGapIndexes: [0, 1], parTimeSec: 112 }),
  createAdditionalLevel({ id: 20, key: "final-cycle", title: "Последний цикл", subtitle: "Финал", description: "Пройди последнее испытание и замкни цикл.", lore: "Арзон понял: свет не уничтожает тьму. Он показывает дорогу сквозь неё.", objective: "ЗАМКНИ ПОСЛЕДНИЙ ЦИКЛ", gaps: [{ x: 400, width: 275 }, { x: 1000, width: 330 }], movingGapIndexes: [1], parTimeSec: 120 })
);

function attachLevelMetadataAndHints(level) {
  level.chapter ??= Math.ceil(level.id / 5);
  level.parTimeSec ??= 45 + level.id * 4;
  const chapter = CHAPTERS[level.chapter - 1];
  if (!chapter || level.id < chapter.firstLevel || level.id > chapter.lastLevel) {
    throw new Error(`Level ${level.id}: invalid chapter assignment`);
  }
  level.chapterKey = chapter.key;
  level.chapterTitle = chapter.title;
  level.localizationKeys = {
    title: `level.${level.id}.title`,
    subtitle: `level.${level.id}.subtitle`,
    description: `level.${level.id}.description`,
    lore: `level.${level.id}.lore`
  };
  const crystals = level.obstacles.filter(item => item.type === "crystal");
  for (const crystal of crystals) {
    const gap = level.gaps.find(item => item.bridgeId === crystal.bridgeId);
    if (!gap) throw new Error(`Level ${level.id}: crystal ${crystal.id} has no matching gap`);
    crystal.gapId = gap.id;
    crystal.lockOnComplete = level.gaps.length > 1 && !crystal.patrol;
  }

  const steps = [];
  for (const sensor of level.sensors ?? []) {
    const sensorCrystals = sensor.crystalId ? crystals.filter(item => item.id === sensor.crystalId) : crystals;
    const sensorCrystal = sensorCrystals[0];
    const sensorGap = sensorCrystal
      ? level.gaps.find(item => item.bridgeId === sensorCrystal.bridgeId)
      : null;
    const sensorHint = ShadowProjection.findSensorPosition({
      bounds: level.lampBounds, obstacles: sensorCrystals, groundY: level.world.groundY,
      sensor, worldWidth: level.world.width,
      gapStart: sensorGap?.x ?? 0,
      gapEnd: sensorGap ? sensorGap.x + sensorGap.width : level.world.width,
      requireFullCoverage: Boolean(sensorGap),
      step: 2
    });
    if (!sensorHint) throw new Error(`Level ${level.id}: no lamp position can charge sensor ${sensor.id}`);
    steps.push({ x: sensorHint.x, y: sensorHint.y, action: "charge-sensor", sensorId: sensor.id });
  }
  for (const gap of level.gaps) {
    const crystal = crystals.find(item => item.gapId === gap.id);
    if (!crystal) throw new Error(`Level ${level.id}: gap ${gap.id} has no crystal`);
    const hint = ShadowProjection.findFullCoveragePosition({
      bounds: level.lampBounds,
      obstacle: { x: crystal.x, y: crystal.y, width: crystal.width, height: crystal.height },
      groundY: level.world.groundY,
      gapStart: gap.x,
      gapEnd: gap.x + gap.width,
      step: 2
    });
    if (!hint) throw new Error(`Level ${level.id}: no full-coverage lamp position for gap ${gap.id}`);
    steps.push({ x: hint.x, y: hint.y, gapId: gap.id, action: "build-bridge" });
  }
  if (steps.length === 1 && steps[0].action === "build-bridge") {
    level.hintPosition = { x: steps[0].x, y: steps[0].y };
    delete level.hintSteps;
  } else {
    level.hintSteps = steps;
    delete level.hintPosition;
  }
}

// The final chapter has a bespoke three-act finale rather than the generated layout.
const finalLevel = LEVELS[19];
finalLevel.title = "Последний цикл";
finalLevel.subtitle = "Память. Синхронизация. Сердце.";
finalLevel.description = "Разбуди память, синхронизируй два моста и удержи последний луч во время прыжка.";
finalLevel.lore = "Арзон — искра первого рассвета. Пуши — память света, которую Цикл не смог стереть.";
finalLevel.world = { width: 2050, height: 600, background: 0x090b25, groundY: 496 };
finalLevel.platforms = [
  { id: "start-ground", x: 0, y: 496, width: 400, height: 104 },
  { id: "middle-ground", x: 680, y: 496, width: 290, height: 104 },
  { id: "end-ground", x: 1320, y: 496, width: 730, height: 104 }
];
finalLevel.gaps = [
  { id: "memory-gap", bridgeId: "bridge-1", x: 400, y: 496, width: 280, height: 104 },
  { id: "heart-gap", bridgeId: "bridge-2", x: 970, y: 496, width: 350, height: 104 }
];
finalLevel.obstacles = [
  { id: "memory-crystal", type: "crystal", x: 310, y: 330, width: 130, height: 70, color: 0x73eaff, movable: true,
    patrol: { axis: "x", min: 300, max: 350, speed: 42, start: 310, direction: 1 }, bridgeId: "bridge-1" },
  { id: "heart-crystal", type: "crystal", x: 875, y: 320, width: 160, height: 80, color: 0xd29aff, movable: false,
    patrol: null, bridgeId: "bridge-2" },
  { id: "memory-barrier", type: "barrier", x: 535, y: 300, width: 28, height: 196, color: 0x9a6cff,
    movable: false, patrol: null, sensorId: "memory-sensor" },
  { id: "heart-barrier", type: "barrier", x: 1535, y: 294, width: 30, height: 202, color: 0xffd28a,
    movable: false, patrol: null, sensorId: "heart-sensor" }
];
finalLevel.sensors = [
  { id: "memory-sensor", phase: 1, type: "shadow-sensor", x: 370, y: 390, width: 72, height: 48,
    requiredHold: 1250, targetObstacleId: "memory-barrier", crystalId: "memory-crystal", color: 0x9d83ff },
  { id: "heart-sensor", phase: 3, type: "shadow-sensor", x: 1210, y: 370, width: 82, height: 58,
    requiredHold: 1150, targetObstacleId: "heart-barrier", crystalId: "heart-crystal", color: 0xffd28a,
    holdToMaintain: true, requiresJump: true, jumpXMin: 1510, jumpXMax: 1730 }
];
finalLevel.lampBounds = { minX: 65, maxX: 1150, minY: 82, maxY: 330 };
finalLevel.lampStart = { x: 145, y: 175 };
finalLevel.playerStart = { x: 90, y: 450 };
finalLevel.portal = { x: 1900, y: 424, width: 64, height: 76 };
finalLevel.texts = {
  intro: "ПОСЛЕДНИЙ ЦИКЛ",
  objective: "I. ПРОБУДИ ПАМЯТЬ  •  II. СИНХРОНИЗИРУЙ МОСТЫ  •  III. ЗАЖГИ СЕРДЦЕ",
  phase1: "АКТ I  /  ПРОБУЖДЕНИЕ ПАМЯТИ",
  phase2: "АКТ II  /  СИНХРОНИЗАЦИЯ",
  phase3: "АКТ III  /  СЕРДЦЕ ЦИКЛА",
  completion: "СВЕТ БОЛЬШЕ НЕ ПОВТОРЯЕТСЯ"
};
finalLevel.finalSequence = { memorySensorId: "memory-sensor", heartSensorId: "heart-sensor" };
finalLevel.mechanics = {
  lampDraggable: true, lampLimited: true, requireFullBridge: true,
  movingObstacles: true, multipleCrystals: true, shadowSensors: true,
  finalChallenge: true, threeActFinale: true, unstableLamp: true
};

for (const level of LEVELS) attachLevelMetadataAndHints(level);

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
