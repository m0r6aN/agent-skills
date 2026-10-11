# dev-drop — supplementary read-graph capture drop spot

**Goal:** `ci-fail-fast` · **Parcel:** CFF-P0, AC5 supplementary pass (R15 variance-edge naming)
**Owner of the drop:** the developer (a human input act). **Consumer:** the CFF-P0 builder, into `read-graph/fixtures/dev-pass-raw.json` (its own Allowed Files).

## Erratum (2026-10-08)

The first version of this README named `scripts/read-graph-probe.mjs` and a
`--env dev-win --out dev-pass-raw.json` command. **That file never shipped and
that command never existed.** The probe that produced the primary capture was
`tools/cff-p0-read-graph-probe.mjs`, which only ever lived on the deleted scratch
branch `measure/cff-p0-read-graph` and took no flags. It is recovered here
byte-for-byte (below). The contract section below replaces the old one.

## Contract

1. **What runs.** The same instrument and the same four shard invocations as the
   primary `windows-latest` / Node `24.19.0` capture (run `37768165017`), executed
   on the developer's Windows machine:
   - **Probe:** `probe/cff-p0-read-graph-probe.mjs`. It is a byte-identical recovery of
     `git show 2d81d9264ba69df92e96fe331b227cc103eb3e8a:tools/cff-p0-read-graph-probe.mjs`,
     143 lines, SHA-256
     `3105d304b94a12b1282267c1b950e0027f47d0f93abcedda659fed20878d07f0`. Never edit
     it: if the bytes differ, the two passes cannot be compared (R15). The driver
     checks the hash before it runs anything.
   - **Driver:** `capture-dev-pass.mjs`. It runs
     `node scripts/foreman-line-ci.mjs shard <i> 4 "<npmCli>" read-graph-shard-outcomes`
     for i = 0, 1, 2, 3 in sequence. `npmCli` is `<node-dir>/node_modules/npm/bin/npm-cli.js`.
     `NODE_OPTIONS=--require=<probe>` and `READGRAPH_CAPTURE_DIR=<repo>/read-graph-capture`
     are set for each child process only. A red shard never stops the run, and every
     exit code is recorded. The driver then reads the raw per-pid `.jsonl` line by
     line (it never holds the whole capture in memory) and applies the five filters
     pinned in `read-graph/measurement-log.md`, in the same order. The filters are:
     install-phase `argv1`, `node_modules/`, the probe's own file, outside-repo paths,
     and unattributed root-cwd orchestrator reads. The kept lines are collapsed to
     distinct (package, repo-relative path) pairs.
   - **Output:** `dev-drop/dev-pass-raw.json`, schema `foreman-line-ci/read-graph-raw-capture@1`.
     It has the same top-level shape as the primary `fixtures/ci-pass-raw.json`.
     The `environment` field names **this host** as measured (`dev-windows`, the
     Node version that actually ran). It never carries the pinned CI values. The
     driver also adds `host`, `probe`, `shard_runs` (each shard's exit code, signal,
     duration and outcomes), `discovered_packages` and `reduction_diagnostics`.
2. **What to drop here:** `dev-pass-raw.json` exactly as written, unedited, plus
   the console log (see the runcard).
3. **What happens next:** the builder derives the supplementary projection from this file **merged with the same single-pass discipline** — local-only edges join the map as **named variance edges that always affect, never exclude** (R15). This file never becomes a second pin and never produces a second projection set.
4. **If unreachable/undone:** nothing breaks; the capture stays a named pending input and all cross-environment edges degrade to always-affect (safe, noisier ordering).

## Runcard (the human act)

> **Read first. These prerequisites are required.**
> - **Windows**, and **Node ≥ 24.2** (24.x LTS recommended). The runner's CLI is
>   guarded by `import.meta.main`, so on older Node it **silently runs nothing**.
>   The driver refuses to start in that case. Do not change Node just to match
>   CI (`24.19.0`). Use the Node you normally use; it gets recorded.
> - npm must live at `<node-dir>\node_modules\npm\bin\npm-cli.js`. The official
>   installer and nvm-windows both put it there. The driver refuses if it is missing.
> - **Time:** about 60–90 minutes, sequential. Each shard reinstalls every
>   package and then runs its checks. Plan for about 1 GB of raw capture on disk.
> - **Red is expected.** Local sweeps have pre-existing failures (the charter's
>   D9 rationale counts 279). The capture is valid because of the file opens it
>   records, not because checks pass. Let it finish.
> - Run it from **PowerShell 7 (`pwsh`)**, so that `Tee-Object` logs correctly.

1. **Line endings first, before any checkout:**
   `git config --global core.autocrlf false`
   This keeps LF bytes, as the vehicle's own first step did. With CRLF, the probe
   hash check refuses.
2. **Get this branch:** clone, or `git fetch` and `git checkout`, the branch that
   carries this `dev-drop/`. That is `chore/cff-p0-dev-drop`, or its merge target
   once the coordinator has merged it. Then `cd` to the **repository root**.
   - *Erratum to the dispatch brief:* the brief listed "`npm ci` at repo root" as
     a step. This repository has **no root `package.json`**, so that command fails.
     The step is not needed because each shard runs `npm ci` for every package
     itself (the per-shard install barrier, AC4), exactly as the vehicle did.
3. **Preflight (runs nothing):**
   `node plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/dev-drop/capture-dev-pass.mjs --dry-run`
   Every line must read `[ ok ]`. If any line reads `FAIL`, fix the cause it names
   (wrong directory, Node version, CRLF probe, stale `read-graph-capture/`,
   `read-graph-dev-pass/` or `read-graph-shard-outcomes/` from an earlier attempt —
   move them aside, do not merge them), then run the preflight again.
4. **Run:**
   `node plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/dev-drop/capture-dev-pass.mjs 2>&1 | Tee-Object -FilePath $HOME\dev-pass-console.log`
   Leave the machine awake and do not touch the checkout while it runs.
5. **Confirm:** the run ends with `[dev-pass] DONE. Wrote ...dev-pass-raw.json`, and
   `dev-drop\dev-pass-raw.json` exists. Copy `$HOME\dev-pass-console.log` into
   `dev-drop\`. Hand over **exactly those two files**: `git add` those two paths
   only, never `git add -A`.
   The working folders `read-graph-dev-pass\`, `read-graph-shard-outcomes\` and
   `read-graph-capture\` at the repo root are raw evidence. Keep them until the
   builder confirms receipt, and never commit them.

**On failure, at any step:** drop whatever was produced (a `dev-pass-raw.json` if
one exists, plus the console log), as-is. **Never edit the JSON**, never
re-label it, and never substitute another machine's run.
- If the sweep finished but the reduction crashed, run
  `... capture-dev-pass.mjs --reduce-only` once. It re-reduces the archived raw
  capture without re-running the sweep. Then drop the result as above.
- If it ends with a `WARNING: only N package(s) carry edges`, still drop both files.
  That warning is information for the builder, not a reason to retry.

## Interpretation notes (for the consumer)

The primary run's reduction code was never committed, so only its prose
methodology and its output survive. Where the prose leaves room for more than one
reading, the driver chose the reading that the primary fixture's own contents
support. All of these choices are recorded in the output's `filter_methodology`
and `reduction_diagnostics`:

- Path containment uses absolute paths only. On win32 the comparison ignores case.
  The recorded casing is kept: the primary contains `PLUGINS/FOREMAN-LINE/<PKG>` entries.
- Relative targets and `file:`-URL targets count as outside-repo (external). The
  primary contains no cwd-relative artifacts, such as a bare `fs` turned into a path.
- Package attribution comes from the reading process's `cwd`, which must sit under
  `plugins/foreman-line/<discovered package>/`. Any other `cwd` counts as unattributed;
  `reduction_diagnostics` separates root-cwd reads from all others.
- `node_modules/` is matched as a substring of the forward-slashed path. The primary
  keeps a bare `plugins/foreman-line/foreman-config/node_modules` entry, which matches this.
