# GMF-P2A revised draft — shared re-review brief

## Context

This is the revised GMF-P2A `status: draft` spec. It shapes durable SQLite
store/migration only; P2B owns the atomic effect transaction and P2C owns
terminal/recovery/settlement behavior. No P2A Gate 2 has been granted.

## Inventory

- Exact draft: `D:/Repos/agent-skills-worktrees/gmf-p2a-shaping-20260916/plugins/foreman-line/docs/specs/active/GMF-P2A-durable-authority-accounting-store-migration.md`.
- Exact result: adjacent `gmf-p2a-durable-authority-accounting-store-migration.shaping-result.json`.
- Revision adds a V2 Storage Contract with seven additive tables:
  `EffectAttempts`, `BudgetReservations`, `ConcurrencySlotAllocations`,
  `PreEffectReceipts`, `PendingEffects`, `TerminalReceipts`, and
  `Settlements`. It names fields, PK/UNIQUE/FK/CHECK constraints, and maps
  them to P1 clauses.
- Revision adds a Migration Contract: fresh, canonical-v1, canonical-v2, and
  invalid/future/partial state policy; one `BEGIN IMMEDIATE` upgrade; version
  write last; rollback on DDL failure; raw-SQL state assertion; and two
  separate test-host initializer processes.
- Revision corrects the three previously malformed SHA-256 literals and
  requires all thirteen pins to be 64 lowercase hex characters.
- Revision states that no P2A Gate 2 is granted, leaves key-provider selection
  carried, and confines cleanup to coordinator-verified parcel worktree/branch
  and temp databases.

## Verified observations

- Frozen `spec-linter` validation and the shaping two-layer self-check pass.
- The ShapingResult parses and schema-validates.
- All 13 recorded SHA-256 literals are lowercase 64-character values.
- `git diff --check` is clean. The shaping worktree contains only the untracked
  draft spec and shaping result.

## Your task

Review the revised draft as a critical architecture/security shaping artifact.
Judge the schema contract, migration safety, P2A/P2B/P2C boundary, verification
strength, and governance language. Identify only concrete remaining defects.
Do not recommend implementation, status promotion, dispatch, or external effects.

## Output contract

Deliver EXACTLY: "TOP 3 BRUTAL FINDINGS" (numbered, one line each) then "TOP 3 MOVES" (numbered, one line each, implementation-ready). Max 260 words total. Plain text only.
