# Builder brief — MRC-13 (PMC-P4 conformance + legacy cutover)

**Goal:** `model-routing-chain-wrapper` · **Owning goal:** `pi-model-configuration` (PMC-P4) · **Spec:** `docs/specs/active/MRC-13-pmc-p4-conformance-and-legacy-cutover.md` (spec-linter clean; 35 files)
**Authority:** G-GATE2-PMC (granted 2026-09-27); Lane G slot 11 (window W-G follows MRC-12); reviews: 2 (owning charter requires two).

## Coordinator rulings at dispatch (binding)

1. **STOP #3 → Reading (ii):** A5.5's "a lagging consumer cannot block the contract parcel" governs — the `CUTOVER-P4` removal proceeds with **named fail-loud lagging consumers recorded** (typed refusals + the migration inventory's named-lagging-consumer rows). Reading (i) (require all consumers migrated first) is rejected — it restores the block A5.5 forbids. `CUTOVER-P4` and its 4 predicates are confirmed as the named cutover condition.
2. **STOP #6 → owner-migrated carry:** `templates/foreman-routing-policy.yaml` is NEVER touched (excluded-six/user-owned/SP11-escalated); it is recorded as a named lagging consumer (the D10/SP11 discipline, same treatment as MRC-04's family). `templates/pi-openrouter-routing.json` confirmed NOT part of the deprecated representation (it is the P2/HRO mapping contract).
3. **STOP #4 → retain `KNOWN_FRONTIER_MODELS`.** A5's cutover enumerates exactly `model_tiers` / `roles` / `data_classification.eligible_models`; deletion beyond the enumerated set is scope expansion.
4. **STOP #5 → the optionality flip is the window-end semantics:** at CUTOVER-P4 the five PMC-P1 blocks become required; legacy-only documents refuse typed `LEGACY_REPRESENTATION_REFUSED`; dual documents must drop the legacy blocks.
5. **STOP #7 → migrate the evaluator walk** (`policy.model_tiers[tier]` sites in dispatch/src/routing-eval) to the new representation with **selection-behavior equivalence** — D3 fixed order preserved, MRC-05's result contract byte-stable. Any non-equivalence = STOP, never a semantic change.
6. **G-LIVE discipline:** the 3 smoke items (synthetic public lane tests, Pi-session installation check, versioned model-quality review record) are tagged `blocked:G-LIVE` and NEVER run without the owner's live-call authorization — surface at completion as pending items. The static half + cutover are fully provable without them.
7. **SP16 discipline:** routing-policy.yaml is user-owned — byte-preservation/MD5 evidence required; if user content sits INSIDE the removed blocks → STOP for developer authorization.

## Builder rules

Step 0 restate-and-stop FIRST (restate; C0 re-attestation vs the current tree — several lanes landed since shaping; pre-state baselines incl. ALL affected suites; flags). Then implement per the spec. Verification: routing-policy + dispatch command sets + the legacy-cutover suite + second-writer full-suite re-run. Completion claim: change list (35-file accounting), counts before/after, verification outputs, the CUTOVER-P4 predicate evidence (all 4), the migration inventory (migrated / proven-non-reader / named-lagging-consumer), the selection-equivalence proof, the SP16 byte-preservation evidence, the G-LIVE pending list. No commits/PRs. Ambiguity → Stop-and-Report.
