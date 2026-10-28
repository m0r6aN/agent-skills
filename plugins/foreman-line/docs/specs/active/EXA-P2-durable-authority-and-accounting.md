---
ticket: EXA-P2
title: Persist single-use launch authority and bounded attempt accounting
status: draft
owner: clinton.morgan
created: 2026-10-17
updated: 2026-10-17
risk: critical
surfaces:
  - plugins/foreman-line/execution-adapter/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

# EXA-P2 - Persist single-use launch authority and bounded attempt accounting

## Intent

Connect P0's real external authority source to a durable attempt store that claims each launch once and preserves liabilities across crashes. Reuse the existing ledger and exact-money primitives wherever their contracts fit, while implementing only the missing scope coordination and custody.

## Constraints

These are proposed implementation boundaries in a Stage A draft. Human choices confirmed in this chat: local CLI first; only DocSpine/Kompress shaping and AI Council critique sessions; select concrete routes during admission from approved profiles, with no fixed roster in these specs. This draft grants no implementation, provider spend, dispatch, merge, or activation authority. Parcel identifiers are local planning keys, not claims of registered Jira issues. Risk classifications are recommendations for coordinator/human disposition.

Consume P1's validated request/packet/profile, not arbitrary declaration JSON. The production authority binding is the specific external producer frozen in P0; no public constructor or payload flag can supply a replacement authenticator. Authentic owner grant, installation identity and current revocation/expiry are prerequisites for a permit.

Store one immutable origin/task/instance/request identity and its primary/fallback attempt IDs. Persist route/policy/packet/runtime/profile/grant bindings, lease/claim state and observation references. Atomic claim occurs before runtime send; permit/decision from another task/seat is refused. Status reads are evidence-only, never a new capability.

Reuse dispatch/src/pmc-launch/ledger.ts reserve/consume/settle/cancelWithNoSendProof and money.ts arithmetic for admitted paid-API profiles only where the actual accepted contract is satisfied. Do not edit old storage schemas or pass a subscription estimate off as an API charge. A versioned new state store supplies missing parent/subcap atomicity and request/permit custody; document the transaction boundary rather than claim two independent reservations are atomic.

Each request has actual owner-approved token/output/reasoning/request/time and applicable money/quota limits for both attempts, including repeated/cache/tool input and probes. There are no invented numeric defaults or borrowed OPMEM caps. Unknown billing basis or remaining exposure holds before send. Cancellation, timeout or process exit never proves no charge. Persist uncertain liability and disallow automatic retry/fallback until reconciled.

At most one primary and its one approved fallback. Fallback eligibility, authority, allowance and independence are rechecked against the original packet; completed primary is terminal. Every Council seat has its own origin/permit and attempt records, even if the batch has a shared grant.

## Acceptance Criteria

1. Production construction requires P0's authentic source and fixed storage root. Invalid grant/installation/profile/revocation evidence fails before any runtime/credential access.

2. Concurrent/reentrant/replayed launch requests atomically yield at most one claimed execution attempt. Task, seat, packet, runtime or route mismatch never reuses another permit.

3. Durable transition tests cover held/admitted/reserved/sending/uncertain/settled/completed/refused/cancelled semantics as frozen in P0, with no admitted claim from fixtures.

4. Parent and child allowance are reserved as one serialized accounting action or explicitly refused if the existing store cannot enforce it. Unknown prior spending/liability cannot reset to zero.

5. Injected crash at every pre-send/post-send/observation boundary preserves consumed identity and unresolved exposure. Restart can inspect/reconcile but cannot automatically resend.

6. Authentic no-send proof alone releases a reservation. Observed completion/usage and billing mode are distinguished; missing usage or contradictory exposure stays uncertain.

7. Fallback is a fresh attempt only after unusable primary and reconciled exposure, within shared caps; second fallback, renamed primary retry and completed-primary extra review are refused.

8. Atomic record writes, collisions, path containment, corruption, revocation and concurrent budget races have deterministic failure tests. Audit records contain no secrets or arbitrary raw provider payloads.

## Out of Scope

Network sends, credential access, issuer improvisation, global account changes, old ledger migrations, new signing systems without P0 review, and synthetic billing/privacy claims.

## Context & References

- [EXA-P0-contract-reuse-and-bootstrap.md](EXA-P0-contract-reuse-and-bootstrap.md)
- [EXA-P1-packet-and-route-admission.md](EXA-P1-packet-and-route-admission.md)
- [../../../dispatch/src/pmc-launch/ledger.ts](../../../dispatch/src/pmc-launch/ledger.ts)
- [../../../dispatch/src/pmc-launch/money.ts](../../../dispatch/src/pmc-launch/money.ts)
- [../../../dispatch/src/pmc-launch/intent-custody.ts](../../../dispatch/src/pmc-launch/intent-custody.ts)

## Dependencies

EXA-P0 and EXA-P1 accepted; external authority/source and storage transaction design pinned before build release. Existing money/ledger suites remain unchanged.

## Allowed Files

Future proposed mutation envelope, exact repository-relative paths. These draft entries grant no current mutation authority.

- plugins/foreman-line/execution-adapter/src/authority.ts
- plugins/foreman-line/execution-adapter/src/store.ts
- plugins/foreman-line/execution-adapter/src/accounting.ts
- plugins/foreman-line/execution-adapter/src/transitions.ts
- plugins/foreman-line/execution-adapter/tests/authority-store.test.ts
- plugins/foreman-line/execution-adapter/tests/accounting.test.ts
- plugins/foreman-line/execution-adapter/tests/crash-recovery.test.ts

## Verification Plan

Use genuinely constructed temporary stores with private test-owned authority, never a production testMode switch. Reviewer questions: Can digest possession mint authority? Are parent/subcap races atomic? Can a crash, timeout or lost acknowledgement create a second send or release unknown liabilities?

