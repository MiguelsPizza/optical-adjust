import {
  CANVAS_2D_CONTEXT_ID,
  ERROR_MESSAGES,
  REC_709_LUMINANCE,
  SRGB_TRANSFER,
} from "optics-constants";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext(CANVAS_2D_CONTEXT_ID);
  if (!context) {
    throw new Error(ERROR_MESSAGES.canvasContextRequired);
  }
  return context;
}

/**
 * Converts a single encoded sRGB channel value into linear light.
 */
export function srgbChannelToLinear(value: number): number {
  const normalized = clamp(value / SRGB_TRANSFER.channelMax, 0, 1);
  if (normalized <= SRGB_TRANSFER.srgbBreakpoint) {
    return normalized / SRGB_TRANSFER.lowSlope;
  }
  return (
    ((normalized + SRGB_TRANSFER.linearOffset) / SRGB_TRANSFER.transferScale) ** SRGB_TRANSFER.gamma
  );
}

/**
 * Converts a linear-light channel value into an encoded sRGB byte.
 */
export function linearChannelToSrgb(value: number): number {
  const clamped = clamp(value, 0, 1);
  const normalized =
    clamped <= SRGB_TRANSFER.linearBreakpoint
      ? clamped * SRGB_TRANSFER.lowSlope
      : SRGB_TRANSFER.transferScale * clamped ** (1 / SRGB_TRANSFER.gamma) -
        SRGB_TRANSFER.linearOffset;
  return Math.round(normalized * SRGB_TRANSFER.channelMax);
}

/**
 * Converts RGBA image data into a grayscale linear-luminance buffer.
 */
export function imageDataToLinearLuminance(imageData: ImageData): Float64Array {
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

/**
 * Converts a linear-luminance buffer into grayscale RGBA image data.
 */
export function linearLuminanceToImageData(
  luminance: Float64Array,
  width: number,
  height: number,
): ImageData {
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

/**
 * Reads the current canvas contents into a linear-luminance buffer.
 */
export function readCanvasLuminance(canvas: HTMLCanvasElement): Float64Array {
  const context = getCanvasContext(canvas);
  return imageDataToLinearLuminance(context.getImageData(0, 0, canvas.width, canvas.height));
}

/**
 * Writes a linear-luminance buffer into the target canvas.
 */
export function writeFloatImageToCanvas(
  canvas: HTMLCanvasElement,
  data: Float64Array,
  width: number,
  height: number,
): void {
  const context = getCanvasContext(canvas);
  context.putImageData(linearLuminanceToImageData(data, width, height), 0, 0);
}
