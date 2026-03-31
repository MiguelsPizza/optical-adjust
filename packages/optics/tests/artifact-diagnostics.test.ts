import { describe, expect, test } from "vite-plus/test";

import {
  calculateClippingFraction,
  calculateRingingArtifactMetrics,
  compareCorrectionPaths,
  createPillboxKernel,
  createSlantedEdgeTarget,
} from "../src/index.ts";

describe("artifact diagnostics", () => {
  test("computes clipping fraction from out-of-range samples", () => {
    expect(calculateClippingFraction(Float64Array.from([-0.25, 0.2, 1.1, 0.8]))).toBeCloseTo(
      0.5,
      12,
    );
  });

  test("does not report ringing for an exact match", () => {
    const reference = createSlantedEdgeTarget(8, 8);
    const diagnostics = calculateRingingArtifactMetrics(reference, reference);

    expect(diagnostics.overshootFraction).toBe(0);
    expect(diagnostics.ringingEnergy).toBe(0);
  });

  test("aggressive Wiener settings increase clipping and halo diagnostics", () => {
    const image = createSlantedEdgeTarget(64, 64);
    const kernel = createPillboxKernel(2.5);
    const conservative = compareCorrectionPaths(image, kernel, {
      unsharpAmount: 1.5,
      wiener: {
        maxGain: 2,
        regularizationK: 0.05,
      },
    });
    const aggressive = compareCorrectionPaths(image, kernel, {
      unsharpAmount: 1.5,
      wiener: {
        maxGain: 16,
        regularizationK: 0.0005,
      },
    });

    expect(aggressive.wienerDiagnostics.maxWienerGain).toBeGreaterThan(
      conservative.wienerDiagnostics.maxWienerGain,
    );
    expect(aggressive.wienerDiagnostics.clippingFraction).toBeGreaterThanOrEqual(
      conservative.wienerDiagnostics.clippingFraction,
    );
    expect(aggressive.wienerDiagnostics.overshootFraction).toBeGreaterThanOrEqual(
      conservative.wienerDiagnostics.overshootFraction,
    );
    expect(aggressive.wienerDiagnostics.ringingEnergy).toBeGreaterThan(0);
  });
});
