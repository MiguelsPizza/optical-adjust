import { describe, expect, test } from "vite-plus/test";
import {
  convolveImageSpatial,
  createPillboxKernel,
  createSlantedEdgeTarget,
  deconvolveImage,
  firstOtfZero,
  measureImageQuality,
} from "../../optics/src/index.ts";

import {
  blurCanvasToCanvas,
  deconvolveCanvasToCanvas,
  imageDataToLinearLuminance,
  linearChannelToSrgb,
  readCanvasLuminance,
  renderAnalyticOtfToCanvas,
  renderPsfToCanvas,
  srgbChannelToLinear,
  unsharpMaskCanvasToCanvas,
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

function clampImage(data: Float64Array) {
  return Float64Array.from(data, (value) => Math.min(1, Math.max(0, value)));
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

  test("browser canvas blur and deconvolution remain aligned with optics-core expectations", () => {
    const wienerParams = {
      maxGain: 4,
      regularizationK: 0.001,
    };
    const targets = [createSlantedEdgeTarget(64, 64)];
    const radii = [1, 1.5, 2];

    for (const target of targets) {
      for (const radius of radii) {
        const source = document.createElement("canvas");
        source.width = target.width;
        source.height = target.height;
        writeFloatImageToCanvas(source, target.data, target.width, target.height);

        const kernel = createPillboxKernel(radius);
        const blurred = document.createElement("canvas");
        const corrected = document.createElement("canvas");
        const retinalCorrected = document.createElement("canvas");

        blurCanvasToCanvas(source, blurred, kernel);
        const restored = deconvolveCanvasToCanvas(source, corrected, kernel, wienerParams);
        blurCanvasToCanvas(corrected, retinalCorrected, kernel);

        const sourceLuminance = readCanvasLuminance(source);
        const blurredLuminance = readCanvasLuminance(blurred);
        const correctedLuminance = readCanvasLuminance(corrected);
        const retinalCorrectedLuminance = readCanvasLuminance(retinalCorrected);

        const expectedBlur = convolveImageSpatial(
          { data: sourceLuminance, height: target.height, width: target.width },
          kernel,
        );
        const expectedCorrected = deconvolveImage(
          { data: sourceLuminance, height: target.height, width: target.width },
          kernel,
          wienerParams,
        );
        const expectedRetinalCorrected = convolveImageSpatial(
          {
            data: clampImage(expectedCorrected.data),
            height: target.height,
            width: target.width,
          },
          kernel,
        );

        const blurParity = measureImageQuality(
          expectedBlur.data,
          blurredLuminance,
          target.width,
          target.height,
        );
        const correctedParity = measureImageQuality(
          clampImage(expectedCorrected.data),
          correctedLuminance,
          target.width,
          target.height,
        );
        const retinalCorrectedParity = measureImageQuality(
          expectedRetinalCorrected.data,
          retinalCorrectedLuminance,
          target.width,
          target.height,
        );

        expect(blurParity.rmse).toBeLessThan(0.02);
        expect(blurParity.ssim).toBeGreaterThan(0.99);
        expect(correctedParity.rmse).toBeLessThan(0.025);
        expect(correctedParity.ssim).toBeGreaterThan(0.98);
        expect(retinalCorrectedParity.rmse).toBeLessThan(0.03);
        expect(retinalCorrectedParity.ssim).toBeGreaterThan(0.97);
        expect(restored.maxGainSeen).toBeGreaterThan(1);
      }
    }
  });

  test("browser canvas unsharp masking matches the baseline edge-enhancement formula", () => {
    const amount = 1.5;
    const target = createSlantedEdgeTarget(64, 64);
    const source = document.createElement("canvas");
    source.width = target.width;
    source.height = target.height;
    writeFloatImageToCanvas(source, target.data, target.width, target.height);

    const kernel = createPillboxKernel(1.5);
    const corrected = document.createElement("canvas");

    unsharpMaskCanvasToCanvas(source, corrected, kernel, { amount });

    const sourceLuminance = readCanvasLuminance(source);
    const correctedLuminance = readCanvasLuminance(corrected);
    const expectedBlur = convolveImageSpatial(
      { data: sourceLuminance, height: target.height, width: target.width },
      kernel,
    );
    const expectedCorrected = Float64Array.from(sourceLuminance, (value, index) => {
      const blurredValue = expectedBlur.data[index] ?? 0;
      return value + amount * (value - blurredValue);
    });
    const parity = measureImageQuality(
      clampImage(expectedCorrected),
      correctedLuminance,
      target.width,
      target.height,
    );

    expect(parity.rmse).toBeLessThan(0.025);
    expect(parity.ssim).toBeGreaterThan(0.98);
  });
});
