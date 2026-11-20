import test from "node:test";
import assert from "node:assert/strict";
import { ShadowProjection } from "../src/mechanics/shadows/ShadowProjection.js";

const scene = {
  obstacle: { x: 280, y: 360, width: 120, height: 60 },
  groundY: 496,
  gapStart: 400,
  gapEnd: 620
};

test("light aimed from the marked zone creates a bridge across the gap", () => {
  const shadow = ShadowProjection.calculate({ ...scene, lightX: 140, lightY: 200 });
  assert.equal(shadow.active, true);
  assert.ok(shadow.width >= 219);
  assert.ok(shadow.x <= 400);
  assert.ok(shadow.x + shadow.width >= 620);
});

test("light in the starting position does not create a bridge", () => {
  const shadow = ShadowProjection.calculate({ ...scene, lightX: 500, lightY: 250 });
  assert.equal(shadow.active, false);
  assert.equal(shadow.width, 0);
});

test("a light below the top of the obstacle cannot cast the intended shadow", () => {
  const shadow = ShadowProjection.calculate({ ...scene, lightX: 100, lightY: 390 });
  assert.equal(shadow.active, false);
});
