# Shaping Session Kickstarter — CFF-P1 (change-proximity ordering + early-red signal)

> **DISPOSAL-AUTHORIZED (2026-10-08).** Full-graph Gate 2, verbatim: "full-graph
> Gate 2 granted" (developer directive 2026-10-08, superseding the 2026-10-07
> early grant's CFF-P0/P3-only scope; recorded in
> `plugins/foreman-line/docs/goals/ci-fail-fast/loop-directive.md`). Covers
> shaping and build dispatch for CFF-P1/P2/P4 within the ratified graph's
> sequencing: **CFF-P2 shapes only after CFF-P1 merges** (both extend `runCli`;
> that sequencing is ratified and unchanged), CFF-P4 gates on P1+P2+P3. **Gate 3
> is human** — every merge to a workflow, the CI runner, or the reuse/waiver
> machinery remains a human act. Shaping is docs-only and stops at Step 0 for a
> coordinator ruling before any draft.

You are the Shaping Agent for `CFF-P1`. Run the `/foreman-shaping` skill
(`plugins/foreman-line/skills/foreman-shaping/SKILL.md`) and follow it exactly.

## Inputs

- **Idea:** Within each shard, order checks by change-proximity over the D7
  read graph with a deterministic tie-break (D3's per-package output contract
  preserved byte-shape; ordering must never become a waiver bypass channel);
  add the D8 early-red signal surface (signal-only): shard-early-exit at the
  first non-waived failure + sanitized `::error`/`::warning` annotations at
  failure time. Carry D10's CFF-P1 bookkeeping: the 30-package cost-table
  re-pin (restoring the ratified cost-aware assignment, loudly) and the
  dead-waiver expiry disposition at Stage F.
- **Context references:**
  - Charter: `plugins/foreman-line/docs/goals/ci-fail-fast/charter.md` —
    **D3** (shape-stable output: per-package captured, same stream
    concatenation, same granularity, same waiver parsing, `output_sha256`
    per-run never pinned, interleaving = stop condition), **D6** (fail-closed
    to the mechanism's full discovery-order sweep — pinned by reference to
    `assignShards`/`runShard`, never to a snapshot), **D7** (the read graph is
    consumed **fail-safe**: over-report mis-orders latency only; the pin is
    over-approximation-only; CFF-P0 measures, P1 consumes), **D8** (the named,
    bounded early-red surface and its structural prohibitions), **D10** (the
    cost-table re-pin flips the live mechanism from round-robin back to
    cost-aware — deliberately, loudly; fallback loudness; waiver expiry
    bookkeeping), **D11** (the shared diff seam — **P1 owns it**: one shared
    diff export in `ci-reuse.mjs`, base selection from `GITHUB_EVENT_PATH`,
    fail-closed on absent/all-zeros; **no runner-local differ, ever** — a
    second differ is a named stop condition), exit criteria 4 and 6.
  - Triage record: `plugins/foreman-line/docs/goals/ci-fail-fast/plan-review-triage-2026-10-07.md`
    — findings 2 (D11 seam collision), 5 (D8's named surface).
  - **CFF-P0 records (copied into this worktree; the parcel is in flight):**
    `plugins/foreman-line/docs/goals/ci-fail-fast/cff-p0-waiver-input-contract.md`
    — **the D3 anchor** your output contract must conform to; `cff-p0-assignment-and-waivers.md`
    — the cost-table/waiver baseline D10's bookkeeping executes against;
    `read-graph/measurement-log.md` — the D7 measurement's provenance.
    **The `read-graph.json` capture is IN FLIGHT** (CFF-P0's measurement
    running): pin your spec to the artifact's CONTRACT (schema
    `foreman-line-ci/read-graph@1`, over-approximation-only, R15 named
    variance edges always-affect-never-exclude, criticality grading: P1
    fail-safe) — never assume its contents or edge counts.
  - **CFF-P3 Unit A (in review on `feat/foreman-line-cff-p3`):** the pin
    table extraction (`pins/surface-pins.json`), the gate-job precheck, and
    its workflow step are CFF-P3's. P1 must not collide: your workflow
    surface is the `sweep` jobs' ordering/early-red behavior only.
  - **Coordinator-verified disk facts (confirm each before drafting ACs):**
    `scripts/foreman-line-ci.mjs` — `discoverPackages` :212, `COST_TABLE` :277
    (27 entries; 30 discovered; missing exactly `kernel-import`,
    `ops-console`, `project-scaffold`), `assignShards` :319 (`costKnown`
    all-or-nothing → silent round-robin fallback, 8/8/7/7 at shardCount 4),
    `WAIVED_EXCLUSIONS` :517 (4 dead identities), `sameSet` :962/:1047/:1089/:1108,
    `sanitizeField` :140, `verdict()` :1150 (`gateResult !== 'success'` →
    `gate-failed`), `EXPECTED_SKIPS` :623; `scripts/ci-reuse.mjs` — rule 0
    :623 (non-`pull_request` refused), `GITHUB_EVENT_PATH` seam :1086,
    `classifyPath`/`READER_SET`/`parseNameStatusZ` (D2: imported, never
    reimplemented). Line numbers at the time of writing; re-cite at build.
- **Environment:** build-stage deterministic passes run on the developer's
  Windows machine class per lessons #47/#48; live CI evidence on the PR.
  The dispatch suite's 279 pre-existing local failures are out of scope (D9's
  problem, CFF-P2's machinery).

## Scope boundaries (charter stop conditions bind)

No second differ · no second classification engine · no waiver input-contract
shape change (D3 conformance is the test) · no interleaving of per-package
output · no early-green path, no verdict change, no sibling cancellation, no
`needs`/scheduling change, no check-run/status emitter (`checks: write`/
`statuses: write` never granted) · no waiver-pin value changes (expiry
disposition is Stage-F bookkeeping) · nothing that weakens the all-artifact
verdict.

## Routing

**critical / architecture-risk → two independent adversarial reviews** before
any Gate 3 request. Build dispatch follows promotion AND CFF-P0's Gate 3 merge
(the dependency is ratified). Deliverables at end of shaping: the spec at
`plugins/foreman-line/docs/specs/active/CFF-P1-*.md` (status: `draft` — the
coordinator's lint is the sole promotion authority; never self-promote) plus
the shaping-result JSON. STOP after shaping.
