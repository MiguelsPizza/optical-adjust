/**
 * Focus/accommodation modes supported by the residual-defocus model.
 *
 * Source ref: `docs/optics_poc_concept.md`
 */
export enum FocusMode {
  /**
   * Assume accommodation lands on the display plane.
   */
  ScreenFocused = "screenFocused",

  /**
   * Assume the eye relaxes to its far point.
   */
  RelaxedFarPoint = "relaxedFarPoint",

  /**
   * Use an explicit accommodation value supplied by the user.
   */
  FixedFocus = "fixedFocus",

  /**
   * Override the model with a directly specified residual defocus.
   */
  ManualResidual = "manualResidual",

  /**
   * Estimate accommodation from prescription magnitude.
   */
  PrescriptionEstimate = "prescriptionEstimate",
}
