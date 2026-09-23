# Scoped Gate 1 Amendment 01 — Pi Model Configuration

**Goal slug:** `pi-model-configuration`
**Raised:** 2026-09-23
**Source:** `plan-review-findings.md` findings F1–F9 (all dispositioned *Fix*)
**Scope of re-open:** D1, D3, D4, D5, D7, D8, the implementation-parcel
ownership table, and the exit criterion. **Not re-opened:** D2, D6, the Claude
Opus 5.5 selection, and the P0 → P1 → P2 → P3 → P4 sequence (F10, informational).
**Owner action required:** ratify, amend, or reject each item below. Nothing in
this document is in force until ratified.

## Coordinator lint record (claims verified on disk, 2026-09-23)

| Charter / review claim | Disk evidence | Result |
|---|---|---|
| Pi version is `0.86.1` | `pi --version` → `0.86.1` | verified |
| Routing policy is OpenRouter-slug-only | `routing-policy/src/validator.ts` `KNOWN_FRONTIER_MODELS` holds bare `vendor/model` ids; no provider-prefixed id exists | verified |
| Policy has no runtime fallback | `routing-policy.yaml` economy tier: "Later entries are eligibility alternatives, not health/quota failover." | verified |
| F5 — lanes exceed role vocabulary | `routing-policy.yaml` `roles:` declares only `coordinator`, `verifier`, `builder`; charter matrix needs six lanes | verified |
| F1 — selection is order-based, not ranked | `routing-policy.yaml` `model_tiers`: "ORDER IS THE SELECTION RULE … no price comparison at dispatch time" | verified |
| Opus 5.5 requires a code change | registry contains `anthropic/claude-opus-5`; `-5.5` is absent, and invariant 5 rejects a non-registry frontier id | verified — gap is real |
| Some Pi/OpenRouter plumbing already exists | `routing-policy/schemas/pi-openrouter-routing.schema.json`, `src/pi-openrouter.ts`, `tests/pi-openrouter.test.ts` | verified — P1/P2 extend, not greenfield |

Consequence worth the owner's attention: because the frontier registry is a
reviewed code constant guarded by invariant 5, the already-ratified Opus 5.5
decision **cannot** be delivered by configuration alone. It lands as a tested
change to `src/validator.ts` inside PMC-P1. No extra authority is requested
here; this only names where the ratified decision comes due.

## Proposed amendments

### A1 — Amends D1 (F1, F4)

Add to D1: a dispatched Pi session is authorized only by an **approved route
receipt** produced by the resolver. PMC-P2 owns a **launch boundary** that
verifies the receipt before any inference and **fails closed** when the receipt
is missing, stale, mismatched against the requested lane, or unsigned by the
resolver. Direct or default Pi invocation is not a Foreman execution path;
interactive Pi defaults (D6) sit outside the Foreman execution boundary and
carry no parcel authority.

### A2 — Amends D3 (F3)

Add to D3: the independence requirement applies to **primary and fallback
alike**. A fallback that would collapse reviewer independence is **denied, not
downgraded**. If no independent, eligible fallback remains, the resolver emits a
failed/stop receipt naming the unsatisfied constraint and the parcel stops.

### A3 — Amends D4 (F1, F9)

Replace "exactly one approved fallback of comparable or higher suitability"
selection-by-table with a **deterministic resolver ranking**. The resolver
ranks eligible bindings on: data-class eligibility; required capability
(tools, structured output); independence obligation; available context;
remaining budget; verified availability; and a recorded quality score. Ties
resolve by a **documented stable order**. The route receipt records **every
ranking input and the chosen binding**, not merely the winner. PMC-P0 produces
the reviewed suitability rubric that defines "comparable or higher"; PMC-P1
encodes its required eligibility/ranking fields and evidence threshold.

### A4 — Amends D5 (F3)

Add to D5: the frontier-only and different-family constraints are **binding
eligibility filters at resolve time**, not advisory preferences. A recorded
stop condition may halt a lane; it may never silently relax the constraint.

### A5 — Amends D7 (F2, F5, F7)

Expand D7 to define the representation and its migration:

1. **Logical layer** — a provider-neutral lane/candidate vocabulary.
2. **Binding layer** — provider-specific bindings (e.g. `opencode/...`,
   `openrouter/...`) attached to a logical candidate, carrying eligibility at
   the *binding* level.
3. **Fallback references** — explicit and typed; self-reference and dangling
   references are rejected by **referential-integrity tests**.
4. **Frozen role/lane map** — a canonical role / lane / routing-class /
   authority-cap mapping is ratified **before PMC-P2 starts**, extending
   `roles:` beyond `coordinator|verifier|builder` to cover all six matrix lanes.
5. **Consumer inventory and cutover** — PMC-P1 inventories every policy,
   evaluator, template, and session consumer; defines compatibility versioning;
   and **serializes removal** of the legacy OpenRouter-slug-only representation
   behind a named cutover condition.

### A6 — Amends D8 (F6)

Split evidence into three named, separately-attested states. Every receipt must
declare which state it attests:

| State | Meaning | Authority needed |
|---|---|---|
| `static-conformance` | schema, policy, resolver, negative and referential-integrity tests pass with **no provider call** | none beyond Gate 2 |
| `live-availability` | primary/fallback reachable and enabled on a public, non-sensitive probe | **separate owner authorization** |
| `model-quality` | lane-level task-quality evidence supporting a "current-best" claim | **separate owner authorization** |

`static-conformance` is sufficient to call implementation complete.
`live-availability` and `model-quality` are required before **activation** and
before any "current-best" claim is published. A receipt may never imply a state
it did not attest.

### A7 — Amends the implementation-parcel ownership table (F8)

| Parcel | Owns | Must not touch |
|---|---|---|
| PMC-P1 | schemas, policy contract, frontier registry change (incl. Opus 5.5), migration inventory, fixtures | resolver, Pi config, human-facing templates |
| PMC-P2 | resolver, Pi configuration, launch boundary, generated route artifacts | schemas and policy contract (consumes P1 as ratified) |
| PMC-P3 | canon and human-facing templates only | the P2 interface — consumes it unchanged |

### A8 — Amends the exit criterion (F6)

Exit criteria 4 and 5 are satisfied by `static-conformance`. Criteria 2 and 3
additionally require `live-availability`, and any "current-best" claim requires
`model-quality` — each under its own owner authorization. Criterion 7's final
receipt must enumerate, by name, every live validation the owner must still
authorize or perform.

## Ratification block

| Item | Amends | Owner decision |
|---|---|---|
| A1 | D1 | ☐ ratify ☐ amend ☐ reject |
| A2 | D3 | ☐ ratify ☐ amend ☐ reject |
| A3 | D4 | ☐ ratify ☐ amend ☐ reject |
| A4 | D5 | ☐ ratify ☐ amend ☐ reject |
| A5 | D7 | ☐ ratify ☐ amend ☐ reject |
| A6 | D8 | ☐ ratify ☐ amend ☐ reject |
| A7 | parcel ownership | ☐ ratify ☐ amend ☐ reject |
| A8 | exit criterion | ☐ ratify ☐ amend ☐ reject |

Ratifying A1–A8 closes the scoped Gate 1 re-open and authorizes **parcel
shaping for PMC-P0 only**. It does **not** grant Gate 2 dispatch, provider
credential inspection, provider spend, configuration changes, merge, release,
or default-route activation.
