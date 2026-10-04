# Builder brief — MRC-05 (RCM-P4A dispatch integration)

**Goal:** `model-routing-chain-wrapper` · **Owning goal:** `routing-currency-and-merit` (RCM-P4A) · **Spec:** `docs/specs/active/MRC-05-rcm-p4a-dispatch-integration.md` (spec-linter clean; 15 Allowed Files)
**Authority:** G-GATE2-RCM (granted 2026-09-27); Lane G slot 3; window W-G held for you (MRC-02 released).

## Coordinator rulings at dispatch (binding)

1. **STOP-2 elevated to first priority:** MRC-02's consolidated rework landed AFTER your spec was shaped (fixture rebuild in `receipts/tests/replay-contract.test.ts`, comment narrowings in `dispatch/src/routing-eval/index.ts` :106-115/:150-156/:220-222). At Step 0, re-attest EVERY C0 anchor against the current tree and surface corrected anchors before implementing. Never implement against stale pins.
2. **One-pair discipline:** the spec's single shared predicate implementation (behavior-identical extraction from pi-resolver) is the anti-fork rule — STOP 4 stands exactly as written (never a second implementation, never a weakened control).
3. **Chain-slot fix is the crown jewel:** tip-derived allocation mirroring the Stage-E rule; one chain per parcel; Stage-C receipt and event entries coexist with no duplicate sequences. The frozen `contracts/src/stages/c-dispatch.ts` DispatchOrder stays untouched (STOP 1).
4. **Size note (for your discipline, and the reviewers will judge independently):** 15 files is at the edge of parcel sizing. Stay strictly within Contract C0-C6; any pull to expand = STOP 1. No "while you are here".
5. Tripwires: zero test deletion/weakening across all four packages (current: routing-policy 211, dispatch 164, receipts 102, contracts 72 = 549/0 — note routing-policy's +2 are MRC-03's, attributed); named pins you rebuild (chain-slot pins :410/:479/:485/:519/:798; predicate_set pin) must keep their assertion strength.

## Builder rules

Step 0 restate-and-stop FIRST (restate; C0 anchor re-attestation per ruling 1; pre-state baselines incl. all four suite counts; flags). Then implement per Contract C0-C6. Verification = the four package command sets. Completion claim: change list, counts before/after, verification outputs, the C1 invariant proof (coexistence), C3 e2e control list, C4 reconciliation evidence. No commits/PRs. Ambiguity → Stop-and-Report (STOP 8 covers the exit-criterion-8 binding-shape question).
