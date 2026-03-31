import type {
  ImageGrid as SharedImageGrid,
  ImageQualityMetrics,
  Pixels,
  UnitlessScalar,
} from "optics-types";

export type ImageGrid = SharedImageGrid;

interface ImageStatistics {
  mean: number;
  variance: number;
}

interface JointImageStatistics {
  candidate: ImageStatistics;
  covariance: number;
  reference: ImageStatistics;
}

function assertComparableImageArrays(
  reference: Float64Array,
  candidate: Float64Array,
  width: Pixels,
  height: Pixels,
) {
  const expectedLength = width * height;
  if (reference.length !== expectedLength || candidate.length !== expectedLength) {
    throw new Error("Reference and candidate images must match the provided dimensions.");
  }
}

function calculateMean(samples: Float64Array): UnitlessScalar {
  let total = 0;
  for (const sample of samples) {
    total += sample;
  }
  return total / (samples.length || 1);
}

function calculateJointImageStatistics(
  reference: Float64Array,
  candidate: Float64Array,
  pixelCount: Pixels,
): JointImageStatistics {
  const referenceMean = calculateMean(reference);
  const candidateMean = calculateMean(candidate);
  let referenceVarianceSum = 0;
  let candidateVarianceSum = 0;
  let covarianceSum = 0;

  for (let index = 0; index < reference.length; index += 1) {
    const centeredReference = reference[index] - referenceMean;
    const centeredCandidate = candidate[index] - candidateMean;
    referenceVarianceSum += centeredReference ** 2;
    candidateVarianceSum += centeredCandidate ** 2;
    covarianceSum += centeredReference * centeredCandidate;
  }

  return {
    candidate: {
      mean: candidateMean,
      variance: candidateVarianceSum / pixelCount,
    },
    covariance: covarianceSum / pixelCount,
    reference: {
      mean: referenceMean,
      variance: referenceVarianceSum / pixelCount,
    },
  };
}

/**
 * Computes root-mean-square error over the full image grid.
 */
export function calculateRmse(
  reference: Float64Array,
  candidate: Float64Array,
  width: Pixels,
  height: Pixels,
): UnitlessScalar {
  assertComparableImageArrays(reference, candidate, width, height);

  let total = 0;
  for (let index = 0; index < reference.length; index += 1) {
    total += (reference[index] - candidate[index]) ** 2;
  }

  return Math.sqrt(total / (width * height || 1));
}

/**
 * Computes peak signal-to-noise ratio from the image RMSE.
 */
export function calculatePsnr(
  reference: Float64Array,
  candidate: Float64Array,
  width: Pixels,
  height: Pixels,
  peakSignal: UnitlessScalar = 1,
): UnitlessScalar {
  const rmse = calculateRmse(reference, candidate, width, height);
  if (rmse === 0) {
    return Number.POSITIVE_INFINITY;
  }
  return 20 * Math.log10(peakSignal / rmse);
}

/**
 * Computes a simple full-frame luminance-only SSIM approximation.
 *
 * This intentionally uses global image statistics rather than a sliding
 * window so it stays deterministic and lightweight for regression tests.
 */
export function calculateLuminanceSsim(
  reference: Float64Array,
  candidate: Float64Array,
  width: Pixels,
  height: Pixels,
  peakSignal: UnitlessScalar = 1,
): UnitlessScalar {
  assertComparableImageArrays(reference, candidate, width, height);

  const pixelCount = width * height || 1;
  const statistics = calculateJointImageStatistics(reference, candidate, pixelCount);

  const c1 = (0.01 * peakSignal) ** 2;
  const c2 = (0.03 * peakSignal) ** 2;

  const luminance =
    (2 * statistics.reference.mean * statistics.candidate.mean + c1) /
    (statistics.reference.mean ** 2 + statistics.candidate.mean ** 2 + c1);
  const structure =
    (2 * statistics.covariance + c2) /
    (statistics.reference.variance + statistics.candidate.variance + c2);

  return luminance * structure;
}

/**
 * Convenience wrapper that reports the three quality metrics used throughout
 * the regression suite.
 */
export function measureImageQuality(
  reference: Float64Array,
  candidate: Float64Array,
  width: Pixels,
  height: Pixels,
): ImageQualityMetrics {
  return {
    psnr: calculatePsnr(reference, candidate, width, height),
    rmse: calculateRmse(reference, candidate, width, height),
    ssim: calculateLuminanceSsim(reference, candidate, width, height),
  };
}
