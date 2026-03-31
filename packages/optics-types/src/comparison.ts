import type { ImageGrid } from "./image-grid.ts";
import type { UnitlessGain, UnitlessScalar } from "./units.ts";

/**
 * Global image-similarity metrics used by the numeric regression tests and the
 * browser comparison UI.
 */
export interface ImageQualityMetrics {
  psnr: UnitlessScalar;
  rmse: UnitlessScalar;
  ssim: UnitlessScalar;
}

/**
 * Artifact diagnostics reported for the Wiener reference path.
 *
 * Source refs:
 * - `docs/phase_0_3_build_spec.md`
 * - `docs/equation_source_verification_notes.md`
 */
export interface ArtifactDiagnostics {
  clippingFraction: UnitlessScalar;
  maxWienerGain: UnitlessGain;
  overshootFraction: UnitlessScalar;
  ringingEnergy: UnitlessScalar;
}

/**
 * Complete deterministic comparison result for a single synthetic target,
 * blur kernel, and correction-parameter set.
 */
export interface ComparisonCaseResult {
  blurredOriginal: ImageGrid;
  blurredOriginalQuality: ImageQualityMetrics;
  unsharpCorrected: ImageGrid;
  unsharpRetinal: ImageGrid;
  unsharpRetinalQuality: ImageQualityMetrics;
  wienerCorrected: ImageGrid;
  wienerDiagnostics: ArtifactDiagnostics;
  wienerRetinal: ImageGrid;
  wienerRetinalQuality: ImageQualityMetrics;
}
