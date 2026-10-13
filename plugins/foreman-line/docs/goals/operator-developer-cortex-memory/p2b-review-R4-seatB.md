# p2b-review-R4-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES

## TEST RUN
All pytest runs used `PYTHONDONTWRITEBYTECODE=1`. Below, `T` denotes `C:/Users/clint/AppData/Local/Temp`.

- `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider`
  — **2253 passed, 120 skipped**, 2 warnings.
- `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider`
  — **10 passed**, 1 warning; isolated temporary databases.
- `.venv/Scripts/python.exe -m pytest $T/opmem_p2b_R3_seat_b_thread_probes.py $T/opmem_p2b_R3_seat_b_probes.py -c pyproject.toml -q -p no:cacheprovider --tb=short`
  — **44 failed**: original injection points are bypassed by the new internal insert helper. These failures alone do **not** establish a product defect.
- `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest $T/opmem_p2b_R2_seat_b_probes.py -c pyproject.toml -q -p no:cacheprovider --tb=short`
  — **10 passed, 5 failed**; the five failures likewise target the bypassed memory-store append seam.
- `.venv/Scripts/python.exe -m pytest $T/opmem_p2b_R4_seat_b_ported_probes.py $T/opmem_p2b_R4_seat_b_thread_and_integrity_probes.py -c pyproject.toml -q -s -p no:cacheprovider --tb=short`
  — **26 passed, 20 failed**. R3 assertions ported to the new publish seam: all before-insert cases and exception taxonomy pass; all 18 after-insert rollback cases fail. The adapted thread probe passes; two retry-integrity probes fail.
- `.venv/Scripts/python.exe -m pytest $T/opmem_p2b_R4_seat_b_partial_index_probe.py -c pyproject.toml -q -s -p no:cacheprovider --tb=short`
  — **1 failed**, demonstrating accounting loss with the unmodified production insert helper.
- Head verified as `9fbd9dd`; `git status --short`, `git diff --stat`, and delta whitespace check remained empty.

## TRIAGE VERIFICATION
**P2b-T11: PARTIAL** — holding the spine’s own lock closes the original cross-thread prefix exposure and independent-writer deletion. The adapted thread probe confirms both. However, rollback journals an event only **after** its insert helper returns, so exceptions during or immediately after insertion leave unowned spine history. This regresses the previously verified all-or-nothing accounting invariant.

## FINDINGS
### F-1 [major] Rollback misses the failing spine insert, leaving orphan or incomplete recall history
- Where: `src/keon/cortex/spine/recall_events.py:543–561, 575–587`.
- Evidence:
  - `_insert_spine_locked()` mutates the spine before `inserted_spine_ids.append()` records rollback ownership. If the helper raises after mutation, cleanup never visits that event.
  - Served-route probes injecting failure immediately after insertion return 503 with **event/access/binding/spine counts `(0, 0, 0, 1)`**. An identical retry retains the failed attempt’s timestamp. A changed-candidate retry returns three records but leaves **four spine events**, including one orphan.
  - A separate probe uses exactly the concrete stores and the **unmodified production helper**, injecting a one-shot `MemoryError` at its final tenant-index list append. Earlier indexes retain the unjournaled record. The next request succeeds with **two results and two access rows, but tenant spine history contains only one corresponding Recall event**: the existing-id shortcut skips repairing the partial insert.
- Why it matters: A failed request can publish uncommitted recall history, and a successful retry can lose accounting from the history surface P3 consumes. The shared lock prevents concurrent observation during publication, but does not make rollback complete. PostgreSQL tests remain green; this defect affects the default in-memory implementation.
- Required disposition: fix in rework — establish rollback ownership before mutation and clean up partially populated indexes and sequence state without touching pre-existing events. Add served-route regressions for failures during and after insertion, identical and changed-candidate retries, while retaining the concurrent-writer preservation test.
