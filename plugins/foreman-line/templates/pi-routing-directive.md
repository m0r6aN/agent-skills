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

A dispatched session is launched by the Pi CLI, naming the approved route's
identity:

```
pi --model <provider>/<model-id>        # e.g. pi --model anthropic/claude-opus-5-5
```

`--model` carries the identity; it confers no authority. The approved route
receipt remains the authorizing artifact and the launch boundary verifies it
before inference. A bare `pi` invocation with no approved route is a direct
invocation and is not a Foreman execution path. A session never writes Pi
configuration to change its own model.

Model IDs are first-class in four provider spellings, each recorded verbatim and
never normalized toward another — exact string equality within one namespace
only (Amendment 06 N1/N3):

| Provider | Spelling | Example |
|---|---|---|
| `anthropic` (first-party) | **dashes** | `anthropic/claude-opus-5-5` |
| `opencode` / `opencode-go` | dashes, no vendor | `opencode/<id>` |
| `openrouter` | **dots**, vendor-prefixed | `openrouter/anthropic/claude-opus-5.5` |
| `fireworks` (open-weight) | full path, `p` for a dot | `fireworks/accounts/fireworks/models/glm-5p3` |

An OpenRouter slug is one spelling of a model ID, not the model vocabulary, and
provider-neutral task/result envelopes are preserved. `anthropic/claude-opus-5-5`
and `openrouter/anthropic/claude-opus-5.5` are two namespaces describing two
routes, not one id with two spellings — neither is ever derived or aliased from
the other. `opencode` and `opencode-go` are likewise distinct: an id present
under one does not resolve under the other (`MISSING_MODEL_REFUSED`, no
namespace fallback).

The **open-weight lane** (`fireworks`) is eligible for `public` data only, under
residual `FIREWORKS_TRANSPORT_UNVERIFIED`: invariant (g) requires
`data_collection: deny` and `zdr: true` for non-public classes, and neither is
established for an inference host that is not the model's author. Internal and
restricted parcels never route there. Aggregator `routers/*` ids are excluded
outright — a router re-dispatches to an unnamed upstream, defeating the
executed-identity check the receipt chain depends on. `opencode-go` is a
declared provider carrying no bindings until its catalogue is captured
(`OPENCODE_GO_CATALOGUE_UNFETCHED`).

Frontier (coordinator and verifier) lanes admit no open-weight binding: those
roles see everything, and `KNOWN_FRONTIER_BINDINGS` holds the line in reviewed,
tested code rather than in this document.

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
