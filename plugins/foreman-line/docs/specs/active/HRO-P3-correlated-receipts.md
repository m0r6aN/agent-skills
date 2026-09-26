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

This is a design umbrella with separately released owner prerequisites, not one
broad runtime release. Initial production/measurement is restricted to legitimate
checkpoint-capable Foreman parcels. Standalone production activation remains held
before effects until a separate telemetry contract is reviewed. Lost capture
blocks measured success/savings; universal crash-event reconstruction is not a
prerequisite for delivering this restricted workflow safely.

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

Proposed canonical location: one real Stage-D measurement claim AFTER all measured
invocations and verification checks, BEFORE finalized Stage-D stage handoff to E.
Close launch admission first; later measured launches require a new reviewed scope.
Proposed
subjectKind is `RoutingTelemetry`; claimRef must identify a measurement claim
actually declared by the governing parcel and approved by the verification owner.
The literal name alone is not a claim declaration or permission. A workflow
without that declaration has no such checkpoint. The new receipt inherits the
actual workflow/correlation; session/run identity follows the existing writer's
execution semantics. Event-level invocation identity is retained independently.

Preserve the BuildResult dispatch-tip guard. runHarness awaits matrix callbacks
before writing claims (harness/index.ts:719-739), so capture remains active through
these and any admitted adversarial/review calls. E/F continuation after publication
must perform no model invocation in this measured scope. A structurally valid
envelope proves neither canonical hash integrity nor stage-consumer compatibility.

Concrete missing predecessor: emitVerificationVerdict (pipeline/index.ts:801-941)
writes a kind:'claim' VerificationVerdict and StageOutput envelope. It does NOT
produce kind:'stage', stage:'D' finalization. No such aggregation function exists
on this verification path. Do not relabel that claim or invent an existing API.

The reviewed [P3A owner contract](HRO-P3A-authenticated-stage-d-finalization.md)
proposes private synchronous `finalizeMeasuredStageDV1(session: object): FinalizationV1`
after asynchronous drain and telemetry publication have completed. Session identity
resolves installation custody; caller fields supply no authority. It binds the
complete expected verification/review/disposition plan, real build/head, actual
verdict/envelope, authorized decision under existing delegation, owner closure,
measurement claim, current tip and external denominator. It recomputes content
hashes and validates full linkage; self-hashes do not authenticate execution.
Only complete passing evidence can append kind:stage, stage:D, claimRef:null at
tip.sequence+1. No literal-human-only gate or fabricated actor identity is added.

SubjectKind MeasuredVerificationHandoff has exactly version:'hro-measured-d/v1',
verifiedHeadSha, buildReceiptRef, verdictReceiptRef, humanClosureReceiptRef,
telemetryReceiptRef, denominatorDigest, expectedPlanDigest and coverage:'complete'.
Receipt references are closed hash/locator records under P3A refinements. Its
FinalizationV1 is `{ok:true,receipt:ReceiptRef}` or `{ok:false,code:...}` with exactly
SESSION_REFUSED, PHASE_REFUSED, PREREQUISITE_UNAVAILABLE, EVIDENCE_REFUSED,
COVERAGE_INCOMPLETE, CHAIN_REFUSED, WRITE_REFUSED or WRITE_UNCERTAIN.
These remain proposed private contracts, not shipped exports. P3A owns the shared
complete D/E/F lifecycle; P3 owns genuine telemetry seal publication. P3A offline
acceptance is independent; [P3B](HRO-P3B-measured-integration-profile.md) and combined
acceptance own actual P3A-to-E-to-F composition. Missing authentic intake or
installation remains a production refusal, never fixture-derived authority.

Separately amend integration/src/exit-vehicle.ts:278-309: runStageE/F currently
require stage predecessors D at sequence3 and E at sequence4. Preserve the real
runners and PR-head, stage/kind, chain/correlation, filename/sequence, tip and
closure checks. Replace fixed positions ONLY for a validated measured-handoff
profile: E requires the actual final D stage and its referenced pass/telemetry
evidence; F requires the resulting real E stage at the actual tip. No claim is a
stage predecessor. Reject extra/wrong-stage tails, gaps, duplicate stages and
conflicting handoffs. Preserve the historical six-stage path under its existing
contract; do not broadly admit arbitrary longer chains. No lower-level emitter
bypass. Test real BuildResult -> D claims/verdict -> telemetry -> finalized D ->
real E -> real F with canonical hash verification and all negative controls.

### Split implementation contracts

| Slice | Owns | Dependency and limit |
|---|---|---|
| P3 capture/session | Private C/D projections, external denominator, bounded collection and lifecycle | Accepted C/D/E source and installation amendment; no standalone activation. |
| Verification finalization prerequisite | Measurement claim publication and genuine final D stage | Capture/session plus approved claim/subject and writer lifecycle; implementation absent today. |
| Integration continuation prerequisite | Actual-sequence D/E/F with preserved real runners | Accepted final D contract; no raw-emitter bypass. |

PMC CLI shape can exist outside a parcel flow; this release does not activate
that production mode. Missing legitimate admitted workflow/checkpoint returns
typed CHECKPOINT_REQUIRED from the initiating caller before acquisition,
reservation, credential access or send. Offline observations stay synthetic and
unpublished; no invented ReceiptRef or later attachment to an unrelated parcel.

The coordinator declares a bounded external invocation denominator before
admission: approved planned invocation IDs and measured scope, retained outside
the volatile collector by the existing parcel/experiment evidence owner. The
collector cannot author or shrink it. Match identities, not merely counts; report
declared/admitted/refused/completed/missing separately. Every known invocation and
event remains counted. Plan changes require owner approval before admission.
Process loss, missing denominator or missing capture means coverage unproven;
an empty restarted collector cannot attest zero historic calls/charges. Measured
success/savings requires complete coverage and acknowledged publication.

After interruption the legitimate caller may use EXISTING
ledger.snapshot({scopeId}) for scope-level settled/outstanding liabilities, with
ledger/epoch/snapshot digest and observedAtUtc. It does not reconstruct events or
attribute aggregate differences to missing attempts. Shared-scope activity and
non-atomic timing must be disclosed. Snapshot refusal means unknown, not zero.
No new ledger export, second ledger or recovery authority is needed. Universal
crash-event reconstruction is not claimed or required for this restricted release.

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

### Private lifecycle and receipt publication

The installation owns a private session per normalized repository/workflow,
capturing genuine statically imported stage functions and authoritative receipt
references. Its identity registry cannot be reconstructed from caller JSON. No
arbitrary supplied writer callbacks, boolean lock claims or public constructor.
Proposed phases are capturing, draining, publishing, finalized-D, integrated-E,
sealed-F and held. A separate busy flag is set before any admitted writer or
callback and retained across awaits. Concurrent/reentrant entry refuses. Phase
advancement occurs only on acknowledged completion; uncertain writes become held
without automatic retry. All admitted BuildResult, harness/adversarial/verdict,
publication and real E/F writers run through this installation lifecycle.

Writer busy guards stage-writing entry, not passive observation delivery. An
approved verification callback may perform its predeclared governed invocation
while capture is active; its observation only appends bounded collector data and
cannot reenter a stage writer. Track admitted in-flight invocations separately
from writer busy. Draining waits for both the active writer/check and all admitted
invocations to finish; it cannot deadlock by holding a gate needed for their
passive terminal observations. Undeclared invocation IDs refuse before effects.

New governed launch requires capturing phase. Draining closes admission, awaits
all admitted work, verifies the external denominator and freezes the collection;
it cannot run publication while a verification callback can still emit an event.
Any callback after closure marks coverage conflict/held and cannot rewrite frozen
evidence. E/F performs no later measured model calls. Missing session or legitimate
checkpoint refuses production before effects. Installation wiring is a new owner
prerequisite; existing raw exports are not magically locked by these wrappers.

This is cooperative one-writer-process custody only. Other processes and direct
raw-library callers are outside this guarantee; production installation must not
schedule them against this workflow. Unexpected tip changes hold. A lock ignored
by other writers is insufficient. Shared append adoption becomes a separate
prerequisite only if independent concurrent writers are a supported requirement.

Publication is a coordinator-controlled checkpoint operation, not a C/D callback.
It accepts only a finished bounded collection and a real approved claim context,
checks that the current valid chain tip is the expected final Stage-D claim, allocates
next sequence from disk, hashes/validates the subject and envelope, and publishes
exact bytes at receiptPath. No arbitrary caller locator/root or receipt body.
No signing claim: signature remains null. Re-read the published bytes and verify
the expected canonical hash before acknowledging success.

The current writeReceiptDocument overwrites, and allocateSequence is a read, not
an atomic reservation. Do not call this combination concurrently and claim safety.
The private installation lifecycle spans tip check through publication, with all
admitted writers quiescent. Its owner must implement and test that custody; absent
the genuine session publication refuses. This does not establish atomic append
against independent processes or raw writers outside the admitted installation.

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
5. Real A/C/BuildResult/D-claims/verdict/telemetry/finalized-D/E/F fixtures traverse
   actual amended runners. Verify canonical hashes, real verdict envelope and
   handoff references. C-to-BuildResult guard stays intact; raw claim, wrong
   stage/kind, forged pass, wrong PR head, gaps, duplicate stages, correlation fork,
   stale tip and wrong measured profile refuse. Historical path remains valid.
6. Real checkpoint publication tests cover stale tip, sealed chain, undeclared
   claim, wrong correlation, missing custody, concurrent writer refusal, same-byte
   replay, conflict, partial write and lost acknowledgement. No chain fork/overwrite.
7. Standalone production CHECKPOINT_REQUIRED observes zero acquisition/reservation/
   credential/send calls. Pre-BuildResult failure and crash cannot produce fake
   claims or complete coverage. External denominator detects missing invocations;
   actual ledger snapshot reports aggregate liability only. Concurrent/reentrant
   writer and late-launch refusal hold across awaits; uncertain writes hold.
   Missing/changed denominator and late callbacks block passing finalization.
8. A baseline report enumerates workload, mode, invocation/attempt denominators,
   observation window, actual/estimated/unknown values, quality and latency scope.
   Offline fixtures prove arithmetic/association only, not savings or live behavior.

## Out of Scope

Provider calls, billing activation, credentials/configuration, choice caching,
recommendation execution, negative-cache implementation, changing resolver gates,
new ledger exports, a second ledger/event bus, autonomous crash recovery, receipt
schema primitives, generic concurrent append migration and standalone production
activation/durable custody. D5/full HRO completion is not awarded by drafting this
slice; actual measured workflow, billing/live gates and review remain required.

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
- Installation prerequisite: proposed new dispatch/src/pmc-launch/measured-workflow.ts
  and dispatch/tests/pmc-measured-workflow.test.ts, plus exact accepted C/D/E
  installation/caller files to be named before dispatch. No dispatch-to-verification
  cycle may be introduced: the final installation owner/module location must be
  reconciled with actual E source before freezing this proposal.
- Verification prerequisite: new verification/src/harness/routing-telemetry.ts,
  verification/tests/routing-telemetry.test.ts,
  verification/src/pipeline/stage-d-finalization.ts and
  verification/tests/stage-d-finalization.test.ts; existing
  verification/src/pipeline/index.ts only if its genuine verdict-emission lifecycle
  requires an explicit hook. No public barrel export is assumed.
- Integration prerequisite: integration/src/exit-vehicle.ts,
  integration/tests/exit-vehicle.test.ts and integration/tests/closure.test.ts.
  This separately reviewed amendment preserves real gate/runners while supporting
  the measured final-D profile at actual sequence positions.
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

Not ready to dispatch. The coordinator adopted the directions P3-D1 through P3-D5
for this revised draft; exact contracts remain subject to independent review and
owner Gate 2. Accepted C/D/E hooks, private lifecycle, declared claim semantics,
new final-D producer and actual-sequence integration adoption are absent.
Standalone production remains held. Lost capture blocks measured success/savings;
aggregate ledger snapshot does not repair event coverage. No offline result
substitutes for these implementations or actual live proof.
