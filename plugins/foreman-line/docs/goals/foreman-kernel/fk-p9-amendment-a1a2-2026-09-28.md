# FK-P9 amendment A1/A2 — 2026-09-28

**Parcel:** FK-P9 — Storage and migration ABI (post-merge amendment, owner session)
**Scope:** exactly one new migration file (`migrations/0002-goal-status-checks.sql`) carrying A1 + A2, plus this record. Per the FK-P9 spec's migration-ownership rule (OQ-5 ruling): post-P9 schema needs arrive as new `migrations/` files through a recorded FK-P9-owned amendment, never downstream edits.

## Requests and rulings cited

- **A1 — goals.status closed vocabulary.** FK-P10 OQ-1 ruling: `goals.status` is the closed five-value vocabulary `proposed | active | awaiting-human | completed | cancelled` (kebab spelling as ruled). Requested via FK-P10 shaping so the substrate enforces the domain the ledger semantics will rely on.
- **A2 — lookup-bound index.** FK-P10 OQ-8 request: `events(goal_id, operation_id)` index for ledger lookups. **Performance-only — explicitly NOT correctness-blocking** (FK-P10 OQ-8 wording); its absence degrades lookup latency only. Shipped inside the same 0002 migration file per the one-file ceiling of this amendment.

## What the migration does

1. **A1 (additive domain tightening):** rebuilds `goals` through SQLite's documented ALTER TABLE procedure — `goals_v2` carries the original constraints plus `ck_goals_status CHECK (status IN ('proposed', 'active', 'awaiting-human', 'completed', 'cancelled'))`, copies rows, drops the old table, renames into place. Prior-schema databases migrate forward transactionally: 0002 runs in the FK-P9 migration ABI's single `BEGIN IMMEDIATE` … `COMMIT` containing its DDL and its `schema_migrations` ledger insert, and records its own file-bytes digest in `schema_migrations`.
2. **A2 (performance-only):** `CREATE INDEX events_goal_operation_idx ON events (goal_id, operation_id)`.

## Migration machinery note (SQLite 12-step procedure)

A rebuild cannot drop a foreign-key-referenced table (`goals` is referenced by six substrate tables) with enforcement on, and the enforcement toggle is a no-op inside a transaction. `applyMigration` now performs the documented procedure around each migration transaction: enforcement off before `BEGIN IMMEDIATE`, a fail-closed `PRAGMA foreign_key_check` gate before `COMMIT` (violations refuse and roll back), enforcement restored immediately after (the post-open assertion re-reads `foreign_keys`). The migration file itself contains no pragma — the disallowed-statement rule (VACUUM/ATTACH/DETACH/journal pragmas) is unchanged.

## Migration boundary (honest note)

The vocabulary mapping for any legacy status values is FK-P10 semantics, not FK-P9's (substrate, not policy). 0002 therefore copies rows strictly: prior-schema databases whose `goals.status` values lie within the ruled vocabulary migrate forward transactionally; a row with any other value refuses the migration fail-closed with `STORAGE_MIGRATION_FAILED`, and the database remains at the last committed version with its rows intact (verified by test). No status value is silently rewritten.

## Verification (kernel-state chain, direct exits)

`node -v` (v24.7.0) → 0; `npm ci` (lockfile unchanged) → 0; `npm run typecheck` → 0; `npm test` → 0 (**154/154**, up from 149; additions only); `npm run lint` → 0.

Named tests added: `A1: goals.status CHECK refuses out-of-vocab values as a typed constraint violation` (failing-when-broken: a vocab value inserts cleanly — the CHECK is what refuses); `A1: the five-value status vocab is exactly enforced (default-deny)`; `A1: prior-schema databases migrate forward transactionally`; `A1: out-of-vocab legacy rows refuse the 0002 migration fail-closed`; `A2: events(goal_id, operation_id) lookup index exists and binds query plans` (failing-when-broken: dropping the index unbinds the query plan). The MIG-02 real child-process-kill crash fixture now covers the real packaged 0002 mid-transaction (kill between its DDL and its copy statement) with reopen at version 1, no half-applied schema, and a clean rerun to version 2 asserting the CHECK and the index are live.

Invalid-status inserts surface as `STORAGE_CONSTRAINT_VIOLATION` with `reasonCode: 'check'` per the FK-P9 error mapping (SQLITE_CONSTRAINT_CHECK). Golden export fixture re-derived byte-exact (`storageExportDigest` `sha256:c69a0cec103fbc75c187cc052e1033113867da5ab1953f3c36ff1ca2cf4f20f3`) for the two-row ledger and vocab statuses.