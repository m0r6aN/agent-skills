---
ticket: OPMEM-P0
title: Operator-developer Cortex memory authority and contract baseline
status: draft
owner: clinton.morgan
created: 2026-10-10
updated: 2026-10-10
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/docs/goals/operator-developer-cortex-memory/
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
expertise: architecture
inputs: [text]
thinking_level: high
---

## Intent

Establish a source-backed, implementation-ready contract baseline for shared operator-developer Cortex memory: long-lived role ancestry used selectively by short-lived Pi agents on three machines, through local container adapters, Azure MCP Gateway, Azure Cortex, and Neon Postgres. Resolve existing proposed bridge/API mismatches before any implementation, and turn the approved requirements into deterministic fixture expectations and exact follow-on mutation manifests. This parcel produces documents/fixture expectations only; it does not deploy services, change frozen contracts, or build memory functionality.

## Constraints

### Authority and dispatch state

This is a Stage A draft, not dispatchable. `OPMEM-P0` is a local planning key, not proof of Jira registration. Risk/routing and permission metadata are proposed for explicit owner/coordinator approval; no standing Gate 2 or Gate 3 authorization exists. The narrative plan's requirements were ratified in conversation, but that is not a fabricated approval/route/receipt artifact. Coordinator lint and applicable approvals precede any work under this spec.

The owner-approved intent is recorded in `keon-cortex-mcp-bridge:docs/plans/operator-developer-cortex-memory.md`, D1-D18. That narrative plan is context, not permission to modify source files or read credentials.

### Read-only reconnaissance boundaries

Resolve the logical repository roots for the bridge, Cortex, MCP Gateway, Keon docs, and Foreman Line from explicit coordinator-supplied roots. Pin supported base revisions and identify pre-existing changes/owners without moving, resetting, fetching, initializing, or overwriting them. The bridge was inspected as an unversioned directory; stop for an owner decision if its upstream/provenance cannot be established. Do not adopt a stale tracking ref or README as release truth.

Source inspection is local and read-only. Cloud resources, Neon data, credentials, real tenant provisioning, live inference/provider spend, git hosting, and external service calls are outside this parcel's authority. Unavailable evidence is recorded as unresolved, never invented. Requests for host-owner export go through the coordinator.

### Memory and responsibility boundaries

Cortex owns memory semantics, verification, lineage, gravity, and durable authoritative storage. Gateway owns trusted tenant/profile/role binding and required governance. The local adapter owns delivery state, never a new memory authority. Pi owns lifecycle integration, bounded contextual delivery, and operator interaction. No direct Pi/adapter-to-Cortex/Neon path is allowed.

Role identity is stable and distinct from role generation, machine installation, temporary agent, Pi branch/session, task/parcel, and model identity. Role grants are trusted enrollment/dispatch inputs, never self-selected MCP arguments. Enforce role eligibility before candidate generation and for exact-ID retrieval, ancestry traversal, handoffs, feedback, and curation. Cross-role handoffs/shared approved knowledge do not open another role's raw ancestry.

Operator-profile projects are broadly authorized; live application/family profiles are server-enforced grants. Using common repositories or Keon backing services does not share tenant/application memory. Local config narrows, never widens, server grants. Missing identity/profile/role fails closed without default coordinator privileges.

### Canon and learning contract

Resolve the authoritative canon edition: the located v1-named canon declares v2 internally. Distinguish invariants, current implementation evidence, tests, and unimplemented contracts. Trace whether HTTP search, gravitational recall, spine events/epochs, Neon persistence, and ancestry actually join in the deployed path.

Preserve the four-force gravity taxonomy, explicit scoring time/history, pinned version/parameters, bounded reinforcement, and old-version replay. Access is distinct from use and outcome; not-applicable feedback is contextual; missing feedback is unknown. Duplicate deliveries and co-delivery must not silently create reinforcement or semantic truth. Feedback events must not accidentally count as new content occurrences merely because an existing history adapter treats every non-Recall event as occurrence.

Freeze the distinction among internal candidate reads, newly delivered consumer recall, retry/re-render of an existing delivery, feedback, and authoritative outcome links. Pending outbox events retain original identity/time/scope and reauthorize at flush; effectively-once commit/accounting is not exactly-once transport.

Role-scoped raw episodes can be captured automatically. Distillation/promotion retains source lineage and the existing approval requirements for active/primary inheritance. No full ancestral archive is injected into context. Configure an approximately 1,000-token initial briefing target; freeze the tokenizer/measurement/fallback rule and acceptance threshold before implementation.

### Governance and branch evidence

Preserve attributable memory influence separately from authoritative governance disposition, actual execution/outcome, and cognitive branch choice. A policy denial does not automatically make an influencing memory false; permitted-but-unexecuted is not success. Denial reason/policy applicability must be grounded in the actual contract, not a speculative enum. Selected/non-selected temporal branches retain chronology, rationale, dissent, judge provenance/criteria when available, and actual outcome evidence only for observed branches. Cognitive `delib_` records never replace execution receipts, and receipt verification does not consult deliberation material.

These are conservative proposed interpretation rules to freeze/review in this parcel, not authorization for numerical utility updates. Any required frozen contract or canonical scoring change triggers stop/report and an explicit owner amendment. This parcel never lands the amendment or modifies frozen Foreman/Cortex schemas itself.

## Acceptance Criteria

- [ ] **AC1 — Root/revision evidence.** `source-baseline.md` names each explicitly supplied repository root role, current commit/status where available, intended supported base, inspected evidence paths, and source ownership. Unversioned/dirty/diverged sources have explicit owner dispositions or remain blocking; no implicit source recovery occurs.
- [ ] **AC2 — Canon authority map.** `canon-authority-map.md` resolves document/version precedence with inspectable evidence, maps D1-D18 to current contracts/code/tests, and separates implemented, model-only, unverified, and missing surfaces. Any unresolved authority contradiction is a failed gate, not a silently selected interpretation.
- [ ] **AC3 — Service/tool seam.** `memory-boundary-contract.md` freezes real Gateway-to-Cortex and local-adapter-to-Gateway tool/auth/schema/response/readiness/version/error/idempotency boundaries, resolving the seven proposed bridge tools versus existing native Gateway Cortex handlers. It states which cognitive writes need which actual governance/receipt dependencies; no fake receipt path exists.
- [ ] **AC4 — Identity/profile/ancestry seam.** The boundary contract defines authoritative role assignment for Foreman-dispatched and interactive Pi sessions, portable tenant/repository identifiers, role/generation continuity, private ancestry and approved shared artifacts, machine credential enrollment/revocation, and live application/family profile scope. Negative examples cover raw role impersonation and cross-role exact-ID/lineage access.
- [ ] **AC5 — Accounting/scoring seam.** `event-and-fixture-contract.md` freezes access/consideration/application/outcome/non-applicability/correction schemas or required versioned extensions, delivery identity, explicit-time semantics, unknown feedback, decay/association fixtures, and replay rules. It documents self-reported versus verified attribution, duplicate resistance, and any required approval/amendment rather than silently changing gravity mathematics.
- [ ] **AC6 — Governance/branch scenarios.** Fixture expectations cover correct memory used for denied action, remembered denial preventing an attempt, supported incorrect-memory attribution, non-content denial, selected/non-selected branches with dissent, executed failure versus unobserved alternative, and superseded policy applicability. No fixture converts cognitive choice into a receipt or penalty by itself.
- [ ] **AC7 — Operational contract.** The contract defines outbox capacity/backpressure, atomic crash boundaries, lost-ack reconciliation, expiry/revocation, queued identity isolation during role/profile switches, poison-event recovery, protocol downgrade refusal, key/epoch/background-worker ownership, and migration/version/rollback seams. Unresolved numeric limits are explicit approval items before follow-on promotion.
- [ ] **AC8 — Evidence and priority budget.** `pilot-and-validation-contract.md` freezes no-skip controlled scenarios and the 14-day real-work rubric, three-machine coverage, token/context/cache/latency measurements, baseline limitations, and owner acceptance conditions. It bounds overhead on primary work such as AgentTask without claiming an unobserved prevented mistake or causal cost saving.
- [ ] **AC9 — Follow-on parcel manifests.** `follow-on-parcel-manifests.md` maps each proposed downstream parcel to a sole target repository/worktree, explicit exact Allowed Files, pinned base, dependencies/seam owner, verification commands, evidence, rollback, proposed risk/routing, required independent reviews, and approval requirements. Oversized cross-repository parcels are split; competing source owners are reconciled. No globs or directory-wide mutation grants.
- [ ] **AC10 — Stop/approval ledger.** `open-decisions.md` identifies every unresolved target revision, scope/issuer design, numeric scoring/operational choice, required frozen-contract amendment, resource operation, and missing approval. Stop findings prevent follow-on promotion. Two independent architecture reviews assess the complete baseline; the author does not verify its own completion.

## Out of Scope

- Production source changes in the bridge, Cortex, Gateway, Runtime, Collective, Pi, or Foreman routing/dispatch/approval packages.
- Altering frozen schemas/canon, inventing a new gravity force, or asserting production ancestry exists because validation models exist.
- Creating Jira issues, emitting receipts/hashes, promoting drafts, dispatching agents, merging, installing the Pi extension, or deploying infrastructure.
- Credential inspection, Neon data access/schema operations, Azure provisioning, remote source recovery, live provider/model calls, or expenditure.
- Redis, non-Pi harnesses, a new SDK, hard distributed work locking, automatic broad knowledge promotion, a full enterprise tenant/billing product, model training, or new Runtime/Collective engines.
- Unrelated AgentTask/project implementation and an open-ended Cortex research program.

## Context & References

- `keon-cortex-mcp-bridge:docs/plans/operator-developer-cortex-memory.md` — ratified requirements, proposed queue, conservative governance/branch interpretation, evidence, stop conditions.
- `keon-cortex-mcp-bridge:README.md`, `VERIFICATION.md`, `docs/CORTEX_PORT_CONTRACT.md`, `docs/ADVERSARIAL_GATE.md`, `src/keon_cortex_bridge/models.py`, `service.py`, `http_port.py`, `server.py`.
- `keon-cortex:src/keon/cortex/api.py`, `providers/postgres/schema.py`, `gravity/contracts.py`, `gravity/forces.py`, `spine/recall_service.py`, `collective/models.py`.
- `keon-cortex:docs/CORTEX_INVARIANTS.md`, `docs/epoch-roots/LANE-00-shared-contracts.md`, `docs/inheritance/cross-generation-inheritance.md`.
- `keon-docs:canon/keon_cortex_canon_v1_locked.json` — edition must be reconciled rather than assumed.
- `keon-mcp-gateway:src/Keon.McpGateway/Backends/CortexClient.cs`, `Tools/Cortex/`, `Program.cs` and current authentication/dispatch role bindings discovered on disk.
- `agent-skills:plugins/foreman-line/docs/SPEC-CONVENTION.md`, `shaping/README.md`, `docs/goals/pi-model-configuration/charter.md` and current Foreman role/route authority.
- Installed Pi `docs/extensions.md`, `docs/mcp.md` and the implementation declarations/examples at the approved Pi version.

Repository-qualified references resolve through the explicit root map established by AC1; machine-specific roots are not embedded into portable specs.

## Allowed Files

Sole mutation root: the approved agent-skills repository/worktree. Only these exact new files may be authored by this parcel:

- `plugins/foreman-line/docs/goals/operator-developer-cortex-memory/source-baseline.md`
- `plugins/foreman-line/docs/goals/operator-developer-cortex-memory/canon-authority-map.md`
- `plugins/foreman-line/docs/goals/operator-developer-cortex-memory/memory-boundary-contract.md`
- `plugins/foreman-line/docs/goals/operator-developer-cortex-memory/event-and-fixture-contract.md`
- `plugins/foreman-line/docs/goals/operator-developer-cortex-memory/pilot-and-validation-contract.md`
- `plugins/foreman-line/docs/goals/operator-developer-cortex-memory/follow-on-parcel-manifests.md`
- `plugins/foreman-line/docs/goals/operator-developer-cortex-memory/open-decisions.md`

The shaping agent authors this draft separately; this parcel does not amend its own authority, narrative plan, other goal records, or any source. A needed additional path requires a coordinator-ratified amendment before use.

## Verification Plan

Deterministic advisory checks: frozen spec-linter frontmatter plus the shaping package's required-body self-check. Coordinator lint independently verifies each baseline assertion against the approved revisions before accepting this parcel. Document/fixture coverage is checked against AC1-AC10 and the ratified requirement IDs; no production tests are claimed by this docs-only parcel.

Two independent architecture/risk reviews are required under approved family-independent Pi routes; neither reviewer fixes or implements the parcel. No reviewer launch/spend approval is inferred from this draft.

Mandated reviewer focus questions:

1. Does the topology preserve Gateway as the service ingress, and does the cognitive-write contract require real evidence rather than fabricate execution receipts?
2. Can a machine credential, caller role argument, exact-ID lookup, lineage reference, global operator grant, feedback call, or cache bypass private role/live application scopes?
3. Does raw role continuity get confused with governed distillation/inheritance, or does a derived summary acquire factual/authorization authority without provenance and approval?
4. Can a recall retry, co-delivery, repeated self-report, new feedback event, or missing feedback incorrectly increase occurrence/utility or punish a contextually irrelevant but valid memory?
5. Are policy denial, branch selection, factual correctness, and observed utility truly separate? Can an unexecuted branch or permitted-but-unexecuted action acquire an invented outcome?
6. Are the Neon-backed HTTP path, spine/epoch/recall history, gravity, and ancestry actually wired, or has a model/stub/README been promoted to implementation evidence?
7. Can queued observations be re-scoped on flush, committed twice after lost acknowledgments, or shown as saved before authority acknowledges them?
8. Are migration, signing, epoch closure, issuer/role lifecycle, branch-aware Pi hooks, numeric budgets, source ownership, and rollback genuinely closed or explicitly blocking?
9. Does the queue protect delivery of primary projects, and can every downstream parcel be independently verified with exact mutation authority?
