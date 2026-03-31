import {
  DEFAULT_PUPIL_MM,
  DEFAULT_SCREEN_PPI,
  FEASIBILITY_THRESHOLDS,
  MILLIMETERS_PER_METER,
  WARNING_THRESHOLDS,
} from "optics-constants";
import {
  FeasibilityLevel,
  FocusMode,
  type BlurGeometryMetrics,
  type BlurResult,
  type Diopters,
  type Pixels,
  type ViewerParamsInput,
  type VergenceMetrics,
  type ViewerParams,
} from "optics-types";
import {
  calculateBlurGeometryMetrics,
  calculateDisplayVergence,
  createVergenceMetrics,
} from "./equations.ts";

interface BlurWarningContext {
  readonly blurRadiusPx: Pixels;
  readonly cylinderDiopters: Diopters;
  readonly firstOtfZero: BlurResult["firstOtfZero"];
  readonly focusMode: FocusMode;
  readonly residualDefocusDiopters: Diopters;
}

function resolveViewerParams(input: ViewerParamsInput): ViewerParams {
  return {
    ...input,
    pupilDiameterMm: input.pupilDiameterMm ?? DEFAULT_PUPIL_MM,
    screenPpi: input.screenPpi ?? DEFAULT_SCREEN_PPI,
  };
}

function deriveFocusVergence(params: ViewerParamsInput, displayVergence: Diopters): Diopters {
  const sph = params.prescription.sph;

  switch (params.focusMode) {
    case FocusMode.ScreenFocused:
      return displayVergence;
    case FocusMode.RelaxedFarPoint:
      return sph < 0 ? Math.abs(sph) : -sph;
    case FocusMode.FixedFocus:
      return params.fixedFocusDiopters ?? 0;
    case FocusMode.ManualResidual:
      return displayVergence - Math.abs(params.manualResidualDiopters ?? 0);
    case FocusMode.PrescriptionEstimate:
      return displayVergence - Math.abs(sph);
  }
}

function classifyResidualDefocusFeasibility(residualDefocusDiopters: Diopters): FeasibilityLevel {
  if (residualDefocusDiopters === 0) {
    return FeasibilityLevel.NoCorrectionNeeded;
  }
  if (residualDefocusDiopters < FEASIBILITY_THRESHOLDS.goodMaxResidualDiopters) {
    return FeasibilityLevel.Good;
  }
  if (residualDefocusDiopters < FEASIBILITY_THRESHOLDS.marginalMaxResidualDiopters) {
    return FeasibilityLevel.Marginal;
  }
  if (residualDefocusDiopters < FEASIBILITY_THRESHOLDS.poorMaxResidualDiopters) {
    return FeasibilityLevel.Poor;
  }
  return FeasibilityLevel.VeryPoor;
}

function buildWarningFlags(context: BlurWarningContext): BlurResult["warnings"] {
  return {
    astigmatismNotRendered: context.cylinderDiopters !== 0,
    calibrationUncertainty: context.focusMode !== FocusMode.ManualResidual,
    largeRadiusRegime: context.blurRadiusPx >= WARNING_THRESHOLDS.largeRadiusPx,
    lowDefocusRegime:
      context.residualDefocusDiopters < WARNING_THRESHOLDS.lowDefocusResidualDiopters ||
      context.blurRadiusPx < WARNING_THRESHOLDS.lowDefocusBlurRadiusPx,
    zeroCrossingRisk:
      context.firstOtfZero !== null &&
      context.firstOtfZero < WARNING_THRESHOLDS.zeroCrossingRiskCyclesPerPixel,
  };
}

function createBlurResult(
  params: ViewerParams,
  vergenceMetrics: VergenceMetrics,
  geometry: BlurGeometryMetrics,
): BlurResult {
  const { dDisplay, dFocus, dRes } = vergenceMetrics;

  return {
    ...geometry,
    dDisplay,
    dFocus,
    dRes,
    feasibility: classifyResidualDefocusFeasibility(dRes),
    focusMode: params.focusMode,
    prescription: params.prescription,
    pupilDiameterMm: params.pupilDiameterMm,
    screenPpi: params.screenPpi,
    viewingDistanceM: params.viewingDistanceM,
    warnings: buildWarningFlags({
      blurRadiusPx: geometry.blurRadiusPx,
      cylinderDiopters: params.prescription.cyl,
      firstOtfZero: geometry.firstOtfZero,
      focusMode: params.focusMode,
      residualDefocusDiopters: dRes,
    }),
  };
}

/**
 * Derives display vergence, focus vergence, and residual defocus for the
 * current focus-mode state.
 *
 * The focus modes implemented here follow the project research contract:
 * screen-focused, relaxed far-point, fixed-focus, manual-residual, and
 * prescription-estimate are distinct assumptions about `D_focus`, not
 * different blur formulas.
 *
 * Source summary:
 * - POC concept
 *   /Users/alexmnahas/personalRepos/optical-adjust/docs/optics_poc_concept.md
 * - Build spec
 *   /Users/alexmnahas/personalRepos/optical-adjust/docs/phase_0_3_build_spec.md
 * - Ophthalmic vergence/prescription conventions
 *   https://webeye.ophth.uiowa.edu/eyeforum/video/Refraction/Intro-Optics-Refract-Errors/index.htm
 */
export function calculateResidualDefocus(params: ViewerParamsInput): VergenceMetrics {
  const dDisplay = calculateDisplayVergence(params.viewingDistanceM);
  const dFocus = deriveFocusVergence(params, dDisplay);
  return createVergenceMetrics(dDisplay, dFocus);
}

/**
 * Runs the full residual-defocus optics chain and returns the user-facing blur
 * bundle consumed by the playground.
 *
 * Equation chain used by this result:
 * `D_display -> D_focus -> D_res -> beta_rad -> blurDiameterPx -> blurRadiusPx -> firstOtfZero`
 *
 * Primary sources:
 * - Cholewiak, Love, and Banks, 2018
 *   https://pmc.ncbi.nlm.nih.gov/articles/PMC5946648/
 * - NIST SI Units – Length
 *   https://www.nist.gov/pml/owm/si-units-length
 */
export function calculateBlurResult(input: ViewerParamsInput): BlurResult {
  const params = resolveViewerParams(input);

  const vergenceMetrics = calculateResidualDefocus(params);
  const geometry = calculateBlurGeometryMetrics(
    params.viewingDistanceM,
    params.pupilDiameterMm / MILLIMETERS_PER_METER,
    vergenceMetrics.dRes,
    params.screenPpi,
  );

  return createBlurResult(params, vergenceMetrics, geometry);
}
