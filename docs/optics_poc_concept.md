# Optics POC Concept

Date: 2026-03-30

## Purpose

This document defines the smallest scientifically honest version of the project.

The proof-of-concept question is:

Can a viewer-specific residual-defocus model plus regularized prefiltering improve readability on a high-PPI display enough to beat a simple sharpening baseline?

This repo is not trying to prove a full product architecture yet. It is trying to prove the optics and perceptual value of the POC.

## Current Scope

In scope:

- explicit residual-defocus math
- manual viewing-state inputs
- spherical defocus blur
- regularized Wiener prefiltering
- comparison against unsharp masking
- diagnostics and validation

Out of scope for the current POC:

- extension delivery
- webcam automation
- adaptive optimization
- product architecture decisions
- claims of universal benefit across prescriptions and devices

## Optical Contract

The core display-space chain is:

```text
D_display = 1 / z
D_res = |D_display - D_focus|
beta_rad ≈ p * |D_res|
b_px ≈ z * p * |D_res| / (0.0254 / PPI)
R_px = b_px / 2
```

Where:

- `z` is viewing distance in meters
- `p` is entrance pupil diameter in meters
- `D_focus` is the eye's effective focus vergence under the selected focus assumption
- `D_res` is residual defocus magnitude in diopters
- `b_px` is blur-disk diameter in display pixels
- `R_px` is blur-disk radius in display pixels

## Focus Modes

The focus modes are different assumptions about `D_focus`, not different blur formulas.

Current project modes:

- `ScreenFocused`
- `RelaxedFarPoint`
- `FixedFocus`
- `ManualResidual`
- `PrescriptionEstimate`

`PrescriptionEstimate` is a convenience heuristic, not a clinically validated accommodation model.

## PSF And OTF

For spherical defocus, the current reference model is:

- PSF: normalized circular pillbox
- OTF: disk OTF with jinc / Bessel-`J1` structure

That matters because the disk OTF has real zero crossings. Inverse filtering is therefore numerically unstable without regularization, and some ringing is an expected failure mode rather than evidence that the FFT is wrong.

## Current Modeling Boundary

The current live renderer is still sphere-first.

That means:

- `SPH` is actively used in the focus path
- `CYL` and `axis` may be preserved in the data model
- regular astigmatism is not yet rendered as a directional PSF

So a nonzero-cylinder prescription is only partially modeled today.

## Calibration Framing

Calibration should estimate the parameter the renderer actually needs.

Until validated otherwise, that parameter should be described as:

- `D_eff`: effective residual blur parameter under the current forward model

Do not describe early calibration output as ground-truth physiological `D_res`.

## POC Success Question

The POC succeeds only if reference Wiener materially beats a simpler baseline under bounded artifacts.

That means:

- sharper is not enough
- the corrected image must remain tolerable
- clipping and ringing must stay bounded
- the win must show up in a task or preference metric, not only in simulated images

The concrete Phase 0-3 thresholds and execution rules live in [phase_0_3_build_spec.md](/Users/alexmnahas/personalRepos/optical-adjust/docs/phase_0_3_build_spec.md).

## Primary Sources

- Strasburger, Rentschler, and Juttner, "Blur Unblurred"  
  [https://pubmed.ncbi.nlm.nih.gov/29770182/](https://pubmed.ncbi.nlm.nih.gov/29770182/)
- Cholewiak, Love, and Banks  
  [https://pmc.ncbi.nlm.nih.gov/articles/PMC5946648/](https://pmc.ncbi.nlm.nih.gov/articles/PMC5946648/)
- University of Iowa ophthalmic optics tutorial  
  [https://webeye.ophth.uiowa.edu/eyeforum/video/Refraction/Intro-Optics-Refract-Errors/index.htm](https://webeye.ophth.uiowa.edu/eyeforum/video/Refraction/Intro-Optics-Refract-Errors/index.htm)
- NIST SI Units - Length  
  [https://www.nist.gov/pml/owm/si-units-length](https://www.nist.gov/pml/owm/si-units-length)
- NIST DLMF Bessel `J1` first zero  
  [https://dlmf.nist.gov/10.21.E1](https://dlmf.nist.gov/10.21.E1)
