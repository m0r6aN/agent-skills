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
## Concrete shaping follow-up and additional source pins

2026-09-26: read-only inspection and official documentation research informed
the [concrete draft](../../specs/active/PMC-P2D-openrouter-terminal-transport.md)
and [composition notes](pmc-p2d-composition-notes.md). No source import, runtime
session, provider inference, authenticated request or real credential access.

The actual runtime can be constructed with explicit memory stores and a tokenless
native provider; non-openrouter credential reads must THROW before ambient auth,
not return undefined. Registration still performs a local refresh. The pinned
remote catalog and Radius implementations return before network for allowNetwork
false. Actual runtime tests must prove these source-derived reachability claims.
The SDK also generates structured preamble/cwd system sections; the closed
projection binds these explicitly rather than silently discarding them.

Useful retained candidate is public L5 google/gemini-3.8-flash at low, from the
already retained RCM v4 coverage/projection. It has no authenticated exact endpoint
tariff, all-components billing ceiling, or activation proof from this shaping.
Reasoning exclude does not remove reasoning cost. No initial production numeric
reserve bound is invented. Integer-inexpressible raw account cost leaves the
unchanged P2B reservation unknown; no rounding or exact-zero substitution.

Paths below are relative to the installed source root recorded above. Both
coding-agent and its nested pi-ai package report version 0.87.1. These hashes
are inspection pins, not a runtime import or live-provider compatibility claim.

| Source | SHA-256 |
|---|---|
| `package.json` | `627631b613ba4ca29eba8df793f5280fd20b19f01d73826e9ffda14c15def5dc` |
| `dist/core/model-config.js` | `68c447ff2ef729331713e044dae41b7416dbafbf96c83773308e2eb9c3f86107` |
| `dist/core/model-runtime.js` | `bae3c3feb7928c7702c3d98a3454660bee1647064dd449472fc6308c354fbc25` |
| `dist/core/runtime-credentials.js` | `2bf389ca2b04bd4dcee56433ca845cd8d9d96d0ccf84d2d0e9ad2a5e3957bda1` |
| `dist/core/remote-catalog-provider.js` | `789f462d9cd4a050267a2243d0a5a6fc34bdd0f948e40b7e6a8ac8cf1865c105` |
| `dist/core/provider-attribution.js` | `da98e466cbaacad5d2ccdf6d37b650580e81691f2ebe7f3ca3fb04c62fc83a73` |
| `dist/core/cache-warmer.js` | `9c4b000930d6d3c567073102f6b6a52660110bb0f79cf78dd72c4dd1ebc87fc0` |
| `dist/core/agent-session.js` | `5ebfae51db5a900596145159428e7cb57d195af9d54a28f41d4ac8ff1bfd5729` |
| `dist/core/agent-session.d.ts` | `ee0b9c2c2fefeef292c9da884b92c0fa5fce73f04bc834655720253d477f391d` |
| `dist/core/system-prompt.js` | `c6b7bc71a76a7901a10bc89f0452508cb3be4bc112ae5f883e4edadc938080aa` |
| `dist/core/extensions/loader.js` | `81106b07522aaf9197858c4679fecd7fbd23c346376d6e1f2cc3dd5294d543f4` |
| `dist/core/extensions/loader.d.ts` | `85ebf448c25774878ab3c1e8bdd5ee9b3a47431e7ae9054c7d4174c0939622b4` |
| `node_modules/@earendil-works/pi-ai/package.json` | `0422fc7227a158c3c843c1540edfff017d2103be33ee48b882e2ff9032a5f7d2` |
| `node_modules/@earendil-works/pi-ai/dist/models.js` | `75fa33149fb608bc4a7b7a0586c8ca8f0024465d580091b0c426c0baf3fbc80a` |
| `node_modules/@earendil-works/pi-ai/dist/models.d.ts` | `920a510c7a525d8188fb9abe4835713e19281a6c6948bbb6ab8814f076ac2cf1` |
| `node_modules/@earendil-works/pi-ai/dist/models-store.d.ts` | `775c2f2d3f6d4a39d947818b593e034d7f5e90bc1f3524730bf41aed89a8fa60` |
| `node_modules/@earendil-works/pi-ai/dist/types.d.ts` | `5e08c1db4740b95b7107d3c3540a6d0e414a82d9c75fab950150827c994e14a3` |
| `node_modules/@earendil-works/pi-ai/dist/auth/types.d.ts` | `6358ddc2437eb24a0662b7e59b1b9205896689821eb0966821fb2131a0ebc2bd` |
| `node_modules/@earendil-works/pi-ai/dist/auth/resolve.js` | `82ee45ecec319f59536759312a4de25313a8bb8cb7ce43db43d18edc10fef305` |
| `node_modules/@earendil-works/pi-ai/dist/providers/radius.js` | `c50694f71a7cac5d15630b3d8c2e7dee830eb756b4296f899899e7729889969e` |
| `node_modules/@earendil-works/pi-ai/dist/utils/event-stream.d.ts` | `5340224387a0b7c1413b4733e4b009faecc87f090b43658c470d53d0cf0e7c82` |
| `node_modules/@earendil-works/pi-ai/dist/utils/diagnostics.d.ts` | `ca69c6883f6a82f8e87dd87b0d8f4ef8b643cafda20eaaaf1dffb633f4fc6ce6` |

Additional final trace pins (pi-agent-core also 0.87.1):

| Source | SHA-256 |
|---|---|
| `dist/core/settings-manager.js` | `5368b155ec26d88374cec9e66b8e588b5041a0fb0047414f70b34e13892c4f48` |
| `node_modules/@earendil-works/pi-ai/dist/utils/text.js` | `95037d5b787075ffb951cdeaf3b93aeb89735d10b31b82e19d2921f505ac2b04` |
| `node_modules/@earendil-works/pi-agent-core/package.json` | `26f991ea26187d52978c303811f32032c9fcdaec197d4dcf08d793bedffdb87c` |
| `node_modules/@earendil-works/pi-agent-core/dist/agent.js` | `3a890712a7a02fc29754a2af61b758cba43eec97d289e446cd7e432ed0093085` |
| `node_modules/@earendil-works/pi-agent-core/dist/agent-loop.js` | `75da7290cd348c070328de834a810503d00fd5ff1ea2cc204786fb498bd046df` |

## Actual-source mismatch amendment — 2026-09-26

Read-only Step 0 at 343250e08eaee72581d7b925a7b9b6796f9e3536 verified all 35 table
rows against the installed inspection tree: no hash mismatches. No Pi module was
imported, dependency installed or runtime executed. These remain inspection pins;
the future isolated runtime checkout must reproduce them on its actual resolution.

Dispatch currently has no Pi dependencies. Package exports support portable root
imports of coding-agent constructors/types and pi-ai model/context/options/stream
types. The revised spec permits exact 0.87.1 coding-agent/pi-ai devDependencies
and normal package/lock changes in the future nine-file envelope. A direct
pi-agent-core dependency is also exact 0.87.1 only if its concrete direct import
is declared during builder Step 0 before installation. No donor/junction/global
mutation, absolute shipped imports, structural class casts or ignored type errors.
Normal package CI typecheck and actual Pi tests must use the isolated locked tree;
network/auth/subprocess guards precede dynamic import. Fresh install compatibility
has not been demonstrated by this docs-only task.

Actual C ownWire captures a new object, preserving boundProof. First trusted C
verify must bind that owned object after proof and all fields/claims validate;
subsequent verify/send/observation require its identity. Actual C maps only stop
to succeeded; known length is terminal-failed-settled. The revised finalizer returns
OUTPUT_TRUNCATED/error for that length outcome and never completed partial text.
Unknown account cost stays unknown; no C/B1/accounting rewrite is proposed.

Actual agent-session getSessionStats calls addUsageToTotals; usage-totals.js sums
numeric usage.cost.total without consulting diagnostics. The private compatibility
accumulator is not account spend. Retain diagnostics on the actual private session,
test that retention and prohibit session/stats/estimate export. External output
remains bounded completed stop text and C receipt, or the reviewed failure result.
No change to Pi internals or claim of diagnostic-aware internal aggregation.