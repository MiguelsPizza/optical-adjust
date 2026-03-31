import { describe, expect, test } from "vite-plus/test";

import { compareCorrectionPaths, createPillboxKernel } from "../src/index.ts";
import {
  COMPARISON_BLUR_RADII,
  COMPARISON_FIXTURE_SIZE,
  COMPARISON_METRIC_GOLDENS,
  COMPARISON_TARGET_FACTORIES,
  DEFAULT_COMPARISON_PARAMS,
} from "../../../tests/support/comparison-goldens.ts";

describe("deconvolution pipeline", () => {
  for (const { create, name, slug } of COMPARISON_TARGET_FACTORIES) {
    test(`locks the metric-golden reference case for ${name}`, () => {
      const image = create(COMPARISON_FIXTURE_SIZE.width, COMPARISON_FIXTURE_SIZE.height);

      for (const radius of COMPARISON_BLUR_RADII) {
        const result = compareCorrectionPaths(
          image,
          createPillboxKernel(radius),
          DEFAULT_COMPARISON_PARAMS,
        );
        const key = `${slug}:${radius}` as keyof typeof COMPARISON_METRIC_GOLDENS;
        const golden = COMPARISON_METRIC_GOLDENS[key];

        expect(result.blurredOriginalQuality.rmse).toBeCloseTo(golden.blurred.rmse, 6);
        expect(result.blurredOriginalQuality.psnr).toBeCloseTo(golden.blurred.psnr, 6);
        expect(result.blurredOriginalQuality.ssim).toBeCloseTo(golden.blurred.ssim, 6);
        expect(result.unsharpRetinalQuality.rmse).toBeCloseTo(golden.unsharp.rmse, 6);
        expect(result.unsharpRetinalQuality.psnr).toBeCloseTo(golden.unsharp.psnr, 6);
        expect(result.unsharpRetinalQuality.ssim).toBeCloseTo(golden.unsharp.ssim, 6);
        expect(result.wienerRetinalQuality.rmse).toBeCloseTo(golden.wiener.rmse, 6);
        expect(result.wienerRetinalQuality.psnr).toBeCloseTo(golden.wiener.psnr, 6);
        expect(result.wienerRetinalQuality.ssim).toBeCloseTo(golden.wiener.ssim, 6);
        expect(result.wienerDiagnostics.clippingFraction).toBeCloseTo(
          golden.diagnostics.clippingFraction,
          6,
        );
        expect(result.wienerDiagnostics.overshootFraction).toBeCloseTo(
          golden.diagnostics.overshootFraction,
          6,
        );
        expect(result.wienerDiagnostics.ringingEnergy).toBeCloseTo(
          golden.diagnostics.ringingEnergy,
          6,
        );
        expect(result.wienerDiagnostics.maxWienerGain).toBeCloseTo(
          golden.diagnostics.maxWienerGain,
          6,
        );
      }
    });
  }
});
