# Equation Source Verification Notes

Date: 2026-03-30

## Purpose

This document records the equations and modeling choices currently used by the optics POC, the first-party or primary sources behind them, and any important caveats.

This is the provenance document for the repo.

## Surviving Local Docs

- [optics_poc_concept.md](optics_poc_concept.md)
- [phase_0_3_build_spec.md](phase_0_3_build_spec.md)
- [poc_e2e_validation_plan.md](poc_e2e_validation_plan.md)

## Final Verification Summary

Overall result:

- The core optics equations in the repo are consistent with the literature.
- The most important physics choices are correct:
  - residual defocus is the driving quantity, not raw prescription
  - spherical defocus is modeled as a disk / pillbox PSF, not a Gaussian
  - the disk OTF is a Bessel / jinc form with real zero crossings
  - inverse filtering requires Wiener-style regularization
- The main caveat is a modeling boundary, not an equation error:
  - the current live renderer is still sphere-first
  - `PrescriptionEstimate` is a convenience heuristic, not a validated accommodation model

## Implementation Files

- [focus.ts](../packages/optics/src/focus.ts)
- [equations.ts](../packages/optics/src/equations.ts)
- [otf.ts](../packages/optics/src/otf.ts)
- [prescription.ts](../packages/optics/src/prescription.ts)
- [diffraction.ts](../packages/optics/src/diffraction.ts)
- [wiener.ts](../packages/optics/src/wiener.ts)
- [bessel.ts](../packages/optics/src/bessel.ts)

## Equation Inventory

### 1. Display vergence and residual defocus

Equations:

```text
D_display = 1 / z
D_res = |D_display - D_focus|
```

Status:

- Verified as correct engineering definitions built from standard vergence concepts.

Primary sources:

- University of Iowa tutorial  
  [https://webeye.ophth.uiowa.edu/eyeforum/video/Refraction/Intro-Optics-Refract-Errors/index.htm](https://webeye.ophth.uiowa.edu/eyeforum/video/Refraction/Intro-Optics-Refract-Errors/index.htm)
- Cholewiak, Love, and Banks  
  [https://pmc.ncbi.nlm.nih.gov/articles/PMC5946648/](https://pmc.ncbi.nlm.nih.gov/articles/PMC5946648/)

Caveat:

- `D_focus` depends on the selected focus model. The math is sound, but the quality of the result depends on whether the chosen focus assumption matches the actual viewing state.

### 2. Defocus blur angle

Equation:

```text
beta_rad ≈ p * |D_res|
```

Status:

- Verified as the correct small-angle defocus relation for the current POC.

Primary sources:

- Strasburger, Rentschler, and Juttner  
  [https://pubmed.ncbi.nlm.nih.gov/29770182/](https://pubmed.ncbi.nlm.nih.gov/29770182/)
- Cholewiak, Love, and Banks  
  [https://pmc.ncbi.nlm.nih.gov/articles/PMC5946648/](https://pmc.ncbi.nlm.nih.gov/articles/PMC5946648/)

### 3. Blur diameter on screen and in pixels

Equations:

```text
b_m ≈ z * beta_rad
b_px ≈ z * p * |D_res| / (0.0254 / PPI)
R_px = b_px / 2
```

Status:

- Verified and currently implemented.

Primary sources:

- Cholewiak, Love, and Banks  
  [https://pmc.ncbi.nlm.nih.gov/articles/PMC5946648/](https://pmc.ncbi.nlm.nih.gov/articles/PMC5946648/)
- NIST SI Units - Length  
  [https://www.nist.gov/pml/owm/si-units-length](https://www.nist.gov/pml/owm/si-units-length)

### 4. Spherical defocus PSF

Model:

```text
PSF_spherical = normalized circular pillbox
```

Status:

- Verified as the right first-order geometric-optics model for spherical defocus in the current POC.

Primary sources:

- Strasburger, Rentschler, and Juttner  
  [https://pubmed.ncbi.nlm.nih.gov/29770182/](https://pubmed.ncbi.nlm.nih.gov/29770182/)

Caveat:

- This is not the full retinal PSF. Diffraction, astigmatism, and higher-order aberrations are excluded from the current live renderer.

### 5. Disk OTF first zero

Equation:

```text
rho_0 ≈ 0.610 / R
```

Status:

- Verified.

Primary sources:

- NIST DLMF first positive zero of `J1`  
  [https://dlmf.nist.gov/10.21.E1](https://dlmf.nist.gov/10.21.E1)

Derived note:

- The coefficient comes from `j_(1,1) / (2 * pi)`.

### 6. Wiener regularization

Model:

```text
H* / (|H|^2 + K)
```

Status:

- Verified as the correct baseline inverse-filter form for the project.

Primary sources:

- Stanford EE367 deconvolution notes  
  [https://web.stanford.edu/class/ee367/slides/lecture14.pdf](https://web.stanford.edu/class/ee367/slides/lecture14.pdf)

Caveat:

- `K` is a practical regularization/control term. The POC must still prove that the regularized result materially beats a simpler sharpening baseline.

### 7. Meridional power and astigmatism

Model:

- regular astigmatism should be handled through principal meridians and an anisotropic PSF family

Status:

- The math direction is verified.
- The current live renderer does not yet render this path.

Primary sources:

- University of Iowa tutorial  
  [https://webeye.ophth.uiowa.edu/eyeforum/video/Refraction/Intro-Optics-Refract-Errors/index.htm](https://webeye.ophth.uiowa.edu/eyeforum/video/Refraction/Intro-Optics-Refract-Errors/index.htm)

Caveat:

- `CYL` and `axis` are preserved in the data model, but the current renderer is still sphere-first.

### 8. Diffraction sanity check

Equation:

```text
theta_Airy ≈ 1.22 * lambda / D_pupil
```

Status:

- Verified as the right circular-aperture sanity-check relation.

Primary sources:

- Stanford EE367 diffraction lecture notes  
  [https://web.stanford.edu/class/ee367/slides/lecture14.pdf](https://web.stanford.edu/class/ee367/slides/lecture14.pdf)
- University of Arizona diffraction notes  
  [https://wp.optics.arizona.edu/jcwyant/wp-content/uploads/sites/13/2016/08/6Diffraction.pdf](https://wp.optics.arizona.edu/jcwyant/wp-content/uploads/sites/13/2016/08/6Diffraction.pdf)

## Remaining Caveats

1. `PrescriptionEstimate` is intentionally approximate.
2. Early calibration should estimate `D_eff`, not claim ground-truth measured `D_res`.
3. The current renderer is still sphere-first, so nonzero-cylinder prescriptions are only partially modeled.
4. The POC still needs to prove that Wiener materially beats unsharp mask under bounded clipping and ringing.
