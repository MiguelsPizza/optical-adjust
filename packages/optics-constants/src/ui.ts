import { FeasibilityLevel, FocusMode, type WarningFlags } from "optics-types";
import { UNSHARP_CONTROL_RANGES } from "./optics.ts";

export const APP_COPY = {
  analyticsEyebrow: "OTF Diagnostics",
  blurHeading: "Blur",
  comparisonDescription:
    "Reference Wiener and unsharp-mask baselines are rendered together so the target regime can be compared under the same residual-defocus model.",
  eyebrow: "Residual-Defocus Playground",
  lede: "Sphere-first browser optics playground with a pillbox PSF, analytic disk OTF, and reference Wiener prefiltering.",
  otfDescription:
    "The red marker shows the first zero crossing. Lower values indicate stronger ringing risk during inverse filtering.",
  otfHeading: "Analytic disk OTF",
  stabilityHeading: "Stability",
  title: "Optical Adjust",
  vergenceHeading: "Vergence",
  wipBannerLabel: "WIP",
  wipBannerTitle: "Experimental optics playground",
  wipBannerDescription:
    "This app is incomplete and not validated for real-world use. Do not treat it as accessibility, medical, or vision-care guidance.",
  aiSectionHeading: "AI-assisted setup",
  aiSectionDescription:
    "This playground exposes WebMCP tools that let any desktop AI agent (Claude Desktop, Cursor, Windsurf, etc.) read and configure the form for you. " +
    "Copy the prompt below, paste it into your AI along with your eye exam prescription, and the agent will fill everything in.",
  aiHowItWorksHeading: "How it works",
  aiHowItWorksSteps: [
    "This page registers tools on navigator.modelContext using the WebMCP standard.",
    "A local relay (embed.js) bridges those tools to your desktop AI via WebSocket on localhost.",
    "Your AI agent sees the tools as native MCP tools and can read/write the playground state.",
  ] as readonly string[],
  aiPromptLabel: "Prompt for your AI",
  aiCopyButton: "Copy prompt",
  aiCopiedButton: "Copied!",
} as const;

export const AI_SETUP_PROMPT = `You have access to the Optical Adjust playground through WebMCP tools. The page is open in my browser and the local relay is running.

I'm going to paste my eye exam prescription below. Please use it to configure the playground:

1. Call optical_adjust_list_presets to see available presets.
2. Call optical_adjust_list_focus_modes to see focus mode options.
3. Call optical_adjust_configure with the parameters from my prescription:
   - sphere: the SPH value from my prescription (in diopters, e.g. -2.25)
   - focusMode: use "RelaxedFarPoint" for a realistic myopia simulation, or "PrescriptionEstimate" if you only have the prescription and no other context
   - viewingDistanceM: typical screen distance (0.5 for laptop, 0.7 for desktop)
   - pupilDiameterMm: 4 for normal indoor lighting, 3 for bright, 5-6 for dim
4. Call optical_adjust_get_state to read back the full state and verify.
5. Call optical_adjust_explain_feasibility to check whether correction is viable.

Note: The playground currently uses the sphere (SPH) value only. Cylinder and axis are stored but not yet applied to the live renderer.

Here is my prescription:
`;

export const EMPTY_STATE_COPY = {
  noWarnings: "No warnings for the current configuration.",
  numberNotAvailable: "n/a",
} as const;

export const FIELD_LABELS = {
  distance: "Distance (m)",
  fixedFocus: "Fixed focus (D)",
  manualResidual: "Manual residual (D)",
  maxWienerGain: "Max Wiener gain",
  pupil: "Pupil (mm)",
  screenPpi: "Screen PPI",
  sphere: "Sphere (D)",
  unsharpAmount: "Unsharp amount",
  wienerK: "Wiener K",
} as const;

export const PANEL_CAPTIONS = {
  blurredOriginal: "Retinal blur of original",
  original: "Original target",
  unsharpCorrected: "Unsharp prefiltered target",
  unsharpRetinal: "Retinal blur of unsharp target",
  wienerCorrected: "Wiener prefiltered target",
  wienerRetinal: "Retinal blur of Wiener target",
} as const;

export const METRIC_LABELS = {
  blurDiameter: "Diameter (px)",
  blurRadius: "Radius (px)",
  clippingFraction: "Clipping fraction",
  dDisplay: "D_display",
  dFocus: "D_focus",
  dRes: "D_res",
  feasibility: "Feasibility",
  firstOtfZero: "First OTF zero",
  maxWienerGain: "Max Wiener gain",
  overshootFraction: "Overshoot fraction",
  ringingEnergy: "Ringing energy",
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

export const QUALITY_METRIC_LABELS = {
  blurredOriginal: "Blurred original",
  psnr: "PSNR",
  rmse: "RMSE",
  ssim: "SSIM",
  unsharpRetinal: "Unsharp retinal",
  wienerRetinal: "Wiener retinal",
} as const;

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
