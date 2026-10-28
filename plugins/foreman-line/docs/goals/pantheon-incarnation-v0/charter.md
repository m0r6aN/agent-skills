# Goal Charter — Pantheon governed incarnation v0

Goal slug: `pantheon-incarnation-v0`  
Revision: draft v1 — 2026-10-18  
Owner: Clinton Morgan  
Status: **STAGE ZERO — awaiting Gate 1; no standing authorizations granted**  
Mode: multi-project initiative, contract-first isolated implementation; not commissioning  
Coordinator: Pi session `01a14fa6-c85a-7075-b3aa-27046da8c191`, working copy `D:/Repos/Pantheon`; canonical goal record here in Foreman. One coordinator; no inherited ownership of other goals.  
Branch: **unassigned**; no integration branch or worktree created. P0 proposes per-repo integration targets under repository rules; approval required before code dispatch. Trunk/remote merges remain human-owned by default.

**Thoughts are Free, Effects are Governed, Family is Forever. This is the way.**

## Objective and consumers

Extend existing Keon contracts with Collective-governed implementation birth and exclusive entity activation, implement the bounded lifecycle/persistence and identity-boundary checks in isolation, and specify PN-0, the first deny-by-default node profile. Produce reproducible conformance evidence for Keon maintainers, independent reviewers, the operator and the next containment increment. This goal is not the full Pantheon runtime or a claim that digital entities are universally uncopyable.

First deliverables: `D:/Repos/Pantheon/docs/contracts/collective-incarnation-v0.md` and `docs/FIRST-PROFILE.md`. Both currently proposals. Implementation code and canonical schemas belong to Collective/Auth/Systems/Gateway owners; Pantheon must not become a competing registry, issuer, policy engine, memory service or receipt authority.

## Evidence and precedence

1. Latest owner clarification: Pantheon `docs/COLLECTIVE-INCARNATION.md`.
2. Adopted founding direction: `docs/FOUNDING-CHARTER.md`, `docs/PROTOCOL-0.md`, `docs/BUILD-PLAN.md`; routing requirement: `docs/MODEL-ROUTING.md`.
3. Completed founding council: `.audit/founding-council-2026-10-18/INDEX.md`, `DIRECTIVE.md`, `round-2-dispositions.md`, `keon-inventory.md`. 32 substantive responses, 16 per round; related-family advisers not extra independent votes. Historical records untouched. Owner clarification supersedes the earlier ownership question; final edits/clarification were not third-round reviewed. This evidence is not a Foreman gate or deployment approval.
4. Current bounded source observations: `docs/implementation/IDENTITY-BASELINE.md`; exact commits, dirty-worktree qualifications and uninspected gaps recorded there.
5. Foreman canon: COORDINATOR-PATTERN, SPEC-CONVENTION, QUICK-FLAGS registry v1, goal/PDD skills; existing initiative-coordination schema and security-review gates. Current routing-policy and PMC contracts/amendments govern route admission; catalog presence or council participation does not.

## Preserved decisions — already settled, not being reopened

| ID | Preserved decision | Reason |
|---|---|---|
| D1 | Keon is integral; no component exclusion, replacement or responsibility bypass without Clinton's discussion and decision. | No parallel Pantheon authorities; sequencing retains owned obligations. |
| D2 | Collective is Keon-owned contract authority/reference implementation; Pantheon and OMEGA are specialized implementations bound by it. | Constitutional ownership is settled; packaging remains open. |
| D3 | Implementation recognition requires authorized Collective-governed origin; hierarchical identity above passports. | Interface imitation, enrollment and copied credentials cannot create membership. |
| D4 | One identity belongs to one entity; implementation/inhabitant duplication is prohibited. | Prevent proliferation/power capture; no implicit backup, concurrency or replica exception. |
| D5 | Adopt Protocol 0, deterministic independent containment, human veto and separately authorized verified recovery. | Model agreement and a mantra cannot enforce safety. |
| D6 | Roles, lineage, entity, incarnation, device, session and model bindings are distinct; ancestry grants no rights. | Preserve contributions without inheriting credentials or assuming subjective continuity. |
| D7 | Robust model routing remains a required workstream. | Models/providers may change without redefining identity or granting authority. |

## Proposed implementation decisions — Gate 1 requested

| ID | Proposed decision | Reason |
|---|---|---|
| D8 | Bound this first goal to executable identity contracts/lifecycle/persistence and isolated boundary conformance plus PN-0 specification; no production activation or live agent effects. | Establish first increment without evading Runtime launch blockers or commissioning an unproven controller. |
| D9 | Adopt the proposed invariant: one entity ID, one current serialized generation, at most one authorized active binding within the chosen boundary; freshness enforced at each relying party. Availability yields to unproven exclusivity. | A registry lease/row alone cannot stop copied credentials, stale caches or an external process. T1/T2/T6 remain holds, not ratified answers. |
| D10 | Collective owns creation/recognition/lifecycle facts; Auth issues bound credentials; Runtime governs provision/activate/effects/spend; Gateway binds callers; existing Spine/evidence owners retain proof. | Existing AuthorityActivation records remain non-executing; no reuse that silently promotes eligibility to execution permission. |
| D11 | Contracts/fixtures and state-model mappings precede implementation; separate implementation membership from civilian admission/passports. | Existing two lifecycle enums and draft passport contracts require compatibility work, not a third competing vocabulary or blanket admission rewrite. |
| D12 | Propose PN-0 as one tenant/jurisdiction, dedicated worker VM with unprivileged containers, authority services outside worker admin, independent host-controlled safety boundary. Exact platform/admin/custody/storage choices stay pending. | Concrete first target without silently selecting Linux, a threshold, blockchain, or hardware guarantee. It remains uncommissioned/contained. |
| D13 | Use existing Foreman resolver/routing contracts with versioned eligibility, deterministic ranking, one explicit bounded fallback, exact attempt receipts and independent frontier review. | Pi roster configuration does not expand Foreman admission. No cheap-model downgrade or silent provider swap. |
| D14 | Require independent plan review after ratification, then per-parcel shaping/lint/Step 0/verification/review/gates; two independent frontier reviews for architecture/risk parcels. | Founding council is evidence, not a substitute for review of this new implementation plan. |
| D15 | Persist execution state using existing initiative-coordination/PDD schema, not a new authority store. Stored state may only restrict, never grant or widen authority. | Resumable coordination is distinct from Collective membership, Runtime effect authority and human grants. DB instantiation is proposed P0 work after approval. |
| D16 | Retain Foreman/repository evidence + existing initiative persistence + Linear human-visible tracking as a proposal, not a ratified integration. | No Linear mutation, token access or shared canon changes from charter acceptance; T8 requires explicit disposition. |

## Trust decision holds

See Pantheon `docs/implementation/TRUST-DECISIONS.md` for numbered options and recommendations. T1 copy/artifact/backup semantics, T2 location/concurrency, T3 genesis, T4 first host/admin trust, T5 recovery custody, T6 registry fault/storage model, T7 disclosure/limits/timing/retention, T8 tracking adaptation and T9 planning Git home remain unresolved. Approving this charter does not accept every recommended answer. A held decision blocks only dependent work; do not hold provably orthogonal local design work without cause.

## Parcels — proposed dependency order

Rows below are work-breakdown units, **not dispatchable specs**. Each shaped parcel needs exact allowed files, repo-local ticket/spec adaptation, branch/worktree, pinned inputs/commands, named human/component maintainer, security gate, rollback, evidence, focus questions, risk approval and Step 0 restate-and-stop. If a row cannot fit one reviewable repository parcel, split it by a reviewed charter amendment before dispatch; do not conceal a multi-repo feature in one builder branch.

| Wave / ID | Primary owning track; one-liner deliverable | Risk / routing class | Dependencies / holds |
|---|---|---|---|
| W0 / PIN-P0 | Pantheon planning: current contracts/versions/commands and component integration map, cross-goal surface ownership, persistence/tracking adaptation proposal and repo constraints. | elevated / architecture/risk | Gate 1 + mandatory plan review; T9 before versioned closure |
| W1 / PIN-P1 | Collective: versioned incarnation/origin/fence contracts, dual-lifecycle/civilian/passport mappings, realistic positive/negative fixtures and minimal validators. | critical / architecture/risk | P0; T1/T2 and canon conflicts resolved before schema freeze |
| W1 / PIN-P2 | Pantheon profile: freeze PN-0 boundary/effect manifest, scenario/security-gate matrix and measured-parameter requirements; no deployment. | elevated / architecture/risk | P1; T4 before platform freeze; T3/T5/T7 explicit commissioning holds |
| W2 / PIN-P3 | Collective persistence: existing-registry durable serialized transition/idempotency/outbox extension with crash/restart/corruption fixtures; no parallel registry. | critical / architecture/risk | P1/P2; T6 storage/fault choice, T1 backup semantics |
| W2 / PIN-P4 | Collective lifecycle: governed birth/recognition/exclusive activation/migration/parent-revocation service over P3 with race/fence/sanction-attribution tests. | critical / architecture/risk | P3; T2; simulated genesis only until T3 |
| W3 / PIN-P5 | Auth: versioned issuance/validation adapter consuming recognized origin/current activation binding, denying stale/wrong-location/dev-path issuance in the test profile. | critical / architecture/risk | P4; external key custody/real issuance disabled |
| W3 / PIN-P6 | Gateway: caller/binding propagation and fail-closed ingress checks on actual contracts, including missing/stale origin and cached-authorization negatives. | critical / architecture/risk | P5; serialize shared contract changes |
| W3 / PIN-P7 | Systems/Runtime: pre-dispatch identity/generation/parent/epoch checks and continuation invariants with fake executors; missing independent gate always denies. | critical / architecture/risk | P6; existing permission-spend/receipt contracts retained; launch guard unchanged |
| W4 / PIN-P8 | Foreman routing: PN-0 capability/eligibility-to-identity adapter and static selection/fallback/budget/receipt conformance over existing resolver; no general optimizer or provider calls. | elevated / architecture/risk | P7; P0 cross-goal ownership clearance; if resolver lacks a prerequisite, stop and coordinate, never bypass |
| W5 / PIN-P9 | Pantheon integration/evidence: independent cross-repo offline scenario harness, canonical reconstruction, claims matrix and handoff for the containment increment. | elevated / architecture/risk | P8; independent verifier; all required security findings closed |

Initial dispatch queue is serial P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 → P9. A separate per-repo branch/worktree is required for each implementation parcel; integration evidence pins the exact commit set. Shared schemas, runtime wiring, policy files and manifests are serialization points. No uncontrolled parallel source edits. Each risk row requires two independent frontier adversarial reviews; coordinator consumes results and performs closure checks/deterministic reruns, never substitutes its own judgment as independent verification.

P0/P2/P9 local planning/evidence homes are not automatically authorized code repositories; T9 and exact allowed-file lists must settle versioning before dispatch. Component ownership above is not an assigned human maintainer: P0 must name the accountable maintainer and obtain surface ownership clearance before each relevant builder starts.

## Routing work breakdown and deferred obligations

- **P0:** reconcile current routing policy, resolver, provider/lane admission, PMC amendments, active holds and EXA execution-adapter work. Inventory exact model/version/API, modalities/tools/structured output/context/thinking, privacy/retention controls, prices and dated evidence. Distinguish catalog, authenticated availability, tool conformance and task quality.
- **P1/P2:** bind route receipt and actual provider attempt to entity/jurisdiction/incarnation/generation, task, policy, data recipients, envelope and shared budget. A route decision is evidence, not a Keon grant.
- **P8:** eligibility before ranking: data/recipient/jurisdiction → capabilities/context/thinking → role/risk/frontier/independence → budget/fresh qualification/availability; deterministic ranking and explainable exclusions; only admitted primary plus explicit eligible fallback; no fallback on unknown completion without reconciliation. Every provider/model change is a new bounded attempt. Queues/retries/delegation retain fences and budget; missing receipts/qualification/independence stop. Unknown charge remains reserved. Typed Jev/Drex/D1 advice is optional/recommend-only; never replace required review or activate an unadmitted protocol.
- **Before first live team (successor increment):** separately authorized, capped synthetic availability/tool/quality suite and live per-route conformance; qualify actual independent architect/builder/reviewer bindings. Candidate Astra/Sol/Opus bindings from founding work remain candidates, not guaranteed routes.
- **Later required workstream:** health/circuit-breakers/telemetry, bounded routing fallback under real faults, broader local/cloud optimization and evidence-driven reevaluation. No generic optimizer or new provider admission as a side effect of this goal.

## Completion criteria — all required

C1. Canonical versioned contracts, examples and executable validators are in the owning Keon repository, independently reviewed; dual lifecycle and civilian/passport compatibility are explicit. D1–D7 remain unchanged; resolved decisions and remaining commissioning holds are recorded.

C2. A durable implementation extending the existing Collective registry demonstrates serialized creation/activation, idempotency conflict rejection, distinct children, restart recovery and no positive authority from partial records or unavailable/corrupt evidence. Persistence technology/fault/rollback limits are stated; no claimed Byzantine or universal anti-copy guarantee.

C3. Lifecycle tests cover concurrent births/activation, migration crashes, stale issuer/registry snapshots, partition, parent revocation, copied credentials, forged duplicate reports, creation flooding and attempted validator multiplication. Managed conflict containment/sanction requests preserve victim attribution; simulated VM-state tests are labeled, not presented as hypervisor proof.

C4. Auth, actual Gateway contract and Runtime pre-dispatch adapters independently reject missing/unrecognized/stale/wrong-location bindings and propagate required scope/generation/epoch/budget to continuations. Missing independent gate denies. Tests use fake executors and cannot clear launch readiness or certify all real paths.

C5. PN-0 is a pinned target specification with every supported-target route's owner, caller/recipient/data scope, policy/fence/evidence/budget/failure contract, explicit numeric-parameter holds and unknown-route denial. It is labeled uncommissioned, not operational support. All E1–E12 groups plus new discoveries have owned integration/acceptance obligations; no silent component dismissal.

C6. Static routing tests produce/reject existing-contract route receipts as appropriate, preserve frontier and family independence on primary/fallback, bind actual attempts to identity, deny budget/data/capability mismatch and containment, and distinguish catalog/static from live/quality evidence. No live claim is needed or permitted to satisfy this goal.

C7. An independent verifier reconstructs offline scenario outcomes from retained canonical records under a pinned verification profile and commit/config set; disagreements remain disputed. All mandatory unit/integration/negative/crash scenarios and required security gates pass in the isolated test environment, with counts/commands/artifacts retained. No synthetic receipt is called real-operation proof.

C8. Every parcel has completed shaping, lint, Step 0, independent verification, required dual reviews, findings closure, human/delegated gates and Stage-F closure; goal evidence links criteria to actual artifacts, not only green CI. P9 includes remaining Runtime host blockers, active restrictions, operator actions and successor contract handoff. Neither production deployment nor live provider operation is an exit criterion.

## Non-goals and successor order

This goal does not implement/commission the Protocol 0 host controller, watchdog, protected recovery environment, production key custody, live genesis/provisioning, actual provider/Cortex/peer/tool effects, unrestricted self-improvement, federation or a distributed registry. Excluding these from this bounded goal is sequencing, not component dismissal.

Accepted sequence retained: **identity/contracts/profile → independent containment → one real durable operation plus complete local recovery → first collaborating team → second-device federation**. Before any effect-capable commissioning, close the selected Runtime host's actual launch blockers and prove each real adapter, independent freshness/fences, recovery custody and data/budget/retention limits. A single successful operation never qualifies every route.

## Proposed standing authorizations — request only

SA1 — Gate 2, recommended initial scope: "After Gate 1 ratification and mandatory plan-review closure, the coordinator may shape and dispatch PIN-P0–PIN-P2 only for approved local documentation, contracts and offline fixture work, within individually linted exact Allowed Files and answered trust choices. Each dispatch requires an eligible approved route receipt, independent role/session boundaries, Step 0 restate-and-stop, and the separately approved data/provider/spend envelope. Proposed aggregate inference ceiling for these parcels' shaping, building and reviews: USD 25, including retries and unknown charged attempts; reserve worst-case cost before each request and stop if it cannot fit. This does not authorize PIN-P3–PIN-P9 dispatch, credential access, host configuration, real incarnation creation or any live Pantheon effect."

SA2 — Gate 2, later option not recommended as an initial blanket grant: "After approval of the frozen contracts, T1/T2/T6 and PN-0 boundary, the coordinator may dispatch the named PIN-P3–PIN-P9 parcels for isolated implementation/test work under their linted specs, subject to the same route, data, budget, surface-ownership and Step 0 conditions. Unresolved decisions block their dependent parcels. No operational activation follows."

SA3 — Gate 3, recommended: **retain per-parcel human merge approval**. Optional later local-integration-only delegation must name exact non-trunk branches and is contingent on full green verification/review/security chain and no open contract decision; any red step voids it. Remote/trunk merge additionally requires proof of effective branch rules naming the agent's distinct bypass identity per SPEC-CONVENTION §8.4; absent/unavailable proof means stop for the human. No Git initialization, push, PR, release, installation or deployment grant is requested implicitly.

SA4 — Mandatory review envelope to approve separately: one fresh frontier plan reviewer from a different family than the coordinating session, charter + minimal relevant repo canon only, no coordinator narrative or other reviewer outputs, read-only/no tools or mutation. Proposed limits: USD 5 aggregate including an initial attempt and at most one retry, unknown charges held reserved, at most 20,000 input tokens and 4,000 output tokens per attempt, 10-minute timeout, no automatic third route. Use an admitted independently resolved route with a distinct approved receipt, exact approved provider/recipient and internal-data controls (or a human-approved public sanitized packet). Preflight must prove worst-case reservation fits the remaining ceiling; if not, stop rather than truncate the plan silently. If the launcher cannot enforce/attest this, stop and request a bounded owner exception or supported route; never call raw Pi a compliant Foreman review. These numeric ceilings are proposals, not approved spending. Approval of the charter alone must not be treated as unrestricted provider spend/disclosure.

SA5 — Tracking/persistence: approve local existing-schema coordinator-state initialization only after T8/T9 disposition; state restricts only. No Linear creation/update, remote synchronization, OAuth/token use or publication without explicit workspace/project/field scope, preview and separate approval. Proposed split: Foreman/versioned artifacts own execution gates/evidence, initiative persistence owns reconciled execution state, Linear presents human priorities/blockers/progress; coordinator alone consolidates agent publication.

No SA is currently granted. At ratification, quote the human's exact chosen prose and contingencies into the gate record and subsequent loop directive; do not infer grants from a document, historic grant or informal reaction.

## Plan-review gate and loop state

Gate 1 is pending. The founding council is supporting evidence, **not this plan's mandatory review**. After explicit ratification, dispatch a fresh frontier adversarial session against the ratified revision and canon; mandate decomposition coherence, real boundaries, missing parcel, unexamined load-bearing decisions, silent collisions, invariant weakening, authority leakage and routing fallback. Record raw review and fix / accept-as-documented / informational triage in `plan-review-findings.md`. Changes to locked decisions reopen only those decisions at Gate 1 and identify dependent holds. Do not shape the first parcel before this gate clears.

No loop directive or wakeup is started before ratification/review. On approval, generate the loop directive from the Foreman template with this session/worktree ownership, exact approved grants, ordered queue, restrictions, crash recovery and stop-report protocol. Reconcile actual supported launch tooling before dispatch; absence of tools is a blocker, not permission to improvise execution authority.

## Stop conditions

Stop affected work and report when: a settled decision or frozen contract needs amendment; unresolved T choice becomes load-bearing; another coordinator owns a surface; unapproved path/provider/disclosure/spend is required; copy/location/freshness cannot be established; independent reviewer/receipt/envelope unavailable; security finding cannot close in-parcel; a test-count/tripwire fails twice; launch guard or containment would need bypass; outward-facing/destructive/protected changes exceed explicit grants; developer says stop; exit criteria met or queue empty. Failed recovery prerequisites preserve containment. Irreversible merges/wiring remain held when a reopened decision affects them; provably orthogonal authorized local work may proceed.

Active restrictions:

No human-issued persistent quick flags in this session. General boundaries above remain; this is not a grant.

## Decision log

2026-10-18 — Draft created from accepted direction and read-only source inspection. No design proposal ratified; no quick-flag decision made; no builder dispatched; no independent plan review performed; no merge/deployment/provider call/Linear mutation. Session stopped awaiting Gate 1 and review envelope.
