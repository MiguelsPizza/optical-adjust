import type {
  InferJsonSchema,
  JsonSchemaForInference,
  ToolResponse,
  ToolResultFromOutputSchema,
} from "@mcp-b/webmcp-types";

/**
 * Lightweight DOM query helper for WebMCP tools operating against the mounted
 * playground.
 */
export function q<TElement extends HTMLElement>(selector: string): TElement | null {
  return document.querySelector<TElement>(selector);
}

/**
 * Writes through the native DOM `value` setter so framework-agnostic controls
 * observe the change exactly as if a user had typed it.
 */
export function setNativeValue(element: HTMLInputElement | HTMLSelectElement, value: string) {
  const prototype =
    element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;

  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Wraps a structured payload into the transport shape expected by WebMCP.
 */
export function structured<TOutputSchema extends JsonSchemaForInference>(
  payload: InferJsonSchema<TOutputSchema>,
): ToolResultFromOutputSchema<TOutputSchema> {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  } as ToolResultFromOutputSchema<TOutputSchema>;
}

/**
 * Returns a consistent error response for invalid tool inputs or missing UI
 * controls.
 */
export function error(message: string): ToolResponse {
  return { content: [{ type: "text" as const, text: message }], isError: true as const };
}

export function readInputNumber(testId: string) {
  const value = q<HTMLInputElement>(`[data-testid="${testId}"]`)?.value;
  if (value == null || value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function readMetric(testId: string): string {
  return q<HTMLElement>(`[data-testid="${testId}"]`)?.textContent?.trim() ?? "n/a";
}

export function readWarningMessages() {
  return Array.from(document.querySelectorAll(".warning-pill"))
    .map((element) => element.textContent?.trim())
    .filter((warning): warning is string => Boolean(warning));
}

export function waitForUiUpdate(delayMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}
