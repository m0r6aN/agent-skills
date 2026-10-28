# AI Council - Dream Team Roster

## Kimi K3.1 Pro — added 2026-10-23

**Moonshot-family advisory seat; HIGH reasoning via `opencode-go/kimi-k3.1-pro`.** Select for contract invariants, edge cases, and failure recovery. Use the [qualified council dispatch procedure](kimi-k31.md), including its own Foreman receipt, public-data scope, one-attempt limit, and October 30 qualification expiry. This seat uses the bounded pilot launcher instead of the generic command below and does not fill mandatory reviewer or minimum critique-quorum slots.


**Baseline:** 2026-10-18. **Machine:** Clint's rig "m0r6aN", Windows.
**Local Pi version:** `1.3.0` (checked 2026-10-18). **Latest live council evidence:** 2026-10-18; historical trivial probes: 2026-10-17.

This is the static starting roster for the next project: complementary specialists,
explicit routes, and a small independent council selected for each question. Membership
does not mean every model runs on every task. Roles below are starting hypotheses to
refine with project evidence, not claims that a benchmark proves task suitability.

The initial 2026-10-18 roster refresh checked the local Pi catalog and public documentation
without inference calls. The subsequent owner-authorized Pantheon founding council
exercised all 16 reasoning-model routes in two rounds; see the dated evidence below.
Historical smoke results remain distinct from these substantive brief responses.

## Team selection

My starting five for a broad critique are **Astra, Opus, Argon, Grok, and MiMo**.
They cover architecture, correctness and craft, analytical consistency, skeptical
challenge, and economical alternatives across five model families. **Sol** is the
preferred builder candidate; **Muse Wonder** is the first research specialist to
qualify. The complete bench below lets the project change this selection.

| Core seat | Model | Default lens: judge this hardest |
|---|---|---|
| 1 | GPT-6 Astra · xhigh | Critical architecture, planning, reconciliation, hidden dependencies, failure modes, and consequential tradeoffs. |
| 2 | Claude Opus 5.5 · high | Correctness, implementation quality, product coherence, and design craft. |
| 3 | GPT-6.1 Sol · high | Ongoing coordinator. Complex builders and difficult debugging. Balance reasoning quality, responsiveness, and repeated execution cost. |
| 4 | Gemini 4 Argon | Quantitative reasoning, evidence consistency, edge cases, and contradictions. |
| 5 | Grok 4.7 | Challenge assumptions, test the counterargument, and expose overlooked alternatives. |
| 6 | MiMo V2.6 Pro | Simpler implementations, cost, practical constraints, and public-data experiments. |
| 7 | Claude Fable 5.1 · high | Critical architecture or security review. |
| 7 | GPT-6 Luna · high | Bounded extraction, catalog maintenance, routine triage. |

Grok 4.7 retains the previously tested route. The supplied benchmark scores **4.6**;
its scores must not be attributed to 4.7. MiMo is an advisory public-data seat, not a
substitute for a required frontier reviewer. Core seats are candidates subject to the
route evidence and active lane rules below.

### Full roster and intended roles

All fourteen models in Clint's image have a place. Numbers below are transcribed
from the image supplied on 2026-10-18; its benchmark name, URL, harness, and measurement
date were not supplied. Selected scores explain the initial role assignment. The
last column is the image's **cost per successful task**, not API pricing, a council
budget, or a prediction for this project.

| Model | Family | Initial assignment | Selected image evidence | Image cost/task |
|---|---|---|---|---|
| Claude Opus 5.5 | Anthropic | Core; correctness, complex design, adversarial review | Overall 86.5; agentic 85.0; coding 96.3; design 86.9 | $4.216 |
| GPT-6 Astra | OpenAI | Core; architecture, deep synthesis, adversarial review | Overall 86.1; reasoning 92.7; research 85.2 | $3.442 |
| GPT-6.1 Sol | OpenAI | Primary builder candidate; implementation, debugging, integration | Overall 85.4; coding 96.0; browser 88.0 | $0.734 |
| Gemini 4 Argon | Google | Core; analytical cross-checks, data, browser-task planning | Overall 84.1; reasoning 95.1; browser 92.0; data 85.2 | $1.830 |
| Claude Sonnet 5.5 | Anthropic | Builder and design specialist; bounded code/craft critique | Overall 82.5; coding 94.7; design 85.0 | $3.805 |
| Muse Wonder 1.0 | Meta / Muse | Research specialist; synthesis of supplied sources, competing explanations | Overall 78.1; research 88.0; reasoning 90.6 | $1.807 |
| GPT-5.6 Terra | OpenAI | Reserve; bounded implementation and data work with clear acceptance criteria | Overall 75.0; coding 86.2; data 79.3 | $1.691 |
| MiMo V2.6 Pro | Xiaomi / MiMo | Core advisory seat; economical public-data implementation alternatives | Overall 74.9; coding 81.5; browser 88.0 | $0.167 |
| Muse Spark 1.3 | Meta / Muse | Builder reserve; code proposals and lighter research synthesis | Overall 74.8; coding 90.2; reasoning 89.7 | $0.999 |
| Grok 4.6 | xAI / Grok | Version-pinned skeptic and research candidate; compare with 4.7 | Overall 74.6; research 84.5; coding 89.1 | $1.245 |
| Claude Haiku 5.5 | Anthropic | Fast triage, copy variants, bounded UI/craft checks | Overall 74.5; browser 88.0; design 82.2 | $0.211 |
| GPT-6 Luna | OpenAI | High-volume extraction, classification, small edits, first-pass triage | Overall 69.4; coding 84.5; design 82.5 | $0.132 |
| Gemini 3.8 Flash | Google | Bounded research summaries and routine implementation support | Overall 67.3; reasoning 89.3; research 79.1 | $1.111 |
| Nemotron 3.5 Super VL | NVIDIA / Nemotron | Experimental public-data visual/document analysis; validate on representative samples | Overall 51.5; research 70.9; data 64.6; browser 4.0 | $0.148 |
| Jev 1.14 | TypeSafe | Decision specialist; typed choices, confidence scoring, classification and routing; vision/box grounding experimental | Not benchmarked in this evaluation | N/A |
| Drex 2.0 | Nace.AI | Decision specialist; structured classification, probability scoring and rule-based routing | Not benchmarked in this evaluation | N/A |
| Ultra AI D1 Ultra | Unverified | Experimental decision-model candidate; validate provider, capabilities and version before assignment | Not verified | N/A |

Existing additions retained: **Grok 4.7** as the historically tested xAI seat and
**Fireworks Ember 1** as a separate-family reserve with historical route evidence.
Neither has scores in the supplied image. Keep Nemotron experimental; the image
does not support selecting it for general browser work.

### How the team works together

- Select by task, evidence, and marginal coverage. A quick check needs two independent
  critique seats plus the orchestrator; a standard council usually needs three or four.
  Use the five-seat core when its extra coverage is useful and eligible.
- Keep one model per family in a critique panel. Astra, Sol, Terra, and Luna are one
  family; Opus, Sonnet, and Haiku are one; Argon/Flash and Wonder/Spark likewise.
  Multiple family members may build separate scoped artifacts, but do not count them
  as independent votes or let a model verify its own work.
- For Sol-built work, prefer Opus as the independent frontier reviewer, with Argon
  and Grok as complementary critics. For Opus/Sonnet-built work, prefer Astra.
  Apply the governing lane's different-family and frontier requirements to fallbacks too.
- Give critics the same evidence and distinct lenses. They return their first verdicts
  independently; share findings for a second-round challenge only after collecting those
  verdicts. Verify decisive claims against evidence; agreement alone is not proof.
- Wonder may replace a less relevant seat, or add a sixth family for research-heavy
  questions, once its route and identity are qualified. Spark replaces Wonder within
  the Meta family only when suitable for the task. Haiku, Luna, and Flash handle bounded
  support work; they do not inherit frontier review authority from a roster entry.
- Council seats critique supplied evidence with read access. Builder, browser, and
  research-gathering assignments need separate task envelopes and appropriate tools;
  the council command below does not grant those capabilities.
- Record actual route, reasoning setting, task completion, useful findings, latency,
  and reported cost per run. Compare candidates on the project's tasks before changing
  these defaults. Keep uncertainty and minority findings visible in synthesis.

## Route ledger

**B** = both substantive Pantheon brief rounds completed on 2026-10-18 with tools disabled.
**H** = historical `OK` probe recorded on 2026-10-17, plus catalog presence checked
2026-10-18. **C** = catalog-only evidence for a binding not exercised by that council.
These statuses do not establish read-tool compatibility, future account access, or
Foreman lane eligibility. Reasoning settings on remaining C rows are proposed.

| Candidate | Provider | Exact model:thinking | Evidence and use |
|---|---|---|---|
| Kimi K3.1 Pro | `opencode-go` | `kimi-k3.1-pro:high` | Qualified 2026-10-23; bounded public L3 advisory seat. Use [the Kimi launcher](kimi-k31.md); no mandatory reviewer authority. |
| GPT-6 Astra | `openai` | `gpt-6-astra:high` | B + H; ~3s. Machine-local native route. Foreman requires an admitted provider binding. |
| GPT-6 Astra | `openrouter` | `openai/gpt-6-astra:high` | C; candidate for the existing Foreman provider scope. |
| Claude Opus 5.5 | `openrouter` | `anthropic/claude-opus-5.5:high` | B + H; ~3s. |
| GPT-6.1 Sol | `openai` | `gpt-6.1-sol:high` | B (previously catalog-only); builder candidate. Confirm Responses-based read/tool support before use. |
| GPT-6.1 Sol | `openrouter` | `openai/gpt-6.1-sol:high` | C; separate binding, tool compatibility untested. |
| Gemini 4 Argon | `openrouter` | `google/gemini-4-argon:high` | B + H; ~5s. |
| Claude Sonnet 5.5 | `openrouter` | `anthropic/claude-sonnet-5.5:high` | B + H; ~3s. Does not automatically replace Opus in a frontier lane. |
| Muse Wonder 1.0 candidate | `openrouter` | `meta/muse-wonder:high` | B (previously catalog-only); catalog calls it "Meta: Muse Wonder", without 1.0. Confirm version correspondence before claiming a benchmark match. |
| GPT-5.6 Terra | `openrouter` | `openai/gpt-5.6-terra:medium` | B (previously catalog-only); reserve. |
| MiMo V2.6 Pro | `openrouter` | `xiaomi/mimo-v2.6-pro:high` | B + H; 2/2, 2-6s. Preferred current candidate over the absent OpenCode Go binding; public-data briefs only. |
| Muse Spark 1.3 | `openrouter` | `meta/muse-spark-1.3:high` | B (previously catalog-only); Meta-family reserve. |
| Grok 4.6 | `openrouter` | `x-ai/grok-4.6:high` | B (previously catalog-only); version distinct from 4.7. Do not transfer benchmark or quality conclusions between them. |
| Grok 4.7 | `openrouter` | `x-ai/grok-4.7:high` | B + H; ~2s. Retained core candidate. |
| Claude Haiku 5.5 | `openrouter` | `anthropic/claude-haiku-5.5:medium` | B (previously catalog-only); bounded support work. |
| GPT-6 Luna | `openai` | `gpt-6-luna:medium` | B (previously catalog-only); bounded support work. |
| GPT-6 Luna | `openrouter` | `openai/gpt-6-luna:medium` | C; separate candidate binding. |
| Gemini 3.8 Flash | `openrouter` | `google/gemini-3.8-flash:medium` | B (previously catalog-only); bounded support work. |
| Nemotron 3.5 Super VL | `openrouter` | `nvidia/nemotron-3.5-super-vl:medium` | B (previously catalog-only); public-data experimental seat. Do not silently select the `:free` variant. |
| Fireworks Ember 1 | `openrouter` | `fireworks/ember-1:high` | B + H; 2/2, ~2s. Separate-family reserve; not an automatic MiMo fallback. |

Historical times are trivial-prompt round trips, not representative brief timings.
The old MiMo binding, `opencode-go` / `MiMo-v2.6-Pro:high`, passed 2/2 (~4s) on
2026-10-17 but is absent from the 2026-10-18 catalog. Retain that history; do not
assume it still resolves or generalize it to other `opencode-go` models.

### Substantive council evidence — 2026-10-18

The owner-authorized [Pantheon founding council](D:/Repos/Pantheon/.audit/founding-council-2026-10-18/INDEX.md)
completed **16 independent initial responses and 16 adversarial draft reviews**.
Eight family representatives were separated from eight related-family specialists;
agreement was not treated as factual proof or execution authority. All 16 reasoning
models participated in both rounds. Decision-only REST seats were not requested for
this architecture exercise and were not probed.

Calls used installed Pi with an embedded `@brief`, `--no-tools`, `--no-mcp`, disabled
discovery and no persisted session. Therefore B qualifies successful supplied-text
review only, **not read/tool use, agent execution or a Foreman route receipt**. Provider-reported
identities and actual routes, timings, format overruns and captured usage are recorded
in the [run summary](D:/Repos/Pantheon/.audit/founding-council-2026-10-18/run-summary.json).
The `meta/muse-wonder` alias still does not establish correspondence to version 1.0.

Two calls in round two (Grok 4.6 and Haiku) were interrupted by a Windows progress-file
replacement sharing violation. Their second attempts succeeded on the same routes.
This was a coordinator fault, not a model rejection; first-attempt usage was unavailable.
Completed outputs were preserved, retries were bounded, and no inference route switched.
Two concurrent Pi processes with launches at least 25 seconds apart completed this run
without observed out-of-memory errors. Use bounded retry for Windows atomic status-file
replacement and preserve attempt history when resuming; do not overwrite an interrupted
attempt or repeat completed seats.

### Route boundaries and qualification

This roster is a selection reference, not a resolver receipt or a change to the
[Pi model charter](../../../docs/goals/pi-model-configuration/charter.md).
For Foreman execution, use the admitted provider/model/lane and its approved route
receipt. Native `openai` and historical `opencode-go` observations do not expand that
charter's provider scope. New roster entries do not silently amend its lane matrix.

Before first use of a new binding, check exact catalog identity and the required
tools, context, data class, and budget. An authorized public `OK` probe checks basic
reachability; a small representative brief checks read-tool and output-contract
behavior. Record these separately from task-quality evidence. Use only a declared,
eligible fallback; changing provider, version, or family is a recorded new attempt.
If no eligible route remains, report the missing coverage or stop the required lane.

Read-only catalog inspection, with discovery overhead disabled:

```bat
cmd /c pi --no-mcp -ne -ns -nc -np --list-models
```

### Known route issues

- Recorded 2026-10-17: `opencode` routes failed with 401 "Upstream request failed:
  Invalid credential"; native `fireworks` failed with 401 invalid API key, including
  Ember 1 twice. Catalog presence does not clear these failures.
- Native `anthropic` failed with 400 "Third-party apps now draw from your extra usage"
  (extra-usage credit required); native `google` returned `API_KEY_INVALID`; native
  `xai` returned 403 team credits/monthly spend limit exhausted. Re-test before reuse.
- Resolved 2026-10-18: the empty `providers.anthropic.baseUrl` schema error in
  `C:\Users\clint\.pi\agent\models.json` was repaired; recognized model customizations
  now use `modelOverrides`. Offline runtime/catalog validation passed for all 19
  reasoning bindings. Evidence: `D:/Repos/Pantheon/.audit/pi-models-2026-10-18/verification.json`.
  This configuration repair does not clear the recorded Anthropic billing refusal.
- The local catalog and current official docs disagree on some context/output limits.
  Use the effective binding's tested limits; do not assume a model name grants the
  provider's advertised maximum. For Sol, official docs require Responses for tool
  calling; chat-only success does not qualify the council's `read` tool.

### Launch-path diagnosis (2026-10-18)

The roster does not feed the resolver or terminal factory. Successful October Foreman
reviews used direct Pi dispatch under recorded, goal-specific owner rulings; those
exceptions are not inherited by a new goal. The legacy L2 resolver already held
`L2_PINNED_PROVIDER_UNSET` before this roster refresh, and the production PMC terminal
already returned `BOUND_REFUSED`. CLI/catalog/auth readiness does not resolve these
admission and implementation gaps. Do not retry a refused receipt or substitute a
provider silently. Compare the goal's actual authorized launch path before diagnosing
the CLI as missing or the roster as broken.

For an explicitly approved **human-operated native Claude** exception, an additive
[manual supervisor](../../../pi-package/review-tools/README.md) provides input pinning,
one-attempt capture, and local timeout handling. It is separate from council/Pi
dispatch, does not issue a Foreman receipt, and cannot satisfy an unchanged strict
token/billing/remote-termination contract. The existing coordinator owns dispatch.

## Launching a review/critique seat

Every critique seat is one headless Pi process. Native vendor CLIs are not used.
All commands assume cwd is the brief directory. This is the underlying invocation
shape; Foreman launches must still pass their receipt-checking launch boundary.
Change provider, model, thinking level, role, lens, and run-local seat number:

```bat
cmd /c pi -p --no-session --no-mcp -ne -ns -nc -np --tools read --provider <provider> --model <model>:<thinking> "<role>. Read <brief>.md in the current directory and complete the task in its 'Your task' section. Judge <lens> hardest. Read only the supplied brief and its explicitly listed evidence. Output ONLY the answer in the exact format the brief demands, no preamble." > seat<N>-out.txt 2> seat<N>-err.txt
```

- `-p` prints the answer and exits; `--no-session` disables persisted Pi sessions.
- `--no-mcp` disables MCP connections and tools. `-ne -ns -nc -np` disables extension,
  skill, context-file, and prompt-template discovery. Pi's base instructions and the
  enabled read-tool schema remain; this reduces overhead rather than eliminating it.
- `--tools read` enables reading but is **not a filesystem sandbox**. The prompt scopes
  reads to the evidence; enforce actual access boundaries separately when required.
- The parent captures stdout/stderr; seats need no write tool. Preserve output and
  error files with the brief and directive. Check exit status and output validity;
  stderr warnings alone do not prove a failed response.
- Use catalog IDs exactly. OpenRouter's `anthropic/claude-opus-5.5` uses dots, while
  native/OpenCode `claude-opus-5-5` uses dashes. Prefer `high` for deep critique;
  bounded support work may use `medium` when that route supports it.

## Evidence sources for this baseline

- Clint's supplied leaderboard image: `codex-clipboard-65736e47-ad87-4078-b1ff-d173f8fe4739.png`,
  received 2026-10-18. Its selected figures are preserved above so the temporary
  attachment is not required to interpret the roster.
- This file's inherited 2026-10-17 probe notes, plus `pi --version` and
  `pi --list-models` inspected 2026-10-18. Prior probe artifacts were not revalidated.
- [OpenAI model selection](https://developers.openai.com/api/docs/guides/model-selection)
  supports the initial Astra / Sol / Luna division; these remain project hypotheses.
- [GPT-6.1 Sol model documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol)
  specifies Responses for tool calls and supported reasoning settings.
- [Gemini 4 Argon documentation](https://ai.google.dev/gemini-api/docs/latest-model)
  describes reasoning and context capabilities; the actual Pi route still needs validation.
- [OpenRouter's public catalog](https://openrouter.ai/api/v1/models) checked 2026-10-18
  confirms the Wonder, Spark 1.3, Grok 4.6/4.7, and Nemotron display names and IDs.
  Wonder's displayed name does not establish the image's 1.0 version.

## Decision seats

Decision models do not read a brief. They take a `state` string plus a `questions`
record keyed by question id, and return structured choices, scores, and reported
probabilities. Keep these as optional decision signals alongside the selected
critique seats; they never replace them. Calibration was not established by the
recorded smoke tests. These historical endpoint notes do not activate a refused
Foreman classification lane or grant decision authority.

### Request shape (verified - `questions` MUST be an object keyed by id, not an array)

```json
{
  "model": "<model>",
  "state": "<condensed facts from the brief>",
  "questions": {
    "go_no_go": { "type": "choice", "instructions": "Should this plan proceed as written?",
                  "criteria": { "go": "no blocking defects; risks acceptable",
                                "revise": "fixable defects; rework before proceeding",
                                "no_go": "fundamental flaw or unacceptable risk" } },
    "p0_data_loss": { "type": "noul", "instructions": "Does the plan risk irreversible data loss?" },
    "severity": { "type": "score", "instructions": "How severe is the worst open issue?",
                  "criteria": ["cosmetic", "degraded", "broken", "critical"] }
  }
}
```

- `choice` needs `instructions` (string) + `criteria` (record option -> description).
- `noul` needs `instructions` (or criteria). Returns probability of "yes" in 0-1.
- `score` needs `instructions` + `criteria` (ordered array = scale levels 0..n-1).

### Response shape

`{ model, answers: { <id>: ... }, usage: { input_tokens, output_tokens, cost }, ... }`
- choice -> `{ type, choice, probabilities{option:p}, confidence }`
- noul -> `{ type, noul }` (probability)
- score -> `{ type, score, legend{idx:label}, probabilities{idx:p}, confidence }`
- Nace adds `evaluation_time_ms`, `request_id`; Jev adds `id`, `provider`.

### Turning the brief into state + questions (orchestrator)

1. `state`: a neutral, opinion-free condensation of the brief's evidence (same rule as the
   brief itself - no orchestrator verdict leaks in).
2. Always ask a `go_no_go` choice (go / revise / no_go).
3. One `noul` per P0 check from the brief (data loss, security, irreversible action,
   spec violation...). Treat noul >= 0.5 as a "yes" flag.
4. One `severity` score over the brief's severity scale.
5. Save the request as `decision-request.json` next to the brief; each decision seat writes
   `seat<N>-out.json`.
6. Tally: each decision seat's `go_no_go.choice` is one decision vote, reported separately
   from critique-seat verdicts with its confidence/probabilities. A noul flag raised by any
   decision seat must be checked against the critique seats' findings in the directive.
   Decision seats do not count toward the critique quorum (2 critique seats + orchestrator).
   Their votes do not override a verified blocking defect or supply independent evidence
   for the facts in the shared state.

### Invocations (PowerShell, cwd = brief directory, request in decision-request.json)

Keys are User-scope env vars; a fresh process may not have them, so read them explicitly.
Never echo a key. If one is empty, the seat is down - say so in the directive.

```powershell
function Get-Key($n){ $v=[Environment]::GetEnvironmentVariable($n,'Process'); if(-not $v){$v=[Environment]::GetEnvironmentVariable($n,'User')}; if(-not $v){throw "$n missing"}; $v }
function Invoke-Decision($url,$keyName,$model,$out){
  $b = Get-Content decision-request.json -Raw | ConvertFrom-Json
  $b.model = $model
  Invoke-RestMethod $url -Method Post -Headers @{Authorization="Bearer $(Get-Key $keyName)"} `
    -ContentType 'application/json' -Body ($b | ConvertTo-Json -Depth 20) -TimeoutSec 120 |
    ConvertTo-Json -Depth 20 | Out-File $out -Encoding utf8 }

# D1 - Liquid AI d1-ultra (historical route)
Invoke-Decision 'https://api.liquid.ai/decisions/v1/systemone' LIQUID_API_KEY 'd1-ultra' seat6-out.json
# D2 - TypeSafe Jev 1.14 (OpenRouter decisions endpoint, NOT pi)
Invoke-Decision 'https://openrouter.ai/api/alpha/decisions' OPENROUTER_API_KEY 'typesafe/jev-1.14' seat7-out.json
# D3 - Nace.AI Drex (drex-v2.0; historical alternate drex-v1.5)
Invoke-Decision 'https://console.nace.ai/v1/systemone' NACE_API_KEY 'drex-v2.0' seat8-out.json
```

### Decision roster (smoke test 2026-10-17, Clint's payouts sample: department choice, is_urgent noul, frustration score)

| Seat | Vendor | Endpoint | Model | Latency | Result |
|---|---|---|---|---|---|
| D1 | Liquid AI | `api.liquid.ai/decisions/v1/systemone` | `d1-ultra` | 848 / 240 ms | Pass 2/2: payments (conf 0.996), urgent 0.985, frustration 1.71 (conf 0.57-0.60). Prior cost text corrupted; amount unverified. |
| D2 | TypeSafe | `openrouter.ai/api/alpha/decisions` | `typesafe/jev-1.14` (resolved to `jev-1.14-20261014` in that test) | 504 / 331 ms | Pass 2/2: payments (conf 1.0), urgent 0.92, frustration 1.83 (conf 0.74). Prior cost text corrupted; amount unverified. |
| D3 | Nace.AI | `console.nace.ai/v1/systemone` | `drex-v2.0` | 474 / 545 ms | Pass 2/2 (is_urgent only): noul 0.949. Server eval 105-273 ms. |
| D3-alt | Nace.AI | same | `drex-v1.5` | 304 / 235 ms | Pass 2/2: noul 0.929. Server eval 7-47 ms. |

Historical Jev/Pi observation (2026-10-17): `pi --provider openrouter --model typesafe/jev-1.14` failed with 400 "typesafe/jev-1.14 is a
decisions model and cannot be used with the chat/completions endpoint. Use the
/api/alpha/decisions endpoint instead." `typesafe/jev-router` (the catalog id at that time)
answered free-text chat through pi ("OK" in 1.5s), but a state/questions JSON prompt sent through pi
hung with no output and had to be killed - use the REST endpoint for decision seats.

## Orchestration notes (Windows)

- Prefer `cmd /c` over PowerShell for launches; some bridges strip dollar signs from
  PowerShell commands. For anything complex, write a .py helper and run it.
- Give each run its own output directory and map seat numbers to model/role explicitly.
  Start independent seats as background processes with hidden windows when using
  `Start-Process`; retain process IDs and poll status and output.
- **Preserved observation, 2026-10-17:** launching four Pi seats simultaneously crashed
  three with Node heap out-of-memory errors despite ~9.5 GB free RAM. Stagger launches
  about 25 seconds apart, slowest first. Use sequential launches if memory remains a
  problem; a seat that OOMs counts as one failed attempt.
- Set a deadline appropriate to the brief before launching. Treat a nonzero exit,
  expired deadline, or missing/invalid final answer as a failed attempt. Diagnose
  stderr; a running process with empty stdout is not yet proof of failure.
- After two failed attempts, drop an optional seat or take only its declared eligible
  fallback. Record the actual replacement and recheck family independence. An Ember
  substitution for MiMo changes family and coverage; it is not an invisible retry.
- Continue only when the required lanes and quorum are satisfied (at least two
  independent critique seats plus the orchestrator). Otherwise report the unmet
  requirement; cheap support or decision seats do not fill a required frontier lane.
- The orchestrator must outlive the seats, collect their outputs, and write the
  synthesized directive before ending the council run (`SKILL.md` rule).

