# Seat Invocations - this machine (Clint's rig "m0r6aN", Windows; verified 2026-10-17, Pi via cmd /c)

Maintained state, not gospel: if a seat below fails twice, diagnose, fix, and UPDATE this
file so the next run inherits the fix. All commands assume cwd = the directory containing
the brief file. Native grok/codex/claude/gemini CLIs are no longer used - every seat runs
through Pi to avoid their token overhead.

## Launching a seat (one template for every seat)

Every seat is one headless Pi process. Only `--provider`, `--model`, role, lens, and
seat number change:

```
cmd /c pi -p --no-session --no-mcp -ne -ns -nc -np --tools read --provider <provider> --model <model>:<thinking> "<role>. Read <brief>.md in the current directory and complete the task in its 'Your task' section. Judge <lens> hardest. Output ONLY the answer in the exact format the brief demands, no preamble." > seat<N>-out.txt 2> seat<N>-err.txt
```

- `-p` - non-interactive: process the prompt, print the answer, exit.
- `--no-session` - no session files written; the seat leaves nothing behind.
- `--no-mcp` - no MCP servers loaded (no tool schemas in context, no hang-after-answer).
- `-ne` / `-ns` / `-nc` / `-np` - no extensions, no skills, no context files
  (AGENTS.md/CLAUDE.md), no prompt templates. This is what kills the native-harness
  token overhead: the seat sees only the prompt and the brief.
- `--tools read` - read-only toolset; the seat can open the brief and nothing else.
- `> seatN-out.txt 2> seatN-err.txt` - the answer is captured from stdout, so seats
  never need write access. Errors (auth, billing, bad model id) land in the err file.
- `--provider` + `--model <id>:<thinking>` - the route. Use the id exactly as
  `pi --list-models` spells it (namespaces differ: `anthropic/claude-opus-5.5` on
  OpenRouter uses dots, native/OpenCode ids use dashes).
- Keep seats family-diverse (charter D5): never two seats from the same model family.
  Put the charter's adversarial-review rows (gpt-6-astra, claude-opus-5.5) on the
  adversarial lanes.

## Roster

Smoke test 2026-10-17: `"Reply with exactly: OK"` with the template flags; all returned `OK`, exit 0.
Times are the trivial-prompt round trip, not a real brief.

| Seat | Family | Provider | Model:thinking | Measured time | Notes |
|---|---|---|---|---|---|
| 1 | OpenAI | `openai` | `gpt-6-astra:high` | ~3s | Adversarial lane (charter frontier/adversarial row). Native OpenAI key works. |
| 2 | Anthropic | `openrouter` | `anthropic/claude-opus-5.5:high` | ~3s | Adversarial lane. Native `anthropic` fails: 400 "Third-party apps now draw from your extra usage" (Claude plan needs extra-usage credit). `anthropic/claude-sonnet-5.5:high` also OK on OpenRouter (~3s). |
| 3 | Google | `openrouter` | `google/gemini-4-argon:high` | ~5s | Native `google` fails: API_KEY_INVALID. |
| 4 | xAI | `openrouter` | `x-ai/grok-4.7:high` | ~2s | Native `xai` fails: 403 team credits/monthly spend limit exhausted. |
| 5 | Xiaomi MiMo (open-weight) | `opencode-go` | `MiMo-v2.6-Pro:high` | ~4s | Passed 2/2 (id is case-insensitive; list spells it `mimo-v2.6-pro`). Fallback: `openrouter` `xiaomi/mimo-v2.6-pro:high` (passed 2/2, 2-6s). Public-data briefs only per open-weight data policy. |
| 5-alt | Fireworks Ember | `openrouter` | `fireworks/ember-1:high` | ~2s | FALLBACK ROUTE: native `fireworks` `accounts/fireworks/models/ember-1` fails 2/2 with 401 "The API key you provided is invalid." OpenRouter route passed 2/2. Swap in for seat 5 if MiMo is down. |

Known-broken routes on this machine (2026-10-17): all `opencode/*` (401 "Upstream request
failed: Invalid credential"), `fireworks/*` (401 invalid API key; re-confirmed on ember-1). `opencode-go/*` WORKS (separate key from `opencode`), native `anthropic`,
`google`, `xai` (see notes). Re-test before switching back.

Config note: Pi warns that `C:\Users\clint\.pi\agent\models.json` has invalid schema
(`providers.anthropic.baseUrl` empty). It did not block requests - native anthropic calls
still reached Anthropic and failed on billing, not on base URL - but fix it when convenient.

## Decision seats

Decision models do not read a brief. They take a `state` string plus a `questions`
record keyed by question id, and return calibrated numbers - no prose. They add
**verdict votes** alongside the 5 critique seats; they never replace them.

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
6. Tally: each decision seat's `go_no_go.choice` is one verdict vote alongside the 5
   critique seats' verdicts; report its confidence/probabilities. A noul flag raised by any
   decision seat must be checked against the critique seats' findings in the directive.
   Decision seats do not count toward the critique quorum (2 critique seats + orchestrator).

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

# D1 - most accurate: Liquid AI d1-ultra
Invoke-Decision 'https://api.liquid.ai/decisions/v1/systemone' LIQUID_API_KEY 'd1-ultra' seat6-out.json
# D2 - fastest: TypeSafe Jev 1.14 (OpenRouter decisions endpoint, NOT pi)
Invoke-Decision 'https://openrouter.ai/api/alpha/decisions' OPENROUTER_API_KEY 'typesafe/jev-1.14' seat7-out.json
# D3 - cheapest / largest context: Nace.AI Drex (drex-v2.0; drex-v1.5 as fallback)
Invoke-Decision 'https://console.nace.ai/v1/systemone' NACE_API_KEY 'drex-v2.0' seat8-out.json
```
### Decision roster (smoke test 2026-10-17, Clint's payouts sample: department choice, is_urgent noul, frustration score)

| Seat | Vendor | Endpoint | Model | Latency | Result |
|---|---|---|---|---|---|
| D1 | Liquid AI | `api.liquid.ai/decisions/v1/systemone` | `d1-ultra` | 848 / 240 ms | Pass 2/2: payments (conf 0.996), urgent 0.985, frustration 1.71 (conf 0.57-0.60). Cost ~## Orchestration notes.0000076. |
| D2 | TypeSafe | `openrouter.ai/api/alpha/decisions` | `typesafe/jev-1.14` (resolves to `jev-1.14-20261014`) | 504 / 331 ms | Pass 2/2: payments (conf 1.0), urgent 0.92, frustration 1.83 (conf 0.74). Cost ~## Orchestration notes.0000177. |
| D3 | Nace.AI | `console.nace.ai/v1/systemone` | `drex-v2.0` | 474 / 545 ms | Pass 2/2 (is_urgent only): noul 0.949. Server eval 105-273 ms. |
| D3-alt | Nace.AI | same | `drex-v1.5` | 304 / 235 ms | Pass 2/2: noul 0.929. Server eval 7-47 ms. |

Jev and pi: `pi --provider openrouter --model typesafe/jev-1.14` fails with 400 "typesafe/jev-1.14 is a
decisions model and cannot be used with the chat/completions endpoint. Use the
/api/alpha/decisions endpoint instead." `typesafe/jev-router` (the id in `pi --list-models`) does
answer free-text chat through pi ("OK" in 1.5s), but a state/questions JSON prompt sent through pi
hung with no output and had to be killed - use the REST endpoint for decision seats.
## Orchestration notes (Windows)
- Prefer `cmd /c` over PowerShell for launches; some bridges strip dollar signs from
  PowerShell commands. For anything complex, write a .py helper and run it.
- Launch every seat as its own background process so they run concurrently; poll the
  processes rather than blocking. Launch the slowest seat first - it defines the critical path.
- A seat whose err file is non-empty and out file empty has failed. Seat down after 2
  attempts: drop it (or swap to another model of the SAME family), note it in the
  directive, and continue with quorum (2 seats + orchestrator minimum).
- The orchestrator must outlive the seats (SKILL.md rule).


