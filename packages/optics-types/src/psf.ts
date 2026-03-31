import type { Grid2D } from "./shared.ts";
import type { Pixels } from "./units.ts";

/**
 * Discrete circular pillbox point-spread kernel.
 *
 * Source ref: `docs/equation_source_verification_notes.md`
 */
export interface PsfKernel<TData extends Float64Array = Float64Array> extends Grid2D<TData> {
  /**
   * Pillbox radius in display pixels.
   */
  readonly radiusPx: Pixels;
}
