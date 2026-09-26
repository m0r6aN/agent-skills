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

The coordinator reconciled the parent final-D subject at 1c304f6; independent reviewer B1 approved that reconciliation. This amendment preserves that reviewed subject and does not edit the parent P3 or P3B.

## Verification and scope

Original shaping envelope: the two linked specs and this note. The later offline amendment narrows its own editing envelope to P3A and this note. No ShapingResult,
source, schemas, manifests, charter or original P3 edits. The explicit two-document repair instruction overrides the generic shaping artifact step.

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
Independent reviewer B1 approved the 1c304f6 parent reconciliation; combined runtime release still requires its separate implementation and composition gates.

P3A/B remain nondispatchable until a bounded implementation envelope and genuine
Step0 are accepted. Missing production intake/installation/seal contracts remain
explicit; no approval, CI, merge, Jira, runtime or live measurement is fabricated.

## Offline implementation-slice amendment — 2026-09-26

Root accepted Step 0 at clean 1c304f6d1a18a659d6b8f2c83fd1836ef59e1738 and released
exactly P3A spec plus this note for amendment. This supersedes earlier candidate
source envelopes, not production prerequisite gates. No runtime is released;
independent amended-design review and explicit runtime release remain required.

The exact future five-file envelope is the two new receipts internal/test files,
the two new verification stage-d-finalization/test files, and
`plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p3a-verification.md`,
fully enumerated in P3A. No existing harness/adversarial/pipeline/human-gate hooks
or tests change. No source, public barrel, dependency, schema, manifest, original
P3, P3B or ShapingResult belongs to this two-document amendment.

The spec now freezes constructors, registration, opaque session/work/writer leases,
role-separated workflow/verification/publication/E/F ports and their closed state
snapshots. Setup is explicitly offline-only and module-wide bounded to 32 retained sessions, including held/terminal sessions; creating
another installation cannot reset session admission. Held sessions have no reopen
or reset. The production constructor always returns PREREQUISITE_UNAVAILABLE
before touching input, allocating custody or doing I/O. No mode flag or fixture
upgrade exists. Installation custody is cooperative, not hostile-module security.

The offline driver captures static actual owner exports and invokes the real
harness, review dispatch/collection, verdict assembly/emission and human gate.
Closed fixture data become fixed internal network-incapable matrix/git/Jira
adapters. No supplied HarnessResult, pass, closure or arbitrary owner callback is
accepted. Actual owner execution is genuine; fixture named tests/review text/git
checkout/Jira answers and authorization remain explicitly synthetic. Fixture actor
attribution remains accurate, with no fabricated human or new human-only gate.

Expected fixtures are fixed independently before execution. Actual harness AC
extraction at harness/index.ts:496 and matrix selection at :644 are private;
this slice neither copies them nor invents a production planner. Actual outputs
and emitted payloads must match the complete independent expected set. Production
planning, named-test invocation provenance, reviewer completion, dispositions,
authorized decisions and installation remain separately owned future contracts.

The offline publisher uses the real claim writer and rereads a receipt whose
subject labels offline fixture provenance. It does not prove real denominator or
telemetry completeness. The existing reviewed final-D subject/API stays exact;
domain is retained privately and in driver/fixture/report identity. No receipt
hash or JSON can turn an offline capability into production custody. Real P3 must
supply the production publisher/installation in a later reviewed composition.

P3A freezes and tests all D/E/F registry phases, records and role guards now; the
internal state snapshot contains no capabilities and cannot advance phase. E/F
ports are retained by installation, not leaked through the offline verification
driver. Future joined installation must route those exact ports to actual E/F
owners; that wiring remains a P3B/production composition prerequisite, not an
arbitrary callback registration in this slice. Real runStageE/F acceptance stays
with P3B. Legacy six-stage semantics and full-head gates are unchanged.

Validation for this amendment: frozen donor frontmatter lint, required sections,
local links and exact two-file whitespace/diff inspection. Runtime acceptance is
specified, not run here. No production, D5 completion, savings or live proof claim.
## Shared-chain admission repair

Root and independent B1 review requested one remaining amendment at
 a9cdc51acf19b6a8b977a2a0e2792b82c923596e: per-session busy guards did not prevent
two legitimate installations from writing the same root/workflow chain. Root
accepted Step 0 and released exactly P3A spec plus this note; no runtime is released.

The spec adds only an installation-private third createSessionV1 argument,
ChainKeyV1. Verification derives it from the actual canonical validated root's
bigint unsigned-64 device and positive file ID plus lowercase workflow UUID.
Public fixture input/registration stay unchanged. Receipts captures and compares
closed keys without filesystem imports or treating JSON as authority.

Module-wide tuple reservation is atomic before second custody/effects and remains
nonreclaimable through failed post-reservation setup, held and all terminal phases.
Its capacity shares the existing 32-retained-session cap. New installations,
fixture/provenance labels and Windows spelling/UUID casing cannot reset admission.
Verification rechecks canonical root identity before each writing owner operation;
unsupported/zero file identities refuse, never fall back to textual paths.

Tests require real Windows aliases where supported, explicit unavailable reporting
for a missing genuine short-path alias, symlink/junction refusal, root replacement
and same-chain concurrency/terminal negatives. Separate actual roots and separate
workflow UUIDs are positive controls. Synthetic registry keys prove comparison
only, not filesystem authentication. Cooperative single-process and no-reopen
limitations remain; no hostile-process security claim is added.

The exact five-file future implementation envelope is preserved. Parent 1c304f6
confirmation is now accurately recorded as independently approved by B1; validation
wording now names this exact two-document repair. Frozen lint/body/link/diff checks
precede local handoff; fresh root/B1 review remains required. No runtime tests,
production activation or live evidence is claimed by this documentation change.