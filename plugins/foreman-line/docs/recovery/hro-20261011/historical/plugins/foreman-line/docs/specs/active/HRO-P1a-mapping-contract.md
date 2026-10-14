---
ticket: HRO-P1A
title: Explicit provider mapping contract and fixtures
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/routing-policy/
  - plugins/foreman-line/docs/goals/hybrid-routing-optimization/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Define and test the additive provider mapping shape consumed by later routing
integration. The contract keeps canonical identity, provider, provider-local
model ID, protocol, Pi host model ID, provenance, and mapping version separate.
It does not select, discover, or execute a route.

## Constraints

- Reuse the existing Pi/OpenRouter registry and schema generation/parity rules.
- Preserve current OpenRouter IDs and behavior byte-for-byte where unrelated.
- No network, credentials, endpoint probe, catalog refresh, Jev call, fallback,
  receipt change, configuration write, or evaluator wiring.
- No regex or prefix logic may infer identity or version equivalence.
- Shared files are candidate scope until the active-owner handoff is recorded.

## Acceptance Criteria

- Supported OpenRouter mappings validate with distinct canonical/provider/local
  ID/protocol/host fields.
- Mapping provenance contains an immutable mapping version and evidence
  reference; absent or stale provenance is invalid for a future resolver.
- Near-miss, unknown, wrong-provider, and wrong-protocol fixtures are rejected
  without aliasing.
- Existing OpenRouter template/schema parity and package tests remain green.
- The contract cannot grant Jev execution authority or alter model allowlists.

## Out of Scope

Evaluator wiring; typed runtime rejection integration; catalog discovery;
availability checks; deterministic cache; fallback; Jev recommendations;
receipts/settlement; diagnostics; Pi configuration apply; live provider calls;
merge, release, deployment, and publication.

## Context & References

- plugins/foreman-line/docs/goals/hybrid-routing-optimization/charter.md
- plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p0-inventory.md
- plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p1-coordination.md
- plugins/foreman-line/routing-policy/src/pi-openrouter.ts

## Allowed Files

- plugins/foreman-line/routing-policy/src/pi-openrouter.ts
- plugins/foreman-line/routing-policy/src/types.ts
- plugins/foreman-line/routing-policy/src/schemas.ts
- plugins/foreman-line/routing-policy/src/index.ts
- plugins/foreman-line/routing-policy/tests/entrypoint.test.ts
- plugins/foreman-line/routing-policy/tests/parity.test.ts
- plugins/foreman-line/routing-policy/tests/semantic-invariants.test.ts

## Verification Plan

Run routing-policy typecheck, tests, lint, schema generation/parity checks, and
the focused mapping fixture tests under Node >=24.11.1.

Mandated reviewer questions:

- Can any field be interpreted as an inferred alias?
- Is the mapping version/hash domain explicit enough for cache invalidation?
- Are wrong-provider and wrong-protocol cases rejected without endpoint calls?
- Did the contract alter existing OpenRouter behavior or authority?

## Evidence Required

Owner handoff, focused fixtures, full routing-policy results, diff-scope check,
and independent architecture/risk review.

## Collision Risk

High; routing-policy schemas, exports, and tests are shared active surfaces.

## Stop-and-Report Rule

Stop on missing owner handoff, required evaluator changes, schema incompatibility,
or any need for network access, fallback, config write, or live provider use.
