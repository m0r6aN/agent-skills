---
ticket: HRO-P4A1
title: Durable admission for bounded recovery bootstrap
status: active
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/dispatch/
  - plugins/foreman-line/docs/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Define the smallest durable owner that prevents restarting HRO-P4A metadata
preparation for the same B1 intents. Admit one fixed installation generation
before exposing its broker. This is a docs-only prerequisite amendment, not a
runtime release, production bootstrap or recovery authority.

## Constraints

### Existing owners and explicit scope amendment

Base is 3c6ca35666611a7da65336395f7e1cfbc5206c84. P4A design 45b50e66be7d3a4a29519063aeae87c1270ce8b8
is ratified. B1 owns launch slots and P2B owns monetary liability. Neither has a
metadata admission operation; using begin/reserve would spend the wrong resource.
Their schemas, public APIs and runtime files remain unchanged.

Root explicitly permits this separate SQLite admission store as a new prerequisite.
P4A's statement that its original parcel adds no third store describes that
parcel's scope; it does not silently authorize modifying B1. Reuse Node's existing
SQLite dependency and established durability discipline, not private helpers or a
new generic persistence framework. No package/dependency/barrel changes.

### Closed construction and ownership

The new private module statically imports and retains actual initializeIntentOwnerV1
and its actual IntentAuthority, OwnerIdentity and IdentityProjection types. It
calls initialization itself and retains the direct successful acknowledgement.
No supplied result, callback-selected B1 function, identity projection JSON,
receipt, digest or empty-history assertion establishes freshness.

The only production constructor in this slice unconditionally returns
PREREQUISITE_UNAVAILABLE, without reading input or performing effects. A future
production installation must authenticate unique business intent, workflow/root
binding and initialization authority before calling this owner. Its reviewed
source path and actual custody are prerequisites, not fulfilled by a fixture.
Existing delegated authority is preserved; no new human-only gate is created.

```ts
type CodeV1 = 'INPUT_REFUSED'|'BOUNDS_REFUSED'|'PATH_REFUSED'
  |'PREREQUISITE_UNAVAILABLE'|'AUTHORITY_REFUSED'|'B1_REFUSED'
  |'ALREADY_ADMITTED'|'STORAGE_INVALID'|'BUSY'|'IO_FAILED'
  |'COMMIT_UNCERTAIN'|'SESSION_REFUSED';
type ResultV1<T> = {ok:true;value:T}|{ok:false;code:CodeV1};
type OfflineInputV1 = {
  domain:'offline-fixture/v1'; fixtureId:string; root:string;
  workflowId:string; generationId:string; identity:OwnerIdentity;
  intents:readonly {authority:IntentAuthority;payloadJson:string}[];
};
type EpisodeV1 = {
  intentRef:string; businessAuthorityRef:string; businessAuthorityDigest:string;
  episodeId:string; requestIds:readonly [string,string];
  originalRequestDigest:string; policyDigest:string; configDigest:string;
};
type RegistrationV1 = {
  version:'hro-recovery-admission/v1'; domain:'offline-fixture/v1';
  fixtureId:string; root:string; workflowId:string; generationId:string;
  identity:OwnerIdentity; episodes:readonly EpisodeV1[];
};
type AdmissionV1 = {
  domain:'offline-fixture/v1'; registration:RegistrationV1;
  claimBrokerV1():ResultV1<object>;
};
function createProductionRecoveryAdmissionV1(input:unknown):
  {ok:false;code:'PREREQUISITE_UNAVAILABLE'};
function createOfflineRecoveryAdmissionV1(input:unknown):ResultV1<AdmissionV1>;
```

All listed keys are required and closed. Existing types retain their exact owner
refinements. Use no shadow definitions or broadened schema. Opaque objects are
private registry capabilities, not serializable tokens. Returned ordinary data
are owned and deeply frozen; no accessors, callbacks, symbols, functions, thenables,
nonplain prototypes, cycles or unknown keys are accepted. Catch hostile traps
without inspecting thrown values. Charge aliases at expanded cost before descent.

The offline factory accepts no ports. Its fixed internal authenticateSetup
adapter accepts only the already captured exact fixture initialization proposal
and returns B1's actual accepted empty acknowledgement. Pass only the captured
authority array to B1, retaining payloadJson privately for request binding. That is explicitly
synthetic setup authority; actual B1 initialization and durable writes are real.
It neither opens B1 for launch nor creates C/origin capabilities. Production
authentication must never reuse this adapter or add a mode switch to it.

payloadJson is the exact bounded original request payload string, valid JSON under
C's existing capture rules; retain its bytes without reserialization. payloadJson
alone may exceed the ordinary-string limit up to 262,144 UTF-16 units. The total
256-KiB capture bound applies even where C permits a larger standalone payload.
No payload is persisted in this admission store or included in typed failures.

Input root is the B1 root itself, not an independently selectable admission path.
The admission filename is exactly hro-recovery-admission-v1.sqlite beside
pmc-intent-v1.sqlite. Normalize and validate the canonical absolute root, reject
symlink/reparse components, network paths, traversal, alternate streams and
nonregular/multiply-linked store files. Windows case/separator aliases identify
the same root. Offline root must be an installation-owned directory beneath OS
temporary storage named hro-p4a1-fixture-<fixtureId>. fixtureId is 1..64 ASCII
letters/digits/hyphens. No ambient cwd or environment path selection.

Validate every input and all feasible path/capacity/existence constraints before
the first mutation. Scope workflowId must equal every IntentAuthority.scope.workflowId;
identity and authority fields retain B1 refinements and uniqueness. No per-intent
workflow substitution. Existing admission artifacts refuse before B1 invocation.
Require fresh B1 initialization: an existing B1 store refuses, even if admission
storage is missing, the database is empty, slots are unused, or generation/business
labels changed. Do not delete, repair, replace or initialize over either artifact.

Only after genuine B1 acknowledgement, retain its preissued episode/R1/R2 IDs and
construct each original primary request from the captured immutable routeTemplate,
the returned episode/R1 IDs and attempt:{kind:'initial'}. Compute its request
digest as SHA-256 of UTF-8 JSON.stringify(['pmc-request/v1', intentRef,
routeWithoutRequestDigest, payloadJson]), using the exact P2A nested declaration
order for routeWithoutRequestDigest retained by B1/C. This names an existing serialization contract,
not an existing exported helper. Literal independently authored fixtures must
prove exact parity, including nested field order; no canonical sorted-key substitute.
No input ID/digest overrides, reminted ID or altered request are accepted.
The admitted registration freezes those original request digests and actual IDs.

### Durable transaction and partial bootstrap

One fixed database contains exactly two STRICT tables: singleton admission_meta
and episodes. Meta has schemaVersion=1, canonical root, domain, fixtureId,
workflowId, generationId, B1 storeId/ledgerId/epoch/initializationAuthorityDigest,
and state='admitted'. Episodes has the exact EpisodeV1 fields with requestIds
represented by request1/request2 TEXT columns, one row per intent,
with unique intentRef, businessAuthorityRef, episodeId and both request IDs;
R1 differs from R2 and cross-column ID collisions refuse. At most 128 rows.
There are no mutable episode counters, TTLs, leases, recovery rows or delete API.

Exclusively create the fixed file; open only that existing file with mode=rw,
Node 24.19.0 SQLite defensive mode, extensions disabled, DELETE journal,
synchronous=EXTRA, trusted_schema=OFF, foreign_keys=ON and busy_timeout=1000.
Verify settings. BEGIN IMMEDIATE creates schema and inserts the whole immutable
batch atomically; validate the exact closed schema and data, COMMIT, then reread
and verify complete binding before closing and returning a capability. Unexpected
schema/triggers/indices/data, oversized or malformed artifacts refuse. No migrations.
The 1-second contention setting is not a universal filesystem or operation deadline.

B1 initialization and admission are two separate transactions. There is no claim
of cross-database atomicity. B1 success followed by admission failure leaves B1
registered but exposes no broker/C/origin capability. If failure precedes a
confirmed B1 acknowledgement, no admission follows. Any write/commit/close/reread
uncertainty returns a typed hold and issues no capability. Never infer rollback
from a thrown call. Retain all artifacts for inspection; no automatic cleanup.

Even a crash before admission-file creation cannot reset participation: B1's
exclusive fresh initialization already prevents another bootstrap of these same
actual intents. An incomplete admission file also permanently refuses. A crash
before any mutation creates no durable admission and spent no metadata operation;
fresh setup remains subject to the upstream unique-business-intent authority.
Storage removal, rollback/backup restoration, root relocation or replacement B1
identity is not recovery and cannot authorize replay. Authentic protection against
such replacement is a production installation/storage-custody prerequisite;
this cooperative local owner does not claim hostile-filesystem resistance.

### Capability and restart semantics

The module privately records only acknowledged installations. claimBrokerV1 is
synchronous, once-only, and returns an opaque identity bound to that installation,
registration and process. Its first invocation spends the claim before return;
throw/lost acknowledgement never restores it. It has no methods, registration
mutation or restart representation. Duplicate, copied, foreign or serialized
identities refuse. Within a process, duplicate canonical root/workflow admission
is denied across factory instances; filesystem exclusive creation additionally
arbitrates separate processes. No exported registry reset.

The future P4A composition must statically capture this genuine factory and retain
the returned AdmissionV1 directly. It calls claimBrokerV1 once before exposing its
single broker, retains the opaque identity privately, and uses registration only
from that same result. It accepts no caller-provided AdmissionV1/claim/registration
as authentic. No generic public verify-or-mint port is added. The broker remains
single-process and cannot reopen this owner. A future production factory/consumer
composition requires its own reviewed installation paths; these are not implemented
by an offline fixture or inferred from structural interfaces.

The batch conservatively admits all its episodes before any metadata preparation.
After restart none may restart preparation, even if its refresh never started.
No durable per-episode outcome recovery is needed. Negative expiry, eviction,
new publication/version labels and new generation labels cannot refund admission.
P4A still spends each episode's one participation before invoking or joining a
refresh and retains its 10-second deadline. This owner does not fetch, choose,
begin, reserve, consume, finish, cancel, publish catalog evidence or write receipts.

B1 normal reopen remains a different authority path. Authentic primary terminal
no-send/failed-settled may allow only its predeclared R2 under existing checks,
without reopening recovery admission. Local B1 quarantine still refuses; ledger-only
reconciliation with pending owner state cannot authorize R2. No R1 replay, third
attempt, invented terminal proof, budget refund or unused-primary consumption.

### Proposed bounded implementation

Limits: 1..128 intents, 256 KiB UTF-8 captured input/registration each, depth 16,
65,536 expanded nodes, 2,048 UTF-16 units per ordinary string, 1,024 per path,
and 4 MiB database (verified page-size/page-count cap); rollback journal at most
4 MiB plus 1 MiB overhead. Refuse excess before allocation/descent where observable.
Retain at most 32 successful/uncertain local installations; no reset or terminal
quota reclamation. A failed prevalidation does not allocate an installation.
Bounds are conservative proposals, not throughput or universal power-loss claims.
SQLite's accepted local durability assumptions apply; unsupported storage refuses.

## Acceptance Criteria

| AC | Required evidence |
|---|---|
| 1 | Actual fresh B1 initialization, real admission transaction and exact actual ID/request-digest binding; literal independent digest fixtures. No B1 begin or ledger reservation. |
| 2 | Independent-process same-root bootstrap race yields at most one acknowledged admission/claim; case/path aliases and duplicate in-process factories cannot split custody. Distinct roots with genuinely distinct fixture identities succeed. |
| 3 | Fault before B1 call, during B1 write, after B1 COMMIT/before acknowledgement, between stores, during admission write, after COMMIT/before reread/ack, after claim-before-broker and after refresh/ready/handoff each preserve specified refusal. Restart cannot mint a capability from either file or returned JSON. Tests explicitly distinguish untouched setup from partial durable bootstrap. |
| 4 | Missing admission with existing B1, missing/corrupt B1 with admission, wrong identity/root/workflow/generation, changed business labels, symlinks, schema/settings tampering and file-cap overflow refuse without repair. An existing unused B1 store cannot initialize admission. |
| 5 | Bounded hostile capture, exact limits/one-over, aliases, getters/proxies, unknown fields, throwing storage and contention all return typed results without unbounded work; independent tests prove claim consumed before acknowledgement. |
| 6 | Real B1/ledger fixtures preserve paired terminal-COMMIT versus ledger-only lost-ack behavior: authentic B1 reopen may admit predeclared R2 only in its accepted terminal cases; neither case reopens metadata admission. No R1 or third attempt. |
| 7 | Production constructor refuses hostile input with zero reads/effects. Offline factory cannot accept substituted initializer, setup port, init-result JSON or mode flag. Future broker composition requires direct installed custody, not a structurally valid capability. |

## Out of Scope

Runtime in this release, B1/P2B schema changes, generic persistence utilities,
recovery/reconciliation authority, production installation, provider/network/Pi
calls, broker implementation, C/E activation, telemetry or receipt schema changes.

## Context & References

- [Admission shaping notes](../../goals/hybrid-routing-optimization/hro-p4a-admission-shaping.md)
- [P4A recovery](HRO-P4A-bounded-model-recovery.md)
- [B1 custody](PMC-P2B1-durable-intent-custody.md)
- [C installation contract](PMC-P2C-same-process-launch-controller.md)
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md)

## Allowed Files

This docs-only release allows exactly this spec and
plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p4a-admission-shaping.md.
After two independent design reviews, root disposition and a new Step0/runtime
release, the proposed exact five-file implementation envelope is:

- plugins/foreman-line/dispatch/src/pmc-launch/recovery-admission.ts
- plugins/foreman-line/dispatch/src/pmc-launch/recovery-admission-types.ts
- plugins/foreman-line/dispatch/tests/pmc-recovery-admission.test.ts
- plugins/foreman-line/dispatch/tests/fixtures/pmc-recovery-admission-worker.ts
- plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p4a1-verification.md

All are new. No existing source or dependency changes, public exports or additional
artifacts. Actual admission/broker production wiring remains separately scoped.

## Verification Plan

Frozen spec-linter, required sections, local links, exact two-file diff and clean
commit checks for this release. Future runtime checks require actual temporary
SQLite stores, isolated process races/faults, source-preservation checks, dispatch
tests/typecheck/lint and actual audit enrollment through its separate owner if
required. Never suppress scanners or claim synthetic authority is production proof.

## Offline implementation release and Step0 dispositions — 2026-09-26

Luna completed actual read-only Step0 and stopped at48aab911484722a47ea2291e8a26fdb9fafd904f,
checking the real B1 initialization/SQLite/refusal and test seams. Design16ebc41
has two independent frontier approvals and ratification48aab91. Root accepts Step0
and releases exactly the five new implementation paths above under delegated goal
and prerequisite authority. Earlier docs-only wording remains historical only for
this offline slice; production remains unconditional PREREQUISITE_UNAVAILABLE.

The seven implementation questions are disposed as follows:

1. Literal SQL spelling/order is an implementation choice within the already frozen
   exact two STRICT tables, names, columns, types, constraints and no-extra-schema
   contract. Freeze it in the implementation and independently inspect actual
   sqlite_schema/PRAGMA results and malformed-schema fixtures. Only expected implicit
   primary/unique indices are allowed; cross-column request-ID uniqueness is checked.
2. The root already exists. Test installation creates its fresh temporary directory
   before calling the factory. The admission owner never creates caller directories.
3. The 256-KiB limit is UTF-8 bytes of the closed owned JSON representation for input
   and registration separately, including keys, punctuation and escapes. Charge
   incrementally before expansion; aliases count as expanded JSON. Individual
   ordinary/payload/path UTF-16 and depth/node limits also apply independently.
4. Preserve B1 COMMIT_UNCERTAIN, IO_FAILED, BUSY and PATH_REFUSED as the corresponding
   new codes. Map its STORAGE_INVALID, STORAGE_MISSING, IDENTITY_MISMATCH and
   SETTINGS_REFUSED to STORAGE_INVALID; other B1 denials map to B1_REFUSED. Existing
   B1 ALREADY_EXISTS alone does not prove successful recovery admission. New owner's
   own prevalidation uses its declared INPUT/BOUNDS/PATH codes. Any possibly mutated
   or uncertain failure still withholds capability and preserves artifacts.
5. Test-only DatabaseSync prototype fault instrumentation is permitted in isolated
   child processes, restored/contained without a production port or mode switch.
   Preserve genuine after-COMMIT versus before-COMMIT outcomes; do not relabel a
   native owner's returned uncertainty code or infer rollback from a thrown call.
6. Reserve the bounded local slot synchronously after prevalidation and before B1
   invocation; at32 retained successful/uncertain reservations return BOUNDS_REFUSED
   before invoking B1 or writing. Failures after that invocation retain a held slot;
   invalid prevalidation does not allocate. Derive canonical root identity from
   actual bigint dev/file identifiers, with the exact B1 workflow ID as tuple key;
   path aliases cannot split admission. No floats, caller identity override or
   delimiter-collision key. Refuse unsupported/zero file identity. Existing fixed
   B1/store exclusivity still denies any alternate workflow in the same used root.
7. Offline fixture ownership is the explicit trusted test-installation assumption,
   backed by actual path confinement/no-reparse checks and the harness's created
   directory. A matching name alone is not production ownership/authentication.
   Ordinary production task input has no route to the offline constructor; private
   module import compromise is outside the cooperative boundary. Report this limit.

Preserve genuine RED/GREEN, actual B1/SQLite/process-race/fault/R2 controls, all
bounds and source preservation. No existing owner/schema/barrel/dependency edits,
provider/Pi/credential/configuration effects or public factory/mint. Freeze a clean
five-file source/report handoff and stop for two independent source reviews;
combined integration, relevant package checks and remote CI still gate merge.

## P4A1 independent review repair release — 2026-09-26

Root and independent frontier D request changes at93f54bd26d89201b61292e0dc2f10e1a51fa442e.
Both reproduced input-junction acceptance with store creation, exact262144 JSON
UTF-8 input falsely rejected, and70,000-element array ownKeys invoked before
observable bound refusal. Root probe: TEMP/hro-p4a1-root-probe.mts. Existing12
focused tests pass but omit these defects; no full-suite/typecheck pass was claimed.

Root accepts Luna's genuine read-only repair Step0 and releases the same five-file
scope for correction. Check supplied path components before realpath and retain
canonical confinement/identity checks afterward. Array index names are not part
of JSON serialized capture cost; preserve all value/punctuation/escape accounting.
Preflight observable array length/minimum expanded node cost before ownKeys or
child descriptors; at the closed top-level intents field also preflight its128
item cap before enumeration. Pair exact/+1 and actual junction controls with
zero stores/effects on refusals; exercise both129 intents and70,000 unknown-array
bounds without descendant traps. No source/API/SQLite semantics are widened.

Root added absent sibling dependency links only after matching each package lock
against the read-only E1 integration donor. Existing links were preserved and no
install/donor write occurred. Run full dispatch tests/typecheck and relevant lint
with pinned Node24.19 after focused RED/GREEN; do not label unrelated load failures
as a pass. Preserve actual B1/ledger/R2/race/commit-uncertainty tests, production
zero-read refusal and unchanged owners. Update the existing report, freeze clean
and STOP for two independent final source reviews and later combined/remote gates.
