# E6-R1 Plan-Level Adversarial Review Findings

**Date:** 2026-09-06
**Reviewed state:** uncommitted ratified amendment, charter/loop update, draft E6-R1
spec, and schema-valid shaping handoff in the coordinator worktree
**Verdict:** **PASS** after E6-R1A and PL7 follow-up review
**Mutation check:** reviewer made no repository or external-system writes

## Findings and coordinator triage

| ID | Rank | Finding | Triage |
|---|---|---|---|
| E6R1-PL1 | BLOCKER | Replacing each historical registration sidecar's commit and permalink while retaining `commit->ticket` and `ticket->commit` would assert current links that were never created. The reachable import commit contains the target files but does not mention either historical ticket; Jira writes are prohibited. | **REOPEN GATE 1 for the sidecar disposition.** Recommended: retire the two stale `RegistrationResult` sidecars and replace them with non-registration repository-migration provenance records that state only verified import commit/path facts and explicitly disclaim bidirectional-link evidence. |
| E6R1-PL2 | MAJOR | The loop records E6-R1 dispatch authority but the charter's standing Gate-2 grant still names only the three historical parcels. | **HOLD Stage C.** Obtain explicit E6-R1 Gate-2 authorization and record it in both charter and loop before builder dispatch. |
| E6R1-PL3 | MAJOR | The real Stage-A approval CLI requires a human at an interactive TTY to type the exact approval slug. | **FIX after Gate 1.** Add an explicit human Stage-A approval stop. The coordinator must not supply the confirmation on the human's behalf. |
| E6R1-PL4 | MAJOR | The spec both permits the builder to edit the two historical sidecars and categorically reserves all registration sidecars to the coordinator. | **FIX after Gate 1.** Distinguish retired historical migration artifacts in builder scope from the new E6-R1 registration sidecar, which remains coordinator-owned. |
| E6R1-PL5 | EDITORIAL | Stage-F ordering must make the lifecycle move real before the receipt attests to it. | **FIX.** Specify: observe human merge, create closure branch from current main, move the spec locally, then call `runStageF`, then open the goal-complete PR. |
| E6R1-PL6 | EDITORIAL | GitHub's `mergedBy` identifies an account but cannot prove a human, because the owner credential is shared with agents. | **FIX.** Bind human provenance to Clint's explicit task-level merge confirmation plus the coordinator stop; use GitHub only to corroborate account, time, and merge SHA. |

## Verified feasibility

- The identity inventory is exactly 42 tracked files and 79 matching lines.
- The 43rd proposed builder file is the sole direct consumer of the live-rules fixture.
- The draft spec and shaping result pass their frozen validators.
- The current import commit is reachable and contains both named target specs at
  their current `done/` paths, but it does not establish ticket backlinks.
- Current D4-R2B rulesets and effective `main` rules match the ratified state.
- The shipped emitters can produce exactly one conforming receipt for each stage
  A through F when auxiliary JSON and the verification envelope are excluded by
  the repository's conforming-receipt filename predicate.
- Review-before-D and E-outside-the-attested-PR ordering are feasible.
- `runStageF` can represent an honest no-op test-issue state transition.

## Reopened decision

Only the historical-sidecar disposition is reopened at Gate 1. All other E6-R1
decisions remain ratified. No external write, Stage-A receipt, or Stage-C dispatch
may occur while this HOLD remains unresolved.

## Owner disposition — E6-R1A

Clint resolved the reopened decision and the missing Gate-2 authorization exactly:

> Ratify E6-R1A and grant E6-R1 Gate 2

The controlling amendment now retires both stale historical `RegistrationResult`
sidecars and replaces them with non-registration repository-migration provenance
records that disclaim current ticket-link evidence. It also records 45 exact
builder mutation paths, the coordinator-only boundary for the new E6-R1 Stage-B
sidecar, the mandatory human Stage-A approval stop, and the contingent E6-R1
Gate-2 grant. Findings E6R1-PL1 through E6R1-PL6 are incorporated into the
corrected draft.

## Follow-up finding — receipt-kind mismatch

| ID | Rank | Finding | Triage |
|---|---|---|---|
| E6R1-PL7 | BLOCKER | The first correction prescribed `emitVerificationVerdict`, which necessarily writes a `kind:'claim'` Stage-D receipt. `runStageE` requires its D predecessor to be `kind:'stage'` and correctly rejects that output. | **FIX without Gate-1 reopen.** Reuse the ratified CLOSE-P1 single coordinator-emitted verdict-stage design: assemble the real passing verdict, then mint one kind-stage D receipt with the shipped receipt primitives. Do not change a frozen emitter, relax exact-six, or weaken `runStageE`. |

The technical correction also clarifies the two newly created migration-record
paths and extends the loop's dual-review parenthetical to E6-R1. A fresh focused
review was required to confirm PL7 closure.

## PL7 focused follow-up verdict

**PASS — 2026-09-06.** A fresh read-only reviewer verified that the direct
coordinator-emitted verdict-stage procedure is executable from existing exported
primitives, produces one valid sequence-3 `kind:'stage'` D receipt, binds the real
assembled dual-review verdict, and is accepted by `runStageE`. It emits no claim
receipt, verification envelope, or seventh receipt. PL1–PL6 remain closed. No
Gate-1 reopen or new product decision is required.
