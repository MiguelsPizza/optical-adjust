import { FeasibilityLevel } from "optics-types";

export const MILLIMETERS_PER_METER = 1000;
/**
 * Standard radians-to-degrees conversion factor.
 *
 * @remarks Not consumed yet — `prescription.ts` inlines `* Math.PI / 180`.
 * Use this constant when adding user-facing angle displays or debugging
 * output that needs degree formatting.
 */
export const DEGREES_PER_RADIAN = 180 / Math.PI;

/**
 * Inches-to-meters conversion used by the verified blur-to-pixel equation:
 * `b_px ≈ z · p · |D_res| / (0.0254 / PPI)`.
 *
 * Source refs:
 * - `docs/optics_poc_concept.md`
 * - `docs/equation_source_verification_notes.md`
 */
export const METERS_PER_INCH = 0.0254;

/**
 * Grounded default pupil diameter for the manual-first playground.
 *
 * Source refs:
 * - `docs/optics_poc_concept.md`
 * - `docs/phase_0_3_build_spec.md`
 */
export const DEFAULT_PUPIL_MM = 4;
export const MIN_PUPIL_MM = 2;
export const MAX_PUPIL_MM = 8;
export const PUPIL_INPUT_STEP_MM = 0.1;

/**
 * Default high-density laptop panel used in the verified example math.
 *
 * Source refs:
 * - `docs/optics_poc_concept.md`
 * - `docs/equation_source_verification_notes.md`
 */
export const DEFAULT_SCREEN_PPI = 254;
export const MIN_SCREEN_PPI = 100;
export const SCREEN_PPI_INPUT_STEP = 1;

/**
 * Default viewing distance for the personalized laptop startup state.
 *
 * This is approximately 2 feet (`0.61 m`), matching the current default
 * playground setup for Alex's laptop-distance testing.
 */
export const DEFAULT_VIEWING_DISTANCE_M = 0.61;
export const VIEWING_DISTANCE_INPUT_STEP_M = 0.05;
export const DIOPTER_INPUT_STEP = 0.25;

/**
 * First zero of the Bessel J1 function.
 *
 * Source ref: `docs/equation_source_verification_notes.md`
 *
 * @remarks Provenance constant — `OTF_ZERO_COEFFICIENT` (0.61) is derived as
 * `BESSEL_J1_FIRST_ZERO / (2 * PI)`. Kept for traceability; use when
 * computing OTF zeros from first principles rather than the pre-baked
 * coefficient.
 */
export const BESSEL_J1_FIRST_ZERO = 3.8317059702075125;

/**
 * Derived disk-OTF first-zero coefficient in cycles per pixel:
 * `rho_0 ≈ 0.610 / R`.
 *
 * Source refs:
 * - `docs/optics_poc_concept.md`
 * - `docs/equation_source_verification_notes.md`
 */
export const OTF_ZERO_COEFFICIENT = 0.61;
export const MAX_DISPLAY_SPATIAL_FREQUENCY = 0.5;
export const ANALYTIC_OTF_SAMPLE_COUNT = 64;
export const OTF_NEAR_ZERO_EPSILON = 1e-12;

/**
 * Reference wavelength used for the Airy-disk crossover sanity check.
 *
 * Source ref: `docs/equation_source_verification_notes.md`
 */
export const DIFFRACTION_WAVELENGTH_M = 550e-9;

/**
 * Circular-aperture Airy first-minimum factor.
 *
 * Source ref: `docs/equation_source_verification_notes.md`
 */
export const AIRY_FIRST_MINIMUM_FACTOR = 1.22;

/**
 * Residual-defocus thresholds for feasibility buckets.
 *
 * Source refs:
 * - `docs/phase_0_3_build_spec.md`
 * - `docs/equation_source_verification_notes.md`
 */
export const FEASIBILITY_THRESHOLDS = {
  goodMaxResidualDiopters: 0.5,
  marginalMaxResidualDiopters: 2,
  poorMaxResidualDiopters: 3,
} as const;

/**
 * Feasibility levels ordered from best to worst.
 *
 * @remarks Not consumed yet. Use for ranking, sorting, or comparison logic
 * (e.g. "is the current level at least Marginal?") rather than hardcoding
 * if/else chains against individual enum values.
 */
export const FEASIBILITY_ORDER = [
  FeasibilityLevel.NoCorrectionNeeded,
  FeasibilityLevel.Good,
  FeasibilityLevel.Marginal,
  FeasibilityLevel.Poor,
  FeasibilityLevel.VeryPoor,
] as const;

/**
 * Warning thresholds exposed by the updated UI contract.
 *
 * Source refs:
 * - `docs/phase_0_3_build_spec.md`
 * - `docs/equation_source_verification_notes.md`
 */
export const WARNING_THRESHOLDS = {
  largeRadiusPx: 20,
  lowDefocusBlurRadiusPx: 1,
  lowDefocusResidualDiopters: 0.25,
  zeroCrossingRiskCyclesPerPixel: 0.1,
} as const;

/**
 * Default Wiener controls for the reference playground.
 *
 * Source refs:
 * - `docs/optics_poc_concept.md`
 * - `docs/phase_0_3_build_spec.md`
 */
export const WIENER_DEFAULTS = {
  maxGain: 8,
  regularizationK: 0.03,
} as const;

export const UNSHARP_DEFAULTS = {
  amount: 1.5,
} as const;

export const WIENER_CONTROL_RANGES = {
  maxGainMax: 16,
  maxGainMin: 1,
  maxGainStep: 0.5,
  regularizationKMax: 0.2,
  regularizationKMin: 0.001,
  regularizationKStep: 0.001,
} as const;

export const UNSHARP_CONTROL_RANGES = {
  amountMax: 3,
  amountMin: 0,
  amountStep: 0.1,
} as const;

export const MERIDIAN_AXIS_PERIOD_DEGREES = 180;
export const COMPLEX_COMPONENT_EPSILON = 1e-15;
