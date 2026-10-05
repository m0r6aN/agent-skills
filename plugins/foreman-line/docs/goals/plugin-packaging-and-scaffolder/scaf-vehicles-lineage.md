# SCAF delivery lineage (extracted 2026-09-26)

**Disposition:** extraction per coordinator verdict (see `../goal-status-report-2026-09-26.md`).
The wave goal records `w1-intake-registration`, `w2-dispatch`, `w3-verification`, and
`w4-ci-integration` were deleted 2026-09-26 as complete/duplicate records; their SCAF exit-vehicle
delivery evidence is extracted here so this goal's P1–P7 queue can be reconciled against shipped
work. Source records remain recoverable in git history.

## Delivered SCAF exit vehicles (verbatim facts from the wave records)

| Vehicle | Delivered via | Evidence |
|---|---|---|
| SCAF-P1 | `w1-intake-registration` exit-proof lineage | merged `f04f3e8` (w1 canon) |
| SCAF-P2 | `w2-dispatch` (KONE-23195) | **SHIPPED 2026-07-23** — PR #57, squash `a4d58c94`; shared test-scaffold extraction; exit-criterion chain-walk provable via document chain |
| SCAF-P3 | `w3-verification` | **SHIPPED 2026-07-25** — PR #80; exit proof vehicle |
| SCAF-P4 | `w4-ci-integration` | **SHIPPED + CLOSED 2026-07-28** — PR #96; elevated-surface (`risk: elevated`) exit vehicle; A→F chain passes `validateChain` incl. AC5c correlation invariants; follow-ups SCAF-P4-FUP-1 (GitHub-login format guard) and SCAF-P4-FUP-3 (own-property guards) recorded in w4 records |

## Reconciliation note

This goal's charter queue (P1 manifest + skill relocation, P4→P3 de-dogfood canon into
`templates/`, P5/P6 `project-scaffold` generator, P7 clean-room `/goal` trial) predates these
vehicles and was "unrecorded" in-goal as of the 2026-07-29 plan review ("No parcel has been
shaped and no implementation work has begun"). The claiming coordinator must map the charter's
P1–P7 items against the SCAF-P1–P4 deliveries above before dispatching further work, and record
the mapping in `charter.md` / a loop directive. P7 clean-room trial gates the goal (charter §7).
