import { ERROR_MESSAGES } from "optics-constants";

import { createFilledArray } from "./utils.ts";

interface ComplexTransform {
  imag: Float64Array;
  real: Float64Array;
}

interface ComplexGridTransform extends ComplexTransform {
  height: number;
  width: number;
}

function reverseBitPattern(index: number, bitCount: number) {
  let reversed = 0;
  for (let bit = 0; bit < bitCount; bit += 1) {
    reversed = (reversed << 1) | ((index >> bit) & 1);
  }
  return reversed;
}

function createComplexBuffer(realInput: Float64Array, imagInput?: Float64Array): ComplexTransform {
  return {
    imag: imagInput ? Float64Array.from(imagInput) : createFilledArray(realInput.length),
    real: Float64Array.from(realInput),
  };
}

function assertPowerOfTwoLength(length: number) {
  const bitCount = Math.log2(length);
  if (!Number.isInteger(bitCount)) {
    throw new Error(ERROR_MESSAGES.fftPowerOfTwo);
  }
  return bitCount;
}

function applyBitReversalPermutation(real: Float64Array, imag: Float64Array, bitCount: number) {
  for (let index = 0; index < real.length; index += 1) {
    const reversedIndex = reverseBitPattern(index, bitCount);
    if (reversedIndex > index) {
      [real[index], real[reversedIndex]] = [real[reversedIndex], real[index]];
      [imag[index], imag[reversedIndex]] = [imag[reversedIndex], imag[index]];
    }
  }
}

function normalizeInverseTransform(real: Float64Array, imag: Float64Array) {
  for (let index = 0; index < real.length; index += 1) {
    real[index] /= real.length;
    imag[index] /= real.length;
  }
}

/**
 * Computes a radix-2 Cooley-Tukey FFT of a one-dimensional real or complex
 * signal.
 */
export function fft1d(realInput: Float64Array, imagInput?: Float64Array, inverse = false) {
  const length = realInput.length;
  const { imag, real } = createComplexBuffer(realInput, imagInput);
  const bitCount = assertPowerOfTwoLength(length);

  applyBitReversalPermutation(real, imag, bitCount);

  for (let size = 2; size <= length; size <<= 1) {
    const half = size >> 1;
    const angle = ((inverse ? 2 : -2) * Math.PI) / size;
    const wMulReal = Math.cos(angle);
    const wMulImag = Math.sin(angle);

    for (let start = 0; start < length; start += size) {
      let wReal = 1;
      let wImag = 0;

      for (let offset = 0; offset < half; offset += 1) {
        const evenIndex = start + offset;
        const oddIndex = evenIndex + half;
        const tReal = wReal * real[oddIndex] - wImag * imag[oddIndex];
        const tImag = wReal * imag[oddIndex] + wImag * real[oddIndex];

        real[oddIndex] = real[evenIndex] - tReal;
        imag[oddIndex] = imag[evenIndex] - tImag;
        real[evenIndex] += tReal;
        imag[evenIndex] += tImag;

        const nextReal = wReal * wMulReal - wImag * wMulImag;
        const nextImag = wReal * wMulImag + wImag * wMulReal;
        wReal = nextReal;
        wImag = nextImag;
      }
    }
  }

  if (inverse) {
    normalizeInverseTransform(real, imag);
  }

  return { imag, real };
}

function transformRows(
  real: Float64Array,
  imag: Float64Array,
  width: number,
  height: number,
  inverse: boolean,
) {
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * width;
    const transformedRow = fft1d(
      real.slice(rowStart, rowStart + width),
      imag.slice(rowStart, rowStart + width),
      inverse,
    );
    real.set(transformedRow.real, rowStart);
    imag.set(transformedRow.imag, rowStart);
  }
}

function transformColumns(
  real: Float64Array,
  imag: Float64Array,
  width: number,
  height: number,
  inverse: boolean,
) {
  for (let x = 0; x < width; x += 1) {
    const columnReal = createFilledArray(height);
    const columnImag = createFilledArray(height);

    for (let y = 0; y < height; y += 1) {
      columnReal[y] = real[y * width + x];
      columnImag[y] = imag[y * width + x];
    }

    const transformedColumn = fft1d(columnReal, columnImag, inverse);

    for (let y = 0; y < height; y += 1) {
      real[y * width + x] = transformedColumn.real[y];
      imag[y * width + x] = transformedColumn.imag[y];
    }
  }
}

/**
 * Applies the one-dimensional FFT across rows and columns to transform a
 * two-dimensional grid.
 */
export function fft2d(
  realInput: Float64Array,
  width: number,
  height: number,
  inverse = false,
  imagInput?: Float64Array,
): ComplexGridTransform {
  const { imag, real } = createComplexBuffer(realInput, imagInput);

  transformRows(real, imag, width, height, inverse);
  transformColumns(real, imag, width, height, inverse);

  return { height, imag, real, width };
}
