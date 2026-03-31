import { describe, expect, test } from "vite-plus/test";

import { compareCorrectionPaths, createPillboxKernel } from "../src/index.ts";
import {
  COMPARISON_BLUR_RADII,
  COMPARISON_FIXTURE_SIZE,
  COMPARISON_TARGET_FACTORIES,
  DEFAULT_COMPARISON_PARAMS,
} from "../../../tests/support/comparison-goldens.ts";

describe("correction-path comparison", () => {
  test("keeps every path identical when the blur radius is zero and Wiener regularization is disabled", () => {
    const target = COMPARISON_TARGET_FACTORIES[0]!.create(
      COMPARISON_FIXTURE_SIZE.width,
      COMPARISON_FIXTURE_SIZE.height,
    );
    const result = compareCorrectionPaths(target, createPillboxKernel(0), {
      unsharpAmount: DEFAULT_COMPARISON_PARAMS.unsharpAmount,
      wiener: {
        regularizationK: 0,
      },
    });

    expect(result.blurredOriginalQuality.rmse).toBeCloseTo(0, 12);
    expect(result.unsharpRetinalQuality.rmse).toBeCloseTo(0, 12);
    expect(result.wienerRetinalQuality.rmse).toBeCloseTo(0, 12);
    expect(result.wienerDiagnostics.clippingFraction).toBe(0);
    expect(result.wienerDiagnostics.overshootFraction).toBe(0);
    expect(result.wienerDiagnostics.ringingEnergy).toBe(0);
    expect(result.wienerDiagnostics.maxWienerGain).toBeCloseTo(1, 12);
  });

  for (const { create, name } of COMPARISON_TARGET_FACTORIES) {
    test(`produces deterministic image bundles and bounded metrics for ${name}`, () => {
      const image = create(COMPARISON_FIXTURE_SIZE.width, COMPARISON_FIXTURE_SIZE.height);

      for (const radius of COMPARISON_BLUR_RADII) {
        const result = compareCorrectionPaths(
          image,
          createPillboxKernel(radius),
          DEFAULT_COMPARISON_PARAMS,
        );

        expect(result.blurredOriginal.data.length).toBe(image.data.length);
        expect(result.unsharpCorrected.data.length).toBe(image.data.length);
        expect(result.unsharpRetinal.data.length).toBe(image.data.length);
        expect(result.wienerCorrected.data.length).toBe(image.data.length);
        expect(result.wienerRetinal.data.length).toBe(image.data.length);

        expect(result.blurredOriginalQuality.rmse).toBeGreaterThan(0);
        expect(result.unsharpRetinalQuality.rmse).toBeGreaterThan(0);
        expect(result.wienerRetinalQuality.rmse).toBeGreaterThan(0);
        expect(result.wienerDiagnostics.clippingFraction).toBeGreaterThanOrEqual(0);
        expect(result.wienerDiagnostics.overshootFraction).toBeGreaterThanOrEqual(0);
        expect(result.wienerDiagnostics.ringingEnergy).toBeGreaterThanOrEqual(0);
        expect(result.wienerDiagnostics.maxWienerGain).toBeLessThanOrEqual(
          DEFAULT_COMPARISON_PARAMS.wiener.maxGain,
        );
      }
    });
  }
});
