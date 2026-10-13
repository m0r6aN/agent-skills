# p3a-review-R1-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES
## TEST RUN
```bash
PYTHONDONTWRITEBYTECODE=1 .venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
```
2277 passed, 123 skipped, 2 warnings.

```bash
PYTHONDONTWRITEBYTECODE=1 KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/test_memory_events_postgres.py tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider
```
13 passed, 1 warning.

```bash
PYTHONDONTWRITEBYTECODE=1 KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest C:/Users/clint/AppData/Local/Temp/opmem-seat-b-9jq2reix/test_seat_b_p3a.py -q -s -p no:cacheprovider -c pyproject.toml
```
12 diagnostic probes passed, asserting observed behavior rather than contract compliance. Confirmed findings below; concurrent same-key/new-key access writes and cancellation/partial-index rollback behaved correctly. PostgreSQL probes used disposable databases. Worktree remained clean.

## FINDINGS
### F-1 [major] Cached acknowledgements bypass current reference authorization
- Where: `src/keon/cortex/services/memory_events.py:1218–1249,1293–1302`.
- Evidence: `ingest()` returns `_replay(binding)` before `_resolve()`, including concurrent-winner recovery. A served probe committed access, changed the shard’s persisted profile to a foreign profile, then observed exact-ID retrieval **404**, a fresh memory-event operation **404**, but the identical original-operation retry **200**.
- Why it matters: Fingerprint equality does not establish current record visibility. Cached acknowledgements are returned after their references become unauthorized, violating T-23/N-21’s current-authorization requirement.
- Required disposition: fix in rework

### F-2 [major] Access-linked application accepts an explicitly omitted record
- Where: `src/keon/cortex/services/memory_events.py:1054–1073,1096–1102`.
- Evidence: `_verify_recall_ref()` checks recall scope, selection membership and shard visibility, but not delivered access. A served probe recorded `access_omitted(reason=budget_trimmed)`, then successfully recorded `application` for that recall/record. History became `Recall`, `AccessOmitted`, `Application`, with **zero delivered-access rows**.
- Why it matters: Selection is not the adapter-delivered subset under T-33. The route permits an application claim anchored to a record explicitly reported as never delivered, defeating the fabricated-accounting boundary.
- Required disposition: fix in rework

### F-3 [major] Duplicate record IDs produce inconsistent accounting and PostgreSQL failure
- Where: `src/keon/cortex/services/memory_events.py:193–201,213–222,1088–1094,1149–1207,1255–1263`.
- Evidence: `record_ids` accepts duplicates, and row construction preserves them. Posting `[M, M]` for a one-record selection returned **200** in memory with **two non-replay-equivalent event rows**, one delivered row and one `Access` spine event. The identical served PostgreSQL request returned **500** after repeatedly conflicting on its own duplicate delivered key; the transaction rolled back.
- Why it matters: One valid input has different behavior across storage modes. In-memory per-record event accounting is inflated, while PostgreSQL misclassifies an intra-request duplicate as a concurrent-write race.
- Required disposition: fix in rework

### F-4 [major] New omission reports silently lose their spine history
- Where: `src/keon/cortex/services/memory_events.py:1148,1177–1194`.
- Evidence: `AccessOmitted` uses a spine ID derived only from `(recall_event_id, record_id, kind)`. In both served storage modes, two omission operations with different reasons and explicit times returned **200**, each with `replayed: false`, and stored two event rows/bindings—but only **one `AccessOmitted` spine event**.
- Why it matters: The second accepted event’s reason/time is absent from spine history. Ruling 7 requires each accepted event there; S0-3’s audit-without-another-spine-event exception applies to duplicate delivered `access`, not omissions.
- Required disposition: fix in rework

### F-5 [minor] Identical retries do not replay the original response bytes
- Where: `src/keon/cortex/services/memory_events.py:1023–1034,1223–1235`; `tests/test_memory_events_http.py:607–638`.
- Evidence: A served first response contained `"replayed":false`; its identical retry contained `"replayed":true`. The stored response is reconstructed rather than replayed unchanged. Existing tests check selected fields, not response-byte identity.
- Why it matters: This contradicts the brief’s byte-identity requirement and ruling 5’s original-body replay requirement. Sorting response keys cannot resolve the changed value.
- Required disposition: fix in rework

### F-6 [info] New-operation feedback deduplication remains unproven
- Where: `src/keon/cortex/services/memory_events.py:340–359,1149–1159,1255–1263`; `tests/test_memory_events_http.py:578–600`.
- Evidence: Identical feedback submitted under two operation IDs produced two event rows and two `Feedback` spine events, both acknowledged as fresh. The test labelled N-12 exercises only the same operation ID.
- Why it matters: P3a currently has no score effect, so duplicate history does not presently multiply scoring influence. P3b must explicitly deduplicate correlated feedback and test new-key replay through its served projection; the existing test is not evidence for that requirement.
- Required disposition: carry-forward to OPMEM-P3b
