---
ticket: PMC-P2F
title: Reuse the fixed provider-binding schema validator inside its owner
status: active
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
risk: elevated
surfaces:
  - plugins/foreman-line/routing-policy/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Remove repeated compilation of the fixed provider-binding policy schema while
preserving validation of every supplied policy. The existing projection and PMC
resolver both call this owner validator; retaining its compiled schema is a
small preparation step for HRO-P2 measurement. This delivers neither a reusable
route nor a choice-cache fast path, and makes no latency or cost savings claim.

## Constraints

**DRAFT — not dispatchable.** Independent design review and coordinator Gate 2
must freeze this contract, source base and exact mutation authority before a
builder starts. This shaping grant permits only the spec and companion notes;
the Allowed Files below describe proposed future implementation authority.
Standing constraints apply. No self-approval or ShapingResult is part of this
bounded documentation task.

Accepted main is `71fd4895a60f90318b517818da14dea94b627fb0`; shaping starts at
`d3aabaa9b732481cc4dc7b5e65e40dadfd5924fa` (accepted main plus coordinator closure).
Inspected owner blobs are provider-bindings.ts
`6dc979d360c75bf1409e044f59e90146a109505d` and provider-binding-schemas.ts
`f301f9dc562b6520f56ae2bc29a56ba86952f6fd`. Reconcile source drift before release.
The schema is already recursively frozen; no schema freezing or generation
change is needed.

### Internal lifecycle

- Keep the synchronous `validateProviderBindingPolicyV1(input: unknown)` API,
  types, exports and all existing result shapes unchanged. Use existing Ajv
  8.20.0 and TypeScript conventions; introduce no dependency or configuration.
- Retain at most one successfully compiled validator per loaded module instance,
  private to this owner and exclusively for `providerBindingPolicyV1Schema`.
  This is compiled-code reuse, not policy/result memoization or digest trust.
- Initialize lazily at the existing compilation phase, after input snapshotting,
  inside the existing typed validation try/catch. Both Ajv construction and
  compilation remain inside that boundary with unchanged options
  `allErrors: false, strict: true`. Importing the module does not construct or
  compile a validator. Do not introduce top-level initialization that can throw.
- Assign the retained reference only after successful compilation. Construction
  or compilation failure returns the existing
  `{ valid: false, errors: [{ code: 'VALIDATION_BOUNDARY_FAILED', path: '' }] }`.
  Failed initialization retains no validator or failure sentinel. A subsequent
  invocation that passes snapshotting may retry once; no same-call retry, loop,
  fallback validator or success claim. Persistent faults continue returning that
  typed refusal. Recovery is possible, not guaranteed.
- Once compilation succeeds, retain that validator even when an input fails
  schema/semantic validation. Every invocation snapshots its own input, invokes
  the validator on that owned value, then performs the existing semantic checks
  and freezing. A later validator-execution throw remains the existing typed
  boundary refusal; it does not clear/recompile the retained validator. A later
  call still invokes it normally, without promising recovery from a persistent
  execution fault.
- Preserve capture limits, refusal precedence, first schema-error path,
  semantic error order/cap and immutable successful policy ownership. A snapshot-rejected input still refuses before compilation/validation, cold or warm.
  Retention must never authorize skipping validation of equal objects, equal
  digests, a previously accepted object or a mutated caller-owned object.
- Ajv's `errors` is mutable state. Read the current failing invocation's first
  instancePath immediately and construct the existing fresh public error value;
  never return its errors array/object or retain that array for a later call.
  Success and typed exceptions must not consume a preceding call's errors.
- Keep changes local and small. No generic cache manager, invalidation registry,
  public reset/injection port or policy handle. Full resolver request validation,
  current evidence checks, candidate audit, ranking and selection-only authority
  remain exactly as accepted.

## Acceptance Criteria

1. A cold valid call compiles once and validates; later valid, schema-invalid and
   semantic-invalid calls reuse exactly that successful compiled validator and
   still validate every owned input. An isolated cold-module test establishes
   zero construction/compilation at import and at early snapshot refusal.
2. Alternating valid -> invalid A -> valid -> invalid B -> valid calls produce
   unchanged results, with distinct invalid schema paths and no stale errors.
   Save both refusals and prove later calls do not mutate them. Compare successful
   values and representative existing schema/semantic refusals against the
   accepted behavior, including first-failure precedence.
3. Validate an accepted caller object, mutate a schema field and a semantic
   binding relationship in independent cases, then validate again. Each later
   call refuses at its original gate; the prior successful owned policy stays
   frozen and unchanged. Cold/warm hostile capture and bounds cases retain their
   existing typed codes and do not reach Ajv when snapshotting fails.
4. In isolated test-local fault injection, construction and compilation throws
   each produce VALIDATION_BOUNDARY_FAILED without escape. A fail-once compile
   followed by a normal call retries and succeeds; subsequent calls compile no
   further times. Persistent compilation failure refuses once per invocation.
   A post-initialization execution throw also stays typed, preserves prior
   returned results, and does not trigger recompilation. No public injection
   hook, production environment switch or package change supports these tests.
5. Tests use the real Ajv compile/validate path for normal behavior and count
   real calls where relevant. Fault instrumentation is confined to isolated
   test processes/module instances, restores patched state, and cannot leak to
   concurrently running tests. No fake-only successful policy validation.
6. Existing routing-policy, projection, resolver and impacted hybrid-routing
   tests/typechecks/lints pass. There are no changes to public exports, generated
   schemas, manifests, dependency locks, resolver source or its gates/comparator.
   Record one-time diff verification and exact commands/results in companion
   notes, not permanent tests pinned to a moving branch.
7. Report mechanism evidence (successful compilation count and behavior parity)
   separately from timing. Any optional synthetic cold/warm profile pins Node,
   source, fixture, repetitions and process/module lifecycle; disclose concurrent
   host load and absent provider work. Equal/slower results are valid findings.
   No promised threshold, provider-cost savings or HRO completion claim.

## Out of Scope

Validated-policy, catalog or choice caches; persistent storage; schema changes;
new exports/handles/ports; resolver refactoring or ranking shortcuts; authentication
and evidence production; controller, custody, budgets, provider invocation,
configuration, Jev, network, dispatch, permits, receipts and full charter exit.

## Context & References

- [Owner validator](../../../routing-policy/src/provider-bindings.ts)
- [Frozen schema](../../../routing-policy/src/provider-binding-schemas.ts)
- [Owner resolver](../../../routing-policy/src/pmc-resolver.ts)
- [Owner notes](../../goals/pi-model-configuration/pmc-p2f-schema-reuse-notes.md)
- [HRO charter](../../goals/hybrid-routing-optimization/charter.md)
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md)
- [Spec convention](../../SPEC-CONVENTION.md)

## Allowed Files

Proposed future implementation only, pending independent design review and Gate 2:

- `plugins/foreman-line/routing-policy/src/provider-bindings.ts`
- `plugins/foreman-line/routing-policy/tests/provider-bindings.test.ts`
- `plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p2f-schema-reuse-notes.md`

Spec lifecycle/amendment edits belong to the coordinator. If an isolated test
requires another file, seek a narrow amendment; do not silently broaden scope.

## Verification Plan

Use existing Node >=24.11.1 and installed dependencies. From each of
`plugins/foreman-line/routing-policy` and `plugins/foreman-line/hybrid-routing`,
run `npm test`, `npm run typecheck`, and `npm run lint`. Run applicable current
contract-reader/mutation-scope checks when their existing inventories require
them; do not change those inventories to hide a new obligation. No installs or
generated-file refresh. Documentation shaping runs the existing spec-linter
`validate <spec-path>` and required-section check; those are advisory, not Gate 2.

Reviewer focus: Can malformed input still stop before lazy initialization? Is
there exactly one retained successful validator and no cached policy result?
Does a failed compile leave the next invocation recoverable without hiding the
failure or retrying within the current invocation? Do alternating errors retain
their own paths? Are cold/import tests actually isolated from earlier warm calls?
Does execution-fault instrumentation preserve the real library path elsewhere?
Can any change skip current claim validation or change refusal/ranking behavior?

## Gate 2 private implementation release — 2026-09-26

Independent frontier design review approved 1be2778f5cf22904195de71931fa960838bd338f
with no blocking findings. Coordinator accepts the narrow owner optimization
under the user's HRO/PMC prerequisite delegation. Clarify the input wording:
only snapshot-rejected input stops before Ajv; schema-invalid ordinary data still
reaches Ajv, cold or warm. No schema or validation semantics change is authorized.
This release supersedes the draft dispatch wording above.

Implement only the three Allowed Files, using Node 24.19.0 and existing matched-lock
read-only dependencies. Accepted main is 71fd489; original owner source/schema pins
remain unchanged at release. Workspace is
D:/Repos/agent-skills-worktrees/hro-pmc-schema-reuse-shaping-20260926, builder branch
codex/hro-pmc-schema-reuse-20260926. Preserve the frozen shaping branch at 1be2778.

A frontier builder must verify head/spec, inspect/restate and STOP at Step 0 before
coordinator release. The native offline agent dispatch substitutes the template's
minted provider-runtime receipt for this development task only; do not fabricate
an independently attested engine version or execution receipt. No provider launch,
production authority or runtime receipt obligation is relaxed. Two independent
frontier implementation reviews and complete integration/remote CI remain gates.
No push, merge, provider call, host change, dependency install, generated refresh,
public injection/reset API or policy/result memoization by the builder.