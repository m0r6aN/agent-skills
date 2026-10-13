# p3b-review-R2-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES
## TEST RUN
- `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider` — final run: **2370 passed, 130 skipped**. Initial run failed only the known `[50]` timing benchmark; its isolated rerun passed.
- `.venv/Scripts/python.exe -m pytest tests/gravity tests/test_gravity_recall_http.py -q -p no:cacheprovider` — **170 passed**.
- `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/test_gravity_postgres.py tests/test_memory_events_postgres.py tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider` — **20 passed**, using temporary databases.
- `.venv/Scripts/python.exe C:/Users/clint/AppData/Local/Temp/p3b_r2_seatB_probes.py` — independently reran all three R1 probes: original cases fixed; reproduced the repair-path accounting loss below.
- PG temp probe, `test_p3b_r2_seatB_pg.py`, run with the database environment above and `-q -s -c pyproject.toml -p no:cacheprovider` — **1 passed**: served shared-record cross-role isolation and persisted snapshot replay.
- Two fixture-output subprocess runs — **byte-identical**, SHA256 `92393df0fade5c6124b3fbda3dec261b136d53bce991d7dc0f5a308c58014480`.
- Black `--check` and isort `--check-only` on all **22 changed Python files** — **passed**.
- `git status --short` / `git diff --stat` — clean; no repository edits.

## TRIAGE VERIFICATION
- **P3b-T1: IMPLEMENTED** — every delivered row joins its tenant-scoped recall event and checks role/profile. Independent served probes showed bit-exact cross-role scores in both storage modes.
- **P3b-T2: PARTIAL** — first-ingest publication, rollback and original failed-ingest retry are fixed; missing-Observation repair still bypasses the failure-safe bundle and can acknowledge permanently lost scoring accounting.
- **P3b-T3: IMPLEMENTED** — fresh ordering and labels share one snapshot; bindings persist and replay it. The independent between-read delivery probe no longer produces inconsistent ranks.

## FINDINGS
### F-1 [major] Failed Observation repair leaves an unindexed occurrence that subsequent retries acknowledge
- Where: `src/keon/cortex/api.py:693–716`; `src/keon/cortex/spine/record_store.py:107–121`.
- Evidence: Starting from the explicitly supported repair state—shard present, Observation missing—the temp probe injected one transient correlation-index failure during repair. `InMemoryRecordStore.append` had already published `_by_id` before the failure. Repair returned **503**; the identical retry returned **200**, because `_ensure_observation` checks only primary-ID existence. Storage retained **one primary Observation, zero tenant-scoped correlation-history Observations**, and served gravity remained **0.0**. The same injected fault on first ingest rolled back completely, confirming this residual is specific to repair.
- Why it matters: A failed repair permanently loses occurrence/recency accounting from the scorer while acknowledging the ingest as complete. Further identical retries skip repair. This leaves P3b-T2’s failure-safe repair and retry-recovery requirement unmet.
- Required disposition: fix in rework — use a failure-safe, fully-index-aware store helper for in-memory repairs; repair partially indexed Observations rather than treating primary-ID presence as completion. Add repair-path mid-index failure and repeated-retry regressions.
