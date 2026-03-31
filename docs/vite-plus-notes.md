# Vite+ Notes

Date: 2026-03-31

## Purpose

Repo-local notes for how this project should use Vite+ today, based on:

- the official docs on `viteplus.dev`
- the current open issue set in `voidzero-dev/vite-plus`
- observed behavior in this repo

## Current Repo Policy

- Use `vp test` at the repo root for the non-browser package suite only.
- Run browser suites with direct `vp test` from:
  - `/Users/alexmnahas/personalRepos/optical-adjust/packages/optics-render`
  - `/Users/alexmnahas/personalRepos/optical-adjust/apps/website`
- Use `bash scripts/test-all.sh` for the full test suite.
- Use `bash scripts/ready.sh` for full validation plus build.
- Do not wrap browser suites in root `vp run` helpers.

## Why

The Vite+ docs present two different layers:

- built-in commands such as `vp test`, `vp build`, and `vp dev`
- task orchestration through `vp run`

That model is valid, but the upstream issue tracker still shows churn around:

- `vp run` behavior for recursive and long-running tasks
- caching for `vp build` and `vp pack`
- install and environment setup
- some test/config edge cases

For this repo, direct package-local browser runs have been more reliable than root task-runner wrappers.

## Practical Guidance

### Safe commands

```bash
vp check
vp test

cd packages/optics-render
vp test

cd apps/website
vp test

bash scripts/test-all.sh
bash scripts/ready.sh
```

### Commands to avoid for browser suites

Avoid:

- `vp run website#test`
- `vp run optics-render#test`
- root `vp run` wrappers that shell out to browser-mode test commands

### Caching posture

Be careful with `vp run --cache` for build-heavy tasks.

Open upstream issue:

- `vp pack` / `vp build` cache misses caused by tracked outputs and `.vite-temp` artifacts:
  [voidzero-dev/vite-plus#1187](https://github.com/voidzero-dev/vite-plus/issues/1187)

If this repo later adopts cached `run.tasks` for build steps, define explicit task inputs and exclude output folders and `.vite-temp` artifacts.

## Upstream Watch List

These issue clusters matter most for this repo:

### `vp run` / task orchestration

- [#1228](https://github.com/voidzero-dev/vite-plus/issues/1228) recursive `-r` behavior for multiple long-running dev servers
- [#1211](https://github.com/voidzero-dev/vite-plus/issues/1211) plugin config hook tasks ignored by `vp run`
- [#1063](https://github.com/voidzero-dev/vite-plus/issues/1063) runtime differences when commands are routed through `vp run`

### test / config compatibility

- [#1229](https://github.com/voidzero-dev/vite-plus/issues/1229) config errors on running tests after scaffolding React compiler
- [#640](https://github.com/voidzero-dev/vite-plus/issues/640) `vp test` problems under Yarn PnP

### install / environment / docs

- [#1239](https://github.com/voidzero-dev/vite-plus/issues/1239) `vp create` with non-global package manager
- [#1226](https://github.com/voidzero-dev/vite-plus/issues/1226) install failure
- [#1059](https://github.com/voidzero-dev/vite-plus/issues/1059) unclear Node version management prompt

## Official References

- [Guide](https://viteplus.dev/guide/)
- [Config](https://viteplus.dev/config/)
- [Test](https://viteplus.dev/guide/test)
- [Run](https://viteplus.dev/guide/run)
- [Task Caching](https://viteplus.dev/guide/cache)
- [CI](https://viteplus.dev/guide/ci)
- [Troubleshooting](https://viteplus.dev/guide/troubleshooting)

## Update Trigger

Revisit this file when:

- Vite+ releases a version that changes browser test handling
- the repo changes its test topology
- the upstream `vp run` and caching issues above are resolved
