# CFF-P0 — D7 read-graph measurement log (AC5)

**Spec:** `plugins/foreman-line/docs/specs/active/CFF-P0-recon-and-baseline.md`, AC5.
**Prior session's loop-stop (2026-10-07/08):** AC5 could not proceed without a
true `windows-latest`/Node `24.19.0` instrumented pass, and the parcel may not
edit `.github/workflows/foreman-line-ci.yml` to add an instrumentation seam.
That investigation (grep of `scripts/foreman-line-ci.mjs`/`scripts/ci-reuse.mjs`
for existing hooks, read of the pinned workflow's `on:`/`run:` blocks, a
`gh api .../actions/runners` check for self-hosted runners) is preserved
below under "Prior session's investigation" for the record. **This session
resolves the loop-stop under a coordinator ruling.**

## Coordinator ruling (2026-10-08) — measurement vehicle

The coordinator authorized a **measurement vehicle**: a scratch branch,
`measure/cff-p0-read-graph`, cut from this session's starting tip
(`5af7f3350660062bd0776ab658d0771af2db274b`), carrying **exactly two files**
that never merge and die with the branch:

1. `.github/workflows/cff-p0-readgraph-measure.yml` — a new, additive-only
   workflow, triggered by `push` to the scratch branch only. It never reads,
   imports, or edits the pinned `.github/workflows/foreman-line-ci.yml`. It
   mirrors that workflow's exact environment (`windows-latest`, Node
   `24.19.0`) and the exact 4-way shard matrix (`MAX_SHARDS = 4`,
   `scripts/foreman-line-ci.mjs`'s `assignShards`) the pinned `sweep` job
   uses, and invokes the **same** command the pinned workflow invokes:
   `node scripts/foreman-line-ci.mjs shard <i> 4 "<npmCli>" <outDir>` — with
   one additive observation seam, `NODE_OPTIONS=--require=<probe>`.
2. `tools/cff-p0-read-graph-probe.mjs` — the loader/probe. Observe-only
   (D2): it wraps `node:fs` read surfaces (`readFileSync`, `readFile`,
   `openSync`, `open`, `existsSync`, `statSync`, `lstatSync`,
   `createReadStream`, and the `fs.promises` equivalents), wraps
   `Module._load` to record CJS `require` resolutions, and registers itself
   via `node:module`'s `register()` as an ES module customization hook to
   record `resolve`/`load` URLs for ESM imports. Every wrapped function
   returns the original call's result **unmodified** — it never forks or
   changes runner logic. Guarded by `isMainThread` so the hooks thread (which
   re-evaluates the same file) never recursively spawns another hooks
   thread. Silent no-op unless `READGRAPH_CAPTURE_DIR` is set, so it never
   changes behavior for any invocation that does not opt in. Verified
   locally (off-vehicle, this repo's own Linux session Node `v26.8.2`,
   `/tmp` scratch — not part of any claimed capture) before being pushed, to
   confirm it captures `fs.readFileSync`, `cjs.require`, and `esm.resolve`/
   `esm.load` without altering `import()`/`readFileSync` return values.

Both files were committed to `measure/cff-p0-read-graph` and pushed; a diff
check (`git diff --stat .github/workflows/foreman-line-ci.yml`) confirmed
empty before every push — the pinned workflow was never touched.

## Capture runs

**Run 1 (`37764594545`, vehicle commit `6388486a`):** all 4 shard jobs
executed on `windows-latest` / Node `24.19.0`; shards 1-3 captured cleanly.
Shard 0's "consolidate" step crashed (`RangeError: Invalid string length` —
an in-job `JSON.stringify` of the full per-pid capture exceeded V8's string
limits; `verification` and other heavy packages in that shard produced a
very large raw capture). This is recorded, not hidden: shard 0's edges from
this run are **not** part of the capture of record.

**Fix:** the consolidate step was rewritten to stream-dedupe into a
`.jsonl` file instead of building one JSON string in memory, committed as
`2d81d9264ba69df92e96fe331b227cc103eb3e8a`, pushed to the same scratch
branch.

**Run 2 (`37768165017`, vehicle commit `2d81d9264ba69df92e96fe331b227cc103eb3e8a`)
— the capture of record.** All 4 shard jobs completed; every package's
`ci`/`test`/`typecheck`/`lint` passed (30/30 packages green, zero waivers
consulted — a clean baseline sweep).

| shard | job ID | duration | packages |
|---|---|---|---|
| 0 | `113280808126` | 19m29s | approval, contracts, integration, kernel-lease, permission-profiles, registration, shaping, verification |
| 1 | `113280808138` | 29m52s | authority-registry, dispatch, jev-decisions, kernel-state, project-scaffold, role-authority, skill-injection, worker-envelopes |
| 2 | `113280807799` | 4m20s | bypass-outage-harness, foreman-config, kernel-contracts, mutation-scope-guard, projection, routing-policy, spec-body-compiler |
| 3 | `113280808133` | 4m52s | contract-readers, hybrid-routing, kernel-import, ops-console, receipts, schema-scaffold, spec-linter |

**Host fingerprint (identical across all 4 shard jobs, recorded per-job):**
`node v24.19.0`, `platform win32`, `arch x64`, `release.lts Krypton` — the
pinned primary environment (AC5.2), no substitution.

**Exact commands (as they ran in the vehicle workflow, per shard job):**
```
node scripts/foreman-line-ci.mjs shard <0|1|2|3> 4 "<npmCli>" read-graph-shard-outcomes
```
with `NODE_OPTIONS=--require=<repo>\tools\cff-p0-read-graph-probe.mjs` and
`READGRAPH_CAPTURE_DIR=<repo>\read-graph-capture` set for the duration of
that one step only.

**Artifacts exported and downloaded (ruling condition 4):** `gh run download
37768165017 -R m0r6aN/agent-skills` pulled 8 artifacts
(`read-graph-raw-capture-shard-{0,1,2,3}` — the per-pid raw `.jsonl`
captures, shard outcomes, fingerprint, sweep-exit code; plus
`read-graph-shard-outcomes-{0,1,2,3}` duplicated for convenience) totalling
~810MB of raw per-pid `.jsonl` across ~2.26M observed file-open events.

## From raw capture to the committed fixture — filter methodology

The raw per-pid `.jsonl` (810MB, not committed — see "Why the raw jsonl
itself is not a fixture" below) was reduced to the committed
`fixtures/ci-pass-raw.json` (204KB) by three filters, each stated so a
reviewer can reproduce them from the artifact structure:

1. **Install-phase excluded.** Any record whose `argv1` is npm's own
   `npm-cli.js` bootstrap process is dropped. `npm ci`'s own workspace
   package.json walk (and `npm run <check>`'s own pre-dispatch bookkeeping)
   happens inside that process, identically for every package, before the
   check's own process (the real `test`/`typecheck`/`lint` subprocess —
   `tsx`, `vitest`, `tsc`, `eslint`, or a test's own spawned child actor)
   ever starts. AC5.1 scopes the capture to what a **check** opens at test
   time, not npm's own internals. Measured: of 2,263,596 raw lines,
   569,622 (25%) were install-phase and excluded.
2. **`node_modules/` reads excluded.** 595,783 lines (26%) — dependency-tree
   reads are the same churn for every package on every install; not a
   repo-tracked coupling this pin needs to express.
3. **The probe's own file excluded.** `tools/cff-p0-read-graph-probe.mjs`
   itself is loaded by every spawned Node process via `NODE_OPTIONS`
   (314 lines, 0.01%) — an artifact of *how* the observation happened,
   never a production coupling. It does not exist on any branch but the
   now-deleted scratch branch.
4. **992,153 lines (44%) were "external"** — paths outside the repository
   checkout (Node's own built-in modules resolved to `node:`-prefixed
   specifiers with no on-disk file, the global npm cache, Windows temp
   directories not matching a package's own materialization, etc.) —
   excluded because they are not repo-tracked paths the pin can express a
   coupling to.
5. **1,704 lines (0.08%) were unattributed** — reads by the outer
   `scripts/foreman-line-ci.mjs`/`scripts/ci-reuse.mjs` orchestrator process
   itself (`cwd` = repo root, not inside any package directory) — these are
   the runner's own reads of its own source, not a package's check-time
   read, and are out of scope for a package-keyed pin.

**What's kept: 104,020 check-time edges** (every remaining fs read, CJS
`require`, and ESM `resolve`/`load`), collapsed to **3,044 distinct
(package, repo-relative-path) pairs across all 30 packages** — this is
`fixtures/ci-pass-raw.json`, and it is the **single capture** both AC5
projections below are derived from (never a second sweep).

**Why the raw `.jsonl` itself is not a fixture:** committing 810MB of raw
per-pid capture is neither reviewable nor git-appropriate, and the schema's
Allowed Files do not include it. `fixtures/ci-pass-raw.json` keeps every
distinct (package, path) edge the raw capture proved — nothing is
summarized away beyond exact duplicates (the same path opened thousands of
times by the same package collapses to one entry; over-approximation-only
means proving an edge once is sufficient, proving it twice adds nothing).
The run artifacts themselves (`read-graph-raw-capture-shard-{0,1,2,3}`)
remain downloadable from run `37768165017` for 90 days (GitHub Actions
artifact retention) as the underlying evidence, per ruling condition 4.

## Projection 1 — C9 `READER_SET` delta

Applying the **existing, unmodified** `classifyPath` (imported from
`scripts/ci-reuse.mjs`, never reimplemented — D2) to every path in
`fixtures/ci-pass-raw.json` surfaced **five previously-unrecorded reads of
paths that currently classify `ordinary_documentation`**:

| path | classified | read by (measured) |
|---|---|---|
| `plugins/foreman-line/docs/goals/w4-closeout/charter.md` | `ordinary_documentation` | `ops-console` (`tests/live-goal.test.ts`) |
| `plugins/foreman-line/docs/goals/w4-closeout/loop-directive.md` | `ordinary_documentation` | `ops-console` (`tests/live-goal.test.ts`) |
| `plugins/foreman-line/docs/goals/pi-model-configuration/charter.md` | `ordinary_documentation` | `routing-policy` (`tests/host-settings-proposal.test.ts`) |
| `plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p1-fallback-contract-2026-09-26.md` | `ordinary_documentation` | `routing-policy` (`tests/legacy-cutover.test.ts`) |
| `plugins/foreman-line/docs/goals/pi-model-configuration/a54-ratification-2026-09-26.md` | `ordinary_documentation` | `routing-policy` (`tests/host-settings-proposal.test.ts`) |

Each is reproducible from source: `plugins/foreman-line/ops-console/tests/live-goal.test.ts:35`
(`scanGoal(config, 'w4-closeout')` resolves and reads
`docs/goals/w4-closeout/loop-directive.md`, asserted directly in the test's
own comment); `plugins/foreman-line/routing-policy/tests/legacy-cutover.test.ts:507,531-534`
and `plugins/foreman-line/routing-policy/tests/host-settings-proposal.test.ts:34,261`
(`readFileSync`/`existsSync` against `foremanRoot`-joined `docs/goals/pi-model-configuration/*`
paths).

**This is a genuine measured finding, not asserted.** The prior session's
static re-proof (`cff-p0-c9-reproof.md`, AC6) only re-examined the
post-CI-P2 cohort's previously-known coupling (`kernel-import`,
`ops-console`'s materialized-temp-repo coupling, `project-scaffold`) via
targeted grep; it did not have (and could not have had, being static) visibility into `ops-console`'s
*separate* `live-goal.test.ts` coupling to `w4-closeout`, or
`routing-policy`'s coupling to `pi-model-configuration`. The instrumented
pass finds what static analysis misses — exactly the reason this vehicle
exists.

**Per AC6.2, this SHRINKS the ordinary-documentation set — the safe
direction.** `scripts/ci-reuse.mjs`'s `READER_SET` (currently 25 entries,
re-counted at measurement time from the frozen array) does not yet include
these five paths. **Routing (D10, Out of Scope):** installing this
exclusion is **out of scope for CFF-P0** — "No installation of the
read-graph pin into code" and "no edits to `scripts/**`" are both explicit.
This parcel **records** the finding in `read-graph.json`'s
`projections.reader_set_delta`; the runner-touching parcel's Stage-F
bookkeeping (same routing as fallback loudness and waiver-pin staleness)
owns the actual `READER_SET` edit.

## Projection 2 — D7 affection pin

For every package, `fixtures/ci-pass-raw.json`'s paths are split into
"own" (under `plugins/foreman-line/<package>/`, case-insensitive) and
"external" (everything else) — the external set is the affection pin:
paths outside a package's own directory that its checks are measured
reading, over-approximation-only. **28 of 30 packages** have at least one
external edge; `jev-decisions` and `schema-scaffold` have none (measured,
not assumed — `jev-decisions`'s `PATHS` allowlist is in-memory only, per
the pre-existing `ci-p2-review-findings-2026-09-30.md` finding B-P4, now
independently reconfirmed by live execution rather than grep).

Representative edges, by coupling kind (the spec's own taxonomy, AC5.1):

- **Imports (sibling source, the AC4-barrier case):** `contract-readers`
  (321 external paths — it imports every other package's `src/` as a
  cross-package contract-compliance surface), `bypass-outage-harness`
  importing `approval`/`contracts`/`dispatch`/`routing-policy`/etc. `src/`
  files directly.
- **Fixture path strings / generation targets:** `kernel-import` reading
  `kernel-contracts/tests/fixtures/golden-vectors.json` and
  `kernel-state/migrations/000{1..4}-*.sql`.
- **Materialized temp-repo reads:** `schema-scaffold`'s
  `tests/test-scaffold.test.ts` materializes and reads
  `%TEMP%/test-scaffold-test-<rand>/{package.json,alpha.schema.json}` — a
  real temp directory, outside the repo tree entirely, so it does **not**
  appear as a repo-path edge in the pin (the schema can only express
  repo-tracked couplings), but it is the textbook example the spec names;
  recorded here for the narrative, not as a pin entry.
- **Cross-package audit materialization (non-import, same class):**
  `verification/src/d19-audit.ts` `statSync`s
  `%TEMP%/pmc-owner-audit-<rand>/{approval,authority-registry,...}` — a
  materialized copy tree named after every OTHER package; same
  outside-the-repo-tree non-pin-entry case as above, recorded for the
  narrative.
- **Negative-path probe (own-package, not a cross-package edge):**
  `authority-registry/tests/corpus-sweep.test.ts` `lstatSync`s a literal
  sentinel `<repo-root>/fake` (does not exist) — a deliberate dangling-entry
  test of `discoverPackages`' R10 contract. Harmless, not an affection edge.
  Shown here so a reviewer who notices `"fake"` in `read-graph.json`'s
  `packages.authority-registry` array understands its origin rather than
  mistaking it for capture noise.
- **Live specs/receipts (already non-ordinary, no classification impact):**
  `ops-console` reads `docs/specs/active/*.md` (already `specifications`
  class, unaffected by this projection) and root-level
  `docs/receipts/<uuid>/*.json` from a live receipt chain fixture.

The full per-package external list is `read-graph.json`'s
`projections.affection_pin`; nothing here is asserted without a
corresponding entry traceable to `fixtures/ci-pass-raw.json`.

## Named variance edges (R15)

**None named this session.** R15 defines a variance edge as one proven
under only one environment. Only the primary pinned environment
(`windows-latest`/Node `24.19.0`) was captured; the coordinator-ratified
supplementary pass (AC5.3, the developer's Windows machine) did not run —
**named pending input**, not fabricated, not silently substituted with this
Linux session or any other host. `fixtures/dev-pass-raw.json` is
**intentionally not created**. When that pass eventually runs, any edge it
proves beyond this capture becomes a variance edge appended to
`read-graph.json`'s `named_variance_edges` — it will never become a second
pin or a second projection set (AC5.1's "never two read sweeps").

## AC5.6 — classification safety property (re-verified against the real artifact paths)

```
node -e "
import('./scripts/ci-reuse.mjs').then(m => {
  console.log(m.classifyPath('plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/read-graph.json'));
  console.log(m.classifyPath('plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/fixtures/ci-pass-raw.json'));
  console.log(m.classifyPath('plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/measurement-log.md'));
  console.log(m.classifyPath('plugins/foreman-line/docs/goals/ci-fail-fast/cff-p0-sweep-anatomy.md'));
});
"
```
Measured: `code`, `code`, `ordinary_documentation`, `ordinary_documentation`.
Confirmed: the JSON artifacts (`read-graph.json`, both fixtures) classify
`code` — any future edit to the pin forces a full sweep, the safe
direction — while the Markdown narrative classifies
`ordinary_documentation`. The pin's protection comes from the JSON, not
the prose, exactly as AC5.6 states.

## Criticality grading (AC5.7, restated against this capture)

- **CFF-P1 consumes this pin fail-safe.** An over-report (an edge this pin
  names that a finer measurement would not) only mis-orders shard latency —
  a package runs slightly out of its ideal position, never silently
  skipped.
- **CFF-P2 consumes this pin fail-open under under-report.** Its exclusion
  rule is **monotone**: a package runs unless this pin positively covers an
  edge proving it can be excluded. Absence of an edge here can never exclude
  a package — structural, not merely asserted (the schema has no field that
  could express a negative/exclusion claim).

## Staleness honesty (AC5.7)

Per D10, this pin's maintenance owner is the runner-touching parcel's
Stage-F bookkeeping; the trigger is any parcel touching the runner, the
swept set, or the check surfaces; the runtime drift check is CFF-P3's
gate-job re-derive-and-compare (FK-P17 pattern). This parcel installs none
of that machinery.

## Vehicle teardown (ruling condition 6)

```
git push origin --delete measure/cff-p0-read-graph
git branch -D measure/cff-p0-read-graph
```
**This session's two vehicle commits, in order:**
`6388486a60d1b25e2e11cba65c1f58bf7fb81cd5` (the first, shard-0-crashing
commit) then `2d81d9264ba69df92e96fe331b227cc103eb3e8a` (the stream-dedupe
fix). Capture-of-record run ID: `37768165017` (superseding the
shard-0-crashed `37764594545`), built from `2d81d9264ba69df92e96fe331b227cc103eb3e8a`.

**Actual final branch SHA at deletion: `8b49202a0f3c9c04a2f1e77e59bc1a1b601b57f4`
— one commit ahead of this session's vehicle work.** Between this session's
last push to the scratch branch and its deletion, an unrelated commit
(`docs(specs): hygiene sync — drop stale active/ duplicates, regenerate
INDEX (done/ authority)`) landed on `origin/measure/cff-p0-read-graph`,
authored by a different, concurrent process in this shared repository (the
same commit message pattern appears independently elsewhere in this
repo's history — e.g. `032f8a4a`, `4d845ff8` — confirming it is a routine
repo-wide hygiene sync unrelated to this vehicle, not something this session
produced or requested). It touched only `plugins/foreman-line/docs/specs/**`
— none of the two vehicle files, and nothing this vehicle measured. Recorded
here for honesty rather than silently reporting the SHA this session
expected; the branch was still deleted per ruling condition 6 regardless
(a scratch branch dies with the ruling, including whatever unrelated commit
happened to land on it in the interim). Both capture runs' artifacts remain
downloadable from the Actions UI for 90 days independent of the branch's
existence (GitHub retains workflow runs and their artifacts by run ID, not
by branch ref).

---

## Prior session's investigation (preserved — the loop-stop this ruling resolves)

**Prior session's host:** `linux` (kernel `7.2.5-3-omarchy`), Node
`v26.8.2`, worktree HEAD `f9788222c9b18087600d2a247dce1005af2c7943`.

Investigated, in order:

1. **Does the existing runner already carry an instrumentation hook (env
   var, loader flag) this parcel could use read-only?**
   ```
   grep -n "process\.env" scripts/foreman-line-ci.mjs scripts/ci-reuse.mjs
   ```
   Measured: the only `process.env` references in either file are the
   ordinary CLI environment-injection seam, not an instrumentation hook. No
   built-in capture mechanism exists.
2. **Does the pinned workflow pass any env var or flag into the shard
   invocation that could carry instrumentation without editing the workflow
   file?** Read `.github/workflows/foreman-line-ci.yml` in full: no
   `NODE_OPTIONS`, no `env:` block carrying a loader path, no
   `workflow_dispatch` with inputs. No way to inject instrumentation without
   editing the workflow YAML, which this parcel alone may not do.
3. **Is a true `windows-latest` host reachable any other way?**
   `gh api repos/m0r6aN/agent-skills/actions/runners` → `{"total_count":0}` —
   no self-hosted runners.
4. **Could a Linux-local run stand in, labeled as a variance edge?** No —
   Linux is not a sanctioned environment for this measurement; that would be
   exactly the "silent host substitution" the Hard stop conditions forbid.

**This session's ruling resolves exactly this gap**: a scratch, non-merging
vehicle branch that can run the real pinned environment without the parcel
itself ever touching `.github/workflows/foreman-line-ci.yml`.
