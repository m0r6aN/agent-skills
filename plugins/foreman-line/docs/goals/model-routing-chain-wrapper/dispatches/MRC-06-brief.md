# Builder brief — MRC-06 (HRO-P4 Pi/parcel entry point)

**Goal:** `model-routing-chain-wrapper` · **Owning goal:** `hybrid-routing-optimization` (HRO-P4) · **Spec:** `docs/specs/active/MRC-06-hro-p4-pi-entry.md` (spec-linter clean; 4 files)
**Authority:** G-GATE2-HRO (granted 2026-09-27); Lane G slot 4; window W-G held for you (MRC-05 accepted — its seams are final).

## Coordinator rulings at dispatch (binding)

1. **Decision-as-authority (boundary-routing D7):** the approved route decision/receipt is the authority for what the Pi session runs. The resolver's lane route and the charter matrix are design inputs, not runtime authority. Your decision-agreement rule (verifyExecutedIdentity(decision, receipt.selection.chosen)) is confirmed as the contract; STOP-10's override reading is rejected.
2. **Session thinking level:** the decision's resolved thinking level governs the session (MRC-05 C2.4's 'Resolved thinking level' line is the carried authority). The charter matrix's thinking_level is a shaping default only.
3. **Ruling D:** validate-only. No host config writes, no proposals from this parcel (STOP-7 stands).
4. **Pre-rulings from shaping (confirmed):** standalone pi-entry module (not in-process approval-cli wiring) accepted — keeps you file-disjoint from MRC-05's landed set; PI_ENTRY_REFUSALS as a new domain vocabulary (never grow RESOLVER_REFUSALS/LAUNCH_REFUSALS) accepted.
5. **Anchor re-attestation (STOP-2) is real:** MRC-05 landed + reworked since your spec was shaped (verifyExecutedIdentity at receipts/src/validator.ts:741+ delegating to verifyReplay at :759; required_inputs canonicalization at pi-resolver effectivePredicatesFor; RoutingCacheRecord.evaluations). Re-attest ALL C0 anchors before editing; consume MRC-05's NAMED outputs.
6. Tripwires: zero deletion/weakening (current baseline **591/0** = routing-policy 211, dispatch 185, receipts 123, contracts 72).

## Builder rules

Step 0 restate-and-stop FIRST (restate; C0 re-attestation; pre-state baselines; flags). Then implement per the spec. Verification = the four package command sets + the Pi-side static validation path (no-provider-call import-manifest control). Completion claim: change list, counts before/after, verification outputs, the exists-vs-missing evidence (PMC-P2 cited-not-rebuilt proofs), the identity-bridge + alias-negative evidence. No commits/PRs. Ambiguity → Stop-and-Report (STOP-5's two readings surface to me).
