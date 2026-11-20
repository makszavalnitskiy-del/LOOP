export class ShadowProjection {
  static calculate({ lightX, lightY, obstacle, groundY, gapStart, gapEnd, coverageTolerance = 1 }) {
    const invalid = () => ({
      active: false,
      fullCoverage: false,
      reason: "invalid-geometry",
      x: Number.isFinite(gapStart) ? gapStart : 0,
      width: 0,
      projectedLeft: null,
      projectedRight: null,
      polygon: [],
      corners: [],
      coverage: 0,
      gapStart,
      gapEnd,
      gapWidth: 0,
      rawShadowWidth: 0
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
    const polygon = [
      corners[0],
      corners[1],
      { x: projectedRight, y: groundY },
      { x: projectedLeft, y: groundY }
    ];

    return {
      active: fullCoverage,
      fullCoverage,
      reason: fullCoverage ? "full-gap-coverage" : width > 0 ? "partial-gap-coverage" : "shadow-misses-gap",
      x: overlapLeft,
      width,
      projectedLeft,
      projectedRight,
      polygon,
      corners,
      coverage: width / gapWidth,
      gapStart,
      gapEnd,
      gapWidth,
      rawShadowWidth
    };
  }

  static isPointInsideBounds(point, bounds) {
    return Boolean(point && bounds &&
      Number.isFinite(point.x) && Number.isFinite(point.y) &&
      Number.isFinite(bounds.minX) && Number.isFinite(bounds.maxX) &&
      Number.isFinite(bounds.minY) && Number.isFinite(bounds.maxY) &&
      point.x >= bounds.minX && point.x <= bounds.maxX &&
      point.y >= bounds.minY && point.y <= bounds.maxY);
  }

  static findFullCoveragePosition({ bounds, obstacle, groundY, gapStart, gapEnd, step = 2 }) {
    if (!bounds || !obstacle) return null;
    const increment = Math.max(1, Number(step) || 1);
    const scan = stride => {
      for (let y = bounds.minY; y <= bounds.maxY; y += stride) {
        for (let x = bounds.minX; x <= bounds.maxX; x += stride) {
          const projection = this.calculate({ lightX: x, lightY: y, obstacle, groundY, gapStart, gapEnd });
          if (projection.active && projection.fullCoverage && projection.coverage >= 1 - 1e-9) {
            return { x, y, projection };
          }
        }
      }
      return null;
    };
    return scan(increment) ?? (increment === 1 ? null : scan(1));
  }

  static findSensorPosition({ bounds, obstacles, groundY, sensor, worldWidth, step = 2 }) {
    if (!bounds || !Array.isArray(obstacles) || !sensor || !Number.isFinite(worldWidth) || worldWidth <= 0) return null;
    const increment = Math.max(1, Number(step) || 1);
    const scan = stride => {
      for (let y = bounds.minY; y <= bounds.maxY; y += stride) {
        for (let x = bounds.minX; x <= bounds.maxX; x += stride) {
          for (const obstacle of obstacles) {
            const projection = this.calculate({
              lightX: x, lightY: y, obstacle, groundY, gapStart: 0, gapEnd: worldWidth
            });
            if (projection.polygon.length && this.intersectsRect(projection.polygon, sensor)) {
              return { x, y, obstacleId: obstacle.id ?? null, projection };
            }
          }
        }
      }
      return null;
    };
    return scan(increment) ?? (increment === 1 ? null : scan(1));
  }

  static intersectsRect(polygon, rect) {
    if (!Array.isArray(polygon) || polygon.length < 3 || !rect) return false;
    const { x, y, width, height } = rect;
    if (![x, y, width, height].every(Number.isFinite) || width < 0 || height < 0) return false;

    const right = x + width;
    const bottom = y + height;
    const rectangleCorners = [
      { x, y },
      { x: right, y },
      { x: right, y: bottom },
      { x, y: bottom }
    ];
    const pointInRect = point => point.x >= x && point.x <= right && point.y >= y && point.y <= bottom;
    const pointInPolygon = point => {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[i];
        const b = polygon[j];
        if (!a || !b || !Number.isFinite(a.x) || !Number.isFinite(a.y) || !Number.isFinite(b.x) || !Number.isFinite(b.y)) return false;
        const crosses = (a.y > point.y) !== (b.y > point.y);
        if (crosses && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
      }
      return inside;
    };
    const orientation = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    const onSegment = (a, b, p) =>
      Math.abs(orientation(a, b, p)) < 1e-8 &&
      p.x >= Math.min(a.x, b.x) - 1e-8 && p.x <= Math.max(a.x, b.x) + 1e-8 &&
      p.y >= Math.min(a.y, b.y) - 1e-8 && p.y <= Math.max(a.y, b.y) + 1e-8;
    const segmentsIntersect = (a, b, c, d) => {
      const o1 = orientation(a, b, c);
      const o2 = orientation(a, b, d);
      const o3 = orientation(c, d, a);
      const o4 = orientation(c, d, b);
      if (((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) &&
          ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0))) return true;
      return onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b);
    };

    if (polygon.some(pointInRect) || rectangleCorners.some(pointInPolygon)) return true;
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      for (let j = 0; j < rectangleCorners.length; j++) {
        if (segmentsIntersect(a, b, rectangleCorners[j], rectangleCorners[(j + 1) % rectangleCorners.length])) return true;
      }
    }
    return false;
  }
}
