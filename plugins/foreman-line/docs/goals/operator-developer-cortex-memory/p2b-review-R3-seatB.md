# p2b-review-R3-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES

## TEST RUN
- `PYTHONDONTWRITEBYTECODE=1 .venv/Scripts/python.exe -m pytest -q -p no:cacheprovider`
  — **2252 passed, 120 skipped**, 2 warnings.
- `PYTHONDONTWRITEBYTECODE=1 KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider`
  — **10 passed**, 1 warning; isolated temporary databases.
- `PYTHONDONTWRITEBYTECODE=1 KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest C:/Users/clint/AppData/Local/Temp/opmem_p2b_R2_seat_b_probes.py -c pyproject.toml -q -s -p no:cacheprovider`
  — **15 passed**; all R2 probes now pass.
- `PYTHONDONTWRITEBYTECODE=1 .venv/Scripts/python.exe -m pytest C:/Users/clint/AppData/Local/Temp/opmem_p2b_R3_seat_b_probes.py -c pyproject.toml -q -p no:cacheprovider`
  — **43 passed**: failures before/after every append position, including cancellation; identical/changed-candidate retries; preservation of previous deliveries; exception taxonomy.
- `PYTHONDONTWRITEBYTECODE=1 .venv/Scripts/python.exe -m pytest C:/Users/clint/AppData/Local/Temp/opmem_p2b_R3_seat_b_thread_probes.py -c pyproject.toml -q -s -p no:cacheprovider`
  — **1 passed**, intentionally reproducing F-1.
- Head verified as `20d5965`; `git status --short` and `git diff --stat` remained empty.

## TRIAGE VERIFICATION
- **P2b-T8: PARTIAL** — single-event-loop failure/cancellation rollback and retry integrity are repaired. The snapshot/restore does not share the spine’s lock, allowing cross-thread readers to observe prefixes and rollback to delete an independently committed spine append. See F-1.
- **P2b-T9: IMPLEMENTED** — tested storage/transport failures produce retryable 503; unexpected programming/invariant exceptions produce non-retryable 500.
- **P2b-T10: IMPLEMENTED** — the non-suspending spine requirement is documented and incompatible store types are rejected. Non-suspension alone does not establish thread-level atomicity.

## FINDINGS
### F-1 [major] Whole-spine rollback can erase another thread’s successfully committed event
- Where: `src/keon/cortex/spine/recall_events.py:480–521`; `src/keon/cortex/spine/record_store.py:79–133`.
- Evidence: The throw-away served-route probe uses exactly `InMemoryRecallStore` and `InMemoryRecordStore`, with synchronous fault/pause injection at the second spine append—no asynchronous yield. While `/v1/recall` is paused after its first append, another thread’s public `spine.scan()` observes the incomplete prefix, and public `spine.append()` successfully commits an unrelated event. Releasing the injected failure returns 503, but rollback deletes that unrelated event from every index: `spine.get()` changes from a stored record to **None**, and the sequence resets to **0**. This requires an independent cross-thread spine writer; ordinary same-loop recall retries pass.
- Why it matters: Both stores advertise thread safety, but the recall transaction holds only its own lock. The snapshot and wholesale restoration bypass `spine._lock`, so a failed recall can delete successfully committed append-only history. The same missing shared boundary exposes partial bundles to cross-thread spine readers, contrary to P2b-T8.
- Required disposition: fix in rework — coordinate snapshot, publication, rollback, and spine reads/writes through a shared transaction boundary; add a deterministic concurrent-writer preservation test.
