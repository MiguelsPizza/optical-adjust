import {
  convolveImageSpatial,
  deconvolveImage,
  firstOtfZero,
  sampleAnalyticOtf,
} from "../../optics/src/index.ts";
import {
  CANVAS_2D_CONTEXT_ID,
  ERROR_MESSAGES,
  MAX_DISPLAY_SPATIAL_FREQUENCY,
  OTF_PLOT_STYLE,
  SRGB_TRANSFER,
  TEST_PATTERN,
} from "../../optics-constants/src/index.ts";
import type {
  ImageGrid,
  Nullable,
  OtfSample,
  PsfKernel,
  WienerParams,
} from "../../optics-types/src/index.ts";

import {
  imageDataToLinearLuminance,
  linearLuminanceToImageData,
  readCanvasLuminance,
  writeFloatImageToCanvas,
} from "./image-utils.ts";

function getContext(canvas: HTMLCanvasElement) {
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

function clampLinearImage(data: Float64Array) {
  return Float64Array.from(data, (value) => Math.min(1, Math.max(0, value)));
}

export function drawTestPattern(canvas: HTMLCanvasElement) {
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

export function renderPsfToCanvas(canvas: HTMLCanvasElement, kernel: PsfKernel) {
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
) {
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

export function renderAnalyticOtfToCanvas(canvas: HTMLCanvasElement, radiusPx: number) {
  renderOtfProfileToCanvas(canvas, sampleAnalyticOtf(radiusPx), firstOtfZero(radiusPx));
}

export function blurCanvasToCanvas(
  sourceCanvas: HTMLCanvasElement,
  destinationCanvas: HTMLCanvasElement,
  kernel: PsfKernel,
) {
  const sourceContext = getContext(sourceCanvas);
  const imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const blurred = convolveImageSpatial(imageDataToGrid(imageData), kernel);
  destinationCanvas.width = sourceCanvas.width;
  destinationCanvas.height = sourceCanvas.height;
  writeFloatImageToCanvas(destinationCanvas, blurred.data, blurred.width, blurred.height);
}

export function deconvolveCanvasToCanvas(
  sourceCanvas: HTMLCanvasElement,
  destinationCanvas: HTMLCanvasElement,
  kernel: PsfKernel,
  params: WienerParams,
) {
  const sourceContext = getContext(sourceCanvas);
  const imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const restored = deconvolveImage(imageDataToGrid(imageData), kernel, params);
  destinationCanvas.width = sourceCanvas.width;
  destinationCanvas.height = sourceCanvas.height;
  writeFloatImageToCanvas(destinationCanvas, restored.data, restored.width, restored.height);
  return restored;
}

export function unsharpMaskCanvasToCanvas(
  sourceCanvas: HTMLCanvasElement,
  destinationCanvas: HTMLCanvasElement,
  kernel: PsfKernel,
  params: { amount: number },
) {
  const sourceContext = getContext(sourceCanvas);
  const imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const sourceGrid = imageDataToGrid(imageData);
  const blurred = convolveImageSpatial(sourceGrid, kernel);
  const corrected = Float64Array.from(sourceGrid.data, (value, index) => {
    const blurredValue = blurred.data[index] ?? 0;
    return value + params.amount * (value - blurredValue);
  });

  destinationCanvas.width = sourceCanvas.width;
  destinationCanvas.height = sourceCanvas.height;
  writeFloatImageToCanvas(
    destinationCanvas,
    clampLinearImage(corrected),
    sourceGrid.width,
    sourceGrid.height,
  );
}

export function cloneCanvasImage(sourceCanvas: HTMLCanvasElement) {
  return linearLuminanceToImageData(
    readCanvasLuminance(sourceCanvas),
    sourceCanvas.width,
    sourceCanvas.height,
  );
}
