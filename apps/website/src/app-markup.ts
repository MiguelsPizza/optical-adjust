import {
  APP_COPY,
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
  QUALITY_METRIC_LABELS,
  SCREEN_PPI_INPUT_STEP,
  UNSHARP_CONTROL_RANGES,
  VIEWING_DISTANCE_INPUT_STEP_M,
  WARNING_LABELS,
  WARNING_MESSAGES,
  WIENER_CONTROL_RANGES,
} from "optics-constants";
import { FocusMode, type Nullable, type ViewerParams } from "optics-types";

import type { AppRenderContext, AppState } from "./app-types.ts";

interface MetricRow {
  label: string;
  testId: string;
  value: string;
}

interface QualityMetricRow {
  label: string;
  prefix: string;
  psnr: string;
  rmse: string;
  ssim: string;
}

interface PanelDescriptor {
  caption: string;
  className?: string;
  step: number;
  testId: string;
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
  return FOCUS_MODE_OPTIONS.find((option) => option.value === focusMode)?.description ?? "";
}

function createMetricRow({ label, testId, value }: MetricRow) {
  return `
    <div class="metric-row">
      <dt>${escapeHtml(label)}</dt>
      <dd data-testid="${escapeHtml(testId)}">${value}</dd>
    </div>
  `;
}

function createMetricStrip(testId: string, rows: ReadonlyArray<MetricRow>) {
  return `
    <section class="metrics-strip" data-testid="${escapeHtml(testId)}">
      ${rows.map(createMetricRow).join("")}
    </section>
  `;
}

function createControlGridMarkup(state: AppState) {
  return `
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
        ${escapeHtml(FIELD_LABELS.wienerK)}
        <div class="range-row">
          <input data-testid="wiener-input" type="range" min="${WIENER_CONTROL_RANGES.regularizationKMin}" max="${WIENER_CONTROL_RANGES.regularizationKMax}" step="${WIENER_CONTROL_RANGES.regularizationKStep}" value="${state.regularizationK}" />
          <span class="range-value">${formatNumber(state.regularizationK)}</span>
        </div>
      </label>
      <label>
        ${escapeHtml(FIELD_LABELS.maxWienerGain)}
        <div class="range-row">
          <input data-testid="max-gain-input" type="range" min="${WIENER_CONTROL_RANGES.maxGainMin}" max="${WIENER_CONTROL_RANGES.maxGainMax}" step="${WIENER_CONTROL_RANGES.maxGainStep}" value="${state.maxGain}" />
          <span class="range-value">${formatNumber(state.maxGain, NUMBER_FORMATTING.oneDecimalDigits)}</span>
        </div>
      </label>
      <label>
        ${escapeHtml(FIELD_LABELS.unsharpAmount)}
        <div class="range-row">
          <input data-testid="unsharp-amount-input" type="range" min="${UNSHARP_CONTROL_RANGES.amountMin}" max="${UNSHARP_CONTROL_RANGES.amountMax}" step="${UNSHARP_CONTROL_RANGES.amountStep}" value="${state.unsharpAmount}" />
          <span class="range-value">${formatNumber(state.unsharpAmount, NUMBER_FORMATTING.oneDecimalDigits)}</span>
        </div>
      </label>
      ${createConditionalControls(state.viewerParams)}
    </section>
  `;
}

function createMetricsMarkup(context: AppRenderContext) {
  const blurRows: MetricRow[] = [
    {
      label: METRIC_LABELS.blurRadius,
      testId: "metric-radius",
      value: formatNumber(context.blurResult.blurRadiusPx),
    },
    {
      label: METRIC_LABELS.blurDiameter,
      testId: "metric-diameter",
      value: formatNumber(context.blurResult.blurDiameterPx),
    },
    {
      label: METRIC_LABELS.firstOtfZero,
      testId: "metric-first-zero",
      value: formatNumber(context.blurResult.firstOtfZero),
    },
  ];

  const diagnosticRows: MetricRow[] = [
    {
      label: METRIC_LABELS.clippingFraction,
      testId: "metric-clipping-fraction",
      value: formatNumber(context.comparisonResult.wienerDiagnostics.clippingFraction),
    },
    {
      label: METRIC_LABELS.overshootFraction,
      testId: "metric-overshoot-fraction",
      value: formatNumber(context.comparisonResult.wienerDiagnostics.overshootFraction),
    },
    {
      label: METRIC_LABELS.ringingEnergy,
      testId: "metric-ringing-energy",
      value: formatNumber(context.comparisonResult.wienerDiagnostics.ringingEnergy),
    },
    {
      label: METRIC_LABELS.maxWienerGain,
      testId: "metric-max-wiener-gain",
      value: formatNumber(context.comparisonResult.wienerDiagnostics.maxWienerGain),
    },
  ];

  return `
    <div class="metrics-stack">
      ${createMetricStrip("blur-metrics", blurRows)}
      ${createMetricStrip("wiener-diagnostics", diagnosticRows)}
    </div>
  `;
}

function createQualityRowMarkup(row: QualityMetricRow) {
  return `
    <tr>
      <th>${escapeHtml(row.label)}</th>
      <td data-testid="${escapeHtml(`${row.prefix}-rmse`)}">${row.rmse}</td>
      <td data-testid="${escapeHtml(`${row.prefix}-psnr`)}">${row.psnr}</td>
      <td data-testid="${escapeHtml(`${row.prefix}-ssim`)}">${row.ssim}</td>
    </tr>
  `;
}

function createQualityPanelMarkup(context: AppRenderContext) {
  const rows: QualityMetricRow[] = [
    {
      label: QUALITY_METRIC_LABELS.blurredOriginal,
      prefix: "metric-blurred-original",
      psnr: formatNumber(context.comparisonResult.blurredOriginalQuality.psnr),
      rmse: formatNumber(context.comparisonResult.blurredOriginalQuality.rmse),
      ssim: formatNumber(context.comparisonResult.blurredOriginalQuality.ssim),
    },
    {
      label: QUALITY_METRIC_LABELS.wienerRetinal,
      prefix: "metric-wiener-retinal",
      psnr: formatNumber(context.comparisonResult.wienerRetinalQuality.psnr),
      rmse: formatNumber(context.comparisonResult.wienerRetinalQuality.rmse),
      ssim: formatNumber(context.comparisonResult.wienerRetinalQuality.ssim),
    },
    {
      label: QUALITY_METRIC_LABELS.unsharpRetinal,
      prefix: "metric-unsharp-retinal",
      psnr: formatNumber(context.comparisonResult.unsharpRetinalQuality.psnr),
      rmse: formatNumber(context.comparisonResult.unsharpRetinalQuality.rmse),
      ssim: formatNumber(context.comparisonResult.unsharpRetinalQuality.ssim),
    },
  ];

  return `
    <section class="quality-panel">
      <h2>Objective Comparison</h2>
      <table class="quality-table" data-testid="quality-table">
        <thead>
          <tr>
            <th>Path</th>
            <th>${escapeHtml(QUALITY_METRIC_LABELS.rmse)}</th>
            <th>${escapeHtml(QUALITY_METRIC_LABELS.psnr)}</th>
            <th>${escapeHtml(QUALITY_METRIC_LABELS.ssim)}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(createQualityRowMarkup).join("")}
        </tbody>
      </table>
    </section>
  `;
}

function createPanelGridMarkup() {
  const panels: ReadonlyArray<PanelDescriptor> = [
    { caption: PANEL_CAPTIONS.original, step: 1, testId: "canvas-original" },
    {
      caption: PANEL_CAPTIONS.wienerCorrected,
      className: " is-result",
      step: 2,
      testId: "canvas-wiener-corrected",
    },
    {
      caption: PANEL_CAPTIONS.unsharpCorrected,
      step: 3,
      testId: "canvas-unsharp-corrected",
    },
    { caption: PANEL_CAPTIONS.blurredOriginal, step: 4, testId: "canvas-blurred-original" },
    {
      caption: PANEL_CAPTIONS.wienerRetinal,
      className: " is-result",
      step: 5,
      testId: "canvas-blurred-wiener",
    },
    { caption: PANEL_CAPTIONS.unsharpRetinal, step: 6, testId: "canvas-blurred-unsharp" },
  ];

  return `
    <section class="panel-grid">
      ${panels
        .map(
          (panel) => `
            <figure${panel.className ? ` class="${panel.className.trim()}"` : ""}>
              <figcaption><span class="step-num">${panel.step}</span> ${escapeHtml(panel.caption)}</figcaption>
              <canvas data-testid="${panel.testId}"></canvas>
            </figure>
          `,
        )
        .join("")}
    </section>
  `;
}

/**
 * Builds the full browser playground markup for the current state and derived
 * optics context.
 */
export function createAppMarkup(state: AppState, context: AppRenderContext) {
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
          <a class="relay-btn" href="https://pub-78d75f975fdc4f1cb9ef2d6168bb54ff.r2.dev/relay/webmcp-local-relay-latest.mcpb" download="webmcp-local-relay.mcpb">
            &#x2193; Local Relay
          </a>
        </div>
        <p data-testid="comparison-description">${escapeHtml(APP_COPY.comparisonDescription)}</p>
        <p data-testid="focus-mode-description">${escapeHtml(
          getFocusModeDescription(state.viewerParams.focusMode),
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
        ${createControlGridMarkup(state)}
        ${createMetricsMarkup(context)}
      </div>

      ${createQualityPanelMarkup(context)}

      <div class="warnings" data-testid="warning-list">
        ${createWarningMarkup(context.warningEntries)}
      </div>

      ${createPanelGridMarkup()}

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
