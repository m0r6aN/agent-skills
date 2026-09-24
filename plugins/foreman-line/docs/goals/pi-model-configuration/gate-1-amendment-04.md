# Scoped Gate 1 Amendment 04 — PMC-P0 AC2a Resolution Semantics and Verification Query

**Goal slug:** `pi-model-configuration`
**Raised:** 2026-09-24 by owner decision, following the PMC-P0 evidence-run stop on the AC2a endpoint-mismatch condition (coordinator reproduction recorded in `loop-directive.md` § *Evidence-run stop and coordinator reproduction*).
**Status:** **RATIFIED by the owner on 2026-09-24 — D-a1, D-b1, D-c1**
**Scope:** re-opens AC2a (and the AC2 counts statement) and the spec's Verification Plan command for PMC-P0 only. It does **not** re-open AC2b, Amendment 01 (A1–A8), Amendment 02 (M2–M4), Amendment 03, D2, the role/lane map, the rubric, or any other acceptance criterion.

The in-force text is carried in the PMC-P0 spec body (AC2a, the AC2 counts line, and the Verification Plan), which the coordinator re-promotes with this amendment; this file is the ratified rationale and the authority on conflict.

## Ratified decisions

### D-a1 — AC2a "URL mismatch" is a catalogue-internal test, never a catalogue-vs-settings comparison

AC2a's "exact public `baseUrl`" is a field to **resolve and report from the catalogue record**, not a gate against any external value. Specifically:

- **`URL mismatch` (a named AC2a refusal)** applies **only** when the literal `provider` + `id` resolves to records carrying **duplicate or mutually inconsistent `baseUrl` values within the catalogue itself** (same identity, disagreeing URLs). Comparison remains case-sensitive and literal; no alias substitution, dot/dash conversion, suffix stripping, or URL trimming.
- A **catalogue `baseUrl` that differs from a settings-registered provider `baseUrl` (`settings-projection.json`) or from a contract constant (`routing-policy/src/pi-openrouter.ts`)** is **NOT** an AC2a refusal. It is recorded as a **`static-conformance` finding for PMC-P1 and PMC-P2 to consume** — e.g. the host registering `opencode` at the `…/zen/go/v1` endpoint while catalogue `opencode` records use `…/zen/v1`/`…/zen`, and the `anthropic-messages`-served `openrouter` records (bindings 11, 15) carrying `https://openrouter.ai/api` against the `…/api/v1` contract. These are configuration/catalogue divergences, never availability or absence claims (coordinator precondition 2).

### D-b1 — binding 7 is a documented `AC2A_ZERO_MATCH` refusal and counts as acceptable AC2a evidence

The AC2a in-scope set stays **thirteen** bindings. The acceptable PMC-P0 evidence outcome is **twelve literal catalogue resolutions plus one documented `AC2A_ZERO_MATCH` refusal for binding 7 (`opencode/qwen3.8-flash`)**:

- Binding 7 resolves to **zero** records under provider `opencode`. The `qwen3.8-flash` identity appears in the frozen catalogue only under provider `opencode-go` (`…/zen/go`) and `qwen-token-plan`. Aliasing `opencode-go`→`opencode` on equal endpoints is **forbidden** and is not performed.
- The builder records binding 7 as `AC2A_ZERO_MATCH` with the named reason, reports the raw zero-match query, and **does not** fabricate a substitute, silently reclassify it, alias a provider, or count it against the AC2a thirteen as a pass. It is **evidence of a real catalogue gap**, not an unresolved acceptance criterion.
- The refusal falsifies the historical coordinator-lint L5 "present" claim, which checked the id's presence in the catalogue but **not its provider**. That falsification is recorded here for provenance; it changes no live-availability claim.
- Binding 7's live availability and enablement are **held** to A6 `live-availability` / `model-quality` and to PMC-P2 (per M4); the L5 economy-primary and L6 recommendation-only-primary roles that row carries are marked **capability-unverified / held**, never assumed present.

### D-c1 — the Verification Plan's catalogue query targets the wrong field; corrected to `providers[].models[]`

The top-level catalogue object has only `projectionVersion` and `providers` (13 provider records, each with a `models[]` array and an inner `provider` field); there is **no** top-level `models` field. The prior `$cat.models | Where-Object {…}` would return nothing and emit false `AC2A_ZERO_MATCH` refusals for every AC2a binding. The corrected literal query shape is:

```powershell
$cat = Get-Content -Raw -LiteralPath "$X/catalog-projection.json" | ConvertFrom-Json
$cat.providers | ForEach-Object { $_.models } |
  Where-Object { $_.provider -ceq 'opencode' -and $_.id -ceq 'gpt-5.6-sol' } |
  Select-Object provider, id, baseUrl, contextWindow, maxTokens, input, reasoning, cost, thinkingLevelMap
```

(An equivalent Node `providers[].models[]` filter, as the spec's "or an equivalent Node script" clause permits, is acceptable.) The outer provider grouping key is `providerKey`; the literal identity comparison is on the inner `model.provider` field.

## Consequences carried forward

1. **AC2a reported shape is fixed:** counts are stated as `13 attempted under AC2a = 12 literal resolutions + 1 documented AC2A_ZERO_MATCH (binding 7)`, and `2 under AC2b` (owner-attested bindings 1 and 10, stale-export zero-match expected, non-authoritative). `13 + 2 = 15`; Jev (`openrouter/typesafe/jev-1.13`) remains excluded, recorded as an observation. A clean AC2a pass is **not** blocked by the binding 7 refusal, provided it is documented in that shape.
2. **Endpoint divergences become downstream findings.** The capability baseline records each resolved binding's catalogue `baseUrl` verbatim and flags catalogue-vs-settings / contract `baseUrl` divergences as `static-conformance` observations explicitly assigned to PMC-P1 (contract/fixtures/refusal cases) and PMC-P2 (resolver, provider registration, enablement). They are never AC2a refusals and never availability claims.
3. **Spec re-promotion.** Because D-c edits the spec body, the `active` spec digest changes; the coordinator re-pins the new digest in `loop-directive.md` § *Dispatch record* and in the builder brief's G3 **before** resuming the evidence run. No builder edits the spec (coordinator precondition 4).
4. **Evidence standing unchanged.** Static-conformance only; freshness `not-accepted`; the export is never an availability oracle or absence proof. This amendment resolves an acceptance-semantics ambiguity; it does not assert that any model is live.

## Authority

This amendment authorizes the **resumption of the PMC-P0 evidence run only**, under the already-granted PMC-P0 Gate 2. It grants no new Gate 2, no provider spend or availability probe, no credential/host inspection, no settings/policy/schema/source change, no enablement, no merge, release, or default-route activation, and no action toward the RCM coordinator. Gate 3 remains human-owned.
