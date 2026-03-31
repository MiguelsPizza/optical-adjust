# optics-render

Browser-mode tests for this package must be run with direct `vp test` from this directory:

```bash
cd packages/optics-render
vp test
```

Do not run this package's browser tests through `vp run optics-render#test` or a root `vp run` wrapper. In this workspace that task-runner path can hang and leave orphaned browser-mode processes behind.
