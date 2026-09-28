# Goal Charter — Pi Model Configuration for Foreman Line

**Goal slug:** `pi-model-configuration`  
**Created:** 2026-09-23  
**Owner:** Clinton Morgan  
**Coordinator:** unassigned — claim only through a generated loop directive at a parcel boundary  
**Status:** SCOPED GATE 1 CLOSED — initial ratification 2026-09-23; Amendment 01 (A1–A8), Amendment 02 (M1–M4), and Amendment 03 (Opus identity correction) ratified. PMC-P0 shaping authorized; Gate 2 not granted
**Mode:** repo-local configuration, routing-policy, and Pi-session integration

## Objective

Make Pi the supported execution host for Foreman Line goals, with OpenCode and
OpenRouter as the only configured inference providers.  Each supported Foreman
Line lane must resolve to an explicitly named current-best primary model and a
tested fallback.  The selection must remain bounded by Foreman's role, risk,
data, scope, approval, and budget decisions; routing must never create new
authority or hide a provider/model change from the evidence record.

"Best" means the best qualified candidate in the current Pi registry for the
lane after availability, compatibility, data-policy, context, tool-use, cost,
and task-quality checks.  It is not a permanent vendor claim.  Every quarterly
review and every deployment preflight may replace a candidate only through the
reviewed registry/configuration change specified below.

## Current baseline and authority boundary

Discovery on this workstation found Pi `0.86.1` with these configured
providers:

- `opencode` at `https://opencode.ai/zen/go/v1`;
- `openrouter` at `https://openrouter.ai/api/v1`.

The existing Pi settings enable only a small subset of these providers' current
catalogues.  The installed Pi model registry nevertheless exposes the exact
candidate IDs named in this charter.  No credentials, authentication material,
or provider calls were inspected or made while drafting it.

This goal supersedes only the **model-configuration and fallback** portion of
`../foreman-line-boundary-routing/charter.md` and the stale Pi routing template.
Its D1–D8 authority controls, especially the rule that Pi is an execution-plane
router and not the coordinator, remain binding.  `model-fleet-v1` and
`governed-model-fleet` are not implementation dependencies and receive no
authority from this charter.

## Locked decisions proposed for Gate 1

| ID | Proposed decision | Reasoning |
|---|---|---|
| D1 | Pi sessions are the standard Foreman Line session shape.  A dispatched Pi session receives a concrete provider/model route, its fallback chain, thinking level, role, routing class, data class, budget, approved task envelope, and evidence requirements before inference begins. | A generic interactive Pi default cannot safely substitute for a Foreman dispatch decision. |
| D2 | The only provider registrations shipped for this goal are OpenCode and OpenRouter.  Their endpoint URLs stay in Pi settings; credentials remain environment references and never enter Foreman Line source, templates, receipts, or prompts. | The requested provider scope is explicit without widening secret handling. |
| D3 | Every execution candidate has exactly one approved fallback of comparable or higher suitability.  In-provider OpenRouter failover may use Pi's per-model `openRouterRouting` controls; cross-provider failover is a new, recorded attempt started from a durable handoff. It never silently continues a coordinator, review, approval, merge, release, or security decision mid-turn. | OpenRouter supports model/provider failover, but an unrecorded provider swap would destroy reproducibility and reviewer independence. |
| D4 | The model matrix below is the initial operational registry. Each pair is primary → fallback; a fallback is used only after preflight establishes that it is enabled, available, eligible for the data class, compatible with required tools/structured output, and within the remaining budget. | The current Pi registry verifies these identifiers exist, while preflight prevents the configuration from treating a stale catalogue entry as an executable route. |
| D5 | Coordinator, shaping, architecture/risk, adversarial review, verifier, and security/audit lanes remain frontier-only. The reviewer/verifier selection must be a separate Pi session and, where independence is required, use a different model family from the builder unless a recorded stop condition prevents that. | A fallback must preserve the quality and independence invariant, not merely produce text. |
| D6 | Pi's `defaultProvider`/`defaultModel` is a recovery-friendly interactive default only: `opencode/qwen3.8-flash` at minimal thinking. Foreman-dispatched sessions must override it with their approved lane route. | A fast, broad-context default is useful outside Foreman work but is not an authorization to run a cheap model for a high-risk parcel. |
| D7 | Replace the routing-policy's implicit ordered-list "alternatives" with explicit fallback metadata and validation. Update its `KNOWN_FRONTIER_MODELS`, model tiers, templates, route evaluator, schemas, fixtures, and documentation so OpenCode-prefixed and OpenRouter-prefixed Pi model IDs are first-class, while preserving provider-neutral task/result envelopes. | Current policy is OpenRouter-slug-only and expressly has no runtime fallback, which contradicts the goal. |
| D8 | Model-quality and availability claims are versioned empirical configuration. Each rollout requires a public synthetic smoke suite, a no-provider-call static validation path, captured Pi/version/catalogue metadata, and per-lane pass/fail evidence. A degraded or unavailable primary routes only to its declared fallback; if both fail, the parcel stops and reports. | This makes "best" falsifiable and prevents broad auto-routing or fallback cascades. |

## Initial Pi provider and lane matrix

The table lists the provider-local primary and its fallback.  It deliberately
offers both providers in every Foreman-relevant execution category.  The route
chosen for an individual parcel is still determined by D1 and D4–D5, not by
the table's visual order.

| Foreman Line category / permitted roles | OpenCode primary → fallback | OpenRouter primary → fallback | Thinking / notes |
|---|---|---|---|
| Frontier coordination, shaping, architecture/risk | `opencode/claude-opus-5-5` → `opencode/gpt-6-astra` | `openrouter/openai/gpt-6-astra` → `openrouter/anthropic/claude-opus-5.5` | high; coordinator remains explicit, never auto-routed |
| Adversarial review, verification, security/audit | `opencode/gpt-6-astra` → `opencode/claude-opus-5-5` | `openrouter/anthropic/claude-opus-5.5` → `openrouter/openai/gpt-6-astra` | high; select a family independent of the built artifact where required |
| Complex implementation, contract repair, difficult debugging | `opencode/gpt-5.6-sol` → `opencode/claude-sonnet-5` | `openrouter/anthropic/claude-sonnet-5` → `openrouter/openai/gpt-5.6-sol` | high; builder only, with a separately dispatched reviewer |
| Standard implementation, tests, integration, documentation with code changes | `opencode/deepseek-v4-pro` → `opencode/gpt-5.6-terra` | `openrouter/openai/gpt-5.6-terra` → `openrouter/google/gemini-3.8-flash` | medium; use only inside the parcel's approved scope |
| Economy boilerplate, mechanical repair, bounded research, prose/documentation | `opencode/qwen3.8-flash` → `opencode/glm-5.3-flash` | `openrouter/google/gemini-3.8-flash` → `openrouter/anthropic/claude-haiku-4.5` | minimal/low; no security, approval, merge, or final verification use |
| Typed routing/classification recommendation only | `opencode/qwen3.8-flash` → `opencode/glm-5.3-flash` | `openrouter/typesafe/jev-1.13` → `openrouter/google/gemini-3.8-flash` | minimal; recommendation-only, validated structured output, no prose/implementation/control-plane authority |

The OpenRouter routing/classification fallback is constrained to the same typed
schema and recommendation-only lane.  It does not upgrade an unavailable Jev
sidecar into an authority-bearing agent.  All other rows are direct Pi model
selections; OpenRouter models also declare provider routing with
`allow_fallbacks: true`, `data_collection`, and `zdr` derived from the Foreman
data classification.  Model-family fallbacks do not override a non-public data
policy, a spend ceiling, a tool requirement, a context limit, or a human gate.

## Required implementation parcels

| Wave | Parcel | Outcome | Risk / routing class | Depends on |
|---|---|---|---|---|
| 0 | PMC-P0 — Pi capability and catalogue baseline | Reconcile Pi 0.86.1 configuration semantics, installed model metadata, OpenCode/OpenRouter availability, model-ID spelling, tool/structured-output compatibility, and data-routing constraints into a reproducible evidence baseline. | architecture/risk; two independent reviews | Gate 1 |
| 1 | PMC-P1 — Provider-neutral fallback contract | Extend routing policy, schemas, validator, and fixtures with explicit provider/model/fallback metadata and refusal rules; retain the frontier and security invariants. | contract/architecture; two independent reviews | PMC-P0 |
| 1 | PMC-P2 — Pi configuration and route resolver | Add Pi settings/model overrides and a bounded Foreman-to-Pi resolver that emits the exact lane configuration, OpenRouter provider constraints, fallback handoff record, and no-secret route receipt. | integration/configuration; two independent reviews | PMC-P0, PMC-P1 |
| 2 | PMC-P3 — Foreman Line Pi-session canon | Replace Codex-specific session/model wording, stale OpenRouter-only templates, and any no-fallback limitation in skills, kickstarters, and docs with Pi-session dispatch requirements. | docs/architecture; one independent review | PMC-P1, PMC-P2 |
| 3 | PMC-P4 — Conformance, smoke, and rollout gate | Execute synthetic public lane tests, static/config/schema tests, fallback simulations, route/evidence assertions, and a clean Pi-session installation check; publish a versioned model-quality review record. | integration/release; two independent reviews | PMC-P2, PMC-P3 |

Each parcel is shaped after Gate 1. Its spec must name exact allowed files,
base commit, verification commands, rollback, data class, provider spend
authority, and whether a live provider call is separately approved. This
charter grants none of those scopes by itself.

## Amendment 01 — ratified 2026-09-23

Ratified in full against `gate-1-amendment-01.md` (A1–A8, closing plan-review
findings F1–F9). Where this section conflicts with D1–D8 or the tables above,
this section governs.

### A1 — amends D1 (route receipt and launch boundary)

A dispatched Pi session is authorized only by an **approved route receipt**
emitted by the resolver. PMC-P2 owns a **launch boundary** that verifies the
receipt before any inference and **fails closed** when it is missing, stale,
mismatched against the requested lane, or unsigned by the resolver.

A **break-glass owner override** exists for the case where the resolver itself
is broken. It requires explicit owner authorization per use and emits a
distinctly marked exception receipt naming the bypassed check. It is never
available to a coordinator, builder, reviewer, or automated retry.

Direct or default Pi invocation is not a Foreman execution path. Interactive Pi
defaults (D6) sit outside the Foreman execution boundary and carry no parcel
authority.

### A2 — amends D3 (independence applies to fallbacks)

The independence requirement applies to **primary and fallback alike**. A
fallback that would collapse reviewer independence is **denied, not
downgraded**. If no independent, eligible fallback remains, the resolver emits a
failed/stop receipt naming the unsatisfied constraint and the parcel stops. A
review is never issued under reduced independence, and no automatic same-family
substitution exists. Relaxing this requires a future ratified amendment.

### A3 — amends D4 (deterministic resolver ranking)

Selection is by **deterministic resolver ranking**, not by the visual order of
the matrix. The resolver ranks eligible bindings on: data-class eligibility;
required capability (tools, structured output); independence obligation;
available context; remaining budget; verified availability; and a recorded
quality score.

**Provider tie-break is per-lane and declared, not global.** Frontier,
adversarial-review, verification, and security/audit lanes **pin a single
declared provider** so coordination and review remain reproducible and
independence does not drift with price. Economy, boilerplate, bounded-research,
and prose lanes resolve to the **cheapest eligible binding**. Standard
implementation lanes declare their preference explicitly per lane. Remaining
ties resolve by a documented stable order.

The route receipt records **every ranking input and the chosen binding**, not
only the winner. PMC-P0 produces the reviewed suitability rubric defining
"comparable or higher"; PMC-P1 encodes its required eligibility/ranking fields
and evidence threshold.

### A4 — amends D5 (constraints are resolve-time filters)

The frontier-only and different-family constraints are **binding eligibility
filters at resolve time**, not advisory preferences. A recorded stop condition
may halt a lane; it may never silently relax the constraint.

### A5 — amends D7 (representation, role map, migration)

1. **Logical layer** — a provider-neutral lane/candidate vocabulary.
2. **Binding layer** — provider-specific bindings (`opencode/...`,
   `openrouter/...`) attached to a logical candidate, carrying eligibility at
   the *binding* level.
3. **Fallback references** — explicit and typed; self-referential and dangling
   references are rejected by **referential-integrity tests**.
4. **Frozen role/lane map** — a canonical role / lane / routing-class /
   authority-cap mapping extends `roles:` beyond `coordinator|verifier|builder`
   to cover all six matrix lanes. Because this map is an **authority** map, it
   is frozen by **explicit owner ratification of PMC-P0's output**, not by
   coordinator discretion, and is ratified **before PMC-P2 starts**.
5. **Migration by deprecation window** — PMC-P1 inventories every policy,
   evaluator, template, and session consumer and ships the new representation
   **alongside** the legacy OpenRouter-slug-only representation under
   compatibility versioning. Removal of the legacy representation is
   **serialized into PMC-P4** behind a named cutover condition, so a lagging
   consumer cannot block the contract parcel.

### A6 — amends D8 (three attested evidence states)

| State | Meaning | Authority needed |
|---|---|---|
| `static-conformance` | schema, policy, resolver, negative and referential-integrity tests pass with **no provider call** | none beyond Gate 2 |
| `live-availability` | primary/fallback reachable and enabled on a public, non-sensitive probe | **separate owner authorization** |
| `model-quality` | lane-level task-quality evidence supporting a "current-best" claim | **separate owner authorization** |

Every receipt must declare which state it attests and may never imply a state
it did not attest. `static-conformance` is sufficient to call implementation
complete — **provided the completion receipt enumerates, by name, every live
and quality claim that remains unproven.** A green static suite is not evidence
that any model is reachable or performant. `live-availability` and
`model-quality` are required before activation and before any published
"current-best" claim.

### A7 — amends implementation-parcel ownership

| Parcel | Owns | Must not touch |
|---|---|---|
| PMC-P1 | schemas, policy contract, frontier registry change (incl. Claude Opus 5.5), migration inventory, compatibility versioning, fixtures | resolver, Pi config, human-facing templates |
| PMC-P2 | resolver, Pi configuration, launch boundary, break-glass path, generated route artifacts | schemas and policy contract (consumes P1 as ratified) |
| PMC-P3 | canon and human-facing templates only | the PMC-P2 interface — consumes it unchanged |
| PMC-P4 | conformance/smoke/rollout gate **and** serialized removal of the legacy representation | the ratified contract surface |

The ratified Claude Opus selection is delivered **inside PMC-P1** as a tested
change to `KNOWN_FRONTIER_MODELS` in `routing-policy/src/validator.ts`. It
cannot be delivered by configuration alone: invariant 5 rejects any
`model_tiers.frontier` entry absent from that reviewed code constant. The
then-current registry statement in Amendment 01 is superseded by Amendment 03.

Review load is unchanged: PMC-P0, P1, P2, and P4 each require **two**
independent adversarial reviews; PMC-P3 requires one.

### A8 — amends the exit criterion

Exit criteria 4 and 5 are satisfied by `static-conformance`. Criteria 2 and 3
additionally require `live-availability`, and any "current-best" claim requires
`model-quality`, each under its own owner authorization. Criterion 7's final
receipt must enumerate, by name, every live validation the owner must still
authorize or perform.

## Amendment 02 — ratified 2026-09-23 (model identity)

**M1 is superseded by Amendment 03 below.** M2–M4 remain in force.

Raised by coordinator lint (`coordinator-lint-pmc-p0.md`, findings L1–L4) and
ratified in full. Full record in `gate-1-amendment-02.md`. Where this section
conflicts with anything above, including Amendment 01 and the Gate 1 record,
**this section governs**.

### M1 — Opus identity corrected (superseded)

Historical M1 asserted that `claude-opus-5.5` and `claude-opus-5-5` did not
exist in the Pi catalogue. That assertion and the associated withdrawal are
superseded by Amendment 03.

The historical M1 route values were **`opencode/claude-opus-5`** and
**`openrouter/anthropic/claude-opus-5`**, in matrix rows 1 and 2; current route
values are defined by Amendment 03.

The Amendment 01 A7/Q5 instruction was **withdrawn under historical M1**. The
current registry change is governed by Amendment 03 and the PMC-P1 scope.

### M2 — typed routing/classification lane refused

`typesafe/jev-1.13` is enabled in Pi settings but **absent from the catalogue**,
so it resolves to a missing-model refusal. Matrix row 6's OpenRouter primary is
**struck**. The lane is ruled **refused / disabled-lane**, consistent with the
existing Routing Currency and Merit disposition.

No substitute classifier is installed, and no authority-bearing agent may be
promoted into the lane. The row's OpenCode entries remain strictly
recommendation-only with validated structured output and no prose,
implementation, or control-plane authority.

Row 6 is therefore **single-provider**. The A3 resolver must tolerate a lane
whose provider set is asymmetric across OpenCode and OpenRouter; per-lane
tie-break may not assume two eligible providers exist.

### M3 — D6 interactive default corrected

D6's recovery-friendly interactive default is corrected to the observed host
values: provider `opencode`, model **`qwen/qwen-2.5-coder-32b`**, thinking level
`minimal`. The previously stated `opencode/qwen3.8-flash` was inaccurate.

This is a **documentation correction only**. Changing the host default is not
authorized by this charter, and D6's substance is unchanged: the interactive
default confers no parcel authority and sits outside the Foreman execution
boundary (A1).

### M4 — model-enablement ownership assigned

**None** of the twelve matrix primaries and fallbacks is currently enabled; the
enabled set and the matrix set are disjoint. Enabling the matrix model set is
assigned to **PMC-P2** as explicit, named configuration work under its own
Gate 2, rather than remaining an implicit expectation of exit criterion 2.

### Evidence standing

M1–M4 rest on the unratified credential-free host-owner export at
`../routing-currency-and-merit/host-owner-export/` (catalog projection SHA-256
`b0c2dc8cf1412773b4ed4f17fcba10634a997f3b2b2b960d6dca200bdbb171fe`, generated
`2026-09-20T17:01:26.485Z`). These items **correct falsified claims**; they do
not establish live availability. Every corrected identity still requires
`live-availability` evidence under A6 before activation, and any "current-best"
claim still requires `model-quality`.

## Amendment 03 — ratified by owner direction 2026-09-24 (Opus availability correction)

This amendment supersedes **M1 only**. M2–M4 and Amendments 01 A1–A8 remain in
force. The prior coordinator lint and host-owner export concluded that the
Opus 5.5 identities were absent. The owner has now confirmed the exact live
catalogue identities: OpenCode exposes `claude-opus-5-5`, and OpenRouter
exposes `anthropic/claude-opus-5.5`.

The canonical Opus identities are therefore:

- OpenCode: `opencode/claude-opus-5-5`;
- OpenRouter: `openrouter/anthropic/claude-opus-5.5`.

The OpenRouter identity is the frontier registry spelling and must replace
the superseded Opus identity in the live policy, validator registry, fixtures, and
route expectations. No Anthropic provider registration is needed for this
correction because OpenRouter already serves the confirmed identity. The
previous absence finding remains preserved as historical evidence and is not
used as a current availability claim.

## Acceptance / exit criterion

This goal is complete only when, at one declared Foreman Line and Pi version:

1. Pi configuration contains only the OpenCode and OpenRouter registrations
   requested here, with credentials referenced but neither read nor stored.
2. Every matrix primary and fallback is enabled, normalized, preflight-tested,
   and represented in provider-neutral Foreman routing data; each fallback has
   a documented same-lane eligibility rule.
3. Every Foreman category in the matrix produces a Pi-session route record
   containing the provider, model, fallback, reason, thinking level, budget,
   data controls, and actual model/provider used.
4. Static policy, schema, resolver, and negative tests reject a missing or
   self-referential fallback, unapproved provider, unsupported model,
   fallback that violates data/tool/budget policy, and a control-plane route.
5. Synthetic public smoke tests prove normal execution, provider-local
   OpenRouter failure handling, explicit cross-provider handoff, preservation
   of reviewer independence, and stop/report when both routes fail.
6. Foreman Line's skills, routing policy, templates, kickstarters, and docs no
   longer prescribe a Codex-only session shape, an OpenRouter-only model
   vocabulary, or the obsolete ban on all fallback paths.
7. Every parcel has completed its verification and required adversarial-review
   loop; the final receipt identifies any live-provider validation the owner
   must still authorize or perform.

## Standing authorizations requested

| Gate / action | Requested state |
|---|---|
| Gate 1 — ratify D1–D8, the matrix, parcels, and exit criterion | Pending explicit owner approval |
| Plan-level adversarial review after Gate 1 | Requested; required before shaping |
| Gate 2 — dispatch PMC-P0–PMC-P4 | Not granted |
| Pi configuration/model files, Foreman Line source, templates, or tests | Not granted until per-parcel Gate 2 |
| Provider credential inspection, external provider/model call, or spend | Not granted; separate per-test authority required |
| Gate 3 — merge, release, installation, or default-route activation | Not granted |

## Stop conditions

Stop and return to the owner if:

- a primary/fallback pair cannot be proved eligible for the required data,
  tool, context, cost, or independent-review constraints;
- Pi cannot apply the required provider-routing controls or produce a durable
  route/handoff receipt;
- an existing goal coordinator claims overlapping source/configuration files;
- a live validation would need provider spend, non-public disclosure,
  credential inspection, installation, merge, or release without its explicit
  authority;
- a proposed change weakens a frontier, security, human-gate, data-class, or
  evidence invariant; or
- both members of a declared fallback pair fail or the requested action would
  require an unlisted third fallback.

## Gate 1 record

The owner ratified D1–D8, the parcels, and the exit criterion on 2026-09-23,
with one amendment: every Claude Opus route uses version 5.5.  Local Pi
catalogue discovery verified `opencode/claude-opus-5-5` and
`openrouter/anthropic/claude-opus-5.5`; therefore no direct Anthropic provider
registration is authorized or needed.  This ratification authorizes the
mandatory plan-level adversarial review only.  It does not grant Gate 2,
provider spend, credential inspection, configuration changes, merge, release,
or default-route activation.  The mandatory fresh plan review is recorded in
`plan-review-findings.md`. Its accepted fixes reopen Gate 1 only for D1,
D3–D5, D7, and D8; no parcel may be shaped until the owner ratifies the
corresponding amendment.

The scoped amendment was drafted in `gate-1-amendment-01.md` (A1–A8, covering
F1–F9) and **ratified in full by the owner on 2026-09-23**. The ratified text
is in force in the *Amendment 01* section above. The scoped Gate 1 re-open is
**closed**.

Coordinator lint on 2026-09-23 verified the charter's Pi-version, provider, and
routing-policy claims against disk, and established one consequence carried
into A7: the frontier registry is a reviewed code constant in
`routing-policy/src/validator.ts` guarded by invariant 5, so the ratified
Claude Opus 5.5 selection lands as a tested code change inside PMC-P1 rather
than as configuration.

This ratification authorizes **PMC-P0 shaping only**. It does not grant Gate 2
dispatch, provider spend, credential inspection, configuration changes, merge,
release, or default-route activation.
