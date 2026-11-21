import test from "node:test";
import assert from "node:assert/strict";
import { mergeProgress } from "../src/platform/YandexSDK.js";

test("progress patches can reset a cycle timer and increment attempt counters", () => {
  const current = {
    currentRunTime: 1842.5,
    attemptsByLevel: { 1: 4, 20: 2 },
    stars: { 1: 3, 20: 2 },
    bestTimes: { 1: 42.5, 20: 190 }
  };
  const patch = {
    currentRunTime: 0,
    attemptsByLevel: { 1: 4, 20: 3 }
  };
  const next = mergeProgress(patch, current);
  assert.equal(next.currentRunTime, 0);
  assert.deepEqual(next.attemptsByLevel, { 1: 4, 20: 3 });
  assert.deepEqual(next.stars, { 1: 3, 20: 2 });
  assert.deepEqual(next.bestTimes, { 1: 42.5, 20: 190 });
});

test("progress merging never loses collected stars or a better level time", () => {
  const next = mergeProgress(
    { stars: { 1: 1, 2: 3 }, bestTimes: { 1: 55, 2: 38 } },
    { stars: { 1: 3, 2: 1 }, bestTimes: { 1: 48, 2: 44 } }
  );
  assert.deepEqual(next.stars, { 1: 3, 2: 3 });
  assert.deepEqual(next.bestTimes, { 1: 48, 2: 38 });
});
