# p4b-review-R1-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES
## TEST RUN
- `.venv/Scripts/python.exe -B -m pytest -q -p no:cacheprovider`
  — **2499 passed, 137 skipped**.
- `.venv/Scripts/python.exe -B -m pytest tests/test_evidence_verify_http.py tests/collective/test_governance_branch_evidence.py tests/test_shards_v1_1.py -q -p no:cacheprovider`
  — **150 passed**.
- `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -B -m pytest tests/inheritance/test_curation_postgres.py tests/test_gravity_postgres.py tests/test_recall_postgres.py -q -p no:cacheprovider`
  — **20 passed**.
- `.venv/Scripts/python.exe -B -m black --check $(git diff --name-only 8cfc02f..HEAD -- '*.py')`
  — **All six changed files pass**.
- `.venv/Scripts/python.exe -B -m isort --check-only $(git diff --name-only 8cfc02f..HEAD -- '*.py')`
  — **Passed**.
- `.venv/Scripts/python.exe -B 'C:/Users/clint/AppData/Local/Temp/opmem_p4b_seat_b_probe.py'`
  — Reproduced findings below. Also confirmed ordinary same-tenant cross-role requests return **404 before crypto** for both body forms.
- `git diff --check 8cfc02f..HEAD` and `git status --short`
  — **Passed; worktree clean**.

## FINDINGS
### F-1 [major] Signed tenant ownership is not authorization-bound
- Where: `src/keon/cortex/api.py:2059–2072`.
- Evidence: Visibility checks resolve only `pack.shard_id` within the caller’s tenant; `pack.tenant_id` is never checked. The probe loaded two valid legacy rows with equal frozen-v1 IDs: tenant/source pairs `tnt_legacy` / `suffix:conversation` and `tnt_legacy:suffix` / `conversation`, with identical content. An authentic pack exported for the second tenant returned **200, `verified: true`** when submitted under the first tenant.
- Why it matters: Visibility of the caller’s row does not authorize verification of another tenant’s signed row sharing its ID. This breaks the foreign-pack/no-oracle boundary without forging a signature or breaking SHA-256. Rework must reject foreign signed ownership before signature work and add a served-path legacy-ID-alias regression; the frozen ID algorithm need not change.
- Required disposition: fix in rework

### F-2 [major] Full-data exports can be relabelled to another shard or tenant
- Where: `src/keon/cortex/api.py:249–255, 2058–2072`.
- Evidence: Starting with a genuine export, the probe changed only outer `shard_id` to `shr_not_present` and outer `tenant_id` to `tnt_foreign`, retaining the original inner pack and signature. Verification returned **200, `verified: true`, `reason: "ok"`**. Both outer identity fields are accepted but ignored.
- Why it matters: S0-1 defines the supplied body as the full export data object. The verifier certifies a contradictory export whose advertised identity differs from its signed identity. Rework must require consistent outer/inner shard and tenant identities, preserve visibility-before-crypto ordering, and test envelope-only tampering.
- Required disposition: fix in rework

### F-3 [minor] Reserved inner fields can be tampered with without invalidating verification
- Where: `src/keon/cortex/api.py:249, 568, 2067–2071`; existing canonicalization in `src/keon/cortex/proof/governed_signing.py`.
- Evidence: Adding either `pack.key_id` or `pack.signature` to a genuine export returned **200, `verified: true`** with its unchanged signature. Flattening overwrites these inner fields, and canonicalization excludes the reserved names.
- Why it matters: An altered, malformed inner pack is accepted as verified. This does not replace registry trust, but weakens the tampered-pack guarantee. Rework must reject reserved signature metadata inside `pack` and add negative served tests, without changing existing GET signing behavior.
- Required disposition: fix in rework

### F-4 [major] Non-chosen branches can acquire observed success
- Where: `src/keon/cortex/collective/evidence_links.py:453–493, 501–536`.
- Evidence: With canonical branch B stored as `survived=False`, supplying a new `BranchRecord` carrying B’s ID and `survived=True` makes `link_branch_outcome` accept an observed success for B. The probe also directly constructed `BranchOutcome("b", outcome)` inside `EvidenceLinks`; serialization reported B’s observed success despite the selection retaining B as non-chosen.
- Why it matters: F-5/F-6 guards trust caller-supplied branch metadata and can be bypassed through public composite construction. Rework must resolve IDs against the canonical selection, reject non-chosen/unknown branches, enforce unique selection IDs, and validate composite branch outcomes so direct construction cannot bypass the invariant.
- Required disposition: fix in rework

### F-5 [minor] Presented key IDs do not enforce T-35/T-36
- Where: `src/keon/cortex/api.py:251, 548–557`.
- Evidence: A supplied `key_id` of `"k_invalid\n"` was accepted and echoed in a **200** acknowledgement with `reason: "key_unknown"`. Registry configuration validates the full identifier alphabet, but the served request model checks only minimum length.
- Why it matters: Verification remains false, but malformed presented identifiers violate the input contract and enter acknowledgements instead of receiving controlled validation errors. Rework must apply full-string T-35 validation without trimming and test controls, separators, and overlong IDs.
- Required disposition: fix in rework
