# OPMEM-P2a — builder kickstarter (shards/1.1, scoped record identity, durability, input hardening, readiness signal)

## Queue amendment T-37 (owner-delegated, coordinator `01a131a9`, 2026-10-12)

P2 is split into two sequential parcels on the same repo (both touch `api.py`/`schema.py`; sequential handoff rule T-2 applies):
- **P2a (this parcel):** shards/1.1 semantic extension (T-12) + durable model/serialization (T-22) + scoped record identity and scope-aware idempotency (T-23, N-20 two-records half, P1 carry-forwards 1/3/4) + Cortex-layer input bounds (R0 F-5) + `/health` readiness/schema signal (OD-17) + OD-6 duplicate-response fixture + real-PostgreSQL round trip (T-22, P1 carry-forward 2).
- **P2b (next):** recall events, `RecallService` two-plane join on the served path, `operation_id` recall binding (T-11), server-side `access` rows (T-33), `task_id` persistence (T-29), F-8/G-7/N-11, I1–I7 proof regeneration. P2b's manifest = the P0 P2 manifest minus the P2a items, re-issued at P2b dispatch.
Reason: one-parcel reviewability; P2's original scope mixed a wire/storage change with the recall/gravity seam.

## Workspace

- Worktree: `D:/Repos/opmem-worktrees/cortex-p2` (repo `Keon-Systems/keon-cortex`), branch `feat/opmem-p2a-shards-identity`. Never push; never touch other branches; commit locally.
- **Verification base (T-2):** `3294bd360c9c2be0b492eb94386847ac7f80a6f5` (`opmem/integration` head, contains P1b).
- Python: `D:/Repos/opmem-worktrees/cortex-p2/.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider`. **Baseline at base: 2046 passed / 110 skipped.**
- Real PostgreSQL 16 is available locally: `postgresql://postgres:opmem@127.0.0.1:55432/cortex` (disposable container; you may create/drop schemas inside database `cortex` only).

## Contract

`C = D:/Repos/agent-skills-worktrees/opmem-coord-20261012-01a131a9/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`
- `C/follow-on-parcel-manifests.md` §P2 (seam text), `C/memory-boundary-contract.md` §2.2 (canonical mapping), §2.3 Schema/Idempotency/Response/Readiness/Version, §4.3, §6 (input size / URI row, rollback).
- `C/p0-triage-2026-10-12.md` T-12, T-22, T-23; `C/p1-triage-2026-10-12.md` T-35, T-36; `C/p1-closure-2026-10-12.md` "Carry-forward into P2 shaping" items 1–4.
- `C/event-and-fixture-contract.md` §9 N-17, N-18, N-20.

## Allowed Files (exact)

- UPDATE `src/keon/cortex/api.py`
- UPDATE `src/keon/cortex/ingress/models.py`
- UPDATE `src/keon/cortex/core/models.py`
- UPDATE `src/keon/cortex/providers/postgres/document_store.py`
- UPDATE `src/keon/cortex/providers/postgres/schema.py`
- NEW `tests/test_shards_v1_1.py`
- NEW `tests/test_postgres_roundtrip.py` (skips unless `KEON_TEST_DATABASE_URL` is set; the coordinator runs it with the URL above)
- UPDATE `tests/test_api.py` — **mechanical fixture edits only**, if a contract change requires it; list them.

Any other existing test that breaks because it asserts behaviour this contract changes: do not edit; report under `EXISTING-TEST-CONFLICT`.

## Coordinator rulings already made (encode exactly)

1. **shards/1.1 (T-12/T-22):** `memory_type` accepts `observation`, `decision`, `artifact_link` in addition to the five legacy types — in BOTH the ingress candidate and `ShardRecord`. Candidate/record gain optional `decision_status` (string, T-35-style bounded token or null), `lineage_refs` (list of shard ids, bounded count ≤ 64), and structured provenance fields (`source_kind`, `source_uri`, `checkpoint_at`) — extend the existing optional provenance structures rather than inventing a parallel one. A `shards/1` payload (none of the new fields) must validate and round-trip byte-identically to today.
2. **Scoped record identity (T-23, N-20):** every served write (all carry trusted scope after P1b) derives the shard id from tenant + `role_id` + `profile_id` + `scope_class` + the existing content/source/extractor inputs. Writes without scope context (direct, non-served callers of the ingress model) keep the legacy derivation, so legacy ids are unchanged. `content_hash` stays scope-free. Same content under two scopes ⇒ two records, neither visible to the other.
3. **Scope-aware idempotency (T-23, P1 carry-forward 1):** the request fingerprint includes the caller scope; the same idempotency key / operation under a different scope or changed fingerprint ⇒ **409**; the replay branch never re-stamps scope from the retrying caller (crash-window case: reservation present, row absent ⇒ re-materialize with the **original** reservation's scope or refuse — never the retrier's).
4. **Every write path stamps scope** (P1 carry-forward 3): a test enumerates the served write paths and asserts none produces a legacy-classified row.
5. **T-36 for `X-Actor-Id`, `X-Decision-Receipt-Id`, `X-Idempotency-Key` (P1 carry-forward 4):** no trimming; full-string validation; reject control characters, any whitespace, empty, and length > 256 (403 for identity/receipt, 400 for idempotency key is acceptable — state your choice); conformant values unchanged.
6. **Input bounds (R0 F-5, N-17/N-18 Cortex half):** `content` ≤ `CORTEX_MAX_CONTENT_BYTES` UTF-8 bytes (default 32768, read from env at app creation); search `query` ≤ 4096 characters; `source_uri` / `artifact_uri` schemes allowlisted to `https` and `urn` (others rejected). Violations ⇒ 4xx before any store access.
7. **Readiness (OD-17):** `/health` adds `schema_version` (the ShardRecord schema version) and `protocol: "shards/1.1"`; existing keys unchanged.
8. **OD-6:** pin the exact duplicate/idempotent-replay response body with a byte-level fixture test.
9. **Rollback:** additive only; previous code must still read rows written by P2a for `shards/1` payloads; document in the report what a pre-P2a reader does with a 1.1 row (expected: rejects unknown `memory_type` — acceptable only if stated).

## Step 0 — RESTATE AND STOP

Do NOT edit/commit this turn. Read contract + code (`ingress/models.py`, `core/models.py`, `core/ids.py` read-only, `api.py`, both document stores, idempotency stores, `tests/test_api.py`, `tests/test_postgres_providers.py`). Reply with: (1) restatement; (2) design table ruling → file → approach (incl. the exact identity hash input order and how a served write is distinguished from a direct one); (3) expected EXISTING-TEST-CONFLICTs with file:line; (4) any file outside Allowed Files you need (e.g. if idempotency stores live in other files). Then stop.

## Completion report (after GO)

```
## P2a BUILD REPORT
### Commits
### Ruling → evidence (test names)
### Test run (exact command + summary; before/after) and the env-gated PG test command you ran
### FIXTURE-EDITS / EXISTING-TEST-CONFLICT / NEEDS-AMENDMENT
### git diff --name-status 3294bd3..HEAD
```

## Step 0 rulings (coordinator, 2026-10-12)

- **S0-1 (crash window):** approved — scope is a fingerprint input and `_verify_replay` runs before any re-materialization, so a retrier with a different scope gets 409 and never writes; no reservation-schema change and no idempotency-store files.
- **S0-2 (amendment):** Allowed Files += UPDATE `tests/test_scope_http.py`, **mechanical** only (extend the exact `/health` expectation with `schema_version`/`protocol`). Same rule for `tests/test_api.py:392`. List both under FIXTURE-EDITS.
- **S0-3:** N-18's Cortex half is the `source_uri` check (no `artifact_uri` field exists on the Cortex candidate) — approved. Status codes as proposed (actor/receipt malformed 403, absent actor 400; idempotency key malformed 400; content bound 400; query/source_uri 422) — approved.
- **S0-4:** design table approved as written, including the 7-key scoped identity payload and the scope-aware `_replay_value_hash`.

## R1 triage (coordinator, 2026-10-12) — Seat A APPROVE-WITH-FIXES, Seat B REQUEST-CHANGES

| # | Finding | Disposition | Ruling |
|---|---|---|---|
| P2a-T1 | B F-1 — PG fixture drops shared `keon_cortex` schema | fix | The env-gated test creates a **uniquely named temporary database** on the server named by `KEON_TEST_DATABASE_URL` (e.g. `opmem_test_<uuid4hex>`), runs entirely inside it, and drops only that database at teardown (also on failure). It never issues DDL against the database named in the URL. |
| P2a-T2 | B F-2 + A F-1 + A F-4 — malformed new fields reach PG; scheme check bypass | fix | (a) Every candidate string field rejects NUL and unpaired surrogates (4xx). (b) `lineage_refs` items must fullmatch the shard-id syntax `^[A-Za-z0-9_.:-]{1,128}$` (no whitespace/control). (c) `source_uri` is validated on the **raw string**: no whitespace or control characters anywhere, then fullmatch `^https://[^\s]+$` or `^urn:[A-Za-z0-9][A-Za-z0-9-]{0,31}:[^\s]+$` (lowercase scheme literal; `HTTPS:` rejected). (d) **All validation completes before any idempotency reservation or store access**; if the store write fails after a reservation is taken, the request returns a retryable 5xx and an identical retry must be able to complete (compensate or re-materialize) — test both. Served-path + isolated-PG negative tests assert 4xx and **no reservation**. |
| P2a-T3 | B F-3 + A F-2 — fingerprint over raw body: false 409s; client key shadowing | fix | Fingerprint = canonical JSON of the **validated** candidate (`by_alias=True`, aliases/number forms/defaults normalized by the model) **excluding server-generated values the client did not supply** (use the model's fields-set to drop an omitted provenance timestamp), wrapped as `{"candidate": …, "__scope__": {actor, role_id, profile_id, scope_class}}` so client keys can never shadow scope. Tests: alias vs field name, `1` vs `1.0`, omitted vs explicit default ⇒ replay 200; different scope ⇒ 409; changed content ⇒ 409. |
| P2a-T4 | B F-4 — unpaired surrogate content ⇒ 500 | fix | Covered by P2a-T2(a): controlled 4xx before store access; regression test. |
| P2a-T5 | A F-3 — pre-P2a reservations 409 forever post-deploy | carry-forward | Deploy/migration note for the owner's `main` promotion (recorded in closure); no code. |
| P2a-T6 | A F-5, A F-6 | informational | — |

## R2 triage (coordinator) — both seats APPROVE-WITH-FIXES

| # | Finding | Disposition | Ruling |
|---|---|---|---|
| P2a-T7 | A F-1 + B F-1 — lone surrogate with `Content-Type: application/json` ⇒ 500 in FastAPI's default validation handler; tests omit the header | fix | Register a `RequestValidationError` handler that returns 422 with a surrogate-safe body (never echo raw `input` values; error locations/types only). Fix both regression tests to send `Content-Type: application/json` and cover content, source, lineage refs, subject keys, source URI; assert 422 and zero store/reservation access. |
| P2a-T8 | B F-2 — whitespace-only content ⇒ 500 | fix | Candidate validation rejects content with no non-whitespace character (accepted content is never rewritten). Served-path regression: 4xx, zero store/reservation access. |
| P2a-T9 | A F-2 | informational / deploy note | R1-head rows with now-forbidden `lineage_refs` would be unreadable — no such deployment exists; recorded in closure. |
