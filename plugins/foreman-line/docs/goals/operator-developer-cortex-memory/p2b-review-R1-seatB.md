# p2b-review-R1-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES

## TEST RUN
- `PYTHONDONTWRITEBYTECODE=1 .venv/Scripts/python.exe -m pytest -q -p no:cacheprovider`
  — **2225 passed, 118 skipped**, 2 warnings.
- `PYTHONDONTWRITEBYTECODE=1 KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider`
  — **8 passed**, 1 warning.
- `PYTHONDONTWRITEBYTECODE=1 KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest C:/Users/clint/AppData/Local/Temp/opmem_p2b_seat_b_probes.py -c pyproject.toml -q -s -p no:cacheprovider`
  — **5 failed, 6 passed**. Failures reproduce F-1–F-5. Passing probes cover PostgreSQL concurrency/rollback, legacy isolation, non-default extractor exclusion, and full-string header validation.
- PostgreSQL tests and probes used isolated temporary databases. `git status --short` remained empty.

## FINDINGS

### F-1 [major] Bound retries can substitute a different verified record
- Where: `src/keon/cortex/spine/recall_service.py:179–188`
- Evidence: `test_bound_pg_selection_rejects_wrong_record_at_original_key` first delivered A, then replaced PostgreSQL row A’s payload with another valid, visible record B. Retrying the same operation returned **200 with B**, `verified: true`, and A’s original recall event. `reload_selection()` verifies B’s self-consistency but never checks `record.shard_id == shard_id`.
- Why it matters: T-11’s original-selection guarantee and D11 accounting diverge: B is returned while the durable access row identifies A. A lookup-key/payload identity mismatch must fail closed with 409.
- Required disposition: fix in rework

### F-2 [major] Existing-delivery replay skips authorization recheck after binding
- Where: `src/keon/cortex/spine/recall_events.py:864–878, 928–940`
- Evidence: `test_existing_delivery_pg_rechecks_after_concurrent_revocation` paused a new operation before binding to an existing delivery, deleted its selected shard through a separate PostgreSQL operation, then resumed binding. The response was **200 with the deleted shard**; an immediate retry correctly returned **409**. These successful binding branches return pre-binding `selected_records` instead of reloading the bound selection.
- Why it matters: Revocation during the binding await bypasses ruling 5 and the response-boundary scope check. Successful replay branches need the same current-visibility/integrity validation as existing-operation retries.
- Required disposition: fix in rework

### F-3 [major] In-memory first-delivery commit is not atomic with spine history
- Where: `src/keon/cortex/spine/recall_events.py:447–456`
- Evidence: `test_spine_failure_rolls_back_memory_bundle` injected a failing spine append through the served route. The initial response was **500**, but one event, access row, and binding remained committed with **zero spine events**. Retrying returned **200** without repairing the missing history. Spine appends occur after releasing the recall-store lock.
- Why it matters: The implementation violates the promised event+access+binding+spine atomic unit. An append failure permanently leaves incomplete P3 history, and concurrent readers can observe a binding before its spine bundle is complete.
- Required disposition: fix in rework

### F-4 [minor] Fresh operations report stale verification exclusions
- Where: `src/keon/cortex/api.py:1047–1049`; `src/keon/cortex/spine/recall_events.py:877–878`
- Evidence: `test_new_operation_reports_current_exclusions` delivered a valid record, added a visible tampered record, then recalled under a new operation. Fresh selection excluded the tampered record, but the unchanged delivery key reused the original event and returned `verification_meta.excluded: 0` instead of **1**.
- Why it matters: Ruling 3 requires honest exclusion accounting. Request-level verification metadata is incorrectly taken from the first delivery’s event, hiding exclusions encountered by subsequent fresh selections.
- Required disposition: fix in rework

### F-5 [minor] Foreign-scope rows can exhaust the recall candidate-source budget
- Where: `src/keon/cortex/spine/recall_service.py:140–148`
- Evidence: `test_scope_is_applied_before_tenant_scan_cap` inserted 1,000 role-B records followed by one valid role-A match. Role A’s recall selection was **empty** because the tenant-wide `limit=1000` executes before scope filtering.
- Why it matters: Although foreign rows are not returned, they determine which authorized rows can become candidates. Another role can suppress recall by filling the pre-scope scan budget. Apply scope before candidate-budget truncation, rather than inheriting this limitation from internal search.
- Required disposition: fix in rework
