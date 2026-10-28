---
ticket: EXA-P0
title: Freeze the bounded execution-adapter contract and bootstrap path
status: draft
owner: clinton.morgan
created: 2026-10-17
updated: 2026-10-17
risk: critical
surfaces:
  - plugins/foreman-line/docs/contracts/
  - plugins/foreman-line/docs/goals/execution-adapter/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

# EXA-P0 - Freeze the bounded execution-adapter contract and bootstrap path

## Intent

Produce the reviewed contract that connects /goal's coordination decisions to real Pi workers for this shaping effort. Resolve command ownership, authority, supported runtime controls, and the independent bootstrap path before implementing another entry that can only refuse. The release exit is two separate shaping workers and the required family-diverse Council critique seats returning authenticated route/attempt references and validated artifacts through one installed CLI.

## Constraints

These are proposed implementation boundaries in a Stage A draft. Human choices confirmed in this chat: local CLI first; only DocSpine/Kompress shaping and AI Council critique sessions; select concrete routes during admission from approved profiles, with no fixed roster in these specs. This draft grants no implementation, provider spend, dispatch, merge, or activation authority. Parcel identifiers are local planning keys, not claims of registered Jira issues. Risk classifications are recommendations for coordinator/human disposition.

Source baseline inspected: agent-skills main 64fb8949bf5134f96fda02df0d4f52ac291a6138; refresh before dispatch. Existing seats.md has an unrelated user modification and is not an authority source.

Confirmed scope: docspine-shaping and kompress-shaping return bounded analysis/draft text; coordinator persists actual specs. council-critique returns findings only. Existing deepAnalyst and verifier roles remain unchanged; lane/role mapping must be ratified here. Workers get immutable evidence IDs, no shell or repository write tools. This release does not operate or modify DocSpine/Kompress services.

Proposed order: P0 contract/bootstrap -> P1 request/packet/admission -> P2 durable authority/accounting -> P3 actual Pi runtime -> P4 CLI composition -> P5 workflow/Council wiring -> P6 independent conformance and activation. No implementation is released by this sequence alone.

Reuse map:
- dispatch/src/pi-entry/index.ts: preparePiEntry, verifyHostModelSelection, writePiEntryRecord; use only when their legacy decision/policy contracts actually admit the task.
- routing-policy/src/pi-resolver.ts and launch-boundary.ts: exact identity, requirement predicates, declared fallback and launch-verification semantics. A stop remains a stop; no filling typed-unavailable pins or recomputing an approved JSON record.
- routing-policy/src/pmc-resolver.ts: provider-neutral eligibility machinery where compatible; its v1 lane/provider restrictions are not expanded implicitly.
- dispatch/src/pmc-launch/ledger.ts and money.ts: existing reservation/uncertain-charge/arithmetic primitives; flat scopes do not prove atomic parent/child budgets.
- worker-envelopes and role-authority: import existing task/result/role schemas unchanged; new task types and adapter sidecars avoid changing frozen fields.
- PMC-P2E2 draft: bounded input/output and private composition design. Its pmc/v1 entry is not built or production-enabled. Ratify whether EXA is its scoped companion; expose one documented operator entry for this new use-case, not two competing activation paths.
- internal-review-launch: offline policy/negative-test patterns only. Preserve mayInvokeProvider:false and the OPMEM-only ratification. Do not promote it to this use-case's receipt issuer.
- shaping package: existing Stage A artifact validation remains separate from route/launch evidence.

The proposed new package is execution-adapter, with foreman-execution/v1 requests and versioned sidecar records. No edits to frozen contracts, role vocabulary, legacy/public-v1 guards, or the OPMEM contract. If integration proves a frozen contract must change, STOP and return the exact conflict instead of implementing a replacement enum/schema.

First entry proposal: existing supported Node runtime with tsx, invoking plugins/foreman-line/execution-adapter/src/cli.ts with one of plan, launch, status, cancel. Requests are bounded JSON stdin; task data cannot select installation modules, provider credentials, shell arguments, configuration roots, or approval factories. Exact framing limits and exit semantics freeze in P0 before P1/P4 release. Plan emits evidence, not an authorizing receipt.

Do not freeze any model roster or auth mode now. Admission selects only from genuinely installed, approved route profiles, each with exact provider/model/auth/thinking mapping, eligibility, billing/quota basis and one declared fallback. P3's build release requires at least one concrete runtime integration profile and a precise method for observing/enforcing its pre-send controls. The current installed Pi 1.3.0 is a compatibility candidate, not proof.

Bootstrap is a separate explicit owner disposition: name constructor/session, exact allowed implementation files per parcel, independent reviewers/method, budget/quota/time/probe bounds, and external authority producer. Review-only construction does not issue a Foreman receipt or waive provider/launch rules. No reviewer or launcher may certify itself. Record any unavailable external control as a held gate.

## Acceptance Criteria

1. Contract records the three user decisions and distinguishes every proposed design decision from ratified authority. There is no inherited USD 5/USD 25 OPMEM budget or subscription/privacy exception.

2. Pin accepted versions, immutable source inputs and supported exports for each reuse seam; reconcile PMC-P2E2 and IR owners without editing their sealed historical contracts.

3. Freeze task types, existing role/lane mapping, CLI request/result/error grammar, state transitions, immutable packet/result schemas and identity namespaces. A legacy-refused task has no fallback into EXA without separately admitted companion authority.

4. Name the actual owner-authenticated origin/installation/route-profile authority mechanism, atomic permit/revocation store and custody boundary. Caller JSON, OS identity alone, file possession, digests or a generic accepted:true callback cannot mint authority.

5. Specify the concrete supported Pi integration and platform isolation mechanism, exact package/runtime pin, available pre-send/usage/identity hooks and evidence needed per auth mode. A missing hook remains a build-release blocker, not a promised future callback.

6. Record an independently authorized bootstrap construction/review route and exact owner dispositions required before P1-P6. The circular dependence on the not-yet-working adapter is explicitly resolved or held.

7. Define proof ladder: deterministic checks -> bounded public synthetic probe -> independent architecture/security/process review -> purpose-specific internal admission -> operational sessions. Public proof cannot imply internal data eligibility.

8. Record rollback/revocation: disable new entry/profile; refuse new permits; stop known children where supported; retain uncertain liabilities and immutable evidence. Existing paths and OPMEM grants stay unchanged.

## Out of Scope

General builders/coordinators, global router replacement, service implementation, MCP wrapper, credential setup, provider calls, actual permit/receipt emission, policy relaxation and bootstrap execution.

## Context & References

- [PMC-P2E2-governed-user-entry.md](PMC-P2E2-governed-user-entry.md)
- [MRC-06-hro-p4-pi-entry.md](MRC-06-hro-p4-pi-entry.md)
- [../../contracts/internal-review-launch-v1.md](../../contracts/internal-review-launch-v1.md)
- [../../goals/internal-frontier-review-admission/ir-p1-offline-construction-handoff.md](../../goals/internal-frontier-review-admission/ir-p1-offline-construction-handoff.md)
- [../../SPEC-CONVENTION.md](../../SPEC-CONVENTION.md)

## Dependencies

No build predecessor. Hard release gate for every later parcel: ratified P0 contract and bootstrap disposition. Existing unresolved PMC/IR gates are evidence to reconcile, not grants to inherit.

## Allowed Files

Future proposed mutation envelope, exact repository-relative paths. These draft entries grant no current mutation authority.

- plugins/foreman-line/docs/contracts/execution-adapter-v1.md
- plugins/foreman-line/docs/goals/execution-adapter/admission-and-bootstrap.md
- plugins/foreman-line/docs/goals/execution-adapter/pmc-ir-reconciliation.md

## Verification Plan

Document review must answer: Is authority supplied by a real external installation rather than the agent's own JSON? Can each required role run through an admitted profile? Does this sequence end in useful sessions rather than another refusal-only milestone? Who independently reviews the bootstrap, and which exact decisions remain human-owned?

