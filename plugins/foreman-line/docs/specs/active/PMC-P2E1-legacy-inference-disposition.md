---
ticket: PMC-P2E1
title: Explicit retirement of governed legacy inference executors
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
risk: critical
surfaces:
  - plugins/foreman-line/dispatch/
  - plugins/foreman-line/jev-decisions/
  - plugins/foreman-line/tests/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Close the three discovered governed legacy inference entries before any PMC
activation. Replace their executable behavior with explicit pre-effect retirement
refusals, while preserving pure selection/validation and unrelated tools. This
is a DRAFT compulsory behavior-retirement proposal under V6/V8, not implementation
authority or a claim that its replacement is production-ready.

## Constraints

Inventory base is `d98e176e6ce6d6164679d35dc21647ef47f33f67`; source pins and
callers are in the inventory. Root must dispose E-01/E-02 and coordinate the
shadow/Jev owners before Gate 2. Two independent design reviews are required.
Node 24.19.0, existing packages only. No new dependency, environment switch,
policy edit, replacement sender, automatic v0-to-v1 adapter or test-mode bypass.

### Closed retirement behavior

1. `executeShadowRoute(input, dependencies, options)` keeps its current function
   signature and Promise result type, but always rejects with the existing
   `ShadowRoutingError`, adding exactly code `LEGACY_EXECUTION_RETIRED` and fixed
   message `Legacy governed inference is retired.` It does this before inspecting
   any argument, resolving authorization, reading policy/files, calling a clock,
   discovering/invoking an adapter or writing a receipt. Malformed inputs and L6
   aliases receive the same retirement error. No skipped/candidate result is
   manufactured. The pure exported `hashShadowPublicInput`, `SHADOW_LIMITS` and
   published input/result types remain; no public export is removed.
2. `executeDecision(input)` keeps its signature and declared RuntimeResult but
   always rejects with a new exported `LegacyDecisionRetiredError extends Error`
   (same file; existing wildcard barrel carries it), readonly code
   `LEGACY_EXECUTION_RETIRED`, the same fixed message. This is intentionally a
   new typed rejection, not a fabricated GenericRecord needing a clock, source
   or retention timestamp. No input/property/clock/lease/custody/transport reads,
   key/environment access, timeout allocation or response parsing occurs.
   Existing constants/types remain. Pure validator/replay/consumer APIs remain.
3. `tests/jev-smoke-test.mjs` becomes a tombstone command: one stdout JSON line
   exactly `{"ok":false,"code":"LEGACY_EXECUTION_RETIRED"}` plus newline,
   exit code 2, no stderr. It ignores argv/stdin/env, imports no transport or Pi,
   and performs no fetch/credential/config/fixture read. Direct invocation and
   module evaluation both remain side-effect-free except that fixed output and
   process exitCode assignment. Never keep the previous request behind a flag.

Remove only now-unreachable private execution helpers/imports in the two allowed
runtime files; do not retain a callable private old sender as a workaround. Keep
helpers needed by the surviving public hash/types and preserve their semantics.
No tombstone touches arguments even when Proxy traps/accessors would throw.
All refusals happen before any dependency effect, including advisory discovery.

### Compatibility and owner disposition

The shadow API previously could return a reviewed-candidate or normalized skip
and write receipts for a non-L6 public task. Its shipped `shadow_routes: {}` is
dormancy, not enforcement: an alternate valid policy reaches `invokeAdapter`.
E1 intentionally retires that optional analysis as well as disabled lanes.
The earlier shadow contract must be explicitly dispositioned by root; it is not
silently reclassified as outside governance because its output has no authority.

Jev's alpha-decisions lease/budget guard is not C/B1/D composition. Its typed
recommendation workflow loses live execution; there is no replacement Jev/L6
transport in E2. Historical observations/receipts and fixture data remain intact.
Do not delete their parsers or falsify historical test coverage.

The offline lab stays byte-unchanged by root direction. Its container-relocated
runner calls executeDecision with fake transport and a nonsecret marker; after E1
it reaches its existing execution_error handler rather than its old success path.
That is a known simulator compatibility loss, not a new network risk or a claim
of preserved simulation behavior. Existing lab paths/Dockerfile already have
relocation mismatch in this checkout; no container repair is in scope. Root must
acknowledge this impact or amend scope before release, not add a production bypass
to keep a demo green. Pure sanitized-fixture replay is the surviving offline API.

`evaluateRouting`, declarations/schema, approval-cli prepare/execute, generic Pi,
root skill evals and offline lab source are unchanged. A downstream host importer
not present in this repository must handle the typed retirement error; inventory
does not establish host-wide consumer absence. Re-enabling old sends is not a
rollback option under V6/V8 without a new authority decision.

## Acceptance Criteria

1. Every direct and barrel path to both retired APIs returns the exact typed
   rejection with zero input reads/dependency calls/effects, for previously valid,
   null/hostile/reentrant inputs, all lanes/aliases and alternate shadow policies.
   Direct smoke child process returns exact bounded JSON/exit 2 with fetch and
   credential access traps installed before import. No real key is read.
2. Preserve pure public-input hashing, v0 selector ordering, Jev validation,
   fixture replay and consumers. Convert only old executor-success expectations
   to retirement negatives; retain unrelated assertions and fixtures. No skip,
   blanket test deletion or synthetic credential unlock. Inventory records the
   lab compatibility loss and every known executor disposition.
3. Focused and package regression checks pass; exact export/diff inspection shows
   no source outside the envelope, policy/config edits or alternate sender.
   Independent reviewers accept root's explicit behavior-retirement decision.

## Out of Scope

Replacement inference, L6 enablement, live proof, host/network/credential access,
lab adaptation or container builds, deleting fixtures/tools, schema/receipt
migration, routing-policy changes and E2 implementation.

## Context & References

- [Parent and root decisions](PMC-P2E-config-caller-migration.md)
- [Inventory](../../goals/pi-model-configuration/pmc-p2-caller-inventory.md)
- [Amendment 05](../../goals/pi-model-configuration/gate-1-amendment-05.md)
- [Existing shadow contract](KONE-TBD-cerebras-shadow-operational-dispatch.md)
- [Shadow executor](../../../dispatch/src/routing-eval/shadow.ts)
- [Jev runtime](../../../jev-decisions/src/runtime.ts)
- [Direct smoke](../../../tests/jev-smoke-test.mjs)
- [Offline lab](../../../labs/jev-container/jev-run.mjs)

## Allowed Files

Proposed future implementation only; eight paths, three bounded checkpoints:

- plugins/foreman-line/dispatch/src/routing-eval/shadow.ts
- plugins/foreman-line/dispatch/tests/shadow-routing.test.ts
- plugins/foreman-line/jev-decisions/src/runtime.ts
- plugins/foreman-line/jev-decisions/tests/runtime.test.ts
- plugins/foreman-line/jev-decisions/tests/p4-boundary-scenarios.test.ts
- plugins/foreman-line/tests/jev-smoke-test.mjs
- plugins/foreman-line/tests/pmc-legacy-executors.test.mjs
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p2-caller-inventory.md

## Verification Plan

Task 1 (two files): shadow tombstone and retained pure hashing tests. Task 2
(three files): Jev typed refusal and both affected runtime suites. Task 3 (three
files): direct smoke tombstone, child/import zero-effect tests and inventory.
No step enables the remaining legacy entry; E1 completion requires all three.

With Node 24.19.0 and existing dependencies, dispatch focused command is
`node --import tsx --test tests/shadow-routing.test.ts`; Jev focused command is
`node --test tests/runtime.test.ts tests/p4-boundary-scenarios.test.ts` from their
respective package roots. New script check from repository root:
`node --test plugins/foreman-line/tests/pmc-legacy-executors.test.mjs`.
Run `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run lint` in dispatch,
jev-decisions and routing-policy. Also syntax-check changed runtime.ts directly
because Jev's existing lint/typecheck only checks its index; do not exaggerate
that script as a full TypeScript check. No live smoke or Docker run.

Refresh tracked executor search and one-time unchanged-file/export comparison.
Reviewer focus: Can alternate policy, a barrel alias, dry-run marker or a direct
script still reach inference? Did retirement inspect arguments before refusing?
Are consumers/test losses disclosed rather than hidden? Is pure v0 unchanged?
