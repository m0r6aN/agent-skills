# Scoped Gate 1 Amendment 09 — Zen bindings declared `public` (data-classes ratification)

**Goal slug:** `pi-model-configuration`
**Raised:** 2026-10-07 by owner direction ("ratify as recommended")
**Status:** RATIFIED by owner direction 2026-10-07
**Scope:** exactly one envelope on ten bindings. Nothing else moves — no
routes, no ordering, no registry, no price. Amendments 01–08 remain in force.

## Evidence basis

`https://opencode.ai/docs/zen/` §Privacy, captured 2026-10-07 and hash-pinned
at `evidence/zen-docs-20261007.html` (109,235 bytes, sha256
`e67f3c27e430a72ecb95dc7dacb05bbf1ade082bcb34e2bcdc830d7e064b9477`), recorded
in probe §7.9. The page states, first-party:

- "All our models are hosted in the US and EU. Our providers follow a
  **zero-retention policy and do not use your data for model training**", with
  named exceptions: free/stealth models (Big Pickle, Exo Free, Fledge Alpha
  Free, MiMo-V2.6-Flash Free, Ling 3.0 Flash Fin Free), NVIDIA free endpoints
  (logged for security and improvement, unlinked to identity), and Muse Spark
  1.3 Contributor Free (trains on prompts/completions by design).
- Requests served by **OpenAI APIs** and **Anthropic APIs** are **retained for
  30 days** under those vendors' data policies.

## N1 — `data_classes: [public]` on the Zen (`opencode`) bindings

Ten bindings move from `unknown/DATA_CLASS_UNKNOWN` to
`declared: [public]`, sourced to the capture above:

`claude-opus-5-5`, `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-luna`,
`claude-sonnet-5`, `claude-sonnet-5-5`, `deepseek-v4-pro`,
`deepseek-v4.1-flash`, `gpt-5.6-terra`, `glm-5.3-flash` (all `opencode/`).

Why `public` is the defensible line: public data is disclosable by definition,
so even the exception rows (30-day retention; NVIDIA logging; contributor
training) do not endanger it, and the baseline statement covers every
non-exception id outright. Why **not** wider: 30-day upstream retention is not
zero-retention, and invariant (g) is written in terms of gateway controls
(`data_collection: deny`, `zdr: true`) that Zen does not expose per-request.
`internal`/`restricted` on Zen remains an owner-attestation decision
(Amendment 06 N6 pattern), explicitly **not** taken here.

**Excluded:** `opencode/qwen3.8-flash` keeps `DATA_CLASS_UNKNOWN`. Its identity
sits under `AC2A_ZERO_MATCH_HELD` (contested by measurement, disposition
pending owner decision); a held binding gains no new declared facts piecemeal.

## Consequences (recorded, not smuggled)

- **Dispatch eligibility (A5.2):** the ten bindings are now eligible for
  `public`-classified work. This is the intended unlock — the L1–L5 `opencode`
  routes can actually serve public traffic, and `selection_order` candidates
  with Zen bindings are selectable for public tasks.
- **Fallback contract:** the data-class subset check (fallback may never
  relax its primary's declared classes) now activates on the five `opencode`
  lane routes; all five pass — every leg is uniformly `[public]`.
- The free-tier exception models named on the Zen page are **not** roster
  bindings (the roster's standing position already excludes free/contributor
  tiers); `nemotron-3.5-lightning` has no Zen binding, so no exception row
  touches this file.

## Named residuals

- `DATA_CLASS_UNKNOWN` — retained by `opencode/qwen3.8-flash` only (held
  binding, above); the residual stays in the vocabulary.
- `OPENCODE_GO_TRANSPORT_UNVERIFIED` — unchanged; this amendment is about the
  Zen provider, not the Go gateway (G-5 stands).
- `FIREWORKS_TRANSPORT_UNVERIFIED` — unchanged.
