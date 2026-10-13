# OPMEM-P2b — independent adversarial code review brief

You are an INDEPENDENT reviewer of parcel OPMEM-P2b (served recall path). You did not write it. **Never fix, edit, commit or push.** You MAY run tests and read-only commands and write throw-away probes **only under your system temp directory**. Your whole output is your verdict.

- Worktree `D:/Repos/opmem-worktrees/cortex-p2b` (Keon-Systems/keon-cortex), base `ac05fdd` → head `d9ffefe` (`git diff ac05fdd..HEAD`).
- Tests: `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider` (base 2153 passed/114 skipped → head 2225 passed/118 skipped). PG: `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider` (8 passed; each run uses its own temporary database — your probes must do the same, never DDL against database `cortex`).
- Coordinator evidence: `cortex proof-bundle` at head → I1–I7 all passed.
- Spec + rulings: `C/p2b-build-kickstarter.md` (rulings 1–10 and "Step 0 rulings" S0-1…S0-4), `C = D:/Repos/agent-skills-worktrees/opmem-coord-20261012-01a131a9/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`. Background: `C/memory-boundary-contract.md` §2.3/§2.4/§4.3; `C/event-and-fixture-contract.md` §1, §2, §3, F-8, G-7, N-11, N-20/N-21.

## Hunt

1. **Accounting integrity (D11):** can any path append more than one recall event / access set for one delivery (re-render, retry, concurrent retries, new operation id on the same delivery, restart)? Can a recall event or access row be written without results being returned, or results returned without the event (recall-event-before-results)? Can `/v1/shards/search` produce accounting?
2. **Retry identity (T-11):** same op + fingerprint returns the original selection after candidate changes; changed fingerprint ⇒ 409; binding under another scope unreadable (N-21); revoked visibility ⇒ 409 (fail closed, never widened or silently shrunk). Probe races.
3. **Scope & integrity:** scope filter strictly before candidate selection; id-recompute verification fail-closed (tampered/legacy/scoped rows, non-default extractor versions); `verification_meta.excluded` honest; no cross-scope leakage via delivery key, `recall_event_id` (deterministic hash — can a caller predict/collide another scope's event?), replayed responses, or spine events.
4. **Delivery identity (§3):** key components and `task_id`/session defaulting; `first_delivered_at` anchored; `kind` handling; header validation (T-35/T-36) for operation/session ids.
5. **Durability/transactions:** PG first-delivery commit atomic (event+access+binding+spine); loser of a race converges; additive DDL; FK/unique constraints; restart recovery.
6. **Honesty labels:** `gravity_score`/`gravity_version` null; nothing claims gravitational ordering; existing `RecallService` untouched.
7. **Evidence discipline:** tests through the served pipeline? FIXTURE-EDIT (route table) mechanical? Files outside Allowed Files (+S0-1)?

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
