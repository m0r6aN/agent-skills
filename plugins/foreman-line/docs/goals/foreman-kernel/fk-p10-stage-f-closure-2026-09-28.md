# FK-P10 Stage F closure — 2026-09-28

**Parcel:** FK-P10 — Lease and transition engine (Wave 3a core, second of three)
**Outcome:** DELIVERED AND MERGED.

## Merge record (Gate 3, delegated — RS-2.1, ledger L7)

- Package `plugins/foreman-line/kernel-lease/` merged into `reconcile/refresh-actions` ("Merge FK-P10 kernel-lease engine into live tree (Gate 3, delegated, RS-2.1)"); byte-identical to reviewed build `d35dfd2`.
- Parcel branch `codex/fk-p10-lease-transition-engine` @ `d35dfd2` — five-commit checkpoint lineage surviving ONE watchdog reap (see Lessons). Branch kept as merged provenance; worktree removed at Stage F.

## Verification chain evidence

| Step | Result |
|---|---|
| Build (pre-reap, recovered via `12c1831`) | typecheck clean; suite never green (EPERM-masked failures, 1h hang) — recovered and repaired |
| Rework R2 (8 fixes) | chain green; **16/16 loaded soak** (10 sequential + 3 dual-parallel pairs); named loser codes held under load |
| Bounded R3 (owner-authorized) | 158/158; the relabel mutation fails CN-07 loudly; 6/6 loaded with zero escapes |
| **Coordinator acceptance chain** | test=0, typecheck=0, lint=0 (clean Node lane) |
| Post-merge smoke (integration tree) | npm ci + npm test exit 0 |

## Independent review trail

| Session | Verdict |
|---|---|
| Lens 1 engine (FkP10Review1Engine) | REQUEST CHANGES — F1 P0 (READY-barrier deadlock, the CONC-03 class), F2 (NOOP replay verbatim violation — contract fork), F3 (replay not failing-when-broken), F4 (request-path guard unproven) |
| Lens 2 harness (FkP10Review2Harness) | REQUEST CHANGES — F5 P1 (load-flake: named loser refusals destroyed by error laundering #3), F6 (createEngine swallows time-shaped options), F7 (registry coverage map) |
| Rework-2 closure | Lens 1 CLOSED (0.95: deadlock repro 59s→363ms; NOOP replay verbatim) / Lens 2 NOT CLOSED — **F5-masking regression inside the fix** (named-loser assertions removed; wrong codes passed silently) |
| Bounded R3 closure (`d35dfd2`) | **CLOSED** (0.95: relabel mutation fails loudly; escape semantics exact; dual-parallel green) |

## Contract amendments during the parcel

- Step-0 rulings F1–F4 (`b698714`) incl. the A1a/A1b split; pin second-advance (`cceb32dd` → spec amendment `11b52cfc`).
- FLAG-1 ruling: **23rd registry code `IDEMPOTENCY_RESULT_UNAVAILABLE`** (T9 table amended with provenance; never reuses IN_FLIGHT for a permanent condition).
- Substrate family (FK-P9-owned, all verified): **A1a** `0002` goals.status CHECK + A2 index; **A1b** `0003` transitions.status CHECK; **A1c** read primitives (getLease/getUnreleasedLease/getTransition); **A1d** `0004` recorded-result persistence (the F2 fork resolved at the substrate: every completed binding stores its recorded EffectResult bytes; replay is verbatim BY CONSTRUCTION).

## Lessons with dispositions

1. **Tripwires stop the owner, not the coordinator (second occurrence):** the declared "rounds 2 of 2 final" cap fired on the F5-masking regression and the parcel stopped for owner ruling (bounded round 3 authorized). FK-P0's spiral class again avoided.
2. **Fixes can regress their own guards:** round-2's retry fix removed the named-loser assertions it was supposed to protect — the escape hatch masked wrong codes. Disposition: the bounded round restored the assertions with the exact mutation proof. Rule: an escape hatch never replaces the assertion; it sits BESIDE it.
3. **Watchdog reaps idle streams (recorded in the annex):** one mid-chain worktree was preserved (`12c1831`, pushed `origin/recovery/…`) then reaped; the checkpoint-commit discipline adopted mid-recovery carried the rest (5 commits survived). Rule in force for all builders.

## Deferred/named remainders (exit-annex items)

- AC11 "22 codes" → "23 codes" one-token doc fix (Lens-1 P3) folds into this Stage-F commit (coordinator-side spec text).
- The ENVIRONMENT skip-and-record escape exists and is proven correct — it never fired in the final runs; its existence is the T10 honesty valve, not a gap.
- FK-P11 (import/projection engine) is the next Wave-3a parcel; FK-P18′ remains U1-gated.
