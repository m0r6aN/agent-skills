# OPMEM-P2a — independent adversarial code review brief

You are an INDEPENDENT reviewer of parcel OPMEM-P2a. You did not write it and owe it no deference. **Never fix, edit, commit or push.** You MAY run the test suites and read-only commands, and write throw-away probe scripts **only under your system temp directory**. Your whole output is your verdict.

- Worktree: `D:/Repos/opmem-worktrees/cortex-p2` (Keon-Systems/keon-cortex), base `3294bd3` → head `1b261db` (`git diff 3294bd3..HEAD`).
- Tests: `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider` (base 2046 passed/110 skipped → head 2109 passed/113 skipped). Real PostgreSQL 16 is available: `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/test_postgres_roundtrip.py -q -p no:cacheprovider` (3 passed). You may create/drop **your own uniquely named schema** in that database for probes; never touch schema `keon_cortex` data used by others concurrently — prefer the in-memory app for probes.
- Spec + rulings: `C/p2a-build-kickstarter.md` (rulings 1–9 and "Step 0 rulings" S0-1…S0-4), where `C = D:/Repos/agent-skills-worktrees/opmem-coord-20261012-01a131a9/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`. Contract background: `C/memory-boundary-contract.md` §2.3, §4.3, §6; `C/p1-triage-2026-10-12.md` T-35/T-36.

## Hunt

1. **Identity/scope:** can two scopes collide on one record, or one scope read/overwrite another's record via id derivation, idempotency key, fallback key, replay, or the crash-window path? Is legacy derivation truly unchanged for direct callers?
2. **Idempotency semantics:** the builder changed `_request_hash` to fingerprint the canonicalized client-submitted body (reason: server-defaulted provenance timestamp). Judge: can semantically different requests share a fingerprint (canonicalization gaps: key order, unicode normalization, numeric forms, alias vs field names), or identical ones diverge? Does the 409/replay matrix still hold?
3. **Input hardening:** bounds enforced before store access; byte vs char counting; env parsing fail-closed; URI scheme check bypasses (case, whitespace, `HTTPS:`, `urn` variants, missing scheme, `javascript:`, data:); T-36 header validation (trailing newline, unicode whitespace, 256 boundary).
4. **shards/1.1 durability:** fields survive Postgres round trip; `shards/1` rows byte-identical; `lineage_refs`/`decision_status` validation; the stated old-reader rejection is acceptable only if no legacy row is affected.
5. **Readiness signal:** `/health` keys correct and cannot leak configuration.
6. **Evidence discipline:** do tests exercise the served pipeline? Are FIXTURE-EDITS truly mechanical? Any file changed outside the Allowed Files (+S0-2)?

## Output (STRICT — nothing else)

```
## VERDICT: <APPROVE | APPROVE-WITH-FIXES | REQUEST-CHANGES>
## TEST RUN
<commands + final summary lines>
## FINDINGS
### F-1 [blocker|major|minor|info] <title>
- Where: <file:line>
- Evidence: <observation / probe>
- Why it matters:
- Required disposition: <fix in rework | carry-forward to <parcel> | informational>
<max 8>
```
