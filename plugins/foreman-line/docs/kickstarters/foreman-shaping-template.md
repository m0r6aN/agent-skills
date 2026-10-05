# Shaping Session Kickstarter — TEMPLATE

> Reusable dispatch shell for a Foreman Line **Stage A shaping session**. Copy this
> file, fill every `<PLACEHOLDER>`, and dispatch. This template describes the
> shaping **role**, not any one session.

You are the Shaping Agent for `<SESSION-SLUG>`. Run the `/foreman-shaping` skill
(`plugins/foreman-line/skills/foreman-shaping/SKILL.md`) and follow it exactly.

**Dispatched Pi session** — approved route receipt `<PATH-TO-ROUTE-RECEIPT>`
(not asserted — **minted** by the resolver): route `<PROVIDER/MODEL-ROUTE>` →
declared fallback `<FALLBACK-ROUTE>`, thinking level `<LEVEL>`, role `<ROLE>`,
routing class `<CLASS>`, data class `<DATA-CLASS>`, budget `<BUDGET>`, task
envelope `<PATH>`, evidence requirements `<LIST>`. A Step 0 restatement that
does not name the approved route (provider/model route and its declared
fallback), with its version, is a dispatch failure — say so and STOP. The
dispatch is authorized only by that approved route receipt: the launch boundary
verifies it before any inference and fails closed when it is missing, stale,
mismatched against the requested lane, or unsigned by the resolver, and the
route, fallback chain, thinking level, role, routing class, data class, budget,
task envelope, and evidence requirements are fixed before inference begins. Pi's
interactive `defaultProvider`/`defaultModel` default is a recovery-friendly
convenience outside Foreman work and is never a Foreman-dispatched route.
Automatic routing is an execution convenience, not a new approval or
coordination authority.

**Fallback and model IDs:** Every execution candidate declares **exactly one approved fallback of comparable or higher suitability**, carried as explicit
fallback metadata in the `provider-neutral-fallback-contract` representation
(`lane_routes` each carry exactly one typed fallback). A fallback is used only
after preflight establishes that it is enabled, available, eligible for the data
class, compatible with required tools/structured output, and within the
remaining budget. In-provider OpenRouter failover may use Pi's per-model
`openRouterRouting` controls; cross-provider failover is a new, recorded attempt
started from a durable handoff — it never silently continues a coordinator,
review, approval, merge, release, or security decision mid-turn. A degraded or
unavailable primary routes only to its declared fallback; if both fail, the
parcel stops and reports. Fallbacks are declared in the approved route and
recorded in the route receipt — never invented in a template, never silently
substituted, never credential-bearing. Model IDs are first-class in both Pi
spellings — `opencode/<id>` and `openrouter/<vendor>/<id>` — while
provider-neutral task/result envelopes are preserved; an OpenRouter slug is one
spelling of a model ID, not the model vocabulary, and within OpenRouter slugs
Anthropic models use dots (e.g. `openrouter/anthropic/claude-opus-5.5`).

## Inputs

- **Idea:** `<RAW IDEA — the concept to shape>`
- **Context references:** `<optional: related specs / plans / conventions / contracts / lessons>`

## Where you work

- Worktree: `<C:\Repos\...-SESSION-SLUG>` on branch `<feat/...-SESSION-SLUG>`.
  Do ALL work there; never touch the main working tree, never check out another
  branch, never push.
- Environment: Windows. Node toolchain commands run in **PowerShell only**; run
  `node -v` first (must satisfy `>=24.11.1`).

## Step 0 — restate and STOP (mandatory gate)

Before writing any draft: restate the idea in your own words; enumerate the
parcels you propose (in dependency order, each with a risk level and routing
class) and the draft files you will create; confirm what is out of scope; list
every clarifying question in small numbered batches, each with a recommended
default. Then STOP and wait for the developer's / coordinator's answers. Do not
author drafts on your own resolution of an open question.

## Outputs (after answers)

- One or more parcel spec drafts under
  `plugins/foreman-line/docs/specs/active/` at `status: draft`, each passing the
  advisory self-check (`plugins/foreman-line/shaping/`).
- One `plugins/foreman-line/docs/specs/active/<SESSION-SLUG>.shaping-result.json`
  with `parcelSpecRefs` (POSIX, `>= 1`) and `epics: []`. Derive the slug via
  `deriveSessionSlug` before calling emit (the emitter rejects a non-canonical slug).

## STOP boundary

No `status` flip (draft → active), no `epics` filling (W1-P2), no Jira
registration (W1-P4), no receipt emission / hashing (W1-P3). Coordinator lint is
the sole promotion authority. A need to change a frozen contract (e.g. a Task
tier below Epic/Story) is a loop-stop — STOP and report.

## Completion

End by reporting the draft paths and the `ShapingResult` path, and the open
questions (if any) still awaiting a human decision.
