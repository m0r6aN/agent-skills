---
ticket: PMC-P2B1
title: Minimal durable workflow-intent custody
status: active
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

Prevent an authorized workflow intent from buying another initial attempt through
new request IDs, episode names, changed payloads or restart. Provide one bounded
durable owner before P2C, separate from the unchanged P2B budget ledger. This is a
reviewed contract released for private implementation by Gate 2 below.

## Constraints

### Ownership and smallest supported slice

Amendment 05 V8 ratifies this prerequisite. Dependency order is accepted P2A/P2B,
P2B1, P2C, P2D, P2E. P2A merged source is
`4b86643acd4e5cdf183e85cf1cd1c2ace51e0182` (repaired `bb89be9` public types unchanged);
P2B source is `835a6dd82ee4e50652362e7201a79b7451bbd221`. Import P2A types and
P2B types only; no runtime controller import, resolver copy or ledger modification.
The owner does not select models, compute money, reserve funds or send requests.

Node 24.19.0 built-in `node:sqlite`, `node:fs`, `node:path`, `node:url` and
`node:crypto`; existing dependencies only. One initialization provisions a closed
batch of 1..128 business intents for one ledger/epoch. No append/register/update
authority API, expiry, repair, migration, enumeration or generic workflow engine.
Batch exhaustion requires separately authorized future work, not a replacement
database, epoch or ID. Retain every record for the entire associated ledger epoch;
this parcel supplies no deletion. Permanently blocked work is an explicit
availability tradeoff. No supplied-production authentication implementation is
invented: trusted P2E workflow origin and P2C/P2D proof composition remain gates.

### Trusted setup precedes caller digest

Private initialize receives `{root, identity, intents}` and a captured
`authenticateSetup: (proposal: unknown) => unknown`. Identity is exactly
`{storeId:Id, ledgerId:Id, epoch:Id, initializationAuthorityDigest:Digest,
schemaVersion:1}`. Each intent proposal contains exactly `{intentRef:Id,
businessAuthorityRef:Id, businessAuthorityDigest:Digest, originId:Id,
routeTemplate, policyDigest:Digest, configDigest:Digest, scope:BudgetScopeV1,
authorityObservedAtUtc:Utc, authorityExpiresAtUtc:Utc, fallbackAllowed:boolean}`.
`routeTemplate` is exactly P2A request fields excluding episodeId, requestId,
requestDigest and attempt; explicit pmc/v1, public L3..L5 only. Scope must match
workflow/routing class and setup's authenticated ledger authority. Refuse duplicate
businessAuthorityRef, intentRef or equivalent authorized origin/workflow/task/lane
within this fixed store/epoch. Installation binds ONE canonical owner root and
expected store identity to that ledger epoch; tasks cannot choose another root,
initialize another store or issue business authority.

Setup returns exactly `{accepted:false}` or `{accepted:true}` after authenticating
the whole captured proposal against pre-existing workflow/task and budget records.
An accepted tag from an arbitrary caller is insufficient: this callback is captured
solely from reviewed installation and is part of the TCB. No public factory, root
path input from launch, test flag or registration capability. P2E must supply the actual preapproved batch and fixed installation identity;
B1 validates uniqueness within that batch/store and never reinitializes it. There
is no global issuance registry or cross-root discovery service. Malicious privileged
setup of another root or replacement epoch is outside the trusted-installation
assumption, not something an accepted callback tag can prove absent. Missing
authority refuses initialization, never self-authorizes.

The owner generates UUIDs using crypto.randomUUID for one episode and exactly two
request slots per intent (slot 2 stays unusable unless fallbackAllowed). Check all
generated IDs for cross-column collisions in the same transaction. Only after
commit returns does trusted setup obtain `{intentRef,episodeId,requestIds:[Id,Id]}`.
It delivers these proposals to its authenticated initiating caller before that
caller computes the P2C request digest. Lost initialization acknowledgement does
not permit reinitialization; trusted open may return this same identity projection
only to authenticated installation. No new IDs are generated on open or begin.
Fallback evidence can be filled later from authenticated prior closure; all route
template fields remain fixed. Begin compares the supplied digest, never rewrites
request, identities, payload or attempt claims to obtain a match.

### Closed storage contract

File is `pmc-intent-v1.sqlite` in an explicit existing owner-controlled absolute
directory distinct from P2B's file. Initialize exclusively creates the file using
`openSync(...,'wx',0o600)`; never truncate, delete or retry initialization of partial
storage. Open uses file URL `mode=rw`, never creation. Reject relative paths, URI
input, symlink/junction/reparse indirection that cannot be ruled out, nonregular
files, noncanonical paths and unexpected sibling SQLite sidecars; rollback journal
is allowed for SQLite's own crash recovery. Parent directory ACL/ownership must be
established by installation; 0600 alone is not a Windows ACL guarantee. No ACL or
host configuration writes here.

DatabaseSync settings match the reviewed P2B pattern: defensive true,
allowExtension false, enableForeignKeyConstraints true,
enableDoubleQuotedStringLiterals false, timeout 1000; journal_mode DELETE,
synchronous EXTRA, busy_timeout 1000, foreign_keys ON, trusted_schema OFF. Read
back all settings; unsupported runtime/settings refuse. Fresh initialization sets
page_size 4096; every connection sets max_page_count 32768 (128 MiB
main-file ceiling) and reads back both settings. Bound rollback journal to the main-file limit plus SQLite
journal overhead; installation reserves 260 MiB disk allowance, not a durability
claim under disk exhaustion. No WAL, extensions, attached databases or SQL from data.

Exactly two STRICT tables, no views/triggers/user indexes except SQLite's unique
indexes. `owner_meta`: singleton INTEGER PRIMARY KEY CHECK(singleton=1),
schemaVersion INTEGER NOT NULL CHECK(schemaVersion=1), storeId TEXT NOT NULL,
ledgerId TEXT NOT NULL, epoch TEXT NOT NULL,
initializationAuthorityDigest TEXT NOT NULL. Exactly one row.

`intents`: intentRef TEXT PRIMARY KEY NOT NULL; businessAuthorityRef TEXT NOT NULL
UNIQUE; episodeId TEXT NOT NULL UNIQUE; request1 TEXT NOT NULL UNIQUE; request2
TEXT NOT NULL UNIQUE; revision INTEGER NOT NULL CHECK(revision BETWEEN 0 AND 8);
authorityJson TEXT NOT NULL CHECK(length(CAST(authorityJson AS BLOB))<=65536);
stateJson TEXT NOT NULL CHECK(length(CAST(stateJson AS BLOB))<=524288);
CHECK(request1<>request2). Cross-column ID uniqueness and business tuple uniqueness
are additionally validated across the bounded <=128 rows within initialization.
No ledger tables are added. `authorityJson` is the exact setup intent proposal;
`stateJson` is the closed state below, serialized canonical owned JSON. Revision
starts at 0 and increments on every mutation; a two-slot lifecycle needs at most
six mutations, leaving no permission for extra transitions up to the cap.

Every connection checks expected identity supplied by trusted installation, exact
sqlite_schema/table_info/index definitions, quick_check(1), row count and bounded
row contents; reject extra/missing schema/columns and malformed JSON. Every
transaction revalidates affected row and cross-field state invariants. Use bound
parameters, read integers as bigint, range-check before numeric conversion. JSON
is never authentication by itself; authenticity rests on private writer custody,
validated installation authority and exact stored linkage. Missing/partial/corrupt
storage, wrong ledger epoch/identity, unexpected schema or oversized file refuses;
never fall back to memory, another path or a fresh database.

`stateJson` is exactly `{slots:[Slot,Slot]}`. Slots are discriminated closed unions:

```typescript
type Slot =
 | {state:'unused'}
 | {state:'pending'; requestDigest:Digest; selected:null|Selection}
 | {state:'held'; requestDigest:Digest; selected:null|Selection; reason:HoldReason}
 | {state:'closed-refused'; requestDigest:Digest; proof:ProofRecord}
 | {state:'terminal-no-send'|'terminal-failed-settled'|'succeeded'|'uncertain';
    requestDigest:Digest; selected:Selection; proof:ProofRecord};
type HoldReason = 'proof-refused'|'reconciliation-incomplete'|'controller-failure';
type Selection = {
 decisionDigest:Digest; wireDigest:Digest; bindingId:Text; provider:PmcProvider;
 matrixRole:'primary'|'fallback'; primaryQuality:Claim<number>;
 scopeId:Id; costValueDigest:Digest; maximumMicroUsd:UInt;
};
type ProofRecord = {
 proofRef:Id; proofDigest:Digest; ledger:AttemptV1|null;
};
```

Request IDs come only from immutable columns, not duplicated slot data. Selection
scope and cost bind actual acknowledged P2B result later. Full decision audits and
wire payloads are not stored. Closed-refused has no Selection and ledger is null;
terminal slots always have Selection. Held without selection is never padded with
invented binding/provider/digest/quality. Every string/type uses actual P2A
refinements; stored evidence retains original times, never refreshes stale proof.

### Internal API and composition proof contract

All returned ordinary data is deeply owned/frozen. Result<T> is exactly
`{ok:true,value:T}` or `{ok:false,code:OwnerCode}`. OwnerCode is the closed union
INPUT_REFUSED, BOUNDS_REFUSED, AUTHORITY_REFUSED, PATH_REFUSED, ALREADY_EXISTS,
STORAGE_MISSING, STORAGE_INVALID, IDENTITY_MISMATCH, SETTINGS_REFUSED,
CAPACITY_REFUSED, BUSY, IO_FAILED, COMMIT_UNCERTAIN, INTENT_REFUSED,
STATE_REFUSED, PROOF_REFUSED. No thrown object/path/payload leaks. Every external
I/O/callback boundary is caught and mapped; uncertain commit has its own code.

Private initialize/open and close are installation lifecycle functions, not
launch ports. Open takes exactly `{root,expectedIdentity}` and trusted ports. Initialize returns
Result of the closed identity projection described above; open returns Result of
`{owner:IntentOwnerV1,identities:readonly {intentRef:Id,episodeId:Id,
requestIds:readonly [Id,Id]}[]}` to private installation only. Close returns
Result<null>, releases resources and invalidates all instance capabilities without
rewriting any durable record. No public barrel runtime export is permitted.
The controller gets only this synchronous closed interface (capabilities are
separate arguments, never ordinary-data capture):

```typescript
type IntentOwnerV1 = {
 begin: (proposal: unknown, originCapability:object) => Result<{
   claim:object; request:PmcRouteRequestV1;
   episode:PmcResolverContextV1['episode'];
   budgetEvidence:EvidenceRef; scope:BudgetScopeV1;
 }>;
 recordDecision: (claim:object, selectionCapability:object) => Result<null>;
 finish: (claim:object, completionCapability:object) => Result<null>;
};
```

Begin proposal is exactly `{intentRef:Id,request:PmcRouteRequestV1,
computedRequestDigest:Digest}`. P2C owns payload hashing; matching supplied and
computed digest is necessary but not origin authentication. Import actual P2A/P2B
types for every named value, without re-exporting new authority constructors. Captured trusted ports
are `clock:()=>unknown`, `authenticateOrigin(authority, retainedState, proposal, capability)`,
`authenticateSelection(authority, requestDigest, capability)`, and
`authenticateCompletion(authority, slot, capability)`, all returning unknown.
Clock returns a validated Utc, captured before the transaction; invalid/throwing
clock maps AUTHORITY_REFUSED. Authentication refusals are exactly `{accepted:false}`. Origin acceptance is exactly
`{accepted:true,episodeEvidence:EvidenceRef,budgetEvidence:EvidenceRef,
priorDisposition:Claim<'terminal-no-send'|'terminal-failed-settled'>|null,
primaryQuality:Claim<number>|null}`; both prior fields are null for initial,
otherwise supplied claims matching retained prior disposition/quality values and
exactly matching caller attempt claims; no rewriting evidence to make it pass.
Selection acceptance is
`{accepted:true,selection:Selection}`, completion acceptance is
`{accepted:true,kind:'closed-refused'|'terminal-no-send'|
'terminal-failed-settled'|'succeeded'|'uncertain'|'held',proof:ProofRecord|null,
reason:HoldReason|null}`. Declared keys remain present; validate all union-dependent
nullability and exact ordinary data after callback. Callbacks run outside SQL
transactions; re-read revision and all compared state in BEGIN IMMEDIATE afterward.

This contract explicitly assigns authentication: reviewed P2E origin adapter
uses its private initiating-task identity registry, scoped to the immutable setup
record. Reviewed P2C composition owns selection and completion WeakMaps. It inserts
selection only after its direct real P2A call succeeds and its owned wire passes
P2D verification; it derives matrixRole and quality from that selected candidate's
authenticated context, verifies P2A terminal flag and all bindings, and computes
digests itself. Neither caller decision JSON nor a caller-selected callback can
populate those registries. P2C gives the owner an opaque frozen empty object;
its captured authenticator checks exact identity, owner instance/claim, request,
ledger epoch/scope and immutable contents. Type casts, copies, proxies, serialized
data, identical proof IDs or restart objects cannot authenticate.

Completion registry creation requires direct acknowledged calls through P2C's
private captured ledger, plus independently verified P2D semantic/no-send proof
(or the explicit never-invoked pre-reserve exception below).
P2B AttemptV1 JSON alone proves nothing. No-send after reserve requires cancelled
AttemptV1 whose own proofRef/proofDigest match the directly authenticated P2B
no-send proof and sender/controller custody;
failed-settled/succeeded require settled AttemptV1 with actual charge and matching
semantic outcome; uncertain requires acknowledged uncertain AttemptV1 and selected
binding, otherwise retain pending/held. Closed-refused requires no selection and
private controller state proving reserve was NEVER INVOKED; proof ledger is null.
Selected pre-reserve no-send similarly may have ledger null only with that same
never-invoked custody. ProofRecord identity/digest binds the complete immutable
completion claim, not an arbitrary receipt label. These outer completion proof
fields are distinct from the embedded AttemptV1 ledger-proof fields: never require
a self-referential digest or pretend their two evidence domains are equal. Held has proof null and nonnull
reason; all other completions have proof nonnull and reason null. There is no
public proof mint, reconciliation method or registry exported to task code.

B1 tests use explicit private synthetic issuers to validate contract enforcement;
they cannot claim real P2C/P2D authentication exists. P2C must implement these
registries and real composition tests before its own release. P2E production origin
authority and P2D actual semantic proof remain separate gates. Imports point from
P2C to B1 types/runtime; B1 never imports controller or transport runtime.

### CAS, projection and failure rules

Capture ordinary data before dependencies: own enumerable descriptors only, plain
objects/dense arrays, no getters/symbols/thenables/cycles/functions/nonfinite values;
depth <=16, visits <=65,536, aggregate UTF-16 units <=1,048,576, ordinary strings
<=2,048 (serialized row byte limits are separate). Charge aliases by expanded size.
Use per-operation in-progress guards before callbacks; consume selection/completion
proof capabilities on success or ambiguous outcome, never remint after failure.
Origin capability is scoped to this installed initiating task, not caller JSON.
After acknowledged recordDecision update the same private claim revision; only
finish consumes that claim. Any ambiguous write invalidates it. Claim is private
WeakMap identity bound to store instance, intent, slot, request digest and expected
revision. Each write uses BEGIN IMMEDIATE and UPDATE WHERE intentRef=? AND
revision=?; require exactly one changed row and acknowledged COMMIT before success.
Busy/failure never retries an operation automatically; no callback runs under lock.

| Operation | Exact transition and checks |
|---|---|
| begin slot 1 | Both slots unused; authenticate origin and all routeTemplate/ID/digest/initial fields; CAS slot 1 to pending selected:null before returning claim. |
| begin slot 2 | Predeclared fallbackAllowed and exact request2; slot 1 selected primary with authenticated terminal-no-send or terminal-failed-settled; slot 2 unused. Match all P2A fallback prior IDs/digests/disposition/primaryQuality to owner proof and preserve template. CAS slot 2 pending. |
| recordDecision | Current claim revision, pending selected:null only; authenticated selection; first attempt may select primary or terminal matrix fallback per P2A; slot 2 must be matrix fallback. CAS pending with immutable Selection. |
| finish | Current pending claim only; authenticated union-compatible completion. No-selection accepts only closed-refused or held. Selected accepts terminal states or held. CAS once, invalidate claim. |

Pending/held/uncertain anywhere refuses before resolver, including after restart;
closed-refused ends the intent without a selection. Prior success or ANY selected
matrix fallback ends the episode even if no-send. Only the single primary closure
above enables the declared second slot; no third attempt or new-ID reset.
On restart no claims/proofs are reissued. Persisted pending remains blocked, without
needing a startup rewrite to held. A failed held write leaves pending equally
blocking. Finish failure cannot infer successful closure from money state.

Begin projects only fully authenticated selected prior terminal slots into exact
P2A episode attempts, excluding current pending claim. State eligibility is checked
BEFORE filtering; held/refused cannot turn into empty initial history. Episode and
budget EvidenceRef are derived by trusted origin adapter from retained owner/setup
authority for this request (correct requestDigest/lane/policy/config, actual
observation time and approved expiry). It must explicitly authenticate this derived
evidence through origin custody using the accepted-origin evidence fields above.
Validate linkage/freshness against captured clock and setup authority times,
without extending underlying authority expiry. Time can refuse, never reopen. These
references describe authenticated owner projection, never attest catalog/price
facts. Primary-quality evidence preserves original authenticated model-quality
source, value, observation time and expiry and binds the earlier priorRequestDigest
and primaryBindingId, as does priorDisposition evidence. These are P2A's explicit
exception to current-request binding; owner custody cannot invent a fresh quality
observation. Both prior Claims must be owner-authenticated; callers propose them
and begin compares, not rewrites.
Unknown or expired authority blocks rather than fabricating evidence. Trusted
P2E caller preparation retains the prior evidence before computing the P2C digest
over the complete route except top-level requestDigest. Current owner episode and
budget evidence bind the resulting digest. Begin validates the completed input
and does not repair it. No new B1 preparation
API or proof mint is introduced.

Cross-store order is claim, selected/wire record, reserve, consume, sole send,
ledger reconcile, owner finish. No transaction spans the two databases. Any lost
acknowledgement after a claim may have committed leaves persisted pending/terminal
state; local instance quarantines the intent and returns COMMIT_UNCERTAIN. No
resolver/reserve/send occurs after failed begin; failed recordDecision prevents
reserve/send (the resolver has already run). Reservation failure
or lost acknowledgement means liability MAY exist; no receipt absence refund.
After ledger terminal commit, failed owner finish blocks fallback until separately
authorized future recovery (none supplied). Successful closed-refused returns null
P2C receipt and remains closed. No timeout, restart or missing proof is no-send.

Security scope: SQLite transactional durability assumes a correctly behaving local
filesystem, durable flushes and owner-controlled directory/process. Expected identity
and hashes detect mismatch/corruption, not rollback to an older legitimate backup
with the same identity. Hostile OS writers, privileged in-process JavaScript, copied
databases and backup rollback are outside this boundary. Production deployment must
prevent those operations through custody controls; this parcel offers no monotonic
external anchor, cryptographic attestation or rollback recovery claim.

## Acceptance Criteria

| AC | Permanent checks required before acceptance |
|---|---|
| 1 | Closed setup/open/ports/data/errors; independent invalid shapes, bounds, traps, throwing/thenable ports; authentication denial yields no file/SQL effects. Fixed installation root/store/epoch and duplicate batch business authority enforced; no global uniqueness claim. |
| 2 | Actual temporary SQLite initialize/open/restart: exclusive create; partial/missing/schema/identity/row corruption refuses; no replacement/reset; runtime/settings/path/sidecar/size caps and capacity refusal. Test Windows custody assumptions separately from POSIX mode bits. |
| 3 | Preissue then digest then begin; mismatch never rewrites; wrong origin, payload/new ID/new episode/scope/template/policy/version refuses. Closed-refused/held without selection cannot produce fabricated P2A attempts. |
| 4 | Two independent processes race begin and each CAS using actual SQLite; one winner only. Same-object callback reentry, stale revision, copied/cross-instance/restart capabilities deny; no callbacks under transaction. |
| 5 | Both initial selections, one declared primary-closure fallback, success/fallback termination, pending/held/uncertain/refused, undeclared second and third attempts. Mutate each identity/proof dimension independently. |
| 6 | Failure injection before/after each commit and lost ack: begin, selection, reserve, consume, send, cancellation/settlement, finish. Actual P2B file plus owner file; liability retained and no second send. No map-only durability substitute. |
| 7 | Forged AttemptV1/decision/proof JSON and authentic proof with wrong semantic outcome/scope/wire/charge denied; pre-reserve closure proves reserve never invoked; unknown failures remain pending/held. Private synthetic issuers cannot construct production installation. |
| 8 | P2A projection and evidence preserve complete history, exact request linkage and original authority expiry. Real resolver fixture succeeds from primary R1 closure to preissued R2 fallback: both prior Claims bind R1/primaryBindingId, current episode/budget bind R2. Rebinding either prior Claim independently to R2 returns CONTEXT_BINDING_REFUSED before reserve/send. Full-prior-evidence request hashes have literal nested-order fixtures and change when evidence changes. Typecheck actual predecessor types; no public runtime export, circular runtime imports, new ledger operation/table, network or dependency changes. Two independent architecture reviews approve draft before dispatch. |

## Out of Scope

Ledger schema/API changes, actual P2C controller/P2D sender/P2E workflow integration,
provider calls, production setup or budget provisioning, host configuration, caller
migration, live activation, recovery/TTL/reset/delete/migration, cross-host custody,
general event stores, IPC/signing and claims of hostile-OS rollback prevention.

## Context & References

- [Amendment 05 V8](../../goals/pi-model-configuration/gate-1-amendment-05.md)
- [Composition and source evidence](../../goals/pi-model-configuration/pmc-p2c-composition-notes.md)
- [P2C consumer](PMC-P2C-same-process-launch-controller.md)
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md)

## Allowed Files

Private implementation is restricted to these five files:

- plugins/foreman-line/dispatch/src/pmc-launch/intent-custody.ts
- plugins/foreman-line/dispatch/src/pmc-launch/intent-custody-types.ts
- plugins/foreman-line/dispatch/tests/pmc-intent-custody.test.ts
- plugins/foreman-line/dispatch/tests/fixtures/pmc-intent-custody-worker.ts
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p2b1-verification.md

The completed shaping envelope was this draft, P2C draft and composition notes. No
ShapingResult; exact three-document coordinator envelope overrides generic output.

## Verification Plan

Advisory frozen spec-linter, shaping self-check, local links and exact three-file
diff. No implementation tests are claimed by shaping. Future build uses Node
24.19.0, existing dispatch typecheck/tests/lint, real owner and ledger SQLite files,
process races and fault injection; native exit status checked. Run integration
contract-readers, mutation-scope and D19 audit before PR. SQLite exec and guarded
root resolution require separately reviewed B1-specific audit enrollment if the
existing detector rejects them; do not evade detection by changing call spelling
or assume a generic SQLite waiver. Such audit edits need a separate exact-file
release and are not authorized by this draft.

Reviewers must answer: Can a wrong-but-literal implementation mint authority from
JSON? Can filtering unselected states reopen intent? Does every two-store lost ack
retain blocking state? Are cross-root privileged reissuance and rollback explicitly outside the fixed
installation guarantee? Are private proof producers concretely assigned without circular imports or
pretending unimplemented consumers authenticate? Does any stated protection imply
rollback resistance the file cannot provide?

## Readiness

Nondispatchable draft. V8 resolves the architectural choice, not this schema/port
proposal's review or implementation. Two independent reviews, coordinator lint,
accepted P2A/P2B integration pins and explicit Gate 2 are required. B1 acceptance
can prove durable storage and private synthetic contract tests; P2C needs actual B1
in its composition tests. Production additionally needs P2E real fixed-installation setup/origin
authority and P2D semantic/billing/terminal proofs. No live/full-HRO claim follows.

## Gate 2 private implementation release — 2026-09-26

Both independent frontier design reviewers approved corrected contract
09216fafc140539f2760dfdea8a8eaa6cb3ecc07. Review A accepted the wire-order,
SHA-256 and prior-request evidence corrections; review B accepted the actual P2A
prior-request binding and successful two-attempt test requirements. No blocking
design findings remain. This release supersedes draft readiness wording above.

Under the user's delegated prerequisite authority, the coordinator authorizes a
private offline build on merged P2A 4b86643acd4e5cdf183e85cf1cd1c2ace51e0182 and
twice-reviewed immutable P2B source 835a6dd82ee4e50652362e7201a79b7451bbd221.
Combined private base is 82b6332. Its P2A merge conflict retained the accepted main
specification; ledger and money are byte-identical to the reviewed source.
P2B's separate D19 audit integration is still under review. This narrow sequencing
exception permits B1 development only: B1 integration and merge must wait for
accepted P2B integration and audit checks. No failed gate is waived.

Workspace: D:/Repos/agent-skills-worktrees/hro-pmc-p2b1-20260926, branch
codex/hro-pmc-p2b1-20260926. Fresh frontier builder inspects exact head/spec and
predecessors, restates the contract and stops at Step 0 for coordinator release.
Only the five Allowed Files may change. Tests must use actual temporary SQLite
stores, real predecessor APIs, process races and boundary fault injection.
Do not modify the ledger, resolver, dependencies, public barrel or host config.
No provider calls, production setup, budget allocation, push or merge.

D19 enrollment is a separately scoped review after implementation identifies the
actual owner mechanisms. Do not evade the detector or edit verification under
this release. Two independent implementation reviews, reconciliation onto accepted
main, targeted integration checks and complete remote CI remain merge gates.
Production still requires actual P2C/P2D/P2E custody, sender and initiating caller.
### Step 0 dispositions and builder release

The fresh builder verified 20eb3bf and spec blob f4fb9a9 with a clean tree,
actual predecessor byte matches and Node 24.19.0. Coordinator accepts the restated
five-file plan and AC matrix and releases implementation after this record.

For this private offline coding assignment, the coordinator explicitly substitutes
the native agent dispatch record for the builder template's minted runtime routing
receipt. The agent inherits the coordinator's frontier model configuration; the
native dispatch API supplies no independently attested exact engine version or
Foreman runtime receipt. Neither is fabricated. This limited workflow exception
uses the user's delegated decision authority and applies only to development,
with two independent frontier reviews retained. It does not authorize a governed
provider launch or weaken the production receipt/identity requirements being built.

AC4 requires independent-process begin races. For recordDecision and finish, a
legitimate private claim cannot be transferred to a second owner instance. Test
those CAS boundaries with a competing isolated SQLite process updating the row
between callback and CAS, while separately proving cross-instance/restart claim
refusal. Require exactly one acknowledged revision change and stale-claim refusal;
no production test hook, transferable claim or proof reconstruction is added.
This exercises contention without contradicting the private-capability contract.