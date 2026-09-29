# FK-P10 rework tripwire ruling — 2026-09-28

**Parcel:** FK-P10 (build `ab7ed989`, branch `codex/fk-p10-lease-transition-engine`)
**Event:** the rework cap declared in the round-2 directive ("ROUND 2 of 2 (FINAL) — a third stops the parcel and reports") fired on acceptance-verification finding **F5-masking** (Lens 2 closure re-check).

## Finding

Round-2's R2 fix (transient-only bounded retry + ENVIRONMENT skip-and-record) removed the per-row `assert.equal(losers[0]?.code, <named code>)` from the CN-05/06/07 and LEASE_HELD rows: `namedLoserOrSkip` skips only on STORAGE_FAILURE and returns false on any other mismatch, after which the test checks only table counts. Mutation-proven: relabeling the pending refusal `TRANSITION_NOT_PENDING` let CN-07 pass with the loser surfacing the wrong code (0 skipped). Re-opens T10 L6 (named loser results) and violates the ruled "absence must mean survival, not masking" discipline.

## Coordinator action

Stopped the parcel at the declared cap and reported to the owner rather than overriding the tripwire (FK-P0 lesson: coordinators overriding their own declared tripwires is a named defect class).

## Owner ruling (2026-09-28, interactive)

**"Authorize bounded round 3"** — the cap is lifted for EXACTLY one bounded round: restore the named-loser assertion after the escape guard in each CN row (5 rows) + the M6-class mutation proof (relabel a refusal → the named test must fail) + one loaded soak pass. **No other changes.** A defect beyond this scope stops the parcel and reports again.

## Status

Round 3 dispatched under this bounded authorization. Tripwire history: rounds 1–2 per the rework records (round 1 consumed by the crash recovery); round 3 = owner-authorized exception, this record is its authority. Companion one-token doc fix (Lens-1 P3: AC11 "22 codes" → "23 codes") is coordinator-side spec text and folds into the Stage-F record commit, outside the builder's round-3 scope.