---
ticket: PMC-P2C
title: Same-process one-use launch controller
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/dispatch/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Compose the accepted owner resolver and durable ledger in a private same-process
launch controller. Mint registry-authenticated one-use permits, verify final wire
claims and durably consume immediately before the sole sender. Audit JSON cannot
authorize any inference, and HRO cannot supply its own ranking or winner.

## Constraints

- Amendment 05 explicitly replaces initial A1 signature semantics. No HMAC, key
  provisioning, IPC or serializable permit. Node 24.19.0, existing dependencies.
- Only public requests enter this initial controller. Internal/restricted, L6 and
  closed routing/classification aliases refuse before resolver, ledger mutation,
  Pi initialization/discovery or send. Missing/ambiguous legacy intent refuses.
- Consume accepted P2A public API and P2B internal money/ledger exports; no
  duplicate validator, ranking, arithmetic or budget state. v0 selection remains
  unchanged through a trusted explicitly versioned adapter; no implicit upgrade.
- Empty break-glass set: every override request returns BREAK_GLASS_REFUSED.
- Initial tests are synthetic offline conformance, never real availability.

### Controller and permit contract

createPmcLaunchController receives private trusted policy/evidence/config/ledger/
clock and sole-sender ports. Evidence acquisition authenticates source, subject,
scope, timestamp and digest; P1 recorded fields alone are not authentic evidence.
prepare(request) invokes owner selection itself, revalidates current digests,
reserves P2B's exact conservative maximum and mints an opaque frozen permit whose
identity maps to private immutable claims. No public mint/sign/fromJSON operation.
Reject cloned/proxied/forged/reused permit identities. Controller instance identity
and epoch bind permits; another instance or restart never recognizes them.

Claims bind explicit v0/v1 version, request/workflow/task/attempt lineage, lane and
public classification, identity/protocol/baseUrl, policy/catalog/config/runtime
digests, authenticated evidence/expiry, family/instance exclusions, thinking/tool/
output/input bounds and reservation ID/scope/maximum. No raw secrets in claims or
audit. v0 unsigned routing JSON alone cannot mint a permit.

Requested thinking level must be explicitly allowed by authenticated profile
facts and match final wire semantics exactly. Omission from a sparse RCM map is
not permission, even if Pi reports support. No clamp/substitution; required
reasoning with off refuses. Bind these denials into the permit and final guard.

The P2D sender prepares an OWNED immutable final descriptor and wire byte/string
representation after all transformations. The controller's consumeAndSend
closure rechecks every bound value, expiry/current policy and cost bound against
that exact final representation; changed payload must be reauthorized before a
new permit, never implicitly widen it. No mutable Buffer reference may escape.
Persist consume, invalidate in-process permit, then immediately invoke the sole
private sender with the frozen wire value. No user hooks, mutation or awaited
untrusted callbacks between durable consume and sender invocation. Concurrent
attempts serialize on durable consume. Audit write failure after consume is not
permission to resend. Errors after consume retain uncertainty unless the owned
sender returns authenticated no-send proof.

Controller does not claim exactly-once network delivery. Every extra turn/retry/
fallback needs a new permit/reservation; no automatic repeat after uncertainty.
Fallback is only owner-resolver re-evaluation of the declared terminal pair after
definitive prior closure. Restart preserves ledger liabilities but invalidates
all permits; persisted receipts never restore authority.

Synthetic harness uses a structurally separate non-exported test factory with
fake evidence and a sender lacking any network capability. Production creation
has no boolean accepting synthetic evidence; no public test-only bypass flag.
P2D supplies real terminal semantics later. Same-process code possessing private
trusted ports is in the trusted computing base; tasks/extensions cannot obtain it.

## Acceptance Criteria

1. Forged/copied/proxied/reused/cross-instance/restored JSON permits, wrong version,
   changed payload/identity/policy/config, stale evidence and expired permits
   invoke sender zero times; authentic permit invokes one owned sender once.
2. All L6/legacy aliases, missing intent, internal/restricted and break-glass
   requests refuse before dependency effects. No static projection/audit JSON
   grants authority. v0 selection order and v1 owner rules remain distinct.
3. Concurrent launch/restart/failure tests prove atomic consume, conservative
   liabilities, no resend after audit/transport failure and authenticated no-send
   reconciliation only. Per-send bounds match actual immutable wire claims.
4. Synthetic offline harness cannot open network; production factory cannot accept
   its fabricated evidence. Two independent reviews accept capability and trusted
   port boundary, with explicit remaining P2D terminal-coverage limitation.

## Out of Scope

HTTP/Pi integration, HMAC/IPC, host key/config writes, ledger algorithm changes,
provider calls/spend, evidence fabrication, nonpublic activation and HRO source.

## Context & References

- [Amendment 05](../../goals/pi-model-configuration/gate-1-amendment-05.md)
- [P2A](PMC-P2A-owner-resolver.md), [P2B](PMC-P2B-durable-budget-ledger.md)
- [P2 inventory](../../goals/pi-model-configuration/pmc-p2-design-inventory.md)

## Allowed Files

- plugins/foreman-line/dispatch/src/pmc-launch/controller.ts
- plugins/foreman-line/dispatch/src/pmc-launch/controller-types.ts
- plugins/foreman-line/dispatch/src/index.ts
- plugins/foreman-line/dispatch/tests/pmc-controller.test.ts
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p2c-verification.md

## Verification Plan

With Node 24.19.0 and existing offline tools run dispatch `npm.cmd test`,
`npm.cmd run typecheck`, `npm.cmd run lint`, checking exits. Run existing v0 and
P2A regressions. Use fake sender plus real temporary P2B ledger for lifecycle
integration. Diff matches exact Allowed Files; no network/SDK import in core.

## Readiness

Draft until P2A/P2B interfaces and private sender proof contract freeze. No user
authority re-ask is needed for approved preparation. Initial public-only scope
does not weaken any full HRO live exit or permit off-pin L1/L2 execution.
