import type { InferJsonSchema, JsonSchemaForInference } from "@mcp-b/webmcp-types";
import {
  FOCUS_MODE_OPTIONS,
  MAX_PUPIL_MM,
  MIN_PUPIL_MM,
  MIN_SCREEN_PPI,
  PLAYGROUND_PRESETS,
  WIENER_CONTROL_RANGES,
} from "optics-constants";

import { PLAYGROUND_NUMERIC_CONTROL_RULES } from "./playground-controls.ts";

export const VALID_PRESET_KEYS = new Set<string>(PLAYGROUND_PRESETS.map((preset) => preset.key));

export const EMPTY_INPUT_SCHEMA = {
  additionalProperties: false,
  properties: {},
  type: "object",
} as const satisfies JsonSchemaForInference;

export const CONFIGURE_INPUT_SCHEMA = {
  additionalProperties: false,
  properties: {
    preset: {
      description: `Preset key. Options: ${PLAYGROUND_PRESETS.map((preset) => `"${preset.key}" (${preset.label})`).join(", ")}`,
      type: "string",
    },
    focusMode: {
      description: `Focus mode value. Options: ${FOCUS_MODE_OPTIONS.map((mode) => `"${mode.value}" (${mode.label})`).join(", ")}`,
      type: "string",
    },
    sphere: {
      description: "Sphere power in diopters (e.g. -2.0 for myopia, +1.5 for hyperopia)",
      type: "number",
    },
    viewingDistanceM: {
      description: "Viewing distance in meters (e.g. 0.5 for 50cm)",
      type: "number",
    },
    pupilDiameterMm: {
      description: `Pupil diameter in mm (${MIN_PUPIL_MM}-${MAX_PUPIL_MM})`,
      type: "number",
    },
    screenPpi: {
      description: `Screen pixels per inch (min ${MIN_SCREEN_PPI})`,
      type: "number",
    },
    wienerK: {
      description: `Wiener regularization K (${WIENER_CONTROL_RANGES.regularizationKMin}-${WIENER_CONTROL_RANGES.regularizationKMax})`,
      type: "number",
    },
    maxGain: {
      description: `Max Wiener gain cap (${WIENER_CONTROL_RANGES.maxGainMin}-${WIENER_CONTROL_RANGES.maxGainMax})`,
      type: "number",
    },
    unsharpAmount: {
      description: "Unsharp masking amount for the baseline correction mode",
      type: "number",
    },
    fixedFocusDiopters: {
      description:
        "Fixed focus accommodation value in diopters (only used when focusMode is FixedFocus)",
      type: "number",
    },
    manualResidualDiopters: {
      description:
        "Manual residual defocus override in diopters (only used when focusMode is ManualResidual)",
      type: "number",
    },
  },
  type: "object",
} as const satisfies JsonSchemaForInference;

const NUMERIC_OR_NULL_SCHEMA = {
  type: ["number", "null"],
} as const satisfies JsonSchemaForInference;

const QUALITY_METRICS_SCHEMA = {
  additionalProperties: false,
  properties: {
    psnr: { type: "string" },
    rmse: { type: "string" },
    ssim: { type: "string" },
  },
  required: ["psnr", "rmse", "ssim"],
  type: "object",
} as const satisfies JsonSchemaForInference;

export const GET_STATE_OUTPUT_SCHEMA = {
  additionalProperties: false,
  properties: {
    blur: {
      additionalProperties: false,
      properties: {
        diameterPx: { type: "string" },
        firstOtfZero: { type: "string" },
        radiusPx: { type: "string" },
      },
      required: ["diameterPx", "firstOtfZero", "radiusPx"],
      type: "object",
    },
    comparison: {
      additionalProperties: false,
      properties: {
        blurredOriginal: QUALITY_METRICS_SCHEMA,
        unsharpRetinal: QUALITY_METRICS_SCHEMA,
        wienerRetinal: QUALITY_METRICS_SCHEMA,
      },
      required: ["blurredOriginal", "unsharpRetinal", "wienerRetinal"],
      type: "object",
    },
    diagnostics: {
      additionalProperties: false,
      properties: {
        clippingFraction: { type: "string" },
        maxWienerGain: { type: "string" },
        overshootFraction: { type: "string" },
        ringingEnergy: { type: "string" },
      },
      required: ["clippingFraction", "maxWienerGain", "overshootFraction", "ringingEnergy"],
      type: "object",
    },
    feasibility: { type: "string" },
    fixedFocusDiopters: NUMERIC_OR_NULL_SCHEMA,
    focusMode: { type: "string" },
    focusModeLabel: { type: "string" },
    manualResidualDiopters: NUMERIC_OR_NULL_SCHEMA,
    maxGain: NUMERIC_OR_NULL_SCHEMA,
    preset: { type: "string" },
    presetLabel: { type: "string" },
    pupilDiameterMm: NUMERIC_OR_NULL_SCHEMA,
    screenPpi: NUMERIC_OR_NULL_SCHEMA,
    sphere: NUMERIC_OR_NULL_SCHEMA,
    unsharpAmount: NUMERIC_OR_NULL_SCHEMA,
    vergence: {
      additionalProperties: false,
      properties: {
        dDisplay: { type: "string" },
        dFocus: { type: "string" },
        dRes: { type: "string" },
      },
      required: ["dDisplay", "dFocus", "dRes"],
      type: "object",
    },
    viewingDistanceM: NUMERIC_OR_NULL_SCHEMA,
    warnings: {
      items: { type: "string" },
      type: "array",
    },
    wienerK: NUMERIC_OR_NULL_SCHEMA,
  },
  required: [
    "blur",
    "comparison",
    "diagnostics",
    "feasibility",
    "fixedFocusDiopters",
    "focusMode",
    "focusModeLabel",
    "manualResidualDiopters",
    "maxGain",
    "preset",
    "presetLabel",
    "pupilDiameterMm",
    "screenPpi",
    "sphere",
    "unsharpAmount",
    "vergence",
    "viewingDistanceM",
    "warnings",
    "wienerK",
  ],
  type: "object",
} as const satisfies JsonSchemaForInference;

export const CONFIGURE_OUTPUT_SCHEMA = {
  additionalProperties: false,
  properties: {
    applied: {
      items: { type: "string" },
      type: "array",
    },
    feasibility: { type: "string" },
    message: { type: "string" },
    residualDefocus: { type: "string" },
  },
  required: ["applied", "feasibility", "message", "residualDefocus"],
  type: "object",
} as const satisfies JsonSchemaForInference;

export const LIST_PRESETS_OUTPUT_SCHEMA = {
  additionalProperties: false,
  properties: {
    presets: {
      items: {
        additionalProperties: false,
        properties: {
          description: { type: "string" },
          focusMode: { type: "string" },
          key: { type: "string" },
          label: { type: "string" },
          sphere: { type: "number" },
        },
        required: ["description", "focusMode", "key", "label", "sphere"],
        type: "object",
      },
      type: "array",
    },
  },
  required: ["presets"],
  type: "object",
} as const satisfies JsonSchemaForInference;

export const LIST_FOCUS_MODES_OUTPUT_SCHEMA = {
  additionalProperties: false,
  properties: {
    focusModes: {
      items: {
        additionalProperties: false,
        properties: {
          description: { type: "string" },
          label: { type: "string" },
          value: { type: "string" },
        },
        required: ["description", "label", "value"],
        type: "object",
      },
      type: "array",
    },
  },
  required: ["focusModes"],
  type: "object",
} as const satisfies JsonSchemaForInference;

export const EXPLAIN_FEASIBILITY_OUTPUT_SCHEMA = {
  additionalProperties: false,
  properties: {
    blurRadius: { type: "string" },
    explanation: { type: "string" },
    feasibility: { type: "string" },
    firstOtfZero: { type: "string" },
    level: { type: "string" },
    maxWienerGain: { type: "string" },
    residualDefocus: { type: "string" },
    warnings: {
      items: { type: "string" },
      type: "array",
    },
  },
  required: [
    "blurRadius",
    "explanation",
    "feasibility",
    "firstOtfZero",
    "level",
    "maxWienerGain",
    "residualDefocus",
    "warnings",
  ],
  type: "object",
} as const satisfies JsonSchemaForInference;

export type ConfigureArgs = InferJsonSchema<typeof CONFIGURE_INPUT_SCHEMA>;
export type ConfigureFieldKey = keyof typeof PLAYGROUND_NUMERIC_CONTROL_RULES;
