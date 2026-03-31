import { beforeEach, describe, expect, test } from "vite-plus/test";
import { APP_CANVAS_DIMENSIONS, DEFAULT_PLAYGROUND_PRESET, WARNING_LABELS } from "optics-constants";
import { calculateBlurResult } from "optics";
import { CorrectionMode, FocusMode, type ViewerParams } from "optics-types";

import { mountApp } from "./app.ts";

function buildViewerParams(overrides: Partial<ViewerParams> = {}): ViewerParams {
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
  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    throw new Error(`Expected numeric content for ${testId}, received: ${text}`);
  }
  return Number(match[0]);
}

function expectMetric(testId: string, value: number) {
  expect(readMetric(testId)).toBeCloseTo(value, 3);
}

function expectUiToMatch(viewerParams: ViewerParams) {
  const blurResult = calculateBlurResult(viewerParams);

  expectMetric("metric-d-display", blurResult.dDisplay);
  expectMetric("metric-d-focus", blurResult.dFocus);
  expectMetric("metric-d-res", blurResult.dRes);
  expectMetric("metric-radius", blurResult.blurRadiusPx);
  expectMetric("metric-diameter", blurResult.blurDiameterPx);

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

describe("website playground browser tests", () => {
  beforeEach(() => {
    setupApp();
  });

  test("loads the playground and renders all public diagnostics", () => {
    expect(queryRequired('[data-testid="preset-select"]')).toBeTruthy();
    expect(queryRequired<HTMLSelectElement>('[data-testid="preset-select"]').value).toBe(
      "alex-right-eye",
    );

    expect(queryRequired('[data-testid="canvas-original"]')).toBeTruthy();
    expect(queryRequired('[data-testid="canvas-corrected"]')).toBeTruthy();
    expect(queryRequired('[data-testid="canvas-blurred-original"]')).toBeTruthy();
    expect(queryRequired('[data-testid="canvas-blurred-corrected"]')).toBeTruthy();
    expect(queryRequired('[data-testid="canvas-otf"]')).toBeTruthy();

    expectUiToMatch(DEFAULT_PLAYGROUND_PRESET.params);
    expect(readMetric("metric-max-gain-seen")).toBeGreaterThan(0);
  });

  test("left-eye preset surfaces the astigmatism-not-rendered warning", () => {
    setSelectValue("preset-select", "alex-left-eye");
    expect(queryRequired<HTMLElement>('[data-testid="warning-list"]').textContent).toContain(
      WARNING_LABELS.astigmatismNotRendered,
    );
  });

  test("unsharp mode exposes the baseline control and hides Wiener-only controls", () => {
    setSelectValue("correction-mode", CorrectionMode.UnsharpMask);

    expect(queryRequired('[data-testid="unsharp-amount-input"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="wiener-input"]')).toBeNull();
    expect(document.querySelector('[data-testid="max-gain-input"]')).toBeNull();
    expect(queryRequired<HTMLElement>('[data-testid="metric-max-gain-seen"]').textContent).toMatch(
      /n\/a/i,
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

  test("sequential control changes keep the browser metrics coherent", () => {
    let params = buildViewerParams();

    setSelectValue("focus-mode", FocusMode.FixedFocus);
    params = { ...params, fixedFocusDiopters: 0, focusMode: FocusMode.FixedFocus };
    expectUiToMatch(params);

    setInputValue("fixed-focus-input", "1.25");
    params = { ...params, fixedFocusDiopters: 1.25 };
    expectUiToMatch(params);

    setInputValue("sphere-input", "-3.5");
    params = {
      ...params,
      prescription: { ...params.prescription, sph: -3.5 },
    };
    expectUiToMatch(params);

    setInputValue("distance-input", "0.4");
    params = { ...params, viewingDistanceM: 0.4 };
    expectUiToMatch(params);

    setInputValue("pupil-input", "6.5");
    params = { ...params, pupilDiameterMm: 6.5 };
    expectUiToMatch(params);
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
      "canvas-corrected",
      "canvas-blurred-original",
      "canvas-blurred-corrected",
    ] as const;

    for (const testId of panelCanvases) {
      const canvas = queryRequired<HTMLCanvasElement>(`[data-testid="${testId}"]`);
      expect(canvas.width).toBe(APP_CANVAS_DIMENSIONS.panelWidth);
      expect(canvas.height).toBe(APP_CANVAS_DIMENSIONS.panelHeight);
    }

    const otfCanvas = queryRequired<HTMLCanvasElement>('[data-testid="canvas-otf"]');
    expect(otfCanvas.width).toBe(APP_CANVAS_DIMENSIONS.otfWidth);
    expect(otfCanvas.height).toBe(APP_CANVAS_DIMENSIONS.otfHeight);
  });
});
