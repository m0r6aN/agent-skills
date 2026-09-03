# Goal Charter — Heterogeneous Agent Worker Fabric

**Goal slug:** `heterogeneous-agent-worker-fabric`
**Created:** 2026-09-03 (current-instance intake)
**Owner:** Clinton Morgan
**Status:** Stage Zero in progress — D1–D8 ratified 2026-09-03; exact current parcel
graph and exit-criterion ratification pending
**Coordinator:** Codex `/root` coordinator task — see `loop-directive.md`
**Mode:** repo-local architecture, worker-routing, evaluation, and promotion goal
**Historical source:** `historical-charter-source.md`, SHA-256
`2930d5eea38ea45097ff29d25fc46d53c6c65bc97afc8d36e97e98f2d3cd36e4`

## Objective

Complete a governed heterogeneous worker fabric for Foreman Line: retain frontier models
for coordination, integration, and adversarial judgment while routing eligible routine and
specialist work to explicitly registered worker lanes with bounded authority, cost,
parallelism, evidence, verification, escalation, fallback, and rollback.

This is an implementation goal, not an archival import. It is not complete when the
historical charter is copied, when schemas exist, when provider calls work, or when a test
corpus is green. Completion requires current-instance integration evidence and the human
promotion decision required by the ratified charter.

## Provenance and current-instance boundary

The attached historical charter is preserved byte-for-byte as source evidence. It records
a different Foreman Line instance through D68, WF-P0–WF-P27, PRs, prior Gate 1 statements,
model names, provider decisions, and machine-specific credential observations.

None of those implementation, availability, credential, branch, PR, ownership, or merge
claims is assumed true here. Historical developer rulings are strong design input, but they
do not silently mutate this repository or grant this coordinator current Gate 1, Gate 2,
Gate 3, provider spend, secret access, or external-effect authority. Current Git, policy,
provider, security, and host evidence win factual reconciliation.

## Ratified locked decisions

These decisions are binding for this current instance. They do not grant Gate 2, provider
spend, secret access, an external effect, a merge, or default-route promotion.

| ID | Proposed decision | Reasoning |
|---|---|---|
| D1 | The goal must implement and prove the heterogeneous worker fabric; preserving the source as provenance does not satisfy completion. | The developer explicitly requested a goal to be completed, not a historical record. |
| D2 | The historical role separation remains the design baseline: coordinator, routine builder, integrator, independent verifier, adversarial judge, operator, scout, research, multimodal, and extraction responsibilities remain distinct where applicable. | Heterogeneity is useful only if authority and assurance do not collapse into model selection. |
| D3 | WF-P0 starts as current-instance reconnaissance. It verifies what exists before any prior WF parcel, PR, test, model, provider, or credential claim is credited. | The attached record comes from another machine and instance; false carryover would manufacture completion. |
| D4 | Model/provider identifiers, availability, pricing, capability, data-classification eligibility, and fallback are registry-driven and revalidated at dispatch and promotion time. | These facts drift and must not be frozen from the historical source without evidence. |
| D5 | Secrets are referenced by name only and never emitted. No credential value, length, hash, quoting, storage location, or prior-machine environment assumption from the source is operational authority here. | The historical incident is a lesson, not a credential-discovery instruction. |
| D6 | The historical WF-P0–WF-P27 graph is the candidate decomposition. The coordinator reconciles, re-scopes, or supersedes it at Gate 1 rather than silently treating its old status as current. | The graph contains valuable design work but references packages, dependencies, and approvals absent from this checkout. |
| D7 | Worker-fabric coordination must consume any ratified hierarchical-coordination and sidecar contracts that apply, but this goal cannot amend another live goal's charter or co-own its serialization points. | The two goals should compose without creating dual authority. |
| D8 | Existing human, security, merge, deployment, publication, spend, and external-effect gates remain in force. Default-route promotion is human Gate 3. | Routing cognition differently cannot widen operational authority. |

## Proposed current parcel graph — pending Gate 1 scope ratification

The historical WF-P0–WF-P27 graph is superseded as an executable plan. This current graph
retains its required capabilities without carrying forward prior providers, models, package
claims, approvals, or parcel completion. Every parcel is `proposed` until Gate 1 closes;
none is dispatchable until the subsequent plan review and an exact Gate 2 grant.

| Wave | Parcel | Deliverable | Dependencies | Risk / serialization note |
|---|---|---|---|---|
| 0 | WF-P0 — topology and authority inventory | Versioned map of the current three-role path, current packages, trust boundaries, and the authorized rollback path. | none | critical; discovery only |
| 0 | WF-P1 — role, authority, and envelope contracts | Normalized, versioned role plus task/result contracts, including evidence, uncertainty, budgets, and escalation. | WF-P0 | critical; contracts package |
| 0 | WF-P2 — model registry and classification policy | One registry extension with data eligibility, model identity, capability, fallback, and evaluation state. | WF-P0, WF-P1 | critical; routing-policy serialization point |
| 0 | WF-P3 — provider-neutral invocation seam | Normalized, injected transport boundary with fail-closed credential-by-name handling, timeout, retry, cancellation, and usage normalization. | WF-P1, WF-P2 | critical; no provider call or spend absent separate authorization |
| 0 | WF-P4 — mutation-scope and tool-operation guard | Enforcement that actual mutations/actions match task scope and bounded authority. | WF-P1 | critical; dispatch and permission-profile surfaces |
| 1 | WF-P5 — deterministic risk and capability router | Route selection from role, risk, modality, policy, registry, classification, and budget. | WF-P2, WF-P3, WF-P4 | critical; routing-policy serialization point |
| 1 | WF-P6 — bounded fan-out scheduler | Concurrency, cost, depth, cancellation, timeout, and child-evidence accounting. | WF-P1, WF-P5 | critical |
| 1 | WF-P7 — evidence, escalation, fallback, and degraded mode | Evidence aggregation plus assurance-preserving escalation, fallback, and refusal behavior. | WF-P1, WF-P3, WF-P5 | critical |
| 1 | WF-P8 — integrator and adversarial-judge boundary | Explicit distinct-instance integration and independent acceptance contract. | WF-P1, WF-P7 | critical |
| 2 | WF-P9 — workload corpus and context control | Versioned representative corpus, scoring rubric, and context-sufficiency control. | WF-P0, WF-P1 | critical |
| 2 | WF-P10 — frontier baseline harness | Comparable current three-role baseline evidence for quality, cost, and latency. | WF-P9 | elevated |
| 2 | WF-P11 — candidate-fabric harness | The same corpus exercised against registered candidate lanes and controls. | WF-P3, WF-P5–WF-P9 | critical |
| 2 | WF-P12 — shadow routing and calibration | Bounded, eligible shadow evidence and documented calibration; never a default-route switch. | WF-P10, WF-P11 | critical |
| 3 | WF-P13 — standard-route promotion package | Per-lane promotion evidence for eligible routine implementation, operator, scout, and verifier routes. | WF-P7, WF-P8, WF-P12 | critical; Gate 3 required before default activation |
| 3 | WF-P14 — specialist-route promotion package | Separate promotion or explicit non-default disposition for research, multimodal, and extraction lanes. | WF-P7, WF-P8, WF-P12 | elevated |
| 3 | WF-P15 — observability and rollout operations | Cost/quality/latency audit, upgrade/rollback procedures, and exercised rollback path. | WF-P3, WF-P5, WF-P11 | critical |
| 3 | WF-P16 — exit evidence manifest | Digest-bound record of graph, artifacts, evaluation, reviewers, gaps, and promotion decisions. | WF-P10–WF-P15 | critical |

The router and registry are shared serialization points. Their exact allowed files, package
ownership, and sequencing must be resolved during parcel shaping; the current user-owned
uncommitted `routing-policy.yaml` edit is not this goal's work.

No candidate parcel is dispatchable until Gate 1, mandatory plan review, and an explicit
current-instance Gate 2 grant identify the exact parcel IDs and dependencies.

## Proposed exit criterion

The goal exits only when:

1. the current three-role path is mapped and remains a tested rollback path;
2. current-instance Gate 1 and the mandatory fresh plan review are closed;
3. every ratified parcel completes its full isolated build, deterministic verification,
   independent review, merge, and Stage F lifecycle;
4. every promoted worker call uses versioned task/result envelopes and a registry-resolved
   actual model identity;
5. routine implementation, operator, scout, verifier, research, multimodal, and document
   lanes either pass their declared promotion evidence or remain explicitly non-default;
6. mutation scope, data classification, role separation, independent verification, fan-out,
   spend, timeout, cancellation, retry, fallback, and degraded-mode controls pass negative
   and failure-path tests;
7. the same versioned workload corpus compares the frontier baseline and candidate fabric,
   including a context-sufficiency control and real shadow sample;
8. accepted quality is equal or better for promoted routes and the evidence states cost,
   latency, rework, escalation, disagreement, and unsupported cases honestly;
9. rollback and model/version upgrade gates are exercised; and
10. the developer performs the human Gate 3 production/default-route promotion after the
    coordinator presents a green, digest-bound evidence manifest.

## Human gates and requested standing authority

- **Gate 1:** D1–D8 ratified. The exact current parcel graph and proposed exit criterion
  still require explicit ratification before Gate 1 is closed.
- **Gate 2:** not granted. The coordinator requests a current, exact parcel-set grant after
  Stage Zero and plan review.
- **Gate 3:** not delegated. Default-route promotion and any consequential external effect
  remain human-owned.

## Stop conditions

Stop on ambiguous current authority; a collision with another goal or user-owned change;
an unverified model/provider/security fact; any attempt to discover or emit a credential
value; an unbounded spend or fan-out path; worker self-selection or self-promotion; a
fallback that lowers assurance; a builder acting as its own independent verifier; a
historical PR/test/parcel being credited without current Git evidence; a route carrying
data outside its ratified eligibility; or any inferred human gate.

## Gate 1 record

**2026-09-03 — partial current-instance ratification:** Clinton Morgan explicitly ratified
D1–D8 as written. The response did not ratify the proposed exit criterion, a current exact
parcel graph, or standing dispatch authority; they remain open and are not inferred.
