import test from "node:test";
import assert from "node:assert/strict";
import { LEVELS, getLevelById, getLevelCount, getNextLevelId } from "../src/data/levels.js";
import { ShadowProjection } from "../src/mechanics/shadows/ShadowProjection.js";

const sampleGap = { groundY: 496, gapStart: 400, gapEnd: 620 };
const sampleObstacle = { x: 280, y: 360, width: 120, height: 60 };

function project(overrides = {}) {
  return ShadowProjection.calculate({
    lightX: 140,
    lightY: 200,
    obstacle: sampleObstacle,
    groundY: sampleGap.groundY,
    gapStart: sampleGap.gapStart,
    gapEnd: sampleGap.gapEnd,
    ...overrides
  });
}

function crystalsFor(level) {
  return level.obstacles.filter(item => item.type === "crystal");
}

function crystalForGap(level, gapIndex) {
  const gap = level.gaps[gapIndex];
  return crystalsFor(level).find(item => item.bridgeId === gap.bridgeId) ?? null;
}

function findLampPosition(level, predicate, step = 5) {
  for (let y = level.lampBounds.minY; y <= level.lampBounds.maxY; y += step) {
    for (let x = level.lampBounds.minX; x <= level.lampBounds.maxX; x += step) {
      if (predicate(x, y)) return { x, y };
    }
  }
  return null;
}

test("full projection coverage across both banks activates the bridge", () => {
  const result = project();
  assert.equal(result.active, true);
  assert.equal(result.fullCoverage, true);
  assert.ok(result.projectedLeft <= sampleGap.gapStart);
  assert.ok(result.projectedRight >= sampleGap.gapEnd);
});

test("partial overlap with the gap does not activate the bridge", () => {
  const result = project({ lightX: 300, lightY: 200 });
  assert.equal(result.active, false);
  assert.equal(result.fullCoverage, false);
  assert.ok(result.projectedLeft < sampleGap.gapEnd);
  assert.ok(result.projectedRight < sampleGap.gapEnd);
  assert.ok(result.width > 0);
});

test("shadow suspended inside the pit without touching either bank stays inactive", () => {
  const result = project({
    lightX: 510,
    lightY: 200,
    obstacle: { x: 470, y: 360, width: 20, height: 60 }
  });
  assert.equal(result.active, false);
  assert.equal(result.fullCoverage, false);
  assert.ok(result.projectedLeft > sampleGap.gapStart);
  assert.ok(result.projectedRight < sampleGap.gapEnd);
});

test("light below the obstacle top cannot produce a bridge", () => {
  const result = project({ lightY: 390 });
  assert.equal(result.active, false);
  assert.equal(result.fullCoverage, false);
  assert.equal(result.reason, "light-not-above-obstacle");
});

test("projection responds to different obstacle heights", () => {
  const widths = [];
  for (const height of [30, 60, 100, 130]) {
    const result = project({ obstacle: { ...sampleObstacle, height } });
    widths.push(result.rawShadowWidth);
    assert.equal(result.active, true, `expected bridge for obstacle height ${height}`);
    assert.equal(result.fullCoverage, true);
  }
  assert.ok(new Set(widths.map(value => Math.round(value * 100) / 100)).size > 1);
});

test("shadow polygon intersects a sensor rectangle even when its center is outside", () => {
  const polygon = [
    { x: 0, y: 0 },
    { x: 12, y: 0 },
    { x: 12, y: 12 },
    { x: 0, y: 12 }
  ];
  assert.equal(ShadowProjection.intersectsRect(polygon, { x: 10, y: 4, width: 8, height: 4 }), true);
  assert.equal(ShadowProjection.intersectsRect(polygon, { x: 20, y: 20, width: 5, height: 5 }), false);
  assert.equal(ShadowProjection.intersectsRect([], { x: 0, y: 0, width: 5, height: 5 }), false);
});

test("all twenty levels have valid platform, gap, spawn, lamp and portal geometry", () => {
  assert.equal(getLevelCount(), 20);
  assert.deepEqual(LEVELS.map(level => level.id), Array.from({ length: 20 }, (_, index) => index + 1));
  for (const level of LEVELS) {
    assert.ok(level.key && level.title && level.lore, `level ${level.id} metadata`);
    assert.ok(level.world.width > 0 && level.world.height > 0);
    assert.ok(level.world.groundY > 0 && level.world.groundY < level.world.height);
    for (const point of [level.playerStart, level.lampStart, level.portal]) {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y), `level ${level.id} coordinates`);
    }
    assert.ok(level.playerStart.x >= 0 && level.playerStart.x < level.world.width);
    assert.ok(level.lampStart.x >= level.lampBounds.minX && level.lampStart.x <= level.lampBounds.maxX);
    assert.ok(level.lampStart.y >= level.lampBounds.minY && level.lampStart.y <= level.lampBounds.maxY);
    assert.ok(level.lampBounds.minX >= 0 && level.lampBounds.maxX < level.world.width);
    assert.ok(level.lampBounds.minY >= 0 && level.lampBounds.maxY < level.world.height);
    assert.ok(level.portal.x >= 0 && level.portal.x + level.portal.width <= level.world.width);
    assert.ok(level.platforms.length >= 2);
    assert.ok(level.gaps.length >= 1);
    for (const platform of level.platforms) {
      assert.ok(platform.width > 0 && platform.height > 0);
      assert.ok(platform.x >= 0 && platform.x + platform.width <= level.world.width);
      assert.equal(platform.y, level.world.groundY);
    }
    for (const gap of level.gaps) {
      assert.ok(gap.width > 0 && gap.x >= 0 && gap.x + gap.width <= level.world.width);
      assert.equal(gap.y, level.world.groundY);
    }
    assert.ok(Array.isArray(level.obstacles));
    assert.ok(Array.isArray(level.sensors));
  }
});

test("every gap on every level has an explicitly linked crystal", () => {
  for (const level of LEVELS) {
    assert.equal(crystalsFor(level).length, level.gaps.length, `level ${level.id} crystal count`);
    for (let index = 0; index < level.gaps.length; index++) {
      const gap = level.gaps[index];
      const crystal = crystalForGap(level, index);
      assert.ok(gap.bridgeId, `level ${level.id} gap ${gap.id} must declare bridgeId`);
      assert.ok(crystal, `level ${level.id} gap ${gap.id} must map to ${gap.bridgeId}`);
      assert.ok(crystal.width > 0 && crystal.height > 0);
    }
  }
});

test("every gap has at least one lamp position inside lampBounds with full 100% shadow coverage", () => {
  for (const level of LEVELS) {
    for (let index = 0; index < level.gaps.length; index++) {
      const gap = level.gaps[index];
      const crystal = crystalForGap(level, index);
      const solution = findLampPosition(level, (lightX, lightY) => {
        const result = ShadowProjection.calculate({
          lightX,
          lightY,
          obstacle: crystal,
          groundY: level.world.groundY,
          gapStart: gap.x,
          gapEnd: gap.x + gap.width
        });
        return result.active && result.fullCoverage && result.coverage >= 1 - 1e-6;
      });
      assert.ok(solution, `level ${level.id}, gap ${gap.id}: no full-coverage lamp position inside lampBounds`);
    }
  }
});

test("every sensor on levels 4 and 6 intersects at least one projected crystal shadow within lampBounds", () => {
  for (const level of LEVELS.filter(item => item.sensors.length > 0)) {
    for (const sensor of level.sensors) {
      const solution = findLampPosition(level, (lightX, lightY) => {
        return crystalsFor(level).some(crystal => {
          const projection = ShadowProjection.calculate({
            lightX,
            lightY,
            obstacle: crystal,
            groundY: level.world.groundY,
            gapStart: level.gaps[0].x,
            gapEnd: level.gaps[0].x + level.gaps[0].width
          });
          return ShadowProjection.intersectsRect(projection.polygon, sensor);
        });
      });
      assert.ok(solution, `level ${level.id}, sensor ${sensor.id}: no shadow intersection inside lampBounds`);
      assert.ok(sensor.requiredHold >= 1000);
      assert.ok(level.obstacles.some(item => item.id === sensor.targetObstacleId && item.type === "barrier"));
    }
  }
});

test("moving obstacle patrols remain inside their declared ranges", () => {
  for (const level of LEVELS) {
    for (const obstacle of level.obstacles) {
      if (!obstacle.patrol) continue;
      const patrol = obstacle.patrol;
      assert.ok(["x", "y"].includes(patrol.axis));
      assert.ok(Number.isFinite(patrol.min) && Number.isFinite(patrol.max) && patrol.max > patrol.min);
      assert.ok(patrol.start >= patrol.min && patrol.start <= patrol.max);
      assert.ok(patrol.speed > 0);
    }
  }
});

test("level 20 is a bespoke three-act finale with two bridges and two gated sensors", () => {
  const finale = getLevelById(20);
  assert.equal(finale.key, "final-cycle");
  assert.equal(finale.finalSequence.memorySensorId, "memory-sensor");
  assert.equal(finale.finalSequence.heartSensorId, "heart-sensor");
  assert.equal(finale.gaps.length, 2);
  assert.equal(finale.sensors.length, 2);
  assert.ok(finale.mechanics.threeActFinale);
  assert.ok(finale.mechanics.unstableLamp);
  const memoryCrystal = finale.obstacles.find(item => item.id === "memory-crystal");
  const heartCrystal = finale.obstacles.find(item => item.id === "heart-crystal");
  assert.ok(memoryCrystal.patrol, "the memory crystal must patrol during act I");
  assert.equal(heartCrystal.patrol, null, "the second bridge crystal stays static");
  assert.equal(finale.sensors.find(item => item.id === "memory-sensor").crystalId, memoryCrystal.id);
  const heart = finale.sensors.find(item => item.id === "heart-sensor");
  assert.equal(heart.crystalId, heartCrystal.id);
  assert.equal(heart.holdToMaintain, true);
  assert.equal(heart.requiresJump, true);
  assert.ok(heart.jumpXMin < heart.jumpXMax);
  assert.ok(finale.obstacles.some(item => item.id === "memory-barrier" && item.sensorId === "memory-sensor"));
  assert.ok(finale.obstacles.some(item => item.id === "heart-barrier" && item.sensorId === "heart-sensor"));
});

test("the memory sensor sits beyond its patrol crystal and stays inside its shadow", () => {
  const finale = getLevelById(20);
  const crystal = crystalsFor(finale).find(item => item.id === "memory-crystal");
  const sensor = finale.sensors.find(item => item.id === "memory-sensor");
  const overlapsCrystal =
    sensor.x < crystal.x + crystal.width &&
    sensor.x + sensor.width > crystal.x &&
    sensor.y < crystal.y + crystal.height &&
    sensor.y + sensor.height > crystal.y;
  assert.equal(overlapsCrystal, false, "sensor must not overlap the crystal body");

  for (const crystalX of [crystal.patrol.min, crystal.patrol.start, crystal.patrol.max]) {
    const projection = ShadowProjection.calculate({
      lightX: finale.lampStart.x,
      lightY: finale.lampStart.y,
      obstacle: { ...crystal, x: crystalX },
      groundY: finale.world.groundY,
      gapStart: finale.gaps[0].x,
      gapEnd: finale.gaps[0].x + finale.gaps[0].width
    });
    assert.equal(ShadowProjection.intersectsRect(projection.polygon, sensor), true,
      `memory sensor must remain in the moving crystal shadow at x=${crystalX}`);
  }

  const settledProjection = ShadowProjection.calculate({
    lightX: finale.lampStart.x,
    lightY: finale.lampStart.y,
    obstacle: { ...crystal, x: crystal.patrol.start },
    groundY: finale.world.groundY,
    gapStart: finale.gaps[0].x,
    gapEnd: finale.gaps[0].x + finale.gaps[0].width
  });
  assert.equal(settledProjection.fullCoverage, true,
    "the crystal must form a stable bridge after the act-I patrol ends");

  const heartCrystal = crystalsFor(finale).find(item => item.id === "heart-crystal");
  const heartGap = finale.gaps.find(item => item.bridgeId === heartCrystal.bridgeId);
  const heartAtStart = ShadowProjection.calculate({
    lightX: finale.lampStart.x,
    lightY: finale.lampStart.y,
    obstacle: heartCrystal,
    groundY: finale.world.groundY,
    gapStart: heartGap.x,
    gapEnd: heartGap.x + heartGap.width
  });
  assert.equal(heartAtStart.fullCoverage, false,
    "act II must require the player to reposition the lamp for the second bridge");
});

test("finale sensor hints are projected from their assigned crystals", () => {
  const finale = getLevelById(20);
  for (const sensor of finale.sensors) {
    const hint = finale.hintSteps.find(item => item.action === "charge-sensor" && item.sensorId === sensor.id);
    assert.ok(hint, `missing hint for ${sensor.id}`);
    const crystal = crystalsFor(finale).find(item => item.id === sensor.crystalId);
    const projection = ShadowProjection.calculate({
      lightX: hint.x,
      lightY: hint.y,
      obstacle: crystal,
      groundY: finale.world.groundY,
      gapStart: 0,
      gapEnd: finale.world.width
    });
    assert.equal(ShadowProjection.intersectsRect(projection.polygon, sensor), true);
    const gap = finale.gaps.find(item => item.bridgeId === crystal.bridgeId);
    assert.ok(gap, `missing bridge gap for ${crystal.id}`);
    const bridgeProjection = ShadowProjection.calculate({
      lightX: hint.x, lightY: hint.y, obstacle: crystal,
      groundY: finale.world.groundY, gapStart: gap.x, gapEnd: gap.x + gap.width
    });
    assert.equal(bridgeProjection.fullCoverage, true, `${sensor.id} hint must also build its bridge`);
  }
});

test("level navigation helpers cover all twenty levels", () => {
  assert.equal(getLevelById(6)?.key, "last-cycle");
  assert.equal(getLevelById(20)?.key, "final-cycle");
  assert.equal(getLevelById(21), null);
  assert.equal(getNextLevelId(19), 20);
  assert.equal(getNextLevelId(20), null);
});


test("all twenty levels provide mathematical lamp hints inside lampBounds", () => {
  assert.equal(LEVELS.length, 20);
  for (const level of LEVELS) {
    const hints = level.hintSteps ?? (level.hintPosition ? [{ ...level.hintPosition, action: "build-bridge", gapId: level.gaps[0].id }] : []);
    assert.ok(hints.length >= level.gaps.length + (level.sensors?.length ?? 0), `level ${level.id}: missing ordered hint steps`);
    for (const hint of hints) {
      assert.ok(ShadowProjection.isPointInsideBounds(hint, level.lampBounds), `level ${level.id}: hint outside lampBounds`);
    }
    for (const gap of level.gaps) {
      const hint = hints.find(item => item.action === "build-bridge" && item.gapId === gap.id);
      const crystal = crystalForGap(level, level.gaps.indexOf(gap));
      assert.ok(hint, `level ${level.id}: missing hint for ${gap.id}`);
      const projection = ShadowProjection.calculate({
        lightX: hint.x, lightY: hint.y,
        obstacle: { x: crystal.x, y: crystal.y, width: crystal.width, height: crystal.height },
        groundY: level.world.groundY, gapStart: gap.x, gapEnd: gap.x + gap.width
      });
      assert.equal(projection.active, true, `level ${level.id}, ${gap.id}: hint does not fully form bridge`);
      assert.ok(projection.coverage >= 1 - 1e-9);
    }
    for (const sensor of level.sensors ?? []) {
      const hint = hints.find(item => item.action === "charge-sensor" && item.sensorId === sensor.id);
      assert.ok(hint, `level ${level.id}: missing sensor hint ${sensor.id}`);
      const intersects = crystalsFor(level).some(crystal => {
        const projection = ShadowProjection.calculate({
          lightX: hint.x, lightY: hint.y,
          obstacle: { x: crystal.x, y: crystal.y, width: crystal.width, height: crystal.height },
          groundY: level.world.groundY, gapStart: 0, gapEnd: level.world.width
        });
        return ShadowProjection.intersectsRect(projection.polygon, sensor);
      });
      assert.equal(intersects, true, `level ${level.id}: sensor hint does not charge ${sensor.id}`);
    }
  }
});

test("multi-gap crystals explicitly map to gaps and only static crystals request locking", () => {
  for (const level of LEVELS) {
    for (const crystal of crystalsFor(level)) {
      const gap = level.gaps.find(item => item.id === crystal.gapId);
      assert.ok(gap, `level ${level.id}: crystal ${crystal.id} has invalid gapId`);
      assert.equal(gap.bridgeId, crystal.bridgeId);
      if (level.gaps.length > 1) {
        assert.equal(crystal.lockOnComplete, !crystal.patrol, `level ${level.id}: incorrect lockOnComplete on ${crystal.id}`);
      }
      if (crystal.patrol) assert.equal(crystal.lockOnComplete, false);
    }
  }
});
