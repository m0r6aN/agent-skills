---
ticket: HRO-P3B
title: Measured Stage D integration and closure profile
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

Allow an authenticated measured final Stage D receipt at its actual sequence to
pass through the real Stage E and F runners. Preserve the legacy six-stage path
and every existing PR-head, chain, integration and closure requirement. This is
a stacked review draft depending on P3A, not production activation.

## Constraints

### Actual predecessor behavior and authority

At the pinned base, `runStageE` checks full prRef/headSha equality, loads the
complete chain and requires kind:stage D at sequence 3. `runStageF` requires
kind:stage E at sequence 4. Both call the real existing emitters with the actual
tip. A claim receipt cannot replace a stage predecessor. Existing emitters alone
are not equivalent to running those gates.

P3B imports only the P3A dependency-neutral private receipts contract. No
integration -> verification or dispatch import is introduced. It never mints a
finalization capability from disk or a public function argument. Same-process
installation authority is cooperative, not protection against hostile code with
access to internal issuers. Production installation and P3 telemetry remain
prerequisites; absent genuine composition refuses the measured profile.

### Closed runner amendment

Proposed additive RunStageEArgs and RunStageFArgs member:
`measuredSession?: object`. Omitted means legacy path with unchanged D3/E4 checks.
An explicitly supplied invalid value never falls back to legacy. No public mode
string, arbitrary expectedSequence, skipValidation flag or supplied priorReceipt
is introduced. The private registry resolves the object to installed workflow,
repo root, correlation, verified head, expected plan and acknowledged final D.
Existing runner result types remain ReceiptDocument; existing typed error style
is retained, with proposed closed error codes MEASURED_SESSION_REFUSED,
MEASURED_EVIDENCE_REFUSED and MEASURED_WRITE_UNCERTAIN for new failures. Exact
error union amendment belongs to this parcel; no generic exception leakage.

For E, validate prRef using real parsePrRef and retain its exact full-head
comparison. Also require that head equals P3A's verifiedHeadSha; later PR changes
need a new reviewed verification scope, never an updated registry field.
Load the complete on-disk chain using the existing runner scan, with measured
count/byte limits checked before allocation and reads; do not validate a bounded
copy and then repeat an unbounded scan. Preserve the legacy scan contract. Require the
current tip to equal the registered final D ref, kind:stage, stage:D,
subjectKind:MeasuredVerificationHandoff, claimRef:null and the exact closed P3A
subject. Validate every linked build/verdict/human/telemetry ref belongs to that
chain and agrees with the installed captured manifest. Preserve expected plan,
denominator and complete coverage bindings; self-hashed documents are not proof
of installed execution. Recompute every receipt hash outside the receipts
package using existing approval canonicalize/sha256Hex; do not weaken legacy
validateChain or infer authentication from its stored-link comparisons.

The only changed sequence rule is for this authenticated profile: final D at N,
real emitIntegrationReceipt writes E at N+1 with prevHash D.hash. No intervening
claim is accepted. Capture the real acknowledged E document/ref and existing
IntegrationResult prRef/ciJobs/auditTrigger in the private session. These values
retain their existing caller/owner contract; this amendment does not upgrade
supplied CI or audit values into independently authenticated GitHub results.
The authorized workflow must retain the existing real gate assembly and human
merge controls. No weakening, fabricated success or bypass via raw emitter.

For F, require the same session's acknowledged E receipt as exact current tip,
kind:stage E, subjectKind:IntegrationResult, claimRef:null. Validate E's actual
predecessor is that session's final D and repeat the measured chain/profile/head
bindings. Run real emitClosureReceipt with the actual E tip so F is N+2 and links
to E.hash. Keep actual ClosureRecord and existing closure/gate ownership intact.
F cannot adopt an arbitrary E at a larger sequence, a half-closed claim or a
serialized prior session. This parcel adds no merge, Jira or retry authority.

### Lifecycle, writes and bounds

The same cooperative session serializes finalized-D -> integrated-E -> sealed-F.
Set busy before callbacks and retain it across any await. No later measured
launch is allowed. Wrong phase, duplicate/reentrant E/F or concurrent writer
refuses before effects. Existing legacy duplicate behavior is unchanged.
The new measured path uses exclusive file creation through an installation-owned
write function captured by the runner, not caller writeFn. Supplying writeFn in
measured mode refuses; existing legacy test seam remains unchanged. This private
writer uses the existing document/locator bytes and never implements an alternate
Stage E/F draft. It may not bypass real emitIntegrationReceipt/emitClosureReceipt.

After acknowledged write, reread and validate before advancing the registry.
Ambiguous write or unexpected tip holds the session; do not retry automatically,
overwrite, truncate, mint replacement IDs or restore capabilities from JSON.
Restart continuation is unsupported. Independently invoked raw writers and
hostile processes are outside cooperative exclusion; detected changes hold.
P3A's session, chain, document, aggregate, depth, node and string bounds apply.
Validate newly appended E/F within those limits, reserving two remaining receipt
slots at final-D admission; exhaustion holds before E writes. Closed errors do
not expose prompts, credentials, raw reviews or receipt contents.

### Release sequencing

P3A freezes the private contract before P3B implementation. P3B offline acceptance
uses actual P3A finalization followed by the real E/F runners in a labelled test
installation. It can complete without production telemetry or network effects.
Production activation still requires genuine P3 collector/seal, installed input
provenance and real owner composition; no test installation can be selected by
task payload. No claim of HRO metrics, live proof or cache completion follows.

## Acceptance Criteria

| AC | Required evidence |
|---|---|
| 1 | Existing legacy A0/B1/C2/D3/E4/F5 path remains valid through real runners; all existing wrong-stage/sequence/head/chain and closure tests still pass. |
| 2 | Actual P3A producer with real harness/verdict/closure claims -> final D at N>3 -> real runStageE N+1 -> real runStageF N+2; assert every kind/stage/claimRef, subject/ref, head, correlation, sequence and recomputed hash. |
| 3 | Raw D claim, arbitrary longer stage chain, fabricated pass/subject, unknown/serialized/cloned capability, foreign workflow/root, missing/changed seal or expected plan cannot select measured profile or fall back to legacy. |
| 4 | PR-ref full-head mismatch, head changed since verification, mutated CI/audit result binding, modified predecessor refs, stored-hash rewrite and cross-session E/F each refuse at their named gate before write. Preserve actual gate/closure composition. |
| 5 | Intervening append, duplicate sequence, filename lie, path escape, chain gap, claim tip, wrong E-to-D linkage and bounded-read overflow refuse; mutate each dimension independently. |
| 6 | Busy, repeated/reentrant E/F, caller writeFn, exclusive-create collision, pre/post-write fault and process loss produce no duplicate or overwrite; uncertain state cannot become sealed. No merge/Jira/provider effects in offline suite. |
| 7 | No integration->verification/dispatch import, no public receipts barrel/schema/manifest change, no emitter shortcut. Production remains unavailable without actual installation/provenance/telemetry owners. |

## Out of Scope

Changing legacy sequence semantics, general arbitrary-sequence acceptance,
cryptographic authenticity from self-hashes, hostile-process locks, restart
recovery, test-run/review/human-decision producers, telemetry collection, new
ledger exports, merge authorization, transport or production activation.

## Context & References

- [P3A finalization contract](HRO-P3A-authenticated-stage-d-finalization.md)
- [Owner prerequisite notes](../../goals/hybrid-routing-optimization/hro-p3-owner-prerequisites.md)
- [P3 telemetry draft](HRO-P3-correlated-receipts.md)
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md)

## Allowed Files

This release permits only this spec, P3A and their companion notes. Proposed
future runtime envelope, NOT released: integration/src/exit-vehicle.ts,
integration/src/measured-profile.ts, integration/tests/measured-profile.test.ts,
integration/tests/exit-vehicle.test.ts and integration/tests/closure.test.ts.
The private module imports the P3A private receipts contract and existing
dependency-safe utilities; it returns closed internal results. The runner maps
those results to its existing local ExitVehicleError class, avoiding a
measured-profile -> exit-vehicle -> measured-profile cycle. Changes to the shared
contract must land through P3A first. No
receipt.ts/closure-receipt.ts change is presumed necessary: their existing private
write seam accepts the installation-owned exclusive writer. If actual integration
needs additional paths, stop and amend the envelope before implementation.

## Verification Plan

Frozen linter, required body, local-link and exact-document diff checks precede
handoff. Independent review must attempt an arbitrary D stage at sequence 7 and
an E receipt not produced by this session. Runtime acceptance requires P3A->E->F,
legacy regression and mutation controls, not helpers that bypass runStageE/F.
