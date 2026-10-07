# @foreman-line/kernel-state

FK-P9: the SQLite storage substrate the operational ledger runs on — a
versioned, transactional migration ABI; the events/goals/artifact (and
supporting lease, transition, idempotency, cursor, wakeup) tables; an asserted
WAL/busy policy; fail-closed newer-schema, corruption, and path refusals in a
closed `StorageErrorCode` registry; an online backup/checkpoint/verify surface;
and byte-deterministic storage exports.

**Substrate, not policy.** This package decides nothing: no lease
acquisition/renewal/release rules, no trusted lease-time semantics, no
revision-comparison or bump policy, no idempotency match/conflict
classification, no transition legality, no projection rendering. Those belong
to FK-P10/FK-P11. `updateGoalRow`-style primitives take caller-supplied
equality guards and perform guarded writes only. The append-only triggers,
foreign keys, and unique indexes are substrate enforcement (defense in depth).

## Commands (run sequentially on the host)

- `node -v` — Node >= 22 (observed pinned runtime 24.7.0)
- `npm ci` — lockfile-respecting install
- `npm run typecheck`
- `npm test`
- `npm run lint`

## Asserted WAL/busy policy

| Setting | Value | Behavior on failure |
| --- | --- | --- |
| `journal_mode` | `WAL` (asserted) | `STORAGE_WAL_UNAVAILABLE` refusal |
| `busy_timeout` | 5,000,000 µs (constructor-overridable, recorded on the handle) | `STORAGE_LOCK_TIMEOUT` |
| `synchronous` | `FULL` | assertion failure → `STORAGE_IO_FAILURE` |
| `foreign_keys` | `ON`, asserted per connection | assertion failure → `STORAGE_IO_FAILURE` |
| `wal_autocheckpoint` | 1000 pages | plus explicit `checkpoint()` |
| `recursive_triggers` | `ON` (substrate enforcement: fires the append-only delete trigger for `INSERT OR REPLACE`'s implicit conflict-resolution delete) | — |
| writer-handle policy | one `Storage` write handle per database path per process | `STORAGE_ALREADY_OPEN` |

`synchronous=FULL` is a **binding coordinator ruling** (2026-09-28): the state
ledger favors commit durability over single-writer throughput. **The amendment
path binds: switching to `NORMAL` requires a recorded FK-P9 spec amendment
bumping the pragma table — never a silent tuning step.**

### WAL partiality disclosure (honesty bound)

The open sequence asserts that the connection actually entered WAL mode and
refuses with `STORAGE_WAL_UNAVAILABLE` otherwise. This assertion catches
placements that cannot enter WAL (fail-closed placement enforcement), but it
does **not** prove reliable locking on every filesystem. It is partial
placement enforcement only. The real network-filesystem placement case is a
gap record (`blocked: no non-WAL filesystem in the test environment`) and an
FK-P18′-lane evidence obligation, never counted as passed. INF-2 evidence rows
(actual volume driver, backing filesystem, runtime version, mount
configuration, ownership) are FK-P14/FK-P15 territory; this package claims no
placement proof.

## Path gate (documented first-failure order)

When several path dimensions are violated, the first listed reason fires:

1. `unpaired-surrogate`
2. `control-char`
3. `format-char`
4. `absolute` (device namespace, then UNC, then drive letter, then POSIX)
5. `backslash`
6. `encoded-escape`
7. `ads-colon`
8. `traversal`
9. `reserved-name`
10. `short-name`
11. `trailing-dot-space`
12. `non-nfc`
13. filesystem phase: `outside-root` / `link-component` / `link-target` /
    `not-regular` (per component), then the opened-target re-verify

Accepted form: repo-root-relative, or the configured absolute form
(identity-matched to configuration — never a new absolute path). Symlinks,
junctions, and reparse points refuse **including in-root targets** (D19). The
checked target is re-verified against the opened target (substitution race).
Diagnostics are path-form-only: no host path is ever echoed.

## Migrations

Packaged in `migrations/`, owned by FK-P9: downstream schema needs arrive as a
recorded FK-P9-owned amendment (new file), never a downstream edit. Each
migration runs alone inside `BEGIN IMMEDIATE` … `COMMIT` containing its DDL and
its `schema_migrations` ledger insert (one transaction). History is never
rewritten: drift and newer schemas are refusals
(`STORAGE_MIGRATION_DRIFT` / `STORAGE_SCHEMA_AHEAD`), not repairs. Disallowed
in migration bodies: `VACUUM`, `ATTACH`, `DETACH`, `PRAGMA`, and `CASE`…`END`
(the statement scanner tracks `BEGIN`…`END` trigger bodies).

## Backup/restore (INF-8, contract level only)

A backup is a self-consistent copy of the committed state at one
committed-transaction boundary, taken under the storage write lock (a dedicated
lock connection holds `BEGIN IMMEDIATE` across the copy so no write
interleaves). Integrity: `quick_check` on the produced file plus the
backup-bytes digest and schema-version gate recorded in `BackupManifest`;
`verifyBackup` repeats them independently of the producing process.

The protected destination lies **outside** the live storage root, is never the
live database file or its `-wal`/`-shm` siblings, and is created via temp file
+ atomic rename (no partial file survives). The concrete operator mount point
is FK-P14's topology decision (OQ-6).

**Retention (OQ-2):** the descriptor (`maxCount`, `maxAgeMicros`) comes from
ratified operator policy. There are no shipped defaults: with no descriptor,
`pruneBackups` deletes nothing. Only manifest-carrying backup pairs are ever
deleted.

**Operator restore sequence (defined, not automated):** (a) stop all writers
via bounded shutdown; (b) `verifyBackup` the chosen backup — a backup newer
than the packaged maximum refuses exactly like `STORAGE_SCHEMA_AHEAD`; (c)
checkpoint the live database and move the prior file aside (never overwrite
without a retained prior copy); (d) place the backup at the storage path; (e)
`openStorage` re-runs the full startup sequence — any refusal leaves the prior
copy in place; (f) dispatch restarts only by explicit operator action.
**Restore never silently restarts dispatch and introduces no competing
recovery authority primitive.** No process-boundary recovery proof and no
RPO/RTO objective is claimed here (RPO/RTO numbers are an unresolved
owner-policy gap; measurement belongs to the stranded FK-P15 lane).

## Exports (deterministic)

`exportStorage(storage)` returns `{ exportDocument, storageExportDigest,
provenance }`. The digest preimage is the UTF-8 bytes of canonical JSON
`{domain: "foreman-line.kernel-state.storage-export", apiVersion: "0.1.0",
payload}` under the F05.5 byte rules (sorted keys UTF-16 order, preserved
array order, `JSON.stringify` escape set, digits-only integer lexemes, no
Unicode normalization, no path case folding). Provenance is excluded from the
preimage and returned separately. Two exports of the same logical state are
byte-identical regardless of row insertion order, page layout,
checkpoint/VACUUM history, live clocks, or member order. The export is
write-only-side: import and projection are FK-P11; the consumer contract is
`schemas/storage-export.schema.json` (closed draft-07).

The F05.5 encoder is implemented locally (no cross-package imports) and is
bound by byte vectors (`tests/fixtures/canonical/encoder-vectors.json`) plus a
read-only conformance cross-check against FK-P1's canonical golden fixtures
(`kernel-contracts/**` is read-only test input here and is never written).

## Error registry

Every failure crossing the API boundary carries exactly one code from the
closed `StorageErrorCode` registry plus a bounded safe diagnostic: reason
literal only, constraint name only, driver code literal only, version numbers
only, path form only. No driver message text, host path, row content, or
credential can reach a caller. The code count is derived from the registry
table (`STORAGE_ERROR_CODE_COUNT`), never hand-typed; a test asserts the union
and the spec's registry table agree as name sets.

## Testing notes

- Hostile fixtures dominate (`tests/fixtures/hostile/`); every record carries a
  pre-declared expected outcome. The inventory map proves 68 records
  (60 hostile + 8 positive/control).
- Junction path cases MUST execute (the chain hard-fails otherwise). File-
  symlink cases may skip only as machine-readable `blocked: <privilege reason>`
  gap records, never counted as passed (FK-P2 OQ-5 skip-and-record rule).
- CTRL-01 keeps its `blocked: no non-WAL filesystem in the test environment`
  gap record as an FK-P18′-lane evidence obligation.
- The interrupted-migration kill is a real external child-process kill
  mid-transaction (in-suite evidence — never the FK-P15 process-boundary
  proof).
- Disk-full rows use genuine driver `SQLITE_FULL` via `max_page_count` where
  the driver can produce it; `FULL-05`'s checkpoint fault uses the pragma seam
  (a checkpoint cannot exhaust the page budget itself: SQLite clamps
  `max_page_count` to the current size) with genuine capacity pressure
  established first.

## Native binding note (FK-P14)

`better-sqlite3` is this package's only native dependency; the exact version
is pinned in `package-lock.json` from the merged dispatch base. The stateful
image build must provide a build toolchain or pinned prebuilt download for
win32-x64 and linux-x64, pinned by lockfile integrity (build-from-source is
the documented fallback).

better-sqlite3 v13 ships prebuilt `.node` binaries in its tarball
(`prebuilds/win32-x64.node`, `prebuilds/linux-x64.node`, …) and sets
`"gypfile": false` in its manifest so no build runs. npm's lockfile
serialization drops that field, and lockfile-driven installs (`npm ci`, or
`npm install` with a lockfile present) then attempt a spurious `node-gyp
rebuild` that fails on hosts without a C++ toolchain. The committed
`package-lock.json` therefore carries `"gypfile": false` in the
`node_modules/better-sqlite3` entry — the package's own manifest field, kept
so lifecycle evaluation stays correct on buildless hosts. If the lockfile is
ever regenerated by `npm install`, that field must be re-added (or a C++
toolchain provided).
