# PMC-P2B implementation handoff

Status: private implementation complete; independent implementation reviews and
full remote CI remain merge gates. No permit, transport, provider call, real ledger
initialization, budget provisioning, host configuration or activation is present.

## Authority and inspected pins

- Builder base: `13449def0c8e321c102ff9b1f679d3e56ac28300`.
- Branch: `codex/hro-pmc-p2b-20260926`.
- Governing P2B spec blob: `b8b6061f86239196f208467e849c845754d0d2a6`.
- Accepted concrete contract: `eca5dd5197a92d5247a46b67826f47276fca899d`.
- P1b merged predecessor: `60a62b1cccf06e6a23bfe2294beb758799d5e317`.
- P2A value-port contract read directly from Git object
  `d65ff524bba2eda6c9e38de44c78aac4aae1c59f`; the older checked-out P2A document
  is not substituted for that accepted contract. No P2A implementation import.
- Amendment 05 V4 governs exact arithmetic and durable unknown liabilities.
- Money slice committed as `115d2a4`; the final ledger/source freeze is the commit
  containing this handoff, whose full SHA is reported to the coordinator.

Step 0 verified the clean head/spec and actual Node/SQLite APIs, then stopped.
The coordinator released implementation and accepted these concrete dispositions:

1. Initialization authentication receives the owned frozen initialization request.
2. Settlement/no-send authentication receives `(context: AttemptV1,
   observationOrProof: unknown)`. Both arguments are owned/frozen. Current durable
   identity/state is checked again inside the write transaction after authentication.
3. Test-only interception of real SQLite methods may inject commit/IO failures;
   genuine SQLite contention, disk-full and process-crash tests remain mandatory.
   There is no production fault port or alternate in-memory implementation.
4. Hash the flattened ordered input tuple described below, with literal fixtures.
5. Path checks reject traversal, UNC/device paths and symlink/reparse escapes;
   hostile OS writers and rollback to legitimate old backups remain excluded.

Only the two implementation modules, two permanent test files and this handoff
were changed. No public barrel, package/lockfile, upstream schema or policy changed.
Existing dependency trees were used through ignored local junctions only where
the target was absent and the corresponding package-lock SHA-256 matched. No
installation or write into shared dependencies occurred.

## Exported internal ports

`dispatch/src/pmc-launch/money.ts` exports `computePmcCostV1` and types
`PmcPriceInputV1`, `PmcCostValueV1`, `PmcMoneyCodeV1`, `PmcMoneyResultV1`.

`dispatch/src/pmc-launch/ledger.ts` exports `initializeLocalPmcLedger`,
`createLocalPmcLedger` and types `PmcLedgerOwnerPortsV1`,
`PmcLedgerTrustedPortsV1`, `PmcLedgerInitializeRequestV1`,
`PmcLedgerOpenRequestV1`, `BudgetScopeV1`, `BudgetSnapshotV1`, `AttemptV1`,
`LedgerIdentity`, `LedgerCode`, `LedgerResult<T>`, `LocalPmcLedger`.

The only capability methods are snapshot, reserve, consume, settle and
cancelWithNoSendProof. Capabilities retain bounded owned configuration and captured
trusted function descriptors, never live connections. Methods accept unknown
ordinary data and return closed frozen success/refusal values. Request bodies
cannot provide or replace authentication functions. Caller function objects are
neither frozen nor retained through the original caller-owned ports record.

The caller possessing these internal ports is trusted code. P2C must authenticate
exact rate-source assertions and bind request, source/profile, tariff, price
evidence and returned values. A content digest, pure helper success, request JSON,
or a resolver decision does not establish authenticity. P2C imports these internal
modules only after acceptance and forwards the unchanged cost value and evidence.

Owner initialization is separate from ordinary open. The owner must durably hold
expected identity/epoch/authority outside the store, authorize initialization once,
and reconcile any interrupted/lost acknowledgement explicitly. No ordinary open
or capability method invokes initialization. Reuse of an old initialization
authority after deleting storage must be refused by the trusted external owner;
the local store cannot detect its own complete historical deletion or old backups.

## Fixed content digests

All hashes are lowercase SHA-256 over UTF-8 `JSON.stringify` of owned records,
without caller toJSON or incidental property order. No hash is an authenticity
credential.

Cost value tuple, in exact order:

```text
[
  "pmc-cost-value/v1",
  version, currency, requestDigest,
  {bindingId, provider, providerModelId},
  sourceProfileId, sourceProfileVersion, sourceProfileDigest,
  tariffDigest, priceEvidenceDigest,
  {value: inputRate.value, unit: inputRate.unit},
  {value: outputRate.value, unit: outputRate.unit},
  perRequestFeeUsd, otherFees, maximumInputTokens, maximumOutputTokens,
  null | {input, output},
  maximumMicroUsd,
  {kind:"projected", inputTokens, outputTokens, usd:{numerator,denominator}}
    | {kind:"unit-price", outputUsdPerMillion:{numerator,denominator},
       inputUsdPerMillion:{numerator,denominator}}
]
```

The three-component 0.4 + 0.4 + 0.1 micro-USD fixture has exact rank 9/10000000
USD, reservation 1 micro-USD and cost digest
`9819a3f4150c542ab37651337f1ffd39ba16fa726802f16c94cf69f8acc336c3`.
Changing requestDigest or a retained trailing-zero lexeme changes that digest.

ScopesDigest hashes the supplied-order array of records ordered as scopeId,
authorityDigest, currency, authorizedLimitMicroUsd, workflowId, accountId,
routingClass. The single standard synthetic scope fixture has digest
`46c123b4f2bb959d2c4aa7b663bc3a2bc319d21619900598e92cd268b65cda1d`.

SnapshotDigest hashes an object ordered as ledgerId, epoch, scope,
settledMicroUsd, outstandingMicroUsd, remainingMicroUsd, frozen, freezeReason,
observedAtUtc; scope uses the above field order. The empty standard scope fixture
at 2026-09-26T12:00:00.000Z has digest
`0bf7f051c291717706736f26801e8a955fa8df711979c8c47499f8352697e828`.

## Storage and failure semantics

Runtime is exactly Node 24.19.0, built-in SQLite 3.53.3 on the tested Windows host.
Fixed file is `pmc-budget-v1.sqlite`, with SQLite-owned DELETE journal. Exactly
three STRICT tables store metadata, fixed scopes and retained attempts. Scope
allocation tuples and request IDs are unique; one scope index bounds request
aggregation. There are no triggers, cached balances, event stream or repair path.

Initialization exclusively claims an empty root's database filename with `wx`,
then opens its owned placeholder using an internally encoded `file:` URI string
with only `mode=rw`. Metadata/scopes/schema commit together. Interrupted claims
are not deleted or silently repaired. Every normal connection also uses `mode=rw`;
missing storage cannot be recreated by an existence-check race or capability use.

Identity and exact schema validation precede persistence-changing PRAGMAs.
SQLite quick_check detects structural corruption. Each loaded attempt's retained
price evidence is recomputed against its immutable digest/liability, and stored
proof/state content is checked before using it in balances or returning it.
No external callbacks, clocks or filesystem calls run inside transactions.

Effective DELETE, synchronous=EXTRA, 1000ms busy timeout and foreign_keys=ON are
read back. Extension loading and double-quoted strings are explicitly disabled;
defensive:true uses the pinned Node constructor's checked sqlite3_db_config
behavior, not a fabricated defensive PRAGMA/readback. Money/count statements use
setReadBigInts(true); totals use bounded JavaScript BigInt rather than SQL SUM.

Every mutation uses BEGIN IMMEDIATE and commits before success. Consume success
is a durable one-use state transition, not a send permit. Consumed or uncertain
records remain fully charged/non-retryable across restart. Unknown observation
keeps the maximum. Known actual charges are distinct authenticated observations;
over-bound values freeze their scope atomically and are never truncated. Only
authenticated no-send releases reserved/consumed/uncertain liability. A frozen
or full scope continues to accept existing-attempt reconciliation.

Idempotence applies only to the currently stored exact accepted proof. Conflicting
current proof identity refuses. A superseded unknown proof never demotes a known
settlement. Terminal reconciliation retains the preceding unknown reference and
digest privately; there is at most one unknown and one terminal proof per attempt.
Settled/cancelled request IDs remain reserved permanently within the epoch.

Commit exceptions return LEDGER_COMMIT_UNCERTAIN even if the real commit occurred.
No error grants a send, refund, replay or fallback. Reopen/reconcile first. Active
transactions roll back on failure; every connection closes in finally. Cleanup
failures cannot replace an original refusal or convert an operation into success.
A close-only failure returns LEDGER_IO_FAILED even after a durable mutation.

Money refusal vocabulary:

```text
MONEY_INPUT_INVALID MONEY_LIMIT_EXCEEDED MONEY_UNIT_UNSUPPORTED
MONEY_FEE_UNSUPPORTED MONEY_PRECISION_UNSUPPORTED MONEY_OVERFLOW
```

Ledger refusal vocabulary:

```text
LEDGER_INPUT_INVALID LEDGER_LIMIT_EXCEEDED LEDGER_AUTHORITY_REFUSED
LEDGER_PATH_REFUSED LEDGER_ALREADY_EXISTS LEDGER_STORAGE_MISSING
LEDGER_IDENTITY_MISMATCH LEDGER_SCHEMA_UNSUPPORTED LEDGER_STORAGE_INVALID
LEDGER_SETTINGS_REFUSED LEDGER_BUSY LEDGER_IO_FAILED LEDGER_COMMIT_UNCERTAIN
LEDGER_SCOPE_UNKNOWN LEDGER_SCOPE_FROZEN LEDGER_REQUEST_EXISTS
LEDGER_REQUEST_UNKNOWN LEDGER_REQUEST_CONFLICT LEDGER_STATE_REFUSED
LEDGER_BUDGET_EXCEEDED LEDGER_CAPACITY_EXCEEDED LEDGER_OVERFLOW
LEDGER_COST_REFUSED LEDGER_PROOF_REFUSED LEDGER_CLOCK_REFUSED
```

Refusals contain only ok/code, with no SQL, paths, exception text or evidence body.
Native busy/locked, corruption/not-a-database, missing-file and generic IO errors
are classified narrowly; arbitrary callback-thrown objects are never inspected.

## Permanent acceptance matrix

| Criterion | Permanent evidence |
|---|---|
| AC1 exact conservative cost | Decimal grammar; 18 fractional digits; zero; combined rounding boundaries; token/per-million equivalence; explicit fee/unit refusal; safe integer overflow; exact projected and unit-price P2A ceilings; request/lexeme digest separation; source text 2048/2049; 16KiB evidence boundary. |
| AC2 atomicity and replay | Independent processes compete to initialize, reserve and consume; exactly one winner. Genuine SQLite writer lock reaches busy timeout; killed writer recovers without losing prior liability. |
| AC2 crash boundaries | Child-process crashes immediately before/after initialization, reserve, consume, unknown settlement, known settlement, no-send and snapshot commits. Reopen checks liabilities, actual spend and duplicate-consume refusal. |
| AC2 IO/uncertainty | Real SQLITE_FULL via bounded page count; injected native IO failure; real commit followed by lost acknowledgement; precommit failure/rollback; cleanup failures. Existing liability survives, and no send authority results. |
| AC2 storage | Missing/deleted, empty, truncated, corrupt, unrelated schema, wrong identity/epoch and unsupported schema stores refuse. URI encoding covers spaces, percent and hash; ordinary open never creates missing files. |
| AC3 trusted proofs | Timeout/abort/caller assertions; mismatched epoch/scope/request; callback throws/thenables/accessors; current-proof exact replay/conflict; superseded unknown replay; repeated unknown refusal; known/no-send terminal conflicts; callback state race revalidation. |
| AC3 liability/freeze | Reserved, consumed and uncertain no-send paths; unknown full-bound retention; authenticated over-bound atomic freeze; reconciliation while frozen/full; retained request IDs and private prior-unknown lineage. |
| AC4 correspondence | Literal cost/scopes/snapshot digest fixtures; unchanged P2A value fields and complete magnitude domain; no public barrel exports, permit or transport. Independent reviews remain pending. |
| AC5 boundedness | 256/257 scopes; independent 999/1000/1001 per-scope attempt boundary; 10000 global cap; UTF-8 evidence and UTF-16 field/proof bounds; ID 128/129; depth/aggregate/visited limits; alias-expanded capture; deep frozen outputs. |
| AC5 durable validation | Effective PRAGMA readback and weakened-setting refusal; explicit checked constructor options; STRICT/money constraints; exact aggregate overflow; altered retained cost evidence refusal; monotonic clock; closure and original-error preservation. |

Tests use synthetic authority and isolated temporary file-backed SQLite only.
Large valid capacity fixtures seed bounded existing rows in transactions; public
ports exercise the subsequent transitions. Test-only interception never replaces
SQLite or appears in production exports. Child handles are explicitly retained
during lock tests so garbage collection cannot release the intended lock.

## Verification results

Pinned `D:/nvm/v24.19.0/node.exe` precedes PATH for package commands. Every native
exit code was checked:

- dispatch `npm.cmd test`: 182 passed, 0 failed/skipped (56 new PMC tests).
- dispatch `npm.cmd run typecheck`: exit 0.
- dispatch `npm.cmd run lint`: exit 0, 20 files checked, no fixes.
- unchanged routing-policy `npm.cmd test`: 505 passed, 0 failed/skipped.
- Diff/import inspection: five-file authority only; no network/transport imports
  or public barrel changes; no dependency or lockfile changes.

The initial money and ledger tests failed before the modules/operations existed,
then passed after implementation. Additional unrelated-schema classification
regression failed with LEDGER_IO_FAILED before its bounded validation fix and now
returns LEDGER_STORAGE_INVALID.

## Limits and remaining gates

Application process kills do not prove hardware power-loss durability. Filesystem,
device and SQLite guarantees remain necessary. Busy timeout bounds lock waiting,
not total operation/query time. Trusted callbacks are not an execution-time sandbox.
Local root ownership/storage locality are owner responsibilities; UNC/device and
symlink/reparse escapes refuse, but this is not a hostile OS/ACL attestation tool.
Network shares, hostile OS writers and rollback to old legitimate backups are
unsupported. This does not claim exactly-once external billing.

The work implements no compaction, epoch rollover, retention deletion, implicit
migration, scope creation/limit changes, unfreeze/reset, controller, permit, Pi or
transport. Full P2C composition must verify authenticated correspondence and
retain uncertainty across request/episode changes. Two fresh independent reviews
and full green remote CI are still required before merge. Only Windows local
verification is recorded here; no remote-CI or live-spend success is inferred.
