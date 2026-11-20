// Projects all four rectangle corners onto a horizontal ground plane.
export class ShadowProjection {
  static calculate({ lightX, lightY, obstacle, groundY, gapStart, gapEnd, coverageTolerance = 1 }) {
    const invalid = () => ({
      active: false, fullCoverage: false, reason: "invalid-geometry",
      x: Number.isFinite(gapStart) ? gapStart : 0, width: 0,
      projectedLeft: null, projectedRight: null, polygon: [], corners: [],
      coverage: 0, gapStart, gapEnd, gapWidth: 0, rawShadowWidth: 0
    });
    if (![lightX, lightY, groundY, gapStart, gapEnd].every(Number.isFinite)) return invalid();
    if (!obstacle || ![obstacle.x, obstacle.y, obstacle.width, obstacle.height].every(Number.isFinite)) return invalid();
    if (obstacle.width <= 0 || obstacle.height <= 0 || gapEnd <= gapStart) return invalid();
    const top = obstacle.y;
    const bottom = obstacle.y + obstacle.height;
    if (lightY >= top || groundY <= top || groundY <= lightY) {
      return { ...invalid(), reason: "light-not-above-obstacle" };
    }
    const corners = [
      { x: obstacle.x, y: top },
      { x: obstacle.x + obstacle.width, y: top },
      { x: obstacle.x + obstacle.width, y: bottom },
      { x: obstacle.x, y: bottom }
    ];
    const projected = [];
    for (const corner of corners) {
      const denominator = corner.y - lightY;
      if (Math.abs(denominator) < 1e-7) return { ...invalid(), reason: "parallel-ray" };
      const t = (groundY - lightY) / denominator;
      const x = lightX + (corner.x - lightX) * t;
      if (!Number.isFinite(x)) return invalid();
      projected.push({ x, y: groundY });
    }
    const projectedLeft = Math.min(...projected.map(point => point.x));
    const projectedRight = Math.max(...projected.map(point => point.x));
    const rawShadowWidth = projectedRight - projectedLeft;
    const gapWidth = gapEnd - gapStart;
    const overlapLeft = Math.max(projectedLeft, gapStart);
    const overlapRight = Math.min(projectedRight, gapEnd);
    const width = Math.max(0, overlapRight - overlapLeft);
    const tolerance = Math.max(0, coverageTolerance);
    const fullCoverage = projectedLeft <= gapStart + tolerance && projectedRight >= gapEnd - tolerance;
    const active = fullCoverage;
    const polygon = [
      corners[0],
      corners[1],
      { x: projectedRight, y: groundY },
      { x: projectedLeft, y: groundY }
    ];
    return {
      active, fullCoverage,
      reason: active ? "full-gap-coverage" : width > 0 ? "partial-gap-coverage" : "shadow-misses-gap",
      x: overlapLeft, width,
      projectedLeft, projectedRight,
      polygon, corners, coverage: width / gapWidth,
      gapStart, gapEnd, gapWidth, rawShadowWidth
    };
  }
}