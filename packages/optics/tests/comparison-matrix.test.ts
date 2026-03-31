import { describe, expect, test } from "vite-plus/test";

import { evaluateComparisonMatrix, summarizeImageQualityComparison } from "../src/index.ts";
import { DEFAULT_COMPARISON_PARAMS } from "../../../tests/support/comparison-goldens.ts";

describe("comparison matrix summaries", () => {
  test("classifies per-metric quality changes with the correct better/worse direction", () => {
    const summary = summarizeImageQualityComparison(
      {
        psnr: 12,
        rmse: 0.1,
        ssim: 0.9,
      },
      {
        psnr: 10,
        rmse: 0.2,
        ssim: 0.8,
      },
      "reference",
    );

    expect(summary.relation).toBe("better");
    expect(summary.betterMetricCount).toBe(3);
    expect(summary.worseMetricCount).toBe(0);
    expect(summary.byMetric.psnr.relation).toBe("better");
    expect(summary.byMetric.rmse.relation).toBe("better");
    expect(summary.byMetric.ssim.relation).toBe("better");
    expect(summary.byMetric.rmse.improvement).toBeCloseTo(0.1, 12);
  });

  test("reports the current shared matrix outcome explicitly", () => {
    const summary = evaluateComparisonMatrix({ params: DEFAULT_COMPARISON_PARAMS });

    expect(summary.cases).toHaveLength(12);
    expect(summary.unsharpVsBlurred.betterCaseCount).toBe(0);
    expect(summary.unsharpVsBlurred.tiedCaseCount).toBe(12);
    expect(summary.wienerVsBlurred.betterCaseCount).toBe(0);
    expect(summary.wienerVsBlurred.worseCaseCount).toBe(12);
    expect(summary.wienerVsUnsharp.betterCaseCount).toBe(0);
    expect(summary.wienerVsUnsharp.worseCaseCount).toBe(12);

    const textStrokeCase = summary.cases.find(
      (caseSummary) => caseSummary.targetSlug === "text-strokes" && caseSummary.blurRadiusPx === 1,
    );

    expect(textStrokeCase).toBeDefined();
    expect(textStrokeCase?.wienerVsBlurred.relation).toBe("worse");
    expect(textStrokeCase?.wienerVsUnsharp.relation).toBe("worse");
    expect(textStrokeCase?.unsharpVsBlurred.relation).toBe("tied");
  });
});
