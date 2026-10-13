# OPMEM-P3a — builder kickstarter (memory-event ingest: access-delivered, consideration, application, outcome, non_applicability, correction, feedback)

## Queue amendment T-38 (owner-delegated, coordinator `01a131a9`, 2026-10-13)

P3 is split into two sequential parcels on keon-cortex (shared `api.py`/`schema.py`, sequential handoff T-2):
- **P3a (this parcel):** the T-15 event-ingest seam (Cortex side) incl. the T-33 adapter-reported `delivered` subset of `access` and `access_omitted`; durable storage; spine history of every event kind; **no score effect** (OD-10 report-only).
- **P3b (next):** versioned classification (`gravity/contracts.py` `is_content_occurrence`), served scorer `gravity/1.1.0` with `gravity/1.0.0` preserved, projection from spine history, recall-influence dedup per `(task_id, record_id)` (T-16), G-1…G-14 fixtures on the served path, tenant-scoped spine reads (P2b-T6), and wiring the projection into `/v1/recall` ordering/labels.

## Workspace

- Worktree `D:/Repos/opmem-worktrees/cortex-p3a` (Keon-Systems/keon-cortex), branch `feat/opmem-p3a-memory-events`. Commit locally; never push.
- **Verification base (T-2):** `b6e25c63c95ff9be8516023035161ad666e136ce` (`opmem/integration`, contains P1b, P2a, P2b). Venv provisioned at `.venv`. **Baseline: 2258 passed / 120 skipped.**
- Real PostgreSQL 16: `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex` — temporary database per run (P2a pattern); never DDL against database `cortex`.
- **Before you report:** run `black --check` and `isort --check-only` on every file you changed (CI uses black 26.10.1 = the pinned dev version). The previous parcel's builder misreported this; the coordinator now checks.

## Contract

`C = D:/Repos/agent-skills-worktrees/opmem-coord-20261012-01a131a9/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`
- `C/event-and-fixture-contract.md` §1 (taxonomy, minimum fields, `outcome.status` vocabulary, T-33 access ownership), §2 rules 2–6, §5 (F-1…F-14), §9 N-12 (feedback replay), N-21.
- `C/memory-boundary-contract.md` §2.2 (`keon.cortex.memory.event.v1` mapping row and ack shape), §2.3 retry identity (T-11/T-23), §4.3.
- `C/p0-triage-2026-10-12.md` T-15, T-27, T-33, T-34; OD-22 in `C/open-decisions.md`.
- P2b's recall surface (`/v1/recall`, `spine/recall_events.py`) is the source of truth for `recall_event_id`, selected records and access rows.

## Coordinator rulings (encode exactly)

1. **Route:** NEW `POST /v1/memory-events`. Headers: P1b carriage (fail closed as today) + **`X-Keon-Operation-Id` required** (T-35/T-36). Body `{kind, ...}` with `kind ∈ {access, access_omitted, consideration, application, outcome, non_applicability, correction, feedback}`; each kind's fields per event §1 minimum fields (pydantic discriminated union, full-string T-35/T-36 validation of every id, bounded strings, no trimming).
2. **References are verified, never trusted:** `recall_event_id` / `access_ref` must name a recall event that exists, is visible to the caller's scope (same tenant/role/profile as the recall's binding scope), and whose selection contains the referenced `memory_id`; `access`/`access_omitted` record ids must be ⊆ that selection; `corrects_ref`/`new_content_ref`/`memory_id` must be shards visible to the caller. Any failure ⇒ 404 (no existence leak), nothing written.
3. **Attribution fail-closed (T-27/T-34, OD-22):** Cortex records `attribution: self_reported` only. A body claiming `supported` ⇒ **422 `supported_attribution_unavailable`**. No event is ever an observed outcome or an association edge in P3a.
4. **Outcome vocabulary:** `status ∈ {success, failure, unknown, not_executed}`; `success`/`failure` require `evidence_ref` (opaque reference, recorded as unverified); `unknown`/`not_executed` must not carry a fabricated evidence claim. `observed_at` explicit (INV-4 explicit time).
5. **Idempotency (T-11/T-23, N-12):** durable key `(tenant, actor, role_id, profile_id, operation_id)` (plus `record_id` for each `access`/`access_omitted` row, T-33) → event id(s) + request fingerprint (validated model, scope envelope as P2a `__scope__`). Identical retry ⇒ replay `200` with the original body, nothing appended; changed fingerprint ⇒ 409; same operation id under another scope cannot read the other's event. Re-sending the same `access` for an already-recorded `(recall_event_id, record_id)` under a *new* operation id ⇒ recorded as replay-equivalent (no second delivered-access row) — one delivered access per recall record.
6. **Storage:** durable tables (PostgreSQL, additive DDL) + in-memory store; first write of an operation commits event rows **and** their spine events atomically (reuse P2b's transaction discipline: PG single transaction; in-memory all-or-nothing under the spine lock with owned-id rollback — P2b-T8/T11/T12 semantics).
7. **Spine history:** each event also appended as an `ISpineEvent` with `kind` ∈ {`Access`, `AccessOmitted`, `Consideration`, `Application`, `Outcome`, `NonApplicability`, `Correction`, `Feedback`} and `correlation_id` = the memory (shard) id it concerns (P2b S0-2 convention); content-hashed; deterministic ids. P3b classifies them; **P3a changes no score** and must not touch `gravity/*`.
8. **Response / ack (boundary §2.2):** `{"success": true, "data": {event_ids: [...], operation_id, replayed: bool, attribution: "self_reported"}}`; errors as existing routes.

## Allowed Files

- UPDATE `src/keon/cortex/api.py`
- UPDATE `src/keon/cortex/providers/postgres/schema.py`
- NEW `src/keon/cortex/services/memory_events.py`
- NEW `tests/test_memory_events_http.py`
- NEW `tests/test_memory_events_postgres.py` (env-gated)
- Mechanical fixture edit allowed (list it): `tests/test_shards_v1_1.py` route-table expectation if a POST route is added.
- Read-only use of `spine/recall_events.py`, `spine/shard_plane.py`, `spine/postgres_record_store.py`, `tenancy/scope.py`. If you need to change any of them ⇒ NEEDS-AMENDMENT in Step 0.

## Step 0 — RESTATE AND STOP

No edits this turn. Reply with (1) restatement; (2) design table ruling → file → approach incl. DDL and transaction boundaries; (3) expected EXISTING-TEST-CONFLICTs; (4) needed amendments (≤1 extra NEW file allowed if justified); (5) any ruling you believe unsafe/impossible with locator. Then stop.

## Completion report (after GO)

```
## P3a BUILD REPORT
### Commits
### Ruling → evidence (test names)
### Test run (exact commands + summaries; before/after; env-gated PG; black/isort --check on changed files)
### FIXTURE-EDITS / EXISTING-TEST-CONFLICT / NEEDS-AMENDMENT
### git diff --name-status b6e25c6..HEAD
```

## Step 0 rulings (coordinator, 2026-10-13)

- **S0-1:** design table, DDL (`memory_events`, `memory_event_bindings`, `memory_access_delivered` + reuse of `spine_events`), single-transaction PG commit and P2b-discipline in-memory commit — approved. No extra files.
- **S0-2:** every non-access kind **must** carry a verified `access_ref` or `memory_id` (so the spine `correlation_id` mapping is total); an `outcome` with only a free `target_ref` ⇒ 422.
- **S0-3:** duplicate delivered access under a new operation id ⇒ ack `replayed: true`, a binding row for the new operation, an audit `memory_events` row flagged `replay_equivalent`, **no** second `memory_access_delivered` row and **no** second `Access` spine event — approved.
- **S0-4:** the `tests/test_shards_v1_1.py` route-table edit is the sanctioned mechanical fixture edit.

## R1 triage (coordinator, 2026-10-13) — Seat A APPROVE-WITH-FIXES, Seat B REQUEST-CHANGES

| # | Finding | Disposition | Ruling |
|---|---|---|---|
| P3a-T1 | A F-1 + B F-3 — duplicate `record_ids` (memory double rows vs PG permanent 500) | fix | Duplicate ids inside one `access`/`access_omitted` request ⇒ **422** at model validation. Both storage modes tested. |
| P3a-T2 | A F-2 + B F-4 — repeat `access_omitted` loses its spine event | fix | Every accepted `access_omitted` appends its own spine event: its deterministic id includes the operation key. Only **delivered `access`** keeps the S0-3 dedup. Test: two omissions (different reason/time) ⇒ two `AccessOmitted` spine events with their own times. |
| P3a-T3 | A F-3 — mixed batch acks `replayed: true` | fix | Ack `replayed: true` only when **every** target was replay-equivalent; the ack also lists `replay_equivalent_record_ids` (sorted). |
| P3a-T4 | B F-1 — cached ack bypasses current reference authorization | fix | Before returning any cached ack (incl. concurrent-winner recovery) re-resolve all references under the **current** caller scope; any no-longer-authorized reference ⇒ **409 `references_no_longer_authorized`**, nothing returned (same rule as P2b-T2). |
| P3a-T5 | B F-2 + A F-4 — application/consideration/non_applicability against a selected-but-not-delivered (or omitted) record | fix | `consideration`, `application`, `non_applicability` require `access_ref` naming a **delivered** access (row in `memory_access_delivered` for that recall event and record); otherwise **409 `access_not_delivered`** (client may retry after reporting delivery), nothing written. `outcome`/`feedback` with `access_ref` follow the same rule; with `memory_id` only they keep the visibility check. |
| P3a-T6 | B F-5 — retries not byte-identical | fix | The binding stores the original response bytes; an identical retry returns them unchanged (`replayed` in the ack describes accounting replay-equivalence, not transport retry). Byte-identity test. |
| P3a-T7 | B F-6 + A F-4 (task id fallback) | carry-forward → P3b | P3b projection dedups correlated feedback across operation ids, filters on the delivered subset, and handles an empty `task_id` explicitly. |
| P3a-T8 | A F-5 | informational | Live revocation state is Gateway/P5a-owned. |

## R2 disposition (coordinator) — Seat A APPROVE, Seat B APPROVE-WITH-FIXES (1 minor)

- **P3a-T6 amendment (owner-delegated):** replay by **deterministic reconstruction** from the stored canonical (sorted-key) response data is accepted as satisfying byte-identity — the same mechanism ruled acceptable for P2a's OD-6 duplicate-response fixture. Byte-identity across a restart is proven by the PG test. Raw-byte persistence would only guard against a future serializer change; recorded as a carry-forward note for any change to the response serializer (it must keep the replay byte-identity tests green). R2-B F-1 therefore closes as **accepted-as-documented**; R2-A F-1 informational.
- P3a accepted for Gate 3.
