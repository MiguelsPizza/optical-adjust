# Optical Adjust

Residual-defocus optics playground for browser-based prefiltering experiments.

## Workspace

- `packages/optics-constants`: source-backed optics constants, defaults, presets, and UI copy
- `packages/optics-types`: shared public types and enums
- `packages/optics`: pure optics math, FFT, Wiener, and diagnostics
- `packages/optics-render`: browser rendering and canvas helpers
- `apps/website`: React playground shell

## Commands

```bash
vp check
vp run test:optics
vp run test:e2e
vp run build -r
vp run dev
```

Browser-mode rendering tests should use direct `vp test` inside the package:

```bash
cd packages/optics-render
vp test
```

Do not run browser-mode tests via `vp run optics-render#test` or any root `vp run` wrapper around that command. In this workspace, the stable path is direct `vp test` from [`packages/optics-render`](/Users/alexmnahas/personalRepos/optical-adjust/packages/optics-render).
