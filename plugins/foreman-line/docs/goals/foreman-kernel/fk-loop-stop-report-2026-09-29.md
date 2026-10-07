# Foreman Kernel — loop stop report — 2026-09-29

**Condition:** the dispatchable queue is empty — every remaining in-scope parcel is externally gated. Per the `/goal` stop rules and RS-1.4 (D5): this report names exactly what the owner must do. The loop stops here.

## What landed this session (all Gate-3-delegated under RS-2.1, every chain green)

| Deliverable | Evidence |
|---|---|
| §15.2 plan review + **RS-2 (L7)** | 43 findings triaged; 4 owner Gate-1 rulings propagated through all canon |
| **R32 corpus amendment** | accepted (independent review CLOSED; 752/752; sweep 647→0) |
| **FK-P0–FK-P11 + FK-P17′** | seven merged parcels: kernel-contracts (151/151), spec-body-compiler (166/166), kernel-state (172/172 + A1–A1e), kernel-lease (158/158 + 16/16 soak), kernel-import (206/206), bypass-outage-harness (72/72) |
| **[INFERENCE] row** | **RESOLVED — CONFIRMED two-sided** (mutations outside the dispatch CLI bypass all scope checks; proven on shipped surfaces) |
| Wave-3a exit fragment (c) | **CLOSED** (restart/CAS/crash/divergence-stop proven at FK-P9/P10/P11) |

## What the owner must do (the external gates)

1. **FK-P18′ (the one remaining in-scope parcel): the §14 U1 contract.** A concrete, independently reviewed contract binding protected verifier/workflow control, builder-input limits, credentials + runner lifecycle, independent negative controls, evidence identities/retention, and bounded unsupported outcomes must EXIST before dispatch (charter §14; E7). Its evidence input (FK-P17′'s matrix) is landed; the FK-P18′ lane also inherits the named skip/gap obligations (file-symlink privilege, CTRL-01, the outage.ts realpath sweep).
2. **FK-P2B + FK-P3 windows** (the D10 wiring fix + the pure-dispatch split; FK-P4–P8 held transitively): the counterparties must record windows in their own goal records — `routing-currency-and-merit` (Window R), `foreman-line-boundary-routing` (mutation-scope-guard/routing seams), `plugin-packaging-and-scaffolder` (skill-injection). The request is staged at `fk-p2b-p3-window-request-2026-09-27.md`.
3. **The FK-P11 production corpus manifest** (which real records are legacy state): an owner-supplied run-time input — the engine makes no production-corpus claim without it (exit annex row).
4. **Deferred-parcel value check** (FK-P12–P16, FK-P19, FK-P21; FK-P20 dropped): the RS-1 follow-on-goal decision — each is named in the exit annex with its stranded obligations.
5. **Stranded obligations requiring owner policy or the deferred parcels:** RPO/RTO numbers (INF-8), retention destination (INF-4), the legacy status-vocabulary mapping, the INF-6 baseline (FK-P21), the U1 evidence chain. All named NOT-satisfied in `fk-exit-annex-draft-2026-09-27.md` (20 rows) — the RS-2.3 exit annex is the authoritative remainder list.

## Session process record

- **Tripwire bookkeeping (3):** FK-P1 round-3 and FK-P10 round-3 (owner-authorized bounded rounds after declared caps fired), FK-P11 round-2 (bounded, owner-approved disposition) — no coordinator self-override; the FK-P0 spiral class avoided throughout.
- **Recovery events (2):** one watchdog-reap (FK-P10; preserved at `12c1831`, pushed `origin/recovery/…`, zero loss — checkpoint-commit discipline adopted and proven at FK-P11's stream close); one silent-partial-commit class instance ×2 (a stale `git add` pathspec under `2>/dev/null` aborted staged batches — repaired both times; the lesson: never mask `git add`, validate the pathspec list).
- **Lessons recorded (25+):** the error-laundering class (3 instances: hardcoded success signals, seam rethrow flattening, boundary fallback erasure), escaper-first, exemptions gate ALL check families, pin-integrity (committed bytes only; uncommitted sibling state never pinnable), flakes-are-failures + load soak, derived counts never hand-typed, schema patterns are secondary filters, concurrency fixtures must assert their own interleaving.

## Re-entry

`/goal resume foreman-kernel` — the loop directive's STATE block and INDEX row carry the live state; the exit annex is the remainder list. The next dispatchable action depends entirely on gate 1 or 2 above landing.
