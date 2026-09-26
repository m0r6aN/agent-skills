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

## Concrete owner, money and ledger ports — draft proposal

This supplement is proposed for independent contract review, not a build release.
It resolves the earlier unspecified initializer/open/proof surface without
changing the three-table SQLite design. All records below are closed; null is
explicit, fields are required, and returned plain data is deeply owned/frozen.
Id is ASCII [A-Za-z0-9][A-Za-z0-9._:-]{0,127}; Digest is lowercase SHA-256 hex;
Utc is exact round-trip UTC milliseconds; Micro is a nonnegative safe integer.
No module exports are added to the dispatch public barrel in P2B: trusted P2C
imports the two specified internal pmc-launch modules after acceptance.

### Money input/output and P2A correspondence

`computePmcCostV1(input: unknown): PmcMoneyResultV1` accepts exactly:

- version: pmc-price/v1; currency: USD.
- identity: {bindingId: Id, provider: openrouter|opencode,
  providerModelId: bounded nonempty string}.
- sourceProfileId/sourceProfileVersion: bounded nonempty strings;
  sourceProfileDigest, tariffDigest, priceEvidenceDigest: Digest.
- inputRate and outputRate: each {value: decimal string,
  unit: USD per token | USD per 1M tokens}.
- perRequestFeeUsd: decimal string; otherFees: none-attested.
- maximumInputTokens and maximumOutputTokens: nonnegative safe integers.
- rankingTokens: null or {input: nonnegative safe integer,
  output: nonnegative safe integer}, each no greater than its maximum.

Decimal grammar is (0|[1-9][0-9]{0,15})(.[0-9]{1,18})? with the dot literal;
preserve the exact accepted lexeme including fractional trailing zeros. The
bounded fixed tariff covers input tokens, output tokens and one known flat fee.
Unknown fee categories, tiered/unbounded pricing, discounts or missing explicit
fee evidence refuse; do not silently assume the fee is zero. Authentication of
these source assertions belongs to the trusted composition port, not this pure
helper. No Number-to-string conversion can create this evidence.

Result is {ok:false,code:PmcMoneyCodeV1} or {ok:true,value:PmcCostValueV1,
priceEvidence:owned exact accepted input}. Codes are MONEY_INPUT_INVALID,
MONEY_LIMIT_EXCEEDED, MONEY_UNIT_UNSUPPORTED, MONEY_FEE_UNSUPPORTED,
MONEY_PRECISION_UNSUPPORTED and MONEY_OVERFLOW. A valid value has exactly the
P2A BindingClaims.cost supplied-value fields: currency, maximumMicroUsd,
maximumInputTokens, maximumOutputTokens, sourceProfileId/sourceProfileVersion,
sourceProfileDigest, tariffDigest, priceEvidenceDigest, costValueDigest and
ranking. Do not construct an EvidenceRef or supplied claim in the helper.

MaximumMicroUsd is ceil((maximum input cost + maximum output cost + flat fee)
* 1,000,000) once, checked against the safe integer ceiling. With rankingTokens,
ranking is {kind:projected,inputTokens,outputTokens,usd:{numerator,denominator}};
its exact total includes the flat fee, without rounding. Without rankingTokens,
ranking is {kind:unit-price,outputUsdPerMillion,inputUsdPerMillion}; a nonzero
flat fee refuses MONEY_FEE_UNSUPPORTED because unit-price ordering cannot
represent it. Rational strings use P2A's canonical reduced <=64-digit contract;
zero is 0/1, denominator positive. Unsupported output precision refuses.
Bound arithmetic intermediates to 128 decimal digits; check operand and product
bounds before multiplication. No truncation/saturation/float arithmetic.

CostValueDigest is SHA-256 over UTF-8 JSON of the fixed ordered tuple
["pmc-cost-value/v1", exact accepted input fields in the declaration order above,
computed maximumMicroUsd, computed ranking], with nested records serialized in
their declared field order and no optional fields. Freeze the concrete tuple
layout in tests and the implementation handoff before consumption; P2C forwards
the digest/value and original evidence, never computes money again. A digest is
content binding, not authenticity. Independent composition review must compare
every value field against the accepted P2A shape before P2C dispatch.

### Initialization, open and fixed budget scopes

`initializeLocalPmcLedger(request: unknown, ownerPorts): LedgerResult<LedgerIdentity>`
and `createLocalPmcLedger(request: unknown, trustedPorts): LedgerResult<LocalPmcLedger>`
are separate synchronous operations. OwnerPorts is a closed record containing
clock and authenticateInitialization; TrustedPorts contains clock,
authenticateSettlement and authenticateNoSendProof. Capture each own enumerable
function descriptor once; never invoke getters or freeze caller functions.
Callbacks run before transactions, return unknown, and are bounded/captured
before use. Throws/thenables refuse; never inspect arbitrary thrown objects.

Initialization request is {root:absolute local path, ledgerId:Id, epoch:Id,
initializationAuthorityDigest:Digest, scopes:readonly BudgetScopeV1[]}.
Authenticator receives an owned frozen request and must return exactly
{accepted:true,ledgerId,epoch,initializationAuthorityDigest,scopesDigest} matching
the complete request, or {accepted:false}; its authority is privately supplied by
the trusted owner, never selected by request data. Expected identity/epoch are
persisted outside this store by that owner before initialization is considered
usable. Lost acknowledgement/interruption requires explicit reconciliation.

BudgetScopeV1 is {scopeId:Id,authorityDigest:Digest,currency:USD,
authorizedLimitMicroUsd:Micro,workflowId:Id,accountId:Id,routingClass:bounded nonempty string}.
Initialize 1..256 unique scopes, also unique by workflow/account/routingClass.
Scope IDs and allocations are fixed for this epoch; reserve cannot create or
rename scopes, increase limits or reset spent balances. New-class provisioning,
limit changes and epoch rollover remain separately reviewed owner operations.
Reject mismatched authority rather than replacing a scope. Persist this tuple's
uniqueness in budget_scopes. This bounded initial implementation deliberately has
no public scope-registration or automatic reinitialization operation.

Open request is exactly {root,expectedLedgerId,expectedEpoch,
expectedInitializationAuthorityDigest}. Ordinary open must neither create root,
database nor schema. Fixed filename is pmc-budget-v1.sqlite; journal is its SQLite
-journal companion. Initialization requires a newly allocated empty local root,
with verified ownership/path bounds and neither file present; never overwrite.
Normal reads/open use an existing-file mode; recheck every connection's effective
SQLite settings and identity. All paths are diagnostic-free and never accepted
from request IDs. Trust model excludes hostile OS writers, not accidental reuse
of the wrong root, missing storage or legitimate stale rollback limitations.

### Operations and authenticated reconciliation

LocalPmcLedger is an owned frozen capability exposing only:

- snapshot({scopeId}): LedgerResult<BudgetSnapshotV1>.
- reserve({requestId,scopeId,requestDigest,costValue,priceEvidence}):
  LedgerResult<AttemptV1>. Recompute with the sole money helper, require exact
  value/digest match, and persist original evidence. This is consistency, not
  independent tariff authentication. Refuse every existing request ID.
- consume({requestId,requestDigest}): LedgerResult<AttemptV1>; only reserved may
  transition. Success means durable commit acknowledged; it is never itself a
  public send permit. Duplicate or mismatched consume refuses.
- settle({requestId,requestDigest,observation:unknown}): LedgerResult<AttemptV1>.
  Private authenticateSettlement receives owned request context and observation,
  returns a matching closed proof or refusal. Proof is {accepted:true,ledgerId,
  epoch,requestId,requestDigest,scopeId,proofRef,proofDigest,
  outcome:{kind:known,actualMicroUsd:Micro}|{kind:unknown}}.
- cancelWithNoSendProof({requestId,requestDigest,proof:unknown}):
  LedgerResult<AttemptV1>. Private authenticator returns {accepted:true,ledgerId,
  epoch,requestId,requestDigest,scopeId,proofRef,proofDigest,noSend:true}, or
  {accepted:false}. Only trusted owner/sole sender can attest actual no-send;
  arbitrary task JSON cannot act as the authenticator.

All proof IDs/digests bind the exact durable request, scope and ledger epoch.
Unknown settlement moves consumed to uncertain and keeps maximum liability;
known settlement moves consumed/uncertain to settled and stores actual charge.
Known over-bound charge is recorded and freezes the scope atomically. Exact replay of the same accepted settlement/proof is idempotent. A new
authenticated known observation may reconcile uncertain state. Reusing a proof
identity with changed content, mismatched request or conflicting terminal outcome
refuses, never rewrites history.
No-send can cancel reserved, consumed or uncertain only after authentication;
settled known charges are not refundable through this operation. Unknown
observations cannot demote known settlement. A frozen/full scope still permits
reconciliation of existing attempts; it refuses new reservations.

AttemptV1 is a closed diagnostic value: ledgerId,epoch,requestId,scopeId,
requestDigest,costValueDigest,maximumMicroUsd,state (reserved|consumed|uncertain|
settled|cancelled),actualMicroUsd (Micro|null),proofRef (bounded string|null),
proofDigest (Digest|null),createdAtUtc,updatedAtUtc. Return no raw price evidence
or storage paths; durable evidence is retained privately. LedgerIdentity is
{ledgerId,epoch,initializationAuthorityDigest,schemaVersion:1}.
BudgetSnapshotV1 is {ledgerId,epoch,scope:BudgetScopeV1,settledMicroUsd,
outstandingMicroUsd,remainingMicroUsd,frozen,freezeReason:null|over-bound,
observedAtUtc,snapshotDigest}. If exact totals exceed public Micro range, return
LEDGER_OVERFLOW instead of saturation; stored observations remain intact.
Otherwise remaining is max(0,limit-settled-outstanding), with exact nonnegative
BigInt arithmetic and explicit frozen/over-limit refusal on reserve. Snapshot
hash covers the declared ordered fields except itself; freezes cannot be hidden
by clamping remaining. This derived zero is not fabricated balance authority.

LedgerResult<T> is {ok:true,value:T}|{ok:false,code:LedgerCode}. Closed codes:
LEDGER_INPUT_INVALID, LEDGER_LIMIT_EXCEEDED, LEDGER_AUTHORITY_REFUSED,
LEDGER_PATH_REFUSED, LEDGER_ALREADY_EXISTS, LEDGER_STORAGE_MISSING,
LEDGER_IDENTITY_MISMATCH, LEDGER_SCHEMA_UNSUPPORTED, LEDGER_STORAGE_INVALID,
LEDGER_SETTINGS_REFUSED, LEDGER_BUSY, LEDGER_IO_FAILED, LEDGER_COMMIT_UNCERTAIN,
LEDGER_SCOPE_UNKNOWN, LEDGER_SCOPE_FROZEN, LEDGER_REQUEST_EXISTS,
LEDGER_REQUEST_UNKNOWN, LEDGER_REQUEST_CONFLICT, LEDGER_STATE_REFUSED,
LEDGER_BUDGET_EXCEEDED, LEDGER_CAPACITY_EXCEEDED, LEDGER_OVERFLOW,
LEDGER_COST_REFUSED, LEDGER_PROOF_REFUSED, LEDGER_CLOCK_REFUSED.
Do not append arbitrary SQL, exception, evidence or path text. Error classification
must be narrow and safe; unknown write/commit acknowledgement retains uncertainty
rather than permitting a send. Tests exercise actual SQLite boundaries, not a
replacement in-memory implementation or a public fault-bypass switch.

Capture all ordinary request/proof graphs before validation with depth16,
65,536 visited values/keys, 1MiB aggregate string units and existing per-field
bounds; charge aliases by expanded size, reject accessors/prototype surprises/
cycles/nonfinite/thenable data. The 16KiB UTF-8 evidence bound also applies before
persistence, and record capacities remain checked inside BEGIN IMMEDIATE.
Initialization and proof callbacks are trusted code, not a hard execution-time
sandbox; their returned data still receives bounded validation. Clock returns
exact Utc before the transaction; invalid/throwing or record-time-regressing updates
refuse without resetting prior timestamps or granting a refund.
The capability retains only owned bounded configuration and captured trusted ports,
not an open SQLite connection. Open validates then closes; each operation opens
existing storage, verifies settings/identity and closes in finally. Thus no
undocumented shutdown operation or process-exit flush grants durability. Fixed
clock monotonicity compares a mutation with the affected record's stored time;
it does not infer real-world freshness from an injected clock.
RoutingClass preserves exact existing slash-bearing class names (for example
implementation/standard); it is not an opaque Id. P2C checks the authorized class
against request and policy. ScopesDigest is SHA-256 of UTF-8 JSON serialization
of the array of complete scopes in supplied order, with each record in its above
declaration order. Snapshot hashing likewise uses the stated field order and
owned nested scope order; no caller toJSON or incidental property order applies.

Freeze exported type names inside money.ts as PmcPriceInputV1,
PmcCostValueV1, PmcMoneyCodeV1 and PmcMoneyResultV1; function computePmcCostV1.
Inside ledger.ts use PmcLedgerOwnerPortsV1, PmcLedgerTrustedPortsV1,
PmcLedgerInitializeRequestV1, PmcLedgerOpenRequestV1, BudgetScopeV1,
BudgetSnapshotV1, AttemptV1, LedgerIdentity, LedgerCode, LedgerResult<T>,
LocalPmcLedger and the two factory functions. Operation request/proof types may
remain module-private unless a later accepted consumer requires an explicit
additive export; do not invent another public dispatcher or authority token.
### Existing-file SQLite open and initialization race

The pinned Node24.19 source enables SQLITE_OPEN_URI while its ordinary writable
constructor also supplies CREATE. Therefore a prior exists check followed by an
ordinary path constructor is insufficient. For normal operations construct an
internally generated percent-encoded file URI string from the verified absolute
filename, with the sole query mode=rw; pass its string form, not a URL object that
may normalize away the query. Accept no caller URI/query/VFS/locking parameters.
Verify this behavior with actual missing/existing temporary files on Windows and
remote CI; unsupported behavior refuses rather than falling back to create mode.

Owner initialization exclusively claims the fixed database filename with wx after
empty-root/path checks, closes that owned empty placeholder, then opens the
claimed file with mode=rw and commits schema/metadata/scopes together. A competing
initializer encounters the existing file and refuses. Crashes after the claim
leave an unusable store requiring explicit owner reconciliation; no automatic
placeholder deletion or second initializer repairs it. Normal open rejects empty
files and validates identity/schema before any persistence-changing PRAGMA; then
configures/verifies required settings before mutation. Hot-journal recovery stays
SQLite-owned and is not a manual file-repair path.

Primary source basis (API/design evidence only, not an implementation test):
[Node24.19 DatabaseSync open flags](https://raw.githubusercontent.com/nodejs/node/v24.19.0/src/node_sqlite.cc)
and [SQLite URI mode semantics](https://www.sqlite.org/uri.html).
The supported runtime profile is the pinned Node24.19.0 used by repository CI.
Do not infer all SQLite options are supported merely from the package's broader
engine minimum. DELETE, synchronous=EXTRA, busy_timeout and foreign_keys have
readback checks; configure integer reads on every money/count statement via
setReadBigInts(true). Defensive mode is a connection option, not an invented
PRAGMA: the pinned Node source checks the returned sqlite3_db_config setting
against the requested option. Require that reviewed constructor behavior and
explicit defensive:true; fail on unsupported runtime/settings. Keep extension
loading and double-quoted string literals disabled explicitly. Tests must name
which properties are read back versus enforced by the pinned checked API.