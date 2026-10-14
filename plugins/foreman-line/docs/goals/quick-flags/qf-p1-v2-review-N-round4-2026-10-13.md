**Verdict: ACCEPT.** I found nothing above LOW. Reviewer N, QF-P1 v2 round 4, `plugins/foreman-line/docs/QUICK-FLAGS.md` at HEAD `bad7ae41` (rework commit `f985f4cc`).

No quick flag, alone or combined, waives Gate 1 (re-opened or not), the universal stop conditions, green-chain merge, human-only gates, or the destructive and outward-facing limits. Every round-3 ID and rework-3 ruling is closed in every instance. The five LOW findings below are worth recording; none blocks.

## Verification Plan
I ran the commands read-only, with B = `521f774a` (the v2 build base) and also `468347b0`, `662ae59e` and `da7fc6e2`.

| # | Result |
|---|---|
| 1 | `1`; 346 lines (cap 370) |
| 2 | `14`; awk prints `0` |
| 3 | The 14 rows match the AC-2 table exactly; closed list `7` |
| 4 | V1–V7: `1` each |
| 5 | `1`; only ``Aliases: `--blanke` `` |
| 6 | `diff` against the spec's 21 pinned rows is identical, then `rows 55 ok` |
| 7 | `0` |
| 8 | Only L35; "flagged" = 0 |
| 9 | Only `QUICK-FLAGS.md` changed (against every base); no untracked files; `--check` clean |

**Mutation tests on scratch copies:**
- Caught: a swapped `--dry`×`--halt` Winner, a bad rule ID (`BAD rule:`), and `--nopush` set to `one-shot` (VP3).
- Not caught, as expected (prose; the accepted G-11/H-9 gap): deleting the dash-only sentence, and reducing the Reading rule's locations back to "in any copy it reads".

**GATES clause:** the text from "Every other check" to "Any doubt: refuse." is byte-identical in L122 and L131 (854 bytes).

## Closure of round-3 IDs and rulings C1–C11

| ID / ruling | Status | Evidence |
|---|---|---|
| K-1, L-1 | Closed as ruled (residual is N-1, a gap in the ruling, not a missed instance) | L225 "in every copy it may write under canon (its own checkouts): the loop directive in its working copy and, if different, in its checkout of the integration branch…"; L226 "at the Writer's location and in every other copy it reads (the owner's working copy included…)" |
| K-2, L-5 | Closed | L228 "after Gate 1, in one in `restrictions.md`… a goal record and not charter text"; L111 (b) "unchanged since that turn outside its `Active restrictions` entry" |
| K-3, L-2 | Closed (only instance) | L276 "each gate quick flag is the human's own act; `--dispatch-ok` and `--merge-ok` are refused in a session that is not the goal's owner… refuses `--dispatch-ok` or `--merge-ok`" |
| K-4, L-3, C1 | Closed | L60 "A word whose result is only dashes, directly followed by a word whose result, compared case-insensitively, equals or begins with…". A literal implementation classifies `-- Dry`, `(— halt.`, `-- dry-run` and `⸺dry` as variants. |
| K-5, C2, C3 | Closed | L225 "removes only lines whose own (first-field) quick flag is lifted and whose text outside `message:` contains no restrictive quick flag (or variant) the message does not lift; if any remaining line, in any scope… (for `--review2`, one for the lifted parcel or with an unreadable parcel)…" |
| K-7, L-6 | Closed | L225 "removes it from every copy it may write; any other copy is reported, not edited, and still restricts". "can reach" and "in the checkout or not" now grep to 0. |
| L-7 | Closed | L25 definitions of gate quick flag, tie, and ratified charter. Uses at L120, L122 and L131 point to "(§3)", and the Writer no longer depends on it. |
| C4, C5 | Closed | L228 "until it exists, the owner is the session that started `/goal <concept>`… Each is read as a copy… until the owner carries its lines" |
| C6 | Closed | L244 "Before the loop directive exists, entries go in a decision-log section of the file where §9 then places restriction lines" |
| C7 and the nit | Closed | L111 "(for a Gate 1 ratification, including one re-opened by triage, the charter's decision list and Parcels table, with any amendment text…)" |
| K-6, L-4, L-8, C8–C11 | Accepted as documented | No text required |

**Remaining sweep:** "still appears", "can reach" and "Stage Zero lines" each grep to 0. "Stage Zero" survives only in the draft-work clauses (L78, L93, L102), which are consistent with L228.

## AC trace and probes
**AC trace:** all 24 ACs pass under the binding rulings. V1–V7 are present verbatim (L21, L23, L29 twice, L120, L31, L41). Every entry's Conflicts line agrees with its table rows; 91 − 55 = 36 OBS pairs.

**Waiver probes, all blocked:**
- **Token provenance:** tokens in files, prompts, quoted or pasted text, code spans and skill bodies (L44–49).
- **Spoofed tokens:** aliases, repeats, homoglyph and Unicode-dash variants, and dash-only splits (L37, L60). Each makes the message inert or is recognized as a variant.
- **Limiting prose:** limiting prose, and a parcel ID outside the argument span.
- **Combined gate flags:** `--ratify` with `--asrec` or `--blanket` in one message, and prose ratification beside either (L25, R6).
- **Same-message ratification:** a `--ratify` in the same message as `--dispatch-ok`/`--merge-ok` satisfies none of their checks (L122, L131).
- **`--asrec` and `--blanket`:** `--asrec` cannot answer a lift question or a gate, and no quick flag lifts anything (L225, T2). `--blanket` cannot answer a stop report.
- **`--resume`:** slug and ownership handled at L163–167.
- **Stop paths:** `--dry`/`--halt` and the pending wakeup.
- **Inert messages:** provisional honouring.
- **Forged lines:** a forged line naming another quick flag "grants nothing"; an edited line can at most drop a restriction.

## Findings

| ID | Sev | Class | Finding and evidence | Suggested disposition |
|---|---|---|---|---|
| N-1 | LOW | Fail-open (a stored restriction is lost on owner change); a gap in the K-1 ruling, not a missed instance | **Rules:** Reading (L226) requires "the owner's working copy". The Writer writes the integration-branch copy only "if different, in its checkout" (L225).<br>**This goal:** the ownership block records only a session ID (`loop-directive.md:4`). The live directive sits on `qf-p1`, and `feat/foreman-line-quick-flags` has no worktree.<br>**Path:** a successor that cannot find the prior owner's working copy has no fail-closed default (GATES has "Any doubt: refuse"; Reading has nothing similar), so a later `--blanket` passes a missed `--strict`. Separately, (3) "that has no line" and the re-issue rule "whose line exists" are not limited to copies the new owner may write. A line held only in a prior owner's worktree is therefore never re-written, and is lost at Stage F cleanup.<br>**Bound:** this is the same discovery limit canon has for the ownership block (session-relative path, `SKILL.md:13`). | Change (3) and the re-issue rule to "…has no line in a copy it may write". Forward "the ownership block names the owner's working copy" to QF-P2. Accepting as documented is also reasonable. |
| N-2 | LOW | Fail-open by a mistaken lift | **Rule:** L225 "names the quick flag (and the parcel, for `--review2` when more than one `--review2` line exists)", together with "removes only lines whose own (first-field) quick flag is lifted".<br>**Path:** with a single `--review2` line for QF-P3, "lift `--review2` for QF-P2" literally meets both conditions and removes the QF-P3 line. The remaining-line test checks only "the lifted parcel", so nothing is reported. | Add: "a lift naming a parcel removes only `--review2` lines for that parcel; a mismatch is ambiguous". |
| N-3 | LOW | Temporal deadlock (fails closed) | **Path:** some lines Reading honours can never be removed by any lift:<br>• `- **--strict** \| …` (the first field is not the token);<br>• ``- `--blanket` --strict \| …`` (`--blanket` cannot be lifted);<br>• an unreadable-parcel `--review2` line when more than one `--review2` line exists (the lift must name a parcel that cannot be read).<br>While such a line remains, "that restriction stays", so the lifted quick flag can never be cleared without a hand edit.<br>**Contradiction:** Lifetime and T3 say every line lasts "until a human-typed lift". | Accept as documented, or let a lift remove any line that Reading honours only as quick flags the message lifts. |
| N-4 | LOW | Bounded contradiction from hostile input | **Rule:** `--ratify` (b) excludes "its `Active restrictions` entry" (L111). The entry runs from the `Active restrictions:` line to the first line not starting with `- ` (L216).<br>**Path:** an `Active restrictions:` line inserted above bulleted charter text pulls that text into the "entry", so edits to it after the presenting turn no longer fail (b).<br>**Bound:** the gate record names the shown revision, GATES compares Parcels rows against it, and the presented parts here are tables, which cannot fall inside the entry. | Limit the exclusion to restriction lines (first field a restrictive token), or accept as documented. |
| N-5 | LOW | Rule ID contradicts the entries | The GATES rule-ID text (L276) reads records "in every copy the session reads". Both entries (L122, L131) also require "the checkout of the ratified charter's Branch" and "(the owner's working copy included)", so the closed-set definition is weaker than the entries that cite it. Fails closed, because the entries govern. | Align the L276 wording, e.g. "in the copies the entries name". |

**Wording nits:**
- L111 "otherwise the amendment text" is now unreachable, since every `--ratify` is a Gate 1 ratification.
- Decision-log entries made before the loop directive exists are never carried into "the loop directive's decision log" (D10′ read literally).
- A lift after Gate 1 of a line still held in the charter's entry edits `charter.md`. This triggers the GATES "uncommitted changes" refusal until it is committed (fails closed).
- The scope of a malformed `--nopush` line with a parcel scope ("restricts as each") is unstated.
- GATES reads the gate record "in the checkout of the ratified charter's Branch", which the gate record itself defines (circular; "Any doubt: refuse" covers it).

**Git control:** `git status --short` is empty and HEAD is unchanged at `bad7ae41`. My private `mktemp -d` scratch directory has been removed, and I changed nothing in the repo.

**Verdict: ACCEPT.** The five LOW findings are listed above; none is a BLOCKER, HIGH or MEDIUM.
