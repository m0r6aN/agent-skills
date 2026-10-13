# p3b-review-R2-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE

## TEST RUN
```
.venv/Scripts/python.exe -m pytest tests/gravity -q -p no:cacheprovider
  → 153 passed in 0.41s
.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
  → 2370 passed, 130 skipped (matches the expected suite; the flaky test_receipt_overhead_bounded[50] benchmark passed on this run — no rerun needed)
KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/test_gravity_postgres.py tests/test_memory_events_postgres.py tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider
  → 20 passed (temporary DB per run; no DDL against `cortex`)
Two-run byte stability (manifest fixture_outputs() serialized twice to %TEMP%): cmp run1 run2 → BYTE-IDENTICAL
black --check / isort --check-only on all 9 rework-changed files → clean (EXIT=0)
Rework delta audit: git diff 044ca66..f172627 — gravity math untouched (forces.py / params.py / function.py / function_v1_1.py / projection.py / contracts.py absent from the delta, so R1's 1.0.0 byte-identity and hash-coverage probes hold by construction; G-9 golden test re-passed in the gravity run); all touched files within Allowed Files + S0-1 + the P3b-T2 amendment (memory/document_store.py) + the P3b-T3 sanctioned binding column (schema.py ALTER ... ADD COLUMN IF NOT EXISTS gravity_snapshot JSONB, additive).
```

## TRIAGE VERIFICATION
P3b-T1: IMPLEMENTED — `_resolve_influences` now resolves the tenant-scoped recall event for EVERY delivered row (never skipped for non-empty `task_id`), fails closed on an unresolvable event, and drops rows whose event `role_id`/`profile_id` differ from the caller's; both `select` and the legacy fallback `gravity_totals` pass the caller's role/profile. Occurrence stays shared (tenant-scoped correlation read only). Regression present at all three levels: served HTTP (`test_cross_role_deliveries_do_not_change_my_score` — bit-exact at a patched fixed `as_of`, A's own score rises), scorer-level in-memory (`test_scorer_confines_recall_influence_to_role_and_profile`), and real PG (`test_pg_recall_influence_is_confined_to_role_and_profile`).

P3b-T2: IMPLEMENTED — `api.py` no longer touches store privates; `InMemoryDocumentStore.commit_ingest_bundle` is one non-suspending section holding the document lock then the spine lock (matching P2b/P3a lock order; no reverse-order path exists, so no deadlock), with pre-section hash validation, journaled rollback on `BaseException` (prior shard value restored; owned spine ids removed from every index; sequence restored only when nothing foreign sits above it), and sequence published last. Repair rule in both modes: the replay/race branches call `_ensure_observation` (deterministic, tenant-bearing id — shard id embeds tenant/role/profile/scope via `make_scoped_candidate_shard_id`, so the unscoped `get(id)` cannot cross tenants), idempotent append. Tests cover spine-insert failure, cancellation, idempotent id, cross-thread partial-state reader, and repair-on-acknowledged-ingest, plus PG rollback/retry-completion and `test_pg_missing_observation_is_repaired_on_ingest`.

P3b-T3: IMPLEMENTED — `ShardSelection.gravity_snapshot` freezes the one scoring read (version, function hash, `as_of`, per-record scores over ALL eligible candidates, superset of the bound selection, so `_items` never falls to its 0.0 default on this path); it is stored on the binding (additive nullable `gravity_snapshot JSONB`, PG insert/read wired symmetrically with legacy-row tolerance) and the committed/retry responses order AND label from it — the post-binding reload re-checks membership/visibility/integrity only; only pre-P3b bindings (snapshot NULL) fall back to a caller-scoped re-score. Tested: `test_binding_retry_returns_original_ranks_and_snapshot`, `test_fresh_selection_orders_and_labels_from_one_snapshot`, `test_fresh_response_labels_are_snapshot_consistent` (deterministic concurrency probe), and PG `test_pg_binding_stores_and_replays_gravity_snapshot`.

## FINDINGS

### F-1 [minor] Cross-store private access survives, relocated into the provider layer
- Where: `src/keon/cortex/providers/memory/document_store.py::{_insert_spine_locked,_remove_spine_locked,_spine_fully_indexed,commit_ingest_bundle}`.
- Evidence: the P3b-T2 ruling ("promote the needed atomic helpers onto the stores instead of touching private fields from `api.py`") is satisfied for `api.py`, but the bundle helper on `InMemoryDocumentStore` still manipulates `InMemoryRecordStore._lock/_by_id/_by_correlation/_by_tenant/_sequence` directly (guarded by an `isinstance` TypeError, in-memory mode only). A future internal change to the record store's indexing silently breaks the bundle.
- Why it matters: residual of R1 A F-1 — encapsulation debt, not a correctness defect; behavior is correct, rollback/partial-state/cancellation are all tested, and PG mode is unaffected.
- Required disposition: carry-forward to a follow-up parcel (a protocol-level locked-bundle API on `InMemoryRecordStore`); informational for P3b.

### F-2 [info] Repaired Observation takes the repairing request's receive time
- Where: `src/keon/cortex/api.py::_ensure_observation` (both replay branches pass `received_at = _now_utc()` of the current request).
- Evidence: a repair after a partially failed ingest mints the Observation with `occurred_at` = the repairing replay's receive time, not the shard's originally stored receive time. The deterministic id (pure function of the tenant-bearing shard id) plus PG `ON CONFLICT DO NOTHING` / in-memory `_by_id` guard means exactly one Observation ever lands — first repairer wins; no duplicate, no inflation (occurrence counts, not timestamps, drive the force magnitude; recency uses the landed `occurred_at`).
- Why it matters: which wall-clock instant becomes the occurrence time depends on when the first acknowledged retry arrives — a mild determinism nuance consistent with ruling 3's letter ("the ingest's explicit receive time"), since the repairing request is itself an ingest.
- Required disposition: informational.

### F-3 [info] Corrupt/partial binding snapshot would surface as an unhandled 500
- Where: `src/keon/cortex/api.py` recall handler (`snapshot["gravity_version"]` / `["gravity_function_hash"]` / `["gravity_as_of"]` indexing); `recall_events.py` uses defensive `.get("scores", {})` but the label reads do not.
- Evidence: a non-NULL `gravity_snapshot` JSONB missing a label key (never produced by this code — `select` always writes all four keys) would raise `KeyError` outside the engine's try/except and return a generic 500. Not reachable from any code path in the parcel; would require out-of-band row corruption.
- Why it matters: robustness nit only; fail behavior is a refusal, never wrong labels or wrong ordering.
- Required disposition: informational.
