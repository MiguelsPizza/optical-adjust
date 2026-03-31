import { describe, expect, test } from "vite-plus/test";
import { DEFAULT_PLAYGROUND_PRESET } from "optics-constants";
import { FocusMode } from "optics-types";

import { calculateBlurResult } from "../src/focus.ts";

describe("blur-result defaults and warning flags", () => {
  test("defaults the playground to the right-eye sphere-only preset", () => {
    expect(DEFAULT_PLAYGROUND_PRESET.key).toBe("alex-right-eye");
    expect(DEFAULT_PLAYGROUND_PRESET.params.prescription.sph).toBe(-2.25);
    expect(DEFAULT_PLAYGROUND_PRESET.params.prescription.cyl).toBe(0);
    expect(DEFAULT_PLAYGROUND_PRESET.params.prescription.axis).toBe(0);
  });

  test("preserves explicit zero pupil and screen values instead of silently defaulting them", () => {
    const result = calculateBlurResult({
      focusMode: FocusMode.ManualResidual,
      manualResidualDiopters: 0.1,
      prescription: { axis: 0, cyl: 0, sph: 0 },
      pupilDiameterMm: 0,
      screenPpi: 0,
      viewingDistanceM: 0.5,
    });

    expect(result.pupilDiameterMm).toBe(0);
    expect(result.screenPpi).toBe(0);
  });

  test("marks inferred focus states as calibration-uncertain", () => {
    const inferred = calculateBlurResult({
      focusMode: FocusMode.RelaxedFarPoint,
      prescription: { axis: 0, cyl: 0, sph: -2 },
      pupilDiameterMm: 4,
      screenPpi: 254,
      viewingDistanceM: 0.5,
    });
    const manual = calculateBlurResult({
      focusMode: FocusMode.ManualResidual,
      manualResidualDiopters: 1,
      prescription: { axis: 0, cyl: 0, sph: 0 },
      pupilDiameterMm: 4,
      screenPpi: 254,
      viewingDistanceM: 0.5,
    });

    expect(inferred.warnings.calibrationUncertainty).toBe(true);
    expect(manual.warnings.calibrationUncertainty).toBe(false);
  });

  test("surfaces low-defocus, large-radius, and zero-crossing warning regimes", () => {
    const lowDefocus = calculateBlurResult({
      focusMode: FocusMode.ManualResidual,
      manualResidualDiopters: 0.1,
      prescription: { axis: 0, cyl: 0, sph: 0 },
      pupilDiameterMm: 4,
      screenPpi: 254,
      viewingDistanceM: 0.5,
    });
    const largeBlur = calculateBlurResult({
      focusMode: FocusMode.ManualResidual,
      manualResidualDiopters: 3,
      prescription: { axis: 0, cyl: 0, sph: 0 },
      pupilDiameterMm: 4,
      screenPpi: 254,
      viewingDistanceM: 0.5,
    });

    expect(lowDefocus.warnings.lowDefocusRegime).toBe(true);
    expect(lowDefocus.warnings.zeroCrossingRisk).toBe(false);
    expect(largeBlur.warnings.largeRadiusRegime).toBe(true);
    expect(largeBlur.warnings.zeroCrossingRisk).toBe(true);
  });

  test("warns when cylinder is present but the current renderer is still sphere-first", () => {
    const spherical = calculateBlurResult({
      focusMode: FocusMode.RelaxedFarPoint,
      prescription: { axis: 0, cyl: 0, sph: -2.25 },
      pupilDiameterMm: 4,
      screenPpi: 254,
      viewingDistanceM: 0.61,
    });
    const astigmatic = calculateBlurResult({
      focusMode: FocusMode.RelaxedFarPoint,
      prescription: { axis: 170, cyl: -0.5, sph: -2.5 },
      pupilDiameterMm: 4,
      screenPpi: 254,
      viewingDistanceM: 0.61,
    });

    expect(spherical.warnings.astigmatismNotRendered).toBe(false);
    expect(astigmatic.warnings.astigmatismNotRendered).toBe(true);
  });

  test("uses zero diopters when fixed-focus and manual-residual inputs are omitted", () => {
    const fixedFocus = calculateBlurResult({
      focusMode: FocusMode.FixedFocus,
      prescription: { axis: 0, cyl: 0, sph: 0 },
      pupilDiameterMm: 4,
      screenPpi: 254,
      viewingDistanceM: 0.5,
    });
    const manualResidual = calculateBlurResult({
      focusMode: FocusMode.ManualResidual,
      prescription: { axis: 0, cyl: 0, sph: 0 },
      pupilDiameterMm: 4,
      screenPpi: 254,
      viewingDistanceM: 0.5,
    });

    expect(fixedFocus.dFocus).toBe(0);
    expect(manualResidual.dFocus).toBe(2);
    expect(manualResidual.dRes).toBe(0);
  });
});
