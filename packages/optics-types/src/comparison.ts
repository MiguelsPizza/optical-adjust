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
