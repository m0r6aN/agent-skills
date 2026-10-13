# p4b-review-R3-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE-WITH-FIXES
## TEST RUN
Reviewed head `360a3d6`, delta `b052511..360a3d6`.

- `.venv/Scripts/python.exe -B -m pytest -q -p no:cacheprovider`
  — **2537 passed, 137 skipped**.
- `.venv/Scripts/python.exe -B -m pytest tests/test_evidence_verify_http.py tests/collective/test_governance_branch_evidence.py tests/test_shards_v1_1.py -q -p no:cacheprovider`
  — **188 passed**.
- `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -B -m pytest tests/inheritance/test_curation_postgres.py tests/test_gravity_postgres.py tests/test_recall_postgres.py -q -p no:cacheprovider`
  — **20 passed**.
- `.venv/Scripts/python.exe -B -m black --check $(git diff --name-only 8cfc02f..HEAD -- '*.py')`
  — **All six changed Python files pass**.
- `.venv/Scripts/python.exe -B -m isort --check-only $(git diff --name-only 8cfc02f..HEAD -- '*.py')`
  — **Passed**.
- `.venv/Scripts/python.exe -B 'C:/Users/clint/AppData/Local/Temp/opmem_p4b_r3_seat_b_probe.py'`
  — **Passed**: reran R2 counterexamples with rejection expectations; exercised actual app-creation failures and served verification.
- `git diff --check 8cfc02f..HEAD`, `git diff --check b052511..360a3d6`, and `git status --short`
  — **Passed; worktree clean**.

## TRIAGE VERIFICATION
- **P4b-T9: IMPLEMENTED** — original revoked/active-alias configuration and duplicate-key configuration raise `RuntimeError` at loading and app creation. Served relabelling returns `key_unknown` for the rejected alias and `signature_invalid` for a different enrolled active key; the original export remains `key_revoked`.
- **P4b-T10: IMPLEMENTED** — all eight canonical small-order points and six noncanonical/noncurve encodings rejected at loading and app creation, in both active and revoked states. The R2 fixed-signature forgery cannot enroll its identity key and does not verify through HTTP.
- **P4b-T11: IMPLEMENTED behavior; regression-test gap below** — independent served probes return `signature_invalid` for all three reserved fields across active, revoked, genuinely unknown/nonempty, and unconfigured registries, preserving the appropriate `key_state`.
- Reconfirmed visibility-first 404s before crypto, including the frozen-v1 cross-tenant alias; noncanonical signatures and embedded-key forgeries fail closed. **No verifier soundness hole, oracle/leak, or fail-open reproduced.**

## FINDINGS
### F-1 [minor] “Unknown” matrix case actually exercises an empty registry
- Where: `tests/test_evidence_verify_http.py:824–843`.
- Evidence: Both `"unknown"` and `"unconfigured"` select `TrustedKeyRegistry.empty()`. My independent probe used a nonempty registry containing an unrelated valid key and confirmed the intended `signature_invalid` response.
- Why it matters: The committed matrix does not cover unknown-key precedence in a configured registry. Moving the unknown-key return ahead of reserved-field rejection could regress this contract without failing that test.
- Required disposition: fix in rework — construct a nonempty unrelated-key registry for `"unknown"` and assert the untampered control returns `key_unknown`, while reserved-field tampering returns `signature_invalid`.
