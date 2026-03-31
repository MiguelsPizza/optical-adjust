import type { DeconvolutionResult, ImageGrid, PsfKernel, WienerParams } from "optics-types";

import { fft2d } from "./fft.ts";
import { createFilledArray, nextPowerOfTwo } from "./utils.ts";
import { wienerGain } from "./wiener.ts";

interface ConvolutionPadding {
  height: number;
  width: number;
}

function calculateLinearConvolutionPadding(
  image: ImageGrid,
  kernel: PsfKernel,
): ConvolutionPadding {
  return {
    height: nextPowerOfTwo(image.height + kernel.height - 1),
    width: nextPowerOfTwo(image.width + kernel.width - 1),
  };
}

function copyImageIntoPaddedGrid(image: ImageGrid, paddedWidth: number, paddedHeight: number) {
  const padded = createFilledArray(paddedWidth * paddedHeight);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      padded[y * paddedWidth + x] = image.data[y * image.width + x];
    }
  }
  return padded;
}

function centerKernelInPaddedFrequencyGrid(
  kernel: PsfKernel,
  paddedWidth: number,
  paddedHeight: number,
) {
  const padded = createFilledArray(paddedWidth * paddedHeight);
  const kernelCenterX = Math.floor(kernel.width / 2);
  const kernelCenterY = Math.floor(kernel.height / 2);

  for (let y = 0; y < kernel.height; y += 1) {
    for (let x = 0; x < kernel.width; x += 1) {
      const wrappedX = (x - kernelCenterX + paddedWidth) % paddedWidth;
      const wrappedY = (y - kernelCenterY + paddedHeight) % paddedHeight;
      padded[wrappedY * paddedWidth + wrappedX] = kernel.data[y * kernel.width + x];
    }
  }

  return padded;
}

function cropTopLeftImageWindow(
  data: Float64Array,
  paddedWidth: number,
  cropWidth: number,
  cropHeight: number,
) {
  const cropped = createFilledArray(cropWidth * cropHeight);

  for (let y = 0; y < cropHeight; y += 1) {
    for (let x = 0; x < cropWidth; x += 1) {
      cropped[y * cropWidth + x] = data[y * paddedWidth + x];
    }
  }

  return cropped;
}

function applyWienerFilterInPlace(
  imageFrequency: ReturnType<typeof fft2d>,
  kernelFrequency: ReturnType<typeof fft2d>,
  params: WienerParams,
) {
  let maxGainSeen = 0;

  for (let index = 0; index < imageFrequency.real.length; index += 1) {
    const gain = wienerGain(kernelFrequency.real[index], kernelFrequency.imag[index], params);
    const sourceReal = imageFrequency.real[index];
    const sourceImag = imageFrequency.imag[index];
    imageFrequency.real[index] = sourceReal * gain.real - sourceImag * gain.imag;
    imageFrequency.imag[index] = sourceReal * gain.imag + sourceImag * gain.real;
    maxGainSeen = Math.max(maxGainSeen, gain.gainMagnitude);
  }

  return maxGainSeen;
}

/**
 * Computes direct spatial convolution with zero-padding outside the image
 * bounds.
 */
export function convolveImageSpatial(image: ImageGrid, kernel: PsfKernel): ImageGrid {
  const output = createFilledArray(image.width * image.height);
  const centerX = Math.floor(kernel.width / 2);
  const centerY = Math.floor(kernel.height / 2);

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      let sum = 0;

      for (let ky = 0; ky < kernel.height; ky += 1) {
        for (let kx = 0; kx < kernel.width; kx += 1) {
          const sourceX = x + kx - centerX;
          const sourceY = y + ky - centerY;
          if (sourceX < 0 || sourceX >= image.width || sourceY < 0 || sourceY >= image.height) {
            continue;
          }
          sum += image.data[sourceY * image.width + sourceX] * kernel.data[ky * kernel.width + kx];
        }
      }

      output[y * image.width + x] = sum;
    }
  }

  return {
    data: output,
    height: image.height,
    width: image.width,
  };
}

/**
 * Applies reference Wiener deconvolution with FFT padding large enough to
 * emulate linear convolution before cropping back to the original image size.
 */
export function deconvolveImage(
  image: ImageGrid,
  kernel: PsfKernel,
  params: WienerParams,
): DeconvolutionResult {
  const padding = calculateLinearConvolutionPadding(image, kernel);
  const paddedImage = copyImageIntoPaddedGrid(image, padding.width, padding.height);
  const paddedKernel = centerKernelInPaddedFrequencyGrid(kernel, padding.width, padding.height);
  const imageFrequency = fft2d(paddedImage, padding.width, padding.height);
  const kernelFrequency = fft2d(paddedKernel, padding.width, padding.height);
  const maxGainSeen = applyWienerFilterInPlace(imageFrequency, kernelFrequency, params);
  const restored = fft2d(
    imageFrequency.real,
    padding.width,
    padding.height,
    true,
    imageFrequency.imag,
  );
  const cropped = cropTopLeftImageWindow(restored.real, padding.width, image.width, image.height);

  return {
    data: cropped,
    height: image.height,
    maxGainSeen,
    width: image.width,
  };
}
