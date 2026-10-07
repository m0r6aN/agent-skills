# Loop Directive — ci-fail-fast

**Created:** 2026-10-07, at Gate 1 ratification. Charter:
[`charter.md`](charter.md) (RATIFIED 2026-10-07, D1–D10, CFF-P0…P4).

## Ownership block

- **Owning coordinator:** the Stage Zero session that claimed the goal
  2026-10-07 (this directive's author). One goal, one coordinator.
- **Ownership transfer:** only at parcel boundaries, via an edit to this
  block naming the successor and the boundary. Never ambient.

## State

`cff_plan_review_triaged_reratification_pending`

The plan-level adversarial review has returned (findings 1–6); triage complete
in [`plan-review-triage-2026-10-07.md`](plan-review-triage-2026-10-07.md).
Findings 1/3/5 mutate locked-decision text: **Gate 1 re-opened scoped** to
D7, D8, D9, the Objective sentence, plus D10 extensions and a new D11 (diff
source) + graph edits. Proposed amendment text is drafted and **awaiting
developer re-ratification** (Stage Zero rule 3 — not installed until directed).
Blocked on re-ratification: CFF-P1, CFF-P2, CFF-P4 shaping. Provably
unblocked: CFF-P0 recon deliverables, CFF-P3 original scope — but Gate 2 is
ungranted (no standing authorization in this goal) and awaits the developer's
word. After re-ratification: the Gate 2 request for the final named graph.

## Standing authorizations

**None.** Verbatim from the ratified charter:

- Gate 2: not granted. Request only for the final named parcel graph after
  the plan-level adversarial review; per-parcel vs. per-graph cadence is
  decided at that request.
- Gate 3: not delegated. Every merge to a workflow, the CI runner, or the
  reuse/waiver machinery remains human-owned.

## Stop conditions (charter §Stop conditions, binding here)

Second differ or second pin source proposed · waiver input contract changes
shape · local waiver grant proposed (`waived-in-ci` is informational only) ·
early-red signal proposed to alter/shortcut/replace the all-artifact verdict ·
platform skip without named reason + evidence · whole-suite skip instead of
baseline-diff · per-package output interleaved · relevance coverage incomplete
for a package class · D7 affection pin unmeasurable for a package class ·
merge-gate identity/branch-protection question needing inference. Universal
conditions per COORDINATOR-PATTERN also apply.

## Evidence trail

- Kickoff directive + Stage Zero interrogation/reconciliation report:
  session transcript (2026-10-07); measured facts recorded in charter
  §Stage Zero reconciliation.
- Draft charter commit: `b399ff6f` (PR #157).
- Ratification record: charter §Gate 1 record.
- Plan review findings + triage dispositions + scoped re-open package:
  [`plan-review-triage-2026-10-07.md`](plan-review-triage-2026-10-07.md).
