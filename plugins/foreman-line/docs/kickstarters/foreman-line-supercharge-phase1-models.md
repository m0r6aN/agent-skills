# Kickstarter — foreman-line supercharge Phase 1: authorize new models

**Date:** 2026-09-14 · **Owner:** Clinton Morgan · **Status:** ready to dispatch
**Branch:** `feat/foreman-line-supercharge` (based at `c58154b`, PR #22 merge; tree is clean — verify with `git status` before touching anything)
**Parent directive:** `plugins/foreman-line/docs/kickstarters/foreman-line-supercharge-carryover.md` (Phases 1–4 overview — this kickstarter covers **Phase 1 only**)
**Plugin root:** `D:\Repos\agent-skills\plugins\foreman-line`

## Mission (Phase 1 only)

Add the 8 model families below to foreman-line's authorized routing surface. Every ID must be **verified live before it is written anywhere** — never resolved from memory. Phases 2 (routing/frontmatter analysis), 3 (dynamic family-alias resolution), and 4 (enterprise plan) are explicitly out of scope; record tensions for them, do not solve them here.

## Step 0 — Read the canon first

1. Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` (include the one-line reference in every builder/reviewer prompt you spawn).
2. `plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md`, `plugins/foreman-line/docs/SPEC-CONVENTION.md`, `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`.
3. Parcel discipline is shaping → independent adversarial review → dispatch, with receipts at every stage. This Phase 1 work is itself a parcel: shape it (spec under `docs/specs/active/` per SPEC-CONVENTION), get the independent review, then implement.

## Step 1 — Read every file where models live (before editing any of them)

- `routing-policy/routing-policy.yaml` (v0.3) — tiers (`frontier`/`standard`/`economy`), ordered first-eligible selection, classification-gated eligibility, `ceiling_usd`. Header rule: OpenRouter slugs verbatim, Anthropic uses dots.
- `routing-policy/src/validator.ts` — hardcoded `KNOWN_FRONTIER_MODELS`; invariant (e) forbids frontier-by-policy-edit. Any new frontier model costs a reviewed code+test change **by design** — that is this parcel's expected shape, not a problem.
- `dispatch/src/routing-eval/` (`index.ts`, `shadow.ts`) — tier-walking dispatcher. No runtime fallback exists: quota exhaustion fails the task outright.
- `dispatch/src/skill-resolver/`, `skill-injection/skill-injection.yaml` — role→skill injection (mechanical, parcel `surfaces:`-driven; likely untouched, confirm).
- Prior art (read, do not duplicate or weaken): `docs/goals/governed-model-fleet/charter.md` (D12–D13: gateway custody, one-attempt-per-permission, **no automatic fallback**; D24: dynamic empirical routing out of GMF V1 scope), `docs/goals/model-fleet-v1/` (**frozen NO-GO** — never rewrite), `docs/goals/heterogeneous-agent-worker-fabric/` (owns production routing/registry — deconflict on first overlap).

## Step 2 — Live-verify every model ID (no writes before this is done)

Resolve and authorize:

| Family (authorize this) | Expected pinned ID today | Route / account (verified 2026-09-13) |
|---|---|---|
| Muse Spark | `muse-spark-1.3-free` | Free tier; ⚠️ no CLI accepts this ID yet — authorized but not routable until a supporting CLI exists |
| Grok | ⚠️ **VERIFY FIRST** — user said "Grok 5.6" but xAI's documented surface is Grok 4 + `grok-imagine-video-1.5`. Confirm exact ID via xAI docs/OpenRouter catalog; do not invent it | Owner has paid Grok (SuperGrok = app use; API needs separate xAI credits) |
| GPT-6 Astra | `gpt-6-astra` (OpenRouter slug form TBD — check `openrouter.ai/api/v1/models`) | Owner confirms enabled; OpenAI flagship, pair with high effort |
| Grok Imagine Video | `grok-imagine-video-1.5` (native) | Separate xAI API credits required |
| GPT Image 2.5 | `gpt-image-2.5-flare` (native) | Covered by existing `OPENAI_API_KEY` (verify billing, never inspect the value) |
| Gemini Omni Flash | `gemini-omni-1.1-flash` (native; OpenRouter slug TBD) | Owner has AI Studio key (free tier trials; billing for volume). Google's documented default video model |
| GLM 5.3 | `glm-5.3` native / `z-ai/glm-5.3` on OpenRouter | Covered by owner's OpenRouter key (27 providers, failover) — no new account |
| Claude Fable | `anthropic/claude-fable-5.1` on OpenRouter (dots, not dashes); `claude-fable-5-1` native API | API GA; verify plan entitlement |

Also consider (already researched, not yet decided — verify only, do not authorize without owner sign-off): `wan3.0-video`, `MiniMax-H3` / `minimax/hailuo-3`, `kling-3.0`, `veo-3.1`.

Lookup sources in priority order: OpenRouter `/api/v1/models` (canonical for slugs/prices), provider docs for natives. Read-only public catalog/docs fetches **are** the required verification method. Anything authenticated, metered, or mutating (including any provider spend or live inference call) needs explicit human authorization per call. Credential hygiene per model-fleet-v1 D11 pattern: presence-checks only, never read/print/persist values. Record for each family: pinned ID, lookup source, timestamp — this is the receipt Phase 3 will later automate.

## Step 3 — Implement

- Classify each verified model into a tier with justification; make the `validator.ts` code+test change for every new frontier model per invariant (e). Expected frontier candidates: GPT-6 Astra, Claude Fable 5.1 (both ~$10/$50) — confirm against live prices.
- **Do not change `ceiling_usd` values in Phase 1.** Known tension: Fable 5.1 / GPT-6 Astra pricing blows the $25 architecture/risk ceiling in ~1 turn. Authorize the models, preserve fail-closed behavior, and record the tension as a named Phase-2 input.
- **No fallback model anywhere.** Every unresolvable routing decision is a named, receipted failure. Do not weaken GMF D1–D24; do not touch frozen `model-fleet-v1` evidence.
- Keep tests green per package (`biome.json`/`tsconfig.json`/vitest in each dir); run the affected suites (`routing-policy`, `dispatch`) before finishing.
- Owner hardware context: RTX 3500 Ada 12GB laptop — API routes over local inference for anything large.

## Exit criteria

1. All 8 families resolved to live-verified pinned IDs, each with source + timestamp recorded; Grok 5.x either confirmed with evidence or explicitly marked unverified-and-excluded.
2. `routing-policy.yaml` + `validator.ts` (+ tests) updated, reviewed, and green; dispatch behavior unchanged except the wider authorized surface.
3. Shaping spec + independent adversarial review + dispatch receipts filed per parcel discipline.
4. A short Phase-2 handoff note listing every recorded tension (ceilings, tier ordering, `routing_class` gaps, multimodal roles).

## Stop conditions

- Any ID cannot be verified against a live source → exclude it by name, do not guess.
- A change would require weakening a GMF invariant, touching frozen evidence, or inventing a fallback → stop and ask the owner.
- Overlap with `heterogeneous-agent-worker-fabric` ownership → deconflict before touching shared concepts.
