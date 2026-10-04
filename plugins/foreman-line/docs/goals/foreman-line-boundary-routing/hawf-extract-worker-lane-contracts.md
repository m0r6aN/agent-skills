# Extracted features — `heterogeneous-agent-worker-fabric` → boundary-routing

**Date:** 2026-09-26 · **Disposition:** extraction per coordinator verdict (see `../goal-status-report-2026-09-26.md`)

**Provenance:** design features extracted from `heterogeneous-agent-worker-fabric/charter.md`
(SUPERSEDED; goal directory deleted 2026-09-26 by coordinator verdict — git history retains the
record). The historical charter source `historical-charter-source.md` is preserved byte-for-byte
in git history at deletion time, SHA-256
`2930d5eea38ea45097ff29d25fc46d53c6c65bc97afc8d36e97e98f2d3cd36e4`.

This annex is design input for boundary-routing work item 3 and the shared
`routing-policy/` registry work (RCM/PMC). It grants no authority and ratifies no decision.

## Role separation baseline (extracted HAWF D2)

Coordinator, routine builder, integrator, independent verifier, adversarial judge, operator,
scout, research, multimodal, and extraction responsibilities remain distinct where applicable.
Heterogeneity is useful only if authority and assurance do not collapse into model selection.

## Work-graph mapping (HAWF WF-P0–WF-P27 candidate decomposition, extracted D6)

The historical WF graph is the candidate decomposition; the claiming coordinator reconciles or
re-scopes it at shaping rather than treating old status as current.

| # | HAWF work-graph ownership | Consuming surface in this plugin |
|---|---|---|
| 1 | current orchestration and authority reconnaissance | boundary-routing work item 1 (explicit roots, `foreman-config` identity) |
| 2 | role/authority plus task/result contracts | boundary-routing work item 3 (`role-authority`, `worker-envelopes`, `contract-readers`) |
| 3 | one authoritative model registry and data-classification policy | `routing-policy/` — RCM-P0 catalog/eligibility projector + PMC logical/binding layer; WF-P3 explicitly "does not create a second registry" |
| 4 | provider transport and normalized lane adapters | boundary-routing work item 5 (hooks/templates) + `dispatch/src/routing-eval` |
| 5 | mutation-scope enforcement | boundary-routing work item 4 (`mutation-scope-guard`) |
| 6 | deterministic risk/capability routing and bounded fan-out | boundary-routing D7/D8 + RCM-P4 fixed-order resolver |
| 7 | evidence aggregation, escalation, fallback, degraded mode | `receipts/` + `verification/` packages; recovery ladder per HRO-D8 |
| 8 | integrator and adversarial-judge separation | `role-authority` + `verification/` (reviewer independence is a dispatch-time property) |
| 9 | versioned workload corpus, baseline/fabric harness, context control | RCM-P9/P10 merit-corpus lineage |
| 10 | shadow routing and calibration | `dispatch/src/routing-eval/shadow.ts` (existing; advisory only) |
| 11 | standard and specialist route promotion | RCM merit/promotion; default-route promotion stays human Gate 3 |
| 12 | observability, cost reporting, rollback/upgrade operations | `receipts/`/settlement + read-only ops console (FOC) |
| 13 | exit evidence manifest | A→F receipt-chain convention (see `docs/receipts/`) |

## Carry-over constraints (extracted HAWF D4/D5/D7/D8)

- **D4** — Model/provider identifiers, availability, pricing, capability, data-classification
  eligibility, and fallback are registry-driven and revalidated at dispatch and promotion time.
  These facts drift and must not be frozen from historical sources without evidence.
- **D5** — Secrets are referenced by name only and never emitted. No credential value, length,
  hash, quoting, storage location, or prior-machine environment assumption is operational
  authority. The historical incident is a lesson, not a credential-discovery instruction.
- **D7** — Worker-fabric coordination must consume any ratified hierarchical-coordination and
  sidecar contracts that apply; it cannot amend another live goal's charter or co-own its
  serialization points. Shared serialization points are sequenced, never co-owned.
- **D8** — Existing human, security, merge, deployment, publication, spend, and external-effect
  gates remain in force. Default-route promotion is human Gate 3. Routing cognition differently
  cannot widen operational authority.
