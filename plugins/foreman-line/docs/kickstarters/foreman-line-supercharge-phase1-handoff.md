# Handoff — SUPERCHARGE-P1 Phase 1 models (implementation receipts + Phase-2 inputs)

**Date:** 2026-09-14 · **Owner:** Clinton Morgan · **Branch:** `feat/foreman-line-supercharge` (base `c58154b`)
**Spec:** `plugins/foreman-line/docs/specs/active/SUPERCHARGE-P1-phase1-models.md`
**Status:** implemented, reviewed, suites green — awaiting owner merge decision (no merge authority claimed here)

## Implementation receipts (AC-7)

- Validator CLI: `npx tsx src/cli.ts validate routing-policy.yaml` → exit **0** (from `plugins/foreman-line/routing-policy/`).
- `routing-policy` suite: **60/60 pass** (baseline 59/59 + 1 new SUPERCHARGE-P1 pin test), `tsc --noEmit` clean, `biome check .` clean.
- `dispatch` suite: **118/118 pass** (unchanged from baseline), `tsc --noEmit` clean, `biome check .` clean.
- `git diff --check`: clean. `git diff --name-only` (tracked): exactly the four spec Allowed Files — `routing-policy.yaml`, `src/validator.ts`, `README.md`, `tests/semantic-invariants.test.ts`. `dispatch/` and `docs/goals/model-fleet-v1/` diffs empty.
- AC-6 tripwire over added (`+`) diff lines for `fallback|failover|retry|try-next|backup|alternative|second-choice`: **empty**. The only `fallback` strings in the diff are pre-existing comment context lines.

## Review chain (all independent, zero builder context)

1. Round 1 → REQUEST CHANGES (4 findings: AC-5 missing mutation authority; no fallback/frozen/GMF AC; receipts not acceptance-tested; no literal commands). Triage: all valid → fixed (handoff path added to Allowed Files; AC-6 + AC-7 added; literal commands + dispatch verification-only note).
2. Round 2 → REQUEST CHANGES (3 findings: AC-3 denylist gap for invented ts slugs; AC-6 grep bypassable + GMF unverifiable by grep; AC-7 ambiguous counts). Triage: all valid → fixed (AC-3 closed-set with set-diff method; AC-6 allowlist-only shape + GMF assigned to implementation review; AC-7 names CLI + both suites + implementation review).
3. Round 3 (fix-confirmation) → **APPROVE**.
4. Post-build implementation-diff review → **APPROVE** (6/6 checks: allowlist-only, no preemption, no fallback semantics, test binds invariant (e), GMF D12/D13/D24 clean, closed set verified). One Major: this handoff note was absent (filed here). One Minor (suggest-only, adopted): removed a tautological `assert.match` on a string literal from the new pin test; suite re-run 60/60 green, lint clean.

## Pinned closed ID set (AC-3 set-diff reference)

Allowed in yaml/ts, and only these (10 v0.3 + 4 new):

- `anthropic/claude-opus-5`, `anthropic/claude-fable-5.1`, `openai/gpt-5.6-sol`, `google/gemini-3.1-pro-preview` (frontier)
- `anthropic/claude-sonnet-5`, `google/gemini-3.8-flash`, `openai/gpt-5.6-terra` (standard, pre-existing)
- `openai/gpt-6-astra` (frontier, NEW, last), `z-ai/glm-5.3`, `x-ai/grok-4.6`, `meta/muse-spark-1.3` (standard, NEW, end)
- `openai/gpt-5.6-luna`, `google/gemini-3.1-flash-lite`, `anthropic/claude-haiku-4.5` (economy)
- Registry-only (validator, never yaml): `openai/gpt-5.5`

Excluded by name: `Grok 5.6` (no such model; latest is Grok 4.6), `muse-spark-1.3-free` (ID exists nowhere), `meta/muse-spark-1.3-contributor` (trains on inputs), `wan3.0-video`, `MiniMax-H3`/`hailuo-3`, `kling-3.0`, `veo-3.1` (no OpenRouter entries 2026-09-14; unrelated `minimax/m2|m3` only). Native-only, authorized-by-spec (NOT routable, NOT in yaml): `grok-imagine-video-1.5`, `gpt-image-2.5-flare`, `gemini-omni-1.1-flash`.

## Phase-2 inputs (AC-5 tensions, not solved here)

1. **Ceilings vs $10/$50 frontier:** Fable 5.1 / GPT-6 Astra exhaust the $25 `architecture/risk` ceiling in ~1 turn. Fail-closed preserved; Phase 2 must decide (raise ceiling? per-model budgets? escalation-only accounting?).
2. **Tier ordering vs capability:** new ids appended at list-ends so defaults never move — deliberate under-routing (glm-5.3/grok-4.6/muse-spark-1.3 never dispatch while earlier ids stay eligible). Phase 2 must set intentional order.
3. **`routing_class` gaps:** no class for image/video generation roles; native-only pins have no routable surface. Phase 2 analysis must cover multimodal roles.
4. **ZDR status of new endpoints:** Meta / xAI / Z.ai OpenRouter endpoints' `data_collection`/`zdr` posture unverified beyond policy's declared consumer obligation. Confirm before any non-public traffic.
5. **Contributor-tier exclusion:** `meta/muse-spark-1.3-contributor` ($0.10/$0.20) trains on inputs — permanently excluded under the v0.3 stance unless policy revisits it explicitly.
6. **Spec correction note:** the spec's Verification Plan originally named `vitest`; the packages use `tsx --test` (`npm test`). Corrected in-spec pre-implementation; downstream readers use `npm test` / `npm run typecheck` / `npm run lint`.
