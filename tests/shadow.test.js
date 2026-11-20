import test from "node:test";
import assert from "node:assert/strict";
import { ShadowProjection } from "../src/mechanics/shadows/ShadowProjection.js";

const gap = { groundY: 496, gapStart: 400, gapEnd: 620 };
const defaultObstacle = { x: 280, y: 360, width: 120, height: 60 };

function project(overrides = {}) {
  return ShadowProjection.calculate({
    lightX: 140,
    lightY: 200,
    obstacle: defaultObstacle,
    ...gap,
    ...overrides
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
  const result = project({
    lightX: 510,
    lightY: 200,
    obstacle: { x: 470, y: 360, width: 20, height: 60 }
  });
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