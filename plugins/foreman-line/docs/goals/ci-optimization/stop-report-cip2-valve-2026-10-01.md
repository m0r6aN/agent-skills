# STOP-REPORT — CI-P2 pre-flight valve: 4 newly-eligible packages are baseline-red (2026-10-01)

> **RESOLVED 2026-10-01:** the developer chose **B (recommended)** — the #13-pinned exclusions are ratified as A2 placement 9 (run-then-waive semantics, three-axis refusal tests, expiry-on-divergence). Follow-ups for the owning lines are named in the placement. `BuildCIP2` resumed; this record stays as the decision's provenance.

**Condition:** loop-directive F4 valve ("CI-P2 discovery pre-flight finds baseline-red packages — report the measured table; the developer decides fix-in-scope vs a #13-conform pinned exclusion"). BuildCIP2 is halted at `190dfbe` (A2 ×8 placements landed first and alone); tree clean; nothing improvised.

## Measured (barrier-form serial pass, 27 discovered packages, reproduced; node 24.7.0 AND 24.19.0 both run)

**23/27 green.** `dispatch/test` red only at node 24.7.0 → **green at CI's 24.19.0** (29.3s) — node-version sensitivity, consistent with main's green CI (`81f6b6d`, `9877d25`); no action. The LF/CRLF hypothesis was tested and rejected with evidence (`.gitattributes * text=auto eol=lf`, autocrlf=false, blob≡worktree `cmp`).

**4 baseline-red (identical deterministic signatures at both node versions; zero CI history — they were never swept):**

| Package | Failing checks | Signature |
| --- | --- | --- |
| `authority-registry` | test | ETIMEDOUT (600s) + R31 reviewed-source-mapping drift (`M02-note`) + 29 semantic failures |
| `bypass-outage-harness` | test, typecheck | ENOENT missing `docs/specs/active/FK-P17-bypass-outage-matrix.md`; TS2353 `mutationScope` not in `DispatchInput`; CTL-01/02 channel gates |
| `jev-decisions` | test | 6× `LEGACY_EXECUTION_RETIRED` in p4-boundary-scenarios |
| `kernel-lease` | test, lint | ~90 failures rooted in `STORAGE_CONSTRAINT_VIOLATION foreign-key goals` at `kernel-state` insertGoal + 32 biome errors |

All four are other lines' owned surfaces (foreman-kernel's engine packages + JEV's retired-execution scenarios) — fixing them is new scope outside this charter's two parcels (Gate 1 authorization #1).

## The decision (yours — pick one)

- **A — Fix in scope first.** The four go green under their owning lines' work before CI-P2's gate expands. CI-P2 stays halted meanwhile (its gate would otherwise redden every PR on packages nobody in this goal owns).
- **B — Ratify #13-pinned exclusions now (RECOMMENDED).** A waived-exclusion set lands as a ratified A2 amendment: each exclusion pinned on all three axes (identity + location + value) with one refusal test per axis; the four names become the ratified expected-skip set (AC1's "empty" set is amended with recorded authority); the aggregation's unexpected-skip check binds exactly this set. Named follow-ups open for the owning lines; the exclusion expires when the package's checks pass a measured pre-flight (the next runner-touching parcel re-measures). CI-P2 proceeds with a 23-package gate and honest, named semantics — nothing red sneaks green; the gap is labeled, pinned, and dated.
- **C — Hybrid:** exclude only the three FK/JEV-owned packages now; hold `jev-decisions` (or any subset) for fixing. Same mechanism as B, smaller set.

Whatever you choose, the measured C9 shrink inventory (15 ordinary-classified reader paths — the classifier update staged under the A2 placement-7 widening) and the D-Q2 case-insensitive ruling are ready to land the moment the valve clears.

## Why B preserves the charter

Invariant: "preserving merge-gate integrity and complete package coverage." Coverage here means every discovered package is either gated or **named as waived with pinned authority** — not silently dropped (F4 triage) and not silently swept red (which would redden every future PR on out-of-scope failures). The empty expected-skip set becomes a pinned, test-bound one-date set under a ratified amendment — that is the SC #13 pattern the triage pre-authorized.
