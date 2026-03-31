import { beforeEach, describe, expect, test } from "vite-plus/test";
import {
  APP_CANVAS_DIMENSIONS,
  DEFAULT_PLAYGROUND_PRESET,
  DEFAULT_RENDER_CONTROLS,
  WARNING_LABELS,
} from "optics-constants";
import { calculateBlurResult, createPillboxKernel, evaluateComparisonMatrix } from "optics";
import { compareCanvasCorrectionPaths, drawTestPattern } from "optics-render";
import { FocusMode, type ViewerParams } from "optics-types";

import { mountApp } from "./app.ts";
import { APP_STATE_STORAGE_KEY } from "./app-state.ts";

type ViewerParamsOverrides = Partial<Omit<ViewerParams, "prescription">> & {
  prescription?: Partial<ViewerParams["prescription"]>;
};

interface ControlOverrides {
  maxGain?: number;
  regularizationK?: number;
  unsharpAmount?: number;
}

function buildViewerParams(overrides: ViewerParamsOverrides = {}): ViewerParams {
  return {
    ...DEFAULT_PLAYGROUND_PRESET.params,
    ...overrides,
    prescription: {
      ...DEFAULT_PLAYGROUND_PRESET.params.prescription,
      ...overrides.prescription,
    },
  };
}

function queryRequired<TElement extends Element>(selector: string) {
  const element = document.querySelector<TElement>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}

function setupApp() {
  document.body.innerHTML = '<div id="app"></div>';
  mountApp(queryRequired<HTMLElement>("#app"));
}

function readMetric(testId: string) {
  const text = queryRequired<HTMLElement>(`[data-testid="${testId}"]`).textContent ?? "";
  if (/infinity/i.test(text)) {
    return Number.POSITIVE_INFINITY;
  }
  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    throw new Error(`Expected numeric content for ${testId}, received: ${text}`);
  }
  return Number(match[0]);
}

function expectMetric(testId: string, value: number) {
  if (!Number.isFinite(value)) {
    expect(readMetric(testId)).toBe(value);
    return;
  }
  expect(readMetric(testId)).toBeCloseTo(value, 3);
}

function calculateExpectedComparison(viewerParams: ViewerParams, overrides: ControlOverrides = {}) {
  const source = document.createElement("canvas");
  source.width = APP_CANVAS_DIMENSIONS.panelWidth;
  source.height = APP_CANVAS_DIMENSIONS.panelHeight;
  drawTestPattern(source);

  const blurResult = calculateBlurResult(viewerParams);
  const comparisonResult = compareCanvasCorrectionPaths(
    source,
    createPillboxKernel(blurResult.blurRadiusPx),
    {
      unsharpAmount: overrides.unsharpAmount ?? DEFAULT_RENDER_CONTROLS.unsharpAmount,
      wiener: {
        maxGain: overrides.maxGain ?? DEFAULT_RENDER_CONTROLS.maxGain,
        regularizationK: overrides.regularizationK ?? DEFAULT_RENDER_CONTROLS.regularizationK,
      },
    },
  );

  return { blurResult, comparisonResult };
}

function expectUiToMatch(viewerParams: ViewerParams, overrides: ControlOverrides = {}) {
  const { blurResult, comparisonResult } = calculateExpectedComparison(viewerParams, overrides);

  expectMetric("metric-d-display", blurResult.dDisplay);
  expectMetric("metric-d-focus", blurResult.dFocus);
  expectMetric("metric-d-res", blurResult.dRes);
  expectMetric("metric-radius", blurResult.blurRadiusPx);
  expectMetric("metric-diameter", blurResult.blurDiameterPx);
  expectMetric("metric-clipping-fraction", comparisonResult.wienerDiagnostics.clippingFraction);
  expectMetric("metric-overshoot-fraction", comparisonResult.wienerDiagnostics.overshootFraction);
  expectMetric("metric-ringing-energy", comparisonResult.wienerDiagnostics.ringingEnergy);
  expectMetric("metric-max-wiener-gain", comparisonResult.wienerDiagnostics.maxWienerGain);
  expectMetric("metric-blurred-original-rmse", comparisonResult.blurredOriginalQuality.rmse);
  expectMetric("metric-wiener-retinal-rmse", comparisonResult.wienerRetinalQuality.rmse);
  expectMetric("metric-unsharp-retinal-rmse", comparisonResult.unsharpRetinalQuality.rmse);
  expectMetric("metric-blurred-original-psnr", comparisonResult.blurredOriginalQuality.psnr);
  expectMetric("metric-wiener-retinal-psnr", comparisonResult.wienerRetinalQuality.psnr);
  expectMetric("metric-unsharp-retinal-psnr", comparisonResult.unsharpRetinalQuality.psnr);
  expectMetric("metric-blurred-original-ssim", comparisonResult.blurredOriginalQuality.ssim);
  expectMetric("metric-wiener-retinal-ssim", comparisonResult.wienerRetinalQuality.ssim);
  expectMetric("metric-unsharp-retinal-ssim", comparisonResult.unsharpRetinalQuality.ssim);

  if (blurResult.firstOtfZero === null) {
    expect(queryRequired<HTMLElement>('[data-testid="metric-first-zero"]').textContent).toMatch(
      /n\/a/i,
    );
  } else {
    expectMetric("metric-first-zero", blurResult.firstOtfZero);
  }

  const warningText = queryRequired<HTMLElement>('[data-testid="warning-list"]').textContent ?? "";
  for (const [warningKey, enabled] of Object.entries(blurResult.warnings)) {
    const label = WARNING_LABELS[warningKey as keyof typeof WARNING_LABELS];
    if (enabled) {
      expect(warningText).toContain(label);
    } else {
      expect(warningText).not.toContain(label);
    }
  }
}

function setSelectValue(testId: string, value: string) {
  const element = queryRequired<HTMLSelectElement>(`[data-testid="${testId}"]`);
  element.value = value;
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function setInputValue(testId: string, value: string) {
  const element = queryRequired<HTMLInputElement>(`[data-testid="${testId}"]`);
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

function blurInput(testId: string) {
  queryRequired<HTMLInputElement>(`[data-testid="${testId}"]`).dispatchEvent(
    new Event("blur", { bubbles: true }),
  );
}

describe("website playground browser tests", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setupApp();
  });

  test("loads the playground and renders both correction paths with diagnostics", () => {
    expect(queryRequired('[data-testid="wip-banner"]').textContent).toMatch(
      /work in progress|wip/i,
    );
    expect(queryRequired('[data-testid="wip-banner"]').textContent).toMatch(
      /not validated for real-world use/i,
    );

    expect(queryRequired('[data-testid="preset-select"]')).toBeTruthy();
    expect(queryRequired('[data-testid="focus-mode"]')).toBeTruthy();
    expect(queryRequired('[data-testid="wiener-input"]')).toBeTruthy();
    expect(queryRequired('[data-testid="max-gain-input"]')).toBeTruthy();
    expect(queryRequired('[data-testid="unsharp-amount-input"]')).toBeTruthy();

    expect(queryRequired('[data-testid="canvas-original"]')).toBeTruthy();
    expect(queryRequired('[data-testid="canvas-wiener-corrected"]')).toBeTruthy();
    expect(queryRequired('[data-testid="canvas-unsharp-corrected"]')).toBeTruthy();
    expect(queryRequired('[data-testid="canvas-blurred-original"]')).toBeTruthy();
    expect(queryRequired('[data-testid="canvas-blurred-wiener"]')).toBeTruthy();
    expect(queryRequired('[data-testid="canvas-blurred-unsharp"]')).toBeTruthy();
    expect(queryRequired('[data-testid="canvas-otf"]')).toBeTruthy();

    expectUiToMatch(DEFAULT_PLAYGROUND_PRESET.params);

    const matrixSummary = evaluateComparisonMatrix({
      params: {
        unsharpAmount: DEFAULT_RENDER_CONTROLS.unsharpAmount,
        wiener: {
          maxGain: DEFAULT_RENDER_CONTROLS.maxGain,
          regularizationK: DEFAULT_RENDER_CONTROLS.regularizationK,
        },
      },
    });

    expect(queryRequired<HTMLElement>('[data-testid="matrix-summary"]').textContent).toContain(
      `Wiener is better than unsharp retinal in ${matrixSummary.wienerVsUnsharp.betterCaseCount}/${matrixSummary.wienerVsUnsharp.totalCaseCount} cases`,
    );
    expect(queryRequired<HTMLElement>('[data-testid="matrix-no-win"]').textContent).toMatch(
      /does not show a Wiener win/i,
    );
  });

  test("left-eye preset surfaces the astigmatism-not-rendered warning", () => {
    setSelectValue("preset-select", "alex-left-eye");
    expect(queryRequired<HTMLElement>('[data-testid="warning-list"]').textContent).toContain(
      WARNING_LABELS.astigmatismNotRendered,
    );
  });

  test("screen-focused mode yields near-zero residual defocus at the current distance", () => {
    setSelectValue("focus-mode", FocusMode.ScreenFocused);

    expect(document.querySelector('[data-testid="fixed-focus-input"]')).toBeNull();
    expect(document.querySelector('[data-testid="manual-residual-input"]')).toBeNull();

    expectUiToMatch(buildViewerParams({ focusMode: FocusMode.ScreenFocused }));
  });

  test("relaxed far-point mode reproduces the verified -2 D at 50 cm near-zero case", () => {
    setSelectValue("focus-mode", FocusMode.RelaxedFarPoint);
    setInputValue("sphere-input", "-2");
    setInputValue("distance-input", "0.5");

    expectUiToMatch(
      buildViewerParams({
        focusMode: FocusMode.RelaxedFarPoint,
        prescription: { sph: -2 },
        viewingDistanceM: 0.5,
      }),
    );
  });

  test("fixed-focus mode shows and uses the fixed-focus input correctly", () => {
    setSelectValue("focus-mode", FocusMode.FixedFocus);

    expect(queryRequired('[data-testid="fixed-focus-input"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="manual-residual-input"]')).toBeNull();

    setInputValue("fixed-focus-input", "1.25");

    expectUiToMatch(
      buildViewerParams({
        fixedFocusDiopters: 1.25,
        focusMode: FocusMode.FixedFocus,
      }),
    );
  });

  test("manual-residual mode shows and uses the manual residual input correctly", () => {
    setSelectValue("focus-mode", FocusMode.ManualResidual);

    expect(queryRequired('[data-testid="manual-residual-input"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="fixed-focus-input"]')).toBeNull();

    setInputValue("manual-residual-input", "1.5");

    expectUiToMatch(
      buildViewerParams({
        focusMode: FocusMode.ManualResidual,
        manualResidualDiopters: 1.5,
      }),
    );
  });

  test("prescription-estimate mode stays explicitly approximate and updates coherently", () => {
    setSelectValue("focus-mode", FocusMode.PrescriptionEstimate);
    setInputValue("sphere-input", "-1");

    expect(
      queryRequired<HTMLElement>('[data-testid="focus-mode-description"]').textContent,
    ).toMatch(/approximate/i);
    expectUiToMatch(
      buildViewerParams({
        focusMode: FocusMode.PrescriptionEstimate,
        prescription: { sph: -1 },
      }),
    );
  });

  test("transient empty numeric input does not reset the model before a valid value arrives", () => {
    const baselineResidual = readMetric("metric-d-res");
    const distanceInput = queryRequired<HTMLInputElement>('[data-testid="distance-input"]');

    setInputValue("distance-input", "");

    expect(distanceInput.value).toBe("");
    expect(readMetric("metric-d-res")).toBeCloseTo(baselineResidual, 3);

    setInputValue("distance-input", "0.5");

    expectUiToMatch(buildViewerParams({ viewingDistanceM: 0.5 }));
  });

  test("reload restores the last persisted manual experiment state", () => {
    setSelectValue("focus-mode", FocusMode.ManualResidual);
    setInputValue("manual-residual-input", "1.5");
    setInputValue("wiener-input", "0.01");
    setInputValue("max-gain-input", "6");

    expectUiToMatch(
      buildViewerParams({
        focusMode: FocusMode.ManualResidual,
        manualResidualDiopters: 1.5,
      }),
      {
        maxGain: 6,
        regularizationK: 0.01,
      },
    );
    expect(window.localStorage.getItem(APP_STATE_STORAGE_KEY)).toContain(
      `"focusMode":"${FocusMode.ManualResidual}"`,
    );

    setupApp();

    expect(queryRequired<HTMLSelectElement>('[data-testid="focus-mode"]').value).toBe(
      FocusMode.ManualResidual,
    );
    expect(queryRequired<HTMLInputElement>('[data-testid="manual-residual-input"]').value).toBe(
      "1.5",
    );
    expect(queryRequired<HTMLInputElement>('[data-testid="wiener-input"]').value).toBe("0.01");
    expect(queryRequired<HTMLInputElement>('[data-testid="max-gain-input"]').value).toBe("6");
    expectUiToMatch(
      buildViewerParams({
        focusMode: FocusMode.ManualResidual,
        manualResidualDiopters: 1.5,
      }),
      {
        maxGain: 6,
        regularizationK: 0.01,
      },
    );
  });

  test("invalid persisted state falls back to the default preset safely", () => {
    window.localStorage.setItem(APP_STATE_STORAGE_KEY, '{"broken":true}');

    setupApp();

    expect(queryRequired<HTMLSelectElement>('[data-testid="focus-mode"]').value).toBe(
      DEFAULT_PLAYGROUND_PRESET.params.focusMode,
    );
    expectUiToMatch(DEFAULT_PLAYGROUND_PRESET.params);
  });

  test("out-of-range numeric controls restore the last valid state on blur", () => {
    const baselineResidual = readMetric("metric-d-res");

    setInputValue("ppi-input", "50");

    expect(queryRequired<HTMLInputElement>('[data-testid="ppi-input"]').value).toBe("50");
    expect(readMetric("metric-d-res")).toBeCloseTo(baselineResidual, 3);

    blurInput("ppi-input");

    expect(queryRequired<HTMLInputElement>('[data-testid="ppi-input"]').value).toBe(
      String(DEFAULT_PLAYGROUND_PRESET.params.screenPpi),
    );
    expectUiToMatch(DEFAULT_PLAYGROUND_PRESET.params);

    setInputValue("wiener-input", "0.5");
    blurInput("wiener-input");

    expect(queryRequired<HTMLInputElement>('[data-testid="wiener-input"]').value).toBe(
      String(DEFAULT_RENDER_CONTROLS.regularizationK),
    );
    expectUiToMatch(DEFAULT_PLAYGROUND_PRESET.params);
  });

  test("invalid focus-mode mutations are ignored and the UI snaps back to a valid mode", () => {
    const focusModeSelect = queryRequired<HTMLSelectElement>('[data-testid="focus-mode"]');

    focusModeSelect.value = "not-a-focus-mode";
    focusModeSelect.dispatchEvent(new Event("change", { bubbles: true }));

    expect(focusModeSelect.value).toBe(DEFAULT_PLAYGROUND_PRESET.params.focusMode);
    expectUiToMatch(DEFAULT_PLAYGROUND_PRESET.params);
  });

  test("sequential control changes keep the browser metrics coherent", () => {
    let params = buildViewerParams();
    const controls: ControlOverrides = {};

    setSelectValue("focus-mode", FocusMode.FixedFocus);
    params = { ...params, fixedFocusDiopters: 0, focusMode: FocusMode.FixedFocus };
    expectUiToMatch(params, controls);

    setInputValue("fixed-focus-input", "1.25");
    params = { ...params, fixedFocusDiopters: 1.25 };
    expectUiToMatch(params, controls);

    setInputValue("sphere-input", "-3.5");
    params = {
      ...params,
      prescription: { ...params.prescription, sph: -3.5 },
    };
    expectUiToMatch(params, controls);

    setInputValue("distance-input", "0.4");
    params = { ...params, viewingDistanceM: 0.4 };
    expectUiToMatch(params, controls);

    setInputValue("pupil-input", "6.5");
    params = { ...params, pupilDiameterMm: 6.5 };
    expectUiToMatch(params, controls);

    setInputValue("wiener-input", "0.01");
    controls.regularizationK = 0.01;
    expectUiToMatch(params, controls);

    setInputValue("max-gain-input", "6");
    controls.maxGain = 6;
    expectUiToMatch(params, controls);

    setInputValue("unsharp-amount-input", "2.2");
    controls.unsharpAmount = 2.2;
    expectUiToMatch(params, controls);
  });

  test("warning regimes trigger their expected browser-visible states", () => {
    setSelectValue("focus-mode", FocusMode.ManualResidual);

    setInputValue("manual-residual-input", "0.2");
    expectUiToMatch(
      buildViewerParams({
        focusMode: FocusMode.ManualResidual,
        manualResidualDiopters: 0.2,
      }),
    );

    setInputValue("manual-residual-input", "1");
    expectUiToMatch(
      buildViewerParams({
        focusMode: FocusMode.ManualResidual,
        manualResidualDiopters: 1,
      }),
    );

    setInputValue("manual-residual-input", "2.5");
    expectUiToMatch(
      buildViewerParams({
        focusMode: FocusMode.ManualResidual,
        manualResidualDiopters: 2.5,
      }),
    );
    expect(queryRequired<HTMLElement>('[data-testid="warning-list"]').textContent).toContain(
      WARNING_LABELS.largeRadiusRegime,
    );
  });

  test("all panel and OTF canvases use the expected backing dimensions", () => {
    const panelCanvases = [
      "canvas-original",
      "canvas-wiener-corrected",
      "canvas-unsharp-corrected",
      "canvas-blurred-original",
      "canvas-blurred-wiener",
      "canvas-blurred-unsharp",
    ] as const;

    for (const testId of panelCanvases) {
      const canvas = queryRequired<HTMLCanvasElement>(`[data-testid="${testId}"]`);
      expect(canvas.width).toBe(APP_CANVAS_DIMENSIONS.panelWidth);
      expect(canvas.height).toBe(APP_CANVAS_DIMENSIONS.panelHeight);
    }

    const otfCanvas = queryRequired<HTMLCanvasElement>('[data-testid="canvas-otf"]');
    expect(otfCanvas.width).toBe(APP_CANVAS_DIMENSIONS.otfWidth);
    expect(otfCanvas.height).toBe(APP_CANVAS_DIMENSIONS.otfHeight);
    expect(queryRequired('[data-testid="matrix-table"] tbody')?.children.length).toBe(12);
  });
});
