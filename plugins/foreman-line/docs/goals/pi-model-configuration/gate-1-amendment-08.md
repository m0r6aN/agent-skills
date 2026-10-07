# Scoped Gate 1 Amendment 08 — gpt-5.6-sol removal, gpt-6.1-sol frontier admission, deepseek-v4.1-flash Go

**Goal slug:** `pi-model-configuration`
**Raised:** 2026-10-07 by owner direction
**Status:** RATIFIED by owner direction 2026-10-07
**Scope:** removes `gpt-5.6-sol` from the roster; admits `gpt-6.1-sol` to the
frontier ordering and registry as its successor; admits
`opencode-go/deepseek-v4.1-flash` and end-appends it to the economy ordering.
Amendments 01–07 remain in force except where N1–N3 below are explicit.

## Evidence basis

- `evidence/models-dev-observation-20261007.json` (models.dev capture,
  2026-10-07T15:58:41Z) — establishes `openai/gpt-6.1-sol` on OpenRouter at
  $2/$10 (base tier; $4/$15 over 272k ctx), text+image+pdf modalities. Its
  `context`/`max_tokens` are null; those stay `CONTEXT_UNKNOWN`.
- `pmc-live-availability-probe-2026-10-07.md` §7.4/§7.7/§7.9 — on-host
  catalogue captures and live probes for the `opencode`/`opencode-go` legs.
- Probe O-2 — `opencode/gpt-5.6-sol` is 403 access-disabled on this host.

## N1 — gpt-5.6-sol is REMOVED (M2-style strike)

Owner direction: "gpt-5.6-sol should be removed from our models. There are
better models that are also cheaper." The strike is total, mirroring the M2
(Jev) pattern:

- Both bindings (`opencode/`, `openrouter/`) and the candidate are deleted
  from `routing-policy.yaml`.
- The `selection_order.frontier` entry is replaced in place by `gpt-6.1-sol`
  (preferred verifier; identical $2/$10 base price, newer generation — order
  semantics for every other entry are unchanged).
- `KNOWN_FRONTIER_MODELS` (src/validator.ts, reviewed code): `openai/gpt-5.6-sol`
  struck, `openai/gpt-6.1-sol` admitted. This is the quarterly-revisit-class
  code change, taken here under owner direction with tests.
- `pi-openrouter.ts` and `templates/pi-openrouter-routing.json`: the
  `openai/gpt-5.6-sol` entries become `openai/gpt-6.1-sol`.
- `hooks/model-gate.policy.json`: `gpt-5.6-sol` moves to `retired` with a
  named reason; `gpt-6.1-sol` is approved for coordinator/reviewer/verifier.
- Both L3 route legs that referenced it are re-pinned (N2).
- A reconciliation test asserts the id stays absent from the policy file.

The successor's **OpenRouter** binding declares
`data_classes: [public, internal, restricted]`: non-public eligibility rides
the policy's declared transport requirements (`data_collection: deny`,
`zdr: true`, invariant (g)) — the identical basis every other openrouter
binding's class list stands on since the CUTOVER-P4 transcription. The
**opencode** binding keeps `DATA_CLASS_UNKNOWN` (probe §7.5; see "Zen terms"
below).

## N2 — L3 re-pins

| Route | Was | Now |
|---|---|---|
| L3 `opencode` | `gpt-5.6-sol` → `claude-sonnet-5` | `gpt-6.1-sol` → `claude-sonnet-5` |
| L3 `openrouter` | `claude-sonnet-5` → `gpt-5.6-sol` | `claude-sonnet-5` → `gpt-6.1-sol` |

This also resolves the O-2 operational gap: L3's `opencode` primary no longer
refuses on this host.

## N3 — `opencode-go/deepseek-v4.1-flash` admitted; economy ordering appended

Owner-enabled on the Go workspace, catalogue-established, probed live (probe
§7.9), aligned endpoint, **$0.15/$0.60** — half the Zen binding's price.
Public-only per G-5 (`OPENCODE_GO_TRANSPORT_UNVERIFIED`). The candidate is
**end-appended** to `selection_order.economy`: for non-public classifications
the data-class filter skips it, and for public every pre-existing entry is
selected first, so no declared class/classification pair changes selection.

## Zen terms (advisory; no data-classes change ratified here)

Probe §7.9 captured `https://opencode.ai/docs/zen/` §Privacy
(`evidence/zen-docs-20261007.html`, sha256 `e67f3c27…4b9477`): zero-retention
and no-training as the stated baseline, with named exceptions (free/stealth
models, NVIDIA free endpoints, Muse Spark contributor, and 30-day retention
for OpenAI/Anthropic-served requests). This is the evidence class
`DATA_CLASS_UNKNOWN` was waiting on and supports declaring `[public]` on the
Zen bindings; widening beyond `public` is an owner-attestation decision
(Amendment 06 N6 pattern), because the 30-day upstream retention is not
zero-retention and Zen exposes no per-request ZDR control. **Not ratified
here** — recorded for the owner's decision.

## Named residuals carried

- `DATA_CLASS_UNKNOWN` — all `opencode` (Zen) bindings, pending the owner's
  ratification of the Zen-terms move above.
- `OPENCODE_GO_TRANSPORT_UNVERIFIED` — unchanged (G-5).
- `FALLBACK_SUITABILITY_UNPROVEN` — the re-pinned L3 routes, per rubric §1.
- `AVAILABILITY_UNVERIFIED` — `openrouter/openai/gpt-6.1-sol` (no OpenRouter
  probe run on this host).
- `QUALITY_UNRECORDED` — unchanged everywhere; a PONG is not a merit
  measurement.
