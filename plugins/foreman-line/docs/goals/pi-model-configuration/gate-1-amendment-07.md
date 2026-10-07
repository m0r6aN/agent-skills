# Scoped Gate 1 Amendment 07 — L1/L2 `opencode` re-pinning to GPT-6.1 Sol / Sonnet 5.5 / GPT-6 Luna

**Goal slug:** `pi-model-configuration`
**Raised:** 2026-10-07 by owner direction
**Status:** RATIFIED by owner direction 2026-10-07
**Scope:** replaces the `opencode`-provider L1/L2 lane routes only. The
`anthropic` and `openrouter` L1/L2 routes, `selection_order`, and every other
lane are unchanged. Amendments 01–06 remain in force except where N1–N3 below
are explicit.

## Evidence basis

This amendment is grounded in a **bounded unauthenticated public metadata
observation** of the models.dev index (which mirrors the opencode.ai Zen
catalogue), retained in full:

- Source: `https://models.dev/api.json`
- Captured: `2026-10-07T15:58:40Z` → `2026-10-07T15:58:41Z` (HTTP 200,
  5,340,838 bytes, sha256
  `7471e41b5d394f5d564b54745d5640f00a0bf215ce5f4e07ea84fc02630f582c`)
- Artifact: `evidence/models-dev-observation-20261007.json`
  (raw body: `evidence/models-dev-api-20261007.raw.json`)

This capture is the named source of truth for every `state: declared` value
this amendment authorizes. It establishes **identity, cost, and input
modalities only**. The `context` and `max_tokens` fields are `null` for all
four observed ids, so context window and max output remain typed-unavailable
(`CONTEXT_UNKNOWN`) — they are never guessed. A public metadata index
establishes no transport or retention fact, so `data_classes` remains
`DATA_CLASS_UNKNOWN`, matching every other `opencode` binding. No inference
call was made and the `opencode` credential is `not_ready` on the probe host
(pmc-live-availability-probe-2026-10-07.md), so `availability` remains
`AVAILABILITY_UNVERIFIED`.

**Updated 2026-10-07 by `pmc-live-availability-probe-2026-10-07.md` §7:** the
owner configured the `opencode` credential and the follow-up probe ran. The
on-host `models-store.json` capture (`checkedAt` 2026-10-07T14:19:18Z, 84
models) — the strongest identity evidence class per Amendment 06 — establishes
context window, max output, and thinking-level keys for all four route legs,
and two independent sources agree on cost. The O-3 endpoint question is
resolved by the `pi-opencode-direct` extension source: this host registers
`opencode` at `https://opencode.ai/zen/v1`. Availability is now
`declared: live-availability` for `opencode/gpt-6.1-sol` and
`opencode/gpt-6-luna` (PONG, aligned endpoints). The Anthropic-API pair
(`claude-sonnet-5-5`, `claude-opus-5-5`) is served at `/zen` against the
registered `/zen/v1`, so H-EP withholds their attestation despite measured
PONGs — recorded as divergent, never normalized.

## N1 — New L1/L2 `opencode` routes

| Lane | Primary | Fallback |
|---|---|---|
| L1 | `opencode/gpt-6.1-sol` | `opencode/claude-opus-5-5` |
| L2 | `opencode/claude-sonnet-5-5` | `opencode/gpt-6-luna` |

Both legs of each route are provider-local (D3 satisfied: the `opencode`
gateway carries both vendors; no fallback crosses providers). The superseded
pairings — L1 `claude-opus-5-5 → gpt-6-astra`, L2 `gpt-6-astra →
claude-opus-5-5` — remain valid catalogue bindings; they are retired from the
L1/L2 routes only. `gpt-6-astra` remains in `selection_order.frontier` as the
escalation entry (SUPERCHARGE-P1).

**Provider scope was considered and rejected:** first-party `openai` is not a
declared provider (`PROVIDER_NAMES` is closed at five) and serves no Claude
models, so it cannot hold either route without violating D3. The owner's
model ids were copied from opencode.ai; the `opencode` namespace is the one
in which all four legs exist verbatim.

## N2 — Frontier registry admissions (code, with tests)

Per A7, frontier is defined in reviewed code. This amendment admits three
bindings to `KNOWN_FRONTIER_BINDINGS` (src/validator.ts), each backed by the
evidence basis above:

- `opencode/gpt-6.1-sol` — $2/$10 per Mtok base tier ($4/$15 over 272k ctx)
- `opencode/claude-sonnet-5-5` — $2/$10 per Mtok
- `opencode/gpt-6-luna` — $0.10/$0.50 per Mtok base tier ($0.20/$0.75 over
  272k ctx)

`KNOWN_FRONTIER_MODELS` is unchanged: no `selection_order.frontier` entry is
added or reordered by this amendment, so the OpenRouter-slug anchoring
invariant (e) has no new entries to check.

**L2 note.** L2 remains `frontier_only: true`; the registry admissions above
are what make a Sonnet primary lawful there. This is an admission of reviewed
bindings, not a redefinition of the frontier tier's semantics.

## N3 — The `standard`-tier comment in `selection_order`

The comment claiming no `claude-sonnet-5-5` id is established for the
`opencode`/`openrouter` catalogues is now **half-falsified**: the 2026-10-07
models.dev capture establishes the dashed `claude-sonnet-5-5` id on
`opencode`. The OpenRouter catalogue remains uncovered by an on-host capture,
so `claude-sonnet-5` is retained in `standard` and the comment is amended to
say so. No selection_order entry is added, removed, or reordered.

## Named residuals carried

- ~~`AVAILABILITY_UNVERIFIED` — all three new bindings~~ **partially resolved
  by probe §7**: declared `live-availability` for `gpt-6.1-sol` and
  `gpt-6-luna`; retained for `claude-sonnet-5-5` (H-EP, divergent endpoint).
- ~~`CONTEXT_UNKNOWN`~~ **resolved by probe §7.4** (on-host catalogue capture).
- ~~`DATA_CLASS_UNKNOWN` — all opencode bindings~~ **resolved for ten of
  eleven by Amendment 09 (same-day owner ratification)**: declared `[public]`
  on the Zen §Privacy capture; only the held `qwen3.8-flash` binding retains
  it.
- `QUALITY_UNRECORDED` — a metadata observation is not a merit measurement.
- `FALLBACK_SUITABILITY_UNPROVEN` — both new routes, per rubric §1.
- `L1_PINNED_PROVIDER_UNSET` / `L2_PINNED_PROVIDER_UNSET` — unchanged; this
  amendment re-pins routes, it does not resolve the lane provider pins.
- O-2 stands: `opencode/gpt-5.6-sol` is 403 access-disabled on this host —
  the L3 `opencode` route's primary is affected.

## Addendum A7.1 — deepseek re-enablement, v4.1-flash admission, G-3 resolution (same-day, owner direction)

Three owner actions landed after ratification and are recorded here with their
evidence (probe §§7.6–7.8):

1. **`opencode/deepseek-v4-pro` re-enabled** on the Zen workspace (§7.6's 403
   regression resolved, §7.7 PONG). Its binding's endpoint record is corrected
   to the §7.2-registered `/zen/v1` — per-model serving is aligned — and
   availability is declared `live-availability`. L4's `opencode` primary is
   attested again.
2. **`opencode/deepseek-v4.1-flash` admitted** ($0.30/$1.20, 1M ctx, 384k
   max output, text+image): owner-enabled, catalogue-established, probed
   live, aligned endpoint. **Bound but deliberately not routed** — no lane
   route or selection_order entry carries it; routing is a separate owner
   decision.
3. **G-3 resolved**: the owner enabled Global regions in the Go workspace;
   `opencode-go/deepseek-v4-pro` now probes live and is admitted
   ($0.66/$1.98, public-only per G-5). This closes the one G-3 holdout; the
   region posture change is recorded as an owner decision, not a registry
   inference.

Out of scope, noted for a future amendment: `opencode-go/deepseek-v4.1-flash`
exists in the Go catalogue at $0.15/$0.60 (half the Zen price); no binding
admitted — the owner enabled that id on the Zen workspace only.
