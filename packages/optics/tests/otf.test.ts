import { describe, expect, test } from "vite-plus/test";

import { numericOtfAtFrequency, analyticDiskOtf } from "../src/otf.ts";
import { createPillboxKernel } from "../src/psf.ts";

describe("numeric OTF", () => {
  test("tracks the analytic disk curve at low frequencies", () => {
    const kernel = createPillboxKernel(5);
    const frequencies = [0, 0.02, 0.04, 0.06];

    for (const frequency of frequencies) {
      expect(numericOtfAtFrequency(kernel, frequency)).toBeCloseTo(
        analyticDiskOtf(5, frequency),
        1,
      );
    }
  });
});
