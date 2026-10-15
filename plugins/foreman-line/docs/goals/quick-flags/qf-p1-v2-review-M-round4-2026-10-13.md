# Reviewer M: QF-P1 v2 round 4, `plugins/foreman-line/docs/QUICK-FLAGS.md` at HEAD `bad7ae41` (rework commit `f985f4cc`)

**Verdict: ACCEPT.** I found no BLOCKER, HIGH or MEDIUM, only four LOW items. No quick flag, alone or combined with others, waives any item in the §3 list. All round-3 IDs and rulings C1–C11 are closed, and every instance has been fixed. The four LOW items are listed below.

## Verification Plan

I ran the checks against base `521f774a` and the rework base `468347b0`.

| # | Result |
|---|---|
| 1 | `1`; 346 lines (cap 370) |
| 2 | `14`; awk prints `0` |
| 3 | The 14 rows match the AC-2 table exactly; the closed-list count is `7` |
| 4 | V1–V7: `1` each |
| 5 | `1`; the only alias line is ``Aliases: `--blanke` `` |
| 6 | `diff` shows the output is identical to the spec's 21 pinned rows, followed by `rows 55 ok` |
| 7 | `0` |
| 8 | Only L35 matches; "flagged" appears 0 times |
| 9 | Only `QUICK-FLAGS.md` changed against both bases; no untracked files; `git diff --check` is clean |

**Mutation tests (scratch copies):**
- Changing the Winner on `--dry`×`--halt`: caught by VP6.
- Changing a `Gate interplay:` value: caught by VP3.
- Undoing the case-insensitive part of K-4: not caught.
- Removing the L-5 exemption from condition (b): not caught.
- The last two misses are prose-only and fall under the accepted G-11/H-9 checker gap.

## Closure of round-3 IDs and rulings C1–C11

| ID | Status | Evidence |
|---|---|---|
| K-1, L-1 | Closed (a residue remains, M-1) | L225 Writer: "in every copy it may write under canon (its own checkouts): the loop directive in its working copy and, if different, in its checkout of the integration branch". L226 Reading: "at the Writer's location and in every other copy it reads (the owner's working copy included…)". The revision tie is gone. |
| K-2, L-5 | Closed | L228: "after Gate 1, in one in `restrictions.md`… a goal record and not charter text". L111 condition (b): "unchanged since that turn outside its `Active restrictions` entry" |
| K-3, L-2 | Closed, in its only instance | L276: "`--dispatch-ok` and `--merge-ok` are refused in a session that is not the goal's owner". "gate quick flag" appears only at L25 (the definition) and L27/L276 ("human's own act"), which is correct. |
| K-4, L-3 | Closed | L60: "A word whose result is only dashes… whose result, compared case-insensitively, equals or begins with…". A literal implementation flags `-- Dry`, `(— halt.`, `(-- halt)` and `— HALT`. |
| K-5 | Closed (wording gap, M-2) | L225: "…whose text outside `message:` contains no restrictive quick flag (or variant) the message does not lift; if any remaining line, in any scope…" |
| K-7, L-6 | Closed | L225: "removes it from every copy it may write; any other copy is reported, not edited, and still restricts" |
| L-7 | Closed | L25 defines "gate quick flag", "ties", "ratified charter" and "last" (gate-record entry order). L120, L122 and L131 now cite §3. |
| K-6, L-4, L-8 | Accepted as documented | No text was required |
| Nit (presented text at re-open) | Closed | L111: "for a Gate 1 ratification, including one re-opened by triage, the charter's decision list and Parcels table, with any amendment text" |
| C1 | Closed | L60 uses "result" |
| C2 | Closed | L225: "(for `--review2`, one for the lifted parcel or with an unreadable parcel)" |
| C3 | Closed | L225: "…no restrictive quick flag… the message does not lift" |
| C4, C5 | Closed | L228: "until it exists, the owner is the session that started `/goal <concept>`… Each is read as a copy… until the owner carries its lines" |
| C6 | Closed | L244: "a decision-log section of the file where §9 then places restriction lines" |
| C7 | Closed | L111 |
| C8–C11 | Accepted as documented | No text required |

**Regression sweep:**
- The GATES clause is byte-identical in L122 and L131.
- No reference to the retired machinery dangles. The remaining hits are V5 "voids", V6 "revoked", "revokes nothing" and the §3 "blob hash" definition. That definition concerns ratification evidence, not pinning.
- No cell or labelled line contains a stray `|`.

## AC trace

- All 24 ACs pass once the binding rulings are applied, and V1–V7 are verbatim (L21, L23, L29 twice, L120, L31, L41).
- The superseded AC text is replaced as the rulings direct:
  - AC-19's location, field order and lifetime: C8/C3/round-3 rulings → L216–229.
  - AC-20 Stage Zero: C6 → L244.
  - AC-15 GATES: C4 and rulings 3a/3b → L122/L131.
- **Conflict table:** all 55 rows agree with each entry's Conflicts line, and 91 − 55 = 36 OBS pairs.
- **Temporal order:** a malformed or multi-name line can block a lift, but every such deadlock leaves the restriction in force, so none fails open.

**Waiver probes, all blocked:**
- File, pasted, code-span and expanded-skill tokens.
- Aliases, repeats and variants.
- Limiting prose.
- `--ratify` beside `--asrec`/`--blanket`, in one message and across messages.
- Same-message `--ratify` feeding `--merge-ok`/`--dispatch-ok`.
- The new (b) exemption: a ratification still binds to the revision shown, and GATES compares rows against the tied revision.
- `--resume` without a slug, or against a live owner.
- `--dry`/`--halt` stop writes and the pending wakeup.
- A lift in an inert message, or a lift sent with `--blanket`.
- Forged lines: they grant nothing.

## Findings

| ID | Sev | Class | Finding and evidence | Suggested disposition |
|---|---|---|---|---|
| M-1 | LOW | Fail-open (a restriction can be lost; residue of K-1) | **Rules:** the Writer's location (L225) and the Reading clause "the owner's working copy" (L226) are both relative to the owner. "its checkout of the integration branch" assumes one exists, and none does for this goal (`git worktree list` shows no `feat/foreman-line-quick-flags`). The ownership block names a session ID, not a path (`loop-directive.md:4`), and resume reads `${CLAUDE_PLUGIN_ROOT}` (`SKILL.md:13`).<br>**Path:**<br>1. Owner S1, working in worktree A, writes `--strict` only in A.<br>2. S2 resumes from checkout C. It cannot locate A and reads C, which has no line.<br>3. S2 then accepts `--blanket` (L95: "while a `--strict` line is in force").<br>**Gap:** GATES has "Any doubt: refuse"; Reading has no equivalent clause for "cannot locate the location".<br>**Why LOW:** a restriction can only be lost, never added, and the residue comes from canon's single-copy ownership model. Canon's own live-owner check has the same weakness. | Add one clause: "a session that cannot read the Writer's location stops and reports". Or forward to QF-P2 so the ownership block names the owner's working copy. Or accept as documented under D5″. |
| M-2 | LOW | Mechanical gap; contradicts a naive reading | **The gap:** in the L225 removal rule ("lines whose own (first-field) quick flag is lifted and…"), nothing requires a `--review2` line's parcel to match the parcel the lift names. The parcel appears only through "names the quick flag (and the parcel…)".<br>**Naive result:** a lift naming QF-P2 also removes the QF-P3 line and any line with an unreadable parcel. That contradicts the same sentence's clause "(…for the lifted parcel or with an unreadable parcel)", which assumes those lines remain, and contradicts C2.<br>**Careful reading:** if "the parcel" means each line's own parcel, the text blocks this. A QF-P3 check cannot test that. | Append: "and, for `--review2`, whose parcel is the one the lift names (any, when it names none and only one `--review2` line exists)". |
| M-3 | LOW | Fail-open for an intended restrictive quick flag (input residue) | **The gap:** the L60 variant rule applies no compatibility normalization, and `ー`/`ｰ` (U+30FC, U+FF70) are not in its dash set.<br>**Escapes:** a literal implementation on scratch input classifies `－－ｄｒｙ` (fullwidth dashes and letters from an IME), `ーーdry` and `—dгy` (Cyrillic г) as neither a token (§4 needs ASCII `--`) nor a variant.<br>**Effect:** in `－－ｄｒｙ --merge-ok QF-P1` the merge goes ahead. | Apply NFKC and case folding before comparing, and add U+30FC/U+FF70 to the dash set. Or accept as documented beside §4's unmarked-input residual. |
| M-4 | LOW | Mechanical gap | **The rule:** the entry is "the lines after it up to the first line not starting with `- `" (L216), and condition (b) now exempts that entry (L111).<br>**Over-inclusion:** in `charter.md`, a `- ` list placed directly after `Active restrictions:` is exempt from (b).<br>**Under-inclusion:** a blank line after the label leaves every restriction line outside the entry (dropped-line class, already accepted).<br>**Bounded:** a ratification ties to the revision shown, and GATES compares rows against the tied revision. | Limit the (b) exemption to restriction lines (first field a backticked quick-flag token), or require the entry to have nothing else in its section. |

**Wording nits:**
- §6, STOP, `--halt` and `--dry` say "updates the ownership block" before the loop directive exists, when there is no block yet.
- "more than one `--review2` line exists" does not say whether it counts within one copy or across all copies.
- Reading's "(or a variant)" applies §5's word-level rule to file lines without saying so.
- Bullets like "- Explain…" or "- Halt…" trigger the variant rule. This falls under the accepted fail-closed cost.

**Git control:** `git status --short` is empty and HEAD is unchanged (`bad7ae41`). I used only a private `mktemp -d` directory, now removed, and wrote, edited or committed nothing in the repo.

**Verdict: ACCEPT**, with M-1 to M-4 recorded as LOW.
