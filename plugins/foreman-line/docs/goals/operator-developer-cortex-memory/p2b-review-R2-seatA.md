# p2b-review-R2-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE

## TEST RUN
```
cd D:/Repos/opmem-worktrees/cortex-p2b   (head aa1ea4c; rework delta git diff d9ffefe..aa1ea4c — api.py, recall_events.py, recall_service.py + 3 test files only, all within Allowed Files)
.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
  -> 2246 passed, 120 skipped, 2 warnings in 47.70s        (matches expected suite)

KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex \
  .venv/Scripts/python.exe -m pytest tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider
  -> 10 passed, 1 warning in 3.42s                         (temporary DB per run; no DDL against `cortex`)

R1 probes re-run + T1–T5 probes ($TMPDIR/p2b_probe_r2/, in-memory app via TestClient, throw-away):
  P1  record deleted / re-stamped under same op+fingerprint -> 409 selection_no_longer_authorized; binding intact;
      other-scope same op -> fresh empty delivery, different event (N-21, no cross-scope read). PASS
  P2/P4/P6  cross-actor & different query/limit, same content set -> same event, replayed:true, exactly one event. PASS
  P5  changed fingerprint + revoked -> 409 fingerprint conflict (precedence unchanged). PASS
  T1  self-consistent, visible record substituted under the bound key -> 409 (shard_id + tenant re-check). PASS
  T2  revocation injected after durable commit, before reload -> 409, no results; binding/event persist; retry stays 409. PASS
  T3  injected spine failure -> 503 retryable; event/access/binding rolled back; retry completes full bundle.
      Multi-shard variant: spine event appended BEFORE the failing append remains visible (see F-1). 
  T4  tampered co-candidate: first delivery excluded=1/first_excluded=1; after removal, replay reports current
      excluded=0 with anchored first_excluded=1; truncated:false present. PASS
  T5  1500 invisible same-tenant rows + 1 match beyond old 1000-row bound -> match selected, truncated:false;
      CORTEX_RECALL_SCAN_MAX=100 with 151 rows -> truncated:true; malformed env -> RuntimeError at app creation. PASS
```

## TRIAGE VERIFICATION
- **P2b-T1: IMPLEMENTED** — `reload_selection` now requires `record.shard_id == bound id` and `record.tenant_id == tenant` before visibility/identity checks; served-route probe returns 409 on a self-consistent substituted payload; in-memory (`test_bound_retry_rejects_substituted_payload`) and PG (`test_pg_bound_retry_rejects_substituted_payload`) tests present.
- **P2b-T2: IMPLEMENTED** — all three success branches (fresh first delivery, existing-delivery new binding, binding retry) assemble the response via `_serve_committed`/`_outcome_from_binding` reload after the binding is durable; failure ⇒ 409, binding kept, retries stay 409 (probed); deterministic hook tests in memory and PG (`_HookedRecallStore`, `test_pg_revocation_after_commit_fails_closed`).
- **P2b-T3: PARTIAL** — rows (event/access/binding) are committed and rolled back as one lock-held unit with hash pre-validation, readers never see a partial recall-store bundle, and a retry produces the complete bundle (probed + tested). Residual: spine events appended before a mid-commit failure are not rolled back and stay visible until a retry (see F-1); only reachable via fault injection, and openly asserted in the builder's own test.
- **P2b-T4: IMPLEMENTED** — `verification_meta.excluded` reports this response's pass (fresh pass exclusions; 0 on fail-closed binding-retry reload); anchored count exposed as `delivery.first_excluded`; probe reproduces my R1 P3 scenario with the corrected semantics; tests for both paths present.
- **P2b-T5: IMPLEMENTED** — paged scan (page 1000) with per-page scope filtering, hard cap `CORTEX_RECALL_SCAN_MAX` (default 20000) read once at app creation, fail-closed on malformed; cap sets `verification_meta.truncated: true`, never silent; probes confirm needle beyond the old bound is selected and cap signalling; indexed scoped query correctly deferred (P2b-T7).

## FINDINGS

### F-1 [minor] T3 residual: spine-event prefix survives a failed in-memory commit
- Where: `src/keon/cortex/spine/recall_events.py` `InMemoryRecallStore.commit_first_delivery`; asserted in `tests/test_two_plane_storage.py::TestInMemoryRecallStoreAtomicity` (line ~1086).
- Evidence: probe — 2-shard selection, injected failure on the second spine append ⇒ 503, all recall-store rows rolled back, but 1 spine event remains in the record store; a spine reader sees a `Recall` history event whose `recall_event_id` has no event/access rows until the client retries (retry converges, no duplicates).
- Why it matters: the T3 ruling says "on any failure nothing is visible"; the spine plane only honors this up to the failing append. Practically unreachable without fault injection (content hashes pre-validated, `InMemoryRecordStore.append` is idempotent and otherwise infallible), rows are never partial, and the gap is openly documented and tested — so not an accounting duplication/loss under the R2 threshold.
- Required disposition: informational (coordinator may note it alongside the memory-mode atomicity caveat already accepted in R1 triage).

### F-2 [info] Broad `except Exception` labels any engine failure "retryable" 503
- Where: `src/keon/cortex/api.py` `/v1/recall` route (new catch-all after `RecallError`).
- Evidence: any non-recall exception — including a deterministic programming error — becomes `503 "recall storage failed; an identical retry can complete"`.
- Why it matters: fail-closed (no results, no partial state served), but a permanent bug would be mislabeled as transient, inviting infinite client retries; specific exceptions (fingerprint conflict, 409s, `RecallError`) are correctly handled first.
- Required disposition: informational.

### F-3 [info] In-memory commit awaits `spine.append` while holding a `threading.Lock`
- Where: `InMemoryRecallStore.commit_first_delivery` critical section.
- Evidence: safe today because `InMemoryRecordStore.append` contains no suspension points (verified), and the docstring states the assumption; `InMemoryRecallStore.__init__` accepts any `RecordStore`, so injecting a genuinely-async store (e.g. the Postgres record store) would suspend the event loop while holding the lock.
- Why it matters: latent hazard only for unsupported store pairings; production PG mode uses `PostgresRecallStore` with a single transaction (unaffected).
- Required disposition: informational.
