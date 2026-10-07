# HRO-P1 — Mapping contract: explicit identity/provider/protocol/harness separation and typed rejection

**Goal:** `hybrid-routing-optimization` · **Package:** HRO-P1 (charter §"Ordered work packages") · **Date:** 2026-09-27
**Authority / gate receipt:** coordinator decision 2026-09-27 under owner blanket authority (this run's dispatch directive; gate receipts are coordinator decision receipts, never fabricated human approvals). HRO-P0's dependency ("P0, resolved contract conflicts") is satisfied by `hro-p0-integration-contract.md` §3.1, which names this exact additive surface.
**Evidence convention:** `path:line` relative to `plugins/foreman-line/`; a bare `charter.md:N` is this goal's charter. No live network calls were made (charter D3 / the PMC-P0 secret boundary).

## 1. Scope and write set

HRO-P1 implements the charter row: *"Extend the approved adapter with explicit mappings/protocols and typed rejection; demonstrate a supported route plus unknown-ID rejection; preserve existing provider behavior and schema/template consistency."*

Write set (exactly the assigned surfaces):

| Surface | Change |
|---|---|
| `routing-policy/src/pi-openrouter.ts` | Extended `PiOpenRouterModel` (additive, optional), protocol vocabulary, provenance type, extended model/routing schema, and `resolvePiOpenRouterRoute` with typed unavailable/unsupported result |
| `routing-policy/src/types.ts` | `ADAPTER_REFUSALS` / `AdapterRefusalName` (`:527-536`) — the adapter refusal vocabulary in the routing vocabulary home |
| `routing-policy/src/schemas.ts` | `declaredEvidence` exported (`:118`) so the Evidence-envelope schema mechanism exists exactly once (reused by the adapter's provenance field) |
| `routing-policy/src/index.ts` | Re-exports of the new adapter API (additive; package is single-writer in this window) |
| `routing-policy/schemas/pi-openrouter-routing.schema.json` | Regenerated (`npm run generate`, 11 files rewritten deterministically; parity no-drift tests prove the committed set matches the typed sources) |
| `templates/pi-openrouter-routing.json` | Lockstep with `PI_OPENROUTER_ROUTING` (parity test `tests/pi-openrouter.test.ts:41-44`) |
| `routing-policy/tests/pi-openrouter.test.ts` | Three named HRO-P1 demos + vocabulary/schema-consistency and provenance tests (`:109-352`) |
| `docs/goals/hybrid-routing-optimization/` | This record + `hro-state-record-2026-09-27.md` |

Forbidden surfaces (`dispatch/**`, `spec-linter/**`, `foreman-config/**`, `docs/SPEC-CONVENTION.md`, `ops-console/**`, `project-scaffold/**`, other `templates/`, other goals' dirs) were not touched. `routing-policy/src/pi-resolver.ts`, `route-receipt.ts`, `launch-boundary.ts`, `cli.ts`, `registry.ts`, `generate.ts`, `host-settings-proposal.ts`, `testing.ts`, and `routing-policy.yaml` are unchanged by this package.

## 2. The contract extension (charter D2/D3)

D2 requires that "model identity, provider-local model ID, API protocol, and the Pi host's model identifier are distinct values… with catalog provenance and freshness". The extended `PiOpenRouterModel` (`src/pi-openrouter.ts:69-89`) adds three optional fields beside the existing `opencodeId`:

| D2 value | Field | Where |
|---|---|---|
| Model identity | registry key (the `models` key; surfaced as `PiOpenRouterResolvedRoute.registryKey`, `:1013`) | unchanged canonical key |
| Provider-local model ID | `providerLocalId?: string` (`:81`) — the value the provider request body sends | new |
| API protocol | `protocol?: PiOpenRouterProtocol` (`:86`) from the closed `PI_OPENROUTER_PROTOCOLS` (`:49`) | new |
| Pi host's model identifier (harness) | `opencodeId` (pre-existing) — surfaced as `hostModelId` (`:1021`) | unchanged |
| Catalog provenance + freshness (D3) | `provenance?: DeclaredEvidence<PiOpenRouterProvenance>` (`:88`): named source on the envelope, `fetched_at` / `valid_until` / `content_hash` in the value (`:60-67`) | new |

Protocol vocabulary (`:43-49`): `openai-chat-completions` (the pinned OpenRouter execution plane, `baseUrl` `/api/v1`) and `zen-systemone` (Zen's structured-decision protocol — "do not parse it as a chat completion", charter D3). Closed set, derived type, schema `enum` generated from the same const (`:883`); provenvenance-absent = unknown, never assumed current (the `inputs?:` precedent, `types.ts` ModelBinding).

### 2.1 Additive migration, behavior preserved

- All three fields are optional in the typed contract and the schema (`required` unchanged: `capabilities`, `allowedLanes`, `prohibitedLanes`, `authority`). A pre-HRO document shape stays schema-valid — pinned by the unchanged legacy-fixture test (`tests/pi-openrouter.test.ts:88-106`) and by the incomplete-mapping fixture in the distinct-reasons demo (`:226-268`).
- All 65 shipped mappings now carry explicit values: `providerLocalId` equals the registry slug (today's OpenRouter request-body id — same value as before, now an explicit distinct field) and `protocol: 'openai-chat-completions'`. No key, `opencodeId`, capability, lane, authority, `baseUrl`, or `enabledModels` content changed; `templates/pi-openrouter-routing.json` carries the identical fields (deep-equal lockstep test `tests/pi-openrouter.test.ts:41-44`).
- `provenance` is absent on the shipped hand-authored mappings: there is no catalog acquisition record for them, so none is fabricated (D3/A6 honesty). Declared provenance is demonstrated on a fixture (`tests/pi-openrouter.test.ts:310-352`).
- Existing behavior of every consumer of the unchanged fields (`pi-resolver.ts` `piModelContractFor`, `testing.ts` sample, semantic invariants) is untouched.

### 2.2 Typed resolution and rejection (D2, D8 step 1)

`resolvePiOpenRouterRoute(routing, requestedModelId, requestedProtocol)` (`src/pi-openrouter.ts:1057`) returns the typed unavailable/unsupported result of D2 (`:1040-1045`):

| Outcome | `status` | `refusal.name` | When |
|---|---|---|---|
| supported | `resolved` + `PiOpenRouterResolvedRoute` (`:1010`) | — | exact key lookup succeeds and the mapping is explicit and protocol-compatible |
| unknown id | `unavailable` | `MAPPING_MISSING_REFUSED` | no declared mapping for the exact requested id (lookup is `Object.hasOwn` exact-match only) |
| incomplete mapping | `unavailable` | `MAPPING_INCOMPLETE_REFUSED` | mapping lacks explicit `providerLocalId` and/or `protocol` — a value is never derived from the registry key or host id |
| incompatible protocol | `unsupported` | `PROTOCOL_INCOMPATIBLE_REFUSED` | declared `protocol` ≠ requested execution protocol |

Identity discipline (D2/D8): no prefix stripping, no regex version substitution, no family fallback, no identity fallback of any kind — an unknown or incomplete mapping never produces a route object, only a typed refusal whose `detail` names the requested id. Prototype-chain keys (`toString`, `constructor`, `__proto__`) are unknown ids. Refusal names live in the `ADAPTER_REFUSALS` closed vocabulary (`types.ts:527-536`, RCM-P2/P3 `as const` + derived-type mechanism); each name identifies its own failure and none folds into the `RESOLVER_*`/`CONTRACT_*` vocabularies (pinned at `tests/pi-openrouter.test.ts:270-285`).

## 3. Demonstration tests (charter acceptance)

All three demos are named tests in `routing-policy/tests/pi-openrouter.test.ts`; each runs against the shipped registry where possible and asserts the typed result shape (no route object ever accompanies a refusal).

| Demo | Test (name verbatim) | Proves |
|---|---|---|
| (a) supported route | `HRO-P1 demo (a): a supported route resolves and executes through the extended mapping` (`:115`) | the shipped document validates; `openai/gpt-5.6-luna` resolves; the executed identities come from the mapping — provider request id `openai/gpt-5.6-luna` at the pinned `baseUrl` under `openai-chat-completions`, harness session id `gpt-5.6-luna` — the four D2 values carried as distinct fields |
| (b) unknown id | `HRO-P1 demo (b): an unknown model ID is rejected typed unavailable, never a guessed identity` (`:152`) | prefix/suffix-variant/version-substitution/family-fallback near misses and prototype keys all yield `unavailable` + `MAPPING_MISSING_REFUSED`, with no route object |
| (c) incompatible protocol | `HRO-P1 demo (c): a known model with an incompatible protocol mapping is rejected typed unsupported` (`:174`) | a known shipped model requested as `zen-systemone` and a Zen-declared mapping requested for chat-completions both yield `unsupported` + `PROTOCOL_INCOMPATIBLE_REFUSED`; the same Zen mapping resolves under its own protocol |

Supporting tests in the same file: distinct-reasons + incomplete-mapping (`:226`), vocabulary distinctness (`:270`), protocol-vocabulary/schema-enum agreement (`:287`), all 65 shipped mappings explicit and resolvable (`:295`), provenance flow-through and honest absence (`:310`).

**Execution honesty:** demo (a) is fixture-level: it demonstrates the resolution and the exact identities a caller executes with (provider request id and harness session id), not a live provider call. The charter's "public synthetic end-to-end Pi smoke receipt" is a goal-level verification item requiring credential/budget authorization and is deferred past P1 (see §5).

## 4. Schema / template consistency proof

- `schemas/pi-openrouter-routing.schema.json` is regenerated from the hand-authored `piOpenRouterRoutingSchema` (`npm run generate` → `src/generate.ts`, `src/registry.ts:19-30`); `tests/parity.test.ts` `registerNoDriftTests` proves every committed schema file is byte-identical to its typed source and `registerSampleValidationTests` validates `samplePiOpenRouterRouting` (the shipped registry) against the schema.
- `templates/pi-openrouter-routing.json` validates against `piOpenRouterRoutingSchema` and is deep-equal to `PI_OPENROUTER_ROUTING` minus `$schema` (`tests/pi-openrouter.test.ts:33-44`); the provenance envelope reuses `schemas.ts`'s `declaredEvidence` builder (`schemas.ts:118`, used at `pi-openrouter.ts:884`) so the Evidence-envelope shape exists exactly once across the package schemas.

## 5. Reconciliation, deferrals, and non-changes

- **RCM-P2/P3 surfaces** (`types.ts` vocabularies, Evidence envelopes, refusal names; `validator.ts` named-residual gate): extended, never forked. The adapter refusal vocabulary is a new closed list beside `RESOLVER_REFUSALS`/`CONTRACT_REFUSALS` in the vocabulary home (`types.ts`) using the RCM-P2/P3 `as const` + derived-type mechanism; provenance reuses `DeclaredEvidence<T>` and the shared schema builder. `validator.ts`'s `NAMED_RESIDUALS` gate is policy-document scope (adapter results carry no policy residual), so it is intentionally unchanged.
- **Deferred — provenance freshness enforcement (D3 "stale catalogs beyond policy tolerance"):** P1 represents `valid_until` but enforces no freshness policy, because no tolerance value is ratified in canon. Enforcement belongs with the D8 recovery ladder (HRO-P4a) once a tolerance exists. Provenance absence remains honest unknown.
- **Deferred — resolver receipt enrichment:** `PiModelContract` (`src/route-receipt.ts`) and `piModelContractFor` (`src/pi-resolver.ts:834-849`) could carry `providerLocalId`/`protocol`; those files are outside this package's write set, and HRO-P3's decision/attempt events are the charter-designated reconciliation point.
- **Deferred — D10 event labels** (`mapping_missing`, `route_unavailable`, …): "proposed semantic labels to reconcile with existing schemas", charter D10; HRO-P3 owns the event surface. The typed names here (`MAPPING_*`/`PROTOCOL_*`) are the vocabulary entries that reconciliation will map onto.
- **Not work (hro-p0 §4.2):** the validator's frontier registry, deterministic selection order, receipts/correlation, and Jev bounds are untouched.

## 6. Verification

Commands (final run, `routing-policy/`): `npm test`, `npm run typecheck`, `npm run lint` — results in `hro-state-record-2026-09-27.md`. Scoped in-flight runs: `tests/pi-openrouter.test.ts` 13/0; `tests/parity.test.ts` + `tests/semantic-invariants.test.ts` + `tests/pi-resolver.test.ts` 84/0 (schema no-drift and the resolver's consumption of the adapter both intact).
