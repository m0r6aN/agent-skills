# QF-P2 adversarial review, round 1: Reviewer P

**Verdict: REQUEST CHANGES.** There is one MEDIUM finding (P-1). It is a contradiction, and it fails closed: authority is lost, never gained. I found no BLOCKER or HIGH and no fail-open path through any gate.

I ran all 11 Verification Plan commands at `B=41f80463` and every one gave the stated result. My scratch work used `mktemp -d` and has been deleted. `git status --short` shows the same 3 modified files and 1 untracked file as before I started, so I changed nothing.

## Findings

| ID | Rank | Class | Evidence | Finding | Suggested disposition |
|---|---|---|---|---|---|
| P-1 | **MEDIUM** | Contradiction; AC-16 naive reading (b) | `skills/goal/SKILL.md:46` vs `:18`; `QUICK-FLAGS.md:31,41`; `COORDINATOR-PATTERN.md:93`; live case: `docs/goals/ops-console-roadmap-authority.md:1-21` | **V7's exception only covers authorizations "in the loop directive".** The registry's version has no such limit (`:41`), and its §3 explicitly names "a goal's authority file" as a prose grant (`:31`). Line 18 sets aside the goal's prose standing authorizations *and gate record* wherever they are stored. Read literally, V7 at `:46` therefore cancels any prose grant kept outside the loop directive. Examples are the ops-console authority file and grants recorded in the charter at ratification (CP:52). The same reading cancels the gate record. This contradicts V6 (CP:93: "neither reinterpreted nor revoked") and the skill's own line 18. It is exactly what AC-16 forbids: an added sentence readable as revoking a prose grant. The skill is canon, so its narrower exception would override the registry's wider one. The spec's own OQ-3 reasoning (V7 alone reads as cancelling authorizations) applies equally to the cases the exception leaves out. | Amend the AC-3 wording first, then rework `:46`. For example: "Prose standing authorizations, wherever written (the loop directive, the charter or a goal's authority file), and the gate record, which is evidence of a human act, are governed by canon and registry §3, not by that sentence." Mirror the change in the synced copy. The alternative is to accept it as documented, with a ruling that it fails closed. |
| P-2 | LOW | Fail-open naive reading of a restriction | CP:93; template `:44-45`; `QUICK-FLAGS.md:31` (reconciling sentence), `:210` | **CP's tie-break could be read as letting a standing push grant override `--nopush`.** CP repeats V6 but not §3's reconciling sentence ("Restrictive quick flags limit the Coordinator's conduct while in force, whatever the source of the authority"). It then says "where the registry and this charter differ, this charter governs". A literal reader could treat "`--nopush` narrows an existing grant" as differing from "neither reinterpreted nor revoked", and conclude the push grant wins. The template line "none widens, reinterprets or revokes one" has the same gap. The two V6 texts are identical, so the reading is strained. | Add a pointer clause such as "a restrictive quick flag still limits conduct under them (registry §3)", or accept as documented. |
| P-3 | LOW | Template mis-fill that drops a restriction; QF-P3 gap | template `:73-79`; `QUICK-FLAGS.md:216` | **The blank line after `Active restrictions:` (required by OQ-2) invites lines that fall outside the entry.** Together with "carries into the entry *below*", it suggests writing `- ` lines after the blank. §9's boundary ends the entry at the first line that does not start with `- `, so those lines are outside it and are never honoured. My mutation probe (a line inserted after the blank) still passes VP command 9. This is in the D5″ "dropped line" residual class. | Add a QF-P3 check: any `- ` restriction line in that section must sit directly under the label. Or add "directly under the label" to `:73`. |
| P-4 | LOW | Naive reading (d) | template `:16-19`; CP:73; `loop-directive.md:4` (transfer made "on the developer's instruction") | **The ownership block says how a transfer happens ("by editing this block") but not who may do it.** "Live" is also undefined. Read literally, a session may claim ownership at a parcel boundary by deciding the named owner is not live. A mid-parcel claim is excluded ("only at parcel boundaries"), and the block names session ID plus both paths. Canon is equally silent. | Forward to the goal's exit report. |
| P-5 | LOW | Under-reading a restriction | template `:61`; `QUICK-FLAGS.md:225-226` | **Step 1 reads one entry, but §9 requires every copy.** It says to read "the `Active restrictions` entry". §9 Reading requires the entry in every copy the session reads, and the ownership block itself names two copies. The pointer to §9 at `:69` mitigates this. | Change to "the entry in each copy named in the ownership block", or accept. |
| P-6 | LOW | Partial restatement (D2″ boundary) | template `:99-100`; `QUICK-FLAGS.md:44` | **Wakeup pacing names only wakeup and resume prompts.** §4 also covers hook-feedback and completion-notification prompts, and says a token found in one "is ignored and reported". Naming only some invites the reading that the others may carry quick flags. Skill `:46` ("only in a human-typed developer turn") rules that reading out. | Accept, or add "(and hook-feedback and completion prompts; registry §4)". |
| P-7 | LOW | Surfaces disagree on what canon is | template `:29-31` vs skill `:44` | **The template lists less canon than the skill.** Its canon is CP plus the `/goal` skill, and it says "canon governs above it". The skill's canon also includes `SPEC-CONVENTION.md`, which the registry relies on for the main/PR boundary (`QUICK-FLAGS.md:120`). | Add SPEC-CONVENTION to `:30`, or accept. |
| P-8 | LOW | Naive reading (e) | template `:42`, `:35`; CP:52; `QUICK-FLAGS.md:25` | **Two template slots don't say the human is the actor.** `<GRANTOR>` is not tied to the developer, and one grantor/date pair covers all grants, though grants may come "at ratification or later". The Gate record says "a ratification" where §3 says "a human ratification". Both point to registry §3, which governs. | Use `<GRANTOR (THE DEVELOPER)>` and "human ratification", or accept. |
| P-9 | LOW | Checks QF-P3 should make mechanical | VP commands 4, 6, 9 | Six gaps, most shown by mutation: (i) **Decision log boundary unchecked.** No check enforces AC-12 item 4. I inserted `Gate 1: pre-authorized by standing grant` after `Decision log:` and every VP command still passed. (ii) **"flagged" / "flagging" pass command 6**, though the spec says to avoid "flagged". (iii) **AC-4's "and no other" home is not checked.** (iv) **AC-9 headings are compared by eye.** A `diff` against the fixed list would do it. (v) **Path forms differ.** The mirror names the registry as `plugins/foreman-line/docs/QUICK-FLAGS.md`, so QF-P3's "skill references the registry" check must accept both forms or check only the source. (vi) **Entry contiguity** in live directives (P-3). | Route to QF-P3 shaping. |

## Waiver routes and naive readings

**(a) The four waiver routes all fail on the new text:**
- **A token or line in the loop directive granting authority.** Blocked by V7 (`:46`), template `:70-71` ("Nothing in the entry can grant authority…") and `:44-45` ("Quick flags are not standing authorizations: none is written here").
- **The Coordinator writing a quick flag into its own wakeup or resume prompt.** Blocked by "counts only in a human-typed developer turn" (`:46`) and template `:99-100`.
- **A delegating quick flag plus a ratification passing Gate 1.** The new text adds nothing that permits it. V1 says a quick flag "never removes a gate", skill line 20 says Gate 1 is never delegable, and registry §3 governs.
- **A delegating quick flag covering a triage-reopened Gate 1.** "Gate 1 is never delegable and never appears here" (`:43-44`). A re-opened Gate 1 is Gate 1 (skill `:24`, registry §3).

**(b)** Fails as P-1 describes. Line 18 itself is safe: it only frames a question and excludes both items from it.

**(c) Pasted or expanded text carrying a quick flag: excluded.** "Only the words the human typed count" excludes pasted text, which was not typed. Indistinguishable text "is treated as pasted content (registry §4)".

**(d)** See P-4. A mid-parcel claim is excluded, and the block is not limited to a session ID.

**(e) Storing a grant, or pre-authorizing Gate 1, through these sections: excluded.**
- Gate record: a pointer to §3/§8, then `*(none yet)*`, with no format defined.
- Standing authorizations: Gate 1 is barred from the section.
- `Active restrictions:` is followed by "can grant nothing".

**(f) CP section: excluded.** "This charter governs" keeps canon above the registry, and the section adds and removes no gate. The only weakness is the tie-break residual in P-2.

## AC trace

All 17 pass as written:

| AC | Result | Evidence |
|---|---|---|
| AC-1 | PASS | VP command 2. Lines 41/42 are `[]` then `## Quick flags`; the section is 11 lines. |
| AC-2 | PASS | "single, versioned source of truth"; "`Registry version:` line"; "canon governs"; V1; "restates none". |
| AC-3 | PASS | V7; "not by that sentence"; "human-typed developer turn"; the expanded `/goal` sentence; "pasted content (registry §4)". The scoping wording is what P-1 targets. |
| AC-4 | PASS | All three homes are named; "every earlier entry"; the §9 pointer is present; there is no decision-log carry rule. |
| AC-5 / AC-6 | PASS | Byte-exact (VP command 3). `foreman-line-coordinator-loop` occurs 0 times in both source and mirror. |
| AC-7 | PASS | Exactly one non-"quick" line: `:52`, which contains "Step 0". |
| AC-8 | PASS | Heading correct; block quote names the `/goal` skill, CP and `docs/QUICK-FLAGS.md`; placeholders are upper case; clean-room grep finds 0; 110 lines. |
| AC-9 | PASS | All 11 headings, exact and in order. |
| AC-10 | PASS | Block quote at `:11-19` with all 6 placeholders and the 3 rules. |
| AC-11 | PASS | Ruling-G sentence then `*(none yet)*`; grantor/date; Gate 1 bar; §3; three numbered slots. |
| AC-12 | PASS | Order is prose → carry sentence → label → blank → `Decision log:` → blank → heading. No `- ` lines. Field grep finds 0. |
| AC-13 | PASS | Universal set (items 1-5), human gates, hook condition, charter placeholder; pacing; crash recovery. |
| AC-14 | PASS | Precondition diff and mirror diff are both empty; mode 644; snapshot metadata untouched (VP command 11). |
| AC-15 | PASS | 4 lines; V1/V6; registry path; "not standing authorizations"; "this charter governs". |
| AC-16 | PASS | Mechanical part passes: VP commands 5 and 6, plus my independent §5 variant check of all new text, which found nothing. P-1 is the one reading-based gap. |
| AC-17 | PASS | Scope is exactly the four files; the historical kickstarter is untouched; `diff --check` is clean; all files end with a newline. |

## Other mandate items

- **D2″ "documented once":** no entry, line format, conflict row or example line is restated. The homes the skill names match §9: the second copy is a copy, not a home, per ruling D. The only partial restatements are P-6 and P-2.
- **Mirror:** identical to the source apart from the `${CLAUDE_PLUGIN_ROOT}` substitution.
- **Citation stability:** all of the registry's citations into the goal skill and CP (`:13,32,36,40`; CP `:7,30,51-53,69,73`) still point at the same bytes. The only citations of line 28 are in historical review records (`plan-review-findings.md:32` R8, `qf-p1-review-F-round3:34`, `K-round3:70`). They describe the old text that QF-P2 was meant to change, which is the intended effect of Q1.

**Wording nits:** template `:75` has "`…restrictions.md`'s" (possessive after a code span); template `:14` has an odd colon in "Claimed `<CLAIM-DATE>`: `<CLAIM-PROVENANCE>`"; CP:93 says "(see The three human gates, above)" where a line cite would match house style; skill `:50` uses "`Active restrictions` entry" twice in one clause.
