---
ticket: PMC-P2E
title: Derived Pi configuration plan and governed caller migration
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/dispatch/
  - plugins/foreman-line/docs/goals/pi-model-configuration/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Produce a reviewable one-way configuration plan and expose one governed entry
composing accepted PMC selection, ledger, controller and owned transport.
Migrate or explicitly disable discovered governed legacy callers before public
activation, while keeping interactive Pi outside Foreman authority. HRO consumes
this entry and never gains a separate resolver or permit issuer.

## Constraints

- Accepted P1 and P2A-D APIs only; no ranking, monetary, policy schema or capability
  duplication. Amendment 05 is canon. Node 24.19.0, existing dependencies.
- Plan generation is pure; no host apply/default/credential write, provider probe
  or activation side effect. Approved evidence is source, not ambient settings.
- Initial entry is public-only/OpenRouter chat; internal/restricted and other
  providers/protocols refuse. Pinned L1/L2 opencode remains refused, never migrated
  to OpenRouter for convenience. Full HRO live exit stays open.
- All governed legacy/v1 L6 aliases and missing intent refuse before initialization,
  discovery or inference, regardless of legacy registry/template entries.
- Scope does not include HRO implementation or unknown callers. Before dispatch
  inventory exact call sites and either prove the bounded migration below suffices
  or split additional caller adapters with exact paths. Do not claim closure by
  documentation when executable governed bypasses remain.

### Configuration and caller contract

planPmcPiConfigurationV1 consumes accepted policy and authenticated exact identity,
protocol, endpoint, capability, enabled/availability/quality/privacy evidence.
Output a closed plan of supported public registrations/enablement changes,
refusals, input digests, rollback diff and named unproven claims. Credential
references are opaque handles only; no raw keys, interpolation commands or env
expressions. Preserve unrelated settings/interactive defaults. Unknown/held
facts cannot generate an enabled entry; do not alias opencode and opencode-go.
This artifact is evidence-only until a separately executed authorized apply.

Translate sparse observed source thinking facts into explicit Pi denials: each
unobserved/unsupported off/minimal/low/medium/high/xhigh/max level is null in the
generated model configuration (or an independently verified equivalent guard),
never merely absent. Keep observed provider values exact; no invented mapping.
Mandatory reasoning disallows off. Final controller/transport guard is still
required because Pi 0.87.1 treats omitted basic levels as supported and clamps.

Expose launchGovernedPmc over explicit versioned request and trusted installation
ports in process, returning audit/result or typed refusal. It calls the accepted
controller/owned stream only. No generic sender, default Pi launch, serialized
permit input, test-mode flag or public mint API. Classification/lane normalize
through a closed mapping before initialization; aliases cannot hide L6.

Update approval-cli's explicit governed-inference handoff to consume this entry;
executeDispatch remains a worktree/Stage-C operation and does not pretend that
receipt creation launches Pi. Do not add an implicit provider call to an existing
prepare/execute invocation. Existing callers requesting actual governed inference
must pass explicit lane/version/public request and accepted ports, or refuse.
Inventory each discovered script/CLI/session/HRO call site with actual file path,
status migrated/disabled/outside-boundary and test proving its disposition. Files
outside the allowlist require a separately scoped migration parcel, not a bypass.

Milestone 1: public synthetic offline conformance, fake transport incapable of
network, test-only evidence never accepted in production. Milestone 2: actual
public activation only after accepted live availability, lane quality, capability,
privacy, exact endpoints, fresh catalog/config, budget authorities, installation
custody and terminal coverage are evidenced. Record every missing claim by name.
No additional user authority ritual for already authorized preparation; applicable
provider spend/host apply authority is exercised only on concrete reviewed actions.
Initial public activation cannot close nonpublic, other-provider or full HRO exit.

## Acceptance Criteria

1. Plan is deterministic, lossless about unknown/refused facts, exact endpoints
   and digests; it preserves defaults/unrelated fields and contains no credentials.
   No host apply occurs; held identities cannot be enabled from static fixtures.
2. Governed public supported calls use one accepted controller/transport; all
   v0/v1 L6, missing intent, internal/restricted, unsupported protocols/providers,
   unsigned JSON and break-glass requests refuse before initialization/send.
   v0 model selection stays tier-ordered; no duplicate HRO resolver exists.
3. Exact caller inventory plus negative tests demonstrate every governed entry is
   migrated or disabled before activation. Unknown/unmigrated paths explicitly
   block activation; interactive sessions remain non-authoritative.
4. Offline synthetic evidence cannot enter production. Actual public activation
   readiness names every unresolved live/quality/privacy/budget/config claim and
   unsupported HRO requirement. Two independent reviews accept migration evidence.
5. Config/entry negatives prove sparse catalog maps never enable omitted levels,
   off does not become none for mandatory reasoning, and automatic clamping or
   a forged broader Pi supported-level list cannot widen profile authority.

## Out of Scope

Host apply/enablement, real provider probes/spend, interactive defaults, unsupported
protocols/providers/nonpublic requests, HMAC, HRO source changes, v0 removal,
new budget values, evidence fabrication and automatic/full HRO activation.

## Context & References

- [Amendment 05](../../goals/pi-model-configuration/gate-1-amendment-05.md)
- [P2D](PMC-P2D-openrouter-terminal-transport.md)
- [P1b](PMC-P1b-provider-binding-projection.md)
- [P2 inventory](../../goals/pi-model-configuration/pmc-p2-design-inventory.md)

## Allowed Files

- plugins/foreman-line/dispatch/src/pmc-launch/config-plan.ts
- plugins/foreman-line/dispatch/src/pmc-launch/governed-entry.ts
- plugins/foreman-line/dispatch/src/approval-cli/index.ts
- plugins/foreman-line/dispatch/src/index.ts
- plugins/foreman-line/dispatch/tests/pmc-governed-entry.test.ts
- plugins/foreman-line/dispatch/tests/pmc-config-plan.test.ts
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p2e-verification.md

## Verification Plan

Node 24.19.0 existing offline tools: dispatch `npm.cmd test`, `npm.cmd run
typecheck`, `npm.cmd run lint` plus unchanged routing-policy regressions; check
native exits. Network-denied fake transport for conformance. Search all governed
call sites and map each hit to migration/disable test evidence; no host execution.
Check exact diff allowlist and no implicit provider call introduced in worktree
dispatch. HRO integration receives a separate exact-path parcel handoff.

## Readiness

Draft until P2D accepted and caller inventory bounds the concrete migration.
If callers exceed the allowlist, split remaining adapters before activation.
Do not claim a new unused entry point alone has migrated existing callers.
