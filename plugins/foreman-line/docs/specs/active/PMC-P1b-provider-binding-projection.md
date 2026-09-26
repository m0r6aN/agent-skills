---
ticket: PMC-P1B
title: Lossless provider binding projection and consumer compatibility inventory
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

Publish ProviderBindingProjectionV1 as a lossless evidence-only envelope around
the entire accepted PMC-P1a policy. Complete the consumer compatibility inventory
and specify safe injected consumption without migrating any runtime consumer.
Preserve every declaration and constraint; projection creates no route authority.

## Constraints

- Gate 2 granted under the explicit HRO prerequisite delegation. Sequential dependency: accepted
  PMC-P1a implementation, including independent reviews and recorded export/base.
  Start only after P1a releases the shared barrel, schema registry and parity test.
- Consume the accepted P1a validateProviderBindingPolicyV1 and type/schema;
  never duplicate, relax or rewrite that validator. Import its supported package
  module within routing-policy and re-export projection through the public barrel.
- Preserve legacy v0 APIs, schemas, classes, models, dispatch results and behavior.
  No RCM internal imports/edits; retain reconciled RCM public exports untouched.
- Node >=24.11.1 with existing TypeScript/Ajv/schema-generation/node:test tooling;
  no new dependencies, files/network/host configuration, ambient clock or IO.
- D1-D5 coordinator rulings apply: terminal same-lane/same-provider fallback pairs;
  off-pin declarations nonselectable; unresolved budgets non-dispatching;
  unknown family never satisfies independence. Projection must not hide any of
  these constraints or discard unreferenced declarations.
- PMC-P2 MUST enforce disabled L6 at both legacy and v1 launch boundaries before
  any activation. P3 canon and P4 legacy removal cannot defer that enforcement.

### Exact public projection contract

```typescript
type ProviderBindingProjectionV1 = Readonly<{
  schemaVersion: 'pmc-provider-binding-projection/v1';
  evidenceOnly: true;
  policy: ProviderBindingPolicyV1;
}>;
type ProviderBindingProjectionResult =
  | Readonly<{ ok: true; projection: ProviderBindingProjectionV1 }>
  | Readonly<{ ok: false; errors: readonly ProviderBindingValidationErrorV1[] }>;
```

Use the accepted P1a ProviderBindingValidationErrorV1 directly. `projectProviderBindingsV1(input: unknown)` first
calls the accepted P1a validator. On invalid input return its deterministic typed
errors without partial output. On valid input return the full owned, deep-frozen
validated policy in the closed envelope above. No flattened subset, field
renaming, implicit defaults, inferred IDs, reordering or provenance upgrading.

All candidates (including unreferenced declarations), bindings, lane policies,
lane occurrences, fallback references, provider rules, budget references,
authority/independence/gates, ranking requirements, tolerance, versions,
provenance, refusal codes, and unknown/held evidence survive unchanged. Success
asserts structural conformance only, never live eligibility or authenticity of
self-declared evidence. No `rankable`, enabled-for-execution or selected route
field is computed.

The closed projection JSON Schema references/embeds the existing P1a policy
schema without rewriting its constraints. Register and generate only the new
projection schema. P1a schema and legacy schemas stay byte-identical. Optional
occurrence indexes are deliberately omitted in v1's smallest implementation;
a future additive/versioned change can add references without replacing policy.

HRO receives this projection by injection through a separately scoped adapter.
Its HroBindingProjectionDraftV1 is not interchangeable: unknown protocols,
families, budgets or unavailable evidence must remain explicit and cause refusal
where the HRO consumer needs a known value. No cast or synthetic default may
turn the evidence-only envelope into an execution capability.

## Acceptance Criteria

1. Public export exposes projection type/schema/function and consumes accepted
   P1a validation; test invalid input returns the same typed issues, with no
   lossy partial result or bypass validation path.
2. Deep equality tests prove projection.policy equals validated input for every
   field, including full lanes/ranking/authority/gates/versions and unreferenced
   candidates. Test fixtures vary every declaration category and unknown state;
   preserve input array order and exact provider/model/protocol spellings.
3. Output and nested arrays/objects are frozen and detached from mutable caller
   data. Rejected malformed/bounded inputs use P1a limits; no second incompatible
   validation vocabulary or speculative normalization is introduced.
4. Projection schema/type parity passes; accepted P1a and all legacy committed
   schemas remain byte-identical, existing public exports/tests remain green.
5. Inventory repeated on final reconciled base records every discovered consumer
   path/group, compatibility version, owner and named PMC-P4 removal condition.
   P2's mandatory legacy/v1 L6 launch refusal is named separately from later
   P3 documentation/P4 removal. No legacy registry becomes v1 eligibility.
6. Handoff names stable versions/export, injection boundary and unproven
   availability/quality/capability/privacy/freshness claims. Independent reviews
   verify P1b; shaping/accepted P1a are not substitutes for those reviews.

## Out of Scope

PMC-P1a schema/validator changes; consumer runtime wiring; RCM internals; resolver,
ranking, launch, Pi settings/defaults/enablement; credentials/provider calls;
receipt changes; live availability/quality evidence; legacy removal; goal exit.

## Context & References

- [Accepted predecessor scope](../done/PMC-P1a-provider-binding-contract.md)
- [Design, review fixes and inventory](../../goals/pi-model-configuration/pmc-p1-design-compatibility.md)
- [PMC charter](../../goals/pi-model-configuration/charter.md)
- [Ratified role map](../../goals/pi-model-configuration/pmc-p0-role-lane-map.md)
- [Coordinator pattern](../../COORDINATOR-PATTERN.md)

## Allowed Files

- plugins/foreman-line/routing-policy/src/provider-binding-projection.ts
- plugins/foreman-line/routing-policy/src/index.ts
- plugins/foreman-line/routing-policy/src/registry.ts
- plugins/foreman-line/routing-policy/schemas/provider-binding-projection-v1.schema.json
- plugins/foreman-line/routing-policy/tests/provider-binding-projection.test.ts
- plugins/foreman-line/routing-policy/tests/parity.test.ts
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p1-design-compatibility.md
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p1b-verification.md

## Verification Plan

Run routing-policy typecheck/generate/test/lint under Node >=24.11.1 and unchanged
dispatch/spec-linter suites. Check old schemas plus P1a schema for byte parity.
Check allowed-file/import diff; repeat inventory searches on pinned reconciled
base. Rollback removes only P1b additions, retaining accepted P1a and RCM exports.

Mandated reviewer questions:

- Is every accepted policy field preserved, including unreferenced declarations
  and authority/ranking/budget/gate constraints formerly lost by flattening?
- Can projection skip P1a validation, mutate caller data or silently upgrade
  unknown evidence into availability, independence or execution authority?
- Is disabled L6 enforcement assigned to P2 for both launch versions before
  activation, rather than left until canon or legacy removal?
- Do serialization and explicit cutover ownership protect all old consumers?

## Evidence Required

Accepted P1a and exact base/export contract; coordinator Gate 2 and serialized
shared-file handoff; tests/typecheck/schema parity/scope proof; completed
inventory; two independent implementation reviews and finding closure.

## Collision Risk

Index/registry/parity overlap P1a and possible RCM export work. Execute only after
accepted P1a on the reconciled RCM base; no concurrent mutation of these paths.

## Stop-and-Report Rule

Stop for an incompatible predecessor contract, required P1a validator/schema
change, unlisted file, frozen-contract change or production execution authority.
Do not weaken validation or widen this parcel to resolve an upstream conflict.

## Gate 2 and frozen predecessor — 2026-09-26

The user authorized completion of necessary PMC/RCM prerequisites, including
scoped decisions and merges after independent review. Coordinator releases this
private build against main e6daf7e8cd3bc7b7ae61f9646465f8cea60de2c9:
PMC-P1a merged in PR55; supported RCM-P1A wrapper merged in PR56. The existing
validator returns ProviderBindingValidationResultV1 with valid true/policy or
valid false/errors, whose item type is ProviderBindingValidationErrorV1.
Projection retains its own specified ok discriminant and forwards those errors.

Builder worktree: D:/Repos/agent-skills-worktrees/hro-pmc-p1b-20260926.
Branch: codex/hro-pmc-p1b-20260926. Fresh builder must restate and stop at Step 0
before editing. The eight-file allowlist is unchanged. No runtime activation.
Integration of this projection precedes RCM producer additions; the latter may
build in its separate worktree but must preserve this accepted public barrel.
Two independent frontier implementation reviews and green full remote CI remain
merge requirements. Historical owner gate holds do not override this delegation.