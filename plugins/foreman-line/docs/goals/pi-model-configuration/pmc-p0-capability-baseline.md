# PMC-P0 — Capability Baseline

**Parcel:** PMC-P0 (Pi capability and catalogue baseline)
**Spec:** `plugins/foreman-line/docs/specs/active/PMC-P0-pi-capability-and-catalogue-baseline.md` (SHA-256 `133a7690b865d460586e77fb3ee5440116513272db299eceb52b09f8f81b72eb`, `status: active`, re-promoted under Amendment 04)
**Evidence state:** `static-conformance` **only** (A6). Freshness **not accepted** (`freshnessBound: "not-accepted-by-coordinator"`, `liveEvidence: "not-yet-accepted"`). The export is **never** an availability oracle and **never** an absence proof. Every live-availability, reachability, and quality claim is **held** to A6.
**Status of this artifact:** builder evidence, unreviewed. Not installed policy, not a live allowlist, not permission to dispatch or enable.

Raw commands, outputs, and exit codes for every fact below are in
[`pmc-p0-verification.md`](pmc-p0-verification.md) (section references given as `V§n`).

## 1. Sources and acquisition digests

All facts are read only from the credential-free host-owner export at
`plugins/foreman-line/docs/goals/routing-currency-and-merit/host-owner-export/`,
each file re-hashed locally before use (V§2). No host file, credential, header,
or environment value was read; Pi was not launched; no network call was made.

| File | Pinned SHA-256 (spec) | Recomputed SHA-256 | Bytes | Match |
|---|---|---|---|---|
| `catalog-projection.json` | `b0c2dc8cf1412773b4ed4f17fcba10634a997f3b2b2b960d6dca200bdbb171fe` | `b0c2dc8cf1412773b4ed4f17fcba10634a997f3b2b2b960d6dca200bdbb171fe` | 443195 | yes |
| `settings-projection.json` | `1024154d7245a52fb3cb82b3c8105a2249d5406daee03498f99cbed8ed137d1e` | `1024154d7245a52fb3cb82b3c8105a2249d5406daee03498f99cbed8ed137d1e` | 568 | yes |
| `export-manifest.json` | `aa9b03faff555c6f5e98fd06b0f6e940269a5393f846877f57af562d1df692c3` | `aa9b03faff555c6f5e98fd06b0f6e940269a5393f846877f57af562d1df692c3` | 6131 | yes |

Export generated `2026-09-20T17:01:26.485Z` (`export-manifest.json` `generatedAtUtc`).
Catalogue shape (V§3): top-level keys `projectionVersion` (=1) and `providers`
only; **no top-level `.models`** (Amendment 04 D-c1). 13 provider records, 608
model records, 0 duplicate `provider`+`id` identities (manifest
`catalogCoverage.duplicateProviderModelIdentities: []` independently confirmed).
Model field union: `api, baseUrl, contextWindow, cost, id, input, maxTokens,
provider, reasoning, thinkingLevelMap`; `cost` sub-keys `input, output` only.
Resolution filters `providers[].models[]` on the inner `model.provider` field,
literal and case-sensitive (Node `===`).

Record locators below have the form `catalog-projection.json#providers[i](providerKey).models[j]`.

## 2. AC2 — identity resolution (15 bindings)

Counts: **13 attempted under AC2a = 12 literal catalogue resolutions + 1
documented `AC2A_ZERO_MATCH` refusal (binding 7, Amendment 04 D-b1)**; **2 under
AC2b** (bindings 1 and 10, owner-attested). `13 + 2 = 15`. No binding
reclassified; none in both classes; none omitted. Raw query output: V§4.

| # | Lane roles | Provider | Exact model ID | Class | Matches | Presence verdict | Catalogue `baseUrl` (verbatim) | Record locator |
|---|---|---|---|---|---|---|---|---|
| 1 | L1 primary; L2 fallback | `opencode` | `claude-opus-5-5` | AC2b `owner-attested` | 0 (non-authoritative) | `OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY` | unknown | none (frozen export predates Amendment 03) |
| 2 | L1 fallback; L2 primary | `opencode` | `gpt-6-astra` | AC2a | 1 | RESOLVED | `https://opencode.ai/zen/v1` | `providers[8](opencode).models[47]` |
| 3 | L3 primary | `opencode` | `gpt-5.6-sol` | AC2a | 1 | RESOLVED | `https://opencode.ai/zen/v1` | `providers[8](opencode).models[45]` |
| 4 | L3 fallback | `opencode` | `claude-sonnet-5` | AC2a | 1 | RESOLVED | `https://opencode.ai/zen` | `providers[8](opencode).models[12]` |
| 5 | L4 primary | `opencode` | `deepseek-v4-pro` | AC2a | 1 | RESOLVED | `https://opencode.ai/zen/v1` | `providers[8](opencode).models[15]` |
| 6 | L4 fallback | `opencode` | `gpt-5.6-terra` | AC2a | 1 | RESOLVED | `https://opencode.ai/zen/v1` | `providers[8](opencode).models[46]` |
| 7 | L5 primary; L6 recommendation-only primary | `opencode` | `qwen3.8-flash` | AC2a | 0 | **`AC2A_ZERO_MATCH`** (refusal; acceptable evidence, D-b1); diagnosed distinctly: `AC2A_WRONG_PROVIDER`, `AC2A_PREFIX_ALIAS_REFUSED` (§2.1) | none | none under `opencode` |
| 8 | L5 fallback; L6 recommendation-only fallback | `opencode` | `glm-5.3-flash` | AC2a | 1 | RESOLVED | `https://opencode.ai/zen/v1` | `providers[8](opencode).models[27]` |
| 9 | L1 primary; L2 fallback | `openrouter` | `openai/gpt-6-astra` | AC2a | 1 | RESOLVED | `https://openrouter.ai/api/v1` | `providers[10](openrouter).models[252]` |
| 10 | L1 fallback; L2 primary | `openrouter` | `anthropic/claude-opus-5.5` | AC2b `owner-attested` | 0 (non-authoritative) | `OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY` | unknown | none (frozen export predates Amendment 03) |
| 11 | L3 primary | `openrouter` | `anthropic/claude-sonnet-5` | AC2a | 1 | RESOLVED | `https://openrouter.ai/api` | `providers[10](openrouter).models[51]` |
| 12 | L3 fallback | `openrouter` | `openai/gpt-5.6-sol` | AC2a | 1 | RESOLVED | `https://openrouter.ai/api/v1` | `providers[10](openrouter).models[244]` |
| 13 | L4 primary | `openrouter` | `openai/gpt-5.6-terra` | AC2a | 1 | RESOLVED | `https://openrouter.ai/api/v1` | `providers[10](openrouter).models[248]` |
| 14 | L4 fallback; L5 primary | `openrouter` | `google/gemini-3.8-flash` | AC2a | 1 | RESOLVED | `https://openrouter.ai/api/v1` | `providers[10](openrouter).models[107]` |
| 15 | L5 fallback | `openrouter` | `anthropic/claude-haiku-4.5` | AC2a | 1 | RESOLVED | `https://openrouter.ai/api` | `providers[10](openrouter).models[31]` |

"RESOLVED" means *present as a recorded configuration fact in a frozen,
freshness-unaccepted export*. It is **not** availability, uptime, reachability,
or enablement.

No AC2a binding resolved to multiple records, and no resolved identity carries
catalogue-internal inconsistent `baseUrl` values, so **no `AC2A_MULTI_MATCH` or
`AC2A_URL_MISMATCH` refusal occurred** (D-a1). No stop condition was reached.

### 2.1 Binding 7 — `AC2A_ZERO_MATCH` (Amendment 04 D-b1)

- Query: `providers[].models[]` where `provider === "opencode" && id === "qwen3.8-flash"` → **0 matches** (V§4, `#7`).
- Named refusal: **`AC2A_ZERO_MATCH`** (the literal count; fixed by D-b1). The query also diagnoses two distinct conditions, each recorded under its own name and not folded into `AC2A_ZERO_MATCH` (rubric §7; V§8 N3):
  - **`AC2A_WRONG_PROVIDER`**: the exact id `qwen3.8-flash` exists in the frozen catalogue only under the different providers `opencode-go` (`https://opencode.ai/zen/go`) and `qwen-token-plan` (`https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`).
  - **`AC2A_PREFIX_ALIAS_REFUSED`**: a vendor-prefixed record exists (next bullet).
  - No **`AC2A_CASE_MISMATCH`** condition applies: there is no case-folded near-match under `opencode`. There is also no suffix variant. Same-provider ids nearby: `qwen3.5-plus`, `qwen3.6-plus` (not substitutes).
- **Vendor-prefixed record — observation only (rework R5).** The catalogue also contains `openrouter` / `qwen/qwen3.8-flash` (`providers[10](openrouter).models[331]`, `https://openrouter.ai/api/v1`; V§4, vendor-prefixed record observation). It is a **different provider** (`openrouter`) with a **prefixed id** (`qwen/…`). It is **not** binding 7 and is **never** aliased to it: neither stripping `qwen/` nor switching provider is allowed. Negative cases N13 and N14 show that append and strip both refuse with `AC2A_PREFIX_ALIAS_REFUSED`.
- **Not aliased** (`opencode-go`→`opencode` is forbidden even on equal endpoints; `openrouter` `qwen/qwen3.8-flash` is forbidden by provider and by prefix), **not reclassified** as owner-attested, **not substituted**, **not counted as a pass**. It records a catalogue gap **in the frozen, freshness-unaccepted export** (generated 2026-09-20). This is not a verified absence of `qwen3.8-flash` under `opencode`: the export is never an absence proof, and a later parcel may not cite it as one.
- The binding's L5 economy-primary and L6 recommendation-only-primary roles are **held** to A6 (`live-availability` / `model-quality`) and to PMC-P2 (M4), marked **`capability-unverified` / held**.
- Provenance note: this falsifies the historical coordinator-lint L5 "present" claim, which checked id presence but not provider (as recorded in Amendment 04 D-b1). It changes no live-availability claim.

### 2.2 Bindings 1 and 10 — AC2b `OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY`

- Attesting authority: **Amendment 03** (ratified by owner direction 2026-09-24): OpenCode `claude-opus-5-5`; OpenRouter `anthropic/claude-opus-5.5`.
- Literal queries run for the record only (V§4 `#1`, `#10`): **0 matches each**. This result is **expected and non-authoritative**: the frozen export (2026-09-20) predates Amendment 03. It is **not** a refusal, **not** a failure, **not** a contradiction of Amendment 03, and is **not** counted against AC2a.
- Nearby records observed for the record (not substitutes, not evidence about the attested identity): under `opencode`, `claude-opus-5` and `claude-opus-4-5`…`claude-opus-4-8`; under `openrouter`, `anthropic/claude-opus-5`, `anthropic/claude-opus-5:batch`, `anthropic/claude-opus-4.x` and `:batch` variants, and `~anthropic/claude-opus-latest`. Consistent with the manifest: `openrouterRequiredIdentities` lists `anthropic/claude-opus-5` and does **not** list `anthropic/claude-opus-5.5` (the manifest's required set is itself pre-Amendment-03).
- Every capability field is **`unknown`** (§4). Nothing is inferred from other Opus records or model family.
- Live reachability is established later under A6 `live-availability`, never here.

### 2.3 Excluded — `openrouter` / `typesafe/jev-1.13` (M2), observation only

Never resolved as an eligible binding; no replacement proposed.
- Catalogue: 0 records for `provider === "openrouter" && id === "typesafe/jev-1.13"`; no same-id record under any provider; no near-match (V§4 `#JEV`).
- Settings: present in `settings-projection.json` `enabledModels` as `"openrouter:typesafe/jev-1.13"` (line 10).
- Manifest: listed in `catalogCoverage.openrouterMissingRequiredIdentities` (line 12) and `openrouterRequiredIdentities` (line 45); absent from `openrouterObservedRequiredIdentities`.
- Disposition: see AC3 (§5).

## 3. Endpoint divergence — `static-conformance` findings for PMC-P1 / PMC-P2 (Amendment 04 D-a1)

These are **findings, never AC2a refusals, and never availability or absence
claims.** Comparators: `settings-projection.json` `providers[]` (`opencode` →
`https://opencode.ai/zen/go/v1`; `openrouter` → `https://openrouter.ai/api/v1`)
and the contract constant `routing-policy/src/pi-openrouter.ts` (`baseUrl:
'https://openrouter.ai/api/v1'`, lines 39, 53, 151; also
`templates/pi-openrouter-routing.json` line 4).

| Finding | Bindings | Catalogue `baseUrl` | Comparator value | Owner |
|---|---|---|---|---|
| **SCF-1** opencode `…/zen/v1` vs settings-registered `…/zen/go/v1` | 2, 3, 5, 6, 8 | `https://opencode.ai/zen/v1` | settings `opencode`: `https://opencode.ai/zen/go/v1` | PMC-P1 (contract, fixtures, refusal cases); PMC-P2 (provider registration, resolver, enablement) |
| **SCF-2** opencode `…/zen` (anthropic-messages) vs settings-registered `…/zen/go/v1` | 4 | `https://opencode.ai/zen` | settings `opencode`: `https://opencode.ai/zen/go/v1` | PMC-P1; PMC-P2 |
| **SCF-3** openrouter `…/api` (anthropic-messages) vs `…/api/v1` settings and contract | 11, 15 | `https://openrouter.ai/api` | settings `openrouter` and `pi-openrouter.ts` const: `https://openrouter.ai/api/v1` | PMC-P1 (the `pi-openrouter.ts` schema `const` would reject this value); PMC-P2 |
| conforming | 9, 12, 13, 14 | `https://openrouter.ai/api/v1` | equal to settings and contract | — |
| not assessable | 1, 7, 10 | none resolved | — | held (AC2b / D-b1) |

Supporting observation (catalogue-wide `api` × `baseUrl` tally, V§7; `api` is an
export-included field used here only to explain the pattern, not as a capability
fact): `opencode` — `openai-completions`/`openai-responses`/`google-generative-ai`
@ `…/zen/v1` (54), `anthropic-messages` @ `…/zen` (14); `opencode-go` —
`openai-*` @ `…/zen/go/v1` (25), `anthropic-messages` @ `…/zen/go` (2);
`openrouter` — `openai-completions` @ `…/api/v1` (363), `anthropic-messages` @
`…/api` (15). Within each provider the `baseUrl` is a function of `api`; per
identity it is single-valued.

### 3.1 `opencode` vs `opencode-go` namespace observation

The host registers provider key `opencode` at `https://opencode.ai/zen/go/v1`,
which is the endpoint the **catalogue** attributes to provider `opencode-go`,
while catalogue `opencode` records use `…/zen/v1` and `…/zen`. Equal or
similar endpoints are **not** licence to alias providers: resolution stays on
the literal `model.provider` value, and binding 7 is refused rather than
resolved through `opencode-go`. Which catalogue namespace the host's `opencode`
registration actually serves is a PMC-P2 configuration question (with SCF-1/2),
not something this parcel can settle without a live call.

### 3.2 Variant-suffix identities — observations, never candidates

Observed alongside AC2a identities (V§4): `openai/gpt-6-astra:batch`,
`openai/gpt-6-astra-pro`, `openai/gpt-6-astra-pro:batch`,
`anthropic/claude-sonnet-5:batch`, `openai/gpt-5.6-sol:batch`,
`openai/gpt-5.6-sol-pro`, `openai/gpt-5.6-sol-pro:batch`,
`openai/gpt-5.6-terra:batch`, `openai/gpt-5.6-terra-pro`,
`openai/gpt-5.6-terra-pro:batch`, `google/gemini-3.8-flash:batch`,
`anthropic/claude-haiku-4.5:batch` (all `openrouter`); `qwen-token-plan/deepseek-v4-pro-0813`.
`:batch` (and any `:<suffix>`) refuses with `AC2A_VARIANT_SUFFIX_REFUSED`
(negative case N4); `-pro` / dated ids are **different identities**, not
variants of a binding, and are not candidates.

Same id under other providers (observation, not aliasing): `gpt-6-astra`,
`gpt-5.6-sol`, `gpt-5.6-terra` also under `openai`, `openai-codex`;
`claude-sonnet-5` under `anthropic`; `deepseek-v4-pro` under `deepseek`,
`opencode-go`, `qwen-token-plan`; `glm-5.3-flash` under `opencode-go`;
`qwen3.8-flash` under `opencode-go` and `qwen-token-plan`.

Vendor-prefixed id under another provider (observation, not aliasing):
`openrouter` / `qwen/qwen3.8-flash` (see §2.1). Appending or stripping a vendor
prefix to reach a record refuses with `AC2A_PREFIX_ALIAS_REFUSED` (N13, N14).

## 4. AC5 — allowlisted capability facts per binding

Allowlist: `contextWindow`, `maxTokens`, `input` modalities, `reasoning`,
numeric `cost` fields with units, `thinkingLevelMap` coverage, provider
`checkedAt`. Absent → `unknown`. Absence of a quality field is **not** evidence
of merit. Costs are `cost.input.value` / `cost.output.value`, unit as recorded
in the record: **`USD per 1M tokens`** for every resolved binding.
`cacheRead`/`cacheWrite` costs are explicitly omitted by the export
(`explicitOmissions`) → `unknown`.

**`checkedAt`:** `unknown` for **all 15**. No model record and no provider record
carries any `checkedAt`-like field (V§3), and the manifest's
`projections[].sourceCheckedAt` is `{}` for both projections.

**Tool-use and structured-output: NOT derivable** from the safe field set. The
export's `fieldCoverage.included` lists no tool, function-calling, or
response-format field, and explicitly omits `compat` and "all non-allowlisted
fields". The `api` wire-protocol value is not a capability claim. Therefore
**every binding is `capability-unverified` for tool-use and for
structured-output**; nothing is inferred from model family or reputation.

`thinkingLevelMap` coverage lists the levels whose mapped value is non-null
(`key→value` where renamed); `null` entries are recorded as unmapped.

| # | Identity | `contextWindow` | `maxTokens` | `input` | `reasoning` | cost in / out (USD per 1M tokens) | `thinkingLevelMap` coverage | `checkedAt` | tool-use | structured-output |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `opencode/claude-opus-5-5` | unknown | unknown | unknown | unknown | unknown / unknown | unknown | unknown | capability-unverified | capability-unverified |
| 2 | `opencode/gpt-6-astra` | 1050000 | 128000 | image, text | true | 10 / 50 | low, medium, high, xhigh, max (off, minimal null) | unknown | capability-unverified | capability-unverified |
| 3 | `opencode/gpt-5.6-sol` | 1050000 | 128000 | image, text | true | 4 / 20 | low, medium, high, xhigh, max (off, minimal null) | unknown | capability-unverified | capability-unverified |
| 4 | `opencode/claude-sonnet-5` | 1000000 | 128000 | image, text | true | 2 / 10 | xhigh, max only (no other keys present) | unknown | capability-unverified | capability-unverified |
| 5 | `opencode/deepseek-v4-pro` | 1000000 | 384000 | text | true | 1.74 / 3.84 | high, max (off, minimal, low, medium, xhigh null) | unknown | capability-unverified | capability-unverified |
| 6 | `opencode/gpt-5.6-terra` | 1050000 | 128000 | image, text | true | 2.5 / 15 | low, medium, high, xhigh, max (off, minimal null) | unknown | capability-unverified | capability-unverified |
| 7 | `opencode/qwen3.8-flash` | unknown | unknown | unknown | unknown | unknown / unknown | unknown | unknown | capability-unverified (held) | capability-unverified (held) |
| 8 | `opencode/glm-5.3-flash` | 1000000 | 131072 | image, text | true | 0.15 / 0.5 | low, high, max (off, minimal, medium, xhigh null) | unknown | capability-unverified | capability-unverified |
| 9 | `openrouter/openai/gpt-6-astra` | 1050000 | 128000 | image, text | true | 10 / 50 | low, medium, high, xhigh, max (off, minimal null) | unknown | capability-unverified | capability-unverified |
| 10 | `openrouter/anthropic/claude-opus-5.5` | unknown | unknown | unknown | unknown | unknown / unknown | unknown | unknown | capability-unverified | capability-unverified |
| 11 | `openrouter/anthropic/claude-sonnet-5` | 1000000 | 128000 | image, text | true | 2 / 10 | off→none, low, medium, high, xhigh, max (minimal null) | unknown | capability-unverified | capability-unverified |
| 12 | `openrouter/openai/gpt-5.6-sol` | 1050000 | 128000 | image, text | true | 2 / 10 | off→none, low, medium, high, xhigh, max (minimal null) | unknown | capability-unverified | capability-unverified |
| 13 | `openrouter/openai/gpt-5.6-terra` | 1050000 | 128000 | image, text | true | 2 / 12 | off→none, low, medium, high, xhigh, max (minimal null) | unknown | capability-unverified | capability-unverified |
| 14 | `openrouter/google/gemini-3.8-flash` | 1048576 | 65536 | image, text | true | 0.75 / 3.75 | low, medium, high (off, minimal, xhigh, max null) | unknown | capability-unverified | capability-unverified |
| 15 | `openrouter/anthropic/claude-haiku-4.5` | 200000 | 64000 | image, text | true | 1 / 5 | **unknown** (`thinkingLevelMap` absent from record) | unknown | capability-unverified | capability-unverified |

Rows 1 and 10 are `unknown` because they are AC2b owner-attested (no frozen
record exists). Row 7 is `unknown` because it is `AC2A_ZERO_MATCH`; the
`opencode-go` / `qwen-token-plan` records are **not** used to fill it.

Thinking-level observation for PMC-P2: charter matrix thinking is "high" for L1–L3,
"medium" for L4, "minimal/low" for L5, "minimal" for L6. `minimal` is `null` or
absent in every resolved record that has a map; binding 4 has no `high` key;
binding 14 maps `minimal` to null; binding 15 has no map. Whether Pi rejects,
clamps, or passes through an unmapped level is Pi 0.86.1 semantics this parcel
cannot establish without launching Pi (prohibited); held for PMC-P2 / A6.

## 5. AC3 — Jev disposition, re-derived from the export only

1. `settings-projection.json` `enabledModels` contains `"openrouter:typesafe/jev-1.13"` (line 10) — **enabled in settings**.
2. `export-manifest.json` `catalogCoverage.openrouterMissingRequiredIdentities` = `["typesafe/jev-1.13"]` (line 12) — **listed missing**; not in `openrouterObservedRequiredIdentities`.
3. Catalogue literal query → 0 records (§2.3).

Conclusion: enabled-but-uncatalogued, i.e. it resolves to a missing-model
refusal. This **confirms** the M2 ruling: the typed routing/classification lane
is **refused / disabled-lane**, the row-6 OpenRouter primary is struck, and no
substitute is proposed.

**Unreconciled Jev gap between M2 and code — recorded, NOT fixed** (owner
PMC-P1 / PMC-P2). Where the repository still encodes Jev as the
routing/classification model (V§6):

- `plugins/foreman-line/routing-policy/src/pi-openrouter.ts` — `PI_OPENROUTER_ENABLED_MODELS` includes `'typesafe/jev-1.13'` (line 48); `PI_OPENROUTER_ROUTING.models['typesafe/jev-1.13']` with `allowedLanes: ['routing','classification']`, `authority: 'recommend-only'` (lines 74–82).
- `plugins/foreman-line/routing-policy/tests/semantic-invariants.test.ts` lines 254–273 assert Jev is enabled and bounded to routing/classification.
- `plugins/foreman-line/routing-policy/tests/pi-openrouter.test.ts` lines 38–46 use the Jev entry as the negative-case subject.
- `plugins/foreman-line/templates/pi-openrouter-routing.json` lines 9 and 30; `plugins/foreman-line/routing-policy/README.md` lines 61–69.

**Precision note (open flag F-A):** AC3's wording names
`routing-policy/routing-policy.yaml`. A case-sensitive `Select-String -Pattern
'jev'` on that file returns **no match** (V§6), and a case-insensitive search
also returns none. The Jev encoding lives in the `routing-policy/` package's
`src/pi-openrouter.ts`, its tests, its README, and the `templates/` JSON — not
in the YAML policy file itself. The gap is real; its location differs from the
spec's wording. Recorded, not reconciled.

## 6. AC4 — enablement gap

Matching rule: `settings-projection.json` `enabledModels` entries are
`<providerKey>:<modelId>`; compared literally against `<provider>:<id>` for each
of the fifteen AC2 bindings (V§5).

- **Enabled: 0 of 15.**
- **Not enabled: 15 of 15** — bindings 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15.
- The five `enabledModels` entries (`opencode:qwen/qwen-2.5-coder-32b`, `opencode:deepseek/deepseek-r1-distill-qwen-32b`, `openrouter:anthropic/claude-3.5-sonnet`, `openrouter:openai/gpt-4o-mini`, `openrouter:typesafe/jev-1.13`) intersect the AC2 set in **0** entries.
- Owner of closing the gap: **PMC-P2** per **M4**, under its own Gate 2. Nothing was enabled here and no settings edit is presented as executed.
- The coordinator lint's earlier "twelve" figure is superseded by this AC2-enumerated `n of 15`.
- Host defaults observed for the record (M3): `defaultProvider: opencode`, `defaultModel: qwen/qwen-2.5-coder-32b`, `defaultThinkingLevel: minimal`.

## 7. Policy / registry observations (record only; no change made)

- `routing-policy/src/validator.ts` `KNOWN_FRONTIER_MODELS` (lines 47–54) already contains `'anthropic/claude-opus-5.5'` (line 48); `routing-policy.yaml` `model_tiers.frontier` lists `anthropic/claude-opus-5.5` first (line 166) and all three `data_classification.*.eligible_models` lists include it. The frozen catalogue does not contain that identity (expected per AC2b); no conclusion about availability is drawn.
- `routing-policy.yaml` is OpenRouter-slug-only: no `opencode` binding (2–8) appears in any `eligible_models` list, so OpenCode data-class eligibility is **unknown** from policy (feeds rubric input R1).

## 8. Holds (named)

| Hold | Scope | Routed to |
|---|---|---|
| H-LIVE | live availability / reachability of all 15 bindings | A6 `live-availability` |
| H-QUAL | task-quality / "current-best" for all lanes | A6 `model-quality` |
| H-OPUS | bindings 1, 10 — `OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY`; all capability fields unknown | A6 `live-availability`; PMC-P1 fixtures |
| H-B7 | binding 7 — `AC2A_ZERO_MATCH`; L5 primary and L6 rec-only primary held | A6; PMC-P2 (M4) |
| H-TOOLS | tool-use `capability-unverified` for all 15 | A6 / PMC-P2 preflight |
| H-SO | structured-output `capability-unverified` for all 15 | A6 / PMC-P2 preflight |
| H-FRESH | `checkedAt` unknown for all 15; export freshness not accepted | coordinator / RCM freshness acceptance |
| H-ENABLE | 0 of 15 enabled | PMC-P2 (M4) |
| H-EP | SCF-1, SCF-2, SCF-3 endpoint divergences | PMC-P1, PMC-P2 |
| H-JEV | Jev code/test/template gap | PMC-P1 / PMC-P2 |
| H-PI | Pi 0.86.1 configuration semantics (thinking-level handling, provider/endpoint dispatch) — not re-verified; launching Pi is prohibited | PMC-P2 / A6 |
