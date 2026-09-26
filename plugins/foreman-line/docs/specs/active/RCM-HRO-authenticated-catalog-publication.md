---
ticket: RCM-HRO
title: Private authenticated public catalog publication
status: active
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/routing-policy/
  - plugins/foreman-line/docs/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Shape the genuine catalog fetch, materialization, publication and acquisition
owner required by HRO-P4A. Preserve the existing retained-observation producer
and pure RCM evaluator while adding separately versioned raw-response semantics.
This is a docs-only draft: no runtime, provider call or production activation is
authorized by this release.

## Constraints

### Decisions and authority

Root accepted the Step 0 decisions: additive raw-response materialization in the
existing RCM owner; a later genuinely installed publisher may attempt fixed
credential-free metadata GET; immutable bounded single-process generations with
atomic pointer CAS and private issuer custody. Historical unauthenticated success
is not a promise of future availability. Missing documentation of unauthenticated
access alone does not permanently prohibit an attempt. Actual failure refuses;
there is no credential fallback. Root ratification of this draft, two independent
reviews and separately scoped implementation release remain required.

This owner authenticates local acquisition provenance and custody, not provider
truth, model quality, account entitlement, tariff completeness or execution
approval. TLS and complete parsing cannot establish those separate facts. Catalog
output remains evidence; no registry, alias, tier, configuration or model approval
is promoted. HRO-P4A owns episode refresh participation/coalescing/negative cache;
durable workflow admission is a separate prerequisite and is not implemented here.

### Fixed acquisition domain

Proposed profile `openrouter-public-text-materialization/v1` uses exactly
`GET https://openrouter.ai/api/v1/models`, no query, body, cookies or authorization.
Install this exact endpoint and reviewed extraction profile in trusted composition;
no task URL, task-selected fetch, environment-selected adapter or alternate host.
Send only fixed Accept: application/json and Accept-Encoding: identity headers.
Do not read credentials, Pi settings, account endpoints or inference endpoints.
Redirects refuse without following; TLS validation is mandatory. Refuse non-200,
401/403, non-JSON, unsupported content encoding, premature termination, malformed
UTF-8/JSON, duplicate keys, excess bounds or cancellation. No retry within one
refresh operation and no credential fallback. Installed transport must expose
actual bounded bytes/termination/status metadata to the owner; mocked returns
remain unknown until validated.

The reviewed official models reference states that omitting offset and limit
returns the full list and output_modalities defaults to text. Thus this profile's
domain is the default public TEXT-output catalog, not every OpenRouter model,
account availability or regional/provider-specific offerings. Do not add search,
pagination, category, region or capability filters. Any server continuation or
pagination indicator, incompatible schema/domain change, truncated body or
unestablished completeness returns COMPLETENESS_UNPROVEN. Do not concatenate pages
from different generations or infer completeness from Content-Length alone.
Revalidate this pinned documentation/profile contract before future activation.
The accepted full-response envelope has exactly these own keys:
`{data: RawModelRow[], links: {next: null}, total_count: number}`. Both links and
its next key are required; links has no other key. total_count is a safe integer
0..10000 and must equal data.length before any row is omitted or projected. Empty
inventory is admissible only with data:[], links:{next:null}, total_count:0 and all
other transport/profile gates satisfied. No data-only legacy mode is accepted.
Unknown top-level/link keys, missing metadata, non-null next (including an empty
string), invalid/mismatching counts or pagination indicators return
COMPLETENESS_UNPROVEN. Never follow a response link. The official reference's
embedded OpenAPI requires data, links.next and total_count; its abbreviated example
omits the last two. This strict reviewed profile intentionally refuses that example
and may refuse the actual endpoint until compatible production evidence exists.

Every raw row, including unrequested rows, must have a valid exact model id under
the existing RCM identity rules; all ids must be unique across the entire data
array. Before claiming coverage, every row must have an own architecture object
with own output_modalities array: 1..16 distinct strings, each 1..64 ASCII
lowercase letters/digits/underscore/hyphen, including the case-sensitive token
text exactly once. This is the precise text-domain membership predicate. Do not
infer membership from modality, name, tokenizer, requested identity or a default.
Additional modality tokens remain observed residual modalities under the existing
RCM rules; their presence does not authorize any nontext capability. Missing,
malformed or text-absent membership on any row makes whole-response coverage
unproven, rather than dropping the row. Non-domain fact omissions remain explicit
incomplete rows only after coverage is proven. Duplicate or unclassifiable ids
also refuse coverage: ignoring them could fabricate absence.

Coverage additionally requires the genuine complete bounded fixed no-query GET,
unchanged accepted profile and valid transport termination. The materializer checks
this predicate before either catalog or absence success. Missing/unknown coverage
returns COMPLETENESS_UNPROVEN for both variants, with no candidate publication or
handle; supplied complete:true cannot override it. This establishes coverage only
of this reviewed public-text domain, never account entitlement, quality or billing.

Public metadata is hostile input. Discard unneeded descriptions/links and never
follow them. Provider HTTP errors remain transport/refusal evidence, never ABSENCE.
Transport capture records local request-start and complete-response receipt time;
provider dates, model-created fields, ETag, mtime and publication time cannot reset
freshness. HTTP metadata is bounded and informational, not generation authority.

### Closed bounds

| Resource | Limit |
|---|---|
| Complete operation | 10,000 ms, including body read, parsing, materialization and publication |
| Concurrent operations | 4; excess refuses immediately, no hidden queue |
| Body | 8 MiB wire and decoded bytes; identity encoding only |
| Requested scope | 1–256 distinct exact openrouter/model-id pairs |
| Response rows | 10,000, unique exact IDs |
| Structured capture | depth 16, 262,144 expanded values, 4,096 UTF-8 bytes per string, 1 MiB aggregate retained strings |
| Artifacts | each at most 8 MiB, combined response-derived artifacts at most 16 MiB |
| Active publication scopes | 128; no implicit eviction of active scope |
| Retained generations | one current generation per scope; four bounded in-flight candidates |
| Catalog validity | at most 24 hours from complete-response receipt; earlier policy expiry wins |
| ABSENCE validity | at most 30 seconds from complete-response receipt; earlier policy expiry wins |

Existing stricter reader/adapter/input limits continue to apply. Parse before
retaining excess data; preflight size/cardinality before child descriptor descent.
Exact-limit and one-over tests are mandatory. Deadline uses a captured monotonic
clock; UTC timestamps are separately checked for ordering and future values.
Cancellation spends P4A participation; it cannot publish a late candidate, restore
an old generation or extend a deadline. Unknown/throwing clocks refuse.

### Additive raw-response materialization

Proposed `materializePublicModelResponseV1` is a pure function owned alongside
`producePublicObservationSnapshot` in routing-policy. It accepts owned raw response
bytes, closed observed transport metadata, exact requested identities and a
separately accepted extraction-profile declaration. It performs no I/O, clock,
network, authority issuance or publication. Its results always carry evidenceOnly.
The new input/result schema is separately versioned; it must not manufacture the
old manifest's historical filenames, baseline counts, refusal binding 7,
ratification labels or source-run history. The accepted retained-artifact API and
its tests remain unchanged.

Reuse existing RCM canonical model validation, decimal-price conversion and sole
readCatalogSnapshot validation. Share private pure helpers only under the explicit
RCM amendment; do not implement a competing catalog reader or copied price math.
Preserve observed text/image intersection and residual modalities. The reviewed
reasoning inference requires nonempty observed supported_efforts; absent/empty
remains unknown and cannot become false. The new raw v1 profile deliberately
narrows effort mapping as specified below: it never emits off, even when none is
observed. The retained-artifact API's existing reviewed none-to-off mapping and
fixtures remain unchanged. Missing levels and mandatory-reasoning off refuse.
No Pi defaults or clamping supply metadata. New shape/profile changes
require review, not runtime widening.

Retain exact captured response bytes or a bounded lossless allowlisted field
projection with exact raw-byte digest, field locators, original observation time
and profile version. Derive new artifact digests from those bytes; separately
installed profile authority accepts the transformation, not a task-provided hash.
Public response pricing remains observed fields only: it does not certify all
billable components, account price or a cost ceiling. Unknown required facts
produce explicit incomplete rows; no zero/false/default placeholders.

Results account for every requested identity as facts, incomplete, unsupported
or absent-in-domain. Absence and incompleteness are distinct. Canonical success
requires complete facts for the exact declared canonical scope. A mixed request
must not silently shrink the scope to obtain success. The pure materializer can
report scoped absence evidence, but only the private publisher may authenticate
its acquisition and issue an ABSENCE capability.

Candidate variants are closed: `catalog` requires facts for every identity in the
original requested scope and contains canonical bytes/declarations for exactly
that scope; `complete-response-with-absence` retains that entire scope and its
inventory plus the complete nonempty set of exact absent identities. The latter
contains no canonical bytes or accepted catalog declarations. Facts, incomplete
and absent rows may coexist there only when complete response coverage proves
each absent row independently; incomplete rows never enter the absent set.
Unsupported requested provider/profile/domain refuses before acquisition rather
than generating absence. No candidate selects only the first missing identity or
shrinks canonical scope. With no absent identities and any incomplete row,
materialization refuses publication and returns no handle.

### Private publication and acquisition

Proposed private `createCatalogPublicationOwnerV1` captures trusted installation
identity, authority scope, reviewed profile, fixed terminal metadata transport and
clocks once. Installation is unavailable to task payloads and is not exported by
the dispatch barrel. Test installation has a distinct private provenance domain;
it cannot issue production capabilities. Production composition must use the real
reviewed fixed transport and accepted profile, not a success-shaped JSON adapter.

Proposed private ports are asynchronous `requestCatalogRefreshV1` and synchronous
`acquirePublishedCatalogV1`. A request supplies only a previously registered operation handle. Operation registration captures the previously registered scope, expected generation and remaining episode deadline. Registration freezes
workflow/trust scope, endpoint/profile/domain and sorted exact identities; it
cannot expand mappings or endpoint authority. Unknown/copied/serialized handles,
new identities, changed installation or scope refuse before transport.

Refresh returns a closed result tagged published, absent or refused. Published
contains a private publication handle and monotonic local generation. Absent
contains a private ABSENCE handle. Refused contains only a bounded typed code:
INPUT_REFUSED, CAPACITY_REFUSED, TRANSPORT_REFUSED, DEADLINE_EXCEEDED, CANCELLED,
COMPLETENESS_UNPROVEN, MATERIALIZATION_REFUSED, PUBLICATION_CONFLICT or
INSTALLATION_REFUSED. Error strings/body content never become authority or logs.

Build each candidate privately. After successful capture/materialization and
fresh checks, compare the current scope generation with the request's expected
generation, then replace one immutable in-memory record synchronously with no
await or external callback between comparison and replacement. Generation starts
at zero and increments once per acknowledged publication; reject overflow at
Number.MAX_SAFE_INTEGER. Concurrent candidates for the same expected generation
have one winner; losers return PUBLICATION_CONFLICT and cannot retry themselves.
Handles are frozen empty objects authenticated through private identity maps;
JSON, hashes and structurally matching objects confer no custody. Replace/delete
old handle entries on publication so stale versions cannot be acquired.

Both candidate variants use this SAME scope generation, CAS, deadline and
acknowledgement path. A winning catalog OR absence publication replaces the entire
current record and invalidates every older catalog and absence handle atomically.
An absent result therefore includes the acknowledged new generation, full original
scope and bounded exact absent-identity set. No separate negative-generation map
or unacknowledged absence result is allowed. An incomplete-only or other refused
operation does not publish and returns no handle; an existing generation may
remain available to other authorized callers until replaced/expired. That is not
success for the failed recovery episode: it holds without adopting old data or
refunding its spent refresh participation. No hidden global revocation is required.

Synchronous acquisition checks exact owner/handle/scope/generation, current
authority/profile, time/expiry and original source provenance; returns detached
bounded bytes and accepted catalog declarations from privately retained records.
It performs no fetch, await, refresh or caller callback. Re-run the real canonical
reader and adapter boundary when composing C's input; a previous publication is
not cached eligibility. Copies of returned data are evidence only and mutation
cannot change retained bytes or a later acquisition.

Acquisition is variant-specific. If the current scope record is an absence
publication, catalog acquisition returns CURRENT_ABSENCE; it never falls back to
older positive bytes, including when the requested identity has a facts row in
the mixed inventory. Catalog acquisition requires a current catalog handle.

The issuer authenticates ABSENCE only when an acknowledged, complete validated
response covers the exact requested identity within this TEXT domain. Bind
identity, requested scope, trust scope, endpoint/profile/domain, generation,
raw evidence digest, complete receipt time and validity. A model outside the
domain is not globally absent. Producer INCOMPLETE_SCOPE, missing required facts,
unsupported profiles, successful JSON alone, 404 and failed/partial responses
never issue an absence handle. P4A may negative-cache only through the installed
issuer's private verification port, with its original 30-second/256-entry limits.

Private synchronous `verifyAbsenceV1` requires the registered scope handle, absence
handle, one exact identity and expected current generation. It first checks issuer
identity, exact private scope registration and handle-to-scope membership; a
foreign registered scope returns SCOPE_REFUSED before generation or absence checks.
Equal identities/generation numbers never substitute for exact scope identity.
It then checks current variant/generation, unchanged full scope and domain/provenance, identity membership
in the absent set and current validity. It returns a detached bounded verified
record or typed refusal; a verified record is evidence for the installed P4A
consumer, never a transferable capability. Facts/incomplete rows, foreign scope,
stale/cross-instance/copied handles and out-of-domain identities refuse. There is
no fetch, callback, refresh or lifetime extension during verification.

### Frozen proposed interfaces and transport ownership

All input records below have exactly the listed own data keys; outputs are owned
and bounded. Symbols/accessors/extra keys, thenables, invalid numbers and malformed
identities refuse. Handles are opaque frozen empty object identities. `Identity`
is exactly `{provider:'openrouter', id:string}`; `Generation` is a safe nonnegative
integer. Scope/identity arrays are canonical sorted unique sets within the bounds.
Type names below are proposed contracts, not existing exports.

```ts
type OperationRegistration = {scope:object; expectedGeneration:number; deadlineMonoMs:number};
type OperationRegistrationResult =
  | {ok:true; operation:object; cancellation:object}
  | {ok:false; code:'INPUT_REFUSED'|'CAPACITY_REFUSED'|'DEADLINE_EXCEEDED'|'INSTALLATION_REFUSED'};
type RefreshInput = {operation:object};
type CancelInput = {operation:object; cancellation:object};
type CancelResult =
  | {ok:true; outcome:'cancelled'|'already-cancelled'|'already-settled'}
  | {ok:false; code:'INPUT_REFUSED'|'INSTALLATION_REFUSED'};
function registerRefreshOperationV1(input:unknown):OperationRegistrationResult;
function requestCatalogRefreshV1(input:unknown):Promise<RefreshResult>;
function cancelRefreshOperationV1(input:unknown):CancelResult;
type RefreshResult =
  | {kind:'published'; handle:object; generation:number}
  | {kind:'absent'; handle:object; generation:number;
      requestedIdentities:readonly Identity[]; absentIdentities:readonly Identity[]}
  | {kind:'refused'; code:RefreshCode};
type RefreshCode = 'INPUT_REFUSED'|'CAPACITY_REFUSED'|'TRANSPORT_REFUSED'
  |'DEADLINE_EXCEEDED'|'CANCELLED'|'COMPLETENESS_UNPROVEN'|'MATERIALIZATION_REFUSED'
  |'PUBLICATION_CONFLICT'|'INSTALLATION_REFUSED';
type AcquireInput = {scope:object; handle:object; expectedGeneration:number};
type CatalogRead =
  | {ok:true; canonicalBytes:Uint8Array; expectedSha256:string;
      acceptedSource:AcceptedCatalogSource; provenance:PublicationProvenance}
  | {ok:false; code:ReadCode};
type AbsenceInput = {scope:object; handle:object; identity:Identity; expectedGeneration:number};
type AbsenceRead =
  | {ok:true; identity:Identity; requestedIdentities:readonly Identity[];
      generation:number; provenance:PublicationProvenance}
  | {ok:false; code:ReadCode};
type ReadCode = 'INPUT_REFUSED'|'HANDLE_REFUSED'|'GENERATION_REFUSED'
  |'SCOPE_REFUSED'|'IDENTITY_NOT_ABSENT'|'CURRENT_ABSENCE'|'EXPIRED'
  |'SOURCE_REFUSED'|'INSTALLATION_REFUSED';
type PublicationProvenance = {
  workflowId:string; trustScopeId:string; profile:'openrouter-public-text-materialization/v1';
  endpoint:'https://openrouter.ai/api/v1/models'; domain:'public-text-output';
  generation:number; sourceSha256:string; requestStartedAtUtc:string;
  completeReceivedAtUtc:string; validUntilUtc:string;
};
type InventoryRow =
  | {identity:Identity; kind:'facts'; facts:ModelRecord}
  | {identity:Identity; kind:'incomplete'; code:'REQUIRED_FACT_MISSING'}
  | {identity:Identity; kind:'absent-in-domain'};
type Candidate =
  | {kind:'catalog'; requestedIdentities:readonly Identity[];
      inventory:readonly InventoryRow[]; canonicalBytes:Uint8Array;
      acceptedSource:AcceptedCatalogSource; provenance:PublicationProvenance}
  | {kind:'complete-response-with-absence'; requestedIdentities:readonly Identity[];
      inventory:readonly InventoryRow[]; absentIdentities:readonly Identity[];
      provenance:PublicationProvenance};
```

### Registered operation ownership and reclamation

The three operation functions above are private installation-retained ports, not
public barrel or task APIs. Registration validates/captures its exact closed input,
authenticates scope ownership, reserves one of the existing four operation slots
and creates two distinct frozen empty identities in private custody. The effective
deadline is min(requested deadline, registration monotonic time + 10000ms); an
already-expired deadline refuses before allocation. Scope, generation and deadline
cannot be changed at invocation. Invalid, foreign, cloned or serialized identities
refuse; no cancellation can be authenticated from a plain record or AbortSignal.

Registration is not a transport call. Its operation can invoke refresh exactly once;
mark invoked synchronously before transport. A second invocation returns
INPUT_REFUSED with no I/O or slot allocation, including while the first is pending.
P4A coalesces the first operation's promise; waiters do not invoke it again. The
broker's trusted operation owner retains cancellation identity, never individual
waiters. A waiter timeout/abandonment changes only that waiter's result and spent
participation. It cannot abort a valid other waiter, revoke publication or extend
an operation. No waiter signal is forwarded as the transport's operation signal.

cancelRefreshOperationV1 authenticates both exact same-installation identities,
latches cancellation synchronously and aborts only the internally owned transport
controller. Abort/cleanup failures cannot escape the typed boundary or clear the latch; retain the occupied slot when terminal cleanup is uncertain. Never accept a task-supplied signal/controller. First preterminal cancel
returns cancelled; repeated cancel returns already-cancelled. After a settled
non-cancel outcome (including acknowledged publication or timeout), return
already-settled without changing it. Cancellation before invocation consumes the
operation's invocation opportunity permanently; its refresh result is CANCELLED
with zero transport. Cancelled pending operations produce CANCELLED, never a late
candidate. Timeout similarly fixes DEADLINE_EXCEEDED. Once either terminal refusal
is latched, later completion cannot override it; first latched refusal wins.

Check owner cancellation/deadline before transport, after every awaited boundary,
and after materialization immediately before CAS. Read the trusted clock before
the last cancellation-latch check; then perform cancellation/deadline/generation
checks and record replacement synchronously with no external callback or await.
Both catalog and absence use this exact path. A cancellation after acknowledged
CAS is already-settled and does not revoke or roll back the published generation.
No cancelled result issues a catalog/absence handle, adopts old data as refresh
success, refunds participation or modifies another scope's current record.

All registered, running and cleanup-pending operations count against the same
four slots. Registration schedules a bounded owner deadline wakeup; fresh
registration/invocation also checks expiry synchronously, so a delayed timer
cannot revive an expired never-invoked operation. A registered operation that was
never invoked releases its slot exactly once on cancellation or deadline expiry,
with no I/O. A running operation never releases its slot merely because the caller
promise refused or a timer/cancel fired. It releases only after the real owned
transport acknowledges terminal cleanup by settlement of its ORIGINAL readMetadataV1 promise (fulfillment or rejection): no active request/socket/body reader,
no scheduled retry or producer capable of I/O. A success/refusal after genuine
transport termination and synchronous candidate processing releases once. A
cancelled/timed-out pending transport retains the slot until that acknowledgement;
if cleanup is uncertain, hold the slot and refuse new capacity rather than exceeding
four. The caller still receives its bounded refusal by the operation deadline;
uncertain cleanup does not authorize another operation or an unbounded caller wait.

Keep live/cleanup-pending operations strongly retained only within those four
slots. Cleared timer and terminal outcomes remain associated through weak identity
maps while callers retain capabilities; no unbounded strong tombstone list. A
released operation is never registered again, and every old-cap replay is rejected
or returns its terminal cancel disposition without consuming a new slot. A new
registration creates new identities and does not reset any P4A episode budget.
Restart loses all operation/scope/cancellation authority; existing restart rules
remain. Tests must assert physical adapter activity counts, not only promise counts.
Candidate generation denotes expectedGeneration+1 and remains unissued until
CAS acknowledges it. Candidate catalog inventory must contain only facts; absence
inventory must cover each original identity exactly once, and absentIdentities
must equal all and only absent-in-domain rows. Reuse actual RCM ModelRecord and
AcceptedCatalogSource types, not local copies. These candidate records are private
publisher-owned data, not public materializer authority. The public pure new
materializer accepts `unknown` and validates this closed data contract:

```ts
type MaterializerInput = {
  bytes:Uint8Array; requestedIdentities:readonly Identity[];
  profile:'openrouter-public-text-materialization/v1';
  endpoint:'https://openrouter.ai/api/v1/models'; domain:'public-text-output';
  requestStartedAtUtc:string; completeReceivedAtUtc:string; evaluationTimeUtc:string;
  complete:true;
};
type MaterializerResult =
  | {ok:true; evidenceOnly:true; kind:'catalog';
      requestedIdentities:readonly Identity[]; inventory:readonly InventoryRow[];
      canonicalBytes:Uint8Array; canonicalSha256:string; acceptedSource:AcceptedCatalogSource}
  | {ok:true; evidenceOnly:true; kind:'complete-response-with-absence';
      requestedIdentities:readonly Identity[]; inventory:readonly InventoryRow[];
      absentIdentities:readonly Identity[]; sourceSha256:string}
  | {ok:false; evidenceOnly:true; code:'INPUT_REFUSED'|'BOUNDS_REFUSED'
      |'PROFILE_REFUSED'|'COMPLETENESS_UNPROVEN'|'SOURCE_REFUSED'|'INCOMPLETE_SCOPE'};
```

Its complete flag and acquisition timestamps are evidence declarations only;
production owner supplies them from genuine captured transport, not task JSON.
The materializer verifies response/domain completeness under the reviewed profile
before classifying absence. It has no generation, workflow authority, handles or
issuer. Private publication adds those bindings from installed scope after genuine
transport capture. Reproducible source references/digests are computed under the
new profile, never copied from the historical manifest or treated as authority.

Fixed transport implementation proposal:
`dispatch/src/pmc-launch/catalog-metadata-transport.ts`, with no public barrel export.
Its private captured `readMetadataV1` accepts exactly
`{deadlineMonoMs:number, signal:AbortSignal}` from the installed owner, not task
data; trusted cancellation objects are not serialized input. Its return is
`Promise<unknown>` at the external boundary. The owner validates the sole success
shape `{status:200, mediaType:'application/json', contentEncoding:'identity',
requestStartedAtUtc:string, completeReceivedAtUtc:string, complete:true,
bytes:Uint8Array}` against actual terminal-capture custody; a matching object
supplied by a caller cannot establish it. Transport failure maps to
TRANSPORT_REFUSED, DEADLINE_EXCEEDED or CANCELLED according to the latched owner outcome. This module owns the exact fixed Node HTTPS
GET and stream termination/cancellation, without redirects, environment proxy,
credential reads, caller headers or generic fetch injection. Production factory
captures that implementation statically. Private network-incapable tests exercise
the same bounded response handling with a distinct installation provenance domain.
The original readMetadataV1 promise is also the existing terminal-cleanup
acknowledgement; no new callback, handle or API is added. It MUST NOT fulfill or
reject until the actual owned request/socket/body reader and every producer of I/O
have conclusively terminated. This condition applies equally to success and all
failure paths. Failed HTTP status, stream/parser bounds, malformed response,
abort and timeout destroy/terminate the owned transport as appropriate, then await
actual terminal close/cleanup before the original promise rejects. Calling destroy,
observing an error, issuing abort or firing a timer is not itself close acknowledgement.
If no transport was created, conclusive absence of active owned I/O permits immediate
settlement. Complete body receipt alone does not permit fulfillment while an owned
socket or reader remains active.

The publisher separately races its outward caller result against the owner
cancellation/deadline latch. That outward bounded refusal does not settle the
original transport promise and never releases capacity. Retain and observe the
original promise immediately, including its rejection, until actual cleanup. If
cleanup is uncertain the original promise remains pending and the slot remains
held, even though the caller already received CANCELLED or DEADLINE_EXCEEDED.
A later original fulfillment or rejection acknowledges cleanup and permits exactly
one slot release; it cannot replace a latched refusal, enter materialization/CAS,
issue a handle or publish a late candidate. On ordinary non-cancelled completion,
retain the slot through synchronous candidate processing before release. Distinguish
this original promise from any raced/wrapped outward promise in implementation and
tests; settling the outward race never counts as transport acknowledgement.
Closed shared private publisher/transport types live in
`dispatch/src/pmc-launch/catalog-publication-types.ts`; raw-response pure types and
profile validation remain in the RCM producer owner.

Publication is memory-atomic, not durable. Restart destroys all issuer identity,
handles and generations; old data cannot reinstall authority. No JSON disk cache,
generation reset or recreated owner may reset the workflow admission/refresh
budget. A new process can publish only under separately valid workflow admission;
otherwise it refuses. This parcel cannot grant such admission.

### Checkpoint N materializer disposition — 2026-09-26

This docs-only amendment starts at c4f1e22b0d15f53b0ac600b940748225d54cf720.
Root accepted the genuine read-only checkpoint N Step0 and disposed the following
details. Runtime implementation is not released; independent amended-design
review and explicit root release remain required.

materializePublicModelResponseV1 accepts unknown and validates the existing closed
MaterializerInput/MaterializerResult contract above. Reuse the exact InventoryRow
union and imported ModelRecord/AcceptedCatalogSource; add no result keys or
unsupported inventory variant. Unsupported requested providers return
PROFILE_REFUSED before raw materialization. Missing/malformed non-domain required
facts produce incomplete/REQUIRED_FACT_MISSING after coverage is proven. Malformed
identity, duplicate identity or missing/malformed text-domain membership anywhere
in the response returns COMPLETENESS_UNPROVEN for both candidate variants. Missing
or invalid whole-response envelope metadata has the same coverage refusal.
Incomplete-only scope returns INCOMPLETE_SCOPE. Mixed facts/incomplete/absence
retains every original requested identity; absentIdentities equals all and only
absent-in-domain rows. No incomplete row becomes absence or a partial catalog.

The new source profile declaration is exactly:

- profileId: openrouter-public-text-materialization
- profileVersion: v1
- sourceEvidenceRef and canonical sourceRef: the literal prefix
  `openrouter-public-text-materialization/v1:sha256:` followed immediately by
  the lowercase 64-character SHA-256 of the exact raw response bytes
- sourceEvidenceSha256: that raw-byte digest
- canonicalSha256: SHA-256 of the actual generated canonical bytes
- requestedIdentities: the complete original requested scope
- canonical provider checkedAtUtc: completeReceivedAtUtc, never request start,
  evaluation time, publication time or a provider-created timestamp

Choose the raw-byte retention branch: the publisher retains the actual captured
raw response bytes unchanged, with its captured timestamps/profile and private
provenance. The pure materializer defensively copies input bytes for computation;
its return schema does not grow raw-byte or fabricated manifest fields. The source
reference is reproducible evidence, not custody or acceptance authority. No
historical filenames, refusal binding 7, baseline counts or ratification labels
are generated. Caller-supplied complete/times/profile declarations remain
evidenceOnly until the separately installed publisher authenticates acquisition.

Field locations are exact JSON Pointers into the retained response, using the
actual zero-based row index: /data/<index>/id,
/data/<index>/architecture/input_modalities,
/data/<index>/architecture/output_modalities,
/data/<index>/context_length, /data/<index>/top_provider/max_completion_tokens,
/data/<index>/pricing/prompt, /data/<index>/pricing/completion and
/data/<index>/reasoning/supported_efforts. These define the extraction profile;
they do not add fields to ModelRecord or the result union. Extra request fees,
other rates/modalities and unprojected observations remain in the retained raw
bytes. Prompt/completion price projection proves only those observed rates, never
zero request fees, account billing completeness, an execution ceiling or entitlement.
Missing required observations cannot be replaced by defaults or inferred from
names, Pi configuration, context length or another row.

Raw reasoning mapping is explicitly narrower than retained v2. Accept only an
own reasoning.supported_efforts array of unique known strings from
max/xhigh/high/medium/low/none. Require at least one positive effort from
max/xhigh/high/medium/low; emit reasoning:true only as the reviewed profile
inference and map each observed positive effort identically in that fixed order.
Never emit off or minimal. Observed none is retained only in the original raw
evidence and is omitted from the canonical map. None-only, missing, empty,
malformed, duplicate or unknown efforts make the row incomplete. No verified
general raw mandatory-reasoning signal exists here: do not invent mandatory:false,
recognize a guessed mandatory flag, or treat none as authorization for off.
This deliberate new-profile restriction does not modify retained producer v2's
none-to-off behavior or its byte-pinned fixtures.

Share private pure decimal-price and positive-effort projection helpers where
semantically compatible; do not copy price arithmetic or manufacture a retained
projection object to pass historical-profile validation. The sole canonical
reader must validate every generated catalog, and the existing adapter must
consume its exact new AcceptedCatalogSource in tests. No new reader or authority
constructor is permitted. New raw parsing enforces 4,096 UTF-8 bytes per decoded
string and 1 MiB aggregate retained strings, with existing depth/value/body bounds;
retained parsing keeps its existing UTF-16 behavior unchanged. Use an explicit
private parsing mode, not a silent limit change to the old public entry point.

Checkpoint N controls additionally pair catalog/absence full-envelope success with
each coverage refusal; exact source references/digests/timestamps and JSON Pointer
mapping; decimal conversion; positive-only effort mapping and none-only refusal;
malformed/incomplete versus absent rows; exact scope; hostile capture/bytes and
UTF-8 versus retained UTF-16 boundary cases. Mutate raw bytes/profile/time/identity
independently. Retained producer canonical bytes, historical artifacts and public
API behavior must remain unchanged. Tests and report distinguish synthetic raw
fixture conformance from actual endpoint compatibility or authenticated acquisition.

### C composition and activation boundary

C acquire remains synchronous and runs after B1 begin. Refresh/publication must
finish before C entry under HRO-P4A. This owner provides catalog bytes, provenance
and source-custody verification to C's trusted installation composer, not its
complete acquire result. C's existing request/decision EvidenceRef binding must be
performed by that composer using genuine source custody; copying a public digest
into an EvidenceRef does not authenticate it. Quality, independence, approved
endpoint configuration, runtime, tariffs/all-components certificates, account,
budget and B1 authority remain their existing owners' responsibilities. Missing
claims still refuse. Do not add network to C, RCM or consume-to-send.

Offline tests can prove normalization and private custody behavior using a
network-incapable installed transport. Production enabling additionally requires
the reviewed real terminal metadata transport, genuine profile/installation
authority and authorized bounded acquisition evidence. No inference or account
call is necessary or authorized here. E production refusal and full HRO live exit
remain unchanged; catalog publication alone closes neither.

## Acceptance Criteria

| AC | Required proof in separately released implementation |
|---|---|
| 1 | Retained producer API and actual retained fixtures unchanged; new raw-response version uses real canonical reader/adapter, exact identities/locators/decimal prices, explicit unknowns and no invented historical artifacts. |
| 2 | Fixed GET capture: task URL/header/adapter substitution, redirects, 401/403/non-200, encoding, malformed/duplicate JSON, truncated stream, deadline and cancellation all refuse with zero credential/inference/config access. Exact bounds and one-over negatives. |
| 3 | Regenerated artifacts reproduce from retained fresh bytes and installed profile; changed bytes/profile/time/identity fail independently. Hash-only and success-JSON inputs cannot authenticate source. |
| 4 | Complete scoped absence issues a privately verifiable handle; generic INCOMPLETE_SCOPE, incomplete/unsupported facts, filtered/partial/paginated responses, 404 and out-of-domain claims do not. Mixed facts+absent+incomplete retains full scope; exact absent set equals every absent row, and only those identities verify. Incomplete-only refuses with no handle and no success for its failed episode, while another authorized caller may still acquire an unexpired prior generation. Independently mutate scope, identity, generation, domain and validity. Same-owner registered scopes A/B with identical identity and generation: A's absence handle verifies with A but returns SCOPE_REFUSED with B before generation/absence membership checks. |
| 5 | Concurrent catalog/absence candidates for the same generation have exactly one acknowledged publication; positive-to-absence and absence-to-positive replacement invalidate ALL old variant handles. Current absence makes catalog acquisition refuse, including facts rows in a mixed result. Losing CAS, timeout/cancel, malformed candidate and stale handle never replace or acquire. Other scopes remain isolated; capacity is bounded. |
| 6 | Direct/serialized/copied/cross-instance/cross-mode handles refuse; mutation of acquired bytes does not alter retained state. Restart destroys authority and cannot reopen P4A participation or workflow admission. |
| 7 | Actual offline RCM-to-C composition preserves synchronous acquire and request-bound source evidence. Missing quality/billing/account/budget claims refuse; catalog success never creates permit, approval or refresh after B1 begin. |
| 8 | Separate production contract review validates installed fixed fetch/profile/custody before any enabling claim; fixtures cannot establish production authenticity. Real failures remain typed with no fallback credentials or model substitution. |


R1 paired controls are mandatory for catalog and absence candidates: cancellation
before invocation, during body read and after materialization/before CAS; late
success never publishes; post-CAS cancellation preserves acknowledged generation.
Two coalesced waiters exercise abandonment of either waiter while the other still
receives success; only operation-owner cancellation aborts both. Foreign/cross-scope
or cloned cancellation identities, duplicate invocation and old-cap replay have no
effects. Exercise four registered-never-invoked expiry/reclamation, four cancelled
running transports with delayed cleanup (fifth registration still refuses), cleanup
acknowledgement allowing exactly one replacement slot, timeout, duplicate cleanup
and uncertain cleanup. No race may undercount actual active transport or refund
P4A participation.

Cleanup-acknowledgement controls must use the actual bounded transport adapter
with a network-incapable low-level test harness. For cancellation and timeout,
delay the actual close acknowledgement after outward refusal; assert the original
readMetadataV1 promise is still unsettled and four such operations still refuse a
fifth registration. Deliver actual close, assert original rejection and exactly
one slot release, then admit precisely the newly available capacity. Late success
and duplicate close/error signals cannot publish or release twice. Also exercise
ordinary success and HTTP/parse/bounds rejection, proving the original promise
settles only after cleanup on both fulfillment and rejection. Uncertain cleanup
keeps the original pending and slot held. Do not substitute an independently
resolved fake promise for the adapter's cleanup event path.
R2 paired controls cover full terminal envelopes producing catalog versus absence,
and missing links/next/count, non-null next, extra envelope/link keys, fractional/
negative/unsafe/over-limit/mismatched counts, duplicate/unclassifiable ids and absent/
malformed/text-absent output_modalities anywhere in data. All coverage negatives
return COMPLETENESS_UNPROVEN with no publication in either path. Include genuine
empty terminal inventory and mixed text-plus-residual modalities; compare exact
absent set against the complete original scope. A data-only abbreviated example
is explicitly a refusal fixture, not a compatibility success. Real endpoint
compatibility remains future evidence, not established by these offline controls.
## Out of Scope

Runtime edits or endpoint calls in this shaping release; durable workflow
admission; inference/account/Pi/configuration access; mapping promotion; general
catalog crawling or pagination; account availability; quality ranking; tariff
completeness; modifying B1, C, D or E contracts; new receipts or production launch.

## Context & References

- [Shaping notes and source pins](../../goals/hybrid-routing-optimization/hro-rcm-publication-shaping.md)
- [P4A recovery contract](HRO-P4A-bounded-model-recovery.md)
- [Retained producer](../../../routing-policy/src/public-observation-producer.ts)
- [Catalog adapter](../../../routing-policy/src/catalog-eligibility-adapter.ts)
- [Accepted source semantics](../../goals/routing-currency-and-merit/source-observation-amendment-20260926.md)
- [Accepted extraction profile](../../goals/routing-currency-and-merit/openrouter-source-profile-20260926.md)
- [C design](PMC-P2C-same-process-launch-controller.md)
- [Official models reference](https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties)
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md)

## Allowed Files

Current release permits exactly these documents:

- `plugins/foreman-line/docs/specs/active/RCM-HRO-authenticated-catalog-publication.md`
- `plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-rcm-publication-shaping.md`

Future source proposals, NOT current authorization: checkpoint N would amend
`plugins/foreman-line/routing-policy/src/public-observation-producer.ts` and
`plugins/foreman-line/routing-policy/tests/public-observation-producer.test.ts`,
adding `plugins/foreman-line/routing-policy/tests/fixtures/public-model-response-v1.json`
and `plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-rcm-materializer-verification.md`.
These are exactly four future checkpoint N files; no barrel, reader, adapter,
dependency, retained artifact or publisher file changes. This docs-only amendment
changes only this spec and the existing shaping notes; the four runtime/report
paths remain unreleased pending independent design review and root release.
Checkpoint P would add `plugins/foreman-line/dispatch/src/pmc-launch/catalog-publication.ts`,
`plugins/foreman-line/dispatch/src/pmc-launch/catalog-publication-types.ts` and
`plugins/foreman-line/dispatch/tests/pmc-catalog-publication.test.ts`.
Checkpoint P additionally proposes
`plugins/foreman-line/dispatch/src/pmc-launch/catalog-metadata-transport.ts` and
`plugins/foreman-line/dispatch/tests/pmc-catalog-metadata-transport.test.ts`.
These five P paths freeze proposed publisher/types/fixed-transport ownership;
checkpoint N owns the raw response profile and materialization types. No barrel
change or generic injected production fetch is proposed. Independent review and
an explicit implementation amendment remain necessary before either checkpoint;
the named future paths grant no runtime write authority in this shaping release.

## Verification Plan

For this release run frozen spec-linter, required-body/local-link checks and
git diff --check; confirm exactly two changed files. Future implementation runs
each affected package's existing test/typecheck/lint and actual audit checks,
with isolated network-incapable tests and independent source review.
Reviewers must ask: can a task choose acquisition authority? Can old artifact
labels or a digest fabricate freshness/custody? Is complete absence confined to
the exact text-response domain? Can CAS/cancellation/restart resurrect authority?
Does synchronous C acquisition gain unrelated claims or hidden network work?
Do both candidate variants share atomic generation invalidation? Can an incomplete
row enter the absent set or a failed episode quietly reuse old positive data?
Can equal identity/generation values let one registered scope's absence handle
verify for another scope under the same owner?

## Checkpoint N implementation release — 2026-09-26

Root accepts the builder's genuine final Step0 atdd0425852c0b7d5a2af9660aa1fe992c27da5599.
Amended design8dca233 has two independent approvals and delegated ratification.
Exactly the four checkpoint N source/test/fixture/report paths above are released;
this supersedes prior docs-only wording solely for checkpoint N. Checkpoint P and
all production acquisition/activation remain unreleased.

Module-local exports are MaterializerInputV1, MaterializerInventoryRowV1,
MaterializerRefusalCodeV1, MaterializerResultV1 and
materializePublicModelResponseV1(input:unknown):MaterializerResultV1. They implement
the existing reviewed closed unions and actual owner types; no barrel expansion.
Use explicit UTF-8 parser mode and shared pure price/effort helpers while preserving
legacy default UTF-16 behavior, retained v2 none-to-off mapping, old public API and
byte-pinned canonical outputs. No copied reader, price arithmetic or fabricated
historical validation objects. Literal independently authored expected bytes,
source references, rates, effort maps and exact full scopes precede code.

Preserve genuine RED/GREEN, full routing regression/typecheck/lint and actual
reader/adapter compatibility plus hostile/limit/refusal controls. No dependencies,
network/provider/Pi/credential/configuration effects. Freeze a clean exact-scope
source/report commit and stop for two independent source reviews; combined main
integration and remote checks still precede merge. Fixtures and digests remain
evidence only, never production custody or live endpoint compatibility.

## Checkpoint N combined string-budget clarification — 2026-09-26

Root review of frozen source7c9003a identified an ambiguity in the structured
capture limit. The 1 MiB UTF-8 aggregate is ONE per materializer invocation; scope
capture and response parsing do not each replenish it. This is bounded accounting
clarification, not a claim that the existing separate limits are unbounded.

Charge the decoded UTF-8 byte lengths of all closed MaterializerInputV1 object
keys, its profile/endpoint/domain and three timestamp string values, and each
expanded requested identity's provider/id keys and string values. Repeated values
are charged at every occurrence. Arrays do not add string index keys; booleans,
numbers and structural JSON punctuation do not count toward this STRING budget.
The bytes field's key is charged, but the raw byte buffer uses its separate8MiB
limit. Seed raw response parsing with the already charged capture total, then
charge every decoded response object key and string value to the same counter.
Exact1,048,576 combined bytes is allowed, one more returns BOUNDS_REFUSED before
retaining the excess decoded string. Existing per-string, depth/value, scope,
body and schema limits still apply independently. Output copies/canonical artifacts
retain their separate reviewed limits; they are not a second source-capture pass.

Preserve the historical parser's default UTF-16 accounting and retained producer
API/bytes. A narrowly scoped helper parameter may supply the initial raw UTF-8
counter; no global mutable budget or duplicated parser. Tests must independently
calculate closed-input overhead and pair exact/one-over combined scope+response
cases, including two individually sub-limit captures whose sum exceeds1MiB.
Existing tests that permit a full1MiB scope plus additional response strings must
change to assert the combined bound, rather than preserving that interpretation.

This paragraph records the root decision. Runtime repair remains stopped pending
the builder's genuine read-only repair Step0 and an explicit repair release.
Two independent final source reviews and combined integration remain required.