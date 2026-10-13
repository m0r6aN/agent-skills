# p4b-review-R2-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE

## TEST RUN
```
.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
  → 2524 passed, 137 skipped, 2 warnings in 57.72s   (matches R2 expected head b052511; BM-2 flake did not trip)

.venv/Scripts/python.exe -m pytest tests/test_evidence_verify_http.py tests/collective/test_governance_branch_evidence.py tests/test_shards_v1_1.py -q -p no:cacheprovider
  → 175 passed in 4.94s

KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/inheritance/test_curation_postgres.py tests/test_gravity_postgres.py tests/test_recall_postgres.py -q -p no:cacheprovider
  → 20 passed in 8.50s

black --check / isort --check-only on all 4 rework-touched files → clean.
git diff --name-status 8d8ced8..b052511 → api.py, evidence_links.py, + 2 test files only; 8cfc02f..b052511 still exactly the 6 Allowed Files; GET /v1/shards/{id}/evidence untouched.
R1 probes re-run under %TEMP% (served pipeline, read-only; probes below in TRIAGE VERIFICATION). Registry-only trust re-confirmed: self-signed pack under a trusted key_id ⇒ signature_invalid; revoked ⇒ key_revoked; unknown ⇒ key_unknown; `retired` config ⇒ RuntimeError at load; read-only re-confirmed (no new shard rows, no idempotency reservations from verify calls).
```

## TRIAGE VERIFICATION
- **P4b-T1: IMPLEMENTED** — injecting `key_id`, `signature`, or `algorithm` inside `pack` (including the R1 F-1 exact reproduction and the "inner == outer genuine values" variant) ⇒ `verified: false, reason: "signature_invalid"`; the check (`api.py:2123` `tampered_inner`) fires before the merge so inner fields are never overwritten; baseline genuine round-trip still `verified: true / ok`. Byte-tamper of `pack.content_hash` ⇒ `signature_invalid`.
- **P4b-T2: IMPLEMENTED** — outer `shard_id` or `tenant_id` ≠ signed inner values ⇒ 422 "envelope identity does not match the signed pack"; `algorithm != "ed25519"` ⇒ 422; all before any signature work. (Outer `key_id` equality vs inner is vacuously satisfied: inner `key_id` is now a rejected reserved field, and the envelope `key_id` is the sole presented id resolved against the registry — registry-only trust holds.)
- **P4b-T3: IMPLEMENTED** — visibility resolves on signed `(pack.tenant_id, pack.shard_id)`: genuine tnt_a pack presented by tnt_b caller ⇒ 404; forged `pack.tenant_id="tnt_b"` from tnt_b ⇒ 404 (signature never checked); missing/non-string inner ids ⇒ uniform 404 before signature work. No cross-tenant oracle observed.
- **P4b-T4: IMPLEMENTED** — full-string T-35 validation, no trimming: malformed outer `key_id` ("bad key!") ⇒ 422; padded outer `shard_id` ⇒ 422; `{shard_id}` body `"../etc"` and `sid + " "` ⇒ 422 (`EvidencePackExport` field_validator + model_validator, `api.py:257-283`).
- **P4b-T5: IMPLEMENTED** — my R1 F-2 probes now fail closed: forged `survived=True` on a non-chosen id ⇒ rejected (id resolved against canonical selection records, `evidence_links.py` `link_branch_outcome`); unknown id ⇒ rejected; duplicate chosen/non-chosen and duplicate non-chosen ids ⇒ rejected at `CognitiveSelection.__post_init__`; direct `BranchOutcome("branch_b", outcome)` ⇒ rejected by `EvidenceLinks.__post_init__` (also: outcomes without a selection, unknown-branch outcomes). Legit chosen-outcome + unobserved non-chosen still constructs.
- **P4b-T6: IMPLEMENTED** — `supersedes_ref="delib_fake"` / `"inherit_x"` ⇒ ValueError via `reject_cognitive_id` in `GovernanceDisposition.__post_init__` (my R1 F-3 probe now fails closed).
- **P4b-T7: IMPLEMENTED** — `supersede()` returns `(historical_old, current_new)`; `EvidenceLinks` rejects a `current` disposition whose `decision_receipt.receipt_id` appears in another disposition's `supersedes_ref`; `(historical, current)` pair constructs; INV-1 frozen re-confirmed (FrozenInstanceError).
- **P4b-T8: IMPLEMENTED** — spied `sign_receipt`: empty registry on the `{shard_id}` path returns `registry_unconfigured` with **zero** signing calls; visibility 404 still precedes the registry check.

## FINDINGS

### F-1 [info] Outer `generated_at` remains unsigned and unvalidated
- Where: `src/keon/cortex/api.py:252-258` `EvidencePackExport` (`generated_at: str | None`, no validator, not bound to any signed value).
- Evidence: a pack with a relabelled `generated_at` still verifies `true` (all T2-ruled fields — `shard_id`, `tenant_id`, `algorithm`, and effectively `key_id` — are now bound; `generated_at` was outside the T2 ruling's list).
- Why it matters: residual sliver of my R1 F-5 foot-gun; fail-closed (nothing trusts it), but a consumer reading `data.generated_at` after a verified ack reads an unattested value. Doc note or envelope binding when P5a wires `CortexEvidenceVerifyHandler`.
- Required disposition: informational

### F-2 [info] `EvidenceLinks` permits duplicate `BranchOutcome` entries for the chosen branch
- Where: `src/keon/cortex/collective/evidence_links.py:542-566` `EvidenceLinks.__post_init__` (validates membership and chosen-only outcomes, not uniqueness of `branch_outcomes` ids).
- Evidence: probe — `branch_outcomes=(BranchOutcome("branch_a", success), BranchOutcome("branch_a", failure))` constructs; both serialize.
- Why it matters: no F-5/F-6 bypass (both entries are for the executed chosen branch), but contradictory observed statuses for one branch can coexist in a single links record — serialization-consumer hygiene only.
- Required disposition: informational
