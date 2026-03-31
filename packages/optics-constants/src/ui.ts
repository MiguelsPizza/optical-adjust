import { CorrectionMode, FeasibilityLevel, FocusMode, type WarningFlags } from "optics-types";
import { UNSHARP_CONTROL_RANGES } from "./optics.ts";

export const APP_COPY = {
  analyticsEyebrow: "OTF Diagnostics",
  blurHeading: "Blur",
  eyebrow: "Residual-Defocus Playground",
  lede: "Sphere-first browser optics playground with a pillbox PSF, analytic disk OTF, and reference Wiener prefiltering.",
  otfDescription:
    "The red marker shows the first zero crossing. Lower values indicate stronger ringing risk during inverse filtering.",
  otfHeading: "Analytic disk OTF",
  stabilityHeading: "Stability",
  title: "Optical Adjust",
  vergenceHeading: "Vergence",
} as const;

export const EMPTY_STATE_COPY = {
  noWarnings: "No warnings for the current configuration.",
  numberNotAvailable: "n/a",
} as const;

export const FIELD_LABELS = {
  correctionMode: "Correction mode",
  distance: "Distance (m)",
  fixedFocus: "Fixed focus (D)",
  focusMode: "Focus mode",
  manualResidual: "Manual residual (D)",
  maxWienerGain: "Max Wiener gain",
  preset: "Preset",
  pupil: "Pupil (mm)",
  screenPpi: "Screen PPI",
  sphere: "Sphere (D)",
  unsharpAmount: "Unsharp amount",
  wienerK: "Wiener K",
} as const;

export const PANEL_CAPTIONS = {
  blurredCorrected: "Retinal blur of prefiltered target",
  blurredOriginal: "Retinal blur of original",
  corrected: "Prefiltered target",
  original: "Original target",
} as const;

export const METRIC_LABELS = {
  blurDiameter: "Diameter (px)",
  blurRadius: "Radius (px)",
  dDisplay: "D_display",
  dFocus: "D_focus",
  dRes: "D_res",
  feasibility: "Feasibility",
  firstOtfZero: "First OTF zero",
  observedMaxGain: "Observed max gain",
} as const;

export const NUMBER_FORMATTING = {
  defaultDigits: 3,
  oneDecimalDigits: 1,
} as const;

export const FOCUS_MODE_OPTIONS = [
  {
    description: "Assume accommodation lands on the screen plane.",
    label: "Screen Focused",
    value: FocusMode.ScreenFocused,
  },
  {
    description: "Use the relaxed far point as the eye's focus state.",
    label: "Relaxed Far Point",
    value: FocusMode.RelaxedFarPoint,
  },
  {
    description: "Use an explicit fixed accommodation value.",
    label: "Fixed Focus",
    value: FocusMode.FixedFocus,
  },
  {
    description: "Override the model with an exact residual-defocus value.",
    label: "Manual Residual",
    value: FocusMode.ManualResidual,
  },
  {
    description: "Approximate the residual from the prescription magnitude.",
    label: "Prescription Estimate",
    value: FocusMode.PrescriptionEstimate,
  },
] as const;

export const CORRECTION_MODE_OPTIONS = [
  {
    description: "Regularized inverse filter using the blur model and Wiener controls.",
    label: "Wiener",
    value: CorrectionMode.Wiener,
  },
  {
    description: "Simple edge-enhancement baseline for comparison against the optics-aware path.",
    label: "Unsharp Mask",
    value: CorrectionMode.UnsharpMask,
  },
] as const;

export const CORRECTION_MODE_DESCRIPTIONS: Record<CorrectionMode, string> = {
  [CorrectionMode.UnsharpMask]:
    "Baseline edge-enhancement control. This does not invert the measured OTF zeros and is included as the POC comparison path.",
  [CorrectionMode.Wiener]:
    "Optics-aware inverse filter with regularization and gain capping. This is the reference prefiltering path.",
};

export const UNSHARP_AMOUNT_LABEL = `${UNSHARP_CONTROL_RANGES.amountMin.toFixed(1)}-${UNSHARP_CONTROL_RANGES.amountMax.toFixed(1)}`;

export const FEASIBILITY_LABELS: Record<FeasibilityLevel, string> = {
  [FeasibilityLevel.Good]: "Good",
  [FeasibilityLevel.Marginal]: "Marginal",
  [FeasibilityLevel.NoCorrectionNeeded]: "No Correction Needed",
  [FeasibilityLevel.Poor]: "Poor",
  [FeasibilityLevel.VeryPoor]: "Very Poor",
};

export const WARNING_LABELS: Record<keyof WarningFlags, string> = {
  astigmatismNotRendered: "Astigmatism not rendered",
  calibrationUncertainty: "Calibration uncertainty",
  largeRadiusRegime: "Large-radius regime",
  lowDefocusRegime: "Low-defocus regime",
  zeroCrossingRisk: "Zero-crossing risk",
};

export const WARNING_MESSAGES: Record<keyof WarningFlags, string> = {
  astigmatismNotRendered:
    "Cylinder and axis are stored, but the current live renderer is still sphere-first and does not yet apply directional astigmatic blur correction.",
  calibrationUncertainty:
    "The current focus mode is inferred rather than directly measured, so the residual-defocus estimate may drift with accommodation.",
  largeRadiusRegime:
    "The blur radius is in the large-kernel regime, where display sampling and ringing limits make recovery increasingly fragile.",
  lowDefocusRegime:
    "Residual defocus is below the regime where a geometric pillbox dominates, so diffraction and higher-order aberrations become comparable.",
  zeroCrossingRisk:
    "The first disk-OTF zero has fallen into a sensitive band, so inverse filtering needs stronger regularization and gain capping.",
};
