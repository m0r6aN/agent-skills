# CFF-P1 adversarial review triage — 2026-10-08 (coordinator)

**Reviews:** A (`cff_p1_review_a`, verdict-integrity angle) and B
(`cff_p1_review_b`, pin-consumption/hostile-input angle), both opus-5-5,
against `feat/foreman-line-CFF-P1` @ `73f9f624` (deliverables
`665b03bc..f953ecd3` + Amendment A1). Both confirmed the docs-only top commit
themselves; B's suite run reproduced 367/367. **No verdict-integrity
blockers from either reviewer**: ordering is never a waiver channel (A-Q1,
planted leaks all caught), the pin never excludes (B: 21 hostile pins,
`__proto__`/case/separator variants included — every package always runs),
early-exit never alters the verdict (A-Q3: `reconcile`/`verdict`
byte-identical, partial artifact writes before the non-zero return), no raw
output in annotations (A-Q4/B-Q4 modulo B-5 below), one diff source, all
fail-closed base cases (A-Q5), both loudness states + the 8/8/7/7 → 1/1/13/15
flip independently reproduced (A-Q6/B-Q6), D3 six-pack binds under mutation
(A-Q7).

## Triage table

| # | Finding (source) | Disposition |
|---|---|---|
| 1 | Uncovered package degrades to non-proximate group; charter D7/exit-6 say fail closed to full discovery order (A-F1, B-2 — independent agreement) | **FIX — lesson-#33 catch, spec weakened the charter.** Amendment **CFF-P1-A2.1** ruled + committed alone (`ca934c48`): uncovered package = whole-run fallback trigger. Rework r2 item 1 implements. The coordinator's promotion lint verified the mapping table but missed this clause-level weakening — recorded as a lint-process lesson (lesson candidate: diff every *clause* of cited charter text, not only restated rows). |
| 2 | Exclusion-key scan shallow vs A1's "anywhere" (nested keys, `exempt`/`ignore`, variance entries with `affects:false` accepted) (A-F2; B-3) | **FIX — A2.2:** scan made concrete (recursive, exact-key named set, case-insensitive; false-positive guard for `platform_skips`-class keys; shape-strict variance entries). Rework item 2. |
| 3 | `sanitizeField(':::')` → `': ::'`; "exactly two `::` delimiters" claim false; property-escaping not pinned by a mutation test (odd colon runs untested) (B-5) | **FIX — rework item 4:** odd-run hostile tests + escaping-removal mutation proof; completion-record claim corrected to the true mechanism. The surface is safe today (property escaping covers it) — the gap was unpinned, not exploitable. |
| 4 | Annotation emit throw loses the partial artifact (verdict still fails closed) (B-7) | **FIX — A2.3 hardening + rework item 3:** best-effort emit, loop continues, artifact never lost to annotation failure. |
| 5 | COST_TABLE entries' single-instrumented-measurement provenance only in the completion record (A note) | **FIX — rework item 5:** one provenance comment line at the three entries. |
| 6 | "Bias is in the conservative direction" (cost skew has no safe direction) and unscoped "D3 preserved by construction" (cross-package fs writes are a residual channel outside the runner) (A disputes) | **FIX (docs):** completion-record prose corrected in rework; the fs-write coupling class recorded as a named residual risk (feeds CFF-P2 shaping's coverage re-verification and the P0 `known_blind_classes` disclosure — subprocesses AND out-of-band fs writes). |
| 7 | Legacy `##[...]` runner-command syntax not neutralized (B-6, unverifiable offline) | **ACCEPT-AS-DOCUMENTED + named live-check:** coordinator carries it into the Gate 3 evidence pack — observed on the parcel's PR run (live Actions log inspection), recorded there. Not a code change without evidence. |
| 8 | Diff seam drops ordinary-classified paths incl. the five goal-doc couplings; instance resolves when CFF-H1 lands (B-1); class-level re-verification is CFF-P2 shaping's duty | **RESOLVED-BY-CFF-H1** (the named five classify `code` post-hotfix) + tracked: the coverage class is already a charter stop condition and binds CFF-P2 shaping (which also holds on E1/E2). |
| 9 | D3.3 alone doesn't bind one-waiver-call-per-check (D3.4 catches it) (A caveat) | **ACCEPT-AS-DOCUMENTED:** the six-pack binds as a suite; noted. |
| 10 | A1's E4 citation used the post-build tip line (:169) against a block pinned to the `145da132` base (:166) (A) | **FIXED in A2** (erratum-on-erratum corrected: :166 at the pinned base; :169 at tip). Coordinator process note recorded. |
| 11 | P1's PR to main will carry three pre-parcel docs commits (shaping kickstarter + CFF-P0 record copies + hygiene); merge order with CFF-P0 needs deciding (B) | **ACCEPT-AS-DOCUMENTED — Gate 3 sequencing recorded in the loop directive:** P0 merges first (P1's AC2 consumes P0's artifact); P1's branch is rebased/merged onto post-P0 main at Gate-3 prep, dropping duplicated record content by construction. |
| 12 | Model-ID self-verification caveat (A) | **ANSWERED at dispatch:** sessions launched via `pi --model anthropic/claude-opus-5-5` headless; session metadata at `~/.pi/agent/sessions/` — coordinator verified the CLI flag on dispatch. |

## Consequences in force

- **CFF-P1: rework r1 dispatched** (Step 0 gate; tripwire baseline 367). A
  focused follow-up review of the rework delta precedes any Gate 3 request
  (charter two-review mandate already satisfied for the main build; the delta
  review covers A2 conformance).
- **Gate 3 batching:** P0 chain (rework R1 + dev-pass) and P1 chain (rework
  r1 + delta review) are both unmerged; the batch presents when both chains
  are green, P0 first in merge order.
