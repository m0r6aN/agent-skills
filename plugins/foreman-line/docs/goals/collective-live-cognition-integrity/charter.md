# Goal Charter — Collective Live Cognition Integrity

## Authority and state

- **Goal slug:** `collective-live-cognition-integrity`
- **Created:** 2026-10-14 (UTC)
- **Stage:** Gate 1 ratified; independent plan-review report received and triaged; scoped D6 caller-receipt amendment ratified.
- **State:** **STOPPED — RESOLVE THE NON-GREEN/INCOMPLETE LINUX BASELINE BEFORE P0 CONTRACT FREEZE.**
- **Ratified decisions:** D1–D10 remain ratified, with the scoped D6 caller-supplied canonical-receipt amendment recorded below.
- **Coordination owner for this goal:** Pi session `01a137ef-cdf7-77a3-8193-dfcd6fab7ce3`, transferred by the developer on 2026-10-14 at the pre-parcel boundary. No other goal's ownership transfers.
- **Current authorization:** The developer's goal-scoped non-destructive grant is recorded below. Dispatch/PR/merge authority is limited to this goal and the recorded green-chain conditions. Gateway-main merges are excluded where the push workflow can deploy to production; production effects, paid product-provider calls, and unrelated work remain unauthorized.
- **Plan-level adversarial review:** The developer supplied an independent review report against charter SHA-256 `b5bf51376f9397c5bde24627cb5aad65c7c958c901b5fee2307f00e7b7db15aa`. Findings F1–F16 and coordinator dispositions are recorded in `plan-review-findings.md`. The report did not include reviewer session/model/usage metadata; its content is triaged, while execution-route metadata remains unverified. The developer has ratified scoped D6 amendment B (caller-supplied existing canonical receipt references); P0 remains stopped on the non-green/incomplete Linux baseline.

### Gate 1 ratification record

Recorded 2026-10-14 (UTC), from the developer's explicit instruction:

> Ratify D1–D10; retain Gate 2 per parcel and human Gate 3

D1–D10 are locked as written below. At ratification, no standing Gate 2 or Gate 3 grant had been given. Mandatory independent plan review precedes parcel shaping. The ratified scope is the broader repair: make live cognition both structurally trustworthy and reachable through the actual Collective host. The output-normalization-only alternative was not selected.

### Scoped Gate 1 amendment — D6 caller-supplied canonical receipt

Recorded 2026-10-14 (UTC), from the developer's scoped response:

> B

The developer ratified option B from the D6 question: the caller must supply references to **existing canonical receipts** in the versioned request contract. These references are untrusted input until the server resolves them in the approved proof substrate and validates receipt integrity and alignment with trusted tenant, actor, correlation, request, agent, and replay context. The Collective host must not mint an ingress receipt to satisfy this contract. Gateway request-shape changes must be explicitly versioned and tested; no copied, fabricated, demo, or model-authored receipt is admissible. This is a scoped D6 amendment only; D1–D5 and D7–D10 are unchanged. The ratification does not resolve the outstanding Linux baseline blocker or authorize paid inference, production effects, or deployment.

### Subsequent coordinator transfer and standing authorizations

Recorded 2026-10-14 (UTC), at the pre-parcel boundary, from the developer:

> Ownership of this goal is officially transfered to you. Proceed with blanket authority to make decisions on my behalf and execute any non-destructive actions needed to complete this goal.

The transfer is to the Pi session recorded in the authority block above. The grant is limited to the already named CLCI-P0 through CLCI-P8 parcels and their three ratified repositories. It delegates Gate 2 dispatch for those parcels after mandatory plan-review triage, exact spec/lint and source-commit checks, and the Step 0 restate-and-stop gate. It also delegates goal-scoped branch/PR publication and Gate 3 merges only after the complete required verification chain is green, required independent reviews/security dispositions are complete, and the target repository's effective rules permit the coordinator's distinct identity. No force push, destructive cleanup, new parcel, scope/contract change, deployment, production effect, or action in another goal/repository is authorized. The authorization does not waive any stop condition or allow a red, skipped, unknown, or unreproduced blocking result to be treated as green.

This general instruction does not establish the explicit provider/model, maximum paid-call count, monetary ceiling, and data boundary required for paid product validation under D7/E8. It does not authorize production deployment. The review report identified a possible change to D6; the developer ratified the scoped caller-supplied canonical-receipt amendment above. All other locked decisions and standing authorization boundaries remain unchanged.

## Objective and consumers

Make a bounded, explicitly selected live Collective deliberation produce complete, validated, provenance-bearing model contributions through the governed participation path, then expose truthful results through the existing host and MCP inspection interfaces. Incomplete or invalid model output must never become a successful cognition artifact, an admitted contribution, a selected branch, or an execution authorization.

Consumers are:

1. Collective's governed participation, Temporal Echo, review, and collapse machinery.
2. Gateway callers using existing goal-based Collective inspection tools.
3. Developers running a clearly labeled offline self-test or explicitly authorized live demonstration.
4. Independent verifiers assessing the exact implementation and evidence, not the persuasiveness of generated prose.

**Cognition is not authority.** Runtime remains the effects boundary. Model narratives, confidence values, proposed scores, demo anchors, and provider traces cannot manufacture canonical receipts or authorize effects.

## Scope and non-goals

### Ratified scope

- `D:/Repos/keon-omega/keon.collective`: cognition contracts, strict validation, provider completion semantics, routed-provider configuration and DI, governed provenance admission, bounded model-backed branch material, host integration, tests, and demonstration/reporting.
- `D:/Repos/keon-omega/keon-mcp-gateway`: focused auth/portable-test repairs and Collective boundary regression coverage. Any necessary transport-budget adjustment requires an explicit contract/configuration disposition, not a blanket timeout increase.
- `D:/Repos/agent-skills`: this goal's Foreman control-plane records, parcel specifications, review dispositions, and evidence index.

### Explicit non-goals

- Control UI, public website, new frontend workflows, or changes to the distinct Control `/api/collective` interface.
- Runtime or Cortex service implementation changes, production deployment, public release-readiness claims, or new execution capabilities.
- Autonomous actions, provider failover, model-fleet optimization, persistent conversational sessions, or cross-call deliberation reuse in currently stateless inspection tools.
- A new multi-model council: the initial live role sequence may use one model and must say so.
- Broad Temporal Echo/heat/doctrine redesign, unrelated dependency upgrades, benchmark programs, or calibrated model-confidence claims.
- Taking over, resuming, or granting authority from another goal, including the stopped `operation-receipt-remediation` goal or the unrelated operator/developer Cortex-memory initiative.

## Observed baseline — evidence, not closure

Baseline inspection is against Collective commit `461e2767a046418b098766090723e0cc34d9edc7`. Exploratory changes remain uncommitted in separate worktrees and have not passed a Foreman parcel chain.

| Observation | Grounding | Consequence |
|---|---|---|
| Live HTTP calls returned reasoning, but all three role outputs were wrapped as prose with zero structured findings. The enclosed JSON remained invalid even after removing fences and ended mid-field/string. | User-supplied run: `C:/Users/clint/AppData/Local/Temp/keon-collective-demos/20261013-223052-208eb23ffa2c489da9cadc0efc4caf0b/transcript.md`, plus `1-demo-planner.json`, `2-demo-critic.json`, `3-demo-synthesizer.json`. | Successful transport is not successful structured cognition. Observed truncation is consistent with an output cap, but its cause is **not proven**: provider stop metadata was not retained. |
| Anthropic and OpenAI-compatible normalization can replace invalid/prose responses with empty findings, synthetic confidence `0.5`, and `requiresEscalation=false`. | `src/Keon.Collective.Infrastructure.Cognition/Adapters/AnthropicCognitionAdapter.cs`; `OpenAICompatibleCognitionAdapter.cs`. | A malformed answer can masquerade as a non-escalating success. Fix both shipped adapter paths and their common contract. |
| The ordinary host registers Core, whose default adapter is deterministic; its intent call graph does not invoke the governed model participation path. Temporal Echo initially creates template branches with fixed scores. | `src/Keon.Collective.Host/Program.cs`; Core `DependencyInjection/ServiceCollectionExtensions.cs`, `Host/CollectiveHost.cs`, `Cognition/TemporalEchoPlanner.cs`. | Adding provider configuration or replacing an adapter registration alone does not make `/v1/intents` model-backed. |
| CivicImmune post-scan accepts only the neutral runtime model descriptor; routed traces contain the actual provider/model. | `src/Keon.Collective.Core/Society/CivicImmuneSystem.cs`; `Infrastructure.Cognition/Routing/RoutedModelCognitionAdapter.cs`. | Real routed contributions cannot simply be plugged into governed participation. Admission needs policy-backed provenance, not a disabled check or a forged neutral descriptor. |
| Routed-adapter construction failed through the existing DI registration because its constructor is internal. The exploratory demo also supplies named-client configuration outside the ordinary host path. | Infrastructure Cognition DI and exploratory demo. | Production composition needs its own resolution/configuration tests; demo-only workarounds do not close the defect. |
| Gateway tests had portable SQLite-path, bound-token, and stale request-shape/fresh-ID issues. | Exploratory gateway worktree below. | Preserve contract-correct, independent goal-based calls and test the fresh prepare result rather than borrowing an earlier deliberation ID. |

### Existing exploratory work — preserve, do not silently promote

- Collective reference worktree: `D:/Repos/opmem-worktrees/collective-live-demo`, branch `demo/live-collective-cognition`; uncommitted DI factory repair, registration test, and `examples/Collective.LiveDemo/`.
- Gateway reference worktree: `D:/Repos/opmem-worktrees/gateway-ci-test-fixes`, branch `fix/portable-role-binding-tests`, baseline `0e0878a5938ada21409e6e95ab8d2ea260c2f6b5`; uncommitted portable role-binding tests, token issuer/binding tests, and Collective flow contract repairs.
- Exploratory reports: gateway full rerun **433 passed / 2 skipped**; user-reported real-Collective lane **4 passed / 0 skipped**; cognition suite **276 passed / 1 skipped**. These are historical observations, not independent acceptance evidence for this goal.
- The earlier real-Collective lane exercised a real service, **not proven live model participation**. The paid demo exercised the real routed adapter, **not the governed host or a production effects chain**.
- Preserve the original failed transcript. Later repairs must create new evidence, never relabel or rewrite that run as successful structured cognition.

## Applicable canon and precedence

Before shaping or dispatch, reread the applicable repository instructions and relevant current contracts at the chosen source commits:

- Foreman: `skills/goal/SKILL.md`, `docs/COORDINATOR-PATTERN.md`, `skills/parcel-driven-development/SKILL.md`, `docs/SPEC-CONVENTION.md`, and `docs/kickstarters/STANDING-CONSTRAINTS.md` under `plugins/foreman-line/`.
- Initiative Coordination for persisted cross-repository state, integration scenarios, and evidence gates.
- Collective: `docs/contracts/KEON COLLECTIVE CANONICAL CONTRACT.md`, `docs/collective-api-integration.md`, and the cognition, participation, identity, routing, and state-machine contracts in source.
- Gateway: current Collective tool input/output contracts, trusted identity/auth contracts, and integration-test infrastructure at its selected source commit.

The Collective canonical contract is labeled **Draft for Pantheon Review**. Its status must not be misrepresented as universal ratification. A load-bearing ambiguity or conflict requires explicit disposition before dependent implementation; this goal cannot silently ratify wider doctrine.

Ratified amendments to frozen contracts must be recorded and committed alone before dependent code. Proposed implementation details here are not substitutes for those amendments.

## Locked decisions — D1–D10 ratified

The decision text and reasoning below are preserved from the ratified draft. References to proposed settings or later dispositions identify P0 work still required; they are not implementation defaults or additional authority.

| ID | Ratified decision | Reasoning and disposition needed |
|---|---|---|
| **D1 — Scope** | Include strict structured-output repair **and** actual governed, model-backed host integration, with focused Gateway coverage. Keep other products/services out of scope. | Output-only fixes would leave the ordinary host deterministic. Developer may instead choose a narrower charter, requiring a revised objective, parcel queue, and exit criterion. |
| **D2 — Result semantics** | A cognition success requires a complete provider response and a fully validated, versioned typed payload. Distinguish success, invalid/incomplete, refused, failed, cancelled, and valid-but-escalating outcomes. Never synthesize reassuring findings, confidence, or `RequiresEscalation=false` on parser failure. | The current prose wrapper loses the distinction between usable findings and diagnostics. P0 must specify how every consumer handles each outcome without ambiguous defaults. Model-reported confidence remains an uncalibrated claim. |
| **D3 — Parsing policy** | Permit plain JSON or exactly one complete outer Markdown JSON fence, using bounded deterministic de-fencing. Reject prose, truncated content, multiple documents, trailing content, ambiguous duplicate keys, missing required fields, wrong types, invalid enum/range values, and excessive depth/size. No best-effort JSON repair. | Fences alone are fixable; incomplete JSON is not. Even syntactically valid JSON is unusable if the provider reports length termination or other non-completion. Exact whitespace/fence/schema rules are frozen in P0. |
| **D4 — Modes and plumbing** | Make live versus deterministic/mock operation explicit and observable. Selecting live requires valid provider configuration and fails closed when unavailable; no implicit stub substitution. Preserve explicitly selected offline smoke/test mode. Use ordinary DI/configuration rather than demo-only HTTP-client setup. | Tests and operators must know whether a model was called. P0 must resolve configuration defaults and backward compatibility for existing callers before changing the host's composition. |
| **D5 — Bounded deliberation** | For the initial live lane, use planner, critic, and synthesizer stages, at most three primary provider calls per deliberation. Produce at least two distinct structured alternatives, grounded critiques, and synthesis through governed participation. Deterministic code enforces feasibility, lawful transitions, and collapse rules; model scores never confer authority. | This supplies actual candidate content without replacing the existing governance/state machine. Preserve losing branches, provenance, challenge/heat metadata, and archival. Do not silently recreate a missing stage or candidate with templates after failure. |
| **D6 — Admission and identity** | Admit genuine routed traces only through configured provider/model policy and trusted correlation, tenant, actor, agent, replay, and receipt alignment. The caller supplies references to existing canonical receipts through the versioned request contract; the server resolves and validates them against trusted context. The host does not mint ingress receipts, and model-visible content cannot establish or alter anchors. Preserve CivicImmune pre/post scanning and hostile-input rejection. | An arbitrary descriptor allowlist, copied/unresolved receipts, or a self-asserted provider label is insufficient provenance. Never forge the neutral descriptor, disable scanning, or promote `demo://fixture/...` references into trusted governance context. Scoped amendment B was ratified at Gate 1 on 2026-10-14. |
| **D7 — Budgets and failure handling** | No automatic paid repair/retry or provider fallback in the initial lane. Propose configurable ceilings of 120 seconds per call and 6 minutes per deliberation, subject to host/Gateway transport compatibility. Bound output at the source with a compact schema, not only a larger token cap. Cancellation propagates end to end. | Demo timings expose a transport-budget risk. Exact token/byte ceilings and transport limits require P0 disposition. Paid validation additionally requires a human-approved provider/model, maximum total calls, monetary ceiling, and test-data boundary; none are granted by this draft. |
| **D8 — Boundary compatibility** | Preserve existing goal-based independent Gateway inspection calls, trusted header identity, and prepare/dispatch binding to the freshly returned prepare result. Inspection remains non-effecting. Maintain Runtime authority for execution. | No reuse of an earlier deliberation ID as an undocumented session contract. Any necessary public schema or timeout change must be explicitly versioned/disposed before implementation. Mock Runtime/Cortex coverage is labeled as such, not production end-to-end evidence. |
| **D9 — Evidence and demo truthfulness** | Distinguish fixture self-tests, direct adapter live tests, governed host tests, and Gateway-to-host live tests. Report completion only for valid admitted artifacts; preserve provider completion metadata, structured warnings/escalation, and sanitized diagnostic reasons. Require fresh paid host/Gateway evidence plus independent verification for goal closure. | The existing demo's successful transport and role prose did not prove governed structured cognition. Do not persist keys or unredacted sensitive prompts/responses. This goal uses synthetic test data, makes no calibration claim, and does not establish production release readiness. |
| **D10 — Execution discipline** | Use new authorized parcel worktrees from pinned clean source commits. Treat exploratory changes as reference candidates for separately reviewed promotion, not already accepted fixes. Gate 2 grants must name this goal's parcels; retain human Gate 3 by default. | Preserve dirty ambient worktrees and other coordinators' state. Historical grants do not transfer. Security-sensitive parcels require independent security review, and architecture/risk parcels require two independent frontier adversarial reviews. |

**Locked decisions:** D1–D10, ratified by the instruction recorded above. Any substantive change requires scoped Gate 1 re-ratification before affected work proceeds.

## Proposed wave and parcel decomposition

These are planning candidates, not active specs or dispatch authority. Each shaped parcel must define exact Allowed Files, contract references, tests, verification environments, and source commit. One implementation parcel has one owning repository/worktree. Foreman records accompanying it do not grant mutation authority over another implementation repository.

| Wave / parcel | Owning implementation repo | Dependency | Deliverable one-liner | Risk | Routing class |
|---|---|---|---|---|---|
| **W0 / CLCI-P0** | Collective | Gate 1, plan-review triage, D6 amendment B ratified, resolved cross-platform baseline | Phase-1 contracts PR: freeze typed outcomes/completion, validation/schema and host/Gateway projections, live/offline defaults, empty live fallback chain, caller-supplied canonical receipt references and validation, call/transport budgets, and synthetic regression corpus. P0 remains blocked until the Linux baseline blocker is resolved and the clean-source baseline is recorded. | elevated | architecture/risk |
| **W1 / CLCI-P1** | Collective | P0 | Implement the single canonical bounded structured-output validator and outcome mapping, including full-fence support and refusal of incomplete/ambiguous data. | elevated | architecture/risk |
| **W1 / CLCI-P2** | Collective | P1 | Map Anthropic and OpenAI-compatible completion/refusal semantics into canonical outcomes; retain sanitized diagnostics and usage/completion metadata, prohibit exception-triggered provider fallback in the live lane, and enforce adapter parity. | elevated | architecture/risk |
| **W1 / CLCI-P3** | Collective | P0 | Repair routed-adapter DI construction and named-client/provider configuration; resolve only the explicitly selected provider/key in live mode, keep offline mode keyless, and validate an empty live fallback chain. | elevated | architecture/risk |
| **W1 / CLCI-P4** | Collective | P0, P1, P2 | Implement policy-backed routed-trace admission with identity/replay/receipt alignment and negative tests, retaining CivicImmune guards. | critical | architecture/risk |
| **W2 / CLCI-P5A** | Collective | P2, P3, P4, ratified D6 amendment B | Establish trusted server-side role identity resolution and the governed participation/session orchestration seam; caller-supplied receipt references are resolved and validated server-side, and model-supplied provenance is never trusted. | critical | architecture/risk |
| **W2 / CLCI-P5B** | Collective | P5A | Produce bounded model-backed alternatives and grounded critique contributions through governed participation, with explicit per-deliberation call limits. | critical | architecture/risk |
| **W2 / CLCI-P5C** | Collective | P5B | Produce synthesis and integrate lawful branch transitions, feasibility checks, lineage, review/heat handling, collapse, and loser archival. | critical | architecture/risk |
| **W3 / CLCI-P6** | Collective | P5C | Compose ordinary host's explicitly selected live intent path; propagate cancellation/deadlines and project truthful versioned outcome, escalation, and sanitized completion metadata. | elevated | architecture/risk |
| **W4 / CLCI-P7** | Gateway | P6; P0 compatibility disposition; source `origin/main` `0e0878a5938ada21409e6e95ab8d2ea260c2f6b5` | Promote portable-path/bound-token/fresh-prepare fixes, prove host inspection, and implement approved per-call budgets. Do not merge to Gateway `main` while that path can deploy production. | elevated | architecture/risk |
| **W5 / CLCI-P8** | Collective | P6, P7 | Deliver explicit offline-by-default self-test/live demonstrator and sanitized, call-counted evidence reporting; live host/Gateway validation remains separately approved. | elevated | architecture/risk |

### Ownership and sequencing constraints

- P0 freezes contracts; P1 owns common validation. P2 consumes it rather than creating divergent per-provider schema validators.
- P3 owns Infrastructure DI/provider client setup; P6 owns ordinary host composition. Shape exact boundaries before dispatch if a shared registration file is needed by both.
- P4 owns admission policy/guards; P5 consumes those guards and must not weaken them to obtain a passing run.
- P5A, P5B, and P5C are serialized child parcels of the original P5 objective; P5 is not a separate dispatch. P5A owns identity/participation entry, P5B model-backed alternatives/critique, and P5C synthesis/branch integration. P6 owns ASP.NET host composition and the external projection. `CollectiveHost.cs`, Core DI, and `TemporalEchoPlanner.cs` have one owner per child parcel and are serialized before P6.
- P7 is Gateway-owned and starts from the pinned `origin/main` commit above, never the divergent local `main`. Any Collective changes it discovers return to the owning parcel through rework/amendment, not a cross-repo patch. Its PR may be prepared, but merging into Gateway `main` is outside the standing Gate 3 delegation while the production-deploy workflow matches P7 paths.
- Default is dependency-ordered execution. Parallelism requires proven disjoint mutation surfaces, frozen shared contracts, and explicitly authorized independent worktrees.
- Split an oversized parcel only after explicit charter/spec amendment. Do not invent extra top-level parcels under an existing grant.
- Do not recover, reuse, or modify the stopped `operation-receipt-remediation` OR-P02 patch. CLCI uses fresh isolated worktrees from its pinned clean source commits; no CLCI changes are applied to the OR queue. Record an independent full-solution baseline for Collective `461e2767a046418b098766090723e0cc34d9edc7` on Windows and Linux before P0 dispatch. If OR resumes or a worktree/file collision appears, stop and reconcile with its owner.
- The operator/developer Cortex-memory goal and all unrelated uncommitted files remain untouched.

## Evidence plan and exit criterion

The goal is complete only when **all** of E1–E9 are satisfied against the exact integrated commits, with independent verification and required reviews. Parcel completion alone is insufficient.

### E1 — No false structured success

- Replay the observed fenced, mid-field/mid-string truncation failures as sanitized deterministic fixtures: none yields an admitted success or synthesized non-escalating findings.
- Valid complete plain JSON and the explicitly supported complete fenced form pass.
- Reject duplicate/ambiguous keys, multiple objects, trailing prose, wrong shapes/types, missing safety fields, non-finite/out-of-range numbers, excessive nesting/size, and partial text.
- Provider length termination is unusable even when its text happens to parse. Refusal, unsupported completion states, missing required completion metadata, cancellation, HTTP failures, and timeouts have explicit typed outcomes.
- A valid model `requiresEscalation=true` survives adapter, participation, host, and Gateway projection. Diagnostic prose remains diagnostic and cannot replace a usable artifact.
- Invalid/incomplete contributions cannot drive collapse, prepare success, or dispatch authorization. Failure-path tests assert no unexpected downstream effects.

### E2 — Both shipped adapter families conform

Anthropic and OpenAI-compatible fixtures establish the same canonical contract, including provider-specific stop/refusal cases and usage metadata. Offline fixtures are sufficient for adapter parity; this goal does not require paid calls to every supported vendor. The live lane's configured fallback chain must be empty, and no provider fallback occurs for invocation, invalid-output, refusal, timeout, or cancellation outcomes; tests assert exactly one provider invocation.

### E3 — Ordinary configuration works

The configured routed adapter resolves through ordinary DI, including its internal-constructor boundary, and uses properly configured named HTTP clients. The live host path does not depend on demo-only registration. Explicit offline mode remains labeled; live configuration/key absence causes an actionable failure, not a silent deterministic success.

### E4 — Governed admission remains protective

Trusted routed contributions pass under configured policy, while forged descriptors, unsupported providers/models, identity/tenant/actor mismatches, replay/receipt mismatches, and hostile contributions fail the appropriate guards. The caller supplies references to existing canonical receipts in the versioned contract; the host resolves and validates them and never mints ingress receipts. Model output cannot set trusted provenance or canonical receipt authority. Independent security review verifies these invariants and fail-closed paths; unresolved blocking findings prevent closure.

### E5 — The host actually deliberates with models

The live `/v1/intents` call graph invokes the bounded planner/critic/synthesizer path, produces distinct structured alternatives and actual critique/synthesis contributions, and preserves traceability to their provider outputs. Deterministic state transitions, feasibility checks, review/heat handling, collapse, loser archival, and selected lineage remain lawful. No fixed-score template is mislabeled as model reasoning, and no failed stage is silently replaced.

### E6 — Gateway behavior and budgets are real

- Gateway invocation reaches the repaired real Collective host with trusted identity and a versioned truthful structured projection, including outcome kind, escalation, and sanitized completion/diagnostic metadata; independent inspection calls remain fresh goal-based deliberations.
- Separate offline Runtime/Cortex fixtures prove prepare/dispatch binding to the current prepared envelope and denial of malformed/unauthorized contexts. They are not claimed as live Runtime/Cortex evidence.
- Inspection-only scenarios assert zero execution/effects calls. The model-backed path does not itself dispatch actions.
- Cancellation and caller/host/provider deadlines align under the approved per-call/per-deliberation budget; caller cancellation is distinguishable from deadline timeout at Gateway. No late background inference, implicit retry/fallback, or global timeout weakening is concealed. E8 records provider-invocation count per tool call and refuses any call outside an approved live window or above its ceiling.
- Portable SQLite failure tests and signed bound-token regressions pass in the required Windows and Linux environments. Skips, environment limitations, and failures remain visible in the evidence matrix.

### E7 — A reproducible reasoning oracle is separate from prose quality

Use the demonstrated synthetic workshop scenario: ticket price 40, capacity 24, cash budget 500, volunteer budget 12 hours, mandatory cost 120 and 4 hours; ads cost 300 / 2 hours / 6 guests, outreach 0 / 5 hours / 10 guests, partner 100 / 3 hours / 8 guests. Baseline assumes all-or-nothing actions, no overlap, zero guests before selected actions, and continuous expected attendance with no rounding in the 25% stress cases.

Independently enumerate all eight action subsets and stress cases. Expected optima are:

| Case | Feasible optimum | Profit |
|---|---|---:|
| Baseline | Outreach + partner | 500 |
| Attendance reduced 25% only | Outreach + partner | 320 |
| Volunteer budget reduced to 9 hours only | Outreach | 280 |
| Both stressors | Outreach | 180 |

Store assumptions and oracle output with the test. Validate structured feasibility and material numerical claims; do not require exact generated wording. Distinguish newly introduced assumptions from the baseline. Unsupported model critiques are claims to verify, not automatically canonical findings. A numerically wrong live result fails this scenario rather than being excused by fluent prose.

### E8 — Fresh live evidence, independently checked

After implementation, obtain human approval for synthetic-data live runs with an explicit provider/model, maximum calls, and monetary ceiling. Capture governed host and Gateway-to-real-host success and failure dispositions at pinned commits/configuration, with sanitized completion metadata, bounded usage, correlation, structured findings, escalation, and lineage evidence.

A fresh verifier must inspect the artifacts and oracle results independently. Direct adapter transcripts alone cannot satisfy E5/E6/E8. Fixtures cannot satisfy the real-provider criterion. Each live run has an explicitly approved provider/model, maximum provider invocations (including fresh deliberations per Gateway tool call), monetary ceiling, and synthetic-data boundary. Missing key, budget, approval, or environment means **BLOCKED**, not a passing skip; invocation outside the window or above the ceiling is a stop condition. A missing prerequisite produces a stop report rather than an indefinite coordinator loop.

### E9 — Integrated green chain and honest closeout

- Required deterministic test/build commands, environment/toolchain, pass/fail/skip counts, exact commits, reviewed diffs, scenario results, and independent review dispositions are indexed in goal-local records.
- Architecture/risk parcels receive two independent frontier adversarial reviews; reviewers do not implement or commit fixes. Rework has a fresh restate-and-stop gate and recorded tripwires.
- Cross-repo scenario readiness is persisted through Initiative Coordination before dispatch; configurations and dependencies are versioned. No unverified ambient service is accepted as the tested build.
- Gate 3 authorization is recorded per the effective rules. Merge completion and evidence apply to the same integrated commits.
- Original failed evidence remains identifiable, exploratory fixes are individually accounted for, unrelated failures/risks are reported rather than silently waived, and production readiness is explicitly **not established** by this goal.

## Gate dispositions and standing authorizations

### Gate 2: delegated for named parcels

The developer's standing Gate 2 delegation covers CLCI-P0 through CLCI-P8 and the explicitly chartered child parcels P5A–P5C, within the same repositories, objective, and non-destructive scope. Each still requires a linted exact spec, Allowed Files, pinned source commit, named isolated branch/worktree, verification/review plan, and passing Step 0 gate. No new top-level objective, repository, production effect, or contract change beyond this charter amendment is included. D6 amendment B is ratified; no builder starts until the non-green/incomplete Linux baseline is resolved and the clean-source baseline evidence is complete.

### Gate 3: delegated, green-chain contingent, with Gateway-main carveout

The developer's subsequent authorization delegates merges for goal parcels only after the complete verification chain is green: coordinator closure check against disk, mandated deterministic pass, required adversarial/security reviews and triage, and accepted rework with tripwires silent. Any red, skipped, unknown, or blocking disputed step voids the delegation. The coordinator may not impersonate the developer; merge must be performed under the coordinator's distinct identity and only if effective repository/branch rules authorize it. Goal-scoped branch/PR publication is authorized; force pushes, deployment, production configuration changes, destructive cleanup, and unrelated branch operations are not. **CLCI-P7 is excluded from merge-to-`main` delegation** while Gateway's protected-main push workflow can build, push, and deploy production. P7 may be built, verified, and proposed in a PR; a Gateway-main merge requires an explicit production/deployment disposition or an independently verified workflow/environment change that prevents an unauthorized deployment.

### Paid validation and other outward actions

No paid product-provider validation is granted by the recorded authorization. Before those calls, obtain the explicit provider/model, maximum call count, monetary ceiling, and data-boundary approval required by D7/E8. Credentials stay in approved local secret/environment mechanisms and out of prompts, logs, transcripts, or Git. Production effects and deployment remain unauthorized.

## Stop conditions

Stop, persist the state, and report the exact decision/prerequisite needed when:

1. Gate 1 has not been explicitly ratified, or a locked decision needs amendment.
2. Another coordinator owns an overlapping live surface, stopped historical work is proposed for recovery, or source/worktree ownership is ambiguous.
3. Implementation would touch dirty ambient work, another goal's records, an unlisted file, a new service/repository, or an unapproved parcel.
4. Live provider/key, trusted governance context, transport budget, paid-call approval, or required completion metadata is unavailable. Do not invent receipts or silently choose mocks.
5. A frozen contract needs change, doctrine status becomes load-bearing, or public compatibility cannot be preserved under the approved disposition.
6. A proposed fix disables CivicImmune, accepts self-asserted provenance, substitutes synthetic confidence/safety fields, drops losing branch history, or treats cognition as execution authority.
7. A required test/review is skipped, unknown, irreproducible, or blocking; a security finding cannot close within the authorized parcel; or a repeated tripwire requires escalation.
8. A provider response is incomplete/refused/invalid, a budget/deadline is exceeded, or continued inference would require an unapproved retry. Terminate that run truthfully; suspend the goal only when remediation exceeds the parcel's authority or a stop prerequisite remains unresolved.
9. Merge, push, deployment, production data, or external effects are proposed without the required separate authorization.
10. The queue empties: perform the full exit audit, then report completion or the remaining blockers rather than assuming success.

Human gates are stop conditions, not agent-completable success conditions. Gate 1 is recorded for D1–D10, including scoped D6 amendment B. The later Gate 2 and Gate 3 delegations do not waive their recorded contingencies or the Linux baseline blocker.

## Next safe action

1. Resolve and rerun the Linux full-solution baseline: `baseline-2026-10-14.md` records 783 non-Core passes and one skip, then three Core failures and a timeout without a final summary. Treat this as an unresolved blocker; do not waive or regenerate fixtures.
2. Once the Linux baseline is complete and its failures are resolved within authorized scope, establish the goal-local loop directive and persisted Initiative Coordination state, pin all repo source commits, then shape/lint P0. D6 amendment B is already ratified; P0 dispatch remains covered by the standing Gate 2 delegation only after the baseline prerequisite is satisfied.
3. Preserve Gateway local-main divergence and dirty monetizable-GA work; create any P7 worktree from pinned `origin/main` only. Hold P7 merge to Gateway `main` for the deployment disposition above.

**Current disposition:** Independent plan-review report received; F1–F16 triaged. D1–D5 and D7–D10 remain locked; scoped D6 amendment B is ratified. Windows baseline is green; Linux baseline is non-green/incomplete (details in `baseline-2026-10-14.md`). P0 is not dispatchable until the Linux baseline blocker is resolved and the cross-platform baseline is complete. No implementation, paid inference, or merge occurred in this update.
