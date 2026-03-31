/**
 * Angle in degrees.
 *
 * Primary source: University of Iowa ophthalmic optics tutorial
 * https://webeye.ophth.uiowa.edu/eyeforum/video/Refraction/Intro-Optics-Refract-Errors/index.htm
 */
export type Degrees = number;

/**
 * Optical power or vergence in diopters (`1 / meter`).
 *
 * Primary source: University of Iowa ophthalmic optics tutorial
 * https://webeye.ophth.uiowa.edu/eyeforum/video/Refraction/Intro-Optics-Refract-Errors/index.htm
 */
export type Diopters = number;

/**
 * Length in meters.
 *
 * Primary source: NIST SI length definitions
 * https://www.nist.gov/pml/owm/si-units-length
 */
export type Meters = number;

/**
 * Length in millimeters.
 *
 * Primary source: NIST SI length definitions
 * https://www.nist.gov/pml/owm/si-units-length
 */
export type Millimeters = number;

/**
 * Angular measure in radians.
 *
 * Used for blur angles and diffraction angles.
 */
export type Radians = number;

/**
 * Distance on a sampled display or image grid, measured in pixels.
 */
export type Pixels = number;

/**
 * Display density in pixels per inch.
 *
 * The inch-to-meter conversion used in this project is defined exactly by
 * NIST as `0.0254 m / in`.
 * https://www.nist.gov/pml/owm/si-units-length
 */
export type PixelsPerInch = number;

/**
 * Spatial frequency on the sampled display grid in cycles per pixel.
 */
export type CyclesPerPixel = number;

/**
 * Scalar transfer-function value or normalized image intensity.
 */
export type UnitlessScalar = number;

/**
 * Unitless Wiener gain magnitude.
 */
export type UnitlessGain = number;
