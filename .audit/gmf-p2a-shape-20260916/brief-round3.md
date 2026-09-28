# GMF-P2A final draft — shared exact-bytes review brief

## Context

Review the exact GMF-P2A `status: draft` specification in the existing shaping
worktree. This remains store/migration shaping only, with no P2A Gate 2,
builder dispatch, implementation, or external effect.

## Inventory

- Draft: `D:/Repos/agent-skills-worktrees/gmf-p2a-shaping-20260916/plugins/foreman-line/docs/specs/active/GMF-P2A-durable-authority-accounting-store-migration.md`.
- Result: adjacent `gmf-p2a-durable-authority-accounting-store-migration.shaping-result.json`.
- The v2 design now binds every EffectAttempt to immutable
  `PermissionSpendLedger(PermissionId, SpendIndex)`; uses composite foreign
  keys to prevent cross-attempt reservation/slot/receipt/pending splicing;
  adds append-only update/delete denial triggers; adds an append-only pending
  resolution table; enforces one original terminal via a partial unique index;
  and enforces settlement amount/currency pairing.
- Migration state classification happens inside `BEGIN IMMEDIATE`, recognizes
  legacy v1 with a zero version marker, and uses a private test-only core
  callback to inject failure after a successful v2 DDL statement. A malformed
  state is separately rejected before DDL.
- The draft now limits cleanup to exact test-recorded temp paths and clarifies
  that agent-skills paths are shaping outputs, never builder authority.

## Verified observations

- Frozen frontmatter validation, shaping self-check, and ShapingResult schema
  validation pass; all thirteen SHA-256 literals are 64 lowercase hex strings.
- `git diff --check` is clean. The shaping worktree has only the draft and
  result as untracked artifacts.

## Your task

Perform a final critical architecture/security review. Test for remaining
schema-integrity gaps, migration-state contradictions, scope leakage into
P2B/P2C, or authority ambiguity. Report only concrete findings. Do not propose
implementation, promotion, dispatch, or external effects.

## Output contract

Deliver EXACTLY: "TOP 3 BRUTAL FINDINGS" (numbered, one line each) then "TOP 3 MOVES" (numbered, one line each, implementation-ready). Max 260 words total. Plain text only.
