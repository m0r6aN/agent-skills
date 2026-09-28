# Goal Charter — Heterogeneous Agent Worker Fabric

**Goal slug:** `heterogeneous-agent-worker-fabric`
**Created:** 2026-09-03 (current-instance intake)
**Owner:** Clinton Morgan
**Status:** Gate 1 closed — amendments A1 (2026-09-03) and A2 (2026-09-04) ratified; Gate 2
granted for WF-P0 only; WF-P0 in build
**Coordinator:** Claude Code coordinator session (`/goal resume`), 2026-09-03 — see
`loop-directive.md`. Transferred from the stopped Codex `/root` coordinator at a pre-dispatch
boundary by explicit developer ruling; that coordinator's Stage Zero work is preserved on
`codex/heterogeneous-agent-worker-fabric-coordinator-20260903` @ `cba257e`.
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
| D4 | *(amended by A1)* `plugins/foreman-line/routing-policy` is the single authoritative model registry and data-classification policy. WF-P2 extends it only through a compatible, versioned migration; no second registry or shadow authority is permitted. Model/provider identity, availability, pricing, capability, data-classification eligibility, and fallback stay registry-driven and are revalidated at dispatch and promotion time. | These facts drift and must not be frozen from the historical source without evidence. Plan review FL-HWF-03 established that the routing policy already owns tiers and classification and is read directly by the evaluator, so a second registry would fork authority. |
| D5 | Secrets are referenced by name only and never emitted. No credential value, length, hash, quoting, storage location, or prior-machine environment assumption from the source is operational authority here. | The historical incident is a lesson, not a credential-discovery instruction. |
| D6 | The historical WF-P0–WF-P27 graph is the candidate decomposition. The coordinator reconciles, re-scopes, or supersedes it at Gate 1 rather than silently treating its old status as current. | The graph contains valuable design work but references packages, dependencies, and approvals absent from this checkout. |
| D7 | Worker-fabric coordination must consume any ratified hierarchical-coordination and sidecar contracts that apply, but this goal cannot amend another live goal's charter or co-own its serialization points. | The two goals should compose without creating dual authority. |
| D8 | *(amended by A1)* Existing human, security, merge, deployment, publication, spend, and external-effect gates remain in force. Gate 3 governs each parcel merge under the canon's green-chain contingency and remains ungranted unless explicitly authorized later. Default-route activation is additionally human-exclusive and cannot be delegated by a standing merge authorization. | Routing cognition differently cannot widen operational authority. Plan review FL-HWF-01 established that canon defines Gate 3 as the merge gate; reserving it solely for default-route promotion would have left every parcel merge ungated. |

## Ratified current parcel graph

The historical WF-P0–WF-P27 graph is superseded as an executable plan. This current graph
retains its required capabilities without carrying forward prior providers, models, package
claims, approvals, or parcel completion. No parcel is dispatchable until the mandatory
plan review closes and an exact Gate 2 grant identifies its permitted dispatch scope.

| Wave | Parcel | Deliverable | Dependencies | Risk | Routing class |
|---|---|---|---|---|---|
| 0 | WF-P0 — topology and authority inventory | Current three-role topology, trust-boundary, package, and rollback-path map. | none | critical | architecture/risk |
| 0 | WF-P1 — role, authority, and envelope contracts | Versioned worker roles and task/result envelopes, including evidence, uncertainty, budgets, and escalation. **(A2)** Additionally defines what "the current three-role path" denotes operationally — in particular what the registry's `verifier` role denotes, and whether it is the same thing as the dispatch table's "adversarial reviewer" and the `reviewer-readonly` permission profile — so WF-P11 consumes a resolved definition rather than discovering an ambiguity. | WF-P0 | critical | architecture/risk |
| 0 | WF-P2 — canonical registry and classification migration | Compatible extension of the sole routing-policy registry for actual model identity, capability, eligibility, fallback, and evaluation state. | WF-P0, WF-P1 | critical | architecture/risk |
| 0 | WF-P3 — provider-neutral invocation seam | Injected transport with credential-by-name, timeout, retry, cancellation, and usage normalization; no live provider call absent separate authorization. | WF-P1, WF-P2 | critical | architecture/risk |
| 0 | WF-P4 — mutation-scope and tool-operation guard | Enforcement that actual actions and mutations remain within declared scope and authority. | WF-P1 | critical | architecture/risk |
| 1 | WF-P5 — dispatch binding contract | Runtime binding of role, distinct worker identity, registry-resolved actual model, task/result envelopes, permission profile, and scope guard before launch. | WF-P1–WF-P4 | critical | architecture/risk |
| 1 | WF-P6 — deterministic risk and capability router | Policy-governed route selection from task type, risk, modality, classification, capability, and budget. | WF-P2, WF-P5 | critical | architecture/risk |
| 1 | WF-P7 — bounded fan-out scheduler | Concurrency, spend, depth, timeout, cancellation, and child-evidence accounting. | WF-P1, WF-P6 | critical | architecture/risk |
| 1 | WF-P8 — evidence, escalation, fallback, and degraded mode | Evidence aggregation plus assurance-preserving escalation, fallback, and refusal behavior. | WF-P1, WF-P3, WF-P6 | critical | architecture/risk |
| 1 | WF-P9 — integrator and adversarial-judge boundary | Distinct-instance integration and independent acceptance contract consuming WF-P5 binding evidence. | WF-P5, WF-P8 | critical | architecture/risk |
| 2 | WF-P10 — classified workload corpus and context control | Versioned corpus/rubric with only registry-controlled classification labels and a context-sufficiency control. | WF-P0, WF-P1, WF-P2 | critical | standard-feature |
| 2 | WF-P11 — frontier baseline harness | Same classified corpus run through the current three-role path with comparable quality, cost, and latency evidence. | WF-P2, WF-P10 | elevated | standard-feature |
| 2 | WF-P12 — candidate-fabric harness | Same corpus exercised through bound candidate lanes with identical evidence instrumentation. | WF-P3, WF-P5–WF-P10 | critical | architecture/risk |
| 2 | WF-P13 — shadow routing and calibration | Bounded eligible shadow evidence and calibration; never a default-route switch. | WF-P11, WF-P12 | critical | architecture/risk |
| 3 | WF-P14 — standard-route promotion package | Promotion evidence for eligible routine implementation, operator, scout, and verifier routes. | WF-P8, WF-P9, WF-P13 | critical | architecture/risk |
| 3 | WF-P15 — specialist-route promotion package | Promotion or explicit non-default disposition for research, multimodal, and extraction lanes. | WF-P8, WF-P9, WF-P13 | elevated | standard-feature |
| 3 | WF-P16 — observability and rollout operations | Quality/cost/latency audit, model upgrade procedure, and exercised rollback path. | WF-P3, WF-P6, WF-P12 | critical | architecture/risk |
| 3 | WF-P17 — evidence-binding verifier | Cryptographically verifies every manifest artifact descriptor: canonical path, SHA-256, schema/version, and required review/promotion binding. | WF-P11–WF-P16 | critical | architecture/risk |
| 3 | WF-P18 — exit evidence manifest | Digest-bound manifest whose complete descriptor set is accepted only by WF-P17's verifier. | WF-P11–WF-P17 | critical | architecture/risk |

The router and registry are shared serialization points. Their exact allowed files and
package ownership must be resolved during parcel shaping.

**A1 serialization prerequisite — discharged 2026-09-03.** A1 as drafted serialized WF-P2
behind resolution of a user-owned uncommitted `routing-policy.yaml` edit. Current disk
evidence shows that edit has landed: commit `096adfb` ("retarget routing policy to
OpenRouter (v0.3)") merged as PR #15, and the registration worktree
`goal-intake-hierarchical-worker-fabric-20260903` reports a clean tree. The prerequisite is
therefore satisfied at ratification and is not carried as a WF-P2 dependency. WF-P2 shaping
must still re-verify policy state at its own dispatch time under D4.

No candidate parcel is dispatchable until Gate 1, mandatory plan review, and an explicit
current-instance Gate 2 grant identify the exact parcel IDs and dependencies.

## Ratified exit criterion

The goal exits only when:

1. the current three-role path is mapped and remains a tested rollback path;
2. current-instance Gate 1 and the mandatory fresh plan review are closed;
3. every ratified parcel completes its full isolated build, deterministic verification,
   independent review, merge, and Stage F lifecycle — and *(A1)* reaches Stage F only after
   its applicable Gate 3 merge is explicitly granted and its green chain is verified;
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

**Exit item 1 ownership (A2).** Item 1's second clause — *"remains a tested rollback path"* —
is discharged by **WF-P16**, whose row reads *"exercised rollback path"*. **"Tested" and
"exercised" denote the same bar** across items 1 and 9 and WF-P16's row; the three ratified
sentences used two words for one requirement and this settles them as one. WF-P0 discharges
item 1's *`mapped`* clause only. Recorded because the owner previously existed only by
inference: the charter named no parcel for the clause, and a goal exit criterion whose owner
must be derived by reading is not ratified, it is assumed.

**Exit-evidence clarification (A1).** The final manifest's digest domain is the complete
canonical descriptor set for its charter/graph revision, implementation SHA, registry/policy
version, envelope/schema versions, corpus and run results, cost/latency/quality evidence,
reviewers, known gaps, and promotion decisions. WF-P17 must cryptographically verify every
listed descriptor before WF-P18 is accepted. Default-route activation remains the developer's
human-exclusive Gate 3 decision. Nothing here relaxes an existing condition.

Per coordinator canon (lesson #33): a parcel spec that restates any exit item above must be
diffed word by word against this text, and a criterion naming a produced artifact is not
satisfied by a fixture imitating it.

## Human gates and standing authority

- **Gate 1:** closed. Ratified 2026-09-03 — D1–D8, the parcel graph, and the exit criterion;
  then amendment A1 (D4, D8, the WF-P0–WF-P18 graph, and the exit-evidence clarification)
  ratified 2026-09-03 with the serialization-prerequisite correction recorded above.
- **Gate 2:** **granted for WF-P0 only**, 2026-09-03. Scope: shape, lint, dispatch, review,
  and rework WF-P0 — topology and authority inventory — in its own worktree and branch. No
  other parcel is dispatchable. Extending this grant requires an explicit new developer
  authorization naming exact parcel IDs.
- **Gate 3:** not delegated. Every parcel merge and, separately and human-exclusively,
  default-route activation remain the developer's.

## Stop conditions

Stop on ambiguous current authority; a collision with another goal or user-owned change;
an unverified model/provider/security fact; any attempt to discover or emit a credential
value; an unbounded spend or fan-out path; worker self-selection or self-promotion; a
fallback that lowers assurance; a builder acting as its own independent verifier; a
historical PR/test/parcel being credited without current Git evidence; a route carrying
data outside its ratified eligibility; or any inferred human gate.

## Gate 1 record

**2026-09-03 — current-instance Gate 1 ratification:** Clinton Morgan ratified D1–D8 as
written, then ratified the then-current WF-P0–WF-P16 parcel graph and exit criterion as
written.

**2026-09-03 — amendment A1 ratification (plan-review closure).** The mandatory independent
plan review recorded six findings in `plan-review-findings.md` (FL-HWF-01 … FL-HWF-06), all
reproduced against disk and all triaged `Fix`. Gate 1 was reopened scoped to D4, D8, the
parcel graph, and the exit-evidence interpretation; D1–D3 and D5–D7 were never reopened and
stand as originally ratified. Clinton Morgan ratified A1 with one coordinator-supplied
correction: the WF-P2 serialization prerequisite is discharged on current disk evidence
rather than carried (see the graph section). The amendment is folded into the decision table,
graph, and exit criterion above; this charter is now the single authoritative text and no
separate A1 proposal section is retained.

Coordinator lint applied at ratification, verified on disk rather than from A1's prose.
**Provenance correction, 2026-09-03:** these three checks were run in the `main` checkout
(`D:\Repos\agent-skills` at `5ce6ddc`), not in the coordinator worktree, which was based on
`cba257e` and therefore still carried routing-policy **v0.1**. The claims below were true of
the repository and false of the branch this charter sat on. The WF-P0 shaping agent caught
the discrepancy by checking base lineage unprompted; `main` has since been merged into the
coordinator branch, so `096adfb` is now an ancestor and the checks hold here too. The lesson
is recorded for Stage F: **a coordinator lint must name the checkout it ran in, and a goal
branch based on a prior coordinator's tip inherits that tip's blind spots, not the
repository's current state.**

- `plugins/foreman-line/routing-policy/routing-policy.yaml` v0.3 defines exactly four
  `routing_class` values — `boilerplate`, `standard-feature`, `architecture/risk`,
  `implementation/standard`. The amended graph uses only `architecture/risk` and
  `standard-feature`, so every parcel carries a class the evaluator admits (closes FL-HWF-02).
- The policy's `data_classification` keys are exactly `public`, `internal`, `restricted`,
  matching the controlled labels WF-P10 is required to use (closes FL-HWF-05's label half).
- `historical-charter-source.md` re-hashed to the pinned `2930d5ee…` at transfer time.

**Open item carried forward, not a gate.** A1 prices 15 of 18 parcels `architecture/risk`,
which under the dispatch table means a frontier builder plus two independent adversarial
reviews each. The developer declined to re-rule classes at ratification; the coordinator may
propose a scoped demotion amendment for specific parcels (WF-P16 and possibly WF-P13 are the
candidates) when their shaping makes the cost concrete. Until then the ratified classes bind.

**2026-09-04 — amendment A2 ratification (WF-P0 shaping findings).** WF-P0's shaping session
surfaced two Gate 1 matters that neither it nor the coordinator could resolve. Clinton Morgan
ratified both:

- **A2(a) — exit item 1's owner.** WF-P16 discharges the second clause, and "tested" equals
  "exercised" as one bar. Folded into the exit criterion above. This converts a coordinator
  *inference* into ratified text: the Q1 ruling during shaping lint reached the same
  conclusion, but by reading three sentences that never equated their terms, which is not the
  same as the charter saying so.
- **A2(b) — what "the current three-role path" denotes.** WF-P1's deliverable is extended to
  define it operationally, including what the registry's `verifier` role denotes and whether
  it is the dispatch table's "adversarial reviewer" and the `reviewer-readonly` profile.
  Verified on disk at ratification (builder worktree `hwf-wf-p0-20260904`, base
  `b9f4e1ac…`): `permission-profiles/src/types.ts:69-75` declares exactly six profiles —
  `coordinator`, `builder-standard`, `builder-architecture`, `reviewer-readonly`,
  `shaping-agent`, `builder-deps` — **none named `verifier`**, so the registry role has no
  profile and its equation to the reviewer is mechanically unbacked. Settled at WF-P1 rather
  than at WF-P11, which would have met the ambiguity mid-build in a parcel chartered to
  measure rather than to define.

Neither A2 item was a blocker for WF-P0, which documents both ambiguities under AC3 and AC9
rather than resolving them, so WF-P0's build continued through this ratification under the
existing Gate 2 grant (scoped re-open: work orthogonal to the re-opened elements proceeds).

Neither this record, A1, nor A2 grants provider spend, secret access, an external effect, a
merge, or default-route promotion. Dispatch authority is exactly the Gate 2 scope recorded
above — still WF-P0 only. **A2(b) extends WF-P1's deliverable; it does not make WF-P1
dispatchable.**

## Amendment A1 — superseded section

A1's proposed text is ratified and folded into the decision table, parcel graph, and exit
criterion above. The former proposal tables are removed deliberately so this charter has one
authoritative reading; A1's drafted wording remains recoverable from
`codex/heterogeneous-agent-worker-fabric-coordinator-20260903` @ `cba257e` and its findings
from `plan-review-findings.md`.

The one substantive difference between A1 as drafted and A1 as ratified: the drafted WF-P2
dependency cell read `WF-P0, WF-P1; policy-edit resolution`; the ratified graph above reads
`WF-P0, WF-P1`, because the policy edit had already landed by ratification time.
