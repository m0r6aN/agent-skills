# Loop Directive — ci-fail-fast

**Created:** 2026-10-07, at Gate 1 ratification. Charter:
[`charter.md`](charter.md) (RATIFIED 2026-10-07, D1–D10, CFF-P0…P4).

## Ownership block

- **Owning coordinator:** the Stage Zero session that claimed the goal
  2026-10-07 (this directive's author). One goal, one coordinator.
- **Ownership transfer:** only at parcel boundaries, via an edit to this
  block naming the successor and the boundary. Never ambient.

## State

`cff_gate1_ratified_plan_review_pending`

Charter ratified with all Stage Zero recommendations installed. **Next action:
plan-level adversarial review** — a fresh frontier session with zero
coordinator context beyond the charter and repo canon (mandate per
COORDINATOR-PATTERN §Plan-level adversarial review). No parcel is shaped
before that review's findings are triaged; if triage changes a locked
decision, Gate 1 re-opens scoped to that decision.

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
