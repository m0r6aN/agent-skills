# FK-P11 Stage F closure — 2026-09-29

**Parcel:** FK-P11 — Legacy import and projection engine (Wave 3a finale)
**Outcome:** DELIVERED AND MERGED. **The Wave-3a exit fragment (c) closes with this parcel.**

## Merge record (Gate 3, delegated — RS-2.1, ledger L7)

- Package `plugins/foreman-line/kernel-import/` merged into `reconcile/refresh-actions` ("Merge FK-P11 kernel-import engine into live tree (Gate 3, delegated, RS-2.1)"); byte-identical to `a4d7a77`.
- Parcel branch `codex/fk-p11-legacy-import-projection` @ `a4d7a77` (12-commit lineage incl. 5 build checkpoints, 5 rework checkpoints across two rounds, the coordinator-authorized spec amendment `79fe7ec`, and the second spec amendment for the R1 clause). Branch kept as merged provenance; worktree removed at Stage F.

## Verification chain evidence

| Step | Result |
|---|---|
| Build | 184/184; definitive 16/16 loaded soak (root-caused flake fixes — never retries) |
| Rework R1 (6 fixes) | 198/198; definitive soak re-run; both lenses CLOSED |
| Bounded R2 (L1-5) | 206/206; minimal soak 5/5; sufficiency JUDGED sufficient |
| **Coordinator acceptance chain** | test=0, typecheck=0, lint=0 |
| Post-merge smoke (integration tree) | npm ci + npm test exit 0 |

## Independent review trail

| Session | Verdict |
|---|---|
| Lens 1 import (FkP11Review1Import) | REQUEST CHANGES — R3/R4 (F-7 exemption gaps: lease + binding triggers un-gated), R2 (duplicate-goalId untyped death), L1-5 (precedence 5/8 families) |
| Lens 2 projection (FkP11Review2Projection) | REQUEST CHANGES — **F1 P0 (sanitizer backslash defeat → live `<img>` from validated legacy text)**, F2 (cross-lane duplicate-goalId), F3 (12-hex prefix narrowing), F4 (stale counts) |
| Rework R1 closure | BOTH CLOSED (0.90/0.92) — XSS chain renders zero live chars; `!exempt` gates probe-verified; group-keyed writes; full-root ids |
| Bounded R2 closure (L1-5) | **CLOSED (0.92)** — sufficiency YES: 6 PSC rows + the full 8-family rank-chain pin (the un-rowed adjacency edge fails via the pin) |

## Contract amendments during the parcel

Step-0 rulings OQ-1..OQ-9 (corpus manifest (INF-7), whole-import abort, single A1e route, bytes-only projection, revision-1 baseline, 40|64 commit constants, per-lineage epochs, shipped real-Git reader, refuse-at-import); the F-series derived-shape rulings (corpusDigest, claimedBinding, IMPORT_SOURCE_BLOB_ABSENT 14th code, same-lineage exemption, getEpoch keyed-by-lineage); the 47-file ceiling expansion; two inline-authorized spec amendments (the F-series block + the R1 escaper clause). Substrate predecessors: **A1e** (events.kind vocab + cursor registry CHECK) verified by both FK-P9 lanes.

## Lessons with dispositions

1. **The escaper must escape itself first (the P0 class):** passing `\` raw while escaping delimiters let `\|`/`\<tag\>` produce LIVE structural characters — a validated `gitIdentity` field rendered a live `<img onerror=…>` into the projection. Disposition: escaper-first + parity-aware scans + the backslash-defeat fixture family. Rule: escaping order is part of the security contract; the escaper's own character escapes FIRST.
2. **Exemptions must gate ALL check families:** the F-7 same-lineage exemption gated only the getGoal-based checks — the lease and binding triggers still fired, turning a promised "epoch refusal forever" into a divergence alarm. Disposition: both gates + trigger tests. Rule: an exemption is only as strong as its least-gated check.
3. **Checkpoint commits beat the stream lifecycle (final confirmation):** the round-2 builder's stream closed after its checkpoint commit — the claim survived in the commit message and the worktree stayed clean. The rule adopted at the FK-P10 reap now closes the session's recovery story.

## Deferred/named remainders (exit-annex items)

- Production corpus manifest = owner-supplied run-time input (OQ-1) — NOT-satisfied until supplied.
- L1-6 (informational) and the exit-annex rows (vocabulary mapping, grammar-pin windows, P3 residuals, INF-4/6/7/8/U1/RPO-RTO strands) all stand as named.
- Next in-scope: **FK-P18′** (U1-gated; its evidence input — FK-P17′'s matrix — is landed). FK-P3/FK-P2B remain window-gated (FK-P4–P8 transitively).
