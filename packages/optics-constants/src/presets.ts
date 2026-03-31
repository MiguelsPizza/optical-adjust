import { FocusMode, type ViewerParams } from "optics-types";

import {
  DEFAULT_PUPIL_MM,
  DEFAULT_SCREEN_PPI,
  DEFAULT_VIEWING_DISTANCE_M,
  UNSHARP_DEFAULTS,
  WIENER_DEFAULTS,
} from "./optics.ts";

/**
 * Shape of a playground preset entry.
 *
 * @remarks Exported for consumers that need to explicitly type preset
 * variables or function parameters. Most call sites infer the type from
 * `PLAYGROUND_PRESETS` or `DEFAULT_PLAYGROUND_PRESET` directly.
 */
export interface PlaygroundPreset {
  description: string;
  key: string;
  label: string;
  params: ViewerParams;
}

export const PLAYGROUND_PRESETS: PlaygroundPreset[] = [
  {
    description:
      "Alex's right-eye spectacle prescription at laptop distance. This is the cleaner sphere-only eye in the current UI.",
    key: "alex-right-eye",
    label: "Alex Right Eye",
    params: {
      focusMode: FocusMode.RelaxedFarPoint,
      prescription: { axis: 0, cyl: 0, sph: -2.25 },
      pupilDiameterMm: DEFAULT_PUPIL_MM,
      screenPpi: DEFAULT_SCREEN_PPI,
      viewingDistanceM: DEFAULT_VIEWING_DISTANCE_M,
    },
  },
  {
    description:
      "Alex's approximate binocular laptop setup at about 2 feet, using a sphere-first compromise between the two spectacle prescriptions.",
    key: "alex-laptop-binocular",
    label: "Alex Laptop Approx",
    params: {
      focusMode: FocusMode.RelaxedFarPoint,
      prescription: { axis: 170, cyl: -0.5, sph: -2.5 },
      pupilDiameterMm: DEFAULT_PUPIL_MM,
      screenPpi: DEFAULT_SCREEN_PPI,
      viewingDistanceM: DEFAULT_VIEWING_DISTANCE_M,
    },
  },
  {
    description:
      "Alex's left-eye spectacle prescription at laptop distance. The current UI is still sphere-first, but the stored preset keeps the measured cylinder and axis.",
    key: "alex-left-eye",
    label: "Alex Left Eye",
    params: {
      focusMode: FocusMode.RelaxedFarPoint,
      prescription: { axis: 170, cyl: -0.5, sph: -2.5 },
      pupilDiameterMm: DEFAULT_PUPIL_MM,
      screenPpi: DEFAULT_SCREEN_PPI,
      viewingDistanceM: DEFAULT_VIEWING_DISTANCE_M,
    },
  },
  {
    description: "A -2 D myope at 50 cm should require effectively no spherical correction.",
    key: "relaxed-myope",
    label: "Relaxed -2 D Myope",
    params: {
      focusMode: FocusMode.RelaxedFarPoint,
      prescription: { axis: 0, cyl: 0, sph: -2 },
      pupilDiameterMm: DEFAULT_PUPIL_MM,
      screenPpi: DEFAULT_SCREEN_PPI,
      viewingDistanceM: 0.5,
    },
  },
  {
    description:
      "A -1 D prescription-estimate case produces a 10 px blur radius on a 254 PPI display at 50 cm.",
    key: "estimate-1d",
    label: "Prescription Estimate -1 D",
    params: {
      focusMode: FocusMode.PrescriptionEstimate,
      prescription: { axis: 0, cyl: 0, sph: -1 },
      pupilDiameterMm: DEFAULT_PUPIL_MM,
      screenPpi: DEFAULT_SCREEN_PPI,
      viewingDistanceM: 0.5,
    },
  },
  {
    description: "Manual residual mode is useful for validating exact defocus assumptions.",
    key: "manual-1d",
    label: "Manual 1 D Residual",
    params: {
      focusMode: FocusMode.ManualResidual,
      manualResidualDiopters: 1,
      prescription: { axis: 0, cyl: 0, sph: 0 },
      pupilDiameterMm: DEFAULT_PUPIL_MM,
      screenPpi: DEFAULT_SCREEN_PPI,
      viewingDistanceM: 0.5,
    },
  },
];

export const DEFAULT_PLAYGROUND_PRESET = PLAYGROUND_PRESETS[0]!;

export const DEFAULT_RENDER_CONTROLS = {
  maxGain: WIENER_DEFAULTS.maxGain,
  regularizationK: WIENER_DEFAULTS.regularizationK,
  unsharpAmount: UNSHARP_DEFAULTS.amount,
} as const;
