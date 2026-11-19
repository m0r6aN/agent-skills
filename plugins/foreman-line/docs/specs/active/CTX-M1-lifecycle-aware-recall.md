---
ticket: CTX-M1
title: Lifecycle-aware current recall and honest context metadata
status: draft
owner: clinton.morgan
created: 2026-10-30
updated: 2026-10-30
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - src/keon/cortex/spine/recall_service.py
  - src/keon/cortex/spine/recall_events.py
  - src/keon/cortex/services/curation.py
  - src/keon/cortex/api.py
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
expertise: architecture
thinking_level: high
---

## Intent

Make recall lifecycle-honest: a fresh current-answer recall never returns superseded material as current advice (F2 regression: approve Friday freeze, supersede with Thursday freeze, `payments freeze starts friday` returns Friday with `verified:true` and no lifecycle status today), while authorized historical inspection retains the previous version and the transition. Carry lifecycle and epistemic status, provenance/receipt state and integrity method through to the model-visible context, and freeze explicit semantics for historical/replay retrieval and for retries after supersession/revocation/erasure. This is charter M1: useful continuity without turning obsolete information into institutional authority.

## Constraints

Dependencies: P0 lifecycle/replay contract disposition (CD-2) settled before dispatch; coordinates with P3b (read-time integrity) and P12 (immutable-core/lifecycle-projection seam — M1 must consume that seam when it exists; do not model lifecycle by mutating immutable content, hazard 4). Locked invariants (charter §3): OPMEM authority boundaries, identity/scope contracts, immutable historical IDs, pinned scoring versions, attribution labels are preserved; memory is contextual data, never a capability or policy-overriding instruction; **no automatic truth-promotion or feedback-learning rule** lands under this work.

Hazard 5 / CD-6: integrity is not currency or truth. Current-answer recall excludes non-current material by default; historical/audit retrieval is explicit and typed. The legacy `verified` field keeps its historical meaning and version compatibility — never silently reinterpreted as factual truth.

Proposed default for CD-2 (hazard 6, **pending disposition Q3**): a bound selection that becomes superseded returns a **typed conflict** on the current-answer path; historical replay exposes original selection/scoring time and current lifecycle, cannot silently widen or re-rank, and still reauthorizes and respects erasure. Fresh operation IDs are not a workaround for ambiguous semantics; retries follow the frozen contract.

Shared-file rule (charter §6.3): `api.py` is a single-writer surface — this parcel's adapter edits run in the coordinator-allocated window, contract-first then serial integration with P1/P2/M2/P14; no concurrent edits.

## Allowed Files

- src/keon/cortex/spine/recall_service.py
- src/keon/cortex/spine/recall_events.py
- src/keon/cortex/services/curation.py
- src/keon/cortex/api.py
- tests/test_recall_http.py
- tests/test_recall_postgres.py
- tests/inheritance/test_curation_http.py
- tests/inheritance/test_curation_postgres.py
- tests/spine/test_recall_lifecycle.py

## Migration & Compatibility

Existing recall consumers see added lifecycle/epistemic metadata fields and an explicit current-vs-historical mode; existing field meanings (notably `verified`) are unchanged. API changes are additive except where CD-2's typed conflict replaces an ambiguous historical answer on the current-answer path — that delta is recorded and approved (scoped amendment) before implementation. Curation/supersession flows keep working during the migration; memory-provider and live-PG behavior must both pass.

## Acceptance Criteria

AC-1 (F2 regression): approving a freeze and superseding it makes fresh current recall return only the replacement as current advice; the superseded item is never presented as current, with lifecycle status visible. Test exists in both memory and live-PG modes.
AC-2 (M1): archived, contested and provisional items each have explicit, tested policy on the current-answer path (excluded/typed per the frozen contract).
AC-3 (M1): historical inspection returns the original with its original selection/scoring time and current lifecycle status; it cannot silently widen or re-rank and reauthorizes (tenant/scope) and respects erasure.
AC-4 (M1): model-visible context carries lifecycle + epistemic status, provenance/receipt state and integrity method; the legacy `verified` semantics and version compatibility tests pass unchanged.
AC-5 (CD-2/Q3 as dispositioned): retries and recalls after supersession/revocation/erasure follow the frozen contract; a bound selection superseded mid-session yields the dispositioned behavior (proposed: typed conflict) with a dedicated test.
AC-6: no automatic truth-promotion or feedback-learning behavior is introduced (negative tests where feasible).
AC-7: zero-tolerance checks hold: no superseded fact labelled current anywhere in served output; existing recall, curation and API suites pass; no change to frozen gravity mathematics.

## Out of Scope

Batched/indexed candidate reads and N+1 elimination (M3); tokenization or hybrid retrieval (M4); quality benchmarks (M5); the agent-loop demo (M6); shard identity round-trip (M2); read-time corruption handling (P3b); lifecycle-storage seam implementation (P12 — consume only); any automatic promotion/learning rule; any capability or instruction semantics for memory content.

## Reviewer Questions

1. Can any current-answer path still surface superseded/archived/contested material as current advice?
2. Does historical replay leak into current answers, or silently re-rank/widen?
3. Is `verified` still byte-compatible in meaning for existing consumers?
4. Does the typed-conflict (or dispositioned) behavior cover mid-session supersession, revocation and erasure retries uniformly?

## Context & References

- Charter §5 M1 row, §2.2 finding F2, §4 hazards 4/5/6, §9 demo steps 4–5; S3 principles (memory is contextual data)
- keon-cortex src/keon/cortex/spine/recall_service.py, recall_events.py; services/curation.py; api.py
- P0 contract-decision register CD-2/CD-6; P12 seam description (hazard 4) — consume, do not implement

## Verification Plan

Durable tests in `tests/spine/test_recall_lifecycle.py` (F2 regression, lifecycle matrix, replay semantics, retry contract) plus live-PG variants via the existing Postgres test harness (`KEON_TEST_DATABASE_URL`); memory-mode parity required. Run existing recall/curation/API suites unchanged. Review focus: any path where obsolete material reads as current? Any silent reinterpretation of legacy fields? Receipt maps each AC to test commands and records the CD-2 disposition actually implemented per charter §8.3.
