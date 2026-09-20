# RCM-P0 drift report — sanitized-export continuation

Status: **unaccepted evidence refresh; complete:false; no live routing authority**.
Repository: `cfdde25728d73fe4532d9dfc794a3b4188973f51`.
Fixed evidence evaluation time: `2026-09-20T17:06:31.731Z`.
Source acquisition/reacquisition times, exact SHA-256s and record locators are in
`rcm-p0-catalog-snapshot.v1.json#/sourceRefs`. Commands and exits are in
`rcm-p0-verification.md`. H02/H03 mean the supplied sanitized projections only.

The bounded Gate 3 extension permits refresh of these four artifacts under the
completed P0 spec only. It grants no RCM-P1 release, host correction, spend,
general Gate 3 or commit. The original bounded handoff remains accepted only as
incomplete evidence; this refresh requires coordinator acceptance and fresh reviews.

## Findings re-derived

“Reproduced” below is scoped to repository text plus the supplied projections.
It does not mean provider availability, installed parity, runtime execution,
approved current configuration or freshness has been proved.

| Finding | Observation, derivation and verdict | Consequence / owner |
|---|---|---|
| F1 | **reproduced, static exposure only**. S01:18-20 selects economy for boilerplate; Nemotron is first (191) and appears in all three classification sets (91/114/137). H02#/providers/10/models/185 is exactly openrouter / nvidia/nemotron-3.5-lightning / https://openrouter.ai/api/v1, input=[text]. S02:204,210-224 intersects classification and walks tier order without an input-modality predicate. In-memory derivation selects Nemotron in all three classifications. | Text-only first-eligible exposure is supported. Actual image-bearing execution remains **blocked/unproved**; installed policy parity is unknown. P4/P4A own runtime proof; no evaluator or dispatch call was made. |
| F2 | **reproduced, conditional static exposure only**. H02#/providers/10/models/373 gives exact openrouter / z-ai/glm-5.3 / https://openrouter.ai/api/v1, input=[text]. S01:174-181 puts it **4 of 6** in standard after Sonnet, Gemini Flash, GPT Terra. All four are classification-eligible in each list. | Sonnet is the static first eligible entry; GLM is not the selected primary. Removing all three predecessors from the eligible set in memory exposes GLM; this is not health/quota fallback or a runtime result. P4/P4A own closure. |
| F3 | **reproduced, projected rate comparison**. S01:13-14 dates USD-per-1M-token comments to 2026-09-03; line 191 gives 0.065 input / 0.18 output. H02#/providers/10/models/185/cost supplies 0.08 / 0.20, each explicitly labeled USD per 1M tokens. (new-old)/old*100 gives **23.076923% input**, **11.111111% output**. | Units are declared by the owner projection, not independently verified against an upstream pricing source. No claim about the exact time of price change. No comparison with ceiling_usd. Unknown units/rates or zero denominators refuse. P6 owns later proposal work. |
| F4 | **reproduced, projection membership**. Five enabled references: four absent, one unique observed endpoint match; **4/5 = 80%**. The one default is also absent and duplicates enabled index 0: **1/1 default absent**, six reference occurrences, five distinct pairs. Full inventory below. | No host repair. Separate human authorization is needed for any correction; P7 may later produce a governed proposal. Jev remains refused/disabled-lane/correction proposal only. |
| F5 | **reproduced core endpoint mismatch; disjoint-ID subclaim not-reproduced**. H03#/providers/0 configures opencode at https://opencode.ai/zen/go/v1. H02#/providers/8 has 68 opencode records: 54 at /zen/v1 and 14 at /zen; none at the configured URL. H02#/providers/9 has 27 opencode-go records: 25 at /zen/go/v1 and 2 at /zen/go. H03 has no opencode-go provider entry. The namespaces share **15 exact IDs**, so “disjoint” is false. | Do not alias opencode to opencode-go or normalize endpoint paths. opencode mismatch is measured; opencode-go's approved/configured endpoint remains unresolved. H04 approved configuration authority was not supplied. Coordinator owns the evidence correction; no configuration action. |
| F6 | **not-reproduced as full exact-tuple health**. All **15/15 policy IDs** exist uniquely in OpenRouter, but only **11/15** exactly match H03's https://openrouter.ai/api/v1; **4/15** use https://openrouter.ai/api and refuse. Zero absent policy IDs, zero duplicate pairs, 45 classification references and zero outside-tier IDs. | Discard the unqualified “100% current / governed file healthy” claim. ID-only presence reproduces; endpoint-compatible health does not. Even the 11 agreements are observations, not approved joins: H04 and freshness remain blocked. Escalate the empirical-premise correction to the RCM coordinator within this completion report; no locked decision is amended and no downstream work is released. |

F6's four mismatches are Opus 5, Fable 5.1, Sonnet 5 and Haiku 4.5.
Their catalog API is anthropic-messages; the other policy records use
openai-completions. This difference is observed, not permission to equate or
rewrite URLs. No case folding, dot/dash conversion, suffix stripping, URL
trimming, provider aliasing or substitute ID is used.

## Exact policy-ID join inventory

The comparison endpoint comes from **observed H03 settings**, not an approved
configuration source. H04 is unavailable. All positive approved/live consumption
therefore remains refused. Order below is policy order.

| Tier / position | Exact ID | Source | ID matches | Catalog baseUrl | Disposition |
|---|---|---|---:|---|---|
| frontier 1 | `anthropic/claude-opus-5` | S01:166; H02#/providers/10/models/44 | 1 | `https://openrouter.ai/api` | endpoint mismatch; refused |
| frontier 2 | `openai/gpt-5.6-sol` | S01:167; H02#/providers/10/models/244 | 1 | `https://openrouter.ai/api/v1` | observed match; approval/freshness blocked |
| frontier 3 | `google/gemini-3.1-pro-preview` | S01:168; H02#/providers/10/models/96 | 1 | `https://openrouter.ai/api/v1` | observed match; approval/freshness blocked |
| frontier 4 | `anthropic/claude-fable-5.1` | S01:169; H02#/providers/10/models/29 | 1 | `https://openrouter.ai/api` | endpoint mismatch; refused |
| frontier 5 | `openai/gpt-6-astra` | S01:170; H02#/providers/10/models/252 | 1 | `https://openrouter.ai/api/v1` | observed match; approval/freshness blocked |
| standard 1 | `anthropic/claude-sonnet-5` | S01:174; H02#/providers/10/models/51 | 1 | `https://openrouter.ai/api` | endpoint mismatch; refused |
| standard 2 | `google/gemini-3.8-flash` | S01:175; H02#/providers/10/models/107 | 1 | `https://openrouter.ai/api/v1` | observed match; approval/freshness blocked |
| standard 3 | `openai/gpt-5.6-terra` | S01:176; H02#/providers/10/models/248 | 1 | `https://openrouter.ai/api/v1` | observed match; approval/freshness blocked |
| standard 4 | `z-ai/glm-5.3` | S01:179; H02#/providers/10/models/373 | 1 | `https://openrouter.ai/api/v1` | observed match; approval/freshness blocked |
| standard 5 | `x-ai/grok-4.6` | S01:180; H02#/providers/10/models/357 | 1 | `https://openrouter.ai/api/v1` | observed match; approval/freshness blocked |
| standard 6 | `meta/muse-spark-1.3` | S01:181; H02#/providers/10/models/138 | 1 | `https://openrouter.ai/api/v1` | observed match; approval/freshness blocked |
| economy 1 | `nvidia/nemotron-3.5-lightning` | S01:191; H02#/providers/10/models/185 | 1 | `https://openrouter.ai/api/v1` | observed match; approval/freshness blocked |
| economy 2 | `openai/gpt-5.6-luna` | S01:192; H02#/providers/10/models/240 | 1 | `https://openrouter.ai/api/v1` | observed match; approval/freshness blocked |
| economy 3 | `google/gemini-3.1-flash-lite` | S01:193; H02#/providers/10/models/93 | 1 | `https://openrouter.ai/api/v1` | observed match; approval/freshness blocked |
| economy 4 | `anthropic/claude-haiku-4.5` | S01:194; H02#/providers/10/models/31 | 1 | `https://openrouter.ai/api` | endpoint mismatch; refused |

All three classification lists have 15 entries / 15 distinct IDs, equal to the
tier ID set. No classification reference occurs outside tiers. Duplicate provider
keys, provider/model pairs and settings provider keys are all zero in the supplied
export; injected duplicate and ambiguous identities refuse in memory.

## Every settings reference

| Settings locator | Exact provider:model | Observed configured baseUrl | ID matches | Result |
|---|---|---|---:|---|
| enabledModels/0 | `opencode:qwen/qwen-2.5-coder-32b` | `https://opencode.ai/zen/go/v1` | 0 | MISSING_MODEL_REFUSED |
| enabledModels/1 | `opencode:deepseek/deepseek-r1-distill-qwen-32b` | `https://opencode.ai/zen/go/v1` | 0 | MISSING_MODEL_REFUSED |
| enabledModels/2 | `openrouter:anthropic/claude-3.5-sonnet` | `https://openrouter.ai/api/v1` | 0 | MISSING_MODEL_REFUSED |
| enabledModels/3 | `openrouter:openai/gpt-4o-mini` | `https://openrouter.ai/api/v1` | 1 | OBSERVED_TUPLE_MATCH |
| enabledModels/4 | `openrouter:typesafe/jev-1.13` | `https://openrouter.ai/api/v1` | 0 | MISSING_MODEL_REFUSED |
| defaultProvider + #/defaultModel | `opencode:qwen/qwen-2.5-coder-32b` | `https://opencode.ai/zen/go/v1` | 0 | MISSING_MODEL_REFUSED |

The one observed match is openrouter:openai/gpt-4o-mini at H02#/providers/10/models/204.
A match does not promote it or approve dispatch. Missing model matches are zero;
they are not explained away by matching another namespace.

## Supporting observations and limits

H02 contains **13 providers / 608 records**; counts and safe fieldCounts reproduce
independently. Provider counts, in exported order: anthropic 14, cerebras 2,
deepseek 2, google 22, groq 7, nvidia 20, openai 39, openai-codex 6,
opencode 68, opencode-go 27, openrouter 378, qwen-token-plan 20, xai 3.

All 608 have id/provider/baseUrl/api/input/reasoning/contextWindow/maxTokens and
input/output rate labels. Visible input occurrences: text 608, image 424; no
other projected input modality. Reasoning: true 504 / false 104; policy tiers
true 15/15. Overall context range is 4,095–2,000,000; economy 200,000–1,050,000.
thinkingLevelMap is present on 341, absent on 267; settings defaultThinkingLevel
is minimal. Missing maps are unknown; null map values do not prove support.
Nemotron has no thinking map. Projected map values include uppercase HIGH and
MINIMAL and the value default; they are retained without normalization.

**Provider checkedAt is absent for all 13** and both manifest sourceCheckedAt
objects are empty. The historical “all providers share one checkedAt” assertion
is **blocked, not reproduced** by this export. Source modification timestamps
are owner-attested metadata, not refresh authority. Raw key inventory, output-
modality absence and absence of quality fields cannot be inferred from an
allowlist projection; those historical assertions remain **blocked/unknown**.
No model-merit conclusion is made.

Two negative-price records are openrouter/auto and openrouter/auto-beta
(H02#/providers/10/models/273 and /274): input and output each -1000000.
They are sentinel/meta-router observations, never usable prices or candidates.
There are 94 policy-named suffix variants: 74 :batch, 20 :free, zero :nitro or
:floor. The snapshot inventories every matching ID and locator. This inventory
does not claim an exhaustive taxonomy of meta-routers or all possible variants.

## HAWF disposition

**escalated-unresolved / downstream hold**

The escalation packet is parked with its owner. No action, reconciliation or
onward handoff is performed or requested by this worker. S07:6 says SUPERSEDED /
historical / non-dispatchable; S06:12 still says awaiting_coordinator_claim,
S06:50-52 requires reconciliation for conflict, and S08:5,10 retains UNCLAIMED /
awaiting_coordinator_claim. Current hashes:

- S06 INDEX: `d10de5af1553d2405860e2ab3efa242279fa422c72fd8dba102aba404aeb1e30`
- S07 HAWF charter: `6f9cd2a813dd69b1ec061df06db34e2bfb5098156643088c344de92a10900253`
- S08 HAWF directive: `508fb3206520a5f4161f7f1e5076009fb56d420d1daeae924dacd75e489b4b51`

The current coordinator ruling preserves this disposition. The worker neither
claims HAWF ownership nor changes any control document.

## Jev absence and correction proposal

Required tuple: **openrouter / typesafe/jev-1.13 / https://openrouter.ai/api/v1**.
It is enabled at H03#/enabledModels/4 but has **zero catalog matches** in the
supplied full H02 projection; M01/catalogCoverage records the same absence.

D10 corroboration supplied by the coordinator:
[OpenRouter models endpoint](https://openrouter.ai/api/v1/models), observed at
**2026-09-20T17:22:45.7959406Z**; direct find returned no matching
`typesafe/jev-1.13` entry. This is **corroboration only**, not a replacement for
H02 and not an independent worker fetch. No model page is catalog proof.
The coordinator timestamp does not establish accepted catalog freshness.

Disposition: **refused/disabled-lane/correction proposal only**. No runtime
disablement is asserted. S09 D10 confines Jev to recommend-only routing/
classification, never prose, implementation, approval, merge, release or bypass.

Correction proposal: keep the lane refused; a separately authorized human may
address the missing identity and enabled/default inconsistencies. Any future
acceptance needs exact unique provider/model/baseUrl evidence and accepted
freshness/configuration authority. No model is installed, substituted, patched
or silently selected here.

## Holds and unchanged contracts

Freshness is **refused**: no accepted TTL or source-time authority, no provider
checkedAt. 86400 seconds remains a proposal. The snapshot stays complete:false
and evidence-only until acceptance, and acceptance alone cannot make missing
authority or freshness true. P1 remains held.

Other holds: approved configuration authority; installed plugin version/parity;
four policy endpoint mismatches; Jev absence; HAWF's exact disposition above;
two fresh independent frontier reviews including security; coordinator evidence
acceptance. F1/F2 runtime proof belongs to later parcels.

RCM D1–D14, OQ1–OQ7, amendments A–K / queue 1–6, boundary D1–D10 and GMF
contracts remain unchanged. Classification precedes capability then fixed tier
order; eligibility is not merit; Pi settings are not routing authority. No
network, raw host/credential read, host write, exporter-source acquisition,
export-package mutation, code/runtime implementation, installation, price sort,
spend, dispatch, commit or policy/control-document change occurred.
