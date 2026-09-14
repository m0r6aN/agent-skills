---
ticket: SUPERCHARGE-P1
title: Phase 1 — authorize live-verified model families in routing surface
status: active
owner: clinton.morgan
created: 2026-09-14
updated: 2026-09-14
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/routing-policy/
  - plugins/foreman-line/dispatch/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
---

## Intent

Authorize the eight supercharge model families in foreman-line's routing surface using only live-verified pinned IDs (OpenRouter catalog fetched 2026-09-14 plus provider docs). OpenRouter-routable pins land in `routing-policy.yaml` + `validator.ts` (+ tests); native-only pins are recorded as authorized-but-not-routable with receipts; unverifiable IDs are excluded by name. This is Phase 1 only of the supercharge carryover: no ceilings change, no fallback, no dispatch logic change.

## Constraints

1. Base: `c58154b`. Branch: `feat/foreman-line-supercharge`. Standing constraints apply: `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.
2. Parent directive: `plugins/foreman-line/docs/kickstarters/foreman-line-supercharge-carryover.md` (Phases 2–4 out of scope); parcel kickstarter: `plugins/foreman-line/docs/kickstarters/foreman-line-supercharge-phase1-models.md`.
3. Live-verification receipts (source + timestamp 2026-09-14, read-only public fetches only):
   - GPT-6 Astra VERIFIED: native `gpt-6-astra` (OpenAI API docs, released 2026-09-03, $10/$50 per 1M, 1.05M ctx) = OpenRouter `openai/gpt-6-astra` (catalog: prompt $0.00001, completion $0.00005).
   - Claude Fable VERIFIED: native `claude-fable-5-1` (Anthropic platform docs, released 2026-09-01, $10/$50, 1M ctx) = OpenRouter `anthropic/claude-fable-5.1` (catalog match; already in policy).
   - GLM 5.3 VERIFIED: native `glm-5.3` (Z.ai docs, 2026-08-14, 1M ctx) = OpenRouter `z-ai/glm-5.3` (catalog: $1.40/$4.40 per 1M).
   - Muse Spark VERIFIED (corrected ID): native `muse-spark-1.3` (Meta research blog, released 2026-09-02, $1.25/$4.25) = OpenRouter `meta/muse-spark-1.3` (catalog match). Kickstarter's `muse-spark-1.3-free` found NOWHERE (not in OpenRouter catalog, not in Meta/LiteLLM docs) — excluded as unverified; contributor tier `meta/muse-spark-1.3-contributor` ($0.10/$0.20) trains on inputs per LiteLLM and is excluded by the v0.3 no-training-data stance.
   - Grok CORRECTED: no `Grok 5.x` exists anywhere (xAI docs list Grok 4.6 flagship, released 2026-08-12; OpenRouter catalog newest is `x-ai/grok-4.6`). `Grok 5.6` marked UNVERIFIED-AND-EXCLUDED; family pin is `grok-4.6` native / `x-ai/grok-4.6` OpenRouter ($2/$6, 500k ctx).
   - Grok Imagine Video VERIFIED native-only: `grok-imagine-video-1.5` (xAI docs 2026-08-28, $0.08/sec, 480p/720p/1080p). No OpenRouter entry — authorized-but-not-routable.
   - GPT Image 2.5 VERIFIED native-only: `gpt-image-2.5-flare` (OpenAI docs, snapshot 2026-09-08, $5 text-in / $8 image-in / $30 image-out per 1M). No OpenRouter entry — authorized-but-not-routable.
   - Gemini Omni Flash VERIFIED native-only: `gemini-omni-1.1-flash` (Google AI Studio docs, released 2026-08-27, 1M-token ctx, $0.03/s 360p, $0.10/s 720p, $0.15/s 1080p, $0.30/s 4K). No OpenRouter entry — authorized-but-not-routable.
4. Tier classification with justification: `openai/gpt-6-astra` → frontier (OpenAI flagship, $10/$50 like Fable; append LAST as escalation-only, newest last). `z-ai/glm-5.3`, `x-ai/grok-4.6`, `meta/muse-spark-1.3` → standard (builder-class coding models in standard price band; append at END of standard list so existing first-eligible selection order is unchanged — authorization widens, defaults do not move). Native-only pins stay OUT of the yaml (OpenRouter-slug-only file) and are authorized by this spec's receipt table alone.
5. Invariant (e): adding `openai/gpt-6-astra` to `model_tiers.frontier` REQUIRES the reviewed `validator.ts` code+test change (by design, not a problem). Every new tier id must also be added to all three `eligible_models` lists (identical in v0.3, D6 monotonicity preserved).
6. Do NOT change any `ceiling_usd`. Known tension preserved as fail-closed: Fable/Astra at $10/$50 exhaust the $25 architecture/risk ceiling in ~1 turn — recorded as Phase-2 input, not solved here.
7. No fallback model anywhere (GMF D13). Every unresolvable routing decision stays a named `RoutingError`. Do not touch frozen `docs/goals/model-fleet-v1/` evidence; do not weaken GMF D1–D24.
8. Credential hygiene: presence-checks only, never read/print/persist values. No provider spend or live inference calls.

## Allowed Files

- plugins/foreman-line/routing-policy/routing-policy.yaml
- plugins/foreman-line/routing-policy/src/validator.ts
- plugins/foreman-line/routing-policy/README.md
- plugins/foreman-line/routing-policy/tests/semantic-invariants.test.ts
- plugins/foreman-line/docs/kickstarters/foreman-line-supercharge-phase1-handoff.md

## Acceptance Criteria

- AC-1: `routing-policy.yaml` contains exactly four new ids (`openai/gpt-6-astra` in frontier-last; `z-ai/glm-5.3`, `x-ai/grok-4.6`, `meta/muse-spark-1.3` in standard-end) and each appears in public/internal/restricted `eligible_models`; ceilings byte-identical to v0.3; `npx tsx src/cli.ts validate routing-policy.yaml` exits 0.
- AC-2: `KNOWN_FRONTIER_MODELS` includes `openai/gpt-6-astra`; a policy edit alone adding any other frontier id still fails invariant (e); new test pins the registry entry and fails if it is removed.
- AC-3: Closed ID set — yaml/ts contain ONLY pre-existing v0.3 ids plus the four AC-1 additions. `Grok 5.6`, `muse-spark-1.3-free`, the consider-list (`wan3.0-video`, `MiniMax-H3`/`hailuo-3`, `kling-3.0`, `veo-3.1`), and any other non-AC-1 id appear NOWHERE in yaml/ts; native-only pins (`grok-imagine-video-1.5`, `gpt-image-2.5-flare`, `gemini-omni-1.1-flash`) appear NOWHERE in yaml/ts (authorized by this spec only). Verified by diffing the sorted id set extracted from yaml/ts against the pinned allowlist recorded in the handoff note.
- AC-4: `routing-policy` and `dispatch` suites green (`npm test` = `tsx --test`, plus `typecheck` + `lint` per package); dispatch selection for existing classes unchanged (first-eligible order preserved — appended ids never preempt).
- AC-5: Phase-2 handoff note (`plugins/foreman-line/docs/kickstarters/foreman-line-supercharge-phase1-handoff.md`) filed listing tensions: ceilings vs $10/$50 frontier, tier-ordering vs new capabilities, `routing_class` gaps for image/video roles, multimodal role coverage, ZDR status of new OpenRouter endpoints (Meta/xAI/Z.ai), contributor-tier exclusion.
- AC-6: The implementation diff is allowlist-only and structure-preserving: `git diff --name-only` shows only Allowed Files (hence `dispatch/` and `docs/goals/model-fleet-v1/` diffs are empty); the yaml diff adds ids to `model_tiers` + `eligible_models` only (no `ceiling_usd`, `roles`, `classes`, or `transport_requirements` change — validator CLI exit 0 plus AC-1 confirm); the `validator.ts` diff adds the single AC-2 registry entry only; no fallback/retry/failover language is introduced (diff grep for `fallback|failover|retry|try.?next|backup model|alternative model` is a tripwire, the allowlist-only shape is the proof). GMF D1–D24 non-weakening is judged by the post-build adversarial review of the implementation diff (AC-7 receipt), not by grep.
- AC-7: Parcel receipts filed per discipline — this shaping spec, the independent adversarial review findings with triage (recorded in the handoff note), the validator CLI exit-0, the full `routing-policy` suite count, the full `dispatch` suite count, and a post-build adversarial review of the implementation diff judging GMF/fallback semantics (all recorded in the handoff note).

## Out of Scope

Phase 2 routing/frontmatter comprehensiveness analysis; Phase 3 dynamic family-alias resolution (no family syntax, no resolution step, no caching policy); Phase 4 enterprise plan; any `ceiling_usd` change; any fallback or retry semantics; any dispatch evaluator logic change; any skill-injection matrix change; frozen `model-fleet-v1` evidence; `heterogeneous-agent-worker-fabric` owned concepts; the undecided consider-list (`wan3.0-video`, `MiniMax-H3`/`hailuo-3`, `kling-3.0`, `veo-3.1`) — verified only against the catalog (no OpenRouter entries found 2026-09-14 except unrelated `minimax/m2|m3`), never authorized here.

## Context & References

- plugins/foreman-line/docs/kickstarters/foreman-line-supercharge-phase1-models.md
- plugins/foreman-line/docs/kickstarters/foreman-line-supercharge-carryover.md
- plugins/foreman-line/routing-policy/routing-policy.yaml
- plugins/foreman-line/routing-policy/src/validator.ts
- plugins/foreman-line/routing-policy/README.md
- plugins/foreman-line/dispatch/src/routing-eval/index.ts
- plugins/foreman-line/docs/goals/governed-model-fleet/charter.md (D12–D13, D24)

## Verification Plan

`surfaces:` lists `dispatch/` as verification-only (its suites run; zero dispatch edits authorized — Allowed Files grants none). Literal commands:

```powershell
# from plugins/foreman-line/routing-policy/
npx tsx src/cli.ts validate routing-policy.yaml  # expect exit 0
npm test           # tsx --test tests/*.test.ts
npm run typecheck  # tsc --noEmit
npm run lint       # biome check .
# from plugins/foreman-line/dispatch/
npm test
npm run typecheck
npm run lint
# from repo root
git diff --check
git diff --name-only c58154b...HEAD  # must be subset of Allowed Files
```

Confirm `git diff` touches only Allowed Files. Mandated reviewer focus questions: (1) does any new id preempt an existing first-eligible selection for any class/classification pair? (2) is the frontier registry addition the narrowest possible change that still satisfies invariant (e)? (3) does the spec's prose exclude the naive reading that native-only pins are dispatch-routable? (4) is every excluded ID excluded by name with its evidence, not silently dropped?
