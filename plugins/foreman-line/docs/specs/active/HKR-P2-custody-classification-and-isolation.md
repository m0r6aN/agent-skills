---
ticket: HKR-P2
title: Synthetic custody classification and assignment isolation
status: draft
owner: pilot-owner
created: 2026-10-15
updated: 2026-10-15
risk: elevated
surfaces: [docs/]
routing_class: architecture/risk
verification_class: judgment-required
expertise: security
inputs: [text]
data_classification: internal
---

# HKR-P2 — Custody, Classification and Isolation

## Intent

Prove a synthetic source can yield a minimal single-domain assignment without exposing the other domain or another assignment's private material. Exercise actual selected local enforcement with fake principals/data, while distinguishing policy simulation from a demonstrated custody boundary.

## Constraints

- Depend on accepted P0/P1 schemas and fixtures. A folder, project tag, role name, local deployment or policy-owner label is not an ACL or universal readership grant.
- A synthetic custodian's intake authority is separate from extraction/review grants. Domain, appointment, assignment and destination restrictions apply to content and derived IDs/snippets/cache/history paths, not merely UI filtering.
- Invented personal/customer/credential-like markers test content holds only; do not use genuine secrets or personal data. Scanner not_detected is not declassification. Legitimate project attribution must remain distinguishable from behavioral personalization.
- Preserve inherited source/context constraints and AgentTask class compatibility. Unclear rights/class mappings hold before model delivery; removing names does not authorize a broader audience.

## Acceptance Criteria

1. Synthetic mixed-domain/content fixtures disclose only the permitted minimal context under a current bounded assignment. Personal/customer/secret-like and uncertain spans hold before a worker can receive them; legitimate minimally attributed project decisions remain eligible under their own fake grants. Required scanner/inspection unavailability fails closed.
2. NP-02–NP-05 show cross-domain and same-role/other-assignment reads denied through search, exact IDs, snippets, cache and replay. A reviewer receives only assigned context under separate review authority. Source instructions cannot widen audience, acquire tools or redirect delivery.
3. Evidence identifies actual tested principals, selected enforcement interfaces and negative results without sensitive payload leakage. Real physical boundary claims require actual local enforcement tests, not an in-memory allow/deny stub. Synthetic retention/copy inventory and cleanup expectations match the approved S0 envelope, without creating personal-memory retention policy.

## Out of Scope

- Real tenant/profile enrollment, real transcript inspection, customer records or operator behavioral inference.
- Cross-project sharing exceptions, ancestry admission, publication or implementation of AgentTask/Runtime production policy engines.
- Broad scanner development, universal taint guarantees or automatically banishing participants.

## Context & References

- [Shaping constraints and baseline locators](../../shaping/keon-agenttask-synthetic-readiness-2026-10-15.md)
- [P0 authority baseline](HKR-P0-authority-and-contract-baseline.md)
- [P1 synthetic evidence](HKR-P1-synthetic-reconstruction-and-evidence.md)
- [P3 control consumer](HKR-P3-candidate-ledger-and-race-safety.md)

## Dependencies And Promotion Blockers

P0/P1 must be accepted; actual isolation principals/mechanism, initial intake authority, allowed local scanner coverage, class mappings, exact mutations and evidence/cleanup paths remain UNBOUND. P0 must reconcile ownership with existing memory goals. No architecture is selected by an implementation author's preference. Shaping-only surfaces must be amended before promotion.

## Allowed Files

No implementation, policy-store, fixture or evidence-output path is authorized in this draft. Require P0's exact per-repository mutation and test manifest, independently checked and ratified before activation. Broad surfaces, descriptions of directories and a permissive current shell do not expand this boundary.

## Verification Plan

Independent security verification attempts the listed negative reads using the actual selected synthetic enforcement path. If a path does not exist or cannot be exercised, record unsupported/blocked, never a green simulated pass.

Mandated reviewer questions: Can the worker bypass isolation via filesystem/process identity? Can metadata/snippets/cache reveal denied content? Does shared role membership leak a peer assignment? Can a summary launder restrictions? Are classification failures and unclear AgentTask mappings held before inference?
