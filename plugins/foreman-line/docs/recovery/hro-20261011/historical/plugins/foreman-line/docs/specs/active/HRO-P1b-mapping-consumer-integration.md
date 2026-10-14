---
ticket: HRO-P1B
title: Integrate explicit mappings with the deterministic evaluator
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/dispatch/
  - plugins/foreman-line/docs/goals/hybrid-routing-optimization/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Wire the accepted P1a mapping contract into the existing deterministic
evaluator without changing route authority or creating a parallel router.
Preserve current callers through an explicitly reviewed compatibility shape and
return typed, fail-closed mapping outcomes for unknown or incompatible IDs.

## Constraints

- Depends on accepted P1a and dispatch-owner handoff.
- Policy eligibility remains authoritative before mapping and before dispatch.
- No discovery, endpoint calls, fallback, cache, Jev, receipt schema, or config
  mutation.
- Existing OpenRouter behavior and current caller compatibility must be tested.

## Acceptance Criteria

- A supported exact mapping reaches the existing evaluator seam with all
  identity/provider/protocol/host fields intact.
- Unknown, stale, wrong-provider, and wrong-protocol mappings produce a typed
  unavailable/unsupported result or a versioned typed error explicitly accepted
  by the owner; no caller silently receives a guessed model.
- Existing evaluator callers and error behavior remain compatible unless the
  owner-approved contract records a versioned change.
- No mapping failure becomes an unhandled batch crash.

## Out of Scope

Mapping contract design; catalog refresh; provider availability; fallback;
cache; Jev; receipt/settlement; diagnostics; Pi config apply; live calls; merge,
release, deployment, and publication.

## Context & References

- plugins/foreman-line/docs/specs/active/HRO-P1a-mapping-contract.md
- plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p1-coordination.md
- plugins/foreman-line/dispatch/src/routing-eval/index.ts

## Allowed Files

- plugins/foreman-line/dispatch/src/routing-eval/index.ts
- plugins/foreman-line/dispatch/src/routing-eval/tests/mappings.test.ts
- plugins/foreman-line/dispatch/src/index.ts

## Verification Plan

Run dispatch typecheck, tests, lint, focused mapping tests, and routing-policy
consumer checks under Node >=24.11.1.

Mandated reviewer questions:

- Does the compatibility path preserve current callers and fixed error meaning?
- Can unknown identity reach any provider boundary?
- Is dispatch still deterministic and policy-first?
- Did the integration accidentally introduce fallback, discovery, or authority?

## Evidence Required

Accepted P1a evidence, dispatch-owner handoff, focused and full test results,
diff-scope proof, and two independent architecture/risk reviews.

## Collision Risk

High; the evaluator and dispatch barrel are shared serialization points.

## Stop-and-Report Rule

Stop on a required contract amendment, missing owner handoff, provider call,
fallback, cache, receipt change, or configuration write.
