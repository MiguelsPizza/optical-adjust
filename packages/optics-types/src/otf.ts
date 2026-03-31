import type { CyclesPerPixel, UnitlessGain, UnitlessScalar } from "./units.ts";

/**
 * Sample from a one-dimensional transfer-function profile.
 */
export interface OtfSample<
  TFrequency extends CyclesPerPixel = CyclesPerPixel,
  TValue extends UnitlessScalar = UnitlessScalar,
> {
  /**
   * Spatial frequency in cycles per pixel.
   */
  readonly frequency: TFrequency;

  /**
   * Transfer-function value at the sampled frequency.
   */
  readonly value: TValue;
}

/**
 * Wiener inverse-filter controls used by the reference deconvolution path.
 *
 * Source refs:
 * - `docs/optics_poc_concept.md`
 * - `docs/equation_source_verification_notes.md`
 */
export interface WienerParams<
  TRegularization extends UnitlessScalar = UnitlessScalar,
  TMaxGain extends UnitlessGain = UnitlessGain,
> {
  /**
   * Optional hard cap applied after Wiener gain evaluation.
   */
  readonly maxGain?: TMaxGain;

  /**
   * Additive regularization term `K`.
   */
  readonly regularizationK: TRegularization;
}
