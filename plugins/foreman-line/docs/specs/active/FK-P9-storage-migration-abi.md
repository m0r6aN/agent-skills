---
ticket: FK-P9
title: Foreman Kernel - SQLite storage and migration ABI
status: draft
owner: clinton.morgan
created: 2026-09-28
updated: 2026-09-28
supersedes: null
superseded_by: null
risk: critical
surfaces: [plugins/foreman-line/kernel-state/**]
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
---

# FK-P9 — SQLite storage and migration ABI

## Intent

Build the SQLite storage substrate the operational ledger runs on: a versioned, transactional migration ABI; the events/goals/artifact (and supporting lease, transition, idempotency, cursor) tables; an asserted WAL/busy policy; fail-closed newer-schema, corruption, and path refusals in a closed error registry; an online backup/checkpoint/verify surface; and byte-deterministic storage exports. FK-P9 defines only the storage/migration substrate FK-P10 and FK-P11 will use — no lease, CAS, idempotency, or transition semantics — and records the INF-2 placement and INF-8 backup/restore obligations at CONTRACT level only. No recovery, placement, or enforcement proof is claimed.

## Constraints

### Dependency and dispatch boundary

**Status: draft — not dispatchable.** Dispatch requires (1) coordinator lint of this spec (charter §15.3; SPEC-CONVENTION §3) and (2) Step-0 restate-and-stop confirmed by the coordinator. No spec text here claims dispatch.

**Dependencies (exact):**
- **FK-P1 (merged) — contract-only dependency.** FK-P9 consumes FK-P1's recorded contract text: the `Digest` literal (`sha256:` + 64 lowercase hex) and F05.5 canonical-encoder byte rules; the `IdempotencyBinding` tuple (`principalRef`, `operationId`, `repositoryRef`, `worktreeRef`, `payloadDigest`) and the `LeaseCasDescriptor` fields (`leaseId`, `leaseOwnerPrincipalRef`, `casRevision`, `leaseExpiresAtMicros`) as the shape obligations the substrate columns must carry; `goalRevision` as the state-owned revision the cache triple binds (F05.4/F05.16); and the charter §5 rule that no credential, prompt, source payload, or secret enters the operational event stream. This is a dependency on recorded contract text, **not** a package import: FK-P9 implements the F05.5 encoder rules locally (FK-P2 pattern).
- **No dependency on FK-P2B, FK-P10, FK-P11, or any adapter.** FK-P10/FK-P11 are consumers of the exported substrate; their algorithms live in their own parcels.
- **No spec-grammar pin.** FK-P9 parses no spec bodies and consumes no SPEC-CONVENTION grammar; FK-P2's three-state gap-window pin pattern is inapplicable and none is claimed.

**Out of this parcel's dispatch preconditions:** any window on `dispatch/**`, `routing-policy/**`, `mutation-scope-guard/**`, `hooks/**`, or `skill-injection/**` (RS-2.4 — FK-P9 writes none of them).

Isolated builder branch and worktree are assigned at dispatch from a verified base SHA (charter §15.3 identity/environment rows). Standing constraints apply: `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` — #1 (typed errors at every driver/fs boundary), #2 (driver rows are `unknown` until normalized), #3 (default-deny: every structural invariant tested independently), #19 (linear-time parsing), #32 (failing-when-broken mutation tests), #34 (no shipped byte-pins of moving files; the export golden fixture pins fixture bytes, not a moving external file).

### SQLite accepted; driver binding chosen deliberately

D14 names SQLite in WAL mode; the dependency is accepted as chartered. The binding is **`better-sqlite3`**, exact version pinned in the package lockfile at implementation from the merged dispatch base (versions are never chosen from stale snapshot knowledge — FK-P1 pattern). Required binding capability set: synchronous single-connection transactions; explicit `PRAGMA` control (`journal_mode`, `busy_timeout`, `synchronous`, `foreign_keys`, `wal_autocheckpoint`, `max_page_count`); online backup API (`db.backup`) and `VACUUM INTO`; `quick_check`/`integrity_check`; typed driver errors carrying `SQLITE_*` codes; prebuilt binaries for win32-x64 (the D20 host) and linux-x64 (the stateful image), with build-from-source as the documented fallback.

| Alternative | Disposition | Reasoning |
|---|---|---|
| `better-sqlite3` (native, synchronous) | **CHOSEN** | The synchronous single-connection API matches D14's single-writer model: transaction boundaries are lexical (`BEGIN IMMEDIATE` … `COMMIT`), not event-loop interleavings. Full pragma control, online backup, integrity checks, and a driver-level `SQLITE_FULL` trigger (`max_page_count`) that gives a bounded, genuine disk-full fixture. |
| `node:sqlite` (Node built-in) | Rejected | The repository's own recorded evaluation holds the built-in "still flagged experimental on the pinned runtime (24.7.0)" and shipped a JSON store instead (`plugins/foreman-line/dispatch/src/routing-cache.ts`). A migration substrate's files outlive runtime upgrades; an experimental-flagged surface is not a stable ABI for them. Revisit only if the runtime stabilizes and a separate contract covers the switch. |
| `sqlite3` (node-sqlite3, async callbacks) | Rejected | Callback/async API turns every transaction boundary into an interleaving hazard; no synchronous transaction primitive for the single-writer lane. |
| WASM builds (`node-sqlite3-wasm`, `sql.js`, `wa-sqlite`) | Rejected | No real WAL filesystem locking; durability and locking semantics would invalidate the INF-2 placement contract and every lock/busy fixture. |
| `libsql`/`@libsql/client` | Rejected | Adds a server/remote mode surface the kernel must not carry (D15); fork-drift risk against the D14 design. |
| PostgreSQL | Rejected at charter level | INF-2 and ADR-001: no state-service migration is authorized; a changed service needs its own contract, durability, authority, recovery, and concurrency proof. |

**Native-binding consequences (recorded, not hidden):** the stateful image build (FK-P14 surface) must provide a build toolchain or pinned prebuilt download and pin the binary by lockfile integrity; the binding is the storage package's only native dependency. No version number is asserted here.

### Package and version rules

Propose private ESM package **`@foreman-line/kernel-state`** at **`plugins/foreman-line/kernel-state/`**, version/API `0.1.0`, Node >=22 (observed pinned runtime 24.7.0), TypeScript sources, biome lint config, own `package-lock.json`, no root/workspace manifest registration, no shared lockfile alteration (FK-P1/FK-P2 pattern). **Location justification:** sibling packages use kebab-case top-level directories under `plugins/foreman-line/` (`kernel-contracts`, `spec-body-compiler`, `spec-linter`, `mutation-scope-guard`, `schema-scaffold`); this path is FK-owned and non-contested — outside every contested seam (`dispatch/`, `routing-policy/`, `mutation-scope-guard/`, `hooks/`, `skill-injection/`), outside FK-P1's `kernel-contracts/`, FK-P2's `spec-body-compiler/`, and frozen `contracts/`/`authority-registry/`. The name states the deliverable: the kernel's state substrate.

The package has **no cross-package imports**. It implements the F05.5 canonical-encoder rules locally with byte-bound conformance vectors (`tests/fixtures/canonical/encoder-vectors.json`) and a read-only conformance cross-check against FK-P1's canonical golden fixtures (FK-P2 OQ-3 pattern: `kernel-contracts/**` is read-only test input for this cross-check and is never written). Runtime APIs perform filesystem and driver I/O only through the named seams (`openStorage`, `backupTo`, `exportStorage`, the path guard) and every external boundary is wrapped in typed try-catch rethrown as the package's own `StorageError` (standing constraint #1). No lease, transition, authorization, or projection logic is hidden anywhere in the package.

Version/shape discipline (FK-P1 pattern): unknown fields, unknown enum values, missing required data, and over-limit input fail closed; `apiVersion`/artifact-version mismatch refuses; additive optional fields require a negotiated newer version; renaming fields or widening meanings requires a new version and a reviewed consumer migration. Timestamps come only from an injected `Clock` seam (micros); no ambient time reads — tests inject fixed clocks, which is also what makes export determinism testable.

### Substrate, not policy (the D14 seam)

FK-P9 provides storage mechanics and DB-level constraints. It decides nothing: no lease acquisition/renewal/release rules, no trusted lease-time semantics, no revision-comparison or bump policy, no idempotency match/conflict classification, no transition legality, no projection rendering (FK-P10/FK-P11). `updateGoalRow`-style primitives take caller-supplied equality guards and perform guarded writes only. The append-only triggers, foreign keys, and unique indexes below are **substrate enforcement (defense in depth)**; the process-boundary proof that lease/idempotency/transition behavior is correct is FK-P10's, and the restart/split-brain/recovery proof is FK-P15's (stranded, RS-2.2). FK-P9 writes no domain events: migration and backup provenance lives in `schema_migrations` and the backup manifest only, so the storage layer can never manufacture a domain event or a historical approval (charter §11 stop condition).

### Placement contract (INF-2 / ADR-001 — contract only)

SQLite WAL requires a same-host local filesystem with real locking. **"Native Docker named volume" is the first-release placement contract, not a deployment preference** (ADR-001 "SQLite placement is a correctness constraint"); bind mounts (`-v D:\...`), SMB/NFS/Azure Files, and Windows `DrvFs`/9p mounts do not satisfy it. Mechanical enforcement where possible: the open sequence asserts the connection actually entered WAL mode and refuses with `STORAGE_WAL_UNAVAILABLE` otherwise. Honesty bound: the assertion catches placements that cannot enter WAL; it does **not** prove reliable locking on every filesystem. The INF-2 evidence rows (actual volume driver, backing filesystem, runtime version, mount configuration, ownership) are FK-P14/FK-P15 evidence; FK-P9 claims no placement proof. ACA with SQLite WAL on Azure Files is rejected for the current topology (INF-2); this is not a permanent ACA ban and no PostgreSQL migration is authorized.

## Contract tables

### Digest rules (F05.5 reused)

| Digest use | Kind | Preimage | Owner |
|---|---|---|---|
| `storageExportDigest` | canonical-JSON digest | UTF-8 bytes of canonical JSON `{domain: "foreman-line.kernel-state.storage-export", apiVersion: "0.1.0", payload: <export payload>}` per the F05.5 byte rules (sorted keys UTF-16 order, preserved array order, `JSON.stringify` escape set, digits-only integer lexemes, no Unicode normalization, no path case folding); emitted `sha256:` + 64 lowercase hex | FK-P9 |
| `backupManifestDigest` | canonical-JSON digest | same rules, domain `foreman-line.kernel-state.backup-manifest`, payload = manifest minus its provenance member | FK-P9 |
| migration-file digest (`schema_migrations.digest`) | bytes digest | SHA-256 over the raw migration file bytes (UTF-8, no BOM), tagged `sha256:` — a file-bytes digest, deliberately not routed through the JSON encoder | FK-P9 |
| backup-bytes digest (`BackupManifest.backupBytesDigest`) | bytes digest | SHA-256 over the produced backup file bytes, tagged `sha256:` | FK-P9 |
| `payload_digest` / `payloadDigest` / `effect_digest` columns | canonical-JSON digest | FK-P1 F05.5 domains as carried by FK-P10; FK-P9 stores and binds the tagged literal, never retags or recomputes embedded values (F01 rule) | FK-P10 semantics |

### WAL and busy policy (asserted at every open)

| Setting | Value | Behavior on failure |
|---|---|---|
| `journal_mode` | `WAL` (assert the returned mode equals `wal`) | `STORAGE_WAL_UNAVAILABLE` refusal (fail-closed placement enforcement) |
| `busy_timeout` | named constant 5000 ms (constructor-overridable, value recorded on the handle) | exhaustion → `STORAGE_LOCK_TIMEOUT` |
| `synchronous` | `FULL` | applied at every connection. **Decision (coordinator-confirmed 2026-09-28):** the state ledger favors commit durability (survives power loss) over single-writer throughput; `NORMAL` could lose the last committed transition and would violate "restart reconstructs state from SQLite". Contention measurement is FK-P10's INF-6 lane. **The amendment path is binding: switching to `NORMAL` requires a recorded FK-P9 spec amendment bumping this pragma table — never a silent tuning step.** |
| `foreign_keys` | `ON`, asserted per connection | assertion failure → `STORAGE_IO_FAILURE` |
| `wal_autocheckpoint` | 1000 pages (named constant) | plus the explicit `checkpoint()` API below |
| `locking_mode` | default `NORMAL` (readers permitted during writes) | — |
| writer-handle policy | one `Storage` write handle per database path per process | second open → `STORAGE_ALREADY_OPEN` |

### Substrate schema (the tables FK-P10/FK-P11 bind against)

Types follow FK-P1 F05.1: `Id` (nonempty ASCII ≤128 of letters/digits/dot/underscore/hyphen), `Digest` (`sha256:` + 64 lowercase hex), `SafeInt` (nonnegative safe integer), `Micros` (nonnegative integer microseconds). Semantics columns marked *(P10)* or *(P11)* are stored by FK-P9 with shape bounds only; their vocabulary and legality belong to the named parcel.

| Table | Columns | Constraints |
|---|---|---|
| `schema_migrations` | `version` (SafeInt PK, gapless from 1), `name` (Id), `digest` (Digest, migration-file bytes), `applied_at_micros` (Micros) | Immutable ledger: triggers abort UPDATE/DELETE. History is never rewritten (R24–R29 pattern); drift is a refusal, not a repair. |
| `goals` | `goal_id` (Id PK), `revision` (SafeInt, current optimistic revision), `status` (Id-shaped, vocabulary *(P10)*), `pending_transition_id` (Id or NULL, FK → `transitions`), `updated_at_micros` (Micros) | FK enforced. `revision` assignment/comparison policy is *(P10)*; FK-P9 offers guarded writes only. |
| `events` | `event_seq` (SafeInt PK AUTOINCREMENT, total order), `event_id` (Id UNIQUE), `goal_id` (Id, FK → `goals`), `kind` (Id-shaped *(P10)*), `payload` (bounded JSON text, ≤65,536 bytes), `payload_digest` (Digest), `principal_ref` (Id — identifies, never authenticates), `operation_id` (Id), `recorded_at_micros` (Micros, injected clock) | **Append-only:** triggers abort UPDATE/DELETE, including `INSERT OR REPLACE`/upsert conflict-resolution paths (each mutation shape has its own fixture). FK enforced. `payload` never carries credentials, prompts, source payloads, or secrets (charter §5); the byte cap is FK-P9-enforced, the no-secrets rule is a writer contract bound by fixture. |
| `transitions` | `transition_id` (Id PK), `goal_id` (Id FK), `status` (Id-shaped *(P10)*), `requested_by` (Id), `operation_id` (Id), `payload_digest` (Digest), `created_at_micros` (Micros), `decided_at_micros` (Micros or NULL) | FK enforced. Legality and decision semantics *(P10)*. |
| `leases` | `lease_id` (Id PK), `goal_id` (Id FK), `owner_principal_ref` (Id), `cas_revision` (SafeInt), `acquired_at_micros` (Micros), `expires_at_micros` (Micros or NULL), `released_at_micros` (Micros or NULL) | FK enforced. Partial unique index: at most one row per `goal_id` with `released_at_micros IS NULL` (substrate invariant only). Acquisition/renewal/release and trusted lease time *(P10)*. Column names carry the FK-P1 `LeaseCasDescriptor` fields verbatim. |
| `idempotency_keys` | `principal_ref`, `operation_id`, `repository_ref`, `worktree_ref` (Ids, composite PK — the FK-P1 `IdempotencyBinding` key tuple), `payload_digest` (Digest — the binding), `effect_digest` (Digest or NULL), `recorded_at_micros` (Micros), `completed_at_micros` (Micros or NULL) | Composite PK is the substrate enforcement of "same key/different payload conflicts": a second insert under the same tuple with a different `payload_digest` fails on the unique key. The classification `IDEMPOTENCY_CONFLICT` and "same completed binding returns the recorded result" are *(P10)*. |
| `artifacts` | `artifact_id` (Id PK), `goal_id` (Id or NULL, FK), `kind` (Id-shaped *(P11/P21)*), `digest` (Digest — bytes digest of the referenced artifact), `locator` (bounded descriptor ≤4,096 bytes, repo-relative or evidence-store-relative — never an arbitrary host path), `recorded_by` (Id), `recorded_at_micros` (Micros) | FK enforced. **Index only:** per D2 the referenced artifacts remain Git- or protected-store-authoritative; the table never becomes evidence authority. |
| `projection_cursors` | `projection_id` (Id PK), `goal_id` (Id or NULL, FK), `last_applied_event_seq` (SafeInt), `updated_at_micros` (Micros) | Cursor substrate only; deterministic Markdown projection *(P11)*. |
| `wakeup_handoffs` | `wakeup_id` (Id PK), `goal_id` (Id FK), `kind` (enum-shaped: `wakeup`, `handoff`), `from_session_ref` (Id), `to_session_ref` (Id or NULL), `created_at_micros` (Micros), `consumed_at_micros` (Micros or NULL) | D2 wakeup/handoff substrate; when to create/consume *(P10/P13)*. |

### Startup sequence (transactional migration startup)

Executed by `openStorage`; every step is default-deny with its own failure code and fixtures:

1. **Path gate** — `validateStoragePath`: repo-root-relative-or-configured absolute form, no traversal, no encoded escapes, no backslash/ADS/8.3/reserved-name/trailing dot-space/control/format-char/unpaired-surrogate forms; `lstat` every component and the final target; refuse any symlink/junction/reparse point **including in-root targets** (D19-consistent), refuse non-regular targets; re-verify the opened target against the checked target (substitution race). All refusals are `STORAGE_PATH_REFUSED` with a closed reasonCode and a path-form-only diagnostic (no host path is ever echoed).
2. **Open gate** — create only when `createIfMissing` is true (fresh state); an absent file with `createIfMissing: false` refuses (`STORAGE_ABSENT`); an existing non-database file refuses (`STORAGE_NOT_A_DATABASE`) — never overwritten.
3. **Connection pragmas** — the WAL/busy table above; WAL-mode assertion refuses on mismatch.
4. **Corruption gate** — `PRAGMA quick_check` at every open (full `integrity_check` in `verifyStorage` and backup verification). Garbage header/short file → `STORAGE_NOT_A_DATABASE`; failed checks → `STORAGE_CORRUPT`. Both are total refusals: no salvage export, no read-only mode, no best-effort open.
5. **Version gate** — read `schema_migrations`. Packaged-set validation (gapless numbering, unique versions, each file present) → `STORAGE_MIGRATION_SET_INVALID`. Max applied version greater than the packaged maximum → **`STORAGE_SCHEMA_AHEAD` refusal — no downgrade, no partial open, no bypass path.** Recorded digest ≠ packaged file digest, or an applied row whose packaged file is missing → `STORAGE_MIGRATION_DRIFT` refusal (history never rewritten).
6. **Apply pending migrations** — ascending versions; each migration runs alone inside `BEGIN IMMEDIATE` … `COMMIT` containing its DDL **and** its `schema_migrations` ledger insert (one transaction, so a ledger row can never exist without its schema). Any failure rolls back and refuses the open with `STORAGE_MIGRATION_FAILED`; the database remains at the last committed version and a rerun completes (or refuses again) — fail-closed, never "open anyway".
7. **Interrupted-migration recovery** — a crash inside a migration transaction is rolled back by WAL recovery on the next open; the reopened database is at the last committed version and no half-applied schema is observable. Proven by MIG fixtures, including a real child-process kill at an injected fault point; this is in-suite evidence, not the FK-P15 process-boundary recovery proof (stranded).
8. **Post-open assertions** — `foreign_keys`/`synchronous` values re-read and asserted; the `Storage` handle is returned. The storage layer writes no domain events.

### Exported API surface (the serialization point: "State migrations / storage package exports")

| Export | Contract |
|---|---|
| `openStorage(config)` | Runs the startup sequence; returns `Storage` or throws typed `StorageError` (registry code). `config`: storage root + database file name, `createIfMissing`, injected `Clock`, `busyTimeoutMicros` override, backup policy reference. |
| `closeStorage(storage)` | Idempotent bounded close; a final PASSIVE checkpoint is an observation, never a close failure. |
| `withTransaction<T>(storage, fn)` | `BEGIN IMMEDIATE` … `COMMIT`/`ROLLBACK`; nested invocation refused (`STORAGE_ARGUMENT_INVALID`); busy exhaustion → `STORAGE_LOCK_TIMEOUT`; a throwing `fn` rolls back and rethrows typed. The only transaction primitive; multi-table atomic writes (event + state + cursor, FK-P10) compose inside it. |
| Row primitives | Typed, parameter-bound, normalized at the boundary (driver rows are `unknown` until normalized — #2): `insertEvent`, `queryEvents` (ordered by `event_seq`), `insertGoal`, `getGoal`, `updateGoalRow` (caller-supplied equality guards only), `insertTransition`, `updateTransitionRow`, `insertLease`, `updateLeaseRow`, `insertIdempotencyKey`, `getIdempotencyKey`, `insertArtifact`, `getProjectionCursor`, `setProjectionCursor`, `insertWakeupHandoff`, `consumeWakeupHandoff`. |
| `verifyStorage(storageOrPath)` | `quick_check`/`integrity_check` + version/drift gates → typed result or `STORAGE_CORRUPT`. |
| `checkpoint(storage, mode)` | `wal_checkpoint(PASSIVE | FULL | RESTART | TRUNCATE)` with typed mapping. |
| `backupTo(storage, destination)` | Online backup under the storage write lock (bounded pause; state ledgers are retention-bounded) so the backup boundary is exactly a committed-transaction boundary; produces the backup file + `BackupManifest`. |
| `verifyBackup(path)` | Open read-only: integrity checks, manifest digest check, schema-version gate (a backup newer than the packaged maximum refuses exactly like `STORAGE_SCHEMA_AHEAD`). |
| `pruneBackups(policy)` | Deletes only manifest-carrying backups matching a ratified retention descriptor; with no ratified descriptor it deletes nothing. |
| `exportStorage(storage)` | Deterministic export per the export contract below. |

### Storage export contract (deterministic)

`exportStorage` returns `{ exportDocument, storageExportDigest, provenance }`.

- **Export payload** (hashed): `schemaVersion` (max applied version), `migrationHistoryDigest` (Digest over the canonical list of applied `(version, name, digest)` triples), and `tables` — every table above in the fixed order `schema_migrations, goals, events, transitions, leases, idempotency_keys, artifacts, projection_cursors, wakeup_handoffs`, each an array of rows sorted ascending by the canonical JSON encoding of the row's key tuple (UTF-16 code-unit order). Serialized under the F05.5 byte rules.
- **Provenance (excluded from the digest preimage, FK-P1 excluded-transport-fields pattern):** `exportedAtMicros`, `exporterToolVersion`, `sourceDatabaseBytesDigest`.
- **Determinism invariant:** two exports of the same logical database state are byte-identical regardless of row insertion order, page layout, checkpoint/VACUUM history, live clock reads, or member order of in-memory objects; `storageExportDigest` binds exactly the state-derived bytes. The golden export fixture pins committed bytes (fixture bytes, not a moving external file — #34).
- The export is **write-only-side**: import, restore-from-export, and projection are FK-P11/later territory; the export document carries an export schema (`schemas/storage-export.schema.json`, closed draft-07) as the consumer contract.

### INF-8 backup/restore contract (contract level only — no proof claimed)

Per RS-2.2, FK-P9 records the backup/restore contract fragments only. The process-boundary recovery proof (restart reconstruction, split-brain refusal, stale-lease/stale-authorization refusal) is **stranded** with FK-P14/FK-P15 and is named in the exit annex; nothing below claims it.

1. **Backup boundary:** a backup is a self-consistent copy of the committed state at one committed-transaction boundary, taken under the storage write lock so no write interleaves.
2. **Integrity checks:** `quick_check` on the produced file plus the backup-bytes digest and schema-version gate recorded in `BackupManifest`; `verifyBackup` repeats them independently of the producing process.
3. **Protected destination:** validated by the same path guard; must lie **outside the live storage root** and must not be the live database file or its `-wal`/`-shm` siblings; target is a regular file created via temp file + atomic rename with owner-only permissions where the platform supports them; symlink/junction destinations refuse. The concrete operator mount point is FK-P14's topology to name.
4. **Retention:** a descriptor (`maxCount`, `maxAgeMicros`) supplied by ratified operator policy; `pruneBackups` deletes only manifest-carrying backups matching it; no descriptor ⇒ no deletion. (Ruled 2026-09-28: operator-supplied, no shipped defaults — see Coordinator Rulings.)
5. **Operator restore sequence (defined, not automated):** (a) stop all writers via bounded shutdown; (b) `verifyBackup` the chosen backup — a backup newer than the packaged maximum refuses exactly like `STORAGE_SCHEMA_AHEAD`; (c) checkpoint the live database and move the prior file aside (never overwrite without a retained prior copy); (d) place the backup at the storage path; (e) `openStorage` re-runs the full startup sequence — any refusal leaves the prior copy in place; (f) dispatch restarts only by explicit operator action: **restore never silently restarts dispatch and introduces no competing recovery authority primitive** (INF-8). Ownership reconciliation and stale-lease/authorization refusal at restore are FK-P15's stranded proof; measured restore behavior and any RPO/RTO claim belong to that proof, and no numeric objective is chosen here.

### Error registry (closed `StorageErrorCode`)

Every failure crossing the API boundary carries exactly one code from this closed registry and a bounded safe diagnostic in the code's declared shape — reason literal only, constraint name only, driver code literal only, version numbers only, path-form only (FK-P1 F05.10 discipline: no host path, no row content, no credential, no driver message text — driver messages can embed paths and are never propagated).

| Code | Invariant | Safe diagnostic shape |
|---|---|---|
| STORAGE_PATH_REFUSED | storage/backup/export path passes every path dimension (closed reasonCode enum: `traversal`, `absolute`, `backslash`, `encoded-escape`, `ads-colon`, `short-name`, `reserved-name`, `trailing-dot-space`, `control-char`, `format-char`, `unpaired-surrogate`, `non-nfc`, `link-component`, `link-target`, `not-regular`, `outside-root`) | reason literal + path form only |
| STORAGE_ABSENT | create-if-missing policy respected | none |
| STORAGE_NOT_A_DATABASE | file is a SQLite database (header/short-file gate) | none |
| STORAGE_CORRUPT | `quick_check`/`integrity_check` passes | none |
| STORAGE_WAL_UNAVAILABLE | placement enters WAL mode | returned mode literal |
| STORAGE_SCHEMA_AHEAD | packaged schema version ≥ database's max applied version | version numbers only |
| STORAGE_MIGRATION_DRIFT | every applied migration row matches its packaged file digest | version + name literal only |
| STORAGE_MIGRATION_SET_INVALID | packaged migration set is gapless/unique/present | version literal only |
| STORAGE_MIGRATION_FAILED | each migration applies atomically or not at all | version literal only |
| STORAGE_LOCK_TIMEOUT | lock acquired within the busy budget | timeout value only |
| STORAGE_ALREADY_OPEN | one write handle per database path per process | none |
| STORAGE_DISK_FULL | writes fail closed on capacity exhaustion (driver `SQLITE_FULL`, incl. `max_page_count`) | driver code literal |
| STORAGE_IO_FAILURE | every other driver/filesystem failure (`SQLITE_BUSY`, `SQLITE_READONLY`, `SQLITE_CANTOPEN`, OS errors, catch-all) | driver code literal or `os-error` |
| STORAGE_CONSTRAINT_VIOLATION | DB-level invariants hold (closed reasonCode enum: `foreign-key`, `append-only`, `unique-constraint`, `check`); includes the idempotency-tuple unique violation FK-P10 maps to `IDEMPOTENCY_CONFLICT` | reason literal + constraint name only |
| STORAGE_PAYLOAD_LIMIT_EXCEEDED | event payload ≤65,536 bytes; over-limit is a protocol error, never truncation | field name only |
| STORAGE_ARGUMENT_INVALID | API inputs structurally valid (incl. nested `withTransaction`) | field path only |
| STORAGE_CLOSED | no operation on a closed handle | none |
| BACKUP_DESTINATION_REFUSED | protected-destination rules hold | reason literal + path form only |
| BACKUP_FAILED | backup completes or is deleted (temp + atomic rename; no partial file survives) | driver code literal |
| BACKUP_INTEGRITY_FAILED | produced/verified backup passes integrity + digest + version gates | none |
| EXPORT_FAILED | export completes or fails typed (bounded sink faults) | none |

### Hostile-fixture inventory (dominant hostile space; 68 fixture records)

Fixture records live in `tests/fixtures/`; hostile cases are JSON tables of `{ id, input, expectedCode | expectedOutcome, expectedReasonCode? }`, link cases are JSON tree descriptors materialized at test time, golden cases are committed byte fixtures. Every row carries a pre-declared expected outcome — including the recovery-positive WAL rows, which must show committed-state survival, not merely "did not throw".

| Class | IDs | Count | Expected |
|---|---|---|---|
| C1 Corrupt database | CORR-01 random-bytes file; CORR-02 file shorter than one page; CORR-03 valid header, flipped bytes in an interior page; CORR-04 invalid page-size field; CORR-05 SQLite-lookalike header with garbage body; CORR-06 zero-byte main file with stale `-wal` sibling | 6 | CORR-01/02/04/05/06 `STORAGE_NOT_A_DATABASE` or `STORAGE_CORRUPT` per row; CORR-03 `STORAGE_CORRUPT` via the integrity gate; every row: total refusal, no salvage export |
| C2 Truncated/invalid WAL | WAL-01 truncated WAL header; WAL-02 zero-length WAL; WAL-03 torn final frame (bad checksum on the last frame); WAL-04 stale salt vs main database; WAL-05 oversized uncheckpointed WAL; WAL-06 missing/zeroed `-shm`; WAL-07 inconsistent checksums mid-frame-sequence | 7 | WAL-03/04/05/06/07: recovery to the last committed transaction (recovery-positive rows must show exact committed-state survival and no torn transaction); WAL-01/02: recovery to the main file's committed state; any unrecoverable pairing with a corrupt main file routes to C1 codes |
| C3 Version skew | SKEW-01 database at version > packaged max; SKEW-02 recorded migration digest ≠ packaged file; SKEW-03 database at older version (forward migration); SKEW-04 database at head (noop open); SKEW-05 applied row whose packaged file is missing | 5 | SKEW-01 `STORAGE_SCHEMA_AHEAD`; SKEW-02/05 `STORAGE_MIGRATION_DRIFT`; SKEW-03 open succeeds and lands at head; SKEW-04 open succeeds |
| C4 Interrupted migration | MIG-01 injected failure after partial DDL inside the migration transaction; MIG-02 child process killed at an injected fault point mid-migration, then reopened; MIG-03 failure in the second of three migrations; MIG-04 rerun after a failed migration completes; MIG-05 migration file containing a disallowed non-transactional statement (`VACUUM`, `ATTACH`, journal pragma); MIG-06 duplicate/gapped version numbers in the packaged set | 6 | MIG-01/02/03: rollback to the pre-migration version, `STORAGE_MIGRATION_FAILED`, no half-applied schema on reopen; MIG-04 recovery-positive (rerun lands at head); MIG-05 `STORAGE_MIGRATION_FAILED` at set validation; MIG-06 `STORAGE_MIGRATION_SET_INVALID` |
| C5 Concurrent open | CONC-01 second write transaction while one holds the write lock (tiny busy budget) → `STORAGE_LOCK_TIMEOUT`; CONC-02 readers during a writer transaction observe the pre-transaction snapshot; CONC-03 two processes open + migrate the same database (exactly one applies each version); CONC-04 `backupTo` under concurrent writes yields a consistent snapshot; CONC-05 second write handle on the same path in one process | 5 | per row: CONC-01 `STORAGE_LOCK_TIMEOUT`; CONC-02 snapshot isolation observed; CONC-03 single-apply (PK) with the loser observing the migrated state; CONC-04 backup passes `verifyBackup`; CONC-05 `STORAGE_ALREADY_OPEN` |
| C6 Disk-full (bounded) | FULL-01 insert past `PRAGMA max_page_count` → driver `SQLITE_FULL`; FULL-02 `SQLITE_FULL` inside a migration transaction; FULL-03 backup destination write hits a bounded quota (fault-injected sink); FULL-04 export to a capped sink; FULL-05 checkpoint under capacity pressure | 5 | FULL-01/02: `STORAGE_DISK_FULL`, transaction rolled back, no partial row/schema; FULL-03 `BACKUP_FAILED` with no partial file surviving; FULL-04 `EXPORT_FAILED`; FULL-05 typed failure, database still consistent on reopen |
| C7 Path/symlink escape | PATH-01 `..` traversal; PATH-02 POSIX absolute; PATH-03 drive-letter absolute; PATH-04 UNC; PATH-05 device namespace (`\\?\`, `//./`); PATH-06 backslash separators; PATH-07 ADS colon; PATH-08 8.3 short name; PATH-09 reserved device name; PATH-10 trailing dot/space; PATH-11 percent-encoded escape; PATH-12 control/format chars (U+202E, U+200B, U+FEFF); PATH-13 unpaired surrogate; PATH-14 final component is a file symlink (in-root target); PATH-15 dir symlink/junction at an intermediate component (out-of-root target); PATH-16 junction at an intermediate component (in-root target); PATH-17 final target is a directory (non-regular); PATH-18 opened-target substitution race | 18 | every row `STORAGE_PATH_REFUSED` with its named reasonCode; in-root links refused with mechanism semantics (coordinator ruling 2026-09-28, rework F3): `link-component` = a link at a NON-FINAL component (PATH-15, PATH-16); `link-target` = the FINAL component is a link (PATH-14); PATH-18 detected by the re-verify contract. Privilege rule (FK-P2 OQ-5 pattern): junction cases MUST execute (chain hard-fails otherwise); file-symlink cases may skip only as machine-readable `blocked: <privilege reason>` gap records, never counted as passed |
| C8 DB invariants | INV-01 event with unknown `goal_id`; INV-02 `UPDATE` on `events`; INV-03 `DELETE` on `events`; INV-04 `INSERT OR REPLACE`/upsert on `events`; INV-05 `UPDATE`/`DELETE` on `schema_migrations` | 5 | INV-01 `STORAGE_CONSTRAINT_VIOLATION(foreign-key)`; INV-02/03/04 `STORAGE_CONSTRAINT_VIOLATION(append-only)` — each mutation shape independently (default-deny #30); INV-05 `STORAGE_CONSTRAINT_VIOLATION(append-only)` |
| C9 Export nondeterminism (#32) | EXPD-01 same rows inserted in different orders; EXPD-02 back-to-back exports of unchanged state under a live clock; EXPD-03 in-memory objects with different member order | 3 | each pair: byte-identical export documents and identical `storageExportDigest`; the determinism tests fail when the named nondeterminism is injected into the encoder |
| Positive/control | POS-01 fresh create + migrate to head; POS-02 reopen at head; POS-03 forward migration k→head; POS-04 `backupTo` → `verifyBackup` → restore-sequence execution in-process (contract-level roundtrip, explicitly not a process-boundary proof); POS-05 checkpoint TRUNCATE then reopen; POS-06 committed golden export bytes; POS-07 canonical-encoder conformance cross-check against FK-P1 golden fixtures; CTRL-01 WAL-mode assertion refuses when the pragma seam reports a non-WAL mode | 8 | POS rows pass as named; CTRL-01 `STORAGE_WAL_UNAVAILABLE`; the real network-filesystem placement case is a gap record (`blocked: no non-WAL filesystem in the test environment`) and an FK-P18′-lane evidence obligation, never counted as passed |

Counts: 6+7+5+6+5+5+18+5+3 = **60 hostile** + 8 positive/control = **68 fixture records**. Hostile classes dominate (~88%). One fixture per invalid shape, one failing-when-broken mutation per named test (#32), and at least one precedence-edge test per refusal family (the documented first-failure order is what actually fires).

## Allowed Files

Proposed builder ceiling, inactive until dispatch — exact 44-file ceiling:

- `plugins/foreman-line/kernel-state/package.json`
- `plugins/foreman-line/kernel-state/package-lock.json`
- `plugins/foreman-line/kernel-state/tsconfig.json`
- `plugins/foreman-line/kernel-state/biome.json`
- `plugins/foreman-line/kernel-state/README.md`
- `plugins/foreman-line/kernel-state/src/index.ts`
- `plugins/foreman-line/kernel-state/src/open.ts`
- `plugins/foreman-line/kernel-state/src/path-guard.ts`
- `plugins/foreman-line/kernel-state/src/migrations.ts`
- `plugins/foreman-line/kernel-state/src/schema.ts`
- `plugins/foreman-line/kernel-state/src/rows.ts`
- `plugins/foreman-line/kernel-state/src/transactions.ts`
- `plugins/foreman-line/kernel-state/src/errors.ts`
- `plugins/foreman-line/kernel-state/src/backup.ts`
- `plugins/foreman-line/kernel-state/src/export.ts`
- `plugins/foreman-line/kernel-state/src/canonical.ts`
- `plugins/foreman-line/kernel-state/src/clock.ts`
- `plugins/foreman-line/kernel-state/migrations/0001-initial.sql`
- `plugins/foreman-line/kernel-state/schemas/storage-export.schema.json`
- `plugins/foreman-line/kernel-state/tests/open.test.ts`
- `plugins/foreman-line/kernel-state/tests/path-guard.test.ts`
- `plugins/foreman-line/kernel-state/tests/migrations.test.ts`
- `plugins/foreman-line/kernel-state/tests/migration-crash.test.ts`
- `plugins/foreman-line/kernel-state/tests/concurrency.test.ts`
- `plugins/foreman-line/kernel-state/tests/disk-full.test.ts`
- `plugins/foreman-line/kernel-state/tests/corruption.test.ts`
- `plugins/foreman-line/kernel-state/tests/wal-recovery.test.ts`
- `plugins/foreman-line/kernel-state/tests/invariants.test.ts`
- `plugins/foreman-line/kernel-state/tests/backup.test.ts`
- `plugins/foreman-line/kernel-state/tests/export.test.ts`
- `plugins/foreman-line/kernel-state/tests/errors.test.ts`
- `plugins/foreman-line/kernel-state/tests/canonical-conformance.test.ts`
- `plugins/foreman-line/kernel-state/tests/fixtures/hostile/corrupt.json`
- `plugins/foreman-line/kernel-state/tests/fixtures/hostile/wal.json`
- `plugins/foreman-line/kernel-state/tests/fixtures/hostile/skew.json`
- `plugins/foreman-line/kernel-state/tests/fixtures/hostile/migration.json`
- `plugins/foreman-line/kernel-state/tests/fixtures/hostile/concurrency.json`
- `plugins/foreman-line/kernel-state/tests/fixtures/hostile/disk-full.json`
- `plugins/foreman-line/kernel-state/tests/fixtures/hostile/paths.json`
- `plugins/foreman-line/kernel-state/tests/fixtures/hostile/link-trees.json`
- `plugins/foreman-line/kernel-state/tests/fixtures/hostile/invariants.json`
- `plugins/foreman-line/kernel-state/tests/fixtures/hostile/export-determinism.json`
- `plugins/foreman-line/kernel-state/tests/fixtures/golden/export-golden.json`
- `plugins/foreman-line/kernel-state/tests/fixtures/canonical/encoder-vectors.json`

Nothing outside this package is writable. No shared manifest/export/schema/workflow/lockfile is writable; FK-P9 owns only its new package manifest, lockfile, exports, and its `migrations/` files. FK-P9 is the named serialization owner of **state migrations and storage package exports** (charter §12): if FK-P10/FK-P11 need schema change, it arrives as a new file in `migrations/` through a recorded FK-P9 amendment — never a side-channel edit. If implementation needs a path not listed here, the coordinator records a spec amendment before code; no implied neighboring-path permission.

**Forbidden surfaces (exact):** `plugins/foreman-line/dispatch/**` (contested; RCM Window-R discipline); `plugins/foreman-line/mutation-scope-guard/**` (FK-P2B / `foreman-line-boundary-routing` territory, RS-2.4); `plugins/foreman-line/routing-policy/**` (contested; `foreman-line-boundary-routing`); `plugins/foreman-line/hooks/**` (contested; FK-P2B/FK-P3 territory); `plugins/foreman-line/skill-injection/**` (`plugin-packaging-and-scaffolder` territory); `plugins/foreman-line/contracts/**` (frozen pipeline A–F contracts); `plugins/foreman-line/authority-registry/**` (FK-P0 source and generated registry); `plugins/foreman-line/kernel-contracts/**` (FK-P1's package — forbidden for mutation; read-only test input for the canonical conformance cross-check); `plugins/foreman-line/spec-body-compiler/**` (FK-P2's package); `plugins/foreman-line/docs/SPEC-CONVENTION.md`; shared manifests, root workflow files, plugin/marketplace metadata, shared lockfiles and package exports outside this package; every other goal's records; any path outside the 44 listed entries.

## Acceptance Criteria

1. **Migrations are transactional, proven by tests:** a crash inside a migration (injected fault and real child-process kill) leaves the database at the last committed version with no half-applied schema observable on reopen; a failed migration rolls back and the open fails closed (`STORAGE_MIGRATION_FAILED`); a rerun completes cleanly. No migration path opens a partially migrated database.
2. **Newer-schema and corruption refusal are total and fail-closed:** `STORAGE_SCHEMA_AHEAD` and `STORAGE_CORRUPT`/`STORAGE_NOT_A_DATABASE` refuse the open with no downgrade, salvage export, read-only fallback, or best-effort mode reachable from any exported entry point.
3. **The refusal-code registry is closed:** every failure across the API boundary carries exactly one registry code plus its declared bounded diagnostic shape; no driver message text, host path, row content, or credential can reach a caller (asserted by fault-injection tests per code).
4. **Exports are deterministic:** byte-identical export documents and `storageExportDigest` across runs, row insertion orders, and live clocks (EXPD-01..03); the golden export fixture pins the bytes; digest rules match F05.5 with the stated domain literal.
5. **WAL/busy policy is asserted, not assumed:** WAL entry is verified at open (`STORAGE_WAL_UNAVAILABLE` otherwise), `foreign_keys`/`synchronous` are asserted per connection, and busy exhaustion yields `STORAGE_LOCK_TIMEOUT` — each with its named fixture.
6. **Append-only and substrate invariants are DB-enforced:** triggers and constraints reject every mutation shape of `events`/`schema_migrations` (UPDATE, DELETE, REPLACE/upsert), FK violations, and idempotency-tuple reuse — independently tested per shape (default-deny #30), failing-when-broken (#32).
7. **Path/symlink escape refuses completely:** every C7 dimension refuses with `STORAGE_PATH_REFUSED` + its named reasonCode, in-root links included, with the opened-target race covered by the re-verify contract; privileged link fixtures follow the skip-and-record rule and are never counted as passed.
8. **Disk-full behavior is bounded and consistent:** genuine driver `SQLITE_FULL` (max_page_count) and fault-injected sink failures roll back cleanly, leave the database consistent on reopen, and never leave a partial backup/export file.
9. **INF-8 fragments are recorded at contract level only:** backup boundary, integrity checks, protected destination, retention, and restore sequence are specified; no process-boundary recovery proof, no RPO/RTO objective, and no recovery authority primitive is claimed; restore never silently restarts dispatch.
10. **INF-2 is a contract with mechanical enforcement where possible:** the WAL assertion is implemented; the spec claims no placement proof (FK-P14/FK-P15 evidence rows).
11. **Substrate-not-policy holds:** no exported function decides lease ownership, trusted lease time, revision legality, idempotency outcomes, or transition legality; guarded writes and constraints only (API audit + reviewer question 1).
12. **Mechanical completeness:** the exact 44-file ceiling holds; no root/workspace manifest registration and no shared lockfile alteration; the deterministic chain passes with direct exit codes retained; two fresh independent architecture/risk reviews return verdicts on the mandated focus questions and neither fixes nor commits.

## Out of Scope

- Lease, CAS, trusted lease-time, idempotency-match, and transition-legality semantics plus their process-boundary crash/concurrency proofs — **FK-P10**. FK-P9 supplies tables, constraints, and guarded writes only.
- Legacy import, projection, deterministic Markdown views, cutover epoch, divergence-stop — **FK-P11** (export production only is in scope here; consuming an export is not).
- `authorizeAction` and policy evaluation (**FK-P12**), the control catalog (**FK-P13**), MCP servers/readers (**FK-P4/FK-P6**), capability admission (**FK-P13**).
- Stateful image composition, state-volume ABI placement proof, operator lifecycle, and backup/restore deployment topology — **FK-P14**; restart reconstruction, split-brain, stale-lease/authorization, and migration crash recovery at a real process boundary — **FK-P15** (stranded per RS-2.2; never claimed here).
- Hook/adapters, bypass/outage matrices, enforcement promotion, CI backstops, U1 (**FK-P17′/FK-P18′/FK-P19/deferred parcels**).
- Any write to `dispatch/**`, `routing-policy/**`, `mutation-scope-guard/**`, `hooks/**`, `skill-injection/**` (RS-2.4 window discipline), `contracts/**`, `authority-registry/**`, `kernel-contracts/**`, `spec-body-compiler/**`, `SPEC-CONVENTION.md`, shared manifests/lockfiles/exports, workflows, plugin/marketplace metadata, other goals' records.
- Choosing numeric RPO/RTO objectives or a numeric retention policy (INF-8 defers them to owner policy — ruled 2026-09-28, see Coordinator Rulings); a storage-service migration (Postgres or otherwise); `sqlite-vec`/retrieval indexing (ADR-001 coordinator tooling, outside the kernel container); any latency or contention measurement claim (INF-6 belongs to FK-P10/FK-P15 lanes).
- Jira linkage, INDEX.md regeneration, corpus-registry (R32) work, and shaping-emitter/ShapingResult machinery (parent-coordinated).

## Context & References

Pinned by SHA-256 as computed on disk at shaping time (2026-09-28):

- [Live charter](../../goals/foreman-kernel/charter.md) — `sha256:29a08a63b8e1c540bfa6863a0244dddb7e08b1e3889dac64d10892f87b06b693` (D2, D14, D17, §6 Wave-3 rows, §12 serialization, §15.3 dispatch contract)
- [FK-P1–FK-P21 dispatch plan](../../goals/foreman-kernel/fk-p1-p21-dispatch-plan.md) — `sha256:51c410c5deb63fd7390fe712d7c77e4b06ae05c223d00821713d9216508bbacf` (FK-P9 row + RS-1/RS-2 annotations)
- [RS-2 Gate-1 re-ratification](../../goals/foreman-kernel/fk-rs2-gate1-reratification-2026-09-27.md) — `sha256:bb12ccb5c279b8c32095814c4a89ec577b4e0d7aa368656cd56c91a38d16b2ea` (RS-2.2 binds the INF-8 fragment/strand split)
- [FK exit annex draft](../../goals/foreman-kernel/fk-exit-annex-draft-2026-09-27.md) — `sha256:806a2a7d073ec01c5b4c66688be3924ec0ebf8cf4763adbfb68d6c84d5ffbe13` (what this parcel must NOT claim: INF-8 process-boundary row, INF-2 residual rows)
- [ADR-001 runtime infrastructure posture](../../goals/foreman-kernel/ADR-001-runtime-infrastructure-posture.md) — `sha256:7d7f1ac7f5f543052b475737879d8fa278cdb788b61df257b63e4481ed40b5e7` ("SQLite placement is a correctness constraint"; ACA/Azure-Files rejection)
- [FK-P1 lifecycle/admission/decision contracts](../done/FK-P1-lifecycle-admission-decision-contracts.md) — `sha256:ec2d892288933845c32191e587a19b8a9f650e12d31538d28c78ca54552068a2` (F05.1 bounds, F05.4 `IdempotencyBinding`/`LeaseCasDescriptor`, F05.5 digest rules, F05.10 diagnostic discipline)
- [FK-P2 spec-body compiler](../done/FK-P2-spec-body-compiler.md) — `sha256:d55247cc309f622283e9fe72e5a4fe3e7140599fc81786b5f83c0de9e02eba5a` (package conventions, skip-and-record privilege rule, conformance cross-check pattern)
- [Spec convention](../../SPEC-CONVENTION.md) — `sha256:70508684d2c929d1331ed0cd9a147fcc2206593a04fbf210314e22fb80cba0a8` (§4 schema, §4.8 Allowed Files authority; the pre-v0.4 committed revision per the shaping caveat — FK-P9 pins no grammar)
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md) — `sha256:57e345f9294cb8fcd8c3d90325505c80903648f60522f820061a5f8f288a86ac` (#1, #2, #3, #19, #32, #34)
- [`dispatch/src/routing-cache.ts`](../../dispatch/src/routing-cache.ts) — `sha256:f9128bf2f0fe8dfb4e0596b9ec13be7d214349f26993c29965c44b052167dd1a` (read-only evidence: the repository's recorded `node:sqlite` experimental-status evaluation on the pinned runtime)

## Verification Plan

**Pending, not run.** Deterministic chain, run by the coordinator on the sequential Node lane (Windows rule preserved: package setup and deterministic passes run sequentially even when reasoning lanes are concurrent), cwd the isolated `kernel-state` package, full output and direct exit codes retained: `node -v` (>=22); `npm ci`; `npm run typecheck`; `npm test` (which MUST include the read-only F05.5-encoder conformance cross-check against FK-P1's canonical golden fixtures in `tests/canonical-conformance.test.ts`, and the fixture inventory map proving 68 records with one pre-declared expected outcome each); `npm run lint`. Script names are required package interfaces, not claims that commands already run.

**Acceptance-to-evidence map:** AC1 → `migrations.test.ts` + `migration-crash.test.ts` + `fixtures/hostile/migration.json`; AC2 → `corruption.test.ts` + `fixtures/hostile/{corrupt,skew}.json`; AC3 → `errors.test.ts` (one fault-injection case per registry code); AC4 → `export.test.ts` + `fixtures/hostile/export-determinism.json` + `fixtures/golden/export-golden.json`; AC5/AC8 → `open.test.ts` + `disk-full.test.ts` + `fixtures/hostile/disk-full.json`; AC6 → `invariants.test.ts` + `fixtures/hostile/invariants.json`; AC7 → `path-guard.test.ts` + `fixtures/hostile/{paths,link-trees}.json`; AC9/AC10 → `backup.test.ts` + the INF-8/INF-2 contract sections (contract-level evidence only); AC11 → API audit in `open.test.ts` + reviewer question 1; AC12 → ceiling assertion, chain logs, two review verdicts.

**Mandated reviewer focus questions** (field-by-field assessment, not generic linting):

1. **Substrate/policy boundary (naive reading, #14):** implement the wrong-but-literal reading — is there any exported function that decides lease ownership, trusted time, revision legality, idempotency outcome, or transition legality? Do guarded writes leak CAS semantics through defaults?
2. **Crash honesty (#32):** if the migration transaction wrapper is broken (ledger insert moved to its own transaction; DDL run outside a transaction), does a named test actually fail? Does the child-process kill prove rollback, or merely that SQLite happened to recover in the observed runs?
3. **Refusal closure and diagnostics:** can any driver error message, host path, row value, or credential reach a caller through an error, log line, or manifest field? Is the registry genuinely closed at every exported boundary (including `backupTo`/`exportStorage` sinks)?
4. **Export determinism:** can two logically identical states — different insertion order, page layout, VACUUM/checkpoint history, live clock, or object member order — produce different export bytes or digests? Does anything wall-clock-, host-, driver-version-, or path-shaped enter the digest preimage?
5. **Newer-schema totality:** is there any path (salvage export, verify-only open, backup verification, restore) that reads or acts on a database whose max applied version exceeds the packaged maximum without `STORAGE_SCHEMA_AHEAD`?
6. **Append-only completeness (#30):** does the trigger set reject every mutation shape of `events`/`schema_migrations` — UPDATE, DELETE, `INSERT OR REPLACE`, upsert `DO UPDATE`, and cascade paths — and does each fixture bind to its named trigger rather than a neighbor?
7. **Placement honesty:** does the open sequence actually assert the returned journal_mode, and does the text avoid claiming INF-2 placement proof or reliable locking beyond the WAL assertion?
8. **Disk-full honesty:** is `STORAGE_DISK_FULL` simulation genuinely driver-level (`max_page_count`) rather than a mock, and is post-rollback consistency asserted by reopen + integrity check?
9. **INF-8 honesty:** does any sentence claim more than contract level — process-boundary recovery, met RPO/RTO, or a restore authority primitive? Does the restore sequence forbid silent dispatch restart in enforceable terms?
10. **Dependency honesty:** is the native-binding acceptance reproducible (lockfile, prebuilt/source-build path documented for FK-P14's image), and is the `node:sqlite` rejection grounded in the pinned runtime's recorded state rather than folklore?

## Coordinator Rulings — Resolved Decisions (2026-09-28)

Coordinator lint + OQ rulings received 2026-09-28 (quoted dispositions incorporated verbatim in substance). All shaping questions are resolved; no open questions remain. Builder Step-0 and coordinator lint of pin digests follow.

- **OQ-1 (RPO/RTO numeric objectives) — RULED (b).** Backup/restore **mechanics only**; no RPO/RTO numbers appear in FK-P9 (INF-8 forbids builder-chosen numeric objectives; measurement is the deferred FK-P15 lane). The exit annex already names INF-8's process-boundary proof as stranded. **Record-propagation directive carried for the coordinator (outside this parcel's write set):** extend the exit-annex (`../../goals/foreman-kernel/fk-exit-annex-draft-2026-09-27.md`) INF-8 stranded row to name **RPO/RTO numeric objectives explicitly as an unresolved owner-policy gap**. FK-P9 does not edit that shared goals record (one-spec write set; read-only elsewhere).
- **OQ-2 (retention descriptor values) — RULED (b).** Operator-supplied retention, no shipped defaults; no-descriptor ⇒ `pruneBackups` deletes nothing (fail-closed) stands as written.
- **OQ-3 (native binding) — CONFIRMED.** `better-sqlite3` accepted: synchronous single-connection matches D14's single-writer model; backup/integrity surface is load-bearing; `node:sqlite` is experimental per the repository's own recorded evaluation (the `dispatch/src/routing-cache.ts` citation checks out). Exact version pinned at implementation from the merged base; the FK-P14 image-build consequence is recorded as stated above.
- **OQ-4 (kernel-contracts carve-out) — CONFIRMED as written.** `kernel-contracts/**` is read-only F05.5 conformance input and Forbidden for mutation (FK-P2 OQ-3 pattern).
- **OQ-5 (migration-set serialization) — CONFIRMED as written.** `migrations/` is FK-P9-owned serialization; downstream schema needs arrive as recorded FK-P9-owned amendments, never downstream edits.
- **OQ-6 (backup destination topology) — CONFIRMED as written.** Relative backup-destination contract only; the concrete protected mount is FK-P14's topology decision.
- **Synchronous pragma — CONFIRMED (binding).** `synchronous=FULL` is the correct reading of D14's restart-reconstruction property (WAL+NORMAL can lose the last committed transition on power loss). The amendment path is binding and is written into the pragma contract table above: a switch to `NORMAL` requires a recorded FK-P9 spec amendment bumping that table — never a silent tuning step.
- **Flagged risks — all ACK as disclosed.** WAL assertion is partial placement enforcement only; file-symlink fixtures follow the FK-P2 OQ-5 skip-and-record rule with junction cases hard-failing the chain; CTRL-01 keeps its `blocked: no non-WAL filesystem in the test environment` gap record (FK-P18′-lane evidence obligation); the in-suite crash proof is never the FK-P15 process-boundary proof; the single native dependency and its FK-P14 image-build consequence are recorded. The WAL-partiality reviewer focus question (7) stands unchanged.

## Rollback

FK-P9 is an additive package on FK-owned surfaces: it creates one new private package and mutates no existing code, enforcer, data format, or shared surface. Rollback is delete-to-rollback: revert this spec and delete `plugins/foreman-line/kernel-state/` entirely. No consumer has shipped against the substrate or export schema while this spec is draft (FK-P10/FK-P11 are undispatched), so no compatibility window applies; the package itself owns no live state — any database files created by tests live in test temp directories and are deleted with the suite. If the package has merged before rollback and a later parcel consumes it, that parcel's own change removes its imports; FK-P9 migrates nothing and deletes no operator data. Migrations and the export schema are inert files with no runtime data. The INF-2/INF-8 contract text in this spec is documentation-only and carries no deployed behavior to unwind.
