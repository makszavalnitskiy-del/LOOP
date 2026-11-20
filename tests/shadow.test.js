import test from "node:test";
import assert from "node:assert/strict";
import { LEVELS, getLevelById, getLevelCount, getNextLevelId } from "../src/data/levels.js";
import { ShadowProjection } from "../src/mechanics/shadows/ShadowProjection.js";

const gap = { groundY: 496, gapStart: 400, gapEnd: 620 };
const defaultObstacle = { x: 280, y: 360, width: 120, height: 60 };

function project(overrides = {}) {
  return ShadowProjection.calculate({
    lightX: 140, lightY: 200, obstacle: defaultObstacle,
    ...gap, ...overrides
  });
}

test("full projection coverage across both banks activates the bridge", () => {
  const result = project();
  assert.equal(result.active, true);
  assert.equal(result.fullCoverage, true);
  assert.ok(result.projectedLeft <= gap.gapStart);
  assert.ok(result.projectedRight >= gap.gapEnd);
});

test("partial overlap with the gap does not activate the bridge", () => {
  const result = project({ lightX: 300, lightY: 200 });
  assert.equal(result.active, false);
  assert.equal(result.fullCoverage, false);
  assert.ok(result.projectedLeft < gap.gapEnd);
  assert.ok(result.projectedRight < gap.gapEnd);
  assert.ok(result.width > 0);
});

test("shadow suspended inside the pit without touching either bank stays inactive", () => {
  const result = project({ lightX: 510, lightY: 200, obstacle: { x: 470, y: 360, width: 20, height: 60 } });
  assert.equal(result.active, false);
  assert.equal(result.fullCoverage, false);
  assert.ok(result.projectedLeft > gap.gapStart);
  assert.ok(result.projectedRight < gap.gapEnd);
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
    const result = project({ obstacle: { ...defaultObstacle, height } });
    widths.push(result.rawShadowWidth);
    assert.equal(result.active, true, `expected bridge for obstacle height ${height}`);
    assert.equal(result.fullCoverage, true);
  }
  assert.ok(new Set(widths.map(value => Math.round(value * 100) / 100)).size > 1);
});

test("all six level records have valid world, spawn, portal and platform geometry", () => {
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

test("every gap has a matching crystal and a non-degenerate shadow projection", () => {
  for (const level of LEVELS) {
    for (const gap of level.gaps) {
      const bridgeId = `bridge-${level.gaps.indexOf(gap) + 1}`;
      const crystal = level.obstacles.find(item => item.type === "crystal" && item.bridgeId === bridgeId);
      assert.ok(crystal, `level ${level.id} gap ${gap.id} crystal link`);
      let best = null;
      for (let lightY = level.lampBounds.minY; lightY <= Math.min(level.lampBounds.maxY, crystal.y - 1); lightY += 25) {
        for (let lightX = level.lampBounds.minX; lightX <= level.lampBounds.maxX; lightX += 25) {
          const result = ShadowProjection.calculate({
            lightX, lightY, obstacle: crystal, groundY: level.world.groundY,
            gapStart: gap.x, gapEnd: gap.x + gap.width
          });
          if (result.width > 0 && Number.isFinite(result.projectedLeft) && Number.isFinite(result.projectedRight)) {
            best = result;
            break;
          }
        }
        if (best) break;
      }
      assert.ok(best, `level ${level.id} gap ${gap.id} must admit a valid shadow overlap`);
      assert.ok(best.width > 0 && best.width <= gap.width);
    }
  }
});

test("sensor levels define timed locks connected to existing laser barriers", () => {
  for (const level of LEVELS.filter(item => item.mechanics.shadowSensors)) {
    assert.ok(level.sensors.length > 0);
    for (const sensor of level.sensors) {
      assert.ok(sensor.requiredHold >= 1200);
      assert.ok(level.obstacles.some(item => item.id === sensor.targetObstacleId && item.type === "barrier"));
    }
  }
});

test("level navigation helpers cover the full six-level campaign", () => {
  assert.equal(getLevelById(6)?.key, "last-cycle");
  assert.equal(getLevelById(7), null);
  assert.equal(getNextLevelId(5), 6);
  assert.equal(getNextLevelId(6), null);
});
