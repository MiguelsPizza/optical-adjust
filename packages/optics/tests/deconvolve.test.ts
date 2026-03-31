import { describe, expect, test } from "vite-plus/test";

import {
  convolveImageSpatial,
  createCheckerBarTarget,
  createPillboxKernel,
  createSiemensStarTarget,
  createSlantedEdgeTarget,
  createTextStrokeTarget,
  deconvolveImage,
  measureImageQuality,
} from "../src/index.ts";

describe("deconvolution pipeline", () => {
  const width = 64;
  const height = 64;
  const wienerParams = { maxGain: 4, regularizationK: 0.001 };
  const blurRadii = [1, 1.5, 2.5];
  const targets = [
    { image: createTextStrokeTarget(width, height), name: "text-like strokes" },
    { image: createSiemensStarTarget(width, height), name: "Siemens star" },
    { image: createSlantedEdgeTarget(width, height), name: "slanted edge" },
    { image: createCheckerBarTarget(width, height), name: "checker/bar" },
  ];

  for (const { image, name } of targets) {
    test(`prefiltered ${name} stays closer to the original after eye blur`, () => {
      for (const radius of blurRadii) {
        const kernel = createPillboxKernel(radius);
        const blurredOriginal = convolveImageSpatial(image, kernel);
        const prefiltered = deconvolveImage(image, kernel, wienerParams);
        const retinalCorrected = convolveImageSpatial(prefiltered, kernel);

        const blurredMetrics = measureImageQuality(
          image.data,
          blurredOriginal.data,
          image.width,
          image.height,
        );
        const correctedMetrics = measureImageQuality(
          image.data,
          retinalCorrected.data,
          image.width,
          image.height,
        );

        expect(correctedMetrics.rmse).toBeLessThan(blurredMetrics.rmse);
        expect(correctedMetrics.psnr).toBeGreaterThan(blurredMetrics.psnr);
        expect(correctedMetrics.ssim).toBeGreaterThan(blurredMetrics.ssim);
        expect(prefiltered.maxGainSeen).toBeLessThanOrEqual(wienerParams.maxGain);
      }
    });
  }
});
