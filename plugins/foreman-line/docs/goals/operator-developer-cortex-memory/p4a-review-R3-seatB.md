# p4a-review-R3-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE-WITH-FIXES

## TEST RUN
- `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider`
  - **2456 passed, 137 skipped**; timing benchmark passed.
- `.venv/Scripts/python.exe -m pytest tests/inheritance/test_ancestry_scope.py tests/inheritance/test_curation_http.py tests/tenancy/test_scope_enforcement.py -q -p no:cacheprovider`
  - **180 passed**.
- `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/inheritance/test_curation_postgres.py tests/test_gravity_postgres.py tests/test_recall_postgres.py -q -p no:cacheprovider`
  - **20 passed**. Curation-only rerun: **7 passed**.
- `.venv/Scripts/python.exe C:/Users/clint/AppData/Local/Temp/opmem_p4a_seat_b_run.py opmem_p4a_seat_b_R2.py`
  - Re-run twice with commit-barrier-synchronized served requests. Original supersede races now return **200/409** in both backends; identical approval retries return **200/200**, byte-identical.
  - Handoff isolation, recipient-bound identity, epistemic preservation, inheritance fail-closed behavior, text validation, self-approval refusal and rejection authorization remain intact.
- Same runner with `opmem_p4a_seat_b_R3.py` and `opmem_p4a_seat_b_R3_late.py`
  - Verified losing supersede bundles leave no derived record, spine event, disposition, inheritance event or binding; losing proposal remains pending.
  - Reproduced F-1 twice per tested interleaving/backend. Same-actor/different-role approve and supersede both return **403**, without writes.
  - PostgreSQL probes used fresh temporary databases, dropped afterward; no DDL against `cortex`.
- `.venv/Scripts/python.exe -m black --check $(git diff --name-only 82c2005..HEAD -- '*.py')` and corresponding `isort --check-only`
  - **Passed**, all 13 changed Python files. Reviewed head **efe71bb**; worktree clean and amended allowlist respected.

## TRIAGE VERIFICATION
- **P4a-T10: IMPLEMENTED** — predecessor transition arbitrated inside both commits; distinct concurrent supersedes produce one winner and complete loser rollback.
- **P4a-T11: PARTIAL** — original identical-approval race fixed; identical concurrent supersede retries still incorrectly conflict (F-1).
- **P4a-T12: IMPLEMENTED** — explicit same-actor/different-role approve/supersede tests added; stale comment corrected; independently verified both backends.
- Convergence applied: F-1 reaches PostgreSQL, so it requires rework rather than the in-memory-only carry-forward exemption.

## FINDINGS

### F-1 [minor] Identical concurrent supersede retries still return false 409
- Where: `src/keon/cortex/services/curation.py:1094–1109,1570–1574,1766–1769`.
- Evidence: Two identical served supersedes with the same caller, body and operation ID were synchronized immediately before commit. Memory returned **200/200**, byte-identical; PostgreSQL returned **200/409** twice. The conditional predecessor update runs before binding arbitration and raises `CurationStateConflict`, bypassing winner recovery. A second interleaving—both requests read the pending proposal, but one reads the predecessor after the winner commits—returned **200/409** twice in **both backends** through the unlocked predecessor-status guard. Subsequent identical retries returned **200** with the winner’s exact response bytes. Exactly one complete bundle persisted.
- Why it matters: T-11 requires an identical committed operation to replay, not report a conflicting operation. The approval-only regression tests miss supersede’s additional state gates. This is a fail-closed idempotency/backend-parity defect; no authority gain, visibility leak or data loss was reproduced.
- Required disposition: fix in rework — before returning either supersede-status conflict, recover an identical committed binding with current reauthorization; retain 409 for genuinely distinct operations. Add barrier-controlled identical-supersede regressions covering both interleavings and both backends.
