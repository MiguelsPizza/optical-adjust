import {
  APP_CANVAS_DIMENSIONS,
  APP_COPY,
  CORRECTION_MODE_DESCRIPTIONS,
  CORRECTION_MODE_OPTIONS,
  DEFAULT_PLAYGROUND_PRESET,
  DEFAULT_RENDER_CONTROLS,
  DIOPTER_INPUT_STEP,
  EMPTY_STATE_COPY,
  FEASIBILITY_LABELS,
  FIELD_LABELS,
  FOCUS_MODE_OPTIONS,
  MAX_PUPIL_MM,
  METRIC_LABELS,
  MIN_PUPIL_MM,
  MIN_SCREEN_PPI,
  NUMBER_FORMATTING,
  PANEL_CAPTIONS,
  PLAYGROUND_PRESETS,
  PUPIL_INPUT_STEP_MM,
  SCREEN_PPI_INPUT_STEP,
  UNSHARP_CONTROL_RANGES,
  VIEWING_DISTANCE_INPUT_STEP_M,
  WARNING_LABELS,
  WARNING_MESSAGES,
  WIENER_CONTROL_RANGES,
} from "optics-constants";
import { calculateBlurResult, createPillboxKernel } from "optics";
import {
  blurCanvasToCanvas,
  deconvolveCanvasToCanvas,
  drawTestPattern,
  renderAnalyticOtfToCanvas,
  unsharpMaskCanvasToCanvas,
} from "optics-render";
import {
  CorrectionMode,
  FocusMode,
  type BlurResult,
  type BlurWarningKey,
  type Nullable,
  type ViewerParams,
} from "optics-types";

import "./style.css";

interface AppState<TParams extends ViewerParams = ViewerParams> {
  activePreset: string;
  correctionMode: CorrectionMode;
  maxGain: number;
  maxGainSeen: Nullable<number>;
  regularizationK: number;
  unsharpAmount: number;
  viewerParams: TParams;
}

interface AppRenderContext {
  blurResult: BlurResult;
  warningEntries: Array<[BlurWarningKey, boolean]>;
}

interface CanvasRefs {
  blurredCorrected: HTMLCanvasElement;
  blurredOriginal: HTMLCanvasElement;
  corrected: HTMLCanvasElement;
  original: HTMLCanvasElement;
  otf: HTMLCanvasElement;
}

function cloneViewerParams(params: ViewerParams): ViewerParams {
  return {
    ...params,
    prescription: { ...params.prescription },
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatNumber(value: Nullable<number>, digits: number = NUMBER_FORMATTING.defaultDigits) {
  if (value === null || Number.isNaN(value)) {
    return EMPTY_STATE_COPY.numberNotAvailable;
  }
  return value.toFixed(digits);
}

function findPreset(presetKey: string) {
  return PLAYGROUND_PRESETS.find((preset) => preset.key === presetKey) ?? DEFAULT_PLAYGROUND_PRESET;
}

function createWarningMarkup(warningEntries: AppRenderContext["warningEntries"]) {
  if (warningEntries.length === 0) {
    return `<p>${escapeHtml(EMPTY_STATE_COPY.noWarnings)}</p>`;
  }

  return warningEntries
    .map(
      ([warningKey]) =>
        `<p class="warning-pill">${escapeHtml(WARNING_LABELS[warningKey])}: ${escapeHtml(
          WARNING_MESSAGES[warningKey],
        )}</p>`,
    )
    .join("");
}

function createFocusModeOptions(selectedMode: FocusMode) {
  return FOCUS_MODE_OPTIONS.map(
    (mode) =>
      `<option value="${escapeHtml(mode.value)}"${mode.value === selectedMode ? " selected" : ""}>${escapeHtml(mode.label)}</option>`,
  ).join("");
}

function createCorrectionModeOptions(selectedMode: CorrectionMode) {
  return CORRECTION_MODE_OPTIONS.map(
    (mode) =>
      `<option value="${escapeHtml(mode.value)}"${mode.value === selectedMode ? " selected" : ""}>${escapeHtml(mode.label)}</option>`,
  ).join("");
}

function createPresetOptions(selectedPresetKey: string) {
  return PLAYGROUND_PRESETS.map(
    (preset) =>
      `<option value="${escapeHtml(preset.key)}"${preset.key === selectedPresetKey ? " selected" : ""}>${escapeHtml(preset.label)}</option>`,
  ).join("");
}

function createConditionalControls(viewerParams: ViewerParams) {
  const controls: string[] = [];

  if (viewerParams.focusMode === FocusMode.FixedFocus) {
    controls.push(`
      <label>
        ${escapeHtml(FIELD_LABELS.fixedFocus)}
        <input
          data-testid="fixed-focus-input"
          type="number"
          step="${DIOPTER_INPUT_STEP}"
          value="${viewerParams.fixedFocusDiopters ?? 0}"
        />
      </label>
    `);
  }

  if (viewerParams.focusMode === FocusMode.ManualResidual) {
    controls.push(`
      <label>
        ${escapeHtml(FIELD_LABELS.manualResidual)}
        <input
          data-testid="manual-residual-input"
          type="number"
          step="${DIOPTER_INPUT_STEP}"
          value="${viewerParams.manualResidualDiopters ?? 0}"
        />
      </label>
    `);
  }

  return controls.join("");
}

function getFocusModeDescription(focusMode: FocusMode) {
  return FOCUS_MODE_OPTIONS.find((opt) => opt.value === focusMode)?.description ?? "";
}

function getCorrectionModeDescription(correctionMode: CorrectionMode) {
  return CORRECTION_MODE_DESCRIPTIONS[correctionMode] ?? "";
}

function createAppMarkup(state: AppState, context: AppRenderContext) {
  const { blurResult } = context;

  return `
    <main class="app-shell">
      <header class="header">
        <div class="header-top">
          <h1>${escapeHtml(APP_COPY.title)}</h1>
          <span class="feasibility-badge" data-level="${escapeHtml(blurResult.feasibility)}">${escapeHtml(
            FEASIBILITY_LABELS[blurResult.feasibility],
          )}</span>
        </div>
        <div class="header-controls">
          <label class="inline-label">
            <select data-testid="preset-select">${createPresetOptions(state.activePreset)}</select>
          </label>
          <label class="inline-label">
            <select data-testid="focus-mode">${createFocusModeOptions(state.viewerParams.focusMode)}</select>
          </label>
          <label class="inline-label">
            <select data-testid="correction-mode">${createCorrectionModeOptions(state.correctionMode)}</select>
          </label>
          <a class="relay-btn" href="https://pub-78d75f975fdc4f1cb9ef2d6168bb54ff.r2.dev/relay/webmcp-local-relay-latest.mcpb" download="webmcp-local-relay.mcpb">
            &#x2193; Local Relay
          </a>
        </div>
        <p data-testid="focus-mode-description">${escapeHtml(
          getFocusModeDescription(state.viewerParams.focusMode),
        )}</p>
        <p data-testid="correction-mode-description">${escapeHtml(
          getCorrectionModeDescription(state.correctionMode),
        )}</p>
      </header>

      <div class="vergence-chain" data-testid="debug-metrics">
        <dl class="vergence-step">
          <dt>Screen</dt>
          <dd data-testid="metric-d-display">${formatNumber(blurResult.dDisplay)}<small>D</small></dd>
        </dl>
        <dl class="vergence-step">
          <dt>Eye</dt>
          <dd data-testid="metric-d-focus">${formatNumber(blurResult.dFocus)}<small>D</small></dd>
        </dl>
        <dl class="vergence-step is-result">
          <dt>Residual</dt>
          <dd data-testid="metric-d-res">${formatNumber(blurResult.dRes)}<small>D</small></dd>
        </dl>
      </div>

      <div class="dense-grid">
        <section class="control-grid">
          <label>
            ${escapeHtml(FIELD_LABELS.sphere)}
            <input data-testid="sphere-input" type="number" step="${DIOPTER_INPUT_STEP}" value="${state.viewerParams.prescription.sph}" />
          </label>
          <label>
            ${escapeHtml(FIELD_LABELS.distance)}
            <input data-testid="distance-input" type="number" step="${VIEWING_DISTANCE_INPUT_STEP_M}" value="${state.viewerParams.viewingDistanceM}" />
          </label>
          <label>
            ${escapeHtml(FIELD_LABELS.pupil)}
            <div class="range-row">
              <input data-testid="pupil-input" type="range" min="${MIN_PUPIL_MM}" max="${MAX_PUPIL_MM}" step="${PUPIL_INPUT_STEP_MM}" value="${state.viewerParams.pupilDiameterMm}" />
              <span class="range-value">${formatNumber(state.viewerParams.pupilDiameterMm, NUMBER_FORMATTING.oneDecimalDigits)}</span>
            </div>
          </label>
          <label>
            ${escapeHtml(FIELD_LABELS.screenPpi)}
            <input data-testid="ppi-input" type="number" min="${MIN_SCREEN_PPI}" step="${SCREEN_PPI_INPUT_STEP}" value="${state.viewerParams.screenPpi}" />
          </label>
          <label>
            ${
              state.correctionMode === CorrectionMode.Wiener
                ? `${escapeHtml(FIELD_LABELS.wienerK)}
            <div class="range-row">
              <input data-testid="wiener-input" type="range" min="${WIENER_CONTROL_RANGES.regularizationKMin}" max="${WIENER_CONTROL_RANGES.regularizationKMax}" step="${WIENER_CONTROL_RANGES.regularizationKStep}" value="${state.regularizationK}" />
              <span class="range-value">${formatNumber(state.regularizationK)}</span>
            </div>`
                : `${escapeHtml(FIELD_LABELS.unsharpAmount)}
            <div class="range-row">
              <input data-testid="unsharp-amount-input" type="range" min="${UNSHARP_CONTROL_RANGES.amountMin}" max="${UNSHARP_CONTROL_RANGES.amountMax}" step="${UNSHARP_CONTROL_RANGES.amountStep}" value="${state.unsharpAmount}" />
              <span class="range-value">${formatNumber(state.unsharpAmount, NUMBER_FORMATTING.oneDecimalDigits)}</span>
            </div>`
            }
          </label>
          ${
            state.correctionMode === CorrectionMode.Wiener
              ? `<label>
            ${escapeHtml(FIELD_LABELS.maxWienerGain)}
            <div class="range-row">
              <input data-testid="max-gain-input" type="range" min="${WIENER_CONTROL_RANGES.maxGainMin}" max="${WIENER_CONTROL_RANGES.maxGainMax}" step="${WIENER_CONTROL_RANGES.maxGainStep}" value="${state.maxGain}" />
              <span class="range-value">${formatNumber(state.maxGain, NUMBER_FORMATTING.oneDecimalDigits)}</span>
            </div>
          </label>`
              : ""
          }
          ${createConditionalControls(state.viewerParams)}
        </section>

        <section class="metrics-strip">
          <div class="metric-row">
            <dt>${escapeHtml(METRIC_LABELS.blurRadius)}</dt>
            <dd data-testid="metric-radius">${formatNumber(blurResult.blurRadiusPx)}</dd>
          </div>
          <div class="metric-row">
            <dt>${escapeHtml(METRIC_LABELS.blurDiameter)}</dt>
            <dd data-testid="metric-diameter">${formatNumber(blurResult.blurDiameterPx)}</dd>
          </div>
          <div class="metric-row">
            <dt>${escapeHtml(METRIC_LABELS.firstOtfZero)}</dt>
            <dd data-testid="metric-first-zero">${formatNumber(blurResult.firstOtfZero)}</dd>
          </div>
          <div class="metric-row">
            <dt>${escapeHtml(METRIC_LABELS.observedMaxGain)}</dt>
            <dd data-testid="metric-max-gain-seen">${formatNumber(state.maxGainSeen)}</dd>
          </div>
          <div class="metric-row" data-testid="metric-feasibility" hidden>
            <dt>${escapeHtml(METRIC_LABELS.feasibility)}</dt>
            <dd>${escapeHtml(FEASIBILITY_LABELS[blurResult.feasibility])}</dd>
          </div>
        </section>
      </div>

      <div class="warnings" data-testid="warning-list">
        ${createWarningMarkup(context.warningEntries)}
      </div>

      <section class="panel-grid">
        <figure>
          <figcaption><span class="step-num">1</span> ${escapeHtml(PANEL_CAPTIONS.original)}</figcaption>
          <canvas data-testid="canvas-original"></canvas>
        </figure>
        <figure>
          <figcaption><span class="step-num">2</span> ${escapeHtml(PANEL_CAPTIONS.corrected)}</figcaption>
          <canvas data-testid="canvas-corrected"></canvas>
        </figure>
        <div class="panel-flow-arrow">Eye blur applied</div>
        <figure>
          <figcaption><span class="step-num">3</span> ${escapeHtml(PANEL_CAPTIONS.blurredOriginal)}</figcaption>
          <canvas data-testid="canvas-blurred-original"></canvas>
        </figure>
        <figure class="is-result">
          <figcaption><span class="step-num">4</span> ${escapeHtml(PANEL_CAPTIONS.blurredCorrected)}</figcaption>
          <canvas data-testid="canvas-blurred-corrected"></canvas>
        </figure>
      </section>

      <section class="otf-panel">
        <div>
          <h2>${escapeHtml(APP_COPY.otfHeading)}</h2>
          <p>${escapeHtml(APP_COPY.otfDescription)}</p>
        </div>
        <canvas data-testid="canvas-otf"></canvas>
      </section>
    </main>
  `;
}

function queryRequired<TElement extends Element>(root: ParentNode, selector: string) {
  const element = root.querySelector<TElement>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}

function createRenderContext(state: AppState): AppRenderContext {
  const blurResult = calculateBlurResult(state.viewerParams);
  const warningEntries = Object.entries(blurResult.warnings).filter(
    ([, enabled]) => enabled,
  ) as Array<[BlurWarningKey, boolean]>;

  return {
    blurResult,
    warningEntries,
  };
}

function getCanvasRefs(root: ParentNode): CanvasRefs {
  return {
    blurredCorrected: queryRequired(root, '[data-testid="canvas-blurred-corrected"]'),
    blurredOriginal: queryRequired(root, '[data-testid="canvas-blurred-original"]'),
    corrected: queryRequired(root, '[data-testid="canvas-corrected"]'),
    original: queryRequired(root, '[data-testid="canvas-original"]'),
    otf: queryRequired(root, '[data-testid="canvas-otf"]'),
  };
}

function paintCanvases(root: ParentNode, state: AppState, blurRadiusPx: number) {
  const canvases = getCanvasRefs(root);
  const kernel = createPillboxKernel(blurRadiusPx);

  canvases.original.width = APP_CANVAS_DIMENSIONS.panelWidth;
  canvases.original.height = APP_CANVAS_DIMENSIONS.panelHeight;
  canvases.corrected.width = APP_CANVAS_DIMENSIONS.panelWidth;
  canvases.corrected.height = APP_CANVAS_DIMENSIONS.panelHeight;
  canvases.blurredOriginal.width = APP_CANVAS_DIMENSIONS.panelWidth;
  canvases.blurredOriginal.height = APP_CANVAS_DIMENSIONS.panelHeight;
  canvases.blurredCorrected.width = APP_CANVAS_DIMENSIONS.panelWidth;
  canvases.blurredCorrected.height = APP_CANVAS_DIMENSIONS.panelHeight;
  canvases.otf.width = APP_CANVAS_DIMENSIONS.otfWidth;
  canvases.otf.height = APP_CANVAS_DIMENSIONS.otfHeight;

  drawTestPattern(canvases.original);
  if (state.correctionMode === CorrectionMode.Wiener) {
    const restored = deconvolveCanvasToCanvas(canvases.original, canvases.corrected, kernel, {
      maxGain: state.maxGain,
      regularizationK: state.regularizationK,
    });
    state.maxGainSeen = restored.maxGainSeen;
  } else {
    unsharpMaskCanvasToCanvas(canvases.original, canvases.corrected, kernel, {
      amount: state.unsharpAmount,
    });
    state.maxGainSeen = null;
  }
  blurCanvasToCanvas(canvases.original, canvases.blurredOriginal, kernel);
  blurCanvasToCanvas(canvases.corrected, canvases.blurredCorrected, kernel);
  renderAnalyticOtfToCanvas(canvases.otf, kernel.radiusPx);

  queryRequired<HTMLElement>(root, '[data-testid="metric-max-gain-seen"]').textContent =
    formatNumber(state.maxGainSeen);
}

export function mountApp(root: HTMLElement) {
  const state: AppState = {
    activePreset: DEFAULT_PLAYGROUND_PRESET.key,
    correctionMode: DEFAULT_RENDER_CONTROLS.correctionMode,
    maxGain: DEFAULT_RENDER_CONTROLS.maxGain,
    maxGainSeen: 0,
    regularizationK: DEFAULT_RENDER_CONTROLS.regularizationK,
    unsharpAmount: DEFAULT_RENDER_CONTROLS.unsharpAmount,
    viewerParams: cloneViewerParams(DEFAULT_PLAYGROUND_PRESET.params),
  };

  const render = () => {
    const context = createRenderContext(state);
    root.innerHTML = createAppMarkup(state, context);
    bindEvents(root, state, render);
    paintCanvases(root, state, context.blurResult.blurRadiusPx);
  };

  render();
}

function bindEvents(root: HTMLElement, state: AppState, render: () => void) {
  queryRequired<HTMLSelectElement>(root, '[data-testid="preset-select"]').addEventListener(
    "change",
    (event) => {
      const preset = findPreset((event.currentTarget as HTMLSelectElement).value);
      state.activePreset = preset.key;
      state.viewerParams = cloneViewerParams(preset.params);
      render();
    },
  );

  queryRequired<HTMLSelectElement>(root, '[data-testid="focus-mode"]').addEventListener(
    "change",
    (event) => {
      state.viewerParams = {
        ...state.viewerParams,
        focusMode: (event.currentTarget as HTMLSelectElement).value as FocusMode,
      };
      render();
    },
  );

  queryRequired<HTMLSelectElement>(root, '[data-testid="correction-mode"]').addEventListener(
    "change",
    (event) => {
      state.correctionMode = (event.currentTarget as HTMLSelectElement).value as CorrectionMode;
      render();
    },
  );

  queryRequired<HTMLInputElement>(root, '[data-testid="sphere-input"]').addEventListener(
    "input",
    (event) => {
      state.viewerParams = {
        ...state.viewerParams,
        prescription: {
          ...state.viewerParams.prescription,
          sph: Number((event.currentTarget as HTMLInputElement).value),
        },
      };
      render();
    },
  );

  queryRequired<HTMLInputElement>(root, '[data-testid="distance-input"]').addEventListener(
    "input",
    (event) => {
      state.viewerParams = {
        ...state.viewerParams,
        viewingDistanceM: Number((event.currentTarget as HTMLInputElement).value),
      };
      render();
    },
  );

  queryRequired<HTMLInputElement>(root, '[data-testid="pupil-input"]').addEventListener(
    "input",
    (event) => {
      state.viewerParams = {
        ...state.viewerParams,
        pupilDiameterMm: Number((event.currentTarget as HTMLInputElement).value),
      };
      render();
    },
  );

  queryRequired<HTMLInputElement>(root, '[data-testid="ppi-input"]').addEventListener(
    "input",
    (event) => {
      state.viewerParams = {
        ...state.viewerParams,
        screenPpi: Number((event.currentTarget as HTMLInputElement).value),
      };
      render();
    },
  );

  root
    .querySelector<HTMLInputElement>('[data-testid="wiener-input"]')
    ?.addEventListener("input", (event) => {
      state.regularizationK = Number((event.currentTarget as HTMLInputElement).value);
      render();
    });

  root
    .querySelector<HTMLInputElement>('[data-testid="max-gain-input"]')
    ?.addEventListener("input", (event) => {
      state.maxGain = Number((event.currentTarget as HTMLInputElement).value);
      render();
    });

  root
    .querySelector<HTMLInputElement>('[data-testid="unsharp-amount-input"]')
    ?.addEventListener("input", (event) => {
      state.unsharpAmount = Number((event.currentTarget as HTMLInputElement).value);
      render();
    });

  const fixedFocusInput = root.querySelector<HTMLInputElement>('[data-testid="fixed-focus-input"]');
  fixedFocusInput?.addEventListener("input", (event) => {
    state.viewerParams = {
      ...state.viewerParams,
      fixedFocusDiopters: Number((event.currentTarget as HTMLInputElement).value),
    };
    render();
  });

  const manualResidualInput = root.querySelector<HTMLInputElement>(
    '[data-testid="manual-residual-input"]',
  );
  manualResidualInput?.addEventListener("input", (event) => {
    state.viewerParams = {
      ...state.viewerParams,
      manualResidualDiopters: Number((event.currentTarget as HTMLInputElement).value),
    };
    render();
  });
}
