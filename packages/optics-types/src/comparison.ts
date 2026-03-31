import type { ImageGrid } from "./image-grid.ts";
import type { WienerParams } from "./otf.ts";
import type { UnitlessGain, UnitlessScalar } from "./units.ts";

/**
 * Global image-similarity metrics used by the numeric regression tests and the
 * browser comparison UI.
 */
export interface ImageQualityMetrics {
  readonly psnr: UnitlessScalar;
  readonly rmse: UnitlessScalar;
  readonly ssim: UnitlessScalar;
}

export type ImageQualityMetricName = keyof ImageQualityMetrics;
export type QualityComparisonRelation = "better" | "mixed" | "tied" | "worse";

export interface ImageQualityMetricDelta {
  readonly candidateValue: UnitlessScalar;
  readonly improvement: UnitlessScalar;
  readonly referenceValue: UnitlessScalar;
  readonly relation: Exclude<QualityComparisonRelation, "mixed">;
}

export interface ImageQualityComparisonSummary {
  readonly betterMetricCount: number;
  readonly byMetric: Record<ImageQualityMetricName, ImageQualityMetricDelta>;
  readonly referenceLabel: string;
  readonly relation: QualityComparisonRelation;
  readonly tiedMetricCount: number;
  readonly worseMetricCount: number;
}

export interface AggregateQualityComparisonSummary {
  readonly betterCaseCount: number;
  readonly mixedCaseCount: number;
  readonly referenceLabel: string;
  readonly tiedCaseCount: number;
  readonly totalCaseCount: number;
  readonly worseCaseCount: number;
}

export interface ComparisonMatrixCaseSummary {
  readonly blurRadiusPx: number;
  readonly targetLabel: string;
  readonly targetSlug: string;
  readonly unsharpVsBlurred: ImageQualityComparisonSummary;
  readonly wienerDiagnostics: ArtifactDiagnostics;
  readonly wienerVsBlurred: ImageQualityComparisonSummary;
  readonly wienerVsUnsharp: ImageQualityComparisonSummary;
}

export interface ComparisonMatrixSummary {
  readonly cases: readonly ComparisonMatrixCaseSummary[];
  readonly unsharpVsBlurred: AggregateQualityComparisonSummary;
  readonly wienerVsBlurred: AggregateQualityComparisonSummary;
  readonly wienerVsUnsharp: AggregateQualityComparisonSummary;
}

/**
 * Artifact diagnostics reported for the Wiener reference path.
 *
 * Source refs:
 * - `docs/phase_0_3_build_spec.md`
 * - `docs/equation_source_verification_notes.md`
 */
export interface ArtifactDiagnostics {
  readonly clippingFraction: UnitlessScalar;
  readonly maxWienerGain: UnitlessGain;
  readonly overshootFraction: UnitlessScalar;
  readonly ringingEnergy: UnitlessScalar;
}

/**
 * Controls for the simple spatial unsharp-mask reference path.
 */
export interface UnsharpMaskParams {
  /**
   * Strength multiplier applied to the high-frequency residual.
   */
  readonly amount: number;
}

/**
 * Shared comparison controls used by the deterministic correction benchmark.
 */
export interface ComparisonPathParams {
  /**
   * Strength parameter for the unsharp-mask baseline path.
   */
  readonly unsharpAmount: UnsharpMaskParams["amount"];

  /**
   * Parameters for the Wiener deconvolution path.
   */
  readonly wiener: WienerParams;
}

/**
 * Complete deterministic comparison result for a single synthetic target,
 * blur kernel, and correction-parameter set.
 */
export interface ComparisonCaseResult {
  readonly blurredOriginal: ImageGrid;
  readonly blurredOriginalQuality: ImageQualityMetrics;
  readonly unsharpCorrected: ImageGrid;
  readonly unsharpRetinal: ImageGrid;
  readonly unsharpRetinalQuality: ImageQualityMetrics;
  readonly wienerCorrected: ImageGrid;
  readonly wienerDiagnostics: ArtifactDiagnostics;
  readonly wienerRetinal: ImageGrid;
  readonly wienerRetinalQuality: ImageQualityMetrics;
}
