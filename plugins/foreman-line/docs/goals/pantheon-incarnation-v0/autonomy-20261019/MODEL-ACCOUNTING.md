# Model registry and accounting

`model-registry.json` is coordinator-readable public fact and qualification data. It is not a route receipt or permission grant. Sources were fetched from official provider documentation on 2026-10-19; authenticated Console observations are recorded separately. Every dispatch pins the registry version/hash and account profile, then checks freshness and exact admission. No model rediscovery conversation is needed per parcel.

| Exact model | Intended use | Context / max output | Standard API USD per million input/output | Current applicability |
|---|---|---|---|---|
| `claude-sonnet-5-5` | Standard builder | 1M / 128K | 2 / 10 | Proposed Morgan Findings LLC Default; credential/live qualification pending |
| `claude-opus-5-5` | Architecture builder and frontier reviewer | 1M / 128K | 4 / 20 | Same account; quota UI observed, not API credential acceptance |
| `gpt-6.1-sol` | Catalog reference; native coordinator access separate | 1,050,000 / 128,000 | 2 / 10 before long-context premiums | No paid API account/profile admitted |
| `gpt-6-astra` | Catalog reference | 1,050,000 / 128,000 | 10 / 50 before long-context premiums | No paid API account/profile admitted |

Sources: [Sonnet 5.5](https://platform.claude.com/docs/en/models/sonnet-5-5/overview), [Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/overview), [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol), [GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra). Registry includes cache rates and OpenAI >272K input premiums, but selected proof profiles do not request cache premiums, regional/fast/batch or separate-charge tools. Public availability never proves account entitlement.

For Claude, `max_tokens` includes thinking and answer for one request; effort is guidance, and each tool-loop request gets a new cap. Opus thinking cannot be disabled. Default review allowance is 32,768 combined tokens; a completed truncated attempt may get one new 65,536-token attempt within remaining authority. The original CLI's 4,000 setting was insufficient in the observed execution. There is no evidence supporting an arbitrary 7,000-token review budget. [Claude cost controls](https://platform.claude.com/docs/en/build-with-claude/thinking-steering-and-cost).

OpenAI's `max_output_tokens` includes reasoning, visible output and non-visible formatting; incomplete responses may incur usage before visible text exists. Those API facts must not be applied as measured native Codex subscription usage. [OpenAI reasoning guidance](https://developers.openai.com/api/docs/guides/reasoning).

## Registry maintenance

One deterministic `registry-maintainer` job runs at most daily or on an observed model/pricing error. It may fetch <=8 allowlisted official pages/metadata responses, runs <=120 seconds, makes no inference, and changes only a candidate registry version plus source hashes/timestamps/diff. Price evidence expires after 24 hours, capabilities after 7 days, selected-account preflight after 60 minutes. The coordinator promotes unchanged-authority facts automatically after schema, source and consistency checks. A changed price recomputes reservations; unknown semantics or entitlement holds the affected route. New accounts/models/providers or wider data handling remain material exceptions. Failure retains history and flags staleness, never sets missing price to zero.

Request profiles name endpoint, account binding, exact model, modality, input bounds, combined output cap, reasoning semantics, request count, timeout, transport retry behavior and ancillary charges. Eligibility first; deterministic cost ranking only among eligible routes. A fresh same-vendor review exception is declared in the independence object. Registry-refresh authority cannot admit a new route or spend.

## Responsibility choice

Use a small shared **transactional admission/accounting service alongside Runtime**, composed from the existing Foreman ledger/kernel packages. Runtime consumes it at the hard admission/effect boundary. This avoids duplicate per-session balances and supports A/B under one budget. A per-worker sidecar may report telemetry but cannot authorize spending. Kompress continues compression/retrieval/savings measurement; before/after token savings may inform estimates but never grant money or report invoice cost. No compression service receives credentials or binary/interactive streams.

## Five distinct cost records

| Category | Producer / meaning | May authorize or replenish? |
|---|---|---|
| Preflight estimate | Local estimate using bounded packet, output allowance and registry pricing, with method/version/confidence | No; informs requested reservation |
| Reserved exposure + call slots | Transactional service, conservative worst-case bound under provider contract | Required admission fact; unknown outcomes stay reserved |
| Provider-reported usage | Raw complete response, request ID and scope; reasoning/cache/output retained separately | Supports provisional settlement after validation, never labeled invoice |
| Locally estimated usage/cost | Tokenizer/bytes heuristic or pricing computed from reported usage; explicitly method-tagged | Never “measured usage”; cannot release unknown delivery liability |
| Reconciled billed cost | Supported billing export/invoice reconciliation with account, period and allocation method | Settles known charges; shared-account allocations remain qualified |

Each entry carries goal/parcel/job/attempt/parent, account/model/price snapshot, input hash, reservation ID, Runtime decision and usage source/scope. Never add result-level and model aggregate counters as if they were disjoint. The failed attempt retains 12K output at result scope and 16K at model aggregate scope, plus $1.095328 CLI list estimate and $5 unavailable uncertainty; none is an invoice.

## Reservation examples and remaining uncertainty

Without an approved input token-count call or qualified local tokenizer, reserve a conservative full context allowance. For Opus use 1,048,576 input tokens (conservative rounding above advertised 1M):

`1,048,576 × $4/M + 32,768 × $20/M = $4.849664`.

With 10% discrepancy buffer this is $5.3346304, rounded up to $5.34. A 65,536 output recovery is $5.505024 before buffer; a full-context 10% buffer would exceed the $6 per-request ceiling. Therefore that recovery needs a tighter **qualified input bound** (for example <=900,000 input gives $4.91072, buffered $5.41), a smaller bounded packet, or it holds. Do not silently omit the buffer or raise the cap. In normal source-review packets the count should be far smaller; counting evidence must precede releasing the conservative margin.

Available authority = new allowance minus provisional accrued consumption, unresolved liabilities and live reservations (including buffers); the prior $5 hold is outside the new $75 and unavailable. No-send release needs trustworthy proof before bytes could leave. Complete reported usage may replace a worst-case reserve with a clearly provisional priced debit plus buffer. A later bill adjusts that debit; discrepancies consume remaining budget or hold the route. Counts/limits apply to every tool-loop request, not just visible operator invocations.

The service enforces permission and modeled exposure before requests. Provider token/pricing correctness, delayed invoice adjustments, taxes/fees if applicable, shared-account activity and remote computation after local cancellation remain external uncertainty. Auto-reload OFF prevents this workflow from triggering a new purchase; it does not by itself make invoice reporting instantaneous. No account-wide exact monetary guarantee is claimed from post hoc accounting.
