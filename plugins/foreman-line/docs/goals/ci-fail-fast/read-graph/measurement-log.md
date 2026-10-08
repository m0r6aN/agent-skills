# CFF-P0 — D7 read-graph measurement log (AC5) — **LOOP-STOP, not done**

**Spec:** `plugins/foreman-line/docs/specs/active/CFF-P0-recon-and-baseline.md`
(SHA-256 `e529dedc7b4d035f4e3447e623c9ad0e1d364bda30388d8a2e4409812fb15ab8`), AC5.
**This session's host:** `linux` (kernel `7.2.5-3-omarchy`), Node `v26.8.2`,
builder session, worktree HEAD `f9788222c9b18087600d2a247dce1005af2c7943`.
**Pinned primary environment (AC5.2):** `windows-latest`, Node `24.19.0`
(`.github/workflows/foreman-line-ci.yml:23,45` and the `gate`/`sweep`/`test`
jobs throughout).

## Status: AC5 is NOT complete this session. This is the spec's named loop-stop.

Per the build brief's binding instruction: *"If the instrumented pass cannot
run on a true windows-latest/Node 24.19.0 host without a workflow change
(this parcel may not make one), that is a loop-stop for coordinator ruling —
never a silent host substitution, never a Linux pass labeled as the pinned
environment."* That condition is met. `read-graph.json`,
`fixtures/ci-pass-raw.json`, and `fixtures/dev-pass-raw.json` are **not
committed this session** — committing them without a real capture would
require either fabricated data or a silently substituted environment, both
explicitly forbidden (Hard stop conditions: "silently substituting an
environment for the pinned one"; "a D7 measurement that cannot cover a
package class"). This file records the investigation that reached that
conclusion, so the coordinator's ruling has the full evidence trail and a
future session does not have to re-derive it.

## What AC5 requires and why it cannot proceed this session

AC5.1 requires **an instrumented sweep** — code that observes, at test time,
every path any check opens (imports *and* non-import couplings: materialized
temp-repo reads, fixture path strings, generation targets, module-load
reads) — executed as **one measurement pass on the pinned primary
environment** (`windows-latest`, Node `24.19.0`), from which both the C9
`READER_SET` delta and the D7 affection-pin projections are derived.

Investigated, in order:

1. **Does the existing runner already carry an instrumentation hook (env
   var, loader flag) this parcel could use read-only?**
   ```
   grep -n "process\.env" scripts/foreman-line-ci.mjs scripts/ci-reuse.mjs
   ```
   Measured: the only `process.env` references in either file are
   `runCli(argv, env = process.env, deps = {})`
   (`scripts/foreman-line-ci.mjs:1211`) and the CLI entry point's
   `runCli(process.argv.slice(2), process.env)` (`scripts/ci-reuse.mjs:1124`)
   — both are the ordinary CLI environment-injection seam, not an
   instrumentation hook. No `NODE_OPTIONS`, `--require`, coverage, or
   trace-capable env var is read anywhere in either runner file. **No
   built-in capture mechanism exists.**

2. **Does the pinned workflow (`foreman-line-ci.yml`) pass any env var or
   flag into the `node scripts/foreman-line-ci.mjs shard ...` invocation that
   could carry instrumentation without editing the workflow file?**
   Read `.github/workflows/foreman-line-ci.yml` in full: the `sweep` job's
   only relevant step is
   ```yaml
   run: |
     $npmCli = Join-Path (Split-Path (Get-Command node).Source) 'node_modules/npm/bin/npm-cli.js'
     node scripts/foreman-line-ci.mjs shard ${{ matrix.shard }} ${{ needs.gate.outputs.shard_count }} "$npmCli" shard-outcomes
     exit $LASTEXITCODE
   ```
   No `NODE_OPTIONS`, no `env:` block carrying a loader path, no
   `workflow_dispatch` trigger with inputs (`on: push / pull_request` only —
   confirmed by reading the `on:` block at the top of the file). There is no
   way to inject an instrumentation hook into this exact command without
   editing the workflow YAML — which AC5.2 and the Hard stop conditions
   explicitly forbid this parcel from doing.

3. **Is a true `windows-latest` host reachable any other way this session?**
   ```
   gh api repos/m0r6aN/agent-skills/actions/runners
   ```
   Measured: `{"total_count":0,"runners":[]}` — no self-hosted runners are
   registered on this repository. The only `windows-latest` execution surface
   is GitHub-hosted runners dispatched by the existing `push`/`pull_request`
   triggers, which run the **unmodified** workflow command above — with no
   instrumentation seam, per (2).

4. **Could a Linux-local run stand in, clearly labeled as a variance edge
   rather than the pin?** No — AC5.3 names exactly two legitimate
   environments: the pinned primary (`windows-latest`) and the coordinator-
   ratified supplementary pass ("the same single-pass measurement is re-run
   on the developer's Windows machine"). Linux is not a sanctioned third
   environment for this measurement; running an instrumented capture on this
   Linux session and presenting it as either projection, or as a named
   variance edge under a role the spec reserves for a Windows host, would be
   exactly the "silent host substitution" the brief and the Hard stop
   conditions forbid. No such capture was produced.

## Conclusion — what is and is not available this session

- **Primary pass (pinned `windows-latest` / Node `24.19.0`, instrumented):**
  cannot run this session without a workflow change, which this parcel may
  not make. **This is the named loop-stop for coordinator ruling.**
- **Supplementary pass (developer's Windows machine, AC5.3):** requires
  physical access to that machine, unavailable in this session. **Named
  pending input — recorded as pending, never marked done.**
- **Static analysis that does not require execution** (the C9 side of the
  picture) was completed read-only and is recorded in
  `cff-p0-c9-reproof.md` (AC6) — it independently re-confirms the existing
  `READER_SET`/`classifyPath` split holds for `kernel-import`, `ops-console`,
  `project-scaffold`, and that
  `classifyPath('plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/read-graph.json')`
  → `code` while the sibling `.md` narrative files classify
  `ordinary_documentation` (AC5.6's classification safety property, verified
  below even though the pin itself does not yet exist).

## AC5.6 classification safety property — verified independent of the capture

This property does not require the instrumented pass; it is a property of
`classifyPath` applied to the *planned artifact paths*, checkable now:

```
node -e "
import('./scripts/ci-reuse.mjs').then(m => {
  console.log(m.classifyPath('plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/read-graph.json'));
  console.log(m.classifyPath('plugins/foreman-line/docs/goals/ci-fail-fast/cff-p0-sweep-anatomy.md'));
  console.log(m.classifyPath('plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/measurement-log.md'));
  console.log(m.classifyPath('plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/fixtures/ci-pass-raw.json'));
});
"
```
Measured:
```
code
ordinary_documentation
ordinary_documentation
code
```
Confirmed: the JSON artifact paths (`read-graph.json`, the fixtures)
classify `code` — any future edit to the pin forces a full sweep, the safe
direction — while the Markdown narrative (`measurement-log.md`, this file,
and `cff-p0-sweep-anatomy.md` et al.) classifies `ordinary_documentation`.
The pin's protection comes from the JSON, not the prose, exactly as AC5.6
states.

## Named pending inputs (both required before AC5 can close)

1. **Primary instrumented pass on a true `windows-latest` / Node `24.19.0`
   host** — blocked this session by the no-workflow-change constraint; needs
   a coordinator ruling on how to proceed (e.g., a ratified, scoped workflow
   amendment in a later parcel, or an alternative instrumentation surface
   this session did not discover).
2. **Supplementary pass on the developer's Windows machine** — blocked this
   session by lack of physical access; recorded as pending, not done.

No `read-graph.json`, `fixtures/ci-pass-raw.json`, or `fixtures/dev-pass-raw.json`
is committed by this parcel. AC5 is reported to the coordinator as blocked,
per the brief's explicit instruction, rather than closed with placeholder or
substituted-environment data.
