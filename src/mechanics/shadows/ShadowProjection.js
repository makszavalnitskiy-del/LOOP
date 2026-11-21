export class ShadowProjection {
  /**
   * Projects all four corners of an axis-aligned rectangular obstacle onto
   * the ground plane. The resulting shadow polygon is the exact silhouette
   * between the obstacle's upper edge and the two extreme ray intersections.
   */
  static calculate({ lightX, lightY, obstacle, groundY, gapStart, gapEnd, coverageTolerance = 1 }) {
    const invalid = (reason = "invalid-geometry") => ({
      active: false,
      fullCoverage: false,
      reason,
      x: Number.isFinite(gapStart) ? gapStart : 0,
      width: 0,
      projectedLeft: null,
      projectedRight: null,
      polygon: [],
      corners: [],
      projectedCorners: [],
      coverage: 0,
      gapStart,
      gapEnd,
      gapWidth: Number.isFinite(gapStart) && Number.isFinite(gapEnd) ? Math.max(0, gapEnd - gapStart) : 0,
      rawShadowWidth: 0
    });

    if (![lightX, lightY, groundY, gapStart, gapEnd].every(Number.isFinite)) return invalid();
    if (!obstacle || ![obstacle.x, obstacle.y, obstacle.width, obstacle.height].every(Number.isFinite)) return invalid();
    if (obstacle.width <= 0 || obstacle.height <= 0 || gapEnd <= gapStart) return invalid();
    if (!Number.isFinite(coverageTolerance) || coverageTolerance < 0) return invalid();

    const left = obstacle.x;
    const right = obstacle.x + obstacle.width;
    const top = obstacle.y;
    const bottom = obstacle.y + obstacle.height;
    if (lightY >= top || groundY <= top || groundY <= lightY) {
      return invalid("light-not-above-obstacle");
    }

    const corners = [
      { x: left, y: top },
      { x: right, y: top },
      { x: right, y: bottom },
      { x: left, y: bottom }
    ];
    const projectedCorners = [];

    for (const corner of corners) {
      const denominator = corner.y - lightY;
      if (Math.abs(denominator) < 1e-9) return invalid("parallel-ray");
      const t = (groundY - lightY) / denominator;
      const projected = {
        x: lightX + (corner.x - lightX) * t,
        y: groundY
      };
      if (!Number.isFinite(projected.x)) return invalid();
      projectedCorners.push(projected);
    }

    const projectedLeft = Math.min(...projectedCorners.map(point => point.x));
    const projectedRight = Math.max(...projectedCorners.map(point => point.x));
    const rawShadowWidth = projectedRight - projectedLeft;
    const gapWidth = gapEnd - gapStart;
    const overlapLeft = Math.max(projectedLeft, gapStart);
    const overlapRight = Math.min(projectedRight, gapEnd);
    const width = Math.max(0, overlapRight - overlapLeft);
    const fullCoverage =
      projectedLeft <= gapStart + coverageTolerance &&
      projectedRight >= gapEnd - coverageTolerance;

    // The upper edge is the near boundary of the cast shadow. The two
    // extreme projections of all four corners form its far boundary.
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
      projectedCorners,
      coverage: Math.min(1, width / gapWidth),
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
      bounds.minX <= bounds.maxX && bounds.minY <= bounds.maxY &&
      point.x >= bounds.minX && point.x <= bounds.maxX &&
      point.y >= bounds.minY && point.y <= bounds.maxY);
  }

  static findFullCoveragePosition({ bounds, obstacle, groundY, gapStart, gapEnd, step = 2 }) {
    if (!bounds || !obstacle || !Number.isFinite(groundY) ||
        !Number.isFinite(gapStart) || !Number.isFinite(gapEnd) || gapEnd <= gapStart) return null;
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

  static findSensorPosition({
    bounds, obstacles, groundY, sensor, worldWidth,
    gapStart = 0, gapEnd = worldWidth, requireFullCoverage = false, step = 2
  }) {
    if (!bounds || !Array.isArray(obstacles) || !sensor ||
        !Number.isFinite(groundY) || !Number.isFinite(worldWidth) || worldWidth <= 0 ||
        !Number.isFinite(gapStart) || !Number.isFinite(gapEnd) || gapEnd <= gapStart) return null;
    const increment = Math.max(1, Number(step) || 1);
    const scan = stride => {
      for (let y = bounds.minY; y <= bounds.maxY; y += stride) {
        for (let x = bounds.minX; x <= bounds.maxX; x += stride) {
          for (const obstacle of obstacles) {
            const projection = this.calculate({
              lightX: x,
              lightY: y,
              obstacle,
              groundY,
              gapStart,
              gapEnd
            });
            if (projection.polygon.length &&
                (!requireFullCoverage || projection.fullCoverage) &&
                this.intersectsRect(projection.polygon, sensor)) {
              return { x, y, obstacleId: obstacle.id ?? null, projection };
            }
          }
        }
      }
      return null;
    };
    return scan(increment) ?? (increment === 1 ? null : scan(1));
  }

  /**
   * Returns true when a polygon and an axis-aligned sensor rectangle touch
   * or overlap. Edge and corner contact count as an intersection.
   */
  static intersectsRect(polygon, rect) {
    if (!Array.isArray(polygon) || polygon.length < 3 || !rect) return false;
    const { x, y, width, height } = rect;
    if (![x, y, width, height].every(Number.isFinite) || width < 0 || height < 0) return false;
    if (polygon.some(point => !point || !Number.isFinite(point.x) || !Number.isFinite(point.y))) return false;

    const rectangle = [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height }
    ];
    const epsilon = 1e-8;
    const orientation = (a, b, c) =>
      (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    const onSegment = (a, b, point) =>
      Math.abs(orientation(a, b, point)) <= epsilon &&
      point.x >= Math.min(a.x, b.x) - epsilon &&
      point.x <= Math.max(a.x, b.x) + epsilon &&
      point.y >= Math.min(a.y, b.y) - epsilon &&
      point.y <= Math.max(a.y, b.y) + epsilon;

    const segmentsIntersect = (a, b, c, d) => {
      const o1 = orientation(a, b, c);
      const o2 = orientation(a, b, d);
      const o3 = orientation(c, d, a);
      const o4 = orientation(c, d, b);
      const proper =
        ((o1 > epsilon && o2 < -epsilon) || (o1 < -epsilon && o2 > epsilon)) &&
        ((o3 > epsilon && o4 < -epsilon) || (o3 < -epsilon && o4 > epsilon));
      return proper || onSegment(a, b, c) || onSegment(a, b, d) ||
        onSegment(c, d, a) || onSegment(c, d, b);
    };

    const pointInPolygon = point => {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[j];
        const b = polygon[i];
        if (onSegment(a, b, point)) return true;
        if ((a.y > point.y) !== (b.y > point.y)) {
          const crossingX = a.x + ((point.y - a.y) * (b.x - a.x)) / (b.y - a.y);
          if (point.x < crossingX) inside = !inside;
        }
      }
      return inside;
    };

    // One shape contains a vertex of the other.
    const pointInRect = point =>
      point.x >= x - epsilon && point.x <= x + width + epsilon &&
      point.y >= y - epsilon && point.y <= y + height + epsilon;
    if (polygon.some(pointInRect) || rectangle.some(pointInPolygon)) return true;

    // Otherwise an edge pair must cross or touch.
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      for (let j = 0; j < rectangle.length; j++) {
        if (segmentsIntersect(a, b, rectangle[j], rectangle[(j + 1) % rectangle.length])) return true;
      }
    }
    return false;
  }
}
