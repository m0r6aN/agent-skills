# OPMEM-P4b — independent adversarial code review brief

You are an INDEPENDENT reviewer of parcel OPMEM-P4b (governance/branch evidence links + served signing-key verifier). You did not write it. **Never fix, edit, commit or push.** You MAY run tests and read-only commands and write throw-away probes **only under your system temp directory**. Your whole output is your verdict.

- Worktree `D:/Repos/opmem-worktrees/cortex-p4b` (Keon-Systems/keon-cortex), base `8cfc02f` → head `8d8ced8` (`git diff 8cfc02f..HEAD`).
- Tests: `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider` (base 2456/137 → head 2499/137 + the pre-existing flaky `tests/temporal/test_benchmark.py::…receipt_overhead_bounded[50]` timing test, unrelated). PG: `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/inheritance/test_curation_postgres.py tests/test_gravity_postgres.py tests/test_recall_postgres.py -q -p no:cacheprovider` (16 passed; temporary database per run — probes likewise, never DDL against `cortex`).
- Spec + rulings: `C/p4b-build-kickstarter.md` (rulings 1–4, Step 0 rulings S0-1…S0-3), `C = D:/Repos/agent-skills-worktrees/opmem-coord-20261012-01a131a9/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`.
- Contract: `C/event-and-fixture-contract.md` §5 (F-1…F-7, F-11, F-13, F-14), §9 N-13; `C/memory-boundary-contract.md` §2.2 (verify ack), §3 (receipt typing T-10, INV-5).

## Hunt

1. **Verifier soundness (N-13):** can `verified: true` be obtained with an unknown, revoked, or pack-embedded key, a tampered pack, a pack for another shard, or a signature over a non-canonical payload? Is the registry the only trust source? Is absent/malformed configuration fail-closed?
2. **Oracle/leak:** does visibility (404) precede any signature work for both body forms? Can a caller learn about invisible shards or other tenants through verify responses or timing-relevant branches?
3. **Evidence-link semantics (F-1…F-7, F-11, F-13, F-14, INV-5):** are the four dimensions truly orthogonal? Can a denial falsify a memory, an unexecuted branch gain an outcome, permitted-but-unexecuted count as success, a `delib_`/`inherit_` id stand in for a receipt, or attribution become `supported`?
4. **Input validation:** body exactly-one-of; T-35/T-36 key ids; malformed packs.
5. **Evidence discipline:** tests through the served pipeline; fixture edit mechanical; files within the Allowed Files; existing evidence route unchanged.

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
