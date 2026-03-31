import { clamp } from "./utils.ts";
import { convolveImageSpatial, deconvolveImage } from "./deconvolution.ts";
import { measureImageQuality } from "./image-quality.ts";
import type {
  ArtifactDiagnostics,
  ComparisonCaseResult,
  ComparisonPathParams,
  ImageGrid,
  ImageQualityMetrics,
  PsfKernel,
  UnsharpMaskParams,
} from "optics-types";

const ARTIFACT_EPSILON = 1e-3;
const CLIPPING_EPSILON = 1e-12;
const NEIGHBORHOOD_RADIUS = 1;

function createImageGrid(data: Float64Array, width: number, height: number): ImageGrid {
  return { data, height, width };
}

function measureGridQuality(reference: ImageGrid, candidate: ImageGrid): ImageQualityMetrics {
  return measureImageQuality(reference.data, candidate.data, reference.width, reference.height);
}

/**
 * Clamps every image sample into the displayable `[0, 1]` range.
 */
export function clampImageGrid(image: ImageGrid): ImageGrid {
  return createImageGrid(
    Float64Array.from(image.data, (value) => clamp(value, 0, 1)),
    image.width,
    image.height,
  );
}

/**
 * Applies a simple spatial unsharp mask and clamps the result for display.
 */
export function unsharpMaskImage(
  image: ImageGrid,
  kernel: PsfKernel,
  params: UnsharpMaskParams,
): ImageGrid {
  const blurred = convolveImageSpatial(image, kernel);
  const corrected = Float64Array.from(image.data, (value, index) => {
    const blurredValue = blurred.data[index] ?? 0;
    return value + params.amount * (value - blurredValue);
  });

  return clampImageGrid(createImageGrid(corrected, image.width, image.height));
}

/**
 * Computes the fraction of samples that would clip when mapped back into the
 * displayable luminance range.
 */
export function calculateClippingFraction(data: Float64Array): number {
  if (data.length === 0) {
    return 0;
  }

  let clipped = 0;
  for (const value of data) {
    if (value < -CLIPPING_EPSILON || value > 1 + CLIPPING_EPSILON) {
      clipped += 1;
    }
  }

  return clipped / data.length;
}

function calculateEnvelopeExtrema(reference: ImageGrid, centerX: number, centerY: number) {
  let localMin = Number.POSITIVE_INFINITY;
  let localMax = Number.NEGATIVE_INFINITY;

  for (
    let sampleY = Math.max(0, centerY - NEIGHBORHOOD_RADIUS);
    sampleY <= Math.min(reference.height - 1, centerY + NEIGHBORHOOD_RADIUS);
    sampleY += 1
  ) {
    for (
      let sampleX = Math.max(0, centerX - NEIGHBORHOOD_RADIUS);
      sampleX <= Math.min(reference.width - 1, centerX + NEIGHBORHOOD_RADIUS);
      sampleX += 1
    ) {
      const sample = reference.data[sampleY * reference.width + sampleX] ?? 0;
      localMin = Math.min(localMin, sample);
      localMax = Math.max(localMax, sample);
    }
  }

  return { localMax, localMin };
}

function createWienerDiagnostics(
  sourceImage: ImageGrid,
  rawCorrected: ReturnType<typeof deconvolveImage>,
  retinalImage: ImageGrid,
): ArtifactDiagnostics {
  return {
    clippingFraction: calculateClippingFraction(rawCorrected.data),
    maxWienerGain: rawCorrected.maxGainSeen,
    ...calculateRingingArtifactMetrics(sourceImage, retinalImage),
  };
}

function createWienerComparisonPath(
  sourceImage: ImageGrid,
  kernel: PsfKernel,
  params: ComparisonPathParams,
) {
  const rawCorrected = deconvolveImage(sourceImage, kernel, params.wiener);
  const rawRetinal = convolveImageSpatial(rawCorrected, kernel);
  const corrected = clampImageGrid(rawCorrected);
  const retinal = convolveImageSpatial(corrected, kernel);

  return {
    corrected,
    diagnostics: createWienerDiagnostics(sourceImage, rawCorrected, rawRetinal),
    retinal,
  };
}

function createUnsharpComparisonPath(
  sourceImage: ImageGrid,
  kernel: PsfKernel,
  params: ComparisonPathParams,
) {
  const corrected = unsharpMaskImage(sourceImage, kernel, { amount: params.unsharpAmount });
  return {
    corrected,
    retinal: convolveImageSpatial(corrected, kernel),
  };
}

/**
 * Measures overshoot frequency and energy by comparing a candidate image
 * against the local luminance envelope of the reference image.
 */
export function calculateRingingArtifactMetrics(reference: ImageGrid, candidate: ImageGrid) {
  if (reference.width !== candidate.width || reference.height !== candidate.height) {
    throw new Error("Reference and candidate images must have matching dimensions.");
  }

  const pixelCount = reference.width * reference.height || 1;
  let overshootCount = 0;
  let ringingEnergy = 0;

  for (let y = 0; y < candidate.height; y += 1) {
    for (let x = 0; x < candidate.width; x += 1) {
      const index = y * candidate.width + x;
      const value = candidate.data[index] ?? 0;
      const { localMax, localMin } = calculateEnvelopeExtrema(reference, x, y);
      const lowerBound = localMin - ARTIFACT_EPSILON;
      const upperBound = localMax + ARTIFACT_EPSILON;
      let exceedance = 0;

      if (value < lowerBound) {
        exceedance = lowerBound - value;
      } else if (value > upperBound) {
        exceedance = value - upperBound;
      }

      if (exceedance > 0) {
        overshootCount += 1;
        ringingEnergy += exceedance ** 2;
      }
    }
  }

  return {
    overshootFraction: overshootCount / pixelCount,
    ringingEnergy: ringingEnergy / pixelCount,
  };
}

/**
 * Runs the deterministic synthetic comparison pipeline used by the playground
 * and regression tests.
 */
export function compareCorrectionPaths(
  image: ImageGrid,
  kernel: PsfKernel,
  params: ComparisonPathParams,
): ComparisonCaseResult {
  const blurredOriginal = convolveImageSpatial(image, kernel);
  const wiener = createWienerComparisonPath(image, kernel, params);
  const unsharp = createUnsharpComparisonPath(image, kernel, params);

  return {
    blurredOriginal,
    blurredOriginalQuality: measureGridQuality(image, blurredOriginal),
    unsharpCorrected: unsharp.corrected,
    unsharpRetinal: unsharp.retinal,
    unsharpRetinalQuality: measureGridQuality(image, unsharp.retinal),
    wienerCorrected: wiener.corrected,
    wienerDiagnostics: wiener.diagnostics,
    wienerRetinal: wiener.retinal,
    wienerRetinalQuality: measureGridQuality(image, wiener.retinal),
  };
}
