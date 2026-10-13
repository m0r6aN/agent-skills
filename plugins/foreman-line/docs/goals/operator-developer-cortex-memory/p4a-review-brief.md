# OPMEM-P4a — independent adversarial code review brief

You are an INDEPENDENT reviewer of parcel OPMEM-P4a (role ancestry scope + curation). You did not write it. **Never fix, edit, commit or push.** You MAY run tests and read-only commands and write throw-away probes **only under your system temp directory**. Your whole output is your verdict.

- Worktree `D:/Repos/opmem-worktrees/cortex-p4a` (Keon-Systems/keon-cortex), base `82c2005` → head `b67de17` (`git diff 82c2005..HEAD`).
- Tests: `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider` (base 2375/130 → head 2443/133 + the pre-existing flaky `tests/temporal/test_benchmark.py::…receipt_overhead_bounded[50]` timing test, unrelated). PG: `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/inheritance/test_curation_postgres.py tests/test_gravity_postgres.py tests/test_recall_postgres.py -q -p no:cacheprovider` (16 passed; temporary database per run — probes likewise, never DDL against `cortex`).
- Spec + rulings: `C/p4a-build-kickstarter.md` (rulings 1–6, Step 0 rulings S0-1…S0-3), `C = D:/Repos/agent-skills-worktrees/opmem-coord-20261012-01a131a9/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`. The builder touched one file outside the Allowed Files (`spine/shard_plane.py`, one allowlist line) — the coordinator ratified it as an amendment; judge whether it is safe.
- Contract: `C/memory-boundary-contract.md` §4.1 rule 4, §4.3; `C/event-and-fixture-contract.md` §5 F-12, §9 N-4/N-5/N-19; `C/p1-triage-2026-10-12.md` T-35/T-36.

## Hunt

1. **Ancestry/visibility leaks:** can any role read another role's raw records or a handoff not addressed to it through any surface (exact-ID, lineage, evidence, replay, search, recall, memory-events, curation reads)? Can a caller claim `handoff:` or `cap:curation.approve` grants it should not have, or widen via grant parsing (N-19)? Does generation ever act as a key?
2. **Laundering (F-12, R1–R9):** can a derived/curated record gain authority (active/primary, `supported`, verified receipt) without the approval path? Is OD-23's `provisional` cap unbypassable? Does `validate_inheritance_event` gate every approval (fail closed, nothing written on violation)? Self-approval?
3. **Integrity:** append-only history (INV-1) on supersession; derived record identity and lineage; replay/recall eligibility of handoff records (the ratified `shard_plane.py` line).
4. **Idempotency/atomicity:** operation bindings, replay byte-identity, 409 on change, current re-authorization; PG single transaction and in-memory bundle all-or-nothing.
5. **Evidence discipline:** tests through the served pipeline; fixture edits mechanical; files within the (amended) Allowed Files.

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
