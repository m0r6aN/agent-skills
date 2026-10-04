# FK-P2 Stage F closure — 2026-09-28

**Parcel:** FK-P2 — Spec-body compiler (RS-1.3 elevated; RS-2.4 narrowed scope)
**Outcome:** DELIVERED AND MERGED.

## Merge record (Gate 3, delegated — RS-2.1, ledger L7)

- Package `plugins/foreman-line/spec-body-compiler/` merged into `reconcile/refresh-actions` (merge commit "Merge FK-P2 spec-body-compiler into live tree (Gate 3, delegated, RS-2.1)"); byte-identical to reviewed build `6ab3f8e` (verified `git diff` empty).
- Parcel branch `codex/fk-p2-spec-body-compiler` @ `6ab3f8e` (three commits: `ec70b50` build, `48295fd` rework round 1, `6ab3f8e` bounded round 2). Branch kept as merged provenance; worktree removed at Stage F.
- Delegation conditions held: every verification step green at merge time.

## Verification chain evidence

| Step | Result |
|---|---|
| Builder chain (build) | all exit 0; 157/157 tests; lockfile byte-identical |
| Builder chain (rework 1) | all exit 0; 165/165 |
| Builder chain (rework 2) | all exit 0; 166/166 |
| **Coordinator acceptance chain** | test=0, typecheck=0, lint=0 (clean Node lane) |
| Post-merge smoke (integration tree) | npm ci + npm test exit 0 |

## Independent review trail

| Session | Verdict |
|---|---|
| Lens 2 artifact/identity (FkP2Review2Artifact) | APPROVE — L2-1 (schema patterns) + L2-2 (CONF per-array) should-fix; P3 residual (whole-string vs per-segment trailing dot/space) accept-as-documented |
| Lens 1 compiler/hostile (FkP2Review1Compiler) | REQUEST CHANGES — R1 P0 (strict NFC), R2 (simple case folding), R3 (folded conflicts), R4 (linearity accounting) |
| Rework 1 closure | R1/R3/R4 CLOSED (floor test proven non-self-referential: 5 counting-phase deletions fail); R2 NOT CLOSED (astral fold gap — a regression inside the R2 fix) |
| Rework 2 closure (`6ab3f8e`) | R2 CLOSED (Osage/Adlam/Warang Citi fold and reject both orders; per-unit reversion fails EQUIV-09 exactly; erratum recorded on the original Adlam citation) |

## Contract amendments during the parcel (pre-merge)

Step-0 rulings A/B/C (`e168deb`): grammar-pin three-state gap window (the pin targets the RCM-P2 schema-v0.4 revision which exists only as uncommitted state in a sibling's write set — known-base case records `blocked: RCM-P2 schema-v0.4 delta uncommitted`, third-state fails closed); no-generate chain; forbidden-array mapping (frozen→frozenSurfaces else forbiddenSurfaces).

## Lessons with dispositions

1. **Strict predicates before derived equivalences (R1/R2):** a permissive NFC predicate (NFD-stable test) let mixed-form entries through and duplicated physical grants; the derived equivalence key then inherited the gap (mixed folds, astral units). Disposition: strict `normalize('NFC') !== seg` at step 8; code-point iteration for folding; fixtures UNI-10/EQUIV-08/EQUIV-09 bind each dimension.
2. **UTF-16 unit iteration is not character iteration:** `charAt` loops silently split astral pairs — and the pre-fix whole-string `toLowerCase` had accidentally been STRONGER on one probe class. Disposition: code-point iteration with the documented C+S table; regression proof via temp-copy reversion.
3. **Schema patterns are a secondary filter, not the validator:** hand-crafted artifacts could carry glob entries past weak patterns (L2-1). Disposition: patterns rewritten to full metacharacter/traversal rejection; the compiler remains the enforcement layer; the P3 per-segment nuance named in the exit annex.

## Deferred/named remainders (exit-annex items)

- Grammar-pin KNOWN-GAP window: closes automatically when the RCM-P2 schema-v0.4 delta lands (case (a) activates); named in the exit annex until then.
- L2-1 P3 residual: schema patterns enforce trailing dot/space at whole-string level; mid-string `a./b` passes the schema but the compiler rejects it (ENTRY_TRAILING_DOT_SPACE). Accept-as-documented.
- FK-P2B (D10 wiring fix) and FK-P3: still window-gated (`fk-p2b-p3-window-request-2026-09-27.md`).
