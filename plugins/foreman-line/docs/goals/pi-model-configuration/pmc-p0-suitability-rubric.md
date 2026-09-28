# PMC-P0 — A3 Suitability Rubric

**Parcel:** PMC-P0. **Spec digest:** `133a7690b865d460586e77fb3ee5440116513272db299eceb52b09f8f81b72eb`.
**Authority:** charter A3 (amends D4), A2 (independence), A4 (resolve-time filters), A6 (evidence states), M2 (L6 disabled), M2 consequence 3 (asymmetric provider sets), Amendment 04 D-b1.
**Status:** builder draft for review. It defines requirements that **PMC-P1 encodes** (fields, evidence threshold, refusal cases). It is not installed policy, and it ranks nothing today.
Facts cited are from [`pmc-p0-capability-baseline.md`](pmc-p0-capability-baseline.md) (`CB§n`); commands in [`pmc-p0-verification.md`](pmc-p0-verification.md) (`V§n`).

## 1. What "comparable or higher suitability" means

For lane `L`, request `Q` (data class, required capabilities, independence
obligation, required context, remaining budget), and a primary binding `P`,
a candidate `F` is **comparable or higher** than `P` iff **all** of:

1. `F` passes every hard eligibility filter (R1–R4, R6 below) for the **same**
   `Q` — the same filters `P` had to pass, never a relaxed set (A4: filters are
   never silently relaxed);
2. `F` passes the R5 budget filter (projected cost within remaining budget) for `Q`;
3. `F` survives the lane's per-lane provider step (§4 step 1) — for a pinned
   lane, `F` is of the lane's single declared provider; a fallback never
   crosses the pin. **DERIVED from A3 (coordinator F-H), not a direct A3
   quote:** A3 says frontier/review lanes "pin a single declared provider";
   reading the pin as a partition that no fallback crosses is a derivation;
4. `F.R7 ≥ P.R7 − δ_L`, where `δ_L` is an owner-ratified per-lane tolerance
   (proposed default `δ_L = 0` until ratified).

For economy-like lanes (L5), where projected cost is the dominant ordering key
(§4), term 4 still applies: a cheaper candidate is not "comparable" if its R7
falls below the tolerance.

If any term cannot be evaluated because an input is `unknown`, comparability is
**unproven** and the candidate refuses with `FALLBACK_SUITABILITY_UNPROVEN`.
"Unproven" is never read as "comparable".

## 2. Required ranking inputs

Roles of the seven inputs (charter A3: "the resolver ranks eligible bindings
on" these seven; the per-lane provider tie-break and the stable order are
applied as set out in §4):

- **R1–R4 and R6 are eligibility filters** — hard, boolean, fail → refuse with
  the named refusal. They are never relaxed and never used as ordering keys.
- **R5 (remaining budget) is a filter and, for economy-like lanes, the
  dominant ordering key.** As a filter: projected cost over the remaining
  budget refuses (`BUDGET_EXCEEDED`). As an ordering key: in L5 (economy,
  boilerplate, bounded research, prose) the eligible binding with the lowest
  projected cost is selected ("cheapest eligible binding", A3). In other lanes
  R5 is a filter only.
- **R7 (recorded quality score) is the quality ordering key.** It orders the
  candidates that survive the per-lane provider step (§4 step 1), at §4 step 2.

A candidate failing a filter is removed with its named refusal recorded; the
route receipt records **every** input for **every** candidate (A3), not only
the winner.

| # | Input | Type | Unit | Source of truth | Refusal semantics | Populatable by PMC-P0 evidence today? |
|---|---|---|---|---|---|---|
| R1 | Data-class eligibility | enum-set membership: `{public, internal, restricted}` → boolean per binding | — | `routing-policy.yaml` `data_classification.<class>.eligible_models` + `transport_requirements` (P1 must extend to provider-prefixed bindings) | not listed for the request's class → `DATA_CLASS_INELIGIBLE`; binding not representable in policy → `DATA_CLASS_UNKNOWN` (refuse) | **Partial.** OpenRouter bindings 9, 11–15 appear in all three lists (and 10 by slug); **no `opencode` binding appears** (policy is OpenRouter-slug-only) → `unknown` for 1–8. Whether the upstream actually honours `zdr` / `data_collection` is a provider property → **A6**. |
| R2 | Required capability | boolean per required capability ∈ `{tool-use, structured-output, input-modality:<m>, reasoning, thinking-level:<lvl>}` | — | tool-use, structured-output: **no safe source** (export omits `compat`; CB§4). modality, reasoning, thinking map: catalogue record | missing required capability → `CAPABILITY_MISSING`; capability `unknown` / `capability-unverified` when required → `CAPABILITY_UNVERIFIED` (refuse; never inferred from family) | **Partial.** `input`, `reasoning`, `thinkingLevelMap` for the 12 resolved bindings. **tool-use and structured-output: no** for all 15 → **A6** (preflight/probe). |
| R3 | Independence obligation | boolean: `family(F) ∉ excluded_families(Q)` and `instance(F) ≠ instance(builder / coordinator)` | — | a **declared** `family` attribute on each logical candidate (A5.1–A5.2, P1 to encode); the dispatch record of the artifact under review | same family as the built artifact where independence is required → `INDEPENDENCE_VIOLATION` (**denied, never downgraded**, A2); family `unknown` → `INDEPENDENCE_UNPROVEN` (refuse) | **No as a verified fact.** The catalogue has no family field. P1 must encode a declared family per candidate; PMC-P0 does not infer one. Not a provider-call input — a declaration input. |
| R4 | Available context | integer | tokens | catalogue `contextWindow` (and `maxTokens` for output budget) | `contextWindow < Q.required_context` or `maxTokens < Q.required_output` → `CONTEXT_INSUFFICIENT`; field `unknown` → `CONTEXT_UNKNOWN` (refuse) | **Yes** for bindings 2–6, 8, 9, 11–15 (static, freshness-unaccepted); `unknown` for 1, 7, 10. |
| R5 | Remaining budget | decimal | USD | class `ceiling_usd` (`routing-policy.yaml` `classes`) minus recorded spend (dispatch runtime); unit prices from catalogue `cost.input` / `cost.output` in `USD per 1M tokens` | projected cost `(in_tok·cost.input + out_tok·cost.output)/1e6 > remaining` → `BUDGET_EXCEEDED`; cost unit ≠ `USD per 1M tokens` → `COST_UNIT_UNKNOWN`; cost field absent → `COST_UNKNOWN` (refuse) | **Unit prices yes** for the 12 resolved bindings (all `USD per 1M tokens`); remaining budget is a dispatch-time value, not a provider call (P2). Cache pricing is omitted by the export → excluded from projection and noted. |
| R6 | Verified availability | boolean + attestation reference | — | A6 `live-availability` receipt for the binding, within an owner-accepted freshness bound | no receipt → `AVAILABILITY_UNVERIFIED` (refuse); receipt older than the bound → `FRESHNESS_STALE_REFUSED`; timestamp after acquisition → `FRESHNESS_FUTURE_REFUSED` | **No — requires a provider call.** Routed to **A6 `live-availability`**. Catalogue presence is never used as a proxy (catalogue is not an availability oracle; freshness not accepted; `checkedAt` absent for all 15). |
| R7 | Recorded quality score | decimal in `[0, 1]` per lane, with evidence reference | score (lane-scoped) | A6 `model-quality` record for that lane | no record for the lane → `QUALITY_UNRECORDED` (unrankable); record from another lane → not transferable, same refusal | **No — requires provider calls** (task-quality evidence). Routed to **A6 `model-quality`**. No proxy (price, reputation, family, context size, or reasoning flag) is substituted. |

## 3. Evidence threshold — when a candidate is unrankable

A candidate is **rankable** only if R1–R6 each evaluate to a definite `true`
from a named source and R7 is recorded for the lane. Concretely, a candidate is
**unrankable** (and refused, never ranked last) if **any** of:

- any required input is `unknown`, `capability-unverified`, or unsupported by a named source;
- R6 is not attested by an A6 `live-availability` receipt within an owner-accepted freshness bound;
- R7 is not recorded by an A6 `model-quality` record for **this lane**;
- the binding itself did not resolve (AC2a refusal such as `AC2A_ZERO_MATCH`) or is owner-attested without live attestation (`OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY`).

**Consequence stated plainly:** on PMC-P0 evidence **no binding is rankable
today** — R6 and R7 are unpopulated for all 15, and R2 tool-use/structured-output
is `capability-unverified` for all 15. This is the correct outcome of
static-conformance evidence, not a defect. Ranking becomes possible only after
A6 attestations exist. PMC-P0 invents no proxy.

## 4. Selection order (charter A3; derived rules labelled DERIVED)

Authority, quoted: *"Provider tie-break is per-lane and declared, not global.
Frontier, adversarial-review, verification, and security/audit lanes pin a
single declared provider … Economy, boilerplate, bounded-research, and prose
lanes resolve to the cheapest eligible binding. Standard implementation lanes
declare their preference explicitly per lane. Remaining ties resolve by a
documented stable order."*

Which lane rules are A3-direct and which are derived:

- **A3-direct (quoted above):** L1/L2 "pin a single declared provider"; L5
  "cheapest eligible binding"; L4 "declare their preference explicitly per
  lane"; "remaining ties resolve by a documented stable order".
- **DERIVED from A3 (coordinator F-H), not a direct A3 quote:** the pin is a
  **partition** (a fallback never crosses it); the L4 declared preference is an
  **ordered preference**, not a partition; the proposed refusal
  `PINNED_PROVIDER_NO_ELIGIBLE`.
- **EXTENSION of A3, not a direct A3 statement:** L3's declared preference.

Amendment 01 Q1 ("provider tie-break when both eligible → per-lane declared
preference") ratifies that the tie-break is per-lane and declared. It does not
itself state the pin or the partition; those come from A3's frontier/review
lane wording.

Input to step 1 is the **eligible set**: every candidate that passed the
eligibility filters R1–R4 and R6 and the R5 budget filter (§2), and is rankable
(§3). Filters always run first; no step below relaxes one.

1. **Per-lane provider step — the principal selection step (A3; per-lane and declared, as ratified by Amendment 01 Q1).**
   - **L1** (frontier coordination / shaping / architecture-risk) and **L2** (adversarial review / verification / security audit) **pin a single declared provider** (A3-direct). This is a **partition**, not a preference (**DERIVED from A3 (coordinator F-H), not a direct A3 quote**): only the pinned provider's eligible bindings proceed to step 2; the other provider's bindings are removed, never used as a fallback. If the pinned provider has no eligible binding, the lane refuses (proposed name `PINNED_PROVIDER_NO_ELIGIBLE`; for L2 this is the A2 stop receipt). It never hops providers. Which provider each lane pins is an **owner declaration** — `awaiting-owner-ratification` (role map §4).
   - **L5** (economy, boilerplate, bounded research, prose) resolves to the **cheapest eligible binding**. R5 is the **dominant ordering key**: candidates are ordered by projected cost `(in_tok·cost.input + out_tok·cost.output)/1e6`, ascending. If token estimates are absent, compare `cost.output`, then `cost.input` (USD per 1M tokens), ascending. No provider is pinned; the order spans every eligible provider.
   - **L4** (standard implementation) uses the lane's **explicitly declared provider preference** (A3-direct wording: "Standard implementation lanes declare their preference explicitly per lane"). The preferred provider's eligible bindings are ordered before the other provider's. **This ordered-preference semantics (not a partition) is DERIVED from A3 (coordinator F-H), not a direct A3 quote.** Which provider is preferred is `awaiting-owner-ratification`.
   - **L3** (complex implementation) uses a declared provider preference in the same form as L4. **This is an EXTENSION of A3, not a direct A3 statement**: A3's "declare their preference" wording names *standard* implementation lanes only, and L3 is not a frontier/review lane (pin) or an economy lane (cheapest). The extension fills that gap and needs owner ratification (role map §4 item 3).
   - **L6:** not applicable — the lane refuses before any filter or ranking (§5).
   - The step never assumes two eligible providers exist (M2 consequence 3). With one provider eligible, a pin or preference that names it is a no-op, and a pin that names the absent provider refuses.
2. **R7 quality ordering within the surviving provider(s).** Descending R7 (lane-scoped). In L1/L2 this orders the pinned provider's bindings. In L3/L4 it orders within each preference group, preferred group first. In L5 it breaks ties among candidates with equal projected cost; cost stays dominant.
3. **Documented stable order, first key — declared matrix role:** `primary` before `fallback`, for candidates still equal after steps 1–2.
4. **Documented stable order, final keys — provider key**, ascending by Unicode code point (case-sensitive), then **model id**, ascending by Unicode code point (case-sensitive).

Steps 3–4 make the order **total**: `provider`+`id` is unique in the catalogue
(0 duplicate identities, CB§1), so after step 4 no two distinct candidates
compare equal. The ranking is deterministic and needs no appeal to provider
symmetry.

## 5. L6 resolution — total function

Input: any L6 request `Q`. Output: exactly one of `LANE_DISABLED_REFUSED`,
`L6_EMPTY_ELIGIBLE_REFUSED`, `L6_FORBIDDEN_OUTPUT_REFUSED`, or one binding
with authority `recommend-only`.

```
resolveL6(Q):
  # Step 1 — lane-disabled check precedes ALL eligibility, ranking, tie-break.
  if not L6_REENABLED_BY_RATIFIED_AMENDMENT:           # true today: M2 refused/disabled-lane
      return LANE_DISABLED_REFUSED                        # terminal; nothing else evaluated

  # Step 3 (checked before any candidate is considered) — unconditional prohibitions.
  if Q requests any of: authority-bearing route; cross-provider fallback;
                        prose | implementation | review | approval | merge |
                        verification | control-plane output;
                        promotion of an L6 binding into another lane's authority:
      return L6_FORBIDDEN_OUTPUT_REFUSED

  # Step 2 — the ONLY candidate list, in declared stable order, nothing else.
  C := [opencode/qwen3.8-flash, opencode/glm-5.3-flash]
  E := [c in C where c passes R1..R6 for Q]              # order of C preserved
  # Step 4 — termination
  if |E| = 0: return L6_EMPTY_ELIGIBLE_REFUSED
  return (E[0], authority = recommend-only)            # |E| = 1 or 2: first in declared order
```

Rules restated as required by AC6:

1. **Lane-disabled first.** While M2 stands, every L6 request returns `LANE_DISABLED_REFUSED`, and **no** eligibility filtering, ranking, or tie-break is evaluated. That is the only reachable outcome today.
2. **Re-enablement candidate list.** If a future ratified amendment re-enables recommendation-only use, the candidate list is **exactly** `[opencode/qwen3.8-flash, opencode/glm-5.3-flash]`, in that order. No OpenRouter entry (Jev is struck; `openrouter/google/gemini-3.8-flash` was the struck row's fallback and is not in the list), and no other binding.
3. **Forbidden unconditionally:** any authority-bearing route; any cross-provider fallback (both candidates are `opencode`; there is no OpenRouter hop); any prose, implementation, review, approval, merge, verification, or control-plane output; any promotion of an L6 binding into another lane's authority. The output is a typed recommendation that a separate authority must still accept. It is consistent with the existing `pi-openrouter.ts` structured-decision rule (`recommend-only`, prohibited `prose-generation`, `implementation`, `approval`, `merge`, `policy-bypass`), which this parcel does not modify.
4. **Termination:**
   - Step 1 returns immediately.
   - Step 3 is a finite predicate over `Q`.
   - `C` is a fixed two-element list. The filter makes at most two evaluations of finite predicates, and each either returns a definite boolean or its `unknown` refuses to `false` (§3).
   - The declared order of `C` is a total order over its two elements, so the result is fully determined by `|E| ∈ {0, 1, 2}`: 0 refuses, 1 returns that element, and 2 returns `E[0]`. **Tie-break (§4) is never invoked.**
   - No step ranks or tie-breaks by provider. Step 3 only tests whether `Q` requests a cross-provider fallback, and refuses if it does. The function is total and terminates without assuming provider symmetry, which L6 does not have (row 6 is single-provider under M2).
5. **Evidence note:** even under re-enablement, both candidates would be refused on today's evidence. Binding 7 is `AC2A_ZERO_MATCH`. Binding 8 is `capability-unverified` for structured output, which L6 requires, and R6/R7 are unpopulated. So `E = []` → `L6_EMPTY_ELIGIBLE_REFUSED`.

## 6. Inputs routed to A6 (no proxy invented)

| Input | Why a provider call is needed | Routed to |
|---|---|---|
| R6 verified availability (all 15) | reachability is only observable live; catalogue presence is not uptime. (Enablement is **not** live-only: it is statically observable from `settings-projection.json`, and AC4 derived 0 of 15 from it, CB§6.) | A6 `live-availability` |
| R7 recorded quality score (all lanes) | lane task-quality needs executed tasks | A6 `model-quality` |
| R2 tool-use, structured-output (all 15) | not in the safe field set; needs a public synthetic probe or an owner-supplied safe capability export | A6 `live-availability` preflight (or a new safe export, RCM-owned) |
| R1 upstream `zdr` / `data_collection` honouring | an upstream serving property, not a catalogue field | A6 `live-availability` |

Each input in this table **does** need a provider call (or, for tool-use and
structured-output, a new safe export) to be populated. None can be populated
from PMC-P0's static evidence.

**Coordinator ruling F-C (2026-09-25, recorded here):** AC6's instruction to
route provider-call-only inputs to A6 **governs over** the generic stop
condition "a required ranking input that cannot be populated without a provider
call". This covers R6 availability, R7 quality, and R2 tool-use /
structured-output. For a static-conformance parcel, these inputs being
unpopulated is the known, expected state. Routing them to A6 is correct and is
**not** a stop. PMC-P0 did not stop, and under this ruling it should not have.

## 7. Refusal vocabulary (for PMC-P1 to encode)

AC2a identity refusals are **distinct names**. None may be folded into another:

| Name | Condition | Negative case |
|---|---|---|
| `AC2A_ZERO_MATCH` | the literal, case-sensitive `provider`+`id` query matches 0 records | N1 (alone); present with each zero-match diagnostic (wrong-provider, case-mismatch, prefix-alias) — never with `AC2A_MULTI_MATCH`, `AC2A_URL_MISMATCH`, or `AC2A_VARIANT_SUFFIX_REFUSED`, which are non-zero-match refusals |
| `AC2A_WRONG_PROVIDER` | 0 literal matches, but the **exact** id exists under a **different** provider (no provider aliasing) | N3 (binding 7), N13, N14 |
| `AC2A_CASE_MISMATCH` | 0 literal matches, but a case-folded `provider`+`id` match exists (no case folding) | N7 |
| `AC2A_PREFIX_ALIAS_REFUSED` | 0 literal matches, but a record **of any provider** matches only after **appending or stripping a vendor prefix** (`qwen/…`, `openai/…`) — the check ignores provider (see below) | N13 (append), N14 (strip), N3 (binding 7 via `openrouter/qwen/qwen3.8-flash`) |
| `AC2A_MULTI_MATCH` | more than one record with a consistent `baseUrl` | N2 |
| `AC2A_URL_MISMATCH` | more than one record with inconsistent `baseUrl` — **catalogue-internal only** (D-a1) | N5, N6 |
| `AC2A_VARIANT_SUFFIX_REFUSED` | `:<suffix>` variant id | N4 |

A zero-match refusal carries `AC2A_ZERO_MATCH` (the literal count) **plus**
every distinct diagnosed condition that applies. Binding 7's recorded refusal is
`AC2A_ZERO_MATCH` (fixed by Amendment 04 D-b1); its diagnosed conditions,
`AC2A_WRONG_PROVIDER` and `AC2A_PREFIX_ALIAS_REFUSED`, are recorded under their
own names alongside it (V§8 N3).

**Zero-match diagnostic scope, stated so PMC-P1 can encode it without
ambiguity.** For a query `(Qp, Qi)` with 0 literal matches, each diagnostic is
evaluated **independently over the whole catalogue**, and the refusal set is
`{AC2A_ZERO_MATCH}` plus every diagnostic that fires:

- `AC2A_WRONG_PROVIDER` fires iff some record has `id == Qi` (exact,
  case-sensitive) and `provider != Qp`.
- `AC2A_CASE_MISMATCH` fires iff some record's `provider`+`id` equals
  `(Qp, Qi)` after case folding, but not literally.
- `AC2A_PREFIX_ALIAS_REFUSED` fires iff some record, **of any provider
  (provider is ignored)**, has `id != Qi` and either `id` ends with `"/" + Qi`
  (vendor prefix **appended** to the query) or `Qi` ends with `"/" + id`
  (vendor prefix **stripped** from the query). Comparison is case-sensitive.

The prefix check does not require the matching record to share the query's
provider, so it can fire together with `AC2A_WRONG_PROVIDER`. A single record
can also combine a provider switch with a prefix. Example: binding 7
`opencode/qwen3.8-flash` fires `AC2A_WRONG_PROVIDER` (exact id under
`opencode-go` and `qwen-token-plan`) **and** `AC2A_PREFIX_ALIAS_REFUSED`
(`openrouter/qwen/qwen3.8-flash`, a provider switch plus an appended `qwen/`
prefix). The two names are recorded side by side; neither implies or replaces
the other (V§8 N3, N13, N14).

Other refusals and holds:
`OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY` (a hold, not a refusal),
`DATA_CLASS_INELIGIBLE`, `DATA_CLASS_UNKNOWN`, `CAPABILITY_MISSING`,
`CAPABILITY_UNVERIFIED`, `INDEPENDENCE_VIOLATION`, `INDEPENDENCE_UNPROVEN`,
`CONTEXT_INSUFFICIENT`, `CONTEXT_UNKNOWN`, `BUDGET_EXCEEDED`, `COST_UNKNOWN`,
`COST_UNIT_UNKNOWN`, `AVAILABILITY_UNVERIFIED`, `FRESHNESS_STALE_REFUSED`,
`FRESHNESS_FUTURE_REFUSED`, `QUALITY_UNRECORDED`,
`FALLBACK_SUITABILITY_UNPROVEN`, `DIGEST_MISMATCH_REFUSED`,
`LANE_DISABLED_REFUSED`, `L6_FORBIDDEN_OUTPUT_REFUSED`,
`L6_EMPTY_ELIGIBLE_REFUSED`, `PINNED_PROVIDER_NO_ELIGIBLE` (§4 step 1). Names
other than those fixed by the spec and Amendment 04 are **proposed**; PMC-P1
owns the final encoding. Negative cases N1–N14 in V§8 exercise the identity
(including wrong-provider, case-mismatch, and vendor-prefix alias), freshness,
cost-unit, thinking-map, and digest refusals on in-memory copies.
