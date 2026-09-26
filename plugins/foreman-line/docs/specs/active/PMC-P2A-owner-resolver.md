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
type PmcRouteRequestV1 = Readonly<{
  version: 'pmc/v1'; workflowId: Id; taskId: Id; requestId: Id;
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
    snapshotDigest: Digest; configAuthorityRef: Text }>>;
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
  family: Claim<Text>; instanceId: Claim<Id>; frontier: Claim<boolean>;
  dataClasses: Claim<readonly DataClass[]>;
  transport: Claim<Readonly<{ data_collection: 'allow' | 'deny'; zdr: boolean }>>;
  toolUse: Claim<boolean>; structuredOutput: Claim<boolean>;
  enabled: Claim<boolean>; available: Claim<boolean>; quality: Claim<number>;
  cost: Claim<Readonly<{
    currency: 'USD'; maximumMicroUsd: UInt;
    maximumInputTokens: UInt; maximumOutputTokens: UInt;
    tariffDigest: Digest; priceEvidenceDigest: Digest;
    ranking:
      | Readonly<{ kind: 'projected'; usd: Rational }>
      | Readonly<{ kind: 'unit-price'; outputUsdPerMillion: Rational;
          inputUsdPerMillion: Rational }>;
  }>>;
}>;
type PmcResolverContextV1 = Readonly<{
  projection: ProviderBindingProjectionV1; policyDigest: Digest;
  configDigest: Digest; evaluationTimeUtc: Utc;
  evidenceMode: 'supplied-production-claims' | 'synthetic-offline';
  catalog: CatalogClaim;
  freshness: Claim<Readonly<{ maximumAgeMs: UInt }>>;
  independence: Claim<Readonly<{
    requireDifferentFamily: boolean; requireDistinctInstance: boolean;
    excludedFamilies: readonly Text[]; excludedInstanceIds: readonly Id[];
    artifactDigest: Digest | null;
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
boundary failures into fixed codes; reflective Proxy traps cannot be made a
hard execution-time sandbox, so hostile executable objects are outside the
ordinary-data termination guarantee. Bound each request/context traversal to
65,536 visited values/keys, depth 16, individual strings 2048 UTF-16 units and
aggregate strings 1,048,576 units; count repeated references by expanded size.
P1 validation retains its existing independent bounds and vocabulary. No silent
truncation, saturation, normalization, overflow, field coercion or default.

Array caps: 256 bindings/catalog results; 64 excluded families and 64 instance
IDs; two modalities; 11 identity refusal codes; all arrays duplicate-free.
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
3. Lane/subrole/class mismatch: `LANE_REQUEST_REFUSED`; request/context scope,
   version, digest, time or duplicate/missing identity inconsistency:
   `CONTEXT_BINDING_REFUSED`. Unknown global freshness, independence or budget
   claim: `GLOBAL_EVIDENCE_UNPROVEN`.
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
6. Fallback unknown/uncertain prior outcome: `PRIOR_ATTEMPT_UNCERTAIN`; invalid
   primary occurrence/reference/history or third attempt: `FALLBACK_REFUSED`.
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
  protocol and catalogBaseUrl must be recorded in P1 and match RCM api/baseUrl;
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
- R3: require supplied family and instance for candidates whenever their exclusion
  check applies. Compare exact declared family, never infer from provider/model
  spelling. L2 requires distinct instance; declared different-family obligations
  and exclusion completeness come from dispatch evidence. L1 frontier and L2
  frontier require supplied true frontier declaration from named policy authority,
  never price/quality/reputation. Lane independence declarations cannot be waived
  by a false context flag; unresolved obligations refuse (review question Q2).
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

For an initial request rank all eligible lane occurrences, preserving the
rubric's explicit primary-before-fallback tie-break (see Q1). L1/L2 partition
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
      terminal: boolean; audit: PmcAuditV1;
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

### Coordinator questions before dispatch

Q1. The rubric ranks all occurrences with primary-before-fallback as a late tie,
while D8 says fallback only after primary degradation. Recommendation: preserve
the rubric comparator literally; an initial winner labelled fallback is terminal
and never gets an invented fallback of its own. Confirm that reading or obtain
an explicit owner ruling before restricting initial selection to primaries.

Q2. P1 encodes textual independence obligations, not risk-to-exclusion derivation
or a frontier evidence registry. Recommendation: P2C supplies authenticated
complete obligations from dispatch/owner declarations; P2A refuses unresolved
obligations, enforces L2 distinct-instance and all required family exclusions,
and does not invent a family/frontier map. Confirm exact minimum exclusions for
L1, L3 and risk-dependent L4 before candidate-ready status; false/empty input must
not waive the policy declaration. L5's separate reviewer remains a controller
workflow obligation, not evidence that the selected builder is a reviewer.

Q3. P1 recorded declarations and later live claims can conflict. Recommendation:
refuse conflicting recorded facts; only unknown P1 fields may be supplemented
through explicitly authenticated P2C evidence. Confirm this conservative rule
without rewriting P1 or treating historical evidence as current authority.

Q4. P2B money helper's exact output names are not implemented yet. Recommendation:
accept the bounded value representation above as the P2A-facing composition port;
P2C adapts canonical P2B outputs without arithmetic duplication. Confirm bounds
and cost-source bindings in independent review, not a speculative helper import.

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
are pinned, Q1-Q4 are resolved and this bounded request/result/refusal proposal
is independently reviewed and accepted.
Unresolved names are not permission to cast or deep-import. Version authority is
already recorded by Amendment 05, so no new user authority question is needed.
P2A cannot depend on a future P2B module: its cost-value port is injected until
P2C composes the accepted ledger/money implementation. Synthetic evidence is
confined to offline conformance and cannot mint a production permit. Full HRO
live exit remains unchanged.
