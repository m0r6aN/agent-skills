# FK-P17′ Stage F closure — 2026-09-28

**Parcel:** FK-P17′ — Bypass + outage matrix (shipped-surface retarget) + A1/D21 measurement instrument
**Outcome:** DELIVERED AND MERGED.

## Headline: the program's [INFERENCE] row is RESOLVED — CONFIRMED

`fk-wave3-4-marginal-value-2026-09-27.md` §3 flagged "[INFERENCE] mutations outside the dispatch CLI bypass all scope checks — inferred from mechanism wiring, not proven". FK-P17′'s must-prove row BYP-SH-01 now proves it on the shipped surfaces: a mutation outside the dispatch CLI **lands with `guardInvocation: false`** — realpath-verified effect observation + guard non-invocation, recorded two-sided and verbatim. The honest companion results: scope containment exists ONLY in the mediated controls (CTL-01/02); 25 rows are unsupported-with-effect-evidence; the mediated-span p99 (724,716 µs in the committed run) **misses** the 150,000 µs budget and is recorded as an obligation row per D21; D8 outage inheritance is "not-proven" and recorded as such.

## Merge record (Gate 3, delegated — RS-2.1, ledger L7)

- Package `plugins/foreman-line/bypass-outage-harness/` merged into `reconcile/refresh-actions` ("Merge FK-P17 bypass/outage matrix harness into live tree (Gate 3, delegated, RS-2.1)"); byte-identical to reviewed build `7b706dd5`.
- Parcel branch `codex/fk-p17-bypass-outage-matrix` @ `7b706dd5` (two commits: `132fdcd` build, `7b706dd5` rework round 1). Branch kept as merged provenance; worktree removed at Stage F.

## Verification chain evidence

| Step | Result |
|---|---|
| Builder chain (build) | all 7 steps exit 0 (incl. matrix + measure); 55/55 tests |
| Builder chain (rework 1) | all 7 steps exit 0; 71/71 tests; **zero classification delta vs the build run across all 34 rows** |
| **Coordinator acceptance chain** | test=0, typecheck=0, lint=0 (clean Node lane) |
| Post-merge smoke (integration tree) | npm ci + npm test exit 0 |

## Independent review trail

| Session | Verdict |
|---|---|
| Lens 1 matrix honesty (FkP17Review1Matrix) | REQUEST CHANGES — P0 (five fabricated effectLanded rows: actor argv bug + hardcoded signals), P1 (refuted branch unrecordable), P2 (manifest post digests), stale MEAS gaps |
| Lens 2 measurement (FkP17Review2Measure) | REQUEST CHANGES — F1 (deadline obligation wrong literal), F2 (post digests — convergent), F3 (terminal-erasure accepted), F4 (aggregate-level gates) |
| Rework-1 closure (`7b706dd5`) | BOTH LENSES CLOSED (0.95/0.92) — 34-row re-audit with live probes: effects genuinely land post-fix, zero deltas, zero unobserved emissions; refuted branch recorded; 19/19 pre+post digests independently verified; per-seam gates refuse despite passing aggregates |

## Post-merge closure fix (`f6a0575`, merged `0d3bff0`) — the hidden-environment defect

The Stage-F smoke in the shared checkout failed `live worktree pins: zero drift` — diagnosed as the pin-integrity rule working AS DESIGNED against a concurrent writer's uncommitted `dispatch/**` bytes (fail-closed on unclassifiable live drift; documented in the README pin section). But a clean-checkout verification at the merge commit exposed a deeper defect: **the channel tests import the real `dispatch/src/approval-cli`, whose dependency tree (`ajv`, later `yaml`, …) had been installed in the builder's worktree by an UNREPORTED environmental step** — the three reported chains listed only the harness `npm ci` and were "NOT reproducible from clean" (builder's own erratum, filed voluntarily). The builder proved the true prerequisite closure (13 real-surface packages; my two-install prescription was itself insufficient and was corrected by evidence) and the fix: documented install order, one named environment-prerequisite error behind a guarded real-surface loader, a preflight test asserting it first (72nd test). Clean-worktree chain now fully reproducible: 13× npm ci + harness + all 7 steps green, 72/72. The spec's Verification Plan carries the corrected chain (coordinator amendment, this record's companion).

## Contract amendments during the parcel (pre-merge)

Pin-table amendment (`5102552`, spec pin `0a53c3bb`): three shaping-time pins corrected (exit-annex stale pin; approval-cli pin bound to the concurrent writer's uncommitted bytes; SPEC-CONVENTION → three-state gap window) + the normative pin-integrity rule ("uncommitted sibling state is never pinnable; symbol resolution authoritative").

## Lessons with dispositions

1. **Hardcoded success signals fabricate evidence (the P0 class):** five rows claimed `effectLanded: true` while their own probes said `exists: false` — the actor argv bug (`argv[1]` = script path) made the writers overwrite themselves, and the runners hardcoded the outcome while tests asserted the constant. Disposition: actors fixed; every signal probe-derived; (false,false) → SIGNAL_AMBIGUOUS emission refusal; tests assert probe-derived fields. The deeper fact for the record: the underlying effects were REAL post-fix (zero classification delta) — the run's conclusions survived, but only because the review forced the evidence to actually prove them.
2. **Two-sided means both branches must be recordable:** the must-prove row's refuted branch threw instead of recording, making refutation structurally impossible. Disposition: pure outcome builders record proven/refuted/ambiguous alike (OQ-5); the refuted path is now tested.
3. **Stale/uncommitted pins and wrong comparison literals are one family:** three pins bound to stale or dirty bytes and one obligation row bound to the wrong budget literal — every comparison in a contract must name its own source. Disposition: pin-integrity rule normative; `budgetFor` binds each obligation row to its own budgetSource.

## Deferred/named remainders (exit-annex items)

- `outage.ts:242/:296` (RST-01/02) still hardcode `realpathVerified: true` — truthful in the artifacts (reviewer-verified) but not probe-derived like the bypass.ts rows; named for a later-round sweep (reviewer observation, non-blocking).
- Must-prove CONFIRMED row is a per-run measurement (this host, this run); the mechanical/detected/unsupported matrix is evidence for FK-P18′/FK-P19 decisions — no enforcement claim made.
- OQ-1 not-exercised rows: zero in this run (all 34 exercised) — the gap-record machinery is proven but unused here.
