# U1 evidence contract — draft for independent review

Status: **DRAFT SHAPING ONLY**. This document proposes the missing acceptance contract under charter §14 INF-4 and Adoption dependencies and evidence ownership. It changes no charter, loop, source corpus, active spec, Allowed Files, runtime capability or approval gate. No implementation, independent verification or external infrastructure configuration is claimed.

Source inspected: coordinator HEAD `5b9b72264159f5726cb4d86044b1a8df45852f20`, `plugins/foreman-line/docs/goals/foreman-kernel/charter.md` §6 P18/P19/P21 and §14. No active or done FK-P18, FK-P19 or FK-P21 spec was found by filename search under docs/specs; their exact paths, interface placement and write ceilings remain shaping work. The earlier parked A2 drafts are historical problem analysis, not imported authority. Provider-specific capability claims require fresh verification before selection.

## Outcome and graph

U1 closes for implementation dispatch only when an independently reviewed contract identifies a workable verifier trust boundary, concrete evidence producers and consumers, and the selected environment's supported evidence path. It closes for enforcement promotion only when FK-P19 has independently verified complete evidence for the exact candidate and refusal classes being promoted. Ratifying this draft alone satisfies neither condition.

Existing edges remain unchanged: P18 depends on P17; P19 depends on P17 and P18; P21 depends on P19 and P20. P18 owns the evidence interface and producer implementation; P19 consumes that interface and writes its own verification decision before promotion; P21 packages already retained evidence. A P21 manifest is never a prerequisite whose future absence makes a P19 predicate vacuously true. No new parcel or distributed execution service is created.

The contract is an independent CI-backstop evidence contract, not a host-parity or latency contract. It does not widen D20, alter either D21 span, relax the 1000 ms deadline, or make P18 CI timing an authoritative Windows measurement. No tool gains approval, merge, receipt-minting, generic external-write or signing-service authority. Human Gate3 remains a separate prerequisite for merge.

## Responsibility and trust boundary

| Actor / parcel | Must produce or do | Must not claim or control |
|---|---|---|
| Coordinator before P18 dispatch | Resolve open selection facts below; record protected verifier revision, identities, workflow ownership, exact Allowed Files and protection evidence; obtain independent contract review | Cannot declare a workflow protected merely because its filename is in Git or appoint its own result as an independent verdict |
| P18 producer | Implement exact-scope, enrollment, state/evidence and dirty-reviewer checks; emit complete source-bound observations, controls and evidence bundle; retain artifacts before handing off | Cannot bless its own bundle as independently verified or modify provider settings through a repo-file grant |
| P18 independent reviewer | Examine actual input/control surfaces and the shared-code inventory; witness hostile controls and verify evidence producer behavior | Must not be the builder/rework writer under another role label |
| P19 independent evidence verifier | Retrieve expected inputs and trust material outside the producer's claim; authenticate run/execution evidence through the selected method; recompute digests; evaluate negative controls; write candidate-bound decision | Cannot trust a producer-authored `passed`, runner label or verification summary as the sole proof; cannot run on the suspect producer runner and call that out-of-band verification |
| P19 promotion consumer | Require an ACCEPT decision for the exact promotion subject and all required classes, plus the existing promotion prerequisites; record cited bundle and decision digests at promotion | Cannot select convenient historical runs, ignore missing checks or treat acceptance as human Gate3 |
| P21 retention consumer | Consolidate exact artifacts already cited by P19; demonstrate retrieval and independent digest verification; publish final assurance categories and gaps | Cannot replace originals, reconstruct missing evidence, generate a retrospective decision or first create evidence required before promotion |

The independence claim is resistance to the declared builder/producer-controlled inputs and execution path, not resistance to every administrator or host compromise. Separate hosts alone are insufficient. The selected path must identify who can change the verifier code, workflow/reusable workflow, action revisions, inputs, runner target/configuration, expected-result oracle and retention destination. Evidence for provider-side controls is collected through separately authorized observation, not inferred from a repository file.

For every protected invariant, the backstop must independently derive its verdict from the relevant candidate input. Shared parsing or utilities are enumerated with digests and their failure consequences. Reusing the hook's final verdict, authorization result, compiled output or success flag without independent derivation is insufficient. A token independent check cannot excuse shared blind spots in the required invariants. Shared-code risk is assessed per invariant; required coverage cannot be reclassified as a harmless residual merely to obtain ACCEPT.

## Closed evidence interface proposal

P18 will own version `u1/0.1.0` of the following JSON interface. These are draft contracts, not an instruction to create files now. All objects reject unknown fields; arrays are bounded in the eventual schema. Mandatory arrays are nonempty unless their definition explicitly permits empty. Strings, payload sizes and nesting limits must be fixed before P18 dispatch. The canonical JSON encoding and digest implementation must reuse a reviewed deterministic repository contract or be explicitly named in the P18 spec; no implicit serializer-dependent hash is acceptable.

Primitive shapes:

```text
Digest = { algorithm: "sha256", hex: 64 lowercase hexadecimal characters }
Artifact = {
  logicalId: nonempty unique string,
  mediaType: nonempty string,
  byteLength: nonnegative integer,
  digest: Digest,
  relativePath: normalized relative path inside the evidence package
}
Source = {
  repositoryId: canonical SCM repository identity,
  commit: full Git object ID with declared object format,
  treeDigest: Digest
}
CodeInput = { logicalId: string, source: Source, path: exact relative path, digest: Digest }
ExecutionIdentity = {
  provider: selected provider identifier,
  repositoryId: canonical repository identity,
  workflowId: provider workflow identity,
  runId: provider run identity,
  attempt: positive integer,
  jobId: provider job identity,
  event: event/context name
}
```

Paths are transport-relative artifact locations, never arbitrary host read capabilities. Readers refuse absolute paths, traversal, duplicate logical IDs/paths, symlink/reparse escapes, non-regular files, byte-length mismatch and digest mismatch. Secrets, raw bearer/OIDC tokens, signed download URLs and reusable credentials are excluded. Public verification certificates/attestations may be retained only when they are non-secret evidence rather than live admission capabilities.

`U1EvidenceBundle`:

```text
{
  schemaVersion: "u1/0.1.0",
  subject: {
    candidate: Source,
    contractDigest: Digest,
    policyDigest: Digest,
    compiledScopeDigest: Digest,
    enforcementEnvironmentManifest: Artifact,
    requiredInvariantIds: unique string[],
    promotedRefusalClassIds: unique string[]
  },
  execution: ExecutionIdentity,
  producerIdentity: Artifact,
  verifierCode: CodeInput[],
  workflowCode: CodeInput[],
  actionInputs: Artifact,
  toolchainManifest: Artifact,
  imageManifest: Artifact,
  configurationManifest: Artifact,
  independenceModel: Artifact,
  executionProvenance: Artifact[],
  observations: Artifact[],
  negativeControls: Artifact[],
  retentionPlan: Artifact,
  artifactInventory: Artifact[]
}
```

`artifactInventory` lists every referenced artifact exactly once, including transitive references. No artifact may refer outside that complete package without an explicit retrieval entry and included retained bytes. The bundle itself is hashed externally by the consumer; no circular self-digest field is needed. Image/toolchain manifests represent absence explicitly with a typed reason where a component is genuinely not used, rather than an empty tag or invented digest. Required enforcement image identities remain required for promotion even if a particular CI checker runs without a container.

Required artifact contents:

| Artifact | Required information |
|---|---|
| Enforcement environment manifest | D20 host identity/capability record and pinned image/tool/policy/configuration digests being promoted; prepared before P19, even though P21 later consolidates it |
| Producer identity | Producer role, authenticated execution principal or provider identity and evidence origin; self-declared display name distinguished from authenticated identity |
| Action inputs | Exact action/reusable-workflow repositories, immutable revisions/content digests, resolved inputs; no mutable tag alone |
| Toolchain manifest | Exact runtime, package manager, OS/runner image identity as obtainable, dependency lock/input digests; record unavailable identity granularity as an explicit gap |
| Image manifest | OCI content digest plus build provenance/source/configuration when containers are used; tags only navigation labels |
| Configuration manifest | Effective verifier/runner configuration and source, mount/network/credential capability envelope, environment allowlist, mutable external variables and their observed values or safe digests; secret values excluded |
| Independence model | Per-invariant verifier/oracle ownership, builder-controlled inputs, shared dependencies, runner lifecycle/isolation, trust roots and change controls, hostile-input exposure; separate ambient-isolation and host-compromise claims |
| Execution provenance | Selected independently checkable run/job/source/workflow binding and execution-environment evidence; separately obtained provider observation where the contract uses provider infrastructure |
| Observation | Invariant ID, exact input artifacts, expected-result oracle identity, command/arguments or tool invocation, start/end observation, exit status, stdout/stderr artifact references, actual result and reason |
| Negative control | Control ID, baseline input digest, exact mutation artifact, expected invariant/refusal code, observed result, complete command outputs and exit status, independent evaluator identity/evidence |
| Retention plan | Concrete protected destination IDs, custodian, authorized readers, retention interval/deletion policy, retrieval method, trust-material retention, backup/recovery route and last retrieval-check evidence |

Credentials are described by capability and issuance scope without retaining credentials themselves. Omitted or redacted material must have an explicit reason; if redaction removes information necessary to verify an invariant, the evidence is incomplete rather than accepted on trust.

## Consumer interfaces and decisions

Proposed logical interfaces, to be assigned exact file/API ownership during shaping:

```text
P18 produceEvidence(immutableExpectedSubject, candidateInputs) -> U1EvidenceBundle
P19 verifyEvidence(immutableExpectedSubject, bundleBytes, retainedArtifacts,
                  independentlySelectedTrustPolicy) -> U1VerificationDecision
P19 evaluatePromotion(existingPromotionPrerequisites, expectedSubject,
                     verificationDecision) -> existing promotion disposition
P21 retainEvidence(citedBundleDigest, citedDecisionDigest, retainedArtifacts)
                   -> retrieval verification record
```

The expected subject and trust policy must come from reviewed coordinator/parcel authority, not from the bundle being verified. Bundle claims cannot select their own trusted signer, acceptable runner, candidate SHA, expected invariant set or policy digest. P19's verification identity is mechanically distinct from the P18 producer occupancy, and the independently selected verification context is recorded.

`U1VerificationDecision` is a closed object containing schemaVersion, expectedSubjectDigest, bundleDigest, trustPolicyDigest, verifierCodeDigest, verifierContext artifact reference, checkedAt timestamp, status, reasonCodes, perInvariantResults, independentlyCollectedArtifacts and retrievalCheck artifact reference. All artifact references follow the same shape/inventory rules. Status is exactly one of:

| Status | Meaning | Promotion effect |
|---|---|---|
| ACCEPT | All required evidence verified, all required controls and invariant checks satisfied, subject matches, protected retention and retrieval demonstrated | Eligible U1 input to existing P19 gate; not approval or merge authority |
| INVALID | Malformed/mismatched/tampered evidence, failed invariant/control, unprotected required boundary, or falsely asserted identity | Refuse promotion; targeted repair required |
| INCOMPLETE | Required evidence/configuration/retention/check is absent or cannot establish the required claim | Refuse promotion; name missing producer/owner |
| UNSUPPORTED | Selected provider/event/environment fundamentally cannot produce required independent evidence | Refuse promotion; no retry toward eligibility; select and review a supported path |
| UNAVAILABLE | Previously supported evidence retrieval/verification temporarily unavailable for an identified external reason | Refuse promotion for this attempt; bounded retry only |

Proposed retry bound for review: at most three total attempts over at most 24 elapsed hours for one fixed subject, whichever limit comes first; exhausted availability becomes INCOMPLETE with `U1_AVAILABILITY_EXHAUSTED`, a stop report and a named owner. No indefinite retry or automatic host/provider change. This is a proposed contract bound, not a claim the user already chose those numbers. Interrupted retries resume from the recorded attempt count; changing ownership does not reset it.

Reason-code families are closed and must be finalized in P18's interface before dispatch: `U1_SUBJECT_MISMATCH`, `U1_ARTIFACT_INVALID`, `U1_PROVENANCE_INVALID`, `U1_INDEPENDENCE_UNPROVEN`, `U1_CONTROL_FAILED`, `U1_REQUIRED_EVIDENCE_MISSING`, `U1_RETENTION_UNPROVEN`, `U1_CONTEXT_UNSUPPORTED`, `U1_PROVIDER_UNAVAILABLE`, `U1_AVAILABILITY_EXHAUSTED`. Per-invariant results include exact invariant ID, status and evidence digests. No required invariant can disappear from a result or become optional because its producer failed.

A contract/policy/candidate/verifier/workflow/environment identity change requires a newly matched verification decision. The previously accepted bundle remains immutable historical evidence. P19 records the exact bundle/decision/run/job digests cited at promotion; later P21 assembly cannot replace them with a newer convenient run.

## Retention and retrieval

Before P18 dispatch, select and review concrete destinations, authorized readers/custodian, duration, deletion policy and recovery procedure. Before P19 ACCEPT, retained copies and a retrieval trial from the independent consumer context must exist. Record a definite `retainUntil` or a reviewed lifecycle criterion; `forever`, a CI URL, an expiring signed link or an unspecified provider default is not a retention contract.

P18 writes only its authorized local evidence/workflow outputs. Upload, runner provisioning, protection settings or repository policy changes require actual external-effect authority and a separately identified actor; this draft authorizes none. If available authorized storage cannot meet the contract, report INCOMPLETE and retain upstream progress without promotion. P21 verifies that the originals and their trust material remain retrievable and digest-matching, then binds them into the exit manifest. Loss after an earlier acceptance is a newly reported evidence failure, not permission to recreate historical output.

## Required hostile controls and acceptance evidence

Each control has a source-authored expected outcome, immutable baseline and an isolated mutation. Tests must retain direct exit status and full output; a test that merely checks a producer-authored `pass` is insufficient.

1. Intentionally bypass hook mediation and introduce an out-of-scope mutation. P18's independent backstop detects it; P19 refuses promotion for that subject.
2. Missing/disabled enrollment, stale or mismatched state evidence, and dirty reviewer worktree each fail their required invariant independently.
3. Replace the hook verdict/compiled result with an apparently successful value while underlying candidate scope or evidence violates the rule. Independent derivation still detects the violation.
4. Change verifier/workflow/action/configuration via a builder-controlled input or mutable indirection. Either the protected path prevents it with separately evidenced control, or the evidence fails the selected identity/control contract. Never infer prevention from CODEOWNERS presence alone.
5. Substitute a different candidate, run attempt, job, repository, workflow revision, policy or environment identity; replay a valid old bundle; P19 refuses mismatches.
6. Spoof a runner label or self-attested producer verification result. It cannot satisfy the selected independent provenance method. A container/VM on the suspect host must not count as independent solely through a new instance ID.
7. Delete a required artifact, truncate output, falsify exit status, alter bytes, duplicate IDs, traverse paths or insert links/non-files. Reject before consuming unsafe artifacts.
8. Drop a required negative control or replace its oracle with builder-supplied expected output. Refuse completeness/independence rather than shrinking the invariant denominator.
9. Producer alone writes ACCEPT-looking material. P19 ignores that as a verdict and independently recomputes its decision using trusted expected subject and policy.
10. Unsupported event/context is terminal UNSUPPORTED; missing permissions/evidence is INCOMPLETE/INVALID as appropriate, never infinite UNAVAILABLE. Exercise retry exhaustion and resumed attempt accounting.
11. Retention access expires or consumer lacks access; missing trust material prevents later verification. P19/P21 report retention failure rather than citing the CI URL as durable proof.
12. Positive control: an unchanged valid subject with independently checkable execution/control evidence, all required negative controls and a successful retrieval trial yields ACCEPT. It still cannot satisfy human Gate3 or any other existing promotion prerequisite by itself.

The review package must include an invariant-to-control matrix, shared-code analysis, exact evidence sample, decision schema fixtures for every status, rejected mutation results, independent reviewer identities and the external-fact verification record. P18 acceptance demonstrates the producer/interface contract; P19 acceptance demonstrates independent consumption and pre-promotion binding. A passing schema fixture is not live infrastructure proof.

## Unresolved selection facts and affected gates

| Fact to resolve | Owner | Blocking point |
|---|---|---|
| Provider/event combination and supported independently verifiable provenance artifact; trust roots and long-term verification method | Coordinator with independent reviewer; verify against current primary sources and actual account capabilities | P18 implementation dispatch |
| Actual protection of verifier/workflow/configuration, allowed builder inputs and runner lifecycle; distinguish repo-observable facts from provider settings | Coordinator/operator supplies observed evidence; independent reviewer evaluates | P18 dispatch; exact run rechecked before P19 ACCEPT |
| Concrete independent P19 verification context and authenticated identity, separate from producer and builder | Coordinator | P18 dispatch interface feasibility; P19 acceptance |
| Exact artifact/schema paths, package/workflow serialization owners, payload/path/count limits and canonical JSON contract | P18 shaping with P19/P21 interface review | P18 dispatch |
| Retention destinations, access, duration, custodian and restore/retrieval procedure within actual authority | Coordinator/operator; P21 reviews consuming requirements early | P18 dispatch contract selection; P19 ACCEPT requires actual retained/retrieved evidence |
| Three-attempt/24-hour bound and stable status/code details | Coordinator contract review | P18 dispatch |
| Full set of invariants and promoted refusal-class IDs supplied by P17/P19, including shared-code risk per invariant | P18/P19 shaping from existing accepted contracts | P18 dispatch; exact promotion subject at P19 |

These unresolved facts are neither approvals to request again by default nor claims that the environment lacks the required capabilities. They are concrete work for the coordinator to resolve under existing authority. They hold affected U1 implementation/promotion gates only. P0 recovery, P1 contracts, evaluator work and other orthogonal authorized preparation may continue.
