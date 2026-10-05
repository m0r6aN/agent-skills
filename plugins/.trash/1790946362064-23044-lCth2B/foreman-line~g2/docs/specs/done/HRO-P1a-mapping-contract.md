---
ticket: HRO-P1A
title: Isolated mapping proposal validator and static conformance fixtures
status: active
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - scripts/
  - .github/workflows/foreman-line-ci.yml
  - plugins/foreman-line/hybrid-routing/
  - plugins/foreman-line/docs/goals/hybrid-routing-optimization/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Build an isolated HRO-local proposal-envelope validator and static conformance
fixtures in the new `hybrid-routing` package. Compare untrusted proposals with
injected frozen evidence, preserving separate identities and provenance.
This provisional adapter is not PMC's authoritative binding schema, a resolver,
a registry, or permission to execute a route.

## Constraints

- Coordinator lint passed and scoped Gate 2 granted 2026-09-26; see HRO loop directive. PMC-P1 owns authoritative binding
  schema; PMC-P2 owns resolver/launch/Pi config; RCM owns catalog/eligibility.
  Neither upstream internals nor production consumers may import this module.
- Pure synchronous validation: no host files, ambient clock, network, credentials,
  discovery, selection, fallback execution, configuration or receipts.
- Node >=24.11.1; strict TypeScript NodeNext; `node:test`/`node:assert/strict`.
  Reuse installed tools or minimal exact dev versions aligned with dispatch:
  TypeScript 7.0.2, tsx 4.23.15, @types/node 26.6.2; optional Biome 2.5.14.
  No new runtime dependencies. Document reproducible commands.
- IDs are opaque exact case-sensitive strings: no trimming, lowercasing, regex
  aliases, prefix splitting, version replacement, or generated real mappings.
- Trusted projection/context are supplied separately by a coordinator-owned
  fixture caller; untrusted proposals cannot replace them. Validate and copy
  them defensively. Digest agreement proves consistency with supplied static
  evidence, not live authenticity, availability, enablement or entitlement.

### Provisional local contract

Export `validateMappingProposal(proposal: unknown, projection: unknown,
context: unknown): MappingProposalResult`. Validate all arguments at runtime.
All types below are local to HRO; do not publish them as the proposed future
PMC-owned `ProviderBindingProjectionV1` export.

```typescript
type ProposalProvenance = Readonly<{
  source: string; retrievedAt: string; contentSha256: string;
  catalogVersion: string; mappingVersion: string; policySchemaVersion: string;
  roleMapVersion: string; foremanRevision: string; piRuntimeVersion: string;
  approvalEvidenceState: 'static-conformance';
}>;
type MappingProposalV1 = Readonly<{
  schema: 'hro-mapping-proposal/v1';
  logicalCandidateId: string; bindingId: string; provider: string;
  providerModelId: string; protocol: string; piHostModelId: string;
  lane: string; roleFamily: string; fallbackBindingId: string | null;
  provenance: ProposalProvenance;
}>;
type HroBindingProjectionDraftV1 = Readonly<{
  schema: 'hro-binding-projection-draft/v1'; evidenceRef: string;
  bindings: readonly Readonly<{
    proposal: MappingProposalV1; conformance: 'allowed' | 'disabled';
  }>[];
}>;
type MappingValidationContext = Readonly<{
  evaluationTimeUtc: string; maxEvidenceAgeMs: number;
  expectedEvidenceRef: string; expectedContentSha256: string;
}>;
type MappingRejectionCode =
  | 'input_invalid' | 'input_limit_exceeded' | 'mapping_missing'
  | 'provider_model_mismatch' | 'protocol_unsupported' | 'mapping_mismatch'
  | 'provenance_stale' | 'provenance_mismatch' | 'fallback_undeclared'
  | 'duplicate_binding' | 'fallback_cycle' | 'lane_disabled';
type MappingProposalResult =
  | Readonly<{ ok: true; evidenceOnly: true; proposal: MappingProposalV1 }>
  | Readonly<{ ok: false; evidenceOnly: true; code: MappingRejectionCode }>;
```

### Validation semantics

1. Validate closed plain JSON shapes first; reject extra keys, sparse arrays,
   cycles, accessors and nonfinite numbers. Catch throwing accessors/proxies as
   typed refusal. Do not invoke caller-owned methods/iterators/toJSON. Arbitrary
   injected code is not sandboxed. Limits: 256 bindings, 2,048 UTF-16 code units
   per string, 262,144 aggregate string units, depth 8, 8,192 visited values.
   Check lengths before allocation/iteration. Reject empty/whitespace-only and
   surrounding-whitespace IDs/references/versions rather than normalizing them.
2. Dates must exactly round-trip UTC `YYYY-MM-DDTHH:mm:ss.sssZ`. Hashes are 64
   lowercase hexadecimal characters. maxEvidenceAgeMs is an integer in
   [0, 86400000]. Explicit age = evaluationTimeUtc minus retrievedAt; negative
   or greater-than-limit age is provenance_stale; equality is accepted.
3. Validate the complete projection: evidenceRef and every binding digest must
   match context pins; every binding must be fresh. Reject duplicate binding IDs
   or duplicate (logicalCandidateId, provider, providerModelId, protocol, lane,
   roleFamily) tuples. Sharing a model across distinct lanes/roles requires
   explicit distinct bindings. Reject dangling, self or cyclic fallback links.
   Disabled records may exist as evidence, but requesting one or referencing one
   as fallback yields lane_disabled. Never select or execute a fallback.
4. Lookup exact bindingId, otherwise mapping_missing. Compare provider/local ID
   (provider_model_mismatch), protocol (protocol_unsupported), other identity/
   host/lane/role fields (mapping_mismatch), fallback ID (fallback_undeclared),
   then every provenance field (provenance_mismatch), in that order. Return one
   deterministic rejection; no inferred alias or corrected value.
5. Return a deep-frozen owned copy with evidenceOnly:true. A successful proposal
   is neither an executable route nor live authorization. Static-conformance
   approval state cannot be promoted by this module.

## Acceptance Criteria

- Exact static proposal preserves every field; mutation cannot alter evidence
  or outputs. Tests independently tamper every identity/provenance field.
- Tests cover malformed/extra keys, throwing properties, cycles, bounds at and
  beyond limits, invalid calendar values/hashes, mismatched pins, future/stale
  and exact-boundary ages, duplicate IDs/tuples and dangling/self/cyclic links.
- Declared valid fallback references are preserved but never selected; disabled
  bindings/fallbacks, unknown previews and punctuation/case/version near-misses
  refuse with typed codes and no guessed model.
- Synthetic fixtures are labeled test-only. Any copied real PMC evidence has an
  exact source revision/reference; no new real mappings are invented. Preserve
  `opencode/claude-opus-5-5` and `openrouter/anthropic/claude-opus-5.5` distinctly
  if used. Binding 7/Jev `typesafe/jev-1.13` remains disabled/refused.
- New package typecheck/tests pass; unchanged routing-policy suite remains green.
  Handoff calls all shapes provisional and records future PMC ratification.
  Offline conformance does not complete HRO or enable runtime routing.

## Out of Scope

Routing-policy/SUPERCHARGE, dispatch, PMC/RCM schema/exports/resolver, Pi settings,
Jev, receipts/settlement, production imports, catalog refresh, cache, fallback
execution, provider calls, model-quality claims, merge, release and publication.

## Context & References

- [Charter](../../goals/hybrid-routing-optimization/charter.md)
- [Coordination and owner handoffs](../../goals/hybrid-routing-optimization/hro-p1-coordination.md)
- [PMC charter](../../goals/pi-model-configuration/charter.md)
- [Consumer draft](HRO-P1b-mapping-consumer-integration.md)

## Allowed Files

- plugins/foreman-line/hybrid-routing/package.json
- plugins/foreman-line/hybrid-routing/package-lock.json
- plugins/foreman-line/hybrid-routing/tsconfig.json
- plugins/foreman-line/hybrid-routing/src/mapping-proposal.ts
- plugins/foreman-line/hybrid-routing/src/index.ts
- plugins/foreman-line/hybrid-routing/tests/mapping-proposal.test.ts
- plugins/foreman-line/hybrid-routing/README.md
- plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p1a-handoff.md

## Verification Plan

Run new-package typecheck/tests and unchanged routing-policy tests under Node
>=24.11.1. Record commands, versions and counts, and inspect diff/import graph
for allowed-file compliance, no production consumer and no runtime dependency.

Mandated reviewer questions:

- Can success imply authority beyond supplied static evidence?
- Can input replace trusted pins, infer aliases, mutate evidence or bypass bounds?
- Are fallback references validated without implementing a resolver?
- Are authoritative PMC/RCM contracts and shared files untouched?

## Evidence Required

Coordinator Gate-2 directive for narrowed scope, fixture/typecheck/regression
results, scope/import proof and independent architecture/risk review. Pending
production exports are later-integration predecessors, not offline blockers.

## Collision Risk

Only a new HRO package and handoff; interpretation of provisional contracts
remains elevated risk despite low file overlap.

## Stop-and-Report Rule

Stop on any unlisted file, upstream schema/import, real-model mapping invention,
evaluator edit, host/network access or runtime authority requirement.

## Amendment A1 — repository CI inclusion (2026-09-26)

Coordinator ratified under the standing HRO authority after an independent gap
review: the fixed 19-package CI runner omits the new hybrid-routing package.
The following three paths extend Allowed Files (eleven total):

- scripts/foreman-line-ci.mjs
- scripts/foreman-line-ci.test.mjs
- .github/workflows/foreman-line-ci.yml

Insert hybrid-routing after foreman-config in both independently maintained
package allowlists, retaining relative order of the existing nineteen. Adjust
counts to 20 installs, 60 checks and 80 total subprocess calls, with correct
phase-offset failure injection. Add focused evidence that a hybrid-routing
check failure makes the aggregate fail. Change only the workflow's descriptive
package-count step label. Preserve install-before-check ordering, offline
behavior, subprocess isolation, failure aggregation, triggers and job names.
No runner framework, workflow permissions or package behavior change is allowed.
Run the injected-process runner suite and require the complete combined branch
package pipeline to pass in CI before merge. Existing package and unchanged
routing-policy checks remain required. Include this additive integration delta
in both independent implementation reviews. This amendment does not authorize
runtime routing or any shared policy/dispatch implementation change.
