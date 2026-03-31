/**
 * High-level correction path used by the playground renderer.
 *
 * `Wiener` is the optics-aware inverse-filter path. `UnsharpMask` is the
 * simpler baseline used as a comparison condition in the POC.
 */
export enum CorrectionMode {
  UnsharpMask = "unsharpMask",
  Wiener = "wiener",
}
