import {
  MAX_PUPIL_MM,
  MIN_PUPIL_MM,
  MIN_SCREEN_PPI,
  UNSHARP_CONTROL_RANGES,
  WIENER_CONTROL_RANGES,
} from "optics-constants";
import { FocusMode } from "optics-types";

/**
 * Validation contract shared by the browser UI and WebMCP tools for a single
 * numeric playground control.
 */
export interface NumericControlRule {
  readonly errorMessage: string;
  readonly testId: string;
  readonly validator: (value: number) => boolean;
}

const trackedProgrammaticValues = new WeakMap<HTMLInputElement, string>();
const rejectedProgrammaticValues = new WeakSet<HTMLInputElement>();

export const PLAYGROUND_NUMERIC_CONTROL_RULES = {
  fixedFocusDiopters: {
    errorMessage: "fixedFocusDiopters is only available when the UI is in Fixed Focus mode.",
    testId: "fixed-focus-input",
    validator: (value: number) => Number.isFinite(value),
  },
  manualResidualDiopters: {
    errorMessage:
      "manualResidualDiopters is only available when the UI is in Manual Residual mode.",
    testId: "manual-residual-input",
    validator: (value: number) => Number.isFinite(value),
  },
  maxGain: {
    errorMessage: `Max Wiener gain must stay within ${WIENER_CONTROL_RANGES.maxGainMin}-${WIENER_CONTROL_RANGES.maxGainMax}.`,
    testId: "max-gain-input",
    validator: (value: number) =>
      isValueInRange(value, WIENER_CONTROL_RANGES.maxGainMin, WIENER_CONTROL_RANGES.maxGainMax),
  },
  pupilDiameterMm: {
    errorMessage: `Pupil diameter must stay within ${MIN_PUPIL_MM}-${MAX_PUPIL_MM} mm.`,
    testId: "pupil-input",
    validator: (value: number) => isValueInRange(value, MIN_PUPIL_MM, MAX_PUPIL_MM),
  },
  screenPpi: {
    errorMessage: `Screen PPI must be at least ${MIN_SCREEN_PPI}.`,
    testId: "ppi-input",
    validator: (value: number) => value >= MIN_SCREEN_PPI,
  },
  sphere: {
    errorMessage: "Sphere must be a finite diopter value.",
    testId: "sphere-input",
    validator: (value: number) => Number.isFinite(value),
  },
  unsharpAmount: {
    errorMessage: `Unsharp amount must stay within ${UNSHARP_CONTROL_RANGES.amountMin}-${UNSHARP_CONTROL_RANGES.amountMax}.`,
    testId: "unsharp-amount-input",
    validator: (value: number) =>
      isValueInRange(value, UNSHARP_CONTROL_RANGES.amountMin, UNSHARP_CONTROL_RANGES.amountMax),
  },
  viewingDistanceM: {
    errorMessage: "Viewing distance must be a finite number greater than 0 meters.",
    testId: "distance-input",
    validator: (value: number) => value > 0,
  },
  wienerK: {
    errorMessage: `Wiener K must stay within ${WIENER_CONTROL_RANGES.regularizationKMin}-${WIENER_CONTROL_RANGES.regularizationKMax}.`,
    testId: "wiener-input",
    validator: (value: number) =>
      isValueInRange(
        value,
        WIENER_CONTROL_RANGES.regularizationKMin,
        WIENER_CONTROL_RANGES.regularizationKMax,
      ),
  },
} as const satisfies Record<string, NumericControlRule>;

const nativeInputValueDescriptor = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  "value",
);

export type PlaygroundNumericControlKey = keyof typeof PLAYGROUND_NUMERIC_CONTROL_RULES;

/**
 * Returns the canonical validation rule for a numeric playground control.
 */
export function getNumericControlRule<Key extends PlaygroundNumericControlKey>(key: Key) {
  return PLAYGROUND_NUMERIC_CONTROL_RULES[key];
}

/**
 * Inclusive numeric range check used by slider-backed controls.
 */
export function isValueInRange(value: number, min: number, max: number) {
  return value >= min && value <= max;
}

/**
 * Narrows a string into one of the supported focus-mode enum values.
 */
export function isValidFocusModeValue(value: string): value is FocusMode {
  return Object.values(FocusMode).includes(value as FocusMode);
}

/**
 * Records the raw assigned value for scripted input writes so out-of-range
 * values can be rejected even when the browser clamps the DOM property.
 */
export function trackProgrammaticInputValue(input: HTMLInputElement) {
  if (!nativeInputValueDescriptor?.get || !nativeInputValueDescriptor?.set) {
    return;
  }

  if (Object.getOwnPropertyDescriptor(input, "value")) {
    return;
  }

  // Range inputs clamp out-of-bounds writes before event handlers run. Recording
  // the raw assigned value lets the app reject invalid scripted mutations and
  // restore the last committed state on blur.
  Object.defineProperty(input, "value", {
    configurable: true,
    enumerable: nativeInputValueDescriptor.enumerable ?? true,
    get() {
      return nativeInputValueDescriptor.get!.call(this);
    },
    set(value: string) {
      trackedProgrammaticValues.set(this, String(value));
      nativeInputValueDescriptor.set!.call(this, value);
    },
  });
}

export function clearTrackedProgrammaticInputValue(input: HTMLInputElement) {
  trackedProgrammaticValues.delete(input);
  rejectedProgrammaticValues.delete(input);
}

/**
 * Marks the last scripted assignment as rejected so blur handling can restore
 * the last committed state.
 */
export function markRejectedProgrammaticInputValue(input: HTMLInputElement) {
  if (!trackedProgrammaticValues.has(input)) {
    return;
  }

  trackedProgrammaticValues.delete(input);
  rejectedProgrammaticValues.add(input);
}

export function hasRejectedProgrammaticInputValue(input: HTMLInputElement) {
  return rejectedProgrammaticValues.has(input);
}

/**
 * Reads the raw scripted value when present, otherwise falls back to the live
 * DOM value.
 */
export function readTrackedInputValue(input: HTMLInputElement) {
  return trackedProgrammaticValues.get(input) ?? input.value;
}
