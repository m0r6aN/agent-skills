# HRO-P0 — Integration Contract: owner map, overlap table, and HRO-P1+ contract

**Goal:** `hybrid-routing-optimization` · **Package:** HRO-P0 (charter §"Ordered work packages") · **Date:** 2026-09-26
**Scope of this document:** mapping and contract only. Zero code/config changes ship with HRO-P0.
**Evidence convention:** every claim cites `path:line` (paths relative to `plugins/foreman-line/` unless prefixed `docs/goals/…` or marked repo-relative; a bare `charter.md:N` is always **this goal's** charter, and bare `:N` continues the immediately preceding file in the same cell/row). Where evidence does not exist in the tree, the claim is labeled **GAP** and never guessed. Runtime facts were observed on this workstation on 2026-09-26; no live network calls were made (charter D3 refresh rules and the PMC-P0 secret boundary forbid hot-path/live probing from shaping work — `docs/goals/pi-model-configuration/prac-p0-compat/compat-memo.md:1-6`, `docs/specs/active/PMC-P0-pi-capability-and-catalogue-baseline.md:87-90`).

---

## 1. Owner map

Each surface: who owns it today, the actual files (with line evidence), and its state (shipped / active-but-unmerged / planned / GAP).

### 1.1 Policy validator

| Item | Evidence |
|---|---|
| **Owner:** `routing-policy` package (the sole routing contract — `docs/goals/pi-model-configuration/prac-p0-compat/compat-memo.md:107-109` names "`routing-policy/` (the sole routing contract)") | — |
| Implementation | `routing-policy/src/validator.ts` — `KNOWN_FRONTIER_MODELS` (`:47-53`), `validatePolicy(doc: unknown): ValidationResult` (`:290-293`) |
| Policy content (sole routing authority) | `routing-policy/routing-policy.yaml`; RCM D1: "`plugins/foreman-line/routing-policy/routing-policy.yaml` remains the **sole** routing authority" (`docs/goals/routing-currency-and-merit/charter.md:181`) |
| Policy type surface | `routing-policy/src/types.ts` — `ClassName`/`CLASS_NAMES` (`:9-19`), `DataClassificationTier` (`:22-27`), `ClassEntry.allowlist`/`ceiling_usd` (`:38-41`), `TransportRequirements` (`:53-57`), `RoutingPolicy` (`:114-117`) |
| Schemas + registry | `routing-policy/src/schemas.ts` (`routingPolicySchema` `:107-110`), `routing-policy/src/registry.ts:19-23`, committed `routing-policy/schemas/*.schema.json` |
| Eligibility checks today | class → data-class eligible set → tier order walk with `ceiling_usd`, transport (`data_collection`, `zdr`), role pinning (`RoleAssignment`, `types.ts:78-81`), frontier anchoring (`validator.ts:47-53`); parity tests in `routing-policy/tests/parity.test.ts:1-5`, `semantic-invariants.test.ts:254-287` |
| Consume-as-is callers | `dispatch/src/routing-eval/index.ts:18-20` (`validatePolicy`, `CLASS_NAMES`, `DATA_CLASSIFICATION_TIERS` imported), `dispatch/src/index.ts:15` (re-export) |

### 1.2 Resolver / adapter

| Item | Evidence |
|---|---|
| **Deterministic selector ("resolver") — owner:** `dispatch` package, `dispatch/src/routing-eval/` (shipped W2-P3) | `evaluateRouting(input, options): RoutingResult` at `dispatch/src/routing-eval/index.ts:129-264`; policy path constant `POLICY_PLUGIN_PATH = 'routing-policy/routing-policy.yaml'` (`:116`) |
| Selection semantics today | Fixed order: validate class (`:160-166`), validate data tier (`:172-178`), intersect `eligible_models` (`:196-200`), walk `classEntry.allowlist` tiers in policy order and take the first eligible model (`:203-215`) — this is RCM D3/D4 ("Order remains the selection rule… classification → capability → tier order", `docs/goals/routing-currency-and-merit/charter.md:183-184`) implemented; `dispatch/README.md:83-91` confirms "synchronous deterministic primary-model selector… no price comparison… `resolvedModelId` (a bare OpenRouter `vendor/model` slug; the caller prepends its provider prefix)" — the caller-side provider prefix is today's only provider-local-ID distinction |
| Typed outcomes today | `RoutingError` codes `UNKNOWN_CLASS`, `UNKNOWN_DATA_CLASSIFICATION`, `NO_ELIGIBLE_MODEL`, `POLICY_INVALID`, `POLICY_UNREADABLE`, `RECEIPT_WRITE_FAILED`, `ROOT_NOT_ABSOLUTE` (`dispatch/src/routing-eval/index.ts:53-67`); unknown model ID currently surfaces as `NO_ELIGIBLE_MODEL` (`:217-222`) |
| **Model-mapping adapter contract — owner:** `routing-policy` package | `routing-policy/src/pi-openrouter.ts` — "Pi's OpenRouter execution-plane model registry… the envelope carries an opaque registry key, while this adapter describes what a host may use that key for" (`:5-8`) |
| Adapter contract shape | `PiOpenRouterModel` = `opencodeId?`, `capabilities`, `allowedLanes`, `prohibitedLanes`, `authority` (`:29-35`); `PiOpenRouterRouting` = `provider: 'openrouter'`, `baseUrl: 'https://openrouter.ai/api/v1'`, `enabledModels`, `models` (`:37-43`); schema consts pin `provider`/`baseUrl` literals (`:701-711`); `validatePiOpenRouterRouting` (`:735`) |
| Identity distinctions present today | registry key (e.g. `openai/gpt-6-astra`, key of `models`, `:541`) vs Pi-host identifier (`opencodeId: 'gpt-6-astra'`, `:546`) exist; **protocol/API per model, provider-local ID distinct from host ID, and catalog provenance/freshness fields do not exist** — `PiOpenRouterModel` has no such fields (`:29-35`) |
| Template lockstep | `templates/pi-openrouter-routing.json` must equal `PI_OPENROUTER_ROUTING` (`routing-policy/tests/pi-openrouter.test.ts:14,29-30`); `semantic-invariants.test.ts:254-259` pins the base URL and ID pattern |
| Resolver-per-canon (planned, not in tree) | PMC A3 "deterministic resolver ranking" owned by PMC-P2 (`docs/goals/pi-model-configuration/gate-1-amendment-01.md:110`); RCM-P4 "Resolver predicate evaluation at dispatch" and RCM-P4A "Actual dispatch integration and decision receipt contract" (`docs/goals/routing-currency-and-merit/charter.md:221-222`). **GAP:** no models-store reader/eligibility-projector code exists in this working tree (no package; `docs/goals/routing-currency-and-merit/exit-audit.md:22` records "No resolver or dispatch implementation exists"; `docs/goals/routing-currency-and-merit/loop-directive.md:128-132` records RCM-P1 work "not merged, pushed, or opened as a pull request" — its landing location is outside this tree) |
| Shadow-route execution path | `dispatch/src/routing-eval/shadow.ts` — `executeShadowRoute` (`:763`), `discoverAdapter` "Must perform fresh host-local discovery; this module never caches its result" (`:108-109`), `invokeAdapter` "Owns provider transport" (`:110-111`) |

### 1.3 Cache

| Item | Evidence |
|---|---|
| **Routing-decision cache: NONE exists — GAP (HRO-P2 builds it)** | Source scan of `dispatch/src`, `routing-policy/src`, `receipts/src`, `contracts/src`, `jev-decisions/src`, `foreman-config/src` finds no routing cache, TTL, or persistence layer; the only "cache" is a per-call MCP Jira cloud-id memo `cachedCloudId` (`dispatch/src/query/index.ts:348-376`) and shadow discovery is explicitly non-caching (`dispatch/src/routing-eval/shadow.ts:108`) |
| The "Pi cache" is the host catalog, not a decision cache | `models-store.json` — 465 KB, 13 provider keys, 608 model records, wholesale `checkedAt` (`docs/goals/routing-currency-and-merit/charter.md:78-80`); it "carries exactly these fields and no others" and has "no quality, benchmark, rank, or expertise signal of any kind" (`:80-91`) |
| Catalog snapshot discipline (the planned refresh artifact) | RCM D10: dispatch consumes "only a versioned, dated local catalog snapshot with a digest and freshness bound" (`docs/goals/routing-currency-and-merit/charter.md:190`); RCM-P0 landed `docs/goals/routing-currency-and-merit/rcm-p0-catalog-snapshot.v1.json` with per-source SHA-256 and acquisition timestamps (`:346-350,424-428`) |
| Cache-key/invalidation requirements already ratified in this goal | HRO charter D4 (`charter.md:58-64`) — cache keys cover policy/catalog/mapping versions and every eligibility input; corrupt records are misses; cache failure falls back to the same deterministic evaluator |

### 1.4 Jev integration

Three distinct Jev surfaces exist in canon. HRO-P5 must not conflate them (see §2 and §4).

| Surface | Owner | Evidence |
|---|---|---|
| **Jev alpha Decisions capability** (`openrouter-alpha-decisions`) — implemented | `jev-decisions` package, under goal `routing-currency-and-merit-jev-alpha` | `jev-decisions/src/runtime.ts:10-12` — `DECISIONS_ENDPOINT = "https://openrouter.ai/api/alpha/decisions"`, `CAPABILITY = "openrouter-alpha-decisions"`, `DECISION_SCHEMA_VERSION = "jev-decisions/v1"`; `types.ts:1-5` pins `ProviderIdentity` to `openrouter / typesafe/jev-1.13 / alpha-decisions`; typed `noul`/`choice`/`score` questions (`types.ts:24-47`, `validator.ts:24-27`), `validateRequest`/`validateResponse` (`validator.ts:88-116`), served identity recorded as provider-declared metadata (`types.ts:57-61`), budget/lease/cost caps (`runtime.ts:13-15,40-55,125-131`), `executeDecision` (`runtime.ts:368`) |
| Jev advisory consumption (recommendation semantics) | `jev-decisions/src/consumer.ts` — `createSupportTriageAdvisory` (`:75`), `SupportTriageAdvisory` typed `source: "jev"` (`:15-18`) | — |
| **Jev structured-decision candidate for routing** — canon only | `foreman-line-boundary-routing` D10: "The Pi/OpenRouter structured-decision candidate is exactly `typesafe/jev-1.13` at `https://openrouter.ai/api/v1`. Jev is enabled only for fast routing/classification recommendations" (`docs/goals/foreman-line-boundary-routing/charter.md:29`); encoded in `templates/pi-routing-directive.md:6-13` and `routing-policy/tests/semantic-invariants.test.ts:265-268` (Jev capabilities `routing`/`classification`/`structured-decision`, lanes `routing`/`classification` only) |
| **Zen systemone Jev** (this charter's D3 target) — design only | "`https://opencode.ai/zen/v1/systemone` with `state` and typed `questions`" (`charter.md:54`). **GAP:** no code in the plugin references `systemone` or a Zen Jev client (grep across `plugins/foreman-line/` finds it only in charter prose); the endpoint is not verified against the installed runtime in P0 |

### 1.5 Receipts / settlement

| Item | Evidence |
|---|---|
| **Receipt chain contract — owner:** `receipts` package | `ReceiptDocument` = `schemaVersion`, `kind`, `stage`, `claimRef`, `correlation`, `sequence`, `prevHash`, `timestamp`, `subjectKind`, `subject` (free-form JSON), `signature` (reserved, must be null this wave), `hash` (`receipts/src/types.ts:29-45`, `receipts/README.md:19-23`); hash domain is RFC 8785 JCS + SHA-256 (`receipts/README.md:36-41`); one chain per parcel keyed by `correlation.workflowId`, `runId` changes per attempt (`receipts/README.md:69-71`); `validateReceiptDocument` (`receipts/src/validator.ts:70`), `validateChain` (`:170`), `isSealed` (`:192`) |
| Provider-neutral worker envelopes (dispatched-task contracts) | `worker-envelopes/src/routing.ts:22-26` — `TaskEnvelope.routing` = `preferredModel?`, `fallbackModels?`, `diversityRequired` (required, D21), `escalationTarget?`; values are "opaque, non-empty registry-key strings, never a closed union… Concrete provider identifiers are intentionally absent" (`routing.ts:17-20`); `ResultEnvelope.modelRef` is the executed-identity field, same opacity rule (`worker-envelopes/src/result-envelope.ts:42-45,60`); D18: "routing is policy-driven… a routing receipt for every single dispatch" (`routing.ts:7-8`) |
| Correlation identity — owner: `contracts` package | `CorrelationContext` = `correlationId`, `sessionId`, `workflowId`, `runId`, optional `agentId` (`contracts/src/correlation.ts:37-43`); stages `A`–`F` (`contracts/src/envelope.ts:5-7`); `ReceiptRef` (`:17-20`); receipts import these (`receipts/src/schemas.ts:13`) |
| Routing decision receipt (today's decision event) | `evaluateRouting` writes `docs/receipts/<workflowId>/routing-decision.json` with `workflowId`, `routing_class`, `data_classification`, `resolvedTier`, `resolvedModelId`, `transportRequirements`, `timestamp`, `policyRef` (`dispatch/src/routing-eval/index.ts:225-252`); the Stage-C `DispatchOrder` carries `routingDecisionRef` (`contracts/src/stages/c-dispatch.ts:10-16`) |
| Stage-C receipt write | `executeDispatch` "writes the Stage-C ReceiptDocument" (`dispatch/src/approval-cli/index.ts:10-14`), `ExecuteResult.receiptLocator` (`:96-100`) |
| **Settlement — owner: EXTERNAL (governed model fleet, Keon initiative)** | "receipt, envelope, and settlement ownership" (`charter.md:25`); "`governed-model-fleet` owns receipt, envelope, and settlement contracts (P0/P1 landed). This goal [RCM] consumes those contracts… If both goals claim the same file, both stop until sequenced" (`docs/goals/routing-currency-and-merit/charter.md:56-58`); external repos named in `docs/specs/active/GMF-P0-governed-model-fleet-discovery-and-negative-contracts.md:193-196` |
| Cost provenance fields today | Jev runtime records `Usage` + `Cost { amount, currency }` (`jev-decisions/src/runtime.ts:125-131`); `worker-envelopes` carries `UsageMetadata.estimatedCostUsd` — explicitly an estimate (`worker-envelopes/src/usage.ts:13-28`) — and `Budget.maxCostUsd` (`worker-envelopes/src/budget.ts:21-23`); the routing-decision receipt carries no cost field (`dispatch/src/routing-eval/index.ts:225-235`). **GAP:** no billed-cost, price-source/version, or provider-cache-usage field exists in any in-tree receipt schema (HRO-P3/RCM-P8A territory); HRO D5's "estimates distinct from bills" has only the estimate half today |

### 1.6 Pi adapter (host execution plane)

| Item | Evidence |
|---|---|
| Designation | "Pi is the execution-plane router, not the Foreman coordinator" (`docs/goals/foreman-line-boundary-routing/charter.md:49`); D7/D8 bound what Pi auto-routing may decide (`:26-27`); directive text ships in `templates/pi-routing-directive.md:1-18` |
| Registry/adapter contract | `routing-policy/src/pi-openrouter.ts` (§1.2): registry keys → `opencodeId` host identifiers + capability/lane/authority bounds; `authority: 'recommend-only' | 'execution'` (`:27`) |
| Dispatch entry points | `prepareDispatch` (pure) / `executeDispatch` (worktree first, then receipt) (`dispatch/src/approval-cli/index.ts:242,427-432`); spec frontmatter `routing_class`, `data_classification`, `surfaces` (`:67-71`) |
| Actual Pi API surface (installed runtime evidence) | `@earendil-works/pi-coding-agent` **0.87.1**, probe-pinned: `setModel(model: Model<any>): Promise<boolean>` at `dist/core/extensions/types.d.ts:1081`, `setThinkingLevel` at `:1088`, `setActiveTools` at `:1074`; RPC variant `setModel(provider, modelId)` at `dist/modes/rpc/rpc-client.d.ts:101`; `beforeLLMTurn` / `ctx.session.updateModel` / `updateThinkingLevel` **absent from the enumerated surface** (`docs/goals/pi-model-configuration/prac-p0-compat/compat-memo.md:60-96`); "Every real API named present above is **present and still not an authorization to route**" (`:107-111`) |
| Version drift warning | 0.86.1 → 0.87.1 drift observed during PRAC shaping; "recheck the installed runtime before relying on an API" (`docs/goals/pi-model-configuration/prac-p0-compat/compat-memo.md:97-103`, `charter.md:24`) |

### 1.7 Pi configuration

| Item | Evidence |
|---|---|
| **Owner:** `pi-model-configuration` goal (workflow) — HRO "Reuse[s] the configuration workflow owned by `pi-model-configuration`" | `charter.md:101`; PMC-P2 owns "resolver, Pi configuration, launch boundary, generated route artifacts" (`docs/goals/pi-model-configuration/gate-1-amendment-01.md:110`) |
| Host files (owner-held, not repository artifacts) | `pi-agent/models-store.json` (H02) and `pi-agent/settings.json` (H03) — safe labels, "not paths the worker opened" (`docs/goals/routing-currency-and-merit/rcm-p0-environment-map.md:73-75`); `~/.pi/agent/models.json` is the charter D9 name for the local declaration file (`charter.md:99`) |
| Write constraints | HRO D9: no hot-path appends, no assumed `opencode-zen` key or `{id, type: "chat"}` validity, apply requires "existing scoped configuration-write authorization; this charter does not grant it" (`charter.md:99-103`); RCM D1: "no Foreman component writes routing authority into Pi's shared host file" (`docs/goals/routing-currency-and-merit/charter.md:181`); RCM-P7 emits a one-way projection artifact/patch only (`:230`) |
| `foreman-config` is NOT Pi config | `foreman-config` owns the `foreman/config.yaml` declaration contract (identity/stack/capabilities/policy) (`foreman-config/README.md:1-30`); boundary-routing D3 assigns it "the configuration document shape, validation, and capability vocabulary" (`docs/goals/foreman-line-boundary-routing/charter.md:22`) |
| **GAP** | The exact Pi contract for `models.json` entries (provider key names, `{id, type}` validity, live-session reload) is unestablished — D9 explicitly defers it to P0/P4b work ("establish these contracts from the installed runtime in P0", `charter.md:99`); the PRAC probe covers the extension/hook surface only, not `models.json` (`compat-memo.md:8-16`) |

---

## 2. Overlap table vs the four sibling goals

What each goal owns on the contested surfaces `routing-policy/` and `dispatch/` (plus the receipts/Jev/config surfaces HRO touches), and where HRO must sequence behind or beside it.

| Goal | Owns / governs on `routing-policy/` | Owns / governs on `dispatch/` | Overlap with HRO | Sequencing rule |
|---|---|---|---|---|
| **`pi-model-configuration`** | PMC-P1: "schemas, policy contract, frontier registry change (incl. Opus 5.5), migration inventory, fixtures" — **must not touch** resolver, Pi config, templates (`docs/goals/pi-model-configuration/gate-1-amendment-01.md:109`) | PMC-P2: "resolver, Pi configuration, launch boundary, generated route artifacts" — **must not touch** schemas/policy contract (`docs/goals/pi-model-configuration/gate-1-amendment-01.md:110`); A3 defines deterministic resolver ranking (`:53-56`, ratified `:130`); A1: "a dispatched Pi session is authorized only by an **approved route receipt** emitted by the resolver" (`:104-107`) | HRO-P1 extends the adapter contract that PMC-P1 treats as "policy contract"; HRO-P4/P4a implement selection/recovery where PMC-P2 owns the resolver; HRO-P4b must run through PMC's config workflow | HRO-P1 is additive to `pi-openrouter.ts` and must be reviewed as a PMC-P1 contract change (or land after it); HRO-P4a recovery ladder is "inside the existing resolver" → coordinate with PMC-P2 (A3). Dual representation with deprecation window is already ratified for D7/A5 (`docs/goals/pi-model-configuration/gate-1-amendment-01.md:132`) |
| **`routing-currency-and-merit`** | D1: `routing-policy.yaml` is the **sole** routing authority (`docs/goals/routing-currency-and-merit/charter.md:181`); RCM-P3: schema v0.4 capability predicates + expertise bindings, validator invariants extended (`:215`); D7: new fields `expertise:`, `inputs:`, `min_context:`, `thinking_level:` follow SPEC-CONVENTION §4.6 additive pattern (`:187`) | RCM-P4: "Resolver predicate evaluation at dispatch, in D4's fixed order" with negative controls (`:221`); RCM-P4A: "Actual dispatch integration and decision receipt contract… reconciles the executed model identity with the selection/replay receipt" (`:222`); RCM-P5 in-process preflight (`:223`) | HRO-P2 (cache in the evaluator) and HRO-P3 (decision events) sit on exactly the RCM-P4/P4A surfaces; HRO-P1 mapping fields touch the RCM-P3 schema surface | RCM D3 forbids dispatch-time sort/price-comparison; HRO's cached selection must be provably the same deterministic result (cold/warm parity) or it is a D3 change requiring amendment. RCM exit criteria 3–5 require the "real dispatch integration path" (`docs/goals/routing-currency-and-merit/charter.md:251-255`) → one serialization owner for `dispatch/` changes across RCM-P4A and HRO-P2/P3; stop-and-report if both are dispatched concurrently (RCM charter:56-58 pattern) |
| **`routing-currency-and-merit-jev-alpha`** | J1: "No shared routing file or parent-goal document may be edited without a separately ratified integration parcel and explicit serialization owner" (`docs/goals/routing-currency-and-merit-jev-alpha/charter.md:241`) | — (its surface is `jev-decisions/` + `docs/specs/active/JEV-P0-alpha-decisions-contract-and-evidence-boundary.md`) | HRO-P5's "bounded Jev recommendations" overlap the JEV alpha capability; the audit resolved this by sequencing ("HRO-P5 ↔ JEV overlap resolved by sequencing", `docs/goals/goal-status-report-2026-09-26.md:71`) | J2 approves only `POST https://openrouter.ai/api/alpha/decisions`; `/api/v1/models`, chat/completions and the OpenRouter registry/template "remain separate and are not silently repointed" (`docs/goals/routing-currency-and-merit-jev-alpha/charter.md:242`). HRO-P5 must consume the `openrouter-alpha-decisions` capability as-is or obtain a separate ratified integration parcel; J3 forbids substituting served IDs (`typesafe/jev-1.13-20260917`) into D13 identity (`docs/goals/routing-currency-and-merit-jev-alpha/charter.md:243`) |
| **`foreman-line-boundary-routing`** | D4: role contracts/envelopes provider-neutral; "Concrete models are opaque registry keys" (`docs/goals/foreman-line-boundary-routing/charter.md:23`); D7–D10 are the standing routing authority (`:26-29`) | D5: mutation-scope double-check around dispatch (`:24`); D7 requires every selected model + route explanation in dispatch/result evidence (`:26`) | HRO's D1 sequence and D8 recovery must preserve D7 Foreman authority and D8's never-delegated roles; D10 pins the Jev candidate identity | No amendment needed to D7/D8 (HRO D1 restates them). D10's Jev identity vs HRO D3's Zen systemone endpoint is an unresolved tension → see §4.1 |

Cross-goal external owner: **governed-model-fleet** (Keon repos) owns receipt/envelope/settlement contracts (`charter.md:25`; `docs/goals/routing-currency-and-merit/charter.md:56-58`); `docs/goals/foreman-line-boundary-routing/hawf-extract-worker-lane-contracts.md:37-39` routes "observability, cost reporting, rollback/upgrade operations" to "`receipts/`/settlement + read-only ops console (FOC)". HRO-P3 consumes these contracts and does not amend them.

---

## 3. Integration contract for HRO-P1+

**Governing rule (charter D2):** *extend the existing adapter contract, never a parallel resolver.* Concretely: the adapter contract is `routing-policy/src/pi-openrouter.ts`; the selection entry point is `evaluateRouting` (`dispatch/src/routing-eval/index.ts:129`) and the canon-planned resolver is PMC-P2's (A3). No second model-selection module, no shadow mapping table, no standalone router (charter: "Do not recreate the pasted standalone router", `charter.md:168`).

### 3.1 Where each HRO package may add what

| Package | May add | Where | Must not |
|---|---|---|---|
| **HRO-P1** (adapter mappings/protocols + typed rejection) | Additive, optional mapping/provenance fields on `PiOpenRouterModel` (e.g. explicit provider-local ID, API protocol, catalog provenance: source/fetch time/validity/content hash per D3 `charter.md:52`); a typed unavailable/unsupported result for unknown IDs (D2: "A missing or incompatible mapping produces a typed unavailable/unsupported result", `charter.md:48`); rejection tests | `routing-policy/src/pi-openrouter.ts`, `routing-policy/schemas/`, `routing-policy/tests/`, and — in lockstep — `templates/pi-openrouter-routing.json` (parity test `routing-policy/tests/pi-openrouter.test.ts:14,29-30`) | Change `PI_OPENROUTER_ROUTING` behavior or the pinned `baseUrl` const without an explicit versioned migration (D2: "Preserve current OpenRouter behavior during an additive migration", `charter.md:48`); infer identity via prefix-stripping/regex (`charter.md:48`) |
| **HRO-P2** (deterministic cache) | An exact-match memo of the deterministic selection inside the existing evaluator, with D4 keying/TTL/invalidation/read-validation; on any cache failure, re-run the same evaluator (`charter.md:60-62`) | `dispatch/src/routing-eval/` (the evaluator HRO-P2 names: "Add deterministic cache reuse to the existing evaluator", `charter.md:119`); storage per D6: Node-compatible, no Bun, new dependency needs concrete justification (`:76`) | Alter selection order (RCM D3/D4, `docs/goals/routing-currency-and-merit/charter.md:183-184`); trust cached authorization for dynamic gates (budget/availability/independence revalidated, `charter.md:60`); become a weaker fallback path (`:62`) |
| **HRO-P3** (events + baseline) | Decision/cache-hit/recommendation/fallback/attempt events correlated to the existing receipt chain; baseline report with cost provenance and unknowns (D5, `charter.md:68-72`) | Consume `receipts` chain + `contracts` `CorrelationContext` as-is; enrich via the RCM-P8A receipt/replay contract if landed | Invent a parallel event format (D10: "not an instruction to invent a parallel event format", `charter.md:107`); amend `governed-model-fleet` settlement contracts (consume only, `docs/goals/routing-currency-and-merit/charter.md:56-58`); label estimates as bills (`charter.md:70`) |
| **HRO-P4 / P4a** (Pi entry + bounded recovery) | The D8 recovery ladder **inside the existing resolver**: exact mapping → one coalesced metadata refresh per episode with negative-cache TTL → declared-lane fallback walk with finite cap → typed `route_unavailable` + per-parcel hold (`charter.md:88-94`) | `dispatch/src/routing-eval/` / the PMC-P2 resolver seam; launch boundary is PMC-P2's (A1, `gate-1-amendment-01.md:104-107`) | Guess identity for unknown models (`charter.md:85-87`); substitute undeclared fallbacks (`:92`); crash the batch or mark blocked work complete (`:93`) |
| **HRO-P4b** (config repair) | Evidence-backed **proposal** documents with catalog evidence + mapping provenance (`charter.md:101`); apply only via "any already-authorized apply path with the existing configuration owner" (`:123`) | The `pi-model-configuration` workflow (PMC-P2 owns Pi configuration, `gate-1-amendment-01.md:110`) | Write `models.json`/`settings.json` from the routing hot path (`charter.md:99`); expand allowlists/tiers as a side effect (`:101`); this charter "does not grant" config-write authorization (`:101`) |
| **HRO-P4c** (diagnostics) | D10 structured reason/outcome fields reconciled with existing schemas; sanitized, deduplicated stderr diagnostics; stdout stays valid JSON (`charter.md:105-113`) | Existing receipt/event path; CLI conventions of `routing-policy/src/cli.ts`, `receipts/src/cli.ts` | A background alert service (`charter.md:113`); notification side effects on routing outcomes (`:112`) |
| **HRO-P5** (optional Jev) | A disabled-by-default bounded recommendation step feeding the D1 sequence's "optional Jev recommendation" slot (`charter.md:38,80-84`) | Consume `jev-decisions` capability surfaces as-is; sequence with the JEV goal (audit: `docs/goals/goal-status-report-2026-09-26.md:71`) | Repoint JEV J2's endpoint; parse systemone as chat completion (`charter.md:54`); let a recommendation authorize dispatch (`:64`, `charter.md:42`) |

### 3.2 Interfaces to consume unchanged

- `validatePolicy` + `CLASS_NAMES`/`DATA_CLASSIFICATION_TIERS` (`routing-policy/src/validator.ts:290`, `types.ts:15-27`) — policy validation is not re-implemented.
- `evaluateRouting` receipt contract (`docs/receipts/<workflowId>/routing-decision.json`, `dispatch/src/routing-eval/index.ts:225-252`) — extended additively only, with the RCM-P4A receipt/replay contract as the reconciliation point (`docs/goals/routing-currency-and-merit/charter.md:222`).
- `receipts` chain primitives (`validateChain`, `isSealed`, `ReceiptDocument`) and `contracts` `CorrelationContext`/`ReceiptRef` (`receipts/src/index.ts:2-13`, `contracts/src/correlation.ts:37-43`) — correlation IDs are threaded, never forked (`receipts/README.md:69-71`).
- `jev-decisions` request/response envelopes and reason codes (`jev-decisions/src/types.ts:49-114`) — typed validation already enforces "typed `questions`" and identity pinning.
- `worker-envelopes` task/result envelopes: `TaskEnvelope.routing` opaque registry keys (`worker-envelopes/src/routing.ts:22-26`) and `ResultEnvelope.modelRef` executed identity (`worker-envelopes/src/result-envelope.ts:60`) — HRO's requested-vs-selected-vs-executed identities (D5 "actual provider/model", `charter.md:70`; D10 "requested and selected provider/model", `:109`) map onto these fields plus the routing-decision receipt; RCM-P4A's "reconciles the executed model identity with the selection/replay receipt" is the same seam (`docs/goals/routing-currency-and-merit/charter.md:222`).
- Boundary-routing D7/D8 role authority (`docs/goals/foreman-line-boundary-routing/charter.md:26-27`) — unchanged by every HRO package.

### 3.3 Serialization points (contested surfaces)

`routing-policy/`, `dispatch/`, `contracts/`, `templates/` are contested across goals. Per-slice coordination owners: PMC-P1 (policy contract/schemas), PMC-P2 (resolver/Pi config), RCM-P3 (policy schema v0.4) and RCM-P4/P4A (dispatch integration), JEV (its own capability files; J1 forbids shared-file edits without a ratified integration parcel, `docs/goals/routing-currency-and-merit-jev-alpha/charter.md:241`). Any HRO slice needing a surface it does not own stops that sub-step and reports (per goal constraints).

---

## 4. Required canon amendments vs existing functionality needing NO change

### 4.1 Required scoped amendments (exact decision IDs)

| # | Decision in force | Conflict with HRO | Proposed scoped change |
|---|---|---|---|
| A | **boundary-routing D10** (`docs/goals/foreman-line-boundary-routing/charter.md:29`): the structured-decision candidate is exactly `typesafe/jev-1.13` at `https://openrouter.ai/api/v1` | **HRO D3** (`charter.md:54`) names Zen `https://opencode.ai/zen/v1/systemone` as the Jev protocol; **JEV J2** (`docs/goals/routing-currency-and-merit-jev-alpha/charter.md:242`) approves only `POST …/api/alpha/decisions` and forbids repointing | Reconcile D10 and J1/J2 by scoped amendment: state which endpoint family HRO-P5's recommendation step uses (the JEV-owned `openrouter-alpha-decisions` capability is the only approved, implemented one), and demote the `systemone` line to a candidate pending runtime verification. Do not run two Jev surfaces. **Open — needs a coordinator/owner ruling before HRO-P5 shaping.** |
| B | **PMC Amendment 01 A7** (`docs/goals/pi-model-configuration/gate-1-amendment-01.md:107-111`): PMC-P1 owns "schemas, policy contract"; PMC-P2 owns "resolver, Pi configuration" — and the PMC-side file map puts `routing-policy/src/pi-openrouter.ts` ("Pi/OpenRouter routing controls") on **P2**, while `routing-policy.yaml`/`validator.ts`/schemas/fixtures are P1 (`docs/goals/pi-model-configuration/rcm-sequencing-request-DRAFT.md:36-40`) | HRO-P1 extends `routing-policy/src/pi-openrouter.ts` (the P1/P2 boundary file) and HRO-P4a extends the resolver | Scoped A7 amendment (or recorded coordination) naming HRO-P1 as the additive author of adapter mapping/protocol fields with PMC-P1 schema review **and** PMC-P2 adapter review, and HRO-P4a as an extension inside the PMC-P2 resolver under A3's ranking rules. Until ruled, HRO-P1/P4a treat those files as read-plus-coordinate, not free-fire. (The sequencing draft is explicitly unsent — `rcm-sequencing-request-DRAFT.md:110` — so the split above is evidence of intent, not a ratified boundary: **GAP** on final ownership.) |
| C | **RCM D3** (`docs/goals/routing-currency-and-merit/charter.md:183`): "Order remains the selection rule. No dispatch-time price comparison, no dispatch-time sort" | HRO-P2's exact cache short-circuits the tier walk on a hit | Narrow scoped amendment to RCM D3 (or a binding clarification): an exact cache hit whose key includes policy/catalog/mapping versions and whose value is the deterministic evaluator's own output is a memo of the same order rule, permitted only with HRO-P2's cold/warm parity proof (charter acceptance: `charter.md:132`). Without this ruling, cache-returned selection is arguably a D3 reordering and must not ship. |
| D | **RCM D1 + plan-review PR-06** (`docs/goals/routing-currency-and-merit/charter.md:181`, `docs/goals/routing-currency-and-merit/plan-review-findings.md:25`): no Foreman component writes routing authority into Pi's shared host file; the two-writer race on `settings.json` was a Gate 1 reopen item | HRO-P4b's "already-authorized apply path" may write Pi configuration | Reconciliation required between the RCM Gate 1 reopen outcome (see `docs/goals/routing-currency-and-merit/gate-1-reopen-proposal.md:55-58` — projection "never writes Pi's shared `settings.json`") and PMC-P2's "Pi configuration" ownership. **GAP: no ratified reconciliation exists in the tree.** HRO-P4b must land only an explicit, evidence-backed proposal until one does. |
| E | **HRO D2** ("extend the existing adapter contract", `charter.md:44-48`) vs **RCM-P3** (policy schema v0.4, `docs/goals/routing-currency-and-merit/charter.md:215`) | Both change `routing-policy` schema/validation surfaces | No text conflict, but a serialization conflict: RCM-P3's additive fields (`expertise:`, `inputs:`, `min_context:`, `thinking_level:` per RCM D7, `:187`) and HRO-P1's mapping/protocol fields must land through the same SPEC-CONVENTION §4.6 additive pattern in one sequenced stream. Treat as a sequencing requirement, amendment only if both are dispatched at once. |

None of these amendments is applied by HRO-P0; each names the exact decision so a scoped amendment, not a silent replacement, is what follows (charter: "Where this draft conflicts with ratified canon, identify the exact decision and propose a scoped amendment", `charter.md:28`).

**Gate decisions recorded in this package:** none. HRO-P0 raises questions A–E for the owner/coordinator; no gate decision is pre-stated in the HRO-P0 slice, so none is recorded here.

### 4.2 Existing functionality that needs NO change (explicitly not work)

| Item | Evidence | Why no change |
|---|---|---|
| `openai/gpt-6-astra` in the frontier registry | `routing-policy/src/validator.ts:50` (`KNOWN_FRONTIER_MODELS`, comment "SUPERCHARGE-P1 (verified 2026-09-14)") | Charter: "The current `routing-policy/src/validator.ts` already includes `openai/gpt-6-astra`. Do not count re-adding it as work or replace the validator wholesale" (`charter.md:30`); policy lists also carry it (`routing-policy/routing-policy.yaml:85,108,131,170`), pinned by test (`routing-policy/tests/semantic-invariants.test.ts:157-161`) |
| Deterministic selection order (classification → tier order) | `dispatch/src/routing-eval/index.ts:203-215` | Already implements RCM D3/D4; HRO D1's sequence builds around it |
| Policy eligibility validation | `routing-policy/src/validator.ts:290` + schema set | D1 reuses it; "A cache failure may fall back to the same deterministic policy evaluator" (`charter.md:62`) |
| Receipt chain + correlation identity | `receipts/` (`receipts/README.md:69-71`), `contracts/src/correlation.ts:37-43` | D5: "Reuse existing receipt and settlement mechanisms" (`charter.md:68`) |
| Jev typed envelope validation + identity pinning | `jev-decisions/src/validator.ts:88-116`, `types.ts:1-5` | Already enforces typed questions/answers and requested-vs-served identity separation (D2/D10 semantics) |
| Jev recommend-only/lane bounds | `routing-policy/tests/semantic-invariants.test.ts:265-268`; `templates/pi-routing-directive.md:6-13` | D1: "Jev remains recommendation-only" is already encoded |
| Structured-decision authority enforcement | `routing-policy/src/pi-openrouter.ts:774-796` — any `structured-decision` model must be `authority: 'recommend-only'`, lanes `routing`/`classification` only, prohibited lanes enforced | The D2 identity/authority separation already has its cross-field validator; HRO-P1 extends around it |
| Registry-key opacity of envelopes | `worker-envelopes/src/routing.ts:17-20`, `result-envelope.ts:42-45` — "a closed union of concrete model IDs would duplicate the registry `routing-policy/` owns" | Exactly the D2 rule that model identity stays an opaque registry key; no change needed |
| Pi routing directive template | `templates/pi-routing-directive.md:1-18` | Already restates boundary-routing D7/D8/D10 for builders |
| Transport/privacy handoff | `RoutingResult.transportRequirements` (`dispatch/src/routing-eval/index.ts:86-95`) | Already separates model choice from host obligations ("this package selects the model and hands the obligation on") |

---

## 5. Runtime / catalog evidence (pinned; no live calls)

### 5.1 Toolchain

| Fact | Value | Source |
|---|---|---|
| Node | **v24.7.0** | `node --version`, observed 2026-09-26; matches the PRAC probe expectation (`docs/goals/pi-model-configuration/prac-p0-compat/compat-memo.md:119`) |
| npm | **11.6.2** | `npm --version`, observed 2026-09-26 |
| Engines `node >=22` | `routing-policy`, `contracts`, `receipts`, `foreman-config`, `role-authority`, `worker-envelopes`, `permission-profiles`, `contract-readers` | e.g. `routing-policy/package.json:7-8` (`"node": ">=22"`); same field per package |
| Engines `node >=24.11.1` | `dispatch`, `approval`, `integration`, `mutation-scope-guard`, `projection` | `dispatch/package.json:7-8`; `approval/package.json:7-8`; `integration/package.json:7-8`; `mutation-scope-guard/package.json:7-8`; `projection/package.json:7-8` |
| Engines: none | `jev-decisions` | `jev-decisions/package.json` — no `engines` field |
| **Tension (recorded, not resolved)** | Installed Node v24.7.0 does **not** satisfy `>=24.11.1`; HRO-P2/P4 work inside `dispatch/` inherits that floor (charter D6: "Stay compatible with the owning packages' Node runtime", `charter.md:76`). **GAP:** which runtime the HRO build must pin is an owner decision; npm treats `engines` as advisory absent `engine-strict` | — |
| Per-package validation commands | `npm test` (`tsx --test tests/*.test.ts`), `npm run typecheck` (`tsc --noEmit`), `npm run lint` (`biome check .`); `routing-policy`/`receipts`/`contracts`/`foreman-config` additionally `generate` | `dispatch/package.json` scripts; `routing-policy/package.json` scripts (`typecheck, generate, test, lint`) |

### 5.2 Pi host runtime (probe-backed)

| Fact | Evidence |
|---|---|
| Pi package + version pin | `@earendil-works/pi-coding-agent` **0.87.1**, asserted by probe (fails closed on mismatch) (`docs/goals/pi-model-configuration/prac-p0-compat/compat-memo.md:4,35-42`) |
| Session model change API | `setModel(model: Model<any>): Promise<boolean>` — `dist/core/extensions/types.d.ts:1081`; thinking: `setThinkingLevel` `:1088`; tools: `setActiveTools` `:1074`; RPC `setModel(provider, modelId)` `dist/modes/rpc/rpc-client.d.ts:101` (`compat-memo.md:66-84`) |
| Rejected proposal APIs | `beforeLLMTurn`, `ctx.session.updateModel`, `ctx.session.updateThinkingLevel` all absent-from-enumerated-surface (`compat-memo.md:66-68`) |
| Evidence hashes | Every inspected 0.87.1 file SHA-256 pinned in `docs/goals/pi-model-configuration/prac-p0-compat/evidence/pi-0.87.1/snapshot.json` (e.g. `dist\core\models-store.d.ts` `:874-876`); directive excerpt SHA-256 `0975965d…30cf36` (`compat-memo.md:22-24`) |
| Non-claim discipline | "absent" = absent from the enumerated hashed surface, never "does not exist at runtime"; no API presence is an authorization to route (`compat-memo.md:133-138`, `:107-111`) |

### 5.3 Catalog / configuration facts (as found in repo evidence)

| Fact | Evidence |
|---|---|
| OpenRouter catalog discovery endpoint | `https://openrouter.ai/api/v1/models` (metadata only; never a chooser) — charter D3 (`charter.md:52`); observed 2026-09-20T17:22:45Z as corroboration (`docs/goals/routing-currency-and-merit/rcm-p0-environment-map.md:229-233`) |
| Contract-pinned execution base URL | `https://openrouter.ai/api/v1` const in `routing-policy/src/pi-openrouter.ts:40,115,708`; enforced by test (`routing-policy/tests/semantic-invariants.test.ts:255`) |
| Zen endpoint families in the host store | `opencode` records at `https://opencode.ai/zen/v1` and `/zen`; `opencode-go` at `/zen/go/v1` and `/zen/go`; OpenRouter records at `/api/v1` and `/api` (`docs/goals/routing-currency-and-merit/rcm-p0-catalog-snapshot.v1.json:831-896`) |
| Provider/namespace mismatch | Pi settings map `opencode` → `https://opencode.ai/zen/go/v1` while the store defines `opencode` at `zen/v1` — "The configured pairing matches neither" (`docs/goals/routing-currency-and-merit/charter.md:113`; reproduced `docs/goals/routing-currency-and-merit/rcm-p0-drift-report.md:27`) |
| Catalog store shape | `models-store.json`: 13 provider keys, 608 model records, wholesale `checkedAt`; fields `id, provider, baseUrl, api, input, reasoning, contextWindow, maxTokens, cost, thinkingLevelMap` (`docs/goals/routing-currency-and-merit/charter.md:78-80`; `rcm-p0-verification.md:306-310`) |
| Policy ID health | 15/15 policy model IDs present in the store, but only 11/15 match the configured `…/api/v1`; 4 (`claude-opus-5`, `claude-fable-5.1`, `claude-sonnet-5`, `claude-haiku-4.5`) sit at `…/api` and refuse (`docs/goals/routing-currency-and-merit/rcm-p0-drift-report.md:28-30,44-58`) |
| `enabledModels` drift | 5 entries, 4/5 unresolvable (`MISSING_MODEL_REFUSED`); only `openrouter:openai/gpt-4o-mini` matches (`rcm-p0-drift-report.md:68-76`) |
| Jev tuple | `openrouter / typesafe/jev-1.13 / https://openrouter.ai/api/v1` — enabled at `enabledModels[4]`, zero store matches, `MISSING_MODEL_REFUSED` (`rcm-p0-drift-report.md:130-134`) |
| Alpha Decisions live observation | one POST to `https://openrouter.ai/api/alpha/decisions`, HTTP 200, served model `typesafe/jev-1.13-20260917`, provider-reported cost `0.000017934` (`docs/goals/routing-currency-and-merit/rcm-p0-review-triage.md:113-117`) — servability only, "not proof of service nonexistence" and not routing approval (`rcm-p0-verification.md:880-884`) |
| Jev alpha contract constant | `CAPABILITY_ENDPOINT = "https://openrouter.ai/api/alpha/decisions"`, `POST` (`docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md:25-27`) |
| Catalog refresh code in the plugin | **GAP** — no catalog-fetch/refresh implementation exists in plugin sources; the only in-tree catalog artifacts are the RCM-P0 snapshot/export evidence files. HRO-D3's "refresh outside the dispatch hot path" work is greenfield under RCM D10's snapshot discipline (`docs/goals/routing-currency-and-merit/charter.md:190`) |
| `~/.pi/agent/models.json` contract | **GAP** — D9's questions (provider key `opencode-zen`?, `{id, type: "chat"}` validity, live reload) are explicitly unestablished (`charter.md:99`); the PRAC probe did not inspect it (`compat-memo.md:8-16`) |
| Zen `systemone` endpoint | **GAP** — charter design text only (`charter.md:54`); no code/config evidence in-tree; not verified against the installed runtime |

---

*HRO-P0 is complete when this map, overlap table, contract, amendment list, and evidence pin exist. All implementation is deferred to HRO-P1+ under the sequencing in §3 and the amendments in §4.*
