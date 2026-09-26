---
ticket: HRO-P3A
title: Authenticated measured Stage D finalization
status: active
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/receipts/
  - plugins/foreman-line/verification/
  - plugins/foreman-line/docs/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Define the verification-owned final Stage D producer and the dependency-neutral
private handoff contract needed by measured Foreman workflows. Existing claim
receipts remain claims. A genuine successful verification session, complete
telemetry publication and closed human gate precede the final stage receipt.
This is an interface-first review draft, not runtime dispatch or activation.

## Constraints

### Authority, dependencies and existing behavior

Base is `f41f0adfa5888a42a9a135a1eb052a38a0c7474c`, containing the P3 draft
and accepted `2eb994b4dca3e0d1220953c30d1a64d0e5bdfc37` source. Exact source
pins and missing producer contracts are in the companion notes. Root adopted the
four Step-0 decisions for drafting; independent design review and Gate 2 remain.

`runHarness` emits HarnessClaimResult claim receipts. `assembleVerdict` accepts
supplied claims/findings/dispositions; `emitVerificationVerdict` writes a
`verification-verdict` claim and `StageOutput<VerificationVerdict>` envelope.
Neither emits a final kind:stage D. `executeHumanGate` emits a StageDClosure
claim after approval and its Jira leg; half-closed/declined is not closure.
An empty schema-valid pass or a successful call with fabricated input arrays
does not establish genuine verification execution.

The proposed private contract is `receipts/src/measured-workflow-internal.ts`.
It is not added to the public barrel or manifest. It imports no verification,
integration, dispatch or approval implementation. It owns closed data types,
bounded same-process identity registries and phase checks, not verification
judgment, telemetry collection, filesystem hashing, network or authority creation
from documents. Verification and integration may import this private module.
Existing ReceiptDocument schema, validators and generated schemas remain unchanged.

The installed workflow composition captures genuine owner functions once. Internal
issuer/consumer objects are separate capabilities retained only by their owner;
the session object exposed to finalization has no registration or mint methods.
Task input cannot select the factory, issuer, callbacks, repo root or validators.
This is a cooperative installation boundary, not security against arbitrary code
inside the process, hostile module imports or filesystem/process compromise.
No JSON, receipt hash, TypeScript cast or freshly allocated object reconstructs
registry membership. Restart loses capabilities and holds this measured workflow.
The production installation entry and upstream provenance ports are separately
reviewed prerequisites; this draft does not invent an authenticated bootstrap.

### Closed registration and genuine expected evidence

One installed session binds immutable workflowId, correlationId, parcelRef,
absolute repository root, full 40-hex verified head SHA, dispatch ReceiptRef,
BuildResult ReceiptRef, exact spec digest, verification-matrix digest and an
owner-issued expected verification plan. Ref means exactly `{hash, locator}`,
with 64-lowercase-hex hash and canonical repo-relative receipt locator confined
to this workflow; never caller filesystem paths or unchecked symlinks.

The expected plan is fixed before checks start and cannot be inferred from only
the results that happen to arrive. It records:

1. Every unique AC identifier extracted by the actual harness from the frozen
   spec and every matrix check selected from actual BuildResult.touchedSurfaces.
   Retain the real spec/matrix content digests and build/dispatch linkage. The
   genuine test-run producer must bind named pass/fail results to this exact
   head and invocation; an injected `testResults` array is not that producer.
2. The exact required review slots, reviewer identity/independence, reviewed head
   and dispatch references from the workflow's approved review plan. Capture
   actual `dispatchReview` and `collectAdversarialFindings` results for every
   slot, including an explicit successful empty-findings result. Parsing text
   proves syntax only. The authenticated reviewer-output intake must bind the
   collected bytes to that expected completed review; arbitrary raw text is
   insufficient. Missing, duplicate, superseded or wrong-head reviews hold.
3. Actual coordinator dispositions bound to review-slot identity and finding
   ordinal/content digest. Every sub-high finding has exactly one disposition;
   high/critical cannot be waived. Use actual `assembleVerdict` rules, and bind
   its exact output to the captured complete inputs. No findings may disappear
   by concatenation, duplicate identifiers or an empty replacement array.
4. Authenticated authorized decision intake under the existing delegation and actual `prepareHumanGate` /
   `executeHumanGate` completion. Require approved, closed output and exact
   approval/closure/verdict refs; declined, half-closed, missing or fabricated
   decisions hold. Preserve the actual actor in decidedBy and bind the intake to
   its genuine authority/delegation evidence; never relabel an authorized agent
   as a human. The existing API's human-gate name creates no new human-only gate.
   Existing effects require their existing authority; this parcel grants no Jira
   or approval authority and cannot expand or revoke existing delegation.

Each captured HarnessResult.claims item must match exactly one returned on-chain
receipt with kind:claim, stage:D, claimRef equal to claim, subjectKind
HarnessClaimResult and identical claim/passed/evidence. Compare full expected
multiset with actual results and refs; reject missing, extra and duplicate
identities. All mandatory claims pass. Review dispatch/findings, verdict and
human-gate receipts similarly retain their actual owner claimRef/subjectKind,
payload and links. Do not synthesize a receipt when a producer did not emit one.

Missing actual upstream producers are explicit prerequisites: authenticated named
test-run intake; completed reviewer-output intake; coordinator-disposition and
authorized-decision intake; installed workflow composition. Their exact source paths
and APIs must be frozen by their owners before production implementation dispatch.
Tests may exercise isolated contract behavior with labelled test installation,
but cannot claim these production prerequisites exist.

### Interface-first telemetry and finalization

P3A owns the shared seal-consumption interface; P3 owns its genuine collector and
publisher. P3A can be implemented/tested offline before P3, and P3B can consume
P3A afterward. Production composition waits for both: there is no requirement
that a fake seal activate P3A to implement P3, and no P3 receipt may pretend the
final D producer already exists.

The proposed internal seal registration record has exactly workflowId,
correlationId, verifiedHeadSha, telemetryReceiptRef, denominatorDigest and
coverage:'complete'. Registration requires the installation-retained P3 issuer,
directly after that collector closes launch admission, drains all admitted work,
checks the externally declared invocation denominator and publishes its real
measurement claim. Public registration from a record alone is forbidden.
The registry binds the record to the existing session identity and current tip.
Missing capture/crash/incomplete coverage cannot register a complete seal.

Proposed operation: `finalizeMeasuredStageDV1(session: object): FinalizationV1`.
No additional payload, paths, pass flag, receipt list or callback is accepted.

```ts
type FinalizationV1 =
  | {ok:true; receipt:{hash:string; locator:string}}
  | {ok:false; code:'SESSION_REFUSED'|'PHASE_REFUSED'|'PREREQUISITE_UNAVAILABLE'
      |'EVIDENCE_REFUSED'|'COVERAGE_INCOMPLETE'|'CHAIN_REFUSED'
      |'WRITE_REFUSED'|'WRITE_UNCERTAIN'};
```

The finalizer is synchronous: it starts only after all asynchronous draining and
telemetry publication have completed and acknowledged their results. It contains
no await and returns FinalizationV1, never a Promise. It synchronously owns the
writer busy guard during validation/write/reread. The broader workflow sets busy
before asynchronous owner operations and retains it across their awaits.
Phases are capturing -> draining -> publishing -> finalized-D -> integrated-E ->
sealed-F, with held reachable on uncertainty from any nonterminal phase.
Passive completion observations can finish admitted work while draining; writer
reentry refuses rather than awaiting itself. No new measured launch after closing
admission, and no later verification call that uses a model in this scope.
Required human-gate closure precedes measurement publication/final D. The
measurement claim is the last claim and current tip immediately before final D.

All admitted writers use the cooperative workflow session. Raw stage exports
remain independently callable outside it; they do not magically acquire a lock.
Unexpected tip changes hold. Independent concurrent processes are unsupported.
Use exclusive create for the new final receipt; never overwrite. A fault before
write is typed; ambiguous/partial completion holds, with no automatic retry or
JSON-based reopening. A same-session duplicate after acknowledged finalization
returns the same immutable reference only in finalized-D after verifying the
unchanged finalized tip. After integrated-E or sealed-F, finalization returns
PHASE_REFUSED without writes; this does not erase the historical D reference.

### Complete shared registry lifecycle

P3A freezes E/F transitions now; P3B consumes them without extending this module.
Installation retains separate workflow-admission, verification-finalizer,
P3-publisher, E-owner and F-owner capabilities. Each operation requires exact issuer identity and session
membership; the public session token alone cannot advance or acknowledge a phase.
Capabilities are not transferable across installations, sessions or owner roles.
The closed transition contract is:

| Operation / installed owner | Required phase and evidence | Resulting phase |
|---|---|---|
| closeAdmission / workflow | capturing, no new launches thereafter | draining |
| acknowledgeDrain / workflow | draining, admitted work complete and no pending measured checks | publishing |
| registerSeal / P3 publisher | publishing, genuine complete publication and exact current tip | publishing, seal fixed once |
| acknowledgeFinalD / verification | publishing, seal plus all expected evidence, direct acknowledged final write/reread | finalized-D |
| acknowledgeE / E owner | finalized-D, direct real runner E write/reread, exact D predecessor and head/profile | integrated-E |
| acknowledgeF / F owner | integrated-E, direct real runner F write/reread, exact E predecessor and owner-bound closure input | sealed-F |
| hold / active owner | any nonterminal phase, failed/uncertain operation | held |

Writer acquisition requires the matching current phase and no active writer;
release after success advances only via the corresponding acknowledgement.
Failure cannot advance; uncertainty holds. Passive completion intake while
draining is permitted but cannot acquire writer authority or reopen admission.
held and sealed-F have no advancing operation. Duplicate E/F acknowledgements,
wrong owner, phase skipping and stale acknowledgements refuse without mutation.
Only the documented read-only D duplicate is permitted, with its unchanged-tip
test; no duplicate silently repairs a partial write.

At most one D, one E and one F acknowledgement record per session. Each closed
record has exactly stage, receiptRef, predecessorRef, sequence, verifiedHeadSha
and subjectDigest; stage fixes the permitted phase and owner. References and
digests retain the named refinements. Records are derived from the genuine
captured owner document and verified reread, not caller summaries. Store owned
frozen reference/digest records, not arbitrary raw ReceiptDocuments in the shared
registry. Owners may retain only the bounded appropriate document content needed
for their checks under the existing 1-MiB document/16-MiB aggregate limit; never
retain raw review output, prompts or telemetry bodies in acknowledgement records.
Acknowledgement proves the specific owner write/custody, not independent merge,
CI or Jira authentication. P3B requires the upstream closure authority separately.

Before writing, verification re-reads bounded files, validates every document and
the entire contiguous sequence from genesis, filename/document agreement, unique
sequences, workflow/correlation, hashes and links. Existing `validateChain` checks
stored links but does not recompute content hashes. The verification owner uses
existing approval canonicalize/sha256Hex on each document without its hash field;
receipts never imports approval. Compare against captured refs and payloads, not
just self-consistent rewritten chain bytes. Hash integrity is not authenticity.

Append existing ReceiptDocument kind:stage, stage:D, claimRef:null, signature:null,
subjectKind:MeasuredVerificationHandoff, sequence:tip.sequence+1, prevHash:tip.hash.
Inherit workflowId/correlationId; use existing owner conventions for session/run.
Closed subject keys are version:'hro-measured-d/v1', verifiedHeadSha,
buildReceiptRef, verdictReceiptRef, humanClosureReceiptRef, telemetryReceiptRef,
denominatorDigest, expectedPlanDigest and coverage:'complete'. Refs point to the
actual captured producers. Register the acknowledged final receipt with the
private registry only after reread/hash validation; it is not a merge permit.

### Proposed bounds requiring design ratification

At most 32 active installed sessions; one finalization per session; 256 expected
claims, 16 review slots and 256 findings per session; 1024 receipts per measured
chain; 1 MiB per receipt/envelope and 16 MiB aggregate scanned bytes. P3's smaller
telemetry limits still apply. Strings max 4096 UTF-16 units, locators max 1024,
depth 20, 131072 expanded nodes and 2 Mi UTF-16 aggregate per captured admission.
No truncation; overflow holds before expansion/read allocation, including aliases.
One bounded snapshot at each gate; no polling loop or unbounded retries. Freeze
owned records. Closed results exclude arbitrary exception text, prompts, review
raw output, credentials or telemetry content. These are proposals, not measured
capacity evidence; boundary and one-over tests are required.

### Bounded offline implementation slice — 2026-09-26

This amendment is a docs-only release from 1c304f6d1a18a659d6b8f2c83fd1836ef59e1738.
It proposes an independently dispatchable OFFLINE slice, still draft pending
independent review and explicit runtime release. The production contracts above
remain prerequisites, not APIs implemented by this slice. No existing owner hook
changes, copied harness planning algorithm or dynamically supplied owner functions.

#### Closed constructors and fixture data

The new verification module statically imports and retains runHarness,
dispatchReview, collectAdversarialFindings, assembleVerdict,
emitVerificationVerdict, prepareHumanGate, executeHumanGate and writeClaimReceipt.
It invokes those actual functions and privately captures their returned values and
bounded reread documents. Constructor capture validates all fixture data and the initial bounded full A/B/C chain, referenced dispatch/build payloads and hashes before any owner write; those initial documents are explicitly offline fixture provenance. No caller-provided HarnessResult, verdict, closure,
receipt array or boolean can replace execution. Existing schemas remain mandatory.

All records below are closed, owned, deeply frozen ordinary data unless explicitly
identified as opaque capabilities or installed method records. Unknown keys,
accessors, symbols, functions, thenables, cycles and invalid refinements refuse;
alias-expanded capture obeys the existing bounds. A named existing schema means
that exact owner's schema plus rejection of unknown keys, not an open object.
Optional properties are not silently defaulted. All listed data keys are required.

```ts
type CodeV1 = 'SESSION_REFUSED' | 'PHASE_REFUSED' | 'PREREQUISITE_UNAVAILABLE'
  | 'EVIDENCE_REFUSED' | 'COVERAGE_INCOMPLETE' | 'CHAIN_REFUSED'
  | 'WRITE_REFUSED' | 'WRITE_UNCERTAIN';
type ResultV1<T> = {ok:true; value:T} | {ok:false; code:CodeV1};
type RefV1 = {hash:string; locator:string};
type RegistrationV1 = {
  workflowId:string; correlationId:string; parcelRef:string; repoRoot:string;
  verifiedHeadSha:string; dispatchReceiptRef:RefV1; buildReceiptRef:RefV1;
  specDigest:string; matrixDigest:string; expectedPlanDigest:string;
};
type ReviewExpectationV1 = {
  slotId:string; reviewerId:string; reviewedHeadSha:string;
};
type OfflineExpectedV1 = {
  claims:readonly string[]; reviews:readonly ReviewExpectationV1[];
  builderId:string; authorizedActorId:string; authorityRef:string;
};
type OfflineReviewV1 = {
  slotId:string; reviewerId:string; reviewedHeadSha:string; rawText:string;
};
type OfflineDispositionV1 = {
  slotId:string; findingIndex:number; findingDigest:string;
  disposition:'accept'|'rework'; note:string;
};
type OfflineDecisionV1 = {
  actorId:string; authorityRef:string; decision:'approve'|'decline'; note:string;
};
type OfflineMatrixResultV1 = {name:string; passed:boolean; evidence:string};
type OfflineInputV1 = {
  domain:'offline-fixture/v1'; fixtureId:string; registration:RegistrationV1;
  pluginRoot:string; specPath:string; order:DispatchOrder; buildResult:BuildResult;
  expected:OfflineExpectedV1; testResults:TestResults;
  matrixResults:readonly OfflineMatrixResultV1[];
  reviews:readonly OfflineReviewV1[];
  dispositions:readonly OfflineDispositionV1[]; decision:OfflineDecisionV1;
  ticketKey:string; targetStatus:string; denominatorDigest:string;
};
function createProductionMeasuredVerificationV1(input:unknown):
  {ok:false; code:'PREREQUISITE_UNAVAILABLE'};
function createOfflineMeasuredVerificationV1(input:unknown):ResultV1<OfflineDriverV1>;
```

Production construction always returns the stated refusal, even for hostile input:
no property read, registry allocation, file access, callback, subprocess or network.
There is no mode flag, environment switch or fixture upgrade operation. The offline
constructor returns only the driver below; installation capabilities never escape
through that driver. Receipt schema/final-D subject stay unchanged. Domain and
fixtureId are retained in private session custody and every driver/report fixture
identity; the measurement claim explicitly labels them. A receipt alone never
reconstructs the domain or a capability. Future production consumers must require
production installation custody; this slice cannot create that custody.

FixtureId is 1..64 ASCII letters/digits/hyphens, explicitly fixture-labelled in
reports. Workflow/correlation/order/build validation uses actual owner schemas.
Registration refs/digests retain earlier refinements; all content digests are
SHA-256 of existing canonical representation (spec/matrix digests bind exact file
bytes). expectedPlanDigest is SHA-256 of canonical OfflineExpectedV1; it is not
inferred from returned results. Claims are unique 1..256 identifiers, reviews
1..16 unique slots with unique reviewer IDs distinct from builderId, all at the
registered head. Matrix result names are unique and belong to expected matrix
claims. Expected review slots and raw review records must match one-to-one. Dispositions/reviews are bounded by the earlier 256-finding/16-slot caps;
TestResults has exactly passed/failed arrays of unique names, disjoint and at most
256 combined. Matrix results at most 256. Every ordinary string remains <=4096
UTF-16 units, including offline review text; fixtures fit rather than loosening
capture limits. Expected sets are frozen before any owner call. Empty findings
are permitted for an expected completed review, not an absent review.

Fixture expectations are independently fixed by the test installation and checked
against actual harness results/receipts. extractAcs (harness:496) and
resolveRequiredChecks (:644) are private: do not copy them or infer the expected
set from runHarness outputs. This slice does not implement a production planner.
Spec/matrix bytes are captured before calls and reread at finalization; stale
contents, head or build/dispatch linkage refuse. Paths are canonical, bounded,
symlink-free and confined: specPath is repository-relative; pluginRoot is the
explicit trusted read-only fixture/plugin tree; writes are only inside the
installation-owned temporary repoRoot. The constructor is for trusted offline test setup only; repoRoot must resolve beneath the OS temporary directory to a fixture-owned directory named hro-p3a-fixture-<fixtureId>, with no symlink components. Ordinary task input cannot invoke this installation path. No ambient cwd, PATH-selected executable,
network client, provider, environment credential or actual Jira adapter is used.

The wrapper converts owned fixture data into fixed internal adapters, never
accepts adapter functions. Matrix adapters return only their captured named
fixture result. The git adapter recognizes exactly dispatchReview's branch
verification and worktree-add commands, with exact captured cwd/branch/path;
branch verification returns the fixture head, worktree-add creates only a fresh
fixture directory, all other commands fail. No process is spawned. Review paths
are derived as repoRoot/.hro-offline/<fixtureId>/<slotId>, slotId restricted like
fixtureId; no caller path override. dispatchReview still performs its genuine
profile, kickstarter, receipt and no-clobber work. No launchReviewer call.
The fixed Jira adapter offers one deterministic fixture transition with id
'offline-transition', name/toStatus equal to targetStatus, accepts that exact
issue/id and returns 'offline-comment' for its local comment acknowledgement.
Existing project/decision gates still execute. These responses simulate services
and are labelled fixtures; they do not prove a real checkout, review or Jira action.

#### Setup, sessions, leases and owner ports

The dependency-neutral module has one internal setup export:
`createOfflineMeasuredWorkflowInstallationV1(): InstallationV1`. Each call creates
an offline-only installation; enforce a conservative 32-retained-session bound module-wide,
not resettable by creating another installation. No receipt/JSON can instantiate
InstallationV1, session, lease or owner port. Methods are captured private closures.
There is no dispose/reset/reopen operation in this slice. Held and terminal sessions count against this bound; a new installation cannot reclaim quota. Boundary tests use isolated child module instances/processes, never an exported reset.

```ts
type ChainKeyV1 = {rootDeviceId:string; rootFileId:string; workflowId:string};
type InstallationV1 = {
  createSessionV1(registration:unknown, fixtureId:unknown, chainKey:unknown):ResultV1<OwnerBundleV1>;
};
type OwnerBundleV1 = {
  session:object; workflow:WorkflowPortV1; verification:VerificationPortV1;
  publication:PublicationPortV1; integration:IntegrationPortV1; closure:ClosurePortV1;
};
type SessionStateV1 = {
  domain:'offline-fixture/v1'; fixtureId:string; registration:RegistrationV1;
  phase:'capturing'|'draining'|'publishing'|'finalized-D'|'integrated-E'|'sealed-F'|'held';
  busy:boolean; outstandingWork:number;
  seal:SealV1|null; finalD:AckV1|null; integratedE:AckV1|null; sealedF:AckV1|null;
};
type WriterPortV1 = {
  readStateV1():ResultV1<SessionStateV1>;
  beginWriterV1():ResultV1<object>;
  endWriterV1(lease:object):ResultV1<null>;
  holdV1(lease:object):ResultV1<null>;
};
type WorkflowPortV1 = WriterPortV1 & {
  admitWorkV1():ResultV1<object>;
  completeWorkV1(work:object):ResultV1<null>;
  closeAdmissionV1():ResultV1<null>;
  acknowledgeDrainV1():ResultV1<null>;
};
type VerificationPortV1 = WriterPortV1 & {
  acknowledgeFinalDV1(lease:object, record:unknown):ResultV1<null>;
};
type PublicationPortV1 = WriterPortV1 & {
  registerSealV1(lease:object, record:unknown):ResultV1<null>;
};
type IntegrationPortV1 = WriterPortV1 & {
  acknowledgeEV1(lease:object, record:unknown):ResultV1<null>;
};
type ClosurePortV1 = WriterPortV1 & {
  acknowledgeFV1(lease:object, record:unknown):ResultV1<null>;
};
```

There are no unspecified methods or getter properties. Bundle/session identity is
unique and frozen; ordinary registration data is captured before registry entry.
Only the installed wrapper keeps this bundle. Registry unit tests may directly
create explicitly offline bundles; that is not a production authority API.
SealV1 is exactly the reviewed six-field seal record; AckV1 is exactly the reviewed
 six-field D/E/F acknowledgement record. readStateV1 returns an owned frozen
 snapshot only to its own installed role, with no capabilities, raw documents or
 ability to change phase. Existing reviewed record refinements apply verbatim.
Verification retains evidence; registry retains only bounded registration/seal/
acknowledgement records and capability membership, never raw review text.

At most one active writer lease per session, tied to exact issuing owner and
session, single release, not clonable or reusable. Workflow writes are permitted
in capturing/draining; publication and verification writes only in publishing;
E writes only in finalized-D, F writes only in integrated-E. Every transition checks
its issuing role, exact phase and lease as appropriate. Acknowledgement transitions
occur while that writer holds its lease, then endWriter releases that same lease
in the resulting phase. Lease release never rewinds phase or clears held. Errors
with possible writes call hold before release; busy/reentry refuses without waiting.

admitWork is allowed only in capturing, maximum 256 outstanding tokens per session;
completeWork accepts each own token once in capturing/draining, including during
an awaiting writer. It cannot write or issue authority. closeAdmission is allowed
once in capturing and moves to draining, permitting existing work to finish.
acknowledgeDrain requires draining, zero tokens and no active writer, and moves to
publishing. Registering a seal is once-only and requires publishing. D acknowledgement additionally requires the registered seal and exact seal receipt predecessor. E requires predecessor equal to acknowledged D and sequence D+1; F requires predecessor equal to acknowledged E and sequence E+1. All heads agree with registration. D, E and F acknowledgements each occur once in their reviewed phases; identical duplicates
are not new transitions. Finalizer's already-acknowledged D read-only duplicate
is handled by verification's private evidence/reread, only in finalized-D with
unchanged tip. After E/F it refuses. Registry methods perform no filesystem reads
or content-hash authentication: captured owners do these before registration.

#### Unique canonical receipt-chain admission

The installed verification wrapper alone derives ChainKeyV1, then supplies it as
createSessionV1's third argument. Public OfflineInputV1 and RegistrationV1 are
unchanged: neither accepts a chain key, identity override or canonicalization
callback. JSON, a path string or a self-asserted filesystem identifier cannot
establish custody. The private receipts module validates/captures closed key data
and compares keys; it performs no filesystem operations and imports no owner.

Verification validates the existing fixture root as a directory, canonicalizes its
actual filesystem path and confirms confinement under the approved temporary root.
It rejects symlink/junction components, ambiguous or unsupported paths and root
identity failures. Obtain bigint directory device/file identifiers from the actual
filesystem, never floating-point or caller-supplied values. rootDeviceId is the
canonical decimal encoding of unsigned 64-bit dev (0 allowed); rootFileId is the
canonical decimal encoding of a positive unsigned 64-bit file ID/inode. Maximum
is 18446744073709551615; no sign, whitespace or leading zeros except the sole dev
value '0'. Zero/unsupported inode or out-of-range identity refuses before owner
writes, rather than falling back to a textual path key. workflowId is the validated
UUID lowercased in the private key; it must equal registration.workflowId under
that normalization. Receipt payload casing remains unchanged. The actual harness
accepts UUID casing, so a differently cased UUID cannot create a second admission.

The owned key denotes (actual root directory identity, workflow UUID), independent
of path spelling, installation, fixtureId, head, correlationId or provenance label.
Verification retains canonical root and key privately and rechecks root identity,
confinement and prohibited components before each owner operation that can write,
including measurement publication and synchronous finalization. A changed root or
unverifiable identity holds; it never derives a replacement key for the session.
Use the captured validated root for actual owner calls. This is cooperative local
custody, not protection against hostile filesystem changes during an owner call.

After all registration/key validation, receipts performs one synchronous module-wide
check-and-reserve with no await or external callback between check and reservation.
An existing tuple returns SESSION_REFUSED before allocating a second session,
owner bundle, work/writer lease or any owner effect. Use nested maps or an unambiguous
bounded tuple encoding, never delimiter concatenation that could collide. The
reservation spans every installation created by this module instance. Successful
reservation and retained-session capacity accounting are one atomic admission;
invalid or capacity-refused input does not reserve a new key. Preserve the existing
32-retained-session cap, so the reservation set is also bounded to 32 entries.

Reservations are nonreclaimable for this module lifetime: held, finalized-D,
integrated-E, sealed-F, lost caller references and failed post-reservation setup all
retain their key and capacity. No reset/dispose, new installation, changed fixture
label or alternate path spelling can reclaim it. Failed post-reservation setup
must leave a bounded held reservation even if no driver was returned. Restart or
separately loaded module instances are not a recovery mechanism; existing no-reopen
and cooperative single-process installation constraints remain. Unit tests may
exercise private key comparison with labelled fixture keys, but filesystem-owner
checks require real directories and cannot claim authenticity from those fixtures.
#### Offline driver and deterministic execution

```ts
type OfflineDriverV1 = {
  domain:'offline-fixture/v1'; fixtureId:string; session:object;
  runVerificationV1():Promise<ResultV1<null>>;
  closeAdmissionV1():ResultV1<null>;
  drainV1():Promise<ResultV1<null>>;
  publishFixtureMeasurementV1():ResultV1<RefV1>;
};
function finalizeMeasuredStageDV1(session:object):FinalizationV1;
```

runVerification is single-use: acquire work token and workflow writer before the
first owner call; retain both across awaits and release in finally (holding on
uncertain side effects). It calls real runHarness, every expected dispatchReview
and collectAdversarialFindings, maps slot-local finding indices to deterministic
concatenation in expected review order without dropping entries, calls actual
assembleVerdict and emitVerificationVerdict, then prepareHumanGate and
executeHumanGate. Map actorId exactly to decidedBy; verify actorId/authorityRef
against captured fixture expectations and bind each disposition to the captured
slot/index/content digest (SHA-256 of the canonical actual finding object). No raw fixture pass, reviewer text or authorityRef is
production authentication. A non-pass, failed collection, unexpected output,
declined/half-closed result or mismatch cannot produce final D. The wrapper
retains exact actual results/refs and rereads their expected payloads; emit verdict
with null reworkSignal only for its actual passing verdict. Failures are typed and
cannot turn an emitted failure claim into a successful finalization.

closeAdmission delegates to the workflow port. drain waits only for the driver's
already admitted verification promise; it does not poll or launch anything. It
then requires successful complete evidence and acknowledges drain. Missing run or
failed verification refuses. If closeAdmission races before any run, later runVerification refuses rather than starting work. No admitted external jobs or arbitrary promises exist
in this offline driver. The registry's separate tokens permit bounded phase tests.

publishFixtureMeasurement acquires the publication lease only after drain. It
uses actual writeClaimReceipt and existing chain/correlation conventions to append
a real kind:claim, stage:D, claimRef:'offline-measurement',
subjectKind:'OfflineMeasuredFixture' receipt. Its closed subject is exactly
{version:'hro-offline-measurement/v1', fixtureId, denominatorDigest,
coverage:'complete'}. Complete refers only to the declared offline fixture; it
asserts no genuine telemetry coverage or savings. The subject digest and exact
captured bytes/ref are reread and verified before the reviewed seal is registered;
no receipt-list parameter or direct public seal registration exists. One call only;
uncertain publication holds. Later real P3 replaces this fixture owner through a
separately reviewed production installation, not by flipping a flag.

Finalization remains the reviewed synchronous single-session API and exact subject.
It consults only its private successful verification/publication custody, validates
full actual chain/content hashes and expected captured payloads, writes exclusive
final D and registers its acknowledgement under the verification lease. No await,
callback injection, raw verdict or arbitrary subject parameter. Test driver/report
must retain offline identity even though the unchanged final-D subject is shared.
P3B must not promote offline identity to production; E/F registry controls here
are labelled offline controls, with actual E/F composition owned by P3B acceptance.

## Acceptance Criteria

| AC | Required evidence |
|---|---|
| 1 | Real harness -> assembler -> verdict emitter -> human-gate closure -> final D under an explicit offline test installation; expected claims/reviews are fixed independently of returned results. Genuine test transports stay labelled offline. |
| 2 | Empty forged pass, omitted/extra/duplicate/foreign AC or matrix claim, fabricated review text/result, wrong reviewer/head, missing disposition, high finding and half-closed/declined human gate each refuse before final write. |
| 3 | Real receipt/envelope payload/ref/hash/claimRef/stage/kind/correlation tampering, rewritten stored hash chain, path escape/symlink and stale build/head each refuse. Mutation controls prove every named gate. |
| 4 | Missing P3 issuer/seal, incomplete denominator, late launch, fake complete record, cloned/session JSON/replayed cross-session capability refuse. Unavailable production intake returns PREREQUISITE_UNAVAILABLE; fixtures cannot activate production. |
| 5 | Busy/reentrant/concurrent finalization, intervening raw writer, exclusive-create conflict and before/after-write faults hold without duplicate or overwrite; acknowledged duplicate returns only the original verified tip. |
| 6 | Every numerical limit and one-over, throwing getters/proxies/ports, cycles, nonfinite values and alias expansion return bounded typed results. Authorized delegated actor is accurately attributed; forged actor/authority refuses and no new human-only gate appears. No production approval/network/provider effects in offline verification. |
| 7 | Existing harness/pipeline/human-gate and receipts behavior remains valid. P3A independently tests final D and the complete registry interface using labelled owner-capability controls: wrong issuer, phase skipping, stale/duplicate acknowledgements, bounded records, held/terminal states and finalizer duplicate after E/F refusal. Synchronous finalizer returns a non-Promise after completed drain/publication. P3B/combined acceptance owns real P3A->E->F composition; it is not a prerequisite for accepting P3A. |

Additional offline-slice acceptance is mandatory: production constructor must
refuse hostile inputs with zero reads/effects; offline fixture arrays/results must
never activate production. Exercise actual owners against independently authored
fixture expected sets, including missing/extra AC and matrix results; do not mirror
the harness extraction implementation in expected-value code. Assert full captured
owner payloads/claimRefs/hashes and actor attribution, not only a passing final D.
Exercise all closed constructor keys, one-over bounds, wrong leases/role/session,
duplicate token completion, close/drain races and no reset through a second
installation. Test-only fault instrumentation stays in tests and is never a public
callback port. The report names offline fixture identity and distinguishes fixture
service responses from actual owner execution and absent production intake.


Canonical-admission controls must demonstrate same-root/workflow duplicate refusal
within one installation and across two, before any second owner write; repeat in
busy, held, finalized-D, integrated-E and sealed-F states and after post-reservation
setup failure. Assert unchanged session/key capacity on duplicate attempts. Use
real Windows directory aliases for case, separator, trailing-separator and dot
segments, plus differently cased UUIDs. A supported real short-path alias must
resolve to the same identity and refuse a duplicate; if the host supplies no such
alias, record that control as unavailable, never fabricate a passing alias test.
Junction/symlink paths refuse rather than becoming separate identities. Include
root replacement/identity recheck refusal and zero/unsupported/out-of-range inode
controls. Genuine different roots with the same UUID and different UUIDs in the
same root remain admissible within bounds. Distinct installation/domain labels on
the same tuple never create a positive control. Registry tests alone do not prove
Windows canonicalization; report which real filesystem alias controls executed.
## Out of Scope

Telemetry collection, production bootstrap/intake implementation, C/D transport,
ledger authority, restart recovery, hostile-process exclusion, merge/Jira/provider
authorization, receipt schema changes and changes to legacy stage semantics.

## Context & References

- [Owner prerequisite notes](../../goals/hybrid-routing-optimization/hro-p3-owner-prerequisites.md)
- [P3 telemetry draft](HRO-P3-correlated-receipts.md)
- [P3B measured integration](HRO-P3B-measured-integration-profile.md)
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md)

## Allowed Files

This docs-only amendment permits exactly this spec and
`docs/goals/hybrid-routing-optimization/hro-p3-owner-prerequisites.md` under the
plugin. It does not release runtime work. After independent design review and an
explicit runtime release, the proposed implementation envelope is exactly:

- plugins/foreman-line/receipts/src/measured-workflow-internal.ts
- plugins/foreman-line/receipts/tests/measured-workflow-internal.test.ts
- plugins/foreman-line/verification/src/pipeline/stage-d-finalization.ts
- plugins/foreman-line/verification/tests/stage-d-finalization.test.ts
- plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p3a-verification.md

All five are new files. No existing owner hooks, public barrel, schema, manifest,
dependency, parent P3 or P3B modifications. Production planner/intake/installation
paths remain separate future parcels, never an unspecified builder expansion.

## Verification Plan

Lint frontmatter using the frozen donor, validate required body sections and local
links, inspect the exact two-document repair diff. Independent reviewers must try a
validly hashed forged pass and complete-looking but omitted expected review.
Runtime acceptance requires actual owner composition and refusal-stage assertions;
isolated fixture success is not production authentication or P3 completion.

## Offline implementation release — 2026-09-26

Luna completed genuine read-only Step0 and stopped at53e92b35, inspecting actual
owner seams, exclusive final-write requirements and the exact five-file plan.
Design53e92b35 has independent coordinator/PMC approvals and ratificationea8a9ef.
Root accepts Step0 and explicitly releases exactly the five new implementation
paths enumerated above, under delegated goal authority. This supersedes the earlier
docs-only and nondispatchable wording solely for this OFFLINE slice.

Use actual owner functions, private dependency-neutral registry, genuine temporary
filesystem/receipt effects and fixed network-incapable fixture adapters. Production
constructor remains unconditional PREREQUISITE_UNAVAILABLE before any input read
or effect. No existing owner/barrel/schema/manifest/dependency edits. Independently
fixed expected fixtures, full receipt payload/hash checks, canonical-chain admission
and numerical/hostile/race/fault controls are mandatory. Record genuine RED and
GREEN, applicable package regression/typecheck/lint and exact source preservation.
Freeze a clean source/report handoff and stop for two independent source reviews;
combined integration and remote checks still precede merge. No provider, credentials,
configuration, actual Jira or production activation is authorized by this release.

## P3A review repair and legacy guard compatibility amendment — 2026-09-26

Root accepts the builder's genuine read-only repair Step0 at8a76e738 after two
independent REQUEST CHANGES reviews. R1–R7 are recorded in
[review triage](../../goals/hybrid-routing-optimization/hro-p3a-review-triage.md).
All runtime corrections implement the existing contract; no production authority,
receipt schema, owner semantics or numerical limit is weakened.

The one narrow additional source envelope is
plugins/foreman-line/verification/tests/pipeline.test.ts. Its legacy AC21 currently
forbids the real orchestration calls required by this reviewed offline driver.
Retain the existing test for every pipeline source, including the new driver.
Only for the exact basename stage-d-finalization.ts permit these three required
owner tokens: runHarness(, dispatchReview, collectAdversarialFindings. Keep every
other existing prohibition for that file, and all prohibitions for every legacy
file. No whole-file skip, broad allowlist, generic opt-out, dynamic module lookup,
computed owner-name spelling or weakened process/network/provider boundary.
Use transparent named static imports and calls; source/audit failures must be
reported and resolved through explicit owner scope, never hidden by spelling.

Pair the guard amendment with negative controls showing a forbidden process or
provider/launcher primitive still fails for the driver and all three owner-call
tokens remain forbidden in legacy files. The actual driver still uses only fixed
private offline adapters; these exceptions do not authorize live reviewer, Jira,
Git process, provider or network effects. No new dependency or framework is needed.

After independent review of this compatibility amendment, a separate explicit
repair release may authorize the original five source/test/report files plus this
one guard test (exactly six). The builder must first record substantive RED for
the reproduced defects, then the complete mandatory control matrix, applicable
package suites/typecheck/lint and honest audit status. The report must map each
acceptance criterion to executed evidence, not count inspection as mutation proof.
No runtime edit is released by this documentation commit alone.

## P3A implementation repair release — 2026-09-26

Root and independent frontier A approve compatibility amendmentdc18b925; the
builder's genuine read-only repair Step0 has reproduced the blocking findings.
Root releases R1–R7 correction in exactly the original five implementation/report
files plus verification/tests/pipeline.test.ts. The appended narrow guard rule,
not the proposed blanket file exclusion, is authoritative. Retain all existing
production refusal and offline-only custody boundaries. No other owner, barrel,
manifest, schema, dependency, profile or source path may change.

Implement substantive defect RED then GREEN and the complete required acceptance
matrix; each executed control must have reviewable evidence. Use actual owner
contracts and transparent named calls. If another existing static/audit rule
requires enrollment, report its exact failure and proposed ownership amendment;
never concatenate identifiers, hide imports or waive a failing required audit.
Matching-lock read-only dependency links remain allowed, never donor installs.
Freeze a clean six-file repair/report commit and stop for two independent source
reviews. Full package checks and honest audit results precede integration; fixture
checks never establish production custody or completed HRO live acceptance.

### Second repair implementation release — 2026-09-26

Root accepts Luna's genuine read-only Step0 at4d11fa2 with persisted findings
500a51f/3d7776a. The builder reproduced mismatched C parcel, duplicate post-drain
claim and depth40/4097-string receipt finalization. Existing over1MiB refusal
is retained. Root and independent A both request closure of original R2/R3/R5/R6.
Explicitly release the same six runtime/test/report files from34071db; no new
source, schema, barrel, dependency, public port or audit path.

Before any owner write, validate the actual complete initial chain and admitted
order/build against real owner schemas/conventions, parcel, correlation, head,
refs and payloads. Update labelled initial fixtures to conform to those actual
contracts; do not relax validation to preserve incomplete fake payloads. Preserve
exact owned snapshots and claim/ref multisets, reject unexplained additions at
run/drain/publication/finalization, and retain every actual owner payload/link.
No first-match acceptance of duplicate claims or self-consistent rewritten data.

Use bounded directory iteration and bounded file reads, actual path/type/component
checks, and a structural JSON preflight before JSON.parse/expansion. Existing
receipt/envelope byte limits and ordinary depth/node/string capture limits apply;
all envelope reads are covered. No unbounded read followed by a size check. This
bounds input but does not replace the actual receipt schema or canonical hashing.
Fix full subtree node/string/depth accounting in both captures, including object
nodes, string-node checks and deeper repeated aliases. Preserve typed refusals.

Run the complete named positive/mutation/one-over/fault/concurrency matrix in the
Step0 plan, including actual injected AC21 forbidden-token controls and required
filesystem cases. Record unavailable actual short-path aliases honestly. Report
actual D19's three-site failure, not merely an unfinished wildcard run. Enrollment
follows stable runtime separately; do not rename/indirect calls to evade the audit.
Run full affected checks, freeze clean six-file source/report commit and STOP for
two independent reviews. No live, credential, host configuration or merge action.

### Genuine initial-owner contract clarification — proposed for independent review

The coordinator confirms the actual A receipt subject is the approval manifest
{projectedResult,specSet,approvedHash}, its subjectKind is ShapingResult, and B's
subject is the actual RegistrationResult. C's DispatchOrder subject is a projection
of kompressArtifactId, kompressReceiptRef, compressedText, routingDecisionRef,
injectedSkills and optional permissionProfile. It does not attest parcelRef or
stepZeroRestatement. Never require a synthetic parcel-only subject or describe
those omitted fields as authenticated by C.

For this offline fixture slice, support exactly one approved spec and one registered
ticket. Reject ambiguous/multi-parcel input. Validate actual exported shaping,
registration, dispatch and build schemas and preserve their optional fields. Bind
A's approvedHash to its exact canonical manifest and spec bytes; bind the supplied
registration to B and the sole approved spec/ticket; bind C's complete projection
to the corresponding order fields and compression evidence. The supplied parcel,
ticket key and spec must agree through that sole registration membership.

Only the actual fixed workflow-local routing-decision.json and kompress.json
sidecars emitted by existing owners may supply their missing evidence. Read them
with the same bounded, identity-checked capture and structural limits as other
initial evidence. Reconstruct Step 0 using the actual prepareDispatch convention,
including parcel, workflow, resolved model, injected skills and artifact id. Bind
routing class/data class to the approved spec and require exact fixed sidecar refs.
Retain content digests in the private initial snapshot and revalidate before later
owner writes. No caller-selected paths, private admission flags, minting callback,
alternate receipt schema or new production authority. These checks establish
internal consistency of an explicitly offline fixture, not authenticity of a
production approval, routing decision or invocation.

Successful tests must use actual A/B producer helpers and actual prepareDispatch /
executeDispatch, with only test-local compression and worktree boundaries synthetic.
Mutations must independently alter A manifest/hash/spec, B membership, C projection,
order and fixed sidecars, proving refusal before measured owner writes. Preserve
all existing adversarial controls, exact/+1 bounds and the six-file repair envelope.
Bounded file reads must use handles, compare identities around capture, consume
at most the remaining byte cap plus one detection byte, charge captured bytes,
close handles on all outcomes, and reject truncation, growth and replacement.

This clarification is not a runtime release. Independent design review, root
ratification and explicit Step0 release remain before edits. Production intake
and the separate D19 enrollment gate remain open.
