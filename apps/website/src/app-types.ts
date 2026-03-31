import type { BlurResult, BlurWarningKey, ComparisonCaseResult, ViewerParams } from "optics-types";

/**
 * Mutable browser state for the playground shell.
 */
export interface AppState<TParams extends ViewerParams = ViewerParams> {
  activePreset: string;
  maxGain: number;
  regularizationK: number;
  unsharpAmount: number;
  viewerParams: TParams;
}

/**
 * Deterministic render payload derived from the current app state.
 */
export interface AppRenderContext {
  blurResult: BlurResult;
  comparisonResult: ComparisonCaseResult;
  warningEntries: Array<[BlurWarningKey, boolean]>;
}

/**
 * Canvas references required for a full repaint pass.
 */
export interface CanvasRefs {
  blurredOriginal: HTMLCanvasElement;
  blurredUnsharp: HTMLCanvasElement;
  blurredWiener: HTMLCanvasElement;
  original: HTMLCanvasElement;
  otf: HTMLCanvasElement;
  unsharpCorrected: HTMLCanvasElement;
  wienerCorrected: HTMLCanvasElement;
}

export type AppRenderCallback = () => void;
export type NumericValueValidator = (value: number) => boolean;
export type NumericViewerFieldUpdater = (value: number) => ViewerParams;
