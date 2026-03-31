/**
 * Constrains a numeric value to a closed interval.
 */
export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Creates a zero-initialized numeric buffer, optionally prefilled with a
 * constant value.
 */
export function createFilledArray(length: number, value = 0) {
  const array = new Float64Array(length);
  if (value !== 0) {
    array.fill(value);
  }
  return array;
}

/**
 * Returns the smallest power of two that is greater than or equal to the
 * requested value.
 */
export function nextPowerOfTwo(value: number) {
  let power = 1;
  while (power < value) {
    power <<= 1;
  }
  return power;
}
