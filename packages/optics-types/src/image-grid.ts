import type { Grid2D } from "./shared.ts";
import type { UnitlessGain } from "./units.ts";

/**
 * Linear-luminance image grid used by the deconvolution and rendering
 * pipelines.
 */
export interface ImageGrid extends Grid2D<Float64Array> {}

/**
 * Result of a Wiener deconvolution pass, including the peak gain observed
 * during restoration.
 */
export interface DeconvolutionResult extends ImageGrid {
  maxGainSeen: UnitlessGain;
}
