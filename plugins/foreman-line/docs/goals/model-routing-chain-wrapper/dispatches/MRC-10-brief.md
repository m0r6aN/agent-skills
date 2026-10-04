# Builder brief — MRC-10 (HRO-P4b config-repair proposals)

**Goal:** `model-routing-chain-wrapper` · **Owning goal:** `hybrid-routing-optimization` (HRO-P4b) · **Spec:** `docs/specs/active/MRC-10-hro-p4b-config-repair-proposals.md` (spec-linter clean; 3 files, routing-policy/)
**Authority:** G-GATE2-HRO (granted 2026-09-27); Lane G slot 8; window W-G held for you (MRC-05/06/08 accepted — their seams are final).

## Coordinator rulings at dispatch (binding)

1. **Ruling D = proposal-only, absolute.** Zero host reads/writes (`~/.pi`, settings, models, enabledModels, models-store); no apply; the proposal carries a documented apply contract with each item tagged provable-in-reference-harness vs named-gate. The 3 named gates (G-PI-HOST-CONTRACT, G-APPLY-AUTH, G-RELOAD-VERIFY) are NEVER satisfied here and never invented around.
2. **Honesty rules:** minimal diffs (add-ops only), evidence + HRO-P1 mapping provenance exact, absent evidence = honest unknown (never imputed), idempotence (identical inputs + injected clock → byte-identical artifact + digest), duplicate evidence coalesces, already-configured → no-action, source_state content-hash anchors for concurrent-change detection (SOURCE_HASH_MISMATCH_REFUSED), invalid source → repair failure (never replace), secrets/config contents never in logs/diffs/redacted summaries.
3. **Anchor re-attestation (STOP-2):** MRC-08 landed AND reworked since shaping (recovery episode record + freshness verdicts + the recovery refusals; RouteUnavailableOutcome). Re-attest all anchors; consume NAMED outputs.
4. **Inline spelling parity** (the A1.5 precedent): the `provider:model` composition is inline with the deliberate-duplication comment + the STOP-5 parity control against the committed PROPOSED artifact's values.
5. Tripwires: zero deletion/weakening (current baseline **689/0** = routing-policy 253, dispatch 241, receipts 123, contracts 72).

## Builder rules

Step 0 restate-and-stop FIRST (restate; C0 re-attestation; pre-state baselines incl. all four suites; flags). Then implement per the spec. Verification = routing-policy command set + the second-writer full-suite re-run. Completion claim: change list, counts before/after, verification outputs, the proposal-artifact evidence (digest stability, idempotence, coalescing, concurrency anchors), the reference-harness apply-contract proofs, the named-gate list preserved verbatim. No commits/PRs. Ambiguity → Stop-and-Report.