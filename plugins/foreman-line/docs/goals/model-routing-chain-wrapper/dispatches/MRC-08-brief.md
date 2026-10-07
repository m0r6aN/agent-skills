# Builder brief — MRC-08 (HRO-P4a bounded recovery ladder)

**Goal:** `model-routing-chain-wrapper` · **Owning goal:** `hybrid-routing-optimization` (HRO-P4a) · **Spec:** `docs/specs/active/MRC-08-hro-p4a-recovery-ladder.md` (spec-linter clean; 5 files, all routing-policy/)
**Authority:** G-GATE2-HRO (granted 2026-09-27); Lane G slot 6; window W-G held for you (MRC-05 and MRC-06 accepted — their seams are final).

## Coordinator rulings at dispatch (binding)

1. **STOP-8 pre-ruled → Reading B:** dispatch/** caller wiring is NOT this parcel (HRO-P4a = "in the existing resolver"); the entry surface is MRC-06's pi-entry. Your write set stays inside routing-policy/.
2. **Freshness tolerance (G-FRESH-TOL):** the typed input is consumed UNSET; the fail-closed default applies (zero grace → past-valid = stale). The builder NEVER supplies a value. Activation after owner ratification is configuration-only.
3. **RouteUnavailableOutcome shape** is field-aligned with MRC-06's (f) — consume its NAMED shape (it landed; re-attest at Step 0).
4. **Single-predicate discipline (STOP 3/4):** the D1 re-check calls MRC-05's extracted `evaluateRequirementPredicates` — never a second implementation; no identity guessing, refresh never approves/tiers/entitles; no bound default pinned in code.
5. **Anchor re-attestation (STOP 2) is real:** MRC-05 AND MRC-06 landed and reworked since shaping. Re-attest all anchors; consume named outputs.
6. Tripwires: zero deletion/weakening (current baseline **647/0** = routing-policy 211, dispatch 241, receipts 123, contracts 72).

## Builder rules

Step 0 restate-and-stop FIRST (restate; C0 re-attestation; pre-state baselines incl. all four suites; flags). Then implement per the spec. Verification = routing-policy command set + the second-writer full-suite re-run. Completion claim: change list, counts before/after, verification outputs, the ladder's boundedness evidence (one refresh per episode, negative-cache TTL, finite attempts, no cycles), the honesty evidence (no guessing/approval-by-refresh), the freshness verdict matrix (fresh/stale/unknown incl. unset-tolerance). No commits/PRs. Ambiguity → Stop-and-Report.
