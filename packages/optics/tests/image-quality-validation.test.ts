import { describe, expect, test } from "vite-plus/test";

import { calculateRmse } from "../src/image-quality.ts";

describe("image quality input validation", () => {
  test("rejects arrays that do not match the declared image dimensions", () => {
    expect(() => {
      calculateRmse(Float64Array.from([1, 0, 1]), Float64Array.from([1, 0, 1]), 2, 2);
    }).toThrow(/must match the provided dimensions/);
  });
});
