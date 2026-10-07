# Plan-Level Adversarial Review — Routing Currency and Merit

**Review date:** 2026-09-20  
**Charter:** `charter.md`  
**Reviewer:** fresh frontier adversarial session, read-only, with no coordinator context  
**Scope:** decomposition coherence, parcel boundaries, missing work, load-bearing decisions, and silent collisions

## Review result

The wave backbone is coherent (`ground truth → schema → resolution → refresh → merit`),
and the provenance caveat plus RCM-P0 evidence gate are sound. The plan is not yet
dispatchable: the findings below expose unresolved authority, evidence, execution, and
serialization contracts. Findings marked **Gate 1 reopen** require explicit developer
ratification before the affected parcels are shaped.

## Triage

| ID | Finding | Disposition | Gate 1 impact / affected work |
|---|---|---|---|
| PR-01 | D5 calls refresh a proposer that never mutates policy but also requires automatic Class-A withdrawals. The authority boundary and Gate 3 semantics are undefined; a later tier entry is not automatically safer across capability, transport, independence, and budget. | **Fix — Gate 1 reopen** | Reopen D5–D6. Block RCM-P6 and exit criterion 6 until “auto-apply” and the irreversible policy mutation boundary are explicit. |
| PR-02 | D1/D3/D10/D11 prohibit dispatch-time network access while D11/RCM-P5 promise detection of mid-day disappearance, capability regression, and price breach. No approved runtime snapshot, freshness, provenance, or stale-data behavior exists. | **Fix — Gate 1 reopen** | Reopen D1, D3, D10, and D11. Block RCM-P1/P3/P5/P6 until current-fact semantics are fixed. |
| PR-03 | RCM-P6 requires a governed-model-fleet evidence manifest and RCM-P8 assumes a receipt corpus, but the frozen GMF manifest is effect-bound and existing execution observers/corpus are not established by P0/P1. | **Fix — Gate 1 reopen** | Reopen D12 and the RCM relationship constraint. Block RCM-P6/P8 until the evidence contract is consumable without inventing permission, spend, or terminal references. |
| PR-04 | Exit criterion 8 has no accountable parcel for receipt enrichment, historical input retention, or replay verification; policy identity alone cannot bind changing capability facts, vocabulary, or derived requirements. | **Fix** | Add explicit receipt/replay ownership and acceptance evidence before RCM-P8/P10; do not credit P4 or P10 by implication. |
| PR-05 | RCM-P4 can resolve a capable model, but no parcel carries new requirements through the actual dispatch caller, constrains Pi's bounded choice, enforces thinking level, or reconciles executed identity with the receipt. | **Fix** | Add/assign an execution-integration parcel before exit criteria 4, 8, and 9; preserve boundary-routing D7–D8. |
| PR-06 | RCM-P7 writes the same host `settings.json` that Pi owns, recreating the diagnosed two-writer race. Idempotence is not a concurrency contract, and D13 does not name the authoritative endpoint/config source. | **Fix — Gate 1 reopen** | Reopen D1 and D13. Define ownership, merge/concurrency behavior, and projection authority before RCM-P7. |
| PR-07 | OQ7's immediate F4 correction has no owner, prerequisite, or evidence. If Jev is absent, substitution conflicts with boundary-routing D10; treating it as healthy violates availability validation. | **Fix — Gate 1 reopen** | Reopen OQ7 and its interaction with D10. Assign a parcel or explicitly ratify a refusal/disabled-lane disposition before dispatch. |
| PR-08 | OQ2 says expertise filters within a tier and also says bindings “prefer X over Y”; fallback and refusal semantics are undefined. “Shadow / non-default” in RCM-P9 is also undefined against existing shadow restrictions. | **Fix — Gate 1 reopen** | Reopen OQ2 and D3–D4. Define binding, fallback, refusal, and shadow behavior before RCM-P3/P4/P9. |
| PR-09 | “Ceiling breach” mixes catalog input/output rates with existing per-parcel `ceiling_usd` budgets. Units, bounds, and unknown-price behavior are undefined. | **Fix — Gate 1 reopen** | Reopen D2 and D5. Define the price predicate without silently changing the Context Ledger budget contract; block RCM-P1/P3/P5/P6. |
| PR-10 | OQ5/OQ6 require thinking/context defaults and upward-only derived context, but no parcel owns derivation, persistence, re-estimation, omitted-field behavior, or missing `thinkingLevelMap` behavior. Explicit-field tests do not cover legacy parcels. | **Fix — Gate 1 reopen** | Reopen D7–D8 and OQ5–OQ6. Assign shaping/lint/dispatch semantics before RCM-P2/P4. |
| PR-11 | RCM-P8 lacks admissibility and attribution rules for legacy unlabeled receipts, independent acceptance, repairs across models, pending costs, estimated usage, and small samples. | **Fix — Gate 1 reopen** | Reopen D12. Define corpus inclusion and evidence confidence before RCM-P8/P9. |
| PR-12 | Serialization points and integration ownership are implicit: P0 gates facts; P2 precedes P3/P4; P3/P6/P9 share policy; P4/P5 share dispatch; P6/P7 share host state; P10 needs integrated proof. No parcel owns installed-plugin parity or comprehensive negative controls, and P4 names F1 but not F2. | **Fix** | Amend the queue/dependency graph and acceptance ownership before Gate 2; add explicit F2 and end-to-end routing-path coverage. |
| PR-13 | P0 is correctly an evidence gate; the supplied snapshot is not proof of live defects. Escalating the HAWF ownership conflict must not authorize downstream dispatch while unresolved. | **Accept-as-documented** | Preserve the provenance caveat and stop-condition precedence. No charter change. |

## Gate 1 reopen scope

The review does not silently change any ratified decision. The following items require
the developer's explicit disposition before the affected work can be shaped:

- D1, D2, D3, D4, D5, D6, D7, D8, D10, D11, D12, D13
- OQ2, OQ5, OQ6, OQ7
- the RCM-P4/P5/P6/P7/P8/P9 ownership and dependency amendments identified above

Until those decisions are re-ratified, only documentation of the findings is permitted;
no parcel dispatch or implementation begins.

## Evidence consulted

- `plugins/foreman-line/docs/goals/routing-currency-and-merit/charter.md`
- `plugins/foreman-line/docs/goals/foreman-line-boundary-routing/charter.md`
- `plugins/foreman-line/docs/SPEC-CONVENTION.md`
- `plugins/foreman-line/docs/goals/INDEX.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-artifact-evidence-manifests.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-closure-evidence.md`
- `plugins/foreman-line/dispatch/src/routing-eval/index.ts`
- `plugins/foreman-line/dispatch/src/approval-cli/index.ts`
- `plugins/foreman-line/routing-policy/routing-policy.yaml`
- `plugins/foreman-line/worker-envelopes/src/usage.ts`
