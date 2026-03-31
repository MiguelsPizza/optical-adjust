import type { Grid2D } from "optics-types";

/**
 * Binary synthetic target used by the regression suite.
 */
export interface SyntheticTarget extends Grid2D<Float64Array> {}

function createFilledTarget(width: number, height: number, fill = 0): SyntheticTarget {
  return {
    data: new Float64Array(width * height).fill(fill),
    height,
    width,
  };
}

function fillRectangle(
  target: SyntheticTarget,
  startX: number,
  startY: number,
  rectWidth: number,
  rectHeight: number,
  value = 1,
) {
  const minX = Math.max(0, Math.floor(startX));
  const minY = Math.max(0, Math.floor(startY));
  const maxX = Math.min(target.width, Math.ceil(startX + rectWidth));
  const maxY = Math.min(target.height, Math.ceil(startY + rectHeight));

  for (let y = minY; y < maxY; y += 1) {
    for (let x = minX; x < maxX; x += 1) {
      target.data[y * target.width + x] = value;
    }
  }
}

/**
 * Creates a coarse text-like target made from block strokes.
 */
export function createTextStrokeTarget(width: number, height: number): SyntheticTarget {
  const target = createFilledTarget(width, height);
  const stroke = Math.max(2, Math.round(width * 0.04));

  fillRectangle(target, width * 0.12, height * 0.18, stroke, height * 0.56);
  fillRectangle(target, width * 0.12, height * 0.18, width * 0.18, stroke);
  fillRectangle(target, width * 0.12, height * 0.44, width * 0.16, stroke);

  fillRectangle(target, width * 0.42, height * 0.18, width * 0.18, stroke);
  fillRectangle(target, width * 0.42, height * 0.18, stroke, height * 0.56);
  fillRectangle(target, width * 0.42, height * 0.44, width * 0.16, stroke);
  fillRectangle(target, width * 0.42, height * 0.68, width * 0.18, stroke);

  fillRectangle(target, width * 0.72, height * 0.18, stroke, height * 0.56);
  fillRectangle(target, width * 0.72, height * 0.18, width * 0.14, stroke);
  fillRectangle(target, width * 0.72, height * 0.44, width * 0.12, stroke);

  return target;
}

function isBrightSiemensSpoke(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  spokeCount: number,
) {
  const angle = Math.atan2(y - centerY, x - centerX) + Math.PI;
  const spokeIndex = Math.floor((angle / (2 * Math.PI)) * spokeCount);
  return spokeIndex % 2 === 0;
}

/**
 * Creates a Siemens-star target for rotational frequency-response checks.
 */
export function createSiemensStarTarget(
  width: number,
  height: number,
  spokeCount = 24,
): SyntheticTarget {
  const target = createFilledTarget(width, height);
  const centerX = (width - 1) / 2;
  const centerY = (height - 1) / 2;
  const radius = Math.min(width, height) * 0.42;
  const hubRadius = radius * 0.12;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.hypot(dx, dy);
      if (distance > radius) {
        continue;
      }

      if (distance <= hubRadius) {
        target.data[y * width + x] = 1;
        continue;
      }

      target.data[y * width + x] = isBrightSiemensSpoke(x, y, centerX, centerY, spokeCount) ? 1 : 0;
    }
  }

  return target;
}

/**
 * Creates a high-contrast slanted edge target for edge-spread checks.
 */
export function createSlantedEdgeTarget(width: number, height: number): SyntheticTarget {
  const target = createFilledTarget(width, height);
  const intercept = width * 0.24;
  const slope = 0.58;

  for (let y = 0; y < height; y += 1) {
    const edgeX = intercept + y * slope;
    for (let x = 0; x < width; x += 1) {
      target.data[y * width + x] = x >= edgeX ? 1 : 0;
    }
  }

  return target;
}

function calculateCheckerBarValue(x: number, y: number, width: number, cellSize: number) {
  const isLeftHalf = x < width / 2;
  if (isLeftHalf) {
    return (Math.floor(x / cellSize) + Math.floor(y / cellSize)) % 2 === 0 ? 1 : 0;
  }

  return Math.floor((x - width / 2) / Math.max(2, cellSize / 2)) % 2 === 0 ? 1 : 0;
}

/**
 * Creates a hybrid checkerboard/bar target covering both two-dimensional and
 * one-dimensional texture structure.
 */
export function createCheckerBarTarget(width: number, height: number): SyntheticTarget {
  const target = createFilledTarget(width, height);
  const cellSize = Math.max(4, Math.round(Math.min(width, height) * 0.08));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      target.data[y * width + x] = calculateCheckerBarValue(x, y, width, cellSize);
    }
  }

  return target;
}
