import type { FocusMode } from "./focus-mode.ts";
import type { Prescription } from "./prescription.ts";
import type { Diopters, Millimeters, PixelsPerInch, Meters } from "./units.ts";

/**
 * Caller-provided viewing-state inputs consumed by the residual-defocus
 * pipeline before defaults are applied.
 *
 * Source refs:
 * - `docs/optics_poc_concept.md`
 * - `docs/phase_0_3_build_spec.md`
 */
export interface ViewerParamsInput<
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
   *
   * When omitted, the optics package resolves this to the project default
   * pupil diameter before running the blur chain.
   */
  readonly pupilDiameterMm?: Millimeters;

  /**
   * Display density in pixels per inch.
   *
   * When omitted, the optics package resolves this to the project default
   * display density before running the blur chain.
   */
  readonly screenPpi?: PixelsPerInch;

  /**
   * Viewing distance from eye to screen in meters.
   */
  readonly viewingDistanceM: Meters;
}

/**
 * Fully-resolved viewing-state parameters after defaults have been applied.
 */
export interface ViewerParams<
  TPrescription extends Prescription = Prescription,
  TFocusMode extends FocusMode = FocusMode,
> extends ViewerParamsInput<TPrescription, TFocusMode> {
  readonly pupilDiameterMm: Millimeters;
  readonly screenPpi: PixelsPerInch;
}
