# p4a-review-R3-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

All verification complete. Final output:

## VERDICT: APPROVE-WITH-FIXES

## TEST RUN
```
.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
  → run 1: 2455 passed, 137 skipped, 1 failed (tests/test_gravity_recall_http.py::test_gravity_orders_after_relevance_then_shard_id — passes in isolation)
  → run 2: 2456 passed, 137 skipped — matches brief exactly (flaky test untouched by P4a; cb386f8..efe71bb delta is only document_store.py, curation.py, 2 curation test files)
KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex pytest tests/inheritance/test_curation_postgres.py -q → 7 passed (matches brief)
… tests/test_gravity_postgres.py tests/test_recall_postgres.py -q → 13 passed
black --check / isort --check-only (all 4 rework-2 files) → clean
Temp-dir probes (re-run of my R2 probes + true concurrency, barrier-synced threads):
  same-actor(agt_a)/different-role(role_b): approve → 403 "own proposal"; supersede → 403 (T6/T12 behavior)
  is_visible handoff: forged handoff:profile_a:role_b grant (role_z) → False; author-role grant → False; profile grant → False; cross-profile same-named target → False; true target/author → True; legacy → False (T1 holds; scope.py untouched in rework 2)
  T10 in-mem (gated target read, 2 distinct supersedes) → [200, 409]; predecessor superseded exactly once; loser proposal still pending
  T11 in-mem identical concurrent approve → [200, 200] byte-identical; identical concurrent SUPERSEDE → [200, 200] byte-identical (pre_check-first works)
  T11 PG (temp DB) identical concurrent SUPERSEDE → [200, 409] ("already superseded … must not fork"); sequential retry of the same op afterwards → 200 replay
```

## TRIAGE VERIFICATION
- P4a-T10: IMPLEMENTED — in-memory: `update_records` are `(record, required_status)` pairs arbitrated inside the locked bundle (`UpdateStatusConflict` → 409, journaled full rollback, inserts included); PG: `_UPDATE_CONDITIONAL_SQL … WHERE payload->>'status' = $4` runs FIRST in the transaction, row-count check ⇒ `CurationStateConflict`, whole transaction rolls back. Shipped true-concurrency tests both backends; my own barrier probe confirms exactly one winner, predecessor demoted once, loser bundle traceless (proposal still pending), no replacement fork (further supersede → 409).
- P4a-T11: PARTIAL — in-memory fully fixed (`_binding_pre_check` runs before the insert-only guard inside the bundle; my probes show identical concurrent approve AND supersede both replay 200/byte-identical) and the engine adds the post-pending-check binding re-read; PG identical concurrent **approve** replays correctly (shipped test + binding unique key → winner recovery). But on PG the T10 conditional UPDATE executes *before* the binding arbitration, so an identical concurrent **supersede** retry dies on the predecessor row check and gets a 409 "must not fork" instead of the ruled replay (probe above). Fail-closed, no partial state, and the very next retry replays 200 — but the "identical concurrent retry replays" guarantee is unmet on the PG supersede path.
- P4a-T12: IMPLEMENTED — `test_proposer_may_not_approve_own_proposal` now asserts 403 for the same actor under role_b for approve AND supersede; the stale "binds the identity triple" comment is corrected to "binds the ACTOR, not the identity triple"; the different-actor/same-role MAY-approve case retained.

Convergence line noted: in-memory-race-only residuals carry forward; the one residual below is a PG-path behavior, but it is fail-closed and convergent, not within the REQUEST-CHANGES bar (no exploit, fail-open, leak, laundering, or data loss).

## FINDINGS

### F-1 [minor] PG identical concurrent supersede retry gets a 409 instead of the T11 replay
- Where: `src/keon/cortex/services/curation.py` `PostgresCurationStore.commit_disposition` (~1084–1110): the T10 conditional UPDATE runs before the binding insert, so the loser of an identical-operation supersede race raises `CurationStateConflict`, which the engine does not route through `_recover_disposition_conflict` (only `CurationCommitConflict` is).
- Evidence: temp-DB probe — two threads, same caller/body/`operation_id`, action `supersede`: `[200, 409]`, 409 detail "supersede target is already superseded — the replacement relation must not fork (P4a-T10)"; an immediate sequential retry of the same operation returns 200 (byte-replay of the winner). The shipped PG T11 test only exercises `approve`; in-memory handles the supersede case correctly via `pre_check`-first.
- Why it matters: the T11 ruling's guarantee ("an identical committed binding replays") is unmet for one action type on the durable path under a true race; a client's idempotent retry sees a transient, misleading 409. No fail-open, no partial state (full rollback verified), no data loss, and convergent on retry — hence minor, not blocking.
- Required disposition: carry-forward to the next cortex parcel (engine-level recovery: on `CurationStateConflict` from commit, re-read the binding and replay on fingerprint match — plus a PG identical-concurrent-supersede test).

### F-2 [info] Pre-existing flaky gravity ordering test flickered once in the full run
- Where: `tests/test_gravity_recall_http.py::test_gravity_orders_after_relevance_then_shard_id`.
- Evidence: failed in my first full-suite run, passed in isolation and in the second full run (2456/137, matching the brief); the file and the gravity service are untouched between base `82c2005` and head `efe71bb`.
- Why it matters: timing/ordering-sensitive test outside P4a scope; noted so the count discrepancy on any single run isn't attributed to this parcel.
- Required disposition: informational.

**Verdict rationale:** T10 and T12 are fully implemented and verified by my own true-concurrency and identity probes on both backends; T11 is implemented in-memory and for the PG approve path, with one narrow PG supersede-race residual that is fail-closed, traceless, and self-converging — none of the REQUEST-CHANGES categories. Suite (2456/137), PG curation (7), and lint all match the brief; the rework delta stays within the amended Allowed Files.
