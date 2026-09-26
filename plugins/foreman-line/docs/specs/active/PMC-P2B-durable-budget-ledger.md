---
ticket: PMC-P2B
title: Durable micro-USD budget ledger and attempt state
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/dispatch/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Implement exact conservative cost arithmetic and persistent atomic reservations
for the initial local PMC launcher. Keep unknown liabilities charged across
failures/restarts and expose the only durable consume transition used immediately
before a send. This parcel cannot launch, mint permits or choose a model.

## Constraints

- Amendment 05 V4 is governing canon. Pin Node 24.19.0 and its built-in
  `node:sqlite` DatabaseSync, with narrowly scoped filesystem/crypto helpers and
  existing TypeScript/node:test tooling; no new dependency or production network.
- Follow P2A interface freeze without importing its future controller. P2C composes
  P2A's exact cost-value port with this canonical helper; no duplicate arithmetic.
- Runtime caller supplies trusted budget scope/limit/source and authenticated rate
  lexemes/settlements. Tests use isolated temporary storage and synthetic data.
  Never read host settings, credentials or a class ceiling as remaining balance.

### Frozen money and state contract

Expose a bounded money helper and createLocalPmcLedger over an explicit absolute
store root, externally held expected ledger ID/initialized epoch and injected
clock. Public operations are snapshot,
reserve, consume, settle and cancelWithNoSendProof; mutation ports stay private
to trusted controller/sender wiring, not task input. Request IDs are opaque safe
identifiers, not path fragments. Interfaces are concrete closed types.

Ledger USD fields are integer micro-USD, from zero through Number.MAX_SAFE_INTEGER.
Decimal rate INPUTS are strings matching a nonnegative finite base-10 grammar,
no exponent or sign, at most 18 fractional digits and bounded total magnitude.
Each price evidence record binds original decimal lexemes (or exact rational
numerator/denominator), units, authenticated source/profile digest, tariff and
per-send bounds. PMC/RCM numeric projections cannot become exact billed-price
authority by Number.toString(). Mismatch or inability to bound pricing refuses.
Parse to BigInt numerator/denominator. Compute all bounded token/fee components
exactly, sum, then ceil TOTAL to micro-USD; never round unit rates down. Reject
unknown rate units/fees/token maxima, overprecision, overflow or any intermediate
whose declared bound cannot be checked. Preserve exact rational projected cost
for P2A ranking independently of rounded reserve. No presumed cache discount.

Budget scope names authority/digest, limit, workflow/account/class allocation and
currency; remaining subtracts settled spending plus EVERY reserved, consumed or
uncertain maximum liability. Reserve performs that check atomically, including
other processes. Missing new-class authority refuses; no copied class budget.

States: reserved -> consumed -> settled or uncertain; reserved -> cancelled
requires trusted no-send proof; consumed/uncertain may reconcile to no-send only
from the sole owned sender's authenticated proof, never a caller assertion.
Persist consume before send; duplicate consume refuses. A crash after consume
is uncertain even if actual transmission never started. Restart retains all
liabilities and never retries. Timeout/abort/missing response is not no-send proof.
Provider-reported actual charge is a separate authenticated observation, never
equated to rounded conservative liability or a local estimate. Actual settlement
is authenticated by the trusted adapter; unknown amount retains
full bound; charge over the bound freezes new reservations pending reconciliation.

### Frozen SQLite storage contract v1

Use a fixed database filename within the explicit application-owned local root.
Reject traversal and symlink/reparse escape for the database and its journal;
network shares are unsupported. Trusted local OS/storage ownership is the threat
model. This does not protect against hostile OS writers or rollback to an old
legitimate database backup, and does not claim exactly-once external billing.

Configure DatabaseSync with a 1,000 ms busy timeout, extensions disabled, foreign
keys enabled, defensive mode enabled, double-quoted string literals disabled and
integer reads as BigInt. Require rollback `journal_mode=DELETE` and
`synchronous=EXTRA`; verify effective settings on every connection before mutation.
SQLite owns locking, durable commit and journal recovery. No handwritten lock,
stale-lock deletion, manual journal replacement, WAL/checkpoint subsystem or
automatic repair is permitted. A busy timeout bounds lock waiting, not query
execution or total operation time. Return bounded typed diagnostics without SQL
values, evidence bodies or filesystem details.

Freeze exactly three STRICT tables, with fixed SQL, NOT NULL/unique/foreign-key
constraints, valid state checks and integer money bounds:

- `ledger_meta`: singleton schema version 1, ledger ID, initialized epoch and
  initialization-authority digest. Unknown versions refuse; no implicit migration.
- `budget_scopes`: exact scope ID, authority digest, currency, authorized limit,
  workflow/account/class allocation and persistent frozen flag/reason. Authority
  changes cannot create a new zero-spend scope implicitly.
- `attempts`: request ID unique across the ledger epoch, scope foreign key,
  immutable request/evidence digest, original exact price evidence, maximum
  liability, state, authenticated actual charge when known, proof reference/digest
  and injected-clock timestamps. Preserve original decimal/rational evidence,
  not only its digest. Preserve request IDs after settlement or cancellation.

No event-sourcing framework, triggers or mutable cached balance is required.
Snapshot reads one consistent transaction. Sum bounded scope rows using JavaScript
BigInt, never floating-point arithmetic or potentially overflowing SQL SUM.
Range-check before converting any public money field to Number. Totals exceeding
the authorized limit cannot become available funds by wrapping or saturation;
refuse new spending and preserve every liability and authenticated observation.

Every mutation uses BEGIN IMMEDIATE, rechecks epoch/scope/freeze state, evaluates
the current state and exact balance, performs its conditional transition and
commits before returning success. Bind all values with prepared statements; no
caller-supplied SQL, identifiers, PRAGMAs or ATTACH. No callbacks or external IO
execute inside a transaction; obtain bounded clock/authority inputs beforehand.
Duplicate request IDs cannot reserve twice, and changed payloads conflict.
Duplicate consume refuses. A consumed record remains fully charged/non-retryable
after restart even when no response or actual send can be established.

Known authenticated over-bound settlement records the observation and freezes
the scope in the same transaction. Unknown settlement retains the full maximum.
Only the private trusted sender proof port can release a consumed/uncertain
liability. Commit errors or lost acknowledgements never imply successful consume
or permission to send, refund, retry or fallback. Reopen/reconcile the durable
request state; unresolved outcomes retain conservative liability and refuse new
action for that request. Roll back an active failed transaction and close in
finally; cleanup errors cannot mask the original failure or create success.

### Initialization and bounded lifecycle

Initialization is a separate trusted one-time owner operation against a newly
allocated root, committing schema and metadata together. Ordinary open never
creates a database or schema and requires expected ledger ID and initialized
epoch held by trusted durable authority outside this store. Missing, empty,
wrong-epoch, unsupported-version, corrupt or unverifiable initialized storage
refuses. An initialization token stored only beside the database is insufficient.
Initialization authority cannot be replayed automatically after deletion or an
interrupted initialization; recovery requires explicit owner reconciliation,
never silent zero-balance reset. Freeze the concrete owner/open interface before
dispatch; filesystem/SQLite open behavior must implement this distinction.

Limits are 256 scopes, 10,000 retained attempts across the database, 1,000 attempts
per scope, 16 KiB UTF-8 serialized exact evidence per request, 4,096 UTF-16 code
units per field string and 128 UTF-16 code units per opaque ID. Reject over-limit
inputs before allocation/storage, and check record counts inside the write
transaction. Diagnostics use fixed reason codes and at most 512 UTF-16 code
units of fixed explanatory text. Indexed request/scope lookups and bounded row
reads enforce query limits. Capacity exhaustion refuses new reservations;
settlement/reconciliation of existing records remains possible within their
field bounds. Do not delete replay IDs or outstanding liabilities to make room.
Compaction, epoch rollover and retention migration need a separately reviewed
owner contract; this parcel does not implement them.

## Acceptance Criteria

1. Exact rate and cost vectors prove 18-digit precision, boundary rounding of
   total, zero cost, multi-component sum, overprecision/unsafe magnitude refusal,
   and no downward reservation from floating point or per-rate rounding.
2. Parallel process reserves cannot oversubscribe; duplicate consume cannot pass.
   Real SQLite process contention, killed-writer recovery and crash injection
   before/after every commit preserve unknown liabilities/refuse. Cover missing,
   empty/truncated or corrupt initialized storage, wrong epoch/schema version,
   interrupted initialization, busy timeout, disk-full/IO/uncertain commit and
   restart. No automatic recovery may reset spending or replay consume.
3. Settlements and no-send proof require trusted authority; timeout/caller claims
   never refund; over-bound settlement freezes; prior uncertainty blocks automatic
   repeat/fallback spend. All operations are bounded and paths cannot escape root.
4. Two independent reviews accept concrete storage/money contract. Handoff states
   exact failure codes and that no permit or transport exists in this parcel.
5. Verify effective durability settings, BigInt overflow handling, all capacity
   and field boundaries, retained-ID replay refusal and closure on every failure.
   Tests may seed valid near-capacity fixtures directly instead of executing
   10,000 expensive public mutations; concurrency and transitions still exercise
   public trusted ports. Process-kill tests prove application-crash behavior,
   not hardware power-loss durability.

## Out of Scope

Resolver/ranking, same-process permit/controller, HMAC/keys, Pi/HTTP, actual spend,
new budget amounts, host configuration, caller migration and activation.

## Context & References

- [Amendment 05](../../goals/pi-model-configuration/gate-1-amendment-05.md)
- [P2 inventory](../../goals/pi-model-configuration/pmc-p2-design-inventory.md)
- [P2A](PMC-P2A-owner-resolver.md)
- [Node 24 SQLite API](https://nodejs.org/download/release/v24.14.0/docs/api/sqlite.html)
- [SQLite transactions](https://www.sqlite.org/lang_transaction.html)
- [SQLite durability settings](https://www.sqlite.org/pragma.html#pragma_synchronous)

Coordinator's local in-memory probe reported Node 24.19.0 and SQLite 3.53.3.
This establishes API availability only, not filesystem durability, concurrent
ledger correctness, safe initialization, implementation acceptance or live spend.

## Allowed Files

- plugins/foreman-line/dispatch/src/pmc-launch/money.ts
- plugins/foreman-line/dispatch/src/pmc-launch/ledger.ts
- plugins/foreman-line/dispatch/tests/pmc-money.test.ts
- plugins/foreman-line/dispatch/tests/pmc-ledger.test.ts
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p2b-verification.md

## Verification Plan

Node 24.19.0, offline existing tools: dispatch `npm.cmd test`, `npm.cmd run
typecheck`, `npm.cmd run lint`, each native exit checked. Tests use real temp-file
transactions and process concurrency, never production ledger roots. Run unchanged
routing-policy regressions. Verify exact diff authority and no network imports.

## Readiness

Draft, not dispatchable. The SQLite design is coordinator accepted, but accepted
P1/predecessor public contracts and P2A interface freeze remain prerequisites.
Freeze concrete initialization/open ports and failure codes before dispatch.
Two independent implementation reviews remain required. Do not substitute an
in-memory ledger to get tests green or infer activation from design acceptance.
