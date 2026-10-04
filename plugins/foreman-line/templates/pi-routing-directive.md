# Pi routing directive

Foreman Line sessions are **dispatched Pi sessions**. A dispatched Pi session receives —
before inference begins — a concrete provider/model route, its fallback chain, thinking
level, role, routing class, data class, budget, the approved task envelope, and its
evidence requirements. It is authorized only by an **approved route receipt** emitted by
the resolver; the launch boundary verifies the receipt before any inference and fails
closed when it is missing, stale, mismatched against the requested lane, or unsigned by
the resolver. Pi's interactive `defaultProvider`/`defaultModel` default is a
recovery-friendly convenience outside Foreman work and is never a Foreman-dispatched
route. Automatic routing is an execution convenience, not a new approval or coordination
authority.

Every execution candidate declares **exactly one approved fallback of comparable or higher
suitability**, carried as explicit fallback metadata in the
`provider-neutral-fallback-contract` representation (`lane_routes` each carry exactly one
typed fallback). A fallback is used only after preflight establishes that it is enabled,
available, eligible for the data class, compatible with required tools/structured output,
and within the remaining budget. In-provider OpenRouter failover may use Pi's per-model
`openRouterRouting` controls; cross-provider failover is a new, recorded attempt started
from a durable handoff — it never silently continues a coordinator, review, approval,
merge, release, or security decision mid-turn. A degraded or unavailable primary routes
only to its declared fallback; if both fail, the parcel stops and reports. Fallbacks are
declared in the approved route and recorded in the route receipt — never invented in a
template, never silently substituted, never credential-bearing.

Model IDs are first-class in both Pi spellings — `opencode/<id>` and
`openrouter/<vendor>/<id>` — while provider-neutral task/result envelopes are preserved.
An OpenRouter slug is one spelling of a model ID, not the model vocabulary. Within
OpenRouter slugs Anthropic models use dots (e.g. `openrouter/anthropic/claude-opus-5.5`).

For fast structured routing/classification decisions the **single Jev surface** is JEV's
J2-approved `POST https://openrouter.ai/api/alpha/decisions` under capability
`openrouter-alpha-decisions`, canonical request identity
`openrouter / typesafe/jev-1.13 / alpha-decisions`. "Do not run two Jev surfaces" holds;
Zen `systemone` is an unverified candidate. Jev is `recommend-only`: it is not a
prose-generation or implementation model and may not approve, merge, release, or bypass
policy. The obsolete `…/api/v1` structured-decision candidate wording and any
enabled-list-membership claim are gone: M2 struck Matrix row 6's OpenRouter
primary and ruled the lane refused / disabled-lane.

A dispatched session never writes Pi configuration (`settings.json`, model enablement):
config repair is proposal-only (evidence-backed diffs with mapping provenance) and apply
stays with PMC's authorized writer until a ratified reconciliation exists. Provider
credentials remain environment references and never enter Foreman Line source, templates,
receipts, or prompts.

Keep coordinator, approval, security, verifier-independence, merge, and release
decisions explicit. Record the selected provider/model and route explanation in
the dispatch or result envelope.
