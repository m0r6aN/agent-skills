# OPMEM-P4a — builder kickstarter (role ancestry scope + curation: proposals, dispositions, handoffs, supersession)

Coordinator: Pi `01a131a9`. Tracking: created at dispatch (parent m0r6aN/agent-skills#200).

## Workspace

- Worktree `D:/Repos/opmem-worktrees/cortex-p4a` (Keon-Systems/keon-cortex), branch `feat/opmem-p4a-curation`. Commit locally; never push.
- **Verification base (T-2):** `82c2005af099c495376359c7d6967af8d85ca46d` (`opmem/integration`, contains P1b…P3b). Create the venv if absent (`uv venv .venv --python 3.12 && uv pip install --python .venv/Scripts/python.exe -e ".[dev]"`). **Baseline: 2375 passed / 130 skipped** (`tests/temporal/test_benchmark.py::…receipt_overhead_bounded[50]` is a known flaky timing test — rerun once).
- Real PostgreSQL 16: `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex` (temporary database per run; never DDL against `cortex`). Docker `python:3.12-slim` is available for Linux parity checks.
- Before reporting: `black --check` + `isort --check-only` on every changed file.

## Contract

`C = D:/Repos/agent-skills-worktrees/opmem-coord-20261012-01a131a9/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`
- `C/follow-on-parcel-manifests.md` §P4a; `C/memory-boundary-contract.md` §2.2 (`keon.cortex.curation.disposition.v1` row), §4.1 rule 4 (role continuity without inheriting raw ancestry), §4.3 (private ancestry; cross-role visibility limited to explicit handoff artifacts, owner-approved shared preferences, approved lessons; anti-laundering; active/primary inheritance needs the approval receipt).
- `C/event-and-fixture-contract.md` §5 F-12 (inheritance anti-laundering) and N-4/N-5; `C/p1-triage-2026-10-12.md` T-35/T-36 (identifier alphabet + scope grammar).
- Existing models (read first): `src/keon/cortex/inheritance/{models,validator}.py` (R1–R9, fail closed), `src/keon/cortex/promotion/{models,validator}.py` (`MemoryPromotionRequest`, cognitive never a receipt), `tenancy/scope.py` (P1b algebra), P3a `services/memory_events.py` (operation-binding pattern), P2a scoped record identity.

## Coordinator rulings (encode exactly)

1. **Ancestry scope (`inheritance/ancestry_scope.py`):** role continuity ≠ raw ancestry. A record's raw (role-private) visibility is exactly P1b's: same `role_id` + `profile_id`; role generation is **not** a key (§4.1 rule 4). Cross-role/profile visibility arises **only** from three curated artifact classes created by an approved disposition (ruling 3): `profile_shared` (approved lesson / owner-approved shared preference — existing class), and a NEW `handoff` class visible only to one named target role in the same profile. Opaque references never leak (N-4): exact-ID/lineage/evidence/replay/recall/memory-events treat a handoff record as invisible to every role except its target (and its author role).
2. **Grammar extension (amends T-35, both sides must follow — P5a carries the Gateway half):** new scope class `handoff` with grant token `handoff:{profile_id}:{to_role_id}` (implicit for the caller's own role, never claimable for another role — same N-19 rule as `op:legacy`); new capability token `cap:curation.approve` (grant-only, never implicit). Ids keep the T-35 alphabet; validation stays full-string and loud (T-36).
3. **Curation routes (T-15):** `POST /v1/curation/proposals` — submit a proposal to promote one or more of the caller's **own visible** records to `profile_shared` (kind `lesson` | `preference`) or to `handoff` (target role); validated with the existing promotion/inheritance models; stored as `pending`. `POST /v1/curation/dispositions` — `approve` | `reject` | `supersede`; **approve requires** the caller to hold `cap:curation.approve` **and** an `approval_receipt_ref` (recorded **unverified**, like P3a evidence — Cortex cannot verify Gateway receipts until P5a; R3's "support-bearing level" is therefore capped: approved artifacts are created with `support_level: provisional`, never `active`/`primary`, until a verified-receipt path exists — record this as **OD-23**). Approval appends a **new derived record** (append-only, own scoped identity, `derived_from` lineage to the sources, `epistemic_status` carried; the derived record gains no factual or authorization authority — anti-laundering R5/F-12) and an `InheritanceEvent` that must pass `validate_inheritance_event` (fail closed: any violation ⇒ 422 and nothing written). `supersede` appends the replacement relation (old record marked non-primary per R8; history never deleted, INV-1). The proposer may not approve their own proposal.
4. **Scope & tenant:** every proposal/disposition is authenticated via the P1b carriage headers, scoped (proposer must see the sources; disposer must see the proposal), tenant-hard-gated (R9), and idempotent by `X-Keon-Operation-Id` with the P3a binding pattern (fingerprint incl. `__scope__`, replay byte-identical by deterministic reconstruction, 409 on change, current re-authorization before any cached ack).
5. **Atomicity/durability:** PG single transaction (proposal/disposition rows + derived record + inheritance event + spine events if any); in-memory all-or-nothing using the store-level locked-bundle helpers introduced in P3b (no new private-field access from `api.py`). Additive DDL only.
6. **No scoring change:** curation creates no occurrence/recall influence beyond the derived record's own ingest `Observation` (P3b rule 3 applies to the derived record as a new record).

## Allowed Files

- NEW `src/keon/cortex/inheritance/ancestry_scope.py`; UPDATE `src/keon/cortex/inheritance/validator.py` (only if a rule gap is proven — say so in Step 0)
- UPDATE `src/keon/cortex/api.py`; UPDATE `src/keon/cortex/providers/postgres/schema.py` (additive); UPDATE `src/keon/cortex/tenancy/scope.py` (ruling 2 grammar + visibility)
- NEW `tests/inheritance/test_ancestry_scope.py`; NEW `tests/inheritance/test_curation_http.py`; NEW `tests/inheritance/test_curation_postgres.py` (env-gated)
- Step 0 may request ≤1 extra NEW service module (e.g. `services/curation.py`) and store-helper additions in `providers/memory/document_store.py` / `providers/postgres/document_store.py` (additive).
- Mechanical fixture edits (list them): route-table test in `tests/test_shards_v1_1.py`; scope-grammar tests in `tests/tenancy/test_scope_enforcement.py` only where they enumerate the grammar.

## Step 0 — RESTATE AND STOP

No edits this turn. Reply with: (1) restatement; (2) design table ruling → file → approach (incl. DDL, the handoff visibility predicate, how approval caps support level, how `validate_inheritance_event` is invoked); (3) expected EXISTING-TEST-CONFLICTs; (4) amendments needed; (5) unsafe/impossible rulings with locators. Then stop.

## Completion report (after GO)

```
## P4a BUILD REPORT
### Commits
### Ruling → evidence (test names)
### Test run (exact commands + summaries; before/after; env-gated PG; black/isort)
### FIXTURE-EDITS / EXISTING-TEST-CONFLICT / NEEDS-AMENDMENT
### git diff --name-status 82c2005..HEAD
```

## Step 0 rulings (coordinator, 2026-10-13)

- **S0-1 (amendments granted):** NEW `src/keon/cortex/services/curation.py`; additive `commit_curation_bundle` helper on `InMemoryDocumentStore` (lock order doc → spine → curation, journaled rollback); the two mechanical fixture edits listed (route table; grammar-enumeration accept cases).
- **S0-2:** interpretations A–G approved as written. `preference` maps to `memory_type="lesson"` with `provenance.extra["curation_kind"]="preference"` — no `core/models.py` change.
- **S0-3:** OD-23 (approved curation artifacts capped at `support_level: provisional` until a verified approval-receipt path exists) is registered by the coordinator in `owner-delegated-decisions-2026-10-12-01a131a9.md`; the code comments reference it.
