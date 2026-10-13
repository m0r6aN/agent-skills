# OPMEM-P3b — independent adversarial code review brief

You are an INDEPENDENT reviewer of parcel OPMEM-P3b (versioned occurrence classification, served scorer `gravity/1.1.0`, projection, recall ordering). You did not write it. **Never fix, edit, commit or push.** You MAY run tests and read-only commands and write throw-away probes **only under your system temp directory**. Your whole output is your verdict.

- Worktree `D:/Repos/opmem-worktrees/cortex-p3b` (Keon-Systems/keon-cortex), base `2930958` → head `044ca66` (`git diff 2930958..HEAD`).
- Tests: `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider` (base 2282 passed/123 skipped → head 2361 passed/127 skipped); `tests/gravity` 153 passed. PG: `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/test_gravity_postgres.py tests/test_memory_events_postgres.py tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider` (17 passed; temporary database per run — your probes likewise, never DDL against `cortex`).
- Coordinator evidence: black/isort clean; `cortex proof-bundle` I1–I7 all passed at head.
- Spec + rulings: `C/p3b-build-kickstarter.md` (rulings 1–8, "Step 0 rulings" S0-1…S0-4), `C = D:/Repos/agent-skills-worktrees/opmem-coord-20261012-01a131a9/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`. Contract: `C/event-and-fixture-contract.md` §1, §2, §4, §7 (G-1…G-14), §9 N-12.

## Hunt

1. **Frozen math (D12/INV-3, OD-10):** are the four forces and params unchanged? Is `gravity/1.0.0` byte-identical for replay (G-9)? Does the 1.1.0 function hash cover version + params + classification version? Any numeric rule smuggled in?
2. **Reinforcement integrity (D11, T-16, T-33):** can recall influence be inflated (re-render, retry, new operation id, companion churn, omitted/undelivered records, empty task id, replay-equivalent audit rows, duplicate Observation on ingest replays/races)? Can feedback-class or delivery-side events move any force (G-6, G-11, G-12, G-14, N-12)? Is association truly zero (G-10)? Do unknown kinds fail closed?
3. **Scope/tenant isolation (P2b-T6):** can projection read another tenant's or another role's history (correlation collisions, tenant-unscoped reads, delivered-row reads)? Can gravity ordering leak information across scopes?
4. **INV-2 / INV-4:** gravity never gates (zero-gravity relevant records still selected); explicit `as_of` everywhere (no hidden `now()` in gravity code); labels honest.
5. **Atomicity:** ingest + Observation append in one PG transaction (rollback tested) and all-or-nothing in memory; additive changes only to `document_store.py`/record stores.
6. **Evidence discipline:** fixtures exercise the served path; two-run byte stability; fixture edits mechanical (listed); files within the Allowed Files (+S0-1).

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
