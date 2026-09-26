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
