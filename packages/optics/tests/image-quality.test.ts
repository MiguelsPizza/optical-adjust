import { describe, expect, test } from "vite-plus/test";

import {
  calculateLuminanceSsim,
  calculatePsnr,
  calculateRmse,
  createCheckerBarTarget,
  createSiemensStarTarget,
  createSlantedEdgeTarget,
  createTextStrokeTarget,
  measureImageQuality,
} from "../src/index.ts";

describe("image quality utilities", () => {
  test("report exact agreement for identical images", () => {
    const image = createTextStrokeTarget(32, 32);
    const metrics = measureImageQuality(image.data, image.data, image.width, image.height);

    expect(metrics.rmse).toBe(0);
    expect(metrics.psnr).toBe(Number.POSITIVE_INFINITY);
    expect(metrics.ssim).toBeCloseTo(1, 12);
  });

  test("degrade as images diverge", () => {
    const width = 8;
    const height = 8;
    const reference = new Float64Array(width * height).fill(1);
    const candidate = new Float64Array(width * height).fill(0);

    expect(calculateRmse(reference, candidate, width, height)).toBeCloseTo(1, 12);
    expect(calculatePsnr(reference, candidate, width, height)).toBeCloseTo(0, 12);
    expect(calculateLuminanceSsim(reference, candidate, width, height)).toBeLessThan(0.001);
  });

  test("builds the synthetic regression targets with real structure", () => {
    const targets = [
      createTextStrokeTarget(64, 64),
      createSiemensStarTarget(64, 64),
      createSlantedEdgeTarget(64, 64),
      createCheckerBarTarget(64, 64),
    ];

    for (const target of targets) {
      const litPixels = target.data.reduce((sum, value) => sum + (value > 0 ? 1 : 0), 0);
      expect(litPixels).toBeGreaterThan(target.width * target.height * 0.15);
      expect(litPixels).toBeLessThan(target.width * target.height * 0.85);
    }
  });
});
