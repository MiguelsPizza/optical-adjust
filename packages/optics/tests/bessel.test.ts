import { describe, expect, test } from "vite-plus/test";

import { besselJ1 } from "../src/bessel.ts";

describe("besselJ1", () => {
  test("returns known values", () => {
    expect(besselJ1(0)).toBeCloseTo(0, 12);
    expect(besselJ1(1.8411837813406593)).toBeCloseTo(0.581865, 5);
    expect(Math.abs(besselJ1(3.8317059702075125))).toBeLessThan(1e-6);
  });

  test("is odd", () => {
    expect(besselJ1(-2.5)).toBeCloseTo(-besselJ1(2.5), 10);
  });

  test("preserves odd symmetry in the asymptotic branch", () => {
    expect(besselJ1(-8)).toBeCloseTo(-besselJ1(8), 10);
  });
});
