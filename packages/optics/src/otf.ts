import {
  ANALYTIC_OTF_SAMPLE_COUNT,
  MAX_DISPLAY_SPATIAL_FREQUENCY,
  OTF_NEAR_ZERO_EPSILON,
} from "optics-constants";
import type { CyclesPerPixel, OtfSample, Pixels, PsfKernel, UnitlessScalar } from "optics-types";

import { calculateFirstDiskOtfZeroFrequency } from "./equations.ts";
import { besselJ1 } from "./bessel.ts";

/**
 * Evaluates the analytic optical transfer function of a circular pillbox PSF
 * at a one-dimensional spatial frequency.
 *
 * Equation:
 * `H(ρ) = 2 J1(2π R ρ) / (2π R ρ)`
 *
 * Symbols:
 * - `H(ρ)`: incoherent disk OTF at spatial frequency `ρ`
 * - `J1`: Bessel function of the first kind, order one
 * - `R`: blur-disk radius in pixels
 * - `ρ`: spatial frequency in cycles per pixel
 *
 * Primary sources:
 * - NIST DLMF for `J1`
 *   https://dlmf.nist.gov/10.2
 * - Project verification derives the display-space form from the standard
 *   disk transform
 *   /Users/alexmnahas/personalRepos/optical-adjust/docs/equation_source_verification_notes.md
 */
export function analyticDiskOtf(radiusPx: Pixels, frequency: CyclesPerPixel): UnitlessScalar {
  if (radiusPx <= 0) {
    return 1;
  }

  const x = 2 * Math.PI * radiusPx * frequency;
  if (Math.abs(x) < OTF_NEAR_ZERO_EPSILON) {
    return 1;
  }
  return (2 * besselJ1(x)) / x;
}

/**
 * Returns the first zero crossing of the analytic disk OTF in cycles per
 * pixel, or `null` when the blur radius collapses to zero.
 *
 * Primary source:
 * - NIST DLMF first positive zero of `J1`
 *   https://dlmf.nist.gov/10.21.E1
 */
export function firstOtfZero(radiusPx: Pixels) {
  return calculateFirstDiskOtfZeroFrequency(radiusPx);
}

/**
 * Samples the analytic disk OTF from DC to the requested maximum frequency.
 */
export function sampleAnalyticOtf(
  radiusPx: Pixels,
  sampleCount = ANALYTIC_OTF_SAMPLE_COUNT,
  maxFrequency: CyclesPerPixel = MAX_DISPLAY_SPATIAL_FREQUENCY,
): OtfSample[] {
  const samples: OtfSample[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const frequency = (index / (sampleCount - 1 || 1)) * maxFrequency;
    samples.push({
      frequency,
      value: analyticDiskOtf(radiusPx, frequency),
    });
  }
  return samples;
}

/**
 * Evaluates the real-valued numeric OTF implied by a discrete PSF kernel at a
 * single spatial-frequency coordinate.
 */
export function numericOtfAtFrequency(
  kernel: PsfKernel,
  frequencyX: CyclesPerPixel,
  frequencyY: CyclesPerPixel = 0,
): UnitlessScalar {
  const centerX = Math.floor(kernel.width / 2);
  const centerY = Math.floor(kernel.height / 2);
  let real = 0;

  for (let y = 0; y < kernel.height; y += 1) {
    for (let x = 0; x < kernel.width; x += 1) {
      const value = kernel.data[y * kernel.width + x];
      if (value === 0) {
        continue;
      }
      const phase = -2 * Math.PI * ((x - centerX) * frequencyX + (y - centerY) * frequencyY);
      real += value * Math.cos(phase);
    }
  }

  return real;
}
