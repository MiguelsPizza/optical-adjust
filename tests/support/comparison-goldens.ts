import {
  createCheckerBarTarget,
  createSiemensStarTarget,
  createSlantedEdgeTarget,
  createTextStrokeTarget,
} from "../../packages/optics/src/index.ts";

export const COMPARISON_BLUR_RADII = [1, 1.5, 2.5] as const;

export const COMPARISON_TARGET_FACTORIES = [
  {
    create: createTextStrokeTarget,
    name: "text-like strokes",
    slug: "text-strokes",
  },
  {
    create: createSiemensStarTarget,
    name: "Siemens star",
    slug: "siemens-star",
  },
  {
    create: createSlantedEdgeTarget,
    name: "slanted edge",
    slug: "slanted-edge",
  },
  {
    create: createCheckerBarTarget,
    name: "checker/bar",
    slug: "checker-bar",
  },
] as const;

export const COMPARISON_FIXTURE_SIZE = {
  height: 64,
  width: 64,
} as const;

export const DEFAULT_COMPARISON_PARAMS = {
  unsharpAmount: 1.5,
  wiener: {
    maxGain: 4,
    regularizationK: 0.001,
  },
} as const;

export const COMPARISON_METRIC_GOLDENS = {
  "checker-bar:1": {
    blurred: { psnr: 14.073722, rmse: 0.19784, ssim: 0.894773 },
    diagnostics: {
      clippingFraction: 0.655273,
      maxWienerGain: 4,
      overshootFraction: 0.400146,
      ringingEnergy: 0.002101,
    },
    unsharp: { psnr: 14.073722, rmse: 0.19784, ssim: 0.894773 },
    wiener: { psnr: 11.976593, rmse: 0.251866, ssim: 0.802754 },
  },
  "checker-bar:1.5": {
    blurred: { psnr: 10.545706, rmse: 0.296971, ssim: 0.735281 },
    diagnostics: {
      clippingFraction: 0.613037,
      maxWienerGain: 4,
      overshootFraction: 0.373047,
      ringingEnergy: 0.004514,
    },
    unsharp: { psnr: 10.545706, rmse: 0.296971, ssim: 0.735281 },
    wiener: { psnr: 7.765571, rmse: 0.408998, ssim: 0.45145 },
  },
  "checker-bar:2.5": {
    blurred: { psnr: 7.857593, rmse: 0.404688, ssim: 0.410299 },
    diagnostics: {
      clippingFraction: 0.666504,
      maxWienerGain: 4,
      overshootFraction: 0.310547,
      ringingEnergy: 0.006483,
    },
    unsharp: { psnr: 7.857593, rmse: 0.404688, ssim: 0.410299 },
    wiener: { psnr: 6.607778, rmse: 0.467316, ssim: 0.187238 },
  },
  "siemens-star:1": {
    blurred: { psnr: 15.631419, rmse: 0.165359, ssim: 0.920792 },
    diagnostics: {
      clippingFraction: 0.542969,
      maxWienerGain: 4,
      overshootFraction: 0.668945,
      ringingEnergy: 0.00147,
    },
    unsharp: { psnr: 15.631419, rmse: 0.165359, ssim: 0.920792 },
    wiener: { psnr: 13.30132, rmse: 0.216239, ssim: 0.833704 },
  },
  "siemens-star:1.5": {
    blurred: { psnr: 14.235182, rmse: 0.194196, ssim: 0.885517 },
    diagnostics: {
      clippingFraction: 0.570313,
      maxWienerGain: 4,
      overshootFraction: 0.658203,
      ringingEnergy: 0.002049,
    },
    unsharp: { psnr: 14.235182, rmse: 0.194196, ssim: 0.885517 },
    wiener: { psnr: 11.711495, rmse: 0.259672, ssim: 0.74262 },
  },
  "siemens-star:2.5": {
    blurred: { psnr: 12.17559, rmse: 0.246162, ssim: 0.796646 },
    diagnostics: {
      clippingFraction: 0.574219,
      maxWienerGain: 4,
      overshootFraction: 0.626953,
      ringingEnergy: 0.002149,
    },
    unsharp: { psnr: 12.17559, rmse: 0.246162, ssim: 0.796646 },
    wiener: { psnr: 10.298387, rmse: 0.305549, ssim: 0.624921 },
  },
  "slanted-edge:1": {
    blurred: { psnr: 23.32693, rmse: 0.068179, ssim: 0.990448 },
    diagnostics: {
      clippingFraction: 0.503174,
      maxWienerGain: 4,
      overshootFraction: 0.660889,
      ringingEnergy: 0.000593,
    },
    unsharp: { psnr: 23.32693, rmse: 0.068179, ssim: 0.990448 },
    wiener: { psnr: 20.465066, rmse: 0.094787, ssim: 0.979965 },
  },
  "slanted-edge:1.5": {
    blurred: { psnr: 21.295569, rmse: 0.086143, ssim: 0.984615 },
    diagnostics: {
      clippingFraction: 0.512207,
      maxWienerGain: 4,
      overshootFraction: 0.70166,
      ringingEnergy: 0.00203,
    },
    unsharp: { psnr: 21.295569, rmse: 0.086143, ssim: 0.984615 },
    wiener: { psnr: 16.502207, rmse: 0.149586, ssim: 0.946072 },
  },
  "slanted-edge:2.5": {
    blurred: { psnr: 19.429313, rmse: 0.106791, ssim: 0.975889 },
    diagnostics: {
      clippingFraction: 0.511963,
      maxWienerGain: 4,
      overshootFraction: 0.830078,
      ringingEnergy: 0.003401,
    },
    unsharp: { psnr: 19.429313, rmse: 0.106791, ssim: 0.975889 },
    wiener: { psnr: 14.585615, rmse: 0.186517, ssim: 0.911378 },
  },
  "text-strokes:1": {
    blurred: { psnr: 21.249387, rmse: 0.086603, ssim: 0.968996 },
    diagnostics: {
      clippingFraction: 0.518066,
      maxWienerGain: 4,
      overshootFraction: 0.658936,
      ringingEnergy: 0.000171,
    },
    unsharp: { psnr: 21.249387, rmse: 0.086603, ssim: 0.968996 },
    wiener: { psnr: 18.779563, rmse: 0.115086, ssim: 0.935411 },
  },
  "text-strokes:1.5": {
    blurred: { psnr: 17.267754, rmse: 0.136966, ssim: 0.919216 },
    diagnostics: {
      clippingFraction: 0.483643,
      maxWienerGain: 4,
      overshootFraction: 0.702881,
      ringingEnergy: 0.00174,
    },
    unsharp: { psnr: 17.267754, rmse: 0.136966, ssim: 0.919216 },
    wiener: { psnr: 13.599628, rmse: 0.208939, ssim: 0.743234 },
  },
  "text-strokes:2.5": {
    blurred: { psnr: 15.474946, rmse: 0.168365, ssim: 0.865857 },
    diagnostics: {
      clippingFraction: 0.564453,
      maxWienerGain: 4,
      overshootFraction: 0.798584,
      ringingEnergy: 0.001077,
    },
    unsharp: { psnr: 15.474946, rmse: 0.168365, ssim: 0.865857 },
    wiener: { psnr: 12.374329, rmse: 0.240593, ssim: 0.640397 },
  },
} as const;
