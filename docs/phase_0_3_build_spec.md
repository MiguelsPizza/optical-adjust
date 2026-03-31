# Phase 0-3 Build Spec

## Purpose

This document narrows the project to the first scientific question that matters:

Can a manual or calibrated residual-defocus model, paired with regularized prefiltering, improve readability enough to beat a simple sharpening baseline on a high-PPI display?

Until that question is answered, the project should not expand scope through webcam automation, adaptive optimization, or extension-heavy delivery work.

## Terms

- `D_display`: display vergence in diopters at the current viewing distance.
- `D_focus`: the vergence where the eye is currently focused under the active focus model.
- `D_res`: residual defocus magnitude under the forward model, `|D_display - D_focus|`.
- `D_eff`: effective residual blur parameter fit from calibration responses under the current forward model.
- `D_eff_uncertainty`: uncertainty interval for `D_eff` or for the fitted focus-model parameters.

Use `D_res` for forward-model math and manually declared states.

Use `D_eff` for calibration outputs until validation shows that the fitted quantity tracks physiological residual defocus closely enough to rename it.

## Current Renderer Truth

The current live renderer is still sphere-first.

That means:

- `SPH` is used in the active focus path.
- `CYL` and `axis` may be preserved in the data model and presets, but they are not yet rendered as a directional PSF.
- Any preset or calibration result with nonzero cylinder must be labeled as only partially modeled until anisotropic PSFs land.

## Phase Boundaries

### Phase 0

Goal: make the optics contract explicit, auditable, and testable.

Required outputs:

- Named equations for `D_display`, `D_res`, `beta_rad`, `b_px`, `R_px`
- Focus-mode contract with declared assumptions for every numeric example
- Spherical PSF/OTF contracts
- Data contracts for artifact diagnostics and feasibility warnings
- Unit tests against closed-form or reference values

Exit criteria:

- Every numeric example states its focus assumption.
- Every exported quantity is named in domain terms, not anonymous scalar terms.
- The warning model distinguishes at least:
  - low-defocus regime
  - zero-crossing risk
  - large-radius / PPI-limited regime
  - calibration uncertainty

### Phase 1

Goal: ship a manual-only playground that exposes the optical model honestly.

Required outputs:

- Vanilla TypeScript playground UI
- Manual controls for focus mode, sphere, distance, pupil, and PPI
- Visual comparison panels
- Spherical pillbox blur simulation
- Baseline unsharp-mask control
- Debug values for `D_display`, `D_focus`, `D_res`, blur radius, first OTF zero, and max Wiener gain
- Visible warning when `CYL != 0` that astigmatism is not yet rendered

Exit criteria:

- Feature parity with the current reference playground on the corrected math contract
- Unsharp and Wiener are both available as explicit comparison paths
- The UI does not imply full spherocylindrical correction when the renderer is still sphere-first

### Phase 2

Goal: determine whether reference Wiener materially beats unsharp mask in the target regime.

Required outputs:

- Deterministic reference deconvolution path
- Correct FFT padding, kernel centering, and cropping
- Regularization controls
- Artifact diagnostics:
  - clipping fraction
  - ringing / overshoot metric
  - max Wiener gain
- Controlled Wiener-vs-unsharp comparison views
- Golden-image or analytic tests for the reference path

Provisional go/no-go thresholds:

- At least one target case shows one of:
  - `>= 5%` reading-speed improvement, or
  - `>= 1` step improvement in smallest readable font / optotype threshold
- Pairwise preference for Wiener over unsharp is `>= 60%` in the intended target regime
- Clipping fraction remains `<= 1%` of output pixels in the default tuned mode
- Ringing / overshoot remains bounded enough that no more than `20%` of trials report the corrected image as "sharper but worse overall"

If those thresholds are not met, the project should pivot toward a more conservative accessibility/sharpening tool rather than assume the full inversion path will improve later.

### Phase 3

Goal: estimate the model parameter the renderer actually needs and prove that calibration is usable.

Required outputs:

- Stage 1 focus-model fitting that estimates `D_eff` or fitted focus parameters rather than claiming ground-truth `D_res`
- Uncertainty reporting
- Stage 2 perceptual tuning for Wiener `K`, gain cap, and halo tolerance
- Stage 3 reading probe
- Local profile storage
- Manual fallback path at every step

Calibration protocol constraints:

- Total default calibration time budget: `<= 3 minutes`
- Stage 1 target: `<= 90 seconds`
- Stage 2 target: `<= 60 seconds`
- Stage 3 target: `<= 30 seconds`
- If the user quits early or responses are inconsistent, preserve the partial result and fall back to manual or prescription-estimate mode

Exit criteria:

- Test-retest stability is acceptable for at least one bounded target segment
- Calibrated defaults beat prescription-estimate defaults for that segment
- Calibration uncertainty is visible to the user and available to the renderer and policy layers

## Data Contracts

The scientific path should standardize these outputs before adding more product surface:

```ts
interface FeasibilityWarnings {
  lowDefocusRegime: boolean;
  zeroCrossingRisk: boolean;
  largeRadiusRegime: boolean;
  calibrationUncertainty: boolean;
  astigmatismNotRendered: boolean;
}

interface ArtifactDiagnostics {
  clippingFraction: number;
  ringingEnergy: number;
  overshootFraction: number;
  maxWienerGain: number;
}

interface CalibrationResult {
  dEff: number | null;
  dEffLowerBound: number | null;
  dEffUpperBound: number | null;
  preferredRegularizationK: number | null;
  preferredMaxGain: number | null;
  haloTolerance: number | null;
  completionFraction: number;
}
```

Names may change in code, but the semantics should not.

## Comfort And Adaptation Rules

Comfort is not a late add-on.

Any later adaptive controller or bandit must operate inside a hard comfort envelope defined by feasibility warnings and artifact limits from the reference path.

That means:

- no exploration outside bounded gain and clipping limits
- no sensor update may overwrite the calibrated prior directly
- no adaptation phase may start before the manual and calibrated baselines are proven useful

## Extension Scope Note

Extension delivery is not part of the Phase 0-3 science gate.

When extension work begins, treat DOM-local filter injection as a limited delivery mode rather than a reference-equivalent renderer. The reference result remains the playground's optics-correct path until a browser delivery mode proves parity explicitly.
