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

## Triage closure — 2026-09-03

Amendment A1 was ratified by Clinton Morgan, closing all six findings. Disposition:

| ID | Closed by | Verified how |
|---|---|---|
| FL-HWF-01 | Amended D8 restores Gate 3 as the per-parcel merge gate and makes default-route activation a separate human-exclusive act. | Charter D8 plus the "Human gates and standing authority" section now state both; Gate 3 recorded as not delegated. |
| FL-HWF-02 | Every parcel in the ratified graph carries a routing class. | Coordinator re-read `routing-policy.yaml` v0.3: the four admitted values are `boilerplate`, `standard-feature`, `architecture/risk`, `implementation/standard`. The graph uses only the latter two. |
| FL-HWF-03 | Amended D4 makes `plugins/foreman-line/routing-policy` the sole registry authority; WF-P2 may extend it only by compatible versioned migration. | Charter D4. The serialization prerequisite A1 attached was found already discharged (`096adfb`, PR #15) and is recorded in `reconciliation.md` rather than carried as a dependency. |
| FL-HWF-04 | WF-P5 "dispatch binding contract" inserted in wave 1 ahead of the router (WF-P6) and fan-out (WF-P7). | Ratified graph: WF-P6 and WF-P9 both depend on WF-P5. |
| FL-HWF-05 | WF-P10 corpus now depends on WF-P2 and is restricted to registry-controlled classification labels. | Ratified graph dependency cell `WF-P0, WF-P1, WF-P2`; policy `data_classification` keys confirmed on disk as exactly `public`, `internal`, `restricted`. |
| FL-HWF-06 | WF-P17 "evidence-binding verifier" added, and the exit-evidence clarification defines the manifest digest domain and requires cryptographic verification of every descriptor before WF-P18 is accepted. | Charter graph rows WF-P17/WF-P18 and the exit-evidence clarification paragraph. |

No finding was accepted-as-documented and none was deferred. The plan-level review for this
goal is closed; a further plan review is required only if the graph or a locked decision
changes again.

**Reviewer independence note.** This review was dispatched by the prior Codex coordinator
from a fresh session with no builder context. The transferring coordinator did not re-run it;
it re-verified the three findings whose closure rests on current disk state (FL-HWF-02,
FL-HWF-03, FL-HWF-05) and accepted the reviewer's reproduction for the rest.
