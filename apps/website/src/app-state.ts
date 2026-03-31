import {
  DEFAULT_PLAYGROUND_PRESET,
  DEFAULT_RENDER_CONTROLS,
  PLAYGROUND_PRESETS,
} from "optics-constants";
import { FocusMode, type ViewerParams } from "optics-types";

import type { AppState } from "./app-types.ts";

export const APP_STATE_STORAGE_KEY = "optical-adjust/playground-state/v1";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isViewerParams(value: unknown): value is ViewerParams {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ViewerParams>;
  const prescription = candidate.prescription as Partial<ViewerParams["prescription"]> | undefined;

  return (
    typeof candidate.focusMode === "string" &&
    Object.values(FocusMode).includes(candidate.focusMode) &&
    isFiniteNumber(candidate.viewingDistanceM) &&
    isFiniteNumber(candidate.pupilDiameterMm) &&
    isFiniteNumber(candidate.screenPpi) &&
    Boolean(prescription) &&
    isFiniteNumber(prescription?.axis) &&
    isFiniteNumber(prescription?.cyl) &&
    isFiniteNumber(prescription?.sph) &&
    (candidate.fixedFocusDiopters == null || isFiniteNumber(candidate.fixedFocusDiopters)) &&
    (candidate.manualResidualDiopters == null || isFiniteNumber(candidate.manualResidualDiopters))
  );
}

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AppState>;
  return (
    typeof candidate.activePreset === "string" &&
    isFiniteNumber(candidate.maxGain) &&
    isFiniteNumber(candidate.regularizationK) &&
    isFiniteNumber(candidate.unsharpAmount) &&
    isViewerParams(candidate.viewerParams)
  );
}

function getDefaultAppState(): AppState {
  return {
    activePreset: DEFAULT_PLAYGROUND_PRESET.key,
    maxGain: DEFAULT_RENDER_CONTROLS.maxGain,
    regularizationK: DEFAULT_RENDER_CONTROLS.regularizationK,
    unsharpAmount: DEFAULT_RENDER_CONTROLS.unsharpAmount,
    viewerParams: cloneViewerParams(DEFAULT_PLAYGROUND_PRESET.params),
  };
}

function readPersistedAppState(): AppState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawState = window.localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (!rawState) {
      return null;
    }

    const parsed = JSON.parse(rawState) as unknown;
    if (!isAppState(parsed)) {
      return null;
    }

    return {
      activePreset: parsed.activePreset,
      maxGain: parsed.maxGain,
      regularizationK: parsed.regularizationK,
      unsharpAmount: parsed.unsharpAmount,
      viewerParams: cloneViewerParams(parsed.viewerParams),
    };
  } catch {
    return null;
  }
}

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
 * Persists the current browser state so reloads keep the same manual
 * experiment settings.
 */
export function persistAppState(state: AppState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
}

/**
 * Creates the initial mutable browser state used by the playground mount
 * lifecycle.
 */
export function createInitialAppState(): AppState {
  return readPersistedAppState() ?? getDefaultAppState();
}
