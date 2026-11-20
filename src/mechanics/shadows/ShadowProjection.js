// Calculates the real 2D projection of an obstacle's silhouette onto a horizontal ground plane.
export class ShadowProjection {
  static calculate({ lightX, lightY, obstacle, groundY, gapStart, gapEnd }) {
    const topY = obstacle.y;
    if (lightY >= topY || groundY <= topY) {
      return { active: false, x: gapStart, width: 0, polygon: [] };
    }

    const projectX = (cornerX) => {
      const denominator = topY - lightY;
      if (Math.abs(denominator) < 0.001) return cornerX;
      const t = (groundY - lightY) / denominator;
      return lightX + (cornerX - lightX) * t;
    };

    const projectedLeft = projectX(obstacle.x);
    const projectedRight = projectX(obstacle.x + obstacle.width);
    const left = Math.max(gapStart, Math.min(projectedLeft, projectedRight));
    const right = Math.min(gapEnd, Math.max(projectedLeft, projectedRight));
    const width = Math.max(0, right - left);

    return {
      active: width >= 110,
      x: left,
      width,
      polygon: [
        { x: obstacle.x, y: topY },
        { x: obstacle.x + obstacle.width, y: topY },
        { x: projectedRight, y: groundY },
        { x: projectedLeft, y: groundY }
      ],
      projectedLeft,
      projectedRight
    };
  }
}
