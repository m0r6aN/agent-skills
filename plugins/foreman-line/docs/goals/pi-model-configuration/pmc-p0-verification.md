# PMC-P0 — Verification Record

**Parcel:** PMC-P0 (Pi capability and catalogue baseline). **Role:** builder.
**Worktree:** `D:/Repos/wt-pmc-p0`. **Branch:** `codex/pmc-p0-evidence`.
**Spec:** `plugins/foreman-line/docs/specs/active/PMC-P0-pi-capability-and-catalogue-baseline.md`, SHA-256 `133a7690b865d460586e77fb3ee5440116513272db299eceb52b09f8f81b72eb`, `status: active`.
**Evidence state attested:** `static-conformance` only. **Not attested:** `live-availability`, `model-quality` (A6).
**Reviews:** two fresh frontier adversarial reviews (elevated / architecture-risk), one focused on evidence acquisition and leakage — **pending - coordinator-owned**. This record is the builder's claim; it does not verify itself. Coordinator acceptance releases the gate.

## V§0. Tools and execution notes

| Tool | Version | How observed |
|---|---|---|
| Node.js | `v24.7.0` | `node -v` (exit 0) |
| PowerShell | `7.6.6` (ConsoleHost) | `Get-Host \| Format-List Name,Version` |
| git | (from PATH; used for rev-parse / status / diff only) | — |

Execution-environment notes (recorded faithfully):

- The harness's PowerShell tool is already PowerShell 7.x. A nested `pwsh -NoProfile -Command …` launch was **denied by the session permission layer** ("spawns a nested PowerShell process"). So were PowerShell commands containing `$(...)` subexpressions, `.NET` method calls (`.ToString()`), a wildcard path, or an array of `-LiteralPath` values. None ran. Per the spec ("Use the PowerShell below **or an equivalent Node script**"), the Verification Plan was carried out with:
  - single-path PowerShell 7 `Get-FileHash` / `Select-String` calls, which succeeded; and
  - equivalent Node scripts via Git Bash.
- PowerShell tool invocations report no numeric exit code. Where a PowerShell call is cited, "completed" means the tool returned output without error; the Node and git exit codes are printed explicitly.
- No `node_modules` was installed or needed. No provider call, network request, credential/host read, environment enumeration, or Pi launch occurred. No file outside the four Allowed Files was written.

## V§1. G1–G4 and the brief (before any write)

```
$ cd /d/Repos/wt-pmc-p0 && node -v; echo "node exit=$?"; pwd; git rev-parse --abbrev-ref HEAD; echo "exit=$?"; git rev-parse HEAD; echo "exit=$?"; git status --short --untracked-files=all; echo "status exit=$?"; git diff --check; echo "diffcheck exit=$?"
v24.7.0
node exit=0
/d/Repos/wt-pmc-p0
codex/pmc-p0-evidence
exit=0
deef24bd8d1ea01e833f76351cadd91f5bc23d48
exit=0
status exit=0
diffcheck exit=0
```

`git status --short --untracked-files=all` printed **nothing** → clean (G4).

```
$ sha256sum plugins/foreman-line/docs/specs/active/PMC-P0-pi-capability-and-catalogue-baseline.md; echo "exit=$?"
133a7690b865d460586e77fb3ee5440116513272db299eceb52b09f8f81b72eb *plugins/foreman-line/docs/specs/active/PMC-P0-pi-capability-and-catalogue-baseline.md
exit=0
$ sha256sum plugins/foreman-line/docs/kickstarters/foreman-line-build-PMC-P0.md; echo "exit=$?"
f953f8abd9cb6e81c87f6091191be8a8a05ac9561469a1f693df2dd2ae1aa941 *plugins/foreman-line/docs/kickstarters/foreman-line-build-PMC-P0.md
exit=0
$ wc -c <brief> <spec>
10014 plugins/foreman-line/docs/kickstarters/foreman-line-build-PMC-P0.md
30323 plugins/foreman-line/docs/specs/active/PMC-P0-pi-capability-and-catalogue-baseline.md
```

| Gate | Required | Observed | Result |
|---|---|---|---|
| G1 worktree | `D:/Repos/wt-pmc-p0` | `/d/Repos/wt-pmc-p0` | pass |
| G2 branch | `codex/pmc-p0-evidence` | `codex/pmc-p0-evidence` | pass |
| G3 spec SHA-256 + `status: active` | `133a7690…72eb`, active | `133a7690b865d460586e77fb3ee5440116513272db299eceb52b09f8f81b72eb`; frontmatter line 4 `status: active` | pass |
| G4 clean | empty `git status --short` | empty | pass |
| tip (informational) | — | `deef24bd8d1ea01e833f76351cadd91f5bc23d48` | recorded, not gated |
| brief present | present | present; SHA-256 `f953f8abd9cb6e81c87f6091191be8a8a05ac9561469a1f693df2dd2ae1aa941`, 10014 bytes | reported only; **not** compared to any value inside the brief |

## V§2. Export digests (hard stop on mismatch) — all three match

Node (Git Bash):

```
$ node -e '<sha256 of each export file vs pinned>'; echo "node-digest exit=$?"
catalog-projection.json bytes=443195 actual=b0c2dc8cf1412773b4ed4f17fcba10634a997f3b2b2b960d6dca200bdbb171fe expected=b0c2dc8cf1412773b4ed4f17fcba10634a997f3b2b2b960d6dca200bdbb171fe match=true
settings-projection.json bytes=568 actual=1024154d7245a52fb3cb82b3c8105a2249d5406daee03498f99cbed8ed137d1e expected=1024154d7245a52fb3cb82b3c8105a2249d5406daee03498f99cbed8ed137d1e match=true
export-manifest.json bytes=6131 actual=aa9b03faff555c6f5e98fd06b0f6e940269a5393f846877f57af562d1df692c3 expected=aa9b03faff555c6f5e98fd06b0f6e940269a5393f846877f57af562d1df692c3 match=true
node-digest exit=0
```

(The script exits 1 on any mismatch.)

PowerShell 7 `Get-FileHash`, one literal path per call:

```
PS> Get-FileHash -Algorithm SHA256 -LiteralPath plugins/foreman-line/docs/goals/routing-currency-and-merit/host-owner-export/catalog-projection.json | Format-List Algorithm,Hash
Algorithm : SHA256
Hash      : B0C2DC8CF1412773B4ED4F17FCBA10634A997F3B2B2B960D6DCA200BDBB171FE

PS> Get-FileHash -Algorithm SHA256 -LiteralPath .../settings-projection.json | Format-List Algorithm,Hash
Algorithm : SHA256
Hash      : 1024154D7245A52FB3CB82B3C8105A2249D5406DAEE03498F99CBED8ED137D1E

PS> Get-FileHash -Algorithm SHA256 -LiteralPath .../export-manifest.json | Format-List Algorithm,Hash
Algorithm : SHA256
Hash      : AA9B03FAFF555C6F5E98FD06B0F6E940269A5393F846877F57AF562D1DF692C3
```

| File | Pinned | Recomputed (Node = Get-FileHash) | Match |
|---|---|---|---|
| `catalog-projection.json` | `b0c2dc8c…bb171fe` | `b0c2dc8cf1412773b4ed4f17fcba10634a997f3b2b2b960d6dca200bdbb171fe` | **yes** |
| `settings-projection.json` | `1024154d…ed137d1e` | `1024154d7245a52fb3cb82b3c8105a2249d5406daee03498f99cbed8ed137d1e` | **yes** |
| `export-manifest.json` | `aa9b03fa…1df692c3` | `aa9b03faff555c6f5e98fd06b0f6e940269a5393f846877f57af562d1df692c3` | **yes** |

Re-checked after the negative cases: the catalogue digest was still `b0c2dc8c…bb171fe` (V§8, last line).

## V§3. Catalogue structure (Amendment 04 D-c1)

```
$ node -e '<print top-level keys, provider summaries, field union>'; echo "exit=$?"
top-level keys: [ 'projectionVersion', 'providers' ]
has top-level .models: false
providers: 13
{"fieldCounts":{...},"providerKey":"anthropic","recordCount":14} models= 14 innerProviders= anthropic baseUrls= https://api.anthropic.com
{"fieldCounts":{...},"providerKey":"cerebras","recordCount":2} models= 2 innerProviders= cerebras baseUrls= https://api.cerebras.ai/v1
{"fieldCounts":{...},"providerKey":"deepseek","recordCount":2} models= 2 innerProviders= deepseek baseUrls= https://api.deepseek.com
{"fieldCounts":{...},"providerKey":"google","recordCount":22} models= 22 innerProviders= google baseUrls= https://generativelanguage.googleapis.com/v1beta
{"fieldCounts":{...},"providerKey":"groq","recordCount":7} models= 7 innerProviders= groq baseUrls= https://api.groq.com/openai/v1
{"fieldCounts":{...},"providerKey":"nvidia","recordCount":20} models= 20 innerProviders= nvidia baseUrls= https://integrate.api.nvidia.com/v1
{"fieldCounts":{...},"providerKey":"openai","recordCount":39} models= 39 innerProviders= openai baseUrls= https://api.openai.com/v1
{"fieldCounts":{...},"providerKey":"openai-codex","recordCount":6} models= 6 innerProviders= openai-codex baseUrls= https://chatgpt.com/backend-api
{"fieldCounts":{"api":68,"baseUrl":68,"contextWindow":68,"cost.input":68,"cost.output":68,"id":68,"input":68,"maxTokens":68,"provider":68,"reasoning":68,"thinkingLevelMap":49},"providerKey":"opencode","recordCount":68} models= 68 innerProviders= opencode baseUrls= https://opencode.ai/zen/v1|https://opencode.ai/zen
{"fieldCounts":{...},"providerKey":"opencode-go","recordCount":27} models= 27 innerProviders= opencode-go baseUrls= https://opencode.ai/zen/go/v1|https://opencode.ai/zen/go
{"fieldCounts":{"api":378,"baseUrl":378,"contextWindow":378,"cost.input":378,"cost.output":378,"id":378,"input":378,"maxTokens":378,"provider":378,"reasoning":378,"thinkingLevelMap":193},"providerKey":"openrouter","recordCount":378} models= 378 innerProviders= openrouter baseUrls= https://openrouter.ai/api/v1|https://openrouter.ai/api
{"fieldCounts":{...},"providerKey":"qwen-token-plan","recordCount":20} models= 20 innerProviders= qwen-token-plan baseUrls= https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1
{"fieldCounts":{...},"providerKey":"xai","recordCount":3} models= 3 innerProviders= xai baseUrls= https://api.x.ai/v1
total model records: 608
model field union: api,baseUrl,contextWindow,cost,id,input,maxTokens,provider,reasoning,thinkingLevelMap
cost keys: input,output
exit=0
```

(`fieldCounts` for providers not used by any binding are elided as `{...}` here only for width. They are unchanged in the source and reproduce by re-running the command. The public `baseUrl` values printed are the export's `public baseUrl values`, and none contains userinfo, query, or fragment.)

```
$ node -e '<duplicate identities, checkedAt presence, inner/outer provider consistency>'; echo "exit=$?"
duplicate provider+id identities: 0
records with any checkedAt-like field: 0 provider records with checkedAt: 0
projectionVersion: 1
providers whose inner model.provider != providerKey: 0
exit=0
```

## V§4. AC2 literal resolution (all 15 + Jev observation)

Filter: `cat.providers.flatMap(p => p.models).filter(m => m.provider === PROV && m.id === ID)` (literal, case-sensitive; equivalent to the D-c1 PowerShell shape). Diagnostics per binding: same id under other providers; case-folded near-match; `:`/`-`/`.` suffix variants; and, for zero matches, same-provider ids sharing the stem.

```
$ node -e '<resolve 15 bindings + JEV>'; echo "exit=$?"
#1 [AC2b] opencode/claude-opus-5-5 -> matches=0 verdict=ZERO_MATCH
   same-id-other-provider: []
   case-folded-near-match: []
   suffix-variants(:,-,.): []
   same-provider-family-ids: ["claude-opus-4-5","claude-opus-4-6","claude-opus-4-7","claude-opus-4-8","claude-opus-5"]

#2 [AC2a] opencode/gpt-6-astra -> matches=1 verdict=RESOLVED
   providers[8](opencode).models[47] {"api":"openai-responses","baseUrl":"https://opencode.ai/zen/v1","contextWindow":1050000,"cost":{"input":{"unit":"USD per 1M tokens","value":10},"output":{"unit":"USD per 1M tokens","value":50}},"id":"gpt-6-astra","input":["image","text"],"maxTokens":128000,"provider":"opencode","reasoning":true,"thinkingLevelMap":{"high":"high","low":"low","max":"max","medium":"medium","minimal":null,"off":null,"xhigh":"xhigh"}}
   same-id-other-provider: ["openai/gpt-6-astra @https://api.openai.com/v1","openai-codex/gpt-6-astra @https://chatgpt.com/backend-api"]
   case-folded-near-match: []
   suffix-variants(:,-,.): []

#3 [AC2a] opencode/gpt-5.6-sol -> matches=1 verdict=RESOLVED
   providers[8](opencode).models[45] {"api":"openai-responses","baseUrl":"https://opencode.ai/zen/v1","contextWindow":1050000,"cost":{"input":{"unit":"USD per 1M tokens","value":4},"output":{"unit":"USD per 1M tokens","value":20}},"id":"gpt-5.6-sol","input":["image","text"],"maxTokens":128000,"provider":"opencode","reasoning":true,"thinkingLevelMap":{"high":"high","low":"low","max":"max","medium":"medium","minimal":null,"off":null,"xhigh":"xhigh"}}
   same-id-other-provider: ["openai/gpt-5.6-sol @https://api.openai.com/v1","openai-codex/gpt-5.6-sol @https://chatgpt.com/backend-api"]
   case-folded-near-match: []
   suffix-variants(:,-,.): []

#4 [AC2a] opencode/claude-sonnet-5 -> matches=1 verdict=RESOLVED
   providers[8](opencode).models[12] {"api":"anthropic-messages","baseUrl":"https://opencode.ai/zen","contextWindow":1000000,"cost":{"input":{"unit":"USD per 1M tokens","value":2},"output":{"unit":"USD per 1M tokens","value":10}},"id":"claude-sonnet-5","input":["image","text"],"maxTokens":128000,"provider":"opencode","reasoning":true,"thinkingLevelMap":{"max":"max","xhigh":"xhigh"}}
   same-id-other-provider: ["anthropic/claude-sonnet-5 @https://api.anthropic.com"]
   case-folded-near-match: []
   suffix-variants(:,-,.): []

#5 [AC2a] opencode/deepseek-v4-pro -> matches=1 verdict=RESOLVED
   providers[8](opencode).models[15] {"api":"openai-completions","baseUrl":"https://opencode.ai/zen/v1","contextWindow":1000000,"cost":{"input":{"unit":"USD per 1M tokens","value":1.74},"output":{"unit":"USD per 1M tokens","value":3.84}},"id":"deepseek-v4-pro","input":["text"],"maxTokens":384000,"provider":"opencode","reasoning":true,"thinkingLevelMap":{"high":"high","low":null,"max":"max","medium":null,"minimal":null,"off":null,"xhigh":null}}
   same-id-other-provider: ["deepseek/deepseek-v4-pro @https://api.deepseek.com","opencode-go/deepseek-v4-pro @https://opencode.ai/zen/go/v1","qwen-token-plan/deepseek-v4-pro @https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1"]
   case-folded-near-match: []
   suffix-variants(:,-,.): ["qwen-token-plan/deepseek-v4-pro-0813"]

#6 [AC2a] opencode/gpt-5.6-terra -> matches=1 verdict=RESOLVED
   providers[8](opencode).models[46] {"api":"openai-responses","baseUrl":"https://opencode.ai/zen/v1","contextWindow":1050000,"cost":{"input":{"unit":"USD per 1M tokens","value":2.5},"output":{"unit":"USD per 1M tokens","value":15}},"id":"gpt-5.6-terra","input":["image","text"],"maxTokens":128000,"provider":"opencode","reasoning":true,"thinkingLevelMap":{"high":"high","low":"low","max":"max","medium":"medium","minimal":null,"off":null,"xhigh":"xhigh"}}
   same-id-other-provider: ["openai/gpt-5.6-terra @https://api.openai.com/v1","openai-codex/gpt-5.6-terra @https://chatgpt.com/backend-api"]
   case-folded-near-match: []
   suffix-variants(:,-,.): []

#7 [AC2a] opencode/qwen3.8-flash -> matches=0 verdict=ZERO_MATCH
   same-id-other-provider: ["opencode-go/qwen3.8-flash @https://opencode.ai/zen/go","qwen-token-plan/qwen3.8-flash @https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1"]
   case-folded-near-match: []
   suffix-variants(:,-,.): []
   same-provider-family-ids: ["qwen3.5-plus","qwen3.6-plus"]

#8 [AC2a] opencode/glm-5.3-flash -> matches=1 verdict=RESOLVED
   providers[8](opencode).models[27] {"api":"openai-completions","baseUrl":"https://opencode.ai/zen/v1","contextWindow":1000000,"cost":{"input":{"unit":"USD per 1M tokens","value":0.15},"output":{"unit":"USD per 1M tokens","value":0.5}},"id":"glm-5.3-flash","input":["image","text"],"maxTokens":131072,"provider":"opencode","reasoning":true,"thinkingLevelMap":{"high":"high","low":"low","max":"max","medium":null,"minimal":null,"off":null,"xhigh":null}}
   same-id-other-provider: ["opencode-go/glm-5.3-flash @https://opencode.ai/zen/go/v1"]
   case-folded-near-match: []
   suffix-variants(:,-,.): []

#9 [AC2a] openrouter/openai/gpt-6-astra -> matches=1 verdict=RESOLVED
   providers[10](openrouter).models[252] {"api":"openai-completions","baseUrl":"https://openrouter.ai/api/v1","contextWindow":1050000,"cost":{"input":{"unit":"USD per 1M tokens","value":10},"output":{"unit":"USD per 1M tokens","value":50}},"id":"openai/gpt-6-astra","input":["image","text"],"maxTokens":128000,"provider":"openrouter","reasoning":true,"thinkingLevelMap":{"high":"high","low":"low","max":"max","medium":"medium","minimal":null,"off":null,"xhigh":"xhigh"}}
   same-id-other-provider: []
   case-folded-near-match: []
   suffix-variants(:,-,.): ["openrouter/openai/gpt-6-astra-pro","openrouter/openai/gpt-6-astra-pro:batch","openrouter/openai/gpt-6-astra:batch"]

#10 [AC2b] openrouter/anthropic/claude-opus-5.5 -> matches=0 verdict=ZERO_MATCH
   same-id-other-provider: []
   case-folded-near-match: []
   suffix-variants(:,-,.): []
   same-provider-family-ids: ["~anthropic/claude-opus-latest","anthropic/claude-opus-4","anthropic/claude-opus-4.1","anthropic/claude-opus-4.1:batch","anthropic/claude-opus-4.5","anthropic/claude-opus-4.5:batch","anthropic/claude-opus-4.6","anthropic/claude-opus-4.6:batch","anthropic/claude-opus-4.7","anthropic/claude-opus-4.7:batch","anthropic/claude-opus-4.8","anthropic/claude-opus-4.8:batch","anthropic/claude-opus-5","anthropic/claude-opus-5:batch"]

#11 [AC2a] openrouter/anthropic/claude-sonnet-5 -> matches=1 verdict=RESOLVED
   providers[10](openrouter).models[51] {"api":"anthropic-messages","baseUrl":"https://openrouter.ai/api","contextWindow":1000000,"cost":{"input":{"unit":"USD per 1M tokens","value":2},"output":{"unit":"USD per 1M tokens","value":10}},"id":"anthropic/claude-sonnet-5","input":["image","text"],"maxTokens":128000,"provider":"openrouter","reasoning":true,"thinkingLevelMap":{"high":"high","low":"low","max":"max","medium":"medium","minimal":null,"off":"none","xhigh":"xhigh"}}
   same-id-other-provider: []
   case-folded-near-match: []
   suffix-variants(:,-,.): ["openrouter/anthropic/claude-sonnet-5:batch"]

#12 [AC2a] openrouter/openai/gpt-5.6-sol -> matches=1 verdict=RESOLVED
   providers[10](openrouter).models[244] {"api":"openai-completions","baseUrl":"https://openrouter.ai/api/v1","contextWindow":1050000,"cost":{"input":{"unit":"USD per 1M tokens","value":2},"output":{"unit":"USD per 1M tokens","value":10}},"id":"openai/gpt-5.6-sol","input":["image","text"],"maxTokens":128000,"provider":"openrouter","reasoning":true,"thinkingLevelMap":{"high":"high","low":"low","max":"max","medium":"medium","minimal":null,"off":"none","xhigh":"xhigh"}}
   same-id-other-provider: []
   case-folded-near-match: []
   suffix-variants(:,-,.): ["openrouter/openai/gpt-5.6-sol-pro","openrouter/openai/gpt-5.6-sol-pro:batch","openrouter/openai/gpt-5.6-sol:batch"]

#13 [AC2a] openrouter/openai/gpt-5.6-terra -> matches=1 verdict=RESOLVED
   providers[10](openrouter).models[248] {"api":"openai-completions","baseUrl":"https://openrouter.ai/api/v1","contextWindow":1050000,"cost":{"input":{"unit":"USD per 1M tokens","value":2},"output":{"unit":"USD per 1M tokens","value":12}},"id":"openai/gpt-5.6-terra","input":["image","text"],"maxTokens":128000,"provider":"openrouter","reasoning":true,"thinkingLevelMap":{"high":"high","low":"low","max":"max","medium":"medium","minimal":null,"off":"none","xhigh":"xhigh"}}
   same-id-other-provider: []
   case-folded-near-match: []
   suffix-variants(:,-,.): ["openrouter/openai/gpt-5.6-terra-pro","openrouter/openai/gpt-5.6-terra-pro:batch","openrouter/openai/gpt-5.6-terra:batch"]

#14 [AC2a] openrouter/google/gemini-3.8-flash -> matches=1 verdict=RESOLVED
   providers[10](openrouter).models[107] {"api":"openai-completions","baseUrl":"https://openrouter.ai/api/v1","contextWindow":1048576,"cost":{"input":{"unit":"USD per 1M tokens","value":0.75},"output":{"unit":"USD per 1M tokens","value":3.75}},"id":"google/gemini-3.8-flash","input":["image","text"],"maxTokens":65536,"provider":"openrouter","reasoning":true,"thinkingLevelMap":{"high":"high","low":"low","max":null,"medium":"medium","minimal":null,"off":null,"xhigh":null}}
   same-id-other-provider: []
   case-folded-near-match: []
   suffix-variants(:,-,.): ["openrouter/google/gemini-3.8-flash:batch"]

#15 [AC2a] openrouter/anthropic/claude-haiku-4.5 -> matches=1 verdict=RESOLVED
   providers[10](openrouter).models[31] {"api":"anthropic-messages","baseUrl":"https://openrouter.ai/api","contextWindow":200000,"cost":{"input":{"unit":"USD per 1M tokens","value":1},"output":{"unit":"USD per 1M tokens","value":5}},"id":"anthropic/claude-haiku-4.5","input":["image","text"],"maxTokens":64000,"provider":"openrouter","reasoning":true}
   same-id-other-provider: []
   case-folded-near-match: []
   suffix-variants(:,-,.): ["openrouter/anthropic/claude-haiku-4.5:batch"]

#JEV [excluded] openrouter/typesafe/jev-1.13 -> matches=0 verdict=ZERO_MATCH
   same-id-other-provider: []
   case-folded-near-match: []
   suffix-variants(:,-,.): []
   same-provider-family-ids: []
exit=0
```

Tally:

- **AC2a: 13 attempted = 12 literal resolutions** (2, 3, 4, 5, 6, 8, 9, 11, 12, 13, 14, 15) **+ 1 documented `AC2A_ZERO_MATCH`** (binding 7; Amendment 04 D-b1).
- **AC2b: 2** (1, 10), each `OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY`. Zero match expected and non-authoritative.
- `13 + 2 = 15`.
- No `AC2A_MULTI_MATCH`, no catalogue-internal `AC2A_URL_MISMATCH`, no variant resolved.
- Jev: observation only (0 records).

**Vendor-prefixed record observation (rework R5).** The `#7` diagnostics above
match only on the exact id, so they missed one record whose id carries a vendor
prefix. A substring query for every record whose id contains `qwen3.8-flash`
(read-only; rework session):

```
$ node -v; echo "node exit=$?"; node -e '<every record whose id matches /qwen3\.8-flash/, with locator>'; echo "exit=$?"
v24.7.0
node exit=0
providers[9](opencode-go).models[25] opencode-go qwen3.8-flash https://opencode.ai/zen/go anthropic-messages
providers[10](openrouter).models[331] openrouter qwen/qwen3.8-flash https://openrouter.ai/api/v1 openai-completions
providers[11](qwen-token-plan).models[18] qwen-token-plan qwen3.8-flash https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1 openai-completions
exit=0
```

`openrouter` / `qwen/qwen3.8-flash` (`providers[10](openrouter).models[331]`) is
an **observation only**. It is a **different provider** (`openrouter`, not
`opencode`) with a **vendor-prefixed id** (`qwen/…`). It is **not** binding 7,
it is **never** aliased to binding 7 by stripping or appending a prefix, and it
does not change binding 7's `AC2A_ZERO_MATCH`. Negative cases N13 (append) and
N14 (strip) in V§8 show that prefix aliasing refuses with
`AC2A_PREFIX_ALIAS_REFUSED`; control N13b shows the record exists only under
its own literal identity.

## V§5. AC4 enablement and AC3 export facts

```
$ node -e '<enabledModels vs 15 bindings; Jev in settings/manifest>'; echo "exit=$?"
#1 opencode:claude-opus-5-5 enabled=false
#2 opencode:gpt-6-astra enabled=false
#3 opencode:gpt-5.6-sol enabled=false
#4 opencode:claude-sonnet-5 enabled=false
#5 opencode:deepseek-v4-pro enabled=false
#6 opencode:gpt-5.6-terra enabled=false
#7 opencode:qwen3.8-flash enabled=false
#8 opencode:glm-5.3-flash enabled=false
#9 openrouter:openai/gpt-6-astra enabled=false
#10 openrouter:anthropic/claude-opus-5.5 enabled=false
#11 openrouter:anthropic/claude-sonnet-5 enabled=false
#12 openrouter:openai/gpt-5.6-sol enabled=false
#13 openrouter:openai/gpt-5.6-terra enabled=false
#14 openrouter:google/gemini-3.8-flash enabled=false
#15 openrouter:anthropic/claude-haiku-4.5 enabled=false
ENABLED 0 of 15; NOT ENABLED 15 of 15
enabledModels: ["opencode:qwen/qwen-2.5-coder-32b","opencode:deepseek/deepseek-r1-distill-qwen-32b","openrouter:anthropic/claude-3.5-sonnet","openrouter:openai/gpt-4o-mini","openrouter:typesafe/jev-1.13"]
enabled entries that are AC2 bindings: 0
JEV in enabledModels: true
JEV in manifest openrouterMissingRequiredIdentities: true
JEV in manifest openrouterObservedRequiredIdentities: false
manifest duplicateProviderModelIdentities: []
anthropic/claude-opus-5.5 in manifest required: false | anthropic/claude-opus-5 in observed: true
settings providers: [{"baseUrl":"https://opencode.ai/zen/go/v1","providerKey":"opencode"},{"baseUrl":"https://openrouter.ai/api/v1","providerKey":"openrouter"}]
defaults: opencode qwen/qwen-2.5-coder-32b minimal
exit=0
```

## V§6. Select-String checks (PowerShell 7) and source lookups

```
PS> Select-String -LiteralPath plugins/foreman-line/docs/goals/routing-currency-and-merit/host-owner-export/settings-projection.json -Pattern 'jev-1\.13' -CaseSensitive
plugins\foreman-line\docs\goals\routing-currency-and-merit\host-owner-export\settings-projection.json:10:    "openrouter:typesafe/jev-1.13"

PS> Select-String -LiteralPath plugins/foreman-line/docs/goals/routing-currency-and-merit/host-owner-export/export-manifest.json -Pattern 'jev-1\.13' -CaseSensitive
plugins\foreman-line\docs\goals\routing-currency-and-merit\host-owner-export\export-manifest.json:12:      "typesafe/jev-1.13"
plugins\foreman-line\docs\goals\routing-currency-and-merit\host-owner-export\export-manifest.json:45:      "typesafe/jev-1.13",

PS> Select-String -LiteralPath plugins/foreman-line/routing-policy/routing-policy.yaml -Pattern 'jev' -CaseSensitive
(PowerShell completed with no output)

PS> Select-String -LiteralPath plugins/foreman-line/routing-policy/routing-policy.yaml -Pattern 'roles:|model_tiers:|ORDER IS'
plugins\foreman-line\routing-policy\routing-policy.yaml:139:roles:
plugins\foreman-line\routing-policy\routing-policy.yaml:144:model_tiers:
plugins\foreman-line\routing-policy\routing-policy.yaml:151:  # ORDER IS THE SELECTION RULE. The dispatcher (dispatch/src/routing-eval)

PS> Select-String -LiteralPath plugins/foreman-line/routing-policy/src/validator.ts -Pattern 'claude-opus'
plugins\foreman-line\routing-policy\src\validator.ts:48:  'anthropic/claude-opus-5.5',
```

Case-insensitive search for `jev` across `plugins/foreman-line/routing-policy/` (ripgrep via the harness Grep tool, read-only) — every match:

```
routing-policy\README.md:65:contains the exact OpenRouter model id `typesafe/jev-1.13`. The capability
routing-policy\README.md:66:validator keeps Jev limited to `routing` and `classification` lanes with
routing-policy\src\pi-openrouter.ts:48:  'typesafe/jev-1.13',
routing-policy\src\pi-openrouter.ts:74:    // Jev is a TypeSafe System One structured-decision model. It may propose
routing-policy\src\pi-openrouter.ts:77:    'typesafe/jev-1.13': {
routing-policy\tests\semantic-invariants.test.ts:254:test('Pi/OpenRouter config uses the verified base URL and exact Jev model id', () => {
routing-policy\tests\semantic-invariants.test.ts:256:  assert.ok(PI_OPENROUTER_ROUTING.enabledModels.includes('typesafe/jev-1.13'))
routing-policy\tests\semantic-invariants.test.ts:257:  assert.ok(PI_OPENROUTER_ROUTING.models['typesafe/jev-1.13'])
routing-policy\tests\semantic-invariants.test.ts:260:test('Jev is limited to fast structured routing/classification recommendations', () => {
routing-policy\tests\semantic-invariants.test.ts:261:  const jev = PI_OPENROUTER_ROUTING.models['typesafe/jev-1.13']
routing-policy\tests\semantic-invariants.test.ts:262:  assert.ok(jev)
routing-policy\tests\semantic-invariants.test.ts:263:  assert.deepEqual(jev.capabilities, ['routing', 'classification', 'structured-decision'])
routing-policy\tests\semantic-invariants.test.ts:264:  assert.deepEqual(jev.allowedLanes, ['routing', 'classification'])
routing-policy\tests\semantic-invariants.test.ts:265:  assert.equal(jev.authority, 'recommend-only')
routing-policy\tests\semantic-invariants.test.ts:273:    assert.ok(jev.prohibitedLanes.includes(lane), `Jev must prohibit ${lane}`)
routing-policy\tests\pi-openrouter.test.ts:38:test('Jev capability contract rejects control-plane or prose/implementation use', () => {
routing-policy\tests\pi-openrouter.test.ts:42:  const jev = invalid.models['typesafe/jev-1.13']
routing-policy\tests\pi-openrouter.test.ts:43:  assert.ok(jev)
routing-policy\tests\pi-openrouter.test.ts:44:  jev.authority = 'execution'
routing-policy\tests\pi-openrouter.test.ts:45:  jev.allowedLanes = ['implementation']
routing-policy\tests\pi-openrouter.test.ts:46:  jev.prohibitedLanes = ['approval']
```

```
$ git grep -n "jev-1.13\|baseUrl" -- plugins/foreman-line/templates/pi-openrouter-routing.json; echo "exit=$?"
plugins/foreman-line/templates/pi-openrouter-routing.json:4:  "baseUrl": "https://openrouter.ai/api/v1",
plugins/foreman-line/templates/pi-openrouter-routing.json:9:    "typesafe/jev-1.13"
plugins/foreman-line/templates/pi-openrouter-routing.json:30:    "typesafe/jev-1.13": {
exit=0
```

Contract `baseUrl` constant: `routing-policy/src/pi-openrouter.ts` lines 39 and 53 (`'https://openrouter.ai/api/v1'`) and schema `const` line 151 — read with the harness Read tool, no execution. `KNOWN_FRONTIER_MODELS`: `validator.ts` lines 47–54. `roles:` / `classes:` / `model_tiers:` / `data_classification:`: `routing-policy.yaml` lines 17–32, 34–137, 139–142, 144–194 (read only). No routing evaluator, `prepareDispatch`, or `executeDispatch` was invoked.

## V§7. Endpoint pattern (for Amendment 04 D-a1 findings)

```
$ node -e '<api × baseUrl tally for opencode, opencode-go, openrouter>'; echo "exit=$?"
opencode {"openai-completions @ https://opencode.ai/zen/v1":20,"anthropic-messages @ https://opencode.ai/zen":14,"google-generative-ai @ https://opencode.ai/zen/v1":7,"openai-responses @ https://opencode.ai/zen/v1":27}
opencode-go {"openai-completions @ https://opencode.ai/zen/go/v1":21,"openai-responses @ https://opencode.ai/zen/go/v1":4,"anthropic-messages @ https://opencode.ai/zen/go":2}
openrouter {"openai-completions @ https://openrouter.ai/api/v1":363,"anthropic-messages @ https://openrouter.ai/api":15}
exit=0
```

Findings SCF-1 (bindings 2, 3, 5, 6, 8), SCF-2 (binding 4), and SCF-3 (bindings 11, 15) are in `pmc-p0-capability-baseline.md` §3. They are `static-conformance` findings for PMC-P1/PMC-P2 and **not** refusals or stops.

## V§8. Negative cases (in-memory copies of safe facts only; no source mutated)

**Negative-case count: before rework 12 (N1–N12); after rework 14 (N1–N14).**
Controls (N3b, N6b, N9b, N13b) are not counted. The count did not decrease.

Rerun in the rework session. The script is an inline `node -e` program; no
file was written. It asserts every expected result and exits 1 on any
mismatch. Refusals are now emitted as a **set of distinct names** (rework R3):
`AC2A_ZERO_MATCH` records that the literal query matched 0 records, and each
distinct diagnosed condition adds its own name — `AC2A_WRONG_PROVIDER`,
`AC2A_CASE_MISMATCH`, `AC2A_PREFIX_ALIAS_REFUSED`. No condition is folded into
another's name.

The first rework run exited 1 on two cases, **N3** and **N14**. In both, the
expectation was incomplete; the resolver was right. N3 (binding 7) also carries
`AC2A_PREFIX_ALIAS_REFUSED`, because `openrouter/qwen/qwen3.8-flash` ends in
`/qwen3.8-flash`. N14's id `openai/gpt-5.6-sol` also exists literally under
`openrouter`, so it also carries `AC2A_WRONG_PROVIDER`. The expectations were
corrected to the observed, correct refusal sets and the script rerun. The
second run's output is below:

```
$ node -e '<literal resolver + freshness + facts + digest checks on deep copies, with assertions>'; echo "exit=$?"
N1 absent identity (opencode/does-not-exist-9) => {"refusals":["AC2A_ZERO_MATCH"]} PASS
N2 duplicate identity (in-memory dup of opencode/gpt-5.6-sol, same baseUrl) => {"refusals":["AC2A_MULTI_MATCH"],"count":2} PASS
N3 same id under another provider (opencode/qwen3.8-flash = binding 7) => {"refusals":["AC2A_ZERO_MATCH","AC2A_WRONG_PROVIDER","AC2A_PREFIX_ALIAS_REFUSED"],"otherProviders":["opencode-go","qwen-token-plan"],"prefixAliasRecords":["openrouter/qwen/qwen3.8-flash"]} PASS
N3b control: opencode-go/qwen3.8-flash exists but is NOT binding 7 (never aliased) => {"resolved":true,"provider":"opencode-go","id":"qwen3.8-flash","baseUrl":"https://opencode.ai/zen/go"} PASS
N4 :batch variant (openrouter/anthropic/claude-sonnet-5:batch; record exists literally) => {"refusals":["AC2A_VARIANT_SUFFIX_REFUSED"]} PASS
N5 baseUrl trailing-slash mismatch within one identity (in-memory) => {"refusals":["AC2A_URL_MISMATCH"],"urls":["https://openrouter.ai/api/v1","https://openrouter.ai/api/v1/"]} PASS
N6 baseUrl different-path mismatch within one identity (in-memory) => {"refusals":["AC2A_URL_MISMATCH"],"urls":["https://openrouter.ai/api/v1","https://openrouter.ai/api"]} PASS
N6b control: catalogue-vs-settings divergence is NOT a refusal (binding 11) => {"resolved":true,"provider":"openrouter","id":"anthropic/claude-sonnet-5","baseUrl":"https://openrouter.ai/api"} PASS
N7 case-folded near-match (openrouter/Anthropic/Claude-Sonnet-5) => {"refusals":["AC2A_ZERO_MATCH","AC2A_CASE_MISMATCH"]} PASS
N8 stale timestamp (checkedAt 2026-01-01, acquisition 2026-09-20T17:01:26.485Z, test bound 7d) => "FRESHNESS_STALE_REFUSED" PASS
N9 future timestamp (checkedAt 2027-01-01) => "FRESHNESS_FUTURE_REFUSED" PASS
N9b control: real records carry no checkedAt => "unknown" PASS
N10 absent thinkingLevelMap (real record openrouter/anthropic/claude-haiku-4.5) => {"thinkingLevelMap":"unknown (THINKING_MAP_ABSENT)","costIn":{"unit":"USD per 1M tokens","value":1},"checkedAt":"unknown"} PASS
N11 unknown cost unit (in-memory copy, unit=credits) => {"thinkingLevelMap":"present","costIn":{"value":2,"unit":"COST_UNIT_UNKNOWN"},"checkedAt":"unknown"} PASS
N12 changed digest (in-memory byte flip at offset 100 of catalog copy) => "DIGEST_MISMATCH_REFUSED actual=dda6618ea6c69c2bd62d7085ccd4c3d8892d26ad6794ff96162d35a4a61e5e37" PASS
N13 alias by vendor-prefix APPEND (openrouter/qwen3.8-flash; only openrouter/qwen/qwen3.8-flash exists) => {"refusals":["AC2A_ZERO_MATCH","AC2A_WRONG_PROVIDER","AC2A_PREFIX_ALIAS_REFUSED"],"otherProviders":["opencode-go","qwen-token-plan"],"prefixAliasRecords":["openrouter/qwen/qwen3.8-flash"]} PASS
N13b control: openrouter/qwen/qwen3.8-flash resolves literally; DIFFERENT provider+id, NOT binding 7 => {"resolved":true,"provider":"openrouter","id":"qwen/qwen3.8-flash","baseUrl":"https://openrouter.ai/api/v1"} PASS
N14 alias by vendor-prefix STRIP (opencode/openai/gpt-5.6-sol; stripped id gpt-5.6-sol exists under opencode) => {"refusals":["AC2A_ZERO_MATCH","AC2A_WRONG_PROVIDER","AC2A_PREFIX_ALIAS_REFUSED"],"otherProviders":["openrouter"],"prefixAliasRecords":["openai/gpt-5.6-sol","openai-codex/gpt-5.6-sol","opencode/gpt-5.6-sol"]} PASS
negative cases counted (N-numbered, excl. b-controls): 14; checks pass=18 fail=0
post-test source catalog sha256 (unchanged check): b0c2dc8cf1412773b4ed4f17fcba10634a997f3b2b2b960d6dca200bdbb171fe
exit=0
```

(N12's flipped-copy digest differs from the original run's `0d017e4b…` because
the rework flips a fixed, stated offset (100). Both are `DIGEST_MISMATCH_REFUSED`.)

Every required negative case produced an explicit named refusal:

- absent identity → `AC2A_ZERO_MATCH` only;
- duplicate identity → `AC2A_MULTI_MATCH`;
- same id under another provider → `AC2A_WRONG_PROVIDER` (distinct name; with `AC2A_ZERO_MATCH` for the literal count);
- `:batch` variant → `AC2A_VARIANT_SUFFIX_REFUSED`;
- trailing-slash and different-path `baseUrl` mismatch within one identity → `AC2A_URL_MISMATCH`;
- case-folded near-match → `AC2A_CASE_MISMATCH` (distinct name; with `AC2A_ZERO_MATCH`);
- stale and future timestamps → `FRESHNESS_STALE_REFUSED`, `FRESHNESS_FUTURE_REFUSED`;
- absent `thinkingLevelMap` → `unknown (THINKING_MAP_ABSENT)`;
- unknown cost unit → `COST_UNIT_UNKNOWN`;
- changed digest → `DIGEST_MISMATCH_REFUSED`;
- **alias by vendor-prefix append or strip** (new, rework R5) → `AC2A_PREFIX_ALIAS_REFUSED` (N13, N14).

Missing optional facts come out `unknown`. Controls:

- **N3b** shows the `opencode-go` record exists and is **not** used for binding 7.
- **N6b** shows that D-a1 divergence resolves and is not refused.
- **N13b** shows `openrouter/qwen/qwen3.8-flash` resolves only under its own literal identity; it is a different provider and id, not binding 7.

The 7-day bound in N8 is a test parameter only; no freshness bound is accepted
(H-FRESH). The acquisition time is fixed to the export's `generatedAtUtc`, so
the result is deterministic.

## V§9. Artifact digests

**After rework (current):**

| Artifact | Bytes | SHA-256 |
|---|---|---|
| `pmc-p0-capability-baseline.md` | 24661 | `32b868cf6cb048e2bd21518b99293940c9812925264ae60dadc075acc526e1db` |
| `pmc-p0-suitability-rubric.md` | 22366 | `0a3e3b4f44f77ade039cc67be0ff32f6d69b45e122369e1ec55910a9f6481139` |
| `pmc-p0-role-lane-map.md` | 11867 | `9545043658708d7017ed59a3c51133da869111aa186c7aff8709e0c14281aaaa` (superseded `2691ea3e…` by the A5.4 ratification edit 2026-09-25) |
| `pmc-p0-verification.md` | see self-digest below | normalized self-digest `13c3e7041fcfe6cb5eaaf841bb0b538d7844925756aa5a4b4047f696c09445dd` |

**Self-digest convention.** A file cannot contain its own raw SHA-256. The
value above is the SHA-256 of this file with that 64-character value replaced
by 64 ASCII `0` characters. To verify it, restore the zeros and hash. The
raw on-disk SHA-256 of the final file is reported in the builder's completion
claim.

Superseded (original evidence run, before rework): baseline 23087 B
`71c5f54f…ce59ff`; rubric 13938 B `4f7ccb91…8c8c`; role map 11197 B
`d5c1d914…78af`.

Superseded (first rework): rubric 19387 B `21025147…b01e89e` and
verification self-digest `f57412d8…20d75d1` were superseded by the later
rework(s); the rubric and self-digest rows above are the current values.

## V§10. After-state and allowed-path audit

Before (V§1): `git status --short --untracked-files=all` → empty.

After (all four artifacts written):

```
$ git rev-parse --abbrev-ref HEAD; git rev-parse HEAD; git status --short --untracked-files=all; git diff --check; git diff --name-only; git ls-files --others --exclude-standard; <node allowlist audit>; <node export re-hash>; sha256sum <spec>
codex/pmc-p0-evidence
exit=0
deef24bd8d1ea01e833f76351cadd91f5bc23d48
exit=0
?? plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-capability-baseline.md
?? plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-role-lane-map.md
?? plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-suitability-rubric.md
?? plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-verification.md
status exit=0
diffcheck exit=0
diff-name-only(tracked) exit=0
plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-capability-baseline.md
plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-role-lane-map.md
plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-suitability-rubric.md
plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-verification.md
untracked exit=0
changed paths: 4
outside allowlist: []
allowlisted not present: []
audit exit=0
catalog-projection.json b0c2dc8cf1412773b4ed4f17fcba10634a997f3b2b2b960d6dca200bdbb171fe
settings-projection.json 1024154d7245a52fb3cb82b3c8105a2249d5406daee03498f99cbed8ed137d1e
export-manifest.json aa9b03faff555c6f5e98fd06b0f6e940269a5393f846877f57af562d1df692c3
export-recheck exit=0
133a7690b865d460586e77fb3ee5440116513272db299eceb52b09f8f81b72eb *plugins/foreman-line/docs/specs/active/PMC-P0-pi-capability-and-catalogue-baseline.md
exit=0
```

Audit results:

- **Diff scope:** the diff is exactly the four Allowed Files, all untracked and new. `git diff --name-only` lists no tracked file, so nothing tracked was modified: not the spec, charter, amendments, lint, loop directive, INDEX, the RCM tree or export, routing-policy, or templates.
- **Unchanged state:** HEAD is unchanged (`deef24b…`). The export digests and the spec digest are unchanged.
- **No git writes:** there was no `git add`, commit, stash, reset, or branch change.
- **Timing:** this section was written after the command ran. Editing this file does not change the four-path set.
- **Superseded HEAD (cross-reference):** the HEAD shown above (`deef24b…`) is the pre-rework HEAD. It is superseded by V§14, whose rework ran at HEAD `e9cd2b6…`. HEAD moves further under coordinator bookkeeping commits only. **The git-state gate is the four untouched, untracked artifact files, never the commit SHA.**

## V§11. AC-by-AC evidence map

| AC | Claim | Evidence |
|---|---|---|
| AC1 provenance | every fact cites path + locator + digest + command/raw output/exit | capability-baseline §1 (digests, locator form), per-row locators §2; V§2–V§8 raw output; sources re-read independently (export JSON, yaml, ts, tests), not quoted from spec or lint |
| AC2 identity | 13 AC2a = 12 resolved + 1 `AC2A_ZERO_MATCH` (binding 7); 2 AC2b `OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY` (1, 10); 13+2=15; Jev excluded | capability-baseline §2, §2.1, §2.2, §2.3; V§4 |
| AC2 D-a1 | catalogue `baseUrl` verbatim per binding; divergences SCF-1/2/3 as findings; no catalogue-internal URL mismatch | capability-baseline §2 table, §3; V§3, V§7; N5/N6/N6b |
| AC3 Jev | enabled in settings + listed missing in manifest + 0 catalogue records → confirms M2; code/test/template gap recorded, not fixed; flag F-A on yaml wording | capability-baseline §5; V§5, V§6 |
| AC4 enablement | **0 of 15** enabled; 15 of 15 not; owner PMC-P2 (M4); nothing enabled | capability-baseline §6; V§5 |
| AC5 capability | allowlisted facts for the 12 resolved; `unknown` for 1, 7, 10 and for `checkedAt` on all; tool-use + structured-output **not derivable** → `capability-unverified` for all 15 | capability-baseline §4; V§3, V§4 |
| AC6 rubric | R1–R7 with type/unit/source/refusal/populatability; evidence threshold; A3 selection order (filters → per-lane provider step → R7 → documented stable order, total); L6 total function with termination; R6/R7/R2-tools routed to A6 (coordinator ruling F-C); distinct AC2a refusal names | suitability-rubric §1–§7; V§8 N1–N14 |
| AC7 role map | six lanes → role family/sub-role, routing class, authority cap, frontier/independence/human-gate obligations, provider rule; collisions C1–C11; marked `awaiting-owner-ratification`, not frozen | role-lane-map §1–§4 |
| AC8 verification | this file: commands, versions, exit codes, raw output, artifact digests, before/after status, allowed-path audit, negative cases, AC map, holds; **two reviews pending - coordinator-owned** | V§0–V§14 |

## V§12. Refusals, unknowns, capability-unverified, holds — by name

- **Refusals:** binding 7 `opencode/qwen3.8-flash` → `AC2A_ZERO_MATCH` (acceptable AC2a evidence, D-b1), with its distinct diagnosed conditions `AC2A_WRONG_PROVIDER` and `AC2A_PREFIX_ALIAS_REFUSED` recorded under their own names (V§8 N3). L6 → `LANE_DISABLED_REFUSED` (rubric §5). No other refusal.
- **Observation (not a binding):** `openrouter/qwen/qwen3.8-flash` — a different provider with a vendor-prefixed id, not binding 7 and never aliased (V§4, capability-baseline §2.1).
- **AC2b holds (not refusals):** binding 1 `opencode/claude-opus-5-5`, binding 10 `openrouter/anthropic/claude-opus-5.5` → `OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY`.
- **Excluded observation:** `openrouter/typesafe/jev-1.13`.
- **`unknown`:**
  - every capability field of bindings 1, 7, 10;
  - `checkedAt` for all 15;
  - `thinkingLevelMap` for binding 15;
  - cache costs for all (export-omitted);
  - OpenCode data-class eligibility (bindings 1–8);
  - declared family (R3) for all 15.
- **`capability-unverified`:** tool-use and structured-output for all 15 bindings; binding 7's L5/L6 roles (held).
- **Held to A6 / owners:** H-LIVE, H-QUAL, H-OPUS, H-B7, H-TOOLS, H-SO, H-FRESH, H-ENABLE, H-EP, H-JEV, H-PI (capability-baseline §8).
- **Not rankable today:** all 15 (rubric §3), because R6/R7 are unpopulated.

## V§13. Open flags

- **F-A (AC3 wording):** the spec says `routing-policy/routing-policy.yaml` encodes Jev. The YAML contains no `jev` (case-sensitive and case-insensitive). The encoding is in `routing-policy/src/pi-openrouter.ts`, its two test files, its README, and `templates/pi-openrouter-routing.json`. The gap is real but in a different place; recorded, not reconciled. Coordinator to decide whether AC3's wording needs a correction.
- **F-B (tooling):** the nested `pwsh` launch, and PowerShell commands with `$()` / .NET calls / globs / path arrays, were denied by the session permission layer. The Verification Plan's PowerShell block therefore did not run verbatim. Digests and Select-String ran as single-path PowerShell 7 calls; everything else ran as the spec-permitted equivalent Node scripts. PowerShell calls expose no numeric exit code.
- **F-C (stop-condition reading) — CLOSED by coordinator ruling (2026-09-25).** The stop list includes "a required ranking input that cannot be populated without a provider call". R6 (verified availability), R7 (quality score), and R2 tool-use/structured-output cannot be populated here. **Ruling:** AC6's instruction to route provider-call-only inputs to A6 **governs over** the generic stop condition. For a static-conformance parcel, these inputs being unpopulated is the known, expected state; routing to A6 is correct and is **not** a stop. The ruling is recorded in rubric §6.
- **F-D (Pi semantics):** the spec's Intent names "Pi 0.86.1 configuration semantics". Pi was not launched (prohibited), and `0.86.1` is cited only from the charter/Amendment 01 coordinator lint, not re-verified. Thinking-level handling for unmapped levels, and which catalogue namespace (`opencode` vs `opencode-go`) the host `opencode` registration serves, are held (H-PI, SCF-1/2, capability-baseline §3.1).
- **F-E (tool-use/structured-output source):** no safe field in the frozen export can establish these capabilities (`compat` is explicitly omitted). Closing H-TOOLS/H-SO needs either A6 probes or a new RCM-owned safe export that includes a capability allowlist. That is out of PMC-P0 scope.
- **F-G (refusal-set encoding, rework R3):** distinct AC2a names are kept distinct by emitting a **set**. `AC2A_ZERO_MATCH` records the literal zero count, and each diagnosed condition (`AC2A_WRONG_PROVIDER`, `AC2A_CASE_MISMATCH`, `AC2A_PREFIX_ALIAS_REFUSED`) adds its own name. The set form keeps binding 7's D-b1-fixed name `AC2A_ZERO_MATCH` without folding the wrong-provider condition into it. The alternative is a single most-specific name, which would record binding 7 as `AC2A_WRONG_PROVIDER` and conflict with D-b1. PMC-P1 owns the final encoding; the coordinator may prefer a primary-plus-diagnostics shape.
- **F-H (derived rules in the reworked rubric):** three rules are derived, not quoted:
  - `PINNED_PROVIDER_NO_ELIGIBLE` is a **proposed** name.
  - Rubric §1 term 3 ("a fallback never crosses the pin") and §4 step 1 (the pin is a partition) are derived from A3's "pin a single declared provider … independence does not drift with price".
  - The L3/L4 declared preference is read as an **ordered preference, not a partition**, because A3 says "preference" for standard lanes and "pin" only for frontier/review lanes.

  The coordinator should confirm or correct all three.
- **F-I (tooling, rework session):** this session's permission layer additionally denied `node` invoked from the PowerShell tool, `$PSVersionTable` (.NET member access), multi-path `Get-FileHash`, and a Bash heredoc. The deterministic pass therefore ran as follows (V§14):
  - PowerShell 7.6.6: single-path `Get-FileHash` and `Select-String` calls.
  - Git Bash: `node -v` first, then git state, export digests, AC2, and enablement, via inline `node -e`.

  Same shape as F-B.
- **F-F (manifest pre-dates Amendment 03):** `openrouterRequiredIdentities` still lists `anthropic/claude-opus-5`, not `-5.5`. This is consistent with the AC2b stale-export expectation and is not a contradiction; recorded for the RCM export owner.

## V§14. Rework record (2026-09-25; triage R1–R5, B5, B6)

**Step 0 (before any edit).** Worktree `D:/Repos/wt-pmc-p0`, branch
`codex/pmc-p0-evidence`, HEAD `e9cd2b6994b632c40032bf4421c3b9713c302d0d`.
`git status --short` showed exactly the four artifacts as `??`. Spec SHA-256
`133a7690…72eb` and brief SHA-256 `f953f8ab…aa941` (10014 bytes) matched.
Negative-case count before: **12** (N1–N12).

**Chips applied** (sections changed):

- **R1:** rubric §1 adds term 3 (per-lane provider step) and an L5 note; rubric §2 preamble assigns input roles (R1–R4, R6 filters; R5 filter plus dominant L5 key; R7 quality key); rubric §4 is rewritten as the A3 selection order. The contradictory "equal on all ordering keys" preamble is deleted.
- **R2:** rubric §6 prose now matches its table, and records coordinator ruling F-C; V§13 F-C is closed.
- **R3:** distinct names `AC2A_WRONG_PROVIDER`, `AC2A_CASE_MISMATCH`, `AC2A_PREFIX_ALIAS_REFUSED` appear in rubric §7 (table), capability-baseline §2 row 7 and §2.1, and V§8 and V§12.
- **R4:** the L3 declared preference is labelled an EXTENSION of A3 in rubric §4 step 1, role-map §2 (L3 row), and role-map §4 item 3. L4 is labelled A3-direct.
- **R5:** `openrouter/qwen/qwen3.8-flash` is recorded as an observation in capability-baseline §2.1 and §3.2, V§4, and V§12. Negative cases N13 (append), N14 (strip), and control N13b are added in V§8.
- **B5:** capability-baseline §2.1 is scoped to "in the frozen, freshness-unaccepted export".
- **B6:** rubric §6 R6 row drops "/enablement" and states that enablement is statically observable (AC4).
- **Opportunistic INFO fixes:**
  - R6: role-map C5 now gives bindings 2 and 9 their exact roles.
  - R8: rubric §5 termination bullet reworded.

**Tripwire:** negative-case count **before 12 → after 14**. It did not decrease.

**Deterministic pass (rework).** Node and git ran first, in Git Bash; `node -v`
came first:

```
$ node -v; echo "node exit=$?"; git rev-parse --abbrev-ref HEAD; git rev-parse HEAD; echo "git exit=$?"; git status --short --untracked-files=all; echo "status exit=$?"; git diff --check; echo "diffcheck exit=$?"; node -e '<export digests (exit 1 on mismatch); AC2 literal resolution x15; enablement; prefixed-record observation>'; echo "node-pass exit=$?"
v24.7.0
node exit=0
codex/pmc-p0-evidence
e9cd2b6994b632c40032bf4421c3b9713c302d0d
git exit=0
?? plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-capability-baseline.md
?? plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-role-lane-map.md
?? plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-suitability-rubric.md
?? plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-verification.md
status exit=0
diffcheck exit=0
catalog-projection.json actual=b0c2dc8cf1412773b4ed4f17fcba10634a997f3b2b2b960d6dca200bdbb171fe match=true
settings-projection.json actual=1024154d7245a52fb3cb82b3c8105a2249d5406daee03498f99cbed8ed137d1e match=true
export-manifest.json actual=aa9b03faff555c6f5e98fd06b0f6e940269a5393f846877f57af562d1df692c3 match=true
#1 [AC2b] opencode/claude-opus-5-5 matches=0 enabled=false
#2 [AC2a] opencode/gpt-6-astra matches=1 baseUrl=https://opencode.ai/zen/v1 enabled=false
#3 [AC2a] opencode/gpt-5.6-sol matches=1 baseUrl=https://opencode.ai/zen/v1 enabled=false
#4 [AC2a] opencode/claude-sonnet-5 matches=1 baseUrl=https://opencode.ai/zen enabled=false
#5 [AC2a] opencode/deepseek-v4-pro matches=1 baseUrl=https://opencode.ai/zen/v1 enabled=false
#6 [AC2a] opencode/gpt-5.6-terra matches=1 baseUrl=https://opencode.ai/zen/v1 enabled=false
#7 [AC2a] opencode/qwen3.8-flash matches=0 enabled=false
#8 [AC2a] opencode/glm-5.3-flash matches=1 baseUrl=https://opencode.ai/zen/v1 enabled=false
#9 [AC2a] openrouter/openai/gpt-6-astra matches=1 baseUrl=https://openrouter.ai/api/v1 enabled=false
#10 [AC2b] openrouter/anthropic/claude-opus-5.5 matches=0 enabled=false
#11 [AC2a] openrouter/anthropic/claude-sonnet-5 matches=1 baseUrl=https://openrouter.ai/api enabled=false
#12 [AC2a] openrouter/openai/gpt-5.6-sol matches=1 baseUrl=https://openrouter.ai/api/v1 enabled=false
#13 [AC2a] openrouter/openai/gpt-5.6-terra matches=1 baseUrl=https://openrouter.ai/api/v1 enabled=false
#14 [AC2a] openrouter/google/gemini-3.8-flash matches=1 baseUrl=https://openrouter.ai/api/v1 enabled=false
#15 [AC2a] openrouter/anthropic/claude-haiku-4.5 matches=1 baseUrl=https://openrouter.ai/api enabled=false
AC2a resolved=12 AC2a zero-match=1 AC2b=2 total=15; enabled 0 of 15
observation openrouter/qwen/qwen3.8-flash matches=1 (not binding 7)
node-pass exit=0
```

PowerShell 7 (`Get-Host`: `ConsoleHost` `7.6.6`), one literal path per call. PowerShell exposes no numeric exit code; each call completed without error:

```
PS> Get-FileHash -Algorithm SHA256 -LiteralPath .../host-owner-export/catalog-projection.json | Format-List Algorithm,Hash
Hash      : B0C2DC8CF1412773B4ED4F17FCBA10634A997F3B2B2B960D6DCA200BDBB171FE
PS> Get-FileHash ... settings-projection.json
Hash      : 1024154D7245A52FB3CB82B3C8105A2249D5406DAEE03498F99CBED8ED137D1E
PS> Get-FileHash ... export-manifest.json
Hash      : AA9B03FAFF555C6F5E98FD06B0F6E940269A5393F846877F57AF562D1DF692C3
PS> Get-FileHash ... specs/active/PMC-P0-pi-capability-and-catalogue-baseline.md
Hash      : 133A7690B865D460586E77FB3EE5440116513272DB299ECEB52B09F8F81B72EB
PS> Select-String -LiteralPath .../catalog-projection.json -Pattern '"qwen/qwen3\.8-flash"' -CaseSensitive
...\catalog-projection.json:14869:          "id": "qwen/qwen3.8-flash",
PS> Select-String -LiteralPath .../settings-projection.json -Pattern 'jev-1\.13' -CaseSensitive
...\settings-projection.json:10:    "openrouter:typesafe/jev-1.13"
PS> Select-String -LiteralPath .../export-manifest.json -Pattern 'jev-1\.13' -CaseSensitive
...\export-manifest.json:12:      "typesafe/jev-1.13"
...\export-manifest.json:45:      "typesafe/jev-1.13",
PS> Select-String -LiteralPath plugins/foreman-line/routing-policy/routing-policy.yaml -Pattern 'jev' -CaseSensitive
(PowerShell completed with no output)
PS> Select-String -LiteralPath plugins/foreman-line/routing-policy/routing-policy.yaml -Pattern 'roles:|model_tiers:|ORDER IS'
...\routing-policy.yaml:139:roles:
...\routing-policy.yaml:144:model_tiers:
...\routing-policy.yaml:151:  # ORDER IS THE SELECTION RULE. The dispatcher (dispatch/src/routing-eval)
PS> Select-String -LiteralPath plugins/foreman-line/routing-policy/src/validator.ts -Pattern 'claude-opus'
...\validator.ts:48:  'anthropic/claude-opus-5.5',
```

The negative-case run (N1–N14; `exit=0`, 18 checks pass, 0 fail) is in V§8.
The catalogue line 14869 matches the reviewer's locator for the prefixed record.

**Scope.** Only the four Allowed Files were edited, and they remain untracked.
The rework made no provider or network call, read no credential or host file,
changed no export, settings, policy, or source file, and did no Jev
reconciliation. It ran no `git add`, commit, stash, or reset, and installed no
dependency.
