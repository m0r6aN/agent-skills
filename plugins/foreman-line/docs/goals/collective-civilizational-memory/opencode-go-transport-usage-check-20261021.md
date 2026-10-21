# Exact OpenCode Go transport and usage check — October 21

Result: configured exact route VERIFIED; local credential readiness VERIFIED
without refresh or inference; actual account allowance/Extra usage UNVERIFIED.
No P1A replacement builder or model invocation is admitted by these observations.

## Exact installed route

Pi1.3.0 at `/home/cmorgan76/.local/share/mise/installs/pi/latest/pi/pi`.
`~/.pi/agent/settings.json` selects provider `opencode-go`, model
`mimo-v2.6-pro`. No custom provider definitions were found in the inspected
models.json path; no catalog availability from this is inferred. The binary's
built-in record uses `openai-completions`, base
`https://opencode.ai/inference/go/v1`, model context1048576/catalog output131072.
That default output ceiling is not the approved8192 request bound.

`pi auth check --provider opencode-go --json --no-refresh` returned exit0,
statusready, authTypeapi_key. No keys/tokens emitted or refresh requested. This
checks existing local credential resolution, not subscription/quota/server access.
Owner's provider correction OpenCode is settled. Do not use OpenRouter, another
MiMo variant or the supplied catch-all fallback code. Owner role/failover matrix
is retained in `omarchy-owner-routing-preferences-20261021.md`; it does not waive
P1A's frontier-builder/two-independent-review obligations.

## Official accounting/transport evidence (checked October 21)

[Go documentation](https://opencode.ai/v2/docs/console/go/) lists exact
MiMo-V2.6-Pro. Its published input/output rates are $0.435/$0.87 per million;
these meter Go allowances, not GenSpark credits. At36000 input/8192 output,
uncached token valuation is$0.02278704, not an
invoice or proven cash debit. Account plan/quota remains unknown. Extra usage can
consume pay-as-you-go credits after limits. Current documented endpoint is
`https://opencode.ai/inference/go/openai/v1/chat/completions`; the installed base
uses a shorter legacy path. Alias compatibility is unverified; no request tested
it and no base URL/config was changed.

[Budgets API](https://opencode.ai/v2/docs/console/api/budgets/) requires a service
key with budget-read permission. No such key was requested/created or inferred
from the existing inference credential. No guessed usage endpoint was queried.
The accessible in-app browser had no existing tabs; official console navigation
reached its login page, so account usage and Extra state could not be read. No
login, consent, purchase or billing-setting change was performed. Console tab is
retained as a handoff at https://opencode.ai/console/ .

## Exact safe next account action

Sign in to the existing OpenCode Console tab, then perform a read-only inspection
of active Go/GoPlus plan, exact MiMo usage windows/remaining allowance, and Extra
usage state. No settings need to be changed merely to inspect them. Do not
substitute a service-key creation, broad credential hunt or inference probe.
This is a missing authenticated view, not a new spending proposal. GenSpark's
approved1000 shared/700 P1A credits do not authorize new provider cash spending.

## P1A transport preparation advanced without generation

Native OpenAI local auth readiness returned ready/oauth without refresh. A
short-lived `--no-session --mode rpc` process selected exact openai/gpt-6.1-sol
with no tools/extensions/MCP/skills/prompt templates, received only get_state,
and exited0. It reported zero messages/pending/streaming, context272000,
output default128000, compactionenabledtrue. No prompt was submitted. Reported
model base https://api.openai.com/v1 and APIopenai-responses are runtime metadata,
not proof of the eventual OAuth request URL/account entitlement/billing.

Static installed code shows model/request output cap propagation and documents
retry/compaction disable controls. In particular, disabling automatic compaction
returns before recoverable-length compaction/retry in the inspected installed
binary; transient retries are separate. These controls have NOT been activated
or regression-tested on a delivery session. No persistent settings changed.
Before an eligible generation: exact8192 cap, retries/compaction disabled, genuine
zero-tool isolation and durable session/usage capture must be verified; choose
one bounded continuation, not an automatic provider chain.

Original request01 remains deliveryfailed/upstreamunknown with94.6 reserved.
Reported95.7+unresolved94.6=190.3 of700. No new inference, source change, support
message, duplicate worker or schedule occurred. Both independent parcel reviews
and focused repair remain unused. Existing scope/approval is settled; a new
provider's account and transport controls cannot be inferred from it.
