import { MERIDIAN_AXIS_PERIOD_DEGREES } from "optics-constants";
import type { Degrees, Diopters, Prescription } from "optics-types";

/**
 * Wraps a meridian axis into the half-turn interval `[0, 180)`.
 *
 * Primary source:
 * - University of Iowa ophthalmic optics tutorial
 *   https://webeye.ophth.uiowa.edu/eyeforum/video/Refraction/Intro-Optics-Refract-Errors/index.htm
 */
export function normalizeAxis(axis: Degrees): Degrees {
  const normalized = axis % MERIDIAN_AXIS_PERIOD_DEGREES;
  return normalized < 0 ? normalized + MERIDIAN_AXIS_PERIOD_DEGREES : normalized;
}

/**
 * Computes power in an arbitrary meridian from a spherocylindrical
 * prescription using the cylinder sine-squared law.
 *
 * Equation:
 * `F(θ) = sph + cyl * sin²(θ - axis)`
 *
 * Symbols:
 * - `F(θ)`: power in the meridian `θ`
 * - `sph`: spherical power in diopters
 * - `cyl`: cylinder power in diopters
 * - `axis`: cylinder axis in degrees
 *
 * Sources:
 * - Project source-verification note collecting the ophthalmic derivation
 *   docs/equation_source_verification_notes.md
 * - Thibos et al.
 *   https://pubmed.ncbi.nlm.nih.gov/16460319/
 * - Keating.
 *   https://pubmed.ncbi.nlm.nih.gov/937476/
 */
export function powerAtMeridian(prescription: Prescription, meridianDegrees: Degrees): Diopters {
  const axis = normalizeAxis(prescription.axis);
  const theta = ((meridianDegrees - axis) * Math.PI) / MERIDIAN_AXIS_PERIOD_DEGREES;
  return prescription.sph + prescription.cyl * Math.sin(theta) ** 2;
}

/**
 * Computes the powers in the two principal meridians for the minus-cylinder
 * convention used in the project.
 *
 * Primary source:
 * - University of Iowa ophthalmic optics tutorial
 *   https://webeye.ophth.uiowa.edu/eyeforum/video/Refraction/Intro-Optics-Refract-Errors/index.htm
 */
export function principalMeridionalPowers(prescription: Prescription) {
  return {
    axis: prescription.sph,
    perpendicular: prescription.sph + prescription.cyl,
  };
}
