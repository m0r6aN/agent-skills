# Builder brief — MRC-02 (HRO-P3)

**Goal:** `model-routing-chain-wrapper` (orchestrator) · **Owning goal:** `hybrid-routing-optimization` (HRO-P3, + folded RCM-P8A per ruling F)
**Spec:** `plugins/foreman-line/docs/specs/active/MRC-02-hro-p3-events-receipt-replay.md` (coordinator-lint PASS 2026-09-27; **Amendment A1** adds `receipts/src/schemas.ts`, `receipts/schemas/*.json` (regen), `receipts/src/index.ts`)
**Standing constraints:** `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` (by reference)
**Authority:** G-GATE2-HRO (granted 2026-09-27) + wrapper standing Gate 2; Lane G slot 1; ruling R1 mechanics = single-writer window in the live working tree (window W-G held for you).

## Builder rules (non-negotiable)

1. **Step 0 restate-and-stop gate FIRST:** restate this directive in your own words; inventory every Allowed File's current state on disk; run the four verification command sets and record **baseline** test counts; flag any gap, unexpected content, or half-written file; then STOP and return the restatement. Do not implement until the coordinator rules.
2. Touch **only** the spec's Allowed Files. Anything else → Stop-and-Report (never edit engines, never add dependencies).
3. No commits, no PRs, no pushes. The window discipline is yours alone: if you observe another writer on `routing-policy/**`, `dispatch/**`, or the receipt-schema family, stop and report (SP8/SP9/SP13).
4. Implement per the spec Contract C1–C5 and its Forbidden list exactly. Rulings A–G and the charter decisions are settled; do not re-litigate. Ambiguity (e.g. the CorrelationContext expressibility question, spec Stop-rule #5) → surface with the two readings, do not decide.
5. Verification per the spec; final claim reports exact test counts (before/after), the verification command outputs, and the evidence list (spec Evidence Required 1–5). Wrong-shaped or unverifiable claims are presumptively empty.
6. Reviewers will come later and never fix; your completion claim must map each acceptance criterion to evidence.

## Scope in one line

Decision/attempt events on the existing receipt chain + the folded RCM-P8A receipt/replay contract (seven bound inputs, refusal-on-mismatch) + `PiModelContract` `provider_local_id`/`protocol` enrichment (null, never derived) + honest provenance (billed|estimated|unknown) and baseline data — no report, no savings claims, no parallel event format, no GMF settlement writes.
