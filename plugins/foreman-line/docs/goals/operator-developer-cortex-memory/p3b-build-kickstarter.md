# OPMEM-P3b — builder kickstarter (versioned classification, served scorer gravity/1.1.0, projection, recall ordering)

Second half of the T-38 split of P3. Coordinator: Pi `01a131a9`. Tracking: created at dispatch (parent m0r6aN/agent-skills#200).

## Workspace

- Worktree `D:/Repos/opmem-worktrees/cortex-p3b` (Keon-Systems/keon-cortex), branch `feat/opmem-p3b-gravity-projection`. Commit locally; never push.
- **Verification base (T-2):** `29309583925fa7cbffee5ebe980d3aed509a29dc` (`opmem/integration`, contains P1b, P2a, P2b, P3a). Create the venv if absent: `uv venv .venv --python 3.12 && uv pip install --python .venv/Scripts/python.exe -e ".[dev]"`. **Baseline: 2282 passed / 123 skipped.**
- Real PostgreSQL 16: `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex` — temporary database per run; never DDL against database `cortex`.
- Before reporting: `black --check` and `isort --check-only` on every changed file (black 26.10.1 pinned).

## Contract

`C = D:/Repos/agent-skills-worktrees/opmem-coord-20261012-01a131a9/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`
- `C/follow-on-parcel-manifests.md` §P3 (seam, verification, rollback); `C/p3a-build-kickstarter.md` (T-38 split).
- `C/event-and-fixture-contract.md` §1 (classification election), §2 rules 1–6, §4 (explicit time), §7 fixtures **G-1…G-14** (the fixture table is the acceptance list), §9 N-12.
- `C/p0-triage-2026-10-12.md` T-9, T-16; `C/p3a-closure-2026-10-13.md` and `C/p2b-closure-2026-10-13.md` carry-forwards.
- Existing gravity code (read first): `src/keon/cortex/gravity/{contracts,forces,function,params,recall,blend,anomaly}.py`; P2b `spine/recall_events.py`, `spine/recall_service.py`, `spine/postgres_record_store.py`; P3a `services/memory_events.py`.

## Coordinator rulings (encode exactly)

1. **Classification authority (T-9, §1 election):** `gravity/contracts.py` gains a versioned classification table `OCCURRENCE_CLASSIFICATION_VERSION = "occurrence-classes/1"` and `is_content_occurrence(kind) -> bool` (and the property on `SpineEvent`). Content occurrences: `Observation` (new, see ruling 3) and the legacy governance kinds `Directive`, `Intent`, `Decision`, `Action` (unchanged meaning). **Not** occurrences: `Recall`, `Access`, `AccessOmitted`, `Consideration`, `Application`, `Outcome`, `NonApplicability`, `Correction`, `Feedback`, and **any unknown kind** (fail closed under 1.1.0). The legacy docstring/`is_recall` behaviour stays for 1.0.0 consumers.
2. **Scorer versions (T-9, G-9):** NEW `gravity/function_v1_1.py` implements `gravity/1.1.0` with the **same four forces and the same pinned params**, differing only in (a) occurrence extraction via `is_content_occurrence`, (b) recall influence deduplicated per `(task_key, memory_id)` (ruling 4). Its function hash covers version + params + classification version. `gravity/function.py` changes **only** to add version dispatch; `gravity/1.0.0` outputs remain byte-identical for replay (prove with a golden test computed at base). `gravity/params.py` changes only if a versioned params record is needed (no numeric change — OD-10).
3. **Occurrence source:** each **new** accepted shard ingest (a fresh `/v1/shards` write that creates the record — not an idempotent replay, not a duplicate of an existing record id) appends one content-hashed `Observation` spine event (`correlation_id` = shard id, `occurred_at` = the ingest's explicit receive time) in the same commit discipline as P2b/P3a. Existing shards with no Observation event have occurrence 0 under 1.1.0 (documented; no back-fill in this parcel).
4. **Recall influence (T-16, T-33, D11):** recall-force inputs come from the **delivered subset** (P3a `memory_access_delivered`), **not** from selection rows; one influence per `(task_key, memory_id)` where `task_key` = the delivered row's `task_id` if non-empty, else the recall event's `session_id` (always present on `/v1/recall`). Re-renders, retries, companion changes, new operation ids, omitted records and selected-but-undelivered records add nothing (G-7, G-13, G-14, F-8).
5. **Feedback and association (OD-10, T-16, T-34):** consideration/application/outcome/non_applicability/correction/feedback change **no** force (G-6, G-11, G-12; N-12 across operation ids). Association pull is **zero** in 1.1.0 — no event class creates an edge until supported attribution exists (T-34/OD-22); co-delivery and co-recall never do (G-10).
6. **Projection (NEW `gravity/projection.py`, NEW `services/recall_accounting.py`):** builds the per-memory history view for the scorer from durable stores **filtered by tenant and caller scope** (P2b-T6 — never a tenant-unscoped correlation read), with explicit `as_of`. Amendment granted: UPDATE `spine/postgres_record_store.py` and UPDATE `spine/record_store.py` **only** to add tenant-scoped read methods (additive; existing methods unchanged).
7. **Served ordering and labels (INV-2):** `/v1/recall` computes `gravity/1.1.0` for eligible (scope-filtered, integrity-verified) candidates with `as_of` = the request's server receive time (explicit, recorded in the response as `gravity_as_of`). Ordering key: relevance desc, then gravity desc, then shard id — gravity orders, never gates (a zero-gravity relevant record is never excluded). Responses carry numeric `gravity_score`, `gravity_version: "gravity/1.1.0"`, `gravity_function_hash`. `/v1/shards/search` unchanged.
8. **Fixtures:** `tests/gravity/test_projection_fixtures.py` implements G-1…G-14 against the **served scorer path** (projection + function_v1_1) and G-9 against 1.0.0 golden outputs; `tests/gravity/test_feedback_non_occurrence.py` covers ruling 1/5 classification incl. unknown kinds and N-12 across operation ids. Two consecutive runs produce byte-identical fixture outputs (manifest verification line).

## Allowed Files

- UPDATE `src/keon/cortex/gravity/contracts.py`, UPDATE `src/keon/cortex/gravity/params.py` (only if needed), UPDATE `src/keon/cortex/gravity/function.py` (dispatch only)
- NEW `src/keon/cortex/gravity/function_v1_1.py`, NEW `src/keon/cortex/gravity/projection.py`, NEW `src/keon/cortex/services/recall_accounting.py`
- UPDATE `src/keon/cortex/api.py` (ingest Observation append; recall wiring)
- UPDATE `src/keon/cortex/providers/postgres/schema.py` (only if a new index/table is needed; additive)
- UPDATE `src/keon/cortex/spine/recall_service.py` (ordering/labels), UPDATE `src/keon/cortex/spine/recall_events.py` (only if the engine needs gravity inputs passed through)
- UPDATE `src/keon/cortex/spine/postgres_record_store.py`, UPDATE `src/keon/cortex/spine/record_store.py` (tenant-scoped reads only — ruling 6)
- NEW `tests/gravity/test_projection_fixtures.py`, NEW `tests/gravity/test_feedback_non_occurrence.py`, NEW `tests/test_gravity_recall_http.py`, NEW `tests/test_gravity_postgres.py` (env-gated)
- Mechanical fixture edits (list them): existing recall tests asserting `gravity_score: null` / `gravity_version: null` / the P2b ordering may be updated **only** for those label/order expectations.

## Step 0 — RESTATE AND STOP

No edits this turn. Read the contract and code. Reply with: (1) restatement; (2) design table ruling → file → approach (incl. how Observation events are appended atomically with ingest, how projection reads are tenant/scope-filtered, how 1.0.0 byte-identity is proven); (3) the exact G-1…G-14 list as you will implement it (one line each, citing the contract row); (4) expected EXISTING-TEST-CONFLICTs; (5) amendments needed; (6) any ruling you believe unsafe or impossible (locator). Then stop.

## Completion report (after GO)

```
## P3b BUILD REPORT
### Commits
### Ruling → evidence (test names)
### Test run (exact commands + summaries; before/after; env-gated PG; two-run byte-stability; black/isort)
### FIXTURE-EDITS / EXISTING-TEST-CONFLICT / NEEDS-AMENDMENT
### git diff --name-status 2930958..HEAD
```

## Step 0 rulings (coordinator, 2026-10-13)

- **S0-1 (A1 amendment granted):** UPDATE `src/keon/cortex/providers/postgres/document_store.py` — additive optional `connection=None` on `upsert` only (default path byte-identical), so the new-ingest shard upsert and its `Observation` spine append commit in one PostgreSQL transaction. Test the rollback (spine failure ⇒ no shard row) against real PG.
- **S0-2 (A3):** G-4/G-5 are pinned against the inherited `forces.py` helpers the 1.1.0 scorer uses unchanged, **plus** a served-path invariant `association == 0.0` (ruling 5). Approved.
- **S0-3:** design table approved, including the delivered-access reader protocol in `services/recall_accounting.py` (no `memory_events.py` edit), `get_by_correlation_scoped` additive reads, golden 1.0.0 outputs captured at base, and binding-retry re-scoring at the retry's `as_of` (selection membership unchanged).
- **S0-4:** listed EXISTING-TEST-CONFLICTs 1–3 are sanctioned mechanical fixture edits (labels, order expectations, tolerance of `Observation` spine events); list every touched expectation.

## R1 triage (coordinator, 2026-10-13) — Seat A APPROVE, Seat B REQUEST-CHANGES (3 majors)

| # | Finding | Disposition | Ruling |
|---|---|---|---|
| P3b-T1 | B F-1 — another role's deliveries of a shared record change the caller's gravity | fix | Recall activity is role-private (D9). Carry the caller scope into accounting: recall influence counts only delivered rows whose **recall event** has the caller's `role_id` **and** `profile_id` (join through the tenant-scoped recall event for every row — never skip the lookup because `task_id` is non-empty). Occurrence (`Observation`, content-level) stays shared with whoever can see the record. Regression: roles A and B on one profile-shared record — A's deliveries leave B's score unchanged (bit-exact at fixed `as_of`), both storage modes. |
| P3b-T2 | B F-2 + A F-1 — in-memory ingest publishes shard before Observation; a failed Observation is never repaired | fix | In-memory first ingest is one bundled, non-suspending commit holding the document-store lock **and** the spine lock with journaled rollback (P2b-T8/T11/T12 discipline): readers never see the shard without its Observation; any failure leaves neither. **Repair rule (both modes):** an ingest that finds the shard present but its deterministic `Observation` missing completes the Observation (idempotent) before acknowledging. Tests: failure injection before/during/after the Observation insert, cancellation, retry recovery, cross-thread reader never sees the partial state. Promote the needed atomic helpers onto the stores instead of touching private fields from `api.py` (amendment: UPDATE `src/keon/cortex/providers/memory/document_store.py` for an additive locked-bundle helper). |
| P3b-T3 | B F-3 — fresh recall sorts with one history read and labels with another | fix | The fresh selection's **gravity snapshot** (per-record score, `as_of`, function hash) is computed once and is what the response reports and orders by; the post-binding reload re-checks membership/visibility/integrity only. The snapshot is stored with the binding (additive nullable column on `recall_operation_bindings`, e.g. `gravity_snapshot JSONB`) and **binding retries return the original ranks and snapshot** (amends S0-3's re-score-at-retry). Test the deterministic concurrency probe: rank order is always consistent with the reported scores. |
| P3b-T4 | A F-2, A F-3, A F-4, A F-5 | informational | Served co-occurrence unreachable today (documented); flaky benchmark is pre-existing; docstring precision and lenient timestamp grammar noted. |

## R2 triage (coordinator) — Seat A APPROVE, Seat B REQUEST-CHANGES (1 major)

| # | Finding | Disposition | Ruling |
|---|---|---|---|
| P3b-T5 | B F-1 — Observation repair checks only primary-id presence; a mid-index failure during repair is acknowledged forever | fix | In-memory repair goes through the same failure-safe, fully-index-aware store helper as first ingest (journaled ownership before mutation, rollback of partial indexes, sequence rule); "already present" means **fully indexed** (primary + correlation + tenant indexes) — a partially indexed Observation is completed. Regressions: repair-path failure at each index step, then repeated identical retries ⇒ exactly one fully indexed Observation and non-zero served occurrence. |
| — | A F-1 / F-2 / F-3 | informational / carry-forward | Locked-bundle protocol on `InMemoryRecordStore` → follow-up; repaired Observation takes the repairing ingest's receive time (accepted); snapshot label KeyError is unreachable (accepted). |

Verification of this narrow fix: **Seat B only** (owner of the finding; Seat A approved R2).

## R3 triage (coordinator) — Seat B REQUEST-CHANGES (unlocked completeness shortcut)

| # | Finding | Disposition | Ruling |
|---|---|---|---|
| P3b-T6 | R3-B F-1 — unlocked "fully indexed" shortcut can acknowledge another repair's uncommitted Observation | fix | Remove the unlocked shortcut: every ingest replay/race branch calls the locked `commit_spine_repair` (completeness is evaluated only under both store locks). Regression: concurrent repair with an injected rollback — every 200 corresponds to a committed, fully indexed Observation. |

**Convergence ruling:** this is the final in-memory-concurrency round for P3b. Any further finding that is reachable **only** through fault injection or cross-thread access to the in-memory development store (production runs PostgreSQL, whose single-transaction path has been green since R1) is recorded as informational and carried forward to a follow-up parcel that promotes a protocol-level locked-bundle API onto `InMemoryRecordStore`.
