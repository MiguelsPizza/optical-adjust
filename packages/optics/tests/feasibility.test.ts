import { describe, expect, test } from "vite-plus/test";
import { FeasibilityLevel, FocusMode } from "optics-types";

import { calculateBlurResult } from "../src/focus.ts";

describe("feasibility", () => {
  test("classifies residual defocus bands", () => {
    const base = {
      prescription: { axis: 0, cyl: 0, sph: -2 },
      pupilDiameterMm: 4,
      screenPpi: 254,
      viewingDistanceM: 0.5,
    };

    expect(calculateBlurResult({ ...base, focusMode: FocusMode.ScreenFocused }).feasibility).toBe(
      FeasibilityLevel.NoCorrectionNeeded,
    );
    expect(
      calculateBlurResult({
        ...base,
        focusMode: FocusMode.ManualResidual,
        manualResidualDiopters: 1,
      }).feasibility,
    ).toBe(FeasibilityLevel.Marginal);
    expect(
      calculateBlurResult({
        ...base,
        focusMode: FocusMode.ManualResidual,
        manualResidualDiopters: 3,
      }).feasibility,
    ).toBe(FeasibilityLevel.VeryPoor);
  });
});
