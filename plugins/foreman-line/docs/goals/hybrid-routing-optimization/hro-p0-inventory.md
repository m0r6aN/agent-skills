# HRO-P0 — overlap, evidence, and integration inventory

Goal: hybrid-routing-optimization
Date: 2026-09-26
Implementation agent: GPT Luna (gpt-5.6-luna)
Status: inventory complete; implementation remains gated by ownership and parcel shaping

## Scope and evidence boundary

This record is a read-only inventory of the current worktree and existing
goal evidence. It does not add a resolver, cache, provider call, Pi host
configuration entry, fallback, or new event schema. It does not grant Gate 2,
merge, release, deployment, provider spend, internal-data disclosure, or
configuration-write authority.

The authoritative HRO decisions are in charter.md. In particular, D1
requires policy eligibility before and immediately before dispatch; D2 requires
separate canonical identity/provider/protocol/host values and verified
mappings; D8 requires bounded, typed unknown-model recovery; and D9 forbids
dispatch-time global configuration patching.

## Existing owners and overlap

| Surface | Current implementation/evidence | Existing owner or active claim | HRO integration consequence |
|---|---|---|---|
| Deterministic primary selection | dispatch/src/routing-eval/index.ts (evaluateRouting) loads and validates the frozen policy, intersects class tiers with classification eligibility, selects the first eligible model, and writes a routing decision file. It is pure with respect to network/provider calls but currently writes a non-chain receipt directly. | Dispatch W2-P3; also listed as verification input by active SUPERCHARGE-P1/P2 work. | Extend this owner or add an explicit resolver seam; do not create LocalizedRouter or replace the evaluator wholesale. |
| Policy contract and validator | routing-policy/routing-policy.yaml, src/validator.ts, src/types.ts, src/schemas.ts; validator contains openai/gpt-6-astra in the frontier registry. | Routing-policy W0-P3; active RCM-P1 and SUPERCHARGE-P1 claim policy/catalog surfaces. | Any policy/model-list change requires coordination with those owners. HRO does not re-add Astra or rewrite the validator. |
| Catalog/eligibility projection | RCM-P1 specifies src/catalog-snapshot.ts, src/eligibility.ts, and fixtures, but those files are not present in this worktree. | Active RCM-P1 parcel. | HRO consumes the eventual snapshot/projection contract; it must not duplicate catalog storage or eligibility logic. |
| Pi/OpenRouter mapping | routing-policy/src/pi-openrouter.ts has an explicit OpenRouter registry with provider, base URL, enabled IDs, lane/capability metadata, and Jev recommendation-only constraints. It has no provider-local/protocol/host mapping layer. | Pi model-configuration goal and its owner; boundary-routing/RCM decisions govern authority. | P1 should be an additive mapping contract owned with PMC, preserving existing OpenRouter behavior and schema parity. |
| Pi runtime compatibility | docs/goals/pi-routing-adapter-compat/compat-memo.md records a hashed Pi 0.87.1 surface: setModel and setThinkingLevel exist on the extension surface, but remain non-authorizing APIs; beforeLLMTurn is absent from the enumerated surface. | PRAC-P0 evidence; no adapter authorization. | Do not infer a dispatch hook or host reconfiguration path from these APIs. |
| Jev recommendation | jev-decisions/ validates a fixed jev-decisions/v1 support-triage response and creates a typed advisory. The active JEV contract is structured, bounded, and provider-specific; it is not a generic chat-completion router. | JEV-P0/P3/P4/P5 active parcels; RCM Jev alpha evidence. | HRO may call Jev only through its existing recommendation contract, with minimized eligible candidates and revalidation; no new Jev protocol parser in HRO. |
| Receipts and settlement | receipts/src/types.ts and schemas.ts define the frozen receipt document/chain shape. dispatch currently writes routing JSON directly, while Stage-C writes a Foreman receipt through the approval CLI. | W0-P4 receipt owner; active FL-R1 terminal-seal work. Governed Model Fleet owns effect/settlement semantics in its own authority plane. | HRO events must fit the existing receipt/event path after an owner-approved contract; cache entries are not execution receipts. |
| Configuration | foreman-config/ validates Foreman project configuration. No Pi global-model writer exists in this repository. PMC evidence governs Pi configuration ownership and scoped repair. | Pi model-configuration owner; host/Pi configuration is outside the HRO worktree. | D9 remains proposal-only here; no ~/.pi/agent/models.json mutation or guessed provider key. |

## Current implementation gaps relevant to HRO

The repository currently has no evidence of:

- a cache keyed by policy/catalog/mapping versions and all eligibility/ranking inputs;
- an explicit verified cross-provider mapping from canonical identity to provider
  model ID, protocol, and Pi host ID;
- bounded unknown-model recovery with refresh coalescing, negative-cache TTL,
  fallback-attempt caps, and typed route_unavailable;
- a unified decision/attempt/settlement event path for cache hits, Jev
  recommendations, retries, fallbacks, and unknown cost;
- a dispatch-safe configuration proposal/apply boundary for verified missing
  Pi declarations.

The absence of these features is an inventory finding, not permission to fill
the gaps in overlapping owner surfaces.

## Proposed integration contract for shaping HRO-P1

The next parcel should expose an owner-approved, provider-neutral resolver
boundary with these semantic inputs and outputs:

1. Input contains canonical model identity (when requested), provider/protocol
   constraints, host model identifier, task class, role/lane, risk,
   classification, capability/tool requirements, context/output bounds,
   thinking requirement, independence requirement, policy/catalog/mapping
   versions, and remaining-budget/availability probes.
2. Resolution first performs deterministic policy eligibility and exact
   approved mapping lookup. Any cache or recommendation is advisory and must
   be revalidated immediately before dispatch.
3. Output carries separate canonical identity, provider, provider-local model
   ID, protocol, host model ID, mapping provenance/freshness, and a typed
   rejection reason. It must distinguish mapping absence, catalog absence,
   provider authorization, endpoint/protocol failure, rate limit, and outage.
4. Fallback is an ordered, explicitly declared route list with a finite attempt
   cap and deadline. A different model/provider is never recorded as an alias.
5. Configuration repair returns a minimal evidence-backed proposal to the PMC
   owner; it never writes global configuration from the dispatch hot path.

This contract is deliberately a shaping input, not a new public API. P1 must
reconcile it against the ratified owner contracts before implementation.

## Required independent review questions

- Does the proposed mapping preserve exact identity and forbid regex-based
  inference or prefix stripping?
- Does every route, including cache hits, Jev recommendations, and declared
  fallbacks, pass the same policy/privacy/budget/independence checks?
- Does the event/receipt design preserve existing chain and settlement ownership
  instead of inventing a parallel telemetry format?
- Can a missing or stale mapping fail closed without mutating Pi global config?
- Do active RCM, SUPERCHARGE, PMC, JEV, dispatch, and receipt parcels have
  explicit file-level handoffs before any overlapping file is edited?

## P0 disposition

HRO-P0 is complete as an evidence inventory. HRO-P1 is not independently
dispatchable from this record alone: the overlapping owners must confirm the
mapping/resolver boundary and allowed files, and architecture/risk review must
resolve the contract before cache, recovery, or dispatch integration proceeds.
