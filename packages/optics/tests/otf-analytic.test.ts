import { describe, expect, test } from "vite-plus/test";

import { analyticDiskOtf, firstOtfZero, sampleAnalyticOtf } from "../src/otf.ts";

describe("analyticDiskOtf", () => {
  test("matches known disk OTF values", () => {
    expect(analyticDiskOtf(10, 0)).toBeCloseTo(1, 12);
    expect(analyticDiskOtf(10, 0.02)).toBeCloseTo(0.815, 2);
    expect(analyticDiskOtf(10, 0.05)).toBeCloseTo(0.181, 2);
    expect(analyticDiskOtf(10, 0.1)).toBeLessThan(0);
    expect(firstOtfZero(10)).toBeCloseTo(0.061, 3);
  });

  test("returns neutral OTF samples when the blur radius is zero", () => {
    expect(analyticDiskOtf(0, 0.2)).toBe(1);
    expect(firstOtfZero(0)).toBeNull();

    const samples = sampleAnalyticOtf(2, 1, 0.25);
    expect(samples).toHaveLength(1);
    expect(samples[0]?.frequency).toBe(0);
    expect(samples[0]?.value).toBeCloseTo(1, 12);
  });
});
