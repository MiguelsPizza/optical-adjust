import type { Millimeters, Meters, Pixels, PixelsPerInch } from "optics-types";

import { calculateAiryDiskRadiusPixels } from "./equations.ts";

/**
 * Convenience wrapper for the Airy-disk crossover sanity check used by the
 * playground and tests.
 */
export function airyDiskRadiusPx(
  pupilDiameterMm: Millimeters,
  viewingDistanceM: Meters,
  screenPpi: PixelsPerInch,
): Pixels {
  return calculateAiryDiskRadiusPixels(pupilDiameterMm, viewingDistanceM, screenPpi);
}
