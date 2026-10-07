# Carryover — Supercharge foreman-line (enterprise-grade powerhouse)

**Date:** 2026-09-14 · **Owner:** Clinton Morgan · **Status:** kickoff directive for a fresh session
**Plugin root:** `D:\Repos\agent-skills\plugins\foreman-line`
**Prior session:** Automations hub model-catalog work (`D:\Repos\Automations\hub\server.mjs` → 14-entry `MODEL_CATALOG` with per-task/per-category selection). That hub work is the *consumer-side* precedent; this directive is about the *foreman-line* side: parcel role routing, frontmatter, and the full plugin.

## Mission (in order)

1. **Add new models** (list below) to foreman-line's authorized routing surface.
2. **Analyze** current agent-model routing + frontmatter architecture: is it comprehensive enough for any parcel task with **no fallback model** (fail closed, never silent substitution)?
3. **Implement dynamic family-alias resolution**: authorize families (e.g. `Claude Fable`), and make the shaper/coordinator resolve the latest pinned version at shape/dispatch time (e.g. 5.1 today, 5.2 automatically when released) via live lookup — no code/policy edits on new releases.
4. **Analyze the rest of foreman-line** and produce a plan to make it a truly exceptional, enterprise-grade powerhouse.

## Phase 1 — Add models

Resolve and authorize (verify every ID live before writing it anywhere):

| Family (authorize this) | Expected pinned ID today | Route / account (verified 2026-09-13) |
|---|---|---|
| Muse Spark | `muse-spark-1.3-free` | Free tier; ⚠️ no CLI accepts this ID yet — authorized but not routable until a supporting CLI exists |
| Grok | ⚠️ **VERIFY FIRST** — user said "Grok 5.6" but xAI's documented surface is Grok 4 + `grok-imagine-video-1.5`. Confirm exact ID via xAI docs/OpenRouter catalog; do not invent it | Owner has paid Grok (SuperGrok = app use; API needs separate xAI credits) |
| GPT-6 Astra | `gpt-6-astra` (OpenRouter slug form TBD — check `openrouter.ai/api/v1/models`) | Owner confirms enabled; OpenAI flagship, pair with high effort |
| Grok Imagine Video | `grok-imagine-video-1.5` (native) | Separate xAI API credits required |
| GPT Image 2.5 | `gpt-image-2.5-flare` (native) | Covered by existing `OPENAI_API_KEY` (verify billing, never inspect the value) |
| Gemini Omni Flash | `gemini-omni-1.1-flash` (native; OpenRouter slug TBD) | Owner has AI Studio key (free tier trials; billing for volume). Google's documented default video model |
| GLM 5.3 | `glm-5.3` native / `z-ai/glm-5.3` on OpenRouter | Covered by owner's OpenRouter key (27 providers, failover) — no new account |
| Claude Fable | `anthropic/claude-fable-5.1` on OpenRouter (dots, not dashes — see yaml header); `claude-fable-5-1` native API | API GA; verify plan entitlement |

Also consider (already researched, not yet decided): `wan3.0-video` (Alibaba preview approval already filed by owner; also on OpenRouter), `MiniMax-H3` / `minimax/hailuo-3` (OpenRouter, no new account), `kling-3.0`, `veo-3.1`.

**Where models live today (read all before editing):**

- `routing-policy/routing-policy.yaml` (v0.3) — tiers (`frontier`/`standard`/`economy`), ordered first-eligible selection, classification-gated eligibility, ceiling_usd. Note the header: OpenRouter slugs verbatim, Anthropic uses dots.
- `routing-policy/src/validator.ts` — hardcoded `KNOWN_FRONTIER_MODELS` (5 pinned IDs); invariant (e) forbids frontier-by-policy-edit. Any new frontier model costs a reviewed code+test change by design.
- `dispatch/src/routing-eval/` (+ `shadow.ts`) — the dispatcher that walks tiers in order. **No runtime fallback exists**: quota exhaustion fails the task outright (see yaml `data_classification` comment).
- `dispatch/src/skill-resolver/`, `skill-injection/skill-injection.yaml` — role→skill injection (mechanical, parcel `surfaces:`-driven).
- Related prior art (read, do not duplicate): `docs/goals/governed-model-fleet/charter.md` (D12–D13: gateway custody, one-attempt-per-permission, **no automatic fallback**; D24: dynamic empirical routing explicitly **out of GMF V1 scope**), `docs/goals/model-fleet-v1/` (**frozen NO-GO** negative evidence — never rewrite), `docs/goals/heterogeneous-agent-worker-fabric/` (owns production routing/registry — deconflict ownership before touching shared concepts).

## Phase 2 — Routing + frontmatter comprehensiveness analysis

Frontmatter surface: `spec-linter/schemas/spec-frontmatter.schema.json` (required: ticket/title/status/owner/created/updated/risk/surfaces/routing_class; optional: permission_profile, data_classification) + `shaping/src/self-check.ts` + `shaping/tests/frontmatter-selfcheck.test.ts` + `skills/*/SKILL.md` frontmatter usage.

Deliverable: a findings doc answering — can every parcel task class (`boilerplate`, `standard-feature`, `architecture/risk`, `implementation/standard`, plus any missing classes you identify) resolve to an authorized model for every role (coordinator/verifier/builder + researcher/reviewer/tester/documenter/adversarial) under every data classification, with **no fallback model**? Every gap must fail closed with a named error, never a silent substitution. Cover: multimodal/image/video roles (new with Phase 1 models), ceiling adequacy for new price points (Fable 5.1 is $10/$50 — blows the $25 architecture/risk ceiling in ~1 turn; GPT-6 Astra is $10/$50 too), tier ordering vs. new capabilities, and whether `routing_class` enum needs new values.

## Phase 3 — Dynamic family-alias resolution (the core design change)

Owner's rule: authorize **families** (`Claude Fable`), resolve latest **pinned version** dynamically (`5.1` now, `5.2` on release with zero edits). Constraints from the existing architecture that the design must satisfy (not bypass):

- Validator invariant (e): frontier redefinition requires reviewed code+test change. Family aliases must extend this trust model, not punch through it (e.g. a versioned family registry in code + live catalog lookup producing a **receipted resolution**: family → pinned ID + lookup source + timestamp, bound into the dispatch order).
- GMF D13/D24: no automatic downstream retries/fallback; dynamic empirical routing out of GMF V1 scope. Dynamic *version resolution at shape/dispatch time with human-gated receipts* is not dynamic *runtime fallback* — keep that distinction load-bearing and explicit, or stop and ask.
- "Declared + derived, never somehow": every resolved ID must appear verbatim in `eligible_models`, tier lists, and the dispatch receipt. Resolution failure (lookup down, family unknown, no eligible version under ceiling/classification) fails the parcel closed.
- Lookup sources in priority order: OpenRouter `/api/v1/models` (canonical for slugs/prices), provider docs for natives. Cache policy + staleness bound must be specified; never resolve from memory.

Deliverable: design + implementation across `routing-policy.yaml` (family syntax), `validator.ts` (family registry + resolution invariants), `routing-eval` (resolution step with receipt), `spec-frontmatter` (only if a family pin field is needed — justify), and tests. Quarterly price/capability revisit note in the yaml header stays.

## Phase 4 — Whole-plugin enterprise analysis + plan

After routing is done, analyze the remaining aspects (shaping, dispatch, verification incl. adversarial + human-gate, approval, contracts, receipts chain, registration, integration/exit-vehicle, projection, permission-profiles, schema-scaffold, spec-linter, skill-injection, skills/, both plugin manifests) and produce a sequenced, parcel-decomposed plan (kickstarter-ready per `docs/kickstarters/` convention) to make foreman-line enterprise-grade: multi-vendor depth, cost governance, observability/receipts, graceful degradation without fallback models, and operator UX. Do not implement Phase 4 in the same session unless the owner says so.

## Standing constraints (non-negotiable)

- Follow `AGENTS.md`: plan at `docs/FOREMAN-LINE-PLAN.md`, conventions at `docs/SPEC-CONVENTION.md`, dispatch via `docs/kickstarters/`, specs in `docs/specs/active|done`, coordinator pattern at `docs/COORDINATOR-PATTERN.md`. Check `docs/kickstarters/STANDING-CONSTRAINTS.md` first.
- Parcels: shaping → independent adversarial review → dispatch, with receipts at every stage. Evidence before claims; verify live (hit the real catalog/docs), never assert from memory.
- No fallback model anywhere: every unresolvable routing decision is a named, receipted failure.
- Do not weaken GMF constitutional invariants or D1–D24; do not touch frozen `model-fleet-v1` evidence; deconflict with `heterogeneous-agent-worker-fabric` ownership on first overlap.
- Credential hygiene per model-fleet-v1 D11 pattern: presence-checks only, never read/print/persist values. No provider spend or live calls without explicit human authorization per call.
- Keep tests green per package (`biome.json`/`tsconfig.json`/vitest in each dir); run the affected suites before finishing.
- Owner hardware context: RTX 3500 Ada 12GB laptop — API routes over local inference for anything large; owner accounts: OpenRouter key, AI Studio (free), paid Grok (app), Alibaba Wan 3.0 preview filed, GPT-6 Astra enabled, `OPENAI_API_KEY` present.
