import { describe, expect, test } from "vite-plus/test";

import {
  calculateAiryDiskRadiusPixels,
  calculateAiryFirstMinimumAngleRad,
  calculateBlurDiameterMeters,
  calculateBlurDiameterPixels,
  calculateBlurDiameterPixelsFromMeters,
  calculateBlurGeometryMetrics,
  calculateBlurRadiusPixels,
  calculateDefocusBlurAngleRad,
  calculateDisplayVergence,
  calculateFirstDiskOtfZeroFrequency,
  calculateResidualDefocusMagnitude,
  calculateScreenPixelPitchMeters,
  createVergenceMetrics,
} from "../src/equations.ts";

describe("equation helpers", () => {
  test("computes vergence and residual defocus quantities", () => {
    expect(calculateDisplayVergence(0.5)).toBeCloseTo(2, 12);
    expect(calculateDisplayVergence(0)).toBe(0);
    expect(calculateResidualDefocusMagnitude(2, 0.5)).toBeCloseTo(1.5, 12);
    expect(createVergenceMetrics(2, 0.5)).toEqual({
      dDisplay: 2,
      dFocus: 0.5,
      dRes: 1.5,
    });
  });

  test("computes the blur equation chain from residual defocus to pixels", () => {
    const blurAngle = calculateDefocusBlurAngleRad(0.004, -1);
    expect(blurAngle).toBeCloseTo(0.004, 12);

    const blurDiameterM = calculateBlurDiameterMeters(0.5, blurAngle);
    expect(blurDiameterM).toBeCloseTo(0.002, 12);

    const pixelPitch = calculateScreenPixelPitchMeters(254);
    expect(pixelPitch).toBeCloseTo(0.0001, 6);

    expect(calculateBlurDiameterPixelsFromMeters(blurDiameterM, 254)).toBeCloseTo(20, 6);
    expect(calculateBlurDiameterPixels(0.5, 0.004, 1, 254)).toBeCloseTo(20, 6);
    expect(calculateBlurRadiusPixels(20)).toBeCloseTo(10, 12);
  });

  test("packages blur geometry metrics and disk OTF severity", () => {
    const geometry = calculateBlurGeometryMetrics(0.5, 0.004, 1, 254);

    expect(geometry.betaRad).toBeCloseTo(0.004, 12);
    expect(geometry.blurDiameterPx).toBeCloseTo(20, 6);
    expect(geometry.blurRadiusPx).toBeCloseTo(10, 6);
    expect(geometry.firstOtfZero).toBeCloseTo(0.061, 3);

    const zeroGeometry = calculateBlurGeometryMetrics(0.5, 0.004, 0, 254);
    expect(zeroGeometry.firstOtfZero).toBeNull();
    expect(calculateFirstDiskOtfZeroFrequency(0)).toBeNull();
  });

  test("grows blur monotonically as residual defocus increases", () => {
    const residuals = [0.25, 0.5, 1, 2];
    const geometries = residuals.map((residual) =>
      calculateBlurGeometryMetrics(0.5, 0.004, residual, 254),
    );

    for (let index = 1; index < geometries.length; index += 1) {
      expect(geometries[index]!.blurDiameterPx).toBeGreaterThan(
        geometries[index - 1]!.blurDiameterPx,
      );
      expect(geometries[index]!.blurRadiusPx).toBeGreaterThan(geometries[index - 1]!.blurRadiusPx);
      expect(geometries[index]!.firstOtfZero).toBeLessThan(geometries[index - 1]!.firstOtfZero!);
    }
  });

  test("computes the diffraction crossover helpers", () => {
    expect(calculateAiryFirstMinimumAngleRad(0.004)).toBeCloseTo(0.00016775, 8);
    expect(calculateAiryDiskRadiusPixels(4, 0.5, 254)).toBeGreaterThan(0.4);
    expect(calculateAiryDiskRadiusPixels(4, 0.5, 254)).toBeLessThan(1.2);
  });
});
