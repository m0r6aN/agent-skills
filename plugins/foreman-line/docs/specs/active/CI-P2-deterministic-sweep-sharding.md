---
ticket: CI-P2
title: Deterministic full-sweep sharding
status: active
owner: clinton.morgan
created: 2026-09-30
updated: 2026-09-30
risk: elevated
surfaces: [.github/workflows/foreman-line-ci.yml, scripts/foreman-line-ci.mjs, scripts/foreman-line-ci.test.mjs, plugins/foreman-line/docs/specs/active/CI-P2-deterministic-sweep-sharding.md]
routing_class: architecture/risk
permission_profile: builder-architecture
---

# CI-P2 — Deterministic Full-Sweep Sharding

## Intent

Cut the full package sweep's elapsed wall time by distributing it across a bounded matrix of shard jobs while preserving merge-gate integrity and complete package coverage: every eligible package is discovered dynamically (no frozen list), assigned deterministically to exactly one shard, executed with its full install plus `test`/`typecheck`/`lint`, and reconciled at aggregation before one verdict reports through the required contexts `test` and `integration-report`. CI-P2 builds on the merged CI-P1 line (charter Sequence) and closes by proving CI-P1's docs-only reuse behavior survives the sharded workflow unchanged.

## Constraints

- **Sequencing and dependency.** CI-P2 is built and merged only after CI-P1 lands on the goal line and is rebased onto it (charter "Sequence and Closure"; loop-directive queue steps 1–3). CI-P1 owns `scripts/ci-reuse.mjs`; CI-P2 consumes its CLI read-only. A needed change in that file is a stop-and-report (spec amendment), never a silent edit.
- **Shared interface (CI-P1 ↔ CI-P2), byte-consistent across both specs.** These five strings are a frozen contract; both parcel specs state them identically and neither may paraphrase:
  1. Evidence record (emitted to the job log and `GITHUB_STEP_SUMMARY` on every run): `decision: reuse|fallback`, `base_sha`, `head_sha`, `input_hashes: { code, specifications, workflow, dependency_inputs, merge_context }`, `source_run: { run_id, conclusion, input_hashes }|null`, `fallback_reason: string|null`.
  2. Classification: closed-world, default-deny. Enumerated path sets; unknown paths are test-relevant. `docs/specs/**` is the `specifications` class (test-relevant). Ordinary-documentation set defined conservatively: only paths that provably feed no check of this workflow.
  3. Required contexts: `test` and `integration-report` both report on EVERY head in EVERY mode (validated, reused, fallback); CI-P2's single aggregation verdict surfaces through `test`, `integration-report` mirrors it (exactly today's relationship).
  4. Workflow permissions: `.github/workflows/foreman-line-ci.yml` gains `actions: read` (today's `permissions: contents: read` makes the Actions-API evidence lookup 403 — F2).
  5. Comparison methodology: queue-separated (job `startedAt→completedAt` = run time; run created→updated reported separately); runner minutes = Σ job durations, windows-latest 2× multiplier stated.
- **Pre-shard decision seam (agreed with the CI-P1 shaping session).** `node scripts/ci-reuse.mjs decide` is the sole reuse-decision point and completes before any shard work; its outputs are `decision: reuse|fallback`, `fallback_reason` (string, or empty → `null`), `head_sha`, `base_sha`, and `evidence_record` (the full record as single-line JSON, ready for verbatim re-emission). On `decision: reuse`, `node scripts/ci-reuse.mjs verify` re-verifies equivalence and on failure emits `decision: fallback`. CI-P2 runs decide (and verify when applicable) in ONE pre-shard gate job and gates the shard matrix on the **effective** `decision == 'fallback'`; every non-reuse outcome — including a verify flip — therefore runs the full sharded sweep. The gate invokes `verify` WITHOUT a sweep source (CI-P1's `verify`-invokes-full-sweep behavior belongs to its `test` job and is never wired here): a verify flip in the gate emits `decision: fallback` and exits 0, and the shard matrix is the single fallback branch — no hidden non-matrix sweep anywhere. Output names (`decision`, `fallback_reason`, `head_sha`, `base_sha`, `evidence_record`) are a cross-parcel coordination stop: deviation voids the gate wiring. Uncertainty maps to `fallback`, never crash-green. CI-P2 re-emits the record from `evidence_record` — never from log scraping.
- **Required contexts are job-name contract.** Ruleset `main-pr-gate` (id 22369510, strict, `~DEFAULT_BRANCH`) requires both `test` and `integration-report`. Nothing here renames, drops, or path-filters either context; both report on every head in every mode.
- **Runner environment unchanged.** `windows-latest`, Node `24.19.0`, `git config --global core.autocrlf false`, `actions/checkout@v6` with `persist-credentials: false`, `fetch-depth: 0`; npm invoked as `process.execPath + npm-cli.js`, `shell: false` (explicit Node/npm without a shell is a security property, not incidental).
- **Process boundary.** Importing or testing the runner must never launch npm; every spawn is injected in tests (existing runner contract, preserved).
- **Standing constraints** (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`) apply by reference; of particular force: #3 (one test per structural invariant of a default-deny gate), #12 (never pin incidental behavior), #13 (waivers pin identity + location + value).
- **Classification consumption (shrink-only).** CI-P2 consumes CI-P1's classification unchanged, but expanded discovery can only SHRINK the ordinary-documentation set: newly swept packages add test-relevant doc inputs (measured: `authority-registry`'s corpus-sweep tests read `plugins/foreman-line/docs/goals/foreman-kernel/{charter,plan-review-findings,loop-directive}.md`, `docs/SPEC-CONVENTION.md`, `docs/COORDINATOR-PATTERN.md`, `docs/kickstarters/STANDING-CONSTRAINTS.md`, `docs/FOREMAN-LINE-PLAN.md`, `docs/transcripts/defects_lessons.md`). The set is shrink-only until re-derived under CI-P1's classification contract and re-reviewed.
- **PR #122 and developer WIP (loop-directive protocol).** Parcel work never absorbs PR #122's commits; if it merges mid-parcel, rebase and adapt — landed developer code is ground truth. The uncommitted failure-capture work on `scripts/foreman-line-ci.{mjs,test.mjs}` is developer-owned: not landed, not dropped, not implemented here; if it has landed by build time its behavior is preserved in the rewrite (F8).

## Allowed Files

- `.github/workflows/foreman-line-ci.yml`
- `scripts/foreman-line-ci.mjs`
- `scripts/foreman-line-ci.test.mjs`
- `plugins/foreman-line/docs/specs/active/CI-P2-deterministic-sweep-sharding.md`

No new files are created: shard outcomes travel as workflow artifacts, and `scripts/ci-reuse.mjs` is CI-P1-owned (read-only here). Any implementation need outside this list stops work for a ratified spec amendment.

**A2 placement 7 (Allowed Files widening, SPEC-CONVENTION §4.8 amendment):** `scripts/ci-reuse.mjs` and `scripts/ci-reuse.test.mjs` join this spec's Allowed Files, scoped to the classification shrink ONLY (the C9 ordinary-set re-derivation, its reader-set exclusions, and their regression fixtures — no decision-core, evidence-chain, or CLI changes). The measured re-derivation inventory (every reader path found among ALL checks of the newly-swept packages — tests AND sources, module-load reads included) lands as `READER_SET` exclusions, each pinned by a regression fixture per SC #13 (basename + location + value), grow-only. Rationale: this parcel's closure clause is false while the classifier exempts paths the expanded swept set reads; the widening is scoped and dies with this parcel.

## Acceptance Criteria

### AC1 — Eligibility contract, dynamic discovery, and the measured pre-flight (charter AC1; F4)

**Eligibility rule (closed-world exclusions, open membership).** Discovery returns the code-point-sorted list of every direct child `plugins/foreman-line/<dir>/` that contains a parseable JSON `package.json`, EXCEPT dependency directories. The exclusion set is exactly: directories named `node_modules` at any depth, and vendored/dependency trees. Nothing else excludes a directory: a new `<dir>` with a manifest is discovered automatically (this is what dissolves the frozen-list churn — `hybrid-routing`'s deletion and `kernel-import`'s arrival become non-events), and a directory without a manifest is simply not a package. A `package.json` that exists but fails to parse is a **discovery error** and fails the gate — never a silent skip. Measured at the working tree (2026-09-30): zero `node_modules` children at the `plugins/foreman-line/*` level (each package's `node_modules` sits one level deeper, structurally unreachable by the one-level rule) and zero vendored trees.

**Expected-skip set is EMPTY.** No discovered package may be excluded from execution by the shipped design. If the pre-flight finds a baseline-red package, the developer may decide fix-in-scope or a pinned exclusion; any exclusion is a ratified spec amendment and MUST satisfy standing constraint #13 (identity = package dir name, location = `plugins/foreman-line/<dir>/package.json`, value = the exact failing check and its recorded failure signature), with one refusal test per axis.

**A2 placement 9 (waived-exclusion set — ratified 2026-10-01, SC #13 three-axis pinned):** the expected-skip set is amended from EMPTY to exactly the four entries below — the packages measured baseline-red at pre-flight (`190dfbe`, node 24.7.0 AND 24.19.0, each reproduced twice with identical signatures). Each entry pins identity + location + value:

| identity | location | value (deterministic signature markers, measured 2026-10-01) |
| --- | --- | --- |
| `authority-registry` | `plugins/foreman-line/authority-registry/` | `R31 reviewed source mapping drift: M02-note` + 29 semantic failures (check: test) |
| `bypass-outage-harness` | `plugins/foreman-line/bypass-outage-harness/` | `FK-P17-bypass-outage-matrix.md` ENOENT + `mutationScope` TS2353 + `CTL-01/02 CHANNEL_EXEC_FAILED` (checks: test, typecheck) |
| `jev-decisions` | `plugins/foreman-line/jev-decisions/` | 6× `LEGACY_EXECUTION_RETIRED` (check: test) |
| `kernel-lease` | `plugins/foreman-line/kernel-lease/` | `STORAGE_CONSTRAINT_VIOLATION foreign-key 'goals'` at `kernel-state` insertGoal + 32 biome errors (checks: test, lint) |

**Semantics (load-bearing):** an entry waives EXACTLY its pinned value, verified at check time — the package's checks still RUN and the waiver applies only when the failing output contains the pinned markers (run-then-waive; never an unconditional skip). A package wearing the same name at the same location whose output does NOT contain the pinned markers (including a green pass, and including a DIFFERENT red) re-gates immediately and normally — a changed red surfaces to its owning line instead of hiding behind the waiver. **Three refusal tests bind the axes independently:** same identity + different location ⇒ not excluded; different identity + same location ⇒ not excluded; same identity + same location + non-matching value ⇒ not excluded. **Expiry:** a dead entry (markers no longer matching) is removed by the next runner-touching parcel's Stage-F bookkeeping. The aggregation's expected-skip check binds exactly this set — any waived or skipped package outside it fails the gate (AC5 "unexpected skips"). **Follow-ups (owning lines):** `authority-registry` (R31 mapping drift + 29 semantic failures), `bypass-outage-harness` (missing FK-P17 spec + mutationScope typing + CTL gates), `kernel-lease` (FK constraint + biome) → foreman-kernel line; `jev-decisions` (6× legacy-execution-retired) → JEV line.

**Measured inventory and 19/20/27 reconciliation (measured 2026-09-30, `D:/Repos/agent-skills`; commands: `git ls-files "plugins/foreman-line/*/package.json"`, `git show <ref>:scripts/foreman-line-ci.mjs` frozen `Object.freeze([...])` list, glob `plugins/foreman-line/*/package.json`, per-manifest `scripts` key read — no npm run).** Every manifest measured (all 29 working-tree ones plus `hybrid-routing` at `origin/main`) defines `test`, `typecheck`, and `lint`.

| Package dir | dev frozen-19 | main frozen-20 | tracked @ origin/main | tracked @ origin/dev | tracked @ HEAD | worktree | extra scripts (beyond test/typecheck/lint) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| approval | yes | yes | yes | yes | yes | yes | — |
| authority-registry | no | no | yes | yes | yes | yes | generate, test:all-in-one, test:file |
| bypass-outage-harness | no | no | yes | yes | yes | yes | matrix, measure |
| contract-readers | yes | yes | yes | yes | yes | yes | generate |
| contracts | yes | yes | yes | yes | yes | yes | generate |
| dispatch | yes | yes | yes | yes | yes | yes | — |
| foreman-config | yes | yes | yes | yes | yes | yes | generate |
| hybrid-routing | no | yes | yes | no | no | no (deleted) | (typecheck/test/lint only @ origin/main) |
| integration | yes | yes | yes | yes | yes | yes | report |
| jev-decisions | no | no | yes | yes | yes | yes | — |
| kernel-contracts | no | no | yes | yes | yes | yes | generate |
| kernel-import | no | no | no | no | yes | yes | — |
| kernel-lease | no | no | yes | yes | yes | yes | measure-contention |
| kernel-state | no | no | yes | yes | yes | yes | — |
| mutation-scope-guard | yes | yes | yes | yes | yes | yes | — |
| ops-console | no | no | no | no | no | yes (untracked) | start |
| permission-profiles | yes | yes | yes | yes | yes | yes | generate |
| project-scaffold | no | no | no | no | no | yes (untracked) | — |
| projection | yes | yes | yes | yes | yes | yes | — |
| receipts | yes | yes | yes | yes | yes | yes | generate |
| registration | yes | yes | yes | yes | yes | yes | — |
| role-authority | yes | yes | yes | yes | yes | yes | generate, generate:instances |
| routing-policy | yes | yes | yes | yes | yes | yes | generate |
| schema-scaffold | yes | yes | yes | yes | yes | yes | — |
| shaping | yes | yes | yes | yes | yes | yes | — |
| skill-injection | yes | yes | yes | yes | yes | yes | generate |
| spec-body-compiler | no | no | yes | yes | yes | yes | — |
| spec-linter | yes | yes | yes | yes | yes | yes | generate |
| verification | yes | yes | yes | yes | yes | yes | — |
| worker-envelopes | yes | yes | yes | yes | yes | yes | generate |
| **counts** | **19** | **20** | **27** | **26** | **27** | **29** | |

**Reconciliation.** 19 = `origin/dev`'s frozen sweep list in `scripts/foreman-line-ci.mjs`. 20 = `origin/main`'s frozen list = the same 19 plus `hybrid-routing` (a package that exists only at `origin/main`, deleted on the dev line). 27 = the tracked `plugins/foreman-line/*/package.json` count — true at both `origin/main` (frozen 20 + authority-registry, bypass-outage-harness, jev-decisions, kernel-contracts, kernel-lease, kernel-state, spec-body-compiler) and HEAD `83d57da` (frozen 19 + those 7 + `kernel-import`, with `hybrid-routing` deleted). The working tree adds two untracked dirs (`ops-console`, `project-scaffold`) = 29; `origin/dev` lacks `kernel-import` = 26. The frozen lists are strict subsets of the tracked manifests: the 7–8 tracked-but-unswept packages ALL define `test`/`typecheck`/`lint`, so under this rule the gate EXPANDS from 19/20 to every tracked manifest at the checkout (27 at the pinned base `origin/main`) — literally what "complete package coverage" mandates (F4). Discovery is per-checkout, so PR #122's membership changes resolve themselves.

**Pre-flight procedure (builder Step 0, in the disposable worktree cut from `origin/main` @ the recorded cut-SHA).** Before any code change:

1. Run the shipped discovery rule over the checkout; record the discovered list and each manifest's `scripts` keys (the table above, re-measured at the base).
2. In deterministic sorted order, for EVERY discovered package run exactly one full pass: `npm ci --ignore-scripts --no-audit --no-fund`, then `npm run test --ignore-scripts`, `npm run typecheck --ignore-scripts`, `npm run lint --ignore-scripts` — no other scripts (coverage is preserved exactly, see AC4).
3. Record the measured table: package × {install, test, typecheck, lint} → status. This table is also the equal-coverage serial baseline for AC6.
4. **Valve (loop-directive stop condition):** if ANY discovered package is baseline-red, STOP AND REPORT with the measured table — never paper over a red base. The developer decides fix-in-scope vs a #13-conform pinned exclusion (which lands as a ratified amendment before implementation continues). Recorded tap artifacts in the working tree (`plugins/foreman-line/authority-registry/si-tap.txt`, `w2-corpus-sweep-tap.txt`) show historical test failures in newly-eligible packages, so a red discovery is plausible; the valve is live, not ceremonial.

**A3 baseline (A2 placement 5):** CI-P2's shrink-only re-derivation of the ordinary-documentation set starts from A3's shape-level rules (Markdown-only; never inside `plugins/foreman-line/**` or `skills/**`; reader-set exclusions per measured read-sweep), not from CI-P1's pre-A3 table. The pre-flight's expanded swept set (e.g. `authority-registry` reads goal docs and kickstarter content) shrinks the set further; every newly-found reader path becomes a regression fixture in CI-P1's classifier tests (shrink-only, C9).

### AC2 — Deterministic bounded sharding (charter AC2)

Shard layout is computed by a pure function `assignShards(orderedNames, shardCount)` over the discovery-ordered list:

- **Order.** `discoverPackages` returns package dir names sorted ascending in JS string code-point order (the natural `Array.prototype.sort` order on names); names are unique by construction.
- **Assignment.** Package at sorted index `i` is assigned to shard `i mod shardCount` (round-robin). The function is pure — no filesystem, clock, env, or randomness — so the same (ordered list, shard count) always yields the same layout and the assignment is testable locally without a workflow run.
- **Exactly one shard.** Every discovered package appears in exactly one shard: the shard lists form a partition of the input (pairwise disjoint; union equals the input; per-shard sizes differ by at most 1).
- **Bound.** `shardCount` is an integer in `[1, 4]` (BOUND: ≤ 4). Out-of-range, non-integer, duplicate names, or unsorted input are refused with the runner's typed error — never clamped, never silently reordered (default-deny). The workflow pins `shardCount` as an explicit constant (default 4 at build; the builder may pin lower after the AC6 cost measurement, never higher).

### AC3 — Shard-results seam and reconciliation (charter AC3; plan-review missing-work #5)

**Seam (pinned working assumption).** Each shard job writes one normalized outcomes JSON and uploads it as a workflow artifact named `shard-outcomes-<shard_index>` containing `shard-outcomes.json`:

```json
{
  "schema": "foreman-line-ci/shard-outcomes@1",
  "shard_index": 0,
  "shard_count": 4,
  "head_sha": "<sha>",
  "packages": [
    { "name": "approval",
      "checks": { "ci": "pass", "test": "pass", "typecheck": "pass", "lint": "pass" } }
  ]
}
```

Status values: `pass | fail | error | skipped`. The `checks` shape preserves today's outcome fields (`ci`, `test`, `typecheck`, `lint`) exactly.

**Aggregation reconciles discovered vs executed** (the aggregation job re-runs `discoverPackages` and `assignShards` on the same checkout and compares):

1. **Artifact set complete** — exactly `shard_count` artifacts with valid unique indices covering `0..shard_count-1`; a missing artifact (including a cancelled shard job) is a failure.
2. **Assignment re-derivation** — each artifact's package set must equal `assignShards(discovered, shard_count)[shard_index]` exactly (catches drift between shards' layouts).
3. **Omissions** — every discovered package must appear in exactly one artifact; any unexecuted discovered package fails.
4. **Duplicates** — a package appearing twice (across artifacts or within one) fails.
5. **Foreign identities** — a package in an artifact that is not in the discovered set fails.
6. **Unexpected skips fail** — any `skipped` status with an empty expected-skip set fails; a failed install (`ci: fail`) records its package's checks as `skipped`, which fails here while the `ci` field attributes the real cause.
7. **Shard failures** — any `fail`/`error` check fails the verdict; check entries missing for an executed package fail.
8. **Discovery errors** (unparseable manifest, unreadable tree) fail the verdict.

### AC4 — Execution: per-shard install barrier and exactly-preserved checks (charter AC4)

- **Shard jobs run in a matrix** (`sweep`, `needs: <gate>`, gated on the effective `decision == 'fallback'`), one job per shard, each on `windows-latest`.
- **Per-shard full dependency install is accepted initially** (charter AC4): each shard installs dependencies for ALL discovered packages (`npm ci --ignore-scripts --no-audit --no-fund` per package), then runs checks only for its own assigned packages.
- **The barrier is preserved per shard.** Today's barrier ("Relative sibling imports require every install to succeed before any check", `scripts/foreman-line-ci.mjs`) holds within each shard: every install completes before any check in that shard. Justification, measured 2026-09-30: a scan of relative cross-package imports across `plugins/foreman-line/*/*.{ts,mjs,js,tsx,mts}` finds **222 unique cross-package import edges** (e.g. `dispatch` imports sources of 9 siblings incl. `receipts`, `routing-policy`, `approval`, `contracts`, `skill-injection`, `mutation-scope-guard`, `permission-profiles`, `foreman-config`, `registration`; `verification` 5; `registration` 5; `integration` 4; `approval` 4). A consumer's checks load sibling SOURCE (`../../<sibling>/src/index.js`), and those sources resolve their third-party imports from the sibling's own `node_modules` — so a check of package A requires sibling B's install to have succeeded even when B sits in another shard. The relaxation (shard-local installs) is therefore rejected on the measured inventory; a dependency-closure install is a named future optimization only (Out of Scope).
- **Test/typecheck/lint coverage preserved exactly.** Every discovered package runs exactly `npm run test --ignore-scripts`, `npm run typecheck --ignore-scripts`, `npm run lint --ignore-scripts` — the check set is unchanged (no `generate`, `matrix`, `measure`, `start`, `report`, `test:all-in-one`, `test:file`, `measure-contention`, `generate:instances` is added or dropped) while membership expands per AC1.

### AC5 — Single aggregation verdict through the required contexts (charter AC5; F3)

One aggregation verdict — computed by the aggregation step of the `test` job from AC3's reconciliation — surfaces through the `test` context; `integration-report` mirrors `needs.test.result` exactly as today. Both contexts report on EVERY head in EVERY mode (validated, reused, fallback), satisfying ruleset `main-pr-gate` under its strict policy. The verdict fails on: discovery errors, missing coverage (omission, duplicate, missing artifact), shard failures (`fail`/`error` checks), cancellations (a cancelled shard leaves no complete artifact → fail; if `test` itself is cancelled its conclusion is non-success → the strict gate stays closed), and unexpected skips (empty expected-skip set). A reused head reports through the same two contexts with a passing verdict derived from the evidence record (AC7) — the context set never shrinks with the matrix.

### AC6 — Queue-separated measurement with explicit cost acceptance (charter AC6; F5)

**Methodology (shared string, also used by CI-P1):** queue-separated (job `startedAt→completedAt` = run time; run created→updated reported separately); runner minutes = Σ job durations, windows-latest 2× multiplier stated.

- **Elapsed sweep wall time** = `max(job completedAt) − min(job startedAt)` over the sweep-phase jobs (all shard jobs plus the aggregation job), from Actions-API timestamps. Baseline equivalent: the single `test` job's `startedAt→completedAt` under the old workflow, and the AC1 pre-flight's serial full-sweep timing at the pinned base (the honest equal-coverage serial baseline). The recorded red-run spans (lint record: typical 250–450 s created→updated; run 36755880046 `test` 19:16:52Z→19:22:34Z ≈ 5.7 min with ≈73 min queue) are reference-only: failing runs measure install-only spans and queue-polluted spans prove nothing.
- **Direction (falsifiable):** elapsed sweep wall time MUST decrease at equal coverage (same discovered set × {test, typecheck, lint}). If it does not, AC6 fails and is reported — never tuned silently.
- **Runner minutes MAY rise** from per-shard installs (up to `shard_count` × the install phase; structurally capped by the ≤ 4 bound) but MUST be quantified (Σ job durations and the ×2 billable figure) and **explicitly accepted** in the completion report. Silent cost is a failure of this AC.
- **Comparison table format** (the completion report MUST carry exactly these rows):

| Metric | Baseline | CI-P2 sharded | Δ | Rule |
| --- | --- | --- | --- | --- |
| Coverage: discovered packages × checks executed | (recorded) | (recorded) | must be equal | precondition for every other row |
| Elapsed sweep wall time (min job `startedAt` → max job `completedAt`), min | | | | MUST decrease |
| Queue+run span (run created→updated), min | (reported separately) | (reported separately) | | never mixed into wall time |
| Runner minutes (Σ job durations), min | | | | MAY rise; MUST quantify + explicitly accept |
| Billable minutes (windows-latest ×2) | | | | as above |

### AC7 — Closure: CI-P1's reuse behavior survives the sharded workflow (charter Sequence/Closure)

1. **Short-circuit before shards.** The pre-shard gate job runs `ci-reuse.mjs decide` (and `verify` on reuse) before the matrix; the shard matrix is gated on the effective `decision == 'fallback'`. A reused `pull_request`-class run runs **zero shard jobs** (A1: `push`-class runs are never eligible and always run the full sharded sweep — the push-class duplicate of every PR head is a sharded canary) — demonstrated live by the run's job list (no `sweep` job instantiated), not merely by a passing verdict.
2. **Byte-shaped evidence record.** On every run — validated, reused, fallback — the `test` job emits the `evidence_record` verbatim (from the gate output, never log-scraped) to the job log and `GITHUB_STEP_SUMMARY`, with the shared field set unchanged (`decision`, `base_sha`, `head_sha`, `input_hashes: { code, specifications, workflow, dependency_inputs, merge_context }`, `source_run: { run_id, conclusion, input_hashes }|null`, `fallback_reason: string|null`).
3. **Fallback runs the full sharded sweep.** Every `decision: fallback` outcome — relevant change, failed/pending/unusable source run, evidence uncertainty, `event-class-ineligible (A1: any push-class run)`, or a `verify` re-verification flip — runs the complete sharded sweep and the AC3 reconciliation. No partial or degraded sweep path exists.
4. **Live demonstration on the sharded workflow** (three cases): (a) eligible docs-only reuse on a `pull_request`-class run atop a verified-green lineage (A1) — zero shard jobs, `decision: reuse`, `source_run` pointing at the verified run with matching `input_hashes`, both contexts green; (b) fallback push — full sharded sweep, `decision: fallback`, non-null `fallback_reason`, both contexts report; (c) falsifiable negative — tampered or stale evidence forces fallback (never reuse). (d) canary case (A1): the head's `push`-class duplicate runs the full sharded sweep with `fallback_reason: event-class-ineligible`, recorded in the closure evidence as expected canary behavior. Detection-only: GitHub's duplicate-context resolution for the two same-named runs on one head is undefined — a reused green can mask a canary red and vice versa (A-Q3); recorded beside every canary claim.

### AC8 — Harness rewrite: contract tests for the pure functions (plan-review missing-work #6)

`scripts/foreman-line-ci.test.mjs` is rewritten to pin contracts of the new pure functions (`discoverPackages`, `assignShards`, `reconcile`, and the per-shard executor `runShard`), against synthetic fixture trees (temp dirs with fabricated manifests) so tests stay independent of real repo state. Exactly which existing tests change, and why:

| Existing test (current name) | Disposition | Why |
| --- | --- | --- |
| `all 19 installs precede all 57 checks, using explicit Node/npm without a shell` | **Rewritten** into two tests: (a) per-shard barrier — all discovered installs precede any check *within the shard*, zero checks before the last install; (b) explicit Node/npm without a shell (assertion kept verbatim). | The frozen 19-list and the single global 76-call ordering pin incidental behavior (frozen membership + one serial ordering) — forbidden by standing constraint #12/#34; the per-shard barrier and the no-shell spawn are the real contracts. |
| `offline installs never retry online; failed install prevents every check` | **Retargeted.** Offline-no-retry semantics kept; "failed install prevents every check" becomes per-shard (a failed install stops that shard's checks; outcomes record `ci: fail` + `skipped` checks). | The barrier moved from global to per-shard (AC4); the anti-retry property is unchanged. |
| Per-check failure loop over `['test', 'typecheck', 'lint']` | **Kept, retargeted** to the per-shard entry point and a discovery fixture set. | Semantics (each check's failure recorded against its own check name) are a real contract; only the entry point and fixture source change. |
| Failure-detail table loop (exit code / signal / spawn error) | **Kept, retargeted.** | Failure classification contract unchanged. |
| `multiple failures are all retained rather than overwritten by later success` | **Kept, retargeted.** | Failure-accumulation contract unchanged. |
| `a failing check re-emits its complete captured stdout and stderr in a failure section` | **Kept.** | Failure-capture contract unchanged (and if the developer's failure-capture WIP has landed, its behavior is preserved — F8). |

New contract tests (one per structural invariant where the function is a default-deny gate — standing constraint #3):

- `discoverPackages`: finds every `plugins/foreman-line/*/package.json` in a fixture tree; excludes `node_modules` and vendored trees; output sorted code-point; dirs without a manifest excluded; unparseable manifest → typed discovery error (never skipped); result independent of filesystem enumeration order.
- `assignShards`: partition property (exactly one shard per package; union = input; disjoint); determinism (repeated calls and permuted pre-state yield identical layout); round-robin index math; sizes differ by ≤ 1; refuses `shardCount` ∉ `[1, 4]`, non-integer counts, duplicate names, unsorted input.
- `reconcile`: one failing-when-broken test per AC3 failure mode — omission, duplicate across shards, duplicate within shard, foreign identity, unexpected skip (expected-skip set empty), artifact count mismatch / missing artifact (cancellation), assignment drift, shard `fail`, shard `error`, missing check entries, discovery error — plus the happy path. Each test must flip to failure when its fixture dimension is broken (mutate-the-fixture discipline, standing constraint #11/#32).

### Charter → spec AC mapping (lesson #33 diff table)

| Charter clause | Spec AC | Change |
| --- | --- | --- |
| CI-P2 AC1 — discover eligible packages dynamically, excluding dependency directories | AC1 | strengthened: closed-world exclusion set enumerated, parse-failure = discovery error, empty expected-skip set, measured 19/20/27(+26/29) reconciliation table, live pre-flight valve with stop-and-report |
| CI-P2 AC2 — assign every discovered package to exactly one shard; deterministic ordering; bounded shard count | AC2 | strengthened: pure function signature, round-robin rule pinned, BOUND ≤ 4 with typed refusal, partition + determinism properties |
| CI-P2 AC3 — reconcile discovered and executed identities; detect omissions and duplicates | AC3 | strengthened: seam named (artifact `shard-outcomes-<i>` / schema `foreman-line-ci/shard-outcomes@1`), assignment re-derivation, foreign identities, skips, shard failures, cancellations, discovery errors |
| CI-P2 AC4 — preserve dependency installation and lint coverage; full install per shard acceptable initially | AC4 | strengthened: barrier preserved per shard and justified by the measured 222-edge sibling-import inventory; check set exactly {test, typecheck, lint} |
| CI-P2 AC5 — one final required check failing on discovery errors, missing coverage, shard failures, cancellations, unexpected skips | AC5 | strengthened per F3: single aggregation verdict through `test`, `integration-report` mirrors, both report every head in every mode; failure modes enumerated 1:1 with the charter list |
| CI-P2 AC6 — demonstrate shard execution and aggregation in live CI; compare elapsed time and runner minutes with the baseline | AC6 | strengthened per F5: queue-separated method, elapsed MUST decrease at equal coverage, runner minutes quantified and explicitly accepted, fixed comparison table format; live demo carried by AC7(4) |
| Charter Sequence/Closure — "CI-P2 must also prove CI-P1's reuse behavior remains valid under the sharded workflow" | AC7 | made explicit and falsifiable (zero shard jobs on reuse, byte-shaped record, fallback = full sweep, three-case live demo) |
| Invariant 1 — preserve PR-wide classification | Constraints + AC7 | CI-P1's classification consumed unchanged; ordinary-documentation set shrink-only until re-derived |
| Invariant 2 — reuse only on verified passing evidence | Constraints + AC7 | no reuse mechanism added by CI-P2; `verify` gate re-verifies at shard-decision time |
| Invariant 3 — missing/stale/incompatible/unverifiable evidence → normal validation | AC7(3) | fallback = full sharded sweep in every subcase |
| Invariant 4 — required-check identity + branch-protection compatibility | AC5 | contexts `test` + `integration-report` preserved as job names, strict ruleset `main-pr-gate` satisfied in every mode |
| Invariant 5 — elevated risk → two independent reviews | Constraints (process) | unchanged; coordinator-run per loop directive |
| Plan-review F4 (eligibility undefined; 19/20/27 churn) | AC1 | measured reconciliation + discovery rule + pre-flight valve |
| Plan-review F5 (AC6 unbounded, queue noise) | AC6 + AC2 | methodology, direction bound, cost acceptance, shard bound ≤ 4 |
| Plan-review F3 ("one final required check" vs two contexts) | AC5 | single verdict surfaced through both existing contexts |
| Plan-review missing-work #5 (shard transport seam) | AC3 | artifact-based seam pinned |
| Plan-review missing-work #6 (frozen-list cleanup + harness rewrite) | AC1 + AC8 | frozen list deleted (clean cutover); test rewrite enumerated |

## Out of Scope

- `.github/workflows/test-plugin-install.yml` and the skills library it validates — not the full-sweep surface (lint-record scope guard); its checks remain untouched and unre-sharded.
- CI-P1's classification and evidence internals beyond the shared interface and the `ci-reuse.mjs decide`/`verify` seam; `scripts/ci-reuse.mjs` itself (CI-P1-owned, read-only).
- Repo settings, rulesets, branch protection, bypass actors (stop-and-report); merging into `main` (human Gate 3).
- PR #122's commits and sibling PR #123's files (`u1-produce.yml`, `u1-verify.yml`, `.github/CODEOWNERS`).
- The developer's uncommitted failure-capture WIP: not landed, dropped, or reimplemented here (F8 protocol).
- Dependency-install optimization (cache reuse, dependency-closure installs, workspace hoisting), cross-shard result caching, and any runner/OS change — per-shard full install is the accepted initial cost (AC4).
- Changing the check set (adding `generate`/`matrix`/`measure`/etc. or dropping any of test/typecheck/lint) — coverage is preserved exactly (AC4).
- Fixing baseline-red packages — the developer's fix-vs-exclusion decision via the AC1 valve.
- Sharding `test-plugin-install.yml`'s jobs or any workflow outside `.github/workflows/foreman-line-ci.yml`.

## Context & References

- `plugins/foreman-line/docs/goals/ci-optimization/charter.md` — ratified objective, invariants, parcel ACs (the contract this spec may only strengthen).
- `plugins/foreman-line/docs/goals/ci-optimization/ci-optimization-lint-2026-09-30.md` — verified ground truth: required-check identity (`test` + `integration-report`, ruleset `main-pr-gate`, strict), recorded CI baseline (99/100 red; ≈73 min queue observed), repo boundary facts.
- `plugins/foreman-line/docs/goals/ci-optimization/gate-1-ratification-2026-09-30.md` — authorizations; Gate 3 human-owned.
- `plugins/foreman-line/docs/goals/ci-optimization/plan-review-findings.md` — F3/F4/F5/F8 triage and missing-work items 5–6.
- `plugins/foreman-line/docs/goals/ci-optimization/loop-directive.md` — branch topology, PR #122 protocol, developer-WIP protocol, stop valves.
- `plugins/foreman-line/docs/SPEC-CONVENTION.md` — spec schema (§4.6–4.8, Verification Plan focus questions).
- `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` — builder/reviewer constraints (#3, #11, #12, #13 cited here).
- CI-P1 spec — `plugins/foreman-line/docs/specs/active/CI-P1-docs-only-push-reuse.md` (final); source of the shared interface and `scripts/ci-reuse.mjs`.
- Surfaces: `.github/workflows/foreman-line-ci.yml`, `.github/workflows/test-plugin-install.yml` (context only), `scripts/foreman-line-ci.mjs`, `scripts/foreman-line-ci.test.mjs`.

## Verification Plan

Deterministic pass (`node --test scripts/foreman-line-ci.test.mjs`), workflow validation of `.github/workflows/foreman-line-ci.yml`, the AC1 pre-flight table, the AC7 live demonstrations, and the AC6 comparison table are the objective evidence. Beyond those, the adversarial reviews are directed at these **mandated focus questions** (each gets a field-by-field assessment; hostile-input probing and mutate-the-fixture discipline are licensed):

1. **Can a reused push leak shard execution?** Implement the naive reading — matrix `if` evaluating a stale/absent decision output, or an aggregation path that re-triggers the sweep — and show the spec's gate condition (`effective decision == 'fallback'`) excludes it. What is `needs.sweep.result` on a reused head, and does `test` still emit the byte-shaped evidence record there?
2. **Does the reconciliation actually fail when it must?** Mutate each fixture dimension independently — drop one package (omission), duplicate one across two artifacts, mark one `skipped`, delete one artifact (cancellation), flip one check to `fail`, forge one foreign identity — and confirm each mutation flips the verdict. Is the expected-skip set empty in code, not just in prose?
3. **Does the per-shard barrier survive real sibling imports?** Pick a cross-shard pair from the measured 222-edge inventory (e.g. `dispatch` in shard 0 importing `receipts` in shard 2) and show the shard's install phase covers the sibling's dependencies; would a shard-local install have failed? Reproduce the 222-edge count independently.
4. **Is the AC6 comparison falsifiable?** Can the elapsed-wall-time direction (MUST decrease at equal coverage) be checked from emitted artifacts with queue separation intact, and is any runner-minutes rise quantified and explicitly accepted — or could silent cost slip through the completion report?
5. **Is the sharding genuinely deterministic?** Run `assignShards` locally twice and under permuted pre-state; identical layout? On the live run, does the aggregator's re-derived assignment equal every shard's declared assignment?
6. **Is coverage preserved exactly while membership expands?** Does every discovered package run exactly `test`, `typecheck`, `lint` — no extra script, none dropped — and does the mapping table show every charter clause preserved or strengthened word-by-word?

## Open Questions

- **Shard count pinned at build.** Default 4 (max parallelism); if the AC6 measurement shows install cost dominating, the builder may pin 2–3 — the choice must be recorded in the completion report with the measured rationale. Never above 4.
- **`hybrid-routing`'s fate at build time.** Discovery is per-checkout: if PR #122 (which deletes it) merges before CI-P2 builds, the base's discovered set changes accordingly and the pre-flight table is re-measured — no spec change needed either way.
- **CI-P1 job layout.** The seam (`ci-reuse.mjs decide`/`verify` outputs) is pinned; the job that hosts it is CI-P1's to place. CI-P2 runs it in its own pre-shard gate job per AC7. Any deviation from the pinned output names (`decision`, `fallback_reason`, `head_sha`, `base_sha`, `evidence_record`) is a coordination stop.