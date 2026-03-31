# POC E2E Validation Plan

Date: 2026-03-30

## Goal

Determine how much of the current proof-of-concept can be verified in code, identify what already exists, and define the next test layers needed so the project does not rely on "looks right to a human" for core technical confidence.

## Summary

Both validation layers already exist in the repo, but only as a baseline.

- Layer 1 exists: deterministic browser-mounted app-flow assertions are present.
- Layer 2 exists: there are numeric/image-pipeline assertions in unit and browser tests.
- Neither layer is rigorous enough yet to be treated as a complete POC verification strategy.

The current suite proves that:

- the app loads
- controls change derived values
- canvases render
- the optics pipeline runs without crashing
- the reference pipeline moves numbers and pixels in the expected direction

The current suite does not yet prove, with enough rigor, that:

- the full browser app consistently preserves the verified optics contract across flows
- the corrected output is objectively closer to the target than the uncorrected output across a meaningful matrix of cases
- the browser-rendered canvases match expected numeric behavior tightly enough to catch subtle regressions

## Audit

### Layer 1: deterministic browser app-flow assertions

Current tests:

- [apps/website/src/app.browser.test.ts](../apps/website/src/app.browser.test.ts)

What currently exists:

- load test checks the mounted playground shell and public diagnostics
- focus-mode flows cover `ScreenFocused`, `RelaxedFarPoint`, `FixedFocus`, `ManualResidual`, and `PrescriptionEstimate`
- sequential control changes assert that the derived metrics remain coherent
- warning-regime checks cover low-defocus and large-radius states
- canvas-size checks assert the expected backing dimensions
- transient empty input regression coverage ensures intermediate invalid edits do not corrupt state

Assessment:

- This is real Layer 1 coverage.
- It is stronger than a basic smoke test.
- It still does not exercise a full navigation/reload or deployed-browser contract.

Current gaps:

- no reload/state persistence coverage
- no external page-level network/bootstrap checks
- no browser-driven assertions around the WebMCP relay scripts

Verdict:

- Exists and is useful, but is not a full end-to-end harness.

### Layer 2: numeric and image-pipeline assertions

Current tests:

- [packages/optics/tests/deconvolve.test.ts](../packages/optics/tests/deconvolve.test.ts)
- [packages/optics/tests/otf.test.ts](../packages/optics/tests/otf.test.ts)
- [packages/optics/tests/otf-analytic.test.ts](../packages/optics/tests/otf-analytic.test.ts)
- [packages/optics-render/tests/browser.test.ts](../packages/optics-render/tests/browser.test.ts)

What currently exists:

- analytic OTF values checked at a few frequencies
- numeric OTF checked against analytic OTF at low frequencies
- deconvolution checked via MSE threshold and center-pixel improvement
- browser-mode canvas tests check PSF draw, OTF marker draw, blur/deconvolution behavior, and sRGB conversion
- browser-side parity checks compare render-path output with optics-core expectations for blur, Wiener deconvolution, and unsharp masking

Assessment:

- This is real Layer 2 coverage.
- It is stronger than the Layer 1 website suite on numeric rigor.
- It still behaves more like a smoke-level numerical harness than a rigorous image-quality regression system.

Current gaps:

- no golden-image or golden-metric browser-side fixtures
- no SSIM / PSNR / RMSE comparison between:
  - original vs blurred
  - original vs corrected-retinal
  - baseline vs Wiener
- no test matrix over multiple radii / residual defocus levels
- no property-style checks for monotonic blur growth with increasing `D_res`
- no orientation-sensitive cases prepared for future astigmatism support
- no assertion that browser canvas output matches package-level numeric expectations within tolerance
- no test that Wiener output improves objective similarity over a "do nothing" baseline across multiple cases
- no regression fixtures for text-like targets versus blocky synthetic targets

Verdict:

- Exists, but not rigorous enough yet.

## Recommended next test architecture

### Phase A: strengthen Layer 1

Expand the browser-mounted website contract beyond the current in-app suite.

New browser cases:

1. `ScreenFocused` mode yields near-zero residual defocus at the current distance.
2. `RelaxedFarPoint` mode reproduces the verified `-2 D at 50 cm -> near-zero residual` case.
3. `FixedFocus` mode shows and uses the fixed-focus input correctly.
4. `ManualResidual` mode shows and uses the manual residual input correctly.
5. `PrescriptionEstimate` mode remains labeled/behaving as approximate and updates metrics coherently.
6. Sequential-control test:
   change focus mode, then sphere, then distance, then pupil, and assert all derived metrics remain self-consistent.
7. Warning-regime tests:
   low-defocus, zero-crossing, and large-radius regimes each trigger their expected warning states.
8. Canvas-dimension test:
   assert all panel and OTF canvases have the expected backing sizes in the browser.

Success criteria:

- every public control surface is exercised at least once in browser-mode tests
- every public derived metric is asserted somewhere in the website suite
- every warning regime is covered in-browser

### Phase B: strengthen Layer 2

Build a browser-verifiable image-quality regression harness.

New numeric/browser checks:

1. Add shared image-quality utilities in `packages/optics` or `packages/optics-render` for:
   - RMSE
   - PSNR
   - a simple luminance-only SSIM
2. Add synthetic targets:
   - text-like stroke target
   - Siemens-star or spoke-like target
   - slanted edge
   - checker/bar target
3. For each target and blur radius in a small matrix:
   - render original
   - blur original
   - prefilter original
   - blur prefiltered
   - assert that blurred-prefiltered is objectively closer to original than blurred-original
4. Add baseline comparisons:
   - no correction
   - Wiener correction
   - optional unsharp-mask baseline when that path exists
5. Add toleranced browser-side pixel checks on the OTF plot and PSF plot instead of single-pixel smoke checks only.

Success criteria:

- at least one objective metric shows consistent improvement for the verified-useful regime
- regressions in the canvas pipeline fail numerically, not only visually

### Phase C: bridge browser and optics-core

Connect the browser output back to the optics-core contract.

Recommended tests:

1. Extract canvas luminance in browser-mode tests.
2. Compare browser-rendered results to package-level reference output for the same input.
3. Use tolerances rather than exact pixel equality to avoid flaky failures from browser rendering details.

Success criteria:

- the website shell is proven to be a thin integration layer over the package math, not a separate hidden behavior surface

## What still requires human validation

Even after Phases A-C, the following are still human/product questions:

- does the corrected output feel sharper to a real viewer?
- does it improve reading or recognition performance?
- are the artifacts acceptable in real use?

Those should be tested with a small structured human protocol, not with ad hoc self-reporting.

## Suggested implementation order

1. Expand Layer 1 browser coverage until every control/metric/warning path is asserted.
2. Add image-quality utilities and browser-side metric assertions.
3. Add a small matrix of golden numeric cases for synthetic targets.
4. Only after that, decide whether the POC is strong enough to move into heavier optimization or Rust/Wasm porting.

## Bottom line

The repo already has the beginnings of both validation layers.

- Layer 1: present but shallow
- Layer 2: present but still smoke-level relative to the product claim

So the next step is not to invent a testing strategy from scratch. It is to harden the one that already exists into a genuine POC validation harness.

## 2026-03-31 implementation note

The repo now closes several of the gaps listed above:

- Layer 1 now includes reload/state-persistence coverage for the website shell.
- Layer 2 now has an explicit comparison-matrix summary over four synthetic targets and three blur radii, with per-case better/tied/worse outcomes against both the blurred-original and unsharp baselines.
- The website now exposes that matrix outcome directly, including the current default case where Wiener does not beat the unsharp baseline on the shared matrix.
- Browser tests still validate package/browser parity, and the website suite now checks the new audit surface as part of the mounted app contract.

What still remains outside code-only validation is unchanged:

- human readability benefit
- subjective artifact tolerance
- calibrated-user stability and usefulness
