import {
  AIRY_FIRST_MINIMUM_FACTOR,
  DIFFRACTION_WAVELENGTH_M,
  METERS_PER_INCH,
  MILLIMETERS_PER_METER,
  OTF_ZERO_COEFFICIENT,
} from "optics-constants";
import type {
  BlurGeometryMetrics,
  CyclesPerPixel,
  Diopters,
  Meters,
  Millimeters,
  Nullable,
  Pixels,
  PixelsPerInch,
  Radians,
  VergenceMetrics,
} from "optics-types";

/**
 * Converts viewing distance to display vergence in diopters.
 *
 * Equation:
 * `D_display = 1 / z`
 *
 * Symbols:
 * - `D_display`: display vergence in diopters
 * - `z`: viewing distance from eye to display in meters
 *
 * Primary sources:
 * - University of Iowa ophthalmic optics tutorial
 *   https://webeye.ophth.uiowa.edu/eyeforum/video/Refraction/Intro-Optics-Refract-Errors/index.htm
 * - Cholewiak, Love, and Banks, 2018
 *   https://pmc.ncbi.nlm.nih.gov/articles/PMC5946648/
 */
export function calculateDisplayVergence(viewingDistanceM: Meters): Diopters {
  return viewingDistanceM <= 0 ? 0 : 1 / viewingDistanceM;
}

/**
 * Computes the residual defocus magnitude as the absolute vergence mismatch
 * between the display plane and the eye's current focus state.
 *
 * Equation:
 * `D_res = |D_display - D_focus|`
 *
 * Symbols:
 * - `D_res`: residual defocus magnitude in diopters
 * - `D_display`: vergence demand of the display in diopters
 * - `D_focus`: vergence where the eye is currently focused in diopters
 *
 * Primary sources:
 * - University of Iowa ophthalmic optics tutorial
 *   https://webeye.ophth.uiowa.edu/eyeforum/video/Refraction/Intro-Optics-Refract-Errors/index.htm
 * - Cholewiak, Love, and Banks, 2018
 *   https://pmc.ncbi.nlm.nih.gov/articles/PMC5946648/
 */
export function calculateResidualDefocusMagnitude(
  displayVergence: Diopters,
  focusVergence: Diopters,
): Diopters {
  return Math.abs(displayVergence - focusVergence);
}

/**
 * Packages display vergence, focus vergence, and residual defocus into a
 * stable optics-types result shape.
 */
export function createVergenceMetrics(
  displayVergence: Diopters,
  focusVergence: Diopters,
): VergenceMetrics {
  return {
    dDisplay: displayVergence,
    dFocus: focusVergence,
    dRes: calculateResidualDefocusMagnitude(displayVergence, focusVergence),
  };
}

/**
 * Computes the angular blur-disk diameter in radians for pure defocus.
 *
 * Equation:
 * `beta_rad ≈ p * |D_res|`.
 *
 * Symbols:
 * - `beta_rad`: angular blur-disk diameter in radians
 * - `p`: entrance-pupil diameter in meters
 * - `D_res`: residual defocus magnitude in diopters
 *
 * Primary sources:
 * - Cholewiak, Love, and Banks, 2018
 *   https://pmc.ncbi.nlm.nih.gov/articles/PMC5946648/
 * - Strasburger, Rentschler, and Juttner, 2018
 *   https://pubmed.ncbi.nlm.nih.gov/29770182/
 */
export function calculateDefocusBlurAngleRad(
  pupilDiameterM: Meters,
  residualDefocusDiopters: Diopters,
): Radians {
  return pupilDiameterM * Math.abs(residualDefocusDiopters);
}

/**
 * Converts a small visual angle in radians into a linear blur diameter on the
 * screen in meters using the small-angle approximation.
 *
 * Equation:
 * `b_m ≈ z * beta_rad`
 *
 * Symbols:
 * - `b_m`: blur diameter on the display in meters
 * - `z`: viewing distance in meters
 * - `beta_rad`: angular blur diameter in radians
 *
 * Primary source:
 * - Cholewiak, Love, and Banks, 2018
 *   https://pmc.ncbi.nlm.nih.gov/articles/PMC5946648/
 */
export function calculateBlurDiameterMeters(
  viewingDistanceM: Meters,
  blurAngleRad: Radians,
): Meters {
  return viewingDistanceM * blurAngleRad;
}

/**
 * Converts display density from pixels per inch to meters per pixel.
 *
 * Equation:
 * `pixel_pitch_m = 0.0254 / PPI`
 *
 * Primary source:
 * - NIST SI Units – Length
 *   https://www.nist.gov/pml/owm/si-units-length
 */
export function calculateScreenPixelPitchMeters(screenPpi: PixelsPerInch): Meters {
  return METERS_PER_INCH / screenPpi;
}

/**
 * Converts a linear blur diameter on the screen from meters to pixels.
 */
export function calculateBlurDiameterPixelsFromMeters(
  blurDiameterM: Meters,
  screenPpi: PixelsPerInch,
): Pixels {
  return blurDiameterM / calculateScreenPixelPitchMeters(screenPpi);
}

/**
 * Computes blur-disk diameter in display pixels from viewing distance, pupil
 * diameter, residual defocus, and display density.
 *
 * This is the project's core display-space chain:
 * `b_px ≈ z * p * |D_res| / (0.0254 / PPI)`.
 *
 * Symbols:
 * - `b_px`: blur-disk diameter in display pixels
 * - `z`: viewing distance in meters
 * - `p`: entrance-pupil diameter in meters
 * - `D_res`: residual defocus magnitude in diopters
 * - `PPI`: display density in pixels per inch
 *
 * Primary sources:
 * - Cholewiak, Love, and Banks, 2018
 *   https://pmc.ncbi.nlm.nih.gov/articles/PMC5946648/
 * - NIST SI Units – Length
 *   https://www.nist.gov/pml/owm/si-units-length
 */
export function calculateBlurDiameterPixels(
  viewingDistanceM: Meters,
  pupilDiameterM: Meters,
  residualDefocusDiopters: Diopters,
  screenPpi: PixelsPerInch,
): Pixels {
  const blurAngleRad = calculateDefocusBlurAngleRad(pupilDiameterM, residualDefocusDiopters);
  const blurDiameterM = calculateBlurDiameterMeters(viewingDistanceM, blurAngleRad);
  return calculateBlurDiameterPixelsFromMeters(blurDiameterM, screenPpi);
}

/**
 * Converts a blur diameter in pixels to a blur radius in pixels.
 */
export function calculateBlurRadiusPixels(blurDiameterPx: Pixels): Pixels {
  return blurDiameterPx / 2;
}

/**
 * Computes the first zero of the analytic disk OTF in cycles per pixel.
 *
 * For a disk blur of radius `R_px`, the first zero is approximately:
 * `rho_0 ≈ 0.610 / R`.
 *
 * This coefficient comes from the first positive zero of `J1(x)` in the
 * disk-OTF relation `2 J1(x) / x`, with `x = 2π R_px ρ`.
 *
 * Primary sources:
 * - NIST Digital Library of Mathematical Functions, first positive zero of `J1`
 *   https://dlmf.nist.gov/10.21.E1
 *
 * Derived project note:
 * - `OTF_ZERO_COEFFICIENT = j_{1,1} / (2π) ≈ 0.61`
 */
export function calculateFirstDiskOtfZeroFrequency(radiusPx: Pixels): Nullable<CyclesPerPixel> {
  return radiusPx > 0 ? OTF_ZERO_COEFFICIENT / radiusPx : null;
}

/**
 * Computes the full blur-geometry bundle used by the playground from residual
 * defocus and display/viewing parameters.
 */
export function calculateBlurGeometryMetrics(
  viewingDistanceM: Meters,
  pupilDiameterM: Meters,
  residualDefocusDiopters: Diopters,
  screenPpi: PixelsPerInch,
): BlurGeometryMetrics {
  const betaRad = calculateDefocusBlurAngleRad(pupilDiameterM, residualDefocusDiopters);
  const blurDiameterPx = calculateBlurDiameterPixels(
    viewingDistanceM,
    pupilDiameterM,
    residualDefocusDiopters,
    screenPpi,
  );
  const blurRadiusPx = calculateBlurRadiusPixels(blurDiameterPx);

  return {
    betaRad,
    blurDiameterPx,
    blurRadiusPx,
    firstOtfZero: calculateFirstDiskOtfZeroFrequency(blurRadiusPx),
  };
}

/**
 * Computes the angular radius to the first Airy minimum for a circular pupil.
 *
 * Equation:
 * `theta_Airy ≈ 1.22 * lambda / D_pupil`.
 *
 * Symbols:
 * - `theta_Airy`: angular radius to the first Airy minimum in radians
 * - `lambda`: wavelength in meters
 * - `D_pupil`: pupil diameter in meters
 *
 * Primary/official teaching sources:
 * - Stanford EE367 diffraction lecture notes
 *   https://web.stanford.edu/class/ee367/slides/lecture14.pdf
 * - University of Arizona diffraction notes
 *   https://wp.optics.arizona.edu/jcwyant/wp-content/uploads/sites/13/2016/08/6Diffraction.pdf
 */
export function calculateAiryFirstMinimumAngleRad(
  pupilDiameterM: Meters,
  wavelengthM: Meters = DIFFRACTION_WAVELENGTH_M,
): Radians {
  return AIRY_FIRST_MINIMUM_FACTOR * (wavelengthM / pupilDiameterM);
}

/**
 * Computes the Airy-disk radius on the display in pixels from pupil size,
 * viewing distance, and display density.
 */
export function calculateAiryDiskRadiusPixels(
  pupilDiameterMm: Millimeters,
  viewingDistanceM: Meters,
  screenPpi: PixelsPerInch,
): Pixels {
  const pupilDiameterM = pupilDiameterMm / MILLIMETERS_PER_METER;
  const angle = calculateAiryFirstMinimumAngleRad(pupilDiameterM);
  const radiusM = calculateBlurDiameterMeters(viewingDistanceM, angle);
  return calculateBlurDiameterPixelsFromMeters(radiusM, screenPpi);
}
