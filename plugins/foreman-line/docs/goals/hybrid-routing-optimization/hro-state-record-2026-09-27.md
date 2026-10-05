# HRO goal state record — 2026-09-27

**Goal:** `hybrid-routing-optimization` · **Recorded:** 2026-09-27 by the HRO-P1 builder (`HroP1`)
Short state note; this goal carries no `loop-directive.md`. Package-level detail lives in the
per-package records.

## Package status

| Package | Status | Record |
|---|---|---|
| HRO-P0 (mapping/contract only) | Done (2026-09-26) | `hro-p0-integration-contract.md` |
| HRO-P1 (adapter mappings/protocols + typed rejection) | **Done (2026-09-27)** | `hro-p1-mapping-contract-2026-09-27.md` |
| HRO-P2 (deterministic cache reuse in the evaluator) | **Done (2026-09-27)** | `hro-p2-cache-2026-09-27.md` (dispatch 157/157; D19 PASS) |
| HRO-P3+ (events/settlement, Pi entry, recovery, config repair, diagnostics, Jev) | Not started | — |

## HRO-P1 verification (final run, `routing-policy/`, 2026-09-27)

- `npm test`: **206 pass / 0 fail** (baseline 198/0; +8 new HRO-P1 tests, zero existing tests changed).
- `npm run typecheck` (tsc --noEmit): clean.
- `npm run lint` (`biome check .`): clean, 28 files.
- `npm run generate`: 11 schema files regenerated; parity no-drift tests green
  (`schemas/pi-openrouter-routing.schema.json` is the only content change).
- Template lockstep: `templates/pi-openrouter-routing.json` schema-valid and deep-equal to
  `PI_OPENROUTER_ROUTING` (tests `pi-openrouter.test.ts:33-44`).
- Gate receipt: coordinator decision 2026-09-27 under owner blanket authority.

## State / serialization

- `routing-policy/` single writer this window (this builder); `dispatch/**`, `spec-linter/**`,
  `foreman-config/**`, `docs/SPEC-CONVENTION.md`, `ops-console/**`, `project-scaffold/**`, and the
  other `templates/` files untouched.
- RCM-P2/P3 surfaces extended in place, never forked: adapter refusal names live in the
  `types.ts` vocabulary home (`ADAPTER_REFUSALS`), mapping provenance reuses the `DeclaredEvidence`
  envelope and `schemas.ts`'s shared builder.

## Open items carried forward

- Provenance freshness enforcement (D3 "stale catalogs beyond policy tolerance") awaits a ratified
  tolerance value — HRO-P4a's recovery ladder is the charter-designated home (HRO-P1 record §5).
- `PiModelContract`/`piModelContractFor` enrichment with `providerLocalId`/`protocol` sits at the
  HRO-P3 event reconciliation point (files outside the HRO-P1 write set).
- Charter acceptance items beyond P1 (live synthetic Pi smoke receipt, cost/quality baseline,
  recovery ladder, config-repair proposals) remain goal-level work, not P1 claims.
- HRO-P0 §4 questions A–E (canon amendments) remain owner/coordinator decisions; none was applied
  by P1 (P1 needed none — its surface is additive per the P0 integration contract §3.1).
