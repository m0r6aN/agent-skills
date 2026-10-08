# Shaping Session Kickstarter — CFF-P0 (recon and baseline)

> **DISPATCH-AUTHORIZED (2026-10-07).** Gate 2 early grant, verbatim: "gate 2
> early grant issued" — scoped to **CFF-P0 and CFF-P3** (recorded in
> `plugins/foreman-line/docs/goals/ci-fail-fast/loop-directive.md` with its
> contingencies). The charter is fully ratified (Gate 1 twice; the plan-level
> adversarial review is closed with triage installed as D7–D11). CFF-P0 is
> **provably orthogonal** to every re-opened-then-closed decision and is
> read-only: no runner, workflow, or waiver-pin writes. Shaping is docs-only
> and stops at Step 0 for a coordinator ruling before any draft.

You are the Shaping Agent for `CFF-P0`. Run the `/foreman-shaping` skill
(`plugins/foreman-line/skills/foreman-shaping/SKILL.md`) and follow it exactly.

## Inputs

- **Idea:** Recon and baseline parcel for the `ci-fail-fast` goal. It records
  the sweep timeline anatomy (install cost, per-package serial position,
  failure-to-signal latency, **verdict latency vs. first-red latency**), the
  live assignment-fallback state, the dead-waiver inventory, and the waiver's
  input-contract map; it **measures the D7 read graph** (one measurement pass,
  two projections); and it re-runs the C9-class measured read-sweep over the
  post-CI-P2 package cohort.
- **Context references:**
  - Charter: `plugins/foreman-line/docs/goals/ci-fail-fast/charter.md` —
    **D7** (read-graph definition, over-approximation-only, R15 variance
    edges, criticality grading), **D10** (what P0 records vs. what P1
    installs), §Stage Zero reconciliation (the measured facts this parcel
    formalizes), exit criteria 4/5/7 (P0 supplies their baselines).
  - Triage record: `plugins/foreman-line/docs/goals/ci-fail-fast/plan-review-triage-2026-10-07.md`
    — findings 3/4/6 shape this parcel's deliverables.
  - Baseline authority: `plugins/foreman-line/docs/goals/ci-optimization/goal-closure-2026-10-02.md`
    (+ its stop reports) — what reuse/sharding already guarantee; P0 refines,
    never amends.
  - **Coordinator-verified disk facts (confirm each before drafting ACs):**
    - `scripts/foreman-line-ci.mjs` — `discoverPackages` (30 packages today),
      `COST_TABLE` (27 pinned), `assignShards` (silent round-robin fallback
      when any name is cost-unknown), `evaluateWaiver`/`reconcile` (the waiver
      input contract to map), `EXPECTED_SKIPS` empty.
    - `scripts/ci-reuse.mjs` — `classifyPath`/`READER_SET` (the C9 reader
      set; one measurement pass must project BOTH this set and the D7
      affection pin).
    - Green main `fb25630` run `37674775022`: all four waived identities
      record **pass** — the entire `WAIVED_EXCLUSIONS` set is dead.
    - PR #155 cycles (runs `37661562241`, `37664971051`, `37666762575`):
      fast per-shard red at +2.5/+3.5 min in sweep (2); verdict +26…+32 min;
      authority-registry's 1407s suite bound its own latency. These are the
      anatomy sources.
  - Canon: `plugins/foreman-line/docs/SPEC-CONVENTION.md`,
    `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`,
    `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`,
    `docs/transcripts/defects_lessons.md` (#46 measured read-sweep, #48 pins
    measured where they run).

Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

## Where you work

- Worktree: `C:\Repos\foreman-line-cff-p0` on branch `feat/foreman-line-cff-p0`.
  Do ALL work there; never touch the main working tree, never check out
  another branch, never push.
- Environment: Windows. Node toolchain commands run in **PowerShell only**;
  run `node -v` first (must satisfy `>=24.11.1`).

## Step 0 — restate and STOP (mandatory gate)

Before writing any draft: restate the idea in your own words; state the single
parcel you propose (risk **standard with architecture review**; note that the
**D7 measurement deliverable carries two independent reviews**); enumerate the
draft files you will create; confirm what is out of scope; list clarifying
questions in small numbered batches, each with a recommended default. Then
STOP and wait for the coordinator's answers.

## Parcel-specific guidance

- **Deliverables to shape as acceptance criteria** (shape, do not build):
  1. **Sweep timeline anatomy record** — from real runs (PR #155's three
     cycles + at least one current green run): install cost, per-package
     serial position, failure-to-signal latency, and **verdict latency vs.
     first-red latency as separate measured quantities** (the 2026-10-07
     evidence shows they are different problems).
  2. **Assignment-fallback record** — the 30/27 cost-table gap, the silent
     round-robin fallback, and the observation that nothing signals it (P1
     installs the loudness surface per D10; P0 only records state).
  3. **Dead-waiver inventory** — all four `WAIVED_EXCLUSIONS` entries, with
     green-run evidence; disposition deferred to Stage-F bookkeeping (P1).
  4. **Waiver input-contract map** — exactly what `evaluateWaiver`/`reconcile`
     consume (per-(package, check) captured output; order-independent), so
     P1's reordering contract (D3) has a written anchor.
  5. **D7 read-graph measurement** — one measurement pass, two projections
     (READER_SET delta + affection pin); non-import couplings included
     (materialized temp-repo reads, fixture path strings, generation targets);
     R15-style named variance edges for anything proven under one environment
     only; the pin is **over-approximation-only** by construction. Output is a
     **data artifact + fixtures** — code installation rides P1/P2 (this is
     what keeps P0 read-only).
  6. **C9-class measured read-sweep re-proof** over the post-CI-P2 cohort
     (kernel-import, ops-console, project-scaffold) — measured, not asserted
     (#46); the Stage Zero grep is a hint, not evidence.
- **Out of scope:** no edits to `scripts/**`, `.github/workflows/**`, or any
  package source; no waiver-pin changes (D10 routes expiry to P1's Stage F);
  no INDEX.md changes; nothing under `docs/specs/` beyond the outputs below.
- **Risk honesty:** the D7 measurement is the coverage-bearing artifact two
  architecture-risk parcels will bet on — the spec must demand reproducible
  commands + pinned fixtures (golden-tested data), and must say plainly that
  the pin's staleness maintenance is D10's (owner/trigger named there).

## Outputs (after answers)

- One parcel spec draft under `plugins/foreman-line/docs/specs/active/` at
  `status: draft`, passing the advisory self-check
  (`plugins/foreman-line/shaping/`).
- One `plugins/foreman-line/docs/specs/active/<SESSION-SLUG>.shaping-result.json`
  with `parcelSpecRefs` (POSIX, `>= 1`) and `epics: []`. Derive the slug via
  `deriveSessionSlug` before calling emit.

## STOP boundary

No `status` flip (draft → active), no `epics` filling, no Jira registration,
no receipt emission/hashing, and **no implementation code** — shaping produces
the spec only. Coordinator lint is the sole promotion authority. A need to
change any frozen contract is a loop-stop.

## Completion

End by reporting the draft path, the `ShapingResult` path, and any open
questions still awaiting a human/coordinator decision.
