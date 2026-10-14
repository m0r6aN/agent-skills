# Reviewer J: QF-P1 v2 round 2 (`QUICK-FLAGS.md` @ `5023231d`; builder commit `1cc62b06`)

**Verdict: REQUEST CHANGES.** I found no BLOCKER and no HIGH. No quick flag, alone or combined, directly waives a §3 item. Four MEDIUM findings remain:
- **J-1 and J-2** come from the GATES rework (C4): two Gate 1 checks can now be passed in ways the rework was meant to block.
- **J-3** is a fix that was not applied everywhere (G-6 did not reach GATES).
- **J-4** is a gap in who must read the `Active restrictions` entry: a session that does not own the goal is not bound by it, so it can loosen a stored restriction.

## Verification Plan (run read-only; B=`521f774a`)

| # | Result |
|---|---|
| 1 | `1`; 346 lines (cap 370) |
| 2 | `14`; awk prints `0` |
| 3 | The 14 rows match the AC-2 table exactly; closed list `7` |
| 4 | V1–V7: `1` each |
| 5 | `1`; only ``Aliases: `--blanke` `` |
| 6 | The 21 pinned rows match the spec byte for byte, then `rows 55 ok` |
| 7 | `0` |
| 8 | Only L35; "flagged" = 0 |
| 9 | Only `QUICK-FLAGS.md` changed; no untracked files; `--check` clean. Also clean against rework base `662ae59e`. |

- **By hand:** the first rule ID is correct on all 21 pinned rows and the 17 pinned independent rows. No `|` appears in any cell or labelled line (the column counts are 36×2-col, 3×version, 57×conflict).
- **Mutations:**
  - VP6 catches a `--ratify×--halt` → `restrictive-wins` change.
  - No VP command catches reverting C3 (`provisional` order), C4 (GATES text) or the G-2 reading scope. The output hash is unchanged in each case. These are QF-P3 inputs and I am not re-raising them.

## Findings

| ID | Sev | Class | Finding and evidence | Suggested disposition |
|---|---|---|---|---|
| J-1 | MEDIUM | Fail-open, regression from C4 | **GATES lost its "before this message" pin for Gate 1 status and changed rows.**<br>• The old text refused a row "changed by charter text still awaiting Gate 1 *when the message arrives*".<br>• The new text (L122, L131) refuses if Gate 1 "is not *currently* granted", if "an open scoped Gate 1 re-open blocks" a parcel, or if the row "differs from … the last charter revision the gate record shows ratified".<br>• A passing `--ratify` writes the gate record in the same turn (L111), and `--ratify × --merge-ok/--dispatch-ok` is `independent` with no order (L303-304). Only the ID check stays pinned to "as it stood before this message" (L276, L303).<br>• **Literal path:** the previous turn presents an amendment that closes a re-open blocking QF-P1 and changes its row. The human sends `--ratify --merge-ok QF-P1`. Read after the ratify: Gate 1 is current, the re-open is closed, and the row equals the newly ratified revision. QF-P1 then merges on a chain earned under the superseded decision.<br>• `--ratify --dispatch-ok` works the same way at Stage Zero. This defeats the Q4/OQ-1 intent. | Evaluate every GATES condition (Gate 1 status, re-open block, row identity, gate record) on the state before this message. A same-message `--ratify` never satisfies any of them. Mirror this in the GATES rule-ID text (L276), which also omits the two new conditions from C4. |
| J-2 | MEDIUM | Fail-open of the G-4 fix; mechanical gap | **GATES reads "the integration-branch checkout", but nothing requires goal records to be there.**<br>• This goal shows the gap. `feat/foreman-line-quick-flags` (`111c2606`) has no `gate1-reopen-d5-d9-…` file and still has the pre-re-open gate record. Its Parcels rows are identical to `90f72d50`, the revision the gate record shows ratified.<br>• The re-open, its stop report and the amended charter exist only on `qf-p1`. No worktree has the integration branch checked out (`git worktree list`).<br>• So while that re-open was open, `--dispatch-ok QF-P1` read at the integration branch would pass every GATES check: Gate 1 granted, no open re-open, row unchanged.<br>• The gate record's location is not pinned at all.<br>• The §9 reading rule protects itself by reading "any copy"; GATES does not. | Make GATES fail-safe across copies: a re-open, unratified row change or missing gate-record entry found in **any** copy the session reads (including the owner's working copy) refuses. Alternatively, require goal records to be written in the integration-branch checkout, and refuse when the copies differ. |
| J-3 | MEDIUM | Incomplete sweep of G-6/H-4; contradiction | **`--ratify` now ratifies "only the decision list or amendment text presented" (L111), but the GATES row check works per revision (L122, L131).**<br>• Canon presents only "the charter's decision list" at Gate 1 (`skills/goal/SKILL.md:20`).<br>• So a Parcels row that was never presented passes "identical to its text in the last charter revision the gate record shows ratified", even though no Gate 1 act covered it.<br>• Under the new scope, `--ratify` can never ratify a Parcels table unless it appears in amendment text. The row check is therefore either always vacuous or never satisfiable. | Have the row check require the gate record to name the Parcels table (or that row) among the parts shown. Alternatively, define the presented decision list to include the Parcels table. |
| J-4 | MEDIUM | Fail-open: restriction loosened without a lift | **Only "any session owning or resuming the goal" must honour the stored entry (L226).**<br>• `--merge-ok`, `--dispatch-ok`, `--blanket` and `--asrec` have no ownership precondition. Only `--resume` (L165-167) and `--halt` mention the owner.<br>• The registry expects non-owner sessions to process quick flags ("A session that is not the owner honours a restrictive quick flag…", L225).<br>• **Literal path:** a second, non-owner session receives `--merge-ok QF-P3`. QF-P3 is a Standard parcel with one review and a `--review2` line on it. The session is not bound by the line, sees a green chain by canon's count, and merges.<br>• `--nopush` is bypassed the same way for a standing-authorized push, and so is a standing-authorized merge under `--asrec`. | Any session that processes a quick flag for a goal, or dispatches, merges or acts outward for it, honours every line. Gate and delegating quick flags are refused in a session that is not the goal's owner (stop-and-report). |
| J-5 | LOW | Contradiction; one reading fails open (G-9 closure incomplete) | Writer (L225) says "It adds a line **only** in the turn answering a human-typed message that issues the quick flag (or a provisional line under §6)". The same bullet's new C9 sentence says a session that becomes owner "writes a line … for every restriction it is honouring that has none". That second write does not fit the "only" clause, so a reader who obeys "only" loses the restriction. | Add the becoming-owner write as an explicit exception in the "only" clause. |
| J-6 | LOW | Contradiction / D6 | `--merge-ok × --review2` is `independent`, which L252 defines as "neither changes the other". But its Rule text (L316) says `--review2`'s reviews are part of `--merge-ok`'s chain. D6 and the Winner ranking (L258) put `--review2` above `--merge-ok`. Read literally as `independent`, `--merge-ok QF-P3 --review2` merges a Standard parcel with one review. | Make the row `restrictive-wins`, Winner `--review2` (no merge until two reviews), or state the processing order. |
| J-7 | LOW | Contradiction; fail-closed deadlock | **The §4 span rule refuses a natural `--review2` lift.**<br>• `lift --review2 QF-P2` puts `QF-P2` in the token's span, and `Arguments: none` makes every span word invalid (L39, L185; Step 0 ruling "no per-flag exception").<br>• The new L39 sentence exempts the lift only from the limiting-prose rule. §9 requires the parcel to be named when there are several lines.<br>• The same applies to `lift --strict now`.<br>• Only the code-span form works. | State that a token named in a lift has no span and is not subject to argument refusal. |
| J-8 | LOW | Temporal deadlock (fail-closed) | **Copies of the entry that no lift can reach.**<br>• Lines are honoured "in any copy" (L226), but lines are written and removed only in the integration-branch checkout (L225).<br>• Stage Zero lines in the draft charter are "carried into" the loop directive (L228) and never removed from `charter.md`. Removing them would edit a ratified file.<br>• A lift therefore never takes effect while a stale copy exists, for example on a parcel branch or in the charter. | Lift every copy the session reads, or limit reading after Stage Zero to the loop directive's copies and remove the charter copy when carrying the lines over. |
| J-9 | LOW | Mechanical gap | **The row check cannot use a ratification that records no revision.**<br>• "Gate 1 … in any form, prose included" can be granted in prose that names no revision. The row check then compares against "the last charter revision the gate record shows ratified" (L122), which may be older.<br>• Example: this goal's gate record names `90f72d50`. `d0af590b` ("Ratify your recommendations") changed the QF-P1 row and records no SHA.<br>• So which revision counts is undecidable. It fails closed through "Any doubt". | Define which revision a prose ratification establishes, or say that prose Gate 1 establishes no ratified rows. |
| J-10 | LOW | Fail-open for restrictive quick flags (H-5 residue) | **Some dash or space characters still drop a `--dry` silently.**<br>• "Whitespace-delimited" splits on Unicode White_Space, but the rule also deletes "whitespace-like" characters *inside* a word, and the two overlap.<br>• Probed with a literal implementation: `--\u00a0dry --merge-ok QF-P1` (NBSP) and `˗˗dry` (U+02D7, not in `Dash`) are neither tokens nor variants, so `--dry` is lost and the merge proceeds.<br>• Mitigated by these inputs being exotic. | Define the delimiter set, for example ASCII space, tab and newline only, and treat any other White_Space or Cf character as inside the word. Extend the dash set to visually dash-like symbols, or match on a confusables skeleton. |
| J-11 | LOW | Fail-open gap the C2 sentence opened | L45 says the expanded skill or command body "carries no quick flags and **does not make the message inert**". That assumes the Coordinator can see where the human's words end. Where it cannot (an unmarked template expansion, or `$ARGUMENTS` substituted into the body), a body token is read as typed, and the inert fallback for pasted content (L49) is now explicitly switched off. | Add: if the typed words cannot be told from the expanded body, treat the body as pasted content (L49). |
| J-12 | LOW | Mechanical gap (grammar) | **The `Active restrictions` line grammar is defined only by example.**<br>• The first field's form (backticked token), the order of `scope`/`since`/`session` and the `session:` format appear only in the example (L220-221).<br>• Only `message:`-last, `provisional`-before-`message:` and `since:` are stated rules. | State the field order and the first-field grammar. |

**Wording nits:**
- Winner is self-referential on rows whose message becomes inert.
- AC-2's "only" is exceeded by L122 "`--nopush` does not block it" and L167's SEQ sentence.
- L156 "decision" vs C1 ratification relies on row 306 alone.
- "never `main`" names only `main`, not the repo's default branch.

## Round-1 closure (each grepped file-wide)

| Item | Status | Evidence |
|---|---|---|
| G-1 | Closed | L227 "lasts until a human-typed lift (T3)"; "goal exit" appears only there |
| G-2, H-2 | Closed | L226 "every line of the `Active restrictions` entry … outside its `message:` field"; L225 "outside `message:` text, on another line of the entry" |
| G-3, G-4, H-3 | Text applied (L122, L131) | Regressions: J-1, J-2, J-9 |
| G-5 | Closed | L102; §7 L78 |
| G-6, H-4, H-11 | Closed in L110-111 | Not swept into GATES: J-3 |
| G-7, H-6 | Closed | L120 |
| G-8, H-1 | Closed | L41; L264, L286, L287; my re-sweep found no other unqualified "only" |
| G-9 | Partly closed | J-5 |
| G-10, H-7 | Closed | L216 |
| G-12 | Closed | L131 "row order" |
| G-13 | Closed | L156, L274; rows 289, 298, 313, 319 ("after the current step" is gone) |
| G-14, H-5, H-10, H-12 | Closed | L37, L60, L47, L25, L45. Residue: J-7, J-10, J-11 |
| H-8 | Closed | L346 |
| Nits | Closed | `loop-directive.md` citations: 0; `--dry --ratify` reconciled (L113, L305) |

- **Rulings C1–C13:** all applied (C1 L156/L306/L330-332; C2 L45; C3 L221/L224; C4 L122/L131, but the GATES rule ID at L276 is only partly updated, see J-1; C5 L120; C6 L276/L303/L304/L311; C7 L78; C8 L225/L228; C9 L225, see J-5; C10 L113; C11 L226; C12 L37/L60; C13 unchanged).
- **AC-1 to AC-24 and V1–V7:** all satisfied as amended by the rulings. AC-15 text holds, but its intent fails at J-1 and J-3.
- **Waiver routes (a)–(d):** all blocked (L41/L45/L226; L44; L25/L111; L23/L25).
- **Removal check:** no record, id, void, revocation or pin remnant remains.
- **Conflict table:** 55 rows plus 36 OBS pairs, consistent with every entry's Conflicts line, except J-6.

**Git control:** `git status --short` is empty and HEAD is still `5023231d`. My scratch directory (`mktemp -d`) is removed, and I changed nothing in the repo.

**Verdict: REQUEST CHANGES** (J-1 to J-4).
