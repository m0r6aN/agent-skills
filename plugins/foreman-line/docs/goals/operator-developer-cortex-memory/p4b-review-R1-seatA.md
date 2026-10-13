# p4b-review-R1-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES

## TEST RUN
```
.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
  → 2499 passed, 137 skipped, 2 warnings in 59.15s   (matches reported head; BM-2 flake did not trip)

.venv/Scripts/python.exe -m pytest tests/test_evidence_verify_http.py tests/collective/test_governance_branch_evidence.py tests/test_shards_v1_1.py -q -p no:cacheprovider
  → 150 passed in 3.96s

KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/inheritance/test_curation_postgres.py tests/test_gravity_postgres.py tests/test_recall_postgres.py -q -p no:cacheprovider
  → 20 passed in 8.71s

black --check / isort --check-only on all 6 changed files → clean.
git diff --name-status 8cfc02f..HEAD → exactly the 6 Allowed Files; GET /v1/shards/{id}/evidence untouched.
Adversarial probes (in-memory served pipeline, read-only): registry-only trust confirmed (self-signed pack under a trusted key_id ⇒ signature_invalid); pack swapped onto another visible shard ⇒ signature_invalid; missing inner shard_id / cross-tenant / unknown shard ⇒ uniform 404 before signature work; exactly-one-of ⇒ 422; read-only confirmed (no shard rows, no idempotency reservations). Two probes produced counterexamples — Findings F-1, F-2.
```

## FINDINGS

### F-1 [blocker] Tampered pack verifies `true`: reserved-key injection inside `pack` is invisible to the verifier
- Where: `src/keon/cortex/api.py:2067-2071` (`signed = {**export.pack, "signature": ..., "key_id": ...}`) + `src/keon/cortex/api.py:529` `_verify_signed_evidence` relying on `proof/governed_signing._canonical_payload`, which strips top-level `signature`/`key_id`.
- Evidence: served-pipeline probe — take a genuine export, set `pack["key_id"]="evil_key"`, `pack["signature"]="deadbeef"`, POST `{evidence_pack}` ⇒ `{"verified": true, "key_state": "active", "reason": "ok"}`. The dict-merge overwrites the injected keys and canonicalization then strips them, so attacker-controlled bytes vanish from the verified payload.
- Why it matters: Ruling 3 is categorical — "tampered pack ⇒ `verified: false, reason: "signature_invalid"`" — and hunt question 1 ("can `verified: true` be obtained with … a tampered pack?") has a demonstrated YES for this mutation class. The ack attests a pack Cortex never signed byte-for-byte; a consumer reading `pack.key_id`/`pack.signature` after a verified ack is attesting attacker-controlled values. Fix is small: reject an `evidence_pack.pack` containing the reserved keys `signature`/`key_id` (422 or `signature_invalid`) before verification.
- Required disposition: fix in rework

### F-2 [major] F-5 is bypassable: a non-chosen branch can acquire an observed outcome
- Where: `src/keon/cortex/collective/evidence_links.py:472` `link_branch_outcome` (trusts the caller-supplied `branch.survived` flag instead of the selection's record for that `branch_id`); `evidence_links.py:453` `BranchOutcome` (public, unguarded constructor); `EvidenceLinks` performs no cross-validation of `branch_outcomes` against `selection`.
- Evidence: probe — `link_branch_outcome(sel, outcome, branch=BranchRecord("branch_b", …, survived=True))` where `branch_b` is in `non_chosen` ⇒ returns `BranchOutcome("branch_b", success)` (the id-membership check passes, the forged flag defeats the guard). Also `BranchOutcome(branch_id="branch_b", outcome=out)` constructs directly and serializes as `observed: "success"` inside `EvidenceLinks.to_dict()`. `CognitiveSelection` additionally accepts duplicate `branch_id` across chosen/non_chosen.
- Why it matters: Ruling 1 requires the typed model itself to encode "unexecuted branches never acquire an outcome (F-5)". The guard exists but is defeated through the same public API it decorates, so downstream parcels consuming this model inherit a hole where a pruned branch gains an invented success/failure. Fix: resolve `branch_id` against the selection's own records and gate `BranchOutcome` construction (or validate in `EvidenceLinks.__post_init__`).
- Required disposition: fix in rework

### F-3 [minor] INV-5 gap: `supersedes_ref` receipt slot accepts cognitive ids
- Where: `src/keon/cortex/collective/evidence_links.py:250` (`supersedes_ref: Optional[str]`, no guard; `__post_init__` never calls `reject_cognitive_id` on it).
- Evidence: probe — `GovernanceDisposition(disposition="denied", decision_receipt=<valid>, reason="x", supersedes_ref="delib_fake")` constructs successfully. `supersede()` itself is safe (copies a validated `receipt_id`), but direct construction is not.
- Why it matters: `supersedes_ref` names the superseded **decision receipt** (per `supersede()`'s own semantics), so INV-5's "rejected anywhere a receipt is required" applies; a `delib_` id can currently stand in a receipt-reference slot.
- Required disposition: fix in rework

### F-4 [minor] F-7 historical marker is caller discipline, not model enforcement
- Where: `src/keon/cortex/collective/evidence_links.py:290` `supersede`; test `test_f7_supersession_keeps_historical_denial_unrewritten` uses `dataclasses.replace(old, applicability="historical")` manually.
- Evidence: `supersede()` returns the new `current` disposition but produces no `historical` re-record of the old one; nothing prevents two `current` dispositions where one is superseded (`EvidenceLinks` does not cross-check `supersedes_ref` against applicability).
- Why it matters: F-7 requires historical validity and current applicability "recorded separately"; here the separation exists in the vocabulary but the helper leaves the superseded record marked `current` unless every caller remembers the manual `replace`. Returning `(historical_old, current_new)` would close it. INV-1 itself is honored (frozen dataclass, probe confirmed FrozenInstanceError).
- Required disposition: fix in rework

### F-5 [info] Request-body `key_id` is not T-35-validated; top-level export fields are unsigned and ignored
- Where: `src/keon/cortex/api.py:241-256` `EvidencePackExport` (`key_id: min_length=1` only; `shard_id`/`tenant_id`/`algorithm`/`generated_at` outside the signature).
- Evidence: probe — export with top-level `shard_id: "shr_lies"` still verifies `true` (visibility correctly keyed to the **signed** inner `pack.shard_id`); an out-of-alphabet body `key_id` can never match a registry entry (registry enforces `is_valid_identifier` at load) so it fails closed as `key_unknown`.
- Why it matters: both are fail-closed today, so informational — but the unsigned top-level envelope fields are a standing foot-gun for consumers who assume the whole `data` object is attested; worth a doc note or rejecting mismatched envelope/pack `shard_id` when P5a wires `CortexEvidenceVerifyHandler`.
- Required disposition: informational

### F-6 [info] `shard_id` path performs Ed25519 signing before the registry-unconfigured short-circuit
- Where: `src/keon/cortex/api.py:2052-2060` (sign) vs `_verify_signed_evidence` early return at `api.py:543-549`.
- Evidence: with an empty registry, the route signs a fresh pack and then discards it for `registry_unconfigured`. Visibility (404) still strictly precedes all signature work in both body forms, so no oracle; this is wasted crypto only.
- Why it matters: negligible today; ordering hygiene if the pack ever grows.
- Required disposition: informational
