import { COMPLEX_COMPONENT_EPSILON } from "optics-constants";
import type { UnitlessGain, UnitlessScalar, WienerParams } from "optics-types";

interface WienerGainSample {
  gainMagnitude: UnitlessGain;
  imag: UnitlessScalar;
  real: UnitlessScalar;
}

function createZeroGainSample(): WienerGainSample {
  return { gainMagnitude: 0, imag: 0, real: 0 };
}

function removeTinyComplexComponents(value: UnitlessScalar): UnitlessScalar {
  return Math.abs(value) < COMPLEX_COMPONENT_EPSILON ? 0 : value;
}

/**
 * Evaluates the stabilized inverse-filter gain for a single OTF sample.
 *
 * The returned complex coefficient is the Wiener inverse
 * `H*(ω) / (|H(ω)|² + K)` after optional hard gain capping.
 */
export function wienerGain(
  otfReal: UnitlessScalar,
  otfImag: UnitlessScalar,
  params: WienerParams,
): WienerGainSample {
  const denominator = otfReal * otfReal + otfImag * otfImag + params.regularizationK;
  if (denominator === 0) {
    return createZeroGainSample();
  }

  let real = otfReal / denominator;
  let imag = -otfImag / denominator;
  let gainMagnitude = Math.hypot(real, imag);

  if (params.maxGain !== undefined && gainMagnitude > params.maxGain) {
    const scale = params.maxGain / gainMagnitude;
    real *= scale;
    imag *= scale;
    gainMagnitude = params.maxGain;
  }

  return {
    gainMagnitude,
    imag: removeTinyComplexComponents(imag),
    real: removeTinyComplexComponents(real),
  };
}
