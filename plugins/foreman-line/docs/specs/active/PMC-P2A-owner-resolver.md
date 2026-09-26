---
ticket: PMC-P2A
title: Pure versioned PMC owner resolver
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/routing-policy/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Provide the single PMC v1 resolver consumed by the controlled launcher and HRO.
Given validated policy and authenticated evidence supplied by its trusted caller,
return a deterministic selection or stop decision with all ranking inputs.
Neither decision kind is executable launch authority.

## Constraints

- Sequential after accepted PMC-P1a/P1b and the RCM public fact-consumer handoff.
  Record exact commit and supported exported types before building. No duplicate
  policy validator, RCM internal import, schema alteration or competing HRO ranker.
- Legacy v0 evaluateRouting behavior remains unchanged. Amendment 05 V1 is now
  recorded in both owning charters before dispatch; explicit v1 owns PMC ranking.
  This is not an implicit v0 migration.
- Node 24.19.0, existing TypeScript/node:test/Ajv tooling; no new dependencies.
  Pure module: no IO, ambient clock, randomness, secrets, Pi, network or ledger
  mutation. All time, evidence and budget snapshots are explicit inputs.
- P1 evidence fields represent claims, not authenticity. The external trusted
  evidence port must bind actual receipt digests, subject identity, lane, scope,
  source, expiry and evidence state. A caller-supplied recorded:true is insufficient
  for launch; P2C acquires and authenticates these inputs before invoking P2A.
- Reuse P1 bounds and refusal discipline; reject malformed/hostile/oversized input
  with bounded code/path output, no untrusted evidence text in refusals.

### Bounded public contract proposed for independent review

This is a DRAFT contract freeze proposal, not dispatch authority. Inspected
predecessors: PMC-P1a `12b0aa07560d1f516aec255c42a7f79dc2aed449` exports
`ProviderBindingPolicyV1`, `BindingEvidenceV1`, `EvidenceValue`, `EvidenceState`,
`PmcLaneId`, `PmcProvider`, `LanePolicyV1`, `ProviderBindingValidationErrorV1`
and `validateProviderBindingPolicyV1`. RCM wrapper
`4201ac4edf8069efa0857d9841341d62b2429648` exports
`evaluateCatalogEligibility`, `CatalogEligibilityInput/Result`, `EligibilityFacts`,
`Provenance`, `IdentityRefusalCode`, `SnapshotLevelRefusalCode` and
`CatalogAdapterRefusalCode`. These heads were inspected read-only; their presence
is not acceptance of their eventual combined integration. P1b's
`ProviderBindingProjectionV1` remains SPEC-ONLY: its lossless envelope is
`{schemaVersion:'pmc-provider-binding-projection/v1', evidenceOnly:true,
policy:ProviderBindingPolicyV1}`. Pin its actual accepted export/commit before build.

Export only `resolvePmcRouteV1(request: unknown, context: unknown):
PmcRouteDecisionV1` and the concrete public types below from the existing barrel.
The function is synchronous and total for bounded ordinary data. No callback,
IO port, signer, evidence authenticator, ledger mutation or executable permit is
accepted or returned. All records are closed, all listed properties required;
`null` is explicit absence, never omission/default. Arrays and results are deeply
readonly, owned copies. Aliases below express validated refinements, not casts.

```typescript
type Digest = string; // exactly 64 lowercase hexadecimal characters
type Id = string;     // ASCII [A-Za-z0-9][A-Za-z0-9._:-]{0,127}
type Text = string;   // 1..2048 UTF-16 code units, exact, no normalization
type UInt = number;   // integer 0..Number.MAX_SAFE_INTEGER
type Utc = string;    // round-trip YYYY-MM-DDTHH:mm:ss.sssZ
type DataClass = 'public' | 'internal' | 'restricted';
type Rational = Readonly<{ numerator: string; denominator: string }>;
// Canonical unsigned integers, <=64 decimal digits each, denominator >0,
// gcd=1, zero only 0/1. This is a VALUE port, not provider rate parsing.
type EvidenceRef = Readonly<{
  receiptId: Id; receiptDigest: Digest; sourceRef: Text; sourceDigest: Digest;
  policyDigest: Digest; configDigest: Digest; requestDigest: Digest;
  lane: PmcLaneId; bindingId: Text | null;
  evidenceState: EvidenceState; observedAtUtc: Utc; expiresAtUtc: Utc;
}>;
type Claim<T> =
  | Readonly<{ status: 'unknown' }>
  | Readonly<{ status: 'supplied'; value: T; evidence: EvidenceRef }>;
type ReviewSubject = Readonly<{
  subjectId: Id; role: 'builder' | 'coordinator'; artifactDigest: Digest;
  instanceId: Claim<Id>; family: Claim<Text>;
}>;
type IndependenceObligations = Readonly<{
  policyAuthorityRef: Text; policyAuthorityDigest: Digest;
  determinationId: Id; determinationDigest: Digest; artifactDigest: Digest;
  currentSelection: Readonly<{
    excludedInstanceIds: readonly Id[]; excludedFamilies: readonly Text[];
    subjectIds: readonly Id[];
  }>;
  futureReview: Readonly<{
    duty: 'separate-l2-review' | 'parcel-review';
    subjectBindingId: Text; subjectInstanceId: Id; subjectFamily: Text | null;
    distinctInstance: true; differentFamily: boolean;
  }> | null;
}>;
type PmcRouteRequestV1 = Readonly<{
  version: 'pmc/v1'; workflowId: Id; taskId: Id; episodeId: Id; requestId: Id;
  requestDigest: Digest; lane: PmcLaneId;
  subRole: LanePolicyV1['subRoles'][number];
  routingClass: LanePolicyV1['routingClasses'][number]; dataClass: DataClass;
  requirements: Readonly<{
    toolUse: boolean; structuredOutput: boolean; reasoning: boolean;
    thinkingLevel: 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
    inputModalities: readonly ('text' | 'image')[];
    requiredContextTokens: UInt; requiredOutputTokens: UInt;
    maximumInputTokens: UInt; maximumOutputTokens: UInt;
    rankingTokens: Readonly<{ input: UInt; output: UInt }> | null;
  }>;
  attempt:
    | Readonly<{ kind: 'initial' }>
    | Readonly<{ kind: 'fallback'; priorRequestId: Id;
        priorDecisionDigest: Digest; priorRequestDigest: Digest; primaryBindingId: Text;
        priorDisposition: Claim<'terminal-no-send' | 'terminal-failed-settled' | 'uncertain'>;
        primaryQuality: Claim<number> }>;
}>;
type CatalogClaim = Readonly<{
  source: Claim<Readonly<{ profileId: Text; profileVersion: Text;
    profileDigest: Digest; snapshotDigest: Digest; configAuthorityRef: Text }>>;
  provenance: Provenance;
  results: readonly (
    | Readonly<{ provider: PmcProvider; providerModelId: Text;
        outcome: 'facts'; facts: EligibilityFacts }>
    | Readonly<{ provider: PmcProvider; providerModelId: Text;
        outcome: 'refused'; codes: readonly IdentityRefusalCode[] }>
  )[];
}>;
type BindingClaims = Readonly<{
  bindingId: Text;
  protocol: Claim<Text>; catalogBaseUrl: Claim<Text>;
  family: Claim<Text>; instanceId: Claim<Id>; frontier: Claim<boolean>;
  dataClasses: Claim<readonly DataClass[]>;
  transport: Claim<Readonly<{ data_collection: 'allow' | 'deny'; zdr: boolean }>>;
  toolUse: Claim<boolean>; structuredOutput: Claim<boolean>;
  enabled: Claim<boolean>; available: Claim<boolean>; quality: Claim<number>;
  cost: Claim<Readonly<{
    currency: 'USD'; maximumMicroUsd: UInt;
    maximumInputTokens: UInt; maximumOutputTokens: UInt;
    sourceProfileId: Text; sourceProfileVersion: Text;
    sourceProfileDigest: Digest; tariffDigest: Digest; priceEvidenceDigest: Digest;
    costValueDigest: Digest;
    ranking:
      | Readonly<{ kind: 'projected'; inputTokens: UInt; outputTokens: UInt;
          usd: Rational }>
      | Readonly<{ kind: 'unit-price'; outputUsdPerMillion: Rational;
          inputUsdPerMillion: Rational }>;
  }>>;
}>;
type PmcResolverContextV1 = Readonly<{
  projection: ProviderBindingProjectionV1; policyDigest: Digest;
  configDigest: Digest; evaluationTimeUtc: Utc;
  evidenceMode: 'supplied-production-claims' | 'synthetic-offline';
  catalog: CatalogClaim;
  episode: Claim<Readonly<{
    episodeId: Id; workflowId: Id; taskId: Id; lane: PmcLaneId;
    version: 'pmc/v1'; policyDigest: Digest; configDigest: Digest;
    attempts: readonly Readonly<{
      requestId: Id; requestDigest: Digest; decisionDigest: Digest;
      bindingId: Text; provider: PmcProvider; matrixRole: 'primary' | 'fallback';
      disposition: 'terminal-no-send' | 'terminal-failed-settled' | 'succeeded' | 'uncertain';
    }>[];
  }>>;
  freshness: Claim<Readonly<{ maximumAgeMs: UInt }>>;
  independence: Claim<Readonly<{
    policyAuthorityRef: Text; policyAuthorityDigest: Digest;
    determination: Claim<Readonly<{
      determinationId: Id; determinationDigest: Digest; artifactDigest: Digest;
      reviewedLane: 'L1' | 'L3' | 'L4' | 'L5';
      differentFamilyRequired: boolean;
    }>>;
    artifactDigest: Digest; subjects: readonly ReviewSubject[];
  }>>;
  budget: Claim<Readonly<{
    ledgerId: Id; epoch: Id; scopeId: Id; workflowId: Id; accountId: Id;
    routingClass: PmcRouteRequestV1['routingClass']; currency: 'USD';
    authorizedLimitMicroUsd: UInt; classCeilingMicroUsd: UInt;
    settledMicroUsd: UInt; outstandingMicroUsd: UInt; frozen: boolean;
    ceilingAuthorityRef: Text; ceilingAuthorityDigest: Digest;
    snapshotDigest: Digest;
  }>>;
  bindings: readonly BindingClaims[];
}>;
```

`CatalogClaim` is a bounded value adapter over the public RCM result, not a new
projector. P2C calls the supported RCM wrapper, requires `stage:'projector'` and
`result.ok:true`, validates each `requested.provider/id` as concrete strings,
and maps them verbatim to `provider/providerModelId`. P2A does not import RCM
internals, accept a fabricated reader-branded snapshot or repeat RCM's reader.
RCM adapter/reader/snapshot failures stop composition; P2C preserves their public
codes. P2A validates supplied provenance, exact identity/result scope and every
fact used here. A fabricated successful RCM result remains a claim, not proof.
Numeric RCM rates remain catalogue facts, never the exact money source.

Context authority is supplied by the trusted composition boundary, never request
fields: task input cannot set independence obligations, exclusions, frontier
classification, evidence sources, budget authority or a winner. P2C authenticates
all receipt/source digests and their content, request/subject/lane/config/policy
bindings, exclusion completeness and budget freshness before production use.
P2A can only check internal consistency of those claims. Do not label a claim
`authenticated`, or upgrade P1 `recorded`/`owner-accepted` to authenticity.

### Validation, scope and refusal precedence

Request snapshot precedes context access. Reject accessors, symbols, hidden or
extra properties, sparse/extended arrays, cycles, nonplain prototypes, nonfinite
numbers and functions without invoking getters, iterators or `toJSON`. Catch
boundary failures into fixed codes without inspecting thrown objects (no
instanceof, name/message reads, coercion or caller-controlled error formatting).
Only the owned captured snapshot reaches validation, comparison and output;
no caller references escape. Reflective Proxy traps cannot be made a
hard execution-time sandbox, so hostile executable objects are outside the
ordinary-data termination guarantee. Bound each request/context traversal to
65,536 visited values/keys, depth 16, individual strings 2048 UTF-16 units and
aggregate strings 1,048,576 units; count repeated references by expanded size.
P1 validation retains its existing independent bounds and vocabulary. No silent
truncation, saturation, normalization, overflow, field coercion or default.

Array caps: 256 bindings/catalog results; 64 review subjects, excluded families,
instance IDs and subject IDs; two episode attempts; two modalities; 11 identity
refusal codes; all arrays duplicate-free. Review subjects have unique subjectId;
episode attempts have unique requestId. Derived exclusion sets deduplicate equal
family/instance values, preserving first subject order.
The P1 envelope retains 256 candidates, 256 bindings, six lanes and 1536 lane
occurrences without projecting away declarations. For the requested lane, audit
all declared occurrences, including off-pin and fallback declarations, in policy
order. Context bindings and catalog identities each cover exactly the unique
bindings in that lane, no duplicates, extras or omissions. Source identity is
the tuple `(provider, providerModelId)`, never delimiter concatenation/aliasing.

Use this global first-failure order (at each stage use declared field order,
then array index; no input key order dependence):

1. Request plain-data/bounds/schema failure: `INPUT_REFUSED`; unknown explicit
   version: `VERSION_REFUSED`. Once the closed request is valid, `lane:'L6'`
   returns `LANE_DISABLED_REFUSED` with no context inspection/evidence traversal.
2. Context plain-data/bounds/schema failure: `CONTEXT_REFUSED`; invalid P1
   policy/envelope: `POLICY_REFUSED`. Call the accepted P1 validator, never a
   second policy validator. Preserve its bounded code/path list as `policyErrors`.
   For cost rationals ONLY, structural validation requires the closed two-field
   object and string numerator/denominator of 0..2048 UTF-16 units each. It does
   not apply the Rational semantic refinement here: empty, nondecimal, signed,
   leading-zero, >64-digit (but <=2048-unit), zero-denominator, unreduced and
   over-magnitude strings survive capture and are candidate `COST_INVALID` at R5.
   A nonstring, missing/extra field, wrong container, accessor, >2048-unit string
   or traversal/aggregate limit breach is instead `CONTEXT_REFUSED`, with no
   candidate traversal. UInt/Digest/currency/tag shape failures remain structural.
   Never parse a rational before its structural and 64-digit checks pass.
3. Lane/subrole/class mismatch: `LANE_REQUEST_REFUSED`; request/context scope,
   version, digest, time or duplicate/missing identity inconsistency:
   `CONTEXT_BINDING_REFUSED`. Unknown global freshness, independence, episode or budget
   claim: `GLOBAL_EVIDENCE_UNPROVEN`.
   Here digest/scope means envelope and EvidenceRef policy/config/request/lane/
   binding associations; validly shaped cost payload source/count/value semantic
   disagreement is deferred to R5, not promoted to this global code.
4. Global evidence only (binding evidence is handled per candidate): future evidence: `FRESHNESS_FUTURE_REFUSED`; expired or older-than-authorized
   evidence: `FRESHNESS_STALE_REFUSED`. Require observation <= evaluation <=
   expiry and evaluation-observation <= authorized maximum age, inclusive.
   Freshness authority itself must cover evaluation; it does not extend RCM's
   86,400,000 ms catalogue maximum. RCM provenance evaluation equals this call's
   evaluation, snapshot digest equals source value, age is recomputed from source
   time, and config ref matches. Dates use injected time only.
5. Budget frozen: `BUDGET_FROZEN`; budget totals/authority mismatch or unsafe
   aggregates: `BUDGET_UNPROVEN`. Class ceiling must be explicitly authorized for
   this class even when P1 says `unresolved-non-dispatching`; no inherited amount.
   `remaining = authorizedLimit - settled - outstanding` uses integer/BigInt
   subtraction with range checks; negative means `BUDGET_EXCEEDED`.
6. Any supplied episode attempt with uncertain disposition, or fallback unknown/
   uncertain prior outcome: `PRIOR_ATTEMPT_UNCERTAIN`. Initial with nonempty
   history, invalid primary occurrence/reference/history, success replay or third
   attempt: `FALLBACK_REFUSED`. No retry can relabel itself initial.
7. Evaluate all candidate filters below, then rank survivors. Empty survivor set
   yields `PINNED_PROVIDER_NO_ELIGIBLE` for L1/L2, otherwise `NO_ELIGIBLE_BINDING`.

Global malformed/unknown input stops the decision; an unknown fact local to one
binding refuses that binding, never ranks it last or discards its audit entry.
Budget workflowId/routingClass must equal the request, and P2C authenticates
account/scope/epoch/ceiling authority without creating a new scope on changes.
Every supplied binding family equals its recorded P1 logical-candidate family;
unknown P1 family requires a separately supplied declaration, never inference.
All supplied evidence records must match call policy/config/request/lane; binding
claims name their binding, global claims use null. Primary-quality and prior
outcome evidence are the explicit exception: they bind the prior request digest,
which P2C authenticates against priorDecisionDigest; P2A requires both to equal
priorRequestDigest and carry
the same prior digest, lane, policy/config and primary binding. Changed policy/
config across automatic fallback refuses. Digests are opaque equality values;
P2C computes/authenticates them, P2A does not claim to hash supplied content.

Episode history is complete for `(workflowId, taskId, episodeId, lane)`, not a
caller-chosen retry window. Its outer receipt binds the current request; embedded
attempt references bind the actual earlier requests/decisions. P2C authenticates
completeness and stable episode custody across restarts and request-ID changes.
P2A checks supplied equality, array length/order, policy/config/version, exact
matrix occurrence/provider and request-reference consistency only. It cannot
detect an authenticated-looking omitted history or invented new episode. Initial
means zero earlier attempts; fallback means exactly one earlier selected primary,
matching every request.attempt prior reference and disposition. Two earlier
attempts always stop; a prior matrix fallback or success is terminal. Reopening
initial may not reset the pair, uncertainty, provider, version or budget scope.

### Semantic agreement with P1 and RCM

Compare each known P1 field with its corresponding supplied/live value below;
never choose the more favorable source. Conflict refuses that candidate pending
a reviewed policy/evidence update. Equality is of meaning, not whole historical
receipt objects. Unknown P1 values may be supplemented through the trusted
evidence port; supplementation remains a supplied claim inside P2A. Missing a
fact needed by a current filter refuses; it never becomes false or zero.

| P1 declaration | Comparison and conflict code |
|---|---|
| bindingId, logicalCandidateId and provider/providerModelId/piHostModelId | Exact policy identity and association; RCM provider/model must match; `IDENTITY_UNPROVEN`. A claim cannot rename a binding. |
| protocol, catalogBaseUrl | Exact supplied protocol/catalogBaseUrl and RCM api/baseUrl; `ENDPOINT_MISMATCH`. No URL normalization or provider alias. Unknown identity evidence is `IDENTITY_UNPROVEN`. |
| logical family | Exact supplied family; `INDEPENDENCE_VIOLATION`. Unknown family needed by current/future obligations is `INDEPENDENCE_UNPROVEN`. |
| dataClasses; transportRequirements | Set equality for classes, exact data_collection and zdr values against supplied claims; `DATA_CLASS_INELIGIBLE` / `PRIVACY_UNPROVEN`. No widening policy restrictions. |
| toolUse, structuredOutput, reasoning | Actual boolean equality, including false, against supplied tool/structured claims or RCM reasoning; `CAPABILITY_MISSING`. |
| inputModalities, thinkingLevels | Set equality against RCM input modalities and supported non-null thinking-map keys; order irrelevant, duplicate-free. Compare actual support, not metadata/target-string identity; `CAPABILITY_MISSING`. Exact requested map entry must still exist. |
| contextWindow, maxTokens | Exact numeric equality with RCM values, then capacity checks; `CONTEXT_INSUFFICIENT`. |
| enabled; availability.available | Exact boolean equality with supplied enabled/available, including recorded false vs live true; `AVAILABILITY_UNVERIFIED`. |
| qualityByLane | Exact numeric score equality for requested lane against supplied quality; `QUALITY_UNRECORDED`. Other lanes cannot substitute. |
| rates | Known binary input/output numeric values and unit agree with corresponding RCM catalogue facts; `COST_INVALID`. These remain catalogue facts only, never exact billed-rate lexemes or authentication of the cost port. |

Availability checkedAtUtc/attestationRef, quality evidenceRef and other historical
receipt refs/timestamps need not equal refreshed evidence. Current receipts must
independently satisfy scope, state and freshness; changed metadata cannot excuse
a conflicting boolean/score. No historical-metadata equality test substitutes
for semantic comparison. Unknown RCM facts still cannot be fabricated.

### Independence obligations and custody

The closed independence claim names policy authority, an explicit risk/review
determination and relevant artifact/counterpart subjects. P2C authenticates their
content, completeness and custody. Every subject/determination evidence receipt
is global (`bindingId:null`) and binds this call; the containing subjectId and
artifactDigest are part of the authenticated content. Unknown determination is
`GLOBAL_EVIDENCE_UNPROVEN`; mismatched artifact or policy authority scope is
`CONTEXT_BINDING_REFUSED`. The determination names the lane whose work is reviewed:
it equals this lane for L1/L3/L4/L5 and identifies the actual artifact lane for L2.
An L3 determination with differentFamilyRequired=false is inconsistent and
refuses `CONTEXT_BINDING_REFUSED`; L4's family duty comes from this named
determination, not from a guessed risk-to-family map.

P2A derives `IndependenceObligations` from accepted lane constants plus this
determination, never from caller-controlled waive flags:

- L1 cannot self-verify. Its selected instance is the subject of a future
  separate L2 review with distinctInstance=true; family difference follows the
  named determination. Existing review subjects, if any, are excluded as needed
  to keep that relationship distinct. No future reviewer identity is invented.
- L2 performs a current check: subjects must include every applicable builder
  and coordinator instance for the artifact (at least one subject). Exclude all
  those instances. Exclude builder artifact families when differentFamilyRequired
  or reviewedLane=L3, and coordinator families where that determination requires
  independence. Unknown required counterpart instance/family refuses the current
  candidate with `INDEPENDENCE_UNPROVEN`; matching one refuses with
  `INDEPENDENCE_VIOLATION`. P2A checks supplied structure; P2C proves completeness.
- L3 records a future separately dispatched L2 reviewer, distinct instance and
  different family from the selected builder. L4 records the parcel-review duty,
  distinct instance and the named determination's family requirement. L5 retains
  that parcel-review duty and any explicit family requirement and is never a
  verifier. These future duties do not require a present reviewer identity or
  exclusion of the builder from itself. For L3/L4/L5 currentSelection exclusions
  are empty; their supplied counterpart list must be empty, not a fake reviewer.

Every selected L1/L3/L4/L5 instance must be known to name its future distinct-
instance duty. Selected family must be known when the future duty requires
family difference or a current exclusion uses family; otherwise an unknown
family is represented by subjectFamily=null and does not refuse selection.
A supplied known family is retained even when no family exclusion applies.
For L1, current exclusions are all supplied counterpart instances
and, when required by the determination, their families; an empty list is valid
when no counterpart exists yet. For L2 futureReview=null; current exclusions and
subjectIds are the derived sets above. Output duty `separate-l2-review` applies
to L1/L3; `parcel-review` applies to L4/L5. This records an outstanding controller
workflow duty, never permission to skip review, ratify, merge or verify oneself.
P2C carries it forward and authenticates its fulfillment at review dispatch.
External family/frontier classifications still require explicit named authority;
P2A invents no family registry or frontier evidence.

### Candidate filters and exact order

For every occurrence compute a fixed ordered refusal set: identity/endpoint,
provider rule, R1, R2, R3/frontier, R4, R5, R6, R7, then fallback suitability.
A field needed for a filter that is unknown refuses that filter; irrelevant
optional capabilities do not impose invented requirements. Do not short-circuit
away the remaining bounded ranking inputs. Use only these candidate codes:
`IDENTITY_UNPROVEN`, `ENDPOINT_MISMATCH`, `OFF_PIN`, `DATA_CLASS_UNKNOWN`,
`DATA_CLASS_INELIGIBLE`, `PRIVACY_UNPROVEN`, `CAPABILITY_UNVERIFIED`,
`CAPABILITY_MISSING`, `INDEPENDENCE_UNPROVEN`, `INDEPENDENCE_VIOLATION`,
`FRONTIER_UNPROVEN`, `FRONTIER_REQUIRED`, `CONTEXT_UNKNOWN`,
`CONTEXT_INSUFFICIENT`, `COST_UNKNOWN`, `COST_INVALID`, `BUDGET_EXCEEDED`,
`AVAILABILITY_UNVERIFIED`, `QUALITY_UNRECORDED`, `FALLBACK_SUITABILITY_UNPROVEN`,
`NOT_DECLARED_FALLBACK`. Keep P1 identity and RCM refusal lists separately, verbatim.
Per-binding stale/future evidence uses the corresponding freshness codes above.

- Identity: held identity or any P1/RCM identity refusal is ineligible. Exact
  supplied protocol and catalogBaseUrl must agree with known P1 and RCM api/baseUrl;
  provider/model/Pi host IDs remain distinct and unchanged. Owner-attested
  identity does not waive exact catalog and live evidence requirements.
- R1: binding dataClasses must contain the request class under policy authority.
  Recorded P1 claims must agree with supplied values; unknown declarations may
  gain separately sourced claims without rewriting the policy. Nonpublic data
  additionally requires supplied evidence of actual `data_collection:'deny'`
  and `zdr:true`; neither another binding nor provider-wide defaults suffice.
  Initial public-only transport refusal belongs to P2C/P2D, not a new P2A rule.
- R2: required tool-use/structured-output need supplied true claims. RCM modality,
  reasoning and exact non-null thinking-map entry must satisfy the request;
  unknown/missing thinking level refuses, no clamping/substitution/default.
  Reasoning required with `off` refuses. Compare recorded P1 capability facts
  with RCM; contradictory facts refuse rather than pick a favorable source.
- R3: require supplied family and instance for current exclusions and future-duty
  subjects only where required above. Compare exact declared family, never infer from provider/model
  spelling. L2 requires distinct instance and all derived family exclusions.
  L1 frontier and L2
  frontier require supplied true frontier declaration from named policy authority,
  never price/quality/reputation. Lane independence declarations cannot be waived
  by false/empty supplied values; unresolved required obligations refuse.
- R4: requiredContextTokens and requiredOutputTokens are positive; maxima positive
  and at least the corresponding requirements; ranking counts, if present, are
  <= maxima. Require RCM contextWindow >= requiredContextTokens and maxTokens >=
  maximumOutputTokens, plus maximumInputTokens + maximumOutputTokens <=
  contextWindow, checked without unsafe addition. This is a conservative total
  context contract; no inferred cache discount or tokenizer reduction.
- R5: cost claim covers exact request maxima/tariff/profile and is nonnegative.
  Require maximumMicroUsd <= remaining and <= classCeilingMicroUsd. Outstanding
  includes ALL reserved/consumed/uncertain liabilities, not only this request.
  P2A does not validate ledger completeness from an aggregate: P2B/P2C own that.
- R6: enabled and available must both be supplied true for this binding; available
  evidenceState is `live-availability`, within authorized freshness. Static
  catalogue presence/enabled declaration is not a reachability attestation.
- R7: quality is finite numeric [0,1], lane-scoped, evidenceState `model-quality`.
  Exact numeric equality/order matches accepted P1 score representation; no score
  rounding, cross-lane transfer or proxy. Preserve all component evidence states.

P2B owns rate lexeme parsing, unit validation, charge components, conservative
rational sum and the single upward micro-USD rounding. P2A consumes only the
validated injected cost-value port above; it must not implement that algorithm.
`maximumMicroUsd` is a conservative reservation bound, distinct from ranking.
P2C binds the helper result to priceEvidenceDigest/tariff/request/source. Rational
USD values must be <= Number.MAX_SAFE_INTEGER/1,000,000 by exact comparison;
unit-price values use the same bound in USD per million tokens. Comparison uses
BigInt cross-products (at most 128 digits), never Number conversion. Reject
noncanonical/overbound values as COST_INVALID. P2A never reconstructs lexemes
from P1/RCM binary numbers. Projected rank value must not exceed the maximum
bound expressed in USD; no equality with rounded reserve is presumed.

The exact cost-value evidence content binds bindingId/provider/model, requestDigest,
currency, sourceProfileId/sourceProfileVersion/sourceProfileDigest, tariffDigest,
priceEvidenceDigest, maximumInputTokens/maximumOutputTokens, maximumMicroUsd and
the entire ranking discriminant/counts/returned rational values. `costValueDigest`
names that content; P2C authenticates it and the outer cost receipt. Source profile
ID/version/digest equal catalog.source profileId/profileVersion/profileDigest;
profileDigest identifies the trusted source-profile content, while snapshotDigest
identifies the catalogue snapshot; neither is inferred from the other. P2C
authenticates both through its source authority, not an invented RCM fact field;
price evidence binds that source independently of its binary numeric projection.
Max counts equal request maxima. Projected inputTokens/outputTokens exactly equal
request.rankingTokens; null rankingTokens requires unit-price and no rank counts.
Semantic binding mismatch is candidate `COST_INVALID`; malformed field types
remain global `CONTEXT_REFUSED`. P2B exclusively computes charges and rounding;
P2C maps accepted outputs without recalculation, truncation or rounding. Output
precision beyond this port's 64 canonical digits refuses, even when the helper
supports a larger value. P2B's actual helper field correspondence and precision
must be checked at composition review; this proposal changes only P2A's port.
Digest-only forgery or a different otherwise valid value under an unchanged
digest cannot be detected by P2A equality checks alone. P2C's authentication must
reject those substitutions; P2A verifies the available cross-field associations
and rational bounds without pretending to authenticate or recalculate charges.

For an initial request rank all eligible lane occurrences, preserving the
rubric's explicit primary-before-fallback tie-break. L1/L2 partition
strictly to opencode; L3/L4 put openrouter before opencode. Within each of these
provider groups compare quality descending. L5 compares exact projected USD
ascending when rankingTokens exists; otherwise exact output unit price then
input unit price ascending, then quality descending. Every cost claim must use
the same request-selected mode; never mix projected and unit-price keys. All
lanes then compare primary before fallback, provider Unicode code-point order,
then providerModelId Unicode code-point order (not localeCompare/UTF-16 unit
order). P1's unique provider/model tuple makes this total. Sort a copy, never
mutate policy/input order. No new ranker/version or HRO-specific comparator.

Fallback considers only the explicit fallback of the prior selected primary
occurrence in this same lane and provider. All other occurrences remain audited
with NOT_DECLARED_FALLBACK. Prior disposition must be authenticated by P2C as
terminal-no-send or terminal-failed-settled; success
is not retryable. Unknown, consumed-unreconciled, timeout or uncertain means
PRIOR_ATTEMPT_UNCERTAIN. Recheck all present filters and require current fallback
quality >= prior primaryQuality with tolerance exactly zero. The prior quality
must still be valid for comparison at this evaluation time. No third attempt,
provider/version hop or replacement of a failed fallback; both failed means stop.

### Result and audit contract

```typescript
type CandidateCode =
  | 'IDENTITY_UNPROVEN' | 'ENDPOINT_MISMATCH' | 'OFF_PIN'
  | 'DATA_CLASS_UNKNOWN' | 'DATA_CLASS_INELIGIBLE' | 'PRIVACY_UNPROVEN'
  | 'CAPABILITY_UNVERIFIED' | 'CAPABILITY_MISSING'
  | 'INDEPENDENCE_UNPROVEN' | 'INDEPENDENCE_VIOLATION'
  | 'FRONTIER_UNPROVEN' | 'FRONTIER_REQUIRED'
  | 'CONTEXT_UNKNOWN' | 'CONTEXT_INSUFFICIENT' | 'COST_UNKNOWN' | 'COST_INVALID'
  | 'BUDGET_EXCEEDED' | 'AVAILABILITY_UNVERIFIED' | 'QUALITY_UNRECORDED'
  | 'FALLBACK_SUITABILITY_UNPROVEN' | 'NOT_DECLARED_FALLBACK'
  | 'FRESHNESS_FUTURE_REFUSED' | 'FRESHNESS_STALE_REFUSED';
type StopCode =
  | 'INPUT_REFUSED' | 'VERSION_REFUSED' | 'LANE_DISABLED_REFUSED'
  | 'CONTEXT_REFUSED' | 'POLICY_REFUSED' | 'LANE_REQUEST_REFUSED'
  | 'CONTEXT_BINDING_REFUSED' | 'GLOBAL_EVIDENCE_UNPROVEN'
  | 'FRESHNESS_FUTURE_REFUSED' | 'FRESHNESS_STALE_REFUSED'
  | 'BUDGET_FROZEN' | 'BUDGET_UNPROVEN' | 'BUDGET_EXCEEDED'
  | 'PRIOR_ATTEMPT_UNCERTAIN' | 'FALLBACK_REFUSED'
  | 'PINNED_PROVIDER_NO_ELIGIBLE' | 'NO_ELIGIBLE_BINDING' | 'AUDIT_BOUND_REFUSED';
type CandidateAudit = Readonly<{
  occurrenceIndex: UInt; bindingId: Text;
  policyBindingIndex: UInt; logicalCandidateIndex: UInt;
  claimsIndex: UInt; catalogResultIndex: UInt;
  refusals: readonly CandidateCode[];
  rank: Readonly<{
    providerGroup: 0 | 1; matrixRole: 'primary' | 'fallback';
    quality: number; cost: BindingClaims['cost'];
    provider: PmcProvider; providerModelId: Text;
  }> | null;
}>;
type PmcAuditV1 = Readonly<{
  version: 'pmc/v1'; evidenceState: 'static-conformance';
  authority: 'selection-only'; evidenceMode:
    'supplied-production-claims' | 'synthetic-offline' | 'not-inspected';
  request: PmcRouteRequestV1 | null;
  inputs: PmcResolverContextV1 | null;
  candidates: readonly CandidateAudit[];
  policyErrors: readonly ProviderBindingValidationErrorV1[];
  failurePath: string; // fixed schema path/index, <=256 units; no caller text
}>;
type PmcRouteDecisionV1 =
  | Readonly<{ ok: true; decision: Readonly<{
      version: 'pmc/v1'; authority: 'selection-only'; bindingId: Text;
      provider: PmcProvider; providerModelId: Text; piHostModelId: Text;
      protocol: Text; baseUrl: Text; maximumMicroUsd: UInt;
      terminal: boolean; independenceObligations: IndependenceObligations;
      audit: PmcAuditV1;
    }> }>
  | Readonly<{ ok: false; code: StopCode; audit: PmcAuditV1 }>;
```

Success has terminal=true for a selected matrix fallback, false for a selected
primary; it contains no executable permit/signature. evidenceState describes
only resolver static conformance, never promotes supplied evidence into live or
quality proof. Component receipts preserve their individual states. `inputs`
is one owned bounded snapshot, referenced by indices in each candidate audit;
this records every ranking input without copying full evidence per candidate.
It contains allowlisted facts/digests/references only, no prompts, raw receipts,
headers, credentials, provider payloads or arbitrary evidence bodies. Caller
strings are not interpolated into refusal codes, text or paths. P2C must enforce
safe provenance references before serializing descriptive receipts; arbitrary
string content is not a secret sanitizer.

Malformed/global failures before full validation set inputs=null, candidates=[],
request=null until validated, and evidenceMode=not-inspected; L6 retains validated
request only. After full validation, candidate selection/refusal retains all
inputs and every occurrence. Max 256 candidate audit entries, 128 policy errors,
32 unique candidate codes, fixed paths <=256 units. Output traversal is bounded
to 131,072 values and 2,097,152 string units, including the single input snapshot;
if the complete audit would exceed either bound, return AUDIT_BOUND_REFUSED with
the empty bounded audit (add this literal to StopCode). Never return an unaudited
selection or silently truncate candidates. Trusted caller owns audit storage;
P2A logs nothing and exposes no raw exception text.

### Recorded coordinator resolutions (draft, 2026-09-26)

Q1 resolved: preserve all-occurrence initial ranking. Initial means no earlier
attempt in the same authenticated episode; a selected matrix fallback is terminal.
P2C authenticates complete history; P2A checks supplied consistency only.

Q2 resolved: closed named determination/subject inputs derive current selection
exclusions and outstanding future controller review duties from lane constants.
False/empty inputs cannot waive required current exclusions or future duties.
Family/frontier authority and evidence custody remain explicitly external.

Q3 resolved: the field-by-field semantic table governs conflicts, including known
availability booleans and lane scores. Fresh receipt metadata is independent;
unknown P1 facts may be supplemented without becoming authentic inside P2A.
P1/RCM binary prices remain catalogue facts, never exact billed-rate evidence.

Q4 resolved: retain 64-digit exact rational values and integer micro-USD maxima;
freeze named source/profile/currency/tariff/max/ranking-count/value bindings.
P2B alone computes charges/rounding, P2C maps without arithmetic. Unsupported
helper precision refuses. P2B concrete output correspondence remains a composition
review obligation, not authority to alter its draft in this revision.

Cost precedence resolved: capture/shape/type limits fail globally; bounded cost
strings fail canonicality/range locally at R5. No invalid string is classified
both ways. The initial structural ceiling is 2048 units; 64 digits is the later
semantic port ceiling. These are coordinator-authorized draft resolutions, not
implementation or dispatch acceptance.

## Acceptance Criteria

1. Public API consumes accepted P1 validation and RCM exported facts, deterministic
   under repeated inputs; v0 tests and model selection unchanged. All recorded
   policy/evidence digests survive and no unsigned decision is a launch permit.
2. Table-driven negative tests refuse L6 before any context inspection, unknown
   family/quality/privacy/capability/cost/budget, stale facts/availability, endpoint
   mismatch, off-pin candidate, insufficient context/budget and self/same-family
   review. Unknown evidence is not ranked last or treated as zero/false.
3. Ranking/fallback tests prove provider rules, L5 cost ordering, stable Unicode
   ties, delta-zero fallback suitability, same-provider terminal pairs and stop
   on uncertain prior attempt; no candidate or input is silently discarded.
4. Tests prove aggregate outstanding reservations reduce remaining budget, cost
   estimates cannot replace a maximum cost bound, malformed/oversized input
   refuses, and audit output carries only allowlisted facts/refs, no raw evidence bodies.
5. Handoff freezes exact API/type/code names, public RCM dependency and unproven
   operational claims. Two independent reviews pass before the controller consumes it.
6. Episode vectors cover: higher-ranked matrix fallback wins initial and is
   terminal; populated history relabelled initial refuses; prior success,
   uncertain disposition, omitted/mismatched prior reference, changed provider/
   version/policy/config, selected fallback replay and a third attempt refuse.
   P2C composition tests separately prove omitted history/new-episode laundering
   cannot pass authentication; a pure P2A fixture cannot prove that custody.
7. Independence vectors cover each lane: L1 self-verification cannot discharge
   its future duty; L2 empty/missing required subjects, unknown counterpart
   instance/family and matching builder/coordinator exclusions refuse; L3 cannot
   waive family difference; L4 unknown determination refuses and a supplied risk
   determination controls family duty; L5 retains parcel review and never gains
   verifier authority. L3/L4/L5 selection with no future reviewer yet succeeds
   when otherwise eligible, records its duty and never excludes itself.
   Unknown family alone does not refuse when neither a current exclusion nor
   the future duty requires family difference; the future subjectFamily is null.
8. Semantic comparison vectors independently mutate every table row, including
   false-to-true availability, numeric lane-quality differences, actual capability
   false/set changes and policy restriction widening. Fresh receipt refs/times
   alone do not conflict; stale replacements still refuse. Unknown P1 facts may
   be supplemented, but fabricated receipts remain unproven production authority.
   P1/RCM Number-to-string rates cannot authenticate an exact billed-rate value.
9. Cost-port vectors mutate source profile ID/version/digest, currency shape,
   tariff/price/value evidence digest association, maxima and ranking counts or
   returned value; verify the documented global/local boundary. Test nonstring,
   missing/extra field, wrong container, accessor, 2049-unit string and aggregate
   overflow as CONTEXT_REFUSED before any candidate processing. Separately test
   empty, signed/exponent/nondecimal, leading-zero, 65-digit through 2048-unit,
   zero-denominator, unreduced and over-magnitude strings as candidate COST_INVALID
   with full audit when all global checks pass. Test canonical 64-digit in-range
   rationals and exact comparisons near the maximum; unsupported helper precision
   refuses without rounding/truncation. Other candidates may remain eligible.
   Forged thrown objects with getters/Symbol.hasInstance cannot be inspected by
   failure classification; refusal paths perform no IO.
   Attribute digest/content-forgery failures to P2C authentication tests, not to
   unsupported pure-resolver authenticity claims.

## Out of Scope

Authentication/key custody, budget writes, Pi launch/configuration, host inspection,
live probes, legacy selection changes, schema migration, charter edits, activation,
provider calls/spend and HRO implementation.

## Context & References

- [P2 design inventory](../../goals/pi-model-configuration/pmc-p2-design-inventory.md)
- [Accepted Amendment 05](../../goals/pi-model-configuration/gate-1-amendment-05.md)
- [PMC-P1a](PMC-P1a-provider-binding-contract.md), [PMC-P1b](PMC-P1b-provider-binding-projection.md)
- [Ratified map](../../goals/pi-model-configuration/pmc-p0-role-lane-map.md)
- [Rubric](../../goals/pi-model-configuration/pmc-p0-suitability-rubric.md)

## Allowed Files

- plugins/foreman-line/routing-policy/src/pmc-resolver.ts
- plugins/foreman-line/routing-policy/src/pmc-resolver-types.ts
- plugins/foreman-line/routing-policy/src/index.ts
- plugins/foreman-line/routing-policy/tests/pmc-resolver.test.ts
- plugins/foreman-line/routing-policy/tests/fixtures/pmc-resolver-v1.json
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p2a-verification.md

## Verification Plan

PowerShell, pinned Node 24.19.0, no network install: from routing-policy run
`npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run lint`; inspect native exit
after each. Run dispatch regression tests unchanged. Fixtures use explicit
synthetic evidence authority and can never satisfy production activation.
Verify diff allowlist, no RCM implementation changes, and no provider IO imports.
Spec-shaping validation uses `node --import <installed-tsx> <spec-linter-cli>
validate --repo-root <this-worktree> <this-spec>` with exact resolved local paths.

## Open Decisions and Stop Conditions

Draft becomes candidate-ready after accepted P1a/P1b and supported RCM interfaces
are pinned and this revised bounded request/result/refusal proposal
is independently reviewed and accepted.
Unresolved names are not permission to cast or deep-import. Version authority is
already recorded by Amendment 05, so no new user authority question is needed.
P2A cannot depend on a future P2B module: its cost-value port is injected until
P2C composes the accepted ledger/money implementation. Synthetic evidence is
confined to offline conformance and cannot mint a production permit. Full HRO
live exit remains unchanged.
