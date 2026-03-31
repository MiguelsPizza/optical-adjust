export const CANVAS_2D_CONTEXT_ID = "2d";

export const APP_CANVAS_DIMENSIONS = {
  otfHeight: 160,
  otfWidth: 320,
  panelHeight: 140,
  panelWidth: 220,
} as const;

export const TEST_PATTERN = {
  backgroundFill: "#050505",
  barCount: 6,
  barHeight: 20,
  barStartX: 12,
  barStepX: 10,
  barWidth: 4,
  barY: 68,
  font: "bold 36px Georgia",
  foregroundFill: "#ffffff",
  lineHeight: 3,
  lineInset: 12,
  lineY: 54,
  text: "OPT",
  textX: 12,
  textY: 42,
} as const;

export const OTF_PLOT_STYLE = {
  background: "#ffffff",
  curve: "#111111",
  curveLineWidth: 2,
  zeroMarker: "#ff0040",
  zeroMarkerLineWidth: 1,
} as const;

export const SRGB_TRANSFER = {
  alphaOpaque: 255,
  channelMax: 255,
  gamma: 2.4,
  linearBreakpoint: 0.0031308,
  linearOffset: 0.055,
  lowSlope: 12.92,
  srgbBreakpoint: 0.04045,
  transferScale: 1.055,
} as const;

export const REC_709_LUMINANCE = {
  blue: 0.0722,
  green: 0.7152,
  red: 0.2126,
} as const;

export const ERROR_MESSAGES = {
  canvasContextRequired: "2D canvas context is required.",
  expected2dContext: "Expected 2d context.",
  expectedBlurredPixelData: "Expected blurred pixel data.",
  expectedPixelData: "Expected pixel data.",
  expectedRestoredPixelData: "Expected restored pixel data.",
  fftPowerOfTwo: "FFT input length must be a power of two.",
} as const;
