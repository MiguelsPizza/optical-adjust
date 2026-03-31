/**
 * WebMCP tool definitions for Optical Adjust.
 *
 * These tools let a desktop AI agent (Claude Desktop, Cursor, etc.)
 * read the current playground state, apply a full prescription
 * configuration, and adjust individual parameters — all via the
 * WebMCP local relay.
 */

import {
  FOCUS_MODE_OPTIONS,
  MAX_PUPIL_MM,
  MIN_PUPIL_MM,
  MIN_SCREEN_PPI,
  PLAYGROUND_PRESETS,
  WIENER_CONTROL_RANGES,
} from "optics-constants";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function q<T extends HTMLElement>(sel: string): T | null {
  return document.querySelector<T>(sel);
}

function setNativeValue(el: HTMLInputElement | HTMLSelectElement, value: string) {
  const proto =
    el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;

  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function text(msg: string) {
  return { content: [{ type: "text" as const, text: msg }] };
}

function error(msg: string) {
  return { content: [{ type: "text" as const, text: msg }], isError: true as const };
}

function readMetric(testid: string): string {
  return q<HTMLElement>(`[data-testid="${testid}"]`)?.textContent?.trim() ?? "n/a";
}

/* ------------------------------------------------------------------ */
/*  Tool: read current playground state                               */
/* ------------------------------------------------------------------ */

navigator.modelContext.registerTool({
  name: "optical_adjust_get_state",
  description:
    "Read every parameter and computed metric from the Optical Adjust playground. " +
    "Returns the current preset, focus mode, prescription, viewing conditions, " +
    "Wiener filter settings, vergence chain, blur metrics, feasibility, and any active warnings.",
  inputSchema: { type: "object", properties: {} },
  annotations: { readOnlyHint: true },
  async execute() {
    const preset = q<HTMLSelectElement>('[data-testid="preset-select"]');
    const focusMode = q<HTMLSelectElement>('[data-testid="focus-mode"]');
    const sphere = q<HTMLInputElement>('[data-testid="sphere-input"]');
    const distance = q<HTMLInputElement>('[data-testid="distance-input"]');
    const pupil = q<HTMLInputElement>('[data-testid="pupil-input"]');
    const ppi = q<HTMLInputElement>('[data-testid="ppi-input"]');
    const wienerK = q<HTMLInputElement>('[data-testid="wiener-input"]');
    const maxGain = q<HTMLInputElement>('[data-testid="max-gain-input"]');

    const warnings = Array.from(document.querySelectorAll(".warning-pill"))
      .map((el) => el.textContent?.trim())
      .filter(Boolean);

    const feasibilityEl = q<HTMLElement>(".feasibility-badge");

    const state = {
      preset: preset?.selectedOptions[0]?.textContent ?? "unknown",
      focusMode: focusMode?.selectedOptions[0]?.textContent ?? "unknown",
      sphere: sphere?.value ?? "n/a",
      viewingDistanceM: distance?.value ?? "n/a",
      pupilDiameterMm: pupil?.value ?? "n/a",
      screenPpi: ppi?.value ?? "n/a",
      wienerK: wienerK?.value ?? "n/a",
      maxGain: maxGain?.value ?? "n/a",
      vergence: {
        dDisplay: readMetric("metric-d-display"),
        dFocus: readMetric("metric-d-focus"),
        dRes: readMetric("metric-d-res"),
      },
      blur: {
        radiusPx: readMetric("metric-radius"),
        diameterPx: readMetric("metric-diameter"),
        firstOtfZero: readMetric("metric-first-zero"),
      },
      feasibility: feasibilityEl?.textContent?.trim() ?? "n/a",
      observedMaxGain: readMetric("metric-max-gain-seen"),
      warnings,
    };

    return text(JSON.stringify(state, null, 2));
  },
});

/* ------------------------------------------------------------------ */
/*  Tool: configure all parameters at once                            */
/* ------------------------------------------------------------------ */

navigator.modelContext.registerTool({
  name: "optical_adjust_configure",
  description:
    "Set multiple playground parameters in one call. Accepts any combination of: " +
    "preset (key), focusMode, sphere (diopters), viewingDistanceM, pupilDiameterMm, " +
    "screenPpi, wienerK, maxGain, fixedFocusDiopters, manualResidualDiopters. " +
    "Only fields you include will be changed; others stay as-is. " +
    "Use this to apply a full prescription from a PDF or user description.",
  inputSchema: {
    type: "object",
    properties: {
      preset: {
        type: "string",
        description: `Preset key. Options: ${PLAYGROUND_PRESETS.map((p) => `"${p.key}" (${p.label})`).join(", ")}`,
      },
      focusMode: {
        type: "string",
        description: `Focus mode value. Options: ${FOCUS_MODE_OPTIONS.map((m) => `"${m.value}" (${m.label})`).join(", ")}`,
      },
      sphere: {
        type: "number",
        description: "Sphere power in diopters (e.g. -2.0 for myopia, +1.5 for hyperopia)",
      },
      viewingDistanceM: {
        type: "number",
        description: "Viewing distance in meters (e.g. 0.5 for 50cm)",
      },
      pupilDiameterMm: {
        type: "number",
        description: `Pupil diameter in mm (${MIN_PUPIL_MM}–${MAX_PUPIL_MM})`,
      },
      screenPpi: {
        type: "number",
        description: `Screen pixels per inch (min ${MIN_SCREEN_PPI})`,
      },
      wienerK: {
        type: "number",
        description: `Wiener regularization K (${WIENER_CONTROL_RANGES.regularizationKMin}–${WIENER_CONTROL_RANGES.regularizationKMax})`,
      },
      maxGain: {
        type: "number",
        description: `Max Wiener gain cap (${WIENER_CONTROL_RANGES.maxGainMin}–${WIENER_CONTROL_RANGES.maxGainMax})`,
      },
      fixedFocusDiopters: {
        type: "number",
        description:
          "Fixed focus accommodation value in diopters (only used when focusMode is FixedFocus)",
      },
      manualResidualDiopters: {
        type: "number",
        description:
          "Manual residual defocus override in diopters (only used when focusMode is ManualResidual)",
      },
    },
  },
  async execute(args: Record<string, unknown>) {
    const applied: string[] = [];

    // Preset must be applied first — it resets other fields
    if (args.preset != null) {
      const el = q<HTMLSelectElement>('[data-testid="preset-select"]');
      if (!el) return error("Preset selector not found");
      setNativeValue(el, String(args.preset));
      applied.push(`preset=${args.preset}`);
      // Wait for re-render
      await new Promise((r) => setTimeout(r, 50));
    }

    if (args.focusMode != null) {
      const el = q<HTMLSelectElement>('[data-testid="focus-mode"]');
      if (!el) return error("Focus mode selector not found");
      setNativeValue(el, String(args.focusMode));
      applied.push(`focusMode=${args.focusMode}`);
      await new Promise((r) => setTimeout(r, 50));
    }

    const fieldMap: Array<[string, string]> = [
      ["sphere", "sphere-input"],
      ["viewingDistanceM", "distance-input"],
      ["pupilDiameterMm", "pupil-input"],
      ["screenPpi", "ppi-input"],
      ["wienerK", "wiener-input"],
      ["maxGain", "max-gain-input"],
      ["fixedFocusDiopters", "fixed-focus-input"],
      ["manualResidualDiopters", "manual-residual-input"],
    ];

    for (const [key, testid] of fieldMap) {
      if (args[key] != null) {
        const el = q<HTMLInputElement>(`[data-testid="${testid}"]`);
        if (el) {
          setNativeValue(el, String(args[key]));
          applied.push(`${key}=${args[key]}`);
        }
      }
    }

    if (applied.length === 0) {
      return text("No parameters provided. Pass at least one field to configure.");
    }

    // Wait for final re-render
    await new Promise((r) => setTimeout(r, 100));

    // Read back feasibility
    const feasibility = q<HTMLElement>(".feasibility-badge")?.textContent?.trim() ?? "unknown";
    const dRes = readMetric("metric-d-res");

    return text(
      `Applied: ${applied.join(", ")}.\n` +
        `Residual defocus: ${dRes} D. Feasibility: ${feasibility}.`,
    );
  },
});

/* ------------------------------------------------------------------ */
/*  Tool: list available presets                                      */
/* ------------------------------------------------------------------ */

navigator.modelContext.registerTool({
  name: "optical_adjust_list_presets",
  description:
    "List all available playground presets with their keys, labels, and descriptions. " +
    "Use this to find the right preset key before calling optical_adjust_configure.",
  inputSchema: { type: "object", properties: {} },
  annotations: { readOnlyHint: true },
  async execute() {
    const presets = PLAYGROUND_PRESETS.map((p) => ({
      key: p.key,
      label: p.label,
      description: p.description,
      focusMode: p.params.focusMode,
      sphere: p.params.prescription.sph,
    }));
    return text(JSON.stringify(presets, null, 2));
  },
});

/* ------------------------------------------------------------------ */
/*  Tool: list focus modes                                            */
/* ------------------------------------------------------------------ */

navigator.modelContext.registerTool({
  name: "optical_adjust_list_focus_modes",
  description:
    "List all available focus modes with their values and descriptions. " +
    "Helps the agent choose the correct focusMode value for optical_adjust_configure.",
  inputSchema: { type: "object", properties: {} },
  annotations: { readOnlyHint: true },
  async execute() {
    return text(JSON.stringify(FOCUS_MODE_OPTIONS, null, 2));
  },
});

/* ------------------------------------------------------------------ */
/*  Tool: explain feasibility                                         */
/* ------------------------------------------------------------------ */

navigator.modelContext.registerTool({
  name: "optical_adjust_explain_feasibility",
  description:
    "Explain the current feasibility rating and active warnings in plain language. " +
    "Useful after configuring parameters to understand whether correction is viable.",
  inputSchema: { type: "object", properties: {} },
  annotations: { readOnlyHint: true },
  async execute() {
    const feasibilityEl = q<HTMLElement>(".feasibility-badge");
    const level = feasibilityEl?.dataset.level ?? "unknown";
    const label = feasibilityEl?.textContent?.trim() ?? "unknown";
    const dRes = readMetric("metric-d-res");
    const radius = readMetric("metric-radius");
    const firstZero = readMetric("metric-first-zero");
    const maxGain = readMetric("metric-max-gain-seen");

    const warnings = Array.from(document.querySelectorAll(".warning-pill"))
      .map((el) => el.textContent?.trim())
      .filter(Boolean);

    const explanations: Record<string, string> = {
      NoCorrectionNeeded:
        "The residual defocus is effectively zero — the eye's focus point coincides with the screen. No prefiltering needed.",
      Good: "The blur radius is small enough that Wiener deconvolution can recover most spatial frequencies without visible ringing.",
      Marginal:
        "Correction is possible but the OTF zero crossings are entering the text-frequency range. Expect some artifacts. Increase Wiener K or lower max gain to stabilize.",
      Poor: "The blur radius is large enough that significant frequency bands are lost at OTF zeros. Inverse filtering will amplify noise. Consider reducing the prescription or viewing distance.",
      VeryPoor:
        "The defocus is too large for meaningful recovery. The pillbox kernel is in the large-radius regime where ringing dominates any benefit.",
    };

    return text(
      JSON.stringify(
        {
          feasibility: label,
          level,
          explanation: explanations[level] ?? "Unknown feasibility level.",
          residualDefocus: `${dRes} D`,
          blurRadius: `${radius} px`,
          firstOtfZero: firstZero,
          observedMaxGain: maxGain,
          warnings,
        },
        null,
        2,
      ),
    );
  },
});
