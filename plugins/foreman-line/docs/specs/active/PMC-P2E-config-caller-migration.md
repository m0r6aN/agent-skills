---
ticket: PMC-P2E
title: Governed caller retirement and new user-entry split record
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
risk: critical
surfaces:
  - plugins/foreman-line/dispatch/
  - plugins/foreman-line/jev-decisions/
  - plugins/foreman-line/tests/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Split the broad P2E proposal into explicit retirement of existing governed legacy
executors (E1) and a new opt-in user entry with evidence-only configuration planning
(E2). There is no existing approval-cli inference handoff to migrate. Preserve
worktree dispatch, pure v0 selection and unrelated interactive/evaluation tools.
This parent is a DRAFT coordination record, not a runtime work order.

## Constraints

Source inspection base: `d98e176e6ce6d6164679d35dc21647ef47f33f67`.
Amendment 05 V6/V8 requires explicit pmc/v1 execution and pre-effect legacy/L6
refusal. C/D composition approvals are design evidence, not accepted runtime.
The coordinator authorized only four shaping documents; no ShapingResult,
tasks/plan.md, tasks/todo.md, source, tests, configuration or lock edits are part
of this assignment. The task/checkpoint record lives here and in the child specs.

| Parcel | Outcome | Dependency / release condition |
|---|---|---|
| PMC-P2E1 | Retire three real governed legacy executors, with explicit behavior loss | Root decisions E-01/E-02, two independent design reviews, exact release |
| PMC-P2E2 | New separately invoked CLI; private composition; pure disabled configuration plan | Root E-03/E-04; accepted B1/C/D runtime before composition acceptance; E1 before activation |

E1 can be designed before C/D implementation. E2 design can proceed concurrently,
but its real composition acceptance cannot substitute stub controllers/stores for
accepted predecessors. No new tasks or parallel builders are dispatched by this
record. Each child needs fresh base reconciliation, Step 0 and explicit Gate 2.

### Root decisions ratified — 2026-09-26

- **E-01 (ratified):** retire ALL `executeShadowRoute` adapter execution, not
  merely L6. Its public-only candidate analysis is useful but lacks the PMC
  intent/budget/terminal composition. Preserve its pure hash helper, types,
  declarations and v0 selector. The old shadow contract's candidate/skip receipts
  cease; the delegated coordinator accepts this cross-owner behavior loss under the user-authorized prerequisite scope.
- **E-02 (ratified):** retire `executeDecision` and the direct Jev smoke.
  No compatibility flag or synthetic credential escape. Pure Jev validators,
  replay and consumer logic stay. The offline lab source stays untouched, but its
  relocated dry-run simulation calls the retired API and will no longer produce
  its former success result. The delegated coordinator acknowledges that dependency impact and will
  assign any later lab adaptation separately; it is not a network bypass.
- **E-03 (ratified):** introduce E2's explicit source CLI, not an npm bin,
  public factory or automatic approval-cli send. Initial shipped production
  bootstrap refuses; exercising that command proves a user entry exists, not
  that paid inference works. No runtime constructor is added to the barrel.
- **E-04 (ratified):** the config plan remains a non-executable disabled
  review artifact with empty apply/rollback patches. Authenticated origin setup,
  actual production acquisition and all-component billing proof remain separate
  release prerequisites; no generic JSON-to-authority loader is supplied.

These recommendations deliberately prioritize V6/V8 over preserving old execution
availability. This is retirement with an acknowledged service gap, not a claim
that E2 already provides an equivalent production replacement. Root's instruction
to continue drafting is not acceptance of those tradeoffs.

### Ordered task/checkpoint record

1. Independently review inventory and dispose E-01/E-02. Reconcile the shadow/Jev
   owners' existing contracts; do not silently overwrite their release promises.
2. Release/build E1 only in its listed paths; negative tests prove zero dependency
   effects even for legacy inputs previously accepted. Checkpoint: exact behavior
   retirement and unchanged pure APIs independently accepted.
3. Dispose E-03/E-04 and pin accepted B1/C/D. Release E2's pure planner, entry
   framing and private composition in its listed paths. Checkpoint: actual CLI
   and actual predecessor composition exercised offline, production still held.
4. Before ANY later activation, refresh the inventory, prove every governed
   executor migrated/disabled, obtain authentic origin/profile/endpoint/billing/
   quality/privacy/availability facts and separate concrete spend authorization.
   HRO's actual live/measurement/configuration/recovery exits remain open.

## Acceptance Criteria

1. E1 and E2 are separate DRAFTs with exact proposed file envelopes, closed
   behavior contracts, test obligations, predecessor gates and owner decisions.
2. Inventory distinguishes actual sends, injected executors, pure evidence,
   tests, offline lab and external-boundary tools; no nonexistent handoff or
   blanket host-wide governance claim remains.
3. No child claims that a plan, disabled entry, synthetic observation, missing
   receipt or bounded timeout proves activation, zero charge or full HRO exit.

## Out of Scope

All runtime implementation/release, host apply, new budget/store initialization,
vendor-inquiry transmission, provider calls, credential access, Pi imports,
HRO source changes, policy/schema/money changes and generic tool removal.

## Context & References

- [E1](../done/PMC-P2E1-legacy-inference-disposition.md)
- [E2](PMC-P2E2-governed-user-entry.md)
- [Caller inventory](../../goals/pi-model-configuration/pmc-p2-caller-inventory.md)
- [Amendment 05](../../goals/pi-model-configuration/gate-1-amendment-05.md)
- [Controller](PMC-P2C-same-process-launch-controller.md)
- [Transport](PMC-P2D-openrouter-terminal-transport.md)
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md)

## Allowed Files

Current documentation shaping only:

- plugins/foreman-line/docs/specs/active/PMC-P2E-config-caller-migration.md
- plugins/foreman-line/docs/specs/active/PMC-P2E1-legacy-inference-disposition.md
- plugins/foreman-line/docs/specs/active/PMC-P2E2-governed-user-entry.md
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p2-caller-inventory.md

This replaces the parent's proposed implementation envelope; no approval-cli
mutation is delegated. Child Allowed Files are future proposals, not this grant.

## Verification Plan

Use existing Node 24.19.0 and frozen donor spec-linter `validate` on each draft;
check required sections, local links, exact four-file diff and `git diff --check`.
No runtime test is necessary or authorized for this document-only turn. Record
source pins and advisory results in the inventory; commit only these four files.

Reviewer focus: Does retirement hide a broken consumer? Is any real governed
executor mislabeled outside scope? Can a caller smuggle authority through the new
entry? Does a refusal-only milestone incorrectly replace the original live exit?
