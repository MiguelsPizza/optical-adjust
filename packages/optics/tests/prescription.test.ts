import { describe, expect, test } from "vite-plus/test";

import { normalizeAxis, powerAtMeridian, principalMeridionalPowers } from "../src/prescription.ts";

describe("prescription helpers", () => {
  test("computes principal powers and power in any meridian", () => {
    const prescription = { axis: 90, cyl: -1, sph: -2 };
    const principal = principalMeridionalPowers(prescription);
    expect(principal.axis).toBe(-2);
    expect(principal.perpendicular).toBe(-3);
    expect(powerAtMeridian(prescription, 0)).toBeCloseTo(-3, 12);
    expect(powerAtMeridian(prescription, 90)).toBeCloseTo(-2, 12);
  });

  test("wraps axes into the standard 0 to 180 degree interval", () => {
    expect(normalizeAxis(-90)).toBe(90);
    expect(normalizeAxis(270)).toBe(90);
    expect(powerAtMeridian({ axis: -90, cyl: -1, sph: -2 }, 90)).toBeCloseTo(-2, 12);
  });
});
