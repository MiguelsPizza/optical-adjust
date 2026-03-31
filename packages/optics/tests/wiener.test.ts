import { describe, expect, test } from "vite-plus/test";

import { wienerGain } from "../src/wiener.ts";

describe("wienerGain", () => {
  test("stabilizes inversion and respects caps", () => {
    const dc = wienerGain(1, 0, { regularizationK: 0.1 });
    expect(dc.real).toBeCloseTo(1 / 1.1, 12);
    expect(dc.imag).toBeCloseTo(0, 12);

    const zero = wienerGain(0, 0, { regularizationK: 0.1 });
    expect(zero.real).toBe(0);
    expect(zero.imag).toBe(0);

    const capped = wienerGain(0.01, 0, { maxGain: 2, regularizationK: 0 });
    expect(capped.gainMagnitude).toBeCloseTo(2, 12);
  });

  test("returns zero gain when the inverse denominator collapses to zero", () => {
    const zero = wienerGain(0, 0, { regularizationK: 0 });

    expect(zero.gainMagnitude).toBe(0);
    expect(zero.real).toBe(0);
    expect(zero.imag).toBe(0);
  });
});
