import {
  bindNumericViewerInput,
  bindOptionalNumericControl,
  queryRequired,
} from "./app-controls.ts";
import { cloneViewerParams, findPreset } from "./app-state.ts";
import {
  getNumericControlRule,
  isValidFocusModeValue,
  type PlaygroundNumericControlKey,
} from "./playground-controls.ts";
import type { AppRenderCallback, AppState } from "./app-types.ts";

type ViewerRuleKey = Extract<
  PlaygroundNumericControlKey,
  "sphere" | "viewingDistanceM" | "pupilDiameterMm" | "screenPpi"
>;
type OptionalRuleKey = Extract<
  PlaygroundNumericControlKey,
  "fixedFocusDiopters" | "manualResidualDiopters" | "maxGain" | "unsharpAmount" | "wienerK"
>;

interface ViewerBinding {
  apply: (state: AppState, value: number) => void;
  ruleKey: ViewerRuleKey;
}

interface OptionalBinding {
  apply: (state: AppState, value: number) => void;
  ruleKey: OptionalRuleKey;
}

const VIEWER_BINDINGS: ReadonlyArray<ViewerBinding> = [
  {
    apply(state, value) {
      state.viewerParams = {
        ...state.viewerParams,
        prescription: {
          ...state.viewerParams.prescription,
          sph: value,
        },
      };
    },
    ruleKey: "sphere",
  },
  {
    apply(state, value) {
      state.viewerParams = {
        ...state.viewerParams,
        viewingDistanceM: value,
      };
    },
    ruleKey: "viewingDistanceM",
  },
  {
    apply(state, value) {
      state.viewerParams = {
        ...state.viewerParams,
        pupilDiameterMm: value,
      };
    },
    ruleKey: "pupilDiameterMm",
  },
  {
    apply(state, value) {
      state.viewerParams = {
        ...state.viewerParams,
        screenPpi: value,
      };
    },
    ruleKey: "screenPpi",
  },
];

const OPTIONAL_BINDINGS: ReadonlyArray<OptionalBinding> = [
  {
    apply(state, value) {
      state.regularizationK = value;
    },
    ruleKey: "wienerK",
  },
  {
    apply(state, value) {
      state.maxGain = value;
    },
    ruleKey: "maxGain",
  },
  {
    apply(state, value) {
      state.unsharpAmount = value;
    },
    ruleKey: "unsharpAmount",
  },
  {
    apply(state, value) {
      state.viewerParams = {
        ...state.viewerParams,
        fixedFocusDiopters: value,
      };
    },
    ruleKey: "fixedFocusDiopters",
  },
  {
    apply(state, value) {
      state.viewerParams = {
        ...state.viewerParams,
        manualResidualDiopters: value,
      };
    },
    ruleKey: "manualResidualDiopters",
  },
];

function bindPresetSelector(root: HTMLElement, state: AppState, render: AppRenderCallback) {
  queryRequired<HTMLSelectElement>(root, '[data-testid="preset-select"]').addEventListener(
    "change",
    (event) => {
      const preset = findPreset((event.currentTarget as HTMLSelectElement).value);
      state.activePreset = preset.key;
      state.viewerParams = cloneViewerParams(preset.params);
      render();
    },
  );
}

function bindFocusModeSelector(root: HTMLElement, state: AppState, render: AppRenderCallback) {
  queryRequired<HTMLSelectElement>(root, '[data-testid="focus-mode"]').addEventListener(
    "change",
    (event) => {
      const select = event.currentTarget as HTMLSelectElement;
      const nextFocusMode = select.value;
      if (!isValidFocusModeValue(nextFocusMode)) {
        select.value = state.viewerParams.focusMode;
        return;
      }

      state.viewerParams = {
        ...state.viewerParams,
        focusMode: nextFocusMode,
      };
      render();
    },
  );
}

function bindViewerInputs(root: HTMLElement, state: AppState, render: AppRenderCallback) {
  for (const binding of VIEWER_BINDINGS) {
    const rule = getNumericControlRule(binding.ruleKey);
    bindNumericViewerInput(
      root,
      rule.testId,
      state,
      render,
      (value) => {
        const nextViewerParams = {
          ...state.viewerParams,
          prescription: { ...state.viewerParams.prescription },
        };
        const nextState = { ...state, viewerParams: nextViewerParams };
        binding.apply(nextState, value);
        return nextState.viewerParams;
      },
      rule.validator,
    );
  }
}

function bindOptionalInputs(root: HTMLElement, state: AppState, render: AppRenderCallback) {
  for (const binding of OPTIONAL_BINDINGS) {
    const rule = getNumericControlRule(binding.ruleKey);
    bindOptionalNumericControl(
      root,
      rule.testId,
      render,
      (value) => {
        binding.apply(state, value);
      },
      rule.validator,
    );
  }
}

/**
 * Binds the full interactive event surface for the mounted playground.
 */
export function bindEvents(root: HTMLElement, state: AppState, render: AppRenderCallback) {
  bindPresetSelector(root, state, render);
  bindFocusModeSelector(root, state, render);
  bindViewerInputs(root, state, render);
  bindOptionalInputs(root, state, render);
}
