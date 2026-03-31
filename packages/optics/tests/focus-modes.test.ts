import { describe, expect, test } from "vite-plus/test";
import { FocusMode } from "optics-types";

import { calculateResidualDefocus } from "../src/focus.ts";

describe("focus modes", () => {
  const base = {
    prescription: { axis: 90, cyl: 0, sph: -2 },
    pupilDiameterMm: 4,
    screenPpi: 254,
    viewingDistanceM: 0.5,
  };

  test("screen focused mode zeroes residual", () => {
    const result = calculateResidualDefocus({ ...base, focusMode: FocusMode.ScreenFocused });
    expect(result.dDisplay).toBeCloseTo(2, 12);
    expect(result.dFocus).toBeCloseTo(2, 12);
    expect(result.dRes).toBeCloseTo(0, 12);
  });

  test("relaxed far point mode uses prescription far point", () => {
    const result = calculateResidualDefocus({ ...base, focusMode: FocusMode.RelaxedFarPoint });
    expect(result.dFocus).toBeCloseTo(2, 12);
    expect(result.dRes).toBeCloseTo(0, 12);
  });

  test("fixed focus mode respects explicit focus", () => {
    const result = calculateResidualDefocus({
      ...base,
      fixedFocusDiopters: 1.25,
      focusMode: FocusMode.FixedFocus,
    });
    expect(result.dFocus).toBeCloseTo(1.25, 12);
    expect(result.dRes).toBeCloseTo(0.75, 12);
  });

  test("manual residual mode bypasses inferred focus", () => {
    const result = calculateResidualDefocus({
      ...base,
      focusMode: FocusMode.ManualResidual,
      manualResidualDiopters: 1.5,
    });
    expect(result.dRes).toBeCloseTo(1.5, 12);
    expect(result.dFocus).toBeCloseTo(0.5, 12);
  });
});
