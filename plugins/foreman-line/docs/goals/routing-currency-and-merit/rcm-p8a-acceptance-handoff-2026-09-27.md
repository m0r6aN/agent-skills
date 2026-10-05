# RCM-P8A acceptance handoff — folded receipt/replay contract (2026-09-27)

**Record type:** MRC-01-class coordinator record write, authorized by the wrapper charter's G-GATE2-RCM row ("The MRC-02 → RCM-record P8A acceptance handoff also rides this grant") and ruling F (`goal-status-report-2026-09-27.md` §6: "both goal records keep their own gates"). Claim-state adjudicated per MRC-01 brief ruling 1 (no live owning-coordinator session; owner-directed act). Additive record; no existing RCM text altered.

## What this is

Ruling F folded `routing-currency-and-merit`'s **RCM-P8A** receipt/replay scope into the `hybrid-routing-optimization` HRO-P3 events stream as one sequenced parcel stream. The folded scope shipped as parcel **MRC-02** (`docs/specs/active/MRC-02-hro-p3-events-receipt-replay.md`, Amendments A1/A2). Per the wrapper charter D6, the absorbed scope carried the maximum review load (2 independent adversarial reviews + ruling-B PMC-P1 schema and PMC-P2 adapter/resolver reviews) and its acceptance evidence is recorded **in this record** — RCM's own gates remain untouched.

## Acceptance evidence (quotable for RCM exit criterion 8)

**The seven exit-criterion-8 bindings** are bound in `RoutingDecisionSubject` (`receipts/src/types.ts`) and enforced by `verifyReplay` (`receipts/src/validator.ts`): effective requirements; resolved model identity (registry key + provider-local id + protocol + Pi host model id); policy version + content digest; catalog-snapshot digest; vocabulary version; derived context floor (explicit unknowns where the evaluator derives none); predicate set. Replay reproduces the decision on identical inputs and refuses typed (`REPLAY_REFUSED`, naming the mismatched binding) on each independent mutation.

**Verifier evidence:** `receipts/tests/replay-contract.test.ts` — 1 reproduction control + 7 independent refusal-on-mismatch controls (one per bound input) + chain-membership/isSealed invariance; the tip-seal control uses a chain-valid fixture (`validateChain(valid)` asserted before `isSealed` decides). Envelope/`validateChain`/`isSealed` semantics untouched.

**Independent review (receipt/replay focus, RevMRC02a, ACCEPT):** "ReplayBindings carries effective requirements, resolved identity (full D2 quadruple), policy version + content digest of exact policy bytes, catalog-snapshot digest, vocabulary version 1.0.0, derived context floor (explicit unknowns), predicate set, plus refusal-on-mismatch semantics; this review and the passing reproduction/seven-refusal controls satisfy the RCM-P8A row's 'verifier evidence' and are quotable as the folded acceptance evidence for the MRC-01-class RCM-record handoff."

**Review set (4/4 complete):** RevMRC02a ACCEPT + P3 (fixed); RevMRC02b ACCEPT + comment fix (fixed); RevMRC02pmc1 ACCEPT 0 (ruling-B schema seam); RevMRC02pmc2 ACCEPT 0 (ruling-B adapter/resolver seam).

**Deterministic evidence:** four packages green after rework — receipts 102/102, dispatch 164/164, contracts 72/72, routing-policy 211/211 (its +2 over the 209 MRC-02 baseline are MRC-03's separate lane's named F1/F2 controls — attributed, not MRC-02's); typecheck + lint clean throughout; node v24.7.0; `contracts/src/correlation.ts` untouched.

## Consumers

- **MRC-16 (RCM-P10)** consumes this record + MRC-02's evidence set to close RCM exit criterion 8 (`charter.md:266-268`) and assemble RCM's exit evidence. MRC-02's own record: `docs/goals/model-routing-chain-wrapper/dispatch-table.md` (MRC-02 row) + `docs/specs/active/MRC-02-hro-p3-events-receipt-replay.md`.
- The recorded scope deviation for RCM-P4-level acceptance work: none here (this handoff covers P8A's contract only).
