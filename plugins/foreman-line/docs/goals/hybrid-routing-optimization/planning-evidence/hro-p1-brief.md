# HRO-P1 shaping red-team brief

## Context

The Hybrid Routing Optimization charter extends the existing Foreman Line
routing and Pi adapter work. P0 found active ownership of routing-policy,
dispatch, catalog/eligibility, Jev, receipts, and Pi configuration surfaces.
The P1 draft proposes an additive provider-neutral mapping boundary with exact
identity, provider-local model ID, protocol, Pi host model ID, provenance, and
typed fail-closed rejection.

Non-negotiable constraints are deterministic policy eligibility, no regex-based
identity inference, Jev recommendation-only authority, no silent fallback, no
dispatch-time global configuration mutation, reuse of existing owners, and no
provider spend or live calls in P1.

## Inventory

- Existing deterministic evaluator: plugins/foreman-line/dispatch/src/routing-eval/index.ts
- Existing mapping registry: plugins/foreman-line/routing-policy/src/pi-openrouter.ts
- Existing policy validator and schemas: plugins/foreman-line/routing-policy/src/
- Existing Jev contract: plugins/foreman-line/jev-decisions/
- Existing receipt contract: plugins/foreman-line/receipts/
- Pi compatibility evidence: plugins/foreman-line/docs/goals/pi-routing-adapter-compat/compat-memo.md
- P0 inventory: plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p0-inventory.md
- P1 draft: plugins/foreman-line/docs/specs/active/HRO-P1-explicit-provider-mappings.md

## Verified observations

- The current evaluator selects an eligible model from policy tier order and writes a routing JSON file.
- The current Pi/OpenRouter registry stores provider-neutral-looking model keys but does not expose provider-local ID, protocol, or host model ID as separate mapping fields.
- The current Jev contract is a fixed structured-decision contract, not a generic chat-completion router.
- Receipt schemas are owned separately and do not currently define HRO decision/attempt event semantics.
- Active RCM-P1 and SUPERCHARGE-P1 work claims routing-policy/catalog surfaces.
- The current environment is Node v24.7.0; several packages declare Node >=24.11.1.

## Your task

Red-team the HRO-P1 draft. Focus on what breaks first, hidden owner/contract
dependencies, security and fail-closed behavior, and whether a cheaper or
safer parcel decomposition exists. Identify any acceptance criterion that is
not testable or any allowed-file boundary that would permit silent scope drift.
Do not propose implementation code. Do not assume owner handoffs exist.

## Output contract

Deliver EXACTLY: "TOP 5 BRUTAL FINDINGS" (numbered, one line each) then "TOP 5 MOVES" (numbered, one line each, implementation-ready). Max 350 words total. Plain text only.
