import {
  DEFAULT_PLAYGROUND_PRESET,
  DEFAULT_RENDER_CONTROLS,
  PLAYGROUND_PRESETS,
} from "optics-constants";
import type { ViewerParams } from "optics-types";

import type { AppState } from "./app-types.ts";

/**
 * Clones the nested viewer state so preset swaps never retain shared object
 * references.
 */
export function cloneViewerParams(params: ViewerParams): ViewerParams {
  return {
    ...params,
    prescription: { ...params.prescription },
  };
}

/**
 * Resolves a preset key to a known preset and falls back to the default preset
 * when the requested key is absent.
 */
export function findPreset(presetKey: string) {
  return PLAYGROUND_PRESETS.find((preset) => preset.key === presetKey) ?? DEFAULT_PLAYGROUND_PRESET;
}

/**
 * Creates the initial mutable browser state used by the playground mount
 * lifecycle.
 */
export function createInitialAppState(): AppState {
  return {
    activePreset: DEFAULT_PLAYGROUND_PRESET.key,
    maxGain: DEFAULT_RENDER_CONTROLS.maxGain,
    regularizationK: DEFAULT_RENDER_CONTROLS.regularizationK,
    unsharpAmount: DEFAULT_RENDER_CONTROLS.unsharpAmount,
    viewerParams: cloneViewerParams(DEFAULT_PLAYGROUND_PRESET.params),
  };
}
