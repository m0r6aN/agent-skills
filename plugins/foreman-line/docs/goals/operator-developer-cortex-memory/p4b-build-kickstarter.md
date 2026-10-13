# OPMEM-P4b — builder kickstarter (governance/branch evidence links + served signing-key verifier)

Coordinator: Pi `01a131a9`. Tracking: created at dispatch (parent m0r6aN/agent-skills#200).

## Workspace

- Worktree `D:/Repos/opmem-worktrees/cortex-p4b` (Keon-Systems/keon-cortex), branch `feat/opmem-p4b-evidence`. Commit locally; never push.
- **Verification base (T-2):** `8cfc02fc66f543ab7202a5056235798e6c72704f` (`opmem/integration`, contains P1b…P4a). Create the venv if absent. **Baseline: 2456 passed / 137 skipped** (+ the known flaky BM-2 timing test — rerun once).
- Real PostgreSQL 16 available (`KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex`, temporary database per run) if you need it; this parcel should not need new tables.
- Before reporting: `black --check` + `isort --check-only` on every changed file.

## Contract

`C = D:/Repos/agent-skills-worktrees/opmem-coord-20261012-01a131a9/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`
- `C/follow-on-parcel-manifests.md` §P4b; `C/event-and-fixture-contract.md` §5 (four orthogonal dimensions; fixtures **F-1…F-7**, F-11, F-13, F-14), §9 **N-13**; `C/memory-boundary-contract.md` §2.2 (`verify_memory.v1` → `keon.cortex.evidence.verify.v1` → `POST /v1/evidence/verify`, ack `{verified, key_id, key_state: active|revoked|unknown, reason}`), §3 (receipt typing by verified semantics — T-10; `delib_`/`inherit_` never receipts — INV-5).
- `C/p0-triage-2026-10-12.md` T-10, T-25, T-27, T-32; OD-22/OD-23 in `C/owner-delegated-decisions-2026-10-12-01a131a9.md`.
- Existing code (read first): `collective/models.py` (`BranchRecord`, `ReviewerVerdict`, `DissentEntry` — consume, **no new Collective engine**), `proof/governed_signing.py` (`verify_receipt(receipt, registry)`), `api.py` evidence route and `_evidence_signing_key`.

## Coordinator rulings (encode exactly)

1. **Evidence links (NEW `collective/evidence_links.py`, pure, no I/O):** a typed link model that keeps the four dimensions orthogonal — memory influence (`access`/`application` refs), governance disposition (decision receipt + policy applicability), execution/outcome (action-execution receipt + observed outcome), cognitive selection (`BranchRecord` chosen/non-chosen with `ReviewerVerdict`/`DissentEntry` provenance). Rules: a denial never makes the influencing memory false (F-1/F-2); permitted-but-unexecuted is never success (F-4/F-6); unexecuted branches never acquire an outcome (F-5); cognitive `delib_`/`inherit_` ids are rejected anywhere a receipt is required (INV-5); receipts are typed by **declared semantics** (governance decision / tool-terminal / action-execution, T-10) and a tool-terminal `denied` with null execution receipt yields `not_executed`; attribution is always `self_reported` until OD-22 is resolved (F-13/F-14). Fixtures F-1…F-7, F-11, F-13, F-14 as unit tests.
2. **Trusted key registry (NEW `proof/key_registry.py`):** loads trusted Ed25519 public keys and their state (`active`|`revoked`) from Cortex configuration — env `CORTEX_EVIDENCE_TRUSTED_KEYS` (JSON list `{key_id, public_key_b64, state}`) read at app creation; malformed config ⇒ app creation fails closed (RuntimeError); **absent** config ⇒ an empty registry (every verification fails closed with `reason: "registry_unconfigured"`). Key ids follow the T-35 alphabet. Provisioning is P8.
3. **Served verifier (UPDATE `api.py`):** `POST /v1/evidence/verify` with body exactly one of `{shard_id}` or `{evidence_pack}`. Carriage-scoped exactly like `GET /v1/shards/{id}/evidence` (the shard must be visible to the caller; for a supplied pack, the pack's shard id must be visible — otherwise 404, no oracle). Verification uses **only** the trusted registry (never a key embedded in the pack); ack `{verified, key_id, key_state, reason}` with `key_state ∈ {active, revoked, unknown}`; unknown or revoked key ⇒ `verified: false` (N-13); tampered pack ⇒ `verified: false, reason: "signature_invalid"`. Read-only: no writes, no idempotency binding. Existing `GET /v1/shards/{id}/evidence` behaviour unchanged.
4. **Honesty:** nothing here upgrades OD-22/OD-23 — a verified evidence signature proves Cortex signed the pack, not that an action executed.

## Allowed Files

- NEW `src/keon/cortex/collective/evidence_links.py`; NEW `tests/collective/test_governance_branch_evidence.py`
- NEW `src/keon/cortex/proof/key_registry.py`; UPDATE `src/keon/cortex/api.py`
- NEW `tests/test_evidence_verify_http.py`
- Mechanical fixture edit (list it): route-table expectation in `tests/test_shards_v1_1.py`.

## Step 0 — RESTATE AND STOP

No edits this turn. Reply with: (1) restatement; (2) design table ruling → file → approach (incl. the exact verification algorithm and how the caller-visibility check precedes any signature work); (3) the F-/N- fixture list as you will implement it; (4) expected EXISTING-TEST-CONFLICTs; (5) amendments needed; (6) unsafe/impossible rulings with locators. Then stop.

## Completion report (after GO)

```
## P4b BUILD REPORT
### Commits
### Ruling → evidence (test names)
### Test run (exact commands + summaries; before/after; black/isort)
### FIXTURE-EDITS / EXISTING-TEST-CONFLICT / NEEDS-AMENDMENT
### git diff --name-status 8cfc02f..HEAD
```

## Step 0 rulings (coordinator, 2026-10-13)

- **S0-1:** reason vocabulary `ok | key_unknown | key_revoked | registry_unconfigured | signature_invalid` — approved. `{evidence_pack}` body = the full `data` object of `GET /v1/shards/{id}/evidence`; `{shard_id}` semantics = "Cortex's current signing key verifies under the trusted registry" — approved.
- **S0-2:** registry states `active | revoked` only (`retired` in config ⇒ RuntimeError; `unknown` derived) — approved.
- **S0-3:** route-table edit in `tests/test_shards_v1_1.py` is the sanctioned mechanical fixture edit.

## R1 triage (coordinator, 2026-10-13) — both seats REQUEST-CHANGES

| # | Finding | Disposition | Ruling |
|---|---|---|---|
| P4b-T1 | A F-1 (blocker) + B F-3 — reserved `signature`/`key_id` inside `pack` vanish from the verified payload | fix | Reject an `evidence_pack.pack` containing any reserved signing field (`signature`, `key_id`, `algorithm`) ⇒ `verified: false, reason: "signature_invalid"` (no flattening that overwrites inner fields). Served negative tests. |
| P4b-T2 | B F-2 + A F-5 — unsigned outer export fields ignored and relabelable | fix | The outer `shard_id`, `tenant_id`, `key_id`, `algorithm` must equal the signed inner values (`pack.shard_id`, `pack.tenant_id`, …) and the caller's tenant; any mismatch ⇒ 422 before signature work. Tests for envelope-only tampering. |
| P4b-T3 | B F-1 — signed tenant not authorization-bound (legacy id aliasing across tenants) | fix | Visibility is resolved on the **signed** `(pack.tenant_id, pack.shard_id)`: `pack.tenant_id` must equal the caller tenant and the record must be visible; otherwise 404 before any signature work. Legacy-id-alias regression test. |
| P4b-T4 | B F-5 — presented key ids not T-35 validated | fix | Full-string T-35/T-36 validation of presented `key_id` (422, no trimming). |
| P4b-T5 | A F-2 + B F-4 — non-chosen branches can acquire outcomes via forged branch flags / direct construction | fix | Branch ids resolve **only** against the canonical `CognitiveSelection` records (unique ids across chosen/non-chosen enforced at construction); `BranchOutcome` cannot be constructed for an id that is not chosen in its selection (`EvidenceLinks` validates every branch outcome against its selection in `__post_init__`). Tests for forged `survived`, direct construction, duplicates. |
| P4b-T6 | A F-3 — `supersedes_ref` accepts cognitive ids | fix | Apply `reject_cognitive_id` to `supersedes_ref` (INV-5). |
| P4b-T7 | A F-4 — F-7 historical marker is caller discipline | fix | `supersede()` returns `(historical_old, current_new)`; `EvidenceLinks` rejects a `current` disposition that has been superseded by another disposition in the same links. |
| P4b-T8 | A F-6 | fix (cheap) | `{shard_id}` path checks registry configuration before signing. |

## R2 triage (coordinator) — Seat A APPROVE, Seat B REQUEST-CHANGES (2 majors)

| # | Finding | Disposition | Ruling |
|---|---|---|---|
| P4b-T9 | B F-1 — same public key under several ids lets a caller relabel a revoked export to an active alias | fix | Registry load enforces **one canonical id per public key**: each entry's `key_id` must equal the canonical fingerprint used by `GET …/evidence` (`sha256(pub)[:16]` hex) and duplicate public keys are rejected (RuntimeError). Served alias-relabel regression. |
| P4b-T10 | B F-2 — degenerate/low-order Ed25519 public keys accepted | fix | Registry load rejects the identity point and all small-order points (and any key that fails the library's point decoding) with RuntimeError; served fixed-signature-forgery regression. |
| P4b-T11 | B F-3 — reason precedence for reserved inner fields | fix | Reserved-field tampering returns `signature_invalid` **regardless** of registry state (checked first after visibility/envelope); state-matrix test. |

Verification of this narrow fix: **Seat B only** (owner of the findings; Seat A approved R2).
