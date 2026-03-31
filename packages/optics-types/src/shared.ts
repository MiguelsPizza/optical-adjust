/**
 * Generic rectangular grid used by the reference optics pipeline for images,
 * kernels, and sampled transfer functions.
 */
export interface Grid2D<TData = unknown> {
  readonly data: TData;
  readonly height: number;
  readonly width: number;
}

/**
 * Generic boolean-flag map keyed by a stable string union.
 */
export type FlagMap<TKey extends PropertyKey = string> = Readonly<Record<TKey, boolean>>;

/**
 * Helper for values that are intentionally absent in some regimes, such as the
 * first OTF zero when the blur radius collapses to zero.
 */
export type Nullable<TValue> = TValue | null;
