# Shaping Session Kickstarter — TEMPLATE

> Reusable dispatch shell for a Foreman Line **shaping session** (the pipeline's
> first stage, turning a raw idea into linted parcel spec drafts). Copy this
> file, fill every `<PLACEHOLDER>`, and dispatch. This template describes the
> shaping **role**, not any one session.

You are the Shaping Agent for `<SESSION-SLUG>`. Run the shaping skill named in
your **installed Foreman Line plugin** (its skill directory named for shaping,
`SKILL.md`), resolved from the plugin root, not from any path in this repo's
own working tree — and follow it exactly.

**Dispatched Pi session** — approved route receipt `<PATH-TO-ROUTE-RECEIPT>`
(not asserted — **minted** by the resolver): route `<PROVIDER/MODEL-ROUTE>` →
declared fallback `<FALLBACK-ROUTE>`, thinking level `<LEVEL>`, role `<ROLE>`,
routing class `<CLASS>`, data class `<DATA-CLASS>`, budget `<BUDGET>`, task
envelope `<PATH>`, evidence requirements `<LIST>`. A Step 0 restatement that
does not name the approved route (provider/model route and its declared
fallback), with its version, is a dispatch failure — say so and STOP rather than
proceeding. The dispatch is authorized only by that approved route receipt: the
launch boundary verifies it before any inference and fails closed when it is
missing, stale, mismatched against the requested lane, or unsigned by the
resolver, and the route, fallback chain, thinking level, role, routing class,
data class, budget, task envelope, and evidence requirements are fixed before
inference begins. Pi's interactive `defaultProvider`/`defaultModel` default is a
recovery-friendly convenience outside Foreman work and is never a
Foreman-dispatched route. Automatic routing is an execution convenience, not a
new approval or coordination authority.

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

Standing constraints apply — `docs/kickstarters/STANDING-CONSTRAINTS.md`.

`<IF THIS SESSION HAS KNOWN TRAPS OR REQUIRED READING BEYOND THE INPUTS BELOW —
parcel-specific canon, prior specs or shaping results, known failure shapes —
LIST THEM HERE. OPTIONAL: leave this block out entirely when there is nothing
parcel-specific to add; unlike the Pi-session dispatch block above, which every
dispatch carries, a session's traps are inherently session-specific.>`

## Inputs

- **Idea:** `<RAW IDEA — the concept to shape>`
- **Context references:** `<optional: related specs / plans / conventions / contracts / lessons>`

## Where you work

- Worktree: `<PATH-TO-WORKTREE>` on branch `<BRANCH-NAME>`.
  Do ALL work there; never touch the main working tree, never check out another
  branch, never push.
- `<ENVIRONMENT NOTES — OS, shell, toolchain and minimum version, and any known
  shell-resolution traps in THIS repo. The dispatching coordinator fills this
  from their own environment; do not carry another repo's environment forward
  as a default.>`

## Step 0 — restate and STOP (mandatory gate)

Before writing any draft:

1. **State the approved route you are running on and confirm it matches the
   approved route receipt; a mismatch is a launch-boundary failure** — say so
   and STOP; that is a dispatch failure to report, not to work around.
2. Restate the idea in your own words; enumerate the parcels you propose (in
   dependency order, each with a risk level and routing class) and the draft
   files you will create; confirm what is out of scope.
3. List every clarifying question in small numbered batches, each with a
   recommended default.
4. **STOP and wait** for the developer's / coordinator's answers. Do not author
   drafts on your own resolution of an open question.

## Outputs (after answers)

- One or more parcel spec drafts under `docs/specs/active/` at `status: draft`,
  each passing the shaping skill's advisory self-check.
- One shaping-result artifact per your installed plugin's shaping skill
  contract, recording the parcel spec references it produced.

## STOP boundary

No `status` flip (draft → active), no downstream registration, no receipt
emission beyond the one already minted for this dispatch. Coordinator lint is
the sole promotion authority. A need to change a frozen contract is a
loop-stop — STOP and report.

## Completion

End by reporting the draft paths and the shaping-result path, and the open
questions (if any) still awaiting a human decision.
