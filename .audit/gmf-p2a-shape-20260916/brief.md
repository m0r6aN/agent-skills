# GMF-P2A draft spec — shared red-team brief

## Context

GMF-P2A is the next Governed Model Fleet parcel after landed P0/P1. Its
charter outcome is a durable Runtime authority/accounting store and migration;
the effect path must remain disabled. The draft is `status: draft` and no P2A
Gate 2 has been granted.

## Inventory

- Draft spec: `D:/Repos/agent-skills-worktrees/gmf-p2a-shaping-20260916/plugins/foreman-line/docs/specs/active/GMF-P2A-durable-authority-accounting-store-migration.md`.
- Draft result: adjacent `gmf-p2a-durable-authority-accounting-store-migration.shaping-result.json`, containing one POSIX spec reference and `epics: []`.
- The draft gives the builder two keon-systems Allowed Files: `src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs` and a new `tests/Keon.Runtime.Tests/AuthorityAccountingStoreMigrationTests.cs`.
- The current v1 source has `PermissionSpendLedger` with composite primary key
  `(PermissionId, SpendIndex)`, enables WAL/busy timeout, writes
  `PRAGMA user_version = 1`, and provides `TryRecordSpend`/`GetSpendCount`.
- Existing ledger tests cover init, sequential counts, single-use refusal,
  restart, concurrent single-use and multi-use races, and contract interface.
- The draft directs P2A to add only store shape and a v1-to-v2 migration;
  P2B owns atomic validation/consumption/reservation/slot/pre-effect receipt
  wiring, and P2C owns reconciliation/recovery/settlement behavior.
- The draft pins P1 as read-only input, fixes the SQLite ledger direction, and
  carries key-provider selection. It forbids changes to effect-path components,
  contracts, P0/P1 records, external effects, and dependencies.

## Verified observations

- The draft passes the frozen `spec-linter` validation and shaping package
  two-layer self-check. Its shaping result reads and schema-validates.
- The `spec-linter` and `shaping` package typechecks pass from current main.
- The shaping worktree's two draft artifacts are untracked; the branch itself
  is at current main and contains no commit for this draft.
- `keon-systems` local main is clean at `2b6c755` and three commits ahead of
  its configured origin/main, exactly as recorded in the draft; no fetch/pull
  or modification was performed.

## Your task

Red-team the draft's boundary, migration safety, verification strength, and
handoff clarity. Judge whether it is ready to remain a draft for coordinator
lint and a future P2A-only Gate-2 request. Do not recommend implementation,
dispatch, a status flip, or any external effect.

## Output contract

Deliver EXACTLY: "TOP 3 BRUTAL FINDINGS" (numbered, one line each) then "TOP 3 MOVES" (numbered, one line each, implementation-ready). Max 260 words total. Plain text only.
