# GMF-P2A final exact-bytes re-review — shared brief

## Context

Review the exact draft spec at
`D:/Repos/agent-skills-worktrees/gmf-p2a-shaping-20260916/plugins/foreman-line/docs/specs/active/GMF-P2A-durable-authority-accounting-store-migration.md`.
It remains a `status: draft` shaping artifact. There is no P2A Gate 2,
implementation, dispatch, status promotion, or external effect.

## Inventory

- P2A adds durable-store schema/migration only. P2B owns effect-time atomic
  behavior; P2C owns terminal/recovery/settlement behavior.
- `EffectAttempts` now binds `(PermissionId, SpendIndex)` to the immutable
  composite primary key in `PermissionSpendLedger` and allows exactly one
  attempt per spend; D21 requires every retry to have a new permission/spend.
- Pre-effect receipt identity is composite-FK bound to its exact parent
  attempt (including permission, effect, descriptor, and ordinal) and its
  reservation/slot are composite-FK bound to that same attempt.
- All v2 tables plus `PermissionSpendLedger` have append-only update/delete
  denial triggers. Pending-resolution policy is not introduced; it remains
  P2C behavior. Terminal-order/conflict behavior also remains P2C behavior.
- A fresh DB has no non-`sqlite_%` schema object; any other zero-version state
  not matching canonical v1 is malformed. `foreign_keys` is enabled before
  `BEGIN IMMEDIATE` on every ledger/migration/verifier connection.

## Verified observations

- Frozen linter, two-layer shaping self-check, and ShapingResult validation
  pass. All 13 pins are 64 lowercase hex strings; `git diff --check` is clean.
- The worktree contains only the untracked draft and shaping result.

## Your task

Return a final critical architecture/security verdict. Check for concrete
relational-integrity gaps, migration-state contradictions, scope leakage, or
authority ambiguity. Do not recommend implementation, promotion, dispatch, or
external effects.

## Output contract

Deliver EXACTLY: "TOP 3 BRUTAL FINDINGS" (numbered, one line each) then "TOP 3 MOVES" (numbered, one line each, implementation-ready). Max 260 words total. Plain text only.
