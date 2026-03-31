import type { FeasibilityLevel } from "./feasibility.ts";
import type { FocusMode } from "./focus-mode.ts";
import type { Prescription } from "./prescription.ts";
import type { FlagMap, Nullable } from "./shared.ts";
import type { CyclesPerPixel, Diopters, Pixels, Radians } from "./units.ts";
import type { ViewerParams } from "./viewer-params.ts";

/**
 * Stable warning identifiers surfaced by the browser playground.
 *
 * Source refs:
 * - `docs/phase_0_3_build_spec.md`
 * - `docs/equation_source_verification_notes.md`
 */
export type BlurWarningKey =
  | "astigmatismNotRendered"
  | "calibrationUncertainty"
  | "largeRadiusRegime"
  | "lowDefocusRegime"
  | "zeroCrossingRisk";

/**
 * Boolean warning state keyed by {@link BlurWarningKey}.
 */
export type WarningFlags<TKey extends BlurWarningKey = BlurWarningKey> = FlagMap<TKey>;

/**
 * Derived vergence values used by the validated blur chain.
 *
 * Source refs:
 * - `docs/optics_poc_concept.md`
 * - `docs/equation_source_verification_notes.md`
 */
export interface VergenceMetrics<TValue extends Diopters = Diopters> {
  /**
   * Display vergence in diopters.
   */
  readonly dDisplay: TValue;

  /**
   * Eye focus vergence in diopters.
   */
  readonly dFocus: TValue;

  /**
   * Residual defocus magnitude in diopters.
   */
  readonly dRes: TValue;
}

/**
 * Geometric blur metrics produced from residual defocus and pupil size.
 *
 * Source refs:
 * - `docs/optics_poc_concept.md`
 * - `docs/equation_source_verification_notes.md`
 */
export interface BlurGeometryMetrics<
  TAngle extends Radians = Radians,
  TDistancePixels extends Pixels = Pixels,
  TFrequency extends CyclesPerPixel = CyclesPerPixel,
> {
  /**
   * Geometric blur angle in radians.
   */
  readonly betaRad: TAngle;

  /**
   * Blur-disk diameter in display pixels.
   */
  readonly blurDiameterPx: TDistancePixels;

  /**
   * Blur-disk radius in display pixels.
   */
  readonly blurRadiusPx: TDistancePixels;

  /**
   * First analytic disk-OTF zero in cycles per pixel, or `null` when the blur
   * radius is zero.
   */
  readonly firstOtfZero: Nullable<TFrequency>;
}

/**
 * Complete result returned by the residual-defocus optics model.
 */
export interface BlurResult<
  TPrescription extends Prescription = Prescription,
  TFocusMode extends FocusMode = FocusMode,
  TWarnings extends WarningFlags = WarningFlags,
>
  extends ViewerParams<TPrescription, TFocusMode>, VergenceMetrics, BlurGeometryMetrics {
  /**
   * Heuristic feasibility bucket for the current residual-defocus regime.
   */
  readonly feasibility: FeasibilityLevel;

  /**
   * Stable warning state for UI messaging and diagnostics.
   */
  readonly warnings: TWarnings;
}
