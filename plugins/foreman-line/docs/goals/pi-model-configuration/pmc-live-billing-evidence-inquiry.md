# Live billing evidence: prepared vendor inquiry

Status: prepared only; not sent. No credentials, account identifiers, user prompts,
private repository content or inference results are included. Implementation may
continue; this record does not authorize a reserve, paid call or production route.

## Reviewable inquiry

To: OpenRouter Support, support@openrouter.ai

Subject: Documented billable limits for Gemini 3.8 Flash on standard Google Vertex

We are preparing a small public-text integration using OpenRouter Chat Completions
with model `google/gemini-3.8-flash`, the standard `google-vertex/global` endpoint,
streaming, exact reasoning effort `low`, and two text messages. Provider fallbacks,
tools, plugins, explicit cache controls and BYOK are disabled. We need to reserve a
conservative maximum cost before each request and account for uncertainty after
timeouts without retrying the inference.

Could you point us to a route- and version-specific documented contract confirming:

1. The exact upstream API/revision and the response model/provider identifiers for
   this route, including any request translation that adds prompt content.
2. A finite enforced ceiling for all billable input tokens, including chat/system
   framing and provider-added content; alternatively, the exact tokenizer and
   translation/framing rules needed to calculate a conservative bound.
3. Whether top-level `max_tokens=M` limits total billed visible and hidden reasoning
   output to M on this exact route, including after client disconnect or timeout.
   Please identify any upstream retry behavior that can add a separate charge.
4. Whether charges are limited to the published input/output rates, with reasoning
   counted once within output; any per-request or additional account/request fee;
   and whether this configuration can incur cache-write, storage or grounding
   charges. We can conservatively price implicit cache reads at the ordinary input
   rate if no other cache charge applies.

We do not need an inference run or access to another customer's information. A
published reference or written, dated statement of the applicable guarantees and
limitations would let us determine whether this integration can meet its budget
contract. Thank you.

## Evidence already checked

Independent read-only preflight on 2026-09-26 at 19:02–19:05 UTC returned HTTP200
for the [model endpoint catalog](https://openrouter.ai/api/v1/models/google/gemini-3.8-flash/endpoints).
Decoded-response UTF-8 SHA256:
`805deab76523026eae19cfc3831babb92d1bc0e530658fadebb0b9b5638b8ef5`.
The proposed standard full slug is `google-vertex/global`; flex/priority are
different entries, not interchangeable aliases. This is not an accepted profile.

Observed USD/token lexemes: prompt `0.00000075`, completion/internal reasoning
`0.00000375`, implicit cache read `0.000000075`. Metadata includes a separate
cache-write price, implicit caching and an unspecified request fee. Absence is
not evidence of zero. Model context and completion maxima do not by themselves
prove the total billed-token contract through this exact translated route.

The preflight read [provider routing](https://openrouter.ai/docs/guides/routing/provider-selection),
[prompt caching](https://openrouter.ai/docs/guides/best-practices/prompt-caching),
[request parameters](https://openrouter.ai/docs/api_reference/parameters),
[reasoning](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens),
[Google pricing](https://ai.google.dev/gemini-api/docs/pricing) and
[Google thinking](https://ai.google.dev/gemini-api/docs/thinking).
Those sources do not establish all four guarantees above for the exact route.
A paid example can falsify a proposed bound, but cannot establish a universal one.

Once authenticated finite input/output bounds and applicable fees exist, the
unchanged money owner can reserve one rounded-up exact rational maximum. Raw
account `usage.cost` remains settlement authority. Missing or fractional-microUSD
charge remains unknown with liability retained; this inquiry does not propose
rounding actual charges or relabeling an estimate as an enforced bound.

Other independent gates remain: runtime conformance, current approved mapping,
quality/privacy/availability, installation custody and a concrete smoke budget.
