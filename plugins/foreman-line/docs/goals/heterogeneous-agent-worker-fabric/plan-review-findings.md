# Plan-Level Adversarial Review — Heterogeneous Agent Worker Fabric

**Review target:** charter at `ab9e49a91230e50d7c918cf01a493623c44d1a6b`
**Reviewer:** fresh independent reviewer task `/root/worker_fabric_plan_review`
**Scope:** ratified charter plus current Foreman Line canon and relevant implementation
boundaries. Historical source was treated as provenance only.

| ID | Severity | Verified fact | Triage | Required correction |
|---|---|---|---|---|
| FL-HWF-01 | BLOCKER | Canon defines Gate 3 as the merge gate, while this charter used Gate 3 only for default-route promotion even though every parcel must merge. | Fix | Amend D8 to preserve per-parcel merge Gate 3 and reserve default-route activation to the developer. |
| FL-HWF-02 | BLOCKER | Canon requires a valid `routing_class` per parcel; the graph supplied none and the evaluator accepts only four values. | Fix | Add a valid routing class to every parcel in the amended graph. |
| FL-HWF-03 | BLOCKER | Current routing policy already owns model tiers and data classification; evaluator reads it directly; the shared file has a user-owned conflicting edit. | Fix | Amend D4: `routing-policy` is the sole registry authority, with a compatible migration and explicit serialization prerequisite. |
| FL-HWF-04 | BLOCKER | Current contracts/emitter do not bind role, actual model, instance distinction, task/result envelope, and scope guard at dispatch time. | Fix | Add a dedicated dispatch-binding parcel before routing/fan-out. |
| FL-HWF-05 | BLOCKER | Corpus/baseline could precede policy classification; specs permit arbitrary values whereas evaluator admits only `public`, `internal`, or `restricted`. | Fix | Make corpus and baseline depend on the registry parcel and require controlled classification labels. |
| FL-HWF-06 | SHOULD-FIX | Current receipt validation is structural only and does not recompute hashes; routing receipts are separately unchained. | Fix | Add an evidence-binding verifier and define the manifest digest domain and verification requirement. |

Every finding was reproduced against disk before triage. The fixes change locked decisions
and the ratified graph/exit scope, so Gate 1 is reopened only for the amendment below.
