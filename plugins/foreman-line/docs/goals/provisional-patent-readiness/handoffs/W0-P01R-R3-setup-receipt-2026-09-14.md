# W0-P01R-R3 exact worktree setup receipt

Recorded 2026-09-14T10:42:23Z. Actual human ratification of the frozen R3 proposal SHA-256 `E2315C046D0F57BDA27BE4FACAE3E0899E04A3CC2A714437D24017BA9767A751` was separately recorded. Owner ratification receipt SHA-256 `B42A8AC4AA25740ECB69A676554BB1EE45B94776A97F28DA004C0FD3DF501334`; owner **pre-setup** receipt SHA-256 `EC1565DEE082CD919ACA50396E158303109F0D6873DCB0E60A83586BA04F476A`. The company Coordinator's independent pre-setup clearance and preservation receipt preceded this command.

The custody owner executed **only** the exact ratified local setup command:

```powershell
git -C "D:/Repos/agent-skills-worktrees/provisional-patent-readiness-20260813" worktree add -b "codex/w0-p01r-r3-fixture-20260913" "D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01r-r3-fixture-20260913" "cced8e20c8deb2eb21fb5ac242e65cebd3b2c322"
```

The full outer `exec_command` result was forwarded to the model, including `exit_code: 0`; there was no `session_id`. Git reported the new branch and `HEAD is now at cced8e2` after checkout completion. Read-only post-setup verification directly observed:

| Item | Result |
|---|---|
| Exact new worktree | Exists as an ordinary directory, not a reparse point |
| Current branch | `codex/w0-p01r-r3-fixture-20260913` |
| HEAD | `cced8e20c8deb2eb21fb5ac242e65cebd3b2c322` |
| `git status --porcelain=v1` | Empty / clean |
| R3 proof root and `attempt-01/` | Not created; proof root absent |
| Conditional S output root | Absent |
| Frozen R3 proposal | SHA-256 still `E2315C046D0F57BDA27BE4FACAE3E0899E04A3CC2A714437D24017BA9767A751` |
| Frozen R2 snapshot | SHA-256 still `495319E12CC79427B04319EA363BB5A66363651F6F223BD3209E9883523A97E6` |

No candidate, harness, fixture, or proof attempt was created or run. No protected patent/doctrine source or source Git metadata was opened. No staging, commit, merge, fetch, pull, push, remote action, patent-package drafting, disclosure, counsel transmission, signing, payment, or filing occurred. The next authorized action is dispatch of a **new distinct actually frontier** builder for **read-only R3 Step 0 only**, followed by a separate company Coordinator checkpoint before any script edit or attempt creation.
