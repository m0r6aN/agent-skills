---
ticket: PMC-P1A
title: Provider-neutral binding contract schema and validation
status: active
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/routing-policy/
  - plugins/foreman-line/docs/goals/pi-model-configuration/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Add a versioned provider-neutral policy/binding representation alongside the
existing v0 APIs, encoding the owner-ratified six-lane map, explicit fallback
pairs and suitability-evidence requirements. Publish validated immutable policy
data through the existing public barrel. Sequential PMC-P1b consumes this accepted
validator to produce a lossless evidence-only projection; P1a creates no route.

## Constraints

- Shaping base: `5d5716d8dc65d05f821bb3c21238ad6c9fda530c` (main, includes PR49
  A5.4 ratification). Status remains draft pending coordinator lint, design
  RCM sequencing handoff and explicit Gate 2. Coordinator accepted design D1-D5
  with the review fixes recorded in the design inventory; no owner decision
  is left pending for this static scope.
- A1-A8, M2-M4, Amendment03 and Amendment04 remain binding. Ratified role-map
  section 4 supersedes stale awaiting-ratification language in the rubric.
- Keep existing RoutingPolicy, validatePolicy, CLASS_NAMES, roles/model tiers,
  PiOpenRouterRouting and dispatch results byte/behavior compatible. No legacy
  removal, new dispatch class/budget default, or changed model selection.
  Current main already contains Opus 5.5 in validator/policy/dispatch fixtures;
  verify that state rather than force an unnecessary source change.
- New standalone modules only except explicitly additive index/registry/parity
  edits. RCM catalog-snapshot/eligibility files and fixtures are prohibited.
  No deep import of them; this contract has no production catalog reader.
- Node >=24.11.1; existing routing-policy TypeScript, node:test, Ajv and schema
  generation/parity tools; no new runtime/development dependencies.
- Pure runtime functions, no files/network/host inspection/ambient clock,
  resolver, ranking algorithm, availability probe, enablement, provider spend,
  signed route receipt, launch boundary or configuration mutation.

### Versioned shape and authority boundaries

Implement readonly exported TypeScript types and matching JSON Schema under a
new root object, not extra keys in legacy RoutingPolicy. Nested definitions use
closed `$defs`; reject unknown fields. Exact IDs are supplied declarations,
never parsed, inferred, lowercased, trimmed or normalized from another provider.

```typescript
type PmcProvider = 'opencode' | 'openrouter';
type PmcLaneId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';
type PmcRoleFamily = 'coordinator' | 'verifier' | 'builder' | 'classifier';
type EvidenceState = 'static-conformance' | 'live-availability' | 'model-quality';
type EvidenceValue<T> =
  | Readonly<{ status: 'unknown'; reason: string }>
  | Readonly<{ status: 'recorded'; value: T; evidenceRef: string }>;
type LogicalCandidateV1 = Readonly<{
  logicalCandidateId: string;
  family: EvidenceValue<string>;
}>;
type ProviderBindingV1 = Readonly<{
  bindingId: string; logicalCandidateId: string;
  provider: PmcProvider; providerModelId: string; piHostModelId: string;
  protocol: EvidenceValue<string>; catalogBaseUrl: EvidenceValue<string>;
  identityState: 'catalog-recorded' | 'owner-attested' | 'held';
  identityRefusalCodes: readonly string[];
  eligibility: BindingEvidenceV1;
}>;
type LaneBindingV1 = Readonly<{
  lane: PmcLaneId; bindingId: string;
  matrixRole: 'primary' | 'fallback';
  fallbackBindingId: string | null;
}>;
type ProviderBindingPolicyV1 = Readonly<{
  schemaVersion: 'pmc-provider-binding-policy/v1';
  compatibility: 'additive-v0-preserved';
  provenance: BindingProvenanceV1;
  candidates: readonly LogicalCandidateV1[];
  bindings: readonly ProviderBindingV1[];
  lanes: readonly LanePolicyV1[];
  laneBindings: readonly LaneBindingV1[];
}>;
```

BindingEvidenceV1 is closed and contains these distinct evidence-valued fields:
`dataClasses` (subset public/internal/restricted), `transportRequirements`
(existing data_collection/zdr shape), `toolUse`, `structuredOutput`, `reasoning`
(booleans), `inputModalities` (unique text/image list), `thinkingLevels`
(unique strings), `contextWindow`, `maxTokens` (positive safe integers),
`rates` (input/output finite nonnegative decimals, exact unit USD per 1M tokens),
`enabled` (boolean), `availability` and `qualityByLane`.
Availability's recorded value is {available:boolean, checkedAtUtc:string,
attestationRef:string, evidenceState:'live-availability'}; qualityByLane's
recorded value is a unique-lane array of {lane,score,evidenceRef,
evidenceState:'model-quality'}, with score in [0,1]. These are representable
claims with named evidence, not authenticated attestations. All quality and
availability fields in the shipped real baseline are unknown. Unknown cannot
be replaced by false, zero, inherited family capability or another lane's score.

BindingProvenanceV1 has exact fields `sourceRef`, `sourceRevision`, `contentSha256`,
`catalogVersion`, `mappingVersion`, `policySchemaVersion`, `roleMapVersion`,
`foremanRevision`, `piRuntimeVersion`, `acquiredAtUtc`, `evidenceState` and
`freshnessAcceptance` ('not-accepted'|'owner-accepted'). Missing observations
use EvidenceValue for catalogVersion/piRuntimeVersion/acquiredAtUtc; other
versions/references are explicit bounded strings. contentSha256 identifies
source evidence bytes, not a recursive self-hash of this object. No freshness
acceptance is inferred from parsing a timestamp; baseline is static-conformance,
not-accepted. Projection retains provenance without upgrading it.

### Frozen lane and fallback contract

LanePolicyV1 contains `lane`, `roleFamily`, `subRoles`, `routingClasses`,
`authorityCap`, `frontierOnly`, `independence`, `humanGates`, `providerRule`,
`qualityTolerance`, `enabled`, `rankingRequirements` and `budgetPolicyRef`.
Use reviewed code constants to anchor these values against PMC-P0's ratified
map; a self-described policy cannot redefine its own authority constraints.

- L1 coordinator family, subroles coordinator/shaper/architect; architecture/risk;
  coordinate-and-shape only; frontier; distinct instance; pin opencode.
- L2 verifier family, adversarial-reviewer/verifier/security-auditor;
  architecture/risk and review/security; verdict-recommendation only; frontier;
  independent family where required and distinct instance; pin opencode.
- L3 builder-complex, implementation/complex; scoped execution; independent
  reviewer required; prefer openrouter then opencode.
- L4 builder-standard, standard-feature and implementation/standard; scoped
  execution; independence where risk requires; prefer openrouter then opencode.
- L5 builder-economy, boilerplate; scoped execution excluding security/approval/
  merge/final verification; cheapest eligible binding across both providers.
- L6 classifier/routing-classifier, routing/classification; recommend-only;
  disabled unconditionally; no ranking, provider hop or authority promotion.
- All lanes preserve ratified human gates and zero quality tolerance. Encode
  prohibition of self-review/approval/merge/release/policy bypass as applicable
  in closed authorityCap/independence enum values with documented semantics.
- rankingRequirements records R1-R4/R6 as hard filters, R5 as budget filter,
  R7 as lane-quality evidence, and stable ordering descriptors from rubric §4:
  provider partition/preference (or L5 projected cost, unit-price comparison only
  when estimates absent), descending quality, primary before fallback, then
  Unicode-code-point provider/model ID. This encodes the algorithm's inputs and
  order; it must not choose/rank routes in P1. Missing estimates do not waive
  the budget filter or invent affordability.
- budgetPolicyRef names existing policy authority or explicitly marks the new
  class ceiling unresolved. No guessed ceilings for review/security,
  implementation/complex or routing/classification; those labels are v1
  declarations and remain non-dispatching until P2 has an approved budget source.

LaneBinding is occurrence-scoped: a primary references exactly one declared
fallback occurrence in the same lane; fallback occurrence has null fallback.
No recursion/third attempt. Reject self, dangling, duplicate occurrences,
primary-to-primary, cross-lane or cross-provider links. The same binding can have reversed roles
in L1/L2 without a false global cycle. L1/L2 references never cross the pin;
off-pin matrix pairs can remain explicit historical declarations but are marked
nonselectable by providerRule, never promoted into fallback routes. Held binding
7 can be represented but not represented as eligible; L6 always disabled.
Coordinator ruling D1 accepts this terminal-pair interpretation as the matrix's
both-fail-stop rule. No same-lane pair may cross providers, including unpinned
lanes. Off-pin historical declarations never become selectable. Unknown family
never satisfies independence; unresolved new-class budgets remain non-dispatching.
PMC-P2 must enforce disabled L6 across BOTH legacy and v1 launch boundaries
before ANY activation; P3 canon and P4 removal cannot postpone this requirement.

### Validation contract

Export `validateProviderBindingPolicyV1(input: unknown)` returning a discriminated
{valid:true,value} or {valid:false,errors} result with typed {code,path} entries.
Return owned deep-frozen data; reject malformed structures without throwing.
Use bounded plain-data validation before Ajv: max 256 candidates/bindings,
6 lanes, 1536 lane occurrences, 2048 chars/string, 1 MiB aggregate string units,
depth 16 and 65536 visited values; reject cycles/accessors/nonfinite numbers/
sparse arrays/unknown keys and catch throwing proxies. Never invoke caller-owned
iterators or toJSON. Cap errors at 128 with a final truncation code.

Semantic validation checks exact referential integrity, duplicate IDs/provider+
model identities, consistent explicit Pi identity, lane constraints, family
unknown versus declared state, per-binding data eligibility and strict nonpublic
transport (deny/true), unknown fact preservation and all fallback rules. Protocol
and endpoint are never inferred from provider. A catalog-vs-settings/legacy
endpoint divergence is a static finding, not AC2A_URL_MISMATCH (Amendment04).
No raw catalog ingestion is added to reproduce AC2a diagnostics; preserve those
named source refusals distinctly when carried as evidence.

## Acceptance Criteria

1. v1 TypeScript/schema parity and committed generated schemas pass; all old
   exports/types/schemas/models/class lists and v0 selection behavior remain.
2. All 15 canonical binding declarations and six lanes are representable from
   PMC-P0 evidence without fresh host access. Binding 7 is held; 1/10 remain
   owner-attested with unknown capabilities/protocol; Jev is not added; L6 refuses.
3. Negative tests cover malformed/bounded hostile input, duplicate identities,
   missing candidate refs, self/dangling/wrong-lane/primary fallback refs, pin
   crossing, relaxed frontier/independence/authority, data transport weakening,
   unknown facts treated as true and scores transferred across lanes.
4. Tests preserve distinct OpenCode/OpenRouter Opus identities; existing
   KNOWN_FRONTIER_MODELS/policy and public dispatch expectations already use
   anthropic/claude-opus-5.5. No arbitrary registry additions/removals occur.
5. Tests prove validator output immutability, declaration order and lossless
   field/refusal/provenance preservation through the public API. Unknown/held
   bindings are declarations only. No projection implementation belongs in P1a.
6. Fixtures exercise SCF-1/2/3 without aliasing endpoint/provider/protocol or
   mislabeling settings divergence as catalog-internal AC2A_URL_MISMATCH.
7. P1a handoff identifies exported validator/type/schema versions and all unproven
   live availability, quality, capability/privacy and freshness claims. P1b owns
   consumer inventory closure. Two independent implementation reviews must pass.

## Out of Scope

Projection implementation, consumer migration, ranking/resolver execution,
dispatch wiring, Pi files/launch/defaults/enablement,
credentials, provider calls/spend, availability/quality proof, receipt schema,
human-facing templates, v0 removal, RCM reader/projector edits and goal completion.

## Context & References

- [PMC charter](../../goals/pi-model-configuration/charter.md)
- [Ratified role map](../../goals/pi-model-configuration/pmc-p0-role-lane-map.md)
- [Suitability rubric](../../goals/pi-model-configuration/pmc-p0-suitability-rubric.md)
- [Amendment04](../../goals/pi-model-configuration/gate-1-amendment-04.md)
- [Design and compatibility inventory](../../goals/pi-model-configuration/pmc-p1-design-compatibility.md)
- [Coordinator pattern](../../COORDINATOR-PATTERN.md)

## Allowed Files

- plugins/foreman-line/routing-policy/src/provider-bindings.ts
- plugins/foreman-line/routing-policy/src/provider-binding-schemas.ts
- plugins/foreman-line/routing-policy/src/index.ts
- plugins/foreman-line/routing-policy/src/registry.ts
- plugins/foreman-line/routing-policy/schemas/provider-binding-policy-v1.schema.json
- plugins/foreman-line/routing-policy/tests/provider-bindings.test.ts
- plugins/foreman-line/routing-policy/tests/fixtures/pmc-provider-binding-policy-v1.json
- plugins/foreman-line/routing-policy/tests/parity.test.ts
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p1a-verification.md

## Verification Plan

Pin Node >=24.11.1. Run routing-policy typecheck, generate, test and lint, verify
all pre-existing generated schemas byte-identical and new schema parity. Run
unchanged dispatch and spec-linter suites; preserve baseline counts on rework.
Check allowed-file diff, public export names and forbidden runtime imports.
No provider-call smoke suite; no raw host evidence required. Rollback is reverting
only P1's additive files/exports/registry/parity changes, preserving RCM work.

Mandated reviewer questions:

- Can any self-declared lane/evidence value relax the owner-ratified authority map?
- Do fallback occurrences preserve reversed matrix pairs without recursion or
  provider-pin escape, and remain contingent on later eligibility checks?
- Can validated static declarations be mistaken for launch/availability authority?
- Are unknown facts explicit and protocol/identity spellings never inferred?
- Are every v0 consumer and the deferred budget/class cutover accounted for?

## Evidence Required

Coordinator decision disposition/Gate 2 and RCM serialization handoff, pinned base,
fixture and full checks, old-schema parity, handoff, two independent
reviews and per-finding closure. Static completion is not activation.

## Collision Risk

Index/registry/parity edits serialize after reconciled RCM work and before P1b.
Coordinator records the exact reconciled base and P1a acceptance before P1b can
edit those shared files. Retain unrelated exports and all RCM internals unchanged.

## Stop-and-Report Rule

Stop for unlisted files, frozen-contract changes, new evidence conflicting with accepted D1-D5,
new class ceilings/family declarations without source, host/provider calls,
RCM internal imports or any requested runtime selection/launch authority.



## Coordinator Gate 2

Granted 2026-09-26 under explicit user prerequisite authority, following independent design review and D1-D5 corrections. Implementation may start only after RCM-P1 PR51 merges with green CI and the builder confirms the exact branch, spec blob and allowed files at Step 0. RCM adapter barrel edits are serialized after this parcel unless the coordinator records a new exact base. No activation authority is granted by static validation.
