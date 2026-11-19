---
ticket: CTX-P3a
title: Postgres append-only event guards, role split, and exact-idempotent append
status: draft
owner: clinton.morgan
created: 2026-10-30
updated: 2026-10-30
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - src/keon/cortex/providers/postgres/schema.py
  - src/keon/cortex/spine/postgres_record_store.py
  - scripts/postgres_test_setup.py
  - scripts/owner_migrations.py
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: equivalence-provable
expertise: security
thinking_level: high
---

## Intent

Make the served Postgres spine durably append-only for the application role: database-level guards (triggers plus REVOKE) on `spine_events`, `memory_events`, `recall_events`; a real owner/migration role split; exact-idempotent append (same event retry succeeds, same `(tenant_id, event_id)` with different `content_hash` raises a conflict error instead of silently succeeding, including under a write race); and a deletion path that exists only as a refusing stub until P11/P13 authorize it. This is charter P3a / S1 G3 / S3 P3a (T3.1–T3.4): the durable-boundary hardening that P3b/P6/M3 build on. Shard tables are deliberately **not** guarded yet (P12).

## Constraints

Dependencies: P0 hazard-2 disposition (CD-1). Adopted proposed default: migrations are owner-run and idempotent via `scripts/owner_migrations.py`; the application startup path validates schema/version and privilege expectations **without** production DDL; dev/test bootstrap may remain explicit (`scripts/postgres_test_setup.py`). The reconciliation with S3's `initialize_schema` wording is recorded in the P0 contract-decision register before dispatch — if the developer dispositions differently, this draft is amended before work starts. The migration privileges must not belong to the request-serving process.

Hazard 3 / CD-3: DN6's transaction-local session flag is not purge authorization by itself (ordinary clients can set custom GUCs). The only deletion path is the frozen `SECURITY DEFINER` boundary — fixed search path, explicit EXECUTE grants, no PUBLIC grant, validated authorization and atomic range replacement — shipped here as `purge_erasure_set`-shaped stub that **always refuses** until P11/P13. No permissive deletion stub ships, ever. Do not blindly add UPDATE-denial to `shards` or anywhere mutable-lifecycle semantics still rely on updates (hazard 4): supersession, idempotent ingest, CCM and erasure paths must keep working.

Attack-surface rule (charter §8.1): all tamper probes run as the app role against disposable databases/containers only — never raw SQL mutation against live or demo infrastructure. CI fails if the required DSN is absent (no silent skip) — this relies on the existing `.github/workflows/ci.yml` skip-guards (L106/L164) covering new tests under `tests/`; any workflow change needed is a hook handed to the CI integration owner (§6.3), never edited in-parcel. One writer at a time for schema/migrations (charter §6.3 Stream B).

## Allowed Files

- src/keon/cortex/providers/postgres/schema.py
- src/keon/cortex/spine/postgres_record_store.py
- scripts/postgres_test_setup.py
- scripts/owner_migrations.py
- tests/test_postgres_providers.py
- tests/test_postgres_roundtrip.py
- tests/spine/test_record_store_boundaries.py
- tests/test_p3a_append_guards.py
- tests/test_owner_migrations.py

## Migration & Compatibility

Migrations are idempotent and owner-run; a fresh database and an existing populated database both reach the same guarded schema without data loss. Existing rows remain valid; no historical IDs or receipts change. The app role becomes INSERT+SELECT-only on guarded tables; any existing code path that UPDATEs/DELETEs those tables must be surfaced by tests before guards land (failures here are findings, not reasons to relax guards). Restart/upgrade under the restricted app role is tested.

## Acceptance Criteria

AC-1 (T3.1): as the app role, `UPDATE`, `DELETE`, `TRUNCATE` on each guarded table (`spine_events`, `memory_events`, `recall_events`) raise errors while `INSERT`/`SELECT` work (PoC 1/2 statements as durable CI tests).
AC-2 (T3.2): the app role cannot `DROP TRIGGER`, `ALTER TABLE ... DISABLE TRIGGER`, `SET session_replication_role`, or achieve the same via role-switch or search-path tricks.
AC-3 (T3.3): the CI job fails if the required DSN is absent (zero-skip enforcement), verified via the existing `ci.yml` skip-guards applied to the new tests; any required workflow change is recorded as a hook for the CI integration owner with the exact diff, not applied here.
AC-4 (T3.4): duplicate `(tenant_id, event_id)` with a different `content_hash` raises a conflict error; the exact same event retried succeeds idempotently; a concurrent conflicting race resolves to exactly one winner and one error.
AC-5: owner-run migration is idempotent; app startup validates schema/version and privileges and refuses production DDL paths; test upgrade/restart under the restricted app role passes.
AC-6: the `purge_erasure_set` boundary stub always refuses (forged GUC, `SET`, `set_config`, `SET ROLE`, search-path injection and direct helper calls are all rejected) — no permissive deletion path exists.
AC-7: `shards` is untouched; supersession, idempotent ingest, CCM and erasure-related tests still pass unchanged.
AC-8: scoped deterministic checks pass on Postgres 16 with zero skipped required cases; tests fail against the pre-change schema (proving they are real regressions).

## Out of Scope

Shard immutability triggers (P12); read-time hash verification and degraded scoring (P3b); provider-labelled proofs and `cortex verify` (P3c); per-tenant chains, epoch roots (P6); the real authorized erasure executor (P11); any `api.py` change; any migration executed against live production; destructive probes anywhere outside disposable test infrastructure.

## Reviewer Questions

1. Can the app role still mutate guarded rows by any path (function, view, trigger disable, role switch, GUC, search path)?
2. Does the conflict/idempotency rule hold under concurrency, not just sequential retries?
3. Does the owner/app privilege split actually prevent the request-serving process from running DDL at startup?
4. Did anything in the guard work break supersession, ingest idempotency, CCM, or erasure plumbing?

## Context & References

- Charter §5 P3a row, §4 hazards 2/3/4, §8.1 database attack matrix; S1 G3, PoC 1/2 scripts at `bb5bcdf76752373cf4fe669107f36a0a4c581f36`; S3 P3a acceptance T3.1–T3.4 and DN6
- keon-cortex src/keon/cortex/providers/postgres/schema.py; src/keon/cortex/spine/postgres_record_store.py; providers/postgres/ccm_graph_schema.py (existing trigger pattern); scripts/postgres_test_setup.py
- P0 contract-decision register CD-1/CD-3 — disposition required before dispatch

## Verification Plan

Disposable Postgres 16 (container) with owner and app roles created at test time. Run PoC 1/2 statements as app role asserting failure (T3.1/T3.2), duplicate/conflict/race suite (T3.4), migration idempotency and restricted-role startup (AC-5), stub-refusal suite (AC-6), then the existing Postgres/spine suites unchanged. CI zero-skip guard active. Review focus: is there any mutation path left for the app role? Does the stub refuse unconditionally? Recorded receipts map each AC to its test command per charter §8.3.
