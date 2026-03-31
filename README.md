# Optical Adjust

Residual-defocus optics playground for browser-based prefiltering experiments.

## Workspace

- `packages/optics-constants`: source-backed optics constants, defaults, presets, and UI copy
- `packages/optics-types`: shared public types and enums
- `packages/optics`: pure optics math, FFT, Wiener, and diagnostics
- `packages/optics-render`: browser rendering and canvas helpers
- `apps/website`: browser playground shell

## Commands

```bash
vp check
vp test
bash scripts/test-all.sh
bash scripts/ready.sh
vp run build -r
vp run dev
```

Testing is intentionally split:

- `vp test` runs the non-browser package suite from the repo root.
- `bash scripts/test-all.sh` runs the full test suite, including both browser suites.
- `bash scripts/ready.sh` runs formatting, checks, the full test suite, and the build.

Browser-mode suites should use direct `vp test` inside their own package/app directories:

```bash
cd packages/optics-render
vp test

cd apps/website
vp test
```

Do not run the browser suites through `vp run optics-render#test`, `vp run website#test`, or a root `vp run` wrapper around those browser commands. In this workspace, the stable paths are direct `vp test` from [`packages/optics-render`](/Users/alexmnahas/personalRepos/optical-adjust/packages/optics-render) and [`apps/website`](/Users/alexmnahas/personalRepos/optical-adjust/apps/website), or the shell helpers in [`scripts/test-all.sh`](/Users/alexmnahas/personalRepos/optical-adjust/scripts/test-all.sh) and [`scripts/ready.sh`](/Users/alexmnahas/personalRepos/optical-adjust/scripts/ready.sh).
