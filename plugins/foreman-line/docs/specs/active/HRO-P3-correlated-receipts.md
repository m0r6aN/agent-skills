---
ticket: HRO-P3
title: Correlate governed routing observations at existing receipt checkpoints
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
risk: elevated
surfaces:
  - plugins/foreman-line/dispatch/
  - plugins/foreman-line/verification/
  - plugins/foreman-line/docs/goals/hybrid-routing-optimization/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Define the smallest truthful HRO-P3 observation and receipt integration. Capture
each fresh routing decision and governed attempt separately, preserve actual
settlement evidence, and publish a bounded measurement claim only at a legitimate
existing parcel checkpoint. Reuse ReceiptDocument and PMC money custody. A route
decision, observation, aggregate or receipt confers no execution authority.

This is a design umbrella with two proposed implementation slices, not one broad
runtime release. It does not complete D5 for standalone CLI calls or crashes.
Those gaps remain explicit prerequisite decisions rather than omitted events.

## Constraints

**DRAFT, NONDISPATCHABLE.** Coordinator authorization covers only this document
and the companion shaping notes. Independent design review, owner decisions,
exact predecessor reconciliation and Gate 2 must precede either implementation
slice. No ShapingResult, charter change, production store or runtime is created.
Standing constraints apply. Proposed names below do not assert existing APIs.

Base: accepted main `2eb994b4dca3e0d1220953c30d1a64d0e5bdfc37`.
C/D contracts inspected at `a44ecec91097783730cce85ca4b103fbbbfc2fd2` are reviewed
drafts, not implemented dependencies. The coordinator reports the explicitly
reviewed cache amendment `e5ae1c3848544aeb08992a8607cb7c67bb548858` ratified;
its charter reconciliation remains separate. Initial choice caching is disabled:
zero lookup/hit/miss/write events. Compiled-schema reuse is not choice reuse.
D8 refresh coalescing and negative caching remain required in their later owner
scope; provider-cache token usage is a third, distinct concept.

### Actual seams and placement

ReceiptDocument has only stage/claim kinds, stages A-F, existing CorrelationContext,
sequence, prevHash, timestamp, subjectKind/subject and hash. Subject is validated
by its producer, not the envelope schema. Keep that envelope/schema unchanged.
Use approval's existing canonicalize/sha256Hex and receipts' receiptPath and
validateReceiptDocument; do not invent canonicalization or signatures.

Current dispatch writes sequence-2 DispatchOrder. Verification's
executeBuildResult path requires that exact dispatch hash to remain the on-disk
tip before appending BuildResult. Therefore never insert a telemetry receipt
between DispatchOrder and BuildResult. Never append after a sealing ClosureRecord,
replace an existing stage receipt, allocate an alternate sequence namespace, or
mint a fake workflow/genesis/claim to make a CLI invocation fit the chain.

Proposed canonical location: one real Stage-D measurement claim immediately after
the acknowledged BuildResult and before verification claims begin. Proposed
subjectKind is `RoutingTelemetry`; claimRef must identify a measurement claim
actually declared by the governing parcel and approved by the verification owner.
The literal name alone is not a claim declaration or permission. A workflow
without that declaration has no such checkpoint. The new receipt inherits the
actual workflow/correlation; session/run identity follows the existing writer's
execution semantics. Event-level invocation identity is retained independently.

All subsequent existing writers must continue from the new tip. Preserve the
BuildResult dispatch-tip guard. Freeze an integration test through actual
BuildResult, telemetry, verification, integration and sealing before adopting
this placement. A structurally valid envelope alone proves neither hash integrity
nor compatibility with downstream stage-specific consumers.

### Split implementation contracts

| Slice | Owns | Dependency and limit |
|---|---|---|
| P3 capture | Private C/D observation projection, bounded in-memory collection, deterministic report | Accepted C/D source and internal-hook amendment; usable offline with actual predecessor results. No durable-publication claim. |
| P3 checkpoint | Producer-validated subject and serialized canonical receipt publication | Capture plus verification-owner claim/placement and writer-custody decisions. A real eligible parcel checkpoint is mandatory. |

The PMC governed CLI may execute independently of any parcel BuildResult flow.
Such an invocation still receives a distinct observation/invocation identity,
but cannot be published as this canonical receipt. Its collection is marked
`unpublished-no-checkpoint`; it may return a bounded audit-only report through an
approved caller seam, never an invented ReceiptRef. No automatic later attachment
to an unrelated parcel is permitted. If the process exits before publication,
in-memory evidence is lost and cannot be reconstructed from silence.

This partial slice cannot satisfy universal D5 event retention. Before production
adoption, owners must either require a legitimate checkpoint-capable parcel
context for the measured use case, or separately approve durable non-parcel
observation custody and its mapping to the existing receipt owner. This document
does not choose a second chain, sidecar journal, ledger export or new public API.
Standalone execution itself remains governed by C/D/E; telemetry incompleteness
does not authorize, retry or cancel it.

### Private capture and correlation proposal

Installation privately creates a collector and wires owner-held callbacks. No
caller-supplied accepted tag, observer object, event JSON or public telemetry
constructor can impersonate authenticated C/D/ledger observations. Capture
closed data with typed refusal, owned immutable copies and exact bounded enums.
Callback effects may observe only; they cannot call reserve/consume/settle/send.
Keep the existing mandatory C audit/authentication gates intact: this optional
measurement observer neither replaces them nor changes their failure semantics.

Allocate one invocation ID before the private controller invocation. Each fresh
resolver call has its own decision occurrence. Correlate known requestId and
requestDigest, intentRef/episode and declared attempt ordinal, selected binding,
ledgerId/epoch/scope and proofRef/digest only when the respective owner provides
them. Preflight refusals can have no accepted request identity; retain invocation
identity and typed refusal rather than fabricate a request digest. Existing
CorrelationContext is copied only when supplied by the authentic parcel caller;
standalone observations carry null parcel correlation, not random workflow IDs.

Proposed event vocabulary is a closed subject-internal union, not a new receipt
primitive or event bus: decision, attempt-reserved, attempt-consumed,
transport-terminal, settlement, custody-terminal. A decision includes typed
selection/refusal and declared fallback relationship, not a launch assertion.
Fallback R2 has its own request/decision/attempt and references R1; it is not a
duplicate event or replay of R1. Recommendation state is disabled with zero calls.
No recommendation result or estimated charge is fabricated. Future recommendation
or choice/negative-cache events require separately reviewed enabled owners.

C publishes selection/refusal after its actual resolver returns; transition
events use acknowledged real ledger return values, and custody-terminal follows
actual B1 completion. D publishes one final bounded observation after its private
proof is authenticated by the existing composition, never raw stream chunks.
The telemetry view joins observations by exact owner/request identity; it cannot
authorize reconciliation. A lost ledger acknowledgement means unknown transition
status in telemetry, not confirmed cancellation or absence of liability.

Owner-approved private projections must add usage/timing/identity observations:
existing LaunchReceiptV1 omits these, and D's closed Observation omits usage and
latency. Keep public LaunchReceiptV1 unchanged. Requested, selected, sent and
provider-declared served identities are separate nullable fields with provenance;
do not relabel selected identity as authenticated served identity. Unknown usage
counts, including provider-cache hits/misses, stay unknown. Durations use a trusted
monotonic clock around named boundaries; UTC timestamps are correlation, not a
substitute for elapsed-time measurement. Refused-before-send is not API success.

Deduplication uses a collector-minted occurrence key for callback delivery plus
the exact owner transition identity for settlement. Same key/same canonical
content is idempotent; same key/different content marks conflict/incomplete and
cannot overwrite earlier content. Separate genuine calls never share occurrence
identity just because request semantics or selected model match. Count decision
invocations, attempted sends, acknowledged transitions and unique settlement
facts separately. Ledger replay of an identical authenticated proof adds no cost.

### Money and report semantics

Use actual PmcCostValueV1/PmcPriceInputV1 for estimates and price provenance;
use acknowledged AttemptV1 for ledger state. Retain USD, source profile/version/
digest, tariff/price evidence digest and estimate method. MaximumMicroUsd is a
reservation bound, never actual spend or a predicted average. Projected and
unit-price ranking values are not interchangeable total-cost estimates.

Actual charge is a union: known integer microUSD from authenticated settlement,
or unknown with bounded reason. No-send/cancelled has actualMicroUsd:null, not
an observed numeric zero. A settled known zero remains known zero. D's fractional
microUSD/raw-cost precision refusal stays unknown; do not round it, use Pi's
numeric estimate, or infer zero from missing receipt/text/timeout. Unknown and
consumed attempts retain liability according to the ledger. BudgetSnapshot
outstandingMicroUsd is reported only from an actual owner snapshot with its time;
telemetry must not manufacture current account balances from partial events.

Unknown-to-known reconciliation counts one final known actual amount per ledger
attempt, retaining both observations in history. An earlier unknown event and
later known event are not two charges. Conflicting known facts are unresolved
evidence, never last-writer-wins. Aggregate with exact integer arithmetic and
typed overflow refusal; no floating currency conversion. Report known actual
subtotal, unresolved attempt count, observed reservation bounds and estimates
separately, with coverage limitations. A subtotal is not total account spend.

### Bounds, privacy and failure behavior

Proposed collector ceilings: 32 invocations, 256 events, 4096 UTF-8 bytes per
encoded event and 524288 bytes for the complete encoded subject. Ordinary text
and IDs <=128 UTF-16 units; digests exactly lowercase 64 hex; depth <=12,
expanded key/value visits <=32768 and arrays <=256 per captured input. A final
subject must fit its aggregate byte cap including metadata. Limits are checked
before allocation/descent where possible; aliases pay expanded cost. No getters,
functions, hidden/symbol properties, cycles, nonfinite numbers or coercion.
These are proposed telemetry limits, not changes to any owner input limits.

On overflow or malformed observer input stop accepting further records, retain
already owned evidence and one fixed incomplete reason. No unbounded dropped
counter, stream buffering or automatic spill. No raw prompts, completions, URLs,
headers, credentials, storage paths, policy/context blobs or cache keys enter the
subject/report. Price source uses approved bounded references/digests. Terminal
rendering is outside this slice; future output must sanitize control characters.

Collection completeness means only all expected observations for explicitly
listed invocations in this process were captured. It never means global account,
workflow or crash completeness. Reports list scope, finalized/pending invocation
counts, evidence mode and capture/publication state. Capture loss, pending attempt,
missing checkpoint, write failure and uncertain publication remain distinguishable.
No post-crash empty collector may assert zero prior invocations or charges.

### Receipt publication and concurrency decision

Publication is a coordinator-controlled checkpoint operation, not a C/D callback.
It accepts only a finished bounded collection and a real approved claim context,
checks that the current valid chain tip is the expected BuildResult, allocates
next sequence from disk, hashes/validates the subject and envelope, and publishes
exact bytes at receiptPath. No arbitrary caller locator/root or receipt body.
No signing claim: signature remains null. Re-read the published bytes and verify
the expected canonical hash before acknowledging success.

The current writeReceiptDocument overwrites, and allocateSequence is a read, not
an atomic reservation. Do not call this combination concurrently and claim safety.
Proposed restricted first adoption requires coordinator-owned exclusive workflow
writer custody spanning tip check through publication, with all other stage
writers quiescent. A caller boolean or a lock ignored by existing writers is
insufficient. The verification owner must freeze how installation establishes
that custody; absent such a mechanism publication refuses. If concurrent writers
are required, a separately scoped shared append primitive/adoption is prerequisite.

The bounded writer must use exclusive creation, typed I/O handling and no-overwrite
collision checks; identical previously published bytes can acknowledge replay
only after complete validation. Different bytes, partial files, unknown write
acknowledgement or changed tip hold publication; no overwrite, renumber/retry,
repair or chain fork. There is no two-store atomicity or fsync durability claim.
Telemetry publication failure never resends, refunds or changes owner settlement.
The existing workflow may be held for missing required measurement evidence;
that is separate from provider execution outcome.

## Acceptance Criteria

1. Pin accepted owner inputs and private-hook contract. Actual resolver refusal/
   selection and actual temporary ledger reserve/consume/settle/cancel outputs
   produce bounded audit-only records; injected facts alone are labeled synthetic.
2. Initial mode has zero choice-cache and recommendation calls/events. Repeated
   identical choices still yield distinct decision/invocation counts. Preserve
   deferred negative-cache obligation without pretending it is implemented.
3. A known charge, known zero, no-send null, unknown charge, fractional precision
   unknown and unknown-to-known settlement yield exact separate totals/states.
   Duplicate proof replay adds zero new charge; a genuine second attempt counts.
4. Each structural/boundary violation is independently refused at its intended
   gate. Exercise every cap at/over, aliases, observer throw/reentrancy, mutation,
   overflow, conflict and missing final observations without authority effects.
5. Real A/C/BuildResult/D/E/F receipt fixtures traverse existing validators and
   stage consumers; verify hashes using existing canonicalizer, not structural
   chain validation alone. C-to-BuildResult guard still fails unauthorized insertion.
6. Real checkpoint publication tests cover stale tip, sealed chain, undeclared
   claim, wrong correlation, missing custody, concurrent writer refusal, same-byte
   replay, conflict, partial write and lost acknowledgement. No chain fork/overwrite.
7. Standalone CLI, pre-BuildResult failure and process crash controls cannot create
   fake workflows/claims or report complete durable coverage. Missing observations
   remain explicit gaps, never inferred zero calls/charges or success.
8. A baseline report enumerates workload, mode, invocation/attempt denominators,
   observation window, actual/estimated/unknown values, quality and latency scope.
   Offline fixtures prove arithmetic/association only, not savings or live behavior.

## Out of Scope

Provider calls, billing activation, credentials/configuration, choice caching,
recommendation execution, negative-cache implementation, changing resolver gates,
new ledger exports, a second ledger/event bus, autonomous crash recovery, receipt
schema primitives, generic concurrent append migration and standalone durable
receipt custody. D5/full HRO completion is not awarded by this partial slice.

## Context & References

- [Shaping evidence and pending decisions](../../goals/hybrid-routing-optimization/hro-p3-telemetry-shaping.md)
- [Charter D5/P3 and live exit](../../goals/hybrid-routing-optimization/charter.md)
- [Receipt shape](../../../receipts/src/types.ts)
- [Receipt schema](../../../receipts/src/schemas.ts)
- [Verification checkpoint and writers](../../../verification/src/harness/index.ts)
- [Existing chain walker](../../../verification/src/chainwalk/index.ts)
- [Ledger authority](../../../dispatch/src/pmc-launch/ledger.ts)
- [Money provenance](../../../dispatch/src/pmc-launch/money.ts)
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md)

## Allowed Files

Current authorization: only this draft and its companion notes. Future candidate
envelopes are proposals, require separate owner release and cannot be combined
silently into an unbounded parcel:

- Capture: new dispatch/src/pmc-launch/telemetry.ts and
  dispatch/tests/pmc-telemetry.test.ts, plus exactly named accepted C/D internal
  implementation hook files/tests. Their source does not yet exist at this base;
  those paths must be frozen after acceptance before any capture dispatch.
- Checkpoint: new verification/src/harness/routing-telemetry.ts and
  verification/tests/routing-telemetry.test.ts; verification/src/harness/index.ts
  and verification/tests/chainwalk.test.ts only for reviewed checkpoint adoption.
  Existing integration/tests/closure.test.ts verifies continuation/sealing.
- Report: docs/goals/hybrid-routing-optimization/hro-p3-baseline.md after evidence.

No receipt outer schema/generated schema, contracts, ledger/money source, public
launch receipt, dependency/manifest, registry or charter change is authorized here.
If shared writer custody or real claim declaration needs other source/schema
changes, shape a separate exact prerequisite rather than expanding these lists.

## Verification Plan

Use existing Node 24.19.0 and matched-lock dependencies; no install. Future builds
run each affected package's `node node_modules/tsx/dist/cli.mjs --test tests/*.test.ts`,
`node node_modules/typescript/bin/tsc --noEmit`, and
`node node_modules/@biomejs/biome/bin/biome check .`, checking each native exit.
Use actual temporary SQLite and real chain modules, never production stores.
Review privacy projections and zero-effect failures independently. Two frontier
design reviews and exact Gate-2 release precede implementation; two independent
source reviews and integration/remote checks follow. Live P6 requires separately
authorized provider evidence, truthful billing bounds and controlled budget.

## Readiness

Not ready to dispatch. Decisions P3-D1 through P3-D5 in the companion notes are
unratified. Accepted C/D/E hooks, checkpoint writer custody and declared claim
semantics are absent. Standalone/crash durable capture remains an explicit D5
gap. No offline result may substitute for those dependencies or actual live proof.
