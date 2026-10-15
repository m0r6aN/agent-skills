# QF-P2 review triage — round 1 (2026-10-14)

Coordinator: pi session `01a139ff-f7bc-725c-808d-120548a55ef1`. Reviews: O (`qf-p2-review-O` output) and P (`qf-p2-review-P` output), two independent frontier reviewers, read-only, build base `41f80463`. Both verdicts REQUEST CHANGES on the same single MEDIUM; no BLOCKER, no HIGH, no fail-open path found by either. O-1/P-1 reproduced by the coordinator on disk before ruling (QUICK-FLAGS.md:31,41 vs skill:46; live case `docs/goals/ops-console-roadmap-authority.md`).

| ID | Rank | Ruling | Rationale |
|---|---|---|---|
| O-1 = P-1 | MEDIUM | **FIX (rework 1)** | Skill:46's "in the loop directive" qualifier is narrower than registry :41 (no qualifier) and :31 (loop directive **or a goal's authority file**); reads as revoking prose grants stored elsewhere, contradicting V6 and failing AC-16 literally. Fix within AC-3 as written (O's minimal form: delete "in the loop directive" so the sentence mirrors QUICK-FLAGS.md:41). P's broader rewording (adding the gate record) goes beyond AC-3; not taken. Mirror regenerates from the source. |
| O-2 | LOW | Accept as documented | V7 itself gives the gate record no carve-out; the inverse reading is blocked. Template at its 110-line cap. |
| O-3 = P-8 | LOW | **FIX (rework 1)** | Tie `<GRANTOR>` to the human developer; state that where nothing was granted the slot says `none` and the gate stays human; "human ratification" in the Gate record pointer. Reword within the 110-line cap. |
| O-4 | LOW | **FIX (rework 1)** | Add "Never copy over an existing loop directive" to the template intro. Prevents a restriction-loss route beyond the accepted D5″ residual. |
| O-5 = P-7 | LOW | **FIX (rework 1)** | Template "Who you are" names all three canon documents (add `docs/SPEC-CONVENTION.md`). |
| O-6 | LOW | **FIX (rework 1)** | "scoped to this goal only" → "as it applies to this goal" so restating a cross-goal grant does not narrow it (V6). |
| O-7 = P-4 | LOW | Forward to the goal's exit report | Who may transfer ownership, and "live", are canon-inherited gaps; not QF-P2's to define. Distinct from M-1/N-1. |
| O-8 = P-9 | LOW | Forward to QF-P3 shaping | Checkability gaps: §5 variant coverage beyond VP 5's PCRE, "flagged", wrapped placeholders, ownership block-quote form, decision-log boundary, heading-list diff, registry path forms in the mirror, entry contiguity in live directives. Current text is clean under O's full §5 scan. |
| O-9 | LOW | Accept as documented | Two historical citations of skill line 28 describe the text QF-P2 was meant to change; ruling Q1 permits the edit. |
| P-2 | LOW | **FIX (rework 1)** | Add to the CP paragraph (within the 5-line cap): a restrictive quick flag still limits conduct under a prose grant (registry §3's reconciling sentence, pointer only). |
| P-3 | LOW | **FIX (rework 1)** | Template carry sentence gains "directly under the `Active restrictions:` label" so lines cannot land outside the §9 entry boundary. |
| P-5 | LOW | **FIX (rework 1)** | Per-iteration step 1: "the `Active restrictions` entry in each copy named in the ownership block" (§9 Reading). |
| P-6 | LOW | **FIX (rework 1)** | Wakeup pacing names hook-feedback and completion-notification prompts too (registry §4), pointer only. |

Wording nits (both reviewers, one line): template:75 possessive after a code span; template:14 colon; CP:93 line-cite style; skill:50 repeated "entry". Not fixed; recorded here.

Tripwire accounting: no completion-claim falsification this round (the coordinator's deterministic pass reproduced every VP result before review). QF-P2 tripwires: 0 of 2.
