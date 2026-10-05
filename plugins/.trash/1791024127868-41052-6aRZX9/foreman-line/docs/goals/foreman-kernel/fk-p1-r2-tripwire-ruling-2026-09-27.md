# FK-P1 rework tripwire ruling — 2026-09-27

**Parcel:** FK-P1 (build commit `86069eb7`, branch `codex/fk-p1-lifecycle-admission-decision-contracts`)
**Event:** the rework cap declared in the R2 dispatch ("round 2 of 2 — a third round stops the parcel and reports") fired on acceptance-verification finding **F4**.

## Finding F4 (closure reviewer, lens 1)

The new test `case-probe-shadow-would-confusion` does not bind its named dimension: the test selector matches lowercase `'would'/'shadow'` in the dimension string, but the dimension string uses `'expectedWouldDecision…'` (capitalized) — so the mutation runs against `vec-enforced-path-outside-1`, where the F05.8 placement check satisfies both assertions. Neutralizing the case-level uniform-rule compare (`validate.ts:1913`) leaves the suite 151/151 green. The live enforcement path is independently verified correct (probe P4 fail-closed, 28-row sweeps zero-widening); what is broken is the regression guard. This is standing-constraint #11's exact failure class ("passing is not evidence; failing-when-broken is").

## Coordinator action

Stopped the parcel at the declared cap and reported to the owner rather than overriding the tripwire (FK-P0 lesson: coordinators repeatedly overriding their own tripwires is a named defect class).

## Owner ruling (2026-09-27, interactive)

**"Authorize round 3"** — the cap is lifted for EXACTLY one bounded round: the one-token selector fix (bind the case-level uniform-rule test to its shadow base case — via the case `name`) + F4 re-verification by the same closure reviewer. **No other change is permitted in the round.** A defect beyond F4's scope in that round stops the parcel and reports again.

## Status

Round 3 dispatched under this bounded authorization. Tripwire history for this parcel: rounds 1–2 per the builder's record; round 3 = owner-authorized exception, this record is its authority.
