import { clamp } from "./utils.ts";
import { convolveImageSpatial, deconvolveImage } from "./deconvolution.ts";
import { measureImageQuality } from "./image-quality.ts";
import type {
  AggregateQualityComparisonSummary,
  ArtifactDiagnostics,
  ComparisonCaseResult,
  ComparisonMatrixSummary,
  ComparisonPathParams,
  ImageQualityComparisonSummary,
  ImageQualityMetricName,
  ImageGrid,
  ImageQualityMetrics,
  PsfKernel,
  QualityComparisonRelation,
  UnsharpMaskParams,
} from "optics-types";
import { createPillboxKernel } from "./psf.ts";
import {
  DEFAULT_COMPARISON_BLUR_RADII,
  DEFAULT_COMPARISON_FIXTURE_SIZE,
  DEFAULT_COMPARISON_TARGETS,
  type SyntheticTargetDefinition,
} from "./synthetic-targets.ts";

const ARTIFACT_EPSILON = 1e-3;
const CLIPPING_EPSILON = 1e-12;
const COMPARISON_EPSILON = 1e-9;
const NEIGHBORHOOD_RADIUS = 1;

function createImageGrid(data: Float64Array, width: number, height: number): ImageGrid {
  return { data, height, width };
}

function measureGridQuality(reference: ImageGrid, candidate: ImageGrid): ImageQualityMetrics {
  return measureImageQuality(reference.data, candidate.data, reference.width, reference.height);
}

function calculateMetricImprovement(
  metricName: ImageQualityMetricName,
  candidateValue: number,
  referenceValue: number,
) {
  const improvement =
    metricName === "rmse" ? referenceValue - candidateValue : candidateValue - referenceValue;
  const relation: Exclude<QualityComparisonRelation, "mixed"> =
    improvement > COMPARISON_EPSILON
      ? "better"
      : improvement < -COMPARISON_EPSILON
        ? "worse"
        : "tied";

  return {
    candidateValue,
    improvement,
    referenceValue,
    relation,
  };
}

function resolveAggregateRelation(
  betterCount: number,
  worseCount: number,
  tiedCount: number,
): QualityComparisonRelation {
  if (betterCount > 0 && worseCount === 0) {
    return "better";
  }
  if (worseCount > 0 && betterCount === 0) {
    return "worse";
  }
  if (betterCount === 0 && worseCount === 0 && tiedCount > 0) {
    return "tied";
  }
  return "mixed";
}

/**
 * Summarizes whether a candidate path improves on a reference path across the
 * three objective quality metrics used throughout the POC.
 */
export function summarizeImageQualityComparison(
  candidate: ImageQualityMetrics,
  reference: ImageQualityMetrics,
  referenceLabel: string,
): ImageQualityComparisonSummary {
  const byMetric = {
    psnr: calculateMetricImprovement("psnr", candidate.psnr, reference.psnr),
    rmse: calculateMetricImprovement("rmse", candidate.rmse, reference.rmse),
    ssim: calculateMetricImprovement("ssim", candidate.ssim, reference.ssim),
  };
  const relations = Object.values(byMetric).map((metric) => metric.relation);
  const betterMetricCount = relations.filter((relation) => relation === "better").length;
  const worseMetricCount = relations.filter((relation) => relation === "worse").length;
  const tiedMetricCount = relations.filter((relation) => relation === "tied").length;

  return {
    betterMetricCount,
    byMetric,
    referenceLabel,
    relation: resolveAggregateRelation(betterMetricCount, worseMetricCount, tiedMetricCount),
    tiedMetricCount,
    worseMetricCount,
  };
}

function aggregateComparisonSummaries(
  summaries: ReadonlyArray<ImageQualityComparisonSummary>,
  referenceLabel: string,
): AggregateQualityComparisonSummary {
  return summaries.reduce<AggregateQualityComparisonSummary>(
    (aggregate, summary) => ({
      betterCaseCount: aggregate.betterCaseCount + (summary.relation === "better" ? 1 : 0),
      mixedCaseCount: aggregate.mixedCaseCount + (summary.relation === "mixed" ? 1 : 0),
      referenceLabel,
      tiedCaseCount: aggregate.tiedCaseCount + (summary.relation === "tied" ? 1 : 0),
      totalCaseCount: aggregate.totalCaseCount + 1,
      worseCaseCount: aggregate.worseCaseCount + (summary.relation === "worse" ? 1 : 0),
    }),
    {
      betterCaseCount: 0,
      mixedCaseCount: 0,
      referenceLabel,
      tiedCaseCount: 0,
      totalCaseCount: 0,
      worseCaseCount: 0,
    },
  );
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

interface ComparisonMatrixOptions {
  readonly blurRadii?: ReadonlyArray<number>;
  readonly fixtureHeight?: number;
  readonly fixtureWidth?: number;
  readonly params: ComparisonPathParams;
  readonly targets?: ReadonlyArray<SyntheticTargetDefinition>;
}

/**
 * Runs the shared synthetic-target matrix used by the POC validation harness
 * and reports explicit "better/mixed/worse" outcomes against each baseline.
 */
export function evaluateComparisonMatrix({
  blurRadii = DEFAULT_COMPARISON_BLUR_RADII,
  fixtureHeight = DEFAULT_COMPARISON_FIXTURE_SIZE.height,
  fixtureWidth = DEFAULT_COMPARISON_FIXTURE_SIZE.width,
  params,
  targets = DEFAULT_COMPARISON_TARGETS,
}: ComparisonMatrixOptions): ComparisonMatrixSummary {
  const cases = targets.flatMap((targetDefinition) =>
    blurRadii.map((blurRadiusPx) => {
      const target = targetDefinition.create(fixtureWidth, fixtureHeight);
      const result = compareCorrectionPaths(target, createPillboxKernel(blurRadiusPx), params);

      return {
        blurRadiusPx,
        targetLabel: targetDefinition.name,
        targetSlug: targetDefinition.slug,
        unsharpVsBlurred: summarizeImageQualityComparison(
          result.unsharpRetinalQuality,
          result.blurredOriginalQuality,
          "blurred original",
        ),
        wienerDiagnostics: result.wienerDiagnostics,
        wienerVsBlurred: summarizeImageQualityComparison(
          result.wienerRetinalQuality,
          result.blurredOriginalQuality,
          "blurred original",
        ),
        wienerVsUnsharp: summarizeImageQualityComparison(
          result.wienerRetinalQuality,
          result.unsharpRetinalQuality,
          "unsharp retinal",
        ),
      };
    }),
  );

  return {
    cases,
    unsharpVsBlurred: aggregateComparisonSummaries(
      cases.map((summary) => summary.unsharpVsBlurred),
      "blurred original",
    ),
    wienerVsBlurred: aggregateComparisonSummaries(
      cases.map((summary) => summary.wienerVsBlurred),
      "blurred original",
    ),
    wienerVsUnsharp: aggregateComparisonSummaries(
      cases.map((summary) => summary.wienerVsUnsharp),
      "unsharp retinal",
    ),
  };
}
