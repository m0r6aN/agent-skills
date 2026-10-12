---
ticket: CFF-P0
title: Recon and baseline — ci-fail-fast
status: active
owner: clinton.morgan
created: 2026-10-07
updated: 2026-10-07
risk: standard
surfaces: [plugins/foreman-line/docs/specs/active/CFF-P0-recon-and-baseline.md, plugins/foreman-line/docs/goals/ci-fail-fast/, scripts/foreman-line-ci.mjs, scripts/ci-reuse.mjs]
routing_class: architecture/risk
verification_class: judgment-required
---

# CFF-P0 — Recon and Baseline (ci-fail-fast)

## Intent

Produce the measured baseline every later `ci-fail-fast` parcel bets on, while changing nothing it reads. CFF-P0 records the current sweep's timeline anatomy (install cost, per-package serial position, failure-to-signal latency, and verdict latency vs. first-red latency as separate measured quantities) from real runs; records the live silent round-robin shard fallback and the four dead waiver entries; maps the waiver machinery's input contract so CFF-P1's reordering (D3) has a written anchor; measures the D7 path→package read graph (one measurement pass per environment, two projections) as a committed data artifact plus fixtures; and re-proves the C9-class measured read-sweep over the post-CI-P2 package cohort. The parcel is read-only: the read-graph pin lands as data, and its code installation rides CFF-P1/CFF-P2. Its records are the "before" baselines that charter exit criteria 4, 5, and 7 consume.

## Constraints

- **Read-only recon.** This parcel writes only the files in Allowed Files. It never edits `scripts/**`, `.github/workflows/**`, or any package source; never adds, removes, or repins a waiver; never installs the read-graph pin into code. A discovered need to change any of those is a loop-stop (coordinator ruling), never a silent edit.
- **Ratified charter authority.** `plugins/foreman-line/docs/goals/ci-fail-fast/charter.md` (D1–D11 locked, Gate 1 ratified twice, Gate 2 early grant scoped to CFF-P0 + CFF-P3) governs. Of particular force: D6 (fail-closed reference mechanism), D7 (read graph: measured, one pass two projections, over-approximation-only, R15 variance edges, criticality graded), D10 (what P0 records vs. what P1 installs; pin maintenance owner/trigger/drift check), D11 (no second differ — irrelevant to P0's records but binding on any tooling it writes).
- **One classification engine (D2).** `scripts/ci-reuse.mjs` (`classifyPath`/`READER_SET`) is consumed read-only, never reimplemented. Measurement instrumentation observes the runner's checks; it never forks or modifies the runner.
- **Measurement discipline (#46, #48).** Every coverage or timing claim is measured, not asserted. Value pins are measured where they run: the pinned environment is `windows-latest` with Node `24.19.0` (the workflow's pin — exact, not "24.x"). Edges proven under one environment only are **named variance edges** that always affect, never exclude (R15).
- **Reproducibility (failing-when-broken class, standing-constraint #12 family).** Every pinned number and artifact in every record must be reproducible from committed commands plus committed fixtures, each carrying its environment fingerprint and source run IDs. No one-off, uncommitted measurements are admissible as evidence.
- **Shaping-session provenance disclaimer.** The shaping session that authored this spec ran on Linux (Node 26.8.2); its spot-checks (the 30/27 cost-table gap, live round-robin fallback, dead-waiver evidence, PR #155 timings) informed these ACs only. None of its outputs are pinned data; the build parcel re-measures everything under the pinned environments with committed commands.
- **Standing constraints** (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`) apply by reference; of particular force: #12 (parcel-time freezes, not byte pins), #13 (waivers pin identity + location + value — relevant to how the inventory cites pins).
- **Review asymmetry (ratified, plan-review finding 6b).** The parcel is standard-risk with architecture review; **the D7 read-graph measurement deliverable (AC5) additionally carries two independent reviews**. The D7 measurement is the coverage-bearing artifact two architecture-risk parcels (CFF-P1, CFF-P2) will bet on — the reviews are the control, not a formality.
- **Disposition boundaries (D10).** P0 records; it does not repair. Fallback loudness is CFF-P1's (D10(c)); dead-waiver expiry is CFF-P1's Stage-F bookkeeping; pin staleness maintenance is owned by the runner-touching parcel's Stage-F with the CFF-P3 gate-job drift check (D10(b)). Each record states these routings verbatim.

## Allowed Files

- `plugins/foreman-line/docs/specs/active/CFF-P0-recon-and-baseline.md`
- `plugins/foreman-line/docs/goals/ci-fail-fast/cff-p0-sweep-anatomy.md`
- `plugins/foreman-line/docs/goals/ci-fail-fast/cff-p0-assignment-and-waivers.md`
- `plugins/foreman-line/docs/goals/ci-fail-fast/cff-p0-waiver-input-contract.md`
- `plugins/foreman-line/docs/goals/ci-fail-fast/cff-p0-c9-reproof.md`
- `plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/read-graph.json`
- `plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/measurement-log.md`
- `plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/fixtures/ci-pass-raw.json`
- `plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/fixtures/dev-pass-raw.json`

Any implementation need outside this list stops work for a ratified spec amendment (SPEC-CONVENTION §4.8).

## Acceptance Criteria

### AC1 — Sweep timeline anatomy record (`cff-p0-sweep-anatomy.md`)

A committed record measuring, from real runs, the anatomy the charter's Stage Zero reconciliation sketched:

1. **Sources (all recorded by run ID):** PR #155's three failure cycles (`37661562241`, `37664971051`, `37666762575`) **plus at least one green main run measured fresh at build time**. Historical green reference: `37674775022` @ `fb25630`.
2. **Measured quantities, each with its method and command:** (a) install cost per package; (b) per-package serial position within its shard under the live assignment; (c) failure-to-signal latency (job start → first red signal in that shard's log); (d) **verdict latency (run created → terminal verdict) and first-red latency as two separate measured quantities** — the 2026-10-07 evidence shows they are different problems and the record must not conflate them; (e) the long-single-suite bound (authority-registry's suite duration vs. its signal time), which the goal explicitly declines to fix (D1) but must measure to bound.
3. **Pre-verified reference points the record must reproduce or explicitly correct with log citations:** cycle 1's first red at **+2m35s** in sweep (2) (`bypass-outage-harness` sits first in its shard's serial order — position was NOT binding); verdicts at **+32 / +26 / +26 min**; authority-registry's signal at **~28.5 min** into sweep (1), bound by its own ~1407s suite; two of three cycle failures were waiver-pin staleness events (fail-closed, correct).
4. **Named datum — the validate-versions red-base episode (2026-10-07, main @ `05d428e`, run `37700880571`):** the `Validate manifest versions` step of the `Validate skill content` job failed **~7s** into the push run (23:12:14 → 23:12:21) — the correct cost class — but the red surfaced only via the next PR's checks, never as a signaled push failure: the wrong discovery channel. The record presents this as evidence that the goal's surfaces fix a **channel gap** as well as a timing gap.
5. **Baseline role stated in the record:** this anatomy is the "before" measurement exit criteria 4 and 7 consume; for exit criterion 5 the record states the current-state fact that no `local` mode exists (the CLI is `resolve | shard | aggregate` only).

### AC2 — Assignment-fallback record (`cff-p0-assignment-and-waivers.md`, §fallback)

1. Records, reproduced by a committed command at the measured-at SHA: **30 packages discovered vs. 27 pinned in `COST_TABLE`**; the cost-unknown names are exactly `kernel-import`, `ops-console`, `project-scaffold`.
2. Records the mechanism truthfully from source: `assignShards`' `costKnown` gate is all-or-nothing (`every(name => Number.isFinite(costTable[name]))`), so one unknown name silently degrades the whole assignment to round-robin; the live assignment at `shardCount 4` matches pure round-robin (8/8/7/7 over the code-point-sorted names) — shown, not asserted.
3. Records that **nothing signals the fallback**: no step-summary field, no shard-outcomes field, no log line names it. States verbatim that the loudness surface is CFF-P1's (D10(c)) and the 30-package re-pin restoring cost-aware assignment is CFF-P1's (D10(a)); P0 records state only.

### AC3 — Dead-waiver inventory (`cff-p0-assignment-and-waivers.md`, §waivers)

1. Enumerates all four `WAIVED_EXCLUSIONS` entries (`bypass-outage-harness`, `kernel-lease`, `authority-registry`, `jev-decisions`) with their full three-axis pins (identity + location + value class, per standing constraint #13) cited from source.
2. Attaches green-run evidence that each is dead: run `37674775022` @ `fb25630` shard-outcomes artifacts record `pass` on every check with `waivers: []` for all four identities (artifact filenames and head SHA recorded).
3. States the safety argument and the routing: run-then-waive means green never consults a pin and any regression re-gates red; expiry/disposition is deferred to CFF-P1's Stage-F bookkeeping (D10) — **this parcel removes nothing**.

### AC4 — Waiver input-contract map (`cff-p0-waiver-input-contract.md`)

1. Maps exactly what `evaluateWaiver` and `reconcile` consume, with `scripts/foreman-line-ci.mjs` line citations: per-(package, check) **captured output text** at the invoke seam; the parse surface (`failingTestNames`, markers, counts, `failTotal` range, R11 equality); the kind gate (`exit` only); every rejection layer enumerated by name.
2. Proves the order-independence claim from source: all set comparisons go through `sameSet` (lines ~962, ~1047, ~1089, ~1108 at shaping time — re-cited at build) — output ordering is invisible to the contract.
3. States the D3 anchor for CFF-P1 in terms the reordering parcel can conform to: reordered output remains per-package captured, same stream concatenation (stdout+stderr), same per-(package, check) granularity, same waiver parsing; `output_sha256` is recorded per-run, never pinned; interleaving per-package output is a charter stop condition.

### AC5 — D7 read-graph measurement (`read-graph/` artifact set) — **two independent reviews required**

1. **One measurement pass per environment, two projections from the same capture.** An instrumented sweep of the swept set records what any check opens at test time — imports **and** non-import couplings (materialized temp-repo reads, fixture path strings, generation targets, module-load reads). From that single capture the parcel derives BOTH projections: (a) the C9 `READER_SET` delta and (b) the D7 affection pin. Two projections never means two read sweeps over the same environment.
2. **Pinned primary environment:** `windows-latest`, Node `24.19.0` (the workflow's pin). The artifact records the exact environment fingerprint and the measured-at commit SHA. If a true `windows-latest` host cannot execute the instrumented pass without a workflow change (this parcel may not make one), that is a **loop-stop for coordinator ruling**, never a silent host substitution.
3. **Supplementary pass (coordinator-ratified):** the same single-pass measurement is re-run on the developer's Windows machine whose sole role is to name variance edges the primary pass did not produce — CFF-P2 (the pin's primary consumer) runs locally, and R15 cuts toward measuring where things run. Local-only edges join the map as **named variance edges that always affect, never exclude**. The supplementary pass never produces a second pin or second projection set.
4. **Over-approximation-only by construction:** the artifact's schema can express only positive coverage — absence of a proven edge never excludes a package; any uncovered package, path, or environment-gated read fails closed to the full discovery-order sweep (D6). Criticality grading is recorded for consumers: CFF-P1 consumes fail-safe (over-report mis-orders latency only); CFF-P2 consumes fail-open under under-report, so its exclusion rule is monotone — a package runs unless the pin positively covers it.
5. **Artifact shape:** schema-stamped `foreman-line-ci/read-graph@1`; environment fingerprint + measured-at commit SHA + **both projections in one file set**; raw per-environment captures committed as fixtures (`fixtures/ci-pass-raw.json`, `fixtures/dev-pass-raw.json`); `measurement-log.md` carries the exact commands, hosts, run IDs, and the variance-edge narrative.
6. **Classification safety property (measured at shaping, re-verified at build):** non-Markdown paths under `docs/goals/` classify as `code` in the reuse engine (`classifyPath('plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/read-graph.json')` → `code`), so any edit to the pin forces a full sweep — the safe direction. The Markdown narrative records classify as `ordinary_documentation`; the pin's protection comes from the JSON, not the prose.
7. **Staleness honesty (stated plainly in the record):** the pin's maintenance owner is D10's — the runner-touching parcel's Stage-F bookkeeping; trigger: any parcel touching the runner, the swept set, or the check surfaces; runtime drift check: CFF-P3's gate-job re-derive-and-compare (FK-P17 pattern). This parcel installs none of that machinery.
8. **Loop-stops (charter §Stop conditions):** if the read graph cannot be measured for a package class, or the relevance engine's coverage is found incomplete for a package class, work stops and reports.

### AC6 — C9-class measured read-sweep re-proof (`cff-p0-c9-reproof.md`)

1. Re-runs the C9-class measured read-sweep over the post-CI-P2 cohort — `kernel-import`, `ops-console`, `project-scaffold` — **measured, not asserted** (lesson #46). The Stage Zero grep (ops-console tests run against materialized temp repos; kernel-import references are fixture paths; project-scaffold references are generation targets) is recorded as a hint, not evidence.
2. Per package: enumerates what its checks open at test time (module-load reads included) and verifies the ordinary-documentation classification's reader coverage still holds. Any newly discovered doc-reading check **shrinks** the ordinary-documentation set — the safe direction — and is recorded in AC5's READER_SET delta projection.
3. Environment discipline per #48: measured where the checks run (the pinned primary environment), with any environment-gated difference named as variance, never averaged.

## Out of Scope

- No edits to `scripts/**`, `.github/workflows/**`, or any package source — including no instrumentation commits to the runner and no new test files under any package.
- No waiver-pin changes: no removals, no re-pins, no expiry edits (D10 routes expiry to CFF-P1's Stage-F).
- No installation of the read-graph pin into code — consumption machinery rides CFF-P1/CFF-P2.
- No fallback loudness surface, no cost-table re-pin (both CFF-P1, D10).
- No `INDEX.md` changes; no `status` flip, no `epics` filling, no Jira registration, no receipts (shaping/loop machinery, not this parcel).
- Green full-sweep wall time (~30 min, authority-registry bound) is explicitly declined by D1 — no deliverable is judged against it; no runner-count, provider, or pricing changes (D1).
- The dispatch suite's 279 pre-existing local failures are out of scope as failures (charter §Relationship to live goals).
- No second differ, no second classification engine (D2/D11); no branch-protection or merge-gate identity changes.

## Context & References

- Charter: `plugins/foreman-line/docs/goals/ci-fail-fast/charter.md` — D1, D2, D3, D6, D7, D10; §Stage Zero reconciliation; exit criteria 4/5/7.
- Triage record: `plugins/foreman-line/docs/goals/ci-fail-fast/plan-review-triage-2026-10-07.md` — findings 3 (read-graph redefinition), 4 (maintenance owner + loudness routing), 6b (two independent reviews on the D7 measurement deliverable), 6d (one sweep, two projections).
- Baseline authority: `plugins/foreman-line/docs/goals/ci-optimization/goal-closure-2026-10-02.md` — what reuse/sharding already guarantee; P0 refines, never amends.
- Dispatch: `plugins/foreman-line/docs/kickstarters/foreman-line-shaping-CFF-P0.md`; standing constraints: `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.
- Coordinator answers to this session's Step 0 gate (2026-10-07, Q1–Q6): pinned primary environment `windows-latest` + Node `24.19.0` with recorded fingerprint; supplementary dev-Windows pass for variance edges; fresh green run plus the validate-versions red-base datum; artifact placement `docs/goals/ci-fail-fast/read-graph/` with the code-classification safety property; reproducibility focus question.
- Source under measurement: `scripts/foreman-line-ci.mjs` (`discoverPackages` :212, `COST_TABLE` :277, `assignShards` :319, `WAIVED_EXCLUSIONS` :517, `EXPECTED_SKIPS` :623, `evaluateWaiver` :697, `reconcile` :978, `sameSet` :962); `scripts/ci-reuse.mjs` (`READER_SET` :129, `classifyPath` :175, `parseNameStatusZ` :416, `GITHUB_EVENT_PATH` seam :1086). Line numbers as of `14b2501a`; re-cite at build.
- Lessons: `plugins/foreman-line/docs/transcripts/defects_lessons.md` #46 (measured, not asserted), #48 (pins measured where they run); `plugins/foreman-line/docs/SPEC-CONVENTION.md`; `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`.
- Runs cited: `37661562241`, `37664971051`, `37666762575` (PR #155 cycles), `37674775022` (green @ `fb25630`), `37700880571` (validate-versions red base @ `05d428e`).

## Verification Plan

- **Self-verification is not verification.** The builder claims against AC1–AC6; the architecture review (plus the second independent review on AC5) verifies. Reviewers are licensed for hostile-input probing (standing constraint #8).
- **Reproduction probes:** the reviewer re-runs each record's committed commands at the recorded SHAs and confirms the pinned numbers (30/27 gap, round-robin liveness, waiver contract order-independence, read-graph edge sets) reproduce; any number traceable only to an uncommitted one-off fails review.
- **Mutation probes (standing constraint #11):** for the read-graph artifact, the reviewer breaks a fixture in a named dimension (e.g., removes a proven edge, flips a variance edge to exclusion semantics) and confirms the schema/validation narrative refuses it — an artifact that admits exclusion-by-absence fails AC5.4.
- **Freeze audit (standing constraint #12 class):** the coordinator's Stage-D/E diff check confirms the parcel touched only Allowed Files — no `scripts/**`, workflow, or package-source bytes changed.

**Mandated reviewer focus questions:**

1. Can any AC be read to permit exclusion-by-absence — is the pin's over-approximation-only direction structural, or only asserted in prose?
2. Does any coverage or timing claim rest on reading rather than measurement (#46) — is the Stage Zero grep anywhere treated as evidence?
3. Does anything invite a second read sweep for the two projections — are both projections provably derived from the same per-environment capture?
4. Does the prose exclude the naive reading that P0 may install the pin — is there any path by which code installation sneaks into this parcel?
5. Is every pinned number and artifact reproducible from committed commands and fixtures — does any AC admit a one-off, uncommitted measurement?
