---
ticket: HKR-P3
title: Synthetic candidate ledger generations and race safety
status: draft
owner: pilot-owner
created: 2026-10-15
updated: 2026-10-15
risk: elevated
surfaces: [docs/]
routing_class: architecture/risk
verification_class: judgment-required
expertise: architecture
inputs: [text]
data_classification: internal
---

# HKR-P3 — Candidate Ledger and Race Safety

## Intent

Prove protected candidate admission and release obey the selected single-owner dependency-generation protocol under retries, corrections, reassignment and restart. Keep workflow state durable without turning private staging into canonical Cortex memory or another authority engine.

## Constraints

- Use the ratified P0 durable-store/atomic seam and accepted P1/P2 evidence and access contracts; no ad hoc mutable-file transaction claim.
- Bind all supplied source/context dependencies, assignment/attempt and current policy/authority references. Old context remains a dependency even when the worker says it did not use it.
- Atomically compare current generations and register candidate identity, edges, state transition and minimal audit intent. Correction/suppression advances generation before acknowledgement; late new derivatives must fail even if absent from a descendant sweep.
- Perform current authorization/generation checks at actual local release. Unknown authority/durability stays held/pending/unknown. No remote commit or authentic receipt protocol is implemented by this parcel.

## Acceptance Criteria

1. NP-06 produces one candidate occurrence for exact retry/replay and rejects changed input under a reused idempotency key. Lost acknowledgements reconcile the original durable command. Fault-injection/restart tests preserve candidate/edge/state atomicity and reject a second writer under the selected actual store seam.
2. NP-07/NP-08 verify revoke-before-release denial, honest release-before-revoke exposure, required authority unavailability hold, replaced-attempt denial and separately authorized review of a valid older submission. A final release check cannot be bypassed by stale queue/cache state.
3. NP-09 proves a candidate started from generation 7 cannot activate/release after generation 8 correction/suppression, including a new derivative ID absent from a sweep. Restart/reimport/older evidence restore cannot resurrect obsolete control state. Tests explicitly distinguish local proof from the unproved S2 receiving-service fence.

## Out of Scope

- Canonical writes, remote transactional admission, distributed locks, general messaging or active-active control.
- Real personal forgetting/erasure guarantees, permanent transcript audit logging or new cryptographic standards.
- Runtime receipt/epoch minting, truth acceptance, shared publication and Cortex gravity accounting.

## Context & References

- [Shaping baseline and generation requirements](../../shaping/keon-agenttask-synthetic-readiness-2026-10-15.md)
- [P0 contract/store prerequisite](HKR-P0-authority-and-contract-baseline.md)
- [P1 evidence](HKR-P1-synthetic-reconstruction-and-evidence.md)
- [P2 access boundary](HKR-P2-custody-classification-and-isolation.md)
- [P4 route consumer](HKR-P4-bounded-local-extraction-route.md)

## Dependencies And Promotion Blockers

P0–P2 must be accepted. Durable store, exclusive-writer/recovery protocol, release linearization seam, exact file authority and fault-test/evidence paths remain UNBOUND. P0 must select and ratify these before activation; an implementation cannot select a weaker seam to satisfy convenient tests. Shaping-only surfaces require amendment.

## Allowed Files

No implementation, database, migration or test/evidence path is authorized by this draft. P0 must supply an exact per-repository manifest and scoped recovery fixtures, ratified and applied before promotion. Existing goal databases and operational state are excluded unless a later explicit disposition establishes ownership and permitted mutations.

## Verification Plan

An independent verifier replays the required race orderings and crash points on the selected durable implementation, including second-writer rejection and restoration with missing current state. Simulated remote behavior is labeled simulated and cannot close G7.

Mandated reviewer questions: Are comparisons and edge/state registration one durable boundary? Can a new ID evade stale-parent checks? Is revocation acknowledged too early? Can an old snapshot resurrect a grant? Does lost-ack recovery inflate occurrences or falsely report success?
