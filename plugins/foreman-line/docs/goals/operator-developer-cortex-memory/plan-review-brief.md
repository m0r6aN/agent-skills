# Draft independent plan-review brief — Operator-developer Cortex memory

**State:** PREPARED / NOT DISPATCHED  
**Recorded:** 2026-10-10  
**Authority:** this packet grants no review launch, provider call/spend, route receipt, worktree, mutation, or execution authority  
**Purpose:** minimum-context handoff for a future fresh, independently routed frontier plan reviewer

## Context

The owner wants durable, role-scoped developer memory supporting short-lived Pi agents across one Windows workstation and two Linux Omarchy machines, including applicable WSL/container contexts. AgentTask and other primary-project delivery remain higher priorities than memory infrastructure. Initial integration is Pi-only.

The architecture requirement is Pi extension → local container adapter → Azure MCP Gateway as sole agent-facing ingress → Azure Cortex → existing Neon Postgres. Memory is contextual evidence and never grants execution authority. Current instructions and locked contracts outrank recalled guidance.

Requirements D1–D18 were ratified conversationally before this session. The owner subsequently ratified the P0–P10 planning queue/risk/routing and explicitly appointed the current coordinator. Only bounded planning records and static reviewer-route preparation are authorized. Builder dispatch, P0 execution, source/config mutation, registration, deployment, and provider spend are not granted.

## Subject and required reading

Primary review subject:

- `agent-skills:plugins/foreman-line/docs/goals/operator-developer-cortex-memory/charter.md`.

Bounded repo canon:

- `agent-skills:plugins/foreman-line/docs/COORDINATOR-PATTERN.md`.
- `agent-skills:plugins/foreman-line/docs/SPEC-CONVENTION.md`.
- `agent-skills:plugins/foreman-line/templates/pi-routing-directive.md`.
- Applicable repository AGENTS instructions supplied by the approved task envelope.

Explicit source references within the charter:

- `keon-cortex-mcp-bridge:docs/plans/operator-developer-cortex-memory.md` — ratified requirements, planning queue, governance/branch interpretation proposals, controlled scenarios/pilot.
- `agent-skills:plugins/foreman-line/docs/specs/active/OPMEM-P0-authority-and-contract-baseline.md` — existing draft's exact scope, AC1–AC10, seven Allowed Files, exclusions and reviewer focus questions. Read as a draft, not a dispatch grant.
- `agent-skills:plugins/foreman-line/docs/specs/active/operator-developer-cortex-memory-2026-10-10.shaping-result.json` — one draft ref, `epics: []`.
- `keon-cortex-mcp-bridge:docs/plans/operator-developer-cortex-memory.stage-a-validation.json` — advisory Stage A record.

Root resolutions and approved immutable snapshots must be supplied by the coordinator in the eventual envelope. No guessed root, remote fetch, host configuration, secret file, cloud/Neon access, or full ancestry/history loading is allowed. If required evidence is not accessible within the approved read scope, report the gap instead of widening scope.

Do not read coordinator triage or another reviewer's verdict. Do not use this session's conversational analysis as evidence. Independent review must not be replaced by approving the coordinator's conclusions.

## Inventory / observed state

- Planning queue: P0 authority/contracts; P1 identity/enrollment; P2 durable episodes/recall; P3 accounting/gravity; P4 ancestry/governance/Collective evidence; P5 Gateway integration; P6 adapter/outbox; P7 Pi lifecycle/controls; P8 deployment/onboarding; P9 controlled validation; P10 fourteen-day real-work pilot.
- Proposed and now planning-ratified classes: P0–P6/P8–P9 elevated / architecture/risk; P7/P10 standard / implementation/standard. Sequential by default. Later splits/manifests still require approval.
- Only P0 has a formal draft. Later entries are narrative proposals, not dispatchable specs.
- The original Stage A result contains exactly one P0 reference and no Epics. The validation record describes its checks as advisory only.
- P0 Allowed Files are seven new Markdown documents under the OPMEM goal directory: `source-baseline.md`, `canon-authority-map.md`, `memory-boundary-contract.md`, `event-and-fixture-contract.md`, `pilot-and-validation-contract.md`, `follow-on-parcel-manifests.md`, `open-decisions.md`.
- Local reconciliation recorded agent-skills HEAD `b90ad84132ed3c2e3c05b07c85c47466d11479a1`. The bridge directory has no `.git`. Cortex/Gateway/Keon-docs have revision drift and local changes. No network-refresh claim is made.
- The charter carries prior source-assessment issues concerning bridge/API seams, a v1-named canon declaring v2, and distinct HTTP/gravity/spine/ancestry/Postgres paths. These are carried issues requiring pinned source-backed resolution, not independent findings already proven by this packet.
- No numerical runtime/scoring/outbox/pilot thresholds have been selected by this coordinator. Their approval work belongs to P0.
- No independent plan review, coordinator lint, human W1 approval receipt, registration, promotion, builder dispatch, production implementation or deployment is claimed.

## Your task — independent plan adversarial review

Evaluate the charter against its stated requirements and Foreman canon. Judge the following, without implementing a solution:

1. Is the decomposition coherent, in dependency order, and small enough to become independently reviewable, sole-repository parcels?
2. Are parcel/service/source ownership boundaries real? Where could two parcels silently collide or a dependency remain ownerless?
3. Is a parcel or prerequisite missing? Which decision is load-bearing but unexamined?
4. Does P0's documents/fixture-expectations scope establish the contracts needed downstream without quietly requiring implementation, frozen-schema amendment, provisioning, or source recovery?
5. Are grants, role ancestry, controlled sharing/handoffs, application profiles, and non-public review context kept distinct from authentication, model identities, and memory itself?
6. Do access/use/outcome, governance disposition, branch selection, unknown/counterfactual outcomes, and the four gravity forces remain distinct with approved versioning/replay?
7. Are outbox identity/time/scope, reauthorization, lost acknowledgments, accounting/idempotency, outages, pending-vs-committed claims and operator controls adequately allocated?
8. Does completion still require actual no-skip controlled correctness and fourteen days of attributable work across all three machines, rather than fixtures/model-only evidence?
9. Do priority/stop controls genuinely prevent an open-ended Cortex/Foreman program at AgentTask's expense?
10. Does the approval path preserve independent review, coordinator lint, W1 projection/human approval/registration, promotion, dispatch Step 0 and merge gates without inventing a receipt or adopting a registrar destination by assumption?

Treat settled requirements as constraints. Propose a scoped re-open only if evidence exposes a conflict; name the affected decision and downstream work. Distinguish a planning defect from expected P0 discovery and deferred product scope. Do not select unapproved numerical policy or implementation files merely to make the plan look complete.

## Output contract

Return plain text/Markdown to the authorized harness; the coordinator persists it. Do not edit or commit review artifacts yourself unless the separate approved envelope expressly provides a result-only output seam.

1. **Verdict:** `PASS`, `PASS WITH DOCUMENTED RESIDUALS`, or `REQUEST CHANGES`, with a short rationale.
2. **Findings table:** ID, severity (`blocker`, `major`, `minor`, `informational`), exact charter/canon locator, evidence/naive reading, failure consequence, proposed correction, affected D/parcel IDs, and whether an owner re-ratification or upstream disposition is required.
3. **Boundary/dependency assessment:** explicit coverage of decomposition, missing work, collisions, and P0 scope.
4. **Exit-criterion assessment:** quote any wording weakened or contradicted; distinguish produced/live evidence from fixtures.
5. **Evidence limitations:** what was not inspected, unavailable, or not proved. Do not claim live service/model evidence from documentation.
6. **Custody:** actual selected provider/model and family, primary or declared-fallback use, approved route reference, evidence input references, tool/command summary, and any detected worktree mutation. Unknown metadata stays unknown and is a closure gap.

The reviewer makes findings/recommendations, not acceptance, approval, dispatch, merge, or policy decisions. No fixes/commits; no credentials, provider probes, service calls, source synchronization, provisioning, or implementation. Stop if the approved envelope cannot satisfy independent frontier/data/route/budget constraints.

## Dispatch hold

This is a draft brief, not a kickstarter that can be executed now. The separate `review-route-preflight.md` records static route preparation for the owner/coordinator; it is not a reviewer verdict and is not required reading for the independent seat. Obtain an eligible authorized internal frontier route/launch envelope and separate spend approval before dispatch. No reviewer is running.
