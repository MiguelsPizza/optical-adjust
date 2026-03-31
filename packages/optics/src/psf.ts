import type { Pixels, PsfKernel } from "optics-types";

function isInsidePillboxRadius(offsetX: Pixels, offsetY: Pixels, radiusPx: Pixels) {
  return Math.hypot(offsetX, offsetY) <= radiusPx;
}

function normalizeKernelWeights(kernelData: Float64Array, litSampleCount: number) {
  for (let index = 0; index < kernelData.length; index += 1) {
    kernelData[index] /= litSampleCount;
  }
}

/**
 * Builds a normalized discrete pillbox kernel whose support approximates a
 * circular defocus blur disk with the requested radius.
 *
 * Primary source for the pillbox defocus model:
 * - Strasburger, Rentschler, and Juttner, 2018
 *   https://pubmed.ncbi.nlm.nih.gov/29770182/
 */
export function createPillboxKernel(radiusPx: Pixels): PsfKernel {
  const safeRadius = Math.max(0, radiusPx);
  const radiusCells = Math.ceil(safeRadius);
  const width = radiusCells * 2 + 1;
  const height = width;
  const center = radiusCells;
  const data = new Float64Array(width * height);

  let count = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = x - center;
      const dy = y - center;
      if (isInsidePillboxRadius(dx, dy, safeRadius)) {
        data[y * width + x] = 1;
        count += 1;
      }
    }
  }

  normalizeKernelWeights(data, count);

  return {
    data,
    height,
    radiusPx: safeRadius,
    width,
  };
}
