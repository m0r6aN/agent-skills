# OPMEM-P3a — independent adversarial code review brief

You are an INDEPENDENT reviewer of parcel OPMEM-P3a (memory-event ingest). You did not write it. **Never fix, edit, commit or push.** You MAY run tests and read-only commands and write throw-away probes **only under your system temp directory**. Your whole output is your verdict.

- Worktree `D:/Repos/opmem-worktrees/cortex-p3a` (Keon-Systems/keon-cortex), base `b6e25c6` → head `4e5efdc` (`git diff b6e25c6..HEAD`).
- Tests: `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider` (base 2258 passed/120 skipped → head 2277 passed/123 skipped). PG: `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/test_memory_events_postgres.py tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider` (13 passed; each run uses its own temporary database — your probes must do the same, never DDL against database `cortex`).
- Black/isort clean on changed files (coordinator-checked).
- Spec + rulings: `C/p3a-build-kickstarter.md` (T-38 split; rulings 1–8; "Step 0 rulings" S0-1…S0-4), `C = D:/Repos/agent-skills-worktrees/opmem-coord-20261012-01a131a9/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`. Background: `C/event-and-fixture-contract.md` §1, §2, §5, §9; `C/memory-boundary-contract.md` §2.2/§2.3/§4.3. P2b recall surface (`/v1/recall`, `spine/recall_events.py`) is the referenced source of truth.

## Hunt

1. **Fabricated accounting:** can any request record an access/consideration/application/outcome/feedback for a record never delivered to the caller, for another scope's recall event, or for a non-existent/foreign recall event? Are references verified before any write (404, nothing written)? Can delivered `access` rows exceed the recall selection or be counted twice (T-33, S0-3)?
2. **Attribution and outcome honesty (T-27/T-34/OD-22, F-9):** can `supported` be recorded? Can `success`/`failure` be recorded without evidence, or `unknown`/`not_executed` carry a fabricated claim? Is explicit time enforced (no server `now()` substitution)?
3. **Idempotency (T-11/T-23, N-12, N-21):** replay byte-identity, changed-fingerprint 409, cross-scope operation isolation, feedback replay under new operation ids, concurrent first writes.
4. **Atomicity and durability:** PG single transaction across event rows + bindings + delivered rows + spine; in-memory all-or-nothing incl. cancellation and partial index (P2b-T8/T11/T12 discipline); additive DDL; restart recovery.
5. **No score effect:** nothing under `gravity/*` changed; no new path alters recall ordering or scores (OD-10).
6. **Input validation:** T-35/T-36 full-string ids; bounded strings; discriminated-union bypasses (unknown kind, extra fields, kind/field mismatch).
7. **Evidence discipline:** tests through the served pipeline; the single fixture edit is mechanical; files within the Allowed Files.

## Output (STRICT)

```
## VERDICT: <APPROVE | APPROVE-WITH-FIXES | REQUEST-CHANGES>
## TEST RUN
<commands + summary lines>
## FINDINGS
### F-1 [blocker|major|minor|info] <title>
- Where:
- Evidence:
- Why it matters:
- Required disposition: <fix in rework | carry-forward to <parcel> | informational>
<max 8>
```
