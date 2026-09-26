# RCM publication prerequisite shaping

Draft only; no implementation or provider call. Base
`45b50e66be7d3a4a29519063aeae87c1270ce8b8`, isolated branch
`codex/hro-rcm-publication-shaping-20260926`.

## Inspected source and decisions

Actual producer blob `20af5e8f3fc0c857ce5569ebdcb28ad504c0aed8` and adapter blob
`39347c4018a3dbf1c0cd9abf0a6e2e9da262bdf8` are unchanged. Accepted C bootstrap
design/release inspected at `c55bd6d960e92ddefe1c321c9ff79ba0d8aa6759`; its acquire
is synchronous and includes authority beyond catalog facts. P4A repaired base
requires authentic complete scoped absence and distinguishes B1 terminal reopen
from broker restart refusal. This prerequisite does not alter those owners.

The existing producer only validates retained manifest/projection artifacts.
Its historical filename/baseline/refusal-binding checks cannot honestly describe
arbitrary fresh fetches. Root therefore selected an additive versioned raw-response
materializer in the existing RCM owner, preserving the retained API and its
evidenceOnly result. New artifacts must derive from freshly captured bytes with
original acquisition time and separately installed profile authority, not edited
historical labels or self-asserted acceptance pins.

Root also selected private single-process bounded immutable generations with
atomic pointer CAS. No durable publication store is proposed. Restart discards
publisher authority; durable workflow admission remains another prerequisite.
An empty restarted cache does not create a fresh recovery budget.

## Official documentation observation

Read the [official models reference](https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties)
on 2026-09-26. It documents GET /api/v1/models, full-list behavior when offset and
limit are omitted, and default text output filtering. Its authentication section
lists bearer authorization. The retained source observation recorded credential-free
success; neither source is a guarantee of current public availability. Root permits
a later genuine installed credential-free attempt, refusing actual authentication
requirements/errors without reading keys. No endpoint was called in this task.

The proposed fixed no-query acquisition is consequently scoped to public text
metadata. It cannot establish provider-wide, account-specific or nontext absence.
Complete body receipt plus reviewed domain/schema validation is required; partial,
ambiguous, continued or changed-domain responses hold without negative evidence.
No follow-up endpoint, pagination, search or arbitrary URL is smuggled into the
single refresh operation. New documentation/profile changes require fresh review.

## Decomposition and limits

The [draft specification](../../specs/active/RCM-HRO-authenticated-catalog-publication.md)
proposes normalization checkpoint N in routing-policy and private publication
checkpoint P in dispatch, each with named future source/test paths. Those paths
are proposals only; the repaired spec freezes private candidate/read/verification
types and fixed terminal transport ownership explicitly. Independent review must
approve that contract and its raw schema/extraction rules before implementation release.
Keep existing canonical validation/decimal conversion under RCM ownership.

Proposed limits align with P4A/producer: 10-second operation, four active fetches,
8 MiB body, 256 requested identities, 10,000 response rows, 128 publication scopes,
one current generation per scope and bounded candidate retention. Original receipt
time caps catalog validity at 24 hours and absence at 30 seconds. A stricter caller
deadline/expiry wins. No queue, redirect, retry, credential fallback or restart
authority exists. Missing quality, billing completeness, account entitlement,
runtime and policy approval remain unknown and continue to block launch.

## Review and handoff

Eight acceptance groups distinguish pure materialization, authentic installed
acquisition, exact-domain absence, CAS races, cancellation, private handles,
restart and C integration. Network-incapable tests cannot establish production
authenticity; enabling genuine metadata acquisition is a separate reviewed claim,
and cannot establish a live inference or complete HRO exit.

Only this note and the draft spec are authorized. Root retains ratification,
independent design reviews and future implementation release. No extra shaping
artifact, source, charter, owner contract, dependency or configuration is changed.

Validation passed under Node 24.19.0: frozen spec-linter from the existing B1
integration checkout with its read-only dependencies, required body sections and
all relative Markdown links. The official documentation link was read directly.
The exact two-file staged diff must pass whitespace checks before local commit.
No runtime tests were claimed for this documentation-only shape.

## Publication variant repair

Catalog and complete-response-with-absence are the only publishing candidates.
Both commit through the same per-scope CAS and invalidate all old positive and
negative handles. An absence candidate retains the full original requested scope
and the exact nonempty set of all genuinely absent identities, including when
other rows have facts or missing required facts. It emits no shrunken canonical
snapshot. Private verifyAbsenceV1 accepts the registered scope handle and checks
exact private registration/handle-to-scope membership before generation or absent
identity membership; equal identity/generation values cannot substitute for scope.
Catalog acquisition on an absence generation holds rather than returning old bytes.

Incomplete-only operations refuse without a new handle. Other authorized callers
may still acquire an unexpired prior generation; the failed recovery episode must
hold and cannot adopt it as refresh success. No global revocation is implied.
The fixed transport and its tests have named future dispatch paths; task URLs,
credentials and generic production fetch injection remain prohibited. Future
runtime Gate 2 and independent review are still required.
Repair validation passed: frozen linter, required body, relative links and diff
whitespace checks. Exactly the same two documents changed; no runtime or endpoint
activity occurred.

Scope-binding repair adds scope:object to AbsenceInput and an explicit paired
same-owner A/B test with identical identity/generation: A's handle verifies for A
and returns SCOPE_REFUSED for B. All other bounds, variant/CAS rules and owner
contracts remain unchanged. No runtime or provider activity is authorized.
Scope-binding validation passed the frozen linter, body, local-link and whitespace
checks with exactly the same two-document envelope.

## R1/R2 operation and completeness repair

Root accepted Step 0 at d0f93082d39067b4c9df63784a53159434e37dc2 and released only
this note and the existing specification. This is a docs-only draft repair;
independent app-PMC/coordinator review and later runtime Gate 2 remain required.
Owner/source pins, retained producer/adapter semantics, scope binding, atomic
catalog/absence generation replacement and production gates are unchanged.

R1 adds closed private registration, single-use request and owner cancellation
ports. Registration owns scope/generation/deadline and reserves one of four slots;
request receives only its opaque operation. A separate exact cancellation identity
is retained by trusted operation ownership, never coalesced waiters. Individual
waiter abandonment does not cancel another waiter or refund P4A participation.
Cancellation/deadline is rechecked after materialization immediately before the
callback-free synchronous CAS for BOTH publishing variants. Late completion cannot
publish; cancellation after acknowledged publication cannot revoke it.

Reclamation is explicit: never-invoked registrations expire/cancel and release
once; running cancelled/timed-out operations retain their slot until actual terminal
transport cleanup acknowledgement. Uncertain cleanup keeps capacity held even
after the bounded caller refusal. Four means actual live plus cleanup-pending work,
not just unresolved promises. Terminal weak identity records prevent replay from
allocating a new slot; timers are cleared and no unbounded strong tombstone list
exists. Fresh registrations never restore an episode's spent participation.

R2 freezes the exact full envelope data/links.next/total_count and requires null
next plus a safe bounded count equal to the entire data array. Every row has a
unique valid id and explicit architecture.output_modalities satisfying the exact
text-token predicate. Unknown/missing whole-response coverage cannot produce a
positive catalog or ABSENCE. Missing facts after proven coverage remain incomplete;
nontext residual modality observations do not acquire capability authority.

The official reference and its embedded OpenAPI were reread on 2026-09-26:
[models reference](https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties).
The schema requires links.next and total_count, whereas the abbreviated example
omits them. The strict proposed profile refuses that abbreviated envelope rather
than inventing a legacy success mode. It may refuse the actual endpoint; production
compatibility is an honest future evidence gate. Documentation retrieval only was
performed, never a metadata/provider API call, credential lookup or live inference.

Paired tests are specified for catalog/absence cancellation, one abandoned waiter
versus a continuing waiter, registered expiry, delayed/uncertain cleanup, stale
capability replay, exact complete envelopes and every missing/ambiguous coverage
case. Pure materialization remains evidenceOnly, and true custody remains private.
No quality, account billing, entitlement, authorization or live HRO claim is made.

Validation: frozen donor frontmatter lint, required sections, local links and
exact two-document whitespace/diff checks. Runtime tests remain future acceptance
requirements; no runtime implementation is authorized by this handoff.
## Terminal cleanup acknowledgement clarification

Root accepted read-only Step 0 at d8b26d57085c8e4381d049b9dbaaef108dd716bf and
released exactly these two documents for the remaining R1 clarification. The
original readMetadataV1 promise now explicitly acknowledges terminal cleanup on
BOTH fulfillment and rejection. No new interface or runtime edit is introduced.

The original promise cannot settle while owned request/socket/body-reader/I/O
work remains active. Error/abort/destroy/timer notification is not conclusive close.
Success, HTTP/parse/bounds failure, cancellation and timeout all observe actual
terminal cleanup before original settlement. No-created-transport paths may settle
once absence of owned I/O is conclusive.

A separate outward cancellation/deadline race preserves bounded caller refusal;
it is never cleanup acknowledgement. Uncertain cleanup leaves the original promise
pending and slot occupied. Later original settlement releases the slot once without
overriding the latched refusal or publishing. Normal completion retains capacity
through synchronous candidate processing. The original rejection is observed
immediately, avoiding abandoned/unhandled promise failures.

Actual-adapter offline tests must delay close after outward refusal, demonstrate
an unsettled original promise and fifth-operation capacity refusal, then acknowledge
close and release exactly once. Paired success/rejection/cancel/timeout and duplicate
close/error controls prove the event path, not an unrelated fake promise. All other
bounds, source pins, scope/generation rules, completeness predicates and production
gates remain unchanged. Frozen lint/body/link/whitespace checks precede handoff;
fresh app-PMC/root review remains required. No runtime or provider effect occurred.

## Checkpoint N concrete materializer disposition

Read-only Step0 at c4f1e22b0d15f53b0ac600b940748225d54cf720 inspected the actual
producer, canonical reader, adapter and retained producer tests. Root released
only this note and the existing publication spec to freeze the remaining N details.
No runtime implementation, dependency setup, endpoint/Pi/configuration call or
production authority follows from this amendment.

The exact future N envelope is existing public-observation-producer.ts and its
existing test, new tests/fixtures/public-model-response-v1.json under routing-policy,
and docs/goals/hybrid-routing-optimization/hro-rcm-materializer-verification.md.
No barrel, reader, adapter, retained evidence, dependency or publisher changes.
Two independent amended-design reviews and explicit root release precede coding.

New AcceptedCatalogSource uses profileId openrouter-public-text-materialization,
profileVersion v1, sourceEvidenceRef/sourceRef exactly
`openrouter-public-text-materialization/v1:sha256:` plus lowercase raw SHA-256,
sourceEvidenceSha256 of those raw bytes, canonicalSha256 of actual canonical bytes,
and the full requested scope. Provider checkedAtUtc is completeReceivedAtUtc.
The publisher retains actual raw bytes unchanged; pure results gain no new keys.
Exact index-based JSON Pointers in the spec bind each projected observation back
to those bytes. No synthetic historical manifest or self-authenticating hash.

The new raw profile intentionally never maps none to off. It accepts only unique
known supported_efforts and requires a positive max/xhigh/high/medium/low effort;
observed positive levels map identically. None survives only in retained raw
evidence. None-only/missing/empty/malformed/duplicate/unknown effort observations
are incomplete, not reasoning:false. There is no reviewed general mandatory-off
signal, so no invented boolean or guessed mandatory field. Old retained v2 mapping,
historical fixtures and canonical bytes remain unchanged, including none-to-off.

Missing/malformed non-domain required facts are incomplete; unsupported requested
provider is PROFILE_REFUSED; malformed coverage is COMPLETENESS_UNPROVEN for both
variants. The reviewed InventoryRow union stays closed. New parsing uses explicit
UTF-8 string limits while retained parsing preserves UTF-16 behavior. Pure price
and effort helpers may be shared only without changing old semantics. Raw request
fees and extra observed rates remain evidence, never implied zero or complete
account tariff. Actual sole-reader and adapter tests prove representation
compatibility; they cannot prove production acquisition or endpoint compatibility.

Future RED/GREEN covers paired full-envelope variants, independent coverage and
binding mutations, unknown facts, decimal/effort mapping, hostile inputs and exact
bounds. Full routing tests/typecheck/lint and retained-output checks remain future
runtime acceptance. This amendment is checked by frozen linter, body/local links,
exact two-document whitespace/scope checks and a clean local handoff commit.

## Checkpoint N amended-design acceptance — 2026-09-26

Full publication designc4f1e22 received independent coordinator/PMC approvals and
ratificationf2dcb7c in its retained shaping checkout. Coordinator and independent
reviewer D now APPROVE the concrete checkpoint N amendment8dca233ce21d9083cc0368cabff5b7104d932f85.
The source binding, raw-byte retention, positive-only effort map, typed refusal
categories and explicit UTF-8 mode fit the actual sole reader/adapter/producer.
Old retained v2 semantics and byte-pinned output remain mandatory invariants.
Frozen lint/link/diff checks pass; no remaining design finding.

Root ratifies that deliberate narrower new profile and the exact four-file N
runtime/report envelope under delegated prerequisite authority. This is design
acceptance; builder must restate the final amended source plan and stop for explicit
runtime release. Checkpoint P transport/publication, live endpoint compatibility,
authentic production acquisition and all downstream launch evidence remain separate.

## Checkpoint P construction amendment

Root accepted the genuine read-only P Step0 at
c96569e9b8695a4cdfb120110f95cc45f582bde2 and released exactly this note and the
existing active publication spec for construction shaping. No runtime release,
provider/Pi/configuration attempt, installation or production activation follows.
The existing c4f1e22 publication protocol and N8dca233 materializer decisions remain.

Actual inspected pins, recorded for this shaping checkpoint only:

| Source | Frozen reference |
|---|---|
| Retained RCM producer | blob20af5e8f3fc0c857ce5569ebdcb28ad504c0aed8 |
| Sole canonical reader | blob4806f5b5af32d4a40526ab7125c31205c2b9fb6a |
| RCM adapter | blob39347c4018a3dbf1c0cd9abf0a6e2e9da262bdf8 |
| Accepted C controller at93f8021 | blobdc2a3c0e8c83eb05c66757731a043c4da76d5145 |
| C controller types at93f8021 | blob92030ddadf31e53052442be0511ff27de8e04702 |
| P4A1 ratified design | commit48aab911484722a47ea2291e8a26fdb9fafd904f; spec blob0c030a65503c19d11be4f1ceece184b15afc7b8f |

N runtime exports and C implementation are absent from P's starting checkout.
Accepted N source and accepted C integration must arrive before P implementation.
P4A1 deliberately has no successful production constructor or portable admission
verifier. Therefore this P slice cannot manufacture genuine production installation
or workflow admission from a supplied claim, profile label, hash or fixture callback.

Root accepted the following concrete construction dispositions, now frozen in the
spec for independent review:

- createProductionCatalogPublicationOwnerV1 unconditionally returns
  INSTALLATION_REFUSED with zero input reads or effects. A distinct
  createOfflineCatalogPublicationOwnerV1 captures only the closed fixture record
  and closed offline runtime; no mode flag or generic production fetch exists.
- The fixture record predeclares1..128 immutable scopes. Scope registration accepts
  only {scopeId}, returns one private identity, and rejects repeat/unknown IDs.
  Identical scope contents still produce distinct scope identities. Scope fields
  cannot expand profile, endpoint, identities, workflow or policy expiry.
- Exactly six named owner methods: registerCatalogScopeV1,
  registerRefreshOperationV1, requestCatalogRefreshV1, cancelRefreshOperationV1,
  acquirePublishedCatalogV1 and verifyAbsenceV1. Existing result unions are unchanged.
- Captured readClock/scheduleWake/clearWake and one offline requestDriver are the
  entire runtime record. Clock readings are closed UTC/monotonic pairs with explicit
  validation/rollback refusal; timer handles stay opaque. Trusted clock reads may
  occur during synchronous acquisition; task callbacks may not. Terminal outcomes
  cannot be rewritten by timer teardown failure or stale wakeups.
- The closed low-level driver supplies request controls and socket/response/body/
  error/close events to the actual shared transport state machine. It cannot return
  publisher success or a separately resolved cleanup promise. P delivers the actual native
  bridge statically binds node:https, checks real response completeness and owns
  destruction; fixtures are not cast as genuine Node requests/sockets.
- Fixed request means only the reviewed no-query credential-free GET, fixed explicit
  headers, no agent pool/reuse, TLS verification and16KiB native header cap. Bounded
  retained header fields are separately limited. The transport owns header/framing/
  UTF-8 errors; N remains the sole raw JSON/profile materializer after transport
  cleanup. N refusal cannot retroactively change the original transport promise.
- Existing typed refusal mapping is explicit. No new public code, data key, authority
  issuer or admission bridge is introduced. Offline capabilities never establish
  operational workflow admission, production source custody or C production authority.

The original cancellation/CAS/four-slot protocol remains: registration owns capacity,
only one invocation, outward timeout/refusal is distinct from original transport
settlement, and uncertain cleanup holds capacity. Both catalog and absence candidates
share one generation CAS and invalidate old variant handles. SourceRef/raw retention,
N's exact result/schema/effort/refusal semantics, scope completeness and30-second
absence versus24-hour catalog maximum validity remain unchanged.

Six future P source/test/report paths are now proposed, all under plugins/foreman-line:

1. dispatch/src/pmc-launch/catalog-publication.ts
2. dispatch/src/pmc-launch/catalog-publication-types.ts
3. dispatch/src/pmc-launch/catalog-metadata-transport.ts
4. dispatch/tests/pmc-catalog-publication.test.ts
5. dispatch/tests/pmc-catalog-metadata-transport.test.ts
6. docs/goals/hybrid-routing-optimization/hro-rcm-publication-verification.md

No existing owner/runtime/barrel/dependency/audit change is authorized by that future
envelope. A genuine reader/audit enrollment discovered later remains separately scoped.
Future paired controls use actual N/reader/adapter/C after prerequisite integration,
network-incapable low-level events for cleanup, both catalog/absence variants,
retained four-slot capacity until close, UTC/monotonic/timer faults, exact header/body/
capture boundaries, scope identity and zero-effect production refusal. No fake body
result or independent finished promise can prove transport cleanup or live authority.

This amendment itself runs only frozen spec lint, required sections/local links,
whitespace/scope/source-preservation checks and a clean two-document commit. Two
independent reviews and explicit P implementation release remain required.
P construction amendment checks (docs only): frozen spec-linter native exit0;
all7 required body sections present; all9 local Markdown links resolve;
git diff --check passes; exactly the two authorized documents changed. These are
advisory shaping checks, not implementation or production acceptance. The explicit
two-document amendment envelope excludes any new ShapingResult/receipt artifact.

### P native bridge correction

P must implement the actual statically wired Node HTTPS bridge and shared engine,
not defer bridge delivery until activation. The transport module exports internal
createFixedMetadataTransportV1() and createOfflineMetadataTransportV1(runtime:unknown)
with exact signatures frozen in the spec; the existing type module owns their closed
types. Native translator/shared engine remain unexported. The fixed factory captures
native clocks/timers and static HTTPS request, accepts no substitutions and performs
no I/O during construction. The offline owner uses only the separate offline factory.
Production owner construction remains unconditional zero-input/effect
INSTALLATION_REFUSED. Six future files, seven-key success and readMetadataV1 signature
remain unchanged; no barrel, generic fetch, test mode or dependency is introduced.

Guarded isolated-child tests in the existing transport test file must intercept the
Node request boundary before importing the actual bridge and guard all native network
entry points. Synthetic request/response/socket events exercise actual listeners,
fixed fields, complete-property checks, owned destruction and original-promise
fulfillment/rejection cleanup. Offline-driver tests alone are insufficient. These
tests authorize no endpoint calls and establish no live TLS or installation custody.

Pinned local Node24.19.0 net source SHA-256 is
eba05bb24bdd1e208632a1df0fdeeb8e4bdf6ffc062cb19e92f0e7a8c37f60af.
lookupAndConnectMultiple can return before emitting lookup after early destruction;
socket close does not prove its uncancellable lookup has finished. Keep default
native selection and no custom lookup. Add only socketConnected to the finite event
interface, emitted from actual owned socket connect. After request creation, require
observed connection plus all existing close acknowledgements before original-promise
settlement. Failed lookup/connect without this event conservatively holds capacity
indefinitely, even after close; outward refusal remains bounded, with no reset or
eviction. Paired native/shared controls prove normal connected cleanup versus early
close without connection and no forged completion from late lookup/error events.

The correction is docs only and requires fresh independent reviews. Accepted N/C
integration and explicit P runtime release remain prerequisites.

## Checkpoint P construction ratification — 2026-09-26

Root and independent frontier A approve final construction amendment773daa5c947f4e9dde10f0ae1b5c0a1552ac9499.
Both inspected the actual Node24.19 net behavior supporting the conservative
connection-plus-close cleanup rule. Fixed native HTTPS bridge delivery and guarded
native-listener tests are part of checkpoint P; production owner construction still
refuses unconditionally. Missing observed connection can retain a slot indefinitely;
outward refusal remains bounded and no reset creates replacement capacity.

All original response completeness, exact scope, generation CAS, cancellation,
raw-byte/source/profile binding and separate authenticity requirements remain.
This records delegated design ratification, not P runtime implementation release.
Accepted N/C source must first be integrated; a fresh actual-source Step0 must
verify concrete N imports, reader/adapter/C composition and source/test envelope.
Exactly six future P paths remain proposed. Actual endpoint compatibility, production
admission/profile custody, account/quality/billing/budget claims and HRO live exit
remain separate. No endpoint/inference, credential or host configuration action.

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

## Accepted prerequisite integration and fresh Step0

Checkpoint N is accepted through PR67 main98bf162adef813d8557e22a78d0b904593009173
(all12 exact-head checks passed). P checkout ce0ad76 contains that main merge and
N closure4477c0a. Frontier D completed a genuine read-only Step0 at9d3ba8d before
those ancestry/docs-only merges: no blocking source-contract mismatch. N producer
blobc9a8be0b9d25f983687a7c3e696093bf8ab8cbbf matches approved3a976f0; reader4806f5b,
adapter39347c4, Ccontrollerdc2a3c0 and Ctypes92030dd match accepted sources.
The exact six proposed P source/test/report paths remain unchanged. Root supplied
19 absent same-package dependency junctions only after lock hash equality with
E1 donor; no installs or donor writes. Native/shared transport and actual N/reader/
adapter/C offline composition remain mandatory. P is ready for the next frontier
builder's actual-source handoff and explicit runtime release; none is implied by
this readiness record. D is completing the separately authorized transport parcel.
