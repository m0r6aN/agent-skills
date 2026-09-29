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

---

# Amendment A1d — recorded-result persistence (2026-09-28)

**Scope:** `migrations/0004-idempotency-recorded-result.sql` + write/read
primitives in `rows.ts` (exported from `index.ts`). The A1-family record now
covers A1/A2/A1b/A1c/A1d.

**Why (ruling on FK-P10 review finding F2).** FK-P10 T6 (spec lines 301–312)
requires completed same-key bindings to replay their recorded result
**verbatim**: "Returns the recorded result verbatim — the original
`EffectResult` (same `code`, `decision`, `effectDigest`, `goalRevision` as
originally recorded) with `replay: true`", and each accepted call writes
"exactly one completed binding row in the same transaction as the effect".
T7 (line 326ff) composes every effectful op as exactly one FK-P9
`withTransaction`, and its `claim (no-op)` row writes **`insertIdempotencyKey`
only (completed, `effect_digest` null)** — T7 forbids persisting NOOP events.
A completed NOOP binding therefore had **no recorded bytes** to replay from,
and the engine re-derived values (probe-proven: a recorded `goalRevision` of 1
replayed as 2 after an intervening renew). **RULING: fix at the substrate,
never weaken T6** — persist the recorded `EffectResult`'s canonical bytes with
the binding at completion time.

**Design (recorded decisions).**
- **Unified completion write:** `recordCompletedBinding(storage, input)`
  stores the binding row together with `recorded_result` (the canonical bytes,
  required) — BOTH APPLIED and NOOP completions store their result, so the
  re-derivation class is eliminated entirely. Read path:
  `getRecordedResult(storage, bindingKey): Uint8Array | null` (normalized,
  `readOne` pattern). `null` means **"no recorded result"** (legacy row or
  absent binding) — the consumer must treat null as absence and must NOT
  invent one.
- **Lighter path (preferred per the amendment brief):** `idempotency_keys` is
  not foreign-key-referenced and `recorded_result` is a NULL-able BLOB, so a
  pure additive `ALTER TABLE idempotency_keys ADD COLUMN recorded_result BLOB`
  suffices — no table rebuild / 12-step cycle (unlike 0002/0003, whose targets
  are FK-referenced). The established migration wrapper still runs it in one
  `BEGIN IMMEDIATE` with the ledger insert and the pre-commit
  `foreign_key_check` gate.
- **Export encoding:** BLOB columns serialize as base64 strings in export rows
  (deterministic; compatible with the export schema's ColumnRow `string`); the
  golden vector pins the encoding.
- The existing `insertIdempotencyKey` remains the request-time binding write
  (no result bytes); `recordCompletedBinding` is the completion-time write.

**Verification (kernel-state chain, direct exits):** `node -v` → 0; `npm ci`
(lockfile unchanged) → 0; `npm run typecheck` → 0; `npm test` → 0 (167/167);
`npm run lint` → 0. Named tests: `A1d: recordCompletedBinding stores result
bytes and getRecordedResult returns them exactly` (failing-when-broken:
mutating the stored bytes changes exactly what the read returns — bytes bind
literally, never re-derived); `A1d: legacy bindings without stored results
read null; consumers must not invent one`; `A1d: APPLIED and NOOP completions
both store their result (unified invariant)`; `A1d: prior-schema (v3)
databases migrate forward transactionally to v4` (row preserved; new column
reads null). **Golden export re-derived** (4-row ledger + `recorded_result`
column): `sha256:cf9bc7e2f3ff4b5f385f85fdd14b6d1e5f2aa8b08a2a356e9f60f2b6639e67f3`
(delta paths: `tests/fixtures/golden/export-golden.json` — including a
`recordCompletedBinding` fixture op pinning the base64 encoding;
`migrations/0004-idempotency-recorded-result.sql`; `src/export.ts` BLOB
encoding; `src/rows.ts`).
