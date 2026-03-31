/**
 * Coarse user-facing feasibility buckets for the current residual defocus.
 *
 * Source refs:
 * - `docs/phase_0_3_build_spec.md`
 * - `docs/equation_source_verification_notes.md`
 */
export enum FeasibilityLevel {
  /**
   * Residual defocus is effectively zero.
   */
  NoCorrectionNeeded = "noCorrectionNeeded",

  /**
   * Recovery is expected to be stable.
   */
  Good = "good",

  /**
   * Recovery is possible but already constrained.
   */
  Marginal = "marginal",

  /**
   * Recovery quality is expected to degrade materially.
   */
  Poor = "poor",

  /**
   * Recovery is in a strongly unstable regime.
   */
  VeryPoor = "veryPoor",
}
