# OPMEM-P2b — builder kickstarter (served recall path: recall events, verified two-plane join, retry identity, access rows)

Second half of the T-37 split of P2. Coordinator: Pi `01a131a9`. Tracking: created at dispatch (parent m0r6aN/agent-skills#200).

## Workspace

- Worktree: `D:/Repos/opmem-worktrees/cortex-p2b` (Keon-Systems/keon-cortex), branch `feat/opmem-p2b-recall-path`. Commit locally; never push.
- **Verification base (T-2):** `ac05fdd675c5eff3a75182a9723a5840d41d12f8` (`opmem/integration` head, contains P1b + P2a).
- Python venv: create with `uv venv .venv --python 3.12 && uv pip install --python .venv/Scripts/python.exe -e ".[dev]"` if absent. **Baseline at base: 2153 passed / 114 skipped.**
- Real PostgreSQL 16: `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex` — reuse P2a's pattern in `tests/test_postgres_roundtrip.py` (a temporary database per run; never DDL against the named database).

## Contract

`C = D:/Repos/agent-skills-worktrees/opmem-coord-20261012-01a131a9/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`
- `C/follow-on-parcel-manifests.md` §P2 seam (recall-event-before-results, content-hash fail-closed INV-1/2, gravity orders never gates INV-2, delivery identity, T-11 recall binding, T-29 task_id, T-33 access rows), and `C/p2a-build-kickstarter.md` (T-37 split).
- `C/memory-boundary-contract.md` §2.4 (recall seam CLOSED until P2 — its four frozen consequences), §2.3 (End-to-end retry identity, T-23 ledger keys), §4.3.
- `C/event-and-fixture-contract.md` §1 (`access` ownership T-33), §2 rule 1, §3 (delivery identity, OD-18), §5 F-8, §7 G-7, §9 N-11, N-20/N-21.
- `C/p0-triage-2026-10-12.md` T-11, T-16, T-23, T-29, T-33; `C/p1-triage-2026-10-12.md` T-35/T-36.

## Coordinator rulings (encode exactly)

1. **Two read surfaces.** `POST /v1/shards/search` stays an **internal candidate read**: unchanged semantics, no recall event, labels stay `relevance_score`, `verified: false` (boundary §2.4 rule 2). A NEW `POST /v1/recall` is the **consumer recall** surface: it appends a durable recall event before returning results (§2.4 rule 1) and is the only path that records `access`.
2. **Recall request:** body `{query, limit (1–50), kind: "briefing"|"recall"}`; headers: all P1b carriage headers (scope, fail closed as today) plus **`X-Keon-Operation-Id` required** (T-35 alphabet, full-string, 400 if absent/malformed). `task_id` = `X-Keon-Task-Id`, defaulting to the logical `X-Keon-Session-Id` when absent (T-29); session id required for `/v1/recall`.
3. **Selection:** scope filter before candidates (P1b), then **integrity verification fail-closed**: a shard is eligible only if its stored id equals the id recomputed from its stored fields (the same recompute `/v1/replay` uses; scoped vs legacy as P2a defined). Records failing verification are excluded and counted in `verification_meta.excluded` (never silently included — INV-1/2). Ordering: relevance, then gravity weight from a `GravityIndex` — in P2b the index is **neutral** (P3 owns the pinned projection); responses carry `gravity_score: null` and `gravity_version: null`, so nothing claims gravitational ordering yet. Gravity never gates (INV-2).
4. **Delivery identity (§3, OD-18):** delivery key = sha256 of canonical JSON `{tenant, profile_id, role_id, role_generation, session_id, task_id, kind, content_set_hash}` where `content_set_hash` = sha256 of the ordered selected shard ids. First delivery inserts a durable **recall event** (`recall_event_id`, the key's components, `first_delivered_at` = the anchored `event_time_window` start, `query_hash`, actor). A later request that resolves to the **same delivery key** returns the existing `recall_event_id` and appends **nothing** (F-8, G-7 — re-render / resume / compaction add nothing).
5. **Operation binding (T-11, T-23):** durable binding keyed `(tenant, actor, role_id, profile_id, operation_id)` → `recall_event_id`, ordered selection, request fingerprint `{query, limit, kind, task_id, session_id, role_generation}`. Retry with the same key and fingerprint returns the **original selection and `recall_event_id`** even if candidates changed meanwhile; changed fingerprint ⇒ **409**; same `operation_id` under another scope ⇒ separate key, cannot read the other binding (N-21). Before returning a bound selection, **re-check current visibility** of every bound record; if any is no longer visible ⇒ **409 `selection_no_longer_authorized`** (fail closed; never widen, never silently shrink). Concurrent identical retries ⇒ exactly one recall event (unique constraint / transaction).
6. **`access` rows (T-33):** one row per selected record per recall event (`recall_event_id`, `shard_id`, `rank`, `task_id`, `verified=true`); written in the same transaction as the recall event; never on `/v1/shards/search`, never on retries or re-renders. The adapter-reported *delivered* subset is P3 — out of scope.
7. **Recall event history for P3:** also append each new recall event as an `ISpineEvent` of kind `Recall` (content-hashed, `memory_id` per selected shard as the spine model requires) to a spine `RecordStore`, so P3 can project gravity from history. If a durable spine store requires a new PostgreSQL table, it is part of this parcel (additive DDL in `schema.py`).
8. **Durability:** in-memory implementations for tests and the default app; PostgreSQL implementations used when the app runs with PostgreSQL storage. Additive DDL only.
9. **Response:** `{recall_event_id, operation_id, delivery: {key, first_delivered_at, replayed: bool}, results: [{shard_id, content, memory_type, rank, relevance_score, gravity_score: null, verified: true}], verification_meta: {excluded, method: "id_recompute"}, gravity_version: null}`. Error envelopes as existing routes.
10. **Proof regeneration (OD-14):** the coordinator runs `cortex proof-bundle` at your head; you only need to keep existing proof tests green.

## Allowed Files

- UPDATE `src/keon/cortex/api.py`
- UPDATE `src/keon/cortex/providers/postgres/schema.py`
- UPDATE `src/keon/cortex/spine/recall_service.py`
- NEW `src/keon/cortex/spine/recall_events.py`
- NEW `tests/test_recall_http.py`
- UPDATE `tests/test_two_plane_storage.py`
- NEW `tests/test_recall_postgres.py` (env-gated, temporary database)
- **Amendment window (Step 0 only):** you may propose up to two additional NEW files under `src/keon/cortex/spine/` (e.g. a shard-plane adapter, a PostgreSQL spine record store); they are allowed only if the coordinator approves them in the Step 0 ruling. Mechanical fixture edits to existing tests under the S0-2 rule (list them) if `/health` or similar exact expectations change.

## Step 0 — RESTATE AND STOP

No edits/commits this turn. Read the contract, `spine/*.py` (models, record_store, gravity_index, recall_service, serializer), `gravity/contracts.py` (read-only), `api.py`, P2a's `tests/test_postgres_roundtrip.py` pattern, `tests/test_two_plane_storage.py`. Reply with: (1) restatement; (2) design table ruling → file → approach, incl. table DDL, transaction boundaries for event + access + binding, and how `RecallService` is adapted without breaking its existing tests; (3) proposed extra NEW files (≤2) with justification; (4) expected EXISTING-TEST-CONFLICTs; (5) any ruling you believe is unsafe or impossible (with locator). Then stop.

## Completion report (after GO)

```
## P2b BUILD REPORT
### Commits
### Ruling → evidence (test names)
### Test run (exact commands + summaries; before/after; env-gated PG)
### FIXTURE-EDITS / EXISTING-TEST-CONFLICT / NEEDS-AMENDMENT
### git diff --name-status ac05fdd..HEAD
```

## Step 0 rulings (coordinator, 2026-10-13)

- **S0-1 (amendment):** Allowed Files += NEW `src/keon/cortex/spine/shard_plane.py` (single recompute authority; `api.py` imports it — `_replay_value_hash` moves there, behaviour unchanged) and NEW `src/keon/cortex/spine/postgres_record_store.py` (durable spine `RecordStore`). Approved as justified.
- **S0-2 (a):** `correlation_id = shard_id` for `Recall` spine events — approved (P3's history view reads by correlation). Record the mapping in a module docstring.
- **S0-3 (b):** `/v1/recall` session id absent ⇒ 400, malformed ⇒ 403 — approved. **(c):** `rank` 0-based in both response and access rows — approved; `role_generation` JSON `null` when absent — approved.
- **S0-4:** design table, DDL, single-transaction first-delivery commit, deterministic `recall_event_id`, leaving the existing `RecallService` class untouched with a sibling shard-plane class — approved. A new operation that resolves to an existing delivery key creates its own binding to the existing event, returns `replayed: true`, and appends no event/access/spine rows.
