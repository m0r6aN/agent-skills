# PMC-P0 — Candidate Role / Lane / Authority Map

> **Status: `ratified`** (owner, 2026-09-25; charter A5.4 / Q8). The candidate map
> is now the **ratified** role / lane / authority mapping. It is **authoritative
> for PMC-P1/P2 encoding** but is **still not installed policy** — the
> `routing-policy/` and `pi-openrouter.ts` surfaces are updated by PMC-P1/P2, not
> here. It confers no dispatch or enable authority on its own.

**Parcel:** PMC-P0. **Spec digest:** `133a7690b865d460586e77fb3ee5440116513272db299eceb52b09f8f81b72eb`.
**Sources:** charter D1–D8 and matrix; Amendment 01 A1–A8; Amendment 02 M2–M4; Amendment 03; Amendment 04; `routing-policy/routing-policy.yaml` `roles:` (lines 139–142), `classes:` (lines 17–32), `model_tiers:` (lines 144–194); `routing-policy/src/pi-openrouter.ts` (lanes/authority vocabulary). Raw lookups in [`pmc-p0-verification.md`](pmc-p0-verification.md) V§6.

## 1. Current vocabulary (observed, unchanged)

- `roles:` declares exactly `coordinator: frontier`, `verifier: frontier`, `builder: per-class` (yaml lines 139–142).
- `classes:` declares `boilerplate` (economy, $0.50), `standard-feature` (standard, $5), `architecture/risk` (frontier, $25), `implementation/standard` (standard, $5).
- `model_tiers:` `frontier`, `standard`, `economy`. The file's own comment says "ORDER IS THE SELECTION RULE" (line 151), which A3 replaces with deterministic ranking in PMC-P1/P2.
- `pi-openrouter.ts` has its own lane vocabulary (`routing`, `classification`, `builder`, `prose-generation`, `implementation`, `approval`, `merge`, `policy-bypass`) and authority vocabulary (`recommend-only` | `execution`).

## 2. Candidate six-lane map

The extension is additive: the three existing roles remain as **role families**,
and each lane is a sub-role within one family. Nothing is renamed.

| Lane | Candidate role (family → sub-role) | Routing class (existing / proposed) | Authority cap | Frontier-only | Independence obligation | Human gates | Declared provider rule (A3) | Matrix bindings (OpenCode · OpenRouter) |
|---|---|---|---|---|---|---|---|---|
| **L1** frontier coordination / shaping / architecture-risk | `coordinator` → `coordinator`, `shaper`, `architect` | `architecture/risk` (existing) | coordinate and shape; propose amendments; **cannot** ratify (owner), grant Gate 2/3, merge, release, or self-verify | **yes** (D5, A4 filter) | coordinator is never its own verifier; the L2 reviewer is a distinct instance, of an independent family where required (A2) | Gate 1 (owner ratification), Gate 2 (dispatch), Gate 3 (merge/release/activation), break-glass is owner-only (A1) | **pin one declared provider** — **pins `opencode`** (owner-ratified 2026-09-25), never crosses provider | 1 `opencode/claude-opus-5-5` (P, owner-attested) → 2 `opencode/gpt-6-astra` (F) · 9 `openrouter/openai/gpt-6-astra` (P) → 10 `openrouter/anthropic/claude-opus-5.5` (F, owner-attested) |
| **L2** adversarial review / verification / security audit | `verifier` → `adversarial-reviewer`, `verifier`, `security-auditor` | `architecture/risk` for elevated parcels; **proposed** new class `review/security` so review routing does not share a budget class with the work it reviews | verdict and findings **recommendation** to the coordinator; **cannot** approve, merge, release, edit the artifact, or accept its own findings | **yes** | **independent family from the builder artifact where required; applies to primary and fallback alike; denied, never downgraded; no independent eligible fallback → stop receipt** (A2, D5) | coordinator acceptance; owner Gate 3 | **pin one declared provider** — **pins `opencode`** (owner-ratified 2026-09-25) | 2 `opencode/gpt-6-astra` (P) → 1 `opencode/claude-opus-5-5` (F, owner-attested) · 10 `openrouter/anthropic/claude-opus-5.5` (P, owner-attested) → 9 `openrouter/openai/gpt-6-astra` (F) |
| **L3** complex implementation / contract repair / difficult debugging | `builder` → `builder-complex` | **proposed** `implementation/complex` (the existing `standard-feature` / `implementation/standard` classes allow only the `standard` tier) | `execution` within the parcel's Allowed Files; **no** approval, merge, release, policy bypass, or self-review | no (charter thinking "high"; separately dispatched reviewer mandatory) | reviewer (L2) must be independent of this builder's family | Gate 2 per parcel | **explicitly declared per lane** — an **EXTENSION of A3**, not a direct A3 statement (A3's "declare their preference" names *standard* implementation lanes only; see rubric §4 step 1) — **ratified**; **prefers `openrouter`** (owner-ratified 2026-09-25) | 3 `opencode/gpt-5.6-sol` (P) → 4 `opencode/claude-sonnet-5` (F) · 11 `openrouter/anthropic/claude-sonnet-5` (P) → 12 `openrouter/openai/gpt-5.6-sol` (F) |
| **L4** standard implementation / tests / integration / docs with code | `builder` → `builder-standard` | `standard-feature`, `implementation/standard` (existing) | `execution` within Allowed Files; same prohibitions as L3 | no | reviewer independent where the parcel's risk requires | Gate 2 per parcel | **explicitly declared per lane** (A3, direct: "standard implementation lanes") — **ratified**; **prefers `openrouter`** (owner-ratified 2026-09-25) | 5 `opencode/deepseek-v4-pro` (P) → 6 `opencode/gpt-5.6-terra` (F) · 13 `openrouter/openai/gpt-5.6-terra` (P) → 14 `openrouter/google/gemini-3.8-flash` (F) |
| **L5** economy boilerplate / mechanical repair / bounded research / prose | `builder` → `builder-economy` | `boilerplate` (existing) | `execution` within Allowed Files; **no** security, approval, merge, or final-verification use (charter matrix note) | no | none beyond the parcel's review requirement; never used as a verifier | Gate 2 per parcel | **cheapest eligible binding** (A3) | 7 `opencode/qwen3.8-flash` (P, **`AC2A_ZERO_MATCH`, held**) → 8 `opencode/glm-5.3-flash` (F) · 14 `openrouter/google/gemini-3.8-flash` (P) → 15 `openrouter/anthropic/claude-haiku-4.5` (F) |
| **L6** typed routing / classification — **DISABLED** | **proposed new family** `classifier` → `routing-classifier` (not a sub-role of coordinator, verifier, or builder, so it can never inherit their authority) | **proposed** `routing/classification` (non-dispatching) | `recommend-only`; typed structured output only; **no** prose, implementation, review, approval, merge, verification, or control-plane output; no cross-provider fallback; no promotion into another lane | no (and not frontier-eligible as a substitute) | n/a — carries no authority to be independent of | any re-enablement needs a **ratified amendment** (M2) | none — **`LANE_DISABLED_REFUSED` before ranking** (rubric §5); on re-enablement, only the declared order `[opencode/qwen3.8-flash, opencode/glm-5.3-flash]` | 7 (rec-only P, **held**) → 8 (rec-only F) · OpenRouter row **struck** (M2); single-provider |

P = primary, F = fallback, as given in charter matrix and spec AC2. No lane's
primary, fallback, or recommendation-only role is changed here.

### 2.1 How six lanes reconcile with three roles

- `coordinator` = L1 only. `verifier` = L2 only. Both stay pinned to `frontier` (D4/D5, validator invariant "Coordinator/verifier frontier pinning").
- `builder: per-class` expands into L3/L4/L5 sub-roles, each bound to a routing class, so "per-class" becomes explicit.
- L6 gets its **own** family, `classifier`, so a disabled, recommendation-only lane cannot be mistaken for a builder or verifier and cannot borrow their authority.
- Proposed schema shape for PMC-P1 (not implemented): `roles.<family>.<subrole> = { lane, routing_class, authority_cap, frontier_only, independence, human_gates, provider_rule }`, with the legacy three keys kept under a compatibility version per A5.5.

## 3. Collisions with current `roles:` and policy content (named, not resolved)

| # | Collision | Where | Consequence for PMC-P1/P2 |
|---|---|---|---|
| C1 | `roles:` has 3 keys; the matrix needs 6 lanes | yaml 139–142 | extend per A5.4 after owner ratification |
| C2 | L1 content ("shaping, architecture/risk") duplicates the name of an existing **routing class** `architecture/risk`, and that class is also used for elevated builder parcels (e.g. this parcel) | yaml `classes:` 25–28 | a lane and a class share a name but not a meaning; P1 must disambiguate |
| C3 | `openai/gpt-5.6-sol` is a `frontier`-tier entry commented "preferred verifier" (yaml 167) and is in `KNOWN_FRONTIER_MODELS`, but the matrix uses it as an **L3 builder** (bindings 3, 12), not in L2 | yaml 167; validator.ts 51 | the same model is verifier-preferred in policy and builder in the matrix; independence must be computed per dispatch |
| C4 | `anthropic/claude-sonnet-5` is the first `standard`-tier entry (yaml 174) but the matrix makes it **L3 complex** (bindings 4, 11), not L4 standard | yaml 174 | the tier and the lane disagree |
| C5 | `openai/gpt-6-astra` is a `frontier` "escalation" entry (yaml 170) but the matrix makes it a **primary** in L1 or L2 (binding 2: L1 fallback / L2 primary; binding 9: L1 primary / L2 fallback) | yaml 170 | role emphasis differs; the order-based tier selection is superseded by A3 |
| C6 | `google/gemini-3.8-flash` is in the `standard` tier (yaml 175) and in the matrix is both **L4 fallback** and **L5 primary** (binding 14); it was also the struck L6 OpenRouter fallback | yaml 175 | a single binding spans lanes; each lane needs its own eligibility, and the L6 use is gone (M2) |
| C7 | `pi-openrouter.ts` enables Jev with `allowedLanes: ['routing','classification']` and `authority: 'recommend-only'` — a live code encoding of L6 that M2 disabled | pi-openrouter.ts 44–82; tests | Jev gap (AC3), owned by P1/P2, **not fixed here** |
| C8 | `pi-openrouter.ts` gives `anthropic/claude-sonnet-5`, `google/gemini-3.8-flash`, and `openai/gpt-5.6-terra` the lane `builder` with `authority: 'execution'`, i.e. a flat builder lane with no L3/L4/L5 split | pi-openrouter.ts 56–73 | P1 must map `builder` onto L3/L4/L5 |
| C9 | The policy is OpenRouter-slug-only, so the `opencode` bindings (1–8) have no representation in `model_tiers` or `data_classification` | yaml whole file | A5.1–A5.2 binding layer; data-class for OpenCode is `unknown` until encoded |
| C10 | `model_tiers` includes models outside the matrix (`anthropic/claude-fable-5.1`, `google/gemini-3.1-pro-preview`, `z-ai/glm-5.3`, `x-ai/grok-4.6`, `meta/muse-spark-1.3`, `nvidia/nemotron-3.5-lightning`, `openai/gpt-5.6-luna`, `google/gemini-3.1-flash-lite`) | yaml 162–194 | the P1 migration inventory decides whether these stay as legacy alternatives; this parcel proposes nothing |
| C11 | `verifier: frontier` has a comment deferring "distinct-instance" to dispatch; A2 now requires family independence for fallbacks as a resolve-time filter | yaml 141 | P2 resolver obligation |

## 4. Owner ratification — RESOLVED 2026-09-25 (A5.4 / Q8)

1. ✅ Six-lane → role-family mapping **accepted as drafted** (incl. the new `classifier` family for L6).
2. ✅ **L1 pins `opencode`**; **L2 pins `opencode`** (A3 / Q1).
3. ✅ **L4 prefers `openrouter`** (A3, direct); the **extension granting L3 a declared provider preference is ratified** — **L3 prefers `openrouter`**.
4. ✅ Proposed routing classes **accepted**: `review/security`, `implementation/complex`, `routing/classification`.
5. ✅ Per-lane quality tolerance **`δ_L = 0`** (the rubric's proposed default, now ratified).
6. ✅ Binding 7 remains held to A6 / PMC-P2 while `AC2A_ZERO_MATCH`; L5 economy primary and L6 recommendation-only roles stay `capability-unverified` / held.

The map is **ratified** and authoritative for PMC-P1 (contract/fixtures) and
PMC-P2 (resolver/lane config). It still confers no dispatch/enable authority;
installation into policy is PMC-P1/P2 work.
