import { describe, expect, test } from "vite-plus/test";
import {
  compareCorrectionPaths,
  createPillboxKernel,
  firstOtfZero,
  measureImageQuality,
} from "../../optics/src/index.ts";

import {
  COMPARISON_BLUR_RADII,
  COMPARISON_FIXTURE_SIZE,
  COMPARISON_METRIC_GOLDENS,
  COMPARISON_TARGET_FACTORIES,
  DEFAULT_COMPARISON_PARAMS,
} from "../../../tests/support/comparison-goldens.ts";
import {
  compareCanvasCorrectionPaths,
  imageDataToLinearLuminance,
  linearChannelToSrgb,
  readCanvasLuminance,
  renderAnalyticOtfToCanvas,
  renderPsfToCanvas,
  srgbChannelToLinear,
  writeFloatImageToCanvas,
} from "../src/index.ts";

function countLitPixels(pixels: Uint8ClampedArray) {
  let litPixels = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index] > 0) {
      litPixels += 1;
    }
  }
  return litPixels;
}

function countRedMarkerPixels(pixels: Uint8ClampedArray, width: number, height: number, x: number) {
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    const base = (y * width + x) * 4;
    if (pixels[base] > 200 && pixels[base + 1] < 100 && pixels[base + 2] < 140) {
      count += 1;
    }
  }
  return count;
}

describe("optics-render browser helpers", () => {
  test("converts between sRGB and linear light", () => {
    expect(srgbChannelToLinear(128)).toBeCloseTo(0.21586, 4);
    expect(linearChannelToSrgb(0.21586)).toBeCloseTo(128, 0);

    const imageData = new ImageData(1, 1);
    imageData.data.set([255, 255, 255, 255]);
    expect(imageDataToLinearLuminance(imageData)[0]).toBeCloseTo(1, 12);
  });

  test("renders a pillbox PSF with the expected footprint", () => {
    const kernel = createPillboxKernel(2);
    const canvas = document.createElement("canvas");

    renderPsfToCanvas(canvas, kernel);
    const pixels = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data;
    if (!pixels) {
      throw new Error("Expected pixel data.");
    }

    const centerIndex = (2 * canvas.width + 2) * 4;
    const northIndex = (1 * canvas.width + 2) * 4;
    const southIndex = (3 * canvas.width + 2) * 4;

    expect(canvas.width).toBe(kernel.width);
    expect(canvas.height).toBe(kernel.height);
    expect(countLitPixels(pixels)).toBe(kernel.data.filter((value) => value > 0).length);
    expect(pixels[centerIndex]).toBeGreaterThan(200);
    expect(pixels[northIndex]).toBe(pixels[southIndex]);
    expect(pixels[0]).toBe(0);
  });

  test("renders the OTF curve and zero marker across the expected column", () => {
    const radiusPx = 10;
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 80;

    renderAnalyticOtfToCanvas(canvas, radiusPx);
    const pixels = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data;
    if (!pixels) {
      throw new Error("Expected pixel data.");
    }

    const markerX = Math.round(((firstOtfZero(radiusPx) ?? 0) / 0.5) * (canvas.width - 1));
    const markerPixelCount = countRedMarkerPixels(pixels, canvas.width, canvas.height, markerX);
    const darkPixelCount = pixels.reduce(
      (count, value, index) =>
        index % 4 === 0 && value < 64 && pixels[index + 1]! < 64 && pixels[index + 2]! < 64
          ? count + 1
          : count,
      0,
    );

    expect(markerPixelCount).toBeGreaterThan(canvas.height * 0.8);
    expect(darkPixelCount).toBeGreaterThan(canvas.width);
  });

  test("browser comparison helper stays aligned with optics-core across the shared matrix", () => {
    for (const { create, slug } of COMPARISON_TARGET_FACTORIES) {
      for (const radius of COMPARISON_BLUR_RADII) {
        const target = create(COMPARISON_FIXTURE_SIZE.width, COMPARISON_FIXTURE_SIZE.height);
        const source = document.createElement("canvas");
        source.width = target.width;
        source.height = target.height;
        writeFloatImageToCanvas(source, target.data, target.width, target.height);

        const sourceLuminance = readCanvasLuminance(source);
        const sourceGrid = { data: sourceLuminance, height: target.height, width: target.width };
        const kernel = createPillboxKernel(radius);
        const browserResult = compareCanvasCorrectionPaths(
          source,
          kernel,
          DEFAULT_COMPARISON_PARAMS,
        );
        const coreResult = compareCorrectionPaths(sourceGrid, kernel, DEFAULT_COMPARISON_PARAMS);
        const key = `${slug}:${radius}` as keyof typeof COMPARISON_METRIC_GOLDENS;
        const golden = COMPARISON_METRIC_GOLDENS[key];

        const blurredParity = measureImageQuality(
          coreResult.blurredOriginal.data,
          browserResult.blurredOriginal.data,
          target.width,
          target.height,
        );
        const wienerParity = measureImageQuality(
          coreResult.wienerRetinal.data,
          browserResult.wienerRetinal.data,
          target.width,
          target.height,
        );
        const unsharpParity = measureImageQuality(
          coreResult.unsharpRetinal.data,
          browserResult.unsharpRetinal.data,
          target.width,
          target.height,
        );

        expect(blurredParity.rmse).toBeLessThan(1e-12);
        expect(wienerParity.rmse).toBeLessThan(1e-12);
        expect(unsharpParity.rmse).toBeLessThan(1e-12);
        expect(browserResult.wienerDiagnostics.clippingFraction).toBeCloseTo(
          coreResult.wienerDiagnostics.clippingFraction,
          12,
        );
        expect(browserResult.wienerDiagnostics.overshootFraction).toBeCloseTo(
          coreResult.wienerDiagnostics.overshootFraction,
          12,
        );
        expect(browserResult.wienerDiagnostics.ringingEnergy).toBeCloseTo(
          coreResult.wienerDiagnostics.ringingEnergy,
          12,
        );
        expect(browserResult.wienerDiagnostics.maxWienerGain).toBeCloseTo(
          coreResult.wienerDiagnostics.maxWienerGain,
          12,
        );
        expect(browserResult.blurredOriginalQuality.rmse).toBeCloseTo(golden.blurred.rmse, 6);
        expect(browserResult.blurredOriginalQuality.psnr).toBeCloseTo(golden.blurred.psnr, 6);
        expect(browserResult.blurredOriginalQuality.ssim).toBeCloseTo(golden.blurred.ssim, 6);
        expect(browserResult.unsharpRetinalQuality.rmse).toBeCloseTo(golden.unsharp.rmse, 6);
        expect(browserResult.unsharpRetinalQuality.psnr).toBeCloseTo(golden.unsharp.psnr, 6);
        expect(browserResult.unsharpRetinalQuality.ssim).toBeCloseTo(golden.unsharp.ssim, 6);
        expect(browserResult.wienerRetinalQuality.rmse).toBeCloseTo(golden.wiener.rmse, 6);
        expect(browserResult.wienerRetinalQuality.psnr).toBeCloseTo(golden.wiener.psnr, 6);
        expect(browserResult.wienerRetinalQuality.ssim).toBeCloseTo(golden.wiener.ssim, 6);
        expect(browserResult.wienerDiagnostics.clippingFraction).toBeCloseTo(
          golden.diagnostics.clippingFraction,
          6,
        );
        expect(browserResult.wienerDiagnostics.overshootFraction).toBeCloseTo(
          golden.diagnostics.overshootFraction,
          6,
        );
        expect(browserResult.wienerDiagnostics.ringingEnergy).toBeCloseTo(
          golden.diagnostics.ringingEnergy,
          6,
        );
      }
    }
  });

  test("canvas writes preserve the comparison-result images within browser tolerances", () => {
    const target = COMPARISON_TARGET_FACTORIES[2]!.create(
      COMPARISON_FIXTURE_SIZE.width,
      COMPARISON_FIXTURE_SIZE.height,
    );
    const source = document.createElement("canvas");
    source.width = target.width;
    source.height = target.height;
    writeFloatImageToCanvas(source, target.data, target.width, target.height);

    const result = compareCanvasCorrectionPaths(
      source,
      createPillboxKernel(COMPARISON_BLUR_RADII[1]),
      DEFAULT_COMPARISON_PARAMS,
    );
    const rendered = document.createElement("canvas");
    rendered.width = target.width;
    rendered.height = target.height;
    writeFloatImageToCanvas(
      rendered,
      result.wienerRetinal.data,
      result.wienerRetinal.width,
      result.wienerRetinal.height,
    );

    const renderedLuminance = readCanvasLuminance(rendered);
    const parity = measureImageQuality(
      result.wienerRetinal.data,
      renderedLuminance,
      target.width,
      target.height,
    );

    expect(parity.rmse).toBeLessThan(0.025);
    expect(parity.ssim).toBeGreaterThan(0.98);
  });
});
