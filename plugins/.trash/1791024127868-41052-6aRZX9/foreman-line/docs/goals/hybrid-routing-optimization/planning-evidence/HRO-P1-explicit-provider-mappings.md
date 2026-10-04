---
ticket: HRO-P1
title: Explicit provider mappings and typed route rejection
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: HRO-P1A
risk: elevated
surfaces:
  - plugins/foreman-line/routing-policy/
  - plugins/foreman-line/dispatch/
  - plugins/foreman-line/docs/goals/hybrid-routing-optimization/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

**Historical umbrella only — not dispatchable.** This initial shape is replaced
by HRO-P1A and HRO-P1B under the 2026-09-26 coordinator ruling. Its shared-file
allowlist and runtime integration wording are not authorization. Retained as
planning evidence; consult the replacement specs and HRO loop directive.

Define an additive, provider-neutral mapping boundary for the existing Foreman
routing evaluator. A resolved route must preserve canonical model identity,
provider-local model ID, protocol, and Pi host model ID as separate values, with
verified provenance and typed fail-closed rejection. Existing OpenRouter
selection behavior must remain valid while unknown or incompatible mappings are
rejected without identity guessing.

## Constraints

1. Reuse the existing routing evaluator, Pi/OpenRouter registry, policy
   validator, and receipt ownership. Do not create a standalone router.
2. Preserve D1-D3, D8, and D9 of the HRO charter: deterministic eligibility
   remains authoritative; Jev remains recommendation-only; unknown identity is
   never inferred; dispatch-time global Pi configuration writes are forbidden.
3. No regex-based identity inference, prefix stripping, version substitution,
   silent provider substitution, fallback addition, network discovery, live
   provider call, credential access, or paid experiment belongs in this parcel.
4. Any edit to a currently claimed routing-policy or dispatch surface requires
   an explicit owner handoff or coordinator-ratified amendment before dispatch.
5. The existing OpenRouter behavior and schema/template parity are additive
   compatibility requirements.

## Acceptance Criteria

- A supported route resolves with separate canonical identity, provider,
  provider-local model ID, protocol, and host model ID fields.
- Exact approved mappings preserve literal identity and include provenance and
  freshness/version data.
- Unknown, missing, stale, or protocol-incompatible mappings return typed
  unavailable/unsupported outcomes without throwing an unhandled batch error.
- A superficially similar or regex-matched model ID never resolves as an alias.
- Existing OpenRouter routes and routing-policy validation remain unchanged in
  behavior and continue to pass their existing tests.
- Mapping rejection cases cover unknown identity, wrong provider, wrong
  protocol, unavailable endpoint, and undeclared fallback.
- No credentials, provider calls, global Pi configuration writes, or new
  parallel receipt/event format are introduced.

## Out of Scope

Deterministic caching; catalog refresh or discovery; Jev invocation or
similarity routing; fallback execution; Pi global configuration apply; receipt
schema changes; settlement implementation; terminal diagnostics; live smoke
execution; model allowlist or tier changes; merge, release, deployment,
publication, and paid provider experiments.

## Context & References

- plugins/foreman-line/docs/goals/hybrid-routing-optimization/charter.md
- plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p0-inventory.md
- plugins/foreman-line/routing-policy/src/pi-openrouter.ts
- plugins/foreman-line/dispatch/src/routing-eval/index.ts
- plugins/foreman-line/docs/goals/pi-model-configuration/charter.md
- plugins/foreman-line/docs/goals/pi-routing-adapter-compat/compat-memo.md
- plugins/foreman-line/docs/goals/routing-currency-and-merit/charter.md

## Allowed Files

The following are candidate implementation files only. They are not
dispatch-authorized until the active-owner handoff recorded in the HRO goal
coordination record is accepted:

- plugins/foreman-line/routing-policy/src/pi-openrouter.ts
- plugins/foreman-line/routing-policy/src/types.ts
- plugins/foreman-line/routing-policy/src/schemas.ts
- plugins/foreman-line/routing-policy/src/index.ts
- plugins/foreman-line/routing-policy/tests/entrypoint.test.ts
- plugins/foreman-line/routing-policy/tests/parity.test.ts
- plugins/foreman-line/routing-policy/tests/semantic-invariants.test.ts
- plugins/foreman-line/dispatch/src/routing-eval/index.ts
- plugins/foreman-line/dispatch/src/routing-eval/tests/mappings.test.ts

## Verification Plan

Run the owning package's existing typecheck, test, lint, and schema/parity
checks. Add focused tests for exact mapping, typed rejection, and unchanged
OpenRouter behavior. Run the dispatch suite as a consumer without editing
dispatch unless the owner-approved contract requires it.

Mandated reviewer questions:

- Are canonical identity, provider-local ID, protocol, and host model ID truly
  separate, or can one field smuggle an inferred alias?
- Can any unknown, stale, or incompatible mapping reach a provider request?
- Does the additive contract preserve every existing OpenRouter route and schema?
- Does any code path silently add a fallback, alter policy authority, or mutate
  global Pi configuration?
- Are mapping provenance and freshness sufficient for later cache invalidation?

## Evidence Required

- Coordinator-linted draft and accepted owner handoff.
- Focused mapping/rejection test output and full impacted package results.
- Independent architecture/risk review findings and triage.
- Diff-scope check proving only allowed files changed.
- No live provider receipt is required for this parcel.

## Collision Risk

High. The policy registry, schemas, exports, and dispatch evaluator are shared
serialization points claimed by active parcels. Work must be serialized.

## Stop-and-Report Rule

Stop if the owner contract is unavailable, if a mapping requires a policy or
schema amendment, if a fallback or provider call is needed, or if an allowed
file is not covered by an accepted handoff.
