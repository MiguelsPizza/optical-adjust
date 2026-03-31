import {
  compareCorrectionPaths,
  convolveImageSpatial,
  deconvolveImage,
  firstOtfZero,
  sampleAnalyticOtf,
  unsharpMaskImage,
} from "optics";
import {
  CANVAS_2D_CONTEXT_ID,
  ERROR_MESSAGES,
  MAX_DISPLAY_SPATIAL_FREQUENCY,
  OTF_PLOT_STYLE,
  SRGB_TRANSFER,
  TEST_PATTERN,
} from "optics-constants";
import type {
  ComparisonPathParams,
  ComparisonCaseResult,
  DeconvolutionResult,
  ImageGrid,
  Nullable,
  OtfSample,
  PsfKernel,
  UnsharpMaskParams,
} from "optics-types";

import {
  imageDataToLinearLuminance,
  linearLuminanceToImageData,
  readCanvasLuminance,
  writeFloatImageToCanvas,
} from "./image-utils.ts";

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext(CANVAS_2D_CONTEXT_ID);
  if (!context) {
    throw new Error(ERROR_MESSAGES.canvasContextRequired);
  }
  return context;
}

function imageDataToGrid(imageData: ImageData): ImageGrid {
  return {
    data: imageDataToLinearLuminance(imageData),
    height: imageData.height,
    width: imageData.width,
  };
}

function resizeCanvasToMatch(target: HTMLCanvasElement, source: HTMLCanvasElement): void {
  target.width = source.width;
  target.height = source.height;
}

function readCanvasGrid(canvas: HTMLCanvasElement): ImageGrid {
  const context = getContext(canvas);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  return imageDataToGrid(imageData);
}

/**
 * Paints the project’s canonical synthetic test pattern into a canvas.
 */
export function drawTestPattern(canvas: HTMLCanvasElement): void {
  const context = getContext(canvas);
  context.fillStyle = TEST_PATTERN.backgroundFill;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = TEST_PATTERN.foregroundFill;
  context.font = TEST_PATTERN.font;
  context.fillText(TEST_PATTERN.text, TEST_PATTERN.textX, TEST_PATTERN.textY);
  context.fillRect(
    TEST_PATTERN.lineInset,
    TEST_PATTERN.lineY,
    canvas.width - TEST_PATTERN.lineInset * 2,
    TEST_PATTERN.lineHeight,
  );
  for (let index = 0; index < TEST_PATTERN.barCount; index += 1) {
    context.fillRect(
      TEST_PATTERN.barStartX + index * TEST_PATTERN.barStepX,
      TEST_PATTERN.barY,
      TEST_PATTERN.barWidth,
      TEST_PATTERN.barHeight,
    );
  }
}

/**
 * Renders a PSF kernel as a normalized grayscale image.
 */
export function renderPsfToCanvas(canvas: HTMLCanvasElement, kernel: PsfKernel): void {
  const scale = Math.max(...kernel.data) || 1;
  const imageData = new ImageData(kernel.width, kernel.height);
  for (let index = 0; index < kernel.data.length; index += 1) {
    const base = index * 4;
    const channel = Math.round((kernel.data[index] / scale) * SRGB_TRANSFER.channelMax);
    imageData.data[base] = channel;
    imageData.data[base + 1] = channel;
    imageData.data[base + 2] = channel;
    imageData.data[base + 3] = SRGB_TRANSFER.alphaOpaque;
  }
  canvas.width = kernel.width;
  canvas.height = kernel.height;
  getContext(canvas).putImageData(imageData, 0, 0);
}

export function renderOtfProfileToCanvas(
  canvas: HTMLCanvasElement,
  samples: OtfSample[],
  firstZero: Nullable<number>,
  maxFrequency = MAX_DISPLAY_SPATIAL_FREQUENCY,
): void {
  const context = getContext(canvas);
  context.fillStyle = OTF_PLOT_STYLE.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = OTF_PLOT_STYLE.curve;
  context.lineWidth = OTF_PLOT_STYLE.curveLineWidth;
  context.beginPath();
  samples.forEach((sample, index) => {
    const x = (sample.frequency / maxFrequency) * (canvas.width - 1);
    const y = (1 - (sample.value + 1) / 2) * (canvas.height - 1);
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.stroke();

  if (firstZero !== null) {
    const x = (firstZero / maxFrequency) * (canvas.width - 1);
    context.strokeStyle = OTF_PLOT_STYLE.zeroMarker;
    context.lineWidth = OTF_PLOT_STYLE.zeroMarkerLineWidth;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
}

/**
 * Renders the analytic disk OTF profile for a blur radius in display pixels.
 */
export function renderAnalyticOtfToCanvas(canvas: HTMLCanvasElement, radiusPx: number): void {
  renderOtfProfileToCanvas(canvas, sampleAnalyticOtf(radiusPx), firstOtfZero(radiusPx));
}

export function blurCanvasToCanvas(
  sourceCanvas: HTMLCanvasElement,
  destinationCanvas: HTMLCanvasElement,
  kernel: PsfKernel,
): void {
  const blurred = convolveImageSpatial(readCanvasGrid(sourceCanvas), kernel);
  resizeCanvasToMatch(destinationCanvas, sourceCanvas);
  writeFloatImageToCanvas(destinationCanvas, blurred.data, blurred.width, blurred.height);
}

export function canvasToImageGrid(canvas: HTMLCanvasElement): ImageGrid {
  return readCanvasGrid(canvas);
}

export function deconvolveCanvasToCanvas(
  sourceCanvas: HTMLCanvasElement,
  destinationCanvas: HTMLCanvasElement,
  kernel: PsfKernel,
  params: ComparisonPathParams["wiener"],
): DeconvolutionResult {
  const restored = deconvolveImage(readCanvasGrid(sourceCanvas), kernel, params);
  resizeCanvasToMatch(destinationCanvas, sourceCanvas);
  writeFloatImageToCanvas(destinationCanvas, restored.data, restored.width, restored.height);
  return restored;
}

export function unsharpMaskCanvasToCanvas(
  sourceCanvas: HTMLCanvasElement,
  destinationCanvas: HTMLCanvasElement,
  kernel: PsfKernel,
  params: UnsharpMaskParams,
): void {
  const corrected = unsharpMaskImage(canvasToImageGrid(sourceCanvas), kernel, params);

  resizeCanvasToMatch(destinationCanvas, sourceCanvas);
  writeFloatImageToCanvas(destinationCanvas, corrected.data, corrected.width, corrected.height);
}

export function compareCanvasCorrectionPaths(
  sourceCanvas: HTMLCanvasElement,
  kernel: PsfKernel,
  params: ComparisonPathParams,
): ComparisonCaseResult {
  return compareCorrectionPaths(canvasToImageGrid(sourceCanvas), kernel, params);
}

/**
 * Copies the current canvas contents into a standalone `ImageData` object.
 */
export function cloneCanvasImage(sourceCanvas: HTMLCanvasElement): ImageData {
  return linearLuminanceToImageData(
    readCanvasLuminance(sourceCanvas),
    sourceCanvas.width,
    sourceCanvas.height,
  );
}
