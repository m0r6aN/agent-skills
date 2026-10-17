# Reviewer I: QF-P1 v2 round 2, `plugins/foreman-line/docs/QUICK-FLAGS.md` at HEAD `5023231d` (rework commit `1cc62b06`)

**Verdict: REQUEST CHANGES.** I found 3 MEDIUM and 6 LOW findings, and no BLOCKER or HIGH. The direct waiver paths stay closed: quick-flag tokens in a file, pasted or quoted text, wakeups, variants, a forged line, `--asrec`/`--blanket` beside a ratification, and `--blanket` on a re-opened Gate 1. The rework still opened two new contradictions and left one closure partial:
- an order-dependent same-message path, which reverses the OQ-1 ruling;
- a restriction that a lift cannot remove;
- G-6/G-3 are closed only in part.

## Verification Plan (rework base `B=662ae59e`)

| # | Result |
|---|---|
| 1 | `1`; 346 lines (cap 370) |
| 2 | `14`, then `0` |
| 3 | Exactly the 14 rows of the AC-2 table; `7` |
| 4 | V1–V7 each `1` |
| 5 | `1`; only ``Aliases: `--blanke` `` |
| 6 | Output is byte-identical (`diff`) to the 21 pinned rows plus `rows 55 ok` |
| 7 | `0` |
| 8 | Only L35; "flagged" count 0 |
| 9 | Only `QUICK-FLAGS.md` changed; no untracked files; `--check` clean |

**Mutations on scratch copies:**
- Swapping a pinned Winner (`--halt`×`--resume` → `--resume`) is caught.
- Re-citing pinned `--dry`×`--halt` as `SUBJ:` is not caught. This is the known G-11/H-9 gap and is not re-raised.
- Deleting the new re-open clause is not caught. That is expected, because no check binds prose.

**Hand checks:**
- The first rule ID matches AC-21 on all 21 pinned rows and on the 17 pinned independent rows.
- Every entry's `Conflicts and lifting:` line agrees with its table rows.
- 91 − 55 = 36 OBS pairs.
- No `\|` appears in any cell or labelled line.
- The removal sweep (record/void/revok/pin/suspend/blob/id) finds only the intended survivors: V5, V6, "revokes nothing", "gate record" and "no id".

**AC trace:** all 24 ACs pass once the binding rulings are applied:
- **AC-10:** variant rule per C12 at L60.
- **AC-15:** GATES checks per C4 at L122/L131, target and C5 at L120.
- **AC-17:** `--halt` per C1 at L156.
- **AC-19:** C3/C8/C9/C11 and the lifetime ruling at L216–228.
- **Other ACs:** traced as in the G/H reviews.

The only qualified pass is AC-15's intent under C4 (see I-2). The Step 0 rulings are present at:
- L39: no-argument span.
- L27/L66: stop-report answers.
- L225–226: multi-name lines.
- L129: unlinted parcels.

## Closure of round-1 IDs and C1–C13

| ID / ruling | Status | Evidence (quote) |
|---|---|---|
| G-1 | Closed | L227 "every line… lasts until a human-typed lift (T3); the final report at goal exit lists…". No other "goal exit" remains. |
| G-2/H-2 | Closed for stop reports and other records; see I-3 for copies | L226 "every line of the `Active restrictions` entry… whose text outside its `message:` field… Stop reports, the decision log, the gate record and `message:` text are never read as restriction lines" |
| G-3/G-4/H-3 | Text applied; **G-3 only partly closed** (I-1) | L122/L131 "not currently granted… (a pending re-open is not granted), if an open scoped Gate 1 re-open blocks… differs from its text in the last charter revision the gate record shows ratified… Any doubt: refuse" |
| G-5 | Closed | L102 "or needs Gate 2 or 3 not already covered by a standing authorization, is not covered"; §7 L78 |
| G-6/H-4/H-11 | Ratify side closed; **"rows never shown pass GATES" still open** (I-1) | L111 "of only the decision list or amendment text presented… grants no standing Gate 2 or 3 authorization"; L110 "every shown revision must be named" |
| G-7/H-6 | Closed, with LOW residue (I-8) | L120 "must equal both the Branch in the charter revision… and the integration-branch name… never `main`" |
| G-8/H-1 | Closed | L41 "Prose standing authorizations are governed by canon and §3"; "among quick flags, only" at L264 and both Rule cells. Re-sweep: no unqualified "only the human's own" remains. |
| G-9 | Closed for owners; Stage Zero ownership undefined (I-7) | L225 "a session that becomes owner writes a line…"; L228 |
| G-10/H-7 | Closed | L216 "`since:` is `YYYY-MM-DD`, and `message:` is the last field… `\\`… `\|`… `\n`" |
| G-12 | Closed | L131 "comes after, in the Parcels table's row order" |
| G-13 | Closed | L156 and STOP L273 "(the one in progress when the message arrived)… no dispatch, merge, decision or option the message requests is started"; "after the current step" no longer appears anywhere |
| G-14/H-5/H-10/H-12 | Closed, with LOW residue (I-5) | L37 repeat refusal; L60 Cf/`Dash`/U+2212 and the leading-`-` rule; L47 "issues and lifts… is unclear"; L25 "No ratification of any form…"; L45 skill expansion |
| H-8 | Closed | L346 T5 "most restrictive meaning of any registry version since it was written" |
| Nits | Closed | `loop-directive.md:21` gone (0 hits); `--dry --ratify` matches at L113 and L305; L39 `--review2`-lift exemption |
| C1 | Closed | L156, L273 |
| C2 | Closed | L45 |
| C3 | Closed | L221, L224 |
| C4 | Closed | L122, L131, L276 |
| C5 | Closed | L120 |
| C6 | Closed | L276, L303–304, L311 |
| C7 | Closed | L78 |
| C8 | Closed | L225, L228 |
| C9 | Closed | L225 |
| C10 | Closed | L113, L305 |
| C11 | Closed | L226 |
| C12 | Closed | L37, L60 |
| C13 | Closed | Decision log unchanged (diff) |

## Findings

| ID | Sev | Class | Finding and evidence | Suggested disposition |
|---|---|---|---|---|
| I-1 | MEDIUM | Contradiction, with a narrow fail-open of Gate 1 scope; V7 tension | **(1) Scope mismatch.** `--ratify` ratifies "**only** the decision list or amendment text presented" (L111). GATES and the merge target, however, treat everything in "the last charter revision the gate record shows ratified" as ratified (L120, L122, L131), and the gate record holds a whole-file revision. Under the registry's own definition, a quick-flag Gate 1 never ratifies a Parcels row. So either every row in a "ratified revision" passes, including rows never presented (G-6's "rows never shown pass GATES"), or no row ever passes.<br>**(2) No defined evidence.** The pass/fail outcome rests on a gate record with "no format" (L111), written by the Coordinator. This is the party being gated, and the result is file content deciding authority (V7, L41). G-3 is therefore still partly open.<br>**Concrete case in this goal:** the gate record cites `charter.md` at `90f72d50`. The QF-P1 and QF-P2 Parcels rows were changed in `d0af590b` under a prose re-ratification ("Ratify your recommendations") that named no revision; `git diff 90f72d50 HEAD` shows both rows changed. Under L131 those rows are refused until the Coordinator edits the gate record to cite a newer revision. That edit turns a refusal into a pass. | Define a "ratified Parcels row": one present in a revision that a gate-record entry ties to a quoted human message, where the parts shown included that row (or the Parcels table). At Gate 1, `--ratify`'s presented text must include the Parcels table. Otherwise refuse. |
| I-2 | MEDIUM | Regression and order-dependent result; reverses the OQ-1 ruling | **What changed:** the rework replaced "Gate 1 was not granted… **before this message**" and "row… changed by charter text still awaiting Gate 1 **when the message arrives**" with "not **currently** granted" and "the **last** charter revision the gate record shows ratified" (L122, L131). Only ID existence keeps the anchor "as it stood before this message" (L276).<br>**The path:** in `--ratify <rev> --merge-ok QF-Pn` (or `--dispatch-ok`), where `<rev>` changes QF-Pn's row or closes a scoped re-open, the result depends on processing order. If the ratification's gate-record entry is written first, the row matches, Gate 1 is "currently" granted, the re-open is no longer "open", and the gate quick flag passes. Under the rows' `independent` resolution (L303–304), nothing fixes the order.<br>**Why it matters:** OQ-1 (spec, Open Questions) and Q4 rule that same-message ratified text must not feed a gate quick flag. | Evaluate every GATES condition as of message arrival ("as it stood before this message"), or refuse a gate quick flag in any message whose `--ratify` passes. |
| I-3 | MEDIUM | Temporal deadlock: a restriction a lift cannot remove; regression from C8 | **The rules:** Reading honours lines "in any copy it reads" (L226). The Writer may write only "in its integration-branch checkout" (L225). At Stage Zero, lines go into the draft charter, "read as a copy of the entry", and are "carried" into the directive (L228). Nothing retires the charter copy once it has been carried.<br>**The deadlock:** after Gate 1, the charter copy is ratified charter text, and editing it is a charter amendment (§3 list, L23). A human lift removes the loop-directive line, but the charter line is still a line in "a copy" and still restricts. On the next lift, "the lifted name still appears… on another line… the restriction stays" (L225). This contradicts T3/L227 ("lasts until a human-typed lift"). Stale copies of the directive on parcel branches behave the same way (this goal keeps its live directive on `qf-p1`).<br>**Smaller ambiguity:** with two `--review2` lines, L225 does not say whether the parcel-qualified line is removed before "the restriction stays". | State that once the lines are carried, the Stage Zero charter entry is no longer a copy (or remove it in the same write). Say that a lift removes the line from every copy the Writer can reach. Limit "still appears" to lines with the same scope. |
| I-4 | LOW | Internal contradiction | "Gate 1 is not currently granted for the goal… (a pending re-open is not granted)" (L122, L131). Read literally, any open scoped re-open refuses every gate quick flag. That makes the next clause ("if an open scoped Gate 1 re-open blocks any named parcel") dead text, and it over-holds orthogonal work (CP:75, lesson #27). | Pick one: "Gate 1 not granted for any decision a named parcel depends on", or delete the redundant clause. |
| I-5 | LOW | Fail-open for an intended restrictive quick flag; checkability gap | **Probe:** I ran a literal implementation of L60. These words are neither tokens nor variants: `-- dry`, `— halt` (dash run split from the name by a space), `➖➖dry` (U+2796), `˗˗nopush` (U+02D7, which is Lm and so not stripped), and `⁃⁃halt` (U+2043).<br>**Effect:** in `-- dry --merge-ok QF-P1`, the merge proceeds. The span rule (L37/L39) catches such a word only when it follows the gate quick flag on the same line.<br>**Checkability:** "whitespace-like" is undefined. | Treat a dash-only word directly followed by a word containing a canonical name as a variant. Define "whitespace-like" (e.g. White_Space plus Default_Ignorable_Code_Point). |
| I-6 | LOW | Contradiction inside a row | `--merge-ok`×`--review2` is `independent`, which is defined as "neither changes the other" (L252). Its Rule text says "the green chain `--merge-ok` requires includes the reviews `--review2` requires" (L316), so one does change the other. No order within the message is defined. A literal processor merges first, under the earlier one-review chain (standard-risk parcel). The text at L316 and L183 ("binds… when the message arrives") does block this, but the vocabulary contradicts it. | State that `--review2`'s requirement applies from message arrival, before any `--merge-ok` in the same message. |
| I-7 | LOW | Undefined term; G-9 Stage Zero half open under the literal reading | Writer: "only the owning Coordinator… (at Stage Zero, in the draft charter)"; "a session that is not the owner… writes nothing" (L225). Ownership lives in the loop directive's block, which does not exist at Stage Zero. Read literally, no session can write the Stage Zero lines (L228). §6's owner-only stop writes have the same problem. | Define the Stage Zero owner as the session that started `/goal <concept>` for the slug. |
| I-8 | LOW | Mechanical gap and inconsistency | L120 says "the charter revision the gate record shows ratified"; L122/L131 say "the **last**…".<br>"As read in the integration-branch checkout" is circular: the checkout is found by the very name being verified.<br>"Never `main`" does not cover a trunk with another name. | Use "last" in both places. Name the checkout by the ratified charter's Branch. Write "never the repository's trunk (`main`)". |
| I-9 | LOW | Mechanical gap (QF-P2/QF-P3 input, not G-11/H-9) | The `Active restrictions` grammar fixes only the first field, `provisional`-before-`message:`, and `message:`-last (L216, L224). The required field set, the field order, and where the entry ends in the loop directive are undefined. The reading and lift rules depend on "line of the entry" (L225–226). | Declare the field order and the entry's end (e.g. the first line not starting with `- `). |

**Wording nits:**
- L25's prose-ratification bar goes beyond "governs quick flag tokens only" (L31); it is ruled and fail-closed, so scope the L31 sentence.
- The L120 merge-target pin sits against AC-4's literal "no pinned integration branch" (allowed by the G-7 ruling).
- AC-2's "only" still clashes with the "`--nopush` does not block it" text at L122 and with the target refusal placed in the Expansion line.
- The "not applied where they conflict" rule for `--halt` and `--resume` (L253) does not say whether ownership is claimed.

**Git control:** `git status --short` is empty, HEAD is unchanged (`5023231d`), and `git diff --stat HEAD` is empty. The private scratch directory from `mktemp -d` was removed, and I wrote nothing inside the repo.

**Verdict: REQUEST CHANGES** for I-1, I-2 and I-3. I-1 and I-2 need a coordinator ruling, because their text comes from the C4 and G-6 rulings.
