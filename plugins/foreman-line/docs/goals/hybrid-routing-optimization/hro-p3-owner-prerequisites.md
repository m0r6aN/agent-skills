# HRO P3 owner prerequisites

DRAFT. Two stacked owner contracts; no runtime release or production activation.

## Pins and actual seams

Shaping starts at `f41f0adfa5888a42a9a135a1eb052a38a0c7474c` on
`codex/hro-p3-owner-prerequisites-20260926`; underlying inspected source is accepted
`2eb994b4dca3e0d1220953c30d1a64d0e5bdfc37`. Original P3 draft stays unchanged.

- verification/src/harness/index.ts:685-781 runs required matrix checks, returns
  claims/receiptLocators/blocked and writes HarnessClaimResult claims. TestResults
  and MatrixCheckSet are supplied inputs; genuine invocation needs installed
  producer custody, not an assertion that arrays came from tests.
- verification/src/adversarial/index.ts:786 dispatchReview emits ReviewDispatch;
  :1219 collectAdversarialFindings parses supplied text and emits findings or
  parse-failure receipts. Neither parsing nor a digest authenticates reviewer
  origin. The installed expected review plan and completed output intake are
  prerequisites, including a genuine empty-findings result for an expected slot.
- verification/src/pipeline/index.ts:575 assembles supplied arrays under PRF-9;
  :801 emits a claim and StageOutput envelope. No final kind:stage D producer.
- verification/src/human-gate/index.ts:1004 executeHumanGate returns closed only
  after the approval/Jira path; :1129 writes StageDClosure as a claim. Its supplied
  decision/package/dependencies are not authenticated authority by themselves.
  Intake authenticates the actual authorized actor under existing delegation;
  decidedBy must not mislabel an agent as human. No new human-only gate is added.
- integration/src/exit-vehicle.ts:183 scans/validates the chain; :285 requires
  fixed kind/stage/sequence; :329 and :363 are real E/F runners. Retain these gates.
  runStageF calls emitClosureReceipt, not executeClosure; a supplied ClosureRecord
  does not authenticate merge/Jira completion. Actual upstream closure intake is
  a separate production prerequisite, not authority created by a receipt hash.
- receipts/src/validator.ts:10-15 explicitly excludes content-hash recomputation.
  Existing approval/src/canonical.ts provides canonicalization; owners can use it
  without adding receipts->approval or integration->verification dependency cycles.

All paths above are relative to plugins/foreman-line. No named WorkerEnvelope
exists at these seams; the actual type is StageOutput<VerificationVerdict>.

| Source | Frozen Git blob |
|---|---|
| receipts/src/validator.ts | `e5aba3acb4f9a5403a2fc30e12b5b068a6fc8a7a` |
| verification/src/harness/index.ts | `9f052d69bea3593dbc83772a861380ac0275bd63` |
| verification/src/adversarial/index.ts | `00288c0e305cf7a7a03f179e90bc2b07bdfd79a2` |
| verification/src/pipeline/index.ts | `72a622acd777812abe688583d3f7426e86cf8ac9` |
| verification/src/human-gate/index.ts | `7ab7ba06b375f3aaf515909e54645f2e6c297da3` |
| integration/src/exit-vehicle.ts | `e902b452139f37021f3da0bea3f24621e78372dd` |
| approval/src/canonical.ts | `180cbdd60a24f4265c3090ea517945e6554422b6` |

## Decomposition and authority decisions

1. [P3A](../../specs/active/HRO-P3A-authenticated-stage-d-finalization.md) owns the
   private receipts contract plus verification finalization. It freezes expected
   evidence before execution and accepts only its installed session at finalize.
2. [P3B](../../specs/active/HRO-P3B-measured-integration-profile.md) consumes P3A
   through the dependency-neutral contract, preserving legacy six-stage behavior
   and adding authenticated measured sequence handling in actual E/F runners.
3. P3 owns capture/publication and its seal issuer implementation. P3A defines the
   interface first, so neither implementation requires a fabricated production
   seal. Offline implementation acceptance is separately possible; production
   requires genuine joined owners. No circular production-readiness claim.
4. P3A's independently testable shared registry freezes all phases through E/F,
   separate installed E/F capabilities and three bounded acknowledgement records.
   P3A acceptance does not require P3B; P3B/combined acceptance owns actual A->E->F.
   Finalization is synchronous after completed drain/publication. Workflow busy
   persists across broader asynchronous operations; finalizer has no await.

Root adopted these directions for a reviewable draft after Step 0. Both specs
remain nondispatchable pending independent design review, root ratification of
closed types/bounds and exact implementation envelopes. The private receipts
registry is cooperative installation custody, not protection from hostile imports
or same-process code. It does not authenticate arbitrary data or persist authority.
Content-hash recomputation proves content integrity only; real function/output
capture and installed provenance are separately required.

## Missing production contracts and gates

Do not mark a supplied array authentic merely because runHarness/assembleVerdict
was called. The following production producers/intakes are not established by
this shape and need exact owner paths/contracts before production dispatch:

- Named test-run results bound to expected checks and exact verified head.
- Expected independent review slots and completed reviewer-output provenance.
- Coordinator disposition intake bound to exact review/finding identities.
- Authenticated authorized-decision intake under existing delegation and authorized
  human-gate transport, preserving actual actor and authority attribution.
- Genuine upstream closure-owner merge/Jira completion intake for ClosureRecord;
  runStageF's local receipt emission is not that producer.
- Installation entry retaining issuers and statically captured stage functions.
- Genuine P3 denominator/capture/measurement publisher issuing the private seal.

No new network/credential adapter is authorized here. Actual human-gate Jira
effects remain gated by their existing owner and authorization. Offline test
installation can use deterministic transports to test actual local owner logic;
that is explicitly not evidence of live authenticated decisions or services.

The final D subject proposed here adds build/head/expected-plan/human-closure
references beyond the earlier P3 draft. This is an explicit proposed owner
amendment, not a silent claim the drafts already agree. Root must reconcile P3's
finalization subject before a combined runtime release. Original P3 is untouched.

## Verification and scope

Exact shaping envelope: the two linked specs and this note. No ShapingResult,
source, schemas, manifests, charter or original P3 edits. The explicit three-doc
instruction overrides the generic shaping artifact step.

Validation uses the existing frozen spec-linter donor under Node 24.19.0 with
read-only dependencies, plus required-body/local-link checks and git diff --check.
Runtime tests in these specs are future acceptance requirements, not executed
tests or production evidence. Source envelope candidates are listed separately in
each spec; unlocated installation/intake paths remain implementation gates.

No initial model-choice cache events, F-schema-cache routing savings, live proof,
unknown-liability reconciliation or full D5 completion is claimed by P3A/B.

## Delegated design ratification and parent reconciliation — 2026-09-26

Coordinator and independent PMC reviewer approve repaired design
 a75f8d682e565af0413ab6ab9b974dd0a607e50a. All four review findings are closed:
authorized delegated actor attribution, independent P3A acceptance, complete
shared D/E/F lifecycle with synchronous finalizer and role-separated acknowledgements,
and truthful distinction between F receipt emission and actual upstream closure.

The coordinator adopts the closed types, lifecycle and conservative bounds under
the user's blanket goal/prerequisite authority. This is not measured capacity or
runtime authorization. Parent P3 now references the exact P3A subject, result codes,
authorized decision and interface-first sequencing; its old narrower subject and
VERDICT_REFUSED spelling are superseded by P3A's reviewed EVIDENCE_REFUSED contract.
This reconciliation requires separate independent confirmation before combined release.

P3A/B remain nondispatchable until a bounded implementation envelope and genuine
Step0 are accepted. Missing production intake/installation/seal contracts remain
explicit; no approval, CI, merge, Jira, runtime or live measurement is fabricated.
