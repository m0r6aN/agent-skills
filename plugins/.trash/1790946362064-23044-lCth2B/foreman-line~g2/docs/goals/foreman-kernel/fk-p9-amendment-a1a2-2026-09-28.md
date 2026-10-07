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
---

# Amendment A1c — read primitives (2026-09-28)

**Note:** this record now covers the A1/A2/A1b/A1c amendment family (FK-P9-owned
schema + substrate surface amendments, all via the recorded FK-P9 route).

**Scope:** no schema change — three additive read primitives in `rows.ts`
(exported from `index.ts`, normalized rows, the same `readOne` pattern as
`getGoal`): `getLease(storage, leaseId)`, `getUnreleasedLease(storage, goalId)`
(`WHERE goal_id = ? AND released_at_micros IS NULL`; at most one row per goal
via the existing `leases_single_active` partial unique index), and
`getTransition(storage, transitionId)`.

**Why (routed from FK-P10's implementation-start gap finding):** FK-P10 T3/T4
(`docs/specs/active/FK-P10-lease-transition-engine.md`, pin verified in the
amendment session) require reading leases and transitions — T4's claim
preconditions ("no active lease"; `leaseId` unused; owner check on
renew/release) and decide preconditions (`TRANSITION_ABSENT` /
`ALREADY_DECIDED` / `NOT_PENDING`) all read row state — but the FK-P9 export
surface previously read only `getGoal` / `queryEvents` / `getIdempotencyKey` /
`getProjectionCursor`. Citations: T3 "Exported engine surface" (line 238 —
`createEngine` wraps an FK-P9 `Storage` handle; "reads take no binding and no
CAS") and T4 "Lease semantics (single-writer per D14)" (line 272 — the
precondition/effect/refusal table above). Row types carry the existing column
shapes verbatim (the FK-P1 `LeaseCasDescriptor` / `IdempotencyBinding` fields
included).

**Boundary (no raw SQL):** FK-P10's own constraint (spec lines 115–119,
"Substrate, not storage"): "All writes compose FK-P9's `withTransaction` +
parameter-bound row primitives; there is no second transaction primitive and
no raw SQL in this package." The gap is closed on the FK-P9 side so
kernel-lease stays free of raw SQL; **rejected alternative B** — FK-P10 /
kernel-lease reimplementing substrate reads with raw SELECTs — is rejected
because it forks substrate-primitive semantics outside their owner (the
reviewer Q8 probe class) and would let consumer packages drift from the
normalized row shapes. FK-P10's tests observe row state via the documented
`exportStorage` surface; FK-P9's raw-driver SELECT tests remain FK-P9-internal
fixture machinery only.

**Verification (kernel-state chain, direct exits):** `node -v` → 0; `npm ci`
(lockfile unchanged) → 0; `npm run typecheck` → 0; `npm test` → 0 (163/163);
`npm run lint` → 0. Named tests: `A1c: getLease distinguishes absent vs
present exactly; normalized shape binds` (failing-when-broken: mutated row
values bind the normalized shape; poisoned values refuse with
`row-normalization` instead of leaking wrong-typed rows);
`A1c: getUnreleasedLease ignores released leases and respects single-active`
(failing-when-broken: releasing the active lease empties the read);
`A1c: getTransition distinguishes absent vs present exactly; normalized shape
binds`. Golden export unchanged (reads only):
`sha256:3e898ee8fb9928784d4bec03d87d7354c5701d8562d93763c208d93cbdf6e267`
stands.

**Optional fold (closure INFO residual, P3):** the survivor-side
`HARNESS_*`-branded seam errors now rethrow across the seam boundary unwrapped
(`readAppliedMigrations` catch): harness failures never launder into
product-shaped errors on either racer path.
