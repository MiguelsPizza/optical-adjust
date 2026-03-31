# POC E2E Validation Plan

Date: 2026-03-30

## Goal

Determine how much of the current proof-of-concept can be verified in code, identify what already exists, and define the next test layers needed so the project does not rely on "looks right to a human" for core technical confidence.

## Summary

Both validation layers already exist in the repo, but only as a baseline.

- Layer 1 exists: deterministic browser and app-flow assertions are present.
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

### Layer 1: deterministic app-flow assertions

Current tests:

- [tests/e2e/playground.spec.ts](/Users/alexmnahas/personalRepos/optical-adjust/tests/e2e/playground.spec.ts)

What currently exists:

- load test checks heading visibility and a couple of diagnostics
- manual residual flow checks `D_res`, blur diameter, and warning text
- preset flow checks `D_res` and blur radius

Assessment:

- This is real Layer 1 coverage.
- It is useful, but narrow.
- It verifies a few happy paths rather than the full UI contract.

Current gaps:

- no assertion of `D_focus` or `firstOtfZero` in e2e
- no coverage for `ScreenFocused` or `FixedFocus`
- no explicit coverage for `RelaxedFarPoint` behavior beyond default load
- no assertion that conditional controls appear/disappear correctly across all modes
- no assertion that all four panel canvases are rendered with correct backing dimensions
- no browser-side check that metrics remain coherent after multiple sequential changes
- no reload/state persistence coverage
- no negative/regression coverage for low-defocus and large-radius warning regimes

Verdict:

- Exists, but not rigorous enough yet.

### Layer 2: numeric and image-pipeline assertions

Current tests:

- [packages/optics/tests/deconvolve.test.ts](/Users/alexmnahas/personalRepos/optical-adjust/packages/optics/tests/deconvolve.test.ts)
- [packages/optics/tests/otf.test.ts](/Users/alexmnahas/personalRepos/optical-adjust/packages/optics/tests/otf.test.ts)
- [packages/optics/tests/otf-analytic.test.ts](/Users/alexmnahas/personalRepos/optical-adjust/packages/optics/tests/otf-analytic.test.ts)
- [packages/optics-render/tests/browser.test.ts](/Users/alexmnahas/personalRepos/optical-adjust/packages/optics-render/tests/browser.test.ts)

What currently exists:

- analytic OTF values checked at a few frequencies
- numeric OTF checked against analytic OTF at low frequencies
- deconvolution checked via MSE threshold and center-pixel improvement
- browser-mode canvas tests check PSF draw, OTF marker draw, blur/deconvolution behavior, and sRGB conversion

Assessment:

- This is real Layer 2 coverage.
- It is stronger than the e2e suite.
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

Add Playwright coverage for the explicit browser contract.

New e2e cases:

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

- every public control surface is exercised at least once in Playwright
- every public derived metric is asserted somewhere in e2e
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

1. Extract canvas luminance in Playwright or browser-mode tests.
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

1. Expand Playwright Layer 1 coverage until every control/metric/warning path is asserted.
2. Add image-quality utilities and browser-side metric assertions.
3. Add a small matrix of golden numeric cases for synthetic targets.
4. Only after that, decide whether the POC is strong enough to move into heavier optimization or Rust/Wasm porting.

## Bottom line

The repo already has the beginnings of both validation layers.

- Layer 1: present but shallow
- Layer 2: present but still smoke-level relative to the product claim

So the next step is not to invent a testing strategy from scratch. It is to harden the one that already exists into a genuine POC validation harness.
