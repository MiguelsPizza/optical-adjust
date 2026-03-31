/**
 * WebMCP tool definitions for Optical Adjust.
 *
 * These tools let a desktop AI agent (Claude Desktop, Cursor, etc.)
 * read the current playground state, apply a full prescription
 * configuration, and adjust individual parameters — all via the
 * WebMCP local relay.
 */

import { FOCUS_MODE_OPTIONS, PLAYGROUND_PRESETS } from "optics-constants";
import { getNumericControlRule, isValidFocusModeValue } from "./playground-controls.ts";
import {
  error,
  q,
  readInputNumber,
  readMetric,
  readWarningMessages,
  setNativeValue,
  structured,
  waitForUiUpdate,
} from "./webmcp-helpers.ts";
import {
  CONFIGURE_INPUT_SCHEMA,
  CONFIGURE_OUTPUT_SCHEMA,
  EMPTY_INPUT_SCHEMA,
  EXPLAIN_FEASIBILITY_OUTPUT_SCHEMA,
  GET_STATE_OUTPUT_SCHEMA,
  LIST_FOCUS_MODES_OUTPUT_SCHEMA,
  LIST_PRESETS_OUTPUT_SCHEMA,
  type ConfigureArgs,
  type ConfigureFieldKey,
  VALID_PRESET_KEYS,
} from "./webmcp-schemas.ts";

function validateNumericArg(
  value: unknown,
  validator: (numericValue: number) => boolean,
  errorMessage: string,
) {
  if (typeof value !== "number" || !Number.isFinite(value) || !validator(value)) {
    return error(errorMessage);
  }

  return null;
}

const modelContext = navigator.modelContext;

if (modelContext?.registerTool) {
  /* ------------------------------------------------------------------ */
  /*  Tool: read current playground state                               */
  /* ------------------------------------------------------------------ */

  modelContext.registerTool({
    name: "optical_adjust_get_state",
    description:
      "Read every parameter and computed metric from the Optical Adjust playground. " +
      "Returns machine-readable preset/focus/correction values plus labels, current numeric controls, " +
      "vergence metrics, blur metrics, feasibility, and active warnings.",
    inputSchema: EMPTY_INPUT_SCHEMA,
    outputSchema: GET_STATE_OUTPUT_SCHEMA,
    annotations: { readOnlyHint: true },
    async execute() {
      const preset = q<HTMLSelectElement>('[data-testid="preset-select"]');
      const focusMode = q<HTMLSelectElement>('[data-testid="focus-mode"]');
      const feasibilityEl = q<HTMLElement>(".feasibility-badge");

      const state = {
        feasibility: feasibilityEl?.textContent?.trim() ?? "n/a",
        fixedFocusDiopters: readInputNumber("fixed-focus-input"),
        focusMode: focusMode?.value ?? "unknown",
        focusModeLabel: focusMode?.selectedOptions[0]?.textContent ?? "unknown",
        manualResidualDiopters: readInputNumber("manual-residual-input"),
        maxGain: readInputNumber("max-gain-input"),
        preset: preset?.value ?? "unknown",
        presetLabel: preset?.selectedOptions[0]?.textContent ?? "unknown",
        pupilDiameterMm: readInputNumber("pupil-input"),
        screenPpi: readInputNumber("ppi-input"),
        sphere: readInputNumber("sphere-input"),
        unsharpAmount: readInputNumber("unsharp-amount-input"),
        vergence: {
          dDisplay: readMetric("metric-d-display"),
          dFocus: readMetric("metric-d-focus"),
          dRes: readMetric("metric-d-res"),
        },
        viewingDistanceM: readInputNumber("distance-input"),
        blur: {
          diameterPx: readMetric("metric-diameter"),
          firstOtfZero: readMetric("metric-first-zero"),
          radiusPx: readMetric("metric-radius"),
        },
        comparison: {
          blurredOriginal: {
            psnr: readMetric("metric-blurred-original-psnr"),
            rmse: readMetric("metric-blurred-original-rmse"),
            ssim: readMetric("metric-blurred-original-ssim"),
          },
          unsharpRetinal: {
            psnr: readMetric("metric-unsharp-retinal-psnr"),
            rmse: readMetric("metric-unsharp-retinal-rmse"),
            ssim: readMetric("metric-unsharp-retinal-ssim"),
          },
          wienerRetinal: {
            psnr: readMetric("metric-wiener-retinal-psnr"),
            rmse: readMetric("metric-wiener-retinal-rmse"),
            ssim: readMetric("metric-wiener-retinal-ssim"),
          },
        },
        diagnostics: {
          clippingFraction: readMetric("metric-clipping-fraction"),
          maxWienerGain: readMetric("metric-max-wiener-gain"),
          overshootFraction: readMetric("metric-overshoot-fraction"),
          ringingEnergy: readMetric("metric-ringing-energy"),
        },
        warnings: readWarningMessages(),
        wienerK: readInputNumber("wiener-input"),
      };

      return structured<typeof GET_STATE_OUTPUT_SCHEMA>(state);
    },
  });

  /* ------------------------------------------------------------------ */
  /*  Tool: configure all parameters at once                            */
  /* ------------------------------------------------------------------ */

  modelContext.registerTool({
    name: "optical_adjust_configure",
    description:
      "Set multiple playground parameters in one call. Accepts any combination of: " +
      "preset (key), focusMode, sphere (diopters), viewingDistanceM, pupilDiameterMm, " +
      "screenPpi, wienerK, maxGain, unsharpAmount, fixedFocusDiopters, manualResidualDiopters. " +
      "Only fields you include will be changed; others stay as-is.",
    inputSchema: CONFIGURE_INPUT_SCHEMA,
    outputSchema: CONFIGURE_OUTPUT_SCHEMA,
    async execute(args: ConfigureArgs) {
      const applied: string[] = [];

      if (args.preset != null) {
        if (typeof args.preset !== "string" || !VALID_PRESET_KEYS.has(args.preset)) {
          return error(
            `Unknown preset "${String(args.preset)}". Call optical_adjust_list_presets for valid keys.`,
          );
        }

        const el = q<HTMLSelectElement>('[data-testid="preset-select"]');
        if (!el) return error("Preset selector not found");
        setNativeValue(el, String(args.preset));
        applied.push(`preset=${args.preset}`);
        await waitForUiUpdate(50);
      }

      if (args.focusMode != null) {
        if (typeof args.focusMode !== "string" || !isValidFocusModeValue(args.focusMode)) {
          return error(
            `Unknown focusMode "${String(args.focusMode)}". Call optical_adjust_list_focus_modes for valid values.`,
          );
        }

        const el = q<HTMLSelectElement>('[data-testid="focus-mode"]');
        if (!el) return error("Focus mode selector not found");
        setNativeValue(el, String(args.focusMode));
        applied.push(`focusMode=${args.focusMode}`);
        await waitForUiUpdate(50);
      }

      const fieldMap = [
        ["sphere", getNumericControlRule("sphere")],
        ["viewingDistanceM", getNumericControlRule("viewingDistanceM")],
        ["pupilDiameterMm", getNumericControlRule("pupilDiameterMm")],
        ["screenPpi", getNumericControlRule("screenPpi")],
        ["wienerK", getNumericControlRule("wienerK")],
        ["maxGain", getNumericControlRule("maxGain")],
        ["unsharpAmount", getNumericControlRule("unsharpAmount")],
        ["fixedFocusDiopters", getNumericControlRule("fixedFocusDiopters")],
        ["manualResidualDiopters", getNumericControlRule("manualResidualDiopters")],
      ] as const satisfies ReadonlyArray<
        readonly [ConfigureFieldKey, ReturnType<typeof getNumericControlRule>]
      >;

      for (const [key, field] of fieldMap) {
        const value = args[key];
        if (value == null) {
          continue;
        }

        const numericArgError = validateNumericArg(value, field.validator, field.errorMessage);
        if (numericArgError) {
          return numericArgError;
        }

        const el = q<HTMLInputElement>(`[data-testid="${field.testId}"]`);
        if (!el) {
          return error(field.errorMessage);
        }

        setNativeValue(el, String(value));
        applied.push(`${key}=${value}`);
      }

      if (applied.length === 0) {
        return structured<typeof CONFIGURE_OUTPUT_SCHEMA>({
          applied,
          feasibility: "unknown",
          message: "No parameters provided. Pass at least one field to configure.",
          residualDefocus: "unknown",
        });
      }

      await waitForUiUpdate(100);

      const feasibility = q<HTMLElement>(".feasibility-badge")?.textContent?.trim() ?? "unknown";
      const dRes = readMetric("metric-d-res");

      return structured<typeof CONFIGURE_OUTPUT_SCHEMA>({
        applied,
        feasibility,
        message:
          `Applied: ${applied.join(", ")}.\n` +
          `Residual defocus: ${dRes} D. Feasibility: ${feasibility}.`,
        residualDefocus: `${dRes} D`,
      });
    },
  });

  /* ------------------------------------------------------------------ */
  /*  Tool: list available presets                                      */
  /* ------------------------------------------------------------------ */

  modelContext.registerTool({
    name: "optical_adjust_list_presets",
    description:
      "List all available playground presets with their keys, labels, and descriptions. " +
      "Use this to find the right preset key before calling optical_adjust_configure.",
    inputSchema: EMPTY_INPUT_SCHEMA,
    outputSchema: LIST_PRESETS_OUTPUT_SCHEMA,
    annotations: { readOnlyHint: true },
    async execute() {
      return structured<typeof LIST_PRESETS_OUTPUT_SCHEMA>({
        presets: PLAYGROUND_PRESETS.map((preset) => ({
          description: preset.description,
          focusMode: preset.params.focusMode,
          key: preset.key,
          label: preset.label,
          sphere: preset.params.prescription.sph,
        })),
      });
    },
  });

  /* ------------------------------------------------------------------ */
  /*  Tool: list focus modes                                            */
  /* ------------------------------------------------------------------ */

  modelContext.registerTool({
    name: "optical_adjust_list_focus_modes",
    description:
      "List all available focus modes with their values and descriptions. " +
      "Helps the agent choose the correct focusMode value for optical_adjust_configure.",
    inputSchema: EMPTY_INPUT_SCHEMA,
    outputSchema: LIST_FOCUS_MODES_OUTPUT_SCHEMA,
    annotations: { readOnlyHint: true },
    async execute() {
      return structured<typeof LIST_FOCUS_MODES_OUTPUT_SCHEMA>({
        focusModes: FOCUS_MODE_OPTIONS.map((mode) => ({
          description: mode.description,
          label: mode.label,
          value: mode.value,
        })),
      });
    },
  });

  /* ------------------------------------------------------------------ */
  /*  Tool: explain feasibility                                         */
  /* ------------------------------------------------------------------ */

  modelContext.registerTool({
    name: "optical_adjust_explain_feasibility",
    description:
      "Explain the current feasibility rating and active warnings in plain language. " +
      "Useful after configuring parameters to understand whether correction is viable.",
    inputSchema: EMPTY_INPUT_SCHEMA,
    outputSchema: EXPLAIN_FEASIBILITY_OUTPUT_SCHEMA,
    annotations: { readOnlyHint: true },
    async execute() {
      const feasibilityEl = q<HTMLElement>(".feasibility-badge");
      const level = feasibilityEl?.dataset.level ?? "unknown";
      const label = feasibilityEl?.textContent?.trim() ?? "unknown";
      const dRes = readMetric("metric-d-res");
      const radius = readMetric("metric-radius");
      const firstZero = readMetric("metric-first-zero");
      const maxGain = readMetric("metric-max-wiener-gain");

      const explanations: Record<string, string> = {
        NoCorrectionNeeded:
          "The residual defocus is effectively zero - the eye's focus point coincides with the screen. No prefiltering needed.",
        Good: "The blur radius is small enough that Wiener deconvolution can recover most spatial frequencies without visible ringing.",
        Marginal:
          "Correction is possible but the OTF zero crossings are entering the text-frequency range. Expect some artifacts. Increase Wiener K or lower max gain to stabilize.",
        Poor: "The blur radius is large enough that significant frequency bands are lost at OTF zeros. Inverse filtering will amplify noise. Consider reducing the prescription or viewing distance.",
        VeryPoor:
          "The defocus is too large for meaningful recovery. The pillbox kernel is in the large-radius regime where ringing dominates any benefit.",
      };

      return structured<typeof EXPLAIN_FEASIBILITY_OUTPUT_SCHEMA>({
        blurRadius: `${radius} px`,
        explanation: explanations[level] ?? "Unknown feasibility level.",
        feasibility: label,
        firstOtfZero: firstZero,
        level,
        maxWienerGain: maxGain,
        residualDefocus: `${dRes} D`,
        warnings: readWarningMessages(),
      });
    },
  });
}
