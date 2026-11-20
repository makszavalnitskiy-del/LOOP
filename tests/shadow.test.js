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
  const bridgeNumber = gapIndex + 1;
  return crystalsFor(level).find(item => item.bridgeId === `bridge-${bridgeNumber}`) ?? null;
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

test("all six levels have valid platform, gap, spawn, lamp and portal geometry", () => {
  assert.equal(getLevelCount(), 6);
  assert.deepEqual(LEVELS.map(level => level.id), [1, 2, 3, 4, 5, 6]);
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
      const crystal = crystalForGap(level, index);
      assert.ok(crystal, `level ${level.id} gap ${index + 1} must map to bridge-${index + 1}`);
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

test("level navigation helpers cover all six levels", () => {
  assert.equal(getLevelById(6)?.key, "last-cycle");
  assert.equal(getLevelById(7), null);
  assert.equal(getNextLevelId(5), 6);
  assert.equal(getNextLevelId(6), null);
});
