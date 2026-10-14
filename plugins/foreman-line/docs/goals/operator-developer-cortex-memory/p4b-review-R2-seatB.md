# p4b-review-R2-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES
## TEST RUN
- `.venv/Scripts/python.exe -B -m pytest -q -p no:cacheprovider`
  — **2524 passed, 137 skipped**.
- `.venv/Scripts/python.exe -B -m pytest tests/test_evidence_verify_http.py tests/collective/test_governance_branch_evidence.py tests/test_shards_v1_1.py -q -p no:cacheprovider`
  — **175 passed**.
- `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -B -m pytest tests/inheritance/test_curation_postgres.py tests/test_gravity_postgres.py tests/test_recall_postgres.py -q -p no:cacheprovider`
  — **20 passed**.
- `.venv/Scripts/python.exe -B -m black --check $(git diff --name-only 8cfc02f..HEAD -- '*.py')`
  — **All six changed Python files pass**.
- `.venv/Scripts/python.exe -B -m isort --check-only $(git diff --name-only 8cfc02f..HEAD -- '*.py')`
  — **Passed**.
- `.venv/Scripts/python.exe -B 'C:/Users/clint/AppData/Local/Temp/opmem_p4b_r2_seat_b_probe.py'`
  — Reran R1 counterexamples with corrected expectations; reproduced findings below. Confirmed foreign-tenant legacy aliases and same-tenant cross-role requests return **404 before crypto**, noncanonical signatures and embedded-key forgeries fail, and empty-registry shard verification does not sign.
- `git diff --check 8cfc02f..HEAD` and `git status --short`
  — **Passed; worktree clean**.

## TRIAGE VERIFICATION
- **P4b-T1: PARTIAL** — reserved inner fields cannot produce successful verification, but `signature_invalid` is returned only for active known keys; other registry states override the mandated reason.
- **P4b-T2: PARTIAL** — shard/tenant envelope consistency and algorithm validation implemented; signing-key identity remains unsigned and relabelable under accepted registry aliases.
- **P4b-T3: IMPLEMENTED** — actual frozen-v1 tenant/source alias probe now returns 404 before crypto.
- **P4b-T4: IMPLEMENTED** — full-string validation rejects trailing newline, separators, padding, overlength and surrogate key IDs with 422.
- **P4b-T5: IMPLEMENTED** — forged survivor flags, invalid composite branch outcomes and duplicate selection IDs rejected.
- **P4b-T6: IMPLEMENTED** — cognitive IDs rejected in `supersedes_ref`.
- **P4b-T7: IMPLEMENTED** — historical/current pair returned; composite rejects superseded dispositions still marked current.
- **P4b-T8: IMPLEMENTED** — empty registry short-circuits before signing, after visibility.

## FINDINGS
### F-1 [major] Unsigned key identity permits revocation bypass through accepted aliases
- Where: `src/keon/cortex/api.py:567–599, 2126–2132`; `src/keon/cortex/proof/key_registry.py:105–114`; `src/keon/cortex/proof/governed_signing.py:66–68`.
- Evidence: The registry accepts the same public-key bytes under the original GET-derived ID marked `revoked` and `k_active_alias` marked `active`. A genuine export initially returns `verified: false, reason: "key_revoked"`. Changing **only outer `key_id`** to `k_active_alias`, without changing the signature or inner pack, returns **200, `verified: true`, `reason: "ok"`**.
- Why it matters: P4b-T2 does not authenticate or enforce the export’s original signing-key identity. Under this accepted configuration, a revoked-key export becomes verified through caller-controlled relabelling. Enforce a canonical identity and unambiguous revocation per public key, compatible with existing GET-derived IDs, and add served alias/relabel regressions.
- Required disposition: fix in rework

### F-2 [major] Degenerate configured Ed25519 key allows public, fixed-signature forgery
- Where: `src/keon/cortex/proof/key_registry.py:133–152`; `src/keon/cortex/api.py:599`.
- Evidence: Configuration accepts the Ed25519 identity-point encoding `01` followed by 31 zero bytes as an active public key. Using its canonical GET-style fingerprint as `key_id`, the served probe changed a genuine export’s inner content and supplied the fixed signature `(identity_point + 32 zero bytes).hex()`. Verification returned **200, `verified: true`, `reason: "ok"`**. No corresponding private key was possessed or used.
- Why it matters: With this invalid trust material configured, the verifier authenticates arbitrary payloads; malformed cryptographic configuration is not fail-closed. Validate configured keys using a vetted validation path that rejects identity/low-order invalid key material with `RuntimeError`, and add a served fixed-forgery regression.
- Required disposition: fix in rework

### F-3 [minor] Reserved-field rejection does not implement the specified reason precedence
- Where: `src/keon/cortex/api.py:565–594`.
- Evidence: Adding inner `pack.key_id` returns `key_revoked`, `key_unknown`, or `registry_unconfigured` for the respective registry states, rather than P4b-T1’s categorical `signature_invalid`. All cases correctly retain `verified: false`.
- Why it matters: The security guard is effective, but the acknowledgement contract remains partially implemented and the added tests cover only active-key precedence. Reconcile T1 with the registry-reason rules through an approved clarification or implementation change, and test the state matrix.
- Required disposition: fix in rework
