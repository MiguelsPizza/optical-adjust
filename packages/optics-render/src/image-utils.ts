import {
  CANVAS_2D_CONTEXT_ID,
  ERROR_MESSAGES,
  REC_709_LUMINANCE,
  SRGB_TRANSFER,
} from "../../optics-constants/src/index.ts";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function srgbChannelToLinear(value: number) {
  const normalized = clamp(value / SRGB_TRANSFER.channelMax, 0, 1);
  if (normalized <= SRGB_TRANSFER.srgbBreakpoint) {
    return normalized / SRGB_TRANSFER.lowSlope;
  }
  return (
    ((normalized + SRGB_TRANSFER.linearOffset) / SRGB_TRANSFER.transferScale) ** SRGB_TRANSFER.gamma
  );
}

export function linearChannelToSrgb(value: number) {
  const clamped = clamp(value, 0, 1);
  const normalized =
    clamped <= SRGB_TRANSFER.linearBreakpoint
      ? clamped * SRGB_TRANSFER.lowSlope
      : SRGB_TRANSFER.transferScale * clamped ** (1 / SRGB_TRANSFER.gamma) -
        SRGB_TRANSFER.linearOffset;
  return Math.round(normalized * SRGB_TRANSFER.channelMax);
}

export function imageDataToLinearLuminance(imageData: ImageData) {
  const luminance = new Float64Array(imageData.width * imageData.height);
  for (let index = 0; index < luminance.length; index += 1) {
    const base = index * 4;
    const red = srgbChannelToLinear(imageData.data[base]);
    const green = srgbChannelToLinear(imageData.data[base + 1]);
    const blue = srgbChannelToLinear(imageData.data[base + 2]);
    luminance[index] =
      REC_709_LUMINANCE.red * red + REC_709_LUMINANCE.green * green + REC_709_LUMINANCE.blue * blue;
  }
  return luminance;
}

export function linearLuminanceToImageData(luminance: Float64Array, width: number, height: number) {
  const imageData = new ImageData(width, height);
  for (let index = 0; index < luminance.length; index += 1) {
    const base = index * 4;
    const channel = linearChannelToSrgb(luminance[index]);
    imageData.data[base] = channel;
    imageData.data[base + 1] = channel;
    imageData.data[base + 2] = channel;
    imageData.data[base + 3] = SRGB_TRANSFER.alphaOpaque;
  }
  return imageData;
}

export function readCanvasLuminance(canvas: HTMLCanvasElement) {
  const context = canvas.getContext(CANVAS_2D_CONTEXT_ID);
  if (!context) {
    throw new Error(ERROR_MESSAGES.canvasContextRequired);
  }
  return imageDataToLinearLuminance(context.getImageData(0, 0, canvas.width, canvas.height));
}

export function writeFloatImageToCanvas(
  canvas: HTMLCanvasElement,
  data: Float64Array,
  width: number,
  height: number,
) {
  const context = canvas.getContext(CANVAS_2D_CONTEXT_ID);
  if (!context) {
    throw new Error(ERROR_MESSAGES.canvasContextRequired);
  }
  context.putImageData(linearLuminanceToImageData(data, width, height), 0, 0);
}
