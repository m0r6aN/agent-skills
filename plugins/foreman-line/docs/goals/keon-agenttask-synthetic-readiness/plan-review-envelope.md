# Plan-Level Review Envelope — Proposed, Not Approved

**Goal:** `keon-agenttask-synthetic-readiness`  
**Charter:** revision 0.1, ratified as written 2026-10-15  
**Coordinator:** Pi session `01a14120-11a3-70eb-8964-f28061d364bd`  
**State:** **HOLD — no eligible reviewer route is established; no review has been dispatched.**  
**Purpose:** Present the bounded review scope and constraints required by Gate 1/D12. This document is not a route receipt, owner approval, Gate 2 grant, review result, or authority to make a provider call.  
**Owner route direction:** On 2026-10-15 the owner directed: “opencode-zen should be a fallback for opencode-go. Both can and should be called via the Pi harness. Use openai/gpt-6-1-sol for the review.” Recorded as the requested route design, not as proof of eligibility or approval of this envelope. The exact model/provider identity and cross-provider fallback semantics remain unresolved against the current ratified routing policy.

## 1. Review mandate

A fresh, independent frontier review must challenge the ratified plan for:

1. decomposition coherence and dependency order;
2. whether the seven parcel boundaries are real and independently reviewable;
3. missing work or an unexamined load-bearing decision;
4. silent ownership, file, interface, or sequencing collisions;
5. unsupported synthetic-to-real proof claims or exit criteria that can pass on stand-ins;
6. whether the stated stop conditions prevent unsafe escalation into source acquisition, canonical publication, or effects.

Reviewers return findings only. For each finding, include ID, severity, exact source locator, failure mode/consequence, proposed disposition, and whether a locked decision or dependent parcel is affected. The coordinator verifies findings against the bound source snapshots and triages them as **fix / accept-as-documented / informational**. A finding that changes a locked decision reopens Gate 1 for that decision only. Reviewers do not edit, fix, commit, publish, dispatch parcels, or approve the plan.

## 2. Proposed reviewer configuration

Recommendation, subject to owner approval:

- **Three independent seats**, each a new, separate frontier/L2 adversarial-review session; use at least two model families.
- Distinct lenses: (1) decomposition and missing parcel; (2) ownership, interfaces, and collision risk; (3) safety boundaries, synthetic-proof claims, and exit-criterion integrity.
- All seats receive the same immutable, minimum-context review brief. No seat sees another seat's findings before submitting its own.
- The coordinator prepares an independent assessment before reading seat outputs. Quorum is two completed independent seats plus the coordinator's recorded analysis; otherwise the review stops incomplete.
- Each seat may make at most two attempts on its **same approved route**. No provider/model failover or fallback is allowed by this proposal. A failed or over-budget attempt counts against the cap. If fewer than two seats complete, stop and report; do not add a fourth seat or widen the envelope.

The three-seat configuration follows the reviewed multi-model critique workflow; it is a proposed count, not a change to the charter or permission to launch.

## 3. Context boundary

The review brief will contain only the ratified charter, relevant Foreman canon, the shaping record, the seven draft parcel specs, and narrowly quoted ownership/scope facts from the two explicitly linked sibling goal charters. Sibling-goal text is read-only context; no grant, implementation route, coordinator ownership, approval, or source access transfers to this goal. The full sibling charters, service repositories, credentials, account/profile state, real source locators, and any conversation contents are not provided.

Bound source set and SHA-256 at envelope preparation:

| Context source | SHA-256 |
|---|---|
| `plugins/foreman-line/docs/goals/keon-agenttask-synthetic-readiness/charter.md` | `c977f4e89a1c561789e995a6f5e2149865d2904f734d16f68c1b8055631cd006` |
| `plugins/foreman-line/docs/COORDINATOR-PATTERN.md` | `46e5438615e1a05bfb5b07abd177b26244548a7415e02ad7f1bb927ec95bf326` |
| `plugins/foreman-line/skills/parcel-driven-development/SKILL.md` | `f673472c804a659f9f01515b878f02c653d4ed97c2c4c97f7340139325c6df05` |
| `plugins/foreman-line/docs/SPEC-CONVENTION.md` | `70508684d2c929d1331ed0cd9a147fcc2206593a04fbf210314e22fb80cba0a8` |
| `plugins/foreman-line/docs/shaping/keon-agenttask-synthetic-readiness-2026-10-15.md` | `7fb5758a6e87ca9b94709646f7cbbe60d29590f881c8f8ce5e16404693dfd2fb` |
| `plugins/foreman-line/docs/specs/active/HKR-P0-authority-and-contract-baseline.md` | `c98d3a53c5215bd5f842df9315cef90afe30350743c3e12fc31aca387727e4c6` |
| `plugins/foreman-line/docs/specs/active/HKR-P1-synthetic-reconstruction-and-evidence.md` | `583d91cc956a9ea4faa6e433fbcd95d2b51fbfa04973d45872e9a178a0385dbe` |
| `plugins/foreman-line/docs/specs/active/HKR-P2-custody-classification-and-isolation.md` | `7d36f0d1dd7da9b49df23007cbbf24140903aa2e9cf952c3af97eb57062ae8b2` |
| `plugins/foreman-line/docs/specs/active/HKR-P3-candidate-ledger-and-race-safety.md` | `9de7ab4b32b195c97834a1f32c918413e172b9b7ee3e5b370efec1509e4676ce` |
| `plugins/foreman-line/docs/specs/active/HKR-P4-bounded-local-extraction-route.md` | `af4c65e44fd0459c927b15a5fa40a6b78f4e562eef4e2891216d5c8f39c1df17` |
| `plugins/foreman-line/docs/specs/active/HKR-P5-reference-review-and-metrics.md` | `0c908f335a2b7e6ead86b882994afc88e967ece2310232e9531af4af400cee0f` |
| `plugins/foreman-line/docs/specs/active/HKR-P6-independent-synthetic-readiness.md` | `be902e27708124102c98fdb4c5b0b220749a1b1d10d78b5548bd11bae1e96eb4` |
| `plugins/foreman-line/docs/goals/operator-developer-cortex-memory/charter.md` (ownership/scope excerpts only) | `f720c845792210a0844e0387dd3f09191f3e557331d462a27d4d34a74713da10` |
| `plugins/foreman-line/docs/goals/collective-live-cognition-integrity/charter.md` (ownership/scope excerpts only) | `6203c205987ce181ec7dbb9750968f9a6727ac9826c8cc528dc2b64a882014f8` |

The charter, shaping record, seven draft specs, and two linked sibling-goal charters are locally untracked or modified in this checkout; the Foreman canon files are tracked local files. Before any review, recompute every digest and bind the brief to the exact same bytes. Any changed input requires a refreshed envelope and renewed owner approval. Do not resolve missing historical source baselines by searching other workspaces or retrieving source data.

Route-policy evidence used only to assess eligibility (not included in the reviewer packet):

| Route-policy source | SHA-256 |
|---|---|
| `plugins/foreman-line/docs/goals/pi-model-configuration/charter.md` | `b0f78b8565a98396599154c5b9af01184b19ea68b2d77b2953441da355876a07` |
| `plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-role-lane-map.md` | `9545043658708d7017ed59a3c51133da869111aa186c7aff8709e0c14281aaaa` |
| `plugins/foreman-line/routing-policy/routing-policy.yaml` | `868fead84eec550bffec3248d3f31f289213f656e213d0a6967cdebc5c395700` |

## 4. Permission, data, and output controls

- Data class requested for the review packet: **internal**. No real-history, account, customer, credential, personal, or fixture-execution data is in scope.
- A reviewer may read only the immutable brief/snapshot and write its own result into the isolated review-output directory. No repository or sibling-worktree access, shell, tools, network, source acquisition, fixture/model execution, or other file writes. If the dispatch mechanism cannot enforce this boundary, do not launch.
- Each seat requires its own resolver-approved route receipt explicitly covering the internal data class, frontier/L2 role, exact model/provider, and budget. No direct/default CLI invocation, inherited receipt, credential inspection, route repair, or cross-goal approval is permitted.
- Preserve raw review outputs locally in the goal folder; do not publish or commit them under this envelope. Coordinator triage is a separate artifact.

## 5. Proposed hard ceilings

These are maximums requested for approval, not current spend authorization:

- At most **3 seats × 2 attempts = 6 model invocations total**; no fourth seat and no second adversarial round.
- Per attempt: at most **48,000 input tokens and 4,000 output/reasoning tokens**; enforce cumulatively, including retries/cache/tool overhead. Unknown usage or unaccounted cancellation is a stop.
- **USD 5.00 maximum incremental aggregate charge** across all seats and attempts; all fees and retries count. A route with unknown pricing, unreliable hard budget enforcement, unbounded subscription/extra-use exposure, or a projected amount above the cap is ineligible. No extra-usage/API/upgrade transition.
- **45 minutes maximum wall-clock** for the complete review round. At the limit, stop and report incomplete evidence; no background heartbeat or polling loop.
- No automatic fallback or route switching. A retry, if any, is only on the same owner-approved route and only inside both token and monetary caps.

## 6. Route eligibility — blocking

No route is approved or demonstrated for this packet. Static policy inspection found blockers that must not be bypassed:

- The L2 provider pin/eligibility is unresolved in the on-disk routing policy. In the PMC role-map, §2's L2 provider field remains unavailable while §4's ratification record says L2 pins OpenCode; the policy YAML also records the L2 pin as unavailable. This needs reconciliation, not coordinator inference.
- The user-requested literal `openai/gpt-6-1-sol` is not a binding in the reviewed Foreman routing policy. The closest recorded identities are `opencode/gpt-6.1-sol` (OpenCode Zen, public-only; aligned and availability-declared, but not an L2 route) and `openrouter/openai/gpt-6.1-sol` (internal declared, but context and availability are unknown). Do not silently normalize the spelling or provider.
- The current L2 route list has `opencode` and `openrouter` entries, not `opencode-go`. `opencode` and `opencode-go` are distinct providers; the policy says `opencode-go` has no L1/L2 route, and fallback is provider-local. Making `opencode-zen` a fallback for `opencode-go` would require a separately ratified routing-policy change; the user's Pi-harness direction does not create a resolver route or receipt.
- The owner says both routes should be called via the Pi harness. Tool discovery in this session found no dedicated Foreman/Pi reviewer-dispatch or Pi route-receipt tool. The repository's `dispatch/src/routing-eval/index.ts` loads the frozen policy, walks its fixed allowlist, builds eligibility only from `provider === 'openrouter'`, and writes a local selection receipt; it neither invokes a model nor routes `opencode-go`/OpenCode Zen. The model-routing-chain-wrapper charter is orchestration-only and adds no resolver behavior. HRO's metadata refresh still leaves new candidates unapproved, and only declared fallback routes may be attempted. A supported Pi invocation path that emits and checks the required per-session receipt must be established before dispatch; raw OpenCode CLI invocation is not substituted.
- The existing L2 OpenCode route is public-only and has unproven fallback suitability; other OpenCode candidates remain public-only even where their endpoint/availability facts are resolved. No reviewed binding permits this internal packet through the requested L2 route.
- Other candidate bindings either conflict with the documented L2 provider pin or have unresolved identity/availability/cost/capability evidence. A route or conditional approval belonging to another goal is not reusable here.
- A provider/model route receipt must be emitted and accepted by the current resolver for each seat. A CLI being installed, a model appearing in a policy file, or this coordinator's current session route is not such a receipt.

**Result:** the proposed envelope is not launchable. The requested model spelling/provider binding, L2 eligibility, internal-data permission, and cross-provider fallback all fail or remain unresolved under current canon. The Pi harness is the required invocation surface if an eligible route is later approved; it is not a bypass. No provider call, availability probe, auth/settings inspection, or policy change has been made.

## 7. Owner approval requested

To open this review gate, the owner must separately approve or amend this envelope and resolve the route blocker. Specifically, reconcile the exact Pi provider/model ID for GPT-6.1-Sol, authorize an internal-data-eligible L2 route, and—if retaining the requested OpenCode Go → OpenCode Zen fallback—obtain the necessary owner-ratified routing-policy amendment and resolver support. Then bind one approved route receipt per reviewer seat, permission/data controls, budget, reviewer count, and the immutable context packet. Alternatively, authorize a bounded route-admission/preflight step. Until the route passes hard eligibility gates and the envelope is approved, the coordinator remains stopped here: no plan-review session, builder, implementation, fixture, or model execution is dispatched.
