import type { Degrees, Diopters } from "./units.ts";

/**
 * Spherocylindrical spectacle prescription in the minus-cylinder convention
 * used by the meridional-power derivation.
 *
 * Source ref: `docs/equation_source_verification_notes.md`
 */
export interface Prescription<
  TSphere extends Diopters = Diopters,
  TCylinder extends Diopters = Diopters,
  TAxisDegrees extends Degrees = Degrees,
> {
  /**
   * Sphere power in diopters.
   */
  readonly sph: TSphere;

  /**
   * Cylinder power in diopters.
   */
  readonly cyl: TCylinder;

  /**
   * Cylinder axis in degrees.
   */
  readonly axis: TAxisDegrees;
}
