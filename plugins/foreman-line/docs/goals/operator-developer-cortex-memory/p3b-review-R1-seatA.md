# p3b-review-R1-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE

## TEST RUN
```
.venv/Scripts/python.exe -m pytest tests/gravity -q -p no:cacheprovider
  → 153 passed in 0.41s
.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
  → 1 failed, 2360 passed, 127 skipped (fail: tests/temporal/test_benchmark.py::TestBenchReceiptEmitOverhead::test_receipt_overhead_bounded[50])
.venv/Scripts/python.exe -m pytest tests/temporal/test_benchmark.py -q -p no:cacheprovider
  → 13 passed (the failure is a timing-sensitive perf benchmark, unrelated to P3b; passes in isolation)
KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/test_gravity_postgres.py tests/test_memory_events_postgres.py tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider
  → 17 passed (temporary DB per run; no DDL against `cortex`)
Two-run byte stability (manifest line, outputs to $TMP): cmp run1 run2 → BYTE-IDENTICAL
black --check / isort --check-only on all 19 changed files → clean (EXIT=0)
```
Adversarial verification performed (read-only): 1.0.0 byte-identity confirmed structurally (`function.py` diff is dispatch-only; `forces.py`/`params.py`/`canonical.py` untouched at head, so the base-captured G-9 golden is reproducible by construction — and the golden test passes); 1.1.0 hash covers version+params+`occurrence-classes/1`; unknown kinds fail closed into NO force (occurrence: allowlist; recall: exact `"Recall"` only, selection-side Recall spine rows skipped in projection; association hard-zeroed); Observation id is a deterministic pure function of the (scope-and-tenant-bearing) shard id with PG `ON CONFLICT (tenant_id, event_id) DO NOTHING` and in-memory `_by_id` guard — replay/race cannot mint a second occurrence; S0-1 rollback proven against real PG (forced spine failure ⇒ no shard row, then retry completes); all projection/delivered/session reads are tenant-predicated in SQL (`get_by_correlation_scoped`, `memory_access_delivered WHERE tenant_id=$1`, tenant-scoped recall-event lookup; unresolvable task key drops the row, fail closed); delivered-subset-only influence keyed `(recall_event_id, shard_id)` + `(task_key, memory_id)` dedup defeats re-render/retry/new-operation-id/companion-churn/omitted/undelivered inflation (G-7/G-13/G-14, N-12 tests at fixture AND served-HTTP levels); INV-2 zero-history candidate served at 0.0; `as_of` explicit end-to-end (`gravity/` imports no time source; `epoch_seconds` is pure arithmetic); all touched files within Allowed Files + S0-1 (schema.py untouched — index pre-existed at base, verified via `git show 2930958:…`); fixture edits match the S0-4 sanctioned classes exactly.

## FINDINGS

### F-1 [minor] `api.py` and `recall_accounting.py` reach into private store internals
- Where: `src/keon/cortex/api.py::_commit_new_ingest` (in-memory branch mutates `spine_store._lock/_by_id/_sequence/_by_correlation/_by_tenant`); `src/keon/cortex/services/recall_accounting.py::InMemoryDeliveredAccessReader` (reads `event_store._lock/_delivered`).
- Evidence: diff hunks shown above; duplicated append logic from `InMemoryRecordStore.append` now lives in `api.py`. A future internal change to either store silently breaks these call sites (duck-typed, no protocol). Also the `_commit_new_ingest` docstring claims it holds "the document lock then the spine lock" — it actually releases the document lock before taking the spine lock (correctness still holds: no suspension point between the two steps on the single event loop, and the pre-validated deterministic-id spine insert cannot fail).
- Why it matters: encapsulation/maintainability debt caused by the Allowed-Files restriction (record-store edits limited to "tenant-scoped reads only"; `memory_events.py` frozen by S0-3). Behavior is correct and tested; the coupling is the risk.
- Required disposition: carry-forward to a follow-up parcel (promote an atomic append/delivered-read API onto the stores); informational for P3b.

### F-2 [info] Served-path co-occurrence branch of 1.1.0 is unreachable in production
- Where: `src/keon/cortex/gravity/function_v1_1.py::_occurrence` (co_count loop); `tests/gravity/test_projection_fixtures.py` G-3.
- Evidence: the served projection sets `memory_id = correlation_id = shard id` (P2b S0-2), so `other.memory_id != memory_id` within one correlation never holds — served co_count is always 0. G-3 is honestly pinned at the `HistoryView` level (the test says so explicitly) and does exercise the real `function_v1_1` code path.
- Why it matters: occurrence force on the served path is solo-count only; anyone reading G-3 as a served-path guarantee should know the served spine cannot emit cross-memory correlations today. No integrity risk (it can only under-count, never inflate).
- Required disposition: informational.

### F-3 [info] One flaky, unrelated full-suite failure
- Where: `tests/temporal/test_benchmark.py::test_receipt_overhead_bounded[50]`.
- Evidence: fails in the full run (timing-sensitive overhead bound), passes in isolation; file untouched by this parcel; coordinator head run recorded 2361/127 clean.
- Why it matters: evidence hygiene only — reviewers re-running the suite may see it; it is not P3b-attributable.
- Required disposition: informational.

### F-4 [info] Two test docstrings slightly overclaim their mechanism
- Where: `tests/gravity/test_feedback_non_occurrence.py::test_projection_dedups_identical_influence_rows`; `tests/test_gravity_recall_http.py::test_rejected_event_writes_no_influence`.
- Evidence: (a) the "deterministic influence id" does not itself dedup — `InMemoryHistory` keeps both duplicate events; the +1 invariant actually holds via the `(task_key, memory_id)` dedup in `_recall` (the assertion is still valid). (b) the feedback-neutrality HTTP test uses a `1e-3` tolerance (recency drift between two wall-clock `as_of`s) rather than bit-equality; bit-exact neutrality is proven at the fixture level (G-6/G-11, `test_non_occurrence_kind_changes_no_force`).
- Why it matters: evidence-reading accuracy only; the invariants themselves are proven bit-exactly elsewhere.
- Required disposition: informational.

### F-5 [minor] `epoch_seconds` grammar is slightly more lenient than the served shapes
- Where: `src/keon/cortex/gravity/projection.py::_ISO_TIMESTAMP_RE`.
- Evidence: `\s*` admits whitespace before the zone suffix (e.g. `"...00:00:00 Z"`), and `.strip()` admits padded input; naive timestamps are read as UTC by design. All served timestamps are UTC-normalized by the ingest models, and malformed values fail closed (tested).
- Why it matters: a non-served caller passing a local-naive timestamp would be silently read as UTC — a determinism-adjacent foot-gun, not reachable from the served path today.
- Required disposition: informational.
