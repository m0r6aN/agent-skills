# Goal Charter — Hybrid Routing Optimization

**Goal slug:** `hybrid-routing-optimization`
**Created:** 2026-09-26
**Owner:** Clinton Morgan
**Intended implementation agent:** GPT Luna (`gpt-5.6-luna` in the current agent catalog)
**Status:** Ratified HRO direction; coordinated implementation authorized on 2026-09-26, subject to evidence and independent review
**Scope:** Extend the existing Foreman Line routing and Pi adapter work with explicit provider mappings, deterministic caching, and measured optimization.

## Current implementation handoff

On 2026-09-26 the owner reviewed this charter, including the D8 unknown-model
recovery additions, and approved implementation in a fresh GPT Luna session.
This assignment authorizes scoped implementation work and verification within
the existing parcel workflow. It does not authorize merge, release, deployment,
publication, provider spend, private/internal disclosure, paid experiments, or
dispatch-time/global configuration writes. Luna is the implementation agent;
coordinator, architecture/risk, security, and independent-verification
authority remain with their existing owners and gates.

## Objective

**2026-09-26 authority update:** The user requested coordination through completion and granted blanket decision authority for this goal. The controlling standing authorization and coordinator ownership are recorded in [loop-directive.md](loop-directive.md). This supersedes the older planning-only and no-merge HRO statements above/below; it does not waive tests, independent review, or other goals' ownership. P1a/P1b are narrowed to isolated proposal/consumer components under the confirmed PMC/RCM handoffs; the full runtime exit criterion remains unchanged.

Reduce routing latency and total execution cost while preserving Foreman's authority over role, risk, classification, budget, permissions, and verification independence. Model selection and provider execution must be separate, auditable steps. Every dispatched route must be eligible under current policy, whether it originated from a cache, Jev, a catalog refresh, or an approved fallback.

This charter replaces the pasted `LocalizedRouter`, parcel shell hook, and estimated-savings dashboard as the proposed implementation direction. Those examples are problem context, not code to copy. Produce small, independently verifiable changes within the existing architecture.

## Relationship to existing work

Read the applicable `AGENTS.md` files and the relevant decisions in these documents before shaping implementation:

- [Coordinator pattern](../../COORDINATOR-PATTERN.md): charter lifecycle, routing of roles, independent review, and dispatch/merge gates.
- [Boundary routing charter](../foreman-line-boundary-routing/charter.md): existing routing authority, especially D7 and D8.
- [Pi model configuration charter](../pi-model-configuration/charter.md): provider catalogs, resolver, explicit fallbacks, and Pi session configuration. This goal extends those owners; it does not create a parallel resolver.
- [Routing currency and merit charter](../routing-currency-and-merit/charter.md): capability predicates, expertise bindings, catalog refresh, and replayability.
- [Pi adapter compatibility charter](../pi-routing-adapter-compat/charter.md): pointer to shipped evidence about actual Pi APIs. Follow its evidence pointers when needed; recheck the installed runtime before relying on an API.
- [Governed model fleet charter](../governed-model-fleet/charter.md): receipt, envelope, and settlement ownership.
- [Spec convention](../../SPEC-CONVENTION.md): parcel contracts and lifecycle.

Inventory what is already implemented, what remains active, and who owns each shared surface. Reuse completed work and avoid editing another active parcel's surfaces without coordination. Where this draft conflicts with ratified canon, identify the exact decision and propose a scoped amendment; do not silently replace it.

The current `routing-policy/src/validator.ts` already includes `openai/gpt-6-astra`. Do not count re-adding it as work or replace the validator wholesale.

## Proposed decisions for ratification

### D1 — Keep authorization deterministic

Use this execution sequence:

`policy eligibility → exact cache lookup / deterministic selection → optional Jev recommendation → current-policy revalidation → approved provider adapter → execution receipt`

Eligibility includes role and lane, risk, data classification, required capabilities and tools, context/output capacity, thinking requirements, provider privacy guarantees, remaining budget, and required reviewer independence. Apply it before sending any task metadata to a remote routing service and again immediately before dispatch. Cached decisions cannot grant authority. Changed policy or depleted budget can invalidate an otherwise matching route.

Jev remains recommendation-only. Coordinator, approval, security, verification, merge, and release authority remain governed by existing policy. Luna is the requested implementation agent, not a replacement for frontier-only coordinator, shaping, architecture/risk, or independent verification roles. The responsible coordinator must resolve any builder-tier incompatibility before assigning a policy-sensitive parcel to Luna.

### D2 — Separate identity, provider, protocol, and harness

Retain existing canonical registry keys and provider-neutral envelopes. Model identity, provider-local model ID, API protocol, and the Pi host's model identifier are distinct values. Extend the existing adapter contract to represent them explicitly, with catalog provenance and freshness. An OpenRouter-style slug is a reference identifier, not proof that another provider offers an equivalent endpoint.

Use verified mappings only. No prefix stripping, regex-based version substitution, or identity fallback for unknown models. A missing or incompatible mapping produces a typed unavailable/unsupported result. Use only declared, currently eligible fallbacks; never silently substitute Sonnet or change models mid-turn. Preserve current OpenRouter behavior during an additive migration, or provide an explicit versioned migration if existing strict schemas require it.

### D3 — Use the actual provider contracts

OpenRouter catalog discovery uses `https://openrouter.ai/api/v1/models`. It supplies metadata; it does not choose the best model for a parcel. Refresh catalogs outside the dispatch hot path where practical, recording source, fetch time, validity, and content hash. Discovery must not automatically promote a model into a trusted tier or allowlist.

Zen offers multiple protocols. Jev uses `https://opencode.ai/zen/v1/systemone` with `state` and typed `questions`; do not parse it as a chat completion. OpenCode configuration IDs can include `opencode/`, while provider API bodies use provider-local IDs. Verify the actual Pi adapter's requirements rather than assuming these formats are interchangeable.

Zen is a remote gateway. A local cache or terminal does not make its inference local. Validate the privacy eligibility of Jev inputs and every execution endpoint. Do not treat OpenRouter-specific privacy request fields as proof of equivalent Zen guarantees. If the required guarantee cannot be established, the route is ineligible.

### D4 — Make the common path cheap and bounded

Start with deterministic selection and an indexed exact cache. Cache keys must cover every input that changes eligibility or ranking, including policy/catalog/mapping versions, task class, role/lane, risk, classification, capability requirements, context and output requirements, and ranking configuration. Use a canonical encoding and test key separation. Revalidate dynamic budget, availability, and independence rather than trusting stored authorization.

Define TTL and invalidation behavior; validate cache records on read; treat corrupt or incompatible records as misses with diagnostic events. Use bounded queries, atomic upserts, uniqueness constraints, and explicit database lifecycle/concurrency handling. A cache failure may fall back to the same deterministic policy evaluator, never to a weaker routing path.

Do not send the full cache to Jev or add an inference call to every hit. Optional similarity matching operates only on a bounded, prefiltered set of eligible candidates with minimized metadata. Validate response types, selected candidate membership, confidence/abstention behavior, and current policy. Malformed, low-confidence, timed-out, or out-of-set recommendations return to deterministic selection or an explicit stop.

### D5 — Measure total cost and quality

Reuse existing receipt and settlement mechanisms. Cache entries represent reusable choices; they are not execution events. Record each decision, cache hit/miss, recommendation call, fallback, dispatch attempt, and settlement with correlated IDs and truthful provenance. Deduplicate event ingestion without hiding retries or repeated charges.

Capture actual provider/model, input/output and provider-cache usage where available, latency, failures, retries, billed or estimated cost, and price source/version. Keep estimates distinct from bills. Never label an API failure as `openrouter_api` success. Unknown cost stays unknown.

Compare a declared baseline with observed total costs, including Jev, retries, and actual provider charges. Do not assume a universal 5.5% saving, a blended $3/M rate, or 500 tokens saved per catalog lookup. Report comparable-workload assumptions and missing evidence. Evaluate task success and quality alongside latency and cost so cheap failed work is not counted as an improvement.

### D6 — Fit the repository and preserve parcels

Stay compatible with the owning packages' Node runtime and existing dependencies. Do not introduce Bun to support one cache. Bun's native SQLite module is `bun:sqlite`; it is not a drop-in replacement for Node's asynchronous `sqlite3` API. Choose storage after checking the existing runtime and persistence abstractions; a new dependency requires a concrete justification.

Use typed CLI arguments and existing YAML/parcel parsers. Do not interpolate user arguments into executable JavaScript, parse JSON with grep, or prepend duplicate frontmatter. Preserve existing parcel fields/body and validate the final artifact against the real parcel schema. Write atomically with explicit collision handling. Credentials come from the existing credential mechanism and must not enter logs, cache keys, receipts, or parcels.

### D7 — Prove benefit before enabling fuzzy routing

Deliver deterministic routing, mappings, and event measurement first. Jev similarity routing is disabled by default and is a separate experiment only if the baseline identifies a useful gap. Define the benchmark dataset, quality floor, cost/latency thresholds, and rollback rule before running the experiment. If it does not improve the declared objective while meeting the quality floor, leave it disabled and document the result.

### D8 — Recover from unknown models without guessing identity

An unlisted slug is an expected routing outcome, not an unhandled exception. Do not assume every unknown model produces HTTP 404 or that every 404 means an unknown model: distinguish mapping failures, catalog absence, credential/account restrictions, endpoint/protocol errors, rate limits, and provider outages using validated provider error responses. Preserve the original request and the actual selected route separately.

Implement a bounded recovery ladder inside the existing resolver:

1. Resolve an exact approved mapping or an explicitly registered alias. Confirm target-provider availability and all D1 eligibility requirements. Regex may validate identifier syntax; it must not infer identity, model quality, or version equivalence.
2. If evidence is missing or stale, permit at most one metadata-only refresh request per recovery episode, within a configured deadline and existing discovery policy. The designated catalog producer performs network refresh outside the dispatch hot path; the resolver consumes a validated published result or returns a typed pending/unavailable outcome. HRO must not introduce network calls inside the pure RCM evaluator. Coalesce concurrent refreshes and apply a short, version-scoped negative-cache TTL to repeated misses. Re-evaluate exact approved mappings after refresh. Discovery alone cannot approve a new mapping, tier, fallback, or account entitlement; newly discovered candidates await the existing review/configuration process.
3. Walk only the ordered fallback routes already declared for the authorized lane, with a finite attempt cap and deadline. Revalidate each target's provider, protocol, capabilities, data handling, independence, and remaining budget. An approved OpenRouter route may be used directly when no eligible Zen route exists, but only if that cross-provider fallback was explicitly declared. No universal DeepSeek, Sonnet, or other default is intrinsically safe for all roles.
4. If no eligible route remains, return a typed `route_unavailable` outcome with an actionable reason, record it, and hold the affected parcel. Continue independent parcels when dependency rules allow; never mark blocked work complete or crash the whole batch because one model cannot be resolved.

Different model/provider selection is a fallback, not an alias. Record attempted candidates, rejection reasons, refresh provenance, chosen fallback, and terminal outcome. Apply transient retries only where the provider contract and existing retry policy permit them. A request with uncertain execution/charge status must be reconciled before redispatch; exhaustion must not reset the ladder or create cycles. Use the existing circuit-breaker mechanism if present, or a minimal bounded provider-health cooldown, to avoid retry storms without permanently hiding recovered providers.

### D9 — Separate configuration repair from dispatch

Do not append guessed entries to `~/.pi/agent/models.json` from the routing hot path. A local declaration cannot create provider availability, establish model identity, or grant policy eligibility. Do not assume the provider key is `opencode-zen`, that a `{id, type: "chat"}` entry is valid, or that a running Pi session reloads changes automatically; establish these contracts from the installed runtime in P0.

For a verified provider model missing from local configuration, produce a minimal proposed configuration diff with catalog evidence and explicit mapping provenance. Reuse the configuration workflow owned by `pi-model-configuration`. Applying that diff requires existing scoped configuration-write authorization; this charter does not grant it. Prefer the existing managed/session-scoped configuration where supported. Never expand allowlists or frontier tiers as a side effect of config synchronization.

An authorized writer must validate the complete result against the actual Pi contract, preserve unrelated fields and credential references, enforce the intended path/scope, detect concurrent changes with a content hash or lock, and write atomically with recoverable backup/rollback. Treat an invalid source file or version conflict as a repair failure, not permission to replace the file. Make identical updates idempotent, refresh relevant cache versions only after a successful apply, and verify reload/new-session behavior before claiming the route is usable. Keep config contents and secrets out of alerts and diffs exposed to logs.

### D10 — Make recovery visible through structured events

Emit structured reason/outcome fields through the existing receipt/event path, for example `mapping_missing`, `catalog_refresh_failed`, `approved_fallback_selected`, `config_update_proposed`, and `route_unavailable`. These are proposed semantic labels to reconcile with existing schemas during P0, not an instruction to invent a parallel event format. CLI machine output remains valid JSON on stdout; human diagnostics go to stderr. Inspect validated event fields rather than grep output, model-name comparisons, or inferred `hardcoded_fallback` strings.

Show one concise warning when an approved fallback changes the requested route, and an actionable error when a parcel is held. Include parcel/correlation ID, requested and selected provider/model, reason, and next action where appropriate. Sanitize control characters and bound untrusted identifier text before terminal rendering. Deduplicate repeated warnings while retaining complete events and occurrence counts. Honor non-interactive output and no-color preferences. Audible/desktop notifications are optional, off by default, and platform-aware, including Windows; notification failure must not change routing outcomes. Do not introduce a background alert service for this feature.

## Ordered work packages

These are planning boundaries, not automatically dispatchable specs. Shape each into a small parcel with exact surfaces and tests; split any package that spans multiple independent subsystems. IDs below are local charter labels until registered through the normal parcel process.

| Package | Work and acceptance criteria | Dependencies | Risk / routing |
| --- | --- | --- | --- |
| HRO-P0 | Map existing resolver, policy, cache, Jev, and receipt owners; record runtime/catalog evidence; produce an overlap table and precise integration contract. Identify required canon amendments and existing functionality that needs no change. | None | Architecture/risk; frontier shaping/review |
| HRO-P1a | Validate isolated non-authoritative mapping proposals against injected binding evidence; preserve exact identity and reject guesses. | P0 and confirmed proposal-only handoff | Architecture/risk; user-selected Luna builder, frontier review |
| HRO-P1b | Test offline consumer compatibility with injected normalized facts/refusals; no production wiring or authority. | P1a | Architecture/risk; user-selected Luna builder, frontier review |
| HRO-P1c | Bridge the reviewed components to actual PMC bindings/resolver and the supported RCM adapter; test compatibility and refusal of proposal objects as authorization; assign exact cross-owner files before dispatch. | P1b, merged PMC-P1/P2 contracts, supported RCM adapter and canonical snapshot producer | Architecture/risk; serialized owner handoff |
| HRO-P2 | Add deterministic cache reuse to the PMC-owned resolver seam; demonstrate cold/warm parity, invalidation, and revalidation of all dynamic gates; prove unavailable/corrupt cache cannot weaken authorization. | P1c | Architecture/risk; tier resolved before dispatch |
| HRO-P3 | Integrate decision/attempt events with existing receipts and settlement; accurately measure repeated hits and retries; produce a baseline report with explicit cost provenance and unknowns. | P2 | Standard implementation where policy permits Luna |
| HRO-P4 | Wire the supported Pi/parcel entry point; validate configuration, actual host model selection, parcel preservation, declared fallback, and unavailable-provider rejection. | P3 | Architecture/risk at dispatch boundary |
| HRO-P4a | Implement D8's bounded recovery in the existing resolver; prove exact mapping, refresh limits, approved fallback, and per-parcel hold behavior without guessed substitutions. | P4 | Architecture/risk at dispatch boundary |
| HRO-P4b | Integrate evidence-backed configuration proposals and any already-authorized apply path with the existing configuration owner; prove idempotence, validation, concurrent-write rejection, preservation, and rollback behavior. | P4a, configuration-owner contract | Architecture/risk for configuration writes |
| HRO-P4c | Render D10's structured recovery events as concise, deduplicated diagnostics; verify machine-readable output, terminal sanitization, non-interactive behavior, and optional notification failure isolation. | P4a, P4b | Standard implementation where policy permits Luna |
| HRO-P5 | Optionally add bounded Jev recommendations behind a disabled flag; evaluate against the frozen baseline and predeclared thresholds; retain only if evidence supports it. | P4c, demonstrated need and approved experiment budget | Architecture/risk for decision boundary |
| HRO-P6 | Final acceptance: freeze public workload and quality rubric; collect comparable cold/warm live Pi receipts and cost/latency evidence; reconcile actual/estimated/unknown charges and independently verify the charter exit criterion. | P4c and any enabled P5, credentials and bounded smoke budget | Architecture/risk; independent acceptance |

Checkpoint after P0–P1: integration ownership, model mapping, and policy-preservation tests are independently reviewed before caching depends on them. Checkpoint after P2–P3: cold/warm outcomes and telemetry reconcile before runtime integration. Checkpoint after P4–P4b: recovery boundaries and configuration ownership are independently reviewed. Checkpoint after P4c: deterministic release candidate is complete; P5 is not required to claim a useful delivery and cannot be reported as delivered if deferred.

## Verification and acceptance

- [ ] Valid existing routes remain valid; unknown mappings, disabled models, stale catalogs beyond policy tolerance, incompatible protocols, and undeclared fallbacks are rejected.
- [ ] Cold selection, warm cache hits, Jev results, and declared fallbacks enforce the same role, classification, capability, budget, privacy, and independence constraints.
- [ ] Policy/catalog changes invalidate affected cache entries; remaining-budget changes can reject a cached route; concurrent identical requests cannot corrupt cache records or duplicate settlement.
- [ ] Restricted metadata cannot reach an ineligible router/provider; malformed Jev answers and fabricated candidate IDs cannot authorize a dispatch.
- [ ] Provider timeouts and errors produce truthful outcomes and only approved recovery. Failure after an uncertain execution outcome cannot trigger an unaccounted duplicate dispatch.
- [ ] Unknown preview slugs and superficially similar model names never acquire guessed mappings. Test distinct unknown-model, wrong-endpoint, authorization, rate-limit, and outage outcomes; none bypass policy or cause an unhandled batch failure.
- [ ] Recovery is bounded under repeated and concurrent misses: one coalesced refresh per episode, expiring negative-cache entries, finite fallback attempts, no cycles, and no retry after an uncertain dispatch until reconciliation. Ineligible fallback candidates are skipped with reasons; exhaustion holds only affected/dependent work.
- [ ] A newly discovered but unapproved model remains ineligible. Routing never writes global Pi configuration. Configuration proposals contain evidence; authorized apply tests cover invalid files, concurrent edits, interrupted writes, rollback, duplicate updates, unrelated-field preservation, and verified session reload behavior.
- [ ] Fallback and hold events report requested/actual routes accurately. Stdout remains parseable JSON, stderr diagnostics are sanitized and deduplicated, and disabled/failed optional notifications cannot alter routing. Cover Windows and non-interactive output behavior.
- [ ] Quoted CLI arguments remain data; malformed/duplicate frontmatter is handled deliberately; valid parcel content survives read/write round trips; failed writes do not leave partial output.
- [ ] A fixture with one miss, repeated hits, a retry, and a failed recommendation reports the exact event counts and known costs. Estimates and unknown values are separately visible.
- [ ] Relevant package tests, typechecks, lint, schema generation checks, and focused integration tests pass using the repository's existing scripts. Do not invent a root test command or add another test framework.
- [ ] Record a public synthetic end-to-end Pi smoke receipt proving the requested provider/model was selected and used. Pin runtime/catalog evidence and redact credentials. Fixture success alone is not evidence of live execution.
- [ ] Report latency, total cost, and quality against the baseline; do not claim savings without comparable evidence. Any optional Jev enablement meets the thresholds declared before its evaluation.

Run focused tests after each slice and impacted integration checks at checkpoints. Record commands, outcomes, unresolved limitations, and artifact paths in the implementation handoff. Independent reviews follow existing canon; Luna's own tests do not satisfy independent verification.

## Exit criterion

The existing Foreman/Pi path can execute an approved, explicitly mapped route with deterministic cache reuse, current-policy enforcement on every dispatch, and accurate correlated receipts. Unknown models yield bounded, approved recovery or an actionable per-parcel hold, without guessed identities or dispatch-time global configuration writes. Configuration repair proposals and operator diagnostics are verified against D9–D10. Compatibility and rejection tests pass; independent review findings are closed; a public synthetic live smoke receipt establishes runtime behavior. The final report states measured results and any deferred Jev experiment without presenting unmeasured savings as achieved.

## Authorization and stop conditions

The user requested creation of this charter and subsequently authorized optimizing and incorporating the unknown-model recovery, configuration-repair, and terminal-alert proposal. These document edits do not themselves dispatch Luna, grant merge/release or global configuration-write authority, or authorize paid provider experiments. Charter ratification is recorded separately through the existing process. Preserve any separately recorded standing authorizations and their exact scopes; do not infer new ones from this document.

Before implementation dispatch, apply the existing charter ratification and plan-review process. Record the selected Luna version, named branch/worktree, parcel surfaces, and applicable builder-tier decision in the dispatch directive. Do not silently switch to another Luna generation or grant Luna a frontier-only role.

Stop the affected work and report the exact blocker if a frozen contract must change, active parcel ownership conflicts, required privacy guarantees cannot be established, no eligible route fits the remaining budget, live verification lacks credentials/budget authorization, or independent review exposes an unresolved security issue. Continue unrelated authorized work where possible. Do not conceal a blocker through fallback, broadened allowlists, or a fabricated success receipt.

## Reference contracts

These official references informed the review on 2026-09-26; recheck relevant endpoint and runtime contracts during P0 and record the evidence used:

- [OpenCode Zen endpoints, model IDs, and Jev protocol](https://opencode.ai/docs/zen/)
- [OpenRouter model catalog API](https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties)
- [Bun SQLite API](https://bun.sh/docs/runtime/sqlite) — clarification of the rejected example's runtime assumptions, not a dependency recommendation.

**First instruction to Luna:** Read this charter and the assigned parcel contract, inspect the actual owning modules, and report existing coverage and the smallest missing slice. Implement only the authorized parcel under its approved routing and review arrangements. Do not recreate the pasted standalone router.
