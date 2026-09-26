---
ticket: HRO-P3A
title: Authenticated measured Stage D finalization
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: critical
surfaces:
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
4. Genuine human decision intake and actual `prepareHumanGate` /
   `executeHumanGate` completion. Require approved, closed output and exact
   approval/closure/verdict refs; declined, half-closed, missing or fabricated
   decisions hold. Existing human-gate effects require their existing authority;
   this parcel grants no Jira or human-approval authority.

Each captured HarnessResult.claims item must match exactly one returned on-chain
receipt with kind:claim, stage:D, claimRef equal to claim, subjectKind
HarnessClaimResult and identical claim/passed/evidence. Compare full expected
multiset with actual results and refs; reject missing, extra and duplicate
identities. All mandatory claims pass. Review dispatch/findings, verdict and
human-gate receipts similarly retain their actual owner claimRef/subjectKind,
payload and links. Do not synthesize a receipt when a producer did not emit one.

Missing actual upstream producers are explicit prerequisites: authenticated named
test-run intake; completed reviewer-output intake; coordinator-disposition and
human-decision intake; installed workflow composition. Their exact source paths
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

Capture first; set busy before invoking any owner operation and keep it across
awaits. Phases are capturing -> draining -> publishing -> finalized-D, or held.
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
returns the same immutable reference only after verifying unchanged finalized tip.

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

## Acceptance Criteria

| AC | Required evidence |
|---|---|
| 1 | Real harness -> assembler -> verdict emitter -> human-gate closure -> final D under an explicit offline test installation; expected claims/reviews are fixed independently of returned results. Genuine test transports stay labelled offline. |
| 2 | Empty forged pass, omitted/extra/duplicate/foreign AC or matrix claim, fabricated review text/result, wrong reviewer/head, missing disposition, high finding and half-closed/declined human gate each refuse before final write. |
| 3 | Real receipt/envelope payload/ref/hash/claimRef/stage/kind/correlation tampering, rewritten stored hash chain, path escape/symlink and stale build/head each refuse. Mutation controls prove every named gate. |
| 4 | Missing P3 issuer/seal, incomplete denominator, late launch, fake complete record, cloned/session JSON/replayed cross-session capability refuse. Unavailable production intake returns PREREQUISITE_UNAVAILABLE; fixtures cannot activate production. |
| 5 | Busy/reentrant/concurrent finalization, intervening raw writer, exclusive-create conflict and before/after-write faults hold without duplicate or overwrite; acknowledged duplicate returns only the original verified tip. |
| 6 | Every numerical limit and one-over, throwing getters/proxies/ports, cycles, nonfinite values and alias expansion return bounded typed results. No production network, human approval or provider calls in offline verification. |
| 7 | Existing harness/pipeline/human-gate and receipts behavior remains valid; P3B composes the actual final receipt through real E/F with no downstream dependency cycle. Separate implementation acceptance and production activation are reported honestly. |

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

This release permits only this spec, the P3B spec and their companion notes.
Future candidate runtime envelope, NOT released: receipts/src/measured-workflow-internal.ts,
receipts/tests/measured-workflow-internal.test.ts;
verification/src/pipeline/stage-d-finalization.ts,
verification/tests/stage-d-finalization.test.ts. Narrow producer-capture changes,
if necessary, are limited to verification/src/harness/index.ts,
verification/src/adversarial/index.ts, verification/src/pipeline/index.ts,
verification/src/human-gate/index.ts and their existing harness.test.ts,
adversarial-dispatch.test.ts, adversarial-collect.test.ts, pipeline.test.ts, human-gate.test.ts and
human-gate-execute.test.ts. A released implementation spec must select the exact
needed subset. Missing installation/intake file ownership blocks production
dispatch; it does not authorize extra files. No public barrel/schema/manifest edits.

## Verification Plan

Lint frontmatter using the frozen donor, validate required body sections and local
links, inspect the exact three-document diff. Independent reviewers must try a
validly hashed forged pass and complete-looking but omitted expected review.
Runtime acceptance requires actual owner composition and refusal-stage assertions;
isolated fixture success is not production authentication or P3 completion.
