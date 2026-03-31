import { describe, expect, test } from "vite-plus/test";

import { fft1d, fft2d } from "../src/fft.ts";

describe("fft", () => {
  test("round-trips a 1d signal", () => {
    const signal = Float64Array.from([0, 1, 0, -1, 0, 1, 0, -1]);
    const transformed = fft1d(signal);
    const restored = fft1d(transformed.real, transformed.imag, true);
    restored.real.forEach((value, index) => {
      expect(value).toBeCloseTo(signal[index], 10);
    });
  });

  test("round-trips a 2d signal", () => {
    const signal = Float64Array.from([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const transformed = fft2d(signal, 4, 4);
    const restored = fft2d(transformed.real, 4, 4, true, transformed.imag);
    expect(restored.real[0]).toBeCloseTo(1, 10);
    expect(restored.real.slice(1).every((value) => Math.abs(value) < 1e-10)).toBe(true);
  });

  test("rejects non-power-of-two lengths", () => {
    expect(() => fft1d(Float64Array.from([1, 2, 3]))).toThrow(/power of two/);
  });
});
