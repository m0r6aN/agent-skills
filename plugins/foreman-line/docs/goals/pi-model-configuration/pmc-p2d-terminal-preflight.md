# P2D terminal source preflight

Coordinator research, 2026-09-26. Documentation-only input to future concrete P2D
shaping; not an implementation release or live-provider evidence. No inference,
credential read or authenticated API call was made.

## Current official documentation

[Provider routing](https://openrouter.ai/docs/guides/routing/provider-selection)
reports automatic provider load balancing/fallback by default. The request can
restrict provider choices, require supported parameters, disable fallbacks and
filter maximum prompt/completion/request pricing. Price caps are filters, not a
measurement of the eventual charge. The final wire must bind these controls and
its tariff source; a model-wide cheapest price alone is not an upstream tariff
promise. This is a shaping requirement/inference from that documented behavior,
not proof that every upstream provider supports every control.

[Parameters](https://openrouter.ai/docs/api_reference/parameters) documents both
max_tokens and max_completion_tokens. For reasoning models the output limit covers
reasoning plus visible output on most providers; that qualification prevents a
universal guarantee. P2D needs an exact supported provider/model profile and bound
for every billable component, not an SDK default or character-count estimate.

[Usage accounting](https://openrouter.ai/docs/cookbook/administration/usage-accounting)
now describes automatic usage in the final SSE message, including native-token
counts and account cost. The older usage/include flags are deprecated. Account
cost differs from upstream_inference_cost. A complete authenticated response may
supply settlement without an extra API request; missing/truncated usage remains
unknown. This page supersedes older examples for shaping, subject to actual live
compatibility evidence before activation.

## Concrete questions to close in P2D

- Establish the supported upstream identity and conservative exact tariff without
  widening PMC model/provider policy. Bind routing controls and no server fallback
  in the final owned body; reject unsupported price units/fees/components.
- Investigate whether an authenticated endpoint context/output ceiling yields a
  conservative billable-input/output bound for the supported plain-text profile.
  Do not claim it does without source evidence; a context fact or UTF-8 cap alone
  is not a tokenizer/billing proof. Refuse if no sound bound can be established.
- Parse cost from the raw bounded JSON numeric lexeme, not Number.toString(). P2B
  accepts integer micro-USD settlement, while provider decimal cost may be finer.
  Freeze an honest disposition for unrepresentable values; do not silently call
  a rounded amount exact actual charge. Preserve original source value in the
  appropriate receipt/evidence owner or leave ledger settlement unknown until a
  reviewed rounding/custody rule exists. No ledger change is authorized here.
- Restrict initial payload to the smallest supported text-only shape; deny tools,
  images, web/server tools, caches or other fees unless fully priced and bounded.
  Retain actual runtime/quality requirements for the eventual useful live route.
- Final body/header transformations precede controller verification. Pin actual
  Pi0.87.1 restricted-session source/types, exact thinking mapping, response event
  semantics and one terminal operation. No hidden compaction/warming/retry/send.

These questions complement R3 in the controller draft. No selected production
model, rate, budget, token bound or settlement precision is established by this
note. Public API documentation is mutable; future shaping must pin/recheck it.

## Restricted-session source preflight

Read-only inspection of installed Pi 0.87.1 on 2026-09-26 identified concrete
construction ports. These are source findings, not exercised conformance:

- `CreateAgentSessionOptions` accepts explicit model/modelRuntime, scopedModels,
  noTools/tools/customTools, resourceLoader, sessionManager and settingsManager.
  Omitted runtime/settings/session/loader use ambient defaults; all must be supplied.
- `SettingsManager.inMemory` and `SessionManager.inMemory` exist. Settings include
  compaction.enabled, retry.enabled and retry.provider.maxRetries, cacheWarming
  (off/streaming/idle), packages/extensions and analytics flags. A future restricted
  construction must set explicit values and verify actual behavior, not rely on defaults.
- A closed ResourceLoader can return empty resources; DefaultResourceLoader has
  disabling flags but still constructs discovery machinery. Prefer the smallest
  explicitly supplied loader and test that no discovery path is reached.
- sdk.js constructs CacheWarmer and invokes start on session requests. Merely
  supplying a custom stream is insufficient: verify off actually prevents work.
  sdk.js forwards transformed headers and onPayload/onResponse through its runtime.
- ModelRuntime.create supports supplied credentials/modelsStore, modelsPath:null,
  allowModelNetwork:false and refreshOnCreate:false. Its prepareRequest still
  resolves auth and applies transformHeaders before custom provider streamSimple.
  P2D must account for this exact path when guaranteeing that the actual provider
  credential is obtained only at the sole owned sender. A structural stand-in is
  not proof of actual Pi compatibility; no ambient auth file may be consulted.
- The extension provider contract requires calling onPayload before sending and
  honoring its replacement, then onResponse after receiving response metadata.
  Final body/header capture and verification must follow all such transformations.

Pinned files under the inspected source root (development evidence path only,
never a shipped absolute import):

| Source | SHA-256 |
|---|---|
| `dist/core/sdk.js` | `b49c2843197166bb84283edcb7702b91346d8fbaed2b0b8c70e5277dd78bcf5f` |
| `dist/core/sdk.d.ts` | `fbb34394c71e113b1f1fb5dd2e3d1da8d559580b339daace88826cd1a666cc4c` |
| `dist/core/model-runtime.js` | `bae3c3feb7928c7702c3d98a3454660bee1647064dd449472fc6308c354fbc25` |
| `dist/core/model-runtime.d.ts` | `1eab731760756334e38beb22bea56a4ca96db380e2e5b91a633365b5449fe328` |
| `dist/core/settings-manager.d.ts` | `0531dc8f094401117e237cc97d71b5524b4ff76bf958bda4f552268d76af7d44` |
| `dist/core/resource-loader.d.ts` | `f7c1dac7b3d661dff5fbfe51d1b50dff12b4c4329ae29a280ae713740b162493` |
| `dist/core/session-manager.d.ts` | `d27e910585a6f41f2d17381516519eefb680f671bd271dcbb09a26de2d4a50f0` |
| `dist/core/extensions/types.d.ts` | `14d00e645b453f4361440da6fcda86ed6cef9a8fc36d483a621a0250e0d4a396` |

## Endpoint and service-tier follow-up

The official [endpoint listing contract](https://openrouter.ai/docs/api/api-reference/endpoints/list-all-endpoints-for-a-model)
exposes endpoint-specific max_prompt_tokens, max_completion_tokens, context_length,
pricing, provider name, tag and supported parameters. These are more relevant than
model-wide cheapest pricing for a pinned route. Their presence alone is not proof
that every billed component is bounded by those fields; the shaping review must
justify the bound and authenticate exact retained endpoint evidence.

The official [service-tier contract](https://openrouter.ai/docs/guides/features/service-tiers)
says nondefault tiers require an explicit opt-in and billing follows the endpoint
actually used. Initial P2D should therefore exclude tier variants and tier-specific
slugs unless independently supported, and bind the chosen standard endpoint and
fallback controls. Do not infer a discounted rate from a requested tier or model
alias. This is a proposed constraint for review, not implemented behavior.