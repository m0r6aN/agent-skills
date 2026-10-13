# p3b-review-R3-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES
## TEST RUN
- `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider` — **2373 passed, 130 skipped**.
- `.venv/Scripts/python.exe -m pytest tests/gravity tests/test_gravity_recall_http.py -q -p no:cacheprovider` — **173 passed**.
- `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/test_gravity_postgres.py tests/test_memory_events_postgres.py tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider` — **20 passed**, using temporary databases.
- `.venv/Scripts/python.exe C:/Users/clint/AppData/Local/Temp/p3b_r2_seatB_probes.py` — earlier probes passed; stopped at the obsolete assertion expecting the R2 defect. Temporary `p3b_r3_seatB_r2_recheck.py`, with corrected expectations, **passed**, including three identical repair retries.
- `.venv/Scripts/python.exe -m pytest C:/Users/clint/AppData/Local/Temp/test_p3b_r3_seatB_probes.py -q -s -c pyproject.toml -p no:cacheprovider` — **19 passed, 2 skipped**: failures before/after primary publication, correlation insertion/append and tenant insertion/append; missing and partially indexed repair states; three identical retries. Skips cover primary insertion, which partial-primary repair does not perform. Includes reproduction of F-1; isolated concurrency reproduction also succeeded **three consecutive times**.
- Black `--check` and isort `--check-only` on all three changed Python files — **passed**. `git status --short` / `git diff --stat` — **clean; no repository edits**.

## TRIAGE VERIFICATION
**P3b-T5: PARTIAL** — sequential repair rollback, partial-index completion and repeated retries are fixed. The unlocked “fully indexed” shortcut can acknowledge another repair’s uncommitted Observation, which is subsequently rolled back.

## FINDINGS
### F-1 [major] Concurrent retry acknowledges an Observation that another repair rolls back
- Where: `src/keon/cortex/api.py:728–730`; `src/keon/cortex/providers/memory/document_store.py:213–221,260–275`.
- Evidence: The temporary `test_concurrent_success_can_observe_uncommitted_repair` uses the same application and stores across two request threads. Starting with the shard present and its Observation missing, request B pauses immediately before the fully-indexed check. Request A publishes all Observation indexes while holding both store locks. B resumes: the predicate reads without either lock, sees those uncommitted indexes and returns **200**, skipping repair. An injected failure immediately after A’s insertion causes A to roll back and return **503**. Final state: **zero Observations in every index**, empty tenant-scoped occurrence history and served gravity **0.0**.
- Why it matters: The successful acknowledgement does not establish completed occurrence accounting. Ordinary recall does not repair this state; the successfully acknowledged caller must unexpectedly ingest again to restore it. This defeats the failure-safe publication boundary and loses scoring accounting under concurrent repair.
- Required disposition: **fix in rework** — remove the unlocked shortcut and always invoke `commit_spine_repair`, which already checks completeness under both locks, or perform the public completeness check under those locks. Add a concurrent repair/rollback regression requiring every **200** acknowledgement to correspond to a committed, fully indexed Observation.
