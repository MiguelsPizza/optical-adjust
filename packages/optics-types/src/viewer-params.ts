import type { FocusMode } from "./focus-mode.ts";
import type { Prescription } from "./prescription.ts";
import type { Diopters, Millimeters, PixelsPerInch, Meters } from "./units.ts";

/**
 * Shared viewing-state inputs consumed by the residual-defocus chain.
 *
 * Source refs:
 * - `docs/optics_poc_concept.md`
 * - `docs/phase_0_3_build_spec.md`
 */
export interface ViewerParams<
  TPrescription extends Prescription = Prescription,
  TFocusMode extends FocusMode = FocusMode,
> {
  /**
   * Fixed accommodation value in diopters, used only in `FixedFocus` mode.
   */
  readonly fixedFocusDiopters?: Diopters;

  /**
   * Accommodation mode used to derive the eye's focus vergence.
   */
  readonly focusMode: TFocusMode;

  /**
   * Exact residual defocus override in diopters, used only in `ManualResidual`
   * mode.
   */
  readonly manualResidualDiopters?: Diopters;

  /**
   * Spherocylindrical prescription describing the viewer.
   */
  readonly prescription: TPrescription;

  /**
   * Entrance-pupil diameter in millimeters.
   */
  readonly pupilDiameterMm: Millimeters;

  /**
   * Display density in pixels per inch.
   */
  readonly screenPpi: PixelsPerInch;

  /**
   * Viewing distance from eye to screen in meters.
   */
  readonly viewingDistanceM: Meters;
}
