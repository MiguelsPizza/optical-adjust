import { describe, expect, test } from "vite-plus/test";
import { FocusMode, type ViewerParams } from "optics-types";

import { calculateBlurResult } from "../src/focus.ts";

function createParams(overrides: Partial<ViewerParams>): ViewerParams {
  return {
    focusMode: FocusMode.RelaxedFarPoint,
    prescription: { axis: 0, cyl: 0, sph: -1 },
    pupilDiameterMm: 4,
    screenPpi: 254,
    viewingDistanceM: 0.5,
    ...overrides,
  };
}

describe("calculateBlurResult", () => {
  test("matches verified 50 cm / 254 ppi / 4 mm examples", () => {
    const scenarios = [
      { dRes: 1, focusMode: FocusMode.PrescriptionEstimate, sph: -1 },
      { dRes: 2, focusMode: FocusMode.PrescriptionEstimate, sph: -2 },
      { dRes: 0, focusMode: FocusMode.RelaxedFarPoint, sph: -2 },
      { dRes: 1, focusMode: FocusMode.RelaxedFarPoint, sph: -3 },
      { dRes: 3, focusMode: FocusMode.RelaxedFarPoint, sph: 1 },
    ];

    for (const scenario of scenarios) {
      const result = calculateBlurResult(
        createParams({
          focusMode: scenario.focusMode,
          prescription: { axis: 0, cyl: 0, sph: scenario.sph },
        }),
      );

      expect(result.dRes).toBeCloseTo(scenario.dRes, 12);
      expect(result.blurDiameterPx).toBeCloseTo(20 * scenario.dRes, 6);
      expect(result.blurRadiusPx).toBeCloseTo(10 * scenario.dRes, 6);
    }
  });
});
