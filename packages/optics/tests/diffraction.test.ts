import { describe, expect, test } from "vite-plus/test";

import { airyDiskRadiusPx } from "../src/diffraction.ts";

describe("diffraction crossover", () => {
  test("stays around one pixel for a 4 mm pupil at laptop distance", () => {
    expect(airyDiskRadiusPx(4, 0.5, 254)).toBeGreaterThan(0.4);
    expect(airyDiskRadiusPx(4, 0.5, 254)).toBeLessThan(1.2);
  });
});
