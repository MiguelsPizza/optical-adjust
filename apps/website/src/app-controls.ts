import {
  clearTrackedProgrammaticInputValue,
  hasRejectedProgrammaticInputValue,
  markRejectedProgrammaticInputValue,
  readTrackedInputValue,
  trackProgrammaticInputValue,
} from "./playground-controls.ts";
import type {
  AppRenderCallback,
  AppState,
  NumericValueValidator,
  NumericViewerFieldUpdater,
} from "./app-types.ts";

/**
 * Queries a required element from the current render tree.
 */
export function queryRequired<TElement extends Element>(
  root: ParentNode,
  selector: string,
): TElement {
  const element = root.querySelector<TElement>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}

function parseFiniteInputValue(input: HTMLInputElement) {
  const rawValue = readTrackedInputValue(input).trim();
  if (rawValue.length === 0) {
    return null;
  }

  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

function shouldRestoreInputOnBlur(input: HTMLInputElement, isAllowed: NumericValueValidator) {
  const rawValue = readTrackedInputValue(input).trim();
  if (rawValue.length === 0) {
    return true;
  }

  const value = Number(rawValue);
  return !Number.isFinite(value) || !isAllowed(value);
}

function bindTrackedNumericInput(
  input: HTMLInputElement,
  render: AppRenderCallback,
  updater: (value: number) => void,
  isAllowed: NumericValueValidator,
) {
  trackProgrammaticInputValue(input);

  input.addEventListener("input", (event) => {
    const currentInput = event.currentTarget as HTMLInputElement;
    const value = parseFiniteInputValue(currentInput);
    if (value === null || !isAllowed(value)) {
      markRejectedProgrammaticInputValue(currentInput);
      return;
    }

    clearTrackedProgrammaticInputValue(currentInput);
    updater(value);
    render();
  });

  input.addEventListener("blur", (event) => {
    const currentInput = event.currentTarget as HTMLInputElement;
    if (
      hasRejectedProgrammaticInputValue(currentInput) ||
      shouldRestoreInputOnBlur(currentInput, isAllowed)
    ) {
      clearTrackedProgrammaticInputValue(currentInput);
      render();
      return;
    }

    clearTrackedProgrammaticInputValue(currentInput);
  });
}

/**
 * Binds a required numeric viewer parameter that re-renders immediately when a
 * valid value is committed.
 */
export function bindNumericViewerInput(
  root: HTMLElement,
  testId: string,
  state: AppState,
  render: AppRenderCallback,
  updater: NumericViewerFieldUpdater,
  isAllowed: NumericValueValidator = () => true,
) {
  const input = queryRequired<HTMLInputElement>(root, `[data-testid="${testId}"]`);
  bindTrackedNumericInput(
    input,
    render,
    (value) => {
      state.viewerParams = updater(value);
    },
    isAllowed,
  );
}

/**
 * Binds an optional numeric control that may or may not exist in the current
 * conditional UI.
 */
export function bindOptionalNumericControl(
  root: HTMLElement,
  testId: string,
  render: AppRenderCallback,
  updater: (value: number) => void,
  isAllowed: NumericValueValidator = () => true,
) {
  const input = root.querySelector<HTMLInputElement>(`[data-testid="${testId}"]`);
  if (!input) {
    return;
  }

  bindTrackedNumericInput(input, render, updater, isAllowed);
}
