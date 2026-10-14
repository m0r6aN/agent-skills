# Static reviewer-route preflight — OPMEM planning

**Recorded:** 2026-10-10  
**Coordinator:** Pi session `01a127de-54e3-7556-9b8f-157e66a9d00a`  
**Inspected agent-skills HEAD:** `b90ad84132ed3c2e3c05b07c85c47466d11479a1`  
**Authority:** owner-approved bounded local static preparation only  
**Outcome:** `HOLD — no eligible, authorized plan-review launch path established`  
**Artifact kind:** coordinator planning note; not an independent review, coordinator lint, route receipt, approval receipt, or launch authorization

## Scope and method

Read existing local policy, source, and recorded evidence. No resolver/controller function was invoked, no policy was changed, no receipt/hash was minted, no host settings/auth file was inspected, and no provider/network/credential operation occurred. Static conclusions below identify literal policy/source checks, not results from an executed resolver or live model test. Historical verification counts and availability captures are cited as their authors' records, not rerun or adopted as fresh evidence.

The review subject is the OPMEM charter, produced by an OpenAI-family coordinator (`PI_PROVIDER=openai`, `PI_MODEL=gpt-6.1-sol`). Treat the plan packet as **internal**: the P0 draft already declares `data_classification: internal`. Do not downgrade it to public to make a route available. The required plan-review lane is L2 / adversarial-reviewer / architecture/risk / frontier. A fresh reviewer must be independent of the author; use `openai` as an excluded family for the primary and fallback of this plan review.

For completed P0, independence is re-evaluated against the actual builder and between the two reviewers. No P0 builder family has been assigned. The plan-review candidate below is not a pre-approved P0 dual-review roster.

## Current policy-listed L2 pairs

These are exact existing declarations in `routing-policy/routing-policy.yaml`, not operational approvals. Different providers serving the same family do not create family diversity.

| Provider | Exact primary → fallback | Static disposition for this internal plan review |
|---|---|---|
| `opencode` | `opencode/claude-sonnet-5-5` → `opencode/gpt-6-luna` | Both Zen legs are public-only under Amendment 09. Fallback is OpenAI-family and violates this review's excluded family. Sonnet endpoint divergence/availability and suitability evidence also remain held. |
| `openrouter` | `openrouter/anthropic/claude-opus-5.5` → `openrouter/openai/gpt-6-astra` | Primary is a different family; fallback is OpenAI-family and collapses independence. Identity/availability, context, capability, thinking, quality, and suitability evidence are not established sufficiently for launch. Declared non-public transport requirements are obligations, not measurements of upstream behavior. |
| `anthropic` | `anthropic/claude-fable-5-1` → `anthropic/claude-opus-5-5` | Both legs are Anthropic-family, independent of this OpenAI-authored plan. This is the only inspected pair without a primary/fallback family collision for this review. Non-public eligibility is explicitly premise-falsified under Amendment 06 N6 (OAuth vs assumed commercial API terms); capability/quality/suitability and launch integration remain unresolved. Not launchable. |

Locators: legacy policy L2 map at line 245; L2 pairs at lines 1180, 1185, and 1231; first-party binding evidence under `candidates.claude-fable-5.1` (line 801) and `candidates.claude-opus-5-5` (line 335). Line numbers are snapshot locators, not permanent links.

Google's `openrouter/google/gemini-3.1-pro-preview` appears as a selection-only candidate with missing evidence, but has no declared L2 primary/fallback pair and is absent from the inspected provider-prefixed frontier binding registry. It is not an invented second review route. Selecting two Anthropic models or two Anthropic-serving providers likewise does not establish two-family P0 review diversity.

## Launch boundaries — distinguish versions

### Legacy Pi entry is wired to the legacy resolver

`dispatch/src/pi-entry/index.ts` imports `resolveRoute` from `routing-policy/src/pi-resolver.ts`, validates the exact policy bytes/decision requirements, resolves, then invokes `verifyLaunch`. A stop receipt returns `route-unavailable`; no direct invocation is authorized (`preparePiEntry`, approximately lines 580–750).

The legacy policy records `L2_PINNED_PROVIDER_UNSET`, `DELTA_L_UNSET`, and unproven capabilities/quality/fallback suitability. This is more than an unfilled YAML setting:

- `routing-policy/src/pi-resolver.ts`, `providerRuleGate` (approximately lines 1000–1069), requires the provider pin and quality tolerance to retain their exact typed-unavailable residual shape. An unset L2 pin stops; a directly filled value is refused as `RESIDUAL_FABRICATED_REFUSED` by this version.
- `routing-policy/src/validator.ts` freezes the residual provider-rule shape alongside the role/lane authority map (approximately lines 570–586).
- `evaluateCandidate` (approximately lines 694–958) requires definite capability, independence, context/budget, live-availability and quality evidence. Both primary and fallback must qualify. Unknown evidence is not ranked last or replaced with defaults.

Therefore a chat-level provider selection or a policy edit in OPMEM cannot unblock this entry. Any version/cutover/contract disposition belongs to its authorized upstream owner. This note does not claim that every Foreman consumer uses this legacy path.

### Newer v1 contracts do not share the legacy residual slots

`routing-policy/src/provider-binding-schemas.ts`, `PMC_LANE_POLICIES_V1`, declares L1/L2 pinned to **opencode** with numerical quality tolerance **0**. Off-pin declarations are historical/nonselectable. This differs from the legacy YAML's unavailable slots; do not combine them into one route contract or assume a lossless projection grants execution authority.

`docs/goals/pi-model-configuration/pmc-p1a-verification.md` and `pmc-p1b-verification.md` describe static contract/projection evidence only. They explicitly leave execution, evidence authenticity, data handling, availability, quality, and activation unproven. The recorded v1 projection is evidence-only.

### Newer controlled launcher explicitly does not admit this review

`dispatch/src/pmc-launch/controller.ts` performs literal input gates:

- line 307: `route.dataClass !== 'public'` → `NONPUBLIC_REFUSED`;
- line 383: `route.lane === 'L1' || route.lane === 'L2'` → `PINNED_TRANSPORT_REFUSED`.

The production terminal also checks `provider === openrouter` and `dataClass === public` in `dispatch/src/pmc-launch/pi-runtime-port.ts` (approximately lines 418–448). `controller-types.ts`'s wire declares public-only/OpenRouter transport.

These are intentional scope boundaries of the inspected source. They are not proof of a broken resolver and do not authorize break-glass, reclassifying the packet, putting a reviewer in a builder lane, or adapting a different transport inside OPMEM. The presence of a newer controller does not establish an internal L2 Pi-session review path.

## Reviewer isolation / result custody

The existing permission-profile emitter projects `.claude/settings.local.json`; its README explicitly limits enforcement to sessions that load it and discloses shell-mutation residuals. This preparation has not established that a Pi CLI reviewer loads/enforces that file. Do not label it mechanically read-only merely because the profile is named `reviewer-readonly`.

An authorized route needs a bounded Pi task envelope, no mutation/config/credential/network authority beyond the approved review, independent fresh context, and an accepted launcher/envelope mechanism. Reviewer output should be returned to the coordinator for persistence/custody; the reviewer never fixes or commits. Capture starting/ending worktree state and exact executed identity as the standing detection control. Worktree/branch creation is not authorized at this stage.

## Conditional proposal — not an authorization request to launch today

If the upstream owner establishes an eligible internal L2 Pi-session path for the existing first-party pair, the proposed single plan review is:

| Field | Proposal |
|---|---|
| Lane / role / class | L2 / adversarial-reviewer / architecture/risk |
| Data | internal; exact bounded review packet, no credentials or customer data |
| Primary | `anthropic/claude-fable-5-1` |
| Sole fallback | `anthropic/claude-opus-5-5` |
| Family exclusions | `openai` for both primary and fallback |
| Thinking | `xhigh`, subject to accepted requirement→receipt→Pi selection consistency; Fable's recorded catalogue does not declare `high` |
| Tools / output | Read-only bounded local evidence access required; no structured-output model capability required; plain findings table. Required tool capability still needs real evidence. |
| Context capability floor | 200,000 tokens, separate from the bounded input estimate |
| Estimated maximum input / output | 48,000 input tokens and 8,000 total output/reasoning tokens per attempt; every token-bearing repeat counts toward the bound |
| Attempts | At most one primary attempt and one declared fallback attempt; no third model, unbounded retry, or silent mid-turn continuation |
| Aggregate review ceiling | **USD 5.00 proposed, not granted**, including both attempts and any authorized probe charges; existing architecture/risk class ceiling is USD 25.00, not a spend grant |
| Excess / unknown usage | Stop before exceeding the approved bound; indeterminate spend requires reconciliation, not a fresh attempt under a reset budget |
| Receipt / launch | Upstream-admitted resolver-approved route plus validated launch and exact executed identity; not minted during this preparation |

Illustrative token-price arithmetic only, using the recorded first-party list-price evidence: Fable $10/$50 per million input/output gives $0.88 at 48k/8k; Opus $4/$20 gives $0.352; both attempts total $1.232 before fee/pricing/auth-mode differences. This is not a quote, an OAuth billing assertion, live pricing evidence, a provider-spend authorization, or proof of suitable model quality. The USD 5.00 proposal leaves headroom but still requires actual enforcement/reconciliation and eligible evidence.

Thinking consistency is an upstream check: the legacy resolver emits lane thinking from `LANE_THINKING_LEVELS` while its capability predicates accept request-specific thinking; the inspected Pi entry also carries decision-resolved thinking. No OPMEM record may quietly change a required level to pass a catalog predicate.

The proposal is **conditional and blocked**. Upstream may supply a different already-authorized pair/path; if so, return its exact route/fallback/independence/data/budget evidence for owner approval rather than substitute it silently.

## Bounded upstream handoff needed

OPMEM does not own `routing-policy/**`, `dispatch/**`, PMC/HRO goal records, or Pi host configuration. The PMC directive has historical/contradictory state labels; HRO records a separate coordinator and shared-source sequencing. Neither is proof that its coordinator is currently live or that it delegated source edits to OPMEM.

Request from the owner, without spawning another agent or mutating those records:

1. Name/confirm the current accountable PMC/HRO routing/launch owner and authorize a **report-only handoff** of this note. Alternatively, supply an existing approved internal frontier L2 route and launcher with its authoritative references.
2. Ask that owner to identify one supported version/path admitting fresh internal plan reviews, with eligible primary/fallback, provider/data-policy evidence, model-family independence, capability/context/thinking consistency, quality/suitability, budget/freshness, and Pi enforcement/result custody. This is a bounded dependency request, not a new OPMEM implementation parcel.
3. Return the supported path and exact review envelope for separate OPMEM owner route/spend approval. Only then mint a route record/launch a reviewer through the accepted path.

No break-glass request is proposed: fail-closed missing evidence and declared public/L2 exclusions are not evidence that the resolver itself is broken. Do not waive the gates merely to keep planning moving.

## Other prerequisites retained — not reopened requirements

- Bridge provenance/upstream/base still needs an owner disposition; no Git recovery is authorized.
- Cortex/Gateway/docs revisions and local-change owners remain unselected. Existing local HEAD/tracking refs are observations, not accepted release bases.
- W1-P4 registration destination remains unresolved; current KONE test-only gate cannot be bypassed or silently treated as personal-project tracking.
- P0's API/canon/fixture/numerical work remains unexecuted. Route preparation did not create any of its seven deliverables or amend its draft.

## Completion of this authorized step

Static preparation is complete at this boundary. Ownership/ratification are persisted; a draft plan-review brief is prepared separately. No independent review, coordinator lint, route approval, receipt emission, W1 projection/approval/registration, P0 promotion/dispatch, or implementation is claimed. Stop awaiting the owner's bounded upstream disposition; protect primary project delivery rather than begin a Foreman/Cortex repair program.
