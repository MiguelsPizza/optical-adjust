import { describe, expect, test } from "vite-plus/test";

import { clamp, createFilledArray, nextPowerOfTwo } from "../src/utils.ts";

describe("utility helpers", () => {
  test("clamps numeric ranges", () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(clamp(4, 0, 10)).toBe(4);
  });

  test("creates zero-filled and constant-filled numeric buffers", () => {
    expect(createFilledArray(4)).toEqual(Float64Array.from([0, 0, 0, 0]));
    expect(createFilledArray(4, 2)).toEqual(Float64Array.from([2, 2, 2, 2]));
  });

  test("rounds lengths up to the next power of two", () => {
    expect(nextPowerOfTwo(1)).toBe(1);
    expect(nextPowerOfTwo(17)).toBe(32);
    expect(nextPowerOfTwo(32)).toBe(32);
  });
});
