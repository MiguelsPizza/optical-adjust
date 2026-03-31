/**
 * Bessel function of the first kind, order one, `J1(x)`.
 *
 * This implementation is a direct coefficient-table approximation adapted from
 * the Cephes mathematical library's `j1` routine. The numeric tables are not
 * product-level domain constants; they are the coefficients of the underlying
 * polynomial/rational approximations used by the algorithm.
 *
 * Why these values stay in this file instead of `optics-constants`:
 * - they are private to this approximation
 * - they are not shared across the product
 * - they describe one numerical method, not the optics model itself
 *
 * Source:
 * - Cephes Mathematical Library documentation, `j1.c`
 *   https://www.netlib.org/cephes/doubldoc.html
 *
 * Notes from the source:
 * - Cephes splits the domain into a low-`x` region and an asymptotic large-`x`
 *   region
 * - the large-`x` branch uses an asymptotic trigonometric form with rational
 *   functions
 * - the exact coefficients below are implementation coefficients for that
 *   approximation, not independently meaningful physics constants
 */

const SMALL_ARGUMENT_MAX = 5;
const VERY_SMALL_ARGUMENT_MAX = 1e-8;
const HANKEL_PHASE_OFFSET_RAD = 2.356194490192345; // 3π/4
const TWO_OVER_PI = 0.6366197723675814;

/*
 * These Cephes coefficients are copied as-is from the reference
 * implementation. JavaScript stores them as IEEE-754 doubles, so the
 * `no-loss-of-precision` warning is expected and not actionable here.
 */
/* eslint-disable no-loss-of-precision */
const BESSEL_J1_LOW_REGION_ROOT_1_SQUARED = 14.6819706421238932572;
const BESSEL_J1_LOW_REGION_ROOT_2_SQUARED = 49.2184563216946036703;

/**
 * Low-`x` numerator coefficients for the rational approximation used by the
 * Cephes `j1` implementation.
 */
const LOW_REGION_NUMERATOR_COEFFICIENTS = [
  -8.99971225705559398224e8, 4.52228297998194034323e11, -7.27494245221818276015e13,
  3.68295732863852883286e15,
];

/**
 * Low-`x` denominator coefficients for the rational approximation used by the
 * Cephes `j1` implementation.
 */
const LOW_REGION_DENOMINATOR_COEFFICIENTS = [
  6.20836478118054335476e2, 2.56987256757748830383e5, 8.35146791431949253037e7,
  2.21511595479792499675e10, 4.74914122079991414898e12, 7.84369607876235854894e14,
  8.95222336184627338078e16, 5.32278620332680085395e18,
];

/**
 * Large-`x` numerator coefficients for the asymptotic cosine-term rational
 * approximation.
 */
const ASYMPTOTIC_P_NUMERATOR_COEFFICIENTS = [
  7.62125616208173112003e-4, 7.31397056940917570436e-2, 1.12719608129684925192,
  5.11207951146807644818, 8.42404590141772420927, 5.21451598682361504063, 1.00000000000000000254,
];

/**
 * Large-`x` denominator coefficients for the asymptotic cosine-term rational
 * approximation.
 */
const ASYMPTOTIC_P_DENOMINATOR_COEFFICIENTS = [
  5.71323128072548699714e-4, 6.88455908754495404082e-2, 1.10514232634061696926,
  5.07386386128601488557, 8.39985554327604159757, 5.20982848682361821619, 9.99999999999999997461e-1,
];

/**
 * Large-`x` numerator coefficients for the asymptotic sine-term rational
 * approximation.
 */
const ASYMPTOTIC_Q_NUMERATOR_COEFFICIENTS = [
  5.10862594750176621635e-2, 4.9821387295123344942, 7.58238284132545283818e1,
  3.667796093601507778e2, 7.10856304998926107277e2, 5.97489612400613639965e2,
  2.11688757100572135698e2, 2.52070205858023719784e1,
];

/**
 * Large-`x` denominator coefficients for the asymptotic sine-term rational
 * approximation.
 */
const ASYMPTOTIC_Q_DENOMINATOR_COEFFICIENTS = [
  7.42373277035675149943e1, 1.05644886038262816351e3, 4.98641058337653607651e3,
  9.56231892404756170795e3, 7.9970416044735068365e3, 2.826192785176390966e3,
  3.36093607810698293419e2,
];
/* eslint-enable no-loss-of-precision */

function evaluatePolynomial(coefficients: number[], value: number) {
  let result = 0;
  for (const coefficient of coefficients) {
    result = result * value + coefficient;
  }
  return result;
}

export function besselJ1(value: number) {
  const x = Math.abs(value);
  if (x < VERY_SMALL_ARGUMENT_MAX) {
    return value / 2;
  }

  if (x <= SMALL_ARGUMENT_MAX) {
    const z = x * x;
    const numerator = evaluatePolynomial(LOW_REGION_NUMERATOR_COEFFICIENTS, z);
    const denominator = evaluatePolynomial([1, ...LOW_REGION_DENOMINATOR_COEFFICIENTS], z);
    return (
      (numerator / denominator) *
      value *
      (z - BESSEL_J1_LOW_REGION_ROOT_1_SQUARED) *
      (z - BESSEL_J1_LOW_REGION_ROOT_2_SQUARED)
    );
  }

  const w = 5 / x;
  const z = w * w;
  const p =
    evaluatePolynomial(ASYMPTOTIC_P_NUMERATOR_COEFFICIENTS, z) /
    evaluatePolynomial(ASYMPTOTIC_P_DENOMINATOR_COEFFICIENTS, z);
  const q =
    evaluatePolynomial(ASYMPTOTIC_Q_NUMERATOR_COEFFICIENTS, z) /
    evaluatePolynomial([1, ...ASYMPTOTIC_Q_DENOMINATOR_COEFFICIENTS], z);
  const angle = x - HANKEL_PHASE_OFFSET_RAD;
  const result = Math.sqrt(TWO_OVER_PI / x) * (p * Math.cos(angle) - w * q * Math.sin(angle));
  return value < 0 ? -result : result;
}
