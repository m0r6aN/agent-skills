# p3b-review-R1-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES
## TEST RUN
- `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider` — repeat run: **2361 passed, 127 skipped**. First run: 2360 passed, 127 skipped, one temporal benchmark failure (receipt overhead 3.13× versus 3.0×).
- `.venv/Scripts/python.exe -m pytest 'tests/temporal/test_benchmark.py::TestBenchReceiptEmitOverhead::test_receipt_overhead_bounded[50]' -q -p no:cacheprovider` — **1 passed**.
- `.venv/Scripts/python.exe -m pytest tests/gravity tests/test_gravity_recall_http.py -q -p no:cacheprovider` — **161 passed**.
- `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/test_gravity_postgres.py tests/test_memory_events_postgres.py tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider` — **17 passed**, using temporary databases.
- Two subprocess runs of `.venv/Scripts/python.exe -c "import json,sys; sys.path.insert(0,'tests/gravity'); from test_projection_fixtures import fixture_outputs; print(json.dumps(fixture_outputs(),sort_keys=True))"` — **byte-identical**, SHA256 `92393df0fade5c6124b3fbda3dec261b136d53bce991d7dc0f5a308c58014480`.
- Black `--check` and isort `--check-only` on all 19 changed Python files — **passed**.
- Inline `.venv/Scripts/python.exe -` adversarial probes — reproduced cross-role scoring influence, partial in-memory publication, failed-ingest retry without Observation, and fresh-response ordering inconsistent with returned scores.
- `git status --short` — clean; no repository edits.

## FINDINGS
### F-1 [major] Candidate visibility does not isolate another role’s recall history
- Where: `src/keon/cortex/services/recall_accounting.py:58–102,143–209`; `src/keon/cortex/spine/recall_service.py:236–240`.
- Evidence: The scorer receives only tenant and candidate IDs, not caller scope. Both delivered readers retrieve every tenant-matching delivery for those IDs. Non-empty task IDs bypass recall-event lookup entirely; fallback lookup checks tenant but not role/profile. In a fixed-time served HTTP probe, roles A and B could read the same profile-shared shard. B’s attempt to reference A’s recall was correctly rejected with **404**, yet A’s delivery changed B’s gravity score from **0.0 to 0.08107144632819592**.
- Why it matters: Sharing content does not authorize sharing private role activity. This violates ruling 6’s caller-scope history filtering and exposes otherwise inaccessible delivery activity through scores and ordering. Carry caller scope into accounting and enforce history authorization independently of candidate visibility; add shared-record cross-role/profile regression tests.
- Required disposition: fix in rework

### F-2 [major] In-memory ingest publishes a partial bundle and cannot repair failed Observation insertion
- Where: `src/keon/cortex/api.py:632–714`, especially `685–702`; retry branches at `1044` and `1129`.
- Evidence: `await store.upsert(record)` releases the document lock before the spine lock is acquired; no bundled rollback exists. Holding the spine lock while running the normal commit implementation exposed a readable shard with no Observation while ingest remained blocked. A separate served failure-injection probe raised during Observation `stored_at` construction: first request returned **503**, identical retry returned **200**, but storage retained **one shard, zero Observations**, and spine sequence **1**. Retry sees the existing shard and skips Observation creation.
- Why it matters: Hash prevalidation does not guarantee insertion cannot fail or provide cross-thread atomicity. The implementation contradicts ruling 3’s all-or-nothing memory discipline, permanently loses occurrence accounting, and acknowledges an incomplete ingest on retry. Use a non-suspending bundled commit holding both locks with journaled rollback, and test partial publication, insertion failures, cancellation/suspending pairings, and retry recovery.
- Required disposition: fix in rework

### F-3 [major] Fresh recall sorts and labels using different history reads
- Where: `src/keon/cortex/spine/recall_service.py:235–260`; `src/keon/cortex/spine/recall_events.py:1056–1084,1099–1102`.
- Evidence: Fresh selection scores and sorts candidates, then `_serve_committed` scores the reloaded selection again after intervening awaits. A deterministic concurrency probe inserted a valid delivery report for an earlier recall between those passes. The fresh response reported `replayed: false`, equal relevance scores `[1.0, 1.0]`, and gravity scores **`[0.2683010746090859, 0.3493725209372818]`** in returned rank order.
- Why it matters: The returned ranks contradict the required relevance-descending, gravity-descending ordering under the response’s own labels. Explicit `as_of` does not freeze durable history when reports can arrive with earlier occurrence times. Preserve the fresh selection’s scoring snapshot through the post-binding authorization/integrity reload, or otherwise ensure fresh ordering and labels use the same history snapshot without changing bound retry membership.
- Required disposition: fix in rework
