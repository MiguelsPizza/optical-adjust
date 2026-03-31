import { APP_CANVAS_DIMENSIONS } from "optics-constants";
import {
  calculateBlurResult,
  createPillboxKernel,
  evaluateComparisonMatrix,
  summarizeImageQualityComparison,
} from "optics";
import {
  compareCanvasCorrectionPaths,
  drawTestPattern,
  renderAnalyticOtfToCanvas,
  writeFloatImageToCanvas,
} from "optics-render";
import type { BlurWarningKey, ImageGrid } from "optics-types";

import { queryRequired } from "./app-controls.ts";
import type { AppRenderContext, AppState, CanvasRefs } from "./app-types.ts";

function createSourcePreviewCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = APP_CANVAS_DIMENSIONS.panelWidth;
  canvas.height = APP_CANVAS_DIMENSIONS.panelHeight;
  drawTestPattern(canvas);
  return canvas;
}

function collectWarningEntries(context: AppRenderContext["blurResult"]) {
  return Object.entries(context.warnings).filter(([, enabled]) => enabled) as Array<
    [BlurWarningKey, boolean]
  >;
}

/**
 * Derives the complete deterministic render payload for the current app state.
 */
export function createRenderContext(state: AppState): AppRenderContext {
  const blurResult = calculateBlurResult(state.viewerParams);
  const sourceCanvas = createSourcePreviewCanvas();
  const kernel = createPillboxKernel(blurResult.blurRadiusPx);
  const comparisonResult = compareCanvasCorrectionPaths(sourceCanvas, kernel, {
    unsharpAmount: state.unsharpAmount,
    wiener: {
      maxGain: state.maxGain,
      regularizationK: state.regularizationK,
    },
  });
  const comparisonMatrix = evaluateComparisonMatrix({
    params: {
      unsharpAmount: state.unsharpAmount,
      wiener: {
        maxGain: state.maxGain,
        regularizationK: state.regularizationK,
      },
    },
  });

  return {
    blurResult,
    comparisonMatrix,
    comparisonResult,
    currentComparisons: {
      unsharpVsBlurred: summarizeImageQualityComparison(
        comparisonResult.unsharpRetinalQuality,
        comparisonResult.blurredOriginalQuality,
        "blurred original",
      ),
      wienerVsBlurred: summarizeImageQualityComparison(
        comparisonResult.wienerRetinalQuality,
        comparisonResult.blurredOriginalQuality,
        "blurred original",
      ),
      wienerVsUnsharp: summarizeImageQualityComparison(
        comparisonResult.wienerRetinalQuality,
        comparisonResult.unsharpRetinalQuality,
        "unsharp retinal",
      ),
    },
    warningEntries: collectWarningEntries(blurResult),
  };
}

function getCanvasRefs(root: ParentNode): CanvasRefs {
  return {
    blurredOriginal: queryRequired(root, '[data-testid="canvas-blurred-original"]'),
    blurredUnsharp: queryRequired(root, '[data-testid="canvas-blurred-unsharp"]'),
    blurredWiener: queryRequired(root, '[data-testid="canvas-blurred-wiener"]'),
    original: queryRequired(root, '[data-testid="canvas-original"]'),
    otf: queryRequired(root, '[data-testid="canvas-otf"]'),
    unsharpCorrected: queryRequired(root, '[data-testid="canvas-unsharp-corrected"]'),
    wienerCorrected: queryRequired(root, '[data-testid="canvas-wiener-corrected"]'),
  };
}

function resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  canvas.width = width;
  canvas.height = height;
}

function writeImageGrid(canvas: HTMLCanvasElement, image: ImageGrid) {
  writeFloatImageToCanvas(canvas, image.data, image.width, image.height);
}

/**
 * Paints the current synthetic comparison outputs into the mounted canvas set.
 */
export function paintCanvases(root: ParentNode, context: AppRenderContext) {
  const canvases = getCanvasRefs(root);
  const panelCanvases = [
    canvases.original,
    canvases.wienerCorrected,
    canvases.unsharpCorrected,
    canvases.blurredOriginal,
    canvases.blurredWiener,
    canvases.blurredUnsharp,
  ];

  for (const canvas of panelCanvases) {
    resizeCanvas(canvas, APP_CANVAS_DIMENSIONS.panelWidth, APP_CANVAS_DIMENSIONS.panelHeight);
  }

  resizeCanvas(canvases.otf, APP_CANVAS_DIMENSIONS.otfWidth, APP_CANVAS_DIMENSIONS.otfHeight);

  drawTestPattern(canvases.original);
  writeImageGrid(canvases.wienerCorrected, context.comparisonResult.wienerCorrected);
  writeImageGrid(canvases.unsharpCorrected, context.comparisonResult.unsharpCorrected);
  writeImageGrid(canvases.blurredOriginal, context.comparisonResult.blurredOriginal);
  writeImageGrid(canvases.blurredWiener, context.comparisonResult.wienerRetinal);
  writeImageGrid(canvases.blurredUnsharp, context.comparisonResult.unsharpRetinal);
  renderAnalyticOtfToCanvas(canvases.otf, context.blurResult.blurRadiusPx);
}
