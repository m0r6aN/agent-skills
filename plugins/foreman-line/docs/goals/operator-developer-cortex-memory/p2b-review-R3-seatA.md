# p2b-review-R3-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---


## VERDICT: APPROVE

## TEST RUN
```
cd D:/Repos/opmem-worktrees/cortex-p2b   (head 20d5965; delta git diff aa1ea4c..20d5965 — api.py, recall_events.py + 2 test files only, all within Allowed Files)
.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
  -> 2252 passed, 120 skipped, 2 warnings in 43.99s        (matches expected suite)

KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex \
  .venv/Scripts/python.exe -m pytest tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider
  -> 10 passed, 1 warning in 3.23s                         (temporary DB per run; no DDL against `cortex`)

R2 probes re-run + R3 targeted probes (/tmp/p2b_probe_r3/, in-memory app via TestClient, throw-away):
  T8-a  injected OSError at EVERY spine-append position (0,1,2 of a 3-shard selection) -> 503 retryable;
        event/access/binding/spine counts ALL (0,0,0,0), spine._sequence == 0; identical retry ->
        complete bundle, #spine == #access == 3, event ids match recall_spine_event_id for every shard,
        single anchor timestamp == first_delivered_at. PASS
  T8-b  injected asyncio.CancelledError at positions 0 and 2 -> propagates (CancelledError family, not
        swallowed, not 503); all counts (0,0,0,0); retry completes full bundle. PASS
  T8-c  failed commit, then retry with CHANGED candidates (new 3rd shard) -> 1 event, #spine == #access == 3,
        no orphan spine events from the failed attempt, single anchor timestamp. PASS
  T8-d  rollback-restore preserves PRE-EXISTING unrelated spine events (op_0 delivery committed before
        op_2's injected mid-commit failure survives; sequence intact). PASS
  T9    OSError/TimeoutError/asyncpg.PostgresError -> 503 with "retry" detail; RuntimeError/KeyError ->
        500 "recall failed" without retry wording; all leave zero trace. PASS
  T10   InMemoryRecallStore(object()) / (None) -> TypeError mentioning "non-suspending". PASS
```

## TRIAGE VERIFICATION
- **P2b-T8: IMPLEMENTED** — `InMemoryRecallStore.commit_first_delivery` now snapshots BOTH stores (recall rows + spine `_by_id`/`_by_correlation`/`_by_tenant`/`_sequence`) inside the lock, publishes, and on **any `BaseException`** (including `CancelledError`) restores the exact pre-commit state and re-raises. My R2 F-1 residual is gone: failure at every append position leaves no spine prefix (probed, positions 0–2), cancellation leaves no trace and propagates, identical and changed-candidate retries yield exactly one event with `#spine == #access`, no orphans, single anchor timestamp. The old test accepting the surviving prefix (`len == 1` assertion in `test_two_plane_storage.py`) was removed and replaced with the no-trace invariant; route-level tests (`test_failed_second_spine_append_leaves_no_trace`, `test_failed_commit_then_retry_with_changed_candidates_no_orphans`, `test_cancelled_commit_leaves_no_trace_and_propagates`) and engine-level cancellation test present.
- **P2b-T9: IMPLEMENTED** — catch-all split: `_STORAGE_TRANSPORT_ERRORS` (`OSError`, `TimeoutError`, `asyncpg.PostgresError`) → 503 retryable; any other unexpected exception → 500 `"recall failed"` non-retryable. Specific handlers (fingerprint 409, authorization 409, `RecallError` 500) still take precedence; PG unique violations are wrapped as `RecallCommitConflict` inside the store, so they never mislabel. Both branches tested (`test_non_storage_error_maps_to_500_non_retryable` + updated 503 test asserting "retry" in detail) and probed across 5 exception classes.
- **P2b-T10: IMPLEMENTED** — module and class docstrings document the non-suspending spine-store requirement and why cancellation cannot land mid-publish; constructor raises `TypeError` for anything but `InMemoryRecordStore` (tested + probed). Test fault-injection stores subclass `InMemoryRecordStore`, so the assertion doesn't block them.

## FINDINGS

### F-1 [info] Snapshot-restore mutates spine internals without taking `spine._lock`, and would erase cross-thread appends landed mid-commit
- Where: `src/keon/cortex/spine/recall_events.py` `InMemoryRecallStore.commit_first_delivery` except-branch (`spine._by_id.clear()` etc.).
- Evidence: the restore clears and repopulates `InMemoryRecordStore`'s dicts while holding only the recall store's lock; a hypothetical append from another OS thread between snapshot and restore would be wiped. Probed the reachable case: pre-existing committed spine events survive rollback correctly (T8-d PASS); on the single asyncio event loop the critical section never suspends (T10 guarantee), so no loop-driven writer can interleave, and nothing in the app writes to the spine store from other threads.
- Why it matters: latent hazard of the same class as my R2 F-3 (unsupported pairings/threads only); dev/test store, production PG mode uses a single transaction and is unaffected. Not exploitable, no reachable data loss.
- Required disposition: informational.

### F-2 [info] `asyncpg.PostgresError` in the 503 class includes non-transient Postgres errors
- Where: `src/keon/cortex/api.py` `_STORAGE_TRANSPORT_ERRORS`.
- Evidence: a deterministic Postgres failure (e.g. undefined column after a bad migration) would be labeled 503 "identical retry can complete". Unique violations are already converted to `RecallCommitConflict` and retried internally, so the common races are correct; T8 guarantees the failed commit left no state either way.
- Why it matters: taxonomy granularity only — fail-closed, no state divergence; strictly better than the R2 catch-all this replaces and exactly what T9 ordered ("storage/transport exceptions map to 503").
- Required disposition: informational.
