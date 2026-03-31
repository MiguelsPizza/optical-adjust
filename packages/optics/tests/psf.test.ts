import { describe, expect, test } from "vite-plus/test";

import { createPillboxKernel } from "../src/psf.ts";

describe("createPillboxKernel", () => {
  test("normalizes and stays symmetric", () => {
    const kernel = createPillboxKernel(2);
    const total = kernel.data.reduce((sum, value) => sum + value, 0);

    expect(total).toBeCloseTo(1, 12);
    expect(kernel.width).toBe(5);
    expect(kernel.height).toBe(5);
    expect(kernel.data[2 * kernel.width + 2]).toBeGreaterThan(0);
    expect(kernel.data[0]).toBe(0);
    expect(kernel.data[1 * kernel.width + 2]).toBe(kernel.data[3 * kernel.width + 2]);
  });

  test("clamps negative radii to a single normalized center sample", () => {
    const kernel = createPillboxKernel(-1);

    expect(kernel.radiusPx).toBe(0);
    expect(kernel.width).toBe(1);
    expect(kernel.height).toBe(1);
    expect(kernel.data[0]).toBe(1);
  });
});
